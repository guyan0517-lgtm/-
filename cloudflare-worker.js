// Cloudflare Worker 免费中转服务端脚本
// 若未来将纯网页导出到没有后端的静态环境，可将此文件代码部署至 Cloudflare Workers 免费运行

const peerMailboxes = new Map();
const peerProfiles = new Map();

function getCorsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: getCorsHeaders() });
    }

    if (url.pathname === "/api/peer/register" && request.method === "POST") {
      try {
        const body = await request.json();
        const { peerCode, name, avatar } = body;
        if (!peerCode) {
          return new Response(JSON.stringify({ error: "Missing peerCode" }), { status: 400, headers: getCorsHeaders() });
        }
        peerProfiles.set(peerCode, { name, avatar, lastSeen: Date.now() });
        return new Response(JSON.stringify({ success: true }), { headers: getCorsHeaders() });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: getCorsHeaders() });
      }
    }

    if (url.pathname === "/api/peer/send" && request.method === "POST") {
      try {
        const body = await request.json();
        const { fromCode, toCode, content, senderName, senderAvatar, timestamp } = body;
        if (!toCode || !content) {
          return new Response(JSON.stringify({ error: "Missing target or content" }), { status: 400, headers: getCorsHeaders() });
        }
        const event = {
          type: "message",
          fromCode,
          toCode,
          content,
          senderName,
          senderAvatar,
          timestamp: timestamp || Date.now()
        };
        if (!peerMailboxes.has(toCode)) {
          peerMailboxes.set(toCode, []);
        }
        const box = peerMailboxes.get(toCode);
        box.push(event);
        if (box.length > 50) box.shift();
        return new Response(JSON.stringify({ success: true, delivered: true }), { headers: getCorsHeaders() });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: getCorsHeaders() });
      }
    }

    if (url.pathname === "/api/peer/profile" && request.method === "POST") {
      try {
        const body = await request.json();
        const { peerCode, name, avatar, targetCodes = [] } = body;
        if (!peerCode) {
          return new Response(JSON.stringify({ error: "Missing peerCode" }), { status: 400, headers: getCorsHeaders() });
        }
        peerProfiles.set(peerCode, { name, avatar, lastSeen: Date.now() });
        const event = {
          type: "profile_update",
          peerCode,
          name,
          avatar,
          timestamp: Date.now()
        };
        if (Array.isArray(targetCodes)) {
          for (const target of targetCodes) {
            if (!peerMailboxes.has(target)) peerMailboxes.set(target, []);
            const box = peerMailboxes.get(target);
            box.push(event);
            if (box.length > 50) box.shift();
          }
        }
        return new Response(JSON.stringify({ success: true }), { headers: getCorsHeaders() });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: getCorsHeaders() });
      }
    }

    if (url.pathname === "/api/peer/request" && request.method === "POST") {
      try {
        const body = await request.json();
        const { fromCode, toCode, fromName, fromAvatar } = body;
        if (!toCode) {
          return new Response(JSON.stringify({ error: "Missing target" }), { status: 400, headers: getCorsHeaders() });
        }
        const event = {
          type: "friend_request",
          fromCode,
          toCode,
          fromName,
          fromAvatar,
          timestamp: Date.now()
        };
        if (!peerMailboxes.has(toCode)) peerMailboxes.set(toCode, []);
        const box = peerMailboxes.get(toCode);
        box.push(event);
        if (box.length > 50) box.shift();
        return new Response(JSON.stringify({ success: true }), { headers: getCorsHeaders() });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: getCorsHeaders() });
      }
    }

    if (url.pathname === "/api/peer/poll" && request.method === "GET") {
      const code = url.searchParams.get("code");
      if (!code) {
        return new Response(JSON.stringify({ error: "Missing code" }), { status: 400, headers: getCorsHeaders() });
      }
      const events = peerMailboxes.get(code) || [];
      peerMailboxes.set(code, []);
      const profile = peerProfiles.get(code) || null;
      return new Response(JSON.stringify({ success: true, events, profile }), { headers: getCorsHeaders() });
    }

    return new Response(JSON.stringify({ status: "running" }), { headers: getCorsHeaders() });
  }
};
