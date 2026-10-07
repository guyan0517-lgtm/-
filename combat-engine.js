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

    const defData = (typeof global.getDefaultCocData === 'function') ? global.getDefaultCocData() : { skills: {} };
    const skills = { ...(defData.skills || {}), ...(targetCoc?.skills || {}) };

    const dodgeBase = Math.floor(dex / 2);
    if (!skills["闪避"] || skills["闪避"] === 25) skills["闪避"] = Math.max(dodgeBase, 40);
    if (!skills["斗殴"] || skills["斗殴"] === 25) skills["斗殴"] = 55;
    if (!skills["格斗"] || skills["格斗"] === 25) skills["格斗"] = 55;
    if (!skills["射击"] || skills["射击"] === 20) skills["射击"] = 50;
    if (!skills["手枪"] || skills["手枪"] === 20) skills["手枪"] = 50;
    if (!skills["急救"] || skills["急救"] === 30) skills["急救"] = 40;
    if (!skills["侦查"] || skills["侦查"] === 25) skills["侦查"] = 50;
    if (!skills["聆听"] || skills["聆听"] === 20) skills["聆听"] = 40;

    return { str, dex, con, pow, siz, edu, app, int, luk, hp, maxHp, mp, maxMp, san, maxSan, armor, db, avatar, customSkills, skills, cocPanel: targetCoc };
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

  let activeMiniCardCombatantId = null;

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
      badge.title = `${c.name} 敏捷: ${c.dex} | HP: ${c.hp}/${c.maxHp}${armorText} | MP: ${c.mp}/${c.maxMp}`;

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

      let pressTimer = null;
      let isLongPress = false;

      const startLongPress = () => {
        isLongPress = false;
        clearTimeout(pressTimer);
        pressTimer = setTimeout(async () => {
          isLongPress = true;
          let ok = false;
          if (typeof window.showCustomConfirm === 'function') {
            ok = await window.showCustomConfirm('生成立绘', `确定要为参战角色 ${c.name} 生成立绘头像吗？`);
          } else {
            ok = confirm(`确定要为参战角色 ${c.name} 生成立绘头像吗？`);
          }
          if (ok) {
            if (typeof global.showToast === 'function') {
              global.showToast('正在生成角色立绘...');
            }
            try {
              const prompt = c.prompt || `${c.name} TRPG character portrait, detailed fantasy illustration, masterpiece, anime art style`;
              const imgUrl = await window.generatePollinationsImage(prompt, {
                width: 1024,
                height: 1024,
                model: 'flux',
                nologo: true
              });
              if (imgUrl) {
                c.avatar = imgUrl;
                syncCombatantToRealCard(currentChat, c);
                const dbInst = typeof global.db !== 'undefined' ? global.db : global.database;
                if (dbInst) {
                  await dbInst.chats.put(currentChat);
                }
                renderCombatCharacterBar(chatId);
                if (activeMiniCardCombatantId === c.id) {
                  renderCombatCharacterMiniCard(chatId, c.id);
                }
                if (typeof global.showToast === 'function') {
                  global.showToast('立绘生成成功');
                }
              }
            } catch (err) {
              console.error('生图异常', err);
              if (typeof global.showToast === 'function') {
                global.showToast('立绘生成失败');
              }
            }
          }
        }, 500);
      };

      const cancelLongPress = () => {
        clearTimeout(pressTimer);
      };

      avatarBox.addEventListener('mousedown', startLongPress);
      avatarBox.addEventListener('mouseup', cancelLongPress);
      avatarBox.addEventListener('mouseleave', cancelLongPress);
      avatarBox.addEventListener('touchstart', startLongPress, { passive: true });
      avatarBox.addEventListener('touchend', cancelLongPress);
      avatarBox.addEventListener('touchmove', cancelLongPress);

      badge.addEventListener('click', (e) => {
        if (isLongPress) {
          isLongPress = false;
          return;
        }
        e.stopPropagation();
        openCombatCharacterMiniCard(chatId, c.id);
      });

      listContainer.appendChild(badge);
    });
  }

  function openCombatCharacterMiniCard(chatId, combatantId) {
    const currentChat = global.state?.chats?.[chatId];
    if (!currentChat) return;

    const miniCardEl = document.getElementById('combat-character-mini-card');
    if (!miniCardEl) return;

    if (activeMiniCardCombatantId === combatantId && miniCardEl.style.display === 'flex') {
      closeCombatCharacterMiniCard();
      return;
    }

    activeMiniCardCombatantId = combatantId;
    renderCombatCharacterMiniCard(chatId, combatantId);
    miniCardEl.style.display = 'flex';
    positionMiniCardUnderBar();
  }

  function positionMiniCardUnderBar() {
    const miniCardEl = document.getElementById('combat-character-mini-card');
    const charBar = document.getElementById('combat-character-bar');
    if (!miniCardEl) return;

    if (charBar && charBar.style.display !== 'none') {
      const barRect = charBar.getBoundingClientRect();
      const cardWidth = 250;
      let targetLeft = barRect.left + (barRect.width - cardWidth) / 2;
      targetLeft = Math.max(8, Math.min(window.innerWidth - cardWidth - 8, targetLeft));
      const targetTop = barRect.bottom + 6;

      miniCardEl.style.position = 'fixed';
      miniCardEl.style.left = `${targetLeft}px`;
      miniCardEl.style.top = `${targetTop}px`;
      miniCardEl.style.transform = 'none';
      miniCardEl.style.margin = '0';
      miniCardEl.style.zIndex = '110';
    }
  }

  function renderCombatCharacterMiniCard(chatId, combatantId) {
    const currentChat = global.state?.chats?.[chatId];
    if (!currentChat) return;

    const miniCardEl = document.getElementById('combat-character-mini-card');
    if (!miniCardEl) return;

    const combatState = getCombatState(currentChat);
    const c = (combatState.combatants || []).find(item => item.id === combatantId);
    if (!c) {
      closeCombatCharacterMiniCard();
      return;
    }

    const armorVal = parseInt(c.armor, 10) || 0;
    const armorTxt = armorVal > 0 ? ` <span style="font-size: 10px; color: var(--text-secondary);">(${armorVal})</span>` : '';

    let allSkills = [];
    const pushSkill = (item) => {
      if (!item) return;
      if (typeof item === 'string') {
        const trimmed = item.trim();
        if (trimmed && trimmed !== 'undefined' && trimmed !== 'null' && !/^(斗殴|射击|闪避|侦查|聆听|心理学|急救|医学|潜行|说服|话术|恐吓|魅惑|神秘学|克苏鲁神话|历史|领航|骑术|游泳|跳跃|攀爬|投掷|乔装|手艺|艺术|驾驶|锁匠|机械维修|电气维修|重型机械|爆破|计算机|会计|法律|图书馆使用|人类学|考古学|生物学|化学|物理学|地质学|天文学|医学|精神分析|处方|读唇|伪造|密码学)$/i.test(trimmed)) {
          allSkills.push({ name: trimmed, cost: '', effect: '', check: '' });
        }
      } else if (typeof item === 'object') {
        const sName = item.name || item.skill || item.title || '';
        if (!sName || sName === 'undefined' || sName === 'null') return;
        if (/^(斗殴|射击|闪避|侦查|聆听|心理学|急救|医学|潜行|说服|话术|恐吓|魅惑|神秘学|克苏鲁神话|历史|领航|骑术|游泳|跳跃|攀爬|投掷|乔装|手艺|艺术|驾驶|锁匠|机械维修|电气维修|重型机械|爆破|计算机|会计|法律|图书馆使用|人类学|考古学|生物学|化学|物理学|地质学|天文学|医学|精神分析|处方|读唇|伪造|密码学)$/i.test(sName)) {
          return;
        }
        const sCost = item.cost ? `消耗: ${item.cost}` : (item.mp ? `消耗: ${item.mp} MP` : '');
        const sEffect = item.effect || item.desc || item.val || item.value || '';
        const sCheck = item.check || item.checkType || '';
        allSkills.push({ name: sName, cost: sCost, effect: sEffect, check: sCheck });
      }
    };

    if (Array.isArray(c.specialSkills)) {
      c.specialSkills.forEach(pushSkill);
    }
    if (Array.isArray(c.customSkills)) {
      c.customSkills.forEach(pushSkill);
    }

    let skillsListHtml = '';
    if (allSkills.length === 0) {
      skillsListHtml = '<div style="font-size: 10px; color: var(--text-secondary); text-align: center; padding: 4px 0;">无特殊技能</div>';
    } else {
      skillsListHtml = allSkills.map(s => `
        <div style="display: flex; flex-direction: column; gap: 1px; padding: 3px 6px; background: var(--secondary-bg); border-radius: 4px; font-size: 10.5px; border: 1px solid var(--border-color);">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: 600; color: var(--text-primary); font-size: 10.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${s.name}</span>
            ${s.cost ? `<span style="font-weight: 600; color: var(--accent-color); font-size: 9.5px; margin-left: 4px; flex-shrink: 0;">${s.cost}</span>` : ''}
          </div>
          ${(s.effect || s.check) ? `
            <div style="font-size: 9.5px; color: var(--text-secondary); line-height: 1.3; overflow: hidden; text-overflow: ellipsis;">
              ${s.check ? `<span style="color: var(--text-primary); font-weight: 500;">[${s.check}] </span>` : ''}${s.effect}
            </div>
          ` : ''}
        </div>
      `).join('');
    }

    const avatarHtml = c.avatar
      ? `<img src="${c.avatar}" alt="${c.name}">`
      : `<span>${(c.name || '人').substring(0, 1)}</span>`;

    miniCardEl.innerHTML = `
      <div class="combat-mini-header" id="combat-mini-drag-header" title="拖拽移动，双击复位">
        <div class="combat-mini-char-info">
          <div class="combat-mini-avatar">${avatarHtml}</div>
          <span class="combat-mini-name">${c.name}</span>
          <button type="button" class="combat-mini-skill-btn" id="combat-mini-open-skills-btn" title="查看并编辑完整技能面板">技能</button>
        </div>
        <div class="combat-mini-header-actions">
          <button type="button" class="combat-mini-close-btn" id="combat-mini-close-btn" title="关闭" aria-label="关闭">&times;</button>
        </div>
      </div>
      <div class="combat-mini-stats-grid">
        <div class="combat-mini-stat-cell"><span class="label">力量</span><span class="val">${c.str || 50}</span></div>
        <div class="combat-mini-stat-cell"><span class="label">敏捷</span><span class="val">${c.dex || 50}</span></div>
        <div class="combat-mini-stat-cell"><span class="label">体质</span><span class="val">${c.con || 50}</span></div>
        <div class="combat-mini-stat-cell"><span class="label">意志</span><span class="val">${c.pow || 50}</span></div>
        <div class="combat-mini-stat-cell"><span class="label">体型</span><span class="val">${c.siz || 50}</span></div>
        <div class="combat-mini-stat-cell"><span class="label">教育</span><span class="val">${c.edu || 50}</span></div>
        <div class="combat-mini-stat-cell"><span class="label">外貌</span><span class="val">${c.app || 50}</span></div>
        <div class="combat-mini-stat-cell"><span class="label">智力</span><span class="val">${c.int || 50}</span></div>
        <div class="combat-mini-stat-cell"><span class="label">幸运</span><span class="val">${c.luk || 50}</span></div>
      </div>
      <div class="combat-mini-values-grid">
        <div class="combat-mini-value-cell">
          <span class="label">HP</span>
          <span class="val">${c.hp || 10}/${c.maxHp || 10}${armorTxt}</span>
        </div>
        <div class="combat-mini-value-cell">
          <span class="label">MP</span>
          <span class="val">${c.mp || 10}/${c.maxMp || 10}</span>
        </div>
        <div class="combat-mini-value-cell">
          <span class="label">SAN</span>
          <span class="val">${c.san || 50}/${c.maxSan || 99}</span>
        </div>
        <div class="combat-mini-value-cell">
          <span class="label">DB</span>
          <span class="val">${c.db || '0'}</span>
        </div>
      </div>
      <div class="combat-mini-skills-wrap">
        <div class="combat-mini-skills-header" id="combat-mini-skills-toggle-btn" style="display: flex; align-items: center; justify-content: space-between; cursor: pointer; user-select: none;">
          <span style="font-size: 10.5px; font-weight: 600; color: var(--text-primary);">技能</span>
          <svg id="combat-mini-skills-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transition: transform 0.2s ease;">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
        <div class="combat-mini-skills-list" id="combat-mini-skills-list" style="display: none;">${skillsListHtml}</div>
      </div>
    `;

    const openSkillsBtn = miniCardEl.querySelector('#combat-mini-open-skills-btn');
    if (openSkillsBtn) {
      openSkillsBtn.onclick = (e) => {
        e.stopPropagation();
        if (typeof window.openCocSkillsModal === 'function') {
          const wrapper = {
            data: {
              stats: {
                str: c.str || 50, dex: c.dex || 50, con: c.con || 50,
                pow: c.pow || 50, siz: c.siz || 50, edu: c.edu || 50,
                app: c.app || 50, int: c.int || 50, luk: c.luk || 50
              },
              skills: { ...(typeof getDefaultCocData === 'function' ? getDefaultCocData().skills : {}), ...(c.skills || {}) },
              customSkills: Array.isArray(c.customSkills) ? [...c.customSkills] : [],
              calculated: {
                hp: c.hp, maxHp: c.maxHp,
                mp: c.mp, maxMp: c.maxMp,
                san: c.san, maxSan: c.maxSan,
                armor: c.armor || 0,
                db: c.db || '0'
              }
            },
            updateTotalPoints: function() {},
            save: function() {
              c.skills = { ...this.data.skills };
              c.customSkills = [...(this.data.customSkills || [])];
              syncCombatantToRealCard(currentChat, c);
              const dbInst = typeof global.db !== 'undefined' ? global.db : global.database;
              if (dbInst) dbInst.chats.put(currentChat);
              renderCombatCharacterBar(chatId);
            }
          };
          window.openCocSkillsModal(wrapper);
        }
      };
    }

    const closeBtn = miniCardEl.querySelector('#combat-mini-close-btn');
    if (closeBtn) {
      closeBtn.onclick = (e) => {
        e.stopPropagation();
        closeCombatCharacterMiniCard();
      };
    }

    const skillsToggleBtn = miniCardEl.querySelector('#combat-mini-skills-toggle-btn');
    const skillsListEl = miniCardEl.querySelector('#combat-mini-skills-list');
    const skillsArrowEl = miniCardEl.querySelector('#combat-mini-skills-arrow');
    if (skillsToggleBtn && skillsListEl) {
      skillsToggleBtn.onclick = (e) => {
        e.stopPropagation();
        const isHidden = skillsListEl.style.display === 'none';
        skillsListEl.style.display = isHidden ? 'flex' : 'none';
        if (skillsArrowEl) {
          skillsArrowEl.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
        }
      };
    }
  }

  function closeCombatCharacterMiniCard() {
    const miniCardEl = document.getElementById('combat-character-mini-card');
    if (miniCardEl) {
      miniCardEl.style.display = 'none';
    }
    activeMiniCardCombatantId = null;
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
        const isDiceOrSystem = m.roleType === 'dice' || m.roleType === 'system_status' || m.isDice ||
          /dice|骰|kp|守秘人|主持人|旁白|裁判|系统/i.test(m.groupNickname || '') ||
          /dice|骰|kp|守秘人|主持人|旁白|裁判|系统/i.test(m.originalName || '') ||
          /dice|骰|kp|守秘人|主持人|旁白|裁判|系统/i.test(m.name || '');
        if (isDiceOrSystem) return;
        const mName = m.groupNickname || m.originalName;
        const stats = getCharacterStatsForCombat(chat, m.id, mName);
        const armorText = stats.armor > 0 ? ` | 护甲: ${stats.armor}` : '';
        charactersContext.push(`- 群成员角色：${mName} (ID: ${m.id}) | 敏捷: ${stats.dex} | HP: ${stats.hp}/${stats.maxHp}${armorText} | MP: ${stats.mp}/${stats.maxMp}`);
      });
    } else if (!chat.isGroup) {
      const aiName = chat.settings?.remarkName || chat.name || 'NPC';
      const stats = getCharacterStatsForCombat(chat, chat.id, aiName);
      const armorText = stats.armor > 0 ? ` | 护甲: ${stats.armor}` : '';
      charactersContext.push(`- 当前NPC：${aiName} | 敏捷: ${stats.dex} | HP: ${stats.hp}/${stats.maxHp}${armorText} | MP: ${stats.mp}/${stats.maxMp}`);
    }

    const combatRules = getCombatState(chat).rulebook || DEFAULT_COMBAT_RULES_TEXT;
    const prompt = `你是一个跑团TRPG战斗裁判与系统。请分析当前模组、剧情对话上下文、已知角色卡与战斗规则，裁定本次战斗的全部参战者名单（包括玩家、直接参战的调查员同伴、敌对怪物或敌对NPC）。

【最高规则与禁令】：
1. 绝对严禁将KP、守秘人、主持人、旁白、裁判、骰娘、骰子机器人列入参战名单！
2. 必须由你根据当前剧情对话上下文严格判断【当前究竟有谁在战斗】。不在现场或没有直接拔刀参战的普通群成员不得加入。
3. 如果剧情中出现了敌对怪物、恶魔、敌人、强盗或NPC对手，请在JSON中创建敌对条目（isEnemy: true），并为其生成设定敏捷dex、HP、MP、护甲armor，以及外貌+动作+战斗氛围的英文生图提示词 prompt。
4. 参战者必须按敏捷从高到低排列。

【战斗系统·技能（主动招式/特殊能力/法术）严正定义】：
1. 技能【绝对不是】COC基础职业技能（禁止把斗殴、射击、闪避、侦查、聆听等基础检定技能填进技能区）！
2. 技能是角色在战斗中【主动释放的特殊招式/特殊能力/专属法术】（如“冰霜吐息”、“召唤触手”、“血月斩”、“傀儡操线”等）。
3. 普通角色没有技能时，specialSkills 数组必须为空 []！只有设定上有特殊能力/招式的角色（如Boss、超自然NPC、或者在模组与剧情上下文中获得专属特殊能力的角色）才有技能。
4. 技能格式：name（技能名）、cost（消耗MP，如"5 MP"）、effect（效果简述，如"造成 2D6 伤害"）、check（检定方式，如"意志检定"或"无需检定"）。

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
      "specialSkills": [],
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
      "specialSkills": [
        {
          "name": "特殊招式名称",
          "cost": "3 MP",
          "effect": "造成 1D6 伤害",
          "check": "意志检定"
        }
      ],
      "isEnemy": true,
      "isUser": false,
      "prompt": "1024x1024 detailed fantasy TRPG monster portrait, sharp focus"
    }
  ]
}

要求：
1. 参战者必须包含当前直接参与战斗的角色；
2. 如果是已知玩家或群成员，请保留其原属性；如果是新出现的敌人、怪兽或NPC，请根据其强弱合理设定敏捷dex、HP、MP、护甲armor，并填写一段专业的英文画图提示词 prompt；
3. 无特殊能力角色的 specialSkills 必须为空数组 []；
4. 绝对禁止加入KP、骰娘或无关旁观者；
5. 只能返回合法的 JSON。`;

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
        let customSkills = item.specialSkills || item.customSkills || [];
        let armor = parseInt(item.armor, 10) || 0;

        if (item.isUser || item.id === 'user') {
          const stats = getCharacterStatsForCombat(currentChat, 'user', item.name);
          avatar = stats.avatar;
          str = stats.str; con = stats.con; pow = stats.pow; siz = stats.siz;
          edu = stats.edu; app = stats.app; int = stats.int; luk = stats.luk;
          if (!customSkills || customSkills.length === 0) customSkills = stats.customSkills || [];
          if (stats.armor > 0 && !armor) armor = stats.armor;
        } else if (currentChat.isGroup && Array.isArray(currentChat.members)) {
          const m = currentChat.members.find(mem => mem.id === item.id || mem.groupNickname === item.name || mem.originalName === item.name);
          if (m) {
            const stats = getCharacterStatsForCombat(currentChat, m.id, item.name);
            avatar = m.avatar || '';
            str = stats.str; con = stats.con; pow = stats.pow; siz = stats.siz;
            edu = stats.edu; app = stats.app; int = stats.int; luk = stats.luk;
            if (!customSkills || customSkills.length === 0) customSkills = stats.customSkills || [];
            if (stats.armor > 0 && !armor) armor = stats.armor;
          }
        } else if (!currentChat.isGroup && (item.id === currentChat.id || item.name === currentChat.name)) {
          const stats = getCharacterStatsForCombat(currentChat, currentChat.id, item.name);
          avatar = currentChat.avatar || '';
          str = stats.str; con = stats.con; pow = stats.pow; siz = stats.siz;
          edu = stats.edu; app = stats.app; int = stats.int; luk = stats.luk;
          if (!customSkills || customSkills.length === 0) customSkills = stats.customSkills || [];
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
          specialSkills: customSkills,
          customSkills: customSkills,
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
        const nonKpMembers = currentChat.members.filter(m => {
          return !(m.roleType === 'dice' || m.roleType === 'system_status' || m.isDice ||
            /dice|骰|kp|守秘人|主持人|旁白|裁判|系统/i.test(m.groupNickname || '') ||
            /dice|骰|kp|守秘人|主持人|旁白|裁判|系统/i.test(m.originalName || '') ||
            /dice|骰|kp|守秘人|主持人|旁白|裁判|系统/i.test(m.name || ''));
        });
        if (nonKpMembers.length > 0) {
          const activeMember = nonKpMembers[0];
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

    hideCombatDropdownPanel();
    updateCombatUI(currentChat.id);

    // 逐一生图
    generateCombatantPortraitsSequentially(currentChat.id);

    if (typeof global.showToast === 'function') {
      global.showToast('已进入战斗状态');
    }
  }

  async function generateCombatantPortraitsSequentially(chatId) {
    const currentChat = global.state?.chats?.[chatId];
    if (!currentChat) return;
    const combatState = getCombatState(currentChat);
    if (!combatState || !Array.isArray(combatState.combatants)) return;

    // 获取用户在设置中配置的 NovelAI 画师串与正面提示词
    let naiArtist = '';
    let naiPositive = '';
    if (typeof global.getCharacterNAIPrompts === 'function') {
      try {
        const naiPrompts = global.getCharacterNAIPrompts(chatId);
        if (naiPrompts) {
          naiArtist = naiPrompts.artist || '';
          naiPositive = naiPrompts.positive || '';
        }
      } catch (e) {}
    }
    if (!naiArtist || !naiPositive) {
      const domArtist = document.getElementById('nai-default-artist')?.value?.trim();
      const domPos = document.getElementById('nai-default-positive')?.value?.trim();
      if (domArtist && !naiArtist) naiArtist = domArtist;
      if (domPos && !naiPositive) naiPositive = domPos;
    }

    for (const c of combatState.combatants) {
      if (!c.avatar || c.isEnemy || c.prompt) {
        try {
          const rawPrompt = c.prompt || `${c.name}, TRPG character portrait in battle, action pose, dynamic lighting, masterpiece fantasy anime illustration, sharp focus, high quality`;
          
          const promptParts = [];
          if (naiArtist && !rawPrompt.includes(naiArtist)) promptParts.push(naiArtist);
          if (naiPositive && !rawPrompt.includes(naiPositive)) promptParts.push(naiPositive);
          if (rawPrompt) promptParts.push(rawPrompt);
          const finalPrompt = promptParts.join(', ');

          let imgUrl = null;

          // 优先尝试使用用户配置的 NovelAI 生图
          const hasNaiKey = !!(localStorage.getItem('novelai-api-key') || document.getElementById('novelai-api-key')?.value?.trim());
          if (hasNaiKey && typeof window.callNovelAiDirect === 'function') {
            try {
              imgUrl = await window.callNovelAiDirect(finalPrompt, { resolution: '1024x1024' });
            } catch (naiErr) {
              console.warn('NovelAI 生图失败，切换备用生图:', naiErr);
            }
          }

          // 若未配置 NovelAI 或生图失败，调用 Pollinations 备用
          if (!imgUrl && typeof window.generatePollinationsImage === 'function') {
            imgUrl = await window.generatePollinationsImage(finalPrompt, {
              width: 1024,
              height: 1024,
              model: 'flux',
              nologo: true
            });
          }

          if (imgUrl) {
            c.avatar = imgUrl;
            syncCombatantToRealCard(currentChat, c);
            const dbInst = typeof global.db !== 'undefined' ? global.db : global.database;
            if (dbInst) {
              await dbInst.chats.put(currentChat);
            }
            renderCombatCharacterBar(chatId);
            if (activeMiniCardCombatantId === c.id) {
              renderCombatCharacterMiniCard(chatId, c.id);
            }
          }
        } catch (e) {
          console.warn('逐一生图异常:', e);
        }
      }
    }
  }

  async function triggerCombatConfirmation(chatId) {
    const activeChatId = chatId || global.state?.activeChatId;
    const currentChat = global.state?.chats?.[activeChatId];
    if (!currentChat) return;
    hideCombatDropdownPanel();

    const confirmMsg = {
      id: "msg_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
      role: "system",
      type: "combat_confirm_card",
      content: "是否进入战斗？",
      timestamp: Date.now()
    };
    currentChat.history = currentChat.history || [];
    currentChat.history.push(confirmMsg);

    const dbInst = typeof global.db !== 'undefined' ? global.db : global.database;
    if (dbInst) {
      await dbInst.chats.put(currentChat);
    }
    if (typeof global.appendMessage === 'function') {
      global.appendMessage(confirmMsg, currentChat);
    }
  }

  async function triggerCombatExitConfirmation(chatId) {
    const activeChatId = chatId || global.state?.activeChatId;
    const currentChat = global.state?.chats?.[activeChatId];
    if (!currentChat) return;
    hideCombatDropdownPanel();

    const exitMsg = {
      id: "msg_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
      role: "system",
      type: "combat_exit_confirm_card",
      content: "是否退出战斗？",
      timestamp: Date.now()
    };
    currentChat.history = currentChat.history || [];
    currentChat.history.push(exitMsg);

    const dbInst = typeof global.db !== 'undefined' ? global.db : global.database;
    if (dbInst) {
      await dbInst.chats.put(currentChat);
    }
    if (typeof global.appendMessage === 'function') {
      global.appendMessage(exitMsg, currentChat);
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

    hideCombatDropdownPanel();
    closeCombatCharacterMiniCard();
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
  let expandedEditingIndex = null;

  function openCombatEditModal(chatId, targetCombatantId = null) {
    const currentChat = global.state?.chats?.[chatId];
    if (!currentChat) return;

    hideCombatDropdownPanel();
    closeCombatCharacterMiniCard();
    const combatState = getCombatState(currentChat);
    currentEditingCombatants = JSON.parse(JSON.stringify(combatState.combatants || []));
    expandedEditingIndex = null;

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
      const card = document.createElement('div');
      card.style.display = 'flex';
      card.style.flexDirection = 'column';
      card.style.background = 'var(--secondary-bg)';
      card.style.borderRadius = '8px';
      card.style.padding = '6px 8px';
      card.style.gap = '6px';
      card.style.border = '1px solid var(--border-color)';

      const headerRow = document.createElement('div');
      headerRow.style.display = 'flex';
      headerRow.style.alignItems = 'center';
      headerRow.style.justifyContent = 'space-between';
      headerRow.style.gap = '6px';

      const left = document.createElement('div');
      left.style.display = 'flex';
      left.style.alignItems = 'center';
      left.style.gap = '6px';
      left.style.flex = '1';
      left.style.overflow = 'hidden';

      const avatarBox = document.createElement('div');
      avatarBox.style.width = '24px';
      avatarBox.style.height = '24px';
      avatarBox.style.borderRadius = '50%';
      avatarBox.style.overflow = 'hidden';
      avatarBox.style.flexShrink = '0';
      avatarBox.style.background = 'var(--card-bg)';
      avatarBox.style.display = 'flex';
      avatarBox.style.alignItems = 'center';
      avatarBox.style.justifyContent = 'center';
      avatarBox.style.border = '1px solid var(--border-color)';

      if (c.avatar) {
        const img = document.createElement('img');
        img.src = c.avatar;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        avatarBox.appendChild(img);
      } else {
        avatarBox.textContent = (c.name || '人').substring(0, 1);
        avatarBox.style.fontSize = '10px';
        avatarBox.style.fontWeight = '600';
      }
      left.appendChild(avatarBox);

      const armorStr = (c.armor && c.armor > 0) ? ` | 护甲: ${c.armor}` : '';
      const info = document.createElement('div');
      info.style.flex = '1';
      info.style.overflow = 'hidden';
      info.innerHTML = `<div style="font-weight: 600; font-size: 11px; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${c.name}</div>
        <div style="font-size: 10px; color: var(--text-secondary);">敏捷: ${c.dex} | HP: ${c.hp}/${c.maxHp}${armorStr} | MP: ${c.mp}/${c.maxMp}</div>`;
      left.appendChild(info);

      const right = document.createElement('div');
      right.style.display = 'flex';
      right.style.alignItems = 'center';
      right.style.gap = '3px';

      if (idx > 0) {
        const upBtn = document.createElement('button');
        upBtn.type = 'button';
        upBtn.className = 'moe-btn-mini';
        upBtn.textContent = '↑';
        upBtn.title = '前移行动顺序';
        upBtn.style.padding = '1px 5px';
        upBtn.onclick = () => {
          const temp = currentEditingCombatants[idx];
          currentEditingCombatants[idx] = currentEditingCombatants[idx - 1];
          currentEditingCombatants[idx - 1] = temp;
          renderEditingCombatantsList();
        };
        right.appendChild(upBtn);
      }

      if (idx < currentEditingCombatants.length - 1) {
        const downBtn = document.createElement('button');
        downBtn.type = 'button';
        downBtn.className = 'moe-btn-mini';
        downBtn.textContent = '↓';
        downBtn.title = '后移行动顺序';
        downBtn.style.padding = '1px 5px';
        downBtn.onclick = () => {
          const temp = currentEditingCombatants[idx];
          currentEditingCombatants[idx] = currentEditingCombatants[idx + 1];
          currentEditingCombatants[idx + 1] = temp;
          renderEditingCombatantsList();
        };
        right.appendChild(downBtn);
      }

      const expandBtn = document.createElement('button');
      expandBtn.type = 'button';
      expandBtn.className = 'moe-btn-mini';
      expandBtn.textContent = expandedEditingIndex === idx ? '收起' : '数值';
      expandBtn.style.padding = '1px 6px';
      expandBtn.onclick = () => {
        expandedEditingIndex = expandedEditingIndex === idx ? null : idx;
        renderEditingCombatantsList();
      };
      right.appendChild(expandBtn);

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'moe-btn-mini';
      delBtn.textContent = '移除';
      delBtn.style.color = '#ff4d4f';
      delBtn.style.padding = '1px 6px';
      delBtn.onclick = () => {
        currentEditingCombatants.splice(idx, 1);
        if (expandedEditingIndex === idx) expandedEditingIndex = null;
        renderEditingCombatantsList();
      };
      right.appendChild(delBtn);

      headerRow.appendChild(left);
      headerRow.appendChild(right);
      card.appendChild(headerRow);

      if (expandedEditingIndex === idx) {
        const detailForm = document.createElement('div');
        detailForm.style.display = 'flex';
        detailForm.style.flexDirection = 'column';
        detailForm.style.gap = '6px';
        detailForm.style.paddingTop = '6px';
        detailForm.style.borderTop = '1px dashed var(--border-color)';

        detailForm.innerHTML = `
          <div style="font-size: 10px; font-weight: 600; color: var(--text-primary);">属性设置</div>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px;">
            <div class="coc-stat-item" style="display: flex; align-items: center; background: var(--card-bg); border-radius: 4px; padding: 2px 4px; gap: 2px; border: 1px solid var(--border-color);"><label style="font-size: 9px; color: var(--text-secondary); width: 22px; flex-shrink: 0; text-align: center;">力量</label><input type="number" data-stat="str" class="moe-input" value="${c.str || 50}" style="height: 18px; font-size: 10px; padding: 0; text-align: center; border: none; background: transparent; width: 100%;"></div>
            <div class="coc-stat-item" style="display: flex; align-items: center; background: var(--card-bg); border-radius: 4px; padding: 2px 4px; gap: 2px; border: 1px solid var(--border-color);"><label style="font-size: 9px; color: var(--text-secondary); width: 22px; flex-shrink: 0; text-align: center;">敏捷</label><input type="number" data-stat="dex" class="moe-input" value="${c.dex || 50}" style="height: 18px; font-size: 10px; padding: 0; text-align: center; border: none; background: transparent; width: 100%;"></div>
            <div class="coc-stat-item" style="display: flex; align-items: center; background: var(--card-bg); border-radius: 4px; padding: 2px 4px; gap: 2px; border: 1px solid var(--border-color);"><label style="font-size: 9px; color: var(--text-secondary); width: 22px; flex-shrink: 0; text-align: center;">体质</label><input type="number" data-stat="con" class="moe-input" value="${c.con || 50}" style="height: 18px; font-size: 10px; padding: 0; text-align: center; border: none; background: transparent; width: 100%;"></div>
            <div class="coc-stat-item" style="display: flex; align-items: center; background: var(--card-bg); border-radius: 4px; padding: 2px 4px; gap: 2px; border: 1px solid var(--border-color);"><label style="font-size: 9px; color: var(--text-secondary); width: 22px; flex-shrink: 0; text-align: center;">意志</label><input type="number" data-stat="pow" class="moe-input" value="${c.pow || 50}" style="height: 18px; font-size: 10px; padding: 0; text-align: center; border: none; background: transparent; width: 100%;"></div>
            <div class="coc-stat-item" style="display: flex; align-items: center; background: var(--card-bg); border-radius: 4px; padding: 2px 4px; gap: 2px; border: 1px solid var(--border-color);"><label style="font-size: 9px; color: var(--text-secondary); width: 22px; flex-shrink: 0; text-align: center;">体型</label><input type="number" data-stat="siz" class="moe-input" value="${c.siz || 50}" style="height: 18px; font-size: 10px; padding: 0; text-align: center; border: none; background: transparent; width: 100%;"></div>
            <div class="coc-stat-item" style="display: flex; align-items: center; background: var(--card-bg); border-radius: 4px; padding: 2px 4px; gap: 2px; border: 1px solid var(--border-color);"><label style="font-size: 9px; color: var(--text-secondary); width: 22px; flex-shrink: 0; text-align: center;">教育</label><input type="number" data-stat="edu" class="moe-input" value="${c.edu || 50}" style="height: 18px; font-size: 10px; padding: 0; text-align: center; border: none; background: transparent; width: 100%;"></div>
            <div class="coc-stat-item" style="display: flex; align-items: center; background: var(--card-bg); border-radius: 4px; padding: 2px 4px; gap: 2px; border: 1px solid var(--border-color);"><label style="font-size: 9px; color: var(--text-secondary); width: 22px; flex-shrink: 0; text-align: center;">外貌</label><input type="number" data-stat="app" class="moe-input" value="${c.app || 50}" style="height: 18px; font-size: 10px; padding: 0; text-align: center; border: none; background: transparent; width: 100%;"></div>
            <div class="coc-stat-item" style="display: flex; align-items: center; background: var(--card-bg); border-radius: 4px; padding: 2px 4px; gap: 2px; border: 1px solid var(--border-color);"><label style="font-size: 9px; color: var(--text-secondary); width: 22px; flex-shrink: 0; text-align: center;">智力</label><input type="number" data-stat="int" class="moe-input" value="${c.int || 50}" style="height: 18px; font-size: 10px; padding: 0; text-align: center; border: none; background: transparent; width: 100%;"></div>
            <div class="coc-stat-item" style="display: flex; align-items: center; background: var(--card-bg); border-radius: 4px; padding: 2px 4px; gap: 2px; border: 1px solid var(--border-color);"><label style="font-size: 9px; color: var(--text-secondary); width: 22px; flex-shrink: 0; text-align: center;">幸运</label><input type="number" data-stat="luk" class="moe-input" value="${c.luk || 50}" style="height: 18px; font-size: 10px; padding: 0; text-align: center; border: none; background: transparent; width: 100%;"></div>
          </div>
          <div style="font-size: 10px; font-weight: 600; color: var(--text-primary); margin-top: 2px;">实时生命与护甲</div>
          <div style="display: flex; gap: 4px;">
            <div style="flex: 1; display: flex; align-items: center; background: var(--card-bg); padding: 2px 4px; border-radius: 4px; border: 1px solid var(--border-color);">
              <span style="font-size: 9px; color: var(--text-secondary); width: 22px;">HP</span>
              <input type="number" data-val="hp" class="moe-input" value="${c.hp || 10}" style="width: 32px; height: 18px; font-size: 10px; text-align: center; padding: 0; border: none;">
              <span style="font-size: 9px; color: var(--text-secondary);">/</span>
              <input type="number" data-val="maxHp" class="moe-input" value="${c.maxHp || 10}" style="width: 32px; height: 18px; font-size: 10px; text-align: center; padding: 0; border: none;">
            </div>
            <div style="flex: 1; display: flex; align-items: center; background: var(--card-bg); padding: 2px 4px; border-radius: 4px; border: 1px solid var(--border-color);">
              <span style="font-size: 9px; color: var(--text-secondary); width: 22px;">MP</span>
              <input type="number" data-val="mp" class="moe-input" value="${c.mp || 10}" style="width: 32px; height: 18px; font-size: 10px; text-align: center; padding: 0; border: none;">
              <span style="font-size: 9px; color: var(--text-secondary);">/</span>
              <input type="number" data-val="maxMp" class="moe-input" value="${c.maxMp || 10}" style="width: 32px; height: 18px; font-size: 10px; text-align: center; padding: 0; border: none;">
            </div>
          </div>
          <div style="display: flex; gap: 4px;">
            <div style="flex: 1; display: flex; align-items: center; background: var(--card-bg); padding: 2px 4px; border-radius: 4px; border: 1px solid var(--border-color);">
              <span style="font-size: 9px; color: var(--text-secondary); width: 26px;">护甲</span>
              <input type="number" data-val="armor" class="moe-input" value="${c.armor || 0}" style="flex: 1; height: 18px; font-size: 10px; text-align: center; padding: 0; border: none;">
            </div>
            <div style="flex: 1; display: flex; align-items: center; background: var(--card-bg); padding: 2px 4px; border-radius: 4px; border: 1px solid var(--border-color);">
              <span style="font-size: 9px; color: var(--text-secondary); width: 26px;">SAN</span>
              <input type="number" data-val="san" class="moe-input" value="${c.san || 50}" style="flex: 1; height: 18px; font-size: 10px; text-align: center; padding: 0; border: none;">
            </div>
          </div>
        `;

        detailForm.querySelectorAll('input[data-stat]').forEach(inp => {
          inp.oninput = () => {
            const st = inp.dataset.stat;
            c[st] = parseInt(inp.value, 10) || 0;
          };
        });

        detailForm.querySelectorAll('input[data-val]').forEach(inp => {
          inp.oninput = () => {
            const k = inp.dataset.val;
            c[k] = parseInt(inp.value, 10) || 0;
          };
        });

        card.appendChild(detailForm);
      }

      listContainer.appendChild(card);
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
    combatState.combatants = currentEditingCombatants;
    combatState.order = combatState.combatants.map(c => c.id);

    combatState.combatants.forEach(c => {
      syncCombatantToRealCard(currentChat, c);
    });

    const dbInstance = typeof global.db !== 'undefined' ? global.db : global.database;
    if (dbInstance) {
      await dbInstance.chats.put(currentChat);
    }

    closeCombatEditModal();
    updateCombatUI(activeChatId);
    if (activeMiniCardCombatantId) {
      renderCombatCharacterMiniCard(activeChatId, activeMiniCardCombatantId);
    }
    if (typeof global.showToast === 'function') {
      global.showToast('战斗设置已保存');
    }
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
      if (activeMiniCardCombatantId === target.id) {
        renderCombatCharacterMiniCard(chat.id, target.id);
      }
    }
  }

  function getCombatPromptBlock(chatOrId) {
    let currentChat = chatOrId;
    if (typeof chatOrId === 'string') {
      currentChat = global.state?.chats?.[chatOrId];
    }
    if (!currentChat || !currentChat.isGroup) return '';

    const combatState = getCombatState(currentChat);
    if (!combatState || !combatState.active) return '';

    const combatants = sortCombatantsByDex(combatState.combatants);
    if (!combatants || combatants.length === 0) return '';

    const combatantLines = combatants.map((c, idx) => {
      const armorTxt = (c.armor && c.armor > 0) ? `，护甲:${c.armor}` : '';
      const sList = (Array.isArray(c.specialSkills) && c.specialSkills.length > 0)
        ? c.specialSkills
        : ((Array.isArray(c.customSkills) && c.customSkills.length > 0) ? c.customSkills : []);
      const skillsTxt = (sList.length > 0)
        ? `，战斗特殊技能:[${sList.map(s => typeof s === 'string' ? s : `${s.name}${s.cost ? `(${s.cost})` : ''}${s.effect ? `[${s.effect}]` : ''}`).join(', ')}]`
        : '，无特殊技能';
      return `${idx + 1}. 参战者全名【${c.name}】：敏捷 ${c.dex}，当前HP ${c.hp}/${c.maxHp}，当前MP ${c.mp}/${c.maxMp}，当前SAN ${c.san}/${c.maxSan}${armorTxt}${skillsTxt}`;
    }).join('\n');

    const orderNames = combatants.map(c => c.name).join(' -> ');

    // 2. 战斗对抗与闪避铁律
    // 远程攻击（手枪、步枪等）：攻击方发起检定后，防守方只要可见并能行动，必须先进行闪避检定（.ra 防守方 闪避），AI绝不可跳过防守方闪避检定直接判定击中。双方通过成功等级比大小判定是否命中。
    // 近战攻击（斗殴等）：攻击方发起检定后，防守方选择闪避（.ra 防守方 闪避）或反击（.ra 防守方 斗殴）对抗比大小。
    // 判定命中后由骰子投掷伤害，并发送扣血指令。

    const isCoc6 = /第六版|coc\s*6|coc6|6th/i.test(combatState.rulebook || DEFAULT_COMBAT_RULES_TEXT);

    const defenseRuleText = isCoc6
      ? `【重要法则：当前为 COC 第六版规则】\nCOC 第六版规则中【绝对没有反击，绝对没有格挡，只有闪避】！\n- 无论是远程射击还是近战斗殴，防守方在受到攻击时【唯一允许的防御检定就是闪避】（.ra 防守方 闪避）！严禁发起反击检定或格挡检定！\n- 流程：攻击方投掷命中检定（.ra 攻击方 斗殴 或 射击），若命中，防守方投掷闪避（.ra 防守方 闪避）。闪避成功则无伤，闪避失败则由骰子投掷伤害。`
      : `【战斗对抗流程】\n- 远程射击：防守方进行闪避检定（.ra 防守方 闪避）。\n- 近战攻击：防守方可选择闪避（.ra 防守方 闪避）或反击（.ra 防守方 斗殴）。`;

    return `\n\n# 【最高优先级：当前正处于COC跑团战斗模式】
你处于【战斗模式】。以下战斗强制条款与行动轮流转规则必须无条件严格执行：

一、战斗对抗流程铁律【绝不可跳过检定】
${defenseRuleText}
- 严禁在防守方检定出结果前直接口头判定击中或结算扣血！数值与判定全部由骰子完成，严禁 AI 在剧情中私自口头决定命中与扣血数值。

二、参战人员动态增减机制
- 战斗中若有新角色加入战场，在回复末尾附带：[参战: 角色名, HP: 12, DEX: 60]（若是群成员直接写 [参战: 角色名]，系统会自动提取面板；若是未在群的新NPC/怪物，请写明数值）。
- 若有角色撤退或逃离，在回复末尾附带：[撤退: 角色名]。

三、当前先攻行动顺序与全部参战人员名单
- **行动轮次顺序（按敏捷从高到低）**：
${orderNames}
- **参战者完整名单与实时数值**：
${combatantLines}

四、角色全名与战斗指令规范
- **必须使用完整全名**：在回复中发送指令时，目标名字【必须使用上述参战人员名单中的完整全名】（例如：.st 全息投影甲 hp 13 敏捷 50，或 .ra 全息投影甲 斗殴）。
- **指令格式**：
  * 修改属性/生命：.st 参战者全名 hp 13 敏捷 50，或 .hp 参战者全名 -5，.mp 参战者全名 -3。
  * 技能或命中检定：.ra 参战者全名 技能名（例如：.ra 全息投影甲 斗殴，.ra 张三 闪避）。
  * 投掷伤害：.r 参战者全名 1d6 或 .r 1d100。

五、战斗法则条文
${combatState.rulebook || DEFAULT_COMBAT_RULES_TEXT}

六、战斗“技能”（主动招式/特殊能力/法术）执行规范
1. 技能是角色在战斗中主动释放的特殊能力（如冰霜吐息、血月斩等），不是基础职业技能。
2. 释放流程：先扣除消耗的 MP（.mp 参战者全名 -5），若需检定则进行对应检定（.ra 参战者全名 意志），成功后投掷效果数值并登记扣血。
`;
  }

  function getCombatSystemPrompt(chatId) {
    return getCombatPromptBlock(chatId);
  }

  function handleDynamicCombatantsFromAi(chat, rawContent) {
    if (!chat || !rawContent || typeof rawContent !== 'string') return;
    const combatState = getCombatState(chat);
    if (!combatState || !combatState.active) return;

    let changed = false;

    const joinRegex = /\[(?:参战|加入战斗|新增参战)[:：]\s*([^,，\]\n]+)(?:[,，\s]*HP[:：]\s*(\d+))?(?:[,，\s]*DEX[:：]\s*(\d+))?(?:[,，\s]*STR[:：]\s*(\d+))?(?:[,，\s]*CON[:：]\s*(\d+))?(?:[,，\s]*POW[:：]\s*(\d+))?[^\]]*\]/gi;
    let jm;
    while ((jm = joinRegex.exec(rawContent)) !== null) {
      const rawName = jm[1].trim();
      if (!rawName) continue;
      const exists = combatState.combatants.find(c => c.name === rawName || c.id === rawName);
      if (!exists) {
        let stats = null;
        if (chat.isGroup && Array.isArray(chat.members)) {
          const mem = chat.members.find(m => m.groupNickname === rawName || m.originalName === rawName || m.id === rawName);
          if (mem) {
            stats = getCharacterStatsForCombat(chat, mem.id, rawName);
          }
        }
        if (!stats) {
          stats = {
            dex: parseInt(jm[3], 10) || 50,
            str: parseInt(jm[4], 10) || 50,
            con: parseInt(jm[5], 10) || 50,
            pow: parseInt(jm[6], 10) || 50,
            siz: 50, edu: 50, app: 50, int: 50, luk: 50,
            hp: parseInt(jm[2], 10) || 10,
            maxHp: parseInt(jm[2], 10) || 10,
            mp: 10, maxMp: 10, san: 50, maxSan: 50, armor: 0, db: '0',
            avatar: '', customSkills: [], skills: { ...(typeof global.getDefaultCocData === 'function' ? global.getDefaultCocData().skills : {}) },
            cocPanel: null
          };
        }
        combatState.combatants.push({
          id: 'combatant_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          name: rawName,
          isUser: false,
          ...stats
        });
        changed = true;
      }
    }

    const leaveRegex = /\[(?:撤退|脱离战斗|移除参战)[:：]\s*([^,，\]\n]+)\]/gi;
    let lm;
    while ((lm = leaveRegex.exec(rawContent)) !== null) {
      const rawName = lm[1].trim();
      if (!rawName) continue;
      const idx = combatState.combatants.findIndex(c => c.name === rawName || c.id === rawName);
      if (idx !== -1) {
        combatState.combatants.splice(idx, 1);
        changed = true;
      }
    }

    if (changed) {
      const dbInst = typeof global.db !== 'undefined' ? global.db : global.database;
      if (dbInst) dbInst.chats.put(chat);
      renderCombatCharacterBar(chat.id);
    }
  }

  function initCombatEngine() {
    const toggleBtn = document.getElementById('combat-toggle-btn');
    if (toggleBtn) {
      toggleBtn.onclick = (e) => {
        e.stopPropagation();
        const activeChatId = global.state?.activeChatId;
        const currentChat = global.state?.chats?.[activeChatId];
        if (!currentChat) return;
        const combatState = getCombatState(currentChat);
        if (combatState.active) {
          triggerCombatExitConfirmation(activeChatId);
        } else {
          triggerCombatConfirmation(activeChatId);
        }
      };
    }

    const editBtn = document.getElementById('combat-edit-btn');
    if (editBtn) {
      editBtn.onclick = (e) => {
        e.stopPropagation();
        openCombatEditModal(global.state?.activeChatId);
      };
    }

    const rulesBtn = document.getElementById('combat-rules-btn');
    if (rulesBtn) {
      rulesBtn.onclick = (e) => {
        e.stopPropagation();
        openCombatRulesModal(global.state?.activeChatId);
      };
    }

    const entryBtn = document.getElementById('combat-entry-btn');
    if (entryBtn) {
      entryBtn.onclick = (e) => {
        e.stopPropagation();
        toggleCombatDropdownPanel();
      };
    }

    const rulesCloseBtn = document.getElementById('combat-rules-close-btn');
    if (rulesCloseBtn) rulesCloseBtn.onclick = closeCombatRulesModal;

    const rulesCancelBtn = document.getElementById('combat-rules-cancel-btn');
    if (rulesCancelBtn) rulesCancelBtn.onclick = closeCombatRulesModal;

    const rulesSaveBtn = document.getElementById('combat-rules-save-btn');
    if (rulesSaveBtn) rulesSaveBtn.onclick = saveCombatRules;

    const rulesResetBtn = document.getElementById('combat-rules-reset-btn');
    if (rulesResetBtn) rulesResetBtn.onclick = resetCombatRules;

    const editCloseBtn = document.getElementById('combat-edit-close-btn');
    if (editCloseBtn) editCloseBtn.onclick = closeCombatEditModal;

    const editCancelBtn = document.getElementById('combat-edit-cancel-btn');
    if (editCancelBtn) editCancelBtn.onclick = closeCombatEditModal;

    const editSaveBtn = document.getElementById('combat-edit-save-btn');
    if (editSaveBtn) editSaveBtn.onclick = saveCombatEditModal;

    const charBar = document.getElementById('combat-character-bar');
    const dragHandle = document.getElementById('combat-bar-drag-handle');
    const collapseBtn = document.getElementById('combat-bar-collapse-btn');
    const arrowIcon = document.getElementById('combat-bar-arrow-icon');

    if (collapseBtn && charBar) {
      collapseBtn.onclick = (e) => {
        e.stopPropagation();
        charBar.classList.toggle('collapsed');
        const isCollapsed = charBar.classList.contains('collapsed');
        if (arrowIcon) {
          arrowIcon.innerHTML = isCollapsed
            ? '<polyline points="9 18 15 12 9 6"></polyline>'
            : '<polyline points="15 18 9 12 15 6"></polyline>';
        }
      };
    }

    if (dragHandle && charBar) {
      let isDragging = false;
      let startX = 0;
      let startY = 0;
      let initialLeft = 0;
      let initialTop = 0;
      let lastTapTime = 0;

      const onStartDrag = (clientX, clientY) => {
        const rect = charBar.getBoundingClientRect();
        isDragging = true;
        startX = clientX;
        startY = clientY;
        initialLeft = rect.left;
        initialTop = rect.top;
        charBar.style.position = 'fixed';
        charBar.style.margin = '0';
        charBar.style.left = `${initialLeft}px`;
        charBar.style.top = `${initialTop}px`;
        charBar.style.zIndex = '100';
      };

      const onMoveDrag = (clientX, clientY) => {
        if (!isDragging) return;
        const dx = clientX - startX;
        const dy = clientY - startY;
        charBar.style.left = `${Math.max(0, Math.min(window.innerWidth - 40, initialLeft + dx))}px`;
        charBar.style.top = `${Math.max(0, Math.min(window.innerHeight - 40, initialTop + dy))}px`;
      };

      const onEndDrag = () => {
        isDragging = false;
      };

      const resetBarPosition = () => {
        charBar.style.position = '';
        charBar.style.margin = '2px auto 4px auto';
        charBar.style.left = '';
        charBar.style.top = '';
        charBar.style.zIndex = '';
      };

      dragHandle.addEventListener('mousedown', (e) => {
        if (e.target.closest('#combat-bar-collapse-btn')) return;
        onStartDrag(e.clientX, e.clientY);
        e.preventDefault();
      });

      document.addEventListener('mousemove', (e) => {
        if (isDragging) onMoveDrag(e.clientX, e.clientY);
      });

      document.addEventListener('mouseup', onEndDrag);

      dragHandle.addEventListener('touchstart', (e) => {
        if (e.target.closest('#combat-bar-collapse-btn')) return;
        const touch = e.touches[0];
        if (touch) {
          const now = Date.now();
          if (now - lastTapTime < 350) {
            resetBarPosition();
            lastTapTime = 0;
            return;
          }
          lastTapTime = now;
          onStartDrag(touch.clientX, touch.clientY);
        }
      }, { passive: false });

      document.addEventListener('touchmove', (e) => {
        if (isDragging && e.touches[0]) {
          onMoveDrag(e.touches[0].clientX, e.touches[0].clientY);
        }
      }, { passive: false });

      document.addEventListener('touchend', onEndDrag);

      dragHandle.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        resetBarPosition();
      });
    }

    const miniCardEl = document.getElementById('combat-character-mini-card');
    if (miniCardEl) {
      let isCardDragging = false;
      let cardStartX = 0;
      let cardStartY = 0;
      let cardInitialLeft = 0;
      let cardInitialTop = 0;
      let lastCardTapTime = 0;

      const onStartCardDrag = (clientX, clientY) => {
        const rect = miniCardEl.getBoundingClientRect();
        isCardDragging = true;
        cardStartX = clientX;
        cardStartY = clientY;
        cardInitialLeft = rect.left;
        cardInitialTop = rect.top;
        miniCardEl.style.position = 'fixed';
        miniCardEl.style.margin = '0';
        miniCardEl.style.left = `${cardInitialLeft}px`;
        miniCardEl.style.top = `${cardInitialTop}px`;
        miniCardEl.style.transform = 'none';
        miniCardEl.style.zIndex = '110';
      };

      const onMoveCardDrag = (clientX, clientY) => {
        if (!isCardDragging) return;
        const dx = clientX - cardStartX;
        const dy = clientY - cardStartY;
        const cardW = miniCardEl.offsetWidth || 250;
        const cardH = miniCardEl.offsetHeight || 180;
        miniCardEl.style.left = `${Math.max(0, Math.min(window.innerWidth - cardW, cardInitialLeft + dx))}px`;
        miniCardEl.style.top = `${Math.max(0, Math.min(window.innerHeight - cardH, cardInitialTop + dy))}px`;
      };

      const onEndCardDrag = () => {
        isCardDragging = false;
      };

      miniCardEl.addEventListener('mousedown', (e) => {
        const header = e.target.closest('#combat-mini-drag-header');
        if (!header) return;
        if (e.target.closest('#combat-mini-open-skills-btn') || e.target.closest('#combat-mini-close-btn') || e.target.closest('#combat-mini-skills-toggle-btn')) return;
        onStartCardDrag(e.clientX, e.clientY);
        e.preventDefault();
      });

      document.addEventListener('mousemove', (e) => {
        if (isCardDragging) onMoveCardDrag(e.clientX, e.clientY);
      });

      document.addEventListener('mouseup', onEndCardDrag);

      miniCardEl.addEventListener('touchstart', (e) => {
        const header = e.target.closest('#combat-mini-drag-header');
        if (!header) return;
        if (e.target.closest('#combat-mini-open-skills-btn') || e.target.closest('#combat-mini-close-btn') || e.target.closest('#combat-mini-skills-toggle-btn')) return;
        const touch = e.touches[0];
        if (touch) {
          const now = Date.now();
          if (now - lastCardTapTime < 350) {
            positionMiniCardUnderBar();
            lastCardTapTime = 0;
            return;
          }
          lastCardTapTime = now;
          onStartCardDrag(touch.clientX, touch.clientY);
        }
      }, { passive: false });

      document.addEventListener('touchmove', (e) => {
        if (isCardDragging && e.touches[0]) {
          onMoveCardDrag(e.touches[0].clientX, e.touches[0].clientY);
        }
      }, { passive: false });

      document.addEventListener('touchend', onEndCardDrag);

      miniCardEl.addEventListener('dblclick', (e) => {
        const header = e.target.closest('#combat-mini-drag-header');
        if (!header) return;
        if (e.target.closest('#combat-mini-open-skills-btn') || e.target.closest('#combat-mini-close-btn')) return;
        e.stopPropagation();
        positionMiniCardUnderBar();
      });
    }

    document.addEventListener('click', (e) => {
      const dropPanel = document.getElementById('combat-dropdown-panel');
      const entry = document.getElementById('combat-entry-btn');
      if (dropPanel && dropPanel.style.display === 'flex') {
        if (!dropPanel.contains(e.target) && (!entry || !entry.contains(e.target))) {
          hideCombatDropdownPanel();
        }
      }
    });
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
    triggerCombatConfirmation,
    triggerCombatExitConfirmation,
    updateCombatUI,
    renderCombatCharacterBar,
    syncCombatantStatsFromCoc,
    getCombatSystemPrompt,
    getCombatPromptBlock,
    handleDynamicCombatantsFromAi,
    analyzeCombatantsWithAI,
    openCombatCharacterMiniCard,
    closeCombatCharacterMiniCard,
    openCombatEditModal,
    closeCombatEditModal,
    toggleCombatDropdownPanel,
    hideCombatDropdownPanel
  };

  global.getCombatState = getCombatState;
  global.enterCombat = enterCombat;
  global.exitCombat = exitCombat;
  global.triggerCombatConfirmation = triggerCombatConfirmation;
  global.triggerCombatExitConfirmation = triggerCombatExitConfirmation;
  global.updateCombatUI = updateCombatUI;
  global.renderCombatCharacterBar = renderCombatCharacterBar;
  global.syncCombatantStatsFromCoc = syncCombatantStatsFromCoc;
  global.getCombatSystemPrompt = getCombatSystemPrompt;
  global.getCombatPromptBlock = getCombatPromptBlock;
  global.handleDynamicCombatantsFromAi = handleDynamicCombatantsFromAi;
  global.openCombatCharacterMiniCard = openCombatCharacterMiniCard;
  global.closeCombatCharacterMiniCard = closeCombatCharacterMiniCard;
  global.toggleCombatDropdownPanel = toggleCombatDropdownPanel;
  global.hideCombatDropdownPanel = hideCombatDropdownPanel;

})(window);
