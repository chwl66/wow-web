/* 魔兽世界 · 战大陆 — 按需加载器
 *
 * 为什么把 data-world.js(342 KB / 19 张数据表)踢出首屏:
 *   标题界面只需要存档摘要和种族职业表(在 data-races.js),完全用不到
 *   怪物 / 副本 / 掉落 / 任务 / 成就这些世界数据。首屏 992 KB 里它占了 1/3,
 *   而它要等玩家真正「进入游戏」才有意义。
 *
 * 为什么用动态 <script> 而不是 import():
 *   本工程硬约束是「双击 index.html 直接运行」,file:// 协议下 ES Module 的
 *   import() 会被 CORS 拦下;经典脚本的 <script> 注入没有这个限制,
 *   是唯一同时满足「双击可玩 + 懒加载」的方式。
 */
(function () {
  'use strict';

  const W = window.WOW || (window.WOW = {});
  const pending = Object.create(null);

  function inject(src) {
    return new Promise((resolve, reject) => {
      const el = document.createElement('script');
      el.src = src;
      el.async = false;
      el.onload = () => resolve();
      el.onerror = () => reject(new Error('脚本加载失败: ' + src));
      document.head.appendChild(el);
    });
  }

  const Loader = {
    /* 通用脚本加载:同一 src 只加载一次,并发调用共享同一个 Promise */
    script(src) {
      if (!pending[src]) {
        pending[src] = inject(src).catch((e) => {
          delete pending[src]; // 失败后允许重试
          throw e;
        });
      }
      return pending[src];
    },

    /* 世界数据:幂等。已就绪时立即 resolve,不产生任何额外开销 */
    world() {
      if (this.isWorldReady()) return Promise.resolve(W.Data);
      return this.script('js/data-world.js').then(() => W.Data);
    },

    isWorldReady() {
      const D = W.Data;
      return !!(D && D.ZONES && D.MONSTERS);
    },
  };

  W.Loader = Loader;
})();
