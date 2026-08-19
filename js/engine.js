/* 魔兽世界 · 战大陆 — 核心引擎:状态管理 / 存档 / UI 框架 / 音效 */
(function () {
  'use strict';
  const W = window.WOW;
  const C = W.Config;
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  W.$ = $; W.$$ = $$;

  /* ============ 游戏状态 ============ */
  const State = {
    character: null,
    saveSlots: [],       // [{name, class, level, zone, savedAt, data}]
    _saveSlot: 0,        // 当前存档槽
    lastSavedAt: 0,      // 最近保存时间戳(供自动存档指示器显示)
    _lastAutoSave: 0,    // 上次自动存档时间戳(节流)
    _autoToast: false,   // 会话内是否已提示过自动存档

    newCharacter(char) {
      this.character = char;
    },

    // ---------- 存档 ----------
    // src: 'manual' 手动保存 / 'auto' 自动保存
    save(slot, src) {
      const idx = slot == null ? this._saveSlot : slot;
      const c = this.character;
      if (!c) return;
      const entry = {
        name: c.name, classCN: W.Data.CLASSES[c.classId].name, raceCN: W.Data.RACES[c.race].name,
        level: c.level, zone: c.zone, savedAt: Date.now(),
        src: src || 'manual',          // 存档来源(自动/手动)
        gold: c.gold,                  // 金币摘要
        zoneCN: (W.Data.ZONES[c.zone] || {}).name || c.zone, // 位置摘要
        data: JSON.parse(JSON.stringify(c)),
      };
      this.saveSlots[idx] = entry;
      this._saveSlot = idx;
      this.lastSavedAt = entry.savedAt;
      this.persist();
    },

    // 存档条目摘要(兼容旧存档字段缺失)
    slotSummary(entry) {
      if (!entry) return null;
      const d = entry.data || {};
      const zoneName = (zid) => (zid && W.Data.ZONES[zid] ? W.Data.ZONES[zid].name : null);
      return {
        level: entry.level != null ? entry.level : (d.level || 1),
        gold: entry.gold != null ? entry.gold : (d.gold || 0),
        zoneCN: entry.zoneCN || zoneName(d.zone) || zoneName(entry.zone) || '未知区域',
        src: entry.src || 'manual',
        savedAt: entry.savedAt || 0,
      };
    },

    // 存档槽行 HTML(世界界面/标题界面的存档管理共用,按钮集由 opts 控制)
    // opts: { cur, save, load, del, primary: 'save'|'load' }
    saveRowHtml(s, i, opts) {
      opts = opts || {};
      const sm = this.slotSummary(s);
      const srcTag = sm.src === 'auto'
        ? '<span class="tag save-src-auto">🤖 自动</span>'
        : '<span class="tag save-src-manual">🖐️ 手动</span>';
      let actions = '';
      if (opts.save) actions += `<button class="btn small ${opts.primary === 'save' ? 'gold' : ''}" data-save="${i}">${opts.cur ? '覆盖' : '写入'}</button>`;
      if (opts.load) actions += `<button class="btn small ${opts.primary === 'load' ? 'gold' : 'ghost'}" data-load="${i}">读取</button>`;
      if (opts.del) actions += `<button class="btn small danger" data-del="${i}">删除</button>`;
      return `
        <div class="save-row ${opts.cur ? 'cur' : ''}">
          <div class="save-info">
            <div class="save-name">${W.Utils.esc(s.name)} <span class="tag">${W.Utils.esc(s.raceCN)} ${W.Utils.esc(s.classCN)} Lv.${sm.level}</span></div>
            <div class="save-meta">💰 金币 ${W.Utils.plainMoney(sm.gold)} · 📍 ${W.Utils.esc(sm.zoneCN)}</div>
            <div class="save-meta">${srcTag} <span class="save-time">${W.Utils.fmtRelTime(sm.savedAt)}</span></div>
          </div>
          <div class="save-actions">${actions}</div>
        </div>`;
    },

    // ---------- 自动存档 ----------
    // 选取自动存档槽:当前槽(同名同职业) → 扫描同名同职业 → 首个空槽 → -1(槽满且无匹配则不覆盖他人存档)
    _pickAutoSlot() {
      const c = this.character;
      if (!c) return -1;
      // 以 姓名+职业+种族 识别同一角色,尽可能避免同名同职业的不同角色互相覆盖
      const sameChar = (e) => e && e.name === c.name && e.data && e.data.classId === c.classId && e.data.race === c.race;
      if (sameChar(this.saveSlots[this._saveSlot])) return this._saveSlot;
      for (let i = 0; i < C.MAX_SLOTS; i++) if (sameChar(this.saveSlots[i])) return i;
      for (let i = 0; i < C.MAX_SLOTS; i++) if (!this.saveSlots[i]) return i;
      return -1;
    },

    // 自动存档:按角色写入合适槽位;force=true 忽略节流(死亡复活/关闭页面等关键节点)
    autoSave(force) {
      if (!this.character) return { saved: false, reason: 'no-char' };
      const now = Date.now();
      if (!force && now - this._lastAutoSave < C.AUTO_SAVE_MIN_INTERVAL * 1000) return { saved: false, reason: 'throttled' };
      const slot = this._pickAutoSlot();
      if (slot < 0) return { saved: false, reason: 'no-slot' };
      this.save(slot, 'auto');
      this._lastAutoSave = now;
      if (!this._autoToast) {
        this._autoToast = true;
        if (W.UI && W.UI.toast) W.UI.toast('💾 已开启自动存档，进度将自动保存', 'ok');
      }
      return { saved: true, slot };
    },

    persist() {
      try { localStorage.setItem(C.SAVE_KEY, JSON.stringify({ slots: this.saveSlots, current: this._saveSlot })); }
      catch (e) { /* 存储失败忽略 */ }
    },

    loadSlots() {
      try {
        const raw = localStorage.getItem(C.SAVE_KEY);
        if (raw) {
          const obj = JSON.parse(raw);
          this.saveSlots = obj.slots || [];
          this._saveSlot = obj.current || 0;
        }
      } catch (e) { this.saveSlots = []; }
      return this.saveSlots;
    },

    load(slot) {
      const idx = slot == null ? this._saveSlot : slot;
      const entry = this.saveSlots[idx];
      if (!entry) return false;
      this.character = entry.data;
      this._saveSlot = idx;
      this._lastAutoSave = 0; // 读档后立即允许自动存档
      return true;
    },

    erase(slot) {
      if (this.saveSlots[slot]) { delete this.saveSlots[slot]; this.saveSlots[slot] = undefined; }
      this.persist();
    },

    /* 新游戏重置 */
    reset() {
      this.character = null;
    },

    // 快捷访问
    get char() { return this.character; },
    zone() { return this.character && W.Data.ZONES[this.character.zone]; },
  };
  W.State = State;

  /* ============ UI 框架 ============ */
  const UI = {
    showView(name) {
      $$('.view').forEach((v) => v.classList.remove('active'));
      const v = document.getElementById('view-' + name);
      if (v) v.classList.add('active');
      window.scrollTo(0, 0);
    },

    /* 模态框 */
    openModal(html, opts) {
      const m = document.getElementById('modal-root');
      opts = opts || {};
      // 同标题弹窗重绘(背包出售/商店买卖/锻造强化/任务接取/天赋加点等刷新):保留 .modal 容器,仅替换 .modal-body 内容
      // ——滚动位置天然保留(容器不重建 scrollTop 不动),modalIn 入场动画不重放(无闪烁感),无需 rAF 恢复;
      // 标题不同的视为打开新弹窗(如状态面板→打开背包已先关旧窗),仍整弹窗重建、从头开始不串滚动
      const curTitle = m.querySelector('.modal-title');
      if (m.classList.contains('show') && opts.title && curTitle && curTitle.textContent === opts.title) {
        const body = m.querySelector('.modal-body');
        if (body) { body.innerHTML = html; return m; }
      }
      m.innerHTML =
        '<div class="modal-mask"></div>' +
        '<div class="modal ' + (opts.cls || '') + '"' + (opts.lock ? ' data-lock="1"' : '') + '>' +
          (opts.title ? '<div class="modal-title">' + W.Utils.esc(opts.title) + '</div>' : '') +
          '<div class="modal-body">' + html + '</div>' +
          (opts.close !== false ? '<button class="btn ghost close-x" data-close>✕</button>' : '') +
        '</div>';
      m.classList.add('show');
      m.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => UI.closeModal()));
      return m;
    },
    closeModal() {
      const m = document.getElementById('modal-root');
      m.classList.remove('show');
      // 延迟清空守卫:若 200ms 内打开了新弹窗(如旅店→存档),保留新内容不被清掉
      clearTimeout(m._closeTimer);
      m._closeTimer = setTimeout(() => { if (!m.classList.contains('show')) m.innerHTML = ''; }, 200);
    },
    confirm(title, text, onYes, onNo) {
      UI.openModal(
        '<p class="confirm-text">' + text + '</p>' +
        '<div class="modal-actions">' +
          '<button class="btn gold" data-yes>确认</button>' +
          '<button class="btn ghost" data-close>取消</button>' +
        '</div>', { title, close: false });
      const m = $('#modal-root');
      m.querySelector('[data-yes]').addEventListener('click', () => { UI.closeModal(); onYes && onYes(); });
    },

    /* 轻提示 */
    toast(msg, cls) {
      let t = $('#toast');
      if (!t) { t = W.Utils.el('div', 'toast', ''); document.body.appendChild(t); }
      t.className = 'toast show ' + (cls || '');
      t.innerHTML = msg;
      clearTimeout(t._timer);
      t._timer = setTimeout(() => t.classList.remove('show'), 2400);
    },

    /* 血条/资源条(委托 Utils.bar) */
    bar: (pct, cls, label) => W.Utils.bar(pct, cls, label),
  };
  W.UI = UI;

  /* ============ 音效(WebAudio 合成) ============ */
  const Audio = {
    _ctx: null, muted: false, _busy: 0,
    // 静音偏好键(标题界面/设置面板共用,避免字符串漂移)
    SOUND_KEY: 'wow_sound_muted',
    init() {
      if (this.muted) return;
      try {
        if (!this._ctx) this._ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (this._ctx.state === 'suspended') this._ctx.resume && this._ctx.resume();
      } catch (e) {}
    },
    _tone(freq, dur, type, vol, delay, slideTo) {
      if (this.muted || !this._ctx) return;
      try {
        const t = this._ctx.currentTime + (delay || 0);
        const o = this._ctx.createOscillator();
        const g = this._ctx.createGain();
        o.type = type || 'sine';
        o.frequency.setValueAtTime(freq, t);
        if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(vol || 0.12, t + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g).connect(this._ctx.destination);
        o.start(t); o.stop(t + dur + 0.05);
      } catch (e) {}
    },
    click() { this._tone(520, 0.05, 'square', 0.05); },
    hit() { this._tone(160, 0.12, 'square', 0.14, 0, 80); },
    crit() { this._tone(300, 0.1, 'sawtooth', 0.14, 0, 80); this._tone(700, 0.1, 'square', 0.08, 0.06); },
    miss() { this._tone(220, 0.06, 'sine', 0.06, 0, 140); },
    spell() { this._tone(880, 0.12, 'sine', 0.09, 0, 1320); this._tone(440, 0.1, 'triangle', 0.06, 0.03); },
    fire() { this._tone(180, 0.15, 'sawtooth', 0.1, 0, 60); },
    frost() { this._tone(1400, 0.12, 'sine', 0.07, 0, 700); },
    shadow() { this._tone(120, 0.2, 'sawtooth', 0.1, 0, 60); },
    holy() { this._tone(1200, 0.15, 'triangle', 0.09, 0, 1800); },
    heal() { this._tone(760, 0.12, 'triangle', 0.09, 0, 1140); },
    dot() { this._tone(300, 0.1, 'triangle', 0.07, 0, 200); },
    stun() { this._tone(90, 0.18, 'square', 0.1, 0, 60); },
    flee() { this._tone(500, 0.12, 'triangle', 0.08, 0, 300); },
    levelup() { [523, 659, 784, 1047].forEach((f, i) => this._tone(f, 0.18, 'triangle', 0.1, i * 0.11)); },
    win() { [392, 523, 659, 784, 1047].forEach((f, i) => this._tone(f, 0.22, 'triangle', 0.11, i * 0.13)); },
    lose() { [400, 330, 262, 196].forEach((f, i) => this._tone(f, 0.28, 'sawtooth', 0.08, i * 0.16)); },
    death() { this._tone(600, 0.5, 'sawtooth', 0.1, 0, 100); },
  };
  W.Audio = Audio;

  /* 首屏点击初始化音频(浏览器策略) */
  document.addEventListener('click', function once() {
    W.Audio.init();
    document.removeEventListener('click', once);
  }, { once: true });
})();
