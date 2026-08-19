/* 魔兽世界 · 战大陆 — 世界界面:区域 / 探索 / 商店 / 旅店 / 任务 / 旅行 / 状态 / 背包 / 存档 */
(function () {
  'use strict';
  const W = window.WOW;
  const D = W.Data;
  const C = W.Config;
  const U = W.Utils;
  const RNG = W.RNG;

  const World = {
    els: {},
    init() {
      const root = document.getElementById('view-world');
      this.els.root = root;
      this.els.header = root.querySelector('.world-header');
      this.els.zone = root.querySelector('.zone-panel');
      this.els.side = root.querySelector('.side-panel');
      this._bindActions();
    },

    _bindActions() {
      this.els.root.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-act]');
        if (!btn) return;
        W.Audio.click();
        const act = btn.dataset.act;
        if (act === 'explore') this.explore();
        else if (act === 'shop') this.openShop();
        else if (act === 'inn') this.openInn();
        else if (act === 'quests') this.openQuestBoard();
        else if (act === 'dungeon-manual') this.openDungeonManual();
        else if (act === 'travel') this.openTravel();
        else if (act === 'status') this.openStatus();
        else if (act === 'bag') this.openBag();
        else if (act === 'skills') this.openSkills();
        else if (act === 'pets') this.openPets();
        else if (act === 'talents') this.openTalents();
        else if (act === 'forge') this.openForge();
        else if (act === 'worldboss') this.challengeWorldBoss(btn.dataset.mid);
        else if (act === 'capital-raid') this.startCapitalRaid(btn.dataset.raid);
        else if (act === 'ach') this.openAchievements();
        else if (act === 'codex') this.openCodex();
        else if (act === 'rep') this.openRep();
        else if (act === 'save') this.openSave();
        else if (act === 'settings') this.openSettings();
        else if (act === 'title') this.backToTitle();
      });
    },

    showWorld() {
      const char = W.State.character;
      if (!char) { W.UI.showView('title'); return; }
      // 旧存档迁移 / 职业专精字段补齐
      W.Char.ensureClassFeatures(char);
      // 死亡保护
      const c = W.Char.computed(char);
      if (char.hp <= 0) { char.hp = Math.max(1, Math.floor(c.hpMax * 0.3)); char.mana = Math.floor(c.manaMax * 0.3); }
      this.render();
      W.UI.showView('world');
      // 稀有精英提示:每次进入有活精英的区域提示一次
      if (this._hintedZone !== char.zone) {
        this._hintedZone = char.zone;
        const rares = W.Char.eliteStatus(char, char.zone).filter((e) => e.alive);
        if (rares.length) {
          W.UI.toast(`🔥 稀有精英 ${rares.map((e) => e.icon + ' ' + e.name).join('、')} 正在本区域出没！击败必掉奥术水晶`, 'warn');
        }
        const wbs = W.Char.worldBossStatus(char).filter((s) => s.zoneId === char.zone && s.alive);
        if (wbs.length) {
          W.UI.toast(`🌍 世界首领 ${wbs.map((s) => s.icon + ' ' + s.name).join('、')} 正在此出没！击败必掉稀有装备`, 'warn');
        }
      }
      this._startEliteTicker();
      // 在线更新检查(每日自动一次,静默失败)
      if (W.Updater) W.Updater.autoCheck();
    },

    /* ---------- 稀有精英刷新计时 ---------- */
    _eliteLine(char, zone) {
      const st = W.Char.eliteStatus(char, zone.id);
      if (!st.length) return '';
      return `<div class="zone-elites">${st.map((e) =>
        e.alive
          ? `<div class="elite-alive">🔥 稀有精英 <b>${U.esc(e.name)}</b> 已刷新 · 出没中！击败必掉奥术水晶</div>`
          : `<div class="elite-timer">👑 <b>${U.esc(e.name)}</b> 被击败 · <b class="elite-cd">${this._fmtCd(e.remainingMs)}</b> 后刷新</div>`
      ).join('')}</div>`;
    },
    _fmtCd(ms) {
      const s = Math.max(0, Math.ceil(ms / 1000));
      const mm = Math.floor(s / 60), ss = s % 60;
      return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
    },
    /* ---------- 世界首领(定时刷新) ---------- */
    _worldBossLine(char, zone) {
      const wb = Object.values(D.WORLD_BOSSES || {}).find((x) => x.zone === zone.id);
      if (!wb) return '';
      const st = W.Char.worldBossStatus(char).find((s) => s.id === wb.mid);
      if (!st) return '';
      if (st.alive) {
        const locked = char.level < st.minLevel;
        return `<div class="world-bosses">
          <div class="world-boss alive">
            <div class="wb-head">🌍 世界首领 <b>${st.icon} ${U.esc(st.name)}</b><span class="tag world-tag">稀有</span></div>
            <div class="wb-desc">${U.esc(st.title)} · Lv.${st.level} · 击败必掉稀有装备</div>
            <button class="btn wb-btn" data-act="worldboss" data-mid="${wb.mid}" ${locked ? 'disabled' : ''}>${locked ? `🔒 需要 ${st.minLevel} 级` : `⚔️ 挑战 ${U.esc(st.name)}`}</button>
          </div>
        </div>`;
      }
      return `<div class="world-bosses">
        <div class="world-boss dead">
          <div class="wb-head">🌍 <b>${st.icon} ${U.esc(st.name)}</b><span class="tag boss-tag">已被击败</span></div>
          <div class="wb-timer">⏳ 重新现身倒计时 <b class="elite-cd">${this._fmtCd(st.remainingMs)}</b></div>
        </div>
      </div>`;
    },
    challengeWorldBoss(mid) {
      const char = W.State.character;
      const wb = (D.WORLD_BOSSES || {})[mid];
      if (!wb) return;
      const st = W.Char.worldBossStatus(char).find((s) => s.id === mid);
      if (!st || !st.alive) { W.UI.toast('该世界首领尚未现身', 'warn'); return; }
      if (st.zoneId !== char.zone) { W.UI.toast(`只有前往${st.zoneName}才能挑战${st.name}`, 'warn'); return; }
      if (char.level < st.minLevel) { W.UI.toast(`需要 ${st.minLevel} 级才能挑战${st.name}`, 'warn'); return; }
      const m = D.MONSTERS[mid];
      W.BattleView.start({ enemies: [m], name: '世界首领 · ' + m.name, title: m.title || '世界级的威胁！' }, { isBoss: true, context: 'world' });
    },

    /* ---------- 深入敌营 · 敌方主城限定突袭 ---------- */
    // 玩家位于敌方主城时渲染限定挑战卡片(本阵营主城不显示)
    _capitalRaidLine(char, zone) {
      const raid = D.CAPITAL_RAIDS && D.CAPITAL_RAIDS[zone.id];
      if (!raid) return '';
      if (char.faction === raid.enemyFaction) return ''; // 自己的主城不突袭
      const st = W.Char.capitalRaidStatus(char, zone.id);
      if (!st) return '';
      const locked = char.level < st.minLevel;
      const rw = st.rewardNames.map((n) => U.esc(n)).join(' / ');
      return `<div class="capital-raid">
        <div class="cr-head">🕵️ 深入敌营 <span class="tag world-tag">限定</span>${st.doneToday ? '<span class="tag boss-tag">今日已领</span>' : `<span class="tag gold-tag">今日剩余 ${st.remaining} 次</span>`}</div>
        <div class="cr-desc">${U.esc(raid.desc)} <b class="gold-text">Lv.${st.minLevel}+</b></div>
        <div class="cr-reward">🏆 限定奖励：<b style="color:#c06bff">${rw}</b> · ${U.money(raid.rewards.gold)} 金币 · 奥术水晶 ×${raid.rewards.crystal} · 声望 +${raid.rewards.repAmt}</div>
        ${st.doneToday
          ? '<div class="cr-done">✅ 今日限定奖励已领取，明天再来挑战</div>'
          : `<button class="btn cr-btn" data-act="capital-raid" data-raid="${zone.id}" ${locked ? 'disabled' : ''}>${locked ? `🔒 需要 ${st.minLevel} 级` : `⚔️ 突袭 ${U.esc(raid.name)}`}</button>`}
      </div>`;
    },
    // 开始突袭:3 波守卫战(每日限次 1 次,通关发放限定奖励)
    startCapitalRaid(zoneId) {
      const char = W.State.character;
      const raid = D.CAPITAL_RAIDS && D.CAPITAL_RAIDS[zoneId];
      if (!raid) return;
      if (char.zone !== zoneId) { W.UI.toast('只有身处敌方主城才能发起突袭', 'warn'); return; }
      if (char.faction === raid.enemyFaction) { W.UI.toast('这是你方的主城，无需突袭', 'warn'); return; }
      const st = W.Char.capitalRaidStatus(char, zoneId);
      if (st.doneToday) { W.UI.toast('今日限定奖励已领取，明天再来吧', 'warn'); return; }
      if (char.level < st.minLevel) { W.UI.toast(`需要 ${st.minLevel} 级才能发起突袭`, 'warn'); return; }
      if (char.capitalRaid) return; // 已在突袭中
      char.capitalRaid = { id: zoneId, wave: 0 };
      this._raidNext();
    },
    // 推进突袭波次
    _raidNext() {
      const char = W.State.character;
      if (!char.capitalRaid) return;
      const raid = D.CAPITAL_RAIDS[char.capitalRaid.id];
      if (!raid) { char.capitalRaid = null; return; }
      const waveIdx = char.capitalRaid.wave;
      if (waveIdx >= raid.waves.length) { char.capitalRaid = null; W.UI.toast('突袭完成！', 'ok'); this.showWorld(); return; }
      const wave = raid.waves[waveIdx];
      const enemies = wave.enemies.map((id) => D.MONSTERS[id]);
      const isFinal = waveIdx === raid.waves.length - 1;
      W.BattleView.start({ enemies, name: raid.name + ' · ' + wave.name, title: isFinal ? (D.MONSTERS[raid.boss].title || '最终决战！') : '敌营深处！' },
        { isDungeon: true, isBoss: isFinal, context: 'capitalraid' });
    },
    _startEliteTicker() {
      this._stopEliteTicker();
      this._eliteTimer = setInterval(() => {
        const vw = document.getElementById('view-world');
        if (!vw || !vw.classList.contains('active')) return;
        const char = W.State.character;
        if (!char) { this._stopEliteTicker(); return; }
        const zone = D.ZONES[char.zone];
        if (!zone) return;
        // 世界首领倒计时独立于精英存在与否刷新(避免无精英区域停摆)
        const wb = document.querySelector('.world-bosses');
        if (wb) {
          const wbl = this._worldBossLine(char, zone);
          if (wb.innerHTML !== wbl) wb.innerHTML = wbl;
        }
        const el = document.querySelector('.zone-elites');
        if (!el) return;
        const line = this._eliteLine(char, zone);
        if (el.innerHTML !== line) el.innerHTML = line;
      }, 1000);
    },
    _stopEliteTicker() {
      if (this._eliteTimer) { clearInterval(this._eliteTimer); this._eliteTimer = null; }
    },

    render() {
      const char = W.State.character;
      const c = W.Char.computed(char);
      const race = c.race, cls = c.cls;
      const zone = D.ZONES[char.zone];

      // 宠物按钮仅猎人可见
      const petsBtn = document.querySelector('[data-act="pets"]');
      if (petsBtn) petsBtn.style.display = char.classId === 'hunter' ? '' : 'none';

      // 头部
      this.els.header.innerHTML = `
        <div class="wh-left">
          <div class="wh-name">${U.esc(char.name)} <span class="wh-class" style="background:linear-gradient(135deg,${cls.colors[0]},${cls.colors[1]})">${cls.name}</span></div>
          <div class="wh-sub">${race.name} · ${cls.en} · 阵营：${char.faction === 'alliance' ? '联盟' : '部落'} · Lv.${char.level}</div>
        </div>
        <div class="wh-right">
          <div class="wh-gold">${U.money(char.gold)}</div>
          <div class="wh-save" title="关键节点自动保存进度">💾 自动存档 <span>${W.State.lastSavedAt ? U.fmtRelTime(W.State.lastSavedAt) : '—'}</span></div>
        </div>
        <div class="wh-bars">
          ${char.level >= W.Config.LEVEL_CAP
            ? '<div class="wh-maxlv">🏆 已至巅峰 · 满级 Lv.60</div>'
            : `<div class="wh-expbar">${U.bar(char.exp / U.expNeeded(char.level), 'exp', `经验 ${U.fmt(char.exp)} / ${U.fmt(U.expNeeded(char.level))}`)}</div>`}
        </div>`;

      // 区域面板
      const dungeon = zone.dungeon ? D.DUNGEONS[zone.dungeon] : null;
      const isDungeon = !!dungeon;
      this.els.zone.innerHTML = `
        <div class="zone-hero ${isDungeon ? 'dungeon' : ''}">
          <div class="zone-icon">${zone.icon}</div>
          <div class="zone-info">
            <div class="zone-name">${U.esc(zone.name)}${isDungeon ? `<span class="tag ${dungeon.raid ? 'raid-tag' : 'd5-tag'}">${dungeon.raid ? '团本' : '5人本'}</span>` : ''}</div>
            <div class="zone-level">推荐等级 ${zone.level}</div>
            <div class="zone-desc">${U.esc(zone.desc)}</div>
          </div>
        </div>
        <div class="zone-actions">
          <button class="btn gold big explore-btn" data-act="explore">${isDungeon ? '⚔️ 深入副本' : '⚔️ 外出探索'}</button>
          ${isDungeon ? '' : `<button class="btn util-btn act-shop" data-act="shop">🛒 ${zone.shopName}</button>`}
          ${isDungeon ? '' : `<button class="btn util-btn act-inn" data-act="inn">🏨 旅店休息</button>`}
          <button class="btn util-btn act-quests" data-act="quests">📜 任务板</button>
          ${isDungeon ? `<button class="btn util-btn act-manual" data-act="dungeon-manual">📖 副本手册</button>` : ''}
          ${isDungeon ? `<button class="btn util-btn act-travel" data-act="travel">🧭 离开副本</button>` : `<button class="btn util-btn act-travel" data-act="travel">🧭 出发旅行</button>`}
        </div>
        ${dungeon ? `<div class="dungeon-info">${U.esc(dungeon.desc)}<div class="dungeon-waves">${dungeon.waves.map((w, i) => `<span class="wave ${i < (char.dungeon ? char.dungeon.wave : 0) ? 'done' : i === (char.dungeon ? char.dungeon.wave : 0) ? 'cur' : ''}">${i + 1}</span>`).join('')}</div></div>` : ''}
        ${isDungeon ? this._dungeonPreview(dungeon) : ''}
        ${isDungeon ? '' : `<div class="zone-monsters">区域生物：${(zone.monsters || []).map((m) => `<span class="m-chips">${D.MONSTERS[m] ? D.MONSTERS[m].icon + ' ' + U.esc(D.MONSTERS[m].name) : m}</span>`).join('')}</div>`}
        ${isDungeon ? '' : this._eliteLine(char, zone)}
        ${isDungeon ? '' : this._worldBossLine(char, zone)}
        ${isDungeon ? '' : this._capitalRaidLine(char, zone)}`;

      // 侧栏:任务 + 状态摘要
      const quests = this._questSummary(char);
      this.els.side.innerHTML = `
        <div class="panel quest-panel">
          <div class="panel-title">📜 任务日志</div>
          ${quests || '<div class="empty">当前区域暂无任务</div>'}
        </div>
        <div class="panel stat-panel">
          <div class="panel-title">📊 角色状态</div>
          <div class="stat-grid">
            <div><span>生命</span><b>${Math.ceil(char.hp)}/${c.hpMax}</b></div>
            ${c.manaMax ? `<div><span>法力</span><b>${Math.ceil(char.mana)}/${c.manaMax}</b></div>` : ''}
            <div><span>攻击</span><b>${c.atkMin}-${c.atkMax}</b></div>
            <div><span>护甲</span><b>${c.armor}</b></div>
            <div><span>暴击</span><b>${(c.crit * 100).toFixed(1)}%</b></div>
            <div><span>闪避</span><b>${(c.dodge * 100).toFixed(1)}%</b></div>
          </div>
          <div class="stat-foot">击杀 ${char.kills} · 死亡 ${char.deaths}</div>
          ${char.level >= 10
            ? `<div class="stat-talents">🌟 天赋 <b>${W.Char.pointsSpent(char)}</b>/${W.Char.talentPointsAt(char.level)}${W.Char.getUnspent(char) > 0 ? ' <span class="tag gold-tag">可分配</span>' : ''}</div>`
            : `<div class="stat-talents dim">🌟 天赋系统 10 级解锁</div>`}
        </div>`;
    },

    _questSummary(char) {
      const zone = D.ZONES[char.zone];
      const active = W.Char.QuestLog.active(char);
      let html = '';
      for (const qid of zone.quests) {
        const q = D.QUESTS[qid];
        const qs = char.quests[qid];
        const completed = char.completedQuests.includes(qid);
        if (qs && !qs.done) {
          html += `<div class="quest-item">${U.esc(q.name)} <span class="quest-progress">${qs.progress}/${q.count}</span></div>`;
        } else if (qs && qs.done) {
          html += `<div class="quest-item done">${U.esc(q.name)} <span class="quest-done">可交付</span></div>`;
        }
      }
      for (const qid of active) {
        if (!zone.quests.includes(qid)) {
          const q = D.QUESTS[qid];
          if (q) html += `<div class="quest-item other">${U.esc(q.name)} <span class="quest-progress">${char.quests[qid].progress}/${q.count}</span></div>`;
        }
      }
      return html;
    },

    /* ---------- 探索 / 副本 ---------- */
    explore() {
      const char = W.State.character;
      const zone = D.ZONES[char.zone];
      if (zone.dungeon) { this._dungeonNext(); return; }
      if (zone.monsters.length === 0) { W.UI.toast('这里是安全的城镇，没有怪物', 'warn'); return; }
      if (!RNG.chance(C.ENCOUNTER_CHANCE)) {
        W.UI.toast('你在这片区域搜寻了一番，没有发现敌人');
        return;
      }
      const enc = D.ENCOUNTERS[char.zone];
      const pick = RNG.weighted(enc.map(([w, ids]) => [w, ids]));
      const enemies = pick.map((id) => D.MONSTERS[id]);
      const elite = enemies.some((e) => e.elite);
      W.BattleView.start({ enemies, name: zone.name, title: elite ? '你遭遇了一群凶猛的生物！' : '' }, { isDungeon: false });
    },

    _dungeonNext() {
      const char = W.State.character;
      const zone = D.ZONES[char.zone];
      const dungeon = D.DUNGEONS[zone.dungeon];
      if (!char.dungeon) char.dungeon = { id: zone.dungeon, wave: 0 };
      const waveIdx = char.dungeon.wave;
      if (waveIdx >= dungeon.waves.length) {
        char.dungeon = null;
        W.UI.toast('副本已通关！', 'ok');
        this.showWorld();
        return;
      }
      const wave = dungeon.waves[waveIdx];
      const enemies = wave.enemies.map((id) => D.MONSTERS[id]);
      W.BattleView.start({ enemies, name: dungeon.name + ' · ' + wave.name, title: wave.name.indexOf('首领') >= 0 ? '最终决战！' : '' },
        { isDungeon: true, isBoss: waveIdx === dungeon.waves.length - 1, context: 'dungeon' });
    },

    /* ---------- 副本手册 / 战前预览 ---------- */
    // 单技能标签(独特机制高亮,悬停查看说明)
    _skillChip(sid) {
      const s = D.MONSTER_SKILLS[sid];
      if (!s) return '';
      const sig = s.sig ? ' sig' : '';
      return `<span class="dm-skill${sig}" title="${U.esc(s.desc)}">${s.icon} ${U.esc(s.name)}${s.sig ? '<em>独特</em>' : ''}</span>`;
    },
    // 战前预览:最终首领 + 招牌技能(进本前可见,无需弹窗)
    _dungeonPreview(dungeon) {
      const boss = D.MONSTERS[dungeon.boss];
      if (!boss) return '';
      const skills = (boss.skills || []).map((sid) => this._skillChip(sid)).filter(Boolean).join('');
      const sigSkills = (boss.skills || []).filter((sid) => D.MONSTER_SKILLS[sid] && D.MONSTER_SKILLS[sid].sig);
      const sigLine = sigSkills.length
        ? `<div class="dm-sig-note">${sigSkills.map((sid) => `⚠️ <b>${U.esc(D.MONSTER_SKILLS[sid].name)}</b>：${U.esc(D.MONSTER_SKILLS[sid].desc)}`).join(' ')}</div>`
        : '';
      return `<div class="dungeon-preview">
        <div class="dm-preview-title">⚔️ 首领战前预览</div>
        <div class="dm-boss">${boss.icon} <b>${U.esc(boss.name)}</b><span class="tag ${dungeon.raid ? 'raid-tag' : 'd5-tag'}">${dungeon.raid ? '团本' : '5人本'}</span><span class="tag boss-tag">${dungeon.raid ? '💀' : 'Lv.' + boss.level} 最终首领</span></div>
        ${skills ? `<div class="dm-skills">${skills}</div>` : ''}
        ${sigLine}
        <button class="btn util-btn act-manual" data-act="dungeon-manual">📖 查看完整副本手册</button>
      </div>`;
    },
    // 副本手册弹窗:逐波敌人 + 技能详解
    openDungeonManual() {
      const char = W.State.character;
      const zone = D.ZONES[char.zone];
      const dungeon = zone.dungeon ? D.DUNGEONS[zone.dungeon] : null;
      if (!dungeon) { W.UI.toast('当前区域没有副本手册', 'warn'); return; }
      const waveHtml = dungeon.waves.map((w, i) => {
        const enemies = w.enemies.map((mid) => {
          const m = D.MONSTERS[mid];
          if (!m) return '';
          const isBoss = mid === dungeon.boss;
          const isElite = m.elite && !isBoss;
          const skills = (m.skills || []).map((sid) => {
            const s = D.MONSTER_SKILLS[sid];
            if (!s) return '';
            return `<div class="dm-row${s.sig ? ' sig' : ''}">
              <span class="dm-ricon">${s.icon}</span>
              <div class="dm-rbody">
                <div class="dm-rname">${U.esc(s.name)}${s.sig ? ' <span class="tag sig-tag">独特机制</span>' : ''}</div>
                <div class="dm-rdesc">${U.esc(s.desc)}</div>
              </div>
            </div>`;
          }).join('');
          return `<div class="dm-enemy${isBoss ? ' boss' : ''}">
            <div class="dm-enemy-head">${m.icon} <b>${U.esc(m.name)}</b><span class="tag ${isBoss ? 'boss-tag' : isElite ? 'elite-tag' : ''}">${isBoss ? '首领' : isElite ? '精英' : 'Lv.' + m.level}</span></div>
            ${skills ? `<div class="dm-skills-list">${skills}</div>` : '<div class="dm-no-skills">普通攻击</div>'}
          </div>`;
        }).join('');
        return `<div class="dm-wave"><div class="dm-wave-title">第 ${i + 1} 波 · ${U.esc(w.name)}</div>${enemies}</div>`;
      }).join('');
      W.UI.openModal(`<div class="dm-manual">
        <div class="dm-head">${dungeon.icon} <b>${U.esc(dungeon.name)}</b><span class="tag ${dungeon.raid ? 'raid-tag' : 'd5-tag'}">${dungeon.raid ? '团本' : '5人本'}</span><span class="tag boss-tag">副本手册</span><span class="dm-lvl">推荐等级 ${dungeon.minLevel}</span></div>
        <div class="dm-desc">${U.esc(dungeon.desc)}</div>
        ${waveHtml}
      </div>`, { title: '副本手册 · ' + dungeon.name });
    },

    /* ---------- 战斗结算 ---------- */
    onBattleVictory(b) {
      const char = W.State.character;
      const zone = D.ZONES[char.zone];
      const dungeon = zone.dungeon ? D.DUNGEONS[zone.dungeon] : null;
      // 战后休整:自动恢复一定比例最大生命(野外战斗的消耗得到部分恢复)
      const cc = W.Char.computed(char);
      const hpRestored = Math.max(0, Math.min(cc.hpMax - char.hp, Math.floor(cc.hpMax * C.POST_BATTLE_HP_PCT)));
      char.hp = Math.min(cc.hpMax, char.hp + hpRestored);
      let modal = `
        <div class="victory">
          <div class="victory-title">🏆 战斗胜利！</div>
          ${char.level < W.Config.LEVEL_CAP
            ? `<div class="reward-row">经验 <b class="gold-text">+${b.rewards.xp}</b></div>`
            : (b.rewards.xpGold ? `<div class="reward-row">经验 <b class="gold-text">+${b.rewards.xp}</b> → 💰 已转为 <b>${U.plainMoney(b.rewards.xpGold)}</b></div>` : '')}
          <div class="reward-row">金钱 <b>${U.money(b.rewards.gold)}</b></div>
          ${!dungeon && hpRestored > 0 ? `<div class="reward-row">🍖 战后休整：恢复 <b style="color:#6fdc8c">${hpRestored}</b> 点生命</div>` : ''}
          ${(b.rewards.drops || []).map((iid) => { const it = D.ITEMS[iid]; return it ? `<div class="reward-row drop-row">🎒 拾取 <b style="color:${U.QUALITY_COLOR[it.quality]}">${it.icon} ${U.esc(it.name)}</b></div>` : ''; }).join('')}`;

      // 任务完成提示
      const doneQuests = [];
      for (const qid of W.Char.QuestLog.active(char)) {
        const q = D.QUESTS[qid];
        if (q && char.quests[qid].done) doneQuests.push(q);
      }
      if (doneQuests.length) modal += doneQuests.map((q) => `<div class="reward-row quest-done">✅ 任务完成：${U.esc(q.name)}</div>`).join('');

      if (dungeon && b.context === 'dungeon') {
        const waveIdx = char.dungeon ? char.dungeon.wave : 0;
        if (waveIdx >= dungeon.waves.length - 1) {
          // 副本通关
          char.dungeon = null;
          W.Char.rest(char); // 通关后恢复
          // 成就:通关副本(记录已通关列表,按副本 id 标记)
          if (!char.dungeons) char.dungeons = [];
          if (!char.dungeons.includes(dungeon.id)) char.dungeons.push(dungeon.id);
          // 首领图鉴:记录最终首领击杀(通关次数/最快回合,团本带 raid 标记;刷新纪录时结算提示)
          if (dungeon.boss) {
            const cx = W.Char.Codex.record(char, dungeon.boss, b.round, dungeon.raid ? 'raid' : 'dungeon');
            if (cx && cx.newFastest) modal += `<div class="reward-row">⚡ <b>新纪录！</b>${D.MONSTERS[dungeon.boss] ? U.esc(D.MONSTERS[dungeon.boss].name) : ''} 最快 <b>${cx.entry.fastest}</b> 回合通关</div>`;
          }
          // 阵营声望:副本通关获得大额声望(提升声望等级时结算提示)
          const drep = W.Char.Reps.forDungeon(dungeon.id);
          if (drep) {
            const dr = W.Char.Reps.add(char, drep, 900 + dungeon.minLevel * 10);
            if (dr && dr.newTier) modal += `<div class="reward-row">🏛️ ${U.esc(D.REPS[drep].name)} 声望达到 <b>${dr.tier.name}</b>！</div>`;
          }
          const achGains = W.Char.Achievements.trigger(char, 'dungeon', { mark: dungeon.id });
          const chestText = this._dungeonChest(char, dungeon);
          modal += `<div class="dungeon-clear">🎉 <b>${U.esc(dungeon.name)}</b><span class="tag ${dungeon.raid ? 'raid-tag' : 'd5-tag'}">${dungeon.raid ? '团本' : '5人本'}</span> 已通关！</div>`;
          modal += `<div class="reward-row chest-row">🗝️ <b>副本宝箱</b>：${chestText}</div>`;
          if (achGains.length) modal += achGains.map((g) => `<div class="reward-row ach-done">🏅 成就达成：<b>${U.esc(g.ach.name)}</b>${this._achDungeonTag(g.ach)} ${g.gold ? '· ' + U.plainMoney(g.gold) : ''}${g.items.length ? '· ' + g.items.map((iid) => (D.ITEMS[iid] ? D.ITEMS[iid].icon + U.esc(D.ITEMS[iid].name) : iid)).join('、') : ''}</div>`).join('');
          // 下一副本建议:若存在可直达的未通关副本,提供一键前往(复用成就直达目标逻辑)
          const nextDg = this._nextDungeonSuggestion(char);
          if (nextDg) {
            const nd = D.DUNGEONS[nextDg];
            modal += `<div class="reward-row next-dg-row">🏁 下一站：<b>${U.esc(nd.name)}</b><span class="tag ${nd.raid ? 'raid-tag' : 'd5-tag'}">${nd.raid ? '团本' : '5人本'}</span><span class="dm-lvl">Lv.${nd.minLevel}</span><button class="btn tiny chip ach-go" data-ach-next-go="${nextDg}" title="前往${U.esc(nd.name)}（推荐 Lv.${nd.minLevel}）">🧭 一键前往</button></div>`;
          }
          modal += `<div class="modal-actions"><button class="btn gold" data-continue>返回区域</button></div>`;
        } else {
          char.dungeon.wave++;
          W.Char.rest(char); // 波次间隙休整
          modal += `<div class="reward-row">队伍进行了休整，状态完全恢复</div>`;
          modal += `<div class="reward-row">副本进度：<b>${char.dungeon.wave}/${dungeon.waves.length}</b></div>`;
          modal += `<div class="modal-actions"><button class="btn gold" data-continue>继续深入 →</button><button class="btn ghost" data-back>离开副本</button></div>`;
        }
      } else if (char.capitalRaid && b.context === 'capitalraid') {
        // 深入敌营:3 波守卫战 → 最终首领(每日限次 1 次发放限定奖励)
        const raid = D.CAPITAL_RAIDS[char.capitalRaid.id];
        const waveIdx = char.capitalRaid.wave;
        if (raid && waveIdx >= raid.waves.length - 1) {
          // 突袭成功:发放限定奖励(每日首次),全部到账后再清空进度
          const zoneId = char.capitalRaid.id;
          W.Char.rest(char);
          const first = W.Char.markCapitalRaidDone(char, zoneId);
          modal += `<div class="dungeon-clear">🎉 <b>${U.esc(raid.name)}</b> 突袭成功！<span class="tag world-tag">限定</span></div>`;
          if (first) {
            const rw = raid.rewards || {};
            char.gold += rw.gold || 0;
            modal += `<div class="reward-row">💰 突袭缴获 <b>${U.money(rw.gold)}</b> 金币</div>`;
            const item = RNG.pick(rw.items || []);
            if (item && D.ITEMS[item]) {
              W.Char.Inventory.add(char, item, 1);
              modal += `<div class="reward-row drop-row">🏆 限定战利品 <b style="color:${U.QUALITY_COLOR[D.ITEMS[item].quality]}">${D.ITEMS[item].icon} ${U.esc(D.ITEMS[item].name)}</b></div>`;
            }
            if (rw.crystal) {
              W.Char.Inventory.add(char, 'm_crystal', rw.crystal);
              modal += `<div class="reward-row">💎 奥术水晶 ×${rw.crystal}</div>`;
            }
            if (rw.rep) {
              const dr = W.Char.Reps.add(char, rw.rep, rw.repAmt || 0);
              modal += `<div class="reward-row">🏛️ ${U.esc(D.REPS[rw.rep].name)} 声望 +${rw.repAmt || 0}</div>`;
              if (dr && dr.newTier) modal += `<div class="reward-row">🏛️ ${U.esc(D.REPS[rw.rep].name)} 声望达到 <b>${dr.tier.name}</b>！</div>`;
            }
            if (raid.boss) W.Char.Codex.record(char, raid.boss, b.round, 'raid');
            modal += `<div class="reward-row dim">⏳ 今日限定奖励已领取，明日再来可获得新一轮奖励</div>`;
          } else {
            modal += `<div class="reward-row dim">今日限定奖励已领取，本次仅获得荣誉</div>`;
          }
          char.capitalRaid = null; // 奖励全部入账后再清空进度
          modal += `<div class="modal-actions"><button class="btn gold" data-continue>返回主城</button></div>`;
        } else if (raid) {
          char.capitalRaid.wave++;
          W.Char.rest(char);
          modal += `<div class="reward-row">深入敌营，队伍进行了休整，状态完全恢复</div>`;
          modal += `<div class="reward-row">突袭进度：<b>${char.capitalRaid.wave}/${raid.waves.length}</b></div>`;
          modal += `<div class="modal-actions"><button class="btn gold" data-continue>继续深入 →</button><button class="btn ghost" data-back>撤离</button></div>`;
        }
      } else {
        modal += `<div class="modal-actions"><button class="btn gold" data-continue>继续冒险</button></div>`;
      }
      modal += `</div>`;

      // 自动存档:战斗胜利是重要进度节点(经验/金币/掉落已入账)
      W.State.autoSave(true);
      // 锁定弹窗:点击遮罩不会关闭,必须通过按钮返回,避免卡在战斗界面
      W.UI.openModal(modal, { title: '战斗胜利', close: false, lock: true });
      const m = document.getElementById('modal-root');
      m.querySelector('[data-continue]').addEventListener('click', () => {
        W.UI.closeModal();
        if (dungeon && b.context === 'dungeon' && char.dungeon && char.dungeon.wave < dungeon.waves.length) {
          // 继续下一波
          setTimeout(() => this._dungeonNext(), 50);
        } else if (b.context === 'capitalraid' && char.capitalRaid && char.capitalRaid.wave < D.CAPITAL_RAIDS[char.capitalRaid.id].waves.length) {
          // 继续突袭下一波
          setTimeout(() => this._raidNext(), 50);
        } else {
          this.showWorld();
        }
      });
      const back = m.querySelector('[data-back]');
      if (back) back.addEventListener('click', () => {
        char.dungeon = null;
        char.capitalRaid = null; // 撤离突袭:清空进度,避免回到敌城后按钮静默失效
        W.UI.closeModal();
        this.showWorld();
      });
      const nextGo = m.querySelector('[data-ach-next-go]');
      if (nextGo) nextGo.addEventListener('click', () => this._achGoDungeon(char, nextGo.dataset.achNextGo));
    },

    /* 下一副本建议:通关后返回首个可直达的未通关副本(全部通关/无可达/回跳兜底均不提示) */
    _nextDungeonSuggestion(char) {
      const all = D.ACHIEVEMENTS.ach_dungeon_all;
      if (!all) return null;
      const cleared = char.dungeons || [];
      // 全部通关后 _achDungeonTarget 会回跳最低级副本,此时不再提示
      if (cleared.length >= Object.keys(D.DUNGEONS).length) return null;
      const d = this._achDungeonTarget(char, all);
      if (!d) return null;
      // 回跳兜底可能返回已通关副本(当前可达的全部清完),同样不提示
      if (cleared.includes(d)) return null;
      return d;
    },

    onBattleDefeat(b) {
      const char = W.State.character;
      const c = W.Char.computed(char);
      char.hp = Math.max(1, Math.floor(c.hpMax * C.REVIVE_HP_PCT));
      char.mana = Math.floor(c.manaMax * C.REVIVE_HP_PCT);
      char.rage = 0;
      // 回城(深入敌营失败同样撤离)
      char.zone = char.faction === 'alliance' ? 'stormwind' : 'orgrimmar';
      if (char.dungeon) char.dungeon = null;
      if (char.capitalRaid) char.capitalRaid = null;
      // 自动存档:死亡复活状态也要落盘,避免回档到战斗前
      W.State.autoSave(true);
      W.UI.openModal(`
        <div class="defeat">
          <div class="defeat-title">💀 你倒下了……</div>
          <p class="confirm-text">灵魂回到${char.faction === 'alliance' ? '暴风城' : '奥格瑞玛'}，在圣光（大地母亲）的庇护下复活。</p>
          <div class="reward-row">生命恢复至 ${Math.ceil(char.hp)}</div>
        </div>
        <div class="modal-actions"><button class="btn gold" data-continue>继续冒险</button></div>`,
        { title: '死亡', close: false, lock: true });
      document.getElementById('modal-root').querySelector('[data-continue]').addEventListener('click', () => {
        W.UI.closeModal();
        this.showWorld();
      });
    },

    // 副本通关宝箱:固定材料(数据驱动 DUNGEONS.chest) + 随机金币;背包满时材料跳过并提示
    _dungeonChest(char, dungeon) {
      const c = dungeon.chest || { items: [], gold: [600, 1200] };
      const rows = [];
      let skipped = false;
      for (const [iid, n] of (c.items || [])) {
        const it = D.ITEMS[iid];
        if (!it) continue;
        if (it.slot !== 'consumable' && W.Char.Inventory.list(char).length >= W.Char.bagSize(char)) { skipped = true; continue; }
        W.Char.Inventory.add(char, iid, n);
        rows.push(`${it.icon}${U.esc(it.name)}×${n}`);
      }
      if (skipped) W.UI.toast('🎒 背包已满，部分宝箱材料未能拾取', 'warn');
      const gold = Math.floor(RNG.int(c.gold[0], c.gold[1]) * W.Char.computed(char).goldMult);
      char.gold += gold;
      rows.push(`金币 ${U.plainMoney(gold)}`);
      return rows.join(' · ');
    },

    // 任务奖励文本(同名物品合并计数)
    _questRewardText(items) {
      const cnt = {};
      for (const iid of items || []) cnt[iid] = (cnt[iid] || 0) + 1;
      return Object.keys(cnt).map((iid) => {
        const it = D.ITEMS[iid];
        return it ? `${it.icon}${U.esc(it.name)}${cnt[iid] > 1 ? '×' + cnt[iid] : ''}` : iid;
      }).join('、');
    },

    /* ---------- 商店 ---------- */
    openShop() {
      // 重绘后的滚动位置由 UI.openModal 统一保持(同标题弹窗刷新不跳回顶部)
      const char = W.State.character;
      const zone = D.ZONES[char.zone];
      const stock = zone.shop || [];
      const list = stock.filter((id) => {
        const it = D.ITEMS[id];
        return it && it.level <= char.level + 3;
      });
      const inv = W.Char.Inventory.list(char);
      let html = `<div class="shop-head"><span class="shop-title">🛒 ${U.esc(zone.shopName)}</span><span class="shop-gold">💰 金币 ${U.money(char.gold)}</span></div>`;
      html += `<div class="shop-buy"><div class="sub-title">🛒 购买商品<span class="sub-note">${list.length} 件</span></div>`;
      if (!list.length) html += '<div class="empty">这里没有适合你的商品</div>';
      for (const id of list) {
        const it = D.ITEMS[id];
        const afford = char.gold >= it.buy;
        html += this._itemRow(it, 'buy', afford);
      }
      html += '</div><div class="shop-sell"><div class="sub-title">💰 出售背包物品<span class="sub-note">${inv.length} 件</span></div>';
      if (!inv.length) html += '<div class="empty">背包空空如也</div>';
      for (const s of inv) {
        const it = D.ITEMS[s.id];
        if (!it) continue;
        html += this._itemRow(it, 'sell', true, s.count);
      }
      html += '</div>';
      W.UI.openModal(html, { title: '商店 · ' + zone.shopName });
      this._bindShop();
    },

    // 物品基础属性文案(商店与背包共用):装备属性 / 消耗品效果
    _itemStatsParts(it, perf) {
      const parts = [];
      const m = perf ? W.Config.PERFECT_STAT_MULT : 1;
      if (it.stats) {
        if (it.stats.dmg) parts.push(`伤害 ${Math.round(it.stats.dmg[0] * m)}-${Math.round(it.stats.dmg[1] * m)}`);
        if (it.stats.armor) parts.push(`护甲 ${Math.round(it.stats.armor * m)}`);
        for (const k of ['str', 'agi', 'stam', 'int', 'spi']) if (it.stats[k]) parts.push({ str: '力量', agi: '敏捷', stam: '耐力', int: '智力', spi: '精神' }[k] + ' +' + Math.round(it.stats[k] * m));
        if (it.stats.crit) parts.push('暴击 +' + Math.round(it.stats.crit * m * 100) + '%');
      }
      if (it.consumable) {
        if (it.consumable.heal) parts.push('恢复 ' + it.consumable.heal + ' 生命');
        if (it.consumable.mana) parts.push('恢复 ' + it.consumable.mana + ' 法力');
      }
      if (it.slot === 'bag') parts.push(`🎒 使用后容量 +${it.bagSize} 格`);
      return parts;
    },

    // 物品(含强化/附魔)的属性数值表,用于背包内新旧装备对比
    _itemStatMap(it, up, perf) {
      const m = {};
      if (!it) return m;
      const mult = perf ? W.Config.PERFECT_STAT_MULT : 1;
      if (it.stats) {
        if (it.stats.dmg) { m.dmgMin = Math.round(it.stats.dmg[0] * mult); m.dmgMax = Math.round(it.stats.dmg[1] * mult); }
        if (it.stats.armor) m.armor = Math.round(it.stats.armor * mult);
        if (it.stats.crit) m.crit = Math.round(it.stats.crit * mult * 100) / 100;
        for (const k of ['str', 'agi', 'stam', 'int', 'spi']) if (it.stats[k]) m[k] = Math.round(it.stats[k] * mult);
      }
      const ub = W.Char.upgradeBonus(it, up);
      if (ub.dmg) { m.dmgMin = (m.dmgMin || 0) + ub.dmg; m.dmgMax = (m.dmgMax || 0) + ub.dmg; }
      if (ub.armor) m.armor = (m.armor || 0) + ub.armor;
      if (ub.crit) m.crit = (m.crit || 0) + ub.crit;
      if (ub.dodge) m.dodge = (m.dodge || 0) + ub.dodge;
      if (ub.hp) m.hp = (m.hp || 0) + ub.hp;
      if (ub.lifesteal) m.lifesteal = (m.lifesteal || 0) + ub.lifesteal;
      for (const k of ['str', 'agi', 'stam', 'int', 'spi']) if (ub[k]) m[k] = (m[k] || 0) + ub[k];
      return m;
    },
    // 单个对比项(绿升/红降/百分比属性;区间按总和判断升降)
    _cmpPart(label, d, d2, isPct) {
      const cls = (d + (d2 || 0)) > 0 ? 'cmp-up' : 'cmp-down';
      const fmt = (v) => (v > 0 ? '+' : '') + (isPct ? (Math.round(v * 1000) / 10) + '%' : v);
      const t = d2 != null && d !== d2 ? `${label} ${fmt(d)}~${fmt(d2)}` : `${label} ${fmt(d)}`;
      return `<span class="${cls}">${t}</span>`;
    },
    // 背包内装备 vs 已装备的对比提示
    _compareEquip(newIt, newUp, curIt, curUp, newPerf, curPerf) {
      const a = this._itemStatMap(newIt, newUp, newPerf);
      const b = this._itemStatMap(curIt, curUp, curPerf);
      const labels = { armor: '护甲', str: '力量', agi: '敏捷', stam: '耐力', int: '智力', spi: '精神', crit: '暴击', dodge: '闪避', hp: '生命', lifesteal: '吸血' };
      const parts = [];
      if (a.dmgMin != null || b.dmgMin != null) {
        const dMin = (a.dmgMin || 0) - (b.dmgMin || 0);
        const dMax = (a.dmgMax || 0) - (b.dmgMax || 0);
        if (dMin !== 0 || dMax !== 0) parts.push(this._cmpPart('伤害', dMin, dMax, false));
      }
      for (const k of ['armor', 'str', 'agi', 'stam', 'int', 'spi', 'crit', 'dodge', 'hp', 'lifesteal']) {
        if (a[k] == null && b[k] == null) continue;
        const d = (a[k] || 0) - (b[k] || 0);
        if (d !== 0) parts.push(this._cmpPart(labels[k], d, null, k === 'crit' || k === 'dodge' || k === 'lifesteal'));
      }
      if (!parts.length) return '<div class="item-compare same">↔️ 与已装备属性相当</div>';
      return `<div class="item-compare">对比已装备：${parts.join(' ')}</div>`;
    },

    _itemRow(it, mode, enabled, count) {
      const nameColor = U.QUALITY_COLOR[it.quality];
      const parts = this._itemStatsParts(it);
      let statsHtml = parts.length ? `<div class="item-stats">${U.esc(parts.join(' · '))}</div>` : '';
      const price = mode === 'buy' ? it.buy : Math.max(1, Math.floor((it.sell != null ? it.sell : it.buy * 0.4)));
      return `
        <div class="item-row" data-item="${it.id}" data-mode="${mode}">
          <span class="item-icon">${it.icon}</span>
          <div class="item-info">
            <div class="item-name" style="color:${nameColor}">${U.esc(it.name)}${it.quality !== 'white' ? ` <span class="tag q-${it.quality}">${it.quality === 'green' ? '优秀' : it.quality === 'blue' ? '精良' : it.quality === 'legendary' ? '传说' : '史诗'}</span>` : ''}${count ? ` <span class="item-count">×${count}</span>` : ''}</div>
            ${statsHtml}
          </div>
          <div class="item-price">${mode === 'buy' ? U.money(price) : '+ ' + U.money(price)}</div>
          <button class="btn small ${enabled ? '' : 'disabled'}" ${enabled ? '' : 'disabled'}>${mode === 'buy' ? '购买' : '出售'}</button>
        </div>`;
    },

    _bindShop() {
      const m = document.getElementById('modal-root');
      m.querySelectorAll('.item-row').forEach((row) => {
        row.querySelector('button').addEventListener('click', () => {
          const char = W.State.character;
          const it = D.ITEMS[row.dataset.item];
          if (row.dataset.mode === 'buy') {
            if (char.gold < it.buy) { W.UI.toast('金币不足', 'warn'); return; }
            if (W.Char.Inventory.list(char).length >= W.Char.bagSize(char) && it.slot !== 'consumable' && it.slot !== 'bag') { W.UI.toast('背包已满', 'warn'); return; }
            char.gold -= it.buy;
            W.Char.Inventory.add(char, it.id, 1);
            W.Audio.heal();
            W.UI.toast(`购买了 ${it.name}`);
            // 购买会新增背包行+改变金币,局部更新需插入新行,收益低;保持整弹窗重绘(滚动由 openModal 保持)
            this.openShop();
          } else {
            const price = Math.max(1, Math.floor((it.sell != null ? it.sell : it.buy * 0.4)));
            char.gold += price;
            W.Char.Inventory.remove(char, it.id, 1);
            W.Audio.click();
            W.UI.toast(`出售了 ${it.name}，获得 ${U.plainMoney(price)}`);
            // 局部更新:删行/改堆叠数量 + 刷新金币/出售计数/购买可购态/空态,不做整弹窗重绘
            this._shopSellPartialUpdate(m, char, row, it.id);
          }
        }, { once: false });
      });
    },

    // 商店出售后局部更新:删行/改堆叠数量 + 刷新金币显示/出售区件数/购买按钮可购态/空态,避免整弹窗重绘
    _shopSellPartialUpdate(m, char, row, itemId) {
      const inv = W.Char.Inventory.list(char);
      // 1) 该行:堆叠未卖完只改数量角标,卖完则整行移除
      const st = inv.find((s) => s.id === itemId);
      if (st && st.count > 0) {
        const cnt = row.querySelector('.item-count');
        if (cnt) cnt.textContent = '×' + st.count;
      } else {
        row.remove();
      }
      // 2) 空态:背包清空时补「空空如也」(与整弹窗渲染时位置一致:出售区标题之后)
      if (!inv.length && !m.querySelector('.shop-sell .empty')) {
        const sellBox = m.querySelector('.shop-sell');
        if (sellBox) {
          const empty = document.createElement('div');
          empty.className = 'empty';
          empty.textContent = '背包空空如也';
          const title = sellBox.querySelector('.sub-title');
          if (title && title.nextSibling) sellBox.insertBefore(empty, title.nextSibling);
          else sellBox.appendChild(empty);
        }
      }
      // 3) 金币显示(顶部 shop-head)
      const goldEl = m.querySelector('.shop-gold');
      if (goldEl) goldEl.textContent = `💰 金币 ${U.money(char.gold)}`;
      // 4) 出售区件数角标
      const note = m.querySelector('.shop-sell .sub-note');
      if (note) note.textContent = `${inv.length} 件`;
      // 5) 购买按钮可购态:金币增加后先前买不起的商品可能解锁(仅变启用,不会变回禁用)
      m.querySelectorAll('.item-row[data-mode="buy"]').forEach((r) => {
        const bit = D.ITEMS[r.dataset.item];
        const afford = !!bit && char.gold >= bit.buy;
        const b = r.querySelector('button');
        if (b) {
          b.classList.toggle('disabled', !afford);
          b.disabled = !afford;
        }
      });
    },

    /* ---------- 旅店 ---------- */
    openInn() {
      const char = W.State.character;
      const zone = D.ZONES[char.zone];
      const c = W.Char.computed(char);
      W.UI.openModal(`
        <div class="inn-scene">🏨 <b>${U.esc(zone.name)}</b> 的旅店</div>
        <p class="confirm-text">在温暖的炉火旁休息，恢复全部生命与法力。</p>
        <div class="inn-status">
          <div class="inn-stat">❤️ 生命 <b>${Math.ceil(char.hp)}</b>/${c.hpMax}</div>
          ${c.manaMax ? `<div class="inn-stat">💧 法力 <b>${Math.ceil(char.mana)}</b>/${c.manaMax}</div>` : ''}
        </div>
        <div class="modal-actions">
          <button class="btn gold" data-rest>🛌 休息恢复</button>
        </div>`, { title: '旅店' });
      const m = document.getElementById('modal-root');
      m.querySelector('[data-rest]').addEventListener('click', () => {
        W.Char.rest(char);
        W.State.autoSave(true); // 旅店休息是天然存档点
        W.Audio.heal();
        W.UI.closeModal();
        W.UI.toast('你恢复了全部状态', 'ok');
        this.showWorld();
      });
    },

    /* ---------- 任务板 ---------- */
    openQuestBoard() {
      const char = W.State.character;
      const zone = D.ZONES[char.zone];
      let html = '';
      let nOpen = 0, nActive = 0, nTurnin = 0;
      for (const qid of zone.quests) {
        const q = D.QUESTS[qid];
        const qs = char.quests[qid];
        const completed = char.completedQuests.includes(qid);
        if (completed) {
          html += `<div class="quest-row done"><span class="qi">✅</span><div><div class="quest-name">${U.esc(q.name)}</div><div class="quest-desc">已完成</div></div></div>`;
          continue;
        }
        if (qs && qs.done) nTurnin++; else if (qs) nActive++; else nOpen++;
        html += `
          <div class="quest-row">
            <span class="qi">📜</span>
            <div class="quest-body">
              <div class="quest-name">${U.esc(q.name)}</div>
              <div class="quest-desc">${U.esc(q.desc)}</div>
              <div class="quest-reward">奖励：${q.exp} 经验 · ${U.plainMoney(q.gold)}${q.rewardItems.length ? ' · ' + this._questRewardText(q.rewardItems) : ''}</div>
              ${qs ? `<div class="quest-progress">进度 ${qs.progress}/${q.count}${qs.done ? ' — <b class="ok-text">可以交付</b>' : ''}</div>` : ''}
            </div>
            <div class="quest-actions">
              ${qs && qs.done ? `<button class="btn gold small" data-turnin="${qid}">交付</button>` : (!qs ? `<button class="btn small" data-accept="${qid}">接取</button>` : '')}
            </div>
          </div>`;
      }
      if (!html) html = '<div class="empty">这里没有任务</div>';
      // 统计头部:仅当该区域确实有任务时渲染(避免空任务板显示全 0 统计)
      const head = zone.quests && zone.quests.length
        ? `<div class="quest-head">📜 任务板<span class="qhd">可接取 <b>${nOpen}</b></span><span class="qhd">进行中 <b>${nActive}</b></span><span class="qhd">可交付 <b class="ok-text">${nTurnin}</b></span></div>`
        : '';
      W.UI.openModal(head + html, { title: '任务板 · ' + zone.name });

      const m = document.getElementById('modal-root');
      m.querySelectorAll('[data-accept]').forEach((btn) => btn.addEventListener('click', () => {
        const qid = btn.dataset.accept;
        if (W.Char.QuestLog.start(char, qid)) { W.UI.toast('接取了任务', 'ok'); this.openQuestBoard(); }
      }));
      m.querySelectorAll('[data-turnin]').forEach((btn) => btn.addEventListener('click', () => {
        const r = W.Char.QuestLog.turnIn(char, btn.dataset.turnin);
        if (r) {
          W.Audio.levelup();
          W.State.autoSave(true); // 任务交付:经验/金币/奖励已入账
          const eg = r.events ? r.events.find((e) => e.type === 'expGold') : null;
          const tp = r.events ? r.events.filter((e) => e.level >= 10).length : 0;
          W.UI.toast(`任务完成！${eg ? `+${eg.amount} 经验已转为 ${U.plainMoney(eg.gold)} 金币` : `+${r.exp} 经验`}${tp ? `，🌟 获得 ${tp} 点天赋点` : ''}`, 'ok');
          this.openQuestBoard();
        }
      }));
    },

    /* ---------- 旅行 ---------- */
    // 区域邻接表:普通旅行边 + 直达航线边(飞艇/远洋)
    _zoneNeighbors(zid) {
      const set = new Set(D.ZONES[zid].travel || []);
      const air = D.AIRSHIPS[zid];
      if (air) for (const n of air.to) set.add(n);
      return set;
    },
    // 全图最短路径(BFS):计算当前位置到每个区域的跳数,直达区域即「最近路径」;直达航线作为 1 跳边并入
    _travelGraph() {
      const char = W.State.character;
      const dist = { [char.zone]: 0 };
      const prev = {};
      const queue = [char.zone];
      while (queue.length) {
        const cur = queue.shift();
        for (const n of this._zoneNeighbors(cur)) {
          if (dist[n] == null) { dist[n] = dist[cur] + 1; prev[n] = cur; queue.push(n); }
        }
      }
      return { dist, prev };
    },
    // 推荐等级排序键:区域 level 为区间字符串('7-12'),取起始数值
    _zoneLevelKey(zid) { return parseInt(D.ZONES[zid].level, 10) || 0; },
    // 未接任务数:该区域尚未接取且未完成的任务(与任务板「可接取」口径一致)
    _zoneQuestOpen(char, zid) {
      const z = D.ZONES[zid];
      if (!z || !z.quests || !z.quests.length) return 0;
      let n = 0;
      const accepted = char.quests || {};
      const doneList = char.completedQuests || [];
      for (const qid of z.quests) {
        if (!accepted[qid] && !doneList.includes(qid)) n++;
      }
      return n;
    },
    // 最短路径链条(含起点,id 序列):用于悬停提示与首站跳转
    _zonePathIds(zid, prev) {
      const p = []; let x = zid;
      while (prev[x]) { p.unshift(x); x = prev[x]; }
      p.unshift(x);
      return p;
    },
    _zonePath(zid, prev) { return this._zonePathIds(zid, prev).map((i) => D.ZONES[i].name).join(' → '); },
    // 最近路径第一步(从当前位置出发的下一站);直达时即目标本身
    _firstHop(zid, prev) { const p = this._zonePathIds(zid, prev); return p.length > 1 ? p[1] : zid; },
    openTravel() {
      const char = W.State.character;
      const zone = D.ZONES[char.zone];
      const { dist, prev } = this._travelGraph();
      const airHere = D.AIRSHIPS[char.zone] || null;
      const direct = Object.keys(dist).filter((z) => dist[z] === 1).length;
      const maxHops = Object.keys(dist).reduce((m, z) => Math.max(m, dist[z]), 0);
      // 分区:🚀 直达(当前所在 + 飞艇/远洋航线 + 步行直达) 与 🗺️ 中转地图(需多跳),各自按推荐等级升序(当前置顶)
      const levelSort = (a, b) => {
        if (a === char.zone) return -1;
        if (b === char.zone) return 1;
        const dl = this._zoneLevelKey(a) - this._zoneLevelKey(b);
        return dl || (dist[a] - dist[b]);
      };
      const { directZones, mapZones } = this._travelPartition(dist, char);
      const questOpenTotal = Object.keys(dist).reduce((s, z) => s + this._zoneQuestOpen(char, z), 0);
      const byAirZones = airHere ? airHere.to.filter((z) => dist[z] === 1) : [];
      // 中转区折叠偏好:默认折叠,点击标题展开/收起(跨会话持久化)
      const mapCollapsed = this._travelMapCollapsed();
      let html = `<div class="travel-hint">📡 从 <b>${U.esc(zone.name)}</b> 出发 · 直连 <b>${direct}</b> 个区域${airHere ? ` · <b class="th-air">${airHere.icon} ${airHere.name} ${byAirZones.length} 条</b>` : ''} · 中转 <b>${mapZones.length}</b> 个 · 最远 ${maxHops} 站 · ${questOpenTotal ? `<b class="th-quest">📜 全图可接任务 ${questOpenTotal}</b>` : '📜 无待接任务'} · <b class="th-direct">🚀 直达=最近路径</b> · 中转区默认折叠,点击标题展开</div>`;
      // ===== 分区一:直达(当前位置 + 飞艇/远洋 + 步行直达) =====
      html += `<div class="travel-sec direct-sec">${this._travelSecTitle('🚀', '直达', Math.max(0, directZones.length - 1), '')}<div class="travel-list">`;
      for (const zid of directZones) html += this._travelRowHtml(zid, { airHere, dist, prev });
      html += '</div></div>';
      // ===== 分区二:中转地图(需多跳,默认折叠,点击标题展开/收起) =====
      html += `<div class="travel-sec map-sec${mapCollapsed ? ' collapsed' : ''}">${this._travelSecTitle('🗺️', '中转区域', mapZones.length, 'map', mapCollapsed)}<div class="travel-list">`;
      for (const zid of mapZones) html += this._travelRowHtml(zid, { airHere, dist, prev });
      html += '</div></div>';
      W.UI.openModal(html, { title: '旅行 · 从 ' + zone.name + ' 出发' });
      const m = document.getElementById('modal-root');
      // 中转区标题点击/键盘:展开/收起(偏好持久化)
      const mapTitleEl = m.querySelector('.travel-sec.map-sec .travel-sec-title');
      if (mapTitleEl) {
        const toggleMap = () => {
          const sec = mapTitleEl.closest('.travel-sec');
          const collapsed = sec.classList.toggle('collapsed');
          const tg = mapTitleEl.querySelector('.sec-toggle');
          if (tg) tg.textContent = collapsed ? '▸ 展开' : '▾ 收起';
          mapTitleEl.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
          try { localStorage.setItem('wow_travel_transit_collapsed', collapsed ? '1' : '0'); } catch (e) {}
          W.Audio.click();
        };
        mapTitleEl.addEventListener('click', toggleMap);
        mapTitleEl.addEventListener('keydown', (ev) => {
          if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); toggleMap(); }
        });
      }
      m.querySelectorAll('.travel-row:not(.locked)').forEach((row) => row.addEventListener('click', () => {
        const zid = row.dataset.zone;
        if (zid === char.zone) return; // 当前所在区域不可再次出发
        // 直达航线:乘飞艇/商船直接抵达;多跳区域沿最近路径前往首站;其余直达区域直接出发
        const byAir = !!airHere && airHere.to.includes(zid);
        const hops = dist[zid];
        const dest = byAir || hops === 1 ? zid : this._firstHop(zid, prev);
        if (byAir) W.UI.toast(`${airHere.icon} 乘坐${airHere.name}直达 ${U.esc(D.ZONES[zid].name)}`, 'ok');
        else if (hops > 1) W.UI.toast(`🛣️ ${U.esc(D.ZONES[zid].name)} 距此 ${hops} 站，沿最近路径先到 ${U.esc(D.ZONES[dest].name)}`, 'warn');
        const dz = D.ZONES[dest];
        if (!char.visited.includes(dest)) char.visited.push(dest);
        if (dz.dungeon) { char.dungeon = { id: dz.dungeon, wave: 0 }; }
        else if (char.dungeon) char.dungeon = null;
        char.capitalRaid = null; // 旅行离开即放弃突袭进度
        char.zone = dest;
        W.State.autoSave(true);
        W.Audio.click();
        W.UI.closeModal();
        this.showWorld();
      }));
    },
    // 旅行分区划分(纯函数):直达区 = 当前 + 1 跳;中转区 = 多跳;并集覆盖全图
    _travelPartition(dist, char) {
      const levelSort = (a, b) => {
        if (a === char.zone) return -1;
        if (b === char.zone) return 1;
        const dl = this._zoneLevelKey(a) - this._zoneLevelKey(b);
        return dl || (dist[a] - dist[b]);
      };
      const directZones = Object.keys(dist).filter((z) => z === char.zone || dist[z] === 1).sort(levelSort);
      const mapZones = Object.keys(dist).filter((z) => dist[z] > 1).sort(levelSort);
      return { directZones, mapZones };
    },
    // 中转区折叠偏好:默认折叠,偏好持久化(0=展开,1=折叠)
    _travelMapCollapsed() {
      try { return localStorage.getItem('wow_travel_transit_collapsed') !== '0'; } catch (e) { return true; }
    },
    // 旅行分区标题(直达/中转;中转可带折叠开关,支持键盘操作)
    _travelSecTitle(icon, name, n, cls, collapsed) {
      const isMap = cls === 'map';
      const toggle = isMap
        ? `<span class="sec-toggle">${collapsed ? '▸ 展开' : '▾ 收起'}</span>`
        : '';
      const attrs = isMap
        ? ` role="button" tabindex="0" aria-expanded="${collapsed ? 'false' : 'true'}" title="点击展开/收起中转区域"`
        : '';
      return `<div class="travel-sec-title ${cls}"${attrs}>${icon} ${name}<span class="sec-count">${n} 个</span>${toggle}</div>`;
    },
    // 旅行行渲染(直达/中转分区共用):徽标、等级、任务、稀有/世界首领、动作标签
    _travelRowHtml(zid, ctx) {
      const char = W.State.character;
      const z = D.ZONES[zid];
      if (!z) return '';
      const { airHere, dist, prev } = ctx;
      const hops = dist[zid];
      const isCur = zid === char.zone;
      const isDungeon = !!z.dungeon;
      const locked = isDungeon && char.level < (D.DUNGEONS[z.dungeon].minLevel || 1);
      const rareAlive = !isDungeon && W.Char.eliteStatus(char, zid).some((e) => e.alive);
      const wbSt = !isDungeon ? W.Char.worldBossStatus(char).find((s) => s.zoneId === zid) : null;
      const wbAlive = !!wbSt && wbSt.alive;
      const wbDead = !!wbSt && !wbSt.alive;
      // 直达航线(飞艇/远洋):独立徽标与行高亮,1 跳直达
      const byAir = !!airHere && airHere.to.includes(zid);
      // 最近路径:直达=1 跳(高亮);多跳显示跳数与首站
      const pathBadge = isCur ? '' : byAir
        ? `<span class="tz-hop air">${airHere.icon} ${airHere.name}</span>`
        : hops === 1
          ? '<span class="tz-hop direct">🚀 直达</span>'
          : `<span class="tz-hop">🛣️ ${hops} 站</span>`;
      const pathLine = isCur || hops === 1 ? '' : ` · <span class="tz-first">首站 ${U.esc(D.ZONES[this._firstHop(zid, prev)].name)}</span>`;
      const qOpen = this._zoneQuestOpen(char, zid);
      const pathTitle = hops > 1 ? '最近路径:' + this._zonePath(zid, prev) : '';
      const goLabel = isCur ? '<span class="tz-cur">已在此处</span>' : (hops === 1 ? '<span class="tz-go">出发 →</span>' : '<span class="tz-go">首站 →</span>');
      return `
          <div class="travel-row ${locked ? 'locked' : ''}${isCur ? ' is-cur' : ''}${!isCur && !locked && byAir ? ' is-air' : ''}${!isCur && !locked && !byAir && hops === 1 ? ' is-direct' : ''}" data-zone="${zid}" ${pathTitle ? `title="${U.esc(pathTitle)}"` : ''}>
            <span class="tz-icon">${z.icon}</span>
            <div class="tz-info">
              <div class="tz-name">${U.esc(z.name)}${isDungeon ? ` <span class="tag ${D.DUNGEONS[z.dungeon].raid ? 'raid-tag' : 'd5-tag'}">${D.DUNGEONS[z.dungeon].raid ? '团本' : '5人本'}</span>` : ''}${isCur ? '<span class="tag cur-tag">📍 当前所在</span>' : ''}${z.faction === 'alliance' ? ' <span class="tag ally-tag">联盟</span>' : z.faction === 'horde' ? ' <span class="tag horde-tag">部落</span>' : ''}${rareAlive ? '<span class="tz-elite">🔥 稀有精英出没</span>' : ''}${wbAlive ? '<span class="tz-elite wb">🌍 世界首领出没</span>' : ''}${wbDead ? `<span class="tz-elite wb">🌍 首领刷新中 ${this._fmtCd(wbSt.remainingMs)}</span>` : ''}</div>
              <div class="tz-level">推荐等级 ${z.level}${qOpen && !locked ? ` · <span class="tz-quest">📜 可接 ${qOpen}</span>` : ''}${pathLine}</div>
            </div>
            ${locked ? '<span class="tz-lock">等级不足</span>' : (pathBadge + goLabel)}
          </div>`;
    },

    /* ---------- 状态 ---------- */
    /* ---------- 成就 ---------- */
    // 成就副本类型标签:target 指定副本 → 团本/5人本;无 target 的副本类成就按范围归类
    _achDungeonTag(a) {
      if (a.target && D.DUNGEONS[a.target]) {
        return D.DUNGEONS[a.target].raid
          ? '<span class="tag raid-tag">团本</span>'
          : '<span class="tag d5-tag">5人本</span>';
      }
      if (a.id === 'ach_dungeon_all') return '<span class="tag raid-tag">团本</span><span class="tag d5-tag">5人本</span>';
      if (a.id === 'ach_dungeon_1') return '<span class="tag d5-tag">5人本</span>';
      return '';
    },
    // 成就直达副本:target 指定副本优先;多副本成就(初次试炼/副本征服者)跳首个未通关副本(按推荐等级升序,限当前可进入)
    _achDungeonTarget(char, a) {
      if (a.target && D.DUNGEONS[a.target]) return a.target;
      if (a.id !== 'ach_dungeon_1' && a.id !== 'ach_dungeon_all') return null;
      const list = Object.values(D.DUNGEONS)
        .filter((d) => char.level >= (d.minLevel || 1))
        .sort((x, y) => (x.minLevel || 1) - (y.minLevel || 1));
      const cleared = char.dungeons || [];
      const next = list.find((d) => !cleared.includes(d.id)) || list[0];
      return next ? next.id : null;
    },
    // 成就直达副本:切换到对应入口区域并进入副本(等级不足或找不到入口时提示)
    _achGoDungeon(char, dgid) {
      const d = D.DUNGEONS[dgid];
      if (!d) return;
      if (char.level < (d.minLevel || 1)) { W.UI.toast(`需要 ${d.minLevel} 级才能进入${d.name}`, 'warn'); return; }
      const zoneId = Object.keys(D.ZONES).find((z) => D.ZONES[z].dungeon === dgid);
      if (!zoneId) { W.UI.toast('找不到该副本入口', 'warn'); return; }
      char.dungeon = { id: dgid, wave: 0 };
      char.zone = zoneId;
      if (!char.visited.includes(zoneId)) char.visited.push(zoneId);
      W.State.autoSave(true);
      W.Audio.click();
      W.UI.closeModal();
      this.showWorld();
    },
    openAchievements() {
      const char = W.State.character;
      const st = W.Char.Achievements.state(char);
      const total = Object.keys(D.ACHIEVEMENTS).length;
      const got = W.Char.Achievements.unlocked(char);
      // 重置筛选状态:每次打开都是全新列表
      this._achFilter = { q: '', done: 'all', raid: false, reach: false };
      const f = this._achFilter;
      const chip = (on) => `btn tiny chip ach-chip${on ? ' active' : ''}`;
      const c = (patch) => this._achCount(char, st, patch);
      W.UI.openModal(`
        <div class="ach-panel">
          <div class="ach-summary">🏅 已达成 <b style="color:var(--gold)">${got}</b> / ${total} 项成就</div>
          <div class="ach-toolbar">
            <input class="ach-search" data-ach-search placeholder="🔍 搜索成就名称 / 描述" value="${U.esc(f.q)}">
            <div class="ach-chips">
              <button class="${chip(f.done === 'all')}" data-ach-done="all">全部（<b data-ach-count="all">${c({ done: 'all' })}</b>）</button>
              <button class="${chip(f.done === 'todo')}" data-ach-done="todo">⏳ 未完成（<b data-ach-count="todo">${c({ done: 'todo' })}</b>）</button>
              <button class="${chip(f.raid)}" data-ach-raid="1">🔥 团本（<b data-ach-count="raid">${c({ raid: true })}</b>）</button>
              <button class="${chip(f.reach)}" data-ach-reach="1">🧭 可直达（<b data-ach-count="reach">${c({ reach: true })}</b>）</button>
            </div>
          </div>
          <div class="ach-body">${this._achRowsHtml(char, st)}</div>
        </div>`, { title: '🏅 成就' });
      const m = document.getElementById('modal-root');
      const search = m.querySelector('[data-ach-search]');
      const sync = () => this._syncAchChips(m, char, st);
      if (search) search.addEventListener('input', () => { this._achFilter.q = search.value; this._renderAchBody(char, st); sync(); });
      m.querySelectorAll('[data-ach-done]').forEach((b) => b.addEventListener('click', () => {
        this._achFilter.done = b.dataset.achDone; this._renderAchBody(char, st); sync();
      }));
      m.querySelectorAll('[data-ach-raid]').forEach((b) => b.addEventListener('click', () => {
        this._achFilter.raid = !this._achFilter.raid; this._renderAchBody(char, st); sync();
      }));
      m.querySelectorAll('[data-ach-reach]').forEach((b) => b.addEventListener('click', () => {
        this._achFilter.reach = !this._achFilter.reach; this._renderAchBody(char, st); sync();
      }));
      this._renderAchBody(char, st);
      sync();
    },

    /* 实时芯片计数:按当前筛选+补丁口径计算(随搜索/切换联动) */
    _achCount(char, st, patch) {
      const base = Object.assign({ q: this._achFilter.q, done: this._achFilter.done, raid: this._achFilter.raid, reach: this._achFilter.reach }, patch);
      let n = 0;
      for (const a of Object.values(D.ACHIEVEMENTS)) if (this._achMatchFilter(char, a, st, base)) n++;
      return n;
    },

    /* 同步筛选芯片激活态与实时计数(工具栏在 ach-body 外,需单独刷新) */
    _syncAchChips(m, char, st) {
      const f = this._achFilter;
      m.querySelectorAll('[data-ach-done]').forEach((b) => b.classList.toggle('active', b.dataset.achDone === f.done));
      m.querySelectorAll('[data-ach-raid]').forEach((b) => b.classList.toggle('active', !!f.raid));
      m.querySelectorAll('[data-ach-reach]').forEach((b) => b.classList.toggle('active', !!f.reach));
      m.querySelectorAll('[data-ach-count]').forEach((b) => {
        const key = b.dataset.achCount;
        const patch = key === 'all' ? { done: 'all' } : key === 'todo' ? { done: 'todo' } : key === 'raid' ? { raid: true } : { reach: true };
        b.textContent = this._achCount(char, st, patch);
      });
    },

    /* 成就筛选匹配:搜索关键词 / 未完成 / 团本 / 可直达 */
    _achMatchFilter(char, a, st, f) {
      f = f || this._achFilter;
      const q = (f.q || '').trim().toLowerCase();
      if (q && !(a.name + a.desc + (a.icon || '')).toLowerCase().includes(q)) return false;
      if (f.done === 'todo' && st.unlocked[a.id]) return false;
      if (f.raid && !(a.target && D.DUNGEONS[a.target] && D.DUNGEONS[a.target].raid)) return false;
      if (f.reach && !this._achReachable(char, a)) return false;
      return true;
    },

    /* 成就是否可直达(目标副本存在且等级达标) */
    _achReachable(char, a) {
      const d = this._achDungeonTarget(char, a);
      if (!d) return false;
      const dg = D.DUNGEONS[d];
      return !!dg && char.level >= (dg.minLevel || 1);
    },

    /* 成就面板列表(应用当前筛选,局部重渲染用) */
    _achRowsHtml(char, st) {
      const cats = [['dungeon', '副本'], ['boss', '首领'], ['forge', '锻造'], ['combat', '战斗'], ['level', '等级'], ['set', '套装']];
      const rows = cats.map(([cid, cname]) => {
        // 副本系按推荐等级升序(泛用成就置顶),其余保持注册顺序
        const list = Object.values(D.ACHIEVEMENTS).filter((a) => a.cat === cid && this._achMatchFilter(char, a, st)).sort((x, y) => {
          if (cid !== 'dungeon') return 0;
          const xl = x.target && D.DUNGEONS[x.target] ? D.DUNGEONS[x.target].minLevel : -1;
          const yl = y.target && D.DUNGEONS[y.target] ? D.DUNGEONS[y.target].minLevel : -1;
          if (xl !== yl) return xl - yl;
          return (x.name || '').localeCompare(y.name || '');
        });
        if (!list.length) return '';
        const items = list.map((a) => {
          const done = !!st.unlocked[a.id];
          const dtag = this._achDungeonTag(a);
          const dtarget = this._achDungeonTarget(char, a);
          // 直达按钮带推荐等级角标:等级不足显示 🔒 锁定态(可点击,点击时提示等级要求)
          let goBtn = '';
          if (dtarget) {
            const dg = D.DUNGEONS[dtarget];
            const lv = dg.minLevel || 1;
            const locked = char.level < lv;
            const dname = U.esc(dg ? dg.name : '');
            goBtn = ` <button class="btn tiny chip ach-go${locked ? ' locked' : ''}" data-ach-go="${dtarget}"${locked ? ' aria-disabled="true"' : ''} title="前往${dname}（推荐 Lv.${lv}）${locked ? ` · 需要 ${lv} 级才能进入` : ''}">${locked ? '🔒' : '🧭'} <b>Lv.${lv}</b> 前往</button>`;
          }
          const prog = W.Char.Achievements.progressOf(char, a);
          const rewardTxt = [
            a.reward && a.reward.gold ? U.plainMoney(a.reward.gold) + ' 金币' : '',
            a.reward && a.reward.exp ? a.reward.exp + ' 经验' : '',
            (a.reward && a.reward.items || []).length ? '物品奖励' : '',
          ].filter(Boolean).join(' · ');
          return `<div class="ach-row ${done ? 'done' : ''}">
            <span class="ach-icon">${done ? a.icon : '🔒'}</span>
            <div class="ach-info">
              <div class="ach-name">${U.esc(a.name)}${dtag}${goBtn}${done ? ' <span class="tag ach-tag">已达成</span>' : ''}</div>
              <div class="ach-desc">${U.esc(a.desc)}${a.count > 1 && a.id !== 'ach_level_60' ? `（${Math.min(prog, a.count)}/${a.count}）` : ''}</div>
              <div class="ach-reward">🎁 ${rewardTxt || '—'}</div>
            </div>
            ${done ? `<span class="ach-point">✔</span>` : `<div class="ach-progress"><div class="ach-progress-fill" style="width:${Math.min(100, Math.round(prog / a.count * 100))}%"></div></div>`}
          </div>`;
        }).join('');
        return `<div class="sub-title">${cname}系成就</div><div class="ach-list">${items}</div>`;
      }).join('');
      return rows || '<div class="ach-empty">🔍 没有匹配的成就，换个条件试试</div>';
    },

    /* 成就列表局部重渲染(保持搜索框焦点) */
    _renderAchBody(char, st) {
      const body = document.querySelector('#modal-root .ach-body');
      if (!body) return;
      body.innerHTML = this._achRowsHtml(char, st);
      body.querySelectorAll('[data-ach-go]').forEach((btn) => btn.addEventListener('click', () => this._achGoDungeon(char, btn.dataset.achGo)));
    },

    /* ---------- 首领图鉴 ---------- */
    openCodex() {
      const char = W.State.character;
      const codex = char.codex || {};
      const reg = W.Char.Codex.registry();
      const srcName = { raid: '团本', dungeon: '副本', world: '世界' };
      const groups = [['raid', '🔥 团本首领'], ['dungeon', '⚔️ 副本首领'], ['world', '🌍 世界首领']];
      const rows = groups.map(([src, title]) => {
        const list = reg.filter((r) => r.src === src);
        if (!list.length) return '';
        const items = list.map((r) => {
          const m = D.MONSTERS[r.mid];
          if (!m) return '';
          const e = codex[r.mid];
          if (!e) {
            return `<div class="cx-row locked">
              <span class="cx-icon">${U.esc(m.icon)}</span>
              <div class="cx-info">
                <div class="cx-name">${U.esc(m.name)} <span class="tag boss-tag">未击杀</span></div>
                <div class="cx-desc">${U.esc(r.source)} · Lv.${m.level}${m.title ? ' · ' + U.esc(m.title) : ''}</div>
              </div>
              <span class="cx-note">🔒 尚未击败</span>
            </div>`;
          }
          return `<div class="cx-row">
            <span class="cx-icon">${U.esc(m.icon)}</span>
            <div class="cx-info">
              <div class="cx-name">${U.esc(m.name)} <span class="tag cx-tag-${r.src}">${srcName[r.src]}</span></div>
              <div class="cx-desc">${U.esc(r.source)} · Lv.${m.level} · 首杀 ${e.firstAt ? U.fmtRelTime(e.firstAt) : '—'}</div>
            </div>
            <div class="cx-stats">
              <div class="cx-stat">⚔️ 击杀 <b>${e.kills}</b> 次</div>
              <div class="cx-stat">⚡ 最快 <b>${e.fastest}</b> 回合</div>
            </div>
          </div>`;
        }).join('');
        return `<div class="sub-title">${title}</div><div class="cx-list">${items}</div>`;
      }).join('');
      const killed = W.Char.Codex.unlockedCount(char);
      const totalKills = W.Char.Codex.totalKills(char);
      W.UI.openModal(`
        <div class="codex-panel">
          <div class="codex-summary">👹 已击败 <b style="color:var(--gold)">${killed}</b> / ${reg.length} 位首领 · 累计击杀 <b>${totalKills}</b> 次</div>
          ${rows}
        </div>`, { title: '👹 首领图鉴' });
    },

    /* ---------- 阵营声望 ---------- */
    openRep() {
      const char = W.State.character;
      const reps = Object.values(D.REPS || {});
      const rows = reps.map((r) => {
        const v = W.Char.Reps.value(char, r.id);
        const tier = W.Char.Reps.tierOf(v);
        const next = W.Char.Reps.TIERS.find((t) => t.need > v);
        const pct = next ? Math.min(100, Math.round(((v - tier.need) / (next.need - tier.need)) * 100)) : 100;
        const badge = (D.BADGES || {})[r.id];
        const bCount = badge ? W.Char.Inventory.count(char, badge.item) : 0;
        return `<div class="rep-row" style="--rep-c:${r.color}">
          <span class="rep-icon">${r.icon}</span>
          <div class="rep-info">
            <div class="rep-name">${U.esc(r.name)} <span class="tag rep-tier" style="border-color:${r.color};color:${r.color}">${tier.name}</span></div>
            <div class="rep-desc">${U.esc(r.desc)}</div>
            <div class="rep-bar"><div class="rep-bar-fill" style="width:${pct}%;background:${r.color}"></div></div>
            <div class="rep-prog">${U.fmt(v)} / ${next ? U.fmt(next.need) : 'MAX'}${next ? ` · 距「${next.name}」还差 ${U.fmt(next.need - v)}` : ''}</div>
            <div class="rep-src">📜 ${U.esc(r.sources)}</div>
            ${badge ? `<div class="rep-badge">
              <span class="rep-badge-info">${badge.icon} ${U.esc(badge.name)} ×${bCount} <em>上交换取 +${W.Char.Reps.BADGE_REP} 声望</em></span>
              ${bCount > 0 ? `<button class="btn tiny" data-badge="${r.id}" data-mode="one">上交 1</button>
              <button class="btn tiny" data-badge="${r.id}" data-mode="all">全部上交 (${bCount})</button>` : ''}
            </div>` : ''}
          </div>
          <button class="btn tiny rep-qm-btn" data-qm="${r.id}">🏪 军需官</button>
        </div>`;
      }).join('');
      W.UI.openModal(`
        <div class="rep-panel">
          <div class="rep-summary">🏛️ 为阵营效力积攒声望，可向军需官购买专属装备与坐骑（每匹坐骑 +2% 金币获取）</div>
          ${rows}
        </div>`, { title: '🏛️ 阵营声望' });
      const m = document.getElementById('modal-root');
      m.querySelectorAll('[data-qm]').forEach((b) => b.addEventListener('click', () => this.openQuartermaster(b.dataset.qm)));
      m.querySelectorAll('[data-badge]').forEach((b) => b.addEventListener('click', () => {
        const bd = (D.BADGES || {})[b.dataset.badge];
        if (!bd) return;
        const res = b.dataset.mode === 'all' ? W.Char.Reps.turnInBadges(char, bd.item) : W.Char.Reps.turnInBadge(char, bd.item);
        if (res && res.ok) {
          W.UI.toast(`${bd.icon} 上交 ${bd.name} ×${res.count || 1}，${res.rep.name} 声望 +${res.amount}`, 'ok');
          if (res.newTier) W.UI.toast(`🏛️ 你在 ${res.rep.name} 的声望达到了 ${res.tier.name}！`, 'ok');
          this.openRep();
        } else if (res) {
          W.UI.toast(res.reason || '上交失败', 'warn');
        }
      }));
    },

    openQuartermaster(repId) {
      const char = W.State.character;
      const r = D.REPS[repId];
      if (!r) return;
      const v = W.Char.Reps.value(char, repId);
      const tier = W.Char.Reps.tierOf(v);
      const next = W.Char.Reps.TIERS.find((t) => t.need > v);
      const items = Object.values(D.ITEMS).filter((it) => it.rep === repId);
      const qualityName = { green: '优秀', blue: '精良', purple: '史诗', epic: '史诗', legendary: '传说' };
      const list = items.map((it) => {
        const needTier = W.Char.Reps.TIERS[W.Char.Reps._rank(it.repTier)];
        const have = W.Char.Reps._rank(tier.key) >= W.Char.Reps._rank(it.repTier);
        const owned = it.slot === 'mount' ? (char.mounts || []).includes(it.id) : W.Char.Inventory.count(char, it.id) > 0;
        const parts = this._itemStatsParts(it);
        const statsHtml = parts.length ? `<div class="item-stats">${U.esc(parts.join(' · '))}</div>` : '';
        const nameHtml = `<span style="color:${U.QUALITY_COLOR[it.quality]}">${U.esc(it.name)}</span>${it.quality !== 'white' ? ` <span class="tag q-${it.quality}">${qualityName[it.quality] || '史诗'}</span>` : ''}${it.slot === 'mount' ? ' <span class="tag rep-mount-tag">🐎 坐骑</span>' : ''}`;
        const right = !have
          ? `<span class="tag rep-lock-tag">🔒 需要 ${needTier.name}</span>`
          : owned
            ? `<span class="tag ach-tag">已拥有</span>`
            : `<button class="btn tiny" data-rbuy="${it.id}">${U.money(it.buy)}</button>`;
        return `<div class="item-row ${have ? '' : 'locked'}">
          <span class="item-icon">${it.icon}</span>
          <div class="item-info"><div class="item-name">${nameHtml}</div>${statsHtml}<div class="item-tip">需声望：${needTier.name}${it.slot === 'mount' ? ' · 收藏后金币获取 +2%' : ''}</div></div>
          <div class="item-price">${U.money(it.buy)}</div>
          ${right}
        </div>`;
      }).join('');
      W.UI.openModal(`
        <div class="qm-panel">
          <div class="qm-head"><span class="qm-icon">${r.icon}</span><div class="qm-info"><div class="qm-name">${U.esc(r.name)} 军需官</div><div class="qm-tier">当前声望 <b style="color:${r.color}">${tier.name}</b> · ${U.fmt(v)} / ${next ? U.fmt(next.need) : 'MAX'}</div></div></div>
          <div class="sub-title">🛒 声望商店<span class="sub-note">${items.length} 件</span></div>
          ${list}
        </div>`, { title: '🏪 军需官 · ' + r.name });
      this._bindRepShop(repId);
    },

    _bindRepShop(repId) {
      const m = document.getElementById('modal-root');
      m.querySelectorAll('[data-rbuy]').forEach((btn) => btn.addEventListener('click', () => {
        const char = W.State.character;
        const it = D.ITEMS[btn.dataset.rbuy];
        if (!it) return;
        const tier = W.Char.Reps.tierOf(W.Char.Reps.value(char, repId));
        if (W.Char.Reps._rank(tier.key) < W.Char.Reps._rank(it.repTier)) { W.UI.toast('声望不足', 'warn'); return; }
        if (char.gold < it.buy) { W.UI.toast('金币不足', 'warn'); return; }
        char.gold -= it.buy;
        if (it.slot === 'mount') {
          if (!char.mounts) char.mounts = [];
          if (char.mounts.includes(it.id)) { char.gold += it.buy; W.UI.toast('已拥有该坐骑', 'warn'); this.openQuartermaster(repId); return; }
          char.mounts.push(it.id);
          W.Audio.heal();
          W.UI.toast(`🐎 获得坐骑 ${it.name}（金币 +2%）`);
        } else {
          if (W.Char.Inventory.list(char).length >= W.Char.bagSize(char)) { W.UI.toast('背包已满', 'warn'); char.gold += it.buy; this.openQuartermaster(repId); return; }
          W.Char.Inventory.add(char, it.id, 1);
          W.Audio.heal();
          W.UI.toast(`购买了 ${it.name}`);
        }
        this.openQuartermaster(repId);
      }));
    },

    openStatus() {
      const char = W.State.character;
      const c = W.Char.computed(char);
      const race = c.race, cls = c.cls;
      const attrs = W.Char.fmtAttrs(c);
      let eqHtml = '';
      for (const [slot, name] of W.Char.Equipment.SLOTS) {
        const item = char.equipment[slot] ? D.ITEMS[char.equipment[slot]] : null;
        const u = item ? W.Char.Forge.get(char, item.id) : null;
        // 空槽位:展示背包中可填充该槽位的候选装备(与背包一致的可装备/等级不足标记,达标可直接装备)
        let bagHtml = '';
        if (!item) {
          const cands = this._slotCandidates(char, slot);
          if (cands.length) {
            const { it, perf } = cands[0];
            const canEq = char.level >= (it.level || 0);
            bagHtml = `<div class="eq-bag-hint"><span class="eq-bag-icon">🎒</span><span style="color:${U.QUALITY_COLOR[it.quality]}">${it.icon} ${U.esc(it.name)}</span>${perf ? '<span class="tag perf-tag">✨ 极品</span>' : ''}${this._canEquipMark(char, it, false)}${cands.length > 1 ? `<span class="eq-bag-more">共 ${cands.length} 件</span>` : ''}${canEq ? `<button class="btn tiny" data-eq-from-bag="${slot}:${it.id}:${perf ? 1 : 0}">装备</button>` : ''}</div>`;
          }
        }
        eqHtml += `
          <div class="eq-row">
            <span class="eq-slot">${name}</span>
            ${item
              ? `<span class="eq-item" style="color:${U.QUALITY_COLOR[item.quality]}">${item.icon} ${U.esc(item.name)}</span>${item.quality !== 'white' ? ` <span class="tag q-${item.quality}">${item.quality === 'green' ? '优秀' : item.quality === 'blue' ? '精良' : item.quality === 'legendary' ? '传说' : '史诗'}</span>` : ''}${char.eqPerf && char.eqPerf[slot] ? '<span class="tag perf-tag">✨ 极品</span>' : ''}${u && u.level ? `<span class="tag forge-tag">+${u.level}</span>` : ''}${u && u.enchant && D.ENCHANTS[u.enchant] ? `<span class="tag enchant-tag">${D.ENCHANTS[u.enchant].icon} ${U.esc(D.ENCHANTS[u.enchant].name)}</span>` : ''}<button class="btn tiny" data-unequip="${slot}">卸下</button>${this._eqActions(char, item, u, slot)}`
              : (bagHtml || '<span class="eq-empty">—</span>')}
          </div>`;
      }
      // 套装总览
      let setHtml = '';
      const setCounts = W.Char.setCounts(char);
      const setIds = Object.keys(setCounts);
      if (setIds.length) {
        const rows = setIds.map((sid) => {
          const set = D.SETS[sid];
          if (!set) return '';
          const n = setCounts[sid];
          const bHtml = (set.bonuses || []).map((b) => {
            const on = n >= b.need;
            return `<div class="set-bonus ${on ? 'on' : 'off'}">${on ? '✅' : '🔒'} ${b.need} 件：${U.esc(b.text)}${on ? '' : `（还需 ${b.need - n} 件）`}</div>`;
          }).join('');
          return `<div class="set-row"><div class="set-title">${set.icon} <b style="color:${U.QUALITY_COLOR.epic}">${U.esc(set.name)}</b> <span class="tag set-tag">${n}/${set.pieces.length} 件</span> <span class="set-source">${U.esc(set.source)}</span></div>${bHtml}</div>`;
        }).join('');
        setHtml = `<div class="sub-title">装备套装</div><div class="set-list">${rows}</div>`;
      }
      // 种族天赋(active 技能已转被动时也标记为被动)
      const traits = race.traits.map((t) => {
        const tp = t.passive || (t.active && D.SKILLS[t.active] && D.SKILLS[t.active].passive);
        return `<div class="trait">${tp ? '被动' : '主动'}：<b>${t.name}</b> — ${t.desc}</div>`;
      }).join('');
      // 职业被动技能(常驻)
      const passives = (char.learnedSkills || []).map((sid) => D.SKILLS[sid]).filter((s) => s && s.passive)
        .map((s) => `<div class="trait">被动：<b>${s.icon} ${U.esc(s.name)}</b> — ${U.esc(s.desc)}</div>`).join('');
      // 三系天赋
      const trees = D.TALENTS[char.classId] || [];
      const tSummary = trees.length
        ? trees.map((t) => `<div class="trait">${t.icon} <b>${t.name}</b>：${W.Char.treePoints(char, t.id)} 点</div>`).join('') + `<div class="trait">可用天赋点：<b>${W.Char.getUnspent(char)}</b>（10 级起每级 1 点）</div>`
        : '<div class="empty">该职业暂无天赋</div>';
      W.UI.openModal(`
        <div class="status-grid">
          <div class="stat-block">
            <div class="sub-title">基础属性</div>
            <div class="attr-grid">
              <div><span>力量</span><b>${attrs.str}</b></div>
              <div><span>敏捷</span><b>${attrs.agi}</b></div>
              <div><span>耐力</span><b>${attrs.stam}</b></div>
              <div><span>智力</span><b>${attrs.int}</b></div>
              <div><span>精神</span><b>${attrs.spi}</b></div>
            </div>
          </div>
          <div class="stat-block">
            <div class="sub-title">战斗能力</div>
            <div class="attr-grid">
              <div><span>攻击</span><b>${c.atkMin}-${c.atkMax}</b></div>
              <div><span>法术强度</span><b>${c.spellPower}</b></div>
              <div><span>护甲</span><b>${c.armor}</b></div>
              <div><span>命中</span><b>${attrs.hit}</b></div>
              <div><span>暴击</span><b>${attrs.crit}</b></div>
              <div><span>闪避</span><b>${attrs.dodge}</b></div>
            </div>
          </div>
          <div class="stat-block wide">
            <div class="sub-title">种族天赋</div>
            ${traits}
          </div>
          <div class="stat-block wide">
            <div class="sub-title">三系天赋</div>
            ${tSummary}
          </div>
          ${passives ? `<div class="stat-block wide"><div class="sub-title">被动技能 · 常驻 <button class="btn tiny ghost" data-passive-overview>♾️ 总览</button></div>${passives}</div>` : ''}
          ${this._statusClassInfo(char)}
          <div class="stat-block wide">
            <div class="sub-title">装备 <button class="btn tiny ghost" data-open-bag>🎒 打开背包</button><span class="sub-note">空槽位显示背包候选 · 等级不足先升级</span></div>
            ${eqHtml}
          </div>
          ${setHtml ? `<div class="stat-block wide">${setHtml}</div>` : ''}
          ${(char.mounts || []).length ? `<div class="stat-block wide"><div class="sub-title">🐎 坐骑收藏<span class="sub-note">每匹金币 +2%（现 +${(char.mounts || []).length * 2}%）</span></div><div class="rep-mounts">${W.Char.Reps.mounts(char).map((mt) => `<span class="rep-mount-chip">${mt.icon} ${U.esc(mt.name)}</span>`).join('')}</div></div>` : ''}
        </div>`, { title: char.name + ' · ' + race.name + ' ' + cls.name + ' · Lv.' + char.level });
      const m = document.getElementById('modal-root');
      m.querySelectorAll('[data-unequip]').forEach((btn) => btn.addEventListener('click', () => {
        if (W.Char.Equipment.unequip(char, btn.dataset.unequip)) { W.UI.toast('已卸下装备'); this.openStatus(); }
        else W.UI.toast('背包已满', 'warn');
      }));
      m.querySelectorAll('[data-de-eq]').forEach((btn) => btn.addEventListener('click', () => {
        const r = W.Char.Forge.disenchantEquipped(char, btn.dataset.deEq);
        if (r.ok) { W.Audio.spell(); W.UI.toast(`分解成功！获得 ${W.Char.Forge.matsLabel(r.yield)}`, 'ok'); }
        else W.UI.toast(r.reason, 'warn');
        this.openStatus();
      }));
      m.querySelectorAll('[data-sell-eq]').forEach((btn) => btn.addEventListener('click', () => {
        const r = W.Char.Forge.sellEquipped(char, btn.dataset.sellEq);
        if (r.ok) { W.Audio.click(); W.UI.toast(`出售了 ${r.item}，获得 ${U.plainMoney(r.gold)}`, 'ok'); }
        else W.UI.toast(r.reason, 'warn');
        this.openStatus();
      }));
      const poBtn = m.querySelector('[data-passive-overview]');
      if (poBtn) poBtn.addEventListener('click', () => this._openPassiveOverview());
      // 空槽位候选直接装备(与背包装备同一入口,联动一致)
      m.querySelectorAll('[data-eq-from-bag]').forEach((btn) => btn.addEventListener('click', () => {
        const [slot, id, perf] = btn.dataset.eqFromBag.split(':');
        if (W.Char.Equipment.equip(char, id, perf === '1')) { W.Audio.click(); W.UI.toast(`装备了 ${D.ITEMS[id].name}`, 'ok'); }
        else W.UI.toast('装备失败', 'warn');
        this.openStatus();
      }));
      // 装备区直达背包(联动)
      const bagBtn = m.querySelector('[data-open-bag]');
      if (bagBtn) bagBtn.addEventListener('click', () => {
        W.Audio.click();
        W.UI.closeModal();
        this.openBag();
      });
    },
    // 已装备行的快捷操作:分解(绿/蓝且未强化附魔)与出售
    _eqActions(char, item, u, slot) {
      let h = '';
      if (W.Char.Forge.canDisenchant(item) && !(u && (u.level || u.enchant))) {
        h += `<button class="btn tiny ghost" data-de-eq="${slot}" title="分解为锻造材料">分解</button>`;
      }
      if (!(u && (u.level || u.enchant))) {
        h += `<button class="btn tiny ghost" data-sell-eq="${slot}" title="出售换取金币">出售</button>`;
      }
      return h;
    },
    // 打开被动效果总览(关闭当前弹窗并跳转;状态面板/技能书共用)
    _openPassiveOverview() {
      W.Audio.click();
      W.UI.closeModal();
      this.openPassiveOverview();
    },

    /* ---------- 被动效果总览 ---------- */
    // 被动基础数值文案(未习得 / 其他职业参考)
    _passiveModText(mod) {
      const parts = [];
      const pct = (v) => (Math.round(v * 1000) / 10) + '%';
      if (mod.atkPct != null) parts.push('攻击 +' + pct(mod.atkPct));
      if (mod.armorPct != null) parts.push('护甲 +' + pct(mod.armorPct));
      if (mod.crit != null) parts.push('暴击 +' + pct(mod.crit));
      if (mod.dodge != null) parts.push('闪避 +' + pct(mod.dodge));
      if (mod.hit != null) parts.push('命中 +' + pct(mod.hit));
      if (mod.spellPowerPct != null) parts.push('法强 +' + pct(mod.spellPowerPct));
      if (mod.manaRegenPct != null) parts.push('法力回复 +' + pct(mod.manaRegenPct));
      if (mod.startShield != null) parts.push('战斗开始护盾 ' + mod.startShield + '+' + (mod.startShieldSp || 0) + '×法强');
      if (mod.shieldHeal != null && mod.startShield == null) parts.push('受击回血 ' + mod.shieldHeal);
      if (mod.markTaken != null) parts.push('标记易伤 +' + pct(mod.markTaken));
      if (mod.petAtkPct != null) parts.push('宠物攻击 +' + pct(mod.petAtkPct));
      if (mod.onHit != null) parts.push('攻击附加 ' + mod.onHit + ' 神圣');
      if (mod.thorns != null) parts.push('反弹 ' + mod.thorns + ' 近战伤害');
      return parts;
    },
    // 单行:来源标签 / 习得状态 / 实时加成(当前角色已习得)或基础数值;天赋被动附来源系与解锁点数提示
    _poRow(char, s, isCurrent, clsId) {
      const learned = isCurrent && (char.learnedSkills || []).includes(s.id);
      const src = s.race ? `<span class="tag po-src race-src">种族</span>` : (s.talent ? `<span class="tag po-src talent-src">天赋</span>` : `<span class="tag po-src class-src">职业</span>`);
      const unlock = s.talent ? '<span class="po-unlock">天赋习得</span>' : `<span class="po-unlock">Lv.${s.learn} 解锁</span>`;
      let vals = '';
      if (learned) {
        const live = W.Char.passiveLiveEffects(char, s.id) || { delta: [], battle: [] };
        const chips = live.delta.map((d) => `<span class="po-live-chip">${U.esc(d.label)} ${d.text}</span>`).join('');
        const battle = live.battle.map((b) => `<div class="po-battle">⚙️ ${U.esc(b)}</div>`).join('');
        vals = (chips || battle) ? `<div class="po-vals">${chips}${battle}</div>` : '';
      } else {
        const base = this._passiveModText(s.mod || {}).map((t) => `<span class="po-base-chip">${t}</span>`).join('');
        vals = base ? `<div class="po-vals">${base}</div>` : '';
      }
      // 天赋被动:来源天赋树 + 解锁所需点数(当前职业视图可点击跳转天赋面板)
      let talentHint = '';
      if (s.talent) {
        const info = this._talentInfoOf(clsId || char.classId, s.id);
        if (info) {
          const need = (info.node.tier || 0) * 5;
          const go = isCurrent ? `<button class="po-talent-go" data-tree="${info.tree.id}" title="前往天赋面板学习">前往 →</button>` : '';
          talentHint = `<div class="po-talent-src"><span>${info.tree.icon} ${U.esc(info.tree.name)}系天赋${need > 0 ? ` · 需本系 ${need} 点解锁` : ''}</span>${go}</div>`;
        }
      }
      return `
        <div class="po-row ${learned ? 'po-live-row' : 'po-lock-row'}">
          <span class="po-icon">${s.icon}</span>
          <div class="po-info">
            <div class="po-name">${U.esc(s.name)} ${src} ${unlock} ${learned ? '<span class="tag po-has">✅ 已习得</span>' : '<span class="tag po-miss">🔒 未习得</span>'}</div>
            <div class="po-desc">${U.esc(s.desc)}</div>
            ${talentHint}
            ${vals}
          </div>
        </div>`;
    },
    // 被动效果总览:按职业页签展示全部被动,当前角色所在职业附实时加成数值
    openPassiveOverview(clsId) {
      const char = W.State.character;
      if (!char) return;
      const cur = (clsId && D.CLASSES[clsId]) ? clsId : char.classId;
      const c = W.Char.computed(char);
      const tabs = Object.keys(D.CLASSES).map((cid) => {
        const cl = D.CLASSES[cid];
        return `<button class="po-tab ${cid === cur ? 'active' : ''}" data-cls="${cid}" aria-selected="${cid === cur}" style="--tc:${cl.colors ? cl.colors[0] : '#c69b6d'}">${cl.icon} ${U.esc(cl.name)}</button>`;
      }).join('');
      const skills = Object.values(D.SKILLS).filter((s) => s && s.passive && s.cls === cur && !s.race)
        .sort((a, b) => (a.learn - b.learn) || (a.talent ? 1 : 0) - (b.talent ? 1 : 0));
      const isCurrent = cur === char.classId;
      // 当前角色种族被动(仅当前职业视图)
      const racePass = [];
      if (isCurrent) {
        for (const t of (c.race.traits || [])) {
          if (t.active && D.SKILLS[t.active] && D.SKILLS[t.active].passive) racePass.push(D.SKILLS[t.active]);
        }
      }
      const note = isCurrent
        ? `<div class="po-note">⚡ ${U.esc(char.name)}（${U.esc(c.cls.name)} ${c.lvl} 级）实时加成：已习得被动按实际属性计算</div>`
        : `<div class="po-note">📖 ${U.esc(D.CLASSES[cur].name)} 被动参考 · 切回当前职业查看实时加成</div>`;
      const raceHtml = racePass.length ? `<div class="po-group-title">种族被动 · ${U.esc(c.race.name)}</div>${racePass.map((s) => this._poRow(char, s, true)).join('')}` : '';
      // 属性加成总量汇总:当前职业按实际属性一次性重算全部已习得被动;其他职业按基础数值求参考合计
      let sumHtml = '';
      if (isCurrent) {
        const tot = W.Char.passiveLiveTotal(char);
        if (tot.length) {
          sumHtml = `<div class="po-summary"><div class="po-sum-title">📊 被动加成总计<span class="po-sum-sub">已习得 ${tot.length} 类属性</span></div><div class="po-vals">${tot.map((d) => `<span class="po-sum-chip">${U.esc(d.label)} ${d.text}</span>`).join('')}</div></div>`;
        }
      } else {
        const sum = {};
        for (const s of skills) {
          const m = s.mod || {};
          for (const k of ['atkPct', 'armorPct', 'crit', 'dodge', 'hit', 'spellPowerPct', 'manaRegenPct', 'petAtkPct']) {
            if (m[k] != null) sum[k] = (sum[k] || 0) + m[k];
          }
        }
        const labelOf = { atkPct: '攻击', armorPct: '护甲', crit: '暴击', dodge: '闪避', hit: '命中', spellPowerPct: '法强', manaRegenPct: '法力回复', petAtkPct: '宠物攻击' };
        const pct = (v) => (Math.round(v * 1000) / 10) + '%';
        const refChips = Object.keys(sum).map((k) => `<span class="po-sum-chip ref">${labelOf[k]} +${pct(sum[k])}</span>`).join('');
        if (refChips) sumHtml = `<div class="po-summary ref"><div class="po-sum-title">📊 被动加成参考合计<span class="po-sum-sub">基础数值 · 切回当前职业查看实时</span></div><div class="po-vals">${refChips}</div></div>`;
      }
      W.UI.openModal(`
        <div class="po-panel">
          <div class="po-tabs">${tabs}</div>
          ${note}
          ${sumHtml}
          <div class="po-group-title">${isCurrent ? '职业 · 天赋被动' : U.esc(D.CLASSES[cur].name) + ' 全部被动'}</div>
          ${skills.map((s) => this._poRow(char, s, isCurrent, cur)).join('')}
          ${raceHtml}
        </div>`, { title: '♾️ 被动效果总览' });
      const m = document.getElementById('modal-root');
      m.querySelectorAll('.po-tab').forEach((t) => t.addEventListener('click', () => this.openPassiveOverview(t.dataset.cls)));
      // 天赋被动:点击跳转天赋面板并选中对应系
      m.querySelectorAll('.po-talent-go').forEach((b) => b.addEventListener('click', () => {
        W.Audio.click();
        W.UI.closeModal();
        this._talentTree = b.dataset.tree;
        this.openTalents();
      }));
    },

    /* ---------- 背包 ---------- */
    // 已装备判定需精确到极品状态(普通/极品同 id 互为换装;ring/trinket 映射到实际目标槽)
    _isBagEquipped(char, it, perf) {
      const perfOf = (slot) => !!(char.eqPerf && char.eqPerf[slot]);
      if (it.slot === 'ring') {
        const t = W.Char.Equipment.ringTarget(char);
        return char.equipment[t] === it.id && perfOf(t) === !!perf;
      }
      if (it.slot === 'trinket') {
        const t = W.Char.Equipment.trinketTarget(char);
        return char.equipment[t] === it.id && perfOf(t) === !!perf;
      }
      return !!it.slot && char.equipment[it.slot] === it.id && perfOf(it.slot) === !!perf;
    },
    // 可装备标记:未装备的装备类物品 → 可装备(绿) / 需要X级(橙)
    _canEquipMark(char, it, equipped) {
      if (equipped || it.poison || !it.slot || it.slot === 'consumable' || it.slot === 'material') return '';
      const need = it.level || 0;
      return char.level >= need
        ? ' <span class="tag caneq-tag">✓ 可装备</span>'
        : ` <span class="tag needlv-tag">🔒 需要${need}级</span>`;
    },
    // 状态面板装备栏:某空槽位的背包候选(双戒指/双饰品映射到基础槽;判定与背包 _isBagEquipped 一致;可装备者优先,同级按物品等级降序)
    _slotCandidates(char, slot) {
      const base = slot === 'ring1' || slot === 'ring2' ? 'ring' : slot === 'trinket1' || slot === 'trinket2' ? 'trinket' : slot;
      const out = [];
      const seen = {};
      for (const s of W.Char.Inventory.list(char)) {
        const it = D.ITEMS[s.id];
        if (!it || it.poison || it.slot !== base) continue;
        if (this._isBagEquipped(char, it, !!s.perf)) continue;
        const key = s.id + '|' + (s.perf ? 1 : 0);
        if (seen[key]) continue;
        seen[key] = 1;
        out.push({ it, perf: !!s.perf });
      }
      out.sort((a, b) => {
        const aOk = char.level >= (a.it.level || 0), bOk = char.level >= (b.it.level || 0);
        if (aOk !== bOk) return aOk ? -1 : 1;
        if (a.perf !== b.perf) return a.perf ? -1 : 1;
        return (b.it.level || 0) - (a.it.level || 0);
      });
      return out;
    },
    // 批量出售通用筛选:按品质(sel.q 支持数组,如 epic+purple)或按槽位组(sel.slot);限定装备槽 + 未装备 + 未强化附魔(毒药/材料/消耗品排除)
    _batchSellStacks(char, sel) {
      const slotGroups = {
        weapon: ['weapon'], offhand: ['offhand'],
        armor: ['head', 'chest', 'gloves', 'legs', 'boots'],
        misc: ['cloak', 'neck'],
        ring: ['ring'], trinket: ['trinket'],
      };
      const qs = Array.isArray(sel.q) ? sel.q : (sel.q ? [sel.q] : null);
      const slots = sel.slot ? (slotGroups[sel.slot] || [sel.slot]) : null;
      return W.Char.Inventory.list(char).filter((s) => {
        const it = D.ITEMS[s.id];
        if (!it || !it.slot || it.slot === 'consumable' || it.slot === 'material' || it.poison) return false;
        if (qs && !qs.includes(it.quality)) return false;
        if (slots && !slots.includes(it.slot)) return false;
        if (this._isBagEquipped(char, it, !!s.perf)) return false;
        const u = W.Char.Forge.get(char, it.id);
        return !(u && (u.level || u.enchant));
      });
    },
    // 批量出售件数(与 _bindSellAll 实际出售共用同一筛选,保证计数一致)
    _batchSellCount(char, sel) {
      return this._batchSellStacks(char, sel).reduce((n, s) => n + s.count, 0);
    },
    // 白色装备堆/件数(兼容既有入口与测试)
    _whiteSellStacks(char) {
      return this._batchSellStacks(char, { q: 'white' });
    },
    _whiteSellCount(char) {
      return this._whiteSellStacks(char).reduce((n, s) => n + s.count, 0);
    },
    openBag() {
      // 重绘后的滚动位置由 UI.openModal 统一保持(同标题弹窗刷新不跳回顶部)
      const char = W.State.character;
      const inv = W.Char.Inventory.list(char);
      const eqCount = W.Char.Equipment.SLOTS.filter(([slot]) => char.equipment[slot]).length;
      const bagCap = W.Char.bagSize(char);
      const bagMaxed = bagCap >= (C.BAG_MAX || 999);
      let html = `<div class="bag-info">背包 ${inv.length} / ${bagCap}${eqCount ? ` · 已装备 ${eqCount} 件不占背包` : ''}${bagMaxed ? ' · <span class="dim">容量已满</span>' : ''} · 金币 ${U.money(char.gold)}</div>`;
      html += `<div class="bag-info dim">🎒 背包扩容：可在主城商人处购买背包（亚麻背包 +10 / 毛皮背包 +15 / 旅行者背包 +20），在背包中使用即可永久扩容</div>`;
      // 一键分解入口:批量分解全部绿色装备
      const greenN = W.Char.Forge.disenchantCount(char, 'green');
      // 批量出售:按品质 / 按槽位两组可配置芯片(史诗=epic+purple 合并展示)
      const QUAL = [['white', '白色'], ['green', '绿色'], ['blue', '精良'], ['epic,purple', '史诗'], ['legendary', '传说']];
      const SLOTS = [['weapon', '武器'], ['offhand', '副手'], ['armor', '护甲'], ['misc', '披风/项链'], ['ring', '戒指'], ['trinket', '饰品']];
      const qChips = QUAL.map(([q, name]) => {
        const n = this._batchSellCount(char, { q: q.split(',') });
        return `<button class="btn tiny chip ${n ? '' : 'disabled'}" data-sell-all="${q}" ${n ? '' : 'disabled'}>${name}（${n}）</button>`;
      }).join('');
      const sChips = SLOTS.map(([s, name]) => {
        const n = this._batchSellCount(char, { slot: s });
        return `<button class="btn tiny chip ${n ? '' : 'disabled'}" data-sell-slot="${s}" ${n ? '' : 'disabled'}>${name}（${n}）</button>`;
      }).join('');
      html += `<div class="bag-batch">
        <div class="bag-batch-line"><button class="btn tiny ghost ${greenN ? '' : 'disabled'}" data-disenchant-all="green" ${greenN ? '' : 'disabled'}>⚡ 一键分解全部绿色装备${greenN ? `（${greenN}）` : ''}</button><span class="bag-batch-hint">优秀装备 → 锻造材料</span></div>
        <div class="batch-sell">
          <div class="batch-sell-title">💰 批量出售<span class="sub-note">按品质 / 槽位 · 白色垃圾一键换金币 · 已装备与强化附魔不参与</span></div>
          <div class="batch-sell-row"><span class="bs-label">品质</span>${qChips}</div>
          <div class="batch-sell-row"><span class="bs-label">槽位</span>${sChips}</div>
        </div>
      </div>`;
      // 盗贼毒药状态
      if (char.classId === 'rogue') {
        html += '<div class="class-panel"><div class="sub-title">☠️ 毒药</div>';
        if (char.poison) {
          const pit = D.ITEMS[char.poison.id];
          html += `<div class="poison-cur">已涂抹：${pit ? pit.icon + ' ' + U.esc(pit.name) : '未知'}（剩余 ${char.poison.charges} 次） <button class="btn tiny ghost" data-poison-off>解除毒药</button></div>`;
        } else {
          html += '<div class="poison-cur dim">未涂抹毒药 · 普通攻击与近战技能命中时触发毒药效果</div>';
        }
        html += '</div>';
      }
      if (!inv.length) html += '<div class="empty">背包空空如也</div>';
      for (const s of inv) {
        const it = D.ITEMS[s.id];
        if (!it) continue;
        // 已装备判定需精确到极品状态(普通/极品同 id 互为换装)
        const equipped = this._isBagEquipped(char, it, !!s.perf);
        const u = W.Char.Forge.get(char, it.id);
        const deOk = W.Char.Forge.canDisenchant(it) && !equipped && !(u && (u.level || u.enchant));
        let btnHtml;
        if (it.poison) {
          // 毒药:涂抹按钮(仅盗贼可用)
          const rogue = char.classId === 'rogue';
          btnHtml = `<button class="btn small ${rogue ? '' : 'disabled'}" data-poison="${it.id}" ${rogue ? '' : 'disabled'}>涂抹</button>`;
        } else if (it.slot === 'material') {
          // 锻造材料:不可使用/装备
          btnHtml = '<span class="tag mat-tag">材料</span>';
        } else if (it.scroll) {
          // 战斗卷轴:仅在战斗中免费使用(不占回合),背包内不可直接使用
          btnHtml = '<button class="btn small disabled" title="在战斗中点击卷轴免费使用（不消耗回合）">战斗中</button>';
        } else {
          const useBtn = it.slot === 'consumable' || it.slot === 'bag' ? '使用' : (equipped ? '已装备' : '装备');
          btnHtml = `<button class="btn small" data-use="${it.id}" data-perf="${s.perf ? 1 : 0}" ${equipped && it.slot !== 'consumable' ? 'disabled' : ''}>${useBtn}</button>`;
          // 分解快捷按钮:仅背包中的绿色/蓝色装备且未强化/附魔
          if (deOk) btnHtml += `<button class="btn small ghost" data-disenchant="${it.id}" data-perf="${s.perf ? 1 : 0}">分解</button>`;
        }
        // 物品属性说明(装备属性 / 消耗品效果 / 材料用途 / 毒药效果 / 强化附魔状态 / 分解预览)
        const statsParts = [];
        if (it.poison) {
          statsParts.push(it.poison.type === 'instant' ? '攻击附加自然伤害' : it.poison.type === 'deadly' ? '攻击使目标持续中毒' : '攻击麻痹目标降低攻击');
        } else if (it.slot === 'material') {
          statsParts.push('锻造材料 · 用于装备强化 / 附魔');
        } else if (it.slot === 'bag') {
          statsParts.push(`🎒 使用后背包容量 +${it.bagSize} 格（当前 ${W.Char.bagSize(char)} 格）`);
        } else {
          statsParts.push(...this._itemStatsParts(it, s.perf));
        }
        if (u && (u.level || u.enchant)) {
          const em = u.enchant ? D.ENCHANTS[u.enchant] : null;
          statsParts.push((u.level ? '+' + u.level + ' 强化' : '') + (u.level && em ? ' · ' : '') + (em ? em.icon + ' ' + em.name : ''));
        }
        if (deOk) statsParts.push('分解可得 ' + W.Char.Forge.matsLabel(W.Char.Forge.disenchantYield(it)));
        // 出售价(与商店一致:it.sell 优先,否则 buy × 0.4)
        const sellPrice = Math.max(1, Math.floor(it.sell != null ? it.sell : it.buy * 0.4));
        // 全部背包物品均可出售(与商店出售区一致:毒药/材料/消耗品/卷轴/已装备同 id 的背包副本/强化附魔件均有卖按钮,明确点击不误触;已装备与强化附魔仍保留标签提示)
        // 与已装备属性对比提示(戒指映射到实际目标槽;已装备/消耗品/材料/毒药不对比)
        let cmpHtml = '';
        const equippable = !it.poison && it.slot && it.slot !== 'consumable' && it.slot !== 'material' && it.slot !== 'bag';
        if (equippable && !equipped) {
          let curSlot = it.slot, curId = char.equipment[curSlot];
          if (curSlot === 'ring') { const t = W.Char.Equipment.ringTarget(char); curSlot = t; curId = char.equipment[t]; }
          else if (curSlot === 'trinket') { const t = W.Char.Equipment.trinketTarget(char); curSlot = t; curId = char.equipment[t]; }
          cmpHtml = (curId && D.ITEMS[curId])
            ? this._compareEquip(it, u, D.ITEMS[curId], W.Char.Forge.get(char, curId), s.perf, !!(char.eqPerf && char.eqPerf[curSlot]))
            : '<div class="item-compare new">✨ 该槽位空闲 · 装备即可生效</div>';
        }
        html += `
          <div class="bag-row">
            <span class="item-icon">${it.icon}</span>
            <div class="item-info">
              <div class="item-name" style="color:${U.QUALITY_COLOR[it.quality]}">${U.esc(it.name)}${s.perf ? ' <span class="tag perf-tag">✨ 极品</span>' : ''} <span class="item-count">×${s.count}</span>${equipped ? ' <span class="tag eq-tag">已装备</span>' : ''}${this._canEquipMark(char, it, equipped)}</div>
              ${statsParts.length ? `<div class="item-stats">${U.esc(statsParts.join(' · '))}</div>` : ''}
              ${it.setId && D.SETS[it.setId] ? (() => {
                const set = D.SETS[it.setId];
                const sc = W.Char.setCounts(char);
                const n = sc[it.setId] || 0;
                const act = (set.bonuses || []).filter((b) => n >= b.need);
                const inact = (set.bonuses || []).filter((b) => n < b.need);
                const actTxt = act.map((b) => `✅ ${b.need}件：${b.text}`).join('；');
                const inactTxt = inact.map((b) => `🔒 ${b.need}件：${b.text}`).join('；');
                return `<div class="item-set" title="${U.esc(set.name + '（' + set.source + '）' + (actTxt ? '\n已激活：' + actTxt : '') + (inactTxt ? '\n未激活：' + inactTxt : ''))}">📦 ${U.esc(set.name)} <span class="tag set-tag">${n}/${set.pieces.length}</span></div>`;
              })() : ''}
              ${cmpHtml}
            </div>
            <button class="btn tiny ghost item-sell" data-sell-bag="${it.id}" data-perf="${s.perf ? 1 : 0}" title="出售获得 ${U.plainMoney(sellPrice)}">💰 卖 ${U.plainMoney(sellPrice)}</button>
            ${btnHtml}
          </div>`;
      }
      W.UI.openModal(html, { title: '背包' });
      const m = document.getElementById('modal-root');
      m.querySelectorAll('[data-use]').forEach((btn) => btn.addEventListener('click', () => {
        const it = D.ITEMS[btn.dataset.use];
        if (it.slot === 'consumable') {
          const ok = W.Char.Equipment.use(char, it.id);
          if (!ok) { W.UI.toast(it.consumable.heal && it.consumable.mana ? '状态已满' : '无法使用', 'warn'); return; }
          W.Audio.heal();
        } else if (it.slot === 'bag') {
          // 背包物品:使用后永久扩充容量
          const r = W.Char.expandBag(char, it.id);
          if (!r.ok) { W.UI.toast(r.reason, 'warn'); return; }
          W.Audio.heal();
          W.UI.toast(`🎒 背包容量 +${r.add} 格，现为 ${r.size} 格`, 'ok');
        } else {
          W.Char.Equipment.equip(char, it.id, btn.dataset.perf === '1');
          W.Audio.click();
        }
        this.openBag();
      }));
      m.querySelectorAll('[data-poison]').forEach((btn) => btn.addEventListener('click', () => {
        const r = W.Char.applyPoison(char, btn.dataset.poison);
        if (r.ok) { W.Audio.spell(); W.UI.toast(`已涂抹${r.name}`, 'ok'); }
        else W.UI.toast(r.reason, 'warn');
        this.openBag();
      }));
      m.querySelectorAll('[data-poison-off]').forEach((btn) => btn.addEventListener('click', () => {
        W.Char.removePoison(char);
        W.Audio.click();
        W.UI.toast('已解除武器毒药', 'ok');
        this.openBag();
      }));
      m.querySelectorAll('[data-disenchant]').forEach((btn) => btn.addEventListener('click', () => {
        const r = W.Char.Forge.disenchant(char, btn.dataset.disenchant, btn.dataset.perf === '1');
        if (r.ok) { W.Audio.spell(); W.UI.toast(`分解成功！获得 ${W.Char.Forge.matsLabel(r.yield)}`, 'ok'); }
        else W.UI.toast(r.reason, 'warn');
        this.openBag();
      }));
      m.querySelectorAll('[data-sell-bag]').forEach((btn) => btn.addEventListener('click', () => {
        const it = D.ITEMS[btn.dataset.sellBag];
        if (!it) return;
        const price = Math.max(1, Math.floor(it.sell != null ? it.sell : (it.buy || 0) * 0.4));
        const perf = btn.dataset.perf === '1';
        W.Char.Inventory.remove(char, it.id, 1, perf);
        char.gold += price;
        W.Audio.click();
        W.UI.toast(`出售了 ${it.name}，获得 ${U.plainMoney(price)}`, 'ok');
        // 局部更新:删行/改堆叠数量 + 刷新信息行/批量出售芯片/分解计数/空态,不做整弹窗重绘
        this._bagSellPartialUpdate(m, char, btn, it.id, perf);
      }));
      this._bindDisenchantAll(m, char, () => this.openBag());
      // 批量出售:局部更新(删多行 + 刷新芯片/信息行),不做整弹窗重绘
      this._bindSellAll(m, char, (stacks) => this._bagSellBatchPartialUpdate(m, char, stacks));
    },

    // 背包派生信息就地刷新:空态/信息行/批量出售芯片/一键分解计数(单件与批量出售共用)
    _bagRefreshDerived(m, char) {
      const inv = W.Char.Inventory.list(char);
      // 空态:背包清空时补「空空如也」(与整弹窗渲染时插入位置一致:毒药面板/批量区之后)
      if (!inv.length && !m.querySelector('.empty')) {
        const anchor = m.querySelector('.class-panel') || m.querySelector('.bag-batch');
        const empty = document.createElement('div');
        empty.className = 'empty';
        empty.textContent = '背包空空如也';
        if (anchor && anchor.nextSibling) anchor.parentNode.insertBefore(empty, anchor.nextSibling);
        else if (anchor) anchor.parentNode.appendChild(empty);
        else { const mb = m.querySelector('.modal-body'); if (mb) mb.appendChild(empty); }
      }
      // 信息行:背包数 + 金币
      const bagCap = W.Char.bagSize(char);
      const bagMaxed = bagCap >= (C.BAG_MAX || 999);
      const eqCount = W.Char.Equipment.SLOTS.filter(([slot]) => char.equipment[slot]).length;
      const info = m.querySelector('.bag-info');
      if (info) info.innerHTML = `背包 ${inv.length} / ${bagCap}${eqCount ? ` · 已装备 ${eqCount} 件不占背包` : ''}${bagMaxed ? ' · <span class="dim">容量已满</span>' : ''} · 金币 ${U.money(char.gold)}`;
      // 批量出售芯片计数(品质/槽位);就地改文本与禁用态,保留原有确认监听
      const refreshChip = (chip, n) => {
        if (chip.dataset.confirm) { // 若处于二次确认态,先复位再更新计数
          clearTimeout(chip._t);
          chip.dataset.confirm = '';
          chip.classList.remove('danger');
          if (chip.dataset.orig) chip.textContent = chip.dataset.orig;
          delete chip.dataset.orig;
        }
        chip.textContent = chip.textContent.replace(/（\d+）$/, `（${n}）`);
        chip.classList.toggle('disabled', !n);
        chip.disabled = !n;
      };
      m.querySelectorAll('[data-sell-all]').forEach((chip) => {
        refreshChip(chip, this._batchSellCount(char, { q: chip.dataset.sellAll.split(',') }));
      });
      m.querySelectorAll('[data-sell-slot]').forEach((chip) => {
        refreshChip(chip, this._batchSellCount(char, { slot: chip.dataset.sellSlot }));
      });
      // 一键分解全部绿色装备计数
      const greenBtn = m.querySelector('[data-disenchant-all]');
      if (greenBtn) {
        if (greenBtn.dataset.confirm) {
          clearTimeout(greenBtn._t);
          greenBtn.dataset.confirm = '';
          greenBtn.classList.remove('danger');
          if (greenBtn.dataset.orig) greenBtn.textContent = greenBtn.dataset.orig;
          delete greenBtn.dataset.orig;
        }
        const n = W.Char.Forge.disenchantCount(char, 'green');
        greenBtn.textContent = `⚡ 一键分解全部绿色装备${n ? `（${n}）` : ''}`;
        greenBtn.classList.toggle('disabled', !n);
        greenBtn.disabled = !n;
      }
    },

    // 背包单件出售后局部更新:删行/改堆叠数量 + 派生信息就地刷新,不做整弹窗重绘(滚动位置天然保留)
    _bagSellPartialUpdate(m, char, btn, itemId, perf) {
      const inv = W.Char.Inventory.list(char);
      // 该行:堆叠未卖完只改数量角标,卖完则整行移除
      const row = btn.closest('.bag-row');
      const st = inv.find((s) => s.id === itemId && !!s.perf === perf);
      if (st && st.count > 0 && row) {
        const cnt = row.querySelector('.item-count');
        if (cnt) cnt.textContent = '×' + st.count;
      } else if (row) {
        row.remove();
      }
      this._bagRefreshDerived(m, char);
    },

    // 背包批量出售后局部更新:整堆移除对应行 + 派生信息就地刷新,不做整弹窗重绘
    _bagSellBatchPartialUpdate(m, char, stacks) {
      for (const s of stacks) {
        // 行内卖按钮带 id + 极品标记,精确命中对应行(普通/极品同 id 互不串行)
        for (const row of m.querySelectorAll('.bag-row')) {
          const btn = row.querySelector(`[data-sell-bag="${s.id}"]`);
          if (btn && (btn.dataset.perf === '1') === !!s.perf) { row.remove(); break; }
        }
      }
      this._bagRefreshDerived(m, char);
    },

    /* ---------- 锻造铺(强化 / 附魔) ---------- */
    openForge() {
      const char = W.State.character;
      let html = '<div class="forge-note">提升你的装备：<b>强化</b>消耗金币与材料逐级提升属性（满 +' + W.Config.FORGE_MAX_LEVEL + '，11 级起消耗双倍水晶）；<b>附魔</b>为装备附加永久效果（可替换）；<b>分解</b>把背包中不用的优秀/精良装备还原为锻造材料；<b>🧪 合成</b>把低级材料向上合成；<b>🔨 打造</b>消耗材料直接制作装备。材料（奥术粉尘 / 梦境精华 / 奥术水晶）可通过<b>击杀怪物、完成任务、副本通关宝箱</b>或商贩购买获得；副本最终 Boss 必定掉落奥术水晶。</div>';
      // 按物品 id 去重(如双戒指为同一物品时共享同一强化状态,只展示一行)
      const list = [];
      const seen = {};
      for (const [slot] of W.Char.Equipment.SLOTS) {
        const id = char.equipment[slot];
        if (id && D.ITEMS[id] && !seen[id]) { seen[id] = 1; list.push(D.ITEMS[id]); }
        // 极品标记:同 id 双戒指任一槽为极品即显示
        if (id && char.eqPerf && char.eqPerf[slot]) seen[id + '_p'] = 1;
      }
      if (!list.length) html += '<div class="empty">你还没有装备任何物品</div>';
      for (const it of list) {
        const u = W.Char.Forge.get(char, it.id) || {};
        const L = u.level || 0;
        const enchant = u.enchant ? D.ENCHANTS[u.enchant] : null;
        const nameColor = U.QUALITY_COLOR[it.quality];
        const bonusText = this._forgeBonusText(W.Char.upgradeBonus(it, u));
        let enhBtn;
        if (L >= W.Config.FORGE_MAX_LEVEL) {
          enhBtn = '<span class="forge-max">已满级 +' + L + '</span>';
        } else {
          const cost = W.Char.Forge.enhanceCost(it, L);
          const mats = W.Char.Forge.enhanceMats(L);
          const afford = char.gold >= cost && W.Char.Forge._hasMats(char, mats);
          enhBtn = `<button class="btn small gold ${afford ? '' : 'disabled'}" data-enhance="${it.id}" ${afford ? '' : 'disabled'}>强化 +${L + 1}（${U.plainMoney(cost)} · ${U.esc(W.Char.Forge.matsLabel(mats))}）</button>`;
        }
        // 附魔槽位匹配:物品 slot 为 'ring'/'trinket' 时兼容双槽命名(ring1/ring2/trinket1/trinket2)
        const avail = Object.values(D.ENCHANTS).filter((em) => W.Char.Forge.slotMatches(em, it.slot));
        let encHtml = `<div class="fr-enchants" data-enchants="${it.id}" style="display:none"><div class="sub-title">选择附魔（将替换当前附魔）</div>`;
        for (const em of avail) {
          const emAfford = char.gold >= em.gold && W.Char.Forge._hasMats(char, em.mats);
          const isCur = enchant && enchant.id === em.id;
          encHtml += `<button class="btn tiny ${isCur ? 'active' : ''} ${emAfford ? '' : 'disabled'}" data-enchant-apply="${it.id}:${em.id}" ${emAfford && !isCur ? '' : 'disabled'} title="${U.esc(em.desc)}">${em.icon} ${U.esc(em.name)}（${U.plainMoney(em.gold)} · ${U.esc(W.Char.Forge.matsLabel(em.mats))}）${isCur ? ' ✓当前' : ''}</button>`;
        }
        if (enchant) encHtml += `<button class="btn tiny ghost" data-enchant-remove="${it.id}">移除附魔</button>`;
        encHtml += '</div>';
        html += `
          <div class="forge-row">
            <div class="fr-head">
              <span class="item-icon">${it.icon}</span>
              <div class="fr-info">
                <div class="fr-name" style="color:${nameColor}">${U.esc(it.name)}${seen[it.id + '_p'] ? ' <span class="tag perf-tag">✨ 极品</span>' : ''} <span class="tag q-${it.quality}">${it.quality === 'green' ? '优秀' : it.quality === 'blue' ? '精良' : it.quality === 'legendary' ? '传说' : '史诗'}</span>${L ? `<span class="tag forge-tag">+${L} 强化</span>` : ''}${enchant ? `<span class="tag enchant-tag">${enchant.icon} ${U.esc(enchant.name)}</span>` : ''}</div>
                <div class="fr-stats">${U.esc(this._forgeStats(it, seen[it.id + '_p']))}${bonusText ? `<span class="fr-bonus"> ${bonusText}</span>` : ''}</div>
              </div>
              <div class="fr-actions">${enhBtn}<button class="btn small ghost" data-enchant-toggle="${it.id}">附魔</button></div>
            </div>
            ${encHtml}
          </div>`;
      }
      // 分解区:背包中可分解的优秀/精良装备(已装备、已强化/附魔的不可分解)
      const deItems = W.Char.Forge._batchableStacks(char);
      const greenN = W.Char.Forge.disenchantCount(char, 'green');
      html += `<div class="forge-de-head">
        <div class="sub-title forge-de-title">🗡️ 装备分解 <span class="de-hint">不用的优秀/精良装备 → 锻造材料</span></div>
        <button class="btn tiny ghost ${greenN ? '' : 'disabled'}" data-disenchant-all="green" ${greenN ? '' : 'disabled'}>⚡ 一键分解全部绿色${greenN ? `（${greenN}）` : ''}</button>
      </div>`;
      if (!deItems.length) {
        html += '<div class="forge-empty">背包中没有可分解的装备（分解可获得奥术粉尘 / 梦境精华 / 奥术水晶）</div>';
      } else {
        for (const s of deItems) {
          const it = D.ITEMS[s.id];
          const y = W.Char.Forge.disenchantYield(it);
          html += `
            <div class="forge-row disenchant-row">
              <div class="fr-head">
                <span class="item-icon">${it.icon}</span>
                <div class="fr-info">
                  <div class="fr-name" style="color:${U.QUALITY_COLOR[it.quality]}">${U.esc(it.name)}${s.perf ? ' <span class="tag perf-tag">✨ 极品</span>' : ''} <span class="tag q-${it.quality}">${it.quality === 'green' ? '优秀' : '精良'}</span> <span class="item-count">×${s.count}</span></div>
                  <div class="fr-stats">可分解为：${U.esc(W.Char.Forge.matsLabel(y))}</div>
                </div>
                <div class="fr-actions"><button class="btn small ghost" data-disenchant="${it.id}" data-perf="${s.perf ? 1 : 0}">分解</button></div>
              </div>
            </div>`;
        }
      }
      // 材料合成:低级材料向上合成(粉尘→精华→水晶)
      html += `<div class="forge-de-head synth-head">
        <div class="sub-title forge-de-title">🧪 材料合成 <span class="de-hint">低级材料向上合成 · 5:1</span></div>
      </div>`;
      html += '<div class="synth-row">';
      for (const [tid, syn] of Object.entries(D.SYNTH || {})) {
        const have = W.Char.Inventory.count(char, syn.from);
        const afford = have >= syn.n && char.gold >= syn.gold;
        html += `<button class="btn tiny ${afford ? '' : 'disabled'}" data-synth="${tid}" ${afford ? '' : 'disabled'} title="${U.esc(syn.desc)}">${D.ITEMS[tid] ? D.ITEMS[tid].icon + ' ' + D.ITEMS[tid].name : tid}（${U.esc(syn.desc)} · ${syn.gold}铜 · 持有${have}）</button>`;
      }
      html += '</div>';
      // 装备打造:消耗材料与金币制作装备
      html += `<div class="forge-de-head craft-head">
        <div class="sub-title forge-de-title">🔨 装备打造 <span class="de-hint">消耗材料与金币直接制作装备</span></div>
      </div>`;
      for (const rp of Object.values(D.CRAFTS || {})) {
        const it = D.ITEMS[rp.item];
        const afford = char.gold >= rp.gold && W.Char.Forge._hasMats(char, rp.mats);
        html += `<div class="forge-row craft-row">
          <div class="fr-head">
            <span class="item-icon">${it ? it.icon : rp.icon}</span>
            <div class="fr-info">
              <div class="fr-name" style="color:${it ? U.QUALITY_COLOR[it.quality] : ''}">${U.esc(rp.name)}${it ? ` <span class="tag q-${it.quality}">${it.quality === 'green' ? '优秀' : it.quality === 'blue' ? '精良' : it.quality === 'legendary' ? '传说' : '史诗'}</span>` : ''}</div>
              <div class="fr-stats">消耗：${U.esc(W.Char.Forge.matsLabel(rp.mats))} · ${U.plainMoney(rp.gold)}</div>
            </div>
            <div class="fr-actions"><button class="btn small gold ${afford ? '' : 'disabled'}" data-craft="${rp.id}" ${afford ? '' : 'disabled'}>打造</button></div>
          </div>
        </div>`;
      }
      W.UI.openModal(html, { title: '⚒️ 锻造铺 · 强化·附魔·分解·合成·打造' });
      const m = document.getElementById('modal-root');
      m.querySelectorAll('[data-enhance]').forEach((btn) => btn.addEventListener('click', () => {
        const r = W.Char.Forge.enhance(char, btn.dataset.enhance);
        if (r.ok) { W.Audio.levelup(); W.UI.toast(`强化成功！${D.ITEMS[btn.dataset.enhance].name} 提升至 +${r.level}`, 'ok'); this.render(); this.openForge(); }
        else W.UI.toast(r.reason, 'warn');
      }));
      m.querySelectorAll('[data-enchant-toggle]').forEach((btn) => btn.addEventListener('click', () => {
        const box = m.querySelector('[data-enchants="' + btn.dataset.enchantToggle + '"]');
        if (box) box.style.display = box.style.display === 'none' ? '' : 'none';
      }));
      m.querySelectorAll('[data-enchant-apply]').forEach((btn) => btn.addEventListener('click', () => {
        const iid = btn.dataset.enchantApply.split(':')[0];
        const eid = btn.dataset.enchantApply.split(':')[1];
        const r = W.Char.Forge.enchant(char, iid, eid);
        if (r.ok) { W.Audio.spell(); W.UI.toast(`附魔成功！${D.ENCHANTS[eid].name}`, 'ok'); this.render(); this.openForge(); }
        else W.UI.toast(r.reason, 'warn');
      }));
      m.querySelectorAll('[data-enchant-remove]').forEach((btn) => btn.addEventListener('click', () => {
        const r = W.Char.Forge.removeEnchant(char, btn.dataset.enchantRemove);
        if (r.ok) { W.Audio.click(); W.UI.toast('已移除附魔', 'ok'); this.render(); this.openForge(); }
        else W.UI.toast(r.reason, 'warn');
      }));
      m.querySelectorAll('[data-disenchant]').forEach((btn) => btn.addEventListener('click', () => {
        const r = W.Char.Forge.disenchant(char, btn.dataset.disenchant, btn.dataset.perf === '1');
        if (r.ok) {
          W.Audio.spell();
          W.UI.toast(`分解成功！${U.esc(r.item)} → ${W.Char.Forge.matsLabel(r.yield)}`, 'ok');
          this.render(); this.openForge();
        } else {
          W.UI.toast(r.reason, 'warn');
        }
      }));
      m.querySelectorAll('[data-synth]').forEach((btn) => btn.addEventListener('click', () => {
        const r = W.Char.Forge.synthesize(char, btn.dataset.synth);
        if (r.ok) { W.Audio.click(); W.UI.toast(`合成成功！${D.ITEMS[r.target].name} +1`, 'ok'); this.render(); this.openForge(); }
        else W.UI.toast(r.reason, 'warn');
      }));
      m.querySelectorAll('[data-craft]').forEach((btn) => btn.addEventListener('click', () => {
        const r = W.Char.Forge.craft(char, btn.dataset.craft);
        if (r.ok) { W.Audio.levelup(); W.UI.toast(`打造成功！获得 ${D.ITEMS[r.item].icon} ${D.ITEMS[r.item].name}`, 'ok'); this.render(); this.openForge(); }
        else W.UI.toast(r.reason, 'warn');
      }));
      this._bindDisenchantAll(m, char, () => { this.render(); this.openForge(); });
    },

    // 批量出售(两段式确认):首次点击进入确认态,再次点击真正执行;3 秒未点自动恢复
    // data-sell-all 按品质(支持逗号合并,如 epic,purple 都算史诗),data-sell-slot 按槽位组
    // onSold(stacks, gold):真正出售后回调,由调用方决定局部刷新或整弹窗重绘
    _bindSellAll(m, char, onSold) {
      const qName = { white: '白色', green: '绿色', blue: '精良', epic: '史诗', purple: '史诗', legendary: '传说' };
      const slotName = { weapon: '武器', offhand: '副手', armor: '护甲', misc: '披风/项链', ring: '戒指', trinket: '饰品' };
      const bind = (btn, sel, label) => {
        btn.addEventListener('click', () => {
          const n = this._batchSellCount(char, sel);
          if (!n) { W.UI.toast('没有可出售的匹配装备', 'warn'); return; }
          if (!btn.dataset.confirm) {
            btn.dataset.confirm = '1';
            if (!btn.dataset.orig) btn.dataset.orig = btn.textContent;
            btn.textContent = `⚠ 确认出售全部${label}（${n} 件）？`;
            btn.classList.add('danger');
            if (btn._t) clearTimeout(btn._t);
            btn._t = setTimeout(() => {
              btn.dataset.confirm = '';
              btn.textContent = btn.dataset.orig;
              btn.classList.remove('danger');
            }, 3000);
            return;
          }
          clearTimeout(btn._t);
          let count = 0, gold = 0;
          const stacks = this._batchSellStacks(char, sel);
          for (const s of stacks) {
            const it = D.ITEMS[s.id];
            const price = Math.max(1, Math.floor(it.sell != null ? it.sell : (it.buy || 0) * 0.4));
            count += s.count;
            gold += price * s.count;
            W.Char.Inventory.remove(char, it.id, s.count, !!s.perf);
          }
          char.gold += gold;
          W.Audio.click();
          W.UI.toast(`出售了 ${count} 件${label}，获得 ${U.plainMoney(gold)}`, 'ok');
          if (onSold) onSold(stacks, gold);
        });
      };
      m.querySelectorAll('[data-sell-all]').forEach((btn) => {
        const qs = btn.dataset.sellAll.split(',');
        bind(btn, { q: qs }, (qName[qs[0]] || '') + '装备');
      });
      m.querySelectorAll('[data-sell-slot]').forEach((btn) => {
        bind(btn, { slot: btn.dataset.sellSlot }, slotName[btn.dataset.sellSlot] || '');
      });
    },

    // 一键分解(两段式确认):首次点击进入确认态,再次点击真正执行;3 秒未点自动恢复
    _bindDisenchantAll(m, char, rerender) {
      m.querySelectorAll('[data-disenchant-all]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const q = btn.dataset.disenchantAll;
          const qName = q === 'green' ? '绿色' : '精良';
          if (!btn.dataset.confirm) {
            btn.dataset.confirm = '1';
            if (!btn.dataset.orig) btn.dataset.orig = btn.textContent;
            const n = W.Char.Forge.disenchantCount(char, q);
            btn.textContent = `⚠ 确认分解全部${qName}装备（${n} 件）？`;
            btn.classList.add('danger');
            if (btn._t) clearTimeout(btn._t);
            btn._t = setTimeout(() => {
              btn.dataset.confirm = '';
              btn.textContent = btn.dataset.orig;
              btn.classList.remove('danger');
            }, 3000);
            return;
          }
          clearTimeout(btn._t);
          const r = W.Char.Forge.disenchantAll(char, q);
          if (!r.ok) { W.UI.toast(r.reason, 'warn'); return; }
          W.Audio.spell();
          W.UI.toast(`分解成功！${r.count} 件${qName}装备 → ${W.Char.Forge.matsLabel(r.yield)}`, 'ok');
          rerender();
        });
      });
    },

    // 锻造弹窗:物品基础属性文本(复用 _itemStatsParts)
    _forgeStats(it, perf) {
      const m = perf ? W.Config.PERFECT_STAT_MULT : 1;
      const parts = [];
      if (it.stats) {
        if (it.stats.dmg) parts.push(`伤害 ${Math.round(it.stats.dmg[0] * m)}-${Math.round(it.stats.dmg[1] * m)}`);
        if (it.stats.armor) parts.push(`护甲 ${Math.round(it.stats.armor * m)}`);
        for (const k of ['str', 'agi', 'stam', 'int', 'spi']) if (it.stats[k]) parts.push({ str: '力量', agi: '敏捷', stam: '耐力', int: '智力', spi: '精神' }[k] + ' +' + Math.round(it.stats[k] * m));
        if (it.stats.crit) parts.push('暴击 +' + Math.round(it.stats.crit * m * 100) + '%');
      }
      return parts.join(' · ');
    },

    // 锻造弹窗:强化/附魔加成文本
    _forgeBonusText(bonus) {
      const parts = [];
      if (bonus.dmg) parts.push('伤害 +' + bonus.dmg);
      if (bonus.armor) parts.push('护甲 +' + bonus.armor);
      for (const k of ['str', 'agi', 'stam', 'int', 'spi']) if (bonus[k]) parts.push({ str: '力量', agi: '敏捷', stam: '耐力', int: '智力', spi: '精神' }[k] + ' +' + bonus[k]);
      if (bonus.crit) parts.push('暴击 +' + Math.round(bonus.crit * 100) + '%');
      if (bonus.dodge) parts.push('闪避 +' + Math.round(bonus.dodge * 100) + '%');
      if (bonus.hp) parts.push('生命 +' + bonus.hp);
      if (bonus.lifesteal) parts.push('吸血 ' + Math.round(bonus.lifesteal * 100) + '%');
      return parts.length ? '<b>加成：</b>' + parts.join(' · ') : '';
    },

    /* ---------- 天赋 ---------- */
    openTalents() {
      const char = W.State.character;
      if (char.level < 10) { W.UI.toast('天赋系统将在 10 级解锁', 'warn'); return; }
      const trees = D.TALENTS[char.classId] || [];
      let cur = this._talentTree;
      if (!trees.find((t) => t.id === cur)) cur = trees[0] && trees[0].id;
      this._talentTree = cur;
      this._renderTalents(cur);
    },

    _renderTalents(treeId, animate) {
      const char = W.State.character;
      const cls = D.CLASSES[char.classId];
      const trees = D.TALENTS[char.classId] || [];
      const tree = trees.find((t) => t.id === treeId);
      if (!tree) return;
      const unspent = W.Char.getUnspent(char);
      const treePts = W.Char.treePoints(char, treeId);
      const spent = W.Char.pointsSpent(char);
      const total = W.Char.talentPointsAt(char.level);
      const respec = W.Char.respecCost(char);
      // 触屏滑动守卫:滑动翻页后短暂拦截点击,避免误触天赋/标签(250ms 足够抑制跟随点击)
      const swipeGuard = () => this._swipeGuardAt && Date.now() - this._swipeGuardAt < 250;

      let tabs = '';
      for (const t of trees) {
        tabs += `<button class="talent-tab ${t.id === treeId ? 'active' : ''}" data-tree="${t.id}" style="--tc:${t.color}">${t.icon} ${t.name}<span class="tt-pts">${W.Char.treePoints(char, t.id)}</span></button>`;
      }

      let nodes = '';
      for (let tier = 0; tier < 3; tier++) {
        const tierNodes = tree.talents.filter((n) => n.tier === tier);
        const unlocked = treePts >= tier * 5;
        nodes += `<div class="talent-tier ${unlocked ? '' : 'locked-tier'}">`;
        if (tier > 0) nodes += `<div class="tier-gate"><span>需要本系 ${tier * 5} 点</span></div>`;
        nodes += '<div class="tier-row">';
        for (const n of tierNodes) {
          const rank = W.Char.rankOf(char, treeId, n.id);
          const learnable = unlocked && unspent > 0 && rank < n.max;
          const state = rank >= n.max ? 'maxed' : (rank > 0 ? 'ranked' : (learnable ? 'learnable' : 'locked'));
          const pips = '●'.repeat(rank) + '○'.repeat(Math.max(0, n.max - rank));
          // 天赋技能:已转被动(如心灵之火/寒冰护体)标记为「被动」,其余为「主动」
          const skillAct = n.active && D.SKILLS[n.active];
          const isActiveSkill = !!skillAct && !skillAct.passive;
          nodes += `
            <button class="talent-node ${state} ${n.active ? 'is-active' : ''}" data-tree="${treeId}" data-talent="${n.id}" title="${U.esc(n.name)}${skillAct ? '（' + (isActiveSkill ? '主动技能' : '被动技能') + '：' + U.esc(skillAct.name) + '）' : ''}">
              <span class="tn-icon">${n.icon}</span>
              <span class="tn-name">${U.esc(n.name)}${n.active ? '<span class="tn-active">' + (isActiveSkill ? '主动' : '被动') + '</span>' : ''}</span>
              <span class="tn-rank">${pips}</span>
              <span class="tn-desc">${U.esc(this._talentDesc(n, rank))}</span>
            </button>`;
        }
        nodes += '</div></div>';
      }

      const modal = W.UI.openModal(`
        <div class="talent-head">
          <div class="talent-points"><span class="tp-num">${unspent}</span> 可用天赋点 <span class="tag">已分配 ${spent}/${total}</span></div>
          <div class="talent-respec"><button class="btn small ghost" data-respec>↺ 重置天赋（${U.plainMoney(respec)}）</button></div>
        </div>
        <div class="talent-desc">${U.esc(tree.desc)}</div>
        <div class="talent-tabs">${tabs}</div>
        <div class="swipe-hint">◀ 左右滑动切换专精 ▶</div>
        <div class="talent-tree ${animate ? 'tree-anim' : ''}" style="--tc:${tree.color}">${nodes}</div>
        ${this._buildsHtml(char)}
        <div class="talent-foot">左键学习 · 右键卸载 · 本系已投入 ${treePts} 点</div>`,
        { title: `天赋 · ${cls.name}`, cls: 'talent-modal' });

      // 触屏滑动切换专精(桌面鼠标拖拽同样可用)
      const treeEl = modal.querySelector('.talent-tree');
      if (treeEl) this._bindSwipe(treeEl, {
        onSwipe: (v) => {
          if (v !== 'left' && v !== 'right') return;
          this._swipeGuardAt = Date.now();
          const ids = (D.TALENTS[char.classId] || []).map((t) => t.id);
          const nxt = ids[W.Utils.cycleIndex(ids, this._talentTree, v === 'left' ? 1 : -1)];
          if (nxt && nxt !== this._talentTree) { W.Audio.click(); this._talentTree = nxt; this._renderTalents(nxt, true); }
        },
        onDrag: (dx, el) => {
          el.classList.add('swiping');
          el.style.transform = 'translateX(' + (dx * 0.45).toFixed(1) + 'px)';
        },
        onEnd: (el) => {
          el.classList.remove('swiping');
          el.style.transition = 'transform .2s ease';
          el.style.transform = '';
          setTimeout(() => { el.style.transition = ''; }, 240);
        },
      }, treeEl);

      modal.querySelectorAll('.talent-tab').forEach((b) => b.addEventListener('click', () => {
        if (swipeGuard()) return;
        this._talentTree = b.dataset.tree;
        this._renderTalents(b.dataset.tree, true);
      }));
      modal.querySelectorAll('.talent-node').forEach((b) => {
        b.addEventListener('click', () => {
          if (swipeGuard()) return;
          const r = W.Char.learnTalent(char, b.dataset.tree, b.dataset.talent);
          if (r.ok) { W.Audio.levelup(); this._renderTalents(treeId); }
          else W.UI.toast(r.reason, 'warn');
        });
        b.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          const r = W.Char.unlearnTalent(char, b.dataset.tree, b.dataset.talent);
          if (r.ok) { W.Audio.click(); this._renderTalents(treeId); }
        });
      });
      // 推荐搭配一键分配
      modal.querySelectorAll('[data-apply]').forEach((btn) => btn.addEventListener('click', () => {
        const bd = (D.TALENT_BUILDS[char.classId] || [])[parseInt(btn.dataset.apply, 10)];
        if (!bd) return;
        const r = W.Char.applyBuild(char, bd);
        if (r.applied.length && r.remaining === 0) W.UI.toast(`已按「${bd.name}」分配 ${r.applied.length} 点天赋`, 'ok');
        else if (r.applied.length) W.UI.toast(`已分配 ${r.applied.length} 点，还差 ${r.remaining} 点（升级可获得）`, 'warn');
        else if (r.remaining === 0) W.UI.toast(`「${bd.name}」已全部习得`, 'ok');
        else W.UI.toast(r.reason || '无法分配', 'warn');
        if (r.applied.length) W.Audio.levelup();
        this._renderTalents(treeId);
      }));
      const rp = modal.querySelector('[data-respec]');
      if (rp) rp.addEventListener('click', () => {
        // 就地确认(避免关闭天赋弹窗)
        const body = modal.querySelector('.modal-body');
        body.innerHTML = `
          <p class="confirm-text">将花费 <b>${U.plainMoney(respec)}</b> 重置全部天赋点。重置后将退还全部天赋点，确定吗？</p>
          <div class="modal-actions">
            <button class="btn gold" data-yes2>确认重置</button>
            <button class="btn ghost" data-no2>取消</button>
          </div>`;
        body.querySelector('[data-yes2]').addEventListener('click', () => {
          const r = W.Char.respecTalents(char);
          if (r.ok) { W.Audio.levelup(); W.UI.toast('天赋已重置', 'ok'); }
          else W.UI.toast(r.reason, 'warn');
          this._renderTalents(treeId);
        });
        body.querySelector('[data-no2]').addEventListener('click', () => {
          this._renderTalents(treeId);
        });
      });
    },

    /* 通用触屏滑动绑定:支持 Pointer Events(桌面鼠标拖拽亦兼容),旧浏览器回退 touch 事件
     * handlers: { onSwipe(verdict, dx), onDrag(dx, dragEl), onEnd(dragEl) }
     * dragEl: 拖拽跟随目标元素(默认 el 本身) */
    _bindSwipe(el, handlers, dragEl) {
      if (!el) return;
      const target = dragEl || el;
      const hasPointer = typeof window.PointerEvent !== 'undefined';
      let sx = 0, sy = 0, dx = 0, dy = 0, active = false, moved = false, captured = false, capturedId = null;
      const px = (e) => (e.touches && e.touches[0] ? e.touches[0].clientX : e.clientX) || 0;
      const py = (e) => (e.touches && e.touches[0] ? e.touches[0].clientY : e.clientY) || 0;
      // 释放指针捕获(浏览器在 pointerup/cancel 时也会自动释放,这里兜底)
      const releaseCapture = () => {
        if (captured && capturedId != null && typeof el.releasePointerCapture === 'function') {
          try { el.releasePointerCapture(capturedId); } catch (err) { /* 忽略释放失败 */ }
        }
        captured = false; capturedId = null;
      };
      const down = (e) => {
        if (e.button === 2) return; // 忽略右键(天赋卸载用)
        active = true; moved = false; dx = dy = 0; captured = false; capturedId = null;
        sx = px(e); sy = py(e);
        // 注意:这里不立即捕获指针!按下即捕获会把后续 click 事件重定向到容器,
        // 导致容器内按钮(如天赋加点节点)点击失效。仅在 move 确认真正拖动后才捕获。
      };
      const move = (e) => {
        if (!active) return;
        dx = px(e) - sx; dy = py(e) - sy;
        if (Math.abs(dx) > 6 || Math.abs(dy) > 6) moved = true;
        // 横向占优时阻止默认(避免与纵向滚动冲突),并提供拖拽跟随
        if (Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(dy)) {
          if (e.cancelable && e.preventDefault) e.preventDefault();
          // 仅在真正开始拖动时捕获指针:手指滑出容器仍持续追踪手势(jsdom 无此方法自动跳过)
          if (!captured && typeof el.setPointerCapture === 'function' && e.pointerId != null) {
            captured = true; capturedId = e.pointerId;
            try { el.setPointerCapture(e.pointerId); } catch (err) { /* 忽略捕获失败 */ }
          }
          if (handlers.onDrag) handlers.onDrag(dx, target);
        }
      };
      const up = () => {
        if (!active) return;
        active = false;
        releaseCapture();
        // 仅在真正拖动过时复位 transform(避免每次点击都产生过渡与定时器)
        if (moved && handlers.onEnd) handlers.onEnd(target);
        if (!moved) return;
        const v = W.Utils.swipeVerdict(dx, dy, W.Config.TOUCH_SWIPE_THRESHOLD);
        if (handlers.onSwipe) handlers.onSwipe(v, dx);
      };
      const cancel = () => {
        if (!active) return;
        active = false;
        releaseCapture();
        if (moved && handlers.onEnd) handlers.onEnd(target);
      };
      if (hasPointer) {
        el.addEventListener('pointerdown', down);
        el.addEventListener('pointermove', move);
        el.addEventListener('pointerup', up);
        el.addEventListener('pointercancel', cancel);
      } else {
        el.addEventListener('touchstart', down, { passive: true });
        el.addEventListener('touchmove', move, { passive: false });
        el.addEventListener('touchend', up);
        el.addEventListener('touchcancel', cancel);
      }
    },

    // 推荐搭配面板
    _buildsHtml(char) {
      const builds = D.TALENT_BUILDS[char.classId] || [];
      if (!builds.length) return '';
      let html = `<div class="talent-builds">
        <div class="builds-title">📋 推荐搭配<span class="builds-hint">经典点法 · 可一键分配</span></div>`;
      builds.forEach((bd, i) => {
        html += `
          <div class="build-row">
            <span class="build-icon">${bd.icon}</span>
            <div class="build-info">
              <div class="build-name">${U.esc(bd.name)}</div>
              <div class="build-desc">${U.esc(bd.desc)}</div>
              <div class="build-pts">${bd.points.map(([tid, r]) => `${U.esc(this._talentName(bd.tree, tid))} ${r}`).join(' · ')}</div>
            </div>
            <button class="btn tiny gold" data-apply="${i}">一键分配</button>
          </div>`;
      });
      html += '</div>';
      return html;
    },

    // 渲染天赋描述:将 {n}/{n2} 替换为当前(或预览)效果值
    _talentDesc(node, rank) {
      if (rank <= 0) rank = 1;
      const mods = node.mods || [];
      const val = (mi) => {
        const mod = mods[mi];
        if (!mod) return '?';
        const v = mod.per * rank;
        return mod.per < 1 ? Math.round(v * 100) : v;
      };
      return node.desc.replace(/\{n2\}/g, val(1)).replace(/\{n\}/g, val(0));
    },

    /* ---------- 宠物(猎人) ---------- */
    openPets() {
      const char = W.State.character;
      if (char.classId !== 'hunter') { W.UI.toast('只有猎人拥有宠物栏', 'warn'); return; }
      const pets = W.Char.Pets.list(char);
      let html = '<div class="pets-note">战斗中可使用「驯服野兽」驯服生命低于 50% 的野兽；击败野兽也有几率自动驯服。可切换出战的宠物伙伴。</div>';
      if (!pets.length) html += '<div class="empty">宠物栏空空如也</div>';
      for (const p of pets) {
        const active = p.id === char.activePet;
        html += `
          <div class="pet-row ${active ? 'active' : ''}">
            <span class="pet-icon">${p.icon}</span>
            <div class="pet-info">
              <div class="pet-name">${U.esc(p.name)}${active ? ' <span class="tag gold-tag">出战</span>' : ''}</div>
              <div class="pet-desc">${U.esc(p.desc || '')}${p.taunt ? '（自带嘲讽）' : ''}</div>
            </div>
            <div class="pet-actions">
              ${active ? '' : `<button class="btn tiny gold" data-pet-active="${p.id}">设为出战</button>`}
              ${pets.length > 1 ? `<button class="btn tiny ghost" data-pet-release="${p.id}">放生</button>` : ''}
            </div>
          </div>`;
      }
      html += `<div class="pets-foot">宠物栏 ${pets.length} / ${C.PET_STABLE}</div>`;
      W.UI.openModal(html, { title: '宠物 · 猎人的伙伴' });
      const m = document.getElementById('modal-root');
      m.querySelectorAll('[data-pet-active]').forEach((btn) => btn.addEventListener('click', () => {
        if (W.Char.Pets.setActive(char, btn.dataset.petActive)) { W.Audio.click(); W.UI.toast('已切换出战宠物', 'ok'); this.openPets(); }
      }));
      m.querySelectorAll('[data-pet-release]').forEach((btn) => btn.addEventListener('click', () => {
        const r = W.Char.Pets.release(char, btn.dataset.petRelease);
        if (r.ok) { W.Audio.click(); this.openPets(); } else W.UI.toast(r.reason, 'warn');
      }));
    },

    /* ---------- 技能 ---------- */
    // 技能书单行 HTML(分组标签由调用方按页输出)
    _skillRowHtml(s) {
      const cost = s.passive ? '<span class="sk-cost-tag passive-tag">被动 · 常驻</span>' : (s.res ? `<span class="sk-cost-tag">${s.res === 'rage' ? '怒气' : s.res === 'energy' ? '能量' : '法力'} ${s.cost || 0}</span>` : '');
      const cd = s.passive ? '' : (s.cd ? `<span class="sk-cost-tag">冷却 ${s.cd}</span>` : '');
      const treeTag = s.talent ? this._talentTreeOf(s.id) : '';
      return `
        <div class="skill-row">
          <span class="sk-big-icon">${s.icon}</span>
          <div class="sk-info">
            <div class="sk-name">${U.esc(s.name)} ${cost}${cd}${treeTag}</div>
            <div class="sk-desc">${U.esc(s.desc)}</div>
          </div>
        </div>`;
    },

    // 技能书翻页(触屏左右滑动 / 页码点)
    _flipSkillPage(dir) {
      const m = document.getElementById('modal-root');
      if (!m || !m.classList.contains('show')) return;
      const pages = m.querySelectorAll('.skill-page');
      if (pages.length <= 1) return;
      const next = W.Utils.clamp(this._skillPage + dir, 0, pages.length - 1);
      if (next === this._skillPage) return;
      this._skillPage = next;
      pages.forEach((pg, i) => pg.classList.toggle('active', i === next));
      m.querySelectorAll('.skill-dot').forEach((d, i) => d.classList.toggle('active', i === next));
      W.Audio.click();
    },

    openSkills() {
      const char = W.State.character;
      const cls = D.CLASSES[char.classId];
      // 分组排序:职业技能(主动在前) → 被动技能 → 种族天赋 → 天赋主动技能
      const order = [];
      for (const sid of cls.skills) if (char.learnedSkills.includes(sid) && !(D.SKILLS[sid] || {}).passive) order.push(sid);
      for (const sid of cls.skills) if (char.learnedSkills.includes(sid) && (D.SKILLS[sid] || {}).passive) order.push(sid);
      for (const t of D.RACES[char.race].traits || []) if (t.active && char.learnedSkills.includes(t.active)) order.push(t.active);
      for (const sid of char.learnedSkills) if (!order.includes(sid)) order.push(sid);

      // 分页渲染(每页自带分组标题,触屏左右滑动翻页)
      const pages = W.Utils.paginate(order, W.Config.SKILL_PAGE_SIZE);
      let pagesHtml = '';
      for (let p = 0; p < pages.length; p++) {
        let inner = '';
        let lastGroup = '';
        for (const sid of pages[p]) {
          const s = D.SKILLS[sid];
          if (!s) continue;
          const group = s.passive ? '被动技能' : (s.race ? '种族天赋' : (s.talent ? '天赋技能' : '职业技能'));
          if (group !== lastGroup) { inner += `<div class="skills-group">${group}</div>`; lastGroup = group; }
          inner += this._skillRowHtml(s);
        }
        pagesHtml += `<div class="skill-page ${p === 0 ? 'active' : ''}" data-page="${p}">${inner}</div>`;
      }
      const nav = pages.length > 1
        ? `<div class="skill-nav">${pages.map((_, i) => `<button class="skill-dot ${i === 0 ? 'active' : ''}" data-page="${i}" aria-label="第 ${i + 1} 页"></button>`).join('')}<span class="skill-count">${pages.length} 页</span></div>`
        : '';

      // 被动机制教学说明(习得被动技能时展示,可折叠):属性常驻 / 战斗触发 / 起始护盾 / 自动标记
      const hasPassive = (char.learnedSkills || []).some((sid) => { const s = D.SKILLS[sid]; return s && s.passive; });
      const passiveNote = hasPassive
        ? `<div class="passive-note">
            <button class="pn-toggle" type="button" aria-expanded="false" title="展开/收起被动机制说明"><span>💡 <b>被动技能 · 效果常驻</b> <em class="pn-sum">点击查看机制说明</em></span><span class="pn-arrow">▸</span></button>
            <div class="pn-body" hidden><b>属性类</b>直接计入属性面板：常驻技能（战斗怒吼/盾牌格挡/切割/嗜血/形态等）与<b>天赋爆发</b>（鲁莽/死亡之愿/盾墙/燃烧/奥术强化/复仇之怒/元素掌握/暗影形态/狂暴/猛虎之怒等）——后者按「爆发幅度 × 覆盖率」折算为常驻小加成，无需再手动开启。<b>战斗类</b>常驻触发：正义圣印攻击附加神圣伤害、荆棘术反弹近战伤害；<b>起始护盾</b>：萨满「大地之盾」、法师「寒冰护体」、圣骑士「神圣防护」在<b>战斗开始时</b>自动获得吸收护盾（大地之盾受击还会回血）；<b>自动标记</b>：猎人「猎人印记」在战斗开始时自动标记首个敌人，提高其受到的伤害；<b>宠物强化</b>：猎人「狂野怒火」、术士「恶魔狂暴」使宠物攻击力常驻提高。对应天赋（强化战斗怒吼/强化切割等）会进一步增强被动效果，战斗界面玩家卡牌下方会显示当前生效的被动图标。<button class="btn tiny gold pn-overview">♾️ 查看被动效果总览</button></div>
          </div>`
        : '';

      // 副手装备引导(可折叠):盾牌 / 副刃 / 圣物适用职业说明
      const offNote = `<div class="off-note">
        <button class="of-toggle" type="button" aria-expanded="false" title="展开/收起副手装备说明"><span>🛡️ <b>副手装备 · 独立槽位</b> <em class="pn-sum">点击查看盾牌/圣物适用职业</em></span><span class="pn-arrow">▸</span></button>
        <div class="pn-body" hidden>副手是<b>主手武器之外</b>的独立装备槽（不占背包、不与武器冲突），<b>任何职业</b>都能装备，可正常<b>强化 + 附魔</b>。三类副手各有侧重：<b>🛡️ 盾牌</b>（兽皮圆盾→龙鳞守卫）高护甲 + 耐力，高级盾牌额外带力量/闪避，适合<b>战士 / 圣骑士</b>等前排；<b>🔪 副刃</b>（猎手短刃/剃刀副刃）敏捷，剃刀副刃附加暴击，适合<b>盗贼 / 猎人</b>；<b>🌙 圣物</b>（月神圣物/日神圣物）智力 + 精神，日神圣物附加暴击，适合<b>萨满 / 德鲁伊 / 牧师 / 法师 / 术士</b>等施法职业；<b>📖 加丁的黑暗密典</b>（通灵学院掉落）智力 + 精神。12 级起各区域商贩与怪物掉落均有产出，缺副手时优先光顾对应等级区的商店。</div>
      </div>`;

      W.UI.openModal(
        this._classPanel(char) +
        `<div class="skills-note">${U.esc(cls.desc)}</div>` +
        offNote +
        passiveNote +
        `<div class="skill-pages">${pagesHtml}</div>` +
        nav +
        (pages.length > 1 ? '<div class="swipe-hint skill-hint">◀ 左右滑动翻页 ▶</div>' : ''),
        { title: '技能书 · ' + cls.name });
      this._skillPage = 0;

      const m = document.getElementById('modal-root');
      // 副手装备说明:点击标题栏展开/收起
      const ofToggle = m.querySelector('.of-toggle');
      if (ofToggle) ofToggle.addEventListener('click', () => {
        const body = ofToggle.closest('.off-note').querySelector('.pn-body');
        const open = body.hidden;
        body.hidden = !open;
        ofToggle.classList.toggle('open', open);
        ofToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        W.Audio.click();
      });
      // 被动机制说明:点击标题栏展开/收起(减少面板占用)
      const pnToggle = m.querySelector('.pn-toggle');
      if (pnToggle) pnToggle.addEventListener('click', () => {
        const body = pnToggle.closest('.passive-note').querySelector('.pn-body');
        const open = body.hidden;
        body.hidden = !open;
        pnToggle.classList.toggle('open', open);
        pnToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        W.Audio.click();
      });
      // 被动效果总览入口(技能书双入口:状态面板 + 此处)
      const poBtn = m.querySelector('.pn-overview');
      if (poBtn) poBtn.addEventListener('click', () => this._openPassiveOverview());
      // 页码点跳转
      m.querySelectorAll('.skill-dot').forEach((d) => d.addEventListener('click', () => {
        this._flipSkillPage(parseInt(d.dataset.page, 10) - this._skillPage);
      }));
      // 触屏左右滑动翻页
      const pagesEl = m.querySelector('.skill-pages');
      if (pagesEl && pages.length > 1) this._bindSwipe(pagesEl, {
        onSwipe: (v) => {
          if (v !== 'left' && v !== 'right') return;
          this._flipSkillPage(v === 'left' ? 1 : -1);
        },
        onDrag: (dx, el) => {
          el.classList.add('swiping');
          el.style.transform = 'translateX(' + (dx * 0.4).toFixed(1) + 'px)';
        },
        onEnd: (el) => {
          el.classList.remove('swiping');
          el.style.transition = 'transform .2s ease';
          el.style.transform = '';
          setTimeout(() => { el.style.transition = ''; }, 240);
        },
      }, pagesEl);
      m.querySelectorAll('[data-poison-off]').forEach((btn) => btn.addEventListener('click', () => {
        W.Char.removePoison(char);
        W.Audio.click();
        W.UI.toast('已解除武器毒药', 'ok');
        this.openSkills();
      }));
    },

    // 状态面板职业专精信息
    _statusClassInfo(char) {
      if (char.classId === 'rogue') {
        const p = char.poison;
        const pit = p && D.ITEMS[p.id];
        return `<div class="stat-block wide"><div class="sub-title">☠️ 毒药</div>
          <div class="trait">${pit ? `${pit.icon} <b>${U.esc(pit.name)}</b>（剩余 ${p.charges} 次）` : '未涂抹毒药'}</div></div>`;
      }
      if (char.classId === 'hunter') {
        const active = W.Char.Pets.active(char);
        return `<div class="stat-block wide"><div class="sub-title">🐾 宠物</div>
          <div class="trait">出战：${active ? active.icon + ' <b>' + U.esc(active.name) + '</b>' : '无'} · 宠物栏 ${W.Char.Pets.list(char).length}/${C.PET_STABLE}</div></div>`;
      }
      if (char.classId === 'warlock') {
        return `<div class="stat-block wide"><div class="sub-title">💜 灵魂碎片</div>
          <div class="trait">当前 <b>${char.soulShards || 0}</b> / ${C.SOUL_SHARD_CAP}（击败敌人时收割）</div></div>`;
      }
      return '';
    },

    // 职业专精面板(技能书顶部):毒药 / 宠物 / 灵魂碎片
    _classPanel(char) {
      if (char.classId === 'rogue') {
        let html = `<div class="class-panel"><div class="sub-title">☠️ 毒药系统</div>
          <div class="sk-desc">盗贼可在<b>背包</b>中为武器涂抹毒药，普通攻击必触发、近战技能 60% 几率触发，每次触发消耗 1 次（共 ${C.POISON_CHARGES} 次）。速效：附加自然伤害；致命：持续中毒；致残：麻痹目标降低攻击。</div>`;
        if (char.poison) {
          const pit = D.ITEMS[char.poison.id];
          html += `<div class="poison-cur">当前武器：${pit ? pit.icon + ' ' + U.esc(pit.name) : '未知毒药'}（剩余 ${char.poison.charges} 次） <button class="btn tiny ghost" data-poison-off>解除毒药</button></div>`;
        } else {
          html += '<div class="poison-cur dim">当前武器：未涂抹毒药</div>';
        }
        return html + '</div>';
      }
      if (char.classId === 'hunter') {
        const pets = W.Char.Pets.list(char);
        const active = W.Char.Pets.active(char);
        return `<div class="class-panel"><div class="sub-title">🐾 宠物驯服</div>
          <div class="sk-desc">战斗中可使用「驯服野兽」驯服生命低于 50% 的野兽；击败野兽也有 30% 几率自动驯服。驯服后可切换出战的宠物。</div>
          <div class="poison-cur">当前出战：${active ? active.icon + ' ' + U.esc(active.name) : '无'}（宠物栏 ${pets.length}/${C.PET_STABLE}）</div></div>`;
      }
      if (char.classId === 'warlock') {
        return `<div class="class-panel"><div class="sub-title">💜 灵魂碎片</div>
          <div class="sk-desc">击败敌人时收割灵魂碎片（上限 ${C.SOUL_SHARD_CAP} 枚）。消耗碎片：<b>灵魂之火</b> 1 枚 · <b>召唤地狱火</b> 3 枚。</div>
          <div class="poison-cur">当前碎片：<b>${char.soulShards || 0}</b> / ${C.SOUL_SHARD_CAP}</div></div>`;
      }
      return '';
    },

    // 天赋技能所属系与节点信息(总览面板展示来源树/所需点数用)
    _talentInfoOf(clsId, skillId) {
      for (const tree of D.TALENTS[clsId] || []) {
        const node = tree.talents.find((n) => n.active === skillId);
        if (node) return { tree, node };
      }
      return null;
    },

    // 天赋技能所属系标签
    _talentTreeOf(skillId) {
      const info = this._talentInfoOf(W.State.character.classId, skillId);
      return info ? `<span class="tag talent-tag">${info.tree.icon}${U.esc(info.tree.name)}天赋</span>` : '<span class="tag talent-tag">天赋</span>';
    },

    _talentName(treeId, talentId) {
      const tree = (D.TALENTS[W.State.character.classId] || []).find((t) => t.id === treeId);
      const node = tree && tree.talents.find((n) => n.id === talentId);
      return node ? node.name : talentId;
    },

    /* ---------- 存档 ---------- */
    openSave() {
      const char = W.State.character;
      const slots = W.State.loadSlots();
      let html = '<div class="save-slots">';
      for (let i = 0; i < C.MAX_SLOTS; i++) {
        const s = slots[i];
        const isCur = W.State._saveSlot === i;
        if (s) {
          html += W.State.saveRowHtml(s, i, { cur: isCur, save: true, load: true, del: true });
        } else {
          html += `
            <div class="save-row empty">
              <div class="save-info">空存档槽</div>
              <button class="btn small" data-save="${i}">保存</button>
            </div>`;
        }
      }
      html += '</div>';
      W.UI.openModal(html, { title: '存档管理' });
      const m = document.getElementById('modal-root');
      m.querySelectorAll('[data-save]').forEach((btn) => btn.addEventListener('click', () => {
        W.State.save(parseInt(btn.dataset.save, 10));
        W.Audio.levelup();
        W.UI.toast('已保存进度', 'ok');
        this.openSave();
      }));
      m.querySelectorAll('[data-load]').forEach((btn) => btn.addEventListener('click', () => {
        if (W.State.load(parseInt(btn.dataset.load, 10))) {
          W.UI.closeModal();
          W.UI.toast('读档成功', 'ok');
          this.showWorld();
        }
      }));
      m.querySelectorAll('[data-del]').forEach((btn) => btn.addEventListener('click', () => {
        W.State.erase(parseInt(btn.dataset.del, 10));
        this.openSave();
      }));
    },

    /* ============ 设置:UI 偏好统一管理 ============ */
    openSettings() {
      // 音效(标题界面/设置面板双向同步) 与 战斗道具栏折叠(战斗内开关/设置面板双向同步)
      const readPref = (k) => { try { return localStorage.getItem(k) === '1'; } catch (e) { return false; } };
      let soundMuted = readPref(W.Audio.SOUND_KEY);
      let itemsCollapsed = W.BattleView ? readPref(W.BattleView.COLLAPSE_KEY) : false;
      const sw = (key, on) => `<button type="button" class="set-switch${on ? ' on' : ''}" data-set="${key}" role="switch" aria-checked="${on}" title="${on ? '点击关闭' : '点击开启'}"><i></i></button>`;
      const html = `
        <div class="set-group">
          <div class="set-group-title">🎛️ 界面与声音</div>
          <div class="set-row" data-set-row="sound">
            <div class="set-info">
              <div class="set-name">🔊 游戏音效</div>
              <div class="set-desc">开启或关闭战斗与操作提示音（标题界面按钮同步）</div>
            </div>
            ${sw('sound', !soundMuted)}
          </div>
          <div class="set-row" data-set-row="itemsCollapsed">
            <div class="set-info">
              <div class="set-name">🎒 战斗道具栏默认折叠</div>
              <div class="set-desc">战斗中道具栏默认收起仅显示计数，腾出界面空间；收起后仍可用 Q/E/R/F 快捷键一键喝药急救</div>
            </div>
            ${sw('itemsCollapsed', itemsCollapsed)}
          </div>
        </div>
        <div class="set-group">
          <div class="set-group-title">🔄 版本与更新</div>
          <div class="set-row" data-set-row="update">
            <div class="set-info">
              <div class="set-name">📦 当前版本 v${W.Utils.esc((window.WOW_VERSION || '1.0.0'))}</div>
              <div class="set-desc">从 GitHub 仓库 <b>chwl66/wow-web</b> 检查最新版本，发现新版本后可前往下载更新 APK（存档保留）</div>
            </div>
            <button type="button" class="btn gold small" data-set-update>🔄 检查更新</button>
          </div>
        </div>`;
      W.UI.openModal(html, { title: '设置' });
      const m = document.getElementById('modal-root');
      m.querySelectorAll('[data-set]').forEach((swEl) => {
        swEl.addEventListener('click', () => {
          const key = swEl.dataset.set;
          if (key === 'sound') {
            soundMuted = !soundMuted;
            W.Audio.muted = soundMuted;
            if (!soundMuted) W.Audio.init(); // 取消静音时补建音频上下文(否则首屏点击在静音态跳过,取消后仍无声)
            try { localStorage.setItem(W.Audio.SOUND_KEY, soundMuted ? '1' : '0'); } catch (e) { /* ignore */ }
            // 标题界面音效按钮同步显示
            const sb = document.querySelector('#view-title [data-act="sound"]');
            if (sb) sb.innerHTML = soundMuted ? '🔇 音效：关' : '🔊 音效：开';
          } else if (key === 'itemsCollapsed') {
            itemsCollapsed = !itemsCollapsed;
            if (W.BattleView) W.BattleView._itemsCollapsed = itemsCollapsed;
            try { localStorage.setItem(W.BattleView.COLLAPSE_KEY, itemsCollapsed ? '1' : '0'); } catch (e) { /* ignore */ }
          }
          swEl.classList.toggle('on', key === 'sound' ? !soundMuted : itemsCollapsed);
          if (swEl.getAttribute) swEl.setAttribute('aria-checked', swEl.classList.contains('on') ? 'true' : 'false');
          W.Audio.click();
        });
      });
      // 手动检查更新
      const upd = m.querySelector('[data-set-update]');
      if (upd && W.Updater) {
        upd.addEventListener('click', () => {
          W.Audio.click();
          upd.disabled = true;
          upd.innerHTML = '⏳ 检查中…';
          W.Updater.manual().then(() => {
            upd.disabled = false;
            upd.innerHTML = '🔄 检查更新';
          });
        });
      }
    },

    backToTitle() {
      this._stopEliteTicker();
      this._hintedZone = null; // 换角色/重新进入时重置稀有精英提示
      W.UI.confirm('返回标题', '返回标题将退出当前游戏（进度请先存档）。', () => {
        W.State.reset();
        W.UI.showView('title');
        W.Main.renderTitle();
      });
    },
  };

  W.World = World;
})();
