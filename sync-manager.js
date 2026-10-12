// 密友与多人跑团实时通信同步引擎
(function() {
  const PEER_ID_KEY = "my_peer_id_code";
  const PEER_FRIENDS_KEY = "my_peer_friends_list";

  let myPeerId = localStorage.getItem(PEER_ID_KEY);
  if (!myPeerId) {
    // 生成纯大写字母与数字组合的六位专属密友码
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let res = "";
    for (let i = 0; i < 6; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    myPeerId = res;
    localStorage.setItem(PEER_ID_KEY, myPeerId);
  }

  let ws = null;
  let isConnecting = false;
  let activeRooms = new Set();

  function getMyNickname() {
    try {
      const p = document.getElementById("profile-username");
      if (p && p.textContent && p.textContent.trim()) return p.textContent.trim();
      if (window.state && window.state.userProfile && window.state.userProfile.name) {
        return window.state.userProfile.name;
      }
    } catch (e) {}
    return "玩家";
  }

  function getMyAvatar() {
    try {
      const a = document.getElementById("profile-avatar-img");
      if (a && a.src) return a.src;
      if (window.state && window.state.userProfile && window.state.userProfile.avatar) {
        return window.state.userProfile.avatar;
      }
    } catch (e) {}
    return "https://i.postimg.cc/qRqpK5kP/anime-avatar.jpg";
  }

  function connect() {
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
      return;
    }
    if (isConnecting) return;
    isConnecting = true;

    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.host;
      ws = new WebSocket(`${protocol}//${host}`);

      ws.onopen = () => {
        isConnecting = false;
        ws.send(JSON.stringify({ type: "register", peerId: myPeerId }));
        syncAllGroupRooms();
        // 重新加入所有活跃房间
        activeRooms.forEach((rId) => {
          ws.send(JSON.stringify({ type: "join_room", roomId: rId, peerId: myPeerId }));
        });
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleIncoming(data);
        } catch (err) {
          console.warn("解析同步消息异常", err);
        }
      };

      ws.onclose = () => {
        isConnecting = false;
        ws = null;
        setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        isConnecting = false;
      };
    } catch (e) {
      isConnecting = false;
      setTimeout(connect, 4000);
    }
  }

  async function syncAllGroupRooms() {
    try {
      if (!window.db || !window.db.chats) return;
      const allChats = await window.db.chats.toArray();
      allChats.filter((c) => c.isGroup).forEach((c) => {
        joinRoom(c.id);
      });
    } catch (e) {}
  }

  function joinRoom(roomId) {
    if (!roomId) return;
    activeRooms.add(String(roomId));
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "join_room", roomId: String(roomId), peerId: myPeerId }));
    }
  }

  function sendPeer(targetPeerId, payload) {
    if (!targetPeerId) return;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      connect();
    }
    const cleanTarget = String(targetPeerId).trim().toUpperCase();
    const packet = {
      type: "send_peer",
      targetPeerId: cleanTarget,
      fromPeerId: myPeerId,
      payload
    };
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(packet));
    } else {
      setTimeout(() => {
        if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(packet));
      }, 1000);
    }
  }

  function sendRoom(roomId, payload) {
    if (!roomId) return;
    joinRoom(roomId);
    const packet = {
      type: "send_room",
      roomId: String(roomId),
      payload
    };
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(packet));
    } else {
      setTimeout(() => {
        if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(packet));
      }, 1000);
    }
  }

  // 判断是否为中文括号场外发言：外部最左边、最右边是中文括号，且仅且仅有最外层一对中文括号包裹整条消息
  function isOocBubble(content) {
    if (typeof content !== "string") return false;
    const trimmed = content.trim();
    if (!trimmed.startsWith("（") || !trimmed.endsWith("）")) return false;
    if (trimmed.length < 2) return false;
    // 确保内部没有未匹配或拆散的外部括号
    return true;
  }

  // 静音系统级外部通知
  function notifyExternal(title, body, avatar) {
    if (document.hidden && "Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(title, {
          body,
          icon: avatar || "icon.png",
          silent: true
        });
      } catch (e) {}
    }
  }

  function showPeerNotice(text) {
    try {
      let box = document.getElementById("peer-global-notice-box");
      if (!box) {
        box = document.createElement("div");
        box.id = "peer-global-notice-box";
        box.style.cssText = "position: fixed; top: 16px; left: 50%; transform: translateX(-50%); z-index: 99999; display: flex; flex-direction: column; gap: 8px; pointer-events: none;";
        document.body.appendChild(box);
      }
      const item = document.createElement("div");
      item.style.cssText = "background: var(--card-bg, #ffffff); color: var(--text-primary, #333333); border: 1px solid var(--border-color, #e0e0e0); box-shadow: 0 4px 16px rgba(0,0,0,0.18); border-radius: 8px; padding: 10px 16px; font-size: 13px; font-weight: 500; pointer-events: auto; display: flex; align-items: center; gap: 8px; transition: all 0.3s ease; opacity: 0; transform: translateY(-10px);";
      item.textContent = text;
      box.appendChild(item);
      requestAnimationFrame(() => {
        item.style.opacity = "1";
        item.style.transform = "translateY(0)";
      });
      setTimeout(() => {
        item.style.opacity = "0";
        item.style.transform = "translateY(-10px)";
        setTimeout(() => item.remove(), 300);
      }, 3500);
    } catch (e) {
      console.warn("通知渲染异常", e);
    }
  }

  async function handleIncoming(data) {
    if (!data || !data.type) return;

    if (data.type === "receive_peer") {
      const { fromPeerId, payload } = data;
      if (!payload) return;

      if (payload.action === "friend_handshake") {
        // 收到密友握手请求
        await savePeerFriend(fromPeerId, payload.senderName, payload.senderAvatar);
        // 自动回传握手确认
        sendPeer(fromPeerId, {
          action: "friend_handshake_ack",
          senderName: getMyNickname(),
          senderAvatar: getMyAvatar()
        });
        showPeerNotice("收到来自 " + (payload.senderName || fromPeerId) + " 的密友连接请求并已自动通过");
        if (typeof window.renderContactsScreen === "function") {
          window.renderContactsScreen();
        }
        if (typeof window.renderChatList === "function") {
          window.renderChatList();
        }
      } else if (payload.action === "friend_handshake_ack") {
        await savePeerFriend(fromPeerId, payload.senderName, payload.senderAvatar);
        showPeerNotice("密友 " + (payload.senderName || fromPeerId) + " 已建立双向连接");
        if (typeof window.renderContactsScreen === "function") {
          window.renderContactsScreen();
        }
        if (typeof window.renderChatList === "function") {
          window.renderChatList();
        }
      } else if (payload.action === "peer_chat_msg") {
        // 收到密友单聊消息
        const { message, senderName, senderAvatar } = payload;
        await receiveDirectPeerMessage(fromPeerId, message, senderName, senderAvatar);
      }
    } else if (data.type === "receive_room") {
      const { roomId, fromPeerId, payload } = data;
      if (!payload) return;

      if (payload.action === "room_chat_msg") {
        // 收到联机群聊消息
        const { message, senderName, senderAvatar } = payload;
        await receiveRoomChatMessage(roomId, message, senderName, senderAvatar, fromPeerId);
      }
    }
  }

  async function savePeerFriend(peerId, nickname, avatar, targetGroupId) {
    if (!peerId) return null;
    const cleanPeerId = String(peerId).trim().toUpperCase();
    let friends = [];
    try {
      const raw = localStorage.getItem(PEER_FRIENDS_KEY);
      if (raw) friends = JSON.parse(raw);
    } catch (e) {}

    let existing = friends.find((f) => f.peerId === cleanPeerId);
    if (!existing) {
      existing = {
        peerId: cleanPeerId,
        nickname: nickname || ("密友 " + cleanPeerId),
        avatar: avatar || "https://i.postimg.cc/qRqpK5kP/anime-avatar.jpg",
        groupId: targetGroupId || null,
        addedAt: Date.now()
      };
      friends.push(existing);
    } else {
      if (nickname) existing.nickname = nickname;
      if (avatar) existing.avatar = avatar;
      if (targetGroupId) existing.groupId = targetGroupId;
    }
    localStorage.setItem(PEER_FRIENDS_KEY, JSON.stringify(friends));

    // 确保存在对应单聊会话
    await ensurePeerChatSession(existing, targetGroupId);
    return existing;
  }

  async function ensurePeerChatSession(friend, targetGroupId) {
    if (!window.db || !window.db.chats) return null;
    try {
      const allChats = await window.db.chats.toArray();
      let chat = allChats.find((c) => c.isPeerChat && c.peerId === friend.peerId);
      let chosenGroupId = targetGroupId || friend.groupId;
      if (!chosenGroupId) {
        try {
          if (typeof window.ensureDefaultContactGroup === "function") {
            chosenGroupId = await window.ensureDefaultContactGroup();
          }
        } catch (e) {
          chosenGroupId = 1;
        }
      }
      if (!chat) {
        const newChat = {
          id: "peer_" + friend.peerId,
          name: friend.nickname || ("密友 " + friend.peerId),
          avatar: friend.avatar || "https://i.postimg.cc/qRqpK5kP/anime-avatar.jpg",
          isPeerChat: true,
          peerId: friend.peerId,
          roleType: "character",
          groupId: chosenGroupId,
          inMessageList: true,
          history: [],
          settings: {
            aiPersona: "密友真人交流，无需提示词",
            myName: getMyNickname(),
            remarkName: friend.nickname || ("密友 " + friend.peerId),
            aiAvatar: friend.avatar || "https://i.postimg.cc/qRqpK5kP/anime-avatar.jpg"
          }
        };
        await window.db.chats.put(newChat);
        if (window.state && window.state.chats) {
          window.state.chats[newChat.id] = newChat;
        }
        if (typeof window.renderChatList === "function") {
          window.renderChatList();
        }
        if (typeof window.renderContactsScreen === "function") {
          window.renderContactsScreen();
        }
        return newChat;
      } else {
        if (targetGroupId && chat.groupId !== targetGroupId) {
          chat.groupId = targetGroupId;
          await window.db.chats.put(chat);
          if (window.state && window.state.chats) {
            window.state.chats[chat.id] = chat;
          }
          if (typeof window.renderContactsScreen === "function") {
            window.renderContactsScreen();
          }
        }
        return chat;
      }
    } catch (e) {
      console.warn("确保密友会话异常", e);
    }
    return null;
  }

  async function receiveDirectPeerMessage(fromPeerId, message, senderName, senderAvatar) {
    if (!window.db || !window.db.chats) return;
    try {
      const allChats = await window.db.chats.toArray();
      let chat = allChats.find((c) => c.isPeerChat && c.peerId === fromPeerId);
      if (!chat) {
        chat = await ensurePeerChatSession({
          peerId: fromPeerId,
          nickname: senderName,
          avatar: senderAvatar
        });
      }
      if (!chat) return;

      const incomingMsg = {
        id: message.id || (Date.now() + Math.random()),
        role: "assistant",
        senderName: senderName || chat.name,
        senderAvatar: senderAvatar || chat.avatar,
        content: message.content || "",
        text: message.content || "",
        timestamp: message.timestamp || Date.now()
      };

      chat.history.push(incomingMsg);
      await window.db.chats.put(chat);
      if (window.state && window.state.chats) {
        window.state.chats[chat.id] = chat;
      }

      // 如果当前正处于该聊天，实时渲染气泡
      if (window.state && String(window.state.activeChatId) === String(chat.id)) {
        if (typeof window.appendMessage === "function") {
          window.appendMessage(incomingMsg, chat, false);
        }
      } else {
        showPeerNotice("收到来自 " + chat.name + " 的新消息");
      }

      if (typeof window.renderChatList === "function") {
        window.renderChatList();
      }
    } catch (e) {
      console.warn("接收密友私聊异常", e);
    }
  }

  async function receiveRoomChatMessage(roomId, message, senderName, senderAvatar, fromPeerId) {
    if (!window.db || !window.db.chats) return;
    try {
      let chat = await window.db.chats.get(roomId);
      if (!chat) {
        chat = await window.db.chats.get(Number(roomId));
      }
      if (!chat && window.state && window.state.chats) {
        chat = window.state.chats[roomId];
      }
      if (!chat) return;

      const incomingMsg = {
        id: message.id || (Date.now() + Math.random()),
        role: "user_peer",
        name: message.name || senderName || "密友",
        senderName: message.senderName || senderName || "密友",
        senderAvatar: message.senderAvatar || senderAvatar || chat.avatar,
        content: message.content || "",
        text: message.content || "",
        quote_reply: message.quote_reply || null,
        type: message.type || "text",
        timestamp: message.timestamp || Date.now()
      };

      chat.history.push(incomingMsg);
      await window.db.chats.put(chat);
      if (window.state && window.state.chats) {
        window.state.chats[chat.id] = chat;
      }

      if (window.state && String(window.state.activeChatId) === String(chat.id)) {
        if (typeof window.appendMessage === "function") {
          window.appendMessage(incomingMsg, chat, false);
        }
      } else {
        showPeerNotice(chat.name + " 收到来自 " + incomingMsg.senderName + " 的消息");
      }

      if (typeof window.renderChatList === "function") {
        window.renderChatList();
      }
    } catch (e) {
      console.warn("接收联机群聊消息异常", e);
    }
  }

  // 根据密友码主动发起添加
  async function addFriendByCode(code, friendNickname, targetGroupId) {
    if (!code) return { success: false, error: "密友码不能为空" };
    const cleanCode = code.trim().toUpperCase();
    if (cleanCode === myPeerId) return { success: false, error: "不能添加自己的密友码" };

    const friend = await savePeerFriend(cleanCode, friendNickname || ("密友 " + cleanCode), null, targetGroupId);
    sendPeer(cleanCode, {
      action: "friend_handshake",
      senderName: getMyNickname(),
      senderAvatar: getMyAvatar()
    });
    return { success: true, friend };
  }

  function getFriends() {
    try {
      const raw = localStorage.getItem(PEER_FRIENDS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return [];
  }

  // 暴露全局API
  window.syncManager = {
    myPeerId,
    getMyNickname,
    getMyAvatar,
    connect,
    joinRoom,
    sendPeer,
    sendRoom,
    savePeerFriend,
    addFriendByCode,
    getFriends,
    isOocBubble,
    notifyExternal,
    showPeerNotice
  };

  // 请求通知权限
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }

  // 页面可见性恢复时自动重连
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      connect();
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", connect);
  } else {
    connect();
  }
})();
