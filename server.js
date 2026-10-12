import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { PDFDocument } from 'pdf-lib';
import { isEncrypted, decryptPDF } from '@pdfsmaller/pdf-decrypt';
import { WebSocketServer } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.post('/api/merge-pdf', async (req, res) => {
  try {
    const { files = [] } = req.body;
    if (!Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: '没有提供需要合并的PDF文件' });
    }

    const mergedDoc = await PDFDocument.create();

    for (let fIdx = 0; fIdx < files.length; fIdx++) {
      const item = files[fIdx];
      if (!item || !item.data) continue;

      const rawBuffer = Buffer.from(item.data, 'base64');
      let bytes = new Uint8Array(rawBuffer);

      try {
        const encInfo = await isEncrypted(bytes);
        if (encInfo && encInfo.encrypted) {
          try {
            bytes = await decryptPDF(bytes, '');
          } catch (decErr) {
            console.warn('[PDF合并] 解密提示:', decErr.message);
          }
        }
      } catch (checkErr) {
        console.warn('[PDF合并] 加密检测跳过:', checkErr.message);
      }

      let donor = null;
      try {
        donor = await PDFDocument.load(bytes, {
          ignoreEncryption: true,
          throwOnInvalidObject: false,
          updateMetadata: false,
          capNumbers: true
        });
      } catch (loadErr) {
        let trimmedBytes = bytes;
        for (let b = 0; b < Math.min(bytes.length - 4, 2048); b++) {
          if (bytes[b] === 0x25 && bytes[b + 1] === 0x50 && bytes[b + 2] === 0x44 && bytes[b + 3] === 0x46 && bytes[b + 4] === 0x2D) {
            trimmedBytes = bytes.subarray(b);
            break;
          }
        }
        donor = await PDFDocument.load(trimmedBytes, {
          ignoreEncryption: true,
          throwOnInvalidObject: false,
          updateMetadata: false,
          capNumbers: true
        });
      }

      if (donor) {
        const indices = donor.getPageIndices();
        let copiedAll = false;
        try {
          const copied = await mergedDoc.copyPages(donor, indices);
          for (const page of copied) {
            mergedDoc.addPage(page);
          }
          copiedAll = true;
        } catch (batchErr) {
          console.warn('[PDF合并] 批量页面复制提示，改为逐页复制:', batchErr.message);
        }

        if (!copiedAll) {
          for (let p = 0; p < indices.length; p++) {
            const pageIndex = indices[p];
            try {
              const [singlePage] = await mergedDoc.copyPages(donor, [pageIndex]);
              mergedDoc.addPage(singlePage);
            } catch (singleErr) {
              try {
                const donorPage = donor.getPage(pageIndex);
                const [embedded] = await mergedDoc.embedPages([donorPage]);
                const newPage = mergedDoc.addPage([embedded.width, embedded.height]);
                newPage.drawPage(embedded);
              } catch (embedErr) {
                console.warn(`[PDF合并] 第 ${fIdx + 1} 个文件第 ${p + 1} 页复制异常:`, embedErr.message);
              }
            }
          }
        }
      }
    }

    if (mergedDoc.getPageCount() === 0) {
      return res.status(400).json({ error: '合并结果为空，请检查文件是否为有效PDF' });
    }

    const outputBytes = await mergedDoc.save({ useObjectStreams: false });
    const base64Out = Buffer.from(outputBytes).toString('base64');
    return res.json({ success: true, pdfBase64: base64Out, pageCount: mergedDoc.getPageCount() });
  } catch (err) {
    console.error('PDF合并错误:', err);
    return res.status(500).json({ error: err.message || 'PDF合并处理失败' });
  }
});

// Forward proxy for AI requests to prevent browser CORS and network failures
app.post('/api/proxy', async (req, res) => {
  try {
    const { url, method = 'POST', headers = {}, body } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'Missing target url' });
    }

    const fetchHeaders = { ...headers };
    delete fetchHeaders['host'];
    delete fetchHeaders['origin'];
    delete fetchHeaders['referer'];

    const fetchOptions = {
      method,
      headers: fetchHeaders
    };

    if (body !== undefined && method !== 'GET' && method !== 'HEAD') {
      fetchOptions.body = typeof body === 'object' ? JSON.stringify(body) : body;
    }

    const response = await fetch(url, fetchOptions);
    const contentType = response.headers.get('content-type') || '';
    res.status(response.status);

    if (contentType.includes('application/json')) {
      const data = await response.json();
      return res.json(data);
    } else {
      const text = await response.text();
      return res.send(text);
    }
  } catch (err) {
    console.error('Proxy request error:', err);
    res.status(500).json({ error: err.message || 'Proxy request failed' });
  }
});

// Peer connections map: peerId -> Set of ws
const peers = new Map();
// Room connections map: roomId -> Set of ws
const rooms = new Map();
// Mailbox for peer messages: peerId -> Array of { id, time, packet }
const peerMailbox = new Map();

function enqueuePeerMessage(targetPeerId, packet) {
  if (!peerMailbox.has(targetPeerId)) {
    peerMailbox.set(targetPeerId, []);
  }
  const queue = peerMailbox.get(targetPeerId);
  const msgObj = {
    id: 'msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
    time: Date.now(),
    packet
  };
  queue.push(msgObj);
  if (queue.length > 100) queue.shift();
  return msgObj;
}

