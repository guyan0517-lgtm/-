import fs from 'fs';
import http from 'http';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';
import { PDFDocument } from 'pdf-lib';
import { isEncrypted, decryptPDF } from '@pdfsmaller/pdf-decrypt';

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

// Peer communication hub and offline mailbox
const MAILBOX_STORE_PATH = path.join(__dirname, '.peer-mailbox-store.json');
const peerClients = new Map();
const peerMailboxes = new Map();
const peerProfiles = new Map();

function loadMailboxStoreFromDisk() {
  try {
    if (fs.existsSync(MAILBOX_STORE_PATH)) {
      const raw = fs.readFileSync(MAILBOX_STORE_PATH, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && parsed.mailboxes && typeof parsed.mailboxes === 'object') {
        for (const [k, v] of Object.entries(parsed.mailboxes)) {
          if (Array.isArray(v)) peerMailboxes.set(k, v);
        }
      }
      if (parsed && parsed.profiles && typeof parsed.profiles === 'object') {
        for (const [k, v] of Object.entries(parsed.profiles)) {
          if (v && typeof v === 'object') peerProfiles.set(k, v);
        }
      }
    }
  } catch (e) {
    console.warn('[PeerStore] Load warning:', e.message);
  }
}

let saveStoreTimer = null;
function scheduleSaveMailboxStore() {
  if (saveStoreTimer) clearTimeout(saveStoreTimer);
  saveStoreTimer = setTimeout(() => {
    try {
      const mailboxesObj = {};
      for (const [k, v] of peerMailboxes.entries()) {
        if (Array.isArray(v) && v.length > 0) {
          mailboxesObj[k] = v;
        }
      }
      const profilesObj = {};
      for (const [k, v] of peerProfiles.entries()) {
        profilesObj[k] = v;
      }
      fs.writeFileSync(MAILBOX_STORE_PATH, JSON.stringify({ mailboxes: mailboxesObj, profiles: profilesObj }), 'utf8');
    } catch (e) {
      console.warn('[PeerStore] Save warning:', e.message);
    }
  }, 200);
}

loadMailboxStoreFromDisk();

function pushToMailbox(code, event) {
  if (!code || !event) return;
  if (!peerMailboxes.has(code)) {
    peerMailboxes.set(code, []);
  }
  const box = peerMailboxes.get(code);
  if (event.eventId && box.some(item => item && item.eventId === event.eventId)) {
    return;
  }
  box.push(event);
  if (box.length > 200) {
    box.shift();
  }
  scheduleSaveMailboxStore();
}

function ackFromMailbox(code, eventIds) {
  if (!code || !Array.isArray(eventIds) || eventIds.length === 0) return;
  if (!peerMailboxes.has(code)) return;
  const idSet = new Set(eventIds);
  const box = peerMailboxes.get(code) || [];
  const filtered = box.filter(item => !item || !item.eventId || !idSet.has(item.eventId));
  peerMailboxes.set(code, filtered);
  scheduleSaveMailboxStore();
}

function sendToPeerWs(code, event) {
  const clients = peerClients.get(code);
  let delivered = false;
  if (clients && clients.size > 0) {
    const payload = JSON.stringify(event);
    for (const ws of clients) {
      if (ws.readyState === 1) {
        ws.send(payload);
        delivered = true;
      }
    }
  }
  return delivered;
}

app.post('/api/peer/register', (req, res) => {
  const { peerCode, name, avatar, myAvatarFrame } = req.body;
  if (!peerCode) return res.status(400).json({ error: 'Missing peerCode' });
  peerProfiles.set(peerCode, { name, avatar, myAvatarFrame, lastSeen: Date.now() });
  scheduleSaveMailboxStore();
  return res.json({ success: true });
});

