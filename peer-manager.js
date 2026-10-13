/* 密友专属独立模块 - 仅针对密友生效，不影响普通好友、群聊、骰子或系统状态栏 */

(function () {
  const CLOUD_MQTT_BROKERS = [
    "wss://broker.emqx.io:8084/mqtt",
    "wss://broker.hivemq.com:8884/mqtt"
  ];

  function encodeMqttVarInt(len) {
    const bytes = [];
    do {
      let encodedByte = len % 128;
      len = Math.floor(len / 128);
      if (len > 0) encodedByte = encodedByte | 128;
      bytes.push(encodedByte);
    } while (len > 0);
    return bytes;
  }

  function encodeMqttUtf8(str) {
    const utf8 = new TextEncoder().encode(str);
    const out = new Uint8Array(2 + utf8.length);
    out[0] = (utf8.length >> 8) & 0xff;
    out[1] = utf8.length & 0xff;
    out.set(utf8, 2);
    return out;
  }

  function buildMqttConnectPacket(clientId) {
    const varHeader = new Uint8Array([0x00, 0x04, 0x4d, 0x51, 0x54, 0x54, 0x04, 0x02, 0x00, 0x3c]);
    const payload = encodeMqttUtf8(clientId);
    const remLen = encodeMqttVarInt(varHeader.length + payload.length);
    const pkt = new Uint8Array(1 + remLen.length + varHeader.length + payload.length);
    pkt[0] = 0x10;
    pkt.set(remLen, 1);
    pkt.set(varHeader, 1 + remLen.length);
    pkt.set(payload, 1 + remLen.length + varHeader.length);
    return pkt;
  }

  function buildMqttSubscribePacket(topic, packetId) {
    const topicBytes = encodeMqttUtf8(topic);
    const remLen = encodeMqttVarInt(2 + topicBytes.length + 1);
    const pkt = new Uint8Array(1 + remLen.length + 2 + topicBytes.length + 1);
    pkt[0] = 0x82;
    pkt.set(remLen, 1);
    const vhStart = 1 + remLen.length;
    pkt[vhStart] = (packetId >> 8) & 0xff;
    pkt[vhStart + 1] = packetId & 0xff;
    pkt.set(topicBytes, vhStart + 2);
    pkt[pkt.length - 1] = 0x00;
    return pkt;
  }

  function buildMqttPublishPacket(topic, jsonStr, retain) {
    const topicBytes = encodeMqttUtf8(topic);
    const payloadBytes = new TextEncoder().encode(jsonStr);
    const remLen = encodeMqttVarInt(topicBytes.length + payloadBytes.length);
    const pkt = new Uint8Array(1 + remLen.length + topicBytes.length + payloadBytes.length);
    pkt[0] = retain ? 0x31 : 0x30;
    pkt.set(remLen, 1);
    pkt.set(topicBytes, 1 + remLen.length);
    pkt.set(payloadBytes, 1 + remLen.length + topicBytes.length);
    return pkt;
  }

  function parseMqttPublishPacket(buf) {
    if (!buf || buf.length < 4) return null;
    if ((buf[0] & 0xf0) !== 0x30) return null;
    let multiplier = 1;
    let remLen = 0;
    let idx = 1;
    let encodedByte = 0;
    do {
      if (idx >= buf.length) return null;
      encodedByte = buf[idx++];
      remLen += (encodedByte & 127) * multiplier;
      multiplier *= 128;
    } while ((encodedByte & 128) !== 0);

    if (idx + 2 > buf.length) return null;
    const topicLen = (buf[idx] << 8) | buf[idx + 1];
    idx += 2 + topicLen;
    const qos = (buf[0] >> 1) & 0x03;
    if (qos > 0) idx += 2;
    if (idx > buf.length) return null;
    try {
      return new TextDecoder().decode(buf.subarray(idx));
    } catch (e) {
      return null;
    }
  }

  const MIC_BTN_SVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="display:block;color:var(--text-primary);"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>`;

  const PeerManager = {
    myPeerCodeKey: "tukey_my_peer_code",
    activeTabsKey: "tukey_peer_active_tabs_v2",
    tabId: null,
    currentPeerCode: null,
    ws: null,
    mqttSockets: [],
    mqttPingTimer: null,
    ntfySocket: null,
    bc: null,
    pollTimer: null,
    outboxTimer: null,
    heartbeatTimer: null,
    seenEventIds: new Set(),
    pendingRawEvents: [],
    isProcessingQueue: false,
    noticeTimer: null,
    mediaRecorder: null,
    recordedChunks: [],
    recordStartTime: 0,
    recordTimerInterval: null,
    recordedDataUrl: "",
    recordedDuration: 0,
    isRecording: false,
    currentPlayingAudio: null,
    currentPlayingBubble: null,
    isSyncingHomeProfile: false,

    isAppDbReady: function () {
      return Boolean(
        window.__tukeyDbLoaded &&
        window.db &&
        window.db.chats &&
        window.state &&
        window.state.chats &&
        typeof window.state.chats === "object"
      );
    },

    onAppDbLoaded: async function () {
      this.loadSeenEventIds();
      this.filterOtherTabPeerChats();
      this.observeHomeProfileChanges();
      await this.flushPendingEvents();
      await this.pollOfflineMailbox();
      await this.retryOutboxPackets();
      if (window.state && window.state.activeChatId && window.state.chats) {
        const activeChat = window.state.chats[window.state.activeChatId];
        if (activeChat) {
          this.applyPeerChatInputUI(activeChat);
        }
      }
    },

    generateRandomCode: function () {
      const arr = new Uint32Array(2);
      if (window.crypto && window.crypto.getRandomValues) {
        window.crypto.getRandomValues(arr);
      } else {
        arr[0] = Math.floor(Math.random() * 1000000);
        arr[1] = Math.floor(Math.random() * 1000000) ^ Date.now();
      }
      const randA = 1000 + (arr[0] % 9000);
      const randB = 1000 + (arr[1] % 9000);
      return "PEER-" + randA + "-" + randB;
    },

    ensureTabId: function () {
      if (this.tabId) return this.tabId;
      let winTabId = "";
      try {
        if (window.name && window.name.startsWith("tukey_tab_")) {
          winTabId = window.name;
        }
      } catch (e) {}
      if (!winTabId) {
        const rnd = Math.random().toString(36).slice(2, 10);
        winTabId = "tukey_tab_" + Date.now() + "_" + rnd;
        try {
          window.name = winTabId;
        } catch (e) {}
      }
      this.tabId = winTabId;
      return this.tabId;
    },

    getActiveTabsMap: function () {
      try {
        const raw = localStorage.getItem(this.activeTabsKey);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === "object" ? parsed : {};
      } catch (e) {
        return {};
      }
    },

    updateTabHeartbeat: function () {
      const tabId = this.ensureTabId();
      const myCode = this.currentPeerCode;
      if (!myCode) return;
      try {
        const now = Date.now();
        const map = this.getActiveTabsMap();
        for (const k of Object.keys(map)) {
          if (!map[k] || now - (map[k].ts || 0) > 7000) {
            delete map[k];
          }
        }
        map[tabId] = { code: myCode, ts: now };
        localStorage.setItem(this.activeTabsKey, JSON.stringify(map));
      } catch (e) {}
    },

    isCodeUsedByAnotherTab: function (code) {
      if (!code) return false;
      const tabId = this.ensureTabId();
      const now = Date.now();
      const map = this.getActiveTabsMap();
      for (const [k, info] of Object.entries(map)) {
        if (k !== tabId && info && info.code === code && now - (info.ts || 0) <= 6000) {
          return true;
        }
      }
      return false;
    },

    getOrCreateMyPeerCode: function () {
      this.ensureTabId();
      if (this.currentPeerCode) {
        return this.currentPeerCode;
      }

      let sessionCode = "";
      try {
        sessionCode = sessionStorage.getItem("tukey_tab_peer_code_" + this.tabId) || "";
      } catch (e) {}

      if (sessionCode && !this.isCodeUsedByAnotherTab(sessionCode)) {
        this.currentPeerCode = sessionCode;
        this.updateTabHeartbeat();
        return this.currentPeerCode;
      }

      let savedPrimary = "";
      try {
        savedPrimary = localStorage.getItem(this.myPeerCodeKey) || "";
      } catch (e) {}

      if (savedPrimary && !this.isCodeUsedByAnotherTab(savedPrimary)) {
        this.currentPeerCode = savedPrimary;
      } else {
        const newCode = this.generateRandomCode();
        this.currentPeerCode = newCode;
        if (!savedPrimary) {
          try {
            localStorage.setItem(this.myPeerCodeKey, newCode);
          } catch (e) {}
        }
      }

      try {
        sessionStorage.setItem("tukey_tab_peer_code_" + this.tabId, this.currentPeerCode);
      } catch (e) {}
      this.updateTabHeartbeat();
      return this.currentPeerCode;
    },

    loadSeenEventIds: function () {
      const myCode = this.getOrCreateMyPeerCode();
      try {
        const raw = localStorage.getItem("tukey_peer_seen_ids_" + myCode);
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
      if (this.seenEventIds.size > 500) {
        const first = this.seenEventIds.values().next().value;
        this.seenEventIds.delete(first);
      }
      const myCode = this.getOrCreateMyPeerCode();
      try {
        localStorage.setItem(
          "tukey_peer_seen_ids_" + myCode,
          JSON.stringify(Array.from(this.seenEventIds).slice(-400))
        );
      } catch (e) {}
    },

    getOutboxList: function () {
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

    saveOutboxList: function (list) {
      const myCode = this.getOrCreateMyPeerCode();
      try {
        const trimmed = (list || []).slice(-80);
        localStorage.setItem("tukey_peer_outbox_" + myCode, JSON.stringify(trimmed));
      } catch (e) {}
    },

    enqueueOutboxPacket: function (targetCode, payload, httpPath, retainOnMqtt) {
      if (!targetCode || !payload || !payload.eventId) return;
      const list = this.getOutboxList().filter((item) => item && item.eventId !== payload.eventId);
      list.push({
        eventId: payload.eventId,
        targetCode: targetCode,
        payload: payload,
        httpPath: httpPath,
        retainOnMqtt: !!retainOnMqtt,
        createdAt: Date.now(),
        lastSentAt: Date.now()
      });
      this.saveOutboxList(list);
    },

    removeOutboxPacket: function (ackEventId) {
      if (!ackEventId) return;
      const list = this.getOutboxList();
      const next = list.filter((item) => item && item.eventId !== ackEventId);
      if (next.length !== list.length) {
        this.saveOutboxList(next);
      }
    },

    retryOutboxPackets: async function (specificPeerCode) {
      const now = Date.now();
      const list = this.getOutboxList();
      if (list.length === 0) return;
      let changed = false;
      const kept = [];

      for (const item of list) {
        if (!item || !item.payload || !item.targetCode) continue;
        if (now - (item.createdAt || 0) > 24 * 3600 * 1000) {
          changed = true;
          continue;
        }
        const shouldSend = specificPeerCode
          ? item.targetCode === specificPeerCode
          : now - (item.lastSentAt || 0) >= 8000;
        if (shouldSend) {
          item.lastSentAt = now;
          changed = true;
          this.dispatchPacketToNetwork(item.targetCode, item.payload, item.httpPath, item.retainOnMqtt, true);
        }
        kept.push(item);
      }

      if (changed) {
        this.saveOutboxList(kept);
      }
    },

    ackEventsToServer: function (eventIds) {
      if (!Array.isArray(eventIds) || eventIds.length === 0) return;
      const myCode = this.getOrCreateMyPeerCode();
      const ackPayload = {
        type: "ack",
        peerCode: myCode,
        eventIds: eventIds
      };
      if (this.ws && this.ws.readyState === 1) {
        try {
          this.ws.send(JSON.stringify(ackPayload));
        } catch (e) {}
      }
      const baseUrl = this.getRelayBaseUrl();
      if (baseUrl) {
        fetch(baseUrl + "/api/peer/ack", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(ackPayload)
        }).catch(() => {});
      }
    },

    sendPeerAck: function (toCode, ackEventId) {
      if (!toCode || !ackEventId) return;
      const myCode = this.getOrCreateMyPeerCode();
      if (toCode === myCode) return;
      const ackPacket = {
        type: "peer_ack",
        eventId: "ack_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8),
        ackEventId: ackEventId,
        fromCode: myCode,
        toCode: toCode,
        timestamp: Date.now()
      };
      this.dispatchPacketToNetwork(toCode, ackPacket, "/api/peer/send", false, true);
    },

    regenerateMyPeerCode: async function () {
      const oldCode = this.getOrCreateMyPeerCode();
      let newCode = this.generateRandomCode();
      while (newCode === oldCode) {
        newCode = this.generateRandomCode();
      }
      this.currentPeerCode = newCode;
      try {
        localStorage.setItem(this.myPeerCodeKey, newCode);
        sessionStorage.setItem("tukey_tab_peer_code_" + this.ensureTabId(), newCode);
      } catch (e) {}
      this.updateTabHeartbeat();
      this.loadSeenEventIds();

      if (window.state && window.state.chats) {
        for (const chat of Object.values(window.state.chats)) {
          if (chat.roleType === "peer" && (!chat.myPeerCode || chat.myPeerCode === oldCode)) {
            chat.myPeerCode = newCode;
            if (window.db && window.db.chats) {
              try {
                await window.db.chats.put(chat);
              } catch (e) {}
            }
          }
        }
      }

      const codeDisplay = document.getElementById("my-peer-code-display");
      if (codeDisplay) {
        codeDisplay.value = newCode;
      }
      const regenBtn = document.getElementById("regen-my-peer-code-btn");
      if (regenBtn) {
        regenBtn.textContent = "已换";
        setTimeout(() => {
          if (regenBtn) regenBtn.textContent = "换码";
        }, 1200);
      }

      this.copyMyPeerCode();
      this.reconnectAllChannels();
    },

    getRelayBaseUrl: function () {
      const custom = localStorage.getItem("tukey_peer_relay_url");
      if (custom && custom.trim()) {
        return custom.trim().replace(/\/+$/, "");
      }
      if (window.location.protocol === "http:" || window.location.protocol === "https:") {
        return window.location.origin;
      }
      return "";
    },

    getWsUrl: function () {
      const base = this.getRelayBaseUrl();
      if (!base) return "";
      if (base.startsWith("https://")) {
        return base.replace(/^https:\/\//, "wss://");
      }
      if (base.startsWith("http://")) {
        return base.replace(/^http:\/\//, "ws://");
      }
      return "";
    },

    getMyProfile: function () {
      const defaultAva = window.defaultAvatar || "https://api.iconify.design/lucide:user.svg?color=%23888888";
      let name = "我";
      let avatar = defaultAva;
      let myAvatarFrame = "";

      const profileNameEl = document.getElementById("profile-username");
      if (profileNameEl && profileNameEl.textContent) {
        const txt = profileNameEl.textContent.trim();
        if (txt && txt !== "你的昵称") {
          name = txt;
        }
      }
      const profileAvatarEl = document.getElementById("profile-avatar-img");
      if (profileAvatarEl && profileAvatarEl.src) {
        avatar = profileAvatarEl.src;
      }
      const profileFrameEl = document.getElementById("profile-avatar-frame");
      if (profileFrameEl && profileFrameEl.style.display !== "none" && profileFrameEl.getAttribute("src")) {
        myAvatarFrame = profileFrameEl.getAttribute("src") || "";
      }

      if (window.state && window.state.globalSettings) {
        if (window.state.globalSettings.homeAvatarFrame) {
          myAvatarFrame = window.state.globalSettings.homeAvatarFrame;
        }
        if (window.state.globalSettings.widgetData) {
          const wd = window.state.globalSettings.widgetData;
          if (wd["profile-username"] && wd["profile-username"] !== "你的昵称") {
            name = wd["profile-username"];
          }
          if (wd["profile-avatar-img"]) {
            avatar = wd["profile-avatar-img"];
          }
        }
      }

      if (window.state && window.state.activeChatId && window.state.chats) {
        const activeChat = window.state.chats[window.state.activeChatId];
        if (activeChat && activeChat.roleType === "peer" && activeChat.settings) {
          if (activeChat.settings.myName && activeChat.settings.myName !== "我") {
            name = activeChat.settings.myName;
          }
          if (activeChat.settings.myAvatar) {
            avatar = activeChat.settings.myAvatar;
          }
          if (activeChat.settings.myAvatarFrame !== undefined) {
            myAvatarFrame = activeChat.settings.myAvatarFrame || "";
          }
        }
      }
      return { name, avatar, myAvatarFrame };
    },

    compressAvatarForWire: function (avatarUrl) {
      return new Promise((resolve) => {
        if (!avatarUrl || typeof avatarUrl !== "string") {
          resolve("");
          return;
        }
        if (!avatarUrl.startsWith("data:image/") || avatarUrl.length < 12000) {
          resolve(avatarUrl);
          return;
        }
        try {
          const img = new Image();
          img.onload = function () {
            try {
              const canvas = document.createElement("canvas");
              const size = 96;
              canvas.width = size;
              canvas.height = size;
              const ctx = canvas.getContext("2d");
              ctx.drawImage(img, 0, 0, size, size);
              const compressed = canvas.toDataURL("image/jpeg", 0.72);
              resolve(compressed);
            } catch (err) {
              resolve("");
            }
          };
          img.onerror = function () {
            resolve("");
          };
          img.src = avatarUrl;
        } catch (e) {
          resolve("");
        }
      });
    },

    ensureNotificationPermission: function () {
      try {
        if ("Notification" in window && Notification.permission === "default") {
          Notification.requestPermission().catch(() => {});
        }
      } catch (e) {}
    },

    reconnectAllChannels: function () {
      if (this.ws) {
        try {
          this.ws.onclose = null;
          this.ws.close();
        } catch (e) {}
        this.ws = null;
      }
      if (this.mqttSockets && this.mqttSockets.length > 0) {
        this.mqttSockets.forEach((s) => {
          try {
            s.onclose = null;
            s.close();
          } catch (e) {}
        });
        this.mqttSockets = [];
      }
      if (this.ntfySocket) {
        try {
          this.ntfySocket.onclose = null;
          this.ntfySocket.close();
        } catch (e) {}
        this.ntfySocket = null;
      }
      this.connectNetwork();
    },

    connectNetwork: function () {
      const myCode = this.getOrCreateMyPeerCode();
      const profile = this.getMyProfile();

      if (!this.bc && typeof BroadcastChannel !== "undefined") {
        try {
          this.bc = new BroadcastChannel("tukey_peer_bus_v2");
          this.bc.onmessage = (ev) => {
            if (ev && ev.data) {
              this.enqueueIncomingEvent(ev.data);
            }
          };
        } catch (e) {}
      }

      const wsUrl = this.getWsUrl();
      if (wsUrl && !this.ws) {
        try {
          const sock = new WebSocket(wsUrl);
          this.ws = sock;

          sock.onopen = async () => {
            const smallAva = await this.compressAvatarForWire(profile.avatar);
            if (sock.readyState === 1) {
              sock.send(
                JSON.stringify({
                  type: "register",
                  peerCode: this.getOrCreateMyPeerCode(),
                  name: profile.name,
                  avatar: smallAva,
                  myAvatarFrame: profile.myAvatarFrame || ""
                })
              );
            }
          };

          sock.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);
              this.enqueueIncomingEvent(data);
            } catch (e) {}
          };

          sock.onclose = () => {
            if (this.ws === sock) {
              this.ws = null;
              setTimeout(() => {
                this.connectNetwork();
              }, 3500);
            }
          };

          sock.onerror = () => {};
        } catch (err) {}
      }

      this.connectCloudMqtt(myCode);
      this.connectNtfyCloud(myCode);

      const baseUrl = this.getRelayBaseUrl();
      if (baseUrl) {
        this.compressAvatarForWire(profile.avatar).then((smallAva) => {
          fetch(baseUrl + "/api/peer/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              peerCode: myCode,
              name: profile.name,
              avatar: smallAva,
              myAvatarFrame: profile.myAvatarFrame || ""
            })
          }).catch(() => {});
        });
      }

      if (!this.pollTimer) {
        this.pollTimer = setInterval(() => {
          this.pollOfflineMailbox();
        }, 2500);
      }

      if (!this.outboxTimer) {
        this.outboxTimer = setInterval(() => {
          if (this.isAppDbReady()) {
            this.retryOutboxPackets();
          }
        }, 6000);
      }

      if (!this.heartbeatTimer) {
        this.heartbeatTimer = setInterval(() => {
          this.updateTabHeartbeat();
        }, 2000);
      }
    },

    connectCloudMqtt: function (myCode) {
      if (!myCode) return;
      if (!this.mqttSockets) this.mqttSockets = [];
      if (this.mqttSockets.length > 0) return;

      CLOUD_MQTT_BROKERS.forEach((brokerUrl, idx) => {
        try {
          const sock = new WebSocket(brokerUrl, "mqtt");
          sock.binaryType = "arraybuffer";
          sock._isMqttReady = false;

          sock.onopen = () => {
            try {
              const clientId =
                "tk_" +
                myCode.replace(/[^a-zA-Z0-9]/g, "") +
                "_" +
                idx +
                "_" +
                Math.random().toString(36).slice(2, 6);
              sock.send(buildMqttConnectPacket(clientId));
            } catch (e) {}
          };

          sock.onmessage = (ev) => {
            if (!(ev.data instanceof ArrayBuffer)) return;
            const buf = new Uint8Array(ev.data);
            if (buf.length >= 4 && buf[0] === 0x20 && buf[3] === 0x00) {
              sock._isMqttReady = true;
              const codeNow = this.getOrCreateMyPeerCode();
              sock.send(buildMqttSubscribePacket("tukey_peer_v2/inbox/" + codeNow, 1));
              sock.send(buildMqttSubscribePacket("tukey_peer_v2/req/" + codeNow, 2));
              return;
            }
            if ((buf[0] & 0xf0) === 0x30) {
              const jsonStr = parseMqttPublishPacket(buf);
              if (jsonStr) {
                try {
                  const data = JSON.parse(jsonStr);
                  this.enqueueIncomingEvent(data);
                } catch (e) {}
              }
            }
          };

          sock.onclose = () => {
            sock._isMqttReady = false;
            this.mqttSockets = (this.mqttSockets || []).filter((s) => s !== sock);
            setTimeout(() => {
              if (this.mqttSockets.length === 0) {
                this.connectCloudMqtt(this.getOrCreateMyPeerCode());
              }
            }, 5000);
          };

          sock.onerror = () => {};
          this.mqttSockets.push(sock);
        } catch (e) {}
      });

      if (!this.mqttPingTimer) {
        this.mqttPingTimer = setInterval(() => {
          (this.mqttSockets || []).forEach((s) => {
            if (s && s.readyState === 1 && s._isMqttReady) {
              try {
                s.send(new Uint8Array([0xc0, 0x00]));
              } catch (e) {}
            }
          });
        }, 25000);
      }
    },

    connectNtfyCloud: function (myCode) {
      if (!myCode || this.ntfySocket) return;
      const safeTopic = "tukey_peer_v2_" + myCode.replace(/[^a-zA-Z0-9_-]/g, "_");
      try {
        const ws = new WebSocket("wss://ntfy.sh/" + safeTopic + "/ws?since=24h");
        this.ntfySocket = ws;
        ws.onmessage = (ev) => {
          try {
            const wrapper = JSON.parse(ev.data);
            if (wrapper && wrapper.event === "message" && wrapper.message) {
              const inner = JSON.parse(wrapper.message);
              this.enqueueIncomingEvent(inner);
            }
          } catch (e) {}
        };
        ws.onclose = () => {
          if (this.ntfySocket === ws) {
            this.ntfySocket = null;
          }
        };
        ws.onerror = () => {};
      } catch (e) {}
    },

    dispatchPacketToNetwork: function (targetCode, payload, httpPath, retainOnMqtt, skipOutbox) {
      if (!targetCode || !payload) return;
      if (!payload.eventId) {
        payload.eventId = "evt_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9);
      }
      if (!skipOutbox && payload.type !== "peer_ack" && payload.type !== "ack") {
        this.enqueueOutboxPacket(targetCode, payload, httpPath, retainOnMqtt);
      }

      const jsonStr = JSON.stringify(payload);

      if (this.bc) {
        try {
          this.bc.postMessage(payload);
        } catch (e) {}
      }
      try {
        localStorage.setItem("tukey_peer_local_bus_pkt", jsonStr);
      } catch (e) {}

      if (this.ws && this.ws.readyState === 1) {
        try {
          this.ws.send(jsonStr);
        } catch (e) {}
      }

      const baseUrl = this.getRelayBaseUrl();
      if (baseUrl && httpPath) {
        fetch(baseUrl + httpPath, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: jsonStr
        }).catch(() => {});
      }

      const mqttTopic = retainOnMqtt
        ? "tukey_peer_v2/req/" + targetCode
        : "tukey_peer_v2/inbox/" + targetCode;
      (this.mqttSockets || []).forEach((s) => {
        if (s && s.readyState === 1 && s._isMqttReady) {
          try {
            s.send(buildMqttPublishPacket(mqttTopic, jsonStr, !!retainOnMqtt));
          } catch (e) {}
        }
      });

      if (jsonStr.length < 3800) {
        const safeTopic = "tukey_peer_v2_" + targetCode.replace(/[^a-zA-Z0-9_-]/g, "_");
        fetch("https://ntfy.sh/" + safeTopic, {
          method: "POST",
          body: jsonStr
        }).catch(() => {});
      }
    },

    pollOfflineMailbox: async function () {
      if (!this.isAppDbReady()) return;
      const myCode = this.getOrCreateMyPeerCode();
      const baseUrl = this.getRelayBaseUrl();
      if (!baseUrl) return;
      try {
        const res = await fetch(baseUrl + "/api/peer/poll?code=" + encodeURIComponent(myCode));
        if (!res.ok) return;
        const data = await res.json();
        if (data && Array.isArray(data.events) && data.events.length > 0) {
          for (const evt of data.events) {
            this.enqueueIncomingEvent(evt);
          }
          await this.flushPendingEvents();
        }
      } catch (e) {}
    },

    enqueueIncomingEvent: function (data) {
      if (!data || !data.type) return;
      this.pendingRawEvents.push(data);
      if (this.isAppDbReady()) {
        this.flushPendingEvents();
      }
    },

    flushPendingEvents: async function () {
      if (this.isProcessingQueue || !this.isAppDbReady()) return;
      this.isProcessingQueue = true;
      try {
        while (this.pendingRawEvents.length > 0) {
          const evt = this.pendingRawEvents.shift();
          await this.handleIncomingEvent(evt);
        }
      } finally {
        this.isProcessingQueue = false;
      }
    },

    handleIncomingEvent: async function (data) {
      if (!data || !data.type) return;
      const myCode = this.getOrCreateMyPeerCode();

      if (data.toCode && data.toCode !== myCode) {
        return;
      }
      if (data.type === "profile_update" && Array.isArray(data.targetCodes) && data.targetCodes.length > 0) {
        if (!data.targetCodes.includes(myCode)) return;
      }

      if (data.type === "peer_ack") {
        if (data.ackEventId) {
          this.removeOutboxPacket(data.ackEventId);
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

      this.playNoticeAlertSound();
      this.triggerMobileSystemNotification(title, message, avatarUrl, opts);

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
      this.filterOtherTabPeerChats();
      if (typeof window.renderChatList === "function") {
        try {
          await window.renderChatList();
        } catch (e) {}
      } else if (typeof window.renderChatListProxy === "function") {
        try {
          await window.renderChatListProxy();
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

    filterOtherTabPeerChats: function () {
      if (!window.state || !window.state.chats) return;
      const myCode = this.getOrCreateMyPeerCode();
      for (const [id, chat] of Object.entries(window.state.chats)) {
        if (chat && chat.roleType === "peer" && chat.myPeerCode && chat.myPeerCode !== myCode) {
          if (this.isCodeUsedByAnotherTab(chat.myPeerCode)) {
            delete window.state.chats[id];
          }
        }
      }
    },

    findPeerChatByCodeAsync: async function (peerCode) {
      if (!peerCode) return null;
      const myCode = this.getOrCreateMyPeerCode();
      if (window.state && window.state.chats) {
        for (const chat of Object.values(window.state.chats)) {
          if (
            chat &&
            chat.roleType === "peer" &&
            chat.peerCode === peerCode &&
            (!chat.myPeerCode || chat.myPeerCode === myCode)
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
              c.roleType === "peer" &&
              c.peerCode === peerCode &&
              (!c.myPeerCode || c.myPeerCode === myCode)
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
        if (window.db && window.db.chats) {
          await window.db.chats.put(existing);
        }
        await this.refreshAppChatAndContactsUI();
        return existing;
      }

      const safeMy = myCode.replace(/[^a-zA-Z0-9]/g, "");
      const safeTarget = peerCode.replace(/[^a-zA-Z0-9]/g, "");
      const newId = "chat_peer_" + safeMy + "_" + safeTarget;

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

      if (remaining.length === 0) {
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

    renderFriendRequestsUI: function () {
      const section = document.getElementById("peer-requests-section");
      const listEl = document.getElementById("peer-requests-list");
      if (!section || !listEl) return;

      const reqs = this.getIncomingRequests();
      listEl.innerHTML = "";

      if (reqs.length === 0) {
        section.style.display = "none";
        return;
      }

      section.style.display = "flex";
      const defaultAva = window.defaultAvatar || "https://api.iconify.design/lucide:user.svg?color=%23888888";

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
      const incomingMsg = {
        role: "assistant",
        type: isVoice ? "voice_message" : undefined,
        eventId: data.eventId || "",
        sender: peerChat.name,
        senderName: peerChat.name,
        senderAvatar:
          peerChat.settings?.aiAvatar ||
          window.defaultAvatar ||
          "https://api.iconify.design/lucide:user.svg?color=%23888888",
        content: content,
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
      const previewText = isVoice ? "[语音消息]" : content;

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

      const chat = await this.findPeerChatByCodeAsync(peerCode);
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
        this.applyFrameToHomeScreen(newFrameForMe || "");
      }

      if (window.db && window.db.chats) {
        await window.db.chats.put(chat);
      }

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

      const payload = {
        type: "message",
        eventId: eventId,
        fromCode: myCode,
        toCode: chat.peerCode,
        content: msg.content || "[语音消息]",
        msgType: msg.type === "voice_message" ? "voice_message" : "text",
        audioData: msg.audioData || "",
        audioDuration: msg.audioDuration || 0,
        senderName: chat.settings?.myName || myProfile.name,
        senderAvatar: smallAva,
        senderAvatarFrame: chat.settings?.myAvatarFrame || myProfile.myAvatarFrame || "",
        peerAvatarFrame: chat.settings?.aiAvatarFrame || "",
        timestamp: msg.timestamp || Date.now()
      };

      this.dispatchPacketToNetwork(chat.peerCode, payload, "/api/peer/send", false);
    },

    applyFrameToHomeScreen: async function (frameUrl) {
      this.isSyncingHomeProfile = true;
      try {
        const frameImg = document.getElementById("profile-avatar-frame");
        if (frameImg) {
          if (frameUrl) {
            frameImg.src = frameUrl;
            frameImg.style.display = "block";
          } else {
            frameImg.src = "";
            frameImg.style.display = "none";
          }
        }
        if (window.state && window.state.globalSettings) {
          window.state.globalSettings.homeAvatarFrame = frameUrl || "";
          if (window.db && window.db.globalSettings) {
            await window.db.globalSettings.put(window.state.globalSettings);
          }
        }
      } catch (e) {}
      setTimeout(() => {
        this.isSyncingHomeProfile = false;
      }, 150);
    },

    syncMyProfileToHomeAndPeers: async function (newName, newAvatar, newMyFrame, newPeerFrame, sourceChat) {
      this.isSyncingHomeProfile = true;
      try {
        const profileAvatarEl = document.getElementById("profile-avatar-img");
        const profileNameEl = document.getElementById("profile-username");

        if (newAvatar && profileAvatarEl) {
          profileAvatarEl.src = newAvatar;
        }
        if (newName && newName !== "我" && profileNameEl) {
          profileNameEl.textContent = newName;
        }
        if (newMyFrame !== undefined) {
          const frameImg = document.getElementById("profile-avatar-frame");
          if (frameImg) {
            if (newMyFrame) {
              frameImg.src = newMyFrame;
              frameImg.style.display = "block";
            } else {
              frameImg.src = "";
              frameImg.style.display = "none";
            }
          }
        }

        if (window.state && window.state.globalSettings) {
          if (!window.state.globalSettings.widgetData) {
            window.state.globalSettings.widgetData = {};
          }
          if (newAvatar) {
            window.state.globalSettings.widgetData["profile-avatar-img"] = newAvatar;
          }
          if (newName && newName !== "我") {
            window.state.globalSettings.widgetData["profile-username"] = newName;
          }
          if (newMyFrame !== undefined) {
            window.state.globalSettings.homeAvatarFrame = newMyFrame || "";
          }
          if (window.db && window.db.globalSettings) {
            await window.db.globalSettings.put(window.state.globalSettings);
          }
        }
      } catch (e) {}

      setTimeout(() => {
        this.isSyncingHomeProfile = false;
      }, 200);

      await this.syncMyProfileToPeers(newName, newAvatar, newMyFrame, newPeerFrame, sourceChat);
    },

    syncMyProfileToPeers: async function (newName, newAvatar, newMyFrame, newPeerFrame, sourceChat) {
      const myCode = this.getOrCreateMyPeerCode();
      const profile = this.getMyProfile();
      const name = newName || profile.name;
      const avatar = newAvatar || profile.avatar;
      const myFrame = newMyFrame !== undefined ? newMyFrame : profile.myAvatarFrame || "";
      const smallAva = await this.compressAvatarForWire(avatar);

      const targetPeers = [];
      if (window.state && window.state.chats) {
        for (const chat of Object.values(window.state.chats)) {
          if (
            chat &&
            chat.roleType === "peer" &&
            chat.peerCode &&
            (!chat.myPeerCode || chat.myPeerCode === myCode)
          ) {
            if (!chat.settings) chat.settings = {};
            if (name) chat.settings.myName = name;
            if (avatar) chat.settings.myAvatar = avatar;
            if (newMyFrame !== undefined) chat.settings.myAvatarFrame = myFrame;
            if (window.db && window.db.chats) {
              try {
                await window.db.chats.put(chat);
              } catch (e) {}
            }
            const peerFrameToSend =
              sourceChat && sourceChat.id === chat.id && newPeerFrame !== undefined
                ? newPeerFrame
                : undefined;
            targetPeers.push({
              peerCode: chat.peerCode,
              peerFrame: peerFrameToSend
            });
          }
        }
      }

      const eventId = "evt_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9);
      for (const item of targetPeers) {
        const payload = {
          type: "profile_update",
          eventId: eventId + "_" + item.peerCode,
          peerCode: myCode,
          toCode: item.peerCode,
          name: name,
          avatar: smallAva,
          myAvatarFrame: myFrame,
          peerAvatarFrame: item.peerFrame,
          targetCodes: [item.peerCode],
          timestamp: Date.now()
        };
        this.dispatchPacketToNetwork(item.peerCode, payload, "/api/peer/profile", false);
      }
    },

    observeHomeProfileChanges: function () {
      if (this._homeObserverAttached) return;
      this._homeObserverAttached = true;

      const profileAva = document.getElementById("profile-avatar-img");
      const profileName = document.getElementById("profile-username");
      const profileFrame = document.getElementById("profile-avatar-frame");

      let debounceTimer = null;
      const triggerHomeSync = () => {
        if (this.isSyncingHomeProfile) return;
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          if (this.isSyncingHomeProfile) return;
          const curAva = profileAva ? profileAva.src : "";
          const curName = profileName ? profileName.textContent.trim() : "";
          const curFrame =
            profileFrame && profileFrame.style.display !== "none"
              ? profileFrame.getAttribute("src") || ""
              : "";
          this.syncMyProfileToPeers(
            curName && curName !== "你的昵称" ? curName : undefined,
            curAva || undefined,
            curFrame
          );
        }, 400);
      };

      if (typeof MutationObserver !== "undefined") {
        const obs = new MutationObserver(triggerHomeSync);
        if (profileAva) obs.observe(profileAva, { attributes: true, attributeFilter: ["src"] });
        if (profileName) obs.observe(profileName, { childList: true, characterData: true, subtree: true });
        if (profileFrame) obs.observe(profileFrame, { attributes: true, attributeFilter: ["src", "style"] });
      }
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
      const affectionBtn = document.getElementById("chat-affection-bottom-btn");
      const mapBtn = document.getElementById("chat-map-btn");
      const waitReplyBtn = document.getElementById("wait-reply-btn");
      const recordPanel = document.getElementById("peer-voice-record-panel");

      const isPeer = Boolean(chat && chat.roleType === "peer");

      if (isPeer) {
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
      } else {
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
      if (!chat || chat.roleType !== "peer") return;

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

    resetPeerChatSettingsUI: function () {
      const chatNameGroup = document.getElementById("chat-name-group");
      if (chatNameGroup) {
        const lbl = chatNameGroup.querySelector("label");
        if (lbl) lbl.textContent = "角色真名 /群聊名称";
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

      const invBtn = document.getElementById("manage-ai-inventory-btn");
      if (invBtn) invBtn.style.display = "";

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
            if (currentChat && currentChat.roleType === "peer") {
              PeerManager.applyPeerChatSettingsUI(currentChat);
            } else {
              PeerManager.resetPeerChatSettingsUI();
            }
          }, 50);
        });
      }

      const saveSettingsBtn = document.getElementById("save-chat-settings-btn");
      if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener("click", async () => {
          if (!window.state || !window.state.activeChatId) return;
          const currentChat = window.state.chats[window.state.activeChatId];
          if (currentChat && currentChat.roleType === "peer") {
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

            const newMyFrame = currentChat.settings.myAvatarFrame || "";
            const newPeerFrame = currentChat.settings.aiAvatarFrame || "";

            if (window.db && window.db.chats) {
              await window.db.chats.put(currentChat);
            }
            await PeerManager.refreshAppChatAndContactsUI();
            await PeerManager.syncMyProfileToHomeAndPeers(
              newName,
              newAva,
              newMyFrame,
              newPeerFrame,
              currentChat
            );
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
            if (statsGrid) statsGrid.style.display = "none";
            if (valuesGrid) valuesGrid.style.display = "none";
            if (skillsBtn) skillsBtn.style.display = "none";
            if (skillsContainer) skillsContainer.style.display = "none";
            if (attrTitle) attrTitle.style.display = "none";
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
