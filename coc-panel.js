// ===================================================================
// COC 七版人物面板模块
// ===================================================================

const COC_STANDARD_SKILLS = [
  { name: "侦查", base: 25 },
  { name: "聆听", base: 20 },
  { name: "心理学", base: 10 },
  { name: "急救", base: 30 },
  { name: "潜行", base: 20 },
  { name: "图书馆使用", base: 20 },
  { name: "话术", base: 5 },
  { name: "恐吓", base: 15 },
  { name: "说服", base: 10 },
  { name: "闪避", base: 25 },
  { name: "撬锁", base: 1 },
  { name: "格斗", base: 25 },
  { name: "射击", base: 20 },
  { name: "医学", base: 1 },
  { name: "神秘学", base: 5 },
  { name: "信用评级", base: 0 },
  { name: "魅惑", base: 15 },
  { name: "攀爬", base: 20 },
  { name: "跳跃", base: 20 },
  { name: "投掷", base: 20 },
  { name: "游泳", base: 20 },
  { name: "追踪", base: 10 },
  { name: "妙手", base: 10 },
  { name: "伪装", base: 5 },
  { name: "汽车驾驶", base: 20 },
  { name: "骑术", base: 5 },
  { name: "机械维修", base: 10 },
  { name: "电气维修", base: 10 },
  { name: "计算机使用", base: 5 },
  { name: "会计", base: 5 },
  { name: "估价", base: 5 },
  { name: "人类学", base: 1 },
  { name: "考古学", base: 1 },
  { name: "历史", base: 5 },
  { name: "法律", base: 5 },
  { name: "自然学", base: 10 },
  { name: "领航", base: 10 },
  { name: "生存", base: 10 },
  { name: "科学", base: 1 },
  { name: "电子学", base: 1 },
  { name: "重型机械", base: 1 },
  { name: "精神分析", base: 1 },
  { name: "克苏鲁神话", base: 0 }
];

const DEFAULT_COC_SKILLS = {};
COC_STANDARD_SKILLS.forEach(s => {
  DEFAULT_COC_SKILLS[s.name] = s.base;
});
window.DEFAULT_COC_SKILLS = DEFAULT_COC_SKILLS;

function getSkillBaseValue(skillName, stats = {}) {
  if (skillName === "闪避") {
    const dex = parseInt(stats.dex, 10);
    return !isNaN(dex) ? Math.floor(dex / 2) : 25;
  }
  const found = COC_STANDARD_SKILLS.find(s => s.name === skillName);
  return found ? found.base : 0;
}

function getDefaultCocData() {
  const defaultStats = {
    str: 50,
    dex: 50,
    con: 50,
    pow: 50,
    siz: 50,
    edu: 50,
    app: 50,
    int: 50,
    luk: 50
  };

  const defaultSkills = {};
  COC_STANDARD_SKILLS.forEach(s => {
    defaultSkills[s.name] = s.name === "闪避" ? Math.floor(defaultStats.dex / 2) : s.base;
  });

  return {
    stats: defaultStats,
    calculated: {
      hp: 10,
      maxHp: 10,
      mp: 10,
      maxMp: 10,
      san: 50,
      maxSan: 99,
      db: "0",
      build: 0
    },
    skills: defaultSkills,
    customSkills: [],
    totalPoints: 0
  };
}

function calculateCocStats(stats, prevCalc = {}) {
  const str = parseInt(stats.str, 10) || 0;
  const dex = parseInt(stats.dex, 10) || 0;
  const con = parseInt(stats.con, 10) || 0;
  const pow = parseInt(stats.pow, 10) || 0;
  const siz = parseInt(stats.siz, 10) || 0;

  const maxHp = Math.max(1, Math.floor((con + siz) / 10));
  const maxMp = Math.max(0, Math.floor(pow / 5));
  const maxSan = 99;

  let hp = typeof prevCalc.hp === "number" ? Math.min(prevCalc.hp, maxHp) : maxHp;
  let mp = typeof prevCalc.mp === "number" ? Math.min(prevCalc.mp, maxMp) : maxMp;
  let san = typeof prevCalc.san === "number" ? Math.min(prevCalc.san, maxSan) : Math.min(pow, maxSan);

  const totalStrSiz = str + siz;
  let db = "0";
  let build = 0;

  if (totalStrSiz <= 64) {
    db = "-2";
    build = -2;
  } else if (totalStrSiz <= 84) {
    db = "-1";
    build = -1;
  } else if (totalStrSiz <= 124) {
    db = "0";
    build = 0;
  } else if (totalStrSiz <= 164) {
    db = "+1D4";
    build = 1;
  } else if (totalStrSiz <= 204) {
    db = "+1D6";
    build = 2;
  } else if (totalStrSiz <= 284) {
    db = "+2D6";
    build = 3;
  } else if (totalStrSiz <= 364) {
    db = "+3D6";
    build = 4;
  } else {
    const extra = Math.floor((totalStrSiz - 365) / 80) + 1;
    db = `+${4 + extra}D6`;
    build = 5 + extra;
  }

  return {
    hp,
    maxHp,
    mp,
    maxMp,
    san,
    maxSan,
    db,
    build
  };
}

