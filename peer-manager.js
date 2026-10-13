/* 密友专属独立模块 - 仅针对密友生效，不影响普通好友、群聊、骰子或系统状态栏 */

(function () {
  const PeerManager = {
    myPeerCodeKey: "tukey_my_peer_code",
    ws: null,
    pollTimer: null,
    isConnecting: false,

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

    getOrCreateMyPeerCode: function () {
      let code = localStorage.getItem(this.myPeerCodeKey);
      if (!code) {
        const randA = Math.floor(1000 + Math.random() * 9000);
        const randB = Math.floor(1000 + Math.random() * 9000);
        code = "PEER-" + randA + "-" + randB;
        localStorage.setItem(this.myPeerCodeKey, code);
      }
      return code;
    },

    getMyProfile: function () {
      const defaultAva = (window.defaultAvatar) || "https://api.iconify.design/lucide:user.svg?color=%23888888";
      let name = "我";
      let avatar = defaultAva;

      if (window.state && window.state.userProfile) {
        if (window.state.userProfile.name) name = window.state.userProfile.name;
        if (window.state.userProfile.avatar) avatar = window.state.userProfile.avatar;
      }
      if (window.state && window.state.activeChatId && window.state.chats) {
        const activeChat = window.state.chats[window.state.activeChatId];
        if (activeChat && activeChat.settings) {
          if (activeChat.settings.myName) name = activeChat.settings.myName;
          if (activeChat.settings.myAvatar) avatar = activeChat.settings.myAvatar;
        }
      }
      return { name, avatar };
    },

    connectNetwork: function () {
      const myCode = this.getOrCreateMyPeerCode();
      const profile = this.getMyProfile();
      const wsUrl = this.getWsUrl();

      if (wsUrl) {
        try {
          this.ws = new WebSocket(wsUrl);

          this.ws.onopen = () => {
            this.ws.send(JSON.stringify({
              type: "register",
              peerCode: myCode,
              name: profile.name,
              avatar: profile.avatar
            }));
          };

          this.ws.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);
              this.handleIncomingEvent(data);
            } catch (e) {}
          };

          this.ws.onclose = () => {
            this.ws = null;
            setTimeout(() => {
              this.connectNetwork();
            }, 3000);
          };

          this.ws.onerror = () => {
            this.ws = null;
          };
        } catch (err) {}
      }

      const baseUrl = this.getRelayBaseUrl();
      if (baseUrl) {
        fetch(baseUrl + "/api/peer/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            peerCode: myCode,
            name: profile.name,
            avatar: profile.avatar
          })
        }).catch(() => {});
      }

      if (!this.pollTimer) {
        this.pollTimer = setInterval(() => {
          this.pollOfflineMailbox();
        }, 2000);
      }
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
            this.handleIncomingEvent(evt);
          }
        }
      } catch (e) {}
    },

    handleIncomingEvent: async function (data) {
      if (!data || !data.type) return;

      if (data.type === "message") {
        await this.receivePeerMessage(data);
      } else if (data.type === "profile_update") {
        await this.receivePeerProfileUpdate(data);
      } else if (data.type === "friend_request") {
        await this.receiveFriendRequest(data);
      }
    },

    receivePeerMessage: async function (data) {
      const fromCode = data.fromCode;
      const content = data.content;
      if (!fromCode || !content) return;

      let peerChat = this.findPeerChatByCode(fromCode);
      if (!peerChat) {
        peerChat = await this.createIncomingPeerChat(fromCode, data.senderName, data.senderAvatar);
      }

      if (!peerChat) return;

      const incomingMsg = {
        role: "assistant",
        sender: peerChat.name,
        senderName: peerChat.name,
        senderAvatar: peerChat.settings?.aiAvatar || (window.defaultAvatar) || "https://api.iconify.design/lucide:user.svg?color=%23888888",
        content: content,
        timestamp: data.timestamp || Date.now()
      };

      peerChat.history.push(incomingMsg);
      if (window.db && window.db.chats) {
        await window.db.chats.put(peerChat);
      }

      if (window.state && String(window.state.activeChatId) === String(peerChat.id)) {
        if (typeof window.appendMessage === "function") {
          window.appendMessage(incomingMsg, peerChat);
        }
      }

      if (typeof window.renderChatList === "function") {
        window.renderChatList();
      }
    },

    receivePeerProfileUpdate: async function (data) {
      const peerCode = data.peerCode;
      const newName = data.name;
      const newAvatar = data.avatar;
      if (!peerCode) return;

      if (!window.state || !window.state.chats) return;

      let changed = false;
      for (const chat of Object.values(window.state.chats)) {
        if (chat.roleType === "peer" && chat.peerCode === peerCode) {
          if (newName) {
            chat.name = newName;
            if (chat.settings) chat.settings.remarkName = newName;
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
            if (titleEl && newName) titleEl.textContent = newName;
            const chatAvatarEl = document.getElementById("chat-header-avatar");
            if (chatAvatarEl && newAvatar) chatAvatarEl.src = newAvatar;
          }
        }
      }

      if (changed) {
        if (typeof window.renderChatList === "function") {
          window.renderChatList();
        }
        if (typeof window.renderContactsScreen === "function") {
          await window.renderContactsScreen();
        }
      }
    },

    receiveFriendRequest: async function (data) {
      const fromCode = data.fromCode;
      if (!fromCode) return;
      let peerChat = this.findPeerChatByCode(fromCode);
      if (!peerChat) {
        await this.createIncomingPeerChat(fromCode, data.fromName, data.fromAvatar);
      }
    },

    findPeerChatByCode: function (peerCode) {
      if (!window.state || !window.state.chats) return null;
      for (const chat of Object.values(window.state.chats)) {
        if (chat.roleType === "peer" && chat.peerCode === peerCode) {
          return chat;
        }
      }
      return null;
    },

    createIncomingPeerChat: async function (peerCode, senderName, senderAvatar) {
      const friendName = senderName || "密友";
      const defaultAva = (window.defaultAvatar) || "https://api.iconify.design/lucide:user.svg?color=%23888888";
      const ava = senderAvatar || defaultAva;
      const myProfile = this.getMyProfile();

      let defaultGroupId = null;
      if (typeof window.ensureDefaultContactGroup === "function") {
        defaultGroupId = await window.ensureDefaultContactGroup();
      }

      const newId = "chat_peer_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4);
      const newPeerChat = {
        id: newId,
        name: friendName,
        roleType: "peer",
        isGroup: false,
        isPinned: false,
        groupId: defaultGroupId,
        inMessageList: true,
        peerCode: peerCode,
        createdAt: Date.now(),
        history: [],
        settings: {
          remarkName: friendName,
          aiAvatar: ava,
          myAvatar: myProfile.avatar,
          background: "",
          theme: "default",
          fontSize: 13,
          customCss: ""
        }
      };

      if (!window.state.chats) window.state.chats = {};
      window.state.chats[newId] = newPeerChat;

      if (window.db && window.db.chats) {
        await window.db.chats.put(newPeerChat);
      }

      if (typeof window.renderChatList === "function") {
        window.renderChatList();
      }
      if (typeof window.renderContactsScreen === "function") {
        await window.renderContactsScreen();
      }

      return newPeerChat;
    },

    sendDirectPeerMessage: function (chat, msg) {
      if (!chat || chat.roleType !== "peer" || !chat.peerCode) return;

      const myCode = this.getOrCreateMyPeerCode();
      const myProfile = this.getMyProfile();

      const payload = {
        type: "message",
        fromCode: myCode,
        toCode: chat.peerCode,
        content: msg.content,
        senderName: chat.settings?.myName || myProfile.name,
        senderAvatar: chat.settings?.myAvatar || myProfile.avatar,
        timestamp: msg.timestamp || Date.now()
      };

      if (this.ws && this.ws.readyState === 1) {
        this.ws.send(JSON.stringify(payload));
      }

      const baseUrl = this.getRelayBaseUrl();
      if (baseUrl) {
        fetch(baseUrl + "/api/peer/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }).catch(() => {});
      }
    },

    syncMyProfileToPeers: function (newName, newAvatar) {
      const myCode = this.getOrCreateMyPeerCode();
      const profile = this.getMyProfile();
      const name = newName || profile.name;
      const avatar = newAvatar || profile.avatar;

      const targetCodes = [];
      if (window.state && window.state.chats) {
        for (const chat of Object.values(window.state.chats)) {
          if (chat.roleType === "peer" && chat.peerCode) {
            targetCodes.push(chat.peerCode);
          }
        }
      }

      const payload = {
        type: "profile_update",
        peerCode: myCode,
        name: name,
        avatar: avatar,
        targetCodes: targetCodes
      };

      if (this.ws && this.ws.readyState === 1) {
        this.ws.send(JSON.stringify(payload));
      }

      const baseUrl = this.getRelayBaseUrl();
      if (baseUrl) {
        fetch(baseUrl + "/api/peer/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }).catch(() => {});
      }
    },

    openPeerModal: async function () {
      const codeDisplay = document.getElementById("my-peer-code-display");
      const targetInput = document.getElementById("peer-target-code-input");
      const nameInput = document.getElementById("peer-friend-name-input");
      const groupSelect = document.getElementById("peer-friend-group-select");
      const copyBtn = document.getElementById("copy-my-peer-code-btn");

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
            groups.forEach(g => {
              const opt = document.createElement("option");
              opt.value = g.id;
              opt.textContent = g.name;
              groupSelect.appendChild(opt);
            });
          }
        } catch (e) {
          const opt = document.createElement("option");
          opt.value = "";
          opt.textContent = "默认分组";
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

      const targetCode = targetInput ? targetInput.value.trim() : "";
      const rawName = nameInput ? nameInput.value.trim() : "";
      const friendName = rawName || "密友";

      let selectedGroupId = null;
      if (groupSelect && groupSelect.value) {
        selectedGroupId = parseInt(groupSelect.value, 10) || null;
      }
      if (!selectedGroupId && typeof window.ensureDefaultContactGroup === "function") {
        selectedGroupId = await window.ensureDefaultContactGroup();
      }

      const newId = "chat_peer_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4);
      const defaultAva = (window.defaultAvatar) || "https://api.iconify.design/lucide:user.svg?color=%23888888";
      const userAva = (window.state && window.state.userProfile && window.state.userProfile.avatar) || defaultAva;

      const newPeerChat = {
        id: newId,
        name: friendName,
        roleType: "peer",
        isGroup: false,
        isPinned: false,
        groupId: selectedGroupId,
        inMessageList: true,
        peerCode: targetCode,
        createdAt: Date.now(),
        history: [],
        settings: {
          remarkName: friendName,
          aiAvatar: defaultAva,
          myAvatar: userAva,
          background: "",
          theme: "default",
          fontSize: 13,
          customCss: ""
        }
      };

      if (!window.state.chats) window.state.chats = {};
      window.state.chats[newId] = newPeerChat;

      if (window.db && window.db.chats) {
        await window.db.chats.put(newPeerChat);
      }

      if (targetCode) {
        const myCode = this.getOrCreateMyPeerCode();
        const myProfile = this.getMyProfile();
        const reqPayload = {
          type: "friend_request",
          fromCode: myCode,
          toCode: targetCode,
          fromName: myProfile.name,
          fromAvatar: myProfile.avatar
        };
        if (this.ws && this.ws.readyState === 1) {
          this.ws.send(JSON.stringify(reqPayload));
        }
        const baseUrl = this.getRelayBaseUrl();
        if (baseUrl) {
          fetch(baseUrl + "/api/peer/request", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(reqPayload)
          }).catch(() => {});
        }
      }

      this.closePeerModal();

      if (typeof window.renderChatList === "function") {
        window.renderChatList();
      }
      if (typeof window.renderContactsScreen === "function") {
        await window.renderContactsScreen();
      }
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

      const myGroupNick = document.getElementById("my-group-nickname-group");
      if (myGroupNick) myGroupNick.style.display = "none";

      const groupAvatarGroup = document.getElementById("group-avatar-group");
      if (groupAvatarGroup) groupAvatarGroup.style.display = "none";

      const chatNameGroup = document.getElementById("chat-name-group");
      if (chatNameGroup) chatNameGroup.style.display = "block";

      const chatRemarkGroup = document.getElementById("chat-remark-group");
      if (chatRemarkGroup) chatRemarkGroup.style.display = "block";

      const assignGroupSection = document.getElementById("assign-group-section");
      if (assignGroupSection) assignGroupSection.style.display = "block";

      const aiAvatarGroup = document.getElementById("ai-avatar-group");
      if (aiAvatarGroup) aiAvatarGroup.style.display = "block";

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
            if (window.db && window.db.chats) {
              await window.db.chats.put(currentChat);
            }
            if (typeof window.renderContactsScreen === "function") {
              await window.renderContactsScreen();
            }

            const myAvatarEl = document.getElementById("my-avatar-preview");
            const myNameEl = document.getElementById("my-name-input");
            const newAva = myAvatarEl ? myAvatarEl.src : currentChat.settings?.myAvatar;
            const newName = myNameEl ? myNameEl.value.trim() : currentChat.settings?.myName;
            PeerManager.syncMyProfileToPeers(newName, newAva);
          }
        });
      }

      const originalOpenContactCard = window.openContactCardModal;
      if (typeof originalOpenContactCard === "function") {
        window.openContactCardModal = async function (chatId) {
          await originalOpenContactCard(chatId);
          const currentChat = window.state && window.state.chats && (window.state.chats[chatId] || Object.values(window.state.chats).find(c => String(c.id) === String(chatId)));
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
