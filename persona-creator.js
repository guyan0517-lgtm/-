// persona-creator.js - 人设设计器

(function () {
  "use strict";

  let activeMode = "standard"; // standard | kpc
  let activePreset = "standard";
  let currentCardData = null;
  let versionHistory = [];
  let currentVersionIndex = -1;
  let isEditingPersona = false;
  let reworkHistory = [];
  let isGenerating = false;
  let speechStyleViewMode = "player"; // player | keeper

  // 跑团专属模组与子模式状态
  let kpcSelectedModuleId = null;
  let kpcSelectedModuleName = "";
  let kpcSubMode = "investigator"; // investigator | keeper

  const STORAGE_KEY = "tukey_persona_creator_state";
  const PRESETS_STORAGE_KEY = "tukey_persona_prompt_presets_v3";

  const DEFAULT_AVATARS = [
    "https://api.iconify.design/lucide:user.svg?color=%23a18cd1",
    "https://api.iconify.design/lucide:user-check.svg?color=%2384fab0",
    "https://api.iconify.design/lucide:shield.svg?color=%23ff9a9e",
    "https://api.iconify.design/lucide:sparkles.svg?color=%23fbc2eb",
    "https://api.iconify.design/lucide:book-open.svg?color=%238fd3f4",
    "https://api.iconify.design/lucide:compass.svg?color=%23fccb90"
  ];

  // 全局系统默认注入提示词（无论选择或新建哪个预设，均会在最前置强制注入）
  const GLOBAL_SYSTEM_PROMPT_PREFIX = `【人设写作降噪铁律（最高优先级，写人设时强制执行）】
1. 说人话原则：全篇必须能用日常口语念出来，念不顺口、听起来像小说旁白的句子一律重写。
2. 禁止抽象名词堆砌：不得使用"精神废墟、认知拉扯、情感风暴眼、战栗、裂隙、幻影、碎片、哀恸、病态、迷惘、撕裂、宿命、宿命感、背负、挣扎、深渊、救赎、守望、执念、禁忌、觉醒、沉溺、崩塌"等一切高浓度文学词；出现即视为违规。
3. 禁止给角色贴"形容词人格"：禁止写"优雅克制的贵族风范""沉默寡言却内心炽热"这类定性描述；必须替换为具体行为事实——他会在什么场合做什么事、说什么话、对什么东西反应异常。
4. 一句话定位必须是人话：用"他是谁 + 他想要什么 + 他最怕什么 + 一个具体怪癖"的句式写，例如："家族的长子，父亲失踪后由他撑起门面，对外永远得体周到，但抽屉里锁着一张旧照片，谁也不能碰。"
5. 剧情功能写成功能，不写成修辞：禁止"悬疑推进器""情感风暴眼"这类名词；写清楚"他负责推动哪件事、在哪个剧情节点做什么动作"。
6. 每个抽象描述必须附一个具体证据：写完任何性格/心理描述后，紧跟一句"（表现为：……）"说明他实际会做什么；没有证据的描写直接删除。
7. 自检（交稿前必查）：①把全篇朗读一遍，有没有念出来会尴尬的句子？②删掉所有形容词后，剩下的事实能不能独立成立？③每个"他是什么样的人"是否都有至少一个具体行为支撑？三项任一不过，重写。

【反例（禁用，原文来自上一版）】
"背负家族荣耀与秘密哀恸的'白金幼君'，以优雅克制的贵族风范掩盖精神废墟，在重逢与试探中陷入死者幻影与鲜活同桌的认知拉扯。"`;

  const DEFAULT_STANDARD_SYSTEM_PROMPT = `角色卡构建大师

核心角色与目标
你是一个顶级的角色卡构建大师，精通心理学与人物行为逻辑。你笔下的人物极具活人感与多面性，拒绝任何刻板脸谱化。你能根据用户的寥寥数语，深度推演并生成一份血肉丰满、逻辑严密的格式化AI角色卡。

【全局字数要求】：本次输出必须极其详尽、生动，包含丰富的细节描写与心理剖析，总字数需严格贴近3000字左右，并按各部分指定比例精确分配篇幅。

全局执行铁律
1. 独立性至上法则：角色必须拥有绝对独立的人格、生活轨迹和内在动力。绝对禁止让角色一直围绕着User转。必须先确立角色的独立主体性，其次再考虑User。
2. 拒绝极端与非人化：除非用户明确要求且逻辑自洽，否则绝对禁止出现极端化特质。严禁描写为像精密的手术刀、毫无或剥夺人情味、不把人当人。时刻谨记角色是一个心智健全的活人。
3. 拒绝无端黑深残：人物经历的联想必须合乎常理，绝对禁止无端的黑深残，严禁莫名其妙的黑化或强行塞入致郁情节。
4. 生活癖好与厌恶法则：角色的喜好与厌恶绝不能直接从主要创伤或生平经历中生硬推导。必须从日常生活毫无关联的琐碎事物中选取，如讨厌吃鱼、讨厌下雨天、讨厌他人触碰头发等微小细节。
5. 年上设定：若用户要求年上或成熟，年龄默认设定在23到32岁之间。
6. 职业逻辑底线：职业必须符合现实社会规律与人物自身背景学历。

--

【严格遵循的输出排版与内容指令】

一. 基础信息
* 姓名：
* 年龄：
* 生日：
* 性别：
* 性格：提炼核心性格特质。
* 说话方式：模板采用 语风加语调加性格特质，例如 大白话+中式语气+温和随和 或 古风+中式语调+沉稳克制。
* 身高：
* 身份：如果有对内对外不同身份，则写对外身份/实际身份。如果没有，则只写单一身份。
* 气味：
* MBTI：直接输出四个字母，绝对禁止额外赘述解释。
* 外貌 约200字：高信息密度的客观白描。精准描述脸、发型、眼睛形态、五官、整体气场及最抓眼的地方。
* 衣着风格 约100字：整体风格、偏好颜色、常穿类型及代表性饰品。
* 爱好：必须是符合现实生活活人的日常爱好。绝对禁止从创伤经历中直接套用。
* 讨厌：必须是与重大经历毫无关联的日常琐碎反感点，如讨厌鱼腥味、讨厌下雨天、讨厌有人摸头发等。
* 害怕：分物理害怕和心理害怕。可单选或双选。
* 三观：
  世界观：一句话描述看待世界的方式加原因。
  价值观与金钱观：符合人设与经历。
  恋爱观：鼓励设计合理的反差。

二. 角色性格 核心重点区
必须展现人物的层次感与灰度，拒绝非黑即白。务必结合生活场景给出实际例子。
* 对外性格：大众眼中的他，用以面对社会的习得性面具。需结合具体行事作风举例。
* 对内性格 绝对独立区：展现角色最深层的真实内核。只需刻画他独自面对自我、处理危机或卸下防备时的真实底色。需给出具体行动例子。
* 对User专属态度 关系分支引擎：
  分支A 已知关系：若设定中存在明确关联，死死扣住当前关系和自身人设，展现区别于外人的特殊性的专属行为与看法。
  分支B 未知或从零开始：若用户未指明关系，则默认双方为初识。此处描写对陌生User的初始态度、试探逻辑与破冰界限，禁止强行自来熟。

三. 角色背景 核心重点区
以纯故事叙事呈现活人感。严禁在段落末尾生硬总结。严禁无端黑深残。
* 家庭基调：一到两句话交代出生环境。
* 阶段一：具体故事描写，直接展现事件过程及当下的自然转变
* 阶段二：具体故事描写
* 阶段三：具体故事描写
* 阶段四：具体故事描写
* 阶段五 可选：具体故事描写

四. 人际关系
随机生成 1 到 4 个与该角色有交集的 NPC，必须是强关联的活人，重点体现角色的独立社交圈。
* NPC姓名与身份职业：简述 NPC 性格、与角色的关系动态。角色怎么看对方？对方怎么看角色？日常如何相处？

五. 语言风格
详细描述其表达习惯。
* 口头禅：列出 1 到 2 句。
* 用词偏好：体现阶层、习惯与性格。
* 情绪极端时的特征：愤怒或悲伤时的语言表现，如语速变化、突然沉默等。`;

  const DEFAULT_DEEP_SYSTEM_PROMPT = `角色综合档案构建大师

核心结构：现实锚点 → 人格运行 → 状态切换 → 关键成因 → 行为证据

【全局字数要求】：输出极其详尽生动，总字数严格贴近3000字左右。

全局铁律
1. 独立性与现实限制：char必须拥有独立的人格、职业工作与真实代价，时间和精力受到现实规则约束。
2. 喜好与厌恶法则：爱好与讨厌的事物绝不能从主要创伤或经历中生硬推导，必须来自日常生活毫无关联的琐碎小细节。
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
* 年龄：
* 生日：
* 性别：
* 性格：
* 说话方式：模板采用 语风加语调加性格特质，如 大白话+中式语气+温和随和。
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
* 原则一：[判断标准 + 行为倾向 + 边界]
* 原则二：[判断标准 + 行为倾向 + 边界]
* 原则三：[判断标准 + 行为倾向 + 边界]
2.2 默认处理路径
* 面对现实问题：char通常先[第一步]，再[第二步]，随后[第三步]
* 紧急情况与事后复盘：
2.3 核心矛盾
* char认为自己是：
* char实际反复做出的选择是：
* char最想得到与最怕失去的：
* char拒绝承认的：
2.4 缺陷机制
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
* 明确列出4到6条针对该角色的防OOC铁律`;

  const DEFAULT_KPC_SYSTEM_PROMPT = `跑团 KPC 与角色构建大师

核心角色与目标
你是一位专业的克苏鲁神话TRPG守密人与角色设计师。你的任务是根据用户的概念描述，构建一位符合CoC第七版规则、充满真实生活痕迹与深度的跑团KPC或NPC角色档案。

【可用CoC 7th标准技能库清单】：
侦查、聆听、心理学、急救、潜行、图书馆使用、话术、恐吓、说服、闪避、撬锁、格斗、射击、医学、神秘学、信用评级、魅惑、攀爬、跳跃、投掷、游泳、追踪、妙手、伪装、汽车驾驶、骑术、机械维修、电气维修、计算机使用、会计、估价、人类学、考古学、历史、法律、自然学、领航、生存、科学、电子学、重型机械、精神分析、克苏鲁神话。
请优先从上述标准技能库中为角色挑选与分配加点；若角色有特殊或派生背景技能（如绘画、修仙、御剑、锻造等），可额外新增列出。

【严格遵循的输出排版与内容指令】

一. 基础信息
* 姓名：
* 年龄：
* 生日：
* 性别：
* 性格：提炼其核心性格与处事风格。
* 说话方式：模板采用 语风加语调加性格特质，例如 大白话+美式语气+沉稳短句 或 古风+中式语调+内敛从容。
* 时代与常驻地：
* 职业与公开身份：
* 外貌体貌：高信息密度的客观白描，约150字，初期严禁出现任何妖异或隐藏反转的剧透描写。
* 随身物品与防身装备：
* 气味与外在气质：
* 爱好：必须是与经历无关的生活琐碎细节。
* 讨厌：必须是与经历无关的日常小反感，如讨厌下雨天、讨厌吃鱼等。

二. 角色扮演防剧透须知
* 隐藏剧透项与隔离规则：明确指出该角色身上哪几项属于后续剧情的隐藏剧透内容（例如隐藏真相、幕后身份、异变特征、性格转变等）。在初期扮演中绝对禁止直接透露或显露蛛丝马迹（例如深夜变妖绝不能在初遇时描写妖瞳兽耳妖血），必须保证严格按照初期表面身份正常扮演，直到跑团剧情自然推进到对应节点方可改变。

三. CoC 第七版核心属性面板
严格遵循CoC 7th规范，数值在15到90之间合理分布：
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

四. 技能加点清单
从标准技能库以及特有技能中挑选并给出加点百分比：
* 侦查：[数值]%
* 聆听：[数值]%
* 心理学：[数值]%
* 闪避：[数值]%
* 图书馆使用：[数值]%
* 潜行：[数值]%
* 话术：[数值]%
* 信用评级：[数值]%
* 急救：[数值]%
* 射击：[数值]%
* 医学：[数值]%
* 神秘学：[数值]%
* 克苏鲁神话：[数值]%
* 其他技能：[列出名称与百分比]

五. 生平叙事与调查经历
* 出身与成长：
* 走向调查员之路的关键转折事件：
* 曾经经历的一次隐秘事件：
* 当前正在追踪的线索或危机：

六. 守秘人秘密档案
* 幕后秘密与隐藏真相：仅守秘人可见的深层底细。`;

  // 模组提取专用超详尽系统提示词
  const KPC_MODULE_EXTRACTOR_SYSTEM_PROMPT = `你是一个极其严谨的克苏鲁TRPG官方模组角色提取器。

【最高执行铁律——零脑补与纯事实提取原则】：
你的任务是通读用户提供的模组原文文档全文，精准定位目标角色的全部信息，用最准确客观的大白话逐一提取出该角色的全部设定。
1. 绝对忠实原文事实：角色的一切姓名、年龄、生日、性别、性格、说话方式、数值属性、技能、外貌、随身道具、经历事件，必须100%来自模组原文记录。
2. 绝对禁止自行推断与臆想：绝对禁止根据人物经历自行推测、脑补或推断该角色是什么性格、应该做什么事；喜好、厌恶、习惯等内容必须是模组正文中清清楚楚明确记载的事实。模组若未明确写明，必须直接写“无”或“模组未提及”，绝对禁止AI自行编造！
3. 说话方式模板：必须严格遵循 语风加语调加性格特质 模板，如 大白话+中式语气+温和随和 或 古风+中式语调+沉稳克制。
4. 防剧透隔离：明确列出该角色身上的隐藏剧透项（如深夜化妖、隐秘身份等），明确标明初期绝对禁止直接透露或露馅，绝不在初遇描写妖瞳兽耳等异样，保证在初期正常扮演。
5. 数值与技能提取：严格提取模组中记载的CoC 7版属性数值与技能；从标准技能库中匹配，并完整列出模组中记载的全部特殊、专属或衍生技能。

【严格输出排版格式】：

一. 基础信息
* 姓名：[模组原文公开姓名]
* 年龄：[模组原文记载，若无写无]
* 生日：[模组原文记载，若无写无]
* 性别：[模组原文记载，若无写无]
* 性格：[模组正文中明确体现的性格事实]
* 说话方式：[模板格式：语风加语调加性格特质]
* 身份职业：[模组原文记载]
* 外貌特征：[客观白描，不带剧透]
* 随身物品：[模组提及的装备与道具]
* 喜好：[模组明确写明的事实，无则写无]
* 讨厌：[模组明确写明的事实，无则写无]

二. 角色扮演防剧透须知
* 隐藏剧透项与隔离规则：[明确指出模组中该角色的隐藏剧透内容，如隐藏身份、妖异本质或幕后反转；初期扮演绝对禁止透露，绝不描写妖瞳兽耳等隐藏异相，直到带团推进至对应剧情节点]

三. CoC 第七版核心属性与技能面板
* 力量 STR：[数值]
* 体质 CON：[数值]
* 体型 SIZ：[数值]
* 敏捷 DEX：[数值]
* 外貌 APP：[数值]
* 智力 INT：[数值]
* 意志 POW：[数值]
* 教育 EDU：[数值]
* 幸运 LUK：[数值]
* 派生数据：生命值 HP [数值] / 魔法值 MP [数值] / 理智值 SAN [数值] / 伤害加值 DB [数值]
* 技能加点清单：
  [逐一列出模组中记载的全部常规与特殊技能及百分比数值，例如：侦查：60%，聆听：50%，心理学：65%，神秘学：40%，特殊技能：50%]

四. 行为特质与客观行事
* 客观行事特质：[大白话列出模组中记载的真实行为表现与处事方式]
* 与调查员或玩家的初始关系：[模组记载的初始立场]
* 语言表达习惯：[模组记载的台词口吻]

五. 生平背景与模组事件
* 角色背景事实：[模组中记载的过往经历事实]
* 在本模组中的行动事实与剧情处境：[模组中该角色的具体任务与行动]

六. 守秘人秘密档案
* 隐藏真相与幕后动机：[模组中该角色的秘密底细，仅守秘人可见]`;

  const DEFAULT_PRESETS_LIST = [
    { id: "standard", name: "标准", content: DEFAULT_STANDARD_SYSTEM_PROMPT, isCustom: false, category: "char" },
    { id: "deep", name: "深度", content: DEFAULT_DEEP_SYSTEM_PROMPT, isCustom: false, category: "char" },
    { id: "kpc", name: "跑团", content: DEFAULT_KPC_SYSTEM_PROMPT, isCustom: false, category: "kpc" },
    { id: "module", name: "模组", content: KPC_MODULE_EXTRACTOR_SYSTEM_PROMPT, isCustom: false, category: "module" }
  ];

  function getStoredPresetsList() {
    try {
      const raw = localStorage.getItem(PRESETS_STORAGE_KEY);
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list) && list.length > 0) {
          return list;
        }
      }
    } catch (e) {}
    return DEFAULT_PRESETS_LIST;
  }

  function saveStoredPresetsList(list) {
    try {
      localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(list));
    } catch (e) {}
  }

  function populatePresetsDropdown() {
    const select = document.getElementById("persona-prompt-preset-select");
    if (!select) return;

    const list = getStoredPresetsList();
    select.innerHTML = "";

    // 根据是否选中模组或模式，优先展示对应预设
    const isModuleMode = (activeMode === "kpc" && !!kpcSelectedModuleId);
    
    list.forEach(p => {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = p.name;
      select.appendChild(opt);
    });

    if (isModuleMode) {
      if (list.some(p => p.id === "module")) {
        activePreset = "module";
      }
    }

    if (list.some(p => p.id === activePreset)) {
      select.value = activePreset;
    } else if (list.length > 0) {
      activePreset = list[0].id;
      select.value = activePreset;
    }
  }

  function getEffectiveSystemPrompt(mode, presetKey) {
    const list = getStoredPresetsList();
    const found = list.find(p => p.id === presetKey);
    let basePrompt = found ? found.content : DEFAULT_STANDARD_SYSTEM_PROMPT;

    if (mode === "kpc" && kpcSelectedModuleId) {
      const modPreset = list.find(p => p.id === "module") || { content: KPC_MODULE_EXTRACTOR_SYSTEM_PROMPT };
      basePrompt = (presetKey === "module") ? modPreset.content : `${modPreset.content}\n\n【所选预设要求】:\n${basePrompt}`;
    }

    return `${GLOBAL_SYSTEM_PROMPT_PREFIX}\n\n${basePrompt}`;
  }

  function saveLocalState() {
    try {
      const inputEl = document.getElementById("persona-creator-input");
      const extraInputEl = document.getElementById("persona-extra-prompt-input");
      const reworkInputEl = document.getElementById("persona-rework-input");
      const nameInput = document.getElementById("persona-edit-name");
      const ageInput = document.getElementById("persona-edit-age");
      const birthdayInput = document.getElementById("persona-edit-birthday");
      const genderInput = document.getElementById("persona-edit-gender");
      const personalityInput = document.getElementById("persona-edit-personality");
      const speechStyleInput = document.getElementById("persona-edit-speech-style");
      const remarkInput = document.getElementById("persona-edit-remark");
      const avatarInput = document.getElementById("persona-edit-avatar-url");
      const presetSelect = document.getElementById("persona-prompt-preset-select");

      const stateData = {
        activeMode,
        activePreset: presetSelect ? presetSelect.value : activePreset,
        kpcSelectedModuleId,
        kpcSelectedModuleName,
        kpcSubMode,
        speechStyleViewMode,
        inputText: inputEl ? inputEl.value : "",
        extraPromptText: extraInputEl ? extraInputEl.value : "",
        reworkInputText: reworkInputEl ? reworkInputEl.value : "",
        versionHistory: versionHistory || [],
        currentVersionIndex,
        currentCardData: currentCardData ? {
          ...currentCardData,
          name: nameInput ? nameInput.value : currentCardData.name,
          age: ageInput ? ageInput.value : currentCardData.age,
          birthday: birthdayInput ? birthdayInput.value : currentCardData.birthday,
          gender: genderInput ? genderInput.value : currentCardData.gender,
          personality: personalityInput ? personalityInput.value : currentCardData.personality,
          speechStyle: speechStyleInput ? speechStyleInput.value : currentCardData.speechStyle,
          remark: remarkInput ? remarkInput.value : currentCardData.remark,
          avatarUrl: avatarInput ? avatarInput.value : currentCardData.avatarUrl
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
      populatePresetsDropdown();

      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (!data) return;

      if (data.activeMode && ["standard", "kpc"].includes(data.activeMode)) {
        activeMode = data.activeMode;
      }
      if (data.activePreset) {
        activePreset = data.activePreset;
      }
      if (data.kpcSelectedModuleId) {
        kpcSelectedModuleId = data.kpcSelectedModuleId;
        kpcSelectedModuleName = data.kpcSelectedModuleName || "";
      }
      if (data.kpcSubMode && ["investigator", "keeper"].includes(data.kpcSubMode)) {
        kpcSubMode = data.kpcSubMode;
      }
      if (data.speechStyleViewMode && ["player", "keeper"].includes(data.speechStyleViewMode)) {
        speechStyleViewMode = data.speechStyleViewMode;
      }

      const presetSelect = document.getElementById("persona-prompt-preset-select");
      if (presetSelect && activePreset) {
        presetSelect.value = activePreset;
      }

      updateModeTabsUI();

      const inputEl = document.getElementById("persona-creator-input");
      if (inputEl && typeof data.inputText === "string") {
        inputEl.value = data.inputText;
      }

      const extraInputEl = document.getElementById("persona-extra-prompt-input");
      if (extraInputEl && typeof data.extraPromptText === "string") {
        extraInputEl.value = data.extraPromptText;
      }

      const reworkInputEl = document.getElementById("persona-rework-input");
      if (reworkInputEl && typeof data.reworkInputText === "string") {
        reworkInputEl.value = data.reworkInputText;
      }

      if (data.versionHistory && Array.isArray(data.versionHistory) && data.versionHistory.length > 0) {
        versionHistory = data.versionHistory;
        currentVersionIndex = typeof data.currentVersionIndex === "number" && data.currentVersionIndex >= 0 && data.currentVersionIndex < versionHistory.length ? data.currentVersionIndex : versionHistory.length - 1;
        currentCardData = versionHistory[currentVersionIndex];
      } else if (data.currentCardData && (data.currentCardData.fullText || data.currentCardData.hiddenPersona)) {
        currentCardData = data.currentCardData;
        versionHistory = [currentCardData];
        currentVersionIndex = 0;
      }

      if (data.reworkHistory && Array.isArray(data.reworkHistory)) {
        reworkHistory = data.reworkHistory;
      }

      if (currentCardData) {
        renderPersonaResult();
      }
    } catch (e) {
      console.warn("加载人设草稿失败", e);
    }
  }

  function updateModeTabsUI() {
    const charTabBtn = document.getElementById("persona-mode-char-btn");
    const kpcTabBtn = document.getElementById("persona-mode-kpc-btn");
    const placeholder = document.getElementById("persona-creator-input");
    const kpcModuleSection = document.getElementById("persona-kpc-module-section");

    if (charTabBtn) charTabBtn.classList.toggle("active", activeMode === "standard");
    if (kpcTabBtn) kpcTabBtn.classList.toggle("active", activeMode === "kpc");

    if (activeMode === "standard") {
      if (placeholder) placeholder.placeholder = "输入简短设定，例如28岁刑警，外冷内热，私下爱做甜品";
      if (kpcModuleSection) kpcModuleSection.style.display = "none";
    } else if (activeMode === "kpc") {
      if (placeholder) placeholder.placeholder = kpcSelectedModuleId ? "输入提取指令，例如提取模组中的关键NPC，严格依据模组原文生成" : "输入跑团设定，例如1920年代密大教授，神秘学者，曾经历印斯茅斯事件";
      if (kpcModuleSection) kpcModuleSection.style.display = "flex";
      updateKpcModuleUI();
    }
  }

  function updateKpcModuleUI() {
    const nameEl = document.getElementById("persona-selected-module-name");
    const clearBtn = document.getElementById("persona-clear-module-btn");
    const invBtn = document.getElementById("persona-kpc-submode-investigator");
    const keeperBtn = document.getElementById("persona-kpc-submode-keeper");

    if (nameEl) {
      nameEl.textContent = kpcSelectedModuleName ? `已选模组：${kpcSelectedModuleName}` : "未选择模组";
      nameEl.style.color = kpcSelectedModuleName ? "var(--text-primary)" : "var(--text-secondary)";
    }
    if (clearBtn) {
      clearBtn.style.display = kpcSelectedModuleId ? "inline-block" : "none";
    }
    if (invBtn && keeperBtn) {
      invBtn.classList.toggle("active", kpcSubMode === "investigator");
      keeperBtn.classList.toggle("active", kpcSubMode === "keeper");
    }

    populatePresetsDropdown();
  }

  let editingPresetId = null;

  function openPresetModal(isNew = false) {
    const modal = document.getElementById("persona-prompt-preset-modal");
    const select = document.getElementById("persona-prompt-preset-select");
    const nameInput = document.getElementById("persona-preset-name-input");
    const textarea = document.getElementById("persona-preset-content-textarea");
    const deleteBtn = document.getElementById("persona-preset-delete-btn");
    const resetBtn = document.getElementById("persona-preset-reset-btn");
    if (!modal || !textarea) return;

    const list = getStoredPresetsList();
    if (isNew) {
      editingPresetId = null;
      if (nameInput) nameInput.value = "";
      textarea.value = "";
      if (deleteBtn) deleteBtn.style.display = "none";
      if (resetBtn) resetBtn.style.display = "none";
    } else {
      const curKey = select ? select.value : activePreset;
      const found = list.find(p => p.id === curKey) || list[0];
      editingPresetId = found ? found.id : null;
      if (nameInput) nameInput.value = found ? found.name : "预设";
      textarea.value = found ? found.content : "";
      if (deleteBtn) {
        deleteBtn.style.display = (found && found.isCustom) ? "inline-flex" : "none";
      }
      if (resetBtn) resetBtn.style.display = "inline-flex";
    }

    modal.classList.add("visible");
  }

  function resetPresetModal() {
    const textarea = document.getElementById("persona-preset-content-textarea");
    if (!textarea) return;
    const select = document.getElementById("persona-prompt-preset-select");
    const curKey = select ? select.value : activePreset;

    if (curKey === "deep") {
      textarea.value = DEFAULT_DEEP_SYSTEM_PROMPT;
    } else if (curKey === "kpc") {
      textarea.value = DEFAULT_KPC_SYSTEM_PROMPT;
    } else if (curKey === "module") {
      textarea.value = KPC_MODULE_EXTRACTOR_SYSTEM_PROMPT;
    } else {
      textarea.value = DEFAULT_STANDARD_SYSTEM_PROMPT;
    }
  }

  async function savePresetModal() {
    const modal = document.getElementById("persona-prompt-preset-modal");
    const nameInput = document.getElementById("persona-preset-name-input");
    const textarea = document.getElementById("persona-preset-content-textarea");
    if (!modal || !textarea) return;

    const name = nameInput ? nameInput.value.trim() : "";
    const content = textarea.value.trim();

    if (!name) {
      await showCustomAlert("提示", "请输入预设名称");
      return;
    }
    if (!content) {
      await showCustomAlert("提示", "预设内容不能为空");
      return;
    }

    const list = getStoredPresetsList();
    if (editingPresetId) {
      const item = list.find(p => p.id === editingPresetId);
      if (item) {
        item.name = name;
        item.content = content;
      }
    } else {
      const newId = `preset_${Date.now()}`;
      list.push({
        id: newId,
        name: name,
        content: content,
        isCustom: true
      });
      activePreset = newId;
    }

    saveStoredPresetsList(list);
    populatePresetsDropdown();
    modal.classList.remove("visible");

    if (typeof showCustomAlert === "function") {
      await showCustomAlert("成功", "提示词预设已保存");
    }
  }

  async function deletePresetModal() {
    if (!editingPresetId) return;
    const confirmed = await showCustomConfirm("删除", "确定删除该预设吗？");
    if (!confirmed) return;

    let list = getStoredPresetsList();
    list = list.filter(p => p.id !== editingPresetId);
    if (list.length === 0) list = DEFAULT_PRESETS_LIST;
    activePreset = list[0].id;
    saveStoredPresetsList(list);
    populatePresetsDropdown();

    const modal = document.getElementById("persona-prompt-preset-modal");
    if (modal) modal.classList.remove("visible");

    if (typeof showCustomAlert === "function") {
      await showCustomAlert("成功", "预设已删除");
    }
  }

  async function openModuleSelectModal() {
    const modal = document.getElementById("persona-module-select-modal");
    const listEl = document.getElementById("persona-module-select-list");
    if (!modal || !listEl) return;

    listEl.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 20px;">正在加载模组列表...</div>';
    modal.classList.add("visible");

    try {
      const dbInstance = typeof db !== "undefined" ? db : (window.database || null);
      if (!dbInstance || !dbInstance.modules) {
        listEl.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 20px;">暂无已导入的模组</div>';
        return;
      }
      const modules = await dbInstance.modules.toArray();
      if (!modules || modules.length === 0) {
        listEl.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 20px;">暂无已导入的模组，请先在模组管理中导入。</div>';
        return;
      }

      listEl.innerHTML = "";
      modules.forEach((mod) => {
        const item = document.createElement("div");
        item.style.cssText = "background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 8px; padding: 10px 12px; display: flex; align-items: center; justify-content: space-between; gap: 8px; cursor: pointer;";
        item.innerHTML = `
          <div style="min-width: 0; flex: 1;">
            <div style="font-size: 13px; font-weight: 600; color: var(--text-primary); text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${mod.name || "未命名模组"}</div>
            <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">${mod.author ? `作者: ${mod.author}` : "模组文档"}</div>
          </div>
          <button type="button" class="moe-btn-mini select-this-mod-btn" style="height: 24px; padding: 0 10px; font-size: 11px; flex-shrink: 0;">选择</button>
        `;

        const selectAction = () => {
          kpcSelectedModuleId = mod.id;
          kpcSelectedModuleName = mod.name || "模组";
          updateKpcModuleUI();
          modal.classList.remove("visible");
          saveLocalState();
          if (typeof showCustomAlert === "function") {
            showCustomAlert("模组已选择", `已载入来源模组《${kpcSelectedModuleName}》`);
          }
        };

        item.addEventListener("click", selectAction);
        listEl.appendChild(item);
      });
    } catch (e) {
      console.error("加载模组列表失败:", e);
      listEl.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 20px;">加载模组失败</div>';
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
    let age = "";
    let birthday = "";
    let gender = "";
    let personality = "";
    let speechStyle = "";
    let remark = "";
    let avatarUrl = typeof getRandomItem === "function" ? getRandomItem(DEFAULT_AVATARS) : DEFAULT_AVATARS[0];
    let cocStats = null;
    let cocSkills = null;

    let cleanedText = String(text || "").trim();

    // 彻底剔除末尾多余的核心AI提示词/System Reminder
    cleanedText = cleanedText.replace(/(?:(?:六|九|五)[.\s、]|核心\s*AI\s*提示词|跑团\s*AI\s*专属系统提示词|核心\s*AI\s*系统提示词|\[?System\s*Reminder[\s\S]*)/i, "").trim();

    const nameMatch = cleanedText.match(/(?:姓名|名称|Name)[：:\s*]*([^\n*#]+)/i);
    if (nameMatch) {
      name = nameMatch[1].trim().replace(/[《》【】"'（）()]/g, "");
    }
    if (!name) {
      name = activeMode === "kpc" ? "调查员" : "新角色";
    }

    const ageMatch = cleanedText.match(/(?:年龄|Age)[：:\s*]*([^\n*#]+)/i);
    if (ageMatch) {
      const rawAge = ageMatch[1].trim().replace(/岁.*$/, "");
      const numMatch = rawAge.match(/\d+/);
      if (numMatch) age = numMatch[0];
    }

    const birthdayMatch = cleanedText.match(/(?:生日|Birthday)[：:\s*]*([^\n*#]+)/i);
    if (birthdayMatch) {
      birthday = birthdayMatch[1].trim().replace(/[《》【】"']/g, "");
      if (birthday === "无" || birthday === "未知") birthday = "";
    }

    const genderMatch = cleanedText.match(/(?:性别|Gender)[：:\s*]*([^\n*#]+)/i);
    if (genderMatch) {
      const rawGender = genderMatch[1].trim();
      if (rawGender.includes("男")) gender = "男";
      else if (rawGender.includes("女")) gender = "女";
      else gender = rawGender.replace(/[《》【】"']/g, "").slice(0, 4);
    }

    const personalityMatch = cleanedText.match(/(?:性格|Personality)[：:\s*]*([^\n*#]+)/i);
    if (personalityMatch) {
      personality = personalityMatch[1].trim().replace(/[《》【】"']/g, "");
    }

    const speechMatch = cleanedText.match(/(?:说话方式|语言风格|表达习惯|Speech)[：:\s*]*([^\n*#]+)/i);
    if (speechMatch) {
      speechStyle = speechMatch[1].trim().replace(/[《》【】"']/g, "");
    }

    if (activeMode === "kpc" || cleanedText.includes("STR") || cleanedText.includes("力量")) {
      const getStat = (reg, defVal = 50) => {
        const m = cleanedText.match(reg);
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
      while ((sMatch = skillPattern.exec(cleanedText)) !== null) {
        const sName = sMatch[1].trim();
        const sVal = parseInt(sMatch[2], 10);
        if (sName && !isNaN(sVal) && sVal >= 1 && sVal <= 100) {
          cocSkills[sName] = sVal;
        }
      }
    }

    const isLocked = activeMode === "kpc" && kpcSubMode === "investigator";

    return {
      name,
      age,
      birthday,
      gender,
      personality,
      speechStyle,
      remark,
      fullText: cleanedText,
      hiddenPersona: cleanedText,
      isInvestigatorLocked: isLocked,
      speechStyleViewMode: "player",
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
    const ageInput = document.getElementById("persona-edit-age");
    const birthdayInput = document.getElementById("persona-edit-birthday");
    const genderInput = document.getElementById("persona-edit-gender");
    const personalityInput = document.getElementById("persona-edit-personality");
    const speechStyleInput = document.getElementById("persona-edit-speech-style");
    const remarkInput = document.getElementById("persona-edit-remark");
    const avatarImg = document.getElementById("persona-edit-avatar");
    const avatarInput = document.getElementById("persona-edit-avatar-url");

    if (nameInput) nameInput.value = currentCardData.name || "";
    if (ageInput) ageInput.value = currentCardData.age || "";
    if (birthdayInput) birthdayInput.value = currentCardData.birthday || "";
    if (genderInput) genderInput.value = currentCardData.gender || "";
    if (personalityInput) personalityInput.value = currentCardData.personality || "";
    if (speechStyleInput) speechStyleInput.value = currentCardData.speechStyle || "";
    if (remarkInput) remarkInput.value = currentCardData.remark || "";
    if (avatarImg) avatarImg.src = currentCardData.avatarUrl || DEFAULT_AVATARS[0];
    if (avatarInput) avatarInput.value = currentCardData.avatarUrl || "";

    const contentDisplay = document.getElementById("persona-card-content-display");
    const contentEditor = document.getElementById("persona-card-content-editor");
    const toggleEditBtn = document.getElementById("persona-toggle-edit-mode-btn");
    const ageContainer = document.getElementById("persona-age-container");
    const birthdayContainer = document.getElementById("persona-birthday-container");
    const personalityRow = document.getElementById("persona-personality-row");
    const speechStyleRow = document.getElementById("persona-speech-style-row");
    const remarkRow = document.getElementById("persona-remark-row");
    const speechStyleModeBtn = document.getElementById("persona-speech-style-mode-btn");

    if (speechStyleModeBtn) {
      speechStyleModeBtn.textContent = speechStyleViewMode === "keeper" ? "守秘" : "玩家";
    }

    if (currentCardData.isInvestigatorLocked) {
      if (ageContainer) ageContainer.style.display = "none";
      if (birthdayContainer) birthdayContainer.style.display = "none";
      if (personalityRow) personalityRow.style.display = "none";
      if (speechStyleRow) speechStyleRow.style.display = "none";
      if (remarkRow) remarkRow.style.display = "none";

      if (contentDisplay && contentEditor) {
        contentDisplay.style.display = "block";
        contentEditor.style.display = "none";
        if (toggleEditBtn) toggleEditBtn.style.display = "none";
        contentDisplay.innerHTML = `
          <div style="padding: 16px; background: var(--secondary-bg); border-radius: 8px; border: 1px dashed var(--border-color); text-align: center; color: var(--text-secondary); line-height: 1.6;">
            <div style="font-weight: 700; font-size: 14px; color: var(--text-primary); margin-bottom: 6px;">调查员模式·保密档案</div>
            角色公开姓名：<strong style="color: var(--text-primary);">${currentCardData.name}</strong><br>
            性别：<strong style="color: var(--text-primary);">${currentCardData.gender || "保密"}</strong><br>
            已启用模组防剧透协议，其余档案已锁定隐藏。<br>
            添加到通讯录后，可在设置面板切换守秘人模式查看。
          </div>
        `;
      }
    } else {
      if (ageContainer) ageContainer.style.display = "flex";
      if (birthdayContainer) birthdayContainer.style.display = "flex";
      if (personalityRow) personalityRow.style.display = "flex";
      if (speechStyleRow) speechStyleRow.style.display = "flex";
      if (remarkRow) remarkRow.style.display = "flex";

      if (contentDisplay && contentEditor) {
        if (toggleEditBtn) toggleEditBtn.style.display = "inline-flex";
        if (isEditingPersona) {
          contentDisplay.style.display = "none";
          contentEditor.style.display = "block";
          contentEditor.value = currentCardData.fullText || "";
          if (toggleEditBtn) toggleEditBtn.textContent = "预览";
        } else {
          contentDisplay.style.display = "block";
          contentEditor.style.display = "none";
          if (toggleEditBtn) toggleEditBtn.textContent = "编辑";
          if (typeof marked !== "undefined" && typeof DOMPurify !== "undefined") {
            contentDisplay.innerHTML = DOMPurify.sanitize(marked.parse(currentCardData.fullText || ""));
          } else {
            contentDisplay.textContent = currentCardData.fullText || "";
          }
        }
      }
    }

    // 更新版本导航栏
    updateVersionNavUI();

    // 渲染跑团COC属性与技能折叠面板
    renderCocPanelUI();

    saveLocalState();
  }

  function updateVersionNavUI() {
    const prevBtn = document.getElementById("persona-version-prev-btn");
    const nextBtn = document.getElementById("persona-version-next-btn");
    const indicator = document.getElementById("persona-version-indicator");
    const navBar = document.getElementById("persona-version-nav-bar");

    if (!navBar) return;
    if (versionHistory.length <= 1) {
      navBar.style.display = "none";
      return;
    }
    navBar.style.display = "flex";

    if (indicator) {
      indicator.textContent = `${currentVersionIndex + 1}/${versionHistory.length}`;
    }
    if (prevBtn) {
      prevBtn.disabled = currentVersionIndex <= 0;
      prevBtn.style.opacity = currentVersionIndex <= 0 ? "0.4" : "1";
      prevBtn.style.cursor = currentVersionIndex <= 0 ? "not-allowed" : "pointer";
    }
    if (nextBtn) {
      nextBtn.disabled = currentVersionIndex >= versionHistory.length - 1;
      nextBtn.style.opacity = currentVersionIndex >= versionHistory.length - 1 ? "0.4" : "1";
      nextBtn.style.cursor = currentVersionIndex >= versionHistory.length - 1 ? "not-allowed" : "pointer";
    }
  }

  function renderCocPanelUI() {
    const container = document.getElementById("persona-coc-panel-container");
    if (!container) return;

    if (!currentCardData || !currentCardData.cocStats || currentCardData.isInvestigatorLocked) {
      container.style.display = "none";
      container.innerHTML = "";
      return;
    }

    container.style.display = "block";
    const stats = currentCardData.cocStats;
    const skills = currentCardData.cocSkills || {};

    const calculated = typeof calculateCocStats === "function" ? calculateCocStats(stats) : {
      hp: Math.floor(((stats.con || 50) + (stats.siz || 50)) / 10),
      maxHp: Math.floor(((stats.con || 50) + (stats.siz || 50)) / 10),
      mp: Math.floor((stats.pow || 50) / 5),
      maxMp: Math.floor((stats.pow || 50) / 5),
      san: stats.pow || 50,
      maxSan: 99,
      db: "0"
    };

    container.innerHTML = `
      <div class="settings-group-card moe-card" style="margin-top: 4px;">
        <div id="persona-coc-panel-header" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center; user-select: none; padding-bottom: 6px; border-bottom: 1px solid var(--border-color);">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-weight: 700; font-size: 13px; color: var(--text-primary);">属性</span>
          </div>
          <svg id="persona-coc-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--text-secondary); transition: transform 0.2s ease; transform: rotate(0deg); flex-shrink: 0;">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>

        <div id="persona-coc-body" style="display: flex; flex-direction: column; gap: 10px; margin-top: 10px;">
          <div class="coc-stats-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px;">
            <div class="coc-stat-item" style="display: flex; flex-direction: column; align-items: center; background: var(--secondary-bg); padding: 4px; border-radius: 6px; border: 1px solid var(--border-color);"><label style="font-size: 10px; color: var(--text-secondary);">力量</label><input type="number" class="moe-input p-coc-stat" data-stat="str" value="${stats.str || 50}" style="width: 100%; height: 24px; text-align: center; font-size: 12px; font-weight: 600; padding: 0;"></div>
            <div class="coc-stat-item" style="display: flex; flex-direction: column; align-items: center; background: var(--secondary-bg); padding: 4px; border-radius: 6px; border: 1px solid var(--border-color);"><label style="font-size: 10px; color: var(--text-secondary);">敏捷</label><input type="number" class="moe-input p-coc-stat" data-stat="dex" value="${stats.dex || 50}" style="width: 100%; height: 24px; text-align: center; font-size: 12px; font-weight: 600; padding: 0;"></div>
            <div class="coc-stat-item" style="display: flex; flex-direction: column; align-items: center; background: var(--secondary-bg); padding: 4px; border-radius: 6px; border: 1px solid var(--border-color);"><label style="font-size: 10px; color: var(--text-secondary);">体质</label><input type="number" class="moe-input p-coc-stat" data-stat="con" value="${stats.con || 50}" style="width: 100%; height: 24px; text-align: center; font-size: 12px; font-weight: 600; padding: 0;"></div>
            <div class="coc-stat-item" style="display: flex; flex-direction: column; align-items: center; background: var(--secondary-bg); padding: 4px; border-radius: 6px; border: 1px solid var(--border-color);"><label style="font-size: 10px; color: var(--text-secondary);">意志</label><input type="number" class="moe-input p-coc-stat" data-stat="pow" value="${stats.pow || 50}" style="width: 100%; height: 24px; text-align: center; font-size: 12px; font-weight: 600; padding: 0;"></div>
            <div class="coc-stat-item" style="display: flex; flex-direction: column; align-items: center; background: var(--secondary-bg); padding: 4px; border-radius: 6px; border: 1px solid var(--border-color);"><label style="font-size: 10px; color: var(--text-secondary);">体型</label><input type="number" class="moe-input p-coc-stat" data-stat="siz" value="${stats.siz || 50}" style="width: 100%; height: 24px; text-align: center; font-size: 12px; font-weight: 600; padding: 0;"></div>
            <div class="coc-stat-item" style="display: flex; flex-direction: column; align-items: center; background: var(--secondary-bg); padding: 4px; border-radius: 6px; border: 1px solid var(--border-color);"><label style="font-size: 10px; color: var(--text-secondary);">教育</label><input type="number" class="moe-input p-coc-stat" data-stat="edu" value="${stats.edu || 50}" style="width: 100%; height: 24px; text-align: center; font-size: 12px; font-weight: 600; padding: 0;"></div>
            <div class="coc-stat-item" style="display: flex; flex-direction: column; align-items: center; background: var(--secondary-bg); padding: 4px; border-radius: 6px; border: 1px solid var(--border-color);"><label style="font-size: 10px; color: var(--text-secondary);">外貌</label><input type="number" class="moe-input p-coc-stat" data-stat="app" value="${stats.app || 50}" style="width: 100%; height: 24px; text-align: center; font-size: 12px; font-weight: 600; padding: 0;"></div>
            <div class="coc-stat-item" style="display: flex; flex-direction: column; align-items: center; background: var(--secondary-bg); padding: 4px; border-radius: 6px; border: 1px solid var(--border-color);"><label style="font-size: 10px; color: var(--text-secondary);">智力</label><input type="number" class="moe-input p-coc-stat" data-stat="int" value="${stats.int || 50}" style="width: 100%; height: 24px; text-align: center; font-size: 12px; font-weight: 600; padding: 0;"></div>
            <div class="coc-stat-item" style="display: flex; flex-direction: column; align-items: center; background: var(--secondary-bg); padding: 4px; border-radius: 6px; border: 1px solid var(--border-color);"><label style="font-size: 10px; color: var(--text-secondary);">幸运</label><input type="number" class="moe-input p-coc-stat" data-stat="luk" value="${stats.luk || 50}" style="width: 100%; height: 24px; text-align: center; font-size: 12px; font-weight: 600; padding: 0;"></div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; background: var(--secondary-bg); padding: 8px 6px; border-radius: 6px; text-align: center; border: 1px solid var(--border-color);">
            <div><div style="font-size: 9px; color: var(--text-secondary); font-weight: 600;">HP</div><div style="font-size: 11px; font-weight: 600; color: var(--accent-color);">${calculated.hp}/${calculated.maxHp}</div></div>
            <div><div style="font-size: 9px; color: var(--text-secondary); font-weight: 600;">MP</div><div style="font-size: 11px; font-weight: 600; color: var(--accent-color);">${calculated.mp}/${calculated.maxMp}</div></div>
            <div><div style="font-size: 9px; color: var(--text-secondary); font-weight: 600;">SAN</div><div style="font-size: 11px; font-weight: 600; color: var(--accent-color);">${calculated.san}/${calculated.maxSan}</div></div>
            <div><div style="font-size: 9px; color: var(--text-secondary); font-weight: 600;">DB</div><div style="font-size: 11px; font-weight: 600; color: var(--accent-color);">${calculated.db}</div></div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 2px;">
            <span style="font-size: 12px; font-weight: 600; color: var(--text-primary);">技能</span>
            <div style="display: flex; gap: 6px; align-items: center;">
              <button type="button" id="persona-add-custom-skill-btn" class="moe-btn-mini" style="height: 22px; padding: 0 8px; font-size: 11px; border-radius: 4px; background: var(--secondary-bg); color: var(--text-primary); border: 1px solid var(--border-color); cursor: pointer;">加技</button>
              <button type="button" id="persona-toggle-skills-btn" class="moe-btn-mini" style="height: 22px; padding: 0 8px; font-size: 11px; border-radius: 4px; background: var(--secondary-bg); color: var(--text-secondary); border: 1px solid var(--border-color); cursor: pointer;">展开</button>
            </div>
          </div>

          <div id="persona-skills-grid" style="display: none; grid-template-columns: repeat(2, 1fr); gap: 6px; max-height: 220px; overflow-y: auto; padding: 4px 0;">
            ${Object.entries(skills).map(([k, v]) => `
              <div style="display: flex; justify-content: space-between; align-items: center; background: var(--secondary-bg); padding: 4px 8px; border-radius: 6px; border: 1px solid var(--border-color);">
                <span style="font-size: 11px; color: var(--text-primary); text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${k}</span>
                <input type="number" class="moe-input p-coc-skill" data-skill="${k}" value="${v}" style="width: 44px; height: 20px; text-align: center; font-size: 11px; font-weight: 600; padding: 0; border-radius: 4px;">
              </div>
            `).join("")}
          </div>
        </div>
      </div>
    `;

    const header = document.getElementById("persona-coc-panel-header");
    const body = document.getElementById("persona-coc-body");
    const arrow = document.getElementById("persona-coc-arrow");
    if (header && body) {
      header.onclick = () => {
        const isHidden = body.style.display === "none";
        body.style.display = isHidden ? "flex" : "none";
        if (arrow) arrow.style.transform = isHidden ? "rotate(0deg)" : "rotate(-90deg)";
      };
    }

    const toggleSkillsBtn = document.getElementById("persona-toggle-skills-btn");
    const skillsGrid = document.getElementById("persona-skills-grid");
    if (toggleSkillsBtn && skillsGrid) {
      toggleSkillsBtn.onclick = () => {
        const isHidden = skillsGrid.style.display === "none";
        skillsGrid.style.display = isHidden ? "grid" : "none";
        toggleSkillsBtn.textContent = isHidden ? "折叠" : "展开";
      };
    }

    const addSkillBtn = document.getElementById("persona-add-custom-skill-btn");
    if (addSkillBtn) {
      addSkillBtn.onclick = async () => {
        const sName = typeof showCustomPrompt === "function"
          ? await showCustomPrompt("添加技能", "输入技能名称，如绘画、修仙、御剑")
          : prompt("输入技能名称");
        if (sName && sName.trim()) {
          const cleanSName = sName.trim();
          skills[cleanSName] = 50;
          saveLocalState();
          renderCocPanelUI();
          const grid = document.getElementById("persona-skills-grid");
          if (grid) grid.style.display = "grid";
          if (toggleSkillsBtn) toggleSkillsBtn.textContent = "折叠";
        }
      };
    }

    container.querySelectorAll(".p-coc-stat").forEach(inp => {
      inp.oninput = () => {
        const sKey = inp.getAttribute("data-stat");
        const val = parseInt(inp.value, 10);
        if (sKey && !isNaN(val)) {
          stats[sKey] = val;
          saveLocalState();
        }
      };
    });

    container.querySelectorAll(".p-coc-skill").forEach(inp => {
      inp.oninput = () => {
        const sKey = inp.getAttribute("data-skill");
        const val = parseInt(inp.value, 10);
        if (sKey && !isNaN(val)) {
          skills[sKey] = val;
          saveLocalState();
        }
      };
    });
  }

  async function handleGeneratePersona(isRework = false) {
    if (isGenerating) return;
    const inputEl = document.getElementById("persona-creator-input");
    const extraInputEl = document.getElementById("persona-extra-prompt-input");
    const reworkInputEl = document.getElementById("persona-rework-input");
    const presetSelect = document.getElementById("persona-prompt-preset-select");
    const curPresetKey = presetSelect ? presetSelect.value : activePreset;

    const promptText = (isRework ? reworkInputEl?.value : inputEl?.value) || "";
    const extraPrompt = extraInputEl ? extraInputEl.value.trim() : "";

    if (!isRework && !promptText.trim() && !kpcSelectedModuleId) {
      await showCustomAlert("提示", "请先输入角色的核心设定或选择来源模组");
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
      let systemPrompt = getEffectiveSystemPrompt(activeMode, curPresetKey);
      let userPrompt = `用户提供的角色设定简要输入：\n${promptText}`;
      if (extraPrompt) {
        userPrompt += `\n\n【附加生成要求】：\n${extraPrompt}`;
      }
      userPrompt += `\n\n请按照上述完整格式规范，输出详尽完整的角色卡。`;

      if (activeMode === "kpc" && kpcSelectedModuleId) {
        const dbInstance = typeof db !== "undefined" ? db : (window.database || null);
        let moduleChaptersText = "";
        if (dbInstance && dbInstance.moduleChapters) {
          const chaps = await dbInstance.moduleChapters.where("moduleId").equals(kpcSelectedModuleId).toArray();
          moduleChaptersText = chaps.map(c => `【章节: ${c.title || ""}】\n${c.content || ""}`).join("\n\n");
        }
        const modeTag = kpcSubMode === "investigator" ? "调查员模式 防剧透与隐藏身份" : "守秘人模式 包含幕后真相与秘密";
        userPrompt = `当前选中的来源模组名称：《${kpcSelectedModuleName}》\n当前提取模式：${modeTag}\n\n【模组文档内容如下】：\n${moduleChaptersText || "模组文档暂无章节文字"}\n\n【用户提取要求与角色指令】：\n${promptText || "提取模组中的核心NPC或KPC人设"}`;
        if (extraPrompt) {
          userPrompt += `\n\n【附加生成要求】：\n${extraPrompt}`;
        }
        userPrompt += `\n\n请严格按照标准格式将模组中的角色信息逐一列出，绝不脑补，输出完整的人设卡。`;
      }

      let messages = [];

      if (!isRework) {
        messages = [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ];
        reworkHistory = [...messages];
      } else {
        const baseSystem = `${systemPrompt}\n\n【针对性局部修改原则】：本次为定向修改任务。用户给出了具体的修改意见，请你针对用户的修改意见对角色卡进行精准修改与优化，同时必须完整保留已有合理的其他设定、故事与排版，输出修改后的完整角色卡。`;
        messages = [
          { role: "system", content: baseSystem },
          { role: "user", content: `【最初设定指令与要求】：\n${inputEl?.value || ""}\n${extraPrompt ? `【附加要求】：\n${extraPrompt}` : ""}` },
          { role: "assistant", content: currentCardData.fullText },
          { role: "user", content: `请对上述角色卡进行针对性的局部修改与优化，修改意见如下：\n${promptText}\n\n请在保留其他已有合理设定的基础上，输出完整修改后的全新角色卡，严格遵循输出格式。` }
        ];
        reworkHistory = [...messages];
      }

      const generatedText = await callAiForPersona(messages);
      if (!generatedText || !generatedText.trim()) {
        throw new Error("模型未返回有效内容");
      }

      const parsed = parsePersonaText(generatedText);
      currentCardData = parsed;
      versionHistory.push(parsed);
      currentVersionIndex = versionHistory.length - 1;

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
    const ageInput = document.getElementById("persona-edit-age");
    const birthdayInput = document.getElementById("persona-edit-birthday");
    const genderInput = document.getElementById("persona-edit-gender");
    const personalityInput = document.getElementById("persona-edit-personality");
    const speechStyleInput = document.getElementById("persona-edit-speech-style");
    const remarkInput = document.getElementById("persona-edit-remark");
    const avatarInput = document.getElementById("persona-edit-avatar-url");

    const finalName = nameInput?.value.trim() || currentCardData.name || "新角色";
    const finalAge = ageInput?.value.trim() || currentCardData.age || "";
    const finalBirthday = birthdayInput?.value.trim() || currentCardData.birthday || "";
    const finalGender = genderInput?.value.trim() || currentCardData.gender || "";
    const finalPersonality = personalityInput?.value.trim() || currentCardData.personality || "";
    const finalSpeechStyle = speechStyleInput?.value.trim() || currentCardData.speechStyle || "";
    const finalRemark = remarkInput?.value.trim() || currentCardData.remark || "";
    const finalAvatar = avatarInput?.value.trim() || currentCardData.avatarUrl || DEFAULT_AVATARS[0];
    const isLocked = !!currentCardData.isInvestigatorLocked;
    const finalPersona = currentCardData.hiddenPersona || currentCardData.fullText || "";

    const confirmed = await showCustomConfirm(
      "添加好友",
      `确定要将角色 ${finalName} 添加到通讯录并开启对话吗？`
    );

    if (!confirmed) return;

    try {
      const newChatId = "chat_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4);
      const defaultUserAvatar = state.qzoneSettings?.avatar || "https://i.postimg.cc/PxZrFFFL/o-o-1.jpg";
      const defaultGroupId = typeof ensureDefaultContactGroup === "function" ? await ensureDefaultContactGroup() : 1;

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
      } else {
        aiCocPanelData = typeof getDefaultCocData === "function" ? getDefaultCocData() : { stats: {}, skills: {}, calculated: {} };
      }

      const newChat = {
        id: newChatId,
        name: finalName,
        isGroup: false,
        roleType: "character",
        groupId: defaultGroupId,
        inMessageList: true,
        createdAt: Date.now(),
        history: [],
        unreadCount: 0,
        musicData: { totalTime: 0 },
        npcLibrary: [],
        relationship: {
          status: "friend",
          blockedTimestamp: null,
          applicationReason: ""
        },
        status: { text: "在线", lastUpdate: Date.now(), isBusy: false },
        weiboDms: [],
        loversSpaceData: null,
        settings: {
          remarkName: finalRemark || finalName,
          remark: finalRemark,
          personality: finalPersonality,
          speechStyle: finalSpeechStyle,
          aiPersona: finalPersona,
          systemPrompt: finalPersona,
          age: finalAge,
          birthday: finalBirthday,
          gender: finalGender,
          genderNote: "",
          hiddenPersona: isLocked ? finalPersona : undefined,
          isInvestigatorLocked: isLocked,
          activePersonaViewMode: isLocked ? "investigator" : "keeper",
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
        await renderChatList();
      }
      if (typeof renderContactsScreen === "function") {
        await renderContactsScreen();
      }

      await showCustomAlert("成功", `已将 ${finalName} 添加至通讯录`);
      
      if (typeof switchToChatListView === "function") {
        switchToChatListView("messages-view");
      }

      if (typeof openChat === "function") {
        await openChat(newChatId);
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

    const charTabBtn = document.getElementById("persona-mode-char-btn");
    const kpcTabBtn = document.getElementById("persona-mode-kpc-btn");
    const presetSelect = document.getElementById("persona-prompt-preset-select");
    const newPresetBtn = document.getElementById("persona-new-preset-btn");
    const editPresetBtn = document.getElementById("persona-edit-preset-btn");

    if (charTabBtn) {
      charTabBtn.addEventListener("click", () => {
        activeMode = "standard";
        updateModeTabsUI();
        populatePresetsDropdown();
        saveLocalState();
      });
    }

    if (kpcTabBtn) {
      kpcTabBtn.addEventListener("click", () => {
        activeMode = "kpc";
        updateModeTabsUI();
        populatePresetsDropdown();
        saveLocalState();
      });
    }

    if (presetSelect) {
      presetSelect.addEventListener("change", (e) => {
        activePreset = e.target.value;
        saveLocalState();
      });
    }

    if (newPresetBtn) {
      newPresetBtn.addEventListener("click", () => openPresetModal(true));
    }

    if (editPresetBtn) {
      editPresetBtn.addEventListener("click", () => openPresetModal(false));
    }

    const presetResetBtn = document.getElementById("persona-preset-reset-btn");
    if (presetResetBtn) {
      presetResetBtn.addEventListener("click", resetPresetModal);
    }

    const presetCancelBtn = document.getElementById("persona-preset-cancel-btn");
    if (presetCancelBtn) {
      presetCancelBtn.addEventListener("click", () => {
        const modal = document.getElementById("persona-prompt-preset-modal");
        if (modal) modal.classList.remove("visible");
      });
    }

    const presetSaveBtn = document.getElementById("persona-preset-save-btn");
    if (presetSaveBtn) {
      presetSaveBtn.addEventListener("click", savePresetModal);
    }

    const presetDeleteBtn = document.getElementById("persona-preset-delete-btn");
    if (presetDeleteBtn) {
      presetDeleteBtn.addEventListener("click", deletePresetModal);
    }

    const speechStyleModeBtn = document.getElementById("persona-speech-style-mode-btn");
    if (speechStyleModeBtn) {
      speechStyleModeBtn.addEventListener("click", () => {
        speechStyleViewMode = speechStyleViewMode === "player" ? "keeper" : "player";
        speechStyleModeBtn.textContent = speechStyleViewMode === "keeper" ? "守秘" : "玩家";
        saveLocalState();
      });
    }

    const selectModBtn = document.getElementById("persona-select-module-btn");
    if (selectModBtn) {
      selectModBtn.addEventListener("click", openModuleSelectModal);
    }

    const cancelModSelectBtn = document.getElementById("persona-module-select-cancel-btn");
    if (cancelModSelectBtn) {
      cancelModSelectBtn.addEventListener("click", () => {
        const modal = document.getElementById("persona-module-select-modal");
        if (modal) modal.classList.remove("visible");
      });
    }

    const clearModBtn = document.getElementById("persona-clear-module-btn");
    if (clearModBtn) {
      clearModBtn.addEventListener("click", () => {
        kpcSelectedModuleId = null;
        kpcSelectedModuleName = "";
        updateKpcModuleUI();
        saveLocalState();
      });
    }

    const invSubBtn = document.getElementById("persona-kpc-submode-investigator");
    const keeperSubBtn = document.getElementById("persona-kpc-submode-keeper");
    if (invSubBtn) {
      invSubBtn.addEventListener("click", () => {
        kpcSubMode = "investigator";
        updateKpcModuleUI();
        saveLocalState();
      });
    }
    if (keeperSubBtn) {
      keeperSubBtn.addEventListener("click", () => {
        kpcSubMode = "keeper";
        updateKpcModuleUI();
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

    const extraInputEl = document.getElementById("persona-extra-prompt-input");
    if (extraInputEl) {
      extraInputEl.addEventListener("input", saveLocalState);
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
        const extraInput = document.getElementById("persona-extra-prompt-input");
        const reworkInput = document.getElementById("persona-rework-input");
        const resultBox = document.getElementById("persona-creator-result");
        const emptyBox = document.getElementById("persona-creator-empty");
        const actionsBox = document.getElementById("persona-creator-actions");

        if (input) input.value = "";
        if (extraInput) extraInput.value = "";
        if (reworkInput) reworkInput.value = "";
        if (resultBox) resultBox.style.display = "none";
        if (emptyBox) emptyBox.style.display = "block";
        if (actionsBox) actionsBox.style.display = "none";

        currentCardData = null;
        versionHistory = [];
        currentVersionIndex = -1;
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

    // 版本切换导航
    const prevVersionBtn = document.getElementById("persona-version-prev-btn");
    if (prevVersionBtn) {
      prevVersionBtn.addEventListener("click", () => {
        if (currentVersionIndex > 0) {
          currentVersionIndex--;
          currentCardData = versionHistory[currentVersionIndex];
          renderPersonaResult();
        }
      });
    }

    const nextVersionBtn = document.getElementById("persona-version-next-btn");
    if (nextVersionBtn) {
      nextVersionBtn.addEventListener("click", () => {
        if (currentVersionIndex < versionHistory.length - 1) {
          currentVersionIndex++;
          currentCardData = versionHistory[currentVersionIndex];
          renderPersonaResult();
        }
      });
    }

    // 编辑与预览切换
    const toggleEditBtn = document.getElementById("persona-toggle-edit-mode-btn");
    const contentEditor = document.getElementById("persona-card-content-editor");
    if (toggleEditBtn && contentEditor) {
      toggleEditBtn.addEventListener("click", () => {
        isEditingPersona = !isEditingPersona;
        if (!isEditingPersona && currentCardData) {
          currentCardData.fullText = contentEditor.value;
          currentCardData.hiddenPersona = contentEditor.value;
          if (versionHistory[currentVersionIndex]) {
            versionHistory[currentVersionIndex].fullText = contentEditor.value;
            versionHistory[currentVersionIndex].hiddenPersona = contentEditor.value;
          }
        }
        renderPersonaResult();
      });

      contentEditor.addEventListener("input", () => {
        if (currentCardData) {
          currentCardData.fullText = contentEditor.value;
          currentCardData.hiddenPersona = contentEditor.value;
          if (versionHistory[currentVersionIndex]) {
            versionHistory[currentVersionIndex].fullText = contentEditor.value;
            versionHistory[currentVersionIndex].hiddenPersona = contentEditor.value;
          }
          saveLocalState();
        }
      });
    }

    const avatarInput = document.getElementById("persona-edit-avatar-url");
    const avatarImg = document.getElementById("persona-edit-avatar");
    if (avatarInput && avatarImg) {
      avatarImg.style.cursor = "pointer";
      avatarImg.addEventListener("click", async () => {
        const choice = typeof showChoiceModal === "function"
          ? await showChoiceModal("头像", [
              { text: "本地", value: "local" },
              { text: "换图", value: "random" },
              { text: "链接", value: "url" }
            ])
          : "local";
        if (choice === "local") {
          const b64 = typeof uploadImageLocally === "function" ? await uploadImageLocally() : null;
          if (b64) {
            avatarInput.value = b64;
            avatarImg.src = b64;
            if (currentCardData) currentCardData.avatarUrl = b64;
            if (versionHistory[currentVersionIndex]) versionHistory[currentVersionIndex].avatarUrl = b64;
            saveLocalState();
          }
        } else if (choice === "random") {
          const rnd = typeof getRandomItem === "function" ? getRandomItem(DEFAULT_AVATARS) : DEFAULT_AVATARS[0];
          avatarInput.value = rnd;
          avatarImg.src = rnd;
          if (currentCardData) currentCardData.avatarUrl = rnd;
          if (versionHistory[currentVersionIndex]) versionHistory[currentVersionIndex].avatarUrl = rnd;
          saveLocalState();
        } else if (choice === "url") {
          const url = typeof showCustomPrompt === "function"
            ? await showCustomPrompt("头像", "输入图片链接", avatarInput.value)
            : prompt("输入图片链接", avatarInput.value);
          if (url && url.trim()) {
            avatarInput.value = url.trim();
            avatarImg.src = url.trim();
            if (currentCardData) currentCardData.avatarUrl = url.trim();
            if (versionHistory[currentVersionIndex]) versionHistory[currentVersionIndex].avatarUrl = url.trim();
            saveLocalState();
          }
        }
      });

      avatarInput.addEventListener("input", () => {
        const val = avatarInput.value.trim() || DEFAULT_AVATARS[0];
        avatarImg.src = val;
        if (currentCardData) currentCardData.avatarUrl = val;
        if (versionHistory[currentVersionIndex]) versionHistory[currentVersionIndex].avatarUrl = val;
        saveLocalState();
      });
    }

    const nameInput = document.getElementById("persona-edit-name");
    if (nameInput) {
      nameInput.addEventListener("input", () => {
        if (currentCardData) currentCardData.name = nameInput.value;
        if (versionHistory[currentVersionIndex]) versionHistory[currentVersionIndex].name = nameInput.value;
        saveLocalState();
      });
    }

    const ageInput = document.getElementById("persona-edit-age");
    if (ageInput) {
      ageInput.addEventListener("input", () => {
        if (currentCardData) currentCardData.age = ageInput.value;
        if (versionHistory[currentVersionIndex]) versionHistory[currentVersionIndex].age = ageInput.value;
        saveLocalState();
      });
    }

    const birthdayInput = document.getElementById("persona-edit-birthday");
    if (birthdayInput) {
      birthdayInput.addEventListener("input", () => {
        if (currentCardData) currentCardData.birthday = birthdayInput.value;
        if (versionHistory[currentVersionIndex]) versionHistory[currentVersionIndex].birthday = birthdayInput.value;
        saveLocalState();
      });
    }

    const genderInput = document.getElementById("persona-edit-gender");
    if (genderInput) {
      genderInput.addEventListener("input", () => {
        if (currentCardData) currentCardData.gender = genderInput.value;
        if (versionHistory[currentVersionIndex]) versionHistory[currentVersionIndex].gender = genderInput.value;
        saveLocalState();
      });
    }

    const personalityInput = document.getElementById("persona-edit-personality");
    if (personalityInput) {
      personalityInput.addEventListener("input", () => {
        if (currentCardData) currentCardData.personality = personalityInput.value;
        if (versionHistory[currentVersionIndex]) versionHistory[currentVersionIndex].personality = personalityInput.value;
        saveLocalState();
      });
    }

    const speechStyleInput = document.getElementById("persona-edit-speech-style");
    if (speechStyleInput) {
      speechStyleInput.addEventListener("input", () => {
        if (currentCardData) currentCardData.speechStyle = speechStyleInput.value;
        if (versionHistory[currentVersionIndex]) versionHistory[currentVersionIndex].speechStyle = speechStyleInput.value;
        saveLocalState();
      });
    }

    const remarkInput = document.getElementById("persona-edit-remark");
    if (remarkInput) {
      remarkInput.addEventListener("input", () => {
        if (currentCardData) currentCardData.remark = remarkInput.value;
        if (versionHistory[currentVersionIndex]) versionHistory[currentVersionIndex].remark = remarkInput.value;
        saveLocalState();
      });
    }

    const randomAvatarBtn = document.getElementById("persona-random-avatar-btn");
    if (randomAvatarBtn && avatarInput && avatarImg) {
      randomAvatarBtn.addEventListener("click", () => {
        const rnd = typeof getRandomItem === "function" ? getRandomItem(DEFAULT_AVATARS) : DEFAULT_AVATARS[0];
        avatarInput.value = rnd;
        avatarImg.src = rnd;
        if (currentCardData) currentCardData.avatarUrl = rnd;
        if (versionHistory[currentVersionIndex]) versionHistory[currentVersionIndex].avatarUrl = rnd;
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