class CocPanel {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.options = options;
    this.data = getDefaultCocData();
    this.init();
  }

  init() {
    if (!this.container) return;
    this.render();
    this.bindEvents();
  }

  render() {
    this.container.innerHTML = `
      <div class="coc-panel-wrapper">
        <div class="coc-panel-header">
          <span class="coc-panel-title">面板</span>
          <span class="coc-total-badge">总加点数: <span class="coc-top-points">0</span></span>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <div class="coc-section-label" style="margin-bottom: 0;">属性</div>
          <button type="button" class="moe-btn-mini coc-download-btn" title="导入" style="flex: 0 0 auto !important; width: 24px !important; min-width: 24px !important; height: 20px !important; min-height: 20px !important; padding: 0 !important; display: inline-flex !important; align-items: center !important; justify-content: center !important; border-radius: 6px; cursor: pointer; background: var(--secondary-bg); border: 1px solid var(--border-color); color: var(--text-primary);">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </button>
        </div>
        <div class="coc-stats-grid">
          <div class="coc-stat-item"><label>力量</label><input type="number" class="coc-stat-input" data-stat="str" value="50" min="0" max="999"></div>
          <div class="coc-stat-item"><label>敏捷</label><input type="number" class="coc-stat-input" data-stat="dex" value="50" min="0" max="999"></div>
          <div class="coc-stat-item"><label>体质</label><input type="number" class="coc-stat-input" data-stat="con" value="50" min="0" max="999"></div>
          <div class="coc-stat-item"><label>意志</label><input type="number" class="coc-stat-input" data-stat="pow" value="50" min="0" max="999"></div>
          <div class="coc-stat-item"><label>体型</label><input type="number" class="coc-stat-input" data-stat="siz" value="50" min="0" max="999"></div>
          <div class="coc-stat-item"><label>教育</label><input type="number" class="coc-stat-input" data-stat="edu" value="50" min="0" max="999"></div>
          <div class="coc-stat-item"><label>外貌</label><input type="number" class="coc-stat-input" data-stat="app" value="50" min="0" max="999"></div>
          <div class="coc-stat-item"><label>智力</label><input type="number" class="coc-stat-input" data-stat="int" value="50" min="0" max="999"></div>
          <div class="coc-stat-item"><label>幸运</label><input type="number" class="coc-stat-input" data-stat="luk" value="50" min="0" max="999"></div>
        </div>

        <div class="coc-section-label">数值</div>
        <div class="coc-values-grid">
          <div class="coc-value-item">
            <div class="coc-value-label">HP</div>
            <div class="coc-value-num coc-val-hp">10/10</div>
          </div>
          <div class="coc-value-item">
            <div class="coc-value-label">MP</div>
            <div class="coc-value-num coc-val-mp">10/10</div>
          </div>
          <div class="coc-value-item">
            <div class="coc-value-label">SAN</div>
            <div class="coc-value-num coc-val-san">50/99</div>
          </div>
          <div class="coc-value-item">
            <div class="coc-value-label">DB</div>
            <div class="coc-value-num coc-val-db">0</div>
          </div>
        </div>

        <button type="button" class="moe-btn-secondary coc-open-skills-modal-btn" style="width: 100%; margin: 6px 0;">技能面板</button>
      </div>
    `;

    this.updateCalculatedUI();
    this.updateTotalPoints();
  }

  bindEvents() {
    const downloadBtn = this.container.querySelector(".coc-download-btn");
    if (downloadBtn) {
      downloadBtn.addEventListener("click", (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        openCocFillModal(this);
      });
    }

    this.container.querySelectorAll(".coc-stat-input").forEach(input => {
      input.addEventListener("input", () => {
        const stat = input.dataset.stat;
        this.data.stats[stat] = parseInt(input.value, 10) || 0;
        this.data.calculated = calculateCocStats(this.data.stats, this.data.calculated);
        this.updateCalculatedUI();

        // 敏捷变化时，若闪避没有加点，更新闪避初始值
        if (stat === "dex") {
          const dodgeBase = Math.floor(this.data.stats.dex / 2);
          const currentDodge = this.data.skills["闪避"];
          const prevBase = getSkillBaseValue("闪避", { dex: 50 });
          if (typeof currentDodge === "undefined" || currentDodge === prevBase) {
            this.data.skills["闪避"] = dodgeBase;
          }
        }
      });
    });

    const openBtn = this.container.querySelector(".coc-open-skills-modal-btn");
    if (openBtn) {
      openBtn.addEventListener("click", (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        openCocSkillsModal(this);
      });
    }
  }

  updateCalculatedUI() {
    const calc = this.data.calculated || calculateCocStats(this.data.stats);
    const hpEl = this.container.querySelector(".coc-val-hp");
    const mpEl = this.container.querySelector(".coc-val-mp");
    const sanEl = this.container.querySelector(".coc-val-san");
    const dbEl = this.container.querySelector(".coc-val-db");

    if (hpEl) hpEl.textContent = `${calc.hp}/${calc.maxHp}`;
    if (mpEl) mpEl.textContent = `${calc.mp}/${calc.maxMp}`;
    if (sanEl) sanEl.textContent = `${calc.san}/${calc.maxSan}`;
    if (dbEl) dbEl.textContent = `${calc.db}`;
  }

  updateTotalPoints() {
    let total = 0;
    if (this.data.skills) {
      Object.entries(this.data.skills).forEach(([name, val]) => {
        const base = getSkillBaseValue(name, this.data.stats);
        const num = parseInt(val, 10);
        if (!isNaN(num) && num > base) {
          total += (num - base);
        }
      });
    }
    this.data.totalPoints = total;

    const topPoints = this.container.querySelector(".coc-top-points");
    if (topPoints) topPoints.textContent = total;
  }

  setData(data) {
    const defaultData = getDefaultCocData();
    if (!data) {
      this.data = defaultData;
    } else {
      this.data = {
        stats: { ...defaultData.stats, ...(data.stats || {}) },
        calculated: { ...defaultData.calculated, ...(data.calculated || {}) },
        skills: { ...defaultData.skills, ...(data.skills || {}) },
        customSkills: Array.isArray(data.customSkills) ? [...data.customSkills] : [],
        totalPoints: data.totalPoints || 0
      };
    }

    this.container.querySelectorAll(".coc-stat-input").forEach(input => {
      const stat = input.dataset.stat;
      input.value = this.data.stats[stat] || 50;
    });

    this.data.calculated = calculateCocStats(this.data.stats, this.data.calculated);
    this.updateCalculatedUI();
    this.updateTotalPoints();
  }

  getData() {
    this.container.querySelectorAll(".coc-stat-input").forEach(input => {
      const stat = input.dataset.stat;
      this.data.stats[stat] = parseInt(input.value, 10) || 0;
    });
    this.data.calculated = calculateCocStats(this.data.stats, this.data.calculated);
    this.updateTotalPoints();
    return JSON.parse(JSON.stringify(this.data));
  }

  save() {
    if (typeof this.options.onSave === "function") {
      this.options.onSave(this.getData());
    }
  }
}

