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
112: 18. 【模组地图】（沙盒类必生成，时间线类跟随剧情生成）：按第四部分的地点层级树生成地图；末级可不写简介；简介不剧透。
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
  const DEFAULT_TRPG_CUTTING_EXECUTION_PROMPT = `你是模组切割 AI。你将收到：①模组原文全文；②一份切割方案初稿（分析阶段生成的章节计划）。你的任务：按初稿的章节划分，把原文整理分类成多个可直接用于带团的章节，严禁添加主观个人理解与总结点评。初稿是参考，不是圣旨——执行中若发现初稿切得不合理（章节错位、该合并的没合并、该拆的没拆、归属放错），你可以修正，但修正之处要在结果说明中注明。你只做文本的分类整理与标签标注，不涉及任何代码实现。所有输出使用中文。

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
【第二部分：按初稿切割 + 自主思考】
━━━━━━━━━━━━━━━━━━
4. 先通读原文全文（不得跳读），理解结构、真相、HO位、地点、NPC与猫；
5. 对照切割方案初稿：初稿列出章节就按初稿的章节切；执行时保持自己的判断——若发现初稿把"白天与晚上"这类不同内容并成一章、或把某个HO的信息放错章、或某章过大过小，可自行调整（合并/拆分/移归属），并在结果说明中写清调整了哪里；
6. 章节篇幅保持适中（4000-5000字，允许4000-6000浮动）；换段必须在小地点/小事件结束处，禁止事件正中截断。

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
    activeSubPanel: 'wizard',
    activeSubTab: 'chapters',
    cutExecutionMode: 'batch',

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
        return await db.modules.toArray();
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
          cutChapters: this.cutChapters,
          cuttingCurrentIndex: typeof this.cuttingCurrentIndex === 'number' ? this.cuttingCurrentIndex : (this.cutChapters ? this.cutChapters.length : 0),
          isCuttingPaused: this.isCuttingPaused,
          timestamp: Date.now()
        };
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftObj));
      } catch (e) {
        console.warn('[模组] 草稿保存提示', e);
      }
    },

    loadDraft() {
      try {
        const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (!raw) return false;
        const draft = JSON.parse(raw);
        if (draft && draft.currentParsedData) {
          this.currentStep = draft.currentStep || 1;
          this.activeSubPanel = draft.activeSubPanel || 'wizard';
          this.activeSubTab = draft.activeSubTab || 'chapters';
          this.cutExecutionMode = draft.cutExecutionMode || 'batch';
          this.batchSegmentsCompleted = typeof draft.batchSegmentsCompleted === 'number' ? draft.batchSegmentsCompleted : 0;
          this.currentParsedData = draft.currentParsedData;
          this.currentPlan = draft.currentPlan || null;
          this.globalOpinion = draft.globalOpinion || '';
          this.globalAuditReport = draft.globalAuditReport || '';
          this.cutChapters = Array.isArray(draft.cutChapters) ? draft.cutChapters : [];
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

          this.renderParsedResultUI(this.currentParsedData);

          if (this.currentPlan) {
            this.renderPlanUI();
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

          this.switchSubPanel(this.activeSubPanel);
          return true;
        }
      } catch (e) {
        console.warn('[模组] 恢复草稿提示', e);
      }
      return false;
    },

    clearDraft() {
      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch (e) {}
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

          const imageFiles = Object.keys(zip.files).filter(path => {
            const p = path.toLowerCase();
            return p.startsWith('word/media/') && !p.endsWith('/');
          });
          imageFiles.sort();

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

      const cleanedText = this.cleanRawText(extractedText);
      if (!cleanedText && extractedImages.length === 0) {
        throw new Error('Word 文件内容为空或格式无法识别，请确保为有效的 .docx 格式');
      }

      return {
        text: cleanedText,
        images: extractedImages,
        fileName: file.name,
        fileType: 'Word / DOCX'
      };
    },

    async parsePdfFile(file) {
      if (!global.pdfjsLib) {
        throw new Error('PDF.js 解析组件未加载完成，请刷新页面后重试');
      }

      const arrayBuffer = await file.arrayBuffer();
      let pdf;
      try {
        pdf = await global.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
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

        try {
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map(item => item.str).join(' ').trim();
          if (pageText) {
            textPieces.push(pageText);
            totalTextLength += pageText.length;
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
                await new Promise((resolveImg) => {
                  let resolved = false;
                  const done = () => {
                    if (!resolved) {
                      resolved = true;
                      resolveImg();
                    }
                  };

                  const handleImgData = (imgObj) => {
                    if (!imgObj) {
                      done();
                      return;
                    }
                    try {
                      const width = imgObj.width || (imgObj.bitmap && imgObj.bitmap.width) || 0;
                      const height = imgObj.height || (imgObj.bitmap && imgObj.bitmap.height) || 0;

                      if (width < 40 || height < 40) {
                        done();
                        return;
                      }

                      const hashKey = `${width}_${height}_${imgObj.data ? imgObj.data.length : 0}`;
                      if (seenXrefHashes.has(hashKey)) {
                        done();
                        return;
                      }
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
                        name: `图${curIndex}（第${pageNum}页插图）`,
                        description: `第${pageNum}页插图 ${width}×${height}`,
                        dataUrl: dataUrl,
                        isSensitive: false,
                        placement: `第${pageNum}页`
                      });
                    } catch (e) {
                      console.warn('[模组] 转换图像数据异常:', e);
                    }
                    done();
                  };

                  if (page.objs && typeof page.objs.get === 'function') {
                    try {
                      if (page.objs.has(imgObjId)) {
                        handleImgData(page.objs.get(imgObjId));
                      } else {
                        page.objs.get(imgObjId, (obj) => {
                          handleImgData(obj);
                        });
                      }
                    } catch (objErr) {
                      done();
                    }
                  } else if (page.commonObjs && typeof page.commonObjs.get === 'function') {
                    try {
                      if (page.commonObjs.has(imgObjId)) {
                        handleImgData(page.commonObjs.get(imgObjId));
                      } else {
                        page.commonObjs.get(imgObjId, (obj) => {
                          handleImgData(obj);
                        });
                      }
                    } catch (cErr) {
                      done();
                    }
                  } else {
                    done();
                  }

                  setTimeout(done, 600);
                });
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
      if (totalTextLength < 60 && extractedImages.length === 0) {
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

            extractedImages.push({
              imageIndex: pageNum,
              pageNumber: pageNum,
              width: Math.round(viewport.width),
              height: Math.round(viewport.height),
              format: 'JPEG',
              name: `图${pageNum}（第${pageNum}页扫描图）`,
              description: `第${pageNum}页全页扫描图`,
              dataUrl: dataUrl,
              isSensitive: false,
              placement: `第${pageNum}页`
            });

            textPieces.push(`第${pageNum}页扫描内容\n【图${pageNum}】`);
          } catch (renderErr) {
            console.warn(`[模组] PDF 第 ${pageNum} 页扫描图读取跳过`, renderErr);
          }
        }
      }

      const cleanedText = this.cleanRawText(textPieces.join('\n\n'));
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
      const tabs = document.querySelectorAll('.module-header-tab');

      tabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === panelName);
      });

      if (panelName === 'library') {
        if (wizardPanel) wizardPanel.style.display = 'none';
        if (libraryPanel) libraryPanel.style.display = 'flex';
        this.renderLibraryList();
      } else {
        if (wizardPanel) wizardPanel.style.display = 'flex';
        if (libraryPanel) libraryPanel.style.display = 'none';
      }
      this.saveDraft();
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
      const parts = this.currentParsedData?.splitParts || 'auto';
      const step2SplitSelect = document.getElementById('module-step2-split-select');
      const step1SplitSelect = document.getElementById('module-split-parts-select');
      if (step2SplitSelect) step2SplitSelect.value = parts;
      if (step1SplitSelect) step1SplitSelect.value = parts;
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
        } else if (this.cutChapters.length > 0) {
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
        }
        if (rethinkBtn) rethinkBtn.style.display = 'none';
        if (primaryBtn) {
          primaryBtn.style.display = 'flex';
          primaryBtn.textContent = '分析';
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
        }
        if (rethinkBtn) rethinkBtn.style.display = 'flex';
        if (primaryBtn) {
          primaryBtn.style.display = 'flex';
          primaryBtn.textContent = '切割';
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
        if (step3BackBtn) step3BackBtn.style.display = 'flex';
        if (batchAuditBtn) batchAuditBtn.style.display = 'flex';
        if (exportBtn) exportBtn.style.display = 'flex';
        if (saveLibraryBtn) saveLibraryBtn.style.display = 'flex';
        if (finishBtn) finishBtn.style.display = 'flex';
      }
    },

    resetImportUI() {
      this.currentParsedData = null;
      this.currentPlan = null;
      this.cutChapters = [];
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

    renderParsedResultUI(data) {
      if (!data) return;
      this.currentParsedData = data;

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

      this.updateBottomActionBar();
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

    async callAI(systemPrompt, userPrompt) {
      const stateObj = global.state || (typeof window !== 'undefined' ? window.state : {}) || {};
      const apiCfg = (typeof global.getEffectiveApiConfig === 'function')
        ? global.getEffectiveApiConfig('module')
        : ((typeof window !== 'undefined' && typeof window.getEffectiveApiConfig === 'function')
            ? window.getEffectiveApiConfig('module')
            : (stateObj.apiConfig || {}));

      const proxyUrl = apiCfg.proxyUrl || stateObj.apiConfig?.proxyUrl || "https://api.openai.com";
      const apiKey = apiCfg.apiKey || stateObj.apiConfig?.apiKey || "";
      const model = apiCfg.model || stateObj.apiConfig?.model || "gpt-3.5-turbo";
      const temperature = apiCfg.temperature !== undefined ? apiCfg.temperature : (stateObj.apiConfig?.temperature || 0.2);

      if (!apiKey) {
        console.warn('[模组] 未配置 API Key');
        throw new Error('未检测到 API Key，请先在API设置中配置主 API 密钥与模型');
      }
      const GEMINI_URL = global.GEMINI_API_URL || 'https://generativelanguage.googleapis.com/v1beta/models';
      const isGemini = proxyUrl === GEMINI_URL;

      let requestUrl = isGemini
        ? `${GEMINI_URL}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`
        : `${proxyUrl}/v1/chat/completions`;

      let requestHeaders = isGemini
        ? { 'Content-Type': 'application/json' }
        : {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`
          };

      let requestBody;
      if (isGemini) {
        requestBody = {
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          generationConfig: {
            temperature: parseFloat(temperature) || 0.2
          },
          systemInstruction: { parts: [{ text: systemPrompt }] }
        };
      } else {
        requestBody = {
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: parseFloat(temperature) || 0.2,
          stream: false
        };
      }

      let lastError = null;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const response = await fetch(requestUrl, {
            method: 'POST',
            headers: requestHeaders,
            body: JSON.stringify(requestBody)
          });

          if (!response.ok) {
            const errBody = await response.text();
            throw new Error(`API 响应错误 ${response.status}: ${errBody}`);
          }

          const resData = await response.json();
          let resText = '';
          if (isGemini) {
            resText = resData.candidates?.[0]?.content?.parts?.[0]?.text || '';
          } else {
            resText = resData.choices?.[0]?.message?.content || '';
          }
          if (!resText || !resText.trim()) {
            throw new Error('AI 未返回有效内容，请检查模型响应');
          }
          return resText;
        } catch (e) {
          lastError = e;
          if (attempt === 0) {
            await new Promise(r => setTimeout(r, 1200));
          }
        }
      }
      throw lastError || new Error('网络请求异常');
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

      const mapNodes = [
        { name: `${moduleName}主地域`, parent: '', level: 1, desc: '模组主要发生的大型地域环境' },
        { name: '核心建筑群', parent: `${moduleName}主地域`, level: 2, desc: '调查活动集中展开的建筑区域' },
        { name: '主要厅堂', parent: '核心建筑群', level: 3, desc: '' },
        { name: '正厅走廊', parent: '核心建筑群', level: 3, desc: '' },
        { name: '侧室与庭院', parent: '核心建筑群', level: 3, desc: '' },
        { name: '后院秘道', parent: '核心建筑群', level: 3, desc: '' }
      ];

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

    async generateCuttingPlan() {
      if (!this.currentParsedData) {
        throw new Error('未选择模组文件');
      }

      const promptTextarea = document.getElementById('module-prompt-textarea');
      if (promptTextarea) {
        this.currentParsedData.prompt = promptTextarea.value.trim();
      }

      const opinionEl = document.getElementById('module-global-opinion-textarea');
      if (opinionEl) {
        this.globalOpinion = opinionEl.value.trim();
      }

      let plan;
      try {
        const activePrompt = this.currentParsedData.prompt || DEFAULT_TRPG_ANALYSIS_PROMPT;
        const systemPrompt = `你是一个资深跑团模组重构与分析专家。请严格按照以下跑团模组重构、分类与标签规范，分析模组文本并输出严格的 JSON 结构规划方案：

${activePrompt}

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
  "chunks": [
    {
      "order": 1,
      "name": "00-模组已知信息",
      "category": "事前公开",
      "wordCount": 1000,
      "reason": "开局背景与须知，无剧透",
      "prefixPreview": "该段前100字"
    }
  ],
  "mapNodes": [
    { "name": "大区域", "parent": "", "level": 1, "desc": "空间说明" },
    { "name": "建筑分区", "parent": "大区域", "level": 2, "desc": "建筑说明" },
    { "name": "具体场所", "parent": "建筑分区", "level": 3, "desc": "" }
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
1. moduleType 只能是 "线性"、"沙盒" 或 "其他" 三者之一，禁止附带任何注解。
2. ruleSystem 只能是 "coc" 或 "coj"。
3. scaleType: 若模组设有专属 HO 位，按数量判定为 "2ho"、"3ho"、"4ho"，若大于4人有ho则判定为 "多ho"；若为无 HO 位模组，单人判定为 "1v1" 或 "单人"，多人则根据模组开头游玩人数填写为 "*人" 或 "*-*人"（例如 "2-4人"、"3-5人" 等）。
4. summary: 绝对不能出现任何剧透与剧情走向。直接沿用作者在模组介绍中写的模组简介；若无原简介则只写最最最最最最开头最基础的已知内容，绝不包含正文剧情走向。
5. bgTag 必须单选，只能是 "日模"、"美模"、"现代中国"、"古风" 四者之一，禁止其它值。
6. endingTag 必须单选，只能是 "危险"、"普通" 或 "安全" 三者之一。
7. contentTags 必须为多选数组，只能从预设列表 ["校园", "复活", "粉红", "NTR", "血腥暴力", "纯爱", "茶番", "恐怖", "Meta"] 中挑选，符合几个选几个，不符合留空数组 []。
8. imageAnalysis 必须逐一甄别所有提取插图：
   - shouldInclude: 布尔值。若为纯文本页面扫描、无意义分隔线条、重复花边、装饰图标则设为 false；若为有意义的立绘、地图、手迹、怪物图、CG则设为 true。
   - isSensitive: 布尔值。若为后期决战、幕后黑手真相、神话生物真面目、隐藏密室等核心剧透，设为 true；若为公开世界观地图、已知NPC立绘、开局已知信息则设为 false。
   - isHorror: 布尔值。对恐怖元素极度敏感（低判定阈值）：包含半人半骨骼、骷髅、尸体血迹、怪物触手、异形异变、夜晚昏暗阴森场景、诡异压抑画面、心理恐怖氛围等不论真恐怖还是心理恐怖，一律判定为 true；常规明亮普通立绘或正常地图设为 false。
   - name: 精炼插图名称。
   - description: 图像视觉内容描述。
   - annotation: 针对守秘人带团与插图场景用途的精炼中文注释。`;

        const splitSelect = document.getElementById('module-split-parts-select');
        let requestedParts = splitSelect ? splitSelect.value : 'auto';
        let numParts = 1;
        const totalWords = this.currentParsedData.wordCount || this.currentParsedData.text.length;
        if (requestedParts === 'auto') {
          if (totalWords > 40000) numParts = 3;
          else if (totalWords > 20000) numParts = 2;
          else numParts = 1;
        } else {
          numParts = parseInt(requestedParts, 10) || 1;
        }

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
          const segText = segments[segIdx].substring(0, 42000);
          let userPrompt = `模组名称：${this.currentParsedData.moduleName}\n总字数：${this.currentParsedData.wordCount}\n当前分析分卷：第 ${segIdx + 1} / ${segments.length} 卷\n\n重构分析提示词：\n${activePrompt}`;
          if (this.globalOpinion) {
            userPrompt += `\n\n用户针对此重构方案的个性化补充意见：\n${this.globalOpinion}`;
          }
          if (segIdx === 0 && this.currentParsedData.images && this.currentParsedData.images.length > 0) {
            const imgListDesc = this.currentParsedData.images.map((img, i) => `图${i + 1}: 页码${img.pageNumber || '未知'}, 尺寸${img.width}x${img.height}, 格式${img.format}`).join('\n');
            userPrompt += `\n\n【提取到的候选插图列表】：\n${imgListDesc}`;
          }
          userPrompt += `\n\n模组参考全文（当前分卷内容）：\n${segText}`;

          const aiResultText = await this.callAI(systemPrompt, userPrompt);
          if (aiResultText) {
            const cleanJson = aiResultText.replace(/```json/gi, '').replace(/```/g, '').trim();
            const parsedAiPlan = JSON.parse(cleanJson);
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
                      if (assess.name) img.name = assess.name;
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
                  allParsedChunks.push(c);
                });
              }

              if (Array.isArray(parsedAiPlan.mapNodes)) {
                parsedAiPlan.mapNodes.forEach(node => {
                  if (!combinedMapNodes.some(n => n.name === node.name)) {
                    combinedMapNodes.push(node);
                  }
                });
              }
            }
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
                reason: c.reason || 'AI根据带团逻辑架构提炼',
                userInstruction: '',
                rawSlice: slice
              };
            }),
            mapNodes: combinedMapNodes
          };
        }
      } catch (err) {
        console.warn('[模组] AI 重构提示，使用内置带团结构重组引擎', err);
      }

      if (!plan) {
        plan = this.generateLocalPlan(this.currentParsedData);
      }

      this.currentPlan = plan;
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
                <div><span class="module-preview-label">前文预览：</span>${chunk.prefixPreview || '无预览'}</div>
              </div>
              <div class="module-reason-box">
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
        const mapNodes = this.currentPlan.mapNodes || [];
        if (mapNodes.length === 0) {
          mapContainer.innerHTML = '<div style="color: var(--text-secondary); text-align: center; padding: 20px;">当前模组地图正在生成或随主线剧情动态展开</div>';
        } else {
          mapContainer.innerHTML = '';
          mapNodes.forEach(node => {
            const nodeEl = document.createElement('div');
            nodeEl.className = `module-map-node level-${node.level || 1}`;
            nodeEl.innerHTML = `
              <div class="module-map-node-title">
                <span>${node.name}</span>
                <span class="module-map-badge">${node.level === 1 ? '大区域' : node.level === 2 ? '建筑分区' : '具体场所'}</span>
              </div>
              ${node.level < 3 && node.desc ? `<div class="module-map-node-desc">${node.desc}</div>` : ''}
            `;
            mapContainer.appendChild(nodeEl);
          });
        }
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

    async generateBatchAllChaptersWithAI(fullText, segIdx, totalSegs) {
      const analysisPrompt = this.currentParsedData?.analysisPrompt || this.currentParsedData?.prompt || DEFAULT_TRPG_ANALYSIS_PROMPT;
      const cuttingPrompt = this.currentParsedData?.cuttingPrompt || DEFAULT_TRPG_CUTTING_EXECUTION_PROMPT;
      const allChunks = this.currentPlan?.chunks || [];
      const planOutline = allChunks.map((c, i) => `${i + 1}. 【${c.name}】(${c.category}) - ${c.reason || '按内容性质提取'}`).join('\n');

      const isSegmented = typeof segIdx === 'number' && typeof totalSegs === 'number' && totalSegs > 1;
      const segNotice = isSegmented ? `\n【当前正在处理的分卷】：第 ${segIdx + 1} / ${totalSegs} 卷（请仅整理并输出属于本卷内容的章节）\n` : '';

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
5. 直接按上述起止标记格式输出全部章节内容。`;

      const userPrompt = `【全模组规划章节大纲】：
${planOutline}
${segNotice}
${this.globalOpinion ? `\n【用户全局修改意见】：\n${this.globalOpinion}\n` : ''}
【模组参考原文】：
${fullText}`;

      const generated = await this.callAI(systemPrompt, userPrompt);
      if (!generated || generated.trim().length === 0) {
        throw new Error('AI 全篇返回内容为空');
      }

      const parsedChapters = [];
      const regexPrimary = /===CHAPTER_START:\s*([^|\n]+?)(?:\s*\|\s*([^=\n]+?))?===\s*([\s\S]*?)(?:===CHAPTER_END===|(?====CHAPTER_START)|$)/g;
      let match;
      let index = 0;

      while ((match = regexPrimary.exec(generated)) !== null) {
        const rawTitle = (match[1] || '').trim();
        const category = (match[2] || '正文').trim();
        const content = (match[3] || '').trim();
        if (content.length > 20) {
          index++;
          const words = this.countWords(content);
          const cleanTitle = this.cleanChapterTitle(rawTitle || `第${index}章`, this.currentParsedData?.moduleName);
          parsedChapters.push({
            id: 'chap_' + Date.now() + '_' + index,
            moduleId: this.currentParsedData?.moduleName || '跑团模组',
            title: cleanTitle,
            category: category,
            wordCount: words,
            content: content,
            fixCount: 0,
            stats: {
              mainTextCount: (content.match(/【正文】/g) || []).length,
              kpInfoCount: (content.match(/【KP信息】/g) || []).length,
              secretCount: (content.match(/【秘密/g) || []).length,
              totalWords: words
            },
            sortOrder: index
          });
        }
      }

      if (parsedChapters.length === 0) {
        const regexSecondary = /(?:^|\n)#{2,4}\s*([^|\n]+?)(?:\s*\|\s*([^\n]+?))?\n([\s\S]*?)(?=(?:\n#{2,4}\s+)|$)/g;
        while ((match = regexSecondary.exec(generated)) !== null) {
          const rawTitle = (match[1] || '').trim();
          const category = (match[2] || '正文').trim();
          const content = (match[3] || '').trim();
          if (content.length > 20) {
            index++;
            const words = this.countWords(content);
            const cleanTitle = this.cleanChapterTitle(rawTitle || `第${index}章`, this.currentParsedData?.moduleName);
            parsedChapters.push({
              id: 'chap_' + Date.now() + '_' + index,
              moduleId: this.currentParsedData?.moduleName || '跑团模组',
              title: cleanTitle,
              category: category,
              wordCount: words,
              content: content,
              fixCount: 0,
              stats: {
                mainTextCount: (content.match(/【正文】/g) || []).length,
                kpInfoCount: (content.match(/【KP信息】/g) || []).length,
                secretCount: (content.match(/【秘密/g) || []).length,
                totalWords: words
              },
              sortOrder: index
            });
          }
        }
      }

      if (parsedChapters.length === 0) {
        const sections = generated.split(/(?:^|\n)===+\s*/);
        sections.forEach((sec, idx) => {
          if (!sec.trim() || sec.trim().length < 20) return;
          const firstLineEnd = sec.indexOf('\n');
          const firstLine = firstLineEnd !== -1 ? sec.substring(0, firstLineEnd).trim() : sec.trim();
          const rest = firstLineEnd !== -1 ? sec.substring(firstLineEnd).trim() : '';
          const planChunk = allChunks[idx] || { name: firstLine || `第${idx + 1}章`, category: '正文' };
          const words = this.countWords(rest || sec);
          const cleanTitle = this.cleanChapterTitle(planChunk.name, this.currentParsedData?.moduleName);

          parsedChapters.push({
            id: 'chap_' + Date.now() + '_' + (idx + 1),
            moduleId: this.currentParsedData?.moduleName || '跑团模组',
            title: cleanTitle,
            category: planChunk.category,
            wordCount: words,
            content: rest || sec,
            fixCount: 0,
            stats: {
              mainTextCount: ((rest || sec).match(/【正文】/g) || []).length,
              kpInfoCount: ((rest || sec).match(/【KP信息】/g) || []).length,
              secretCount: ((rest || sec).match(/【秘密/g) || []).length,
              totalWords: words
            },
            sortOrder: idx + 1
          });
        });
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

      const cutCard = document.createElement('div');
      cutCard.className = 'module-cut-card';
      cutCard.id = `cut-card-${chapterObj.id}`;
      cutCard.innerHTML = `
        <div class="module-cut-card-top">
          <span class="module-cut-card-title">${chapterObj.title}</span>
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
      const pauseBtn = document.getElementById('module-pause-btn');
      const resumeBtn = document.getElementById('module-resume-btn');

      if (pauseBtn) pauseBtn.style.display = 'inline-flex';
      if (resumeBtn) resumeBtn.style.display = 'none';

      if (this.cutExecutionMode === 'batch') {
        this.executeBatchCuttingSingleCall();
      } else {
        this.continueAsyncCuttingLoop();
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

      this.setWizardStep(3);

      const fullText = this.currentParsedData?.text || '';
      const splitSelect2 = document.getElementById('module-step2-split-select');
      const splitSelect1 = document.getElementById('module-split-parts-select');
      let requestedParts = (splitSelect2 ? splitSelect2.value : null) || (splitSelect1 ? splitSelect1.value : null) || (this.currentParsedData?.splitParts || 'auto');
      let numParts = 1;
      const totalWords = this.currentParsedData?.wordCount || fullText.length;
      if (requestedParts === 'auto') {
        if (totalWords > 80000) numParts = 4;
        else if (totalWords > 40000) numParts = 3;
        else if (totalWords > 20000) numParts = 2;
        else numParts = 1;
      } else {
        numParts = parseInt(requestedParts, 10) || 1;
      }
      const segments = this.splitTextIntoBalancedSegments(fullText, numParts);
      if (this.batchSegmentsCompleted >= segments.length) {
        this.batchSegmentsCompleted = 0;
        this.cuttingCurrentIndex = 0;
        this.cutChapters = [];
        const cardList = document.getElementById('module-cut-card-list');
        if (cardList) cardList.innerHTML = '';
      }
      await this.executeBatchCuttingSingleCall();
    },

    async executeBatchCuttingSingleCall() {
      const fullText = this.currentParsedData?.text || '';
      const progressText = document.getElementById('module-progress-text');
      const progressBar = document.getElementById('module-progress-bar');
      const cardList = document.getElementById('module-cut-card-list');
      const pauseBtn = document.getElementById('module-pause-btn');
      const resumeBtn = document.getElementById('module-resume-btn');
      const cancelBtn = document.getElementById('module-cancel-btn');

      const splitSelect2 = document.getElementById('module-step2-split-select');
      const splitSelect1 = document.getElementById('module-split-parts-select');
      let requestedParts = (splitSelect2 ? splitSelect2.value : null) || (splitSelect1 ? splitSelect1.value : null) || (this.currentParsedData?.splitParts || 'auto');
      let numParts = 1;
      const totalWords = this.currentParsedData?.wordCount || fullText.length;
      if (requestedParts === 'auto') {
        if (totalWords > 80000) numParts = 4;
        else if (totalWords > 40000) numParts = 3;
        else if (totalWords > 20000) numParts = 2;
        else numParts = 1;
      } else {
        numParts = parseInt(requestedParts, 10) || 1;
      }

      const segments = this.splitTextIntoBalancedSegments(fullText, numParts);
      const totalSegs = segments.length;

      this.isCuttingRunning = true;
      this.isCuttingPaused = false;
      this.isCuttingCancelled = false;

      if (pauseBtn) pauseBtn.style.display = 'inline-flex';
      if (resumeBtn) resumeBtn.style.display = 'none';
      if (cancelBtn) cancelBtn.style.display = 'inline-flex';

      const startSegIdx = this.batchSegmentsCompleted || 0;

      if (cardList && cardList.children.length === 0 && this.cutChapters.length > 0) {
        this.cutChapters.forEach((chap, idx) => {
          cardList.appendChild(this.createChapterCardElement(chap, idx));
        });
      }

      for (let segIdx = startSegIdx; segIdx < totalSegs; segIdx++) {
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
          const segText = segments[segIdx];
          const parsed = await this.generateBatchAllChaptersWithAI(segText, segIdx, totalSegs);
          if (this.isCuttingCancelled) {
            this.isCuttingRunning = false;
            this.saveDraft();
            return;
          }

          if (parsed && parsed.length > 0) {
            parsed.forEach(chap => {
              chap.id = 'chap_' + (this.cutChapters.length + 1);
              chap.sortOrder = this.cutChapters.length + 1;
              chap.title = this.cleanChapterTitle(chap.title, this.currentParsedData?.moduleName);
              this.cutChapters.push(chap);
              if (cardList) {
                cardList.appendChild(this.createChapterCardElement(chap, this.cutChapters.length - 1));
              }
            });
            this.batchSegmentsCompleted = segIdx + 1;
            this.cuttingCurrentIndex = this.cutChapters.length;
            this.saveDraft();
            this.renderCutChaptersUI();
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

      const rawExcerpt = (this.currentParsedData?.text || '').substring(0, 5000);

      const prompt = `你是一个极其严格的跑团模组质检审核专家。
请结合模组原文参考片段，对当前章节进行保真与规范审查：

【模组原文参考片段】：
${rawExcerpt}

【待审查章节标题】：${chapterObj.title} [${chapterObj.category}]
【待审查章节内容】：
${chapterObj.content}

【审查核心规则】：
1. 【原作编排保真】：若模组原文中作者将正文剧情与KP带团建议、角色扮演指南交替穿插出现，这是原作固有的编排方式，属于正常且必须保留的结构！绝对不是 AI 擅自扩写的杂质！严禁要求把正文合并或将KP提示移至文末！
2. 【严查主观脑补】：只严查是否包含 AI 擅自撰写的恋爱哲学、心理分析、心路历程、描写建议与大段文学鉴赏，如有必须要求彻底清除！
3. 【正文保真度】：正文公开剧情、场景描写、对白是否原字原句输出，严禁在段落间插入分析点评！
4. 【NPC人设规范】：NPC人设中严禁复制正文剧情对白，严禁捏造行为模式指南！
5. 【标签合并同类项】：连续同类内容只在首段打标签，不需要每行重复打标。

请精炼列出 1-3 条具体审查意见，若完全合规请直接返回"质检合格"。`;

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

      const rawExcerpt = (this.currentParsedData?.text || '').substring(0, 5000);

      const prompt = `你是模组精准清理与打标修复专家。请根据以下修改意见，对章节【${this.activeAuditChapter.title}】的内容进行净化与修复：
修改要求：${customInstruction || '彻底清理一切主观心理分析与哲学废话，保证正文剧情对话一字不改，合并同类项规范中文行首标签并保留结尾声明'}

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

        const prompt = `你是一个顶级跑团模组质检审核专家。
请结合模组原文参考片段，对当前已生成的 ${this.cutChapters.length} 个章节进行全局扫描审查，生成一份精炼的全局修改清单：

【模组原文参考片段】：
${rawExcerpt}

【全模组章节概览】：
${chapterOverview}

【审查核心原则】：
1. 【忠实原作节奏】：若模组原文中作者将正文剧情与KP带团建议、角色扮演指南交替穿插，这是原作固有的编排方式，绝对属于正常内容！严禁要求把正文合并或将KP信息移到末尾！
2. 【杜绝主观脑补】：只严查所有章节是否包含 AI 擅自撰写的恋爱哲学、主观心理分析、心路历程，如有要求统统清除！
3. 【正文原汁原味保真】：剧情描写与对白一字不改原样输出，严禁在正文段落之间写总结分析！
4. 【NPC人设规范】：NPC和猫人设中严禁复制正文剧情对白，严禁捏造行为模式指南！
5. 【标签合并同类项】：连续同类内容只在首段打标签，不需要每行重复打标；
6. 【结尾完整】：末尾必须包含标准防擅自编造声明。

请输出条理清晰的【全局问题诊断】与【精准改进指令】，供后续修复时直接使用。`;

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
      const chapters = await database.moduleChapters.where('moduleId').equals(moduleId).sortBy('sortOrder');

      // 动态计算并同步所有章节的真实字数与总字数（含目录字数、地图字数、图片简介字数）
      let chapsTotalWords = 0;
      chapters.forEach(c => {
        const cWords = this.countWords(c.content || '');
        c.wordCount = cWords;
        chapsTotalWords += cWords;
      });
      let images = [];
      if (database && database.moduleImages) {
        try {
          images = await database.moduleImages.where('moduleId').equals(moduleId).toArray();
        } catch (e) {}
      }
      const tocWords = this.getTocWordCount(mod, chapters);
      const mapWords = this.getMapWordCount(mod, chapters);
      const imgWords = this.getImagesWordCount(mod, images);
      const realTotalWords = chapsTotalWords + tocWords + mapWords + imgWords;
      mod.wordCount = realTotalWords;
      mod.chapterCount = chapters.length;

      if (database && database.modules && mod.id) {
        await database.modules.update(mod.id, { wordCount: realTotalWords, chapterCount: chapters.length });
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
      if (chaptersView) chaptersView.style.display = 'flex';
      if (tocView) tocView.style.display = 'none';
      if (mapView) mapView.style.display = 'none';
      if (galleryView) galleryView.style.display = 'none';

      this.renderModuleDetailGroupedChapters(chapters);
      this.renderModuleDetailToc(chapters);
      this.renderModuleDetailMap(chapters);
      this.renderModuleDetailGallery(chapters, mod.id);
    },

    renderModuleDetailGroupedChapters(chapters) {
      const container = document.getElementById('module-detail-grouped-chapters');
      if (!container) return;
      container.innerHTML = '';

      const GROUP_ORDER = [
        '导入',
        '事前公开',
        '大纲与真相',
        'NPC与猫',
        '人设',
        'HO秘密与设定',
        '单人线',
        '正文',
        '结局',
        '其他分类'
      ];

      const classify = (chap) => {
        const c = (chap.category || '').toLowerCase();
        const t = (chap.title || '').toLowerCase();
        if (c.includes('导入') || t.includes('导入') || t.includes('开局') || t.includes('序幕')) return '导入';
        if (c.includes('公开') || t.includes('公开') || t.includes('事前') || t.includes('须知')) return '事前公开';
        if (c.includes('真相') || c.includes('kp信息') || c.includes('大纲') || c.includes('带团') || t.includes('真相') || t.includes('大纲') || t.includes('机制')) return '大纲与真相';
        if (c.includes('npc') || c.includes('猫') || t.includes('npc') || t.includes('猫')) return 'NPC与猫';
        if (c.includes('人设') || t.includes('人设') || t.includes('人物设定')) return '人设';
        if (c.includes('ho') || c.includes('秘密') || t.includes('ho') || t.includes('秘密')) return 'HO秘密与设定';
        if (c.includes('单人') || t.includes('单人')) return '单人线';
        if (c.includes('结局') || t.includes('结局') || t.includes('结末') || t.includes('尾声')) return '结局';
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

        header.addEventListener('click', () => {
          groupBox.classList.toggle('collapsed');
        });

        const itemsList = document.createElement('div');
        itemsList.className = 'mod-group-items-list';

        list.forEach(({ chapter, originalIndex }) => {
          const row = document.createElement('div');
          row.className = 'mod-chapter-item-row';
          const cleanTitle = this.cleanChapterTitle(chapter.title, this.activeDetailModule?.name);
          const cWords = this.countWords(chapter.content || '');
          chapter.wordCount = cWords;
          row.innerHTML = `
            <span class="mod-chapter-name">${cleanTitle}</span>
            <span class="mod-chapter-words">${cWords} 字</span>
          `;

          row.addEventListener('click', () => {
            this.openChapterReader(chapters, originalIndex, 'pc');
          });

          itemsList.appendChild(row);
        });

        groupBox.appendChild(header);
        groupBox.appendChild(itemsList);
        container.appendChild(groupBox);
      });
    },

    renderModuleDetailToc(chapters) {
      const tocContainer = document.getElementById('module-detail-toc-view');
      if (!tocContainer) return;
      let html = '<div style="font-weight: 600; font-size: 13px; margin-bottom: 8px;">模组章节顺序总览</div>';
      html += '<div style="display: flex; flex-direction: column; gap: 6px;">';
      chapters.forEach((chap, idx) => {
        const cleanTitle = this.cleanChapterTitle(chap.title, this.activeDetailModule?.name);
        html += `
          <div style="display: flex; justify-content: space-between; align-items: center; background: var(--secondary-bg, #F9F8F5); padding: 8px 12px; border-radius: 8px; cursor: pointer;" class="mod-toc-item-row" data-idx="${idx}">
            <span style="font-weight: 500; font-size: 12.5px;">${idx + 1}. ${cleanTitle}</span>
            <span class="module-plan-tag">${chap.category || '正文'}</span>
          </div>
        `;
      });
      html += '</div>';
      tocContainer.innerHTML = html;

      tocContainer.querySelectorAll('.mod-toc-item-row').forEach(el => {
        el.addEventListener('click', () => {
          const idx = parseInt(el.dataset.idx, 10);
          this.openChapterReader(chapters, idx, 'pc');
        });
      });
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

        // 若仍为空，生成默认初始层级结构确保非空
        if (dbLocations.length === 0) {
          const fallbackNodes = [
            { moduleId: mod.id, name: `${mod.name}大区域`, parent: '', level: 1, desc: mod.summary || '主区域环境与主线背景', prompt: '', imageUrl: '', imageStatus: 'idle' },
            { moduleId: mod.id, name: '核心建筑群', parent: `${mod.name}大区域`, level: 2, desc: '主要探索线索集中区域', prompt: '', imageUrl: '', imageStatus: 'idle' },
            { moduleId: mod.id, name: '正厅走廊', parent: '核心建筑群', level: 3, desc: '', prompt: '', imageUrl: '', imageStatus: 'idle' },
            { moduleId: mod.id, name: '侧室庭院', parent: '核心建筑群', level: 3, desc: '', prompt: '', imageUrl: '', imageStatus: 'idle' }
          ];
          for (const item of fallbackNodes) {
            if (dbInstance.moduleLocationNav) {
              const id = await dbInstance.moduleLocationNav.add(item);
              item.id = id;
            }
            dbLocations.push(item);
          }
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
      drawBtn.onclick = async () => {
        await this.startModuleMapImageDrawing(mod.id, chapters, drawBtn);
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
          // 图文版：原汁原味左侧加横图
          nodeEl.innerHTML = `
            <div style="display: flex; gap: 10px; align-items: flex-start;">
              <div class="mod-map-avatar-container" style="position: relative; width: 68px; height: 50px; border-radius: 6px; overflow: hidden; background: var(--secondary-bg); flex-shrink: 0; display: flex; align-items: center; justify-content: center; cursor: pointer; border: 1px solid var(--border-color); margin-top: 2px;">
                ${loc.imageUrl ? `<img src="${loc.imageUrl}" alt="${loc.name}" style="width: 100%; height: 100%; object-fit: cover;" />` : defaultThumbSvg}
                <button type="button" class="mod-map-expand-btn" style="position: absolute; bottom: 2px; left: 2px; background: rgba(0,0,0,0.55); border: none; border-radius: 4px; color: #fff; width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; cursor: pointer; padding: 0;">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
                </button>
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

        // 图文版头像交互：三连击下载、左下角展开大图、长按重新生成
        if (isRich) {
          const avatarContainer = nodeEl.querySelector('.mod-map-avatar-container');
          const expandBtn = nodeEl.querySelector('.mod-map-expand-btn');

          if (expandBtn) {
            expandBtn.onclick = (e) => {
              e.stopPropagation();
              if (loc.imageUrl) {
                this.openModuleMapExpandModal(loc.name, loc.imageUrl);
              }
            };
          }

          if (avatarContainer) {
            let clickCount = 0;
            let clickTimer = null;
            let pressTimer = null;

            avatarContainer.addEventListener('mousedown', () => {
              pressTimer = setTimeout(() => {
                this.openModuleMapRegenModal(loc, mod.id, chapters);
              }, 700);
            });
            avatarContainer.addEventListener('touchstart', () => {
              pressTimer = setTimeout(() => {
                this.openModuleMapRegenModal(loc, mod.id, chapters);
              }, 700);
            });
            const clearPress = () => {
              if (pressTimer) clearTimeout(pressTimer);
            };
            avatarContainer.addEventListener('mouseup', clearPress);
            avatarContainer.addEventListener('mouseleave', clearPress);
            avatarContainer.addEventListener('touchend', clearPress);

            avatarContainer.addEventListener('click', (e) => {
              if (e.target.closest('.mod-map-expand-btn')) return;
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
                }
                clickCount = 0;
              }, 500);
            });
          }
        }

        // 长按方框卡片查看与修改 Prompt
        let cardPressTimer = null;
        nodeEl.addEventListener('mousedown', (e) => {
          if (e.target.closest('button') || e.target.closest('.mod-map-avatar-container')) return;
          cardPressTimer = setTimeout(() => {
            this.openModuleMapPromptModal(loc, mod.id, chapters);
          }, 700);
        });
        nodeEl.addEventListener('touchstart', (e) => {
          if (e.target.closest('button') || e.target.closest('.mod-map-avatar-container')) return;
          cardPressTimer = setTimeout(() => {
            this.openModuleMapPromptModal(loc, mod.id, chapters);
          }, 700);
        });
        const clearCardPress = () => {
          if (cardPressTimer) clearTimeout(cardPressTimer);
        };
        nodeEl.addEventListener('mouseup', clearCardPress);
        nodeEl.addEventListener('mouseleave', clearCardPress);
        nodeEl.addEventListener('touchend', clearCardPress);

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

    async startModuleMapImageDrawing(moduleId, chapters, btn) {
      const dbInstance = typeof db !== 'undefined' ? db : (window.db || null);
      if (!dbInstance || !dbInstance.moduleLocationNav) return;

      const locations = await this.getLocationsByModuleId(moduleId);
      const pendingLocs = locations.filter(l => !l.imageUrl);

      if (pendingLocs.length === 0) {
        if (typeof window.showCustomAlert === 'function') {
          await window.showCustomAlert('提示', '全部地点已绘制完成');
        }
        return;
      }

      if (typeof window.showCustomConfirm === 'function') {
        const confirmed = await window.showCustomConfirm('绘制地图', '将开始为所有未绘制图像的地点逐一绘制唯美场景图 确认开始吗');
        if (!confirmed) return;
      }

      if (btn) {
        btn.disabled = true;
        btn.textContent = '绘制中';
      }

      const statusTip = document.getElementById('module-map-status-tip');
      if (statusTip) {
        statusTip.style.display = 'block';
        statusTip.textContent = `正在逐一生图 剩余 ${pendingLocs.length} 张`;
      }

      for (let i = 0; i < pendingLocs.length; i++) {
        const loc = pendingLocs[i];
        const prompt = loc.prompt || `masterpiece, scenery, highly detailed, landscape, ${loc.name}`;

        try {
          if (statusTip) {
            statusTip.textContent = `正在绘制 ${loc.name} 剩余 ${pendingLocs.length - i} 张`;
          }

          let imgDataUrl = '';
          if (typeof window.callNovelAiDirect === 'function') {
            imgDataUrl = await window.callNovelAiDirect(prompt);
          } else if (typeof generateNovelAIImageForCharacter === 'function') {
            imgDataUrl = await generateNovelAIImageForCharacter('', prompt);
          }

          if (imgDataUrl) {
            // 默认压缩50%
            if (typeof compressImage === 'function') {
              imgDataUrl = await compressImage(imgDataUrl, 0.5, 900);
            }
            loc.imageUrl = imgDataUrl;
            await dbInstance.moduleLocationNav.put(loc);
            this.renderModuleDetailMap(chapters);
          } else {
            throw new Error('未获取到图像数据');
          }

          // 间隔10秒继续生成下一个
          if (i < pendingLocs.length - 1) {
            if (statusTip) statusTip.textContent = `完成 ${loc.name} 等待 10 秒继续下一张`;
            await new Promise(resolve => setTimeout(resolve, 10000));
          }
        } catch (e) {
          console.error('生图失败', loc.name, e);
          if (statusTip) statusTip.textContent = `绘制 ${loc.name} 失败 点击绘制可重试`;
          if (btn) {
            btn.disabled = false;
            btn.textContent = '重试';
          }
          alert(`绘制 ${loc.name} 失败 请点击重试继续`);
          return;
        }
      }

      if (statusTip) {
        statusTip.textContent = '全部地图绘制完成';
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
      const closeBtn = document.getElementById('close-module-map-regen-btn');
      const cancelBtn = document.getElementById('cancel-module-map-regen-btn');
      const confirmBtn = document.getElementById('confirm-module-map-regen-btn');
      if (!modal) return;

      if (nameEl) nameEl.textContent = `地点：${loc.name}`;

      const closeModal = () => modal.classList.remove('visible');
      if (closeBtn) closeBtn.onclick = closeModal;
      if (cancelBtn) cancelBtn.onclick = closeModal;

      if (confirmBtn) {
        confirmBtn.onclick = async () => {
          closeModal();
          confirmBtn.disabled = true;
          const prompt = loc.prompt || `masterpiece, scenery, highly detailed, landscape, ${loc.name}`;
          try {
            let imgDataUrl = '';
            if (typeof window.callNovelAiDirect === 'function') {
              imgDataUrl = await window.callNovelAiDirect(prompt);
            }
            if (imgDataUrl) {
              if (typeof compressImage === 'function') {
                imgDataUrl = await compressImage(imgDataUrl, 0.5, 900);
              }
              loc.imageUrl = imgDataUrl;
              const dbInstance = typeof db !== 'undefined' ? db : (window.db || null);
              if (dbInstance && dbInstance.moduleLocationNav) {
                await dbInstance.moduleLocationNav.put(loc);
              }
              this.renderModuleDetailMap(chapters);
            }
          } catch (e) {
            console.error('单独生图失败', e);
            alert(`生成 ${loc.name} 图像失败`);
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
        locateBtn.textContent = '定位中...';
        locateBtn.disabled = true;
      }

      const chapterSummary = chapters.map((c, i) => `${i + 1}. 【${c.title}】[${c.category}]: ${c.content.substring(0, 120).replace(/\n+/g, ' ')}...`).join('\n');
      const imageList = images.map((img, i) => `${i + 1}. 名称: ${img.name || `图片_${i + 1}`} (页码:${img.pageNumber || '未知'}, 尺寸:${img.width}x${img.height})`).join('\n');

      const prompt = `你是专业的跑团模组插图定位与剧透甄别专家。当前模组包含以下章节列表和插图列表：

【模组章节列表】：
${chapterSummary}

【图片列表】：
${imageList}

【任务要求】：
1. 结合图片名称与各章节的剧情语境，判断每张图片最适宜插入的章节编号。
2. 甄别剧透属性：后期异化形态立绘、关键伤亡CG、密室停尸房地图标记为剧透(isSensitive: true)；常规初期立绘、公开区域地图标记为非剧透(isSensitive: false)。
3. 提供一句精炼的中文内容描述(description)。

请直接输出 JSON 数组格式：
[
  { "imageIndex": 1, "chapterIndex": 1, "isSensitive": false, "description": "公开村落全景地图" }
]`;

      try {
        const response = await this.callAI('你是一个高精度跑团模组插图排版定位助手，只输出合法JSON数组。', prompt);
        let parsedMatches = [];
        try {
          const jsonMatch = response.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            parsedMatches = JSON.parse(jsonMatch[0]);
          }
        } catch (e) {
          console.warn('[模组] 解析图片定位JSON异常', e);
        }

        for (let i = 0; i < images.length; i++) {
          const img = images[i];
          const matched = parsedMatches.find(m => m.imageIndex === (i + 1));
          let targetChap = chapters[0];
          if (matched && matched.chapterIndex && chapters[matched.chapterIndex - 1]) {
            targetChap = chapters[matched.chapterIndex - 1];
          }

          const placementText = `已定位至章节：${targetChap.title}`;
          img.placement = placementText;
          if (matched && typeof matched.isSensitive === 'boolean') {
            img.isSensitive = matched.isSensitive;
          }
          if (matched && matched.description) {
            img.description = matched.description;
          }

          if (img.id) {
            await database.moduleImages.update(img.id, {
              placement: placementText,
              isSensitive: img.isSensitive,
              description: img.description
            });
          }

          const tag = `【插图·${img.name || '剧情CG'}】`;
          if (!targetChap.content.includes(tag)) {
            targetChap.content = `${tag}\n\n${targetChap.content}`;
            targetChap.wordCount = this.countWords(targetChap.content);
            await database.moduleChapters.put(targetChap);
          }
        }

        await this.renderModuleDetailGallery(chapters, moduleId);
        if (typeof global.showCustomAlert === 'function') {
          global.showCustomAlert('定位完成', `已成功将 ${images.length} 张插图智能匹配并标注至对应剧情章节！`);
        }
      } catch (err) {
        console.warn('[模组] 智能定位插图异常:', err);
        if (typeof global.showCustomAlert === 'function') {
          global.showCustomAlert('定位提示', '已将插图按顺序关联至各主要章节');
        }
      } finally {
        if (locateBtn) {
          locateBtn.textContent = '定位';
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
      if (viewMode === 'pc') {
        const lines = displayContent.split('\n');
        const pcLines = lines.filter(l => !l.startsWith('【KP信息】') && !l.startsWith('【KP带团指引批注') && !l.startsWith('【秘密'));
        displayContent = pcLines.join('\n');
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
      if (!this.cutChapters || this.cutChapters.length === 0) {
        if (typeof global.showCustomAlert === 'function') {
          global.showCustomAlert('提示', '暂无已重构好的章节数据');
        }
        return;
      }

      const moduleId = 'mod_' + Date.now();
      const bgTag = this.currentPlan?.bgTag || '日模';
      const endingTag = this.currentPlan?.endingTag || '普通';
      const contentTags = this.currentPlan?.contentTags || [];
      const customTags = this.currentPlan?.customTags || [];
      const allTags = this.sortModuleTags(bgTag, endingTag, contentTags, customTags);

      const chaptersToSave = this.cutChapters.map(chap => ({
        ...chap,
        wordCount: this.countWords(chap.content || ''),
        moduleId: moduleId
      }));

      const imagesToSave = (this.currentParsedData?.images || []).map(img => ({
        moduleId: moduleId,
        imageIndex: img.imageIndex,
        name: img.name,
        dataUrl: img.dataUrl,
        isSensitive: !!img.isSensitive,
        isDiscarded: !!img.isDiscarded,
        pageNumber: img.pageNumber || 1,
        width: img.width || 800,
        height: img.height || 600,
        format: img.format || 'JPEG',
        description: img.description || '',
        annotation: img.annotation || '',
        placement: img.placement || '文档插图'
      }));

      const tempModForToc = {
        name: this.currentParsedData?.moduleName || '跑团模组',
        toc: this.currentPlan?.toc || [],
        mapNodes: this.currentPlan?.mapNodes || []
      };
      const tocWords = this.getTocWordCount(tempModForToc, chaptersToSave);
      const mapWords = this.getMapWordCount(tempModForToc, chaptersToSave);
      const imgWords = this.getImagesWordCount(tempModForToc, imagesToSave);
      const realTotalWords = chaptersToSave.reduce((sum, c) => sum + (c.wordCount || 0), 0) + tocWords + mapWords + imgWords;

      const moduleRecord = {
        id: moduleId,
        name: this.currentParsedData?.moduleName || '跑团模组',
        type: this.currentPlan?.moduleType || '线性',
        ruleSystem: this.currentPlan?.ruleSystem || 'coc',
        scaleType: this.currentPlan?.scaleType || '1v1',
        summary: this.currentPlan?.summary || '无剧透模组概览',
        bgTag: bgTag,
        endingTag: endingTag,
        contentTags: contentTags,
        customTags: customTags,
        tags: allTags,
        mapNodes: this.currentPlan?.mapNodes || [],
        group: '默认分组',
        wordCount: realTotalWords,
        chapterCount: chaptersToSave.length,
        status: 'ready',
        githubSync: false,
        createdAt: Date.now()
      };

      await this.safeDBOperation('保存模组到数据库', async (db) => {
        await db.modules.put(moduleRecord);
        await db.moduleChapters.bulkPut(chaptersToSave);
        if (imagesToSave.length > 0) {
          await db.moduleImages.bulkPut(imagesToSave);
        }
        return true;
      });

      this.clearDraft();
      this.switchSubPanel('library');

      if (typeof global.showCustomAlert === 'function') {
        global.showCustomAlert('保存成功', `模组【${moduleRecord.name}】及 ${chaptersToSave.length} 个带团章节已存入模组库。`);
      }
    },

    async exportModuleZipBundle(specificChapters = null, specificName = null) {
      const chaptersToExport = specificChapters || this.cutChapters;
      if (!chaptersToExport || chaptersToExport.length === 0) return;

      const modName = specificName || this.currentParsedData?.moduleName || '模组';

      if (!global.JSZip) {
        this.exportModuleFallbackTxt(chaptersToExport, modName);
        return;
      }

      try {
        const zip = new global.JSZip();
        let overviewText = `模组名称：${modName}\n章节总数：${chaptersToExport.length}\n导出时间：${new Date().toLocaleString()}\n\n【章节列表目录】\n`;

        chaptersToExport.forEach((chap, idx) => {
          const numStr = String(idx + 1).padStart(2, '0');
          const fileName = `${numStr}_${chap.title}.txt`;
          zip.file(fileName, chap.content);
          overviewText += `${numStr}. ${chap.title} (分类: ${chap.category}, 字数: ${chap.wordCount})\n`;
        });

        zip.file('00_模组总览与导读.txt', overviewText);

        const contentBlob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(contentBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${modName}_跑团章节包.zip`;
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
        const moduleId = 'mod_' + Date.now();
        const chapters = [];

        if (fileName.endsWith('.zip') && global.JSZip) {
          const zip = await global.JSZip.loadAsync(file);
          const txtFileNames = Object.keys(zip.files).filter(name => name.endsWith('.txt') && !name.startsWith('__MACOSX'));
          txtFileNames.sort();

          let order = 1;
          for (const name of txtFileNames) {
            const content = await zip.file(name).async('text');
            const cleanTitle = name.replace(/\.txt$/i, '').replace(/^[0-9]+[_\-\s]+/, '');
            chapters.push({
              id: 'chap_' + Date.now() + '_' + order,
              moduleId: moduleId,
              title: cleanTitle,
              category: '正文',
              wordCount: this.countWords(content),
              content: content,
              sortOrder: order
            });
            order++;
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
                moduleId: moduleId,
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
              moduleId: moduleId,
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

        const moduleRecord = {
          id: moduleId,
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

        const tocWords = this.getTocWordCount(moduleRecord, chapters);
        const mapWords = this.getMapWordCount(moduleRecord, chapters);
        const imgWords = this.getImagesWordCount(moduleRecord, []);
        moduleRecord.wordCount = chapsTotalWords + tocWords + mapWords + imgWords;

        await this.safeDBOperation('直接导入模组', async (db) => {
          await db.modules.put(moduleRecord);
          await db.moduleChapters.bulkPut(chapters);
          return true;
        });

        await this.renderLibraryList();

        if (typeof global.showCustomAlert === 'function') {
          global.showCustomAlert('导入成功', `成功将模组【${baseName}】及 ${chapters.length} 个章节存入模组库！`);
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

      let allModules = await this.getAllModules();
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

      if (!allModules || allModules.length === 0) {
        listContainer.style.display = 'none';
        emptyContainer.style.display = 'flex';
        return;
      }

      listContainer.style.display = 'flex';
      emptyContainer.style.display = 'none';
      listContainer.innerHTML = '';

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

      allModules.forEach(mod => {
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

        listContainer.appendChild(item);
      });
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

      let promptBlock = '=== 【当前跑团模组活跃章节】 ===\n你现在是跑团守秘人（KP），请根据以下已加载的模组章节内容推进游戏，严格遵守防剧透与判定规范：\n\n';

      activeChapters.forEach(c => {
        promptBlock += `【当前章节：${c.title}】(${c.category})\n${c.content}\n\n`;
      });

      promptBlock += '=== 【模组带团指令】 ===\n1. 仅围绕上述活跃章节描写，禁止编造后续未加载章节剧情；\n2. 遇到【检定】标记引导玩家掷骰；\n3. 遇到【KP批注】按批注节奏推进。\n==============================';

      return promptBlock;
    },

    initEventListeners() {
      const backBtn = document.getElementById('modules-back-btn');
      if (backBtn) {
        backBtn.addEventListener('click', () => {
          if (typeof global.showScreen === 'function') {
            global.showScreen('home-screen');
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
            rethinkBtn.textContent = '重新思考';
            rethinkBtn.style.opacity = '1';
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

          if (primaryBtn) {
            primaryBtn.textContent = '正在通读全文重构...';
            primaryBtn.style.opacity = '0.7';
          }
          const step1AnalyzeBtn = document.getElementById('module-step1-analyze-btn');
          if (step1AnalyzeBtn) {
            step1AnalyzeBtn.textContent = '正在通读全文重构...';
            step1AnalyzeBtn.style.opacity = '0.7';
          }

          try {
            const plan = await this.generateCuttingPlan();
            this.renderPlanUI();
            this.setWizardStep(2);
          } catch (err) {
            console.warn('[模组] 生成方案提示:', err);
            if (typeof global.showCustomAlert === 'function') {
              global.showCustomAlert('重构失败', err.message || err);
            }
          } finally {
            if (primaryBtn) primaryBtn.style.opacity = '1';
            if (step1AnalyzeBtn) {
              step1AnalyzeBtn.textContent = '开始分析';
              step1AnalyzeBtn.style.opacity = '1';
            }
            this.updateBottomActionBar();
          }
        } else if (this.currentStep === 2) {
          if (this.isCuttingRunning) {
            this.setWizardStep(3);
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
          if (chaptersView) chaptersView.style.display = target === 'chapters' ? 'flex' : 'none';
          if (tocView) tocView.style.display = target === 'toc' ? 'block' : 'none';
          if (mapView) mapView.style.display = target === 'map' ? 'block' : 'none';
          if (galleryView) galleryView.style.display = target === 'gallery' ? 'flex' : 'none';
        });
      });

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
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const dataUrl = await this.compressImageFile(file);
            const imgRecord = {
              moduleId: this.activeDetailModule.id,
              name: file.name.replace(/\.[^/.]+$/, '').trim() || `插图_${Date.now()}_${i + 1}`,
              dataUrl: dataUrl,
              placement: '未定位',
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
              this.exportModuleZipBundle(chapters, this.activeDetailModule.name);
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
          if (typeof global.showCustomAlert === 'function') {
            global.showCustomAlert('模组设置', 'GitHub 云端同步与模组仓库功能正在接入中');
          } else if (typeof alert === 'function') {
            alert('GitHub 云端同步与模组仓库功能正在接入中');
          }
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

      this.loadDraft();
    }
  };

  function renderModulesScreen() {
    console.log('[模组] 渲染模组主界面');
    if (!ModuleManager.currentParsedData) {
      if (!ModuleManager.loadDraft()) {
        ModuleManager.resetImportUI();
        ModuleManager.switchSubPanel('wizard');
        ModuleManager.setWizardStep(1);
      }
    } else {
      ModuleManager.switchSubPanel(ModuleManager.activeSubPanel || 'wizard');
      ModuleManager.setWizardStep(ModuleManager.currentStep || 1);
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
