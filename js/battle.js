/* 魔兽世界 · 网页版 — 战斗界面:单位卡牌 / 目标选择 / 技能栏 / 飘字 / 战斗日志 */
(function () {
  'use strict';
  const W = window.WOW;
  const D = W.Data;
  const U = W.Utils;

  const LOG_CLASS = {
    hit: 'log-hit', crit: 'log-crit', spell: 'log-spell', heal: 'log-heal', dot: 'log-dot',
    buff: 'log-buff', debuff: 'log-debuff', cc: 'log-cc', miss: 'log-miss', boss: 'log-boss',
    gold: 'log-gold', levelup: 'log-levelup', death: 'log-death', info: 'log-info', holy: 'log-holy',
    elite: 'log-elite',
  };

  const BattleView = {
    battle: null,
    targetKey: 'e0',
    els: {},
    _itemsCollapsed: false,
    _potionKeys: [],
    _keysBound: false,
    // 道具栏折叠偏好键(设置面板/标题界面共用,避免字符串漂移)
    COLLAPSE_KEY: 'wow_battle_items_collapsed',

    init() {
      const root = document.getElementById('view-battle');
      this.els.root = root;
      // 战斗道具栏折叠状态(跨战斗持久)
      try { this._itemsCollapsed = localStorage.getItem(this.COLLAPSE_KEY) === '1'; } catch (e) { this._itemsCollapsed = false; }
      this.els.header = root.querySelector('.battle-header');
      this.els.stage = root.querySelector('.battle-stage');
      this.els.log = root.querySelector('.combat-log');
      this.els.skillbar = root.querySelector('.skill-bar');
      this.els.scrollbar = root.querySelector('.scroll-bar');
      this._bindKeys();
    },

    _bindKeys() {
      if (this._keysBound) return; // 防止重复 init 叠加监听器
      this._keysBound = true;
      document.addEventListener('keydown', (e) => {
        const view = document.getElementById('view-battle');
        if (!view.classList.contains('active') || !this.battle || this.battle.ended) return;
        if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return; // 输入框内打字不触发战斗快捷键
        const n = parseInt(e.key, 10);
        if (n >= 1 && n <= 9) {
          const btns = this.els.skillbar.querySelectorAll('button.skill-btn');
          const btn = btns[n - 1];
          if (btn && !btn.disabled) { btn.click(); e.preventDefault(); }
        }
        // 药水急救快捷键 Q/E/R/F(对应背包中前 4 瓶药水,折叠态下也能一键喝药)
        const HOT = { q: 0, e: 1, r: 2, f: 3 };
        const hi = HOT[e.key ? e.key.toLowerCase() : ''];
        if (hi !== undefined && (this._potionKeys || []).length) {
          const pid = this._potionKeys[hi];
          if (pid) { W.Combat.usePotion(pid); e.preventDefault(); }
        }
        if (e.key === 'Escape') { W.UI.closeModal(); }
      });
    },

    /* 开始一场战斗 */
    start(encounter, opts) {
      const char = W.State.character;
      this.targetKey = 'e0';
      const battle = W.Combat.start(char, encounter.enemies, {
        log: (type, html) => this._log(type, html),
        float: (key, text, cls) => this._float(key, text, cls),
        render: () => this.render(),
        onEnd: (b) => this._onEnd(b),
      }, opts);
      this.battle = battle;
      this._log('info', `⚔️ 遭遇了 <b>${encounter.name || encounter.enemies.map((e) => D.MONSTERS[e.id] ? D.MONSTERS[e.id].name : e.name).join('、')}</b>！`);
      if (encounter.title) this._log('boss', encounter.title);
      this.render();
      W.UI.showView('battle');
    },

    /* ---------- 结束处理 ---------- */
    _onEnd(b) {
      setTimeout(() => {
        // 若 400ms 内已开启新的战斗,旧战斗的收尾(结算弹窗/清引用)一律跳过,避免误伤新战斗
        if (this.battle !== b) return;
        if (b.victory) {
          W.World.onBattleVictory(b);
        } else if (b.fleed) {
          this.battle = null;
          // 突袭中逃跑:放弃深入敌营进度,避免回到敌城后按钮静默失效
          if (b.context === 'capitalraid' && b.char) b.char.capitalRaid = null;
          W.UI.toast('你脱离了战斗', 'ok');
          W.World.showWorld();
        } else {
          W.World.onBattleDefeat(b);
        }
        this.battle = null;
      }, 400);
    },

    /* ---------- 渲染 ---------- */
    render() {
      const b = this.battle;
      if (!b) return;
      const c = b.char;
      // 保留正在播放的飘字,避免被重绘清除
      const floats = {};
      this.els.stage.querySelectorAll('.float-layer').forEach((layer) => {
        const nodes = Array.from(layer.querySelectorAll('.float-num'));
        if (nodes.length) floats[layer.dataset.float] = nodes;
      });
      // 头部
      const ctx = b.isDungeon ? '副本' : '野外';
      const zoneName = c ? (D.ZONES[c.zone] ? D.ZONES[c.zone].name : '') : '';
      this.els.header.innerHTML =
        `<span class="bt-ctx">${ctx}</span>` +
        `<span class="bt-zone">${U.esc(zoneName)}</span>` +
        `<span class="bt-round">第 ${b.round} 回合</span>`;

      // 敌人
      let enemyHtml = '';
      b.enemies.forEach((e, i) => {
        const pct = e.hp / e.hpMax;
        const isTarget = this.targetKey === e.key;
        const isBoss = e.boss;
        const isElite = e.elite;
        const isWorld = e.world;
        // 团本首领:等级以骷髅显示(如 WoW 的 ??)
        const isRaidBoss = isBoss && b.context === 'dungeon' && c && c.dungeon && D.DUNGEONS[c.dungeon.id] && !!D.DUNGEONS[c.dungeon.id].raid;
        const cc = e.ccs[0] ? `<span class="cc-icon" title="${CC_CN[e.ccs[0].type]}">${CC_ICON[e.ccs[0].type]}</span>` : '';
        enemyHtml += `
          <div class="unit enemy-card ${isTarget ? 'targeted' : ''} ${isBoss ? 'boss' : ''} ${e.hp <= 0 ? 'dead' : ''}" data-key="${e.key}">
            <div class="unit-top">
              <span class="unit-icon">${e.icon}${isWorld ? '<b class="skull">👑</b>' : isBoss ? '<b class="skull">💀</b>' : isElite ? '<b class="skull">⭐</b>' : ''}</span>
              <div class="unit-info">
                <div class="unit-name ${isBoss ? 'boss-name' : ''}" ${e.mSkills && e.mSkills.length ? `title="技能：${U.esc(e.mSkills.map((sid) => { const s = D.MONSTER_SKILLS[sid]; return s ? s.icon + ' ' + s.name + '（' + s.desc + '）' : ''; }).join(' / '))}"` : ''}>${U.esc(e.name)}${isWorld ? '<span class="tag world-tag">世界首领</span>' : isBoss ? '<span class="tag boss-tag">首领</span>' : isElite ? '<span class="tag elite-tag">精英</span>' : ''}</div>
                <div class="unit-lvl">${isRaidBoss ? '💀' : 'Lv.' + e.level} ${e.world ? ' · 世界首领' : e.boss ? ' · 首领' : ''}${e.boss || e.world ? ' · 悬停看技能' : ''}</div>
              </div>
              ${cc}
            </div>
            ${U.bar(pct, 'hp', `<b>${Math.ceil(e.hp)}</b> / ${e.hpMax}`)}
            <div class="unit-buffs">${this._buffChips(e, true)}</div>
            <div class="float-layer" data-float="${e.key}"></div>
          </div>`;
      });
      this.els.stage.innerHTML = `
        <div class="enemy-side">${enemyHtml}</div>
        <div class="vs">⚔️</div>
        <div class="ally-side">${this._allyCard(b.player)}${b.pets.map((p) => this._allyCard(p, true)).join('')}</div>`;

      // 目标绑定
      this.els.stage.querySelectorAll('.enemy-card').forEach((card) => {
        card.addEventListener('click', () => {
          const key = card.dataset.key;
          const e = b.enemies.find((x) => x.key === key);
          if (e && e.hp > 0) { this.targetKey = key; this.render(); W.Audio.click(); }
        });
      });

      // 恢复飘字
      for (const key in floats) {
        const layer = this.els.stage.querySelector(`[data-float="${key}"]`);
        if (layer) floats[key].forEach((n) => layer.appendChild(n));
      }

      // 技能栏
      this._renderSkillBar();
      this._renderScrollBar();

      // 日志滚动
      this.els.log.scrollTop = this.els.log.scrollHeight;
    },

    _allyCard(unit, isPet) {
      const pct = unit.hp / unit.hpMax;
      const cls = isPet ? 'pet' : (unit.cls || '');
      const resHtml = this._resBar(unit);
      const combo = unit.combo ? `<div class="combo">${'✦'.repeat(unit.combo)}${'✧'.repeat(Math.max(0, 5 - unit.combo))}</div>` : '';
      const cc = unit.ccs[0] ? `<span class="cc-icon" title="${CC_CN[unit.ccs[0].type]}">${CC_ICON[unit.ccs[0].type]}</span>` : '';
      return `
        <div class="unit ally-card ${unit.hp <= 0 ? 'dead' : ''}" data-key="${unit.key}">
          <div class="unit-top">
            <span class="unit-icon">${unit.icon}</span>
            <div class="unit-info">
              <div class="unit-name">${U.esc(unit.name)}${isPet ? '<span class="tag pet-tag">宠物</span>' : ''}</div>
              <div class="unit-lvl">Lv.${unit.level}${unit.taunt ? ' · 嘲讽' : ''}</div>
            </div>
            ${cc}
          </div>
          ${U.bar(pct, 'hp', `<b>${Math.ceil(unit.hp)}</b> / ${unit.hpMax}`)}
          ${resHtml}
          ${combo}
          <div class="unit-buffs">${this._buffChips(unit, false)}</div>
          ${this._passiveBadges(unit)}
          <div class="float-layer" data-float="${unit.key}"></div>
        </div>`;
    },

    // 被动技能常驻标识(仅玩家卡牌):水印式图标行,悬停查看效果说明
    _passiveBadges(unit) {
      if (unit.isPet) return '';
      const list = (unit.learned || []).map((id) => D.SKILLS[id]).filter((s) => s && s.passive);
      if (!list.length) return '';
      return `<div class="passive-bar">${list.map((s) =>
        `<span class="passive-chip" title="${U.esc(s.name)}（被动 · 常驻）：${U.esc(s.desc)}">${s.icon}<b class="pp-mark">常</b></span>`).join('')}</div>`;
    },

    _resBar(unit) {
      if (unit.res === 'rage') return U.bar(unit.rage / 100, 'rage', `怒气 ${unit.rage}`);
      if (unit.res === 'energy') return U.bar(unit.energy / 100, 'energy', `能量 ${unit.energy}`);
      if (unit.cls === 'warlock') {
        return U.bar((unit.soulShards || 0) / W.Config.SOUL_SHARD_CAP, 'shard', `💜 灵魂碎片 ${unit.soulShards || 0}`) +
          (unit.manaMax > 0 ? U.bar(unit.mana / unit.manaMax, 'mana', `法力 ${Math.ceil(unit.mana)} / ${unit.manaMax}`) : '');
      }
      if (unit.manaMax > 0) return U.bar(unit.mana / unit.manaMax, 'mana', `法力 ${Math.ceil(unit.mana)} / ${unit.manaMax}`);
      return '';
    },

    _buffChips(unit, isEnemy) {
      let html = '';
      for (const x of unit.buffs) {
        // rounds >= 999 表示被动常驻效果(如猎人印记),显示「常驻」而非离谱的剩余回合数
        const left = x.rounds >= 999 ? '（常驻）' : `（剩 ${x.rounds} 回合）`;
        html += `<span class="buff-chip ${x.isNegative ? 'neg' : ''}" title="${U.esc(x.name)}${left}">${BUFF_ICON[x.key] || '✨'}</span>`;
      }
      for (const d of unit.dots) {
        html += `<span class="buff-chip neg" title="${U.esc(d.name)}（剩 ${d.rounds} 回合）">${DOT_ICON[d.type] || '☠️'}</span>`;
      }
      for (const h of unit.hots) {
        html += `<span class="buff-chip" title="${U.esc(h.name)}（剩 ${h.rounds} 回合）">💚</span>`;
      }
      if (unit.shield) html += `<span class="buff-chip shield" title="护盾（剩 ${unit.shield.amount} 点）">🛡️</span>`;
      return html;
    },

    /* ---------- 技能栏 ---------- */
    _renderSkillBar() {
      const b = this.battle;
      const p = b.player;
      const canUse = W.Combat.canUse.bind(W.Combat);
      // 被动技能效果常驻,不占用技能栏
      const skillList = p.learned.map((id) => D.SKILLS[id]).filter((s) => s && !s.passive);
      // 普通动作
      let html = `
        <button class="skill-btn action" data-act="attack" title="普通攻击"><span class="sk-icon">⚔️</span><span class="sk-name">攻击</span></button>
        <button class="skill-btn action" data-act="defend" title="防御姿态：护甲+50%"><span class="sk-icon">🛡️</span><span class="sk-name">防御</span></button>`;

      skillList.forEach((s, i) => {
        let ok = canUse(s, p);
        // 驯服野兽:仅对生命值低于 50% 的野兽目标可用
        if (s.tame) {
          const t = b.enemies.find((e) => e.key === this.targetKey);
          ok = ok && !!t && t.hp > 0 && t.kind === 'beast' && t.hp / t.hpMax <= 0.5;
        }
        const cd = p.cd[s.id] || 0;
        const costHtml = s.res ? `<span class="sk-cost ${s.res}">${s.cost || 0}</span>` : '';
        const cdOverlay = cd > 0 ? `<div class="cd-overlay"><span>${cd}</span></div>` : '';
        html += `
          <button class="skill-btn ${ok ? '' : 'disabled'} ${s.talent ? 'talent-sk' : ''}" data-skill="${s.id}" ${ok ? '' : 'disabled'} title="${U.esc(s.name)}：${U.esc(s.desc)}${s.cd ? '（冷却 ' + s.cd + ' 回合）' : ''}${s.talent ? '（天赋技能）' : ''}">
            <span class="sk-icon">${s.icon}</span>
            <span class="sk-name">${U.esc(s.name)}</span>
            <span class="sk-key">${i + 3}</span>
            ${costHtml}
            ${cdOverlay}
          </button>`;
      });

      html += `<button class="skill-btn action flee" data-act="flee" title="尝试逃跑"><span class="sk-icon">🏃</span><span class="sk-name">逃跑</span></button>`;
      this.els.skillbar.innerHTML = html;

      this.els.skillbar.querySelectorAll('button').forEach((btn) => {
        btn.addEventListener('click', () => {
          if (btn.disabled) return;
          W.Audio.click();
          if (btn.dataset.skill) this._act({ type: 'skill', skill: btn.dataset.skill, target: this.targetKey });
          else this._act({ type: btn.dataset.act, target: this.targetKey });
        });
      });
    },

    _act(action) {
      const b = this.battle;
      if (!b || b.ended || b.busy) return;
      W.Combat.playerAction(action);
    },

    /* ---------- 战斗增益卷轴栏(免费动作,不占回合) ---------- */
    _renderScrollBar() {
      const b = this.battle;
      const char = W.State.character;
      if (!b || !this.els.scrollbar) return;
      const player = b.player;
      const scrolls = Object.values(D.ITEMS).filter((it) => it.scroll && W.Char.Inventory.count(char, it.id) > 0);
      const potions = Object.values(D.ITEMS).filter((it) => it.consumable && (it.consumable.heal || it.consumable.mana) && W.Char.Inventory.count(char, it.id) > 0)
        .sort((a, b) => (b.consumable.heal || 0) - (a.consumable.heal || 0));
      if (!scrolls.length && !potions.length) { this.els.scrollbar.innerHTML = ''; this.els.scrollbar.style.display = 'none'; return; }
      this.els.scrollbar.style.display = '';
      const coll = this._itemsCollapsed;
      const total = scrolls.length + potions.length;
      let html = `<button class="item-bar-toggle" data-toggle-items title="${coll ? '展开战斗道具栏' : '折叠战斗道具栏（节省界面空间）'}">${coll ? '▸' : '▾'}</button><span class="scroll-bar-hint">🎒 战斗道具（免费·不占回合）${coll ? ` <b class="sc-mini">${total} 个 · Q/E/R/F 急救</b>` : ''}</span>`;
      const cd = player.potionCd || 0;
      // 药水快捷键映射:背包中前 4 瓶(折叠态一键急救用)
      const HOTKEY = ['Q', 'E', 'R', 'F'];
      this._potionKeys = potions.slice(0, 4).map((it) => it.id);
      // 药水(冷却/满状态时禁用;折叠态转为带快捷键的迷你急救按钮)
      for (let pi = 0; pi < potions.length; pi++) {
        const it = potions[pi];
        const n = W.Char.Inventory.count(char, it.id);
        const needHeal = !!(it.consumable.heal && player.hp < player.hpMax);
        const needMana = !!(it.consumable.mana && player.mana < player.manaMax);
        const full = !needHeal && !needMana;
        const off = (cd > 0 || full);
        const tag = cd > 0 ? `冷却 ${cd}` : (full ? '已满' : `×${n}`);
        const effect = [it.consumable.heal ? `恢复 ${it.consumable.heal} 生命` : '', it.consumable.mana ? `恢复 ${it.consumable.mana} 法力` : ''].filter(Boolean).join(' · ');
        const hkTip = (!coll && pi < 4) ? `；按 ${HOTKEY[pi]} 键一键使用` : '';
        const title = `${U.esc(it.name)}：${effect}（战斗内免费使用，不消耗回合；冷却 ${W.Combat.POTION_CD_ROUNDS} 回合）${hkTip}`;
        if (coll) {
          if (pi < 4) {
            const hk = HOTKEY[pi];
            html += `<button class="mini-potion${off ? ' disabled' : ''}" data-potion="${it.id}" data-hk="${hk}" title="${title}（或按 ${hk} 键）"><span class="hk-key">${hk}</span><span class="hk-ico">${it.icon}</span><span class="hk-num">${tag}</span></button>`;
          }
          // 折叠态第 5 瓶及以后不显示(保留 4 个急救位)
        } else {
          html += `<button class="scroll-btn potion-btn"${off ? ' disabled' : ''} data-potion="${it.id}" title="${title}"><span class="sc-ico">${it.icon}</span><span class="sc-name">${U.esc(it.name)}</span><span class="sc-num">${tag}</span></button>`;
        }
      }
      // 卷轴(折叠态隐藏,急救场景用不到)
      for (const it of scrolls) {
        if (coll) continue;
        const n = W.Char.Inventory.count(char, it.id);
        const title = it.scroll.buff
          ? `${U.esc(it.name)}：${U.esc(it.scroll.name)}，持续 ${it.scroll.rounds} 回合（战斗内免费使用，不消耗回合）`
          : `${U.esc(it.name)}：${U.esc(it.scroll.name)}（战斗内免费使用，不消耗回合）`;
        html += `<button class="scroll-btn" data-scroll="${it.id}" title="${title}"><span class="sc-ico">${it.icon}</span><span class="sc-name">${U.esc(it.name)}</span><span class="sc-num">×${n}</span></button>`;
      }
      this.els.scrollbar.innerHTML = html;
      this.els.scrollbar.classList.toggle('collapsed', coll);
      this.els.scrollbar.querySelectorAll('[data-toggle-items]').forEach((btn) => {
        btn.addEventListener('click', () => {
          this._itemsCollapsed = !this._itemsCollapsed;
          try { localStorage.setItem(this.COLLAPSE_KEY, this._itemsCollapsed ? '1' : '0'); } catch (e) { /* ignore */ }
          this.render();
        });
      });
      this.els.scrollbar.querySelectorAll('[data-potion]').forEach((btn) => {
        btn.addEventListener('click', () => {
          W.Combat.usePotion(btn.dataset.potion);
        });
      });
      this.els.scrollbar.querySelectorAll('[data-scroll]').forEach((btn) => {
        btn.addEventListener('click', () => {
          W.Combat.useScroll(btn.dataset.scroll);
        });
      });
    },

    /* ---------- 日志 / 飘字 ---------- */
    _log(type, html) {
      const line = U.el('div', 'log-line ' + (LOG_CLASS[type] || 'log-info'));
      line.innerHTML = html;
      this.els.log.appendChild(line);
      while (this.els.log.children.length > 120) this.els.log.removeChild(this.els.log.firstChild);
      this.els.log.scrollTop = this.els.log.scrollHeight;
    },

    _float(key, text, cls) {
      const layer = this.els.stage.querySelector(`[data-float="${key}"]`);
      if (!layer) return;
      const f = U.el('span', 'float-num ' + (cls || 'hit'));
      f.textContent = text;
      layer.appendChild(f);
      setTimeout(() => f.remove(), 900);
    },
  };

  const CC_ICON = { stun: '💫', sheep: '🐑', fear: '😱', root: '🌿' };
  const CC_CN = { stun: '眩晕', sheep: '变形', fear: '恐惧', root: '定身' };
  const BUFF_ICON = { atk: '⚔️', armor: '🛡️', invuln: '🌟', onHit: '🔥', thorns: '🌵', stealth: '🌒', bear: '🐻', ccImmune: '🧠', evocation: '🌌', defend: '🛡️', enrage: '😡', warcry: '📢', slow: '❄️', pom: '🧘', dodgePct: '💨', petBuff: '🐾', crippling: '🕸️', hunters_mark: '🎯', sc_atk: '⚔️', sc_armor: '🛡️', sc_crit: '🎯', sc_dodge: '💨', eye_burn: '👁️', wing_crush: '🪽', corruption: '🩸', flurry_crush: '🗡️', slime_acid: '☠️', worgen_curse: '🐺', quake_armor: '🌍', sand_blind: '🌀', death_siphon: '💀', arcane_drain: '🔮' };
  const DOT_ICON = { physical: '🩸', fire: '🔥', frost: '❄️', nature: '☠️', shadow: '🌑', arcane: '🔮', holy: '✨' };

  W.BattleView = BattleView;
})();
