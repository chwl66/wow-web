/* 魔兽世界 · 战大陆 — Capacitor 原生桥接(仅安卓/iOS 原生壳生效)
 * 依据安卓应用开发规范:
 *  1. 系统返回键按导航层级处理:关弹窗 → 战斗逃跑 → 世界回标题 → 标题双击退出
 *  2. 切后台(appStateChange)强制自动存档(beforeunload 在 WebView 不可靠)
 *  3. 状态栏样式跟随暗色主题(SystemBars)
 *  4. WebView 首屏就绪后主动隐藏启动画面(SplashScreen)
 * 浏览器环境自动跳过,不影响 file:// 双击游玩。 */
(function () {
  'use strict';

  const W = window.WOW;

  function isNative() {
    return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  }
  if (!isNative()) return;

  const App = window.Capacitor.Plugins && window.Capacitor.Plugins.App;
  const Splash = window.Capacitor.Plugins && window.Capacitor.Plugins.SplashScreen;
  const SysBars = window.Capacitor.Plugins && window.Capacitor.Plugins.SystemBars;

  // ---------- 1. 返回键导航 ----------
  // 双击退出:2 秒内再次按返回才退出应用
  let lastBackAt = 0;

  // 创建流程回退(与 main.js 的 back-* 按钮保持一致)
  function createBack() {
    const root = document.getElementById('view-create');
    if (!root) return false;
    if (root.querySelector('#char-name')) { W.Main.stepClass(); return true; }   // 命名 → 职业
    if (root.querySelector('.class-pick')) { W.Main.stepRace(W.Main.create.faction); return true; } // 职业 → 种族
    if (root.querySelector('.race-pick')) { W.Main.stepFaction(); return true; }  // 种族 → 阵营
    if (root.querySelector('.faction-pick')) { // 阵营 → 标题
      W.UI.showView('title');
      return true;
    }
    return false;
  }

  function onBackButton() {
    // 0. 锁定弹窗(战斗结算等 data-lock)不响应返回键,必须点击按钮,防止误触卡死
    const lockedModal = document.querySelector('#modal-root .modal[data-lock]');
    if (lockedModal && lockedModal.parentElement.classList.contains('show')) return;
    // 1. 普通弹窗 → 关闭
    const modalRoot = document.getElementById('modal-root');
    if (modalRoot && modalRoot.classList.contains('show')) { W.UI.closeModal(); return; }

    const active = (name) => {
      const v = document.getElementById('view-' + name);
      return v && v.classList.contains('active');
    };
    // 2. 战斗 → 尝试逃跑(副本/Boss 战不可逃,由战斗引擎提示)
    if (active('battle')) {
      const fleeBtn = document.querySelector('#view-battle [data-act="flee"]');
      if (fleeBtn && !fleeBtn.disabled) { fleeBtn.click(); return; }
      W.UI.toast('当前战斗无法逃跑', 'warn');
      return;
    }
    // 3. 创建流程 → 回退一步
    if (active('create')) { if (createBack()) return; }
    // 4. 世界 → 返回标题(带确认,防止误触丢失进度)
    if (active('world')) { W.World.backToTitle(); return; }
    // 5. 标题 → 双击退出
    if (active('title')) {
      const now = Date.now();
      if (now - lastBackAt < 2000) { App.exitApp(); return; }
      lastBackAt = now;
      W.UI.toast('再按一次返回键退出游戏', 'warn');
      return;
    }
  }

  if (App) {
    App.addListener('backButton', onBackButton);
  }

  // ---------- 2. 切后台自动存档 ----------
  if (App) {
    App.addListener('appStateChange', (state) => {
      if (state && state.isActive === false) {
        // 战斗进行中不保存瞬时状态(与周期兜底一致)
        const b = W.Combat && W.Combat.battle;
        if (!b || b.ended) W.State.autoSave(true);
      }
    });
  }

  // ---------- 3. 状态栏样式(暗色背景 → 浅色内容) ----------
  if (SysBars) {
    try {
      SysBars.setStyle({ style: 'DARK', bar: 'StatusBar' });
    } catch (e) { /* 老版本忽略 */ }
  }

  // ---------- 3.5 热更新:启动时同步当前生效的 Web 资源版本 ----------
  // 若已应用过热更新(内部存储目录加载),把生效版本写入 localStorage,
  // 供增量更新决策(patch 基准判断)与「设置」面板展示使用。
  try {
    const HotUpdate = window.Capacitor.Plugins && window.Capacitor.Plugins.HotUpdate;
    if (HotUpdate) {
      HotUpdate.getActiveUpdate().then((active) => {
        if (active && active.version) {
          try { localStorage.setItem('wow_web_applied_version', active.version); } catch (e) { /* ignore */ }
        }
      }).catch(() => { /* ignore */ });
    }
  } catch (e) { /* ignore */ }

  // ---------- 4. 首屏就绪后隐藏启动画面 ----------
  if (Splash) {
    const hide = () => { try { Splash.hide({ fadeOutDuration: 200 }); } catch (e) { /* ignore */ } };
    if (document.readyState === 'complete') hide();
    else window.addEventListener('load', hide);
    setTimeout(hide, 2500); // 兜底:最多 2.5s 后隐藏
  }
})();
