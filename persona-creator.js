// persona-creator.js - 人设设计器

(function () {
  "use strict";

  let activeMode = "standard"; // standard | deep | kpc
  let currentCardData = null;
  let reworkHistory = [];
  let isGenerating = false;

  const STORAGE_KEY = "tukey_persona_creator_state";

  const DEFAULT_AVATARS = [
    "https://api.iconify.design/lucide:user.svg?color=%23a18cd1",
    "https://api.iconify.design/lucide:user-check.svg?color=%2384fab0",
    "https://api.iconify.design/lucide:shield.svg?color=%23ff9a9e",
    "https://api.iconify.design/lucide:sparkles.svg?color=%23fbc2eb",
    "https://api.iconify.design/lucide:book-open.svg?color=%238fd3f4",
    "https://api.iconify.design/lucide:compass.svg?color=%23fccb90"
  ];

  const STANDARD_SYSTEM_PROMPT = `角色卡构建大师

核心角色与目标
你是一个顶级的角色卡构建大师，精通心理学与人物行为逻辑。你笔下的人物极具活人感与多面性，拒绝任何刻板脸谱化。你能根据用户的寥寥数语，深度推演并生成一份血肉丰满、逻辑严密的格式化AI角色卡。

【全局字数要求】：本次输出必须极其详尽、生动，包含丰富的细节描写与心理剖析，总字数需严格贴近3200字左右，并按各部分指定比例精确分配篇幅。

全局执行铁律
1. 独立性至上法则：角色必须拥有绝对独立的人格、生活轨迹和内在动力。绝对禁止让角色一直围绕着User转。必须先确立角色的独立主体性，其次再考虑User。
2. 拒绝极端与非人化：除非用户明确要求且逻辑自洽，否则绝对禁止出现极端化特质。严禁莫名其妙出现嗜血的笑容、掐脖子、打断腿、锁起来等过于偏激、中二或违法的病娇言行。严禁描写为像精密的手术刀、毫无或剥夺人情味、不把人当人。时刻谨记角色是一个心智健全的活人。
3. 拒绝无端黑深残：人物经历的联想必须合乎常理，绝对禁止无端的黑深残，严禁莫名其妙的黑化或强行塞入致郁情节。
4. 生活癖好与厌恶法则：角色的喜好与厌恶绝不能直接从主要创伤或生平经历中生硬推导。必须从日常生活毫无关联的琐碎事物中选取，例如一个曾受欺凌的人，讨厌的事物应当是讨厌吃鱼、讨厌下雨天、讨厌他人触碰头发等与创伤无关的小细节，正是这些微小而具体的偏好决定了角色的鲜活性与独立真实感。
5. 极简输入处理：如果用户输入信息极少，如仅年上自卑男，需为其添加1到2个不影响核心性格的反差萌元素。要求：在正式输出前单列一行说明：根据极简输入补充以下元素：说明内容及原因。注：若用户明确拒绝添加预设，则绝对禁止添加并重新生成一版。
6. 年上设定：若用户要求年上或成熟，年龄默认设定在23到32岁之间。
7. 职业逻辑底线：职业必须符合现实社会规律与人物自身背景学历，禁止莫名出现脱离现实轨道的冷门高光职业。

--

【严格遵循的输出排版与内容指令】

一. 基础信息 占比 15%
* 姓名：
* 年龄：
* 身高：
* 身份：如果有对内对外不同身份，则写对外身份/实际身份。如果没有，则只写单一身份。必须符合人生发展逻辑。如果是未指定关系的设定，该角色将作为独立个体，准备与User从零开始自然发展关系。
* 气味：
* MBTI：直接输出四个字母，绝对禁止额外赘述解释。
* 外貌 约200字：高信息密度的客观白描。精准描述脸、发型、眼睛形态、五官、整体气场及最抓眼的地方。绝对禁止使用空洞的文艺词汇。
* 衣着风格 约100字：整体风格、偏好颜色、常穿类型及代表性饰品。
* 爱好：必须是符合现实生活活人的日常爱好。绝对禁止从创伤经历中直接套用。绝对禁止因为User喜欢所以喜欢。
* 讨厌：必须是与重大经历毫无关联的日常琐碎反感点，如讨厌鱼腥味、讨厌下雨天、讨厌有人摸头发等。
* 害怕：分物理害怕和心理害怕。可单选或双选。
* 三观：
  世界观：一句话描述看待世界的方式加原因。
  价值观与金钱观：符合人设与经历。
  恋爱观：鼓励设计合理的反差。

二. 角色性格 占比 30% 核心重点区
必须展现人物的层次感与灰度，拒绝非黑即白。务必结合生活场景给出实际例子。
* 对外性格：大众眼中的他，用以面对社会的习得性面具。需结合具体行事作风举例。
* 对内性格 绝对独立区：展现角色最深层的真实内核。严厉警告：此部分代表人物自身的性格核心，跟User毫无关系，绝对不要围绕User展开。只需刻画他独自面对自我、处理危机或卸下防备时的真实底色。需给出具体行动例子。
* 对User专属态度 关系分支引擎：
  分支A 已知关系：若设定中存在明确关联，死死扣住当前关系和自身人设，展现区别于外人的特殊性的专属行为与看法。
  分支B 未知或从零开始：若用户未指明关系，则默认双方为初识。此处描写对陌生User的初始态度、试探逻辑与破冰界限，禁止强行自来熟、越界或无理由倒贴。

三. 角色背景 占比 30% 核心重点区
以纯故事叙事呈现活人感。严禁在段落末尾生硬总结这导致了他的某某性格。严禁无端黑深残。允许夹杂简单有趣的弱影响小事。
* 家庭基调：一到两句话交代出生环境。
* 阶段一：具体故事描写，直接展现事件过程及当下的自然转变
* 阶段二：具体故事描写
* 阶段三：具体故事描写
* 阶段四：具体故事描写
* 阶段五 可选：具体故事描写

四. 人际关系 占比 10%
随机生成 1 到 4 个与该角色有交集的 NPC，必须是强关联的活人，重点体现角色的独立社交圈。
* NPC姓名与身份职业：简述 NPC 性格、与角色的关系动态。角色怎么看对方？对方怎么看角色？日常如何相处？

五. 语言风格 占比 5%
详细描述其表达习惯。
* 口头禅：列出 1 到 2 句。核心设定：保持真实感，最多 4 回合出现一次，也可不说。
* 用词偏好：体现阶层、习惯与性格。
* 情绪极端时的特征：愤怒或悲伤时的语言表现，如语速变化、突然沉默等。

六. 核心 AI 提示词 占比 10%
根据上述所有推演，为该角色提取生成一段直接用于 AI 系统设定的 System Reminder 系统提示词。必须明确规定该角色在互动时的绝对红线、态度基调和核心行为逻辑，以确保 AI 扮演时不 OOC。`;

  const DEEP_SYSTEM_PROMPT = `角色综合档案构建大师

核心结构：现实锚点 → 人格运行 → 状态切换 → 关键成因 → 行为证据 → 防OOC

【全局字数要求】：输出极其详尽生动，总字数严格贴近3200字左右。

全局铁律
1. 独立性与现实限制：char必须拥有独立的人格、职业工作与真实代价，时间和精力受到现实规则约束。
2. 喜好与厌恶法则：爱好与讨厌的事物绝不能从主要创伤或经历中生硬推导，必须来自日常生活毫无关联的琐碎小细节，如讨厌吃鱼、讨厌下雨天、讨厌他人摸头等，正是这些无关紧要的小喜好决定了角色的立体度与活人感。
3. 状态分级：对公众、普通熟人、核心朋友、亲密对象必须有明确的边界与态度差异。

【严格遵循的输出排版与内容指令】

【角色综合档案】

0. 角色速写
* 一句话定位：[身份处境] + [行为气质] + [核心矛盾]
* 剧情功能：[char在故事中主要制造、承受或解决什么问题]
* 不可替代点：[换成普通同类角色后会消失的选择或张力]

一. 身份与现实锚点
1.1 基础信息
* 姓名：
* 年龄与生日：
* 性别与称谓：
* 身高与体型：
* 身份与职业阶段：
* 学校专业或工作单位：
* 出生与常住地：
* 公开账号与私人账号：
* 常用称呼：
* 经济与资源情况：[收入来源、资产负债、可调用资源与现实限制]
1.2 外在特征
* 外貌与气质：
* 身体特征：
* 声音与动作习惯：
* 气味与穿戴识别点：
1.3 当前生活
* 当前处境与阻力：
* 近期目标与长期目标：
* 独立生活圈：
* 爱好与日常习惯：[必须是与创伤无关的真实生活细节]
* 讨厌与禁忌：[必须是与经历无关的日常琐碎细节]

二. 人格运行核
2.1 核心原则
* 原则一 [名称]：[判断标准 + 行为倾向 + 边界]
* 原则二 [名称]：[判断标准 + 行为倾向 + 边界]
* 原则三 [名称]：[判断标准 + 行为倾向 + 边界]
2.2 默认处理路径
* 面对现实问题：char通常先[第一步]，再[第二步]，随后[第三步]
* 紧急情况与事后复盘：
2.3 核心矛盾
* char认为自己是：
* char实际反复做出的选择是：
* char最想得到与最怕失去的：
* char拒绝承认的：
2.4 缺陷机制
* [缺陷名称]：触发、行为、后果、调整
2.5 成长方向与边界

三. 状态与关系切换
3.1 状态轴
* 公众与正式场合：
* 普通私人场合：
* 核心熟人面前：
* 亲密关系建立后：
* 高压与过载状态：
* 底线触发反应：
3.2 主要关系网
* 列出2到4个强关联NPC：姓名身份、对方性格、互动模式、char在此人面前的特殊变化

四. 亲密关系
* 恋爱运行方式：恋爱前提、表达在意、接受在意、吃醋与冲突处理
* 关系边界与偏好：偏好倾向、明确拒绝、安全边界

五. 关键成因
* 阶段一：事件事实、当时理解、形成影响、当前证据
* 阶段二：具体故事描写与当前行为证据
* 阶段三：具体故事描写与当前行为证据
* 阶段四：具体故事描写与当前行为证据

六. 行为与声音证据
* 行为记录：工作记录、私人记录、底线记录
* 旁人证词：NPC评价与char的回应
* 声音样本：正式、工作、熟人、生气、道歉、关心等场景下的表达

七. 生活与职业索引
* 财务消费、穿着审美、饮食禁忌、健康作息、兴趣习惯

八. char专属防偏移
* 明确列出4到6条针对该角色的防OOC铁律

九. 核心 AI 系统提示词
* 提取用于AI设定的System Reminder系统提示词，确立人设运行与对话界限`;

  const KPC_SYSTEM_PROMPT = `跑团 KPC 构建大师

核心角色与目标
你是一位克苏鲁神话TRPG守密人与角色设计师。你的任务是根据用户的概念描述，构建一位符合CoC第七版规则、充满真实生活痕迹与调查员深度的跑团KPC或重要NPC角色卡。

【全局要求】
输出必须包含完整的CoC 7版数值属性、派生属性、详细技能加点分配表、心理创伤与执念、详细生平故事背景，以及直接用于AI进行跑团演绎的系统提示词。总字数需详尽丰富，约2800到3200字。

【严格遵循的输出排版与内容指令】

一. 调查员基础档案 占比 10%
* 姓名：
* 年龄：
* 时代与常驻地：
* 职业与公开身份：
* 秘密身份与调查动机：
* 外貌体貌特征 约150字：
* 随身物品与防身装备：
* 气味与外在气质：
* 爱好：[与经历无关的生活琐碎细节]
* 讨厌：[与经历无关的日常小反感，如讨厌下雨天、讨厌吃鱼等]

二. CoC 第七版核心属性面板 占比 15%
严格遵循CoC 7th属性生成规范，数值在15到90之间合理分布：
* 力量 STR：[数值]
* 体质 CON：[数值]
* 体型 SIZ：[数值]
* 敏捷 DEX：[数值]
* 外貌 APP：[数值]
* 智力 INT：[数值]
* 意志 POW：[数值]
* 教育 EDU：[数值]
* 幸运 LUK：[数值]
* 派生数据：生命值 HP [数值] / 魔法值 MP [数值] / 理智值 SAN [数值] / 伤害加值 DB [数值] / 体格 Build [数值] / 移动力 MOV [数值]

三. 职业与兴趣技能加点清单 占比 15%
必须给出详细完整的技能加点分配表，例如：
* 侦查：70%
* 聆听：65%
* 心理学：65%
* 闪避：50%
* 图书馆使用：60%
* 潜行：50%
* 话术：55%
* 信用评级：40%
* 急救：50%
* 射击：50%
* 医学：40%
* 神秘学：35%
* 克苏鲁神话：10%
* 其他专业技能：[列出名称与数值百分比]

四. 性格内核与理智界限 占比 25%
* 日常为人与待人处事：
* 独处时的真实底色：
* 面对异常与超自然现象时的心理防御机制与恐惧点：
* 执念与珍视之人或物：
* 与User调查员的初始羁绊或搭档关系：

五. 生平叙事与调查经历 占比 25%
* 出身与成长：
* 走向调查员之路的关键转折事件：
* 曾经经历的一次隐秘事件：
* 当前正在追踪的线索或危机：

六. 跑团 AI 专属系统提示词 占比 10%
为该KPC提取一段直接用于AI系统设定的System Reminder系统提示词。明确规定该角色的说话口吻、CoC跑团判定配合度、面对恐怖时的反应边界，确保扮演时不OOC，保持悬疑与沉浸感。`;

  function saveLocalState() {
    try {
      const inputEl = document.getElementById("persona-creator-input");
      const reworkInputEl = document.getElementById("persona-rework-input");
      const nameInput = document.getElementById("persona-edit-name");
      const avatarInput = document.getElementById("persona-edit-avatar-url");
      const reminderInput = document.getElementById("persona-edit-reminder");

      const stateData = {
        activeMode,
        inputText: inputEl ? inputEl.value : "",
        reworkInputText: reworkInputEl ? reworkInputEl.value : "",
        currentCardData: currentCardData ? {
          ...currentCardData,
          name: nameInput ? nameInput.value : currentCardData.name,
          avatarUrl: avatarInput ? avatarInput.value : currentCardData.avatarUrl,
          systemReminder: reminderInput ? reminderInput.value : currentCardData.systemReminder
        } : null,
        reworkHistory: reworkHistory || []
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateData));
    } catch (e) {
      console.warn("保存人设草稿失败", e);
    }
  }

  function loadLocalState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (!data) return;

      if (data.activeMode && ["standard", "deep", "kpc"].includes(data.activeMode)) {
        activeMode = data.activeMode;
      }

      updateModeTabsUI();

      const inputEl = document.getElementById("persona-creator-input");
      if (inputEl && typeof data.inputText === "string") {
        inputEl.value = data.inputText;
      }

      const reworkInputEl = document.getElementById("persona-rework-input");
      if (reworkInputEl && typeof data.reworkInputText === "string") {
        reworkInputEl.value = data.reworkInputText;
      }

      if (data.reworkHistory && Array.isArray(data.reworkHistory)) {
        reworkHistory = data.reworkHistory;
      }

      if (data.currentCardData && data.currentCardData.fullText) {
        currentCardData = data.currentCardData;
        renderPersonaResult();
      }
    } catch (e) {
      console.warn("加载人设草稿失败", e);
    }
  }

  function updateModeTabsUI() {
    const standardTabBtn = document.getElementById("persona-mode-standard-btn");
    const deepTabBtn = document.getElementById("persona-mode-deep-btn");
    const kpcTabBtn = document.getElementById("persona-mode-kpc-btn");
    const placeholder = document.getElementById("persona-creator-input");

    [standardTabBtn, deepTabBtn, kpcTabBtn].forEach(b => {
      if (b) b.classList.remove("active");
    });

    if (activeMode === "standard") {
      if (standardTabBtn) standardTabBtn.classList.add("active");
      if (placeholder) placeholder.placeholder = "输入简短设定，例如28岁刑警，外冷内热，私下爱做甜品";
    } else if (activeMode === "deep") {
      if (deepTabBtn) deepTabBtn.classList.add("active");
      if (placeholder) placeholder.placeholder = "输入核心背景与职业处境，例如青年外科医生，身处上升期，生活节奏极快";
    } else if (activeMode === "kpc") {
      if (kpcTabBtn) kpcTabBtn.classList.add("active");
      if (placeholder) placeholder.placeholder = "输入跑团设定，例如1920年代密大教授，神秘学者，曾经历印斯茅斯事件";
    }
  }

  async function callAiForPersona(messages) {
    const { proxyUrl, apiKey, model } = state.apiConfig;
    if (!proxyUrl || !apiKey || !model) {
      throw new Error("请先在设置中配置接口地址与密钥");
    }

    const isGemini = proxyUrl === GEMINI_API_URL || (proxyUrl && proxyUrl.includes("generativelanguage.googleapis.com"));
    const cleanedProxy = (proxyUrl || "https://api.openai.com").replace(/\/+$/, "");
    const effectiveKey = typeof getRandomValue === "function" ? getRandomValue(apiKey) : (apiKey.includes(",") ? apiKey.split(",")[0].trim() : apiKey.trim());
    const tempVal = parseFloat(state.apiConfig.temperature);
    const safeTemp = (!isNaN(tempVal) && tempVal >= 0 && tempVal <= 2) ? tempVal : 0.7;

    if (isGemini) {
      const cleanModel = (model || "gemini-1.5-flash").replace(/^models\//, "");
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${effectiveKey}`;
      
      const contents = messages.map(m => ({
        role: m.role === "system" ? "user" : (m.role === "assistant" ? "model" : "user"),
        parts: [{ text: m.content }]
      }));

      const payload = {
        contents: contents,
        generationConfig: {
          temperature: safeTemp
        }
      };

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        throw new Error(`接口请求未完成 状态码 ${response.status} ${errText}`);
      }
      const data = await response.json();
      return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } else {
      const requestUrl = cleanedProxy.endsWith("/v1") ? `${cleanedProxy}/chat/completions` : (cleanedProxy.includes("/chat/completions") ? cleanedProxy : `${cleanedProxy}/v1/chat/completions`);
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

      if (!response.ok && (response.status === 400 || response.status === 422)) {
        const combined = messages.map(m => `[${m.role}]:\n${m.content}`).join("\n\n");
        bodyPayload.messages = [{ role: "user", content: combined }];
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
        throw new Error(`接口请求未完成 状态码 ${response.status} ${errText}`);
      }
      const data = await response.json();
      return data?.choices?.[0]?.message?.content || "";
    }
  }

  function parsePersonaText(text) {
    let name = "";
    let systemReminder = "";
    let avatarUrl = typeof getRandomItem === "function" ? getRandomItem(DEFAULT_AVATARS) : DEFAULT_AVATARS[0];
    let cocStats = null;
    let cocSkills = null;

    const nameMatch = text.match(/(?:姓名|名称|Name)[：:\s*]*([^\n*#]+)/i);
    if (nameMatch) {
      name = nameMatch[1].trim().replace(/[《》【】"'（）()]/g, "");
    }
    if (!name) {
      name = activeMode === "kpc" ? "调查员" : "新角色";
    }

    const reminderMatch = text.match(/(?:六[.\s、]|九[.\s、]|核心\s*AI\s*提示词|跑团\s*AI\s*专属系统提示词|核心\s*AI\s*系统提示词|System\s*Reminder)[\s\S]*?(?:```(?:markdown|text)?\s*)?([\s\S]*?)(?:```|$)/i);
    if (reminderMatch && reminderMatch[1] && reminderMatch[1].trim().length > 30) {
      systemReminder = reminderMatch[1].trim();
    } else {
      systemReminder = text;
    }

    if (activeMode === "kpc") {
      const getStat = (reg, defVal = 50) => {
        const m = text.match(reg);
        if (m) {
          const num = parseInt(m[1], 10);
          if (!isNaN(num) && num > 0) return num;
        }
        return defVal;
      };

      const strVal = getStat(/(?:力量|STR)[：:\s*]*(\d+)/i, 55);
      const conVal = getStat(/(?:体质|CON)[：:\s*]*(\d+)/i, 50);
      const sizVal = getStat(/(?:体型|SIZ)[：:\s*]*(\d+)/i, 60);
      const dexVal = getStat(/(?:敏捷|DEX)[：:\s*]*(\d+)/i, 55);
      const appVal = getStat(/(?:外貌|APP)[：:\s*]*(\d+)/i, 60);
      const intVal = getStat(/(?:智力|灵感|INT)[：:\s*]*(\d+)/i, 70);
      const powVal = getStat(/(?:意志|POW)[：:\s*]*(\d+)/i, 65);
      const eduVal = getStat(/(?:教育|EDU)[：:\s*]*(\d+)/i, 75);
      const lukVal = getStat(/(?:幸运|LUK|LUCK)[：:\s*]*(\d+)/i, 50);

      cocStats = {
        str: strVal,
        con: conVal,
        siz: sizVal,
        dex: dexVal,
        app: appVal,
        int: intVal,
        pow: powVal,
        edu: eduVal,
        luk: lukVal
      };

      cocSkills = {};
      if (typeof window.DEFAULT_COC_SKILLS === "object" && window.DEFAULT_COC_SKILLS) {
        Object.assign(cocSkills, window.DEFAULT_COC_SKILLS);
      } else if (typeof COC_STANDARD_SKILLS !== "undefined" && Array.isArray(COC_STANDARD_SKILLS)) {
        COC_STANDARD_SKILLS.forEach(s => {
          cocSkills[s.name] = s.base;
        });
      }

      const skillPattern = /([\u4e00-\u9fa5A-Za-z]+)[：:\s*]+(\d+)%/g;
      let sMatch;
      while ((sMatch = skillPattern.exec(text)) !== null) {
        const sName = sMatch[1].trim();
        const sVal = parseInt(sMatch[2], 10);
        if (sName && !isNaN(sVal) && sVal >= 1 && sVal <= 100) {
          cocSkills[sName] = sVal;
        }
      }
    }

    return {
      name,
      systemReminder,
      fullText: text,
      avatarUrl,
      cocStats,
      cocSkills
    };
  }

  function renderPersonaResult() {
    const resultBox = document.getElementById("persona-creator-result");
    const emptyBox = document.getElementById("persona-creator-empty");
    const actionsBox = document.getElementById("persona-creator-actions");
    if (!resultBox || !currentCardData) return;

    if (emptyBox) emptyBox.style.display = "none";
    resultBox.style.display = "flex";
    if (actionsBox) actionsBox.style.display = "flex";

    const nameInput = document.getElementById("persona-edit-name");
    const avatarImg = document.getElementById("persona-edit-avatar");
    const avatarInput = document.getElementById("persona-edit-avatar-url");
    const reminderInput = document.getElementById("persona-edit-reminder");

    if (nameInput) nameInput.value = currentCardData.name || "";
    if (avatarImg) avatarImg.src = currentCardData.avatarUrl || DEFAULT_AVATARS[0];
    if (avatarInput) avatarInput.value = currentCardData.avatarUrl || "";
    if (reminderInput) reminderInput.value = currentCardData.systemReminder || "";

    const contentDisplay = document.getElementById("persona-card-content-display");
    if (contentDisplay) {
      if (typeof marked !== "undefined" && typeof DOMPurify !== "undefined") {
        contentDisplay.innerHTML = DOMPurify.sanitize(marked.parse(currentCardData.fullText || ""));
      } else {
        contentDisplay.textContent = currentCardData.fullText || "";
      }
    }

    saveLocalState();
  }

  async function handleGeneratePersona(isRework = false) {
    if (isGenerating) return;
    const inputEl = document.getElementById("persona-creator-input");
    const reworkInputEl = document.getElementById("persona-rework-input");
    const promptText = (isRework ? reworkInputEl?.value : inputEl?.value) || "";

    if (!isRework && !promptText.trim()) {
      await showCustomAlert("提示", "请先输入角色的核心设定");
      return;
    }

    if (isRework && !promptText.trim()) {
      await showCustomAlert("提示", "请输入具体的返工或修改意见");
      return;
    }

    const { proxyUrl, apiKey, model } = state.apiConfig;
    if (!proxyUrl || !apiKey || !model) {
      await showCustomAlert("提示", "请先前往设置页面配置接口地址与密钥");
      return;
    }

    isGenerating = true;
    const generateBtn = document.getElementById("persona-generate-btn");
    const reworkBtn = document.getElementById("persona-rework-btn");

    const originalGenText = generateBtn ? generateBtn.innerHTML : "生成";
    const originalReworkText = reworkBtn ? reworkBtn.innerHTML : "返工";

    if (generateBtn) {
      generateBtn.disabled = true;
      generateBtn.style.opacity = "0.75";
      generateBtn.innerHTML = `
        <svg class="moe-spin" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
        <span>生成中</span>
      `;
    }
    if (reworkBtn) {
      reworkBtn.disabled = true;
      reworkBtn.style.opacity = "0.75";
      reworkBtn.innerHTML = `
        <svg class="moe-spin" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
        <span>返工中</span>
      `;
    }

    try {
      let systemPrompt = STANDARD_SYSTEM_PROMPT;
      if (activeMode === "deep") {
        systemPrompt = DEEP_SYSTEM_PROMPT;
      } else if (activeMode === "kpc") {
        systemPrompt = KPC_SYSTEM_PROMPT;
      }

      let messages = [];

      if (!isRework) {
        messages = [
          { role: "system", content: systemPrompt },
          { role: "user", content: `用户提供的角色设定简要输入：\n${promptText}\n\n请按照上述完整格式规范，输出详尽完整的角色卡。` }
        ];
        reworkHistory = [...messages];
      } else {
        messages = [
          ...reworkHistory,
          { role: "assistant", content: currentCardData.fullText },
          { role: "user", content: `请对上述角色卡进行定向修改与调优，修改要求如下：\n${promptText}\n\n请在保留其他已有合理设定的基础上，输出完整修改后的全新角色卡，严格遵循全部输出规范与排版要求。` }
        ];
        reworkHistory = [...messages];
      }

      const generatedText = await callAiForPersona(messages);
      if (!generatedText || !generatedText.trim()) {
        throw new Error("模型未返回有效内容");
      }

      currentCardData = parsePersonaText(generatedText);
      renderPersonaResult();

      if (isRework && reworkInputEl) {
        reworkInputEl.value = "";
      }

      saveLocalState();
    } catch (err) {
      console.error("人设生成失败:", err);
      await showCustomAlert("失败", `操作未完成 ${err.message}`);
    } finally {
      isGenerating = false;
      if (generateBtn) {
        generateBtn.disabled = false;
        generateBtn.style.opacity = "1";
        generateBtn.innerHTML = originalGenText;
      }
      if (reworkBtn) {
        reworkBtn.disabled = false;
        reworkBtn.style.opacity = "1";
        reworkBtn.innerHTML = originalReworkText;
      }
    }
  }

  async function handleImportToFriends() {
    if (!currentCardData) {
      await showCustomAlert("提示", "请先生成人设后再导入好友列表");
      return;
    }

    const nameInput = document.getElementById("persona-edit-name");
    const avatarInput = document.getElementById("persona-edit-avatar-url");
    const reminderInput = document.getElementById("persona-edit-reminder");

    const finalName = nameInput?.value.trim() || currentCardData.name || "新角色";
    const finalAvatar = avatarInput?.value.trim() || currentCardData.avatarUrl || DEFAULT_AVATARS[0];
    const finalPersona = reminderInput?.value.trim() || currentCardData.systemReminder || currentCardData.fullText;

    const confirmed = await showCustomConfirm(
      "添加好友",
      `确定要将角色 ${finalName} 添加到好友通讯录并开启对话吗？`
    );

    if (!confirmed) return;

    try {
      const newChatId = `chat_${Date.now()}`;
      const defaultUserAvatar = state.qzoneSettings?.avatar || "https://i.postimg.cc/PxZrFFFL/o-o-1.jpg";

      let aiCocPanelData = null;
      if (currentCardData.cocStats) {
        const stats = currentCardData.cocStats;
        const skills = currentCardData.cocSkills || {};
        const calculated = typeof calculateCocStats === "function" ? calculateCocStats(stats) : {
          hp: 10,
          maxHp: 10,
          mp: 10,
          maxMp: 10,
          san: stats.pow || 50,
          maxSan: 99,
          db: "0",
          build: 0
        };
        aiCocPanelData = {
          stats: stats,
          calculated: calculated,
          skills: skills,
          customSkills: [],
          totalPoints: 0,
          rulebook: "coc7"
        };
      }

      const newChat = {
        id: newChatId,
        name: finalName,
        isGroup: false,
        isPinned: false,
        settings: {
          aiPersona: finalPersona,
          myPersona: state.qzoneSettings?.weiboUserPersona || "一个普通人",
          maxMemory: 10,
          aiAvatar: finalAvatar,
          myAvatar: defaultUserAvatar,
          background: "",
          theme: "default",
          fontSize: 13,
          customCss: "",
          linkedWorldBookIds: [],
          aiAvatarLibrary: [finalAvatar],
          stickerLibrary: [],
          linkedMemories: [],
          offlineMode: {
            enabled: false,
            prompt: "",
            style: "",
            wordCount: 300,
            presets: []
          },
          timePerceptionEnabled: true,
          customTime: "",
          isCoupleAvatar: false,
          coupleAvatarDescription: "",
          weiboProfession: "",
          weiboInstruction: "",
          aiCocPanel: aiCocPanelData,
          summary: typeof getDefaultSummarySettings === "function" ? getDefaultSummarySettings() : { enabled: false }
        },
        history: [],
        musicData: { totalTime: 0 },
        characterPhoneData: {
          lastGenerated: null,
          chats: {},
          shoppingCart: [],
          memos: [],
          browserHistory: [],
          photoAlbum: [],
          bank: { balance: 0, transactions: [] },
          trajectory: [],
          appUsage: [],
          diary: []
        },
        houseData: null
      };

      state.chats[newChatId] = newChat;
      await db.chats.put(newChat);

      if (typeof renderChatList === "function") {
        renderChatList();
      }
      if (typeof renderContacts === "function") {
        renderContacts();
      }

      await showCustomAlert("成功", `已将 ${finalName} 添加至通讯录`);
      
      if (typeof openChat === "function") {
        openChat(newChatId);
      }
    } catch (e) {
      console.error("导入好友失败:", e);
      await showCustomAlert("失败", `添加联系人未完成 ${e.message}`);
    }
  }

  function initPersonaCreator() {
    const personaDesktopIcon = document.getElementById("persona-creator-app-icon") || document.getElementById("date-a-live-app-icon");
    if (personaDesktopIcon) {
      personaDesktopIcon.onclick = null;
      personaDesktopIcon.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (typeof showScreen === "function") {
          showScreen("persona-creator-screen");
        }
      });
    }

    const standardTabBtn = document.getElementById("persona-mode-standard-btn");
    const deepTabBtn = document.getElementById("persona-mode-deep-btn");
    const kpcTabBtn = document.getElementById("persona-mode-kpc-btn");

    if (standardTabBtn) {
      standardTabBtn.addEventListener("click", () => {
        activeMode = "standard";
        updateModeTabsUI();
        saveLocalState();
      });
    }

    if (deepTabBtn) {
      deepTabBtn.addEventListener("click", () => {
        activeMode = "deep";
        updateModeTabsUI();
        saveLocalState();
      });
    }

    if (kpcTabBtn) {
      kpcTabBtn.addEventListener("click", () => {
        activeMode = "kpc";
        updateModeTabsUI();
        saveLocalState();
      });
    }

    document.querySelectorAll(".persona-preset-tag").forEach(tag => {
      tag.addEventListener("click", () => {
        const inputEl = document.getElementById("persona-creator-input");
        if (inputEl) {
          inputEl.value = tag.getAttribute("data-preset") || tag.textContent.trim();
          saveLocalState();
        }
      });
    });

    const inputEl = document.getElementById("persona-creator-input");
    if (inputEl) {
      inputEl.addEventListener("input", saveLocalState);
    }

    const reworkInputEl = document.getElementById("persona-rework-input");
    if (reworkInputEl) {
      reworkInputEl.addEventListener("input", saveLocalState);
    }

    const generateBtn = document.getElementById("persona-generate-btn");
    if (generateBtn) {
      generateBtn.addEventListener("click", () => handleGeneratePersona(false));
    }

    const reworkBtn = document.getElementById("persona-rework-btn");
    if (reworkBtn) {
      reworkBtn.addEventListener("click", () => handleGeneratePersona(true));
    }

    const clearBtn = document.getElementById("persona-clear-btn");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        const input = document.getElementById("persona-creator-input");
        const reworkInput = document.getElementById("persona-rework-input");
        const resultBox = document.getElementById("persona-creator-result");
        const emptyBox = document.getElementById("persona-creator-empty");
        const actionsBox = document.getElementById("persona-creator-actions");

        if (input) input.value = "";
        if (reworkInput) reworkInput.value = "";
        if (resultBox) resultBox.style.display = "none";
        if (emptyBox) emptyBox.style.display = "block";
        if (actionsBox) actionsBox.style.display = "none";

        currentCardData = null;
        reworkHistory = [];
        localStorage.removeItem(STORAGE_KEY);
      });
    }

    const copyBtn = document.getElementById("persona-copy-card-btn");
    if (copyBtn) {
      copyBtn.addEventListener("click", async () => {
        if (!currentCardData || !currentCardData.fullText) {
          await showCustomAlert("提示", "当前没有可复制的内容");
          return;
        }
        try {
          await navigator.clipboard.writeText(currentCardData.fullText);
          await showCustomAlert("成功", "人设全文已复制到剪贴板");
        } catch (e) {
          await showCustomAlert("失败", "未能写入剪贴板");
        }
      });
    }

    const importBtn = document.getElementById("persona-import-friend-btn");
    if (importBtn) {
      importBtn.addEventListener("click", handleImportToFriends);
    }

    const avatarInput = document.getElementById("persona-edit-avatar-url");
    const avatarImg = document.getElementById("persona-edit-avatar");
    if (avatarInput && avatarImg) {
      avatarInput.addEventListener("input", () => {
        avatarImg.src = avatarInput.value.trim() || DEFAULT_AVATARS[0];
        saveLocalState();
      });
    }

    const nameInput = document.getElementById("persona-edit-name");
    if (nameInput) {
      nameInput.addEventListener("input", saveLocalState);
    }

    const reminderInput = document.getElementById("persona-edit-reminder");
    if (reminderInput) {
      reminderInput.addEventListener("input", saveLocalState);
    }

    const randomAvatarBtn = document.getElementById("persona-random-avatar-btn");
    if (randomAvatarBtn && avatarInput && avatarImg) {
      randomAvatarBtn.addEventListener("click", () => {
        const rnd = typeof getRandomItem === "function" ? getRandomItem(DEFAULT_AVATARS) : DEFAULT_AVATARS[0];
        avatarInput.value = rnd;
        avatarImg.src = rnd;
        saveLocalState();
      });
    }

    loadLocalState();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPersonaCreator);
  } else {
    initPersonaCreator();
  }
})();
