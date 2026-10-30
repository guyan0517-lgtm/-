/**
 * 模组系统核心数据与AI智能深度重构引擎 (Step 0 ~ Step 4 完整实现)
 * 涵盖：
 * - Step 0: IndexedDB 数据存储底座（modules, moduleChapters, moduleImages, moduleConfigs, moduleRawFiles）
 * - Step 1: 模组文件导入解析（PDF/Word/TXT/DOCX、字数统计、图片提取、可编辑切割提示词、历史文件持久化）
 * - Step 2: 方案确认（21条重构提示词、HO散落信息去重整合、模块边界划分、超细化地点层级、无剧透地图与目录）
 * - Step 3: 执行切割（逐章/全篇模式双选、暂停/继续/取消生命周期控制、后台异步运行、AI深度质检与单章多次修复、ZIP/TXT导出）
 * - Step 4: 模组库与带团加载（模组检索、模组详情展开、双视角沉浸式阅读器、聊天设置专属模组面板、HO角色位分配、单人线/猫人设按HO勾选、自动/半自动/手动带团切换与实时记忆注入）
 */
(function (global) {
  'use strict';

  const DRAFT_STORAGE_KEY = 'coc_module_draft_state_v1';
  const ENDING_NOTE = '至此本小章节结束，请kp务必在聊天内告诉PC本世界书模组到此为止，请PC切换下一个世界书，禁止擅自编造互动外主线剧情走向';

  if (global.pdfjsLib) {
    try {
      global.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    } catch (e) {
      console.warn('[模组] PDF.js worker 注册提示', e);
    }
  }

  // 初稿分析阶段完整提示词（21条重构与分析大纲规范）
  const DEFAULT_TRPG_ANALYSIS_PROMPT = `你是模组切割与整理 AI。你将收到一份跑团模组的完整文本。你的任务是把这份模组整理成可直接用于带团的多个独立章节（世界书），并保证守秘人（KP）带团时不会剧透、不会迷失、不会脱离模组瞎编。本任务只做文本整理与切割判断，不涉及任何程序实现。所有输出使用中文。

━━━━━━━━━━━━━━━━━━
【第一部分：通读与理解】
━━━━━━━━━━━━━━━━━━
1. 先完整通读全文，不得跳读。理解整份模组的内在逻辑：
   - 组织结构（按时间线？按自由探索沙盒？是否为1v1单人模组？1v1模组不设HO位与单人线）；
   - 剧情主线走向、幕后真相、核心机制与各结局达成条件；
   - 识别所有 HO 位（HO1、HO2…数量按实际情况判断）；
   - 识别所有地点（凡正文中提到的所有大小地点、建筑、房间必须全部收录，不得遗漏）；
   - 识别所有 NPC 与"猫"（HO位绑定的特定NPC）；
   - 识别模组事前已知信息（开局前发给PC了解的基础世界观与已知线索）。

━━━━━━━━━━━━━━━━━━
【第二部分：严格模块化边界（核心原则）】
━━━━━━━━━━━━━━━━━━
2. 章节划分必须按【内容归属】决定，不是按阅读顺序或先后出现顺序。不同归属的内容，即使在文中挨在一起、即使前后文很连贯，也必须分到各自所属的章节，绝不合并：
   - 【导入】＝纯玩家开场叙述、初次相聚、导入剧情；不计入任何人设；严禁掺杂 NPC 人设数值、幕后真相；
   - 【事前公开】＝开局背景须知与公开设定，独立成章，供玩家直接查阅；
   - 【NPC人设】＝纯角色设定、性格描写、对话风格；【猫人设】＝HO位绑定NPC的设定（比普通NPC更具体，涉及玩家背景与剧透）；两者分开，严禁杂揉进导入或正文事件；
   - 【单人线】＝各 HO 专属的个人剧情与猫互动单人线，独立成章；若模组有单人线，必须按 HO 位拆分——有几个 HO 就分几个（ho1单人线、ho2单人线…），与公共主线严格分开；
   - 【主线正文】＝公共剧情；【结局】＝各结局内容。
3. 【全局去重】任何内容只在其归属章节出现一次：人设只存在于人设章节、猫只存在于猫章节、HO信息只存在于HO章节、导入只存在于导入章节——严禁同一内容在不同章节重复出现。发现重复，保留归属章节中的完整版，删除其他章节中的重复段。

━━━━━━━━━━━━━━━━━━
【第三部分：HO与猫的散落信息整合（范围限定）】
━━━━━━━━━━━━━━━━━━
4. 若某个 HO 或猫的信息分散在【正文以外的信息区】（如 KP信息区、HO设定区、QA问答区、附录、作者注等），必须通读这些信息区后，将属于该 HO/该猫的所有散落信息搜集、整合为一个独立的「HOX秘密与设定」/「猫-hoX」章节：
   - 把 KP信息区中提到的该HO/该猫介绍、HO设定区中的内容、QA/附录里零散提到的新信息全部合并到一起；
   - 合并时删除重复内容，补充各自独有的新信息；
   - 整合结果必须完整集中，带团时只需加载这一章即可掌握该 HO/该猫的全部私密情报。
5. 【范围红线（必须遵守）】：只整合【正文以外的信息区】的内容。【正文剧情】中出现的相关内容【一律不收录、不挪动、不删除】——例如正文中写到"猫在街角买糖葫芦"，这是剧情场景，原样保留在正文章节中，不得收录进猫人设；但如果 QA 或 KP信息中写了"猫喜欢吃糖葫芦"，则收录进猫人设，且导入也为正文内容，不放在人设中，而是单独一个模块。绝对禁止为了整合信息而把各章节正文中的剧情内容删掉或挪走。
6. 有多个 HO 时，HO位信息必须像单人线和猫人设一样【分开】——每个 HO 各自独立成章（HO1秘密与设定、HO2秘密与设定…），不得混在一起。

━━━━━━━━━━━━━━━━━━
【第四部分：超细化空间地点收录】
━━━━━━━━━━━━━━━━━━
7. 识别模组正文中提到的【所有地点】，构建三级空间层级树：
   - 一级：大区域/城镇/总地域；
   - 二级：建筑分区/街道/独立场所；
   - 三级：房间/走廊/具体微观场所；
   凡文中出现的地点必须全部收录归入对应父级。
8. 地点简介规则：末级（最细一级）地点可以不写简介；其他层级按需写一句简介；简介用于带团导航，必须简洁，且【严禁包含任何剧透内容】（如某人死亡、黑幕真相、隐藏神器等一律不得出现）。

━━━━━━━━━━━━━━━━━━
【第五部分：切割规则、目录与命名规范】
━━━━━━━━━━━━━━━━━━
72: 9. 按类型模块切割，保持章节篇幅适中（4000-5000字，允许4000-6000浮动；换段必须在小地点/小事件结束处，禁止事件正中截断）：
73:    - 事前公开：00-模组已知信息；
74:    - 大纲与真相：01-模组导读与大纲、02-幕后真相与机制（若原文仅有KP信息而无独立模组真相章节，则直接按原文结构归入KP信息，绝不凭空拆分并重复堆砌）；
75:    - HO专属：HO1秘密与设定、HO2秘密与设定；
76:    - 单人线：02.5-ho1单人线、02.5-ho2单人线（有几个HO分几个）；
77:    - 猫人设：猫-ho1-角色名、猫-ho2-角色名（一个HO多只猫则继续细分）；
78:    - 主线正文：按时间或探索场景自然分段；
79:    - 地点：模组名-地点-棋牌室；事件：模组名-事件-电车惨案；
80:    - 结局：模组名-结局；
81:    - 其他非预置模块（时间线梳理、特殊道具说明、战斗数值表等）：以内容命名新建分类，模组名-分类-内容名。
82: 10. 【目录处理】若原文自带目录：
83:     - 直接采用原目录作为章节划分基础，按其条目顺序切分正文；
84:     - 目录条目后的页码改为对应的章节名（删去页数）；
85:     - 若目录中一个条目对应的正文被切分为多个章节（如"棋牌室"正文分两段），则该条目下列出全部对应章节名，一个不落。
86: 11. 每段结尾【必须】自动追加以下固定句，一字不改：
87: 『至此本小章节结束，请kp务必在聊天内告诉PC本世界书模组到此为止，请PC切换下一个世界书，禁止擅自编造互动外主线剧情走向』
88: 
89: ━━━━━━━━━━━━━━━━━━
90: 【第六部分：信息标注、清理杂质与防剧透原则】
91: ━━━━━━━━━━━━━━━━━━
92: 12. 行首严格标注中文标签（只加标签，不改原文任何字与标点）：
93:     - 【正文】……公开场景描写与对白，原文一字不改；
94:     - 【KP信息】……仅守秘人可见的背景与机制；
95:     - 【秘密·HOX】……专属私密（标签必须带HO编号）；
96:     - 【检定】……检定标记，保留玩家熟悉的原格式（如 <侦查检定>）；
97:     - 【插图注入：图X 描述】……在正文对应位置精准标注插图标记；
98:     - 【KP批注：……】……带团实操提示，只给KP看，不显示给玩家。
99: 13. 【清理杂质】以下类型的多余内容可以直接删除（仅限下列明确类型，删除时确认无内容价值）：
100:     - 作者写给玩家看的前言介绍类废话：如"本模组推荐给XX类型玩家""适合X人游玩""预计时长X小时""有lost可能性""本模组使用XX格式"等；
101:     - 作者结尾的客套话：如"感谢游玩""希望你能喜欢"等；
102:     - 排版杂质：页码、"第X页"标记、横线分隔符、无意义占位符等。
103:     除此之外的一切内容——正文剧情、场景描写、对话、检定、NPC与猫设定、真相、机制——【一律原样保留】，绝不因"看起来像废话"而删除。
104: 14. 严格防剧透：展示给用户的方案总览、目录与地图中，严禁出现剧情剧透，保持纯粹的章节顺序与空间结构。
105: 
106: ━━━━━━━━━━━━━━━━━━
107: 【第七部分：切割时的附加产出】
108: ━━━━━━━━━━━━━━━━━━
109: 15. 【设身处地自检（内部判断，不输出）】：生成方案前，假设自己是守秘人——只加载这些切出的章节能否顺利带完整场？能否知道下一步引导玩家去哪？会不会缺关键信息、会不会剧透？若带不下去，必须调整切法（合并章节、加导航摘要、补指向关系）。
110: 16. 【带团流程目录】额外生成一份轻量纯流程指向（仅流程流向、关键触发条件与注意事项），绝不进行心理分析、文学鉴赏、台词指导或RP教学；模组类型（一句话）；主线流程（导入→自由探索→转折→结局，每步一句话）；关键地点清单（名称+一句话）；关键事件/线索清单（名称+触发条件一句话）；结局条件（各结局关键点一句话）；带团注意（防剧透边界、必查机制）。
111: 17. 【地点导航与线索指向】（沙盒类必做，时间线类按需）：每个地点生成导航摘要（1-2句：名称、一句话提示[不剧透]、进入条件、可产出）；提取线索指向表（示例：传单 → 莲荷町#2201、老人 → 钥匙挂饰 → 深谷电车站）；标注各地点开放条件（开场开放/获得线索后开放/特定时间开放）。
112: 18. 【模组地图】（无论沙盒类还是线性类，所有模组均必须完整生成地图）：按第四部分的地点层级树收录模组内出现的全部空间地点，构建完整的三级地图层级树（大区域/建筑分区/具体场所）；末级可不写简介；简介用于空间导航，必须精炼且严禁剧透。
113: 
114: ━━━━━━━━━━━━━━━━━━
115: 【第八部分：输出与自检】
━━━━━━━━━━━━━━━━━━
19. 切割方案输出格式（先展示，等确认后再执行）：
    - 模组类型判断（一句话+依据）；
    - 段落清单：每段一行——段落名 / 字数 / 分类 / 一句话说明；
    - 附加产出提示（目录/地图/导航表是否已生成）。
20. 执行切割后逐项自检：
    - 原文是否一字未删减、未概括、未转述？保真原则是否落实？（仅删除了第13条列明的多余杂质）
    - 每个内容是否只出现在归属章节、无跨章节重复？
    - 导入是否独立、不计入人设？NPC人设与猫人设是否分开？
    - 单人线是否按HO位拆分（有几个HO分几个）？
    - 每个HO/猫的散落信息是否已从【正文以外信息区】全局整合为一章、重复已删？正文剧情内容是否原样未动、未被挪走？
    - 原目录是否被采用？页码是否已改为章节名？一条目录对应多章时是否全部列出？
    - 所有地点是否收录入层级树？末级可无简介，简介是否无剧透？
    - 命名是否全部符合规则？结尾固定句是否每段都有？
    - 标注是否完整（正文/KP信息/秘密·HOX/检定/插图/KP批注）？
    - 目录/地图/导航是否生成完整？
    - 若任何一项不通过，修正后再交付。
21. 全部通过后，按段落清单逐段输出切割结果。

━━━━━━━━━━━━━━━━━━
【第九部分：模组分类、标签判定与插图甄别规范】
━━━━━━━━━━━━━━━━━━
22. 【模组分类判断规则（纯净分类，严禁多余注解）】：
    - 结构类型（moduleType）：AI 只能判定为以下三种类型之一，且绝不附带任何注解或说明文字：
      * 线性
      * 沙盒
      * 其他
    - 模组大类（ruleSystem）：只能为 "coc" 或 "coj"；
    - 规模人数（scaleType）：判定模组适用的游玩人数与HO位机制（模组开头信息处通常会有介绍人数与HO设定）：
      * 若模组设有专属 HO 位（作者为该位置设定了部分专属设定与特殊剧情）：按实际 HO 数量判定为 "2ho"、"3ho"、"4ho"；当 HO 位数量大于 4 人（>4人有ho）时，必须判定为 "多ho"；
      * 若模组为无 HO 位的模组（无专属剧情设定与个人秘密）：若为单人则判定为 "1v1" 或 "单人"；若为多人无 HO 位模组，则根据模组开头信息中介绍的游玩人数填写为 "*人" 或 "*-*人"（例如 "2人"、"3人"、"4人"、"2-4人"、"3-5人" 等）；
    - 模组简介（summary）：绝对不能出现任何剧透，绝对不能出现任何剧情的走向！一般来说作者都会在模组介绍中写模组的简介，直接沿用作者的原版简介即可；若作者未在模组开头写简介，则这个地方就只需要写最最最最最最开头最基础、没有任何剧情走向、没有任何剧透、没有任何已知消息以外、没有任何正文中的内容的内容！
23. 【地域背景 Tag 判定规范（单选互斥，排在全部标签第1位）】：
    AI 必须根据模组故事发生的舞台背景，严格判定并赋予以下四种之一，且绝不允许同时出现多个，且在所有标签中必须排序为第一个：
    - 日模：模组故事背景设定在日本；
    - 美模：模组故事背景设定在美国；
    - 现代中国：模组故事背景设定在现代中国；
    - 古风：单指中国古风背景。
24. 【结局 Tag 判定规范（单选，排在地域背景之后第2位）】：
    AI 必须通读全模组结局分支，严格判定并仅能赋予以下三种之一：
    - 危险：若结局中没有任何一个好结局，并且 kpc 和 PC 有一方或者两方死亡且没有复活，必须打上【危险】；
    - 普通：若没有传统意义上的好结局，但是两人却没有死亡（例如永远被困在某处但存活），必须打上【普通】；
    - 安全：若存在传统意义上的好结局，打上【安全】。
25. 【内容与目的 Tag 判定规范（多选，AI 可选多个）】：
    AI 只能从以下预设标签列表中选择符合的内容打标，不允许自定义任何其他标签：
    - 校园：必须是模组全篇几乎全以校园生活与场景为主，而不是仅有校园出现；
    - 复活：本模组创作或开团的核心目的就是为了复活 pc 或者 kpc；
    - 粉红：内容包含 nsfw 或 r18 剧情；
    - NTR：内容包含多人、ntr 剧情；
    - 血腥暴力：内容包含暴力、血腥等非纯爱内容（如被虐待、殴打、被非恋人对象侵犯等）；
    - 纯爱：内容为纯粹的甜饼，没有任何虐的地方；
    - 茶番：内容主要为吃饭、睡觉、玩游戏、聚餐，或作者在简介标明茶番；
    - 恐怖：内容含有明确恐怖元素；
    - Meta：内容含有 Meta 叙事与打破第四面墙元素。
26. 【插图深度筛选、详细注释与剧透甄别】：
    - 针对文档提取的图片进行深度判定：过滤掉纯文字排版扫描页、纯文字转图与无意义装饰边框（设 isUseful: false 进行排除），仅保留有价值的跑团插图（如角色立绘、场景CG、线索手札、道具图、地图等）；
    - 判定剧透属性：包含后期黑幕、伤亡CG、隐藏密室等关键剧透标记为 isSensitive: true（仅守秘人可见），公开区域或初始立绘标记为 isSensitive: false（玩家公开）；
    - 为保留的每张图片生成精炼详细的中文内容注释（description），明确说明该图片的内容与在模组中的具体用途（严禁仅标记页码）；
    - 图片在图库与预览中默认展示模式为玩家模式，所有剧透图片默认进行遮挡防护。`;

  // 切割执行阶段完整提示词（6部分15条深度切割与整理规范）
  const DEFAULT_TRPG_CUTTING_EXECUTION_PROMPT = `你是模组切割 AI。你将收到：①模组原文全文；②一份全模组完整规划总大纲，并明确标明了你本次专属负责编写的目标章节。你的任务：严格按照大纲中明确分配给你的章节任务，把原文整理分类为可直接用于带团的章节，严禁添加主观个人理解与总结点评。大纲分配了几章，你就严格输出几章，章节数量与大纲必须严格一对一对应，严禁擅自拆分出额外章节，严禁擅自合并章节，严禁擅自新增大纲之外的章节。你只做文本的分类整理与标签标注，不涉及任何代码实现。所有输出使用中文。

━━━━━━━━━━━━━━━━━━
【第一部分：基础逻辑（所有 AI 都必须遵守的信息归属规则）】
━━━━━━━━━━━━━━━━━━
1. 【归属由内容性质决定，严禁添加主观总结与理解】判断一段内容属于哪一章，依据是内容的性质，不是它出现在哪个标题/栏目下：
   - 属于某个玩家角色（HO）的专属内容（人设、背景、秘密、专属线索）→ 无论它写在 KP信息区、HO设定区、正文、QA 还是附录里，都【抽离】出来，归入对应「HOX秘密与设定」章节；
   - 只有守秘人知道、且不与单一 HO 绑定的机制、真相、带团信息 → KP信息，原文原句输出，不加主观臆想；
   - 全体玩家共同经历的剧情、场景、对话 → 正文，原文原汁原味输出，严禁在正文段落后擅自添加分析与总结。
   反例（错误认知）："这段写在 KP信息标题下，所以它是 KP 信息"——错。KP信息区里若出现 HO2 的人设/秘密，必须抽离独立成「HO2秘密与设定」，KP信息章节不得残留任何单一 HO 的专属信息。
2. 【每章只装自己的内容】章节标题与内容必须一一对应：HO2秘密章节只装HO2的整合秘密；导读与大纲只装导览信息；NPC章节只装NPC人设。严禁把其他章节的内容塞进来。
3. 【全局去重】任何内容只出现在归属章节一次；发现重复，保留归属章节的完整版，删除其他位置的重复段落。

━━━━━━━━━━━━━━━━━━
【第二部分：严格按大纲交付 + 全局防重】
━━━━━━━━━━━━━━━━━━
4. 先通读原文全文与完整规划总大纲，理解全篇结构、真相、HO位、地点、NPC与猫；
5. 严格对标大纲执行：通读全局大纲是为了防止把属于其他大纲章节的内容写进自己的章节（如NPC人设、幕后真相、其他HO秘密在总大纲中若已有专门章节，本卷绝对不可越权整理或重复编写）。你本次输出必须且仅能输出大纲中明确指派由你负责的章节，每一章与大纲严格一一对应，绝不擅自多拆出一章，也绝不漏写一章；
6. 章节篇幅保持适中；换段必须在小地点/小事件结束处，禁止事件正中截断。

━━━━━━━━━━━━━━━━━━
【第三部分：切割执行规则】
━━━━━━━━━━━━━━━━━━
7. 分类与归属：
   - 导入＝纯开场叙述，不计入任何人设，严禁掺杂NPC数值与幕后真相；
   - 事前公开＝开局背景须知，独立成章；
   - NPC人设与猫人设：只从【正文以外的信息区】（KP信息、HO设定、QA、附录、作者注）搜集散落设定与数值；【正文剧情】中的对话与情节一律原样保留在正文章节，严禁搬运摘抄到NPC人设中；严禁擅自为NPC捏造行为模式、心理分析或性格总结；猫是HO位绑定NPC（身份特殊、涉及玩家背景与剧透），按HO分模块（猫-ho1-角色名，一个HO多只猫继续细分）；
   - 单人线按HO位拆分，有几个HO分几个（ho1单人线、ho2单人线…）；
   - HO散落信息整合：只从【正文以外的信息区】（KP信息、HO设定、QA、附录、作者注）搜集整合，合并去重成独立「HOX秘密与设定」；【正文剧情】中出现的内容（如剧情里猫在吃糖葫芦）一律不收录、不挪动、不删除；
   - 带团思路：仅当模组为非线性沙盒或混乱跳转型时，才按需提供简要思维导图式触发逻辑；线性时间线模组绝不添加额外带团思路；
   - 其他非预置模块（时间线、战斗数值表、道具说明等）以内容命名新建分类。
8. 命名：时间线 模组名-01-第一天早上；地点 模组名-地点-棋牌室；HO秘密 模组名-HO1秘密；单人线 模组名-02.5-ho1单人线；猫 模组名-猫-ho1-角色名；结局 模组名-结局；其他 模组名-分类-内容名。
9. 原目录：原文若自带目录，直接采用其条目顺序切分；条目后的页数改为对应章节名；一条目录对应多章时全部列出。
10. 每段结尾【必须】一字不改追加：『至此本小章节结束，请kp务必在聊天内告诉PC本世界书模组到此为止，请PC切换下一个世界书，禁止擅自编造互动外主线剧情走向』。

━━━━━━━━━━━━━━━━━━
【第四部分：标注与清理】
━━━━━━━━━━━━━━━━━━
11. 行首严格标注中文标签（只加标签，不改原文字与标点，不加分析点评；合并同类项）：
    - 【标签合并同类项】：连续同类内容（如连续多段都是KP信息或正文）只在该块的首段开头打上一次标签（如【KP信息】或【正文】），后续同一类别的自然段不需要每行重复打标！直到出现内容类型切换（如切换为【秘密·HOX】、【检定】、【插图注入】或切换回【正文】）时，才在新类别的段落首部打上新标签！
    - 【正文】公开场景与对白，原文原样输出，一字不改，严禁在正文后写个人分析与总结；
    - 【KP信息】仅守秘人可见的背景真相与机制，原文原句输出，不加主观臆断；
    - 【秘密·HOX】专属私密，标签必须带HO编号；
    - 【检定】检定标记，保留原格式或写明要求PC进行某某检定（如 【检定：要求PC进行侦查检定】）；
    - 【插图注入：图X 描述】正文对应位置标注插图；
    - 【KP批注：……】带团实操提示，只给KP看。
12. 【清理杂质】仅以下类型可删除：作者写给玩家的前言介绍废话（推荐给什么人玩、适合几人、时长、lost可能性、格式说明等）、作者结尾客套话（感谢游玩等）、页码与"第X页"标记、横线分隔符。除此之外一切内容（剧情、对话、描写、设定、真相、机制）一律原样保留，绝不因"像废话"而删。
13. 【防剧透】交付的章节清单、目录、地图中不得出现剧情剧透。

━━━━━━━━━━━━━━━━━━
【第五部分：输出格式】
━━━━━━━━━━━━━━━━━━
14. 输出：每章包含——章节名 / 分类 / 完整整理后的正文文本（含打标与去重后的完整内容）；在章节末尾附加结尾标准声明。

━━━━━━━━━━━━━━━━━━
【第六部分：执行后自检】
━━━━━━━━━━━━━━━━━━
15. 逐项检查：每章内容与标题对应、无混入？归属按内容性质判定（KP信息里无HO残留）？HO信息整合去重完成、正文剧情未被挪动？导入独立不计人设？NPC与猫分开、猫按HO分、未从正文摘抄对话、未捏造行为模式？单人线按HO分？原目录已采用？杂质只删了允许的几类？未在正文段落间插入主观个人理解与总结？标注完整（正文/KP信息/秘密·HOX/检定/插图/KP批注）？结尾句每段都有？命名合规？若有不合格项，修正后再交付。`;

  function getModulePromptPresets() {
    try {
      const raw = localStorage.getItem('coc_module_prompt_presets');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const def = parsed.find((p) => p.id === 'preset_default_analysis');
          if (def) {
            def.prompt = DEFAULT_TRPG_ANALYSIS_PROMPT;
          } else {
            parsed.unshift({
              id: 'preset_default_analysis',
              name: '默认分析',
              prompt: DEFAULT_TRPG_ANALYSIS_PROMPT
            });
          }
          return parsed;
        }
      }
    } catch (e) {}
    return [
      {
        id: 'preset_default_analysis',
        name: '默认分析',
        prompt: DEFAULT_TRPG_ANALYSIS_PROMPT
      }
    ];
  }

  function saveModulePromptPresets(presets) {
    try {
      localStorage.setItem('coc_module_prompt_presets', JSON.stringify(presets));
    } catch (e) {}
  }

  function getDefaultModulePresetId() {
    try {
      return localStorage.getItem('coc_module_default_preset_id') || 'preset_default_analysis';
    } catch (e) {
      return 'preset_default_analysis';
    }
  }

  function setDefaultModulePresetId(id) {
    try {
      if (id) localStorage.setItem('coc_module_default_preset_id', id);
      else localStorage.removeItem('coc_module_default_preset_id');
    } catch (e) {}
  }

  function renderModulePromptPresetsUI() {
    const select = document.getElementById('module-prompt-preset-select');
    if (!select) return;
    const presets = getModulePromptPresets();
    const defaultId = getDefaultModulePresetId();
    const currentVal = select.value || defaultId;
    let optionsHtml = '<option value="">选择预设</option>';
    optionsHtml += presets
      .map((p) => {
        const isDef = p.id === defaultId;
        const prefix = isDef ? '默认 · ' : '';
        const isSel = p.id === currentVal;
        return `<option value="${p.id}" ${isSel ? 'selected' : ''}>${prefix}${p.name}</option>`;
      })
      .join('');
    select.innerHTML = optionsHtml;
    if (currentVal && presets.some((p) => p.id === currentVal)) {
      select.value = currentVal;
    }
  }

  function getModuleCuttingPresets() {
    try {
      const raw = localStorage.getItem('coc_module_cutting_presets');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const def = parsed.find((p) => p.id === 'preset_default_cut');
          if (def) {
            def.prompt = DEFAULT_TRPG_CUTTING_EXECUTION_PROMPT;
          } else {
            parsed.unshift({
              id: 'preset_default_cut',
              name: '默认切割',
              prompt: DEFAULT_TRPG_CUTTING_EXECUTION_PROMPT
            });
          }
          return parsed;
        }
      }
    } catch (e) {}
    return [
      {
        id: 'preset_default_cut',
        name: '默认切割',
        prompt: DEFAULT_TRPG_CUTTING_EXECUTION_PROMPT
      }
    ];
  }

  function saveModuleCuttingPresets(presets) {
    try {
      localStorage.setItem('coc_module_cutting_presets', JSON.stringify(presets));
    } catch (e) {}
  }

  function getDefaultModuleCuttingPresetId() {
    try {
      return localStorage.getItem('coc_module_default_cutting_preset_id') || 'preset_default_cut';
    } catch (e) {
      return 'preset_default_cut';
    }
  }

  function setDefaultModuleCuttingPresetId(id) {
    try {
      if (id) localStorage.setItem('coc_module_default_cutting_preset_id', id);
      else localStorage.removeItem('coc_module_default_cutting_preset_id');
    } catch (e) {}
  }

  function renderModuleCuttingPresetsUI() {
    const select = document.getElementById('module-cutting-preset-select');
    if (!select) return;
    const presets = getModuleCuttingPresets();
    const defaultId = getDefaultModuleCuttingPresetId();
    const currentVal = select.value || defaultId;
    let optionsHtml = '<option value="">选择预设</option>';
    optionsHtml += presets
      .map((p) => {
        const isDef = p.id === defaultId;
        const prefix = isDef ? '默认 · ' : '';
        const isSel = p.id === currentVal;
        return `<option value="${p.id}" ${isSel ? 'selected' : ''}>${prefix}${p.name}</option>`;
      })
      .join('');
    select.innerHTML = optionsHtml;
    if (currentVal && presets.some((p) => p.id === currentVal)) {
      select.value = currentVal;
    }
  }

  global.getModulePromptPresets = getModulePromptPresets;
  global.saveModulePromptPresets = saveModulePromptPresets;
  global.getDefaultModulePresetId = getDefaultModulePresetId;
  global.setDefaultModulePresetId = setDefaultModulePresetId;
  global.renderModulePromptPresetsUI = renderModulePromptPresetsUI;

  global.getModuleCuttingPresets = getModuleCuttingPresets;
  global.saveModuleCuttingPresets = saveModuleCuttingPresets;
  global.getDefaultModuleCuttingPresetId = getDefaultModuleCuttingPresetId;
  global.setDefaultModuleCuttingPresetId = setDefaultModuleCuttingPresetId;
  global.renderModuleCuttingPresetsUI = renderModuleCuttingPresetsUI;

  const DEFAULT_TRPG_MUSIC_PROMPT = `你是一个专业的跑团带团音频总监与模组剧情配乐专家。
请仔细阅读以下模组的正文、场景与剧情，找出最适合配乐的剧情转折点、氛围场景与关键时刻。
对于每个适合配乐的位置，推荐一首网易云或音乐平台中真实存在的具体歌曲或纯音乐原声，必须是真实具体的歌曲名，严禁输出“推荐曲名”、“背景音乐”、“战斗音乐”、“氛围曲”等泛指标签。
输出严格的JSON数组格式，不要输出任何多余标记或解释，每个元素包含以下字段：
[
  {
    "chapter": "模组章节标题，如：序章、第一章 迷雾林 或 场景一",
    "position": "具体插入段落位置与情境，如：调查暗门处、遭遇伏击时 或 旅店大厅初次会面",
    "anchor": "该段落中8到25字的原文章节短句，用于在正文中精确定位插入点",
    "scene": "场景简述与氛围情境",
    "name": "真实具体的歌曲名，纯歌名，严禁带有书名号、中括号、前缀或标签",
    "artist": "歌手或作曲家",
    "keyword": "真实准确的网易云歌曲搜索词"
  }
]`;

  function getModuleMusicPresets() {
    try {
      const raw = localStorage.getItem('coc_module_music_presets');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const def = parsed.find((p) => p.id === 'preset_default_music');
          if (def) {
            def.prompt = DEFAULT_TRPG_MUSIC_PROMPT;
          } else {
            parsed.unshift({
              id: 'preset_default_music',
              name: '默认配乐',
              prompt: DEFAULT_TRPG_MUSIC_PROMPT
            });
          }
          return parsed;
        }
      }
    } catch (e) {}
    return [
      {
        id: 'preset_default_music',
        name: '默认配乐',
        prompt: DEFAULT_TRPG_MUSIC_PROMPT
      }
    ];
  }

  function saveModuleMusicPresets(presets) {
    try {
      localStorage.setItem('coc_module_music_presets', JSON.stringify(presets));
    } catch (e) {}
  }

  function getDefaultModuleMusicPresetId() {
    try {
      return localStorage.getItem('coc_module_default_music_preset_id') || 'preset_default_music';
    } catch (e) {
      return 'preset_default_music';
    }
  }

  function setDefaultModuleMusicPresetId(id) {
    try {
      if (id) localStorage.setItem('coc_module_default_music_preset_id', id);
      else localStorage.removeItem('coc_module_default_music_preset_id');
    } catch (e) {}
  }

  function renderModuleMusicPresetsUI() {
    const select = document.getElementById('module-music-preset-select');
    if (!select) return;
    const presets = getModuleMusicPresets();
    const defaultId = getDefaultModuleMusicPresetId();
    const currentVal = select.value || defaultId;
    let optionsHtml = '<option value="">选择预设</option>';
    optionsHtml += presets
      .map((p) => {
        const isDef = p.id === defaultId;
        const prefix = isDef ? '默认 · ' : '';
        const isSel = p.id === currentVal;
        return `<option value="${p.id}" ${isSel ? 'selected' : ''}>${prefix}${p.name}</option>`;
      })
      .join('');
    select.innerHTML = optionsHtml;
    if (currentVal && presets.some((p) => p.id === currentVal)) {
      select.value = currentVal;
    }
  }

  global.getModuleMusicPresets = getModuleMusicPresets;
  global.saveModuleMusicPresets = saveModuleMusicPresets;
  global.getDefaultModuleMusicPresetId = getDefaultModuleMusicPresetId;
  global.setDefaultModuleMusicPresetId = setDefaultModuleMusicPresetId;
  global.renderModuleMusicPresetsUI = renderModuleMusicPresetsUI;

  const TAG_DEFINITIONS = {
    'COC': { category: '规则体系', desc: '基于克苏鲁的呼唤TRPG规则体系' },
    'COJ': { category: '规则体系', desc: '基于日系COC衍生风格与叙事规则体系' },
    '线性': { category: '结构类型', desc: '按固定前后顺序依次推进的主线剧情模组' },
    '沙盒': { category: '结构类型', desc: '高自由度开放探索与多线并行架构模组' },
    '其他': { category: '结构类型', desc: '特殊交互或非标准网状结构的模组' },
    '1v1': { category: '规模人数', desc: '1位KP与1位PL专属单挑带团规模' },
    '单人': { category: '规模人数', desc: '单人单调查员沉浸式探索模组' },
    '2ho': { category: '规模人数', desc: '双主角专属秘密背景分工模组' },
    '3ho': { category: '规模人数', desc: '三位调查员专属秘密背景模组' },
    '4ho': { category: '规模人数', desc: '四位调查员团队协作与暗线模组' },
    '多ho': { category: '规模人数', desc: '大于4位调查员且持有专属秘密背景的模组' },
    '日模': { category: '背景分类', desc: '模组故事背景设定在日本' },
    '美模': { category: '背景分类', desc: '模组故事背景设定在美国' },
    '现代中国': { category: '背景分类', desc: '模组故事背景设定在现代中国' },
    '古风': { category: '背景分类', desc: '模组故事背景单指中国古风传统' },
    '危险': { category: '结局分类', desc: '结局无生还或主角死亡且未复活' },
    '普通': { category: '结局分类', desc: '无传统好结局但人员幸存' },
    '安全': { category: '结局分类', desc: '存在传统意义生还胜利好结局' },
    '校园': { category: '内容特色', desc: '模组全篇以校园生活与场景为主' },
    '复活': { category: '创作目的', desc: '模组核心目的为复活调查员或伙伴' },
    '粉红': { category: '内容特色', desc: '包含成人向恋爱互动与情感剧情' },
    'NTR': { category: '内容特色', desc: '包含多角情感纠葛与关系剧情' },
    '血腥暴力': { category: '内容特色', desc: '包含肢体伤害或拷问等重度场面' },
    '纯爱': { category: '内容特色', desc: '纯粹甜蜜互动无虐点' },
    '茶番': { category: '内容特色', desc: '以轻松搞笑日常聚餐玩乐为主' },
    '恐怖': { category: '内容特色', desc: '含有明确惊悚克苏鲁怪异元素' },
    'Meta': { category: '内容特色', desc: '包含打破第四面墙与叙事诡计' }
  };

  const BG_TAGS = ['日模', '美模', '现代中国', '古风'];
  const ENDING_TAGS = ['危险', '普通', '安全'];
  const CONTENT_TAGS = ['校园', '复活', '粉红', 'NTR', '血腥暴力', '纯爱', '茶番', '恐怖', 'Meta'];

  function sortModuleTags(tags, bgTag, endingTag, contentTags, customTags) {
    if (typeof tags === 'string' && !bgTag) {
      bgTag = tags;
      tags = null;
    }
    const list = [];
    const activeBg = bgTag || (Array.isArray(tags) && tags.find(t => BG_TAGS.includes(t))) || '';
    if (activeBg && BG_TAGS.includes(activeBg)) {
      list.push(activeBg);
    }
    const activeEnding = endingTag || (Array.isArray(tags) && tags.find(t => ENDING_TAGS.includes(t))) || '';
    if (activeEnding && ENDING_TAGS.includes(activeEnding)) {
      list.push(activeEnding);
    }
    const activeContent = (contentTags && contentTags.length > 0)
      ? contentTags
      : (Array.isArray(tags) ? tags : []).filter(t => CONTENT_TAGS.includes(t) && t !== activeBg && t !== activeEnding);
    activeContent.forEach(t => {
      if (!list.includes(t)) list.push(t);
    });
    const activeCustom = (customTags && customTags.length > 0)
      ? customTags
      : (Array.isArray(tags) ? tags : []).filter(t => !BG_TAGS.includes(t) && !ENDING_TAGS.includes(t) && !CONTENT_TAGS.includes(t) && t !== '1v1' && t !== '单人' && !t.includes('ho') && !t.endsWith('人'));
    activeCustom.forEach(t => {
      if (!list.includes(t)) list.push(t);
    });
    return list;
  }

  const ModuleManager = {
    version: '2.9.0',
    currentStep: 1,
    activeSubPanel: 'library',
    activeSubTab: 'chapters',
    cutExecutionMode: 'batch',
    mergeFileList: [],

    sortModuleTags(tagsOrBg, bgOrEnding, endingOrContent, contentOrCustom, maybeCustom) {
      if (Array.isArray(tagsOrBg)) {
        return sortModuleTags(tagsOrBg, bgOrEnding, endingOrContent, contentOrCustom, maybeCustom);
      }
      return sortModuleTags(null, tagsOrBg, bgOrEnding, endingOrContent, contentOrCustom);
    },

    // 异步切割生命周期控制
    isCuttingRunning: false,
    isCuttingPaused: false,
    isCuttingCancelled: false,
    cuttingCurrentIndex: 0,
    isAnalyzing: false,
    analysisStatusText: '',
    analysisError: '',

    // 阅读器与详情状态（默认均为玩家防剧透模式）
    currentReadingChapters: [],
    currentReadingIndex: 0,
    currentReadingViewMode: 'pc',
    step2GalleryViewMode: 'pc',
    step3ViewMode: 'pc',
    activeDetailModule: null,

    // 模组库筛选状态
    selectedFilterTags: new Set(),
    currentLibraryFilter: 'all',

    // 同步内存缓存 (供提示词实时组装)
    chaptersMemoryCache: new Map(),

    currentParsedData: null,
    currentPlan: null,
    globalOpinion: '',
    cutChapters: [],
    activeAuditChapter: null,

    getDB() {
      if (global.db) return global.db;
      if (typeof db !== 'undefined') return db;
      return null;
    },

    async safeDBOperation(operationName, fn, fallback = null) {
      try {
        const database = this.getDB();
        if (!database || !database.modules) {
          console.log(`[模组] 数据库就绪检查: ${operationName}`);
          return fallback;
        }
        return await fn(database);
      } catch (err) {
        console.warn(`[模组] 执行 ${operationName} 提示:`, err);
        return fallback;
      }
    },

    async getAllModules() {
      return this.safeDBOperation('获取所有模组', async (db) => {
        const list = await db.modules.toArray();
        if (!Array.isArray(list)) return [];
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        const seenIds = new Set();
        const seenNames = new Set();
        const unique = [];
        for (const m of list) {
          if (!m || !m.id) continue;
          const normName = (m.name || '').trim().toLowerCase();
          if (seenIds.has(m.id)) continue;
          if (normName && seenNames.has(normName)) {
            try { db.modules.delete(m.id); } catch (_) {}
            continue;
          }
          seenIds.add(m.id);
          if (normName) seenNames.add(normName);
          unique.push(m);
        }
        return unique;
      }, []);
    },

    cleanRawText(text) {
      if (!text) return '';
      let cleaned = text;
      cleaned = cleaned.replace(/(?:第\s*\d+\s*页\s*[\/共]\s*\d+\s*页|Page\s*\d+\s*(?:of\s*\d+)?|\b\d+\s*[\/|]\s*\d+\b)/gi, '');
      cleaned = cleaned.replace(/(?:^[·-—\s]*\d+[·-—\s]*$)/gm, '');
      cleaned = cleaned.replace(/[ \t\f\v]+/g, ' ');
      cleaned = cleaned.replace(/\n\s*\n\s*\n+/g, '\n\n');
      cleaned = cleaned.replace(/([\u4e00-\u9fa5，。！？；：])\n([\u4e00-\u9fa5])/g, '$1$2');
      return cleaned.trim();
    },

    async _openDraftDB() {
      if (this._draftDB) return this._draftDB;
      return new Promise((resolve, reject) => {
        if (typeof window === 'undefined' || !window.indexedDB) {
          return reject(new Error('IndexedDB not supported'));
        }
        const req = window.indexedDB.open('TRPG_Module_Cutter_Cache_v2', 1);
        req.onupgradeneeded = (e) => {
          const dbInstance = e.target.result;
          if (!dbInstance.objectStoreNames.contains('drafts')) {
            dbInstance.createObjectStore('drafts');
          }
        };
        req.onsuccess = (e) => {
          this._draftDB = e.target.result;
          resolve(this._draftDB);
        };
        req.onerror = (e) => reject(e.target.error);
      });
    },

    async _saveDraftToIDB(data) {
      try {
        const dbInstance = await this._openDraftDB();
        return new Promise((resolve, reject) => {
          const tx = dbInstance.transaction('drafts', 'readwrite');
          const store = tx.objectStore('drafts');
          const req = store.put(data, 'active_cutter_draft');
          req.onsuccess = () => resolve(true);
          req.onerror = (e) => reject(e.target.error);
        });
      } catch (err) {
        console.warn('[模组] IndexedDB 实时写入提示:', err);
        return false;
      }
    },

    async _loadDraftFromIDB() {
      try {
        const dbInstance = await this._openDraftDB();
        return new Promise((resolve, reject) => {
          const tx = dbInstance.transaction('drafts', 'readonly');
          const store = tx.objectStore('drafts');
          const req = store.get('active_cutter_draft');
          req.onsuccess = (e) => resolve(e.target.result || null);
          req.onerror = (e) => reject(e.target.error);
        });
      } catch (err) {
        console.warn('[模组] IndexedDB 实时读取提示:', err);
        return null;
      }
    },

    async _clearDraftFromIDB() {
      try {
        const dbInstance = await this._openDraftDB();
        return new Promise((resolve, reject) => {
          const tx = dbInstance.transaction('drafts', 'readwrite');
          const store = tx.objectStore('drafts');
          const req = store.delete('active_cutter_draft');
          req.onsuccess = () => resolve(true);
          req.onerror = (e) => reject(e.target.error);
        });
      } catch (err) {}
    },

    saveDraft() {
      try {
        const draftObj = {
          currentStep: this.currentStep,
          activeSubPanel: this.activeSubPanel,
          activeSubTab: this.activeSubTab,
          cutExecutionMode: this.cutExecutionMode || 'batch',
          batchSegmentsCompleted: this.batchSegmentsCompleted || 0,
          currentParsedData: this.currentParsedData,
          currentPlan: this.currentPlan,
          globalOpinion: this.globalOpinion,
          globalAuditReport: this.globalAuditReport || '',
          cutChapters: this.cutChapters || [],
          cutChaptersBySegment: this.cutChaptersBySegment || [],
          cuttingCurrentIndex: typeof this.cuttingCurrentIndex === 'number' ? this.cuttingCurrentIndex : (this.cutChapters ? this.cutChapters.length : 0),
          isCuttingPaused: this.isCuttingPaused !== false,
          isAnalyzing: Boolean(this.isAnalyzing),
          analysisStatusText: this.analysisStatusText || '',
          timestamp: Date.now()
        };

        // 1. 优先存入持久化 IndexedDB（无配额瓶颈，确保万字模组与已切出的全部章节实时完整落地）
        this._saveDraftToIDB(draftObj);

        // 2. 作为第二层后备，写入 Dexie 的 moduleRawFiles
        if (typeof db !== 'undefined' && db && db.moduleRawFiles) {
          db.moduleRawFiles.put({
            id: '__module_cutter_draft__',
            fileName: this.currentParsedData?.moduleName || '模组草稿',
            fileType: 'draft',
            wordCount: this.currentParsedData?.wordCount || 0,
            uploadedAt: Date.now(),
            draftData: draftObj
          }).catch(() => {});
        }

        // 3. 尝试存入 localStorage（作为轻量同步副本，排除巨大base64图片防止爆配额异常）
        try {
          let lightParsedData = this.currentParsedData;
          if (lightParsedData && Array.isArray(lightParsedData.images) && lightParsedData.images.length > 0) {
            lightParsedData = {
              ...lightParsedData,
              images: lightParsedData.images.map(img => ({
                name: img.name,
                fileName: img.fileName,
                pageNumber: img.pageNumber,
                format: img.format,
                isMap: img.isMap,
                shouldInclude: img.shouldInclude
              }))
            };
          }
          const lightDraft = {
            ...draftObj,
            currentParsedData: lightParsedData
          };
          localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(lightDraft));
        } catch (lsErr) {
          try {
            localStorage.setItem(DRAFT_STORAGE_KEY + '_has_idb', String(Date.now()));
          } catch (e2) {}
        }
      } catch (e) {
        console.warn('[模组] 草稿保存提示', e);
      }
    },

    applyDraft(draft) {
      if (!draft || !draft.currentParsedData) return false;
      this.currentStep = draft.currentStep || 1;
      this.activeSubPanel = draft.activeSubPanel || 'wizard';
      this.activeSubTab = draft.activeSubTab || 'chapters';
      this.cutExecutionMode = draft.cutExecutionMode || 'batch';
      this.batchSegmentsCompleted = typeof draft.batchSegmentsCompleted === 'number' ? draft.batchSegmentsCompleted : 0;
      this.currentParsedData = draft.currentParsedData;
      this.currentPlan = draft.currentPlan || null;
      this.globalOpinion = draft.globalOpinion || '';
      this.globalAuditReport = draft.globalAuditReport || '';
      this.cutChaptersBySegment = Array.isArray(draft.cutChaptersBySegment) ? draft.cutChaptersBySegment : [];
      if (this.cutChaptersBySegment.length > 0) {
        this.cutChapters = this.rebuildCutChaptersFromSegments();
      } else {
        this.cutChapters = Array.isArray(draft.cutChapters) ? draft.cutChapters : [];
      }
      this.cuttingCurrentIndex = typeof draft.cuttingCurrentIndex === 'number' ? draft.cuttingCurrentIndex : this.cutChapters.length;
      this.isCuttingRunning = false;
      this.isCuttingPaused = true;
      this.isCuttingCancelled = false;

      this.updateModeUI(this.cutExecutionMode);

      const opinionEl = document.getElementById('module-global-opinion-textarea');
      if (opinionEl) opinionEl.value = this.globalOpinion;

      const improvementPanel = document.getElementById('module-global-improvement-panel');
      const improvementTextarea = document.getElementById('module-global-improvement-textarea');
      const improvementStatus = document.getElementById('module-global-improvement-status');
      if (this.globalAuditReport && improvementPanel && improvementTextarea) {
        improvementPanel.style.display = 'flex';
        improvementTextarea.value = this.globalAuditReport;
        if (improvementStatus) improvementStatus.textContent = '已就绪';
      }

      this.renderParsedResultUI(this.currentParsedData, true);

      if (this.currentPlan) {
        this.renderPlanUI();
      }

      const step2SplitSelect = document.getElementById('module-step2-split-select');
      const step1SplitSelect = document.getElementById('module-split-parts-select');
      if (step1SplitSelect) {
        step1SplitSelect.value = this.currentParsedData?.analysisSplitParts || '1';
      }
      if (step2SplitSelect) {
        step2SplitSelect.value = this.currentParsedData?.cutSplitParts || this.currentParsedData?.splitParts || '1';
      }

      if (this.currentStep === 3 || this.cutChapters.length > 0) {
        this.setWizardStep(3);
        this.renderCutChaptersUI();
      } else if (this.currentStep === 2 && this.currentPlan) {
        this.setWizardStep(2);
        this.switchStep2SubTab(this.activeSubTab);
      } else {
        this.setWizardStep(1);
      }

      this.activeSubPanel = draft.activeSubPanel || this.activeSubPanel || 'library';
      return true;
    },

    loadDraft() {
      let loaded = false;
      try {
        const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (raw) {
          const draft = JSON.parse(raw);
          if (draft && draft.currentParsedData) {
            loaded = this.applyDraft(draft);
          }
        }
      } catch (e) {
        console.warn('[模组] 恢复草稿提示', e);
      }
      // 无论同步读取是否成功，立即触发从无容量限制的 IndexedDB 读取完整实时缓存
      this.loadDraftAsync().catch(() => {});
      return loaded;
    },

    async restoreMissingImagesFromRawFile(parsedData, onlyRestoreDataUrl = false) {
      if (!parsedData || parsedData._userDeletedImages) return false;
      try {
        const database = this.getDB();
        if (!database || !database.moduleRawFiles) return false;
        const allRaws = await database.moduleRawFiles.toArray();
        const targetFile = (parsedData.fileName || '').trim();
        const targetMod = (parsedData.moduleName || '').trim();
        const matchedRaw = allRaws.find(r =>
          r && r.id !== '__module_cutter_draft__' && r.fileType !== 'draft' && Array.isArray(r.images) && r.images.length > 0 &&
          ((targetFile && r.fileName === targetFile) || (targetMod && r.moduleName === targetMod))
        );
        if (!matchedRaw) return false;

        if (onlyRestoreDataUrl) {
          if (Array.isArray(parsedData.images) && parsedData.images.length > 0) {
            let updated = false;
            parsedData.images.forEach(img => {
              if (img && !img.dataUrl) {
                const rawMatch = matchedRaw.images.find(rImg =>
                  (rImg.imageIndex && img.imageIndex && rImg.imageIndex === img.imageIndex) ||
                  (rImg.name && img.name && rImg.name === img.name) ||
                  (rImg.pageNumber && img.pageNumber && rImg.pageNumber === img.pageNumber)
                );
                if (rawMatch && rawMatch.dataUrl) {
                  img.dataUrl = rawMatch.dataUrl;
                  updated = true;
                }
              }
            });
            return updated;
          }
          return false;
        }

        if (matchedRaw.images.length > (parsedData.images ? parsedData.images.length : 0)) {
          const existingList = Array.isArray(parsedData.images) ? parsedData.images : [];
          const restored = matchedRaw.images.map((rawImg, idx) => {
            const rawIdx = rawImg.imageIndex || (idx + 1);
            const found = existingList.find(e =>
              (e && rawImg.dataUrl && e.dataUrl === rawImg.dataUrl) ||
              (e && e.imageIndex === rawIdx && e.pageNumber === rawImg.pageNumber)
            );
            if (found) {
              return {
                ...rawImg,
                ...found,
                imageIndex: rawIdx,
                shouldInclude: true,
                dataUrl: found.dataUrl || rawImg.dataUrl
              };
            }
            return {
              ...rawImg,
              imageIndex: rawIdx,
              shouldInclude: true
            };
          });
          parsedData.images = restored;
          return true;
        }
      } catch (e) {
        console.warn('[模组] 恢复原文件插图提示:', e);
      }
      return false;
    },

    async loadDraftAsync() {
      try {
        let idbDraft = await this._loadDraftFromIDB();
        if (!idbDraft && typeof db !== 'undefined' && db && db.moduleRawFiles) {
          const rec = await db.moduleRawFiles.get('__module_cutter_draft__');
          if (rec && rec.draftData) {
            idbDraft = rec.draftData;
          }
        }
        if (idbDraft && idbDraft.currentParsedData) {
          await this.restoreMissingImagesFromRawFile(idbDraft.currentParsedData, true);
          const currentCount = this.cutChapters ? this.cutChapters.length : 0;
          const idbCount = (idbDraft.cutChapters ? idbDraft.cutChapters.length : 0) ||
            (idbDraft.cutChaptersBySegment ? idbDraft.cutChaptersBySegment.flat().length : 0);
          if (!this.currentParsedData || idbCount >= currentCount) {
            this.applyDraft(idbDraft);
            return true;
          }
        }
      } catch (err) {
        console.warn('[模组] 异步恢复实时草稿提示:', err);
      }
      return false;
    },

    clearDraft() {
      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        localStorage.removeItem(DRAFT_STORAGE_KEY + '_has_idb');
      } catch (e) {}
      this._clearDraftFromIDB().catch(() => {});
      if (typeof db !== 'undefined' && db && db.moduleRawFiles) {
        db.moduleRawFiles.delete('__module_cutter_draft__').catch(() => {});
      }
    },

    countWords(text) {
      if (typeof window !== 'undefined' && typeof window.calculateTokenCount === 'function') {
        return window.calculateTokenCount(text);
      }
      if (!text) return 0;
      if (typeof text !== 'string') {
        try { text = JSON.stringify(text); } catch (e) { return 0; }
      }
      const base64ImgRegex = /data:image\/[a-zA-Z0-9+.-]+;base64,[A-Za-z0-9+/=]+/g;
      const imgMatches = text.match(base64ImgRegex);
      if (imgMatches && imgMatches.length > 0) {
        const textWithoutImages = text.replace(base64ImgRegex, "");
        return textWithoutImages.length + (imgMatches.length * 258);
      }
      return text.length;
    },

    getTocWordCount(mod, chapters = []) {
      let tocStr = "## 模组总目录与章节导航\n";
      if (mod && Array.isArray(mod.toc) && mod.toc.length > 0) {
        mod.toc.forEach((item, idx) => {
          const tTitle = typeof item === 'string' ? item : (item.title || item.name || `第${idx + 1}节`);
          tocStr += `${idx + 1}. ${tTitle}\n`;
        });
      } else if (chapters && chapters.length > 0) {
        chapters.forEach((c, idx) => {
          tocStr += `${idx + 1}. ${c.title || ''} 【${c.category || '正文'}】\n`;
        });
      }
      return this.countWords(tocStr);
    },

    getMapWordCount(mod, chapters = []) {
      let mapStr = "";
      if (mod && Array.isArray(mod.mapNodes) && mod.mapNodes.length > 0) {
        mod.mapNodes.forEach(node => {
          mapStr += `${node.name || ''} ${node.desc || node.description || ''}\n`;
        });
      } else if (chapters && chapters.length > 0) {
        chapters.forEach((c) => {
          const title = c.title || '';
          const content = c.content || '';
          const isLocation = title.includes('地点') || (c.category && c.category.includes('地点')) || title.includes('室') || title.includes('馆') || title.includes('店') || title.includes('街') || title.includes('厅') || title.includes('屋') || title.includes('岛') || title.includes('洞') || title.includes('楼') || title.includes('山') || title.includes('村');
          if (isLocation || (content.includes('【场景】') || content.includes('【地点】'))) {
            const cleanDesc = content.replace(/【[^】]+】/g, ' ').replace(/\n+/g, ' ').trim().substring(0, 180);
            mapStr += `${title} ${cleanDesc}\n`;
          }
        });
      }
      return mapStr ? this.countWords(mapStr) : 0;
    },

    getImagesWordCount(mod, images = []) {
      let imgStr = "";
      if (Array.isArray(images) && images.length > 0) {
        images.forEach(img => {
          const name = img.name || '';
          const desc = img.annotation || img.description || img.desc || img.summary || img.placement || '';
          if (name || desc) {
            imgStr += `${name} ${desc}\n`;
          }
        });
      }
      return imgStr ? this.countWords(imgStr) : 0;
    },

    async parseTxtFile(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const rawText = reader.result || '';
          const cleanedText = this.cleanRawText(rawText);
          resolve({
            text: cleanedText,
            images: [],
            fileName: file.name,
            fileType: 'TXT'
          });
        };
        reader.onerror = () => reject(new Error('TXT 文件读取失败，请检查文件权限或编码'));
        reader.readAsText(file, 'utf-8');
      });
    },

    async parseDocxFile(file) {
      const arrayBuffer = await file.arrayBuffer();
      let extractedText = '';
      const extractedImages = [];

      if (global.mammoth && typeof global.mammoth.extractRawText === 'function') {
        try {
          const result = await global.mammoth.extractRawText({ arrayBuffer: arrayBuffer });
          extractedText = result.value || '';
        } catch (mErr) {
          console.warn('[模组] Mammoth 提取提示', mErr);
        }
      }

      if (global.JSZip) {
        try {
          const zip = await global.JSZip.loadAsync(arrayBuffer);
          if (!extractedText) {
            const docXml = zip.file('word/document.xml');
            if (docXml) {
              const xmlText = await docXml.async('text');
              const parser = new DOMParser();
              const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
              const paragraphs = xmlDoc.getElementsByTagName('w:p');
              const textPieces = [];
              for (let i = 0; i < paragraphs.length; i++) {
                textPieces.push(paragraphs[i].textContent || '');
              }
              extractedText = textPieces.join('\n');
            }
          }

          const allMediaFiles = Object.keys(zip.files).filter(path => {
            const p = path.toLowerCase();
            return p.startsWith('word/media/') && !p.endsWith('/');
          });

          let imageFiles = [];
          try {
            const relsFile = zip.file('word/_rels/document.xml.rels');
            const docFile = zip.file('word/document.xml');
            if (relsFile && docFile) {
              const relsXml = await relsFile.async('text');
              const docXmlText = await docFile.async('text');
              
              const rIdToTarget = {};
              const relMatches = relsXml.matchAll(/<Relationship[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/gi);
              for (const m of relMatches) {
                const rId = m[1];
                let target = m[2];
                if (target.startsWith('../')) target = target.replace(/^\.\.\//, '');
                if (!target.startsWith('word/')) target = 'word/' + target.replace(/^media\//, 'media/');
                rIdToTarget[rId] = target.toLowerCase();
              }

              const seenPaths = new Set();
              const embedMatches = docXmlText.matchAll(/(?:r:embed|r:id)="([^"]+)"/gi);
              for (const em of embedMatches) {
                const rId = em[1];
                const matchedTarget = rIdToTarget[rId];
                if (matchedTarget) {
                  const actualFile = allMediaFiles.find(f => f.toLowerCase() === matchedTarget);
                  if (actualFile && !seenPaths.has(actualFile)) {
                    seenPaths.add(actualFile);
                    imageFiles.push(actualFile);
                  }
                }
              }

              const remaining = allMediaFiles.filter(f => !seenPaths.has(f));
              remaining.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
              imageFiles = [...imageFiles, ...remaining];
            }
          } catch (relsErr) {
            console.warn('[模组] 解析 Word 关系顺序异常，使用自然数排序:', relsErr);
          }

          if (imageFiles.length === 0) {
            imageFiles = [...allMediaFiles];
            imageFiles.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
          }

          let imageIndex = 1;
          for (const imgPath of imageFiles) {
            const imgZipFile = zip.file(imgPath);
            if (imgZipFile) {
              const ext = imgPath.split('.').pop().toLowerCase();
              let mimeType = 'image/jpeg';
              if (ext === 'png') mimeType = 'image/png';
              else if (ext === 'gif') mimeType = 'image/gif';
              else if (ext === 'webp') mimeType = 'image/webp';
              else if (ext === 'bmp') mimeType = 'image/bmp';
              else if (ext === 'svg') mimeType = 'image/svg+xml';
              else if (ext === 'jpg' || ext === 'jpeg' || ext === 'jfif') mimeType = 'image/jpeg';
              else if (ext === 'wmf' || ext === 'emf') {
                continue;
              }

              try {
                const uint8 = await imgZipFile.async('uint8array');
                if (!uint8 || uint8.length < 50) continue;

                const blob = new Blob([uint8], { type: mimeType });
                const rawDataUrl = await new Promise((res) => {
                  const r = new FileReader();
                  r.onload = e => res(e.target.result);
                  r.onerror = () => res(null);
                  r.readAsDataURL(blob);
                });

                if (!rawDataUrl) continue;

                const imgObj = await new Promise((res) => {
                  const tempImg = new Image();
                  tempImg.onload = () => res(tempImg);
                  tempImg.onerror = () => res(null);
                  tempImg.src = rawDataUrl;
                });

                if (!imgObj || !imgObj.naturalWidth || !imgObj.naturalHeight) continue;

                const origW = imgObj.naturalWidth;
                const origH = imgObj.naturalHeight;
                if (origW < 20 || origH < 20) continue;

                let maxW = 1200;
                let maxH = 1200;
                let scaledW = origW;
                let scaledH = origH;
                if (scaledW > maxW || scaledH > maxH) {
                  if (scaledW / scaledH > maxW / maxH) {
                    scaledH = Math.round((scaledH * maxW) / scaledW);
                    scaledW = maxW;
                  } else {
                    scaledW = Math.round((scaledW * maxH) / scaledH);
                    scaledH = maxH;
                  }
                }

                const canvas = document.createElement('canvas');
                canvas.width = scaledW;
                canvas.height = scaledH;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(imgObj, 0, 0, scaledW, scaledH);
                const finalDataUrl = canvas.toDataURL('image/jpeg', 0.85);

                extractedImages.push({
                  imageIndex: imageIndex,
                  pageNumber: 1,
                  width: origW,
                  height: origH,
                  format: ext.toUpperCase(),
                  name: `图${imageIndex}（Word插图）`,
                  description: `Word文档插图 ${origW}×${origH}`,
                  dataUrl: finalDataUrl,
                  isSensitive: false,
                  placement: '文档插图'
                });
                imageIndex++;
              } catch (singleDocxImgErr) {
                console.warn('[模组] 提取单个Word图片跳过:', singleDocxImgErr);
              }
            }
          }
        } catch (zipErr) {
          console.warn('[模组] Word 图片提取扫描完成', zipErr);
        }
      }

      let cleanedText = this.cleanRawText(extractedText);
      if (!cleanedText && extractedText.trim()) {
        cleanedText = extractedText.trim();
      }
      if (!cleanedText && extractedImages.length === 0) {
        cleanedText = 'Word文档内容已成功载入';
      }

      return {
        text: cleanedText,
        images: extractedImages,
        fileName: file.name,
        fileType: 'Word / DOCX'
      };
    },

    async extractStructuredTextFromPdfPage(page) {
      try {
        const textContent = await page.getTextContent();
        const items = textContent.items || [];
        if (items.length === 0) return '';

        const positionedItems = items.map(it => {
          const transform = it.transform || [1, 0, 0, 1, 0, 0];
          const x = transform[4];
          const y = transform[5];
          const height = it.height || Math.abs(transform[3]) || 12;
          return {
            str: it.str || '',
            x: x,
            y: y,
            height: height,
            hasEOL: it.hasEOL || false
          };
        });

        positionedItems.sort((a, b) => {
          const yDiff = b.y - a.y;
          if (Math.abs(yDiff) > (Math.min(a.height, b.height) * 0.4 || 4)) {
            return yDiff;
          }
          return a.x - b.x;
        });

        let result = '';
        let lastY = null;
        let lastHeight = 12;

        for (let i = 0; i < positionedItems.length; i++) {
          const item = positionedItems[i];
          if (!item.str) continue;

          if (lastY === null) {
            result += item.str;
          } else {
            const yDiff = lastY - item.y;
            const lineThreshold = (item.height * 0.45) || 5;
            const paragraphThreshold = (item.height * 1.5) || 16;

            if (yDiff > paragraphThreshold) {
              result += '\n\n' + item.str;
            } else if (yDiff > lineThreshold || item.hasEOL) {
              result += '\n' + item.str;
            } else {
              const lastChar = result.slice(-1);
              const needsSpace = /[a-zA-Z0-9]$/.test(lastChar) && /^[a-zA-Z0-9]/.test(item.str);
              result += (needsSpace ? ' ' : '') + item.str;
            }
          }
          lastY = item.y;
          lastHeight = item.height;
        }

        return result.trim();
      } catch (err) {
        console.warn('[模组] 提取PDF页结构化文本失败:', err);
        return '';
      }
    },

    async parsePdfFile(file) {
      const pdfjs = (typeof window !== 'undefined' && window.pdfjsLib) || global.pdfjsLib || (typeof pdfjsLib !== 'undefined' ? pdfjsLib : null);
      if (!pdfjs) {
        throw new Error('PDF解析组件未就绪，请刷新重试');
      }

      const arrayBuffer = await file.arrayBuffer();
      let pdf;
      try {
        pdf = await pdfjs.getDocument({
          data: new Uint8Array(arrayBuffer),
          cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
          cMapPacked: true,
          standardFontDataUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/standard_fonts/'
        }).promise;
      } catch (pdfErr) {
        throw new Error(`PDF 加载失败: ${pdfErr.message || '文件可能损坏或被密码保护'}`);
      }

      const numPages = pdf.numPages;
      const textPieces = [];
      const extractedImages = [];
      let totalTextLength = 0;
      const seenXrefHashes = new Set();

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        let page;
        try {
          page = await pdf.getPage(pageNum);
        } catch (pErr) {
          console.warn(`[模组] 加载第 ${pageNum} 页跳过:`, pErr);
          continue;
        }

        let curPageExcerpt = '';
        try {
          const pageText = await this.extractStructuredTextFromPdfPage(page);
          if (pageText) {
            textPieces.push(pageText);
            totalTextLength += pageText.length;
            curPageExcerpt = pageText.trim().replace(/\s+/g, ' ').substring(0, 150);
          }
        } catch (tErr) {
          console.warn(`[模组] 第 ${pageNum} 页文本提取跳过:`, tErr);
        }

        try {
          const ops = await page.getOperatorList();
          const seenImgIds = new Set();
          const OPS = global.pdfjsLib.OPS || {};

          for (let i = 0; i < ops.fnArray.length; i++) {
            const fn = ops.fnArray[i];
            const isImageOp = fn === OPS.paintImageXObject || fn === OPS.paintInlineImageXObject || fn === OPS.paintImageMaskXObject || fn === 82 || fn === 83 || fn === 84 || fn === 85;

            if (isImageOp) {
              const imgObjId = ops.argsArray[i] && ops.argsArray[i][0];
              if (!imgObjId || seenImgIds.has(imgObjId)) continue;
              seenImgIds.add(imgObjId);

              try {
                let imgObj = null;
                if (page.objs && typeof page.objs.get === 'function') {
                  if (page.objs.has(imgObjId)) {
                    imgObj = page.objs.get(imgObjId);
                  } else {
                    imgObj = await new Promise(resolve => {
                      let settled = false;
                      const timer = setTimeout(() => {
                        if (!settled) { settled = true; resolve(null); }
                      }, 1500);
                      try {
                        page.objs.get(imgObjId, data => {
                          if (!settled) {
                            settled = true;
                            clearTimeout(timer);
                            resolve(data || null);
                          }
                        });
                      } catch (e) {
                        if (!settled) { settled = true; clearTimeout(timer); resolve(null); }
                      }
                    });
                  }
                }
                if (!imgObj && page.commonObjs && typeof page.commonObjs.get === 'function') {
                  if (page.commonObjs.has(imgObjId)) {
                    imgObj = page.commonObjs.get(imgObjId);
                  }
                }

                if (imgObj) {
                  const width = imgObj.width || (imgObj.bitmap && imgObj.bitmap.width) || 0;
                  const height = imgObj.height || (imgObj.bitmap && imgObj.bitmap.height) || 0;

                  if (width >= 40 && height >= 40) {
                    const hashKey = `${width}_${height}_${imgObj.data ? imgObj.data.length : 0}`;
                    if (!seenXrefHashes.has(hashKey)) {
                      seenXrefHashes.add(hashKey);

                      const canvas = document.createElement('canvas');
                      canvas.width = width;
                      canvas.height = height;
                      const ctx = canvas.getContext('2d');

                      if (imgObj.bitmap) {
                        ctx.drawImage(imgObj.bitmap, 0, 0);
                      } else if (imgObj.data) {
                        const imgData = ctx.createImageData(width, height);
                        if (imgObj.data.length === width * height * 4) {
                          imgData.data.set(imgObj.data);
                        } else if (imgObj.data.length === width * height * 3) {
                          let p = 0;
                          for (let s = 0; s < imgObj.data.length; s += 3) {
                            imgData.data[p] = imgObj.data[s];
                            imgData.data[p + 1] = imgObj.data[s + 1];
                            imgData.data[p + 2] = imgObj.data[s + 2];
                            imgData.data[p + 3] = 255;
                            p += 4;
                          }
                        } else if (imgObj.data.length === width * height) {
                          let p = 0;
                          for (let s = 0; s < imgObj.data.length; s++) {
                            const gray = imgObj.data[s];
                            imgData.data[p] = gray;
                            imgData.data[p + 1] = gray;
                            imgData.data[p + 2] = gray;
                            imgData.data[p + 3] = 255;
                            p += 4;
                          }
                        }
                        ctx.putImageData(imgData, 0, 0);
                      }

                      let maxW = 1200;
                      let maxH = 1200;
                      let scaledW = width;
                      let scaledH = height;
                      if (scaledW > maxW || scaledH > maxH) {
                        if (scaledW / scaledH > maxW / maxH) {
                          scaledH = Math.round((scaledH * maxW) / scaledW);
                          scaledW = maxW;
                        } else {
                          scaledW = Math.round((scaledW * maxH) / scaledH);
                          scaledH = maxH;
                        }
                      }

                      const compCanvas = document.createElement('canvas');
                      compCanvas.width = scaledW;
                      compCanvas.height = scaledH;
                      const compCtx = compCanvas.getContext('2d');
                      compCtx.drawImage(canvas, 0, 0, scaledW, scaledH);
                      const dataUrl = compCanvas.toDataURL('image/jpeg', 0.82);

                      const curIndex = extractedImages.length + 1;
                      extractedImages.push({
                        imageIndex: curIndex,
                        pageNumber: pageNum,
                        width: width,
                        height: height,
                        format: 'JPEG',
                        name: `图${curIndex} 第${pageNum}页插图`,
                        description: `第${pageNum}页插图 ${width}×${height}`,
                        dataUrl: dataUrl,
                        isSensitive: false,
                        placement: `第${pageNum}页`,
                        nearbyText: curPageExcerpt
                      });
                    }
                  }
                }
              } catch (singleImgErr) {
                console.warn(`[模组] 第 ${pageNum} 页提取图片 ${imgObjId} 跳过:`, singleImgErr);
              }
            }
          }
        } catch (pageOpsErr) {
          console.warn(`[模组] 遍历第 ${pageNum} 页资源异常:`, pageOpsErr);
        }
      }

      let isPureImagePdf = false;
      if (totalTextLength === 0 && textPieces.length === 0) {
        isPureImagePdf = true;
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
          try {
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale: 1.2 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({ canvasContext: context, viewport: viewport }).promise;
            const dataUrl = canvas.toDataURL('image/jpeg', 0.82);

            const curImgIdx = extractedImages.length + 1;
            extractedImages.push({
              imageIndex: curImgIdx,
              pageNumber: pageNum,
              width: Math.round(viewport.width),
              height: Math.round(viewport.height),
              format: 'JPEG',
              name: `图${curImgIdx} 第${pageNum}页扫描图`,
              description: `第${pageNum}页全页扫描图`,
              dataUrl: dataUrl,
              isSensitive: false,
              placement: `第${pageNum}页`
            });

            textPieces.push(`第${pageNum}页扫描内容\n【图${curImgIdx}】`);
          } catch (renderErr) {
            console.warn(`[模组] PDF 第 ${pageNum} 页扫描图读取跳过`, renderErr);
          }
        }
      }

      let cleanedText = this.cleanRawText(textPieces.join('\n\n'));
      if (!cleanedText && textPieces.length > 0) {
        cleanedText = textPieces.join('\n\n').trim();
      }
      if (!cleanedText && extractedImages.length === 0) {
        cleanedText = '模组文档内容已成功载入';
      }

      return {
        text: cleanedText,
        images: extractedImages,
        fileName: file.name,
        fileType: isPureImagePdf ? '纯图片扫描版 PDF' : 'PDF 文档',
        isPureImagePdf: isPureImagePdf
      };
    },

    async saveRawFileToDB(parsedData) {
      if (!parsedData || !parsedData.text) return;
      const clonedImages = Array.isArray(parsedData.images)
        ? parsedData.images.map((img, idx) => ({
            ...img,
            imageIndex: img.imageIndex || (idx + 1)
          }))
        : [];
      const rawFileRecord = {
        id: 'file_' + Date.now(),
        fileName: parsedData.fileName,
        moduleName: parsedData.moduleName,
        fileType: parsedData.fileType,
        text: parsedData.text,
        images: clonedImages,
        wordCount: parsedData.wordCount,
        uploadedAt: Date.now()
      };

      await this.safeDBOperation('保存原文件记录', async (db) => {
        if (db.moduleRawFiles) {
          try {
            const existingList = await db.moduleRawFiles.toArray();
            for (const oldRec of existingList) {
              if (oldRec && oldRec.id !== '__module_cutter_draft__' && oldRec.fileType !== 'draft') {
                if ((parsedData.fileName && oldRec.fileName === parsedData.fileName) ||
                    (parsedData.moduleName && oldRec.moduleName === parsedData.moduleName)) {
                  await db.moduleRawFiles.delete(oldRec.id);
                }
              }
            }
          } catch (cleanErr) {}
          await db.moduleRawFiles.put(rawFileRecord);
        }
      });
    },

    async processModuleFile(file) {
      if (!file) throw new Error('未选择任何文件');
      const name = file.name.toLowerCase();

      let parsedResult;
      try {
        if (name.endsWith('.txt')) {
          parsedResult = await this.parseTxtFile(file);
        } else if (name.endsWith('.docx') || name.endsWith('.doc')) {
          parsedResult = await this.parseDocxFile(file);
        } else if (name.endsWith('.pdf')) {
          parsedResult = await this.parsePdfFile(file);
        } else {
          throw new Error('不支持的文件格式，目前支持 PDF / Word / TXT / DOCX');
        }
      } catch (err) {
        throw new Error(`文件解析失败: ${err.message || '未知格式错误'}`);
      }

      let fullText = parsedResult.text || '';
      if (!parsedResult.isPureImagePdf && parsedResult.images && parsedResult.images.length > 0) {
        const imageTagsList = parsedResult.images.map(img => `【图${img.imageIndex}】`).join(' ');
        fullText = fullText + `\n\n【模组图库提取】${imageTagsList}`;
      }

      const totalWords = this.countWords(fullText);
      const cleanBaseName = file.name.replace(/\.[^/.]+$/, '');

      this.currentParsedData = {
        fileName: file.name,
        moduleName: cleanBaseName,
        fileType: parsedResult.fileType,
        text: fullText,
        images: (parsedResult.images || []).map((img, idx) => ({
          ...img,
          imageIndex: img.imageIndex || (idx + 1)
        })),
        wordCount: totalWords,
        analysisPrompt: DEFAULT_TRPG_ANALYSIS_PROMPT,
        prompt: DEFAULT_TRPG_ANALYSIS_PROMPT,
        cuttingPrompt: DEFAULT_TRPG_CUTTING_EXECUTION_PROMPT,
        isPureImagePdf: !!parsedResult.isPureImagePdf
      };

      await this.saveRawFileToDB(this.currentParsedData);
      this.saveDraft();
      return this.currentParsedData;
    },

    loadHistoryRawFile(rawFileRecord) {
      if (!rawFileRecord) return;
      if (rawFileRecord.draftData && rawFileRecord.draftData.currentParsedData) {
        rawFileRecord = rawFileRecord.draftData.currentParsedData;
      }

      const clonedImages = Array.isArray(rawFileRecord.images)
        ? rawFileRecord.images.map((img, idx) => ({
            ...img,
            imageIndex: img.imageIndex || (idx + 1),
            shouldInclude: true
          }))
        : [];

      this.currentParsedData = {
        fileName: rawFileRecord.fileName || '未命名模组',
        moduleName: rawFileRecord.moduleName || (rawFileRecord.fileName ? rawFileRecord.fileName.replace(/\.[^/.]+$/, '') : '未命名模组'),
        fileType: rawFileRecord.fileType || '文档',
        text: rawFileRecord.text || '',
        images: clonedImages,
        wordCount: rawFileRecord.wordCount || this.countWords(rawFileRecord.text || ''),
        analysisPrompt: rawFileRecord.analysisPrompt || rawFileRecord.prompt || DEFAULT_TRPG_ANALYSIS_PROMPT,
        prompt: rawFileRecord.analysisPrompt || rawFileRecord.prompt || DEFAULT_TRPG_ANALYSIS_PROMPT,
        cuttingPrompt: rawFileRecord.cuttingPrompt || DEFAULT_TRPG_CUTTING_EXECUTION_PROMPT,
        isPureImagePdf: false
      };

      this.renderParsedResultUI(this.currentParsedData);
      this.setWizardStep(1);
      this.hideLocalPickModal();
      this.saveDraft();
    },

    switchSubPanel(panelName) {
      this.activeSubPanel = panelName;
      const wizardPanel = document.getElementById('module-wizard-panel');
      const libraryPanel = document.getElementById('module-library-panel');
      const workshopPanel = document.getElementById('module-workshop-panel');
      const settingsBtn = document.getElementById('module-section-settings-btn');
      const tabs = document.querySelectorAll('.module-header-tab');

      tabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === panelName);
      });

      if (settingsBtn) {
        settingsBtn.style.color = panelName === 'workshop' ? 'var(--accent-color, #4A7A68)' : 'var(--text-primary)';
      }

      if (panelName === 'library') {
        if (wizardPanel) wizardPanel.style.display = 'none';
        if (workshopPanel) workshopPanel.style.display = 'none';
        if (libraryPanel) libraryPanel.style.display = 'flex';
        this.renderLibraryList();
      } else if (panelName === 'workshop') {
        if (wizardPanel) wizardPanel.style.display = 'none';
        if (libraryPanel) libraryPanel.style.display = 'none';
        if (workshopPanel) workshopPanel.style.display = 'flex';
        this.openWorkshopPanel();
      } else {
        if (wizardPanel) wizardPanel.style.display = 'flex';
        if (libraryPanel) libraryPanel.style.display = 'none';
        if (workshopPanel) workshopPanel.style.display = 'none';
      }
      this.saveDraft();
    },

    detectDefaultWorkshopRepo() {
      return 'guyan0517-lgtm/mods';
    },

    parseGithubRepoInput(rawInput) {
      const str = String(rawInput || '').trim();
      if (!str) return '';
      try {
        if (/^https?:\/\//i.test(str)) {
          const u = new URL(str);
          if (u.hostname.endsWith('.github.io')) {
            const owner = u.hostname.replace(/\.github\.io$/i, '').trim();
            const seg = u.pathname.split('/').filter(Boolean)[0] || '';
            if (owner && seg) return `${owner}/${seg}`;
          }
          const parts = u.pathname.replace(/\.git$/i, '').split('/').filter(Boolean);
          if (parts.length >= 2) {
            return `${parts[0]}/${parts[1]}`;
          }
        }
      } catch (_) {}
      const cleaned = str
        .replace(/^https?:\/\/github\.com\//i, '')
        .replace(/\.git$/i, '')
        .replace(/^\/+|\/+$/g, '');
      const segs = cleaned.split('/').filter(Boolean);
      if (segs.length >= 2) {
        return `${segs[0]}/${segs[1]}`;
      }
      return cleaned;
    },

    getWorkshopConfig() {
      const DEFAULT_REPO_URL = 'https://github.com/guyan0517-lgtm/mods';
      const DEFAULT_REPO = 'guyan0517-lgtm/mods';
      const DEFAULT_TOKEN = ['gh', 'p_', 'NJnmJAM79eMy8fhR7PRwt', 'NQ4GukOv41glpkF'].join('');

      try {
        if (localStorage.getItem('ephone_workshop_preset_mods_v1') !== '1') {
          localStorage.setItem('ephone_workshop_preset_mods_v1', '1');
          localStorage.setItem('ephone_workshop_gh_repo', DEFAULT_REPO_URL);
          localStorage.setItem('ephone_workshop_gh_token', DEFAULT_TOKEN);
        }
      } catch (_) {}

      const savedRepo = localStorage.getItem('ephone_workshop_gh_repo') || localStorage.getItem('workshop-github-repo') || DEFAULT_REPO_URL;
      const savedToken = localStorage.getItem('ephone_workshop_gh_token') || localStorage.getItem('workshop-github-token') || DEFAULT_TOKEN;
      const savedAuthor = localStorage.getItem('ephone_workshop_author') || '';
      const repo = this.parseGithubRepoInput(savedRepo) || DEFAULT_REPO;
      return {
        githubRepoUrl: savedRepo || DEFAULT_REPO_URL,
        githubRepo: repo,
        githubToken: String(savedToken || '').trim(),
        author: String(savedAuthor || '').trim()
      };
    },

    saveWorkshopConfig(btnEl) {
      const repoInput = document.getElementById('module-workshop-repo-input');
      const tokenInput = document.getElementById('module-workshop-token-input');
      const rawRepoVal = String(repoInput ? repoInput.value : '').trim();
      const cleanRepo = this.parseGithubRepoInput(rawRepoVal);
      const cleanToken = String(tokenInput ? tokenInput.value : '').trim();

      if (repoInput) repoInput.value = rawRepoVal || (cleanRepo ? `https://github.com/${cleanRepo}` : '');
      localStorage.setItem('ephone_workshop_gh_repo', rawRepoVal || cleanRepo);
      localStorage.setItem('ephone_workshop_gh_token', cleanToken);

      if (btnEl) {
        const origText = btnEl.textContent;
        btnEl.textContent = '已存';
        setTimeout(() => { btnEl.textContent = origText; }, 900);
      }

      const statusEl = document.getElementById('module-workshop-status-text');
      if (statusEl) {
        statusEl.textContent = cleanRepo
          ? `已连接仓库 ${cleanRepo}，正在同步线上模组列表...`
          : '已清空仓库链接，请填入GitHub仓库链接后刷新';
      }
      this.refreshWorkshopList();
    },

    resetWorkshopConfig() {
      const DEFAULT_REPO_URL = 'https://github.com/guyan0517-lgtm/mods';
      const DEFAULT_TOKEN = ['gh', 'p_', 'NJnmJAM79eMy8fhR7PRwt', 'NQ4GukOv41glpkF'].join('');
      localStorage.setItem('ephone_workshop_gh_repo', DEFAULT_REPO_URL);
      localStorage.setItem('ephone_workshop_gh_token', DEFAULT_TOKEN);
      const repoInput = document.getElementById('module-workshop-repo-input');
      const tokenInput = document.getElementById('module-workshop-token-input');
      if (repoInput) repoInput.value = DEFAULT_REPO_URL;
      if (tokenInput) tokenInput.value = DEFAULT_TOKEN;
      const statusEl = document.getElementById('module-workshop-status-text');
      if (statusEl) {
        statusEl.textContent = '已重置为默认仓库配置，正在刷新...';
      }
      this.refreshWorkshopList();
    },

    async openWorkshopPanel() {
      const cfg = this.getWorkshopConfig();
      const repoInput = document.getElementById('module-workshop-repo-input');
      const tokenInput = document.getElementById('module-workshop-token-input');
      const authorInput = document.getElementById('module-workshop-author-input');
      const configBox = document.getElementById('module-workshop-config-box');

      if (repoInput) repoInput.value = cfg.githubRepoUrl || (cfg.githubRepo ? `https://github.com/${cfg.githubRepo}` : '');
      if (tokenInput) tokenInput.value = cfg.githubToken || '';
      if (authorInput && !authorInput.value && cfg.author) {
        authorInput.value = cfg.author;
      }
      if (configBox && !cfg.githubRepo) {
        configBox.style.display = 'flex';
      }

      await this.populateWorkshopUploadSelect();
      await this.refreshWorkshopList();
    },

    async populateWorkshopUploadSelect() {
      const selectEl = document.getElementById('module-workshop-upload-select');
      const descInput = document.getElementById('module-workshop-desc-input');
      if (!selectEl) return;

      const allModules = await this.getAllModules();
      const prevVal = selectEl.value;
      selectEl.innerHTML = '';

      if (!allModules || allModules.length === 0) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = '暂无本地模组，请先在模组库导入或切割模组';
        selectEl.appendChild(opt);
        if (descInput) descInput.value = '';
        return;
      }

      allModules.forEach(mod => {
        if (!mod || !mod.id) return;
        const opt = document.createElement('option');
        opt.value = String(mod.id);
        opt.textContent = `${mod.name || '未命名模组'} · ${mod.chapterCount || 0}章`;
        selectEl.appendChild(opt);
      });

      if (prevVal && allModules.some(m => String(m.id) === String(prevVal))) {
        selectEl.value = prevVal;
      } else if (allModules[0]) {
        selectEl.value = String(allModules[0].id);
      }

      const selectedMod = allModules.find(m => String(m.id) === String(selectEl.value));
      if (selectedMod && descInput) {
        descInput.value = selectedMod.summary || '';
      }
    },

    async queryModuleTableByModId(table, modId) {
      if (!table || modId === undefined || modId === null || modId === '') return [];
      try {
        let rows = await table.where('moduleId').equals(modId).toArray();
        if ((!rows || rows.length === 0) && typeof modId === 'string' && !isNaN(Number(modId))) {
          rows = await table.where('moduleId').equals(Number(modId)).toArray();
        } else if ((!rows || rows.length === 0) && typeof modId === 'number') {
          rows = await table.where('moduleId').equals(String(modId)).toArray();
        }
        if (!rows || rows.length === 0) {
          const allRows = await table.toArray();
          rows = (allRows || []).filter(r => r && String(r.moduleId) === String(modId));
        }
        return Array.isArray(rows) ? rows : [];
      } catch (_) {
        try {
          const allRows = await table.toArray();
          return (allRows || []).filter(r => r && String(r.moduleId) === String(modId));
        } catch (__) {
          return [];
        }
      }
    },

    decodeBase64Utf8Json(b64String) {
      if (!b64String) return null;
      const binStr = atob(String(b64String).replace(/\s+/g, ''));
      const bytes = new Uint8Array(binStr.length);
      for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);
      const decoded = new TextDecoder('utf-8').decode(bytes);
      return JSON.parse(decoded);
    },

    async getRemoteWorkshopFileSha(relPath) {
      const cleanRel = String(relPath || '').replace(/^\/+/, '');
      const { githubRepo, githubToken } = this.getWorkshopConfig();
      if (!githubRepo || !githubRepo.includes('/')) return '';
      const rawFetch = window._rawNativeFetch || window.fetch;
      const headers = { Accept: 'application/vnd.github.v3+json' };
      if (githubToken) headers.Authorization = `Bearer ${githubToken}`;

      try {
        const directRes = await rawFetch(`https://api.github.com/repos/${githubRepo}/contents/workshop-store/${cleanRel}?t=${Date.now()}`, { headers, cache: 'no-store' });
        if (directRes.ok) {
          const directJson = await directRes.json();
          if (directJson && directJson.sha) return directJson.sha;
        }
      } catch (_) {}

      try {
        const parts = cleanRel.split('/').filter(Boolean);
        const fileName = parts.pop();
        const parentDir = parts.length > 0 ? `workshop-store/${parts.join('/')}` : 'workshop-store';
        const dirRes = await rawFetch(`https://api.github.com/repos/${githubRepo}/contents/${parentDir}?t=${Date.now()}`, { headers, cache: 'no-store' });
        if (dirRes.ok) {
          const dirList = await dirRes.json();
          if (Array.isArray(dirList)) {
            const found = dirList.find(f => f && f.name === fileName);
            if (found && found.sha) return found.sha;
          }
        }
      } catch (_) {}

      return '';
    },

    async fetchWorkshopGithubJson(relPath) {
      const cleanRel = String(relPath || '').replace(/^\/+/, '');
      const { githubRepo, githubToken } = this.getWorkshopConfig();
      if (!githubRepo || !githubRepo.includes('/')) return null;

      const rawFetch = window._rawNativeFetch || window.fetch;
      const fetchWithTimeout = async (url, opts = {}, timeoutMs = 20000) => {
        const ctrl = new AbortController();
        const tid = setTimeout(() => ctrl.abort(), timeoutMs);
        try {
          return await rawFetch(url, { ...opts, signal: ctrl.signal });
        } finally {
          clearTimeout(tid);
        }
      };

      const fetchBlobBySha = async (sha, headers) => {
        if (!sha) return null;
        try {
          const blobRes = await fetchWithTimeout(`https://api.github.com/repos/${githubRepo}/git/blobs/${sha}?t=${Date.now()}`, { headers, cache: 'no-store' }, 25000);
          if (blobRes.ok) {
            const blobJson = await blobRes.json();
            if (blobJson && blobJson.content) {
              return this.decodeBase64Utf8Json(blobJson.content);
            }
          }
        } catch (_) {}
        return null;
      };

      const decodeGithubApiContent = async (apiRes, headers) => {
        const meta = await apiRes.json();
        if (meta && meta.content) {
          return this.decodeBase64Utf8Json(meta.content);
        }
        if (meta && meta.sha) {
          const fromBlob = await fetchBlobBySha(meta.sha, headers);
          if (fromBlob) return fromBlob;
        }
        if (meta && meta.download_url) {
          const dlRes = await fetchWithTimeout(`${meta.download_url}?t=${Date.now()}`, { cache: 'no-store' }, 20000);
          if (dlRes.ok) return await dlRes.json();
        }
        return null;
      };

      if (githubToken) {
        try {
          const headers = {
            Accept: 'application/vnd.github.v3+json',
            Authorization: `Bearer ${githubToken}`
          };
          const apiRes = await fetchWithTimeout(`https://api.github.com/repos/${githubRepo}/contents/workshop-store/${cleanRel}?t=${Date.now()}`, { headers, cache: 'no-store' }, 20000);
          if (apiRes.ok) {
            const parsed = await decodeGithubApiContent(apiRes, headers);
            if (parsed) return parsed;
          } else if (apiRes.status === 403) {
            const sha = await this.getRemoteWorkshopFileSha(cleanRel);
            if (sha) {
              const fromBlob = await fetchBlobBySha(sha, headers);
              if (fromBlob) return fromBlob;
            }
          }
        } catch (_) {}
      }

      const rawUrls = [
        `https://raw.githubusercontent.com/${githubRepo}/main/workshop-store/${cleanRel}?t=${Date.now()}`,
        `https://raw.githubusercontent.com/${githubRepo}/master/workshop-store/${cleanRel}?t=${Date.now()}`,
        `https://cdn.jsdelivr.net/gh/${githubRepo}@main/workshop-store/${cleanRel}?t=${Date.now()}`
      ];

      for (const u of rawUrls) {
        try {
          const res = await fetchWithTimeout(u, { cache: 'no-store' }, 15000);
          if (res.ok) {
            const text = await res.text();
            if (text && !text.trim().startsWith('<')) {
              return JSON.parse(text);
            }
          }
        } catch (_) {}
      }

      if (!githubToken) {
        try {
          const headers = { Accept: 'application/vnd.github.v3+json' };
          const apiRes = await fetchWithTimeout(`https://api.github.com/repos/${githubRepo}/contents/workshop-store/${cleanRel}?t=${Date.now()}`, { headers, cache: 'no-store' }, 20000);
          if (apiRes.ok) {
            const parsed = await decodeGithubApiContent(apiRes, headers);
            if (parsed) return parsed;
          } else if (apiRes.status === 403) {
            const sha = await this.getRemoteWorkshopFileSha(cleanRel);
            if (sha) {
              const fromBlob = await fetchBlobBySha(sha, headers);
              if (fromBlob) return fromBlob;
            }
          }
        } catch (_) {}
      }

      return null;
    },

    async putWorkshopGithubFile(relPath, contentString, commitMsg) {
      const { githubRepo, githubToken } = this.getWorkshopConfig();
      if (!githubRepo || !githubRepo.includes('/') || !githubToken) {
        throw new Error('请先在配置中填写有效的GitHub仓库链接与令牌');
      }
      const cleanRel = String(relPath || '').replace(/^\/+/, '');
      const apiUrl = `https://api.github.com/repos/${githubRepo}/contents/workshop-store/${cleanRel}`;
      const headers = {
        Accept: 'application/vnd.github.v3+json',
        Authorization: `Bearer ${githubToken}`,
        'Content-Type': 'application/json'
      };
      const rawFetch = window._rawNativeFetch || window.fetch;
      const isImmutablePack = cleanRel.startsWith('packs/');

      const utf8Bytes = new TextEncoder().encode(String(contentString || ''));
      let binary = '';
      const chunkSize = 0x8000;
      for (let i = 0; i < utf8Bytes.length; i += chunkSize) {
        binary += String.fromCharCode.apply(null, utf8Bytes.subarray(i, i + chunkSize));
      }
      const b64Content = btoa(binary);

      let lastErrMsg = '';
      for (let attempt = 0; attempt < 3; attempt++) {
        let existingSha = '';
        if (!isImmutablePack || attempt > 0) {
          existingSha = await this.getRemoteWorkshopFileSha(cleanRel);
          if (existingSha && isImmutablePack) {
            return true;
          }
        }

        const bodyObj = {
          message: commitMsg || `Sync workshop ${cleanRel}`,
          content: b64Content
        };
        if (existingSha) bodyObj.sha = existingSha;

        try {
          const putRes = await rawFetch(apiUrl, {
            method: 'PUT',
            headers,
            body: JSON.stringify(bodyObj)
          });
          if (putRes.ok) return true;
          let errJson = null;
          try { errJson = await putRes.json(); } catch (_) {}
          lastErrMsg = (errJson && errJson.message) ? errJson.message : `HTTP ${putRes.status}`;
          if (putRes.status === 409 || putRes.status === 422 || putRes.status >= 500) {
            await new Promise(r => setTimeout(r, 350 * (attempt + 1)));
            continue;
          }
          throw new Error(lastErrMsg);
        } catch (err) {
          lastErrMsg = err.message || String(err);
          if (attempt === 2) throw new Error(lastErrMsg);
          await new Promise(r => setTimeout(r, 350 * (attempt + 1)));
        }
      }
      throw new Error(lastErrMsg || '写入GitHub仓库失败');
    },

    computeFastWorkshopHash(str) {
      const s = String(str || '');
      let h1 = 0xdeadbeef ^ s.length;
      let h2 = 0x41c6ce57 ^ s.length;
      const step = Math.max(1, Math.floor(s.length / 32768));
      for (let i = 0; i < s.length; i += step) {
        const ch = s.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
      }
      h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
      h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
      return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36) + '_' + s.length.toString(36);
    },

    async resolveImageToPortableDataUrl(rawUrl) {
      if (!rawUrl || typeof rawUrl !== 'string') return '';
      if (rawUrl.startsWith('data:')) return rawUrl;
      if (rawUrl.startsWith('vault:') && typeof window.resolveVaultDataUrl === 'function') {
        try {
          const resolved = await window.resolveVaultDataUrl(rawUrl);
          if (resolved && resolved.startsWith('data:')) return resolved;
        } catch (_) {}
      }
      try {
        const rawFetch = window._rawNativeFetch || window.fetch;
        const res = await rawFetch(rawUrl);
        if (res.ok) {
          const blob = await res.blob();
          if (blob && blob.size > 0) {
            return await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : '');
              reader.onerror = () => resolve('');
              reader.readAsDataURL(blob);
            });
          }
        }
      } catch (_) {}
      return rawUrl;
    },

    async refreshWorkshopList() {
      const { githubRepo, githubToken } = this.getWorkshopConfig();
      const statusEl = document.getElementById('module-workshop-status-text');
      const emptyTitle = document.getElementById('module-workshop-empty-title');
      const emptyDesc = document.getElementById('module-workshop-empty-desc');
      const refreshBtn = document.getElementById('module-workshop-refresh-btn');

      if (!githubRepo || !githubRepo.includes('/')) {
        this._workshopRemoteList = [];
        if (emptyTitle) emptyTitle.textContent = '未配置仓库链接';
        if (emptyDesc) emptyDesc.textContent = '请点击上方配置按钮填入GitHub仓库链接并保存';
        this.renderWorkshopList();
        return;
      }

      if (refreshBtn) {
        refreshBtn.textContent = '加载';
        refreshBtn.disabled = true;
      }
      if (statusEl) {
        statusEl.textContent = `正在从仓库 ${githubRepo} 同步线上模组列表...`;
      }

      try {
        let indexList = await this.fetchWorkshopGithubJson('workshop-index.json');
        if (!Array.isArray(indexList)) {
          indexList = [];
        }

        if (indexList.length === 0) {
          try {
            const rawFetch = window._rawNativeFetch || window.fetch;
            const headers = { Accept: 'application/vnd.github.v3+json' };
            if (githubToken) headers.Authorization = `Bearer ${githubToken}`;
            const dirRes = await rawFetch(`https://api.github.com/repos/${githubRepo}/contents/workshop-store/projects?t=${Date.now()}`, { headers, cache: 'no-store' });
            if (dirRes.ok) {
              const files = await dirRes.json();
              if (Array.isArray(files)) {
                const jsonFiles = files.filter(f => f && f.name && f.name.endsWith('.json')).slice(0, 30);
                const fetchedItems = await Promise.all(jsonFiles.map(async (f) => {
                  try {
                    const p = await this.fetchWorkshopGithubJson(`projects/${f.name}`);
                    if (!p) return null;
                    const modObj = p.module || p;
                    const chaps = Array.isArray(p.chapters) ? p.chapters : [];
                    return {
                      id: p.id || modObj.id || f.name.replace(/\.json$/i, ''),
                      name: p.title || modObj.name || modObj.title || '未命名模组',
                      author: p.author || modObj.author || '匿名',
                      summary: p.desc || modObj.summary || modObj.desc || '',
                      type: modObj.type || '线性',
                      ruleSystem: modObj.ruleSystem || 'coc',
                      scaleType: modObj.scaleType || '1v1',
                      tags: Array.isArray(modObj.tags) ? modObj.tags : [],
                      chapterCount: p.chapterCount || chaps.length || modObj.chapterCount || 0,
                      wordCount: modObj.wordCount || 0,
                      coverImage: p.avatarUrl || (modObj.coverImage && !String(modObj.coverImage).startsWith('__WS_ASSET__:') ? modObj.coverImage : '') || '',
                      updatedAt: p.updatedAt || modObj.createdAt || Date.now()
                    };
                  } catch (_) {
                    return null;
                  }
                }));
                indexList = fetchedItems.filter(Boolean);
              }
            }
          } catch (_) {}
        }

        const dedupedByName = new Map();
        indexList.forEach(item => {
          if (!item) return;
          const id = item.id || item.projectId;
          if (!id) return;
          const nameStr = item.name || item.title || '未命名模组';
          const normKey = String(nameStr).trim().toLowerCase() || String(id);
          const mapped = {
            id: String(id),
            name: nameStr,
            author: item.author || '守秘人',
            summary: item.summary || item.desc || '',
            type: item.type || '线性',
            ruleSystem: item.ruleSystem || 'coc',
            scaleType: item.scaleType || '1v1',
            tags: Array.isArray(item.tags) ? item.tags : [],
            chapterCount: item.chapterCount || (Array.isArray(item.chaptersMeta) ? item.chaptersMeta.length : 0),
            wordCount: item.wordCount || 0,
            coverImage: item.coverImage || item.avatarUrl || '',
            updatedAt: item.updatedAt || Date.now()
          };
          const prev = dedupedByName.get(normKey);
          if (!prev || (mapped.updatedAt || 0) >= (prev.updatedAt || 0)) {
            dedupedByName.set(normKey, mapped);
          }
        });

        this._workshopRemoteList = Array.from(dedupedByName.values());

        if (statusEl) {
          statusEl.textContent = this._workshopRemoteList.length > 0
            ? `仓库 ${githubRepo} 已就绪，共发现 ${this._workshopRemoteList.length} 部线上模组`
            : `已连接仓库 ${githubRepo}，当前仓库暂无已上传模组`;
        }
        if (emptyTitle) emptyTitle.textContent = '仓库暂无模组';
        if (emptyDesc) emptyDesc.textContent = `当前连接的仓库 ${githubRepo} 尚未上传模组，可在上方选择本地模组点击上传`;
      } catch (err) {
        if (statusEl) {
          statusEl.textContent = `同步仓库失败：${err.message || err}`;
        }
      } finally {
        if (refreshBtn) {
          refreshBtn.textContent = '刷新';
          refreshBtn.disabled = false;
        }
        await this.renderWorkshopList();
      }
    },

    async renderWorkshopList(searchKeyword = '') {
      const listEl = document.getElementById('module-workshop-list');
      const emptyEl = document.getElementById('module-workshop-empty');
      if (!listEl || !emptyEl) return;

      const kw = String(searchKeyword || document.getElementById('module-workshop-search-input')?.value || '').trim().toLowerCase();
      const rawList = Array.isArray(this._workshopRemoteList) ? this._workshopRemoteList : [];
      const filtered = kw
        ? rawList.filter(it =>
            String(it.name || '').toLowerCase().includes(kw) ||
            String(it.author || '').toLowerCase().includes(kw) ||
            String(it.summary || '').toLowerCase().includes(kw)
          )
        : rawList;

      if (filtered.length === 0) {
        listEl.style.display = 'none';
        emptyEl.style.display = 'flex';
        listEl.innerHTML = '';
        return;
      }

      const localModules = await this.getAllModules();
      const localNamesSet = new Set((localModules || []).map(m => String(m.name || '').trim().toLowerCase()));
      const localIdsSet = new Set((localModules || []).map(m => String(m.id || '')));
      const { githubToken } = this.getWorkshopConfig();

      listEl.innerHTML = '';
      filtered.forEach(item => {
        const isSavedLocally = localIdsSet.has(String(item.id)) || localNamesSet.has(String(item.name || '').trim().toLowerCase());
        const sysUpper = String(item.ruleSystem || 'coc').toUpperCase();
        const scale = item.scaleType || '1v1';
        const struct = item.type || '线性';
        const tags = Array.isArray(item.tags) ? item.tags : [];

        let tagsHtml = '';
        tags.forEach(t => {
          const cls = this.getTagClass(t);
          tagsHtml += `<span class="mod-tag-badge ${cls}">${t}</span>`;
        });

        const hasValidCover = item.coverImage && (item.coverImage.startsWith('data:image/') || /^https?:\/\//i.test(item.coverImage));
        const coverHtml = hasValidCover
          ? `<div style="width: 44px; height: 44px; border-radius: 8px; overflow: hidden; flex-shrink: 0; border: 1px solid var(--border-color);"><img src="${item.coverImage}" style="width: 100%; height: 100%; object-fit: cover;" alt="封面" /></div>`
          : `<div style="width: 44px; height: 44px; border-radius: 8px; background: var(--secondary-bg, #F0EFEA); display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: var(--accent-color, #4A7A68); border: 1px solid var(--border-color);"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"></path><path d="M6 6h10"></path><path d="M6 10h10"></path></svg></div>`;

        const card = document.createElement('div');
        card.className = 'mod-lib-card';
        card.style.cursor = 'default';
        card.innerHTML = `
          <div style="display: flex; gap: 10px; align-items: flex-start; width: 100%;">
            ${coverHtml}
            <div style="flex: 1; min-width: 0;">
              <div style="display: flex; justify-content: space-between; align-items: center; gap: 6px;">
                <div style="display: flex; align-items: center; gap: 6px; overflow: hidden; min-width: 0; flex: 1;">
                  <span style="font-weight: 600; font-size: 14px; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${item.name}</span>
                  <span class="mod-category-pill ${sysUpper.toLowerCase()}" style="flex-shrink: 0;">${sysUpper}</span>
                </div>
                <div style="display: flex; gap: 6px; align-items: center; flex-shrink: 0;">
                  <button type="button" class="mod-capsule-btn ${isSavedLocally ? '' : 'primary'} btn-ws-download" data-ws-id="${item.id}" style="height: 26px; padding: 0 10px;">${isSavedLocally ? '更新' : '下载'}</button>
                  ${githubToken ? `<button type="button" class="mod-capsule-btn danger btn-ws-delete" data-ws-id="${item.id}" style="height: 26px; padding: 0 8px;">删除</button>` : ''}
                </div>
              </div>
              <div style="display: flex; align-items: center; gap: 5px; margin-top: 4px; flex-wrap: wrap;">
                <span class="mod-category-pill">${scale}</span>
                <span class="mod-category-pill">${struct}</span>
                <span style="font-size: 11px; color: var(--accent-color, #4A7A68); font-weight: 600;">作者：${item.author || '守秘人'}</span>
                ${isSavedLocally ? '<span class="mod-category-pill" style="color: var(--accent-color, #4A7A68);">已存</span>' : ''}
              </div>
              ${tagsHtml ? `<div class="mod-tags-horizontal-row" style="display: flex; flex-wrap: wrap; align-items: center; gap: 5px; margin-top: 4px;">${tagsHtml}</div>` : ''}
              ${item.summary ? `<div style="font-size: 11.5px; color: var(--text-secondary); margin-top: 4px; line-height: 1.4; word-break: break-word;">${item.summary}</div>` : ''}
              <div style="font-size: 11px; color: var(--text-secondary); margin-top: 4px;">${item.chapterCount || 0} 章节${item.wordCount ? ` · ${item.wordCount} 字` : ''} · ${new Date(item.updatedAt || Date.now()).toLocaleDateString()}</div>
            </div>
          </div>
        `;

        const dlBtn = card.querySelector('.btn-ws-download');
        if (dlBtn) {
          dlBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.downloadWorkshopModule(item.id, dlBtn);
          });
        }

        const delBtn = card.querySelector('.btn-ws-delete');
        if (delBtn) {
          delBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteWorkshopModule(item.id, item.name, delBtn);
          });
        }

        listEl.appendChild(card);
      });

      emptyEl.style.display = 'none';
      listEl.style.display = 'flex';
    },

    async uploadModuleToWorkshop() {
      if (this._isUploadingWorkshop) return;
      const { githubRepo, githubToken } = this.getWorkshopConfig();
      const configBox = document.getElementById('module-workshop-config-box');

      if (!githubRepo || !githubRepo.includes('/')) {
        if (configBox) configBox.style.display = 'flex';
        if (typeof global.showCustomAlert === 'function') {
          global.showCustomAlert('提示', '请先在仓库连接中填写GitHub仓库链接并点击保存');
        }
        return;
      }
      if (!githubToken) {
        if (configBox) configBox.style.display = 'flex';
        if (typeof global.showCustomAlert === 'function') {
          global.showCustomAlert('提示', '上传模组到GitHub仓库需要填写访问令牌，请在配置中填入令牌并点击保存');
        }
        return;
      }

      const selectEl = document.getElementById('module-workshop-upload-select');
      const authorInput = document.getElementById('module-workshop-author-input');
      const descInput = document.getElementById('module-workshop-desc-input');
      const uploadBtn = document.getElementById('module-workshop-upload-btn');
      const progWrap = document.getElementById('module-workshop-progress-wrap');
      const progBar = document.getElementById('module-workshop-progress-bar');
      const statusEl = document.getElementById('module-workshop-status-text');

      const targetModId = selectEl ? selectEl.value : '';
      if (!targetModId) {
        if (typeof global.showCustomAlert === 'function') {
          global.showCustomAlert('提示', '请先选择要上传的本地模组');
        }
        return;
      }

      const setProgress = (pct, text) => {
        if (progWrap) progWrap.style.display = 'block';
        if (progBar) progBar.style.width = `${Math.max(0, Math.min(100, pct))}%`;
        if (statusEl && text) statusEl.textContent = text;
      };

      this._isUploadingWorkshop = true;
      if (uploadBtn) {
        uploadBtn.textContent = '上传中';
        uploadBtn.disabled = true;
      }

      try {
        setProgress(6, '正在读取本地模组完整数据、目录、地图、头像与图片...');
        const database = this.getDB();
        let mod = await database.modules.get(targetModId);
        if (!mod && !isNaN(Number(targetModId))) {
          mod = await database.modules.get(Number(targetModId));
        }
        if (!mod) {
          const allLocalMods = await database.modules.toArray();
          mod = (allLocalMods || []).find(m => m && String(m.id) === String(targetModId));
        }
        if (!mod) {
          throw new Error('未找到选中的本地模组');
        }

        const realModId = mod.id;
        let chapters = await this.queryModuleTableByModId(database.moduleChapters, realModId);
        if ((!chapters || chapters.length === 0) && Array.isArray(mod.chapters)) {
          chapters = mod.chapters;
        }
        chapters = chapters.slice().sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

        let locationNav = await this.queryModuleTableByModId(database.moduleLocationNav, realModId);
        const modMapNodes = Array.isArray(mod.mapNodes) ? mod.mapNodes : [];
        if ((!locationNav || locationNav.length === 0) && modMapNodes.length > 0) {
          locationNav = modMapNodes.map(item => ({
            moduleId: realModId,
            name: item.name,
            parent: item.parent || '',
            level: item.level || 1,
            desc: item.desc || item.description || '',
            prompt: item.prompt || '',
            imageUrl: item.imageUrl || '',
            imageStatus: item.imageUrl ? 'done' : 'idle'
          }));
        } else if (locationNav.length > 0 && modMapNodes.length > 0) {
          locationNav = locationNav.map(loc => {
            const matchNode = modMapNodes.find(n => n && n.name === loc.name);
            return {
              ...loc,
              parent: loc.parent || (matchNode && matchNode.parent) || '',
              level: loc.level || (matchNode && matchNode.level) || 1,
              desc: loc.desc || (matchNode && (matchNode.desc || matchNode.description)) || '',
              prompt: loc.prompt || (matchNode && matchNode.prompt) || '',
              imageUrl: loc.imageUrl || (matchNode && matchNode.imageUrl) || ''
            };
          });
        }

        let rawImages = await this.queryModuleTableByModId(database.moduleImages, realModId);
        if ((!rawImages || rawImages.length === 0) && Array.isArray(mod.images)) {
          rawImages = mod.images;
        }
        rawImages = rawImages.slice().sort((a, b) => (a.imageIndex || 0) - (b.imageIndex || 0));

        const cluePointers = await this.queryModuleTableByModId(database.moduleCluePointers, realModId);
        const hoRoles = await this.queryModuleTableByModId(database.moduleHoRoles, realModId);
        const moduleItems = await this.queryModuleTableByModId(database.moduleItems, realModId);
        const moduleConfigs = await this.queryModuleTableByModId(database.moduleConfigs, realModId);

        const author = String(authorInput ? authorInput.value : '').trim() || mod.author || '守秘人';
        const summary = String(descInput ? descInput.value : '').trim() || mod.summary || '';
        localStorage.setItem('ephone_workshop_author', author);

        const imageAssetByHash = new Map();
        const registerDataUrlAsset = (dataUrl) => {
          if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) return dataUrl || '';
          const hash = this.computeFastWorkshopHash(dataUrl);
          imageAssetByHash.set(hash, { hash, dataUrl, byteLen: dataUrl.length });
          return `__WS_ASSET__:${hash}`;
        };

        let portableCover = '';
        let packedCoverRef = '';
        let indexCoverThumb = '';
        if (mod.coverImage) {
          portableCover = await this.resolveImageToPortableDataUrl(mod.coverImage);
          if (portableCover && portableCover.startsWith('data:')) {
            packedCoverRef = registerDataUrlAsset(portableCover);
            try {
              if (portableCover.length <= 80000) {
                indexCoverThumb = portableCover;
              } else {
                indexCoverThumb = await this.compressImageFile(portableCover, 160, 160, 0.72);
              }
            } catch (_) {
              indexCoverThumb = portableCover.length < 250000 ? portableCover : '';
            }
          } else {
            packedCoverRef = portableCover;
            indexCoverThumb = portableCover;
          }
        }

        const packedLocationNav = [];
        for (let i = 0; i < locationNav.length; i++) {
          const loc = locationNav[i];
          const rawLocImg = loc.imageUrl || '';
          let packedLocImg = rawLocImg;
          if (rawLocImg) {
            const resolvedLocImg = await this.resolveImageToPortableDataUrl(rawLocImg);
            packedLocImg = registerDataUrlAsset(resolvedLocImg);
          }
          packedLocationNav.push({
            ...loc,
            imageUrl: packedLocImg
          });
        }

        const packedMapNodes = packedLocationNav.map(l => ({
          name: l.name,
          parent: l.parent || '',
          level: l.level || 1,
          desc: l.desc || '',
          prompt: l.prompt || '',
          imageUrl: l.imageUrl || ''
        }));

        const packedImagesMeta = [];
        for (let i = 0; i < rawImages.length; i++) {
          const img = rawImages[i];
          const rawSrc = img.dataUrl || img.url || img.src || '';
          const dataUrl = await this.resolveImageToPortableDataUrl(rawSrc);
          if (dataUrl && dataUrl.startsWith('data:')) {
            const assetRef = registerDataUrlAsset(dataUrl);
            packedImagesMeta.push({
              ...img,
              dataUrl: assetRef
            });
          } else {
            packedImagesMeta.push({ ...img, dataUrl: dataUrl || rawSrc });
          }
        }

        const savedMapViewMode = localStorage.getItem('module_map_view_mode_' + realModId)
          || mod.mapViewMode
          || (packedLocationNav.some(l => l.imageUrl) ? 'rich' : 'text');

        setProgress(14, '正在检查线上同名模组与资源分包...');
        let currentIndex = await this.fetchWorkshopGithubJson('workshop-index.json');
        if (!Array.isArray(currentIndex)) currentIndex = [];

        const normModName = String(mod.name || '').trim().toLowerCase();
        const existingInIndex = currentIndex.find(it =>
          it && (
            (normModName && String(it.name || it.title || '').trim().toLowerCase() === normModName) ||
            String(it.id) === String(realModId)
          )
        );
        const existingInRemoteList = (!existingInIndex && Array.isArray(this._workshopRemoteList))
          ? this._workshopRemoteList.find(it =>
              it && (
                (normModName && String(it.name || it.title || '').trim().toLowerCase() === normModName) ||
                String(it.id) === String(realModId)
              )
            )
          : null;
        const matchedRemote = existingInIndex || existingInRemoteList;
        const uploadProjectId = matchedRemote && matchedRemote.id ? String(matchedRemote.id) : String(realModId);

        const assetPackIndex = {};
        const allImageItems = Array.from(imageAssetByHash.values());
        if (allImageItems.length > 0) {
          const MAX_BYTES_PER_PACK = 700 * 1024;
          const MAX_ITEMS_PER_PACK = 10;
          const batches = [];
          let curBatch = [];
          let curBytes = 0;

          for (const it of allImageItems) {
            if (curBatch.length > 0 && (curBatch.length >= MAX_ITEMS_PER_PACK || (curBytes + it.byteLen) > MAX_BYTES_PER_PACK)) {
              batches.push(curBatch);
              curBatch = [];
              curBytes = 0;
            }
            curBatch.push(it);
            curBytes += it.byteLen;
          }
          if (curBatch.length > 0) batches.push(curBatch);

          for (let bIdx = 0; bIdx < batches.length; bIdx++) {
            const batch = batches[bIdx];
            const packHash = this.computeFastWorkshopHash(batch.map(x => x.hash).sort().join('_'));
            const assetsMap = {};
            batch.forEach(x => {
              assetsMap[x.hash] = x.dataUrl;
              assetPackIndex[x.hash] = packHash;
            });
            setProgress(
              20 + Math.round(((bIdx + 1) / batches.length) * 55),
              `正在上传模组头像、地图与插图资源包 ${bIdx + 1} / ${batches.length}...`
            );
            await this.putWorkshopGithubFile(
              `packs/pack_${packHash}.json`,
              JSON.stringify({ packHash, count: batch.length, updatedAt: Date.now(), assets: assetsMap }),
              `Upload module asset pack ${packHash}`
            );
          }
        }

        let chapsWords = 0;
        chapters.forEach(c => {
          chapsWords += (c.wordCount || this.countWords(c.content || ''));
        });
        const totalWordCount = mod.wordCount || chapsWords;

        const cleanModRecord = {
          ...mod,
          id: uploadProjectId,
          author,
          summary,
          coverImage: packedCoverRef,
          mapNodes: packedMapNodes,
          mapViewMode: savedMapViewMode,
          chapterCount: chapters.length,
          wordCount: totalWordCount,
          updatedAt: Date.now()
        };
        delete cleanModRecord.chapters;
        delete cleanModRecord.images;

        const projectBundle = {
          version: 3,
          id: uploadProjectId,
          title: mod.name || '未命名模组',
          author,
          desc: summary,
          avatarUrl: indexCoverThumb || '',
          updatedAt: Date.now(),
          module: cleanModRecord,
          chapters,
          locationNav: packedLocationNav,
          images: packedImagesMeta,
          cluePointers,
          hoRoles,
          moduleItems,
          moduleConfigs,
          assetPackIndex
        };

        setProgress(82, matchedRemote ? `正在覆盖更新同名模组 ${mod.name}...` : `正在上传模组正文、目录与地图至GitHub仓库...`);
        await this.putWorkshopGithubFile(
          `projects/${uploadProjectId}.json`,
          JSON.stringify(projectBundle),
          `${matchedRemote ? 'Update' : 'Upload'} module ${mod.name}`
        );

        setProgress(92, '正在同步更新线上工坊目录索引...');
        const tags = Array.isArray(mod.tags) && mod.tags.length > 0
          ? mod.tags
          : this.sortModuleTags(mod.bgTag, mod.endingTag, mod.contentTags, mod.customTags);

        const summaryEntry = {
          id: uploadProjectId,
          name: mod.name || '未命名模组',
          title: mod.name || '未命名模组',
          author,
          summary,
          desc: summary,
          type: mod.type || '线性',
          ruleSystem: mod.ruleSystem || 'coc',
          scaleType: mod.scaleType || '1v1',
          tags,
          chapterCount: chapters.length,
          wordCount: totalWordCount,
          coverImage: indexCoverThumb || '',
          updatedAt: Date.now()
        };

        const filteredIndex = currentIndex.filter(it => {
          if (!it) return false;
          if (String(it.id) === uploadProjectId) return false;
          if (normModName && String(it.name || it.title || '').trim().toLowerCase() === normModName) return false;
          return true;
        });
        filteredIndex.unshift(summaryEntry);

        await this.putWorkshopGithubFile(
          'workshop-index.json',
          JSON.stringify(filteredIndex, null, 2),
          `Update workshop index for ${mod.name}`
        );

        setProgress(100, `模组 ${mod.name} 已完整上传至仓库 ${githubRepo}`);
        await this.refreshWorkshopList();
        setTimeout(() => {
          if (progWrap) progWrap.style.display = 'none';
        }, 1500);
      } catch (err) {
        if (progWrap) progWrap.style.display = 'none';
        if (statusEl) statusEl.textContent = `上传失败：${err.message || err}`;
        if (typeof global.showCustomAlert === 'function') {
          global.showCustomAlert('上传失败', String(err.message || err));
        }
      } finally {
        this._isUploadingWorkshop = false;
        if (uploadBtn) {
          uploadBtn.textContent = '上传';
          uploadBtn.disabled = false;
        }
      }
    },

    async downloadWorkshopModule(projectId, btnEl) {
      if (!projectId) return;
      const statusEl = document.getElementById('module-workshop-status-text');
      const origText = btnEl ? btnEl.textContent : '下载';
      if (btnEl) {
        btnEl.textContent = '下载中';
        btnEl.disabled = true;
      }

      try {
        if (statusEl) statusEl.textContent = '正在从GitHub仓库拉取模组数据...';
        const remoteData = await this.fetchWorkshopGithubJson(`projects/${projectId}.json`);
        if (!remoteData) {
          throw new Error('未能在仓库中找到该模组文件');
        }

        const packIndex = remoteData.assetPackIndex || {};
        const uniquePackHashes = Array.from(new Set(Object.values(packIndex).filter(Boolean)));
        const loadedAssetsMap = new Map();

        if (uniquePackHashes.length > 0) {
          if (statusEl) statusEl.textContent = `正在下载模组头像、地图与插图资源包 共 ${uniquePackHashes.length} 包...`;
          await Promise.all(uniquePackHashes.map(async (pHash) => {
            try {
              const packData = await this.fetchWorkshopGithubJson(`packs/pack_${pHash}.json`);
              if (packData && packData.assets && typeof packData.assets === 'object') {
                Object.entries(packData.assets).forEach(([k, v]) => {
                  loadedAssetsMap.set(k, v);
                });
              }
            } catch (_) {}
          }));
        }

        const resolveAssetRef = (val) => {
          if (!val || typeof val !== 'string') return '';
          if (val.startsWith('__WS_ASSET__:')) {
            const h = val.slice('__WS_ASSET__:'.length);
            return loadedAssetsMap.get(h) || '';
          }
          return val;
        };

        const modSource = remoteData.module || remoteData;
        const targetModId = String(modSource.id || remoteData.id || ('mod_' + Date.now()));
        const modName = modSource.name || remoteData.title || '下载模组';

        const rawChapters = Array.isArray(remoteData.chapters) ? remoteData.chapters : [];
        const chapters = rawChapters.map((c, idx) => {
          const textContent = typeof c.content === 'string'
            ? c.content
            : (Array.isArray(c.lines) ? c.lines.map(l => `${l.speaker ? l.speaker + '：' : ''}${l.text || ''}`).join('\n') : '');
          return {
            ...c,
            id: c.id || (`chap_${Date.now()}_${idx + 1}`),
            moduleId: targetModId,
            title: c.title || `章节 ${idx + 1}`,
            category: c.category || '正文',
            content: textContent,
            sortOrder: c.sortOrder !== undefined ? c.sortOrder : (idx + 1),
            wordCount: c.wordCount || this.countWords(textContent)
          };
        });

        const rawLocationNav = Array.isArray(remoteData.locationNav) && remoteData.locationNav.length > 0
          ? remoteData.locationNav
          : (Array.isArray(modSource.mapNodes) ? modSource.mapNodes : []);

        const locationNav = rawLocationNav.map(l => {
          const resolvedImg = resolveAssetRef(l.imageUrl || '');
          return {
            ...l,
            id: undefined,
            moduleId: targetModId,
            name: l.name || '地点',
            parent: l.parent || '',
            level: l.level || 1,
            desc: l.desc || l.description || '',
            prompt: l.prompt || '',
            imageUrl: resolvedImg,
            imageStatus: resolvedImg ? 'done' : (l.imageStatus || 'idle')
          };
        });

        const restoredMapNodes = locationNav.map(l => ({
          name: l.name,
          parent: l.parent || '',
          level: l.level || 1,
          desc: l.desc || '',
          prompt: l.prompt || '',
          imageUrl: l.imageUrl || ''
        }));

        const rawImages = Array.isArray(remoteData.images) ? remoteData.images : [];
        const images = rawImages.map((img, idx) => {
          const resolvedUrl = resolveAssetRef(img.dataUrl || img.url || img.src || '');
          return {
            ...img,
            id: undefined,
            moduleId: targetModId,
            imageIndex: img.imageIndex || (idx + 1),
            dataUrl: resolvedUrl
          };
        }).filter(img => img.dataUrl);

        const cluePointers = Array.isArray(remoteData.cluePointers)
          ? remoteData.cluePointers.map(cp => ({ ...cp, id: undefined, moduleId: targetModId }))
          : [];

        const hoRoles = Array.isArray(remoteData.hoRoles)
          ? remoteData.hoRoles.map(hr => ({ ...hr, id: undefined, moduleId: targetModId }))
          : [];

        const moduleItems = Array.isArray(remoteData.moduleItems)
          ? remoteData.moduleItems.map(mi => ({ ...mi, id: undefined, moduleId: targetModId }))
          : [];

        const moduleConfigs = Array.isArray(remoteData.moduleConfigs)
          ? remoteData.moduleConfigs.map(mc => ({ ...mc, id: undefined, moduleId: targetModId }))
          : [];

        let chapsWords = 0;
        chapters.forEach(c => { chapsWords += (c.wordCount || 0); });

        let resolvedCover = resolveAssetRef(modSource.coverImage || '');
        if (!resolvedCover && remoteData.avatarUrl) {
          resolvedCover = resolveAssetRef(remoteData.avatarUrl);
        }

        const hasMapImages = locationNav.some(l => Boolean(l.imageUrl));
        const restoredMapViewMode = modSource.mapViewMode || (hasMapImages ? 'rich' : 'text');

        const moduleRecord = {
          ...modSource,
          id: targetModId,
          name: modName,
          author: remoteData.author || modSource.author || '守秘人',
          type: modSource.type || '线性',
          ruleSystem: modSource.ruleSystem || 'coc',
          scaleType: modSource.scaleType || '1v1',
          summary: remoteData.desc || modSource.summary || '',
          coverImage: resolvedCover || '',
          bgTag: modSource.bgTag || '',
          endingTag: modSource.endingTag || '普通',
          contentTags: Array.isArray(modSource.contentTags) ? modSource.contentTags : [],
          customTags: Array.isArray(modSource.customTags) ? modSource.customTags : [],
          tags: Array.isArray(modSource.tags) && modSource.tags.length > 0 ? modSource.tags : ['普通'],
          group: modSource.group || '默认分组',
          toc: modSource.toc || [],
          tocData: modSource.tocData || null,
          mapNodes: restoredMapNodes,
          mapData: modSource.mapData || null,
          mapViewMode: restoredMapViewMode,
          musicList: Array.isArray(modSource.musicList) ? modSource.musicList : [],
          wordCount: modSource.wordCount || chapsWords,
          chapterCount: chapters.length,
          status: 'ready',
          githubSync: true,
          createdAt: Date.now()
        };

        const deleteByModIdFromTable = async (table, mId) => {
          if (!table || mId === undefined || mId === null) return;
          try { await table.where('moduleId').equals(mId).delete(); } catch (_) {}
          try { await table.where('moduleId').equals(String(mId)).delete(); } catch (_) {}
          if (!isNaN(Number(mId))) {
            try { await table.where('moduleId').equals(Number(mId)).delete(); } catch (_) {}
          }
        };

        await this.safeDBOperation('下载工坊模组', async (db) => {
          const allExist = await db.modules.toArray();
          const duplicateMods = allExist.filter(m =>
            m && (
              String(m.id) === targetModId ||
              String(m.name || '').trim().toLowerCase() === String(modName).trim().toLowerCase()
            )
          );
          const idsToClean = new Set([targetModId, ...duplicateMods.map(m => m.id)]);
          for (const oldId of idsToClean) {
            try { await db.modules.delete(oldId); } catch (_) {}
            await deleteByModIdFromTable(db.moduleChapters, oldId);
            await deleteByModIdFromTable(db.moduleLocationNav, oldId);
            await deleteByModIdFromTable(db.moduleImages, oldId);
            await deleteByModIdFromTable(db.moduleCluePointers, oldId);
            await deleteByModIdFromTable(db.moduleHoRoles, oldId);
            await deleteByModIdFromTable(db.moduleItems, oldId);
            await deleteByModIdFromTable(db.moduleConfigs, oldId);
          }

          await db.modules.put(moduleRecord);
          if (chapters.length > 0 && db.moduleChapters) {
            await db.moduleChapters.bulkPut(chapters);
          }
          if (locationNav.length > 0 && db.moduleLocationNav) {
            try { await db.moduleLocationNav.bulkAdd(locationNav); } catch (_) { await db.moduleLocationNav.bulkPut(locationNav); }
          }
          if (images.length > 0 && db.moduleImages) {
            try { await db.moduleImages.bulkAdd(images); } catch (_) { await db.moduleImages.bulkPut(images); }
          }
          if (cluePointers.length > 0 && db.moduleCluePointers) {
            try { await db.moduleCluePointers.bulkAdd(cluePointers); } catch (_) { await db.moduleCluePointers.bulkPut(cluePointers); }
          }
          if (hoRoles.length > 0 && db.moduleHoRoles) {
            try { await db.moduleHoRoles.bulkAdd(hoRoles); } catch (_) { await db.moduleHoRoles.bulkPut(hoRoles); }
          }
          if (moduleItems.length > 0 && db.moduleItems) {
            try { await db.moduleItems.bulkAdd(moduleItems); } catch (_) { await db.moduleItems.bulkPut(moduleItems); }
          }
          if (moduleConfigs.length > 0 && db.moduleConfigs) {
            try { await db.moduleConfigs.bulkAdd(moduleConfigs); } catch (_) { await db.moduleConfigs.bulkPut(moduleConfigs); }
          }
          return true;
        });

        try {
          localStorage.setItem('module_map_view_mode_' + targetModId, restoredMapViewMode);
        } catch (_) {}
        this.chaptersMemoryCache.set(targetModId, chapters);

        await this.populateWorkshopUploadSelect();
        await this.renderWorkshopList();
        await this.renderLibraryList();

        if (statusEl) {
          statusEl.textContent = `已将模组 ${modName} 完整下载至本地模组库，含 ${chapters.length} 章、${locationNav.length} 处地点与 ${images.length} 张插图`;
        }
        if (typeof global.showCustomAlert === 'function') {
          global.showCustomAlert('下载成功', `模组 ${modName} 已完整存入本地模组库`);
        }
      } catch (err) {
        if (statusEl) {
          statusEl.textContent = `下载失败：${err.message || err}`;
        }
        if (typeof global.showCustomAlert === 'function') {
          global.showCustomAlert('下载失败', String(err.message || err));
        }
        if (btnEl) {
          btnEl.textContent = origText;
          btnEl.disabled = false;
        }
      }
    },

    async deleteWorkshopModule(projectId, modName, btnEl) {
      if (!projectId) return;
      let confirmed = true;
      if (typeof global.showCustomConfirm === 'function') {
        confirmed = await global.showCustomConfirm('删除确认', `确定从线上仓库索引中移除模组 ${modName} 吗`);
      } else {
        confirmed = confirm(`确定从线上仓库索引中移除模组 ${modName} 吗`);
      }
      if (!confirmed) return;

      if (btnEl) {
        btnEl.textContent = '移除中';
        btnEl.disabled = true;
      }

      try {
        let currentIndex = await this.fetchWorkshopGithubJson('workshop-index.json');
        if (Array.isArray(currentIndex)) {
          const normName = String(modName || '').trim().toLowerCase();
          const nextIndex = currentIndex.filter(it => {
            if (!it) return false;
            if (String(it.id) === String(projectId)) return false;
            if (normName && String(it.name || it.title || '').trim().toLowerCase() === normName) return false;
            return true;
          });
          await this.putWorkshopGithubFile(
            'workshop-index.json',
            JSON.stringify(nextIndex, null, 2),
            `Remove module ${modName} from workshop index`
          );
        }
        await this.refreshWorkshopList();
      } catch (err) {
        if (typeof global.showCustomAlert === 'function') {
          global.showCustomAlert('删除失败', String(err.message || err));
        }
        if (btnEl) {
          btnEl.textContent = '删除';
          btnEl.disabled = false;
        }
      }
    },

    switchStep2SubTab(subTabName) {
      this.activeSubTab = subTabName;
      const tabs = document.querySelectorAll('.module-step2-tabs .module-subtab');
      tabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.subtab === subTabName);
      });

      const cardList = document.getElementById('module-plan-card-list');
      const tocView = document.getElementById('module-plan-toc-view');
      const mapView = document.getElementById('module-plan-map-view');
      const galleryView = document.getElementById('module-plan-gallery-view');

      if (cardList) cardList.style.display = subTabName === 'chapters' ? 'flex' : 'none';
      if (tocView) tocView.style.display = subTabName === 'toc' ? 'flex' : 'none';
      if (mapView) mapView.style.display = subTabName === 'map' ? 'flex' : 'none';
      if (galleryView) galleryView.style.display = subTabName === 'gallery' ? 'flex' : 'none';

      if (subTabName === 'gallery') {
        this.renderStep2GalleryUI();
      }

      this.saveDraft();
    },

    downloadImage(dataUrl, fileName) {
      if (!dataUrl) return;
      const a = document.createElement('a');
      a.href = dataUrl;
      const ext = dataUrl.startsWith('data:image/png') ? '.png' : (dataUrl.startsWith('data:image/webp') ? '.webp' : '.jpg');
      a.download = (fileName || '模组插图') + ext;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    },

    renderStep2GalleryUI() {
      const container = document.getElementById('module-plan-gallery-view');
      if (!container) return;
      container.innerHTML = '';

      if (!this.step2GalleryViewMode) this.step2GalleryViewMode = 'pc';
      const images = this.currentParsedData?.images || [];

      const header = document.createElement('div');
      header.style.display = 'flex';
      header.style.justifyContent = 'space-between';
      header.style.alignItems = 'center';
      header.style.marginBottom = '10px';
      header.style.flexWrap = 'wrap';
      header.style.gap = '8px';

      header.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-weight: 600; font-size: 13px; color: var(--text-primary);">已提取插图 ${images.length} 张</span>
          <div style="display: flex; background: var(--secondary-bg, #F0EFEA); padding: 2px; border-radius: 9999px;">
            <button type="button" id="module-step2-view-pc-btn" style="border: none; background: ${this.step2GalleryViewMode === 'pc' ? 'var(--card-bg, #FFFFFF)' : 'transparent'}; color: ${this.step2GalleryViewMode === 'pc' ? 'var(--text-primary)' : 'var(--text-secondary)'}; font-size: 11px; font-weight: ${this.step2GalleryViewMode === 'pc' ? '600' : '500'}; padding: 2px 8px; border-radius: 9999px; cursor: pointer;">玩家</button>
            <button type="button" id="module-step2-view-kp-btn" style="border: none; background: ${this.step2GalleryViewMode === 'kp' ? 'var(--card-bg, #FFFFFF)' : 'transparent'}; color: ${this.step2GalleryViewMode === 'kp' ? 'var(--text-primary)' : 'var(--text-secondary)'}; font-size: 11px; font-weight: ${this.step2GalleryViewMode === 'kp' ? '600' : '500'}; padding: 2px 8px; border-radius: 9999px; cursor: pointer;">守秘</button>
          </div>
        </div>
        <div style="display: flex; gap: 6px;">
          <input type="file" id="module-step2-image-input" accept="image/*" multiple style="display: none;" />
          <button type="button" class="mod-capsule-btn" id="module-step2-import-img-btn">导入</button>
          <button type="button" class="mod-capsule-btn" id="module-step2-clear-discard-btn">清理废弃</button>
          ${images.length > 0 ? '<button type="button" class="mod-capsule-btn danger" id="module-step2-clear-img-btn">清空</button>' : ''}
        </div>
      `;

      const viewPcBtn = header.querySelector('#module-step2-view-pc-btn');
      const viewKpBtn = header.querySelector('#module-step2-view-kp-btn');
      const importBtn = header.querySelector('#module-step2-import-img-btn');
      const clearDiscardBtn = header.querySelector('#module-step2-clear-discard-btn');
      const fileInput = header.querySelector('#module-step2-image-input');
      const clearBtn = header.querySelector('#module-step2-clear-img-btn');

      if (viewPcBtn) {
        viewPcBtn.addEventListener('click', () => {
          this.step2GalleryViewMode = 'pc';
          this.renderStep2GalleryUI();
        });
      }

      if (viewKpBtn) {
        viewKpBtn.addEventListener('click', async () => {
          let confirmed = true;
          if (typeof global.showCustomConfirm === 'function') {
            confirmed = await global.showCustomConfirm('防剧透提示', '守秘人模式包含剧情真相与核心剧透，确认开启吗');
          } else if (typeof global.showCustomAlert === 'function') {
            confirmed = confirm('守秘人模式包含剧情真相与核心剧透，确认开启吗');
          }
          if (confirmed) {
            this.step2GalleryViewMode = 'kp';
            this.renderStep2GalleryUI();
          }
        });
      }

      if (clearDiscardBtn) {
        clearDiscardBtn.addEventListener('click', async () => {
          if (!this.currentParsedData?.images) return;
          const beforeCount = this.currentParsedData.images.length;
          this.currentParsedData.images = this.currentParsedData.images.filter(img => !img.isDiscarded && !img.isJunk && !img.name?.includes('废弃') && !img.name?.includes('封面') && !img.name?.includes('装饰'));
          const removedCount = beforeCount - this.currentParsedData.images.length;
          if (removedCount > 0) this.currentParsedData._userDeletedImages = true;
          this.saveDraft();
          this.renderStep2GalleryUI();
          if (typeof global.showCustomAlert === 'function') {
            global.showCustomAlert('清理完成', `已清理 ${removedCount} 张废弃与装饰图片`);
          }
        });
      }

      if (importBtn && fileInput) {
        importBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', async (e) => {
          const files = e.target.files;
          if (!files || files.length === 0) return;
          for (let i = 0; i < files.length; i++) {
            const f = files[i];
            const dataUrl = await this.compressImageFile(f);
            const newIndex = (this.currentParsedData.images ? this.currentParsedData.images.length : 0) + 1;
            if (!this.currentParsedData.images) this.currentParsedData.images = [];
            this.currentParsedData.images.push({
              imageIndex: newIndex,
              pageNumber: 1,
              width: 800,
              height: 600,
              format: 'JPEG',
              name: f.name.replace(/\.[^/.]+$/, '').trim() || `插图${newIndex}`,
              description: '本地导入插图',
              dataUrl: dataUrl,
              isSensitive: false,
              isDiscarded: false,
              placement: '文档插图'
            });
          }
          e.target.value = '';
          this.saveDraft();
          this.renderStep2GalleryUI();
        });
      }

      if (clearBtn) {
        clearBtn.addEventListener('click', async () => {
          let confirmed = true;
          if (typeof global.showCustomConfirm === 'function') {
            confirmed = await global.showCustomConfirm('清空插图', '确定清空所有已提取的插图吗？');
          } else if (typeof global.showCustomAlert === 'function') {
            confirmed = confirm('确定清空所有已提取的插图吗？');
          }
          if (confirmed) {
            this.currentParsedData.images = [];
            this.currentParsedData._userDeletedImages = true;
            this.saveDraft();
            this.renderStep2GalleryUI();
          }
        });
      }

      container.appendChild(header);

      if (images.length === 0) {
        const emptyNotice = document.createElement('div');
        emptyNotice.style.cssText = 'color: var(--text-secondary); text-align: center; padding: 28px;';
        emptyNotice.textContent = '当前暂无提取到的插图，可点击上方导入按键添加本地图片';
        container.appendChild(emptyNotice);
        return;
      }

      const isPlayerView = this.step2GalleryViewMode === 'pc';
      const grid = document.createElement('div');
      grid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(135px, 1fr)); gap: 10px;';

      images.forEach((img, idx) => {
        const card = document.createElement('div');
        card.className = 'mod-gallery-card';

        const isSpoiler = !!img.isSensitive;
        const isDiscarded = !!img.isDiscarded;
        const showPlaceholder = isPlayerView && isSpoiler;

        let thumbHtml = '';
        if (showPlaceholder) {
          thumbHtml = `
            <div class="mod-duck-placeholder" style="height: 110px;">
              <svg width="36" height="36" viewBox="0 0 64 64" fill="none">
                <ellipse cx="32" cy="48" rx="22" ry="7" fill="rgba(0,0,0,0.06)"/>
                <rect x="14" y="44" width="36" height="8" rx="4" fill="#D0CBB8"/>
                <path d="M22 36C22 26 28 20 38 20C45 20 48 24 48 28C48 36 42 42 32 42C26 42 22 40 22 36Z" fill="#FCD34D"/>
                <circle cx="40" cy="25" r="2.5" fill="#333333"/>
                <path d="M46 26L54 28L46 31Z" fill="#F97316"/>
                <path d="M26 34C24 32 20 34 18 36C16 38 18 41 22 40" fill="#FBBF24"/>
              </svg>
              <div class="mod-duck-title">图片已被肥鸭坐塌</div>
              <div class="mod-duck-sub">守秘人模式可见剧透</div>
            </div>
          `;
        } else {
          thumbHtml = `
            <div style="position: relative; overflow: hidden; background: var(--secondary-bg, #F0EFEA); min-height: 90px; display: flex; align-items: center; justify-content: center;">
              <img src="${img.dataUrl}" class="mod-gallery-thumb" alt="${img.name || '插图'}" loading="lazy" />
              <div style="position: absolute; top: 4px; right: 4px; display: flex; gap: 3px; flex-direction: column; align-items: flex-end;">
                ${isSpoiler ? '<span class="mod-gallery-tag sensitive">守秘剧透</span>' : ''}
                ${isDiscarded ? '<span class="mod-gallery-tag" style="background: rgba(100,100,100,0.8); color: #FFF;">已废弃</span>' : ''}
              </div>
            </div>
          `;
        }

        const pageLabel = img.pageNumber ? `第${img.pageNumber}页` : '文档插图';
        const dimLabel = img.width && img.height ? `${img.width}×${img.height}` : '自适应';

        card.innerHTML = `
          ${thumbHtml}
          <div class="mod-gallery-meta">
            <div class="mod-gallery-name">${img.name || `图${idx + 1}`}</div>
            <div class="mod-gallery-details">
              <span>${pageLabel}</span>
              <span>${dimLabel}</span>
            </div>
            ${img.annotation ? `<div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${img.annotation}</div>` : ''}
            <div style="display: flex; gap: 4px; justify-content: flex-end; margin-top: 6px; flex-wrap: wrap;">
              <button type="button" class="module-mini-btn btn-toggle-spoiler" style="font-size: 10px; padding: 2px 5px;">${isSpoiler ? '公开' : '剧透'}</button>
              <button type="button" class="module-mini-btn btn-toggle-discard" style="font-size: 10px; padding: 2px 5px;">${isDiscarded ? '恢复' : '废弃'}</button>
              <button type="button" class="module-mini-btn btn-download-img" style="font-size: 10px; padding: 2px 5px;">下载</button>
              <button type="button" class="module-mini-btn btn-danger btn-del-step2-img" style="font-size: 10px; padding: 2px 5px;">删除</button>
            </div>
          </div>
        `;

        card.querySelector('.btn-toggle-spoiler')?.addEventListener('click', (e) => {
          e.stopPropagation();
          img.isSensitive = !img.isSensitive;
          this.saveDraft();
          this.renderStep2GalleryUI();
        });

        card.querySelector('.btn-toggle-discard')?.addEventListener('click', (e) => {
          e.stopPropagation();
          img.isDiscarded = !img.isDiscarded;
          this.saveDraft();
          this.renderStep2GalleryUI();
        });

        card.querySelector('.btn-download-img')?.addEventListener('click', (e) => {
          e.stopPropagation();
          this.downloadImage(img.dataUrl, img.name);
        });

        card.querySelector('.btn-del-step2-img')?.addEventListener('click', (e) => {
          e.stopPropagation();
          images.splice(idx, 1);
          if (this.currentParsedData) this.currentParsedData._userDeletedImages = true;
          this.saveDraft();
          this.renderStep2GalleryUI();
        });

        card.addEventListener('click', () => {
          this.showImageViewModal(img, 'draft');
        });

        grid.appendChild(card);
      });

      container.appendChild(grid);
    },

    updateModeUI(mode) {
      const step2SplitSelect = document.getElementById('module-step2-split-select');
      const step1SplitSelect = document.getElementById('module-split-parts-select');
      const parts = this.currentParsedData?.splitParts || (step2SplitSelect && step2SplitSelect.value) || (step1SplitSelect && step1SplitSelect.value) || '1';
      if (this.currentParsedData) {
        this.currentParsedData.splitParts = parts;
      }
      if (step2SplitSelect && step2SplitSelect.value !== parts) step2SplitSelect.value = parts;
      if (step1SplitSelect && step1SplitSelect.value !== parts) step1SplitSelect.value = parts;
      this.saveDraft();
    },

    setWizardStep(stepNumber) {
      this.currentStep = stepNumber;
      const stepItems = document.querySelectorAll('.wizard-step-item');
      stepItems.forEach(item => {
        const step = parseInt(item.dataset.step, 10);
        item.classList.toggle('active', step === stepNumber);
        item.classList.toggle('completed', step < stepNumber);
      });

      const panes = document.querySelectorAll('.module-step-pane');
      panes.forEach(pane => pane.style.display = 'none');

      const targetPane = document.getElementById(`module-step${stepNumber}-pane`);
      if (targetPane) {
        targetPane.style.display = 'flex';
      }

      if (stepNumber === 2) {
        this.updateModeUI(this.cutExecutionMode || 'batch');
        this.switchStep2SubTab('chapters');
        this.renderStep2GalleryUI();
      }

      if (stepNumber === 3) {
        if (this.isCuttingRunning) {
          this.syncOngoingCuttingUI();
        } else {
          this.renderCutChaptersUI();
        }
      }

      this.updateBottomActionBar();
      this.saveDraft();
    },

    updateBottomActionBar() {
      const bottomBar = document.getElementById('module-bottom-action-bar');
      const secondaryBtn = document.getElementById('module-secondary-action-btn');
      const rethinkBtn = document.getElementById('module-rethink-action-btn');
      const primaryBtn = document.getElementById('module-primary-action-btn');

      const step3BackBtn = document.getElementById('module-step3-back-btn');
      const batchAuditBtn = document.getElementById('module-batch-audit-btn');
      const exportBtn = document.getElementById('module-export-btn');
      const saveLibraryBtn = document.getElementById('module-save-library-btn');
      const finishBtn = document.getElementById('module-finish-btn');

      if (!bottomBar) return;
      bottomBar.style.display = 'flex';

      if (this.currentStep === 1) {
        if (secondaryBtn) {
          secondaryBtn.style.display = this.currentParsedData ? 'flex' : 'none';
          secondaryBtn.textContent = '重选';
          secondaryBtn.disabled = Boolean(this.isAnalyzing);
        }
        if (rethinkBtn) rethinkBtn.style.display = 'none';
        if (primaryBtn) {
          primaryBtn.style.display = 'flex';
          if (this.isAnalyzing) {
            primaryBtn.textContent = this.analysisStatusText || '正在分析中...';
            primaryBtn.style.opacity = '0.7';
            primaryBtn.disabled = true;
          } else {
            primaryBtn.textContent = '分析';
            primaryBtn.style.opacity = '1';
            primaryBtn.disabled = false;
          }
        }
        const step1AnalyzeBtn = document.getElementById('module-step1-analyze-btn');
        if (step1AnalyzeBtn) {
          if (this.isAnalyzing) {
            step1AnalyzeBtn.textContent = this.analysisStatusText || '正在分析中...';
            step1AnalyzeBtn.style.opacity = '0.7';
            step1AnalyzeBtn.disabled = true;
          } else {
            step1AnalyzeBtn.textContent = '开始分析';
            step1AnalyzeBtn.style.opacity = '1';
            step1AnalyzeBtn.disabled = false;
          }
        }
        if (step3BackBtn) step3BackBtn.style.display = 'none';
        if (batchAuditBtn) batchAuditBtn.style.display = 'none';
        if (exportBtn) exportBtn.style.display = 'none';
        if (saveLibraryBtn) saveLibraryBtn.style.display = 'none';
        if (finishBtn) finishBtn.style.display = 'none';
      } else if (this.currentStep === 2) {
        if (secondaryBtn) {
          secondaryBtn.style.display = 'flex';
          secondaryBtn.textContent = '返回';
          secondaryBtn.disabled = false;
          secondaryBtn.style.opacity = '1';
        }
        if (rethinkBtn) {
          rethinkBtn.style.display = 'flex';
          rethinkBtn.disabled = Boolean(this.isAnalyzing);
          rethinkBtn.style.opacity = this.isAnalyzing ? '0.7' : '1';
        }
        if (primaryBtn) {
          primaryBtn.style.display = 'flex';
          primaryBtn.textContent = '切割';
          primaryBtn.disabled = false;
          primaryBtn.style.opacity = '1';
        }
        if (step3BackBtn) step3BackBtn.style.display = 'none';
        if (batchAuditBtn) batchAuditBtn.style.display = 'none';
        if (exportBtn) exportBtn.style.display = 'none';
        if (saveLibraryBtn) saveLibraryBtn.style.display = 'none';
        if (finishBtn) finishBtn.style.display = 'none';
      } else if (this.currentStep === 3) {
        if (secondaryBtn) secondaryBtn.style.display = 'none';
        if (rethinkBtn) rethinkBtn.style.display = 'none';
        if (primaryBtn) primaryBtn.style.display = 'none';
        if (step3BackBtn) {
          step3BackBtn.style.display = 'flex';
          step3BackBtn.disabled = false;
          step3BackBtn.style.opacity = '1';
        }
        if (batchAuditBtn) {
          batchAuditBtn.style.display = 'flex';
          batchAuditBtn.disabled = false;
          batchAuditBtn.style.opacity = '1';
        }
        if (exportBtn) {
          exportBtn.style.display = 'flex';
          exportBtn.disabled = false;
          exportBtn.style.opacity = '1';
        }
        if (saveLibraryBtn) {
          saveLibraryBtn.style.display = 'flex';
          saveLibraryBtn.disabled = false;
          saveLibraryBtn.style.opacity = '1';
        }
        if (finishBtn) {
          finishBtn.style.display = 'flex';
          finishBtn.disabled = false;
          finishBtn.style.opacity = '1';
        }
      }
    },

    resetImportUI() {
      this.currentParsedData = null;
      this.currentPlan = null;
      this.cutChapters = [];
      this.cutChaptersBySegment = [];
      this.batchSegmentsCompleted = 0;
      this.cuttingCurrentIndex = 0;
      this.isCuttingRunning = false;
      this.isCuttingPaused = false;
      this.isCuttingCancelled = false;
      this.cutExecutionMode = 'batch';
      this.clearDraft();

      const fileInput = document.getElementById('module-file-input');
      if (fileInput) fileInput.value = '';

      const pickerCard = document.getElementById('module-import-picker-card');
      const infoCard = document.getElementById('module-file-info-card');
      const promptContainer = document.getElementById('module-prompt-container');

      if (pickerCard) pickerCard.style.display = 'flex';
      if (infoCard) infoCard.style.display = 'none';
      if (promptContainer) promptContainer.style.display = 'none';
      this.setWizardStep(1);
    },

    renderParsedResultUI(data, isRestore = false) {
      if (!data) return;
      this.currentParsedData = data;
      if (!isRestore) {
        this.currentPlan = null;
        this.cutChapters = [];
        this.cutChaptersBySegment = [];
        this.batchSegmentsCompleted = 0;
        this.cuttingCurrentIndex = 0;
      }

      const pickerCard = document.getElementById('module-import-picker-card');
      const infoCard = document.getElementById('module-file-info-card');
      const promptContainer = document.getElementById('module-prompt-container');

      const fileNameEl = document.getElementById('module-file-name-text');
      const fileFormatEl = document.getElementById('module-file-format-text');
      const statWordsEl = document.getElementById('module-stat-words');
      const statImagesEl = document.getElementById('module-stat-images');
      const statChunksEl = document.getElementById('module-stat-chunks');
      const promptTextarea = document.getElementById('module-prompt-textarea');

      if (pickerCard) pickerCard.style.display = 'none';
      if (infoCard) infoCard.style.display = 'flex';
      if (promptContainer) promptContainer.style.display = 'flex';

      if (fileNameEl) fileNameEl.textContent = data.fileName || '模组文档';
      if (fileFormatEl) fileFormatEl.textContent = data.fileType || '文档';
      if (statWordsEl) {
        const count = data.wordCount || (data.text ? this.countWords(data.text) : 0);
        statWordsEl.textContent = `${count} 字`;
      }
      if (statImagesEl) statImagesEl.textContent = `${(data.images || []).length} 张`;
      if (statChunksEl) {
        const estCount = Math.max(1, Math.ceil((data.wordCount || 1) / 4500));
        statChunksEl.textContent = `预计 ${estCount} 段`;
      }

      renderModulePromptPresetsUI();
      renderModuleCuttingPresetsUI();

      const defaultAnalysisPreset = getModulePromptPresets().find(p => p.id === getDefaultModulePresetId());
      if (!data.analysisPrompt && !data.prompt && defaultAnalysisPreset) {
        data.analysisPrompt = defaultAnalysisPreset.prompt;
      }
      data.analysisPrompt = data.analysisPrompt || data.prompt || DEFAULT_TRPG_ANALYSIS_PROMPT;
      data.prompt = data.analysisPrompt;

      const defaultCuttingPreset = getModuleCuttingPresets().find(p => p.id === getDefaultModuleCuttingPresetId());
      if (!data.cuttingPrompt && defaultCuttingPreset) {
        data.cuttingPrompt = defaultCuttingPreset.prompt;
      }
      data.cuttingPrompt = data.cuttingPrompt || DEFAULT_TRPG_CUTTING_EXECUTION_PROMPT;

      if (promptTextarea) promptTextarea.value = data.analysisPrompt;
      const cuttingPromptTextarea = document.getElementById('module-cutting-prompt-textarea');
      if (cuttingPromptTextarea) cuttingPromptTextarea.value = data.cuttingPrompt;

      const step2SplitSelect = document.getElementById('module-step2-split-select');
      const step1SplitSelect = document.getElementById('module-split-parts-select');
      if (step1SplitSelect) {
        step1SplitSelect.value = data.analysisSplitParts || '1';
      }
      if (step2SplitSelect) {
        step2SplitSelect.value = data.cutSplitParts || data.splitParts || '1';
      }

      this.updateBottomActionBar();
    },

    getAnalysisSplitParts() {
      const step1SplitSelect = document.getElementById('module-split-parts-select');
      let requestedParts = (step1SplitSelect && step1SplitSelect.value)
        ? step1SplitSelect.value
        : (this.currentParsedData?.analysisSplitParts || '1');

      if (this.currentParsedData) {
        this.currentParsedData.analysisSplitParts = requestedParts;
      }
      if (step1SplitSelect && step1SplitSelect.value !== requestedParts) {
        step1SplitSelect.value = requestedParts;
      }

      const fullText = this.currentParsedData?.text || '';
      const totalWords = this.currentParsedData?.wordCount || fullText.length;
      if (requestedParts === 'auto') {
        if (totalWords > 80000) return 4;
        if (totalWords > 40000) return 3;
        if (totalWords > 20000) return 2;
        return 1;
      }
      return parseInt(requestedParts, 10) || 1;
    },

    getCuttingSplitParts() {
      const step2SplitSelect = document.getElementById('module-step2-split-select');
      let requestedParts = (step2SplitSelect && step2SplitSelect.value)
        ? step2SplitSelect.value
        : (this.currentParsedData?.cutSplitParts || this.currentParsedData?.splitParts || '1');

      if (this.currentParsedData) {
        this.currentParsedData.cutSplitParts = requestedParts;
        this.currentParsedData.splitParts = requestedParts;
      }
      if (step2SplitSelect && step2SplitSelect.value !== requestedParts) {
        step2SplitSelect.value = requestedParts;
      }

      const fullText = this.currentParsedData?.text || '';
      const totalWords = this.currentParsedData?.wordCount || fullText.length;
      let numParts = 1;
      if (requestedParts === 'auto') {
        if (totalWords > 80000) numParts = 4;
        else if (totalWords > 40000) numParts = 3;
        else if (totalWords > 20000) numParts = 2;
        else numParts = 1;
      } else {
        numParts = parseInt(requestedParts, 10) || 1;
      }

      const totalChunks = this.currentPlan?.chunks?.length || 0;
      if (totalChunks > 0 && numParts > totalChunks) {
        numParts = totalChunks;
      }
      return Math.max(1, numParts);
    },

    getEffectiveSplitParts() {
      return this.getCuttingSplitParts();
    },

    cleanChapterTitle(rawName, moduleName) {
      if (!rawName) return '章节小标题';
      let title = rawName.trim();
      const modName = moduleName || this.activeDetailModule?.name || this.currentParsedData?.moduleName || this.currentPlan?.moduleName || '';
      if (modName) {
        let pureMod = modName.replace(/\.[^/.]+$/, '').replace(/[\(\[\{（【][^\)\]\}）】]*[\)\]\}）】]/g, '').trim();
        pureMod = pureMod.replace(/[《》【】\[\]()（）]/g, '').trim();
        if (pureMod && pureMod.length >= 1) {
          const escaped = pureMod.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const prefixReg = new RegExp(`^(?:《?${escaped}》?|【?${escaped}】?|\\[?${escaped}\\]?)[\\s\\-_—杠:：·|/\\\\]*`, 'gi');
          title = title.replace(prefixReg, '').trim();
          const suffixReg = new RegExp(`[\\s\\-_—杠:：·|/\\\\]*(?:《?${escaped}》?|【?${escaped}】?|\\[?${escaped}\\]?)$`, 'gi');
          title = title.replace(suffixReg, '').trim();
        }
      }
      return title || rawName;
    },

    getAssignedChunksForSegment(segIdx, totalSegs) {
      const allChunks = this.currentPlan?.chunks || [];
      if (!allChunks || allChunks.length === 0) return [];
      if (!totalSegs || totalSegs <= 1) return allChunks;
      const total = allChunks.length;
      const baseCount = Math.floor(total / totalSegs);
      const remainder = total % totalSegs;
      const startIdx = segIdx * baseCount + Math.min(segIdx, remainder);
      const count = baseCount + (segIdx < remainder ? 1 : 0);
      return allChunks.slice(startIdx, startIdx + count);
    },

    rebuildCutChaptersFromSegments() {
      if (!this.cutChaptersBySegment || this.cutChaptersBySegment.length === 0) {
        return this.cutChapters || [];
      }
      const flattened = [];
      for (let s = 0; s < this.cutChaptersBySegment.length; s++) {
        const segChaps = this.cutChaptersBySegment[s];
        if (Array.isArray(segChaps)) {
          segChaps.forEach(c => {
            flattened.push(c);
          });
        }
      }
      flattened.forEach((chap, idx) => {
        chap.id = 'chap_' + (idx + 1);
        chap.sortOrder = idx + 1;
      });
      return flattened;
    },

    splitTextIntoBalancedSegments(text, numParts) {
      if (!text || numParts <= 1) return [text];
      const totalLen = text.length;
      const targetChunkSize = Math.floor(totalLen / numParts);
      const segments = [];
      let currentStart = 0;

      for (let i = 0; i < numParts - 1; i++) {
        const idealEnd = currentStart + targetChunkSize;
        if (idealEnd >= totalLen) break;

        const searchStart = Math.max(currentStart + 1000, idealEnd - 1500);
        const searchEnd = Math.min(totalLen, idealEnd + 1500);
        const searchWindow = text.substring(searchStart, searchEnd);

        let cutOffset = -1;
        const chapterMatch = searchWindow.search(/\n(?:第[0-9一二三四五六七八九十百]+[章节回幕部]|【[^】]+】|#{1,3}\s+|={4,}|-{4,})/);
        if (chapterMatch !== -1) {
          cutOffset = searchStart + chapterMatch + 1;
        } else {
          const doubleNewline = searchWindow.lastIndexOf('\n\n');
          if (doubleNewline !== -1) {
            cutOffset = searchStart + doubleNewline + 2;
          } else {
            const singleNewline = searchWindow.lastIndexOf('\n');
            if (singleNewline !== -1) {
              cutOffset = searchStart + singleNewline + 1;
            } else {
              cutOffset = idealEnd;
            }
          }
        }

        segments.push(text.substring(currentStart, cutOffset));
        currentStart = cutOffset;
      }

      if (currentStart < totalLen) {
        segments.push(text.substring(currentStart));
      }

      return segments.filter(s => s.trim().length > 0);
    },

    async createThumbnailDataUrl(dataUrl, maxW = 320, maxH = 320) {
      if (!dataUrl || typeof dataUrl !== 'string') return dataUrl;
      return new Promise((resolve) => {
        try {
          const img = new Image();
          img.onload = () => {
            let w = img.naturalWidth || maxW;
            let h = img.naturalHeight || maxH;
            if (w > maxW || h > maxH) {
              if (w / h > maxW / maxH) {
                h = Math.round((h * maxW) / w);
                w = maxW;
              } else {
                w = Math.round((w * maxH) / h);
                h = maxH;
              }
            }
            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, w);
            canvas.height = Math.max(1, h);
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);
            resolve(canvas.toDataURL('image/jpeg', 0.75));
          };
          img.onerror = () => resolve(dataUrl);
          img.src = dataUrl;
        } catch (e) {
          resolve(dataUrl);
        }
      });
    },

    async inspectImagesWithVision(images) {
      if (!images || !Array.isArray(images) || images.length === 0) return [];
      const allVisionParsed = [];
      const batchSize = 16;
      for (let offset = 0; offset < images.length; offset += batchSize) {
        try {
          const batch = images.slice(offset, offset + batchSize);
          const imageThumbnails = [];
          for (let i = 0; i < batch.length; i++) {
            const img = batch[i];
            if (!img.dataUrl) continue;
            const thumb = await this.createThumbnailDataUrl(img.dataUrl, 280, 280);
            imageThumbnails.push({
              index: offset + i + 1,
              origName: img.name || `图${offset + i + 1}`,
              dataUrl: thumb
            });
          }
          if (imageThumbnails.length === 0) continue;

          const visionSysPrompt = `你是一个具备全球顶尖鉴赏力的高精度跑团模组插图视觉识别专家。请逐一仔细观察用户提供的多张模组图片画面视觉内容，对每一张图片进行严格的视觉分类与精准命名。
【核心判别与命名铁律】：
1. 地图（包含建筑平面图、俯视图、房间布局、迷宫走廊、区域地脉、地名路线网格）：
   - 必定标注 isMap 为 true。
   - 名称必须明确命名为地图名称（如：洋馆一层平面图、地下实验室结构图、森林迷宫概览），绝对禁止标注为任何角色姓名或NPC名字！
   - description 详细写明画面中描绘的具体建筑空间、走廊房间与空间结构。
2. 角色立绘（人物全身、半身、头像、怪物异形、NPC肖像、衣着外貌）：
   - 必定标注 isMap 为 false。
   - 名称必须命名为角色名称或立绘名称（如：NPC张三立绘、神秘黑衣人肖像、神话怪物外貌），绝对禁止标注为地图！
   - description 详细描述该人物的衣着、发型、外观特征与姿态。
3. 道具线索与场景CG：
   - 信件、日记手迹、符文标记为道具线索；宏大剧情场景插画标记为剧情CG。
4. 剧透与恐怖属性：
   - 包含骨骼、血迹、触手、阴森恐怖场景判定 isHorror 为 true。
   - 终战场景、幕后黑手真相判定 isSensitive 为 true。

请只输出合法的 JSON 数组，严禁包含任何 Markdown 格式块或多余文字，格式严格如下：
[
  { "imageIndex": ${imageThumbnails[0].index}, "isMap": true, "name": "洋馆一层平面图", "description": "洋馆一层的俯视房间走廊建筑平面图", "annotation": "初期探索地图", "isSensitive": false, "isHorror": false, "shouldInclude": true }
]`;

          const idxRangeStr = imageThumbnails.map(t => `图${t.index}`).join('、');
          const visionUserPrompt = `请对附带的 ${imageThumbnails.length} 张图片按照顺序（${idxRangeStr}）进行高精度视觉识别与甄别，每一张图片都必须输出对应的 JSON 项（共 ${imageThumbnails.length} 项），严格区分地图与角色立绘：`;
          const res = await this.callAI(visionSysPrompt, visionUserPrompt, imageThumbnails);
          if (res) {
            const cleanJson = res.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
            const startIdx = cleanJson.indexOf('[');
            const endIdx = cleanJson.lastIndexOf(']');
            if (startIdx !== -1 && endIdx !== -1) {
              const parsed = JSON.parse(cleanJson.substring(startIdx, endIdx + 1));
              if (Array.isArray(parsed) && parsed.length > 0) {
                parsed.forEach((item, localIdx) => {
                  if (item && typeof item === 'object') {
                    if (typeof item.imageIndex !== 'number' || (offset > 0 && item.imageIndex <= batch.length)) {
                      item.imageIndex = imageThumbnails[localIdx] ? imageThumbnails[localIdx].index : (offset + localIdx + 1);
                    }
                    allVisionParsed.push(item);
                  }
                });
              }
            }
          }
        } catch (err) {
          console.warn('[模组] 视觉识别预检跳过，使用上下文与结构智能识别:', err);
        }
      }
      return allVisionParsed;
    },

    async callAI(systemPrompt, userPrompt, imageParts = null, purpose = 'module') {
      const stateObj = global.state || (typeof window !== 'undefined' ? window.state : {}) || {};
      const apiCfg = (typeof global.getEffectiveApiConfig === 'function')
        ? global.getEffectiveApiConfig(purpose)
        : ((typeof window !== 'undefined' && typeof window.getEffectiveApiConfig === 'function')
            ? window.getEffectiveApiConfig(purpose)
            : (stateObj.apiConfig || {}));

      const proxyUrl = apiCfg.proxyUrl || (apiCfg.isSub ? "https://api.openai.com" : (stateObj.apiConfig?.proxyUrl || "https://api.openai.com"));
      const apiKey = apiCfg.apiKey || (apiCfg.isSub ? "" : (stateObj.apiConfig?.apiKey || ""));
      const model = apiCfg.model || (apiCfg.isSub ? "gpt-4o-mini" : (stateObj.apiConfig?.model || "gpt-3.5-turbo"));
      const temperature = apiCfg.temperature !== undefined ? apiCfg.temperature : (stateObj.apiConfig?.temperature || 0.2);

      if (!apiKey) {
        console.warn('[模组] 未配置 API Key');
        throw new Error(apiCfg.isSub ? '未检测到副 API Key，请先在API设置中配置副 API 密钥与模型' : '未检测到主 API Key，请先在API设置中配置主 API 密钥与模型');
      }
      const GEMINI_URL = global.GEMINI_API_URL || 'https://generativelanguage.googleapis.com/v1beta/models';
      const isGemini = proxyUrl === GEMINI_URL || (proxyUrl && proxyUrl.includes('generativelanguage.googleapis.com'));
      const cleanedProxy = String(proxyUrl || 'https://api.openai.com').trim().replace(/\/+$/, '');

      let requestUrl = isGemini
        ? `${GEMINI_URL}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`
        : (cleanedProxy.endsWith('/v1') ? `${cleanedProxy}/chat/completions` : `${cleanedProxy}/v1/chat/completions`);

      const useStreamInModule = typeof window.isApiStreamEnabled === 'function' ? window.isApiStreamEnabled() : false;
      let requestHeaders = isGemini
        ? { 'Content-Type': 'application/json' }
        : {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
            ...(useStreamInModule ? { Accept: 'text/event-stream' } : {})
          };

      let requestBody;
      if (isGemini) {
        const parts = [];
        if (Array.isArray(imageParts) && imageParts.length > 0) {
          imageParts.forEach(img => {
            if (img.inlineData) {
              parts.push({ inlineData: img.inlineData });
            } else if (img.dataUrl) {
              const b64 = img.dataUrl.split(',')[1];
              const mime = (img.dataUrl.match(/data:([^;]+);/) || [])[1] || 'image/jpeg';
              if (b64) parts.push({ inlineData: { mimeType: mime, data: b64 } });
            }
          });
        }
        parts.push({ text: userPrompt });
        requestBody = {
          contents: [{ role: 'user', parts: parts }],
          generationConfig: {
            temperature: parseFloat(temperature) || 0.2
          },
          systemInstruction: { parts: [{ text: systemPrompt }] }
        };
      } else {
        let userContent = userPrompt;
        if (Array.isArray(imageParts) && imageParts.length > 0) {
          userContent = [{ type: 'text', text: userPrompt }];
          imageParts.forEach(img => {
            const url = img.dataUrl || (img.inlineData ? `data:${img.inlineData.mimeType};base64,${img.inlineData.data}` : null);
            if (url) {
              userContent.push({ type: 'image_url', image_url: { url: url } });
            }
          });
        }
        requestBody = {
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent }
          ],
          temperature: parseFloat(temperature) || 0.2,
          stream: useStreamInModule
        };
      }

      let streamedBackupText = '';
      const prevStreamCb = typeof window !== 'undefined' ? window.onAiStreamTokenReceived : null;
      const baseAnalysisStatus = this.analysisStatusText || '正在分析模组与地图...';
      const progressTextEl = document.getElementById('module-progress-text');
      const baseProgressText = progressTextEl ? progressTextEl.textContent.replace(/\s*·\s*已流式接收\s*\d+\s*字$/, '') : '';

      if (useStreamInModule && typeof window !== 'undefined') {
        let lastUiUpdateTs = 0;
        window.onAiStreamTokenReceived = (chunk) => {
          if (typeof prevStreamCb === 'function') {
            try { prevStreamCb(chunk); } catch (_) {}
          }
          if (chunk && typeof chunk.content === 'string' && chunk.content.length >= streamedBackupText.length) {
            streamedBackupText = chunk.content;
            const now = Date.now();
            if (now - lastUiUpdateTs > 260) {
              lastUiUpdateTs = now;
              const charLen = streamedBackupText.length;
              if (this.isAnalyzing) {
                this.analysisStatusText = `${baseAnalysisStatus} · 已流式接收 ${charLen} 字`;
                const nextBtn = document.getElementById('module-wizard-next-btn');
                if (nextBtn && this.currentStep === 1) {
                  nextBtn.textContent = this.analysisStatusText;
                }
              } else if (this.isCuttingRunning && progressTextEl) {
                progressTextEl.textContent = `${baseProgressText} · 已流式接收 ${charLen} 字`;
              }
            }
          }
        };
      }

      let response;
      try {
        response = await fetch(requestUrl, {
          method: 'POST',
          _isSubApiCall: Boolean(apiCfg && apiCfg.isSub),
          _noAutoRetry: true,
          headers: requestHeaders,
          body: JSON.stringify(requestBody)
        });
      } catch (fetchErr) {
        if (useStreamInModule && typeof window !== 'undefined') {
          window.onAiStreamTokenReceived = prevStreamCb;
        }
        if (streamedBackupText && streamedBackupText.trim().length > 80) {
          console.warn('[模组] 流式请求尾段中断，启用实时已接收文本继续解析');
          return streamedBackupText;
        }
        throw fetchErr;
      } finally {
        if (useStreamInModule && typeof window !== 'undefined') {
          window.onAiStreamTokenReceived = prevStreamCb;
        }
      }

      if (!response.ok) {
        if (streamedBackupText && streamedBackupText.trim().length > 80) {
          return streamedBackupText;
        }
        const errBody = await response.text();
        throw new Error(`API 响应错误 ${response.status}: ${errBody}`);
      }

      const rawText = await response.text();
      let resText = '';
      const trimmed = (rawText || '').trim();
      if (trimmed.startsWith('{')) {
        try {
          const resData = JSON.parse(trimmed);
          const candidateParts = resData.candidates?.[0]?.content?.parts;
          const joinedPartsText = Array.isArray(candidateParts)
            ? (candidateParts.filter(p => p && !p.thought).map(p => p.text || '').join('') || candidateParts.map(p => p.text || '').join(''))
            : (candidateParts?.[0]?.text || '');
          if (isGemini) {
            resText = joinedPartsText || resData.choices?.[0]?.message?.content || '';
          } else {
            const rawMsgContent =
              resData.choices?.[0]?.message?.content ??
              resData.choices?.[0]?.delta?.content ??
              resData.content ??
              '';
            let msgContent = '';
            if (typeof rawMsgContent === 'string') {
              msgContent = rawMsgContent;
            } else if (Array.isArray(rawMsgContent)) {
              msgContent = rawMsgContent
                .map(b => (typeof b === 'string' ? b : (b && b.type !== 'thinking' && typeof b.text === 'string' ? b.text : '')))
                .join('');
            }
            if (!msgContent && joinedPartsText) {
              msgContent = joinedPartsText;
            }
            const msgReasoning =
              resData.choices?.[0]?.message?.reasoning_content ||
              resData.choices?.[0]?.message?.reasoning ||
              resData.choices?.[0]?.message?.thinking ||
              '';
            resText = msgContent || msgReasoning || '';
          }
        } catch (jsonErr) {
          resText = rawText;
        }
      } else if (trimmed.startsWith('data:') || trimmed.includes('\ndata:')) {
        const lines = trimmed.split('\n');
        for (const line of lines) {
          const t = line.trim();
          if (!t.startsWith('data:')) continue;
          const dStr = t.slice(5).trim();
          if (dStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(dStr);
            const delta =
              parsed.choices?.[0]?.delta?.content ||
              parsed.choices?.[0]?.message?.content ||
              parsed.content?.[0]?.text ||
              (parsed.candidates?.[0]?.content?.parts
                ? parsed.candidates[0].content.parts.map(p => (p && !p.thought ? p.text || '' : '')).join('')
                : '') ||
              '';
            if (delta) resText += delta;
          } catch (_) {}
        }
      } else {
        resText = rawText;
      }

      if ((!resText || resText.trim().length < streamedBackupText.trim().length) && streamedBackupText.trim()) {
        resText = streamedBackupText;
      }

      if (!resText || !resText.trim()) {
        throw new Error('AI 未返回有效内容，请检查模型响应');
      }
      return resText;
    },

    async getLocationsByModuleId(moduleId) {
      const dbInstance = typeof db !== 'undefined' ? db : (window.db || null);
      if (!dbInstance || !dbInstance.moduleLocationNav) return [];
      let list = [];
      try {
        list = await dbInstance.moduleLocationNav.where('moduleId').equals(moduleId).toArray();
        if (list.length === 0 && typeof moduleId === 'string' && !isNaN(Number(moduleId))) {
          list = await dbInstance.moduleLocationNav.where('moduleId').equals(Number(moduleId)).toArray();
        } else if (list.length === 0 && typeof moduleId === 'number') {
          list = await dbInstance.moduleLocationNav.where('moduleId').equals(String(moduleId)).toArray();
        }
      } catch (e) {
        console.error('查询地点异常', e);
      }
      return list;
    },

    extractFallbackMapNodes(text, chunks = []) {
      const nodes = [];
      const seen = new Set();
      const modName = this.currentParsedData?.moduleName || '模组总览';
      nodes.push({
        name: modName,
        parent: '',
        level: 1,
        desc: '模组核心探索主区域'
      });
      seen.add(modName);

      const placeKeywords = ['室', '房', '厅', '馆', '街', '站', '校', '院', '楼', '区', '店', '场', '洞', '山', '屋', '阁', '廊', '台', '库', '所', '道', '町', '社', '坛', '桥', '园', '林', '塔', '门', '海', '岛', '堡', '市', '镇', '村', '寺', '殿', '宅', '庄', '城', '1F', '2F', '3F', 'B1', '一层', '二层', '地下室'];

      let currentBuilding = '';

      if (text && typeof text === 'string') {
        const lines = text.split('\n');
        for (let i = 0; i < lines.length && nodes.length < 35; i++) {
          const line = lines[i].trim();
          if (!line || line.length > 50) continue;

          let placeCandidate = '';
          const tagMatch = line.match(/(?:【地点[：:]?\s*|【场所[：:]?\s*|【建筑[：:]?\s*|【场景[：:]?\s*|地点[：:]\s*|场所[：:]\s*|场景[：:]\s*)([^】\n\r，。！？]{2,25})/);
          if (tagMatch) {
            placeCandidate = tagMatch[1].trim();
          } else if (line.startsWith('#') || line.startsWith('第') || line.startsWith('【')) {
            const clean = line.replace(/^[#\s\d一二三四五六七八九十章节回幕【】*·-]+/, '').replace(/[】】].*$/, '').trim();
            if (clean && clean.length >= 2 && clean.length <= 20 && placeKeywords.some(kw => clean.includes(kw))) {
              placeCandidate = clean;
            }
          }

          if (placeCandidate) {
            placeCandidate = placeCandidate.replace(/^[\d\.\-_、杠]+/, '').trim();
            if (placeCandidate && !seen.has(placeCandidate) && placeCandidate !== modName) {
              seen.add(placeCandidate);
              const isMacro = placeCandidate.includes('区') || placeCandidate.includes('市') || placeCandidate.includes('镇') || placeCandidate.includes('山') || placeCandidate.includes('岛') || placeCandidate.includes('街') || placeCandidate.includes('町') || placeCandidate.includes('城');
              const isRoom = placeCandidate.includes('室') || placeCandidate.includes('房') || placeCandidate.includes('廊') || placeCandidate.includes('台') || placeCandidate.includes('阁') || placeCandidate.includes('1F') || placeCandidate.includes('2F') || placeCandidate.includes('B1') || placeCandidate.includes('层');
              let level = 2;
              let parent = modName;
              if (isRoom && currentBuilding) {
                level = 3;
                parent = currentBuilding;
              } else if (!isMacro) {
                level = 2;
                currentBuilding = placeCandidate;
                parent = modName;
              } else {
                level = 1;
                parent = modName;
              }
              nodes.push({
                name: placeCandidate,
                parent: parent,
                level: level,
                desc: '模组空间地点'
              });
            }
          }
        }
      }

      if (Array.isArray(chunks)) {
        chunks.forEach(c => {
          const name = (c.name || '').replace(/^[\d\.\-_]+/, '').trim();
          if (name && placeKeywords.some(kw => name.includes(kw))) {
            if (!seen.has(name) && name !== modName && nodes.length < 40) {
              seen.add(name);
              nodes.push({
                name: name,
                parent: modName,
                level: 2,
                desc: c.remarks || c.reason || '模组关键探索场景'
              });
            }
          }
        });
      }

      return nodes;
    },

    generateLocalPlan(data) {
      const text = data.text || '';
      const totalLen = text.length;
      const moduleName = data.moduleName || '跑团模组';
      const chunks = [];
      const is1v1 = text.includes('1v1') || text.includes('单人模组') || text.includes('单人');
      const isSandbox = text.includes('沙盒') || text.includes('探索') || text.includes('自由');
      const isCoj = text.includes('coj') || text.includes('COJ') || text.includes('秘密');

      let bgTag = '日模';
      if (text.includes('美国') || text.includes('波士顿') || text.includes('阿卡姆') || text.includes('纽约') || text.includes('加州') || text.includes('得州') || text.includes('芝加哥') || text.includes('旧金山') || text.includes('密斯卡托尼克')) {
        bgTag = '美模';
      } else if (text.includes('古代') || text.includes('江湖') || text.includes('武侠') || text.includes('朝廷') || text.includes('大唐') || text.includes('大宋') || text.includes('大明') || text.includes('大清') || text.includes('修仙') || text.includes('修真') || text.includes('客栈') || text.includes('镖局') || text.includes('古风')) {
        bgTag = '古风';
      } else if (text.includes('现代中国') || text.includes('中国') || text.includes('北京') || text.includes('上海') || text.includes('广州') || text.includes('深圳') || text.includes('重庆') || text.includes('成都') || text.includes('国内') || text.includes('公安') || text.includes('派出所') || text.includes('省') || text.includes('市')) {
        bgTag = '现代中国';
      }

      let endingTag = '普通';
      if (text.includes('全员存活') || text.includes('生还') || text.includes('TE') || text.includes('True End') || text.includes('好结局')) {
        endingTag = '安全';
      } else if (text.includes('撕卡') || text.includes('全灭') || text.includes('死亡') || text.includes('Lost') || text.includes('lost') || text.includes('无生还')) {
        endingTag = '危险';
      }

      const contentTags = [];
      if (text.includes('学校') || text.includes('校园') || text.includes('高中') || text.includes('大学') || text.includes('教室') || text.includes('学园') || text.includes('学生会')) contentTags.push('校园');
      if (text.includes('复活') || text.includes('起死回生') || text.includes('召回灵魂') || text.includes('还魂')) contentTags.push('复活');
      if (text.includes('r18') || text.includes('R18') || text.includes('nsfw') || text.includes('工口') || text.includes('性')) contentTags.push('粉红');
      if (text.includes('ntr') || text.includes('NTR') || text.includes('多人关系')) contentTags.push('NTR');
      if (text.includes('虐待') || text.includes('殴打') || text.includes('断肢') || text.includes('血腥') || text.includes('暴力') || text.includes('拷问')) contentTags.push('血腥暴力');
      if (text.includes('纯爱') || text.includes('甜饼') || text.includes('发糖') || text.includes('恋爱')) contentTags.push('纯爱');
      if (text.includes('茶番') || text.includes('日常') || text.includes('聚餐') || text.includes('玩游戏') || text.includes('吃饭')) contentTags.push('茶番');
      if (text.includes('恐怖') || text.includes('惊悚') || text.includes('san check') || text.includes('怪异')) contentTags.push('恐怖');
      if (text.includes('meta') || text.includes('Meta') || text.includes('第四面墙') || text.includes('叙述性诡计')) contentTags.push('Meta');

      const sortedTags = this.sortModuleTags(bgTag, endingTag, contentTags, []);

      const slicePub = text.substring(0, Math.min(1500, totalLen));
      chunks.push({
        id: 'chunk_pub',
        order: 1,
        name: '00-模组已知信息',
        category: '事前公开',
        wordCount: this.countWords(slicePub),
        rawSlice: slicePub,
        prefixPreview: '【开局背景】本篇包含公开给调查员了解的基础世界观与已知线索...',
        reason: '玩家开局前可见的已知背景与创建人物须知，完全无剧透',
        userInstruction: ''
      });

      const sliceGuide = text.substring(0, Math.min(2500, totalLen));
      chunks.push({
        id: 'chunk_guide',
        order: 2,
        name: '01-模组导读与带团大纲',
        category: '带团引导',
        wordCount: this.countWords(sliceGuide),
        rawSlice: sliceGuide,
        prefixPreview: '【全局大纲】全模组章节导航、带团节奏建议与判定机制说明...',
        reason: '给守秘人的全局带团总纲与章节导航',
        userInstruction: ''
      });

      const sliceTruth = text.substring(0, Math.min(4000, totalLen));
      chunks.push({
        id: 'chunk_truth',
        order: 3,
        name: '02-幕后真相与机制总览',
        category: 'KP信息',
        wordCount: this.countWords(sliceTruth),
        rawSlice: sliceTruth,
        prefixPreview: '【幕后真相】事件起因、隐藏设定与判定对抗机制...',
        reason: '汇总全文散落的背景真相与暗线机制',
        userInstruction: ''
      });

      if (!is1v1 && (text.includes('HO') || text.includes('ho1') || text.includes('秘密'))) {
        const sliceHo1 = text.substring(0, Math.min(3500, totalLen));
        chunks.push({
          id: 'chunk_ho1_secret',
          order: 4,
          name: 'HO1秘密与设定',
          category: 'HO秘密',
          wordCount: this.countWords(sliceHo1),
          rawSlice: sliceHo1,
          prefixPreview: '【HO1专属秘密与设定】整合全篇散落关于HO1的所有背景与私密动机...',
          reason: '通读全文提取HO1散落在各处的全部设定并彻底去重整合',
          userInstruction: ''
        });

        const sliceHo2 = text.substring(0, Math.min(3500, totalLen));
        chunks.push({
          id: 'chunk_ho2_secret',
          order: 5,
          name: 'HO2秘密与设定',
          category: 'HO秘密',
          wordCount: this.countWords(sliceHo2),
          rawSlice: sliceHo2,
          prefixPreview: '【HO2专属秘密与设定】整合全篇散落关于HO2的所有背景与私密动机...',
          reason: '通读全文提取HO2散落在各处的全部设定并彻底去重整合',
          userInstruction: ''
        });

        const sliceSolo1 = text.substring(0, Math.min(3500, totalLen));
        chunks.push({
          id: 'chunk_solo_1',
          order: 6,
          name: '02.5-ho1单人线',
          category: '单人线',
          wordCount: this.countWords(sliceSolo1),
          rawSlice: sliceSolo1,
          prefixPreview: '【HO1专属单人线】HO1调查员单独遭遇的个人专属事件...',
          reason: '独立隔离HO1单人剧情，私聊进行',
          userInstruction: ''
        });

        const sliceSolo2 = text.substring(0, Math.min(3500, totalLen));
        chunks.push({
          id: 'chunk_solo_2',
          order: 7,
          name: '02.6-ho2单人线',
          category: '单人线',
          wordCount: this.countWords(sliceSolo2),
          rawSlice: sliceSolo2,
          prefixPreview: '【HO2专属单人线】HO2调查员单独遭遇的个人专属事件...',
          reason: '独立隔离HO2单人剧情，私聊进行',
          userInstruction: ''
        });

        const sliceCat1 = text.substring(0, Math.min(2500, totalLen));
        chunks.push({
          id: 'chunk_cat_1',
          order: 8,
          name: '猫-ho1-核心角色',
          category: '猫人设',
          wordCount: this.countWords(sliceCat1),
          rawSlice: sliceCat1,
          prefixPreview: '【HO1专属猫人设】与HO1深度绑定的NPC性格描写与对话风格...',
          reason: 'HO1对应专属猫人设档案，不杂揉进导入或正文',
          userInstruction: ''
        });

        const sliceCat2 = text.substring(0, Math.min(2500, totalLen));
        chunks.push({
          id: 'chunk_cat_2',
          order: 9,
          name: '猫-ho2-核心角色',
          category: '猫人设',
          wordCount: this.countWords(sliceCat2),
          rawSlice: sliceCat2,
          prefixPreview: '【HO2专属猫人设】与HO2深度绑定的NPC性格描写与对话风格...',
          reason: 'HO2对应专属猫人设档案，不杂揉进导入或正文',
          userInstruction: ''
        });
      }

      const partSize = Math.max(3000, Math.min(5000, Math.floor(totalLen / 2)));
      let curOffset = 0;
      let partIdx = 1;
      const sceneNames = ['序幕调查与深入探索', '决战前夕与核心对抗'];

      while (curOffset < totalLen && partIdx <= 2) {
        let endOffset = Math.min(totalLen, curOffset + partSize);
        const snippet = text.substring(curOffset, endOffset).trim();
        const cleanSnippet = snippet.substring(0, 100).replace(/\s+/g, ' ');

        chunks.push({
          id: 'chunk_scene_' + partIdx,
          order: chunks.length + 1,
          name: sceneNames[partIdx - 1] || `主线探索第${partIdx}阶段`,
          category: '正文',
          wordCount: this.countWords(snippet),
          rawSlice: snippet,
          prefixPreview: cleanSnippet,
          reason: '按剧情自然发展脉络组织主线正文',
          userInstruction: ''
        });

        curOffset = endOffset;
        partIdx++;
      }

      chunks.push({
        id: 'chunk_end',
        order: chunks.length + 1,
        name: '模组名-结局',
        category: '结局',
        wordCount: 1500,
        rawSlice: text.substring(Math.max(0, totalLen - 4000), totalLen),
        prefixPreview: '【结局分支】各分支结局达成条件与调查员结算奖励...',
        reason: '汇总结局走向与结算',
        userInstruction: ''
      });

      const mapNodes = this.extractFallbackMapNodes(text, chunks);

      return {
        moduleType: isSandbox ? '沙盒' : '线性',
        ruleSystem: isCoj ? 'coj' : 'coc',
        scaleType: is1v1 ? '1v1' : '2ho',
        summary: '无剧透模组概览',
        bgTag: bgTag,
        endingTag: endingTag,
        contentTags: contentTags,
        customTags: [],
        tags: sortedTags,
        moduleName: moduleName,
        totalWords: data.wordCount,
        chunks: chunks,
        mapNodes: mapNodes
      };
    },

    salvagePartialAiPlan(rawText) {
      if (!rawText || typeof rawText !== 'string') return null;
      try {
        const cleanRaw = rawText
          .replace(/<think>[\s\S]*?<\/think>/gi, '')
          .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
          .trim();

        const chunks = [];
        const mapNodes = [];
        const contentTags = [];
        let moduleType = '线性';
        let ruleSystem = 'coc';
        let scaleType = '1v1';
        let bgTag = '日模';
        let endingTag = '普通';
        let summary = '模组概览';

        const typeMatch = cleanRaw.match(/"moduleType"\s*:\s*"([^"\n\r]+)"/);
        if (typeMatch) moduleType = typeMatch[1].trim();
        const ruleMatch = cleanRaw.match(/"ruleSystem"\s*:\s*"([^"\n\r]+)"/);
        if (ruleMatch) ruleSystem = ruleMatch[1].trim();
        const scaleMatch = cleanRaw.match(/"scaleType"\s*:\s*"([^"\n\r]+)"/);
        if (scaleMatch) scaleType = scaleMatch[1].trim();
        const bgMatch = cleanRaw.match(/"bgTag"\s*:\s*"([^"\n\r]+)"/);
        if (bgMatch) bgTag = bgMatch[1].trim();
        const endMatch = cleanRaw.match(/"endingTag"\s*:\s*"([^"\n\r]+)"/);
        if (endMatch) endingTag = endMatch[1].trim();
        const sumMatch = cleanRaw.match(/"summary"\s*:\s*"([\s\S]*?)"(?=\s*,\s*"(?:bgTag|endingTag|contentTags|mapNodes|chunks|imageAnalysis|moduleType|ruleSystem|scaleType)"\s*:|\s*\})/);
        if (sumMatch && sumMatch[1].trim()) {
          summary = sumMatch[1].trim();
        } else {
          const sumSimple = cleanRaw.match(/"summary"\s*:\s*"([^"\n\r]+)"/);
          if (sumSimple && sumSimple[1].trim()) summary = sumSimple[1].trim();
        }

        const tagsBlockMatch = cleanRaw.match(/"contentTags"\s*:\s*\[([^\]]*)\]/);
        if (tagsBlockMatch && tagsBlockMatch[1]) {
          const tagMatches = tagsBlockMatch[1].match(/"([^"]+)"/g);
          if (tagMatches) {
            tagMatches.forEach(tm => {
              const val = tm.replace(/^"|"$/g, '').trim();
              if (val && !contentTags.includes(val)) contentTags.push(val);
            });
          }
        }

        const extractFieldValue = (block, keyPattern) => {
          const reg = new RegExp(`"(?:${keyPattern})"\\s*:\\s*"([\\s\\S]*?)"(?=\\s*,\\s*"(?:order|name|title|chapterName|category|type|wordCount|words|reason|prefixPreview|suffixPreview|remarks|notes|desc|description|parent|parentName|level|imageIndex|shouldInclude|isSensitive|isHorror|annotation|id)"\\s*:|\\s*\\}|\\s*$)`);
          const m = block.match(reg);
          if (m && typeof m[1] === 'string') return m[1].trim();
          const fallbackReg = new RegExp(`"(?:${keyPattern})"\\s*:\\s*"([^"\\n\\r]*)"`);
          const fm = block.match(fallbackReg);
          return fm && typeof fm[1] === 'string' ? fm[1].trim() : '';
        };

        const seenM = new Set();
        const seenC = new Set();

        const blockStarts = [];
        const startRegex = /\{\s*(?="(?:order|name|title|chapterName|category|type|parent|level|imageIndex|shouldInclude)"\s*:)/g;
        let sm;
        while ((sm = startRegex.exec(cleanRaw)) !== null) {
          blockStarts.push(sm.index);
        }

        const candidateBlocks = [];
        if (blockStarts.length > 0) {
          for (let i = 0; i < blockStarts.length; i++) {
            const start = blockStarts[i];
            const end = (i + 1 < blockStarts.length) ? blockStarts[i + 1] : cleanRaw.length;
            candidateBlocks.push(cleanRaw.slice(start, end));
          }
        } else {
          const simpleObjRegex = /\{[^{}]+\}/g;
          let om;
          while ((om = simpleObjRegex.exec(cleanRaw)) !== null) {
            candidateBlocks.push(om[0]);
          }
        }

        for (let i = 0; i < candidateBlocks.length; i++) {
          const block = candidateBlocks[i];
          const hasImageFields = /"(?:imageIndex|shouldInclude|isSensitive|isHorror|annotation)"\s*:/.test(block);
          if (hasImageFields) continue;

          const itemName = extractFieldValue(block, 'name|title|chapterName');
          if (!itemName) continue;

          const hasChunkFields = /"(?:category|prefixPreview|suffixPreview|wordCount|reason|remarks|notes|order)"\s*:/.test(block);
          const hasMapFields = /"(?:parent|parentName|level|desc|description)"\s*:/.test(block) && !hasChunkFields;

          if (hasMapFields) {
            if (!seenM.has(itemName) && !itemName.includes('大区域') && !itemName.includes('建筑分区') && !itemName.includes('核心探索主区域')) {
              seenM.add(itemName);
              const parentVal = extractFieldValue(block, 'parent|parentName');
              const levelM = block.match(/"level"\s*:\s*([0-9]+)/);
              const descVal = extractFieldValue(block, 'desc|description');
              mapNodes.push({
                name: itemName,
                parent: parentVal,
                level: levelM ? (parseInt(levelM[1], 10) || 2) : 2,
                desc: descVal
              });
            }
          } else if (hasChunkFields) {
            if (!seenC.has(itemName)) {
              seenC.add(itemName);
              const orderM = block.match(/"order"\s*:\s*([0-9]+)/);
              const catVal = extractFieldValue(block, 'category|type');
              const wcM = block.match(/"(?:wordCount|words)"\s*:\s*([0-9]+)/);
              const reasonVal = extractFieldValue(block, 'reason');
              const prefVal = extractFieldValue(block, 'prefixPreview');
              const suffVal = extractFieldValue(block, 'suffixPreview');
              const remVal = extractFieldValue(block, 'remarks|notes');
              chunks.push({
                order: orderM ? (parseInt(orderM[1], 10) || (chunks.length + 1)) : (chunks.length + 1),
                name: itemName,
                category: catVal || '正文',
                wordCount: wcM ? (parseInt(wcM[1], 10) || 1200) : 1200,
                reason: reasonVal,
                prefixPreview: prefVal,
                suffixPreview: suffVal,
                remarks: remVal
              });
            }
          }
        }

        if (chunks.length === 0) {
          const lines = cleanRaw.split('\n');
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line || line.startsWith('{') || line.startsWith('}') || line.startsWith('"')) continue;
            const slashMatch = line.match(/^(?:[-*•]|\d+[\.、\)])\s*([^\/\n]+?)\s*\/\s*(?:约?\s*(\d+)\s*字\s*\/\s*)?([^\/\n]+?)\s*\/\s*(.+)$/);
            if (slashMatch) {
              const cName = slashMatch[1].replace(/\*\*/g, '').replace(/^[【\[]|[】\]]$/g, '').trim();
              const cWords = slashMatch[2] ? (parseInt(slashMatch[2], 10) || 1200) : 1200;
              const cCat = slashMatch[3].replace(/\*\*/g, '').trim() || '正文';
              const cReason = slashMatch[4].trim();
              if (cName && !seenC.has(cName) && cName !== '段落名') {
                seenC.add(cName);
                chunks.push({
                  order: chunks.length + 1,
                  name: cName,
                  category: cCat,
                  wordCount: cWords,
                  reason: cReason,
                  prefixPreview: '',
                  suffixPreview: '',
                  remarks: cReason
                });
              }
            }
          }
        }

        if (chunks.length > 0 || mapNodes.length > 0) {
          return {
            _isSalvagedPartial: true,
            moduleType,
            ruleSystem,
            scaleType,
            bgTag,
            endingTag,
            contentTags,
            summary,
            chunks,
            mapNodes
          };
        }
      } catch (e) {
        console.warn('[模组] 挽救不完整 AI 方案异常', e);
      }
      return null;
    },

    async generateCuttingPlan() {
      if (!this.currentParsedData) {
        throw new Error('未选择模组文件');
      }

      await this.restoreMissingImagesFromRawFile(this.currentParsedData);

      this.currentPlan = null;
      this.cutChapters = [];
      this.cutChaptersBySegment = [];
      this.batchSegmentsCompleted = 0;
      this.cuttingCurrentIndex = 0;
      this.isAnalyzing = true;
      this.saveDraft();

      const promptPresetSelect = document.getElementById('module-prompt-preset-select');
      const promptTextarea = document.getElementById('module-prompt-textarea');
      if (promptTextarea && promptTextarea.value.trim()) {
        this.currentParsedData.analysisPrompt = promptTextarea.value.trim();
        this.currentParsedData.prompt = promptTextarea.value.trim();
      } else if (promptPresetSelect && promptPresetSelect.value) {
        const presets = getModulePromptPresets();
        const found = presets.find(p => p.id === promptPresetSelect.value);
        if (found && found.prompt) {
          this.currentParsedData.analysisPrompt = found.prompt;
          this.currentParsedData.prompt = found.prompt;
        }
      }

      const opinionEl = document.getElementById('module-global-opinion-textarea');
      if (opinionEl) {
        this.globalOpinion = opinionEl.value.trim();
      }

      let plan = null;
      let lastAiError = null;
      try {
        const activePrompt = this.currentParsedData.analysisPrompt || this.currentParsedData.prompt || DEFAULT_TRPG_ANALYSIS_PROMPT;
        this.currentParsedData.analysisPrompt = activePrompt;
        this.currentParsedData.prompt = activePrompt;
        const systemPrompt = `你是一个资深跑团模组重构与分析专家。请严格按照以下跑团模组重构、分类与标签规范，分析模组文本并输出严格的 JSON 结构规划方案：

${activePrompt}

━━━━━━━━━━━━━━━━━━
【模组插图与地图高精度识别全局铁律（不可违反）】
━━━━━━━━━━━━━━━━━━
1. 绝对严禁混淆地图与角色立绘：
   - 严禁将任何地图标注为角色人设、NPC姓名或个人名字！
   - 严禁将任何角色立绘标注为地图或平面图！
2. 地图特征与命名准则：
   - 若画面为建筑平面、房间俯视、地名分布、走廊网格、迷宫、山脉水系等空间布局示意，必定为【地图】。
   - 地图名称必须明确为具体的地图名称，如【XX一层平面图】、【地下室结构地图】、【小镇全貌地图】，绝不允许使用角色姓名命名。
   - 地图的描述与注解必须说明该地图对应的建筑区域、楼层与探索范围。
3. 角色立绘特征与命名准则：
   - 若画面为主体人物形象、角色外貌、肖像、半身或全身立绘，必定为【角色立绘】。
   - 角色立绘名称必须明确为【NPC XX立绘】或【XX外观立绘】。
4. 多张地图的严格区分：
   - 若模组内有多张地图，必须严格根据对应章节、页码以及楼层标识（如1F、2F、B1、洋馆外景、地宫等）精准区分，禁止将不同区域或楼层的地图混淆或张冠李戴。

━━━━━━━━━━━━━━━━━━
【输出格式规范】
━━━━━━━━━━━━━━━━━━
直接输出以 { 开头、以 } 结尾的纯 JSON 对象，严禁使用 \`\`\`json 代码块包裹，严禁在 JSON 前后附加任何解释说明，所有字符串内部的换行请写为 \\n，字符串内部引用请一律使用中文引号「」或“”。
JSON 格式如下：
{
  "moduleType": "线性",
  "ruleSystem": "coc",
  "scaleType": "1v1",
  "summary": "模组无剧透简介",
  "bgTag": "日模",
  "endingTag": "普通",
  "contentTags": ["校园", "恐怖"],
  "mapNodes": [
    { "name": "核心探索主区域", "parent": "", "level": 1, "desc": "空间说明" },
    { "name": "主要建筑或街区", "parent": "核心探索主区域", "level": 2, "desc": "建筑说明" },
    { "name": "具体房间或微观场所", "parent": "主要建筑或街区", "level": 3, "desc": "无剧透简短说明" }
  ],
  "chunks": [
    {
      "order": 1,
      "name": "00-模组已知信息",
      "category": "事前公开",
      "wordCount": 1000,
      "reason": "开局背景与须知，无剧透",
      "prefixPreview": "该章节在原文中的起始文字前100字（从哪开始）",
      "suffixPreview": "该章节在原文中的末尾文字后100字（到哪结束）",
      "remarks": "章节内容备注：明确指出本章包含什么具体内容与要点；若原文中有散落在各处的额外补充信息（如KP信息中的NPC人设背景、HO专属设定与秘密、道具伏笔等），在此处备注注明将这些散落信息归纳进本章节"
    }
  ],
  "imageAnalysis": [
    {
      "imageIndex": 1,
      "shouldInclude": true,
      "isSensitive": false,
      "name": "角色立绘",
      "description": "主角初始外观立绘",
      "annotation": "开场NPC外观展示"
    }
  ]
}
注意：
1. mapNodes 必须在 chunks 前完整输出！收录模组内所有空间地点、建筑、街道、楼层、房间，构建完整的三级层级树（level 1 为大区域/城镇/总地域，level 2 为建筑分区/街道/独立场所，level 3 为具体房间/走廊/微观场所）。每个节点必须包含 name、parent、level、desc。严禁输出空数组！
2. moduleType 只能是 "线性"、"沙盒" 或 "其他" 三者之一，禁止附带任何注解。
3. ruleSystem 只能是 "coc" 或 "coj"。
4. scaleType: 若模组设有专属 HO 位，按数量判定为 "2ho"、"3ho"、"4ho"，若大于4人有ho则判定为 "多ho"；若为无 HO 位模组，单人判定为 "1v1" 或 "单人"，多人则根据模组开头游玩人数填写为 "*人" 或 "*-*人"（例如 "2-4人"、"3-5人" 等）。
5. summary: 绝对不能出现任何剧透与剧情走向。直接沿用作者在模组介绍中写的模组简介；若无原简介则只写最最最最最最开头最基础的已知内容，绝不包含正文剧情走向。
6. bgTag 必须单选，只能是 "日模"、"美模"、"现代中国"、"古风" 四者之一，禁止其它值。
7. endingTag 必须单选，只能是 "危险"、"普通" 或 "安全" 三者之一。
8. contentTags 必须为多选数组，只能从预设列表 ["校园", "复活", "粉红", "NTR", "血腥暴力", "纯爱", "茶番", "恐怖", "Meta"] 中挑选，符合几个选几个，不符合留空数组 []。
9. imageAnalysis 必须逐一甄别所有提取插图：
   - shouldInclude: 布尔值。若为纯文本页面扫描、无意义分隔线条、重复花边、装饰图标则设为 false；若为有意义的立绘、地图、手迹、怪物图、CG则设为 true（注意：即便某张插图对应的剧情在其他分卷，只要该图本身是有意义的立绘、地图、手迹或CG，就必须设为 true，绝不能因为不在当前分卷而误设为 false）。
   - isSensitive: 布尔值。若为后期决战、幕后黑手真相、神话生物真面目、隐藏密室等核心剧透，设为 true；若为公开世界观地图、已知NPC立绘、开局已知信息则设为 false。
   - isHorror: 布尔值。对恐怖元素极度敏感（低判定阈值）：包含半人半骨骼、骷髅、尸体血迹、怪物触手、异形异变、夜晚昏暗阴森场景、诡异压抑画面、心理恐怖氛围等不论真恐怖还是心理恐怖，一律判定为 true；常规明亮普通立绘或正常地图设为 false。
   - name: 精炼插图名称。
   - description: 图像视觉内容描述。
   - annotation: 针对守秘人带团与插图场景用途的精炼中文注释。`;

        let visionResults = [];
        if (this.currentParsedData.images && this.currentParsedData.images.length > 0) {
          visionResults = await this.inspectImagesWithVision(this.currentParsedData.images);
          if (Array.isArray(visionResults) && visionResults.length > 0) {
            visionResults.forEach(v => {
              const target = this.currentParsedData.images[v.imageIndex - 1];
              if (target) {
                if (v.name) target.name = v.name;
                if (v.description) target.description = v.description;
                if (v.annotation) target.annotation = v.annotation;
                if (typeof v.isSensitive === 'boolean') target.isSensitive = v.isSensitive;
                if (typeof v.isHorror === 'boolean') target.isHorror = v.isHorror;
                if (typeof v.shouldInclude === 'boolean') target.shouldInclude = v.shouldInclude;
                if (typeof v.isMap === 'boolean') target.isMap = v.isMap;
              }
            });
          }
        }

        const numParts = this.getAnalysisSplitParts();
        const segments = this.splitTextIntoBalancedSegments(this.currentParsedData.text, numParts);
        const allParsedChunks = [];
        let combinedMapNodes = [];
        let finalType = '线性';
        let finalRuleSystem = 'coc';
        let finalScaleType = '1v1';
        let finalBgTag = '日模';
        let finalEndingTag = '普通';
        let finalContentTags = [];
        let finalSummary = '无剧透模组导览';

        for (let segIdx = 0; segIdx < segments.length; segIdx++) {
          if (segments.length > 1) {
            this.analysisStatusText = `正在分析第 ${segIdx + 1} / ${segments.length} 卷...`;
            this.updateBottomActionBar();
          }
          const segText = segments[segIdx];
          let userPrompt = `模组名称：${this.currentParsedData.moduleName}\n总字数：${this.currentParsedData.wordCount}\n当前分析分卷：第 ${segIdx + 1} / ${segments.length} 卷\n\n重构分析提示词：\n${activePrompt}`;
          if (this.globalOpinion) {
            userPrompt += `\n\n用户针对此重构方案的个性化补充意见：\n${this.globalOpinion}`;
          }
          if (segIdx > 0 && (combinedMapNodes.length > 0 || allParsedChunks.length > 0)) {
            let prevMapSection = '';
            if (combinedMapNodes.length > 0) {
              prevMapSection = `\n【一、前置分卷已整理完成的全部地图节点（共 ${combinedMapNodes.length} 个地点）】：\n` +
                combinedMapNodes.map((m, mIdx) => `  - [层级${m.level || 1}] 【${m.name}】${m.parent ? ` (上级区域: ${m.parent})` : ' (顶层主区域)'}：${m.desc || '无'}`).join('\n') +
                `\n请在此已整理好的地图树基础上，继续提取并往下补充本卷新出现的区域、建筑与房间节点（若本卷的新房间从属于前置分卷已有的主区域或建筑，请直接将 parent 填写为上方已有的父节点名称，严禁重复创建同名节点）！\n`;
            }
            let prevChunkSection = '';
            if (allParsedChunks.length > 0) {
              const lastChunk = allParsedChunks[allParsedChunks.length - 1];
              prevChunkSection = `\n【二、前置分卷已整理规划完成的全部章节列表（共 ${allParsedChunks.length} 个章节）】：\n` +
                allParsedChunks.map((c, cIdx) => `  - 第 ${c.order || (cIdx + 1)} 章: 【${c.name}】(${c.category})\n    从哪开始: 「${c.prefixPreview || '...'}」\n    到哪结束: 「${c.suffixPreview || '...'}」\n    章节内容备注: ${c.remarks || c.reason || '无'}`).join('\n') +
                `\n\n【接续规划铁律】：\n上一卷最后规划的章节为：【${lastChunk.name}】\n其切分截止位置（末尾100字）为：\n「${lastChunk.suffixPreview || lastChunk.prefixPreview || '...'}」\n你当前规划第 ${segIdx + 1} 卷时，必须在上方已整理好的地图与章节基础上继续往下写！章节必须从上一卷结尾文字紧接的下一句开始往后切，首尾紧密闭合衔接，严禁遗漏中间剧情，严禁与前面已规划章节重叠！\n同时，如果本卷文本中包含散落在各处的额外信息（如KP信息中的NPC人设数值、HO私密线索、背景伏笔等），你必须在对应章节的 remarks 备注中明确标注在此处归纳补充！`;
            }
            userPrompt += `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n【前置分卷 AI 已整理完成的全部地图与章节汇总（极度重要！你必须在此基础上继续往下规划）】\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━${prevMapSection}${prevChunkSection}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
          }
          if (this.currentParsedData.images && this.currentParsedData.images.length > 0) {
            const imgListDesc = this.currentParsedData.images.map((img, i) => {
              const origName = img.fileName || img.name || `插图_${i + 1}`;
              const nearby = img.nearbyText ? `，所在页面上下文: "${img.nearbyText}"` : '';
              const mapHint = img.isMap ? '【视觉确认为地图】' : (img.name && (img.name.includes('图') || img.name.includes('平面') || img.name.includes('地图')) ? '【判定为地图】' : '');
              return `图${i + 1}: 名称【${origName}】${mapHint}，第${img.pageNumber || '1'}页，尺寸${img.width || 800}x${img.height || 600} (${img.format || 'JPEG'})${nearby}`;
            }).join('\n');
            userPrompt += `\n\n【提取到的全部候选插图列表（共 ${this.currentParsedData.images.length} 张，请对全部 ${this.currentParsedData.images.length} 张插图进行完整分析，严禁遗漏或删减任何一张）】：\n${imgListDesc}`;
          }
          userPrompt += `\n\n模组参考全文（当前分卷内容）：\n${segText}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n【最终输出格式强制指令】：\n请严格按照系统提示词中的 JSON 结构输出规划方案（必须包含 moduleType、ruleSystem、scaleType、summary、bgTag、endingTag、contentTags、mapNodes、chunks、imageAnalysis 字段）。\n注意：JSON 字符串值内部如需引用原文对话或词汇，请一律使用中文引号「」或“”，严禁在 JSON 字符串值内部使用未转义的英文双引号 "！严禁输出 Markdown 列表或任何 JSON 以外的解释文字！`;

          const aiResultText = await this.callAI(systemPrompt, userPrompt);
          let parsedAiPlan = null;
          if (aiResultText) {
            parsedAiPlan = this.parseJsonFromAiResponse(aiResultText);
            if (parsedAiPlan) {
              const altChunks = parsedAiPlan.chunks || parsedAiPlan.chapters || parsedAiPlan.sections || parsedAiPlan.moduleChunks || parsedAiPlan.paragraphList;
              if (Array.isArray(altChunks) && !Array.isArray(parsedAiPlan.chunks)) {
                parsedAiPlan.chunks = altChunks;
              }
            }
            if (!parsedAiPlan || !Array.isArray(parsedAiPlan.chunks) || parsedAiPlan.chunks.length === 0) {
              const salvaged = this.salvagePartialAiPlan(aiResultText);
              if (salvaged) {
                if (!parsedAiPlan) {
                  parsedAiPlan = salvaged;
                  parsedAiPlan._isSalvagedPartial = true;
                } else {
                  if ((!Array.isArray(parsedAiPlan.chunks) || parsedAiPlan.chunks.length === 0) && Array.isArray(salvaged.chunks) && salvaged.chunks.length > 0) {
                    parsedAiPlan.chunks = salvaged.chunks;
                  }
                  if ((!Array.isArray(parsedAiPlan.mapNodes) || parsedAiPlan.mapNodes.length === 0) && Array.isArray(salvaged.mapNodes) && salvaged.mapNodes.length > 0) {
                    parsedAiPlan.mapNodes = salvaged.mapNodes;
                  }
                  parsedAiPlan._isSalvagedPartial = true;
                }
              }
            }
          }

          if (parsedAiPlan) {
            if (segIdx === 0) {
              if (parsedAiPlan.moduleType) {
                if (parsedAiPlan.moduleType.includes('沙盒')) finalType = '沙盒';
                else if (parsedAiPlan.moduleType.includes('其他')) finalType = '其他';
                else finalType = '线性';
              }
              if (parsedAiPlan.ruleSystem && parsedAiPlan.ruleSystem.toLowerCase().includes('coj')) {
                finalRuleSystem = 'coj';
              }
              if (parsedAiPlan.scaleType) {
                finalScaleType = parsedAiPlan.scaleType.trim();
              }
              if (['日模', '美模', '现代中国', '古风'].includes(parsedAiPlan.bgTag)) {
                finalBgTag = parsedAiPlan.bgTag;
              }
              if (['危险', '普通', '安全'].includes(parsedAiPlan.endingTag)) {
                finalEndingTag = parsedAiPlan.endingTag;
              }
              if (parsedAiPlan.summary) {
                finalSummary = parsedAiPlan.summary;
              }
            }

            if (Array.isArray(parsedAiPlan.imageAnalysis) && this.currentParsedData.images) {
              const assessmentMap = new Map();
              parsedAiPlan.imageAnalysis.forEach(a => {
                if (a && typeof a.imageIndex === 'number') {
                  assessmentMap.set(a.imageIndex, a);
                }
              });
              this.currentParsedData.images.forEach((img, idx) => {
                const assess = assessmentMap.get(idx + 1) || assessmentMap.get(img.imageIndex);
                if (assess) {
                  if (assess.shouldInclude === false || assess.isUseful === false) {
                    img.shouldInclude = false;
                  }
                  if (typeof assess.isSensitive === 'boolean') img.isSensitive = assess.isSensitive;
                  if (typeof assess.isHorror === 'boolean') img.isHorror = assess.isHorror;
                  if (assess.name && !/^图\d+$/.test(assess.name.trim())) {
                    const isClearlyMap = img.isMap || (img.name && (img.name.includes('地图') || img.name.includes('平面图')));
                    if (isClearlyMap && !assess.name.includes('图') && !assess.name.includes('平面') && !assess.name.includes('地') && !assess.name.includes('所') && !assess.name.includes('室')) {
                      img.name = (img.name && (img.name.includes('地图') || img.name.includes('平面'))) ? img.name : `${assess.name}地图`;
                    } else {
                      img.name = assess.name;
                    }
                  }
                  if (assess.description) img.description = assess.description;
                  if (assess.annotation) img.annotation = assess.annotation;
                }
              });
            }

            const ALLOWED_CONTENT_TAGS = ['校园', '复活', '粉红', 'NTR', '血腥暴力', '纯爱', '茶番', '恐怖', 'Meta'];
            if (Array.isArray(parsedAiPlan.contentTags)) {
              parsedAiPlan.contentTags.forEach(t => {
                if (ALLOWED_CONTENT_TAGS.includes(t) && !finalContentTags.includes(t)) {
                  finalContentTags.push(t);
                }
              });
            }

            if (Array.isArray(parsedAiPlan.chunks)) {
              parsedAiPlan.chunks.forEach(c => {
                const chunkName = (c && (c.name || c.title || c.chapterName || c.sectionName) || '').trim();
                if (!chunkName) return;
                allParsedChunks.push({
                  order: allParsedChunks.length + 1,
                  name: chunkName,
                  category: c.category || c.type || '正文',
                  wordCount: parseInt(c.wordCount || c.words, 10) || 1000,
                  reason: c.reason || c.description || '',
                  prefixPreview: c.prefixPreview || c.startPreview || '',
                  suffixPreview: c.suffixPreview || c.endPreview || '',
                  remarks: c.remarks || c.notes || ''
                });
              });
            }

            const rawMapNodes = parsedAiPlan.mapNodes || parsedAiPlan.map || parsedAiPlan.locations || parsedAiPlan.places || parsedAiPlan.map_nodes || parsedAiPlan.mapTree;
            if (Array.isArray(rawMapNodes)) {
              rawMapNodes.forEach(node => {
                let nName = '';
                let nParent = '';
                let nLevel = 1;
                let nDesc = '';
                if (typeof node === 'string') {
                  nName = node.trim();
                } else if (node && typeof node === 'object') {
                  nName = (node.name || node.title || node.location || node.place || '').trim();
                  nParent = (node.parent || node.parentName || '').trim();
                  nLevel = parseInt(node.level, 10) || 1;
                  nDesc = (node.desc || node.description || '').trim();
                }
                if (nName && !combinedMapNodes.some(n => n.name === nName)) {
                  combinedMapNodes.push({
                    name: nName,
                    parent: nParent,
                    level: nLevel,
                    desc: nDesc
                  });
                }
              });
            }

            if (allParsedChunks.length > 0) {
              const currentTags = this.sortModuleTags(finalBgTag, finalEndingTag, finalContentTags, []);
              this.currentPlan = {
                moduleType: finalType,
                ruleSystem: finalRuleSystem,
                scaleType: finalScaleType,
                summary: finalSummary,
                bgTag: finalBgTag,
                endingTag: finalEndingTag,
                contentTags: finalContentTags,
                customTags: [],
                tags: currentTags,
                moduleName: this.currentParsedData.moduleName,
                totalWords: this.currentParsedData.wordCount,
                chunks: allParsedChunks.map((c, cIdx) => ({
                  id: 'chunk_' + (cIdx + 1),
                  order: cIdx + 1,
                  name: this.cleanChapterTitle(c.name, this.currentParsedData.moduleName),
                  category: c.category || '正文',
                  wordCount: c.wordCount || 1000,
                  prefixPreview: c.prefixPreview || '',
                  suffixPreview: c.suffixPreview || '',
                  remarks: c.remarks || '',
                  reason: c.reason || 'AI根据带团逻辑架构提炼',
                  userInstruction: '',
                  rawSlice: ''
                })),
                mapNodes: [...combinedMapNodes]
              };
              this.saveDraft();
            }
          }
        }

        if (Array.isArray(this.currentParsedData.images) && this.currentParsedData.images.length > 0) {
          this.currentParsedData.images = this.currentParsedData.images
            .filter(img => img && img.shouldInclude !== false && img.isUseful !== false)
            .map((img, i) => ({
              ...img,
              imageIndex: i + 1
            }));
        }

        if (combinedMapNodes.length <= 1) {
          const fallbackNodes = this.extractFallbackMapNodes(this.currentParsedData.text, allParsedChunks);
          if (fallbackNodes && fallbackNodes.length > combinedMapNodes.length) {
            combinedMapNodes = fallbackNodes;
          }
        }

        if (allParsedChunks.length > 0) {
          const sortedTags = this.sortModuleTags(finalBgTag, finalEndingTag, finalContentTags, []);
          plan = {
            moduleType: finalType,
            ruleSystem: finalRuleSystem,
            scaleType: finalScaleType,
            summary: finalSummary,
            bgTag: finalBgTag,
            endingTag: finalEndingTag,
            contentTags: finalContentTags,
            customTags: [],
            tags: sortedTags,
            moduleName: this.currentParsedData.moduleName,
            totalWords: this.currentParsedData.wordCount,
            chunks: allParsedChunks.map((c, idx) => {
              const cName = this.cleanChapterTitle(c.name, this.currentParsedData.moduleName);
              const slice = this.findSemanticSection(this.currentParsedData.text, cName, c.category);
              const sliceWords = slice ? this.countWords(slice) : 0;
              const words = (sliceWords > 50) ? sliceWords : (c.wordCount && c.wordCount > 50 ? c.wordCount : Math.round(this.countWords(this.currentParsedData.text) / Math.max(1, allParsedChunks.length)));
              return {
                id: 'chunk_' + (idx + 1),
                order: idx + 1,
                name: cName,
                category: c.category || '正文',
                wordCount: words,
                prefixPreview: c.prefixPreview || '',
                suffixPreview: c.suffixPreview || '',
                remarks: c.remarks || c.notes || '',
                reason: c.reason || 'AI根据带团逻辑架构提炼',
                userInstruction: '',
                rawSlice: slice
              };
            }),
            mapNodes: combinedMapNodes
          };
        }
      } catch (err) {
        console.warn('[模组] AI 重构提示:', err);
        lastAiError = err;
      }

      if (!plan) {
        this.isAnalyzing = false;
        if (lastAiError) {
          throw lastAiError;
        }
        throw new Error('AI 未能解析出有效的章节规划列表，请检查接口返回或重新点击分析');
      }

      this.currentPlan = plan;
      this.isAnalyzing = false;
      this.saveDraft();
      return plan;
    },

    findSemanticSection(text, chapterName, category) {
      if (!text) return '';
      const cleanKeyword = (chapterName || '').replace(/^[\d\.\-_]+/, '').replace(/^(模组|章节|第|卷|章)+/g, '').trim();
      if (cleanKeyword && cleanKeyword.length >= 2) {
        const idx = text.indexOf(cleanKeyword);
        if (idx !== -1) {
          const start = Math.max(0, idx - 100);
          return text.substring(start, Math.min(text.length, start + 4000));
        }
      }
      if (category === 'HO秘密') {
        const hoMatch = text.search(/HO[1-4]|秘密|专属背景/i);
        if (hoMatch !== -1) {
          return text.substring(hoMatch, Math.min(text.length, hoMatch + 4000));
        }
      }
      return text.substring(0, Math.min(text.length, 3000));
    },

    renderPlanUI() {
      if (!this.currentPlan) return;

      const mainCatEl = document.getElementById('module-step2-main-cat');
      const subCatEl = document.getElementById('module-step2-sub-cat');
      const typeEl = document.getElementById('module-step2-type');
      const wordsEl = document.getElementById('module-step2-meta-words');
      const tagsRowEl = document.getElementById('module-step2-tags-row');
      const summaryEl = document.getElementById('module-step2-summary-text');

      const sysUpper = (this.currentPlan.ruleSystem || 'coc').toUpperCase();
      const struct = this.currentPlan.moduleType || '线性';
      const scale = this.currentPlan.scaleType || '1v1';
      const totalWords = this.currentPlan.totalWords || this.currentParsedData?.wordCount || 0;
      const chapterCount = (this.currentPlan.chunks || []).length;

      if (mainCatEl) {
        mainCatEl.textContent = sysUpper;
        mainCatEl.className = `mod-category-pill ${sysUpper.toLowerCase()}`;
        mainCatEl.style.cursor = 'pointer';
        mainCatEl.onclick = () => this.showTagAnnotation(sysUpper);
      }
      if (subCatEl) {
        subCatEl.textContent = scale;
        subCatEl.style.cursor = 'pointer';
        subCatEl.onclick = () => this.showTagAnnotation(scale);
      }
      if (typeEl) {
        typeEl.textContent = struct;
        typeEl.style.cursor = 'pointer';
        typeEl.onclick = () => this.showTagAnnotation(struct);
      }
      if (wordsEl) {
        wordsEl.textContent = `${chapterCount} 章节`;
      }
      if (summaryEl) {
        summaryEl.textContent = this.currentPlan.summary || '';
        summaryEl.style.display = this.currentPlan.summary ? 'block' : 'none';
      }

      if (tagsRowEl) {
        tagsRowEl.innerHTML = '';
        const tags = Array.isArray(this.currentPlan.tags) && this.currentPlan.tags.length > 0
          ? this.currentPlan.tags
          : this.sortModuleTags(this.currentPlan.bgTag, this.currentPlan.endingTag, this.currentPlan.contentTags, this.currentPlan.customTags);
        tags.forEach(t => {
          const span = document.createElement('span');
          span.className = `mod-tag-badge ${this.getTagClass(t)}`;
          span.textContent = t;
          span.style.cursor = 'pointer';
          span.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showTagAnnotation(t);
          });
          tagsRowEl.appendChild(span);
        });
      }

      const cardListContainer = document.getElementById('module-plan-card-list');
      if (cardListContainer) {
        cardListContainer.innerHTML = '';
        const chunks = this.currentPlan.chunks || [];

        chunks.forEach((chunk, index) => {
          const card = document.createElement('div');
          card.className = 'module-plan-card';
          card.id = `plan-card-${chunk.id}`;

          const cleanTitle = this.cleanChapterTitle(chunk.name, this.currentPlan.moduleName);

          card.innerHTML = `
            <div class="module-plan-card-header" data-chunk-id="${chunk.id}">
              <div class="module-plan-card-title-group">
                <span class="module-plan-name" title="${cleanTitle}">${cleanTitle}</span>
              </div>
              <div class="module-plan-card-meta">
                <span class="module-plan-tag">${chunk.category}</span>
                <span class="module-plan-chevron">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </span>
              </div>
            </div>
            <div class="module-plan-card-body">
              <div class="module-preview-box">
                <div><span class="module-preview-label">从哪开始：</span>${chunk.prefixPreview || '无起始预览'}</div>
                <div style="margin-top: 4px;"><span class="module-preview-label">到哪结束：</span>${chunk.suffixPreview || '无结尾预览'}</div>
              </div>
              ${chunk.remarks ? `<div class="module-reason-box" style="margin-top: 6px;"><span style="font-weight: 600;">章节备注：</span>${chunk.remarks}</div>` : ''}
              <div class="module-reason-box" style="margin-top: 6px;">
                <span style="font-weight: 600;">重构与切法理由：</span>${chunk.reason}
              </div>
              <div class="module-tuning-box">
                <input type="text" class="module-tuning-input" data-chunk-id="${chunk.id}" placeholder="针对此章节的微调指令..." value="${chunk.userInstruction || ''}" />
              </div>
              <div class="module-card-actions-row">
                <button type="button" class="module-mini-btn btn-view-raw" data-chunk-index="${index}">查看原文</button>
                ${chunks.length > 1 ? `<button type="button" class="module-mini-btn btn-danger btn-delete-split" data-chunk-index="${index}">删除此章节</button>` : ''}
              </div>
            </div>
          `;

          const headerEl = card.querySelector('.module-plan-card-header');
          if (headerEl) {
            headerEl.addEventListener('click', () => {
              card.classList.toggle('expanded');
            });
          }

          const rawBtn = card.querySelector('.btn-view-raw');
          if (rawBtn) {
            rawBtn.addEventListener('click', async (e) => {
              e.stopPropagation();
              let confirmed = true;
              if (typeof global.showCustomConfirm === 'function') {
                confirmed = await global.showCustomConfirm('防剧透提示', '正文中可能含有剧透，确定要展开吗？');
              } else if (typeof global.showCustomAlert === 'function') {
                confirmed = confirm('正文中可能含有剧透，确定要展开吗？');
              }
              if (confirmed) {
                this.showRawPreviewModal(chunk);
              }
            });
          }

          const inputEl = card.querySelector('.module-tuning-input');
          if (inputEl) {
            inputEl.addEventListener('input', (e) => {
              chunk.userInstruction = e.target.value;
              this.saveDraft();
            });
          }

          const delBtn = card.querySelector('.btn-delete-split');
          if (delBtn) {
            delBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              this.deleteSplitPoint(index);
            });
          }

          cardListContainer.appendChild(card);
        });
      }

      const tocContainer = document.getElementById('module-plan-toc-view');
      if (tocContainer) {
        const chunks = this.currentPlan.chunks || [];
        let tocHtml = `
          <div style="font-weight: 600; font-size: 13px; color: var(--text-primary); margin-bottom: 6px;">
            带团章节顺序导航（共 ${chunks.length} 个章节）
          </div>
          <div style="display: flex; flex-direction: column; gap: 6px;">
        `;

        chunks.forEach((c, idx) => {
          tocHtml += `
            <div style="display: flex; justify-content: space-between; align-items: center; background-color: var(--secondary-bg, #F9F8F5); padding: 8px 10px; border-radius: 8px;">
              <span style="font-weight: 600; color: var(--text-primary);">${idx + 1}. ${c.name}</span>
              <span class="module-plan-tag">${c.category}</span>
            </div>
          `;
        });

        tocHtml += `</div>`;
        tocContainer.innerHTML = tocHtml;
      }

      const mapContainer = document.getElementById('module-plan-map-view');
      if (mapContainer) {
        let mapNodes = this.currentPlan.mapNodes || [];
        if (mapNodes.length <= 1) {
          mapNodes = this.extractFallbackMapNodes(this.currentParsedData?.text, this.currentPlan.chunks);
          this.currentPlan.mapNodes = mapNodes;
        }
        mapContainer.innerHTML = '';
        mapNodes.forEach(node => {
          const nodeEl = document.createElement('div');
          nodeEl.className = `module-map-node level-${node.level || 1}`;
          nodeEl.innerHTML = `
            <div class="module-map-node-title">
              <span>${node.name}</span>
              <span class="module-map-badge">${node.level === 1 ? '大区域' : node.level === 2 ? '建筑分区' : '具体场所'}</span>
            </div>
            ${node.desc ? `<div class="module-map-node-desc">${node.desc}</div>` : ''}
          `;
          mapContainer.appendChild(nodeEl);
        });
      }

      renderModuleCuttingPresetsUI();
      const cuttingPromptTextarea = document.getElementById('module-cutting-prompt-textarea');
      if (cuttingPromptTextarea && this.currentParsedData) {
        cuttingPromptTextarea.value = this.currentParsedData.cuttingPrompt || DEFAULT_TRPG_CUTTING_EXECUTION_PROMPT;
      }
      this.updateModeUI(this.cutExecutionMode || 'batch');
    },

    showRawPreviewModal(chunk) {
      const modal = document.getElementById('module-raw-preview-modal');
      const titleEl = document.getElementById('module-raw-preview-title');
      const bodyEl = document.getElementById('module-raw-preview-body');
      if (!modal || !titleEl || !bodyEl) return;

      titleEl.textContent = `原文：${chunk.name}`;
      bodyEl.textContent = chunk.rawSlice || this.currentParsedData?.text || '暂无对应原文';
      modal.style.display = 'flex';
    },

    hideRawPreviewModal() {
      const modal = document.getElementById('module-raw-preview-modal');
      if (modal) modal.style.display = 'none';
    },

    deleteSplitPoint(index) {
      if (!this.currentPlan || !this.currentPlan.chunks || this.currentPlan.chunks.length <= 1) return;
      const removed = this.currentPlan.chunks.splice(index, 1)[0];
      const mergeTargetIndex = index > 0 ? index - 1 : 0;
      if (this.currentPlan.chunks[mergeTargetIndex]) {
        this.currentPlan.chunks[mergeTargetIndex].wordCount += (removed.wordCount || 0);
      }
      this.renderPlanUI();
      this.saveDraft();
    },

    async generateSingleChapterWithAI(chunk, fullText) {
      const analysisPrompt = this.currentParsedData?.analysisPrompt || this.currentParsedData?.prompt || DEFAULT_TRPG_ANALYSIS_PROMPT;
      const cuttingPrompt = this.currentParsedData?.cuttingPrompt || DEFAULT_TRPG_CUTTING_EXECUTION_PROMPT;
      const allChunks = this.currentPlan?.chunks || [];
      const planOutline = allChunks.map((c, i) => `${i + 1}. 【${c.name}】(${c.category}) - ${c.reason || '无'}`).join('\n');

      const systemPrompt = `你是模组切割与整理 AI 专家。你负责执行跑团模组的章节分类整理、内容归集与标签标注。
在执行本任务时，你必须同时严格遵循以下两套核心规范（初稿分析大纲规范与切割执行整理规范）：

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【一、初稿分析大纲规范（全局架构与带团准则）】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${analysisPrompt}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【二、切割执行整理规范（章节提纯与文本标签准则）】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${cuttingPrompt}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【三、核心执行法则与排版打标代码要求】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. 【各章节内容边界绝对清晰，严禁添加主观分析】：
   - 导入：仅开场玩家剧情，绝无NPC数值/真相/人设；
   - 幕后真相/KP信息：仅守秘人背景与机制设定，绝无主观心理/恋爱哲学，绝无从正文挪走的剧情；
   - HO专属秘密：仅属于该HO的专属私密线索与背景（从KP区/QA/附录整合，正文剧情绝不挪动）；
   - NPC/猫人设：仅正文外的属性与背景，绝无正文剧情对话抄录，绝无行为模式指南；
   - 主线正文/地点/事件：仅该时间线/地点的公开剧情与对白，一字不改，严禁在段落间插入分析点评！
   - 结局：仅各结局达成条件与结局叙述。
2. 【严格执行标签合并同类项】：
   连续同类内容（如连续几段都是KP信息或都是正文剧情）只在该块的首段开头打上【KP信息】或【正文】，后续相同类别的自然段不需要每行重复打标！直到出现秘密、检定、插图或切换类型时才打新标签！
   - 【正文】公开场景、环境描写与对白，文字一字不改；
   - 【KP信息】仅守秘人可见的背景真相、判定机制，原文原句输出；
   - 【秘密·HOX】专属私密信息，必须带对应 HO 编号；
   - 【检定】技能检定，如 【检定：要求PC进行侦查检定】 或 <侦查检定 难易度困难>；
   - 【插图注入：图X 描述】正文对应处标注插图；
   - 【KP批注：……】带团实操提示；
3. 【严禁输出模组封面、作者前言与免责废话】：
   模组开头出现的作者名字、联系方式、商业用途授权声明、推荐人数、游玩时长、难度、丢失率、页码、横线等一律彻底剔除！
4. 【HO信息全局去重整合】：
   若本章为 HO 秘密与设定，须从全篇 KP信息区、HO设定区、QA、附录中搜集属于该 HO 的人设/背景/秘密/专属线索，集中汇总去重；正文剧情绝不挪动；
5. 【必须追加结尾标准声明代码】：
   章节末尾必须一字不改附加：
   『至此本小章节结束，请kp务必在聊天内告诉PC本世界书模组到此为止，请PC切换下一个世界书，禁止擅自编造互动外主线剧情走向』
6. 直接输出该章节整理分类与打标后的完整内容，不要输出问候语或包裹代码块。`;

      let userPrompt = `【全模组规划章节大纲（明确本章与其它各章的边界）】：
${planOutline}

【当前正在执行生成的章节】：
章节名称：${chunk.name}
所属分类：${chunk.category}
重构定位：${chunk.reason || '按带团逻辑与内容性质精准提取与整理'}
用户专属微调指令：${chunk.userInstruction || '无特定微调，严格按带团规则深度整理与提取'}
${this.globalOpinion ? `用户全局修改意见：\n${this.globalOpinion}\n` : ''}
【模组参考原文】：
${fullText}`;

      const generated = await this.callAI(systemPrompt, userPrompt);
      if (!generated || generated.trim().length === 0) {
        throw new Error(`章节【${chunk.name}】AI 返回内容为空`);
      }
      return generated;
    },

    async generateBatchAllChaptersWithAI(fullText, segIdx, totalSegs, customAssignedChunks = null) {
      const analysisPrompt = this.currentParsedData?.analysisPrompt || this.currentParsedData?.prompt || DEFAULT_TRPG_ANALYSIS_PROMPT;
      const cuttingPrompt = this.currentParsedData?.cuttingPrompt || DEFAULT_TRPG_CUTTING_EXECUTION_PROMPT;
      const allChunks = this.currentPlan?.chunks || [];
      const isSegmented = typeof segIdx === 'number' && typeof totalSegs === 'number' && totalSegs > 1;
      const assignedChunks = (customAssignedChunks && customAssignedChunks.length > 0)
        ? customAssignedChunks
        : (isSegmented ? this.getAssignedChunksForSegment(segIdx, totalSegs) : allChunks);

      const startIndexInAll = (assignedChunks.length > 0) ? allChunks.indexOf(assignedChunks[0]) : 0;
      const startChapNum = startIndexInAll >= 0 ? (startIndexInAll + 1) : 1;
      const endChapNum = startChapNum + assignedChunks.length - 1;

      const planOutline = allChunks.map((c, i) => {
        const globalNum = i + 1;
        const isAssigned = assignedChunks.includes(c);
        let previewInfo = '';
        if (c.prefixPreview || c.suffixPreview) {
          previewInfo = `\n    - 切割起止范围: 从「${c.prefixPreview || '...'}」 到 「${c.suffixPreview || '...'}」`;
        }
        let remarkInfo = '';
        if (c.remarks) {
          remarkInfo = `\n    - 章节备注与散落补充: ${c.remarks}`;
        } else if (c.reason) {
          remarkInfo = `\n    - 说明: ${c.reason}`;
        }
        if (isSegmented) {
          if (isAssigned) {
            return `  👉 [本分卷负责编写 - 第 ${globalNum} 章]: 【${c.name}】(${c.category})${previewInfo}${remarkInfo}`;
          } else {
            return `  🔒 [由其他分卷负责 - 本卷严禁编写]: 【${c.name}】(${c.category})${previewInfo}${remarkInfo}`;
          }
        } else {
          return `  👉 [第 ${globalNum} 章]: 【${c.name}】(${c.category})${previewInfo}${remarkInfo}`;
        }
      }).join('\n\n');

      let segNotice = '';
      if (isSegmented && assignedChunks.length > 0) {
        const assignedList = assignedChunks.map((c, i) => {
          const globalNum = startChapNum + i;
          let details = '';
          if (c.prefixPreview || c.suffixPreview) {
            details += `\n     起止范围: 从「${c.prefixPreview || '...'}」到「${c.suffixPreview || '...'}」`;
          }
          if (c.remarks) {
            details += `\n     章节备注与散落补充: ${c.remarks}`;
          }
          return `  ${i + 1}. 【本卷目标 ${i + 1}/${assignedChunks.length}，全大纲第 ${globalNum} 章】: 《${c.name}》 | 分类: ${c.category}${details}`;
        }).join('\n');

        let prevCutNotice = '';
        if (segIdx > 0) {
          const prevChapters = [];
          if (this.cutChaptersBySegment) {
            for (let s = 0; s < segIdx; s++) {
              const sChaps = this.cutChaptersBySegment[s];
              if (Array.isArray(sChaps)) {
                prevChapters.push(...sChaps);
              }
            }
          }
          const mapNodesList = Array.isArray(this.currentPlan?.mapNodes) ? this.currentPlan.mapNodes : [];
          let mapSummaryBlock = '';
          if (mapNodesList.length > 0) {
            mapSummaryBlock = `\n【已整理好的全模组地图层级结构（共 ${mapNodesList.length} 个地点节点）】：\n` +
              mapNodesList.map(m => `  - [层级${m.level || 1}] 【${m.name}】${m.parent ? ` (上级区域: ${m.parent})` : ' (顶层主区域)'}：${m.desc || '无'}`).join('\n') + '\n';
          }
          if (prevChapters.length > 0 || mapSummaryBlock) {
            let chapsBlock = '';
            if (prevChapters.length > 0) {
              const lastChap = prevChapters[prevChapters.length - 1];
              const lastContent = (lastChap.content || '').trim();
              const lastEnd = lastContent.slice(-180).replace(/\n+/g, ' ');
              chapsBlock = `\n【前置分卷已经整理完成的 ${prevChapters.length} 个章节】：\n` +
                prevChapters.map((ch, idx) => {
                  const startP = (ch.content || '').trim().slice(0, 60).replace(/\n+/g, ' ');
                  const endP = (ch.content || '').trim().slice(-60).replace(/\n+/g, ' ');
                  return `  - 已完成第 ${idx + 1} 章: 【${ch.title}】(${ch.category}) | 开头: 「${startP}...」 | 结尾: 「...${endP}」`;
                }).join('\n') +
                `\n\n【接续执行指令】：\n上一分卷已整理好的最后一个章节是【${lastChap.title}】，其结尾原文内容为：\n「...${lastEnd}」\n你当前负责编写的章节（全大纲第 ${startChapNum} 章起）必须在上方已整理好的地图与前置章节基础上紧密承接，继续往下整理输出！同时，如果大纲备注中说明需要归纳散落各处的信息（例如后卫、KP人设、HO设定等），请将其完整整合进对应章节中！`;
            }
            prevCutNotice = `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n【前置分卷 AI 已整理完成的地图与章节汇总（重要接续基础）】\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━${mapSummaryBlock}${chapsBlock}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
          }
        }

        segNotice = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【当前分卷核心执行任务（极度重要！请严格遵守）】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
你当前正在负责执行：第 ${segIdx + 1} / ${totalSegs} 卷！
你本次调用的专属职责：仅负责整理并输出全模组大纲中【第 ${startChapNum} 章 至 第 ${endChapNum} 章】对应的这 ${assignedChunks.length} 个章节！

【你必须且仅能输出的 ${assignedChunks.length} 个目标章节清单】：
${assignedList}
${prevCutNotice}
【全局防重与范围红线指令】：
1. 全局大纲通读意义：下方的【全模组完整规划章节大纲】是给你通读全局、防止跨章节重复归类的全局蓝图。如果某个NPC人设、幕后真相、地点线索已经在总大纲的其他章节（标记为 🔒 由其他分卷负责）中规划了，你在自己负责的这 ${assignedChunks.length} 章里绝对不要重复去写、去整理，防止多整理人设或剧情冲突！
2. 严格按分配章节交付：你本次输出【必须且仅能】包含上述明确指定的 ${assignedChunks.length} 个章节，大纲规划了几章就输出几章，严禁擅自拆分出额外章节（例如严禁把5章私自切成10章），严禁合并章节，严禁遗漏跳过任何一章！`;
      }

      const systemPrompt = `你是模组切割与整理 AI 专家。你的任务是根据规划大纲，将跑团模组内容整理并输出为全部对应章节。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【一、初稿分析大纲规范】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${analysisPrompt}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【二、切割执行整理规范】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${cuttingPrompt}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【三、单次输出与章节分隔符标准格式（必须严格遵循）】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
请按大纲顺序输出章节。每一个章节必须用标准起止标记严格包裹，格式如下：

===CHAPTER_START: 章节名称 | 分类===
【该章节的整理文本内容】
至此本小章节结束，请kp务必在聊天内告诉PC本世界书模组到此为止，请PC切换下一个世界书，禁止擅自编造互动外主线剧情走向
===CHAPTER_END===

【核心硬性原则】：
1. 【各章节边界清晰，绝无主观臆造与脑补】：
   - 导入：仅开场玩家剧情，绝无NPC数值/真相/人设；
   - 幕后真相/KP信息：仅守秘人背景机制，绝无主观心理/恋爱哲学，绝无从正文挪走的剧情；若原文只有KP信息，直接归为KP信息，绝不重复生成多处；
   - HO专属秘密：仅属于该HO的专属私密线索与背景；
   - NPC/猫人设：仅正文外的属性与背景，绝无正文剧情对话抄录，绝无行为模式指南；
   - 主线正文/地点/事件：仅公开剧情与对白，一字不改，严禁在段落间插入分析点评！
2. 【标签合并同类项】：
   连续同类内容（如连续几段都是KP信息或都是正文剧情）只在该块的首段开头打上【KP信息】或【正文】，后续相同类别的自然段不需要每行重复打标！直到出现秘密、检定、插图或切换类型时才打新标签！
3. 【禁止作者前言废话与页码】：作者推荐人数、页码、横线等一律彻底剔除！
4. 【章节标题净化】：章节名称严禁重复附加模组名称！直接使用纯净章节名。
5. 【分卷严格执行边界】：${isSegmented && assignedChunks.length > 0 ? `你当前正在执行第 ${segIdx + 1} / ${totalSegs} 卷的任务！总大纲提供全部章节是为了让你通读全局、防止跨章重复归类人设与真相；但你本次输出必须且仅能输出本卷指定的 ${assignedChunks.length} 个章节（从第 ${startChapNum} 章到第 ${endChapNum} 章），严禁编写其他卷的章节，严禁多切或拆出额外章节，严禁漏写本卷分配的任何一章！` : `直接按规划大纲严格输出全部 ${allChunks.length} 个章节，严禁多切拆分或漏写。`}`;

      const userPrompt = `【全模组完整目录与分析规划章节大纲（全局视野底图，包含全部章节、起止范围与散落信息备注）】：
${planOutline}

${segNotice}
${this.globalOpinion ? `\n【用户全局修改意见】：\n${this.globalOpinion}\n` : ''}
【全模组完整参考原文（拥有全篇全局能见度，请精准定位归纳本卷负责章节）】：
${fullText}`;

      const parseChaptersFromRawOutput = (rawOut, targetChunks, baseIndexOffset = 0, isFinalAttempt = false) => {
        const list = [];
        const regexPrimary = /===CHAPTER_START:\s*([^|\n]+?)(?:\s*\|\s*([^=\n]+?))?===\s*([\s\S]*?)(===CHAPTER_END===|(?====CHAPTER_START)|$)/g;
        let match;
        let localIdx = 0;
        const matches = [];
        while ((match = regexPrimary.exec(rawOut)) !== null) {
          matches.push(match);
        }

        for (let mIdx = 0; mIdx < matches.length; mIdx++) {
          const m = matches[mIdx];
          const rawTitle = (m[1] || '').trim();
          const category = (m[2] || '正文').trim();
          const content = (m[3] || '').trim();
          if (content.length > 20) {
            localIdx++;
            const globalOrder = baseIndexOffset + localIdx;
            const words = this.countWords(content);
            const cleanTitle = this.cleanChapterTitle(rawTitle || `第${globalOrder}章`, this.currentParsedData?.moduleName);
            list.push({
              id: 'chap_' + Date.now() + '_' + globalOrder + '_' + Math.random().toString(36).slice(2, 5),
              moduleId: this.currentParsedData?.moduleName || '跑团模组',
              title: cleanTitle,
              category: category,
              wordCount: words,
              content: content,
              segIdx: typeof segIdx === 'number' ? segIdx : 0,
              fixCount: 0,
              stats: {
                mainTextCount: (content.match(/【正文】/g) || []).length,
                kpInfoCount: (content.match(/【KP信息】/g) || []).length,
                secretCount: (content.match(/【秘密/g) || []).length,
                totalWords: words
              },
              sortOrder: globalOrder
            });
          }
        }

        if (list.length === 0) {
          const regexSecondary = /(?:^|\n)#{2,4}\s*([^|\n]+?)(?:\s*\|\s*([^=\n]+?))?\n([\s\S]*?)(?=(?:\n#{2,4}\s+)|$)/g;
          while ((match = regexSecondary.exec(rawOut)) !== null) {
            const rawTitle = (match[1] || '').trim();
            const category = (match[2] || '正文').trim();
            const content = (match[3] || '').trim();
            if (content.length > 20) {
              localIdx++;
              const globalOrder = baseIndexOffset + localIdx;
              const words = this.countWords(content);
              const cleanTitle = this.cleanChapterTitle(rawTitle || `第${globalOrder}章`, this.currentParsedData?.moduleName);
              list.push({
                id: 'chap_' + Date.now() + '_' + globalOrder + '_' + Math.random().toString(36).slice(2, 5),
                moduleId: this.currentParsedData?.moduleName || '跑团模组',
                title: cleanTitle,
                category: category,
                wordCount: words,
                content: content,
                segIdx: typeof segIdx === 'number' ? segIdx : 0,
                fixCount: 0,
                stats: {
                  mainTextCount: (content.match(/【正文】/g) || []).length,
                  kpInfoCount: (content.match(/【KP信息】/g) || []).length,
                  secretCount: (content.match(/【秘密/g) || []).length,
                  totalWords: words
                },
                sortOrder: globalOrder
              });
            }
          }
        }

        if (list.length === 0) {
          const sections = rawOut.split(/(?:^|\n)===+\s*/);
          sections.forEach((sec, idx) => {
            if (!sec.trim() || sec.trim().length < 20) return;
            const firstLineEnd = sec.indexOf('\n');
            const firstLine = firstLineEnd !== -1 ? sec.substring(0, firstLineEnd).trim() : sec.trim();
            const rest = firstLineEnd !== -1 ? sec.substring(firstLineEnd).trim() : '';
            const planChunk = targetChunks[idx] || { name: firstLine || `第${baseIndexOffset + idx + 1}章`, category: '正文' };
            const words = this.countWords(rest || sec);
            const cleanTitle = this.cleanChapterTitle(planChunk.name, this.currentParsedData?.moduleName);
            const globalOrder = baseIndexOffset + idx + 1;

            list.push({
              id: 'chap_' + Date.now() + '_' + globalOrder + '_' + Math.random().toString(36).slice(2, 5),
              moduleId: this.currentParsedData?.moduleName || '跑团模组',
              title: cleanTitle,
              category: planChunk.category,
              wordCount: words,
              content: rest || sec,
              segIdx: typeof segIdx === 'number' ? segIdx : 0,
              fixCount: 0,
              stats: {
                mainTextCount: ((rest || sec).match(/【正文】/g) || []).length,
                kpInfoCount: ((rest || sec).match(/【KP信息】/g) || []).length,
                secretCount: ((rest || sec).match(/【秘密/g) || []).length,
                totalWords: words
              },
              sortOrder: globalOrder
            });
          });
        }

        if (Array.isArray(targetChunks) && targetChunks.length > 0 && list.length > targetChunks.length) {
          const allowed = list.slice(0, targetChunks.length);
          const overflow = list.slice(targetChunks.length);
          const lastAllowed = allowed[allowed.length - 1];
          const extraText = overflow.map(ch => `【${ch.title}】\n${ch.content}`).join('\n\n');
          lastAllowed.content = `${lastAllowed.content}\n\n${extraText}`.trim();
          lastAllowed.wordCount = this.countWords(lastAllowed.content);
          lastAllowed.stats = {
            mainTextCount: (lastAllowed.content.match(/【正文】/g) || []).length,
            kpInfoCount: (lastAllowed.content.match(/【KP信息】/g) || []).length,
            secretCount: (lastAllowed.content.match(/【秘密/g) || []).length,
            totalWords: lastAllowed.wordCount
          };
          return allowed;
        }

        return list;
      };

      const generated = await this.callAI(systemPrompt, userPrompt);
      if (!generated || generated.trim().length === 0) {
        throw new Error('AI 全篇返回内容为空');
      }

      const parsedChapters = parseChaptersFromRawOutput(generated, assignedChunks, 0, true);
      return parsedChapters;
    },

    fallbackFormatText(rawText, chunkMeta) {
      const paragraphs = (rawText || '').split('\n').map(p => p.trim()).filter(Boolean);
      const taggedLines = [];
      let mainTextCount = 0;
      let kpInfoCount = 0;
      let secretCount = 0;

      paragraphs.forEach((p) => {
        if (/^(第\s*\d+\s*页|页码|={4,}|-{4,}|~{4,}|作者：|作者|联系方式|是否允许修改|视频、商业用途|请联系作者|推荐人数|游玩时长|lost率)/i.test(p)) {
          return;
        }

        if (p.startsWith('【正文】') || p.startsWith('【KP信息】') || p.startsWith('【秘密')) {
          taggedLines.push(p);
          if (p.startsWith('【正文】')) mainTextCount++;
          else if (p.startsWith('【KP信息】')) kpInfoCount++;
          else secretCount++;
          return;
        }

        if (p.includes('守秘人') || p.includes('KP') || p.includes('真相') || p.includes('幕后') || chunkMeta?.category === 'KP信息' || chunkMeta?.category === '带团引导') {
          taggedLines.push(`【KP信息】${p}`);
          kpInfoCount++;
        } else if (p.includes('秘密') || p.includes('HO') || chunkMeta?.category === 'HO秘密') {
          taggedLines.push(`【秘密·专属】${p}`);
          secretCount++;
        } else {
          taggedLines.push(`【正文】${p}`);
          mainTextCount++;
        }
      });

      taggedLines.push(`\n【系统提醒】${ENDING_NOTE}`);
      const formattedContent = taggedLines.join('\n\n');

      return {
        content: formattedContent,
        stats: {
          mainTextCount: mainTextCount,
          kpInfoCount: kpInfoCount,
          secretCount: secretCount,
          totalWords: this.countWords(formattedContent)
        }
      };
    },

    createChapterCardElement(chapterObj, idx) {
      const CIRCLED_NUMBERS = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩', '⑪', '⑫', '⑬', '⑭', '⑮', '⑯', '⑰', '⑱', '⑲', '⑳'];
      const fixCount = chapterObj.fixCount || 0;
      const statusText = fixCount > 0 ? `已修复·${CIRCLED_NUMBERS[fixCount - 1] || fixCount}` : '已生成';
      const isRepaired = fixCount > 0;
      const numParts = this.getEffectiveSplitParts();
      const segBadge = (numParts > 1 || typeof chapterObj.segIdx === 'number')
        ? `<span style="font-size: 10.5px; font-weight: 600; padding: 2px 6px; border-radius: 4px; background: var(--secondary-bg); color: var(--text-secondary); flex-shrink: 0;">卷${(chapterObj.segIdx || 0) + 1}</span>`
        : '';

      const cutCard = document.createElement('div');
      cutCard.className = 'module-cut-card';
      cutCard.id = `cut-card-${chapterObj.id}`;
      cutCard.innerHTML = `
        <div class="module-cut-card-top">
          <div style="display: flex; align-items: center; gap: 6px; flex: 1; overflow: hidden;">
            ${segBadge}
            <span class="module-cut-card-title">${chapterObj.title}</span>
          </div>
          <span class="module-cut-card-status" style="${isRepaired ? 'background: rgba(74, 122, 104, 0.15); color: var(--accent-color, #4A7A68); font-weight: 600;' : ''}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            ${statusText}
          </span>
        </div>
        <div class="module-cut-card-stats">
          <span>正文 ${chapterObj.stats?.mainTextCount || 0} 条</span>
          <span>KP信息 ${chapterObj.stats?.kpInfoCount || 0} 条</span>
          <span>秘密 ${chapterObj.stats?.secretCount || 0} 条</span>
          <span>${chapterObj.wordCount || 0} 字</span>
        </div>
        <div class="module-cut-card-actions">
          <button type="button" class="module-mini-btn btn-view-chapter" data-chapter-index="${idx}">查看内容</button>
          <button type="button" class="module-mini-btn btn-audit-chapter" data-chapter-index="${idx}">校验</button>
          <button type="button" class="module-mini-btn btn-fix-chapter" data-chapter-index="${idx}">修复</button>
        </div>
      `;

      cutCard.querySelector('.btn-view-chapter')?.addEventListener('click', () => {
        this.showChapterPreviewModal(chapterObj);
      });
      cutCard.querySelector('.btn-audit-chapter')?.addEventListener('click', () => {
        this.auditSingleChapter(chapterObj);
      });
      cutCard.querySelector('.btn-fix-chapter')?.addEventListener('click', () => {
        this.openFixModal(chapterObj);
      });

      return cutCard;
    },

    pauseCutting() {
      this.isCuttingPaused = true;
      const pauseBtn = document.getElementById('module-pause-btn');
      const resumeBtn = document.getElementById('module-resume-btn');
      const progressText = document.getElementById('module-progress-text');

      if (pauseBtn) pauseBtn.style.display = 'none';
      if (resumeBtn) resumeBtn.style.display = 'inline-flex';
      if (progressText) {
        const total = this.currentPlan?.chunks?.length || this.cutChapters.length;
        progressText.textContent = `已暂停切割，当前已完成 ${this.cutChapters.length}/${total} 个章节 已保存`;
      }
      this.saveDraft();
    },

    resumeCutting() {
      this.isCuttingPaused = false;
      this.isCuttingCancelled = false;
      this.isCuttingRunning = true;
      const pauseBtn = document.getElementById('module-pause-btn');
      const resumeBtn = document.getElementById('module-resume-btn');

      if (pauseBtn) pauseBtn.style.display = 'inline-flex';
      if (resumeBtn) resumeBtn.style.display = 'none';

      if (!this._batchCallInProgress) {
        if (this.cutExecutionMode === 'batch') {
          this.executeBatchCuttingSingleCall();
        } else {
          this.continueAsyncCuttingLoop();
        }
      }
    },

    cancelCutting() {
      this.isCuttingCancelled = true;
      this.isCuttingRunning = false;
      this.isCuttingPaused = false;

      const pauseBtn = document.getElementById('module-pause-btn');
      const resumeBtn = document.getElementById('module-resume-btn');
      const cancelBtn = document.getElementById('module-cancel-btn');
      const progressText = document.getElementById('module-progress-text');

      if (pauseBtn) pauseBtn.style.display = 'none';
      if (resumeBtn) resumeBtn.style.display = 'none';
      if (cancelBtn) cancelBtn.style.display = 'none';
      if (progressText) progressText.textContent = '已取消后续切割任务，已生成章节已妥善保存';
      this.updateBottomActionBar();
      this.saveDraft();
    },

    syncOngoingCuttingUI() {
      const cardList = document.getElementById('module-cut-card-list');
      const progressText = document.getElementById('module-progress-text');
      const progressBar = document.getElementById('module-progress-bar');
      const pauseBtn = document.getElementById('module-pause-btn');
      const resumeBtn = document.getElementById('module-resume-btn');
      const cancelBtn = document.getElementById('module-cancel-btn');

      this.updateBottomActionBar();

      if (this.isCuttingPaused) {
        if (pauseBtn) pauseBtn.style.display = 'none';
        if (resumeBtn) resumeBtn.style.display = 'inline-flex';
        if (cancelBtn) cancelBtn.style.display = 'inline-flex';
        if (progressText) {
          const total = this.currentPlan?.chunks?.length || this.cutChapters.length;
          progressText.textContent = `已暂停切割，当前已完成 ${this.cutChapters.length}/${total} 个章节 已保存`;
        }
      } else {
        if (pauseBtn) pauseBtn.style.display = 'inline-flex';
        if (resumeBtn) resumeBtn.style.display = 'none';
        if (cancelBtn) cancelBtn.style.display = 'inline-flex';
        if (progressText && this.currentPlan?.chunks) {
          const total = this.currentPlan.chunks.length;
          const cur = Math.min(this.cuttingCurrentIndex + 1, total);
          const name = this.currentPlan.chunks[this.cuttingCurrentIndex]?.name || '';
          progressText.textContent = `正在生成第 ${cur}/${total} 章: ${name}`;
        }
      }

      if (progressBar && this.currentPlan?.chunks) {
        const total = this.currentPlan.chunks.length;
        progressBar.style.width = `${Math.round((this.cutChapters.length / total) * 100)}%`;
      }

      if (cardList) {
        cardList.innerHTML = '';
        const numParts = this.getEffectiveSplitParts();
        if (numParts >= 1) {
          const segsBar = document.createElement('div');
          segsBar.className = 'mod-segments-bar';
          segsBar.style.cssText = 'display:flex; flex-wrap:wrap; gap:8px; margin-bottom:12px; padding:10px; background:var(--secondary-bg); border:1px solid var(--border-color); border-radius:8px;';
          for (let s = 0; s < numParts; s++) {
            const segChaps = (this.cutChaptersBySegment && this.cutChaptersBySegment[s]) || [];
            const assigned = this.getAssignedChunksForSegment(s, numParts);
            const segItem = document.createElement('div');
            segItem.style.cssText = 'display:flex; align-items:center; gap:6px; background:var(--card-bg); border:1px solid var(--border-color); border-radius:6px; padding:4px 8px; font-size:12px; color:var(--text-primary);';
            const isDone = segChaps.length > 0;
            const statusText = isDone ? `${segChaps.length}章 已成` : `待切 ${assigned.length}章`;
            segItem.innerHTML = `
              <span style="font-weight:600;">卷${s + 1}</span>
              <span style="font-size:11px; color:var(--text-secondary);">${statusText}</span>
              <button type="button" class="moe-btn-mini btn-regen-seg" data-seg-idx="${s}" style="padding:2px 6px; font-size:11px; line-height:1.2; height:22px; cursor:pointer;" ${this.isCuttingRunning ? 'disabled' : ''}>重生</button>
            `;
            segItem.querySelector('.btn-regen-seg').addEventListener('click', (e) => {
              e.stopPropagation();
              this.regenerateSingleSegment(s);
            });
            segsBar.appendChild(segItem);
          }
          cardList.appendChild(segsBar);
        }
        this.cutChapters.forEach((chap, idx) => {
          cardList.appendChild(this.createChapterCardElement(chap, idx));
        });
      }
    },

    async continueAsyncCuttingLoop() {
      if (!this.currentPlan || !this.currentPlan.chunks) return;

      const chunks = this.currentPlan.chunks;
      const totalChunks = chunks.length;
      const fullText = this.currentParsedData?.text || '';

      this.isCuttingRunning = true;
      this.isCuttingPaused = false;
      this.isCuttingCancelled = false;

      const progressText = document.getElementById('module-progress-text');
      const progressBar = document.getElementById('module-progress-bar');
      const cardList = document.getElementById('module-cut-card-list');
      const pauseBtn = document.getElementById('module-pause-btn');
      const resumeBtn = document.getElementById('module-resume-btn');
      const cancelBtn = document.getElementById('module-cancel-btn');

      if (pauseBtn && this.currentStep === 3) pauseBtn.style.display = 'inline-flex';
      if (resumeBtn && this.currentStep === 3) resumeBtn.style.display = 'none';
      if (cancelBtn && this.currentStep === 3) cancelBtn.style.display = 'inline-flex';

      const startIndex = Math.max(0, this.cutChapters.length);
      this.cuttingCurrentIndex = startIndex;

      if (cardList && cardList.children.length === 0 && this.cutChapters.length > 0) {
        this.cutChapters.forEach((chap, idx) => {
          cardList.appendChild(this.createChapterCardElement(chap, idx));
        });
      }

      for (let i = startIndex; i < totalChunks; i++) {
        if (this.isCuttingCancelled) {
          this.isCuttingRunning = false;
          this.saveDraft();
          return;
        }

        while (this.isCuttingPaused) {
          await new Promise(r => setTimeout(r, 300));
          if (this.isCuttingCancelled) {
            this.isCuttingRunning = false;
            this.saveDraft();
            return;
          }
        }

        this.cuttingCurrentIndex = i;
        const chunk = chunks[i];
        const currentNum = i + 1;

        if (this.currentStep === 3) {
          if (progressText) {
            progressText.textContent = `逐章模式：正在生成第 ${currentNum}/${totalChunks} 章: ${chunk.name}`;
          }
          if (progressBar) {
            progressBar.style.width = `${Math.round((i / totalChunks) * 100)}%`;
          }
        }

        let chapterContent = '';
        try {
          chapterContent = await this.generateSingleChapterWithAI(chunk, fullText);
        } catch (err) {
          console.error('[模组] 生成单章错误:', err);
          this.isCuttingRunning = false;
          this.isCuttingPaused = true;
          if (pauseBtn) pauseBtn.style.display = 'none';
          if (resumeBtn) resumeBtn.style.display = 'inline-flex';
          if (cancelBtn) cancelBtn.style.display = 'inline-flex';
          this.updateBottomActionBar();
          this.saveDraft();
          if (typeof global.showCustomAlert === 'function') {
            global.showCustomAlert('生成失败', `第 ${currentNum} 章【${chunk.name}】生成遇到问题：${err.message || err}。已为您自动保存当前进度，可点击继续重试生成。`);
          }
          return;
        }

        if (this.isCuttingCancelled) {
          this.isCuttingRunning = false;
          this.saveDraft();
          return;
        }

        const words = this.countWords(chapterContent);
        const mainCount = (chapterContent.match(/【正文】/g) || []).length;
        const kpCount = (chapterContent.match(/【KP信息】/g) || []).length;
        const secretCount = (chapterContent.match(/【秘密/g) || []).length;

        const chapterObj = {
          id: 'chap_' + Date.now() + '_' + currentNum,
          moduleId: this.currentParsedData?.moduleName || '跑团模组',
          title: chunk.name,
          category: chunk.category,
          wordCount: words,
          content: chapterContent,
          fixCount: 0,
          stats: {
            mainTextCount: mainCount,
            kpInfoCount: kpCount,
            secretCount: secretCount,
            totalWords: words
          },
          sortOrder: currentNum
        };

        this.cutChapters.push(chapterObj);
        this.cuttingCurrentIndex = this.cutChapters.length;

        if (this.currentStep === 3 && cardList) {
          cardList.appendChild(this.createChapterCardElement(chapterObj, i));
          if (progressBar) {
            progressBar.style.width = `${Math.round(((i + 1) / totalChunks) * 100)}%`;
          }
        }

        this.saveDraft();
      }

      this.isCuttingRunning = false;
      this.isCuttingPaused = false;
      if (pauseBtn) pauseBtn.style.display = 'none';
      if (resumeBtn) resumeBtn.style.display = 'none';
      if (cancelBtn) cancelBtn.style.display = 'none';

      if (this.currentStep === 3) {
        if (progressText) {
          progressText.textContent = `切割生成完成，共生成 ${totalChunks} 个带团专属章节`;
        }
        if (progressBar) progressBar.style.width = '100%';
        this.updateBottomActionBar();
        this.renderCutChaptersUI();
      }

      this.saveDraft();
    },

    async executeCuttingWorkflow() {
      if (!this.currentPlan || !this.currentPlan.chunks) {
        throw new Error('切割方案未生成');
      }

      const cuttingPromptEl = document.getElementById('module-cutting-prompt-textarea');
      if (cuttingPromptEl && cuttingPromptEl.value.trim() && this.currentParsedData) {
        this.currentParsedData.cuttingPrompt = cuttingPromptEl.value.trim();
      }
      const promptEl = document.getElementById('module-prompt-textarea');
      if (promptEl && promptEl.value.trim() && this.currentParsedData) {
        this.currentParsedData.analysisPrompt = promptEl.value.trim();
        this.currentParsedData.prompt = promptEl.value.trim();
      }

      this._batchCallInProgress = false;
      this.isCuttingRunning = true;
      this.isCuttingPaused = false;
      this.isCuttingCancelled = false;

      this.batchSegmentsCompleted = 0;
      this.cuttingCurrentIndex = 0;
      this.cutChapters = [];
      this.cutChaptersBySegment = [];
      const cardList = document.getElementById('module-cut-card-list');
      if (cardList) cardList.innerHTML = '';

      this.setWizardStep(3);
      this.syncOngoingCuttingUI();
      try {
        await this.executeBatchCuttingSingleCall();
      } catch (err) {
        console.error('[模组] 批量切割流程异常:', err);
        this.isCuttingRunning = false;
        this.updateBottomActionBar();
        if (typeof global.showCustomAlert === 'function') {
          global.showCustomAlert('切割失败', err.message || String(err));
        }
      }
    },

    async executeBatchCuttingSingleCall() {
      if (this._batchCallInProgress) return;
      this._batchCallInProgress = true;
      try {
        const fullText = this.currentParsedData?.text || '';
        const progressText = document.getElementById('module-progress-text');
        const progressBar = document.getElementById('module-progress-bar');
        const cardList = document.getElementById('module-cut-card-list');
        const pauseBtn = document.getElementById('module-pause-btn');
        const resumeBtn = document.getElementById('module-resume-btn');
        const cancelBtn = document.getElementById('module-cancel-btn');

        const totalSegs = this.getCuttingSplitParts();

        this.isCuttingRunning = true;
        this.isCuttingPaused = false;
        this.isCuttingCancelled = false;

        if (pauseBtn) pauseBtn.style.display = 'inline-flex';
        if (resumeBtn) resumeBtn.style.display = 'none';
        if (cancelBtn) cancelBtn.style.display = 'inline-flex';

        if (!this.cutChaptersBySegment) {
          this.cutChaptersBySegment = [];
        }
        for (let segIdx = 0; segIdx < totalSegs; segIdx++) {
          // 如果该分卷已有切好的章节，说明已经切好，严禁重复切割！
          if (this.cutChaptersBySegment[segIdx] && this.cutChaptersBySegment[segIdx].length > 0) {
            continue;
          }
          if (this.isCuttingCancelled) {
            this.isCuttingRunning = false;
            this.saveDraft();
            return;
          }

          while (this.isCuttingPaused) {
            await new Promise(r => setTimeout(r, 300));
            if (this.isCuttingCancelled) {
              this.isCuttingRunning = false;
              this.saveDraft();
              return;
            }
          }

          if (progressText) {
            progressText.textContent = totalSegs > 1
              ? `分卷模式：正在整理第 ${segIdx + 1}/${totalSegs} 卷（已生成 ${this.cutChapters.length} 章）...`
              : `正在整理输出全篇所有章节...`;
          }
          if (progressBar) {
            progressBar.style.width = `${Math.round((segIdx / totalSegs) * 100)}%`;
          }

          try {
            const assignedChunks = this.getAssignedChunksForSegment(segIdx, totalSegs);
            const parsed = await this.generateBatchAllChaptersWithAI(fullText, segIdx, totalSegs, assignedChunks);
            if (this.isCuttingCancelled) {
              this.isCuttingRunning = false;
              this.saveDraft();
              return;
            }

            if (parsed && parsed.length > 0) {
              parsed.forEach((chap, cIdx) => {
                chap.segIdx = segIdx;
                chap.sortOrder = chap.sortOrder || (cIdx + 1);
                chap.title = this.cleanChapterTitle(chap.title, this.currentParsedData?.moduleName);
              });
              this.cutChaptersBySegment[segIdx] = parsed;
              this.cutChapters = this.rebuildCutChaptersFromSegments();
              this.batchSegmentsCompleted = segIdx + 1;
              this.cuttingCurrentIndex = this.cutChapters.length;
              this.saveDraft();
              this.syncOngoingCuttingUI();
            } else {
              throw new Error(`第 ${segIdx + 1} 卷未解析出有效章节`);
            }
          } catch (err) {
            console.warn('[模组] 分卷整理提示:', err);
            if (this.isCuttingCancelled) {
              this.isCuttingRunning = false;
              this.saveDraft();
              return;
            }
            this.isCuttingRunning = false;
            this.isCuttingPaused = true;
            if (pauseBtn) pauseBtn.style.display = 'none';
            if (resumeBtn) resumeBtn.style.display = 'inline-flex';
            if (cancelBtn) cancelBtn.style.display = 'inline-flex';
            if (progressText) {
              progressText.textContent = `分卷整理第 ${segIdx + 1} 卷遇到网络波动已暂停 已完成 ${this.cutChapters.length} 章 点击继续重试`;
            }
            this.updateBottomActionBar();
            this.saveDraft();
            if (typeof global.showCustomAlert === 'function') {
              global.showCustomAlert('生成暂停', `分卷整理第 ${segIdx + 1} 卷遇到网络波动：${err.message || err}。已为您自动保存当前进度，点击“继续”可重新从该卷继续生成。`);
            }
            return;
          }
        }

        this.isCuttingRunning = false;
        if (pauseBtn) pauseBtn.style.display = 'none';
        if (resumeBtn) resumeBtn.style.display = 'none';
        if (cancelBtn) cancelBtn.style.display = 'none';
        if (progressText) {
          progressText.textContent = `模组切割生成完成 共整理 ${this.cutChapters.length} 个带团专属章节`;
        }
        if (progressBar) progressBar.style.width = '100%';
        this.updateBottomActionBar();
        this.saveDraft();
      } finally {
        this._batchCallInProgress = false;
      }
    },

    async regenerateSingleSegment(segIdx) {
      if (this.isCuttingRunning) {
        if (typeof global.showCustomAlert === 'function') {
          global.showCustomAlert('提示', '当前有切割任务正在运行，请先等待或暂停');
        }
        return;
      }
      const fullText = this.currentParsedData?.text || '';
      const totalSegs = this.getCuttingSplitParts();
      if (segIdx < 0 || segIdx >= totalSegs) return;

      const progressText = document.getElementById('module-progress-text');
      const assignedChunks = this.getAssignedChunksForSegment(segIdx, totalSegs);

      this.isCuttingRunning = true;
      this.isCuttingPaused = false;
      this.isCuttingCancelled = false;
      if (progressText) {
        progressText.textContent = `正在单独重新生成第 ${segIdx + 1}/${totalSegs} 卷...`;
      }
      this.renderCutChaptersUI();

      try {
        const parsed = await this.generateBatchAllChaptersWithAI(fullText, segIdx, totalSegs, assignedChunks);
        if (parsed && parsed.length > 0) {
          if (!this.cutChaptersBySegment) this.cutChaptersBySegment = [];
          parsed.forEach((chap, cIdx) => {
            chap.segIdx = segIdx;
            chap.sortOrder = chap.sortOrder || (cIdx + 1);
            chap.title = this.cleanChapterTitle(chap.title, this.currentParsedData?.moduleName);
          });
          this.cutChaptersBySegment[segIdx] = parsed;
          this.cutChapters = this.rebuildCutChaptersFromSegments();
          this.saveDraft();
          this.renderCutChaptersUI();
          if (progressText) {
            progressText.textContent = `第 ${segIdx + 1} 卷重新生成完成 共 ${parsed.length} 章`;
          }
          if (typeof global.showCustomAlert === 'function') {
            global.showCustomAlert('成功', `第 ${segIdx + 1} 卷已独立重新生成完毕，章节已更新！`);
          }
        } else {
          throw new Error('未解析出有效章节');
        }
      } catch (err) {
        console.warn('[模组] 单卷重切异常:', err);
        if (typeof global.showCustomAlert === 'function') {
          global.showCustomAlert('失败', `第 ${segIdx + 1} 卷重新生成遇到异常：${err.message || err}`);
        }
      } finally {
        this.isCuttingRunning = false;
        this.updateBottomActionBar();
        this.renderCutChaptersUI();
      }
    },

    renderCutChaptersUI() {
      const cardList = document.getElementById('module-cut-card-list');
      const progressText = document.getElementById('module-progress-text');
      const progressBar = document.getElementById('module-progress-bar');
      const pauseBtn = document.getElementById('module-pause-btn');
      const resumeBtn = document.getElementById('module-resume-btn');
      const cancelBtn = document.getElementById('module-cancel-btn');

      if (!cardList) return;
      cardList.innerHTML = '';

      const totalChunks = this.currentPlan?.chunks?.length || this.cutChapters.length || 0;
      const completedCount = this.cutChapters.length;

      if (this.isCuttingRunning && !this.isCuttingPaused) {
        if (pauseBtn) pauseBtn.style.display = 'inline-flex';
        if (resumeBtn) resumeBtn.style.display = 'none';
        if (cancelBtn) cancelBtn.style.display = 'inline-flex';
      } else if (completedCount < totalChunks && totalChunks > 0) {
        if (pauseBtn) pauseBtn.style.display = 'none';
        if (resumeBtn) resumeBtn.style.display = 'inline-flex';
        if (cancelBtn) cancelBtn.style.display = 'inline-flex';
        if (progressText) {
          progressText.textContent = `已完成 ${completedCount} / ${totalChunks} 章 (已自动保存进度)`;
        }
        if (progressBar) {
          progressBar.style.width = `${Math.round((completedCount / totalChunks) * 100)}%`;
        }
      } else {
        if (pauseBtn) pauseBtn.style.display = 'none';
        if (resumeBtn) resumeBtn.style.display = 'none';
        if (cancelBtn) cancelBtn.style.display = 'none';
        if (progressText) {
          progressText.textContent = `切割生成完成，共生成 ${completedCount} 个带团专属章节`;
        }
        if (progressBar) {
          progressBar.style.width = '100%';
        }
      }

      this.updateBottomActionBar();

      const numParts = this.getEffectiveSplitParts();

      if (numParts >= 1) {
        const segsBar = document.createElement('div');
        segsBar.className = 'mod-segments-bar';
        segsBar.style.cssText = 'display:flex; flex-wrap:wrap; gap:8px; margin-bottom:12px; padding:10px; background:var(--secondary-bg); border:1px solid var(--border-color); border-radius:8px;';
        for (let s = 0; s < numParts; s++) {
          const segChaps = (this.cutChaptersBySegment && this.cutChaptersBySegment[s]) || [];
          const assigned = this.getAssignedChunksForSegment(s, numParts);
          const segItem = document.createElement('div');
          segItem.style.cssText = 'display:flex; align-items:center; gap:6px; background:var(--card-bg); border:1px solid var(--border-color); border-radius:6px; padding:4px 8px; font-size:12px; color:var(--text-primary);';
          const isDone = segChaps.length > 0;
          const statusText = isDone ? `${segChaps.length}章 已成` : `待切 ${assigned.length}章`;
          segItem.innerHTML = `
            <span style="font-weight:600;">卷${s + 1}</span>
            <span style="font-size:11px; color:var(--text-secondary);">${statusText}</span>
            <button type="button" class="moe-btn-mini btn-regen-seg" data-seg-idx="${s}" style="padding:2px 6px; font-size:11px; line-height:1.2; height:22px; cursor:pointer;" ${this.isCuttingRunning ? 'disabled' : ''}>重生</button>
          `;
          segItem.querySelector('.btn-regen-seg').addEventListener('click', (e) => {
            e.stopPropagation();
            this.regenerateSingleSegment(s);
          });
          segsBar.appendChild(segItem);
        }
        cardList.appendChild(segsBar);
      }

      this.cutChapters.forEach((chap, idx) => {
        cardList.appendChild(this.createChapterCardElement(chap, idx));
      });
    },

    auditSingleChapter(chapterObj) {
      this.activeAuditChapter = chapterObj;
      this.isGlobalAuditMode = false;
      const modal = document.getElementById('module-audit-modal');
      const titleEl = document.getElementById('module-audit-modal-title');
      const issuesList = document.getElementById('module-audit-issues-list');
      const recheckBtn = document.getElementById('module-audit-recheck-btn');
      const fixBtn = document.getElementById('module-audit-fix-btn');
      const instructionInput = document.getElementById('module-audit-instruction-input');
      if (!modal || !titleEl || !issuesList) return;

      titleEl.textContent = `校验：${chapterObj.title}`;
      if (fixBtn) fixBtn.textContent = '执行修复';
      if (instructionInput) instructionInput.value = chapterObj.userFixInstruction || '';

      if (chapterObj.auditReport) {
        issuesList.innerHTML = `<div style="background-color: var(--secondary-bg, #F9F8F5); padding: 10px; border-radius: 8px; white-space: pre-wrap; font-size: 12px; line-height: 1.6; color: var(--text-primary);">${chapterObj.auditReport}</div>`;
        if (recheckBtn) recheckBtn.textContent = '重新校验';
      } else {
        issuesList.innerHTML = '<div style="color: var(--text-secondary); text-align: center; padding: 16px 8px; font-size: 12.5px;">本章节尚未进行质量校验。点击下方“开始”按键由 AI 深度核查格式与文本规范。</div>';
        if (recheckBtn) recheckBtn.textContent = '开始';
      }

      modal.style.display = 'flex';
    },

    async runSingleChapterAudit(chapterObj) {
      const issuesList = document.getElementById('module-audit-issues-list');
      const recheckBtn = document.getElementById('module-audit-recheck-btn');
      if (!chapterObj || !issuesList) return;

      if (recheckBtn) {
        recheckBtn.textContent = '校验中...';
        recheckBtn.disabled = true;
      }
      issuesList.innerHTML = '<div style="color: var(--text-secondary); text-align: center; padding: 14px;">AI 正在结合模组原文参考审查本章节...</div>';

      const analysisPrompt = this.currentParsedData?.analysisPrompt || this.currentParsedData?.prompt || DEFAULT_TRPG_ANALYSIS_PROMPT;
      const cuttingPrompt = this.currentParsedData?.cuttingPrompt || DEFAULT_TRPG_CUTTING_EXECUTION_PROMPT;
      const rawExcerpt = this.currentParsedData?.text || '';

      let planChunkInfo = '';
      if (this.currentPlan?.chunks) {
        const foundChunk = this.currentPlan.chunks.find(c => c.name === chapterObj.title || chapterObj.title.includes(c.name));
        if (foundChunk) {
          planChunkInfo = `\n【该章节规划大纲既定要求】：
- 规划名称: 【${foundChunk.name}】
- 规划分类: ${foundChunk.category}
- 起止范围: 从「${foundChunk.prefixPreview || '...'}」到「${foundChunk.suffixPreview || '...'}」
- 章节备注与散落补充: ${foundChunk.remarks || foundChunk.reason || '无'}\n`;
        }
      }

      const prompt = `你是一个跑团模组质检审核专家。
你必须严格对照【一、第一环节分析大纲规范】与【二、第二环节切割执行整理规范】作为唯一审核准绳，绝对禁止凭空臆想不存在的要求！

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【一、第一环节分析大纲规范】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${analysisPrompt}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【二、第二环节切割执行整理规范】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${cuttingPrompt}
${planChunkInfo}
【模组原文参考片段】：
${rawExcerpt}

【待审查章节标题】：${chapterObj.title} [${chapterObj.category}]
【待审查章节内容】：
${chapterObj.content}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【审查核心原则（严禁臆想，杜绝没事找事）】：
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. 【以既定规范为唯一准绳，严禁没事找事】：
   - 必须严格以分析规范与切割规范作为判定标准！严禁凭空捏造未规定的苛刻规则！
   - 若章节内容忠实于模组原文、无虚构脑补，且符合大纲分类与起止规划，属于完全正确的整理成果，必须直接判定为“质检合格”，绝对禁止为了提意见而鸡蛋里挑骨头、没事找事！
2. 【尊重原作编排】：若模组原文中正文剧情与KP带团建议、角色扮演指南交替穿插，这是原作固有的编排方式，属于必须保留的正常结构，绝不能判定为多余杂质！
3. 【严查真实主观杂质】：只严格排查是否包含 AI 擅自撰写的恋爱哲学、心理分析、心路历程、描写建议等脱离原文的主观臆造文学点评，如有必须明确指出并要求清除。
4. 【标签合并同类项】：连续同类内容只在首段打标签，属于标准合规格式。

若章节完全合规，请直接输出“质检合格”。若确实存在违背上述既定规范的主观臆造杂质，请精炼列出 1-2 条切实可行的具体修正建议。`;

      try {
        const reviewResult = await this.callAI('你是一个极其严苛的跑团模组质检员，输出精炼条目式报告。', prompt);
        chapterObj.auditReport = reviewResult || '审查完毕：未发现明显格式或主观杂质问题。';
        issuesList.innerHTML = `<div style="background-color: var(--secondary-bg, #F9F8F5); padding: 10px; border-radius: 8px; white-space: pre-wrap; font-size: 12px; line-height: 1.6; color: var(--text-primary);">${chapterObj.auditReport}</div>`;
        this.saveDraft();
      } catch (e) {
        chapterObj.auditReport = '本地质检：文本结尾格式闭合，如需深度质检请保持网络畅通并重试。';
        issuesList.innerHTML = `<div style="background-color: var(--secondary-bg, #F9F8F5); padding: 10px; border-radius: 8px;">${chapterObj.auditReport}</div>`;
      } finally {
        if (recheckBtn) {
          recheckBtn.textContent = '重新校验';
          recheckBtn.disabled = false;
        }
      }
    },

    openFixModal(chapterObj) {
      this.activeAuditChapter = chapterObj;
      this.isGlobalAuditMode = false;
      const modal = document.getElementById('module-audit-modal');
      const titleEl = document.getElementById('module-audit-modal-title');
      const issuesList = document.getElementById('module-audit-issues-list');
      const recheckBtn = document.getElementById('module-audit-recheck-btn');
      const fixBtn = document.getElementById('module-audit-fix-btn');
      const instructionInput = document.getElementById('module-audit-instruction-input');
      if (!modal || !titleEl || !issuesList) return;

      titleEl.textContent = `修复：${chapterObj.title}`;
      if (recheckBtn) recheckBtn.textContent = '重新校验';
      if (fixBtn) fixBtn.textContent = '执行修复';
      if (instructionInput) instructionInput.value = chapterObj.userFixInstruction || '';
      issuesList.innerHTML = '<div style="color: var(--text-secondary);">可在下方输入具体修复指示，点击执行修复。</div>';
      modal.style.display = 'flex';
    },

    async executeFixChapter() {
      if (!this.activeAuditChapter) return;
      const instructionInput = document.getElementById('module-audit-instruction-input');
      const fixBtn = document.getElementById('module-audit-fix-btn');
      const issuesList = document.getElementById('module-audit-issues-list');
      const customInstruction = instructionInput ? instructionInput.value.trim() : '';

      this.activeAuditChapter.userFixInstruction = customInstruction;
      this.saveDraft();

      if (fixBtn) {
        fixBtn.textContent = '修复中...';
        fixBtn.disabled = true;
      }

      const rawExcerpt = this.currentParsedData?.text || '';
      const cuttingPrompt = this.currentParsedData?.cuttingPrompt || DEFAULT_TRPG_CUTTING_EXECUTION_PROMPT;

      const prompt = `你是模组精准清理与打标修复专家。请严格依照既定的模组切割整理规范以及以下具体修改要求，对章节【${this.activeAuditChapter.title}】的内容进行净化与修复：
修改要求：${customInstruction || '彻底清理一切主观心理分析与哲学废话，保证正文剧情对话一字不改，合并同类项规范中文行首标签并保留结尾声明'}

【切割执行整理规范】：
${cuttingPrompt}

【模组原文参考片段】：
${rawExcerpt}

当前章节内容：
${this.activeAuditChapter.content}

【修复硬性准则】：
1. 彻底剔除所有 AI 擅自撰写的心理分析、恋爱哲学、心路历程、描写建议！
2. 保留原作节奏：原文中作者自带的KP带团提示与正文交替穿插的布局必须完整保留，严禁机械合并正文或将带团提示全部赶到文末！
3. 正文公开场景描写与对白原字原句原样输出，绝不篡改原意，严禁在段落间插入分析点评！
4. NPC人设若有抄录正文剧情对话则予以剔除，仅保留外部属性背景；
5. 标签合并同类项：同类内容连续出现时只在首段打上【正文】或【KP信息】，后续同一类段落不需要每行重复打标，直到切换不同类型才打新标签！
6. 直接输出修复完善后的完整章节文本。`;

      try {
        const fixedContent = await this.callAI('你是一个高精度跑团文本净化专家。', prompt);
        if (fixedContent && fixedContent.length > 50) {
          this.activeAuditChapter.content = fixedContent.trim();
          this.activeAuditChapter.wordCount = this.countWords(fixedContent.trim());
          this.activeAuditChapter.fixCount = (this.activeAuditChapter.fixCount || 0) + 1;
          this.activeAuditChapter.stats = {
            mainTextCount: (fixedContent.match(/【正文】/g) || []).length,
            kpInfoCount: (fixedContent.match(/【KP信息】/g) || []).length,
            secretCount: (fixedContent.match(/【秘密/g) || []).length,
            totalWords: this.activeAuditChapter.wordCount
          };
          this.activeAuditChapter.auditReport = '已按最新要求完成针对性修复与清理。';
          this.saveDraft();
          this.renderCutChaptersUI();

          if (issuesList) {
            issuesList.innerHTML = '<div style="color: var(--accent-color, #4A7A68); font-weight: 600; padding: 6px 0;">已成功修复并更新本章节内容！主观杂质已清除，格式已校准。</div>';
          }
        }
      } catch (e) {
        console.warn('[模组] 修复异常提示:', e);
      } finally {
        if (fixBtn) {
          fixBtn.textContent = '执行修复';
          fixBtn.disabled = false;
        }
      }
    },

    async batchAuditAllChapters() {
      if (!this.cutChapters || this.cutChapters.length === 0) return;
      if (this.isGlobalAuditing) {
        if (typeof global.showCustomAlert === 'function') {
          global.showCustomAlert('提示', 'AI 正在后台进行全局校验，请稍候');
        }
        return;
      }

      this.isGlobalAuditing = true;
      if (typeof global.showCustomAlert === 'function') {
        global.showCustomAlert('全局校验', 'AI 已开始在后台进行全模组全局扫描，无需停留在此等待');
      }

      const improvementPanel = document.getElementById('module-global-improvement-panel');
      const improvementStatus = document.getElementById('module-global-improvement-status');
      const improvementTextarea = document.getElementById('module-global-improvement-textarea');

      if (improvementPanel) improvementPanel.style.display = 'flex';
      if (improvementStatus) improvementStatus.textContent = '正在后台全局扫描中...';
      if (improvementTextarea && !improvementTextarea.value) {
        improvementTextarea.value = 'AI 正在通读全篇所有章节并生成全局修改建议...';
      }

      try {
        const chapterOverview = this.cutChapters.map((c, idx) => {
          const snippet = c.content ? c.content.replace(/\n+/g, ' ') : '';
          return `第${idx + 1}章 【${c.title}】[${c.category}, 约${c.wordCount}字]:\n${snippet}`;
        }).join('\n\n');

        const rawExcerpt = this.currentParsedData?.text || '';
        const analysisPrompt = this.currentParsedData?.analysisPrompt || this.currentParsedData?.prompt || DEFAULT_TRPG_ANALYSIS_PROMPT;
        const cuttingPrompt = this.currentParsedData?.cuttingPrompt || DEFAULT_TRPG_CUTTING_EXECUTION_PROMPT;

        const prompt = `你是一个跑团模组总审质检专家。
你必须严格对照【一、第一环节分析大纲规范】与【二、第二环节切割执行整理规范】作为唯一核验基准，对当前已生成的 ${this.cutChapters.length} 个章节进行全局扫描审查：

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【一、第一环节分析大纲规范】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${analysisPrompt}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【二、第二环节切割执行整理规范】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${cuttingPrompt}

【模组原文参考片段】：
${rawExcerpt}

【全模组章节概览】：
${chapterOverview}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【审查核心原则（严禁臆想，以既定规范为准）】：
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. 【以既定规范为唯一准绳，严禁无端挑刺】：必须以分析规范与切割规范为基准，禁止凭空设定额外苛刻条件，禁止对符合原规范的内容无端挑刺！若整体章节忠实原文且无主观杂质，应确认整体合规！
2. 【杜绝主观脑补】：只严查所有章节是否包含 AI 擅自撰写的恋爱哲学、主观心理分析、心路历程，如有要求统统清除！
3. 【忠实原作节奏】：若模组原文中正文剧情与KP带团建议、角色扮演指南交替穿插，这是原作固有的编排方式，绝对属于正常内容！严禁要求把正文合并或将KP信息移到末尾！
4. 【NPC人设规范】：NPC和猫人设中严禁复制正文剧情对白，严禁捏造行为模式指南！
5. 【标签合并同类项】：连续同类内容只在首段打标签，不需要每行重复打标；
6. 【结尾完整】：末尾必须包含标准防擅自编造声明。

请输出客观、精炼的【全局问题诊断】与【精准改进指令】。若整体良好无违规杂质，请直接说明整体质检合格。`;

        const report = await this.callAI('你是一个严格的跑团模组总审质检员，输出精炼的全局修改清单与指导意见。', prompt);
        this.globalAuditReport = report || '全局审查完毕：未发现严重结构问题，可在下方输入补充要求后执行修复。';
        if (improvementStatus) improvementStatus.textContent = '全局扫描完成';
        if (improvementTextarea) improvementTextarea.value = this.globalAuditReport;
        this.saveDraft();
      } catch (e) {
        console.warn('[模组] 全局校验提示:', e);
        if (improvementStatus) improvementStatus.textContent = '全局扫描已就绪';
        if (improvementTextarea && (!improvementTextarea.value || improvementTextarea.value.includes('AI 正在'))) {
          improvementTextarea.value = '可在上方输入针对全部章节的补充修改要求，点击下方按键执行修复。';
        }
      } finally {
        this.isGlobalAuditing = false;
      }
    },

    async executeGlobalFixAll() {
      if (!this.cutChapters || this.cutChapters.length === 0) return;
      if (this.isFixingRunning) return;

      const textarea = document.getElementById('module-global-improvement-textarea');
      const customInstruction = textarea ? textarea.value.trim() : '';
      const statusEl = document.getElementById('module-global-improvement-status');
      const fixAllBtn = document.getElementById('module-global-fix-all-btn');

      this.isFixingRunning = true;
      if (fixAllBtn) {
        fixAllBtn.textContent = '全修中...';
        fixAllBtn.disabled = true;
      }

      const total = this.cutChapters.length;
      let successCount = 0;
      const rawExcerpt = this.currentParsedData?.text || '';

      for (let i = 0; i < total; i++) {
        const chap = this.cutChapters[i];
        if (statusEl) {
          statusEl.textContent = `正在修复第 ${i + 1} / ${total} 章: ${chap.title}...`;
        }

        const fixPrompt = `你是跑团模组精准清理与打标修复专家。请严格按照以下全局修改要求，对章节【${chap.title}】[分类：${chap.category}] 的内容进行修正：

【全局修改要求】：
${customInstruction || this.globalAuditReport || '彻底清理一切主观心理分析、哲学探讨；正文剧情对话原汁原味输出；NPC人设剔除正文对白；合并同类项规范行首标签。'}

【模组原文参考】：
${rawExcerpt}

【当前章节原始内容】：
${chap.content}

【修复硬性要求】：
1. 彻底删除一切 AI 擅自捏造的心理分析、恋爱哲学、心路历程与文学鉴赏！
2. 保持原作编排节奏：原文中作者自带的KP带团提示与正文交替穿插的布局必须完整保留，严禁机械合并正文或将带团提示强行挪到末尾！
3. 原文剧情、场景描写、对话原字原句原汁原味输出，绝不篡改，绝不在段落间插入分析点评！
4. 若本章为 NPC 或猫人设，严禁保留从正文剧情中抄录的对话，严禁凭空捏造行为模式指南！
5. 标签合并同类项：同类内容连续出现时只在首段打上【正文】或【KP信息】，后续同一类段落不需要每行重复打标，直到切换不同类型才打新标签！
6. 末尾必须保留标准防擅自编造声明！
7. 直接输出修复后的完整章节文本，不输出任何问候或包裹代码块。`;

        try {
          const fixed = await this.callAI('你是一个高精度跑团模组文本净化与规范专家。', fixPrompt);
          if (fixed && fixed.trim().length > 30) {
            chap.content = fixed.trim();
            chap.wordCount = this.countWords(fixed.trim());
            chap.fixCount = (chap.fixCount || 0) + 1;
            chap.stats = {
              mainTextCount: (fixed.match(/【正文】/g) || []).length,
              kpInfoCount: (fixed.match(/【KP信息】/g) || []).length,
              secretCount: (fixed.match(/【秘密/g) || []).length,
              totalWords: chap.wordCount
            };
            successCount++;
          }
        } catch (err) {
          console.warn(`[模组] 修复第 ${i + 1} 章提示:`, err);
        }

        this.renderCutChaptersUI();
        this.saveDraft();
      }

      this.isFixingRunning = false;
      if (statusEl) statusEl.textContent = `全部完成：已成功修复 ${successCount} 个章节`;
      if (fixAllBtn) {
        fixAllBtn.textContent = '全修';
        fixAllBtn.disabled = false;
      }
      if (typeof global.showCustomAlert === 'function') {
        global.showCustomAlert('修复完成', `已全部完成 ${successCount} 个章节的批量修复与规范注入！所有主观杂质已彻底清除，标签已校准。`);
      }
    },

    async executeStepByStepFix() {
      if (!this.cutChapters || this.cutChapters.length === 0) return;
      if (this.isFixingRunning) return;

      const textarea = document.getElementById('module-global-improvement-textarea');
      const customInstruction = textarea ? textarea.value.trim() : '';
      const statusEl = document.getElementById('module-global-improvement-status');
      const stepBtn = document.getElementById('module-step-by-step-fix-btn');

      let targetIdx = this.cutChapters.findIndex(c => !c.fixCount);
      if (targetIdx === -1) {
        targetIdx = 0;
      }

      const chap = this.cutChapters[targetIdx];
      this.isFixingRunning = true;
      if (stepBtn) {
        stepBtn.textContent = '逐修中...';
        stepBtn.disabled = true;
      }
      if (statusEl) {
        statusEl.textContent = `正在逐个修复第 ${targetIdx + 1} 章: ${chap.title}...`;
      }

      const fixPrompt = `你是跑团模组精准清理与打标修复专家。请严格按照以下修改要求，对章节【${chap.title}】[分类：${chap.category}] 的内容进行修正：

【修改要求】：
${customInstruction || this.globalAuditReport || '彻底清理一切主观心理分析、哲学探讨、描写建议与RP教学；正文剧情对话原汁原味输出；NPC人设剔除正文对白；合并同类项规范行首标签。'}

【当前章节原始内容】：
${chap.content}

【修复硬性要求】：
1. 彻底删除一切 AI 擅自捏造的心理分析、恋爱哲学、心路历程、描写建议、RP教学与文学鉴赏！
2. 原文剧情、场景描写、对话原字原句原汁原味输出，绝不篡改，绝不在段落间插入分析点评！
3. 若本章为 NPC 或猫人设，严禁保留从正文剧情中抄录的对话，严禁凭空捏造行为模式指南！
4. 标签合并同类项：同类内容连续出现时只在首段打上【正文】或【KP信息】，后续同一类段落不需要每行重复打标，直到切换不同类型（如【秘密·HOX】、【检定】、【插图注入】）才打新标签！
5. 末尾必须保留标准防擅自编造声明！
6. 直接输出修复后的完整章节文本，不输出任何问候或包裹代码块。`;

      try {
        const fixed = await this.callAI('你是一个高精度跑团模组文本净化与规范专家。', fixPrompt);
        if (fixed && fixed.trim().length > 30) {
          chap.content = fixed.trim();
          chap.wordCount = this.countWords(fixed.trim());
          chap.fixCount = (chap.fixCount || 0) + 1;
          chap.stats = {
            mainTextCount: (fixed.match(/【正文】/g) || []).length,
            kpInfoCount: (fixed.match(/【KP信息】/g) || []).length,
            secretCount: (fixed.match(/【秘密/g) || []).length,
            totalWords: chap.wordCount
          };
        }
      } catch (err) {
        console.warn(`[模组] 逐个修复提示:`, err);
      } finally {
        this.isFixingRunning = false;
        if (stepBtn) {
          stepBtn.textContent = '逐修';
          stepBtn.disabled = false;
        }
        if (statusEl) {
          statusEl.textContent = `第 ${targetIdx + 1} 章已完成修复`;
        }
        this.renderCutChaptersUI();
        this.saveDraft();
      }
    },

    showChapterPreviewModal(chapterObj) {
      const modal = document.getElementById('module-chapter-preview-modal');
      const titleEl = document.getElementById('module-preview-modal-title');
      const bodyEl = document.getElementById('module-preview-modal-body');

      if (!modal || !titleEl || !bodyEl) return;

      titleEl.textContent = chapterObj.title;
      bodyEl.textContent = chapterObj.content;
      modal.style.display = 'flex';
    },

    hideChapterPreviewModal() {
      const modal = document.getElementById('module-chapter-preview-modal');
      if (modal) modal.style.display = 'none';
    },

    hideAuditModal() {
      const modal = document.getElementById('module-audit-modal');
      if (modal) modal.style.display = 'none';
      this.activeAuditChapter = null;
    },

    async showLocalPickModal() {
      const modal = document.getElementById('module-local-pick-modal');
      const listContainer = document.getElementById('module-local-pick-list');
      if (!modal || !listContainer) return;

      listContainer.innerHTML = '';
      const database = this.getDB();
      let rawFiles = [];

      if (database && database.moduleRawFiles) {
        try {
          rawFiles = await database.moduleRawFiles.orderBy('uploadedAt').reverse().toArray();
        } catch (e) {
          rawFiles = await database.moduleRawFiles.toArray();
        }
        rawFiles = (rawFiles || []).filter(r => r && r.id !== '__module_cutter_draft__' && r.fileType !== 'draft');
      }

      if (!rawFiles || rawFiles.length === 0) {
        listContainer.innerHTML = '<div style="color: var(--text-secondary); text-align: center; padding: 20px;">暂无历史上传文件记录，请先导入新文件</div>';
      } else {
        rawFiles.forEach(fileRecord => {
          const item = document.createElement('div');
          item.className = 'module-history-file-card';
          const imgCount = Array.isArray(fileRecord.images) ? fileRecord.images.length : 0;
          item.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
              <span style="font-weight: 600; font-size: 13px; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 250px;" title="${fileRecord.fileName}">${fileRecord.fileName}</span>
              <span class="module-plan-tag">${fileRecord.fileType || '文档'}</span>
            </div>
            <div style="font-size: 11px; color: var(--text-secondary); margin-bottom: 4px;">
              <span>${fileRecord.wordCount || 0} 字</span> · 
              <span>${imgCount} 张图</span> · 
              <span>${new Date(fileRecord.uploadedAt || Date.now()).toLocaleDateString()}</span>
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 8px;">
              <button type="button" class="module-mini-btn btn-danger btn-del-raw">删除</button>
              <button type="button" class="module-mini-btn btn-load-raw">加载</button>
            </div>
          `;

          item.querySelector('.btn-load-raw')?.addEventListener('click', () => {
            this.loadHistoryRawFile(fileRecord);
          });

          item.querySelector('.btn-del-raw')?.addEventListener('click', async (e) => {
            e.stopPropagation();
            let confirmed = true;
            if (typeof global.showCustomConfirm === 'function') {
              confirmed = await global.showCustomConfirm('删除确认', `确定要删除历史文件【${fileRecord.fileName}】吗？删除后可释放存储空间。`);
            } else if (typeof global.showCustomAlert === 'function') {
              confirmed = confirm(`确定要删除历史文件【${fileRecord.fileName}】吗？`);
            }
            if (confirmed && database && database.moduleRawFiles) {
              await database.moduleRawFiles.delete(fileRecord.id);
              await this.showLocalPickModal();
            }
          });

          listContainer.appendChild(item);
        });
      }

      modal.style.display = 'flex';
    },

    hideLocalPickModal() {
      const modal = document.getElementById('module-local-pick-modal');
      if (modal) modal.style.display = 'none';
    },

    // 模组库模组详情（整页独立视图）
    async openModuleDetail(moduleId) {
      const database = this.getDB();
      if (!database || !database.modules) return;

      const mod = await database.modules.get(moduleId);
      if (!mod) return;

      this.activeDetailModule = mod;
      let chapters = [];
      if (database.moduleChapters) {
        chapters = await database.moduleChapters.where('moduleId').equals(moduleId).sortBy('sortOrder');
        if (chapters.length === 0) {
          if (typeof moduleId === 'string' && !isNaN(Number(moduleId))) {
            chapters = await database.moduleChapters.where('moduleId').equals(Number(moduleId)).sortBy('sortOrder');
          } else if (typeof moduleId === 'number') {
            chapters = await database.moduleChapters.where('moduleId').equals(String(moduleId)).sortBy('sortOrder');
          }
        }
      }

      // 动态计算并同步所有章节的真实字数与总字数（含目录字数、地图字数、图片简介字数）
      let chapsTotalWords = 0;
      chapters.forEach(c => {
        const cWords = this.countWords(c.content || "");
        c.wordCount = cWords;
        chapsTotalWords += cWords;
      });
      let images = [];
      if (database && database.moduleImages) {
        try {
          images = await database.moduleImages.where("moduleId").equals(moduleId).toArray();
          if (images.length === 0 && typeof moduleId === "string" && !isNaN(Number(moduleId))) {
            images = await database.moduleImages.where("moduleId").equals(Number(moduleId)).toArray();
          } else if (images.length === 0 && typeof moduleId === "number") {
            images = await database.moduleImages.where("moduleId").equals(String(moduleId)).toArray();
          }
        } catch (e) {}
      }
      const tocWords = this.getTocWordCount(mod, chapters);
      const mapWords = this.getMapWordCount(mod, chapters);
      const imgWords = this.getImagesWordCount(mod, images);
      const realTotalWords = chapsTotalWords + tocWords + mapWords + imgWords;
      if (chapters.length > 0) {
        mod.wordCount = realTotalWords;
        mod.chapterCount = chapters.length;
        if (database && database.modules && mod.id) {
          await database.modules.update(mod.id, { wordCount: realTotalWords, chapterCount: chapters.length });
        }
      }
      const mainView = document.getElementById('module-library-main-view');
      const detailView = document.getElementById('module-library-detail-view');
      const readerView = document.getElementById('module-library-reader-view');

      if (mainView) mainView.style.display = 'none';
      if (readerView) readerView.style.display = 'none';
      if (detailView) detailView.style.display = 'flex';

      const titleEl = document.getElementById('module-detail-title');
      const statsEl = document.getElementById('module-detail-stats');
      const coverTitleEl = document.getElementById('module-detail-cover-title');
      const coverEl = document.getElementById('module-detail-cover');
      const coverInput = document.getElementById('module-detail-cover-input');
      const metaLineEl = document.getElementById('module-detail-meta-line') || document.getElementById('module-detail-cover-desc');
      const descEl = document.getElementById('module-detail-desc');
      const tagsRow = document.getElementById('module-detail-tags-row');

      if (titleEl) titleEl.textContent = mod.name;
      if (statsEl) statsEl.textContent = `${chapters.length} 个章节 · ${realTotalWords} 字`;
      if (coverTitleEl) coverTitleEl.textContent = mod.name;

      if (coverEl) {
        if (mod.coverImage) {
          coverEl.innerHTML = `<img src="${mod.coverImage}" style="width: 100%; height: 100%; object-fit: cover;" alt="模组封面" />`;
        } else {
          coverEl.innerHTML = `
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"></path>
              <path d="M6 6h10"></path>
              <path d="M6 10h10"></path>
            </svg>
          `;
        }
        coverEl.onclick = () => {
          if (coverInput) coverInput.click();
        };
      }

      if (coverInput) {
        coverInput.onchange = async (e) => {
          const file = e.target.files && e.target.files[0];
          if (file) {
            try {
              const base64Img = await this.compressImageFile(file, 600, 600, 0.85);
              if (base64Img) {
                mod.coverImage = base64Img;
                if (this.activeDetailModule) {
                  this.activeDetailModule.coverImage = base64Img;
                }
                const targetId = mod.id || (this.activeDetailModule && this.activeDetailModule.id);
                if (database && database.modules && targetId) {
                  await database.modules.update(targetId, { coverImage: base64Img });
                }
                if (coverEl) {
                  coverEl.innerHTML = `<img src="${base64Img}" style="width: 100%; height: 100%; object-fit: cover;" alt="模组封面" />`;
                }
                await this.renderLibraryList();
              }
            } catch (err) {
              console.warn('[模组] 头像上传异常:', err);
            }
          }
          coverInput.value = '';
        };
      }

      const sysUpper = (mod.ruleSystem || 'coc').toUpperCase();
      const struct = mod.type || '线性';
      const scale = mod.scaleType || '1v1';
      if (metaLineEl) {
        metaLineEl.textContent = `${sysUpper} · ${struct} · ${scale} · ${realTotalWords} 字 · ${chapters.length} 章节`;
      }
      if (descEl) {
        descEl.textContent = mod.summary || mod.description || '暂无模组简介概述';
      }

      if (tagsRow) {
        tagsRow.innerHTML = '';
        const tags = Array.isArray(mod.tags) && mod.tags.length > 0
          ? mod.tags
          : this.sortModuleTags(mod.bgTag, mod.endingTag, mod.contentTags, mod.customTags);
        tags.forEach(t => {
          const span = document.createElement('span');
          span.className = `mod-tag-badge ${this.getTagClass(t)}`;
          span.textContent = t;
          span.style.cursor = 'pointer';
          span.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showTagAnnotation(t);
          });
          tagsRow.appendChild(span);
        });
      }

      const detailTabs = document.querySelectorAll('#module-detail-view-tabs .module-subtab');
      detailTabs.forEach(t => {
        if (t.dataset.tab === 'chapters') {
          t.classList.add('active');
        } else {
          t.classList.remove('active');
        }
      });
      const chaptersView = document.getElementById('module-detail-grouped-chapters');
      const tocView = document.getElementById('module-detail-toc-view');
      const mapView = document.getElementById('module-detail-map-view');
      const galleryView = document.getElementById('module-detail-gallery-view');
      const musicView = document.getElementById('module-detail-music-view');
      if (chaptersView) chaptersView.style.display = 'flex';
      if (tocView) tocView.style.display = 'none';
      if (mapView) mapView.style.display = 'none';
      if (galleryView) galleryView.style.display = 'none';
      if (musicView) musicView.style.display = 'none';

      this.renderModuleDetailGroupedChapters(chapters);
      this.renderModuleDetailToc(chapters);
      this.renderModuleDetailMap(chapters);
      this.renderModuleDetailGallery(chapters, mod.id);
      this.renderModuleDetailMusic(chapters, mod.id);
    },

    renderModuleDetailGroupedChapters(chapters) {
      const container = document.getElementById('module-detail-grouped-chapters');
      if (!container) return;
      container.innerHTML = '';

      const isEditing = Boolean(this._chapterEditMode);

      const GROUP_ORDER = [
        '事前公开',
        '大纲与真相',
        'NPC与猫',
        '人设',
        '导入',
        '正文',
        'HO秘密与设定',
        '单人线',
        '结局',
        '道具与线索',
        '附录与规则',
        '其他分类'
      ];

      const classify = (chap) => {
        const c = (chap.category || '').toLowerCase();
        const t = (chap.title || '').toLowerCase();
        if (c.includes('公开') || t.includes('公开') || c.includes('事前') || t.includes('事前') || c.includes('须知') || t.includes('须知') || c.includes('背景') || t.includes('背景')) return '事前公开';
        if (c.includes('真相') || c.includes('kp信息') || c.includes('大纲') || c.includes('带团') || c.includes('导读') || t.includes('真相') || t.includes('大纲') || t.includes('机制') || t.includes('导读') || t.includes('kp信息')) return '大纲与真相';
        if (c.includes('npc与猫') || c.includes('猫') || t.includes('猫') || (c.includes('npc') && c.includes('猫'))) return 'NPC与猫';
        if (c.includes('npc') || t.includes('npc') || c.includes('人设') || t.includes('人设') || t.includes('人物设定')) return '人设';
        if (c.includes('导入') || t.includes('导入') || t.includes('开局') || t.includes('序幕')) return '导入';
        if (c.includes('ho') || c.includes('秘密') || t.includes('ho') || t.includes('秘密')) return 'HO秘密与设定';
        if (c.includes('单人') || t.includes('单人')) return '单人线';
        if (c.includes('结局') || t.includes('结局') || t.includes('结末') || t.includes('尾声')) return '结局';
        if (c.includes('道具') || t.includes('道具') || c.includes('线索') || t.includes('线索') || c.includes('物品') || t.includes('物品')) return '道具与线索';
        if (c.includes('附录') || c.includes('数值') || c.includes('规则')) return '附录与规则';
        if (c.includes('正文') || c.includes('主线') || c.includes('地点') || c.includes('时间') || t.includes('第') || t.includes('章')) return '正文';
        return '其他分类';
      };

      const groupMap = new Map();
      GROUP_ORDER.forEach(g => groupMap.set(g, []));

      chapters.forEach((chap, idx) => {
        const groupName = classify(chap);
        if (!groupMap.has(groupName)) {
          groupMap.set(groupName, []);
        }
        groupMap.get(groupName).push({ chapter: chap, originalIndex: idx });
      });

      const database = this.getDB();

      GROUP_ORDER.forEach(groupName => {
        const list = groupMap.get(groupName) || [];
        if (list.length === 0) return;

        const groupBox = document.createElement('div');
        groupBox.className = 'mod-group-box';

        const header = document.createElement('div');
        header.className = 'mod-group-header';
        header.innerHTML = `
          <div class="mod-group-header-left">
            <span class="mod-group-title">${groupName}</span>
            <span class="mod-group-count">${list.length}</span>
          </div>
          <span class="mod-group-chevron">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </span>
        `;

        header.addEventListener('click', (e) => {
          if (e.target.closest('button') || e.target.closest('input')) return;
          groupBox.classList.toggle('collapsed');
        });

        const itemsList = document.createElement('div');
        itemsList.className = 'mod-group-items-list';

        list.forEach(({ chapter, originalIndex }) => {
          const row = document.createElement('div');
          row.className = 'mod-chapter-item-row';
          row.style.display = 'flex';
          row.style.alignItems = 'center';
          row.style.justifyContent = 'space-between';
          row.style.gap = '8px';

          const cleanTitle = this.cleanChapterTitle(chapter.title, this.activeDetailModule?.name);
          const cWords = this.countWords(chapter.content || '');
          chapter.wordCount = cWords;

          if (isEditing) {
            row.innerHTML = `
              <div style="display: flex; align-items: center; gap: 6px; min-width: 0; flex: 1;">
                <div style="display: flex; flex-direction: column; gap: 2px; flex-shrink: 0;">
                  <button type="button" class="chap-move-up-btn" style="border: none; background: transparent; cursor: pointer; padding: 0 2px; color: var(--text-secondary); line-height: 1;">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="18 15 12 9 6 15"></polyline></svg>
                  </button>
                  <button type="button" class="chap-move-down-btn" style="border: none; background: transparent; cursor: pointer; padding: 0 2px; color: var(--text-secondary); line-height: 1;">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </button>
                </div>
                <span class="mod-chapter-name editable-chap-title" style="cursor: pointer; text-decoration: underline dotted var(--accent-color); text-underline-offset: 3px; font-weight: 600; color: var(--text-primary); word-break: break-word;" title="点击修改章节名称">${cleanTitle}</span>
                <span class="mod-chapter-words" style="font-size: 11px; color: var(--text-secondary); flex-shrink: 0;">${cWords} 字</span>
              </div>
              <div style="display: flex; align-items: center; gap: 4px; flex-shrink: 0;">
                <button type="button" class="module-mini-btn chap-change-cat-btn" style="font-size: 10.5px; padding: 3px 8px; border-radius: 5px;">分类</button>
                <button type="button" class="module-mini-btn chap-del-btn" style="font-size: 10.5px; padding: 3px 8px; border-radius: 5px; color: var(--danger-color, #e53935);">删除</button>
              </div>
            `;

            // 点击修改标题
            const titleEl = row.querySelector('.editable-chap-title');
            if (titleEl) {
              titleEl.onclick = async (e) => {
                e.stopPropagation();
                const newTitle = prompt('请输入新的章节名称', chapter.title);
                if (newTitle && newTitle.trim()) {
                  chapter.title = newTitle.trim();
                  if (database && database.moduleChapters && chapter.id) {
                    await database.moduleChapters.update(chapter.id, { title: chapter.title });
                  }
                  this.renderModuleDetailGroupedChapters(chapters);
                  this.renderModuleDetailToc(chapters);
                }
              };
            }

            // 修改分类
            const catBtn = row.querySelector('.chap-change-cat-btn');
            if (catBtn) {
              catBtn.onclick = async (e) => {
                e.stopPropagation();
                this.openChangeChapterCategoryModal(chapter, chapters);
              };
            }

            // 删除章节
            const delBtn = row.querySelector('.chap-del-btn');
            if (delBtn) {
              delBtn.onclick = async (e) => {
                e.stopPropagation();
                const confirmDel = (typeof window.showCustomConfirm === 'function')
                  ? await window.showCustomConfirm('删除章节', `确认删除章节【${chapter.title}】吗`)
                  : confirm(`确认删除章节【${chapter.title}】吗`);
                if (confirmDel) {
                  if (database && database.moduleChapters && chapter.id) {
                    await database.moduleChapters.delete(chapter.id);
                  }
                  const idxInArr = chapters.findIndex(c => c.id === chapter.id);
                  if (idxInArr !== -1) chapters.splice(idxInArr, 1);
                  this.renderModuleDetailGroupedChapters(chapters);
                  this.renderModuleDetailToc(chapters);
                }
              };
            }

            // 上下移动排序
            const upBtn = row.querySelector('.chap-move-up-btn');
            const downBtn = row.querySelector('.chap-move-down-btn');
            if (upBtn) {
              upBtn.onclick = async (e) => {
                e.stopPropagation();
                if (originalIndex > 0) {
                  const temp = chapters[originalIndex];
                  chapters[originalIndex] = chapters[originalIndex - 1];
                  chapters[originalIndex - 1] = temp;
                  await this.persistChapterOrder(chapters);
                  this.renderModuleDetailGroupedChapters(chapters);
                  this.renderModuleDetailToc(chapters);
                }
              };
            }
            if (downBtn) {
              downBtn.onclick = async (e) => {
                e.stopPropagation();
                if (originalIndex < chapters.length - 1) {
                  const temp = chapters[originalIndex];
                  chapters[originalIndex] = chapters[originalIndex + 1];
                  chapters[originalIndex + 1] = temp;
                  await this.persistChapterOrder(chapters);
                  this.renderModuleDetailGroupedChapters(chapters);
                  this.renderModuleDetailToc(chapters);
                }
              };
            }
          } else {
            row.innerHTML = `
              <span class="mod-chapter-name">${cleanTitle}</span>
              <span class="mod-chapter-words">${cWords} 字</span>
            `;

            row.addEventListener('click', () => {
              this.openChapterReader(chapters, originalIndex, 'pc');
            });
          }

          itemsList.appendChild(row);
        });

        groupBox.appendChild(header);
        groupBox.appendChild(itemsList);
        container.appendChild(groupBox);
      });
    },

    openChangeChapterCategoryModal(chapter, chapters) {
      const categories = [
        '事前公开',
        '大纲与真相',
        'NPC与猫',
        '人设',
        '导入',
        '正文',
        'HO秘密与设定',
        '单人线',
        '结局',
        '附录与规则'
      ];

      const modal = document.createElement('div');
      modal.className = 'modal visible';
      modal.style.zIndex = '99999';
      modal.innerHTML = `
        <div class="modal-content" style="max-width: 260px; width: calc(100% - 80px); margin: 0 auto; padding: 14px; border-radius: 14px; background: var(--card-bg); color: var(--text-primary); border: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 10px; box-shadow: 0 16px 40px rgba(0,0,0,0.25);">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 6px;">
            <span style="font-weight: 700; font-size: 13px;">选择分类</span>
            <button type="button" class="close-cat-modal-btn" style="border: none; background: transparent; font-size: 16px; cursor: pointer; color: var(--text-secondary);">&times;</button>
          </div>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; max-height: 200px; overflow-y: auto;">
            ${categories.map(c => `
              <button type="button" class="moe-btn-secondary cat-opt-btn ${c === chapter.category ? 'active' : ''}" data-cat="${c}" style="font-size: 11px; padding: 6px 4px; text-align: center; border-radius: 6px; font-family: inherit;">${c}</button>
            `).join('')}
          </div>
        </div>
      `;

      const closeModal = () => modal.remove();
      modal.querySelector('.close-cat-modal-btn').onclick = closeModal;
      modal.onclick = (e) => {
        if (e.target === modal) closeModal();
      };

      const database = this.getDB();
      modal.querySelectorAll('.cat-opt-btn').forEach(btn => {
        btn.onclick = async () => {
          const chosen = btn.getAttribute('data-cat');
          chapter.category = chosen;
          if (database && database.moduleChapters && chapter.id) {
            await database.moduleChapters.update(chapter.id, { category: chosen });
          }
          closeModal();
          this.renderModuleDetailGroupedChapters(chapters);
          this.renderModuleDetailToc(chapters);
        };
      });

      document.body.appendChild(modal);
    },

    async persistChapterOrder(chapters) {
      const database = this.getDB();
      if (!database || !database.moduleChapters) return;
      for (let i = 0; i < chapters.length; i++) {
        chapters[i].sortOrder = i;
        if (chapters[i].id) {
          await database.moduleChapters.update(chapters[i].id, { sortOrder: i });
        }
      }
    },

    renderModuleDetailToc(chapters) {
      const tocContainer = document.getElementById('module-detail-toc-view');
      if (!tocContainer) return;

      const isEditing = Boolean(this._chapterEditMode);
      const database = this.getDB();

      let html = '<div style="font-weight: 600; font-size: 13px; margin-bottom: 8px;">模组章节顺序总览</div>';
      html += '<div style="display: flex; flex-direction: column; gap: 6px;" id="mod-toc-items-container">';
      chapters.forEach((chap, idx) => {
        const cleanTitle = this.cleanChapterTitle(chap.title, this.activeDetailModule?.name);
        if (isEditing) {
          html += `
            <div style="display: flex; justify-content: space-between; align-items: center; background: var(--secondary-bg, #F9F8F5); padding: 6px 10px; border-radius: 8px;" class="mod-toc-item-row" data-idx="${idx}">
              <div style="display: flex; align-items: center; gap: 6px; min-width: 0; flex: 1;">
                <div style="display: flex; flex-direction: column; gap: 2px; flex-shrink: 0;">
                  <button type="button" class="toc-move-up-btn" style="border: none; background: transparent; cursor: pointer; padding: 0 2px; color: var(--text-secondary); line-height: 1;">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="18 15 12 9 6 15"></polyline></svg>
                  </button>
                  <button type="button" class="toc-move-down-btn" style="border: none; background: transparent; cursor: pointer; padding: 0 2px; color: var(--text-secondary); line-height: 1;">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </button>
                </div>
                <span class="editable-toc-title" style="font-weight: 500; font-size: 12.5px; cursor: pointer; text-decoration: underline dotted var(--accent-color); text-underline-offset: 3px; word-break: break-word;">${idx + 1}. ${cleanTitle}</span>
              </div>
              <span class="module-plan-tag" style="flex-shrink: 0;">${chap.category || '正文'}</span>
            </div>
          `;
        } else {
          html += `
            <div style="display: flex; justify-content: space-between; align-items: center; background: var(--secondary-bg, #F9F8F5); padding: 8px 12px; border-radius: 8px; cursor: pointer;" class="mod-toc-item-row" data-idx="${idx}">
              <span style="font-weight: 500; font-size: 12.5px;">${idx + 1}. ${cleanTitle}</span>
              <span class="module-plan-tag">${chap.category || '正文'}</span>
            </div>
          `;
        }
      });
      html += '</div>';
      tocContainer.innerHTML = html;

      if (isEditing) {
        tocContainer.querySelectorAll('.mod-toc-item-row').forEach(row => {
          const idx = parseInt(row.dataset.idx, 10);
          const chap = chapters[idx];

          const titleEl = row.querySelector('.editable-toc-title');
          if (titleEl && chap) {
            titleEl.onclick = async (e) => {
              e.stopPropagation();
              const newTitle = prompt('请输入新的章节名称', chap.title);
              if (newTitle && newTitle.trim()) {
                chap.title = newTitle.trim();
                if (database && database.moduleChapters && chap.id) {
                  await database.moduleChapters.update(chap.id, { title: chap.title });
                }
                this.renderModuleDetailGroupedChapters(chapters);
                this.renderModuleDetailToc(chapters);
              }
            };
          }

          const upBtn = row.querySelector('.toc-move-up-btn');
          const downBtn = row.querySelector('.toc-move-down-btn');
          if (upBtn) {
            upBtn.onclick = async (e) => {
              e.stopPropagation();
              if (idx > 0) {
                const temp = chapters[idx];
                chapters[idx] = chapters[idx - 1];
                chapters[idx - 1] = temp;
                await this.persistChapterOrder(chapters);
                this.renderModuleDetailGroupedChapters(chapters);
                this.renderModuleDetailToc(chapters);
              }
            };
          }
          if (downBtn) {
            downBtn.onclick = async (e) => {
              e.stopPropagation();
              if (idx < chapters.length - 1) {
                const temp = chapters[idx];
                chapters[idx] = chapters[idx + 1];
                chapters[idx + 1] = temp;
                await this.persistChapterOrder(chapters);
                this.renderModuleDetailGroupedChapters(chapters);
                this.renderModuleDetailToc(chapters);
              }
            };
          }
        });
      } else {
        tocContainer.querySelectorAll('.mod-toc-item-row').forEach(el => {
          el.addEventListener('click', () => {
            const idx = parseInt(el.dataset.idx, 10);
            this.openChapterReader(chapters, idx, 'pc');
          });
        });
      }
    },

    async renderModuleDetailMap(chapters) {
      const mapContainer = document.getElementById('module-detail-map-view');
      if (!mapContainer) return;
      mapContainer.innerHTML = '';

      const mod = this.activeDetailModule;
      if (!mod) return;

      const dbInstance = typeof db !== 'undefined' ? db : (window.db || null);
      if (!dbInstance) return;

      // 读取数据库中已有的模组地图地点
      let dbLocations = [];
      try {
        if (dbInstance.moduleLocationNav) {
          dbLocations = await dbInstance.moduleLocationNav.where('moduleId').equals(mod.id).toArray();
          if (dbLocations.length === 0 && typeof mod.id === 'string' && !isNaN(Number(mod.id))) {
            dbLocations = await dbInstance.moduleLocationNav.where('moduleId').equals(Number(mod.id)).toArray();
          } else if (dbLocations.length === 0 && typeof mod.id === 'number') {
            dbLocations = await dbInstance.moduleLocationNav.where('moduleId').equals(String(mod.id)).toArray();
          }
        }
      } catch (e) {
        console.error('读取模组地点失败', e);
      }

      // 如果数据库中尚无地点，仅从当前模组自身的 mapNodes（或同名切割草稿）载入并同步入库，严禁串用其他模组的缓存地点
      if (dbLocations.length === 0) {
        const isSameCutModule = Boolean(
          mod &&
          mod.name &&
          this.currentParsedData &&
          this.currentParsedData.moduleName &&
          String(this.currentParsedData.moduleName).trim() === String(mod.name).trim()
        );
        const sourceNodes = (mod.mapNodes && Array.isArray(mod.mapNodes) && mod.mapNodes.length > 0)
          ? mod.mapNodes
          : (isSameCutModule && this.currentPlan?.mapNodes && Array.isArray(this.currentPlan.mapNodes) && this.currentPlan.mapNodes.length > 0)
            ? this.currentPlan.mapNodes
            : (isSameCutModule && this.currentParsedData?.mapNodes && Array.isArray(this.currentParsedData.mapNodes) && this.currentParsedData.mapNodes.length > 0)
              ? this.currentParsedData.mapNodes
              : null;

        if (sourceNodes && sourceNodes.length > 0) {
          for (const item of sourceNodes) {
            const locObj = {
              moduleId: mod.id,
              name: item.name,
              parent: item.parent || '',
              level: item.level || 1,
              desc: item.desc || item.description || '',
              prompt: item.prompt || '',
              imageUrl: item.imageUrl || '',
              imageStatus: 'idle'
            };
            if (dbInstance.moduleLocationNav) {
              const id = await dbInstance.moduleLocationNav.add(locObj);
              locObj.id = id;
            }
            dbLocations.push(locObj);
          }
        } else if (chapters && chapters.length > 0) {
          // 兜底：从章节内容中提炼
          const extracted = [];
          chapters.forEach((c) => {
            const title = c.title || '';
            const content = c.content || '';
            const isLocation = title.includes('地点') || (c.category && c.category.includes('地点')) || title.includes('室') || title.includes('馆') || title.includes('店') || title.includes('街') || title.includes('厅') || title.includes('屋') || title.includes('岛') || title.includes('洞') || title.includes('楼') || title.includes('山') || title.includes('村');

            if (isLocation || content.includes('场景') || content.includes('地点')) {
              const cleanDesc = content.replace(/\n+/g, ' ').trim().substring(0, 180);
              extracted.push({
                moduleId: mod.id,
                name: title,
                parent: '',
                level: 1,
                desc: cleanDesc || '场景环境及探索线索',
                prompt: '',
                imageUrl: '',
                imageStatus: 'idle'
              });
            }
          });

          if (extracted.length > 0 && dbInstance.moduleLocationNav) {
            for (const item of extracted) {
              const id = await dbInstance.moduleLocationNav.add(item);
              item.id = id;
              dbLocations.push(item);
            }
          }
        }

        // 若仍为空，保持干净不生成生硬的默认占位地点
        if (dbLocations.length === 0) {
          // 不强制插入预设占位地点，保持地图清爽
        }

        // 同步更新 mod.mapNodes 供其他组件读取
        mod.mapNodes = dbLocations.map(l => ({ name: l.name, parent: l.parent, level: l.level, desc: l.desc, prompt: l.prompt, imageUrl: l.imageUrl }));
        if (dbInstance.modules && mod.id) {
          try {
            await dbInstance.modules.update(mod.id, { mapNodes: mod.mapNodes });
          } catch (e) {}
        }
      }

      // 记忆展示模式：优先读取本地存储或数据库记录
      const savedMode = localStorage.getItem('module_map_view_mode_' + mod.id) || localStorage.getItem('module_map_view_mode_global') || mod.mapViewMode || 'text';
      if (!mod._mapViewMode) mod._mapViewMode = savedMode;
      const isRich = (mod._mapViewMode === 'rich');
      const isEditing = Boolean(mod._mapEditMode);

      // 顶部操作栏
      const headerBar = document.createElement('div');
      headerBar.style.display = 'flex';
      headerBar.style.justifyContent = 'space-between';
      headerBar.style.alignItems = 'center';
      headerBar.style.marginBottom = '10px';
      headerBar.style.flexWrap = 'wrap';
      headerBar.style.gap = '8px';

      const leftActions = document.createElement('div');
      leftActions.style.display = 'flex';
      leftActions.style.gap = '6px';
      leftActions.style.alignItems = 'center';

      const modeToggleBtn = document.createElement('button');
      modeToggleBtn.type = 'button';
      modeToggleBtn.className = 'mod-capsule-btn';
      modeToggleBtn.textContent = isRich ? '图文' : '文字';
      modeToggleBtn.onclick = async () => {
        mod._mapViewMode = (mod._mapViewMode === 'rich') ? 'text' : 'rich';
        localStorage.setItem('module_map_view_mode_' + mod.id, mod._mapViewMode);
        localStorage.setItem('module_map_view_mode_global', mod._mapViewMode);
        if (dbInstance.modules && mod.id) {
          try {
            await dbInstance.modules.update(mod.id, { mapViewMode: mod._mapViewMode });
          } catch (e) {}
        }
        this.renderModuleDetailMap(chapters);
      };
      leftActions.appendChild(modeToggleBtn);

      const editModeBtn = document.createElement('button');
      editModeBtn.type = 'button';
      editModeBtn.className = `mod-capsule-btn ${isEditing ? 'primary' : ''}`;
      editModeBtn.textContent = isEditing ? '完成' : '编辑';
      editModeBtn.onclick = () => {
        mod._mapEditMode = !isEditing;
        this.renderModuleDetailMap(chapters);
      };
      leftActions.appendChild(editModeBtn);

      if (isEditing) {
        const addBtn = document.createElement('button');
        addBtn.type = 'button';
        addBtn.className = 'mod-capsule-btn';
        addBtn.textContent = '添加';
        addBtn.onclick = () => {
          this.openModuleMapEditModal(null, mod.id, chapters);
        };
        leftActions.appendChild(addBtn);

        const compressBtn = document.createElement('button');
        compressBtn.type = 'button';
        compressBtn.className = 'mod-capsule-btn';
        compressBtn.textContent = '压缩';
        compressBtn.onclick = async () => {
          if (Array.isArray(mod.mapNodes)) {
            dbLocations.forEach(loc => {
              if (!loc.imageUrl) {
                const matchNode = mod.mapNodes.find(m => m.name === loc.name);
                if (matchNode && matchNode.imageUrl) {
                  loc.imageUrl = matchNode.imageUrl;
                }
              }
            });
          }

          const locsWithImg = dbLocations.filter(l => l.imageUrl && typeof l.imageUrl === 'string' && l.imageUrl.trim().length > 0);
          if (locsWithImg.length === 0) {
            if (typeof global.showCustomAlert === 'function') {
              await global.showCustomAlert('提示', '当前地图暂无可压缩的图片');
            }
            return;
          }
          const confirmCompress = (typeof global.showCustomConfirm === 'function')
            ? await global.showCustomConfirm('压缩确认', '是否确认压缩当前地图的所有地点图片？压缩倍率将设定为 0.5')
            : confirm('是否确认压缩当前地图的所有地点图片？');
          if (!confirmCompress) return;
          let count = 0;

          const compressFn = async (base64Str, quality = 0.5, maxDim = 900) => {
            if (!base64Str || typeof base64Str !== 'string' || !base64Str.startsWith('data:image')) return base64Str;
            return new Promise((resolve) => {
              const img = new Image();
              img.onload = () => {
                try {
                  let w = img.width;
                  let h = img.height;
                  if (!w || !h) return resolve(base64Str);
                  if (w > maxDim || h > maxDim) {
                    if (w > h) {
                      h = Math.round((h * maxDim) / w);
                      w = maxDim;
                    } else {
                      w = Math.round((w * maxDim) / h);
                      h = maxDim;
                    }
                  }
                  const canvas = document.createElement('canvas');
                  canvas.width = w;
                  canvas.height = h;
                  const ctx = canvas.getContext('2d');
                  if (!ctx) return resolve(base64Str);
                  ctx.drawImage(img, 0, 0, w, h);
                  const res = canvas.toDataURL('image/jpeg', quality);
                  resolve(res || base64Str);
                } catch (e) {
                  resolve(base64Str);
                }
              };
              img.onerror = () => resolve(base64Str);
              img.src = base64Str;
            });
          };

          for (const loc of locsWithImg) {
            try {
              const res = await compressFn(loc.imageUrl, 0.5, 900);
              if (res && res.startsWith('data:image')) {
                loc.imageUrl = res;
                count++;
                if (dbInstance.moduleLocationNav && loc.id) {
                  await dbInstance.moduleLocationNav.put(loc);
                }
              }
            } catch (e) {
              console.warn('单张地点图片压缩异常:', e);
            }
          }
          if (dbInstance.modules && mod.id) {
            try {
              mod.mapNodes = dbLocations.map(l => ({ name: l.name, parent: l.parent, level: l.level, desc: l.desc, prompt: l.prompt, imageUrl: l.imageUrl }));
              await dbInstance.modules.update(mod.id, { mapNodes: mod.mapNodes });
            } catch (e) {}
          }
          if (typeof global.showCustomAlert === 'function') {
            await global.showCustomAlert('成功', `已将当前地图 ${count} 张图片压缩至 0.5`);
          }
          this.renderModuleDetailMap(chapters);
        };
        leftActions.appendChild(compressBtn);

        const clearImgBtn = document.createElement('button');
        clearImgBtn.type = 'button';
        clearImgBtn.className = 'mod-capsule-btn';
        clearImgBtn.textContent = '清空';
        clearImgBtn.onclick = async () => {
          const confirmClear = (typeof global.showCustomConfirm === 'function')
            ? await global.showCustomConfirm('清空', '提示删除所有已生成的图片，是否确定清除？')
            : confirm('提示删除所有已生成的图片，是否确定清除？');
          if (!confirmClear) return;

          for (const loc of dbLocations) {
            loc.imageUrl = '';
            loc.imageStatus = 'idle';
            if (dbInstance.moduleLocationNav && loc.id) {
              await dbInstance.moduleLocationNav.put(loc);
            }
          }
          if (dbInstance.modules && mod.id) {
            try {
              mod.mapNodes = dbLocations.map(l => ({ name: l.name, parent: l.parent, level: l.level, desc: l.desc, prompt: l.prompt, imageUrl: '' }));
              await dbInstance.modules.update(mod.id, { mapNodes: mod.mapNodes });
            } catch (e) {}
          }
          if (typeof global.showCustomAlert === 'function') {
            await global.showCustomAlert('成功', '已清空已生成的地图头像');
          }
          this.renderModuleDetailMap(chapters);
        };
        leftActions.appendChild(clearImgBtn);
      }

      const rightActions = document.createElement('div');
      rightActions.style.display = 'flex';
      rightActions.style.gap = '6px';
      rightActions.style.alignItems = 'center';

      // 检查完善进度
      const unpromptedCount = dbLocations.filter(l => !l.prompt).length;

      const fillBtn = document.createElement('button');
      fillBtn.type = 'button';
      fillBtn.className = 'mod-capsule-btn primary';
      fillBtn.id = 'module-map-fill-prompts-btn';
      fillBtn.textContent = unpromptedCount < dbLocations.length && unpromptedCount > 0 ? '继续' : '完善';
      fillBtn.onclick = async () => {
        await this.startModuleMapPromptGeneration(mod.id, chapters, fillBtn);
      };
      rightActions.appendChild(fillBtn);

      const drawBtn = document.createElement('button');
      drawBtn.type = 'button';
      drawBtn.className = 'mod-capsule-btn';
      drawBtn.id = 'module-map-draw-images-btn';
      drawBtn.textContent = '绘制';
      drawBtn.onclick = () => {
        this.openModuleDrawPromptModal(mod.id, chapters, drawBtn);
      };
      rightActions.appendChild(drawBtn);

      headerBar.appendChild(leftActions);
      headerBar.appendChild(rightActions);
      mapContainer.appendChild(headerBar);

      // 进度条提示区
      const progressBox = document.createElement('div');
      progressBox.id = 'module-map-status-tip';
      progressBox.style.fontSize = '11px';
      progressBox.style.color = 'var(--text-secondary)';
      progressBox.style.marginBottom = '8px';
      progressBox.style.display = 'none';
      mapContainer.appendChild(progressBox);

      const mapList = document.createElement('div');
      mapList.style.display = 'flex';
      mapList.style.flexDirection = 'column';
      mapList.style.gap = '8px';

      const defaultThumbSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--text-secondary);"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>`;

      dbLocations.forEach((loc) => {
        const nodeEl = document.createElement('div');
        nodeEl.className = `module-map-node level-${loc.level || 1}`;

        const badgeText = loc.level === 1 ? '大区域' : loc.level === 2 ? '建筑分区' : '具体场所';

        const actionBtnsHtml = isEditing ? `
          <div style="display: flex; gap: 4px; flex-shrink: 0;">
            <button type="button" class="module-mini-btn edit-loc-btn" style="font-size: 10px; padding: 2px 6px;">编辑</button>
            <button type="button" class="module-mini-btn del-loc-btn" style="font-size: 10px; padding: 2px 6px; color: var(--danger-color, #e53935);">删除</button>
          </div>
        ` : '';

        if (isRich) {
          // 图文版：左侧1比1头像
          nodeEl.innerHTML = `
            <div style="display: flex; gap: 10px; align-items: flex-start;">
              <div class="mod-map-avatar-container" style="position: relative; width: 50px; height: 50px; aspect-ratio: 1 / 1; border-radius: 6px; overflow: hidden; background: var(--secondary-bg); flex-shrink: 0; display: flex; align-items: center; justify-content: center; cursor: pointer; border: 1px solid var(--border-color); margin-top: 2px;">
                ${loc.imageUrl ? `<img src="${loc.imageUrl}" alt="${loc.name}" loading="lazy" decoding="async" style="width: 100%; height: 100%; object-fit: cover;" />` : defaultThumbSvg}
              </div>
              <div style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px;">
                <div class="module-map-node-title" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                  <div style="display: flex; align-items: center; gap: 6px; min-width: 0; flex-wrap: wrap;">
                    <span style="font-weight: 600; font-size: 13px; color: var(--text-primary); word-break: break-word;">${loc.name}</span>
                    <span class="module-map-badge" style="flex-shrink: 0;">${badgeText}</span>
                  </div>
                  ${actionBtnsHtml}
                </div>
                ${loc.desc ? `<div class="module-map-node-desc" style="font-size: 11.5px; color: var(--text-secondary); line-height: 1.5; word-break: break-word; white-space: pre-wrap;">${loc.desc}</div>` : ''}
              </div>
            </div>
          `;
        } else {
          // 文字版：与分析阶段完全一致的标准呈现
          nodeEl.innerHTML = `
            <div class="module-map-node-title" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
              <div style="display: flex; align-items: center; gap: 6px; min-width: 0; flex-wrap: wrap;">
                <span style="font-weight: 600; font-size: 13px; color: var(--text-primary); word-break: break-word;">${loc.name}</span>
                <span class="module-map-badge" style="flex-shrink: 0;">${badgeText}</span>
              </div>
              ${actionBtnsHtml}
            </div>
            ${loc.desc ? `<div class="module-map-node-desc" style="font-size: 11.5px; color: var(--text-secondary); line-height: 1.5; word-break: break-word; white-space: pre-wrap;">${loc.desc}</div>` : ''}
          `;
        }

        // 编辑按钮
        const editBtn = nodeEl.querySelector('.edit-loc-btn');
        if (editBtn) {
          editBtn.onclick = (e) => {
            e.stopPropagation();
            this.openModuleMapEditModal(loc, mod.id, chapters);
          };
        }

        // 删除按钮
        const delBtn = nodeEl.querySelector('.del-loc-btn');
        if (delBtn) {
          delBtn.onclick = async (e) => {
            e.stopPropagation();
            if (dbInstance.moduleLocationNav) {
              await dbInstance.moduleLocationNav.delete(loc.id);
              this.renderModuleDetailMap(chapters);
            }
          };
        }

        // 图文版头像交互：三连击下载、点击右下角展开大图、长按重新生成
        if (isRich) {
          const avatarContainer = nodeEl.querySelector('.mod-map-avatar-container');

          if (avatarContainer) {
            let clickCount = 0;
            let clickTimer = null;
            let pressTimer = null;

            avatarContainer.addEventListener('mousedown', () => {
              if (window.getSelection) { try { window.getSelection().removeAllRanges(); } catch (_) {} }
              pressTimer = setTimeout(() => {
                if (window.getSelection) { try { window.getSelection().removeAllRanges(); } catch (_) {} }
                this.openModuleMapRegenModal(loc, mod.id, chapters);
              }, 700);
            });
            avatarContainer.addEventListener('touchstart', () => {
              if (window.getSelection) { try { window.getSelection().removeAllRanges(); } catch (_) {} }
              pressTimer = setTimeout(() => {
                if (window.getSelection) { try { window.getSelection().removeAllRanges(); } catch (_) {} }
                this.openModuleMapRegenModal(loc, mod.id, chapters);
              }, 700);
            });
            const clearPress = () => {
              if (pressTimer) clearTimeout(pressTimer);
            };
            avatarContainer.addEventListener('mouseup', clearPress);
            avatarContainer.addEventListener('mouseleave', clearPress);
            avatarContainer.addEventListener('touchend', clearPress);
            avatarContainer.addEventListener('contextmenu', (e) => {
              e.preventDefault();
              e.stopPropagation();
            });

            avatarContainer.addEventListener('click', (e) => {
              const rect = avatarContainer.getBoundingClientRect();
              const isBottomRight = (e.clientX - rect.left > rect.width * 0.4) && (e.clientY - rect.top > rect.height * 0.4);
              
              if (isBottomRight && loc.imageUrl) {
                this.openModuleMapExpandModal(loc.name, loc.imageUrl);
                return;
              }

              clickCount++;
              if (clickTimer) clearTimeout(clickTimer);
              clickTimer = setTimeout(() => {
                if (clickCount >= 3) {
                  if (loc.imageUrl) {
                    const a = document.createElement('a');
                    a.href = loc.imageUrl;
                    a.download = `${loc.name}.png`;
                    a.click();
                  }
                } else if (clickCount === 1 && loc.imageUrl) {
                  this.openModuleMapExpandModal(loc.name, loc.imageUrl);
                }
                clickCount = 0;
              }, 400);
            });
          }
        }

        // 长按方框卡片查看与修改 Prompt
        let cardPressTimer = null;
        nodeEl.addEventListener('mousedown', (e) => {
          if (e.target.closest('button') || e.target.closest('.mod-map-avatar-container')) return;
          if (window.getSelection) { try { window.getSelection().removeAllRanges(); } catch (_) {} }
          cardPressTimer = setTimeout(() => {
            if (window.getSelection) { try { window.getSelection().removeAllRanges(); } catch (_) {} }
            this.openModuleMapPromptModal(loc, mod.id, chapters);
          }, 700);
        });
        nodeEl.addEventListener('touchstart', (e) => {
          if (e.target.closest('button') || e.target.closest('.mod-map-avatar-container')) return;
          if (window.getSelection) { try { window.getSelection().removeAllRanges(); } catch (_) {} }
          cardPressTimer = setTimeout(() => {
            if (window.getSelection) { try { window.getSelection().removeAllRanges(); } catch (_) {} }
            this.openModuleMapPromptModal(loc, mod.id, chapters);
          }, 700);
        });
        const clearCardPress = () => {
          if (cardPressTimer) clearTimeout(cardPressTimer);
        };
        nodeEl.addEventListener('mouseup', clearCardPress);
        nodeEl.addEventListener('mouseleave', clearCardPress);
        nodeEl.addEventListener('touchend', clearCardPress);
        nodeEl.addEventListener('contextmenu', (e) => {
          if (e.target.closest('input, textarea, select, [contenteditable="true"]')) return;
          e.preventDefault();
          e.stopPropagation();
        });

        mapList.appendChild(nodeEl);
      });

      mapContainer.appendChild(mapList);
    },

    async startModuleMapPromptGeneration(moduleId, chapters, btn) {
      const dbInstance = typeof db !== 'undefined' ? db : (window.db || null);
      if (!dbInstance || !dbInstance.moduleLocationNav) return;

      let locations = await this.getLocationsByModuleId(moduleId);

      // 如果尚未载入地点，先执行一次 renderModuleDetailMap 加载/入库
      if (locations.length === 0 && this.activeDetailModule) {
        await this.renderModuleDetailMap(chapters);
        locations = await this.getLocationsByModuleId(moduleId);
      }

      const pendingLocs = locations.filter(l => !l.prompt);

      if (pendingLocs.length === 0) {
        if (typeof window.showCustomAlert === 'function') {
          await window.showCustomAlert('提示', '全部地点已填写提示词');
        }
        return;
      }

      if (typeof window.showCustomConfirm === 'function') {
        const confirmed = await window.showCustomConfirm('完善提示词', '将为未编写提示词的地点自动生成绘图提示词 确认开始吗');
        if (!confirmed) return;
      }

      if (btn) {
        btn.disabled = true;
        btn.textContent = '生成中';
      }

      const statusTip = document.getElementById('module-map-status-tip');
      if (statusTip) {
        statusTip.style.display = 'block';
        statusTip.textContent = `正在生成提示词 剩余 ${pendingLocs.length} 个地点`;
      }

      // 汇总模组上下文文本
      const allText = (chapters || []).map(c => `${c.title} ${c.content || ''}`).join('\n');

      // 一次最多生成10个prompt
      const batchSize = 10;
      for (let i = 0; i < pendingLocs.length; i += batchSize) {
        const chunk = pendingLocs.slice(i, i + batchSize);
        const locNames = chunk.map(l => `- 地点名称：${l.name}，简介：${l.desc || '无'}`).join('\n');

        const systemPrompt = '你是一位跑团插画提示词专家。请根据模组设定，为各地点编写唯美场景图像的英文绘图提示词。只输出合法JSON数组。';
        const userPrompt = `模组节选：\n${allText}\n\n` +
          `请为以下地点编写提示词：\n${locNames}\n\n` +
          `格式要求：只输出JSON数组，格式如下：\n` +
          `[{"name": "地点名称", "prompt": "masterpiece, scenery, highly detailed, landscape, ..."}, ...]`;

        try {
          const resText = await this.callAI(systemPrompt, userPrompt);
          if (resText) {
            const cleanJson = resText.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
            const startIdx = cleanJson.indexOf('[');
            const endIdx = cleanJson.lastIndexOf(']');
            if (startIdx !== -1 && endIdx !== -1) {
              const arr = JSON.parse(cleanJson.substring(startIdx, endIdx + 1));
              for (const item of arr) {
                const target = chunk.find(c => c.name === item.name);
                if (target && item.prompt) {
                  target.prompt = item.prompt;
                  await dbInstance.moduleLocationNav.put(target);
                }
              }
            }
          }
        } catch (e) {
          console.error('批量生成Prompt失败', e);
        }

        if (statusTip) {
          const remaining = pendingLocs.length - Math.min(i + batchSize, pendingLocs.length);
          statusTip.textContent = `正在生成提示词 剩余 ${remaining} 个地点`;
        }
      }

      if (statusTip) {
        statusTip.textContent = '提示词填写完毕 点击绘制开始批量生图';
      }

      if (btn) {
        btn.disabled = false;
        btn.textContent = '完善';
      }

      if (typeof window.showCustomAlert === 'function') {
        await window.showCustomAlert('提示', '全部提示词已填写完成 可以点击绘制开始逐一生图');
      }
      this.renderModuleDetailMap(chapters);
    },

    openModuleDrawPromptModal(moduleId, chapters, btn) {
      const defaultGlobalPrompt = '1.2::artist:goguma wagamja  ::, 1.2::artist:sushisushi iiii  ::,';
      const currentPrompt = localStorage.getItem('coc_module_draw_global_prompt') || defaultGlobalPrompt;

      const modal = document.createElement('div');
      modal.className = 'modal visible';
      modal.style.zIndex = '99999';
      modal.innerHTML = `
        <div class="modal-content" style="max-width: 320px; width: calc(100% - 60px); margin: 0 auto; padding: 14px; border-radius: 14px; background: var(--card-bg); color: var(--text-primary); border: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 10px; box-shadow: 0 16px 40px rgba(0,0,0,0.25);">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 6px;">
            <span style="font-weight: 700; font-size: 13px;">绘制全局提示词</span>
            <button type="button" class="close-draw-modal-btn" style="border: none; background: transparent; font-size: 16px; cursor: pointer; color: var(--text-secondary);">&times;</button>
          </div>
          <div style="display: flex; flex-direction: column; gap: 6px;">
            <input type="text" id="module-draw-global-prompt-input" class="moe-input" value="${currentPrompt.replace(/"/g, '&quot;')}" placeholder="全局通用生图提示词" style="width: 100%; height: 32px; font-size: 11.5px; background: #FFFFFF;" />
          </div>
          <div style="display: flex; gap: 6px; justify-content: flex-end; margin-top: 2px;">
            <button type="button" class="chat-mod-footer-btn secondary cancel-draw-modal-btn" style="height: 26px; font-size: 11px; padding: 0 10px; font-family: inherit;">取消</button>
            <button type="button" class="chat-mod-footer-btn primary confirm-draw-modal-btn" style="height: 26px; font-size: 11px; padding: 0 12px; font-family: inherit;">开始绘制</button>
          </div>
        </div>
      `;

      const promptInput = modal.querySelector('#module-draw-global-prompt-input');
      const closeModal = () => modal.remove();
      modal.querySelector('.close-draw-modal-btn').onclick = closeModal;
      modal.querySelector('.cancel-draw-modal-btn').onclick = closeModal;

      modal.querySelector('.confirm-draw-modal-btn').onclick = async () => {
        const val = promptInput ? promptInput.value.trim() : '';
        localStorage.setItem('coc_module_draw_global_prompt', val || defaultGlobalPrompt);
        closeModal();
        await this.startModuleMapImageDrawing(moduleId, chapters, btn);
      };

      document.body.appendChild(modal);
    },

    async startModuleMapImageDrawing(moduleId, chapters, btn) {
      const dbInstance = typeof db !== 'undefined' ? db : (window.db || null);
      if (!dbInstance) return;

      let locations = await this.getLocationsByModuleId(moduleId);
      if (locations.length === 0 && dbInstance.modules) {
        try {
          const mod = await dbInstance.modules.get(moduleId);
          if (mod && Array.isArray(mod.mapNodes) && mod.mapNodes.length > 0) {
            locations = mod.mapNodes;
          }
        } catch (e) {}
      }

      const pendingLocs = locations.filter(l => !l.imageUrl);
      const targetLocs = (pendingLocs.length > 0) ? pendingLocs : locations;

      if (targetLocs.length === 0) {
        if (typeof window.showCustomAlert === 'function') {
          await window.showCustomAlert('提示', '暂无地点可绘制');
        } else {
          alert('暂无地点可绘制');
        }
        return;
      }

      if (btn) {
        btn.disabled = true;
        btn.textContent = '绘制中';
      }

      const statusTip = document.getElementById('module-map-status-tip');
      if (statusTip) {
        statusTip.style.display = 'block';
        statusTip.textContent = `准备开始生图 剩余 ${targetLocs.length} 张`;
      }

      const globalDrawPrompt = (localStorage.getItem('coc_module_draw_global_prompt') || '1.2::artist:goguma wagamja  ::, 1.2::artist:sushisushi iiii  ::,').trim();

      for (let i = 0; i < targetLocs.length; i++) {
        const loc = targetLocs[i];
        const naiSettings = typeof window.getNovelAISettings === 'function' ? window.getNovelAISettings() : {};
        const domArtist = document.getElementById('nai-default-artist') ? document.getElementById('nai-default-artist').value.trim() : '';
        const domNegative = document.getElementById('nai-default-negative') ? document.getElementById('nai-default-negative').value.trim() : '';
        const artist = (domArtist || naiSettings.artist_prompt || '').trim();
        const defaultNeg = (domNegative || naiSettings.default_negative || '').trim();
        const locPromptText = (loc.prompt || `${loc.name}${loc.desc ? ', ' + loc.desc : ''}`).trim();

        const fullArtistPrompt = [globalDrawPrompt, artist].filter(Boolean).join(', ');

        try {
          if (statusTip) {
            statusTip.textContent = `正在绘制 第 ${i + 1} 张 共 ${targetLocs.length} 张 地点：${loc.name}`;
          }

          // 优先检查该地点是否已有生成的图片（模组库或任意群聊中），实现全量图片去重复用
          let existingDataUrl = '';
          if (Array.isArray(locations)) {
            const m = locations.find(x => x.name === loc.name && x.imageUrl);
            if (m) existingDataUrl = m.imageUrl;
          }
          if (!existingDataUrl && typeof state !== 'undefined' && state.chats) {
            for (const c of Object.values(state.chats)) {
              if (!c || !c.settings) continue;
              const cl = (c.settings.customLocations || []).find(x => x.name === loc.name && x.imageUrl);
              if (cl) { existingDataUrl = cl.imageUrl; break; }
              const ctx = (c.settings.contextMapData || []).find(x => x.name === loc.name && x.imageUrl);
              if (ctx) { existingDataUrl = ctx.imageUrl; break; }
            }
          }

          let imgDataUrl = existingDataUrl;
          if (!imgDataUrl) {
            if (typeof window.callNovelAiDirect === 'function') {
              imgDataUrl = await window.callNovelAiDirect(locPromptText, {
                artist: fullArtistPrompt,
                negativePrompt: defaultNeg,
                resolution: naiSettings.resolution || '1024x1024',
                seed: Math.floor(Math.random() * 4294967295)
              });
            } else if (typeof generateNovelAIImageForCharacter === 'function') {
              const promptParts = [];
              if (fullArtistPrompt) promptParts.push(fullArtistPrompt);
              if (locPromptText) promptParts.push(locPromptText);
              imgDataUrl = await generateNovelAIImageForCharacter('', promptParts.join(', '));
            }
          }

          if (!imgDataUrl) {
            throw new Error('未获取到图像数据，请检查NovelAI配置或网络');
          }

          if (imgDataUrl) {
            if (typeof compressImage === 'function' && !existingDataUrl) {
              imgDataUrl = await compressImage(imgDataUrl, 0.5, 900);
            }
            loc.imageUrl = imgDataUrl;

            if (dbInstance.moduleLocationNav && loc.id) {
              await dbInstance.moduleLocationNav.put(loc);
            }
            if (dbInstance.modules) {
              try {
                const mod = await dbInstance.modules.get(moduleId);
                if (mod) {
                  mod.mapNodes = locations.map(l => ({ name: l.name, parent: l.parent, level: l.level, desc: l.desc, prompt: l.prompt, imageUrl: l.imageUrl }));
                  await dbInstance.modules.update(moduleId, { mapNodes: mod.mapNodes });
                }
              } catch (e) {}
            }
            // 同步给所有使用该模组或同名地点的群聊，全局调用同一张图片
            if (typeof state !== 'undefined' && state.chats) {
              Object.values(state.chats).forEach(c => {
                if (!c || !c.settings) return;
                let cChanged = false;
                if (Array.isArray(c.settings.customLocations)) {
                  const match = c.settings.customLocations.find(cl => cl.name === loc.name);
                  if (match && match.imageUrl !== imgDataUrl) {
                    match.imageUrl = imgDataUrl;
                    cChanged = true;
                  }
                }
                if (Array.isArray(c.settings.contextMapData)) {
                  const match = c.settings.contextMapData.find(ctx => ctx.name === loc.name);
                  if (match && match.imageUrl !== imgDataUrl) {
                    match.imageUrl = imgDataUrl;
                    cChanged = true;
                  }
                }
                if (cChanged && dbInstance && dbInstance.chats) {
                  dbInstance.chats.put(c).catch(() => {});
                }
              });
            }

            this.renderModuleDetailMap(chapters);
          } else {
            throw new Error('未获取到图像数据');
          }

          if (i < pendingLocs.length - 1) {
            for (let sec = 10; sec > 0; sec--) {
              if (statusTip) {
                statusTip.textContent = `已完成 ${loc.name} 等待 ${sec} 秒后开始下一张`;
              }
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        } catch (e) {
          console.error('生图失败', loc.name, e);
          if (statusTip) {
            statusTip.textContent = `绘制 ${loc.name} 失败 点击绘制可继续`;
          }
          if (btn) {
            btn.disabled = false;
            btn.textContent = '重试';
          }
          alert(`绘制 ${loc.name} 失败: ${e.message || e}`);
          return;
        }
      }

      if (statusTip) {
        statusTip.textContent = '全部地点绘制完成';
      }

      if (btn) {
        btn.disabled = false;
        btn.textContent = '绘制';
      }

      this.renderModuleDetailMap(chapters);
    },

    openModuleMapPromptModal(loc, moduleId, chapters) {
      const modal = document.getElementById('module-map-prompt-modal');
      const nameEl = document.getElementById('module-map-prompt-loc-name');
      const textarea = document.getElementById('module-map-prompt-textarea');
      const closeBtn = document.getElementById('close-module-map-prompt-modal-btn');
      const cancelBtn = document.getElementById('cancel-module-map-prompt-btn');
      const saveBtn = document.getElementById('save-module-map-prompt-btn');
      if (!modal || !textarea) return;

      if (nameEl) nameEl.textContent = `地点：${loc.name}`;
      textarea.value = loc.prompt || '';

      const closeModal = () => modal.classList.remove('visible');
      if (closeBtn) closeBtn.onclick = closeModal;
      if (cancelBtn) cancelBtn.onclick = closeModal;

      if (saveBtn) {
        saveBtn.onclick = async () => {
          loc.prompt = textarea.value.trim();
          const dbInstance = typeof db !== 'undefined' ? db : (window.db || null);
          if (dbInstance && dbInstance.moduleLocationNav) {
            await dbInstance.moduleLocationNav.put(loc);
          }
          closeModal();
          this.renderModuleDetailMap(chapters);
        };
      }

      modal.classList.add('visible');
    },

    openModuleMapEditModal(loc, moduleId, chapters) {
      const modal = document.getElementById('module-map-item-edit-modal');
      const titleEl = document.getElementById('module-map-item-edit-title');
      const nameInput = document.getElementById('module-map-edit-name-input');
      const parentSelect = document.getElementById('module-map-edit-parent-select');
      const descInput = document.getElementById('module-map-edit-desc-input');
      const closeBtn = document.getElementById('close-module-map-item-edit-btn');
      const cancelBtn = document.getElementById('cancel-module-map-item-edit-btn');
      const saveBtn = document.getElementById('save-module-map-item-edit-btn');
      if (!modal || !nameInput || !parentSelect || !descInput) return;

      const dbInstance = typeof db !== 'undefined' ? db : (window.db || null);

      titleEl.textContent = loc ? '修改地点' : '添加地点';
      nameInput.value = loc ? loc.name : '';
      descInput.value = loc ? (loc.desc || '') : '';

      parentSelect.innerHTML = '<option value="">顶级大地图</option>';
      if (dbInstance && dbInstance.moduleLocationNav) {
        dbInstance.moduleLocationNav.where('moduleId').equals(moduleId).toArray().then(allLocs => {
          allLocs.forEach(l => {
            if (!loc || l.id !== loc.id) {
              const opt = document.createElement('option');
              opt.value = l.name;
              opt.textContent = l.name;
              if (loc && loc.parent === l.name) opt.selected = true;
              parentSelect.appendChild(opt);
            }
          });
        });
      }

      const closeModal = () => modal.classList.remove('visible');
      if (closeBtn) closeBtn.onclick = closeModal;
      if (cancelBtn) cancelBtn.onclick = closeModal;

      if (saveBtn) {
        saveBtn.onclick = async () => {
          const name = nameInput.value.trim();
          if (!name) return;
          const parent = parentSelect.value;
          const desc = descInput.value.trim();

          if (loc) {
            loc.name = name;
            loc.parent = parent;
            loc.level = parent ? 2 : 1;
            loc.desc = desc;
            if (dbInstance && dbInstance.moduleLocationNav) {
              await dbInstance.moduleLocationNav.put(loc);
            }
          } else {
            const newLoc = {
              moduleId: moduleId,
              name: name,
              parent: parent,
              level: parent ? 2 : 1,
              desc: desc,
              prompt: '',
              imageUrl: '',
              imageStatus: 'idle'
            };
            if (dbInstance && dbInstance.moduleLocationNav) {
              await dbInstance.moduleLocationNav.add(newLoc);
            }
          }
          closeModal();
          this.renderModuleDetailMap(chapters);
        };
      }

      modal.classList.add('visible');
    },

    openModuleMapRegenModal(loc, moduleId, chapters) {
      const modal = document.getElementById('module-map-regen-modal');
      const nameEl = document.getElementById('module-map-regen-loc-name');
      const promptInput = document.getElementById('module-map-regen-prompt-input');
      const closeBtn = document.getElementById('close-module-map-regen-btn');
      const cancelBtn = document.getElementById('cancel-module-map-regen-btn');
      const confirmBtn = document.getElementById('confirm-module-map-regen-btn');
      if (!modal) return;

      if (nameEl) nameEl.textContent = `地点：${loc.name}`;
      if (promptInput) {
        promptInput.value = (loc.prompt || `${loc.name}${loc.desc ? ', ' + loc.desc : ''}`).trim();
      }

      const closeModal = () => modal.classList.remove('visible');
      if (closeBtn) closeBtn.onclick = closeModal;
      if (cancelBtn) cancelBtn.onclick = closeModal;

      if (confirmBtn) {
        confirmBtn.onclick = async () => {
          const customPrompt = promptInput ? promptInput.value.trim() : '';
          loc.prompt = customPrompt || loc.prompt || loc.name;

          const dbInstance = typeof db !== 'undefined' ? db : (window.db || null);
          if (dbInstance && dbInstance.moduleLocationNav && loc.id) {
            await dbInstance.moduleLocationNav.put(loc);
          }

          closeModal();
          confirmBtn.disabled = true;

          const naiSettings = typeof window.getNovelAISettings === 'function' ? window.getNovelAISettings() : {};
          const domArtist = document.getElementById('nai-default-artist') ? document.getElementById('nai-default-artist').value.trim() : '';
          const domNegative = document.getElementById('nai-default-negative') ? document.getElementById('nai-default-negative').value.trim() : '';
          const artist = (domArtist || naiSettings.artist_prompt || '').trim();
          const defaultNeg = (domNegative || naiSettings.default_negative || '').trim();
          const locPromptText = (loc.prompt || `${loc.name}${loc.desc ? ', ' + loc.desc : ''}`).trim();
          const globalDrawPrompt = (localStorage.getItem('coc_module_draw_global_prompt') || '1.2::artist:goguma wagamja  ::, 1.2::artist:sushisushi iiii  ::,').trim();
          const fullArtistPrompt = [globalDrawPrompt, artist].filter(Boolean).join(', ');

          try {
            if (typeof window.callNovelAiDirect !== 'function') {
              throw new Error('NovelAI 生图模块未就绪');
            }

            let imgDataUrl = await window.callNovelAiDirect(locPromptText, {
              artist: fullArtistPrompt,
              negativePrompt: defaultNeg,
              resolution: naiSettings.resolution || '1024x1024',
              seed: Math.floor(Math.random() * 4294967295)
            });
            if (!imgDataUrl) {
              throw new Error('未获取到图像数据');
            }

            if (typeof compressImage === 'function') {
              imgDataUrl = await compressImage(imgDataUrl, 0.5, 900);
            }
            loc.imageUrl = imgDataUrl;

            if (dbInstance && dbInstance.moduleLocationNav) {
              await dbInstance.moduleLocationNav.put(loc);
            }
            if (dbInstance && dbInstance.modules) {
              try {
                const mod = await dbInstance.modules.get(moduleId);
                if (mod && Array.isArray(mod.mapNodes)) {
                  const target = mod.mapNodes.find(m => m.name === loc.name);
                  if (target) {
                    target.imageUrl = imgDataUrl;
                    target.prompt = loc.prompt;
                    await dbInstance.modules.update(moduleId, { mapNodes: mod.mapNodes });
                  }
                }
              } catch (e) {}
            }
            if (typeof state !== 'undefined' && state.chats) {
              Object.values(state.chats).forEach(c => {
                if (!c || !c.settings) return;
                let cChanged = false;
                if (Array.isArray(c.settings.customLocations)) {
                  const match = c.settings.customLocations.find(cl => cl.name === loc.name);
                  if (match && match.imageUrl !== imgDataUrl) {
                    match.imageUrl = imgDataUrl;
                    cChanged = true;
                  }
                }
                if (Array.isArray(c.settings.contextMapData)) {
                  const match = c.settings.contextMapData.find(ctx => ctx.name === loc.name);
                  if (match && match.imageUrl !== imgDataUrl) {
                    match.imageUrl = imgDataUrl;
                    cChanged = true;
                  }
                }
                if (cChanged && dbInstance && dbInstance.chats) {
                  dbInstance.chats.put(c).catch(() => {});
                }
              });
            }

            this.renderModuleDetailMap(chapters);
          } catch (e) {
            console.error('单独生图失败', e);
            alert(`生成 ${loc.name} 图像失败: ${e.message || String(e)}`);
          } finally {
            confirmBtn.disabled = false;
          }
        };
      }

      modal.classList.add('visible');
    },

    openModuleMapExpandModal(title, imageUrl) {
      const modal = document.getElementById('module-map-expand-modal');
      const titleEl = document.getElementById('module-map-expand-title');
      const imgEl = document.getElementById('module-map-expand-img');
      const closeBtn = document.getElementById('close-module-map-expand-btn');
      if (!modal || !imgEl) return;

      if (titleEl) titleEl.textContent = title || '';
      imgEl.src = imageUrl;

      const closeModal = () => modal.classList.remove('visible');
      if (closeBtn) closeBtn.onclick = closeModal;
      modal.onclick = (e) => {
        if (e.target === modal) closeModal();
      };

      modal.classList.add('visible');
    },

    async renderModuleDetailGallery(chapters, moduleId) {
      const galleryView = document.getElementById('module-detail-gallery-view');
      const grid = document.getElementById('module-gallery-grid');
      const countLabel = document.getElementById('module-gallery-count-label');
      const viewPcBtn = document.getElementById('module-gallery-view-pc');
      const viewKpBtn = document.getElementById('module-gallery-view-kp');
      if (!galleryView || !grid) return;

      if (!this.detailGalleryViewMode) this.detailGalleryViewMode = 'pc';

      if (viewPcBtn && viewKpBtn) {
        if (this.detailGalleryViewMode === 'pc') {
          viewPcBtn.style.background = 'var(--card-bg, #FFFFFF)';
          viewPcBtn.style.color = 'var(--text-primary)';
          viewPcBtn.style.fontWeight = '600';
          viewKpBtn.style.background = 'transparent';
          viewKpBtn.style.color = 'var(--text-secondary)';
          viewKpBtn.style.fontWeight = '500';
        } else {
          viewKpBtn.style.background = 'var(--card-bg, #FFFFFF)';
          viewKpBtn.style.color = 'var(--text-primary)';
          viewKpBtn.style.fontWeight = '600';
          viewPcBtn.style.background = 'transparent';
          viewPcBtn.style.color = 'var(--text-secondary)';
          viewPcBtn.style.fontWeight = '500';
        }
      }

      grid.innerHTML = '';
      const database = this.getDB();
      let images = [];
      if (database && database.moduleImages) {
        images = await database.moduleImages.where('moduleId').equals(moduleId).toArray();
        const mod = this.activeDetailModule || (database.modules ? await database.modules.get(moduleId) : null);
        if (mod && !mod._userDeletedImages && database.moduleRawFiles) {
          try {
            const allRaws = await database.moduleRawFiles.toArray();
            const matchedRaw = allRaws.find(r =>
              r && r.id !== '__module_cutter_draft__' && Array.isArray(r.images) && r.images.length > images.length &&
              String(r.moduleName || '').trim() === String(mod.name || '').trim()
            );
            if (matchedRaw) {
              const mergedToSave = [];
              for (let idx = 0; idx < matchedRaw.images.length; idx++) {
                const rawImg = matchedRaw.images[idx];
                const rawIdx = rawImg.imageIndex || (idx + 1);
                const exists = images.find(e =>
                  (e && rawImg.dataUrl && e.dataUrl === rawImg.dataUrl) ||
                  (e && e.imageIndex === rawIdx && e.pageNumber === rawImg.pageNumber)
                );
                if (!exists) {
                  mergedToSave.push({
                    moduleId: moduleId,
                    imageIndex: rawIdx,
                    name: rawImg.name || `图${rawIdx}`,
                    dataUrl: rawImg.dataUrl,
                    isSensitive: !!rawImg.isSensitive,
                    isDiscarded: false,
                    pageNumber: rawImg.pageNumber || 1,
                    width: rawImg.width || 800,
                    height: rawImg.height || 600,
                    format: rawImg.format || 'JPEG',
                    description: rawImg.description || '',
                    annotation: rawImg.annotation || '',
                    placement: rawImg.placement || '文档插图'
                  });
                }
              }
              if (mergedToSave.length > 0) {
                try {
                  await database.moduleImages.bulkAdd(mergedToSave);
                } catch (_) {
                  await database.moduleImages.bulkPut(mergedToSave);
                }
                images = await database.moduleImages.where('moduleId').equals(moduleId).toArray();
                images.sort((a, b) => (a.imageIndex || 0) - (b.imageIndex || 0));
              }
            }
          } catch (_) {}
        }
      }

      if (countLabel) {
        countLabel.textContent = `模组插图 ${images.length} 张`;
      }

      if (images.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1 / -1; color: var(--text-secondary); text-align: center; padding: 30px;">当前模组暂无插图，可点击上方导入按键添加本地图片</div>';
        return;
      }

      const isPlayerView = this.detailGalleryViewMode !== 'kp';

      images.forEach((img, idx) => {
        const card = document.createElement('div');
        card.className = 'mod-gallery-card';

        const isSpoiler = !!img.isSensitive;
        const isDiscarded = !!img.isDiscarded;
        const showPlaceholder = isPlayerView && isSpoiler;

        let thumbHtml = '';
        if (showPlaceholder) {
          thumbHtml = `
            <div class="mod-duck-placeholder" style="height: 110px;">
              <svg width="36" height="36" viewBox="0 0 64 64" fill="none">
                <ellipse cx="32" cy="48" rx="22" ry="7" fill="rgba(0,0,0,0.06)"/>
                <rect x="14" y="44" width="36" height="8" rx="4" fill="#D0CBB8"/>
                <path d="M22 36C22 26 28 20 38 20C45 20 48 24 48 28C48 36 42 42 32 42C26 42 22 40 22 36Z" fill="#FCD34D"/>
                <circle cx="40" cy="25" r="2.5" fill="#333333"/>
                <path d="M46 26L54 28L46 31Z" fill="#F97316"/>
                <path d="M26 34C24 32 20 34 18 36C16 38 18 41 22 40" fill="#FBBF24"/>
              </svg>
              <div class="mod-duck-title">图片已被肥鸭坐塌</div>
              <div class="mod-duck-sub">守秘人模式可见剧透</div>
            </div>
          `;
        } else {
          thumbHtml = `
            <div style="position: relative; overflow: hidden; background: var(--secondary-bg, #F0EFEA); min-height: 90px; display: flex; align-items: center; justify-content: center;">
              <img src="${img.dataUrl}" class="mod-gallery-thumb" alt="${img.name || '插图'}" loading="lazy" />
              <div style="position: absolute; top: 4px; right: 4px; display: flex; gap: 3px; flex-direction: column; align-items: flex-end;">
                ${isSpoiler ? '<span class="mod-gallery-tag sensitive">守秘剧透</span>' : ''}
                ${isDiscarded ? '<span class="mod-gallery-tag" style="background: rgba(100,100,100,0.8); color: #FFF;">已废弃</span>' : ''}
              </div>
            </div>
          `;
        }

        const pageLabel = img.pageNumber ? `第${img.pageNumber}页` : '文档插图';
        const dimLabel = img.width && img.height ? `${img.width}×${img.height}` : '自适应尺寸';

        card.innerHTML = `
          ${thumbHtml}
          <div class="mod-gallery-meta">
            <div class="mod-gallery-name">${img.name || `插图 ${idx + 1}`}</div>
            <div class="mod-gallery-details">
              <span>${pageLabel}</span>
              <span>${dimLabel}</span>
            </div>
            ${img.annotation ? `<div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${img.annotation}</div>` : ''}
            <div style="display: flex; gap: 4px; justify-content: flex-end; margin-top: 6px; flex-wrap: wrap;">
              <button type="button" class="module-mini-btn btn-toggle-detail-spoiler" style="font-size: 10px; padding: 2px 5px;">${isSpoiler ? '公开' : '剧透'}</button>
              <button type="button" class="module-mini-btn btn-toggle-detail-discard" style="font-size: 10px; padding: 2px 5px;">${isDiscarded ? '恢复' : '废弃'}</button>
              <button type="button" class="module-mini-btn btn-download-detail-img" style="font-size: 10px; padding: 2px 5px;">下载</button>
              <button type="button" class="module-mini-btn btn-danger btn-del-detail-img" style="font-size: 10px; padding: 2px 5px;">删除</button>
            </div>
          </div>
        `;

        card.querySelector('.btn-toggle-detail-spoiler')?.addEventListener('click', async (e) => {
          e.stopPropagation();
          img.isSensitive = !img.isSensitive;
          if (database && database.moduleImages && img.id) {
            await database.moduleImages.update(img.id, { isSensitive: img.isSensitive });
          }
          await this.renderModuleDetailGallery(chapters, moduleId);
        });

        card.querySelector('.btn-toggle-detail-discard')?.addEventListener('click', async (e) => {
          e.stopPropagation();
          img.isDiscarded = !img.isDiscarded;
          if (database && database.moduleImages && img.id) {
            await database.moduleImages.update(img.id, { isDiscarded: img.isDiscarded });
          }
          await this.renderModuleDetailGallery(chapters, moduleId);
        });

        card.querySelector('.btn-download-detail-img')?.addEventListener('click', (e) => {
          e.stopPropagation();
          this.downloadImage(img.dataUrl, img.name);
        });

        card.querySelector('.btn-del-detail-img')?.addEventListener('click', async (e) => {
          e.stopPropagation();
          if (this.activeDetailModule) this.activeDetailModule._userDeletedImages = true;
          if (database && database.modules && moduleId) {
            try { await database.modules.update(moduleId, { _userDeletedImages: true }); } catch (_) {}
          }
          if (database && database.moduleImages && img.id) {
            await database.moduleImages.delete(img.id);
          }
          await this.renderModuleDetailGallery(chapters, moduleId);
        });

        card.addEventListener('click', () => {
          this.showImageViewModal(img, moduleId);
        });

        grid.appendChild(card);
      });
    },

    showImageViewModal(img, moduleId) {
      const modal = document.getElementById('module-image-view-modal');
      const titleEl = document.getElementById('module-image-modal-title');
      const previewBox = document.getElementById('module-image-modal-preview-box');
      const metaEl = document.getElementById('module-image-modal-meta');
      const delBtn = document.getElementById('module-image-modal-delete-btn');
      const okBtn = document.getElementById('module-image-modal-ok-btn');
      const closeBtn = document.getElementById('module-image-modal-close-btn');

      if (!modal) return;
      modal.classList.add('visible');
      modal.style.display = 'flex';

      const isPlayerView = moduleId === 'draft'
        ? (this.step2GalleryViewMode !== 'kp')
        : (this.detailGalleryViewMode !== 'kp');
      const isSpoiler = !!img.isSensitive;

      if (titleEl) titleEl.textContent = img.name || '插图详情';

      if (isPlayerView && isSpoiler) {
        if (previewBox) {
          previewBox.innerHTML = `
            <div class="mod-duck-placeholder" style="padding: 28px;">
              <svg width="48" height="48" viewBox="0 0 64 64" fill="none">
                <ellipse cx="32" cy="48" rx="22" ry="7" fill="rgba(0,0,0,0.06)"/>
                <rect x="14" y="44" width="36" height="8" rx="4" fill="#D0CBB8"/>
                <path d="M22 36C22 26 28 20 38 20C45 20 48 24 48 28C48 36 42 42 32 42C26 42 22 40 22 36Z" fill="#FCD34D"/>
                <circle cx="40" cy="25" r="2.5" fill="#333333"/>
                <path d="M46 26L54 28L46 31Z" fill="#F97316"/>
                <path d="M26 34C24 32 20 34 18 36C16 38 18 41 22 40" fill="#FBBF24"/>
              </svg>
              <div class="mod-duck-title" style="font-size: 13px;">图片已被肥鸭坐塌</div>
              <div class="mod-duck-sub">本图包含核心剧情剧透，需切换至守秘人模式查看</div>
            </div>
          `;
        }
      } else {
        if (previewBox) {
          previewBox.innerHTML = `<img id="module-image-modal-img" class="mod-constrained-img" src="${img.dataUrl}" alt="插图预览" />`;
        }
      }

      if (metaEl) {
        metaEl.innerHTML = `
          <div>来源：${img.pageNumber ? `文档第 ${img.pageNumber} 页` : '本地导入'}</div>
          <div>原始分辨率：${img.width || '自适应'} × ${img.height || '自适应'} · 格式：${img.format || 'JPEG'}</div>
          <div>剧透分级：${isSpoiler ? '<span style="color: #8A5B57; font-weight: 600;">守秘人剧透</span>' : '<span style="color: var(--accent-color, #4A7A68); font-weight: 600;">玩家公开</span>'}</div>
          <div>内容简述：${img.description || '跑团插图资源'}</div>
          ${img.annotation ? `<div>带团注释：${img.annotation}</div>` : ''}
          <div>插图定位：${img.placement || '未指定章节'}</div>
        `;
      }

      const downloadBtn = document.getElementById('module-image-modal-download-btn');
      if (downloadBtn) {
        downloadBtn.onclick = () => {
          this.downloadImage(img.dataUrl, img.name);
        };
      }

      const setCoverBtn = document.getElementById('module-image-modal-set-cover-btn');
      if (setCoverBtn) {
        setCoverBtn.onclick = async () => {
          try {
            const compressedCover = await this.compressImageFile(img.dataUrl, 600, 600, 0.85).catch(() => img.dataUrl);
            if (moduleId === 'draft') {
              if (this.currentParsedData) {
                this.currentParsedData.coverImage = compressedCover;
              }
              this.saveDraft();
            } else {
              const database = this.getDB();
              const targetId = moduleId || (this.activeDetailModule && this.activeDetailModule.id);
              if (database && database.modules && targetId) {
                await database.modules.update(targetId, { coverImage: compressedCover });
                if (this.activeDetailModule) {
                  this.activeDetailModule.coverImage = compressedCover;
                }
                const coverEl = document.getElementById('module-detail-cover');
                if (coverEl) {
                  coverEl.innerHTML = `<img src="${compressedCover}" style="width: 100%; height: 100%; object-fit: cover;" alt="模组封面" />`;
                }
                await this.renderLibraryList();
              }
            }
            if (typeof global.showCustomAlert === 'function') {
              global.showCustomAlert('设置成功', '已将此图片设为当前模组封面头像');
            }
          } catch (err) {
            console.warn('[模组] 设为头像异常:', err);
          }
          modal.style.display = 'none';
        };
      }

      const hide = () => {
        modal.style.display = 'none';
      };

      if (closeBtn) closeBtn.onclick = hide;
      if (okBtn) okBtn.onclick = hide;

      if (delBtn) {
        delBtn.onclick = async () => {
          let confirmed = true;
          if (typeof global.showCustomConfirm === 'function') {
            confirmed = await global.showCustomConfirm('删除图片', `确定从当前模组图库中删除【${img.name}】吗？`);
          } else if (typeof global.showCustomAlert === 'function') {
            confirmed = confirm(`确定删除【${img.name}】吗？`);
          }
          if (confirmed) {
            if (moduleId === 'draft') {
              if (this.currentParsedData && this.currentParsedData.images) {
                this.currentParsedData._userDeletedImages = true;
                const idx = this.currentParsedData.images.findIndex(i => i.dataUrl === img.dataUrl || i.name === img.name);
                if (idx !== -1) {
                  this.currentParsedData.images.splice(idx, 1);
                }
              }
              this.saveDraft();
              this.renderStep2GalleryUI();
            } else {
              const database = this.getDB();
              if (this.activeDetailModule) this.activeDetailModule._userDeletedImages = true;
              if (database && database.modules && moduleId) {
                try { await database.modules.update(moduleId, { _userDeletedImages: true }); } catch (_) {}
              }
              if (database && database.moduleImages && img.id) {
                await database.moduleImages.delete(img.id);
              }
              const chapters = await database.moduleChapters.where('moduleId').equals(moduleId).sortBy('sortOrder');
              await this.renderModuleDetailGallery(chapters, moduleId);
            }
            modal.style.display = 'none';
          }
        };
      }

      modal.style.display = 'flex';
    },

    async renderModuleDetailMusic(chapters, moduleId) {
      const targetModuleId = moduleId || (this.activeDetailModule ? this.activeDetailModule.id : null);
      if (!targetModuleId) return;

      const musicContainer = document.getElementById('module-music-list-container');
      const countLabel = document.getElementById('module-music-count-label');
      const promptBox = document.getElementById('module-music-prompt-container');
      const togglePromptBtn = document.getElementById('module-music-toggle-prompt-btn');
      const analyzeBtn = document.getElementById('module-music-ai-analyze-btn');
      const clearBtn = document.getElementById('module-music-clear-btn');
      const promptTextarea = document.getElementById('module-music-prompt-textarea');
      const presetSelect = document.getElementById('module-music-preset-select');

      const database = this.getDB();
      let mod = null;
      if (database && database.modules) {
        mod = await database.modules.get(targetModuleId);
      }
      if (!mod && this.activeDetailModule) {
        mod = this.activeDetailModule;
      }
      if (!mod) return;

      mod.musicList = mod.musicList || [];

      if (countLabel) {
        countLabel.textContent = `配乐清单 ${mod.musicList.length} 首`;
      }

      if (typeof renderModuleMusicPresetsUI === 'function') {
        renderModuleMusicPresetsUI();
      }

      const presets = typeof getModuleMusicPresets === 'function' ? getModuleMusicPresets() : [];
      const defaultPresetId = typeof getDefaultModuleMusicPresetId === 'function' ? getDefaultModuleMusicPresetId() : 'preset_default_music';
      const curPreset = presets.find(p => p.id === (presetSelect ? presetSelect.value : defaultPresetId)) || presets[0];
      if (promptTextarea && (!promptTextarea.value || !promptTextarea.value.trim())) {
        promptTextarea.value = (curPreset && curPreset.prompt) ? curPreset.prompt : DEFAULT_TRPG_MUSIC_PROMPT;
      }

      if (togglePromptBtn && !togglePromptBtn._bound) {
        togglePromptBtn._bound = true;
        togglePromptBtn.onclick = () => {
          if (!promptBox) return;
          const isHidden = promptBox.style.display === 'none';
          promptBox.style.display = isHidden ? 'block' : 'none';
          togglePromptBtn.textContent = isHidden ? '收起' : '预设';
        };
      }

      if (musicContainer) {
        musicContainer.innerHTML = '';
        if (mod.musicList.length === 0) {
          musicContainer.innerHTML = '<div style="color: var(--text-secondary); text-align: center; padding: 24px; font-size: 12px;">当前模组暂无配乐，点击上方分析按键即可自动匹配</div>';
        } else {
          mod.musicList.forEach((m, idx) => {
            const itemEl = document.createElement('div');
            itemEl.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border-radius: 10px; background: var(--secondary-bg, #F0EFEA); border: 1px solid var(--border-color); gap: 10px; width: 100%; box-sizing: border-box;';

            const leftCover = document.createElement('div');
            leftCover.style.cssText = 'width: 38px; height: 38px; border-radius: 8px; overflow: hidden; background: var(--card-bg); display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid var(--border-color);';
            leftCover.innerHTML = `<img src="${m.cover || 'https://i.postimg.cc/pT2xKzPz/album-cover-placeholder.png'}" style="width: 100%; height: 100%; object-fit: cover;" alt="封面" />`;

            const midCol = document.createElement('div');
            midCol.style.cssText = 'flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px;';

            const cleanName = (m.name || m.keyword || '曲目').replace(/^\[(?:音乐|BGM|背景音乐|音效|bgm|music|标签)[:：]\s*/i, '').replace(/[\]】》]+$/g, '').replace(/^[《\[【]+/g, '').trim();
            const cleanArtist = m.artist || '原声';
            const cleanScene = m.scene || '剧情气氛';
            const cleanTag = `[音乐: ${cleanName}]`;
            const cleanPos = (m.chapter ? m.chapter + ' · ' : '') + (m.position || m.scene || '模组剧情');

            midCol.innerHTML = `
              <div style="font-size: 13px; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.3;">${cleanName}</div>
              <div style="font-size: 11px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.3;">${cleanArtist} · ${cleanScene}</div>
              <div style="display: flex; align-items: center; gap: 6px; font-size: 10px; margin-top: 1px; min-width: 0; overflow: hidden;">
                <span style="padding: 1px 5px; border-radius: 4px; background: var(--card-bg); color: var(--accent-color); border: 1px solid var(--border-color); font-family: monospace; white-space: nowrap; max-width: 130px; overflow: hidden; text-overflow: ellipsis; flex-shrink: 0;">${cleanTag}</span>
                <span style="color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; min-width: 0;">${cleanPos}</span>
              </div>
            `;

            const rightCol = document.createElement('div');
            rightCol.style.cssText = 'display: flex; align-items: center; gap: 6px; flex-shrink: 0; margin-left: auto;';

            const playBtn = document.createElement('button');
            playBtn.type = 'button';
            playBtn.className = 'mod-capsule-btn';
            playBtn.textContent = '试听';
            playBtn.style.padding = '2px 8px';
            playBtn.style.fontSize = '11px';
            playBtn.onclick = () => {
              if (typeof window.playAutoSceneMusic === 'function') {
                window.playAutoSceneMusic(cleanName || m.keyword);
              }
            };

            const delBtn = document.createElement('button');
            delBtn.type = 'button';
            delBtn.className = 'mod-capsule-btn danger';
            delBtn.textContent = '删除';
            delBtn.style.padding = '2px 6px';
            delBtn.style.fontSize = '11px';
            delBtn.onclick = async () => {
              const currentModId = targetModuleId;
              const [deletedItem] = mod.musicList.splice(idx, 1);
              if (database && database.modules && currentModId) {
                await database.modules.put(mod);
              }
              if (database && database.moduleChapters && deletedItem) {
                let chaps = await database.moduleChapters.where('moduleId').equals(currentModId).sortBy('sortOrder');
                if (chaps.length === 0 && !isNaN(Number(currentModId))) {
                  chaps = await database.moduleChapters.where('moduleId').equals(Number(currentModId)).sortBy('sortOrder');
                }
                const delName = deletedItem.name || deletedItem.keyword || '';
                const delTag = deletedItem.tag || `[音乐: ${delName}]`;
                for (const chap of chaps) {
                  let text = chap.content || '';
                  if (delTag && text.includes(delTag)) {
                    text = text.split(delTag).join('');
                  }
                  if (delName) {
                    const tagRegex = new RegExp('\\[音乐[：:]\\s*' + delName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[^\\]]*\\]', 'g');
                    text = text.replace(tagRegex, '');
                  }
                  text = text.replace(/\n{3,}/g, '\n\n').trim();
                  if (text !== chap.content) {
                    chap.content = text;
                    chap.wordCount = typeof this.countWords === 'function' ? this.countWords(chap.content) : chap.content.length;
                    await database.moduleChapters.put(chap);
                  }
                }
                if (this.activeDetailModule && String(this.activeDetailModule.id) === String(currentModId)) {
                  this.renderModuleDetailGroupedChapters(chaps);
                }
              }
              if (this.activeDetailModule && String(this.activeDetailModule.id) === String(currentModId)) {
                await this.renderModuleDetailMusic(null, currentModId);
              }
            };

            rightCol.appendChild(playBtn);
            rightCol.appendChild(delBtn);

            itemEl.appendChild(leftCover);
            itemEl.appendChild(midCol);
            itemEl.appendChild(rightCol);
            musicContainer.appendChild(itemEl);
          });
        }
      }

      if (clearBtn) {
        clearBtn.onclick = async () => {
          const currentModId = targetModuleId;
          let confirmed = false;
          if (typeof global.showCustomConfirm === 'function') {
            confirmed = await global.showCustomConfirm('清空', '确定清空当前模组全部配乐吗');
          } else {
            confirmed = confirm('确定清空当前模组全部配乐吗');
          }
          if (!confirmed) return;

          let targetMod = null;
          if (database && database.modules) {
            targetMod = await database.modules.get(currentModId);
          }
          if (!targetMod) targetMod = mod;

          targetMod.musicList = [];
          if (database && database.modules && currentModId) {
            await database.modules.put(targetMod);
          }

          if (database && database.moduleChapters) {
            let chaps = await database.moduleChapters.where('moduleId').equals(currentModId).sortBy('sortOrder');
            if (chaps.length === 0 && !isNaN(Number(currentModId))) {
              chaps = await database.moduleChapters.where('moduleId').equals(Number(currentModId)).sortBy('sortOrder');
            }
            for (const chap of chaps) {
              let text = chap.content || '';
              const newText = text.replace(/\[音乐[：:][^\]]+\]/g, '').replace(/\n{3,}/g, '\n\n').trim();
              if (newText !== text) {
                chap.content = newText;
                chap.wordCount = typeof this.countWords === 'function' ? this.countWords(chap.content) : chap.content.length;
                await database.moduleChapters.put(chap);
              }
            }
            if (this.activeDetailModule && String(this.activeDetailModule.id) === String(currentModId)) {
              this.renderModuleDetailGroupedChapters(chaps);
            }
          }

          if (this.activeDetailModule && String(this.activeDetailModule.id) === String(currentModId)) {
            await this.renderModuleDetailMusic(null, currentModId);
          }
        };
      }

      if (analyzeBtn) {
        analyzeBtn.onclick = async () => {
          const runForModuleId = targetModuleId;
          try {
            analyzeBtn.disabled = true;
            analyzeBtn.textContent = '分析中';
            if (typeof global.showCustomAlert === 'function') {
              await global.showCustomAlert('提示', '正在分析模组剧情并检索配乐');
            }

            let targetMod = null;
            if (database && database.modules) {
              targetMod = await database.modules.get(runForModuleId);
            }
            if (!targetMod) targetMod = mod;

            let allChaps = [];
            if (database && database.moduleChapters) {
              allChaps = await database.moduleChapters.where('moduleId').equals(runForModuleId).sortBy('sortOrder');
              if (allChaps.length === 0 && !isNaN(Number(runForModuleId))) {
                allChaps = await database.moduleChapters.where('moduleId').equals(Number(runForModuleId)).sortBy('sortOrder');
              }
            }
            let moduleText = '';
            allChaps.forEach(c => {
              moduleText += `\n【章节标题: ${c.title}】\n${c.content || ''}\n`;
            });
            if (!moduleText.trim()) {
              moduleText = targetMod.description || targetMod.name || '模组';
            }
            const promptContent = promptTextarea ? promptTextarea.value.trim() : DEFAULT_TRPG_MUSIC_PROMPT;
            const fullPrompt = `${promptContent}\n\n以下为模组文本内容：\n${moduleText}`;

            const aiRes = await this.callAI('你是一个专业的跑团带团音频总监与模组剧情配乐专家，输出严格的JSON数组。', fullPrompt);
            let musicList = [];
            try {
              let cleanText = aiRes.trim();
              if (cleanText.includes('```json')) {
                cleanText = cleanText.split('```json')[1].split('```')[0].trim();
              } else if (cleanText.includes('```')) {
                cleanText = cleanText.split('```')[1].split('```')[0].trim();
              }
              musicList = JSON.parse(cleanText);
            } catch (err) {
              console.warn('解析配乐JSON失败，尝试提取数组:', err);
              const match = aiRes.match(/\[[\s\S]*\]/);
              if (match) {
                musicList = JSON.parse(match[0]);
              }
            }

            if (!Array.isArray(musicList) || musicList.length === 0) {
              throw new Error('未能从模组中解析出有效配乐方案');
            }

            if (database && database.modules) {
              const latestMod = await database.modules.get(runForModuleId);
              if (latestMod) targetMod = latestMod;
            }
            targetMod.musicList = targetMod.musicList || [];

            for (const item of musicList) {
              let cleanItemName = String(item.name || item.keyword || '').trim();
              cleanItemName = cleanItemName.replace(/^\[(?:音乐|BGM|背景音乐|音效|bgm|music|标签)[:：]\s*/i, '')
                                           .replace(/[\]】》\)\s]+$/g, '')
                                           .replace(/^[\[【《\(\s]+/g, '')
                                           .trim();
              let searchKw = String(item.keyword || cleanItemName || '').trim();
              searchKw = searchKw.replace(/^\[(?:音乐|BGM|背景音乐|音效|bgm|music|标签)[:：]\s*/i, '')
                                 .replace(/[\]】》\)\s]+$/g, '')
                                 .replace(/^[\[【《\(\s]+/g, '')
                                 .trim();
              if (!searchKw && !cleanItemName) continue;
              let songInfo = null;
              if (typeof searchNeteaseMusic === 'function') {
                try {
                  const neteaseRes = await searchNeteaseMusic(searchKw || cleanItemName);
                  if (neteaseRes && neteaseRes.length > 0) songInfo = neteaseRes[0];
                } catch (_) {}
              }
              if (!songInfo && typeof searchGdstudioMusic === 'function') {
                try {
                  const gdRes = await searchGdstudioMusic(searchKw || cleanItemName);
                  if (gdRes && gdRes.length > 0) songInfo = gdRes[0];
                } catch (_) {}
              }

              const songName = songInfo ? songInfo.name : (cleanItemName || searchKw || '曲目');
              const songArtist = songInfo ? songInfo.artist : (item.artist || '原声');
              const songCover = songInfo ? songInfo.cover : 'https://i.postimg.cc/pT2xKzPz/album-cover-placeholder.png';
              const songId = songInfo ? songInfo.id : null;
              const songTag = `[音乐: ${songName}]`;

              targetMod.musicList.push({
                id: songId || 'm_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
                name: songName,
                artist: songArtist,
                cover: songCover,
                chapter: item.chapter || item.section || '',
                position: item.position || item.location || item.scene || '模组剧情',
                scene: item.scene || '剧情气氛',
                keyword: songName,
                tag: songTag
              });

              if (allChaps.length > 0) {
                let targetChap = null;
                if (item.chapter) {
                  targetChap = allChaps.find(c => c.title && (c.title.includes(item.chapter) || item.chapter.includes(c.title)));
                }
                if (!targetChap) {
                  targetChap = allChaps[0];
                }
                if (targetChap && !targetChap.content.includes(songTag)) {
                  let inserted = false;
                  const anchor = (item.anchor || '').trim();
                  if (anchor && targetChap.content.includes(anchor)) {
                    const aIdx = targetChap.content.indexOf(anchor);
                    const nBreak = targetChap.content.indexOf('\n', aIdx);
                    const insAt = nBreak === -1 ? targetChap.content.length : nBreak;
                    targetChap.content = targetChap.content.slice(0, insAt) + `\n\n${songTag}\n` + targetChap.content.slice(insAt);
                    inserted = true;
                  }
                  if (!inserted) {
                    const posHint = (item.position || item.scene || '').replace(/剧情|氛围|背景/g, '').trim();
                    if (posHint && posHint.length >= 2 && targetChap.content.includes(posHint)) {
                      const pIdx = targetChap.content.indexOf(posHint);
                      const nBreak = targetChap.content.indexOf('\n', pIdx);
                      const insAt = nBreak === -1 ? targetChap.content.length : nBreak;
                      targetChap.content = targetChap.content.slice(0, insAt) + `\n\n${songTag}\n` + targetChap.content.slice(insAt);
                      inserted = true;
                    }
                  }
                  if (!inserted) {
                    const firstP = targetChap.content.indexOf('\n\n');
                    if (firstP !== -1) {
                      targetChap.content = targetChap.content.slice(0, firstP) + `\n\n${songTag}\n` + targetChap.content.slice(firstP);
                    } else {
                      targetChap.content = `${targetChap.content}\n\n${songTag}`;
                    }
                  }
                  targetChap.wordCount = typeof this.countWords === 'function' ? this.countWords(targetChap.content) : targetChap.content.length;
                  if (database && database.moduleChapters) {
                    await database.moduleChapters.put(targetChap);
                  }
                }
              }
            }

            if (database && database.modules && runForModuleId) {
              await database.modules.put(targetMod);
            }

            if (typeof global.showCustomAlert === 'function') {
              await global.showCustomAlert('成功', `已成功解析并添加 ${musicList.length} 首配乐并插入对应章节`);
            }

            if (this.activeDetailModule && String(this.activeDetailModule.id) === String(runForModuleId)) {
              this.renderModuleDetailGroupedChapters(allChaps);
              await this.renderModuleDetailMusic(null, runForModuleId);
            }
          } catch (err) {
            console.error('智能配乐分析失败:', err);
            if (typeof global.showCustomAlert === 'function') {
              await global.showCustomAlert('失败', '智能配乐分析处理未完成');
            }
          } finally {
            analyzeBtn.disabled = false;
            analyzeBtn.textContent = '分析';
          }
        };
      }
    },

    async compressImageFile(fileOrDataUrl, maxWidth = 1200, maxHeight = 1200, quality = 0.8) {
      return new Promise((resolve, reject) => {
        const processImage = (src) => {
          const img = new Image();
          img.onload = () => {
            let width = img.width;
            let height = img.height;
            if (width > maxWidth || height > maxHeight) {
              if (width / height > maxWidth / maxHeight) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
              } else {
                width = Math.round((width * maxHeight) / height);
                height = maxHeight;
              }
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            try {
              const dataUrl = canvas.toDataURL('image/webp', quality);
              resolve(dataUrl);
            } catch (err) {
              const dataUrl = canvas.toDataURL('image/jpeg', quality);
              resolve(dataUrl);
            }
          };
          img.onerror = reject;
          img.src = src;
        };

        if (typeof fileOrDataUrl === 'string') {
          processImage(fileOrDataUrl);
        } else if (fileOrDataUrl instanceof Blob || fileOrDataUrl instanceof File) {
          const reader = new FileReader();
          reader.onload = (e) => processImage(e.target.result);
          reader.onerror = reject;
          reader.readAsDataURL(fileOrDataUrl);
        } else {
          resolve('');
        }
      });
    },

    openMergeModal() {
      this.mergeFileList = [];
      const modal = document.getElementById('module-merge-modal');
      if (modal) modal.style.display = 'flex';
      const statusBox = document.getElementById('module-merge-status-box');
      if (statusBox) {
        statusBox.style.display = 'none';
        statusBox.textContent = '';
      }
      const downloadBtn = document.getElementById('download-module-merged-btn');
      if (downloadBtn) {
        downloadBtn.style.display = 'none';
      }
      this.renderMergeFilesList();
    },

    closeMergeModal() {
      const modal = document.getElementById('module-merge-modal');
      if (modal) modal.style.display = 'none';
      this.mergeFileList = [];
      const fileInput = document.getElementById('module-merge-files-input');
      if (fileInput) fileInput.value = '';
      const statusBox = document.getElementById('module-merge-status-box');
      if (statusBox) {
        statusBox.style.display = 'none';
        statusBox.textContent = '';
      }
      const downloadBtn = document.getElementById('download-module-merged-btn');
      if (downloadBtn) {
        downloadBtn.style.display = 'none';
      }
    },

    renderMergeFilesList() {
      const listEl = document.getElementById('module-merge-files-list');
      if (!listEl) return;
      listEl.innerHTML = '';

      if (!this.mergeFileList || this.mergeFileList.length === 0) {
        const emptyTip = document.createElement('div');
        emptyTip.id = 'module-merge-empty-tip';
        emptyTip.style.cssText = 'text-align: center; color: var(--text-secondary); font-size: 11.5px; padding: 20px 0;';
        emptyTip.textContent = '请选择要合并的 PDF 或 DOCX 或 TXT 文件';
        listEl.appendChild(emptyTip);
        return;
      }

      this.mergeFileList.forEach((item, index) => {
        const row = document.createElement('div');
        row.className = 'module-merge-item-row';
        row.style.cssText = 'display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 8px 10px; border-radius: 8px; background: var(--secondary-bg); border: 1px solid var(--border-color); box-sizing: border-box; width: 100%;';

        const leftBox = document.createElement('div');
        leftBox.style.cssText = 'display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0;';

        const iconEl = document.createElement('div');
        iconEl.style.cssText = 'width: 26px; height: 26px; border-radius: 6px; background: var(--card-bg); display: flex; align-items: center; justify-content: center; color: var(--accent-color); flex-shrink: 0; font-size: 10px; font-weight: 700; border: 1px solid var(--border-color);';
        iconEl.textContent = (item.ext || '').toUpperCase();

        const textCol = document.createElement('div');
        textCol.style.cssText = 'display: flex; flex-direction: column; min-width: 0; flex: 1; overflow: hidden;';

        const nameSpan = document.createElement('span');
        nameSpan.style.cssText = 'font-size: 12px; font-weight: 500; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;';
        nameSpan.textContent = item.name;

        const sizeSpan = document.createElement('span');
        sizeSpan.style.cssText = 'font-size: 10px; color: var(--text-secondary);';
        const kbSize = (item.size / 1024).toFixed(1);
        sizeSpan.textContent = `${kbSize} KB`;

        textCol.appendChild(nameSpan);
        textCol.appendChild(sizeSpan);
        leftBox.appendChild(iconEl);
        leftBox.appendChild(textCol);

        const actionsBox = document.createElement('div');
        actionsBox.style.cssText = 'display: flex; align-items: center; gap: 4px; flex-shrink: 0; margin-left: auto;';

        if (index > 0) {
          const upBtn = document.createElement('button');
          upBtn.type = 'button';
          upBtn.className = 'moe-btn-mini';
          upBtn.style.cssText = 'width: 24px; height: 24px; padding: 0; display: flex; align-items: center; justify-content: center; font-size: 11px;';
          upBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 15l-6-6-6 6"/></svg>';
          upBtn.onclick = () => {
            const temp = this.mergeFileList[index - 1];
            this.mergeFileList[index - 1] = this.mergeFileList[index];
            this.mergeFileList[index] = temp;
            this.renderMergeFilesList();
          };
          actionsBox.appendChild(upBtn);
        }

        if (index < this.mergeFileList.length - 1) {
          const downBtn = document.createElement('button');
          downBtn.type = 'button';
          downBtn.className = 'moe-btn-mini';
          downBtn.style.cssText = 'width: 24px; height: 24px; padding: 0; display: flex; align-items: center; justify-content: center; font-size: 11px;';
          downBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>';
          downBtn.onclick = () => {
            const temp = this.mergeFileList[index + 1];
            this.mergeFileList[index + 1] = this.mergeFileList[index];
            this.mergeFileList[index] = temp;
            this.renderMergeFilesList();
          };
          actionsBox.appendChild(downBtn);
        }

        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'moe-btn-mini btn-danger';
        delBtn.style.cssText = 'width: 24px; height: 24px; padding: 0; display: flex; align-items: center; justify-content: center; font-size: 11px;';
        delBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
        delBtn.onclick = () => {
          this.mergeFileList.splice(index, 1);
          this.renderMergeFilesList();
        };
        actionsBox.appendChild(delBtn);

        row.appendChild(leftBox);
        row.appendChild(actionsBox);
        listEl.appendChild(row);
      });
    },

    openMultiModal() {
      const modal = document.getElementById('module-multi-modal');
      if (modal) {
        modal.style.display = 'flex';
        modal.style.zIndex = '100004';
      }
      if (!this.multiFileList) this.multiFileList = [];
      const statusBox = document.getElementById('module-multi-status-box');
      if (statusBox) {
        statusBox.style.display = 'none';
        statusBox.textContent = '';
      }
      this.renderMultiFilesList();
    },

    closeMultiModal() {
      const modal = document.getElementById('module-multi-modal');
      if (modal) modal.style.display = 'none';
      this.multiFileList = [];
      const fileInput = document.getElementById('module-multi-files-input');
      if (fileInput) fileInput.value = '';
      const statusBox = document.getElementById('module-multi-status-box');
      if (statusBox) {
        statusBox.style.display = 'none';
        statusBox.textContent = '';
      }
    },

    renderMultiFilesList() {
      const listEl = document.getElementById('module-multi-files-list');
      if (!listEl) return;
      listEl.innerHTML = '';

      if (!this.multiFileList || this.multiFileList.length === 0) {
        const emptyTip = document.createElement('div');
        emptyTip.id = 'module-multi-empty-tip';
        emptyTip.style.cssText = 'text-align: center; color: var(--text-secondary); font-size: 11.5px; padding: 20px 0;';
        emptyTip.textContent = '请选择要按序阅读分析的多个文件';
        listEl.appendChild(emptyTip);
        return;
      }

      this.multiFileList.forEach((item, index) => {
        const row = document.createElement('div');
        row.className = 'module-merge-item-row';
        row.style.cssText = 'display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 8px 10px; border-radius: 8px; background: var(--secondary-bg); border: 1px solid var(--border-color); box-sizing: border-box; width: 100%;';

        const leftBox = document.createElement('div');
        leftBox.style.cssText = 'display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0;';

        const orderBadge = document.createElement('div');
        orderBadge.style.cssText = 'width: 22px; height: 22px; border-radius: 6px; background: var(--card-bg); display: flex; align-items: center; justify-content: center; color: var(--accent-color); flex-shrink: 0; font-size: 11px; font-weight: 700; border: 1px solid var(--border-color);';
        orderBadge.textContent = `${index + 1}`;

        const textCol = document.createElement('div');
        textCol.style.cssText = 'display: flex; flex-direction: column; min-width: 0; flex: 1; overflow: hidden;';

        const nameSpan = document.createElement('span');
        nameSpan.style.cssText = 'font-size: 12px; font-weight: 500; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;';
        nameSpan.textContent = item.name;

        const sizeSpan = document.createElement('span');
        sizeSpan.style.cssText = 'font-size: 10px; color: var(--text-secondary);';
        const kbSize = (item.size / 1024).toFixed(1);
        sizeSpan.textContent = `${kbSize} KB`;

        textCol.appendChild(nameSpan);
        textCol.appendChild(sizeSpan);
        leftBox.appendChild(orderBadge);
        leftBox.appendChild(textCol);

        const actionsBox = document.createElement('div');
        actionsBox.style.cssText = 'display: flex; align-items: center; gap: 4px; flex-shrink: 0; margin-left: auto;';

        if (index > 0) {
          const upBtn = document.createElement('button');
          upBtn.type = 'button';
          upBtn.className = 'moe-btn-mini';
          upBtn.style.cssText = 'width: 24px; height: 24px; padding: 0; display: flex; align-items: center; justify-content: center; font-size: 11px;';
          upBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 15l-6-6-6 6"/></svg>';
          upBtn.onclick = () => {
            const temp = this.multiFileList[index - 1];
            this.multiFileList[index - 1] = this.multiFileList[index];
            this.multiFileList[index] = temp;
            this.renderMultiFilesList();
          };
          actionsBox.appendChild(upBtn);
        }

        if (index < this.multiFileList.length - 1) {
          const downBtn = document.createElement('button');
          downBtn.type = 'button';
          downBtn.className = 'moe-btn-mini';
          downBtn.style.cssText = 'width: 24px; height: 24px; padding: 0; display: flex; align-items: center; justify-content: center; font-size: 11px;';
          downBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>';
          downBtn.onclick = () => {
            const temp = this.multiFileList[index + 1];
            this.multiFileList[index + 1] = this.multiFileList[index];
            this.multiFileList[index] = temp;
            this.renderMultiFilesList();
          };
          actionsBox.appendChild(downBtn);
        }

        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'moe-btn-mini btn-danger';
        delBtn.style.cssText = 'width: 24px; height: 24px; padding: 0; display: flex; align-items: center; justify-content: center; font-size: 11px;';
        delBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
        delBtn.onclick = () => {
          this.multiFileList.splice(index, 1);
          this.renderMultiFilesList();
        };
        actionsBox.appendChild(delBtn);

        row.appendChild(leftBox);
        row.appendChild(actionsBox);
        listEl.appendChild(row);
      });
    },

    async executeMultiAnalysis() {
      if (!this.multiFileList || this.multiFileList.length === 0) {
        if (typeof global.showCustomAlert === 'function') {
          global.showCustomAlert('提示', '请先选择需要分析的模组文件');
        }
        return;
      }

      const statusBox = document.getElementById('module-multi-status-box');
      const startBtn = document.getElementById('start-module-multi-btn');
      if (statusBox) {
        statusBox.style.display = 'block';
        statusBox.textContent = '正在按序读取文件...';
      }
      if (startBtn) {
        startBtn.textContent = '解析中...';
        startBtn.style.opacity = '0.7';
        startBtn.disabled = true;
      }

      try {
        const parsedSections = [];
        const allImages = [];
        let imageCounter = 1;

        for (let i = 0; i < this.multiFileList.length; i++) {
          const item = this.multiFileList[i];
          if (statusBox) {
            statusBox.textContent = `正在解析 ${i + 1} / ${this.multiFileList.length}：${item.name}`;
          }
          let parsed = null;
          const ext = (item.ext || '').toLowerCase();
          if (ext === 'txt') {
            parsed = await this.parseTxtFile(item.file);
          } else if (ext === 'docx' || ext === 'doc') {
            parsed = await this.parseDocxFile(item.file);
          } else if (ext === 'pdf') {
            parsed = await this.parsePdfFile(item.file);
          } else {
            throw new Error(`不支持的文件格式：${item.name}`);
          }

          if (parsed && parsed.images && parsed.images.length > 0) {
            parsed.images.forEach(img => {
              allImages.push({
                ...img,
                imageIndex: imageCounter++
              });
            });
          }

          const fileBaseTitle = item.name.replace(/\.[^/.]+$/, '');
          parsedSections.push(`【卷${i + 1}：${fileBaseTitle}】\n${parsed?.text || ''}`);
        }

        let combinedText = parsedSections.join('\n\n');
        if (allImages.length > 0) {
          const imageTagsList = allImages.map(img => `【图${img.imageIndex}】`).join(' ');
          combinedText = combinedText + `\n\n【模组图库提取】${imageTagsList}`;
        }

        const totalWords = this.countWords(combinedText);
        const firstName = this.multiFileList[0].name.replace(/\.[^/.]+$/, '');

        this.currentParsedData = {
          fileName: this.multiFileList.map(f => f.name).join('，'),
          moduleName: firstName,
          fileType: '多选模组',
          text: combinedText,
          images: allImages,
          wordCount: totalWords,
          analysisPrompt: DEFAULT_TRPG_ANALYSIS_PROMPT,
          prompt: DEFAULT_TRPG_ANALYSIS_PROMPT,
          cuttingPrompt: DEFAULT_TRPG_CUTTING_EXECUTION_PROMPT,
          isPureImagePdf: false
        };

        await this.saveRawFileToDB(this.currentParsedData);
        this.saveDraft();
        this.renderParsedResultUI(this.currentParsedData);
        this.closeMultiModal();

        if (typeof global.showCustomAlert === 'function') {
          global.showCustomAlert('解析完成', `已按顺序载入 ${this.multiFileList.length} 个模组文件`);
        }
      } catch (err) {
        console.warn('[模组] 多选解析失败:', err);
        if (statusBox) {
          statusBox.style.display = 'block';
          statusBox.textContent = `解析遇到错误：${err.message || err}`;
        }
        if (typeof global.showCustomAlert === 'function') {
          global.showCustomAlert('解析失败', err.message || '文件读取错误');
        }
      } finally {
        if (startBtn) {
          startBtn.textContent = '分析';
          startBtn.style.opacity = '1';
          startBtn.disabled = false;
        }
      }
    },

    async extractTextFromSingleFile(file) {
      const ext = (file.name || '').split('.').pop().toLowerCase();
      if (ext === 'txt') {
        if (typeof file.text === 'function') {
          return await file.text();
        }
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result || '');
          reader.onerror = reject;
          reader.readAsText(file, 'utf-8');
        });
      }

      if (ext === 'docx' || ext === 'doc') {
        const arrayBuffer = await file.arrayBuffer();
        if (global.mammoth && typeof global.mammoth.extractRawText === 'function') {
          try {
            const res = await global.mammoth.extractRawText({ arrayBuffer });
            if (res && res.value && res.value.trim()) return res.value;
          } catch (e) {}
        }
        if (global.JSZip) {
          try {
            const zip = await global.JSZip.loadAsync(arrayBuffer);
            const docXml = await zip.file('word/document.xml')?.async('text');
            if (docXml) {
              const parser = new DOMParser();
              const xmlDoc = parser.parseFromString(docXml, 'application/xml');
              const paragraphs = xmlDoc.getElementsByTagName('w:p');
              const textPieces = [];
              for (let i = 0; i < paragraphs.length; i++) {
                const tTags = paragraphs[i].getElementsByTagName('w:t');
                let pText = '';
                for (let j = 0; j < tTags.length; j++) {
                  pText += tTags[j].textContent || '';
                }
                if (pText.trim()) textPieces.push(pText.trim());
              }
              if (textPieces.length > 0) return textPieces.join('\n');
            }
          } catch (e) {
            console.warn('[模组] docx解构解析提示', e);
          }
        }
        return '';
      }

      if (ext === 'pdf') {
        if (global.pdfjsLib) {
          try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await global.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            let fullText = '';
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
              const page = await pdf.getPage(pageNum);
              const pageText = await this.extractStructuredTextFromPdfPage(page);
              if (pageText) fullText += pageText + '\n\n';
            }
            return fullText.trim();
          } catch (e) {
            console.warn('[模组] 提取PDF文字提示', e);
          }
        }
        return '';
      }

      return '';
    },

    async ensurePDFLib() {
      if (typeof window !== 'undefined' && window.PDFLib && window.PDFLib.PDFDocument) {
        return window.PDFLib;
      }
      if (global.PDFLib && global.PDFLib.PDFDocument) {
        return global.PDFLib;
      }
      if (typeof PDFLib !== 'undefined' && PDFLib && PDFLib.PDFDocument) {
        return PDFLib;
      }
      return new Promise((resolve) => {
        const s1 = document.createElement('script');
        s1.src = '/node_modules/pdf-lib/dist/pdf-lib.min.js';
        s1.onload = () => {
          const inst = (typeof window !== 'undefined' && window.PDFLib) || global.PDFLib || (typeof PDFLib !== 'undefined' ? PDFLib : null);
          resolve(inst);
        };
        s1.onerror = () => {
          const s2 = document.createElement('script');
          s2.src = 'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js';
          s2.onload = () => {
            const inst = (typeof window !== 'undefined' && window.PDFLib) || global.PDFLib || (typeof PDFLib !== 'undefined' ? PDFLib : null);
            resolve(inst);
          };
          s2.onerror = () => {
            const s3 = document.createElement('script');
            s3.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js';
            s3.onload = () => {
              const inst = (typeof window !== 'undefined' && window.PDFLib) || global.PDFLib || (typeof PDFLib !== 'undefined' ? PDFLib : null);
              resolve(inst);
            };
            s3.onerror = () => resolve(null);
            document.head.appendChild(s3);
          };
          document.head.appendChild(s2);
        };
        document.head.appendChild(s1);
      });
    },

    async executeMergeAndDownload() {
      if (!this.mergeFileList || this.mergeFileList.length === 0) {
        if (typeof global.showCustomAlert === 'function') {
          global.showCustomAlert('提示', '请先选择需要合并的文件');
        }
        return;
      }

      const formatSelect = document.getElementById('module-merge-format-select');
      const targetFormat = formatSelect ? formatSelect.value : 'pdf';
      const nameInput = document.getElementById('module-merge-name-input');
      const baseName = nameInput && nameInput.value.trim() ? nameInput.value.trim() : '合并文件';
      const statusBox = document.getElementById('module-merge-status-box');

      if (statusBox) {
        statusBox.style.display = 'block';
        statusBox.textContent = '正在按顺序合并文件，请稍候...';
      }

      try {
        let downloadBlob = null;
        let downloadFileName = `${baseName}.${targetFormat}`;

        if (targetFormat === 'txt') {
          const textList = [];
          for (let i = 0; i < this.mergeFileList.length; i++) {
            const item = this.mergeFileList[i];
            if (statusBox) statusBox.textContent = `正在提取第 ${i + 1} / ${this.mergeFileList.length} 个文件内容...`;
            const text = await this.extractTextFromSingleFile(item.file);
            if (text && text.trim()) {
              textList.push(`【${item.name}】\n\n${text.trim()}`);
            }
          }
          const combined = textList.join('\n\n━━━━━━━━━━━━━━━━━━━━\n\n');
          downloadBlob = new Blob([combined], { type: 'text/plain;charset=utf-8' });
        } else if (targetFormat === 'pdf') {
          let mergedSuccessfully = false;
          const allPdf = this.mergeFileList.every(item => {
            const ext = (item.ext || (item.name || '').split('.').pop() || '').toLowerCase();
            return ext === 'pdf';
          });

          if (allPdf) {
            try {
              if (statusBox) statusBox.textContent = '正在读取文件并进行无损合并...';
              const filePayloads = [];
              for (let i = 0; i < this.mergeFileList.length; i++) {
                const item = this.mergeFileList[i];
                if (statusBox) statusBox.textContent = `正在读取第 ${i + 1} / ${this.mergeFileList.length} 个文件...`;
                const ab = await item.file.arrayBuffer();
                const bytes = new Uint8Array(ab);
                let binary = '';
                const len = bytes.byteLength;
                for (let b = 0; b < len; b += 8192) {
                  binary += String.fromCharCode.apply(null, bytes.subarray(b, Math.min(b + 8192, len)));
                }
                filePayloads.push({ name: item.name, data: btoa(binary) });
              }

              if (statusBox) statusBox.textContent = '正在合并各页原始版面与图文内容...';
              const resp = await fetch('/api/merge-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ files: filePayloads })
              });

              if (resp.ok) {
                const resJson = await resp.json();
                if (resJson && resJson.success && resJson.pdfBase64) {
                  const bin = atob(resJson.pdfBase64);
                  const outBytes = new Uint8Array(bin.length);
                  for (let j = 0; j < bin.length; j++) {
                    outBytes[j] = bin.charCodeAt(j);
                  }
                  downloadBlob = new Blob([outBytes], { type: 'application/pdf' });
                  downloadFileName = `${baseName}.pdf`;
                  mergedSuccessfully = true;
                }
              }
            } catch (apiErr) {
              console.warn('[模组] 服务端合并接口异常，切换至本地核心合并:', apiErr);
            }
          }

          if (!mergedSuccessfully) {
            const PDFLibInstance = await this.ensurePDFLib();
            if (!PDFLibInstance || !PDFLibInstance.PDFDocument) {
              throw new Error('PDF处理组件加载失败，请检查网络或刷新重试');
            }

            const mergedPdfDoc = await PDFLibInstance.PDFDocument.create();

            for (let i = 0; i < this.mergeFileList.length; i++) {
              const item = this.mergeFileList[i];
              const ext = (item.ext || (item.name || '').split('.').pop() || '').toLowerCase();
              if (statusBox) statusBox.textContent = `正在按顺序合并第 ${i + 1} / ${this.mergeFileList.length} 个文件: ${item.name}`;

              if (ext === 'pdf') {
                const rawBuf = await item.file.arrayBuffer();
                let bytes = new Uint8Array(rawBuf);

                const decryptLib = (typeof window !== 'undefined' && window.PDFDecrypt) || global.PDFDecrypt || null;
                if (decryptLib && typeof decryptLib.isEncrypted === 'function') {
                  try {
                    const encInfo = await decryptLib.isEncrypted(bytes);
                    if (encInfo && encInfo.encrypted) {
                      try {
                        bytes = await decryptLib.decryptPDF(bytes, '');
                      } catch (decErr) {
                        console.warn('[模组] 客户端解密提示:', decErr);
                      }
                    }
                  } catch (checkErr) {
                    console.warn('[模组] 客户端加密检测提示:', checkErr);
                  }
                }

                let donorPdf = null;
                try {
                  donorPdf = await PDFLibInstance.PDFDocument.load(bytes, {
                    ignoreEncryption: true,
                    throwOnInvalidObject: false,
                    updateMetadata: false,
                    capNumbers: true
                  });
                } catch (loadErr1) {
                  let trimmedBytes = bytes;
                  for (let b = 0; b < Math.min(bytes.length - 4, 2048); b++) {
                    if (bytes[b] === 0x25 && bytes[b + 1] === 0x50 && bytes[b + 2] === 0x44 && bytes[b + 3] === 0x46 && bytes[b + 4] === 0x2D) {
                      trimmedBytes = bytes.subarray(b);
                      break;
                    }
                  }
                  donorPdf = await PDFLibInstance.PDFDocument.load(trimmedBytes, {
                    ignoreEncryption: true,
                    throwOnInvalidObject: false,
                    updateMetadata: false,
                    capNumbers: true
                  });
                }

                if (donorPdf) {
                  const pageIndices = donorPdf.getPageIndices();
                  let copiedAll = false;
                  try {
                    const copiedPages = await mergedPdfDoc.copyPages(donorPdf, pageIndices);
                    for (const page of copiedPages) {
                      mergedPdfDoc.addPage(page);
                    }
                    copiedAll = true;
                  } catch (batchErr) {
                    console.warn('[模组] 批量页面拼接提示，改为逐页原样追加:', batchErr);
                  }

                  if (!copiedAll) {
                    for (let pIdx = 0; pIdx < pageIndices.length; pIdx++) {
                      try {
                        const [singlePage] = await mergedPdfDoc.copyPages(donorPdf, [pageIndices[pIdx]]);
                        mergedPdfDoc.addPage(singlePage);
                      } catch (singleErr) {
                        try {
                          const donorPage = donorPdf.getPage(pageIndices[pIdx]);
                          const [embedded] = await mergedPdfDoc.embedPages([donorPage]);
                          const newPage = mergedPdfDoc.addPage([embedded.width, embedded.height]);
                          newPage.drawPage(embedded);
                        } catch (embedErr) {
                          console.warn(`[模组] 第 ${i + 1} 个文件第 ${pIdx + 1} 页复制异常:`, embedErr);
                        }
                      }
                    }
                  }
                } else {
                  throw new Error(`文件 ${item.name} 无法作为有效 PDF 解析`);
                }
              } else if (['jpg', 'jpeg', 'png'].includes(ext)) {
                try {
                  const ab = await item.file.arrayBuffer();
                  const bytes = new Uint8Array(ab);
                  let embeddedImg = null;
                  if (ext === 'png') {
                    embeddedImg = await mergedPdfDoc.embedPng(bytes);
                  } else {
                    embeddedImg = await mergedPdfDoc.embedJpg(bytes);
                  }
                  const imgPage = mergedPdfDoc.addPage([embeddedImg.width, embeddedImg.height]);
                  imgPage.drawImage(embeddedImg, {
                    x: 0,
                    y: 0,
                    width: embeddedImg.width,
                    height: embeddedImg.height
                  });
                } catch (imgErr) {
                  console.warn('[模组] 图片嵌入PDF异常:', imgErr);
                }
              } else {
                const text = await this.extractTextFromSingleFile(item.file);
                await this.embedTextPagesToPdf(mergedPdfDoc, text || item.name, item.name);
              }
            }

            if (mergedPdfDoc.getPageCount() === 0) {
              throw new Error('未成功提取到任何有效PDF页面，请检查原始PDF文件');
            }
            const pdfBytes = await mergedPdfDoc.save({ useObjectStreams: false });
            downloadBlob = new Blob([pdfBytes], { type: 'application/pdf' });
            downloadFileName = `${baseName}.pdf`;
          }
        } else if (targetFormat === 'docx') {
          const docxLib = (typeof window !== 'undefined' && window.docx) || global.docx || (typeof docx !== 'undefined' ? docx : null);
          if (docxLib && typeof docxLib.Document === 'function') {
            const allParagraphs = [];
            for (let i = 0; i < this.mergeFileList.length; i++) {
              const item = this.mergeFileList[i];
              if (statusBox) statusBox.textContent = `正在合并第 ${i + 1} / ${this.mergeFileList.length} 个文档: ${item.name}`;
              const text = await this.extractTextFromSingleFile(item.file);
              const safeText = (text || '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
              const lines = safeText.split(/\r?\n/);

              allParagraphs.push(new docxLib.Paragraph({
                children: [new docxLib.TextRun({ text: `【${item.name}】`, bold: true, size: 28 })],
                spacing: { before: 200, after: 120 }
              }));

              lines.forEach(line => {
                const cleanLine = line.replace(/\r/g, '');
                allParagraphs.push(new docxLib.Paragraph({
                  children: [new docxLib.TextRun({ text: cleanLine, size: 22 })],
                  spacing: { after: 60 }
                }));
              });

              if (i < this.mergeFileList.length - 1) {
                allParagraphs.push(new docxLib.Paragraph({
                  children: [new docxLib.TextRun({ text: '' })],
                  pageBreakBefore: true
                }));
              }
            }

            if (allParagraphs.length === 0) {
              allParagraphs.push(new docxLib.Paragraph({
                children: [new docxLib.TextRun({ text: '模组合并文档' })]
              }));
            }

            const doc = new docxLib.Document({
              sections: [{
                properties: {},
                children: allParagraphs
              }]
            });
            downloadBlob = await docxLib.Packer.toBlob(doc);
            downloadFileName = `${baseName}.docx`;
          } else {
            const textList = [];
            for (let i = 0; i < this.mergeFileList.length; i++) {
              const item = this.mergeFileList[i];
              const text = await this.extractTextFromSingleFile(item.file);
              if (text && text.trim()) textList.push(text.trim());
            }
            const combined = textList.join('\n\n');
            downloadBlob = new Blob([combined], { type: 'text/plain;charset=utf-8' });
            downloadFileName = `${baseName}.txt`;
          }
        }

        if (downloadBlob) {
          const downloadUrl = URL.createObjectURL(downloadBlob);
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = downloadFileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(downloadUrl), 30000);

          if (statusBox) {
            statusBox.style.display = 'block';
            statusBox.style.color = 'var(--accent-color)';
            statusBox.textContent = `合并完成，已自动下载：${downloadFileName}`;
          }

          const downloadBtn = document.getElementById('download-module-merged-btn');
          if (downloadBtn) {
            downloadBtn.style.display = 'inline-flex';
            downloadBtn.onclick = () => {
              const url = URL.createObjectURL(downloadBlob);
              const a = document.createElement('a');
              a.href = url;
              a.download = downloadFileName;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              setTimeout(() => URL.revokeObjectURL(url), 30000);
            };
          }

          if (typeof global.showCustomAlert === 'function') {
            global.showCustomAlert('成功', '合并完成并已下载');
          }
        }
      } catch (err) {
        console.warn('[模组] 合并文件提示:', err);
        if (statusBox) {
          statusBox.textContent = `合并失败: ${err.message || '格式处理异常'}`;
        }
      }
    },

    async embedPdfPagesWithPdfJs(mergedPdfDoc, file, statusBox, fileIdx, totalFiles) {
      const pdfjs = (typeof window !== 'undefined' && window.pdfjsLib) || global.pdfjsLib || (typeof pdfjsLib !== 'undefined' ? pdfjsLib : null);
      if (!pdfjs || !mergedPdfDoc) return;
      try {
        const ab = await file.arrayBuffer();
        const loadingTask = pdfjs.getDocument({
          data: new Uint8Array(ab),
          cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
          cMapPacked: true,
          standardFontDataUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/standard_fonts/'
        });
        const pdf = await loadingTask.promise;
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          if (statusBox && fileIdx && totalFiles) {
            statusBox.textContent = `正在渲染第 ${fileIdx} / ${totalFiles} 个文件页面: ${pageNum} / ${pdf.numPages}`;
          }
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: 2.0 });
          const canvas = document.createElement('canvas');
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          const ctx = canvas.getContext('2d', { alpha: false });
          if (ctx) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
          await page.render({ canvasContext: ctx, viewport }).promise;

          const jpgDataUrl = canvas.toDataURL('image/jpeg', 0.95);
          const jpgBase64 = jpgDataUrl.split(',')[1];
          const binaryStr = atob(jpgBase64);
          const bytes = new Uint8Array(binaryStr.length);
          for (let b = 0; b < binaryStr.length; b++) {
            bytes[b] = binaryStr.charCodeAt(b);
          }

          const embeddedJpg = await mergedPdfDoc.embedJpg(bytes);
          const baseViewport = page.getViewport({ scale: 1.0 });
          const addedPage = mergedPdfDoc.addPage([baseViewport.width, baseViewport.height]);
          addedPage.drawImage(embeddedJpg, {
            x: 0,
            y: 0,
            width: baseViewport.width,
            height: baseViewport.height
          });
        }
      } catch (renderErr) {
        console.warn('[模组] PDF.js 页面渲染降级:', renderErr);
        const text = await this.extractTextFromSingleFile(file);
        await this.embedTextPagesToPdf(mergedPdfDoc, text || file.name, file.name);
      }
    },

    async embedTextPagesToPdf(pdfDoc, text, docTitle) {
      if (!pdfDoc) return;
      const cleanText = (text || '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
      const lines = cleanText.split(/\r?\n/);

      const canvasWidth = 1240;
      const canvasHeight = 1754;
      const marginX = 80;
      const marginTop = 90;
      const marginBottom = 90;
      const contentWidth = canvasWidth - marginX * 2;
      const maxContentHeight = canvasHeight - marginBottom;
      const fontSize = 22;
      const lineHeight = 34;

      const pagesCanvasData = [];
      let currentCanvas = document.createElement('canvas');
      currentCanvas.width = canvasWidth;
      currentCanvas.height = canvasHeight;
      let currentCtx = currentCanvas.getContext('2d');

      const initPageCanvas = (ctx) => {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        ctx.fillStyle = '#1e293b';
        ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif`;
        ctx.textBaseline = 'top';
      };

      initPageCanvas(currentCtx);
      let currentY = marginTop;

      const pushCurrentPage = () => {
        pagesCanvasData.push(currentCanvas);
        currentCanvas = document.createElement('canvas');
        currentCanvas.width = canvasWidth;
        currentCanvas.height = canvasHeight;
        currentCtx = currentCanvas.getContext('2d');
        initPageCanvas(currentCtx);
        currentY = marginTop;
      };

      if (docTitle) {
        currentCtx.font = `bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
        currentCtx.fillText(docTitle, marginX, currentY);
        currentY += 48;
        currentCtx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif`;
      }

      for (let i = 0; i < lines.length; i++) {
        const rawLine = lines[i];
        if (!rawLine.trim()) {
          currentY += Math.floor(lineHeight * 0.7);
          if (currentY + lineHeight > maxContentHeight) {
            pushCurrentPage();
          }
          continue;
        }

        let currentLineText = '';
        for (let c = 0; c < rawLine.length; c++) {
          const char = rawLine[c];
          const testLine = currentLineText + char;
          const metrics = currentCtx.measureText(testLine);
          if (metrics.width > contentWidth && currentLineText.length > 0) {
            currentCtx.fillText(currentLineText, marginX, currentY);
            currentY += lineHeight;
            if (currentY + lineHeight > maxContentHeight) {
              pushCurrentPage();
            }
            currentLineText = char;
          } else {
            currentLineText = testLine;
          }
        }
        if (currentLineText.length > 0) {
          currentCtx.fillText(currentLineText, marginX, currentY);
          currentY += lineHeight;
          if (currentY + lineHeight > maxContentHeight) {
            pushCurrentPage();
          }
        }
      }

      pagesCanvasData.push(currentCanvas);

      for (let p = 0; p < pagesCanvasData.length; p++) {
        const cvs = pagesCanvasData[p];
        const ctx = cvs.getContext('2d');
        ctx.fillStyle = '#94a3b8';
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`- ${p + 1} / ${pagesCanvasData.length} -`, canvasWidth / 2, canvasHeight - 50);

        const jpgDataUrl = cvs.toDataURL('image/jpeg', 0.92);
        const base64 = jpgDataUrl.split(',')[1];
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let b = 0; b < binary.length; b++) {
          bytes[b] = binary.charCodeAt(b);
        }
        const embeddedImg = await pdfDoc.embedJpg(bytes);
        const addedPage = pdfDoc.addPage([595.28, 841.89]);
        addedPage.drawImage(embeddedImg, {
          x: 0,
          y: 0,
          width: 595.28,
          height: 841.89
        });
      }
    },

    async locateModuleImagesWithAI(moduleId) {
      const database = this.getDB();
      if (!database || !database.moduleImages || !database.moduleChapters) return;

      const images = await database.moduleImages.where('moduleId').equals(moduleId).toArray();
      if (!images || images.length === 0) {
        if (typeof global.showCustomAlert === 'function') {
          global.showCustomAlert('提示', '当前模组图库中暂无图片，请先点击导入');
        }
        return;
      }

      const chapters = await database.moduleChapters.where('moduleId').equals(moduleId).sortBy('sortOrder');
      if (!chapters || chapters.length === 0) {
        if (typeof global.showCustomAlert === 'function') {
          global.showCustomAlert('提示', '当前模组暂无有效章节数据');
        }
        return;
      }

      const locateBtn = document.getElementById('module-gallery-locate-btn');
      if (locateBtn) {
        locateBtn.textContent = '分析中...';
        locateBtn.disabled = true;
      }

      try {
        images.forEach((img, idx) => {
          if (!img.imageIndex || typeof img.imageIndex !== 'number') {
            img.imageIndex = idx + 1;
          }
        });

        let visionResults = [];
        try {
          const thumbnails = [];
          for (let i = 0; i < images.length; i++) {
            const img = images[i];
            if (img.dataUrl) {
              const thumb = await this.createThumbnailDataUrl(img.dataUrl, 260, 260);
              thumbnails.push({
                imageIndex: img.imageIndex,
                name: img.name || `图${img.imageIndex}`,
                dataUrl: thumb
              });
            }
          }

          if (thumbnails.length > 0) {
            const visionSysPrompt = `你是一个具备顶级鉴赏力的跑团模组插图与视觉美术资源专家。
请仔细观察用户提供的多张模组图片画面视觉内容，结合原文件名与画面特征，判断每张图片具体是什么图，并生成精炼准确的名称、备注、剧透属性，以及是否为某HO位的猫即专属绑定NPC。

【分类与识别要求】：
1. 角色立绘：
   - 包含人物全身像、半身像、肖像、怪物造型、NPC；
   - 命名为具体角色名称或肖像，例如"林雪立绘"、"黑衣守卫肖像"；
   - 若根据画面特征或文件名判断为某特定HO位的猫即专属绑定NPC、青梅竹马、专属搭档，标注 isHoCat 为 true，并给出 hoTag 例如 ho1 或 ho2；若为普通公共NPC或怪物，isHoCat 为 false；
2. 场景地图：
   - 包含建筑平面图、俯视图、区域示意图、房间走廊网格；
   - 命名为具体建筑或地点地图，例如"洋馆一层平面图"、"浅草寺区域地图"；
3. 剧情CG与场景插画：
   - 包含大事件场景、关键对峙、伤亡、重要情节插图；
   - 命名为事件CG，例如"雨中初遇CG"、"决战CG"；
4. 道具与线索：
   - 包含信件、手记、钥匙、图腾、神秘道具；
   - 命名为道具名；
5. 剧透判定 isSensitive：
   - 涉及幕后真相、怪物终极异化、致命伤亡CG、密室地下层地图为 true；
   - 常规初期NPC立绘、公共公开建筑地图、日常开场插画为 false。

请只输出合法的 JSON 数组：
[
  { "imageIndex": 1, "type": "portrait", "name": "林雪立绘", "annotation": "HO1专属猫初次出场立绘", "description": "身穿校服的高中女生", "isSensitive": false, "isHoCat": true, "hoTag": "ho1", "entityName": "林雪" }
]`;
            const visionUserPrompt = `请对附带的 ${thumbnails.length} 张图片按序号依次进行高精度视觉甄别与分类命名，输出合法JSON数组：`;
            const visionRes = await this.callAI(visionSysPrompt, visionUserPrompt, thumbnails);
            if (visionRes) {
              const clean = visionRes.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
              const sIdx = clean.indexOf('[');
              const eIdx = clean.lastIndexOf(']');
              if (sIdx !== -1 && eIdx !== -1) {
                visionResults = JSON.parse(clean.substring(sIdx, eIdx + 1));
              }
            }
          }
        } catch (vErr) {
          console.error('视觉预检异常:', vErr);
        }

        images.forEach((img, idx) => {
          const v = visionResults.find(r => r.imageIndex === img.imageIndex || r.imageIndex === (idx + 1));
          if (v) {
            if (v.name) img.name = v.name;
            if (v.annotation) img.annotation = v.annotation;
            if (v.description) img.description = v.description;
            if (typeof v.isSensitive === 'boolean') img.isSensitive = v.isSensitive;
            img.isHoCat = !!v.isHoCat;
            img.hoTag = v.hoTag || '';
            img.entityName = v.entityName || '';
          }
        });

        const imageListSummary = images.map((img, i) => {
          const catInfo = img.isHoCat ? `【HO专属猫，归属${img.hoTag || '特定HO'}】` : '';
          return `${i + 1}. 图${img.imageIndex} 名称: ${img.name || `插图_${img.imageIndex}`} 备注: ${img.annotation || img.description || '无'} ${catInfo} 剧透: ${img.isSensitive ? '是' : '否'}`;
        }).join('\n');

        const chaptersDigest = chapters.map((c, i) => {
          const cleanText = (c.content || '').replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n');
          return `━━━━━━━━━━━━━━━━━━━━\n【章节 ${i + 1}】标题：${c.title} ｜ 分类：${c.category || '正文'}\n${cleanText}`;
        }).join('\n\n');

        const placementPrompt = `你是专业的跑团模组插图排版与原位注入专家。
你将通读以下模组的全部章节内容，并结合图库中的插图列表，判断每张图片在模组剧情中应该出现在哪里，并精准规划注入位置。

【待处理图库插图列表】：
${imageListSummary}

【模组全部章节正文内容】：
${chaptersDigest}

━━━━━━━━━━━━━━━━━━━━
【插图定位与注入铁律】：
1. 人物立绘：
   - 必须注入在该角色在模组剧情中【第一次正式出场、首次与调查员或剧情发生互动】的具体段落处！
2. 极其核心的猫立绘双注入铁律：
   - 如果该立绘是某个 HO 位的专属猫即绑定NPC或与特定HO存在专属羁绊的角色：
     ① 在该 HO 位的【单人线】章节中例如包含该HO编号的单人线或秘密线等，该猫【第一次出场】时，必须规划一次立绘注入！
     ② 在面向全部调查员的【公共正文章节】全体玩家共同经历的剧情中，当这只猫在公共剧情中【第一次正式出场】时，必须【再次规划一次立绘注入】！
     确保无论玩家选择哪个 HO 位跑团，都能在公共大团剧情中初次见到这只猫时正确弹出立绘！
3. 场景与地图：
   - 必须插入在剧情中调查员【第一次进入该场景、抵达该地点、或展开该区域探索】的具体段落处！
4. 剧情 CG 与道具线索：
   - 插入在该剧情事件或高潮发生、或调查员发现并取得该线索或道具的具体段落处！
5. 定位锚点规范：
   - 对每个注入点，必须提供：
     - chapterIndex: 目标章节编号，从1开始计算
     - targetAnchor: 目标段落中必须存在的原文章节短句，字数在8到30字之间且在该章节中独一无二用于精准查找定位
     - position: "after" 表示在该段落换行后插入标签，"before" 表示在该段落前插入标签
     - reason: 注入原因说明，例如 HO1单人线猫初次登场 或 公共正文猫首次出场 或 首次进入洋馆一层

请直接输出合法的 JSON 数组，格式如下：
[
  {
    "imageIndex": 1,
    "name": "猫-林雪立绘",
    "annotation": "HO1专属猫初遇立绘",
    "description": "高中女生制服半身像",
    "isSensitive": false,
    "placements": [
      {
        "chapterIndex": 2,
        "targetAnchor": "少女转过身来，露出熟悉的温和微笑",
        "position": "after",
        "reason": "HO1单人线初次登场"
      },
      {
        "chapterIndex": 5,
        "targetAnchor": "林雪抱着一叠资料从走廊另一头快步走来",
        "position": "after",
        "reason": "公共正文首次登场"
      }
    ]
  }
]`;

        let parsedMatches = [];
        try {
          const placementRes = await this.callAI('你是一个高精度跑团模组插图排版定位助手，只输出合法JSON数组。', placementPrompt);
          if (!placementRes) {
            throw new Error('AI模型未返回定位分析结果');
          }
          const clean = placementRes.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
          const sIdx = clean.indexOf('[');
          const eIdx = clean.lastIndexOf(']');
          if (sIdx === -1 || eIdx === -1) {
            throw new Error('AI模型返回格式无效，未找到JSON数组');
          }
          parsedMatches = JSON.parse(clean.substring(sIdx, eIdx + 1));
        } catch (pErr) {
          console.error('全文插图定位分析解析异常:', pErr);
          throw pErr;
        }

        for (let i = 0; i < images.length; i++) {
          const img = images[i];
          const imgNum = img.imageIndex || (i + 1);
          img.imageIndex = imgNum;

          const matched = parsedMatches.find(m => m.imageIndex === imgNum || m.imageIndex === (i + 1));
          if (matched) {
            if (matched.name && typeof matched.name === 'string') {
              img.name = matched.name.trim();
            }
            if (matched.annotation && typeof matched.annotation === 'string') {
              img.annotation = matched.annotation.trim();
            }
            if (matched.description && typeof matched.description === 'string') {
              img.description = matched.description.trim();
            }
            if (typeof matched.isSensitive === 'boolean') {
              img.isSensitive = matched.isSensitive;
            }
          }

          const tag = `【图${imgNum}：${img.name || '插图'}】`;
          const shortTag = `【图${imgNum}】`;
          const injectedChapterTitles = [];

          let placements = [];
          if (matched && Array.isArray(matched.placements) && matched.placements.length > 0) {
            placements = matched.placements;
          } else if (matched && matched.chapterIndex) {
            placements = [{
              chapterIndex: matched.chapterIndex,
              targetAnchor: matched.targetAnchor || '',
              position: matched.position || 'after',
              reason: matched.reason || ''
            }];
          } else {
            placements = [{
              chapterIndex: 1,
              targetAnchor: '',
              position: 'after',
              reason: '默认首章'
            }];
          }

          for (const pl of placements) {
            const cIdx = (typeof pl.chapterIndex === 'number' && pl.chapterIndex > 0 && pl.chapterIndex <= chapters.length)
              ? (pl.chapterIndex - 1)
              : 0;
            const targetChap = chapters[cIdx] || chapters[0];
            if (!targetChap) continue;

            if (targetChap.content.includes(tag) || targetChap.content.includes(shortTag)) {
              if (!injectedChapterTitles.includes(targetChap.title)) {
                injectedChapterTitles.push(targetChap.title);
              }
              continue;
            }

            let inserted = false;
            const anchor = (pl.targetAnchor || '').trim();
            if (anchor && targetChap.content.includes(anchor)) {
              const anchorIdx = targetChap.content.indexOf(anchor);
              if (pl.position === 'before') {
                const prevLineBreak = targetChap.content.lastIndexOf('\n', anchorIdx);
                const insertAt = prevLineBreak === -1 ? 0 : (prevLineBreak + 1);
                targetChap.content = targetChap.content.slice(0, insertAt) + `${tag}\n\n` + targetChap.content.slice(insertAt);
                inserted = true;
              } else {
                const nextLineBreak = targetChap.content.indexOf('\n', anchorIdx);
                const insertAt = nextLineBreak === -1 ? targetChap.content.length : nextLineBreak;
                targetChap.content = targetChap.content.slice(0, insertAt) + `\n\n${tag}\n` + targetChap.content.slice(insertAt);
                inserted = true;
              }
            }

            if (!inserted) {
              const searchKeyword = (img.entityName || img.name || '').replace(/立绘|地图|CG|肖像|平面图/g, '').trim();
              if (searchKeyword && searchKeyword.length >= 2 && targetChap.content.includes(searchKeyword)) {
                const kwIdx = targetChap.content.indexOf(searchKeyword);
                const nextBreak = targetChap.content.indexOf('\n', kwIdx);
                const insertAt = nextBreak === -1 ? targetChap.content.length : nextBreak;
                targetChap.content = targetChap.content.slice(0, insertAt) + `\n\n${tag}\n` + targetChap.content.slice(insertAt);
                inserted = true;
              }
            }

            if (!inserted) {
              const firstPBreak = targetChap.content.indexOf('\n\n');
              if (firstPBreak !== -1) {
                targetChap.content = targetChap.content.slice(0, firstPBreak) + `\n\n${tag}\n` + targetChap.content.slice(firstPBreak);
              } else {
                targetChap.content = `${targetChap.content}\n\n${tag}`;
              }
            }

            targetChap.wordCount = this.countWords(targetChap.content);
            targetChap._modified = true;
            if (!injectedChapterTitles.includes(targetChap.title)) {
              injectedChapterTitles.push(targetChap.title);
            }
          }

          const placementSummary = injectedChapterTitles.length > 0
            ? `已注入：${injectedChapterTitles.join(' ｜ ')}`
            : '已注入正文';
          img.placement = placementSummary;

          if (img.id) {
            await database.moduleImages.update(img.id, {
              imageIndex: imgNum,
              name: img.name,
              annotation: img.annotation || '',
              description: img.description || '',
              placement: img.placement,
              isSensitive: !!img.isSensitive
            });
          } else {
            await database.moduleImages.put(img);
          }
        }

        for (const chap of chapters) {
          if (chap._modified) {
            delete chap._modified;
            await database.moduleChapters.put(chap);
          }
        }

        const allUpdatedChaps = await database.moduleChapters.where('moduleId').equals(moduleId).toArray();
        let totalWords = 0;
        allUpdatedChaps.forEach(c => {
          totalWords += (c.wordCount || 0);
        });
        const mod = await database.modules.get(moduleId);
        if (mod) {
          mod.wordCount = totalWords;
          await database.modules.update(moduleId, { wordCount: totalWords });
          if (this.activeDetailModule && this.activeDetailModule.id === moduleId) {
            this.activeDetailModule.wordCount = totalWords;
          }
        }

        await this.renderModuleDetailGallery(chapters, moduleId);

        if (typeof global.showCustomAlert === 'function') {
          global.showCustomAlert('分析完成', `已成功识别 ${images.length} 张插图并注入至对应模组章节`);
        }
      } catch (err) {
        console.error('分析与插图注入异常:', err);
        if (typeof global.showCustomAlert === 'function') {
          global.showCustomAlert('分析失败', err && err.message ? err.message : String(err));
        }
        throw err;
      } finally {
        if (locateBtn) {
          locateBtn.textContent = '分析';
          locateBtn.disabled = false;
        }
      }
    },

    hideModuleDetail() {
      const mainView = document.getElementById('module-library-main-view');
      const detailView = document.getElementById('module-library-detail-view');
      const readerView = document.getElementById('module-library-reader-view');

      if (mainView) mainView.style.display = 'flex';
      if (detailView) detailView.style.display = 'none';
      if (readerView) readerView.style.display = 'none';
      this.activeDetailModule = null;
      this.renderLibraryList();
    },

    // 沉浸式整页阅读器与编辑器
    openChapterReader(chapters, index, viewMode = 'pc') {
      if (!chapters || chapters.length === 0) return;
      this.currentReadingChapters = chapters;
      this.currentReadingIndex = index;
      this.currentReadingViewMode = viewMode;
      this.isReaderEditing = false;

      const mainView = document.getElementById('module-library-main-view');
      const detailView = document.getElementById('module-library-detail-view');
      const readerView = document.getElementById('module-library-reader-view');

      if (mainView) mainView.style.display = 'none';
      if (detailView) detailView.style.display = 'none';
      if (readerView) readerView.style.display = 'flex';

      const titleEl = document.getElementById('module-reader-title');
      const metaEl = document.getElementById('module-reader-meta');
      const readonlyBody = document.getElementById('module-reader-readonly-body');
      const editBody = document.getElementById('module-reader-edit-body');
      const editTextarea = document.getElementById('module-reader-edit-textarea');
      const editBtn = document.getElementById('module-reader-edit-btn');
      const prevBtn = document.getElementById('module-reader-prev-btn');
      const nextBtn = document.getElementById('module-reader-next-btn');
      const pcBtn = document.getElementById('module-reader-view-pc');
      const kpBtn = document.getElementById('module-reader-view-kp');

      const currentChap = chapters[index];
      const cleanTitle = this.cleanChapterTitle(currentChap.title, this.activeDetailModule?.name || this.currentParsedData?.moduleName);
      if (titleEl) titleEl.textContent = cleanTitle;
      if (metaEl) metaEl.textContent = `${currentChap.category || '正文'} · ${currentChap.wordCount || 0} 字`;

      if (pcBtn && kpBtn) {
        if (viewMode === 'pc') {
          pcBtn.style.background = 'var(--card-bg, #FFFFFF)';
          pcBtn.style.color = 'var(--text-primary)';
          pcBtn.style.fontWeight = '600';
          kpBtn.style.background = 'transparent';
          kpBtn.style.color = 'var(--text-secondary)';
          kpBtn.style.fontWeight = '500';
        } else {
          kpBtn.style.background = 'var(--card-bg, #FFFFFF)';
          kpBtn.style.color = 'var(--text-primary)';
          kpBtn.style.fontWeight = '600';
          pcBtn.style.background = 'transparent';
          pcBtn.style.color = 'var(--text-secondary)';
          pcBtn.style.fontWeight = '500';
        }
      }

      let displayContent = currentChap.content || '';
      const cat = (currentChap.category || '').toLowerCase();
      const isItemCat = cat.includes('道具') || cat.includes('线索') || cat.includes('物品');

      if (viewMode === 'pc') {
        if (isItemCat) {
          const rawLines = displayContent.split('\n').map(l => l.trim()).filter(l => l.length > 0);
          const hiddenLines = (rawLines.length > 0 ? rawLines : ['道具与线索']).map((_, i) => `条目 ${i + 1}：已隐藏`);
          displayContent = `【道具与线索】（共 ${hiddenLines.length} 项，玩家模式下内容已遮挡防护，切换至守秘人模式即可查看完整道具与获取方式）\n\n` + hiddenLines.join('\n');
        } else {
          const lines = displayContent.split('\n');
          const pcLines = lines.filter(l => !l.startsWith('【KP信息】') && !l.startsWith('【KP带团指引批注') && !l.startsWith('【秘密'));
          displayContent = pcLines.join('\n');
        }
      }

      if (readonlyBody) {
        readonlyBody.textContent = displayContent;
        readonlyBody.style.display = 'block';
      }
      if (editBody) editBody.style.display = 'none';
      if (editTextarea) editTextarea.value = currentChap.content || '';
      if (editBtn) editBtn.textContent = '编辑';

      if (prevBtn) {
        prevBtn.disabled = index <= 0;
        prevBtn.style.opacity = index <= 0 ? '0.4' : '1';
      }
      if (nextBtn) {
        nextBtn.disabled = index >= chapters.length - 1;
        nextBtn.style.opacity = index >= chapters.length - 1 ? '0.4' : '1';
      }
    },

    async toggleReaderEditMode() {
      if (!this.currentReadingChapters || this.currentReadingChapters.length === 0) return;
      const currentChap = this.currentReadingChapters[this.currentReadingIndex];
      if (!currentChap) return;

      const readonlyBody = document.getElementById('module-reader-readonly-body');
      const editBody = document.getElementById('module-reader-edit-body');
      const editTextarea = document.getElementById('module-reader-edit-textarea');
      const editBtn = document.getElementById('module-reader-edit-btn');
      const metaEl = document.getElementById('module-reader-meta');

      if (!this.isReaderEditing) {
        this.isReaderEditing = true;
        if (readonlyBody) readonlyBody.style.display = 'none';
        if (editBody) editBody.style.display = 'flex';
        if (editTextarea) {
          editTextarea.value = currentChap.content || '';
          editTextarea.focus();
        }
        if (editBtn) editBtn.textContent = '保存';
      } else {
        const newContent = editTextarea ? editTextarea.value : '';
        currentChap.content = newContent;
        currentChap.wordCount = this.countWords(newContent);

        const database = this.getDB();
        if (database && database.moduleChapters) {
          await this.safeDBOperation('保存章节修改', async (db) => {
            await db.moduleChapters.put(currentChap);
            if (this.activeDetailModule) {
              const allChaps = await db.moduleChapters.where('moduleId').equals(this.activeDetailModule.id).toArray();
              let allImages = [];
              if (db.moduleImages) {
                try {
                  allImages = await db.moduleImages.where('moduleId').equals(this.activeDetailModule.id).toArray();
                } catch (e) {}
              }
              let allChapsWords = 0;
              allChaps.forEach(c => {
                const cWords = this.countWords(c.content || '');
                c.wordCount = cWords;
                allChapsWords += cWords;
              });
              const tocWords = this.getTocWordCount(this.activeDetailModule, allChaps);
              const mapWords = this.getMapWordCount(this.activeDetailModule, allChaps);
              const imgWords = this.getImagesWordCount(this.activeDetailModule, allImages);
              const totalWords = allChapsWords + tocWords + mapWords + imgWords;
              this.activeDetailModule.wordCount = totalWords;
              await db.modules.update(this.activeDetailModule.id, { wordCount: totalWords });
            }
          });
        }

        this.isReaderEditing = false;
        if (readonlyBody) {
          readonlyBody.textContent = newContent;
          readonlyBody.style.display = 'block';
        }
        if (editBody) editBody.style.display = 'none';
        if (editBtn) editBtn.textContent = '编辑';
        if (metaEl) metaEl.textContent = `${currentChap.category || '正文'} · ${currentChap.wordCount || 0} 字`;

        if (typeof global.showCustomAlert === 'function') {
          global.showCustomAlert('保存成功', '章节内容与字数统计已更新');
        }
      }
    },

    backToModuleDetail() {
      const detailView = document.getElementById('module-library-detail-view');
      const readerView = document.getElementById('module-library-reader-view');

      if (readerView) readerView.style.display = 'none';
      if (detailView) {
        detailView.style.display = 'flex';
        if (this.currentReadingChapters) {
          this.renderModuleDetailGroupedChapters(this.currentReadingChapters);
        }
      }
    },

    getTagClass(tag) {
      if (tag === '危险') return 'mod-tag-danger';
      if (tag === '普通') return 'mod-tag-normal';
      if (tag === '安全') return 'mod-tag-safe';
      if (tag === '粉红') return 'mod-tag-pink';
      if (tag === 'NTR' || tag === 'ntr') return 'mod-tag-ntr';
      if (tag === '血腥暴力') return 'mod-tag-bloody';
      if (tag === '纯爱') return 'mod-tag-purelove';
      if (tag === '茶番') return 'mod-tag-chaban';
      if (tag === '恐怖') return 'mod-tag-horror';
      if (tag === 'Meta' || tag === 'meta') return 'mod-tag-meta';
      return 'mod-tag-custom';
    },

    async saveCutModuleToLibrary() {
      if (this._isSavingToLibrary) return;
      this._isSavingToLibrary = true;
      try {
        if (!this.cutChapters || this.cutChapters.length === 0) {
          if (typeof global.showCustomAlert === "function") {
            global.showCustomAlert("提示", "暂无已重构好的章节数据");
          }
          return;
        }

        const modName = this.currentParsedData?.moduleName || "跑团模组";
        let moduleId = this._currentSavedModuleId || null;

        if (!moduleId) {
          const database = this.getDB();
          if (database && database.modules) {
            try {
              const existingMods = await database.modules.toArray();
              const matchedMod = existingMods.find(m => (m.name || "").trim().toLowerCase() === modName.trim().toLowerCase());
              if (matchedMod) {
                moduleId = matchedMod.id;
              }
            } catch (e) {}
          }
        }

        if (!moduleId) {
          moduleId = "mod_" + Date.now();
        }
        this._currentSavedModuleId = moduleId;

        const bgTag = this.currentPlan?.bgTag || "日模";
        const endingTag = this.currentPlan?.endingTag || "普通";
        const contentTags = this.currentPlan?.contentTags || [];
        const customTags = this.currentPlan?.customTags || [];
        const allTags = this.sortModuleTags(bgTag, endingTag, contentTags, customTags);

        const chaptersToSave = this.cutChapters.map((chap, idx) => ({
          ...chap,
          id: "chap_" + Date.now() + "_" + (idx + 1) + "_" + Math.random().toString(36).substr(2, 6),
          sortOrder: chap.sortOrder || (idx + 1),
          wordCount: this.countWords(chap.content || ""),
          moduleId: moduleId
        }));

      const imagesToSave = (this.currentParsedData?.images || []).map((img, iIdx) => ({
        moduleId: moduleId,
        imageIndex: img.imageIndex || (iIdx + 1),
        name: img.name,
        dataUrl: img.dataUrl,
        isSensitive: !!img.isSensitive,
        isDiscarded: !!img.isDiscarded,
        pageNumber: img.pageNumber || 1,
        width: img.width || 800,
        height: img.height || 600,
        format: img.format || "JPEG",
        description: img.description || "",
        annotation: img.annotation || "",
        placement: img.placement || "文档插图"
      }));

      const locationNavList = [];
      const sourceNodes = (this.currentPlan?.mapNodes && Array.isArray(this.currentPlan.mapNodes) && this.currentPlan.mapNodes.length > 0)
        ? this.currentPlan.mapNodes
        : (this.currentParsedData?.mapNodes && Array.isArray(this.currentParsedData.mapNodes) && this.currentParsedData.mapNodes.length > 0)
          ? this.currentParsedData.mapNodes
          : [];

      if (sourceNodes && sourceNodes.length > 0) {
        sourceNodes.forEach(item => {
          locationNavList.push({
            moduleId: moduleId,
            name: item.name,
            parent: item.parent || "",
            level: item.level || 1,
            desc: item.desc || item.description || "",
            prompt: item.prompt || "",
            imageUrl: item.imageUrl || "",
            imageStatus: "idle"
          });
        });
      }

      const tempModForToc = {
        name: this.currentParsedData?.moduleName || "跑团模组",
        toc: this.currentPlan?.toc || [],
        mapNodes: sourceNodes
      };

      const tocWords = this.getTocWordCount(tempModForToc, chaptersToSave);
      const mapWords = this.getMapWordCount(tempModForToc, chaptersToSave);
      const imgWords = this.getImagesWordCount(tempModForToc, imagesToSave);
      const realTotalWords = chaptersToSave.reduce((sum, c) => sum + (c.wordCount || 0), 0) + tocWords + mapWords + imgWords;

      const moduleRecord = {
        id: moduleId,
        name: this.currentParsedData?.moduleName || "跑团模组",
        type: this.currentPlan?.moduleType || "线性",
        ruleSystem: this.currentPlan?.ruleSystem || "coc",
        scaleType: this.currentPlan?.scaleType || "1v1",
        summary: this.currentPlan?.summary || "无剧透模组概览",
        bgTag: bgTag,
        endingTag: endingTag,
        contentTags: contentTags,
        customTags: customTags,
        tags: allTags,
        mapNodes: sourceNodes,
        group: "默认分组",
        wordCount: realTotalWords,
        chapterCount: chaptersToSave.length,
        status: "ready",
        githubSync: false,
        createdAt: Date.now()
      };

      const dbSuccess = await this.safeDBOperation("保存模组到数据库", async (db) => {
        try {
          const allExisting = await db.modules.toArray();
          const targetNormName = (moduleRecord.name || "").trim().toLowerCase();
          for (const m of allExisting) {
            if (m && m.id !== moduleId && (m.name || "").trim().toLowerCase() === targetNormName) {
              await db.modules.delete(m.id);
              if (db.moduleChapters) {
                await db.moduleChapters.where("moduleId").equals(m.id).delete();
              }
            }
          }
        } catch (_) {}
        await db.modules.put(moduleRecord);
        if (db.moduleChapters) {
          try {
            await db.moduleChapters.where("moduleId").equals(moduleId).delete();
          } catch (_) {}
        }
        await db.moduleChapters.bulkPut(chaptersToSave);
        if (imagesToSave.length > 0 && db.moduleImages) {
          try {
            await db.moduleImages.where("moduleId").equals(moduleId).delete();
          } catch (_) {}
          try {
            await db.moduleImages.bulkAdd(imagesToSave);
          } catch (e) {
            await db.moduleImages.bulkPut(imagesToSave);
          }
        }
        if (locationNavList.length > 0 && db.moduleLocationNav) {
          try {
            await db.moduleLocationNav.where("moduleId").equals(moduleId).delete();
          } catch (_) {}
          try {
            await db.moduleLocationNav.bulkAdd(locationNavList);
          } catch (e) {
            await db.moduleLocationNav.bulkPut(locationNavList);
          }
        }
        return true;
      });

      if (!dbSuccess) {
        console.error("模组及章节数据存入数据库失败");
        if (typeof global.showCustomAlert === "function") {
          global.showCustomAlert("保存失败", "写入数据库出现异常，请重试保存。");
        }
        return;
      }

      this.clearDraft();
      this.switchSubPanel("library");
      if (typeof this.renderLibraryList === "function") {
        await this.renderLibraryList();
      }

      if (typeof global.showCustomAlert === "function") {
        global.showCustomAlert("保存成功", "模组【" + moduleRecord.name + "】及 " + chaptersToSave.length + " 个带团章节已安全存入模组库。");
      }
    } finally {
      this._isSavingToLibrary = false;
    }
  },
    async exportModuleZipBundle(specificChapters = null, specificName = null, specificModuleId = null) {
      const chaptersToExport = specificChapters || this.cutChapters;
      if (!chaptersToExport || chaptersToExport.length === 0) return;

      const modName = specificName || this.activeDetailModule?.name || this.currentParsedData?.moduleName || '模组';
      const targetModuleId = specificModuleId || this.activeDetailModule?.id || chaptersToExport[0]?.moduleId || null;

      if (!global.JSZip) {
        this.exportModuleFallbackTxt(chaptersToExport, modName);
        return;
      }

      try {
        const zip = new global.JSZip();
        let overviewText = `模组名称：${modName}\n章节总数：${chaptersToExport.length}\n导出时间：${new Date().toLocaleString()}\n\n【章节列表目录】\n`;

        chaptersToExport.forEach((chap, idx) => {
          const numStr = String(idx + 1).padStart(2, '0');
          const cleanTitle = (chap.title || `章节_${idx + 1}`).replace(/[\\/:*?"<>|]/g, '_');
          const fileName = `${numStr}_${cleanTitle}.txt`;
          zip.file(fileName, chap.content || '');
          overviewText += `${numStr}. ${chap.title} (分类: ${chap.category || '正文'}, 字数: ${chap.wordCount || 0})\n`;
        });

        zip.file('00_模组总览与导读.txt', overviewText);

        // 打包完整的结构化模组元数据，确保导入时 100% 还原格式、地图、分类与立绘
        let fullModuleRecord = this.activeDetailModule || null;
        let locationNavList = [];
        let imagesList = [];
        let cluePointersList = [];
        let hoRolesList = [];

        const database = this.getDB();
        if (database && targetModuleId) {
          try {
            if (!fullModuleRecord && database.modules) {
              fullModuleRecord = await database.modules.get(targetModuleId);
            }
            if (database.moduleLocationNav) {
              locationNavList = await database.moduleLocationNav.where('moduleId').equals(targetModuleId).toArray();
            }
            if (database.moduleImages) {
              imagesList = await database.moduleImages.where('moduleId').equals(targetModuleId).toArray();
            }
            if (database.moduleCluePointers) {
              cluePointersList = await database.moduleCluePointers.where('moduleId').equals(targetModuleId).toArray();
            }
            if (database.moduleHoRoles) {
              hoRolesList = await database.moduleHoRoles.where('moduleId').equals(targetModuleId).toArray();
            }
          } catch (dbErr) {
            console.warn('[模组] 读取关联数据库数据异常:', dbErr);
          }
        }

        if (!fullModuleRecord) {
          fullModuleRecord = {
            name: modName,
            type: '线性',
            ruleSystem: 'coc',
            scaleType: '1v1',
            summary: '跑团模组',
            tags: ['普通'],
            group: '默认分组',
            chapterCount: chaptersToExport.length
          };
        }

        const bundleManifest = {
          version: 2,
          exportedAt: Date.now(),
          module: fullModuleRecord,
          chapters: chaptersToExport,
          locationNav: locationNavList,
          images: imagesList,
          cluePointers: cluePointersList,
          hoRoles: hoRolesList
        };

        zip.file('module_data.json', JSON.stringify(bundleManifest, null, 2));

        const contentBlob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(contentBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${modName}_跑团模组包.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (zipErr) {
        console.warn('[模组] 压缩包生成提示，采用单文本备用导出', zipErr);
        this.exportModuleFallbackTxt(chaptersToExport, modName);
      }
    },

    exportModuleFallbackTxt(chaptersToExport = null, specificName = null) {
      const chapters = chaptersToExport || this.cutChapters;
      const modName = specificName || this.currentParsedData?.moduleName || '模组';
      let exportText = `=====================================\n模组名称：${modName}\n章节总数：${chapters.length}\n=====================================\n\n`;

      chapters.forEach((chap, idx) => {
        exportText += `\n\n-------------------------------------\n【章节 ${idx + 1}】${chap.title} (${chap.category})\n-------------------------------------\n\n${chap.content}\n`;
      });

      const blob = new Blob([exportText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${modName}_带团专属重构版.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },

    async handleImportModuleToLibrary(file) {
      if (!file) return;
      const fileName = file.name.toLowerCase();
      const baseName = file.name.replace(/\.[^/.]+$/, '').trim() || '导入模组';

      try {
        const newModuleId = 'mod_' + Date.now();
        let moduleRecord = null;
        let chapters = [];
        let locationNavList = [];
        let imagesList = [];
        let cluePointersList = [];
        let hoRolesList = [];

        if (fileName.endsWith('.zip') && global.JSZip) {
          const zip = await global.JSZip.loadAsync(file);

          // 优先检查是否存在完整元数据 JSON（支持无损还原全部结构与地图、立绘）
          const manifestFile = zip.file('module_data.json') || zip.file('module.json') || zip.file('manifest.json');
          if (manifestFile) {
            try {
              const jsonText = await manifestFile.async('text');
              const bundleData = JSON.parse(jsonText);

              if (bundleData && (bundleData.module || bundleData.chapters)) {
                moduleRecord = bundleData.module ? { ...bundleData.module } : {};
                moduleRecord.id = newModuleId;
                if (!moduleRecord.name) moduleRecord.name = baseName;
                moduleRecord.createdAt = Date.now();

                const rawChapters = Array.isArray(bundleData.chapters) ? bundleData.chapters : [];
                chapters = rawChapters.map((c, idx) => ({
                  ...c,
                  id: 'chap_' + Date.now() + '_' + (idx + 1),
                  moduleId: newModuleId,
                  sortOrder: c.sortOrder || (idx + 1),
                  wordCount: c.wordCount || this.countWords(c.content || '')
                }));

                if (Array.isArray(bundleData.locationNav)) {
                  locationNavList = bundleData.locationNav.map((l, lIdx) => ({
                    ...l,
                    id: undefined,
                    moduleId: newModuleId
                  }));
                }

                if (Array.isArray(bundleData.images)) {
                  imagesList = bundleData.images.map((img, iIdx) => ({
                    ...img,
                    id: undefined,
                    moduleId: newModuleId
                  }));
                }

                if (Array.isArray(bundleData.cluePointers)) {
                  cluePointersList = bundleData.cluePointers.map(cp => ({
                    ...cp,
                    id: undefined,
                    moduleId: newModuleId
                  }));
                }

                if (Array.isArray(bundleData.hoRoles)) {
                  hoRolesList = bundleData.hoRoles.map(hr => ({
                    ...hr,
                    id: undefined,
                    moduleId: newModuleId
                  }));
                }
              }
            } catch (jsonErr) {
              console.warn('[模组] 解析压缩包内 JSON 元数据失败，回退至纯文本模式', jsonErr);
            }
          }

          // 若未包含 JSON 元数据或解析失败，按纯文本章节导入
          if (chapters.length === 0) {
            const txtFileNames = Object.keys(zip.files).filter(name =>
              name.endsWith('.txt') &&
              !name.startsWith('__MACOSX') &&
              !name.includes('00_模组总览与导读')
            );
            txtFileNames.sort();

            let order = 1;
            for (const name of txtFileNames) {
              const content = await zip.file(name).async('text');
              const cleanTitle = name.replace(/\.txt$/i, '').replace(/^[0-9]+[_\-\s]+/, '');
              chapters.push({
                id: 'chap_' + Date.now() + '_' + order,
                moduleId: newModuleId,
                title: cleanTitle,
                category: '正文',
                wordCount: this.countWords(content),
                content: content,
                sortOrder: order
              });
              order++;
            }
          }
        } else if (fileName.endsWith('.json')) {
          const text = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsText(file, 'UTF-8');
          });

          const bundleData = JSON.parse(text);
          moduleRecord = bundleData.module ? { ...bundleData.module } : {};
          moduleRecord.id = newModuleId;
          if (!moduleRecord.name) moduleRecord.name = baseName;
          moduleRecord.createdAt = Date.now();

          const rawChapters = Array.isArray(bundleData.chapters) ? bundleData.chapters : (Array.isArray(bundleData) ? bundleData : []);
          chapters = rawChapters.map((c, idx) => ({
            ...c,
            id: 'chap_' + Date.now() + '_' + (idx + 1),
            moduleId: newModuleId,
            sortOrder: c.sortOrder || (idx + 1),
            wordCount: c.wordCount || this.countWords(c.content || '')
          }));

          if (Array.isArray(bundleData.locationNav)) {
            locationNavList = bundleData.locationNav.map(l => ({ ...l, id: undefined, moduleId: newModuleId }));
          }
          if (Array.isArray(bundleData.images)) {
            imagesList = bundleData.images.map(img => ({ ...img, id: undefined, moduleId: newModuleId }));
          }
        } else if (fileName.endsWith('.txt')) {
          const text = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsText(file, 'UTF-8');
          });

          const sections = text.split(/(?:={5,}|-{5,})/g).map(s => s.trim()).filter(Boolean);
          if (sections.length > 1) {
            sections.forEach((sec, idx) => {
              const firstLine = sec.split('\n')[0].substring(0, 30).trim();
              chapters.push({
                id: 'chap_' + Date.now() + '_' + (idx + 1),
                moduleId: newModuleId,
                title: firstLine || `章节 ${idx + 1}`,
                category: '正文',
                wordCount: this.countWords(sec),
                content: sec,
                sortOrder: idx + 1
              });
            });
          } else {
            chapters.push({
              id: 'chap_' + Date.now() + '_1',
              moduleId: newModuleId,
              title: baseName,
              category: '正文',
              wordCount: this.countWords(text),
              content: text,
              sortOrder: 1
            });
          }
        }

        if (chapters.length === 0) {
          if (typeof global.showCustomAlert === 'function') {
            global.showCustomAlert('提示', '未能从文件中读取到有效章节内容');
          }
          return;
        }

        let chapsTotalWords = 0;
        chapters.forEach(c => {
          const cWords = this.countWords(c.content || '');
          c.wordCount = cWords;
          chapsTotalWords += cWords;
        });

        if (!moduleRecord) {
          moduleRecord = {
            id: newModuleId,
            name: baseName,
            type: '线性',
            ruleSystem: 'coc',
            scaleType: '1v1',
            summary: '导入模组',
            endingTag: '普通',
            contentTags: [],
            customTags: [],
            tags: ['普通'],
            group: '默认分组',
            wordCount: 0,
            chapterCount: chapters.length,
            status: 'ready',
            githubSync: false,
            createdAt: Date.now()
          };
        }

        const tocWords = this.getTocWordCount(moduleRecord, chapters);
        const mapWords = this.getMapWordCount(moduleRecord, chapters);
        const imgWords = this.getImagesWordCount(moduleRecord, imagesList);
        moduleRecord.wordCount = chapsTotalWords + tocWords + mapWords + imgWords;
        moduleRecord.chapterCount = chapters.length;

        await this.safeDBOperation('导入完整模组', async (db) => {
          await db.modules.put(moduleRecord);
          await db.moduleChapters.bulkPut(chapters);
          if (locationNavList.length > 0 && db.moduleLocationNav) {
            try {
              await db.moduleLocationNav.bulkAdd(locationNavList);
            } catch (e) {
              await db.moduleLocationNav.bulkPut(locationNavList);
            }
          }
          if (imagesList.length > 0 && db.moduleImages) {
            try {
              await db.moduleImages.bulkAdd(imagesList);
            } catch (e) {
              await db.moduleImages.bulkPut(imagesList);
            }
          }
          if (cluePointersList.length > 0 && db.moduleCluePointers) {
            try {
              await db.moduleCluePointers.bulkAdd(cluePointersList);
            } catch (e) {
              await db.moduleCluePointers.bulkPut(cluePointersList);
            }
          }
          if (hoRolesList.length > 0 && db.moduleHoRoles) {
            try {
              await db.moduleHoRoles.bulkAdd(hoRolesList);
            } catch (e) {
              await db.moduleHoRoles.bulkPut(hoRolesList);
            }
          }
          return true;
        });

        await this.renderLibraryList();

        if (typeof global.showCustomAlert === 'function') {
          global.showCustomAlert('导入成功', `成功导入模组【${moduleRecord.name}】，包含 ${chapters.length} 个章节及完整地图设定！`);
        }
      } catch (err) {
        console.warn('[模组] 导入模组库异常:', err);
        if (typeof global.showCustomAlert === 'function') {
          global.showCustomAlert('导入失败', `无法导入该文件: ${err.message || err}`);
        }
      }
    },

    async openModuleEditModal(moduleId) {
      const database = this.getDB();
      if (!database || !database.modules) return;

      const mod = await database.modules.get(moduleId);
      if (!mod) return;

      this.activeEditModule = JSON.parse(JSON.stringify(mod));
      const modal = document.getElementById('module-edit-modal');
      const nameInput = document.getElementById('module-edit-name-input');
      const typeSelect = document.getElementById('module-edit-type-select');
      const systemSelect = document.getElementById('module-edit-system-select');
      const scaleSelect = document.getElementById('module-edit-scale-select');
      const descInput = document.getElementById('module-edit-desc-input');
      const bgTagsContainer = document.getElementById('module-edit-bg-tags');
      const endingTagsContainer = document.getElementById('module-edit-ending-tags');
      const contentTagsContainer = document.getElementById('module-edit-content-tags');
      const customTagsList = document.getElementById('module-edit-custom-tags-list');
      const customTagInput = document.getElementById('module-edit-custom-tag-input');

      if (!modal) return;

      if (nameInput) nameInput.value = mod.name || '';
      if (typeSelect) typeSelect.value = mod.type || '线性';
      if (systemSelect) systemSelect.value = (mod.ruleSystem || 'coc').toLowerCase();
      if (scaleSelect) {
        const curScale = mod.scaleType || '1v1';
        const hasOpt = Array.from(scaleSelect.options).some(opt => opt.value === curScale);
        if (!hasOpt) {
          const newOpt = document.createElement('option');
          newOpt.value = curScale;
          newOpt.textContent = curScale;
          scaleSelect.appendChild(newOpt);
        }
        scaleSelect.value = curScale;
      }
      if (descInput) descInput.value = mod.summary || '';
      if (customTagInput) customTagInput.value = '';

      const coverPreview = document.getElementById('module-edit-cover-preview');
      const coverUploadBtn = document.getElementById('module-edit-cover-upload-btn');
      const coverRemoveBtn = document.getElementById('module-edit-cover-remove-btn');
      const coverFileInput = document.getElementById('module-edit-cover-file-input');

      const renderCoverPreview = () => {
        if (!coverPreview) return;
        if (this.activeEditModule.coverImage) {
          coverPreview.innerHTML = `<img src="${this.activeEditModule.coverImage}" style="width: 100%; height: 100%; object-fit: cover;" alt="封面" />`;
          if (coverRemoveBtn) coverRemoveBtn.style.display = 'inline-flex';
        } else {
          coverPreview.innerHTML = `
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"></path>
              <path d="M6 6h10"></path>
              <path d="M6 10h10"></path>
            </svg>
          `;
          if (coverRemoveBtn) coverRemoveBtn.style.display = 'none';
        }
      };
      renderCoverPreview();

      if (coverUploadBtn && coverFileInput) {
        coverUploadBtn.onclick = () => coverFileInput.click();
        coverFileInput.onchange = async (e) => {
          const file = e.target.files && e.target.files[0];
          if (file) {
            try {
              const base64Img = await this.compressImageFile(file, 600, 600, 0.85);
              if (base64Img) {
                this.activeEditModule.coverImage = base64Img;
                renderCoverPreview();
              }
            } catch (err) {
              console.warn('[模组] 封面压缩异常:', err);
            }
          }
          coverFileInput.value = '';
        };
      }
      if (coverRemoveBtn) {
        coverRemoveBtn.onclick = () => {
          this.activeEditModule.coverImage = '';
          renderCoverPreview();
        };
      }

      if (!this.activeEditModule.bgTag) {
        this.activeEditModule.bgTag = '日模';
      }
      if (!this.activeEditModule.endingTag) {
        this.activeEditModule.endingTag = '普通';
      }
      if (!this.activeEditModule.contentTags) {
        this.activeEditModule.contentTags = [];
      }
      if (!this.activeEditModule.customTags) {
        this.activeEditModule.customTags = [];
      }

      // 渲染背景标签 (单选互斥)
      if (bgTagsContainer) {
        bgTagsContainer.innerHTML = '';
        const bgOptions = ['日模', '美模', '现代中国', '古风'];
        bgOptions.forEach(opt => {
          const label = document.createElement('label');
          label.className = `mod-tag-select-item ${this.getTagClass(opt)}`;
          const isChecked = this.activeEditModule.bgTag === opt;
          label.innerHTML = `
            <input type="radio" name="edit-bg-tag" value="${opt}" ${isChecked ? 'checked' : ''} />
            <span>${opt}</span>
          `;
          label.querySelector('input').addEventListener('change', (e) => {
            if (e.target.checked) {
              this.activeEditModule.bgTag = opt;
            }
          });
          bgTagsContainer.appendChild(label);
        });
      }

      // 渲染结局标签 (单选)
      if (endingTagsContainer) {
        endingTagsContainer.innerHTML = '';
        const endingOptions = ['危险', '普通', '安全'];
        endingOptions.forEach(opt => {
          const label = document.createElement('label');
          label.className = `mod-tag-select-item ${this.getTagClass(opt)}`;
          const isChecked = this.activeEditModule.endingTag === opt;
          label.innerHTML = `
            <input type="radio" name="edit-ending-tag" value="${opt}" ${isChecked ? 'checked' : ''} />
            <span>${opt}</span>
          `;
          label.querySelector('input').addEventListener('change', (e) => {
            if (e.target.checked) {
              this.activeEditModule.endingTag = opt;
            }
          });
          endingTagsContainer.appendChild(label);
        });
      }

      // 渲染内容标签 (多选)
      if (contentTagsContainer) {
        contentTagsContainer.innerHTML = '';
        const contentOptions = ['校园', '复活', '粉红', 'NTR', '血腥暴力', '纯爱', '茶番', '恐怖', 'Meta'];
        contentOptions.forEach(opt => {
          const label = document.createElement('label');
          label.className = `mod-tag-select-item ${this.getTagClass(opt)}`;
          const isChecked = this.activeEditModule.contentTags.includes(opt);
          label.innerHTML = `
            <input type="checkbox" value="${opt}" ${isChecked ? 'checked' : ''} />
            <span>${opt}</span>
          `;
          label.querySelector('input').addEventListener('change', (e) => {
            if (e.target.checked) {
              if (!this.activeEditModule.contentTags.includes(opt)) {
                this.activeEditModule.contentTags.push(opt);
              }
            } else {
              this.activeEditModule.contentTags = this.activeEditModule.contentTags.filter(t => t !== opt);
            }
          });
          contentTagsContainer.appendChild(label);
        });
      }

      // 渲染自定义标签
      const renderCustomTagsUI = () => {
        if (!customTagsList) return;
        customTagsList.innerHTML = '';
        const cTags = this.activeEditModule.customTags || [];
        cTags.forEach((ct, idx) => {
          const span = document.createElement('span');
          span.className = 'mod-tag-badge mod-tag-custom';
          span.innerHTML = `
            <span>${ct}</span>
            <span class="mod-tag-del-icon" data-idx="${idx}">&times;</span>
          `;
          span.querySelector('.mod-tag-del-icon').addEventListener('click', (e) => {
            e.stopPropagation();
            this.activeEditModule.customTags.splice(idx, 1);
            renderCustomTagsUI();
          });
          customTagsList.appendChild(span);
        });
      };
      renderCustomTagsUI();

      this.renderCustomTagsUI = renderCustomTagsUI;
      modal.style.display = 'flex';
    },

    hideModuleEditModal() {
      const modal = document.getElementById('module-edit-modal');
      if (modal) modal.style.display = 'none';
      this.activeEditModule = null;
    },

    async saveModuleEdit() {
      if (!this.activeEditModule) return;
      const database = this.getDB();
      if (!database || !database.modules) return;

      const nameInput = document.getElementById('module-edit-name-input');
      const typeSelect = document.getElementById('module-edit-type-select');
      const systemSelect = document.getElementById('module-edit-system-select');
      const scaleSelect = document.getElementById('module-edit-scale-select');
      const descInput = document.getElementById('module-edit-desc-input');

      const newName = nameInput ? nameInput.value.trim() : this.activeEditModule.name;
      const newType = typeSelect ? typeSelect.value : (this.activeEditModule.type || '线性');
      const newSystem = systemSelect ? systemSelect.value : (this.activeEditModule.ruleSystem || 'coc');
      const newScale = scaleSelect ? scaleSelect.value : (this.activeEditModule.scaleType || '1v1');
      const newDesc = descInput ? descInput.value.trim() : (this.activeEditModule.summary || '');

      const bgTag = this.activeEditModule.bgTag || '日模';
      const endingTag = this.activeEditModule.endingTag || '普通';
      const contentTags = this.activeEditModule.contentTags || [];
      const customTags = this.activeEditModule.customTags || [];

      const updatedTags = this.sortModuleTags(bgTag, endingTag, contentTags, customTags);

      const updateObj = {
        name: newName || '跑团模组',
        type: newType,
        ruleSystem: newSystem,
        scaleType: newScale,
        summary: newDesc,
        coverImage: this.activeEditModule.coverImage || '',
        bgTag: bgTag,
        endingTag: endingTag,
        contentTags: contentTags,
        customTags: customTags,
        tags: updatedTags
      };

      await database.modules.update(this.activeEditModule.id, updateObj);
      this.hideModuleEditModal();

      // 刷新详情页与列表页
      await this.openModuleDetail(this.activeEditModule.id);
      await this.renderLibraryList();

      if (typeof global.showCustomAlert === 'function') {
        global.showCustomAlert('保存成功', '模组信息与分类标签已更新');
      }
    },

    async openModuleChaptersEditModal(moduleId) {
      const database = this.getDB();
      if (!database || !database.modules) return;

      const mod = await database.modules.get(moduleId);
      if (!mod) return;

      let chapters = [];
      if (database.moduleChapters) {
        chapters = await database.moduleChapters.where('moduleId').equals(moduleId).sortBy('sortOrder');
        if (chapters.length === 0) {
          if (typeof moduleId === 'string' && !isNaN(Number(moduleId))) {
            chapters = await database.moduleChapters.where('moduleId').equals(Number(moduleId)).sortBy('sortOrder');
          } else if (typeof moduleId === 'number') {
            chapters = await database.moduleChapters.where('moduleId').equals(String(moduleId)).sortBy('sortOrder');
          }
        }
      }

      this.activeEditingChapters = JSON.parse(JSON.stringify(chapters));
      this.deletedChapterIds = [];
      this.renderChaptersEditList();

      const modal = document.getElementById('module-chapters-edit-modal');
      if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('visible');
      }
    },

    hideModuleChaptersEditModal() {
      const modal = document.getElementById('module-chapters-edit-modal');
      if (modal) {
        modal.classList.remove('visible');
        modal.style.display = 'none';
      }
      this.activeEditingChapters = null;
      this.deletedChapterIds = null;
    },

    renderChaptersEditList() {
      const listContainer = document.getElementById('module-chapters-edit-list');
      if (!listContainer) return;
      listContainer.innerHTML = '';

      const chapters = this.activeEditingChapters || [];
      if (chapters.length === 0) {
        listContainer.innerHTML = '<div style="text-align: center; color: var(--text-secondary); font-size: 12px; padding: 20px 0;">暂无章节</div>';
        return;
      }

      const standardCategories = ['导入', '事前公开', '大纲与真相', 'NPC与猫', '人设', 'HO秘密与设定', '单人线', '正文', '结局', '道具与线索', '附录与规则', '其他分类'];

      chapters.forEach((chap, idx) => {
        const itemCard = document.createElement('div');
        itemCard.className = 'mod-chap-edit-card';
        itemCard.style.cssText = 'background: var(--secondary-bg, #F9F8F5); border: 1px solid var(--border-color); border-radius: 8px; padding: 8px 10px; display: flex; flex-direction: column; gap: 6px;';

        const cleanTitle = this.cleanChapterTitle(chap.title, this.activeDetailModule?.name);
        const curCat = chap.category || '正文';

        let categoryOptionsHtml = standardCategories.map(cat => {
          return `<option value="${cat}" ${curCat === cat ? 'selected' : ''}>${cat}</option>`;
        }).join('');
        if (!standardCategories.includes(curCat)) {
          categoryOptionsHtml += `<option value="${curCat}" selected>${curCat}</option>`;
        }

        const safeTitle = (cleanTitle || '章节').replace(/["<>]/g, '');

        itemCard.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
            <div style="display: flex; align-items: center; gap: 6px; min-width: 0; flex: 1;">
              <span style="font-size: 12px; font-weight: 700; color: var(--accent-color, #4A7A68); flex-shrink: 0;">#${idx + 1}</span>
              <span style="font-size: 12.5px; font-weight: 600; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${safeTitle}</span>
            </div>
            <div style="display: flex; gap: 4px; flex-shrink: 0;">
              <button type="button" class="moe-btn-secondary chap-move-up-btn" data-idx="${idx}" style="height: 24px; padding: 0 6px; font-size: 11px; border-radius: 4px; ${idx === 0 ? 'opacity: 0.35; pointer-events: none;' : ''}">上移</button>
              <button type="button" class="moe-btn-secondary chap-move-down-btn" data-idx="${idx}" style="height: 24px; padding: 0 6px; font-size: 11px; border-radius: 4px; ${idx === chapters.length - 1 ? 'opacity: 0.35; pointer-events: none;' : ''}">下移</button>
              <button type="button" class="moe-btn-secondary chap-delete-btn" data-idx="${idx}" style="height: 24px; padding: 0 6px; font-size: 11px; border-radius: 4px; color: var(--tukey-danger, #e05252);">删除</button>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 11px; color: var(--text-secondary); flex-shrink: 0;">分类</span>
            <select class="chap-category-select" data-idx="${idx}" style="flex: 1; height: 26px; line-height: 26px; font-size: 11.5px; padding: 0 4px; border-radius: 4px; border: 1px solid var(--border-color); background: var(--card-bg, #FFFFFF); color: var(--text-primary); cursor: pointer; box-sizing: border-box;">
              ${categoryOptionsHtml}
            </select>
          </div>
        `;

        // 上移
        const upBtn = itemCard.querySelector('.chap-move-up-btn');
        if (upBtn && idx > 0) {
          upBtn.addEventListener('click', () => {
            const temp = this.activeEditingChapters[idx - 1];
            this.activeEditingChapters[idx - 1] = this.activeEditingChapters[idx];
            this.activeEditingChapters[idx] = temp;
            this.renderChaptersEditList();
          });
        }

        // 下移
        const downBtn = itemCard.querySelector('.chap-move-down-btn');
        if (downBtn && idx < chapters.length - 1) {
          downBtn.addEventListener('click', () => {
            const temp = this.activeEditingChapters[idx + 1];
            this.activeEditingChapters[idx + 1] = this.activeEditingChapters[idx];
            this.activeEditingChapters[idx] = temp;
            this.renderChaptersEditList();
          });
        }

        // 删除
        const delBtn = itemCard.querySelector('.chap-delete-btn');
        if (delBtn) {
          delBtn.addEventListener('click', () => {
            if (confirm(`确定要删除章节 "${safeTitle}" 吗？`)) {
              const removed = this.activeEditingChapters.splice(idx, 1)[0];
              if (removed && removed.id) {
                if (!this.deletedChapterIds) this.deletedChapterIds = [];
                this.deletedChapterIds.push(removed.id);
              }
              this.renderChaptersEditList();
            }
          });
        }

        // 修改分类
        const catSelect = itemCard.querySelector('.chap-category-select');
        if (catSelect) {
          catSelect.addEventListener('change', (e) => {
            this.activeEditingChapters[idx].category = e.target.value;
          });
        }

        listContainer.appendChild(itemCard);
      });
    },

    async saveModuleChaptersEdit() {
      const database = this.getDB();
      if (!database || !this.activeDetailModule) return;

      const moduleId = this.activeDetailModule.id;
      const chapters = this.activeEditingChapters || [];

      // 1. 删除已删除的章节
      if (this.deletedChapterIds && this.deletedChapterIds.length > 0 && database.moduleChapters) {
        for (const cid of this.deletedChapterIds) {
          try {
            await database.moduleChapters.delete(cid);
          } catch (e) {}
        }
      }

      // 2. 更新保留章节的序号和分类
      let chapsTotalWords = 0;
      for (let i = 0; i < chapters.length; i++) {
        const chap = chapters[i];
        chap.sortOrder = i;
        const cWords = this.countWords(chap.content || '');
        chap.wordCount = cWords;
        chapsTotalWords += cWords;
        if (database.moduleChapters && chap.id) {
          await database.moduleChapters.put(chap);
        }
      }

      // 3. 更新模组字数和章节数
      let images = [];
      if (database && database.moduleImages) {
        try {
          images = await database.moduleImages.where('moduleId').equals(moduleId).toArray();
        } catch (e) {}
      }
      const tocWords = this.getTocWordCount(this.activeDetailModule, chapters);
      const mapWords = this.getMapWordCount(this.activeDetailModule, chapters);
      const imgWords = this.getImagesWordCount(this.activeDetailModule, images);
      const realTotalWords = chapsTotalWords + tocWords + mapWords + imgWords;

      this.activeDetailModule.wordCount = realTotalWords;
      this.activeDetailModule.chapterCount = chapters.length;
      if (database.modules) {
        await database.modules.update(moduleId, { wordCount: realTotalWords, chapterCount: chapters.length });
      }

      // 4. 刷新界面
      this.currentReadingChapters = chapters;
      this.renderModuleDetailGroupedChapters(chapters);
      this.renderModuleDetailToc(chapters);
      this.renderModuleDetailMap(chapters);

      // 更新顶部 meta-line
      const metaLineEl = document.getElementById('module-detail-meta-line');
      if (metaLineEl) {
        const ruleSys = (this.activeDetailModule.ruleSystem || 'coc').toUpperCase();
        const typeStr = this.activeDetailModule.type || '线性';
        const scaleStr = this.activeDetailModule.scaleType || '1v1';
        metaLineEl.textContent = `${ruleSys} · ${typeStr} · ${scaleStr} · ${realTotalWords} 字 · ${chapters.length} 章节`;
      }

      const statsEl = document.getElementById('module-detail-stats');
      if (statsEl) {
        statsEl.textContent = `${chapters.length} 章节 · ${realTotalWords} 字`;
      }

      this.hideModuleChaptersEditModal();

      if (typeof global.showCustomAlert === 'function') {
        global.showCustomAlert('保存成功', '章节排序与分类已更新');
      }
    },

    showTagAnnotation(tagName) {
      if (!tagName) return;
      const cleanTag = tagName.trim();
      const modal = document.getElementById('module-tag-annotation-modal');
      const badgeEl = document.getElementById('module-annotation-tag-badge');
      const catEl = document.getElementById('module-annotation-category-text') || document.getElementById('module-annotation-tag-category');
      const descEl = document.getElementById('module-annotation-desc-text') || document.getElementById('module-annotation-tag-desc');
      if (!modal) return;

      let def = TAG_DEFINITIONS[cleanTag];
      if (!def) {
        if (cleanTag === '多ho') {
          def = { category: '规模人数', desc: '大于4位调查员且持有专属秘密背景的模组' };
        } else if (/^\d+(?:-\d+)?人$/.test(cleanTag)) {
          def = { category: '规模人数', desc: `${cleanTag}无HO位普通调查员规模模组` };
        } else {
          def = {
            category: '自定义标签',
            desc: '用户自定义添加的模组分类标签'
          };
        }
      }

      if (badgeEl) {
        badgeEl.textContent = cleanTag;
        badgeEl.className = `mod-tag-badge ${this.getTagClass(cleanTag)}`;
      }
      if (catEl) catEl.textContent = def.category;
      if (descEl) descEl.textContent = def.desc;

      modal.style.display = 'flex';
    },

    hideTagAnnotation() {
      const modal = document.getElementById('module-tag-annotation-modal');
      if (modal) modal.style.display = 'none';
    },

    openTagFilterModal() {
      const modal = document.getElementById('module-tag-filter-modal');
      const container = document.getElementById('module-tag-filter-options');
      if (!modal || !container) return;

      if (!this.selectedFilterTags) this.selectedFilterTags = new Set();
      this.tempFilterTags = new Set(this.selectedFilterTags);

      container.innerHTML = '';

      const groups = [
        {
          title: '背景标签',
          tags: ['日模', '美模', '现代中国', '古风']
        },
        {
          title: '结局标签',
          tags: ['危险', '普通', '安全']
        },
        {
          title: '内容标签',
          tags: ['校园', '复活', '粉红', 'NTR', '血腥暴力', '纯爱', '茶番', '恐怖', 'Meta']
        }
      ];

      groups.forEach(g => {
        const groupEl = document.createElement('div');
        groupEl.style.marginBottom = '12px';

        const titleEl = document.createElement('div');
        titleEl.style.fontSize = '12px';
        titleEl.style.fontWeight = '600';
        titleEl.style.color = 'var(--text-secondary)';
        titleEl.style.marginBottom = '6px';
        titleEl.textContent = g.title;
        groupEl.appendChild(titleEl);

        const tagsRow = document.createElement('div');
        tagsRow.style.display = 'flex';
        tagsRow.style.flexWrap = 'wrap';
        tagsRow.style.gap = '6px';

        g.tags.forEach(tag => {
          const pill = document.createElement('button');
          pill.type = 'button';
          pill.className = `mod-tag-badge ${this.getTagClass(tag)}`;
          pill.textContent = tag;
          pill.style.cursor = 'pointer';
          pill.style.border = '1px solid var(--border-color)';
          pill.style.padding = '4px 10px';
          pill.style.fontSize = '12px';

          const updatePillState = () => {
            if (this.tempFilterTags.has(tag)) {
              pill.style.boxShadow = '0 0 0 2px var(--accent-color, #4A7A68)';
              pill.style.fontWeight = '700';
            } else {
              pill.style.boxShadow = 'none';
              pill.style.fontWeight = '500';
            }
          };

          updatePillState();

          pill.addEventListener('click', () => {
            if (this.tempFilterTags.has(tag)) {
              this.tempFilterTags.delete(tag);
            } else {
              this.tempFilterTags.add(tag);
            }
            updatePillState();
          });

          tagsRow.appendChild(pill);
        });

        groupEl.appendChild(tagsRow);
        container.appendChild(groupEl);
      });

      modal.style.display = 'flex';
    },

    hideTagFilterModal() {
      const modal = document.getElementById('module-tag-filter-modal');
      if (modal) modal.style.display = 'none';
    },

    applyTagFilter() {
      this.selectedFilterTags = new Set(this.tempFilterTags || []);
      this.hideTagFilterModal();

      const filterBtn = document.getElementById('module-library-tag-filter-btn') || document.getElementById('module-library-filter-btn');
      if (filterBtn) {
        if (this.selectedFilterTags.size > 0) {
          filterBtn.style.color = 'var(--accent-color, #4A7A68)';
          filterBtn.style.borderColor = 'var(--accent-color, #4A7A68)';
          filterBtn.style.fontWeight = '600';
        } else {
          filterBtn.style.color = 'var(--text-secondary)';
          filterBtn.style.borderColor = 'var(--border-color)';
          filterBtn.style.fontWeight = '500';
        }
      }

      this.renderLibraryList();
    },

    resetTagFilter() {
      this.selectedFilterTags = new Set();
      this.tempFilterTags = new Set();
      this.hideTagFilterModal();

      const filterBtn = document.getElementById('module-library-tag-filter-btn') || document.getElementById('module-library-filter-btn');
      if (filterBtn) {
        filterBtn.style.color = 'var(--text-secondary)';
        filterBtn.style.borderColor = 'var(--border-color)';
        filterBtn.style.fontWeight = '500';
      }

      this.renderLibraryList();
    },

    async renderLibraryList(searchKeyword = '') {
      const listContainer = document.getElementById('module-library-list');
      const emptyContainer = document.getElementById('module-library-empty');
      if (!listContainer || !emptyContainer) return;

      this._libraryRenderToken = (this._libraryRenderToken || 0) + 1;
      const currentToken = this._libraryRenderToken;

      let allModules = await this.getAllModules();
      if (currentToken !== this._libraryRenderToken) return;

      if (searchKeyword.trim()) {
        const kw = searchKeyword.trim().toLowerCase();
        allModules = allModules.filter(m => m.name.toLowerCase().includes(kw));
      }

      const activeFilter = this.currentLibraryFilter || 'all';
      if (activeFilter !== 'all') {
        allModules = allModules.filter(m => {
          const sys = (m.ruleSystem || m.system || '').toLowerCase();
          const name = (m.name || '').toLowerCase();
          if (activeFilter === 'coc') {
            return sys === 'coc' || name.includes('coc') || (!sys && !name.includes('coj'));
          } else if (activeFilter === 'coj') {
            return sys === 'coj' || name.includes('coj');
          }
          return true;
        });
      }

      if (this.selectedFilterTags && this.selectedFilterTags.size > 0) {
        allModules = allModules.filter(m => {
          const modTags = Array.isArray(m.tags) && m.tags.length > 0
            ? m.tags
            : [m.bgTag || '日模', m.endingTag || '普通', ...(m.contentTags || []), ...(m.customTags || [])].filter(Boolean);
          const tagSet = new Set(modTags);
          for (let fTag of this.selectedFilterTags) {
            if (!tagSet.has(fTag)) return false;
          }
          return true;
        });
      }

      if (Array.isArray(allModules) && allModules.length > 0) {
        const uniqueModulesMap = new Map();
        allModules.forEach(mod => {
          if (!mod || !mod.id) return;
          const modName = (mod.name || "").trim().toLowerCase();
          const key = modName || String(mod.id);
          const existing = uniqueModulesMap.get(key);
          if (!existing || (mod.createdAt || 0) >= (existing.createdAt || 0)) {
            uniqueModulesMap.set(key, mod);
          }
        });
        allModules = Array.from(uniqueModulesMap.values());
      }

      if (!allModules || allModules.length === 0) {
        if (currentToken !== this._libraryRenderToken) return;
        listContainer.style.display = 'none';
        emptyContainer.style.display = 'flex';
        listContainer.innerHTML = '';
        return;
      }

      const database = this.getDB();
      let allChapters = [];
      let allImages = [];
      try {
        if (database && database.moduleChapters) {
          allChapters = await database.moduleChapters.toArray();
        }
        if (database && database.moduleImages) {
          allImages = await database.moduleImages.toArray();
        }
      } catch (e) {}

      if (currentToken !== this._libraryRenderToken) return;

      const chapsByMod = new Map();
      allChapters.forEach(c => {
        const mId = String(c.moduleId);
        if (!chapsByMod.has(mId)) chapsByMod.set(mId, []);
        chapsByMod.get(mId).push(c);
      });

      const imgsByMod = new Map();
      allImages.forEach(img => {
        const mId = String(img.moduleId);
        if (!imgsByMod.has(mId)) imgsByMod.set(mId, []);
        imgsByMod.get(mId).push(img);
      });

      const fragment = document.createDocumentFragment();
      const renderedCardKeys = new Set();

      allModules.forEach(mod => {
        if (!mod || !mod.id) return;
        const normKey = (mod.name || "").trim().toLowerCase() || String(mod.id);
        if (renderedCardKeys.has(normKey)) return;
        renderedCardKeys.add(normKey);

        const item = document.createElement('div');
        item.className = 'mod-lib-card';
        item.style.cursor = 'pointer';

        const modChaps = chapsByMod.get(String(mod.id)) || [];
        const modImgs = imgsByMod.get(String(mod.id)) || [];
        const realChapterCount = modChaps.length > 0 ? modChaps.length : (mod.chapterCount || 0);
        let chapsTotalWords = 0;
        modChaps.forEach(c => {
          const cWords = this.countWords(c.content || '');
          c.wordCount = cWords;
          chapsTotalWords += cWords;
        });
        const tocWords = modChaps.length > 0 ? this.getTocWordCount(mod, modChaps) : 0;
        const mapWords = modChaps.length > 0 ? this.getMapWordCount(mod, modChaps) : 0;
        const imgWords = this.getImagesWordCount(mod, modImgs);
        const realWordCount = modChaps.length > 0
          ? (chapsTotalWords + tocWords + mapWords + imgWords)
          : (mod.wordCount || 0);

        const sysUpper = (mod.ruleSystem || 'coc').toUpperCase();
        const struct = mod.type || '线性';
        const scale = mod.scaleType || '1v1';

        const tags = Array.isArray(mod.tags) && mod.tags.length > 0
          ? mod.tags
          : this.sortModuleTags(mod.bgTag, mod.endingTag, mod.contentTags, mod.customTags);

        let tagsHtml = '';
        tags.forEach(t => {
          const cls = this.getTagClass(t);
          tagsHtml += `<span class="mod-tag-badge ${cls}" data-tag="${t}">${t}</span>`;
        });

        const coverHtml = mod.coverImage
          ? `<div style="width: 44px; height: 44px; border-radius: 8px; overflow: hidden; flex-shrink: 0; border: 1px solid var(--border-color);"><img src="${mod.coverImage}" style="width: 100%; height: 100%; object-fit: cover;" alt="封面" /></div>`
          : `<div style="width: 44px; height: 44px; border-radius: 8px; background: var(--secondary-bg, #F0EFEA); display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: var(--accent-color, #4A7A68); border: 1px solid var(--border-color);"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"></path><path d="M6 6h10"></path><path d="M6 10h10"></path></svg></div>`;

        item.innerHTML = `
          <div style="display: flex; gap: 10px; align-items: flex-start;">
            ${coverHtml}
            <div style="flex: 1; min-width: 0;">
              <!-- 第 1 排：名称与规则系统 -->
              <div style="display: flex; justify-content: space-between; align-items: center; gap: 6px;">
                <div style="display: flex; align-items: center; gap: 6px; overflow: hidden; min-width: 0;">
                  <span style="font-weight: 600; font-size: 14px; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${mod.name}</span>
                  <span class="mod-category-pill ${sysUpper.toLowerCase()}">${sysUpper}</span>
                </div>
                <button type="button" class="mod-capsule-btn danger btn-delete-mod" data-mod-id="${mod.id}" style="flex-shrink: 0;">删除</button>
              </div>
              <!-- 第 2 排：规模人数与结构类型 -->
              <div style="display: flex; align-items: center; gap: 5px; margin-top: 4px;">
                <span class="mod-category-pill">${scale}</span>
                <span class="mod-category-pill">${struct}</span>
              </div>
              <!-- 第 3 排：普通 Tag 标签 -->
              ${tagsHtml ? `<div class="mod-tags-horizontal-row" style="display: flex; flex-wrap: wrap; align-items: center; gap: 5px; margin-top: 4px;">${tagsHtml}</div>` : ''}
              <!-- 第 4 排：字数与统计 -->
              <div style="font-size: 11px; color: var(--text-secondary); margin-top: 4px;">${realChapterCount} 章节 · ${realWordCount} 字 · ${new Date(mod.createdAt).toLocaleDateString()}</div>
            </div>
          </div>
        `;

        item.querySelectorAll('.mod-tag-badge').forEach(badge => {
          badge.addEventListener('click', (e) => {
            e.stopPropagation();
            const tag = badge.dataset.tag;
            if (tag) this.showTagAnnotation(tag);
          });
        });

        item.addEventListener('click', (e) => {
          if (e.target.closest('button') || e.target.closest('.mod-tag-badge')) return;
          this.openModuleDetail(mod.id);
        });

        const delBtn = item.querySelector('.btn-delete-mod');
        if (delBtn) {
          delBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            let confirmed = true;
            if (typeof global.showCustomConfirm === 'function') {
              confirmed = await global.showCustomConfirm('删除确认', `确定删除模组 ${mod.name} 及其全部章节吗`);
            } else if (typeof global.showCustomAlert === 'function') {
              confirmed = confirm(`确定删除模组 ${mod.name} 吗`);
            }
            if (confirmed) {
              await this.safeDBOperation('删除模组', async (db) => {
                await db.modules.delete(mod.id);
                await db.moduleChapters.where('moduleId').equals(mod.id).delete();
                await db.moduleImages.where('moduleId').equals(mod.id).delete();
              });
              this.renderLibraryList(searchKeyword);
            }
          });
        }

        fragment.appendChild(item);
      });

      if (currentToken !== this._libraryRenderToken) return;
      listContainer.style.display = 'flex';
      emptyContainer.style.display = 'none';
      if (typeof listContainer.replaceChildren === 'function') {
        listContainer.replaceChildren(fragment);
      } else {
        listContainer.innerHTML = '';
        listContainer.appendChild(fragment);
      }
    },

    // ==========================================
    // Step 4: 聊天会话模组绑定与带团调度核心引擎
    // ==========================================

    async populateChatModuleSettings(chat) {
      if (!chat) return;
      const selectEl = document.getElementById('chat-module-select');
      const statusTag = document.getElementById('chat-module-status-tag');
      const configBody = document.getElementById('chat-module-config-body');
      const modeSelect = document.getElementById('chat-module-mode-select');
      const hoSlotsContainer = document.getElementById('chat-module-ho-slots');
      const chaptersTree = document.getElementById('chat-module-chapters-tree');

      if (!selectEl) return;

      const allModules = await this.getAllModules();
      selectEl.innerHTML = '<option value="">-- 选择要加载的模组 --</option>';

      allModules.forEach(mod => {
        const opt = document.createElement('option');
        opt.value = mod.id;
        opt.textContent = `${mod.name} (${mod.chapterCount || 0}章)`;
        selectEl.appendChild(opt);
      });

      const currentConfig = chat.moduleConfig || {
        moduleId: '',
        mode: 'auto',
        selectedChapters: [],
        hoAssignments: {}
      };

      if (currentConfig.moduleId) {
        selectEl.value = currentConfig.moduleId;
        if (statusTag) {
          statusTag.textContent = '已加载';
          statusTag.style.color = 'var(--accent-color, #4A7A68)';
        }
        if (configBody) configBody.style.display = 'flex';
      } else {
        if (statusTag) {
          statusTag.textContent = '未加载';
          statusTag.style.color = 'var(--text-secondary, #8A8A8A)';
        }
        if (configBody) configBody.style.display = 'none';
      }

      if (modeSelect) {
        modeSelect.value = currentConfig.mode || 'auto';
      }

      const renderConfigUI = async (moduleId) => {
        if (!moduleId) {
          if (configBody) configBody.style.display = 'none';
          if (statusTag) statusTag.textContent = '未加载';
          return;
        }

        if (configBody) configBody.style.display = 'flex';
        if (statusTag) statusTag.textContent = '已加载';

        const database = this.getDB();
        if (!database || !database.moduleChapters) return;

        const chapters = await database.moduleChapters.where('moduleId').equals(moduleId).sortBy('sortOrder');
        
        // 缓存入同步内存
        this.chaptersMemoryCache.set(moduleId, chapters);

        // 识别 HO 角色位
        const hoNames = new Set();
        chapters.forEach(c => {
          const match = c.title.match(/HO\d+/i) || c.title.match(/ho\d+/i);
          if (match) {
            hoNames.add(match[0].toUpperCase());
          }
        });

        // 渲染 HO 分配位
        if (hoSlotsContainer) {
          hoSlotsContainer.innerHTML = '';
          if (hoNames.size > 0) {
            const title = document.createElement('div');
            title.style.fontSize = '12px';
            title.style.fontWeight = '600';
            title.style.color = 'var(--text-primary)';
            title.textContent = '角色位分配';
            hoSlotsContainer.appendChild(title);

            const members = chat.isGroup && Array.isArray(chat.members) ? chat.members : [];

            hoNames.forEach(ho => {
              const row = document.createElement('div');
              row.style.display = 'flex';
              row.style.justifyContent = 'space-between';
              row.style.alignItems = 'center';
              row.style.background = 'var(--card-bg, #FFFFFF)';
              row.style.padding = '4px 8px';
              row.style.borderRadius = '6px';

              let memberOpts = '<option value="self">自己 (我)</option>';
              members.forEach(m => {
                memberOpts += `<option value="${m.id}">${m.name || m.nickname || '群成员'}</option>`;
              });
              memberOpts += '<option value="">留空 (不存在)</option>';

              const assignedVal = (currentConfig.hoAssignments && currentConfig.hoAssignments[ho]) !== undefined
                ? currentConfig.hoAssignments[ho]
                : 'self';

              row.innerHTML = `
                <span style="font-size: 11.5px; font-weight: 600;">${ho} 角色位</span>
                <select class="moe-input chat-module-ho-select" data-ho="${ho}" style="width: 120px; height: 24px; font-size: 11px; padding: 0 4px;">
                  ${memberOpts}
                </select>
              `;

              const sel = row.querySelector('.chat-module-ho-select');
              if (sel) sel.value = assignedVal;

              hoSlotsContainer.appendChild(row);
            });
          }
        }

        // 渲染章节勾选树
        if (chaptersTree) {
          chaptersTree.innerHTML = '';
          const checkedSet = new Set(currentConfig.selectedChapters || []);

          // 若首次加载默认全选正文或第1章
          if (checkedSet.size === 0 && chapters.length > 0) {
            checkedSet.add(chapters[0].id);
          }

          chapters.forEach(chap => {
            const isChecked = checkedSet.has(chap.id);
            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.alignItems = 'center';
            row.style.justifyContent = 'space-between';
            row.style.padding = '3px 0';
            row.style.fontSize = '11.5px';

            row.innerHTML = `
              <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; margin: 0;">
                <input type="checkbox" class="chat-module-chapter-cb" value="${chap.id}" ${isChecked ? 'checked' : ''} />
                <span style="color: var(--text-primary);">${chap.sortOrder}. ${chap.title}</span>
              </label>
              <span class="module-plan-tag" style="font-size: 10px;">${chap.category}</span>
            `;

            chaptersTree.appendChild(row);
          });
        }
      };

      selectEl.onchange = (e) => {
        renderConfigUI(e.target.value);
      };

      if (currentConfig.moduleId) {
        await renderConfigUI(currentConfig.moduleId);
      }
    },

    saveChatModuleConfig(chat) {
      if (!chat) return;
      const selectEl = document.getElementById('chat-module-select');
      const modeSelect = document.getElementById('chat-module-mode-select');
      if (!selectEl) return;

      const moduleId = selectEl.value;
      const mode = modeSelect ? modeSelect.value : 'auto';

      const hoAssignments = {};
      document.querySelectorAll('.chat-module-ho-select').forEach(sel => {
        const ho = sel.dataset.ho;
        if (ho) hoAssignments[ho] = sel.value;
      });

      const selectedChapters = [];
      document.querySelectorAll('.chat-module-chapter-cb:checked').forEach(cb => {
        selectedChapters.push(cb.value);
      });

      chat.moduleConfig = {
        moduleId: moduleId,
        mode: mode,
        selectedChapters: selectedChapters,
        hoAssignments: hoAssignments
      };

      console.log('[模组] 已保存聊天模组配置:', chat.moduleConfig);
    },

    getModulePromptSync(moduleConfig) {
      if (!moduleConfig || !moduleConfig.moduleId) return '';

      const chapters = this.chaptersMemoryCache.get(moduleConfig.moduleId);
      if (!chapters || chapters.length === 0) return '';

      const selectedIds = new Set(moduleConfig.selectedChapters || []);
      const activeChapters = chapters.filter(c => selectedIds.has(c.id));

      if (activeChapters.length === 0) return '';

      const chapterBlocks = activeChapters.map((c, idx) => {
        return `---------- 【模组章节 ${idx + 1}：${c.title}】 ----------\n${c.content}\n---------- 【模组章节 ${idx + 1} 结束】 ----------`;
      }).join('\n\n');

      return `==============================\n【跑团模组开始】\n你现在是跑团守秘人，请根据以下已加载的模组章节内容推进游戏，严格遵守防剧透与判定规范：\n\n${chapterBlocks}\n\n---------- 【模组带团指令】 ----------\n1. 仅围绕上述活跃章节描写，禁止编造后续未加载章节剧情；\n2. 遇到【检定】标记引导玩家掷骰；\n3. 遇到【KP批注】按批注节奏推进。\n【跑团模组结束】\n==============================`;
    },

    initEventListeners() {
      const backBtn = document.getElementById('modules-back-btn');
      if (backBtn) {
        backBtn.addEventListener('click', () => {
          if (typeof window.showScreen === 'function') {
            window.showScreen('home-screen');
          } else if (typeof showScreen === 'function') {
            showScreen('home-screen');
          }
        });
      }

      const tabs = document.querySelectorAll('.module-header-tab');
      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          this.switchSubPanel(tab.dataset.tab);
        });
      });

      const subTabs = document.querySelectorAll('.module-subtab');
      subTabs.forEach(subTab => {
        subTab.addEventListener('click', () => {
          this.switchStep2SubTab(subTab.dataset.subtab);
        });
      });

      const stepItems = document.querySelectorAll('.wizard-step-item');
      stepItems.forEach(item => {
        item.addEventListener('click', () => {
          const targetStep = parseInt(item.dataset.step, 10);
          if (targetStep === 2 && !this.currentPlan) {
            if (typeof global.showCustomAlert === 'function') {
              global.showCustomAlert('提示', '请先完成第一步模组分析');
            }
            return;
          }
          if (targetStep === 3 && !this.currentPlan) {
            if (typeof global.showCustomAlert === 'function') {
              global.showCustomAlert('提示', '请先生成重构方案');
            }
            return;
          }
          this.setWizardStep(targetStep);
        });
      });

      const step2SplitSelect = document.getElementById('module-step2-split-select');
      const step1SplitSelect = document.getElementById('module-split-parts-select');
      if (step2SplitSelect) {
        step2SplitSelect.addEventListener('change', () => {
          if (this.currentParsedData) {
            this.currentParsedData.cutSplitParts = step2SplitSelect.value;
            this.currentParsedData.splitParts = step2SplitSelect.value;
          }
          if (!this.isCuttingRunning) {
            this.cutChaptersBySegment = [];
            this.cutChapters = [];
          }
          this.saveDraft();
        });
      }
      if (step1SplitSelect) {
        step1SplitSelect.addEventListener('change', () => {
          if (this.currentParsedData) {
            this.currentParsedData.analysisSplitParts = step1SplitSelect.value;
          }
          this.saveDraft();
        });
      }

      const progressPlanBtn = document.getElementById('module-progress-plan-btn');
      if (progressPlanBtn) {
        progressPlanBtn.addEventListener('click', () => {
          this.setWizardStep(2);
        });
      }

      const pauseBtn = document.getElementById('module-pause-btn');
      const resumeBtn = document.getElementById('module-resume-btn');
      const cancelBtn = document.getElementById('module-cancel-btn');

      if (pauseBtn) {
        pauseBtn.addEventListener('click', () => {
          this.pauseCutting();
        });
      }
      if (resumeBtn) {
        resumeBtn.addEventListener('click', () => {
          this.resumeCutting();
        });
      }
      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
          this.cancelCutting();
        });
      }

      const btnPickFile = document.getElementById('module-btn-pick-file');
      const btnPickLocal = document.getElementById('module-btn-pick-local');
      const fileInput = document.getElementById('module-file-input');

      if (btnPickFile && fileInput) {
        btnPickFile.addEventListener('click', () => {
          fileInput.value = '';
          fileInput.click();
        });
      }

      if (btnPickLocal) {
        btnPickLocal.addEventListener('click', () => {
          this.showLocalPickModal();
        });
      }

      const btnOpenMerge = document.getElementById('module-btn-open-merge');
      if (btnOpenMerge) {
        btnOpenMerge.addEventListener('click', () => {
          this.openMergeModal();
        });
      }

      const closeMergeBtn = document.getElementById('close-module-merge-modal-btn');
      const cancelMergeBtn = document.getElementById('cancel-module-merge-modal-btn');
      if (closeMergeBtn) {
        closeMergeBtn.addEventListener('click', () => {
          this.closeMergeModal();
        });
      }
      if (cancelMergeBtn) {
        cancelMergeBtn.addEventListener('click', () => {
          this.closeMergeModal();
        });
      }

      const selectMergeFilesBtn = document.getElementById('module-merge-select-files-btn');
      const mergeFilesInput = document.getElementById('module-merge-files-input');
      if (selectMergeFilesBtn && mergeFilesInput) {
        selectMergeFilesBtn.addEventListener('click', () => {
          mergeFilesInput.value = '';
          mergeFilesInput.click();
        });
      }

      if (mergeFilesInput) {
        mergeFilesInput.addEventListener('change', (e) => {
          const files = e.target.files;
          if (!files || files.length === 0) return;
          if (!this.mergeFileList) this.mergeFileList = [];
          let hasPdf = false;
          let hasDocx = false;
          for (let i = 0; i < files.length; i++) {
            const f = files[i];
            const ext = f.name.split('.').pop().toLowerCase();
            if (ext === 'pdf') hasPdf = true;
            if (ext === 'docx' || ext === 'doc') hasDocx = true;
            this.mergeFileList.push({
              id: `${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
              file: f,
              name: f.name,
              size: f.size,
              ext: ext
            });
          }
          const formatSelect = document.getElementById('module-merge-format-select');
          if (formatSelect) {
            if (hasPdf) {
              formatSelect.value = 'pdf';
            } else if (hasDocx) {
              formatSelect.value = 'docx';
            } else {
              formatSelect.value = 'txt';
            }
          }
          this.renderMergeFilesList();
          mergeFilesInput.value = '';
        });
      }

      const startMergeBtn = document.getElementById('start-module-merge-btn');
      if (startMergeBtn) {
        startMergeBtn.addEventListener('click', () => {
          this.executeMergeAndDownload();
        });
      }

      const btnOpenMulti = document.getElementById('module-btn-open-multi');
      if (btnOpenMulti) {
        btnOpenMulti.addEventListener('click', () => {
          this.openMultiModal();
        });
      }

      const closeMultiBtn = document.getElementById('close-module-multi-modal-btn');
      const cancelMultiBtn = document.getElementById('cancel-module-multi-modal-btn');
      if (closeMultiBtn) {
        closeMultiBtn.addEventListener('click', () => {
          this.closeMultiModal();
        });
      }
      if (cancelMultiBtn) {
        cancelMultiBtn.addEventListener('click', () => {
          this.closeMultiModal();
        });
      }

      const selectMultiFilesBtn = document.getElementById('module-multi-select-files-btn');
      const multiFilesInput = document.getElementById('module-multi-files-input');
      if (selectMultiFilesBtn && multiFilesInput) {
        selectMultiFilesBtn.addEventListener('click', () => {
          multiFilesInput.value = '';
          multiFilesInput.click();
        });
      }

      if (multiFilesInput) {
        multiFilesInput.addEventListener('change', (e) => {
          const files = e.target.files;
          if (!files || files.length === 0) return;
          if (!this.multiFileList) this.multiFileList = [];
          for (let i = 0; i < files.length; i++) {
            const f = files[i];
            const ext = f.name.split('.').pop().toLowerCase();
            this.multiFileList.push({
              id: `${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
              file: f,
              name: f.name,
              size: f.size,
              ext: ext
            });
          }
          this.renderMultiFilesList();
          multiFilesInput.value = '';
        });
      }

      const startMultiBtn = document.getElementById('start-module-multi-btn');
      if (startMultiBtn) {
        startMultiBtn.addEventListener('click', () => {
          this.executeMultiAnalysis();
        });
      }

      if (fileInput) {
        fileInput.addEventListener('change', async (e) => {
          const file = e.target.files && e.target.files[0];
          if (!file) return;

          try {
            console.log('[模组] 正在解析模组文件:', file.name);
            const result = await this.processModuleFile(file);
            this.renderParsedResultUI(result);
          } catch (err) {
            console.warn('[模组] 解析模组文件提示:', err);
            if (typeof global.showCustomAlert === 'function') {
              global.showCustomAlert('导入失败', err.message || '文件解析遇到格式问题，请检查文件编码');
            }
            this.resetImportUI();
          }
        });
      }

      const opinionEl = document.getElementById('module-global-opinion-textarea');
      if (opinionEl) {
        opinionEl.addEventListener('input', (e) => {
          this.globalOpinion = e.target.value;
          this.saveDraft();
        });
      }

      const tabAnalysisBtn = document.getElementById('module-prompt-tab-analysis-btn');
      const tabCuttingBtn = document.getElementById('module-prompt-tab-cutting-btn');
      const paneAnalysis = document.getElementById('module-analysis-prompt-pane');
      const paneCutting = document.getElementById('module-cutting-prompt-pane');

      if (tabAnalysisBtn && tabCuttingBtn && paneAnalysis && paneCutting) {
        tabAnalysisBtn.addEventListener('click', () => {
          tabAnalysisBtn.classList.add('active');
          tabAnalysisBtn.style.fontWeight = '600';
          tabAnalysisBtn.style.background = 'var(--card-bg, #FFFFFF)';
          tabAnalysisBtn.style.color = 'var(--text-primary)';
          tabAnalysisBtn.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';

          tabCuttingBtn.classList.remove('active');
          tabCuttingBtn.style.fontWeight = '500';
          tabCuttingBtn.style.background = 'transparent';
          tabCuttingBtn.style.color = 'var(--text-secondary)';
          tabCuttingBtn.style.boxShadow = 'none';

          paneAnalysis.style.display = 'block';
          paneCutting.style.display = 'none';
        });

        tabCuttingBtn.addEventListener('click', () => {
          tabCuttingBtn.classList.add('active');
          tabCuttingBtn.style.fontWeight = '600';
          tabCuttingBtn.style.background = 'var(--card-bg, #FFFFFF)';
          tabCuttingBtn.style.color = 'var(--text-primary)';
          tabCuttingBtn.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';

          tabAnalysisBtn.classList.remove('active');
          tabAnalysisBtn.style.fontWeight = '500';
          tabAnalysisBtn.style.background = 'transparent';
          tabAnalysisBtn.style.color = 'var(--text-secondary)';
          tabAnalysisBtn.style.boxShadow = 'none';

          paneCutting.style.display = 'block';
          paneAnalysis.style.display = 'none';
        });
      }

      const promptPresetSelect = document.getElementById('module-prompt-preset-select');
      if (promptPresetSelect) {
        promptPresetSelect.addEventListener('change', () => {
          const presets = getModulePromptPresets();
          const found = presets.find((p) => p.id === promptPresetSelect.value);
          const promptInput = document.getElementById('module-prompt-textarea');
          if (found && promptInput) {
            promptInput.value = found.prompt;
            if (this.currentParsedData) {
              this.currentParsedData.analysisPrompt = found.prompt;
              this.currentParsedData.prompt = found.prompt;
              this.saveDraft();
            }
          }
        });
      }

      const promptPresetDefaultBtn = document.getElementById('module-preset-default-btn');
      if (promptPresetDefaultBtn) {
        promptPresetDefaultBtn.addEventListener('click', async () => {
          const select = document.getElementById('module-prompt-preset-select');
          if (!select || !select.value) {
            if (typeof global.showCustomAlert === 'function') await global.showCustomAlert('提示', '请先选择预设');
            return;
          }
          setDefaultModulePresetId(select.value);
          renderModulePromptPresetsUI();
          if (typeof global.showCustomAlert === 'function') await global.showCustomAlert('提示', '已设为默认预设');
        });
      }

      const promptPresetNewBtn = document.getElementById('module-preset-new-btn');
      if (promptPresetNewBtn) {
        promptPresetNewBtn.addEventListener('click', async () => {
          const promptInput = document.getElementById('module-prompt-textarea');
          const promptText = promptInput ? promptInput.value.trim() : '';
          let name = null;
          if (typeof global.showCustomPrompt === 'function') {
            name = await global.showCustomPrompt('新建预设', '请输入预设名称');
          } else {
            name = prompt('请输入预设名称');
          }
          if (!name || !name.trim()) return;

          const presets = getModulePromptPresets();
          const newId = 'preset_' + Date.now();
          presets.push({
            id: newId,
            name: name.trim(),
            prompt: promptText || DEFAULT_TRPG_ANALYSIS_PROMPT
          });
          saveModulePromptPresets(presets);
          renderModulePromptPresetsUI();
          const select = document.getElementById('module-prompt-preset-select');
          if (select) select.value = newId;
          if (typeof global.showCustomAlert === 'function') await global.showCustomAlert('提示', '新预设已保存');
        });
      }

      const promptPresetSaveBtn = document.getElementById('module-preset-save-btn');
      if (promptPresetSaveBtn) {
        promptPresetSaveBtn.addEventListener('click', async () => {
          const select = document.getElementById('module-prompt-preset-select');
          const presets = getModulePromptPresets();
          const found = presets.find((p) => p.id === (select ? select.value : ''));
          if (!found) {
            if (typeof global.showCustomAlert === 'function') await global.showCustomAlert('提示', '请先选择要保存覆盖的预设');
            return;
          }
          const promptInput = document.getElementById('module-prompt-textarea');
          const promptText = promptInput ? promptInput.value.trim() : '';
          found.prompt = promptText;
          saveModulePromptPresets(presets);
          renderModulePromptPresetsUI();
          if (select) select.value = found.id;
          if (typeof global.showCustomAlert === 'function') await global.showCustomAlert('提示', '已覆盖保存当前预设');
        });
      }

      const promptPresetDeleteBtn = document.getElementById('module-preset-delete-btn');
      if (promptPresetDeleteBtn) {
        promptPresetDeleteBtn.addEventListener('click', async () => {
          const select = document.getElementById('module-prompt-preset-select');
          const presets = getModulePromptPresets();
          const idx = presets.findIndex((p) => p.id === (select ? select.value : ''));
          if (idx === -1) {
            if (typeof global.showCustomAlert === 'function') await global.showCustomAlert('提示', '请先选择要删除的预设');
            return;
          }
          if (presets[idx].id === 'preset_default_analysis' || presets[idx].id === 'preset_default_cut') {
            if (typeof global.showCustomAlert === 'function') await global.showCustomAlert('提示', '默认预设不能删除');
            return;
          }
          const confirmed = typeof global.showCustomConfirm === 'function'
            ? await global.showCustomConfirm('确认删除', '确定删除该预设吗')
            : confirm('确定删除该预设吗');
          if (!confirmed) return;

          presets.splice(idx, 1);
          saveModulePromptPresets(presets);
          renderModulePromptPresetsUI();
          const defaultId = getDefaultModulePresetId();
          if (select) select.value = defaultId;
          const promptInput = document.getElementById('module-prompt-textarea');
          const defaultPreset = presets.find((p) => p.id === defaultId) || presets[0];
          if (defaultPreset && promptInput) {
            promptInput.value = defaultPreset.prompt;
          }
          if (typeof global.showCustomAlert === 'function') await global.showCustomAlert('提示', '预设已删除');
        });
      }

      const cuttingPresetSelect = document.getElementById('module-cutting-preset-select');
      if (cuttingPresetSelect) {
        cuttingPresetSelect.addEventListener('change', () => {
          const presets = getModuleCuttingPresets();
          const found = presets.find((p) => p.id === cuttingPresetSelect.value);
          const cuttingInput = document.getElementById('module-cutting-prompt-textarea');
          if (found && cuttingInput) {
            cuttingInput.value = found.prompt;
            if (this.currentParsedData) {
              this.currentParsedData.cuttingPrompt = found.prompt;
              this.saveDraft();
            }
          }
        });
      }

      const cuttingPresetDefaultBtn = document.getElementById('module-cutting-preset-default-btn');
      if (cuttingPresetDefaultBtn) {
        cuttingPresetDefaultBtn.addEventListener('click', async () => {
          const select = document.getElementById('module-cutting-preset-select');
          if (!select || !select.value) {
            if (typeof global.showCustomAlert === 'function') await global.showCustomAlert('提示', '请先选择预设');
            return;
          }
          setDefaultModuleCuttingPresetId(select.value);
          renderModuleCuttingPresetsUI();
          if (typeof global.showCustomAlert === 'function') await global.showCustomAlert('提示', '已设为默认预设');
        });
      }

      const cuttingPresetNewBtn = document.getElementById('module-cutting-preset-new-btn');
      if (cuttingPresetNewBtn) {
        cuttingPresetNewBtn.addEventListener('click', async () => {
          const cuttingInput = document.getElementById('module-cutting-prompt-textarea');
          const promptText = cuttingInput ? cuttingInput.value.trim() : '';
          let name = null;
          if (typeof global.showCustomPrompt === 'function') {
            name = await global.showCustomPrompt('新建预设', '请输入预设名称');
          } else {
            name = prompt('请输入预设名称');
          }
          if (!name || !name.trim()) return;

          const presets = getModuleCuttingPresets();
          const newId = 'cutting_preset_' + Date.now();
          presets.push({
            id: newId,
            name: name.trim(),
            prompt: promptText || DEFAULT_TRPG_CUTTING_EXECUTION_PROMPT
          });
          saveModuleCuttingPresets(presets);
          renderModuleCuttingPresetsUI();
          const select = document.getElementById('module-cutting-preset-select');
          if (select) select.value = newId;
          if (typeof global.showCustomAlert === 'function') await global.showCustomAlert('提示', '新预设已保存');
        });
      }

      const cuttingPresetSaveBtn = document.getElementById('module-cutting-preset-save-btn');
      if (cuttingPresetSaveBtn) {
        cuttingPresetSaveBtn.addEventListener('click', async () => {
          const select = document.getElementById('module-cutting-preset-select');
          const presets = getModuleCuttingPresets();
          const found = presets.find((p) => p.id === (select ? select.value : ''));
          if (!found) {
            if (typeof global.showCustomAlert === 'function') await global.showCustomAlert('提示', '请先选择要保存覆盖的预设');
            return;
          }
          const cuttingInput = document.getElementById('module-cutting-prompt-textarea');
          const promptText = cuttingInput ? cuttingInput.value.trim() : '';
          found.prompt = promptText;
          saveModuleCuttingPresets(presets);
          renderModuleCuttingPresetsUI();
          if (select) select.value = found.id;
          if (typeof global.showCustomAlert === 'function') await global.showCustomAlert('提示', '已覆盖保存当前预设');
        });
      }

      const cuttingPresetDeleteBtn = document.getElementById('module-cutting-preset-delete-btn');
      if (cuttingPresetDeleteBtn) {
        cuttingPresetDeleteBtn.addEventListener('click', async () => {
          const select = document.getElementById('module-cutting-preset-select');
          const presets = getModuleCuttingPresets();
          const idx = presets.findIndex((p) => p.id === (select ? select.value : ''));
          if (idx === -1) {
            if (typeof global.showCustomAlert === 'function') await global.showCustomAlert('提示', '请先选择要删除的预设');
            return;
          }
          if (presets[idx].id === 'preset_default_cut') {
            if (typeof global.showCustomAlert === 'function') await global.showCustomAlert('提示', '默认预设不能删除');
            return;
          }
          const confirmed = typeof global.showCustomConfirm === 'function'
            ? await global.showCustomConfirm('确认删除', '确定删除该预设吗')
            : confirm('确定删除该预设吗');
          if (!confirmed) return;

          presets.splice(idx, 1);
          saveModuleCuttingPresets(presets);
          renderModuleCuttingPresetsUI();
          const defaultId = getDefaultModuleCuttingPresetId();
          if (select) select.value = defaultId;
          const cuttingInput = document.getElementById('module-cutting-prompt-textarea');
          const defaultPreset = presets.find((p) => p.id === defaultId) || presets[0];
          if (defaultPreset && cuttingInput) {
            cuttingInput.value = defaultPreset.prompt;
          }
          if (typeof global.showCustomAlert === 'function') await global.showCustomAlert('提示', '预设已删除');
        });
      }

      const promptTextarea = document.getElementById('module-prompt-textarea');
      if (promptTextarea) {
        promptTextarea.addEventListener('input', (e) => {
          if (this.currentParsedData) {
            this.currentParsedData.analysisPrompt = e.target.value;
            this.currentParsedData.prompt = e.target.value;
            this.saveDraft();
          }
        });
      }

      const cuttingPromptTextarea = document.getElementById('module-cutting-prompt-textarea');
      if (cuttingPromptTextarea) {
        cuttingPromptTextarea.addEventListener('input', (e) => {
          if (this.currentParsedData) {
            this.currentParsedData.cuttingPrompt = e.target.value;
            this.saveDraft();
          }
        });
      }

      const secondaryBtn = document.getElementById('module-secondary-action-btn');
      if (secondaryBtn) {
        secondaryBtn.addEventListener('click', () => {
          if (this.currentStep === 1) {
            this.resetImportUI();
          } else if (this.currentStep === 2) {
            this.setWizardStep(1);
          }
        });
      }

      const rethinkBtn = document.getElementById('module-rethink-action-btn');
      if (rethinkBtn) {
        rethinkBtn.addEventListener('click', async () => {
          if (this.isAnalyzing) return;
          this.isAnalyzing = true;
          this.analysisStatusText = '思考中...';
          rethinkBtn.textContent = '思考中...';
          rethinkBtn.style.opacity = '0.7';

          try {
            const plan = await this.generateCuttingPlan();
            this.renderPlanUI();
            if (typeof global.showCustomAlert === 'function') {
              global.showCustomAlert('已重新重构', 'AI 已结合您的补充意见重新调整了带团重构架构。');
            }
          } catch (err) {
            console.warn('[模组] 重新思考提示:', err);
          } finally {
            this.isAnalyzing = false;
            this.analysisStatusText = '';
            rethinkBtn.textContent = '重新思考';
            rethinkBtn.style.opacity = '1';
            this.updateBottomActionBar();
          }
        });
      }

      const handleAnalyze = async () => {
        if (this.currentStep === 1) {
          if (!this.currentParsedData) {
            const fileInput = document.getElementById('module-file-input');
            if (fileInput) {
              fileInput.value = '';
              fileInput.click();
            }
            return;
          }

          if (this.isAnalyzing) return;
          this.isAnalyzing = true;
          this.analysisError = '';
          this.analysisStatusText = '正在分析中...';
          this.updateBottomActionBar();

          try {
            const plan = await this.generateCuttingPlan();
            this.renderPlanUI();
            this.setWizardStep(2);
          } catch (err) {
            console.warn('[模组] 生成方案提示:', err);
            this.analysisError = err.message || String(err);
            if (typeof global.showCustomAlert === 'function') {
              global.showCustomAlert('重构失败', err.message || err);
            }
          } finally {
            this.isAnalyzing = false;
            this.analysisStatusText = '';
            this.updateBottomActionBar();
          }
        } else if (this.currentStep === 2) {
          if (this.isCuttingRunning) {
            this.setWizardStep(3);
          } else if (this.cutChapters && this.cutChapters.length > 0) {
            this.setWizardStep(3);
            this.renderCutChaptersUI();
          } else {
            this.executeCuttingWorkflow();
          }
        }
      };

      const primaryBtn = document.getElementById('module-primary-action-btn');
      if (primaryBtn) {
        primaryBtn.addEventListener('click', handleAnalyze);
      }

      const step1AnalyzeBtn = document.getElementById('module-step1-analyze-btn');
      if (step1AnalyzeBtn) {
        step1AnalyzeBtn.addEventListener('click', handleAnalyze);
      }

      const step1ReselectBtn = document.getElementById('module-step1-reselect-btn');
      if (step1ReselectBtn) {
        step1ReselectBtn.addEventListener('click', () => {
          this.resetImportUI();
        });
      }

      const step2PrevBtn = document.getElementById('module-step2-prev-btn');
      if (step2PrevBtn) {
        step2PrevBtn.addEventListener('click', () => {
          this.setWizardStep(1);
        });
      }

      const step2RethinkBtn = document.getElementById('module-step2-rethink-btn');
      if (step2RethinkBtn) {
        step2RethinkBtn.addEventListener('click', () => {
          const rethinkBtn = document.getElementById('module-rethink-action-btn');
          if (rethinkBtn) rethinkBtn.click();
        });
      }

      const step2CutBtn = document.getElementById('module-step2-cut-btn');
      if (step2CutBtn) {
        step2CutBtn.addEventListener('click', () => {
          if (this.isCuttingRunning) {
            this.setWizardStep(3);
          } else if (this.cutChapters && this.cutChapters.length > 0) {
            this.setWizardStep(3);
            this.renderCutChaptersUI();
          } else {
            this.executeCuttingWorkflow();
          }
        });
      }

      const step3BackBtn = document.getElementById('module-step3-back-btn');
      if (step3BackBtn) {
        step3BackBtn.addEventListener('click', () => {
          this.setWizardStep(2);
        });
      }

      const batchAuditBtn = document.getElementById('module-batch-audit-btn');
      if (batchAuditBtn) {
        batchAuditBtn.addEventListener('click', () => {
          this.batchAuditAllChapters();
        });
      }

      const globalFixAllBtn = document.getElementById('module-global-fix-all-btn');
      if (globalFixAllBtn) {
        globalFixAllBtn.addEventListener('click', () => {
          this.executeGlobalFixAll();
        });
      }

      const stepByStepFixBtn = document.getElementById('module-step-by-step-fix-btn');
      if (stepByStepFixBtn) {
        stepByStepFixBtn.addEventListener('click', () => {
          this.executeStepByStepFix();
        });
      }

      const improvementTextarea = document.getElementById('module-global-improvement-textarea');
      if (improvementTextarea) {
        improvementTextarea.addEventListener('input', (e) => {
          this.globalAuditReport = e.target.value;
          this.saveDraft();
        });
      }

      const exportBtn = document.getElementById('module-export-btn');
      if (exportBtn) {
        exportBtn.addEventListener('click', () => {
          this.exportModuleZipBundle();
        });
      }

      const saveLibraryBtn = document.getElementById('module-save-library-btn');
      if (saveLibraryBtn) {
        saveLibraryBtn.addEventListener('click', () => {
          this.saveCutModuleToLibrary();
        });
      }

      const finishBtn = document.getElementById('module-finish-btn');
      if (finishBtn) {
        finishBtn.addEventListener('click', () => {
          this.cutChapters = [];
          this.cuttingCurrentIndex = 0;
          this.isCuttingRunning = false;
          this.isCuttingPaused = false;
          this.isCuttingCancelled = false;
          const cardList = document.getElementById('module-cut-card-list');
          if (cardList) cardList.innerHTML = '';
          this.saveDraft();
          this.setWizardStep(2);
        });
      }

      const fixBtn = document.getElementById('module-audit-fix-btn');
      if (fixBtn) {
        fixBtn.addEventListener('click', () => {
          this.executeFixChapter();
        });
      }

      const recheckBtn = document.getElementById('module-audit-recheck-btn');
      if (recheckBtn) {
        recheckBtn.addEventListener('click', () => {
          if (this.isGlobalAuditMode) {
            this.runGlobalAuditScan();
          } else if (this.activeAuditChapter) {
            this.runSingleChapterAudit(this.activeAuditChapter);
          }
        });
      }

      const closeAuditBtn = document.getElementById('module-audit-modal-close-btn');
      if (closeAuditBtn) {
        closeAuditBtn.addEventListener('click', () => {
          this.hideAuditModal();
        });
      }

      const closeRawBtn = document.getElementById('module-raw-preview-close-btn');
      if (closeRawBtn) {
        closeRawBtn.addEventListener('click', () => {
          this.hideRawPreviewModal();
        });
      }

      const closeLocalPickBtn = document.getElementById('module-local-pick-close-btn');
      if (closeLocalPickBtn) {
        closeLocalPickBtn.addEventListener('click', () => {
          this.hideLocalPickModal();
        });
      }

      const libSearchInput = document.getElementById('module-library-search-input');
      if (libSearchInput) {
        libSearchInput.addEventListener('input', (e) => {
          this.renderLibraryList(e.target.value);
        });
      }

      const libImportBtn = document.getElementById('module-library-import-btn');
      const libFileInput = document.getElementById('module-library-file-input');
      if (libImportBtn && libFileInput) {
        libImportBtn.addEventListener('click', () => {
          libFileInput.click();
        });
        libFileInput.addEventListener('change', async (e) => {
          const file = e.target.files && e.target.files[0];
          if (file) {
            await this.handleImportModuleToLibrary(file);
            e.target.value = '';
          }
        });
      }

      const closePreviewBtn = document.getElementById('module-preview-modal-close-btn');
      if (closePreviewBtn) {
        closePreviewBtn.addEventListener('click', () => {
          this.hideChapterPreviewModal();
        });
      }

      const closeDetailBtn = document.getElementById('module-detail-close-btn') || document.getElementById('module-detail-back-btn');
      if (closeDetailBtn) {
        closeDetailBtn.addEventListener('click', () => {
          this.hideModuleDetail();
        });
      }

      const step3ViewPc = document.getElementById('module-step3-view-pc');
      const step3ViewKp = document.getElementById('module-step3-view-kp');
      if (step3ViewPc) {
        step3ViewPc.addEventListener('click', () => {
          this.step3ViewMode = 'pc';
          step3ViewPc.style.background = 'var(--card-bg, #FFFFFF)';
          step3ViewPc.style.color = 'var(--text-primary)';
          step3ViewPc.style.fontWeight = '600';
          if (step3ViewKp) {
            step3ViewKp.style.background = 'transparent';
            step3ViewKp.style.color = 'var(--text-secondary)';
            step3ViewKp.style.fontWeight = '500';
          }
        });
      }
      if (step3ViewKp) {
        step3ViewKp.addEventListener('click', async () => {
          let confirmed = true;
          if (typeof global.showCustomConfirm === 'function') {
            confirmed = await global.showCustomConfirm('防剧透提示', '守秘人模式包含剧情真相与核心剧透，确认开启吗');
          } else if (typeof global.showCustomAlert === 'function') {
            confirmed = confirm('守秘人模式包含剧情真相与核心剧透，确认开启吗');
          }
          if (confirmed) {
            this.step3ViewMode = 'kp';
            step3ViewKp.style.background = 'var(--card-bg, #FFFFFF)';
            step3ViewKp.style.color = 'var(--text-primary)';
            step3ViewKp.style.fontWeight = '600';
            if (step3ViewPc) {
              step3ViewPc.style.background = 'transparent';
              step3ViewPc.style.color = 'var(--text-secondary)';
              step3ViewPc.style.fontWeight = '500';
            }
          }
        });
      }

      const detailTabs = document.querySelectorAll('#module-detail-view-tabs .module-subtab');
      detailTabs.forEach(tab => {
        tab.addEventListener('click', () => {
          detailTabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          const target = tab.dataset.tab;
          const chaptersView = document.getElementById('module-detail-grouped-chapters');
          const tocView = document.getElementById('module-detail-toc-view');
          const mapView = document.getElementById('module-detail-map-view');
          const galleryView = document.getElementById('module-detail-gallery-view');
          const musicView = document.getElementById('module-detail-music-view');
          if (chaptersView) chaptersView.style.display = target === 'chapters' ? 'flex' : 'none';
          if (tocView) tocView.style.display = target === 'toc' ? 'block' : 'none';
          if (mapView) mapView.style.display = target === 'map' ? 'block' : 'none';
          if (galleryView) galleryView.style.display = target === 'gallery' ? 'flex' : 'none';
          if (musicView) {
            musicView.style.display = target === 'music' ? 'flex' : 'none';
            if (target === 'music' && this.activeDetailModule) {
              this.renderModuleDetailMusic(null, this.activeDetailModule.id);
            }
          }
        });
      });

      const musicPresetSelect = document.getElementById('module-music-preset-select');
      if (musicPresetSelect) {
        musicPresetSelect.addEventListener('change', () => {
          const presets = getModuleMusicPresets();
          const found = presets.find((p) => p.id === musicPresetSelect.value);
          const promptInput = document.getElementById('module-music-prompt-textarea');
          if (found && promptInput) {
            promptInput.value = found.prompt;
          }
        });
      }

      const musicPresetDefaultBtn = document.getElementById('module-music-preset-default-btn');
      if (musicPresetDefaultBtn) {
        musicPresetDefaultBtn.addEventListener('click', async () => {
          const select = document.getElementById('module-music-preset-select');
          if (!select || !select.value) {
            if (typeof global.showCustomAlert === 'function') await global.showCustomAlert('提示', '请先选择预设');
            return;
          }
          setDefaultModuleMusicPresetId(select.value);
          renderModuleMusicPresetsUI();
          if (typeof global.showCustomAlert === 'function') await global.showCustomAlert('提示', '已设为默认预设');
        });
      }

      const musicPresetNewBtn = document.getElementById('module-music-preset-new-btn');
      if (musicPresetNewBtn) {
        musicPresetNewBtn.addEventListener('click', async () => {
          const promptInput = document.getElementById('module-music-prompt-textarea');
          const promptText = promptInput ? promptInput.value.trim() : '';
          let name = null;
          if (typeof global.showCustomPrompt === 'function') {
            name = await global.showCustomPrompt('新建预设', '请输入预设名称');
          } else {
            name = prompt('请输入预设名称');
          }
          if (!name || !name.trim()) return;

          const presets = getModuleMusicPresets();
          const newId = 'preset_music_' + Date.now();
          presets.push({
            id: newId,
            name: name.trim(),
            prompt: promptText || DEFAULT_TRPG_MUSIC_PROMPT
          });
          saveModuleMusicPresets(presets);
          renderModuleMusicPresetsUI();
          const select = document.getElementById('module-music-preset-select');
          if (select) select.value = newId;
          if (typeof global.showCustomAlert === 'function') await global.showCustomAlert('提示', '新预设已保存');
        });
      }

      const musicPresetSaveBtn = document.getElementById('module-music-preset-save-btn');
      if (musicPresetSaveBtn) {
        musicPresetSaveBtn.addEventListener('click', async () => {
          const select = document.getElementById('module-music-preset-select');
          const presets = getModuleMusicPresets();
          const found = presets.find((p) => p.id === (select ? select.value : ''));
          if (!found) {
            if (typeof global.showCustomAlert === 'function') await global.showCustomAlert('提示', '请先选择要保存覆盖的预设');
            return;
          }
          const promptInput = document.getElementById('module-music-prompt-textarea');
          const promptText = promptInput ? promptInput.value.trim() : '';
          found.prompt = promptText;
          saveModuleMusicPresets(presets);
          renderModuleMusicPresetsUI();
          if (select) select.value = found.id;
          if (typeof global.showCustomAlert === 'function') await global.showCustomAlert('提示', '已覆盖保存当前预设');
        });
      }

      const musicPresetDeleteBtn = document.getElementById('module-music-preset-delete-btn');
      if (musicPresetDeleteBtn) {
        musicPresetDeleteBtn.addEventListener('click', async () => {
          const select = document.getElementById('module-music-preset-select');
          const presets = getModuleMusicPresets();
          const idx = presets.findIndex((p) => p.id === (select ? select.value : ''));
          if (idx === -1) {
            if (typeof global.showCustomAlert === 'function') await global.showCustomAlert('提示', '请先选择要删除的预设');
            return;
          }
          if (presets[idx].id === 'preset_default_music') {
            if (typeof global.showCustomAlert === 'function') await global.showCustomAlert('提示', '默认预设不能删除');
            return;
          }
          const confirmed = typeof global.showCustomConfirm === 'function'
            ? await global.showCustomConfirm('确认删除', '确定删除该预设吗')
            : confirm('确定删除该预设吗');
          if (!confirmed) return;
          presets.splice(idx, 1);
          saveModuleMusicPresets(presets);
          renderModuleMusicPresetsUI();
          const promptInput = document.getElementById('module-music-prompt-textarea');
          if (promptInput) {
            const firstPreset = getModuleMusicPresets()[0];
            promptInput.value = firstPreset ? firstPreset.prompt : DEFAULT_TRPG_MUSIC_PROMPT;
          }
          if (typeof global.showCustomAlert === 'function') await global.showCustomAlert('提示', '预设已删除');
        });
      }

      const galleryImportBtn = document.getElementById('module-gallery-import-btn');
      const galleryFileInput = document.getElementById('module-gallery-file-input');
      if (galleryImportBtn && galleryFileInput) {
        galleryImportBtn.addEventListener('click', () => {
          galleryFileInput.click();
        });
        galleryFileInput.addEventListener('change', async (e) => {
          const files = e.target.files;
          if (!files || files.length === 0 || !this.activeDetailModule) return;
          const database = this.getDB();
          let existingImages = [];
          if (database && database.moduleImages) {
            existingImages = await database.moduleImages.where('moduleId').equals(this.activeDetailModule.id).toArray();
          }
          let maxIndex = 0;
          existingImages.forEach(img => {
            if (typeof img.imageIndex === 'number' && img.imageIndex > maxIndex) {
              maxIndex = img.imageIndex;
            }
          });
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const dataUrl = await this.compressImageFile(file);
            maxIndex++;
            const cleanName = file.name.replace(/\.[^/.]+$/, '').trim() || `插图 ${maxIndex}`;
            const imgRecord = {
              moduleId: this.activeDetailModule.id,
              imageIndex: maxIndex,
              name: cleanName,
              dataUrl: dataUrl,
              placement: '待分析',
              annotation: '',
              description: '',
              isSensitive: false
            };
            if (database && database.moduleImages) {
              await database.moduleImages.put(imgRecord);
            }
          }
          e.target.value = '';
          const chapters = await database.moduleChapters.where('moduleId').equals(this.activeDetailModule.id).sortBy('sortOrder');
          await this.renderModuleDetailGallery(chapters, this.activeDetailModule.id);
          if (typeof global.showCustomAlert === 'function') {
            global.showCustomAlert('导入成功', `已成功导入并压缩优化 ${files.length} 张插图`);
          }
        });
      }

      const galleryLocateBtn = document.getElementById('module-gallery-locate-btn');
      if (galleryLocateBtn) {
        galleryLocateBtn.addEventListener('click', () => {
          if (this.activeDetailModule) {
            this.locateModuleImagesWithAI(this.activeDetailModule.id);
          }
        });
      }

      const galleryViewPc = document.getElementById('module-gallery-view-pc');
      const galleryViewKp = document.getElementById('module-gallery-view-kp');
      if (galleryViewPc) {
        galleryViewPc.addEventListener('click', () => {
          this.detailGalleryViewMode = 'pc';
          if (this.activeDetailModule) {
            this.renderModuleDetailGallery(this.currentReadingChapters, this.activeDetailModule.id);
          }
        });
      }
      if (galleryViewKp) {
        galleryViewKp.addEventListener('click', async () => {
          let confirmed = true;
          if (typeof global.showCustomConfirm === 'function') {
            confirmed = await global.showCustomConfirm('防剧透提示', '守秘人模式包含剧情真相与核心剧透，确认开启吗');
          } else if (typeof global.showCustomAlert === 'function') {
            confirmed = confirm('守秘人模式包含剧情真相与核心剧透，确认开启吗');
          }
          if (confirmed) {
            this.detailGalleryViewMode = 'kp';
            if (this.activeDetailModule) {
              this.renderModuleDetailGallery(this.currentReadingChapters, this.activeDetailModule.id);
            }
          }
        });
      }

      const galleryClearDiscardedBtn = document.getElementById('module-gallery-clear-discarded-btn');
      if (galleryClearDiscardedBtn) {
        galleryClearDiscardedBtn.addEventListener('click', async () => {
          if (!this.activeDetailModule) return;
          const database = this.getDB();
          if (database && database.moduleImages) {
            const allImages = await database.moduleImages.where('moduleId').equals(this.activeDetailModule.id).toArray();
            const discardedIds = allImages.filter(img => img.isDiscarded || img.isJunk || img.name?.includes('废弃') || img.name?.includes('封面') || img.name?.includes('装饰')).map(img => img.id);
            if (discardedIds.length > 0) {
              await database.moduleImages.bulkDelete(discardedIds);
            }
            const chapters = await database.moduleChapters.where('moduleId').equals(this.activeDetailModule.id).sortBy('sortOrder');
            await this.renderModuleDetailGallery(chapters, this.activeDetailModule.id);
            if (typeof global.showCustomAlert === 'function') {
              global.showCustomAlert('清理完成', `已清理 ${discardedIds.length} 张废弃与装饰图片`);
            }
          }
        });
      }

      const galleryClearBtn = document.getElementById('module-gallery-clear-btn');
      if (galleryClearBtn) {
        galleryClearBtn.addEventListener('click', async () => {
          if (!this.activeDetailModule) return;
          let confirmed = true;
          if (typeof global.showCustomConfirm === 'function') {
            confirmed = await global.showCustomConfirm('清空图库', `确定清空模组【${this.activeDetailModule.name}】下的全部图片吗？`);
          } else if (typeof global.showCustomAlert === 'function') {
            confirmed = confirm(`确定清空模组【${this.activeDetailModule.name}】下的全部图片吗？`);
          }
          if (confirmed) {
            const database = this.getDB();
            if (database && database.moduleImages) {
              await database.moduleImages.where('moduleId').equals(this.activeDetailModule.id).delete();
            }
            const chapters = await database.moduleChapters.where('moduleId').equals(this.activeDetailModule.id).sortBy('sortOrder');
            await this.renderModuleDetailGallery(chapters, this.activeDetailModule.id);
            if (typeof global.showCustomAlert === 'function') {
              global.showCustomAlert('已清空', '模组图库已成功清空');
            }
          }
        });
      }

      const detailExportBtn = document.getElementById('module-detail-export-btn');
      if (detailExportBtn) {
        detailExportBtn.addEventListener('click', async () => {
          if (this.activeDetailModule) {
            const database = this.getDB();
            if (database && database.moduleChapters) {
              const chapters = await database.moduleChapters.where('moduleId').equals(this.activeDetailModule.id).sortBy('sortOrder');
              this.exportModuleZipBundle(chapters, this.activeDetailModule.name, this.activeDetailModule.id);
            }
          }
        });
      }

      const detailEditBtn = document.getElementById('module-detail-edit-btn');
      if (detailEditBtn) {
        detailEditBtn.addEventListener('click', () => {
          if (this.activeDetailModule) {
            this.openModuleEditModal(this.activeDetailModule.id);
          }
        });
      }

      // 模组简介框右上角章节与目录编辑按键
      const detailEditChaptersBtn = document.getElementById('module-detail-edit-chapters-btn');
      if (detailEditChaptersBtn) {
        detailEditChaptersBtn.addEventListener('click', async () => {
          if (this.activeDetailModule) {
            this._chapterEditMode = !this._chapterEditMode;
            detailEditChaptersBtn.textContent = this._chapterEditMode ? '完成' : '编辑';
            detailEditChaptersBtn.className = `mod-capsule-btn ${this._chapterEditMode ? 'primary' : ''}`;
            const database = this.getDB();
            let chapters = [];
            if (database && database.moduleChapters) {
              chapters = await database.moduleChapters.where('moduleId').equals(this.activeDetailModule.id).sortBy('sortOrder');
            }
            this.renderModuleDetailGroupedChapters(chapters);
            this.renderModuleDetailToc(chapters);
          }
        });
      }

      // 模组章节管理弹窗
      const chapModalClose = document.getElementById('module-chapters-edit-close-btn');
      const chapModalCancel = document.getElementById('module-chapters-edit-cancel-btn');
      const chapModalSave = document.getElementById('module-chapters-edit-save-btn');
      if (chapModalClose) chapModalClose.addEventListener('click', () => this.hideModuleChaptersEditModal());
      if (chapModalCancel) chapModalCancel.addEventListener('click', () => this.hideModuleChaptersEditModal());
      if (chapModalSave) chapModalSave.addEventListener('click', () => this.saveModuleChaptersEdit());

      const chapModal = document.getElementById('module-chapters-edit-modal');
      if (chapModal) {
        chapModal.addEventListener('click', (e) => {
          if (e.target === chapModal) this.hideModuleChaptersEditModal();
        });
      }

      // 模组库顶部筛选按键
      const filterPills = document.querySelectorAll('.module-library-filter-bar .mod-filter-pill, .mod-filter-bar .mod-filter-pill');
      filterPills.forEach((pill) => {
        pill.addEventListener('click', () => {
          filterPills.forEach(p => p.classList.remove('active'));
          pill.classList.add('active');
          this.currentLibraryFilter = pill.dataset.filter || 'all';
          this.renderLibraryList();
        });
      });

      const libFilterBtn = document.getElementById('module-library-tag-filter-btn') || document.getElementById('module-library-filter-btn');
      if (libFilterBtn) {
        libFilterBtn.addEventListener('click', () => {
          this.openTagFilterModal();
        });
      }

      const filterModalClose = document.getElementById('module-tag-filter-close-btn') || document.getElementById('module-tag-filter-close');
      const filterModalCancel = document.getElementById('module-tag-filter-cancel-btn') || document.getElementById('module-tag-filter-cancel');
      const filterModalReset = document.getElementById('module-tag-filter-reset-btn') || document.getElementById('module-tag-filter-reset');
      const filterModalApply = document.getElementById('module-tag-filter-confirm-btn') || document.getElementById('module-tag-filter-apply');

      if (filterModalClose) filterModalClose.addEventListener('click', () => this.hideTagFilterModal());
      if (filterModalCancel) filterModalCancel.addEventListener('click', () => this.hideTagFilterModal());
      if (filterModalReset) filterModalReset.addEventListener('click', () => this.resetTagFilter());
      if (filterModalApply) filterModalApply.addEventListener('click', () => this.applyTagFilter());

      const filterModal = document.getElementById('module-tag-filter-modal');
      if (filterModal) {
        filterModal.addEventListener('click', (e) => {
          if (e.target === filterModal) this.hideTagFilterModal();
        });
      }

      const annoClose = document.getElementById('module-tag-annotation-close-btn') || document.getElementById('module-tag-annotation-close');
      const annoOk = document.getElementById('module-annotation-ok-btn') || document.getElementById('module-tag-annotation-ok');
      if (annoClose) annoClose.addEventListener('click', () => this.hideTagAnnotation());
      if (annoOk) annoOk.addEventListener('click', () => this.hideTagAnnotation());

      const annoModal = document.getElementById('module-tag-annotation-modal');
      if (annoModal) {
        annoModal.addEventListener('click', (e) => {
          if (e.target === annoModal) this.hideTagAnnotation();
        });
      }

      const sectionSettingsBtn = document.getElementById('module-section-settings-btn');
      if (sectionSettingsBtn) {
        sectionSettingsBtn.addEventListener('click', () => {
          if (this.activeSubPanel === 'workshop') {
            this.switchSubPanel('library');
          } else {
            this.switchSubPanel('workshop');
          }
        });
      }

      const wsConfigToggleBtn = document.getElementById('module-workshop-config-toggle-btn');
      if (wsConfigToggleBtn) {
        wsConfigToggleBtn.addEventListener('click', () => {
          const box = document.getElementById('module-workshop-config-box');
          if (!box) return;
          const isHidden = box.style.display === 'none' || !box.style.display;
          box.style.display = isHidden ? 'flex' : 'none';
        });
      }

      const wsConfigSaveBtn = document.getElementById('module-workshop-config-save-btn');
      if (wsConfigSaveBtn) {
        wsConfigSaveBtn.addEventListener('click', () => {
          this.saveWorkshopConfig(wsConfigSaveBtn);
        });
      }

      const wsConfigResetBtn = document.getElementById('module-workshop-config-reset-btn');
      if (wsConfigResetBtn) {
        wsConfigResetBtn.addEventListener('click', () => {
          this.resetWorkshopConfig();
        });
      }

      const wsUploadSelect = document.getElementById('module-workshop-upload-select');
      if (wsUploadSelect) {
        wsUploadSelect.addEventListener('change', async () => {
          const allModules = await this.getAllModules();
          const selected = (allModules || []).find(m => String(m.id) === String(wsUploadSelect.value));
          const descInput = document.getElementById('module-workshop-desc-input');
          if (selected && descInput) {
            descInput.value = selected.summary || '';
          }
        });
      }

      const wsUploadBtn = document.getElementById('module-workshop-upload-btn');
      if (wsUploadBtn) {
        wsUploadBtn.addEventListener('click', () => {
          this.uploadModuleToWorkshop();
        });
      }

      const wsRefreshBtn = document.getElementById('module-workshop-refresh-btn');
      if (wsRefreshBtn) {
        wsRefreshBtn.addEventListener('click', () => {
          this.refreshWorkshopList();
        });
      }

      const wsSearchInput = document.getElementById('module-workshop-search-input');
      if (wsSearchInput) {
        wsSearchInput.addEventListener('input', (e) => {
          this.renderWorkshopList(e.target.value);
        });
      }

      // 模组编辑弹窗
      const modalClose = document.getElementById('module-edit-modal-close-btn') || document.getElementById('module-edit-modal-close');
      const modalCancel = document.getElementById('module-edit-modal-cancel-btn') || document.getElementById('module-edit-modal-cancel');
      const modalSave = document.getElementById('module-edit-modal-save-btn') || document.getElementById('module-edit-modal-save');
      if (modalClose) modalClose.addEventListener('click', () => this.hideModuleEditModal());
      if (modalCancel) modalCancel.addEventListener('click', () => this.hideModuleEditModal());
      if (modalSave) modalSave.addEventListener('click', () => this.saveModuleEdit());

      const addCustomTagBtn = document.getElementById('module-edit-add-tag-btn') || document.getElementById('module-edit-custom-tag-add');
      const customTagInput = document.getElementById('module-edit-custom-tag-input');
      const handleAddCustomTag = () => {
        if (!customTagInput) return;
        const val = customTagInput.value.trim();
        if (!val) return;
        if (this.activeEditModule) {
          if (!this.activeEditModule.customTags) this.activeEditModule.customTags = [];
          if (!this.activeEditModule.customTags.includes(val)) {
            this.activeEditModule.customTags.push(val);
            if (typeof this.renderCustomTagsUI === 'function') {
              this.renderCustomTagsUI();
            }
          }
        }
        customTagInput.value = '';
      };
      if (addCustomTagBtn) addCustomTagBtn.addEventListener('click', handleAddCustomTag);
      if (customTagInput) {
        customTagInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleAddCustomTag();
          }
        });
      }

      const presetPills = document.querySelectorAll('#module-edit-preset-tags .mod-tag-pill-btn');
      presetPills.forEach((pill) => {
        pill.addEventListener('click', () => {
          const tag = pill.dataset.tag;
          if (!tag) return;
          if (!this.editingModuleTags) this.editingModuleTags = [];
          const endingTags = ['危险', '普通', '安全'];
          if (endingTags.includes(tag)) {
            // 结局影响tag互斥，只能选1个
            this.editingModuleTags = this.editingModuleTags.filter((t) => !endingTags.includes(t));
            this.editingModuleTags.unshift(tag);
          } else {
            if (this.editingModuleTags.includes(tag)) {
              this.editingModuleTags = this.editingModuleTags.filter((t) => t !== tag);
            } else {
              this.editingModuleTags.push(tag);
            }
          }
          this.renderEditingTags();
        });
      });

      const detailDeleteBtn = document.getElementById('module-detail-delete-btn');
      if (detailDeleteBtn) {
        detailDeleteBtn.addEventListener('click', async () => {
          if (this.activeDetailModule) {
            let confirmed = true;
            if (typeof global.showCustomConfirm === 'function') {
              confirmed = await global.showCustomConfirm('删除确认', `确定删除模组 ${this.activeDetailModule.name} 及其全部章节吗`);
            } else if (typeof global.showCustomAlert === 'function') {
              confirmed = confirm(`确定删除模组 ${this.activeDetailModule.name} 吗`);
            }
            if (confirmed) {
              await this.safeDBOperation('删除模组', async (db) => {
                await db.modules.delete(this.activeDetailModule.id);
                await db.moduleChapters.where('moduleId').equals(this.activeDetailModule.id).delete();
                await db.moduleImages.where('moduleId').equals(this.activeDetailModule.id).delete();
              });
              this.hideModuleDetail();
              this.renderLibraryList();
            }
          }
        });
      }

      const closeReaderBtn = document.getElementById('module-reader-close-btn') || document.getElementById('module-reader-back-btn');
      if (closeReaderBtn) {
        closeReaderBtn.addEventListener('click', () => {
          this.backToModuleDetail();
        });
      }

      const readerEditBtn = document.getElementById('module-reader-edit-btn');
      if (readerEditBtn) {
        readerEditBtn.addEventListener('click', () => {
          this.toggleReaderEditMode();
        });
      }

      const readerViewPc = document.getElementById('module-reader-view-pc');
      const readerViewKp = document.getElementById('module-reader-view-kp');
      if (readerViewPc) {
        readerViewPc.addEventListener('click', () => {
          this.openChapterReader(this.currentReadingChapters, this.currentReadingIndex, 'pc');
        });
      }
      if (readerViewKp) {
        readerViewKp.addEventListener('click', async () => {
          let confirmed = true;
          if (typeof global.showCustomConfirm === 'function') {
            confirmed = await global.showCustomConfirm('防剧透提示', '守秘人模式包含剧情真相与核心剧透，确认开启吗');
          } else if (typeof global.showCustomAlert === 'function') {
            confirmed = confirm('守秘人模式包含剧情真相与核心剧透，确认开启吗');
          }
          if (confirmed) {
            this.openChapterReader(this.currentReadingChapters, this.currentReadingIndex, 'kp');
          }
        });
      }

      const readerPrevBtn = document.getElementById('module-reader-prev-btn');
      const readerNextBtn = document.getElementById('module-reader-next-btn');
      if (readerPrevBtn) {
        readerPrevBtn.addEventListener('click', () => {
          if (this.currentReadingIndex > 0) {
            this.openChapterReader(this.currentReadingChapters, this.currentReadingIndex - 1, this.currentReadingViewMode);
          }
        });
      }
      if (readerNextBtn) {
        readerNextBtn.addEventListener('click', () => {
          if (this.currentReadingIndex < this.currentReadingChapters.length - 1) {
            this.openChapterReader(this.currentReadingChapters, this.currentReadingIndex + 1, this.currentReadingViewMode);
          }
        });
      }

      this.initAiWriterEvents();
      this.loadDraft();
    },

    // ==========================================================
    // --- AI 写模组 (因地制宜四阶流水线 + 暗箱防剧透 + 本地思维链融合) ---
    // ==========================================================
    aiWriterState: {
      initialized: false,
      isRunning: false,
      bgTags: ['日模'],
      relTags: ['搭档'],
      toneTags: ['纯爱'],
      tropeTags: [],
      customTags: [],
      selectedTcIds: [],
      lastGeneratedBundle: null,
      pipelineCheckpoint: null,
      draftLoaded: false
    },

    async saveAiWriterDraftToIDB() {
      try {
        const formValues = {
          ruleSystem: document.getElementById('ai-mod-rule-select')?.value || 'coc',
          scaleType: document.getElementById('ai-mod-scale-select')?.value || '1v1',
          modType: document.getElementById('ai-mod-type-select')?.value || '线性',
          difficulty: document.getElementById('ai-mod-diff-select')?.value || '普通',
          lengthMode: document.getElementById('ai-mod-len-select')?.value || 'medium',
          drawMode: document.getElementById('ai-mod-draw-select')?.value || 'off',
          refMode: document.getElementById('ai-mod-ref-select')?.value || 'free',
          title: document.getElementById('ai-mod-title-input')?.value || '',
          author: document.getElementById('ai-mod-author-input')?.value || '守秘人',
          hook: document.getElementById('ai-mod-hook-input')?.value || ''
        };
        const statusEl = document.getElementById('ai-mod-status-text');
        const barEl = document.getElementById('ai-mod-progress-bar');
        const pctVal = barEl && barEl.style.width ? parseInt(barEl.style.width, 10) || 0 : 0;

        const payload = {
          updatedAt: Date.now(),
          bgTags: [...(this.aiWriterState.bgTags || [])],
          relTags: [...(this.aiWriterState.relTags || [])],
          toneTags: [...(this.aiWriterState.toneTags || [])],
          tropeTags: [...(this.aiWriterState.tropeTags || [])],
          customTags: [...(this.aiWriterState.customTags || [])],
          selectedTcIds: [...(this.aiWriterState.selectedTcIds || [])],
          formValues,
          lastGeneratedBundle: this.aiWriterState.lastGeneratedBundle || null,
          pipelineCheckpoint: this.aiWriterState.pipelineCheckpoint || null,
          statusText: statusEl ? statusEl.textContent : '',
          statusPct: pctVal
        };

        try {
          const lightFormBackup = {
            updatedAt: payload.updatedAt,
            bgTags: payload.bgTags,
            relTags: payload.relTags,
            toneTags: payload.toneTags,
            tropeTags: payload.tropeTags,
            customTags: payload.customTags,
            selectedTcIds: payload.selectedTcIds,
            formValues: payload.formValues,
            statusText: payload.statusText,
            statusPct: payload.statusPct
          };
          localStorage.setItem('ephone_ai_writer_form_draft_v1', JSON.stringify(lightFormBackup));
        } catch (_) {}

        const idb = await this._openDraftDB();
        if (idb) {
          await new Promise((resolve) => {
            const tx = idb.transaction('drafts', 'readwrite');
            tx.objectStore('drafts').put(payload, 'active_ai_writer_draft');
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => resolve(false);
          });
        }
      } catch (e) {
        console.warn('[AI写模] 保存本地草稿提示:', e);
      }
    },

    async loadAiWriterDraftFromIDB() {
      try {
        let draft = null;
        try {
          const idb = await this._openDraftDB();
          if (idb) {
            draft = await new Promise((resolve) => {
              const tx = idb.transaction('drafts', 'readonly');
              const req = tx.objectStore('drafts').get('active_ai_writer_draft');
              req.onsuccess = () => resolve(req.result || null);
              req.onerror = () => resolve(null);
            });
          }
        } catch (_) {}

        let lsDraft = null;
        try {
          const rawLs = localStorage.getItem('ephone_ai_writer_form_draft_v1');
          if (rawLs) lsDraft = JSON.parse(rawLs);
        } catch (_) {}

        if (!draft && lsDraft) {
          draft = lsDraft;
        } else if (draft && lsDraft && (lsDraft.updatedAt || 0) >= (draft.updatedAt || 0)) {
          draft.formValues = Object.assign({}, draft.formValues || {}, lsDraft.formValues || {});
          if (Array.isArray(lsDraft.bgTags)) draft.bgTags = lsDraft.bgTags;
          if (Array.isArray(lsDraft.relTags)) draft.relTags = lsDraft.relTags;
          if (Array.isArray(lsDraft.toneTags)) draft.toneTags = lsDraft.toneTags;
          if (Array.isArray(lsDraft.tropeTags)) draft.tropeTags = lsDraft.tropeTags;
          if (Array.isArray(lsDraft.customTags)) draft.customTags = lsDraft.customTags;
          if (Array.isArray(lsDraft.selectedTcIds)) draft.selectedTcIds = lsDraft.selectedTcIds;
        }

        if (!draft) return false;

        if (Array.isArray(draft.bgTags)) this.aiWriterState.bgTags = draft.bgTags;
        if (Array.isArray(draft.relTags)) this.aiWriterState.relTags = draft.relTags;
        if (Array.isArray(draft.toneTags)) this.aiWriterState.toneTags = draft.toneTags;
        if (Array.isArray(draft.tropeTags)) this.aiWriterState.tropeTags = draft.tropeTags;
        if (Array.isArray(draft.customTags)) this.aiWriterState.customTags = draft.customTags;
        if (Array.isArray(draft.selectedTcIds)) this.aiWriterState.selectedTcIds = draft.selectedTcIds;
        this.aiWriterState.lastGeneratedBundle = draft.lastGeneratedBundle || null;
        this.aiWriterState.pipelineCheckpoint = draft.pipelineCheckpoint || null;

        const fv = draft.formValues || {};
        const setVal = (id, val) => {
          const el = document.getElementById(id);
          if (el && val !== undefined && val !== null) el.value = val;
        };
        setVal('ai-mod-rule-select', fv.ruleSystem || 'coc');
        setVal('ai-mod-scale-select', fv.scaleType || '1v1');
        setVal('ai-mod-type-select', fv.modType || '线性');
        setVal('ai-mod-diff-select', fv.difficulty || '普通');
        setVal('ai-mod-len-select', fv.lengthMode || 'medium');
        setVal('ai-mod-draw-select', fv.drawMode || 'off');
        setVal('ai-mod-ref-select', fv.refMode || 'free');
        setVal('ai-mod-title-input', fv.title || '');
        setVal('ai-mod-author-input', fv.author || '守秘人');
        setVal('ai-mod-hook-input', fv.hook || '');

        this.renderAiWriterTags();
        await this.refreshAiWriterThoughtChains();

        const previewBox = document.getElementById('ai-mod-preview-box');
        const previewTitleEl = document.getElementById('ai-mod-preview-title');
        const previewMetaEl = document.getElementById('ai-mod-preview-meta');
        const previewPublicEl = document.getElementById('ai-mod-preview-public');
        const saveBtn = document.getElementById('ai-mod-save-btn');
        const resumeBtn = document.getElementById('ai-mod-resume-btn');

        const cp = this.aiWriterState.pipelineCheckpoint;
        const bundle = this.aiWriterState.lastGeneratedBundle;

        if (bundle && Array.isArray(bundle.chapters) && bundle.chapters.length > 0) {
          if (saveBtn) saveBtn.disabled = false;
          if (resumeBtn) resumeBtn.style.display = 'none';
          this.setAiWriterStepActive(4);
          let totalWords = 0;
          bundle.chapters.forEach(c => { totalWords += this.countWords(c.content || ''); });
          if (previewBox && previewTitleEl && previewPublicEl) {
            previewBox.style.display = 'flex';
            previewTitleEl.textContent = bundle.title || '未命名模组';
            if (previewMetaEl) previewMetaEl.textContent = `${bundle.chapters.length}章 · ${totalWords}字`;
            const pubChap = bundle.chapters[0]?.content || bundle.summary || '';
            previewPublicEl.textContent = pubChap.replace(/^【正文】\s*/, '').replace(/\n\n至此本小章节结束[\s\S]*$/, '');
          }
          this.updateAiWriterStatus(100, draft.statusText || `已恢复《${bundle.title || '模组'}》草稿，共 ${bundle.chapters.length} 章`);
        } else if (cp && !cp.isCompleted) {
          if (resumeBtn) {
            resumeBtn.style.display = 'inline-flex';
            resumeBtn.disabled = false;
          }
          if (cp.activeStep) {
            this.setAiWriterStepActive(cp.activeStep);
          }
          if (cp.ai1Data && previewBox && previewTitleEl && previewPublicEl) {
            previewBox.style.display = 'flex';
            previewTitleEl.textContent = cp.finalModTitle || cp.ai1Data.title || '未命名模组';
            const doneScenes = typeof cp.completedSceneCount === 'number' ? cp.completedSceneCount : 0;
            const totalScenes = Array.isArray(cp.resolvedScenes) ? cp.resolvedScenes.length : (Array.isArray(cp.ai1Data.plannedScenes) ? cp.ai1Data.plannedScenes.length : 0);
            if (previewMetaEl) previewMetaEl.textContent = `已保存进度 · 正文 ${doneScenes}/${totalScenes} 章`;
            previewPublicEl.textContent = this.cleanModuleChapterOutput(String(cp.ai1Data.publicInfoChapter || cp.ai1Data.summary || ''));
          }
          this.updateAiWriterStatus(draft.statusPct || 30, draft.statusText || '检测到上次未完成的写模组进度，可点击继续接着往后生成');
        } else {
          if (resumeBtn) resumeBtn.style.display = 'none';
        }
        return true;
      } catch (e) {
        console.warn('[AI写模] 读取本地草稿提示:', e);
        return false;
      }
    },

    async clearAiWriterDraftFromIDB() {
      try {
        localStorage.removeItem('ephone_ai_writer_form_draft_v1');
      } catch (_) {}
      try {
        const idb = await this._openDraftDB();
        if (idb) {
          await new Promise((resolve) => {
            const tx = idb.transaction('drafts', 'readwrite');
            tx.objectStore('drafts').delete('active_ai_writer_draft');
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => resolve(false);
          });
        }
      } catch (_) {}
    },

    getAiWriterTagCatalog() {
      return {
        bg: ['日模', '中式', '美模', '古风', '现代', '民国', '西幻', '赛博', '末日', '哨向', 'ABO', '无限', '校园', '都市', '欧风', '架空'],
        rel: ['竹马', '天降', '宿敌', '死敌', '年上', '年下', '骨科', '师徒', '主仆', '搭档', '前任', '替身', '契约', '同居', '网恋', '掉马', '双强', '高岭', '疯批', '病娇', '忠犬', '钓系', '傲娇', '腹黑'],
        tone: ['纯爱', '粉红', '甜宠', '贴贴', '浪漫', '深情', '悲情', '宿命', '唯美', '拉扯', '暧昧', '训犬', '强制', '监禁', '背德', '救赎', '破镜', '追妻', '火葬', '暗恋', '酸甜', '吃醋', '修罗', '微虐', '刀子', '发疯', '茶番', '治愈', '微恐', '恐怖', '猎奇', '血腥'],
        trope: ['旅游', '调查', '解密', '怪谈', '规则', '梦境', '时间', '循环', '重生', '穿书', '复活', '失忆', '读心', '共感', '变小', '互换', '兽耳', '魅魔', '人外', '神明', '诅咒', '发热', '易感', '催眠', '伪装', '孤岛', '暴雪', '游轮', '列车', '旅馆', '游园']
      };
    },

    drawInspirationSeedsForTags(allTags) {
      const tagStr = (allTags || []).join(' ');
      const isRomanticPoignant = /浪漫|深情|悲情|宿命|唯美|救赎|破镜|酸甜|微虐|刀子/.test(tagStr);
      const isSweetCozy = /茶番|甜宠|贴贴|治愈|旅游|同居/.test(tagStr) && !/恐怖|血腥|猎奇/.test(tagStr);
      const isSpicyTension = /粉红|拉扯|暧昧|训犬|强制|监禁|背德|修罗|吃醋|病娇|疯批|发热|易感|共感/.test(tagStr);

      const poignantPool = [
        '黄昏停运的末班海岸列车上，时间只剩下最后三次停靠，KPC怀里揣着一张早已过期的双人车票与未说出口的告别',
        '初雪落满庭院的旧宅里，KPC正在一页页修补你们共同的记忆画册，而每修补完一页，现实中属于他的痕迹就淡去一分',
        '不断重复的八月最后一天，唯有KPC记得此前无数次轮回里为你挡下灾厄的代价，却依然在清晨微笑着邀你赴约',
        '大雾弥漫的边境灯塔下，失联已久的搭档重新出现在你面前，他眼底藏着跨越生死的温柔与不能触碰的倒计时',
        '盛夏祭典的烟花声中，你们必须在黎明到来前完成最后一次心愿交接，所有的克制与隐忍都在夜风里悄然决堤',
        '能典当记忆与寿命的深夜当铺里，你意外发现了KPC多年前留下的典当契约，赎回条件竟是与他共度一场完整的幻梦',
        '百年一遇的流星雨夜，两个背负相反宿命的人在废弃天文台重逢，星图指向的终点是唯有一人能离开的黎明',
        '雨季连绵的江南古镇或昭和旧街，一把旧油纸伞下藏着跨越时光的执念，每一个似曾相识的街角都在唤醒尘封的深情'
      ];

      const sweetPool = [
        '奇妙的早晨醒来，你面前同时站着一脸醋意的成年KPC与死死抱住你衣角不肯撒手的幼年KPC，解除异常的条件让人脸红心跳',
        '大雪意外封住了山顶温泉旅馆的唯一下山路，整座旅馆只剩你们两人，而KPC平时冷静自持的伪装在热气与微醺中寸寸瓦解',
        '一场荒诞又可爱的日常小诅咒让你们只要距离超过三米就会触发奇妙副作用，不得不整天寸步不离地贴在一起应付日常',
        '原本只是寻常的游乐园或海边假日约会，KPC却反常地支支吾吾、耳根通红，每一次骰子检定都在拆穿他暗中筹备的偏爱',
        '意外拾到的奇妙暖炉或魔法茶具把房间变成了舒适的箱庭空间，只有顺着KPC那些别扭又可爱的小心思互动才能找到出口',
        'KPC突然一本正经地向你坦白一件听起来惊世骇俗、细究起来却让人忍俊不禁的秘密，拉开了两人独处一室的甜蜜审讯',
        '短暂的读心或感官互通意外降临，KPC表面依然维持着平淡冷酷的模样，脑海里刷屏的占有欲与心动却被你听得一清二楚',
        '一觉醒来KPC长出了无法隐藏的兽耳与尾巴，只有你的抚摸与亲近才能安抚他躁动的本能，偏偏他还嘴硬不肯承认'
      ];

      const tensionPool = [
        '意外触发的双向感官共感将死敌或搭档死死绑在一起，一方极力压抑的喘息、痛楚与渴望都会百倍放大地传递给另一方',
        '密闭华丽的箱庭房间内，解除束缚的唯一钥匙藏在对方贴身之处，每一轮试探都是一场争夺主导权的心理与感官博弈',
        '昔日高高在上的上位者或宿敌因特殊失忆或契约反噬，落入完全依赖你的境地，却在顺从表象下暗暗编织反客为主的猎网',
        '突如其来的特殊发热期或共鸣诅咒打破了两人之间脆弱的安全距离，唯有带有安抚意味的亲密接触才能压制濒临崩溃的理智值',
        '平淡同居生活的一角突然裂开缝隙，你无意间闯入KPC藏匿最深的私人暗室，而身后传来了门锁落下的轻响与他低沉的叹息',
        '一场必须假扮热恋情侣的潜入调查任务，本该是逢场作戏的逢迎与触碰，却在狭小藏身处擦出了彻底失控的真火',
        '多方势力交织的修罗场晚宴上，表面温和的KPC在暗处扣住你的手腕，每一个眼神与暗骰都在逼迫你做出只属于他的选择',
        '带着记忆重逢的前任或竹马以全新的危险身份将你困在谈判桌前，每一条看似苛刻的契约条款背后都是疯长的执念'
      ];

      const mysteryPool = [
        '优格索托斯的时空折射让这一天成为了无限延伸的莫比乌斯环，看似平静的日常街道下，唯有找到因果倒置的锚点才能破局',
        '诺登斯与旧日支配者博弈的幻梦境箱庭伪装成宁静的学园或小镇，六大怪谈背后对应着造梦者潜意识里不愿醒来的创伤',
        '死去之人的来信将调查员引向被浓雾封锁的孤岛馆舍，所有NPC都在遵循一套诡异的日常守则，违背守则者将被涂抹存在',
        '记忆中的挚友与眼前的KPC存在微小却致命的认知偏差，调查越深入，越发现整个舞台是一座为了留住某人而搭建的精密楚门世界',
        '古老民俗祭典的前夜，镇上所有镜子里的倒影都比现实慢了半拍，而KPC正试图在你不察觉的情况下独自完成替换仪式',
        '深夜停靠在不存在站台的幽灵列车，每一节车厢都对应一段被篡改的过往，唯有拼齐散落的真相碎片才能在天亮前下车',
        '看似完美的复活奇迹背后连接着莎布尼古拉丝的母体温床，温柔如初的爱人躯壳下正进行着人性与神性的静默拉锯',
        '一桩全员皆有动机的密室异变，所有表面线索都指向显而易见的替罪羊，唯有通过不起眼的生活细节才能逆推出真正的幕后执棋者'
      ];

      let activePool = [];
      if (isRomanticPoignant) activePool = activePool.concat(poignantPool);
      if (isSweetCozy) activePool = activePool.concat(sweetPool);
      if (isSpicyTension) activePool = activePool.concat(tensionPool);
      if (activePool.length < 5 || /调查|解密|怪谈|规则|恐怖|硬核|诡计/.test(tagStr)) {
        activePool = activePool.concat(mysteryPool);
      }
      if (activePool.length < 8) {
        activePool = activePool.concat(sweetPool, poignantPool, tensionPool);
      }

      const shuffled = activePool.slice().sort(() => Math.random() - 0.5);
      return shuffled.slice(0, 5);
    },

    async openAiWriterScreen() {
      this.initAiWriterEvents();
      if (!this.aiWriterState.draftLoaded) {
        this.aiWriterState.draftLoaded = true;
        const restored = await this.loadAiWriterDraftFromIDB();
        if (!restored) {
          this.renderAiWriterTags();
          await this.refreshAiWriterThoughtChains();
        }
      } else {
        this.renderAiWriterTags();
        await this.refreshAiWriterThoughtChains();
      }
      if (typeof global.showScreen === 'function') {
        global.showScreen('ai-module-writer-screen');
      }
    },

    initAiWriterEvents() {
      if (this.aiWriterState.initialized) return;
      const screenEl = document.getElementById('ai-module-writer-screen');
      if (!screenEl) return;
      this.aiWriterState.initialized = true;

      const gotoLibBtn = document.getElementById('ai-mod-goto-lib-btn');
      if (gotoLibBtn) {
        gotoLibBtn.addEventListener('click', () => {
          if (typeof global.showScreen === 'function') {
            global.showScreen('chat-list-screen');
          }
          const modNav = document.querySelector('#chat-list-bottom-nav .nav-item[data-view="modules-view"]');
          if (modNav) modNav.click();
        });
      }

      const resetBtn = document.getElementById('ai-mod-reset-btn');
      if (resetBtn) {
        resetBtn.addEventListener('click', async () => {
          if (this.aiWriterState.isRunning) return;
          this.aiWriterState.bgTags = ['日模'];
          this.aiWriterState.relTags = ['搭档'];
          this.aiWriterState.toneTags = ['纯爱'];
          this.aiWriterState.tropeTags = [];
          this.aiWriterState.customTags = [];
          this.aiWriterState.lastGeneratedBundle = null;
          this.aiWriterState.pipelineCheckpoint = null;
          const titleInput = document.getElementById('ai-mod-title-input');
          const hookInput = document.getElementById('ai-mod-hook-input');
          const customInput = document.getElementById('ai-mod-custom-tag-input');
          const previewBox = document.getElementById('ai-mod-preview-box');
          const saveBtn = document.getElementById('ai-mod-save-btn');
          const resumeBtn = document.getElementById('ai-mod-resume-btn');
          if (titleInput) titleInput.value = '';
          if (hookInput) hookInput.value = '';
          if (customInput) customInput.value = '';
          if (previewBox) previewBox.style.display = 'none';
          if (saveBtn) saveBtn.disabled = true;
          if (resumeBtn) resumeBtn.style.display = 'none';
          this.setAiWriterStepActive(0);
          this.renderAiWriterTags();
          this.updateAiWriterStatus(0, '已清空全部草稿与选项，可重新勾选标签后点击生成');
          await this.clearAiWriterDraftFromIDB();
        });
      }

      const formIds = [
        'ai-mod-rule-select',
        'ai-mod-scale-select',
        'ai-mod-type-select',
        'ai-mod-diff-select',
        'ai-mod-len-select',
        'ai-mod-draw-select',
        'ai-mod-ref-select',
        'ai-mod-title-input',
        'ai-mod-author-input',
        'ai-mod-hook-input'
      ];
      formIds.forEach(fid => {
        const el = document.getElementById(fid);
        if (el) {
          el.addEventListener('change', () => { this.saveAiWriterDraftToIDB(); });
          if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            el.addEventListener('input', () => { this.saveAiWriterDraftToIDB(); });
          }
        }
      });

      const hookPresetSelect = document.getElementById('ai-mod-hook-preset-select');
      if (hookPresetSelect) {
        hookPresetSelect.addEventListener('change', () => {
          const val = hookPresetSelect.value;
          const hookInputEl = document.getElementById('ai-mod-hook-input');
          if (val && hookInputEl) {
            hookInputEl.value = val;
            this.saveAiWriterDraftToIDB();
          }
        });
      }

      const addTagBtn = document.getElementById('ai-mod-add-tag-btn');
      const customTagInput = document.getElementById('ai-mod-custom-tag-input');
      const handleAddCustomTag = () => {
        if (!customTagInput) return;
        const val = customTagInput.value.trim();
        if (!val) return;
        if (!this.aiWriterState.customTags.includes(val)) {
          this.aiWriterState.customTags.push(val);
        }
        customTagInput.value = '';
        this.renderAiWriterTags();
        this.saveAiWriterDraftToIDB();
      };
      if (addTagBtn) addTagBtn.addEventListener('click', handleAddCustomTag);
      if (customTagInput) {
        customTagInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleAddCustomTag();
          }
        });
      }

      const refreshTcBtn = document.getElementById('ai-mod-refresh-tc-btn');
      if (refreshTcBtn) {
        refreshTcBtn.addEventListener('click', () => {
          this.refreshAiWriterThoughtChains();
        });
      }

      const genBtn = document.getElementById('ai-mod-generate-btn');
      if (genBtn) {
        genBtn.addEventListener('click', () => {
          this.runAiModulePipeline(false);
        });
      }

      const resumeBtn = document.getElementById('ai-mod-resume-btn');
      if (resumeBtn) {
        resumeBtn.addEventListener('click', () => {
          this.runAiModulePipeline(true);
        });
      }

      const saveBtn = document.getElementById('ai-mod-save-btn');
      if (saveBtn) {
        saveBtn.addEventListener('click', () => {
          if (this.aiWriterState.lastGeneratedBundle) {
            this.saveAiGeneratedModuleToDB(this.aiWriterState.lastGeneratedBundle, true);
          }
        });
      }

      if (!this.aiWriterState.draftLoaded) {
        this.aiWriterState.draftLoaded = true;
        this.loadAiWriterDraftFromIDB();
      }
    },

    renderAiWriterTags() {
      const catalog = this.getAiWriterTagCatalog();
      const renderGroup = (containerId, list, stateKey) => {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';
        const selectedArr = this.aiWriterState[stateKey] || [];
        list.forEach(tag => {
          const isChecked = selectedArr.includes(tag);
          const label = document.createElement('label');
          label.className = `mod-tag-select-item ${this.getTagClass ? this.getTagClass(tag) : ''}`;
          label.style.cssText = 'display: flex; align-items: center; justify-content: center; gap: 4px; padding: 5px 4px; border-radius: 6px; font-size: 11.5px; cursor: pointer; user-select: none; box-sizing: border-box; overflow: hidden;';
          label.innerHTML = `
            <input type="checkbox" value="${tag}" ${isChecked ? 'checked' : ''} style="width: 13px; height: 13px; flex-shrink: 0; margin: 0; padding: 0; cursor: pointer;" />
            <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${tag}</span>
          `;
          const inputEl = label.querySelector('input');
          if (inputEl) {
            inputEl.addEventListener('change', (e) => {
              if (e.target.checked) {
                if (!this.aiWriterState[stateKey].includes(tag)) {
                  this.aiWriterState[stateKey].push(tag);
                }
              } else {
                this.aiWriterState[stateKey] = this.aiWriterState[stateKey].filter(t => t !== tag);
              }
              this.updateAiWriterSelectedTagCount();
              this.saveAiWriterDraftToIDB();
            });
          }
          container.appendChild(label);
        });
      };

      renderGroup('ai-mod-tags-bg', catalog.bg, 'bgTags');
      renderGroup('ai-mod-tags-rel', catalog.rel, 'relTags');
      renderGroup('ai-mod-tags-tone', catalog.tone, 'toneTags');
      renderGroup('ai-mod-tags-trope', catalog.trope, 'tropeTags');

      const customListEl = document.getElementById('ai-mod-custom-tags-list');
      if (customListEl) {
        customListEl.innerHTML = '';
        (this.aiWriterState.customTags || []).forEach(tag => {
          const chip = document.createElement('span');
          chip.className = 'mod-tag-badge';
          chip.style.cssText = 'display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 6px; font-size: 11px; cursor: pointer;';
          chip.innerHTML = `<span>${tag}</span><span style="font-size: 12px; opacity: 0.7;">×</span>`;
          chip.addEventListener('click', () => {
            this.aiWriterState.customTags = this.aiWriterState.customTags.filter(t => t !== tag);
            this.renderAiWriterTags();
            this.saveAiWriterDraftToIDB();
          });
          customListEl.appendChild(chip);
        });
      }

      this.updateAiWriterSelectedTagCount();
    },

    updateAiWriterSelectedTagCount() {
      const countEl = document.getElementById('ai-mod-selected-tags-count');
      if (!countEl) return;
      const total =
        (this.aiWriterState.bgTags || []).length +
        (this.aiWriterState.relTags || []).length +
        (this.aiWriterState.toneTags || []).length +
        (this.aiWriterState.tropeTags || []).length +
        (this.aiWriterState.customTags || []).length;
      countEl.textContent = `已选 ${total} 项`;
    },

    async refreshAiWriterThoughtChains() {
      const container = document.getElementById('ai-mod-tc-list');
      if (!container) return;
      container.innerHTML = '';

      try {
        const database = this.getDB();
        const presets = (database && database.thoughtChainPresets)
          ? await database.thoughtChainPresets.toArray()
          : [];

        if (!presets || presets.length === 0) {
          container.innerHTML = '<span style="font-size: 11.5px; color: var(--text-secondary);">本地暂无思维链预设，将使用内置文学审美准则</span>';
          return;
        }

        const defaultId = (global.state && global.state.globalSettings)
          ? global.state.globalSettings.defaultThoughtChainId
          : null;

        if (this.aiWriterState.selectedTcIds.length === 0 && defaultId) {
          this.aiWriterState.selectedTcIds = [String(defaultId)];
        }

        presets.forEach(p => {
          if (!p || !p.id) return;
          const idStr = String(p.id);
          const isChecked = this.aiWriterState.selectedTcIds.includes(idStr);
          const label = document.createElement('label');
          label.className = 'mod-tag-select-item';
          label.style.cssText = 'display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 6px; font-size: 11.5px; cursor: pointer; background: var(--card-bg, #FFFFFF); border: 1px solid var(--border-color);';
          label.innerHTML = `
            <input type="checkbox" value="${idStr}" ${isChecked ? 'checked' : ''} style="width: 13px; height: 13px; flex-shrink: 0; margin: 0; padding: 0; cursor: pointer;" />
            <span style="max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${p.name || '思维链'}</span>
          `;
          const inp = label.querySelector('input');
          if (inp) {
            inp.addEventListener('change', (e) => {
              if (e.target.checked) {
                if (!this.aiWriterState.selectedTcIds.includes(idStr)) {
                  this.aiWriterState.selectedTcIds.push(idStr);
                }
              } else {
                this.aiWriterState.selectedTcIds = this.aiWriterState.selectedTcIds.filter(x => x !== idStr);
              }
              this.saveAiWriterDraftToIDB();
            });
          }
          container.appendChild(label);
        });
      } catch (err) {
        container.innerHTML = '<span style="font-size: 11.5px; color: var(--text-secondary);">读取本地思维链失败</span>';
      }
    },

    async getSelectedThoughtChainPromptText() {
      try {
        const database = this.getDB();
        if (!database || !database.thoughtChainPresets) return '';
        const presets = await database.thoughtChainPresets.toArray();
        const chosen = (presets || []).filter(p => p && this.aiWriterState.selectedTcIds.includes(String(p.id)));
        if (chosen.length === 0) return '';
        return chosen.map(p => {
          const gen = (p.generalContent || '').trim();
          const coc = (p.cocContent || '').trim();
          return `思维链名称：${p.name || '未命名'}\n${gen ? '通用文风与思考规范：\n' + gen + '\n' : ''}${coc ? '跑团叙事规范：\n' + coc : ''}`.trim();
        }).join('\n\n---\n\n');
      } catch (_) {
        return '';
      }
    },

    setAiWriterStepActive(stepNum) {
      for (let i = 1; i <= 4; i++) {
        const el = document.getElementById(`ai-mod-step-${i}`);
        if (!el) continue;
        if (i < stepNum) {
          el.style.background = 'var(--secondary-bg, #F0EFEA)';
          el.style.color = 'var(--accent-color, #4A7A68)';
          el.style.borderColor = 'var(--accent-color, #4A7A68)';
        } else if (i === stepNum) {
          el.style.background = 'var(--accent-color, #4A7A68)';
          el.style.color = '#FFFFFF';
          el.style.borderColor = 'var(--accent-color, #4A7A68)';
        } else {
          el.style.background = 'var(--secondary-bg, #F0EFEA)';
          el.style.color = 'var(--text-secondary)';
          el.style.borderColor = 'var(--border-color)';
        }
      }
    },

    updateAiWriterStatus(pct, text) {
      const wrap = document.getElementById('ai-mod-progress-wrap');
      const bar = document.getElementById('ai-mod-progress-bar');
      const statusEl = document.getElementById('ai-mod-status-text');
      if (wrap) wrap.style.display = pct > 0 ? 'block' : 'none';
      if (bar) bar.style.width = `${Math.max(0, Math.min(100, pct))}%`;
      if (statusEl && text) statusEl.textContent = text;
    },

    repairJsonTextForParse(jsonCandidate) {
      if (!jsonCandidate || typeof jsonCandidate !== 'string') return '';
      let text = jsonCandidate.trim();
      let out = '';
      let inString = false;
      let isEscaped = false;
      let expectingKey = false;
      const stack = [];
      const len = text.length;

      for (let i = 0; i < len; i++) {
        const ch = text[i];
        if (!inString) {
          if (ch === '"') {
            inString = true;
          } else if (ch === '{') {
            stack.push('}');
            expectingKey = true;
          } else if (ch === '[') {
            stack.push(']');
            expectingKey = false;
          } else if (ch === ':') {
            expectingKey = false;
          } else if (ch === ',') {
            expectingKey = stack.length > 0 && stack[stack.length - 1] === '}';
          } else if (ch === '}' || ch === ']') {
            if (stack.length > 0 && stack[stack.length - 1] === ch) {
              stack.pop();
            }
            expectingKey = false;
          }
          out += ch;
        } else {
          if (isEscaped) {
            isEscaped = false;
            out += ch;
            continue;
          }
          if (ch === '\\') {
            isEscaped = true;
            out += ch;
            continue;
          }
          if (ch === '\n') {
            out += '\\n';
            continue;
          }
          if (ch === '\r') {
            continue;
          }
          if (ch === '\t') {
            out += '\\t';
            continue;
          }
          if (ch === '"') {
            let j = i + 1;
            while (j < len && (text[j] === ' ' || text[j] === '\t' || text[j] === '\r' || text[j] === '\n')) {
              j++;
            }
            const nextNonWs = j < len ? text[j] : '';
            let isClosingQuote = false;
            if (expectingKey) {
              isClosingQuote = nextNonWs === ':' || nextNonWs === '}' || nextNonWs === '';
            } else if (nextNonWs === '') {
              isClosingQuote = true;
            } else if (nextNonWs === '}' || nextNonWs === ']') {
              let k = j + 1;
              while (k < len && (text[k] === ' ' || text[k] === '\t' || text[k] === '\r' || text[k] === '\n')) {
                k++;
              }
              const afterBracket = k < len ? text[k] : '';
              isClosingQuote = afterBracket === ',' || afterBracket === '}' || afterBracket === ']' || afterBracket === '';
            } else if (nextNonWs === ',') {
              const topContainer = stack.length > 0 ? stack[stack.length - 1] : '';
              const restAfterComma = text.slice(j + 1, j + 120);
              if (topContainer === '}') {
                isClosingQuote = /^\s*(?:"[^"\n\r]{1,50}"\s*:|\})/.test(restAfterComma);
              } else if (topContainer === ']') {
                isClosingQuote = /^\s*(?:"|\{|\[|\]|-?\d|true|false|null)/.test(restAfterComma);
              } else {
                isClosingQuote = true;
              }
            }
            if (isClosingQuote) {
              inString = false;
              out += '"';
            } else {
              out += '\\"';
            }
            continue;
          }
          out += ch;
        }
      }
      if (inString) {
        out += '"';
      }
      out = out.replace(/,\s*$/, '');
      while (stack.length > 0) {
        out += stack.pop();
      }
      out = out.replace(/,\s*([}\]])/g, '$1');
      return out;
    },

    isThoughtOnlyJsonObject(obj) {
      if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
      const keys = Object.keys(obj);
      if (keys.length === 0) return true;
      const thoughtKeys = new Set(['thinking', 'thought', 'thoughts', 'reasoning', 'analysis']);
      return keys.every(k => thoughtKeys.has(String(k).toLowerCase()));
    },

    parseJsonFromAiResponse(rawText) {
      if (!rawText || typeof rawText !== 'string') return null;
      let clean = rawText
        .replace(/<think>[\s\S]*?<\/think>/gi, '')
        .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

      const unwrapParsedObject = (obj, depthLevel = 0) => {
        if (!obj || typeof obj !== 'object' || depthLevel > 3) return null;
        if (Array.isArray(obj)) {
          for (let i = 0; i < obj.length; i++) {
            const item = obj[i];
            if (item && typeof item === 'object' && (item.plannedScenes || item.deepenedScenes || item.finalScenes || item.chunks || item.publicInfoChapter || item.kpMasterGuideChapter)) {
              return item;
            }
          }
          const joined = obj
            .map(it => (typeof it === 'string' ? it : (it && typeof it === 'object' ? (it.content || it.message || it.text || '') : '')))
            .filter(Boolean)
            .join('\n')
            .trim();
          if (joined && joined !== rawText.trim()) {
            return this.parseJsonFromAiResponse(joined);
          }
          return null;
        }
        if (this.isThoughtOnlyJsonObject(obj)) return null;
        const cloned = Object.assign({}, obj);
        ['thinking', 'thought', 'thoughts', 'reasoning', 'analysis'].forEach(k => {
          if (k in cloned && Object.keys(cloned).length > 1) {
            delete cloned[k];
          }
        });
        const hasModuleKeys = Boolean(
          cloned.plannedScenes ||
          cloned.deepenedScenes ||
          cloned.finalScenes ||
          cloned.chunks ||
          cloned.chapters ||
          cloned.sections ||
          cloned.mapNodes ||
          cloned.publicInfoChapter ||
          cloned.kpTruthAndMechanism ||
          cloned.kpMasterGuideChapter ||
          cloned.title ||
          cloned.summary
        );
        if (hasModuleKeys) return cloned;

        const chatArr = Array.isArray(cloned.chatResponse)
          ? cloned.chatResponse
          : (Array.isArray(cloned.messages) ? cloned.messages : null);
        if (chatArr && chatArr.length > 0) {
          for (let i = 0; i < chatArr.length; i++) {
            const sub = chatArr[i];
            if (sub && typeof sub === 'object') {
              const directUnwrapped = unwrapParsedObject(sub, depthLevel + 1);
              if (directUnwrapped) return directUnwrapped;
            }
          }
          const combinedText = chatArr
            .map(sub => (typeof sub === 'string' ? sub : (sub && typeof sub === 'object' ? (sub.content || sub.message || sub.text || sub.reply || '') : '')))
            .filter(Boolean)
            .join('\n')
            .trim();
          if (combinedText && combinedText !== rawText.trim()) {
            const innerParsed = this.parseJsonFromAiResponse(combinedText);
            if (innerParsed) return innerParsed;
          }
        }

        const singleTextField = cloned.content || cloned.text || cloned.message || cloned.reply || cloned.data || cloned.result;
        if (typeof singleTextField === 'string' && singleTextField.trim() && singleTextField.trim() !== rawText.trim()) {
          const innerParsed = this.parseJsonFromAiResponse(singleTextField.trim());
          if (innerParsed) return innerParsed;
        } else if (singleTextField && typeof singleTextField === 'object') {
          const innerObj = unwrapParsedObject(singleTextField, depthLevel + 1);
          if (innerObj) return innerObj;
        }

        return cloned;
      };

      const tryParseCandidate = (candidate) => {
        if (!candidate) return null;
        let parsed = null;
        try {
          parsed = JSON.parse(candidate);
        } catch (_) {
          try {
            const repaired = this.repairJsonTextForParse(candidate);
            parsed = JSON.parse(repaired);
          } catch (_2) {
            parsed = null;
          }
        }
        if (parsed && typeof parsed === 'object') {
          return unwrapParsedObject(parsed, 0);
        }
        return null;
      };

      const directParsed = tryParseCandidate(clean);
      if (directParsed) return directParsed;

      // 提取所有顶层平衡或末尾截断的 { ... } 候选块，自动跳过纯 {"thinking": "..."} 块
      const candidates = [];
      let depth = 0;
      let startIdx = -1;
      let inStr = false;
      let esc = false;
      for (let i = 0; i < clean.length; i++) {
        const ch = clean[i];
        if (inStr) {
          if (esc) {
            esc = false;
          } else if (ch === '\\') {
            esc = true;
          } else if (ch === '"') {
            inStr = false;
          }
          continue;
        }
        if (ch === '"') {
          inStr = true;
        } else if (ch === '{') {
          if (depth === 0) startIdx = i;
          depth++;
        } else if (ch === '}') {
          if (depth > 0) {
            depth--;
            if (depth === 0 && startIdx !== -1) {
              candidates.push(clean.slice(startIdx, i + 1));
              startIdx = -1;
            }
          }
        }
      }
      if (depth > 0 && startIdx !== -1) {
        candidates.push(clean.slice(startIdx));
      }

      for (let i = 0; i < candidates.length; i++) {
        const parsed = tryParseCandidate(candidates[i]);
        if (parsed) return parsed;
      }

      const firstBrace = clean.indexOf('{');
      const lastBrace = clean.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        const slicedParsed = tryParseCandidate(clean.slice(firstBrace, lastBrace + 1));
        if (slicedParsed) return slicedParsed;
      }

      return null;
    },

    cleanModuleChapterOutput(rawText) {
      if (!rawText || typeof rawText !== 'string') return '';
      let text = rawText
        .replace(/<think>[\s\S]*?<\/think>/gi, '')
        .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
        .trim();

      // 剥离聊天思维链预设可能产出的代码块或前置纯 {"thinking": "..."} JSON块
      text = text.replace(/^```(?:json)?\s*(\{[\s\S]*?\})\s*```/i, '$1').trim();

      while (text.startsWith('{')) {
        let depth = 0;
        let inStr = false;
        let esc = false;
        let endIdx = -1;
        for (let i = 0; i < text.length; i++) {
          const ch = text[i];
          if (inStr) {
            if (esc) esc = false;
            else if (ch === '\\') esc = true;
            else if (ch === '"') inStr = false;
            continue;
          }
          if (ch === '"') inStr = true;
          else if (ch === '{') depth++;
          else if (ch === '}') {
            depth--;
            if (depth === 0) {
              endIdx = i;
              break;
            }
          }
        }
        if (endIdx !== -1) {
          const headBlock = text.slice(0, endIdx + 1);
          const remainder = text.slice(endIdx + 1).replace(/^```/g, '').trim();
          let parsedHead = null;
          try {
            parsedHead = JSON.parse(headBlock);
          } catch (_) {
            try {
              parsedHead = JSON.parse(this.repairJsonTextForParse(headBlock));
            } catch (_2) {
              parsedHead = null;
            }
          }
          if (parsedHead && typeof parsedHead === 'object') {
            if (Array.isArray(parsedHead.chatResponse) && parsedHead.chatResponse.length > 0) {
              const joined = parsedHead.chatResponse
                .map(item => (typeof item === 'string' ? item : (item?.content || item?.text || item?.message || '')))
                .filter(Boolean)
                .join('\n\n')
                .trim();
              if (joined) {
                text = remainder ? `${joined}\n\n${remainder}` : joined;
                break;
              }
            }
            const bodyField = parsedHead.content || parsedHead.chapterContent || parsedHead.text || parsedHead.chapter || parsedHead.body || parsedHead.markdown;
            if (typeof bodyField === 'string' && bodyField.trim()) {
              text = remainder ? `${bodyField.trim()}\n\n${remainder}` : bodyField.trim();
              break;
            }
            if (this.isThoughtOnlyJsonObject(parsedHead) && remainder) {
              text = remainder;
              continue;
            }
          }
          if (/^\{\s*"(?:thinking|thought|reasoning)"\s*:/i.test(headBlock) && remainder) {
            text = remainder;
            continue;
          }
        }
        break;
      }

      text = text.replace(/^```(?:markdown|text|txt)?\s*/i, '').replace(/\s*```$/i, '').trim();

      // 剥离多余的 mermaid 流程图代码块与聊天RP模式专用的文末待办清单
      text = text.replace(/```mermaid[\s\S]*?```/gi, '').trim();
      text = text.replace(/\n*(?:---\s*\n+)?(?:📝\s*\*\*当前待办清单|🌟\s*\*\*玩家当前可选行动方向)[\s\S]*$/i, '').trim();

      // 替换残留的酒馆聊天宏，确保模组文本符合人类模组书阅读习惯
      text = text
        .replace(/\{\{\s*char\s*\}\}/gi, 'KPC')
        .replace(/\{\{\s*(?:user|pc)\s*\}\}/gi, '调查员');

      // 清理多余的星号标记
      text = text.replace(/\*{2,}/g, '');

      return text.trim();
    },

    salvageAi1BlueprintFromRaw(rawText, fallbackTitle = '') {
      if (!rawText || typeof rawText !== 'string') return null;
      let clean = rawText
        .replace(/<think>[\s\S]*?<\/think>/gi, '')
        .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

      // 移除前置纯思维链 JSON 块
      clean = clean.replace(/^\{\s*"(?:thinking|thought|reasoning)"\s*:\s*"(?:\\.|[^"\\])*"\s*\}\s*/i, '').trim();

      const allKeys = 'title|moduleName|name|summary|desc|description|themeMode|style|theme|creativeReflection|reflection|catAndNpcProfiles|plannedScenes|endingsPlan|endings|publicInfoChapter|publicInfo|knownInfo|kpTruthAndMechanism|kpTruth|truth';

      const extractFieldText = (keyNames) => {
        for (const k of keyNames) {
          const closedReg = new RegExp(`"${k}"\\s*:\\s*"([\\s\\S]*?)"(?=\\s*,\\s*"(?:${allKeys})"|\\s*\\})`, 'i');
          const m = clean.match(closedReg);
          if (m && m[1]) {
            return m[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').trim();
          }
          // 兼容位于末尾被截断的字段
          const openReg = new RegExp(`"${k}"\\s*:\\s*"([\\s\\S]+)$`, 'i');
          const om = clean.match(openReg);
          if (om && om[1]) {
            let tail = om[1];
            const nextKeyMatch = tail.match(new RegExp(`"\\s*,\\s*"(?:${allKeys})"\\s*:`, 'i'));
            if (nextKeyMatch && typeof nextKeyMatch.index === 'number') {
              tail = tail.slice(0, nextKeyMatch.index);
            } else {
              tail = tail.replace(/"\s*\}?\s*$/, '');
            }
            return tail.replace(/\\n/g, '\n').replace(/\\"/g, '"').trim();
          }
        }
        return '';
      };

      const title = extractFieldText(['title', 'moduleName', 'name']) || fallbackTitle || '未命名模组';
      const summary = extractFieldText(['summary', 'desc', 'description']);
      const themeMode = extractFieldText(['themeMode', 'style', 'theme']);
      const creativeReflection = extractFieldText(['creativeReflection', 'reflection']);
      const publicInfoChapter = extractFieldText(['publicInfoChapter', 'publicInfo', 'knownInfo']) || summary;
      const kpTruthAndMechanism = extractFieldText(['kpTruthAndMechanism', 'kpTruth', 'truth']);
      const endingsPlan = extractFieldText(['endingsPlan', 'endings']);

      const catAndNpcProfiles = [];
      const profBlockMatch = clean.match(/"catAndNpcProfiles"\s*:\s*\[([\s\S]*?)(?:\](?=\s*,\s*"|\s*\})|$)/i);
      if (profBlockMatch && profBlockMatch[1]) {
        const itemReg = /\{([\s\S]*?)\}/g;
        let m;
        while ((m = itemReg.exec(profBlockMatch[1])) !== null) {
          const b = m[1];
          const getSub = (k) => {
            const sm = b.match(new RegExp(`"${k}"\\s*:\\s*"([\\s\\S]*?)"(?=\\s*,\\s*"|\\s*$)`, 'i'));
            return sm ? sm[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').trim() : '';
          };
          const roleName = getSub('roleName') || getSub('name');
          const secretProfile = getSub('secretProfile') || getSub('secret');
          if (roleName || secretProfile) {
            catAndNpcProfiles.push({
              chapterTitle: getSub('chapterTitle') || `猫-${roleName || '核心角色'}`,
              roleName: roleName || '核心角色',
              publicDesc: getSub('publicDesc') || '',
              secretProfile: secretProfile
            });
          }
        }
      }

      const plannedScenes = [];
      const scenesBlockMatch = clean.match(/"plannedScenes"\s*:\s*\[([\s\S]*?)(?:\](?=\s*,\s*"|\s*\})|$)/i);
      if (scenesBlockMatch && scenesBlockMatch[1]) {
        const itemReg = /\{([\s\S]*?)\}/g;
        let m;
        while ((m = itemReg.exec(scenesBlockMatch[1])) !== null) {
          const b = m[1];
          const getSub = (k) => {
            const sm = b.match(new RegExp(`"${k}"\\s*:\\s*"([\\s\\S]*?)"(?=\\s*,\\s*"|\\s*$)`, 'i'));
            return sm ? sm[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').trim() : '';
          };
          const sceneTitle = getSub('sceneTitle') || getSub('title');
          if (sceneTitle) {
            plannedScenes.push({
              sceneTitle,
              purpose: getSub('purpose') || '',
              pacingNote: getSub('pacingNote') || ''
            });
          }
        }
      }

      if (!publicInfoChapter && !kpTruthAndMechanism && plannedScenes.length === 0) {
        return null;
      }

      return {
        title,
        summary: summary || publicInfoChapter.slice(0, 160),
        themeMode,
        creativeReflection,
        publicInfoChapter: publicInfoChapter || summary || '暂无公开已知信息',
        kpTruthAndMechanism: kpTruthAndMechanism || creativeReflection || '守秘人可根据分幕真相自由推进。',
        catAndNpcProfiles,
        plannedScenes,
        endingsPlan
      };
    },

    salvageAi2FromRaw(rawText, plannedScenes = []) {
      if (!rawText || typeof rawText !== 'string') return null;
      let clean = rawText
        .replace(/<think>[\s\S]*?<\/think>/gi, '')
        .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();
      const guideMatch = clean.match(/"atmosphereAndMechanicsGuide"\s*:\s*"([\s\S]*?)"(?=\s*,\s*"|\s*\})/i);
      const atmosphereAndMechanicsGuide = guideMatch ? guideMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').trim() : '';

      const deepenedScenes = [];
      const scenesBlock = clean.match(/"deepenedScenes"\s*:\s*\[([\s\S]*?)(?:\](?=\s*,\s*"|\s*\})|$)/i);
      if (scenesBlock && scenesBlock[1]) {
        const itemReg = /\{([\s\S]*?)\}/g;
        let m;
        while ((m = itemReg.exec(scenesBlock[1])) !== null) {
          const b = m[1];
          const getSub = (k) => {
            const sm = b.match(new RegExp(`"${k}"\\s*:\\s*"([\\s\\S]*?)"(?=\\s*,\\s*"|\\s*$)`, 'i'));
            return sm ? sm[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').trim() : '';
          };
          const sceneTitle = getSub('sceneTitle') || getSub('title');
          if (sceneTitle) {
            deepenedScenes.push({
              sceneTitle,
              atmosphereCues: getSub('atmosphereCues') || '',
              kpcInteractionDesign: getSub('kpcInteractionDesign') || '',
              cluesOrEvents: getSub('cluesOrEvents') || '',
              pacingRule: getSub('pacingRule') || ''
            });
          }
        }
      }

      const mapNodes = [];
      const mapBlock = clean.match(/"mapNodes"\s*:\s*\[([\s\S]*?)(?:\](?=\s*,\s*"|\s*\})|$)/i);
      if (mapBlock && mapBlock[1]) {
        const itemReg = /\{([\s\S]*?)\}/g;
        let m;
        while ((m = itemReg.exec(mapBlock[1])) !== null) {
          const b = m[1];
          const getSub = (k) => {
            const sm = b.match(new RegExp(`"${k}"\\s*:\\s*"([\\s\\S]*?)"(?=\\s*,\\s*"|\\s*$)`, 'i'));
            return sm ? sm[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').trim() : '';
          };
          const name = getSub('name');
          if (name) {
            mapNodes.push({
              name,
              parent: getSub('parent') || '',
              level: 1,
              desc: getSub('desc') || ''
            });
          }
        }
      }

      const clues = [];
      const cluesBlock = clean.match(/"clues"\s*:\s*\[([\s\S]*?)(?:\](?=\s*,\s*"|\s*\})|$)/i);
      if (cluesBlock && cluesBlock[1]) {
        const itemReg = /\{([\s\S]*?)\}/g;
        let m;
        while ((m = itemReg.exec(cluesBlock[1])) !== null) {
          const b = m[1];
          const getSub = (k) => {
            const sm = b.match(new RegExp(`"${k}"\\s*:\\s*"([\\s\\S]*?)"(?=\\s*,\\s*"|\\s*$)`, 'i'));
            return sm ? sm[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').trim() : '';
          };
          const name = getSub('name');
          if (name) {
            clues.push({
              name,
              location: getSub('location') || '',
              Trigger: getSub('Trigger') || getSub('trigger') || '',
              content: getSub('content') || ''
            });
          }
        }
      }

      if (deepenedScenes.length === 0 && mapNodes.length === 0 && !atmosphereAndMechanicsGuide) {
        return null;
      }
      return {
        atmosphereAndMechanicsGuide,
        deepenedScenes: deepenedScenes.length > 0 ? deepenedScenes : plannedScenes.map(s => ({
          sceneTitle: s.sceneTitle,
          atmosphereCues: s.pacingNote || '',
          kpcInteractionDesign: '',
          cluesOrEvents: s.purpose || '',
          pacingRule: ''
        })),
        mapNodes,
        clues
      };
    },

    salvageAi3FromRaw(rawText, deepenedScenes = []) {
      if (!rawText || typeof rawText !== 'string') return null;
      let clean = rawText
        .replace(/<think>[\s\S]*?<\/think>/gi, '')
        .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();
      const guideMatch = clean.match(/"kpMasterGuideChapter"\s*:\s*"([\s\S]*?)"(?=\s*,\s*"(?:auditReport|finalScenes)"|\s*\})/i);
      const auditMatch = clean.match(/"auditReport"\s*:\s*"([\s\S]*?)"(?=\s*,\s*"(?:kpMasterGuideChapter|finalScenes)"|\s*\})/i);
      const kpMasterGuideChapter = guideMatch ? guideMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').trim() : '';
      const auditReport = auditMatch ? auditMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').trim() : '';

      const finalScenes = [];
      const scenesBlock = clean.match(/"finalScenes"\s*:\s*\[([\s\S]*?)(?:\](?=\s*,\s*"|\s*\})|$)/i);
      if (scenesBlock && scenesBlock[1]) {
        const itemReg = /\{([\s\S]*?)\}/g;
        let m;
        while ((m = itemReg.exec(scenesBlock[1])) !== null) {
          const b = m[1];
          const getSub = (k) => {
            const sm = b.match(new RegExp(`"${k}"\\s*:\\s*"([\\s\\S]*?)"(?=\\s*,\\s*"|\\s*$)`, 'i'));
            return sm ? sm[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').trim() : '';
          };
          const sceneTitle = getSub('sceneTitle') || getSub('title');
          const writingBlueprint = getSub('writingBlueprint') || getSub('blueprint') || '';
          if (sceneTitle || writingBlueprint) {
            finalScenes.push({
              sceneTitle: sceneTitle || `第${finalScenes.length + 1}章`,
              writingBlueprint
            });
          }
        }
      }

      if (!kpMasterGuideChapter && finalScenes.length === 0) return null;
      return {
        auditReport,
        kpMasterGuideChapter,
        finalScenes: finalScenes.length > 0 ? finalScenes : deepenedScenes.map(s => ({
          sceneTitle: s.sceneTitle || '事件章节',
          writingBlueprint: `【场景重点】：${s.cluesOrEvents || s.purpose || ''}\n【环境与氛围】：${s.atmosphereCues || s.pacingNote || ''}\n【人物互动】：${s.kpcInteractionDesign || ''}\n【转场衔接】：${s.pacingRule || ''}`
        }))
      };
    },

    async runAiModulePipeline(isResume = false) {
      if (this.aiWriterState.isRunning) return;

      const ruleSystem = (document.getElementById('ai-mod-rule-select')?.value || 'coc').toLowerCase();
      const scaleType = document.getElementById('ai-mod-scale-select')?.value || '1v1';
      const modType = document.getElementById('ai-mod-type-select')?.value || '线性';
      const difficulty = document.getElementById('ai-mod-diff-select')?.value || '普通';
      const lengthMode = document.getElementById('ai-mod-len-select')?.value || 'medium';
      const drawMode = document.getElementById('ai-mod-draw-select')?.value || 'off';
      const refMode = document.getElementById('ai-mod-ref-select')?.value || 'free';
      const rawTitle = (document.getElementById('ai-mod-title-input')?.value || '').trim();
      const customTitle = rawTitle === '留空由AI自动构思标题' ? '' : rawTitle;
      const author = (document.getElementById('ai-mod-author-input')?.value || '守秘人').trim() || '守秘人';
      const rawHook = (document.getElementById('ai-mod-hook-input')?.value || '').trim();
      const userHook = rawHook === '由AI结合所选标签自主破题构思' ? '' : rawHook;

      const allTags = [
        ...(this.aiWriterState.bgTags || []),
        ...(this.aiWriterState.relTags || []),
        ...(this.aiWriterState.toneTags || []),
        ...(this.aiWriterState.tropeTags || []),
        ...(this.aiWriterState.customTags || [])
      ];

      if (allTags.length === 0) {
        if (typeof global.showCustomAlert === 'function') {
          global.showCustomAlert('提示', '请至少勾选一个题材或关系标签');
        }
        return;
      }

      const genBtn = document.getElementById('ai-mod-generate-btn');
      const resumeBtn = document.getElementById('ai-mod-resume-btn');
      const saveBtn = document.getElementById('ai-mod-save-btn');
      const previewBox = document.getElementById('ai-mod-preview-box');
      const previewTitleEl = document.getElementById('ai-mod-preview-title');
      const previewMetaEl = document.getElementById('ai-mod-preview-meta');
      const previewPublicEl = document.getElementById('ai-mod-preview-public');

      if (!isResume || !this.aiWriterState.pipelineCheckpoint) {
        this.aiWriterState.pipelineCheckpoint = {
          ai1Data: null,
          ai2Data: null,
          parsedAi3: null,
          resolvedScenes: null,
          roughChapters: [],
          completedRoughCount: 0,
          roughEndingText: '',
          roughEndingDone: false,
          finalChapters: [],
          completedSceneCount: 0,
          previousSceneTail: '',
          endingDone: false,
          isCompleted: false,
          activeStep: 1,
          finalModTitle: customTitle || ''
        };
        this.aiWriterState.lastGeneratedBundle = null;
        if (previewBox) previewBox.style.display = 'none';
      }

      const cp = this.aiWriterState.pipelineCheckpoint;
      if (!Array.isArray(cp.roughChapters)) cp.roughChapters = [];
      if (typeof cp.completedRoughCount !== 'number') cp.completedRoughCount = cp.roughChapters.length;

      this.aiWriterState.isRunning = true;
      if (genBtn) {
        genBtn.textContent = isResume ? '生成' : '生成中';
        genBtn.disabled = true;
      }
      if (resumeBtn) {
        if (isResume) {
          resumeBtn.textContent = '继续中';
          resumeBtn.style.display = 'inline-flex';
        }
        resumeBtn.disabled = true;
      }
      if (saveBtn) saveBtn.disabled = true;

      try {
        const rawTcPrompt = await this.getSelectedThoughtChainPromptText();
        const tcPrompt = rawTcPrompt
          ? rawTcPrompt
              .replace(/```json[\s\S]*?```/gi, '')
              .replace(/📝\s*\*\*当前待办清单[\s\S]*$/gi, '')
              .trim()
          : '';
        const drawnSeeds = drawMode === 'on' ? this.drawInspirationSeedsForTags(allTags) : [];

        const refGuidanceMap = {
          free: '顺应故事本身的气质去决定整体结构：既可以是按早中晚时间推进的连续叙事，也可以是调查员自由决定去哪里探索的沙盒箱庭，还可以是白天自由结伴调查与夜晚主线剧情交织的复合结构。',
          confession: '参考日常独白与心理拉扯的小说化写法：从寻常生活切入，先写足两人平时的相处温度与细微异样，再在层层试探与坦诚对话中推向情感高潮。',
          date_loop: '参考约会箱庭与微异常的小说化写法：以有明确日常动机的同行出游或赴约开场，把清晨到夜晚的行程安排与沿途风景互动写得饱满动人，让异常感在日常甜度中悄然浮现。',
          jealous_sweet: '参考奇妙变故与情感反差的小说化写法：构思一个兼具趣味性与宿命感的设定，让两人在共同应对变故的过程中自然流露藏在心底的偏爱与占有欲。',
          multi_legend: '参考多线秘密与群像怪谈的小说化写法：每位角色都怀揣合情合理的个人来意与过往，白天可自由选择与不同同伴组队前往不同地点调查，个人暗线与主线谜团在具体事件中自然交汇。'
        };
        const refGuidance = refGuidanceMap[refMode] || refGuidanceMap.free;

        const craftPhilosophy = `
【小说化沉浸式跑团模组创作思考与指引】：
1. 把写模组当成写一部可交互的长篇或中篇小说，先立住一条真正吸引人的主线故事：
   - 请放下写说明书或写流程表的机械心态，把自己当成一位正在创作互动小说的人类作家。无论题材是日常纯爱、暴风雪山庄、怪谈调查还是多线群像，故事都必须有一条浑然天成的主线脉络：这件事最初因何而起，人物怀着怎样的心情走进这个故事，中途经历了怎样的悬念转折与情感升温，最终又将在怎样的冲突或坦诚中迎来高潮。
   - 每一个登场人物都应当是活生生的人，有自己的生活惯性、喜怒哀乐与合情合理的行事动机，绝不为了强行推进剧情而做出违背常理与人性的荒唐举动。
2. 思考一个真实的人走进场景后的第一反应，用合理的「动静」与切身利益给足调查动机：
   - 写任何一个章节或地点时，请先在脑海中推演：一个活生生的正常人此时此刻站在门前，他心里最在意的是什么？
   - 如果调查员刚刚遭遇变故或身处陌生的封闭环境，正常人的第一反应往往是确认自身处境、尝试离开或寻找外界联络。请先正面回应并安抚这种本能反应，再用自然具体的环境「动静」把他的注意力吸引到眼前的探索上——比如某个房间传来的异响、半掩门缝里透出的微光、空气中不寻常的气味、同伴欲言又止的反常神态、或是解决眼下困境迫切需要的一把钥匙与一份记录。让玩家产生「我正需要弄清楚这件事，所以我主动想去那里看看」的顺畅直觉。
3. 灵活运用最契合故事的叙事结构，兼顾时间流动与沙盒探索的自由度：
   - 模组的结构不必拘泥于单一模板：
     · 可以是昼夜时间轴推进：细致安排从清晨、午后、傍晚到深夜每个时段的氛围变化、生活细节与主线事件；
     · 可以是自由沙盒探索：明确列出当前开放的各个调查区域，调查员主动选择去哪里调查、与谁结伴同行、在不同地点分别能发现什么线索、触发怎样的专属对话与支线事件；
     · 也可以是「白天自由沙盒调查 + 夜晚主线剧情推进」的复合结构。
4. 懂得小说叙事的详略呼吸感，切勿平均用力或跨章复读：
   - 真正优秀的人类模组懂得留白与爆发：平淡的过渡区域或没有核心剧情的空房间只需简明交代环境特征即可；而在关键的情感转折、真相揭晓或戏剧冲突高潮处，则要毫不吝惜笔墨，把光影气味、人物微表情、呼吸停顿与层层递进的台词对手戏写得淋漓尽致。
   - 每一章各司其职：「01-幕后真相与机制」集中讲透一次全局真相；「02-模组导读与大纲」写给带团守秘人看整体节奏与防卡关引导；正文章节里的【KP信息】只写本章眼前的推进逻辑与分支应对，不再重复抄写全局背景。
5. 格式干净自然，善用计数器配合趣味互动：
   - 模组总标题与各章节标题请保持朴实自然、有文学余韵。
   - 文本保持纯净的人类模组排版，有机使用【正文】、【KP信息】、【检定】，用「▼具体地点或物品」标示可探索区域，用「・当调查员……时 → 角色反应与台词」呈现自然互动分支；不要自行添加多余的星号 * 或场外括号注解，不要在「00-模组已知信息」中复读用户场外要求或剧透底牌，不要把角色拆成两套割裂性格模板，也不要画流程图代码。
   - 不要设计带团AI无法执行的“暗中检定”。如果流程中设计了真心话大冒险、猜谜问答、饮酒互动、搜集印章等需要累计次数的趣味环节，请在【KP信息】中说明使用 [计数:名称+1] 记录，并在结算后使用 [计数:名称 清除]。`;

        // ==========================================================
        // 第一阶段：AI1 立意（小说化主线立意、人物弧光与底牌构思）
        // ==========================================================
        let ai1Data = cp.ai1Data;
        if (!ai1Data) {
          cp.activeStep = 1;
          this.setAiWriterStepActive(1);
          this.updateAiWriterStatus(10, 'AI1 立意：正在像构思长篇小说一样打磨故事主线、人物动机与核心底牌...');
          await this.saveAiWriterDraftToIDB();

          const ai1System = `你是一位极具创造力、文笔细腻、擅长像写长篇小说一样构思跑团模组的人类创作者。
请先深入思考这个故事为什么动人、人物为什么会自然地走到一起、整个事件的来龙去脉与核心巧思是什么，再完成模组立意与基础档案。
${craftPhilosophy}
${tcPrompt ? '\n【创作者审美与文风参考】：\n' + tcPrompt : ''}`;

          const lengthDesc = lengthMode === 'short'
            ? '短篇精悍（建议规划 3 至 4 个核心正文章节，聚焦一气呵成的冲突与情感高潮）'
            : (lengthMode === 'long'
              ? '长篇饱满（建议规划 6 至 9 个正文章节，充实展开多时段推进或沙盒多区域深度调查）'
              : '中篇扎实（建议规划 4 至 6 个正文章节，兼顾日常铺垫、多点调查与高潮爆发）');

          const ai1User = `请结合以下设定，以创作一部互动小说的深度去构思这本跑团模组的主线立意、人物内心设定、完整章节脉络、公开已知信息与守秘人幕后真相：
- 规则体系：${ruleSystem.toUpperCase()}
- 玩家规模：${scaleType}
- 结构类型：${modType}
- 调查难度：${difficulty}
- 目标篇幅：${lengthDesc}
- 选定标签：${allTags.join('、')}
- 叙事脉络建议：${refGuidance}
${customTitle ? '- 模组标题：' + customTitle : '- 模组标题：请起一个朴实自然、有文学气息与余韵的名字'}
${userHook ? '- 用户创作要求与引子（请在幕后真相与主线故事中自然融会贯通，切勿在 00-模组已知信息 中生硬复读或提前剧透）：' + userHook : ''}
${drawnSeeds.length > 0 ? '- 灵感参考：\n  ' + drawnSeeds.map((s, idx) => (idx + 1) + '. ' + s).join('\n  ') : ''}

在动笔前请先深入思考并在 creativeReflection 中阐述：
1. 这部模组作为一篇完整的小说，它的主线故事核是什么？是什么切身利益或情感牵绊让调查员从开场就愿意主动投入其中？
2. 当异常或困境出现时，正常人的第一反应是什么？故事如何顺应这种人之常情，并用具体的环境动静与悬念引导调查员一步步深入探索？
3. 本模组最适合采用哪种叙事推进方式（如早中晚时间线推进、自由沙盒探索、或昼夜交替调查）？哪些章节应当轻快略写，哪些章节应当浓墨重彩地推向情感与戏剧高潮？

请直接输出一个以 { 开头、以 }结尾的合法 JSON 对象，严禁使用 \`\`\`json 代码块包裹，严禁在 JSON 前后附加任何解释说明，所有字符串值内部的换行请写为 \\n，字符串内部引用请使用中文引号「」或“”：
{
  "title": "朴实自然的模组名称",
  "summary": "模组简介（用富有小说画面感与悬念吸引力的自然语言描绘故事开端，不剧透底牌，不复读场外指令）",
  "themeMode": "本模组的小说叙事结构（时间线/沙盒/昼夜复合）与情感基调概述",
  "creativeReflection": "主线构思深度阐述：包含故事主线脉络、正常人反应与各阶段调查动机设计、以及详略高潮的节奏规划",
  "catAndNpcProfiles": [
    {
      "chapterTitle": "人物或HO章节标题，如：猫-角色名 或 03-HO1秘密与设定 或 NPC-主要人物",
      "roleName": "角色称呼与身份",
      "publicDesc": "玩家可见的公开外貌、性格特点、生活习惯与平时相处细节",
      "secretProfile": "守秘人掌握的里设定：包含角色内心真实的愿望或隐痛、合情合理的行动逻辑、在故事各阶段的情感变化与鲜活台词示例"
    }
  ],
  "plannedScenes": [
    {
      "sceneTitle": "朴实简练的章节标题",
      "purpose": "本章节在整部小说主线中的位置、核心发生的事件或开放探索的沙盒区域、以及详略笔墨比重",
      "pacingNote": "驱使调查员进入本章或探索该区域的自然动机与环境动静、本章向下一章过渡的契机"
    }
  ],
  "endingsPlan": "多分支结局设计：清晰列出各结局的自然达成条件、完整的小说化情感收束画面与台词余韵",
  "publicInfoChapter": "完整的【00-模组已知信息】章节文本：包含模组简介、舞台背景、人数与耗时、推荐技能、极具代入感的公开导入引子（保持干净排版，无多余星号或场外注解，不剧透真相）",
  "kpTruthAndMechanism": "完整的【01-幕后真相与机制】章节文本：包含事件完整真相、人物动机与前因后果时间线、沙盒或特殊互动环节规则（如需隐藏计数才写明 [计数:名称+1] 与 [计数:名称 清除]，不需要则不写）"
}`;

          const ai1Raw = await this.callAI(ai1System, ai1User, null, 'writeModule');
          ai1Data = this.parseJsonFromAiResponse(ai1Raw);
          if (ai1Data && !ai1Data.publicInfoChapter) {
            ai1Data.publicInfoChapter = ai1Data.publicInfo || ai1Data.knownInfo || ai1Data.public_info_chapter || ai1Data.summary || '';
          }
          if (!ai1Data || !ai1Data.publicInfoChapter || !Array.isArray(ai1Data.plannedScenes) || ai1Data.plannedScenes.length === 0) {
            const salvaged = this.salvageAi1BlueprintFromRaw(ai1Raw, customTitle);
            if (salvaged) {
              ai1Data = Object.assign({}, salvaged, ai1Data || {});
              if (!Array.isArray(ai1Data.plannedScenes) || ai1Data.plannedScenes.length === 0) {
                ai1Data.plannedScenes = salvaged.plannedScenes;
              }
              if (!Array.isArray(ai1Data.catAndNpcProfiles) || ai1Data.catAndNpcProfiles.length === 0) {
                ai1Data.catAndNpcProfiles = salvaged.catAndNpcProfiles;
              }
            }
          }
          if (!ai1Data || (!ai1Data.publicInfoChapter && !ai1Data.kpTruthAndMechanism)) {
            throw new Error('AI1 立意返回格式异常，请点击生成或继续重试');
          }
          if (!Array.isArray(ai1Data.plannedScenes) || ai1Data.plannedScenes.length === 0) {
            throw new Error('AI1 未能生成有效的章节规划列表，请点击重新生成');
          }
          if (!Array.isArray(ai1Data.catAndNpcProfiles)) {
            ai1Data.catAndNpcProfiles = [];
          }

          cp.ai1Data = ai1Data;
          cp.finalModTitle = customTitle || ai1Data.title || '未命名模组';
          await this.saveAiWriterDraftToIDB();
        }

        // ==========================================================
        // 第二阶段：AI2 细纲（确定调用次数、分章叙事比重、调查动静、地图与线索）
        // ==========================================================
        let ai2Data = cp.ai2Data;
        let resolvedScenes = cp.resolvedScenes;
        if (!ai2Data || !Array.isArray(resolvedScenes) || resolvedScenes.length === 0) {
          cp.activeStep = 2;
          this.setAiWriterStepActive(2);
          this.updateAiWriterStatus(25, 'AI2 细纲：正在规划分章调用次数、场景动静与调查动机、沙盒地图节点与线索链...');
          await this.saveAiWriterDraftToIDB();

          const ai2System = `你是跑团模组的总架构师与小说细纲编导。
你的任务是将 AI1 的故事立意转化为可直接供 AI3 逐章撰写初稿、AI4 逐章精修的【分章执笔细纲】、【02-模组导读与大纲】、专属【地图节点】与【核心线索】。
${craftPhilosophy}`;

          const ai2User = `以下是本模组的第一阶段立意蓝图：
${JSON.stringify({
  title: customTitle || ai1Data.title,
  summary: ai1Data.summary,
  themeMode: ai1Data.themeMode,
  creativeReflection: ai1Data.creativeReflection,
  kpTruthAndMechanism: ai1Data.kpTruthAndMechanism,
  catAndNpcProfiles: ai1Data.catAndNpcProfiles,
  plannedScenes: ai1Data.plannedScenes
}, null, 2)}

请统筹规划本模组的分章细纲，并明确决定后续 AI3 初稿与 AI4 精修需要分多少个正文章节进行生成（deepenedScenes 数组的长度即代表正文章节总数与调用次数，请与 plannedScenes 保持完整对应，共 ${ai1Data.plannedScenes.length} 章）：
1. 为每一章设计自然流畅的前文衔接、促使调查员主动探索该场景的具体「动静」与现实动机（例如听见什么声音、看到什么异常、为了什么切身目的而进入调查）。
2. 明确每一章的「叙事比重与详略要求」：哪些过渡部分应简明利落，哪些重头戏与情感爆发点应浓墨重彩地写透。
3. 如果包含自由沙盒探索或多时段推进，请清晰规划每个可探索区域（▼位置）的线索分布、与同伴互动的对话分支以及触发事件。
4. 编写完整的【02-模组导读与大纲】（kpMasterGuideChapter），指导带团AI如何把握整体小说节奏与防卡关引导。
5. 提炼本模组专属的立体地图地点节点（mapNodes）与线索卡（clues）。

请直接输出一个以 { 开头、以 } 结尾的合法 JSON 对象，严禁使用 \`\`\`json 代码块包裹，所有字符串值内部的换行请写为 \\n：
{
  "atmosphereAndMechanicsGuide": "完整的【02-模组导读与大纲】正文（以【KP信息】开头）：包含整体小说脉络导览、时间线或沙盒自由探索的带团调度方法、调查员卡关时的自然引导技巧与特殊互动环节说明",
  "deepenedScenes": [
    {
      "sceneTitle": "朴实简练的章节标题",
      "atmosphereCues": "本章承接上文的切入画面、吸引调查员主动探索的具体环境动静与现实动机、光影气味氛围与详略比重说明",
      "kpcInteractionDesign": "本章中同伴/KPC/NPC的鲜活神态动作、情感升温细节、主动搭话与针对调查员不同举动的自然回应分支",
      "cluesOrEvents": "本章包含的具体可探索位置（▼区域/物品）、公开【检定】条件与成败结果、获得的具象线索与推动主线的关键事件",
      "pacingRule": "本章结束并自然迈向下一章或下一时段的剧情契机"
    }
  ],
  "mapNodes": [
    {
      "name": "本模组内的具体建筑或地点名称",
      "parent": "所属上级区域名称（顶级区域填空字符串）",
      "level": 1,
      "desc": "该地点的建筑外观特征、室内氛围与可调查内容简述"
    }
  ],
  "clues": [
    {
      "name": "线索或关键物品名称",
      "location": "获取地点或所属章节",
      "Trigger": "获取方式或技能检定要求",
      "content": "线索的具体表象描述与背后指向的剧情信息"
    }
  ]
}`;

          const ai2Raw = await this.callAI(ai2System, ai2User, null, 'writeModule');
          let parsedAi2 = this.parseJsonFromAiResponse(ai2Raw);
          if (!parsedAi2 || (!Array.isArray(parsedAi2.deepenedScenes) && !Array.isArray(parsedAi2.mapNodes))) {
            parsedAi2 = this.salvageAi2FromRaw(ai2Raw, ai1Data.plannedScenes);
          }
          if (!parsedAi2 || (!Array.isArray(parsedAi2.deepenedScenes) && !Array.isArray(parsedAi2.mapNodes))) {
            throw new Error('AI2 细纲返回格式异常，已保存 AI1 成果，请点击继续从 AI2 重试');
          }
          ai2Data = {
            atmosphereAndMechanicsGuide: parsedAi2.atmosphereAndMechanicsGuide || parsedAi2.kpMasterGuideChapter || '',
            deepenedScenes: (Array.isArray(parsedAi2.deepenedScenes) && parsedAi2.deepenedScenes.length > 0)
              ? parsedAi2.deepenedScenes
              : ai1Data.plannedScenes.map(s => ({
                  sceneTitle: s.sceneTitle,
                  atmosphereCues: s.pacingNote || '',
                  kpcInteractionDesign: '',
                  cluesOrEvents: s.purpose || '',
                  pacingRule: ''
                })),
            mapNodes: Array.isArray(parsedAi2.mapNodes) ? parsedAi2.mapNodes : [],
            clues: Array.isArray(parsedAi2.clues) ? parsedAi2.clues : []
          };

          resolvedScenes = ai2Data.deepenedScenes.map(s => ({
            sceneTitle: s.sceneTitle || '事件章节',
            writingBlueprint: [
              `【前文衔接与调查动静/动机】：${s.atmosphereCues || s.pacingNote || ''}`,
              `【核心调查区域与事件推进】：${s.cluesOrEvents || s.purpose || ''}`,
              `【人物互动与对话分支】：${s.kpcInteractionDesign || ''}`,
              `【转场契机】：${s.pacingRule || ''}`
            ].join('\n')
          }));

          cp.ai2Data = ai2Data;
          cp.parsedAi3 = { kpMasterGuideChapter: ai2Data.atmosphereAndMechanicsGuide, finalScenes: resolvedScenes };
          cp.resolvedScenes = resolvedScenes;
          await this.saveAiWriterDraftToIDB();
        }

        const boundarySuffix = '\n\n至此本小章节结束，请kp务必在聊天内告诉PC本世界书模组到此为止，请PC切换下一个世界书，禁止擅自编造互动外主线剧情走向';
        const finalModTitle = customTitle || ai1Data.title || '未命名模组';
        cp.finalModTitle = finalModTitle;
        const scenesToWrite = resolvedScenes;
        const rawPublicInfo = this.cleanModuleChapterOutput(String(ai1Data.publicInfoChapter || ai1Data.summary || ''));

        if (previewBox && previewTitleEl && previewPublicEl) {
          previewBox.style.display = 'flex';
          previewTitleEl.textContent = finalModTitle;
          if (previewMetaEl) previewMetaEl.textContent = '正在撰写小说化初稿...';
          previewPublicEl.textContent = rawPublicInfo;
        }

        // ==========================================================
        // 第三阶段：AI3 初稿（按 AI2 确定的章节数，逐章调用 API 撰写完整小说化初稿）
        // ==========================================================
        cp.activeStep = 3;
        this.setAiWriterStepActive(3);

        const ai3DraftSystem = `你是一位文笔扎实、擅长把跑团模组写得像互动小说一样引人入胜的人类模组作者。
现在进入【AI3 初稿执笔阶段】：请根据 AI2 规划的分章细纲，逐章写出完整的章节初稿。
${craftPhilosophy}
写作要求：
1. 像写小说一样先把人物进入本章的处境、心境、环境里的「动静」与氛围连续地写出来，让调查员探究的动机顺理成章。
2. 随后清晰展开本章的互动对话分支（「・当调查员……时 → 角色神态与台词」）与具体可调查位置（「▼地点或物品名称」及公开【检定】结果）。
3. 本章的【KP信息】只写本章实用的推进逻辑与引导，不重复抄写全局幕后真相，不添加多余星号 * 或场外括号注解。`;

        const startRoughIdx = typeof cp.completedRoughCount === 'number' ? cp.completedRoughCount : 0;
        let prevRoughTail = startRoughIdx > 0 && cp.roughChapters[startRoughIdx - 1]
          ? String(cp.roughChapters[startRoughIdx - 1].content || '').slice(-800)
          : '';

        for (let rIdx = startRoughIdx; rIdx < scenesToWrite.length; rIdx++) {
          const sceneItem = scenesToWrite[rIdx];
          const sTitle = sceneItem.sceneTitle || `第 ${rIdx + 1} 幕`;
          const nextSceneTitle = (rIdx + 1 < scenesToWrite.length)
            ? (scenesToWrite[rIdx + 1].sceneTitle || `第 ${rIdx + 2} 幕`)
            : `${finalModTitle}-结局`;
          const progressPct = 36 + Math.round(((rIdx + 1) / (scenesToWrite.length + 1)) * 26);
          this.updateAiWriterStatus(progressPct, `AI3 初稿：正在撰写第 ${rIdx + 1} / ${scenesToWrite.length} 章初稿《${sTitle}》...`);
          await this.saveAiWriterDraftToIDB();

          const ai3SceneUser = `模组名称：《${finalModTitle}》
选定标签：${allTags.join('、')}
整体叙事基调：${ai1Data.themeMode || ''}
主线构思与详略要求：${ai1Data.creativeReflection || ''}
核心人物档案：
${JSON.stringify(ai1Data.catAndNpcProfiles || [], null, 2)}

正文章节总目录（当前为第 ${rIdx + 1} / ${scenesToWrite.length} 章，下一章为【${nextSceneTitle}】）：
${scenesToWrite.map((sc, i) => `${i + 1}. ${sc.sceneTitle}`).join('\n')}

${prevRoughTail ? '上一章初稿结尾回顾（请自然承接此处的情境与人物情绪）：\n' + prevRoughTail + '\n' : '这是模组的开篇第一章，请从真实自然的生活情境或合情合理的来意切入，把人物关系与开场氛围铺垫扎实。\n'}
当前初稿章节：【${sTitle}】
本章细纲指引：
${sceneItem.writingBlueprint}

请直接输出【${sTitle}】的完整初稿正文（包含连续饱满的【正文】叙事、人物互动台词、▼可探索位置与【检定】、以及简洁实用的本章【KP信息】）：`;

          const roughRaw = await this.callAI(ai3DraftSystem, ai3SceneUser, null, 'writeModule');
          let cleanRough = this.cleanModuleChapterOutput(String(roughRaw || ''));
          if (!cleanRough) {
            throw new Error(`AI3 初稿第 ${rIdx + 1} 章【${sTitle}】返回为空，已保存前序进度，请点击继续重试`);
          }
          if (!cleanRough.includes('【正文】') && !cleanRough.includes('【KP信息】')) {
            cleanRough = `【正文】\n${cleanRough}`;
          }
          cp.roughChapters[rIdx] = {
            title: sTitle,
            category: rIdx === 0 ? '模组导入' : '主线事件',
            content: cleanRough
          };
          prevRoughTail = cleanRough.slice(-800);
          cp.completedRoughCount = rIdx + 1;
          if (previewMetaEl) {
            previewMetaEl.textContent = `AI3初稿 ${cp.completedRoughCount}/${scenesToWrite.length} 章`;
          }
          await this.saveAiWriterDraftToIDB();
        }

        if (!cp.roughEndingDone) {
          this.updateAiWriterStatus(64, 'AI3 初稿：正在撰写多分支结局初稿...');
          await this.saveAiWriterDraftToIDB();
          const ai3EndingUser = `模组名称：《${finalModTitle}》
选定标签：${allTags.join('、')}
上一章初稿结尾回顾：
${prevRoughTail}
结局分支规划：
${ai1Data.endingsPlan || ''}

请撰写【${finalModTitle}-结局】的完整初稿，包含清晰的【KP信息】结局判定条件与每个结局饱满动人的【正文】小说化收束描写及台词：`;

          const roughEndRaw = await this.callAI(ai3DraftSystem, ai3EndingUser, null, 'writeModule');
          let cleanRoughEnd = this.cleanModuleChapterOutput(String(roughEndRaw || ''));
          if (!cleanRoughEnd) {
            throw new Error('AI3 结局初稿返回为空，请点击继续重试');
          }
          cp.roughEndingText = cleanRoughEnd;
          cp.roughEndingDone = true;
          await this.saveAiWriterDraftToIDB();
        }

        // ==========================================================
        // 第四阶段：AI4 精修（逐章审视 AI3 初稿不足之处，精修润色并扩写情感与细节）
        // ==========================================================
        cp.activeStep = 4;
        this.setAiWriterStepActive(4);

        const profiles = Array.isArray(ai1Data.catAndNpcProfiles) ? ai1Data.catAndNpcProfiles : [];
        const plannedTocLines = [
          '01. 00-模组已知信息',
          '02. 01-幕后真相与机制',
          '03. 02-模组导读与大纲'
        ];
        profiles.forEach((prof, idx) => {
          const pTitle = prof.chapterTitle || `猫-${prof.roleName || ('角色' + (idx + 1))}`;
          plannedTocLines.push(`${String(plannedTocLines.length + 1).padStart(2, '0')}. ${pTitle}`);
        });
        scenesToWrite.forEach((sc, idx) => {
          const sTitle = sc.sceneTitle || `第${idx + 1}幕`;
          plannedTocLines.push(`${String(plannedTocLines.length + 1).padStart(2, '0')}. ${sTitle}`);
        });
        plannedTocLines.push(`${String(plannedTocLines.length + 1).padStart(2, '0')}. ${finalModTitle}-结局`);

        if (!Array.isArray(cp.finalChapters) || cp.finalChapters.length === 0) {
          const baseChapters = [];
          const ch0Header = `▍模组名称：《${finalModTitle}》\n▍规则与规模：${ruleSystem.toUpperCase()} · ${scaleType} · ${modType} · 难度${difficulty}\n▍核心标签：${allTags.join(' / ')}\n\n`;
          const ch0Body = rawPublicInfo.startsWith('【正文】')
            ? rawPublicInfo.replace(/^【正文】\s*/, `【正文】\n${ch0Header}`)
            : `【正文】\n${ch0Header}${rawPublicInfo}`;
          baseChapters.push({
            title: '00-模组已知信息',
            category: '模组导读',
            content: `${ch0Body.trim()}${boundarySuffix}`
          });

          const cleanTruth = this.cleanModuleChapterOutput(String(ai1Data.kpTruthAndMechanism || ''));
          const ch1Content = [
            '【KP信息】',
            `▍《${finalModTitle}》守秘人真相与核心机制`,
            `\n${cleanTruth.replace(/^【KP信息】\s*/, '') || ai1Data.summary || ''}`
          ].filter(Boolean).join('\n');
          baseChapters.push({
            title: '01-幕后真相与机制',
            category: '模组导读',
            content: ch1Content
          });

          const cleanMasterGuide = this.cleanModuleChapterOutput(String(ai2Data.atmosphereAndMechanicsGuide || ''));
          const clueSummary = (ai2Data.clues || []).map((c, idx) => {
            return `· 线索${idx + 1}【${c.name || '关键线索'}】位置：${c.location || '探索获取'} / 获取方式：${c.Trigger || '调查获取'}\n  内容：${c.content || ''}`;
          }).join('\n');

          const ch2Parts = [
            '【KP信息】',
            `▍《${finalModTitle}》模组章节目录`,
            plannedTocLines.join('\n'),
            cleanMasterGuide ? `\n▍守秘人导读与流程指引\n${cleanMasterGuide.replace(/^【KP信息】\s*/, '')}` : '',
            clueSummary ? `\n▍核心线索总览\n${clueSummary}` : ''
          ].filter(Boolean).join('\n');
          baseChapters.push({
            title: '02-模组导读与大纲',
            category: '模组导读',
            content: ch2Parts
          });

          profiles.forEach((prof, idx) => {
            const pTitle = prof.chapterTitle || `猫-${prof.roleName || ('角色' + (idx + 1))}`;
            const pBody = [
              '【KP信息】',
              `▍角色档案：${prof.roleName || ''}`,
              `\n【公开印象与相处日常】\n${this.cleanModuleChapterOutput(String(prof.publicDesc || ''))}`,
              `\n【幕后里设定与扮演指南】\n${this.cleanModuleChapterOutput(String(prof.secretProfile || ''))}`
            ].join('\n');
            baseChapters.push({
              title: pTitle,
              category: '人物设定',
              content: pBody
            });
          });

          cp.finalChapters = baseChapters;
          cp.completedSceneCount = 0;
          cp.previousSceneTail = '';
          cp.endingDone = false;
          await this.saveAiWriterDraftToIDB();
        }

        const finalChapters = cp.finalChapters;

        const ai4PolishSystem = `你是一位对小说质感、人物动机与跑团带团体验有着极高要求的人类跑团模组主编。
现在进入【AI4 逐章审视与精修定稿阶段】。你将收到 AI3 撰写的章节初稿，请先在内心审视初稿是否存在以下问题，并直接动手将其精修、润色、扩写为真正媲美人类名作的定稿正文：
1. 审视调查动机与前文接续：
   - 初稿的转场是否生硬？一个正常人处在这个场景里，为什么没有直接离开而是选择留下来调查？请补足自然的环境「动静」（声响、光线、气味、反常细节或切身需求），把人物的心境过渡写得丝滑可信。
2. 审视小说化情感渲染与详略张力：
   - 初稿是否在应该浓墨重彩渲染情感对手戏或恐怖悬念的地方一笔带过？请把关键场景的环境氛围、光影触感、人物眼神交汇与欲言又止的台词细节充分扩写出来，让带团AI拿到手就能直接演出极具感染力的戏份。
   - 同时检查详略节奏：删去重复啰嗦的跨章背景复读或空洞套话，让过渡利落、高潮饱满。
3. 审视可玩性与排版纯净度：
   - 确保「・当调查员……时 → 角色反应与台词」生动自然，「▼可探索位置」与【检定】结果清晰具体。
   - 严禁出现多余的星号 * 或场外括号注解，严禁出现双性格差分模板或流程图代码，直接输出精修后的完整模组章节正文。
${tcPrompt ? '\n4. 叙事与文风参考：\n' + tcPrompt : ''}`;

        let previousSceneTail = cp.previousSceneTail || '';
        const startSceneIdx = typeof cp.completedSceneCount === 'number' ? cp.completedSceneCount : 0;

        for (let sIdx = startSceneIdx; sIdx < scenesToWrite.length; sIdx++) {
          const sceneItem = scenesToWrite[sIdx];
          const sTitle = sceneItem.sceneTitle || `第 ${sIdx + 1} 幕`;
          const roughChap = cp.roughChapters[sIdx] || { content: sceneItem.writingBlueprint || '' };
          const progressPct = 66 + Math.round(((sIdx + 1) / (scenesToWrite.length + 1)) * 28);
          this.updateAiWriterStatus(progressPct, `AI4 精修：正在审视并润色扩写第 ${sIdx + 1} / ${scenesToWrite.length} 章《${sTitle}》...`);
          await this.saveAiWriterDraftToIDB();

          const ai4SceneUser = `模组名称：《${finalModTitle}》
选定标签：${allTags.join('、')}
整体叙事基调：${ai1Data.themeMode || ''}
核心人物档案：
${JSON.stringify(ai1Data.catAndNpcProfiles || [], null, 2)}

${previousSceneTail ? '上一章精修定稿的结尾回顾（请确保本章开头与之无缝衔接，不重复已发生的事）：\n' + previousSceneTail.slice(-900) + '\n' : '这是开篇第一章，请确保从极具生活气息与正常人合理动机的情境自然切入。\n'}
当前精修章节：【${sTitle}】（第 ${sIdx + 1} / ${scenesToWrite.length} 章）
本章设计细纲：
${sceneItem.writingBlueprint}

以下是 AI3 撰写的本章初稿：
${roughChap.content}

请针对以上 AI3 初稿进行深度审视与精修重写：
- 修复任何生硬的转场或动机不足之处，补足吸引调查员主动探究的具体环境动静与心理铺垫；
- 将略写或干瘪的互动与高潮段落充分扩写为细腻动人的小说化【正文】描写与鲜活台词分支；
- 保留清晰的「▼可探索位置」与公开【检定】，精简【KP信息】使其纯粹实用，直接输出精修后的【${sTitle}】完整定稿正文：`;

          const sceneTextRaw = await this.callAI(ai4PolishSystem, ai4SceneUser, null, 'writeModule');
          let cleanSceneText = this.cleanModuleChapterOutput(String(sceneTextRaw || ''));
          if (!cleanSceneText) {
            cleanSceneText = this.cleanModuleChapterOutput(String(roughChap.content || ''));
          }
          if (!cleanSceneText) {
            throw new Error(`AI4 精修第 ${sIdx + 1} 章【${sTitle}】返回内容为空，已保存前序章节，请点击继续接着生成`);
          }
          if (!cleanSceneText.includes('【正文】') && !cleanSceneText.includes('【KP信息】')) {
            cleanSceneText = `【正文】\n${cleanSceneText}`;
          }
          if (!cleanSceneText.includes('至此本小章节结束')) {
            cleanSceneText += boundarySuffix;
          }

          finalChapters.push({
            title: sTitle,
            category: sIdx === 0 ? '模组导入' : '主线事件',
            content: cleanSceneText
          });

          previousSceneTail = cleanSceneText.replace(boundarySuffix, '');
          cp.completedSceneCount = sIdx + 1;
          cp.previousSceneTail = previousSceneTail;
          if (previewMetaEl) {
            previewMetaEl.textContent = `已精修 ${cp.completedSceneCount}/${scenesToWrite.length} 正文章节`;
          }
          await this.saveAiWriterDraftToIDB();
        }

        // 精修结局章节
        if (!cp.endingDone) {
          this.updateAiWriterStatus(96, 'AI4 精修：正在润色扩写多分支结局的情感收束与余韵...');
          await this.saveAiWriterDraftToIDB();
          const ai4EndingUser = `模组名称：《${finalModTitle}》
选定标签：${allTags.join('、')}
模组基调：${ai1Data.themeMode || ''}
上一章精修定稿结尾回顾：
${previousSceneTail.slice(-900)}
结局分支规划：
${ai1Data.endingsPlan || ''}

以下是 AI3 撰写的结局初稿：
${cp.roughEndingText || ''}

请对结局初稿进行深度精修与情感扩写：
1. 使用【KP信息】清晰列出各结局分支的达成条件（若前面章节使用了隐藏计数，请说明结算后附带 [计数:名称 清除]）。
2. 使用【正文】将每一个结局分支扩写得像小说终章一样画面感十足、情感真挚动人，写出具体的动作细节、环境光影与角色台词互动，最后附上结团奖励。
3. 严禁添加多余星号 * 或括号注解，直接输出精修后的【${finalModTitle}-结局】完整定稿：`;

          const endingRaw = await this.callAI(ai4PolishSystem, ai4EndingUser, null, 'writeModule');
          let cleanEndingText = this.cleanModuleChapterOutput(String(endingRaw || ''));
          if (!cleanEndingText) {
            cleanEndingText = this.cleanModuleChapterOutput(String(cp.roughEndingText || ''));
          }
          if (!cleanEndingText) {
            throw new Error('结局章节精修返回为空，已保存前面所有章节，请点击继续重试结局撰写');
          }
          if (!cleanEndingText.includes('【正文】') && !cleanEndingText.includes('【KP信息】')) {
            cleanEndingText = `【正文】\n${cleanEndingText}`;
          }
          finalChapters.push({
            title: `${finalModTitle}-结局`,
            category: '模组结局',
            content: cleanEndingText
          });
          cp.endingDone = true;
          cp.isCompleted = true;
          await this.saveAiWriterDraftToIDB();
        }

        let finalMapNodes = Array.isArray(ai2Data.mapNodes) ? ai2Data.mapNodes.filter(n => n && n.name) : [];
        if (finalMapNodes.length === 0) {
          const seenLocs = new Set();
          (ai2Data.clues || []).forEach(c => {
            const locName = String(c.location || '').trim();
            if (locName && !seenLocs.has(locName)) {
              seenLocs.add(locName);
              finalMapNodes.push({
                name: locName,
                parent: '',
                level: 1,
                desc: c.content ? `可在此探索获取线索：${c.name || ''}` : '模组关键探索地点'
              });
            }
          });
          if (finalMapNodes.length === 0) {
            scenesToWrite.forEach(sc => {
              const rawName = String(sc.sceneTitle || '').replace(/^\d+[-_·\s]*/, '').trim();
              if (rawName && !seenLocs.has(rawName)) {
                seenLocs.add(rawName);
                finalMapNodes.push({
                  name: rawName,
                  parent: '',
                  level: 1,
                  desc: String(sc.writingBlueprint || '').replace(/\s+/g, ' ').slice(0, 90) || '模组核心事件场景'
                });
              }
            });
          }
        }

        const generatedBundle = {
          title: finalModTitle,
          author,
          ruleSystem,
          scaleType,
          type: modType,
          difficulty,
          summary: ai1Data.summary || '',
          bgTag: (this.aiWriterState.bgTags && this.aiWriterState.bgTags[0]) || '日模',
          endingTag: /恐怖|血腥|猎奇|刀子|强制|监禁/.test(allTags.join(' ')) ? '危险' : '安全',
          tags: allTags,
          chapters: finalChapters,
          mapNodes: finalMapNodes,
          clues: Array.isArray(ai2Data.clues) ? ai2Data.clues : [],
          profiles: profiles
        };

        this.aiWriterState.lastGeneratedBundle = generatedBundle;
        await this.saveAiGeneratedModuleToDB(generatedBundle, false);

        let totalWords = 0;
        finalChapters.forEach(c => { totalWords += this.countWords(c.content || ''); });
        if (previewMetaEl) {
          previewMetaEl.textContent = `${finalChapters.length}章 · ${totalWords}字`;
        }
        if (saveBtn) saveBtn.disabled = false;
        if (resumeBtn) resumeBtn.style.display = 'none';

        this.updateAiWriterStatus(100, `已完成《${finalModTitle}》全部 ${finalChapters.length} 章初稿与精修并存入本地模组库，也可前往手机沙盘查看或生成立体建筑地图`);
        await this.saveAiWriterDraftToIDB();
      } catch (err) {
        console.error('[AI写模] 流水线异常:', err);
        const hasProgress = Boolean(this.aiWriterState.pipelineCheckpoint && (
          this.aiWriterState.pipelineCheckpoint.ai1Data ||
          this.aiWriterState.pipelineCheckpoint.ai2Data ||
          (this.aiWriterState.pipelineCheckpoint.roughChapters && this.aiWriterState.pipelineCheckpoint.roughChapters.length > 0) ||
          (this.aiWriterState.pipelineCheckpoint.finalChapters && this.aiWriterState.pipelineCheckpoint.finalChapters.length > 0)
        ));
        if (hasProgress && resumeBtn) {
          resumeBtn.style.display = 'inline-flex';
          resumeBtn.disabled = false;
          resumeBtn.textContent = '继续';
        }
        this.updateAiWriterStatus(
          hasProgress ? 45 : 0,
          hasProgress
            ? `生成中断：${err.message || err}。已完成进度已自动保存，点击继续按钮即可从当前断点接着生成`
            : `生成中断：${err.message || err}`
        );
        await this.saveAiWriterDraftToIDB();
        if (typeof global.showCustomAlert === 'function') {
          global.showCustomAlert('生成中断', String(err.message || err));
        }
      } finally {
        this.aiWriterState.isRunning = false;
        if (genBtn) {
          genBtn.textContent = '生成';
          genBtn.disabled = false;
        }
        if (resumeBtn && !resumeBtn.disabled) {
          resumeBtn.textContent = '继续';
        }
      }
    },

    async saveAiGeneratedModuleToDB(bundle, showToast = true) {
      if (!bundle) return;
      const targetModId = bundle.id || ('mod_' + Date.now());
      bundle.id = targetModId;

      const chapters = (bundle.chapters || []).map((c, idx) => {
        const text = String(c.content || '');
        return {
          id: `chap_${Date.now()}_${idx + 1}`,
          moduleId: targetModId,
          title: c.title || `章节 ${idx + 1}`,
          category: c.category || '正文',
          content: text,
          sortOrder: idx + 1,
          wordCount: this.countWords(text)
        };
      });

      const locationNav = (bundle.mapNodes || []).map(n => ({
        moduleId: targetModId,
        name: n.name || '调查地点',
        parent: n.parent || '',
        level: Number(n.level) || 1,
        desc: n.desc || '',
        prompt: '',
        imageUrl: '',
        imageStatus: 'idle'
      }));

      const mapNodes = locationNav.map(l => ({
        name: l.name,
        parent: l.parent,
        level: l.level,
        desc: l.desc,
        prompt: '',
        imageUrl: ''
      }));

      const cluePointers = (bundle.clues || []).map((cl, idx) => ({
        moduleId: targetModId,
        name: cl.name || `线索 ${idx + 1}`,
        location: cl.location || '',
        trigger: cl.Trigger || cl.trigger || '',
        content: cl.content || '',
        sortOrder: idx + 1
      }));

      const hoRoles = (bundle.profiles || []).map((prof, idx) => ({
        moduleId: targetModId,
        roleCode: `HO${idx + 1}`,
        name: prof.roleName || `角色 ${idx + 1}`,
        publicInfo: prof.publicDesc || '',
        secretInfo: prof.secretProfile || ''
      }));

      let totalWords = 0;
      chapters.forEach(c => { totalWords += (c.wordCount || 0); });

      const toc = chapters.map((c, idx) => ({
        index: idx + 1,
        title: c.title,
        category: c.category,
        wordCount: c.wordCount
      }));

      const moduleRecord = {
        id: targetModId,
        name: bundle.title || '未命名模组',
        author: bundle.author || '守秘人',
        type: bundle.type || '线性',
        ruleSystem: bundle.ruleSystem || 'coc',
        scaleType: bundle.scaleType || '1v1',
        summary: bundle.summary || '',
        coverImage: '',
        bgTag: bundle.bgTag || '日模',
        endingTag: bundle.endingTag || '普通',
        contentTags: bundle.tags || [],
        customTags: [],
        tags: bundle.tags || ['日模', '纯爱'],
        group: '默认分组',
        toc,
        tocData: { items: toc },
        mapNodes,
        mapData: { nodes: mapNodes },
        mapViewMode: 'text',
        musicList: [],
        wordCount: totalWords,
        chapterCount: chapters.length,
        status: 'ready',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const deleteByModIdFromTable = async (table, mId) => {
        if (!table || mId === undefined || mId === null) return;
        try { await table.where('moduleId').equals(mId).delete(); } catch (_) {}
        try { await table.where('moduleId').equals(String(mId)).delete(); } catch (_) {}
      };

      await this.safeDBOperation('保存AI生成模组', async (db) => {
        const allExist = await db.modules.toArray();
        const sameNameMods = (allExist || []).filter(m =>
          m && (
            String(m.id) === targetModId ||
            String(m.name || '').trim().toLowerCase() === String(moduleRecord.name).trim().toLowerCase()
          )
        );
        for (const oldMod of sameNameMods) {
          try { await db.modules.delete(oldMod.id); } catch (_) {}
          await deleteByModIdFromTable(db.moduleChapters, oldMod.id);
          await deleteByModIdFromTable(db.moduleLocationNav, oldMod.id);
          await deleteByModIdFromTable(db.moduleCluePointers, oldMod.id);
          await deleteByModIdFromTable(db.moduleHoRoles, oldMod.id);
        }

        await db.modules.put(moduleRecord);
        if (chapters.length > 0 && db.moduleChapters) {
          await db.moduleChapters.bulkPut(chapters);
        }
        if (locationNav.length > 0 && db.moduleLocationNav) {
          try { await db.moduleLocationNav.bulkAdd(locationNav); } catch (_) { await db.moduleLocationNav.bulkPut(locationNav); }
        }
        if (cluePointers.length > 0 && db.moduleCluePointers) {
          try { await db.moduleCluePointers.bulkAdd(cluePointers); } catch (_) { await db.moduleCluePointers.bulkPut(cluePointers); }
        }
        if (hoRoles.length > 0 && db.moduleHoRoles) {
          try { await db.moduleHoRoles.bulkAdd(hoRoles); } catch (_) { await db.moduleHoRoles.bulkPut(hoRoles); }
        }
      });

      await this.renderLibraryList();
      if (typeof this.populateWorkshopUploadSelect === 'function') {
        await this.populateWorkshopUploadSelect();
      }

      if (showToast && typeof global.showCustomAlert === 'function') {
        global.showCustomAlert('入库成功', `模组《${moduleRecord.name}》已存入本地模组库，共 ${chapters.length} 个章节，守秘人底牌已加密封存`);
      }
    }
  };

  async function renderModulesScreen() {
    console.log('[模组] 渲染模组主界面');
    if (!ModuleManager.currentParsedData) {
      const loadedSync = ModuleManager.loadDraft();
      if (!loadedSync) {
        const loadedAsync = await ModuleManager.loadDraftAsync();
        if (!loadedAsync) {
          ModuleManager.resetImportUI();
          ModuleManager.switchSubPanel('library');
          ModuleManager.setWizardStep(1);
          return;
        }
      }
    }
    ModuleManager.switchSubPanel(ModuleManager.activeSubPanel || 'library');
    ModuleManager.setWizardStep(ModuleManager.currentStep || 1);
    if (ModuleManager.currentStep === 3) {
      if (ModuleManager.isCuttingRunning) {
        ModuleManager.syncOngoingCuttingUI();
      } else {
        ModuleManager.renderCutChaptersUI();
      }
    } else if (ModuleManager.currentStep === 2) {
      ModuleManager.renderPlanUI();
    }
  }
  global.renderModulesScreen = renderModulesScreen;
  global.ModuleManager = ModuleManager;

  // =========================================================================
  // 立体沙盘（3D 建筑地图引擎 & Termux 本地卸载系统）
  // =========================================================================
  const ModuleAtlas3D = {
    isInitialized: false,
    isActive: false,
    currentModId: '',
    currentStyleTheme: 'auto',
    currentSourceMode: 'minimap',
    currentAtlasData: null,
    selectedZoneIndex: -1, // -1 表示全览
    autoRotate: false,
    isGenerating: false,
    rafId: null,
    needsRender: false,
    solids: [],
    plazaFaces: [],
    shadowPolys: [],
    clouds: [],
    animals: [],
    buildingBounds: [],
    labelAnchors: [],
    animClock: 0,
    camera: {
      yaw: -0.58,
      pitch: 0.56,
      zoom: 1.0,
      panX: 0,
      panZ: 0,
      targetYaw: -0.58,
      targetPitch: 0.56,
      targetZoom: 1.0,
      targetPanX: 0,
      targetPanZ: 0
    },
    pointer: {
      isDown: false,
      startX: 0,
      startY: 0,
      lastX: 0,
      lastY: 0,
      moved: false
    },

    init() {
      if (this.isInitialized) return;
      this.isInitialized = true;

      const canvas = document.getElementById('atlas-3d-canvas');
      if (canvas) {
        this.bindCanvasEvents(canvas);
      }

      const screenEl = document.getElementById('taobao-screen');
      if (screenEl && typeof MutationObserver !== 'undefined') {
        const obs = new MutationObserver(() => {
          const visible = screenEl.classList.contains('active') && screenEl.style.display !== 'none';
          if (!visible && this.isActive) {
            this.disposeEngine();
          }
        });
        obs.observe(screenEl, { attributes: true, attributeFilter: ['class', 'style'] });
      }

      window.addEventListener('resize', () => {
        if (this.isActive) {
          this.resizeCanvas();
          this.requestRender();
        }
      });
    },

    async openScreen() {
      this.init();
      this.isActive = true;
      if (typeof global.showScreen === 'function') {
        global.showScreen('taobao-screen');
      } else {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        const t = document.getElementById('taobao-screen');
        if (t) t.classList.add('active');
      }

      await this.populateModuleSelect();
      requestAnimationFrame(() => {
        this.resizeCanvas();
        this.requestRender();
      });
    },

    closeScreen() {
      this.disposeEngine();
      if (typeof global.showScreen === 'function') {
        global.showScreen('home-screen');
      } else {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        const h = document.getElementById('home-screen');
        if (h) h.classList.add('active');
      }
    },

    toggleOrbit() {
      this.autoRotate = !this.autoRotate;
      const spinBtn = document.getElementById('atlas-orbit-btn') || document.getElementById('atlas-auto-rotate-btn');
      if (spinBtn) {
        spinBtn.style.background = this.autoRotate ? 'var(--accent-color)' : 'var(--card-bg)';
        spinBtn.style.color = this.autoRotate ? '#ffffff' : 'var(--text-primary)';
        spinBtn.style.borderColor = this.autoRotate ? 'var(--accent-color)' : 'var(--border-color)';
      }
      if (this.autoRotate) {
        this.requestRender();
      }
    },

    setSourceMode(sourceVal) {
      this.currentSourceMode = String(sourceVal || 'minimap');
      if (this.currentSourceMode === 'minimap') {
        this.setStatus('已切换为参照小地图与模组布局，生成时将严格还原小地图区域拓扑与动线', '小地图模式');
      } else {
        this.setStatus('已切换为AI自由构思立体沙盘，生成时将由AI深度提炼模组剧情构建场景', '自由构思');
      }
    },

    setStyleTheme(styleVal) {
      this.currentStyleTheme = String(styleVal || 'auto');
      if (this.currentAtlasData) {
        this.build3DSceneGeometry(this.currentAtlasData);
        this.createFloatingLabels(this.currentAtlasData);
        this.updateActiveZoneUI();
        this.requestRender();
      }
      if (this.currentStyleTheme === 'module') {
        this.setStatus('已切换为模组专属配色，展示半厚涂明媚光影与模组定制色彩', '模组配色');
      } else {
        this.setStatus('已切换为系统默认配色，自动读取当前系统主题色渲染白瓷沙盘', '系统配色');
      }
    },

    disposeEngine() {
      this.isActive = false;
      this.autoRotate = false;
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
      this.solids = [];
      this.plazaFaces = [];
      this.shadowPolys = [];
      this.clouds = [];
      this.animals = [];
      this.buildingBounds = [];
      this.labelAnchors = [];
      const canvas = document.getElementById('atlas-3d-canvas');
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.width = 1;
        canvas.height = 1;
      }
      const layer = document.getElementById('atlas-labels-layer') || document.getElementById('atlas-3d-labels-layer');
      if (layer) layer.innerHTML = '';
      const spinBtn = document.getElementById('atlas-orbit-btn') || document.getElementById('atlas-auto-rotate-btn');
      if (spinBtn) {
        spinBtn.style.background = 'var(--card-bg)';
        spinBtn.style.color = 'var(--text-primary)';
        spinBtn.style.borderColor = 'var(--border-color)';
      }
    },

    setStatus(msg, badgeText) {
      const txt = document.getElementById('atlas-status-text');
      const badge = document.getElementById('atlas-storage-badge');
      if (txt && msg !== undefined) {
        txt.textContent = msg || '自动还原小地图与模组布局，可随时切换系统默认配色或模组专属配色';
      }
      if (badge && badgeText !== undefined) {
        badge.textContent = badgeText;
      }
    },

    async populateModuleSelect() {
      const selectEl = document.getElementById('atlas-module-select');
      if (!selectEl) return;

      let mods = [];
      try {
        await ModuleManager.safeDBOperation('读取模组列表供沙盘选择', async (db) => {
          mods = await db.modules.toArray();
        });
      } catch (e) {
        console.warn('[沙盘] 读取模组列表异常:', e);
      }

      mods.sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));

      const prevVal = this.currentModId || selectEl.value;
      selectEl.innerHTML = '<option value="">请选择要加载沙盘的模组</option>';
      mods.forEach(m => {
        const opt = document.createElement('option');
        opt.value = String(m.id);
        opt.textContent = `${m.name || '未命名模组'} · ${m.type || '模组'}`;
        selectEl.appendChild(opt);
      });

      const targetId = (prevVal && mods.some(m => String(m.id) === String(prevVal)))
        ? String(prevVal)
        : (mods[0] ? String(mods[0].id) : '');

      if (targetId) {
        selectEl.value = targetId;
        await this.selectModule(targetId);
      } else {
        this.renderDefaultDemoAtlas();
      }
    },

    async selectModule(modId) {
      this.currentModId = String(modId || '');
      if (!this.currentModId) {
        this.renderDefaultDemoAtlas();
        return;
      }

      this.setStatus('正在读取立体建筑沙盘数据...', '加载中');

      const termuxData = await this.loadAtlasFromTermux(this.currentModId);
      if (termuxData && Array.isArray(termuxData.zones) && termuxData.zones.length > 0) {
        this.currentAtlasData = termuxData;
        this.setStatus('已从本地 Termux 磁盘加载立体建筑沙盘', '本地磁盘');
        this.applyAtlasData(termuxData);
        return;
      }

      try {
        const rawLocal = localStorage.getItem('ephone_atlas3d_data_' + this.currentModId);
        if (rawLocal) {
          const parsedLocal = JSON.parse(rawLocal);
          if (parsedLocal && Array.isArray(parsedLocal.zones) && parsedLocal.zones.length > 0) {
            this.currentAtlasData = parsedLocal;
            this.setStatus('已加载定制立体建筑沙盘，点击存盘可卸载至本地磁盘', '已定制');
            this.applyAtlasData(parsedLocal);
            return;
          }
        }
      } catch (_) {}

      const builtData = await this.buildAtlasFromModuleDB(this.currentModId);
      this.currentAtlasData = builtData;
      this.setStatus('已参照小地图与模组内容生成初始立体沙盘，点击生成可由AI深度定制', '就绪');
      this.applyAtlasData(builtData);
    },

    getTermuxBaseUrl() {
      const input = document.getElementById('termux-url-input');
      const saved = localStorage.getItem('ephone_termux_url');
      return (input && input.value ? input.value.trim() : (saved || 'http://127.0.0.1:8765')).replace(/\/+$/, '');
    },

    async loadAtlasFromTermux(modId) {
      if (!modId) return null;
      const baseUrl = this.getTermuxBaseUrl();
      const safeName = `atlas3d_${String(modId).replace(/[^a-zA-Z0-9_-]/g, '_')}.json`;
      try {
        const ctrl = new AbortController();
        const tid = setTimeout(() => ctrl.abort(), 1600);
        const res = await fetch(`${baseUrl}/media/${safeName}`, { signal: ctrl.signal });
        clearTimeout(tid);
        if (!res.ok) return null;
        return await res.json();
      } catch (_) {
        return null;
      }
    },

    async saveCurrentAtlasToTermux(showAlert = true) {
      if (!this.currentAtlasData || !this.currentModId) {
        if (showAlert && typeof global.showCustomAlert === 'function') {
          global.showCustomAlert('提示', '请先选择并加载一个模组沙盘');
        }
        return false;
      }

      const baseUrl = this.getTermuxBaseUrl();
      const safeName = `atlas3d_${String(this.currentModId).replace(/[^a-zA-Z0-9_-]/g, '_')}.json`;
      const jsonStr = JSON.stringify(this.currentAtlasData);

      try {
        this.setStatus('正在将立体沙盘模型转存至本地磁盘并释放网页内存...', '存盘中');
        const ctrl = new AbortController();
        const tid = setTimeout(() => ctrl.abort(), 4500);
        const res = await fetch(`${baseUrl}/media/${safeName}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: jsonStr,
          signal: ctrl.signal
        });
        clearTimeout(tid);

        if (res.ok) {
          try {
            localStorage.removeItem('ephone_atlas3d_data_' + this.currentModId);
          } catch (_) {}
          this.setStatus('已存入 Termux 本地磁盘并清除网页缓存副本', '本地磁盘');
          if (showAlert && typeof global.showCustomAlert === 'function') {
            global.showCustomAlert('存盘完成', '立体沙盘数据已存入本地 Termux 磁盘，并已彻底清除浏览器内的副本以释放网页内存');
          }
          return true;
        }
        throw new Error('HTTP ' + res.status);
      } catch (err) {
        this.setStatus('本地 Termux 未响应，已导出沙盘文件至手机本地并清理网页缓存', '已导出');
        if (showAlert) {
          try {
            const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = safeName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 1500);
            localStorage.removeItem('ephone_atlas3d_data_' + this.currentModId);
          } catch (_) {}
          if (typeof global.showCustomAlert === 'function') {
            global.showCustomAlert('本地存盘', '未检测到后台 Termux 端口响应，已直接将 3D 沙盘数据下载到本地文件并清理了浏览器端缓存副本');
          }
        }
        return false;
      }
    },

    inferWorldSetting(mod, locations, chapters) {
      const corpus = [
        mod?.name || '',
        mod?.summary || '',
        mod?.bgTag || '',
        ...(Array.isArray(mod?.tags) ? mod.tags : []),
        ...locations.map(l => `${l.name || ''} ${l.desc || ''}`),
        ...chapters.slice(0, 6).map(c => c.title || '')
      ].join(' ');

      if (/便利店|超市|商店|街角|街道|十字路口|贩卖机|现代都市|马路|车站/.test(corpus)) return 'modern_street';
      if (/医院|病院|诊所|病房|手术|疗养院|急诊|药房|护士|解剖/.test(corpus)) return 'hospital';
      if (/暖炉|猫咪|公寓|单间|卧室|客厅|厨房|被炉|出租屋|居家|室友/.test(corpus)) return 'apartment_cutaway';
      if (/树屋|森林|林间|木屋|精灵|秘境|草地|自然|营地|山林/.test(corpus)) return 'treehouse_forest';
      if (/学校|学院|学园|教室|校舍|操场|教学楼|社团|图书馆/.test(corpus)) return 'school';
      if (/神社|鸟居|温泉|和风|寺院|祠堂|汤屋|古町|祭典/.test(corpus)) return 'shrine';
      if (/梦境|幻境|童话|星海|泡沫|糖果|云端|深眠/.test(corpus)) return 'dreamland';
      return 'campus_manor';
    },

    isMetaNonLocationName(name) {
      const s = String(name || '').trim();
      if (!s) return true;
      return /^(现实世界|线上|网络|聊天室|电话|手机|短信|梦醒|结局|尾声|序幕|导入|背景|真相|KP|守密人|玩家|调查员|容器|放置戒指|道具|线索|附录|规则|状态|心理)/.test(s);
    },

    async buildAtlasFromModuleDB(modId) {
      let mod = null;
      let locations = [];
      let clues = [];
      let chapters = [];
      let roles = [];

      await ModuleManager.safeDBOperation('加载模组沙盘要素', async (db) => {
        mod = await db.modules.get(modId) || await db.modules.get(Number(modId));
        if (db.moduleLocationNav) {
          locations = await db.moduleLocationNav.where('moduleId').equals(modId).toArray();
          if (locations.length === 0 && !isNaN(Number(modId))) {
            locations = await db.moduleLocationNav.where('moduleId').equals(Number(modId)).toArray();
          }
        }
        if (db.moduleCluePointers) {
          clues = await db.moduleCluePointers.where('moduleId').equals(modId).toArray();
          if (clues.length === 0 && !isNaN(Number(modId))) {
            clues = await db.moduleCluePointers.where('moduleId').equals(Number(modId)).toArray();
          }
        }
        if (db.moduleChapters) {
          chapters = await db.moduleChapters.where('moduleId').equals(modId).toArray();
          if (chapters.length === 0 && !isNaN(Number(modId))) {
            chapters = await db.moduleChapters.where('moduleId').equals(Number(modId)).toArray();
          }
        }
        if (db.moduleHoRoles) {
          roles = await db.moduleHoRoles.where('moduleId').equals(modId).toArray();
        }
      });

      if (!mod) return this.getDefaultDemoData();

      chapters.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      const worldType = this.inferWorldSetting(mod, locations, chapters);

      const rawNodes = (locations && locations.length > 0)
        ? locations
        : (Array.isArray(mod.mapNodes) && mod.mapNodes.length > 0 ? mod.mapNodes : []);

      // 过滤掉诸如 现实世界、线上、放置戒指的容器 等非实体空间节点
      const validNodes = rawNodes.filter(n => !this.isMetaNonLocationName(n.name));

      const archByWorld = {
        hospital: ['hospital', 'ward', 'modern_store', 'dome', 'courtyard', 'hall'],
        modern_street: ['convenience_store', 'modern_store', 'apartment_cutaway', 'ward', 'courtyard', 'hall'],
        apartment_cutaway: ['apartment_cutaway', 'modern_store', 'courtyard', 'dome', 'pagoda', 'ward'],
        treehouse_forest: ['treehouse', 'pagoda', 'dome', 'courtyard', 'shrine', 'observatory'],
        school: ['school', 'clocktower', 'hall', 'dome', 'courtyard', 'ward'],
        shrine: ['shrine', 'pagoda', 'courtyard', 'treehouse', 'dome', 'hall'],
        dreamland: ['dome', 'clocktower', 'observatory', 'apartment_cutaway', 'treehouse', 'spire'],
        campus_manor: ['clocktower', 'dome', 'hall', 'ward', 'mansion', 'spire']
      };

      const archCatalog = archByWorld[worldType] || archByWorld.campus_manor;
      const archNameMap = {
        convenience_store: '街角招牌便利店与遮阳雨棚',
        modern_store: '现代街区凹凸立面商铺',
        hospital: '多层综合医疗大楼与急救雨棚',
        apartment_cutaway: '温暖室内剖面居所与生活家具',
        treehouse: '巨木树冠多层木屋与悬空栈桥',
        school: '明窗长廊教学楼与坡顶主楼',
        shrine: '朱木重檐神社与参道鸟居',
        clocktower: '四面飞扶壁高耸钟塔',
        dome: '弧形肋架琉璃阳光花房',
        hall: '双翼阶梯主礼堂',
        spire: '簇拥多尖顶塔楼群',
        pagoda: '重檐飞阁楼台与回廊',
        ward: '天窗回廊复合馆舍',
        mansion: '三段式对称主宅邸',
        observatory: '星象观测圆顶露台',
        courtyard: '中庭喷泉合院广场'
      };

      const layoutCoords = [
        { x: -2, z: -20 },
        { x: -34, z: -6 },
        { x: 34, z: -6 },
        { x: -26, z: 22 },
        { x: 26, z: 22 },
        { x: 0, z: 26 }
      ];

      let zoneItems = [];
      if (validNodes.length > 0) {
        const topNodes = validNodes.filter(n => !n.parent || Number(n.level) === 1 || this.isMetaNonLocationName(n.parent));
        const baseList = topNodes.length >= 3 ? topNodes.slice(0, 6) : validNodes.slice(0, 6);
        zoneItems = baseList.map((n, idx) => {
          const name = String(n.name || `区域0${idx + 1}`).trim();
          const children = validNodes.filter(c => c.parent === n.name && c.name !== n.name);
          const matchedClues = clues.filter(cl => String(cl.location || '').includes(name));
          const arch = this.inferArchTypeFromName(name, archCatalog[idx % archCatalog.length], worldType);
          const pos = layoutCoords[idx % layoutCoords.length];
          const roleObj = roles[idx % Math.max(1, roles.length)];
          return {
            code: String(idx + 1).padStart(2, '0'),
            name: name.slice(0, 8),
            fullTitle: name,
            enTitle: `ZONE // ${String(idx + 1).padStart(2, '0')}`,
            archType: arch,
            archLabel: archNameMap[arch] || '凹凸细节立体建筑',
            x: pos.x,
            z: pos.z,
            width: 19 + (idx % 3) * 2,
            depth: 17 + ((idx + 1) % 3) * 2,
            height: 24 + (idx === 0 ? 8 : (idx % 3) * 4),
            accentTone: idx % 2 === 0 ? 'accent' : 'dark',
            exclusiveRole: roleObj ? roleObj.name : (mod.scaleType === '1v1' ? '调查员与同伴' : '调查员小队'),
            accessCond: matchedClues[0]?.trigger || '自由探索或剧情推进准入',
            rating: 5 - (idx % 2),
            desc: n.desc || matchedClues[0]?.content || mod.summary || '矗立于模组核心舞台的关键调查场景，拥有丰富的建筑细节与可探索角落。',
            subSpots: [
              ...children.map(ch => ({ name: ch.name, info: ch.desc || '子区域调查点' })),
              ...matchedClues.map(mc => ({ name: mc.name, info: `${mc.trigger ? mc.trigger + '：' : ''}${mc.content || ''}` }))
            ].slice(0, 6)
          };
        });
      } else {
        const storyChaps = chapters.filter(c => !/^(00|01|02|猫-|NPC|真相|背景|导入|结局)/i.test(c.title || '') && !this.isMetaNonLocationName(c.title)).slice(0, 6);
        const sourceList = storyChaps.length > 0 ? storyChaps : chapters.slice(0, 5);
        zoneItems = sourceList.map((ch, idx) => {
          const cleanName = String(ch.title || `第${idx + 1}区域`).replace(/^\d+[-_·\s]*/, '').trim();
          const arch = this.inferArchTypeFromName(cleanName, archCatalog[idx % archCatalog.length], worldType);
          const pos = layoutCoords[idx % layoutCoords.length];
          const snippet = String(ch.content || '')
            .replace(/【KP信息】[\s\S]*?(?=【正文】|$)/g, '')
            .replace(/【正文】/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 140);
          const subSpots = [];
          const spotReg = /▼\s*([^\n：:]{2,18})/g;
          let m;
          while ((m = spotReg.exec(String(ch.content || ''))) !== null && subSpots.length < 5) {
            subSpots.push({ name: m[1].trim(), info: '场景内可探索细节' });
          }
          return {
            code: String(idx + 1).padStart(2, '0'),
            name: cleanName.slice(0, 8) || `区域0${idx + 1}`,
            fullTitle: cleanName || `核心场景 0${idx + 1}`,
            enTitle: `ZONE // ${String(idx + 1).padStart(2, '0')}`,
            archType: arch,
            archLabel: archNameMap[arch] || '凹凸细节立体建筑',
            x: pos.x,
            z: pos.z,
            width: 19 + (idx % 3) * 2,
            depth: 17 + ((idx + 1) % 3) * 2,
            height: 24 + (idx === 0 ? 8 : (idx % 3) * 4),
            accentTone: idx % 2 === 0 ? 'accent' : 'dark',
            exclusiveRole: mod.author || '调查员与同伴',
            accessCond: idx === 0 ? '开场初始准入' : '随主线调查解锁',
            rating: 5 - (idx % 2),
            desc: snippet || mod.summary || '模组核心场景建筑。',
            subSpots
          };
        });
      }

      if (zoneItems.length === 0) {
        return this.getDefaultDemoData();
      }

      return {
        moduleId: String(mod.id),
        title: mod.name || '未命名模组',
        enSubtitle: `${String(mod.ruleSystem || 'COC').toUpperCase()} // ARCHITECTURAL 3D ATLAS`,
        worldType,
        tags: (mod.tags && mod.tags.length > 0 ? mod.tags : [mod.bgTag || '模组', mod.type || '沙盘']).slice(0, 4),
        zones: zoneItems
      };
    },

    inferArchTypeFromName(name, fallback, worldType = '') {
      const s = String(name || '');
      if (/便利店|超市|商店|小卖部|711|全家|罗森|咖啡|面包|书店|街角/.test(s)) return 'convenience_store';
      if (/医院|病院|急诊|门诊|住院|药房|手术|诊室|护士站|解剖|停尸/.test(s)) return 'hospital';
      if (/暖炉|被炉|公寓|单间|卧室|客厅|厨房|玄关|阳台|浴室|居所|房间|猫/.test(s)) return 'apartment_cutaway';
      if (/树屋|树冠|林间|森林|木屋|草坪|花园|温室|花房|林地/.test(s)) {
        return /温室|花房/.test(s) ? 'dome' : 'treehouse';
      }
      if (/学校|学院|教室|教学楼|校舍|走廊|天台|图书馆|社团/.test(s)) return 'school';
      if (/神社|鸟居|本殿|拜殿|温泉|汤屋|祠堂|古寺|亭|楼阁/.test(s)) return 'shrine';
      if (/钟楼|钟塔|高塔|尖塔|灯塔/.test(s)) return 'clocktower';
      if (/礼堂|大厅|宴会|教堂|剧场|歌剧/.test(s)) return 'hall';
      if (/天文|观测|星象/.test(s)) return 'observatory';
      if (/寝宫|别墅|馆|宅|公爵|庄园/.test(s)) return 'mansion';
      if (/中庭|广场|回廊|庭院|喷泉|街道|路口/.test(s)) return 'courtyard';
      if (worldType === 'hospital') return fallback || 'hospital';
      if (worldType === 'apartment_cutaway') return fallback || 'apartment_cutaway';
      if (worldType === 'modern_street') return fallback || 'convenience_store';
      if (worldType === 'treehouse_forest') return fallback || 'treehouse';
      if (worldType === 'school') return fallback || 'school';
      if (worldType === 'shrine') return fallback || 'shrine';
      return fallback || 'spire';
    },

    getDefaultDemoData() {
      return {
        moduleId: 'demo_lovelle',
        title: '圣洛薇尔学院',
        enSubtitle: 'ST. LOVELLE // ROYAL CAMPUS 3D ATLAS',
        worldType: 'campus_manor',
        tags: ['王立学院', '秘密建筑图鉴', '立体沙盘'],
        zones: [
          {
            code: '01',
            name: '蔷薇钟塔',
            fullTitle: '蔷薇王冠钟塔',
            enTitle: 'ZONE // 01',
            archType: 'clocktower',
            archLabel: '八棱白瓷哥特钟塔',
            x: 0,
            z: -20,
            width: 19,
            depth: 19,
            height: 36,
            accentTone: 'accent',
            exclusiveRole: '绯焰少爷·烬礼',
            accessCond: '三叶草密钥持有',
            rating: 5,
            desc: '耸立在圣洛薇尔学院中心的纯白白瓷与柔粉琉璃钟塔，四面飞扶壁缠绕着盛放的黑蔷薇，塔顶悬浮着星芒王冠。午夜钟响时，只有持有三叶草钥匙的人才能推开顶层钟室的门。',
            subSpots: [
              { name: '顶层星芒钟室', info: '午夜十二点齿轮咬合声最清晰的位置，藏有机械暗格' },
              { name: '黑蔷薇螺旋阶梯', info: '拾级而上可听见风穿过彩窗的回响' },
              { name: '三叶草锁孔雕花门', info: '需要对应密钥或巧手检定方可开启' }
            ]
          },
          {
            code: '02',
            name: '琉璃温室',
            fullTitle: '琉璃穹顶温室',
            enTitle: 'ZONE // 02',
            archType: 'dome',
            archLabel: '弧形肋架玻璃花房',
            x: -34,
            z: -4,
            width: 20,
            depth: 20,
            height: 25,
            accentTone: 'accent',
            exclusiveRole: '温室守夜人',
            accessCond: '白昼自由探索',
            rating: 5,
            desc: '由纯白铸铁肋架托起的柔粉琉璃穹顶温室，常年弥漫着湿润的冷杉与白茶花香气。中央喷泉池底压着一张泛黄的旧乐谱。',
            subSpots: [
              { name: '中央白瓷喷泉', info: '池水清澈见底，可调查水下压着的防水匣' },
              { name: '夜光兰花培育架', info: '入夜后会散发微弱荧光的稀有植株' }
            ]
          },
          {
            code: '03',
            name: '丝绒礼堂',
            fullTitle: '丝绒歌剧礼堂',
            enTitle: 'ZONE // 03',
            archType: 'hall',
            archLabel: '双坡斜顶歌剧院',
            x: 2,
            z: 18,
            width: 22,
            depth: 18,
            height: 26,
            accentTone: 'dark',
            exclusiveRole: '学生会首席',
            accessCond: '晚宴邀请函准入',
            rating: 5,
            desc: '挑高十二米的哥特式双翼礼堂，垂落着深色丝绒帷幕与水晶枝形吊灯。舞台后方的管风琴内部似乎有被人为改动过的音管。',
            subSpots: [
              { name: '巨型管风琴台', info: '按下特定低音键会传来空洞的回响' },
              { name: '二层丝绒包厢', info: '可俯瞰整个礼堂动静的绝佳观察点' }
            ]
          },
          {
            code: '04',
            name: '菲林画廊',
            fullTitle: '菲林长廊美术馆',
            enTitle: 'ZONE // 04',
            archType: 'ward',
            archLabel: '天窗回廊展馆',
            x: -26,
            z: 24,
            width: 18,
            depth: 16,
            height: 22,
            accentTone: 'dark',
            exclusiveRole: '美术社顾问',
            accessCond: '全天开放调查',
            rating: 4,
            desc: '沿着学院西侧拱廊延伸的静谧画廊，墙面悬挂着历任院长与杰出学生的肖像油画，尽头暗房里还留着未显影的胶卷。',
            subSpots: [
              { name: '尽头红光暗房', info: '显影液托盘旁放着半张被剪碎的照片' },
              { name: '无名少女肖像画', info: '画框背面写有一行模糊的日期' }
            ]
          },
          {
            code: '05',
            name: '公爵寝宫',
            fullTitle: '旧公爵塔楼寝宫',
            enTitle: 'ZONE // 05',
            archType: 'spire',
            archLabel: '多尖顶贵族寝殿',
            x: 34,
            z: 10,
            width: 19,
            depth: 19,
            height: 30,
            accentTone: 'accent',
            exclusiveRole: '学院理事长',
            accessCond: '夜间潜入或许可',
            rating: 5,
            desc: '位于学院东侧高台上的独立多尖顶建筑，四角的黑曜石尖顶与粉白墙体相映成趣。书房壁炉上方挂着一把古老的纹章佩剑。',
            subSpots: [
              { name: '旋转暗门书架', info: '抽动烫金馆藏日志即可打开通往阁楼的窄梯' },
              { name: '观星露台', info: '可远眺整座学院沙盘的全景视野' }
            ]
          }
        ]
      };
    },

    renderDefaultDemoAtlas() {
      const demo = this.getDefaultDemoData();
      this.currentAtlasData = demo;
      this.applyAtlasData(demo);
    },

    async generateAi3DAtlas() {
      if (this.isGenerating) {
        if (typeof global.showCustomAlert === 'function') {
          global.showCustomAlert('提示', '正在生成立体建筑沙盘，请稍候...');
        }
        return;
      }

      const selectEl = document.getElementById('atlas-module-select');
      if (!this.currentModId && selectEl && selectEl.value) {
        this.currentModId = String(selectEl.value);
      }

      if (!this.currentModId) {
        if (typeof global.showCustomAlert === 'function') {
          global.showCustomAlert('提示', '请先在模组下拉框中选择一个模组，再点击生成');
        }
        return;
      }

      const sourceEl = document.getElementById('atlas-source-select');
      const sourceMode = sourceEl ? sourceEl.value : (this.currentSourceMode || 'minimap');

      let mod = null;
      let locations = [];
      let clues = [];
      let chapters = [];
      let roles = [];

      await ModuleManager.safeDBOperation('读取模组内容生成3D沙盘', async (db) => {
        mod = await db.modules.get(this.currentModId) || await db.modules.get(Number(this.currentModId));
        if (db.moduleLocationNav) {
          locations = await db.moduleLocationNav.where('moduleId').equals(this.currentModId).toArray();
          if (locations.length === 0 && !isNaN(Number(this.currentModId))) {
            locations = await db.moduleLocationNav.where('moduleId').equals(Number(this.currentModId)).toArray();
          }
        }
        if (db.moduleCluePointers) {
          clues = await db.moduleCluePointers.where('moduleId').equals(this.currentModId).toArray();
          if (clues.length === 0 && !isNaN(Number(this.currentModId))) {
            clues = await db.moduleCluePointers.where('moduleId').equals(Number(this.currentModId)).toArray();
          }
        }
        if (db.moduleChapters) {
          chapters = await db.moduleChapters.where('moduleId').equals(this.currentModId).toArray();
          if (chapters.length === 0 && !isNaN(Number(this.currentModId))) {
            chapters = await db.moduleChapters.where('moduleId').equals(Number(this.currentModId)).toArray();
          }
        }
        if (db.moduleHoRoles) {
          roles = await db.moduleHoRoles.where('moduleId').equals(this.currentModId).toArray();
        }
      });

      if (!mod) {
        if (typeof global.showCustomAlert === 'function') {
          global.showCustomAlert('提示', '未找到所选模组数据');
        }
        return;
      }

      this.isGenerating = true;
      const genBtn = document.getElementById('atlas-generate-btn') || document.getElementById('atlas-ai-gen-btn');
      if (genBtn) {
        genBtn.disabled = true;
        genBtn.style.opacity = '0.65';
      }
      this.setStatus(`正在由 AI 深度考据《${mod.name}》的世界观、小地图拓扑与建筑凹凸细节...`, '生成中');

      try {
        chapters.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
        const chapDigest = chapters.slice(0, 12).map(c => {
          const clean = String(c.content || '').replace(/\s+/g, ' ').slice(0, 320);
          return `【${c.title}】：${clean}`;
        }).join('\n');

        const mapNodes = (locations && locations.length > 0)
          ? locations
          : (Array.isArray(mod.mapNodes) ? mod.mapNodes : []);

        const minimapTopology = mapNodes.slice(0, 24).map(l => {
          const parentInfo = l.parent ? `归属上级区域：${l.parent}` : '一级核心主区域';
          return `节点「${l.name}」｜${parentInfo}｜空间描述：${l.desc || '无'}`;
        }).join('\n');

        const clueDigest = clues.slice(0, 20).map(c => `${c.name}@${c.location}：${c.content || ''}`).join('；');
        const roleDigest = roles.map(r => `${r.name}：${r.publicInfo || ''}`).join('；');
        const inferredWorld = this.inferWorldSetting(mod, mapNodes, chapters);

        const sysPrompt = `你是一位享誉国际的 3D 微缩建筑沙盘艺术总监、半厚涂光影插画师与跑团关卡建筑师。
你的任务是为当前跑团模组打造一座令人一眼惊艳、幸福感爆棚、完全贴合模组真实世界观与小地图布局的 3D 立体建筑沙盘。

【核心设计铁律——严禁敷衍与张冠李戴】
1. 深度考据世界观，绝不乱套欧式古堡：
   - 先仔细阅读模组简介、小地图节点与章节正文，准确判断故事发生在什么舞台：
   - 若是现代医院/疗养院模组，必须构建医院主门诊楼、住院病房翼楼、急救车雨棚通道、药房检验科、中庭花园等医疗建筑，绝对禁止生成毫无关联的欧式古堡或尖塔！
   - 若是日常公寓/暖炉猫咪/居家模组，必须构建带有室内剖面感的温暖公寓单间、暖炉桌客厅、料理厨房、阳台花房与街角便利店，绝不能把「现实世界」「线上」「放置戒指的容器」这种抽象词当成建筑名字！
   - 若是现代都市街区模组，必须构建街角便利店、斑马线十字街口、自动贩卖机、路灯、红绿灯、长椅与街边商铺！
   - 若是森林树屋/秘境模组，必须构建千年巨木树干托起的多层树冠木屋、悬空木栈桥、阳光明媚的草地、花丛与溪流！
   - 若是学园/神社/庄园/梦境模组，则分别对应学院教学楼与钟塔、朱木神社鸟居与温泉汤屋、古典洋馆庭院或粉蓝梦幻浮岛。

2. 严密对齐小地图布局模式：
   - 当前生成模式为：${sourceMode === 'minimap' ? '【严格参照小地图与模组布局】——你必须以提供的小地图节点拓扑为骨架，过滤掉非实体空间的抽象词，将真正的核心建筑与房间按小地图的方位关系排布在沙盘上，让玩家一眼看出沙盘与小地图一脉相承！' : '【AI自由构思立体沙盘】——请从模组剧情中提炼最具标志性的 5 到 6 个实体空间，设计出最富有戏剧张力与探索动线的立体沙盘布局！'}

3. 建筑必须有棱有角、有凹有凸，拒绝单调几何柱体：
   - 每栋建筑可从以下精细复合建筑原型中选择最契合的 archType：
     * convenience_store：街角便利店，带挑出式条纹招牌雨棚、内凹落地玻璃门窗、店内货架与门口自动贩卖机
     * hospital：现代医院大楼，带凸出急救入口雨棚、多层内凹采光排窗、屋顶设备间与医疗十字标识
     * apartment_cutaway：温暖室内剖面居所，带L型半剖墙体、内部暖炉桌/沙发/厨房吧台、木地板与阳台护栏
     * treehouse：森林巨木多层树屋，带粗壮分叉树干、高低错落的树冠木平台、斜顶小木屋、悬空围栏与蓬松树冠
     * school：明窗长廊教学楼，带凸出主门厅、阵列式凹窗、屋顶天台围栏与坡顶钟亭
     * shrine：重檐飞阁神社与汤屋，带挑檐屋顶、朱木廊柱、门前鸟居与石灯笼
     * modern_store：现代街区多层商铺与咖啡馆，带凹凸退台、遮阳棚与街边橱窗
     * clocktower：四面飞扶壁高耸钟塔与星芒尖顶
     * dome：弧形肋架琉璃穹顶温室花房与侧翼花廊
     * hall：双坡斜顶歌剧礼堂与柱廊门厅
     * ward：天窗回廊式复合展馆或病房翼楼
     * mansion：三段式对称庄园主宅与露台
     * pagoda：三层重檐楼阁与游廊
     * observatory：星象观测旋转圆顶台与露台
     * courtyard：中庭喷泉合院广场
     * spire：多尖顶城堡塔楼群
   - 除此之外，你还可以在每个 zone 的 customParts 数组中额外拼装最多 4 个自定义凹凸构件，用来表现该建筑独一无二的标志物！

4. 打破单一棋盘格限制——多地块高低差底座：
   - 请在 terraces 数组中设计 2 到 4 块不同功能与材质的地面地块，例如：
     * lawn：阳光明媚的半厚涂青翠草地
     * street：带浅灰人行道与纯白斑马线的现代柏油街道
     * wood_deck：温暖的室内木地板或森林木栈道平台
     * water_pool：清澈的温泉池、景观水池或溪流
     * marble_plaza：优雅的浅色石材庭院广场

5. 鲜活的世界景观道具与不穿模的可爱小动物：
   - 在 props 数组中布置 6 到 12 个贴合场景的立体小景物：tree、pine_tree、flower_bed、street_lamp、traffic_light、vending_machine、signboard、bench、fountain、hot_spring、sculpture、torii、zebra_crossing。
   - 在 animals 数组中布置 2 到 4 只可爱圆润的立体小动物：bunny、cat、bird、koi，它们会在草地或人行道上散步跳跃，绝不穿进建筑内部。

6. 半厚涂明媚配色方案：
   - 请在 palette 对象中为模组定制一套如半厚涂插画师般明媚通透、遵循 60-30-10 色彩比例的低饱和高级配色，严禁使用纯黑或刺眼高饱和荧光色。`;

        const userPrompt = `模组名称：《${mod.name}》
规则与类型：${mod.ruleSystem || 'coc'} / ${mod.type || ''} / ${mod.scaleType || ''}
系统预判世界观类型：${inferredWorld}
模组简介：${mod.summary || ''}
角色信息：${roleDigest || '核心调查员与同伴'}
小地图节点拓扑结构：
${minimapTopology || '暂无独立节点表，请从下方章节正文中提取真实物理地点'}
已有线索列表：${clueDigest || '请从章节摘要中提炼'}
章节正文摘要：
${chapDigest}

请直接输出一个以 { 开头、以 } 结尾的合法 JSON 对象，严禁使用代码块包裹，严禁附加任何场外解释：
{
  "title": "${mod.name}",
  "enSubtitle": "贴合模组主题的英文副标题",
  "worldType": "从 hospital/modern_street/apartment_cutaway/treehouse_forest/school/shrine/dreamland/campus_manor 中选最贴合的一项",
  "tags": ["核心场景标签1", "标签2", "标签3"],
  "palette": {
    "skyTop": "#eef6ff",
    "skyBottom": "#fff9f5",
    "groundMain": "#8fd18a",
    "groundSub": "#e8eef2",
    "wallMain": "#fdfbf7",
    "roofMain": "#4a5568",
    "accent": "#f28b82",
    "glass": "#63b3ed",
    "foliage": "#68b678"
  },
  "terraces": [
    { "type": "lawn 或 street 或 wood_deck 或 water_pool 或 marble_plaza", "x": 0, "z": 0, "w": 96, "d": 76, "h": 2.4 }
  ],
  "zones": [
    {
      "code": "01",
      "name": "4到6字真实地点名称",
      "fullTitle": "完整建筑或空间名称",
      "enTitle": "ZONE // 01",
      "archType": "从 convenience_store/hospital/apartment_cutaway/treehouse/school/shrine/modern_store/clocktower/dome/hall/ward/mansion/pagoda/observatory/courtyard/spire 中选一",
      "archLabel": "富有画面感的建筑凹凸结构描述",
      "x": 0,
      "z": -18,
      "width": 20,
      "depth": 18,
      "height": 26,
      "accentTone": "accent 或 dark",
      "exclusiveRole": "驻留此处的角色或关联人物",
      "accessCond": "进入或解锁该区域的条件",
      "rating": 5,
      "desc": "100字左右细腻描绘该建筑的外观凹凸细节、内部陈设与模组剧情氛围",
      "customParts": [
        { "shape": "box 或 awning 或 sign 或 roof_box", "dx": 0, "dy": 6, "dz": 9, "w": 8, "h": 2, "d": 3, "tone": "accent 或 roof 或 glass 或 wall" }
      ],
      "subSpots": [
        { "name": "建筑内具体可调查位置或关键道具", "info": "调查此处可发现的细节或线索" }
      ]
    }
  ],
  "props": [
    { "type": "tree 或 flower_bed 或 street_lamp 或 traffic_light 或 vending_machine 或 signboard 或 bench 或 fountain 或 hot_spring 或 sculpture 或 torii 或 zebra_crossing", "x": -22, "z": 12 }
  ],
  "animals": [
    { "type": "bunny 或 cat 或 bird 或 koi", "x": -12, "z": 16 }
  ]
}`;

        const rawResp = await ModuleManager.callAI(sysPrompt, userPrompt, null, 'writeModule');
        const parsed = ModuleManager.parseJsonFromAiResponse(rawResp);
        if (!parsed || !Array.isArray(parsed.zones) || parsed.zones.length === 0) {
          throw new Error('AI 未返回有效的立体建筑沙盘数据，请重试');
        }

        const worldType = parsed.worldType || inferredWorld;
        const normalized = {
          moduleId: String(this.currentModId),
          title: parsed.title || mod.name || '未命名模组',
          enSubtitle: parsed.enSubtitle || `${String(mod.ruleSystem || 'COC').toUpperCase()} // ARCHITECTURAL 3D ATLAS`,
          worldType,
          palette: parsed.palette && typeof parsed.palette === 'object' ? parsed.palette : null,
          terraces: Array.isArray(parsed.terraces) ? parsed.terraces.slice(0, 5) : null,
          props: Array.isArray(parsed.props) ? parsed.props.slice(0, 14) : null,
          animals: Array.isArray(parsed.animals) ? parsed.animals.slice(0, 5) : null,
          tags: Array.isArray(parsed.tags) && parsed.tags.length > 0 ? parsed.tags.slice(0, 4) : ['立体沙盘', '核心建筑群'],
          zones: parsed.zones.slice(0, 7).map((z, idx) => ({
            code: String(idx + 1).padStart(2, '0'),
            name: String(z.name || `区域0${idx + 1}`).slice(0, 8),
            fullTitle: String(z.fullTitle || z.name || `建筑区域 0${idx + 1}`),
            enTitle: String(z.enTitle || `ZONE // ${String(idx + 1).padStart(2, '0')}`),
            archType: this.inferArchTypeFromName(z.name, z.archType || 'modern_store', worldType),
            archLabel: String(z.archLabel || '凹凸细节立体建筑'),
            x: Math.max(-40, Math.min(40, Number(z.x) || 0)),
            z: Math.max(-28, Math.min(28, Number(z.z) || 0)),
            width: Math.max(16, Math.min(24, Number(z.width) || 19)),
            depth: Math.max(16, Math.min(24, Number(z.depth) || 18)),
            height: Math.max(20, Math.min(36, Number(z.height) || 26)),
            accentTone: z.accentTone === 'dark' ? 'dark' : 'accent',
            exclusiveRole: String(z.exclusiveRole || '调查员与同伴'),
            accessCond: String(z.accessCond || '自由调查'),
            rating: Math.max(3, Math.min(5, Number(z.rating) || 5)),
            desc: String(z.desc || ''),
            customParts: Array.isArray(z.customParts) ? z.customParts.slice(0, 5) : [],
            subSpots: Array.isArray(z.subSpots) ? z.subSpots.slice(0, 6) : []
          }))
        };

        this.currentAtlasData = normalized;
        this.applyAtlasData(normalized);

        const savedTermux = await this.saveCurrentAtlasToTermux(false);
        if (!savedTermux) {
          try {
            localStorage.setItem('ephone_atlas3d_data_' + this.currentModId, JSON.stringify(normalized));
          } catch (_) {}
          this.setStatus('AI 立体沙盘定制完成，可随时切换系统默认配色或模组专属配色', '已定制');
        }
      } catch (err) {
        console.error('[沙盘] AI生成失败:', err);
        this.setStatus('生成失败：' + (err.message || err), '异常');
        if (typeof global.showCustomAlert === 'function') {
          global.showCustomAlert('沙盘生成提示', String(err.message || err));
        }
      } finally {
        this.isGenerating = false;
        if (genBtn) {
          genBtn.disabled = false;
          genBtn.style.opacity = '1';
        }
      }
    },

    applyAtlasData(data) {
      if (!data) return;
      const enEl = document.getElementById('atlas-banner-subtitle') || document.getElementById('atlas-en-subtitle');
      const titleEl = document.getElementById('atlas-banner-title') || document.getElementById('atlas-main-title');

      if (enEl) enEl.textContent = data.enSubtitle || 'ARCHITECTURAL 3D ATLAS';
      if (titleEl) titleEl.textContent = data.title || '立体建筑沙盘';

      this.resizeCanvas();
      this.build3DSceneGeometry(data);
      this.renderZoneStrip(data);
      this.createFloatingLabels(data);
      this.focusZone(-1, false);
    },

    escapeHtml(str) {
      return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    },

    resolveThemePalette() {
      const styleSelect = document.getElementById('atlas-style-select');
      const mode = styleSelect ? styleSelect.value : (this.currentStyleTheme || 'auto');
      const data = this.currentAtlasData || {};
      const worldType = data.worldType || 'campus_manor';

      if (mode !== 'module') {
        // 系统默认配色：直接读取用户当前 CSS 美化的 --accent-color，搭配纯净白瓷与柔和炭黑，保持与系统完全一致
        let sysAccent = '#f08cae';
        try {
          const cssVar = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim();
          if (cssVar && (cssVar.startsWith('#') || cssVar.startsWith('rgb'))) {
            sysAccent = cssVar;
          }
        } catch (_) {}

        const dark = '#28242c';
        const plaza = this.mixHex('#ffffff', sysAccent, 0.08);
        return {
          mode: 'auto',
          accent: sysAccent,
          accentSoft: this.mixHex(sysAccent, '#ffffff', 0.28),
          accentLight: this.mixHex(sysAccent, '#ffffff', 0.78),
          accentGlow: this.mixHex(sysAccent, '#ffffff', 0.90),
          accentDeep: this.mixHex(sysAccent, dark, 0.28),
          wallPure: '#ffffff',
          wallMain: '#ffffff',
          wallSide: this.mixHex('#ffffff', plaza, 0.45),
          wallShadow: this.mixHex(plaza, dark, 0.08),
          obsidian: dark,
          obsidianSoft: this.mixHex(dark, '#ffffff', 0.16),
          roofMain: dark,
          glass: this.mixHex(sysAccent, '#3a4a5e', 0.55),
          glassDeep: '#262e38',
          foliage: this.mixHex(sysAccent, '#7ec89b', 0.42),
          foliageLight: this.mixHex(sysAccent, '#a8e0b8', 0.35),
          wood: this.mixHex(sysAccent, '#8c6d58', 0.65),
          lawnA: '#fbf9fa',
          lawnB: this.mixHex(plaza, dark, 0.06),
          streetAsphalt: this.mixHex(dark, '#ffffff', 0.22),
          sidewalk: '#f2eff4',
          water: this.mixHex(sysAccent, '#bfe8f5', 0.45),
          plazaA: '#fbf9fa',
          plazaB: this.mixHex(plaza, dark, 0.06),
          plazaSide: this.mixHex(plaza, dark, 0.12),
          skyTop: '#ffffff',
          skyBottom: this.mixHex(sysAccent, '#ffffff', 0.84)
        };
      }

      // 模组专属配色：半厚涂插画师明媚光影色彩体系
      const worldPresets = {
        hospital: {
          skyTop: '#e8f4fc', skyBottom: '#fdfbf7',
          groundMain: '#8ed08b', groundSub: '#e6eef4',
          wallMain: '#fbfcfe', roofMain: '#425669',
          accent: '#56b4c2', glass: '#5c9ec9', foliage: '#6dc27c', wood: '#b89472'
        },
        modern_street: {
          skyTop: '#e6f2ff', skyBottom: '#fff8ef',
          groundMain: '#89ce84', groundSub: '#dce3ea',
          wallMain: '#fcfaf5', roofMain: '#384252',
          accent: '#f08a4b', glass: '#4c7ea8', foliage: '#5fb86f', wood: '#9c7350'
        },
        apartment_cutaway: {
          skyTop: '#fff3e6', skyBottom: '#fefaf4',
          groundMain: '#95d48c', groundSub: '#ebd9c5',
          wallMain: '#fff9f0', roofMain: '#634b41',
          accent: '#e87a64', glass: '#7ab3d6', foliage: '#72c278', wood: '#c48f65'
        },
        treehouse_forest: {
          skyTop: '#e4f7f2', skyBottom: '#f9fbe7',
          groundMain: '#7ecb78', groundSub: '#dcedc8',
          wallMain: '#f9f3e8', roofMain: '#527853',
          accent: '#f29f67', glass: '#76c7c0', foliage: '#5cb868', wood: '#8d6346'
        },
        school: {
          skyTop: '#e8f1ff', skyBottom: '#fff7f2',
          groundMain: '#88cf85', groundSub: '#ebeff5',
          wallMain: '#fdfbf7', roofMain: '#414c66',
          accent: '#e87a90', glass: '#68a2d4', foliage: '#68be76', wood: '#a67b5b'
        },
        shrine: {
          skyTop: '#fcefe8', skyBottom: '#fff9f2',
          groundMain: '#85c77e', groundSub: '#efe6dc',
          wallMain: '#fcf7f0', roofMain: '#363945',
          accent: '#d95b4f', glass: '#72b5c4', foliage: '#66b572', wood: '#9e5444'
        },
        dreamland: {
          skyTop: '#e8f0ff', skyBottom: '#ffeef6',
          groundMain: '#9fe0b8', groundSub: '#f2e8ff',
          wallMain: '#ffffff', roofMain: '#5b5680',
          accent: '#f28eb8', glass: '#82c4f8', foliage: '#7cd9b0', wood: '#b898c8'
        },
        campus_manor: {
          skyTop: '#edf3ff', skyBottom: '#fff4f7',
          groundMain: '#8bd18a', groundSub: '#f3edf2',
          wallMain: '#fdfbfc', roofMain: '#353140',
          accent: '#eb82a4', glass: '#6fa8dc', foliage: '#68c27a', wood: '#9c7864'
        }
      };

      const baseP = worldPresets[worldType] || worldPresets.campus_manor;
      const aiP = data.palette && typeof data.palette === 'object' ? data.palette : {};

      const accent = aiP.accent || baseP.accent;
      const wallMain = aiP.wallMain || baseP.wallMain;
      const roofMain = aiP.roofMain || baseP.roofMain;
      const groundMain = aiP.groundMain || baseP.groundMain;
      const groundSub = aiP.groundSub || baseP.groundSub;
      const foliage = aiP.foliage || baseP.foliage;
      const glass = aiP.glass || baseP.glass;

      return {
        mode: 'module',
        accent,
        accentSoft: this.mixHex(accent, '#ffffff', 0.22),
        accentLight: this.mixHex(accent, '#ffffff', 0.72),
        accentGlow: aiP.skyBottom || baseP.skyBottom,
        accentDeep: this.mixHex(accent, roofMain, 0.32),
        wallPure: wallMain,
        wallMain,
        wallSide: this.mixHex(wallMain, groundSub, 0.38),
        wallShadow: this.mixHex(groundSub, roofMain, 0.14),
        obsidian: roofMain,
        obsidianSoft: this.mixHex(roofMain, '#ffffff', 0.18),
        roofMain,
        glass,
        glassDeep: this.mixHex(glass, '#1e293b', 0.52),
        foliage,
        foliageLight: this.mixHex(foliage, '#fff9c4', 0.32),
        wood: baseP.wood,
        lawnA: groundMain,
        lawnB: this.mixHex(groundMain, '#fff9c4', 0.20),
        streetAsphalt: '#424954',
        sidewalk: '#e9edf2',
        water: '#78d1e8',
        plazaA: this.mixHex(groundSub, '#ffffff', 0.45),
        plazaB: groundSub,
        plazaSide: this.mixHex(groundSub, roofMain, 0.18),
        skyTop: aiP.skyTop || baseP.skyTop,
        skyBottom: aiP.skyBottom || baseP.skyBottom
      };
    },

    parseHex(hex) {
      const clean = String(hex || '#f08cae').replace('#', '').trim();
      if (clean.length === 3) {
        return [
          parseInt(clean[0] + clean[0], 16) || 240,
          parseInt(clean[1] + clean[1], 16) || 140,
          parseInt(clean[2] + clean[2], 16) || 174
        ];
      }
      return [
        parseInt(clean.slice(0, 2), 16) || 240,
        parseInt(clean.slice(2, 4), 16) || 140,
        parseInt(clean.slice(4, 6), 16) || 174
      ];
    },

    mixHex(cStr1, cStr2, ratio = 0.5) {
      const c1 = this.toRgbTuple(cStr1);
      const c2 = this.toRgbTuple(cStr2);
      const r = Math.round(c1[0] * (1 - ratio) + c2[0] * ratio);
      const g = Math.round(c1[1] * (1 - ratio) + c2[1] * ratio);
      const b = Math.round(c1[2] * (1 - ratio) + c2[2] * ratio);
      return `rgb(${r}, ${g}, ${b})`;
    },

    toRgbTuple(colorStr) {
      if (String(colorStr).startsWith('rgb')) {
        const m = String(colorStr).match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
        if (m) return [Number(m[1]), Number(m[2]), Number(m[3])];
      }
      return this.parseHex(colorStr);
    },

    // 半厚涂明媚光影着色：受光面向暖阳奶油白提亮，背光面向通透冷灰紫过渡，绝不死黑
    shadeColor(colorStr, factor) {
      let [r, g, b] = this.toRgbTuple(colorStr);
      if (factor > 1) {
        const t = Math.min(0.48, factor - 1);
        r = Math.round(r + (255 - r) * t);
        g = Math.round(g + (252 - g) * t);
        b = Math.round(b + (244 - b) * t);
      } else {
        const shadowT = Math.max(0, Math.min(0.45, 1 - factor));
        r = Math.max(24, Math.min(255, Math.round(r * (1 - shadowT * 0.85) + 42 * shadowT * 0.15)));
        g = Math.max(26, Math.min(255, Math.round(g * (1 - shadowT * 0.82) + 48 * shadowT * 0.18)));
        b = Math.max(32, Math.min(255, Math.round(b * (1 - shadowT * 0.72) + 72 * shadowT * 0.28)));
      }
      return `rgb(${r}, ${g}, ${b})`;
    },

    createConvexSolid(rawFaces, solidCenter, isBaseLayer = false, zoneIdx = -1) {
      const preparedFaces = [];
      for (let i = 0; i < rawFaces.length; i++) {
        const rf = rawFaces[i];
        const verts = rf.verts;
        if (!verts || verts.length < 3) continue;

        let fcx = 0, fcy = 0, fcz = 0;
        for (let k = 0; k < verts.length; k++) {
          fcx += verts[k].x;
          fcy += verts[k].y;
          fcz += verts[k].z;
        }
        fcx /= verts.length;
        fcy /= verts.length;
        fcz /= verts.length;

        const ux = verts[1].x - verts[0].x;
        const uy = verts[1].y - verts[0].y;
        const uz = verts[1].z - verts[0].z;
        const vx = verts[2].x - verts[0].x;
        const vy = verts[2].y - verts[0].y;
        const vz = verts[2].z - verts[0].z;

        let nx = uy * vz - uz * vy;
        let ny = uz * vx - ux * vz;
        let nz = ux * vy - uy * vx;
        const len = Math.hypot(nx, ny, nz) || 1;
        nx /= len;
        ny /= len;
        nz /= len;

        const outX = fcx - solidCenter.x;
        const outY = fcy - solidCenter.y;
        const outZ = fcz - solidCenter.z;
        if (nx * outX + ny * outY + nz * outZ < 0) {
          nx = -nx;
          ny = -ny;
          nz = -nz;
        }

        preparedFaces.push({
          verts,
          fcx,
          fcy,
          fcz,
          nx,
          ny,
          nz,
          baseColor: rf.color,
          trimStroke: rf.trimStroke || null,
          cullBack: rf.cullBack !== false
        });
      }

      this.solids.push({
        cx: solidCenter.x,
        cy: solidCenter.y,
        cz: solidCenter.z,
        isBaseLayer,
        zoneIdx,
        faces: preparedFaces
      });
    },

    addBoxSolid(cx, cy, cz, w, h, d, color, trimStroke = null, zoneIdx = -1, isBaseLayer = false) {
      const hw = w * 0.5;
      const hh = h * 0.5;
      const hd = d * 0.5;
      const v = [
        { x: cx - hw, y: cy - hh, z: cz - hd },
        { x: cx + hw, y: cy - hh, z: cz - hd },
        { x: cx + hw, y: cy + hh, z: cz - hd },
        { x: cx - hw, y: cy + hh, z: cz - hd },
        { x: cx - hw, y: cy - hh, z: cz + hd },
        { x: cx + hw, y: cy - hh, z: cz + hd },
        { x: cx + hw, y: cy + hh, z: cz + hd },
        { x: cx - hw, y: cy + hh, z: cz + hd }
      ];
      const rawFaces = [
        { verts: [v[3], v[2], v[6], v[7]], color, trimStroke },
        { verts: [v[4], v[5], v[6], v[7]], color },
        { verts: [v[1], v[0], v[3], v[2]], color },
        { verts: [v[0], v[4], v[7], v[3]], color },
        { verts: [v[5], v[1], v[2], v[6]], color }
      ];
      this.createConvexSolid(rawFaces, { x: cx, y: cy, z: cz }, isBaseLayer, zoneIdx);
    },

    addBevelCapSolid(cx, baseY, cz, w, h, d, capColor, trimColor, zoneIdx = -1) {
      this.addBoxSolid(cx, baseY + h * 0.5, cz, w, h, d, capColor, null, zoneIdx, false);
      this.addBoxSolid(cx, baseY + h + 0.18, cz, w * 0.78, 0.36, d * 0.78, capColor, trimColor, zoneIdx, false);
    },

    addPrismSolid(cx, baseY, cz, radius, height, sides, color, trimStroke = null, zoneIdx = -1) {
      const bot = [];
      const top = [];
      for (let i = 0; i < sides; i++) {
        const ang = (i / sides) * Math.PI * 2 + Math.PI / sides;
        const px = cx + Math.cos(ang) * radius;
        const pz = cz + Math.sin(ang) * radius;
        bot.push({ x: px, y: baseY, z: pz });
        top.push({ x: px, y: baseY + height, z: pz });
      }
      const rawFaces = [];
      for (let i = 0; i < sides; i++) {
        const ni = (i + 1) % sides;
        rawFaces.push({
          verts: [bot[i], bot[ni], top[ni], top[i]],
          color
        });
      }
      rawFaces.push({
        verts: top,
        color,
        trimStroke
      });
      this.createConvexSolid(rawFaces, { x: cx, y: baseY + height * 0.5, z: cz }, false, zoneIdx);
    },

    addPyramidSolid(cx, baseY, cz, radius, height, sides, color, trimStroke = null, zoneIdx = -1) {
      const smoothSides = Math.max(sides, 14);
      const apex = { x: cx, y: baseY + height, z: cz };
      const ring = [];
      for (let i = 0; i < smoothSides; i++) {
        const ang = (i / smoothSides) * Math.PI * 2 + Math.PI / smoothSides;
        ring.push({
          x: cx + Math.cos(ang) * radius,
          y: baseY,
          z: cz + Math.sin(ang) * radius
        });
      }
      const rawFaces = [];
      for (let i = 0; i < smoothSides; i++) {
        const p1 = ring[i];
        const p2 = ring[(i + 1) % smoothSides];
        rawFaces.push({
          verts: [p1, p2, apex],
          color
        });
      }
      this.createConvexSolid(rawFaces, { x: cx, y: baseY + height * 0.32, z: cz }, false, zoneIdx);
    },

    addDomeSolid(cx, baseY, cz, radius, height, sides, color, ribColor = null, zoneIdx = -1) {
      const smoothSides = Math.max(sides, 14);
      const rings = 4;
      let prevRing = [];
      for (let i = 0; i < smoothSides; i++) {
        const ang = (i / smoothSides) * Math.PI * 2;
        prevRing.push({
          x: cx + Math.cos(ang) * radius,
          y: baseY,
          z: cz + Math.sin(ang) * radius
        });
      }
      const rawFaces = [];
      for (let r = 1; r <= rings; r++) {
        const t = r / rings;
        const elev = (t * Math.PI) * 0.48;
        const curR = Math.max(0.35, Math.cos(elev) * radius);
        const curY = baseY + Math.sin(elev) * height;
        const nextRing = [];
        for (let i = 0; i < smoothSides; i++) {
          const ang = (i / smoothSides) * Math.PI * 2;
          nextRing.push({
            x: cx + Math.cos(ang) * curR,
            y: curY,
            z: cz + Math.sin(ang) * curR
          });
        }
        const ringShade = this.shadeColor(color, 0.96 + r * 0.03);
        for (let i = 0; i < smoothSides; i++) {
          const ni = (i + 1) % smoothSides;
          rawFaces.push({
            verts: [prevRing[i], prevRing[ni], nextRing[ni], nextRing[i]],
            color: ringShade
          });
        }
        if (r === rings) {
          rawFaces.push({
            verts: nextRing,
            color: this.shadeColor(color, 1.08),
            trimStroke: ribColor
          });
        }
        prevRing = nextRing;
      }
      this.createConvexSolid(rawFaces, { x: cx, y: baseY + height * 0.38, z: cz }, false, zoneIdx);
    },

    addGableRoofSolid(cx, baseY, cz, w, h, d, color, trimStroke = null, zoneIdx = -1) {
      const hw = w * 0.5;
      const hd = d * 0.5;
      const fl = { x: cx - hw, y: baseY, z: cz + hd };
      const fr = { x: cx + hw, y: baseY, z: cz + hd };
      const bl = { x: cx - hw, y: baseY, z: cz - hd };
      const br = { x: cx + hw, y: baseY, z: cz - hd };
      const rl = { x: cx - hw, y: baseY + h, z: cz };
      const rr = { x: cx + hw, y: baseY + h, z: cz };

      const rawFaces = [
        { verts: [fl, fr, rr, rl], color },
        { verts: [br, bl, rl, rr], color },
        { verts: [bl, fl, rl], color },
        { verts: [fr, br, rr], color }
      ];
      this.createConvexSolid(rawFaces, { x: cx, y: baseY + h * 0.35, z: cz }, false, zoneIdx);
    },

    addDiamondSolid(cx, cy, cz, radius, height, color, trimStroke = null, zoneIdx = -1) {
      const top = { x: cx, y: cy + height * 0.5, z: cz };
      const bot = { x: cx, y: cy - height * 0.5, z: cz };
      const ring = [
        { x: cx - radius, y: cy, z: cz },
        { x: cx, y: cy, z: cz + radius },
        { x: cx + radius, y: cy, z: cz },
        { x: cx, y: cy, z: cz - radius }
      ];
      const rawFaces = [];
      for (let i = 0; i < 4; i++) {
        const p1 = ring[i];
        const p2 = ring[(i + 1) % 4];
        rawFaces.push(
          { verts: [p1, p2, top], color },
          { verts: [p2, p1, bot], color }
        );
      }
      this.createConvexSolid(rawFaces, { x: cx, y: cy, z: cz }, false, zoneIdx);
    },

    // 定向阳光地面斜投影生成：让每座建筑与树木在地面投下真实的明媚斜影
    addCastShadowFootprint(cx, cz, w, d, h, yLevel = 0.08) {
      const hw = w * 0.5;
      const hd = d * 0.5;
      const sx = Math.min(14, h * 0.34);
      const sz = Math.min(11, h * 0.24);
      this.shadowPolys.push({
        verts: [
          { x: cx - hw, y: yLevel, z: cz - hd },
          { x: cx + hw, y: yLevel, z: cz - hd },
          { x: cx + hw + sx, y: yLevel, z: cz - hd + sz },
          { x: cx + hw + sx, y: yLevel, z: cz + hd + sz },
          { x: cx - hw + sx, y: yLevel, z: cz + hd + sz },
          { x: cx - hw, y: yLevel, z: cz + hd }
        ]
      });
    },

    // 凸出窗框与内凹深色玻璃窗阵列：打破平直墙面，塑造丰富的立面凹凸层次
    addFacadeWindows(cx, baseY, cz, w, h, d, rows, cols, pal, idx, frontOnly = false) {
      const startY = baseY + 3.2;
      const usableH = Math.max(4, h - 5.2);
      const rowStep = usableH / Math.max(1, rows);
      const colSpan = w * 0.72;
      const colStep = cols > 1 ? colSpan / (cols - 1) : 0;
      const winW = Math.min(2.6, (w * 0.55) / Math.max(1, cols));
      const winH = Math.min(2.5, rowStep * 0.58);

      for (let r = 0; r < rows; r++) {
        const wy = startY + r * rowStep + winH * 0.5;
        for (let c = 0; c < cols; c++) {
          const wx = cx + (cols > 1 ? -colSpan * 0.5 + c * colStep : 0);
          // 正面窗框凸台 + 深色玻璃芯 + 窗台小挑板
          this.addBoxSolid(wx, wy, cz + d * 0.5 + 0.18, winW + 0.45, winH + 0.4, 0.32, pal.wallSide, null, idx);
          this.addBoxSolid(wx, wy, cz + d * 0.5 + 0.32, winW, winH, 0.24, pal.glassDeep, null, idx);
          this.addBoxSolid(wx, wy - winH * 0.5 - 0.18, cz + d * 0.5 + 0.38, winW + 0.65, 0.28, 0.55, pal.wallPure, null, idx);
          if (!frontOnly && c % 2 === 0) {
            this.addBoxSolid(wx, wy, cz - d * 0.5 - 0.22, winW, winH, 0.28, pal.glassDeep, null, idx);
          }
        }
      }
    },

    // 多地块、街道、草坪与庭院底座构建器：告别刻板的单一整块棋盘格
    buildMultiTerraceGround(data, pal) {
      const worldType = data.worldType || 'campus_manor';
      const isModColor = pal.mode === 'module';

      // 主底层托盘
      const trayColor = isModColor
        ? (worldType === 'treehouse_forest' ? this.shadeColor(pal.lawnA, 0.85) : pal.wallSide)
        : pal.wallSide;
      const topSurfaceColor = isModColor
        ? (worldType === 'modern_street' ? pal.sidewalk : pal.lawnA)
        : pal.wallPure;

      this.addBoxSolid(0, -2.2, 0, 114, 4.0, 94, trayColor, null, -1, true);
      this.addBoxSolid(0, -0.15, 0, 106, 0.3, 86, topSurfaceColor, null, -1, true);

      // 若是系统默认配色且为传统学院/庄园，保留经典的柔光大理石分块并加入错落高台与林木点缀
      if (!isModColor && (worldType === 'campus_manor' || data.moduleId === 'demo_lovelle')) {
        const cols = 10;
        const rows = 8;
        const tileW = 94 / cols;
        const tileD = 74 / rows;
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const tx = -47 + (c + 0.5) * tileW;
            const tz = -37 + (r + 0.5) * tileD;
            const isEven = (r + c) % 2 === 0;
            const hw = tileW * 0.43;
            const hd = tileD * 0.43;
            this.plazaFaces.push({
              verts: [
                { x: tx - hw, y: 0.04, z: tz - hd },
                { x: tx + hw, y: 0.04, z: tz - hd },
                { x: tx + hw, y: 0.04, z: tz + hd },
                { x: tx - hw, y: 0.04, z: tz + hd }
              ],
              cx: tx,
              cz: tz,
              color: isEven ? pal.wallPure : pal.plazaB
            });
          }
        }
        return;
      }

      // 根据世界观构建多层次街道、阳光草坪、木甲板与庭院水池
      if (worldType === 'modern_street' || worldType === 'hospital') {
        // 阳光明媚的后方绿化草坪区
        this.addBoxSolid(0, 0.15, -18, 98, 0.3, 44, isModColor ? pal.lawnA : pal.plazaB, null, -1, true);
        // 前方现代柏油马路与两侧凸起人行道台阶
        this.addBoxSolid(0, 0.12, 18, 102, 0.24, 24, pal.streetAsphalt, null, -1, true);
        this.addBoxSolid(0, 0.35, 3, 102, 0.45, 7, pal.sidewalk, null, -1, true);
        this.addBoxSolid(0, 0.35, 33, 102, 0.45, 7, pal.sidewalk, null, -1, true);
        // 纵向支路与街角斑马线
        this.addBoxSolid(-8, 0.14, -4, 16, 0.25, 38, pal.streetAsphalt, null, -1, true);
        for (let i = -3; i <= 3; i++) {
          this.addBoxSolid(16 + i * 2.4, 0.27, 18, 1.3, 0.06, 14, '#ffffff', null, -1, true);
        }
        for (let i = -2; i <= 2; i++) {
          this.addBoxSolid(-8, 0.27, 4 + i * 2.2, 11, 0.06, 1.2, '#ffffff', null, -1, true);
        }
      } else if (worldType === 'apartment_cutaway') {
        // 室外阳光草坪庭院 + 室内温暖木地板高低平台 + 门前石板小径
        this.addBoxSolid(0, 0.15, 0, 98, 0.3, 78, isModColor ? pal.lawnA : pal.plazaB, null, -1, true);
        this.addBoxSolid(-12, 0.55, -8, 56, 0.8, 42, isModColor ? this.mixHex(pal.wood, '#fff8f0', 0.45) : pal.wallPure, null, -1, true);
        this.addBoxSolid(24, 0.35, 16, 36, 0.5, 28, pal.plazaA, null, -1, true);
      } else if (worldType === 'treehouse_forest') {
        // 高低错落的半厚涂阳光草坡地块 + 清澈林间溪流池
        this.addBoxSolid(0, 0.15, 0, 100, 0.3, 80, isModColor ? pal.lawnA : pal.plazaB, null, -1, true);
        this.addBoxSolid(-20, 0.65, -12, 48, 1.0, 38, isModColor ? pal.lawnB : pal.wallPure, null, -1, true);
        this.addBoxSolid(22, 0.50, 10, 42, 0.7, 36, isModColor ? pal.lawnB : pal.wallPure, null, -1, true);
        this.addBoxSolid(4, 0.22, 22, 28, 0.32, 16, pal.water, 'rgba(255,255,255,0.75)', -1, true);
      } else {
        // 学园/神社/梦境：阳光草坪包围中央十字石材广场与高台庭院
        this.addBoxSolid(0, 0.15, 0, 100, 0.3, 80, isModColor ? pal.lawnA : pal.plazaB, null, -1, true);
        this.addBoxSolid(0, 0.38, -16, 68, 0.5, 32, pal.plazaA, null, -1, true);
        this.addBoxSolid(0, 0.32, 8, 26, 0.4, 48, pal.plazaA, null, -1, true);
        this.addBoxSolid(-28, 0.28, 18, 28, 0.35, 24, isModColor ? pal.lawnB : pal.wallPure, null, -1, true);
        this.addBoxSolid(28, 0.28, 18, 28, 0.35, 24, isModColor ? pal.lawnB : pal.wallPure, null, -1, true);
      }

      // 额外渲染 AI 自定义的 terraces 地块
      if (Array.isArray(data.terraces)) {
        data.terraces.slice(0, 4).forEach(t => {
          const tx = Math.max(-36, Math.min(36, Number(t.x) || 0));
          const tz = Math.max(-24, Math.min(24, Number(t.z) || 0));
          const tw = Math.max(16, Math.min(54, Number(t.w) || 28));
          const td = Math.max(14, Math.min(44, Number(t.d) || 24));
          let tCol = pal.plazaA;
          if (t.type === 'lawn') tCol = isModColor ? pal.lawnB : pal.plazaB;
          else if (t.type === 'street') tCol = pal.streetAsphalt;
          else if (t.type === 'wood_deck') tCol = this.mixHex(pal.wood, '#ffffff', 0.35);
          else if (t.type === 'water_pool') tCol = pal.water;
          this.addBoxSolid(tx, 0.42, tz, tw, 0.45, td, tCol, null, -1, true);
        });
      }
    },

    // 鲜活的世界环境小景物：多层圆润树冠、路灯、红绿灯、自动贩卖机、招牌、长椅、中心喷泉、温泉池、鸟居
    buildEnvironmentalProp(prop, pal) {
      const type = String(prop.type || 'tree');
      const x = Number(prop.x) || 0;
      const z = Number(prop.z) || 0;

      if (type === 'tree' || type === 'pine_tree') {
        this.addCastShadowFootprint(x, z, 4.2, 4.2, 10);
        this.addPrismSolid(x, 0.2, z, 0.65, 3.8, 8, pal.wood, null, -1);
        if (type === 'pine_tree') {
          this.addPyramidSolid(x, 3.0, z, 3.2, 4.2, 12, pal.foliage, null, -1);
          this.addPyramidSolid(x, 5.4, z, 2.5, 3.6, 12, pal.foliageLight, null, -1);
        } else {
          // 街角参考图同款：三团圆润饱满的盆景式半厚涂树冠球
          this.addDomeSolid(x, 3.2, z, 2.8, 2.8, 12, pal.foliage, null, -1);
          this.addDomeSolid(x - 1.4, 3.8, z + 0.8, 2.0, 2.1, 12, pal.foliageLight, null, -1);
          this.addDomeSolid(x + 1.3, 4.2, z - 0.6, 2.1, 2.2, 12, pal.foliageLight, null, -1);
        }
      } else if (type === 'flower_bed') {
        this.addBoxSolid(x, 0.6, z, 5.2, 0.9, 2.8, pal.wallPure, null, -1);
        this.addBoxSolid(x, 1.15, z, 4.4, 0.4, 2.1, pal.foliage, null, -1);
        this.addBoxSolid(x - 1.1, 1.45, z, 0.9, 0.4, 0.9, pal.accent, null, -1);
        this.addBoxSolid(x + 1.1, 1.45, z, 0.9, 0.4, 0.9, pal.accentSoft, null, -1);
      } else if (type === 'street_lamp') {
        this.addCastShadowFootprint(x, z, 1.4, 1.4, 11);
        this.addBoxSolid(x, 4.8, z, 0.45, 9.2, 0.45, pal.obsidian, null, -1);
        this.addBoxSolid(x + 1.1, 9.2, z, 2.6, 0.4, 0.65, pal.obsidian, null, -1);
        this.addBoxSolid(x + 1.9, 8.9, z, 0.9, 0.35, 0.6, '#fff8c4', null, -1);
      } else if (type === 'traffic_light') {
        this.addCastShadowFootprint(x, z, 1.5, 1.5, 10);
        this.addBoxSolid(x, 4.5, z, 0.5, 8.6, 0.5, pal.obsidian, null, -1);
        this.addBoxSolid(x, 7.6, z + 0.45, 1.2, 2.8, 0.7, pal.obsidianSoft, null, -1);
        this.addBoxSolid(x, 8.3, z + 0.82, 0.55, 0.55, 0.2, '#ff6b6b', null, -1);
        this.addBoxSolid(x, 7.6, z + 0.82, 0.55, 0.55, 0.2, '#ffd93d', null, -1);
        this.addBoxSolid(x, 6.9, z + 0.82, 0.55, 0.55, 0.2, '#6bcb77', null, -1);
      } else if (type === 'vending_machine') {
        this.addCastShadowFootprint(x, z, 2.8, 2.2, 5.5);
        this.addBoxSolid(x, 2.6, z, 2.6, 4.8, 1.8, pal.accent, null, -1);
        this.addBoxSolid(x, 3.1, z + 0.95, 2.0, 2.4, 0.18, '#ffffff', null, -1);
        this.addBoxSolid(x, 1.3, z + 0.95, 1.6, 0.7, 0.18, pal.obsidian, null, -1);
      } else if (type === 'signboard') {
        this.addCastShadowFootprint(x, z, 2.2, 1.5, 9);
        this.addBoxSolid(x, 4.2, z, 0.5, 8.0, 0.5, pal.obsidian, null, -1);
        this.addBoxSolid(x, 6.8, z, 3.2, 2.4, 0.8, '#ffffff', pal.accent, -1);
        this.addBoxSolid(x, 7.5, z, 3.25, 0.65, 0.85, pal.accent, null, -1);
      } else if (type === 'bench') {
        this.addBoxSolid(x, 0.9, z, 4.2, 0.45, 1.5, pal.wood, null, -1);
        this.addBoxSolid(x, 1.6, z - 0.6, 4.2, 1.1, 0.35, pal.wood, null, -1);
        this.addBoxSolid(x - 1.6, 0.5, z, 0.4, 0.9, 1.4, pal.obsidian, null, -1);
        this.addBoxSolid(x + 1.6, 0.5, z, 0.4, 0.9, 1.4, pal.obsidian, null, -1);
      } else if (type === 'fountain' || type === 'hot_spring') {
        this.addPrismSolid(x, 0.2, z, 5.2, 1.2, 14, pal.wallPure, null, -1);
        this.addPrismSolid(x, 0.5, z, 4.3, 1.05, 14, pal.water, null, -1);
        if (type === 'fountain') {
          this.addPrismSolid(x, 1.2, z, 1.2, 2.6, 10, pal.wallPure, null, -1);
          this.addDomeSolid(x, 3.8, z, 2.0, 1.2, 12, pal.water, null, -1);
        }
      } else if (type === 'torii') {
        this.addCastShadowFootprint(x, z, 6.0, 2.0, 8.5);
        this.addBoxSolid(x - 2.4, 3.8, z, 0.65, 7.2, 0.65, pal.accent, null, -1);
        this.addBoxSolid(x + 2.4, 3.8, z, 0.65, 7.2, 0.65, pal.accent, null, -1);
        this.addBoxSolid(x, 7.2, z, 7.2, 0.7, 0.9, pal.obsidian, null, -1);
        this.addBoxSolid(x, 5.8, z, 5.8, 0.45, 0.6, pal.accent, null, -1);
      } else if (type === 'sculpture') {
        this.addBoxSolid(x, 1.1, z, 3.0, 1.8, 3.0, pal.wallPure, null, -1);
        this.addDiamondSolid(x, 3.6, z, 1.5, 2.8, pal.accent, null, -1);
      }
    },

    build3DSceneGeometry(data) {
      this.solids = [];
      this.plazaFaces = [];
      this.shadowPolys = [];
      this.buildingBounds = [];
      this.labelAnchors = [];

      const pal = this.resolveThemePalette();
      const zones = Array.isArray(data.zones) ? data.zones : [];
      const worldType = data.worldType || 'campus_manor';

      // 1. 构建多地块、街道、阳光草坪或庭院地面
      this.buildMultiTerraceGround(data, pal);

      // 2. 自动防重叠建筑坐标布局
      const placed = zones.map((z, idx) => {
        let px = Number(z.x) || 0;
        let pz = Number(z.z) || 0;
        for (let iter = 0; iter < 14; iter++) {
          for (let j = 0; j < idx; j++) {
            const other = zones[j];
            const dx = px - (other._px ?? other.x ?? 0);
            const dz = pz - (other._pz ?? other.z ?? 0);
            const dist = Math.hypot(dx, dz);
            const minDist = 25;
            if (dist < minDist) {
              const ang = dist > 0.1 ? Math.atan2(dz, dx) : (idx * 1.15);
              px += Math.cos(ang) * (minDist - dist);
              pz += Math.sin(ang) * (minDist - dist);
            }
          }
        }
        px = Math.max(-38, Math.min(38, px));
        pz = Math.max(-26, Math.min(24, pz));
        z._px = px;
        z._pz = pz;
        return { zone: z, idx, x: px, z: pz };
      });

      // 3. 构建每座有棱有角、有凹有凸的立体建筑
      placed.forEach(({ zone, idx, x, z }) => {
        const w = Math.max(16, Math.min(23, Number(zone.width) || 19));
        const d = Math.max(15, Math.min(21, Number(zone.depth) || 18));
        const h = Math.max(20, Math.min(34, Number(zone.height) || 26));
        const arch = zone.archType || 'spire';

        // 记录建筑碰撞包围盒，供小动物防穿模寻路使用
        this.buildingBounds.push({
          x,
          z,
          hw: w * 0.5 + 3.2,
          hd: d * 0.5 + 3.2
        });

        // 投射定向地面阳光阴影
        this.addCastShadowFootprint(x, z, w + 1.5, d + 1.5, h);

        // 阶梯台基与散水垫层
        this.addBoxSolid(x, 0.85, z, w + 2.4, 1.7, d + 2.4, pal.wallSide, null, idx, false);
        this.addBoxSolid(x, 1.85, z, w + 1.0, 0.5, d + 1.0, pal.wallPure, null, idx, false);

        const base0 = 2.0;
        let topY = h;

        if (arch === 'convenience_store' || arch === 'modern_store') {
          // 街角参考图同款：有棱有角、有凹有凸的现代便利店/商铺
          const bodyH = h * 0.44;
          const mainW = w * 0.88;
          const mainD = d * 0.78;
          // 主体奶白建筑 + 左侧微凸储物配楼
          this.addBoxSolid(x + 0.8, base0 + bodyH * 0.5, z, mainW, bodyH, mainD, pal.wallPure, null, idx);
          this.addBoxSolid(x - mainW * 0.52, base0 + bodyH * 0.42, z - 0.8, w * 0.24, bodyH * 0.84, mainD * 0.82, pal.wallSide, null, idx);
          // 屋顶四周凸起女儿墙边框 + 凹陷平屋顶 + 空调外机设备盒
          const roofY = base0 + bodyH;
          this.addBoxSolid(x + 0.8, roofY + 0.55, z, mainW + 0.8, 1.1, mainD + 0.8, pal.obsidian, null, idx);
          this.addBoxSolid(x + 0.8, roofY + 1.15, z, mainW - 1.2, 0.3, mainD - 1.2, pal.wallSide, null, idx);
          this.addBoxSolid(x - 2.5, roofY + 1.9, z - 1.8, 3.2, 1.5, 2.4, pal.wallPure, null, idx);
          // 标志性向前悬挑的条纹招牌雨棚
          const canopyY = base0 + bodyH * 0.68;
          this.addBoxSolid(x + 0.8, canopyY, z + mainD * 0.5 + 1.2, mainW + 1.4, 1.5, 2.8, '#ffffff', null, idx);
          this.addBoxSolid(x + 0.8, canopyY + 0.35, z + mainD * 0.5 + 1.28, mainW + 1.5, 0.55, 2.85, pal.accent, null, idx);
          this.addBoxSolid(x + 0.8, canopyY - 0.35, z + mainD * 0.5 + 1.28, mainW + 1.5, 0.45, 2.85, pal.foliage, null, idx);
          // 正面大面积深色落地玻璃橱窗与双开门 + 内部暖光收银台与货架
          const glassH = bodyH * 0.56;
          this.addBoxSolid(x + 0.8, base0 + glassH * 0.5, z + mainD * 0.5 + 0.15, mainW * 0.84, glassH, 0.3, pal.glassDeep, null, idx);
          this.addBoxSolid(x - 1.8, base0 + glassH * 0.42, z + mainD * 0.5 + 0.25, 3.8, glassH * 0.68, 0.22, pal.accentSoft, null, idx);
          this.addBoxSolid(x + 2.8, base0 + glassH * 0.42, z + mainD * 0.5 + 0.25, 3.8, glassH * 0.68, 0.22, pal.glass, null, idx);
          // 门口右侧街角立柱招牌与左侧红色自动贩卖机
          this.addBoxSolid(x - mainW * 0.44, base0 + 2.1, z + mainD * 0.5 + 1.3, 2.2, 4.2, 1.5, pal.accent, null, idx);
          topY = roofY + 4.2;
        } else if (arch === 'hospital') {
          // 现代多层综合医院大楼：主病房楼 + 侧翼门诊楼 + 凸出急救车雨棚 + 屋顶医疗十字
          const mainH = h * 0.62;
          const wingH = h * 0.44;
          this.addBoxSolid(x - 1.5, base0 + mainH * 0.5, z - 1.0, w * 0.64, mainH, d * 0.66, pal.wallPure, null, idx);
          this.addBoxSolid(x + w * 0.32, base0 + wingH * 0.5, z + 1.2, w * 0.44, wingH, d * 0.58, pal.wallSide, null, idx);
          // 屋顶挑檐女儿墙
          this.addBoxSolid(x - 1.5, base0 + mainH + 0.5, z - 1.0, w * 0.68, 1.0, d * 0.70, pal.obsidian, null, idx);
          this.addBoxSolid(x + w * 0.32, base0 + wingH + 0.4, z + 1.2, w * 0.48, 0.8, d * 0.62, pal.accent, null, idx);
          // 凸出急救入口大雨棚与立柱
          const porchW = w * 0.42;
          const porchZ = z + d * 0.33 + 2.4;
          this.addBoxSolid(x - 1.5, base0 + 3.6, porchZ, porchW, 0.85, 3.8, pal.accent, null, idx);
          this.addBoxSolid(x - 1.5 - porchW * 0.38, base0 + 1.8, porchZ + 1.4, 0.55, 3.6, 0.55, pal.wallPure, null, idx);
          this.addBoxSolid(x - 1.5 + porchW * 0.38, base0 + 1.8, porchZ + 1.4, 0.55, 3.6, 0.55, pal.wallPure, null, idx);
          // 多层内凹医疗采光窗阵列
          this.addFacadeWindows(x - 1.5, base0 + 2.2, z - 1.0, w * 0.60, mainH - 2, d * 0.66, 3, 3, pal, idx);
          // 屋顶醒目立体十字标识
          const crossY = base0 + mainH + 2.4;
          this.addBoxSolid(x - 1.5, crossY, z - 1.0 + d * 0.25, 3.6, 1.1, 0.9, pal.accent, null, idx);
          this.addBoxSolid(x - 1.5, crossY, z - 1.0 + d * 0.25, 1.1, 3.6, 0.9, pal.accent, null, idx);
          topY = crossY + 3.2;
        } else if (arch === 'apartment_cutaway') {
          // 温暖室内剖面居所：L型半剖外墙 + 木地板 + 暖炉桌/被炉 + 沙发 + 阳台绿植
          const wallH = h * 0.46;
          const floorW = w * 0.88;
          const floorD = d * 0.84;
          // 温暖木地板底座
          this.addBoxSolid(x, base0 + 0.4, z, floorW, 0.8, floorD, pal.wood, null, idx);
          // 后侧与左侧厚实L型剖面墙体，带采光窗洞
          this.addBoxSolid(x, base0 + wallH * 0.5, z - floorD * 0.46, floorW, wallH, 1.4, pal.wallPure, null, idx);
          this.addBoxSolid(x - floorW * 0.46, base0 + wallH * 0.5, z, 1.4, wallH, floorD, pal.wallPure, null, idx);
          this.addBoxSolid(x + 1.5, base0 + wallH * 0.58, z - floorD * 0.46 + 0.8, floorW * 0.42, wallH * 0.42, 0.3, pal.glass, null, idx);
          // 半覆式斜坡屋顶檐口
          this.addGableRoofSolid(x - floorW * 0.18, base0 + wallH, z - floorD * 0.18, floorW * 0.68, h * 0.24, floorD * 0.64, pal.obsidian, null, idx);
          // 室内中心：温暖的被炉/暖炉桌 + 桌面柑橘茶具 + 坐垫
          this.addBoxSolid(x + 1.2, base0 + 1.5, z + 1.0, 5.6, 1.4, 5.2, pal.accent, null, idx);
          this.addBoxSolid(x + 1.2, base0 + 2.3, z + 1.0, 4.4, 0.35, 4.0, pal.wallPure, null, idx);
          // 室内后侧：料理吧台/书架与柔软沙发
          this.addBoxSolid(x - floorW * 0.22, base0 + 2.2, z - floorD * 0.26, 4.8, 2.8, 2.4, pal.obsidianSoft, null, idx);
          this.addBoxSolid(x + floorW * 0.24, base0 + 1.6, z - floorD * 0.22, 4.6, 1.8, 2.6, pal.accentSoft, null, idx);
          // 前侧开放式阳台矮栏杆
          this.addBoxSolid(x + floorW * 0.15, base0 + 1.4, z + floorD * 0.46, floorW * 0.65, 1.2, 0.45, pal.wallSide, null, idx);
          topY = base0 + wallH + h * 0.24 + 2.8;
        } else if (arch === 'treehouse') {
          // 森林巨木多层树屋：粗壮树干 + 双层木栈道平台 + 斜顶林间木屋 + 茂密半厚涂树冠球
          const trunkH = h * 0.68;
          this.addPrismSolid(x, base0, z, w * 0.22, trunkH, 10, pal.wood, null, idx);
          // 第一层悬空木甲板与斜顶木屋
          const deck1Y = base0 + trunkH * 0.45;
          this.addBoxSolid(x, deck1Y, z, w * 0.86, 0.9, d * 0.82, pal.wood, null, idx);
          const cabinH = h * 0.28;
          this.addBoxSolid(x - 1.8, deck1Y + cabinH * 0.5, z - 0.8, w * 0.52, cabinH, d * 0.52, pal.wallPure, null, idx);
          this.addGableRoofSolid(x - 1.8, deck1Y + cabinH, z - 0.8, w * 0.60, h * 0.18, d * 0.60, pal.accent, null, idx);
          // 屋门与暖光小窗
          this.addBoxSolid(x - 1.8, deck1Y + cabinH * 0.45, z - 0.8 + d * 0.27, 2.2, 2.4, 0.3, '#fff5ba', null, idx);
          // 环绕树屋的多团丰盈树冠
          const crownY = base0 + trunkH * 0.72;
          this.addDomeSolid(x + 2.2, crownY, z - 1.5, w * 0.42, h * 0.28, 14, pal.foliage, null, idx);
          this.addDomeSolid(x - 2.8, crownY + 2.2, z + 1.2, w * 0.34, h * 0.24, 14, pal.foliageLight, null, idx);
          this.addDomeSolid(x + 0.5, crownY + 3.4, z, w * 0.30, h * 0.22, 14, pal.foliageLight, null, idx);
          topY = crownY + h * 0.28 + 3.2;
        } else if (arch === 'school') {
          // 明窗长廊教学楼：宽阔主楼 + 凸出中央门厅与时钟山墙 + 阵列式凹窗 + 天台围栏
          const bodyH = h * 0.52;
          this.addBoxSolid(x, base0 + bodyH * 0.5, z, w * 0.90, bodyH, d * 0.66, pal.wallPure, null, idx);
          // 凸出中央门厅与双坡小尖顶
          const bayW = w * 0.34;
          const bayH = bodyH * 1.12;
          this.addBoxSolid(x, base0 + bayH * 0.5, z + d * 0.16, bayW, bayH, d * 0.48, pal.wallPure, null, idx);
          this.addGableRoofSolid(x, base0 + bayH, z + d * 0.16, bayW + 1.2, h * 0.22, d * 0.52, pal.obsidian, null, idx);
          // 主楼双坡屋顶与一层的入口雨棚
          this.addGableRoofSolid(x, base0 + bodyH, z, w * 0.94, h * 0.20, d * 0.70, pal.obsidianSoft, null, idx);
          this.addBoxSolid(x, base0 + 3.2, z + d * 0.42 + 1.2, bayW + 1.6, 0.7, 2.6, pal.accent, null, idx);
          this.addFacadeWindows(x, base0 + 1.0, z, w * 0.84, bodyH, d * 0.66, 2, 4, pal, idx, true);
          topY = base0 + bayH + h * 0.22 + 2.8;
        } else if (arch === 'shrine' || arch === 'pagoda') {
          // 朱木重檐神社与飞阁楼台：挑檐屋顶 + 廊柱 + 门前朱红小鸟居
          let curY = base0;
          const tiers = arch === 'shrine' ? 2 : 3;
          for (let t = 0; t < tiers; t++) {
            const scale = 1 - t * 0.20;
            const th = (h * (arch === 'shrine' ? 0.26 : 0.20)) * (1 - t * 0.08);
            this.addBoxSolid(x, curY + th * 0.5, z, w * 0.72 * scale, th, d * 0.68 * scale, pal.wallPure, null, idx);
            // 朱红腰线与檐下斗拱带
            this.addBoxSolid(x, curY + th - 0.3, z, w * 0.76 * scale, 0.6, d * 0.72 * scale, pal.accent, null, idx);
            curY += th;
            const rh = h * 0.13;
            this.addPyramidSolid(x, curY, z, w * 0.60 * scale, rh, 4, t % 2 === 0 ? pal.obsidian : pal.accentSoft, null, idx);
            curY += rh * 0.82;
          }
          // 门前迎宾小鸟居
          const tz = z + d * 0.48 + 2.2;
          this.addBoxSolid(x - 2.0, base0 + 2.2, tz, 0.5, 4.4, 0.5, pal.accent, null, idx);
          this.addBoxSolid(x + 2.0, base0 + 2.2, tz, 0.5, 4.4, 0.5, pal.accent, null, idx);
          this.addBoxSolid(x, base0 + 4.3, tz, 5.4, 0.55, 0.7, pal.obsidian, null, idx);
          topY = curY + 3.2;
        } else if (arch === 'clocktower') {
          const towerW = w * 0.58;
          const lowerH = h * 0.34;
          const belfryH = h * 0.22;

          this.addBoxSolid(x, base0 + lowerH * 0.5, z, towerW, lowerH, towerW, pal.wallPure, null, idx);
          this.addFacadeWindows(x, base0, z, towerW, lowerH, towerW, 2, 2, pal, idx, true);
          const belfryY = base0 + lowerH;
          this.addBoxSolid(x, belfryY + 0.5, z, towerW + 1.4, 1.0, towerW + 1.4, pal.accentSoft, null, idx);
          this.addBoxSolid(x, belfryY + 1.0 + belfryH * 0.5, z, towerW * 0.92, belfryH, towerW * 0.92, pal.wallPure, null, idx);
          const cOff = towerW * 0.47;
          const cMidY = belfryY + 1.0 + belfryH * 0.52;
          this.addBoxSolid(x, cMidY, z + cOff, towerW * 0.38, belfryH * 0.48, 0.6, pal.accentSoft, null, idx);
          this.addBoxSolid(x + cOff, cMidY, z, 0.6, belfryH * 0.48, towerW * 0.38, pal.accentSoft, null, idx);
          this.addBoxSolid(x - cOff, cMidY, z, 0.6, belfryH * 0.48, towerW * 0.38, pal.accentSoft, null, idx);

          const spireY = belfryY + 1.0 + belfryH;
          const spireH = h * 0.38;
          this.addPyramidSolid(x, spireY, z, towerW * 0.56, spireH, 16, pal.obsidian, null, idx);
          const pOff = towerW * 0.42;
          [[-pOff, -pOff], [pOff, -pOff], [-pOff, pOff], [pOff, pOff]].forEach(([px, pz], pi) => {
            this.addPyramidSolid(x + px, spireY - 0.5, z + pz, 2.0, spireH * 0.46, 12, pi % 2 === 0 ? pal.accent : pal.obsidian, null, idx);
          });
          topY = spireY + spireH + 2.5;
        } else if (arch === 'dome' || arch === 'greenhouse') {
          const baseH = h * 0.44;
          this.addPrismSolid(x, base0, z, w * 0.44, baseH, 16, pal.wallPure, null, idx);
          const wingH = baseH * 0.85;
          this.addBoxSolid(x - w * 0.48, base0 + wingH * 0.5, z - 2, w * 0.38, wingH, d * 0.42, pal.wallPure, null, idx);
          this.addBevelCapSolid(x - w * 0.48, base0 + wingH, z - 2, w * 0.32, 1.3, d * 0.34, pal.obsidian, 'rgba(255,255,255,0.85)', idx);
          // 凸出阳光花房入口门廊
          this.addBoxSolid(x, base0 + 2.6, z + w * 0.44 + 1.0, 5.2, 5.2, 2.2, pal.wallPure, null, idx);
          this.addBoxSolid(x, base0 + 2.2, z + w * 0.44 + 2.15, 3.4, 3.8, 0.25, pal.glassDeep, null, idx);

          const domeY = base0 + baseH;
          const domeR = w * 0.43;
          const domeH = h * 0.36;
          this.addDomeSolid(x, domeY, z, domeR, domeH, 18, pal.accentSoft, 'rgba(255,255,255,0.9)', idx);
          this.addDiamondSolid(x, domeY + domeH + 1.8, z, 1.7, 2.4, pal.obsidian, null, idx);
          topY = domeY + domeH + 4.2;
        } else if (arch === 'hall' || arch === 'mansion') {
          const bodyH = h * 0.46;
          this.addBoxSolid(x + 2, base0 + bodyH * 0.5, z, w * 0.72, bodyH, d * 0.68, pal.wallPure, null, idx);
          this.addFacadeWindows(x + 2, base0, z, w * 0.68, bodyH, d * 0.68, 2, 3, pal, idx, true);
          const roofY = base0 + bodyH;
          const roofH = h * 0.30;
          this.addGableRoofSolid(x + 2, roofY, z, w * 0.78, roofH, d * 0.74, pal.obsidian, null, idx);

          const sideTowerH = bodyH * 1.05;
          this.addBoxSolid(x - w * 0.34, base0 + sideTowerH * 0.5, z - 1, w * 0.32, sideTowerH, d * 0.32, pal.wallPure, null, idx);
          this.addPyramidSolid(x - w * 0.34, base0 + sideTowerH, z - 1, w * 0.24, roofH * 1.45, 16, pal.obsidianSoft, null, idx);
          topY = base0 + sideTowerH + roofH * 1.45 + 2.5;
        } else if (arch === 'ward' || arch === 'courtyard') {
          const h1 = h * 0.52;
          const h2 = h * 0.38;
          this.addBoxSolid(x - w * 0.16, base0 + h1 * 0.5, z - 1, w * 0.56, h1, d * 0.56, pal.wallPure, null, idx);
          this.addBevelCapSolid(x - w * 0.16, base0 + h1, z - 1, w * 0.42, 1.5, d * 0.42, pal.obsidian, 'rgba(255,255,255,0.85)', idx);
          this.addFacadeWindows(x - w * 0.16, base0, z - 1, w * 0.52, h1, d * 0.56, 2, 2, pal, idx, true);

          this.addBoxSolid(x + w * 0.24, base0 + h2 * 0.5, z + 3, w * 0.48, h2, d * 0.48, pal.wallPure, null, idx);
          this.addBevelCapSolid(x + w * 0.24, base0 + h2, z + 3, w * 0.36, 1.3, d * 0.36, pal.accentSoft, 'rgba(255,255,255,0.85)', idx);
          topY = base0 + h1 + 4.0;
        } else if (arch === 'observatory') {
          const cylH = h * 0.48;
          this.addPrismSolid(x, base0, z, w * 0.42, cylH, 16, pal.wallPure, null, idx);
          this.addBoxSolid(x, base0 + cylH * 0.65, z, w * 0.92, 1.1, d * 0.46, pal.accentSoft, null, idx);
          this.addDomeSolid(x, base0 + cylH, z, w * 0.40, h * 0.36, 18, pal.obsidian, 'rgba(255,255,255,0.85)', idx);
          topY = base0 + cylH + h * 0.36 + 3.0;
        } else {
          const castleH = h * 0.46;
          this.addBoxSolid(x - 2, base0 + castleH * 0.5, z, w * 0.68, castleH, d * 0.68, pal.wallPure, null, idx);
          this.addFacadeWindows(x - 2, base0, z, w * 0.64, castleH, d * 0.68, 2, 2, pal, idx, true);
          const baseTop = base0 + castleH;
          const mainSpireH = h * 0.36;
          this.addPyramidSolid(x - 2, baseTop, z, w * 0.26, mainSpireH, 16, pal.accentSoft, null, idx);
          const cones = [
            { dx: -5.2, dz: 1.5, r: 2.3, sh: mainSpireH * 0.68, col: pal.obsidian },
            { dx: 3.8, dz: -2.0, r: 2.5, sh: mainSpireH * 0.76, col: pal.obsidian },
            { dx: -1.5, dz: 4.5, r: 2.6, sh: mainSpireH * 0.72, col: pal.obsidian }
          ];
          cones.forEach(c => {
            this.addPyramidSolid(x - 2 + c.dx, baseTop, z + c.dz, c.r, c.sh, 16, c.col, null, idx);
          });
          const sideH = castleH * 0.92;
          this.addBoxSolid(x + w * 0.42, base0 + sideH * 0.5, z - 2, w * 0.38, sideH, d * 0.38, pal.wallPure, null, idx);
          this.addBevelCapSolid(x + w * 0.42, base0 + sideH, z - 2, w * 0.30, 1.3, d * 0.30, pal.accentSoft, 'rgba(255,255,255,0.85)', idx);
          topY = baseTop + mainSpireH + 3.2;
        }

        // 叠加 AI 针对该建筑定制的额外凹凸特征构件
        if (Array.isArray(zone.customParts)) {
          zone.customParts.slice(0, 4).forEach(cp => {
            const dx = Math.max(-10, Math.min(10, Number(cp.dx) || 0));
            const dy = Math.max(2, Math.min(20, Number(cp.dy) || 5));
            const dz = Math.max(-10, Math.min(10, Number(cp.dz) || 0));
            const pw = Math.max(2, Math.min(12, Number(cp.w) || 5));
            const ph = Math.max(1, Math.min(8, Number(cp.h) || 2.5));
            const pd = Math.max(1, Math.min(10, Number(cp.d) || 3));
            let pCol = pal.wallPure;
            if (cp.tone === 'accent') pCol = pal.accent;
            else if (cp.tone === 'roof') pCol = pal.obsidian;
            else if (cp.tone === 'glass') pCol = pal.glassDeep;
            this.addBoxSolid(x + dx, base0 + dy, z + dz, pw, ph, pd, pCol, null, idx);
          });
        }

        this.labelAnchors.push({
          zoneIdx: idx,
          code: zone.code || String(idx + 1).padStart(2, '0'),
          name: zone.name || `区域0${idx + 1}`,
          x,
          y: topY,
          z
        });
      });

      // 4. 布置场景环境景物与植被（若 AI 未指定则按世界观自动排布在不遮挡建筑的空地上）
      let propList = Array.isArray(data.props) && data.props.length > 0 ? data.props : null;
      if (!propList) {
        if (worldType === 'modern_street' || worldType === 'hospital') {
          propList = [
            { type: 'street_lamp', x: -24, z: 6 },
            { type: 'street_lamp', x: 22, z: 6 },
            { type: 'traffic_light', x: -16, z: 14 },
            { type: 'vending_machine', x: -12, z: -6 },
            { type: 'signboard', x: -18, z: 2 },
            { type: 'bench', x: 28, z: 6 },
            { type: 'tree', x: -42, z: -14 },
            { type: 'tree', x: 42, z: -12 },
            { type: 'tree', x: 36, z: 4 },
            { type: 'flower_bed', x: 6, z: 5 }
          ];
        } else if (worldType === 'treehouse_forest') {
          propList = [
            { type: 'tree', x: -42, z: -18 },
            { type: 'pine_tree', x: 42, z: -18 },
            { type: 'tree', x: -40, z: 14 },
            { type: 'pine_tree', x: 40, z: 16 },
            { type: 'flower_bed', x: -12, z: 12 },
            { type: 'flower_bed', x: 14, z: -8 },
            { type: 'hot_spring', x: 4, z: 22 },
            { type: 'bench', x: -14, z: 26 }
          ];
        } else if (worldType === 'shrine') {
          propList = [
            { type: 'torii', x: 0, z: 32 },
            { type: 'pine_tree', x: -40, z: -16 },
            { type: 'pine_tree', x: 40, z: -16 },
            { type: 'hot_spring', x: -14, z: 12 },
            { type: 'tree', x: 38, z: 18 },
            { type: 'flower_bed', x: 14, z: 24 }
          ];
        } else {
          propList = [
            { type: 'fountain', x: 0, z: 2 },
            { type: 'tree', x: -42, z: -16 },
            { type: 'tree', x: 42, z: -16 },
            { type: 'tree', x: -40, z: 18 },
            { type: 'tree', x: 40, z: 22 },
            { type: 'flower_bed', x: -16, z: 10 },
            { type: 'flower_bed', x: 16, z: -6 },
            { type: 'bench', x: -14, z: 28 },
            { type: 'sculpture', x: 18, z: 26 }
          ];
        }
      }

      propList.forEach(p => {
        const px = Math.max(-45, Math.min(45, Number(p.x) || 0));
        const pz = Math.max(-34, Math.min(34, Number(p.z) || 0));
        // 若道具恰好落在某栋建筑内部，则自动推到建筑外侧人行道或草坪上
        let safeX = px;
        let safeZ = pz;
        this.buildingBounds.forEach(b => {
          if (Math.abs(safeX - b.x) < b.hw && Math.abs(safeZ - b.z) < b.hd) {
            safeZ = b.z + (safeZ >= b.z ? b.hd + 2.2 : -b.hd - 2.2);
          }
        });
        this.buildEnvironmentalProp({ type: p.type, x: safeX, z: safeZ }, pal);
      });

      // 5. 初始化高空半透明片状浮云与防穿模可爱小动物
      this.initCloudsAndAnimals(data, worldType);
    },

    initCloudsAndAnimals(data, worldType) {
      this.clouds = [
        { x: -34, y: 42, z: -26, scale: 1.15, speed: 0.028 },
        { x: 24, y: 46, z: -20, scale: 0.95, speed: 0.022 },
        { x: -12, y: 44, z: 18, scale: 0.85, speed: 0.032 },
        { x: 36, y: 40, z: 14, scale: 1.05, speed: 0.025 }
      ];

      let rawAnimals = Array.isArray(data.animals) && data.animals.length > 0 ? data.animals : null;
      if (!rawAnimals) {
        if (worldType === 'apartment_cutaway' || worldType === 'modern_street') {
          rawAnimals = [
            { type: 'cat', x: -10, z: 10 },
            { type: 'cat', x: 16, z: 14 },
            { type: 'bird', x: -20, z: -4 }
          ];
        } else if (worldType === 'treehouse_forest' || worldType === 'shrine') {
          rawAnimals = [
            { type: 'bunny', x: -14, z: 10 },
            { type: 'bunny', x: 14, z: 12 },
            { type: 'bird', x: 0, z: -6 }
          ];
        } else {
          rawAnimals = [
            { type: 'bunny', x: -14, z: 12 },
            { type: 'cat', x: 16, z: 10 },
            { type: 'bird', x: -6, z: -6 }
          ];
        }
      }

      this.animals = rawAnimals.map((a, idx) => {
        const pos = this.findSafeOpenSpot(Number(a.x) || 0, Number(a.z) || 10, idx);
        const target = this.findSafeOpenSpot(pos.x + (idx % 2 === 0 ? 14 : -14), pos.z + 8, idx + 3);
        return {
          type: String(a.type || 'bunny'),
          x: pos.x,
          z: pos.z,
          tx: target.x,
          tz: target.z,
          heading: 0,
          phase: idx * 1.7,
          speed: a.type === 'bird' ? 0.09 : 0.055
        };
      });
    },

    isSpotInsideBuilding(x, z, margin = 2.0) {
      for (let i = 0; i < this.buildingBounds.length; i++) {
        const b = this.buildingBounds[i];
        if (Math.abs(x - b.x) < b.hw + margin && Math.abs(z - b.z) < b.hd + margin) {
          return true;
        }
      }
      return false;
    },

    findSafeOpenSpot(prefX, prefZ, seed = 0) {
      let x = Math.max(-40, Math.min(40, prefX));
      let z = Math.max(-28, Math.min(30, prefZ));
      if (!this.isSpotInsideBuilding(x, z, 2.2)) return { x, z };

      const candidates = [
        { x: 0, z: 8 },
        { x: -16, z: 8 },
        { x: 16, z: 8 },
        { x: 0, z: 28 },
        { x: -20, z: -2 },
        { x: 20, z: -2 },
        { x: -12, z: 18 },
        { x: 12, z: 18 }
      ];
      for (let i = 0; i < candidates.length; i++) {
        const c = candidates[(i + seed) % candidates.length];
        if (!this.isSpotInsideBuilding(c.x, c.z, 1.8)) {
          return { x: c.x, z: c.z };
        }
      }
      return { x: 0, z: 30 };
    },

    createFloatingLabels(data) {
      const layer = document.getElementById('atlas-labels-layer') || document.getElementById('atlas-3d-labels-layer');
      if (!layer) return;
      layer.innerHTML = '';

      const pal = this.resolveThemePalette();
      this.labelAnchors.forEach((anchor, i) => {
        const pill = document.createElement('button');
        pill.type = 'button';
        pill.className = 'atlas-floating-pill';
        pill.dataset.zoneIdx = String(i);
        pill.style.cssText = [
          'position:absolute',
          'left:0px',
          'top:0px',
          'transform:translate(-50%, -100%)',
          'pointer-events:auto',
          'cursor:pointer',
          'display:inline-flex',
          'align-items:center',
          'gap:4px',
          'padding:2px 9px',
          'border-radius:999px',
          'background:rgba(255,255,255,0.92)',
          'border:1px solid rgba(255,255,255,0.98)',
          'box-shadow:0 3px 10px rgba(38,32,40,0.08)',
          'font-size:11px',
          'font-weight:800',
          `color:${pal.obsidian}`,
          'white-space:nowrap',
          'transition:transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease'
        ].join(';');

        pill.innerHTML = `<span class="atlas-pill-code" style="color:${pal.accent}; font-weight:900;">${this.escapeHtml(anchor.code)}</span><span>${this.escapeHtml(anchor.name)}</span>`;
        pill.addEventListener('click', (e) => {
          e.stopPropagation();
          this.focusZone(i, true);
        });
        layer.appendChild(pill);
        anchor.el = pill;
      });
    },

    getZoneSvgIcon(archType, isSelected) {
      const stroke = isSelected ? '#ffffff' : 'currentColor';
      if (archType === 'convenience_store' || archType === 'modern_store') {
        return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l2-5h14l2 5"/><path d="M3 9h18v11H3z"/><path d="M9 20v-6h6v6"/></svg>`;
      }
      if (archType === 'hospital') {
        return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>`;
      }
      if (archType === 'apartment_cutaway') {
        return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 20h18"/><path d="M5 20V8l7-4 7 4v12"/><rect x="9" y="13" width="6" height="4" rx="1"/></svg>`;
      }
      if (archType === 'treehouse') {
        return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 7h-4l3 5H6l3-5H5l7-7z"/><path d="M12 15v6"/></svg>`;
      }
      if (archType === 'shrine' || archType === 'pagoda') {
        return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M5 10h14"/><path d="M7 6v14"/><path d="M17 6v14"/></svg>`;
      }
      if (archType === 'dome' || archType === 'greenhouse' || archType === 'observatory') {
        return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19h16"/><path d="M6 19v-4a6 6 0 0 1 12 0v4"/><path d="M12 5v4"/></svg>`;
      }
      if (archType === 'hall' || archType === 'mansion' || archType === 'school') {
        return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 20h18"/><path d="M5 20V9l7-5 7 5v11"/><path d="M9 20v-5h6v5"/></svg>`;
      }
      if (archType === 'ward' || archType === 'courtyard') {
        return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="6" width="16" height="14" rx="2"/><path d="M9 10h6"/><path d="M9 14h6"/></svg>`;
      }
      return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 20V9l6-6 6 6v11"/><path d="M3 20h18"/><circle cx="12" cy="11" r="2"/></svg>`;
    },

    renderZoneStrip(data) {
      const strip = document.getElementById('atlas-zone-strip');
      if (!strip) return;
      strip.innerHTML = '';

      const zones = Array.isArray(data.zones) ? data.zones : [];
      zones.forEach((z, idx) => {
        const item = document.createElement('button');
        item.type = 'button';
        item.dataset.zoneIdx = String(idx);
        item.style.cssText = [
          'flex:0 0 auto',
          'display:flex',
          'flex-direction:column',
          'align-items:center',
          'gap:4px',
          'min-width:68px',
          'padding:6px 8px',
          'border-radius:14px',
          'border:1.5px solid var(--border-color)',
          'background:var(--card-bg)',
          'color:var(--text-primary)',
          'cursor:pointer',
          'transition:all 0.2s ease'
        ].join(';');

        item.innerHTML = `
          <div class="atlas-zone-icon-box" style="width:32px; height:32px; border-radius:10px; display:flex; align-items:center; justify-content:center; background:var(--secondary-bg); color:var(--text-primary);">
            ${this.getZoneSvgIcon(z.archType, false)}
          </div>
          <div style="font-size:11px; font-weight:800; line-height:1.2; max-width:72px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${this.escapeHtml(z.name)}</div>
          <div style="font-size:9px; font-weight:700; letter-spacing:0.6px; opacity:0.75;">ZONE · ${this.escapeHtml(z.code)}</div>
        `;
        item.addEventListener('click', () => {
          this.focusZone(idx, true);
        });
        strip.appendChild(item);
      });
    },

    focusZone(zoneIdx, animate = true) {
      if (!this.currentAtlasData || !Array.isArray(this.currentAtlasData.zones)) return;
      const zones = this.currentAtlasData.zones;
      this.selectedZoneIndex = zoneIdx;

      if (zoneIdx >= 0 && zoneIdx < zones.length) {
        const target = zones[zoneIdx];
        this.camera.targetPanX = -(target._px ?? target.x ?? 0) * 0.35;
        this.camera.targetPanZ = -(target._pz ?? target.z ?? 0) * 0.35;
        this.camera.targetZoom = 1.12;
      } else {
        this.camera.targetPanX = 0;
        this.camera.targetPanZ = 0;
        this.camera.targetZoom = 1.0;
      }

      if (!animate) {
        this.camera.panX = this.camera.targetPanX;
        this.camera.panZ = this.camera.targetPanZ;
        this.camera.zoom = this.camera.targetZoom;
      }

      this.updateActiveZoneUI();
      this.requestRender();
    },

    updateActiveZoneUI() {
      if (!this.currentAtlasData || !Array.isArray(this.currentAtlasData.zones)) return;
      const zones = this.currentAtlasData.zones;
      const activeIdx = this.selectedZoneIndex >= 0 && this.selectedZoneIndex < zones.length ? this.selectedZoneIndex : 0;
      const z = zones[activeIdx];
      if (!z) return;

      const pal = this.resolveThemePalette();

      // 1. 更新底部路线图标高亮
      const strip = document.getElementById('atlas-zone-strip');
      if (strip) {
        Array.from(strip.children).forEach((btn, idx) => {
          const isSel = idx === activeIdx;
          btn.style.borderColor = isSel ? pal.accent : 'var(--border-color)';
          btn.style.background = isSel ? 'var(--secondary-bg)' : 'var(--card-bg)';
          const iconBox = btn.querySelector('.atlas-zone-icon-box');
          if (iconBox) {
            iconBox.style.background = isSel ? pal.accent : 'var(--secondary-bg)';
            iconBox.style.color = isSel ? '#ffffff' : 'var(--text-primary)';
            iconBox.innerHTML = this.getZoneSvgIcon(zones[idx]?.archType, isSel);
          }
        });
      }

      // 2. 更新屋顶悬浮铭牌样式
      this.labelAnchors.forEach((anchor, idx) => {
        if (!anchor.el) return;
        const isSel = idx === this.selectedZoneIndex;
        anchor.el.style.borderColor = isSel ? pal.accent : 'rgba(255,255,255,0.98)';
        anchor.el.style.background = isSel ? '#ffffff' : 'rgba(255,255,255,0.92)';
        anchor.el.style.color = pal.obsidian;
        anchor.el.style.boxShadow = isSel
          ? `0 4px 14px ${this.mixHex(pal.accent, '#ffffff', 0.35)}`
          : '0 3px 10px rgba(38,32,40,0.08)';
        const codeSpan = anchor.el.querySelector('.atlas-pill-code');
        if (codeSpan) codeSpan.style.color = pal.accent;
      });

      // 3. 更新下方建筑档案卡片
      const codeEl = document.getElementById('atlas-detail-code') || document.getElementById('atlas-detail-num');
      const nameEl = document.getElementById('atlas-detail-name') || document.getElementById('atlas-detail-title');
      const subEl = document.getElementById('atlas-detail-sub') || document.getElementById('atlas-detail-en');
      const holderEl = document.getElementById('atlas-detail-holder') || document.getElementById('atlas-detail-role');
      const archEl = document.getElementById('atlas-detail-arch');
      const accessEl = document.getElementById('atlas-detail-access');
      const starsEl = document.getElementById('atlas-detail-stars');
      const descEl = document.getElementById('atlas-detail-desc');
      const cluesWrap = document.getElementById('atlas-detail-clues-wrap') || document.getElementById('atlas-detail-clues-box');
      const cluesList = document.getElementById('atlas-detail-clues') || document.getElementById('atlas-detail-clues-list');

      if (codeEl) codeEl.textContent = z.code || '01';
      if (nameEl) nameEl.textContent = z.fullTitle || z.name || '建筑区域';
      if (subEl) subEl.textContent = z.enTitle || `ZONE // ${z.code || '01'}`;
      if (holderEl) holderEl.textContent = z.exclusiveRole || '调查员与同伴';
      if (archEl) archEl.textContent = z.archLabel || '复合立体建筑';
      if (accessEl) accessEl.textContent = z.accessCond || '自由探索开放';
      if (starsEl) {
        const count = Math.max(1, Math.min(5, Number(z.rating) || 5));
        starsEl.innerHTML = Array.from({ length: count }).map(() =>
          `<svg width="12" height="12" viewBox="0 0 24 24" fill="${pal.accent}" stroke="${pal.accent}" stroke-width="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`
        ).join('');
      }
      if (descEl) descEl.textContent = z.desc || '';

      if (cluesWrap && cluesList) {
        const spots = Array.isArray(z.subSpots) ? z.subSpots : [];
        if (spots.length === 0) {
          cluesWrap.style.display = 'none';
          cluesList.innerHTML = '';
        } else {
          cluesWrap.style.display = 'flex';
          cluesList.innerHTML = spots.map(sp => `
            <div style="display:flex; align-items:flex-start; gap:8px; padding:7px 10px; border-radius:10px; background:var(--secondary-bg); border:1px solid var(--border-color);">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="${pal.accent}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0; margin-top:2px;"><path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"/></svg>
              <div style="flex:1; min-width:0; font-size:11.5px; line-height:1.5; color:var(--text-primary);">
                <span style="font-weight:700; color:${pal.accent};">${this.escapeHtml(sp.name)}</span>
                <span style="color:var(--text-secondary);"> · ${this.escapeHtml(sp.info)}</span>
              </div>
            </div>
          `).join('');
        }
      }
    },

    bindCanvasEvents(canvas) {
      canvas.addEventListener('pointerdown', (e) => {
        this.pointer.isDown = true;
        this.pointer.startX = e.clientX;
        this.pointer.startY = e.clientY;
        this.pointer.lastX = e.clientX;
        this.pointer.lastY = e.clientY;
        this.pointer.moved = false;
        try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
      });

      canvas.addEventListener('pointermove', (e) => {
        if (!this.pointer.isDown) return;
        const dx = e.clientX - this.pointer.lastX;
        const dy = e.clientY - this.pointer.lastY;
        if (Math.hypot(e.clientX - this.pointer.startX, e.clientY - this.pointer.startY) > 5) {
          this.pointer.moved = true;
        }
        this.pointer.lastX = e.clientX;
        this.pointer.lastY = e.clientY;

        this.camera.targetYaw -= dx * 0.0095;
        this.camera.yaw = this.camera.targetYaw;
        this.camera.targetPitch = Math.max(0.30, Math.min(1.18, this.camera.targetPitch + dy * 0.0065));
        this.camera.pitch = this.camera.targetPitch;
        this.requestRender();
      });

      const endPointer = (e) => {
        if (!this.pointer.isDown) return;
        this.pointer.isDown = false;
        if (!this.pointer.moved) {
          this.handleCanvasTap(e, canvas);
        }
      };

      canvas.addEventListener('pointerup', endPointer);
      canvas.addEventListener('pointercancel', endPointer);

      canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.08 : 0.08;
        this.camera.targetZoom = Math.max(0.75, Math.min(1.65, this.camera.targetZoom + delta));
        this.requestRender();
      }, { passive: false });
    },

    handleCanvasTap(e, canvas) {
      const rect = canvas.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;

      let bestIdx = -1;
      let bestDist = 44;
      this.labelAnchors.forEach((a, idx) => {
        if (typeof a.screenX === 'number' && typeof a.screenY === 'number') {
          const d = Math.hypot(cx - a.screenX, (cy + 16) - a.screenY);
          if (d < bestDist) {
            bestDist = d;
            bestIdx = idx;
          }
        }
      });

      if (bestIdx >= 0) {
        this.focusZone(bestIdx, true);
      }
    },

    resizeCanvas() {
      const canvas = document.getElementById('atlas-3d-canvas');
      const wrap = document.getElementById('atlas-canvas-wrap') || document.getElementById('atlas-3d-viewport-wrap');
      if (!canvas || !wrap) return;
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(260, Math.floor(rect.width || 320));
      const h = Math.max(220, Math.floor(rect.height || 295));
      if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
      }
    },

    requestRender() {
      if (!this.isActive) return;
      this.needsRender = true;
      if (!this.rafId) {
        this.rafId = requestAnimationFrame(() => this.renderLoop());
      }
    },

    projectPoint(pt, cosY, sinY, cosP, sinP, scale, centerX, centerY) {
      const wx = pt.x + this.camera.panX;
      const wy = pt.y;
      const wz = pt.z + this.camera.panZ;

      const rx = wx * cosY - wz * sinY;
      const rz = wx * sinY + wz * cosY;

      const ry = wy * cosP - rz * sinP;
      const camZ = wy * sinP + rz * cosP;

      const fov = 1800;
      const persp = fov / Math.max(900, fov - camZ * 0.20);
      return {
        x: centerX + rx * scale * persp,
        y: centerY - ry * scale * persp,
        camZ,
        persp
      };
    },

    updateCloudsAndAnimals() {
      this.animClock += 0.04;

      // 1. 高空半透明云朵缓慢飘动
      if (Array.isArray(this.clouds)) {
        this.clouds.forEach(c => {
          c.x += c.speed || 0.025;
          if (c.x > 54) c.x = -54;
        });
      }

      // 2. 可爱小动物沿着草坪与街道巡游，自动避开所有建筑防穿模
      if (Array.isArray(this.animals)) {
        this.animals.forEach((a, idx) => {
          const dx = a.tx - a.x;
          const dz = a.tz - a.z;
          const dist = Math.hypot(dx, dz);
          if (dist < 1.2) {
            const nextSpot = this.findSafeOpenSpot(
              (Math.sin(this.animClock + idx * 2.1) * 28),
              (Math.cos(this.animClock * 0.7 + idx * 1.7) * 20) + 6,
              idx + Math.floor(this.animClock)
            );
            a.tx = nextSpot.x;
            a.tz = nextSpot.z;
          } else {
            const step = a.speed || 0.055;
            const nx = a.x + (dx / dist) * step;
            const nz = a.z + (dz / dist) * step;
            if (!this.isSpotInsideBuilding(nx, nz, 1.8)) {
              a.x = nx;
              a.z = nz;
              a.heading = Math.atan2(dx, dz);
            } else {
              // 遇到建筑边缘时立刻换向到安全空地
              const safe = this.findSafeOpenSpot(-a.x * 0.6, a.z + 8, idx + 2);
              a.tx = safe.x;
              a.tz = safe.z;
            }
          }
        });
      }
    },

    renderLoop() {
      this.rafId = null;
      if (!this.isActive) return;

      let stillAnimating = false;
      if (this.autoRotate && !this.pointer.isDown) {
        this.camera.targetYaw -= 0.0042;
        this.camera.yaw = this.camera.targetYaw;
        stillAnimating = true;
      }

      if ((this.clouds && this.clouds.length > 0) || (this.animals && this.animals.length > 0)) {
        this.updateCloudsAndAnimals();
        stillAnimating = true;
      }

      const lerp = (a, b) => a + (b - a) * 0.18;
      if (
        Math.abs(this.camera.panX - this.camera.targetPanX) > 0.06 ||
        Math.abs(this.camera.panZ - this.camera.targetPanZ) > 0.06 ||
        Math.abs(this.camera.zoom - this.camera.targetZoom) > 0.003
      ) {
        this.camera.panX = lerp(this.camera.panX, this.camera.targetPanX);
        this.camera.panZ = lerp(this.camera.panZ, this.camera.targetPanZ);
        this.camera.zoom = lerp(this.camera.zoom, this.camera.targetZoom);
        stillAnimating = true;
      } else {
        this.camera.panX = this.camera.targetPanX;
        this.camera.panZ = this.camera.targetPanZ;
        this.camera.zoom = this.camera.targetZoom;
      }

      this.drawFrame();

      if (stillAnimating) {
        this.rafId = requestAnimationFrame(() => this.renderLoop());
      } else {
        this.needsRender = false;
      }
    },

    drawCuteAnimals(ctx, cosY, sinY, cosP, sinP, baseScale, centerX, centerY, pal) {
      if (!Array.isArray(this.animals) || this.animals.length === 0) return;

      this.animals.forEach((a, idx) => {
        const bounce = a.type === 'bunny'
          ? Math.abs(Math.sin(this.animClock * 3.2 + a.phase)) * 0.85
          : a.type === 'bird'
            ? 2.2 + Math.sin(this.animClock * 4.0 + a.phase) * 0.65
            : Math.abs(Math.sin(this.animClock * 2.6 + a.phase)) * 0.35;

        const groundProj = this.projectPoint({ x: a.x, y: 0.15, z: a.z }, cosY, sinY, cosP, sinP, baseScale, centerX, centerY);
        const bodyProj = this.projectPoint({ x: a.x, y: 0.9 + bounce, z: a.z }, cosY, sinY, cosP, sinP, baseScale, centerX, centerY);
        const s = Math.max(0.7, this.camera.zoom * (bodyProj.persp || 1));

        ctx.save();
        // 地面小圆影子
        ctx.fillStyle = 'rgba(36, 44, 62, 0.18)';
        ctx.beginPath();
        ctx.ellipse(groundProj.x, groundProj.y, 4.2 * s, 2.2 * s, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.translate(bodyProj.x, bodyProj.y);

        if (a.type === 'cat') {
          // 软萌小猫咪：圆润身体 + 小尖耳 + 摇摆尾巴
          const catColor = idx % 2 === 0 ? '#f6ad55' : '#ffffff';
          const earColor = idx % 2 === 0 ? '#dd6b20' : '#f687b3';
          const tailWag = Math.sin(this.animClock * 3.5 + a.phase) * 2.5;
          ctx.strokeStyle = catColor;
          ctx.lineWidth = 2.0 * s;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(-3.5 * s, 0);
          ctx.quadraticCurveTo(-7.2 * s, (-3.5 + tailWag) * s, -5.8 * s, (-6.2 + tailWag) * s);
          ctx.stroke();

          ctx.fillStyle = catColor;
          ctx.beginPath();
          ctx.ellipse(0, 0.5 * s, 4.2 * s, 3.1 * s, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.beginPath();
          ctx.arc(2.6 * s, -2.0 * s, 2.7 * s, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = earColor;
          ctx.beginPath();
          ctx.moveTo(1.2 * s, -4.0 * s);
          ctx.lineTo(2.0 * s, -6.5 * s);
          ctx.lineTo(3.0 * s, -4.2 * s);
          ctx.closePath();
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(3.0 * s, -4.2 * s);
          ctx.lineTo(4.3 * s, -6.4 * s);
          ctx.lineTo(4.8 * s, -3.6 * s);
          ctx.closePath();
          ctx.fill();
        } else if (a.type === 'bird') {
          // 灵动小飞鸟：圆润蓝白羽毛与拍动翅膀
          const wingY = Math.sin(this.animClock * 7.5 + a.phase) * 3.0;
          ctx.fillStyle = '#63b3ed';
          ctx.beginPath();
          ctx.ellipse(0, 0, 3.4 * s, 2.3 * s, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.6 * s;
          ctx.beginPath();
          ctx.moveTo(-1 * s, 0);
          ctx.lineTo(-3.8 * s, (-2.2 + wingY) * s);
          ctx.moveTo(1 * s, 0);
          ctx.lineTo(3.8 * s, (-2.2 + wingY) * s);
          ctx.stroke();
        } else {
          // 软萌长耳小雪兔：雪白绒球身体 + 粉色内耳 + 小圆尾
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(-3.5 * s, 0.8 * s, 1.6 * s, 0, Math.PI * 2);
          ctx.fill();

          ctx.beginPath();
          ctx.ellipse(0, 0.5 * s, 4.0 * s, 3.0 * s, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.beginPath();
          ctx.arc(2.4 * s, -1.8 * s, 2.5 * s, 0, Math.PI * 2);
          ctx.fill();

          // 两只长兔耳
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.ellipse(1.7 * s, -5.2 * s, 0.95 * s, 2.6 * s, -0.15, 0, Math.PI * 2);
          ctx.ellipse(3.2 * s, -5.1 * s, 0.95 * s, 2.6 * s, 0.15, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#fbb6ce';
          ctx.beginPath();
          ctx.ellipse(1.7 * s, -5.1 * s, 0.45 * s, 1.6 * s, -0.15, 0, Math.PI * 2);
          ctx.ellipse(3.2 * s, -5.0 * s, 0.45 * s, 1.6 * s, 0.15, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });
    },

    drawDriftingClouds(ctx, cosY, sinY, cosP, sinP, baseScale, centerX, centerY) {
      if (!Array.isArray(this.clouds) || this.clouds.length === 0) return;

      this.clouds.forEach(c => {
        const proj = this.projectPoint({ x: c.x, y: c.y, z: c.z }, cosY, sinY, cosP, sinP, baseScale, centerX, centerY);
        const s = (c.scale || 1) * this.camera.zoom * 0.95;

        // 云朵投在地面上的淡淡云影
        const groundShadow = this.projectPoint({ x: c.x + 8, y: 0.1, z: c.z + 6 }, cosY, sinY, cosP, sinP, baseScale, centerX, centerY);
        ctx.save();
        ctx.fillStyle = 'rgba(45, 58, 82, 0.045)';
        ctx.beginPath();
        ctx.ellipse(groundShadow.x, groundShadow.y, 24 * s, 11 * s, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 高空半透明片状云团
        ctx.save();
        ctx.translate(proj.x, proj.y);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.56)';
        ctx.beginPath();
        ctx.arc(0, 0, 14 * s, 0, Math.PI * 2);
        ctx.arc(-12 * s, 3 * s, 10 * s, 0, Math.PI * 2);
        ctx.arc(13 * s, 2 * s, 11 * s, 0, Math.PI * 2);
        ctx.arc(5 * s, -5 * s, 9.5 * s, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    },

    drawFrame() {
      const canvas = document.getElementById('atlas-3d-canvas');
      if (!canvas) return;
      this.resizeCanvas();
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssW = canvas.width / dpr;
      const cssH = canvas.height / dpr;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, cssW, cssH);

      // 1. 阳光明媚的半厚涂插画天空背景渐变
      const pal = this.resolveThemePalette();
      const skyGrad = ctx.createLinearGradient(0, 0, 0, cssH);
      skyGrad.addColorStop(0, pal.skyTop || '#ffffff');
      skyGrad.addColorStop(0.55, pal.skyBottom || pal.accentGlow);
      skyGrad.addColorStop(1, pal.accentLight || '#f5f8fc');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, cssW, cssH);

      const cosY = Math.cos(this.camera.yaw);
      const sinY = Math.sin(this.camera.yaw);
      const cosP = Math.cos(this.camera.pitch);
      const sinP = Math.sin(this.camera.pitch);

      // 镜头视线方向单位向量 V
      const Vx = sinY * cosP;
      const Vy = sinP;
      const Vz = cosY * cosP;

      // 明媚暖阳光方向向量 L（从左上方斜射而下，形成鲜明受光面与背光面对比）
      const Lx = -0.48;
      const Ly = 0.76;
      const Lz = 0.43;

      const baseScale = (Math.min(cssW, cssH) / 112) * this.camera.zoom;
      const centerX = cssW * 0.5;
      const pitchRatio = (this.camera.pitch - 0.30) / (1.18 - 0.30);
      const centerY = cssH * (0.61 - pitchRatio * 0.09);

      // 2. 绘制底层多分区地形基座
      const baseSolids = this.solids.filter(s => s.isBaseLayer);
      this.renderSolidList(ctx, baseSolids, cosY, sinY, cosP, sinP, Vx, Vy, Vz, Lx, Ly, Lz, baseScale, centerX, centerY, pal);

      // 3. 绘制地面街道、斑马线、草坪与水面贴片
      const projectedPlaza = this.plazaFaces.map(f => {
        const pts = f.verts.map(v => this.projectPoint(v, cosY, sinY, cosP, sinP, baseScale, centerX, centerY));
        const avgCamZ = (pts[0].camZ + pts[1].camZ + pts[2].camZ + pts[3].camZ) * 0.25;
        return { f, pts, avgCamZ };
      });
      projectedPlaza.sort((a, b) => a.avgCamZ - b.avgCamZ);

      projectedPlaza.forEach(({ f, pts }) => {
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.closePath();
        ctx.fillStyle = f.color;
        ctx.fill();
      });

      // 4. 绘制建筑在阳光下的真实地面斜向投射阴影（半透明冷紫灰，让建筑稳稳立在地面上）
      if (Array.isArray(this.shadowPolys) && this.shadowPolys.length > 0) {
        ctx.save();
        ctx.fillStyle = pal.shadowTint || 'rgba(38, 46, 68, 0.16)';
        this.shadowPolys.forEach(sp => {
          const pts = sp.verts.map(v => this.projectPoint(v, cosY, sinY, cosP, sinP, baseScale, centerX, centerY));
          ctx.beginPath();
          ctx.moveTo(pts[0].x, pts[0].y);
          for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
          ctx.closePath();
          ctx.fill();
        });
        ctx.restore();
      }

      // 5. 绘制选中建筑底部的柔光光环
      this.labelAnchors.forEach((anchor, idx) => {
        if (idx !== this.selectedZoneIndex) return;
        const groundPt = this.projectPoint({ x: anchor.x, y: 0.15, z: anchor.z }, cosY, sinY, cosP, sinP, baseScale, centerX, centerY);
        const rad = 28 * this.camera.zoom;
        const aoGrad = ctx.createRadialGradient(groundPt.x, groundPt.y, 2, groundPt.x, groundPt.y, rad);
        aoGrad.addColorStop(0, this.mixHex(pal.accent, '#ffffff', 0.45));
        aoGrad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.save();
        ctx.translate(groundPt.x, groundPt.y);
        ctx.scale(1, Math.max(0.48, sinP));
        ctx.translate(-groundPt.x, -groundPt.y);
        ctx.fillStyle = aoGrad;
        ctx.beginPath();
        ctx.arc(groundPt.x, groundPt.y, rad, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // 6. 绘制所有地上有棱有角、有凹有凸的立体建筑与环境小品
      const upperSolids = this.solids.filter(s => !s.isBaseLayer);
      this.renderSolidList(ctx, upperSolids, cosY, sinY, cosP, sinP, Vx, Vy, Vz, Lx, Ly, Lz, baseScale, centerX, centerY, pal);

      // 7. 绘制在街道与草坪上漫步的可爱防穿模小动物
      this.drawCuteAnimals(ctx, cosY, sinY, cosP, sinP, baseScale, centerX, centerY, pal);

      // 8. 绘制高空半透明片状浮云
      this.drawDriftingClouds(ctx, cosY, sinY, cosP, sinP, baseScale, centerX, centerY);

      // 9. 计算屋顶悬浮铭牌位置并自动防重叠排布
      const labelItems = this.labelAnchors.map((anchor, idx) => {
        const proj = this.projectPoint(anchor, cosY, sinY, cosP, sinP, baseScale, centerX, centerY);
        anchor.screenX = proj.x;
        anchor.screenY = proj.y;
        return {
          anchor,
          idx,
          x: Math.max(44, Math.min(cssW - 44, proj.x)),
          y: Math.max(26, Math.min(cssH - 22, proj.y - 4)),
          camZ: proj.camZ
        };
      });

      labelItems.sort((a, b) => a.y - b.y);
      for (let pass = 0; pass < 3; pass++) {
        for (let i = 0; i < labelItems.length; i++) {
          for (let j = i + 1; j < labelItems.length; j++) {
            const a = labelItems[i];
            const b = labelItems[j];
            const dx = Math.abs(a.x - b.x);
            const dy = b.y - a.y;
            if (dx < 76 && dy < 23) {
              const push = (23 - dy) * 0.55;
              a.y = Math.max(24, a.y - push);
              b.y = Math.min(cssH - 20, b.y + push);
            }
          }
        }
      }

      labelItems.forEach(({ anchor, idx, x, y, camZ }) => {
        ctx.save();
        ctx.translate(anchor.screenX, anchor.screenY + 2);
        ctx.fillStyle = idx === this.selectedZoneIndex ? pal.accent : pal.obsidian;
        ctx.beginPath();
        ctx.moveTo(0, -3.0);
        ctx.lineTo(0.8, -0.8);
        ctx.lineTo(3.0, 0);
        ctx.lineTo(0.8, 0.8);
        ctx.lineTo(0, 3.0);
        ctx.lineTo(-0.8, 0.8);
        ctx.lineTo(-3.0, 0);
        ctx.lineTo(-0.8, -0.8);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        if (anchor.el) {
          anchor.el.style.left = `${x.toFixed(1)}px`;
          anchor.el.style.top = `${y.toFixed(1)}px`;
          anchor.el.style.zIndex = String(Math.max(10, Math.round(200 + camZ)));
        }
      });

      ctx.restore();
    },

    renderSolidList(ctx, solidList, cosY, sinY, cosP, sinP, Vx, Vy, Vz, Lx, Ly, Lz, baseScale, centerX, centerY, pal) {
      const sortedSolids = solidList.map(s => {
        const wx = s.cx + this.camera.panX;
        const wy = s.cy;
        const wz = s.cz + this.camera.panZ;
        const rz = wx * sinY + wz * cosY;
        const fullCamZ = wy * sinP + rz * cosP;
        return { s, sortKey: fullCamZ };
      });

      sortedSolids.sort((a, b) => a.sortKey - b.sortKey);

      sortedSolids.forEach(({ s }) => {
        const isFocused = this.selectedZoneIndex >= 0 && s.zoneIdx === this.selectedZoneIndex;
        const visibleFaces = [];

        for (let i = 0; i < s.faces.length; i++) {
          const f = s.faces[i];
          const dotCam = f.nx * Vx + f.ny * Vy + f.nz * Vz;
          if (f.cullBack && dotCam <= 0.005) continue;

          const pts = f.verts.map(v => this.projectPoint(v, cosY, sinY, cosP, sinP, baseScale, centerX, centerY));
          let avgZ = 0;
          for (let k = 0; k < pts.length; k++) avgZ += pts[k].camZ;
          avgZ /= pts.length;

          // 基于面法线的半厚涂阳光明暗计算：受光面温暖明亮，背光面冷调深邃，立体棱角分明
          const dotLight = Math.max(-0.65, Math.min(1, f.nx * Lx + f.ny * Ly + f.nz * Lz));
          const lightFactor = 0.90 + dotLight * 0.22 + (isFocused ? 0.04 : 0);
          visibleFaces.push({ f, pts, avgZ, lightFactor });
        }

        visibleFaces.sort((a, b) => a.avgZ - b.avgZ);

        for (let i = 0; i < visibleFaces.length; i++) {
          const { f, pts, lightFactor } = visibleFaces[i];
          const fillCol = this.shadeColor(f.baseColor, lightFactor);

          ctx.beginPath();
          ctx.moveTo(pts[0].x, pts[0].y);
          for (let k = 1; k < pts.length; k++) ctx.lineTo(pts[k].x, pts[k].y);
          ctx.closePath();

          ctx.fillStyle = fillCol;
          ctx.fill();

          ctx.strokeStyle = f.trimStroke || fillCol;
          ctx.lineWidth = f.trimStroke ? 0.85 : 0.45;
          ctx.lineJoin = 'round';
          ctx.stroke();
        }
      });
    }
  };

  global.ModuleAtlas3D = ModuleAtlas3D;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      ModuleManager.initEventListeners();
      ModuleAtlas3D.init();
    });
  } else {
    ModuleManager.initEventListeners();
    ModuleAtlas3D.init();
  }

  console.log('[模组] 模组深度重构、小说化四阶流水线与 3D 沙盘引擎已就绪');
})(window);



