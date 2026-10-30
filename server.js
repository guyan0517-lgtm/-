import fs from 'fs';
import http from 'http';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
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

app.post('/api/upload-image-bed', async (req, res) => {
  try {
    const { dataUrl, filename = 'sticker.png' } = req.body || {};
    if (!dataUrl || typeof dataUrl !== 'string') {
      return res.status(400).json({ error: '缺少图片数据' });
    }

    let mimeType = 'image/png';
    let base64Data = dataUrl;
    const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (match) {
      mimeType = match[1];
      base64Data = match[2];
    } else if (dataUrl.includes(',')) {
      base64Data = dataUrl.split(',')[1];
    }

    const extMap = {
      'image/png': 'png',
      'image/gif': 'gif',
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/webp': 'webp'
    };
    const ext = extMap[mimeType] || 'png';
    let safeName = String(filename || 'sticker').replace(/[^a-zA-Z0-9._-]/g, '_');
    if (!/\.[a-zA-Z0-9]+$/.test(safeName)) {
      safeName += '.' + ext;
    }

    const buffer = Buffer.from(base64Data, 'base64');
    const blob = new Blob([buffer], { type: mimeType });
    const form = new FormData();
    form.append('gallery', '');
    form.append('optsize', '0');
    form.append('expire', '0');
    form.append('numfiles', '1');
    form.append('upload_session', String(Date.now()) + Math.random().toString().substring(1));
    form.append('file', blob, safeName);

    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
    const upRes = await fetch('https://postimages.org/json', {
      method: 'POST',
      headers: {
        'User-Agent': ua,
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': 'https://postimages.org/'
      },
      body: form
    });

    if (!upRes.ok) {
      return res.status(502).json({ error: '图床上传请求失败: ' + upRes.status });
    }

    const upJson = await upRes.json();
    const pageUrl = upJson && (upJson.url || upJson.image);
    if (!pageUrl) {
      return res.status(502).json({ error: '图床未返回有效页面地址' });
    }

    const galRes = await fetch(pageUrl, {
      headers: { 'User-Agent': ua }
    });
    const galHtml = await galRes.text();
    const ogMatch = galHtml.match(/property=["']og:image["']\s+content=["'](https:\/\/i\.postimg\.cc\/[^"']+)["']/i)
      || galHtml.match(/content=["'](https:\/\/i\.postimg\.cc\/[^"']+)["']\s+property=["']og:image["']/i);
    const directMatch = ogMatch ? [null, ogMatch[1]] : galHtml.match(/(https:\/\/i\.postimg\.cc\/[^\s"'<>)\]]+)/i);
    const finalUrl = directMatch && directMatch[1] ? directMatch[1] : pageUrl;

    return res.json({ success: true, url: finalUrl });
  } catch (err) {
    console.error('图床上传错误:', err);
    return res.status(500).json({ error: err.message || '图床上传失败' });
  }
});

app.post('/api/webdav-proxy', async (req, res) => {
  try {
    const { url, method = 'GET', username = '', password = '', contentBase64 = '', contentType = 'application/octet-stream', depth } = req.body || {};
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: '缺少WebDAV目标地址' });
    }
    const headers = {};
    if (username || password) {
      const token = Buffer.from(`${username}:${password}`, 'utf8').toString('base64');
      headers['Authorization'] = `Basic ${token}`;
    }
    if (depth !== undefined) {
      headers['Depth'] = String(depth);
    }
    const fetchOpts = { method, headers };
    if (method === 'PUT' && contentBase64) {
      headers['Content-Type'] = contentType;
      fetchOpts.body = Buffer.from(contentBase64, 'base64');
    }
    const upRes = await fetch(url, fetchOpts);
    const status = upRes.status;
    if (method === 'GET' && upRes.ok) {
      const arrayBuf = await upRes.arrayBuffer();
      const b64 = Buffer.from(arrayBuf).toString('base64');
      const mime = upRes.headers.get('content-type') || 'application/octet-stream';
      return res.json({ ok: true, status, contentBase64: b64, contentType: mime });
    }
    const text = await upRes.text().catch(() => '');
    return res.json({ ok: upRes.ok || status === 201 || status === 204 || status === 207 || status === 405, status, text: text.slice(0, 2000) });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message || 'WebDAV代理请求失败' });
  }
});

const LOCAL_VAULT_ROOT = path.join(__dirname, 'EPhoneVault');
const LOCAL_VAULT_MEDIA_DIR = path.join(LOCAL_VAULT_ROOT, 'media');
const VAULT_MAGIC_HEADER = Buffer.from('EPHVAULT', 'ascii');

function toStealthDiskFileName(rawName) {
  const safe = path.basename(String(rawName || '')).replace(/[^a-zA-Z0-9._-]/g, '_');
  return safe.replace(/\.(png|jpe?g|webp|gif|mp3|wav|ogg|epdat)$/i, '') + '.epdat';
}

function getMimeFromVaultName(rawName) {
  const lower = String(rawName || '').toLowerCase();
  if (lower.endsWith('.mp3') || lower.endsWith('.mpeg') || lower.startsWith('aud_')) return 'audio/mpeg';
  if (lower.endsWith('.wav')) return 'audio/wav';
  if (lower.endsWith('.ogg')) return 'audio/ogg';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  return 'image/png';
}

function wrapBufferForVault(buf) {
  if (!Buffer.isBuffer(buf) || buf.length === 0) return buf;
  if (buf.length >= 8 && buf.subarray(0, 8).equals(VAULT_MAGIC_HEADER)) {
    return buf;
  }
  return Buffer.concat([VAULT_MAGIC_HEADER, buf]);
}

function unwrapBufferFromVault(buf) {
  if (!Buffer.isBuffer(buf)) return buf;
  if (buf.length >= 8 && buf.subarray(0, 8).equals(VAULT_MAGIC_HEADER)) {
    return buf.subarray(8);
  }
  return buf;
}

function ensureVaultNoMediaAndMigrate() {
  let converted = 0;
  try {
    fs.mkdirSync(LOCAL_VAULT_MEDIA_DIR, { recursive: true });
    const rootNoMedia = path.join(LOCAL_VAULT_ROOT, '.nomedia');
    const mediaNoMedia = path.join(LOCAL_VAULT_MEDIA_DIR, '.nomedia');
    if (!fs.existsSync(rootNoMedia)) fs.writeFileSync(rootNoMedia, '');
    if (!fs.existsSync(mediaNoMedia)) fs.writeFileSync(mediaNoMedia, '');
    const entries = fs.readdirSync(LOCAL_VAULT_MEDIA_DIR);
    for (const entry of entries) {
      if (/\.(png|jpe?g|webp|gif)$/i.test(entry)) {
        const oldPath = path.join(LOCAL_VAULT_MEDIA_DIR, entry);
        const stealthName = toStealthDiskFileName(entry);
        const newPath = path.join(LOCAL_VAULT_MEDIA_DIR, stealthName);
        try {
          const rawBuf = fs.readFileSync(oldPath);
          fs.writeFileSync(newPath, wrapBufferForVault(rawBuf));
          fs.unlinkSync(oldPath);
          converted++;
        } catch (_) {}
      }
    }
  } catch (_) {}
  return converted;
}

ensureVaultNoMediaAndMigrate();

app.get('/api/local-vault/ping', (req, res) => {
  try {
    ensureVaultNoMediaAndMigrate();
    const files = fs.existsSync(LOCAL_VAULT_MEDIA_DIR)
      ? fs.readdirSync(LOCAL_VAULT_MEDIA_DIR).filter((f) => f !== '.nomedia')
      : [];
    const backupPath = path.join(LOCAL_VAULT_ROOT, 'backup.json');
    const hasBackup = fs.existsSync(backupPath);
    return res.json({
      ok: true,
      folderName: 'EPhoneVault',
      mediaCount: files.length,
      hasBackup
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/api/local-vault/list', (req, res) => {
  try {
    ensureVaultNoMediaAndMigrate();
    const files = fs.existsSync(LOCAL_VAULT_MEDIA_DIR)
      ? fs.readdirSync(LOCAL_VAULT_MEDIA_DIR).filter((f) => f !== '.nomedia')
      : [];
    return res.json({ ok: true, files });
  } catch (err) {
    return res.status(500).json({ ok: false, files: [] });
  }
});

app.post('/api/local-vault/hide-gallery', (req, res) => {
  try {
    const converted = ensureVaultNoMediaAndMigrate();
    return res.json({ ok: true, converted });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/api/local-vault/media', (req, res) => {
  try {
    ensureVaultNoMediaAndMigrate();
    const { fileName = 'image.png', contentBase64 = '' } = req.body || {};
    const stealthName = toStealthDiskFileName(fileName);
    const filePath = path.join(LOCAL_VAULT_MEDIA_DIR, stealthName);
    const rawBuf = Buffer.from(String(contentBase64), 'base64');
    fs.writeFileSync(filePath, wrapBufferForVault(rawBuf));
    return res.json({ ok: true, fileName: stealthName, url: `/api/local-vault/media/${encodeURIComponent(fileName)}` });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/api/local-vault/media-batch', (req, res) => {
  try {
    ensureVaultNoMediaAndMigrate();
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    let saved = 0;
    for (const item of items) {
      if (!item || !item.fileName || !item.contentBase64) continue;
      const stealthName = toStealthDiskFileName(item.fileName);
      const filePath = path.join(LOCAL_VAULT_MEDIA_DIR, stealthName);
      if (!fs.existsSync(filePath)) {
        const rawBuf = Buffer.from(String(item.contentBase64), 'base64');
        fs.writeFileSync(filePath, wrapBufferForVault(rawBuf));
      }
      saved++;
    }
    return res.json({ ok: true, saved });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/api/local-vault/media/:filename', (req, res) => {
  try {
    const safeName = path.basename(String(req.params.filename || '')).replace(/[^a-zA-Z0-9._-]/g, '_');
    const stealthName = toStealthDiskFileName(safeName);
    const stealthPath = path.join(LOCAL_VAULT_MEDIA_DIR, stealthName);
    const legacyPath = path.join(LOCAL_VAULT_MEDIA_DIR, safeName);
    const targetPath = fs.existsSync(stealthPath) ? stealthPath : (fs.existsSync(legacyPath) ? legacyPath : '');
    if (!targetPath) {
      return res.status(404).end();
    }
    const rawBuf = fs.readFileSync(targetPath);
    const cleanBuf = unwrapBufferFromVault(rawBuf);
    res.setHeader('Content-Type', getMimeFromVaultName(safeName));
    return res.send(cleanBuf);
  } catch (err) {
    return res.status(500).end();
  }
});

app.put('/api/local-vault/backup.json', (req, res) => {
  try {
    fs.mkdirSync(LOCAL_VAULT_ROOT, { recursive: true });
    const backupPath = path.join(LOCAL_VAULT_ROOT, 'backup.json');
    const bodyStr = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
    fs.writeFileSync(backupPath, bodyStr, 'utf8');
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/api/local-vault/backup.json', (req, res) => {
  try {
    const backupPath = path.join(LOCAL_VAULT_ROOT, 'backup.json');
    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({ ok: false, error: '未找到备份文件' });
    }
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.sendFile(backupPath);
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

const LOCAL_VOICES_DIR = path.join(LOCAL_VAULT_ROOT, 'voices');
const LOCAL_VOICES_META_PATH = path.join(LOCAL_VOICES_DIR, 'voices.json');
try {
  fs.mkdirSync(LOCAL_VOICES_DIR, { recursive: true });
} catch (_) {}

function loadClonedVoicesList() {
  try {
    if (fs.existsSync(LOCAL_VOICES_META_PATH)) {
      const raw = fs.readFileSync(LOCAL_VOICES_META_PATH, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (_) {}
  return [];
}

function saveClonedVoicesList(list) {
  try {
    fs.mkdirSync(LOCAL_VOICES_DIR, { recursive: true });
    fs.writeFileSync(LOCAL_VOICES_META_PATH, JSON.stringify(list, null, 2), 'utf8');
  } catch (_) {}
}

const jaTransCache = new Map();
const GLM_ANIME_TRANSLATE_PROMPT =
  '你是一个专门负责密友群聊与二次元角色配音的日语台词翻译官。请将用户发来的中文聊天句子直接翻译成自然、地道、符合二次元动漫口吻的日语口语台词。严禁输出任何解释、罗马音、引号或多余说明，只输出纯日语台词本身。';

async function translateChineseToJapanese(rawText, glmConfig = {}) {
  const clean = String(rawText || '').trim();
  if (!clean) return '';
  if (/[\u3040-\u30ff]/.test(clean) && !/[\u4e00-\u9fa5]{3,}/.test(clean)) {
    return clean;
  }
  if (jaTransCache.has(clean)) {
    return jaTransCache.get(clean);
  }

  const glmUrl = String(glmConfig.url || 'https://open.bigmodel.cn/api/paas/v4').trim().replace(/\/+$/, '');
  const glmKey = String(glmConfig.apiKey || '').trim();
  const glmModel = String(glmConfig.model || 'glm-4-flash').trim();

  // 1. 若配置了自定义智谱 GLM-4 密钥，优先调用 GLM-4 接口翻译
  if (glmKey && glmKey !== 'builtin-glm4-auto') {
    try {
      const targetEndpoint = glmUrl.endsWith('/chat/completions')
        ? glmUrl
        : `${glmUrl}/chat/completions`;
      const glmRes = await fetch(targetEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${glmKey}`
        },
        body: JSON.stringify({
          model: glmModel || 'glm-4-flash',
          messages: [
            { role: 'system', content: GLM_ANIME_TRANSLATE_PROMPT },
            { role: 'user', content: clean }
          ],
          temperature: 0.3,
          stream: false
        }),
        signal: AbortSignal.timeout(12000)
      });
      if (glmRes.ok) {
        const glmData = await glmRes.json();
        const outText = String(glmData?.choices?.[0]?.message?.content || '').trim();
        if (outText) {
          if (jaTransCache.size > 500) jaTransCache.clear();
          jaTransCache.set(clean, outText);
          return outText;
        }
      }
    } catch (_) {}
  }

  // 2. 内置免填 AI 动漫日语翻译通道
  try {
    const aiRes = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai-fast',
        messages: [
          { role: 'system', content: GLM_ANIME_TRANSLATE_PROMPT },
          { role: 'user', content: clean }
        ],
        temperature: 0.3
      }),
      signal: AbortSignal.timeout(7000)
    });
    if (aiRes.ok) {
      const aiData = await aiRes.json();
      const outText = String(aiData?.choices?.[0]?.message?.content || '').trim();
      if (outText && /[\u3040-\u30ff]/.test(outText)) {
        if (jaTransCache.size > 500) jaTransCache.clear();
        jaTransCache.set(clean, outText);
        return outText;
      }
    }
  } catch (_) {}

  // 3. 高速日语直译保底通道
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=ja&dt=t&q=${encodeURIComponent(clean)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translated = data[0].map((seg) => (Array.isArray(seg) ? seg[0] : '')).join('').trim();
        if (translated) {
          if (jaTransCache.size > 500) jaTransCache.clear();
          jaTransCache.set(clean, translated);
          return translated;
        }
      }
    }
  } catch (_) {}
  return clean;
}

app.post('/api/glm-models', async (req, res) => {
  const defaultGlmModels = ['glm-4-flash', 'glm-4-air', 'glm-4-plus', 'glm-4-long', 'glm-4'];
  try {
    const { url = 'https://open.bigmodel.cn/api/paas/v4', apiKey = '' } = req.body || {};
    const cleanKey = String(apiKey || '').trim();
    if (cleanKey && cleanKey !== 'builtin-glm4-auto') {
      const base = String(url).trim().replace(/\/+$/, '');
      const mRes = await fetch(`${base}/models`, {
        headers: { 'Authorization': `Bearer ${cleanKey}` },
        signal: AbortSignal.timeout(8000)
      });
      if (mRes.ok) {
        const mData = await mRes.json();
        if (Array.isArray(mData?.data) && mData.data.length > 0) {
          return res.json({ ok: true, models: mData.data.map((m) => m.id).filter(Boolean) });
        }
      }
    }
  } catch (_) {}
  return res.json({ ok: true, models: defaultGlmModels });
});

app.post('/api/translate-ja', async (req, res) => {
  try {
    const { text = '', glmConfig = {} } = req.body || {};
    const jaText = await translateChineseToJapanese(text, glmConfig);
    return res.json({ ok: true, jaText });
  } catch (err) {
    return res.json({ ok: false, jaText: String(req.body?.text || '') });
  }
});

app.get('/api/fish-voices', (req, res) => {
  const list = loadClonedVoicesList().map((v) => ({
    id: v.id,
    name: v.name,
    remoteId: v.remoteId || '',
    remoteUri: v.remoteUri || '',
    provider: v.provider || 'fish',
    text: v.text || ''
  }));
  return res.json({ ok: true, voices: list });
});

app.post('/api/fish-clone', async (req, res) => {
  try {
    const {
      name = '克隆音色',
      text = '',
      audioBase64 = '',
      mimeType = 'audio/mpeg',
      apiKey = '',
      provider = 'fish'
    } = req.body || {};

    let rawB64 = String(audioBase64 || '').trim();
    if (!rawB64) {
      return res.status(400).json({ ok: false, error: '请先选择要克隆的参考音频文件' });
    }
    if (rawB64.includes(',')) {
      rawB64 = rawB64.split(',')[1];
    }
    const audioBuf = Buffer.from(rawB64, 'base64');
    if (audioBuf.length < 100) {
      return res.status(400).json({ ok: false, error: '音频文件无效或为空' });
    }

    const voiceId = 'clone_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    const ext = mimeType.includes('wav') ? 'wav' : 'mp3';
    const fileName = `${voiceId}.${ext}`;
    fs.mkdirSync(LOCAL_VOICES_DIR, { recursive: true });
    fs.writeFileSync(path.join(LOCAL_VOICES_DIR, fileName), audioBuf);

    let remoteId = '';
    let remoteUri = '';
    const cleanKey = String(apiKey || '').trim();

    if (cleanKey) {
      if (provider === 'siliconflow') {
        try {
          const form = new FormData();
          form.append('model', 'FunAudioLLM/CosyVoice2-0.5B');
          form.append('customName', String(name).replace(/[^a-zA-Z0-9_-]/g, '') || ('voice_' + Date.now()));
          form.append('text', String(text || 'こんにちは、よろしくお願いします。'));
          form.append('file', new Blob([audioBuf], { type: mimeType }), fileName);

          const sfRes = await fetch('https://api.siliconflow.cn/v1/uploads/audio/voice', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${cleanKey}` },
            body: form
          });
          if (sfRes.ok) {
            const sfJson = await sfRes.json();
            if (sfJson && sfJson.uri) {
              remoteUri = sfJson.uri;
            }
          }
        } catch (_) {}
      } else {
        try {
          const form = new FormData();
          form.append('visibility', 'private');
          form.append('type', 'tts');
          form.append('title', String(name || '克隆音色'));
          form.append('train_mode', 'fast');
          form.append('enhance_audio_quality', 'true');
          form.append('voices', new Blob([audioBuf], { type: mimeType }), fileName);
          if (text && String(text).trim()) {
            form.append('texts', String(text).trim());
          }
          const fishRes = await fetch('https://api.fish.audio/model', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${cleanKey}` },
            body: form
          });
          if (fishRes.ok) {
            const fishJson = await fishRes.json();
            if (fishJson && fishJson._id) {
              remoteId = fishJson._id;
            }
          }
        } catch (_) {}
      }
    }

    const list = loadClonedVoicesList();
    const newEntry = {
      id: remoteId || remoteUri || voiceId,
      localId: voiceId,
      name: String(name || '克隆音色').trim(),
      fileName,
      mimeType,
      text: String(text || '').trim(),
      remoteId,
      remoteUri,
      provider,
      createdAt: Date.now()
    };
    list.unshift(newEntry);
    saveClonedVoicesList(list);

    return res.json({
      ok: true,
      voice: {
        id: newEntry.id,
        name: newEntry.name,
        remoteId: newEntry.remoteId,
        remoteUri: newEntry.remoteUri,
        provider: newEntry.provider
      },
      voices: list.map((v) => ({
        id: v.id,
        name: v.name,
        remoteId: v.remoteId || '',
        remoteUri: v.remoteUri || '',
        provider: v.provider || 'fish'
      }))
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message || '音色克隆失败' });
  }
});

function resolveVoicevoxSpeakerId(rawId) {
  const s = String(rawId || '').trim();
  if (/^\d+$/.test(s)) {
    return parseInt(s, 10);
  }
  const map = {
    '甜妹': 3,
    '傲娇': 2,
    '元气': 8,
    '温柔': 10,
    '御姐': 65,
    '冥鸣': 14,
    '治愈': 20,
    '萝莉': 43,
    '机械': 47,
    '青年': 11,
    '少年': 52,
    '低音': 13,
    '温和': 67
  };
  if (map[s] !== undefined) return map[s];
  return 3;
}

app.post('/api/anime-tts', async (req, res) => {
  try {
    const {
      text = '',
      speakerId = '',
      referenceId = '',
      apiKey = '',
      provider = 'fish',
      translateToJa = true,
      glmConfig = {}
    } = req.body || {};

    const rawTrimmed = String(text || '').trim();
    if (!rawTrimmed) {
      return res.status(400).json({ ok: false, error: '语音文本为空' });
    }
    const spokenText = translateToJa !== false
      ? await translateChineseToJapanese(rawTrimmed, glmConfig)
      : rawTrimmed;

    const targetId = String(referenceId || speakerId || '').trim();
    const cleanKey = String(apiKey || '').trim();
    const clonedList = loadClonedVoicesList();
    const matchedClone = clonedList.find(
      (v) => v.id === targetId || v.localId === targetId || v.remoteId === targetId || v.remoteUri === targetId || v.name === targetId
    );

    // 1. 鱼音频官方 Fish Audio 接口 (支持云端克隆 ID 与本地参考音频零样本实时音色克隆)
    if (cleanKey && provider !== 'siliconflow') {
      try {
        const fishPayload = {
          text: spokenText,
          format: 'mp3',
          mp3_bitrate: 128,
          latency: 'normal'
        };
        if (matchedClone && matchedClone.remoteId) {
          fishPayload.reference_id = matchedClone.remoteId;
        } else if (matchedClone && matchedClone.fileName) {
          const samplePath = path.join(LOCAL_VOICES_DIR, matchedClone.fileName);
          if (fs.existsSync(samplePath)) {
            const sampleB64 = fs.readFileSync(samplePath).toString('base64');
            fishPayload.references = [
              {
                audio: sampleB64,
                text: matchedClone.text || ''
              }
            ];
          }
        } else if (targetId && targetId.length >= 16 && !/^\d+$/.test(targetId)) {
          fishPayload.reference_id = targetId;
        }

        const fishRes = await fetch('https://api.fish.audio/v1/tts', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${cleanKey}`,
            'Content-Type': 'application/json',
            'model': 'speech-1.6'
          },
          body: JSON.stringify(fishPayload)
        });
        if (fishRes.ok) {
          const ab = await fishRes.arrayBuffer();
          if (ab && ab.byteLength > 200) {
            return res.json({
              ok: true,
              audioHex: Buffer.from(ab).toString('hex'),
              jaText: spokenText,
              speaker: targetId,
              engine: 'fish'
            });
          }
        }
      } catch (_) {}
    }

    // 2. 硅基流动 Fish Speech / CosyVoice2 克隆与预置音色接口
    if (cleanKey && (provider === 'siliconflow' || cleanKey.startsWith('sk-'))) {
      try {
        const voiceUri = (matchedClone && matchedClone.remoteUri)
          ? matchedClone.remoteUri
          : (targetId && targetId.startsWith('speech:') ? targetId : 'FunAudioLLM/CosyVoice2-0.5B:anna');
        const sfModel = voiceUri.includes('fish-speech')
          ? 'fishaudio/fish-speech-1.5'
          : 'FunAudioLLM/CosyVoice2-0.5B';
        const sfRes = await fetch('https://api.siliconflow.cn/v1/audio/speech', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${cleanKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: sfModel,
            input: spokenText,
            voice: voiceUri,
            response_format: 'mp3'
          })
        });
        if (sfRes.ok) {
          const ab = await sfRes.arrayBuffer();
          if (ab && ab.byteLength > 200) {
            return res.json({
              ok: true,
              audioHex: Buffer.from(ab).toString('hex'),
              jaText: spokenText,
              speaker: voiceUri,
              engine: 'siliconflow'
            });
          }
        }
      } catch (_) {}
    }

    // 3. 免费公共日系动漫声优兜底通道
    const vvSpeaker = resolveVoicevoxSpeakerId(targetId);
    try {
      const vvUrl = `https://api.tts.quest/v3/voicevox/synthesis?speaker=${vvSpeaker}&text=${encodeURIComponent(spokenText)}`;
      const synthRes = await fetch(vvUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (synthRes.ok) {
        const synthJson = await synthRes.json();
        if (synthJson && synthJson.success && synthJson.mp3StreamingUrl) {
          const statusUrl = synthJson.audioStatusUrl;
          const mp3Url = synthJson.mp3StreamingUrl;
          if (statusUrl) {
            for (let attempt = 0; attempt < 18; attempt++) {
              try {
                const stRes = await fetch(statusUrl);
                if (stRes.ok) {
                  const stJson = await stRes.json();
                  if (stJson && (stJson.isAudioReady || stJson.isAudioError)) break;
                }
              } catch (_) {}
              await new Promise((r) => setTimeout(r, 350));
            }
          }
          const audioRes = await fetch(mp3Url);
          if (audioRes.ok) {
            const arrBuf = await audioRes.arrayBuffer();
            if (arrBuf && arrBuf.byteLength > 200) {
              return res.json({
                ok: true,
                audioHex: Buffer.from(arrBuf).toString('hex'),
                jaText: spokenText,
                speaker: vvSpeaker,
                engine: 'fish-free'
              });
            }
          }
        }
      }
    } catch (_) {}

    // 4. 零报错日语语音保底
    const chunks = spokenText.match(/.{1,160}/g) || [spokenText];
    const buffers = [];
    for (const chunk of chunks) {
      const fallbackUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=ja&client=tw-ob&q=${encodeURIComponent(chunk)}`;
      const fbRes = await fetch(fallbackUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      if (fbRes.ok) {
        const ab = await fbRes.arrayBuffer();
        if (ab && ab.byteLength > 0) {
          buffers.push(Buffer.from(ab));
        }
      }
    }
    if (buffers.length > 0) {
      const combined = Buffer.concat(buffers);
      return res.json({
        ok: true,
        audioHex: combined.toString('hex'),
        jaText: spokenText,
        speaker: vvSpeaker,
        engine: 'ja-fallback'
      });
    }

    return res.status(502).json({ ok: false, error: '鱼音合成暂时繁忙，请稍后重试' });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message || '鱼音合成失败' });
  }
});


// Forward proxy for AI requests to prevent browser CORS and network failures
app.post('/api/proxy', async (req, res) => {
  req.setTimeout(600000);
  res.setTimeout(600000);

  const proxyCtrl = new AbortController();
  let proxyTimer = null;
  const resetProxyTimeout = () => {
    if (proxyTimer) clearTimeout(proxyTimer);
    proxyTimer = setTimeout(() => {
      proxyCtrl.abort(new Error('Proxy upstream timeout'));
    }, 600000);
  };
  resetProxyTimeout();

  try {
    const { url, method = 'POST', headers = {}, body } = req.body;
    if (!url) {
      if (proxyTimer) clearTimeout(proxyTimer);
      return res.status(400).json({ error: 'Missing target url' });
    }

    const fetchHeaders = { ...headers };
    delete fetchHeaders['host'];
    delete fetchHeaders['origin'];
    delete fetchHeaders['referer'];

    const fetchOptions = {
      method,
      headers: fetchHeaders,
      signal: proxyCtrl.signal
    };

    if (body !== undefined && method !== 'GET' && method !== 'HEAD') {
      fetchOptions.body = typeof body === 'object' ? JSON.stringify(body) : body;
    }

    const response = await fetch(url, fetchOptions);
    resetProxyTimeout();
    const contentType = response.headers.get('content-type') || '';
    res.status(response.status);

    if (contentType.includes('event-stream') || contentType.includes('text/event-stream')) {
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');

      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        try {
          while (true) {
            const { done, value } = await reader.read();
            resetProxyTimeout();
            if (done) break;
            res.write(value);
            const textChunk = decoder.decode(value, { stream: true });
            if (textChunk.includes('data: [DONE]') || textChunk.includes('data:[DONE]')) {
              try { await reader.cancel(); } catch (_) {}
              break;
            }
          }
        } catch (streamErr) {
          console.warn('[Proxy Stream] Stream reading error:', streamErr.message);
        } finally {
          if (proxyTimer) clearTimeout(proxyTimer);
          res.end();
        }
        return;
      }
    }

    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }

    if (contentType.includes('application/json') || contentType.includes('text/')) {
      const text = await response.text();
      if (proxyTimer) clearTimeout(proxyTimer);
      return res.send(text);
    } else {
      const arrayBuffer = await response.arrayBuffer();
      if (proxyTimer) clearTimeout(proxyTimer);
      return res.send(Buffer.from(arrayBuffer));
    }
  } catch (err) {
    if (proxyTimer) clearTimeout(proxyTimer);
    console.error('Proxy request error:', err);
    res.status(500).json({ error: err.message || 'Proxy request failed' });
  }
});

// Peer communication hub and offline mailbox
const MAILBOX_STORE_PATH = path.join(__dirname, '.peer-mailbox-store.json');
const peerClients = new Map();
const peerMailboxes = new Map();
const peerProfiles = new Map();
const peerLastPoll = new Map();

const EPHEMERAL_EVENT_TYPES = new Set([
  'online_ping',
  'online_pong',
  'offline_ping',
  'peer_presence',
  'group_typing_status',
  'peer_ack'
]);

function sanitizeMailboxEventsForDisk(events) {
  if (!Array.isArray(events)) return [];
  const now = Date.now();
  const maxAgeMs = 14 * 24 * 60 * 60 * 1000;
  return events
    .filter((item) => {
      if (!item || typeof item !== 'object') return false;
      if (EPHEMERAL_EVENT_TYPES.has(item.type)) return false;
      if (item.timestamp && now - item.timestamp > maxAgeMs) return false;
      return true;
    })
    .slice(-100);
}

function loadMailboxStoreFromDisk() {
  try {
    if (fs.existsSync(MAILBOX_STORE_PATH)) {
      const raw = fs.readFileSync(MAILBOX_STORE_PATH, 'utf8');
      const parsed = JSON.parse(raw);
      let needsResave = false;
      if (parsed && parsed.mailboxes && typeof parsed.mailboxes === 'object') {
        for (const [k, v] of Object.entries(parsed.mailboxes)) {
          if (Array.isArray(v)) {
            const cleaned = sanitizeMailboxEventsForDisk(v);
            if (cleaned.length !== v.length) needsResave = true;
            if (cleaned.length > 0) {
              peerMailboxes.set(k, cleaned);
            }
          }
        }
      }
      if (parsed && parsed.profiles && typeof parsed.profiles === 'object') {
        for (const [k, v] of Object.entries(parsed.profiles)) {
          if (v && typeof v === 'object') peerProfiles.set(k, v);
        }
      }
      if (needsResave) {
        scheduleSaveMailboxStore();
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
          const cleaned = sanitizeMailboxEventsForDisk(v);
          if (cleaned.length > 0) {
            mailboxesObj[k] = cleaned;
          }
        }
      }
      const profilesObj = {};
      for (const [k, v] of peerProfiles.entries()) {
        profilesObj[k] = v;
      }
      fs.promises
        .writeFile(MAILBOX_STORE_PATH, JSON.stringify({ mailboxes: mailboxesObj, profiles: profilesObj }), 'utf8')
        .catch((e) => console.warn('[PeerStore] Save warning:', e.message));
    } catch (e) {
      console.warn('[PeerStore] Save warning:', e.message);
    }
  }, 1200);
}

loadMailboxStoreFromDisk();

const peerWaitingPollers = new Map();

function pushToMailbox(code, event) {
  if (!code || !event) return;
  if (!peerMailboxes.has(code)) {
    peerMailboxes.set(code, []);
  }
  let box = peerMailboxes.get(code);
  if (event.eventId && box.some(item => item && item.eventId === event.eventId)) {
    return;
  }
  if (event.type === 'group_typing_status') {
    box = box.filter(item => !(item && item.type === 'group_typing_status' && item.fromCode === event.fromCode));
  } else if (event.type === 'group_member_update' && event.groupId) {
    box = box.filter(item => !(item && item.type === 'group_member_update' && String(item.groupId) === String(event.groupId)));
  } else if (event.type === 'profile_update' && (event.peerCode || event.fromCode)) {
    const pCode = event.peerCode || event.fromCode;
    box = box.filter(item => !(item && item.type === 'profile_update' && (item.peerCode === pCode || item.fromCode === pCode)));
  } else if (event.type === 'peer_ack' && event.ackEventId) {
    box = box.filter(item => !(item && item.type === 'peer_ack' && item.ackEventId === event.ackEventId));
  }
  box.push(event);
  if (box.length > 150) {
    const nonEphemeral = box.filter(item => item && !EPHEMERAL_EVENT_TYPES.has(item.type));
    if (nonEphemeral.length <= 150) {
      box = nonEphemeral;
    } else {
      box = nonEphemeral.slice(-150);
    }
  }
  peerMailboxes.set(code, box);
  if (!EPHEMERAL_EVENT_TYPES.has(event.type)) {
    scheduleSaveMailboxStore();
  }

  const waitSet = peerWaitingPollers.get(code);
  if (waitSet && waitSet.size > 0) {
    const list = Array.from(waitSet);
    waitSet.clear();
    for (const item of list) {
      if (item && item.timer) clearTimeout(item.timer);
      if (item && item.res && !item.res.headersSent) {
        try {
          item.res.json({ success: true, events: [event], profile: peerProfiles.get(code) || null, onlinePeers: {} });
        } catch (_) {}
      }
    }
  }
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
  const normCode = String(peerCode).trim().toUpperCase();
  peerLastPoll.set(normCode, Date.now());
  peerProfiles.set(normCode, { name, avatar, myAvatarFrame, lastSeen: Date.now() });
  scheduleSaveMailboxStore();
  return res.json({ success: true });
});

function pushPresenceToMailbox(code, event) {
  if (!code || !event) return;
  if (!peerMailboxes.has(code)) {
    peerMailboxes.set(code, []);
  }
  const box = peerMailboxes.get(code);
  const filtered = box.filter(item => !(item && (item.type === 'online_ping' || item.type === 'online_pong' || item.type === 'offline_ping') && item.fromCode === event.fromCode));
  filtered.push(event);
  if (filtered.length > 200) {
    filtered.shift();
  }
  peerMailboxes.set(code, filtered);
}

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
  const normFrom = fromCode ? String(fromCode).trim().toUpperCase() : '';
  const normTo = String(toCode).trim().toUpperCase();

  if (normFrom && type !== 'offline_ping') {
    peerLastPoll.set(normFrom, Date.now());
  }

  if (type === 'peer_ack') {
    const ackEvt = {
      type: 'peer_ack',
      eventId: eventId || ('evt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)),
      ackEventId,
      fromCode: normFrom || fromCode,
      toCode: normTo,
      timestamp: Date.now()
    };
    sendToPeerWs(normTo, ackEvt);
    pushToMailbox(normTo, ackEvt);
    return res.json({ success: true });
  }

  if (type === 'online_ping' || type === 'online_pong' || type === 'offline_ping') {
    if (normFrom) {
      if (type === 'offline_ping') {
        peerLastPoll.delete(normFrom);
        if (peerClients.has(normFrom)) {
          peerClients.delete(normFrom);
        }
      } else {
        peerLastPoll.set(normFrom, Date.now());
      }
    }
    const pingEvt = {
      type,
      eventId: eventId || ('ping_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)),
      fromCode: normFrom || fromCode,
      toCode: normTo,
      timestamp: Date.now()
    };
    const delivered = sendToPeerWs(normTo, pingEvt);
    if (!delivered) {
      pushPresenceToMailbox(normTo, pingEvt);
    }
    return res.json({ success: true });
  }

  if (type !== 'message') {
    const customEvent = {
      ...body,
      type,
      fromCode: normFrom || fromCode,
      toCode: normTo,
      eventId: eventId || ('evt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)),
      timestamp: timestamp || Date.now()
    };
    const delivered = sendToPeerWs(normTo, customEvent);
    pushToMailbox(normTo, customEvent);
    return res.json({ success: true, delivered });
  }

  if (!content && !audioData) return res.status(400).json({ error: 'Missing content' });
  const event = {
    ...body,
    type: 'message',
    eventId: eventId || ('evt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)),
    fromCode: normFrom || fromCode,
    toCode: normTo,
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
  const delivered = sendToPeerWs(normTo, event);
  pushToMailbox(normTo, event);
  return res.json({ success: true, delivered });
});

app.post('/api/peer/profile', (req, res) => {
  const { eventId, peerCode, name, avatar, myAvatarFrame, peerAvatarFrame, targetCodes = [] } = req.body;
  if (!peerCode) return res.status(400).json({ error: 'Missing peerCode' });
  const normCode = String(peerCode).trim().toUpperCase();
  peerLastPoll.set(normCode, Date.now());
  peerProfiles.set(normCode, { name, avatar, myAvatarFrame, lastSeen: Date.now() });
  scheduleSaveMailboxStore();
  const event = {
    type: 'profile_update',
    eventId: eventId || ('evt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)),
    peerCode: normCode,
    name,
    avatar,
    myAvatarFrame: myAvatarFrame !== undefined ? myAvatarFrame : undefined,
    peerAvatarFrame: peerAvatarFrame !== undefined ? peerAvatarFrame : undefined,
    timestamp: Date.now()
  };
  if (Array.isArray(targetCodes)) {
    for (const target of targetCodes) {
      const normTarget = String(target).trim().toUpperCase();
      sendToPeerWs(normTarget, event);
      pushToMailbox(normTarget, event);
    }
  }
  return res.json({ success: true });
});

app.post('/api/peer/request', (req, res) => {
  const { type = 'friend_request', eventId, fromCode, toCode, fromName, fromAvatar, fromAvatarFrame } = req.body;
  if (!toCode) return res.status(400).json({ error: 'Missing target' });
  const normFrom = fromCode ? String(fromCode).trim().toUpperCase() : '';
  const normTo = String(toCode).trim().toUpperCase();
  if (normFrom) peerLastPoll.set(normFrom, Date.now());
  const event = {
    type: type === 'friend_accept' ? 'friend_accept' : 'friend_request',
    eventId: eventId || ('evt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)),
    fromCode: normFrom || fromCode,
    toCode: normTo,
    fromName,
    fromAvatar,
    fromAvatarFrame: fromAvatarFrame || '',
    timestamp: Date.now()
  };
  sendToPeerWs(normTo, event);
  pushToMailbox(normTo, event);
  return res.json({ success: true });
});

app.post('/api/peer/ack', (req, res) => {
  const { peerCode, eventIds = [] } = req.body;
  if (!peerCode) return res.status(400).json({ error: 'Missing peerCode' });
  const normCode = String(peerCode).trim().toUpperCase();
  peerLastPoll.set(normCode, Date.now());
  ackFromMailbox(normCode, eventIds);
  return res.json({ success: true });
});

app.get('/api/peer/poll', (req, res) => {
  const rawCode = req.query.code;
  if (!rawCode) return res.status(400).json({ error: 'Missing code' });
  const code = String(rawCode).trim().toUpperCase();
  peerLastPoll.set(code, Date.now());
  const events = peerMailboxes.get(code) || [];
  const profile = peerProfiles.get(code) || null;
  const onlinePeers = {};
  if (typeof req.query.peers === 'string' && req.query.peers.trim()) {
    const now = Date.now();
    req.query.peers.split(',').forEach((p) => {
      const pCode = p.trim().toUpperCase();
      if (!pCode) return;
      const wsSet = peerClients.get(pCode);
      const hasWs = Boolean(wsSet && wsSet.size > 0);
      const lastSeen = peerLastPoll.get(pCode) || 0;
      onlinePeers[pCode] = Boolean(hasWs || (lastSeen > 0 && now - lastSeen < 25000));
    });
  }

  if (events.length > 0 || req.query.wait === '0') {
    return res.json({ success: true, events, profile, onlinePeers });
  }

  if (!peerWaitingPollers.has(code)) {
    peerWaitingPollers.set(code, new Set());
  }
  const pollers = peerWaitingPollers.get(code);
  const entry = { res, timer: null };

  const done = (evts) => {
    if (entry.timer) clearTimeout(entry.timer);
    pollers.delete(entry);
    if (!res.headersSent) {
      try {
        res.json({ success: true, events: evts || peerMailboxes.get(code) || [], profile, onlinePeers });
      } catch (_) {}
    }
  };

  entry.timer = setTimeout(() => {
    done([]);
  }, 25000);

  req.on('close', () => {
    if (entry.timer) clearTimeout(entry.timer);
    pollers.delete(entry);
  });

  pollers.add(entry);
});

const LOCAL_VAULT_DIR = path.join(__dirname, '.local-vault-store');
const LOCAL_VAULT_FILES_DIR = path.join(LOCAL_VAULT_DIR, 'files');
try {
  if (!fs.existsSync(LOCAL_VAULT_FILES_DIR)) {
    fs.mkdirSync(LOCAL_VAULT_FILES_DIR, { recursive: true });
  }
} catch (_) {}

app.use('/api/local-vault', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PROPFIND, MKCOL, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Vault-Token');
  if (req.method === 'OPTIONS') return res.status(200).end();
  next();
});

app.get('/api/local-vault/ping', (req, res) => {
  let count = 0;
  try {
    count = fs.readdirSync(LOCAL_VAULT_FILES_DIR).length;
  } catch (_) {}
  return res.json({ ok: true, mode: 'node-vault', files: count });
});

app.post('/api/local-vault/file/:id', (req, res) => {
  try {
    const safeId = String(req.params.id || '').replace(/[^a-zA-Z0-9._-]/g, '_');
    if (!safeId) return res.status(400).json({ error: 'Invalid file id' });
    const dataUrl = req.body && req.body.dataUrl ? String(req.body.dataUrl) : '';
    if (!dataUrl) return res.status(400).json({ error: 'Missing dataUrl' });
    const filePath = path.join(LOCAL_VAULT_FILES_DIR, safeId + '.txt');
    fs.writeFileSync(filePath, dataUrl, 'utf8');
    return res.json({ ok: true, id: safeId });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Write failed' });
  }
});

app.get('/api/local-vault/file/:id', (req, res) => {
  try {
    const safeId = String(req.params.id || '').replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = path.join(LOCAL_VAULT_FILES_DIR, safeId + '.txt');
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Not found' });
    const dataUrl = fs.readFileSync(filePath, 'utf8');
    return res.json({ ok: true, id: safeId, dataUrl });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Read failed' });
  }
});

app.post('/api/local-vault/backup', (req, res) => {
  try {
    const payload = req.body || {};
    const backupPath = path.join(LOCAL_VAULT_DIR, 'latest-backup.json');
    fs.writeFileSync(backupPath, JSON.stringify(payload), 'utf8');
    return res.json({ ok: true, timestamp: Date.now() });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Backup write failed' });
  }
});

app.get('/api/local-vault/backup', (req, res) => {
  try {
    const backupPath = path.join(LOCAL_VAULT_DIR, 'latest-backup.json');
    if (!fs.existsSync(backupPath)) return res.status(404).json({ error: 'No backup found' });
    const raw = fs.readFileSync(backupPath, 'utf8');
    return res.type('application/json').send(raw);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Backup read failed' });
  }
});

app.post('/api/local-vault/webdav', async (req, res) => {
  try {
    const { url, username = '', password = '', method = 'GET', bodyData = '' } = req.body || {};
    if (!url || !/^https?:\/\//i.test(String(url))) {
      return res.status(400).json({ error: '无效的WebDAV地址' });
    }
    const headers = {};
    if (username || password) {
      headers['Authorization'] = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');
    }
    const upperMethod = String(method || 'GET').toUpperCase();
    const fetchOpts = { method: upperMethod, headers };
    if (upperMethod === 'PUT' || upperMethod === 'POST') {
      headers['Content-Type'] = 'text/plain; charset=utf-8';
      fetchOpts.body = typeof bodyData === 'string' ? bodyData : JSON.stringify(bodyData);
    }
    const r = await fetch(String(url), fetchOpts);
    const text = await r.text();
    return res.json({ ok: r.ok || r.status === 201 || r.status === 204 || r.status === 207, status: r.status, data: text });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message || 'WebDAV请求失败' });
  }
});

// ===================================================================
// QQ 群控中枢 OneBot v11 双模网桥与本地磁盘存储引擎
// ===================================================================
const QQBOT_DIR = path.join(LOCAL_VAULT_ROOT, 'qq_bot');
const QQBOT_CONFIG_PATH = path.join(QQBOT_DIR, 'config.json');
try {
  fs.mkdirSync(QQBOT_DIR, { recursive: true });
} catch (_) {}

const qqBotRuntime = {
  reverseSockets: new Set(),
  forwardSocket: null,
  pendingEchoes: new Map(),
  selfId: '',
  nickname: '',
  connected: false,
  connectionMode: 'reverse_ws',
  lastEventAt: 0,
  lastError: '',
  pendingGroupEvents: new Map(),
  groupSeqState: new Map()
};

function getDefaultThoughtItems() {
  return [
    { id: 'tc_single', title: '单人搭话独立回应', content: '当某位群友单独向NPC搭话或声明独立行动且不牵连他人时，直接引用回复该群友，无需死等全员表态。', enabled: true },
    { id: 'tc_bracket', title: '识别括号场外沟通', content: '完整阅读群友在括号内发的规则提问、环境确认或场外沟通，及时给出清晰解答。', enabled: true },
    { id: 'tc_rp_quiet', title: '玩家对戏保持安静', content: '当群友之间正在进行角色扮演对戏且不需要NPC插话时，副API自动判定保持安静不打断。', enabled: true },
    { id: 'tc_secret', title: '单人线秘密发小窗', content: '遇到专属HO秘密、高难侦查独享线索或单人线剧情时，表面信息发群内，秘密内容通过小窗或单人群私发。', enabled: true },
    { id: 'tc_no_godmod', title: '禁止替群友做决定', content: '绝不替玩家扮演其角色台词与心理，绝不强行篡改玩家的行动意愿，保持自然真人语气。', enabled: true }
  ];
}

function getDefaultQqBotConfig() {
  return {
    connectionMode: 'reverse_ws',
    onebotUrl: 'ws://127.0.0.1:3000/api/qqbot/ws',
    endpoint: 'ws://127.0.0.1:3000/api/qqbot/ws',
    accessToken: '',
    selfId: '',
    nickname: '群控助手',
    activeGroupId: '88482026',
    mainApi: {
      url: '',
      apiKey: '',
      model: ''
    },
    subApi: {
      url: '',
      apiKey: '',
      model: ''
    },
    groups: {
      '88482026': {
        groupId: '88482026',
        groupName: '八月二十二日跑团群',
        enabled: true,
        mode: 'trpg',
        debounceSec: 8,
        contextLimit: 180,
        idleAskMin: 15,
        cooldownSec: 5,
        autoNaiImage: true,
        modImgMode: 'auto',
        personaId: '',
        aiPersona: '你是一位经验丰富、沉稳自然的真人跑团守秘人KP兼群友。说话自然流畅，绝不说教，遇到单人向NPC搭话或独立行动时直接回应对应玩家，遇到全员关键节点时引导大家自然互动。',
        customPrompt: '单条消息保持自然分段气泡感，不要长篇大论刷屏；严格区分公开表象与私聊秘密线索。',
        thoughtChainId: '',
        thoughtItems: getDefaultThoughtItems(),
        worldBookId: '',
        stickerCategoryId: 'ALL',
        moduleId: '',
        chapterId: 'ALL',
        memberRemarks: {
          '10001': '早川秋',
          '10002': '佐藤葵'
        },
        playerBindings: [
          {
            qq: '10001',
            alias: '',
            qqRemark: '早川秋',
            slot: 'HO1',
            cardId: '',
            cardName: '早川秋',
            persona: '冷静敏锐的刑侦调查员，擅长观察环境细节与审讯推理，性格外冷内热，对异常现象抱有强烈求知欲。'
          },
          {
            qq: '10002',
            alias: '',
            qqRemark: '佐藤葵',
            slot: 'HO2',
            cardId: '',
            cardName: '佐藤葵',
            persona: '温和细心的民俗学研究生，擅长交涉、聆听与古籍查阅，说话礼貌温和，在团队中负责调和气氛与情报整理。'
          }
        ]
      }
    }
  };
}

function normalizeGroupConfig(gid, g) {
  const defGroup = getDefaultQqBotConfig().groups['88482026'];
  const merged = {
    ...defGroup,
    ...(g || {}),
    groupId: String(gid)
  };
  if (merged.mode === 'trpg_kp') merged.mode = 'trpg';
  if (!Array.isArray(merged.thoughtItems) || merged.thoughtItems.length === 0) {
    merged.thoughtItems = getDefaultThoughtItems();
  }
  if (!merged.memberRemarks || typeof merged.memberRemarks !== 'object') {
    merged.memberRemarks = {};
  }
  if (!Array.isArray(merged.playerBindings)) {
    if (Array.isArray(merged.players) && merged.players.length > 0) {
      merged.playerBindings = merged.players.map(p => ({
        qq: String(p.qq || ''),
        alias: String(p.alias || ''),
        qqRemark: String(p.qqRemark || p.name || ''),
        slot: String(p.slot || p.hoCode || '群友'),
        cardId: String(p.cardId || ''),
        cardName: String(p.cardName || p.name || '未绑角色卡'),
        persona: String(p.persona || p.skillsSummary || '')
      }));
    } else {
      merged.playerBindings = [];
    }
  }
  return merged;
}

function loadQqBotConfig() {
  try {
    if (fs.existsSync(QQBOT_CONFIG_PATH)) {
      const raw = fs.readFileSync(QQBOT_CONFIG_PATH, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const def = getDefaultQqBotConfig();
        const rawGroups = (parsed.groups && Object.keys(parsed.groups).length > 0) ? parsed.groups : def.groups;
        const normGroups = {};
        for (const gid of Object.keys(rawGroups)) {
          normGroups[gid] = normalizeGroupConfig(gid, rawGroups[gid]);
        }
        return {
          ...def,
          ...parsed,
          onebotUrl: parsed.onebotUrl || parsed.endpoint || def.onebotUrl,
          endpoint: parsed.onebotUrl || parsed.endpoint || def.endpoint,
          mainApi: { ...def.mainApi, ...(parsed.mainApi || {}) },
          subApi: { ...def.subApi, ...(parsed.subApi || {}) },
          groups: normGroups
        };
      }
    }
  } catch (_) {}
  const def = getDefaultQqBotConfig();
  saveQqBotConfig(def);
  return def;
}

function saveQqBotConfig(cfg) {
  try {
    fs.mkdirSync(QQBOT_DIR, { recursive: true });
    fs.writeFileSync(QQBOT_CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf8');
  } catch (_) {}
}

function getGroupHistoryPath(groupId) {
  const safeId = String(groupId || 'default').replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(QQBOT_DIR, `history_${safeId}.json`);
}

function getGroupMemoryPath(groupId) {
  const safeId = String(groupId || 'default').replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(QQBOT_DIR, `memory_${safeId}.json`);
}

function normalizeStoredMessage(m, idx) {
  if (!m || typeof m !== 'object') return null;
  const text = String(m.rawMessage !== undefined ? m.rawMessage : (m.content || '')).trim();
  const isSelf = Boolean(m.isSelf !== undefined ? m.isSelf : m.isBot);
  return {
    ...m,
    seq: Number(m.seq) || (idx + 1),
    messageId: String(m.messageId || ('msg_' + (idx + 1))),
    senderId: String(m.senderId || ''),
    senderName: String(m.senderName || m.senderId || '群成员'),
    qqRemark: String(m.qqRemark || m.senderName || ''),
    content: text,
    rawMessage: text,
    isBot: isSelf,
    isSelf
  };
}

function loadGroupHistoryFromDisk(groupId, limit = 180) {
  try {
    const p = getGroupHistoryPath(groupId);
    if (!fs.existsSync(p)) return { total: 0, messages: [], lastSeq: 0 };
    const raw = fs.readFileSync(p, 'utf8');
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return { total: 0, messages: [], lastSeq: 0 };
    const normalized = arr.map((m, idx) => normalizeStoredMessage(m, idx)).filter(Boolean);
    const cleanLimit = Math.max(1, Math.min(1000, Number(limit) || 180));
    const lastSeq = normalized.length > 0 ? normalized[normalized.length - 1].seq : 0;
    return {
      total: normalized.length,
      lastSeq,
      messages: normalized.slice(-cleanLimit)
    };
  } catch (_) {
    return { total: 0, messages: [], lastSeq: 0 };
  }
}

function appendGroupMessageToDisk(groupId, msgObj) {
  try {
    const p = getGroupHistoryPath(groupId);
    let arr = [];
    if (fs.existsSync(p)) {
      try {
        arr = JSON.parse(fs.readFileSync(p, 'utf8'));
        if (!Array.isArray(arr)) arr = [];
      } catch (_) {
        arr = [];
      }
    }
    if (msgObj.messageId && arr.some(m => String(m.messageId) === String(msgObj.messageId))) {
      const last = arr[arr.length - 1];
      return { total: arr.length, entry: normalizeStoredMessage(last, arr.length - 1) };
    }
    const prevLastSeq = arr.length > 0 ? (Number(arr[arr.length - 1].seq) || arr.length) : 0;
    const nextSeq = prevLastSeq + 1;
    const text = String(msgObj.rawMessage !== undefined ? msgObj.rawMessage : (msgObj.content || '')).trim();
    const isSelf = Boolean(msgObj.isSelf !== undefined ? msgObj.isSelf : msgObj.isBot);
    const entry = {
      ...msgObj,
      seq: nextSeq,
      content: text,
      rawMessage: text,
      isBot: isSelf,
      isSelf,
      timestamp: msgObj.timestamp || Date.now()
    };
    arr.push(entry);
    if (arr.length > 2000) {
      arr = arr.slice(-2000);
    }
    fs.writeFileSync(p, JSON.stringify(arr), 'utf8');

    const gid = String(groupId);
    const prevSt = qqBotRuntime.groupSeqState.get(gid) || {
      lastMessageSeq: 0,
      lastProcessedSeq: 0,
      lastMessageAt: 0,
      waitingForRpSince: 0,
      idleAsked: false
    };
    if (!isSelf) {
      prevSt.lastMessageSeq = nextSeq;
      prevSt.lastMessageAt = Date.now();
      prevSt.idleAsked = false;
    } else {
      prevSt.lastMessageSeq = nextSeq;
      prevSt.lastProcessedSeq = nextSeq;
      prevSt.waitingForRpSince = Date.now();
    }
    qqBotRuntime.groupSeqState.set(gid, prevSt);

    return { total: arr.length, entry };
  } catch (_) {
    return { total: 0, entry: null };
  }
}

function loadGroupMemoryFromDisk(groupId) {
  try {
    const p = getGroupMemoryPath(groupId);
    if (fs.existsSync(p)) {
      const parsed = JSON.parse(fs.readFileSync(p, 'utf8'));
      if (parsed && (typeof parsed.summaryText === 'string' || typeof parsed.ledger === 'string')) {
        const text = parsed.summaryText || parsed.ledger || '';
        return {
          groupId: String(groupId),
          updatedAt: parsed.updatedAt || 0,
          lastSummarizedSeq: Number(parsed.lastSummarizedSeq || parsed.summarizedCount) || 0,
          summarizedCount: Number(parsed.lastSummarizedSeq || parsed.summarizedCount) || 0,
          summaryText: text,
          ledger: text
        };
      }
    }
  } catch (_) {}
  const defaultText = [
    '一、已发生关键事件与时间线：暂无已归档事件，等待群聊推进后由副API自动提炼。',
    '二、当前所处场景与已获线索道具：全员处于初始场景阶段。',
    '三、人物关系态度、技能检定结果与待回收伏笔：各群成员关系正常，暂无未决检定。'
  ].join('\n');
  return {
    groupId: String(groupId),
    updatedAt: 0,
    lastSummarizedSeq: 0,
    summarizedCount: 0,
    summaryText: defaultText,
    ledger: defaultText
  };
}

function saveGroupMemoryToDisk(groupId, memoryData) {
  try {
    const p = getGroupMemoryPath(groupId);
    const prev = loadGroupMemoryFromDisk(groupId);
    const text = String(
      memoryData.summaryText !== undefined
        ? memoryData.summaryText
        : (memoryData.ledger !== undefined ? memoryData.ledger : prev.summaryText)
    );
    const seq = Number(
      memoryData.lastSummarizedSeq !== undefined
        ? memoryData.lastSummarizedSeq
        : (memoryData.summarizedCount !== undefined ? memoryData.summarizedCount : prev.lastSummarizedSeq)
    ) || 0;
    const next = {
      groupId: String(groupId),
      updatedAt: Date.now(),
      lastSummarizedSeq: seq,
      summarizedCount: seq,
      summaryText: text,
      ledger: text
    };
    fs.writeFileSync(p, JSON.stringify(next, null, 2), 'utf8');
    return next;
  } catch (_) {
    return memoryData;
  }
}

function extractOneBotMessageText(rawEvt) {
  if (!rawEvt) return { text: '', replyId: '', hasSticker: false, stickerHint: '' };
  let replyId = '';
  let hasSticker = false;
  let stickerHint = '';
  let textParts = [];

  if (Array.isArray(rawEvt.message)) {
    for (const seg of rawEvt.message) {
      if (!seg || typeof seg !== 'object') continue;
      if (seg.type === 'text') {
        textParts.push(String(seg.data?.text || ''));
      } else if (seg.type === 'reply') {
        replyId = String(seg.data?.id || '');
      } else if (seg.type === 'at') {
        const qq = seg.data?.qq || '';
        textParts.push(`@${qq} `);
      } else if (seg.type === 'image' || seg.type === 'mface') {
        hasSticker = true;
        const summary = String(seg.data?.summary || seg.data?.file || '表情图片');
        stickerHint = summary;
        textParts.push(`[发送了图片或表情：${summary}]`);
      } else if (seg.type === 'face') {
        textParts.push(`[QQ表情${seg.data?.id || ''}]`);
      }
    }
  } else {
    const rawStr = String(rawEvt.raw_message || rawEvt.message || '');
    const repMatch = rawStr.match(/\[CQ:reply,id=([^\],]+)\]/);
    if (repMatch) replyId = repMatch[1];
    if (/\[CQ:image/.test(rawStr)) {
      hasSticker = true;
      stickerHint = '图片或表情包';
    }
    const cleaned = rawStr
      .replace(/\[CQ:reply,id=[^\]]+\]/g, '')
      .replace(/\[CQ:at,qq=([^\],]+)[^\]]*\]/g, '@$1 ')
      .replace(/\[CQ:image,[^\]]*summary=([^,\]]+)[^\]]*\]/g, '[发送了表情：$1]')
      .replace(/\[CQ:image,[^\]]+\]/g, '[发送了图片或表情包]');
    textParts.push(cleaned);
  }

  return {
    text: textParts.join('').trim(),
    replyId,
    hasSticker,
    stickerHint
  };
}

function resolveMemberRealtimeName(groupCfg, senderId, incomingRemark) {
  const sid = String(senderId || '').trim();
  const cleanIncoming = String(incomingRemark || '').trim();
  if (!groupCfg) return cleanIncoming || sid || '群成员';

  if (!groupCfg.memberRemarks) groupCfg.memberRemarks = {};
  if (cleanIncoming && cleanIncoming !== sid) {
    groupCfg.memberRemarks[sid] = cleanIncoming;
  }

  if (Array.isArray(groupCfg.playerBindings)) {
    const bound = groupCfg.playerBindings.find(b => String(b.qq) === sid);
    if (bound) {
      if (cleanIncoming && cleanIncoming !== sid) {
        bound.qqRemark = cleanIncoming;
      }
      if (bound.alias && String(bound.alias).trim()) {
        return String(bound.alias).trim();
      }
      if (bound.qqRemark && String(bound.qqRemark).trim()) {
        return String(bound.qqRemark).trim();
      }
      if (bound.cardName && bound.cardName !== '未绑定角色卡' && bound.cardName !== '未绑角色卡') {
        return String(bound.cardName).trim();
      }
    }
  }

  return cleanIncoming || groupCfg.memberRemarks[sid] || sid || '群成员';
}

function handleIncomingOneBotEvent(data) {
  if (!data || typeof data !== 'object') return;
  if (data.echo && qqBotRuntime.pendingEchoes.has(data.echo)) {
    const pending = qqBotRuntime.pendingEchoes.get(data.echo);
    clearTimeout(pending.timer);
    qqBotRuntime.pendingEchoes.delete(data.echo);
    pending.resolve(data.data !== undefined ? data.data : data);
    return;
  }

  if (data.self_id) {
    qqBotRuntime.selfId = String(data.self_id);
    qqBotRuntime.connected = true;
    qqBotRuntime.lastEventAt = Date.now();
  }

  if (data.post_type === 'meta_event') {
    qqBotRuntime.connected = true;
    qqBotRuntime.lastEventAt = Date.now();
    return;
  }

  if (data.post_type === 'message' && data.message_type === 'group') {
    const groupId = String(data.group_id || '');
    if (!groupId) return;
    const senderId = String(data.user_id || data.sender?.user_id || '');
    // 优先读取AI那个QQ号给该群友设置的好友备注 remark，其次读取群备注 card，再次读取QQ昵称 nickname
    const rawQqRemark = String(
      data.sender?.remark ||
      data.sender?.card ||
      data.sender?.nickname ||
      ''
    ).trim();

    const parsed = extractOneBotMessageText(data);
    if (!parsed.text && !parsed.hasSticker) return;

    const cfg = loadQqBotConfig();
    if (!cfg.groups[groupId]) {
      cfg.groups[groupId] = normalizeGroupConfig(groupId, {
        groupId,
        groupName: String(data.group_name || `QQ群 ${groupId}`),
        enabled: false
      });
    }

    const displayName = resolveMemberRealtimeName(cfg.groups[groupId], senderId, rawQqRemark);
    saveQqBotConfig(cfg);

    const isSelf = Boolean(qqBotRuntime.selfId && senderId === qqBotRuntime.selfId);
    const msgEntry = {
      messageId: String(data.message_id || ('msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6))),
      groupId,
      senderId,
      senderName: displayName,
      qqRemark: rawQqRemark || displayName,
      content: parsed.text,
      rawMessage: parsed.text,
      replyId: parsed.replyId || '',
      hasSticker: parsed.hasSticker,
      stickerHint: parsed.stickerHint || '',
      isBot: isSelf,
      isSelf,
      timestamp: (data.time ? Number(data.time) * 1000 : Date.now())
    };

    appendGroupMessageToDisk(groupId, msgEntry);

    if (!isSelf && cfg.groups[groupId] && cfg.groups[groupId].enabled) {
      qqBotRuntime.pendingGroupEvents.set(groupId, {
        lastMessageAt: Date.now(),
        lastMessageId: msgEntry.messageId,
        lastSenderId: senderId,
        lastSenderName: displayName,
        lastContent: msgEntry.content
      });
    }
  }
}

async function callOneBotApi(action, params = {}) {
  const cfg = loadQqBotConfig();
  const endpoint = String(cfg.onebotUrl || cfg.endpoint || '').trim();
  const token = String(cfg.accessToken || '').trim();

  // 1. 优先通过已连接的反向或正向 WebSocket 发送 OneBot 动作
  let activeWs = null;
  for (const ws of qqBotRuntime.reverseSockets) {
    if (ws.readyState === 1) {
      activeWs = ws;
      break;
    }
  }
  if (!activeWs && qqBotRuntime.forwardSocket && qqBotRuntime.forwardSocket.readyState === 1) {
    activeWs = qqBotRuntime.forwardSocket;
  }

  if (activeWs) {
    const echo = 'echo_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
    return await new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        qqBotRuntime.pendingEchoes.delete(echo);
        reject(new Error(`OneBot WebSocket 动作 ${action} 响应超时`));
      }, 10000);
      qqBotRuntime.pendingEchoes.set(echo, { resolve, reject, timer });
      try {
        activeWs.send(JSON.stringify({ action, params, echo }));
      } catch (err) {
        clearTimeout(timer);
        qqBotRuntime.pendingEchoes.delete(echo);
        reject(err);
      }
    });
  }

  // 2. 若配置的是正向 HTTP 地址，则直接发起 HTTP 请求
  if (/^https?:\/\//i.test(endpoint) && !endpoint.includes('/api/qqbot/ws')) {
    const base = endpoint.replace(/\/+$/, '');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${base}/${action}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
      signal: AbortSignal.timeout(10000)
    });
    if (!res.ok) {
      throw new Error(`OneBot HTTP 状态码 ${res.status}`);
    }
    const json = await res.json();
    if (json && json.status === 'failed') {
      throw new Error(json.msg || json.wording || 'OneBot 接口返回失败');
    }
    qqBotRuntime.connected = true;
    qqBotRuntime.lastEventAt = Date.now();
    return json.data !== undefined ? json.data : json;
  }

  throw new Error('当前未检测到活跃的 OneBot 连接');
}

function connectForwardOneBotWsIfNeeded(endpoint, token) {
  if (!/^wss?:\/\//i.test(endpoint) || endpoint.includes('/api/qqbot/ws')) {
    return;
  }
  try {
    if (qqBotRuntime.forwardSocket) {
      try { qqBotRuntime.forwardSocket.close(); } catch (_) {}
      qqBotRuntime.forwardSocket = null;
    }
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const ws = new WebSocket(endpoint, { headers });
    qqBotRuntime.forwardSocket = ws;
    qqBotRuntime.connectionMode = 'forward_ws';

    ws.on('open', () => {
      qqBotRuntime.connected = true;
      qqBotRuntime.lastEventAt = Date.now();
      qqBotRuntime.lastError = '';
      callOneBotApi('get_login_info', {}).then((info) => {
        if (info && info.user_id) {
          qqBotRuntime.selfId = String(info.user_id);
          qqBotRuntime.nickname = String(info.nickname || '');
        }
      }).catch(() => {});
    });

    ws.on('message', (raw) => {
      try {
        const parsed = JSON.parse(String(raw));
        handleIncomingOneBotEvent(parsed);
      } catch (_) {}
    });

    ws.on('error', (err) => {
      qqBotRuntime.lastError = err.message || '正向 WebSocket 连接错误';
    });

    ws.on('close', () => {
      if (qqBotRuntime.forwardSocket === ws) {
        qqBotRuntime.forwardSocket = null;
        if (qqBotRuntime.reverseSockets.size === 0) {
          qqBotRuntime.connected = false;
        }
      }
    });
  } catch (err) {
    qqBotRuntime.lastError = err.message;
  }
}

app.use('/api/qqbot', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.post('/api/qqbot/webhook', (req, res) => {
  try {
    handleIncomingOneBotEvent(req.body);
    return res.json({ status: 'ok' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/qqbot/state', (req, res) => {
  const cfg = loadQqBotConfig();
  const groupStats = {};
  for (const gid of Object.keys(cfg.groups || {})) {
    const hist = loadGroupHistoryFromDisk(gid, 1);
    const mem = loadGroupMemoryFromDisk(gid);
    const pending = qqBotRuntime.pendingGroupEvents.get(gid) || null;
    const seqSt = qqBotRuntime.groupSeqState.get(gid) || {
      lastMessageSeq: hist.lastSeq || 0,
      lastProcessedSeq: hist.lastSeq || 0,
      lastMessageAt: hist.messages[0]?.timestamp || 0,
      waitingForRpSince: 0,
      idleAsked: false
    };
    groupStats[gid] = {
      totalMessages: hist.total,
      lastMessage: hist.messages[0] || null,
      lastMessageSeq: seqSt.lastMessageSeq || hist.lastSeq || 0,
      lastProcessedSeq: seqSt.lastProcessedSeq || 0,
      lastMessageAt: seqSt.lastMessageAt || hist.messages[0]?.timestamp || 0,
      waitingForRpSince: seqSt.waitingForRpSince || 0,
      idleAsked: Boolean(seqSt.idleAsked),
      memoryUpdatedAt: mem.updatedAt || 0,
      pendingTrigger: pending
    };
  }
  const hasReverse = Array.from(qqBotRuntime.reverseSockets).some(w => w.readyState === 1);
  const hasForward = Boolean(qqBotRuntime.forwardSocket && qqBotRuntime.forwardSocket.readyState === 1);
  const isConn = Boolean(hasReverse || hasForward || qqBotRuntime.connected);
  const statusText = isConn
    ? `已连接 ${qqBotRuntime.selfId || cfg.selfId || 'OneBot'}`
    : '本地待命';
  return res.json({
    ok: true,
    runtime: {
      connected: isConn,
      statusText,
      hasReverseWs: hasReverse,
      hasForwardWs: hasForward,
      selfId: qqBotRuntime.selfId || cfg.selfId || '',
      nickname: qqBotRuntime.nickname || cfg.nickname || '',
      lastEventAt: qqBotRuntime.lastEventAt,
      lastError: qqBotRuntime.lastError,
      groupStats
    },
    config: cfg,
    groupStats
  });
});

app.post('/api/qqbot/config', (req, res) => {
  try {
    const incoming = req.body || {};
    const current = loadQqBotConfig();
    const nextUrl = incoming.onebotUrl || incoming.endpoint || current.onebotUrl;
    const mergedGroups = { ...current.groups };
    if (incoming.groups && typeof incoming.groups === 'object') {
      for (const gid of Object.keys(incoming.groups)) {
        mergedGroups[gid] = normalizeGroupConfig(gid, {
          ...(current.groups[gid] || {}),
          ...incoming.groups[gid]
        });
      }
    }
    const merged = {
      ...current,
      ...incoming,
      onebotUrl: nextUrl,
      endpoint: nextUrl,
      mainApi: { ...current.mainApi, ...(incoming.mainApi || {}) },
      subApi: { ...current.subApi, ...(incoming.subApi || {}) },
      groups: mergedGroups
    };
    saveQqBotConfig(merged);
    if (merged.selfId) qqBotRuntime.selfId = String(merged.selfId);
    if (merged.nickname) qqBotRuntime.nickname = String(merged.nickname);
    return res.json({ ok: true, config: merged });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/api/qqbot/connect', async (req, res) => {
  try {
    const { onebotUrl, endpoint, accessToken, selfId, nickname } = req.body || {};
    const cfg = loadQqBotConfig();
    const targetUrl = String(onebotUrl || endpoint || cfg.onebotUrl || '').trim();
    if (targetUrl) {
      cfg.onebotUrl = targetUrl;
      cfg.endpoint = targetUrl;
    }
    if (accessToken !== undefined) cfg.accessToken = String(accessToken).trim();
    if (selfId !== undefined) cfg.selfId = String(selfId).trim();
    if (nickname !== undefined) cfg.nickname = String(nickname).trim();
    saveQqBotConfig(cfg);

    if (/^wss?:\/\//i.test(cfg.onebotUrl) && !cfg.onebotUrl.includes('/api/qqbot/ws')) {
      connectForwardOneBotWsIfNeeded(cfg.onebotUrl, cfg.accessToken);
      await new Promise(r => setTimeout(r, 600));
    }

    let loginInfo = null;
    try {
      loginInfo = await callOneBotApi('get_login_info', {});
      if (loginInfo && loginInfo.user_id) {
        qqBotRuntime.selfId = String(loginInfo.user_id);
        qqBotRuntime.nickname = String(loginInfo.nickname || cfg.nickname || '');
        cfg.selfId = qqBotRuntime.selfId;
        cfg.nickname = qqBotRuntime.nickname;
        saveQqBotConfig(cfg);
      }
    } catch (apiErr) {
      qqBotRuntime.lastError = apiErr.message;
    }

    const hasReverse = Array.from(qqBotRuntime.reverseSockets).some(w => w.readyState === 1);
    const hasForward = Boolean(qqBotRuntime.forwardSocket && qqBotRuntime.forwardSocket.readyState === 1);
    const isConn = Boolean(hasReverse || hasForward || loginInfo);
    const statusText = isConn
      ? `已连接 ${qqBotRuntime.selfId || cfg.selfId || 'OneBot'}`
      : '监听待命';
    return res.json({
      ok: true,
      connected: isConn,
      selfId: qqBotRuntime.selfId || cfg.selfId,
      nickname: qqBotRuntime.nickname || cfg.nickname,
      runtime: {
        connected: isConn,
        statusText,
        selfId: qqBotRuntime.selfId || cfg.selfId,
        nickname: qqBotRuntime.nickname || cfg.nickname
      },
      message: isConn
        ? `已成功连接 OneBot 节点，当前账号：${qqBotRuntime.nickname || ''} ${qqBotRuntime.selfId || ''}`
        : '反向监听与本地桥接已就绪，等待手机 Termux 协议端接入'
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/api/qqbot/refresh-groups', async (req, res) => {
  try {
    const cfg = loadQqBotConfig();
    let remoteGroups = [];
    let fetchedFromOneBot = false;
    try {
      const list = await callOneBotApi('get_group_list', {});
      if (Array.isArray(list)) {
        remoteGroups = list;
        fetchedFromOneBot = true;
      }
    } catch (_) {}

    remoteGroups.forEach(g => {
      const gid = String(g.group_id || '');
      if (!gid) return;
      const gname = String(g.group_name || `QQ群 ${gid}`);
      if (!cfg.groups[gid]) {
        cfg.groups[gid] = normalizeGroupConfig(gid, {
          groupId: gid,
          groupName: gname,
          enabled: false,
          mode: 'oc_chat'
        });
      } else {
        cfg.groups[gid].groupName = gname;
      }
    });

    saveQqBotConfig(cfg);
    return res.json({
      ok: true,
      fetchedFromOneBot,
      groups: Object.values(cfg.groups),
      groupsMap: cfg.groups,
      count: Object.keys(cfg.groups).length
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// 同步指定QQ群的所有群成员及AI账号给他们改的好友备注与群名片
app.post('/api/qqbot/group/:groupId/sync-members', async (req, res) => {
  try {
    const groupId = String(req.params.groupId || '');
    const cfg = loadQqBotConfig();
    if (!cfg.groups[groupId]) {
      cfg.groups[groupId] = normalizeGroupConfig(groupId, { groupId });
    }
    const gCfg = cfg.groups[groupId];
    if (!gCfg.memberRemarks) gCfg.memberRemarks = {};
    if (!Array.isArray(gCfg.playerBindings)) gCfg.playerBindings = [];

    let friendRemarkMap = {};
    try {
      const friends = await callOneBotApi('get_friend_list', {});
      if (Array.isArray(friends)) {
        friends.forEach(f => {
          const uid = String(f.user_id || '');
          const rem = String(f.remark || '').trim();
          if (uid && rem) friendRemarkMap[uid] = rem;
        });
      }
    } catch (_) {}

    let memberList = [];
    let syncedFromOneBot = false;
    try {
      const rawMembers = await callOneBotApi('get_group_member_list', {
        group_id: Number(groupId) || String(groupId)
      });
      if (Array.isArray(rawMembers)) {
        memberList = rawMembers;
        syncedFromOneBot = true;
      }
    } catch (_) {}

    memberList.forEach(m => {
      const uid = String(m.user_id || '');
      if (!uid || (qqBotRuntime.selfId && uid === qqBotRuntime.selfId)) return;
      const bestRemark = String(
        friendRemarkMap[uid] ||
        m.remark ||
        m.card ||
        m.nickname ||
        uid
      ).trim();
      gCfg.memberRemarks[uid] = bestRemark;

      const existing = gCfg.playerBindings.find(b => String(b.qq) === uid);
      if (existing) {
        existing.qqRemark = bestRemark;
      } else {
        gCfg.playerBindings.push({
          qq: uid,
          alias: '',
          qqRemark: bestRemark,
          slot: '群友',
          cardId: '',
          cardName: '未绑角色卡',
          persona: ''
        });
      }
    });

    // 同时从本地已存聊天记录里提取发言过的群友备注
    const hist = loadGroupHistoryFromDisk(groupId, 200);
    hist.messages.forEach(msg => {
      if (!msg || msg.isSelf || !msg.senderId) return;
      const uid = String(msg.senderId);
      const best = String(friendRemarkMap[uid] || msg.qqRemark || msg.senderName || uid).trim();
      if (best) gCfg.memberRemarks[uid] = best;
      const existing = gCfg.playerBindings.find(b => String(b.qq) === uid);
      if (existing && !existing.qqRemark && best !== uid) {
        existing.qqRemark = best;
      }
    });

    saveQqBotConfig(cfg);
    return res.json({
      ok: true,
      syncedFromOneBot,
      group: gCfg,
      playerBindings: gCfg.playerBindings,
      memberRemarks: gCfg.memberRemarks
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/api/qqbot/group/:groupId/context', (req, res) => {
  try {
    const groupId = String(req.params.groupId || '');
    const limit = Math.max(10, Math.min(800, Number(req.query.limit) || 180));
    const cfg = loadQqBotConfig();
    const gCfg = cfg.groups && cfg.groups[groupId];
    const hist = loadGroupHistoryFromDisk(groupId, limit);
    const messages = hist.messages.map(m => {
      if (m.isSelf) return m;
      const realName = resolveMemberRealtimeName(gCfg, m.senderId, m.qqRemark || m.senderName);
      return {
        ...m,
        senderName: realName
      };
    });
    const memory = loadGroupMemoryFromDisk(groupId);
    const pending = qqBotRuntime.pendingGroupEvents.get(groupId) || null;
    if (req.query.ackPending === '1') {
      qqBotRuntime.pendingGroupEvents.delete(groupId);
    }
    return res.json({
      ok: true,
      groupId,
      totalMessages: hist.total,
      totalStored: hist.total,
      messages,
      memory,
      pending
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/api/qqbot/group/:groupId/memory', (req, res) => {
  try {
    const groupId = String(req.params.groupId || '');
    const { summaryText, ledger, lastSummarizedSeq, summarizedCount } = req.body || {};
    const saved = saveGroupMemoryToDisk(groupId, {
      summaryText: summaryText !== undefined ? summaryText : ledger,
      lastSummarizedSeq: lastSummarizedSeq !== undefined ? lastSummarizedSeq : summarizedCount
    });
    return res.json({ ok: true, memory: saved });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/api/qqbot/group/:groupId/clear', (req, res) => {
  try {
    const groupId = String(req.params.groupId || '');
    const p = getGroupHistoryPath(groupId);
    if (fs.existsSync(p)) {
      fs.writeFileSync(p, '[]', 'utf8');
    }
    qqBotRuntime.pendingGroupEvents.delete(groupId);
    qqBotRuntime.groupSeqState.delete(groupId);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/api/qqbot/simulate', (req, res) => {
  try {
    const {
      groupId,
      senderId = '10001',
      senderName = '早川秋',
      message,
      content = '',
      hasSticker = false,
      stickerHint = ''
    } = req.body || {};
    const gid = String(groupId || '88482026');
    const cfg = loadQqBotConfig();
    const gCfg = cfg.groups && cfg.groups[gid];
    const resolvedName = resolveMemberRealtimeName(gCfg, senderId, senderName);
    if (gCfg) saveQqBotConfig(cfg);

    const text = String(message !== undefined ? message : content);
    const msgEntry = {
      messageId: 'sim_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      groupId: gid,
      senderId: String(senderId),
      senderName: resolvedName,
      qqRemark: String(senderName || resolvedName),
      content: text,
      rawMessage: text,
      replyId: '',
      hasSticker: Boolean(hasSticker),
      stickerHint: String(stickerHint || ''),
      isBot: false,
      isSelf: false,
      timestamp: Date.now()
    };
    const { total, entry } = appendGroupMessageToDisk(gid, msgEntry);
    qqBotRuntime.pendingGroupEvents.set(gid, {
      lastMessageAt: Date.now(),
      lastMessageId: msgEntry.messageId,
      lastSenderId: msgEntry.senderId,
      lastSenderName: resolvedName,
      lastContent: text
    });
    return res.json({ ok: true, message: entry, entry, total });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/api/qqbot/send', async (req, res) => {
  try {
    const {
      targetType = 'group',
      groupId = '',
      userId = '',
      message,
      content = '',
      replyToMessageId = '',
      imageUrl = '',
      stickerName = '',
      botName = '守秘人KP',
      markProcessedSeq,
      waitingForRpSince,
      idleAsked
    } = req.body || {};

    const gid = String(groupId || '');
    if (gid && (markProcessedSeq !== undefined || waitingForRpSince !== undefined || idleAsked !== undefined)) {
      const prevSt = qqBotRuntime.groupSeqState.get(gid) || {
        lastMessageSeq: 0,
        lastProcessedSeq: 0,
        lastMessageAt: 0,
        waitingForRpSince: 0,
        idleAsked: false
      };
      if (markProcessedSeq !== undefined) {
        prevSt.lastProcessedSeq = Math.max(prevSt.lastProcessedSeq || 0, Number(markProcessedSeq) || 0);
      }
      if (waitingForRpSince !== undefined) {
        prevSt.waitingForRpSince = Number(waitingForRpSince) || Date.now();
      }
      if (idleAsked !== undefined) {
        prevSt.idleAsked = Boolean(idleAsked);
      }
      qqBotRuntime.groupSeqState.set(gid, prevSt);
    }

    let rawText = String(message !== undefined ? message : content).trim();
    let finalReplyId = String(replyToMessageId || '').trim();
    const cqReplyMatch = rawText.match(/^\[CQ:reply,id=([^\]]+)\]/);
    if (cqReplyMatch) {
      if (!finalReplyId) finalReplyId = cqReplyMatch[1];
      rawText = rawText.replace(/^\[CQ:reply,id=[^\]]+\]/, '').trim();
    }

    if (!rawText && !imageUrl && !stickerName) {
      return res.json({ ok: true, stateUpdated: true });
    }

    const segments = [];
    if (finalReplyId) {
      segments.push({ type: 'reply', data: { id: String(finalReplyId) } });
    }
    if (rawText) {
      segments.push({ type: 'text', data: { text: rawText } });
    }
    if (imageUrl && String(imageUrl).trim()) {
      let fileVal = String(imageUrl).trim();
      if (fileVal.startsWith('data:image/')) {
        const b64 = fileVal.split(',')[1] || '';
        if (b64) fileVal = 'base64://' + b64;
      }
      segments.push({ type: 'image', data: { file: fileVal } });
    }

    let deliveredToOneBot = false;
    let oneBotError = '';
    try {
      if ((targetType === 'private' || userId) && userId) {
        await callOneBotApi('send_private_msg', {
          user_id: Number(userId) || String(userId),
          message: segments
        });
        deliveredToOneBot = true;
      } else if (gid) {
        await callOneBotApi('send_group_msg', {
          group_id: Number(gid) || String(gid),
          message: segments
        });
        deliveredToOneBot = true;
      }
    } catch (err) {
      oneBotError = err.message;
    }

    if (gid) {
      const cfg = loadQqBotConfig();
      const gCfg = cfg.groups && cfg.groups[gid];
      const displayParts = [];
      if (finalReplyId) displayParts.push(`[引用回复 ${finalReplyId}]`);
      if (userId) {
        const targetDisplay = resolveMemberRealtimeName(gCfg, userId, '');
        displayParts.push(`[小窗私发给 ${targetDisplay}]`);
      }
      if (rawText) displayParts.push(rawText);
      if (stickerName) displayParts.push(`[表情：${stickerName}]`);
      else if (imageUrl) displayParts.push('[发送插图]');

      const joinedText = displayParts.join(' ');
      appendGroupMessageToDisk(gid, {
        messageId: 'bot_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        groupId: gid,
        senderId: qqBotRuntime.selfId || 'BOT',
        senderName: String(botName || qqBotRuntime.nickname || '守秘人KP'),
        content: joinedText,
        rawMessage: joinedText,
        replyId: finalReplyId,
        imageUrl: imageUrl || '',
        isBot: true,
        isSelf: true,
        isPrivateNotice: Boolean(userId),
        timestamp: Date.now()
      });
    }

    return res.json({
      ok: true,
      deliveredToOneBot,
      oneBotError
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

app.use(express.static(__dirname));

// Client-side fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
  const reqUrl = String(req?.url || '');
  const selfIdHeader = req?.headers?.['x-self-id'];
  if (reqUrl.startsWith('/api/qqbot/ws') || selfIdHeader) {
    qqBotRuntime.reverseSockets.add(ws);
    qqBotRuntime.connected = true;
    qqBotRuntime.connectionMode = 'reverse_ws';
    qqBotRuntime.lastEventAt = Date.now();
    if (selfIdHeader) {
      qqBotRuntime.selfId = String(selfIdHeader);
    }
    ws.on('message', (raw) => {
      try {
        const parsed = JSON.parse(String(raw));
        handleIncomingOneBotEvent(parsed);
      } catch (_) {}
    });
    ws.on('close', () => {
      qqBotRuntime.reverseSockets.delete(ws);
      if (qqBotRuntime.reverseSockets.size === 0 && !qqBotRuntime.forwardSocket) {
        qqBotRuntime.connected = false;
      }
    });
    ws.on('error', () => {
      qqBotRuntime.reverseSockets.delete(ws);
    });
    return;
  }

  let boundCode = null;

  ws.on('message', (raw) => {
    try {
      const data = JSON.parse(raw);
      if (data && data.post_type) {
        handleIncomingOneBotEvent(data);
        return;
      }
      if (data.type === 'register') {
        boundCode = data.peerCode ? String(data.peerCode).trim().toUpperCase() : null;
        if (boundCode) {
          if (!peerClients.has(boundCode)) {
            peerClients.set(boundCode, new Set());
          }
          peerClients.get(boundCode).add(ws);
          peerLastPoll.set(boundCode, Date.now());
          if (data.name || data.avatar) {
            peerProfiles.set(boundCode, {
              name: data.name,
              avatar: data.avatar,
              myAvatarFrame: data.myAvatarFrame || '',
              lastSeen: Date.now()
            });
            scheduleSaveMailboxStore();
          }
          const onlineEvt = {
            type: 'peer_presence',
            status: 'online',
            peerCode: boundCode,
            timestamp: Date.now()
          };
          for (const [otherCode, clientSet] of peerClients.entries()) {
            if (otherCode !== boundCode) {
              for (const otherWs of clientSet) {
                if (otherWs.readyState === 1) {
                  try {
                    otherWs.send(JSON.stringify(onlineEvt));
                  } catch (e) {}
                }
              }
            }
          }
          const box = peerMailboxes.get(boundCode) || [];
          if (box.length > 0) {
            box.forEach(evt => ws.send(JSON.stringify(evt)));
          }
        }
      } else if (data.type === 'ack') {
        const targetCode = String(data.peerCode || boundCode || '').trim().toUpperCase();
        if (targetCode) peerLastPoll.set(targetCode, Date.now());
        if (targetCode && Array.isArray(data.eventIds)) {
          ackFromMailbox(targetCode, data.eventIds);
        }
      } else if (data.type === 'peer_ack') {
        const { eventId, ackEventId, fromCode, toCode } = data;
        const normFrom = String(fromCode || boundCode || '').trim().toUpperCase();
        const normTo = String(toCode || '').trim().toUpperCase();
        if (normFrom) peerLastPoll.set(normFrom, Date.now());
        if (normTo) {
          const ackEvt = {
            type: 'peer_ack',
            eventId: eventId || ('evt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)),
            ackEventId,
            fromCode: normFrom,
            toCode: normTo,
            timestamp: Date.now()
          };
          sendToPeerWs(normTo, ackEvt);
          pushToMailbox(normTo, ackEvt);
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
        const normFrom = String(fromCode || boundCode || '').trim().toUpperCase();
        const normTo = String(toCode || '').trim().toUpperCase();
        if (normFrom) peerLastPoll.set(normFrom, Date.now());
        if (normTo) {
          const event = {
            type: 'message',
            eventId: eventId || ('evt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)),
            fromCode: normFrom,
            toCode: normTo,
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
          sendToPeerWs(normTo, event);
          pushToMailbox(normTo, event);
        }
      } else if (data.type === 'profile_update') {
        const { eventId, peerCode, name, avatar, myAvatarFrame, peerAvatarFrame, targetCodes = [] } = data;
        const normCode = String(peerCode || boundCode || '').trim().toUpperCase();
        if (normCode) peerLastPoll.set(normCode, Date.now());
        peerProfiles.set(normCode, { name, avatar, myAvatarFrame, lastSeen: Date.now() });
        scheduleSaveMailboxStore();
        const event = {
          type: 'profile_update',
          eventId: eventId || ('evt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)),
          peerCode: normCode,
          name,
          avatar,
          myAvatarFrame: myAvatarFrame !== undefined ? myAvatarFrame : undefined,
          peerAvatarFrame: peerAvatarFrame !== undefined ? peerAvatarFrame : undefined,
          timestamp: Date.now()
        };
        if (Array.isArray(targetCodes)) {
          targetCodes.forEach(target => {
            const normTarget = String(target).trim().toUpperCase();
            sendToPeerWs(normTarget, event);
            pushToMailbox(normTarget, event);
          });
        }
      } else if (data.type === 'friend_request' || data.type === 'friend_accept') {
        const { eventId, fromCode, toCode, fromName, fromAvatar, fromAvatarFrame } = data;
        const normFrom = String(fromCode || boundCode || '').trim().toUpperCase();
        const normTo = String(toCode || '').trim().toUpperCase();
        if (normFrom) peerLastPoll.set(normFrom, Date.now());
        const event = {
          type: data.type,
          eventId: eventId || ('evt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)),
          fromCode: normFrom,
          toCode: normTo,
          fromName,
          fromAvatar,
          fromAvatarFrame: fromAvatarFrame || '',
          timestamp: Date.now()
        };
        sendToPeerWs(normTo, event);
        pushToMailbox(normTo, event);
      } else if (data.type === 'online_ping' || data.type === 'online_pong' || data.type === 'offline_ping') {
        const normFrom = String(data.fromCode || boundCode || '').trim().toUpperCase();
        const normTo = String(data.toCode || '').trim().toUpperCase();
        if (normFrom) {
          if (data.type === 'offline_ping') {
            peerLastPoll.delete(normFrom);
            if (peerClients.has(normFrom)) {
              peerClients.delete(normFrom);
            }
          } else {
            peerLastPoll.set(normFrom, Date.now());
          }
        }
        if (normTo) {
          const pingEvt = {
            type: data.type,
            eventId: data.eventId || ('ping_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)),
            fromCode: normFrom,
            toCode: normTo,
            timestamp: Date.now()
          };
          const delivered = sendToPeerWs(normTo, pingEvt);
          if (!delivered) {
            pushPresenceToMailbox(normTo, pingEvt);
          }
        }
      } else if (data.toCode) {
        const normFrom = String(data.fromCode || boundCode || '').trim().toUpperCase();
        const normTo = String(data.toCode || '').trim().toUpperCase();
        if (normFrom) peerLastPoll.set(normFrom, Date.now());
        const customEvent = {
          ...data,
          fromCode: normFrom || data.fromCode,
          toCode: normTo,
          eventId: data.eventId || ('evt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)),
          timestamp: data.timestamp || Date.now()
        };
        sendToPeerWs(normTo, customEvent);
        pushToMailbox(normTo, customEvent);
      }
    } catch (e) {
      console.warn('[WS] Parse error:', e.message);
    }
  });

  ws.on('error', (err) => {
    console.warn('[WS] Client socket error:', err.message);
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

wss.on('error', (err) => {
  console.warn('[WSS] Server error:', err.message);
});

process.on('uncaughtException', (err) => {
  console.error('[Server] Uncaught exception:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Server] Unhandled rejection:', reason);
});

server.timeout = 600000;
server.requestTimeout = 600000;
server.headersTimeout = 610000;
server.keepAliveTimeout = 600000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
});