// ===================================================================
// 独立技能面板模态窗口管理器
// ===================================================================

let currentActiveCocPanel = null;

function getStoredCocPresets() {
  try {
    const raw = localStorage.getItem("coc_skill_presets");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
  }
  const defaultSkills = (typeof getDefaultCocData === "function") ? getDefaultCocData().skills : (DEFAULT_COC_SKILLS || {});
  return [
    {
      id: "preset_coc_default",
      name: "标准预设",
      skills: { ...defaultSkills },
      customSkills: []
    }
  ];
}

function saveStoredCocPresets(presets) {
  try {
    localStorage.setItem("coc_skill_presets", JSON.stringify(presets));
  } catch (e) {
    console.error("保存预设失败:", e);
  }
}

function loadCocModalPresetsList(selectedId = "") {
  const select = document.getElementById("coc-modal-preset-select");
  if (!select) return;
  const presets = getStoredCocPresets();
  const currentId = selectedId || localStorage.getItem("coc_active_skill_preset_id") || (presets[0] ? presets[0].id : "");
  select.innerHTML = presets.map(p => `<option value="${p.id}" ${p.id === currentId ? "selected" : ""}>${p.name}</option>`).join("");
  if (currentId) {
    select.value = currentId;
    localStorage.setItem("coc_active_skill_preset_id", currentId);
  }
}

function updateCocModalTotalPoints() {
  if (!currentActiveCocPanel) return;
  let total = 0;
  const grid = document.getElementById("coc-modal-skills-grid");
  if (grid) {
    grid.querySelectorAll(".coc-skill-item").forEach(item => {
      if (item.classList.contains("coc-add-skill-card")) return;
      const name = item.dataset.skill;
      const base = parseInt(item.dataset.base, 10) || 0;
      const valInput = item.querySelector(".coc-skill-val");
      if (!valInput) return;
      const num = parseInt(valInput.value, 10);
      if (!isNaN(num) && num > base) {
        total += (num - base);
      }
    });
  }

  currentActiveCocPanel.data.totalPoints = total;
  const display1 = document.getElementById("coc-modal-total-display");
  const display2 = document.getElementById("coc-modal-footer-points");
  if (display1) display1.textContent = total;
  if (display2) display2.textContent = total;
  currentActiveCocPanel.updateTotalPoints();
}

function renderCocModalSkillsGrid() {
  if (!currentActiveCocPanel) return;
  const grid = document.getElementById("coc-modal-skills-grid");
  if (!grid) return;

  const data = currentActiveCocPanel.data;
  const stats = data.stats || {};

  let items = [];
  COC_STANDARD_SKILLS.forEach(s => {
    const base = s.name === "闪避" ? Math.floor((stats.dex || 50) / 2) : s.base;
    const currentVal = typeof data.skills[s.name] !== "undefined" ? data.skills[s.name] : base;
    items.push({ name: s.name, base: base, val: currentVal, isCustom: false });
  });

  if (Array.isArray(data.customSkills)) {
    data.customSkills.forEach(name => {
      if (!items.find(it => it.name === name)) {
        const currentVal = typeof data.skills[name] !== "undefined" ? data.skills[name] : 0;
        items.push({ name: name, base: 0, val: currentVal, isCustom: true });
      }
    });
  }

  let html = items.map(item => {
    return `
      <div class="coc-skill-item" data-skill="${item.name}" data-base="${item.base}">
        <span class="coc-skill-name" title="${item.name}">${item.name}${item.isCustom ? " *" : ""}</span>
        <div class="coc-skill-actions">
          <input type="number" class="coc-skill-val" value="${item.val}" min="${item.base}" max="999">
          <button type="button" class="moe-btn-mini coc-skill-sub5-btn">-5</button>
          <button type="button" class="moe-btn-mini coc-skill-add5-btn">+5</button>
          <button type="button" class="moe-btn-mini coc-skill-reset-btn" title="重置"><svg viewBox="0 0 24 24" width="10" height="10" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none;"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg></button>
        </div>
      </div>
    `;
  }).join("");

  html += `
    <div class="coc-skill-item coc-add-skill-card">
      <span class="coc-skill-name" style="color: var(--accent-color); font-weight: 600; text-align: center; margin: 0; width: 100%;">+ 添加</span>
    </div>
  `;

  grid.innerHTML = html;
  updateCocModalTotalPoints();
}

