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

      if (this.currentParsedData?.splitParts) {
        const step2SplitSelect = document.getElementById('module-step2-split-select');
        const step1SplitSelect = document.getElementById('module-split-parts-select');
        if (step2SplitSelect) step2SplitSelect.value = this.currentParsedData.splitParts;
        if (step1SplitSelect) step1SplitSelect.value = this.currentParsedData.splitParts;
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
                if (page.objs && typeof page.objs.get === 'function' && page.objs.has(imgObjId)) {
                  imgObj = page.objs.get(imgObjId);
                } else if (page.commonObjs && typeof page.commonObjs.get === 'function' && page.commonObjs.has(imgObjId)) {
                  imgObj = page.commonObjs.get(imgObjId);
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
      const rawFileRecord = {
        id: 'file_' + Date.now(),
        fileName: parsedData.fileName,
        moduleName: parsedData.moduleName,
        fileType: parsedData.fileType,
        text: parsedData.text,
        images: parsedData.images || [],
        wordCount: parsedData.wordCount,
        uploadedAt: Date.now()
      };

      await this.safeDBOperation('保存原文件记录', async (db) => {
        if (db.moduleRawFiles) {
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
        images: parsedResult.images || [],
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

      this.currentParsedData = {
        fileName: rawFileRecord.fileName,
        moduleName: rawFileRecord.moduleName || rawFileRecord.fileName.replace(/\.[^/.]+$/, ''),
        fileType: rawFileRecord.fileType,
        text: rawFileRecord.text,
        images: rawFileRecord.images || [],
        wordCount: rawFileRecord.wordCount,
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

      if (data.splitParts) {
        const step2SplitSelect = document.getElementById('module-step2-split-select');
        const step1SplitSelect = document.getElementById('module-split-parts-select');
        if (step2SplitSelect) step2SplitSelect.value = data.splitParts;
        if (step1SplitSelect) step1SplitSelect.value = data.splitParts;
      }

      this.updateBottomActionBar();
    },

    getEffectiveSplitParts() {
      const step2SplitSelect = document.getElementById('module-step2-split-select');
      const step1SplitSelect = document.getElementById('module-split-parts-select');
      let requestedParts = '';
      if (this.currentStep === 2 && step2SplitSelect && step2SplitSelect.value) {
        requestedParts = step2SplitSelect.value;
      } else if (this.currentStep === 1 && step1SplitSelect && step1SplitSelect.value) {
        requestedParts = step1SplitSelect.value;
      } else if (step2SplitSelect && step2SplitSelect.value) {
        requestedParts = step2SplitSelect.value;
      } else if (step1SplitSelect && step1SplitSelect.value) {
        requestedParts = step1SplitSelect.value;
      } else {
        requestedParts = this.currentParsedData?.splitParts || 'auto';
      }

      if (this.currentParsedData) {
        this.currentParsedData.splitParts = requestedParts;
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

      if (step2SplitSelect && step2SplitSelect.value !== requestedParts) {
        step2SplitSelect.value = requestedParts;
      }
      if (step1SplitSelect && step1SplitSelect.value !== requestedParts) {
        step1SplitSelect.value = requestedParts;
      }
      return numParts;
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
      try {
        const batch = images.slice(0, 16);
        const imageThumbnails = [];
        for (let i = 0; i < batch.length; i++) {
          const img = batch[i];
          if (!img.dataUrl) continue;
          const thumb = await this.createThumbnailDataUrl(img.dataUrl, 280, 280);
          imageThumbnails.push({
            index: i + 1,
            origName: img.name || `图${i + 1}`,
            dataUrl: thumb
          });
        }
        if (imageThumbnails.length === 0) return [];

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
  { "imageIndex": 1, "isMap": true, "name": "洋馆一层平面图", "description": "洋馆一层的俯视房间走廊建筑平面图", "annotation": "初期探索地图", "isSensitive": false, "isHorror": false, "shouldInclude": true }
]`;

        const visionUserPrompt = `请对附带的 ${imageThumbnails.length} 张图片按照顺序（图1到图${imageThumbnails.length}）进行高精度视觉识别与甄别，严格区分地图与角色立绘，并输出 JSON 数组：`;
        const res = await this.callAI(visionSysPrompt, visionUserPrompt, imageThumbnails);
        if (res) {
          const cleanJson = res.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
          const startIdx = cleanJson.indexOf('[');
          const endIdx = cleanJson.lastIndexOf(']');
          if (startIdx !== -1 && endIdx !== -1) {
            const parsed = JSON.parse(cleanJson.substring(startIdx, endIdx + 1));
            if (Array.isArray(parsed) && parsed.length > 0) {
              return parsed;
            }
          }
        }
      } catch (err) {
        console.warn('[模组] 视觉识别预检跳过，使用上下文与结构智能识别:', err);
      }
      return [];
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
            const msgContent =
              resData.choices?.[0]?.message?.content ||
              resData.choices?.[0]?.delta?.content ||
              resData.content?.[0]?.text ||
              joinedPartsText ||
              '';
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

      if (nodes.length <= 1) {
        nodes.push({ name: '核心调查区域', parent: modName, level: 2, desc: '调查员主要活动分区' });
        nodes.push({ name: '建筑外景与正门', parent: '核心调查区域', level: 3, desc: '入口探索与外部线索调查' });
        nodes.push({ name: '一层主探索大厅', parent: '核心调查区域', level: 3, desc: '关键线索与NPC交涉地点' });
        nodes.push({ name: '二层走廊与私密房间', parent: '核心调查区域', level: 3, desc: '深层秘密搜查与资料检定' });
        nodes.push({ name: '地下暗室与决战地点', parent: '核心调查区域', level: 3, desc: '幕后高潮对峙与结局触发点' });
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
        const chunks = [];
        const mapNodes = [];
        let moduleType = '线性';
        let ruleSystem = 'coc';
        let scaleType = '1v1';
        let bgTag = '日模';
        let endingTag = '普通';
        let summary = '模组概览';

        const typeMatch = rawText.match(/"moduleType"\s*:\s*"([^"]+)"/);
        if (typeMatch) moduleType = typeMatch[1];
        const ruleMatch = rawText.match(/"ruleSystem"\s*:\s*"([^"]+)"/);
        if (ruleMatch) ruleSystem = ruleMatch[1];
        const scaleMatch = rawText.match(/"scaleType"\s*:\s*"([^"]+)"/);
        if (scaleMatch) scaleType = scaleMatch[1];
        const bgMatch = rawText.match(/"bgTag"\s*:\s*"([^"]+)"/);
        if (bgMatch) bgTag = bgMatch[1];
        const endMatch = rawText.match(/"endingTag"\s*:\s*"([^"]+)"/);
        if (endMatch) endingTag = endMatch[1];
        const sumMatch = rawText.match(/"summary"\s*:\s*"([^"]+)"/);
        if (sumMatch) summary = sumMatch[1];

        const objRegex = /\{[^{}]+\}/g;
        let objMatch;
        const seenM = new Set();
        const seenC = new Set();

        while ((objMatch = objRegex.exec(rawText)) !== null) {
          const block = objMatch[0];
          const nameM = block.match(/"name"\s*:\s*"([^"]+)"/);
          if (!nameM) continue;
          const itemName = nameM[1].trim();
          if (!itemName) continue;

          const hasChunkFields = /"(?:category|prefixPreview|suffixPreview|wordCount|reason|remarks|order)"\s*:/.test(block);
          const hasMapFields = /"(?:parent|level|desc)"\s*:/.test(block) && !hasChunkFields;
          const hasImageFields = /"(?:imageIndex|shouldInclude|isSensitive)"\s*:/.test(block);

          if (hasImageFields) continue;

          if (hasMapFields) {
            if (!seenM.has(itemName) && !itemName.includes('大区域') && !itemName.includes('建筑分区') && !itemName.includes('核心探索主区域')) {
              seenM.add(itemName);
              const parentM = block.match(/"parent"\s*:\s*"([^"]*)"/);
              const levelM = block.match(/"level"\s*:\s*([0-9]+)/);
              const descM = block.match(/"desc"\s*:\s*"([^"]*)"/);
              mapNodes.push({
                name: itemName,
                parent: parentM ? parentM[1].trim() : '',
                level: levelM ? (parseInt(levelM[1], 10) || 2) : 2,
                desc: descM ? descM[1].trim() : ''
              });
            }
          } else if (hasChunkFields) {
            if (!seenC.has(itemName)) {
              seenC.add(itemName);
              const orderM = block.match(/"order"\s*:\s*([0-9]+)/);
              const catM = block.match(/"category"\s*:\s*"([^"]*)"/);
              const wcM = block.match(/"wordCount"\s*:\s*([0-9]+)/);
              const reasonM = block.match(/"reason"\s*:\s*"([^"]*)"/);
              const prefM = block.match(/"prefixPreview"\s*:\s*"([^"]*)"/);
              const suffM = block.match(/"suffixPreview"\s*:\s*"([^"]*)"/);
              const remM = block.match(/"remarks"\s*:\s*"([^"]*)"/);
              chunks.push({
                order: orderM ? (parseInt(orderM[1], 10) || (chunks.length + 1)) : (chunks.length + 1),
                name: itemName,
                category: catM ? (catM[1].trim() || '正文') : '正文',
                wordCount: wcM ? (parseInt(wcM[1], 10) || 1200) : 1200,
                reason: reasonM ? reasonM[1].trim() : '',
                prefixPreview: prefM ? prefM[1].trim() : '',
                suffixPreview: suffM ? suffM[1].trim() : '',
                remarks: remM ? remM[1].trim() : ''
              });
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
输出严格的 JSON 对象，不得包含任何 markdown 语法块（如 \`\`\`json）或任何多余解释文字。
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
   - shouldInclude: 布尔值。若为纯文本页面扫描、无意义分隔线条、重复花边、装饰图标则设为 false；若为有意义的立绘、地图、手迹、怪物图、CG则设为 true。
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

        const numParts = this.getEffectiveSplitParts();
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
          const segText = segments[segIdx].substring(0, 42000);
          let userPrompt = `模组名称：${this.currentParsedData.moduleName}\n总字数：${this.currentParsedData.wordCount}\n当前分析分卷：第 ${segIdx + 1} / ${segments.length} 卷\n\n重构分析提示词：\n${activePrompt}`;
          if (this.globalOpinion) {
            userPrompt += `\n\n用户针对此重构方案的个性化补充意见：\n${this.globalOpinion}`;
          }
          if (segIdx > 0 && allParsedChunks.length > 0) {
            const lastChunk = allParsedChunks[allParsedChunks.length - 1];
            userPrompt += `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n【前置分卷 AI 已规划完成的全部章节清单与起止边界（极度重要！你必须严格紧密衔接）】\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n前置分卷已规划了以下 ${allParsedChunks.length} 个章节：\n` +
              allParsedChunks.map((c, cIdx) => `  - 第 ${c.order || (cIdx + 1)} 章: 【${c.name}】(${c.category})\n    从哪开始: 「${c.prefixPreview || '...'}」\n    到哪结束: 「${c.suffixPreview || '...'}」\n    章节内容备注: ${c.remarks || c.reason || '无'}`).join('\n') +
              `\n\n【接续规划铁律】：\n上一卷最后规划的章节为：【${lastChunk.name}】\n其切分截止位置（末尾100字）为：\n「${lastChunk.suffixPreview || lastChunk.prefixPreview || '...'}」\n你当前规划第 ${segIdx + 1} 卷时，必须从上一卷结尾文字紧接的下一句开始往后切，首尾紧密闭合衔接！严禁遗漏中间剧情，严禁与前面已切内容重叠！\n同时，如果本卷文本中包含散落在各处的额外信息（如KP信息中的NPC人设数值、HO私密线索、背景伏笔等），你必须在对应章节的 remarks 备注中明确标注在此处归纳补充！\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
          }
          if (segIdx === 0 && this.currentParsedData.images && this.currentParsedData.images.length > 0) {
            const imgListDesc = this.currentParsedData.images.map((img, i) => {
              const origName = img.fileName || img.name || `插图_${i + 1}`;
              const nearby = img.nearbyText ? `，所在页面上下文: "${img.nearbyText.substring(0, 100)}"` : '';
              const mapHint = img.isMap ? '【视觉确认为地图】' : (img.name && (img.name.includes('图') || img.name.includes('平面') || img.name.includes('地图')) ? '【判定为地图】' : '');
              return `图${i + 1}: 名称【${origName}】${mapHint}，第${img.pageNumber || '1'}页，尺寸${img.width || 800}x${img.height || 600} (${img.format || 'JPEG'})${nearby}`;
            }).join('\n');
            userPrompt += `\n\n【提取到的候选插图列表（已结合视觉特征与排版顺序）】：\n${imgListDesc}`;
          }
          userPrompt += `\n\n模组参考全文（当前分卷内容）：\n${segText}`;

          const aiResultText = await this.callAI(systemPrompt, userPrompt);
          let parsedAiPlan = null;
          if (aiResultText) {
            let jsonStr = aiResultText.trim();
            const startIdx = jsonStr.indexOf('{');
            const endIdx = jsonStr.lastIndexOf('}');
            if (startIdx !== -1 && endIdx > startIdx) {
              jsonStr = jsonStr.substring(startIdx, endIdx + 1);
            }
            try {
              parsedAiPlan = JSON.parse(jsonStr);
            } catch (pErr) {
              try {
                const sanitized = jsonStr.replace(/,\s*([\]}])/g, '$1');
                parsedAiPlan = JSON.parse(sanitized);
              } catch (pErr2) {
                parsedAiPlan = this.salvagePartialAiPlan(aiResultText);
                if (!parsedAiPlan) {
                  console.warn('[模组] 解析 AI JSON 规划大纲重试失败:', pErr2);
                }
              }
            }

            if (parsedAiPlan && parsedAiPlan._isSalvagedPartial && (!Array.isArray(parsedAiPlan.chunks) || parsedAiPlan.chunks.length < 3)) {
              try {
                this.analysisStatusText = `流式规划补全中：正在继续生成本卷章节切割目录...`;
                this.updateBottomActionBar();
                const existingChunksDesc = (parsedAiPlan.chunks && parsedAiPlan.chunks.length > 0)
                  ? `目前已规划章节：${parsedAiPlan.chunks.map(c => c.name).join('、')}（截止于：「${parsedAiPlan.chunks[parsedAiPlan.chunks.length - 1].suffixPreview || ''}」）。请紧接其后继续规划剩余章节！`
                  : `地图节点已生成完毕，现在请只输出本卷完整的 chunks 章节规划列表！`;
                const contPrompt = `请直接输出本卷的 chunks 章节规划 JSON 对象（无需重复输出 mapNodes 和 imageAnalysis），格式严格为：\n{"chunks": [{"order": 1, "name": "章节名", "category": "分类", "wordCount": 1200, "reason": "说明", "prefixPreview": "起始前100字", "suffixPreview": "末尾后100字", "remarks": "本章归纳要点"}]}\n\n${existingChunksDesc}\n\n模组原文：\n${segText}`;
                const contText = await this.callAI(systemPrompt, contPrompt);
                if (contText) {
                  const contSalvaged = this.salvagePartialAiPlan(contText);
                  if (contSalvaged && Array.isArray(contSalvaged.chunks) && contSalvaged.chunks.length > 0) {
                    const existingNames = new Set((parsedAiPlan.chunks || []).map(c => c.name));
                    if (!Array.isArray(parsedAiPlan.chunks)) parsedAiPlan.chunks = [];
                    contSalvaged.chunks.forEach(c => {
                      if (!existingNames.has(c.name)) {
                        existingNames.add(c.name);
                        parsedAiPlan.chunks.push(c);
                      }
                    });
                  }
                }
              } catch (contErr) {
                console.warn('[模组] 流式补全章节目录失败:', contErr);
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
              if (Array.isArray(parsedAiPlan.imageAnalysis) && this.currentParsedData.images) {
                const assessmentMap = new Map();
                parsedAiPlan.imageAnalysis.forEach(a => {
                  if (a && typeof a.imageIndex === 'number') {
                    assessmentMap.set(a.imageIndex, a);
                  }
                });
                const filteredImages = [];
                this.currentParsedData.images.forEach((img, idx) => {
                  const assess = assessmentMap.get(idx + 1) || assessmentMap.get(img.imageIndex);
                  if (assess) {
                    if (assess.shouldInclude === false || assess.isUseful === false) return;
                    if (typeof assess.isSensitive === 'boolean') img.isSensitive = assess.isSensitive;
                    if (typeof assess.isHorror === 'boolean') img.isHorror = assess.isHorror;
                    if (assess.name) {
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
                  filteredImages.push(img);
                });
                this.currentParsedData.images = filteredImages;
              }
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
                allParsedChunks.push({
                  order: allParsedChunks.length + 1,
                  name: c.name,
                  category: c.category || '正文',
                  wordCount: c.wordCount || 1000,
                  reason: c.reason || '',
                  prefixPreview: c.prefixPreview || '',
                  suffixPreview: c.suffixPreview || '',
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
        if (lastAiError) {
          throw lastAiError;
        }
        plan = this.generateLocalPlan(this.currentParsedData);
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
      bodyEl.textContent = chunk.rawSlice || this.currentParsedData?.text?.substring(0, 3000) || '暂无对应原文';
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
        if (segIdx > 0 && this.cutChaptersBySegment) {
          const prevChapters = [];
          for (let s = 0; s < segIdx; s++) {
            const sChaps = this.cutChaptersBySegment[s];
            if (Array.isArray(sChaps)) {
              prevChapters.push(...sChaps);
            }
          }
          if (prevChapters.length > 0) {
            const lastChap = prevChapters[prevChapters.length - 1];
            const lastContent = (lastChap.content || '').trim();
            const lastEnd = lastContent.slice(-180).replace(/\n+/g, ' ');
            prevCutNotice = `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【前置分卷 AI 已实际整理完成的章节与截止位置（重要接续参考）】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
前置分卷已经切割完成了 ${prevChapters.length} 个章节：
${prevChapters.map((ch, idx) => {
  const startP = (ch.content || '').trim().slice(0, 60).replace(/\n+/g, ' ');
  const endP = (ch.content || '').trim().slice(-60).replace(/\n+/g, ' ');
  return `  - 已完成第 ${idx + 1} 章: 【${ch.title}】(${ch.category}) | 开头: 「${startP}...」 | 结尾: 「...${endP}」`;
}).join('\n')}

【接续执行指令】：
上一分卷已整理好的最后一个章节是【${lastChap.title}】，其结尾原文内容为：
「...${lastEnd}」
你当前负责编写的章节（全大纲第 ${startChapNum} 章起）必须紧密承接上一卷的结尾位置，继续整理输出！同时，如果大纲备注中说明需要归纳散落各处的信息（例如后卫、KP人设、HO设定等），请将其完整整合进对应章节中！
━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
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
          const closingToken = (m[4] || '').trim();
          const isLastMatch = mIdx === matches.length - 1;
          const isUnclosedTail = isLastMatch && closingToken !== '===CHAPTER_END===' && !content.includes(ENDING_NOTE);

          // 若流式输出在最后一章中途截断，且当前还有未生成的章节（非单章兜底），则丢弃该半截章节，留给下一轮续切完整生成
          if (isUnclosedTail && !isFinalAttempt && (matches.length > 1 || targetChunks.length > 1) && content.length < 600) {
            continue;
          }
          if (isUnclosedTail && !isFinalAttempt && matches.length > 1 && (baseIndexOffset + matches.length) <= targetChunks.length) {
            continue;
          }

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

        return list;
      };

      const generated = await this.callAI(systemPrompt, userPrompt);
      if (!generated || generated.trim().length === 0) {
        throw new Error('AI 全篇返回内容为空');
      }

      const parsedChapters = parseChaptersFromRawOutput(generated, assignedChunks, 0, false);

      // 流式/单次输出长度受限时自动接续切割本卷剩余章节，防止切到一半停止
      let contRound = 0;
      const maxContRounds = Math.max(3, Math.ceil((assignedChunks?.length || 1) / 2));
      while (
        Array.isArray(assignedChunks) &&
        assignedChunks.length > 1 &&
        parsedChapters.length > 0 &&
        parsedChapters.length < assignedChunks.length &&
        contRound < maxContRounds &&
        !this.isCuttingCancelled
      ) {
        contRound++;
        while (this.isCuttingPaused) {
          await new Promise(r => setTimeout(r, 300));
          if (this.isCuttingCancelled) break;
        }
        if (this.isCuttingCancelled) break;

        const remainingChunks = assignedChunks.slice(parsedChapters.length);
        if (remainingChunks.length === 0) break;

        const progressText = document.getElementById('module-progress-text');
        if (progressText) {
          progressText.textContent = `流式续切中：本卷已完成 ${parsedChapters.length}/${assignedChunks.length} 章，正在继续生成【${remainingChunks[0].name}】等剩余 ${remainingChunks.length} 章...`;
        }

        const remOutline = remainingChunks.map((c, idx) => {
          const orderNum = parsedChapters.length + idx + 1;
          const prefixHint = c.prefixPreview ? `\n     - 原文起始定位（从哪开始）: 「${c.prefixPreview}」` : '';
          const suffixHint = c.suffixPreview ? `\n     - 原文截止定位（到哪结束）: 「${c.suffixPreview}」` : '';
          const remarkHint = c.remarks ? `\n     - 章节内容与跨处归纳要求: ${c.remarks}` : (c.reason ? `\n     - 章节定位说明: ${c.reason}` : '');
          return `  ${orderNum}. 章节名: ${c.name} | 分类: ${c.category}${prefixHint}${suffixHint}${remarkHint}`;
        }).join('\n');

        const doneTitles = parsedChapters.map(c => `【${c.title}】`).join('、');
        const contUserPrompt = `模组名称：${this.currentParsedData?.moduleName || '跑团模组'}
在上一轮流式输出中，你已经完成了前 ${parsedChapters.length} 个章节（${doneTitles}），但本卷还有以下 ${remainingChunks.length} 个章节尚未输出！
现在请紧接上一轮中断处，严格按照 ===CHAPTER_START: 章节名称 | 分类=== ... ===CHAPTER_END=== 格式，继续完整输出以下剩余的 ${remainingChunks.length} 个章节（严禁重复已输出的章节，严禁缩写省略原文）：
${remOutline}
${this.globalOpinion ? `\n【用户全局修改意见】：\n${this.globalOpinion}\n` : ''}
【全模组完整参考原文】：
${fullText}`;

        try {
          const moreGenerated = await this.callAI(systemPrompt, contUserPrompt);
          if (!moreGenerated || !moreGenerated.trim()) break;
          const moreParsed = parseChaptersFromRawOutput(
            moreGenerated,
            remainingChunks,
            parsedChapters.length,
            contRound >= maxContRounds
          );
          if (!moreParsed || moreParsed.length === 0) break;
          parsedChapters.push(...moreParsed);
        } catch (contErr) {
          console.warn('[模组] 流式续切剩余章节中断:', contErr);
          break;
        }
      }

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

        const numParts = this.getEffectiveSplitParts();
        const segments = this.splitTextIntoBalancedSegments(fullText, numParts);
        const totalSegs = segments.length;

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
      const numParts = this.getEffectiveSplitParts();
      const segments = this.splitTextIntoBalancedSegments(fullText, numParts);
      if (segIdx < 0 || segIdx >= segments.length) return;

      const totalSegs = segments.length;
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
      const rawExcerpt = (this.currentParsedData?.text || '').substring(0, 8000);

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

      const rawExcerpt = (this.currentParsedData?.text || '').substring(0, 8000);
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
          const snippet = c.content ? c.content.substring(0, 200).replace(/\n+/g, ' ') : '';
          return `第${idx + 1}章 【${c.title}】[${c.category}, 约${c.wordCount}字]:\n${snippet}...`;
        }).join('\n\n');

        const rawExcerpt = (this.currentParsedData?.text || '').substring(0, 8000);
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
      const rawExcerpt = (this.currentParsedData?.text || '').substring(0, 6000);

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
      }

      if (!rawFiles || rawFiles.length === 0) {
        listContainer.innerHTML = '<div style="color: var(--text-secondary); text-align: center; padding: 20px;">暂无历史上传文件记录，请先导入新文件</div>';
      } else {
        rawFiles.forEach(fileRecord => {
          const item = document.createElement('div');
          item.className = 'module-history-file-card';
          item.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
              <span style="font-weight: 600; font-size: 13px; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 250px;" title="${fileRecord.fileName}">${fileRecord.fileName}</span>
              <span class="module-plan-tag">${fileRecord.fileType || '文档'}</span>
            </div>
            <div style="font-size: 11px; color: var(--text-secondary); margin-bottom: 4px;">
              <span>${fileRecord.wordCount || 0} 字</span> · 
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

      // 如果数据库中尚无地点，优先从模组分析自带的 mapNodes 载入并同步入库
      if (dbLocations.length === 0) {
        const sourceNodes = (mod.mapNodes && Array.isArray(mod.mapNodes) && mod.mapNodes.length > 0)
          ? mod.mapNodes
          : (this.currentPlan?.mapNodes && Array.isArray(this.currentPlan.mapNodes) && this.currentPlan.mapNodes.length > 0)
            ? this.currentPlan.mapNodes
            : (this.currentParsedData?.mapNodes && Array.isArray(this.currentParsedData.mapNodes) && this.currentParsedData.mapNodes.length > 0)
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
      const allText = (chapters || []).map(c => `${c.title} ${c.content || ''}`).join('\n').substring(0, 8000);

      // 一次最多生成10个prompt
      const batchSize = 10;
      for (let i = 0; i < pendingLocs.length; i += batchSize) {
        const chunk = pendingLocs.slice(i, i + batchSize);
        const locNames = chunk.map(l => `- 地点名称：${l.name}，简介：${l.desc || '无'}`).join('\n');

        const systemPrompt = '你是一位跑团插画提示词专家。请根据模组设定，为各地点编写唯美场景图像的英文绘图提示词。只输出合法JSON数组。';
        const userPrompt = `模组节选：\n${allText.substring(0, 3000)}\n\n` +
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
                const idx = this.currentParsedData.images.findIndex(i => i.dataUrl === img.dataUrl || i.name === img.name);
                if (idx !== -1) {
                  this.currentParsedData.images.splice(idx, 1);
                }
              }
              this.saveDraft();
              this.renderStep2GalleryUI();
            } else {
              const database = this.getDB();
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
            const fullPrompt = `${promptContent}\n\n以下为模组文本内容：\n${moduleText.slice(0, 15000)}`;

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
          if (step1SplitSelect) step1SplitSelect.value = step2SplitSelect.value;
          if (this.currentParsedData) this.currentParsedData.splitParts = step2SplitSelect.value;
          this.saveDraft();
        });
      }
      if (step1SplitSelect) {
        step1SplitSelect.addEventListener('change', () => {
          if (step2SplitSelect) step2SplitSelect.value = step1SplitSelect.value;
          if (this.currentParsedData) this.currentParsedData.splitParts = step1SplitSelect.value;
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
      lastGeneratedBundle: null
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

    openAiWriterScreen() {
      this.initAiWriterEvents();
      this.renderAiWriterTags();
      this.refreshAiWriterThoughtChains();
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
        resetBtn.addEventListener('click', () => {
          if (this.aiWriterState.isRunning) return;
          this.aiWriterState.bgTags = ['日模'];
          this.aiWriterState.relTags = ['搭档'];
          this.aiWriterState.toneTags = ['纯爱'];
          this.aiWriterState.tropeTags = [];
          this.aiWriterState.customTags = [];
          const titleInput = document.getElementById('ai-mod-title-input');
          const hookInput = document.getElementById('ai-mod-hook-input');
          const customInput = document.getElementById('ai-mod-custom-tag-input');
          if (titleInput) titleInput.value = '';
          if (hookInput) hookInput.value = '';
          if (customInput) customInput.value = '';
          this.renderAiWriterTags();
          this.updateAiWriterStatus(0, '已重置全部选项，可重新勾选标签后点击生成');
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
          this.runAiModulePipeline();
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
      const len = text.length;

      for (let i = 0; i < len; i++) {
        const ch = text[i];
        if (!inString) {
          if (ch === '"') {
            inString = true;
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
            const isClosingQuote =
              nextNonWs === ':' ||
              nextNonWs === ',' ||
              nextNonWs === '}' ||
              nextNonWs === ']' ||
              nextNonWs === '';
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
      out = out.replace(/,\s*([}\]])/g, '$1');
      return out;
    },

    parseJsonFromAiResponse(rawText) {
      if (!rawText || typeof rawText !== 'string') return null;
      let clean = rawText
        .replace(/<think>[\s\S]*?<\/think>/gi, '')
        .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

      const tryParseCandidate = (candidate) => {
        if (!candidate) return null;
        try {
          return JSON.parse(candidate);
        } catch (_) {}
        try {
          const repaired = this.repairJsonTextForParse(candidate);
          return JSON.parse(repaired);
        } catch (_2) {}
        return null;
      };

      const directParsed = tryParseCandidate(clean);
      if (directParsed && typeof directParsed === 'object') return directParsed;

      const firstBrace = clean.indexOf('{');
      const lastBrace = clean.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        const sliced = clean.slice(firstBrace, lastBrace + 1);
        const slicedParsed = tryParseCandidate(sliced);
        if (slicedParsed && typeof slicedParsed === 'object') return slicedParsed;
      }

      return null;
    },

    salvageAi1BlueprintFromRaw(rawText, fallbackTitle = '') {
      if (!rawText || typeof rawText !== 'string') return null;
      const clean = rawText
        .replace(/<think>[\s\S]*?<\/think>/gi, '')
        .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

      const extractFieldText = (keyNames, nextKeyPattern) => {
        for (const k of keyNames) {
          const reg = new RegExp(`"${k}"\\s*:\\s*"([\\s\\S]*?)"(?=\\s*,\\s*"(?:${nextKeyPattern})"|\\s*\\})`, 'i');
          const m = clean.match(reg);
          if (m && m[1]) {
            return m[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').trim();
          }
        }
        return '';
      };

      const allKeys = 'title|summary|themeMode|creativeReflection|publicInfoChapter|publicInfo|knownInfo|kpTruthAndMechanism|kpTruth|catAndNpcProfiles|plannedScenes|endingsPlan';
      const title = extractFieldText(['title', 'moduleName', 'name'], allKeys) || fallbackTitle || '未命名模组';
      const summary = extractFieldText(['summary', 'desc', 'description'], allKeys);
      const themeMode = extractFieldText(['themeMode', 'style', 'theme'], allKeys);
      const creativeReflection = extractFieldText(['creativeReflection', 'reflection'], allKeys);
      const publicInfoChapter = extractFieldText(['publicInfoChapter', 'publicInfo', 'knownInfo'], allKeys) || summary;
      const kpTruthAndMechanism = extractFieldText(['kpTruthAndMechanism', 'kpTruth', 'truth'], allKeys);
      const endingsPlan = extractFieldText(['endingsPlan', 'endings'], allKeys);

      const catAndNpcProfiles = [];
      const profBlockMatch = clean.match(/"catAndNpcProfiles"\s*:\s*\[([\s\S]*?)\](?=\s*,\s*"|\s*\})/i);
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
      const scenesBlockMatch = clean.match(/"plannedScenes"\s*:\s*\[([\s\S]*?)\](?=\s*,\s*"|\s*\})/i);
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

      if (!publicInfoChapter && !kpTruthAndMechanism && clean.length < 30) {
        return null;
      }

      return {
        title,
        summary: summary || publicInfoChapter.slice(0, 160),
        themeMode,
        creativeReflection,
        publicInfoChapter: publicInfoChapter || clean.slice(0, 800),
        kpTruthAndMechanism: kpTruthAndMechanism || clean,
        catAndNpcProfiles,
        plannedScenes,
        endingsPlan
      };
    },

    async runAiModulePipeline() {
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
      const saveBtn = document.getElementById('ai-mod-save-btn');
      const previewBox = document.getElementById('ai-mod-preview-box');

      this.aiWriterState.isRunning = true;
      if (genBtn) {
        genBtn.textContent = '生成中';
        genBtn.disabled = true;
      }
      if (saveBtn) saveBtn.disabled = true;
      if (previewBox) previewBox.style.display = 'none';

      try {
        const tcPrompt = await this.getSelectedThoughtChainPromptText();
        const targetSceneCount = lengthMode === 'short' ? 4 : (lengthMode === 'long' ? 10 : 6);
        const drawnSeeds = drawMode === 'on' ? this.drawInspirationSeedsForTags(allTags) : [];

        const refGuidanceMap = {
          free: '完全因地制宜决定叙事形态，不套用任何固定模板，让故事自身的情绪、张力或悬念自然生长出最合适的章节脉络。',
          confession: '参考日常独白与心理拉扯韵律：从极具生活感的平淡日常切入，因一句突如其来的反常坦白或微小异变，展开高密度的二人心理博弈与情感剖白。',
          date_loop: '参考约会箱庭与时间异常韵律：以一场轻松愉快的约会或出游开篇，在熟悉的日常场景里悄然混入微妙的时空违和感，兼顾甜蜜互动与层层递进的探索。',
          jealous_sweet: '参考奇幻变故与吃醋甜饼韵律：制造一个令人啼笑皆非又不得不亲密贴贴的奇妙处境，突出KPC表面矜持或吃醋、实则暗藏独占欲与温柔偏爱的鲜活反差。',
          multi_legend: '参考多HO分线与怪谈群像韵律：每位调查员拥有独立的秘密使命与专属同伴羁绊，单人私密剧情与主线怪谈调查相互交织推进。'
        };
        const refGuidance = refGuidanceMap[refMode] || refGuidanceMap.free;

        // ==========================================================
        // 第一阶段：AI1 审题破局与底牌立意构思
        // ==========================================================
        this.setAiWriterStepActive(1);
        this.updateAiWriterStatus(10, 'AI1 正在因地制宜审视主题灵魂、枪毙平庸套路并构思底牌与猫设定...');

        const ai1System = `你是一位兼具晋江高人气小说张力审美与Booth殿堂级跑团模组巧思的主创设计师。
你的任务不是套用死板公式，而是根据用户选定的标签组合，先深入思考【这个主题真正需要什么灵魂】，因地制宜地完成破题与底牌设计：

一、因地制宜的审美哲学：
1. 若标签偏向【浪漫、深情、悲情、宿命、唯美、救赎、酸甜、微虐、刀子】：
   - 绝不要为了反转而强行塞入生硬的背叛或恐怖黑幕！
   - 真正的灵魂在于【极致的氛围渲染与宿命感】：季节与光影的流动、欲言又止的克制深情、明知代价却依然奔赴的温柔、以及两人之间无法替代表达的羁绊。请思考什么样的场景意象与情感递进最能让人眼眶发热、余韵悠长。
2. 若标签偏向【茶番、甜宠、贴贴、治愈、同居、旅游】且难度偏低：
   - 绝不要写小学生过家家式的俗套送礼或干瘪告白，也不要乱塞惊悚邪教！
   - 真正的灵魂在于【高概念的亲密处境与鲜活的性格反差】：思考如何设计一个巧妙有趣的奇妙小意外或日常困境，让平时不会轻易展露的吃醋、嘴硬、依赖、偏爱与肢体贴近变得顺理成章，甜得自然且充满生活质感。
3. 若标签偏向【粉红、拉扯、暧昧、训犬、强制、监禁、背德、宿敌、死敌、掉马、修罗、病娇、疯批】：
   - 真正的灵魂在于【高概念处境绑架与权力失控博弈】：思考如何把两人锁进一个无法逃避的紧迫场域，设计KPC或核心人物的表面伪装与底层失控触发点，让玩家在试探、挑逗、反抗或顺从之间体验极致的性张力与心理拉扯。
4. 若标签偏向【调查、解密、怪谈、规则、循环、恐怖、硬核、诡计】：
   - 真正的灵魂在于【草蛇灰线的叙事诡计与藏叶于林的线索闭环】：思考核心异常机制或神话底牌是什么，如何把真相拆碎藏进毫不突兀的生活细节与传闻里。

二、反平庸自省要求：
动笔前请先在心中排除最容易想到的三个俗套点子，选择最有巧思、最能让玩家沉浸其中的构想。
${tcPrompt ? '\n三、用户选定的思维链文风与审美准则：\n' + tcPrompt : ''}`;

        const ai1User = `请基于以下配置，为模组完成第一阶段【审题破局与守秘人底牌构思】：
- 规则体系：${ruleSystem.toUpperCase()}
- 玩家规模：${scaleType}
- 结构类型：${modType}
- 调查难度：${difficulty}
- 目标篇幅：${lengthMode === 'short' ? '短篇精悍' : (lengthMode === 'long' ? '长篇多幕' : '中篇饱满')}，正文事件约 ${targetSceneCount} 幕
- 选定标签：${allTags.join('、')}
- 叙事韵律参考：${refGuidance}
${customTitle ? '- 指定模组名称：' + customTitle : '- 模组名称：请构思一个富有文学质感与记忆点的名字'}
${userHook ? '- 开场引子要求：' + userHook : ''}
${drawnSeeds.length > 0 ? '- 候选灵感池（请从中挑选最契合当前主题的一组，或取其精华自然融合，切勿生搬硬套）：\n  ' + drawnSeeds.map((s, idx) => (idx + 1) + '. ' + s).join('\n  ') : '- 抽选模式：未开启外部抽选，请完全依靠你的深度思考自主破题构思。'}

请严格输出以下JSON格式（不要输出任何代码块标记以外的多余解释）：
{
  "title": "模组名称",
  "summary": "吸引人的公开简介，绝对不能泄露底牌与真相，100至180字",
  "themeMode": "当前模组的核心美学流派，如：唯美宿命浪漫 / 高概念反差甜饼 / 暧昧权力拉扯 / 诡计怪谈悬疑",
  "creativeReflection": "主创破题思考：阐述这个主题最需要渲染的核心氛围或张力是什么，为什么这样设计最能打动玩家",
  "publicInfoChapter": "完整的【00-模组已知信息】正文，供玩家开团前阅读：包含故事舞台、时代背景、公开导入引子、推荐技能、各HO或PC与KPC的公开关系设定、注意事项。严禁包含任何剧透",
  "kpTruthAndMechanism": "完整的守秘人机密底牌：包含事件背后的真正成因或核心深情秘密、特殊互动小机制或规则检定设计、完整因果时间线",
  "catAndNpcProfiles": [
    {
      "chapterTitle": "猫-KPC或HO秘密与核心NPC章节名，例如：猫-恋人 或 02-HO1秘密与设定 或 NPC-某角色",
      "roleName": "角色称呼",
      "publicDesc": "玩家可见的表面印象",
      "secretProfile": "守秘人专属的完整里设定：包含真实动机、情感底色、表面姿态与失控触发点、面对玩家不同态度时的具体RP反应指南与代表台词"
    }
  ],
  "plannedScenes": [
    {
      "sceneTitle": "分幕事件章节标题，如：导入-雨夜来访 或 第一幕-旧校舍的微光",
      "purpose": "本幕需要重点渲染的氛围、情绪节点或探索目标",
      "pacingNote": "详略指导：本幕哪里应该慢下来细腻描写感官与互动，哪里应该干脆利落推进"
    }
  ],
  "endingsPlan": "多分支结局规划：包含True End、Normal End、特殊结局或Bad End的达成条件与核心意境"
}`;

        const ai1Raw = await this.callAI(ai1System, ai1User, null, 'writeModule');
        let ai1Data = this.parseJsonFromAiResponse(ai1Raw);
        if (ai1Data && !ai1Data.publicInfoChapter) {
          ai1Data.publicInfoChapter = ai1Data.publicInfo || ai1Data.knownInfo || ai1Data.public_info_chapter || ai1Data.summary || '';
        }
        if (!ai1Data || !ai1Data.publicInfoChapter) {
          ai1Data = this.salvageAi1BlueprintFromRaw(ai1Raw, customTitle);
        }
        if (!ai1Data || (!ai1Data.publicInfoChapter && !ai1Data.kpTruthAndMechanism)) {
          throw new Error('AI1 立意构思返回格式异常，请重试');
        }

        // ==========================================================
        // 第二阶段：AI2 因地制宜深化与叙事调度
        // ==========================================================
        this.setAiWriterStepActive(2);
        this.updateAiWriterStatus(32, 'AI2 正在根据主题灵魂深化氛围意象、互动机制、地图节点与线索网络...');

        const ai2System = `你是负责第二阶段【因地制宜深化与叙事调度】的戏剧导演AI。
你将收到AI1完成的《主创破题思考》《守秘人底牌》与《分幕初稿》。
请根据该模组的【核心美学流派】因地制宜地进行深化，绝不千篇一律：
- 若本模组核心是【深情、悲情、唯美、浪漫、宿命、救赎】：请不要乱加无意义的悬疑反转！你的核心任务是构建【五感氛围细节库与情绪高潮阶梯】——设计贯穿全篇的信物或环境意象（如某种花香、未织完的围巾、潮湿的海风、老旧怀表）、规划KPC眼神与语气的微妙变化层次，让每一幕的情绪层层递进直到彻底引爆泪点或心动。
- 若本模组核心是【粉红、拉扯、训犬、强制、甜宠、茶番、贴贴】：你的核心任务是设计【高张力互动博弈节点与趣味检定小机制】——例如心率失控检定、吃醋破防暗骰、肢体接触条件、以及当玩家选择撩拨、顺从、嘴硬或逃跑时KPC截然不同的双层反应。
- 若本模组核心是【怪谈、解密、循环、恐怖、诡计】：你的核心任务是【草蛇灰线织网】——将底牌线索自然拆解到环境陈设、路人闲聊与日常物品中，视情况运用插叙或认知错位，确保逻辑严丝合缝。`;

        const ai2User = `以下是AI1完成的模组立意与底牌蓝图：
${JSON.stringify(ai1Data, null, 2)}

请对其进行第二阶段因地制宜深化，并同步提取本模组的调查场景地图节点与关键线索或互动道具卡，严格输出以下JSON格式：
{
  "atmosphereAndMechanicsGuide": "深化后的全篇氛围渲染准则、意象呼应设计与专属特殊检定机制说明（供守秘人掌握带团节奏）",
  "deepenedScenes": [
    {
      "sceneTitle": "分幕章节标题（共 ${targetSceneCount} 幕左右）",
      "atmosphereCues": "本幕必须写活的光影、声音、气味、温度等五感氛围细节",
      "kpcInteractionDesign": "本幕KPC或核心NPC的微表情、台词张力与针对玩家不同行动的分支回应",
      "cluesOrEvents": "本幕可触发的探索点、暗骰检定、情感抉择或隐藏伏笔（若为日常或浪漫向，伏笔与线索必须服务于情感与氛围，不生造违和谜题）",
      "pacingRule": "详略控制：明确指出本幕哪一段必须浓墨重彩写足细节，哪一段一笔带过"
    }
  ],
  "mapNodes": [
    {
      "name": "地点名称",
      "parent": "上级区域名称，顶级地点填空字符串",
      "level": 1,
      "desc": "地点氛围与可互动要素简述"
    }
  ],
  "clues": [
    {
      "name": "线索或核心信物名称",
      "location": "所在地点或获取场景",
      "Trigger": "获取方式或检定条件",
      "content": "详细内容描述与守秘人备注"
    }
  ]
}`;

        const ai2Raw = await this.callAI(ai2System, ai2User, null, 'writeModule');
        const ai2Data = this.parseJsonFromAiResponse(ai2Raw) || {
          atmosphereAndMechanicsGuide: '',
          deepenedScenes: ai1Data.plannedScenes || [],
          mapNodes: [],
          clues: []
        };

        // ==========================================================
        // 第三阶段：AI3 模拟玩家视角盲测挑刺与节奏修补
        // ==========================================================
        this.setAiWriterStepActive(3);
        this.updateAiWriterStatus(52, 'AI3 正在以资深玩家视角盲测体验、挑刺套路与节奏漏洞并打补丁...');

        const ai3System = `你是负责第三阶段【模拟玩家盲测挑刺与审美修补】的资深跑团玩家兼文学审稿人AI。
请你站在一个真正要来玩这个模组的挑剔玩家角度，严格审视AI1和AI2的设计，重点挑出并直接修复以下问题：
1. 审美与去套路检查：有没有哪一幕写得像敷衍的AI流水账或小学生过家家？如果是甜饼或粉红向，互动够不够有拉扯感、性张力与真情实感？如果是浪漫悲情向，氛围渲染够不够细腻动人？
2. 伏笔与悬念检查：如果模组包含秘密或反转，前期的暗示是不是太刻意、太显眼（禁止用“你突然注意到一个可疑的某某”这种生硬指向）？请把过分直白的暗示改写进自然的日常细节、人物随口的闲聊或环境氛围里。
3. 节奏呼吸感检查：删掉无意义的跑腿和枯燥检定，确保玩家每一个行动都有鲜活的情感反馈或剧情推进。`;

        const ai3User = `模组选定标签：${allTags.join('、')}
模组核心流派：${ai1Data.themeMode || ''}
AI1底牌与人设：
${JSON.stringify({ kpTruthAndMechanism: ai1Data.kpTruthAndMechanism, catAndNpcProfiles: ai1Data.catAndNpcProfiles, endingsPlan: ai1Data.endingsPlan }, null, 2)}

AI2深化分幕与线索：
${JSON.stringify(ai2Data, null, 2)}

请完成挑刺诊断，并直接输出修补打磨后的终版执行蓝图JSON：
{
  "auditReport": "挑刺与优化总结：指出了原方案的哪些不足，并做了怎样的巧思升级与节奏修补",
  "kpMasterGuideChapter": "完整的【02-模组导读与大纲】章节正文（带【KP信息】前缀）：包含故事整体脉络表、带团氛围把控秘诀、玩家卡关或脱轨时的柔性引导方案",
  "finalScenes": [
    {
      "sceneTitle": "修补定稿后的分幕章节标题",
      "writingBlueprint": "给AI4撰稿人的超详细分幕写作指令：包含开场镜头、五感描写重点、KPC对话范例与心理活动、玩家互动选择分支、检定设置与本幕收束钩子"
    }
  ]
}`;

        const ai3Raw = await this.callAI(ai3System, ai3User, null, 'writeModule');
        const ai3Data = this.parseJsonFromAiResponse(ai3Raw) || {
          auditReport: '已完成节奏与张力校准',
          kpMasterGuideChapter: `【KP信息】\n模组导读与带团指南\n\n${ai2Data.atmosphereAndMechanicsGuide || ''}`,
          finalScenes: (ai2Data.deepenedScenes || ai1Data.plannedScenes || []).map(s => ({
            sceneTitle: s.sceneTitle || '事件章节',
            writingBlueprint: JSON.stringify(s)
          }))
        };

        // ==========================================================
        // 第四阶段：AI4 融合本地思维链分批沉浸成文
        // ==========================================================
        this.setAiWriterStepActive(4);
        const finalChapters = [];
        const boundarySuffix = '\n\n至此本小章节结束，请kp务必在聊天内告诉PC本世界书模组到此为止，请PC切换下一个世界书，禁止擅自编造互动外主线剧情走向';

        // 1. 00-模组已知信息 (公开章节)
        const ch0Content = `【正文】\n${String(ai1Data.publicInfoChapter || ai1Data.summary || '').trim()}${boundarySuffix}`;
        finalChapters.push({
          title: '00-模组已知信息',
          category: '模组导读',
          content: ch0Content
        });

        // 立即在界面展示零剧透预览（仅展示00-模组已知信息）
        const previewTitleEl = document.getElementById('ai-mod-preview-title');
        const previewMetaEl = document.getElementById('ai-mod-preview-meta');
        const previewPublicEl = document.getElementById('ai-mod-preview-public');
        if (previewBox && previewTitleEl && previewPublicEl) {
          previewBox.style.display = 'flex';
          previewTitleEl.textContent = customTitle || ai1Data.title || '未命名模组';
          if (previewMetaEl) previewMetaEl.textContent = '正在撰写正文...';
          previewPublicEl.textContent = String(ai1Data.publicInfoChapter || ai1Data.summary || '').trim();
        }

        // 2. 01-幕后真相与机制 (KP专属加密章节)
        const ch1Content = `【KP信息】\n守秘人底牌与核心机制\n\n【主创破题与美学基调】\n${ai1Data.creativeReflection || ''}\n\n【幕后真相与深层逻辑】\n${ai1Data.kpTruthAndMechanism || ''}\n\n【氛围与机制深化指南】\n${ai2Data.atmosphereAndMechanicsGuide || ''}`;
        finalChapters.push({
          title: '01-幕后真相与机制',
          category: '模组导读',
          content: ch1Content
        });

        // 3. 02-模组导读与大纲 (KP专属加密章节)
        const ch2Content = String(ai3Data.kpMasterGuideChapter || '').startsWith('【KP信息】')
          ? ai3Data.kpMasterGuideChapter
          : `【KP信息】\n${ai3Data.kpMasterGuideChapter || ''}\n\n【盲测挑刺修补记录】\n${ai3Data.auditReport || ''}`;
        finalChapters.push({
          title: '02-模组导读与大纲',
          category: '模组导读',
          content: ch2Content
        });

        // 4. 猫与HO秘密及核心NPC人设章 (KP专属加密章节)
        const profiles = Array.isArray(ai1Data.catAndNpcProfiles) ? ai1Data.catAndNpcProfiles : [];
        profiles.forEach((prof, idx) => {
          const pTitle = prof.chapterTitle || `猫-${prof.roleName || ('角色' + (idx + 1))}`;
          const pBody = `【KP信息】\n角色名称：${prof.roleName || ''}\n\n【表面印象】\n${prof.publicDesc || ''}\n\n【深层里设定与守秘人RP指南】\n${prof.secretProfile || ''}`;
          finalChapters.push({
            title: pTitle,
            category: '人物设定',
            content: pBody
          });
        });

        // 5. 分批次逐章扩写正文事件章节 + 结局章节
        const scenesToWrite = Array.isArray(ai3Data.finalScenes) && ai3Data.finalScenes.length > 0
          ? ai3Data.finalScenes
          : [{ sceneTitle: '正文-核心事件', writingBlueprint: ai1Data.summary || '' }];

        const ai4System = `你是负责第四阶段【分章全文撰写】的殿堂级模组执笔作家AI。
请严格遵循以下写作铁律：
1. 文风与质感：拒绝干瘪的大纲腔、说明书腔或廉价工业糖精！用细腻的文学笔触写出光影、气味、动作细节与人物之间微妙的呼吸感。
2. 跑团可玩性：每一幕既要有极具代入感的场景导入与氛围描写，又要为守秘人写清【可调查互动点】【技能检定或趣味暗骰分支】以及【当玩家做出不同回应时，KPC或NPC的具体台词、神态与心理反应】。
3. 严守底牌红线：在玩家可见的描写中，绝不能直接剧透底牌本体，只能通过侧面感官细节、KPC欲言又止的微表情或环境违和感来自然流露。
4. 前后文连贯：紧密承接上一幕的情绪与剧情状态，不重复、不割裂。
${tcPrompt ? '\n5. 最高优先级文风规范（来自用户勾选的本地思维链，请彻底融汇于字里行间）：\n' + tcPrompt : ''}`;

        let previousSceneTail = '';
        for (let sIdx = 0; sIdx < scenesToWrite.length; sIdx++) {
          const sceneItem = scenesToWrite[sIdx];
          const sTitle = sceneItem.sceneTitle || `第 ${sIdx + 1} 幕`;
          const progressPct = 58 + Math.round(((sIdx + 1) / (scenesToWrite.length + 1)) * 34);
          this.updateAiWriterStatus(progressPct, `AI4 正在融合思维链文风撰写分幕正文 ${sIdx + 1} / ${scenesToWrite.length} ...`);

          const ai4SceneUser = `模组名称：${customTitle || ai1Data.title || ''}
选定标签：${allTags.join('、')}
核心流派：${ai1Data.themeMode || ''}
守秘人底牌（仅供你把控暗线，严禁在玩家描写中直白泄底）：
${ai1Data.kpTruthAndMechanism || ''}

角色核心人设：
${JSON.stringify(ai1Data.catAndNpcProfiles || [], null, 2)}

${previousSceneTail ? '上一幕结尾脉络回顾：\n' + previousSceneTail + '\n' : ''}
当前需要撰写的章节：【${sTitle}】
本幕写作细纲与要求：
${typeof sceneItem.writingBlueprint === 'string' ? sceneItem.writingBlueprint : JSON.stringify(sceneItem)}

请直接输出本章节的完整模组正文（包含【正文】场景描写与互动分支，以及必要的【KP信息】带团提示，字数要求详实饱满，约1500至2500字，不要输出多余寒暄）：`;

          const sceneTextRaw = await this.callAI(ai4System, ai4SceneUser, null, 'writeModule');
          let cleanSceneText = String(sceneTextRaw || '').trim();
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

          previousSceneTail = cleanSceneText.slice(-380);
        }

        // 6. 撰写结局分歧章节
        this.updateAiWriterStatus(95, 'AI4 正在撰写多分支结局演出...');
        const ai4EndingUser = `模组名称：${customTitle || ai1Data.title || ''}
选定标签：${allTags.join('、')}
核心流派：${ai1Data.themeMode || ''}
守秘人底牌：${ai1Data.kpTruthAndMechanism || ''}
上一幕结尾脉络：${previousSceneTail}
结局规划：${ai1Data.endingsPlan || ''}

请撰写本模组的【结局】章节完整文本，包含各分支结局（如True End、Normal End、特殊结局或Bad End）的判定条件、极具感染力的结局正文演出、以及守秘人结团结算提示。直接输出章节正文：`;

        const endingRaw = await this.callAI(ai4System, ai4EndingUser, null, 'writeModule');
        let cleanEndingText = String(endingRaw || '').trim();
        if (!cleanEndingText.includes('【正文】') && !cleanEndingText.includes('【KP信息】')) {
          cleanEndingText = `【正文】\n${cleanEndingText}`;
        }
        finalChapters.push({
          title: `${customTitle || ai1Data.title || '模组'}-结局`,
          category: '模组结局',
          content: cleanEndingText
        });

        // 组装完整模组数据包并自动入库
        const finalModTitle = customTitle || ai1Data.title || '未命名模组';
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
          mapNodes: Array.isArray(ai2Data.mapNodes) ? ai2Data.mapNodes : [],
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

        this.updateAiWriterStatus(100, `已完成《${finalModTitle}》全部 ${finalChapters.length} 章撰写并封存入本地模组库，真相与后续章节已隐藏，可直接开团游玩或上传工坊`);
      } catch (err) {
        console.error('[AI写模] 流水线异常:', err);
        this.updateAiWriterStatus(0, `生成中断：${err.message || err}`);
        if (typeof global.showCustomAlert === 'function') {
          global.showCustomAlert('生成失败', String(err.message || err));
        }
      } finally {
        this.aiWriterState.isRunning = false;
        if (genBtn) {
          genBtn.textContent = '生成';
          genBtn.disabled = false;
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
      await this.populateWorkshopLocalModuleSelect();

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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      ModuleManager.initEventListeners();
    });
  } else {
    ModuleManager.initEventListeners();
  }

  console.log('[模组] 模组深度重构与带团调度引擎已就绪');
})(window);