app.post('/api/peer/send', (req, res) => {
  const body = req.body || {};
  const {
    type = 'message',
    eventId,
    ackEventId,
    fromCode,
    toCode,
    content,
    msgType,
    audioData,
    audioDuration,
    meaning,
    isPeerOnlySticker,
    senderName,
    senderAvatar,
    senderAvatarFrame,
    peerAvatarFrame,
    timestamp
  } = body;
  if (!toCode) return res.status(400).json({ error: 'Missing target' });

  if (type === 'peer_ack') {
    const ackEvt = {
      type: 'peer_ack',
      eventId: eventId || ('evt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)),
      ackEventId,
      fromCode,
      toCode,
      timestamp: Date.now()
    };
    sendToPeerWs(toCode, ackEvt);
    pushToMailbox(toCode, ackEvt);
    return res.json({ success: true });
  }

  if (type === 'online_ping') {
    const pingEvt = {
      type: 'online_ping',
      eventId: eventId || ('ping_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)),
      fromCode,
      toCode,
      timestamp: Date.now()
    };
    sendToPeerWs(toCode, pingEvt);
    return res.json({ success: true });
  }

  if (type !== 'message') {
    const customEvent = {
      ...body,
      type,
      eventId: eventId || ('evt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)),
      timestamp: timestamp || Date.now()
    };
    const delivered = sendToPeerWs(toCode, customEvent);
    pushToMailbox(toCode, customEvent);
    return res.json({ success: true, delivered });
  }

  if (!content && !audioData) return res.status(400).json({ error: 'Missing content' });
  const event = {
    ...body,
    type: 'message',
    eventId: eventId || ('evt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)),
    fromCode,
    toCode,
    content: content || '[语音消息]',
    msgType: msgType || 'text',
    meaning: meaning || '',
    isPeerOnlySticker: Boolean(isPeerOnlySticker),
    audioData: audioData || '',
    audioDuration: audioDuration || 0,
    senderName,
    senderAvatar,
    senderAvatarFrame: senderAvatarFrame || '',
    peerAvatarFrame: peerAvatarFrame || '',
    timestamp: timestamp || Date.now()
  };
  const delivered = sendToPeerWs(toCode, event);
  pushToMailbox(toCode, event);
  return res.json({ success: true, delivered });
});

app.post('/api/peer/profile', (req, res) => {
  const { eventId, peerCode, name, avatar, myAvatarFrame, peerAvatarFrame, targetCodes = [] } = req.body;
  if (!peerCode) return res.status(400).json({ error: 'Missing peerCode' });
  peerProfiles.set(peerCode, { name, avatar, myAvatarFrame, lastSeen: Date.now() });
  scheduleSaveMailboxStore();
  const event = {
    type: 'profile_update',
    eventId: eventId || ('evt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)),
    peerCode,
    name,
    avatar,
    myAvatarFrame: myAvatarFrame !== undefined ? myAvatarFrame : undefined,
    peerAvatarFrame: peerAvatarFrame !== undefined ? peerAvatarFrame : undefined,
    timestamp: Date.now()
  };
  if (Array.isArray(targetCodes)) {
    for (const target of targetCodes) {
      sendToPeerWs(target, event);
      pushToMailbox(target, event);
    }
  }
  return res.json({ success: true });
});

app.post('/api/peer/request', (req, res) => {
  const { type = 'friend_request', eventId, fromCode, toCode, fromName, fromAvatar, fromAvatarFrame } = req.body;
  if (!toCode) return res.status(400).json({ error: 'Missing target' });
  const event = {
    type: type === 'friend_accept' ? 'friend_accept' : 'friend_request',
    eventId: eventId || ('evt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)),
    fromCode,
    toCode,
    fromName,
    fromAvatar,
    fromAvatarFrame: fromAvatarFrame || '',
    timestamp: Date.now()
  };
  sendToPeerWs(toCode, event);
  pushToMailbox(toCode, event);
  return res.json({ success: true });
});

app.post('/api/peer/ack', (req, res) => {
  const { peerCode, eventIds = [] } = req.body;
  if (!peerCode) return res.status(400).json({ error: 'Missing peerCode' });
  ackFromMailbox(peerCode, eventIds);
  return res.json({ success: true });
});

app.get('/api/peer/poll', (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).json({ error: 'Missing code' });
  const events = peerMailboxes.get(code) || [];
  const profile = peerProfiles.get(code) || null;
  return res.json({ success: true, events, profile });
});

app.use(express.static(__dirname));

// Client-side fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  let boundCode = null;

  ws.on('message', (raw) => {
    try {
      const data = JSON.parse(raw);
      if (data.type === 'register') {
        boundCode = data.peerCode;
        if (boundCode) {
          if (!peerClients.has(boundCode)) {
            peerClients.set(boundCode, new Set());
          }
          peerClients.get(boundCode).add(ws);
          if (data.name || data.avatar) {
            peerProfiles.set(boundCode, {
              name: data.name,
              avatar: data.avatar,
              myAvatarFrame: data.myAvatarFrame || '',
              lastSeen: Date.now()
            });
            scheduleSaveMailboxStore();
          }
          const box = peerMailboxes.get(boundCode) || [];
          if (box.length > 0) {
            box.forEach(evt => ws.send(JSON.stringify(evt)));
          }
        }
      } else if (data.type === 'ack') {
        const targetCode = data.peerCode || boundCode;
        if (targetCode && Array.isArray(data.eventIds)) {
          ackFromMailbox(targetCode, data.eventIds);
        }
      } else if (data.type === 'peer_ack') {
        const { eventId, ackEventId, fromCode, toCode } = data;
        if (toCode) {
          const ackEvt = {
            type: 'peer_ack',
            eventId: eventId || ('evt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)),
            ackEventId,
            fromCode,
            toCode,
            timestamp: Date.now()
          };
          sendToPeerWs(toCode, ackEvt);
          pushToMailbox(toCode, ackEvt);
        }
      } else if (data.type === 'message') {
        const {
          eventId,
          fromCode,
          toCode,
          content,
          msgType,
          audioData,
          audioDuration,
          senderName,
          senderAvatar,
          senderAvatarFrame,
          peerAvatarFrame,
          timestamp
        } = data;
        if (toCode) {
          const event = {
            type: 'message',
            eventId: eventId || ('evt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)),
            fromCode,
            toCode,
            content: content || '[语音消息]',
            msgType: msgType || 'text',
            audioData: audioData || '',
            audioDuration: audioDuration || 0,
            senderName,
            senderAvatar,
            senderAvatarFrame: senderAvatarFrame || '',
            peerAvatarFrame: peerAvatarFrame || '',
            timestamp: timestamp || Date.now()
          };
          sendToPeerWs(toCode, event);
          pushToMailbox(toCode, event);
        }
      } else if (data.type === 'profile_update') {
        const { eventId, peerCode, name, avatar, myAvatarFrame, peerAvatarFrame, targetCodes = [] } = data;
        peerProfiles.set(peerCode, { name, avatar, myAvatarFrame, lastSeen: Date.now() });
        scheduleSaveMailboxStore();
        const event = {
          type: 'profile_update',
          eventId: eventId || ('evt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)),
          peerCode,
          name,
          avatar,
          myAvatarFrame: myAvatarFrame !== undefined ? myAvatarFrame : undefined,
          peerAvatarFrame: peerAvatarFrame !== undefined ? peerAvatarFrame : undefined,
          timestamp: Date.now()
        };
        if (Array.isArray(targetCodes)) {
          targetCodes.forEach(target => {
            sendToPeerWs(target, event);
            pushToMailbox(target, event);
          });
        }
      } else if (data.type === 'friend_request' || data.type === 'friend_accept') {
        const { eventId, fromCode, toCode, fromName, fromAvatar, fromAvatarFrame } = data;
        const event = {
          type: data.type,
          eventId: eventId || ('evt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)),
          fromCode,
          toCode,
          fromName,
          fromAvatar,
          fromAvatarFrame: fromAvatarFrame || '',
          timestamp: Date.now()
        };
        sendToPeerWs(toCode, event);
        pushToMailbox(toCode, event);
      } else if (data.toCode) {
        const customEvent = {
          ...data,
          eventId: data.eventId || ('evt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)),
          timestamp: data.timestamp || Date.now()
        };
        sendToPeerWs(data.toCode, customEvent);
        pushToMailbox(data.toCode, customEvent);
      }
    } catch (e) {
      console.warn('[WS] Parse error:', e.message);
    }
  });

  ws.on('close', () => {
    if (boundCode && peerClients.has(boundCode)) {
      peerClients.get(boundCode).delete(ws);
      if (peerClients.get(boundCode).size === 0) {
        peerClients.delete(boundCode);
      }
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
});

