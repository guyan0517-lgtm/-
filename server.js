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