function deliverToPeerSockets(targetPeerId, packet) {
  const targetSockets = peers.get(targetPeerId);
  let delivered = false;
  if (targetSockets && targetSockets.size > 0) {
    targetSockets.forEach((s) => {
      if (s.readyState === 1) {
        s.send(packet);
        delivered = true;
      }
    });
  }
  return delivered;
}

// HTTP Sync endpoints for fallback and robust polling
app.post('/api/sync/register', (req, res) => {
  const { peerId: rawPeerId } = req.body || {};
  if (!rawPeerId) {
    return res.status(400).json({ error: 'Missing peerId' });
  }
  const peerId = String(rawPeerId).trim().toUpperCase();
  const queued = peerMailbox.get(peerId) || [];
  const messages = queued.map(item => item.packet);
  peerMailbox.delete(peerId);
  return res.json({ success: true, peerId, messages });
});

app.post('/api/sync/send', (req, res) => {
  const { targetPeerId: rawTarget, fromPeerId: rawFrom, payload } = req.body || {};
  if (!rawTarget || !payload) {
    return res.status(400).json({ error: 'Missing targetPeerId or payload' });
  }
  const targetPeerId = String(rawTarget).trim().toUpperCase();
  const fromPeerId = String(rawFrom || '').trim().toUpperCase();
  const packet = JSON.stringify({
    type: 'receive_peer',
    fromPeerId,
    payload
  });

  enqueuePeerMessage(targetPeerId, packet);
  const delivered = deliverToPeerSockets(targetPeerId, packet);
  return res.json({ success: true, targetPeerId, delivered });
});

app.get('/api/sync/poll', (req, res) => {
  const rawPeerId = req.query.peerId;
  if (!rawPeerId) {
    return res.status(400).json({ error: 'Missing peerId' });
  }
  const peerId = String(rawPeerId).trim().toUpperCase();
  const queued = peerMailbox.get(peerId) || [];
  const messages = queued.map(item => item.packet);
  peerMailbox.delete(peerId);
  return res.json({ success: true, peerId, messages });
});

app.use(express.static(__dirname));

// Client-side fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const httpServer = http.createServer(app);
const wss = new WebSocketServer({ server: httpServer });


wss.on('connection', (ws) => {
  let boundPeerId = null;
  const boundRooms = new Set();

  ws.isAlive = true;
  ws.on('pong', () => {
    ws.isAlive = true;
  });

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (!msg || !msg.type) return;

      if (msg.type === 'register') {
        const rawPeerId = msg.peerId;
        if (!rawPeerId) return;
        const peerId = String(rawPeerId).trim().toUpperCase();
        boundPeerId = peerId;
        if (!peers.has(peerId)) {
          peers.set(peerId, new Set());
        }
        peers.get(peerId).add(ws);
        ws.send(JSON.stringify({ type: 'registered', peerId, success: true }));

        // 投递离线暂存给该用户的消息
        if (peerMailbox.has(peerId)) {
          const queued = peerMailbox.get(peerId) || [];
          queued.forEach((item) => {
            if (ws.readyState === 1) {
              ws.send(item.packet);
            }
          });
          peerMailbox.delete(peerId);
        }
      } else if (msg.type === 'join_room') {
        const { roomId, peerId } = msg;
        if (!roomId) return;
        boundRooms.add(roomId);
        if (!rooms.has(roomId)) {
          rooms.set(roomId, new Set());
        }
        rooms.get(roomId).add(ws);
        ws.send(JSON.stringify({ type: 'room_joined', roomId, success: true }));
      } else if (msg.type === 'send_peer') {
        const { targetPeerId: rawTarget, payload } = msg;
        if (!rawTarget) return;
        const targetPeerId = String(rawTarget).trim().toUpperCase();
        const fromPeerId = String(boundPeerId || msg.fromPeerId || msg.peerId || '').trim().toUpperCase();
        const packet = JSON.stringify({
          type: 'receive_peer',
          fromPeerId,
          payload
        });

        enqueuePeerMessage(targetPeerId, packet);
        const delivered = deliverToPeerSockets(targetPeerId, packet);

        if (ws.readyState === 1) {
          ws.send(JSON.stringify({
            type: 'peer_sent_ack',
            targetPeerId,
            delivered,
            action: payload && payload.action ? payload.action : ''
          }));
        }
      } else if (msg.type === 'send_room') {
        const { roomId, payload } = msg;
        if (!roomId) return;
        const roomSockets = rooms.get(roomId);
        if (roomSockets && roomSockets.size > 0) {
          const packet = JSON.stringify({
            type: 'receive_room',
            roomId,
            fromPeerId: boundPeerId,
            payload
          });
          roomSockets.forEach((s) => {
            if (s !== ws && s.readyState === 1) {
              s.send(packet);
            }
          });
        }
      }
    } catch (err) {
      console.warn('[WS] 消息解析异常:', err.message);
    }
  });

  ws.on('close', () => {
    if (boundPeerId && peers.has(boundPeerId)) {
      const set = peers.get(boundPeerId);
      set.delete(ws);
      if (set.size === 0) peers.delete(boundPeerId);
    }
    boundRooms.forEach((rId) => {
      if (rooms.has(rId)) {
        const set = rooms.get(rId);
        set.delete(ws);
        if (set.size === 0) rooms.delete(rId);
      }
    });
  });
});

const heartbeatInterval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('close', () => {
  clearInterval(heartbeatInterval);
});

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
});