function openCocSkillsModal(cocPanelInstance) {
  if (!cocPanelInstance) return;
  currentActiveCocPanel = cocPanelInstance;
  const modal = document.getElementById("coc-skills-modal");
  if (!modal) return;

  if (!currentActiveCocPanel.data) {
    currentActiveCocPanel.data = getDefaultCocData();
  }

  if (!currentActiveCocPanel.data.skills || typeof currentActiveCocPanel.data.skills !== "object" || Object.keys(currentActiveCocPanel.data.skills).length === 0) {
    const def = getDefaultCocData();
    currentActiveCocPanel.data.skills = { ...def.skills, ...(currentActiveCocPanel.data.skills || {}) };
  }

  try {
    renderCocModalSkillsGrid();
    loadCocModalPresetsList();
  } catch (err) {
    console.error("渲染技能面板出错:", err);
  }

  modal.classList.add("visible");
}

function closeCocSkillsModal() {
  const modal = document.getElementById("coc-skills-modal");
  if (modal) {
    modal.classList.remove("visible");
  }
  if (currentActiveCocPanel && typeof currentActiveCocPanel.updateTotalPoints === "function") {
    currentActiveCocPanel.updateTotalPoints();
  }
}

// 绑定技能模态框的所有交互事件
function initCocSkillsModalEvents() {
  const modal = document.getElementById("coc-skills-modal");
  if (!modal) return;

  const content = modal.querySelector(".coc-skills-modal-content");
  if (content) {
    content.onclick = (e) => e.stopPropagation();
  }

  modal.onclick = (e) => {
    if (e.target === modal) {
      closeCocSkillsModal();
    }
  };

  const closeBtn = document.getElementById("close-coc-skills-modal-btn");
  const cancelBtn = document.getElementById("cancel-coc-skills-modal-btn");
  const saveBtn = document.getElementById("save-coc-skills-modal-btn");

  if (closeBtn) closeBtn.onclick = closeCocSkillsModal;
  if (cancelBtn) cancelBtn.onclick = closeCocSkillsModal;

  if (saveBtn) {
    saveBtn.onclick = () => {
      if (currentActiveCocPanel) {
        // 同步所有输入框的值到当前面板对象
        const grid = document.getElementById("coc-modal-skills-grid");
        if (grid) {
          grid.querySelectorAll(".coc-skill-item").forEach(item => {
            if (item.classList.contains("coc-add-skill-card")) return;
            const name = item.dataset.skill;
            const valInput = item.querySelector(".coc-skill-val");
            if (valInput) {
              currentActiveCocPanel.data.skills[name] = parseInt(valInput.value, 10) || 0;
            }
          });
        }
        currentActiveCocPanel.save();
        const origText = saveBtn.textContent;
        saveBtn.textContent = "已保存";
        setTimeout(() => {
          saveBtn.textContent = origText;
        }, 1000);
      }
    };
  }

  const grid = document.getElementById("coc-modal-skills-grid");
  if (grid) {
    grid.addEventListener("click", async (e) => {
      if (e.target.closest(".coc-add-skill-card") || e.target.classList.contains("coc-modal-add-end-btn")) {
        let name = null;
        if (typeof window.showCustomPrompt === "function") {
          name = await window.showCustomPrompt("添加技能", "请输入技能名称...", "", "text");
        } else {
          name = prompt("请输入技能名称:");
        }
        if (!name || !name.trim()) return;
        const trimmed = name.trim();
        if (!currentActiveCocPanel.data.customSkills) currentActiveCocPanel.data.customSkills = [];
        if (!currentActiveCocPanel.data.customSkills.includes(trimmed)) {
          currentActiveCocPanel.data.customSkills.push(trimmed);
        }
        if (typeof currentActiveCocPanel.data.skills[trimmed] === "undefined") {
          currentActiveCocPanel.data.skills[trimmed] = 0;
        }
        renderCocModalSkillsGrid();
        return;
      }

      const item = e.target.closest(".coc-skill-item");
      if (!item || !currentActiveCocPanel) return;
      const skillName = item.dataset.skill;
      const base = parseInt(item.dataset.base, 10) || 0;
      const valInput = item.querySelector(".coc-skill-val");
      if (!valInput) return;

      if (e.target.closest(".coc-skill-add5-btn")) {
        let currentVal = parseInt(valInput.value, 10) || base;
        currentVal += 5;
        valInput.value = currentVal;
        currentActiveCocPanel.data.skills[skillName] = currentVal;
        updateCocModalTotalPoints();
      } else if (e.target.closest(".coc-skill-sub5-btn")) {
        let currentVal = parseInt(valInput.value, 10) || base;
        currentVal = Math.max(base, currentVal - 5);
        valInput.value = currentVal;
        currentActiveCocPanel.data.skills[skillName] = currentVal;
        updateCocModalTotalPoints();
      } else if (e.target.closest(".coc-skill-reset-btn")) {
        valInput.value = base;
        currentActiveCocPanel.data.skills[skillName] = base;
        updateCocModalTotalPoints();
      }
    });

    grid.addEventListener("input", (e) => {
      if (e.target.classList.contains("coc-skill-val") && currentActiveCocPanel) {
        const item = e.target.closest(".coc-skill-item");
        if (!item || item.classList.contains("coc-add-skill-card")) return;
        const skillName = item.dataset.skill;
        currentActiveCocPanel.data.skills[skillName] = parseInt(e.target.value, 10) || 0;
        updateCocModalTotalPoints();
      }
    });
  }

  // 全部重置按钮
  const resetAllBtn = document.getElementById("coc-modal-reset-all-btn");
  if (resetAllBtn) {
    resetAllBtn.onclick = () => {
      if (!currentActiveCocPanel) return;
      const stats = currentActiveCocPanel.data.stats || {};
      const grid = document.getElementById("coc-modal-skills-grid");
      if (grid) {
        grid.querySelectorAll(".coc-skill-item").forEach(item => {
          if (item.classList.contains("coc-add-skill-card")) return;
          const name = item.dataset.skill;
          const base = getSkillBaseValue(name, stats);
          const valInput = item.querySelector(".coc-skill-val");
          if (valInput) valInput.value = base;
          currentActiveCocPanel.data.skills[name] = base;
        });
      }
      updateCocModalTotalPoints();
    };
  }

  // 保存预设
  const savePresetBtn = document.getElementById("coc-modal-save-preset-btn");
  if (savePresetBtn) {
    savePresetBtn.onclick = async () => {
      if (!currentActiveCocPanel) return;
      let presetName = null;
      if (typeof window.showCustomPrompt === "function") {
        presetName = await window.showCustomPrompt("新建预设", "请输入预设方案名称...", "", "text");
      } else {
        presetName = prompt("请输入预设方案名称:");
      }
      if (!presetName || !presetName.trim()) return;
      const trimmed = presetName.trim();
      const presets = getStoredCocPresets();
      const newPreset = {
        id: "coc_preset_" + Date.now(),
        name: trimmed,
        skills: { ...currentActiveCocPanel.data.skills },
        customSkills: [...(currentActiveCocPanel.data.customSkills || [])]
      };
      presets.push(newPreset);
      saveStoredCocPresets(presets);
      loadCocModalPresetsList(newPreset.id);
      if (typeof window.showCustomAlert === "function") {
        await window.showCustomAlert("提示", "预设保存成功");
      } else {
        alert("预设保存成功");
      }
    };
  }

  // 选择预设立即套用
  const presetSelect = document.getElementById("coc-modal-preset-select");
  if (presetSelect) {
    presetSelect.onchange = () => {
      const presetId = presetSelect.value;
      if (!presetId) return;
      localStorage.setItem("coc_active_skill_preset_id", presetId);
      if (!currentActiveCocPanel) return;
      const presets = getStoredCocPresets();
      const preset = presets.find(p => p.id === presetId);
      if (!preset) return;

      if (Array.isArray(preset.customSkills)) {
        if (!currentActiveCocPanel.data.customSkills) currentActiveCocPanel.data.customSkills = [];
        preset.customSkills.forEach(c => {
          if (!currentActiveCocPanel.data.customSkills.includes(c)) {
            currentActiveCocPanel.data.customSkills.push(c);
          }
        });
      }

      currentActiveCocPanel.data.skills = { ...preset.skills };
      renderCocModalSkillsGrid();
    };
  }

  // 删除预设
  const delPresetBtn = document.getElementById("coc-modal-del-preset-btn");
  if (delPresetBtn) {
    delPresetBtn.onclick = async () => {
      const select = document.getElementById("coc-modal-preset-select");
      const presetId = select ? select.value : "";
      if (!presetId) {
        if (typeof window.showCustomAlert === "function") {
          await window.showCustomAlert("提示", "请选择要删除的预设");
        } else {
          alert("请选择要删除的预设");
        }
        return;
      }
      let presets = getStoredCocPresets();
      presets = presets.filter(p => p.id !== presetId);
      saveStoredCocPresets(presets);
      loadCocModalPresetsList();
      if (typeof window.showCustomAlert === "function") {
        await window.showCustomAlert("提示", "预设已删除");
      } else {
        alert("预设已删除");
      }
    };
  }
}

