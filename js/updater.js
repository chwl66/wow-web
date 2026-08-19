/* 在线更新检查:查询 GitHub Releases 最新版本。
 * 安卓端(Capacitor)支持【增量热更新】——仅下载补丁/全量 Web 资源包,免装 APK:
 *   manifest(update.json) → 下载 zip → SHA-256 校验 → 解压到内部存储 → 切换加载路径并重启;
 * 桌面浏览器与无插件环境回退为「前往下载 APK」。
 * 挂载于 WOW.Updater,自动(每日一次)+ 手动(设置面板「检查更新」)两种模式,
 * 无网络/非浏览器环境静默失败,不影响游戏运行。 */
(function () {
  'use strict';

  const W = window.WOW;

  const Updater = {
    REPO: 'chwl66/wow-web',                 // GitHub 仓库
    API: 'https://api.github.com/repos/chwl66/wow-web/releases/latest',
    RELEASE_URL: 'https://github.com/chwl66/wow-web/releases/latest',
    DL: 'https://github.com/chwl66/wow-web/releases/download', // Release 附件下载前缀
    CHECK_KEY: 'wow_update_last_check',     // 上次自动检查时间戳(localStorage)
    IGNORE_KEY: 'wow_update_ignored',       // 用户忽略的版本(当日不再提示)
    APPLIED_KEY: 'wow_web_applied_version', // 当前生效的 Web 资源版本(热更新后为更新版本)
    AUTO_INTERVAL: 24 * 3600 * 1000,        // 自动检查间隔:24 小时
    FETCH_TIMEOUT: 8000,

    /* 当前运行版本(由 scripts/gen-version.js 生成;热更新后即新版本) */
    currentVersion() {
      return window.WOW_VERSION || '1.0.0';
    },

    /* 解析 "v1.2.3" / "1.2.3" -> [1,2,3],非法返回 null */
    parse(v) {
      if (!v) return null;
      const m = String(v).replace(/^v/i, '').trim().match(/^(\d+)\.(\d+)\.(\d+)/);
      if (!m) return null;
      return [parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10)];
    },

    /* 比较 a vs b,返回 1(a 新)/ 0(相同)/ -1(a 旧) */
    compare(a, b) {
      for (let i = 0; i < 3; i++) {
        if (a[i] > b[i]) return 1;
        if (a[i] < b[i]) return -1;
      }
      return 0;
    },

    _get(key) { try { return localStorage.getItem(key); } catch (e) { return null; } },
    _set(key, val) { try { localStorage.setItem(key, val); } catch (e) { /* ignore */ } },

    /* ---------- 热更新能力检测 ---------- */
    _cap() {
      return window.Capacitor || null;
    },
    hotSupported() {
      try {
        const cap = this._cap();
        if (!cap || !cap.isNativePlatform || !cap.isNativePlatform()) return false;
        if (!cap.Plugins || !cap.Plugins.HotUpdate || !cap.Plugins.Filesystem) return false;
        if (!window.crypto || !window.crypto.subtle) return false;
        return true;
      } catch (e) {
        return false;
      }
    },

    /* 请求最新 release(GitHub API),超时与失败返回 null */
    async _fetchLatest() {
      try {
        const res = await fetch(this.API + '?t=' + Date.now(), {
          headers: { Accept: 'application/vnd.github+json' },
          signal: this._abortSignal(this.FETCH_TIMEOUT),
        });
        if (!res.ok) return null;
        return await res.json();
      } catch (e) {
        return null;
      }
    },

    /* ---------- 基础工具 ---------- */
    _abortSignal(ms) {
      if (typeof AbortController === 'undefined') return undefined;
      const c = new AbortController();
      setTimeout(() => c.abort(), ms);
      return c.signal;
    },

    async _fetchJson(url) {
      const res = await fetch(url + '?t=' + Date.now(), {
        headers: { Accept: 'application/json' },
        signal: this._abortSignal(this.FETCH_TIMEOUT),
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    },

    async _fetchBuffer(url, onProgress) {
      const res = await fetch(url, { signal: this._abortSignal(60000) });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const total = parseInt(res.headers.get('content-length'), 10) || 0;
      if (total && res.body && typeof res.body.getReader === 'function') {
        const reader = res.body.getReader();
        const chunks = [];
        let received = 0;
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          received += value.byteLength;
          if (onProgress) onProgress(total ? Math.min(99, Math.floor(received / total * 100)) : null);
        }
        const all = new Uint8Array(received);
        let off = 0;
        for (const c of chunks) { all.set(c, off); off += c.byteLength; }
        return all.buffer;
      }
      const buf = await res.arrayBuffer();
      if (onProgress) onProgress(100);
      return buf;
    },

    async _sha256Hex(buf) {
      const digest = await window.crypto.subtle.digest('SHA-256', buf);
      return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
    },

    _bufToBase64(buf) {
      const bytes = new Uint8Array(buf);
      let binary = '';
      const CHUNK = 0x8000;
      for (let i = 0; i < bytes.length; i += CHUNK) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
      }
      return btoa(binary);
    },

    /* ---------- 热更新主流程 ---------- */
    /* 返回 { ok, message } */
    async _runHotUpdate(release, onStatus) {
      const set = (s) => { if (onStatus) onStatus(s); };
      const cap = this._cap();
      const HotUpdate = cap.Plugins.HotUpdate;
      const Filesystem = cap.Plugins.Filesystem;
      const tag = (release.tag_name || 'v' + this.currentVersion()).replace(/^v/i, '');
      try {
        // 1. 拉取更新清单
        set('📡 检查更新包…');
        const manifest = await this._fetchJson(`${this.DL}/v${tag}/update.json`);
        if (!manifest || !manifest.version || this.compare(this.parse(manifest.version), this.parse(tag)) !== 0) {
          throw new Error('更新清单不匹配');
        }
        // 2. 补丁/全量决策:当前生效版本 = 补丁基准 → 增量,否则全量
        let mode = 'full';
        try { const active = await HotUpdate.getActiveUpdate(); if (active && active.version && manifest.patch && manifest.patch.base === active.version) mode = 'patch'; } catch (e) { /* 保持全量 */ }
        const art = mode === 'patch' ? manifest.patch : manifest.full;
        if (!art || !art.url) throw new Error('缺少更新包');
        // 3. 下载
        set(mode === 'patch' ? `📦 下载增量补丁 (${W.Utils.fmt(art.size || 0)} 字节)…` : `📦 下载资源包 (${W.Utils.fmt(art.size || 0)} 字节)…`);
        const buf = await this._fetchBuffer(art.url, (pct) => set(pct != null ? `📦 下载中 ${pct}%…` : '📦 下载中…'));
        // 4. SHA-256 校验
        set('🔒 校验完整性…');
        const hash = await this._sha256Hex(buf);
        if (art.sha256 && hash !== art.sha256.toLowerCase()) throw new Error('校验失败,请重试');
        // 5. 写入内部存储
        set('💾 写入本地…');
        const write = await Filesystem.writeFile({
          path: 'downloads/hotupdate.zip',
          data: this._bufToBase64(buf),
          directory: 'DATA',
          recursive: true,
        });
        if (!write || !write.uri) throw new Error('写入失败');
        // 6. 交给原生:解压 + 切换加载路径 + 重启
        set('⚡ 安装并重启…');
        this._set(this.APPLIED_KEY, tag); // 先记录,重启后生效版本一致
        await HotUpdate.applyUpdate({ mode, zipPath: write.uri, dirName: 'www-' + tag, version: tag });
        return { ok: true };
      } catch (e) {
        return { ok: false, message: e && e.message ? e.message : String(e) };
      }
    },

    /* 打开下载页:Capacitor WebView 用 _system 唤起系统浏览器,浏览器回退 _blank */
    openDownload(url) {
      try {
        const target = url || this.RELEASE_URL;
        if (window.open) window.open(target, '_system');
        else window.location.href = target;
      } catch (e) {
        window.location.href = url || this.RELEASE_URL;
      }
      if (W.Audio && W.Audio.click) W.Audio.click();
    },

    /* 组装更新弹窗(支持热更新时提供「在线更新」主按钮) */
    _showUpdate(release) {
      const cur = this.currentVersion();
      const hot = this.hotSupported();
      const body = (release.body || '')
        .replace(/```[a-z]*/gi, '').replace(/```/g, '')
        .split('\n').map((s) => s.trim())
        .filter(Boolean).slice(0, 40).join('\n');
      const html = `
        <div class="upd-box">
          <div class="upd-title">✨ 发现新版本 <b>${W.Utils.esc(release.tag_name || '')}</b></div>
          <div class="upd-sub">当前版本 <b>${W.Utils.esc(cur)}</b>${hot ? ' · 安卓端支持 <b>⚡ 增量热更新</b>（免装 APK，秒级完成）' : ''}</div>
          ${body ? `<div class="upd-log"><div class="upd-log-title">📋 更新日志</div><pre>${W.Utils.esc(body)}</pre></div>` : ''}
          <div class="modal-actions">
            ${hot ? '<button class="btn gold" data-upd-hot>⚡ 在线更新</button>' : '<button class="btn gold" data-upd-dl>⬇️ 前往下载 APK</button>'}
            ${hot ? '<button class="btn ghost" data-upd-dl>📦 下载 APK</button>' : ''}
            <button class="btn ghost" data-upd-later>稍后再说</button>
          </div>
        </div>`;
      W.UI.openModal(html, { title: '🔄 在线更新' });
      const m = document.getElementById('modal-root');
      const dl = m.querySelector('[data-upd-dl]');
      if (dl) dl.addEventListener('click', () => {
        W.UI.closeModal();
        this.openDownload(release.html_url || release.assets && release.assets[0] && release.assets[0].browser_download_url);
      });
      const hotBtn = m.querySelector('[data-upd-hot]');
      if (hotBtn) hotBtn.addEventListener('click', async () => {
        hotBtn.disabled = true;
        const bodyEl = m.querySelector('.modal-body');
        const status = (s) => {
          if (bodyEl) bodyEl.innerHTML = `<div class="upd-box"><div class="upd-title">⚡ 正在更新到 <b>${W.Utils.esc(release.tag_name || '')}</b></div><div class="upd-sub hot-status">${s}</div></div>`;
        };
        status('⏳ 准备中…');
        const r = await this._runHotUpdate(release, status);
        if (!r.ok) {
          status(`<span style="color:#ff8080">❌ 更新失败：${W.Utils.esc(r.message || '未知错误')}</span>`);
          setTimeout(() => {
            if (bodyEl) bodyEl.innerHTML = `<div class="upd-box"><div class="upd-sub">可稍后重试，或改用「下载 APK」完整安装。</div><div class="modal-actions"><button class="btn gold" data-upd-retry>🔄 重试</button><button class="btn ghost" data-close>关闭</button></div></div>`;
            const retry = bodyEl.querySelector('[data-upd-retry]');
            if (retry) retry.addEventListener('click', () => { W.UI.closeModal(); setTimeout(() => this._showUpdate(release), 60); });
          }, 400);
        }
        // 成功时原生端已触发页面重载,无需处理
      });
      const later = m.querySelector('[data-upd-later]');
      if (later) later.addEventListener('click', () => {
        this.ignore(release.tag_name);
        W.UI.closeModal();
      });
    },

    /* 手动检查(设置面板):总是请求,有更新弹窗 / 无更新 toast */
    async manual() {
      const rel = await this._fetchLatest();
      if (!rel) {
        if (W.UI && W.UI.toast) W.UI.toast('⚠️ 检查更新失败：无法连接 GitHub（请检查网络）', 'warn');
        return;
      }
      const latest = this.parse(rel.tag_name);
      const cur = this.parse(this.currentVersion());
      if (latest && cur && this.compare(latest, cur) > 0) {
        this._showUpdate(rel);
      } else {
        if (W.UI && W.UI.toast) W.UI.toast(`✅ 已是最新版本 v${W.Utils.esc(this.currentVersion())}`, 'ok');
      }
    },

    /* 自动检查:每日一次,忽略今日已提示的版本 */
    async autoCheck() {
      try {
        const last = parseInt(this._get(this.CHECK_KEY), 10) || 0;
        if (Date.now() - last < this.AUTO_INTERVAL) return;
        this._set(this.CHECK_KEY, String(Date.now()));
        const rel = await this._fetchLatest();
        if (!rel) return;
        const latest = this.parse(rel.tag_name);
        const cur = this.parse(this.currentVersion());
        if (!latest || !cur) return;
        if (this.compare(latest, cur) > 0) {
          const ignored = this._get(this.IGNORE_KEY);
          if (ignored !== rel.tag_name) this._showUpdate(rel);
        }
      } catch (e) { /* 静默失败 */ }
    },

    /* 用户稍后再说:记录忽略版本,当日自动检查不再打扰 */
    ignore(releaseTag) {
      this._set(this.IGNORE_KEY, releaseTag);
      this._set(this.CHECK_KEY, String(Date.now() - this.AUTO_INTERVAL + 30 * 60 * 1000)); // 30 分钟后再检查
    },
  };

  W.Updater = Updater;
})();
