// ===================================================================
// 物品栏功能模块 (Inventory Manager)
// ===================================================================

(function () {
  let isInventoryDrawerOpen = false;
  let currentInventoryTab = "all";
  let currentCharacterInventoryTab = "all";
  let isInventoryManageMode = false;
  let selectedInventoryItemIds = new Set();
  let editingInventoryItemId = null;
  let editingTargetChar = null; // null: 当前玩家, { type: 'member'|'ai', id: string, name: string }
  let pendingAvatarBase64 = "";
  let activeDetailItem = null;
  let isGlobalLibraryManageMode = false;
  let currentGlobalInventoryTab = "all";

  // 获取当前激活聊天的物品栏数据
  function getCurrentChatInventory() {
    if (typeof state === "undefined" || !state.activeChatId) return [];
    const chat = state.chats[state.activeChatId];
    if (!chat) return [];
    if (!Array.isArray(chat.inventory)) {
      chat.inventory = [];
    }
    return chat.inventory;
  }

  // 获取当前正在查看/编辑的目标角色背包
  function getEditingTargetInventory() {
    if (typeof state === "undefined" || !state.activeChatId) return [];
    const chat = state.chats[state.activeChatId];
    if (!chat) return [];
    if (editingTargetChar) {
      if (editingTargetChar.type === "member") {
        const member = (chat.members || []).find(m => String(m.id) === String(editingTargetChar.id));
        if (member) {
          if (!Array.isArray(member.inventory)) member.inventory = [];
          return member.inventory;
        }
      } else {
        if (!Array.isArray(chat.aiInventory)) chat.aiInventory = [];
        return chat.aiInventory;
      }
    }
    return getCurrentChatInventory();
  }

  // 保存当前激活聊天的物品栏数据
  async function saveCurrentChatInventory(inventory) {
    if (typeof state === "undefined" || !state.activeChatId) return;
    const chat = state.chats[state.activeChatId];
    if (!chat) return;
    chat.inventory = inventory;
    const dbInstance = typeof db !== "undefined" ? db : (window.database || null);
    if (dbInstance && dbInstance.chats) {
      await dbInstance.chats.put(chat);
    }
  }

  // 计算骰子或数值表达式（如 1D6, 2D4+1, 5, -2）
  function rollDiceExpression(expr) {
    if (!expr && expr !== 0) return 0;
    const cleanExpr = String(expr).trim().toUpperCase();
    const diceMatch = cleanExpr.match(/^([+-]?\s*)(\d+)?D(\d+)([+-]\d+)?$/i);
    if (diceMatch) {
      const sign = diceMatch[1] && diceMatch[1].includes("-") ? -1 : 1;
      const count = parseInt(diceMatch[2], 10) || 1;
      const sides = parseInt(diceMatch[3], 10) || 6;
      const bonus = parseInt(diceMatch[4], 10) || 0;
      let sum = 0;
      for (let i = 0; i < count; i++) {
        sum += Math.floor(Math.random() * sides) + 1;
      }
      return sign * (sum + bonus);
    }
    const num = parseInt(cleanExpr.replace(/\s+/g, ""), 10);
    return isNaN(num) ? 0 : num;
  }

  // 执行 AI 返回的道具数值效果修改，全自动静默同步更新 COC 面板（HP/MP/SAN/属性/技能）
  async function executeAiItemEffect(chat, effectPayload) {
    if (!chat || !effectPayload) return;
    if (effectPayload.approved === false) return;

    let changes = Array.isArray(effectPayload.changes) ? effectPayload.changes : [];
    
    // 兼容多种输出格式
    if (changes.length === 0) {
      if (effectPayload.key && (effectPayload.delta !== undefined || effectPayload.value !== undefined)) {
        changes.push({
          target: effectPayload.target,
          key: effectPayload.key,
          delta: effectPayload.delta !== undefined ? effectPayload.delta : effectPayload.value
        });
      } else if (effectPayload.effect) {
        const effectStr = String(effectPayload.effect);
        const defaultTarget = effectPayload.target || (chat.isGroup ? (chat.settings?.myNickname || "我") : "我");
        await applyItemEffectToCharacterOrUser(chat, defaultTarget, effectStr);
        return;
      }
    }

    const myNickname = chat.isGroup ? (chat.settings?.myNickname || "我") : (chat.settings?.myName || "我");

    for (const chg of changes) {
      if (!chg || !chg.key) continue;
      const targetName = chg.target || effectPayload.target || myNickname;
      const isPlayer = !targetName || targetName === "我" || targetName === "玩家" || targetName === myNickname || targetName === "用户";

      let targetCocPanel = null;
      let updateFn = null;

      if (isPlayer) {
        if (!chat.settings) chat.settings = {};
        if (!chat.settings.myCocPanel) {
          chat.settings.myCocPanel = typeof getDefaultCocData === "function" ? getDefaultCocData() : { stats: {}, calculated: {}, skills: {} };
        }
        targetCocPanel = chat.settings.myCocPanel;
        updateFn = () => {
          if (window.myCocPanel && typeof window.myCocPanel.setData === "function") {
            window.myCocPanel.setData(targetCocPanel);
          }
        };
      } else {
        if (chat.isGroup && Array.isArray(chat.members)) {
          const member = chat.members.find(m => m.originalName === targetName || m.groupNickname === targetName || m.name === targetName || m.id === targetName);
          if (member) {
            if (!member.cocPanel) {
              member.cocPanel = typeof getDefaultCocData === "function" ? getDefaultCocData() : { stats: {}, calculated: {}, skills: {} };
            }
            targetCocPanel = member.cocPanel;
          }
        }
        if (!targetCocPanel) {
          if (!chat.settings) chat.settings = {};
          if (!chat.settings.aiCocPanel) {
            chat.settings.aiCocPanel = typeof getDefaultCocData === "function" ? getDefaultCocData() : { stats: {}, calculated: {}, skills: {} };
          }
          targetCocPanel = chat.settings.aiCocPanel;
          updateFn = () => {
            if (window.aiCocPanel && typeof window.aiCocPanel.setData === "function") {
              window.aiCocPanel.setData(targetCocPanel);
            }
          };
        }
      }

      if (!targetCocPanel) continue;
      if (!targetCocPanel.stats) targetCocPanel.stats = { str: 50, dex: 50, con: 50, pow: 50, siz: 50, edu: 50, app: 50, int: 50, luk: 50 };
      if (!targetCocPanel.calculated) {
        targetCocPanel.calculated = typeof calculateCocStats === "function" ? calculateCocStats(targetCocPanel.stats) : { hp: 10, maxHp: 10, mp: 10, maxMp: 10, san: 50, maxSan: 99 };
      }
      if (!targetCocPanel.skills) targetCocPanel.skills = {};

      const rawKey = String(chg.key).trim();
      const keyLower = rawKey.toLowerCase();
      const rawDelta = chg.delta !== undefined ? chg.delta : chg.value;
      const delta = typeof rawDelta === "number" ? rawDelta : rollDiceExpression(rawDelta);

      if (keyLower === "hp" || rawKey === "血量" || rawKey === "生命") {
        const maxHp = targetCocPanel.calculated.maxHp || 10;
        const oldHp = typeof targetCocPanel.calculated.hp === "number" ? targetCocPanel.calculated.hp : maxHp;
        targetCocPanel.calculated.hp = Math.max(0, Math.min(maxHp, oldHp + delta));
      } else if (keyLower === "san" || rawKey === "理智" || rawKey === "精神" || rawKey === "散值") {
        const maxSan = targetCocPanel.calculated.maxSan || 99;
        const oldSan = typeof targetCocPanel.calculated.san === "number" ? targetCocPanel.calculated.san : 50;
        targetCocPanel.calculated.san = Math.max(0, Math.min(maxSan, oldSan + delta));
      } else if (keyLower === "mp" || rawKey === "魔法" || rawKey === "魔力") {
        const maxMp = targetCocPanel.calculated.maxMp || 10;
        const oldMp = typeof targetCocPanel.calculated.mp === "number" ? targetCocPanel.calculated.mp : maxMp;
        targetCocPanel.calculated.mp = Math.max(0, Math.min(maxMp, oldMp + delta));
      } else {
        const statMap = {
          "力量": "str", "str": "str",
          "敏捷": "dex", "dex": "dex",
          "体质": "con", "con": "con",
          "意志": "pow", "pow": "pow",
          "体型": "siz", "siz": "siz",
          "教育": "edu", "edu": "edu",
          "外貌": "app", "app": "app",
          "智力": "int", "int": "int",
          "幸运": "luk", "luk": "luk"
        };
        const statKey = statMap[rawKey] || statMap[keyLower];
        if (statKey) {
          targetCocPanel.stats[statKey] = (targetCocPanel.stats[statKey] || 50) + delta;
          if (typeof calculateCocStats === "function") {
            targetCocPanel.calculated = calculateCocStats(targetCocPanel.stats, targetCocPanel.calculated);
          }
        } else {
          // 技能判定与数值修改（如克苏鲁神话、侦查、聆听等）
          let matchedSkillKey = Object.keys(targetCocPanel.skills).find(k => k.toLowerCase() === keyLower || k === rawKey);
          if (matchedSkillKey) {
            if (typeof targetCocPanel.skills[matchedSkillKey] === "object" && targetCocPanel.skills[matchedSkillKey] !== null) {
              targetCocPanel.skills[matchedSkillKey].value = (targetCocPanel.skills[matchedSkillKey].value || 0) + delta;
            } else {
              targetCocPanel.skills[matchedSkillKey] = (targetCocPanel.skills[matchedSkillKey] || 0) + delta;
            }
          } else {
            targetCocPanel.skills[rawKey] = delta;
          }
        }
      }

      if (updateFn) updateFn();
    }

    const dbInstance = typeof db !== "undefined" ? db : (window.database || null);
    if (dbInstance && dbInstance.chats) {
      await dbInstance.chats.put(chat);
    }
  }

  // 应用道具效果到 COC 面板（字符串解析回退）
  async function applyItemEffectToCharacterOrUser(chat, targetName, effectStr) {
    if (!chat || !effectStr) return "";
    const myNickname = chat.isGroup ? (chat.settings?.myNickname || "我") : (chat.settings?.myName || "我");
    const isPlayer = !targetName || targetName === "我" || targetName === "玩家" || targetName === myNickname || targetName === "用户";

    let targetCocPanel = null;
    let updateFn = null;

    if (isPlayer) {
      if (!chat.settings) chat.settings = {};
      if (!chat.settings.myCocPanel) {
        chat.settings.myCocPanel = typeof getDefaultCocData === "function" ? getDefaultCocData() : { stats: {}, calculated: {}, skills: {} };
      }
      targetCocPanel = chat.settings.myCocPanel;
      updateFn = () => {
        if (window.myCocPanel && typeof window.myCocPanel.setData === "function") {
          window.myCocPanel.setData(targetCocPanel);
        }
      };
    } else {
      if (chat.isGroup && Array.isArray(chat.members)) {
        const member = chat.members.find(m => m.originalName === targetName || m.groupNickname === targetName || m.name === targetName || m.id === targetName);
        if (member) {
          if (!member.cocPanel) {
            member.cocPanel = typeof getDefaultCocData === "function" ? getDefaultCocData() : { stats: {}, calculated: {}, skills: {} };
          }
          targetCocPanel = member.cocPanel;
        }
      }
      if (!targetCocPanel) {
        if (!chat.settings) chat.settings = {};
        if (!chat.settings.aiCocPanel) {
          chat.settings.aiCocPanel = typeof getDefaultCocData === "function" ? getDefaultCocData() : { stats: {}, calculated: {}, skills: {} };
        }
        targetCocPanel = chat.settings.aiCocPanel;
        updateFn = () => {
          if (window.aiCocPanel && typeof window.aiCocPanel.setData === "function") {
            window.aiCocPanel.setData(targetCocPanel);
          }
        };
      }
    }

    if (!targetCocPanel) return "";
    if (!targetCocPanel.stats) targetCocPanel.stats = { str: 50, dex: 50, con: 50, pow: 50, siz: 50, edu: 50, app: 50, int: 50, luk: 50 };
    if (!targetCocPanel.calculated) {
      targetCocPanel.calculated = typeof calculateCocStats === "function" ? calculateCocStats(targetCocPanel.stats) : { hp: 10, maxHp: 10, mp: 10, maxMp: 10, san: 50, maxSan: 99 };
    }
    if (!targetCocPanel.skills) targetCocPanel.skills = {};

    const reportParts = [];
    const effectTokens = effectStr.split(/[,，;；\s]+/).filter(Boolean);

    for (const token of effectTokens) {
      const hpMatch = token.match(/^(?:HP|血量|生命)([+-]?\s*.+)$/i);
      const sanMatch = token.match(/^(?:SAN|理智|精神|散值)([+-]?\s*.+)$/i);
      const mpMatch = token.match(/^(?:MP|魔法|魔力)([+-]?\s*.+)$/i);
      const statMatch = token.match(/^(力量|敏捷|体质|意志|体型|教育|外貌|智力|幸运|STR|DEX|CON|POW|SIZ|EDU|APP|INT|LUK)([+-]?\s*.+)$/i);

      if (hpMatch) {
        const delta = rollDiceExpression(hpMatch[1]);
        const maxHp = targetCocPanel.calculated.maxHp || 10;
        const oldHp = typeof targetCocPanel.calculated.hp === "number" ? targetCocPanel.calculated.hp : maxHp;
        const newHp = Math.max(0, Math.min(maxHp, oldHp + delta));
        targetCocPanel.calculated.hp = newHp;
        reportParts.push(`HP ${delta >= 0 ? "+" + delta : delta}`);
      } else if (sanMatch) {
        const delta = rollDiceExpression(sanMatch[1]);
        const maxSan = targetCocPanel.calculated.maxSan || 99;
        const oldSan = typeof targetCocPanel.calculated.san === "number" ? targetCocPanel.calculated.san : 50;
        const newSan = Math.max(0, Math.min(maxSan, oldSan + delta));
        targetCocPanel.calculated.san = newSan;
        reportParts.push(`SAN ${delta >= 0 ? "+" + delta : delta}`);
      } else if (mpMatch) {
        const delta = rollDiceExpression(mpMatch[1]);
        const maxMp = targetCocPanel.calculated.maxMp || 10;
        const oldMp = typeof targetCocPanel.calculated.mp === "number" ? targetCocPanel.calculated.mp : maxMp;
        const newMp = Math.max(0, Math.min(maxMp, oldMp + delta));
        targetCocPanel.calculated.mp = newMp;
        reportParts.push(`MP ${delta >= 0 ? "+" + delta : delta}`);
      } else if (statMatch) {
        const statNameMap = {
          "力量": "str", "STR": "str",
          "敏捷": "dex", "DEX": "dex",
          "体质": "con", "CON": "con",
          "意志": "pow", "POW": "pow",
          "体型": "siz", "SIZ": "siz",
          "教育": "edu", "EDU": "edu",
          "外貌": "app", "APP": "app",
          "智力": "int", "INT": "int",
          "幸运": "luk", "LUK": "luk"
        };
        const key = statNameMap[statMatch[1].toUpperCase()] || statNameMap[statMatch[1]];
        if (key) {
          const delta = rollDiceExpression(statMatch[2]);
          targetCocPanel.stats[key] = (targetCocPanel.stats[key] || 50) + delta;
          if (typeof calculateCocStats === "function") {
            targetCocPanel.calculated = calculateCocStats(targetCocPanel.stats, targetCocPanel.calculated);
          }
          reportParts.push(`${statMatch[1]} ${delta >= 0 ? "+" + delta : delta}`);
        }
      }
    }

    const dbInstance = typeof db !== "undefined" ? db : (window.database || null);
    if (dbInstance && dbInstance.chats) {
      await dbInstance.chats.put(chat);
    }
    if (updateFn) updateFn();

    return reportParts.join("，");
  }

  // 向指定角色（玩家或AI群员）添加物品并即时持久化，同时异步向 NovelAI 发送生图请求
  async function addItemToCharacterOrUser(chat, targetName, item, drawPrompt = "") {
    if (!chat || !item) return;
    const myNickname = chat.isGroup ? (chat.settings?.myNickname || "我") : (chat.settings?.myName || "我");
    const myName = chat.settings?.myName || "";
    const myId = chat.settings?.myId || chat.settings?.userId || "";
    const globalUserName = (typeof state !== "undefined" && (state.userProfile?.name || state.userProfile?.nickname || state.userProfile?.id || state.userProfile?.username || state.globalSettings?.userName)) || "";
    const localUserNames = [
      localStorage.getItem("username"),
      localStorage.getItem("user_name"),
      localStorage.getItem("tukey_user_name"),
      localStorage.getItem("tukey_user_id"),
      localStorage.getItem("ephone-username"),
      localStorage.getItem("ephone-my-name")
    ].filter(Boolean);

    const cleanTarget = String(targetName || "").trim();
    const cleanLower = cleanTarget.toLowerCase();

    let isPlayer = false;
    if (!cleanTarget) {
      isPlayer = true;
    } else if (
      cleanTarget === "我" ||
      cleanTarget === "你" ||
      cleanTarget === "您" ||
      cleanTarget === "玩家" ||
      cleanTarget === "用户" ||
      cleanTarget === "自己" ||
      cleanTarget === "主人" ||
      cleanTarget === "主角" ||
      cleanTarget === "主人公" ||
      cleanLower === "user" ||
      cleanLower === "player" ||
      cleanLower === "me" ||
      cleanLower === "you" ||
      (myNickname && (cleanTarget === myNickname || cleanLower === myNickname.toLowerCase())) ||
      (myName && (cleanTarget === myName || cleanLower === myName.toLowerCase())) ||
      (myId && (cleanTarget === myId || cleanLower === myId.toLowerCase())) ||
      (globalUserName && (cleanTarget === globalUserName || cleanLower === globalUserName.toLowerCase() || cleanTarget.includes(globalUserName))) ||
      localUserNames.some(u => cleanTarget === u || cleanLower === u.toLowerCase() || cleanTarget.includes(u)) ||
      (chat.settings?.myPersona && cleanTarget.includes(chat.settings.myPersona))
    ) {
      isPlayer = true;
    } else if (!chat.isGroup) {
      isPlayer = (cleanTarget !== chat.name);
    } else if (chat.isGroup && Array.isArray(chat.members)) {
      const isMember = chat.members.some(m => m.originalName === cleanTarget || m.groupNickname === cleanTarget || m.name === cleanTarget || m.id === cleanTarget);
      if (!isMember) {
        isPlayer = true;
      }
    }

    if (isPlayer) {
      if (!Array.isArray(chat.inventory)) chat.inventory = [];
      const exists = chat.inventory.some(i => i && (i.id === item.id || (i.name === item.name && (i.desc || "") === (item.desc || "") && Math.abs((i.createdAt || 0) - (item.createdAt || 0)) < 10000)));
      if (!exists) {
        chat.inventory.push(item);
      }
    } else {
      let foundMember = false;
      if (chat.isGroup && Array.isArray(chat.members)) {
        const member = chat.members.find(m => m.originalName === cleanTarget || m.groupNickname === cleanTarget || m.name === cleanTarget || m.id === cleanTarget);
        if (member) {
          if (!Array.isArray(member.inventory)) member.inventory = [];
          const exists = member.inventory.some(i => i && (i.id === item.id || (i.name === item.name && (i.desc || "") === (item.desc || ""))));
          if (!exists) {
            member.inventory.push(item);
          }
          foundMember = true;
        }
      }
      if (!foundMember) {
        if (!chat.isGroup) {
          if (!Array.isArray(chat.aiInventory)) chat.aiInventory = [];
          const exists = chat.aiInventory.some(i => i && (i.id === item.id || (i.name === item.name && (i.desc || "") === (item.desc || ""))));
          if (!exists) {
            chat.aiInventory.push(item);
          }
        } else {
          if (!Array.isArray(chat.inventory)) chat.inventory = [];
          const exists = chat.inventory.some(i => i && (i.id === item.id || (i.name === item.name && (i.desc || "") === (item.desc || ""))));
          if (!exists) {
            chat.inventory.push(item);
          }
        }
      }
    }

    if (typeof state !== "undefined" && state.chats && chat.id) {
      state.chats[chat.id] = chat;
      if (state.activeChatId === chat.id) {
        state.activeChat = chat;
      }
    }

    const dbInstance = typeof db !== "undefined" ? db : (window.database || null);
    if (dbInstance && dbInstance.chats) {
      await dbInstance.chats.put(chat);
    }
    renderInventoryList();
    if (typeof renderGlobalInventoryList === "function") {
      renderGlobalInventoryList();
    }

    // 确定生图提示词（优先使用AI给出的prompt，或以物品名与描述组装）
    const effectivePrompt = (drawPrompt || item.prompt || "").trim();
    const fallbackPrompt = `1item, ${item.name || "item"}${item.desc ? ", " + item.desc : ""}, masterpiece, best quality`;
    const promptToUse = effectivePrompt || fallbackPrompt;

    if (promptToUse && typeof window.callNovelAiDirect === "function") {
      // 异步调用，默认640x640小方图，生成后即时压缩至0.4
      window.callNovelAiDirect(promptToUse, {
        resolution: "640x640",
        seed: Math.floor(Math.random() * 4294967295),
      }).then(async (b64) => {
        if (b64) {
          let compressedB64 = b64;
          try {
            if (typeof compressImage === "function") {
              compressedB64 = await compressImage(b64, 0.4, 640, true);
            }
          } catch (compErr) {
            compressedB64 = b64;
          }

          item.avatar = compressedB64;
          
          // 1. 同步更新当前聊天中的同名同简介道具
          const syncList = (list) => {
            if (!Array.isArray(list)) return;
            list.forEach(i => {
              if (i && (i.id === item.id || (i.name === item.name && (i.desc || "") === (item.desc || "")))) {
                i.avatar = compressedB64;
              }
            });
          };

          syncList(chat.inventory);
          syncList(chat.aiInventory);
          if (Array.isArray(chat.members)) {
            chat.members.forEach(m => syncList(m.inventory));
          }

          // 2. 同步更新聊天历史中的道具消息卡片
          if (Array.isArray(chat.history)) {
            chat.history.forEach(m => {
              if (m && m.type === "inventory_card" && m.item) {
                if (m.item.id === item.id || (m.item.name === item.name && (m.item.desc || "") === (item.desc || ""))) {
                  m.item.avatar = compressedB64;
                }
              }
            });
          }

          // 3. 道具库去重同步：同步到所有会话中相同名称与描述的道具
          if (typeof state !== "undefined" && state.chats) {
            Object.values(state.chats).forEach(otherChat => {
              if (!otherChat || otherChat.id === chat.id) return;
              syncList(otherChat.inventory);
              syncList(otherChat.aiInventory);
              if (Array.isArray(otherChat.members)) {
                otherChat.members.forEach(m => syncList(m.inventory));
              }
              if (dbInstance && dbInstance.chats) {
                dbInstance.chats.put(otherChat).catch(() => {});
              }
            });
          }

          // 4. 持久化当前会话
          if (dbInstance && dbInstance.chats) {
            await dbInstance.chats.put(chat);
          }

          // 5. 实时刷新当前屏幕上展示的消息卡片 DOM
          try {
            const domAvatars = document.querySelectorAll(`[data-avatar-id="${item.id}"], [data-avatar-name="${item.name}"]`);
            domAvatars.forEach(el => {
              el.innerHTML = `<img src="${compressedB64}" alt="${item.name || "物品"}">`;
              el.onclick = (e) => {
                e.stopPropagation();
                if (typeof openFullImageModal === "function") openFullImageModal(compressedB64);
              };
            });
          } catch (domErr) {}

          // 6. 刷新抽屉列表和道具库
          renderInventoryList();
          if (typeof renderGlobalInventoryList === "function") {
            renderGlobalInventoryList();
          }
        }
      }).catch(e => {
        console.warn("物品自动向 NovelAI 生图未执行或跳过:", e);
      });
    }
  }

  // 切换物品栏抽屉展开与收起
  function toggleInventoryDrawer() {
    const drawer = document.getElementById("chat-inventory-drawer");
    if (!drawer) return;
    isInventoryDrawerOpen = !isInventoryDrawerOpen;
    if (isInventoryDrawerOpen) {
      drawer.classList.add("open");
      renderInventoryList();
    } else {
      drawer.classList.remove("open");
      exitInventoryManageMode();
    }
  }

  function closeInventoryDrawer() {
    const drawer = document.getElementById("chat-inventory-drawer");
    if (drawer) {
      drawer.classList.remove("open");
      isInventoryDrawerOpen = false;
      exitInventoryManageMode();
    }
  }

  // 退出管理模式
  function exitInventoryManageMode() {
    isInventoryManageMode = false;
    selectedInventoryItemIds.clear();
    const manageBtn = document.getElementById("inventory-manage-btn");
    if (manageBtn) {
      manageBtn.textContent = "管理";
      manageBtn.classList.remove("danger");
    }
    renderInventoryList();
  }

  let currentGenTargetItem = null;
  let currentGenSaveCallback = null;

  // 物品头像长按更换与全屏查看工具（长按进入生图页面，点击展开大图）
  function setupItemAvatarModifier(avatarBoxEl, item, onSaveCallback) {
    if (!avatarBoxEl || !item) return;
    let pressTimer = null;
    let isLongPressed = false;

    const startPress = () => {
      isLongPressed = false;
      if (pressTimer) clearTimeout(pressTimer);
      pressTimer = setTimeout(() => {
        isLongPressed = true;
        pressTimer = null;
        openNovelAiGenModalForItem(item, onSaveCallback);
      }, 500);
    };

    const cancelPress = () => {
      if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
    };

    avatarBoxEl.addEventListener("mousedown", startPress);
    avatarBoxEl.addEventListener("touchstart", startPress, { passive: true });
    avatarBoxEl.addEventListener("mouseup", cancelPress);
    avatarBoxEl.addEventListener("mouseleave", cancelPress);
    avatarBoxEl.addEventListener("touchend", cancelPress);
    avatarBoxEl.addEventListener("touchcancel", cancelPress);

    avatarBoxEl.onclick = (e) => {
      e.stopPropagation();
      if (isLongPressed) return;
      if (item.avatar && typeof openFullImageModal === "function") {
        openFullImageModal(item.avatar);
      } else {
        openNovelAiGenModalForItem(item, onSaveCallback);
      }
    };
  }

  function openNovelAiGenModalForItem(item, onSaveCallback) {
    currentGenTargetItem = item;
    currentGenSaveCallback = onSaveCallback;
    const modal = document.getElementById("inventory-item-gen-modal");
    if (!modal) return;

    const promptInput = document.getElementById("inv-gen-prompt-input");
    const itemName = item?.name || "";
    const itemDesc = item?.desc || "";

    if (promptInput) {
      if (item?.prompt && item.prompt.trim()) {
        promptInput.value = item.prompt.trim();
      } else {
        promptInput.value = `${item?.category === "clue" ? "1clue" : "1item"}, ${itemName ? itemName : "item"}, ${itemDesc ? itemDesc : "fantasy artifact"}, masterpiece, best quality`;
      }
    }

    modal.classList.add("visible");
  }

  function triggerAvatarPicker(item, onSaveCallback) {
    let pickerInput = document.getElementById("inventory-avatar-picker-input");
    if (!pickerInput) {
      pickerInput = document.createElement("input");
      pickerInput.type = "file";
      pickerInput.id = "inventory-avatar-picker-input";
      pickerInput.accept = "image/*";
      pickerInput.style.display = "none";
      document.body.appendChild(pickerInput);
    }

    pickerInput.onchange = async () => {
      const file = pickerInput.files && pickerInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (event) => {
        const b64 = event.target.result;
        item.avatar = b64;
        if (typeof onSaveCallback === "function") {
          await onSaveCallback(item);
        }
        showClueToast("头像修改成功");
      };
      reader.readAsDataURL(file);
      pickerInput.value = "";
    };

    pickerInput.click();
  }

  // 渲染物品列表
  function renderInventoryList() {
    const listContainer = document.getElementById("chat-inventory-list");
    if (!listContainer) return;

    const inventory = getCurrentChatInventory();
    
    // 过滤分类
    let filtered = inventory.slice();
    if (currentInventoryTab !== "all") {
      filtered = filtered.filter(item => item.category === currentInventoryTab);
    }

    // 排序：星标置顶排在最前，其次按创建时间倒序
    filtered.sort((a, b) => {
      const aPinned = a.isPinned ? 1 : 0;
      const bPinned = b.isPinned ? 1 : 0;
      if (aPinned !== bPinned) {
        return bPinned - aPinned;
      }
      return (b.createdAt || 0) - (a.createdAt || 0);
    });

    listContainer.innerHTML = "";

    if (filtered.length === 0) {
      const emptyTip = document.createElement("div");
      emptyTip.className = "inventory-empty-tip";
      emptyTip.textContent = "暂无物品";
      listContainer.appendChild(emptyTip);
      return;
    }

    filtered.forEach(item => {
      const row = document.createElement("div");
      row.className = "inventory-item-row";
      row.dataset.id = item.id;

      // 左侧头像或占位图
      const avatarBox = document.createElement("div");
      avatarBox.className = "inventory-avatar-box";
      if (item.avatar) {
        const img = document.createElement("img");
        img.src = item.avatar;
        img.alt = item.name;
        avatarBox.appendChild(img);
      } else {
        avatarBox.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"/>
            <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>
            <path d="M8 21v-5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v5"/>
          </svg>
        `;
      }
      setupItemAvatarModifier(avatarBox, item, async () => {
        await saveCurrentChatInventory(inventory);
        renderInventoryList();
      });

      // 中间信息区域
      const infoBox = document.createElement("div");
      infoBox.className = "inventory-info-box";

      // 第一行：名称 + 分类角标 + 五角星置顶
      const titleLine = document.createElement("div");
      titleLine.className = "inventory-title-line";

      const nameSpan = document.createElement("span");
      nameSpan.className = "inventory-item-name";
      nameSpan.textContent = item.name;

      const badgeSpan = document.createElement("span");
      badgeSpan.className = `inventory-category-badge cat-${item.category}`;
      badgeSpan.textContent = item.category === "clue" ? "线索" : (item.category === "weapon" ? "武器" : "道具");

      const starBtn = document.createElement("button");
      starBtn.type = "button";
      starBtn.className = `inventory-star-btn ${item.isPinned ? "pinned" : ""}`;
      starBtn.title = item.isPinned ? "取消置顶" : "置顶";
      starBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="${item.isPinned ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      `;
      starBtn.onclick = async (e) => {
        e.stopPropagation();
        item.isPinned = !item.isPinned;
        await saveCurrentChatInventory(inventory);
        renderInventoryList();
      };

      titleLine.appendChild(nameSpan);
      titleLine.appendChild(badgeSpan);
      titleLine.appendChild(starBtn);

      // 第二行：简介及功能
      const descLine = document.createElement("div");
      descLine.className = "inventory-desc-line";
      let descText = item.desc || "暂无简介";
      if (item.category === "weapon" && (item.damageBonus || item.dbBonus)) {
        descText = `${item.damageBonus ? `伤害 ${item.damageBonus} ` : ""}${item.dbBonus ? `DB ${item.dbBonus} ` : ""}${item.desc ? `· ${item.desc}` : ""}`;
      }
      if (item.effect) {
        descText += ` · 功能 ${item.effect}`;
      }
      descLine.textContent = descText;

      infoBox.appendChild(titleLine);
      infoBox.appendChild(descLine);

      // 右侧操作区
      const actionBox = document.createElement("div");
      actionBox.className = "inventory-action-box";

      if (isInventoryManageMode) {
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "inventory-select-checkbox";
        checkbox.checked = selectedInventoryItemIds.has(item.id);
        checkbox.onclick = (e) => {
          e.stopPropagation();
          if (checkbox.checked) {
            selectedInventoryItemIds.add(item.id);
          } else {
            selectedInventoryItemIds.delete(item.id);
          }
          updateManageButtonText();
        };

        const editBtn = document.createElement("button");
        editBtn.type = "button";
        editBtn.className = "moe-btn inventory-item-btn";
        editBtn.textContent = "编辑";
        editBtn.onclick = (e) => {
          e.stopPropagation();
          openEditInventoryItemModal(item.id);
        };

        actionBox.appendChild(checkbox);
        actionBox.appendChild(editBtn);
      } else {
        if (item.category === "prop") {
          const useBtn = document.createElement("button");
          useBtn.type = "button";
          useBtn.className = "moe-btn inventory-item-btn";
          useBtn.textContent = "使用";
          useBtn.onclick = async (e) => {
            e.stopPropagation();
            await useInventoryProp(item);
          };
          actionBox.appendChild(useBtn);
        } else if (item.category === "clue") {
          const readBtn = document.createElement("button");
          readBtn.type = "button";
          readBtn.className = "moe-btn inventory-item-btn";
          readBtn.textContent = "阅读";
          readBtn.onclick = (e) => {
            e.stopPropagation();
            openClueReaderModal(item);
          };
          actionBox.appendChild(readBtn);
        } else if (item.category === "weapon") {
          const weaponTag = document.createElement("span");
          weaponTag.className = "inventory-weapon-stat-tag";
          weaponTag.textContent = item.damageBonus || "武器";
          actionBox.appendChild(weaponTag);
        }
      }

      row.appendChild(avatarBox);
      row.appendChild(infoBox);
      row.appendChild(actionBox);

      row.onclick = () => {
        if (isInventoryManageMode) {
          const cb = row.querySelector(".inventory-select-checkbox");
          if (cb) {
            cb.checked = !cb.checked;
            if (cb.checked) selectedInventoryItemIds.add(item.id);
            else selectedInventoryItemIds.delete(item.id);
            updateManageButtonText();
          }
        } else {
          openInventoryItemDetailModal(item);
        }
      };

      listContainer.appendChild(row);
    });
  }

  function updateManageButtonText() {
    const manageBtn = document.getElementById("inventory-manage-btn");
    if (!manageBtn) return;
    if (selectedInventoryItemIds.size > 0) {
      manageBtn.textContent = `删除 ${selectedInventoryItemIds.size}`;
      manageBtn.classList.add("danger");
    } else {
      manageBtn.textContent = "退出";
      manageBtn.classList.remove("danger");
    }
  }

  // 使用道具：发送物品卡片
  async function useInventoryProp(item) {
    if (typeof state === "undefined" || !state.activeChatId) return;
    const chat = state.chats[state.activeChatId];
    if (!chat) return;

    const myNickname = chat.isGroup ? (chat.settings?.myNickname || "我") : "我";

    const cardMsg = {
      role: "user",
      type: "inventory_card",
      actionType: "use",
      senderName: myNickname,
      item: {
        id: item.id,
        name: item.name,
        desc: item.desc || "",
        effect: item.effect || "",
        avatar: item.avatar || "",
        category: item.category,
      },
      content: `[使用了道具：${item.name}]`,
      timestamp: Date.now(),
    };
    if (!Array.isArray(chat.history)) chat.history = [];
    chat.history.push(cardMsg);

    const appendFn = window.appendMessage || (typeof appendMessage === "function" ? appendMessage : null);
    if (typeof appendFn === "function") {
      appendFn(cardMsg, chat);
    }

    // 构建提示词通知 AI
    let effectNotice = "";
    if (item.effect) {
      effectNotice = `，该道具附带功能效果：【${item.effect}】。请根据当前剧情合理性进行裁决：若同意其使用并生效，请在回复中包含指令：\n\`\`\`json\n{\n  "type": "apply_item_effect",\n  "target": "${myNickname}",\n  "effect": "${item.effect}",\n  "approved": true,\n  "reason": "生效原因说明"\n}\n\`\`\`\n若在当前剧情状态下不合理，可设置 approved: false。`;
    }

    const hiddenMsg = {
      role: "system",
      content: `[系统提示：用户 (${myNickname}) 使用了道具“${item.name}”${effectNotice}]`,
      timestamp: Date.now() + 1,
      isHidden: true,
    };
    chat.history.push(hiddenMsg);

    const dbInstance = typeof db !== "undefined" ? db : (window.database || null);
    if (dbInstance && dbInstance.chats) {
      await dbInstance.chats.put(chat);
    }

    if (typeof renderChatList === "function") {
      await renderChatList();
    }
  }

  // 打开物品详情 1x1 面板
  function openInventoryItemDetailModal(item) {
    activeDetailItem = item;
    const modal = document.getElementById("inventory-item-detail-modal");
    if (!modal) return;

    const avatarEl = document.getElementById("inv-detail-avatar");
    const nameEl = document.getElementById("inv-detail-name");
    const catEl = document.getElementById("inv-detail-cat");
    const descEl = document.getElementById("inv-detail-desc");
    const extraEl = document.getElementById("inv-detail-extra");
    const actionBtn = document.getElementById("inv-detail-action-btn");
    const transferBtn = document.getElementById("inv-detail-transfer-btn");

    if (avatarEl) {
      if (item.avatar) {
        avatarEl.innerHTML = `<img src="${item.avatar}" alt="${item.name}">`;
      } else {
        avatarEl.innerHTML = `
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"/>
            <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>
            <path d="M8 21v-5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v5"/>
          </svg>
        `;
      }
      setupItemAvatarModifier(avatarEl, item, async (updated) => {
        const inventory = getCurrentChatInventory();
        const found = inventory.find(i => i.id === updated.id);
        if (found) found.avatar = updated.avatar;
        await saveCurrentChatInventory(inventory);
        openInventoryItemDetailModal(updated);
        renderInventoryList();
      });
    }

    if (nameEl) nameEl.textContent = item.name;
    if (catEl) {
      catEl.className = `inventory-category-badge cat-${item.category}`;
      catEl.textContent = item.category === "clue" ? "线索" : (item.category === "weapon" ? "武器" : "道具");
    }
    if (descEl) descEl.textContent = item.desc || "暂无简介";

    if (extraEl) {
      extraEl.innerHTML = "";
      if (item.effect) {
        const effRow = document.createElement("div");
        effRow.className = "inventory-detail-stat-row";
        effRow.style.marginTop = "4px";
        effRow.innerHTML = `<span>功能：${item.effect}</span>`;
        extraEl.appendChild(effRow);
      }
      if (item.category === "weapon") {
        const wepRow = document.createElement("div");
        wepRow.className = "inventory-detail-stat-row";
        wepRow.style.marginTop = "4px";
        wepRow.innerHTML = `
          <span>伤害加值: ${item.damageBonus || "无"}</span>
          <span>DB: ${item.dbBonus || "0"}</span>
        `;
        extraEl.appendChild(wepRow);
      } else if (item.source) {
        const srcRow = document.createElement("div");
        srcRow.className = "inventory-detail-source";
        srcRow.style.marginTop = "4px";
        srcRow.textContent = `来源: ${item.source}`;
        extraEl.appendChild(srcRow);
      }
    }

    if (actionBtn) {
      if (item.category === "prop") {
        actionBtn.style.display = "inline-flex";
        actionBtn.textContent = "使用";
        actionBtn.onclick = async () => {
          modal.classList.remove("visible");
          await useInventoryProp(item);
        };
      } else if (item.category === "clue") {
        actionBtn.style.display = "inline-flex";
        actionBtn.textContent = "阅读";
        actionBtn.onclick = () => {
          modal.classList.remove("visible");
          openClueReaderModal(item);
        };
      } else {
        actionBtn.style.display = "none";
      }
    }

    if (transferBtn) {
      transferBtn.onclick = () => {
        modal.classList.remove("visible");
        openTransferItemModal(item);
      };
    }

    modal.classList.add("visible");
  }

  // 移交道具弹窗
  function openTransferItemModal(item) {
    if (!item || typeof state === "undefined" || !state.activeChatId) return;
    const chat = state.chats[state.activeChatId];
    if (!chat) return;

    const modal = document.getElementById("inventory-transfer-modal");
    const listEl = document.getElementById("inventory-transfer-recipient-list");
    if (!modal || !listEl) return;

    listEl.innerHTML = "";

    const recipients = [];
    if (chat.isGroup && Array.isArray(chat.members)) {
      chat.members.forEach(m => {
        if (m.id === "user") return;
        if (m.isDiceBot || m.roleType === "system_status" || m.roleType === "dice" || m.isSystemStatus || m.isDice || m.isSystem || m.role === "system_status") return;
        recipients.push({
          id: m.id,
          name: m.groupNickname || m.originalName || m.name,
          avatar: m.avatar || "",
          type: "member",
          raw: m,
        });
      });
    } else {
      if (chat.roleType !== "system_status" && chat.roleType !== "dice" && !chat.isDiceBot) {
        recipients.push({
          id: "ai",
          name: chat.settings?.aiName || chat.name || "对方",
          avatar: chat.settings?.aiAvatar || chat.avatar || "",
          type: "ai",
          raw: chat,
        });
      }
    }

    if (recipients.length === 0) {
      listEl.innerHTML = `<div style="text-align: center; color: var(--text-secondary); padding: 10px; font-size: 12px;">暂无可选移交对象</div>`;
    } else {
      recipients.forEach((rcp, idx) => {
        const itemRow = document.createElement("label");
        itemRow.className = "inventory-transfer-item-label";
        itemRow.innerHTML = `
          <input type="radio" name="inventory-transfer-target" value="${rcp.id}" ${idx === 0 ? "checked" : ""}>
          <img src="${rcp.avatar || 'https://i.postimg.cc/PxZrFFFL/o-o-1.jpg'}" class="inventory-transfer-avatar">
          <span style="font-size: 13px; color: var(--text-primary); font-weight: 500;">${rcp.name}</span>
        `;
        listEl.appendChild(itemRow);
      });
    }

    const confirmBtn = document.getElementById("inventory-transfer-confirm-btn");
    if (confirmBtn) {
      confirmBtn.onclick = async () => {
        const selectedRadio = listEl.querySelector('input[name="inventory-transfer-target"]:checked');
        if (!selectedRadio) {
          alert("请选择接收对象");
          return;
        }
        const targetId = selectedRadio.value;
        const selectedRcp = recipients.find(r => String(r.id) === String(targetId));
        if (!selectedRcp) return;

        modal.classList.remove("visible");
        await executeTransferItem(item, selectedRcp);
      };
    }

    const cancelBtn = document.getElementById("inventory-transfer-cancel-btn");
    if (cancelBtn) {
      cancelBtn.onclick = () => modal.classList.remove("visible");
    }

    modal.classList.add("visible");
  }

  // 执行移交道具
  async function executeTransferItem(item, recipient) {
    if (typeof state === "undefined" || !state.activeChatId) return;
    const chat = state.chats[state.activeChatId];
    if (!chat) return;

    const myNickname = chat.isGroup ? (chat.settings?.myNickname || "我") : "我";

    if (Array.isArray(chat.inventory)) {
      chat.inventory = chat.inventory.filter(it => it.id !== item.id);
    }

    const transferredItem = {
      ...item,
      id: "inv_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6),
      source: `来自 ${myNickname} 的移交`,
      createdAt: Date.now(),
    };

    if (recipient.type === "member") {
      let targetMem = null;
      if (Array.isArray(chat.members)) {
        targetMem = chat.members.find(m => String(m.id) === String(recipient.id));
      }
      if (!targetMem && recipient.raw) targetMem = recipient.raw;
      if (targetMem) {
        if (!Array.isArray(targetMem.inventory)) targetMem.inventory = [];
        targetMem.inventory.push(transferredItem);
      }
    } else {
      if (!Array.isArray(chat.aiInventory)) chat.aiInventory = [];
      chat.aiInventory.push(transferredItem);
    }

    const cardMsg = {
      role: "user",
      type: "inventory_card",
      actionType: "transfer",
      senderName: myNickname,
      targetName: recipient.name,
      item: transferredItem,
      content: `[${myNickname} 移交了道具“${item.name}”给 ${recipient.name}]`,
      timestamp: Date.now(),
    };

    if (!Array.isArray(chat.history)) chat.history = [];
    chat.history.push(cardMsg);

    const appendFn = window.appendMessage || (typeof appendMessage === "function" ? appendMessage : null);
    if (typeof appendFn === "function") {
      appendFn(cardMsg, chat);
    }

    const hiddenMsg = {
      role: "system",
      content: `[系统提示：玩家 ${myNickname} 将物品“${item.name}”移交给了 ${recipient.name}。现在该物品归 ${recipient.name} 所有。]`,
      timestamp: Date.now() + 1,
      isHidden: true,
    };
    chat.history.push(hiddenMsg);

    const dbInstance = typeof db !== "undefined" ? db : (window.database || null);
    if (dbInstance && dbInstance.chats) {
      await dbInstance.chats.put(chat);
    }

    renderInventoryList();
  }

  // 打开全局道具库
  function openGlobalInventoryModal() {
    const modal = document.getElementById("inventory-global-library-modal");
    if (!modal) return;
    isGlobalLibraryManageMode = false;
    const manageBtn = document.getElementById("global-inv-manage-btn");
    if (manageBtn) {
      manageBtn.textContent = "管理";
      manageBtn.classList.remove("danger");
    }
    renderGlobalInventoryList();
    modal.classList.add("visible");
  }

  // 渲染全局道具库列表
  function renderGlobalInventoryList() {
    const bodyEl = document.getElementById("global-inventory-body");
    if (!bodyEl || typeof state === "undefined" || !state.chats) return;

    bodyEl.innerHTML = "";

    const allChats = Object.values(state.chats);
    if (allChats.length === 0) {
      bodyEl.innerHTML = `<div style="text-align: center; color: var(--text-secondary); padding: 20px; font-size: 12px;">暂无任何聊天数据</div>`;
      return;
    }

    let groupChats = allChats.filter(c => c.isGroup);
    let directChats = allChats.filter(c => !c.isGroup && c.roleType !== "system_status" && c.roleType !== "dice" && !c.isDiceBot);

    if (currentGlobalInventoryTab === "group") {
      directChats = [];
    } else if (currentGlobalInventoryTab === "direct") {
      groupChats = [];
    }

    if (groupChats.length === 0 && directChats.length === 0) {
      bodyEl.innerHTML = `<div style="text-align: center; color: var(--text-secondary); padding: 20px; font-size: 12px;">暂无对应道具数据</div>`;
      return;
    }

    // 全局去重集合：名称与简介完全一致的物品只展示最上方首次出现的那一件
    const seenItemKeys = new Set();

    if (groupChats.length > 0) {
      if (currentGlobalInventoryTab === "all") {
        const catHeader = document.createElement("div");
        catHeader.style.cssText = "font-size: 12px; font-weight: 600; color: var(--text-secondary); padding: 6px 2px 4px 2px; margin-top: 2px;";
        catHeader.textContent = "群聊";
        bodyEl.appendChild(catHeader);
      }
      groupChats.forEach(chatItem => renderChatInventoryGroup(chatItem, bodyEl, seenItemKeys));
    }

    if (directChats.length > 0) {
      if (currentGlobalInventoryTab === "all") {
        const catHeader = document.createElement("div");
        catHeader.style.cssText = "font-size: 12px; font-weight: 600; color: var(--text-secondary); padding: 10px 2px 4px 2px;";
        catHeader.textContent = "私聊";
        bodyEl.appendChild(catHeader);
      }
      directChats.forEach(chatItem => renderChatInventoryGroup(chatItem, bodyEl, seenItemKeys));
    }
  }

  function renderChatInventoryGroup(chatItem, bodyEl, seenItemKeys = new Set()) {
    const chatGroupWrapper = document.createElement("div");
    chatGroupWrapper.className = "global-inv-chat-group";

    const chatHeader = document.createElement("div");
    chatHeader.className = "global-inv-chat-header";
    chatHeader.innerHTML = `
      <div style="display: flex; align-items: center; gap: 6px;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="global-inv-toggle-icon">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
        <span style="font-weight: 600; font-size: 13px; color: var(--text-primary);">${chatItem.name || (chatItem.isGroup ? "未命名群聊" : "未命名私聊")}</span>
        <span style="font-size: 11px; color: var(--text-secondary);">${chatItem.isGroup ? "群聊" : "私聊"}</span>
      </div>
    `;

    const chatContent = document.createElement("div");
    chatContent.className = "global-inv-chat-content";

    let totalGroupUniqueCount = 0;

    // 1. 我的道具
    const myItems = Array.isArray(chatItem.inventory) ? chatItem.inventory : [];
    const uniqueMyItems = myItems.filter(item => {
      if (!item) return false;
      const key = `${String(item.name || "").trim()}:::${String(item.desc || "").trim()}`;
      if (seenItemKeys.has(key)) return false;
      seenItemKeys.add(key);
      return true;
    });
    totalGroupUniqueCount += uniqueMyItems.length;

    if (uniqueMyItems.length > 0) {
      const mySec = document.createElement("div");
      mySec.className = "global-inv-sub-sec";
      mySec.innerHTML = `<div class="global-inv-sub-title">我的道具 ${uniqueMyItems.length}</div>`;
      const myList = document.createElement("div");
      myList.className = "global-inv-item-list";
      uniqueMyItems.forEach(item => {
        myList.appendChild(createGlobalItemRow(item, chatItem, "user"));
      });
      mySec.appendChild(myList);
      chatContent.appendChild(mySec);
    }

    // 2. 成员道具或AI道具
    if (chatItem.isGroup && Array.isArray(chatItem.members)) {
      chatItem.members.forEach(member => {
        if (member.id === "user" || member.isDiceBot || member.roleType === "system_status" || member.roleType === "dice" || member.isDice) return;
        const mItems = Array.isArray(member.inventory) ? member.inventory : [];
        const uniqueMemberItems = mItems.filter(item => {
          if (!item) return false;
          const key = `${String(item.name || "").trim()}:::${String(item.desc || "").trim()}`;
          if (seenItemKeys.has(key)) return false;
          seenItemKeys.add(key);
          return true;
        });
        totalGroupUniqueCount += uniqueMemberItems.length;

        if (uniqueMemberItems.length > 0) {
          const mSec = document.createElement("div");
          mSec.className = "global-inv-sub-sec";
          const mName = member.groupNickname || member.originalName || member.name;
          mSec.innerHTML = `<div class="global-inv-sub-title">${mName} 的道具 ${uniqueMemberItems.length}</div>`;
          const mList = document.createElement("div");
          mList.className = "global-inv-item-list";
          uniqueMemberItems.forEach(item => {
            mList.appendChild(createGlobalItemRow(item, chatItem, "member", member));
          });
          mSec.appendChild(mList);
          chatContent.appendChild(mSec);
        }
      });
    } else if (!chatItem.isGroup) {
      const aiItems = Array.isArray(chatItem.aiInventory) ? chatItem.aiInventory : [];
      const uniqueAiItems = aiItems.filter(item => {
        if (!item) return false;
        const key = `${String(item.name || "").trim()}:::${String(item.desc || "").trim()}`;
        if (seenItemKeys.has(key)) return false;
        seenItemKeys.add(key);
        return true;
      });
      totalGroupUniqueCount += uniqueAiItems.length;

      if (uniqueAiItems.length > 0) {
        const aiSec = document.createElement("div");
        aiSec.className = "global-inv-sub-sec";
        const aiName = chatItem.settings?.aiName || chatItem.name || "对方";
        aiSec.innerHTML = `<div class="global-inv-sub-title">${aiName} 的道具 ${uniqueAiItems.length}</div>`;
        const aiList = document.createElement("div");
        aiList.className = "global-inv-item-list";
        uniqueAiItems.forEach(item => {
          aiList.appendChild(createGlobalItemRow(item, chatItem, "ai"));
        });
        aiSec.appendChild(aiList);
        chatContent.appendChild(aiSec);
      }
    }

    if (totalGroupUniqueCount === 0) {
      return;
    }

    chatHeader.onclick = () => {
      chatGroupWrapper.classList.toggle("collapsed");
    };

    chatGroupWrapper.appendChild(chatHeader);
    chatGroupWrapper.appendChild(chatContent);
    bodyEl.appendChild(chatGroupWrapper);
  }

  function createGlobalItemRow(item, chatItem, ownerType, memberObj = null) {
    const row = document.createElement("div");
    row.className = "global-inv-item-row";

    const avatarBox = document.createElement("div");
    avatarBox.className = "inventory-avatar-box";
    if (item.avatar) {
      avatarBox.innerHTML = `<img src="${item.avatar}" alt="${item.name}">`;
    } else {
      avatarBox.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"/>
        </svg>
      `;
    }
    setupItemAvatarModifier(avatarBox, item, async (updated) => {
      const dbInstance = typeof db !== "undefined" ? db : (window.database || null);
      if (dbInstance && dbInstance.chats) await dbInstance.chats.put(chatItem);
      renderGlobalInventoryList();
    });

    const infoBox = document.createElement("div");
    infoBox.className = "global-inv-info-box";
    let descLine = item.desc || "无简介";
    if (item.effect) descLine += ` · 功能 ${item.effect}`;

    infoBox.innerHTML = `
      <div style="display: flex; align-items: center; gap: 6px;">
        <span style="font-weight: 600; font-size: 12px; color: var(--text-primary);">${item.name}</span>
        <span class="inventory-category-badge cat-${item.category}">${item.category === "clue" ? "线索" : (item.category === "weapon" ? "武器" : "道具")}</span>
      </div>
      <div style="font-size: 11px; color: var(--text-secondary); text-overflow: ellipsis; white-space: nowrap; overflow: hidden;">${descLine}</div>
    `;

    const actionBox = document.createElement("div");
    actionBox.className = "global-inv-action-box";

    if (isGlobalLibraryManageMode) {
      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "moe-btn-mini";
      delBtn.style.cssText = "font-size: 11px; padding: 2px 6px; background: var(--secondary-bg); color: var(--text-primary); border-radius: 4px; border: 1px solid var(--border-color);";
      delBtn.textContent = "删除";
      delBtn.onclick = async (e) => {
        e.stopPropagation();
        if (ownerType === "user" && Array.isArray(chatItem.inventory)) {
          chatItem.inventory = chatItem.inventory.filter(i => i.id !== item.id);
        } else if (ownerType === "member" && memberObj && Array.isArray(memberObj.inventory)) {
          memberObj.inventory = memberObj.inventory.filter(i => i.id !== item.id);
        } else if (ownerType === "ai" && Array.isArray(chatItem.aiInventory)) {
          chatItem.aiInventory = chatItem.aiInventory.filter(i => i.id !== item.id);
        }
        const dbInstance = typeof db !== "undefined" ? db : (window.database || null);
        if (dbInstance && dbInstance.chats) await dbInstance.chats.put(chatItem);
        renderGlobalInventoryList();
        renderInventoryList();
      };
      actionBox.appendChild(delBtn);
    } else {
      const depositBtn = document.createElement("button");
      depositBtn.type = "button";
      depositBtn.className = "module-btn-primary";
      depositBtn.style.cssText = "font-size: 11px; height: 26px; padding: 0 10px; border-radius: 6px;";
      depositBtn.textContent = "存入";
      depositBtn.onclick = async (e) => {
        e.stopPropagation();
        const curInventory = getCurrentChatInventory();
        const clonedItem = {
          ...item,
          id: "inv_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6),
          source: `来自【${chatItem.name}】存入`,
          createdAt: Date.now(),
        };
        curInventory.push(clonedItem);
        await saveCurrentChatInventory(curInventory);
        renderInventoryList();
        depositBtn.textContent = "已存入";
        depositBtn.disabled = true;
        depositBtn.style.background = "var(--border-color)";
        depositBtn.style.color = "var(--text-secondary)";
      };
      actionBox.appendChild(depositBtn);
    }

    row.appendChild(avatarBox);
    row.appendChild(infoBox);
    row.appendChild(actionBox);
    return row;
  }

  // 存入全部全局道具到当前物品栏
  async function depositAllGlobalItemsToCurrentChat() {
    if (typeof state === "undefined" || !state.chats || !state.activeChatId) return;
    const curInventory = getCurrentChatInventory();
    let count = 0;

    Object.values(state.chats).forEach(c => {
      if (Array.isArray(c.inventory)) {
        c.inventory.forEach(it => {
          curInventory.push({
            ...it,
            id: "inv_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6) + "_" + (++count),
            source: `全局存入`,
            createdAt: Date.now(),
          });
        });
      }
      if (c.isGroup && Array.isArray(c.members)) {
        c.members.forEach(m => {
          if (m.id === "user" || m.isDiceBot || m.roleType === "system_status") return;
          if (Array.isArray(m.inventory)) {
            m.inventory.forEach(it => {
              curInventory.push({
                ...it,
                id: "inv_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6) + "_" + (++count),
                source: `全局存入`,
                createdAt: Date.now(),
              });
            });
          }
        });
      } else if (!c.isGroup && Array.isArray(c.aiInventory)) {
        c.aiInventory.forEach(it => {
          curInventory.push({
            ...it,
            id: "inv_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6) + "_" + (++count),
            source: `全局存入`,
            createdAt: Date.now(),
          });
        });
      }
    });

    await saveCurrentChatInventory(curInventory);
    renderInventoryList();
    const modal = document.getElementById("inventory-global-library-modal");
    if (modal) modal.classList.remove("visible");
  }

  // 打开AI群友/角色专属道具库
  function openCharacterInventoryModal(type, memberId = null) {
    if (typeof state === "undefined" || !state.activeChatId) return;
    const chat = state.chats[state.activeChatId];
    if (!chat) return;

    let targetName = "角色";
    let targetInventory = [];

    if (type === "member" && chat.isGroup && Array.isArray(chat.members)) {
      const member = chat.members.find(m => String(m.id) === String(memberId || window.editingMemberId));
      if (member) {
        if (member.isDiceBot || member.roleType === "system_status" || member.roleType === "dice" || member.isDice) return;
        editingTargetChar = { type: "member", id: member.id, name: member.groupNickname || member.originalName };
        targetName = member.groupNickname || member.originalName;
        if (!Array.isArray(member.inventory)) member.inventory = [];
        targetInventory = member.inventory;
      }
    } else {
      if (chat.roleType === "system_status" || chat.roleType === "dice" || chat.isDiceBot) return;
      editingTargetChar = { type: "ai", id: "ai", name: chat.settings?.aiName || chat.name || "对方" };
      targetName = chat.settings?.aiName || chat.name || "对方";
      if (!Array.isArray(chat.aiInventory)) chat.aiInventory = [];
      targetInventory = chat.aiInventory;
    }

    currentCharacterInventoryTab = "all";
    const modal = document.getElementById("character-inventory-modal");
    const titleEl = document.getElementById("char-inv-modal-title");
    if (titleEl) titleEl.textContent = `${targetName} 的道具`;

    if (modal) {
      const tabs = modal.querySelectorAll(".inventory-tab");
      tabs.forEach(t => {
        if (t.dataset.cat === "all") t.classList.add("active");
        else t.classList.remove("active");
      });
    }

    renderCharacterInventoryList(targetInventory);

    if (modal) modal.classList.add("visible");
  }

  function renderCharacterInventoryList(inventory) {
    const listEl = document.getElementById("character-inventory-list");
    if (!listEl) return;

    listEl.innerHTML = "";
    const fullList = Array.isArray(inventory) ? inventory : [];

    let filtered = fullList.slice();
    if (currentCharacterInventoryTab !== "all") {
      filtered = filtered.filter(item => item.category === currentCharacterInventoryTab);
    }

    filtered.sort((a, b) => {
      const aPinned = a.isPinned ? 1 : 0;
      const bPinned = b.isPinned ? 1 : 0;
      if (aPinned !== bPinned) return bPinned - aPinned;
      return (b.createdAt || 0) - (a.createdAt || 0);
    });

    if (filtered.length === 0) {
      listEl.innerHTML = `<div style="text-align: center; color: var(--text-secondary); padding: 20px; font-size: 12px;">暂无对应物品</div>`;
      return;
    }

    filtered.forEach((item) => {
      const row = document.createElement("div");
      row.className = "inventory-item-row";
      row.dataset.id = item.id;

      const avatarBox = document.createElement("div");
      avatarBox.className = "inventory-avatar-box";
      if (item.avatar) {
        avatarBox.innerHTML = `<img src="${item.avatar}" alt="${item.name}">`;
      } else {
        avatarBox.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"/>
          </svg>
        `;
      }
      setupItemAvatarModifier(avatarBox, item, async (updated) => {
        const chat = state.chats[state.activeChatId];
        const dbInstance = typeof db !== "undefined" ? db : (window.database || null);
        if (chat && dbInstance && dbInstance.chats) await dbInstance.chats.put(chat);
        renderCharacterInventoryList(getEditingTargetInventory());
      });

      const infoBox = document.createElement("div");
      infoBox.className = "inventory-info-box";
      let descLine = item.desc || "无简介";
      if (item.category === "weapon") {
        descLine = `${item.damageBonus ? `伤害加值 ${item.damageBonus} ` : ""}${item.dbBonus ? `DB ${item.dbBonus} ` : ""}${item.desc ? `· ${item.desc}` : ""}`;
      } else if (item.effect) {
        descLine += ` · 功能 ${item.effect}`;
      }

      infoBox.innerHTML = `
        <div class="inventory-title-line">
          <span class="inventory-item-name">${item.name}</span>
          <span class="inventory-category-badge cat-${item.category}">${item.category === "clue" ? "线索" : (item.category === "weapon" ? "武器" : "道具")}</span>
        </div>
        <div class="inventory-desc-line">${descLine}</div>
      `;

      const actionBox = document.createElement("div");
      actionBox.className = "inventory-action-box";

      if (item.category === "clue") {
        const readBtn = document.createElement("button");
        readBtn.type = "button";
        readBtn.className = "moe-btn inventory-item-btn";
        readBtn.textContent = "阅读";
        readBtn.onclick = (e) => {
          e.stopPropagation();
          openClueReaderModal(item);
        };
        actionBox.appendChild(readBtn);
      } else if (item.category === "weapon") {
        const weaponTag = document.createElement("span");
        weaponTag.className = "inventory-weapon-stat-tag";
        weaponTag.textContent = item.damageBonus || "武器";
        actionBox.appendChild(weaponTag);
      }

      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "moe-btn inventory-item-btn";
      delBtn.style.background = "var(--secondary-bg)";
      delBtn.style.color = "var(--text-secondary)";
      delBtn.textContent = "删除";
      delBtn.onclick = async (e) => {
        e.stopPropagation();
        const chat = state.chats[state.activeChatId];
        if (!chat) return;
        const curTargetInv = getEditingTargetInventory();
        const idxInFull = curTargetInv.findIndex(it => it.id === item.id);
        if (idxInFull !== -1) {
          curTargetInv.splice(idxInFull, 1);
        }
        const dbInstance = typeof db !== "undefined" ? db : (window.database || null);
        if (dbInstance && dbInstance.chats) await dbInstance.chats.put(chat);
        renderCharacterInventoryList(curTargetInv);
      };

      actionBox.appendChild(delBtn);
      row.appendChild(avatarBox);
      row.appendChild(infoBox);
      row.appendChild(actionBox);

      row.onclick = () => {
        if (item.category === "clue") {
          openClueReaderModal(item);
        } else {
          openInventoryItemDetailModal(item);
        }
      };

      listEl.appendChild(row);
    });
  }

  // 打开添加/编辑物品表单
  function openEditInventoryItemModal(itemId = null) {
    editingInventoryItemId = itemId;
    pendingAvatarBase64 = "";

    const modal = document.getElementById("inventory-item-edit-modal");
    if (!modal) return;

    const titleEl = document.getElementById("inv-edit-title");
    const nameInput = document.getElementById("inv-edit-name");
    const descInput = document.getElementById("inv-edit-desc");
    const effectInput = document.getElementById("inv-edit-effect");
    const catSelect = document.getElementById("inv-edit-cat");
    const damageInput = document.getElementById("inv-edit-damage");
    const dbInput = document.getElementById("inv-edit-db");
    const contentTextarea = document.getElementById("inv-edit-content");
    const avatarPreview = document.getElementById("inv-edit-avatar-preview");

    const effectGroup = document.getElementById("inv-effect-group");
    const weaponGroup = document.getElementById("inv-weapon-fields");
    const clueGroup = document.getElementById("inv-clue-fields");

    function updateCategoryFields() {
      const cat = catSelect ? catSelect.value : "prop";
      if (effectGroup) effectGroup.style.display = (cat === "prop") ? "block" : "none";
      if (weaponGroup) weaponGroup.style.display = (cat === "weapon") ? "block" : "none";
      if (clueGroup) clueGroup.style.display = (cat === "clue") ? "block" : "none";
    }

    if (catSelect) {
      catSelect.onchange = updateCategoryFields;
    }

    if (itemId) {
      let item = null;
      if (editingTargetChar) {
        const curTargetInv = getEditingTargetInventory();
        item = curTargetInv.find(it => it.id === itemId);
      } else {
        const inventory = getCurrentChatInventory();
        item = inventory.find(it => it.id === itemId);
      }

      if (!item) return;

      if (titleEl) titleEl.textContent = "编辑物品";
      if (nameInput) nameInput.value = item.name || "";
      if (descInput) descInput.value = item.desc || "";
      if (effectInput) effectInput.value = item.effect || "";
      if (catSelect) catSelect.value = item.category || "prop";
      if (damageInput) damageInput.value = item.damageBonus || "";
      if (dbInput) dbInput.value = item.dbBonus || "";
      if (contentTextarea) contentTextarea.value = item.content || "";
      pendingAvatarBase64 = item.avatar || "";
    } else {
      if (titleEl) titleEl.textContent = "添加物品";
      if (nameInput) nameInput.value = "";
      if (descInput) descInput.value = "";
      if (effectInput) effectInput.value = "";
      if (catSelect) catSelect.value = "prop";
      if (damageInput) damageInput.value = "";
      if (dbInput) dbInput.value = "";
      if (contentTextarea) contentTextarea.value = "";
      pendingAvatarBase64 = "";
    }

    updateAvatarPreviewElement(avatarPreview, pendingAvatarBase64);
    updateCategoryFields();

    const deleteBtn = document.getElementById("inv-edit-delete-btn");
    if (deleteBtn) {
      if (itemId) {
        deleteBtn.style.display = "block";
        deleteBtn.onclick = async () => {
          const chat = state.chats[state.activeChatId];
          if (!chat) return;
          if (editingTargetChar) {
            const curTargetInv = getEditingTargetInventory();
            const rem = curTargetInv.filter(it => it.id !== itemId);
            if (editingTargetChar.type === "member") {
              const mem = (chat.members || []).find(m => String(m.id) === String(editingTargetChar.id));
              if (mem) mem.inventory = rem;
            } else {
              chat.aiInventory = rem;
            }
          } else {
            const inventory = getCurrentChatInventory();
            const remaining = inventory.filter(it => it.id !== itemId);
            await saveCurrentChatInventory(remaining);
          }
          const dbInstance = typeof db !== "undefined" ? db : (window.database || null);
          if (dbInstance && dbInstance.chats) await dbInstance.chats.put(chat);

          if (editingTargetChar) {
            renderCharacterInventoryList(getEditingTargetInventory());
          } else {
            renderInventoryList();
          }
          modal.classList.remove("visible");
        };
      } else {
        deleteBtn.style.display = "none";
      }
    }

    modal.classList.add("visible");
  }

  function updateAvatarPreviewElement(element, avatarData) {
    if (!element) return;
    if (avatarData) {
      element.innerHTML = `<img src="${avatarData}" alt="Avatar">`;
    } else {
      avatarBoxSvg(element);
    }
  }

  function avatarBoxSvg(element) {
    element.innerHTML = `
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"/>
        <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>
        <path d="M8 21v-5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v5"/>
      </svg>
    `;
  }

  // 保存物品表单
  async function saveInventoryItemFromModal() {
    const nameInput = document.getElementById("inv-edit-name");
    const descInput = document.getElementById("inv-edit-desc");
    const effectInput = document.getElementById("inv-edit-effect");
    const catSelect = document.getElementById("inv-edit-cat");
    const damageInput = document.getElementById("inv-edit-damage");
    const dbInput = document.getElementById("inv-edit-db");
    const contentTextarea = document.getElementById("inv-edit-content");

    const name = nameInput ? nameInput.value.trim() : "";
    if (!name) {
      alert("请输入物品名称");
      return;
    }

    const desc = descInput ? descInput.value.trim() : "";
    const category = catSelect ? catSelect.value : "prop";
    const effect = category === "prop" ? (effectInput ? effectInput.value.trim() : "") : "";
    const damageBonus = category === "weapon" ? (damageInput ? damageInput.value.trim() : "") : "";
    const dbBonus = category === "weapon" ? (dbInput ? dbInput.value.trim() : "") : "";
    const content = category === "clue" ? (contentTextarea ? contentTextarea.value.trim() : "") : "";

    const chat = state.chats[state.activeChatId];
    let targetInventory = getCurrentChatInventory();

    if (editingTargetChar) {
      targetInventory = getEditingTargetInventory();
    }

    if (editingInventoryItemId) {
      const item = targetInventory.find(it => it.id === editingInventoryItemId);
      if (item) {
        item.name = name;
        item.desc = desc;
        item.effect = effect;
        item.category = category;
        item.avatar = pendingAvatarBase64;
        item.damageBonus = damageBonus;
        item.dbBonus = dbBonus;
        item.content = content;
      }
    } else {
      const newItem = {
        id: "inv_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6),
        name: name,
        desc: desc,
        effect: effect,
        category: category,
        avatar: pendingAvatarBase64,
        content: content,
        damageBonus: damageBonus,
        dbBonus: dbBonus,
        isPinned: false,
        source: "自制",
        createdAt: Date.now(),
      };
      targetInventory.push(newItem);
    }

    const dbInstance = typeof db !== "undefined" ? db : (window.database || null);
    if (dbInstance && dbInstance.chats) {
      await dbInstance.chats.put(chat);
    }

    if (editingTargetChar) {
      renderCharacterInventoryList(getEditingTargetInventory());
    } else {
      renderInventoryList();
    }

    const modal = document.getElementById("inventory-item-edit-modal");
    if (modal) modal.classList.remove("visible");
  }

  // 线索悬浮提示反馈组件
  function showClueToast(text) {
    let toast = document.getElementById("inventory-clue-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "inventory-clue-toast";
      toast.style.cssText = "position: fixed; top: 24px; left: 50%; transform: translateX(-50%); background: rgba(0, 0, 0, 0.78); color: #FFFFFF; font-size: 12px; font-weight: 600; padding: 6px 14px; border-radius: 20px; z-index: 999999; pointer-events: none; opacity: 0; transition: opacity 0.2s ease, transform 0.2s ease; box-shadow: 0 4px 12px rgba(0,0,0,0.25); text-align: center; white-space: nowrap;";
      document.body.appendChild(toast);
    }
    toast.textContent = text;
    toast.style.opacity = "1";
    toast.style.transform = "translateX(-50%) translateY(0)";
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(-50%) translateY(-8px)";
    }, 2000);
  }

  let clueInnerZoom = 1.0;
  let clueInnerPanX = 0;
  let clueInnerPanY = 0;
  let clueCardInitialized = false;
  let currentReadingClueItem = null;

  function updateClueInnerTransform(isInstant = true) {
    const bodyEl = document.getElementById("clue-reader-body");
    const viewBox = document.getElementById("clue-reader-view-box");
    if (!bodyEl) return;
    const targetEl = document.getElementById("clue-proportional-wrapper") || bodyEl.firstElementChild || bodyEl;
    if (targetEl) {
      targetEl.style.transformOrigin = "top center";
      targetEl.style.willChange = "transform";
      targetEl.style.transition = isInstant ? "none" : "transform 0.15s cubic-bezier(0.25, 1, 0.5, 1)";
      targetEl.style.transform = `translate3d(${clueInnerPanX}px, ${clueInnerPanY}px, 0px) scale(${clueInnerZoom})`;
      if (viewBox && targetEl.offsetHeight > 0) {
        viewBox.style.height = `${Math.ceil(targetEl.offsetHeight * clueInnerZoom)}px`;
      }
    }
  }

  function initClueFloatingCardControls(card) {
    const dragHandle = document.getElementById("clue-reader-drag-handle");
    const resizeHandle = document.getElementById("clue-reader-resize-handle");
    const viewBox = document.getElementById("clue-reader-view-box");
    if (!card || !dragHandle) return;

    let isCardDragging = false;
    let dragStartX = 0, dragStartY = 0;
    let cardStartLeft = 0, cardStartTop = 0;

    const onCardDragStart = (e) => {
      if (e.target.closest("button") || e.target.closest(".chat-mini-map-resize-handle-br")) return;
      isCardDragging = true;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      dragStartX = clientX;
      dragStartY = clientY;
      const rect = card.getBoundingClientRect();
      cardStartLeft = rect.left;
      cardStartTop = rect.top;
      card.style.transform = "none";
      card.style.left = cardStartLeft + "px";
      card.style.top = cardStartTop + "px";
      document.addEventListener("mousemove", onCardDragMove);
      document.addEventListener("mouseup", onCardDragEnd);
      document.addEventListener("touchmove", onCardDragMove, { passive: false });
      document.addEventListener("touchend", onCardDragEnd);
    };

    const onCardDragMove = (e) => {
      if (!isCardDragging) return;
      if (e.cancelable) e.preventDefault();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const dx = clientX - dragStartX;
      const dy = clientY - dragStartY;
      const maxLeft = window.innerWidth - card.offsetWidth - 10;
      const maxTop = window.innerHeight - card.offsetHeight - 10;
      const newLeft = Math.max(10, Math.min(maxLeft, cardStartLeft + dx));
      const newTop = Math.max(10, Math.min(maxTop, cardStartTop + dy));
      card.style.left = newLeft + "px";
      card.style.top = newTop + "px";
    };

    const onCardDragEnd = () => {
      isCardDragging = false;
      document.removeEventListener("mousemove", onCardDragMove);
      document.removeEventListener("mouseup", onCardDragEnd);
      document.removeEventListener("touchmove", onCardDragMove);
      document.removeEventListener("touchend", onCardDragEnd);
    };

    dragHandle.addEventListener("mousedown", onCardDragStart);
    dragHandle.addEventListener("touchstart", onCardDragStart, { passive: false });

    if (resizeHandle) {
      let isResizing = false;
      let resizeStartX = 0, initialWidth = 330;

      const onResizeStart = (e) => {
        isResizing = true;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        resizeStartX = clientX;
        const rect = card.getBoundingClientRect();
        initialWidth = rect.width;
        document.addEventListener("mousemove", onResizeMove);
        document.addEventListener("mouseup", onResizeEnd);
        document.addEventListener("touchmove", onResizeMove, { passive: false });
        document.addEventListener("touchend", onResizeEnd);
        e.preventDefault();
        e.stopPropagation();
      };

      const onResizeMove = (e) => {
        if (!isResizing) return;
        if (e.cancelable) e.preventDefault();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const dx = clientX - resizeStartX;
        const newWidth = Math.max(160, Math.min(window.innerWidth - 20, initialWidth + dx));
        card.style.width = newWidth + "px";
        const wrapper = document.getElementById("clue-proportional-wrapper");
        if (wrapper) {
          wrapper.style.width = "100%";
        }
        updateClueInnerTransform(true);
      };

      const onResizeEnd = () => {
        isResizing = false;
        document.removeEventListener("mousemove", onResizeMove);
        document.removeEventListener("mouseup", onResizeEnd);
        document.removeEventListener("touchmove", onResizeMove);
        document.removeEventListener("touchend", onResizeEnd);
      };

      resizeHandle.addEventListener("mousedown", onResizeStart);
      resizeHandle.addEventListener("touchstart", onResizeStart, { passive: false });
    }

    if (viewBox) {
      viewBox.style.overflow = "hidden";
      viewBox.style.touchAction = "none";

      let isPanning = false;
      let panStartX = 0, panStartY = 0;
      let startPanX = 0, startPanY = 0;
      let initialPinchDistance = null;
      let initialPinchScale = 1;

      let clickCount = 0;
      let clickTimer = null;

      const triggerFavoriteClue = async () => {
        if (!currentReadingClueItem) return;
        const dbInstance = typeof db !== "undefined" ? db : (window.database || null);
        if (dbInstance && dbInstance.favorites) {
          try {
            await dbInstance.favorites.add({
              type: "chat_message",
              chatId: state.activeChatId,
              content: {
                role: "ai",
                content: currentReadingClueItem.content || currentReadingClueItem.desc || currentReadingClueItem.name,
                timestamp: Date.now()
              },
              timestamp: Date.now()
            });
            showClueToast("已成功添加至收藏");
          } catch (err) {
            console.error("收藏失败:", err);
          }
        }
      };

      const getTouchDistance = (t1, t2) => {
        const dx = t1.clientX - t2.clientX;
        const dy = t1.clientY - t2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
      };

      const clampPanAndZoom = () => {
        if (clueInnerZoom <= 1.0) {
          clueInnerPanX = 0;
          clueInnerPanY = 0;
        } else {
          const vbRect = viewBox.getBoundingClientRect();
          const maxPanX = (vbRect.width * (clueInnerZoom - 1)) / 2;
          const maxPanY = (vbRect.height * (clueInnerZoom - 1)) / 2;
          clueInnerPanX = Math.max(-maxPanX, Math.min(maxPanX, clueInnerPanX));
          clueInnerPanY = Math.max(-maxPanY, Math.min(maxPanY, clueInnerPanY));
        }
      };

      viewBox.addEventListener("touchstart", (e) => {
        if (e.touches.length === 3) {
          if (e.cancelable) e.preventDefault();
          triggerFavoriteClue();
        } else if (e.touches.length === 2) {
          isPanning = false;
          initialPinchDistance = getTouchDistance(e.touches[0], e.touches[1]);
          initialPinchScale = clueInnerZoom;
        } else if (e.touches.length === 1) {
          isPanning = true;
          panStartX = e.touches[0].clientX;
          panStartY = e.touches[0].clientY;
          startPanX = clueInnerPanX;
          startPanY = clueInnerPanY;
        }
      }, { passive: false });

      viewBox.addEventListener("touchmove", (e) => {
        if (e.touches.length === 2 && initialPinchDistance) {
          if (e.cancelable) e.preventDefault();
          const curDist = getTouchDistance(e.touches[0], e.touches[1]);
          const ratio = curDist / initialPinchDistance;
          clueInnerZoom = Math.max(0.4, Math.min(5.0, initialPinchScale * ratio));
          clampPanAndZoom();
          updateClueInnerTransform(true);
        } else if (e.touches.length === 1 && isPanning && clueInnerZoom > 1.0) {
          if (e.cancelable) e.preventDefault();
          const dx = e.touches[0].clientX - panStartX;
          const dy = e.touches[0].clientY - panStartY;
          clueInnerPanX = startPanX + dx;
          clueInnerPanY = startPanY + dy;
          clampPanAndZoom();
          updateClueInnerTransform(true);
        }
      }, { passive: false });

      viewBox.addEventListener("touchend", (e) => {
        if (e.touches.length < 2) {
          initialPinchDistance = null;
        }
        if (e.touches.length === 0) {
          isPanning = false;
          clampPanAndZoom();
          updateClueInnerTransform(false);
        }
      });

      viewBox.addEventListener("wheel", (e) => {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.15 : -0.15;
        clueInnerZoom = Math.max(0.4, Math.min(5.0, clueInnerZoom + delta));
        clampPanAndZoom();
        updateClueInnerTransform(true);
      }, { passive: false });

      let isMouseDownPan = false;
      viewBox.addEventListener("mousedown", (e) => {
        if (e.target.closest("button") || e.target.closest("a")) return;
        clickCount++;
        if (clickTimer) clearTimeout(clickTimer);
        if (clickCount === 3) {
          clickCount = 0;
          triggerFavoriteClue();
          return;
        }
        clickTimer = setTimeout(() => {
          clickCount = 0;
        }, 400);

        if (clueInnerZoom <= 1.0) return;
        isMouseDownPan = true;
        panStartX = e.clientX;
        panStartY = e.clientY;
        startPanX = clueInnerPanX;
        startPanY = clueInnerPanY;
      });

      window.addEventListener("mousemove", (e) => {
        if (!isMouseDownPan) return;
        const dx = e.clientX - panStartX;
        const dy = e.clientY - panStartY;
        clueInnerPanX = startPanX + dx;
        clueInnerPanY = startPanY + dy;
        clampPanAndZoom();
        updateClueInnerTransform(true);
      });

      window.addEventListener("mouseup", () => {
        if (isMouseDownPan) {
          isMouseDownPan = false;
          clampPanAndZoom();
          updateClueInnerTransform(false);
        }
      });
    }
  }

  // 打开自适应线索阅读悬浮窗口
  function openClueReaderModal(item) {
    if (!item) return;
    currentReadingClueItem = item;
    const modal = document.getElementById("inventory-clue-reader-modal");
    const card = document.getElementById("clue-reader-floating-card");
    const closeBtn = document.getElementById("clue-reader-close-btn");
    const bodyEl = document.getElementById("clue-reader-body");
    if (!modal || !card || !bodyEl) return;

    if (closeBtn) {
      closeBtn.onclick = (e) => {
        e.stopPropagation();
        modal.classList.remove("visible");
      };
    }

    let rawHtml = item.content || `<div style="padding: 16px; background: var(--card-bg); color: var(--text-primary); border-radius: 12px; border: 1px solid var(--border-color); text-align: center; font-size: 13px;">${item.desc || "暂无详细文本内容"}</div>`;
    if (/```(?:html)?[\s\S]*?```/i.test(rawHtml)) {
      const m = rawHtml.match(/```(?:html)?\s*([\s\S]*?)\s*```/i);
      if (m && m[1]) rawHtml = m[1].trim();
    }
    bodyEl.innerHTML = `<div id="clue-proportional-wrapper" style="width: 100%; box-sizing: border-box; display: block;">${rawHtml}</div>`;

    clueInnerZoom = 1.0;
    clueInnerPanX = 0;
    clueInnerPanY = 0;

    if (!card.style.top || card.style.top === "") {
      const initialLeft = Math.max(10, Math.floor((window.innerWidth - 330) / 2));
      card.style.left = initialLeft + "px";
      card.style.top = "100px";
    }
    card.style.width = "330px";
    card.style.transform = "none";

    updateClueInnerTransform(true);

    if (!clueCardInitialized) {
      initClueFloatingCardControls(card);
      clueCardInitialized = true;
    }

    modal.classList.add("visible");
  }

  // 打开生图面板
  function openNovelAiGenModal() {
    const modal = document.getElementById("inventory-item-gen-modal");
    if (!modal) return;

    const nameInput = document.getElementById("inv-edit-name");
    const descInput = document.getElementById("inv-edit-desc");
    const promptInput = document.getElementById("inv-gen-prompt-input");

    const itemName = nameInput ? nameInput.value.trim() : "";
    const itemDesc = descInput ? descInput.value.trim() : "";

    if (promptInput && !promptInput.value.trim()) {
      promptInput.value = `${itemName ? itemName : "item"}, ${itemDesc ? itemDesc : "fantasy artifact"}, masterpiece, high quality`;
    }

    modal.classList.add("visible");
  }

  // 让AI根据物品名称和简介自动生成生图提示词
  async function generateNovelAiPromptByAi() {
    const nameInput = document.getElementById("inv-edit-name");
    const descInput = document.getElementById("inv-edit-desc");
    const promptInput = document.getElementById("inv-gen-prompt-input");
    const genBtn = document.getElementById("inv-ai-make-prompt-btn");

    const itemName = nameInput ? nameInput.value.trim() : "";
    const itemDesc = descInput ? descInput.value.trim() : "";

    if (!itemName && !itemDesc) {
      alert("请先在表单中填写物品名称或简介");
      return;
    }

    if (genBtn) {
      genBtn.disabled = true;
      genBtn.textContent = "生成中...";
    }

    try {
      const useSubApi = Boolean(state.apiConfig.subApiUses && state.apiConfig.subApiUses.optimize && state.apiConfig.subApiKey);
      let proxyUrl = useSubApi ? (state.apiConfig.subProxyUrl || "https://api.openai.com") : (state.apiConfig.proxyUrl || "https://api.openai.com");
      let apiKey = useSubApi ? state.apiConfig.subApiKey : (state.apiConfig.apiKey || "");
      let model = useSubApi ? (state.apiConfig.subModel || "gpt-4o-mini") : (state.apiConfig.model || "gpt-4o-mini");

      const systemPrompt = "你是一个二次元与跑团道具插画描述词专家。请根据提供的物品名称和简介，输出一段适合NovelAI或Stable Diffusion绘图的英文tag提示词。只输出纯英文tag以逗号分隔，不要输出任何解释、代码块或中文。必须包含物体主体、质感、光影、masterpiece, best quality。";
      const userContent = `物品名称：${itemName}，物品作用简介：${itemDesc}`;

      let response = null;
      let isGemini = proxyUrl === (typeof GEMINI_API_URL !== "undefined" ? GEMINI_API_URL : "");
      if (isGemini && typeof toGeminiRequestData === "function") {
        let geminiConfig = toGeminiRequestData(model, apiKey, systemPrompt, [{ role: "user", content: userContent }], isGemini);
        if (geminiConfig) {
          response = await fetch(geminiConfig.url, geminiConfig.data);
        }
      } else {
        response = await fetch(`${proxyUrl}/v1/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userContent }
            ],
            temperature: 0.3,
            stream: false,
          }),
        });
      }

      if (!response || !response.ok) {
        throw new Error("生成提示词请求失败");
      }

      const resData = await response.json();
      let promptText = isGemini
        ? resData?.candidates?.[0]?.content?.parts?.[0]?.text || ""
        : resData?.choices?.[0]?.message?.content || "";

      promptText = promptText.trim().replace(/^[`"']+|[`"']+$/g, "");
      if (promptInput) {
        promptInput.value = promptText;
      }
    } catch (err) {
      console.error("生成提示词失败:", err);
      if (promptInput) {
        promptInput.value = `${itemName}, ${itemDesc}, masterpiece, best quality, fantasy prop`;
      }
    } finally {
      if (genBtn) {
        genBtn.disabled = false;
        genBtn.textContent = "生成提示词";
      }
    }
  }

  // 执行生图并写入头像
  async function executeNovelAiGeneration() {
    const promptInput = document.getElementById("inv-gen-prompt-input");
    const drawBtn = document.getElementById("inv-do-draw-btn");
    const prompt = promptInput ? promptInput.value.trim() : "";

    if (!prompt) {
      alert("请输入生图提示词");
      return;
    }

    if (drawBtn) {
      drawBtn.disabled = true;
      drawBtn.textContent = "生成中...";
    }

    try {
      let b64 = "";
      if (typeof window.callNovelAiDirect === "function") {
        b64 = await window.callNovelAiDirect(prompt, {
          resolution: "640x640",
          seed: Math.floor(Math.random() * 4294967295),
        });
      } else {
        throw new Error("NovelAI 模块未初始化");
      }

      if (!b64) {
        throw new Error("未获取到图片数据");
      }

      let compressedB64 = b64;
      try {
        if (typeof compressImage === "function") {
          compressedB64 = await compressImage(b64, 0.4, 640, true);
        }
      } catch (compErr) {
        compressedB64 = b64;
      }

      pendingAvatarBase64 = compressedB64;
      const avatarPreview = document.getElementById("inv-edit-avatar-preview");
      updateAvatarPreviewElement(avatarPreview, pendingAvatarBase64);

      if (currentGenTargetItem) {
        currentGenTargetItem.avatar = compressedB64;
        currentGenTargetItem.prompt = prompt;
        if (typeof currentGenSaveCallback === "function") {
          await currentGenSaveCallback(currentGenTargetItem);
        } else {
          const chat = (typeof state !== "undefined" && state.chats) ? state.chats[state.activeChatId] : null;
          if (chat) {
            const syncList = (list) => {
              if (!Array.isArray(list)) return;
              list.forEach(i => {
                if (i && (i.id === currentGenTargetItem.id || (i.name === currentGenTargetItem.name && (i.desc || "") === (currentGenTargetItem.desc || "")))) {
                  i.avatar = compressedB64;
                }
              });
            };
            syncList(chat.inventory);
            syncList(chat.aiInventory);
            if (Array.isArray(chat.members)) chat.members.forEach(m => syncList(m.inventory));
            const dbInstance = typeof db !== "undefined" ? db : (window.database || null);
            if (dbInstance && dbInstance.chats) await dbInstance.chats.put(chat);
          }
          renderInventoryList();
          if (typeof renderGlobalInventoryList === "function") renderGlobalInventoryList();
        }
        showClueToast("头像生图完成");
        currentGenTargetItem = null;
        currentGenSaveCallback = null;
      }

      const genModal = document.getElementById("inventory-item-gen-modal");
      if (genModal) genModal.classList.remove("visible");
    } catch (err) {
      console.error("物品生图失败:", err);
      alert("生图失败: " + err.message);
    } finally {
      if (drawBtn) {
        drawBtn.disabled = false;
        drawBtn.textContent = "开始生图";
      }
    }
  }

  // 气泡长按：转化线索
  async function convertMessageBubbleToClue() {
    const targetTimestamp = (typeof window.activeMessageTimestamp !== "undefined" && window.activeMessageTimestamp) || (typeof window.lastSelectedMessageTimestamp !== "undefined" && window.lastSelectedMessageTimestamp) || (typeof activeMessageTimestamp !== "undefined" && activeMessageTimestamp);
    if (!targetTimestamp || typeof state === "undefined" || !state.activeChatId) {
      showClueToast("请选择需要转化的消息");
      return;
    }
    const chat = state.chats[state.activeChatId];
    if (!chat) return;

    const message = (chat.history || []).find(m => m.timestamp === targetTimestamp);
    if (!message) {
      showClueToast("未找到对应消息");
      return;
    }

    if (typeof hideMessageActions === "function") {
      hideMessageActions();
    }

    let rawContent = "";
    if (typeof message.content === "object") {
      rawContent = JSON.stringify(message.content);
    } else {
      rawContent = String(message.content || "");
    }

    if (!rawContent.trim()) {
      showClueToast("消息内容为空无法转化");
      return;
    }

    showClueToast("正在提取线索，请稍候");

    try {
      let moduleContext = "";
      const dbInstance = typeof db !== "undefined" ? db : (window.database || null);
      if (chat.activeModuleId && dbInstance && dbInstance.modules) {
        try {
          const curMod = await dbInstance.modules.get(chat.activeModuleId);
          if (curMod) {
            moduleContext += `当前模组名称：${curMod.title || "未知模组"}\n`;
          }
          if (dbInstance.moduleChapters) {
            const chaps = await dbInstance.moduleChapters.where("moduleId").equals(chat.activeModuleId).toArray();
            const openChaps = chaps.filter(c => c.isOpen);
            if (openChaps.length > 0) {
              moduleContext += `当前所在章节：${openChaps.map(c => c.title).join("、")}\n`;
            }
          }
        } catch (e) {}
      }

      const useSubApi = Boolean(state.apiConfig.subApiUses && state.apiConfig.subApiUses.optimize && state.apiConfig.subApiKey);
      let proxyUrl = useSubApi ? (state.apiConfig.subProxyUrl || "https://api.openai.com") : (state.apiConfig.proxyUrl || "https://api.openai.com");
      let apiKey = useSubApi ? state.apiConfig.subApiKey : (state.apiConfig.apiKey || "");
      let model = useSubApi ? (state.apiConfig.subModel || "gpt-4o-mini") : (state.apiConfig.model || "gpt-4o-mini");

      const systemPrompt = `你是一个跑团与推理记录专家。请将用户提供的对话文本提取整理为一个精致的线索类物品，返回一个JSON对象。
要求格式：
{
  "name": "简短线索名称",
  "desc": "一两句线索概括",
  "contentHtml": "精美的HTML卡片代码",
  "prompt": "1clue, visual description, masterpiece, best quality"
}

HTML设计与排版核心规范：
1. 仿真拟物与精致美观：请根据线索类型自主决定外观，例如手机聊天截图拟真、复古牛皮纸信件、手写日记碎片、病历尸检报告、密信收据、羊皮纸卷轴等。
2. 尺寸与自适应：所有根容器与内部元素必须使用 max-width: 100%，width: auto 或 100%，box-sizing: border-box。禁止出现固定超大宽高，排版紧凑适中，避免空旷。
3. 纯净无多余外边框：卡片自身具有完整的内边距、阴影和背景样式即可，卡片外层不要添加多余的透明间隙或外部空白边框。
4. 样式内联：所有CSS样式请直接写在HTML元素的style属性中或使用style标签包含在内。
只输出合法JSON，禁止包含Markdown代码块或额外说明。`;

      const userText = `${moduleContext ? moduleContext + "\n" : ""}待整理消息文本：\n${rawContent}`;

      let response = null;
      let isGemini = proxyUrl === (typeof GEMINI_API_URL !== "undefined" ? GEMINI_API_URL : "");
      if (isGemini && typeof toGeminiRequestData === "function") {
        let geminiConfig = toGeminiRequestData(model, apiKey, systemPrompt, [{ role: "user", content: userText }], isGemini);
        if (geminiConfig) {
          response = await fetch(geminiConfig.url, geminiConfig.data);
        }
      } else {
        response = await fetch(`${proxyUrl}/v1/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userText }
            ],
            temperature: 0.3,
            stream: false,
          }),
        });
      }

      if (!response || !response.ok) {
        throw new Error("转化线索API请求失败");
      }

      const resData = await response.json();
      let jsonText = isGemini
        ? resData?.candidates?.[0]?.content?.parts?.[0]?.text || ""
        : resData?.choices?.[0]?.message?.content || "";

      jsonText = jsonText.trim().replace(/^```json/i, "").replace(/```$/i, "").trim();
      const clueObj = JSON.parse(jsonText);

      const inventory = getCurrentChatInventory();
      const cluePrompt = (clueObj.prompt || `1clue, ${clueObj.name || "clue"}, ${clueObj.desc || "secret clue"}, masterpiece, best quality`).trim();

      const newClueItem = {
        id: "inv_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6),
        name: clueObj.name || "转化线索",
        desc: clueObj.desc || "从对话记录中收纳的线索",
        effect: "",
        category: "clue",
        avatar: "",
        prompt: cluePrompt,
        content: clueObj.contentHtml || `<div style="padding: 16px; background: var(--card-bg); color: var(--text-primary); border-radius: 12px; border: 1px solid var(--border-color);">${rawContent}</div>`,
        isPinned: false,
        source: "转化线索",
        createdAt: Date.now(),
      };
      inventory.push(newClueItem);
      await saveCurrentChatInventory(inventory);
      renderInventoryList();
      showClueToast("线索转化完成");
      openClueReaderModal(newClueItem);

      if (cluePrompt && typeof window.callNovelAiDirect === "function") {
        window.callNovelAiDirect(cluePrompt, {
          resolution: "640x640",
          seed: Math.floor(Math.random() * 4294967295),
        }).then(async (b64) => {
          if (b64) {
            let compB64 = b64;
            try {
              if (typeof compressImage === "function") compB64 = await compressImage(b64, 0.4, 640, true);
            } catch (e) {}
            newClueItem.avatar = compB64;
            await saveCurrentChatInventory(inventory);
            renderInventoryList();
            if (typeof renderGlobalInventoryList === "function") renderGlobalInventoryList();
          }
        }).catch(e => {
          console.warn("线索自动生图跳过:", e);
        });
      }
    } catch (err) {
      console.error("转化线索降级:", err);
      const inventory = getCurrentChatInventory();
      const fallbackClue = {
        id: "inv_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6),
        name: rawContent.substring(0, 10) || "对话线索",
        desc: rawContent.substring(0, 40) + "...",
        effect: "",
        category: "clue",
        avatar: "",
        prompt: `1clue, mysterious note, masterpiece, best quality`,
        content: `<div style="padding: 16px; background: var(--card-bg); color: var(--text-primary); border-radius: 12px; border: 1px solid var(--border-color);">${rawContent}</div>`,
        isPinned: false,
        source: "转化线索",
        createdAt: Date.now(),
      };
      inventory.push(fallbackClue);
      await saveCurrentChatInventory(inventory);
      renderInventoryList();
      showClueToast("线索转化完成");
      openClueReaderModal(fallbackClue);
    }
  }

  // 构建注入给AI的物品栏记忆提示词块
  function getChatInventoryPromptBlock(chat) {
    if (!chat) return "";
    const lines = ["\n# 物品栏与道具系统"];
    lines.push("当前场景中各角色持有以下物品清单，AI已知悉，请在互动和鉴定时准确呼应，无需重复向玩家输出物品简介：");

    const playerItems = Array.isArray(chat.inventory) ? chat.inventory : [];
    if (playerItems.length > 0) {
      const myNickname = chat.isGroup ? (chat.settings?.myNickname || "我") : "玩家";
      lines.push(`## ${myNickname} 持有物品：`);
      playerItems.forEach(item => {
        const effText = item.effect ? ` 功能 ${item.effect}` : "";
        if (item.category === "weapon") {
          lines.push(`- 武器 ${item.name}：${item.desc || "无特定描述"}${item.damageBonus ? ` 伤害加值 ${item.damageBonus}` : ""}${item.dbBonus ? ` DB ${item.dbBonus}` : ""}`);
        } else if (item.category === "clue") {
          lines.push(`- 线索 ${item.name}：${item.desc || "无特定描述"}`);
        } else {
          lines.push(`- 道具 ${item.name}：${item.desc || "无特定描述"}${effText}`);
        }
      });
    }

    if (chat.isGroup && Array.isArray(chat.members)) {
      chat.members.forEach(m => {
        if (m.id === "user" || m.isDiceBot || m.roleType === "system_status" || m.roleType === "dice" || m.isSystemStatus || m.isDice) return;
        const mItems = Array.isArray(m.inventory) ? m.inventory : [];
        if (mItems.length > 0) {
          lines.push(`## ${m.groupNickname || m.originalName || m.name} 持有物品：`);
          mItems.forEach(item => {
            const effText = item.effect ? ` 功能 ${item.effect}` : "";
            if (item.category === "weapon") {
              lines.push(`- 武器 ${item.name}：${item.desc || "无特定描述"}${item.damageBonus ? ` 伤害加值 ${item.damageBonus}` : ""}`);
            } else if (item.category === "clue") {
              lines.push(`- 线索 ${item.name}：${item.desc || "无特定描述"}`);
            } else {
              lines.push(`- 道具 ${item.name}：${item.desc || "无特定描述"}${effText}`);
            }
          });
        }
      });
    } else if (!chat.isGroup && Array.isArray(chat.aiInventory) && chat.aiInventory.length > 0) {
      lines.push(`## ${chat.name || "对方"} 持有物品：`);
      chat.aiInventory.forEach(item => {
        const effText = item.effect ? ` 功能 ${item.effect}` : "";
        if (item.category === "weapon") {
          lines.push(`- 武器 ${item.name}：${item.desc || "无特定描述"}${item.damageBonus ? ` 伤害加值 ${item.damageBonus}` : ""}`);
        } else if (item.category === "clue") {
          lines.push(`- 线索 ${item.name}：${item.desc || "无特定描述"}`);
        } else {
          lines.push(`- 道具 ${item.name}：${item.desc || "无特定描述"}${effText}`);
        }
      });
    }

    lines.push("\n# 道具发放与使用互动规则");
    lines.push("1. 获得道具：当剧情中角色调查发现、搜刮、获得礼物、交易购买或向你索要物品时，请在返回的JSON消息数组中添加一个独立的 give_item 消息对象，并明确填写 target 获得者名字，且必须在 item 内提供生图英文 prompt 提示词以便生成头像：");
    lines.push('```json\n{\n  "type": "give_item",\n  "target": "获得者的名字",\n  "item": {\n    "name": "物品名称",\n    "desc": "生动的物品外观和作用介绍",\n    "category": "prop",\n    "effect": "如 HP+1 或 SAN+5 等",\n    "damageBonus": "1D6",\n    "content": "线索的内部正文",\n    "prompt": "1item, detailed object description, masterpiece, best quality, e.g. 1item, antique pocket watch, golden gears, masterpiece"\n  }\n}\n```');
    lines.push("2. 道具使用与数值加减判定：当玩家在对话中申请使用道具时，请根据玩家的动作描述判断道具是作用于使用者自己还是作用于其他目标角色。若同意使用申请且该道具具有数值效果，请输出 apply_item_effect 消息：");
    lines.push('```json\n{\n  "type": "apply_item_effect",\n  "target": "实际生效的角色名",\n  "key": "hp",\n  "delta": -2,\n  "approved": true\n}\n```');
    lines.push("若涉及多个属性或技能修改，也可以使用 changes 数组，例如修改 hp、san、mp、力量、克苏鲁神话 等任意属性或技能。系统会自动静默更新该角色的面板数值。");
    lines.push("3. 非数值效果：如果道具的功能是非数值描述，例如抵御一次死亡、消除疲惫等，请直接在剧情对话中进行生动演绎与回应，无需输出 apply_item_effect 指令。");
    return lines.join("\n");
  }

  // 检查AI回复并自动解析AI赠送的物品
  async function parseAndAddAiGiftItems(chat, messagesArray) {
    if (!chat || !Array.isArray(messagesArray)) return;

    for (const msg of messagesArray) {
      if (!msg) continue;
      const isGiveItem = msg.type === "give_item" || msg.type === "gift_item" || msg.type === "obtain_item" || msg.type === "item" || msg.type === "prop" || msg.type === "clue" || msg.type === "weapon" || msg.type === "send_item" || msg.type === "reward" || (msg.give_item && typeof msg.give_item === "object") || (msg.item && typeof msg.item === "object");
      const itemData = isGiveItem ? (msg.item || msg.give_item || msg) : null;

      if (itemData && itemData.name) {
        const targetName = msg.target || msg.targetName || msg.receiver || (chat.isGroup ? (chat.settings?.myNickname || "我") : "我");
        const category = itemData.category === "clue" ? "clue" : (itemData.category === "weapon" ? "weapon" : "prop");
        const newItem = {
          id: itemData.id || ("inv_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6)),
          name: String(itemData.name).trim(),
          desc: String(itemData.desc || itemData.description || "剧情中获赠的物品").trim(),
          effect: String(itemData.effect || "").trim(),
          category: category,
          avatar: itemData.avatar || "",
          prompt: itemData.prompt || itemData.imagePrompt || "",
          content: category === "clue" ? String(itemData.content || itemData.contentHtml || itemData.desc || "") : "",
          damageBonus: category === "weapon" ? String(itemData.damageBonus || itemData.damage || "") : "",
          dbBonus: category === "weapon" ? String(itemData.dbBonus || itemData.db || "") : "",
          isPinned: false,
          source: "获得道具",
          createdAt: Date.now(),
        };

        if (msg.item && typeof msg.item === "object") {
          Object.assign(msg.item, newItem);
        } else {
          msg.item = newItem;
        }

        const drawPrompt = newItem.prompt;
        await addItemToCharacterOrUser(chat, targetName, newItem, drawPrompt);
      } else if (msg.content || msg.message) {
        const text = String(msg.content || msg.message);
        const itemMatch = text.match(/[【\[](?:获得道具|获得物品|获得武器|获得线索|赠送道具|道具|物品|线索|武器)[：:]\s*([^\|\]】]+)(?:[\|｜]([^\]】]+))?[】\]]/i);
        if (itemMatch) {
          const matchedName = itemMatch[1].trim();
          const matchedDesc = (itemMatch[2] || "剧情中获赠的物品").trim();
          const matchedCat = text.includes("线索") ? "clue" : (text.includes("武器") ? "weapon" : "prop");
          const newItem = {
            id: "inv_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6),
            name: matchedName,
            desc: matchedDesc,
            effect: "",
            category: matchedCat,
            avatar: "",
            prompt: `1item, ${matchedName}, masterpiece, best quality`,
            content: matchedCat === "clue" ? matchedDesc : "",
            damageBonus: "",
            dbBonus: "",
            isPinned: false,
            source: "获得道具",
            createdAt: Date.now(),
          };
          await addItemToCharacterOrUser(chat, "我", newItem, newItem.prompt);
        }
      }
    }
  }

  // 初始化物品栏事件绑定
  function initInventoryManager() {
    const inventoryBtn = document.getElementById("chat-inventory-btn");
    if (inventoryBtn) {
      inventoryBtn.onclick = (e) => {
        e.stopPropagation();
        toggleInventoryDrawer();
      };
    }

    const drawerCloseBtn = document.getElementById("inventory-drawer-close-btn");
    if (drawerCloseBtn) {
      drawerCloseBtn.onclick = closeInventoryDrawer;
    }

    const drawerTabs = document.querySelectorAll("#chat-inventory-drawer .inventory-tab");
    drawerTabs.forEach(tab => {
      tab.onclick = () => {
        drawerTabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        currentInventoryTab = tab.dataset.cat || "all";
        renderInventoryList();
      };
    });

    const charTabs = document.querySelectorAll("#character-inventory-modal .inventory-tab");
    charTabs.forEach(tab => {
      tab.onclick = () => {
        charTabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        currentCharacterInventoryTab = tab.dataset.cat || "all";
        renderCharacterInventoryList(getEditingTargetInventory());
      };
    });

    const addBtn = document.getElementById("inventory-add-item-btn");
    if (addBtn) {
      addBtn.onclick = () => {
        editingTargetChar = null;
        openEditInventoryItemModal(null);
      };
    }

    const manageBtn = document.getElementById("inventory-manage-btn");
    if (manageBtn) {
      manageBtn.onclick = async () => {
        if (!isInventoryManageMode) {
          isInventoryManageMode = true;
          selectedInventoryItemIds.clear();
          manageBtn.textContent = "退出";
          renderInventoryList();
        } else {
          if (selectedInventoryItemIds.size > 0) {
            const inventory = getCurrentChatInventory();
            const remaining = inventory.filter(it => !selectedInventoryItemIds.has(it.id));
            await saveCurrentChatInventory(remaining);
            exitInventoryManageMode();
          } else {
            exitInventoryManageMode();
          }
        }
      };
    }

    const globalLibBtn = document.getElementById("inventory-global-lib-btn");
    if (globalLibBtn) {
      globalLibBtn.onclick = openGlobalInventoryModal;
    }

    const globalManageBtn = document.getElementById("global-inv-manage-btn");
    if (globalManageBtn) {
      globalManageBtn.onclick = () => {
        isGlobalLibraryManageMode = !isGlobalLibraryManageMode;
        globalManageBtn.textContent = isGlobalLibraryManageMode ? "退出" : "管理";
        renderGlobalInventoryList();
      };
    }

    const globalTabs = document.querySelectorAll(".global-inv-tab");
    globalTabs.forEach(tab => {
      tab.onclick = () => {
        globalTabs.forEach(t => {
          t.classList.remove("active");
          t.style.background = "transparent";
          t.style.color = "var(--text-secondary)";
          t.style.fontWeight = "500";
        });
        tab.classList.add("active");
        tab.style.background = "var(--card-bg)";
        tab.style.color = "var(--text-primary)";
        tab.style.fontWeight = "600";
        currentGlobalInventoryTab = tab.dataset.tab || "all";
        renderGlobalInventoryList();
      };
    });

    const globalDepositAllBtn = document.getElementById("global-inv-deposit-all-btn");
    if (globalDepositAllBtn) {
      globalDepositAllBtn.onclick = depositAllGlobalItemsToCurrentChat;
    }

    const globalCloseBtn = document.getElementById("global-inv-close-btn");
    if (globalCloseBtn) {
      globalCloseBtn.onclick = () => {
        const modal = document.getElementById("inventory-global-library-modal");
        if (modal) modal.classList.remove("visible");
      };
    }
    const globalCloseXBtn = document.getElementById("global-inv-close-x-btn");
    if (globalCloseXBtn) {
      globalCloseXBtn.onclick = () => {
        const modal = document.getElementById("inventory-global-library-modal");
        if (modal) modal.classList.remove("visible");
      };
    }

    const charInvCloseBtn = document.getElementById("char-inv-close-btn");
    if (charInvCloseBtn) {
      charInvCloseBtn.onclick = () => {
        const modal = document.getElementById("character-inventory-modal");
        if (modal) modal.classList.remove("visible");
      };
    }
    const charInvCloseXBtn = document.getElementById("char-inv-close-x-btn");
    if (charInvCloseXBtn) {
      charInvCloseXBtn.onclick = () => {
        const modal = document.getElementById("character-inventory-modal");
        if (modal) modal.classList.remove("visible");
      };
    }
    const charInvAddBtn = document.getElementById("char-inv-add-btn");
    if (charInvAddBtn) {
      charInvAddBtn.onclick = () => openEditInventoryItemModal(null);
    }

    const editSaveBtn = document.getElementById("inv-edit-save-btn");
    if (editSaveBtn) {
      editSaveBtn.onclick = saveInventoryItemFromModal;
    }
    const editCancelBtn = document.getElementById("inv-edit-cancel-btn");
    if (editCancelBtn) {
      editCancelBtn.onclick = () => {
        const modal = document.getElementById("inventory-item-edit-modal");
        if (modal) modal.classList.remove("visible");
      };
    }

    const avatarPreview = document.getElementById("inv-edit-avatar-preview");
    if (avatarPreview) {
      let pressTimer = null;
      avatarPreview.onmousedown = avatarPreview.ontouchstart = (e) => {
        pressTimer = setTimeout(() => {
          pressTimer = null;
          openNovelAiGenModal();
        }, 500);
      };
      avatarPreview.onmouseup = avatarPreview.ontouchend = (e) => {
        if (pressTimer) {
          clearTimeout(pressTimer);
          pressTimer = null;
          if (pendingAvatarBase64 && typeof openFullImageModal === "function") {
            openFullImageModal(pendingAvatarBase64);
          }
        }
      };
    }

    const aiMakePromptBtn = document.getElementById("inv-ai-make-prompt-btn");
    if (aiMakePromptBtn) {
      aiMakePromptBtn.onclick = generateNovelAiPromptByAi;
    }
    const doDrawBtn = document.getElementById("inv-do-draw-btn");
    if (doDrawBtn) {
      doDrawBtn.onclick = executeNovelAiGeneration;
    }
    const genCancelBtn = document.getElementById("inv-gen-cancel-btn");
    if (genCancelBtn) {
      genCancelBtn.onclick = () => {
        const modal = document.getElementById("inventory-item-gen-modal");
        if (modal) modal.classList.remove("visible");
      };
    }

    const clueCloseBtn = document.getElementById("clue-reader-close-btn");
    if (clueCloseBtn) {
      clueCloseBtn.onclick = () => {
        const modal = document.getElementById("inventory-clue-reader-modal");
        if (modal) modal.classList.remove("visible");
      };
    }

    const detailCloseBtn = document.getElementById("inv-detail-close-btn");
    if (detailCloseBtn) {
      detailCloseBtn.onclick = () => {
        const modal = document.getElementById("inventory-item-detail-modal");
        if (modal) modal.classList.remove("visible");
      };
    }

    const quoteBtn = document.getElementById("quote-message-btn");
    if (quoteBtn) {
      quoteBtn.onclick = convertMessageBubbleToClue;
    }

    const aiInvBtn = document.getElementById("manage-ai-inventory-btn");
    if (aiInvBtn) {
      aiInvBtn.onclick = () => openCharacterInventoryModal("ai");
    }
    const memberInvBtn = document.getElementById("member-inventory-btn");
    if (memberInvBtn) {
      memberInvBtn.onclick = () => openCharacterInventoryModal("member", window.editingMemberId);
    }
  }

  // 暴露全局方法
  window.initInventoryManager = initInventoryManager;
  window.renderInventoryList = renderInventoryList;
  window.toggleInventoryDrawer = toggleInventoryDrawer;
  window.closeInventoryDrawer = closeInventoryDrawer;
  window.getChatInventoryPromptBlock = getChatInventoryPromptBlock;
  window.parseAndAddAiGiftItems = parseAndAddAiGiftItems;
  window.convertMessageBubbleToClue = convertMessageBubbleToClue;
  window.addItemToCharacterOrUser = addItemToCharacterOrUser;
  window.applyItemEffectToCharacterOrUser = applyItemEffectToCharacterOrUser;
  window.openInventoryItemDetailModal = openInventoryItemDetailModal;
  window.openTransferItemModal = openTransferItemModal;
  window.openGlobalInventoryModal = openGlobalInventoryModal;
  window.openCharacterInventoryModal = openCharacterInventoryModal;
})();