// 页面就绪后初始化事件
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initCocSkillsModalEvents);
} else {
  initCocSkillsModalEvents();
}

async function openCocFillModal(cocPanel) {
  let modal = document.getElementById("coc-inject-modal");
  if (modal) {
    modal.remove();
  }

  modal = document.createElement("div");
  modal.id = "coc-inject-modal";
  modal.className = "modal";
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 250px; width: 85%; padding: 14px 16px; border-radius: 16px; box-sizing: border-box; background: var(--card-bg, #ffffff); margin: auto; text-align: center; font-family: inherit; border: 1px solid var(--border-color, #e0e0e0);">
      <div class="modal-header" style="font-size: 14px; font-weight: 600; text-align: center; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; border-bottom: none; padding: 0;">
        <span style="flex: 1; text-align: center;">数据注入</span>
        <button type="button" class="close-btn" id="close-coc-inject-modal-btn" style="background: none; border: none; font-size: 18px; cursor: pointer; color: var(--text-secondary); padding: 0 4px; line-height: 1;">&times;</button>
      </div>
      <div class="modal-body" style="padding: 4px 0; text-align: center;">
        <div style="display: flex; gap: 8px; justify-content: center; margin-bottom: 10px;">
          <button type="button" class="moe-btn-secondary coc-inject-tab-btn" id="coc-inject-tab-wb" data-type="worldbook" style="padding: 4px 12px; font-size: 12px; height: 26px; border-radius: 8px; border: 1px solid var(--accent-color); background: var(--accent-color); color: #ffffff; cursor: pointer; text-align: center; display: inline-flex; align-items: center; justify-content: center; min-width: 60px;">世界书</button>
          <button type="button" class="moe-btn-secondary coc-inject-tab-btn" id="coc-inject-tab-mod" data-type="module" style="padding: 4px 12px; font-size: 12px; height: 26px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--secondary-bg); color: var(--text-primary); cursor: pointer; text-align: center; display: inline-flex; align-items: center; justify-content: center; min-width: 60px;">模组</button>
        </div>

        <div id="coc-inject-wb-section">
          <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 6px; display: block; text-align: center;">选择世界书</label>
          <div id="coc-inject-wb-tree" style="max-height: 160px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: 8px; padding: 6px; background: var(--secondary-bg); text-align: center; display: flex; flex-direction: column; gap: 6px;">
            <div style="font-size: 12px; color: var(--text-secondary); padding: 8px;">加载中...</div>
          </div>
        </div>

        <div id="coc-inject-mod-section" style="display: none;">
          <div style="padding: 16px 8px; text-align: center; color: var(--text-secondary); font-size: 12px; background: var(--secondary-bg); border-radius: 8px; border: 1px dashed var(--border-color);">
            暂无可用模组
          </div>
        </div>
      </div>

      <div class="modal-footer" style="display: flex; gap: 10px; justify-content: center; margin-top: 12px; border-top: none; padding: 0;">
        <button type="button" class="cancel" id="cancel-coc-inject-btn" style="height: 28px; font-size: 12px; border-radius: 8px; padding: 0 14px; min-width: 60px; display: inline-flex; align-items: center; justify-content: center; text-align: center; cursor: pointer; border: 1px solid var(--border-color); background: var(--secondary-bg); color: var(--text-primary);">取消</button>
        <button type="button" class="moe-btn" id="confirm-coc-inject-btn" style="height: 28px; font-size: 12px; border-radius: 8px; padding: 0 14px; min-width: 60px; display: inline-flex; align-items: center; justify-content: center; text-align: center; cursor: pointer; border: none; background: var(--accent-color); color: #ffffff;">确定</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const wbTab = modal.querySelector("#coc-inject-tab-wb");
  const modTab = modal.querySelector("#coc-inject-tab-mod");
  const wbSection = modal.querySelector("#coc-inject-wb-section");
  const modSection = modal.querySelector("#coc-inject-mod-section");
  const wbTree = modal.querySelector("#coc-inject-wb-tree");
  const cancelBtn = modal.querySelector("#cancel-coc-inject-btn");
  const closeBtn = modal.querySelector("#close-coc-inject-modal-btn");
  const confirmBtn = modal.querySelector("#confirm-coc-inject-btn");

  let currentTab = "worldbook";
  let selectedBookIds = new Set();

  function updateTabsUI() {
    if (wbTab && modTab && wbSection && modSection) {
      if (currentTab === "worldbook") {
        wbTab.style.borderColor = "var(--accent-color)";
        wbTab.style.background = "var(--accent-color)";
        wbTab.style.color = "#ffffff";
        modTab.style.borderColor = "var(--border-color)";
        modTab.style.background = "var(--secondary-bg)";
        modTab.style.color = "var(--text-primary)";
        wbSection.style.display = "block";
        modSection.style.display = "none";
      } else {
        modTab.style.borderColor = "var(--accent-color)";
        modTab.style.background = "var(--accent-color)";
        modTab.style.color = "#ffffff";
        wbTab.style.borderColor = "var(--border-color)";
        wbTab.style.background = "var(--secondary-bg)";
        wbTab.style.color = "var(--text-primary)";
        wbSection.style.display = "none";
        modSection.style.display = "block";
      }
    }
  }

  if (wbTab) wbTab.onclick = () => { currentTab = "worldbook"; updateTabsUI(); };
  if (modTab) modTab.onclick = () => { currentTab = "module"; updateTabsUI(); };
  updateTabsUI();

  // 渲染支持分类展开/折叠的世界书选择树
  async function renderWorldBookTree() {
    if (!wbTree) return;
    wbTree.innerHTML = "";

    try {
      const books = (window.state && window.state.worldBooks) || [];
      let categories = [];
      if (window.db && window.db.worldBookCategories) {
        categories = await window.db.worldBookCategories.toArray();
      }

      if (books.length === 0) {
        wbTree.innerHTML = `<div style="font-size: 12px; color: var(--text-secondary); text-align: center; padding: 8px;">暂无可用世界书</div>`;
        return;
      }

      const hasUncategorized = books.some(b => !b.categoryId);
      if (hasUncategorized) {
        categories.push({ id: "uncategorized", name: "未分类" });
      }

      const booksByCat = books.reduce((acc, b) => {
        const catId = b.categoryId || "uncategorized";
        if (!acc[catId]) acc[catId] = [];
        acc[catId].push(b);
        return acc;
      }, {});

      categories.forEach(cat => {
        const catBooks = booksByCat[cat.id] || [];
        if (catBooks.length > 0) {
          const catGroup = document.createElement("div");
          catGroup.style.cssText = "display: flex; flex-direction: column; gap: 4px; text-align: center;";

          const catHeader = document.createElement("div");
          catHeader.style.cssText = "font-size: 12px; font-weight: 600; color: var(--text-primary); cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px; padding: 4px 6px; background: var(--card-bg); border-radius: 6px; border: 1px solid var(--border-color); user-select: none;";
          catHeader.innerHTML = `<span>▼</span><span>${cat.name}</span>`;

          const catContent = document.createElement("div");
          catContent.style.cssText = "display: flex; flex-direction: column; gap: 4px; padding-left: 0; margin-top: 2px;";

          catBooks.forEach(b => {
            const item = document.createElement("label");
            item.style.cssText = "display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 12px; color: var(--text-primary); cursor: pointer; padding: 4px 6px; border-radius: 6px; background: var(--card-bg); border: 1px solid var(--border-color); box-sizing: border-box; text-align: center; width: 100%;";
            
            const isChecked = selectedBookIds.has(b.id) ? "checked" : "";
            item.innerHTML = `<input type="checkbox" class="coc-inject-wb-chk" value="${b.id}" ${isChecked} style="margin: 0; cursor: pointer;"> <span style="display: flex; align-items: center; justify-content: center; text-align: center;">${b.name || "未命名世界书"}</span>`;

            item.querySelector("input").addEventListener("change", (e) => {
              if (e.target.checked) {
                selectedBookIds.add(b.id);
              } else {
                selectedBookIds.delete(b.id);
              }
            });

            catContent.appendChild(item);
          });

          let isCollapsed = false;
          catHeader.addEventListener("click", (e) => {
            if (e.target.tagName === "INPUT") return;
            isCollapsed = !isCollapsed;
            catHeader.querySelector("span").textContent = isCollapsed ? "▶" : "▼";
            catContent.style.display = isCollapsed ? "none" : "flex";
          });

          catGroup.appendChild(catHeader);
          catGroup.appendChild(catContent);
          wbTree.appendChild(catGroup);
        }
      });
    } catch (err) {
      console.error("渲染注入世界书列表失败:", err);
      wbTree.innerHTML = `<div style="font-size: 12px; color: var(--tukey-red, #ff4d4f); text-align: center; padding: 8px;">加载失败</div>`;
    }
  }

  await renderWorldBookTree();

  modal.classList.add("visible");
  const closeModal = () => modal.classList.remove("visible");
  if (cancelBtn) cancelBtn.onclick = closeModal;
  if (closeBtn) closeBtn.onclick = closeModal;

  if (confirmBtn) {
    confirmBtn.onclick = async () => {
      if (currentTab === "module") {
        if (typeof window.showCustomAlert === "function") {
          await window.showCustomAlert("提示", "暂无可用模组");
        } else {
          alert("暂无可用模组");
        }
        return;
      }

      if (selectedBookIds.size === 0) {
        if (typeof window.showCustomAlert === "function") {
          await window.showCustomAlert("提示", "请选择至少本世界书");
        } else {
          alert("请选择至少一本世界书");
        }
        return;
      }

      const worldBooks = (window.state && window.state.worldBooks) || [];
      const selectedBooks = worldBooks.filter(b => selectedBookIds.has(b.id));
      if (selectedBooks.length === 0) {
        if (typeof window.showCustomAlert === "function") {
          await window.showCustomAlert("提示", "没有检索到信息");
        } else {
          alert("没有检索到信息");
        }
        closeModal();
        return;
      }

      confirmBtn.disabled = true;
      confirmBtn.textContent = "解析中";

      try {
        let charName = "";
        let charPersona = "";
        const currentChatId = window.state?.activeChatId;
        const currentChat = currentChatId ? window.state?.chats?.[currentChatId] : null;

        if (cocPanel.options && cocPanel.options.characterType === "my" || cocPanel.containerId === "my-coc-panel-container") {
          charName = currentChat?.settings?.myNickname || "我";
          charPersona = currentChat?.settings?.myPersona || document.getElementById("my-persona")?.value || "";
        } else if (cocPanel.options && cocPanel.options.characterType === "member" || cocPanel.containerId === "member-coc-panel-container") {
          const memId = window.editingMemberId;
          const member = (currentChat?.members || []).find(m => m.id === memId);
          charName = member?.groupNickname || member?.originalName || document.getElementById("member-name-input")?.value || "";
          charPersona = member?.persona || document.getElementById("member-persona-input")?.value || "";
        } else {
          charName = currentChat?.name || document.getElementById("chat-name-input")?.value || "";
          charPersona = currentChat?.settings?.aiPersona || document.getElementById("ai-persona")?.value || "";
        }

        const combinedWbText = selectedBooks.map(b => `【${b.name}】:\n${b.content || ""}`).join("\n\n");

        const promptText = `你是一个TRPG COC第七版角色数据解析助手。请阅读以下角色设定与选中的世界书内容，检索或判断世界书中是否有角色“${charName}”的COC第七版属性数值（力量、敏捷、体质、意志、体型、教育、外貌、智力、幸运）或技能数值。

角色名称: ${charName}
角色设定: ${charPersona}
选中的世界书内容:
${combinedWbText.slice(0, 4000)}

【判定规则】:
1. 仔细检索世界书文本中是否有关于“${charName}”的数值信息或技能描述。
2. 如果选中的世界书文本中完全没有关于“${charName}”的数值或技能信息，请严格输出纯 JSON:
{"found": false}
3. 如果包含“${charName}”的数值或技能信息，请提取或转化属性数值（1-99）和技能数值（1-99）。若角色包含非标准技能（例如飞行、特殊能力等），请一并列出。请严格输出纯 JSON:
{"found": true, "stats": {"str": 50, "dex": 50, "con": 50, "pow": 50, "siz": 50, "edu": 50, "app": 50, "int": 50, "luk": 50}, "skills": {"闪避": 25, "侦查": 60, "飞行": 40}}

【格式铁律】: 你的回复必须且只能是一个严格的纯 JSON 对象，直接以 '{' 开头，以 '}' 结尾。严禁输出任何代码块标记（例如 \`\`\`json ）或解释。`;

        const apiConfig = window.state?.apiConfig || {};
        const apiKey = apiConfig.apiKey;
        const proxyUrl = apiConfig.proxyUrl || "https://api.openai.com";
        const model = apiConfig.model || "gpt-3.5-turbo";

        if (!apiKey) {
          if (typeof window.showCustomAlert === "function") {
            await window.showCustomAlert("提示", "请先配置密钥");
          } else {
            alert("请先配置密钥");
          }
          return;
        }

        let rawText = "";
        const isGemini = (proxyUrl === window.GEMINI_API_URL || proxyUrl.includes("googleapis.com"));
        if (isGemini) {
          let geminiConfig = typeof window.toGeminiRequestData === "function"
            ? window.toGeminiRequestData(model, apiKey, promptText, [{ role: "user", content: "请输出角色数据JSON" }], isGemini)
            : null;
          if (geminiConfig) {
            const res = await fetch(geminiConfig.url, geminiConfig.data);
            const json = await res.json();
            rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text || "";
          }
        } else {
          const res = await fetch(`${proxyUrl}/v1/chat/completions`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              model: model,
              messages: [
                { role: "system", content: promptText },
                { role: "user", content: "请输出JSON" }
              ],
              temperature: 0.2
            })
          });
          const json = await res.json();
          rawText = json?.choices?.[0]?.message?.content || "";
        }

        const match = rawText.match(/\{[\s\S]*\}/);
        if (!match) {
          if (typeof window.showCustomAlert === "function") {
            await window.showCustomAlert("提示", "没有检索到信息");
          } else {
            alert("没有检索到信息");
          }
          return;
        }

        const parsed = JSON.parse(match[0]);
        if (parsed.found === false) {
          if (typeof window.showCustomAlert === "function") {
            await window.showCustomAlert("提示", "没有检索到信息");
          } else {
            alert("没有检索到信息");
          }
          return;
        }

        let hasUpdated = false;
        if (parsed.stats && typeof parsed.stats === "object") {
          Object.keys(parsed.stats).forEach(k => {
            const val = parseInt(parsed.stats[k], 10);
            if (!isNaN(val)) {
              cocPanel.data.stats[k] = Math.max(0, Math.min(999, val));
              hasUpdated = true;
            }
          });
        }

        if (parsed.skills && typeof parsed.skills === "object") {
          Object.keys(parsed.skills).forEach(s => {
            const val = parseInt(parsed.skills[s], 10);
            if (!isNaN(val)) {
              cocPanel.data.skills[s] = Math.max(0, Math.min(999, val));
              hasUpdated = true;

              const isStandard = COC_STANDARD_SKILLS.some(std => std.name === s);
              if (!isStandard) {
                if (!Array.isArray(cocPanel.data.customSkills)) {
                  cocPanel.data.customSkills = [];
                }
                if (!cocPanel.data.customSkills.includes(s)) {
                  cocPanel.data.customSkills.push(s);
                }
              }
            }
          });
        }

        if (hasUpdated) {
          cocPanel.data.calculated = calculateCocStats(cocPanel.data.stats, cocPanel.data.calculated);
          cocPanel.setData(cocPanel.data);

          if (typeof cocPanel.save === "function") {
            cocPanel.save();
          }

          if (cocPanel.options && (cocPanel.options.characterType === "member" || cocPanel.containerId === "member-coc-panel-container")) {
            const memId = window.editingMemberId;
            const member = (currentChat?.members || []).find(m => m.id === memId);
            if (member && currentChat) {
              member.cocPanel = cocPanel.data;
              if (window.db && window.db.chats) await window.db.chats.put(currentChat);
            }
          } else if (cocPanel.options && (cocPanel.options.characterType === "my" || cocPanel.containerId === "my-coc-panel-container")) {
            if (currentChat && currentChat.settings) {
              currentChat.settings.myCocPanel = cocPanel.data;
              if (window.db && window.db.chats) await window.db.chats.put(currentChat);
            }
          } else {
            if (currentChat && currentChat.settings) {
              currentChat.settings.cocPanel = cocPanel.data;
              if (window.db && window.db.chats) await window.db.chats.put(currentChat);
            }
          }

          if (typeof window.showCustomAlert === "function") {
            await window.showCustomAlert("提示", "已成功注入");
          } else {
            alert("已成功注入");
          }
        } else {
          if (typeof window.showCustomAlert === "function") {
            await window.showCustomAlert("提示", "没有检索到信息");
          } else {
            alert("没有检索到信息");
          }
        }
      } catch (err) {
        console.error("COC数据填充失败:", err);
        if (typeof window.showCustomAlert === "function") {
          await window.showCustomAlert("提示", "失败");
        } else {
          alert("失败");
        }
      } finally {
        confirmBtn.disabled = false;
        confirmBtn.textContent = "确定";
        closeModal();
      }
    };
  }
}

window.openCocFillModal = openCocFillModal;

window.CocPanel = CocPanel;
window.createCocPanel = function(containerId, options = {}) {
  return new CocPanel(containerId, options);
};

// 提取AI提示词中的HP/MP/SAN状态摘要，不包含技能
window.getCocPromptStatus = function(cocData) {
  if (!cocData || !cocData.calculated) return "";
  const c = cocData.calculated;
  return `HP: ${c.hp}/${c.maxHp}, MP: ${c.mp}/${c.maxMp}, SAN: ${c.san}/${c.maxSan}`;
};
