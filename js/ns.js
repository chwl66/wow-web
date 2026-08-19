/* 魔兽世界 · 网页版 — 命名空间 / 全局配置 / 随机数 / 工具函数
 * 采用 IIFE 全局挂载,保证 file:// 双击即可运行,无需构建工具。 */
(function () {
  'use strict';

  const W = window.WOW = {};

  // ---------- 全局配置 ----------
  W.Config = {
    GAME_TITLE: '魔兽世界 · 艾泽拉斯传说',
    SAVE_KEY: 'wow_web_save_v1',
    SAVE_VERSION: 2,        // 存档格式版本(存档槽已扩容至 10)
    LEVEL_CAP: 60,          // 等级上限(地图已扩充至 60 级)
    MAX_SLOTS: 10,         // 存档槽位
    ENCOUNTER_CHANCE: 0.55, // 野外探索遇怪概率
    ELITE_RESPAWN_MS: 5 * 60 * 1000, // 稀有精英击败后刷新周期(5 分钟)
    WORLD_BOSS_RESPAWN_MS: 30 * 60 * 1000, // 世界首领击败后重新现身周期(30 分钟)
    PERFECT_CHANCE: 0.06,     // 装备掉落为极品属性的概率(属性提升 +50%)
    PERFECT_STAT_MULT: 1.5,   // 极品装备属性倍率
    LEGENDARY_PERFECT_CHANCE: 0.15, // 橙色传说装备掉落时附加极品属性的概率
    POST_BATTLE_HP_PCT: 0.2,  // 战斗胜利后自动恢复最大生命的比例(不占用回合)
    DROP_EQUIP_BOOST: 1.6,    // 地图怪物装备掉落率倍率(大幅提升)
    TOUCH_SWIPE_THRESHOLD: 40, // 触屏滑动手势判定阈值(px),小于该距离视为点击
    SKILL_PAGE_SIZE: 8,        // 技能书每页技能条数(触屏左右滑动翻页)
    BAG_SIZE: 40,      // 基础背包容量
    BAG_MAX: 100,      // 背包容量上限(购买背包扩充后)
    PET_STABLE: 8,         // 猎人宠物栏上限
    POISON_CHARGES: 20,    // 单次涂抹毒药的命中次数
    SOUL_SHARD_CAP: 20,    // 术士灵魂碎片上限

    // 自动存档
    AUTO_SAVE_MIN_INTERVAL: 15,  // 自动存档最小间隔(秒),避免频繁写入
    AUTO_SAVE_PERIOD: 60,        // 周期兜底自动存档间隔(秒)

    // 装备锻造
    FORGE_MAX_LEVEL: 15,          // 强化上限(60级装备长线养成)
    FORGE_BASE_COST: 50,          // 强化基础费用
    FORGE_COST_PER_ITEM_LEVEL: 20, // 每级物品等级额外费用

    // 战斗数值
    HIT_BASE: 0.92,        // 同级基础命中
    HIT_PER_LEVEL_DIFF: 0.01, // 每级差命中变化
    DODGE_BASE: 0.03,
    DODGE_PER_AGI: 0.0008,
    CRIT_BASE: 0.04,
    CRIT_PER_AGI: 0.0004,
    CRIT_MULT: 1.5,
    ARMOR_DENOM: 400,      // 护甲公式: 减伤 = 护甲/(护甲+400+85*攻击者等级)
    ARMOR_CAP: 0.75,
    RESIST_FULL_CHANCE: 0.05, // 元素抗性全额抵抗基础概率
    DEFEND_ARMOR_BONUS: 0.5,  // 防御动作护甲加成
    FLEE_BASE: 0.5,
    FLEE_MAX: 0.92,

    // 资源
    ENERGY_MAX: 100,
    ENERGY_REGEN: 18,      // 盗贼每回合能量恢复
    RAGE_DMG_RATE: 0.35,   // 造成伤害产生怒气比例
    RAGE_TAKEN_RATE: 0.5,  // 受到伤害产生怒气比例
    RAGE_MAX: 100,
    MANA_REGEN_PCT: 0.06,  // 每回合恢复法力上限百分比(精神加成)

    // 成长
    EXP_CURVE: 24,         // expNeeded(lvl) = floor(EXP_CURVE * lvl^1.7 + 12 * lvl)
    REVIVE_HP_PCT: 0.2,    // 死亡复活后生命
    GOLD_DROP_RATE: 0.9,
    MAXLVL_EXP_GOLD: 0.2,  // 满级后每点经验转换的铜金币(少量补偿,如 450 经验 ≈ 90 铜)
  };

  // ---------- 随机数 ----------
  const RNG = {
    rand: () => Math.random(),
    int(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; },
    chance(p) { return Math.random() < p; },
    pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
    weighted(items) { // items: [[weight, value], ...]
      const total = items.reduce((s, [w]) => s + w, 0);
      let r = Math.random() * total;
      for (const [w, v] of items) { r -= w; if (r <= 0) return v; }
      return items[items.length - 1][1];
    },
  };
  W.RNG = RNG;

  // ---------- 工具 ----------
  W.Utils = {
    clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); },
    clamp01(v) { return W.Utils.clamp(v, 0, 1); },
    fmt(n) { return Math.floor(n).toLocaleString('en-US'); },
    // 铜币 -> "1金 23银 45铜"
    money(copper) {
      copper = Math.max(0, Math.floor(copper));
      const g = Math.floor(copper / 10000);
      const s = Math.floor((copper % 10000) / 100);
      const c = copper % 100;
      const parts = [];
      if (g) parts.push(`<span class="coin gold">${g}<i>金</i></span>`);
      if (s) parts.push(`<span class="coin silver">${s}<i>银</i></span>`);
      if (c || parts.length === 0) parts.push(`<span class="coin copper">${c}<i>铜</i></span>`);
      return parts.join(' ');
    },
    plainMoney(copper) {
      copper = Math.max(0, Math.floor(copper));
      const g = Math.floor(copper / 10000), s = Math.floor((copper % 10000) / 100), c = copper % 100;
      return (g ? g + '金' : '') + (s ? s + '银' : '') + (c || (!g && !s) ? c + '铜' : '');
    },
    esc(s) {
      return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    },
    // 相对时间:刚刚 / N 分钟前 / N 小时前 / [年-]MM-DD HH:MM(跨年补年份)
    fmtRelTime(ts) {
      if (!ts) return '—';
      const diff = Date.now() - ts;
      if (diff < 60 * 1000) return '刚刚';
      if (diff < 3600 * 1000) return Math.floor(diff / 60000) + ' 分钟前';
      if (diff < 24 * 3600 * 1000) return Math.floor(diff / 3600000) + ' 小时前';
      const d = new Date(ts);
      const p = (n) => (n < 10 ? '0' + n : '' + n);
      const y = d.getFullYear() !== new Date().getFullYear() ? d.getFullYear() + '-' : '';
      return y + (d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
    },
    el(tag, cls, html) {
      const e = document.createElement(tag);
      if (cls) e.className = cls;
      if (html != null) e.innerHTML = html;
      return e;
    },
    delay(ms) { return new Promise((r) => setTimeout(r, ms)); },
    // 品质颜色
    QUALITY_COLOR: { gray: '#9d9d9d', white: '#ffffff', green: '#1eff00', blue: '#0070dd', epic: '#a335ee', purple: '#a335ee', legendary: '#ff8000', orange: '#ff8000' },

    // 进度条 HTML(pct 0-1)
    bar(pct, cls, label) {
      pct = W.Utils.clamp01(pct) * 100;
      return '<div class="bar ' + cls + '"><div class="bar-fill" style="width:' + pct + '%"></div>' +
        (label != null ? '<div class="bar-label">' + label + '</div>' : '') + '</div>';
    },

    // 触屏滑动手势判定:返回 'left' | 'right' | 'up' | 'down' | 'tap'
    // 规则:先过阈值,再按占优轴(≥1.2 倍)判定,斜向滑动不误判
    swipeVerdict(dx, dy, threshold) {
      const th = threshold || 40;
      const adx = Math.abs(dx), ady = Math.abs(dy);
      if (adx < th && ady < th) return 'tap';
      if (adx >= ady * 1.2) return dx > 0 ? 'right' : 'left';
      if (ady >= adx * 1.2) return dy > 0 ? 'down' : 'up';
      return 'tap';
    },

    // 列表分页:返回页数组(每页 size 项),size 至少为 1
    paginate(list, size) {
      const n = Math.max(1, Math.floor(size) || 1);
      const pages = [];
      for (let i = 0; i < list.length; i += n) pages.push(list.slice(i, i + n));
      return pages;
    },

    // 环形索引:cur 在 arr 中的位置沿 dir(±1)循环前进/后退,找不到时从 0 出发
    cycleIndex(arr, cur, dir) {
      if (!arr || !arr.length) return -1;
      const idx = arr.indexOf(cur);
      const base = idx < 0 ? 0 : idx;
      const d = dir || 1;
      return ((base + d) % arr.length + arr.length) % arr.length;
    },
  };

  // 经验需求曲线
  W.Utils.expNeeded = function (level) {
    return Math.floor(W.Config.EXP_CURVE * Math.pow(level, 1.7) + 12 * level);
  };
})();
