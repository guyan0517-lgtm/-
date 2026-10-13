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
    heartbeatTimer: null,
    seenEventIds: new Set(),

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
      const defaultAva = (window.defaultAvatar) || "https://api.iconify.design/lucide:user.svg?color=%23888888";
      let name = "我";
      let avatar = defaultAva;

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

      if (window.state && window.state.userProfile) {
        if (window.state.userProfile.name) name = window.state.userProfile.name;
        if (window.state.userProfile.avatar) avatar = window.state.userProfile.avatar;
      }
      if (window.state && window.state.activeChatId && window.state.chats) {
        const activeChat = window.state.chats[window.state.activeChatId];
        if (activeChat && activeChat.roleType === "peer" && activeChat.settings) {
          if (activeChat.settings.myName) name = activeChat.settings.myName;
          if (activeChat.settings.myAvatar) avatar = activeChat.settings.myAvatar;
        }
      }
      return { name, avatar };
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
              this.handleIncomingEvent(ev.data);
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
              sock.send(JSON.stringify({
                type: "register",
                peerCode: this.getOrCreateMyPeerCode(),
                name: profile.name,
                avatar: smallAva
              }));
            }
          };

          sock.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);
              this.handleIncomingEvent(data);
            } catch (e) {}
          };

          sock.onclose = () => {
            if (this.ws === sock) {
              this.ws = null;
              setTimeout(() => {
                this.connectNetwork();
              }, 4000);
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
              avatar: smallAva
            })
          }).catch(() => {});
        });
      }

      if (!this.pollTimer) {
        this.pollTimer = setInterval(() => {
          this.pollOfflineMailbox();
        }, 2500);
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
              const clientId = "tk_" + myCode.replace(/[^a-zA-Z0-9]/g, "") + "_" + idx + "_" + Math.random().toString(36).slice(2, 6);
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
                  this.handleIncomingEvent(data);
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
        const ws = new WebSocket("wss://ntfy.sh/" + safeTopic + "/ws?since=10m");
        this.ntfySocket = ws;
        ws.onmessage = (ev) => {
          try {
            const wrapper = JSON.parse(ev.data);
            if (wrapper && wrapper.event === "message" && wrapper.message) {
              const inner = JSON.parse(wrapper.message);
              this.handleIncomingEvent(inner);
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

    dispatchPacketToNetwork: function (targetCode, payload, httpPath, retainOnMqtt) {
      if (!targetCode || !payload) return;
      if (!payload.eventId) {
        payload.eventId = "evt_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9);
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

      const safeTopic = "tukey_peer_v2_" + targetCode.replace(/[^a-zA-Z0-9_-]/g, "_");
      fetch("https://ntfy.sh/" + safeTopic, {
        method: "POST",
        body: jsonStr
      }).catch(() => {});
    },

    pollOfflineMailbox: async function () {
      const myCode = this.getOrCreateMyPeerCode();
      const baseUrl = this.getRelayBaseUrl();
      if (!baseUrl) return;
      try {
        const res = await fetch(baseUrl + "/api/peer/poll?code=" + encodeURIComponent(myCode));
        if (!res.ok) return;
        const data = await res.json();
        if (data && Array.isArray(data.events) && data.events.length > 0) {
          for (const evt of data.events) {
            await this.handleIncomingEvent(evt);
          }
        }
      } catch (e) {}
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

      if (data.eventId) {
        if (this.seenEventIds.has(data.eventId)) return;
        this.seenEventIds.add(data.eventId);
        if (this.seenEventIds.size > 300) {
          const first = this.seenEventIds.values().next().value;
          this.seenEventIds.delete(first);
        }
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

    showPeerNotice: function (text, onClick) {
      const screen = document.getElementById("phone-screen") || document.body;
      let bar = document.getElementById("peer-top-notice-bar");
      if (!bar) {
        bar = document.createElement("div");
        bar.id = "peer-top-notice-bar";
        bar.style.position = "absolute";
        bar.style.top = "36px";
        bar.style.left = "50%";
        bar.style.transform = "translateX(-50%)";
        bar.style.zIndex = "20000";
        bar.style.background = "var(--card-bg)";
        bar.style.color = "var(--text-primary)";
        bar.style.border = "1px solid var(--accent-color)";
        bar.style.borderRadius = "10px";
        bar.style.padding = "8px 14px";
        bar.style.fontSize = "12.5px";
        bar.style.fontWeight = "600";
        bar.style.maxWidth = "88%";
        bar.style.whiteSpace = "nowrap";
        bar.style.overflow = "hidden";
        bar.style.textOverflow = "ellipsis";
        bar.style.cursor = "pointer";
        screen.appendChild(bar);
      }
      bar.textContent = text;
      bar.style.display = "block";
      bar.onclick = () => {
        bar.style.display = "none";
        if (typeof onClick === "function") onClick();
      };
      if (bar._hideTimer) clearTimeout(bar._hideTimer);
      bar._hideTimer = setTimeout(() => {
        if (bar) bar.style.display = "none";
      }, 4500);
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
          window.switchContactsSubTab("friends");
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

    findPeerChatByCode: function (peerCode) {
      if (!window.state || !window.state.chats || !peerCode) return null;
      const myCode = this.getOrCreateMyPeerCode();
      for (const chat of Object.values(window.state.chats)) {
        if (
          chat.roleType === "peer" &&
          chat.peerCode === peerCode &&
          (!chat.myPeerCode || chat.myPeerCode === myCode)
        ) {
          return chat;
        }
      }
      return null;
    },

    createOrUpdatePeerChatSession: async function (peerCode, peerName, peerAvatar, groupId, remarkName) {
      const myCode = this.getOrCreateMyPeerCode();
      let existing = this.findPeerChatByCode(peerCode);
      const defaultAva = (window.defaultAvatar) || "https://api.iconify.design/lucide:user.svg?color=%23888888";
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
        createdAt: Date.now(),
        history: [],
        settings: {
          remarkName: finalRemark,
          aiAvatar: finalAva,
          myName: myProfile.name,
          myAvatar: myProfile.avatar,
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
        fromAvatar: data.fromAvatar || (window.defaultAvatar) || "https://api.iconify.design/lucide:user.svg?color=%23888888",
        timestamp: data.timestamp || Date.now()
      };
      if (existingIdx >= 0) {
        list[existingIdx] = reqItem;
      } else {
        list.unshift(reqItem);
      }
      this.saveIncomingRequests(list);
      this.renderFriendRequestsUI();

      this.showPeerNotice("收到来自 " + reqItem.fromName + " 的好友申请，点击处理", () => {
        this.openPeerModal();
      });

      const modal = document.getElementById("contact-peer-modal");
      if (!modal || !modal.classList.contains("visible")) {
        await this.openPeerModal();
      }
    },

    acceptFriendRequest: async function (fromCode) {
      if (!fromCode) return;
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

      await this.createOrUpdatePeerChatSession(
        fromCode,
        friendName,
        friendAvatar,
        selectedGroupId,
        customRemark || friendName
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
        timestamp: Date.now()
      };

      this.dispatchPacketToNetwork(fromCode, acceptPayload, "/api/peer/request", true);

      if (remaining.length === 0) {
        this.closePeerModal();
      }
      this.showPeerNotice("已同意 " + friendName + " 的好友申请");
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

      await this.createOrUpdatePeerChatSession(
        fromCode,
        peerName,
        data.fromAvatar,
        groupId,
        remarkName
      );

      this.showPeerNotice(peerName + " 已同意你的好友申请");
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
      const defaultAva = (window.defaultAvatar) || "https://api.iconify.design/lucide:user.svg?color=%23888888";

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
      const content = data.content;
      const myCode = this.getOrCreateMyPeerCode();
      if (!fromCode || !content || fromCode === myCode) return;

      let peerChat = this.findPeerChatByCode(fromCode);
      if (!peerChat) {
        peerChat = await this.createOrUpdatePeerChatSession(
          fromCode,
          data.senderName || "密友",
          data.senderAvatar,
          null,
          data.senderName || "密友"
        );
      }

      if (!peerChat) return;

      if (data.senderName && data.senderName !== "我") {
        peerChat.name = data.senderName;
      }
      if (data.senderAvatar && peerChat.settings) {
        peerChat.settings.aiAvatar = data.senderAvatar;
      }

      const incomingMsg = {
        role: "assistant",
        sender: peerChat.name,
        senderName: peerChat.name,
        senderAvatar: peerChat.settings?.aiAvatar || (window.defaultAvatar) || "https://api.iconify.design/lucide:user.svg?color=%23888888",
        content: content,
        timestamp: data.timestamp || Date.now()
      };

      if (!Array.isArray(peerChat.history)) {
        peerChat.history = [];
      }
      peerChat.history.push(incomingMsg);
      if (window.state && window.state.chats) {
        window.state.chats[peerChat.id] = peerChat;
      }
      if (window.db && window.db.chats) {
        await window.db.chats.put(peerChat);
      }

      if (window.state && String(window.state.activeChatId) === String(peerChat.id)) {
        if (typeof window.appendMessage === "function") {
          window.appendMessage(incomingMsg, peerChat);
        }
      } else {
        const displayTitle = peerChat.settings?.remarkName || peerChat.name || "密友";
        this.showPeerNotice(displayTitle + ": " + content);
      }

      await this.refreshAppChatAndContactsUI();
    },

    receivePeerProfileUpdate: async function (data) {
      const peerCode = data.peerCode;
      const newName = data.name;
      const newAvatar = data.avatar;
      const myCode = this.getOrCreateMyPeerCode();
      if (!peerCode || peerCode === myCode) return;

      if (!window.state || !window.state.chats) return;

      let changed = false;
      for (const chat of Object.values(window.state.chats)) {
        if (
          chat.roleType === "peer" &&
          chat.peerCode === peerCode &&
          (!chat.myPeerCode || chat.myPeerCode === myCode)
        ) {
          const oldName = chat.name;
          if (newName) {
            chat.name = newName;
            if (chat.settings && (!chat.settings.remarkName || chat.settings.remarkName === oldName)) {
              chat.settings.remarkName = newName;
            }
          }
          if (newAvatar && chat.settings) {
            chat.settings.aiAvatar = newAvatar;
          }
          if (window.db && window.db.chats) {
            await window.db.chats.put(chat);
          }
          changed = true;

          if (String(window.state.activeChatId) === String(chat.id)) {
            const titleEl = document.getElementById("chat-header-title");
            const showName = (chat.settings && chat.settings.remarkName) || chat.name;
            if (titleEl && showName) titleEl.textContent = showName;
            const chatAvatarEl = document.getElementById("chat-header-avatar");
            if (chatAvatarEl && newAvatar) chatAvatarEl.src = newAvatar;
          }
        }
      }

      if (changed) {
        await this.refreshAppChatAndContactsUI();
      }
    },

    sendDirectPeerMessage: async function (chat, msg) {
      if (!chat || chat.roleType !== "peer" || !chat.peerCode) return;

      const myCode = this.getOrCreateMyPeerCode();
      const myProfile = this.getMyProfile();
      const rawAva = chat.settings?.myAvatar || myProfile.avatar;
      const smallAva = await this.compressAvatarForWire(rawAva);

      const payload = {
        type: "message",
        eventId: "evt_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9),
        fromCode: myCode,
        toCode: chat.peerCode,
        content: msg.content,
        senderName: chat.settings?.myName || myProfile.name,
        senderAvatar: smallAva,
        timestamp: msg.timestamp || Date.now()
      };

      this.dispatchPacketToNetwork(chat.peerCode, payload, "/api/peer/send", false);
    },

    syncMyProfileToPeers: async function (newName, newAvatar) {
      const myCode = this.getOrCreateMyPeerCode();
      const profile = this.getMyProfile();
      const name = newName || profile.name;
      const avatar = newAvatar || profile.avatar;
      const smallAva = await this.compressAvatarForWire(avatar);

      const targetCodes = [];
      if (window.state && window.state.chats) {
        for (const chat of Object.values(window.state.chats)) {
          if (
            chat.roleType === "peer" &&
            chat.peerCode &&
            (!chat.myPeerCode || chat.myPeerCode === myCode)
          ) {
            targetCodes.push(chat.peerCode);
          }
        }
      }

      const eventId = "evt_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9);
      for (const targetCode of targetCodes) {
        const payload = {
          type: "profile_update",
          eventId: eventId + "_" + targetCode,
          peerCode: myCode,
          toCode: targetCode,
          name: name,
          avatar: smallAva,
          targetCodes: [targetCode],
          timestamp: Date.now()
        };
        this.dispatchPacketToNetwork(targetCode, payload, "/api/peer/profile", false);
      }
    },

    openPeerModal: async function () {
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
        navigator.clipboard.writeText(myCode).then(() => {
          if (copyBtn) {
            copyBtn.textContent = "已复制";
            setTimeout(() => {
              if (copyBtn) copyBtn.textContent = "复制";
            }, 1500);
          }
        }).catch(() => {
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
        timestamp: Date.now()
      };

      this.dispatchPacketToNetwork(targetCode, reqPayload, "/api/peer/request", true);

      this.closePeerModal();
      this.showPeerNotice("好友申请已发送，等待对方同意");
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
        if (btnStack) btnStack.style.display = "none";
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
        if (btnStack) btnStack.style.display = "";
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
      this.connectNetwork();

      window.addEventListener("storage", (ev) => {
        if (ev.key === "tukey_peer_local_bus_pkt" && ev.newValue) {
          try {
            const data = JSON.parse(ev.newValue);
            this.handleIncomingEvent(data);
          } catch (e) {}
        }
      });

      setTimeout(() => {
        this.filterOtherTabPeerChats();
      }, 600);

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
            const newName = (myNickEl && myNickEl.value.trim()) || (myNameEl && myNameEl.value.trim()) || currentChat.settings?.myName || "我";

            if (!currentChat.settings) currentChat.settings = {};
            currentChat.settings.myName = newName;
            currentChat.settings.myAvatar = newAva;
            if (myNameEl) myNameEl.value = newName;

            if (window.db && window.db.chats) {
              await window.db.chats.put(currentChat);
            }
            await PeerManager.refreshAppChatAndContactsUI();
            await PeerManager.syncMyProfileToPeers(newName, newAva);
          }
        });
      }

      const originalOpenContactCard = window.openContactCardModal;
      if (typeof originalOpenContactCard === "function") {
        window.openContactCardModal = async function (chatId) {
          await originalOpenContactCard(chatId);
          const currentChat = window.state && window.state.chats && (window.state.chats[chatId] || Object.values(window.state.chats).find((c) => String(c.id) === String(chatId)));
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
