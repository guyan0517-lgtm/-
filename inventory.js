// inventory.js - 物品栏与道具系统

(function () {
  "use strict";

  let activeFilter = "all"; // all | clue | prop | weapon
  let isManageMode = false;
  let selectedItemIds = new Set();
  let currentEditingItemId = null;
  let currentConvertingMessage = null;

  const DEFAULT_ITEM_AVATARS = {
    clue: "https://api.iconify.design/lucide:file-text.svg?color=%238fd3f4",
    prop: "https://api.iconify.design/lucide:package.svg?color=%23fbc2eb",
    weapon: "https://api.iconify.design/lucide:sword.svg?color=%23ff9a9e"
  };

  async function getDbItems(chatId) {
    if (!window.db || !window.db.inventoryItems) return [];
    try {
      let items = await window.db.inventoryItems.toArray();
      if (chatId) {
        items = items.filter(item => !item.chatId || item.chatId === chatId);
      }
      // Sort pinned items to top, then by createdAt desc
      items.sort((a, b) => {
        if (Boolean(b.isPinned) !== Boolean(a.isPinned)) {
          return b.isPinned ? 1 : -1;
        }
        return (b.createdAt || 0) - (a.createdAt || 0);
      });
      return items;
    } catch (e) {
      console.warn("读取物品列表失败", e);
      return [];
    }
  }

  function toggleInventoryDrawer(forceState) {
    const drawer = document.getElementById("inventory-drawer");
    if (!drawer) return;
    const shouldOpen = typeof forceState === "boolean" ? forceState : (drawer.style.display !== "flex");
    if (shouldOpen) {
      drawer.style.display = "flex";
      renderInventoryList();
    } else {
      drawer.style.display = "none";
      isManageMode = false;
      selectedItemIds.clear();
    }
  }

  async function renderInventoryList() {
    const container = document.getElementById("inventory-items-container");
    const countBadge = document.getElementById("inventory-total-count");
    if (!container) return;

    const currentChatId = window.state ? window.state.activeChatId : null;
    const allItems = await getDbItems(currentChatId);

    if (countBadge) {
      countBadge.textContent = allItems.length;
    }

    let filtered = allItems;
    if (activeFilter === "clue") {
      filtered = allItems.filter(i => i.category === "clue" || i.category === "text");
    } else if (activeFilter === "prop") {
      filtered = allItems.filter(i => i.category === "prop");
    } else if (activeFilter === "weapon") {
      filtered = allItems.filter(i => i.category === "weapon");
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; color: var(--text-secondary); padding: 36px 8px; font-size: 11px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.4; margin-bottom: 6px;"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
          <div>暂无物品</div>
        </div>
      `;
      updateManageBar();
      return;
    }

    container.innerHTML = filtered.map(item => {
      const isClue = item.category === "clue" || item.category === "text";
      const isWeapon = item.category === "weapon";
      const avatarSrc = item.avatar || (isClue ? DEFAULT_ITEM_AVATARS.clue : (isWeapon ? DEFAULT_ITEM_AVATARS.weapon : DEFAULT_ITEM_AVATARS.prop));
      const categoryLabel = isClue ? "线索" : (isWeapon ? "武器" : "道具");
      const isChecked = selectedItemIds.has(item.id);
      const isPinned = Boolean(item.isPinned);

      let statText = "";
      if (isWeapon) {
        statText = `<span style="font-size: 9.5px; color: var(--accent-color); font-weight: 600;">伤害 ${escapeHtml(item.damage || "0")} | DB ${escapeHtml(item.db || "0")}</span>`;
      }

      return `
        <div class="inventory-item-card" data-id="${item.id}" style="display: flex; align-items: center; gap: 6px; padding: 6px 8px; background: var(--secondary-bg, #f9fafb); border: 1px solid var(--border-color); border-radius: 8px; box-sizing: border-box; flex-shrink: 0;">
          ${isManageMode ? `
            <input type="checkbox" class="inventory-item-check" data-id="${item.id}" ${isChecked ? "checked" : ""} style="width: 15px; height: 15px; cursor: pointer; margin: 0; flex-shrink: 0;" />
          ` : ""}
          <div class="inventory-item-avatar-box" data-id="${item.id}" style="width: 34px; height: 34px; border-radius: 6px; overflow: hidden; flex-shrink: 0; cursor: pointer; border: 1px solid var(--border-color); background: var(--background-color);">
            <img src="${avatarSrc}" alt="${escapeHtml(item.name || "")}" style="width: 100%; height: 100%; object-fit: cover;" />
          </div>
          <div class="inventory-item-body" data-id="${item.id}" style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; cursor: pointer;">
            <div style="display: flex; align-items: center; gap: 4px;">
              <button type="button" class="inventory-pin-btn" data-id="${item.id}" style="background: none; border: none; padding: 0; cursor: pointer; display: flex; align-items: center; color: ${isPinned ? "var(--accent-color)" : "var(--text-secondary)"};" title="置顶">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="${isPinned ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              </button>
              <span style="font-size: 11.5px; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(item.name || "未命名")}</span>
              <span style="font-size: 9px; padding: 1px 4px; border-radius: 4px; background: var(--card-bg); color: var(--text-secondary); border: 1px solid var(--border-color); flex-shrink: 0;">${categoryLabel}</span>
            </div>
            <div style="font-size: 10px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.2;">
              ${escapeHtml(item.desc || "暂无简介")}
            </div>
            ${statText}
          </div>
          <div style="flex-shrink: 0; display: flex; gap: 4px; align-items: center;">
            ${isManageMode ? `
              <button type="button" class="inventory-act-edit-btn" data-id="${item.id}" style="padding: 3px 6px; font-size: 10px; font-weight: 600; border-radius: 5px; border: 1px solid var(--border-color); background: var(--card-bg); color: var(--text-primary); cursor: pointer;">编辑</button>
            ` : (isClue ? `
              <button type="button" class="inventory-act-read-btn" data-id="${item.id}" style="padding: 3px 7px; font-size: 10.5px; font-weight: 600; border-radius: 5px; border: 1px solid var(--accent-color); background: var(--accent-color); color: #ffffff; cursor: pointer;">阅读</button>
            ` : `
              <button type="button" class="inventory-act-use-btn" data-id="${item.id}" style="padding: 3px 7px; font-size: 10.5px; font-weight: 600; border-radius: 5px; border: 1px solid var(--accent-color); background: var(--accent-color); color: #ffffff; cursor: pointer;">使用</button>
            `)}
          </div>
        </div>
      `;
    }).join("");

    bindItemEvents();
    updateManageBar();
  }

  function bindItemEvents() {
    const container = document.getElementById("inventory-items-container");
    if (!container) return;

    // Pin button
    container.querySelectorAll(".inventory-pin-btn").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const id = parseInt(btn.dataset.id, 10);
        const item = await window.db.inventoryItems.get(id);
        if (item) {
          item.isPinned = !item.isPinned;
          await window.db.inventoryItems.put(item);
          renderInventoryList();
        }
      });
    });

    // Body click -> Detail
    container.querySelectorAll(".inventory-item-body").forEach(body => {
      body.addEventListener("click", async (e) => {
        e.stopPropagation();
        const id = parseInt(body.dataset.id, 10);
        openItemDetailModal(id);
      });
    });

    // Avatar click -> Expand / zoom
    container.querySelectorAll(".inventory-item-avatar-box").forEach(box => {
      box.addEventListener("click", async (e) => {
        e.stopPropagation();
        const id = parseInt(box.dataset.id, 10);
        openItemDetailModal(id);
      });
    });

    // Checkbox
    container.querySelectorAll(".inventory-item-check").forEach(chk => {
      chk.addEventListener("change", (e) => {
        const id = parseInt(chk.dataset.id, 10);
        if (chk.checked) {
          selectedItemIds.add(id);
        } else {
          selectedItemIds.delete(id);
        }
        updateManageBar();
      });
    });

    // Edit button in manage mode
    container.querySelectorAll(".inventory-act-edit-btn").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const id = parseInt(btn.dataset.id, 10);
        openEditItemModal(id);
      });
    });

    // Read button
    container.querySelectorAll(".inventory-act-read-btn").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const id = parseInt(btn.dataset.id, 10);
        openReadClueModal(id);
      });
    });

    // Use button
    container.querySelectorAll(".inventory-act-use-btn").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const id = parseInt(btn.dataset.id, 10);
        useInventoryItem(id);
      });
    });
  }

  function updateManageBar() {
    const manageBtn = document.getElementById("inventory-manage-btn");
    const deleteSelectedBtn = document.getElementById("inventory-delete-selected-btn");
    if (!manageBtn) return;

    if (isManageMode) {
      manageBtn.textContent = "完成";
      if (deleteSelectedBtn) {
        deleteSelectedBtn.style.display = selectedItemIds.size > 0 ? "inline-flex" : "none";
        deleteSelectedBtn.textContent = `删除 ${selectedItemIds.size}`;
      }
    } else {
      manageBtn.textContent = "管理";
      if (deleteSelectedBtn) {
        deleteSelectedBtn.style.display = "none";
      }
    }
  }

  async function openEditItemModal(itemId = null) {
    currentEditingItemId = itemId;
    const modal = document.getElementById("inventory-edit-modal");
    if (!modal) return;

    const titleEl = document.getElementById("inventory-edit-modal-title");
    const nameInput = document.getElementById("inventory-edit-name");
    const descInput = document.getElementById("inventory-edit-desc");
    const catSelect = document.getElementById("inventory-edit-category");
    const avatarInput = document.getElementById("inventory-edit-avatar");
    const avatarImg = document.getElementById("inventory-edit-avatar-preview");
    const weaponFields = document.getElementById("inventory-edit-weapon-fields");
    const damageInput = document.getElementById("inventory-edit-damage");
    const dbInput = document.getElementById("inventory-edit-db");
    const clueFields = document.getElementById("inventory-edit-clue-fields");
    const contentTextarea = document.getElementById("inventory-edit-content");

    if (itemId) {
      if (titleEl) titleEl.textContent = "编辑物品";
      const item = await window.db.inventoryItems.get(itemId);
      if (item) {
        if (nameInput) nameInput.value = item.name || "";
        if (descInput) descInput.value = item.desc || "";
        if (catSelect) catSelect.value = item.category || "prop";
        if (avatarInput) avatarInput.value = item.avatar || "";
        if (avatarImg) avatarImg.src = item.avatar || DEFAULT_ITEM_AVATARS.prop;
        if (damageInput) damageInput.value = item.damage || "";
        if (dbInput) dbInput.value = item.db || "";
        if (contentTextarea) contentTextarea.value = item.content || "";
      }
    } else {
      if (titleEl) titleEl.textContent = "添加物品";
      if (nameInput) nameInput.value = "";
      if (descInput) descInput.value = "";
      if (catSelect) catSelect.value = activeFilter === "all" ? "prop" : (activeFilter === "clue" ? "clue" : activeFilter);
      if (avatarInput) avatarInput.value = "";
      if (avatarImg) avatarImg.src = DEFAULT_ITEM_AVATARS.prop;
      if (damageInput) damageInput.value = "";
      if (dbInput) dbInput.value = "";
      if (contentTextarea) contentTextarea.value = "";
    }

    const updateFieldsVisibility = () => {
      const cat = catSelect ? catSelect.value : "prop";
      if (weaponFields) weaponFields.style.display = cat === "weapon" ? "block" : "none";
      if (clueFields) clueFields.style.display = (cat === "clue" || cat === "text") ? "block" : "none";
      if (avatarImg && !avatarInput.value.trim()) {
        avatarImg.src = cat === "weapon" ? DEFAULT_ITEM_AVATARS.weapon : ((cat === "clue" || cat === "text") ? DEFAULT_ITEM_AVATARS.clue : DEFAULT_ITEM_AVATARS.prop);
      }
    };

    if (catSelect) {
      catSelect.onchange = updateFieldsVisibility;
    }
    updateFieldsVisibility();

    modal.classList.add("visible");
  }

  async function saveItemFromModal() {
    const nameInput = document.getElementById("inventory-edit-name");
    const descInput = document.getElementById("inventory-edit-desc");
    const catSelect = document.getElementById("inventory-edit-category");
    const avatarInput = document.getElementById("inventory-edit-avatar");
    const damageInput = document.getElementById("inventory-edit-damage");
    const dbInput = document.getElementById("inventory-edit-db");
    const contentTextarea = document.getElementById("inventory-edit-content");

    const name = nameInput ? nameInput.value.trim() : "";
    if (!name) {
      if (typeof showCustomAlert === "function") {
        await showCustomAlert("提示", "请输入物品名称");
      }
      return;
    }

    const desc = descInput ? descInput.value.trim() : "";
    const category = catSelect ? catSelect.value : "prop";
    const avatar = avatarInput ? avatarInput.value.trim() : "";
    const damage = damageInput ? damageInput.value.trim() : "";
    const db = dbInput ? dbInput.value.trim() : "";
    const content = contentTextarea ? contentTextarea.value.trim() : "";
    const currentChatId = window.state ? window.state.activeChatId : null;

    if (currentEditingItemId) {
      const existing = await window.db.inventoryItems.get(currentEditingItemId);
      if (existing) {
        existing.name = name;
        existing.desc = desc;
        existing.category = category;
        existing.avatar = avatar;
        existing.damage = damage;
        existing.db = db;
        existing.content = content;
        existing.updatedAt = Date.now();
        await window.db.inventoryItems.put(existing);
      }
    } else {
      const newItem = {
        chatId: currentChatId,
        name,
        desc,
        category,
        avatar,
        damage,
        db,
        content,
        source: "self",
        isPinned: false,
        createdAt: Date.now()
      };
      await window.db.inventoryItems.add(newItem);
    }

    closeModal("inventory-edit-modal");
    renderInventoryList();
  }

  async function openItemDetailModal(itemId) {
    const item = await window.db.inventoryItems.get(itemId);
    if (!item) return;

    const modal = document.getElementById("inventory-detail-modal");
    if (!modal) return;

    const isClue = item.category === "clue" || item.category === "text";
    const isWeapon = item.category === "weapon";
    const avatarSrc = item.avatar || (isClue ? DEFAULT_ITEM_AVATARS.clue : (isWeapon ? DEFAULT_ITEM_AVATARS.weapon : DEFAULT_ITEM_AVATARS.prop));
    const catLabel = isClue ? "线索" : (isWeapon ? "武器" : "道具");

    const imgEl = document.getElementById("inventory-detail-img");
    const nameEl = document.getElementById("inventory-detail-name");
    const catEl = document.getElementById("inventory-detail-cat");
    const descEl = document.getElementById("inventory-detail-desc");
    const weaponBox = document.getElementById("inventory-detail-weapon-stats");
    const useBtn = document.getElementById("inventory-detail-use-btn");
    const readBtn = document.getElementById("inventory-detail-read-btn");
    const editBtn = document.getElementById("inventory-detail-edit-btn");

    if (imgEl) imgEl.src = avatarSrc;
    if (nameEl) nameEl.textContent = item.name || "未命名";
    if (catEl) catEl.textContent = catLabel;
    if (descEl) descEl.textContent = item.desc || "暂无简介";

    if (weaponBox) {
      if (isWeapon) {
        weaponBox.style.display = "flex";
        weaponBox.innerHTML = `
          <div style="flex: 1; padding: 6px; background: var(--secondary-bg); border-radius: 6px; text-align: center;">
            <div style="font-size: 10px; color: var(--text-secondary);">伤害加值</div>
            <div style="font-size: 13px; font-weight: 700; color: var(--accent-color);">${escapeHtml(item.damage || "0")}</div>
          </div>
          <div style="flex: 1; padding: 6px; background: var(--secondary-bg); border-radius: 6px; text-align: center;">
            <div style="font-size: 10px; color: var(--text-secondary);">DB</div>
            <div style="font-size: 13px; font-weight: 700; color: var(--accent-color);">${escapeHtml(item.db || "0")}</div>
          </div>
        `;
      } else {
        weaponBox.style.display = "none";
      }
    }

    if (useBtn) {
      useBtn.style.display = isClue ? "none" : "inline-flex";
      useBtn.onclick = () => {
        closeModal("inventory-detail-modal");
        useInventoryItem(item.id);
      };
    }

    if (readBtn) {
      readBtn.style.display = isClue ? "inline-flex" : "none";
      readBtn.onclick = () => {
        closeModal("inventory-detail-modal");
        openReadClueModal(item.id);
      };
    }

    if (editBtn) {
      editBtn.onclick = () => {
        closeModal("inventory-detail-modal");
        openEditItemModal(item.id);
      };
    }

    modal.classList.add("visible");
  }

  async function openReadClueModal(itemId) {
    const item = await window.db.inventoryItems.get(itemId);
    if (!item) return;

    const modal = document.getElementById("inventory-read-modal");
    if (!modal) return;

    const titleEl = document.getElementById("inventory-read-title");
    const contentEl = document.getElementById("inventory-read-content");
    const regenBtn = document.getElementById("inventory-read-regen-btn");
    const editBtn = document.getElementById("inventory-read-edit-btn");

    if (titleEl) titleEl.textContent = item.name || "线索阅读";

    let htmlBody = item.content || `<div style="padding: 16px; color: var(--text-secondary); text-align: center;">暂无详细正文内容</div>`;
    if (contentEl) {
      contentEl.innerHTML = htmlBody;
    }

    if (regenBtn) {
      regenBtn.onclick = () => regenerateClueHtml(item.id);
    }

    if (editBtn) {
      editBtn.onclick = () => {
        closeModal("inventory-read-modal");
        openEditItemModal(item.id);
      };
    }

    modal.classList.add("visible");
  }

  async function regenerateClueHtml(itemId) {
    const item = await window.db.inventoryItems.get(itemId);
    if (!item) return;

    if (typeof showCustomAlert === "function") {
      await showCustomAlert("正在生成", "正在调用模型生成精美排版");
    }

    try {
      const apiCfg = typeof window.getEffectiveApiConfig === "function" ? window.getEffectiveApiConfig("optimize") : (window.state?.apiConfig || {});
      const proxyUrl = apiCfg.proxyUrl || "https://api.openai.com";
      const apiKey = apiCfg.apiKey || "";
      const model = apiCfg.model || "gpt-4o-mini";

      const prompt = `请为以下线索道具重新设计一个高度仿真、小巧精致、1比1复刻真实物品的HTML片段：
道具名称：${item.name}
道具简介：${item.desc}
原内容：${item.content || ""}

排版规范：
1. 最外层容器必须包含 style="max-width:280px; width:100%; box-sizing:border-box; margin:10px auto; padding:10px; border-radius:8px; border:1px solid #d1d5db; background:#fffdfa; font-family:serif;"
2. 行高 line-height:1.3，正文字号不超 12px，次要文字 9px 到 10px
3. 纯HTML代码，不要包含外部样式表，不要包含任何markdown标记`;

      let generatedHtml = "";
      if (proxyUrl.includes("generativelanguage.googleapis.com")) {
        const cleanModel = (model || "gemini-1.5-flash").replace(/^models\//, "");
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await res.json();
        generatedHtml = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      } else {
        const reqUrl = proxyUrl.endsWith("/v1") ? `${proxyUrl}/chat/completions` : (proxyUrl.includes("/chat/completions") ? proxyUrl : `${proxyUrl}/v1/chat/completions`);
        const res = await fetch(reqUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: model,
            messages: [{ role: "user", content: prompt }]
          })
        });
        const data = await res.json();
        generatedHtml = data?.choices?.[0]?.message?.content || "";
      }

      generatedHtml = generatedHtml.replace(/^```(?:html)?\s*/i, "").replace(/```\s*$/i, "").trim();
      if (generatedHtml) {
        item.content = generatedHtml;
        await window.db.inventoryItems.put(item);
        const contentEl = document.getElementById("inventory-read-content");
        if (contentEl) contentEl.innerHTML = generatedHtml;
        if (typeof showCustomAlert === "function") {
          await showCustomAlert("成功", "排版已重新生成");
        }
      }
    } catch (e) {
      console.error("生成HTML失败", e);
      if (typeof showCustomAlert === "function") {
        await showCustomAlert("失败", `排版生成未完成 ${e.message}`);
      }
    }
  }

  async function useInventoryItem(itemId) {
    const item = await window.db.inventoryItems.get(itemId);
    if (!item) return;

    const currentChatId = window.state ? window.state.activeChatId : null;
    if (!currentChatId) return;

    const chat = window.state.chats[currentChatId];
    if (!chat) return;

    const isClue = item.category === "clue" || item.category === "text";
    const isWeapon = item.category === "weapon";
    const avatarSrc = item.avatar || (isClue ? DEFAULT_ITEM_AVATARS.clue : (isWeapon ? DEFAULT_ITEM_AVATARS.weapon : DEFAULT_ITEM_AVATARS.prop));

    // 1. Send system action bubble
    const systemNoticeMsg = {
      role: "system",
      type: "system",
      content: `* 使用了道具：${item.name}`,
      timestamp: Date.now()
    };
    chat.history.push(systemNoticeMsg);

    // 2. Send item card message
    const itemCardMsg = {
      role: "user",
      type: "item_card",
      payload: {
        itemId: item.id,
        name: item.name,
        category: isClue ? "线索" : (isWeapon ? "武器" : "道具"),
        desc: item.desc || "",
        avatar: avatarSrc,
        damage: item.damage,
        db: item.db
      },
      content: `[玩家使用了道具：${item.name}]`,
      timestamp: Date.now() + 1
    };
    chat.history.push(itemCardMsg);

    await window.db.chats.put(chat);
    if (typeof appendMessage === "function") {
      appendMessage(systemNoticeMsg, chat);
      appendMessage(itemCardMsg, chat);
    }
    if (typeof renderChatList === "function") {
      renderChatList();
    }

    if (typeof showCustomAlert === "function") {
      await showCustomAlert("已使用", `已在对话中展示 ${item.name}`);
    }
  }

  async function convertMessageToClue(msg) {
    if (!msg) return;
    currentConvertingMessage = msg;

    const modal = document.getElementById("inventory-convert-modal");
    if (!modal) return;

    const nameInput = document.getElementById("inventory-convert-name");
    const descInput = document.getElementById("inventory-convert-desc");
    const htmlPreview = document.getElementById("inventory-convert-html-preview");
    const rawTextarea = document.getElementById("inventory-convert-html-raw");

    const rawContent = typeof msg.content === "object" ? JSON.stringify(msg.content) : String(msg.content || "");
    const shortTitle = rawContent.slice(0, 10).replace(/[\r\n#*`]/g, "").trim() || "重要线索";

    if (nameInput) nameInput.value = shortTitle;
    if (descInput) descInput.value = "从对话中提炼的记录";
    if (rawTextarea) rawTextarea.value = `<div style="max-width:280px; width:100%; box-sizing:border-box; margin:10px auto; padding:10px; border-radius:8px; border:1px solid var(--border-color); background:var(--card-bg); font-size:12px; line-height:1.3;">${escapeHtml(rawContent)}</div>`;
    if (htmlPreview) htmlPreview.innerHTML = rawTextarea ? rawTextarea.value : "";

    modal.classList.add("visible");

    // Call AI in background to enhance formatting
    try {
      const apiCfg = typeof window.getEffectiveApiConfig === "function" ? window.getEffectiveApiConfig("optimize") : (window.state?.apiConfig || {});
      const proxyUrl = apiCfg.proxyUrl || "https://api.openai.com";
      const apiKey = apiCfg.apiKey || "";
      const model = apiCfg.model || "gpt-4o-mini";

      if (apiKey) {
        const prompt = `请将以下跑团/剧情对话提取为一条文字类线索道具，输出JSON格式 {"name":"4到8字名称","desc":"一句简短简介","html":"仿真HTML排版"}：
对话原文：
${rawContent}

HTML排版规则：
1. 最外层包含 style="max-width:280px; width:100%; box-sizing:border-box; margin:10px auto; padding:10px; border-radius:8px; border:1px solid #e5e7eb; background:#fffdfa;"
2. 仿真物品样式，如信件、便签、日记纸页、档案票据等
3. 紧凑排版，行高 1.3，字号 10px 到 12px`;

        let jsonResText = "";
        if (proxyUrl.includes("generativelanguage.googleapis.com")) {
          const cleanModel = (model || "gemini-1.5-flash").replace(/^models\//, "");
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
          });
          const data = await res.json();
          jsonResText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        } else {
          const reqUrl = proxyUrl.endsWith("/v1") ? `${proxyUrl}/chat/completions` : (proxyUrl.includes("/chat/completions") ? proxyUrl : `${proxyUrl}/v1/chat/completions`);
          const res = await fetch(reqUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
            body: JSON.stringify({
              model: model,
              messages: [{ role: "user", content: prompt }]
            })
          });
          const data = await res.json();
          jsonResText = data?.choices?.[0]?.message?.content || "";
        }

        jsonResText = jsonResText.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
        const parsed = JSON.parse(jsonResText);
        if (parsed.name && nameInput) nameInput.value = parsed.name;
        if (parsed.desc && descInput) descInput.value = parsed.desc;
        if (parsed.html) {
          if (rawTextarea) rawTextarea.value = parsed.html;
          if (htmlPreview) htmlPreview.innerHTML = parsed.html;
        }
      }
    } catch (e) {
      console.warn("自动提取线索失败，使用默认解析", e);
    }
  }

  async function saveConvertedClue() {
    const nameInput = document.getElementById("inventory-convert-name");
    const descInput = document.getElementById("inventory-convert-desc");
    const rawTextarea = document.getElementById("inventory-convert-html-raw");

    const name = nameInput ? nameInput.value.trim() : "新线索";
    const desc = descInput ? descInput.value.trim() : "从对话提炼的线索";
    const html = rawTextarea ? rawTextarea.value.trim() : "";
    const currentChatId = window.state ? window.state.activeChatId : null;

    const newClueItem = {
      chatId: currentChatId,
      name,
      desc,
      category: "clue",
      avatar: DEFAULT_ITEM_AVATARS.clue,
      damage: "",
      db: "",
      content: html,
      source: "converted",
      isPinned: false,
      createdAt: Date.now()
    };

    await window.db.inventoryItems.add(newClueItem);
    closeModal("inventory-convert-modal");
    renderInventoryList();
    if (typeof showCustomAlert === "function") {
      await showCustomAlert("成功", `已将 ${name} 收入物品栏`);
    }
  }

  async function generateItemImagePrompt() {
    const nameInput = document.getElementById("inventory-edit-name");
    const descInput = document.getElementById("inventory-edit-desc");
    const catSelect = document.getElementById("inventory-edit-category");
    const promptInput = document.getElementById("inventory-edit-image-prompt");

    const name = nameInput ? nameInput.value.trim() : "";
    const desc = descInput ? descInput.value.trim() : "";
    const cat = catSelect ? catSelect.value : "prop";

    if (!name) {
      if (typeof showCustomAlert === "function") {
        await showCustomAlert("提示", "请先输入物品名称");
      }
      return;
    }

    if (promptInput) {
      promptInput.value = `1024x1024 high quality, detailed fantasy TRPG item icon, ${name}, ${desc}, clean background, centered, sharp focus`;
    }

    try {
      const apiCfg = typeof window.getEffectiveApiConfig === "function" ? window.getEffectiveApiConfig("draw") : (window.state?.apiConfig || {});
      const proxyUrl = apiCfg.proxyUrl || "https://api.openai.com";
      const apiKey = apiCfg.apiKey || "";
      const model = apiCfg.model || "gpt-4o-mini";

      if (apiKey) {
        const prompt = `请为TRPG道具【${name}】（类型：${cat}，简介：${desc}）生成一句专业的英文生图Prompt，1024x1024方图物品图标风格，仅返回英文Prompt：`;
        let enPrompt = "";
        if (proxyUrl.includes("generativelanguage.googleapis.com")) {
          const cleanModel = (model || "gemini-1.5-flash").replace(/^models\//, "");
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
          });
          const data = await res.json();
          enPrompt = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        } else {
          const reqUrl = proxyUrl.endsWith("/v1") ? `${proxyUrl}/chat/completions` : (proxyUrl.includes("/chat/completions") ? proxyUrl : `${proxyUrl}/v1/chat/completions`);
          const res = await fetch(reqUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
            body: JSON.stringify({
              model: model,
              messages: [{ role: "user", content: prompt }]
            })
          });
          const data = await res.json();
          enPrompt = data?.choices?.[0]?.message?.content || "";
        }
        if (enPrompt && promptInput) {
          promptInput.value = enPrompt.trim().replace(/^["']|["']$/g, "");
        }
      }
    } catch (e) {
      console.warn("生成生图提示词异常", e);
    }
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove("visible");
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
  window.escapeHtml = escapeHtml;

  // Export summary helper for AI context
  window.getInventorySummaryForAi = async function (chatId) {
    const items = await getDbItems(chatId);
    if (!items || items.length === 0) return "";

    const lines = ["【玩家当前物品栏清单】"];
    items.forEach(item => {
      const isClue = item.category === "clue" || item.category === "text";
      const isWeapon = item.category === "weapon";
      const tag = isClue ? "线索" : (isWeapon ? "武器" : "道具");
      let extra = "";
      if (isWeapon) {
        extra = ` | 伤害加值: ${item.damage || "0"} | DB: ${item.db || "0"}`;
      }
      lines.push(`- [${tag}] ${item.name}：${item.desc || "无"}${extra}`);
    });
    return lines.join("\n");
  };

  window.openInventoryItemDetail = function (itemId, fallbackPayload) {
    if (itemId) {
      openItemDetailModal(itemId);
    }
  };

  window.convertMessageBubbleToClue = function (msg) {
    convertMessageToClue(msg);
  };

  function initInventory() {
    // 1. Entrance button
    const inventoryBtn = document.getElementById("chat-inventory-btn");
    if (inventoryBtn) {
      inventoryBtn.onclick = null;
      inventoryBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleInventoryDrawer();
      });
    }

    // 2. Drawer close & filter tabs
    const closeDrawerBtn = document.getElementById("inventory-drawer-close-btn");
    if (closeDrawerBtn) {
      closeDrawerBtn.addEventListener("click", () => toggleInventoryDrawer(false));
    }

    document.querySelectorAll(".inventory-filter-tab").forEach(tab => {
      tab.addEventListener("click", () => {
        document.querySelectorAll(".inventory-filter-tab").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        activeFilter = tab.dataset.filter || "all";
        renderInventoryList();
      });
    });

    const addBtn = document.getElementById("inventory-add-btn");
    if (addBtn) {
      addBtn.addEventListener("click", () => openEditItemModal(null));
    }

    const manageBtn = document.getElementById("inventory-manage-btn");
    if (manageBtn) {
      manageBtn.addEventListener("click", () => {
        isManageMode = !isManageMode;
        selectedItemIds.clear();
        renderInventoryList();
      });
    }

    const deleteSelectedBtn = document.getElementById("inventory-delete-selected-btn");
    if (deleteSelectedBtn) {
      deleteSelectedBtn.addEventListener("click", async () => {
        if (selectedItemIds.size === 0) return;
        const confirmed = typeof showCustomConfirm === "function" ? await showCustomConfirm("删除确认", `确定要删除选中的 ${selectedItemIds.size} 件物品吗？`) : true;
        if (confirmed) {
          for (const id of selectedItemIds) {
            await window.db.inventoryItems.delete(id);
          }
          selectedItemIds.clear();
          renderInventoryList();
        }
      });
    }

    // Modal save buttons
    const saveItemBtn = document.getElementById("inventory-save-item-btn");
    if (saveItemBtn) {
      saveItemBtn.addEventListener("click", saveItemFromModal);
    }

    const genPromptBtn = document.getElementById("inventory-gen-prompt-btn");
    if (genPromptBtn) {
      genPromptBtn.addEventListener("click", generateItemImagePrompt);
    }

    const saveConvertBtn = document.getElementById("inventory-save-convert-btn");
    if (saveConvertBtn) {
      saveConvertBtn.addEventListener("click", saveConvertedClue);
    }

    // Raw HTML sync preview
    const rawTextarea = document.getElementById("inventory-convert-html-raw");
    const previewBox = document.getElementById("inventory-convert-html-preview");
    if (rawTextarea && previewBox) {
      rawTextarea.addEventListener("input", () => {
        previewBox.innerHTML = rawTextarea.value;
      });
    }

    // Close buttons on modals
    document.querySelectorAll(".inventory-modal-close-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const modal = btn.closest(".modal");
        if (modal) modal.classList.remove("visible");
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initInventory);
  } else {
    initInventory();
  }
})();
