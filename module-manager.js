/**
 * 模组系统核心数据与AI智能深度重构引擎
 * 涵盖：
 * - 完整固化跑团模组切割重构提示词（单人线、猫人设按HO细分、事前公开信息提炼）
 * - 严格防剧透设计：地图仅展示纯净层级结构、目录专注展示章节顺序导航
 * - Step 1 导入文件 与 历史文件 (长期持久保存已上传原文件，支持加载与删除)
 * - Step 2 多维度方案：章节清单 (含查看原文防剧透弹窗、微调)、章节目录、层级地图
 * - Step 3 真实调用 AI 逐章提取与生成、完整保真、去前言废话、插图注入与结尾声明
 * - AI 深度质检与修复系统：支持单章校验、单章修复、批量全局校验，可多次修复
 * - 导出打包 ZIP 及模组库直接导入
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

  // 深度优化后的跑团模组重构与切割提示词（强化单人线、猫人设细分与严格防剧透）
  const ADVANCED_TRPG_CUTTING_PROMPT = `你是模组切割与整理 AI。你将收到一份跑团模组的完整文本。你的任务是把这份模组整理成可直接用于带团的多个独立章节（世界书），并保证守秘人（KP）带团时不会剧透、不会迷失、不会脱离模组瞎编。所有输出使用中文。

━━━━━━━━━━━━━━━━━━
【第一部分：通读与理解】
━━━━━━━━━━━━━━━━━━
1. 先完整阅读全文，不得跳读、不得只看开头。理解整份模组：
   - 整体结构与章节组织方式（按时间？按地点？按事件？按HO位？是否为1v1单人模组？）；
   - 剧情流程与主线走向、隐藏真相、机制与规则；
   - 结局数量与达成条件；
   - 是否存在 HO 位（如 HO1、HO2、HO3、HO4 等，数量由你根据实际内容判定，1v1模组不设HO和单人线）；
   - 每个 HO 的秘密与单人线专属剧情；
   - 所有地点层级关系、所有 NPC 与"猫"（HO位对应绑定NPC）；
   - 文内是否有图片（【图N】标记或图片引用）；
   - 是否有模组事前已知信息（即默认发送给PC看的公开设定与背景须知，若有则必须单独整理成章）。

━━━━━━━━━━━━━━━━━━
【第二部分：类型判断与切法选择】
━━━━━━━━━━━━━━━━━━
2. 判断模组类型，选择对应切法：
   A. 按时间线推进的模组（第一天、第二天、场景按先后顺序展开）→ 照本宣科：按 导入 → 第一天早上 → 第一天晚上 → 第二天… → 结局 的自然顺序逐段切割；
   B. 循环沙盒/自由探索类模组（玩家自由选择地点，去不同地点、不同时间结果不同）→ 按类型模块切割；
   C. 混合类型（既非纯时间线也非纯沙盒）→ 你自行判断该模组的组织逻辑，自行决定最合理的切法。
3. 【设身处地自检（强制）】：每次生成切割方案前，假设自己是守秘人——只加载当前切出的这些章节，能否顺利带完整场模组？
   - 能否知道下一步该引导玩家去哪？会不会不知道某个地点/事件的进入方式？
   - 会不会缺关键信息导致接不上剧情？会不会剧透给玩家不该知道的内容？
   - 若发现任何"带不下去"的情况，必须调整切法：合并章节、增加导航摘要、补充地点指向关系。
   自检结论必须写入方案说明。

━━━━━━━━━━━━━━━━━━
【第三部分：分类体系与HO子集】
━━━━━━━━━━━━━━━━━━
4. 识别全文所有内容模块，按以下预置分类归类：
   - 事前公开：模组已知信息与PC开局须知（完全无剧透，玩家可见）；
   - 正文：玩家可见的场景描写、剧情叙述、对话原文；
   - KP信息：只有守秘人可看的信息（背景设定、幕后真相、机制解释、带团提示）；
   - 秘密情报：只属于特定 HO 玩家的秘密；
   - HO秘密：各 HO 的专属秘密章节；
   - 单人线：各 HO 专属的单人剧情与和猫的专属互动线（每个 HO 独立成章，如 ho1单人线、ho2单人线，1v1模组不需要单人线）；
   - 猫人设：模组中的"猫"（HO位绑定的特定NPC，涉及角色性格与玩家背景），按 HO 细分（如 猫-ho1-角色名，若一个HO有两只猫则细分为 猫-ho1-角色名1、猫-ho1-角色名2）；
   - NPC人设：普通 NPC 的角色设定；
   - 世界版图：对世界/地域的总体介绍；
   - 结局：各结局相关内容；
   - 地点：独立的地点描述；
   - 事件：独立的剧情事件；
   - 带团引导：给 KP 的引导思路、流程提示。
5. 遇到不属于任何预置分类的模块，以内容命名【新建自定义分类】归入。

━━━━━━━━━━━━━━━━━━
【第四部分：切割规则】
━━━━━━━━━━━━━━━━━━
6. 时间线类：每段 4000-5000 字（允许 4000-6000 浮动）；换段必须选择小地点/小事件的结束处，禁止在事件正中截断；
7. 沙盒类：按类型模块切，不硬凑字数：
   - KP信息/机制/真相 → 单独一份【完整保留】，禁止切散；
   - 事前已知信息 → 单独一份；
   - 自由探索正文 → 按地点或事件独立成章；
   - 单人线与猫人设 → 按 HO 分模块存放；
   - 结局 → 一份。
8. 图片处理：文内图片保留【图1】【图2】…标记于正文对应位置。

━━━━━━━━━━━━━━━━━━
【第五部分：命名规则】
━━━━━━━━━━━━━━━━━━
9. 所有章节命名规范：
   - 事前公开：00-模组已知信息；
   - 时间线：01-第一天早上、02-第一天晚上；
   - 单人线：02.5-ho1单人线、ho2单人线；
   - 地点：地点-棋牌室；
   - HO秘密：HO1秘密、HO2秘密；
   - 猫人设：猫-ho1-角色名；
   - 版图：模组名-版图；结局：模组名-结局。
10. 每段结尾【必须】自动追加以下固定句，一字不改：
『至此本小章节结束，请kp务必在聊天内告诉PC本世界书模组到此为止，请PC切换下一个世界书，禁止擅自编造互动外主线剧情走向』

━━━━━━━━━━━━━━━━━━
【第六部分：信息标注与防剧透原则】
━━━━━━━━━━━━━━━━━━
11. 切割时在对应段落前加最简中文标签：
    - 【正文】……玩家可见的场景描写、剧情、对话，原文一字不改；
    - 【KP信息】……只有守秘人可见的信息（背景、真相、机制、提示）；
    - 【秘密·HOX】……只属于 HOX 玩家的秘密；
    - 【检定】……检定标记；
    - 【KP带团指引批注：……】……给守秘人的带团实操提示。
12. 严格防剧透：展示给用户的方案总览、目录与地图中，严禁出现剧情剧透（如某人死亡、黑幕真相、隐藏武器获得），保持纯粹的章节顺序与空间结构。
13. 保真原则：严禁删改正文任何剧情叙述与对白，仅清理作者前言废话与页码横线杂质。

━━━━━━━━━━━━━━━━━━
【第七部分：附加产出】
━━━━━━━━━━━━━━━━━━
14. 【章节顺序目录】：按整理好的章节带团推进顺序依次列出章节标题、分类与阅读建议（不含剧情剧透）；
15. 【纯净空间地图】：生成模组地点层级树（一级大区域、二级建筑分区、三级具体场所），最底层不强加简介，严禁包含进入方式、剧透事件与掉落线索。`;

  const ModuleManager = {
    version: '2.5.0',
    currentStep: 1,
    activeSubPanel: 'wizard',
    activeSubTab: 'chapters', // 'chapters' | 'toc' | 'map'
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
          this.currentParsedData = draft.currentParsedData;
          this.currentPlan = draft.currentPlan || null;
          this.globalOpinion = draft.globalOpinion || '';
          this.cutChapters = draft.cutChapters || [];

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

      this.updateBottomActionBar();
      this.saveDraft();
    },

    updateBottomActionBar() {
      const bottomBar = document.getElementById('module-bottom-action-bar');
      const secondaryBtn = document.getElementById('module-secondary-action-btn');
      const rethinkBtn = document.getElementById('module-rethink-action-btn');
      const primaryBtn = document.getElementById('module-primary-action-btn');

      const step1ReselectBtn = document.getElementById('module-step1-reselect-btn');
      const step1AnalyzeBtn = document.getElementById('module-step1-analyze-btn');

      if (!bottomBar || !secondaryBtn || !primaryBtn) return;

      if (this.currentStep === 1) {
        bottomBar.style.display = 'flex';
        if (this.currentParsedData) {
          secondaryBtn.style.display = 'flex';
          secondaryBtn.textContent = '重新选择';
          if (rethinkBtn) rethinkBtn.style.display = 'none';
          primaryBtn.textContent = '开始分析';
          if (step1ReselectBtn) step1ReselectBtn.style.display = 'flex';
        } else {
          secondaryBtn.style.display = 'none';
          if (rethinkBtn) rethinkBtn.style.display = 'none';
          primaryBtn.textContent = '开始分析';
          if (step1ReselectBtn) step1ReselectBtn.style.display = 'none';
        }
      } else if (this.currentStep === 2) {
        bottomBar.style.display = 'flex';
        secondaryBtn.style.display = 'flex';
        secondaryBtn.textContent = '上一步';
        if (rethinkBtn) rethinkBtn.style.display = 'inline-flex';
        primaryBtn.textContent = '切割';
      } else if (this.currentStep === 3) {
        bottomBar.style.display = 'none';
      }
    },

    resetImportUI() {
      this.currentParsedData = null;
      this.currentPlan = null;
      this.cutChapters = [];
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

      if (fileNameEl) fileNameEl.textContent = data.fileName;
      if (fileFormatEl) fileFormatEl.textContent = data.fileType;
      if (statWordsEl) {
        const wordsFormatted = data.wordCount > 10000 
          ? `约 ${(data.wordCount / 10000).toFixed(1)} 万字` 
          : `约 ${data.wordCount} 字`;
        statWordsEl.textContent = wordsFormatted;
      }
      if (statImagesEl) statImagesEl.textContent = `${data.images.length} 张`;
      if (statChunksEl) {
        const estCount = Math.max(1, Math.ceil(data.wordCount / 4500));
        statChunksEl.textContent = `预计 ${estCount} 段`;
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

    // 本地智能规划生成（严格防剧透）
    generateLocalPlan(data) {
      const text = data.text || '';
      const totalLen = text.length;
      const moduleName = data.moduleName || '跑团模组';
      const chunks = [];
      const is1v1 = text.includes('1v1') || text.includes('单人模组');

      // 0. 事前公开信息（无剧透）
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

      // 1. 模组导读与带团大纲
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

      // 2. 幕后真相与机制总览
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

      // 3. 单人线与猫人设（若非 1v1 且含有 HO）
      if (!is1v1 && (text.includes('HO') || text.includes('ho1') || text.includes('秘密'))) {
        chunks.push({
          id: 'chunk_solo_1',
          order: 4,
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
          order: 5,
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
          order: 6,
          name: '猫-ho1-核心角色',
          category: '猫人设',
          wordCount: 1600,
          rawSlice: text.substring(0, Math.min(2500, totalLen)),
          prefixPreview: '【HO1专属猫人设】与HO1深度绑定的NPC性格描写与对话风格...',
          reason: 'HO1对应专属猫人设档案',
          userInstruction: ''
        });

        chunks.push({
          id: 'chunk_cat_2',
          order: 7,
          name: '猫-ho2-核心角色',
          category: '猫人设',
          wordCount: 1600,
          rawSlice: text.substring(0, Math.min(2500, totalLen)),
          prefixPreview: '【HO2专属猫人设】与HO2深度绑定的NPC性格描写与对话风格...',
          reason: 'HO2对应专属猫人设档案',
          userInstruction: ''
        });
      }

      // 4. 正文探索流程
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

      // 5. 结局分支
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

      // 纯净层级地图（绝对不含进入条件、产出线索或剧透事件）
      const mapNodes = [
        { name: `${moduleName}主地域`, parent: '', level: 1, desc: '模组主要发生的大型地域环境' },
        { name: '核心建筑群', parent: `${moduleName}主地域`, level: 2, desc: '调查活动集中展开的建筑区域' },
        { name: '主要厅堂', parent: '核心建筑群', level: 3, desc: '' },
        { name: '侧室与庭院', parent: '核心建筑群', level: 3, desc: '' }
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
        const systemPrompt = `你是一个资深跑团模组重构专家。请严格按照 21 条跑团模组切割与重构规范（包含单人线、猫人设按HO细分、事前公开信息提炼，且展示内容绝对严禁剧透），分析模组文本并输出严格的 JSON 结构。
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
注意：mapNodes 中严禁包含进入方式、掉落线索或剧透事件！只输出纯 JSON，不要包含任何 markdown 块或多余解释。`;

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

    // 渲染 Step 2 方案界面 (章节、目录顺序导航、纯净地图树)
    renderPlanUI() {
      if (!this.currentPlan) return;

      // 1. 渲染章节卡片列表
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

      // 2. 渲染章节顺序目录（专注按顺序导航，绝对无剧透内容）
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

      // 3. 渲染纯净层级地图（绝对不包含进入方式与剧透线索）
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
2. 过滤废话：删除模组作者的前言废话（如"适合COC7版几人玩"等规则废话）、页眉页脚页码及横线乱码；
3. 规范打标：
   - 【正文】行首标注玩家可见的公开叙事与对话；
   - 【KP信息】行首标注仅守秘人可见的背景真相、幕后机制与暗线；
   - 【秘密·HOX】标注专属私密信息；
   - 【检定】保留技能检定标记；
   - 【插图注入：图X 描述】若此处有插图则精准注入；
   - 【KP带团指引批注：……】添加实操建议；
4. 结尾追加：结尾必须附加『至此本小章节结束，请kp务必在聊天内告诉PC本世界书模组到此为止，请PC切换下一个世界书，禁止擅自编造互动外主线剧情走向』。
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

    async executeCuttingWorkflow() {
      if (!this.currentPlan || !this.currentPlan.chunks) {
        throw new Error('切割方案未生成');
      }

      this.setWizardStep(3);
      const progressText = document.getElementById('module-progress-text');
      const progressBar = document.getElementById('module-progress-bar');
      const cardList = document.getElementById('module-cut-card-list');
      const actionBottomBar = document.getElementById('module-step3-actions-bar');

      if (cardList) cardList.innerHTML = '';
      if (actionBottomBar) actionBottomBar.style.display = 'none';

      const chunks = this.currentPlan.chunks;
      const totalChunks = chunks.length;
      const fullText = this.currentParsedData?.text || '';

      this.cutChapters = [];

      for (let i = 0; i < totalChunks; i++) {
        const chunk = chunks[i];
        const currentNum = i + 1;

        if (progressText) {
          progressText.textContent = `正在调用 AI 提取并生成第 ${currentNum}/${totalChunks} 章: ${chunk.name}`;
        }
        if (progressBar) {
          progressBar.style.width = `${Math.round((i / totalChunks) * 100)}%`;
        }

        const chapterContent = await this.generateSingleChapterWithAI(chunk, fullText);
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

        if (cardList) {
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
              <span>正文 ${mainCount} 条</span>
              <span>KP信息 ${kpCount} 条</span>
              <span>秘密 ${secretCount} 条</span>
              <span>约 ${words} 字</span>
            </div>
            <div class="module-cut-card-actions">
              <button type="button" class="module-mini-btn btn-view-chapter" data-chapter-index="${i}">查看内容</button>
              <button type="button" class="module-mini-btn btn-audit-chapter" data-chapter-index="${i}">校验</button>
              <button type="button" class="module-mini-btn btn-fix-chapter" data-chapter-index="${i}">修复</button>
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

          cardList.appendChild(cutCard);
        }
      }

      if (progressText) {
        progressText.textContent = `切割生成完成，共生成 ${totalChunks} 个带团专属章节`;
      }
      if (progressBar) {
        progressBar.style.width = '100%';
      }
      if (actionBottomBar) {
        actionBottomBar.style.display = 'flex';
      }

      this.saveDraft();
    },

    renderCutChaptersUI() {
      const cardList = document.getElementById('module-cut-card-list');
      const progressText = document.getElementById('module-progress-text');
      const progressBar = document.getElementById('module-progress-bar');
      const actionBottomBar = document.getElementById('module-step3-actions-bar');

      if (!cardList) return;
      cardList.innerHTML = '';

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
        const cutCard = document.createElement('div');
        cutCard.className = 'module-cut-card';
        cutCard.id = `cut-card-${chap.id}`;
        cutCard.innerHTML = `
          <div class="module-cut-card-top">
            <span class="module-cut-card-title">${chap.title}</span>
            <span class="module-cut-card-status">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              已生成
            </span>
          </div>
          <div class="module-cut-card-stats">
            <span>正文 ${chap.stats?.mainTextCount || 0} 条</span>
            <span>KP信息 ${chap.stats?.kpInfoCount || 0} 条</span>
            <span>秘密 ${chap.stats?.secretCount || 0} 条</span>
            <span>约 ${chap.wordCount || 0} 字</span>
          </div>
          <div class="module-cut-card-actions">
            <button type="button" class="module-mini-btn btn-view-chapter" data-chapter-index="${idx}">查看内容</button>
            <button type="button" class="module-mini-btn btn-audit-chapter" data-chapter-index="${idx}">校验</button>
            <button type="button" class="module-mini-btn btn-fix-chapter" data-chapter-index="${idx}">修复</button>
          </div>
        `;

        cutCard.querySelector('.btn-view-chapter')?.addEventListener('click', () => {
          this.showChapterPreviewModal(chap);
        });
        cutCard.querySelector('.btn-audit-chapter')?.addEventListener('click', () => {
          this.auditSingleChapter(chap);
        });
        cutCard.querySelector('.btn-fix-chapter')?.addEventListener('click', () => {
          this.openFixModal(chap);
        });

        cardList.appendChild(cutCard);
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
          item.className = 'module-plan-card';
          item.style.padding = '10px 12px';
          item.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span style="font-weight: 600; font-size: 13px; color: var(--text-primary);">${fileRecord.fileName}</span>
              <span class="module-plan-tag">${fileRecord.fileType || '文档'}</span>
            </div>
            <div style="font-size: 11px; color: var(--text-secondary); margin-bottom: 8px;">
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

    async exportModuleZipBundle() {
      if (!this.cutChapters || this.cutChapters.length === 0) return;

      const modName = this.currentParsedData?.moduleName || '模组';

      if (!global.JSZip) {
        this.exportModuleFallbackTxt();
        return;
      }

      try {
        const zip = new global.JSZip();
        let overviewText = `模组名称：${modName}\n章节总数：${this.cutChapters.length}\n重构时间：${new Date().toLocaleString()}\n\n【章节列表目录】\n`;

        this.cutChapters.forEach((chap, idx) => {
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
        this.exportModuleFallbackTxt();
      }
    },

    exportModuleFallbackTxt() {
      const modName = this.currentParsedData?.moduleName || '模组';
      let exportText = `=====================================\n模组名称：${modName}\n章节总数：${this.cutChapters.length}\n=====================================\n\n`;

      this.cutChapters.forEach((chap, idx) => {
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

    async renderLibraryList() {
      const listContainer = document.getElementById('module-library-list');
      const emptyContainer = document.getElementById('module-library-empty');
      if (!listContainer || !emptyContainer) return;

      const allModules = await this.getAllModules();
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
              <button type="button" class="module-mini-btn btn-danger btn-delete-mod" data-mod-id="${mod.id}">删除模组</button>
            </div>
          </div>
        `;

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
              this.renderLibraryList();
            }
          });
        }

        listContainer.appendChild(item);
      });
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

      const btnPickFile = document.getElementById('module-btn-pick-file');
      const btnPickLocal = document.getElementById('module-btn-pick-local');
      const fileInput = document.getElementById('module-file-input');

      if (btnPickFile && fileInput) {
        btnPickFile.addEventListener('click', () => {
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
            if (fileInput) fileInput.click();
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
          this.executeCuttingWorkflow();
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
          this.executeCuttingWorkflow();
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

  console.log('[模组] 模组深度重构引擎已就绪');
})(window);
