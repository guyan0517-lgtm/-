document.addEventListener("DOMContentLoaded", () => {
  let currentFilterContext = { type: "global", id: null }; // 记录当前打开筛选的是哪个页面
  let activeGroupId = null; // 记录当前打开的小组ID
  let activeForumPostId = null; // 记录当前打开的帖子ID
  let editingGroupId = null; // 用于追踪正在编辑的小组ID
  // ▼▼▼ 用这块【已添加梦角小组】的代码，完整替换掉你旧的 initializeDefaultGroups 函数 ▼▼▼
  let activeForumFilters = {
    global: [], // 用于主页小组列表的筛选
    group: {}, // 用于存储每个小组内部帖子的筛选, e.g., { 1: ['科幻'], 2: ['剧情'] }
  };
  let isSelectionMode = false;
  let weiboHotSearchCache = [];
  let activeSeriesId = null; // 当前查看的连载ID
  let postReturnContext = "group"; // 帖子详情返回去向
  const ongoingSeriesTasks = new Set(); // 防重复追更
  /**
   * 【全新】从一个数组中随机获取一个元素
   * @param {Array} arr - 目标数组
   * @returns {*} - 数组中的一个随机元素
   */
  function getRandomItem(arr) {
    // 安全检查，如果数组为空或不存在，返回空字符串
    if (!arr || arr.length === 0) return "";
    // 返回一个随机索引对应的元素
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function resetCreatePostModal() {
    document.getElementById("post-public-text").value = "";
    document.getElementById("post-image-preview").src = "";
    document.getElementById("post-image-description").value = "";
    document
      .getElementById("post-image-preview-container")
      .classList.remove("visible");
    document.getElementById("post-image-desc-group").style.display = "none";
    document.getElementById("post-local-image-input").value = "";
    document.getElementById("post-hidden-text").value = "";

    // 【核心修复】我们不再模拟点击，而是直接、安全地设置状态
    const imageModeBtn = document.getElementById("switch-to-image-mode");
    const textImageModeBtn = document.getElementById(
      "switch-to-text-image-mode",
    );
    const imageModeContent = document.getElementById("image-mode-content");
    const textImageModeContent = document.getElementById(
      "text-image-mode-content",
    );

    imageModeBtn.classList.add("active");
    textImageModeBtn.classList.remove("active");
    imageModeContent.classList.add("active");
    textImageModeContent.classList.remove("active");
  }

  // ▲▲▲ 粘贴结束 ▲▲▲
  function addLongPressListener(element, callback) {
    let pressTimer;
    const startPress = (e) => {
      if (isSelectionMode) return;
      e.preventDefault();
      pressTimer = window.setTimeout(() => callback(e), 500);
    };
    const cancelPress = () => clearTimeout(pressTimer);
    element.addEventListener("mousedown", startPress);
    element.addEventListener("mouseup", cancelPress);
    element.addEventListener("mouseleave", cancelPress);
    element.addEventListener("touchstart", startPress, { passive: true });
    element.addEventListener("touchend", cancelPress);
    element.addEventListener("touchmove", cancelPress);
  }
  /**
   * 【V3 最终完美版】渲染论坛主屏幕
   * 逻辑：内置小组显示SVG，用户小组显示自定义图片
   */
  async function renderForumScreen() {
    const listEl = document.getElementById("forum-group-list");
    const allGroups = await db.forumGroups.toArray();
    listEl.innerHTML = "";

    // --- 筛选逻辑 (保持不变) ---
    const globalFilters = activeForumFilters.global;
    let groupsToRender = allGroups;
    if (globalFilters && globalFilters.length > 0) {
      groupsToRender = allGroups.filter(
        (group) =>
          group.categories &&
          group.categories.some((cat) => globalFilters.includes(cat)),
      );
    }

    if (groupsToRender.length === 0) {
      const message =
        globalFilters.length > 0
          ? "没有找到符合筛选条件的小组哦"
          : "还没有任何小组，点击右上角“+”创建一个吧！";
      listEl.innerHTML = `<p style="text-align:center; color: #8a8a8a; padding: 50px 0;">${message}</p>`;
      return;
    }

    // --- 核心：图标生成器 (已修复：优先显示自定义图片) ---
    const renderGroupIcon = (group) => {
      const name = group.name;
      const iconInput = group.icon || ""; // 可能是emoji 或 URL

      // 1. 【最高优先级】检查是否是图片URL (http开头 或 data:开头)
      // 只要用户填了链接，不管它叫什么名字，都强制显示图片！
      if (iconInput.startsWith("http") || iconInput.startsWith("data:")) {
        return `<img src="${iconInput}" class="forum-group-custom-img">`;
      }

      // 2. 如果没有图片URL，再检查是否是【内置小组】，使用精美SVG
      const svgStyle = `width="24" height="24" fill="currentColor" viewBox="0 0 24 24"`;

      if (name.includes("娱乐") || name.includes("瓜")) {
        return `<div class="forum-group-icon-wrapper style-pink"><svg ${svgStyle}><path d="M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2-6-4.8-6 4.8 2.4-7.2-6-4.8h7.6z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg></div>`;
      }
      if (name.includes("灵异") || name.includes("鬼")) {
        return `<div class="forum-group-icon-wrapper style-purple"><svg ${svgStyle}><path d="M9 22v-2c0-1.1.9-2 2-2s2 .9 2 2v2M6 22v-4c0-1.1.9-2 2-2s2 .9 2 2v4M18 22v-4c0-1.1-.9-2-2-2s-2 .9-2 2v4M12 2a8 8 0 0 0-8 8v7a5 5 0 0 0 5 5h10a5 5 0 0 0 5-5v-7a8 8 0 0 0-8-8z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="9" cy="9" r="1"/><circle cx="15" cy="9" r="1"/></svg></div>`;
      }
      if (
        name.includes("crush") ||
        name.includes("梦") ||
        name.includes("恋") ||
        name.includes("心动")
      ) {
        return `<div class="forum-group-icon-wrapper style-red"><svg ${svgStyle}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="none" stroke="currentColor" stroke-width="2"/></svg></div>`;
      }
      if (name.includes("同人") || name.includes("文") || name.includes("写")) {
        return `<div class="forum-group-icon-wrapper style-blue"><svg ${svgStyle}><path d="M12 19l7-7 3 3-7 7-3-3z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M2 2l7.586 7.586" stroke="currentColor" stroke-width="2"/><circle cx="11" cy="11" r="2" fill="currentColor"/></svg></div>`;
      }
      if (name.includes("帮") || name.includes("选") || name.includes("助")) {
        return `<div class="forum-group-icon-wrapper style-orange"><svg ${svgStyle}><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke="currentColor" stroke-width="2"/><line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" stroke-width="2"/></svg></div>`;
      }

      // 3. 如果既不是URL，名字也没匹配到内置风格，就检查是不是 Emoji
      if (iconInput) {
        // 这里简单处理，直接显示输入的字符作为图标（用于Emoji）
        return `<div class="forum-group-icon-wrapper style-default" style="font-size: 24px; display: flex; align-items: center; justify-content: center;">${iconInput}</div>`;
      }

      // 4. 最后的默认 SVG (兜底)
      return `<div class="forum-group-icon-wrapper style-default"><svg ${svgStyle}><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" fill="none" stroke="currentColor" stroke-width="2"/></svg></div>`;
    };

    // --- 渲染列表 ---
    groupsToRender.forEach((group) => {
      const item = document.createElement("div");
      item.className = "forum-group-item";

      let categoriesHtml = "";
      if (group.categories && group.categories.length > 0) {
        categoriesHtml = `
                <div class="category-tag-container">
                    ${group.categories.map((cat) => `<span class="category-tag">#${cat}</span>`).join("")}
                </div>
            `;
      }

      item.innerHTML = `
            ${renderGroupIcon(group)}
            <div class="forum-group-info">
                <div class="forum-group-name">${group.name}</div>
                <div class="forum-group-desc">${group.description || "暂无简介"}</div>
                ${categoriesHtml}
            </div>
            <div class="forum-group-arrow">›</div>
        `;
      item.addEventListener("click", () => openGroup(group.id, group.name));
      addLongPressListener(item, () => showGroupActions(group.id, group.name));
      listEl.appendChild(item);
    });

    // 更新筛选按钮状态
    const filterBtn = document.getElementById("forum-filter-btn");
    if (filterBtn) {
      filterBtn.classList.toggle(
        "active",
        globalFilters && globalFilters.length > 0,
      );
    }
  }

  /**
   * 【全新】长按小组时显示操作菜单（编辑或删除）
   * @param {number} groupId - 小组的ID
   * @param {string} groupName - 小组的名称
   */
  async function showGroupActions(groupId, groupName) {
    // 调用你现有的弹窗函数，显示两个选项
    const choice = await showChoiceModal(`操作小组 "${groupName}"`, [
      { text: "✏️ 编辑小组信息", value: "edit" },
      { text: "🗑️ 删除小组", value: "delete" },
    ]);

    // 根据用户的选择，执行不同的操作
    if (choice === "edit") {
      // 如果用户选择“编辑”，就调用你原来的编辑函数
      openGroupEditor(groupId);
    } else if (choice === "delete") {
      // 如果用户选择“删除”，就调用你原来的删除函数
      deleteGroupAndPosts(groupId);
    }
  }

  async function openGroup(groupId, groupName) {
    window.activeGroupId = groupId;
    document.getElementById("group-screen-title").textContent = groupName;
    const fanficBar = document.getElementById("fanfic-preference-bar");

    if (groupName === "同人文小组") {
      fanficBar.style.display = "block";
      await populateFanficSelectors();
      await loadFanficPresets();

      const fanficContent = document.getElementById("fanfic-bar-content");
      const fanficToggle = document.getElementById("fanfic-bar-toggle-icon");
      if (fanficContent) fanficContent.classList.remove("collapsed");
      if (fanficToggle) fanficToggle.classList.remove("collapsed");
    } else {
      fanficBar.style.display = "none";
    }
    await renderGroupPosts(groupId);
    showScreen("group-screen");
  }

  /**
   * 【全新】将一个新创建的帖子元素添加到列表的顶部
   * @param {object} post - 包含ID的完整帖子对象
   */
  function prependNewPostElement(post) {
    const listEl = document.getElementById("group-post-list");

    // 检查列表当前是否显示“空空如也”的消息，如果是，就清空它
    const emptyMessage = listEl.querySelector("p");
    if (
      emptyMessage &&
      (emptyMessage.textContent.includes("还没有帖子") ||
        emptyMessage.textContent.includes("没有找到符合"))
    ) {
      listEl.innerHTML = "";
    }

    // 创建新帖子的DOM元素（这段代码与renderGroupPosts中的逻辑几乎一样）
    const commentCount = 0; // 新帖子的评论数永远是0
    const item = document.createElement("div");
    item.className = "forum-post-item";
    item.dataset.postId = post.id;

    let categoriesHtml = "";
    if (post.categories && post.categories.length > 0) {
      categoriesHtml = `
      <div class="category-tag-container">
          ${post.categories.map((cat) => `<span class="category-tag">#${cat}</span>`).join("")}
      </div>
    `;
    }

    item.innerHTML = `
      <div class="post-item-title">${post.title}</div>
      ${categoriesHtml}
      <div class="post-item-meta">
          <span>作者: ${post.author}</span>
          <span>评论: ${commentCount}</span>
      </div>
      <button class="forum-post-delete-btn" title="删除帖子">×</button>
  `;

    // 使用 prepend() 将新帖子添加到列表的【最前面】
    listEl.prepend(item);
  }

  // forum.js

  /**
   * 辅助函数：统一 AI 接口调用与容错
   */
  async function callAiForForum(prompt, systemInstruction = "") {
    const { proxyUrl, apiKey, model } = state.apiConfig;
    if (!proxyUrl || !apiKey || !model) {
      throw new Error("请先配置API！");
    }

    const isGemini = proxyUrl === GEMINI_API_URL || (proxyUrl && proxyUrl.includes("generativelanguage.googleapis.com"));
    const cleanedProxy = (proxyUrl || "https://api.openai.com").replace(/\/+$/, "");
    const effectiveKey = typeof getRandomValue === "function" ? getRandomValue(apiKey) : (apiKey.includes(",") ? apiKey.split(",")[0].trim() : apiKey.trim());
    const tempVal = parseFloat(state.apiConfig.temperature);
    const safeTemp = (!isNaN(tempVal) && tempVal >= 0 && tempVal <= 2) ? tempVal : 0.7;

    if (isGemini) {
      const cleanModel = (model || "gemini-1.5-flash").replace(/^models\//, "");
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${effectiveKey}`;
      const payload = {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: safeTemp
        }
      };
      if (systemInstruction) {
        payload.systemInstruction = { parts: [{ text: systemInstruction }] };
      }
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        throw new Error(`API请求失败: ${response.status} ${errText}`);
      }
      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      return rawText;
    } else {
      const requestUrl = cleanedProxy.endsWith("/v1") ? `${cleanedProxy}/chat/completions` : (cleanedProxy.includes("/chat/completions") ? cleanedProxy : `${cleanedProxy}/v1/chat/completions`);
      const messages = [];
      if (systemInstruction) {
        messages.push({ role: "system", content: systemInstruction });
      }
      messages.push({ role: "user", content: prompt });

      const bodyPayload = {
        model: model,
        messages: messages
      };
      
      const isO1O3 = model.toLowerCase().startsWith("o1") || model.toLowerCase().startsWith("o3") || model.toLowerCase().includes("reasoner");
      if (!isO1O3) {
        bodyPayload.temperature = safeTemp;
      }

      let response = await fetch(requestUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${effectiveKey}`
        },
        body: JSON.stringify(bodyPayload)
      });

      // 如果因为 system 消息导致 400 错误，自动降级为纯 user 消息重试
      if (!response.ok && systemInstruction && (response.status === 400 || response.status === 422)) {
        const fallbackMessages = [{ role: "user", content: `${systemInstruction}\n\n${prompt}` }];
        bodyPayload.messages = fallbackMessages;
        response = await fetch(requestUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${effectiveKey}`
          },
          body: JSON.stringify(bodyPayload)
        });
      }

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        throw new Error(`API请求失败: ${response.status} ${errText}`);
      }
      const data = await response.json();
      const rawText = data?.choices?.[0]?.message?.content || "";
      return rawText;
    }
  }

  /**
   * 辅助函数：强健的 JSON 提取与修复解析
   */
  function extractAndParseJson(text) {
    if (!text) throw new Error("AI返回内容为空");
    let cleaned = text.trim();
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/g, "").trim();

    try {
      return JSON.parse(cleaned);
    } catch (e1) {}

    const firstBrace = cleaned.indexOf("{");
    const firstBracket = cleaned.indexOf("[");
    let startIdx = -1;
    let endIdx = -1;

    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      startIdx = firstBrace;
      endIdx = cleaned.lastIndexOf("}");
    } else if (firstBracket !== -1) {
      startIdx = firstBracket;
      endIdx = cleaned.lastIndexOf("]");
    }

    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      const jsonSub = cleaned.slice(startIdx, endIdx + 1);
      try {
        return JSON.parse(jsonSub);
      } catch (e2) {}

      try {
        let fixed = jsonSub.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/g, (match) => {
          return match.replace(/\r?\n/g, "\\n").replace(/\t/g, "\\t");
        });
        fixed = fixed.replace(/,\s*([\}\]])/g, "$1");
        return JSON.parse(fixed);
      } catch (e3) {}
    }

    const result = {};
    const titleMatch = cleaned.match(/"(?:chapterTitle|title)"\s*:\s*"([^"]+)"/);
    if (titleMatch) result.chapterTitle = titleMatch[1];

    const seriesTitleMatch = cleaned.match(/"seriesTitle"\s*:\s*"([^"]+)"/);
    if (seriesTitleMatch) result.seriesTitle = seriesTitleMatch[1];

    const summaryMatch = cleaned.match(/"(?:chapterSummary|summary)"\s*:\s*"([^"]+)"/);
    if (summaryMatch) result.chapterSummary = summaryMatch[1];

    const isFinishedMatch = cleaned.match(/"isFinished"\s*:\s*(true|false)/i);
    if (isFinishedMatch) result.isFinished = isFinishedMatch[1].toLowerCase() === "true";

    const contentMatch = cleaned.match(/"(?:chapterContent|story|content)"\s*:\s*"([\s\S]*?)"(?:\s*,\s*"(?:categories|comments|isFinished)")/);
    if (contentMatch) {
      result.chapterContent = contentMatch[1].replace(/\\n/g, "\n").replace(/\\"/g, '"');
    } else {
      const rawContentMatch = cleaned.match(/"(?:chapterContent|story|content)"\s*:\s*"([\s\S]*)/);
      if (rawContentMatch) {
        let body = rawContentMatch[1];
        body = body.replace(/"\s*,?\s*"(?:categories|comments|isFinished)[\s\S]*$/, "");
        body = body.replace(/"\s*\}?\s*$/, "");
        result.chapterContent = body.replace(/\\n/g, "\n").replace(/\\"/g, '"');
      }
    }

    // 终极保底：如果解析不到 JSON，直接把整段文字清洗作为正文，绝不白屏或报错打断
    if (!result.chapterContent) {
      let fallbackText = cleaned.replace(/^\{[\s\S]*?"chapterContent"\s*:\s*"/i, "");
      fallbackText = fallbackText.replace(/"\s*\}?$/i, "");
      if (fallbackText.length > 20) {
        result.chapterContent = fallbackText;
      }
    }

    if (result.chapterContent || result.chapterTitle || result.seriesTitle) {
      return result;
    }

    return {
      seriesTitle: "新篇连载",
      chapterTitle: "第一章",
      chapterSummary: "故事开篇",
      chapterContent: cleaned
    };
  }

  /**
   * 渲染小组内的帖子列表：长篇小说自动折叠合并，短篇单独显示
   */
  async function renderGroupPosts(groupId) {
    const listEl = document.getElementById("group-post-list");
    if (!listEl) return;
    const targetGroupId = (groupId !== undefined && groupId !== null) ? groupId : (activeGroupId || window.activeGroupId);
    if (targetGroupId === undefined || targetGroupId === null || targetGroupId === "") {
      return;
    }
    const parsedGid = typeof targetGroupId === "number" ? targetGroupId : parseInt(targetGroupId, 10);
    if (typeof parsedGid !== "number" || isNaN(parsedGid)) {
      return;
    }

    let allPosts = [];
    try {
      allPosts = await db.forumPosts
        .where("groupId")
        .equals(parsedGid)
        .reverse()
        .sortBy("timestamp");
    } catch (e) {
      try {
        allPosts = await db.forumPosts
          .where("groupId")
          .equals(String(parsedGid))
          .reverse()
          .sortBy("timestamp");
      } catch (e2) {
        allPosts = [];
      }
    }
    listEl.innerHTML = "";

    const groupFilters = activeForumFilters && activeForumFilters.group ? activeForumFilters.group[groupId] : null;
    let postsToRender = allPosts;

    if (groupFilters && groupFilters.length > 0) {
      postsToRender = allPosts.filter(
        (post) =>
          post.categories &&
          post.categories.some((cat) => groupFilters.includes(cat)),
      );
    }

    if (postsToRender.length === 0) {
      const message =
        groupFilters && groupFilters.length > 0
          ? "没有找到符合筛选条件的帖子哦"
          : "这个小组还没有帖子哦";
      listEl.innerHTML = `<p style="text-align:center; color: #8a8a8a; padding: 50px 0;">${message}</p>`;
      return;
    }

    const processedSeriesIds = new Set();

    for (const post of postsToRender) {
      if (post.seriesId !== undefined && post.seriesId !== null && post.seriesId !== "") {
        const rawSeriesId = post.seriesId;
        const sId = (typeof rawSeriesId === "number" && !isNaN(rawSeriesId)) ? rawSeriesId : (isNaN(parseInt(rawSeriesId)) ? rawSeriesId : parseInt(rawSeriesId));
        if (processedSeriesIds.has(sId)) continue;
        processedSeriesIds.add(sId);

        let series = null;
        try {
          series = await db.forumSeries.get(sId);
        } catch (e) {}

        let chapters = [];
        try {
          chapters = await db.forumChapters
            .where("seriesId")
            .equals(sId)
            .sortBy("chapterIndex");
        } catch (e) {
          try {
            chapters = await db.forumChapters
              .where("seriesId")
              .equals(String(sId))
              .sortBy("chapterIndex");
          } catch (e2) {}
        }

        const seriesCard = document.createElement("div");
        seriesCard.className = "forum-series-accordion-card";
        seriesCard.style.cssText = "margin-bottom: 12px; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 12px; overflow: hidden; width: 100%; box-sizing: border-box; flex-shrink: 0;";

        const isFinished = !!series?.isFinished;
        const totalCh = chapters.length || 1;

        seriesCard.innerHTML = `
          <div class="series-accordion-header" style="padding: 12px 14px; cursor: pointer; display: flex; align-items: center; justify-content: space-between; gap: 8px; background: var(--secondary-bg, rgba(128,128,128,0.04));">
            <div style="min-width: 0; flex: 1;">
              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="font-weight: 600; font-size: 14px; color: var(--text-primary);">${series?.title || post.title}</span>
                <span style="font-size: 10px; color: var(--accent-color); border: 1px solid var(--accent-color); border-radius: 4px; padding: 0 4px;">连载</span>
                ${isFinished ? `<span style="font-size: 10px; color: var(--text-secondary); border: 1px solid var(--border-color); border-radius: 4px; padding: 0 4px;">完结</span>` : ""}
              </div>
              <div style="font-size: 11px; color: var(--text-secondary); margin-top: 3px;">
                <span>共 ${totalCh} 章</span>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <button type="button" data-delete-series-id="${post.seriesId}" title="删除" style="background: #ffffff; border: 1px solid var(--border-color, #d1d5db); color: var(--text-secondary, #6b7280); border-radius: 6px; padding: 2px 8px; font-size: 12px; font-weight: 500; cursor: pointer; height: 26px;">删除</button>
              <button type="button" class="mini-btn ${isFinished ? 'disabled' : 'primary'}" data-series-action="continue" data-series-id="${post.seriesId}" ${isFinished ? 'disabled' : ''} style="height: 26px; padding: 0 8px; font-size: 12px; border-radius: 6px;">${isFinished ? '已完结' : '追更'}</button>
              <svg class="series-accordion-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="transform: rotate(0deg); transition: transform 0.2s ease; color: var(--text-secondary); flex-shrink: 0;"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
          </div>
          <div class="series-accordion-content" style="display: none; padding: 6px 12px 10px; border-top: 1px solid var(--border-color); flex-direction: column; gap: 8px;">
            ${chapters.map((ch) => `
              <div class="series-chapter-card" style="display: flex; align-items: center; justify-content: space-between; padding: 8px 10px; border-radius: 8px; background: var(--card-bg); border: 1px solid var(--border-color); margin-top: 6px;">
                <div class="series-chapter-row" data-post-id="${ch.postId || ''}" data-series-id="${post.seriesId}" style="display: flex; align-items: center; justify-content: space-between; width: 100%; cursor: pointer;">
                  <div style="font-size: 13px; font-weight: 500; color: var(--text-primary); flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">第${ch.chapterIndex}章 ${ch.title || ''}</div>
                  <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0; margin-left: 8px;">
                    <button type="button" class="mini-btn" data-series-action="open-post" data-series-id="${post.seriesId}" data-post-id="${ch.postId || ''}" style="height: 24px; padding: 0 8px; font-size: 11px; border-radius: 6px;">阅读</button>
                    <button type="button" data-delete-chapter-id="${ch.id}" data-post-id="${ch.postId || ''}" data-series-id="${post.seriesId}" title="删除" style="background: #ffffff; border: 1px solid var(--border-color, #d1d5db); color: var(--text-secondary, #6b7280); border-radius: 6px; padding: 2px 8px; font-size: 11px; font-weight: 500; cursor: pointer; height: 24px;">删除</button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        `;

        const headerEl = seriesCard.querySelector(".series-accordion-header");
        const contentBox = seriesCard.querySelector(".series-accordion-content");
        const arrowIcon = seriesCard.querySelector(".series-accordion-arrow");

        headerEl.addEventListener("click", (e) => {
          if (e.target.closest("button") || e.target.closest(".forum-post-delete-btn")) return;
          const isHidden = contentBox.style.display === "none";
          contentBox.style.display = isHidden ? "flex" : "none";
          arrowIcon.style.transform = isHidden ? "rotate(180deg)" : "rotate(0deg)";
        });

        listEl.appendChild(seriesCard);
      } else {
        const commentCount = await db.forumComments
          .where("postId")
          .equals(parseInt(post.id))
          .count();

        const item = document.createElement("div");
        item.className = "forum-post-item";
        item.dataset.postId = post.id;

        const categoriesForDisplay = [...(post.categories || [])];
        if (post.lengthType === "short" && !categoriesForDisplay.includes("短篇")) {
          categoriesForDisplay.unshift("短篇");
        }

        let categoriesHtml = "";
        if (categoriesForDisplay.length > 0) {
          categoriesHtml = `
            <div class="category-tag-container">
              ${categoriesForDisplay.map((cat) => `<span class="category-tag">#${cat}</span>`).join("")}
            </div>
          `;
        }

        item.innerHTML = `
          <div class="post-item-title">${post.title}</div>
          ${categoriesHtml}
          <div class="post-item-meta">
            <span>作者: ${post.author}</span>
            <span>评论: ${commentCount}</span>
          </div>
          <button class="forum-post-delete-btn" title="删除帖子" style="background: #ffffff; border: 1px solid var(--border-color, #d1d5db); color: var(--text-secondary, #6b7280);">×</button>
        `;
        listEl.appendChild(item);
      }
    }

    listEl.querySelectorAll(".chapter-remark-input").forEach((input) => {
      input.addEventListener("click", (e) => e.stopPropagation());
      input.addEventListener("input", async (e) => {
        const postId = parseInt(e.target.dataset.postId);
        if (!isNaN(postId)) {
          const p = await db.forumPosts.get(postId);
          if (p) {
            p.remark = e.target.value;
            await db.forumPosts.put(p);
          }
        }
      });
    });

    const filterBtn = document.getElementById("group-filter-btn");
    if (filterBtn) {
      filterBtn.classList.toggle(
        "active",
        groupFilters && groupFilters.length > 0,
      );
    }
  }

  /**
   * 打开一个帖子，显示详情和评论
   */
  async function openPost(
    postId,
    returnContext = "group",
    returnSeriesId = null,
  ) {
    activeForumPostId = postId;
    postReturnContext = returnContext;
    activeSeriesId = returnSeriesId || activeSeriesId;
    await renderPostDetails(postId);
    showScreen("post-screen");
  }

  /**
   * 渲染帖子详情：包含复制、收藏以及自定义下一章提示词输入框
   */
  async function renderPostDetails(postId) {
    const contentEl = document.getElementById("post-detail-content");
    const post = await db.forumPosts.get(postId);
    const comments = await db.forumComments
      .where("postId")
      .equals(postId)
      .sortBy("timestamp");

    if (post?.groupId) {
      window.activeGroupId = post.groupId;
    }

    if (!post) {
      contentEl.innerHTML = "<p>帖子不存在或已被删除</p>";
      return;
    }

    let authorAvatarUrl;
    const userNickname = state.qzoneSettings.nickname || "我";

    if (post.author === userNickname) {
      authorAvatarUrl = state.qzoneSettings.avatar;
    } else {
      const authorChar = Object.values(state.chats).find(
        (c) => c.name === post.author,
      );
      if (authorChar) {
        authorAvatarUrl = authorChar.settings.aiAvatar;
      } else {
        authorAvatarUrl = window.getAvatarForName
          ? window.getAvatarForName(post.author)
          : "https://i.postimg.cc/PxZrFFFL/o-o-1.jpg";
      }
    }

    let seriesMetaHtml = "";
    let series = null;
    if (post.lengthType === "long" && post.seriesId) {
      series = await db.forumSeries.get(post.seriesId);
      const nextChapterIndex =
        (series?.lastChapterIndex || post.chapterIndex || 1) + 1;
      const isFinished = !!series?.isFinished;
      const continueText = isFinished
        ? "已完结"
        : `追更第${nextChapterIndex}章`;
      seriesMetaHtml = `
        <div class="post-series-bar" style="margin-bottom: 14px; padding: 10px 12px; background: var(--secondary-bg, rgba(128,128,128,0.05)); border: 1px solid var(--border-color); border-radius: 8px; display: flex; align-items: center; justify-content: space-between; gap: 8px;">
          <div class="series-meta">
            <div class="series-title" style="font-weight: 600; font-size: 13px; color: var(--text-primary);">${series?.title || post.title}</div>
            <div class="series-status" style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">当前章：第${post.chapterIndex || 1}章 · ${
              isFinished ? "已完结" : "连载中"
            }</div>
          </div>
          <div class="series-actions" style="display: flex; gap: 8px; align-items: center;">
            <button type="button" data-action="delete-chapter" data-post-id="${post.id}" data-series-id="${post.seriesId}" style="background: #ffffff; border: 1px solid var(--border-color, #d1d5db); color: var(--text-secondary, #6b7280); border-radius: 6px; padding: 4px 10px; font-size: 12px; font-weight: 500; cursor: pointer; height: 28px;">删除</button>
            <button type="button" class="mini-btn primary ${isFinished ? "disabled" : ""}" data-action="continue-series" data-series-id="${post.seriesId}" data-target-chapter="${nextChapterIndex}" ${isFinished ? "disabled" : ""} style="height: 28px; padding: 0 10px; font-size: 12px; border-radius: 6px;">${continueText}</button>
          </div>
        </div>
      `;
    }

    const cleanBody = (post.content || "").replace(/\n*【下一章生成指令\/提示词】[\s\S]*$/, "").trim();

    contentEl.innerHTML = `
        <div class="post-detail-header">
            <h1 class="post-main-title">${post.title}</h1>
            <div class="post-remark-container" style="margin: 8px 0 10px;">
              <input type="text" id="post-remark-input" class="moe-input" style="width: 100%; height: 32px; font-size: 12px; padding: 4px 10px; border-radius: 6px; border: 1px solid var(--border-color); background: var(--secondary-bg, rgba(128,128,128,0.05)); color: var(--text-primary); box-sizing: border-box;" placeholder="添加备注..." value="${post.remark || ''}">
            </div>
            <div class="post-user-info-row">
                <img src="${authorAvatarUrl}" class="post-author-avatar">
                <div class="post-detail-meta-group">
                    <span class="post-author-name">${post.author}</span>
                    <span class="post-publish-time">${new Date(post.timestamp).toLocaleString()}</span>
                </div>
            </div>
        </div>

        ${seriesMetaHtml}

        <div class="post-detail-body">${cleanBody.replace(/\n/g, "<br>")}</div>
        
        <div class="post-detail-actions-row" style="display: flex; gap: 12px; margin: 18px 0; justify-content: center; align-items: center;">
          <button type="button" class="mini-btn" id="post-copy-content-btn" style="flex: 1; max-width: 140px; height: 36px; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; display: flex; align-items: center; justify-content: center; background: var(--secondary-bg); color: var(--text-primary); border: 1px solid var(--border-color);">复制</button>
          ${post.seriesId ? `
          <button type="button" class="mini-btn primary" id="post-continue-next-btn" style="flex: 1; max-width: 140px; height: 36px; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; display: flex; align-items: center; justify-content: center; background-color: var(--accent-color); color: #ffffff; border: 1px solid var(--accent-color);">追更</button>
          ` : ""}
        </div>

        ${post.seriesId || post.lengthType === "long" ? `
        <div class="series-prompt-edit-card" style="margin: 14px 0; padding: 12px; background: var(--secondary-bg, rgba(128,128,128,0.06)); border-radius: 8px; border: 1px solid var(--border-color);">
          <div style="font-size: 12px; font-weight: 600; color: var(--text-primary); margin-bottom: 6px;">下一章提示词</div>
          <textarea id="series-custom-prompt-input" rows="2" style="width: 100%; border-radius: 6px; border: 1px solid var(--border-color); background: var(--card-bg); color: var(--text-primary); padding: 8px; font-size: 12px; resize: vertical; box-sizing: border-box;" placeholder="输入自定义下一章剧情要求或续写提示...">${series?.customContinuationPrompt || ""}</textarea>
        </div>
        ` : ""}
    `;

    const copyBtn = contentEl.querySelector("#post-copy-content-btn");
    if (copyBtn) {
      copyBtn.onclick = async () => {
        try {
          await navigator.clipboard.writeText(cleanBody);
          await showCustomAlert("复制成功", "正文已复制到剪贴板。");
        } catch (e) {
          await showCustomAlert("复制失败", "未能写入剪贴板。");
        }
      };
    }

    const continueNextBtn = contentEl.querySelector("#post-continue-next-btn");
    if (continueNextBtn && post.seriesId) {
      continueNextBtn.onclick = async () => {
        const curSeries = await db.forumSeries.get(post.seriesId);
        if (curSeries?.isFinished) {
          await showCustomAlert("提示", "这部连载已完结。");
          return;
        }
        const nextChapterIndex = (curSeries?.lastChapterIndex || post.chapterIndex || 1) + 1;
        await handleContinueSeries(post.seriesId, nextChapterIndex);
      };
    }

    const remarkInput = contentEl.querySelector("#post-remark-input");
    if (remarkInput) {
      remarkInput.oninput = async () => {
        post.remark = remarkInput.value;
        await db.forumPosts.put(post);
      };
    }

    const postFavBottomBtn = document.getElementById("post-fav-btn");
    const postFavBottomText = document.getElementById("post-fav-text");
    if (postFavBottomBtn) {
      postFavBottomBtn.classList.toggle("primary", !!post.isFavorite);
      if (postFavBottomText) {
        postFavBottomText.textContent = post.isFavorite ? "已收藏" : "收藏";
      }
      postFavBottomBtn.onclick = async () => {
        post.isFavorite = !post.isFavorite;
        await db.forumPosts.put(post);
        postFavBottomBtn.classList.toggle("primary", !!post.isFavorite);
        if (postFavBottomText) {
          postFavBottomText.textContent = post.isFavorite ? "已收藏" : "收藏";
        }
        await showCustomAlert(post.isFavorite ? "收藏成功" : "已取消", post.isFavorite ? "已加入收藏文章。" : "已从收藏文章中移除。");
      };
    }

    const promptInput = contentEl.querySelector("#series-custom-prompt-input");
    if (promptInput && post.seriesId) {
      promptInput.oninput = async () => {
        await db.forumSeries.update(post.seriesId, {
          customContinuationPrompt: promptInput.value
        });
      };
    }

    contentEl.querySelectorAll(".post-comment-item").forEach((item) => {
      item.addEventListener("click", () => {
        const commenterName = item.dataset.commenterName;
        const myNickname = state.qzoneSettings.nickname || "我";
        if (commenterName !== myNickname) {
          const commentInput = document.getElementById("post-comment-input");
          commentInput.placeholder = `回复 ${commenterName}:`;
          commentInput.dataset.replyTo = commenterName;
          commentInput.focus();
        }
      });
    });
  }

  /**
   * 【AI核心】为论坛帖子生成“豆瓣风格”的评论
   */
  async function generateForumComments() {
    const postIdToCommentOn = activeForumPostId;
    if (!postIdToCommentOn) return;

    await showCustomAlert("请稍候...", "正在召唤资深豆友前来围观...");

    const { proxyUrl, apiKey, model } = state.apiConfig;
    if (!proxyUrl || !apiKey || !model) {
      alert("请先在API设置中配置好才能生成内容哦！");
      return;
    }

    const post = await db.forumPosts.get(postIdToCommentOn);
    const existingComments = await db.forumComments
      .where("postId")
      .equals(postIdToCommentOn)
      .toArray();
    const group = await db.forumGroups.get(post.groupId);

    // ▼▼▼ 用下面这【一整块新代码】替换掉旧的 prompt 变量 ▼▼▼
    const prompt = `
# 任务
你是一个专业的“豆瓣小组资深用户模拟器”。你的任务是为名为“${
      group.name
    }”的论坛小组里的一个帖子，生成5条全新的、非常“豆瓣风格”的评论。

# 帖子信息
- 标题: ${post.title}
- 内容: ${post.content.substring(0, 300)}...
- 已有评论:
${existingComments.map((c) => `- ${c.author}: ${c.content}`).join("\n") || "(暂无评论)"}

# 【【【评论生成核心规则】】】
1.  **豆瓣风格**: 评论的语言风格必须非常地道，符合真实豆瓣网友的习惯。大量使用豆瓣黑话和网络用语，例如：
    - "同意楼上姐妹！"
    - "马了，感谢楼主分享"
    - "蹲一个后续"
    - "哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈" (大量的“哈”)
    - "这是可以说的吗？"
    - "码住"
    - "笑死，你是什么互联网嘴替"
    - "插眼"
    - "我先来，楼主好人一生平安"
2.  **互动性**: 生成的评论必须互相之间有互动。你可以回复楼主（作者: ${post.author}），也可以回复评论区的其他网友。
3.  **【【【昵称生成铁律】】】**: 评论者的昵称 ("author") 【必须】是你自己虚构的、随机的、生活化的、符合小组氛围的路人网友昵称。【绝对禁止】使用下方“公众人物列表”中的任何一个名字作为评论者。
4.  **格式铁律**: 你的回复【必须且只能】是一个严格的JSON数组，数组中包含5个对象。每个对象【必须】包含 "author" 和 "content" 两个字段，如果需要回复别人，可以加上 "replyTo" 字段。

# 公众人物列表 (他们是讨论的对象，但不是发帖人)
${Object.values(state.chats)
  .filter((c) => !c.isGroup)
  .map((c) => `- ${c.name}`)
  .join("\n")}

# JSON输出格式示例:
[
  {
    "author": "早睡早起身体好",
    "content": "同意楼上哥哥的，这个确实是这样！"
  },
  {
    "author": "momo",
    "content": "哈哈哈哈哈哈哈哈哈哈这是可以说的吗",
    "replyTo": "早睡早起身体好"
  }
]
`;
    // ▲▲▲ 替换结束 ▲▲▲

    const messagesForApi = [{ role: "user", content: prompt }];

    try {
      let isGemini = proxyUrl === GEMINI_API_URL;
      let geminiConfig = toGeminiRequestData(
        model,
        apiKey,
        prompt,
        messagesForApi,
        isGemini,
      );
      const response = isGemini
        ? await fetch(geminiConfig.url, geminiConfig.data)
        : await fetch(`${proxyUrl}/v1/chat/completions`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: model,
              messages: messagesForApi,
              temperature: parseFloat(state.apiConfig.temperature) || 0.8,
              response_format: { type: "json_object" },
            }),
          });
      if (!response.ok) throw new Error(`API请求失败: ${response.status}`);
      const data = await response.json();
      const rawContent = isGemini
        ? data.candidates[0].content.parts[0].text
        : data.choices[0].message.content;
      const cleanedContent = rawContent.replace(/^```json\s*|```$/g, "").trim();
      const newCommentsData = JSON.parse(cleanedContent);
      if (Array.isArray(newCommentsData) && newCommentsData.length > 0) {
        const commentsToAdd = newCommentsData.map((comment, index) => ({
          postId: postIdToCommentOn,
          author: comment.author || "路人",
          content: comment.content,
          replyTo: comment.replyTo || null,
          timestamp: Date.now() + index,
        }));
        await db.forumComments.bulkAdd(commentsToAdd);
        await showCustomAlert(
          "召唤成功！",
          `已成功召唤 ${commentsToAdd.length} 位豆友前来围观。`,
        );
      } else {
        throw new Error("AI返回的数据格式不正确。");
      }
    } catch (error) {
      console.error("生成小组评论失败:", error);
      await showCustomAlert("生成失败", `发生了一个错误：\n${error.message}`);
    } finally {
      await renderPostDetails(postIdToCommentOn);
    }
  }

  /**
   * 为帖子添加新评论 (支持回复)
   */
  async function handleAddComment() {
    if (!activeForumPostId) return;
    const input = document.getElementById("post-comment-input");
    const content = input.value.trim();
    if (!content) {
      alert("评论内容不能为空！");
      return;
    }
    const newComment = {
      postId: activeForumPostId,
      author: state.qzoneSettings.nickname || "我",
      content: content,
      timestamp: Date.now(),
    };
    if (input.dataset.replyTo) {
      newComment.replyTo = input.dataset.replyTo;
    }
    await db.forumComments.add(newComment);
    input.value = "";
    input.placeholder = "发布你的评论...";
    delete input.dataset.replyTo;
    await renderPostDetails(activeForumPostId);
  }

  /**
   * 获取所有可用于同人创作的角色列表
   */
  function getAvailableCharacters() {
    const user = { id: "user", name: state.qzoneSettings.nickname || "我" };
    const chars = Object.values(state.chats)
      .filter((c) => !c.isGroup)
      .map((c) => ({ id: c.id, name: c.name }));
    return [user, ...chars];
  }

  async function selectShareTarget(
    title = "分享到...",
    inputName = "share-target",
  ) {
    const modal = document.getElementById("share-target-modal");
    const listEl = document.getElementById("share-target-list");
    if (!modal || !listEl) {
      alert("未找到分享窗口组件");
      return null;
    }
    listEl.innerHTML = "";

    const allChats = Object.values(state.chats);
    if (allChats.length === 0) {
      listEl.innerHTML =
        '<p style="text-align:center; color:#999; padding:20px;">暂无聊天对象</p>';
    } else {
      allChats.forEach((chat) => {
        const item = document.createElement("div");
        item.className = "contact-picker-item";
        const avatarUrl = chat.isGroup
          ? chat.settings.groupAvatar || defaultGroupAvatar
          : chat.settings.aiAvatar || defaultAvatar;
        const typeLabel = chat.isGroup
          ? '<span style="font-size:10px; color:white; background:#007bff; padding:1px 4px; border-radius:4px; margin-left:5px;">群聊</span>'
          : "";
        item.innerHTML = `
          <input type="radio" name="${inputName}" value="${chat.id}" id="${inputName}-${chat.id}" style="margin-right: 15px;">
          <label for="${inputName}-${chat.id}" style="display:flex; align-items:center; width:100%; cursor:pointer;">
            <img src="${avatarUrl}" class="avatar">
            <span class="name">${chat.name} ${typeLabel}</span>
          </label>
        `;
        listEl.appendChild(item);
      });
    }

    document.getElementById("share-target-modal-title").textContent = title;
    modal.classList.add("visible");

    return await new Promise((resolve) => {
      const confirmBtn = document.getElementById("confirm-share-target-btn");
      const cancelBtn = document.getElementById("cancel-share-target-btn");
      const newConfirmBtn = confirmBtn.cloneNode(true);
      confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
      newConfirmBtn.onclick = () => {
        const selectedRadio = document.querySelector(
          `input[name="${inputName}"]:checked`,
        );
        if (!selectedRadio) {
          alert("请选择一个聊天对象！");
          return;
        }
        modal.classList.remove("visible");
        resolve(state.chats[selectedRadio.value]);
      };
      const handleCancel = () => {
        modal.classList.remove("visible");
        resolve(null);
      };
      if (cancelBtn) {
        const newCancelBtn = cancelBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        newCancelBtn.onclick = handleCancel;
      }
    });
  }

  function getPersonaByName(name) {
    if (!name) return "一个普通人";
    if (name === state.qzoneSettings.nickname) {
      return state.qzoneSettings.weiboUserPersona || "一个普通人";
    }
    const target = Object.values(state.chats).find((c) => c.name === name);
    return target?.settings?.aiPersona || "一个普通人";
  }

  /**
   * 填充同人文小组的CP选择器
   */
  async function populateFanficSelectors() {
    const charList = getAvailableCharacters();
    const select1 = document.getElementById("fanfic-char1-select");
    const select2 = document.getElementById("fanfic-char2-select");
    select1.innerHTML = "";
    select2.innerHTML = "";
    charList.forEach((char) => {
      const option1 = document.createElement("option");
      option1.value = char.name;
      option1.textContent = char.name;
      select1.appendChild(option1);
      const option2 = document.createElement("option");
      option2.value = char.name;
      option2.textContent = char.name;
      select2.appendChild(option2);
    });
    if (charList.length > 1) {
      select1.selectedIndex = 0;
      select2.selectedIndex = 1;
    }
  }

  // ▼▼▼ 【修改点 3】生成AI内容时，使用全局变量 ▼▼▼
  async function handleGenerateGroupContent() {
    const groupIdToGenerateFor = window.activeGroupId; // 【修改】使用 window.activeGroupId
    if (!groupIdToGenerateFor) return;

    const group = await db.forumGroups.get(groupIdToGenerateFor);
    if (!group) return;

    if (group.name === "梦角小组") {
      await generateDreamPost(groupIdToGenerateFor);
    } else if (group.name === "娱乐小组") {
      await generateEntertainmentGroupContent(groupIdToGenerateFor);
    } else if (group.name === "同人文小组") {
      await generateFanfic(groupIdToGenerateFor);
    } else {
      await generateForumContentWithAPI(groupIdToGenerateFor, group.name);
    }
  }

  // ▼▼▼ 用这块【V5 | 最终原创分类版】代码，完整替换旧的 generateForumContentWithAPI 函数 ▼▼▼

  /**
   * 【AI核心 - V5 世界观+原创分类版】为通用小组生成内容
   */
  async function generateForumContentWithAPI(groupId, groupName) {
    if (!groupId) return;

    // --- 1. 获取小组的世界观 ---
    const group = await db.forumGroups.get(groupId);
    if (!group) {
      alert("错误：找不到该小组！");
      return;
    }
    const worldview = group.worldview || "";

    await showCustomAlert("请稍候...", `AI正在为“${groupName}”小组寻找灵感...`);

    const { proxyUrl, apiKey, model } = state.apiConfig;
    if (!proxyUrl || !apiKey || !model) {
      alert("请先在API设置中配置好才能生成内容哦！");
      return;
    }

    let worldviewContext = "";
    if (worldview.trim()) {
      worldviewContext = `
# 小组专属世界观 (你必须严格遵守)
${worldview}
`;
    }

    const passerbyPostCount = 5;

    // --- ▼▼▼ 【核心修改】彻底重写Prompt指令 ---
    const prompt = `
# 任务
你是一个专业的“论坛内容生成器”。你的任务是为名为“${groupName}”的论坛小组，生成【${passerbyPostCount}条】全新的、有趣的、符合小组主题的帖子，并为每条帖子生成2-3条符合情景的评论。

${worldviewContext}

# 核心规则
1.  **主题相关**: 所有帖子的标题、内容和评论都必须与小组主题“${groupName}”高度相关。
2.  **【【【分类铁律】】】**: 你【必须】为每一条帖子，根据其【具体内容】，原创1-2个高度相关的分类标签。绝对不要使用任何预设的、固定的分类列表。
    - 例如，如果帖子是讨论设定的，分类可以是 ["设定讨论"]。
    - 如果帖子是分析剧情的，分类可以是 ["剧情分析"]。
    - 如果帖子是闲聊，分类可以是 ["闲聊水"]。
3.  **作者随机**: 每条帖子的作者都必须是你虚构的、符合小组氛围的路人网友。
4.  **格式铁律**: 你的回复【必须且只能】是一个严格的JSON数组，数组中包含【${passerbyPostCount}个】帖子对象。每个对象【必须】包含 "author", "title", "content", "categories", 和 "comments" 字段。
    - "categories" 字段【必须】是你为这条帖子原创的分类数组。
    - "comments" 字段的值【必须】是一个对象数组，每个对象包含 "author" 和 "content" 字段。

# JSON输出格式示例:
[
  {
    "author": "早睡早起身体好",
    "title": "关于世界观里XX设定的一个疑问",
    "content": "我刚刚在看世界观设定，里面提到XX是蓝色的，但是在另一处又说是绿色的...",
    "categories": ["设定讨论", "剧情分析"],
    "comments": [
      {"author": "路人甲", "content": "我也发现了！蹲一个解答。"}
    ]
  }
]
`;
    // --- ▲▲▲ 更新结束 ▲▲▲ ---

    const messagesForApi = [{ role: "user", content: prompt }];

    try {
      let isGemini = proxyUrl === GEMINI_API_URL;
      let geminiConfig = toGeminiRequestData(
        model,
        apiKey,
        prompt,
        messagesForApi,
        isGemini,
      );
      const response = isGemini
        ? await fetch(geminiConfig.url, geminiConfig.data)
        : await fetch(`${proxyUrl}/v1/chat/completions`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: model,
              messages: messagesForApi,
              temperature: parseFloat(state.apiConfig.temperature) || 0.8,
              response_format: { type: "json_object" },
            }),
          });

      if (!response.ok) throw new Error(`API请求失败: ${response.status}`);

      const data = await response.json();
      const rawContent = isGemini
        ? data.candidates[0].content.parts[0].text
        : data.choices[0].message.content;
      const cleanedContent = rawContent.replace(/^```json\s*|```$/g, "").trim();
      const newPostsData = JSON.parse(cleanedContent);

      if (Array.isArray(newPostsData) && newPostsData.length > 0) {
        let totalPosts = 0;
        let totalComments = 0;
        for (const postData of newPostsData) {
          // --- 3. 保存帖子时，也保存AI原创的分类 ---
          const newPost = {
            groupId: groupId,
            title: postData.title,
            content: postData.content,
            author: postData.author,
            timestamp: Date.now() + totalPosts,
            categories: postData.categories || [], // 保存原创分类
          };
          const postId = await db.forumPosts.add(newPost);
          totalPosts++;

          if (postData.comments && Array.isArray(postData.comments)) {
            const commentsToAdd = postData.comments
              .map((comment) => {
                if (
                  typeof comment === "object" &&
                  comment !== null &&
                  comment.author &&
                  comment.content
                ) {
                  return {
                    postId: postId,
                    author: comment.author,
                    content: comment.content,
                    timestamp: Date.now() + totalPosts + totalComments++,
                  };
                }
                return null;
              })
              .filter(Boolean);

            if (commentsToAdd.length > 0) {
              await db.forumComments.bulkAdd(commentsToAdd);
            }
          }
        }
        await showCustomAlert(
          "生成成功！",
          `已为“${groupName}”小组生成了 ${totalPosts} 条新帖子和 ${totalComments} 条评论。`,
        );
        await renderGroupPosts(groupId);
      } else {
        throw new Error("AI没有返回任何有效的数据。");
      }
    } catch (error) {
      console.error("生成小组内容失败:", error);
      await showCustomAlert("生成失败", `发生了一个错误：\n${error.message}`);
    }
  }
  /**
   * 【V12 | 拆分文风与类型版】
   */
  async function generateFanfic(groupId) {
    if (!groupId) {
      console.error("generateFanfic called without a groupId!");
      alert("发生内部错误：生成同人时未能指定小组ID。");
      return;
    }
    const char1Name = document.getElementById("fanfic-char1-select").value;
    const char2Name = document.getElementById("fanfic-char2-select").value;

    // 获取分离后的参数
    const wordCountReq = document
      .getElementById("fanfic-wordcount-input")
      .value.trim();
    const typeReq = document.getElementById("fanfic-type-input").value.trim(); // 类型：ABO, 甜文
    const styleReq = document.getElementById("fanfic-style-input").value.trim(); // 文风：细腻, 华丽
    const worldviewPreference = document
      .getElementById("fanfic-worldview-input")
      .value.trim();
    const lengthMode = (
      document.getElementById("fanfic-length-select")?.value || "short"
    ).toLowerCase();

    if (char1Name === char2Name) {
      alert("请选择两个不同的角色！");
      return;
    }

    const { proxyUrl, apiKey, model } = state.apiConfig;
    if (!proxyUrl || !apiKey || !model) {
      alert("请先配置API！");
      return;
    }

    const allChars = getAvailableCharacters();
    const char1Data = allChars.find((c) => c.name === char1Name);
    const char2Data = allChars.find((c) => c.name === char2Name);

    let char1Persona = "";
    let char2Persona = "";

    if (char1Name === state.qzoneSettings.nickname) {
      char1Persona = state.qzoneSettings.weiboUserPersona || "一个普通人";
    } else {
      char1Persona =
        state.chats[char1Data.id]?.settings.aiPersona || "一个普通人";
    }

    if (char2Name === state.qzoneSettings.nickname) {
      char2Persona = state.qzoneSettings.weiboUserPersona || "一个普通人";
    } else {
      char2Persona =
        state.chats[char2Data.id]?.settings.aiPersona || "一个普通人";
    }
    const userPersona = state.qzoneSettings.weiboUserPersona || "一个普通人";

    await generateLongFanficSeries({
      groupId,
      char1Name,
      char2Name,
      char1Persona,
      char2Persona,
      userPersona,
      wordCountReq,
      typeReq,
      styleReq,
      worldviewPreference,
    });
  }

  async function generateLongFanficSeries(options) {
    const {
      groupId,
      char1Name,
      char2Name,
      char1Persona,
      char2Persona,
      userPersona,
      wordCountReq,
      typeReq,
      styleReq,
      worldviewPreference,
    } = options;

    await showCustomAlert(
      "正在开坑...",
      `为【${char1Name}x${char2Name}】创作长篇连载的第一章...`,
    );

    const { proxyUrl, apiKey, model } = state.apiConfig;
    if (!proxyUrl || !apiKey || !model) {
      alert("请先配置API！");
      return;
    }

    let contextInstructions = "";
    if (typeReq) contextInstructions += `- 题材/类型：${typeReq}\n`;
    if (styleReq) contextInstructions += `- 文风/写作规范：${styleReq}\n`;
    if (worldviewPreference)
      contextInstructions += `- 世界观/剧情设定：${worldviewPreference}\n`;
    const lengthInstruction = wordCountReq
      ? `第一章的长度尽量接近【${wordCountReq}】，允许略有浮动。`
      : "第一章至少1200字，并埋下后续伏笔。";
    const seriesAuthor =
      getRandomItem([
        "隔壁文手",
        "星河写手",
        "匿名太太",
        "笔名未定",
        "拾字人",
      ]) || "匿名太太";

    const prompt = `
你是一位专业的同人连载作者。请为角色A和角色B创作一部长篇连载小说，先写出完整的第一章，并给出简短摘要，方便后续续写。

# 角色与人设
- 角色A (${char1Name}): ${char1Persona}
- 角色B (${char2Name}): ${char2Persona}
- 用户: ${userPersona}

# 命名要求
书名必须朴实无华、自然生动（例如《旧日微光》《夏日风》《重逢》《同桌》《小城》《春日信》等2-6字朴素名字），严禁使用浮夸生僻、中二堆砌或带有特殊符号的名字。

# 写作要求
${contextInstructions || "- 自由发挥，保持连载节奏，注重人物心理与细节互动。"}
- ${lengthInstruction}
- 第一章需要有清晰的开篇冲突或吸引点，同时保留未解的线索。
- 评论：为本章生成 5-8 条读者评论，语言自然有代入感。

# 输出格式规范（必须严格输出纯 JSON 对象，禁止包裹任何其他说明）
{
  "seriesTitle": "朴实自然的书名",
  "chapterTitle": "第一章标题",
  "chapterSummary": "用3-5句概括本章剧情要点",
  "chapterContent": "第一章完整正文，正文换行用\\n表示",
  "categories": ["标签1", "标签2"],
  "comments": [
    {"author": "读者A", "content": "短评内容"},
    {"author": "读者B", "content": "短评内容"}
  ]
}
请严格只返回上述纯 JSON 对象。`;

    try {
      const rawContent = await callAiForForum(prompt);
      let parsed;
      try {
        parsed = extractAndParseJson(rawContent);
      } catch (e) {
        console.error("解析长篇连载返回数据失败", e);
        throw new Error("AI返回了无效的JSON格式。");
      }

      let seriesTitle = (parsed.seriesTitle || `${char1Name}与${char2Name}`).replace(/[《》]/g, "").trim();
      const chapterTitle = (parsed.chapterTitle || "第一章").replace(/^第\d+章\s*/i, "").trim();
      const rawChapterContent =
        parsed.chapterContent ||
        parsed.story ||
        parsed.content ||
        "这一章的正文生成失败，请重试。";
      const chapterContent = rawChapterContent.replace(/\n*【下一章生成指令\/提示词】[\s\S]*$/, "").trim();
      const chapterSummary = parsed.chapterSummary || "";
      const baseCategories = Array.isArray(parsed.categories)
        ? parsed.categories
        : [];
      const postCategories = Array.from(
        new Set(["长篇", "连载", ...baseCategories]),
      );
      const timestamp = Date.now();

      const seriesId = await db.forumSeries.add({
        groupId,
        title: seriesTitle,
        pairing: `${char1Name}x${char2Name}`,
        char1Name,
        char2Name,
        char1Persona,
        char2Persona,
        userPersona,
        worldview: worldviewPreference,
        type: typeReq,
        style: styleReq,
        wordCount: wordCountReq,
        isFollowed: false,
        bookshelfAddedAt: null,
        createdAt: timestamp,
        updatedAt: timestamp,
        lastChapterIndex: 1,
        seriesAuthor,
        isFinished: false,
        customContinuationPrompt: `请基于第一章《${chapterTitle}》结尾，继续生成《${seriesTitle}》的第二章内容，保持角色性格与剧情走向。`,
      });

      const postId = await db.forumPosts.add({
        groupId: groupId,
        title: `《${seriesTitle}》 第1章 ${chapterTitle}`,
        content: chapterContent,
        author: seriesAuthor,
        timestamp,
        categories: postCategories,
        lengthType: "long",
        seriesId,
        chapterIndex: 1,
      });

      const chapterId = await db.forumChapters.add({
        seriesId,
        chapterIndex: 1,
        title: chapterTitle,
        summary: chapterSummary,
        content: chapterContent,
        createdAt: timestamp,
        postId,
      });

      await db.forumSeries.update(seriesId, {
        lastChapterId: chapterId,
        firstChapterId: chapterId,
      });

      if (parsed.comments && Array.isArray(parsed.comments)) {
        const commentsToAdd = parsed.comments
          .filter((c) => c && c.content)
          .map((c, idx) => ({
            postId,
            author: c.author || "路人",
            content: c.content,
            timestamp: timestamp + idx + 1,
          }));
        if (commentsToAdd.length > 0) {
          await db.forumComments.bulkAdd(commentsToAdd);
        }
      }

      await renderGroupPosts(groupId);
      await showCustomAlert(
        "创作完成！",
        `已生成连载《${seriesTitle}》的第一章，打开帖子即可追更。`,
      );
    } catch (error) {
      console.error("生成长篇连载失败:", error);
      await showCustomAlert("创作失败", `发生了一个错误：\n${error.message}`);
    }
  }

  async function generateSeriesShareSummary(series, chapters, latestChapter) {
    const { proxyUrl, apiKey, model } = state.apiConfig;
    if (!proxyUrl || !apiKey || !model) {
      return {
        summary: series.worldview || "这是一部正在连载的故事。",
        highlights: [],
        latestExcerpt: (latestChapter.content || "").slice(0, 120),
      };
    }

    const chapterSummaries = chapters
      .map(
        (ch) =>
          `第${ch.chapterIndex}章《${ch.title || ""}》摘要：${ch.summary || (ch.content || "").slice(0, 80)}`,
      )
      .join("\n");
    const latestContent = (latestChapter.content || "").slice(0, 1500);

    const prompt = `
你是一个精简的编辑助手，请为下述连载生成分享用信息，输出严格的JSON：
{
  "summary": "120-180字中文摘要，概括整体剧情与基调",
  "highlights": ["亮点1","亮点2","亮点3"],
  "latestExcerpt": "从最新章节提炼80-120字的节选，保留原文口吻"
}

# 连载信息
标题：${series.title || series.pairing || "未命名连载"}
CP：${series.pairing || `${series.char1Name || ""}x${series.char2Name || ""}`}
状态：${series.isFinished ? "已完结" : "连载中"}，共 ${chapters.length} 章

# 历史摘要
${chapterSummaries || "暂无摘要"}

# 最新章节
标题：${latestChapter.title || "未命名章节"}
内容（截断）：${latestContent}
仅输出JSON。`;

    const messagesForApi = [{ role: "user", content: prompt }];
    try {
      let isGemini = proxyUrl === GEMINI_API_URL;
      let geminiConfig = toGeminiRequestData(
        model,
        apiKey,
        prompt,
        messagesForApi,
        isGemini,
      );
      const response = isGemini
        ? await fetch(geminiConfig.url, geminiConfig.data)
        : await fetch(`${proxyUrl}/v1/chat/completions`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: model,
              messages: messagesForApi,
              temperature: parseFloat(state.apiConfig.temperature) || 0.5,
              response_format: { type: "json_object" },
            }),
          });
      if (!response.ok) throw new Error(`API请求失败: ${response.status}`);
      const data = await response.json();
      const rawContent = isGemini
        ? data.candidates[0].content.parts[0].text
        : data.choices[0].message.content;
      const cleaned = rawContent.replace(/^```json\s*|```$/g, "").trim();
      const parsed = JSON.parse(cleaned);
      return {
        summary:
          parsed.summary || series.worldview || "这是一部正在连载的故事。",
        highlights: Array.isArray(parsed.highlights) ? parsed.highlights : [],
        latestExcerpt: parsed.latestExcerpt || latestContent.slice(0, 120),
      };
    } catch (e) {
      console.error("生成分享摘要失败", e);
      return {
        summary: series.worldview || "这是一部正在连载的故事。",
        highlights: [],
        latestExcerpt: latestContent.slice(0, 120),
      };
    }
  }

  async function shareSeriesToChat(seriesId) {
    const series = await db.forumSeries.get(seriesId);
    if (!series) {
      alert("未找到该书籍/连载");
      return;
    }
    const chapters = await db.forumChapters
      .where("seriesId")
      .equals(seriesId)
      .sortBy("chapterIndex");
    if (!chapters.length) {
      alert("这个连载还没有章节，无法分享");
      return;
    }
    const latestChapter = chapters[chapters.length - 1];

    const summaryData = await generateSeriesShareSummary(
      series,
      chapters,
      latestChapter,
    );

    const targetChat = await selectShareTarget(
      "分享书籍到...",
      "series-share-target",
    );
    if (!targetChat) return;

    const statusText = series.isFinished ? "已完结" : "连载中";
    const highlightsText =
      summaryData.highlights && summaryData.highlights.length
        ? `\n亮点：\n${summaryData.highlights.map((h) => `- ${h}`).join("\n")}`
        : "";
    const messageContent = `【连载分享】${series.title || series.pairing || "未命名连载"}\nCP：${
      series.pairing || ""
    }\n状态：${statusText} | 共${chapters.length}章\n最新：第${latestChapter.chapterIndex}章 ${
      latestChapter.title || ""
    }\n\n摘要：${summaryData.summary}${highlightsText}\n\n最新章节全文：\n${latestChapter.content || ""}`;

    const userMessage = {
      role: "user",
      senderName: targetChat.isGroup
        ? targetChat.settings.myNickname || "我"
        : "我",
      type: "series_share",
      timestamp: Date.now(),
      content: messageContent,
      payload: {
        seriesId,
        latestPostId: latestChapter.postId,
        latestChapterIndex: latestChapter.chapterIndex,
        latestTitle: latestChapter.title,
        summary: summaryData.summary,
        highlights: summaryData.highlights || [],
        seriesTitle: series.title || series.pairing || "未命名连载",
        pairing:
          series.pairing ||
          `${series.char1Name || ""}x${series.char2Name || ""}`,
        statusText,
        chapterCount: chapters.length,
      },
    };
    targetChat.history.push(userMessage);

    const hiddenInstruction = {
      role: "system",
      isHidden: true,
      timestamp: Date.now() + 1,
      content: `[系统指令] 请阅读用户分享的连载信息，并基于摘要与最新章节节选给出你的看法/建议。连载状态：${statusText}。`,
    };
    targetChat.history.push(hiddenInstruction);

    await db.chats.put(targetChat);
    await showCustomAlert(
      "分享成功",
      `已将《${series.title || "这部连载"}》分享给“${targetChat.name}”。`,
    );
    openChat(targetChat.id);
    triggerAiResponse();
  }

  // ▼▼▼ 用这个【V2版】替换旧的 openCreateForumPostModal 函数 ▼▼▼
  /**
   * 打开创建帖子的模态框
   */
  async function openCreateForumPostModal() {
    resetCreatePostModal();
    const modal = document.getElementById("create-post-modal");
    modal.dataset.mode = "forum";
    document.getElementById("create-post-modal-title").textContent =
      "发布新帖子";
    document.getElementById("post-public-text").placeholder =
      "请输入帖子内容...";

    // 隐藏所有不需要的控件
    modal.querySelector(".post-mode-switcher").style.display = "none";
    modal.querySelector("#image-mode-content").style.display = "none";
    modal.querySelector("#text-image-mode-content").style.display = "none";
    modal.querySelector("#post-comments-toggle-group").style.display = "none";
    modal.querySelector("#post-visibility-group").style.display = "none";

    const publicTextGroup =
      document.getElementById("post-public-text").parentElement;

    // --- 动态添加或显示“标题”输入框 ---
    let titleGroup = document.getElementById("forum-post-title-group");
    if (!titleGroup) {
      titleGroup = document.createElement("div");
      titleGroup.className = "form-group";
      titleGroup.id = "forum-post-title-group";
      titleGroup.innerHTML = `
            <label for="forum-post-title-input">标题</label>
            <input type="text" id="forum-post-title-input" placeholder="请输入帖子标题...">
        `;
      publicTextGroup.parentNode.insertBefore(titleGroup, publicTextGroup);
    }
    document.getElementById("forum-post-title-input").value = "";

    // --- ▼▼▼ 【核心新增】动态添加“分类”输入框 ▼▼▼ ---
    let categoryGroup = document.getElementById("forum-post-category-group");
    if (!categoryGroup) {
      categoryGroup = document.createElement("div");
      categoryGroup.className = "form-group";
      categoryGroup.id = "forum-post-category-group";
      categoryGroup.innerHTML = `
            <label for="forum-post-category-input">帖子分类 (用#号分隔)</label>
            <input type="text" id="forum-post-category-input" placeholder="例如: #剧情讨论 #角色分析">
        `;
      // 将分类输入框插入到“内容”输入框之后
      publicTextGroup.parentNode.insertBefore(
        categoryGroup,
        publicTextGroup.nextSibling,
      );
    }
    document.getElementById("forum-post-category-input").value = "";
    // --- ▲▲▲ 新增结束 ▲▲▲ ---

    modal.classList.add("visible");
  }
  // ▲▲▲ 替换结束 ▲▲▲

  // ▼▼▼ 【修改点 2】发布帖子时，使用全局变量 ▼▼▼
  async function handleCreateForumPost() {
    const title = document
      .getElementById("forum-post-title-input")
      .value.trim();
    const content = document.getElementById("post-public-text").value.trim();
    if (!title || !content) {
      alert("帖子标题和内容都不能为空哦！");
      return;
    }

    const categoryInput = document
      .getElementById("forum-post-category-input")
      .value.trim();
    const categories = categoryInput
      ? categoryInput.match(/#(\S+)/g)?.map((tag) => tag.substring(1)) || []
      : [];

    const newPost = {
      groupId: window.activeGroupId, // 【修改】这里必须用 window.activeGroupId
      title: title,
      content: content,
      author: state.qzoneSettings.nickname || "我",
      timestamp: Date.now(),
      categories: categories,
      lengthType: "short",
      seriesId: null,
      chapterIndex: null,
    };

    // 1. 将数据库 add() 操作返回的【ID】捕获到一个变量中。
    const postId = await db.forumPosts.add(newPost);
    // 2. 将这个ID赋值回我们的 newPost 对象
    newPost.id = postId;

    // 3. 关闭发帖弹窗。
    document.getElementById("create-post-modal").classList.remove("visible");

    // 4. 将新帖子显示在列表顶部
    prependNewPostElement(newPost);

    // 5. 给出成功提示。
    alert("帖子发布成功！");
  }
  window.handleCreateForumPost = handleCreateForumPost;
  /**
   * 删除一个小组及其所有内容
   */
  async function deleteGroupAndPosts(groupId) {
    const group = await db.forumGroups.get(groupId);
    if (!group) return;
    const confirmed = await showCustomConfirm(
      "确认删除",
      `确定要删除小组“${group.name}”吗？此操作将同时删除该小组内的【所有帖子和评论】，且无法恢复！`,
      { confirmButtonClass: "btn-danger" },
    );
    if (confirmed) {
      try {
        const postsToDelete = await db.forumPosts
          .where("groupId")
          .equals(groupId)
          .toArray();
        const postIds = postsToDelete.map((p) => p.id);
        if (postIds.length > 0) {
          await db.forumComments.where("postId").anyOf(postIds).delete();
        }
        await db.forumPosts.where("groupId").equals(groupId).delete();
        await db.forumGroups.delete(groupId);
        await renderForumScreen();
        alert(`小组“${group.name}”及其所有内容已删除。`);
      } catch (error) {
        console.error("删除小组时出错:", error);
        alert(`删除失败: ${error.message}`);
      }
    }
  }

  /**
   * 【全能转发版】"转载"功能：将帖子内容分享到单聊或群聊
   */
  async function repostToChat() {
    if (!activeForumPostId) return;
    const post = await db.forumPosts.get(activeForumPostId);
    if (!post) {
      alert("找不到要转载的帖子！");
      return;
    }

    const targetChat = await selectShareTarget(
      "转载帖子到...",
      "repost-target",
    );
    if (!targetChat) return;
    const targetChatId = targetChat.id;

    const myNickname = targetChat.isGroup
      ? targetChat.settings.myNickname || "我"
      : "我";

    // 1. 创建对用户可见的转载卡片消息
    const repostMessage = {
      role: "user",
      senderName: myNickname, // 确保群聊里显示正确的发送者名字
      type: "repost_forum_post",
      timestamp: Date.now(),
      content: `[转载的帖子]\nID为${post.id}\n标题: 《${post.title}》\n作者: ${post.author}\n内容: ${post.content}\n请对这个帖子发表评论。`,
      payload: {
        postId: post.id,
        title: post.title,
        author: post.author,
        content: post.content.substring(0, 100) + "...",
      },
    };
    targetChat.history.push(repostMessage);

    // 2. 创建给【AI看】的隐藏指令
    // 注意：这里稍微修改了提示词，以适应群聊场景（群聊AI会自动决定谁来回复）
    const instructionContent = targetChat.isGroup
      ? `[系统指令：用户(${myNickname})刚刚向群里转载了一个ID为【${post.id}】的小组帖子，内容如下。群里的成员们【必须】阅读该帖子，并根据各自的人设，使用 'forum_comment' 指令对帖子发表评论或讨论。]\n\n--- 帖子开始 ---\n标题: ${post.title}\n作者: ${post.author}\n内容: ${post.content}\n--- 帖子结束 ---`
      : `[系统指令：用户刚刚向你分享了一个ID为【${post.id}】的小组帖子，内容如下。你的任务是【必须】对这个帖子发表评论。请【立刻】使用 'forum_comment' 指令完成此任务，并确保在指令中包含正确的 "postId": ${post.id}。]\n\n--- 帖子开始 ---\n标题: ${post.title}\n作者: ${post.author}\n内容: ${post.content}\n--- 帖子结束 ---`;

    const hiddenInstructionMessage = {
      role: "system",
      content: instructionContent,
      timestamp: Date.now() + 1,
      isHidden: true,
    };
    targetChat.history.push(hiddenInstructionMessage);

    // 3. 保存、关闭弹窗、跳转
    await db.chats.put(targetChat);

    await showCustomAlert(
      "转载成功",
      `已成功将帖子转载给“${targetChat.name}”！`,
    );

    // 跳转到对应的聊天界面
    openChat(targetChatId);
    // 自动触发AI响应（对于群聊，这会触发群友讨论帖子）
    triggerAiResponse();
  }
  // --- 同人文预设与UI逻辑 ---

  // 初始化/加载同人文预设
  async function loadFanficPresets() {
    const select = document.getElementById("fanfic-preset-select");
    select.innerHTML = '<option value="">-- 选择预设 --</option>';

    // 确保全局设置里有这个字段
    if (!state.globalSettings.fanficPresets) {
      state.globalSettings.fanficPresets = [];
    }

    state.globalSettings.fanficPresets.forEach((preset, index) => {
      const option = document.createElement("option");
      option.value = index; // 使用索引作为 value
      option.textContent = preset.name;
      select.appendChild(option);
    });
  }

  async function saveCurrentFanficPreset() {
    const name = await showCustomPrompt("保存预设", "请为当前配置起个名字：");
    if (!name) return;

    const preset = {
      name: name.trim(),
      char1: document.getElementById("fanfic-char1-select").value,
      char2: document.getElementById("fanfic-char2-select").value,
      wordCount: document.getElementById("fanfic-wordcount-input").value,
      type: document.getElementById("fanfic-type-input").value, // 新增：类型
      style: document.getElementById("fanfic-style-input").value, // 新增：文风
      worldview: document.getElementById("fanfic-worldview-input").value,
    };

    if (!state.globalSettings.fanficPresets)
      state.globalSettings.fanficPresets = [];
    state.globalSettings.fanficPresets.push(preset);

    await db.globalSettings.put(state.globalSettings);
    await loadFanficPresets();

    document.getElementById("fanfic-preset-select").value =
      state.globalSettings.fanficPresets.length - 1;
    alert("预设保存成功！");
  }

  function applyFanficPreset() {
    const index = document.getElementById("fanfic-preset-select").value;
    if (index === "") return;

    const preset = state.globalSettings.fanficPresets[index];
    if (preset) {
      document.getElementById("fanfic-char1-select").value = preset.char1;
      document.getElementById("fanfic-char2-select").value = preset.char2;
      document.getElementById("fanfic-wordcount-input").value =
        preset.wordCount || "";
      document.getElementById("fanfic-type-input").value = preset.type || ""; // 回填类型
      document.getElementById("fanfic-style-input").value = preset.style || ""; // 回填文风
      document.getElementById("fanfic-worldview-input").value =
        preset.worldview || "";
    }
  }

  // 删除选中的预设
  async function deleteFanficPreset() {
    const index = document.getElementById("fanfic-preset-select").value;
    if (index === "") return;

    const confirmed = await showCustomConfirm(
      "确认删除",
      "确定要删除这个预设吗？",
    );
    if (confirmed) {
      state.globalSettings.fanficPresets.splice(index, 1);
      await db.globalSettings.put(state.globalSettings);
      await loadFanficPresets();

      // 清空输入框
      document.getElementById("fanfic-wordcount-input").value = "";
      document.getElementById("fanfic-style-input").value = "";
      document.getElementById("fanfic-worldview-input").value = "";
    }
  }

  // 切换折叠状态
  function toggleFanficBar() {
    const content = document.getElementById("fanfic-bar-content");
    const icon = document.getElementById("fanfic-bar-toggle-icon");

    if (content.classList.contains("collapsed")) {
      content.classList.remove("collapsed");
      icon.classList.remove("collapsed");
    } else {
      content.classList.add("collapsed");
      icon.classList.add("collapsed");
    }
  }

  /**
   * 打开小组编辑器 (已升级：支持图片URL)
   */
  async function openGroupEditor(groupId) {
    editingGroupId = groupId;
    const group = await db.forumGroups.get(groupId);
    if (!group) return;

    document.getElementById("group-editor-name-input").value = group.name;
    document.getElementById("group-editor-desc-input").value =
      group.description;

    // ★★★ 修改：获取图标输入框，并修改 placeholder 提示 ★★★
    const iconInput = document.getElementById("group-editor-icon-input");
    iconInput.value = group.icon;
    // 修改输入框上方的 label 文字（通过修改 DOM 或设置 placeholder）
    iconInput.placeholder = "输入图片链接(URL) 或 Emoji";
    // 找到它前面的 label 元素并修改文字
    const iconLabel = document.querySelector(
      'label[for="group-editor-icon-input"]',
    );
    if (iconLabel) iconLabel.textContent = "小组封面 (图片URL / Emoji)";

    document.getElementById("group-editor-worldview-input").value =
      group.worldview || "";

    const categoriesString = (group.categories || [])
      .map((c) => `#${c}`)
      .join(" ");
    document.getElementById("group-editor-categories-input").value =
      categoriesString;

    document
      .getElementById("forum-group-editor-modal")
      .classList.add("visible");
  }

  /**
   * 保存对小组信息的修改
   */
  async function saveGroupSettings() {
    if (!editingGroupId) return;

    const name = document
      .getElementById("group-editor-name-input")
      .value.trim();
    if (!name) {
      alert("小组名称不能为空！");
      return;
    }

    const description = document
      .getElementById("group-editor-desc-input")
      .value.trim();
    const icon = document
      .getElementById("group-editor-icon-input")
      .value.trim();
    const worldview = document
      .getElementById("group-editor-worldview-input")
      .value.trim();
    const categoriesInput = document
      .getElementById("group-editor-categories-input")
      .value.trim();
    // 解析分类字符串
    const categories = categoriesInput
      ? categoriesInput.match(/#(\S+)/g)?.map((tag) => tag.substring(1)) || []
      : [];

    await db.forumGroups.update(editingGroupId, {
      name,
      description,
      icon,
      worldview,
      categories,
    });

    document
      .getElementById("forum-group-editor-modal")
      .classList.remove("visible");
    await renderForumScreen();
    alert("小组信息已更新！");
  }

  /**
   * 打开分类管理弹窗
   */
  async function openForumCategoryManager() {
    await renderForumCategoryList();
    document
      .getElementById("forum-category-manager-modal")
      .classList.add("visible");
  }

  /**
   * 在弹窗中渲染分类列表
   */
  async function renderForumCategoryList() {
    const listEl = document.getElementById("existing-forum-categories-list");
    const categories = await db.forumCategories.toArray();
    listEl.innerHTML = "";
    if (categories.length === 0) {
      listEl.innerHTML =
        '<p style="text-align: center; color: var(--text-secondary);">还没有任何分类</p>';
    }
    categories.forEach((cat) => {
      const item = document.createElement("div");
      item.className = "existing-group-item";
      item.innerHTML = `
            <span class="group-name">${cat.name}</span>
            <span class="delete-group-btn" data-id="${cat.id}">×</span>
        `;
      listEl.appendChild(item);
    });
  }

  /**
   * 添加一个新的圈子分类
   */
  async function addNewForumCategory() {
    const input = document.getElementById("new-forum-category-name-input");
    const name = input.value.trim();
    if (!name) {
      alert("分类名不能为空！");
      return;
    }
    const existing = await db.forumCategories
      .where("name")
      .equals(name)
      .first();
    if (existing) {
      alert(`分类 "${name}" 已经存在了！`);
      return;
    }
    await db.forumCategories.add({ name });
    input.value = "";
    await renderForumCategoryList();
  }

  /**
   * 删除一个圈子分类
   */
  async function deleteForumCategory(categoryId) {
    const confirmed = await showCustomConfirm(
      "确认删除",
      "确定要删除这个分类吗？",
      {
        confirmButtonClass: "btn-danger",
      },
    );
    if (confirmed) {
      await db.forumCategories.delete(categoryId);
      await renderForumCategoryList();
    }
  }
  async function openGroupCreator() {
    const name = await showCustomPrompt("创建新小组", "请输入小组名称：");
    if (!name || !name.trim()) {
      if (name !== null) alert("小组名称不能为空！");
      return;
    }

    const desc = await showCustomPrompt("小组描述", "为你的小组写一句简介吧：");
    if (desc === null) return;

    // ★★★ 修改：提示输入 URL ★★★
    const icon = await showCustomPrompt(
      "小组封面",
      "请输入图片链接 (URL)：\n(留空则使用默认图标)",
      "",
      "url",
    );
    if (icon === null) return;

    try {
      const newGroup = {
        name: name.trim(),
        description: desc.trim(),
        icon: icon.trim(), // 存入URL
      };
      await db.forumGroups.add(newGroup);
      await renderForumScreen();
      alert(`小组“${name.trim()}”创建成功！`);
    } catch (error) {
      console.error("创建小组失败:", error);
      alert(`创建失败: ${error.message}`);
    }
  }

  /**
   * 【全新】删除一个小组
   * @param {number} groupId - 要删除的小组的ID
   */
  async function deleteGroupAndPosts(groupId) {
    const group = await db.forumGroups.get(groupId);
    if (!group) return;

    const confirmed = await showCustomConfirm(
      "确认删除",
      `确定要删除小组“${group.name}”吗？此操作将同时删除该小组内的【所有帖子和评论】，且无法恢复！`,
      { confirmButtonClass: "btn-danger" },
    );

    if (confirmed) {
      try {
        // 1. 找到该小组下的所有帖子
        const postsToDelete = await db.forumPosts
          .where("groupId")
          .equals(groupId)
          .toArray();
        const postIds = postsToDelete.map((p) => p.id);

        // 2. 如果有帖子，就找到这些帖子下的所有评论并删除
        if (postIds.length > 0) {
          await db.forumComments.where("postId").anyOf(postIds).delete();
        }

        // 3. 删除所有帖子
        await db.forumPosts.where("groupId").equals(groupId).delete();

        // 4. 最后删除小组本身
        await db.forumGroups.delete(groupId);

        await renderForumScreen(); // 刷新列表
        alert(`小组“${group.name}”及其所有内容已删除。`);
      } catch (error) {
        console.error("删除小组时出错:", error);
        alert(`删除失败: ${error.message}`);
      }
    }
  }
  // ▼▼▼ 用这块【V4 | 最终分类版】代码，完整替换旧的 generateEntertainmentGroupContent 函数 ▼▼▼

  // ▼▼▼ 用这块【V5 | 最终原创分类版】代码，完整替换旧的 generateEntertainmentGroupContent 函数 ▼▼▼

  /**
   * 【AI核心 - 娱乐小组 V5 | 最终原创分类版】
   */
  async function generateEntertainmentGroupContent(groupId) {
    if (!groupId) return;

    await showCustomAlert("请稍候...", "娱乐小组正在紧急开会讨论最新热点...");

    const { proxyUrl, apiKey, model } = state.apiConfig;
    if (!proxyUrl || !apiKey || !model) {
      alert("请先在API设置中配置好才能生成内容哦！");
      return;
    }

    const publicFigures = Object.values(state.chats)
      .filter((c) => !c.isGroup)
      .map((c) => ({
        name: c.name,
        profession: c.settings.weiboProfession || "艺人",
        persona: (
          c.settings.weiboInstruction || c.settings.aiPersona
        ).substring(0, 150),
      }));

    let topicsContext = "";
    if (weiboHotSearchCache && weiboHotSearchCache.length > 0) {
      topicsContext = `请围绕以下【当前最新的微博热搜话题】展开讨论：\n${weiboHotSearchCache
        .map((t) => `- ${t.topic}`)
        .join("\n")}`;
    } else {
      topicsContext = `请你根据下方“公众人物列表”中各个角色的【职业和人设】，为他们创造一些符合身份的、可能引发讨论的娱乐新闻或八卦事件作为讨论主题。`;
    }

    // --- ▼▼▼ 【核心修改】彻底重写Prompt指令 ---
    const prompt = `
# 任务
你是一个专业的“豆瓣娱乐小组资深用户模拟器”。你的任务是根据一个热门娱乐主题，生成5个帖子和对应的评论，模拟小组内的真实讨论氛围。

# 当前讨论主题
${topicsContext}

# 核心规则
1.  **豆瓣风格铁律**: 所有帖子的标题、内容和评论都【必须】是地道的“豆瓣小组”风格。
2.  **【【【分类铁律】】】**: 你【必须】为每一个帖子，根据其八卦内容，【原创】1-2个高度相关的分类标签。绝对不要使用任何预设列表。例如，如果帖子是关于恋情的，分类可以是 ["恋情瓜"]。
3.  **角色扮演铁律**: 你生成的帖子内容可以【讨论或提及】下方的公众人物，但【不能扮演他们】亲自发帖。所有帖子都必须是路人视角。
4.  **格式铁律**: 你的回复【必须且只能】是一个严格的JSON数组，包含5个帖子对象。每个对象【必须】包含 "author", "title", "content", "categories", 和 "comments" 字段。
    - "categories" 字段【必须】是你为这篇帖子原创的分类数组。

# 公众人物列表 (他们是讨论的对象，但不是发帖人)
${JSON.stringify(publicFigures, null, 2)}

# JSON输出格式示例:
[
  {
    "author": "momo",
    "title": "不懂就问，最近那个热搜上的剧真的好看吗？",
    "content": "首页天天刷到，有点好奇但又怕踩雷...",
    "categories": ["新剧讨论"],
    "comments": [
      {"author": "已注销", "content": "不好看，别去。"}
    ]
  }
]
`;
    // --- ▲▲▲ 更新结束 ▲▲▲ ---

    const messagesForApi = [{ role: "user", content: prompt }];

    try {
      let isGemini = proxyUrl === GEMINI_API_URL;
      let geminiConfig = toGeminiRequestData(
        model,
        apiKey,
        prompt,
        messagesForApi,
        isGemini,
      );

      const response = isGemini
        ? await fetch(geminiConfig.url, geminiConfig.data)
        : await fetch(`${proxyUrl}/v1/chat/completions`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: model,
              messages: messagesForApi,
              temperature: parseFloat(state.apiConfig.temperature) || 0.8,
              response_format: { type: "json_object" },
            }),
          });

      if (!response.ok) throw new Error(`API请求失败: ${response.status}`);

      const data = await response.json();
      const rawContent = isGemini
        ? data.candidates[0].content.parts[0].text
        : data.choices[0].message.content;
      const cleanedContent = rawContent.replace(/^```json\s*|```$/g, "").trim();
      const newPostsData = JSON.parse(cleanedContent);

      if (Array.isArray(newPostsData) && newPostsData.length > 0) {
        let totalPosts = 0;
        let totalComments = 0;
        for (const postData of newPostsData) {
          // --- ▼▼▼ 【核心新增】保存分类数据 ---
          const newPost = {
            groupId: groupId,
            title: postData.title,
            content: postData.content,
            author: postData.author,
            timestamp: Date.now() + totalPosts,
            categories: postData.categories || [], // 保存分类
          };
          // --- ▲▲▲ 新增结束 ▲▲▲ ---

          const postId = await db.forumPosts.add(newPost);
          totalPosts++;

          if (postData.comments && Array.isArray(postData.comments)) {
            const commentsToAdd = postData.comments.map((comment) => ({
              postId: postId,
              author: comment.author,
              content: comment.content,
              timestamp: Date.now() + totalPosts + totalComments++,
            }));
            if (commentsToAdd.length > 0) {
              await db.forumComments.bulkAdd(commentsToAdd);
            }
          }
        }
        await renderGroupPosts(groupId);
        await showCustomAlert(
          "生成成功！",
          `已为娱乐小组生成了 ${totalPosts} 条新帖子和 ${totalComments} 条评论。`,
        );
      } else {
        throw new Error("AI返回的数据格式不正确。");
      }
    } catch (error) {
      console.error("生成娱乐小组内容失败:", error);
      await showCustomAlert("生成失败", `发生了一个错误：\n${error.message}`);
    }
  }
  // ▲▲▲ 替换结束 ▲▲▲

  // ▼▼▼ 用这块【V4 | 最终原创分类版】代码，完整替换旧的 generateDreamPost 函数 ▼▼▼

  /**
   * 【全新修正版 | V4】为“梦角小组”生成专属帖子的核心函数
   */
  async function generateDreamPost(groupId) {
    await showCustomAlert("请稍候...", "正在为user编织一个甜蜜的梦境...");

    const { proxyUrl, apiKey, model } = state.apiConfig;
    if (!proxyUrl || !apiKey || !model) {
      alert("请先在API设置中配置好才能生成内容哦！");
      return;
    }

    const allChars = Object.values(state.chats).filter((c) => !c.isGroup);
    if (allChars.length === 0) {
      alert("还没有任何角色，无法发布梦境哦。");
      return;
    }

    const postingChar = allChars[Math.floor(Math.random() * allChars.length)];
    const userPersona = state.qzoneSettings.persona || "一个普通的、温柔的人。";
    const userNickname = state.qzoneSettings.nickname || "{{user}}";

    // --- ▼▼▼ 【核心修改】彻底重写Prompt指令 ---
    const prompt = `
# 任务：角色扮演与帖子创作（带评论和分类）
你现在【就是】角色“${postingChar.name}”。你正在一个名为“梦角小组”的秘密论坛里。
这个小组是你们这些角色，偷偷向彼此炫耀、倾诉对你们的共同爱人——用户“${userNickname}”——的爱意和幻想的地方。

# 核心规则
1.  **第一人称视角**: 你【必须】使用角色“${postingChar.name}”的第一人称视角来写作帖子正文。
2.  **帖子主题**: 你的帖子内容是你对你的爱人“${userNickname}”的爱意表达或幻想。
3.  **【【【分类铁律】】】**: 你【必须】根据梦境的具体内容，为这篇帖子【原创】1-2个高度相关的分类标签。绝对不要使用任何预设列表。例如，如果内容是甜蜜的日常，分类可以是 ["甜蜜日常"]。
4.  **评论生成**: 在创作完帖子后，你还需要立刻切换到“其他小组成员”的视角，为这篇帖子生成【2-3条】符合情景的评论。
5.  **格式铁律**: 你的回复【必须且只能】是一个严格的JSON对象，包含 "title", "content", "categories", 和 "comments" 字段。
    - "categories" 字段【必须】是你为这篇帖子原创的分类数组。

# 你的信息
-   你的名字: ${postingChar.name}
-   你的人设: ${postingChar.settings.aiPersona}

# 你的爱人信息
-   爱人的名字: ${userNickname}
-   爱人的人设: ${userPersona}

# JSON输出格式示例:
{
  "title": "关于他睡觉时的小习惯",
  "content": "偷偷告诉你们，${userNickname}睡觉的时候喜欢抱着枕头的一角...",
  "categories": ["甜蜜日常", "小习惯"],
  "comments": [
    {"author": "路人A", "content": "哇，好甜！"}
  ]
}
`;
    // --- ▲▲▲ 更新结束 ▲▲▲ ---

    const messagesForApi = [{ role: "user", content: prompt }];

    try {
      let isGemini = proxyUrl === GEMINI_API_URL;
      let geminiConfig = toGeminiRequestData(
        model,
        apiKey,
        prompt,
        messagesForApi,
        isGemini,
      );

      const response = isGemini
        ? await fetch(geminiConfig.url, geminiConfig.data)
        : await fetch(`${proxyUrl}/v1/chat/completions`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: model,
              messages: messagesForApi,
              temperature: parseFloat(state.apiConfig.temperature) || 0.8,
              response_format: { type: "json_object" },
            }),
          });

      if (!response.ok) throw new Error(`API请求失败: ${response.status}`);

      const data = await response.json();
      const rawContent = isGemini
        ? data.candidates[0].content.parts[0].text
        : data.choices[0].message.content;
      const cleanedContent = rawContent.replace(/^```json\s*|```$/g, "").trim();
      const postData = JSON.parse(cleanedContent);

      if (postData.title && postData.content) {
        // --- ▼▼▼ 【核心新增】保存分类数据 ---
        const newPost = {
          groupId: groupId,
          title: postData.title,
          content: postData.content,
          author: postingChar.name,
          timestamp: Date.now(),
          categories: postData.categories || [], // 保存分类
        };
        // --- ▲▲▲ 新增结束 ▲▲▲ ---

        const postId = await db.forumPosts.add(newPost);

        if (postData.comments && Array.isArray(postData.comments)) {
          const commentsToAdd = postData.comments.map((c, i) => ({
            postId,
            author: c.author,
            content: c.content,
            timestamp: Date.now() + i + 1,
          }));
          await db.forumComments.bulkAdd(commentsToAdd);
        }

        await renderGroupPosts(groupId);
        await showCustomAlert(
          "发布成功！",
          `“${postingChar.name}”发布了一条新的梦境。`,
        );
      } else {
        throw new Error("AI返回的数据格式不正确。");
      }
    } catch (error) {
      console.error("生成梦角帖子失败:", error);
      await showCustomAlert("生成失败", `发生了一个错误：\n${error.message}`);
    }
  }
  // ▲▲▲ 替换结束 ▲▲▲
  // ▼▼▼ 用这块【已修复】的代码，完整替换你旧的 openForumFilterModal 函数 ▼▼▼
  /**
   * 【总入口】打开分类筛选模态框 (V3 - 已分离小组和帖子的分类)
   * @param {'global' | 'group'} type - 筛选类型：'global'为主页筛选小组，'group'为小组内筛选帖子
   * @param {number|null} id - 如果是小组内筛选，则为小组的ID
   */
  async function openForumFilterModal(type, id = null) {
    currentFilterContext = { type, id };
    const modal = document.getElementById("forum-filter-modal");
    const listEl = document.getElementById("forum-filter-category-list");
    listEl.innerHTML = "";

    // --- ▼▼▼ 核心修正：根据上下文，从不同的地方收集分类 ▼▼▼ ---
    let availableCategories = new Set(); // 使用Set来自动去重

    try {
      if (type === "global") {
        // 如果是在“圈子”主页，我们只关心【小组】的分类
        console.log("正在为小组列表收集分类...");
        const allGroups = await db.forumGroups.toArray();
        allGroups.forEach((group) => {
          if (group.categories) {
            group.categories.forEach((cat) => availableCategories.add(cat));
          }
        });
      } else if (type === "group" && id) {
        // 如果是在具体的“小组”页面，我们只关心该小组下【帖子】的分类
        console.log(`正在为小组 ID: ${id} 的帖子列表收集分类...`);
        const postsInGroup = await db.forumPosts
          .where("groupId")
          .equals(id)
          .toArray();
        postsInGroup.forEach((post) => {
          if (post.categories) {
            post.categories.forEach((cat) => availableCategories.add(cat));
          }
        });
      }
    } catch (error) {
      console.error("收集分类标签时出错:", error);
    }
    // --- ▲▲▲ 修复结束 ▲▲▲ ---

    const categoryArray = Array.from(availableCategories).sort(); // 转换为数组并排序

    if (categoryArray.length === 0) {
      listEl.innerHTML =
        '<p style="color: var(--text-secondary); padding: 20px;">当前没有任何可用的分类标签。</p>';
    } else {
      const activeFilters =
        type === "global"
          ? activeForumFilters.global
          : activeForumFilters.group[id] || [];

      categoryArray.forEach((catName, index) => {
        const isChecked = activeFilters.includes(catName);
        const label = document.createElement("label");
        const inputId = `filter-cat-${type}-${index}`; // 创建唯一的ID
        label.setAttribute("for", inputId);
        label.innerHTML = `
                <input type="checkbox" id="${inputId}" value="${catName}" ${isChecked ? "checked" : ""}>
                <span>${catName}</span>
            `;
        listEl.appendChild(label);
      });
    }

    modal.classList.add("visible");
  }
  // ▲▲▲ 替换结束 ▲▲▲

  /**
   * 应用筛选条件并刷新列表
   */
  async function applyForumFilter() {
    const { type, id } = currentFilterContext;
    const selectedCategories = Array.from(
      document.querySelectorAll("#forum-filter-category-list input:checked"),
    ).map((cb) => cb.value);

    const filterBtnId =
      type === "global" ? "forum-filter-btn" : "group-filter-btn";
    const filterBtn = document.getElementById(filterBtnId);

    if (type === "global") {
      activeForumFilters.global = selectedCategories;
      await renderForumScreen();
    } else if (type === "group" && id) {
      if (!activeForumFilters.group[id]) activeForumFilters.group[id] = [];
      activeForumFilters.group[id] = selectedCategories;
      await renderGroupPosts(id);
    }

    // 根据是否应用了筛选，更新图标状态
    if (selectedCategories.length > 0) {
      filterBtn.classList.add("active");
    } else {
      filterBtn.classList.remove("active");
    }

    document.getElementById("forum-filter-modal").classList.remove("visible");
  }

  async function followSeries(seriesId) {
    if (!seriesId) return;
    const series = await db.forumSeries.get(seriesId);
    if (!series) {
      alert("未找到对应的连载");
      return;
    }
    if (series.isFollowed) {
      await showCustomAlert(
        "已追更",
        `《${series.title || "这部连载"}》已经在书架里啦。`,
      );
      return;
    }
    const now = Date.now();
    await db.forumSeries.update(seriesId, {
      isFollowed: true,
      bookshelfAddedAt: now,
    });
    await showCustomAlert(
      "追更成功",
      `《${series.title || "这部连载"}》已加入圈子书架，并会自动为你追更。`,
    );
    await renderForumBookshelf();
    await generateNextSeriesChapter(seriesId);
  }

  async function generateNextSeriesChapter(seriesId) {
    if (!seriesId) return;
    if (ongoingSeriesTasks.has(seriesId)) {
      await showCustomAlert("正在追更", "上一章还在生成中，请稍等~");
      return;
    }
    const series = await db.forumSeries.get(seriesId);
    if (!series) {
      alert("未找到对应的连载");
      return;
    }
    const chapters = await db.forumChapters
      .where("seriesId")
      .equals(seriesId)
      .sortBy("chapterIndex");
    if (chapters.length === 0) {
      alert("还没有章节可以续写");
      return;
    }

    const targetGroupId = series.groupId || window.activeGroupId;
    if (!targetGroupId) {
      ongoingSeriesTasks.delete(seriesId);
      alert("未找到所属小组，无法追更");
      return;
    }
    if (series.isFinished) {
      ongoingSeriesTasks.delete(seriesId);
      await showCustomAlert(
        "已完结",
        `《${series.title || "这部连载"}》已标记完结，不能继续追更。`,
      );
      return;
    }
    const seriesAuthor =
      series.seriesAuthor ||
      getRandomItem([
        "隔壁文手",
        "星河写手",
        "匿名太太",
        "笔名未定",
        "拾字人",
      ]) ||
      "匿名太太";

    const seriesTitle = series.title || series.pairing || "这部连载";
    const lastChapter = chapters[chapters.length - 1];
    const summaryContext = chapters
      .map(
        (ch) =>
          `第${ch.chapterIndex}章《${ch.title || ""}》：${
            ch.summary || (ch.content || "").slice(0, 120) || "（暂无摘要）"
          }`,
      )
      .join("\n");
    const maxChapterIndex = chapters.length > 0 ? Math.max(...chapters.map(c => c.chapterIndex || 0)) : 0;
    const nextIndex = maxChapterIndex + 1;

    ongoingSeriesTasks.add(seriesId);
    await showCustomAlert("追更中...", `正在写第${nextIndex}章，稍等片刻...`);

    const { proxyUrl, apiKey, model } = state.apiConfig;
    if (!proxyUrl || !apiKey || !model) {
      ongoingSeriesTasks.delete(seriesId);
      alert("请先配置API！");
      return;
    }

    const char1Persona =
      series.char1Persona || getPersonaByName(series.char1Name);
    const char2Persona =
      series.char2Persona || getPersonaByName(series.char2Name);
    const userPersona =
      series.userPersona ||
      state.qzoneSettings.weiboUserPersona ||
      "一个普通人";
    const lengthInstruction = series.wordCount
      ? `本章的篇幅尽量接近【${series.wordCount}】。`
      : "本章不少于1000字。";

    const customPromptRequirement = series.customContinuationPrompt
      ? `\n\n# 用户自定义要求 / 下一章指示\n${series.customContinuationPrompt}`
      : `\n\n# 用户自定义要求 / 下一章指示\n请基于前文剧情自然顺延展开。`;

    const prompt = `
你是连载小说作者，请继续创作《${seriesTitle}》的第${nextIndex}章。

# 角色与人设
- 角色A (${series.char1Name || "角色A"}): ${char1Persona}
- 角色B (${series.char2Name || "角色B"}): ${char2Persona}
- 用户: ${userPersona}

# 写作要求
- 题材/类型: ${series.type || "沿用前文"}
- 文风: ${series.style || "保持前文一致"}
- 世界观/剧情设定: ${series.worldview || "沿用既定设定"}
- ${lengthInstruction}
- 评论：为本章生成 5-8 条读者评论，语言自然有代入感。
- 完结判断：如果本章已经收束主要矛盾、故事完结，请将 isFinished 设为 true；否则为 false，并继续保留可追更的悬念。

# 已发布章节摘要 (供你掌握主线)
${summaryContext || "暂无摘要"}

# 上一章全文 (供衔接)
${lastChapter.content || ""}
${customPromptRequirement}

# 输出格式规范（必须严格输出纯 JSON 对象，禁止包裹任何其他说明）
{
  "chapterTitle": "第${nextIndex}章 标题",
  "chapterSummary": "本章摘要，3-5句",
  "chapterContent": "完整正文，正文换行用\\n表示",
  "categories": ["标签1", "标签2"],
  "comments": [
    {"author": "读者A", "content": "短评内容"},
    {"author": "读者B", "content": "短评内容"}
  ],
  "isFinished": false
}
请严格只返回纯 JSON 对象。`;

    try {
      const rawContent = await callAiForForum(prompt);
      let parsed;
      try {
        parsed = extractAndParseJson(rawContent);
      } catch (e) {
        console.error("解析追更返回数据失败", e);
        throw new Error("AI返回了无效的JSON格式。");
      }

      const chapterTitle = (parsed.chapterTitle || `第${nextIndex}章`).replace(/^第\d+章\s*/i, "").trim();
      const rawChapterContent =
        parsed.chapterContent ||
        parsed.story ||
        parsed.content ||
        "本章生成失败，请重试。";
      const chapterContent = rawChapterContent.replace(/\n*【下一章生成指令\/提示词】[\s\S]*$/, "").trim();
      const chapterSummary = parsed.chapterSummary || "";
      const baseCategories = Array.isArray(parsed.categories)
        ? parsed.categories
        : [];
      const postCategories = Array.from(
        new Set(["长篇", "连载", "追更", ...baseCategories]),
      );
      const timestamp = Date.now();
      const isFinished = !!parsed.isFinished;

      const cleanSeriesTitle = seriesTitle.replace(/[《》]/g, "").trim();
      const postId = await db.forumPosts.add({
        groupId: targetGroupId,
        title: `《${cleanSeriesTitle}》 第${nextIndex}章 ${chapterTitle}`,
        content: chapterContent,
        author: seriesAuthor,
        timestamp,
        categories: postCategories,
        lengthType: "long",
        seriesId,
        chapterIndex: nextIndex,
      });

      if (parsed.comments && Array.isArray(parsed.comments)) {
        const commentsToAdd = parsed.comments
          .filter((c) => c && c.content)
          .map((c, idx) => ({
            postId,
            author: c.author || "路人",
            content: c.content,
            timestamp: timestamp + idx + 1,
          }));
        if (commentsToAdd.length > 0) {
          await db.forumComments.bulkAdd(commentsToAdd);
        }
      }

      const chapterId = await db.forumChapters.add({
        seriesId,
        chapterIndex: nextIndex,
        title: chapterTitle,
        summary: chapterSummary,
        content: chapterContent,
        createdAt: timestamp,
        postId,
      });

      await db.forumSeries.update(seriesId, {
        lastChapterId: chapterId,
        lastChapterIndex: nextIndex,
        updatedAt: timestamp,
        isFinished,
        customContinuationPrompt: `请基于第${nextIndex}章《${chapterTitle}》结尾，继续生成《${seriesTitle}》的第${nextIndex + 1}章内容，保持角色性格与剧情走向。`,
      });

      if (targetGroupId) {
        await renderGroupPosts(targetGroupId);
      }
      await renderForumBookshelf();
      if (activeSeriesId === seriesId) {
        await renderSeriesDetail(seriesId);
      }
      await showCustomAlert("追更完成", `第${nextIndex}章已经写好，去看看吧！`);
    } catch (error) {
      console.error("追更失败:", error);
      await showCustomAlert("追更失败", `发生了一个错误：\n${error.message}`);
    } finally {
      ongoingSeriesTasks.delete(seriesId);
    }
  }

  async function openForumFavorites() {
    await renderForumFavorites();
    showScreen("forum-favorites-screen");
  }

  async function renderForumFavorites() {
    const listEl = document.getElementById("forum-favorites-list");
    if (!listEl) return;
    const allPosts = await db.forumPosts.toArray();
    const favPosts = allPosts.filter((p) => p.isFavorite);

    if (favPosts.length === 0) {
      listEl.innerHTML = '<p style="text-align:center; color: var(--text-secondary); padding: 40px 0;">暂无收藏文章</p>';
      return;
    }

    favPosts.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    listEl.innerHTML = "";
    const processedSeriesIds = new Set();
    const postsMap = new Map(allPosts.map((p) => [p.id, p]));

    for (const post of favPosts) {
      if (post.seriesId) {
        if (processedSeriesIds.has(post.seriesId)) continue;
        processedSeriesIds.add(post.seriesId);

        const series = await db.forumSeries.get(post.seriesId);
        const chapters = await db.forumChapters
          .where("seriesId")
          .equals(post.seriesId)
          .sortBy("chapterIndex");

        const seriesCard = document.createElement("div");
        seriesCard.className = "forum-series-accordion-card";
        seriesCard.style.cssText = "margin-bottom: 12px; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 10px; overflow: hidden;";

        const totalCh = chapters.length || 1;

        seriesCard.innerHTML = `
          <div class="series-accordion-header" style="padding: 12px 14px; cursor: pointer; display: flex; align-items: center; justify-content: space-between; gap: 8px; background: var(--secondary-bg, rgba(128,128,128,0.04));">
            <div style="min-width: 0; flex: 1;">
              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="font-weight: 600; font-size: 14px; color: var(--text-primary);">${series?.title || post.title}</span>
                <span style="font-size: 10px; color: var(--accent-color); border: 1px solid var(--accent-color); border-radius: 4px; padding: 0 4px;">连载</span>
              </div>
              <div style="font-size: 11px; color: var(--text-secondary); margin-top: 3px;">
                <span>共 ${totalCh} 章</span>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <button type="button" data-delete-series-id="${post.seriesId}" title="删除" style="background: #ffffff; border: 1px solid var(--border-color, #d1d5db); color: var(--text-secondary, #6b7280); border-radius: 6px; padding: 2px 8px; font-size: 12px; font-weight: 500; cursor: pointer; height: 26px;">删除</button>
              <button type="button" class="mini-btn danger" data-fav-series-unfav="${post.seriesId}" style="background: #ffffff; border: 1px solid var(--border-color, #d1d5db); color: var(--text-secondary, #6b7280); border-radius: 6px; padding: 2px 8px; font-size: 12px; height: 26px;">取消</button>
              <svg class="series-accordion-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="transform: rotate(0deg); transition: transform 0.2s ease; color: var(--text-secondary); flex-shrink: 0;"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
          </div>
          <div class="series-accordion-content" style="display: none; padding: 6px 12px 10px; border-top: 1px solid var(--border-color); flex-direction: column; gap: 8px;">
            ${chapters.map((ch) => {
              return `
              <div class="series-chapter-card" style="display: flex; flex-direction: column; gap: 6px; padding: 8px 10px; border-radius: 6px; background: var(--card-bg); border: 1px solid var(--border-color); margin-top: 6px;">
                <div class="series-chapter-row" data-post-id="${ch.postId || ''}" data-series-id="${post.seriesId}" style="display: flex; align-items: center; justify-content: space-between; cursor: pointer;">
                  <div style="font-size: 13px; font-weight: 500; color: var(--text-primary);">第${ch.chapterIndex}章 ${ch.title || ''}</div>
                  <div style="display: flex; align-items: center; gap: 6px;">
                    <button type="button" class="mini-btn" data-series-action="open-post" data-series-id="${post.seriesId}" data-post-id="${ch.postId || ''}" style="height: 24px; padding: 0 8px; font-size: 11px; border-radius: 6px;">阅读</button>
                    <button type="button" data-delete-chapter-id="${ch.id}" data-post-id="${ch.postId || ''}" data-series-id="${post.seriesId}" title="删除" style="background: #ffffff; border: 1px solid var(--border-color, #d1d5db); color: var(--text-secondary, #6b7280); border-radius: 6px; padding: 2px 8px; font-size: 11px; font-weight: 500; cursor: pointer; height: 24px;">删除</button>
                    <button type="button" class="mini-btn danger" data-fav-action="unfav" data-post-id="${ch.postId || ''}" style="background: #ffffff; border: 1px solid var(--border-color, #d1d5db); color: var(--text-secondary, #6b7280); border-radius: 6px; padding: 2px 8px; font-size: 11px; height: 24px;">取消</button>
                  </div>
                </div>
              </div>
            `;
            }).join('')}
          </div>
        `;

        const headerEl = seriesCard.querySelector(".series-accordion-header");
        const contentBox = seriesCard.querySelector(".series-accordion-content");
        const arrowIcon = seriesCard.querySelector(".series-accordion-arrow");

        headerEl.addEventListener("click", (e) => {
          if (e.target.closest("button")) return;
          const isHidden = contentBox.style.display === "none";
          contentBox.style.display = isHidden ? "flex" : "none";
          arrowIcon.style.transform = isHidden ? "rotate(180deg)" : "rotate(0deg)";
        });

        listEl.appendChild(seriesCard);
      } else {
        const item = document.createElement("div");
        item.className = "forum-post-item favorite-item-row";
        item.dataset.postId = post.id;
        item.style.cssText = "display: flex; flex-direction: column; gap: 6px; padding: 12px; background: var(--card-bg); border-radius: 8px; border: 1px solid var(--border-color); cursor: pointer; margin-bottom: 10px;";
        item.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
            <div style="font-weight: 600; font-size: 14px; color: var(--text-primary); flex: 1;">${post.title}</div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <button type="button" class="mini-btn" data-series-action="open-post" data-post-id="${post.id}" style="height: 24px; padding: 0 8px; font-size: 11px; border-radius: 6px;">阅读</button>
              <button type="button" data-delete-post-id="${post.id}" title="删除" style="background: #ffffff; border: 1px solid var(--border-color, #d1d5db); color: var(--text-secondary, #6b7280); border-radius: 6px; padding: 2px 8px; font-size: 11px; font-weight: 500; cursor: pointer; height: 24px;">删除</button>
              <button type="button" class="mini-btn danger" data-fav-action="unfav" data-post-id="${post.id}" style="background: #ffffff; border: 1px solid var(--border-color, #d1d5db); color: var(--text-secondary, #6b7280); border-radius: 6px; padding: 2px 8px; font-size: 11px; height: 24px;">取消</button>
            </div>
          </div>
        `;
        listEl.appendChild(item);
      }
    }
  }

  async function openForumBookshelf() {
    await renderForumBookshelf();
    showScreen("forum-bookshelf-screen");
  }

  async function renderForumBookshelf() {
    const listEl = document.getElementById("forum-bookshelf-list");
    if (!listEl) return;
    const allSeries = await db.forumSeries.toArray();
    const followed = allSeries.filter((s) => s.isFollowed);

    if (followed.length === 0) {
      listEl.innerHTML =
        '<p style="text-align:center; color: #8a8a8a; padding: 40px 0;">书架空空如也，去追更一部长篇吧！</p>';
      return;
    }

    followed.sort(
      (a, b) =>
        (b.updatedAt || b.bookshelfAddedAt || 0) -
        (a.updatedAt || a.bookshelfAddedAt || 0),
    );

    const cards = [];
    for (const series of followed) {
      const chapters = await db.forumChapters
        .where("seriesId")
        .equals(series.id)
        .sortBy("chapterIndex");
      const lastChapter = chapters[chapters.length - 1];
      const lastTitle = lastChapter
        ? `第${lastChapter.chapterIndex}章 ${lastChapter.title || ""}`
        : "尚无章节";
      const lastPostId = lastChapter?.postId || "";
      const isFinished = !!series.isFinished;
      const continueText = isFinished ? "已完结" : "追更";

      cards.push(`
        <div class="forum-bookshelf-card" data-series-id="${series.id}">
          <div class="series-card-header">
            <div class="series-card-title">${series.title || series.pairing || "未命名连载"}</div>
            <div class="series-card-meta">${series.pairing || ""}</div>
            <div class="series-card-meta">最新：${lastTitle} · ${isFinished ? "已完结" : "连载中"}</div>
          </div>
          <div class="series-card-actions">
            <button class="mini-btn primary" data-series-action="read-latest" data-series-id="${series.id}" data-post-id="${lastPostId}">阅读</button>
            <button class="mini-btn" data-series-action="open-detail" data-series-id="${series.id}">目录</button>
            <button class="mini-btn ${isFinished ? "disabled" : ""}" data-series-action="continue" data-series-id="${series.id}" ${isFinished ? "disabled" : ""}>${continueText}</button>
            <button class="mini-btn" data-series-action="share" data-series-id="${series.id}">分享</button>
          </div>
        </div>
      `);
    }

    listEl.innerHTML = cards.join("");
  }

  async function openSeriesDetail(seriesId) {
    activeSeriesId = seriesId;
    await renderSeriesDetail(seriesId);
    showScreen("forum-series-detail-screen");
  }

  async function renderSeriesDetail(seriesId) {
    const metaEl = document.getElementById("forum-series-meta");
    const listEl = document.getElementById("forum-series-chapter-list");
    if (!metaEl || !listEl) return;

    const series = await db.forumSeries.get(seriesId);
    if (!series) {
      metaEl.innerHTML = '<p style="padding: 15px;">未找到连载。</p>';
      listEl.innerHTML = "";
      return;
    }
    const isFinished = !!series.isFinished;

    document.getElementById("forum-series-detail-title").textContent =
      series.title || "连载详情";

    const chapters = await db.forumChapters
      .where("seriesId")
      .equals(seriesId)
      .sortBy("chapterIndex");
    const nextIndex = (series.lastChapterIndex || chapters.length) + 1;
    const metaLines = [
      `<div class="series-meta-line">CP：${series.pairing || `${series.char1Name || ""}x${series.char2Name || ""}`}</div>`,
      `<div class="series-meta-line">状态：${isFinished ? "已完结" : `已更新至第${series.lastChapterIndex || chapters.length || 1}章`}</div>`,
      `<div class="series-meta-line">题材：${series.type || "未设置"} · 文风：${series.style || "未设置"}</div>`,
    ];
    metaEl.innerHTML = `<div class="forum-series-card">${metaLines.join("")}</div>`;

    const nextBtn = document.getElementById("series-next-chapter-btn");
    if (nextBtn) {
      nextBtn.dataset.seriesId = seriesId;
      nextBtn.textContent = isFinished ? "已完结" : `追更第${nextIndex}章`;
      nextBtn.disabled = isFinished;
      nextBtn.classList.toggle("disabled", isFinished);
    }

    if (chapters.length === 0) {
      listEl.innerHTML =
        '<p style="padding: 15px; color: var(--text-secondary);">还没有章节。</p>';
      return;
    }

    listEl.innerHTML = chapters
      .map(
        (ch) => `
        <div class="forum-chapter-item" data-post-id="${ch.postId || ""}" data-series-id="${seriesId}" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; background: var(--card-bg); border-radius: 8px; border: 1px solid var(--border-color); margin-bottom: 8px;">
          <div class="chapter-title" style="font-weight: 600; font-size: 13.5px; color: var(--text-primary);">第${ch.chapterIndex}章 ${ch.title || ""}</div>
          <div class="chapter-actions">
            <button class="mini-btn" data-series-action="open-post" data-series-id="${seriesId}" data-post-id="${ch.postId || ""}" style="height: 26px; padding: 0 10px; font-size: 11.5px; border-radius: 6px;">阅读</button>
          </div>
        </div>`,
      )
      .join("");
  }

  // ▲▲▲ 新增函数结束 ▲▲▲

  // ▲▲▲ 替换结束 ▲▲▲
  // ▼▼▼ 【全新】论坛功能事件监听器 ▼▼▼

  async function openFanficGroupDirectly() {
    let fanficGroup = null;
    try {
      fanficGroup = await db.forumGroups.where("name").equals("同人文小组").first();
      if (!fanficGroup) {
        const newId = Date.now();
        fanficGroup = {
          id: newId,
          name: "同人文小组",
          description: "同人文创作小组",
          avatar: "https://api.iconify.design/lucide:book-open.svg?color=%23ff7f50",
          categories: ["同人文"]
        };
        await db.forumGroups.add(fanficGroup);
      }
    } catch (e) {
      console.error("查找或创建同人文小组失败:", e);
    }
    if (fanficGroup) {
      await openGroup(fanficGroup.id, "同人文小组");
    } else {
      showScreen("forum-screen");
    }
  }

  // 2. 当用户点击“书柜”App图标时，直接打开同人文小组面板
  const forumIcon = document.querySelector(".desktop-app-icon[onclick=\"showScreen('forum-screen')\"]");
  if (forumIcon) {
    forumIcon.onclick = null;
    forumIcon.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      openFanficGroupDirectly();
    });
  }

  // 3. 绑定小组页和帖子页的返回按钮
  document
    .getElementById("back-to-forum-list")
    .addEventListener("click", () => showScreen("home-screen"));
  document
    .getElementById("back-to-group-screen")
    .addEventListener("click", () => {
      if (postReturnContext === "bookshelf") {
        showScreen("forum-bookshelf-screen");
      } else if (postReturnContext === "favorites") {
        openForumFavorites();
      } else if (postReturnContext === "series-detail" && activeSeriesId) {
        renderSeriesDetail(activeSeriesId);
        showScreen("forum-series-detail-screen");
      } else {
        openGroup(
          window.activeGroupId,
          document.getElementById("group-screen-title").textContent,
        );
      }
      postReturnContext = "group";
    });

  // 4. 绑定帖子评论区的发送按钮（已安全容错）
  const sendCommentBtn = document.getElementById("send-post-comment-btn");
  if (sendCommentBtn) {
    sendCommentBtn.addEventListener("click", handleAddComment);
  }

  // 绑定所有小组头部通用的“生成”按钮
  document
    .getElementById("generate-group-content-btn")
    .addEventListener("click", handleGenerateGroupContent);
  // ▲▲▲ 替换结束 ▲▲▲

  // 6. 绑定帖子详情页的“转载”按钮
  document
    .getElementById("repost-to-chat-btn")
    .addEventListener("click", repostToChat);

  // ▼▼▼ 在 init() 函数中，用【这一行】替换旧的 create-group-btn 监听器 ▼▼▼
  document
    .getElementById("create-group-btn")
    .addEventListener("click", openGroupCreator);
  // ▲▲▲ 替换结束 ▲▲▲

  // ▼▼▼ 用这块新代码替换 ▼▼▼
  document
    .getElementById("create-forum-post-btn")
    .addEventListener("click", () => {
      openCreateForumPostModal();
    });
  // 使用事件委托，为帖子详情页的操作按钮绑定事件
  document
    .getElementById("post-detail-content")
    .addEventListener("click", async (e) => {
      const actionBtn = e.target.closest("[data-action]");
      if (actionBtn) {
        const seriesId = parseInt(actionBtn.dataset.seriesId);
        if (
          actionBtn.classList.contains("disabled") ||
          actionBtn.hasAttribute("disabled")
        )
          return;
        if (actionBtn.dataset.action === "delete-chapter") {
          const postId = parseInt(actionBtn.dataset.postId || activeForumPostId);
          const currentPost = await db.forumPosts.get(postId);
          const confirmed = await showCustomConfirm(
            "删除章节",
            `确定要删除第${currentPost?.chapterIndex || 1}章《${currentPost?.title || "本章"}》吗？此操作无法恢复。`,
            { confirmButtonClass: "btn-danger" },
          );
          if (confirmed) {
            try {
              await db.transaction(
                "rw",
                db.forumPosts,
                db.forumComments,
                db.forumChapters,
                db.forumSeries,
                async () => {
                  await db.forumComments.where("postId").equals(postId).delete();
                  await db.forumPosts.delete(postId);
                  await db.forumChapters.where("postId").equals(postId).delete();
                  if (!isNaN(seriesId)) {
                    const remChapters = await db.forumChapters
                      .where("seriesId")
                      .equals(seriesId)
                      .toArray();
                    const remMaxIndex = remChapters.length > 0
                      ? Math.max(...remChapters.map((c) => c.chapterIndex || 0))
                      : 0;
                    await db.forumSeries.update(seriesId, {
                      lastChapterIndex: remMaxIndex,
                      isFinished: false,
                    });
                  }
                },
              );
              await showCustomAlert("删除成功", "本章节已删除，再次追更将重新生成此章。");
              if (postReturnContext === "bookshelf") {
                showScreen("forum-bookshelf-screen");
                await renderForumBookshelf();
              } else {
                showScreen("group-screen");
                await renderGroupPosts(currentPost?.groupId || window.activeGroupId);
              }
            } catch (err) {
              console.error("删除章节失败:", err);
              await showCustomAlert("删除失败", `操作失败: ${err.message}`);
            }
          }
          return;
        }
        if (actionBtn.dataset.action === "follow-series") {
          if (!isNaN(seriesId)) {
            await followSeries(seriesId);
            if (activeForumPostId) await renderPostDetails(activeForumPostId);
          }
          return;
        }
        if (actionBtn.dataset.action === "continue-series") {
          if (!isNaN(seriesId)) {
            await generateNextSeriesChapter(seriesId);
            if (activeForumPostId) await renderPostDetails(activeForumPostId);
          }
          return;
        }
      }
      // 1. 处理生成评论
      if (e.target.id === "generate-forum-comments-btn") {
        generateForumComments();
        return;
      }

      // 2. 处理删除评论
      if (e.target.classList.contains("forum-comment-delete-btn")) {
        e.stopPropagation();
        const commentId = parseInt(e.target.dataset.id);
        if (isNaN(commentId)) return;

        const confirmed = await showCustomConfirm(
          "删除评论",
          "确定要删除这条评论吗？",
          {
            confirmButtonClass: "btn-danger",
          },
        );

        if (confirmed) {
          try {
            await db.forumComments.delete(commentId);
            if (activeForumPostId) {
              await renderPostDetails(activeForumPostId);
            }
          } catch (error) {
            console.error("删除失败", error);
            alert("删除失败: " + error.message);
          }
        }
      }
    });

  const commentInputEl = document.getElementById("post-comment-input");
  if (commentInputEl) {
    commentInputEl.addEventListener("blur", (e) => {
      const input = e.target;
      if (input.value.trim() === "") {
        input.placeholder = "发布你的评论...";
        delete input.dataset.replyTo;
      }
    });
  }
  // ▲▲▲ 新代码粘贴结束 ▲▲▲
  // ▼▼▼ 在 init() 函数的事件监听器区域末尾，粘贴下面这整块新代码 ▼▼▼

  // 使用事件委托，为所有转载的帖子卡片添加点击事件
  document.getElementById("chat-messages").addEventListener("click", (e) => {
    const repostCard = e.target.closest(".link-share-card[data-post-id]");
    if (repostCard) {
      const postId = parseInt(repostCard.dataset.postId);
      if (!isNaN(postId)) {
        // 调用你已经写好的“打开帖子”函数
        openPost(postId);
      }
    }
  });

  // ▲▲▲ 新增代码结束 ▲▲▲
  async function handleDeleteChapter(chapterId, postId, seriesId) {
    const confirmed = await showCustomConfirm(
      "删除章节",
      "确定要删除这一章节吗？此操作无法恢复。",
      { confirmButtonClass: "btn-danger" }
    );
    if (!confirmed) return;
    try {
      await db.transaction(
        "rw",
        db.forumPosts,
        db.forumComments,
        db.forumChapters,
        db.forumSeries,
        async () => {
          if (chapterId) {
            await db.forumChapters.delete(parseInt(chapterId));
          }
          if (postId) {
            await db.forumChapters.where("postId").equals(parseInt(postId)).delete();
            await db.forumComments.where("postId").equals(parseInt(postId)).delete();
            await db.forumPosts.delete(parseInt(postId));
          }
          if (seriesId) {
            const sId = parseInt(seriesId);
            const remChapters = await db.forumChapters
              .where("seriesId")
              .equals(sId)
              .sortBy("chapterIndex");
            if (remChapters.length === 0) {
              await db.forumSeries.delete(sId);
            } else {
              const remMaxIndex = Math.max(...remChapters.map((c) => c.chapterIndex || 0));
              const lastCh = remChapters[remChapters.length - 1];
              await db.forumSeries.update(sId, {
                lastChapterIndex: remMaxIndex,
                lastChapterId: lastCh?.id || null,
                isFinished: false,
              });
            }
          }
        }
      );
      await showCustomAlert("删除成功", "章节已成功删除。");
      if (window.activeGroupId) {
        await renderGroupPosts(window.activeGroupId);
      }
      await renderForumFavorites();
      await renderForumBookshelf();
    } catch (err) {
      console.error("删除章节失败:", err);
      await showCustomAlert("删除失败", `操作失败: ${err.message}`);
    }
  }

  async function handleDeleteSeries(seriesId) {
    const sId = parseInt(seriesId);
    if (isNaN(sId)) return;
    const series = await db.forumSeries.get(sId);
    const confirmed = await showCustomConfirm(
      "删除连载",
      `确定要删除连载《${series?.title || "这部连载"}》及其所有章节吗？此操作无法恢复。`,
      { confirmButtonClass: "btn-danger" }
    );
    if (!confirmed) return;
    try {
      await db.transaction(
        "rw",
        db.forumPosts,
        db.forumComments,
        db.forumChapters,
        db.forumSeries,
        async () => {
          const posts = await db.forumPosts.where("seriesId").equals(sId).toArray();
          for (const p of posts) {
            await db.forumComments.where("postId").equals(p.id).delete();
          }
          await db.forumPosts.where("seriesId").equals(sId).delete();
          await db.forumChapters.where("seriesId").equals(sId).delete();
          await db.forumSeries.delete(sId);
        }
      );
      await showCustomAlert("删除成功", "连载及其所有章节已删除。");
      if (window.activeGroupId) {
        await renderGroupPosts(window.activeGroupId);
      }
      await renderForumFavorites();
      await renderForumBookshelf();
    } catch (err) {
      console.error("删除连载失败:", err);
      await showCustomAlert("删除失败", `操作失败: ${err.message}`);
    }
  }

  async function handleDeletePost(postId) {
    const pId = parseInt(postId);
    if (isNaN(pId)) return;
    const post = await db.forumPosts.get(pId);
    const confirmed = await showCustomConfirm(
      "删除帖子",
      `确定要删除帖子《${post?.title || "这篇帖子"}》吗？此操作将同时删除帖子下的所有评论，且无法恢复。`,
      { confirmButtonClass: "btn-danger" }
    );
    if (!confirmed) return;
    try {
      await db.transaction(
        "rw",
        db.forumPosts,
        db.forumComments,
        async () => {
          await db.forumComments.where("postId").equals(pId).delete();
          await db.forumPosts.delete(pId);
        }
      );
      await showCustomAlert("删除成功", "帖子已成功删除。");
      if (window.activeGroupId) {
        await renderGroupPosts(window.activeGroupId);
      }
      await renderForumFavorites();
    } catch (err) {
      console.error("删除帖子失败:", err);
      await showCustomAlert("删除失败", `操作失败: ${err.message}`);
    }
  }

  // 实时备注保存监听
  document.addEventListener("input", async (e) => {
    if (e.target.classList.contains("chapter-remark-input") || e.target.id === "post-remark-input") {
      const postId = parseInt(e.target.dataset.postId);
      const remark = e.target.value;
      if (!isNaN(postId) && postId) {
        await db.forumPosts.update(postId, { remark });
      }
    }
  });

  // ▼▼▼ 【全新】论坛帖子列表事件委托 ▼▼▼
  document
    .getElementById("group-post-list")
    .addEventListener("click", async (e) => {
      // 1. 处理删除整部连载
      const delSeriesBtn = e.target.closest("[data-delete-series-id]");
      if (delSeriesBtn) {
        e.stopPropagation();
        const seriesId = parseInt(delSeriesBtn.dataset.deleteSeriesId);
        if (!isNaN(seriesId)) {
          await handleDeleteSeries(seriesId);
        }
        return;
      }

      // 1.1 处理删除单章
      const delChapterBtn = e.target.closest("[data-delete-chapter-id]");
      if (delChapterBtn) {
        e.stopPropagation();
        const chId = parseInt(delChapterBtn.dataset.deleteChapterId);
        const pId = parseInt(delChapterBtn.dataset.postId);
        const sId = parseInt(delChapterBtn.dataset.seriesId);
        await handleDeleteChapter(chId, pId, sId);
        return;
      }

      // 2. 处理连载操作（追更、阅读单章）
      const seriesActionBtn = e.target.closest("[data-series-action]");
      if (seriesActionBtn) {
        e.stopPropagation();
        const seriesId = parseInt(seriesActionBtn.dataset.seriesId);
        const action = seriesActionBtn.dataset.seriesAction;
        if (action === "continue" && !isNaN(seriesId)) {
          await generateNextSeriesChapter(seriesId);
          return;
        }
        if (action === "open-post") {
          const postId = parseInt(seriesActionBtn.dataset.postId);
          if (!isNaN(postId)) {
            openPost(postId, "group", seriesId);
          }
          return;
        }
      }

      // 3. 处理单篇帖子或章节行点击
      const chapterRow = e.target.closest(".series-chapter-row");
      if (chapterRow && !e.target.closest("button")) {
        const postId = parseInt(chapterRow.dataset.postId);
        const seriesId = parseInt(chapterRow.dataset.seriesId);
        if (!isNaN(postId)) {
          openPost(postId, "group", seriesId);
        }
        return;
      }

      const postItem = e.target.closest(".forum-post-item");
      if (!postItem) return;

      // 检查点击的是否是删除按钮
      if (e.target.classList.contains("forum-post-delete-btn")) {
        const postId = postItem.dataset.postId;
        if (!postId) return;

        const post = await db.forumPosts.get(parseInt(postId));
        if (!post) return;

        const confirmed = await showCustomConfirm(
          "删除帖子",
          `确定要删除帖子《${post.title}》吗？此操作将同时删除帖子下的所有评论，且无法恢复。`,
          { confirmButtonClass: "btn-danger" },
        );

        if (confirmed) {
          try {
            await db.transaction(
              "rw",
              db.forumPosts,
              db.forumComments,
              db.forumChapters,
              db.forumSeries,
              async () => {
                const targetPost = await db.forumPosts.get(parseInt(postId));
                if (targetPost) {
                  await db.forumComments
                    .where("postId")
                    .equals(parseInt(postId))
                    .delete();
                  await db.forumPosts.delete(parseInt(postId));

                  if (targetPost.seriesId !== undefined && targetPost.seriesId !== null && targetPost.seriesId !== "") {
                    const rawSId = targetPost.seriesId;
                    const sId = (typeof rawSId === "number" && !isNaN(rawSId)) ? rawSId : (isNaN(parseInt(rawSId)) ? rawSId : parseInt(rawSId));
                    await db.forumChapters
                      .where("postId")
                      .equals(parseInt(postId))
                      .delete();

                    let remChapters = [];
                    try {
                      remChapters = await db.forumChapters
                        .where("seriesId")
                        .equals(sId)
                        .toArray();
                    } catch (e) {
                      try {
                        remChapters = await db.forumChapters
                          .where("seriesId")
                          .equals(String(sId))
                          .toArray();
                      } catch(e2) {}
                    }

                    const remMaxIndex = remChapters.length > 0
                      ? Math.max(...remChapters.map(c => c.chapterIndex || 0))
                      : 0;

                    try {
                      await db.forumSeries.update(sId, {
                        lastChapterIndex: remMaxIndex,
                        isFinished: false
                      });
                    } catch (e) {}
                  }
                }
              },
            );

            await showCustomAlert("删除成功", "帖子及其所有评论已被删除。");
            const rawGid = post?.groupId || activeGroupId || window.activeGroupId;
            const gid = (typeof rawGid === "number" && !isNaN(rawGid)) ? rawGid : parseInt(rawGid);
            if (gid && !isNaN(gid)) {
              await renderGroupPosts(gid);
            }
            if (typeof renderForumFavorites === "function") await renderForumFavorites();
            if (typeof renderForumBookshelf === "function") await renderForumBookshelf();
          } catch (error) {
            console.error("删除帖子失败:", error);
            await showCustomAlert("删除失败", `操作失败: ${error.message}`);
          }
        }
      } else {
        const postId = postItem.dataset.postId;
        if (postId) {
          openPost(parseInt(postId));
        }
      }
    });
  // ▲▲▲ 新事件监听器结束 ▲▲▲
  // ▼▼▼ 【全新】圈子/小组高级功能事件监听 ▼▼▼

  // 1. 为“圈子”主页右上角的“+”按钮，绑定创建小组的事件
  document
    .getElementById("create-group-btn")
    .addEventListener("click", openGroupCreator);

  // 2. 为小组编辑器弹窗的“保存”和“取消”按钮绑定事件
  document
    .getElementById("save-group-editor-btn")
    .addEventListener("click", saveGroupSettings);
  document
    .getElementById("cancel-group-editor-btn")
    .addEventListener("click", () => {
      document
        .getElementById("forum-group-editor-modal")
        .classList.remove("visible");
    });

  // 3. 为分类管理弹窗的按钮绑定事件
  document
    .getElementById("add-new-forum-category-btn")
    .addEventListener("click", addNewForumCategory);
  document
    .getElementById("close-forum-category-manager-btn")
    .addEventListener("click", () => {
      document
        .getElementById("forum-category-manager-modal")
        .classList.remove("visible");
    });

  // 4. 使用事件委托，为分类列表中的“删除”按钮绑定事件
  document
    .getElementById("existing-forum-categories-list")
    .addEventListener("click", (e) => {
      if (e.target.classList.contains("delete-group-btn")) {
        // 复用样式
        const categoryId = parseInt(e.target.dataset.id);
        deleteForumCategory(categoryId);
      }
    });
  // ▲▲▲ 新增事件监听结束 ▲▲▲
  // ▼▼▼ 【全新】圈子/小组分类筛选功能事件监听 ▼▼▼
  // 1. 绑定主页和小组页的收藏按钮
  const forumFavBtn = document.getElementById("forum-favorites-btn");
  if (forumFavBtn) {
    forumFavBtn.addEventListener("click", openForumFavorites);
  }
  const groupFavBtn = document.getElementById("group-favorites-btn");
  if (groupFavBtn) {
    groupFavBtn.addEventListener("click", openForumFavorites);
  }
  const backFromFavBtn = document.getElementById("back-from-forum-favorites");
  if (backFromFavBtn) {
    backFromFavBtn.addEventListener("click", () => {
      if (window.activeGroupId) {
        showScreen("group-screen");
      } else {
        showScreen("forum-screen");
      }
    });
  }

  const favListEl = document.getElementById("forum-favorites-list");
  if (favListEl) {
    favListEl.addEventListener("click", async (e) => {
      // 1. 删除整部连载
      const delSeriesBtn = e.target.closest("[data-delete-series-id]");
      if (delSeriesBtn) {
        e.stopPropagation();
        const seriesId = parseInt(delSeriesBtn.dataset.deleteSeriesId);
        if (!isNaN(seriesId)) {
          await handleDeleteSeries(seriesId);
        }
        return;
      }

      // 2. 取消整部连载收藏
      const favSeriesUnfavBtn = e.target.closest("[data-fav-series-unfav]");
      if (favSeriesUnfavBtn) {
        e.stopPropagation();
        const seriesId = parseInt(favSeriesUnfavBtn.dataset.favSeriesUnfav);
        if (!isNaN(seriesId)) {
          const posts = await db.forumPosts.where("seriesId").equals(seriesId).toArray();
          for (const p of posts) {
            p.isFavorite = false;
            await db.forumPosts.put(p);
          }
          await renderForumFavorites();
        }
        return;
      }

      // 3. 删除单章
      const delChapterBtn = e.target.closest("[data-delete-chapter-id]");
      if (delChapterBtn) {
        e.stopPropagation();
        const chId = parseInt(delChapterBtn.dataset.deleteChapterId);
        const pId = parseInt(delChapterBtn.dataset.postId);
        const sId = parseInt(delChapterBtn.dataset.seriesId);
        await handleDeleteChapter(chId, pId, sId);
        return;
      }

      // 4. 删除单篇帖子
      const delPostBtn = e.target.closest("[data-delete-post-id]");
      if (delPostBtn) {
        e.stopPropagation();
        const postId = parseInt(delPostBtn.dataset.deletePostId);
        if (!isNaN(postId)) {
          await handleDeletePost(postId);
        }
        return;
      }

      // 5. 单篇/单章取消收藏
      const unfavBtn = e.target.closest('[data-fav-action="unfav"]');
      if (unfavBtn) {
        e.stopPropagation();
        const postId = parseInt(unfavBtn.dataset.postId);
        if (!isNaN(postId)) {
          const post = await db.forumPosts.get(postId);
          if (post) {
            post.isFavorite = false;
            await db.forumPosts.put(post);
            await renderForumFavorites();
          }
        }
        return;
      }

      // 6. 连载操作（阅读单章）
      const seriesActionBtn = e.target.closest("[data-series-action]");
      if (seriesActionBtn) {
        e.stopPropagation();
        const action = seriesActionBtn.dataset.seriesAction;
        if (action === "open-post") {
          const postId = parseInt(seriesActionBtn.dataset.postId);
          const seriesId = parseInt(seriesActionBtn.dataset.seriesId);
          if (!isNaN(postId)) {
            openPost(postId, "favorites", seriesId);
          }
          return;
        }
      }

      // 7. 章节行或者单帖卡片整条点击
      const chapterRow = e.target.closest(".series-chapter-row");
      if (chapterRow && !e.target.closest("button") && !e.target.closest("textarea")) {
        const postId = parseInt(chapterRow.dataset.postId);
        const seriesId = parseInt(chapterRow.dataset.seriesId);
        if (!isNaN(postId)) {
          openPost(postId, "favorites", seriesId);
        }
        return;
      }

      const itemRow = e.target.closest(".favorite-item-row[data-post-id]");
      if (itemRow && !e.target.closest("button") && !e.target.closest("textarea")) {
        const postId = parseInt(itemRow.dataset.postId);
        if (!isNaN(postId)) {
          openPost(postId, "favorites");
        }
      }
    });
  }

  const forumFilterBtn = document.getElementById("forum-filter-btn");
  if (forumFilterBtn) {
    forumFilterBtn.addEventListener("click", () => openForumFilterModal("global"));
  }
  const groupFilterBtn = document.getElementById("group-filter-btn");
  if (groupFilterBtn) {
    groupFilterBtn.addEventListener("click", () => {
      openForumFilterModal("group", window.activeGroupId);
    });
  }

  // 2. 绑定筛选弹窗内的按钮
  document
    .getElementById("apply-forum-filter-btn")
    .addEventListener("click", applyForumFilter);
  document
    .getElementById("cancel-forum-filter-btn")
    .addEventListener("click", () => {
      document.getElementById("forum-filter-modal").classList.remove("visible");
    });
  document
    .getElementById("reset-forum-filter-btn")
    .addEventListener("click", async () => {
      // 清空复选框并应用
      document
        .querySelectorAll("#forum-filter-category-list input:checked")
        .forEach((cb) => (cb.checked = false));
      await applyForumFilter();
    });
  // ▲▲▲ 新增事件监听结束 ▲▲▲
  // --- 同人文控制台事件绑定 ---
  document
    .getElementById("fanfic-bar-header")
    .addEventListener("click", toggleFanficBar);

  document
    .getElementById("save-fanfic-preset-btn")
    .addEventListener("click", saveCurrentFanficPreset);

  document
    .getElementById("delete-fanfic-preset-btn")
    .addEventListener("click", deleteFanficPreset);

  document
    .getElementById("fanfic-preset-select")
    .addEventListener("change", applyFanficPreset);

  const forumBookshelfBtn = document.getElementById("open-forum-bookshelf-btn");
  if (forumBookshelfBtn) {
    forumBookshelfBtn.addEventListener("click", openForumBookshelf);
  }

  const backFromBookshelfBtn = document.getElementById(
    "back-from-forum-bookshelf",
  );
  if (backFromBookshelfBtn) {
    backFromBookshelfBtn.addEventListener("click", () =>
      showScreen("forum-screen"),
    );
  }

  const backFromSeriesDetailBtn = document.getElementById(
    "back-from-series-detail",
  );
  if (backFromSeriesDetailBtn) {
    backFromSeriesDetailBtn.addEventListener("click", () =>
      showScreen("forum-bookshelf-screen"),
    );
  }

  const seriesNextBtn = document.getElementById("series-next-chapter-btn");
  if (seriesNextBtn) {
    seriesNextBtn.addEventListener("click", async () => {
      if (seriesNextBtn.disabled) return;
      const seriesId = parseInt(
        seriesNextBtn.dataset.seriesId || activeSeriesId,
      );
      if (!isNaN(seriesId)) {
        await generateNextSeriesChapter(seriesId);
      }
    });
  }

  const bookshelfListEl = document.getElementById("forum-bookshelf-list");
  if (bookshelfListEl) {
    bookshelfListEl.addEventListener("click", async (e) => {
      const actionBtn = e.target.closest("[data-series-action]");
      if (!actionBtn) return;
      const seriesId = parseInt(actionBtn.dataset.seriesId);
      if (isNaN(seriesId)) return;
      if (
        actionBtn.classList.contains("disabled") ||
        actionBtn.hasAttribute("disabled")
      )
        return;
      const series = await db.forumSeries.get(seriesId);
      if (series?.groupId) window.activeGroupId = series.groupId;
      activeSeriesId = seriesId;
      const action = actionBtn.dataset.seriesAction;
      if (action === "read-latest") {
        const postId = parseInt(actionBtn.dataset.postId);
        postReturnContext = "bookshelf";
        if (!isNaN(postId)) {
          openPost(postId, "bookshelf", seriesId);
        } else {
          openSeriesDetail(seriesId);
        }
      } else if (action === "open-detail") {
        await openSeriesDetail(seriesId);
      } else if (action === "continue") {
        await generateNextSeriesChapter(seriesId);
      } else if (action === "share") {
        await shareSeriesToChat(seriesId);
      }
    });
  }

  const seriesChapterList = document.getElementById(
    "forum-series-chapter-list",
  );
  if (seriesChapterList) {
    seriesChapterList.addEventListener("click", async (e) => {
      const actionBtn = e.target.closest("[data-series-action]");
      if (!actionBtn) return;
      if (actionBtn.dataset.seriesAction === "open-post") {
        const seriesId = parseInt(actionBtn.dataset.seriesId);
        const postId = parseInt(actionBtn.dataset.postId);
        if (isNaN(postId)) return;
        const series = await db.forumSeries.get(seriesId);
        if (series?.groupId) window.activeGroupId = series.groupId;
        activeSeriesId = seriesId;
        postReturnContext = "series-detail";
        openPost(postId, "series-detail", seriesId);
      }
    });
  }

  // ▲▲▲ 论坛事件监听器结束 ▲▲▲
});
