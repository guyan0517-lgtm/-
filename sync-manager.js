// 密友与多人跑团实时通信同步引擎
(function() {
  const PEER_ID_KEY = "my_peer_id_code";
  const PEER_FRIENDS_KEY = "my_peer_friends_list";
  const PENDING_REQUESTS_KEY = "pending_peer_outgoing";

  let myPeerId = localStorage.getItem(PEER_ID_KEY);
  if (!myPeerId) {
    myPeerId = generateRandomPeerCode();
    localStorage.setItem(PEER_ID_KEY, myPeerId);
  }

  function generateRandomPeerCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let res = "";
    for (let i = 0; i < 6; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
  }

  function regenerateMyPeerId() {
    myPeerId = generateRandomPeerCode();
    localStorage.setItem(PEER_ID_KEY, myPeerId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "register", peerId: myPeerId }));
    }
    return myPeerId;
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

      if (payload.action === "friend_request") {
        // 收到密友申请，弹出确认弹窗
        showPeerRequestModal(fromPeerId, payload.senderName, payload.senderAvatar);
      } else if (payload.action === "friend_request_accept") {
        // 对方同意了好友申请
        let pending = {};
        try { pending = JSON.parse(localStorage.getItem(PENDING_REQUESTS_KEY) || "{}"); } catch (_) {}
        const pInfo = pending[fromPeerId] || {};
        const chosenNickname = payload.senderName || pInfo.friendNickname || ("密友 " + fromPeerId);
        const chosenGroupId = pInfo.targetGroupId || null;

        await savePeerFriend(fromPeerId, chosenNickname, payload.senderAvatar, chosenGroupId);
        delete pending[fromPeerId];
        localStorage.setItem(PENDING_REQUESTS_KEY, JSON.stringify(pending));

        showPeerNotice((payload.senderName || fromPeerId) + " 已同意密友申请，连线成功");
        if (typeof window.renderContactsScreen === "function") {
          window.renderContactsScreen();
        }
        if (typeof window.renderChatList === "function") {
          window.renderChatList();
        }
      } else if (payload.action === "friend_request_reject") {
        let pending = {};
        try { pending = JSON.parse(localStorage.getItem(PENDING_REQUESTS_KEY) || "{}"); } catch (_) {}
        delete pending[fromPeerId];
        localStorage.setItem(PENDING_REQUESTS_KEY, JSON.stringify(pending));
        showPeerNotice((payload.senderName || fromPeerId) + " 拒绝了你的密友申请");
      } else if (payload.action === "peer_profile_update") {
        // 对方修改了头像或昵称，本地自动同步
        await updatePeerProfile(fromPeerId, payload.senderName, payload.senderAvatar);
      } else if (payload.action === "peer_chat_msg") {
        // 收到密友单聊消息
        const { message, senderName, senderAvatar } = payload;
        await receiveDirectPeerMessage(fromPeerId, message, senderName, senderAvatar);
      }
    } else if (data.type === "receive_room") {
      const { roomId, fromPeerId, payload } = data;
      if (!payload) return;

      if (payload.action === "room_chat_msg") {
        const { message, senderName, senderAvatar } = payload;
        await receiveRoomChatMessage(roomId, message, senderName, senderAvatar, fromPeerId);
      }
    }
  }

  async function showPeerRequestModal(fromPeerId, senderName, senderAvatar) {
    const modal = document.getElementById("peer-request-modal");
    if (!modal) {
      const autoConfirm = confirm("收到来自 " + (senderName || fromPeerId) + " 的密友申请，是否同意连线？");
      if (autoConfirm) {
        await acceptPeerRequest(fromPeerId, senderName, senderAvatar, null);
      } else {
        rejectPeerRequest(fromPeerId);
      }
      return;
    }

    const avEl = document.getElementById("peer-request-avatar");
    const nameEl = document.getElementById("peer-request-name");
    const codeEl = document.getElementById("peer-request-code");
    const groupSelect = document.getElementById("peer-request-group-select");
    const acceptBtn = document.getElementById("peer-request-accept-btn");
    const rejectBtn = document.getElementById("peer-request-reject-btn");

    if (avEl) avEl.src = senderAvatar || "https://i.postimg.cc/qRqpK5kP/anime-avatar.jpg";
    if (nameEl) nameEl.textContent = senderName || ("密友 " + fromPeerId);
    if (codeEl) codeEl.textContent = "密友码: " + fromPeerId;

    if (groupSelect && window.db && window.db.qzoneGroups) {
      groupSelect.innerHTML = "";
      try {
        const groups = await window.db.qzoneGroups.toArray();
        groups.sort((a, b) => (a.order || 0) - (b.order || 0));
        groups.forEach((g) => {
          const opt = document.createElement("option");
          opt.value = g.id;
          opt.textContent = g.name;
          groupSelect.appendChild(opt);
        });
      } catch (e) {}
    }

    if (acceptBtn) {
      acceptBtn.onclick = async () => {
        let chosenGroupId = groupSelect ? groupSelect.value : null;
        if (chosenGroupId && !isNaN(chosenGroupId)) chosenGroupId = Number(chosenGroupId);
        await acceptPeerRequest(fromPeerId, senderName, senderAvatar, chosenGroupId);
        modal.style.display = "none";
        modal.classList.remove("visible");
      };
    }

    if (rejectBtn) {
      rejectBtn.onclick = () => {
        rejectPeerRequest(fromPeerId);
        modal.style.display = "none";
        modal.classList.remove("visible");
      };
    }

    modal.style.display = "flex";
    modal.classList.add("visible");
  }

  async function acceptPeerRequest(fromPeerId, senderName, senderAvatar, chosenGroupId) {
    const friend = await savePeerFriend(fromPeerId, senderName, senderAvatar, chosenGroupId);
    sendPeer(fromPeerId, {
      action: "friend_request_accept",
      senderPeerId: myPeerId,
      senderName: getMyNickname(),
      senderAvatar: getMyAvatar()
    });
    showPeerNotice("已同意与 " + (senderName || fromPeerId) + " 建立密友连线");
    if (typeof window.renderContactsScreen === "function") window.renderContactsScreen();
    if (typeof window.renderChatList === "function") window.renderChatList();
    return friend;
  }

  function rejectPeerRequest(fromPeerId) {
    sendPeer(fromPeerId, {
      action: "friend_request_reject",
      senderPeerId: myPeerId,
      senderName: getMyNickname()
    });
    showPeerNotice("已拒绝密友申请");
  }

  async function sendFriendRequest(code, friendNickname, targetGroupId) {
    if (!code) return { success: false, error: "密友码不能为空" };
    const cleanCode = code.trim().toUpperCase();
    if (cleanCode === myPeerId) return { success: false, error: "不能添加自己的密友码" };

    let pending = {};
    try { pending = JSON.parse(localStorage.getItem(PENDING_REQUESTS_KEY) || "{}"); } catch (_) {}
    pending[cleanCode] = {
      friendNickname: friendNickname || ("密友 " + cleanCode),
      targetGroupId: targetGroupId || null,
      time: Date.now()
    };
    localStorage.setItem(PENDING_REQUESTS_KEY, JSON.stringify(pending));

    sendPeer(cleanCode, {
      action: "friend_request",
      senderPeerId: myPeerId,
      senderName: getMyNickname(),
      senderAvatar: getMyAvatar()
    });

    return { success: true };
  }

  async function updatePeerProfile(peerId, newName, newAvatar) {
    if (!peerId) return;
    const cleanPeerId = String(peerId).trim().toUpperCase();
    let friends = getFriends();
    const f = friends.find((item) => item.peerId === cleanPeerId);
    if (f) {
      if (newName) f.nickname = newName;
      if (newAvatar) f.avatar = newAvatar;
      localStorage.setItem(PEER_FRIENDS_KEY, JSON.stringify(friends));
    }

    if (!window.db || !window.db.chats) return;
    try {
      const allChats = await window.db.chats.toArray();
      const chat = allChats.find((c) => c.isPeerChat && c.peerId === cleanPeerId);
      if (chat) {
        if (newName) {
          chat.name = newName;
          if (chat.settings) chat.settings.aiName = newName;
        }
        if (newAvatar) {
          chat.avatar = newAvatar;
          if (chat.settings) chat.settings.aiAvatar = newAvatar;
        }
        await window.db.chats.put(chat);
        if (window.state && window.state.chats) {
          window.state.chats[chat.id] = chat;
        }
        if (typeof window.renderContactsScreen === "function") window.renderContactsScreen();
        if (typeof window.renderChatList === "function") window.renderChatList();
        if (window.state && String(window.state.activeChatId) === String(chat.id)) {
          const hTitle = document.getElementById("chat-header-title");
          if (hTitle && newName) hTitle.textContent = newName;
          if (newAvatar) {
            const aiImgs = document.querySelectorAll(".message-wrapper.ai .avatar, .message-wrapper.ai .avatar-img");
            aiImgs.forEach((img) => { img.src = newAvatar; });
          }
        }
      }
    } catch (e) {
      console.warn("更新密友资料异常", e);
    }
  }

  function broadcastMyProfileUpdate(overrideName, overrideAvatar) {
    const friends = getFriends();
    if (!friends || friends.length === 0) return;
    const nickname = overrideName || getMyNickname();
    const avatar = overrideAvatar || getMyAvatar();
    friends.forEach((f) => {
      sendPeer(f.peerId, {
        action: "peer_profile_update",
        senderPeerId: myPeerId,
        senderName: nickname,
        senderAvatar: avatar
      });
    });
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
        if (friend.avatar) {
          chat.avatar = friend.avatar;
          if (chat.settings) chat.settings.aiAvatar = friend.avatar;
        }
        if (friend.nickname) {
          chat.name = friend.nickname;
        }
        if (targetGroupId && chat.groupId !== targetGroupId) {
          chat.groupId = targetGroupId;
        }
        await window.db.chats.put(chat);
        if (window.state && window.state.chats) {
          window.state.chats[chat.id] = chat;
        }
        if (typeof window.renderContactsScreen === "function") {
          window.renderContactsScreen();
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

      if (senderAvatar && senderAvatar !== chat.avatar) {
        chat.avatar = senderAvatar;
        if (chat.settings) chat.settings.aiAvatar = senderAvatar;
      }
      if (senderName && senderName !== chat.name) {
        chat.name = senderName;
      }

      const incomingMsg = {
        id: message.id || (Date.now() + Math.random()),
        role: "assistant",
        senderName: senderName || chat.name,
        senderAvatar: senderAvatar || chat.avatar,
        content: message.content || "",
        text: message.content || "",
        quote: message.quote_reply || null,
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
        chat.unreadCount = (chat.unreadCount || 0) + 1;
        await window.db.chats.put(chat);
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

  function getFriends() {
    try {
      const raw = localStorage.getItem(PEER_FRIENDS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return [];
  }

  function applyPeerChatInterfaceConstraints(chat) {
    const isPeer = !!(chat && (chat.isPeerChat || String(chat.id).startsWith("peer_")));
    const waitBtn = document.getElementById("wait-reply-btn");
    if (waitBtn) {
      waitBtn.style.display = isPeer ? "none" : "";
    }
    const heartBtn = document.getElementById("char-heart-btn");
    if (heartBtn && isPeer) {
      heartBtn.style.display = "none";
    }
    const groupAffectionBtn = document.getElementById("group-affection-btn");
    if (groupAffectionBtn && isPeer) {
      groupAffectionBtn.style.display = "none";
    }
  }

  function applyPeerSettingsModalConstraints(chat) {
    const isPeer = !!(chat && (chat.isPeerChat || String(chat.id).startsWith("peer_")));
    const modal = document.getElementById("chat-settings-modal");
    if (!modal) return;

    // AI 相关卡片与功能在密友设置中隐藏
    const aiSelectors = [
      "#offline-mode-section",
      "#couple-avatar-group",
      "#streak-settings-section",
      "#world-book-link-group",
      "#manual-summary-btn",
      "#manage-ai-inventory-btn",
      "#group-chat-affection-section",
      "#chat-ai-music-group",
      "#chat-ai-music-style-group",
      "#voice-mode-btn",
      "#minimax-voice-id-group"
    ];

    aiSelectors.forEach((sel) => {
      const el = modal.querySelector(sel);
      if (el) el.style.display = isPeer ? "none" : "";
    });

    // 对方头像不可由本地修改（密友头像由对方设置）
    const aiAvatarContainer = document.getElementById("ai-avatar-preview")?.parentElement;
    let tipEl = document.getElementById("peer-avatar-readonly-tip");
    if (isPeer) {
      if (aiAvatarContainer) {
        aiAvatarContainer.style.pointerEvents = "none";
        aiAvatarContainer.style.opacity = "0.85";
      }
      if (!tipEl && aiAvatarContainer) {
        tipEl = document.createElement("div");
        tipEl.id = "peer-avatar-readonly-tip";
        tipEl.style.cssText = "font-size: 11px; color: var(--text-secondary); text-align: center; margin-top: 4px;";
        tipEl.textContent = "对方头像由密友自行设定";
        aiAvatarContainer.parentElement.appendChild(tipEl);
      } else if (tipEl) {
        tipEl.style.display = "block";
      }
    } else {
      if (aiAvatarContainer) {
        aiAvatarContainer.style.pointerEvents = "";
        aiAvatarContainer.style.opacity = "";
      }
      if (tipEl) tipEl.style.display = "none";
    }
  }

  // 暴露全局API
  window.syncManager = {
    myPeerId,
    regenerateMyPeerId,
    getMyNickname,
    getMyAvatar,
    connect,
    joinRoom,
    sendPeer,
    sendRoom,
    savePeerFriend,
    sendFriendRequest,
    acceptPeerRequest,
    rejectPeerRequest,
    broadcastMyProfileUpdate,
    updatePeerProfile,
    getFriends,
    showPeerNotice,
    applyPeerChatInterfaceConstraints,
    applyPeerSettingsModalConstraints
  };

  // 监听个人资料修改以广播头像与昵称更新
  const origHandleEditImage = window.handleEditImage;
  if (typeof origHandleEditImage === "function") {
    window.handleEditImage = function(imgElement) {
      origHandleEditImage.apply(this, arguments);
      setTimeout(() => {
        if (imgElement && imgElement.id === "profile-avatar-img") {
          broadcastMyProfileUpdate(null, imgElement.src);
        }
      }, 500);
    };
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
