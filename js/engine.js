/* 魔兽世界 · 战大陆 — 核心引擎:状态管理 / 存档 / UI 框架 / 音效 */
(function () {
  'use strict';
  const W = window.WOW;
  const C = W.Config;
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  W.$ = $; W.$$ = $$;

  /* 存储写满判定:各浏览器命名不一 —— Chrome/Safari 抛 QuotaExceededError,
   * Firefox 抛 NS_ERROR_DOM_QUOTA_REACHED,老内核只给 code 22 / 1014。 */
  function isQuotaError(e) {
    return !!e && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED'
      || e.code === 22 || e.code === 1014);
  }

  /* ============ 游戏状态 ============ */
  const State = {
    character: null,
    saveSlots: [],       // [{name, class, level, zone, savedAt, data}]
    _saveSlot: 0,        // 当前存档槽
    lastSavedAt: 0,      // 最近保存时间戳(供自动存档指示器显示)
    _lastAutoSave: 0,    // 上次自动存档时间戳(节流)
    _autoToast: false,   // 会话内是否已提示过自动存档
    _quotaWarned: false, // 存储写满只提示一次,避免每次自动存档都刷屏

    newCharacter(char) {
      this.character = char;
    },

    // ---------- 存档 ----------
    // src: 'manual' 手动保存 / 'auto' 自动保存
    // 返回是否真正落盘:false 时内存槽位已更新但 localStorage 未更新,
    // 重开页面会回到旧进度 —— 调用方据此决定能不能说「已保存」。
    save(slot, src) {
      const idx = slot == null ? this._saveSlot : slot;
      const c = this.character;
      if (!c) return false;
      const entry = {
        name: c.name, classCN: W.Data.CLASSES[c.classId].name, raceCN: W.Data.RACES[c.race].name,
        level: c.level, zone: c.zone, savedAt: Date.now(),
        src: src || 'manual',          // 存档来源(自动/手动)
        gold: c.gold,                  // 金币摘要
        zoneCN: ((W.Data.ZONES || {})[c.zone] || {}).name || c.zone, // 位置摘要
        data: JSON.parse(JSON.stringify(c)),
      };
      this.saveSlots[idx] = entry;
      this._saveSlot = idx;
      const ok = this.persist();
      if (ok) this.lastSavedAt = entry.savedAt;
      return ok;
    },

    // 存档条目摘要(兼容旧存档字段缺失)
    slotSummary(entry) {
      if (!entry) return null;
      const d = entry.data || {};
      const zoneName = (zid) => (zid && W.Data.ZONES && W.Data.ZONES[zid] ? W.Data.ZONES[zid].name : null);
      return {
        level: entry.level != null ? entry.level : (d.level || 1),
        gold: entry.gold != null ? entry.gold : (d.gold || 0),
        zoneCN: entry.zoneCN || zoneName(d.zone) || zoneName(entry.zone) || '未知区域',
        src: entry.src || 'manual',
        savedAt: entry.savedAt || 0,
      };
    },

    // 低等级存档覆盖高等级存档检测:返回槽内存档等级(覆盖 = 丢高等级进度,需二次确认),否则 0
    downgradeSlotLevel(slot) {
      const c = this.character;
      const s = this.saveSlots[slot];
      if (!c || !s) return 0;
      const lv = this.slotSummary(s).level;
      return lv > c.level ? lv : 0;
    },

    // 存档槽行 HTML(世界界面/标题界面的存档管理共用,按钮集由 opts 控制)
    // opts: { cur, save, load, del, primary: 'save'|'load', downLv: 槽内存档等级(仅当高于当前角色时传入) }
    saveRowHtml(s, i, opts) {
      opts = opts || {};
      const sm = this.slotSummary(s);
      const downLv = opts.downLv || 0;
      const srcTag = sm.src === 'auto'
        ? '<span class="tag save-src-auto">🤖 自动</span>'
        : '<span class="tag save-src-manual">🖐️ 手动</span>';
      let actions = '';
      if (opts.save) {
        const label = downLv ? `⚠ 覆盖 Lv.${downLv}` : (opts.cur ? '覆盖' : '写入');
        actions += `<button class="btn small ${downLv ? 'danger' : (opts.primary === 'save' ? 'gold' : '')}" data-save="${i}"${downLv ? ` data-down-lv="${downLv}"` : ''}>${label}</button>`;
      }
      if (opts.load) actions += `<button class="btn small ${opts.primary === 'load' ? 'gold' : 'ghost'}" data-load="${i}">读取</button>`;
      if (opts.del) actions += `<button class="btn small danger" data-del="${i}">删除</button>`;
      return `
        <div class="save-row${opts.cur ? ' cur' : ''}${downLv ? ' downgrade' : ''}">
          <div class="save-info">
            <div class="save-name">${W.Utils.esc(s.name)} <span class="tag">${W.Utils.esc(s.raceCN)} ${W.Utils.esc(s.classCN)} Lv.${sm.level}</span></div>
            <div class="save-meta">💰 金币 ${W.Utils.plainMoney(sm.gold)} · 📍 ${W.Utils.esc(sm.zoneCN)}</div>
            <div class="save-meta">${srcTag} <span class="save-time">${W.Utils.fmtRelTime(sm.savedAt)}</span></div>
            ${downLv ? `<div class="save-warn">⚠ 槽内存档 Lv.${downLv}，高于当前角色 —— 覆盖会丢掉高等级进度，需再点一次确认</div>` : ''}
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
      // 同时要求槽内存档等级不高于当前角色:自动存档无声,不得顶掉高等级进度(手动覆盖另有二次确认)
      const sameChar = (e) => e && e.name === c.name && e.data && e.data.classId === c.classId && e.data.race === c.race
        && this.slotSummary(e).level <= c.level;
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
      const ok = this.save(slot, 'auto');
      this._lastAutoSave = now;      // 失败也计入节流:存储写满时反复重试只会刷屏
      if (!ok) return { saved: false, reason: 'storage-full', slot };
      if (!this._autoToast) {
        this._autoToast = true;
        if (W.UI && W.UI.toast) W.UI.toast('💾 已开启自动存档，进度将自动保存', 'ok');
      }
      return { saved: true, slot };
    },

    // 写入 localStorage,返回是否成功。写满时必须让用户看见:
    // 静默失败会让界面一直显示「💾 自动存档 刚刚」,用户下次打开才发现进度全丢。
    persist() {
      try {
        localStorage.setItem(C.SAVE_KEY, JSON.stringify({ slots: this.saveSlots, current: this._saveSlot, v: C.SAVE_VERSION }));
        this._quotaWarned = false;
        return true;
      } catch (e) {
        if (isQuotaError(e) && !this._quotaWarned) {
          this._quotaWarned = true;
          if (W.UI && W.UI.toast) W.UI.toast('⚠️ 浏览器存储空间已满，进度未能写入！请在「存档管理」删除不用的旧存档', 'warn');
        }
        return false;
      }
    },

    /* 存档格式迁移 + 结构校验(单点入口)。
     * persist() 写入 v: C.SAVE_VERSION,读档时经由这里升级。今后改存档结构,
     * 就在下面按版本补一段升级分支 —— 不要再往业务代码里散落 if (!char.x),
     * 那会让「旧存档到底兼容到哪一版」无处可查。
     * 顺带做结构校验:localStorage 里的内容可能被截断或被手改,坏数据要挡在进入游戏之前。 */
    migrateSave(obj) {
      if (!obj || typeof obj !== 'object') return { slots: [], current: 0, from: 0, v: C.SAVE_VERSION };
      const from = obj.v || 1;                    // v1 及更早的存档不带版本字段
      let slots = Array.isArray(obj.slots) ? obj.slots.slice(0, C.MAX_SLOTS) : [];
      if (from < 2) {
        // v1 → v2:槽位扩容至 10,每条新增 src/gold/zoneCN 摘要。
        // 摘要缺失由 slotSummary() 读时兜底,角色字段补齐由 character.ensureClassFeatures() 负责,
        // 此处只保证 slots 是可渲染的数组。
      }
      // 超长/畸形条目丢弃(MAX_SLOTS 之外的历史遗留槽位同样归一化掉)
      slots = slots.map((e) => (e && typeof e === 'object' && typeof e.name === 'string' ? e : null));
      let current = Number.isInteger(obj.current) ? obj.current : 0;
      if (current < 0 || current >= C.MAX_SLOTS) current = 0;
      return { slots, current, from, v: C.SAVE_VERSION };
    },

    loadSlots() {
      try {
        const raw = localStorage.getItem(C.SAVE_KEY);
        if (raw) {
          const obj = this.migrateSave(JSON.parse(raw));
          this.saveSlots = obj.slots;
          this._saveSlot = obj.current;
        }
      } catch (e) { this.saveSlots = []; }
      return this.saveSlots;
    },

    // 条目缺 data 说明存档不完整(写入被截断/被编辑过),读它会把 character 变成 undefined
    load(slot) {
      const idx = slot == null ? this._saveSlot : slot;
      const entry = this.saveSlots[idx];
      if (!entry || !entry.data) return false;
      this.character = entry.data;
      this._saveSlot = idx;
      this._lastAutoSave = 0; // 读档后立即允许自动存档
      return true;
    },

    erase(slot) {
      if (this.saveSlots[slot]) { delete this.saveSlots[slot]; this.saveSlots[slot] = undefined; }
      return this.persist();
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

    /* 详情弹窗(长按查看技能/状态):统一入口,便于测试与复用 */
    openInfo(title, html) {
      UI.openModal(
        '<div class="info-box">' + html + '</div>' +
        '<div class="modal-actions"><button class="btn gold" data-close>知道了</button></div>',
        { title: title || '详情' });
    },

    /* 长按查看详情:触屏没有悬停,title 提示完全看不到,统一改为长按弹出
     * 委托绑定在容器上(innerHTML 重建后依然生效),resolver 可选:
     * 返回 { title, html } 时用自定义内容(如敌方首领技能/单位状态),返回空则回退到元素自身的 title。
     * 长按已弹详情时吞掉这一次 click,避免同时施放技能 / 切换目标。 */
    bindInfoPress(root, resolver, hitSelector) {
      if (!root || (root.dataset && root.dataset.infoPress === '1')) return;
      if (root.dataset) root.dataset.infoPress = '1';
      // 可长按的目标:默认只看带 title 的元素;resolver 可扩到无 title 的交互体(如单位卡牌/技能按钮)
      const HIT = hitSelector || '[title]';
      const HOLD_MS = 450, MOVE_TOL = 12;
      let timer = null, sx = 0, sy = 0, fired = false;
      const cancel = () => { if (timer) { clearTimeout(timer); timer = null; } };
      root.addEventListener('pointerdown', (e) => {
        if (e.button && e.button > 0) return; // 仅左键/触摸
        const el = e.target && e.target.closest ? e.target.closest(HIT) : null;
        if (!el) return;
        if (!resolver && !el.title) return;
        sx = e.clientX; sy = e.clientY; fired = false;
        cancel();
        timer = setTimeout(() => {
          timer = null; fired = true;
          const custom = resolver ? resolver(el) : null;
          if (custom && custom.html) UI.openInfo(custom.title, custom.html);
          else UI.openInfo('详情', '<div class="info-text">' + W.Utils.esc(el.title) + '</div>');
        }, HOLD_MS);
      });
      // 手指移动视为滚动/滑动,取消长按(避免滑动列表时误弹详情)
      root.addEventListener('pointermove', (e) => {
        if (!timer) return;
        if (Math.abs(e.clientX - sx) > MOVE_TOL || Math.abs(e.clientY - sy) > MOVE_TOL) cancel();
      });
      root.addEventListener('pointerup', cancel);
      root.addEventListener('pointercancel', cancel);
      root.addEventListener('pointerleave', cancel);
      root.addEventListener('click', (e) => {
        if (!fired) return;
        fired = false;
        e.stopPropagation();
        e.preventDefault();
      }, true);
    },

    /* 轻提示 */
    toast(msg, cls) {
      // 复用同一个节点:创建时必须补上 id,否则下面的 #toast 永远查不到,
      // 每次提示都会往 body 追加一个新 div(旧节点只去掉 .show,永不移除),长时间游戏持续堆积。
      let t = $('#toast');
      if (!t) { t = W.Utils.el('div', 'toast', ''); t.id = 'toast'; document.body.appendChild(t); }
      t.className = 'toast show ' + (cls || '');
      // 用 textContent 而非 innerHTML:提示内容一律是纯文本(含玩家自定角色名),
      // 避免名字里的标签被解析执行(自 XSS)。所有调用方传的都是纯文本,不依赖 HTML。
      t.textContent = msg;
      clearTimeout(t._timer);
      t._timer = setTimeout(() => t.classList.remove('show'), 2400);
    },

    /* 血条/资源条(委托 Utils.bar) */
    bar: (pct, cls, label) => W.Utils.bar(pct, cls, label),
  };
  W.UI = UI;

  /* ============ 音效(WebAudio 合成) ============ */
  /* ============ 音效:纯 WebAudio 合成,零音频文件 ============
   * 旧版只有 1~2 个振荡器 + 指数包络,打击听起来是"哔"一声。
   * 现在补上三样东西:
   *   1) 噪声源(一次生成 1 秒白噪,复用)—— 打击/挥砍/爆炸的"实体感"全在噪声上
   *   2) BiquadFilter 塑形(带通/低通/高通 + 扫频)—— 让噪声有"材质",金属/钝器/空气各不相同
   *   3) 总线压缩 + 延迟反馈混响 —— 多音叠加不爆音,法术有余韵
   * 仍然不引入任何资源文件,APK 体积零增长。 */
  const Audio = {
    _ctx: null, muted: false,
    _master: null, _rev: null, _noiseBuf: null,
    _last: Object.create(null),
    // 静音偏好键(标题界面/设置面板共用,避免字符串漂移)
    SOUND_KEY: 'wow_sound_muted',

    init() {
      if (this.muted) return;
      try {
        if (!this._ctx) {
          const AC = window.AudioContext || window.webkitAudioContext;
          if (!AC) return;
          const ctx = this._ctx = new AC();
          // 总线:压限器兜底,避免 DoT/多段伤害瞬间叠十几个音爆掉
          const comp = ctx.createDynamicsCompressor();
          comp.threshold.value = -18;
          comp.knee.value = 14;
          comp.ratio.value = 6;
          comp.attack.value = 0.003;
          comp.release.value = 0.18;
          const master = this._master = ctx.createGain();
          master.gain.value = 0.85;
          master.connect(comp);
          comp.connect(ctx.destination);

          // 噪声源:一次生成,所有打击类音效复用
          const len = Math.floor(ctx.sampleRate * 1.0);
          const buf = ctx.createBuffer(1, len, ctx.sampleRate);
          const d = buf.getChannelData(0);
          for (let i2 = 0; i2 < len; i2++) d[i2] = Math.random() * 2 - 1;
          this._noiseBuf = buf;

          // 混响:延迟反馈(比 ConvolverNode 轻,移动端更稳)
          const rev = this._rev = ctx.createGain();
          const dl = ctx.createDelay(0.4);
          dl.delayTime.value = 0.085;
          const damp = ctx.createBiquadFilter();
          damp.type = 'lowpass';
          damp.frequency.value = 2600;
          const fb = ctx.createGain();
          fb.gain.value = 0.3;
          rev.connect(dl);
          dl.connect(damp);
          damp.connect(fb);
          fb.connect(dl);        // 反馈回路 = 尾音
          damp.connect(master);  // 湿声并入总线
        }
        if (this._ctx.state === 'suspended') this._ctx.resume && this._ctx.resume();
      } catch (e) { /* 音频不可用则静默降级 */ }
    },

    // 同一音效短时间重复触发时限流,避免叠加成噪音
    _throttle(name, gap) {
      const now = Date.now();
      if (this._last[name] && now - this._last[name] < gap) return true;
      this._last[name] = now;
      return false;
    },

    _out() { return this._master || (this._ctx && this._ctx.destination) || null; },

    /* 振荡器音:快起 + 指数衰减。slideTo 做频率滑音,wet 送混响 */
    _tone(freq, dur, type, vol, delay, slideTo, wet) {
      if (this.muted || !this._ctx) return;
      const out = this._out();
      if (!out) return;
      try {
        const ctx = this._ctx;
        const t = ctx.currentTime + (delay || 0);
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = type || 'sine';
        o.frequency.setValueAtTime(freq, t);
        if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + dur);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol || 0.12), t + Math.min(0.02, dur * 0.25));
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g).connect(out);
        if (wet && this._rev) g.connect(this._rev);
        o.start(t);
        o.stop(t + dur + 0.05);
      } catch (e) { /* ignore */ }
    },

    /* 噪声爆发:打击感的来源。freqTo 做扫频,q 越大越"窄"越像金属 */
    _burst(o) {
      if (this.muted || !this._ctx || !this._noiseBuf) return;
      const out = this._out();
      if (!out) return;
      try {
        const ctx = this._ctx;
        const t = ctx.currentTime + (o.delay || 0);
        const src = ctx.createBufferSource();
        src.buffer = this._noiseBuf;
        src.playbackRate.value = o.rate || 1;
        const f = ctx.createBiquadFilter();
        f.type = o.type || 'bandpass';
        f.frequency.setValueAtTime(o.freq || 1200, t);
        if (o.freqTo) f.frequency.exponentialRampToValueAtTime(Math.max(40, o.freqTo), t + o.dur);
        f.Q.value = o.q == null ? 1 : o.q;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(Math.max(0.0002, o.vol || 0.2), t + (o.attack || 0.005));
        g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
        src.connect(f).connect(g).connect(out);
        if (o.wet && this._rev) g.connect(this._rev);
        src.start(t);
        src.stop(t + o.dur + 0.03);
      } catch (e) { /* ignore */ }
    },

    /* ---------- UI ---------- */
    click() {
      this._tone(430, 0.05, 'triangle', 0.055, 0, 330);
      this._burst({ dur: 0.03, vol: 0.045, type: 'bandpass', freq: 2600, q: 2.2 });
    },

    /* ---------- 物理打击 ---------- */
    // 钝器:低频冲击 + 中频噪声。冲击给"重",噪声给"实"
    hit() {
      this._tone(108, 0.15, 'sine', 0.3, 0, 46);
      this._tone(216, 0.07, 'triangle', 0.1, 0, 92);
      this._burst({ dur: 0.12, vol: 0.24, type: 'bandpass', freq: 900, freqTo: 380, q: 0.9, wet: true });
    },
    // 暴击:更重的低频 + 金属泛音 + 高频噪声
    crit() {
      this._tone(94, 0.22, 'sine', 0.34, 0, 36);
      this._tone(1480, 0.17, 'triangle', 0.11, 0.012, 2100);
      this._tone(2480, 0.1, 'sine', 0.055, 0.02);
      this._burst({ dur: 0.17, vol: 0.26, type: 'highpass', freq: 1500, q: 0.7, wet: true });
    },
    // 挥空:空气被划开(带通扫频),没有低频冲击
    miss() {
      this._burst({ dur: 0.14, vol: 0.15, type: 'bandpass', freq: 620, freqTo: 2400, q: 1.7 });
    },

    /* ---------- 法术 ---------- */
    spell() {
      this._tone(520, 0.26, 'sine', 0.1, 0, 1180, true);
      this._tone(780, 0.22, 'triangle', 0.055, 0.02, 1560);
      this._burst({ dur: 0.2, vol: 0.045, type: 'highpass', freq: 3200, q: 0.6, wet: true });
    },
    fire() {
      this._burst({ dur: 0.34, vol: 0.22, type: 'lowpass', freq: 1400, freqTo: 300, q: 1.2, wet: true });
      this._tone(92, 0.3, 'sawtooth', 0.09, 0, 48);
    },
    frost() {
      this._tone(1600, 0.2, 'sine', 0.085, 0, 900, true);
      this._burst({ dur: 0.24, vol: 0.09, type: 'highpass', freq: 4400, q: 0.8, wet: true });
    },
    shadow() {
      this._tone(70, 0.4, 'sawtooth', 0.13, 0, 42);
      this._tone(140, 0.32, 'triangle', 0.055, 0.03, 70);
      this._burst({ dur: 0.3, vol: 0.055, type: 'lowpass', freq: 400, q: 1, wet: true });
    },
    // 圣光:大三和弦 + 长余韵
    holy() {
      [880, 1108, 1320].forEach((f, i2) => this._tone(f, 0.42, 'sine', 0.07, i2 * 0.035, f * 1.04, true));
      this._burst({ dur: 0.34, vol: 0.045, type: 'highpass', freq: 5000, q: 0.5, wet: true });
    },
    heal() {
      [660, 880, 990].forEach((f, i2) => this._tone(f, 0.3, 'triangle', 0.07, i2 * 0.05, f * 1.02, true));
      this._burst({ dur: 0.2, vol: 0.035, type: 'highpass', freq: 4200, q: 0.6, wet: true });
    },
    dot() {
      this._tone(300, 0.14, 'triangle', 0.065, 0, 180);
      this._burst({ dur: 0.1, vol: 0.055, type: 'bandpass', freq: 700, q: 1.4 });
    },
    stun() {
      this._tone(88, 0.3, 'square', 0.1, 0, 62);
      this._tone(132, 0.26, 'triangle', 0.055, 0.02, 96);
      this._burst({ dur: 0.2, vol: 0.075, type: 'lowpass', freq: 520, q: 1 });
    },
    flee() {
      this._burst({ dur: 0.2, vol: 0.12, type: 'bandpass', freq: 1200, freqTo: 420, q: 1.2 });
      this._tone(420, 0.16, 'triangle', 0.065, 0, 240);
    },

    /* ---------- 结算 ---------- */
    levelup() {
      [523, 659, 784, 1047].forEach((f, i2) => {
        this._tone(f, 0.5, 'triangle', 0.1, i2 * 0.1, f, true);
        this._tone(f * 2, 0.4, 'sine', 0.035, i2 * 0.1);
      });
      this._burst({ dur: 0.5, vol: 0.035, type: 'highpass', freq: 6200, q: 0.5, wet: true });
    },
    win() {
      [392, 523, 659, 784, 1047].forEach((f, i2) => this._tone(f, 0.55, 'triangle', 0.11, i2 * 0.12, f, true));
      [784, 1047].forEach((f, i2) => this._tone(f, 0.8, 'sine', 0.045, 0.62 + i2 * 0.02));
      this._burst({ dur: 0.7, vol: 0.035, type: 'highpass', freq: 5200, q: 0.5, wet: true });
    },
    lose() {
      [400, 330, 262, 196].forEach((f, i2) => this._tone(f, 0.45, 'sawtooth', 0.07, i2 * 0.16, f * 0.98, true));
      this._burst({ dur: 0.5, vol: 0.045, type: 'lowpass', freq: 620, q: 0.8, wet: true });
    },
    death() {
      this._tone(600, 0.7, 'sawtooth', 0.1, 0, 90);
      this._burst({ dur: 0.6, vol: 0.1, type: 'lowpass', freq: 800, freqTo: 150, q: 1, wet: true });
    },
  };

  // 限流包装:DoT/多段伤害一回合会连触发好几次,不拦会叠成噪音
  const SFX_GAP = { click: 30, dot: 90, hit: 45, crit: 80, miss: 60, heal: 60, spell: 50, levelup: 300, win: 500, lose: 500 };
  Object.keys(SFX_GAP).forEach((name) => {
    const fn = Audio[name];
    if (typeof fn !== 'function') return;
    Audio[name] = function () {
      if (Audio._throttle(name, SFX_GAP[name])) return;
      fn.call(Audio);
    };
  });

  W.Audio = Audio;

  /* 首屏点击初始化音频(浏览器策略) */
  document.addEventListener('click', function once() {
    W.Audio.init();
    document.removeEventListener('click', once);
  }, { once: true });
})();
