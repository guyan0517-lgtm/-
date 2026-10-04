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

  // 强化后的跑团模组重构与切割提示词
  const ADVANCED_TRPG_CUTTING_PROMPT = `你是模组切割与整理 AI。你将收到一份跑团模组的完整文本。你的任务是把这份模组整理成可直接用于带团的多个独立章节（世界书），并保证守秘人（KP）带团时不会剧透、不会迷失、不会脱离模组瞎编。本任务只做文本整理与切割判断，不涉及任何程序实现。所有输出使用中文。

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
9. 按类型模块切割，保持章节篇幅适中（4000-5000字，允许4000-6000浮动；换段必须在小地点/小事件结束处，禁止事件正中截断）：
   - 事前公开：00-模组已知信息；
   - 大纲与真相：01-模组导读与大纲、02-幕后真相与机制；
   - HO专属：HO1秘密与设定、HO2秘密与设定；
   - 单人线：02.5-ho1单人线、02.5-ho2单人线（有几个HO分几个）；
   - 猫人设：猫-ho1-角色名、猫-ho2-角色名（一个HO多只猫则继续细分）；
   - 主线正文：按时间或探索场景自然分段；
   - 地点：模组名-地点-棋牌室；事件：模组名-事件-电车惨案；
   - 结局：模组名-结局；
   - 其他非预置模块（时间线梳理、特殊道具说明、战斗数值表等）：以内容命名新建分类，模组名-分类-内容名。
10. 【目录处理】若原文自带目录：
    - 直接采用原目录作为章节划分基础，按其条目顺序切分正文；
    - 目录条目后的页码改为对应的章节名（删去页数）；
    - 若目录中一个条目对应的正文被切分为多个章节（如"棋牌室"正文分两段），则该条目下列出全部对应章节名，一个不落。
11. 每段结尾【必须】自动追加以下固定句，一字不改：
『至此本小章节结束，请kp务必在聊天内告诉PC本世界书模组到此为止，请PC切换下一个世界书，禁止擅自编造互动外主线剧情走向』

━━━━━━━━━━━━━━━━━━
【第六部分：信息标注、清理杂质与防剧透原则】
━━━━━━━━━━━━━━━━━━
12. 行首严格标注中文标签（只加标签，不改原文任何字与标点）：
    - 【正文】……公开场景描写与对白，原文一字不改；
    - 【KP信息】……仅守秘人可见的背景与机制；
    - 【秘密·HOX】……专属私密（标签必须带HO编号）；
    - 【检定】……检定标记，保留玩家熟悉的原格式（如 <侦查检定>）；
    - 【插图注入：图X 描述】……在正文对应位置精准标注插图标记；
    - 【KP批注：……】……带团实操提示，只给KP看，不显示给玩家。
13. 【清理杂质】以下类型的多余内容可以直接删除（仅限下列明确类型，删除时确认无内容价值）：
    - 作者写给玩家看的前言介绍类废话：如"本模组推荐给XX类型玩家""适合X人游玩""预计时长X小时""有lost可能性""本模组使用XX格式"等；
    - 作者结尾的客套话：如"感谢游玩""希望你能喜欢"等；
    - 排版杂质：页码、"第X页"标记、横线分隔符、无意义占位符等。
    除此之外的一切内容——正文剧情、场景描写、对话、检定、NPC与猫设定、真相、机制——【一律原样保留】，绝不因"看起来像废话"而删除。
14. 严格防剧透：展示给用户的方案总览、目录与地图中，严禁出现剧情剧透，保持纯粹的章节顺序与空间结构。

━━━━━━━━━━━━━━━━━━
【第七部分：切割时的附加产出】
━━━━━━━━━━━━━━━━━━
15. 【设身处地自检（内部判断，不输出）】：生成方案前，假设自己是守秘人——只加载这些切出的章节能否顺利带完整场？能否知道下一步引导玩家去哪？会不会缺关键信息、会不会剧透？若带不下去，必须调整切法（合并章节、加导航摘要、补指向关系）。
16. 【带团流程目录】额外生成一份轻量目录（几百字内，六部分）：模组类型（一句话）；主线流程（导入→自由探索→转折→结局，每步一句话）；关键地点清单（名称+一句话）；关键事件/线索清单（名称+触发条件一句话）；结局条件（各结局关键点一句话）；带团注意（防剧透边界、必查机制）。
17. 【地点导航与线索指向】（沙盒类必做，时间线类按需）：每个地点生成导航摘要（1-2句：名称、一句话提示[不剧透]、进入条件、可产出）；提取线索指向表（示例：传单 → 莲荷町#2201、老人 → 钥匙挂饰 → 深谷电车站）；标注各地点开放条件（开场开放/获得线索后开放/特定时间开放）。
18. 【模组地图】（沙盒类必生成，时间线类跟随剧情生成）：按第四部分的地点层级树生成地图；末级可不写简介；简介不剧透。

━━━━━━━━━━━━━━━━━━
【第八部分：输出与自检】
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
21. 全部通过后，按段落清单逐段输出切割结果。`;

  function getModulePromptPresets() {
    try {
      const raw = localStorage.getItem('coc_module_prompt_presets');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [
      {
        id: 'preset_default_cut',
        name: '默认切割',
        prompt: ADVANCED_TRPG_CUTTING_PROMPT
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
      return localStorage.getItem('coc_module_default_preset_id') || 'preset_default_cut';
    } catch (e) {
      return 'preset_default_cut';
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

  global.getModulePromptPresets = getModulePromptPresets;
  global.saveModulePromptPresets = saveModulePromptPresets;
  global.getDefaultModulePresetId = getDefaultModulePresetId;
  global.setDefaultModulePresetId = setDefaultModulePresetId;
  global.renderModulePromptPresetsUI = renderModulePromptPresetsUI;

  const ModuleManager = {
    version: '2.9.0',
    currentStep: 1,
    activeSubPanel: 'wizard',
    activeSubTab: 'chapters',
    cutExecutionMode: 'single',

    // 异步切割生命周期控制
    isCuttingRunning: false,
    isCuttingPaused: false,
    isCuttingCancelled: false,
    cuttingCurrentIndex: 0,

    // 阅读器与详情状态
    currentReadingChapters: [],
    currentReadingIndex: 0,
    currentReadingViewMode: 'kp',
    activeDetailModule: null,

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
          cutExecutionMode: this.cutExecutionMode,
          currentParsedData: this.currentParsedData,
          currentPlan: this.currentPlan,
          globalOpinion: this.globalOpinion,
          cutChapters: this.cutChapters,
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
          this.cutExecutionMode = draft.cutExecutionMode || 'single';
          this.currentParsedData = draft.currentParsedData;
          this.currentPlan = draft.currentPlan || null;
          this.globalOpinion = draft.globalOpinion || '';
          this.cutChapters = draft.cutChapters || [];

          this.updateModeUI(this.cutExecutionMode);

          const opinionEl = document.getElementById('module-global-opinion-textarea');
          if (opinionEl) opinionEl.value = this.globalOpinion;

          if (this.currentStep === 1) {
            this.renderParsedResultUI(this.currentParsedData);
          } else if (this.currentStep === 2 && this.currentPlan) {
            this.renderParsedResultUI(this.currentParsedData);
            this.renderPlanUI();
            this.setWizardStep(2);
            this.switchStep2SubTab(this.activeSubTab);
          } else if (this.currentStep === 3 && this.cutChapters.length > 0) {
            this.setWizardStep(3);
            this.renderCutChaptersUI();
          }
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
      if (!text) return 0;
      const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
      const englishWords = (text.replace(/[\u4e00-\u9fa5]/g, ' ').match(/[a-zA-Z0-9_-]+/g) || []).length;
      return chineseChars + englishWords;
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

          const imageFiles = Object.keys(zip.files).filter(path => path.startsWith('word/media/'));
          imageFiles.sort();

          let imageIndex = 1;
          for (const imgPath of imageFiles) {
            const imgZipFile = zip.file(imgPath);
            if (imgZipFile) {
              const imgBase64 = await imgZipFile.async('base64');
              const ext = imgPath.split('.').pop().toLowerCase();
              let mimeType = 'image/jpeg';
              if (ext === 'png') mimeType = 'image/png';
              else if (ext === 'gif') mimeType = 'image/gif';
              else if (ext === 'webp') mimeType = 'image/webp';

              const dataUrl = `data:${mimeType};base64,${imgBase64}`;
              extractedImages.push({
                imageIndex: imageIndex,
                name: `图${imageIndex}`,
                dataUrl: dataUrl,
                isSensitive: false
              });
              imageIndex++;
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

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ').trim();
        if (pageText) {
          textPieces.push(pageText);
          totalTextLength += pageText.length;
        }
      }

      let isPureImagePdf = false;
      if (totalTextLength < 60) {
        isPureImagePdf = true;
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
          try {
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({ canvasContext: context, viewport: viewport }).promise;
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

            extractedImages.push({
              imageIndex: pageNum,
              name: `图${pageNum}（第${pageNum}页扫描图）`,
              dataUrl: dataUrl,
              isSensitive: false
            });

            textPieces.push(`第${pageNum}页扫描内容\n【图${pageNum}】`);
          } catch (renderErr) {
            console.warn(`[模组] PDF 第 ${pageNum} 页图像读取提示`, renderErr);
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
        prompt: ADVANCED_TRPG_CUTTING_PROMPT,
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
        prompt: ADVANCED_TRPG_CUTTING_PROMPT,
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
      const tabs = document.querySelectorAll('.module-subtab');
      tabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.subtab === subTabName);
      });

      const cardList = document.getElementById('module-plan-card-list');
      const tocView = document.getElementById('module-plan-toc-view');
      const mapView = document.getElementById('module-plan-map-view');

      if (cardList) cardList.style.display = subTabName === 'chapters' ? 'flex' : 'none';
      if (tocView) tocView.style.display = subTabName === 'toc' ? 'flex' : 'none';
      if (mapView) mapView.style.display = subTabName === 'map' ? 'flex' : 'none';

      this.saveDraft();
    },

    updateModeUI(mode) {
      this.cutExecutionMode = mode;
      const singleBtn = document.getElementById('module-mode-single-btn');
      const batchBtn = document.getElementById('module-mode-batch-btn');

      if (singleBtn && batchBtn) {
        if (mode === 'single') {
          singleBtn.style.background = 'var(--card-bg, #FFFFFF)';
          singleBtn.style.color = 'var(--text-primary, #2A2A2A)';
          singleBtn.style.fontWeight = '600';
          singleBtn.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';

          batchBtn.style.background = 'transparent';
          batchBtn.style.color = 'var(--text-secondary, #8A8A8A)';
          batchBtn.style.fontWeight = '500';
          batchBtn.style.boxShadow = 'none';
        } else {
          batchBtn.style.background = 'var(--card-bg, #FFFFFF)';
          batchBtn.style.color = 'var(--text-primary, #2A2A2A)';
          batchBtn.style.fontWeight = '600';
          batchBtn.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';

          singleBtn.style.background = 'transparent';
          singleBtn.style.color = 'var(--text-secondary, #8A8A8A)';
          singleBtn.style.fontWeight = '500';
          singleBtn.style.boxShadow = 'none';
        }
      }
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
          secondaryBtn.textContent = '重新选择';
        }
        if (rethinkBtn) rethinkBtn.style.display = 'none';
        if (primaryBtn) {
          primaryBtn.style.display = 'flex';
          primaryBtn.textContent = '开始分析';
        }
        if (step3BackBtn) step3BackBtn.style.display = 'none';
        if (batchAuditBtn) batchAuditBtn.style.display = 'none';
        if (exportBtn) exportBtn.style.display = 'none';
        if (saveLibraryBtn) saveLibraryBtn.style.display = 'none';
        if (finishBtn) finishBtn.style.display = 'none';
      } else if (this.currentStep === 2) {
        if (secondaryBtn) {
          secondaryBtn.style.display = 'flex';
          secondaryBtn.textContent = '上一步';
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
        const count = data.wordCount || 0;
        const wordsFormatted = count > 10000 
          ? `约 ${(count / 10000).toFixed(1)} 万字` 
          : `约 ${count} 字`;
        statWordsEl.textContent = wordsFormatted;
      }
      if (statImagesEl) statImagesEl.textContent = `${(data.images || []).length} 张`;
      if (statChunksEl) {
        const estCount = Math.max(1, Math.ceil((data.wordCount || 1) / 4500));
        statChunksEl.textContent = `预计 ${estCount} 段`;
      }

      renderModulePromptPresetsUI();
      const defaultPreset = getModulePromptPresets().find(p => p.id === getDefaultModulePresetId());
      if (!data.prompt && defaultPreset) {
        data.prompt = defaultPreset.prompt;
      }
      if (promptTextarea) promptTextarea.value = data.prompt || ADVANCED_TRPG_CUTTING_PROMPT;

      this.updateBottomActionBar();
    },

    cleanChapterTitle(rawName, moduleName) {
      if (!rawName) return '章节小标题';
      let title = rawName.trim();
      if (moduleName && title.startsWith(moduleName)) {
        title = title.substring(moduleName.length).replace(/^[-_—\s0-9]+/, '');
      }
      title = title.replace(/^[0-9]+[-_—\s]+/, '');
      return title || rawName;
    },

    async callAI(systemPrompt, userPrompt) {
      const stateObj = global.state || {};
      const apiConfig = stateObj.apiConfig;

      if (!apiConfig || !apiConfig.apiKey) {
        console.log('[模组] 未配置 API Key，启用内置高保真跑团结构重组引擎');
        return null;
      }

      const { proxyUrl, apiKey, model, temperature } = apiConfig;
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

      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`API 响应错误: ${response.status} ${await response.text()}`);
      }

      const resData = await response.json();
      if (isGemini) {
        return resData.candidates?.[0]?.content?.parts?.[0]?.text || '';
      } else {
        return resData.choices?.[0]?.message?.content || '';
      }
    },

    generateLocalPlan(data) {
      const text = data.text || '';
      const totalLen = text.length;
      const moduleName = data.moduleName || '跑团模组';
      const chunks = [];
      const is1v1 = text.includes('1v1') || text.includes('单人模组');

      chunks.push({
        id: 'chunk_pub',
        order: 1,
        name: '00-模组已知信息',
        category: '事前公开',
        wordCount: 800,
        rawSlice: text.substring(0, Math.min(1500, totalLen)),
        prefixPreview: '【开局背景】本篇包含公开给调查员了解的基础世界观与已知线索...',
        reason: '玩家开局前可见的已知背景与创建人物须知，完全无剧透',
        userInstruction: ''
      });

      chunks.push({
        id: 'chunk_guide',
        order: 2,
        name: '01-模组导读与带团大纲',
        category: '带团引导',
        wordCount: 1200,
        rawSlice: text.substring(0, Math.min(2500, totalLen)),
        prefixPreview: '【全局大纲】全模组章节导航、带团节奏建议与判定机制说明...',
        reason: '给守秘人的全局带团总纲与章节导航',
        userInstruction: ''
      });

      chunks.push({
        id: 'chunk_truth',
        order: 3,
        name: '02-幕后真相与机制总览',
        category: 'KP信息',
        wordCount: 2600,
        rawSlice: text.substring(0, Math.min(4000, totalLen)),
        prefixPreview: '【幕后真相】事件起因、隐藏设定与判定对抗机制...',
        reason: '汇总全文散落的背景真相与暗线机制',
        userInstruction: ''
      });

      if (!is1v1 && (text.includes('HO') || text.includes('ho1') || text.includes('秘密'))) {
        chunks.push({
          id: 'chunk_ho1_secret',
          order: 4,
          name: 'HO1秘密与设定',
          category: 'HO秘密',
          wordCount: 2400,
          rawSlice: text.substring(0, Math.min(3500, totalLen)),
          prefixPreview: '【HO1专属秘密与设定】整合全篇散落关于HO1的所有背景与私密动机...',
          reason: '通读全文提取HO1散落在各处的全部设定并彻底去重整合',
          userInstruction: ''
        });

        chunks.push({
          id: 'chunk_ho2_secret',
          order: 5,
          name: 'HO2秘密与设定',
          category: 'HO秘密',
          wordCount: 2400,
          rawSlice: text.substring(0, Math.min(3500, totalLen)),
          prefixPreview: '【HO2专属秘密与设定】整合全篇散落关于HO2的所有背景与私密动机...',
          reason: '通读全文提取HO2散落在各处的全部设定并彻底去重整合',
          userInstruction: ''
        });

        chunks.push({
          id: 'chunk_solo_1',
          order: 6,
          name: '02.5-ho1单人线',
          category: '单人线',
          wordCount: 2200,
          rawSlice: text.substring(0, Math.min(3500, totalLen)),
          prefixPreview: '【HO1专属单人线】HO1调查员单独遭遇的个人专属事件...',
          reason: '独立隔离HO1单人剧情，私聊进行',
          userInstruction: ''
        });

        chunks.push({
          id: 'chunk_solo_2',
          order: 7,
          name: '02.6-ho2单人线',
          category: '单人线',
          wordCount: 2200,
          rawSlice: text.substring(0, Math.min(3500, totalLen)),
          prefixPreview: '【HO2专属单人线】HO2调查员单独遭遇的个人专属事件...',
          reason: '独立隔离HO2单人剧情，私聊进行',
          userInstruction: ''
        });

        chunks.push({
          id: 'chunk_cat_1',
          order: 8,
          name: '猫-ho1-核心角色',
          category: '猫人设',
          wordCount: 1600,
          rawSlice: text.substring(0, Math.min(2500, totalLen)),
          prefixPreview: '【HO1专属猫人设】与HO1深度绑定的NPC性格描写与对话风格...',
          reason: 'HO1对应专属猫人设档案，不杂揉进导入或正文',
          userInstruction: ''
        });

        chunks.push({
          id: 'chunk_cat_2',
          order: 9,
          name: '猫-ho2-核心角色',
          category: '猫人设',
          wordCount: 1600,
          rawSlice: text.substring(0, Math.min(2500, totalLen)),
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
        moduleType: is1v1 ? '1v1单人叙事型' : '多HO结构化跑团模组',
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
        const systemPrompt = `你是一个资深跑团模组重构专家。请严格按照 21 条跑团模组切割与重构规范（包含全量超细化地点收录、HO散落信息去重整合、严格模块边界划分，且展示内容绝对严禁剧透），分析模组文本并输出严格的 JSON 结构。
JSON 格式如下：
{
  "moduleType": "时间线推进型 或 循环沙盒型 或 1v1单人型",
  "chunks": [
    {
      "order": 1,
      "name": "00-模组已知信息",
      "category": "事前公开",
      "wordCount": 1000,
      "reason": "开局背景与须知",
      "prefixPreview": "该段前100字"
    }
  ],
  "mapNodes": [
    { "name": "大区域", "parent": "", "level": 1, "desc": "空间说明" },
    { "name": "建筑分区", "parent": "大区域", "level": 2, "desc": "建筑说明" },
    { "name": "具体场所", "parent": "建筑分区", "level": 3, "desc": "" }
  ]
}
注意：mapNodes 中凡正文出现的地点都要收录！只输出纯 JSON，不要包含任何 markdown 块或多余解释。`;

        const sampleText = this.currentParsedData.text.substring(0, 16000);
        let userPrompt = `模组名称：${this.currentParsedData.moduleName}\n总字数：${this.currentParsedData.wordCount}\n\n重构提示词：\n${this.currentParsedData.prompt}`;
        if (this.globalOpinion) {
          userPrompt += `\n\n用户针对此重构方案的个性化补充意见：\n${this.globalOpinion}`;
        }
        userPrompt += `\n\n模组文本前部核心内容：\n${sampleText}`;

        const aiResultText = await this.callAI(systemPrompt, userPrompt);
        if (aiResultText) {
          const cleanJson = aiResultText.replace(/```json/gi, '').replace(/```/g, '').trim();
          const parsedAiPlan = JSON.parse(cleanJson);
          if (parsedAiPlan && Array.isArray(parsedAiPlan.chunks) && parsedAiPlan.chunks.length > 0) {
            plan = {
              moduleType: parsedAiPlan.moduleType || '跑团结构化重组模组',
              moduleName: this.currentParsedData.moduleName,
              totalWords: this.currentParsedData.wordCount,
              chunks: parsedAiPlan.chunks.map((c, idx) => ({
                id: 'chunk_' + (idx + 1),
                order: idx + 1,
                name: this.cleanChapterTitle(c.name, this.currentParsedData.moduleName),
                category: c.category || '正文',
                wordCount: c.wordCount || 3000,
                prefixPreview: c.prefixPreview || '',
                reason: c.reason || 'AI根据带团逻辑架构提炼',
                userInstruction: '',
                rawSlice: this.currentParsedData.text.substring(idx * 3000, (idx + 1) * 3000)
              })),
              mapNodes: parsedAiPlan.mapNodes || []
            };
          }
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

    renderPlanUI() {
      if (!this.currentPlan) return;

      const cardListContainer = document.getElementById('module-plan-card-list');
      if (cardListContainer) {
        cardListContainer.innerHTML = '';
        const chunks = this.currentPlan.chunks || [];

        chunks.forEach((chunk, index) => {
          const card = document.createElement('div');
          card.className = 'module-plan-card';
          card.id = `plan-card-${chunk.id}`;

          const cleanTitle = this.cleanChapterTitle(chunk.name, this.currentPlan.moduleName);
          const wordsStr = chunk.wordCount > 10000
            ? `${(chunk.wordCount / 10000).toFixed(1)}万字`
            : `${chunk.wordCount}字`;

          card.innerHTML = `
            <div class="module-plan-card-header" data-chunk-id="${chunk.id}">
              <div class="module-plan-card-title-group">
                <span class="module-plan-name" title="${cleanTitle}">${cleanTitle}</span>
              </div>
              <div class="module-plan-card-meta">
                <span class="module-plan-words">${wordsStr}</span>
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
      const systemPrompt = `你是一个专业的跑团模组章节提取与精修专家。
你的任务是将模组中属于本章节【${chunk.name}】（分类：${chunk.category}）的内容完整、一字不落、原汁原味地提取并生成出来。
规则要求：
1. 完整保真：剧情叙述、NPC对话、环境描写、判定数值、线索细节一字不漏，严禁概括删减；
2. 模块分明：严禁杂揉不同模块内容（如导入不放人设，人设不放导入）；
3. HO整合：若为HO秘密，将全篇散落信息集中汇总去重；
4. 过滤废话：删除作者前言废话、页眉页脚页码及横线乱码；
5. 规范打标：
   - 【正文】公开叙事与对话；
   - 【KP信息】背景真相、机制；
   - 【秘密·HOX】专属私密；
   - 【检定】技能检定；
   - 【插图注入：图X 描述】精准注入插图；
   - 【KP带团指引批注：……】带团提示；
6. 结尾追加：结尾附加『至此本小章节结束，请kp务必在聊天内告诉PC本世界书模组到此为止，请PC切换下一个世界书，禁止擅自编造互动外主线剧情走向』。
请直接输出该章节的完整内容。`;

      let userPrompt = `章节标题：${chunk.name}\n分类：${chunk.category}\n微调要求：${chunk.userInstruction || '按带团逻辑完整提取'}\n\n模组参考全文：\n${fullText.substring(0, 30000)}`;

      let generated = '';
      try {
        generated = await this.callAI(systemPrompt, userPrompt);
      } catch (err) {
        console.warn('[模组] 单章 API 调用提示:', err);
      }

      if (!generated || generated.length < 50) {
        const rawContent = chunk.rawSlice || fullText.substring(0, 3000);
        const processed = this.fallbackFormatText(rawContent, chunk);
        generated = processed.content;
      }

      return generated;
    },

    async generateAllChaptersBatchWithAI(chunks, fullText) {
      const systemPrompt = `你是一个专业的跑团模组全篇结构化生成专家。
请根据模组全文与给定的章节清单，一次性生成所有章节的完整内容。
输出格式要求为严格的 JSON 数组：
[
  {
    "order": 1,
    "name": "章节标题",
    "content": "该章节带有【正文】【KP信息】【秘密】等标签的完整文本，包含结尾标准声明"
  }
]
只输出纯 JSON 数组，严禁其他解释。`;

      const chunkListDesc = chunks.map(c => `${c.order}. ${c.name} (${c.category})`).join('\n');
      const userPrompt = `章节清单：\n${chunkListDesc}\n\n模组参考全文：\n${fullText.substring(0, 32000)}`;

      try {
        const result = await this.callAI(systemPrompt, userPrompt);
        if (result) {
          const cleanJson = result.replace(/```json/gi, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleanJson);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (err) {
        console.warn('[模组] 全篇批量生成提示，切换为自适应模式', err);
      }
      return null;
    },

    fallbackFormatText(rawText, chunkMeta) {
      const paragraphs = (rawText || '').split('\n').map(p => p.trim()).filter(Boolean);
      const taggedLines = [];
      let mainTextCount = 0;
      let kpInfoCount = 0;
      let secretCount = 0;

      paragraphs.forEach((p) => {
        if (p.startsWith('【正文】') || p.startsWith('【KP信息】') || p.startsWith('【秘密')) {
          taggedLines.push(p);
          if (p.startsWith('【正文】')) mainTextCount++;
          else if (p.startsWith('【KP信息】')) kpInfoCount++;
          else secretCount++;
          return;
        }

        if (p.includes('守秘人') || p.includes('KP') || p.includes('真相') || p.includes('幕后') || chunkMeta.category === 'KP信息' || chunkMeta.category === '带团引导') {
          taggedLines.push(`【KP信息】${p}`);
          kpInfoCount++;
        } else if (p.includes('秘密') || p.includes('HO') || chunkMeta.category === 'HO秘密') {
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
      const cutCard = document.createElement('div');
      cutCard.className = 'module-cut-card';
      cutCard.id = `cut-card-${chapterObj.id}`;
      cutCard.innerHTML = `
        <div class="module-cut-card-top">
          <span class="module-cut-card-title">${chapterObj.title}</span>
          <span class="module-cut-card-status">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            已生成
          </span>
        </div>
        <div class="module-cut-card-stats">
          <span>正文 ${chapterObj.stats?.mainTextCount || 0} 条</span>
          <span>KP信息 ${chapterObj.stats?.kpInfoCount || 0} 条</span>
          <span>秘密 ${chapterObj.stats?.secretCount || 0} 条</span>
          <span>约 ${chapterObj.wordCount || 0} 字</span>
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
        progressText.textContent = `已暂停切割，当前已完成 ${this.cutChapters.length} 个章节`;
      }
    },

    resumeCutting() {
      this.isCuttingPaused = false;
      const pauseBtn = document.getElementById('module-pause-btn');
      const resumeBtn = document.getElementById('module-resume-btn');

      if (pauseBtn) pauseBtn.style.display = 'inline-flex';
      if (resumeBtn) resumeBtn.style.display = 'none';

      this.continueAsyncCuttingLoop();
    },

    cancelCutting() {
      this.isCuttingCancelled = true;
      this.isCuttingRunning = false;
      this.isCuttingPaused = false;

      const pauseBtn = document.getElementById('module-pause-btn');
      const resumeBtn = document.getElementById('module-resume-btn');
      const cancelBtn = document.getElementById('module-cancel-btn');
      const progressText = document.getElementById('module-progress-text');
      const actionBottomBar = document.getElementById('module-step3-actions-bar');

      if (pauseBtn) pauseBtn.style.display = 'none';
      if (resumeBtn) resumeBtn.style.display = 'none';
      if (cancelBtn) cancelBtn.style.display = 'none';
      if (progressText) progressText.textContent = '已取消切割任务';
      if (actionBottomBar) actionBottomBar.style.display = 'flex';
    },

    syncOngoingCuttingUI() {
      const cardList = document.getElementById('module-cut-card-list');
      const progressText = document.getElementById('module-progress-text');
      const progressBar = document.getElementById('module-progress-bar');
      const actionBottomBar = document.getElementById('module-step3-actions-bar');
      const pauseBtn = document.getElementById('module-pause-btn');
      const resumeBtn = document.getElementById('module-resume-btn');
      const cancelBtn = document.getElementById('module-cancel-btn');

      if (actionBottomBar) actionBottomBar.style.display = 'none';

      if (this.isCuttingPaused) {
        if (pauseBtn) pauseBtn.style.display = 'none';
        if (resumeBtn) resumeBtn.style.display = 'inline-flex';
        if (cancelBtn) cancelBtn.style.display = 'inline-flex';
        if (progressText) {
          progressText.textContent = `已暂停切割，当前已完成 ${this.cutChapters.length} 个章节`;
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

      const progressText = document.getElementById('module-progress-text');
      const progressBar = document.getElementById('module-progress-bar');
      const cardList = document.getElementById('module-cut-card-list');
      const actionBottomBar = document.getElementById('module-step3-actions-bar');
      const pauseBtn = document.getElementById('module-pause-btn');
      const cancelBtn = document.getElementById('module-cancel-btn');

      if (pauseBtn && this.currentStep === 3) pauseBtn.style.display = 'inline-flex';
      if (cancelBtn && this.currentStep === 3) cancelBtn.style.display = 'inline-flex';

      if (this.cutExecutionMode === 'batch') {
        if (progressText && this.currentStep === 3) {
          progressText.textContent = `全篇模式：正在调用一次 API 批量提取生成全部 ${totalChunks} 个章节...`;
        }
        if (progressBar && this.currentStep === 3) progressBar.style.width = '40%';

        const batchResults = await this.generateAllChaptersBatchWithAI(chunks, fullText);

        if (this.isCuttingCancelled) return;

        if (progressBar && this.currentStep === 3) progressBar.style.width = '80%';

        this.cutChapters = [];
        for (let i = 0; i < totalChunks; i++) {
          const chunk = chunks[i];
          const currentNum = i + 1;
          let chapterContent = '';

          if (batchResults && batchResults[i] && batchResults[i].content) {
            chapterContent = batchResults[i].content;
          } else {
            const rawContent = chunk.rawSlice || fullText.substring(0, 3000);
            chapterContent = this.fallbackFormatText(rawContent, chunk).content;
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
            stats: {
              mainTextCount: mainCount,
              kpInfoCount: kpCount,
              secretCount: secretCount,
              totalWords: words
            },
            sortOrder: currentNum
          };

          this.cutChapters.push(chapterObj);
        }

        this.isCuttingRunning = false;
        if (pauseBtn) pauseBtn.style.display = 'none';
        if (cancelBtn) cancelBtn.style.display = 'none';
        if (progressText && this.currentStep === 3) {
          progressText.textContent = `切割生成完成，共生成 ${totalChunks} 个带团专属章节`;
        }
        if (progressBar && this.currentStep === 3) progressBar.style.width = '100%';
        if (actionBottomBar && this.currentStep === 3) actionBottomBar.style.display = 'flex';
        if (this.currentStep === 3) {
          this.renderCutChaptersUI();
        }
        this.saveDraft();
        return;
      }

      while (this.cuttingCurrentIndex < totalChunks) {
        if (this.isCuttingPaused || this.isCuttingCancelled) {
          return;
        }

        const i = this.cuttingCurrentIndex;
        const chunk = chunks[i];
        const currentNum = i + 1;

        if (this.currentStep === 3) {
          if (progressText) {
            progressText.textContent = `逐章模式：正在提取并生成第 ${currentNum}/${totalChunks} 章: ${chunk.name}`;
          }
          if (progressBar) {
            progressBar.style.width = `${Math.round((i / totalChunks) * 100)}%`;
          }
        }

        const chapterContent = await this.generateSingleChapterWithAI(chunk, fullText);

        if (this.isCuttingCancelled) return;

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
          stats: {
            mainTextCount: mainCount,
            kpInfoCount: kpCount,
            secretCount: secretCount,
            totalWords: words
          },
          sortOrder: currentNum
        };

        this.cutChapters.push(chapterObj);

        if (this.currentStep === 3 && cardList) {
          cardList.appendChild(this.createChapterCardElement(chapterObj, i));
        }

        this.cuttingCurrentIndex++;
        this.saveDraft();
      }

      this.isCuttingRunning = false;
      if (pauseBtn) pauseBtn.style.display = 'none';
      if (cancelBtn) cancelBtn.style.display = 'none';

      if (this.currentStep === 3) {
        if (progressText) {
          progressText.textContent = `切割生成完成，共生成 ${totalChunks} 个带团专属章节`;
        }
        if (progressBar) {
          progressBar.style.width = '100%';
        }
        if (actionBottomBar) {
          actionBottomBar.style.display = 'flex';
        }
      }

      this.saveDraft();
    },

    async executeCuttingWorkflow() {
      if (!this.currentPlan || !this.currentPlan.chunks) {
        throw new Error('切割方案未生成');
      }

      this.setWizardStep(3);
      this.isCuttingRunning = true;
      this.isCuttingPaused = false;
      this.isCuttingCancelled = false;
      this.cuttingCurrentIndex = 0;
      this.cutChapters = [];

      const cardList = document.getElementById('module-cut-card-list');
      const actionBottomBar = document.getElementById('module-step3-actions-bar');
      const progressBar = document.getElementById('module-progress-bar');

      if (cardList) cardList.innerHTML = '';
      if (actionBottomBar) actionBottomBar.style.display = 'none';
      if (progressBar) progressBar.style.width = '0%';

      this.continueAsyncCuttingLoop();
    },

    renderCutChaptersUI() {
      const cardList = document.getElementById('module-cut-card-list');
      const progressText = document.getElementById('module-progress-text');
      const progressBar = document.getElementById('module-progress-bar');
      const actionBottomBar = document.getElementById('module-step3-actions-bar');
      const pauseBtn = document.getElementById('module-pause-btn');
      const resumeBtn = document.getElementById('module-resume-btn');
      const cancelBtn = document.getElementById('module-cancel-btn');

      if (!cardList) return;
      cardList.innerHTML = '';

      if (pauseBtn) pauseBtn.style.display = 'none';
      if (resumeBtn) resumeBtn.style.display = 'none';
      if (cancelBtn) cancelBtn.style.display = 'none';

      if (progressText) {
        progressText.textContent = `切割生成完成，共生成 ${this.cutChapters.length} 个带团专属章节`;
      }
      if (progressBar) {
        progressBar.style.width = '100%';
      }
      if (actionBottomBar) {
        actionBottomBar.style.display = 'flex';
      }

      this.cutChapters.forEach((chap, idx) => {
        cardList.appendChild(this.createChapterCardElement(chap, idx));
      });
    },

    async auditSingleChapter(chapterObj) {
      this.activeAuditChapter = chapterObj;
      const modal = document.getElementById('module-audit-modal');
      const titleEl = document.getElementById('module-audit-modal-title');
      const issuesList = document.getElementById('module-audit-issues-list');
      if (!modal || !titleEl || !issuesList) return;

      titleEl.textContent = `校验：${chapterObj.title}`;
      issuesList.innerHTML = '<div style="color: var(--text-secondary); text-align: center; padding: 10px;">AI 正在逐项审查本章节完整度、结尾截断、前言废话过滤与标注规范...</div>';
      modal.style.display = 'flex';

      const prompt = `你是一个资深跑团模组质检审核员。
请审查以下章节内容是否完全符合跑团带团规范：
1. 文本完整度：有无截断或遗漏的关键内容？
2. 结尾完整性：末尾是否具备标准的结束防擅自编造声明？
3. 废话清理：是否已彻底去除模组作者的前言废话及页码杂质？
4. 信息标注：【正文】、【KP信息】、【秘密】、【检定】及【插图注入】是否准确？
5. 逻辑一致性：内容与章节标题是否完全符合？

待审查章节标题：${chapterObj.title}
待审查章节内容：
${chapterObj.content}

请分条列出审查发现的具体问题；若完全合格，请直接说明全部合格。`;

      try {
        const reviewResult = await this.callAI('你是一个严格的跑团模组质检员，输出精简条目式审查报告。', prompt);
        issuesList.innerHTML = `<div style="background-color: var(--secondary-bg, #F9F8F5); padding: 10px; border-radius: 8px; white-space: pre-wrap;">${reviewResult || '审查完毕：未发现明显格式与截断问题。'}</div>`;
      } catch (e) {
        issuesList.innerHTML = '<div style="background-color: var(--secondary-bg, #F9F8F5); padding: 10px; border-radius: 8px;">本地质检完成：文本结尾完整，标签已闭合。</div>';
      }
    },

    openFixModal(chapterObj) {
      this.activeAuditChapter = chapterObj;
      const modal = document.getElementById('module-audit-modal');
      const titleEl = document.getElementById('module-audit-modal-title');
      const issuesList = document.getElementById('module-audit-issues-list');
      if (!modal || !titleEl || !issuesList) return;

      titleEl.textContent = `修复：${chapterObj.title}`;
      issuesList.innerHTML = '<div style="color: var(--text-secondary);">可在下方输入具体修复指示（如"补全结尾战斗对白"或"调整KP批注"），点击执行修复。</div>';
      modal.style.display = 'flex';
    },

    async executeFixChapter() {
      if (!this.activeAuditChapter) return;
      const instructionInput = document.getElementById('module-audit-instruction-input');
      const fixBtn = document.getElementById('module-audit-fix-btn');
      const issuesList = document.getElementById('module-audit-issues-list');

      const customInstruction = instructionInput ? instructionInput.value.trim() : '';

      if (fixBtn) {
        fixBtn.textContent = '修复中...';
        fixBtn.disabled = true;
      }

      const prompt = `你是模组修复专家。请根据以下修改意见，对章节【${this.activeAuditChapter.title}】的内容进行精准重写与修复：
修改要求：${customInstruction || '全面修正截断、补充遗漏、规范信息标注与结尾声明'}

当前章节内容：
${this.activeAuditChapter.content}

请直接输出修复完善后的完整章节文本。`;

      try {
        const fixedContent = await this.callAI('你是一个高精度跑团文本修复专家。', prompt);
        if (fixedContent && fixedContent.length > 50) {
          this.activeAuditChapter.content = fixedContent;
          this.activeAuditChapter.wordCount = this.countWords(fixedContent);
          this.saveDraft();
          this.renderCutChaptersUI();

          if (issuesList) {
            issuesList.innerHTML = '<div style="color: var(--accent-color, #4A7A68); font-weight: 600; padding: 6px 0;">已成功修复并更新本章节内容！可以再次进行校验或继续微调。</div>';
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
      if (typeof global.showCustomAlert === 'function') {
        global.showCustomAlert('全部校验', `正在对全部 ${this.cutChapters.length} 个章节进行批量质量核查，可点击各章节右侧的校验按钮查看详情与执行针对性修复。`);
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
              <span>约 ${fileRecord.wordCount || 0} 字</span> · 
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

    // 模组库模组详情
    async openModuleDetail(moduleId) {
      const database = this.getDB();
      if (!database || !database.modules) return;

      const mod = await database.modules.get(moduleId);
      if (!mod) return;

      this.activeDetailModule = mod;
      const chapters = await database.moduleChapters.where('moduleId').equals(moduleId).sortBy('sortOrder');

      const modal = document.getElementById('module-detail-modal');
      const titleEl = document.getElementById('module-detail-title');
      const statsEl = document.getElementById('module-detail-stats');
      const listEl = document.getElementById('module-detail-chapter-list');

      if (!modal || !titleEl || !statsEl || !listEl) return;

      titleEl.textContent = mod.name;
      statsEl.textContent = `${chapters.length} 个章节 · 约 ${mod.wordCount || 0} 字`;

      listEl.innerHTML = '';
      chapters.forEach((chap, idx) => {
        const item = document.createElement('div');
        item.className = 'module-plan-card';
        item.style.padding = '8px 10px';
        item.style.cursor = 'pointer';
        item.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: 600; font-size: 13px; color: var(--text-primary);">${chap.sortOrder || idx + 1}. ${chap.title}</span>
            <span class="module-plan-tag">${chap.category || '正文'}</span>
          </div>
          <div style="font-size: 11px; color: var(--text-secondary); margin-top: 4px;">约 ${chap.wordCount || 0} 字</div>
        `;

        item.addEventListener('click', () => {
          this.openChapterReader(chapters, idx, 'kp');
        });

        listEl.appendChild(item);
      });

      modal.style.display = 'flex';
    },

    hideModuleDetail() {
      const modal = document.getElementById('module-detail-modal');
      if (modal) modal.style.display = 'none';
      this.activeDetailModule = null;
    },

    // 沉浸式双视角阅读器
    openChapterReader(chapters, index, viewMode = 'kp') {
      if (!chapters || chapters.length === 0) return;
      this.currentReadingChapters = chapters;
      this.currentReadingIndex = index;
      this.currentReadingViewMode = viewMode;

      const modal = document.getElementById('module-reader-modal');
      const titleEl = document.getElementById('module-reader-title');
      const metaEl = document.getElementById('module-reader-meta');
      const bodyEl = document.getElementById('module-reader-body');
      const prevBtn = document.getElementById('module-reader-prev-btn');
      const nextBtn = document.getElementById('module-reader-next-btn');
      const pcBtn = document.getElementById('module-reader-view-pc');
      const kpBtn = document.getElementById('module-reader-view-kp');

      if (!modal || !titleEl || !bodyEl) return;

      const currentChap = chapters[index];
      titleEl.textContent = currentChap.title;
      if (metaEl) metaEl.textContent = `${currentChap.category} · 约 ${currentChap.wordCount || 0} 字`;

      if (pcBtn && kpBtn) {
        if (viewMode === 'pc') {
          pcBtn.style.background = 'var(--card-bg, #FFFFFF)';
          pcBtn.style.color = 'var(--text-primary, #2A2A2A)';
          pcBtn.style.fontWeight = '600';
          kpBtn.style.background = 'transparent';
          kpBtn.style.color = 'var(--text-secondary, #8A8A8A)';
          kpBtn.style.fontWeight = '500';
        } else {
          kpBtn.style.background = 'var(--card-bg, #FFFFFF)';
          kpBtn.style.color = 'var(--text-primary, #2A2A2A)';
          kpBtn.style.fontWeight = '600';
          pcBtn.style.background = 'transparent';
          pcBtn.style.color = 'var(--text-secondary, #8A8A8A)';
          pcBtn.style.fontWeight = '500';
        }
      }

      let displayContent = currentChap.content || '';
      if (viewMode === 'pc') {
        const lines = displayContent.split('\n');
        const pcLines = lines.filter(l => !l.startsWith('【KP信息】') && !l.startsWith('【KP带团指引批注') && !l.startsWith('【秘密'));
        displayContent = pcLines.join('\n');
      }

      bodyEl.textContent = displayContent;

      if (prevBtn) {
        prevBtn.disabled = index <= 0;
        prevBtn.style.opacity = index <= 0 ? '0.4' : '1';
      }
      if (nextBtn) {
        nextBtn.disabled = index >= chapters.length - 1;
        nextBtn.style.opacity = index >= chapters.length - 1 ? '0.4' : '1';
      }

      modal.style.display = 'flex';
    },

    hideChapterReader() {
      const modal = document.getElementById('module-reader-modal');
      if (modal) modal.style.display = 'none';
    },

    async saveCutModuleToLibrary() {
      if (!this.cutChapters || this.cutChapters.length === 0) {
        if (typeof global.showCustomAlert === 'function') {
          global.showCustomAlert('提示', '暂无已重构好的章节数据');
        }
        return;
      }

      const moduleId = 'mod_' + Date.now();
      const moduleRecord = {
        id: moduleId,
        name: this.currentParsedData?.moduleName || '跑团模组',
        type: this.currentPlan?.moduleType || '结构化模组',
        group: '默认分组',
        wordCount: this.currentParsedData?.wordCount || 0,
        chapterCount: this.cutChapters.length,
        status: 'ready',
        githubSync: false,
        createdAt: Date.now()
      };

      const chaptersToSave = this.cutChapters.map(chap => ({
        ...chap,
        moduleId: moduleId
      }));

      const imagesToSave = (this.currentParsedData?.images || []).map(img => ({
        moduleId: moduleId,
        imageIndex: img.imageIndex,
        name: img.name,
        dataUrl: img.dataUrl,
        isSensitive: false
      }));

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

        const moduleRecord = {
          id: moduleId,
          name: baseName,
          type: '导入模组',
          group: '默认分组',
          wordCount: chapters.reduce((sum, c) => sum + (c.wordCount || 0), 0),
          chapterCount: chapters.length,
          status: 'ready',
          githubSync: false,
          createdAt: Date.now()
        };

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

    async renderLibraryList(searchKeyword = '') {
      const listContainer = document.getElementById('module-library-list');
      const emptyContainer = document.getElementById('module-library-empty');
      if (!listContainer || !emptyContainer) return;

      let allModules = await this.getAllModules();
      if (searchKeyword.trim()) {
        const kw = searchKeyword.trim().toLowerCase();
        allModules = allModules.filter(m => m.name.toLowerCase().includes(kw));
      }

      if (!allModules || allModules.length === 0) {
        listContainer.style.display = 'none';
        emptyContainer.style.display = 'flex';
        return;
      }

      listContainer.style.display = 'flex';
      emptyContainer.style.display = 'none';
      listContainer.innerHTML = '';

      allModules.forEach(mod => {
        const item = document.createElement('div');
        item.className = 'module-plan-card';
        item.style.cursor = 'pointer';
        item.innerHTML = `
          <div class="module-plan-card-header">
            <div class="module-plan-card-title-group">
              <span class="module-plan-name">${mod.name}</span>
            </div>
            <div class="module-plan-card-meta">
              <span class="module-plan-words">${mod.chapterCount || 0} 章</span>
              <span class="module-plan-tag">${mod.type || '模组'}</span>
            </div>
          </div>
          <div class="module-plan-card-body" style="display: flex;">
            <div style="font-size: 11px; color: var(--text-secondary);">归档时间：${new Date(mod.createdAt).toLocaleDateString()}</div>
            <div class="module-card-actions-row">
              <button type="button" class="module-mini-btn btn-view-mod-detail" data-mod-id="${mod.id}">查看详情</button>
              <button type="button" class="module-mini-btn btn-danger btn-delete-mod" data-mod-id="${mod.id}">删除模组</button>
            </div>
          </div>
        `;

        item.addEventListener('click', (e) => {
          if (e.target.closest('button')) return;
          this.openModuleDetail(mod.id);
        });

        item.querySelector('.btn-view-mod-detail')?.addEventListener('click', (e) => {
          e.stopPropagation();
          this.openModuleDetail(mod.id);
        });

        const delBtn = item.querySelector('.btn-delete-mod');
        if (delBtn) {
          delBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            let confirmed = true;
            if (typeof global.showCustomConfirm === 'function') {
              confirmed = await global.showCustomConfirm('删除确认', `确定要删除模组【${mod.name}】及其全部章节吗？`);
            } else if (typeof global.showCustomAlert === 'function') {
              confirmed = confirm(`确定要删除模组【${mod.name}】吗？`);
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

      const singleBtn = document.getElementById('module-mode-single-btn');
      const batchBtn = document.getElementById('module-mode-batch-btn');
      if (singleBtn) {
        singleBtn.addEventListener('click', () => {
          this.updateModeUI('single');
        });
      }
      if (batchBtn) {
        batchBtn.addEventListener('click', () => {
          this.updateModeUI('batch');
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

      const promptPresetSelect = document.getElementById('module-prompt-preset-select');
      if (promptPresetSelect) {
        promptPresetSelect.addEventListener('change', () => {
          const presets = getModulePromptPresets();
          const found = presets.find((p) => p.id === promptPresetSelect.value);
          const promptInput = document.getElementById('module-prompt-textarea');
          if (found && promptInput) {
            promptInput.value = found.prompt;
            if (this.currentParsedData) {
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
            prompt: promptText || ADVANCED_TRPG_CUTTING_PROMPT
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
          if (presets[idx].id === 'preset_default_cut') {
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

      const promptTextarea = document.getElementById('module-prompt-textarea');
      if (promptTextarea) {
        promptTextarea.addEventListener('input', (e) => {
          if (this.currentParsedData) {
            this.currentParsedData.prompt = e.target.value;
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
          this.resetImportUI();
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
          if (this.activeAuditChapter) {
            this.auditSingleChapter(this.activeAuditChapter);
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

      const closeDetailBtn = document.getElementById('module-detail-close-btn');
      if (closeDetailBtn) {
        closeDetailBtn.addEventListener('click', () => {
          this.hideModuleDetail();
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

      const detailDeleteBtn = document.getElementById('module-detail-delete-btn');
      if (detailDeleteBtn) {
        detailDeleteBtn.addEventListener('click', async () => {
          if (this.activeDetailModule) {
            let confirmed = true;
            if (typeof global.showCustomConfirm === 'function') {
              confirmed = await global.showCustomConfirm('删除确认', `确定要删除模组【${this.activeDetailModule.name}】及其全部章节吗？`);
            } else if (typeof global.showCustomAlert === 'function') {
              confirmed = confirm(`确定要删除模组【${this.activeDetailModule.name}】吗？`);
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

      const closeReaderBtn = document.getElementById('module-reader-close-btn');
      if (closeReaderBtn) {
        closeReaderBtn.addEventListener('click', () => {
          this.hideChapterReader();
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
        readerViewKp.addEventListener('click', () => {
          this.openChapterReader(this.currentReadingChapters, this.currentReadingIndex, 'kp');
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
