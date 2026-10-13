/* 密友与联机群聊专属独立模块 */

(function () {
  const CLOUD_MQTT_BROKERS = [
    "wss://broker.emqx.io:8084/mqtt",
    "wss://broker.hivemq.com:8884/mqtt"
  ];
  const TOPIC_PREFIX = "tukey_ephone_peer_v2/";

  const MIC_BTN_SVG = `
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
      <line x1="12" y1="19" x2="12" y2="23"></line>
      <line x1="8" y1="23" x2="16" y2="23"></line>
    </svg>
  `;

  const PeerManager = {
    ws: null,
    mqttClient: null,
    mqttClients: [],
    bc: null,
    myPeerCode: null,
    tabId: null,
    reconnectTimer: null,
    pollTimer: null,
    heartbeatTimer: null,
    outboxTimer: null,
    noticeTimer: null,
    peerLastSeen: {},
    seenEventIds: new Set(),
    pendingIncomingQueue: [],
    isFlushingQueue: false,
    mediaRecorder: null,
    recordedChunks: [],
    recordStartTime: 0,
    recordTimerInterval: null,
    recordedDataUrl: "",
    recordedDuration: 0,
    isRecording: false,
    currentPlayingAudio: null,
    currentPlayingBubble: null,

    getDeviceClientSuffix: function () {
      let devId = localStorage.getItem("tukey_mqtt_device_id");
      if (!devId) {
        devId = Math.random().toString(36).slice(2, 9);
        localStorage.setItem("tukey_mqtt_device_id", devId);
      }
      return devId;
    },

    generateRandomCode: function () {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      let part1 = "";
      let part2 = "";
      for (let i = 0; i < 4; i++) {
        part1 += chars.charAt(Math.floor(Math.random() * chars.length));
        part2 += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return "TK-" + part1 + "-" + part2;
    },

    getOrCreateMyPeerCode: function () {
      if (this.myPeerCode) {
        return this.myPeerCode;
      }

      try {
        sessionStorage.removeItem("tukey_tab_peer_code");
      } catch (e) {}

      let savedCode = localStorage.getItem("tukey_my_peer_code");
      if (
        !savedCode &&
        window.state &&
        window.state.globalSettings &&
        window.state.globalSettings.myPeerCode
      ) {
        savedCode = window.state.globalSettings.myPeerCode;
        localStorage.setItem("tukey_my_peer_code", savedCode);
      }

      if (savedCode) {
        this.myPeerCode = savedCode;
        return savedCode;
      }

      const newCode = this.generateRandomCode();
      this.myPeerCode = newCode;
      localStorage.setItem("tukey_my_peer_code", newCode);
      return newCode;
    },

    getDeletedPeerCodes: function () {
      try {
        const raw = localStorage.getItem("tukey_deleted_peer_codes");
        if (!raw) return [];
        const arr = JSON.parse(raw);
        return Array.isArray(arr) ? arr : [];
      } catch (e) {
        return [];
      }
    },

    isPeerDeletedByUser: function (peerCode) {
      if (!peerCode) return false;
      return this.getDeletedPeerCodes().includes(peerCode);
    },

    markPeerDeletedByUser: function (peerCode) {
      if (!peerCode) return;
      try {
        const list = this.getDeletedPeerCodes();
        if (!list.includes(peerCode)) {
          list.push(peerCode);
          localStorage.setItem("tukey_deleted_peer_codes", JSON.stringify(list));
        }
        const backup = this.getSavedFriendsBackup();
        if (backup[peerCode]) {
          delete backup[peerCode];
          localStorage.setItem("tukey_peer_friends_backup", JSON.stringify(backup));
        }
      } catch (e) {}
    },

    unmarkPeerDeletedByUser: function (peerCode) {
      if (!peerCode) return;
      try {
        const list = this.getDeletedPeerCodes().filter((c) => c !== peerCode);
        localStorage.setItem("tukey_deleted_peer_codes", JSON.stringify(list));
      } catch (e) {}
    },

    getSavedFriendsBackup: function () {
      try {
        const raw = localStorage.getItem("tukey_peer_friends_backup");
        if (!raw) return {};
        const map = JSON.parse(raw);
        return map && typeof map === "object" ? map : {};
      } catch (e) {
        return {};
      }
    },

    saveFriendToBackup: function (chat) {
      if (!chat || chat.roleType !== "peer" || chat.isGroup || !chat.peerCode) return;
      try {
        const map = this.getSavedFriendsBackup();
        const prev = map[chat.peerCode] || {};
        map[chat.peerCode] = {
          peerCode: chat.peerCode,
          name: chat.name || prev.name || "密友",
          remarkName: (chat.settings && chat.settings.remarkName) || prev.remarkName || chat.name || "密友",
          avatar: (chat.settings && chat.settings.aiAvatar) || prev.avatar || "",
          avatarFrame: (chat.settings && chat.settings.aiAvatarFrame) || prev.avatarFrame || "",
          groupId: chat.groupId || prev.groupId || null
        };
        localStorage.setItem("tukey_peer_friends_backup", JSON.stringify(map));
      } catch (e) {}
    },

    loadSeenEventIds: function () {
      const myCode = this.getOrCreateMyPeerCode();
      try {
        const raw = localStorage.getItem("tukey_peer_seen_evts_" + myCode);
        if (raw) {
          const arr = JSON.parse(raw);
          if (Array.isArray(arr)) {
            arr.forEach((id) => this.seenEventIds.add(id));
          }
        }
      } catch (e) {}
    },

    markEventIdSeen: function (eventId) {
      if (!eventId) return;
      this.seenEventIds.add(eventId);
      const myCode = this.getOrCreateMyPeerCode();
      try {
        const arr = Array.from(this.seenEventIds).slice(-800);
        localStorage.setItem("tukey_peer_seen_evts_" + myCode, JSON.stringify(arr));
      } catch (e) {}
    },

    getOutboxQueue: function () {
      const myCode = this.getOrCreateMyPeerCode();
      try {
        const raw = localStorage.getItem("tukey_peer_outbox_" + myCode);
        if (!raw) return [];
        const list = JSON.parse(raw);
        return Array.isArray(list) ? list : [];
      } catch (e) {
        return [];
      }
    },

    saveOutboxQueue: function (list) {
      const myCode = this.getOrCreateMyPeerCode();
      try {
        const trimmed = (list || []).slice(-120);
        localStorage.setItem("tukey_peer_outbox_" + myCode, JSON.stringify(trimmed));
      } catch (e) {}
    },

    publishRetainedMailboxForTarget: function (targetCode, specificClient) {
      if (!targetCode) return;
      const clients = specificClient ? [specificClient] : this.mqttClients || [];
      if (clients.length === 0) return;

      const myCode = this.getOrCreateMyPeerCode();
      const list = this.getOutboxQueue();
      const targetItems = list
        .filter((item) => item && item.targetCode === targetCode && item.payload)
        .slice(-20)
        .map((item) => item.payload);

      const topic = TOPIC_PREFIX + "mailbox/" + targetCode + "/" + myCode;
      const pktStr =
        targetItems.length > 0
          ? JSON.stringify({
              type: "mailbox_bundle",
              fromCode: myCode,
              toCode: targetCode,
              events: targetItems,
              timestamp: Date.now()
            })
          : "";

      clients.forEach((c) => {
        if (c && c.connected) {
          try {
            c.publish(topic, pktStr, { qos: 1, retain: true });
          } catch (e) {}
        }
      });
    },

    publishAllRetainedMailboxes: function (specificClient) {
      const list = this.getOutboxQueue();
      const targets = new Set();
      list.forEach((item) => {
        if (item && item.targetCode) targets.add(item.targetCode);
      });
      targets.forEach((targetCode) => {
        this.publishRetainedMailboxForTarget(targetCode, specificClient);
      });
    },

    addToOutboxQueue: function (targetCode, payload, apiPath) {
      if (!targetCode || !payload || !payload.eventId) return;
      const list = this.getOutboxQueue();
      if (list.some((item) => item && item.eventId === payload.eventId)) return;
      list.push({
        eventId: payload.eventId,
        targetCode: targetCode,
        payload: payload,
        apiPath: apiPath || "/api/peer/send",
        createdAt: Date.now(),
        lastTriedAt: Date.now()
      });
      this.saveOutboxQueue(list);
      this.publishRetainedMailboxForTarget(targetCode);
    },

    removeFromOutboxQueue: function (eventId) {
      if (!eventId) return;
      const list = this.getOutboxQueue();
      const removedTargets = new Set();
      const next = list.filter((item) => {
        if (item && item.eventId === eventId) {
          if (item.targetCode) removedTargets.add(item.targetCode);
          return false;
        }
        return true;
      });
      if (next.length !== list.length) {
        this.saveOutboxQueue(next);
        removedTargets.forEach((tCode) => {
          this.publishRetainedMailboxForTarget(tCode);
        });
      }
    },

    retryOutboxPackets: function (specificTargetCode) {
      const list = this.getOutboxQueue();
      if (list.length === 0) return;
      const now = Date.now();
      let changed = false;
      const remaining = [];

      for (const item of list) {
        if (!item || !item.eventId || !item.payload) continue;
        if (now - (item.createdAt || 0) > 7 * 24 * 3600 * 1000) {
          changed = true;
          continue;
        }
        const shouldSend =
          (specificTargetCode && item.targetCode === specificTargetCode) ||
          now - (item.lastTriedAt || 0) >= 4500;
        if (shouldSend) {
          item.lastTriedAt = now;
          changed = true;
          this.transmitPacketRaw(item.targetCode, item.payload, item.apiPath || "/api/peer/send", false);
        }
        remaining.push(item);
      }

      if (changed) {
        this.saveOutboxQueue(remaining);
      }
    },

    ackEventsToServer: function (eventIds) {
      if (!Array.isArray(eventIds) || eventIds.length === 0) return;
      const myCode = this.getOrCreateMyPeerCode();
      if (this.ws && this.ws.readyState === 1) {
        try {
          this.ws.send(JSON.stringify({ type: "ack", peerCode: myCode, eventIds: eventIds }));
        } catch (e) {}
      }
      fetch(this.getApiUrl("/api/peer/ack"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ peerCode: myCode, eventIds: eventIds })
      }).catch(() => {});
    },

    sendPeerAck: function (toCode, ackEventId) {
      if (!toCode || !ackEventId) return;
      const myCode = this.getOrCreateMyPeerCode();
      const ackPacket = {
        type: "peer_ack",
        eventId: "ack_" + ackEventId + "_" + myCode,
        ackEventId: ackEventId,
        fromCode: myCode,
        toCode: toCode,
        timestamp: Date.now()
      };
      this.transmitPacketRaw(toCode, ackPacket, "/api/peer/send", false);
    },

    getMyProfile: function () {
      const profileAvatarEl = document.getElementById("profile-avatar-img");
      const profileNameEl = document.getElementById("profile-username");
      const profileFrameEl = document.getElementById("profile-avatar-frame");
      const defaultAva =
        window.defaultAvatar ||
        "https://api.iconify.design/lucide:user.svg?color=%23888888";

      let name = "我";
      let avatar = defaultAva;
      let myAvatarFrame = "";

      if (window.state && window.state.globalSettings) {
        const gs = window.state.globalSettings;
        if (gs.widgetData) {
          if (gs.widgetData["profile-username"] && gs.widgetData["profile-username"] !== "你的昵称") {
            name = gs.widgetData["profile-username"].trim();
          }
          if (gs.widgetData["profile-avatar-img"]) {
            avatar = gs.widgetData["profile-avatar-img"];
          }
        }
        if (gs.homeAvatarFrame) {
          myAvatarFrame = gs.homeAvatarFrame;
        }
      }

      if (
        profileNameEl &&
        profileNameEl.textContent &&
        profileNameEl.textContent.trim() &&
        profileNameEl.textContent.trim() !== "你的昵称"
      ) {
        name = profileNameEl.textContent.trim();
      }
      if (profileAvatarEl && profileAvatarEl.src) {
        avatar = profileAvatarEl.src;
      }
      if (profileFrameEl && profileFrameEl.style.display !== "none" && profileFrameEl.getAttribute("src")) {
        myAvatarFrame = profileFrameEl.getAttribute("src");
      }

      return { name, avatar, myAvatarFrame };
    },

    compressAvatarForWire: function (src) {
      return new Promise((resolve) => {
        if (!src || typeof src !== "string") {
          resolve("");
          return;
        }
        if (!src.startsWith("data:image")) {
          resolve(src);
          return;
        }
        if (src.length < 32000) {
          resolve(src);
          return;
        }
        const img = new Image();
        img.onload = function () {
          try {
            const canvas = document.createElement("canvas");
            const maxDim = 96;
            let w = img.width || 96;
            let h = img.height || 96;
            if (w > h) {
              if (w > maxDim) {
                h = Math.round((h * maxDim) / w);
                w = maxDim;
              }
            } else {
              if (h > maxDim) {
                w = Math.round((w * maxDim) / h);
                h = maxDim;
              }
            }
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, w, h);
            resolve(canvas.toDataURL("image/jpeg", 0.72));
          } catch (e) {
            resolve("");
          }
        };
        img.onerror = function () {
          resolve("");
        };
        img.src = src;
      });
    },

    sanitizeCocPanelForPeerUI: function (cocPanel) {
      const def = typeof window.getDefaultCocData === "function"
        ? window.getDefaultCocData()
        : {
            stats: { str: 50, dex: 50, con: 50, pow: 50, siz: 50, edu: 50, app: 50, int: 50, luk: 50 },
            calculated: { hp: 10, maxHp: 10, mp: 10, maxMp: 10, san: 50, maxSan: 99, db: "0", build: 0 },
            skills: {},
            customSkills: [],
            totalPoints: 0,
            rulebook: "coc7"
          };
      if (!cocPanel || typeof cocPanel !== "object") {
        return {
          stats: { ...def.stats },
          calculated: { ...def.calculated },
          skills: {},
          customSkills: [],
          totalPoints: 0,
          rulebook: "coc7"
        };
      }
      const stats = cocPanel.stats ? { ...def.stats, ...cocPanel.stats } : { ...def.stats };
      const calculated = typeof window.calculateCocStats === "function"
        ? window.calculateCocStats(stats, cocPanel.calculated || {})
        : (cocPanel.calculated ? { ...def.calculated, ...cocPanel.calculated } : { ...def.calculated });
      return {
        stats: stats,
        calculated: calculated,
        skills: {},
        customSkills: [],
        totalPoints: 0,
        rulebook: cocPanel.rulebook || "coc7"
      };
    },

    ensureNotificationPermission: function () {
      try {
        if ("Notification" in window && Notification.permission === "default") {
          Notification.requestPermission().catch(() => {});
        }
      } catch (e) {}
    },

    getApiBase: function () {
      if (typeof window.API_BASE_URL === "string" && window.API_BASE_URL.trim()) {
        return window.API_BASE_URL.trim().replace(/\/+$/, "");
      }
      return "";
    },

    getApiUrl: function (path) {
      const base = this.getApiBase();
      return base ? base + path : path;
    },

    ensureMqttScriptLoaded: function () {
      if (typeof window.mqtt !== "undefined") {
        return Promise.resolve(window.mqtt);
      }
      if (this._mqttLoadingPromise) {
        return this._mqttLoadingPromise;
      }
      const urls = [
        "https://unpkg.com/mqtt@5.3.5/dist/mqtt.min.js",
        "https://cdn.jsdelivr.net/npm/mqtt@5.3.5/dist/mqtt.min.js",
        "https://cdnjs.cloudflare.com/ajax/libs/mqtt/5.3.5/mqtt.min.js"
      ];
      this._mqttLoadingPromise = new Promise((resolve) => {
        let idx = 0;
        const tryNext = () => {
          if (typeof window.mqtt !== "undefined") {
            resolve(window.mqtt);
            return;
          }
          if (idx >= urls.length) {
            resolve(null);
            return;
          }
          const script = document.createElement("script");
          script.src = urls[idx++];
          script.async = true;
          script.onload = () => {
            if (typeof window.mqtt !== "undefined") {
              resolve(window.mqtt);
            } else {
              tryNext();
            }
          };
          script.onerror = () => {
            tryNext();
          };
          document.head.appendChild(script);
        };
        tryNext();
      });
      return this._mqttLoadingPromise;
    },

    connectNetwork: function () {
      this.getOrCreateMyPeerCode();

      this.initBroadcastChannel();
      this.connectMqttBroker();
      this.connectWebSocket();

      if (!this.outboxTimer) {
        this.outboxTimer = setInterval(() => {
          this.retryOutboxPackets();
        }, 5000);
      }

      if (!this.heartbeatTimer) {
        this.heartbeatTimer = setInterval(() => {
          this.sendOnlinePingToFriends();
          this.refreshActivePeerHeaderStatus();
        }, 8000);
      }
    },

    wakeUpAndSyncNow: function () {
      this.pollOnce();
      if (!this.ws || this.ws.readyState > 1) {
        this.connectWebSocket();
      }
      if (!this.mqttClients || this.mqttClients.length === 0) {
        this.connectMqttBroker();
      } else {
        this.subscribeAllKnownFriendsMqtt();
        this.publishAllRetainedMailboxes();
      }
      this.retryOutboxPackets();
      this.sendOnlinePingToFriends();
      this.refreshActivePeerHeaderStatus();
    },

    getAllKnownPeerCodes: function () {
      const myCode = this.getOrCreateMyPeerCode();
      const codes = new Set();
      if (window.state && window.state.chats) {
        for (const chat of Object.values(window.state.chats)) {
          if (chat && chat.roleType === "peer" && chat.peerCode && chat.peerCode !== myCode) {
            codes.add(chat.peerCode);
          }
          if (chat && chat.isGroup && chat.isPeerGroup && Array.isArray(chat.members)) {
            chat.members.forEach((m) => {
              if (m && m.peerCode && m.peerCode !== myCode) codes.add(m.peerCode);
            });
          }
        }
      }
      return Array.from(codes);
    },

    isPeerOnline: function (peerCode) {
      if (!peerCode || !this.peerLastSeen) return false;
      const last = this.peerLastSeen[peerCode] || 0;
      return last > 0 && Date.now() - last < 26000;
    },

    markPeerOnline: function (peerCode) {
      if (!peerCode) return;
      if (!this.peerLastSeen) this.peerLastSeen = {};
      this.peerLastSeen[peerCode] = Date.now();
      if (window.state && window.state.chats) {
        for (const chat of Object.values(window.state.chats)) {
          if (chat && chat.roleType === "peer" && !chat.isGroup && chat.peerCode === peerCode) {
            chat.status = { text: "在线", isBusy: false };
          }
        }
      }
      this.refreshActivePeerHeaderStatus();
    },

    markPeerOffline: function (peerCode) {
      if (!peerCode) return;
      if (!this.peerLastSeen) this.peerLastSeen = {};
      this.peerLastSeen[peerCode] = 0;
      if (window.state && window.state.chats) {
        for (const chat of Object.values(window.state.chats)) {
          if (chat && chat.roleType === "peer" && !chat.isGroup && chat.peerCode === peerCode) {
            chat.status = { text: "离线", isBusy: true };
          }
        }
      }
      this.refreshActivePeerHeaderStatus();
    },

    refreshActivePeerHeaderStatus: function () {
      if (!window.state || !window.state.activeChatId || !window.state.chats) return;
      const activeChat = window.state.chats[window.state.activeChatId];
      if (!activeChat || activeChat.roleType !== "peer" || activeChat.isGroup) return;
      const online = this.isPeerOnline(activeChat.peerCode);
      activeChat.status = { text: online ? "在线" : "离线", isBusy: !online };
      const statusContainer = document.getElementById("chat-header-status");
      if (statusContainer) {
        const statusTextEl = statusContainer.querySelector(".status-text");
        if (statusTextEl) {
          statusTextEl.textContent = online ? "在线" : "离线";
        }
        statusContainer.classList.toggle("busy", !online);
      }
    },

    transmitPresencePacket: function (targetCode, payload) {
      if (!targetCode || !payload) return;
      const jsonStr = JSON.stringify(payload);
      if (this.bc) {
        try {
          this.bc.postMessage(payload);
        } catch (e) {}
      }
      try {
        localStorage.setItem("tukey_peer_local_bus_pkt", jsonStr);
      } catch (e) {}
      if (this.mqttClients && this.mqttClients.length > 0) {
        this.mqttClients.forEach((c) => {
          if (c) {
            try {
              c.publish(TOPIC_PREFIX + "inbox/" + targetCode, jsonStr, {
                qos: 0,
                retain: false
              });
            } catch (e) {}
          }
        });
      }
      if (this.ws && this.ws.readyState === 1) {
        try {
          this.ws.send(jsonStr);
        } catch (e) {}
      }
      fetch(this.getApiUrl("/api/peer/send"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: jsonStr,
        keepalive: payload.type === "offline_ping"
      }).catch(() => {});
    },

    sendOnlinePingToPeer: function (friendCode) {
      if (!friendCode) return;
      const myCode = this.getOrCreateMyPeerCode();
      if (friendCode === myCode) return;
      const pingPkt = {
        type: "online_ping",
        eventId: "ping_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7),
        fromCode: myCode,
        toCode: friendCode,
        timestamp: Date.now()
      };
      this.transmitPresencePacket(friendCode, pingPkt);
    },

    sendOnlinePongToPeer: function (friendCode) {
      if (!friendCode) return;
      const myCode = this.getOrCreateMyPeerCode();
      if (friendCode === myCode) return;
      const pongPkt = {
        type: "online_pong",
        eventId: "pong_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7),
        fromCode: myCode,
        toCode: friendCode,
        timestamp: Date.now()
      };
      this.transmitPresencePacket(friendCode, pongPkt);
    },

    sendOfflinePingToFriends: function () {
      const myCode = this.getOrCreateMyPeerCode();
      const codes = this.getAllKnownPeerCodes();
      codes.forEach((friendCode) => {
        const offPkt = {
          type: "offline_ping",
          eventId: "off_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7),
          fromCode: myCode,
          toCode: friendCode,
          timestamp: Date.now()
        };
        this.transmitPresencePacket(friendCode, offPkt);
      });
    },

    sendOnlinePingToFriends: function () {
      const codes = this.getAllKnownPeerCodes();
      codes.forEach((friendCode) => {
        this.sendOnlinePingToPeer(friendCode);
      });
    },

    initBroadcastChannel: function () {
      if (this.bc) return;
      try {
        if (typeof BroadcastChannel !== "undefined") {
          this.bc = new BroadcastChannel("tukey_peer_local_bus");
          this.bc.onmessage = (ev) => {
            if (ev && ev.data) {
              this.enqueueIncomingEvent(ev.data);
            }
          };
        }
      } catch (e) {}
    },

    subscribePeerTopicsOnClient: function (client, peerCode, isSelf) {
      if (!client || !peerCode) return;
      const myCode = this.getOrCreateMyPeerCode();
      try {
        client.subscribe(TOPIC_PREFIX + "inbox/" + peerCode, { qos: 1 });
        if (isSelf) {
          client.subscribe(TOPIC_PREFIX + "mailbox/" + peerCode + "/+", { qos: 1 });
        } else {
          client.subscribe(TOPIC_PREFIX + "profile/" + peerCode, { qos: 1 });
          client.subscribe(TOPIC_PREFIX + "mailbox/" + myCode + "/" + peerCode, { qos: 1 });
        }
      } catch (e) {}
    },

    subscribeAllKnownFriendsMqtt: function (targetClient) {
      const clients = targetClient ? [targetClient] : this.mqttClients || [];
      if (clients.length === 0) return;

      const myCode = this.getOrCreateMyPeerCode();
      const codes = new Set();

      if (window.state && window.state.chats) {
        for (const chat of Object.values(window.state.chats)) {
          if (chat && chat.roleType === "peer" && chat.peerCode) {
            codes.add(chat.peerCode);
          }
          if (chat && chat.isGroup && chat.isPeerGroup && Array.isArray(chat.members)) {
            chat.members.forEach((m) => {
              if (m && m.peerCode && m.peerCode !== myCode) codes.add(m.peerCode);
            });
          }
        }
      }

      const outMap = this.getOutgoingRequests();
      Object.keys(outMap).forEach((c) => codes.add(c));
      const backupMap = this.getSavedFriendsBackup();
      Object.keys(backupMap).forEach((c) => codes.add(c));

      clients.forEach((c) => {
        if (!c) return;
        this.subscribePeerTopicsOnClient(c, myCode, true);
        codes.forEach((peerCode) => {
          this.subscribePeerTopicsOnClient(c, peerCode, false);
        });
      });
    },

    connectMqttBroker: async function () {
      if (this.mqttClients && this.mqttClients.length > 0) return;
      const mqttLib = await this.ensureMqttScriptLoaded();
      if (!mqttLib || typeof mqttLib.connect !== "function") return;

      const myCode = this.getOrCreateMyPeerCode();
      const devSuffix = this.getDeviceClientSuffix();
      this.mqttClients = [];

      CLOUD_MQTT_BROKERS.forEach((brokerUrl, idx) => {
        try {
          const clientId =
            "tukey_" +
            myCode.replace(/[^a-zA-Z0-9]/g, "") +
            "_" +
            idx +
            "_" +
            devSuffix;

          const client = mqttLib.connect(brokerUrl, {
            clientId: clientId,
            clean: false,
            keepalive: 30,
            reconnectPeriod: 2500,
            connectTimeout: 10000
          });

          client.on("connect", () => {
            this.subscribeAllKnownFriendsMqtt(client);
            this.publishMyRetainedProfile(client);
            this.publishAllRetainedMailboxes(client);
            this.retryOutboxPackets();
          });

          client.on("message", (topic, messageBuffer) => {
            try {
              const rawStr = messageBuffer.toString();
              if (!rawStr) return;
              const data = JSON.parse(rawStr);
              this.enqueueIncomingEvent(data);
            } catch (e) {}
          });

          client.on("error", () => {});
          this.mqttClients.push(client);
          if (idx === 0) this.mqttClient = client;
        } catch (e) {}
      });
    },

    publishMyRetainedProfile: async function (specificClient) {
      const clients = specificClient ? [specificClient] : this.mqttClients || [];
      if (clients.length === 0) return;
      const myCode = this.getOrCreateMyPeerCode();
      const profile = this.getMyProfile();
      const smallAva = await this.compressAvatarForWire(profile.avatar);
      const pkt = JSON.stringify({
        type: "profile_update",
        eventId: "prof_ret_" + myCode + "_" + Date.now(),
        peerCode: myCode,
        name: profile.name,
        avatar: smallAva,
        myAvatarFrame: profile.myAvatarFrame || "",
        timestamp: Date.now()
      });

      clients.forEach((c) => {
        if (c && c.connected) {
          try {
            c.publish(TOPIC_PREFIX + "profile/" + myCode, pkt, { qos: 1, retain: true });
          } catch (e) {}
        }
      });
    },

    transmitPacketRaw: function (targetCode, payload, apiPath, retainOnInbox) {
      if (!targetCode || !payload) return;
      const jsonStr = JSON.stringify(payload);

      if (this.bc) {
        try {
          this.bc.postMessage(payload);
        } catch (e) {}
      }
      try {
        localStorage.setItem("tukey_peer_local_bus_pkt", jsonStr);
      } catch (e) {}

      if (this.mqttClients && this.mqttClients.length > 0) {
        this.mqttClients.forEach((c) => {
          if (c) {
            try {
              c.publish(TOPIC_PREFIX + "inbox/" + targetCode, jsonStr, {
                qos: 1,
                retain: false
              });
            } catch (e) {}
          }
        });
      }

      if (this.ws && this.ws.readyState === 1) {
        try {
          this.ws.send(jsonStr);
        } catch (e) {}
      }

      if (apiPath) {
        fetch(this.getApiUrl(apiPath), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: jsonStr
        }).catch(() => {});
      }
    },

    dispatchPacketToNetwork: function (targetCode, payload, apiPath, retainOnInbox) {
      if (!targetCode || !payload) return;
      if (payload.type !== "peer_ack" && payload.type !== "online_ping" && payload.eventId) {
        this.addToOutboxQueue(targetCode, payload, apiPath);
      }
      this.transmitPacketRaw(targetCode, payload, apiPath, false);
    },

    connectWebSocket: function () {
      const myCode = this.getOrCreateMyPeerCode();
      const profile = this.getMyProfile();

      this.registerViaHttp();
      this.startPollingFallback();

      try {
        const base = this.getApiBase();
        let wsUrl;
        if (base && base.startsWith("http")) {
          wsUrl = base.replace(/^http/, "ws");
        } else {
          const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
          wsUrl = protocol + "//" + window.location.host;
        }
        const ws = new WebSocket(wsUrl);
        this.ws = ws;

        ws.onopen = async () => {
          const smallAva = await this.compressAvatarForWire(profile.avatar);
          ws.send(
            JSON.stringify({
              type: "register",
              peerCode: myCode,
              name: profile.name,
              avatar: smallAva,
              myAvatarFrame: profile.myAvatarFrame || ""
            })
          );
          this.retryOutboxPackets();
          this.sendOnlinePingToFriends();
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.enqueueIncomingEvent(data);
          } catch (e) {}
        };

        ws.onclose = () => {
          this.ws = null;
          if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
          this.reconnectTimer = setTimeout(() => {
            this.connectWebSocket();
          }, 3000);
        };

        ws.onerror = () => {};
      } catch (e) {}
    },

    registerViaHttp: async function () {
      const myCode = this.getOrCreateMyPeerCode();
      const profile = this.getMyProfile();
      const smallAva = await this.compressAvatarForWire(profile.avatar);
      fetch(this.getApiUrl("/api/peer/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          peerCode: myCode,
          name: profile.name,
          avatar: smallAva,
          myAvatarFrame: profile.myAvatarFrame || ""
        })
      }).catch(() => {});
    },

    startPollingFallback: function () {
      if (this.pollTimer) return;
      this.pollOnce();
      this.pollTimer = setInterval(() => {
        this.pollOnce();
      }, 2500);
    },

    pollOnce: function () {
      const myCode = this.getOrCreateMyPeerCode();
      const peersList = this.getAllKnownPeerCodes();
      const peersQuery = peersList.length > 0 ? "&peers=" + encodeURIComponent(peersList.join(",")) : "";
      fetch(this.getApiUrl("/api/peer/poll?code=" + encodeURIComponent(myCode) + peersQuery))
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.onlinePeers && typeof data.onlinePeers === "object") {
            for (const [pCode, isOn] of Object.entries(data.onlinePeers)) {
              if (isOn) {
                this.markPeerOnline(pCode);
              }
            }
          }
          if (data && Array.isArray(data.events) && data.events.length > 0) {
            data.events.forEach((evt) => this.enqueueIncomingEvent(evt));
          }
        })
        .catch(() => {});
    },

    isAppDbReady: function () {
      return Boolean(
        window.__tukeyDbLoaded &&
          window.state &&
          window.state.chats &&
          window.db &&
          window.db.chats
      );
    },

    onAppDbLoaded: async function () {
      const myCode = this.getOrCreateMyPeerCode();
      if (window.state && window.state.globalSettings) {
        if (!window.state.globalSettings.myPeerCode) {
          window.state.globalSettings.myPeerCode = myCode;
        }
      }
      await this.deduplicatePeerChatsInDb();
      await this.refreshAppChatAndContactsUI();
      this.subscribeAllKnownFriendsMqtt();
      this.flushIncomingQueue();
      this.retryOutboxPackets();
      this.pollOnce();
      this.sendOnlinePingToFriends();
    },

    enqueueIncomingEvent: function (data) {
      if (!data || !data.type) return;
      if (data.type === "mailbox_bundle" && Array.isArray(data.events)) {
        data.events.forEach((evt) => {
          if (evt && evt.type) {
            this.pendingIncomingQueue.push(evt);
          }
        });
      } else {
        this.pendingIncomingQueue.push(data);
      }
      if (this.isAppDbReady()) {
        this.flushIncomingQueue();
      }
    },

    flushIncomingQueue: async function () {
      if (this.isFlushingQueue) return;
      if (!this.isAppDbReady()) return;
      this.isFlushingQueue = true;
      try {
        while (this.pendingIncomingQueue.length > 0) {
          const evt = this.pendingIncomingQueue.shift();
          await this.handleIncomingEvent(evt);
        }
      } catch (e) {
        console.error("处理联机事件异常:", e);
      } finally {
        this.isFlushingQueue = false;
      }
    },

    handleIncomingEvent: async function (data) {
      if (!data || !data.type) return;
      const myCode = this.getOrCreateMyPeerCode();

      if (data.toCode && data.toCode !== myCode) return;
      if (Array.isArray(data.targetCodes) && !data.targetCodes.includes(myCode)) return;

      if (data.type === "online_ping") {
        if (data.fromCode && data.fromCode !== myCode) {
          this.markPeerOnline(data.fromCode);
          this.sendOnlinePongToPeer(data.fromCode);
          this.retryOutboxPackets(data.fromCode);
          this.publishRetainedMailboxForTarget(data.fromCode);
        }
        return;
      }

      if (data.type === "online_pong") {
        if (data.fromCode && data.fromCode !== myCode) {
          this.markPeerOnline(data.fromCode);
        }
        return;
      }

      if (data.type === "offline_ping") {
        if (data.fromCode && data.fromCode !== myCode) {
          this.markPeerOffline(data.fromCode);
        }
        return;
      }

      if (data.type === "peer_ack") {
        if (data.fromCode && data.fromCode !== myCode) {
          this.markPeerOnline(data.fromCode);
        }
        if (data.ackEventId) {
          this.removeFromOutboxQueue(data.ackEventId);
        }
        if (data.eventId) {
          this.ackEventsToServer([data.eventId]);
        }
        return;
      }

      if (data.eventId) {
        if (this.seenEventIds.has(data.eventId)) {
          this.ackEventsToServer([data.eventId]);
          if (data.fromCode || data.peerCode) {
            this.sendPeerAck(data.fromCode || data.peerCode, data.eventId);
          }
          return;
        }
        this.markEventIdSeen(data.eventId);
      }

      if (data.type === "message") {
        await this.receivePeerMessage(data);
      } else if (data.type === "profile_update") {
        await this.receivePeerProfileUpdate(data);
      } else if (data.type === "friend_request") {
        await this.receiveFriendRequest(data);
      } else if (data.type === "friend_accept") {
        await this.receiveFriendAccept(data);
      } else if (data.type === "group_invite") {
        await this.receiveGroupInvite(data);
      } else if (data.type === "group_join_accept") {
        await this.receiveGroupJoinAccept(data);
      } else if (data.type === "group_member_update") {
        await this.receiveGroupMemberUpdate(data);
      } else if (data.type === "group_message") {
        await this.receiveGroupMessage(data);
      } else if (data.type === "msg_edit") {
        await this.receiveMessageEdit(data);
      } else if (data.type === "msg_delete") {
        await this.receiveMessageDelete(data);
      }

      if (data.eventId) {
        this.ackEventsToServer([data.eventId]);
        if (data.fromCode || data.peerCode) {
          this.sendPeerAck(data.fromCode || data.peerCode, data.eventId);
        }
      }

      const senderPeer = data.fromCode || data.peerCode;
      if (senderPeer && senderPeer !== myCode) {
        this.retryOutboxPackets(senderPeer);
      }
    },

    getIncomingRequests: function () {
      const myCode = this.getOrCreateMyPeerCode();
      try {
        const raw = localStorage.getItem("tukey_peer_in_reqs_" + myCode);
        if (!raw) return [];
        const list = JSON.parse(raw);
        return Array.isArray(list) ? list : [];
      } catch (e) {
        return [];
      }
    },

    saveIncomingRequests: function (list) {
      const myCode = this.getOrCreateMyPeerCode();
      try {
        localStorage.setItem("tukey_peer_in_reqs_" + myCode, JSON.stringify(list || []));
      } catch (e) {}
    },

    getIncomingGroupInvites: function () {
      const myCode = this.getOrCreateMyPeerCode();
      try {
        const raw = localStorage.getItem("tukey_peer_grp_invs_" + myCode);
        if (!raw) return [];
        const list = JSON.parse(raw);
        return Array.isArray(list) ? list : [];
      } catch (e) {
        return [];
      }
    },

    saveIncomingGroupInvites: function (list) {
      const myCode = this.getOrCreateMyPeerCode();
      try {
        localStorage.setItem("tukey_peer_grp_invs_" + myCode, JSON.stringify(list || []));
      } catch (e) {}
    },

    getOutgoingRequests: function () {
      const myCode = this.getOrCreateMyPeerCode();
      try {
        const raw = localStorage.getItem("tukey_peer_out_reqs_" + myCode);
        if (!raw) return {};
        const map = JSON.parse(raw);
        return map && typeof map === "object" ? map : {};
      } catch (e) {
        return {};
      }
    },

    saveOutgoingRequest: function (toCode, info) {
      const myCode = this.getOrCreateMyPeerCode();
      const map = this.getOutgoingRequests();
      map[toCode] = info;
      try {
        localStorage.setItem("tukey_peer_out_reqs_" + myCode, JSON.stringify(map));
      } catch (e) {}
    },

    playNoticeAlertSound: function () {
      try {
        const soundPlayer = document.getElementById("notification-sound-player");
        const soundUrl =
          window.state &&
          window.state.globalSettings &&
          window.state.globalSettings.notificationSoundUrl;
        if (soundPlayer && soundUrl) {
          soundPlayer.src = soundUrl;
          soundPlayer.currentTime = 0;
          soundPlayer.play().catch(() => {});
        }
      } catch (e) {}
    },

    triggerMobileSystemNotification: async function (title, body, avatarUrl, meta) {
      try {
        if (!("Notification" in window)) return;
        if (Notification.permission !== "granted") return;

        const safeIcon =
          avatarUrl && !avatarUrl.startsWith("data:")
            ? avatarUrl
            : "./icon-192.png";
        const tag = (meta && meta.tag) || "peer_msg_" + Date.now();
        const notifData = {
          chatId: (meta && meta.chatId) || "",
          openRequests: Boolean(meta && meta.openRequests)
        };

        if ("serviceWorker" in navigator) {
          if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
              type: "SHOW_PEER_NOTIFICATION",
              title: title,
              body: body,
              icon: safeIcon,
              tag: tag,
              chatId: notifData.chatId,
              openRequests: notifData.openRequests
            });
            return;
          }
          const reg = await navigator.serviceWorker.getRegistration();
          if (reg && typeof reg.showNotification === "function") {
            await reg.showNotification(title, {
              body: body,
              icon: safeIcon,
              badge: "./icon-192.png",
              tag: tag,
              renotify: true,
              silent: false,
              vibrate: [200, 100, 200],
              data: notifData
            });
            return;
          }
        }
        new Notification(title, {
          body: body,
          icon: safeIcon,
          tag: tag,
          renotify: true,
          silent: false
        });
      } catch (e) {}
    },

    showPeerNotice: function (titleOrText, onClick, options) {
      const opts = options || {};
      const title = opts.title || "密友通知";
      const message = opts.message || titleOrText || "";
      const defaultAva = window.defaultAvatar || "https://api.iconify.design/lucide:user.svg?color=%23888888";
      const avatarUrl = opts.avatar || defaultAva;

      const isViewingThisChat =
        Boolean(
          opts.chatId &&
            document.getElementById("chat-interface-screen") &&
            document.getElementById("chat-interface-screen").classList.contains("active") &&
            window.state &&
            String(window.state.activeChatId) === String(opts.chatId)
        );

      if (document.hidden) {
        this.playNoticeAlertSound();
        this.triggerMobileSystemNotification(title, message, avatarUrl, opts);
        return;
      }

      if (isViewingThisChat) {
        return;
      }

      this.playNoticeAlertSound();

      const bar = document.getElementById("notification-bar");
      const avatarImg = document.getElementById("notification-avatar");
      const contentDiv = document.getElementById("notification-content");

      if (bar && contentDiv) {
        if (avatarImg) avatarImg.src = avatarUrl;
        const nameEl = contentDiv.querySelector(".name");
        const msgEl = contentDiv.querySelector(".message");
        if (nameEl) nameEl.textContent = title;
        if (msgEl) msgEl.textContent = message;

        bar.classList.remove("visible", "notif-anim-replay");
        const newBar = bar.cloneNode(true);
        newBar.classList.remove("visible", "notif-anim-replay");
        bar.parentNode.replaceChild(newBar, bar);

        newBar.addEventListener("click", () => {
          newBar.classList.remove("visible", "notif-anim-replay");
          if (typeof onClick === "function") onClick();
        });

        void newBar.offsetWidth;
        newBar.classList.add("visible", "notif-anim-replay");

        if (this.noticeTimer) clearTimeout(this.noticeTimer);
        this.noticeTimer = setTimeout(() => {
          newBar.classList.remove("visible", "notif-anim-replay");
        }, 4200);
      }
    },

    ensureDefaultGroupId: async function () {
      if (typeof window.ensureDefaultContactGroup === "function") {
        try {
          return await window.ensureDefaultContactGroup();
        } catch (e) {}
      }
      if (!window.db || !window.db.qzoneGroups) return 1;
      try {
        const groups = await window.db.qzoneGroups.toArray();
        if (groups.length === 0) {
          return await window.db.qzoneGroups.add({ name: "我的好友", order: 0 });
        }
        const def = groups.find((g) => g.name === "我的好友") || groups[0];
        return def.id;
      } catch (e) {
        return 1;
      }
    },

    refreshAppChatAndContactsUI: async function () {
      if (typeof window.renderChatListProxy === "function") {
        try {
          await window.renderChatListProxy();
        } catch (e) {}
      } else if (typeof window.renderChatList === "function") {
        try {
          await window.renderChatList();
        } catch (e) {}
      }
      if (typeof window.renderContactsScreen === "function") {
        try {
          await window.renderContactsScreen();
        } catch (e) {}
      } else if (typeof window.switchContactsSubTab === "function") {
        try {
          const contactsScreen = document.getElementById("contacts-screen");
          if (contactsScreen && contactsScreen.classList.contains("active")) {
            window.switchContactsSubTab("friends");
          }
        } catch (e) {}
      }
    },

    deduplicatePeerChatsInDb: async function () {
      if (!window.db || !window.db.chats) return;
      try {
        const myCode = this.getOrCreateMyPeerCode();
        const allChats = await window.db.chats.toArray();
        const byPeerCode = new Map();
        const byGroupId = new Map();

        for (const c of allChats) {
          if (!c) continue;
          if (c.roleType === "peer" && !c.isGroup && c.peerCode) {
            if (!byPeerCode.has(c.peerCode)) byPeerCode.set(c.peerCode, []);
            byPeerCode.get(c.peerCode).push(c);
          } else if (c.isGroup) {
            const hasRealPeer = Array.isArray(c.members) && c.members.some((m) => m && (m.isPeerMember || m.roleType === "peer" || Boolean(m.peerCode)));
            if (!hasRealPeer && c.isPeerGroup) {
              c.isPeerGroup = false;
              if (window.state && window.state.chats && window.state.chats[c.id]) {
                window.state.chats[c.id].isPeerGroup = false;
              }
              try {
                await window.db.chats.put(c);
              } catch (e) {}
            } else if (hasRealPeer && c.isPeerGroup && c.peerGroupId) {
              if (!byGroupId.has(c.peerGroupId)) byGroupId.set(c.peerGroupId, []);
              byGroupId.get(c.peerGroupId).push(c);
            }
          }
        }

        let changed = false;

        for (const [peerCode, list] of byPeerCode.entries()) {
          if (list.length <= 1) {
            const only = list[0];
            if (only) {
              let itemChanged = false;
              if (only.myPeerCode !== myCode) {
                only.myPeerCode = myCode;
                itemChanged = true;
              }
              if (only.inMessageList === undefined) {
                only.inMessageList = true;
                itemChanged = true;
              }
              if (window.state && window.state.chats) {
                window.state.chats[only.id] = only;
              }
              this.saveFriendToBackup(only);
              if (itemChanged) {
                changed = true;
                await window.db.chats.put(only);
              }
            }
            continue;
          }

          changed = true;
          list.sort((a, b) => {
            const lenA = Array.isArray(a.history) ? a.history.length : 0;
            const lenB = Array.isArray(b.history) ? b.history.length : 0;
            if (lenA !== lenB) return lenB - lenA;
            return (a.createdAt || 0) - (b.createdAt || 0);
          });

          const primary = list[0];
          primary.myPeerCode = myCode;
          primary.inMessageList = true;
          const mergedHistory = [];
          const seenKeys = new Set();

          for (const chatItem of list) {
            for (const msg of chatItem.history || []) {
              if (!msg) continue;
              const key = msg.eventId || `${msg.role}_${msg.timestamp}_${msg.content}`;
              if (!seenKeys.has(key)) {
                seenKeys.add(key);
                mergedHistory.push(msg);
              }
            }
          }
          mergedHistory.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
          primary.history = mergedHistory;

          await window.db.chats.put(primary);
          if (window.state && window.state.chats) {
            window.state.chats[primary.id] = primary;
          }
          this.saveFriendToBackup(primary);

          for (let i = 1; i < list.length; i++) {
            const dup = list[i];
            if (dup && dup.id !== primary.id) {
              await window.db.chats.delete(dup.id);
              if (window.state && window.state.chats) {
                delete window.state.chats[dup.id];
              }
            }
          }
        }

        const backupFriends = this.getSavedFriendsBackup();
        for (const [peerCode, info] of Object.entries(backupFriends)) {
          if (!peerCode || peerCode === myCode || this.isPeerDeletedByUser(peerCode)) continue;
          if (!byPeerCode.has(peerCode)) {
            await this.createOrUpdatePeerChatSession(
              peerCode,
              info.name || "密友",
              info.avatar || "",
              info.groupId || null,
              info.remarkName || info.name || "密友",
              info.avatarFrame || ""
            );
            changed = true;
          }
        }

        for (const [pGroupId, list] of byGroupId.entries()) {
          if (list.length <= 1) {
            const onlyGrp = list[0];
            if (onlyGrp && window.state && window.state.chats) {
              window.state.chats[onlyGrp.id] = onlyGrp;
            }
            continue;
          }
          changed = true;
          list.sort((a, b) => {
            const lenA = Array.isArray(a.history) ? a.history.length : 0;
            const lenB = Array.isArray(b.history) ? b.history.length : 0;
            return lenB - lenA;
          });
          const primary = list[0];
          primary.myPeerCode = myCode;
          const mergedHistory = [];
          const seenKeys = new Set();
          for (const chatItem of list) {
            for (const msg of chatItem.history || []) {
              if (!msg) continue;
              const key = msg.eventId || `${msg.role}_${msg.timestamp}_${msg.content}`;
              if (!seenKeys.has(key)) {
                seenKeys.add(key);
                mergedHistory.push(msg);
              }
            }
          }
          mergedHistory.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
          primary.history = mergedHistory;
          await window.db.chats.put(primary);
          if (window.state && window.state.chats) {
            window.state.chats[primary.id] = primary;
          }
          for (let i = 1; i < list.length; i++) {
            const dup = list[i];
            if (dup && dup.id !== primary.id) {
              await window.db.chats.delete(dup.id);
              if (window.state && window.state.chats) {
                delete window.state.chats[dup.id];
              }
            }
          }
        }

        if (changed) {
          await this.refreshAppChatAndContactsUI();
        }
      } catch (e) {}
    },

    findPeerChatByCodeAsync: async function (peerCode) {
      if (!peerCode) return null;
      const matches = [];
      if (window.state && window.state.chats) {
        for (const chat of Object.values(window.state.chats)) {
          if (chat && chat.roleType === "peer" && !chat.isGroup && chat.peerCode === peerCode) {
            matches.push(chat);
          }
        }
      }
      if (matches.length > 0) {
        matches.sort((a, b) => ((b.history || []).length - (a.history || []).length));
        return matches[0];
      }
      if (window.db && window.db.chats) {
        try {
          const allDbChats = await window.db.chats.toArray();
          const dbMatches = allDbChats.filter(
            (c) => c && c.roleType === "peer" && !c.isGroup && c.peerCode === peerCode
          );
          if (dbMatches.length > 0) {
            dbMatches.sort((a, b) => ((b.history || []).length - (a.history || []).length));
            const found = dbMatches[0];
            if (!window.state) window.state = {};
            if (!window.state.chats) window.state.chats = {};
            window.state.chats[found.id] = found;
            return found;
          }
        } catch (e) {}
      }
      return null;
    },

    findPeerGroupChatByIdAsync: async function (groupId) {
      if (!groupId) return null;
      const localId = this.getLocalGroupChatId(groupId);
      if (window.state && window.state.chats) {
        if (window.state.chats[localId]) return window.state.chats[localId];
        if (window.state.chats[groupId]) return window.state.chats[groupId];
        for (const chat of Object.values(window.state.chats)) {
          if (
            chat &&
            chat.isGroup &&
            (chat.peerGroupId === groupId || chat.id === groupId || chat.id === localId)
          ) {
            return chat;
          }
        }
      }
      if (window.db && window.db.chats) {
        try {
          const allDbChats = await window.db.chats.toArray();
          const found = allDbChats.find(
            (c) =>
              c &&
              c.isGroup &&
              (c.peerGroupId === groupId || c.id === groupId || c.id === localId)
          );
          if (found) {
            if (!window.state) window.state = {};
            if (!window.state.chats) window.state.chats = {};
            window.state.chats[found.id] = found;
            return found;
          }
        } catch (e) {}
      }
      return null;
    },

    getLocalGroupChatId: function (sharedGroupId) {
      return String(sharedGroupId);
    },

    createOrUpdatePeerChatSession: async function (
      peerCode,
      peerName,
      peerAvatar,
      groupId,
      remarkName,
      peerAvatarFrame
    ) {
      const myCode = this.getOrCreateMyPeerCode();
      const existing = await this.findPeerChatByCodeAsync(peerCode);
      const defaultAva = window.defaultAvatar || "https://api.iconify.design/lucide:user.svg?color=%23888888";
      const myProfile = this.getMyProfile();
      const finalName = peerName || remarkName || "密友";
      const finalRemark = remarkName || finalName;
      const finalAva = peerAvatar || defaultAva;
      const finalGroupId = groupId || (await this.ensureDefaultGroupId());

      this.unmarkPeerDeletedByUser(peerCode);

      if (existing) {
        if (peerName) existing.name = peerName;
        if (!existing.settings) existing.settings = {};
        if (remarkName) {
          existing.settings.remarkName = remarkName;
        } else if (peerName && (!existing.settings.remarkName || existing.settings.remarkName === "密友")) {
          existing.settings.remarkName = peerName;
        }
        if (peerAvatar) existing.settings.aiAvatar = peerAvatar;
        if (peerAvatarFrame !== undefined && peerAvatarFrame !== "") {
          existing.settings.aiAvatarFrame = peerAvatarFrame;
        }
        if (groupId) existing.groupId = groupId;
        existing.myPeerCode = myCode;
        existing.inMessageList = true;
        if (!window.state) window.state = {};
        if (!window.state.chats) window.state.chats = {};
        window.state.chats[existing.id] = existing;
        if (window.db && window.db.chats) {
          await window.db.chats.put(existing);
        }
        this.saveFriendToBackup(existing);
        await this.refreshAppChatAndContactsUI();
        return existing;
      }

      const safeTarget = peerCode.replace(/[^a-zA-Z0-9]/g, "");
      const newId = "chat_peer_" + safeTarget;

      const newPeerChat = {
        id: newId,
        name: finalName,
        roleType: "peer",
        isGroup: false,
        isPinned: false,
        groupId: finalGroupId,
        inMessageList: true,
        peerCode: peerCode,
        myPeerCode: myCode,
        unreadCount: 0,
        createdAt: Date.now(),
        history: [],
        settings: {
          remarkName: finalRemark,
          aiAvatar: finalAva,
          aiAvatarFrame: peerAvatarFrame || "",
          aiCocPanel: this.sanitizeCocPanelForPeerUI(null),
          myName: myProfile.name,
          myAvatar: myProfile.avatar,
          myAvatarFrame: myProfile.myAvatarFrame || "",
          background: "",
          theme: "default",
          fontSize: 13,
          customCss: ""
        }
      };

      if (!window.state) window.state = {};
      if (!window.state.chats) window.state.chats = {};
      window.state.chats[newId] = newPeerChat;

      if (window.db && window.db.chats) {
        await window.db.chats.put(newPeerChat);
      }

      this.saveFriendToBackup(newPeerChat);
      await this.refreshAppChatAndContactsUI();
      return newPeerChat;
    },

    receiveFriendRequest: async function (data) {
      const fromCode = data.fromCode;
      const myCode = this.getOrCreateMyPeerCode();
      if (!fromCode || fromCode === myCode) return;

      const list = this.getIncomingRequests();
      const existingIdx = list.findIndex((r) => r.fromCode === fromCode);
      const reqItem = {
        fromCode: fromCode,
        fromName: data.fromName || "密友",
        fromAvatar:
          data.fromAvatar ||
          window.defaultAvatar ||
          "https://api.iconify.design/lucide:user.svg?color=%23888888",
        fromAvatarFrame: data.fromAvatarFrame || "",
        timestamp: data.timestamp || Date.now()
      };
      if (existingIdx >= 0) {
        list[existingIdx] = reqItem;
      } else {
        list.unshift(reqItem);
      }
      this.saveIncomingRequests(list);
      this.renderFriendRequestsUI();

      this.showPeerNotice(
        "请求添加你为密友，点击处理",
        () => {
          this.openPeerModal();
        },
        {
          title: reqItem.fromName,
          message: "请求添加你为密友，点击处理",
          avatar: reqItem.fromAvatar,
          openRequests: true,
          tag: "peer_req_" + fromCode
        }
      );

      const modal = document.getElementById("contact-peer-modal");
      if (!modal || !modal.classList.contains("visible")) {
        await this.openPeerModal();
      }
    },

    acceptFriendRequest: async function (fromCode) {
      if (!fromCode) return;
      this.ensureNotificationPermission();

      const list = this.getIncomingRequests();
      const reqItem = list.find((r) => r.fromCode === fromCode);
      const remaining = list.filter((r) => r.fromCode !== fromCode);
      this.saveIncomingRequests(remaining);
      this.renderFriendRequestsUI();

      const groupSelect = document.getElementById("peer-friend-group-select");
      let selectedGroupId = null;
      if (groupSelect && groupSelect.value) {
        selectedGroupId = parseInt(groupSelect.value, 10) || null;
      }
      if (!selectedGroupId) {
        selectedGroupId = await this.ensureDefaultGroupId();
      }

      const nameInput = document.getElementById("peer-friend-name-input");
      const customRemark = nameInput && nameInput.value.trim() ? nameInput.value.trim() : "";

      const friendName = (reqItem && reqItem.fromName) || "密友";
      const friendAvatar = reqItem && reqItem.fromAvatar ? reqItem.fromAvatar : "";
      const friendFrame = reqItem && reqItem.fromAvatarFrame ? reqItem.fromAvatarFrame : "";

      const peerChat = await this.createOrUpdatePeerChatSession(
        fromCode,
        friendName,
        friendAvatar,
        selectedGroupId,
        customRemark || friendName,
        friendFrame
      );

      const myCode = this.getOrCreateMyPeerCode();
      const myProfile = this.getMyProfile();
      const smallAva = await this.compressAvatarForWire(myProfile.avatar);

      const acceptPayload = {
        type: "friend_accept",
        eventId: "evt_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9),
        fromCode: myCode,
        toCode: fromCode,
        fromName: myProfile.name,
        fromAvatar: smallAva,
        fromAvatarFrame: myProfile.myAvatarFrame || "",
        timestamp: Date.now()
      };

      this.dispatchPacketToNetwork(fromCode, acceptPayload, "/api/peer/request", true);

      if (remaining.length === 0 && this.getIncomingGroupInvites().length === 0) {
        this.closePeerModal();
      }
      this.showPeerNotice(
        "已同意 " + friendName + " 的好友申请",
        () => {
          if (peerChat && typeof window.openChat === "function") {
            window.openChat(peerChat.id);
          }
        },
        {
          title: friendName,
          message: "已成为你的密友，点击发起聊天",
          avatar: friendAvatar,
          chatId: peerChat ? peerChat.id : ""
        }
      );
    },

    rejectFriendRequest: function (fromCode) {
      if (!fromCode) return;
      const list = this.getIncomingRequests().filter((r) => r.fromCode !== fromCode);
      this.saveIncomingRequests(list);
      this.renderFriendRequestsUI();
    },

    receiveFriendAccept: async function (data) {
      const fromCode = data.fromCode;
      const myCode = this.getOrCreateMyPeerCode();
      if (!fromCode || fromCode === myCode) return;

      const outMap = this.getOutgoingRequests();
      const savedOut = outMap[fromCode] || {};
      const peerName = data.fromName || savedOut.remarkName || "密友";
      const remarkName = savedOut.remarkName || peerName;
      const groupId = savedOut.groupId || (await this.ensureDefaultGroupId());

      const peerChat = await this.createOrUpdatePeerChatSession(
        fromCode,
        peerName,
        data.fromAvatar,
        groupId,
        remarkName,
        data.fromAvatarFrame || ""
      );

      this.showPeerNotice(
        "已同意你的好友申请",
        () => {
          if (peerChat && typeof window.openChat === "function") {
            window.openChat(peerChat.id);
          }
        },
        {
          title: remarkName || peerName,
          message: "已同意你的密友申请，点击开始聊天",
          avatar: data.fromAvatar,
          chatId: peerChat ? peerChat.id : "",
          tag: "peer_accept_" + fromCode
        }
      );
    },

    openPeerGroupCreator: function () {
      if (typeof window.openContactPickerForGroupCreate === "function") {
        window.openContactPickerForGroupCreate(true);
      }
    },

    buildGroupSyncSnapshot: async function (groupChat) {
      const myCode = this.getOrCreateMyPeerCode();
      const sharedGroupId = groupChat.peerGroupId || groupChat.id;
      groupChat.peerGroupId = sharedGroupId;
      groupChat.myPeerCode = myCode;
      groupChat.isPeerGroup = true;

      const myNick = (groupChat.settings && (groupChat.settings.myNickname || groupChat.settings.myName)) || "我";
      const myAva = await this.compressAvatarForWire(
        (groupChat.settings && groupChat.settings.myAvatar) || window.defaultMyGroupAvatar || window.defaultAvatar
      );
      const grpAva = await this.compressAvatarForWire(
        (groupChat.settings && groupChat.settings.groupAvatar) || window.defaultGroupAvatar || window.defaultAvatar
      );

      const humanPeers = [
        {
          peerCode: myCode,
          originalName: myNick,
          groupNickname: myNick,
          avatar: myAva,
          avatarFrame: (groupChat.settings && groupChat.settings.myAvatarFrame) || "",
          age: (groupChat.settings && groupChat.settings.myAge) || "",
          birthday: (groupChat.settings && groupChat.settings.myBirthday) || "",
          gender: (groupChat.settings && groupChat.settings.myGender) || "",
          genderNote: (groupChat.settings && groupChat.settings.myGenderNote) || "",
          cocPanel: this.sanitizeCocPanelForPeerUI(groupChat.settings && groupChat.settings.myCocPanel),
          secretPersona: (groupChat.settings && groupChat.settings.myPersona) || ""
        }
      ];

      const aiMembers = [];
      for (const m of groupChat.members || []) {
        if (m.isPeerMember || m.roleType === "peer" || m.peerCode) {
          if (m.peerCode && m.peerCode !== myCode) {
            const cAva = await this.compressAvatarForWire(m.avatar);
            humanPeers.push({
              peerCode: m.peerCode,
              originalName: m.originalName || m.groupNickname || "密友",
              groupNickname: m.groupNickname || m.originalName || "密友",
              avatar: cAva,
              avatarFrame: m.avatarFrame || "",
              age: m.age || "",
              birthday: m.birthday || "",
              gender: m.gender || "",
              genderNote: m.genderNote || "",
              cocPanel: this.sanitizeCocPanelForPeerUI(m.cocPanel),
              secretPersona: m.secretPersona || ""
            });
          }
        } else {
          const cAiAva = await this.compressAvatarForWire(m.avatar);
          aiMembers.push({
            id: m.id,
            originalName: m.originalName || m.groupNickname || "角色",
            groupNickname: m.groupNickname || m.originalName || "角色",
            avatar: cAiAva,
            avatarFrame: m.avatarFrame || "",
            persona: m.persona || "",
            age: m.age || "",
            birthday: m.birthday || "",
            gender: m.gender || "",
            genderNote: m.genderNote || "",
            roleType: m.roleType || "",
            triggerMode: m.triggerMode || "always",
            settings: m.settings ? JSON.parse(JSON.stringify(m.settings)) : undefined,
            cocPanel: m.cocPanel ? JSON.parse(JSON.stringify(m.cocPanel)) : null
          });
        }
      }

      return {
        sharedGroupId: sharedGroupId,
        groupName: groupChat.name || "我们的群聊",
        groupAvatar: grpAva,
        humanPeers: humanPeers,
        aiMembers: aiMembers
      };
    },

    onPeerGroupCreated: async function (groupChat) {
      if (!groupChat || !groupChat.isGroup) return;
      const myCode = this.getOrCreateMyPeerCode();
      const snap = await this.buildGroupSyncSnapshot(groupChat);
      if (window.db && window.db.chats) {
        await window.db.chats.put(groupChat);
      }
      this.subscribeAllKnownFriendsMqtt();

      const peerTargets = (groupChat.members || []).filter(
        (m) => (m.isPeerMember || m.roleType === "peer") && m.peerCode && m.peerCode !== myCode
      );
      const myNick = (groupChat.settings && (groupChat.settings.myNickname || groupChat.settings.myName)) || "我";
      const myAva = await this.compressAvatarForWire(groupChat.settings && groupChat.settings.myAvatar);

      for (const pm of peerTargets) {
        const invitePayload = {
          type: "group_invite",
          eventId: "ginv_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8),
          fromCode: myCode,
          toCode: pm.peerCode,
          fromName: myNick,
          fromAvatar: myAva,
          groupId: snap.sharedGroupId,
          groupName: snap.groupName,
          groupAvatar: snap.groupAvatar,
          humanPeers: snap.humanPeers,
          aiMembers: snap.aiMembers,
          timestamp: Date.now()
        };
        this.dispatchPacketToNetwork(pm.peerCode, invitePayload, "/api/peer/send", false);
      }
    },

    onMembersAddedToPeerGroup: async function (groupChat, newlyAddedMembers) {
      if (!groupChat || !groupChat.isGroup) return;
      const myCode = this.getOrCreateMyPeerCode();
      const snap = await this.buildGroupSyncSnapshot(groupChat);
      if (window.db && window.db.chats) {
        await window.db.chats.put(groupChat);
      }
      this.subscribeAllKnownFriendsMqtt();

      const myNick = (groupChat.settings && (groupChat.settings.myNickname || groupChat.settings.myName)) || "我";
      const myAva = await this.compressAvatarForWire(groupChat.settings && groupChat.settings.myAvatar);

      for (const m of newlyAddedMembers || []) {
        if ((m.isPeerMember || m.roleType === "peer") && m.peerCode && m.peerCode !== myCode) {
          const invitePayload = {
            type: "group_invite",
            eventId: "ginv_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8),
            fromCode: myCode,
            toCode: m.peerCode,
            fromName: myNick,
            fromAvatar: myAva,
            groupId: snap.sharedGroupId,
            groupName: snap.groupName,
            groupAvatar: snap.groupAvatar,
            humanPeers: snap.humanPeers,
            aiMembers: snap.aiMembers,
            timestamp: Date.now()
          };
          this.dispatchPacketToNetwork(m.peerCode, invitePayload, "/api/peer/send", false);
        }
      }

      await this.syncGroupSettingsToPeers(groupChat);
    },

    receiveGroupInvite: async function (data) {
      const myCode = this.getOrCreateMyPeerCode();
      if (!data || !data.groupId || data.fromCode === myCode) return;

      const list = this.getIncomingGroupInvites();
      const idx = list.findIndex((item) => item.groupId === data.groupId);
      const inviteItem = {
        groupId: data.groupId,
        groupName: data.groupName || "联机群聊",
        groupAvatar: data.groupAvatar || window.defaultGroupAvatar || window.defaultAvatar,
        fromCode: data.fromCode,
        fromName: data.fromName || "密友",
        fromAvatar: data.fromAvatar || window.defaultAvatar,
        humanPeers: Array.isArray(data.humanPeers) ? data.humanPeers : [],
        aiMembers: Array.isArray(data.aiMembers) ? data.aiMembers : [],
        timestamp: data.timestamp || Date.now()
      };
      if (idx >= 0) {
        list[idx] = inviteItem;
      } else {
        list.unshift(inviteItem);
      }
      this.saveIncomingGroupInvites(list);
      this.renderFriendRequestsUI();

      this.showPeerNotice(
        "邀请你加入群聊 " + inviteItem.groupName,
        () => {
          this.openPeerModal();
        },
        {
          title: inviteItem.fromName,
          message: "邀请你加入群聊 " + inviteItem.groupName,
          avatar: inviteItem.fromAvatar,
          openRequests: true,
          tag: "peer_ginv_" + inviteItem.groupId
        }
      );

      if (typeof window.showCustomConfirm === "function") {
        const ok = await window.showCustomConfirm(
          "群聊通知",
          `“${inviteItem.fromName}”邀请你加入群聊“${inviteItem.groupName}”，是否加入？`
        );
        if (ok) {
          await this.acceptGroupInvite(inviteItem.groupId);
        }
      }
    },

    acceptGroupInvite: async function (sharedGroupId) {
      if (!sharedGroupId) return;
      const list = this.getIncomingGroupInvites();
      const invite = list.find((item) => item.groupId === sharedGroupId);
      const remaining = list.filter((item) => item.groupId !== sharedGroupId);
      this.saveIncomingGroupInvites(remaining);
      this.renderFriendRequestsUI();
      if (!invite) return;

      const myCode = this.getOrCreateMyPeerCode();
      const myProfile = this.getMyProfile();
      const localChatId = this.getLocalGroupChatId(sharedGroupId);
      let groupChat = await this.findPeerGroupChatByIdAsync(sharedGroupId);

      const builtMembers = [];
      for (const hp of invite.humanPeers || []) {
        if (!hp || !hp.peerCode || hp.peerCode === myCode) continue;
        builtMembers.push({
          id: "peer_mem_" + hp.peerCode.replace(/[^a-zA-Z0-9]/g, ""),
          peerCode: hp.peerCode,
          isPeerMember: true,
          roleType: "peer",
          isInvestigatorLocked: true,
          originalName: hp.originalName || hp.groupNickname || "密友",
          groupNickname: hp.groupNickname || hp.originalName || "密友",
          avatar: hp.avatar || window.defaultAvatar,
          avatarFrame: hp.avatarFrame || "",
          persona: "",
          secretPersona: hp.secretPersona || "",
          age: hp.age || "",
          birthday: hp.birthday || "",
          gender: hp.gender || "",
          genderNote: hp.genderNote || "",
          cocPanel: this.sanitizeCocPanelForPeerUI(hp.cocPanel),
          isAdmin: false,
          groupTitle: ""
        });
      }

      for (const am of invite.aiMembers || []) {
        if (!am) continue;
        builtMembers.push({
          id: am.id || "ai_mem_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
          originalName: am.originalName || am.groupNickname || "角色",
          groupNickname: am.groupNickname || am.originalName || "角色",
          avatar: am.avatar || window.defaultAvatar,
          avatarFrame: am.avatarFrame || "",
          persona: am.persona || "",
          age: am.age || "",
          birthday: am.birthday || "",
          gender: am.gender || "",
          genderNote: am.genderNote || "",
          roleType: am.roleType || "",
          triggerMode: am.triggerMode || "always",
          settings: am.settings ? JSON.parse(JSON.stringify(am.settings)) : undefined,
          cocPanel: am.cocPanel || (typeof window.getDefaultCocData === "function" ? window.getDefaultCocData() : null),
          isAdmin: false,
          groupTitle: ""
        });
      }

      if (groupChat) {
        groupChat.name = invite.groupName || groupChat.name;
        groupChat.isPeerGroup = true;
        groupChat.peerGroupId = sharedGroupId;
        groupChat.myPeerCode = myCode;
        groupChat.members = builtMembers;
      } else {
        const defaultCoc = typeof window.getDefaultCocData === "function" ? window.getDefaultCocData() : null;
        groupChat = {
          id: localChatId,
          peerGroupId: sharedGroupId,
          myPeerCode: myCode,
          name: invite.groupName || "联机群聊",
          isGroup: true,
          isPeerGroup: true,
          ownerId: "peer_owner",
          members: builtMembers,
          unreadCount: 0,
          history: [
            {
              role: "system",
              type: "pat_message",
              content: `你已加入群聊“${invite.groupName || "联机群聊"}”`,
              timestamp: Date.now()
            }
          ],
          musicData: { totalTime: 0 },
          settings: {
            myPersona: "",
            myNickname: myProfile.name || "我",
            myName: myProfile.name || "我",
            myCocPanel: defaultCoc,
            maxMemory: 10,
            groupAvatar: invite.groupAvatar || window.defaultGroupAvatar || window.defaultAvatar,
            myAvatar: myProfile.avatar || window.defaultMyGroupAvatar || window.defaultAvatar,
            myAvatarFrame: myProfile.myAvatarFrame || "",
            background: "",
            theme: "default",
            fontSize: 13,
            customCss: "",
            linkedWorldBookIds: [],
            stickerLibrary: [],
            linkedMemories: [],
            isUserAdmin: false,
            myGroupTitle: "",
            affectionEnabled: false,
            voiceMode: "manual",
            summary: {
              enabled: true,
              mode: "auto",
              count: 20,
              prompt: "请你以第三人称的视角，客观、冷静、不带任何感情色彩地总结以下对话的核心事件和信息。禁止进行任何角色扮演或添加主观评论。",
              lastSummaryIndex: -1
            }
          }
        };
      }

      if (!window.state) window.state = {};
      if (!window.state.chats) window.state.chats = {};
      window.state.chats[groupChat.id] = groupChat;
      if (window.db && window.db.chats) {
        await window.db.chats.put(groupChat);
      }

      this.subscribeAllKnownFriendsMqtt();
      await this.refreshAppChatAndContactsUI();

      const smallMyAva = await this.compressAvatarForWire(groupChat.settings.myAvatar);
      for (const m of builtMembers) {
        if (m.peerCode && m.peerCode !== myCode) {
          const joinPkt = {
            type: "group_join_accept",
            eventId: "gjoin_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8),
            fromCode: myCode,
            toCode: m.peerCode,
            groupId: sharedGroupId,
            memberProfile: {
              peerCode: myCode,
              originalName: groupChat.settings.myNickname || "我",
              groupNickname: groupChat.settings.myNickname || "我",
              avatar: smallMyAva,
              avatarFrame: groupChat.settings.myAvatarFrame || "",
              age: groupChat.settings.myAge || "",
              birthday: groupChat.settings.myBirthday || "",
              gender: groupChat.settings.myGender || "",
              genderNote: groupChat.settings.myGenderNote || "",
              cocPanel: this.sanitizeCocPanelForPeerUI(groupChat.settings.myCocPanel),
              secretPersona: groupChat.settings.myPersona || ""
            },
            timestamp: Date.now()
          };
          this.dispatchPacketToNetwork(m.peerCode, joinPkt, "/api/peer/send", false);
        }
      }

      if (remaining.length === 0 && this.getIncomingRequests().length === 0) {
        this.closePeerModal();
      }
      if (typeof window.openChat === "function") {
        window.openChat(groupChat.id);
      }
    },

    rejectGroupInvite: function (sharedGroupId) {
      if (!sharedGroupId) return;
      const remaining = this.getIncomingGroupInvites().filter((i) => i.groupId !== sharedGroupId);
      this.saveIncomingGroupInvites(remaining);
      this.renderFriendRequestsUI();
    },

    receiveGroupJoinAccept: async function (data) {
      if (!data || !data.groupId || !data.memberProfile) return;
      const myCode = this.getOrCreateMyPeerCode();
      const mp = data.memberProfile;
      if (!mp.peerCode || mp.peerCode === myCode) return;

      const groupChat = await this.findPeerGroupChatByIdAsync(data.groupId);
      if (!groupChat) return;

      if (!Array.isArray(groupChat.members)) groupChat.members = [];
      let member = groupChat.members.find((m) => m.peerCode === mp.peerCode);
      if (!member) {
        member = {
          id: "peer_mem_" + mp.peerCode.replace(/[^a-zA-Z0-9]/g, ""),
          peerCode: mp.peerCode,
          isPeerMember: true,
          roleType: "peer",
          isInvestigatorLocked: true,
          originalName: mp.originalName || mp.groupNickname || "密友",
          groupNickname: mp.groupNickname || mp.originalName || "密友",
          avatar: mp.avatar || window.defaultAvatar,
          avatarFrame: mp.avatarFrame || "",
          persona: "",
          secretPersona: mp.secretPersona || "",
          age: mp.age || "",
          birthday: mp.birthday || "",
          gender: mp.gender || "",
          genderNote: mp.genderNote || "",
          cocPanel: this.sanitizeCocPanelForPeerUI(mp.cocPanel),
          isAdmin: false,
          groupTitle: ""
        };
        groupChat.members.push(member);
      } else {
        member.isPeerMember = true;
        member.roleType = "peer";
        member.isInvestigatorLocked = true;
        member.groupNickname = mp.groupNickname || member.groupNickname;
        if (mp.avatar) member.avatar = mp.avatar;
        if (mp.avatarFrame !== undefined) member.avatarFrame = mp.avatarFrame;
        member.cocPanel = this.sanitizeCocPanelForPeerUI(mp.cocPanel);
        member.secretPersona = mp.secretPersona || "";
      }

      const sysMsg = {
        role: "system",
        type: "pat_message",
        content: `“${member.groupNickname || "密友"}”已确认加入群聊`,
        timestamp: Date.now()
      };
      groupChat.history.push(sysMsg);

      if (window.db && window.db.chats) {
        await window.db.chats.put(groupChat);
      }
      if (window.state && String(window.state.activeChatId) === String(groupChat.id)) {
        if (typeof window.appendMessage === "function") {
          window.appendMessage(sysMsg, groupChat);
        }
      }
      await this.refreshAppChatAndContactsUI();
    },

    syncGroupSettingsToPeers: async function (groupChat) {
      if (!groupChat || !groupChat.isGroup || !groupChat.isPeerGroup) return;
      const myCode = this.getOrCreateMyPeerCode();
      const snap = await this.buildGroupSyncSnapshot(groupChat);

      const peerMemberFrames = {};
      for (const m of groupChat.members || []) {
        if (m.peerCode) {
          peerMemberFrames[m.peerCode] = m.avatarFrame || "";
        }
      }

      for (const m of groupChat.members || []) {
        if ((m.isPeerMember || m.roleType === "peer") && m.peerCode && m.peerCode !== myCode) {
          const pkt = {
            type: "group_member_update",
            eventId: "gmup_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8),
            fromCode: myCode,
            toCode: m.peerCode,
            groupId: snap.sharedGroupId,
            groupName: snap.groupName,
            groupAvatar: snap.groupAvatar,
            humanPeers: snap.humanPeers,
            aiMembers: snap.aiMembers,
            peerMemberFrames: peerMemberFrames,
            timestamp: Date.now()
          };
          this.dispatchPacketToNetwork(m.peerCode, pkt, "/api/peer/send", false);
        }
      }
    },

    receiveGroupMemberUpdate: async function (data) {
      if (!data || !data.groupId) return;
      const myCode = this.getOrCreateMyPeerCode();
      if (data.fromCode === myCode) return;

      const groupChat = await this.findPeerGroupChatByIdAsync(data.groupId);
      if (!groupChat) return;

      if (data.groupName) groupChat.name = data.groupName;
      if (!groupChat.settings) groupChat.settings = {};
      if (data.groupAvatar) groupChat.settings.groupAvatar = data.groupAvatar;

      if (data.peerMemberFrames && data.peerMemberFrames[myCode] !== undefined) {
        groupChat.settings.myAvatarFrame = data.peerMemberFrames[myCode] || "";
      }

      if (!Array.isArray(groupChat.members)) groupChat.members = [];

      for (const hp of data.humanPeers || []) {
        if (!hp || !hp.peerCode || hp.peerCode === myCode) continue;
        let existing = groupChat.members.find((m) => m.peerCode === hp.peerCode);
        if (!existing) {
          existing = {
            id: "peer_mem_" + hp.peerCode.replace(/[^a-zA-Z0-9]/g, ""),
            peerCode: hp.peerCode,
            isPeerMember: true,
            roleType: "peer",
            isInvestigatorLocked: true,
            originalName: hp.originalName || hp.groupNickname || "密友",
            groupNickname: hp.groupNickname || hp.originalName || "密友",
            avatar: hp.avatar || window.defaultAvatar,
            avatarFrame: hp.avatarFrame || "",
            persona: "",
            secretPersona: hp.secretPersona || "",
            age: hp.age || "",
            birthday: hp.birthday || "",
            gender: hp.gender || "",
            genderNote: hp.genderNote || "",
            cocPanel: this.sanitizeCocPanelForPeerUI(hp.cocPanel),
            isAdmin: false,
            groupTitle: ""
          };
          groupChat.members.push(existing);
        } else {
          existing.isPeerMember = true;
          existing.roleType = "peer";
          existing.isInvestigatorLocked = true;
          if (hp.groupNickname) existing.groupNickname = hp.groupNickname;
          if (hp.avatar) existing.avatar = hp.avatar;
          if (hp.avatarFrame !== undefined) existing.avatarFrame = hp.avatarFrame;
          if (hp.age !== undefined) existing.age = hp.age;
          if (hp.birthday !== undefined) existing.birthday = hp.birthday;
          if (hp.gender !== undefined) existing.gender = hp.gender;
          if (hp.genderNote !== undefined) existing.genderNote = hp.genderNote;
          existing.cocPanel = this.sanitizeCocPanelForPeerUI(hp.cocPanel);
          existing.secretPersona = hp.secretPersona || "";
          existing.persona = "";
        }
      }

      for (const am of data.aiMembers || []) {
        if (!am) continue;
        let existingAi = groupChat.members.find(
          (m) => !m.isPeerMember && (m.id === am.id || m.originalName === am.originalName)
        );
        if (!existingAi) {
          groupChat.members.push({
            id: am.id || "ai_mem_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
            originalName: am.originalName || am.groupNickname || "角色",
            groupNickname: am.groupNickname || am.originalName || "角色",
            avatar: am.avatar || window.defaultAvatar,
            avatarFrame: am.avatarFrame || "",
            persona: am.persona || "",
            age: am.age || "",
            birthday: am.birthday || "",
            gender: am.gender || "",
            genderNote: am.genderNote || "",
            roleType: am.roleType || "",
            triggerMode: am.triggerMode || "always",
            settings: am.settings ? JSON.parse(JSON.stringify(am.settings)) : undefined,
            cocPanel: am.cocPanel || (typeof window.getDefaultCocData === "function" ? window.getDefaultCocData() : null),
            isAdmin: false,
            groupTitle: ""
          });
        } else {
          if (am.groupNickname) existingAi.groupNickname = am.groupNickname;
          if (am.avatar) existingAi.avatar = am.avatar;
          if (am.avatarFrame !== undefined) existingAi.avatarFrame = am.avatarFrame;
          if (am.persona !== undefined) existingAi.persona = am.persona;
          if (am.cocPanel) existingAi.cocPanel = am.cocPanel;
          if (am.settings) existingAi.settings = am.settings;
        }
      }

      if (window.db && window.db.chats) {
        await window.db.chats.put(groupChat);
      }
      if (window.state && String(window.state.activeChatId) === String(groupChat.id)) {
        const titleEl = document.getElementById("chat-header-title");
        if (titleEl) titleEl.textContent = groupChat.name;
        if (typeof window.renderChatInterfaceProxy === "function") {
          window.renderChatInterfaceProxy(groupChat.id);
        }
      }
      await this.refreshAppChatAndContactsUI();
    },

    broadcastGroupMessage: async function (groupChat, msg, isFromLocalUser) {
      if (!groupChat || !groupChat.isGroup || !groupChat.isPeerGroup || !msg) return;
      const myCode = this.getOrCreateMyPeerCode();
      const sharedGroupId = groupChat.peerGroupId || groupChat.id;
      groupChat.peerGroupId = sharedGroupId;

      const myNick = (groupChat.settings && (groupChat.settings.myNickname || groupChat.settings.myName)) || "我";
      const myAva = await this.compressAvatarForWire(
        (groupChat.settings && groupChat.settings.myAvatar) || window.defaultMyGroupAvatar || window.defaultAvatar
      );
      const myFrame = (groupChat.settings && groupChat.settings.myAvatarFrame) || "";

      const baseEventId = msg.eventId || "gmsg_" + (msg.timestamp || Date.now()) + "_" + Math.random().toString(36).slice(2, 7);
      msg.eventId = baseEventId;

      const peerTargets = (groupChat.members || []).filter(
        (m) => (m.isPeerMember || m.roleType === "peer") && m.peerCode && m.peerCode !== myCode
      );

      for (const pm of peerTargets) {
        const pkt = {
          type: "group_message",
          eventId: baseEventId + "_" + pm.peerCode,
          msgEventId: baseEventId,
          fromCode: myCode,
          toCode: pm.peerCode,
          groupId: sharedGroupId,
          isFromHumanPeer: Boolean(isFromLocalUser),
          senderName: isFromLocalUser ? myNick : (msg.senderName || msg.sender || "角色"),
          senderAvatar: isFromLocalUser ? myAva : (msg.senderAvatar || ""),
          senderAvatarFrame: isFromLocalUser ? myFrame : (msg.senderAvatarFrame || ""),
          msgPayload: {
            ...msg,
            eventId: baseEventId
          },
          timestamp: msg.timestamp || Date.now()
        };
        this.dispatchPacketToNetwork(pm.peerCode, pkt, "/api/peer/send", false);
      }
    },

    receiveGroupMessage: async function (data) {
      if (!data || !data.groupId || !data.msgPayload) return;
      const myCode = this.getOrCreateMyPeerCode();
      if (data.fromCode === myCode) return;

      const groupChat = await this.findPeerGroupChatByIdAsync(data.groupId);
      if (!groupChat) return;

      if (!Array.isArray(groupChat.history)) groupChat.history = [];
      const incomingRaw = data.msgPayload;
      const msgEvtId = data.msgEventId || incomingRaw.eventId || "";

      const isDup = groupChat.history.some(
        (m) =>
          (msgEvtId && m.eventId === msgEvtId) ||
          (m.timestamp === incomingRaw.timestamp && m.content === incomingRaw.content)
      );
      if (isDup) return;

      if (data.isFromHumanPeer && data.fromCode) {
        if (!Array.isArray(groupChat.members)) groupChat.members = [];
        let peerMem = groupChat.members.find((m) => m.peerCode === data.fromCode);
        if (!peerMem) {
          peerMem = {
            id: "peer_mem_" + data.fromCode.replace(/[^a-zA-Z0-9]/g, ""),
            peerCode: data.fromCode,
            isPeerMember: true,
            roleType: "peer",
            isInvestigatorLocked: true,
            originalName: data.senderName || "密友",
            groupNickname: data.senderName || "密友",
            avatar: data.senderAvatar || window.defaultAvatar,
            avatarFrame: data.senderAvatarFrame || "",
            persona: "",
            secretPersona: "",
            cocPanel: this.sanitizeCocPanelForPeerUI(null),
            isAdmin: false,
            groupTitle: ""
          };
          groupChat.members.push(peerMem);
          this.subscribeAllKnownFriendsMqtt();
        } else {
          if (data.senderName) peerMem.groupNickname = data.senderName;
          if (data.senderAvatar) peerMem.avatar = data.senderAvatar;
          if (data.senderAvatarFrame !== undefined) peerMem.avatarFrame = data.senderAvatarFrame;
        }
      }

      const msgToInsert = {
        ...incomingRaw,
        eventId: msgEvtId,
        role: "assistant",
        isPeerUserMessage: Boolean(data.isFromHumanPeer),
        senderPeerCode: data.isFromHumanPeer ? data.fromCode : undefined,
        sender: data.senderName || incomingRaw.senderName || incomingRaw.sender || "成员",
        senderName: data.senderName || incomingRaw.senderName || incomingRaw.sender || "成员",
        senderAvatar: data.senderAvatar || incomingRaw.senderAvatar || window.defaultAvatar,
        senderAvatarFrame: data.senderAvatarFrame || incomingRaw.senderAvatarFrame || "",
        timestamp: incomingRaw.timestamp || data.timestamp || Date.now()
      };

      groupChat.history.push(msgToInsert);

      const chatScreen = document.getElementById("chat-interface-screen");
      const isCurrentActive =
        window.state &&
        String(window.state.activeChatId) === String(groupChat.id) &&
        chatScreen &&
        chatScreen.classList.contains("active") &&
        !document.hidden;

      if (!isCurrentActive) {
        groupChat.unreadCount = (groupChat.unreadCount || 0) + 1;
      }

      if (window.db && window.db.chats) {
        await window.db.chats.put(groupChat);
      }

      if (window.state && String(window.state.activeChatId) === String(groupChat.id)) {
        if (typeof window.appendMessage === "function") {
          window.appendMessage(msgToInsert, groupChat);
        } else if (typeof window.renderChatInterfaceProxy === "function") {
          window.renderChatInterfaceProxy(groupChat.id);
        }
      }

      const isGroupSticker =
        msgToInsert.type === "sticker" ||
        Boolean(msgToInsert.isPeerOnlySticker) ||
        Boolean(msgToInsert.meaning);
      const isGroupImage =
        !isGroupSticker &&
        (Array.isArray(msgToInsert.content) ||
          msgToInsert.type === "naiimag" ||
          msgToInsert.type === "nov" ||
          msgToInsert.type === "sd" ||
          msgToInsert.type === "image" ||
          msgToInsert.type === "realimag" ||
          msgToInsert.type === "novelai" ||
          msgToInsert.type === "nai_image" ||
          msgToInsert.type === "module_pure_image" ||
          msgToInsert.isModuleImageOnly ||
          Boolean(msgToInsert.imageUrl) ||
          Boolean(msgToInsert.image));
      const previewText =
        msgToInsert.type === "voice_message"
          ? "[语音]"
          : isGroupSticker
            ? `[表情: ${msgToInsert.meaning || "表情"}]`
            : isGroupImage
              ? "[图片]"
              : String(msgToInsert.content || "");

      this.showPeerNotice(
        `${msgToInsert.senderName}: ${previewText}`,
        () => {
          if (typeof window.openChat === "function") {
            window.openChat(groupChat.id);
          }
        },
        {
          title: groupChat.name || "群聊",
          message: `${msgToInsert.senderName}: ${previewText}`,
          avatar: groupChat.settings?.groupAvatar || msgToInsert.senderAvatar,
          chatId: groupChat.id,
          tag: "peer_gmsg_" + groupChat.id
        }
      );

      await this.refreshAppChatAndContactsUI();
    },

    broadcastMessageEdit: function (chat, originalTimestamp, messagesToInsert) {
      if (!chat || !originalTimestamp || !Array.isArray(messagesToInsert)) return;
      const myCode = this.getOrCreateMyPeerCode();
      const targets = [];

      if (chat.isGroup && chat.isPeerGroup) {
        (chat.members || []).forEach((m) => {
          if ((m.isPeerMember || m.roleType === "peer") && m.peerCode && m.peerCode !== myCode) {
            targets.push(m.peerCode);
          }
        });
      } else if (chat.roleType === "peer" && chat.peerCode) {
        targets.push(chat.peerCode);
      }

      const sharedGroupId = chat.isGroup ? (chat.peerGroupId || chat.id) : "";
      for (const peerCode of targets) {
        const pkt = {
          type: "msg_edit",
          eventId: "medit_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8),
          fromCode: myCode,
          toCode: peerCode,
          isGroup: Boolean(chat.isGroup),
          groupId: sharedGroupId,
          originalTimestamp: originalTimestamp,
          messagesToInsert: messagesToInsert,
          timestamp: Date.now()
        };
        this.dispatchPacketToNetwork(peerCode, pkt, "/api/peer/send", false);
      }
    },

    receiveMessageEdit: async function (data) {
      if (!data || !data.originalTimestamp || !Array.isArray(data.messagesToInsert)) return;
      const myCode = this.getOrCreateMyPeerCode();
      if (data.fromCode === myCode) return;

      const chat = data.isGroup
        ? await this.findPeerGroupChatByIdAsync(data.groupId)
        : await this.findPeerChatByCodeAsync(data.fromCode);
      if (!chat || !Array.isArray(chat.history)) return;

      const idx = chat.history.findIndex((m) => m.timestamp === data.originalTimestamp);
      if (idx === -1) return;

      const origMsg = chat.history[idx];
      const mapped = data.messagesToInsert.map((nm) => ({
        ...origMsg,
        ...nm,
        role: origMsg.role,
        isPeerUserMessage: origMsg.isPeerUserMessage,
        senderPeerCode: origMsg.senderPeerCode
      }));

      chat.history.splice(idx, 1, ...mapped);
      let reassignTs = data.originalTimestamp;
      for (let i = idx; i < chat.history.length; i++) {
        chat.history[i].timestamp = reassignTs++;
      }

      if (window.db && window.db.chats) {
        await window.db.chats.put(chat);
      }
      if (window.state && String(window.state.activeChatId) === String(chat.id)) {
        if (typeof window.renderChatInterfaceProxy === "function") {
          window.renderChatInterfaceProxy(chat.id);
        }
      }
      await this.refreshAppChatAndContactsUI();
    },

    broadcastMessageDelete: function (chat, deletedTimestamps) {
      if (!chat || !Array.isArray(deletedTimestamps) || deletedTimestamps.length === 0) return;
      const myCode = this.getOrCreateMyPeerCode();
      const targets = [];

      if (chat.isGroup && chat.isPeerGroup) {
        (chat.members || []).forEach((m) => {
          if ((m.isPeerMember || m.roleType === "peer") && m.peerCode && m.peerCode !== myCode) {
            targets.push(m.peerCode);
          }
        });
      } else if (chat.roleType === "peer" && chat.peerCode) {
        targets.push(chat.peerCode);
      }

      const sharedGroupId = chat.isGroup ? (chat.peerGroupId || chat.id) : "";
      for (const peerCode of targets) {
        const pkt = {
          type: "msg_delete",
          eventId: "mdel_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8),
          fromCode: myCode,
          toCode: peerCode,
          isGroup: Boolean(chat.isGroup),
          groupId: sharedGroupId,
          deletedTimestamps: deletedTimestamps,
          timestamp: Date.now()
        };
        this.dispatchPacketToNetwork(peerCode, pkt, "/api/peer/send", false);
      }
    },

    receiveMessageDelete: async function (data) {
      if (!data || !Array.isArray(data.deletedTimestamps)) return;
      const myCode = this.getOrCreateMyPeerCode();
      if (data.fromCode === myCode) return;

      const chat = data.isGroup
        ? await this.findPeerGroupChatByIdAsync(data.groupId)
        : await this.findPeerChatByCodeAsync(data.fromCode);
      if (!chat || !Array.isArray(chat.history)) return;

      const delSet = new Set(data.deletedTimestamps);
      chat.history = chat.history.filter((m) => !delSet.has(m.timestamp));

      if (window.db && window.db.chats) {
        await window.db.chats.put(chat);
      }
      if (window.state && String(window.state.activeChatId) === String(chat.id)) {
        if (typeof window.renderChatInterfaceProxy === "function") {
          window.renderChatInterfaceProxy(chat.id);
        }
      }
      await this.refreshAppChatAndContactsUI();
    },

    renderFriendRequestsUI: function () {
      const section = document.getElementById("peer-requests-section");
      const listEl = document.getElementById("peer-requests-list");
      if (!section || !listEl) return;

      const reqs = this.getIncomingRequests();
      const groupInvs = this.getIncomingGroupInvites();
      listEl.innerHTML = "";

      if (reqs.length === 0 && groupInvs.length === 0) {
        section.style.display = "none";
        return;
      }

      section.style.display = "flex";
      const defaultAva = window.defaultAvatar || "https://api.iconify.design/lucide:user.svg?color=%23888888";

      groupInvs.forEach((inv) => {
        const row = document.createElement("div");
        row.style.display = "flex";
        row.style.alignItems = "center";
        row.style.gap = "8px";
        row.style.padding = "8px";
        row.style.background = "var(--secondary-bg)";
        row.style.border = "1px solid var(--border-color)";
        row.style.borderRadius = "8px";
        row.style.boxSizing = "border-box";
        row.style.width = "100%";

        const img = document.createElement("img");
        img.src = inv.fromAvatar || defaultAva;
        img.style.width = "34px";
        img.style.height = "34px";
        img.style.minWidth = "34px";
        img.style.flex = "0 0 34px";
        img.style.borderRadius = "50%";
        img.style.objectFit = "cover";
        img.style.border = "1px solid var(--border-color)";

        const infoCol = document.createElement("div");
        infoCol.style.flex = "1 1 auto";
        infoCol.style.minWidth = "0";
        infoCol.style.overflow = "hidden";
        infoCol.style.display = "flex";
        infoCol.style.flexDirection = "column";
        infoCol.style.gap = "2px";

        const nameSpan = document.createElement("span");
        nameSpan.textContent = "群聊邀请: " + (inv.groupName || "联机群聊");
        nameSpan.style.fontSize = "12.5px";
        nameSpan.style.fontWeight = "600";
        nameSpan.style.color = "var(--text-primary)";
        nameSpan.style.whiteSpace = "nowrap";
        nameSpan.style.overflow = "hidden";
        nameSpan.style.textOverflow = "ellipsis";

        const subSpan = document.createElement("span");
        subSpan.textContent = "来自: " + (inv.fromName || "密友");
        subSpan.style.fontSize = "11px";
        subSpan.style.color = "var(--text-secondary)";
        subSpan.style.whiteSpace = "nowrap";
        subSpan.style.overflow = "hidden";
        subSpan.style.textOverflow = "ellipsis";

        infoCol.appendChild(nameSpan);
        infoCol.appendChild(subSpan);

        const btnBox = document.createElement("div");
        btnBox.style.display = "flex";
        btnBox.style.gap = "6px";
        btnBox.style.flexShrink = "0";
        btnBox.style.marginLeft = "auto";
        btnBox.style.alignItems = "center";

        const acceptBtn = document.createElement("button");
        acceptBtn.type = "button";
        acceptBtn.className = "moe-btn";
        acceptBtn.textContent = "加入";
        acceptBtn.style.flex = "0 0 44px";
        acceptBtn.style.width = "44px";
        acceptBtn.style.minWidth = "44px";
        acceptBtn.style.maxWidth = "44px";
        acceptBtn.style.height = "28px";
        acceptBtn.style.padding = "0";
        acceptBtn.style.fontSize = "12px";
        acceptBtn.style.borderRadius = "6px";
        acceptBtn.style.background = "var(--accent-color)";
        acceptBtn.style.color = "var(--card-bg)";
        acceptBtn.style.border = "none";
        acceptBtn.style.display = "inline-flex";
        acceptBtn.style.alignItems = "center";
        acceptBtn.style.justifyContent = "center";
        acceptBtn.style.cursor = "pointer";
        acceptBtn.onclick = () => {
          this.acceptGroupInvite(inv.groupId);
        };

        const rejectBtn = document.createElement("button");
        rejectBtn.type = "button";
        rejectBtn.className = "moe-btn";
        rejectBtn.textContent = "忽略";
        rejectBtn.style.flex = "0 0 44px";
        rejectBtn.style.width = "44px";
        rejectBtn.style.minWidth = "44px";
        rejectBtn.style.maxWidth = "44px";
        rejectBtn.style.height = "28px";
        rejectBtn.style.padding = "0";
        rejectBtn.style.fontSize = "12px";
        rejectBtn.style.borderRadius = "6px";
        rejectBtn.style.background = "var(--card-bg)";
        rejectBtn.style.color = "var(--text-secondary)";
        rejectBtn.style.border = "1px solid var(--border-color)";
        rejectBtn.style.display = "inline-flex";
        rejectBtn.style.alignItems = "center";
        rejectBtn.style.justifyContent = "center";
        rejectBtn.style.cursor = "pointer";
        rejectBtn.onclick = () => {
          this.rejectGroupInvite(inv.groupId);
        };

        btnBox.appendChild(acceptBtn);
        btnBox.appendChild(rejectBtn);

        row.appendChild(img);
        row.appendChild(infoCol);
        row.appendChild(btnBox);
        listEl.appendChild(row);
      });

      reqs.forEach((req) => {
        const row = document.createElement("div");
        row.style.display = "flex";
        row.style.alignItems = "center";
        row.style.gap = "8px";
        row.style.padding = "8px";
        row.style.background = "var(--secondary-bg)";
        row.style.border = "1px solid var(--border-color)";
        row.style.borderRadius = "8px";
        row.style.boxSizing = "border-box";
        row.style.width = "100%";

        const img = document.createElement("img");
        img.src = req.fromAvatar || defaultAva;
        img.style.width = "34px";
        img.style.height = "34px";
        img.style.minWidth = "34px";
        img.style.flex = "0 0 34px";
        img.style.borderRadius = "50%";
        img.style.objectFit = "cover";
        img.style.border = "1px solid var(--border-color)";

        const infoCol = document.createElement("div");
        infoCol.style.flex = "1 1 auto";
        infoCol.style.minWidth = "0";
        infoCol.style.overflow = "hidden";
        infoCol.style.display = "flex";
        infoCol.style.flexDirection = "column";
        infoCol.style.gap = "2px";

        const nameSpan = document.createElement("span");
        nameSpan.textContent = req.fromName || "密友";
        nameSpan.style.fontSize = "12.5px";
        nameSpan.style.fontWeight = "600";
        nameSpan.style.color = "var(--text-primary)";
        nameSpan.style.whiteSpace = "nowrap";
        nameSpan.style.overflow = "hidden";
        nameSpan.style.textOverflow = "ellipsis";

        const codeSpan = document.createElement("span");
        codeSpan.textContent = req.fromCode;
        codeSpan.style.fontSize = "11px";
        codeSpan.style.color = "var(--text-secondary)";
        codeSpan.style.whiteSpace = "nowrap";
        codeSpan.style.overflow = "hidden";
        codeSpan.style.textOverflow = "ellipsis";
        codeSpan.style.fontFamily = "monospace";

        infoCol.appendChild(nameSpan);
        infoCol.appendChild(codeSpan);

        const btnBox = document.createElement("div");
        btnBox.style.display = "flex";
        btnBox.style.gap = "6px";
        btnBox.style.flexShrink = "0";
        btnBox.style.marginLeft = "auto";
        btnBox.style.alignItems = "center";

        const acceptBtn = document.createElement("button");
        acceptBtn.type = "button";
        acceptBtn.className = "moe-btn";
        acceptBtn.textContent = "同意";
        acceptBtn.style.flex = "0 0 44px";
        acceptBtn.style.width = "44px";
        acceptBtn.style.minWidth = "44px";
        acceptBtn.style.maxWidth = "44px";
        acceptBtn.style.height = "28px";
        acceptBtn.style.padding = "0";
        acceptBtn.style.fontSize = "12px";
        acceptBtn.style.borderRadius = "6px";
        acceptBtn.style.background = "var(--accent-color)";
        acceptBtn.style.color = "var(--card-bg)";
        acceptBtn.style.border = "none";
        acceptBtn.style.display = "inline-flex";
        acceptBtn.style.alignItems = "center";
        acceptBtn.style.justifyContent = "center";
        acceptBtn.style.cursor = "pointer";
        acceptBtn.onclick = () => {
          this.acceptFriendRequest(req.fromCode);
        };

        const rejectBtn = document.createElement("button");
        rejectBtn.type = "button";
        rejectBtn.className = "moe-btn";
        rejectBtn.textContent = "拒绝";
        rejectBtn.style.flex = "0 0 44px";
        rejectBtn.style.width = "44px";
        rejectBtn.style.minWidth = "44px";
        rejectBtn.style.maxWidth = "44px";
        rejectBtn.style.height = "28px";
        rejectBtn.style.padding = "0";
        rejectBtn.style.fontSize = "12px";
        rejectBtn.style.borderRadius = "6px";
        rejectBtn.style.background = "var(--card-bg)";
        rejectBtn.style.color = "var(--text-secondary)";
        rejectBtn.style.border = "1px solid var(--border-color)";
        rejectBtn.style.display = "inline-flex";
        rejectBtn.style.alignItems = "center";
        rejectBtn.style.justifyContent = "center";
        rejectBtn.style.cursor = "pointer";
        rejectBtn.onclick = () => {
          this.rejectFriendRequest(req.fromCode);
        };

        btnBox.appendChild(acceptBtn);
        btnBox.appendChild(rejectBtn);

        row.appendChild(img);
        row.appendChild(infoCol);
        row.appendChild(btnBox);
        listEl.appendChild(row);
      });
    },

    receivePeerMessage: async function (data) {
      const fromCode = data.fromCode;
      const content = data.content || (data.audioData ? "[语音消息]" : "");
      const myCode = this.getOrCreateMyPeerCode();
      if (!fromCode || (!content && !data.audioData) || fromCode === myCode) return;

      let peerChat = await this.findPeerChatByCodeAsync(fromCode);
      if (!peerChat) {
        peerChat = await this.createOrUpdatePeerChatSession(
          fromCode,
          data.senderName || "密友",
          data.senderAvatar,
          null,
          data.senderName || "密友",
          data.senderAvatarFrame || ""
        );
      }

      if (!peerChat) return;

      if (!peerChat.settings) peerChat.settings = {};
      if (data.senderName && data.senderName !== "我") {
        peerChat.name = data.senderName;
      }
      if (data.senderAvatar) {
        peerChat.settings.aiAvatar = data.senderAvatar;
      }
      if (data.senderAvatarFrame !== undefined && data.senderAvatarFrame !== "") {
        peerChat.settings.aiAvatarFrame = data.senderAvatarFrame;
      }
      if (data.peerAvatarFrame !== undefined && data.peerAvatarFrame !== "") {
        peerChat.settings.myAvatarFrame = data.peerAvatarFrame;
      }

      if (!Array.isArray(peerChat.history)) {
        peerChat.history = [];
      }

      const isDup = peerChat.history.some(
        (m) =>
          (data.eventId && m.eventId === data.eventId) ||
          (m.role === "assistant" && m.timestamp === data.timestamp && m.content === content)
      );
      if (isDup) return;

      const isVoice = data.msgType === "voice_message" || Boolean(data.audioData);
      const isSticker = data.msgType === "sticker" || Boolean(data.isPeerOnlySticker) || Boolean(data.meaning);
      const incomingMsg = {
        role: "assistant",
        type: isVoice ? "voice_message" : (isSticker ? "sticker" : undefined),
        eventId: data.eventId || "",
        sender: peerChat.name,
        senderName: peerChat.name,
        senderAvatar:
          peerChat.settings?.aiAvatar ||
          window.defaultAvatar ||
          "https://api.iconify.design/lucide:user.svg?color=%23888888",
        content: content,
        meaning: data.meaning || "",
        isPeerOnlySticker: isSticker,
        audioData: data.audioData || "",
        audioDuration: data.audioDuration || 0,
        timestamp: data.timestamp || Date.now()
      };

      peerChat.history.push(incomingMsg);

      const chatScreen = document.getElementById("chat-interface-screen");
      const isCurrentActive =
        window.state &&
        String(window.state.activeChatId) === String(peerChat.id) &&
        chatScreen &&
        chatScreen.classList.contains("active") &&
        !document.hidden;

      if (!isCurrentActive) {
        peerChat.unreadCount = (peerChat.unreadCount || 0) + 1;
      }

      if (window.state && window.state.chats) {
        window.state.chats[peerChat.id] = peerChat;
      }
      if (window.db && window.db.chats) {
        await window.db.chats.put(peerChat);
      }

      if (window.state && String(window.state.activeChatId) === String(peerChat.id)) {
        if (typeof window.appendMessage === "function") {
          window.appendMessage(incomingMsg, peerChat);
        } else if (typeof window.renderChatInterfaceProxy === "function") {
          window.renderChatInterfaceProxy(peerChat.id);
        }
      }

      const displayTitle = peerChat.settings?.remarkName || peerChat.name || "密友";
      const previewText = isVoice ? "[语音]" : (isSticker ? `[表情: ${data.meaning || "表情"}]` : content);

      this.showPeerNotice(
        previewText,
        () => {
          if (typeof window.openChat === "function") {
            window.openChat(peerChat.id);
          }
        },
        {
          title: displayTitle,
          message: previewText,
          avatar: peerChat.settings?.aiAvatar,
          chatId: peerChat.id,
          tag: "peer_msg_" + peerChat.id
        }
      );

      await this.refreshAppChatAndContactsUI();
    },

    receivePeerProfileUpdate: async function (data) {
      const peerCode = data.peerCode;
      const newName = data.name;
      const newAvatar = data.avatar;
      const newPeerOwnFrame = data.myAvatarFrame;
      const newFrameForMe = data.peerAvatarFrame;
      const myCode = this.getOrCreateMyPeerCode();
      if (!peerCode || peerCode === myCode) return;

      let chat = await this.findPeerChatByCodeAsync(peerCode);
      if (!chat) {
        if (this.isPeerDeletedByUser(peerCode)) return;
        const outMap = this.getOutgoingRequests();
        const backupMap = this.getSavedFriendsBackup();
        const savedInfo = backupMap[peerCode] || outMap[peerCode];
        if (!savedInfo) return;
        chat = await this.createOrUpdatePeerChatSession(
          peerCode,
          newName || savedInfo.name || savedInfo.remarkName || "密友",
          newAvatar || savedInfo.avatar || "",
          savedInfo.groupId || null,
          savedInfo.remarkName || newName || "密友",
          newPeerOwnFrame || savedInfo.avatarFrame || ""
        );
      }
      if (!chat) return;

      if (!chat.settings) chat.settings = {};
      const oldName = chat.name;
      if (newName) {
        chat.name = newName;
        if (!chat.settings.remarkName || chat.settings.remarkName === oldName) {
          chat.settings.remarkName = newName;
        }
      }
      if (newAvatar) {
        chat.settings.aiAvatar = newAvatar;
      }
      if (newPeerOwnFrame !== undefined) {
        chat.settings.aiAvatarFrame = newPeerOwnFrame || "";
      }
      if (newFrameForMe !== undefined) {
        chat.settings.myAvatarFrame = newFrameForMe || "";
      }

      if (window.db && window.db.chats) {
        await window.db.chats.put(chat);
      }
      this.saveFriendToBackup(chat);

      if (window.state && String(window.state.activeChatId) === String(chat.id)) {
        const titleEl = document.getElementById("chat-header-title");
        const showName = (chat.settings && chat.settings.remarkName) || chat.name;
        if (titleEl && showName) titleEl.textContent = showName;
        const chatAvatarEl = document.getElementById("chat-header-avatar");
        if (chatAvatarEl && newAvatar) chatAvatarEl.src = newAvatar;
        if (typeof window.renderChatInterfaceProxy === "function") {
          window.renderChatInterfaceProxy(chat.id);
        }
      }

      await this.refreshAppChatAndContactsUI();
    },

    sendDirectPeerMessage: async function (chat, msg) {
      if (!chat || chat.roleType !== "peer" || !chat.peerCode) return;
      this.ensureNotificationPermission();

      const myCode = this.getOrCreateMyPeerCode();
      const myProfile = this.getMyProfile();
      const rawAva = chat.settings?.myAvatar || myProfile.avatar;
      const smallAva = await this.compressAvatarForWire(rawAva);
      const eventId = msg.eventId || "evt_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9);
      msg.eventId = eventId;
      const isSticker = msg.type === "sticker" || Boolean(msg.isPeerOnlySticker) || Boolean(msg.meaning);

      const payload = {
        type: "message",
        eventId: eventId,
        fromCode: myCode,
        toCode: chat.peerCode,
        content: msg.content || "[语音消息]",
        msgType: msg.type === "voice_message" ? "voice_message" : (isSticker ? "sticker" : "text"),
        meaning: msg.meaning || "",
        isPeerOnlySticker: isSticker,
        audioData: msg.audioData || "",
        audioDuration: msg.audioDuration || 0,
        senderName: chat.settings?.myName || myProfile.name,
        senderAvatar: smallAva,
        senderAvatarFrame: chat.settings?.myAvatarFrame || "",
        peerAvatarFrame: chat.settings?.aiAvatarFrame || "",
        timestamp: msg.timestamp || Date.now()
      };

      this.dispatchPacketToNetwork(chat.peerCode, payload, "/api/peer/send", false);
    },

    syncSinglePeerChatProfile: async function (chat) {
      if (!chat || chat.roleType !== "peer" || !chat.peerCode) return;
      const myCode = this.getOrCreateMyPeerCode();
      const name = (chat.settings && chat.settings.myName) || "我";
      const avatar = (chat.settings && chat.settings.myAvatar) || "";
      const myFrame = (chat.settings && chat.settings.myAvatarFrame) || "";
      const peerFrame = (chat.settings && chat.settings.aiAvatarFrame) || "";
      const smallAva = await this.compressAvatarForWire(avatar);

      const payload = {
        type: "profile_update",
        eventId: "evt_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9) + "_" + chat.peerCode,
        peerCode: myCode,
        toCode: chat.peerCode,
        name: name,
        avatar: smallAva,
        myAvatarFrame: myFrame,
        peerAvatarFrame: peerFrame,
        targetCodes: [chat.peerCode],
        timestamp: Date.now()
      };
      this.dispatchPacketToNetwork(chat.peerCode, payload, "/api/peer/profile", false);
    },

    ensureVoiceRecordPanel: function () {
      const inputArea = document.getElementById("chat-input-area");
      if (!inputArea) return null;
      let panel = document.getElementById("peer-voice-record-panel");
      if (panel) return panel;

      panel = document.createElement("div");
      panel.id = "peer-voice-record-panel";
      panel.innerHTML = `
        <div class="peer-record-status-text" id="peer-record-status-text">点击下方麦克风开始录音</div>
        <div class="peer-record-mic-wrap">
          <div class="peer-record-mic-ring"></div>
          <button type="button" class="peer-record-mic-btn" id="peer-record-mic-btn" title="录音">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
              <line x1="12" y1="19" x2="12" y2="23"></line>
              <line x1="8" y1="23" x2="16" y2="23"></line>
            </svg>
          </button>
        </div>
        <div class="peer-record-actions-row">
          <button type="button" class="moe-btn" id="peer-record-cancel-btn" style="flex: 0 0 84px; width: 84px; height: 34px; padding: 0; font-size: 12.5px; border-radius: 8px; background: var(--secondary-bg); color: var(--text-primary); border: 1px solid var(--border-color); display: inline-flex; align-items: center; justify-content: center;">取消</button>
          <button type="button" class="moe-btn" id="peer-record-send-btn" style="flex: 0 0 84px; width: 84px; height: 34px; padding: 0; font-size: 12.5px; border-radius: 8px; background: var(--accent-color); color: var(--card-bg); border: none; display: inline-flex; align-items: center; justify-content: center;">发送</button>
        </div>
      `;
      inputArea.appendChild(panel);

      const micBtn = document.getElementById("peer-record-mic-btn");
      const cancelBtn = document.getElementById("peer-record-cancel-btn");
      const sendBtn = document.getElementById("peer-record-send-btn");

      if (micBtn) {
        micBtn.addEventListener("click", () => {
          if (this.isRecording) {
            this.stopVoiceRecordingOnly();
          } else {
            this.startVoiceRecording();
          }
        });
      }
      if (cancelBtn) {
        cancelBtn.addEventListener("click", () => {
          this.cancelVoiceRecording();
        });
      }
      if (sendBtn) {
        sendBtn.addEventListener("click", () => {
          this.stopAndSendVoiceRecording();
        });
      }

      return panel;
    },

    toggleVoiceRecordPanel: function () {
      const panel = this.ensureVoiceRecordPanel();
      if (!panel) return;
      if (panel.classList.contains("visible")) {
        this.cancelVoiceRecording();
        panel.classList.remove("visible");
      } else {
        this.recordedDataUrl = "";
        this.recordedDuration = 0;
        const statusEl = document.getElementById("peer-record-status-text");
        if (statusEl) statusEl.textContent = "点击下方麦克风开始录音";
        panel.classList.add("visible");
      }
    },

    formatSecToTimer: function (sec) {
      const s = Math.max(0, Math.floor(sec));
      const mm = String(Math.floor(s / 60)).padStart(2, "0");
      const ss = String(s % 60).padStart(2, "0");
      return mm + ":" + ss;
    },

    startVoiceRecording: async function () {
      if (this.isRecording) return;
      const statusEl = document.getElementById("peer-record-status-text");
      const panel = this.ensureVoiceRecordPanel();
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (statusEl) statusEl.textContent = "当前浏览器不支持麦克风录音";
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.recordedChunks = [];
        this.recordedDataUrl = "";
        this.recordedDuration = 0;

        let options = { audioBitsPerSecond: 16000 };
        if (typeof MediaRecorder !== "undefined" && typeof MediaRecorder.isTypeSupported === "function") {
          if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
            options.mimeType = "audio/webm;codecs=opus";
          } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
            options.mimeType = "audio/mp4";
          } else if (MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")) {
            options.mimeType = "audio/ogg;codecs=opus";
          }
        }

        let recorder;
        try {
          recorder = new MediaRecorder(stream, options);
        } catch (e) {
          recorder = new MediaRecorder(stream);
        }

        this.mediaRecorder = recorder;
        this.isRecording = true;
        this.recordStartTime = Date.now();
        if (panel) panel.classList.add("recording");
        if (statusEl) statusEl.textContent = "正在录音 00:00";

        if (this.recordTimerInterval) clearInterval(this.recordTimerInterval);
        this.recordTimerInterval = setInterval(() => {
          const elapsed = Math.floor((Date.now() - this.recordStartTime) / 1000);
          if (statusEl) statusEl.textContent = "正在录音 " + this.formatSecToTimer(elapsed);
          if (elapsed >= 58) {
            this.stopVoiceRecordingOnly();
          }
        }, 300);

        recorder.ondataavailable = (ev) => {
          if (ev.data && ev.data.size > 0) {
            this.recordedChunks.push(ev.data);
          }
        };

        recorder.onstop = () => {
          stream.getTracks().forEach((t) => t.stop());
        };

        recorder.start(200);
      } catch (err) {
        if (statusEl) statusEl.textContent = "无法访问麦克风，请允许麦克风权限";
      }
    },

    stopVoiceRecordingOnly: function () {
      return new Promise((resolve) => {
        const panel = document.getElementById("peer-voice-record-panel");
        const statusEl = document.getElementById("peer-record-status-text");
        if (this.recordTimerInterval) {
          clearInterval(this.recordTimerInterval);
          this.recordTimerInterval = null;
        }
        if (panel) panel.classList.remove("recording");

        if (!this.mediaRecorder || !this.isRecording) {
          resolve(this.recordedDataUrl || "");
          return;
        }

        this.isRecording = false;
        const durationSec = Math.max(1, Math.round((Date.now() - this.recordStartTime) / 1000));
        this.recordedDuration = durationSec;

        const recorder = this.mediaRecorder;
        const prevStop = recorder.onstop;
        recorder.onstop = (ev) => {
          if (typeof prevStop === "function") prevStop(ev);
          const mimeType = recorder.mimeType || "audio/webm";
          const blob = new Blob(this.recordedChunks, { type: mimeType });
          const reader = new FileReader();
          reader.onloadend = () => {
            this.recordedDataUrl = typeof reader.result === "string" ? reader.result : "";
            if (statusEl) {
              statusEl.textContent = "录音就绪 " + this.formatSecToTimer(durationSec) + "，点击发送";
            }
            resolve(this.recordedDataUrl);
          };
          reader.onerror = () => resolve("");
          reader.readAsDataURL(blob);
        };

        try {
          recorder.stop();
        } catch (e) {
          resolve("");
        }
      });
    },

    cancelVoiceRecording: function () {
      const panel = document.getElementById("peer-voice-record-panel");
      const statusEl = document.getElementById("peer-record-status-text");
      if (this.recordTimerInterval) {
        clearInterval(this.recordTimerInterval);
        this.recordTimerInterval = null;
      }
      if (panel) {
        panel.classList.remove("recording", "visible");
      }
      if (this.mediaRecorder && this.isRecording) {
        try {
          this.mediaRecorder.stop();
        } catch (e) {}
      }
      this.isRecording = false;
      this.recordedChunks = [];
      this.recordedDataUrl = "";
      this.recordedDuration = 0;
      if (statusEl) statusEl.textContent = "点击下方麦克风开始录音";
    },

    stopAndSendVoiceRecording: async function () {
      const statusEl = document.getElementById("peer-record-status-text");
      let audioDataUrl = this.recordedDataUrl;
      if (this.isRecording) {
        audioDataUrl = await this.stopVoiceRecordingOnly();
      }
      if (!audioDataUrl) {
        if (statusEl) statusEl.textContent = "请先点击麦克风录制声音";
        return;
      }

      const activeChatId = window.state && window.state.activeChatId;
      const chat = activeChatId && window.state.chats ? window.state.chats[activeChatId] : null;
      if (!chat || chat.roleType !== "peer") return;

      const durationSec = Math.max(1, this.recordedDuration || 1);
      const msg = {
        role: "user",
        type: "voice_message",
        eventId: "evt_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9),
        content: "[语音消息]",
        audioData: audioDataUrl,
        audioDuration: durationSec,
        timestamp: Date.now()
      };

      if (!Array.isArray(chat.history)) chat.history = [];
      chat.history.push(msg);
      if (window.db && window.db.chats) {
        await window.db.chats.put(chat);
      }
      if (typeof window.appendMessage === "function") {
        window.appendMessage(msg, chat);
      }
      await this.refreshAppChatAndContactsUI();
      await this.sendDirectPeerMessage(chat, msg);

      this.cancelVoiceRecording();
    },

    playRecordedVoiceBubble: function (bubble, chat) {
      if (!bubble || !chat) return;
      const ts = parseInt(bubble.dataset.timestamp, 10);
      const msg = (chat.history || []).find((m) => m.timestamp === ts && m.audioData);
      if (!msg || !msg.audioData) return;

      const waveform = bubble.querySelector(".voice-waveform");

      if (this.currentPlayingAudio && this.currentPlayingBubble === bubble) {
        this.currentPlayingAudio.pause();
        this.currentPlayingAudio = null;
        if (waveform) waveform.classList.remove("playing");
        bubble.classList.remove("playing");
        this.currentPlayingBubble = null;
        return;
      }

      if (this.currentPlayingAudio) {
        this.currentPlayingAudio.pause();
        if (this.currentPlayingBubble) {
          const prevWave = this.currentPlayingBubble.querySelector(".voice-waveform");
          if (prevWave) prevWave.classList.remove("playing");
          this.currentPlayingBubble.classList.remove("playing");
        }
      }

      const audio = new Audio(msg.audioData);
      this.currentPlayingAudio = audio;
      this.currentPlayingBubble = bubble;
      if (waveform) waveform.classList.add("playing");
      bubble.classList.add("playing");

      const cleanup = () => {
        if (waveform) waveform.classList.remove("playing");
        bubble.classList.remove("playing");
        if (this.currentPlayingBubble === bubble) {
          this.currentPlayingAudio = null;
          this.currentPlayingBubble = null;
        }
      };

      audio.onended = cleanup;
      audio.onerror = cleanup;
      audio.play().catch(cleanup);
    },

    applyPeerChatInputUI: function (chat) {
      const actionsTop = document.getElementById("chat-input-actions-top");
      const stickerBtn = document.getElementById("open-sticker-panel-btn");
      const rerollBtn = document.getElementById("reroll-btn");
      const timelineBtn = document.getElementById("timeline-branch-btn");
      const affectionBtn = document.getElementById("chat-affection-bottom-btn");
      const mapBtn = document.getElementById("chat-map-btn");
      const waitReplyBtn = document.getElementById("wait-reply-btn");
      const recordPanel = document.getElementById("peer-voice-record-panel");
      const stickerPanel = document.getElementById("sticker-panel");

      const isPeer = Boolean(chat && chat.roleType === "peer" && !chat.isGroup);
      const isPeerGroup = Boolean(
        chat &&
        chat.isGroup &&
        Array.isArray(chat.members) &&
        chat.members.some((m) => m && (m.isPeerMember || m.roleType === "peer" || Boolean(m.peerCode)))
      );

      if (chat && chat.isGroup && !isPeerGroup && chat.isPeerGroup) {
        chat.isPeerGroup = false;
      }

      if (stickerBtn) {
        stickerBtn.style.display = (isPeer || isPeerGroup) ? "inline-flex" : "none";
      }
      if (!isPeer && !isPeerGroup && stickerPanel) {
        stickerPanel.classList.remove("visible");
      }

      if (timelineBtn) {
        timelineBtn.style.display = isPeerGroup ? "none" : "";
      }

      if (isPeer) {
        if (rerollBtn) rerollBtn.style.display = "none";
        if (actionsTop) {
          actionsTop.style.justifyContent = "flex-start";
          actionsTop.style.gap = "8px";
        }
        if (affectionBtn) affectionBtn.style.display = "none";
        if (mapBtn) mapBtn.style.display = "none";
        if (waitReplyBtn) {
          if (!waitReplyBtn.dataset.origHtml) {
            waitReplyBtn.dataset.origHtml = waitReplyBtn.innerHTML;
          }
          waitReplyBtn.innerHTML = MIC_BTN_SVG;
          waitReplyBtn.title = "录音";
        }
        this.ensureVoiceRecordPanel();
        this.refreshActivePeerHeaderStatus();
        if (chat.peerCode) {
          this.sendOnlinePingToPeer(chat.peerCode);
        }
      } else {
        if (rerollBtn) rerollBtn.style.display = "";
        if (actionsTop) {
          actionsTop.style.justifyContent = "";
          actionsTop.style.gap = "";
        }
        if (mapBtn) mapBtn.style.display = "";
        if (affectionBtn) {
          affectionBtn.style.display = chat && chat.isGroup ? "none" : "inline-flex";
        }
        if (waitReplyBtn && waitReplyBtn.dataset.origHtml) {
          waitReplyBtn.innerHTML = waitReplyBtn.dataset.origHtml;
          waitReplyBtn.title = "等待回复";
        }
        if (recordPanel) {
          this.cancelVoiceRecording();
          recordPanel.classList.remove("visible");
        }
      }
    },

    openPeerModal: async function () {
      this.ensureNotificationPermission();
      const codeDisplay = document.getElementById("my-peer-code-display");
      const targetInput = document.getElementById("peer-target-code-input");
      const nameInput = document.getElementById("peer-friend-name-input");
      const groupSelect = document.getElementById("peer-friend-group-select");
      const copyBtn = document.getElementById("copy-my-peer-code-btn");
      const confirmBtn = document.getElementById("confirm-add-peer-btn");

      const myCode = this.getOrCreateMyPeerCode();
      if (codeDisplay) {
        codeDisplay.value = myCode;
      }
      if (targetInput) {
        targetInput.value = "";
      }
      if (nameInput) {
        nameInput.value = "";
      }
      if (copyBtn) {
        copyBtn.textContent = "复制";
      }
      if (confirmBtn) {
        confirmBtn.textContent = "连接";
      }

      this.renderFriendRequestsUI();

      if (groupSelect && window.db && window.db.qzoneGroups) {
        groupSelect.innerHTML = "";
        try {
          const groups = await window.db.qzoneGroups.toArray();
          groups.sort((a, b) => (a.order || 0) - (b.order || 0));
          if (groups.length === 0) {
            const opt = document.createElement("option");
            opt.value = "";
            opt.textContent = "我的好友";
            groupSelect.appendChild(opt);
          } else {
            groups.forEach((g) => {
              const opt = document.createElement("option");
              opt.value = g.id;
              opt.textContent = g.name;
              groupSelect.appendChild(opt);
            });
          }
        } catch (e) {
          const opt = document.createElement("option");
          opt.value = "";
          opt.textContent = "我的好友";
          groupSelect.appendChild(opt);
        }
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(myCode).catch(() => {});
      }

      const modal = document.getElementById("contact-peer-modal");
      if (modal) {
        modal.classList.add("visible");
        modal.style.display = "flex";
      }
    },

    closePeerModal: function () {
      const modal = document.getElementById("contact-peer-modal");
      if (modal) {
        modal.classList.remove("visible");
        modal.style.display = "none";
      }
    },

    copyMyPeerCode: function () {
      const myCode = this.getOrCreateMyPeerCode();
      const copyBtn = document.getElementById("copy-my-peer-code-btn");
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
          .writeText(myCode)
          .then(() => {
            if (copyBtn) {
              copyBtn.textContent = "已复制";
              setTimeout(() => {
                if (copyBtn) copyBtn.textContent = "复制";
              }, 1500);
            }
          })
          .catch(() => {
            this.fallbackCopy(myCode, copyBtn);
          });
      } else {
        this.fallbackCopy(myCode, copyBtn);
      }
    },

    fallbackCopy: function (text, copyBtn) {
      try {
        const input = document.createElement("input");
        input.value = text;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
        if (copyBtn) {
          copyBtn.textContent = "已复制";
          setTimeout(() => {
            if (copyBtn) copyBtn.textContent = "复制";
          }, 1500);
        }
      } catch (err) {}
    },

    confirmAddPeerFriend: async function () {
      this.ensureNotificationPermission();
      const targetInput = document.getElementById("peer-target-code-input");
      const nameInput = document.getElementById("peer-friend-name-input");
      const groupSelect = document.getElementById("peer-friend-group-select");
      const confirmBtn = document.getElementById("confirm-add-peer-btn");

      const targetCode = targetInput ? targetInput.value.trim() : "";
      const rawName = nameInput ? nameInput.value.trim() : "";
      const myCode = this.getOrCreateMyPeerCode();

      if (!targetCode) {
        if (confirmBtn) {
          confirmBtn.textContent = "请填密友码";
          setTimeout(() => {
            if (confirmBtn) confirmBtn.textContent = "连接";
          }, 1400);
        }
        return;
      }

      if (targetCode === myCode) {
        if (confirmBtn) {
          confirmBtn.textContent = "不能加自己";
          setTimeout(() => {
            if (confirmBtn) confirmBtn.textContent = "连接";
          }, 1400);
        }
        return;
      }

      let selectedGroupId = null;
      if (groupSelect && groupSelect.value) {
        selectedGroupId = parseInt(groupSelect.value, 10) || null;
      }
      if (!selectedGroupId) {
        selectedGroupId = await this.ensureDefaultGroupId();
      }

      this.saveOutgoingRequest(targetCode, {
        remarkName: rawName,
        groupId: selectedGroupId,
        timestamp: Date.now()
      });

      const myProfile = this.getMyProfile();
      const smallAva = await this.compressAvatarForWire(myProfile.avatar);

      const reqPayload = {
        type: "friend_request",
        eventId: "evt_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9),
        fromCode: myCode,
        toCode: targetCode,
        fromName: myProfile.name,
        fromAvatar: smallAva,
        fromAvatarFrame: myProfile.myAvatarFrame || "",
        timestamp: Date.now()
      };

      this.dispatchPacketToNetwork(targetCode, reqPayload, "/api/peer/request", true);

      this.closePeerModal();
      this.showPeerNotice("好友申请已发送，等待对方同意", null, {
        title: "密友申请",
        message: "好友申请已发送，等待对方同意",
        avatar: myProfile.avatar
      });
    },

    applyPeerChatSettingsUI: function (chat) {
      if (!chat || chat.roleType !== "peer" || chat.isGroup) return;

      const aiPersonaCard = document.getElementById("ai-persona-card");
      if (aiPersonaCard) aiPersonaCard.style.display = "none";

      const myPersonaCard = document.getElementById("my-persona-card");
      if (myPersonaCard) myPersonaCard.style.display = "none";

      const groupMembersCard = document.getElementById("group-members-card");
      if (groupMembersCard) groupMembersCard.style.display = "none";

      const systemStatusCard = document.getElementById("system-status-settings-card");
      if (systemStatusCard) systemStatusCard.style.display = "none";

      const modBtn = document.getElementById("open-chat-module-btn");
      if (modBtn) modBtn.style.display = "none";

      const singleThoughtBtn = document.getElementById("open-thought-chain-bind-btn-single");
      if (singleThoughtBtn) singleThoughtBtn.style.display = "none";

      const groupThoughtBtn = document.getElementById("open-thought-chain-bind-btn-group");
      if (groupThoughtBtn) groupThoughtBtn.style.display = "none";

      const singleKeeperBtn = document.getElementById("open-keeper-panel-btn-single");
      if (singleKeeperBtn) singleKeeperBtn.style.display = "none";

      const groupKeeperBtn = document.getElementById("open-keeper-panel-btn-group");
      if (groupKeeperBtn) groupKeeperBtn.style.display = "none";

      const otherCard = document.getElementById("other-settings-card");
      if (otherCard) otherCard.style.display = "none";

      const offlineSection = document.getElementById("offline-mode-section");
      if (offlineSection) {
        const gameplayCard = offlineSection.closest(".settings-group-card");
        if (gameplayCard) gameplayCard.style.display = "none";
      }

      const voiceIdGroup = document.getElementById("minimax-voice-id-group");
      if (voiceIdGroup) {
        const voiceCard = voiceIdGroup.closest(".settings-group-card");
        if (voiceCard) voiceCard.style.display = "none";
      }

      const invBtn = document.getElementById("manage-ai-inventory-btn");
      if (invBtn) invBtn.style.display = "none";

      const naiCharGroup = document.getElementById("nai-character-settings-group");
      if (naiCharGroup) naiCharGroup.style.display = "none";

      const naiGrpGroup = document.getElementById("group-nai-settings-group");
      if (naiGrpGroup) naiGrpGroup.style.display = "none";

      const coupleGroup = document.getElementById("couple-avatar-group");
      if (coupleGroup) coupleGroup.style.display = "none";

      const groupAvatarGroup = document.getElementById("group-avatar-group");
      if (groupAvatarGroup) groupAvatarGroup.style.display = "none";

      const chatNameGroup = document.getElementById("chat-name-group");
      if (chatNameGroup) {
        chatNameGroup.style.display = "block";
        const lbl = chatNameGroup.querySelector("label");
        if (lbl) lbl.textContent = "对方昵称";
        const inp = document.getElementById("chat-name-input");
        if (inp) inp.readOnly = true;
      }

      const chatRemarkGroup = document.getElementById("chat-remark-group");
      if (chatRemarkGroup) {
        chatRemarkGroup.style.display = "block";
        const lbl = chatRemarkGroup.querySelector("label");
        if (lbl) lbl.textContent = "备注名";
      }

      const myGroupNick = document.getElementById("my-group-nickname-group");
      if (myGroupNick) {
        myGroupNick.style.display = "block";
        const lbl = myGroupNick.querySelector("label");
        if (lbl) lbl.textContent = "我的昵称";
        const myNickInput = document.getElementById("my-group-nickname-input");
        const myProfile = this.getMyProfile();
        if (myNickInput) {
          myNickInput.value = (chat.settings && chat.settings.myName) || myProfile.name || "我";
        }
      }

      const assignGroupSection = document.getElementById("assign-group-section");
      if (assignGroupSection) assignGroupSection.style.display = "block";

      const aiAvatarGroup = document.getElementById("ai-avatar-group");
      if (aiAvatarGroup) {
        aiAvatarGroup.style.display = "block";
        const btnStack = aiAvatarGroup.querySelector(".btn-stack");
        if (btnStack) {
          btnStack.style.display = "";
          Array.from(btnStack.children).forEach((btn) => {
            if (btn.classList && btn.classList.contains("change-frame-btn")) {
              btn.style.display = "";
            } else {
              btn.style.display = "none";
            }
          });
        }
      }

      const myAvatarGroup = document.getElementById("my-avatar-group");
      if (myAvatarGroup) myAvatarGroup.style.display = "block";

      const visualBeautifyCard = document.getElementById("visual-beautify-card");
      if (visualBeautifyCard) visualBeautifyCard.style.display = "block";

      const visualBeautifyDetails = document.getElementById("visual-beautify-details-group");
      if (visualBeautifyDetails) visualBeautifyDetails.style.display = "block";

      const visualBeautifySwitch = document.getElementById("visual-beautify-switch");
      if (visualBeautifySwitch) visualBeautifySwitch.checked = true;
    },

    resetPeerChatSettingsUI: function (currentChat) {
      const myPersonaCard = document.getElementById("my-persona-card");
      if (myPersonaCard) myPersonaCard.style.display = "block";

      const chatNameGroup = document.getElementById("chat-name-group");
      if (chatNameGroup) {
        const lbl = chatNameGroup.querySelector("label");
        if (lbl) lbl.textContent = "角色真名 /群聊名称(AI只认这个，修改会影响记忆)";
        const inp = document.getElementById("chat-name-input");
        if (inp) inp.readOnly = false;
      }

      const myGroupNick = document.getElementById("my-group-nickname-group");
      if (myGroupNick) {
        const lbl = myGroupNick.querySelector("label");
        if (lbl) lbl.textContent = "我的群昵称";
      }

      const aiAvatarGroup = document.getElementById("ai-avatar-group");
      if (aiAvatarGroup) {
        const btnStack = aiAvatarGroup.querySelector(".btn-stack");
        if (btnStack) {
          btnStack.style.display = "";
          Array.from(btnStack.children).forEach((btn) => {
            btn.style.display = "";
          });
        }
      }

      const modBtn = document.getElementById("open-chat-module-btn");
      if (modBtn) modBtn.style.display = "";

      const singleThoughtBtn = document.getElementById("open-thought-chain-bind-btn-single");
      if (singleThoughtBtn) singleThoughtBtn.style.display = "";

      const groupThoughtBtn = document.getElementById("open-thought-chain-bind-btn-group");
      if (groupThoughtBtn) groupThoughtBtn.style.display = "";

      const singleKeeperBtn = document.getElementById("open-keeper-panel-btn-single");
      if (singleKeeperBtn) singleKeeperBtn.style.display = "";

      const groupKeeperBtn = document.getElementById("open-keeper-panel-btn-group");
      if (groupKeeperBtn) groupKeeperBtn.style.display = "";

      const isDiceOrStatus = Boolean(
        currentChat &&
        (currentChat.isDiceBot ||
          currentChat.roleType === "system_status" ||
          currentChat.roleType === "dice" ||
          currentChat.isDice)
      );
      const invBtn = document.getElementById("manage-ai-inventory-btn");
      if (invBtn) {
        invBtn.style.display = currentChat && (currentChat.isGroup || isDiceOrStatus) ? "none" : "";
      }

      const offlineSection = document.getElementById("offline-mode-section");
      if (offlineSection) {
        const gameplayCard = offlineSection.closest(".settings-group-card");
        if (gameplayCard) gameplayCard.style.display = "";
      }

      const voiceIdGroup = document.getElementById("minimax-voice-id-group");
      if (voiceIdGroup) {
        const voiceCard = voiceIdGroup.closest(".settings-group-card");
        if (voiceCard) voiceCard.style.display = "";
      }

      const otherCard = document.getElementById("other-settings-card");
      if (otherCard) otherCard.style.display = "";
    },

    init: function () {
      this.getOrCreateMyPeerCode();
      this.loadSeenEventIds();
      this.connectNetwork();

      if (this.isAppDbReady()) {
        this.onAppDbLoaded();
      }

      document.addEventListener("visibilitychange", () => {
        if (!document.hidden) {
          this.wakeUpAndSyncNow();
        }
      });
      window.addEventListener("focus", () => {
        this.wakeUpAndSyncNow();
      });
      window.addEventListener("pageshow", () => {
        this.wakeUpAndSyncNow();
      });
      window.addEventListener("online", () => {
        this.wakeUpAndSyncNow();
      });
      window.addEventListener("pagehide", () => {
        this.sendOfflinePingToFriends();
      });
      window.addEventListener("beforeunload", () => {
        this.sendOfflinePingToFriends();
      });

      window.addEventListener("storage", (ev) => {
        if (ev.key === "tukey_peer_local_bus_pkt" && ev.newValue) {
          try {
            const data = JSON.parse(ev.newValue);
            this.enqueueIncomingEvent(data);
          } catch (e) {}
        }
      });

      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.addEventListener("message", (ev) => {
          const msg = ev.data;
          if (!msg || msg.type !== "PEER_NOTIFICATION_CLICK") return;
          if (msg.openRequests) {
            this.openPeerModal();
          } else if (msg.chatId && typeof window.openChat === "function") {
            window.openChat(msg.chatId);
          }
        });
      }

      const choicePeerBtn = document.getElementById("add-choice-peer-btn");
      if (choicePeerBtn) {
        choicePeerBtn.addEventListener("click", () => {
          const choiceModal = document.getElementById("add-contact-choice-modal");
          if (choiceModal) choiceModal.classList.remove("visible");
          this.openPeerModal();
        });
      }

      const dropdownPeerBtn = document.getElementById("dropdown-choice-peer-btn");
      if (dropdownPeerBtn) {
        dropdownPeerBtn.addEventListener("click", () => {
          const dropdown = document.getElementById("add-contact-dropdown");
          if (dropdown) dropdown.style.display = "none";
          this.openPeerModal();
        });
      }

      const peerModalEl = document.getElementById("contact-peer-modal");
      if (peerModalEl) {
        peerModalEl.addEventListener("click", (e) => {
          if (e.target === peerModalEl) {
            this.closePeerModal();
          }
        });
      }

      const chatSettingsBtn = document.getElementById("chat-settings-btn");
      if (chatSettingsBtn) {
        chatSettingsBtn.addEventListener("click", () => {
          setTimeout(() => {
            if (!window.state || !window.state.activeChatId) return;
            const currentChat = window.state.chats[window.state.activeChatId];
            if (currentChat && currentChat.roleType === "peer" && !currentChat.isGroup) {
              PeerManager.applyPeerChatSettingsUI(currentChat);
            } else {
              PeerManager.resetPeerChatSettingsUI(currentChat);
            }
          }, 50);
        });
      }

      const saveSettingsBtn = document.getElementById("save-chat-settings-btn");
      if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener("click", async () => {
          if (!window.state || !window.state.activeChatId) return;
          const currentChat = window.state.chats[window.state.activeChatId];
          if (!currentChat) return;

          if (currentChat.roleType === "peer" && !currentChat.isGroup) {
            const assignSelect = document.getElementById("assign-group-select");
            if (assignSelect) {
              currentChat.groupId = parseInt(assignSelect.value, 10) || null;
            }
            const myAvatarEl = document.getElementById("my-avatar-preview");
            const myNickEl = document.getElementById("my-group-nickname-input");
            const myNameEl = document.getElementById("my-name-input");
            const newAva = myAvatarEl ? myAvatarEl.src : currentChat.settings?.myAvatar;
            const newName =
              (myNickEl && myNickEl.value.trim()) ||
              (myNameEl && myNameEl.value.trim()) ||
              currentChat.settings?.myName ||
              "我";

            if (!currentChat.settings) currentChat.settings = {};
            currentChat.settings.myName = newName;
            currentChat.settings.myAvatar = newAva;
            if (myNameEl) myNameEl.value = newName;

            if (window.db && window.db.chats) {
              await window.db.chats.put(currentChat);
            }
            await PeerManager.refreshAppChatAndContactsUI();
            await PeerManager.syncSinglePeerChatProfile(currentChat);
          } else if (currentChat.isGroup && currentChat.isPeerGroup) {
            setTimeout(async () => {
              await PeerManager.syncGroupSettingsToPeers(currentChat);
            }, 80);
          }
        });
      }

      const originalOpenContactCard = window.openContactCardModal;
      if (typeof originalOpenContactCard === "function") {
        window.openContactCardModal = async function (chatId) {
          await originalOpenContactCard(chatId);
          const currentChat =
            window.state &&
            window.state.chats &&
            (window.state.chats[chatId] ||
              Object.values(window.state.chats).find((c) => String(c.id) === String(chatId)));
          const statsGrid = document.getElementById("contact-card-stats-grid");
          const valuesGrid = document.getElementById("contact-card-values-grid");
          const skillsBtn = document.getElementById("contact-card-skills-toggle-btn");
          const skillsContainer = document.getElementById("contact-card-skills-container");
          const attrTitle = statsGrid ? statsGrid.previousElementSibling : null;

          if (currentChat && currentChat.roleType === "peer") {
            if (statsGrid) statsGrid.style.display = "grid";
            if (valuesGrid) valuesGrid.style.display = "grid";
            if (attrTitle) attrTitle.style.display = "flex";
            if (skillsBtn) skillsBtn.style.display = "none";
            if (skillsContainer) skillsContainer.style.display = "none";
          } else {
            if (statsGrid) statsGrid.style.display = "grid";
            if (valuesGrid) valuesGrid.style.display = "grid";
            if (skillsBtn) skillsBtn.style.display = "inline-flex";
            if (attrTitle) attrTitle.style.display = "flex";
          }
        };
      }
    }
  };

  window.PeerManager = PeerManager;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      PeerManager.init();
    });
  } else {
    PeerManager.init();
  }
})();
