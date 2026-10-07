// ===================================================================
// 跑团战斗系统引擎
// ===================================================================

(function (global) {
  'use strict';

  const DEFAULT_COMBAT_RULES_TEXT = `【COC 第六版 · 标准战斗规则】

一、战斗轮与行动
1. 战斗按"轮"推进，每轮约 1 秒（带团可按场景放宽）。
2. 每个角色每轮可：移动一次（最多 MOV 值，人类通常 8）+ 执行一个动作（攻击、闪避、装填、施法、急救等）。
3. 行动顺序：按敏捷（DEX）从高到低行动；敏捷相同者同时行动或掷骰决定先后。

二、检定
1. 掷 1D100，结果≤技能值即成功。
2. 大成功：掷出 01——攻击必中且造成最大伤害（伤害骰取满）。
3. 大失败：掷出 100——武器卡住、摔倒、误伤自己或同伴（由守秘人裁定）。
4. 本版无"普通/困难/极限成功"等级，无奖励骰/惩罚骰；有利或不利条件直接用百分比修正（如瞄准 +20%、移动中射击 -20%）。

三、攻击与闪避（本版无反击、无格挡）
1. 攻击流程：
   - 攻击者掷攻击检定（斗殴/武器/射击技能）：
     · 失败 → 攻击落空，直接结束；
     · 成功 → 目标可以尝试闪避。
2. 闪避（Dodge，基础值 = 敏捷/2）：
   - 目标掷闪避检定：
     · 闪避成功 → 攻击落空，完全无伤；
     · 闪避失败 → 攻击命中，掷伤害。
3. 目标默认尝试闪避；以下情况【不能闪避】，攻击自动命中：
   - 昏迷、眩晕、被制伏、被捆绑；
   - 未察觉攻击（被突袭、背刺）；
   - 丧失行动能力（重伤倒地）。
4. 每轮通常只能闪避一次；被多名敌人围攻时，守秘人可允许对每次攻击分别闪避，但每次额外闪避承受 -20% 修正。
5. 远程射击：目标只要看到枪手且能移动，即可用闪避对抗；被突袭时不可闪避。远程攻击不存在"格挡/反击"。

四、伤害
1. 命中后掷武器伤害骰（如 1D4、1D6、1D8、2D6），近战加上伤害加值 DB（由力量+体格决定，如 0、+1D4、+1D6）；枪械伤害不加 DB。
2. 护甲：目标护甲值从单次伤害中扣除，剩余部分才扣生命值。
3. 大成功（01）攻击：伤害取最大值。

五、生命值、重创与濒死
1. 生命值（HP）降至 0：角色昏迷。
2. HP 降至负值（-1 及以下）：角色濒临死亡，每轮结束时进行 CON×5（体质×5）检定，失败即死亡；持续检定直到获得急救/医学稳定，或 HP 回到 0 以上。
3. HP 降至 -CON 或更低：立即死亡。
4. 重创/眩晕：单次伤害达到或超过最大 HP 的一半，角色受到重创——当场倒地或眩晕，下一轮行动受限（守秘人裁定），且眩晕期间不能闪避。

六、急救与医学
1. 急救（First Aid）检定成功：恢复 1 点 HP，并稳定濒死角色（负 HP 拉回 0，停止每轮检定）；失败则该处伤势不能再尝试急救。
2. 医学（Medicine）检定成功：恢复 1D3 点 HP，同样可稳定濒死。
3. 每处伤势只能接受一次救治（急救或医学其一）。
4. 急救约需 1 分钟（战斗中约 1 轮，消耗本轮动作）；医学同理。

七、射击细则
1. 射速：手枪等半自动武器一轮最多 3 发（每发单独检定，后续发数承受修正）；栓动步枪一轮 1 发；冲锋枪可扫射，由守秘人裁定压制效果。
2. 瞄准射击：花 1 轮瞄准不射击，下一轮射击检定 +20%。
3. 移动中射击：检定 -20%。
4. 距离与掩体：超出有效射程或目标藏于掩体后，检定承受 -20% 或更高惩罚；掩体可为目标提供额外护甲或完全遮挡。
5. 被突袭、被捆绑、丧失行动能力时，目标不可闪避射击。

八、结算顺序
攻击检定 →（成功）→ 目标闪避检定 →（闪避失败）→ 伤害掷骰 → 扣护甲 → 扣生命值 → 检查 HP 0 / 负值 / 重创。`;

  function getCombatState(chat) {
    if (!chat) return null;
    if (!chat.combatState) {
      chat.combatState = {
        active: false,
        combatants: [],
        order: [],
        rulebook: DEFAULT_COMBAT_RULES_TEXT
      };
    }
    if (!Array.isArray(chat.combatState.combatants)) {
      chat.combatState.combatants = [];
    }
    if (!chat.combatState.rulebook) {
      chat.combatState.rulebook = DEFAULT_COMBAT_RULES_TEXT;
    }
    return chat.combatState;
  }

  function getCharacterStatsForCombat(chat, memberId, memberName) {
    let dex = 50;
    let str = 50;
    let con = 50;
    let pow = 50;
    let siz = 50;
    let edu = 50;
    let app = 50;
    let int = 50;
    let luk = 50;
    let hp = 10;
    let maxHp = 10;
    let mp = 10;
    let maxMp = 10;
    let san = 50;
    let maxSan = 50;
    let armor = 0;
    let db = '0';
    let avatar = '';
    let customSkills = [];

    let targetCoc = null;

    if (memberId === 'user') {
      targetCoc = chat.settings?.myCocPanel;
      avatar = chat.settings?.myAvatar || '';
    } else if (chat.isGroup && Array.isArray(chat.members)) {
      const member = chat.members.find(m => m.id === memberId || m.groupNickname === memberName || m.originalName === memberName);
      if (member) {
        targetCoc = member.cocPanel;
        avatar = member.avatar || '';
      }
    } else if (!chat.isGroup) {
      targetCoc = chat.settings?.aiCocPanel;
      avatar = chat.avatar || '';
    }

    if (targetCoc) {
      if (targetCoc.stats) {
        if (targetCoc.stats.dex) dex = parseInt(targetCoc.stats.dex, 10) || 50;
        if (targetCoc.stats.str) str = parseInt(targetCoc.stats.str, 10) || 50;
        if (targetCoc.stats.con) con = parseInt(targetCoc.stats.con, 10) || 50;
        if (targetCoc.stats.pow) pow = parseInt(targetCoc.stats.pow, 10) || 50;
        if (targetCoc.stats.siz) siz = parseInt(targetCoc.stats.siz, 10) || 50;
        if (targetCoc.stats.edu) edu = parseInt(targetCoc.stats.edu, 10) || 50;
        if (targetCoc.stats.app) app = parseInt(targetCoc.stats.app, 10) || 50;
        if (targetCoc.stats.int) int = parseInt(targetCoc.stats.int, 10) || 50;
        if (targetCoc.stats.luk) luk = parseInt(targetCoc.stats.luk, 10) || 50;
      }
      if (targetCoc.calculated) {
        if (targetCoc.calculated.hp !== undefined) hp = parseInt(targetCoc.calculated.hp, 10) || 10;
        if (targetCoc.calculated.maxHp !== undefined) maxHp = parseInt(targetCoc.calculated.maxHp, 10) || hp;
        if (targetCoc.calculated.mp !== undefined) mp = parseInt(targetCoc.calculated.mp, 10) || 10;
        if (targetCoc.calculated.maxMp !== undefined) maxMp = parseInt(targetCoc.calculated.maxMp, 10) || mp;
        if (targetCoc.calculated.san !== undefined) san = parseInt(targetCoc.calculated.san, 10) || 50;
        if (targetCoc.calculated.maxSan !== undefined) maxSan = parseInt(targetCoc.calculated.maxSan, 10) || 50;
        if (targetCoc.calculated.armor !== undefined) armor = parseInt(targetCoc.calculated.armor, 10) || 0;
        if (targetCoc.calculated.db) db = targetCoc.calculated.db;
      }
      if (Array.isArray(targetCoc.customSkills)) {
        customSkills = targetCoc.customSkills;
      }
    }

    return { str, dex, con, pow, siz, edu, app, int, luk, hp, maxHp, mp, maxMp, san, maxSan, armor, db, avatar, customSkills };
  }

  function sortCombatantsByDex(combatants) {
    if (!Array.isArray(combatants)) return [];
    return [...combatants].sort((a, b) => {
      const dexA = parseInt(a.dex, 10) || 0;
      const dexB = parseInt(b.dex, 10) || 0;
      return dexB - dexA;
    });
  }

  function updateCombatUI(chatId) {
    const currentChat = global.state?.chats?.[chatId];
    if (!currentChat) return;

    const combatState = getCombatState(currentChat);
    const toggleBtn = document.getElementById('combat-toggle-btn');
    if (toggleBtn) {
      toggleBtn.textContent = combatState.active ? '退出战斗' : '进入战斗';
    }

    const charBar = document.getElementById('combat-character-bar');
    if (charBar) {
      if (combatState.active) {
        charBar.style.display = 'flex';
        renderCombatCharacterBar(chatId);
      } else {
        charBar.style.display = 'none';
      }
    }
  }

  function renderCombatCharacterBar(chatId) {
    const currentChat = global.state?.chats?.[chatId];
    if (!currentChat) return;

    const listContainer = document.getElementById('combat-characters-list');
    if (!listContainer) return;

    const combatState = getCombatState(currentChat);
    const combatants = sortCombatantsByDex(combatState.combatants);
    listContainer.innerHTML = '';

    if (combatants.length === 0) {
      listContainer.innerHTML = '<div style="font-size: 11px; color: var(--text-secondary); padding: 4px 8px;">暂无参战成员</div>';
      return;
    }

    combatants.forEach(c => {
      const badge = document.createElement('div');
      badge.className = 'combat-char-badge';
      const armorText = (c.armor && c.armor > 0) ? ` | 护甲: ${c.armor}` : '';
      badge.title = `${c.name} (敏捷: ${c.dex} | HP: ${c.hp}/${c.maxHp}${armorText} | MP: ${c.mp}/${c.maxMp})`;

      const avatarBox = document.createElement('div');
      avatarBox.className = 'combat-char-avatar-box';

      const avatarInner = document.createElement('div');
      avatarInner.className = 'combat-char-avatar-inner';

      if (c.avatar) {
        const img = document.createElement('img');
        img.className = 'combat-char-avatar-img';
        img.src = c.avatar;
        img.alt = c.name;
        avatarInner.appendChild(img);
      } else {
        const textSpan = document.createElement('span');
        textSpan.className = 'combat-char-avatar-text';
        textSpan.textContent = (c.name || '人').substring(0, 1);
        avatarInner.appendChild(textSpan);
      }
      avatarBox.appendChild(avatarInner);

      const dexBadge = document.createElement('div');
      dexBadge.className = 'combat-char-dex-badge';
      dexBadge.textContent = c.dex;
      avatarBox.appendChild(dexBadge);

      const nameEl = document.createElement('div');
      nameEl.className = 'combat-char-name';
      nameEl.textContent = c.name;

      const barsContainer = document.createElement('div');
      barsContainer.className = 'combat-bars-container';

      const hpTrack = document.createElement('div');
      hpTrack.className = 'combat-hp-track';
      const hpFill = document.createElement('div');
      hpFill.className = 'combat-hp-fill';

      const maxHp = Math.max(1, parseInt(c.maxHp, 10) || 10);
      const curHp = Math.max(0, parseInt(c.hp, 10) || 0);
      const hpPercent = Math.min(100, Math.max(0, (curHp / maxHp) * 100));
      hpFill.style.width = `${hpPercent}%`;

      if (curHp <= 0) {
        hpFill.classList.add('dead');
      } else if (curHp <= Math.floor(maxHp / 2) || curHp <= 2) {
        hpFill.classList.add('danger');
      }
      hpTrack.appendChild(hpFill);

      const mpTrack = document.createElement('div');
      mpTrack.className = 'combat-mp-track';
      const mpFill = document.createElement('div');
      mpFill.className = 'combat-mp-fill';

      const maxMp = Math.max(1, parseInt(c.maxMp, 10) || 10);
      const curMp = Math.max(0, parseInt(c.mp, 10) || 0);
      const mpPercent = Math.min(100, Math.max(0, (curMp / maxMp) * 100));
      mpFill.style.width = `${mpPercent}%`;
      mpTrack.appendChild(mpFill);

      barsContainer.appendChild(hpTrack);
      barsContainer.appendChild(mpTrack);

      badge.appendChild(avatarBox);
      badge.appendChild(nameEl);
      badge.appendChild(barsContainer);

      badge.addEventListener('click', (e) => {
        e.stopPropagation();
        openCombatCharacterModal(chatId, c.id);
      });

      listContainer.appendChild(badge);
    });
  }

  let activeModalCombatantId = null;

  function openCombatCharacterModal(chatId, combatantId) {
    const currentChat = global.state?.chats?.[chatId];
    if (!currentChat) return;

    const combatState = getCombatState(currentChat);
    const c = (combatState.combatants || []).find(item => item.id === combatantId);
    if (!c) return;

    activeModalCombatantId = combatantId;

    const avatarBox = document.getElementById('combat-modal-char-avatar');
    if (avatarBox) {
      avatarBox.innerHTML = '';
      if (c.avatar) {
        const img = document.createElement('img');
        img.src = c.avatar;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        avatarBox.appendChild(img);
      } else {
        avatarBox.textContent = (c.name || '人').substring(0, 1);
      }
    }

    const nameEl = document.getElementById('combat-modal-char-name');
    if (nameEl) nameEl.textContent = `${c.name} 面板`;

    const setInputVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val !== undefined ? val : 50;
    };

    setInputVal('combat-char-str', c.str || 50);
    setInputVal('combat-char-dex', c.dex || 50);
    setInputVal('combat-char-con', c.con || 50);
    setInputVal('combat-char-pow', c.pow || 50);
    setInputVal('combat-char-siz', c.siz || 50);
    setInputVal('combat-char-edu', c.edu || 50);
    setInputVal('combat-char-app', c.app || 50);
    setInputVal('combat-char-int', c.int || 50);
    setInputVal('combat-char-luk', c.luk || 50);

    const armorInput = document.getElementById('combat-char-armor-input');
    if (armorInput) armorInput.value = c.armor || 0;

    const updateCalculatedDisplays = () => {
      const hpEl = document.getElementById('combat-char-hp-display');
      const mpEl = document.getElementById('combat-char-mp-display');
      const sanEl = document.getElementById('combat-char-san-display');
      const dbEl = document.getElementById('combat-char-db-display');

      const armorVal = parseInt(armorInput ? armorInput.value : c.armor, 10) || 0;
      const armorBracket = armorVal > 0 ? ` <span style="color: var(--text-secondary); font-size: 10px; font-weight: normal;">(${armorVal})</span>` : '';

      if (hpEl) hpEl.innerHTML = `${c.hp || 10}/${c.maxHp || 10}${armorBracket}`;
      if (mpEl) mpEl.textContent = `${c.mp || 10}/${c.maxMp || 10}`;
      if (sanEl) sanEl.textContent = `${c.san || 50}/${c.maxSan || 99}`;
      if (dbEl) dbEl.textContent = c.db || '0';
    };

    if (armorInput) {
      armorInput.oninput = updateCalculatedDisplays;
    }
    updateCalculatedDisplays();

    renderCustomSkillsList(c);

    const toggleBtn = document.getElementById('combat-custom-skills-toggle');
    const skillsBody = document.getElementById('combat-custom-skills-body');
    const skillsArrow = document.getElementById('combat-custom-skills-arrow');
    if (toggleBtn && skillsBody && skillsArrow) {
      skillsBody.style.display = 'none';
      skillsArrow.style.transform = 'rotate(-90deg)';
      toggleBtn.onclick = () => {
        const isClosed = skillsBody.style.display === 'none';
        skillsBody.style.display = isClosed ? 'flex' : 'none';
        skillsArrow.style.transform = isClosed ? 'rotate(0deg)' : 'rotate(-90deg)';
      };
    }

    const addSkillBtn = document.getElementById('combat-add-skill-btn');
    if (addSkillBtn) {
      addSkillBtn.onclick = () => {
        const nameIn = document.getElementById('combat-new-skill-name');
        const descIn = document.getElementById('combat-new-skill-desc');
        const sName = nameIn ? nameIn.value.trim() : '';
        const sDesc = descIn ? descIn.value.trim() : '';
        if (!sName) return;
        if (!Array.isArray(c.customSkills)) c.customSkills = [];
        c.customSkills.push({ id: 'skill_' + Date.now(), name: sName, desc: sDesc });
        if (nameIn) nameIn.value = '';
        if (descIn) descIn.value = '';
        renderCustomSkillsList(c);
      };
    }

    const modal = document.getElementById('combat-character-modal');
    if (modal) modal.style.display = 'flex';
  }

  function renderCustomSkillsList(c) {
    const listEl = document.getElementById('combat-custom-skills-list');
    if (!listEl) return;
    listEl.innerHTML = '';

    const skills = Array.isArray(c.customSkills) ? c.customSkills : [];
    if (skills.length === 0) {
      listEl.innerHTML = '<div style="font-size: 11px; color: var(--text-secondary); text-align: center; padding: 4px;">暂无专属技能，可在下方添加</div>';
      return;
    }

    skills.forEach((sk, idx) => {
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.alignItems = 'center';
      row.style.justifyContent = 'space-between';
      row.style.background = 'var(--secondary-bg)';
      row.style.padding = '4px 6px';
      row.style.borderRadius = '6px';
      row.style.fontSize = '11px';

      const left = document.createElement('div');
      left.style.display = 'flex';
      left.style.gap = '6px';
      left.style.alignItems = 'center';
      left.style.overflow = 'hidden';
      left.innerHTML = `<span style="font-weight: 600; color: var(--text-primary); white-space: nowrap;">${sk.name}</span><span style="color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${sk.desc || ''}</span>`;
      row.appendChild(left);

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'moe-btn-mini';
      delBtn.textContent = '×';
      delBtn.style.color = '#ff4d4f';
      delBtn.style.border = 'none';
      delBtn.style.background = 'transparent';
      delBtn.style.cursor = 'pointer';
      delBtn.style.fontSize = '13px';
      delBtn.style.padding = '0 4px';
      delBtn.onclick = (e) => {
        e.stopPropagation();
        skills.splice(idx, 1);
        renderCustomSkillsList(c);
      };
      row.appendChild(delBtn);

      listEl.appendChild(row);
    });
  }

  function closeCombatCharacterModal() {
    const modal = document.getElementById('combat-character-modal');
    if (modal) modal.style.display = 'none';
    activeModalCombatantId = null;
  }

  async function saveCombatCharacterModal() {
    const activeChatId = global.state?.activeChatId;
    const currentChat = global.state?.chats?.[activeChatId];
    if (!currentChat || !activeModalCombatantId) return;

    const combatState = getCombatState(currentChat);
    const c = (combatState.combatants || []).find(item => item.id === activeModalCombatantId);
    if (!c) return;

    const getNum = (id, fallback) => {
      const el = document.getElementById(id);
      return el ? (parseInt(el.value, 10) || fallback) : fallback;
    };

    c.str = getNum('combat-char-str', c.str || 50);
    c.dex = getNum('combat-char-dex', c.dex || 50);
    c.con = getNum('combat-char-con', c.con || 50);
    c.pow = getNum('combat-char-pow', c.pow || 50);
    c.siz = getNum('combat-char-siz', c.siz || 50);
    c.edu = getNum('combat-char-edu', c.edu || 50);
    c.app = getNum('combat-char-app', c.app || 50);
    c.int = getNum('combat-char-int', c.int || 50);
    c.luk = getNum('combat-char-luk', c.luk || 50);

    const armorInput = document.getElementById('combat-char-armor-input');
    c.armor = armorInput ? (parseInt(armorInput.value, 10) || 0) : 0;

    syncCombatantToRealCard(currentChat, c);

    combatState.combatants = sortCombatantsByDex(combatState.combatants);
    combatState.order = combatState.combatants.map(item => item.id);

    const dbInstance = typeof global.db !== 'undefined' ? global.db : global.database;
    if (dbInstance) {
      await dbInstance.chats.put(currentChat);
    }

    closeCombatCharacterModal();
    renderCombatCharacterBar(activeChatId);
    if (typeof global.showToast === 'function') {
      global.showToast('角色面板已保存');
    }
  }

  function syncCombatantToRealCard(chat, c) {
    if (!chat || !c) return;
    const targetId = c.id;

    if (targetId === 'user' || c.isUser) {
      if (!chat.settings) chat.settings = {};
      if (!chat.settings.myCocPanel) chat.settings.myCocPanel = { stats: {}, calculated: {}, skills: {} };
      if (!chat.settings.myCocPanel.stats) chat.settings.myCocPanel.stats = {};
      if (!chat.settings.myCocPanel.calculated) chat.settings.myCocPanel.calculated = {};

      Object.assign(chat.settings.myCocPanel.stats, {
        str: c.str, dex: c.dex, con: c.con, pow: c.pow, siz: c.siz,
        edu: c.edu, app: c.app, int: c.int, luk: c.luk
      });
      chat.settings.myCocPanel.calculated.hp = c.hp;
      chat.settings.myCocPanel.calculated.maxHp = c.maxHp;
      chat.settings.myCocPanel.calculated.mp = c.mp;
      chat.settings.myCocPanel.calculated.maxMp = c.maxMp;
      chat.settings.myCocPanel.calculated.san = c.san;
      chat.settings.myCocPanel.calculated.armor = c.armor || 0;
      chat.settings.myCocPanel.customSkills = c.customSkills || [];
    } else if (chat.isGroup && Array.isArray(chat.members)) {
      const m = chat.members.find(item => item.id === targetId || item.groupNickname === c.name || item.originalName === c.name);
      if (m) {
        if (!m.cocPanel) m.cocPanel = { stats: {}, calculated: {}, skills: {} };
        if (!m.cocPanel.stats) m.cocPanel.stats = {};
        if (!m.cocPanel.calculated) m.cocPanel.calculated = {};
        Object.assign(m.cocPanel.stats, {
          str: c.str, dex: c.dex, con: c.con, pow: c.pow, siz: c.siz,
          edu: c.edu, app: c.app, int: c.int, luk: c.luk
        });
        m.cocPanel.calculated.hp = c.hp;
        m.cocPanel.calculated.maxHp = c.maxHp;
        m.cocPanel.calculated.mp = c.mp;
        m.cocPanel.calculated.maxMp = c.maxMp;
        m.cocPanel.calculated.san = c.san;
        m.cocPanel.calculated.armor = c.armor || 0;
        m.cocPanel.customSkills = c.customSkills || [];
      }
    } else if (!chat.isGroup && (targetId === chat.id || c.name === chat.name)) {
      if (!chat.settings) chat.settings = {};
      if (!chat.settings.aiCocPanel) chat.settings.aiCocPanel = { stats: {}, calculated: {}, skills: {} };
      if (!chat.settings.aiCocPanel.stats) chat.settings.aiCocPanel.stats = {};
      if (!chat.settings.aiCocPanel.calculated) chat.settings.aiCocPanel.calculated = {};
      Object.assign(chat.settings.aiCocPanel.stats, {
        str: c.str, dex: c.dex, con: c.con, pow: c.pow, siz: c.siz,
        edu: c.edu, app: c.app, int: c.int, luk: c.luk
      });
      chat.settings.aiCocPanel.calculated.hp = c.hp;
      chat.settings.aiCocPanel.calculated.maxHp = c.maxHp;
      chat.settings.aiCocPanel.calculated.mp = c.mp;
      chat.settings.aiCocPanel.calculated.maxMp = c.maxMp;
      chat.settings.aiCocPanel.calculated.san = c.san;
      chat.settings.aiCocPanel.calculated.armor = c.armor || 0;
      chat.settings.aiCocPanel.customSkills = c.customSkills || [];
    }
  }

  async function analyzeCombatantsWithAI(chat) {
    if (!chat) return null;

    let moduleText = '';
    if (typeof global.getChatModulePromptBlock === 'function') {
      try {
        moduleText = await global.getChatModulePromptBlock(chat);
      } catch (e) {}
    }

    const recentMsgs = (chat.history || [])
      .filter(m => !m.isHidden && m.type !== 'module_semi_switch_card' && m.type !== 'combat_confirm_card')
      .slice(-12)
      .map(m => `${m.senderName || (m.role === 'user' ? '玩家' : 'AI')}: ${m.content || ''}`)
      .join('\n');

    const userName = chat.settings?.myNickname || '玩家';
    const userStats = getCharacterStatsForCombat(chat, 'user', userName);

    const charactersContext = [];
    const userArmorText = userStats.armor > 0 ? ` | 护甲: ${userStats.armor}` : '';
    charactersContext.push(`- 玩家角色：${userName} | 敏捷: ${userStats.dex} | HP: ${userStats.hp}/${userStats.maxHp}${userArmorText} | MP: ${userStats.mp}/${userStats.maxMp} | SAN: ${userStats.san}/${userStats.maxSan}`);

    if (chat.isGroup && Array.isArray(chat.members)) {
      chat.members.forEach(m => {
        const mName = m.groupNickname || m.originalName;
        const stats = getCharacterStatsForCombat(chat, m.id, mName);
        const armorText = stats.armor > 0 ? ` | 护甲: ${stats.armor}` : '';
        charactersContext.push(`- 群成员：${mName} (ID: ${m.id}) | 敏捷: ${stats.dex} | HP: ${stats.hp}/${stats.maxHp}${armorText} | MP: ${stats.mp}/${stats.maxMp}`);
      });
    } else if (!chat.isGroup) {
      const aiName = chat.settings?.remarkName || chat.name || 'NPC';
      const stats = getCharacterStatsForCombat(chat, chat.id, aiName);
      const armorText = stats.armor > 0 ? ` | 护甲: ${stats.armor}` : '';
      charactersContext.push(`- 当前NPC：${aiName} | 敏捷: ${stats.dex} | HP: ${stats.hp}/${stats.maxHp}${armorText} | MP: ${stats.mp}/${stats.maxMp}`);
    }

    const combatRules = getCombatState(chat).rulebook || DEFAULT_COMBAT_RULES_TEXT;
    const prompt = `你是一个跑团TRPG战斗裁判与系统。请分析当前模组、剧情对话上下文、已知角色卡与战斗规则，裁定本次战斗的全部参战者名单（包括玩家、参战同伴、敌对怪物或敌对NPC）。

【战斗规则】：
${combatRules}

【当前模组信息】：
${moduleText ? moduleText.substring(0, 1200) : '无'}

【已知角色卡资料】：
${charactersContext.join('\n')}

【最近剧情对话】：
${recentMsgs || '无'}

请判断谁正在参战，并输出严格的JSON数据，严禁输出任何多余废话或Markdown代码块之外的内容，格式如下：
{
  "combatants": [
    {
      "id": "user",
      "name": "${userName}",
      "dex": ${userStats.dex},
      "hp": ${userStats.hp},
      "maxHp": ${userStats.maxHp},
      "mp": ${userStats.mp},
      "maxMp": ${userStats.maxMp},
      "armor": ${userStats.armor || 0},
      "isEnemy": false,
      "isUser": true,
      "prompt": ""
    },
    {
      "id": "enemy_1",
      "name": "敌对怪物或NPC名称",
      "dex": 55,
      "hp": 12,
      "maxHp": 12,
      "mp": 10,
      "maxMp": 10,
      "armor": 0,
      "isEnemy": true,
      "isUser": false,
      "prompt": "1024x1024 detailed fantasy TRPG monster portrait, sharp focus"
    }
  ]
}

要求：
1. 参战者必须包含当前直接参与战斗的角色；
2. 如果是已知玩家或群成员，请保留其原属性；如果是新出现的敌人、怪兽或NPC，请根据其强弱合理设定敏捷dex、HP、MP、护甲armor，并填写一段专业的英文画图提示词 prompt；
3. 只能返回合法的 JSON。`;

    try {
      const apiCfg = typeof global.getEffectiveApiConfig === 'function' ? global.getEffectiveApiConfig('chat') : (global.state?.apiConfig || {});
      const proxyUrl = apiCfg.proxyUrl || 'https://api.openai.com';
      const apiKey = apiCfg.apiKey || '';
      const model = apiCfg.model || 'gpt-4o-mini';

      if (!apiKey) return null;

      let jsonText = '';
      if (proxyUrl.includes('generativelanguage.googleapis.com')) {
        const cleanModel = (model || 'gemini-1.5-flash').replace(/^models\//, '');
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' }
          })
        });
        const data = await res.json();
        jsonText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      } else {
        const reqUrl = proxyUrl.endsWith('/v1') ? `${proxyUrl}/chat/completions` : (proxyUrl.includes('/chat/completions') ? proxyUrl : `${proxyUrl}/v1/chat/completions`);
        const res = await fetch(reqUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: model,
            messages: [{ role: 'user', content: prompt }]
          })
        });
        const data = await res.json();
        jsonText = data?.choices?.[0]?.message?.content || '';
      }

      jsonText = jsonText.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
      const parsed = JSON.parse(jsonText);
      if (parsed && Array.isArray(parsed.combatants) && parsed.combatants.length > 0) {
        return parsed.combatants;
      }
    } catch (e) {
      console.warn('AI 战斗参战者分析失败，采用默认配置', e);
    }
    return null;
  }

  async function enterCombat(chatId, callAi = true) {
    const currentChat = global.state?.chats?.[chatId];
    if (!currentChat) return;

    const toggleBtn = document.getElementById('combat-toggle-btn');
    if (toggleBtn) {
      toggleBtn.textContent = '进入中...';
    }

    if (typeof global.showToast === 'function') {
      global.showToast('正在组织参战角色与排布先攻...');
    }

    const combatState = getCombatState(currentChat);
    combatState.active = true;

    let aiCombatants = null;
    if (callAi) {
      aiCombatants = await analyzeCombatantsWithAI(currentChat);
    }

    if (aiCombatants && Array.isArray(aiCombatants) && aiCombatants.length > 0) {
      const mergedList = aiCombatants.map(item => {
        let avatar = '';
        let str = 50, con = 50, pow = 50, siz = 50, edu = 50, app = 50, int = 50, luk = 50;
        let customSkills = [];
        let armor = parseInt(item.armor, 10) || 0;

        if (item.isUser || item.id === 'user') {
          const stats = getCharacterStatsForCombat(currentChat, 'user', item.name);
          avatar = stats.avatar;
          str = stats.str; con = stats.con; pow = stats.pow; siz = stats.siz;
          edu = stats.edu; app = stats.app; int = stats.int; luk = stats.luk;
          customSkills = stats.customSkills;
          if (stats.armor > 0 && !armor) armor = stats.armor;
        } else if (currentChat.isGroup && Array.isArray(currentChat.members)) {
          const m = currentChat.members.find(mem => mem.id === item.id || mem.groupNickname === item.name || mem.originalName === item.name);
          if (m) {
            const stats = getCharacterStatsForCombat(currentChat, m.id, item.name);
            avatar = m.avatar || '';
            str = stats.str; con = stats.con; pow = stats.pow; siz = stats.siz;
            edu = stats.edu; app = stats.app; int = stats.int; luk = stats.luk;
            customSkills = stats.customSkills;
            if (stats.armor > 0 && !armor) armor = stats.armor;
          }
        } else if (!currentChat.isGroup && (item.id === currentChat.id || item.name === currentChat.name)) {
          const stats = getCharacterStatsForCombat(currentChat, currentChat.id, item.name);
          avatar = currentChat.avatar || '';
          str = stats.str; con = stats.con; pow = stats.pow; siz = stats.siz;
          edu = stats.edu; app = stats.app; int = stats.int; luk = stats.luk;
          customSkills = stats.customSkills;
          if (stats.armor > 0 && !armor) armor = stats.armor;
        }

        return {
          id: item.id || ('char_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4)),
          name: item.name || '参战者',
          dex: parseInt(item.dex, 10) || 50,
          str, con, pow, siz, edu, app, int, luk,
          hp: parseInt(item.hp, 10) || 10,
          maxHp: parseInt(item.maxHp, 10) || parseInt(item.hp, 10) || 10,
          mp: parseInt(item.mp, 10) || 10,
          maxMp: parseInt(item.maxMp, 10) || parseInt(item.mp, 10) || 10,
          san: 50,
          maxSan: 50,
          armor,
          avatar: avatar,
          prompt: item.prompt || '',
          customSkills,
          isEnemy: !!item.isEnemy,
          isUser: !!item.isUser || item.id === 'user'
        };
      });
      combatState.combatants = sortCombatantsByDex(mergedList);
    } else if (!Array.isArray(combatState.combatants) || combatState.combatants.length === 0) {
      const list = [];
      const userName = currentChat.settings?.myNickname || '玩家';
      const userStats = getCharacterStatsForCombat(currentChat, 'user', userName);
      list.push({
        id: 'user',
        name: userName,
        avatar: userStats.avatar,
        dex: userStats.dex,
        str: userStats.str, con: userStats.con, pow: userStats.pow, siz: userStats.siz,
        edu: userStats.edu, app: userStats.app, int: userStats.int, luk: userStats.luk,
        hp: userStats.hp,
        maxHp: userStats.maxHp,
        mp: userStats.mp,
        maxMp: userStats.maxMp,
        san: userStats.san,
        maxSan: userStats.maxSan,
        armor: userStats.armor || 0,
        customSkills: userStats.customSkills || [],
        isUser: true,
        isEnemy: false
      });

      if (!currentChat.isGroup) {
        const aiName = currentChat.settings?.remarkName || currentChat.name || '对手';
        const aiStats = getCharacterStatsForCombat(currentChat, currentChat.id, aiName);
        list.push({
          id: currentChat.id || 'ai_opponent',
          name: aiName,
          avatar: aiStats.avatar,
          dex: aiStats.dex,
          str: aiStats.str, con: aiStats.con, pow: aiStats.pow, siz: aiStats.siz,
          edu: aiStats.edu, app: aiStats.app, int: aiStats.int, luk: aiStats.luk,
          hp: aiStats.hp,
          maxHp: aiStats.maxHp,
          mp: aiStats.mp,
          maxMp: aiStats.maxMp,
          san: aiStats.san,
          maxSan: aiStats.maxSan,
          armor: aiStats.armor || 0,
          customSkills: aiStats.customSkills || [],
          isUser: false,
          isEnemy: true
        });
      } else if (currentChat.isGroup && Array.isArray(currentChat.members) && currentChat.members.length > 0) {
        const activeMember = currentChat.members[0];
        const memStats = getCharacterStatsForCombat(currentChat, activeMember.id, activeMember.groupNickname || activeMember.originalName);
        list.push({
          id: activeMember.id,
          name: activeMember.groupNickname || activeMember.originalName,
          avatar: memStats.avatar,
          dex: memStats.dex,
          str: memStats.str, con: memStats.con, pow: memStats.pow, siz: memStats.siz,
          edu: memStats.edu, app: memStats.app, int: memStats.int, luk: memStats.luk,
          hp: memStats.hp,
          maxHp: memStats.maxHp,
          mp: memStats.mp,
          maxMp: memStats.maxMp,
          san: memStats.san,
          maxSan: memStats.maxSan,
          armor: memStats.armor || 0,
          customSkills: memStats.customSkills || [],
          isUser: false,
          isEnemy: false
        });
      }

      combatState.combatants = sortCombatantsByDex(list);
    } else {
      combatState.combatants = sortCombatantsByDex(combatState.combatants);
    }

    combatState.order = combatState.combatants.map(c => c.id);

    const dbInstance = typeof global.db !== 'undefined' ? global.db : global.database;
    if (dbInstance) {
      await dbInstance.chats.put(currentChat);
    }

    const orderNames = combatState.combatants.map(c => `${c.name} 敏捷 ${c.dex}`).join(' > ');
    const announceText = `参战顺序：${orderNames}`;
    if (typeof global.logSystemMessage === 'function') {
      await global.logSystemMessage(currentChat.id, announceText);
    }

    hideCombatDropdownPanel();
    updateCombatUI(currentChat.id);

    if (typeof global.showToast === 'function') {
      global.showToast('已进入战斗状态');
    }
  }

  async function exitCombat(chatId) {
    const currentChat = global.state?.chats?.[chatId];
    if (!currentChat) return;

    const combatState = getCombatState(currentChat);
    combatState.active = false;

    if (Array.isArray(combatState.combatants)) {
      combatState.combatants.forEach(c => {
        syncCombatantToRealCard(currentChat, c);
      });
    }

    const dbInstance = typeof global.db !== 'undefined' ? global.db : global.database;
    if (dbInstance) {
      await dbInstance.chats.put(currentChat);
    }

    if (typeof global.logSystemMessage === 'function') {
      await global.logSystemMessage(currentChat.id, '战斗结束');
    }

    hideCombatDropdownPanel();
    updateCombatUI(currentChat.id);

    if (typeof global.showToast === 'function') {
      global.showToast('已退出战斗');
    }
  }

  function toggleCombatDropdownPanel() {
    const panel = document.getElementById('combat-dropdown-panel');
    if (!panel) return;
    const isShowing = panel.style.display === 'flex';
    if (isShowing) {
      panel.style.display = 'none';
    } else {
      panel.style.display = 'flex';
      const activeChatId = global.state?.activeChatId;
      if (activeChatId) {
        updateCombatUI(activeChatId);
      }
    }
  }

  function hideCombatDropdownPanel() {
    const panel = document.getElementById('combat-dropdown-panel');
    if (panel) {
      panel.style.display = 'none';
    }
  }

  let currentEditingCombatants = [];

  function openCombatEditModal(chatId, targetCombatantId = null) {
    const currentChat = global.state?.chats?.[chatId];
    if (!currentChat) return;

    hideCombatDropdownPanel();
    const combatState = getCombatState(currentChat);
    currentEditingCombatants = JSON.parse(JSON.stringify(combatState.combatants || []));

    renderEditingCombatantsList();

    const memberSelect = document.getElementById('combat-add-from-members');
    if (memberSelect) {
      memberSelect.innerHTML = '<option value="">从群成员选择快速添加...</option>';
      if (currentChat.isGroup && Array.isArray(currentChat.members)) {
        currentChat.members.forEach(m => {
          const opt = document.createElement('option');
          opt.value = m.id;
          opt.textContent = m.groupNickname || m.originalName;
          memberSelect.appendChild(opt);
        });
        memberSelect.style.display = 'block';
      } else {
        memberSelect.style.display = 'none';
      }
    }

    const modal = document.getElementById('combat-edit-modal');
    if (modal) modal.style.display = 'flex';
  }

  function renderEditingCombatantsList() {
    const listContainer = document.getElementById('combat-edit-combatants-list');
    if (!listContainer) return;
    listContainer.innerHTML = '';

    if (currentEditingCombatants.length === 0) {
      listContainer.innerHTML = '<div style="font-size: 12px; color: var(--text-secondary); text-align: center; padding: 8px;">暂无参战成员</div>';
      return;
    }

    currentEditingCombatants.forEach((c, idx) => {
      const item = document.createElement('div');
      item.style.display = 'flex';
      item.style.alignItems = 'center';
      item.style.justifyContent = 'space-between';
      item.style.padding = '8px';
      item.style.background = 'var(--secondary-bg)';
      item.style.borderRadius = '8px';
      item.style.gap = '8px';

      const left = document.createElement('div');
      left.style.display = 'flex';
      left.style.alignItems = 'center';
      left.style.gap = '8px';
      left.style.flex = '1';

      const avatarBox = document.createElement('div');
      avatarBox.style.width = '30px';
      avatarBox.style.height = '30px';
      avatarBox.style.borderRadius = '50%';
      avatarBox.style.overflow = 'hidden';
      avatarBox.style.flexShrink = '0';
      avatarBox.style.background = '#e0e0e0';
      avatarBox.style.display = 'flex';
      avatarBox.style.alignItems = 'center';
      avatarBox.style.justifyContent = 'center';

      if (c.avatar) {
        const img = document.createElement('img');
        img.src = c.avatar;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        avatarBox.appendChild(img);
      } else {
        avatarBox.textContent = (c.name || '人').substring(0, 1);
        avatarBox.style.fontSize = '11px';
        avatarBox.style.fontWeight = '600';
      }
      left.appendChild(avatarBox);

      const armorStr = (c.armor && c.armor > 0) ? ` | 护甲: ${c.armor}` : '';
      const info = document.createElement('div');
      info.style.flex = '1';
      info.innerHTML = `<div style="font-weight: 600; font-size: 12px; color: var(--text-primary);">${c.name}</div>
        <div style="font-size: 11px; color: var(--text-secondary);">敏捷: ${c.dex} | HP: ${c.hp}/${c.maxHp}${armorStr} | MP: ${c.mp}/${c.maxMp}</div>`;
      left.appendChild(info);

      const right = document.createElement('div');
      right.style.display = 'flex';
      right.style.gap = '4px';

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'moe-btn-small';
      delBtn.textContent = '移除';
      delBtn.style.color = '#ff4d4f';
      delBtn.style.padding = '2px 8px';
      delBtn.style.fontSize = '11px';
      delBtn.onclick = () => {
        currentEditingCombatants.splice(idx, 1);
        renderEditingCombatantsList();
      };
      right.appendChild(delBtn);

      item.appendChild(left);
      item.appendChild(right);
      listContainer.appendChild(item);
    });
  }

  function closeCombatEditModal() {
    const modal = document.getElementById('combat-edit-modal');
    if (modal) modal.style.display = 'none';
  }

  async function saveCombatEditModal() {
    const activeChatId = global.state?.activeChatId;
    const currentChat = global.state?.chats?.[activeChatId];
    if (!currentChat) return;

    const combatState = getCombatState(currentChat);
    combatState.combatants = sortCombatantsByDex(currentEditingCombatants);
    combatState.order = combatState.combatants.map(c => c.id);

    const dbInstance = typeof global.db !== 'undefined' ? global.db : global.database;
    if (dbInstance) {
      await dbInstance.chats.put(currentChat);
    }

    closeCombatEditModal();
    updateCombatUI(activeChatId);
  }

  function openCombatRulesModal(chatId) {
    const currentChat = global.state?.chats?.[chatId];
    if (!currentChat) return;

    hideCombatDropdownPanel();
    const combatState = getCombatState(currentChat);
    const textarea = document.getElementById('combat-rules-textarea');
    if (textarea) {
      textarea.value = combatState.rulebook || DEFAULT_COMBAT_RULES_TEXT;
    }

    const modal = document.getElementById('combat-rules-modal');
    if (modal) modal.style.display = 'flex';
  }

  function closeCombatRulesModal() {
    const modal = document.getElementById('combat-rules-modal');
    if (modal) modal.style.display = 'none';
  }

  async function saveCombatRules() {
    const activeChatId = global.state?.activeChatId;
    const currentChat = global.state?.chats?.[activeChatId];
    if (!currentChat) return;

    const textarea = document.getElementById('combat-rules-textarea');
    if (textarea) {
      const combatState = getCombatState(currentChat);
      combatState.rulebook = textarea.value.trim() || DEFAULT_COMBAT_RULES_TEXT;
      const dbInstance = typeof global.db !== 'undefined' ? global.db : global.database;
      if (dbInstance) {
        await dbInstance.chats.put(currentChat);
      }
    }
    closeCombatRulesModal();
  }

  function resetCombatRules() {
    const textarea = document.getElementById('combat-rules-textarea');
    if (textarea) {
      textarea.value = DEFAULT_COMBAT_RULES_TEXT;
    }
  }

  function syncCombatantStatsFromCoc(chat, memberId, memberName, newCoc) {
    if (!chat) return;
    const combatState = getCombatState(chat);
    if (!Array.isArray(combatState.combatants)) return;

    const target = combatState.combatants.find(c => c.id === memberId || (memberId === 'user' && c.isUser) || c.name === memberName);
    if (target && newCoc) {
      if (newCoc.calculated) {
        if (newCoc.calculated.hp !== undefined) target.hp = parseInt(newCoc.calculated.hp, 10);
        if (newCoc.calculated.maxHp !== undefined) target.maxHp = parseInt(newCoc.calculated.maxHp, 10);
        if (newCoc.calculated.mp !== undefined) target.mp = parseInt(newCoc.calculated.mp, 10);
        if (newCoc.calculated.maxMp !== undefined) target.maxMp = parseInt(newCoc.calculated.maxMp, 10);
        if (newCoc.calculated.san !== undefined) target.san = parseInt(newCoc.calculated.san, 10);
        if (newCoc.calculated.armor !== undefined) target.armor = parseInt(newCoc.calculated.armor, 10);
      }
      if (newCoc.stats) {
        if (newCoc.stats.dex !== undefined) target.dex = parseInt(newCoc.stats.dex, 10);
        if (newCoc.stats.str !== undefined) target.str = parseInt(newCoc.stats.str, 10);
        if (newCoc.stats.con !== undefined) target.con = parseInt(newCoc.stats.con, 10);
        if (newCoc.stats.pow !== undefined) target.pow = parseInt(newCoc.stats.pow, 10);
      }
      if (Array.isArray(newCoc.customSkills)) {
        target.customSkills = newCoc.customSkills;
      }

      renderCombatCharacterBar(chat.id);
    }
  }

  function getCombatPromptBlock(chatOrId) {
    let currentChat = chatOrId;
    if (typeof chatOrId === 'string') {
      currentChat = global.state?.chats?.[chatOrId];
    }
    if (!currentChat) return '';

    const combatState = getCombatState(currentChat);
    if (!combatState || !combatState.active) return '';

    const combatants = sortCombatantsByDex(combatState.combatants);
    if (!combatants || combatants.length === 0) return '';

    const combatantLines = combatants.map(c => {
      const armorTxt = (c.armor && c.armor > 0) ? `，护甲:${c.armor}` : '';
      const skillsTxt = (Array.isArray(c.skills) && c.skills.length > 0)
        ? `，技能列表:[${c.skills.map(s => `${s.name}${s.value ? `(${s.value})` : ''}`).join(', ')}]`
        : '';
      return `- 参战者全名【${c.name}】：敏捷 ${c.dex}，当前HP ${c.hp}/${c.maxHp}，当前MP ${c.mp}/${c.maxMp}，当前SAN ${c.san}/${c.maxSan}${armorTxt}${skillsTxt}`;
    }).join('\n');

    const orderNames = combatants.map(c => c.name).join(' -> ');

    return `\n\n# 【当前处于COC标准战斗状态（必须严格执行）】
1. **行动先后顺序（按敏捷DEX从高到低）**：
${orderNames}

2. **当前所有参战人员完整名单与实时数值**：
${combatantLines}

3. **【【【重要：角色全名与战斗指令规范】】】**：
- **必须使用完整全名**：在回复或执行掷骰/扣血时，角色名字【必须与上述参战名单中的全名完全一致】（例如名单为“邪教徒甲”，就必须写“邪教徒甲”，严禁简写为“甲”或打错字）。
- **指令格式与多项目支持**：
  * 扣减/增加/修改数值：使用 \`.st 角色全名 属性1±数值 属性2±数值\`（例如：\`.st 邪教徒甲 hp-5\`，或同时修改多个项目：\`.st 邪教徒甲 hp-6 mp-2\`、\`.st 张三 hp-3 san-5\`）。
  * 技能或命中检定：\`.ra 角色全名 技能名\`（例如：\`.ra 邪教徒甲 斗殴\`，\`.ra 张三 闪避\`）。
  * 普通投掷：\`.r 角色全名 1d6+2\`。
- **支持在叙述气泡中自然嵌入指令**：指令可以直接写在正常剧情叙事文本的任何位置，无需单独发气泡（例如：“邪教徒猛扑过来！.ra 邪教徒甲 斗殴\n你侧身一闪并挥拳反击，正中其面门造成6点伤害！.st 邪教徒甲 hp-6”），系统会自动识别并精准扣减对应角色的生命与状态！

4. **战斗规则遵循**：
${combatState.rulebook || DEFAULT_COMBAT_RULES_TEXT}
`;
  }

  function getCombatSystemPrompt(chatId) {
    return getCombatPromptBlock(chatId);
  }

  function initCombatEngine() {
    const entryBtn = document.getElementById('combat-entry-btn');
    if (entryBtn) {
      entryBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleCombatDropdownPanel();
      });
    }

    const toggleBtn = document.getElementById('combat-toggle-btn');
    if (toggleBtn) {
      toggleBtn.classList.add('combat-toggle-accent-btn');
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const activeChatId = global.state?.activeChatId;
        if (!activeChatId) return;
        const currentChat = global.state?.chats?.[activeChatId];
        const combatState = getCombatState(currentChat);
        if (combatState.active) {
          exitCombat(activeChatId);
        } else {
          enterCombat(activeChatId, true);
        }
      });
    }

    const editBtn = document.getElementById('combat-edit-btn');
    if (editBtn) {
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const activeChatId = global.state?.activeChatId;
        if (activeChatId) openCombatEditModal(activeChatId);
      });
    }

    const rulesBtn = document.getElementById('combat-rules-btn');
    if (rulesBtn) {
      rulesBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const activeChatId = global.state?.activeChatId;
        if (activeChatId) openCombatRulesModal(activeChatId);
      });
    }

    document.addEventListener('click', (e) => {
      const panel = document.getElementById('combat-dropdown-panel');
      const entry = document.getElementById('combat-entry-btn');
      if (panel && panel.style.display === 'flex') {
        if (!panel.contains(e.target) && (!entry || !entry.contains(e.target))) {
          panel.style.display = 'none';
        }
      }
    });

    const charClose = document.getElementById('combat-char-modal-close-btn');
    const charCancel = document.getElementById('combat-char-modal-cancel-btn');
    const charSave = document.getElementById('combat-char-modal-save-btn');
    if (charClose) charClose.addEventListener('click', closeCombatCharacterModal);
    if (charCancel) charCancel.addEventListener('click', closeCombatCharacterModal);
    if (charSave) charSave.addEventListener('click', saveCombatCharacterModal);

    const editClose = document.getElementById('combat-edit-close-btn');
    const editCancel = document.getElementById('combat-edit-cancel-btn');
    const editSave = document.getElementById('combat-edit-save-btn');
    if (editClose) editClose.addEventListener('click', closeCombatEditModal);
    if (editCancel) editCancel.addEventListener('click', closeCombatEditModal);
    if (editSave) editSave.addEventListener('click', saveCombatEditModal);

    const rulesClose = document.getElementById('combat-rules-close-btn');
    const rulesReset = document.getElementById('combat-rules-reset-btn');
    const rulesSave = document.getElementById('combat-rules-save-btn');
    if (rulesClose) rulesClose.addEventListener('click', closeCombatRulesModal);
    if (rulesReset) rulesReset.addEventListener('click', resetCombatRules);
    if (rulesSave) rulesSave.addEventListener('click', saveCombatRules);

    const addConfirmBtn = document.getElementById('combat-add-confirm-btn');
    if (addConfirmBtn) {
      addConfirmBtn.addEventListener('click', () => {
        const nameInput = document.getElementById('combat-add-name');
        const dexInput = document.getElementById('combat-add-dex');
        const hpInput = document.getElementById('combat-add-hp');
        const mpInput = document.getElementById('combat-add-mp');
        const promptInput = document.getElementById('combat-add-prompt');

        const name = nameInput ? nameInput.value.trim() : '';
        if (!name) return;

        const dex = dexInput ? parseInt(dexInput.value, 10) || 50 : 50;
        const hp = hpInput ? parseInt(hpInput.value, 10) || 10 : 10;
        const mp = mpInput ? parseInt(mpInput.value, 10) || 10 : 10;
        const prompt = promptInput ? promptInput.value.trim() : '';

        currentEditingCombatants.push({
          id: 'enemy_' + Date.now(),
          name,
          dex,
          str: 50, con: 50, pow: 50, siz: 50, edu: 50, app: 50, int: 50, luk: 50,
          hp,
          maxHp: hp,
          mp,
          maxMp: mp,
          san: 50,
          maxSan: 50,
          armor: 0,
          prompt,
          customSkills: [],
          avatar: '',
          isUser: false,
          isEnemy: true
        });

        if (nameInput) nameInput.value = '';
        if (promptInput) promptInput.value = '';
        renderEditingCombatantsList();
      });
    }

    const memberSelect = document.getElementById('combat-add-from-members');
    if (memberSelect) {
      memberSelect.addEventListener('change', () => {
        const memId = memberSelect.value;
        if (!memId) return;
        const activeChatId = global.state?.activeChatId;
        const currentChat = global.state?.chats?.[activeChatId];
        if (!currentChat || !Array.isArray(currentChat.members)) return;
        const mem = currentChat.members.find(m => m.id === memId);
        if (mem) {
          const stats = getCharacterStatsForCombat(currentChat, mem.id, mem.groupNickname || mem.originalName);
          const nameInput = document.getElementById('combat-add-name');
          const dexInput = document.getElementById('combat-add-dex');
          const hpInput = document.getElementById('combat-add-hp');
          const mpInput = document.getElementById('combat-add-mp');
          if (nameInput) nameInput.value = mem.groupNickname || mem.originalName;
          if (dexInput) dexInput.value = stats.dex;
          if (hpInput) hpInput.value = stats.hp;
          if (mpInput) mpInput.value = stats.mp;
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCombatEngine);
  } else {
    initCombatEngine();
  }

  global.CombatEngine = {
    getCombatState,
    enterCombat,
    exitCombat,
    updateCombatUI,
    renderCombatCharacterBar,
    syncCombatantStatsFromCoc,
    getCombatSystemPrompt,
    getCombatPromptBlock,
    analyzeCombatantsWithAI,
    openCombatCharacterModal
  };

  global.getCombatState = getCombatState;
  global.enterCombat = enterCombat;
  global.exitCombat = exitCombat;
  global.updateCombatUI = updateCombatUI;
  global.renderCombatCharacterBar = renderCombatCharacterBar;
  global.syncCombatantStatsFromCoc = syncCombatantStatsFromCoc;
  global.getCombatSystemPrompt = getCombatSystemPrompt;
  global.getCombatPromptBlock = getCombatPromptBlock;

})(window);
