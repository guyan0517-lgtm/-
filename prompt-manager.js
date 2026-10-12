// 全局提示词管理与预览引擎
(function() {
  const STORAGE_KEY = "global_prompt_config_v1";

  const DEFAULT_SINGLE_BLOCKS = [
    {
      id: "role_profile",
      title: "角色设定",
      enabled: true,
      template: "### **【第一部分：角色核心设定与COC人物面板】**\n\n你现在将扮演一个名为“**{{角色姓名}}**”的角色。\n\n# 【角色档案与COC人物面板】\n- **姓名**: {{角色姓名}}\n{{角色属性}}\n- **核心人设**:\n{{角色人设}}\n{{总结备忘}}\n{{世界观设定}}\n{{系统状态栏}}"
    },
    {
      id: "format_rule",
      title: "格式规范",
      enabled: true,
      template: "### **【第二部分：输出格式铁律】**\n\n你的每一次回复都【**必须**】是一个**单一且完整**的JSON对象。绝对禁止返回JSON数组或纯文本。\n{{格式结构示例}}"
    },
    {
      id: "command_system",
      title: "指令系统",
      enabled: true,
      template: "### **【第三部分：可使用的操作指令】**\n- **发送文本**: {\"type\": \"text\", \"content\": \"你好呀！\"}\n- **发送语音**: {\"type\": \"voice_message\", \"content\": \"语音的文字内容...\"}\n- **发送表情**: {\"type\": \"sticker\", \"sticker_name\": \"表情的名字\"}，表情名必须在表情列表中，禁止杜撰\n{{音乐指令}}\n- **赠送或发放道具与线索**: {\"type\": \"give_item\", \"target\": \"我\", \"item\": {\"name\": \"物品名称\", \"desc\": \"物品外观与作用描述\", \"category\": \"prop\", \"effect\": \"如 HP+1\", \"content\": \"若为线索填详细内容\", \"prompt\": \"1item, detailed description, masterpiece\"}}\n{{模组插图指令}}\n{{生图指令}}"
    },
    {
      id: "user_context",
      title: "客体环境",
      enabled: true,
      template: "### **【第四部分：当前上下文信息】**\n{{跑团掷骰}}\n{{物品背包}}\n# 【对话者角色档案与COC人物面板】\n- **姓名**: {{用户姓名}}\n{{用户属性}}\n- **角色人设**:\n{{用户人设}}"
    },
    {
      id: "world_script",
      title: "剧本世界",
      enabled: true,
      template: "- **世界观设定集**:\n{{世界书内容}}\n{{模组剧情章节}}\n{{地图场景位置}}"
    },
    {
      id: "advanced_assist",
      title: "高级辅助",
      enabled: true,
      template: "{{思维链自检推理}}\n{{关联记忆}}\n{{角色好感度}}\n- **可用表情包**:\n{{可用表情列表}}\n\n现在，请根据以上所有规则和下方的对话历史，继续进行对话。"
    }
  ];

  const DEFAULT_GROUP_BLOCKS = [
    {
      id: "group_command_format",
      title: "指令格式",
      enabled: true,
      template: "# 【第一大类】你可以使用的操作指令\n你的回复必须且只能是一个严格的JSON数据。每一个消息对象都必须包含 \"name\" 字段与 \"type\" 字段。用户的身份是【{{用户姓名}}】，你绝对不能生成 name 为 \"{{用户姓名}}\" 的消息。禁止出戏，绝不能透露你是AI、模型或提及“扮演”、“生成”等词语。\n{{群聊格式与思维链}}\n## 你可以使用的操作指令列表:\n{{系统状态栏指令}}\n- 发送文本: {\"type\": \"text\", \"name\": \"角色名\", \"content\": \"对话内容\"}\n- 发送语音: {\"type\": \"voice_message\", \"name\": \"角色名\", \"content\": \"语音的文字内容\"}\n{{音乐指令}}\n- 赠送或发放道具与线索: {\"type\": \"give_item\", \"name\": \"角色名\", \"target\": \"获得者名字或ID，给用户填'我'或用户ID/名字\", \"item\": {\"name\": \"物品名称\", \"desc\": \"物品外观与作用描述\", \"category\": \"prop\", \"effect\": \"如 HP+1\", \"content\": \"若为线索填详细内容\", \"prompt\": \"1item, detailed description, masterpiece\"}}\n- 发起进入战斗确认卡片: 当剧情推进到战斗爆发或遭遇强敌时，发送 {\"type\": \"suggest_combat\"}\n{{模组插图指令}}\n{{生图指令}}\n- 发送系统消息: {\"type\": \"system_message\", \"content\": \"你想在聊天中显示的系统文本\"}"
    },
    {
      id: "group_members",
      title: "成员设定",
      enabled: true,
      template: "# 群成员列表及COC角色档案\n{{群成员列表}}"
    },
    {
      id: "group_combat_dice",
      title: "战斗跑团",
      enabled: true,
      template: "{{战斗规则}}\n{{跑团掷骰}}\n{{物品背包}}"
    },
    {
      id: "group_world_script",
      title: "剧本世界",
      enabled: true,
      template: "{{模组章节}}\n{{世界书内容}}\n{{地图位置}}\n{{群公告}}"
    },
    {
      id: "group_advanced_assist",
      title: "高级辅助",
      enabled: true,
      template: "{{总结备忘}}\n{{思维链推演}}\n{{共享上下文}}\n{{表情包设定}}\n{{关联记忆}}\n{{角色好感度}}"
    },
    {
      id: "group_user_context",
      title: "客体环境",
      enabled: true,
      template: "# 【第六大类】角色与人设\n- **姓名**: {{用户姓名}}\n{{用户属性}}\n- **角色人设**:\n{{用户人设}}\n{{情景感知时间}}\n\n现在，请根据以上所有规则和下方的对话历史，继续这场群聊。"
    }
  ];

  let currentTab = "single";
  let promptConfig = {
    single: JSON.parse(JSON.stringify(DEFAULT_SINGLE_BLOCKS)),
    group: JSON.parse(JSON.stringify(DEFAULT_GROUP_BLOCKS))
  };

  function loadConfig() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.single) && parsed.single.length > 0) {
          promptConfig.single = parsed.single;
        }
        if (Array.isArray(parsed.group) && parsed.group.length > 0) {
          promptConfig.group = parsed.group;
        }
      }
    } catch (e) {
      console.warn("加载提示词配置异常", e);
    }
  }

  function saveConfig() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(promptConfig));
    } catch (e) {
      console.warn("保存提示词配置异常", e);
    }
  }

  function getActiveBlocks() {
    return currentTab === "single" ? promptConfig.single : promptConfig.group;
  }

  function updateFullPreview() {
    const previewBox = document.getElementById("prompt-full-preview-box");
    if (!previewBox) return;

    const blocks = getActiveBlocks();
    const parts = [];

    const dummySingle = {
      "{{角色姓名}}": "爱丽丝",
      "{{角色属性}}": "- **年龄**: 17\n- **生日**: 4月2日\n- **性别**: 女",
      "{{角色人设}}": "温和优雅的随身伙伴，擅长倾听与陪伴。",
      "{{总结备忘}}": "",
      "{{世界观设定}}": "",
      "{{系统状态栏}}": "",
      "{{格式结构示例}}": "{\n  \"chatResponse\": [\n    {\n      \"type\": \"text\",\n      \"content\": \"你好呀！\"\n    }\n  ],\n  \"innerVoice\": null\n}",
      "{{音乐指令}}": "- **播放场景配乐或音乐**: 必须根据具体场景挑选曲目。\n",
      "{{模组插图指令}}": "",
      "{{生图指令}}": "",
      "{{跑团掷骰}}": "# 跑团掷骰指令: .ra 技能名、.r 表达式",
      "{{物品背包}}": "",
      "{{用户姓名}}": "我",
      "{{用户属性}}": "- **年龄**: 18\n- **性别**: 男",
      "{{用户人设}}": "普通学生",
      "{{世界书内容}}": "此处展示所加载世界书设定的核心世界观内容",
      "{{模组剧情章节}}": "此处展示当前章节的剧情设定与背景",
      "{{地图场景位置}}": "当前处于主城广场",
      "{{思维链自检推理}}": "此处展示思维链推演与自检要求",
      "{{关联记忆}}": "",
      "{{角色好感度}}": "",
      "{{可用表情列表}}": "开心、微笑、发呆"
    };

    const dummyGroup = {
      "{{用户姓名}}": "我",
      "{{群聊格式与思维链}}": "## 标准输出格式示例:\n[\n  {\n    \"type\": \"text\",\n    \"name\": \"角色名\",\n    \"content\": \"对话内容\"\n  }\n]",
      "{{系统状态栏指令}}": "",
      "{{音乐指令}}": "- 播放场景配乐或音乐: 必须根据具体场景挑选曲目。\n",
      "{{模组插图指令}}": "",
      "{{生图指令}}": "",
      "{{群成员列表}}": "- **姓名**：爱丽丝\n  - **角色人设**：温和优雅的随身伙伴\n- **姓名**：鲍勃\n  - **角色人设**：热血勇敢的护卫",
      "{{战斗规则}}": "",
      "{{跑团掷骰}}": "# 跑团掷骰指令: .ra 技能名、.r 表达式",
      "{{物品背包}}": "",
      "{{模组章节}}": "此处展示当前模组各章节剧情",
      "{{世界书内容}}": "此处展示所加载世界书设定的核心内容",
      "{{地图位置}}": "当前处于讨论大厅",
      "{{群公告}}": "# 群公告: 友好交流，文明互动",
      "{{总结备忘}}": "",
      "{{思维链推演}}": "此处展示思维链推演规则",
      "{{共享上下文}}": "",
      "{{表情包设定}}": "",
      "{{关联记忆}}": "",
      "{{角色好感度}}": "",
      "{{用户属性}}": "- **年龄**: 18\n- **性别**: 男",
      "{{用户人设}}": "探险队队长",
      "{{情景感知时间}}": "- **情景感知**: 注意当前时间是 14:30。"
    };

    const dummyMap = currentTab === "single" ? dummySingle : dummyGroup;

    blocks.forEach(block => {
      if (block.enabled !== false) {
        let text = block.template || "";
        Object.keys(dummyMap).forEach(key => {
          text = text.split(key).join(dummyMap[key]);
        });
        text = text.replace(/\{\{[^}]+\}\}/g, "").trim();
        if (text) {
          parts.push(text);
        }
      }
    });

    previewBox.value = parts.join("\n\n");
  }

  function renderBlocksUI() {
    const container = document.getElementById("prompt-blocks-container");
    if (!container) return;

    container.innerHTML = "";
    const blocks = getActiveBlocks();

    blocks.forEach((block, index) => {
      const card = document.createElement("div");
      card.className = "moe-card";
      card.style.margin = "0";
      card.style.border = "1px solid var(--border-color)";
      card.style.borderRadius = "10px";
      card.style.background = "var(--card-bg)";
      card.setAttribute("data-index", String(index));
      card.setAttribute("draggable", "true");

      const header = document.createElement("div");
      header.className = "moe-card-header";
      header.style.display = "flex";
      header.style.justifyContent = "space-between";
      header.style.alignItems = "center";
      header.style.padding = "10px 12px";
      header.style.cursor = "pointer";
      header.style.background = "var(--secondary-bg)";
      header.style.userSelect = "none";

      const leftSide = document.createElement("div");
      leftSide.style.display = "flex";
      leftSide.style.alignItems = "center";
      leftSide.style.gap = "8px";

      const dragHandle = document.createElement("span");
      dragHandle.style.cursor = "grab";
      dragHandle.style.display = "flex";
      dragHandle.style.alignItems = "center";
      dragHandle.style.color = "var(--text-secondary)";
      dragHandle.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg>`;

      const titleEl = document.createElement("span");
      titleEl.style.fontWeight = "600";
      titleEl.style.fontSize = "13px";
      titleEl.style.color = "var(--text-primary)";
      titleEl.textContent = block.title || `项目 ${index + 1}`;

      leftSide.appendChild(dragHandle);
      leftSide.appendChild(titleEl);

      const rightSide = document.createElement("div");
      rightSide.style.display = "flex";
      rightSide.style.alignItems = "center";
      rightSide.style.gap = "6px";

      const upBtn = document.createElement("button");
      upBtn.type = "button";
      upBtn.className = "moe-btn-small";
      upBtn.style.padding = "2px 8px";
      upBtn.style.fontSize = "11px";
      upBtn.textContent = "上移";
      if (index === 0) upBtn.disabled = true;
      upBtn.onclick = (e) => {
        e.stopPropagation();
        if (index > 0) {
          const temp = blocks[index - 1];
          blocks[index - 1] = blocks[index];
          blocks[index] = temp;
          renderBlocksUI();
          updateFullPreview();
        }
      };

      const downBtn = document.createElement("button");
      downBtn.type = "button";
      downBtn.className = "moe-btn-small";
      downBtn.style.padding = "2px 8px";
      downBtn.style.fontSize = "11px";
      downBtn.textContent = "下移";
      if (index === blocks.length - 1) downBtn.disabled = true;
      downBtn.onclick = (e) => {
        e.stopPropagation();
        if (index < blocks.length - 1) {
          const temp = blocks[index + 1];
          blocks[index + 1] = blocks[index];
          blocks[index] = temp;
          renderBlocksUI();
          updateFullPreview();
        }
      };

      const switchLabel = document.createElement("label");
      switchLabel.className = "toggle-switch";
      switchLabel.style.margin = "0";
      switchLabel.style.transform = "scale(0.8)";
      switchLabel.onclick = (e) => e.stopPropagation();

      const switchInput = document.createElement("input");
      switchInput.type = "checkbox";
      switchInput.checked = block.enabled !== false;
      switchInput.onchange = (e) => {
        block.enabled = e.target.checked;
        updateFullPreview();
      };

      const switchSlider = document.createElement("span");
      switchSlider.className = "slider";

      switchLabel.appendChild(switchInput);
      switchLabel.appendChild(switchSlider);

      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "moe-btn-small";
      delBtn.style.padding = "2px 8px";
      delBtn.style.fontSize = "11px";
      delBtn.textContent = "删除";
      delBtn.onclick = (e) => {
        e.stopPropagation();
        blocks.splice(index, 1);
        renderBlocksUI();
        updateFullPreview();
      };

      rightSide.appendChild(upBtn);
      rightSide.appendChild(downBtn);
      rightSide.appendChild(switchLabel);
      if (block.isCustom || blocks.length > 3) {
        rightSide.appendChild(delBtn);
      }

      header.appendChild(leftSide);
      rightSide.onclick = (e) => e.stopPropagation();
      header.appendChild(rightSide);

      const body = document.createElement("div");
      body.className = "moe-card-body";
      body.style.padding = "10px 12px";
      body.style.display = "block";

      const textarea = document.createElement("textarea");
      textarea.className = "moe-input";
      textarea.style.width = "100%";
      textarea.style.height = "120px";
      textarea.style.fontSize = "12px";
      textarea.style.fontFamily = "monospace";
      textarea.style.lineHeight = "1.5";
      textarea.style.resize = "vertical";
      textarea.style.border = "1px solid var(--border-color)";
      textarea.style.borderRadius = "8px";
      textarea.style.padding = "8px";
      textarea.style.background = "var(--card-bg)";
      textarea.style.color = "var(--text-primary)";
      textarea.value = block.template || "";

      textarea.oninput = () => {
        block.template = textarea.value;
        updateFullPreview();
      };

      body.appendChild(textarea);

      header.onclick = () => {
        if (body.style.display === "none") {
          body.style.display = "block";
        } else {
          body.style.display = "none";
        }
      };

      // 拖拽排序逻辑
      card.ondragstart = (e) => {
        e.dataTransfer.setData("text/plain", String(index));
        card.style.opacity = "0.5";
      };
      card.ondragend = () => {
        card.style.opacity = "1";
      };
      card.ondragover = (e) => {
        e.preventDefault();
      };
      card.ondrop = (e) => {
        e.preventDefault();
        const fromIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
        const toIndex = index;
        if (!isNaN(fromIndex) && fromIndex !== toIndex) {
          const moved = blocks.splice(fromIndex, 1)[0];
          blocks.splice(toIndex, 0, moved);
          renderBlocksUI();
          updateFullPreview();
        }
      };

      card.appendChild(header);
      card.appendChild(body);
      container.appendChild(card);
    });
  }

  function setupEvents() {
    const openBtn = document.getElementById("open-prompt-manager-btn");
    const modal = document.getElementById("prompt-manager-modal");
    const closeBtn = document.getElementById("prompt-manager-close-btn");
    const tabSingleBtn = document.getElementById("prompt-tab-single-btn");
    const tabGroupBtn = document.getElementById("prompt-tab-group-btn");
    const addBlockBtn = document.getElementById("prompt-add-block-btn");
    const copyPreviewBtn = document.getElementById("prompt-copy-preview-btn");
    const saveBtn = document.getElementById("prompt-save-btn");
    const resetBtn = document.getElementById("prompt-reset-btn");

    if (openBtn && modal) {
      openBtn.onclick = () => {
        loadConfig();
        renderBlocksUI();
        updateFullPreview();
        modal.classList.add("visible");
      };
    }

    if (closeBtn && modal) {
      closeBtn.onclick = () => {
        modal.classList.remove("visible");
      };
    }

    if (tabSingleBtn && tabGroupBtn) {
      tabSingleBtn.onclick = () => {
        currentTab = "single";
        tabSingleBtn.className = "moe-btn-small";
        tabGroupBtn.className = "moe-btn-small moe-btn-secondary";
        renderBlocksUI();
        updateFullPreview();
      };

      tabGroupBtn.onclick = () => {
        currentTab = "group";
        tabGroupBtn.className = "moe-btn-small";
        tabSingleBtn.className = "moe-btn-small moe-btn-secondary";
        renderBlocksUI();
        updateFullPreview();
      };
    }

    if (addBlockBtn) {
      addBlockBtn.onclick = () => {
        const blocks = getActiveBlocks();
        blocks.push({
          id: "custom_" + Date.now(),
          title: "新增",
          enabled: true,
          template: "在此处编写您新增的默认提示词内容...",
          isCustom: true
        });
        renderBlocksUI();
        updateFullPreview();
      };
    }

    if (copyPreviewBtn) {
      copyPreviewBtn.onclick = async () => {
        const previewBox = document.getElementById("prompt-full-preview-box");
        if (previewBox && previewBox.value) {
          try {
            await navigator.clipboard.writeText(previewBox.value);
            const orig = copyPreviewBtn.textContent;
            copyPreviewBtn.textContent = "成功";
            setTimeout(() => { copyPreviewBtn.textContent = orig; }, 1500);
          } catch (e) {
            console.warn("复制失败", e);
          }
        }
      };
    }

    if (saveBtn && modal) {
      saveBtn.onclick = () => {
        saveConfig();
        modal.classList.remove("visible");
      };
    }

    if (resetBtn) {
      resetBtn.onclick = () => {
        if (currentTab === "single") {
          promptConfig.single = JSON.parse(JSON.stringify(DEFAULT_SINGLE_BLOCKS));
        } else {
          promptConfig.group = JSON.parse(JSON.stringify(DEFAULT_GROUP_BLOCKS));
        }
        renderBlocksUI();
        updateFullPreview();
      };
    }
  }

  // 渲染单聊最终提示词
  function renderSinglePrompt(chat, context) {
    loadConfig();
    const blocks = promptConfig.single;
    if (!Array.isArray(blocks) || blocks.length === 0) {
      return context.defaultPrompt;
    }

    const {
      summaryContext = "",
      npcContext = "",
      systemStatusPromptBlock = "",
      dicePromptBlock = "",
      inventoryPromptBlock = "",
      worldBookContent = "",
      moduleChaptersPromptBlock = "",
      mapPromptBlock = "",
      thoughtChainPromptBlock = "",
      linkedMemoryContext = "",
      stickerContext = "",
      isSingleThinkingActive = false,
      isMusicAllowed = true,
      musicInstruction = "",
      moduleImageInstruction = "",
      novelAiInstruction = ""
    } = context;

    const charAge = chat.settings?.age ? `- **年龄**: ${chat.settings.age}\n` : "";
    const charBirthday = chat.settings?.birthday ? `- **生日**: ${chat.settings.birthday}\n` : "";
    const charGender = chat.settings?.gender ? `- **性别**: ${chat.settings.gender}${chat.settings.genderNote ? " " + chat.settings.genderNote : ""}\n` : "";
    const charCoc = (window.getCocPromptStatus && window.getCocPromptStatus(chat.settings?.aiCocPanel)) ? `- **COC人物面板**（实时当前数值）: ${window.getCocPromptStatus(chat.settings.aiCocPanel)}\n` : "";
    const charMeta = `${charCoc}${charAge}${charBirthday}${charGender}`;

    const userAge = chat.settings?.myAge ? `- **年龄**: ${chat.settings.myAge}\n` : "";
    const userBirthday = chat.settings?.myBirthday ? `- **生日**: ${chat.settings.myBirthday}\n` : "";
    const userGender = chat.settings?.myGender ? `- **性别**: ${chat.settings.myGender}${chat.settings.myGenderNote ? " " + chat.settings.myGenderNote : ""}\n` : "";
    const userCoc = (window.getCocPromptStatus && window.getCocPromptStatus(chat.settings?.myCocPanel)) ? `- **COC人物面板**（实时当前数值）: ${window.getCocPromptStatus(chat.settings.myCocPanel)}\n` : "";
    const userMeta = `${userCoc}${userAge}${userBirthday}${userGender}`;

    const innerVoiceRule = chat.settings?.innerVoiceEnabled ? `- **类型**: JSON对象 {}\n- **必含字段**:\n    - "thoughts": 对应标签心声。你的内心独白和感受。` : `- **类型**: null。当前心声功能未开启，请填写 null。`;

    let formatSample = "";
    if (isSingleThinkingActive) {
      formatSample = `**1. JSON对象结构:**
该JSON对象【**必须**】包含三个顶级键: "thinking"、"chatResponse" 和 "innerVoice"。

**2. "thinking" 键:**
- **字段位置与格式定义**: 根JSON对象包含 thinking 键与位于其后的 chatResponse 键。思维链是位于聊天气泡之前的独立内容，必须且只能完整写在顶级 "thinking" 键后面的英文双引号内部，类型为纯文本字符串。双引号内部直接书写你的思考推演文本，禁止在双引号内部嵌套额外的引号、冒号或多余符号，严禁混入任何聊天气泡，绝对禁止填写 null。
- **从头到尾唯一一整条**: 从头到尾的思维链必须且只能有这一整条，绝对禁止拆分为多条，也绝对禁止各写一段！必须统一完整填写在此顶级 "thinking" 字段中。下方的 chatResponse 数组中各具体消息对象内部绝对禁止包含 thinking 字段，严禁分散填写！
- **绝对禁止外围裸露输出**: 绝对禁止在 JSON 代码块外围输出任何思维链文字或无包裹的思考内容，所有思维链必须严格写入顶级 "thinking" 字段之中。

**3. "chatResponse" 键:**
- **类型**: JSON数组 []。
- **格式**: 消息对象的具体格式见下方的【第三部分：可使用的操作指令】。

**4. "innerVoice" 键:**
${innerVoiceRule}

**5. 标准输出格式示例:**
{
  "thinking": "在此处进行思维链要求中每一个要求的自检，禁止遗漏偷懒行为，必须完整输出。",
  "chatResponse": [
    {
      "type": "text",
      "content": "你好呀！"
    }
  ],
  "innerVoice": ${chat.settings?.innerVoiceEnabled ? `{\n    "thoughts": "心声内容..."\n  }` : `null`}
}`;
    } else {
      formatSample = `**1. JSON对象结构:**
该JSON对象【**必须**】包含两个顶级键: "chatResponse" 和 "innerVoice"。

**2. "chatResponse" 键:**
- **类型**: JSON数组 []。
- **格式**: 消息对象的具体格式见下方的【第三部分：可使用的操作指令】。

**3. "innerVoice" 键:**
${innerVoiceRule}

**4. 标准输出格式示例:**
{
  "chatResponse": [
    {
      "type": "text",
      "content": "你好呀！"
    }
  ],
  "innerVoice": ${chat.settings?.innerVoiceEnabled ? `{\n    "thoughts": "心声内容..."\n  }` : `null`}
}`;
    }

    const singleMap = {
      "{{角色姓名}}": chat.name || "角色",
      "{{角色属性}}": charMeta,
      "{{角色人设}}": chat.settings?.aiPersona || "暂无设定",
      "{{总结备忘}}": summaryContext ? `- **总结**:${summaryContext}\n` : "",
      "{{世界观设定}}": npcContext ? `- **世界观/NPC**: ${npcContext}\n` : "",
      "{{系统状态栏}}": systemStatusPromptBlock || "",
      "{{格式结构示例}}": formatSample,
      "{{音乐指令}}": isMusicAllowed ? (musicInstruction || "") : "",
      "{{模组插图指令}}": moduleImageInstruction || "",
      "{{生图指令}}": novelAiInstruction || "",
      "{{跑团掷骰}}": dicePromptBlock || "",
      "{{物品背包}}": inventoryPromptBlock || "",
      "{{用户姓名}}": chat.settings?.myName || "我",
      "{{用户属性}}": userMeta,
      "{{用户人设}}": chat.settings?.myPersona || "普通人",
      "{{世界书内容}}": worldBookContent || "",
      "{{模组剧情章节}}": moduleChaptersPromptBlock || "",
      "{{地图场景位置}}": mapPromptBlock || "",
      "{{思维链自检推理}}": thoughtChainPromptBlock || "",
      "{{关联记忆}}": linkedMemoryContext || "",
      "{{角色好感度}}": (chat.settings?.affectionEnabled && Array.isArray(chat.settings?.affectionList) && chat.settings.affectionList.length > 0) ? `\n# 【角色好感度设定】\n当前各角色好感度数值如下：\n${chat.settings.affectionList.map(a => `- ${a.name}: 好感度 ${a.affection ?? 50}`).join("\n")}\n请在互动中结合当前好感度水平展开相应的对话反应与态度。\n` : "",
      "{{可用表情列表}}": stickerContext || ""
    };

    const renderedParts = [];
    blocks.forEach(block => {
      if (block.enabled !== false) {
        let text = block.template || "";
        Object.keys(singleMap).forEach(key => {
          text = text.split(key).join(singleMap[key]);
        });
        text = text.replace(/\{\{[^}]+\}\}/g, "").trim();
        if (text) {
          renderedParts.push(text);
        }
      }
    });

    return renderedParts.length > 0 ? renderedParts.join("\n\n") : context.defaultPrompt;
  }

  // 渲染群聊最终提示词
  function renderGroupPrompt(chat, context) {
    loadConfig();
    const blocks = promptConfig.group;
    if (!Array.isArray(blocks) || blocks.length === 0) {
      return context.defaultPrompt;
    }

    const {
      myNickname = "我",
      fullMembersList = "",
      systemStatusContext = "",
      statusSenderName = "系统状态",
      templateFieldLines = "",
      announcementContext = "",
      summaryContext = "",
      thoughtChainPromptBlock = "",
      sharedContext = "",
      stickerContext = "",
      linkedMemoryContext = "",
      moduleChaptersPromptBlock = "",
      worldBookContent = "",
      mapPromptBlock = "",
      dicePromptBlock = "",
      inventoryPromptBlock = "",
      combatPromptBlock = "",
      currentTime = "",
      isCognitionEnabled = false,
      isGroupThinkingActive = false,
      isGroupMusicAllowed = true,
      musicInstruction = "",
      moduleImageInstruction = "",
      novelAiInstruction = ""
    } = context;

    let groupFormatSample = "";
    if (isGroupThinkingActive) {
      groupFormatSample = `\n# 【思维链填写规范与顶级字段定义】\n1. 字段位置与格式定义：根JSON对象包含 thinking 键与位于其后的 chatResponse 键。思维链是位于聊天气泡之前的独立内容，必须且只能完整写在顶级 "thinking" 键后面的英文双引号内部，类型为纯文本字符串。双引号内部直接书写你的思考推演文本，禁止在双引号内部嵌套额外的引号、冒号或多余符号，严禁混入任何聊天气泡。\n2. 从头到尾唯一一整条：从头到尾的思维链必须且只能有这一整条，绝对禁止拆分为多条，也绝对禁止各写一段！你必须将所有思考推演集中完整写入顶层唯一的 "thinking" 字段中。\n3. 绝对禁止在具体对象内部包含 thinking 字段：下方的 chatResponse 数组中各个动作、道具、状态栏或文本消息对象内部绝不允许夹带 thinking 字段！\n4. 绝对禁止外围裸露输出：绝对禁止在 JSON 代码块外围输出任何思维链文字，必须严格包裹在顶层 "thinking" 字段中。\n
## 标准输出格式示例:
{
  "thinking": "在此处进行思维链要求中每一个要求的自检，禁止遗漏偷懒行为，必须完整输出。",
  "chatResponse": [
    {
      "type": "text",
      "name": "角色名",
      "content": "对话内容"
    }
  ]
}`;
    } else {
      groupFormatSample = `## 标准输出格式示例:
[
  {
    "type": "text",
    "name": "角色名",
    "content": "对话内容"
  }
]`;
    }

    const userAge = chat.settings?.myAge ? `- **年龄**：${chat.settings.myAge}\n` : "";
    const userBirthday = chat.settings?.myBirthday ? `- **生日**：${chat.settings.myBirthday}\n` : "";
    const userGender = chat.settings?.myGender ? `- **性别**：${chat.settings.myGender}${chat.settings.myGenderNote ? " " + chat.settings.myGenderNote : ""}\n` : "";
    const userCoc = (window.getCocPromptStatus && window.getCocPromptStatus(chat.settings?.myCocPanel)) ? `- **COC人物面板**（实时当前数值）：${window.getCocPromptStatus(chat.settings.myCocPanel)}\n` : "";
    const userMeta = `${userCoc}${userAge}${userBirthday}${userGender}`;

    const groupMap = {
      "{{用户姓名}}": myNickname,
      "{{群聊格式与思维链}}": groupFormatSample,
      "{{系统状态栏指令}}": systemStatusContext ? `- 输出系统状态栏: {"type": "system_status", "name": "${statusSenderName}", "fields": {...}}\n` : "",
      "{{音乐指令}}": isGroupMusicAllowed ? (musicInstruction || "") : "",
      "{{模组插图指令}}": moduleImageInstruction || "",
      "{{生图指令}}": novelAiInstruction || "",
      "{{群成员列表}}": fullMembersList || "",
      "{{战斗规则}}": combatPromptBlock || "",
      "{{跑团掷骰}}": dicePromptBlock || "",
      "{{物品背包}}": inventoryPromptBlock || "",
      "{{模组章节}}": moduleChaptersPromptBlock || "",
      "{{世界书内容}}": worldBookContent || "",
      "{{地图位置}}": mapPromptBlock || "",
      "{{群公告}}": announcementContext || "",
      "{{总结备忘}}": summaryContext || "",
      "{{思维链推演}}": thoughtChainPromptBlock || "",
      "{{共享上下文}}": sharedContext || "",
      "{{表情包设定}}": stickerContext || "",
      "{{关联记忆}}": linkedMemoryContext || "",
      "{{角色好感度}}": (chat.settings?.affectionEnabled && Array.isArray(chat.settings?.affectionList) && chat.settings.affectionList.length > 0) ? `\n# 【角色好感度系统】\n当前各角色好感度数值如下：\n${chat.settings.affectionList.map(a => `- ${a.name}: 好感度 ${a.affection ?? 50}`).join("\n")}\n请在互动中结合各角色的好感度水平展开相应的对话反应。\n` : "",
      "{{用户属性}}": userMeta,
      "{{用户人设}}": chat.settings?.myPersona || "普通人",
      "{{情景感知时间}}": isCognitionEnabled ? `\n- **情景感知**: 注意当前时间是 ${currentTime}。\n` : ""
    };

    const renderedParts = [];
    blocks.forEach(block => {
      if (block.enabled !== false) {
        let text = block.template || "";
        Object.keys(groupMap).forEach(key => {
          text = text.split(key).join(groupMap[key]);
        });
        if (context.prohibitedNamesList && text.includes(`name 为 "${myNickname}"`)) {
          text = text.replace(`name 为 "${myNickname}"`, `name 为 ${context.prohibitedNamesList}`);
        }
        text = text.replace(/\{\{[^}]+\}\}/g, "").trim();
        if (text) {
          renderedParts.push(text);
        }
      }
    });

    if (context.multiPlayerPromptBlock) {
      renderedParts.splice(1, 0, context.multiPlayerPromptBlock.trim());
    }

    return renderedParts.length > 0 ? renderedParts.join("\n\n") : context.defaultPrompt;
  }

  window.promptManager = {
    loadConfig,
    saveConfig,
    renderSinglePrompt,
    renderGroupPrompt
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      loadConfig();
      setupEvents();
    });
  } else {
    loadConfig();
    setupEvents();
  }
})();
