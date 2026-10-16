/* 数据交叉引用自检:拦下「数据里定义了,玩家却永远拿不到 / 走不到」的死内容。
 * 典型事故:套装散件没有任何掉落源(整套无法集齐)、副本首领不在波次里、
 * 怪物不在遭遇表中(野外永远刷不出来)、附魔/配方引用不存在的物品……
 * 这些都不会报错、测试也可能全绿,但玩家侧表现为「玩不到」。
 *
 * 零依赖:用浏览器环境桩加载 js/*.js 后只读数据表(与 test-headless.js 同款桩)。
 * 用法: node scripts/audit-data.js
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// ---------- 浏览器环境桩 ----------
global.window = global;
global.localStorage = {
  _d: {},
  getItem(k) { return this._d[k] || null; },
  setItem(k, v) { this._d[k] = String(v); },
  removeItem(k) { delete this._d[k]; },
};
global.document = {
  addEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; },
  createElement() { return { classList: { add() {}, remove() {} }, style: {}, appendChild() {}, remove() {} }; },
  body: { appendChild() {} },
};

const FILES = ['ns.js', 'data-races.js', 'data-world.js', 'data-talents.js', 'engine.js', 'character.js', 'combat.js', 'world.js'];
for (const f of FILES) {
  const code = fs.readFileSync(path.join(ROOT, 'js', f), 'utf8');
  (new Function(code))();
}
const W = global.WOW;
const D = W.Data;

// 引擎源码文本(用于判断某效果字段是否有实现分支)
const SRC_ALL = FILES.concat(['battle.js', 'main.js'])
  .map((f) => fs.readFileSync(path.join(ROOT, 'js', f), 'utf8')).join('\n');
const SRC_ENGINE = ['character.js', 'combat.js']
  .map((f) => fs.readFileSync(path.join(ROOT, 'js', f), 'utf8')).join('\n');

let failed = 0;
function check(name, cond, extra) {
  if (cond) console.log(`  ✅ ${name}`);
  else { failed++; console.log(`  ❌ ${name}${extra ? ' — ' + extra : ''}`); }
}
function hasWord(src, word) {
  return new RegExp('\\b' + String(word).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b').test(src);
}

console.log('== 数据交叉引用审计 ==');

/* ---------- 技能 ---------- */
{
  const learnable = new Set();
  for (const c of Object.values(D.CLASSES)) for (const s of c.skills) learnable.add(s);
  for (const r of Object.values(D.RACES)) for (const t of r.traits || []) if (t.active) learnable.add(t.active);
  for (const trees of Object.values(D.TALENTS)) {
    for (const tree of trees) for (const n of tree.talents) {
      if (n.active) learnable.add(n.active);
      for (const m of n.mods || []) if (m.skill) learnable.add(m.skill);
    }
  }
  const orphans = Object.keys(D.SKILLS).filter((id) => !learnable.has(id));
  check(`技能均有习得途径(${Object.keys(D.SKILLS).length} 个)`, orphans.length === 0, orphans.join(','));

  const badTalentRef = [];
  for (const [cls, trees] of Object.entries(D.TALENTS)) {
    for (const tree of trees) for (const n of tree.talents) {
      for (const m of n.mods || []) if (m.skill && !D.SKILLS[m.skill]) badTalentRef.push(`${cls}/${tree.id}/${n.id}→${m.t}`);
    }
  }
  check('天赋引用的技能都存在', badTalentRef.length === 0, badTalentRef.join(','));

  const badRaceRef = Object.entries(D.RACES)
    .flatMap(([rid, r]) => (r.traits || []).filter((t) => t.active && !D.SKILLS[t.active]).map((t) => `${rid}→${t.active}`));
  check('种族天赋主动技能都存在', badRaceRef.length === 0, badRaceRef.join(','));

  // 技能上的机制字段必须有实现分支(否则是「写了但没生效」的死机制)
  const META = new Set(['id', 'name', 'icon', 'cls', 'race', 'learn', 'desc', 'res', 'cost', 'cd', 'talent', 'passive']);
  const keys = new Map();
  function walkSkillKeys(o, sid, isRoot) {
    if (!o || typeof o !== 'object' || Array.isArray(o)) return;
    for (const k in o) {
      if (!(isRoot && META.has(k))) {
        if (!keys.has(k)) keys.set(k, new Set());
        keys.get(k).add(sid);
      }
      walkSkillKeys(o[k], sid, false);
    }
  }
  for (const [sid, s] of Object.entries(D.SKILLS)) walkSkillKeys(s, sid, true);
  const unimpl = [];
  for (const [k, ids] of keys) if (!hasWord(SRC_ENGINE, k)) unimpl.push(`${k}(${Array.from(ids).slice(0, 3).join(',')})`);
  check('技能机制字段均有引擎实现', unimpl.length === 0, unimpl.join(','));
}

/* ---------- 怪物 ---------- */
{
  const badSkillRef = Object.entries(D.MONSTERS)
    .filter(([, m]) => (m.skills || []).some((s) => !D.MONSTER_SKILLS[s]))
    .map(([id, m]) => `${id}→${m.skills.filter((s) => !D.MONSTER_SKILLS[s]).join('/')}`);
  check('怪物技能引用有效', badSkillRef.length === 0, badSkillRef.join(','));

  const badSummon = Object.values(D.MONSTER_SKILLS)
    .filter((s) => s.summon && !D.MONSTERS[s.summon]).map((s) => `${s.id}→${s.summon}`);
  check('怪物技能召唤目标存在', badSummon.length === 0, badSummon.join(','));

  const usedSkills = new Set();
  for (const m of Object.values(D.MONSTERS)) for (const s of m.skills || []) usedSkills.add(s);
  const deadSkills = Object.keys(D.MONSTER_SKILLS).filter((s) => !usedSkills.has(s));
  check('无未被使用的怪物技能', deadSkills.length === 0, deadSkills.join(','));

  // 根字段里的 name/icon/desc/sig 只供副本手册与悬停说明使用,不属于战斗机制
  const MMETA = new Set(['id', 'name', 'icon', 'desc', 'sig']);
  const mk = new Set();
  function collectMonsterKeys(o, isRoot) {
    if (!o || typeof o !== 'object' || Array.isArray(o)) return;
    for (const k in o) {
      if (!(isRoot && MMETA.has(k))) mk.add(k);
      collectMonsterKeys(o[k], false);
    }
  }
  for (const s of Object.values(D.MONSTER_SKILLS)) collectMonsterKeys(s, true);
  const unimplM = [];
  for (const k of mk) if (!hasWord(SRC_ENGINE, k)) unimplM.push(k);
  check('怪物技能字段均有引擎实现', unimplM.length === 0, unimplM.join(','));
}

/* ---------- 地图与遭遇 ---------- */
{
  const zones = Object.keys(D.ZONES);
  const badTravel = [];
  for (const [z, o] of Object.entries(D.ZONES)) {
    for (const t of o.travel || []) if (!D.ZONES[t]) badTravel.push(`${z}→${t}`);
  }
  check('区域出口都指向存在的区域', badTravel.length === 0, badTravel.join(','));

  const adj = {};
  for (const z of zones) adj[z] = new Set(D.ZONES[z].travel || []);
  for (const [z, a] of Object.entries(D.AIRSHIPS || {})) if (adj[z]) for (const t of a.to) adj[z].add(t);
  const seen = new Set(['elwynn']);
  const queue = ['elwynn'];
  while (queue.length) { const cur = queue.shift(); for (const t of adj[cur] || []) if (!seen.has(t)) { seen.add(t); queue.push(t); } }
  check(`全部区域可从起始区抵达(${zones.length} 个)`, seen.size === zones.length, zones.filter((z) => !seen.has(z)).join(','));

  const encounters = new Set();
  for (const list of Object.values(D.ENCOUNTERS)) for (const e of list) for (const id of (e[1] || [])) encounters.add(id);
  const noEncounter = Object.entries(D.ZONES)
    .flatMap(([zid, z]) => (z.monsters || []).filter((m) => !encounters.has(m)).map((m) => `${zid}:${m}`));
  check('野外怪物都在遭遇表中(能刷出来)', noEncounter.length === 0, noEncounter.join(','));

  const reachable = new Set(encounters);
  for (const z of Object.values(D.ZONES)) for (const m of z.monsters || []) reachable.add(m);
  for (const dg of Object.values(D.DUNGEONS)) {
    for (const w of dg.waves) for (const m of w.enemies) reachable.add(m);
    if (dg.boss) reachable.add(dg.boss);
  }
  for (const r of Object.values(D.CAPITAL_RAIDS || {})) for (const w of r.waves) for (const m of w.enemies) reachable.add(m);
  for (const wb of Object.values(D.WORLD_BOSSES || {})) reachable.add(wb.mid);
  for (const s of Object.values(D.MONSTER_SKILLS)) if (s.summon) reachable.add(s.summon);
  const orphanMonsters = Object.keys(D.MONSTERS).filter((m) => !reachable.has(m));
  check(`无孤儿怪物(不在任何战斗阵容里)`, orphanMonsters.length === 0, orphanMonsters.join(','));
}

/* ---------- 副本 ---------- */
{
  const badWave = [];
  const badBoss = [];
  for (const d of Object.values(D.DUNGEONS)) {
    if (!d.waves || !d.waves.length) { badWave.push(d.id); continue; }
    const all = d.waves.flatMap((w) => w.enemies);
    if (!all.includes(d.boss)) badBoss.push(d.id);
  }
  check('副本波次都含最终首领', badBoss.length === 0, badBoss.join(','));
  check('副本都有战斗波次', badWave.length === 0, badWave.join(','));

  const badEntry = [];
  for (const d of Object.values(D.DUNGEONS)) {
    if (!D.ZONES[d.zone]) { badEntry.push(`${d.id}→${d.zone} 不存在`); continue; }
    const entryZone = Object.values(D.ZONES).find((z) => z.dungeon === d.id);
    if (!entryZone) badEntry.push(`${d.id} 无入口区域`);
  }
  for (const z of Object.values(D.ZONES)) if (z.dungeon && !D.DUNGEONS[z.dungeon]) badEntry.push(`${z.id}→${z.dungeon} 不存在`);
  check('副本入口区域闭环', badEntry.length === 0, badEntry.join(','));

  const noLoot = Object.values(D.DUNGEONS).filter((d) => !D.DROPS[d.boss]).map((d) => `${d.id}/${d.boss}`);
  check('副本最终首领都有掉落表', noLoot.length === 0, noLoot.join(','));

  // 引擎对 30 级以上副本最终首领做「保底一件紫/橙战利品」,掉落表里必须至少有一件紫/橙兜底
  const EQ_HI = ['epic', 'purple', 'legendary', 'orange'];
  const noEpic = Object.values(D.DUNGEONS)
    .filter((d) => (d.minLevel || 0) >= 30)
    .filter((d) => !(D.DROPS[d.boss] || []).some(([i]) => {
      const it = D.ITEMS[i];
      return it && EQ_HI.includes(it.quality);
    })).map((d) => d.id);
  check('30 级以上副本首领有保底紫/橙战利品', noEpic.length === 0, noEpic.join(','));
}

/* ---------- 物品与套装 ---------- */
{
  const SLOTS = new Set(['weapon', 'offhand', 'head', 'chest', 'gloves', 'legs', 'boots', 'cloak',
    'neck', 'ring', 'trinket', 'consumable', 'material', 'bag', 'mount']);
  const QUAL = new Set(['gray', 'white', 'green', 'blue', 'epic', 'purple', 'legendary', 'orange']);
  const badSlot = Object.values(D.ITEMS).filter((i) => !SLOTS.has(i.slot)).map((i) => `${i.id}:${i.slot}`);
  const badQual = Object.values(D.ITEMS).filter((i) => !QUAL.has(i.quality)).map((i) => `${i.id}:${i.quality}`);
  check('物品槽位合法', badSlot.length === 0, badSlot.join(','));
  check('物品品质合法', badQual.length === 0, badQual.join(','));

  // 获取途径:商店 / 掉落 / 任务奖励 / 合成 / 打造 / 成就奖励 / 敌方主城突袭 / 军需官
  const obtainable = new Set();
  for (const z of Object.values(D.ZONES)) for (const i of z.shop || []) obtainable.add(i);
  for (const list of Object.values(D.DROPS)) for (const e of list) obtainable.add(e[0]);
  for (const q of Object.values(D.QUESTS)) for (const i of q.rewardItems || []) obtainable.add(i);
  for (const r of Object.values(Object.assign({}, D.SYNTH, D.CRAFTS))) if (r.item) obtainable.add(r.item);
  for (const a of Object.values(D.ACHIEVEMENTS)) for (const i of (a.reward && a.reward.items) || []) obtainable.add(i);
  for (const r of Object.values(D.CAPITAL_RAIDS || {})) for (const i of (r.rewards && r.rewards.items) || []) obtainable.add(i);
  for (const it of Object.values(D.ITEMS)) if (it.rep) obtainable.add(it.id);

  const orphanItems = Object.keys(D.ITEMS).filter((i) => !obtainable.has(i));
  check(`物品都有获取途径(${Object.keys(D.ITEMS).length} 件)`, orphanItems.length === 0, orphanItems.join(','));

  const badSet = [];
  for (const [sid, s] of Object.entries(D.SETS)) {
    for (const p of s.pieces) {
      const it = D.ITEMS[p];
      if (!it) badSet.push(`${sid} 缺件 ${p}`);
      else if (it.setId !== sid) badSet.push(`${p}.setId=${it.setId}≠${sid}`);
    }
  }
  for (const it of Object.values(D.ITEMS)) if (it.setId && !D.SETS[it.setId]) badSet.push(`${it.id}.setId=${it.setId} 无套装`);
  check('套装件与 setId 双向一致', badSet.length === 0, badSet.join(','));

  const unreachable = [];
  for (const st of Object.values(D.SETS)) {
    const maxNeed = Math.max.apply(null, st.bonuses.map((b) => b.need));
    const got = st.pieces.filter((p) => obtainable.has(p)).length;
    if (got < maxNeed) unreachable.push(`${st.id} ${got}/${st.pieces.length}(需 ${maxNeed})`);
  }
  check('每套套装的最强加成都能集齐', unreachable.length === 0, unreachable.join(','));

  // 团本套装散件应主要由副本内小怪/中途首领产出,避免整套堆在最终首领一处
  // (奥妮克希亚的巢穴无中途首领,散件由巢穴小怪与精英承担)
  const dropsByMonster = {};
  for (const [mid, list] of Object.entries(D.DROPS)) dropsByMonster[mid] = list.map((e) => e[0]);
  const bossOnly = [];
  for (const st of Object.values(D.SETS)) {
    const dgs = Object.values(D.DUNGEONS).filter((d) => st.source && st.source.includes(d.name));
    if (!dgs.length) continue;
    const fromAdds = new Set();
    for (const d of dgs) {
      for (const w of d.waves) {
        for (const mid of w.enemies) {
          if (mid === d.boss) continue;
          for (const i of dropsByMonster[mid] || []) fromAdds.add(i);
        }
      }
    }
    // 严格一点:不断最终首领，光靠中途首领/小怪也够凑齐最强加成
    const maxNeed = Math.max.apply(null, st.bonuses.map((b) => b.need));
    const n = st.pieces.filter((p) => fromAdds.has(p)).length;
    if (n < maxNeed) bossOnly.push(`${st.id} 仅 ${n}/${st.pieces.length} 件来自中途首领/小怪(需 ${maxNeed})`);
  }
  check('团本套装散件不全靠最终首领产出', bossOnly.length === 0, bossOnly.join(','));
}

/* ---------- 装备属性平衡 ----------
 * 装备写歪了不会报错也不会掉内容,只体现为「玩家换到更高档装备反而更弱」:
 * 花时间刷来的紫装打不过同槽位蓝装、低等级绿装全面压制高等级蓝装……
 * 这里对全部可穿戴装备做三件事:严格压制检测 / 同档位纯劣化重复品 / 引擎口径战力曲线塌陷。 */
{
  const EQ_SLOTS = ['weapon', 'offhand', 'head', 'chest', 'gloves', 'legs', 'boots', 'cloak', 'neck', 'ring', 'trinket'];
  const QR = { gray: 0, white: 0, green: 1, blue: 2, epic: 3, purple: 3, legendary: 4, orange: 4 };
  const gears = Object.values(D.ITEMS).filter((it) => EQ_SLOTS.includes(it.slot));
  const avgDmg = (it) => (it.stats && it.stats.dmg ? (it.stats.dmg[0] + it.stats.dmg[1]) / 2 : 0);
  const axes = (a, b) => [...new Set([...Object.keys(a.stats || {}).filter((k) => k !== 'dmg'), ...Object.keys(b.stats || {}).filter((k) => k !== 'dmg'), ...(a.stats && a.stats.dmg ? ['dmg'] : []), ...(b.stats && b.stats.dmg ? ['dmg'] : [])])];
  // A 严格压制 B:与 B 比较的每一项属性 A 都不低,且至少一项更高
  function dominates(A, B) {
    let any = false;
    for (const k of axes(A, B)) {
      const av = k === 'dmg' ? avgDmg(A) : (A.stats[k] || 0);
      const bv = k === 'dmg' ? avgDmg(B) : (B.stats[k] || 0);
      if (av < bv - 1e-9) return false;
      if (av > bv + 1e-9) any = true;
    }
    return any;
  }
  const describe = (it) => `${it.id}(lv${it.level} ${it.quality} ${JSON.stringify(it.stats)})`;

  // 1) 倒挂压制:更低档(等级更低,品质不更高;或同级但品质更低)的装备全面压制更高档装备
  const reversed = [];
  for (const A of gears) for (const B of gears) {
    if (A === B || A.slot !== B.slot || QR[A.quality] > QR[B.quality]) continue;
    const lowerTier = A.level < B.level || (A.level === B.level && QR[A.quality] < QR[B.quality]);
    if (!lowerTier) continue;
    if (dominates(A, B)) reversed.push(`${describe(B)} 被 ${describe(A)} 压制`);
  }
  check('装备无倒挂压制(低档装备全面强于高档装备)', reversed.length === 0, reversed.slice(0, 5).join(' | '));

  // 2) 同档位纯劣化重复品:同槽位同等级同品质,一件在每一项上都不劣于另一件
  const clones = [];
  for (const A of gears) for (const B of gears) {
    if (A === B || A.slot !== B.slot || A.level !== B.level || A.quality !== B.quality) continue;
    if (dominates(A, B)) clones.push(`${describe(B)} 被 ${describe(A)} 同档压制`);
  }
  check('同档装备无纯劣化重复品', clones.length === 0, clones.slice(0, 5).join(' | '));

  // 3) 引擎口径战力曲线:把装备穿到同等级裸体参考角色上,量真实战斗提升(dps/有效生命/法强)
  // 同槽位+同品质+同属性线内,更高等级装备的战力不得低于前面更低等级装备的 85%(曲线不能塌陷)
  const NAKED = { weapon: null, offhand: null, head: null, chest: null, gloves: null, legs: null, boots: null, cloak: null, neck: null, ring1: null, ring2: null, trinket1: null, trinket2: null };
  const lineOf = (it) => {
    const s = it.stats || {};
    if ((s.int || 0) > 0 && !(s.str || 0) && !(s.agi || 0)) return 'caster';
    if ((s.agi || 0) > 0 && !(s.str || 0)) return 'agile';
    if ((s.int || 0) > (s.str || 0) + (s.agi || 0)) return 'caster';
    return 'physical';
  };
  function powerOf(it) {
    const slot = it.slot === 'ring' ? 'ring1' : (it.slot === 'trinket' ? 'trinket1' : it.slot);
    const mk = (eqId) => {
      const c = W.Char.create('audit', 'human', lineOf(it) === 'caster' ? 'mage' : (lineOf(it) === 'agile' ? 'rogue' : 'warrior'));
      c.level = it.level;
      c.equipment = Object.assign({}, NAKED, eqId ? { [slot]: eqId } : {});
      return W.Char.computed(c);
    };
    const m = (c) => {
      const dr = Math.min(W.Config.ARMOR_CAP, c.armor / (c.armor + W.Config.ARMOR_DENOM + 85 * c.lvl));
      return {
        dps: (c.atkMin + c.atkMax) / 2 * c.hit * (1 + c.crit * (W.Config.CRIT_MULT + (c.critMult || 0) - 1)),
        ehp: c.hpMax / ((1 - dr) * (1 - c.dodge)),
        sp: c.spellPower,
      };
    };
    const a = m(mk(null)), b = m(mk(it.id));
    return 0.4 * (b.dps / a.dps) + 0.4 * (b.ehp / a.ehp) + 0.2 * (b.sp / a.sp);
  }
  const groups = {};
  for (const it of gears) {
    const k = `${it.slot}|${it.quality}|${lineOf(it)}`;
    (groups[k] = groups[k] || []).push(it);
  }
  const collapsed = [];
  for (const [k, list] of Object.entries(groups)) {
    if (list.length < 2) continue;
    const powered = list.map((it) => ({ it, p: powerOf(it) })).sort((x, y) => x.it.level - y.it.level);
    let best = null;
    for (const r of powered) {
      if (best && r.p < best.p * 0.85) collapsed.push(`${k}: lv${r.it.level} ${r.it.id}(p=${r.p.toFixed(2)}) 弱于 lv${best.it.level} ${best.it.id}(p=${best.p.toFixed(2)})`);
      if (!best || r.p > best.p) best = r;
    }
  }
  check('装备战力不随等级回落(引擎口径 85% 线)', collapsed.length === 0, collapsed.slice(0, 5).join(' | '));

  // 4) 品质属性预算:每件可穿戴装备的属性点预算必须落在「槽位基准线 × 品质乘子」的带宽内。
  //    护甲权重压低(独立减伤轴,板/布差异大),武器另由伤害曲线与引擎战力规则把关,不参与本规则。
  //    没有这条规则时,品质只是颜色:蓝装与紫装属性几乎无差、橙装反被高等级蓝装比下去。
  const WT = { str: 1, agi: 1, int: 1, spi: 0.55, stam: 1.5, armor: 0.05, crit: 55, dodge: 50, hit: 55, lifesteal: 65, hp: 0.06, mp5: 2, dmg: 1.1 };
  const SLOT_FIT = { weapon: [9.66, 1.727], offhand: [0.47, 0.296], head: [2.71, 0.275], chest: [5.85, 0.364], gloves: [-1.94, 0.377], legs: [1.50, 0.375], boots: [0.99, 0.265], cloak: [1.89, 0.190], neck: [2.37, 0.212], ring: [1.18, 0.268], trinket: [0.07, 0.302] };
  const QB = { white: 0.75, green: 1.0, blue: 1.15, epic: 1.40, purple: 1.40, legendary: 2.0 };
  const MINLV = 10, LOB = 0.6, HIB = 1.4;
  const gearBudget = (it) => {
    const s = it.stats || {}; let p = 0;
    for (const k in s) { const v = s[k]; if (k === 'dmg') p += ((v[0] + v[1]) / 2) * WT.dmg; else if (WT[k] != null) p += v * WT[k]; }
    return p;
  };
  const offBudget = [];
  for (const it of gears) {
    if (it.slot === 'weapon' || it.level < MINLV) continue;
    const fit = SLOT_FIT[it.slot]; if (!fit) continue;
    const base = Math.max(5, fit[0] + fit[1] * it.level);
    const r = gearBudget(it) / base / (QB[it.quality] || 1);
    if (r < LOB || r > HIB) offBudget.push(`${it.id}(lv${it.level} ${it.quality} 预算比 ${r.toFixed(2)})`);
  }
  check('装备属性符合品质预算带(±40%)', offBudget.length === 0, offBudget.slice(0, 6).join(' | '));

  // 5) 传说领先同槽位同线史诗:属性预算 ≥ 1.25× 该槽位同线最强史诗/史诗紫装
  const lowLegend = [];
  for (const it of gears.filter((g) => g.quality === 'legendary')) {
    const line = lineOf(it);
    const peers = gears.filter((x) => x.slot === it.slot && lineOf(x) === line && (x.quality === 'epic' || x.quality === 'purple') && x.level >= 50);
    if (!peers.length) continue;
    const best = peers.reduce((a, b) => (gearBudget(a) >= gearBudget(b) ? a : b));
    const ratio = gearBudget(it) / Math.max(1, gearBudget(best));
    if (ratio < 1.25) lowLegend.push(`${it.id} 仅 ${ratio.toFixed(2)}× ${best.id}`);
  }
  check('传说属性预算领先同线史诗(≥1.25×)', lowLegend.length === 0, lowLegend.join(' | '));

  // 6) 传说武器引擎战力领先同线最强非传说武器(橙色必须真的『更强』,而非只是颜色不同)
  const weakLegend = [];
  for (const it of gears.filter((g) => g.quality === 'legendary' && g.slot === 'weapon')) {
    const line = lineOf(it);
    const peers = gears.filter((x) => x.slot === 'weapon' && lineOf(x) === line && x.quality !== 'legendary');
    if (!peers.length) continue;
    const best = peers.reduce((a, b) => (powerOf(a) >= powerOf(b) ? a : b));
    const ratio = powerOf(it) / powerOf(best);
    if (ratio < 1.20) weakLegend.push(`${it.id} 仅 ${ratio.toFixed(2)}× ${best.id}`);
  }
  check('传说武器引擎战力领先同线(≥1.20×)', weakLegend.length === 0, weakLegend.join(' | '));
}

/* ---------- 槽位覆盖 ----------
 * 「有装备数据」不等于「玩家换得到」:某个槽位在某段等级里没有可获取装备,
 * 玩家就只能长期穿着旧装(如历史上 43-58 级无头盔、35-39 级无物理武器)。
 * 这里按槽位逐段查:从该槽位首件装备出现的等级段起,每 5 级段至少 1 件可获取装备。 */
{
  const SLOT_LABELS = { head: '头盔', chest: '胸甲', gloves: '手套', legs: '护腿', boots: '靴子', cloak: '披风', neck: '项链', ring: '戒指', trinket: '饰品', offhand: '副手' };
  const reachable = new Set();
  for (const z of Object.values(D.ZONES)) for (const i of z.shop || []) reachable.add(i);
  for (const list of Object.values(D.DROPS)) for (const e of list) reachable.add(e[0]);
  for (const q of Object.values(D.QUESTS)) for (const i of q.rewardItems || []) reachable.add(i);
  for (const r of Object.values(Object.assign({}, D.SYNTH, D.CRAFTS))) if (r.item) reachable.add(r.item);
  for (const a of Object.values(D.ACHIEVEMENTS)) for (const i of (a.reward && a.reward.items) || []) reachable.add(i);
  for (const it of Object.values(D.ITEMS)) if (it.rep) reachable.add(it.id);

  const slotGaps = [];
  for (const slot in SLOT_LABELS) {
    const list = Object.values(D.ITEMS).filter((it) => it.slot === slot && reachable.has(it.id));
    if (!list.length) { slotGaps.push(`${SLOT_LABELS[slot]} 无任何可获取装备`); continue; }
    const first = Math.min.apply(null, list.map((it) => it.level));
    for (let lo = 1; lo <= W.Config.LEVEL_CAP; lo += 5) {
      const hi = lo + 4;
      if (hi < first) continue; // 首件装备出现前不算空档
      if (!list.some((it) => it.level >= lo && it.level <= hi)) slotGaps.push(`${SLOT_LABELS[slot]} ${lo}-${hi}`);
    }
  }
  check('各槽位每个 5 级段都有可获取装备', slotGaps.length === 0, slotGaps.join(' | '));
}

/* ---------- 武器伤害曲线 ----------
 * 武器是唯一「换装即换输出」的槽位,曲线断了就是某些等级段没武器可换:
 * 物理线好找,法系线历史上曾有 31-55 级空档、46→56 级伤害一夜翻 2.7 倍。
 * 这里用纯数据规则盯三件事:分线 5 级段覆盖 / 累计最优曲线不断崖 / 同档武器伤害不悬殊。 */
{
  const weapons = Object.values(D.ITEMS).filter((it) => it.slot === 'weapon' && it.stats && it.stats.dmg);
  const avgDmg = (it) => (it.stats.dmg[0] + it.stats.dmg[1]) / 2;
  const wLine = (it) => ((it.stats.int || 0) > 0 && !(it.stats.str || 0) && !(it.stats.agi || 0) ? '法系' : '物理');

  // 1) 分线每 5 级段至少一件可换武器(1-5 段法系与物理共用初始木棍,不要求)
  const bandGaps = [];
  for (let lo = 1; lo <= W.Config.LEVEL_CAP; lo += 5) {
    const hi = lo + 4;
    for (const l of ['物理', '法系']) {
      if (lo === 1 && l === '法系') continue;
      if (!weapons.some((it) => wLine(it) === l && it.level >= lo && it.level <= hi)) bandGaps.push(`${lo}-${hi} 段无${l}武器`);
    }
  }
  check('武器分线每 5 级段都有可换装备', bandGaps.length === 0, bandGaps.join(' | '));

  // 2) 累计最优伤害曲线无断崖:10 级后单级涨幅不得超过 60%(跳档不能靠一两件武器硬拉)
  const cliffs = [];
  for (const l of ['物理', '法系']) {
    let prev = null;
    for (let lv = 10; lv <= W.Config.LEVEL_CAP; lv++) {
      const pool = weapons.filter((it) => wLine(it) === l && it.level <= lv);
      if (!pool.length) continue;
      const best = pool.reduce((a, b) => (avgDmg(a) >= avgDmg(b) ? a : b));
      if (prev && avgDmg(best) > avgDmg(prev) * 1.6) cliffs.push(`${l}线 ${lv} 级 ${avgDmg(prev)}→${avgDmg(best)}(${best.id})`);
      prev = best;
    }
  }
  check('武器伤害曲线无断崖(单级涨幅 ≤ 60%)', cliffs.length === 0, cliffs.join(' | '));

  // 3) 同等级+同品质+同线的武器伤害差距不得超 1.3 倍(否则同档里一件被另一件彻底碾碎)
  const wGroups = {};
  for (const it of weapons) { const k = `${it.level} 级 ${it.quality} ${wLine(it)}`; (wGroups[k] = wGroups[k] || []).push(it); }
  const lopsided = [];
  for (const [k, list] of Object.entries(wGroups)) {
    if (list.length < 2) continue;
    const vals = list.map(avgDmg);
    const ratio = Math.max.apply(null, vals) / Math.min.apply(null, vals);
    if (ratio > 1.3) lopsided.push(`${k}: ${list.map((it) => `${it.id}=${avgDmg(it)}`).join(' , ')}`);
  }
  check('同档武器伤害不悬殊(极差 ≤ 1.3×)', lopsided.length === 0, lopsided.join(' | '));

  // 4) 法系属性不倒退:新法杖的智力/精神换算价值(与引擎口径一致:智力×1.25 + 精神×0.4)
  //    不得低于此前已出现过的最强法杖的 90%——否则 56 级副本法杖法强反而输 53 级商店货
  const casterValue = (it) => (it.stats.int || 0) * 1.25 + (it.stats.spi || 0) * 0.4;
  const casterDrop = [];
  let bestCaster = null;
  for (const it of weapons.filter((w) => wLine(w) === '法系').sort((a, b) => a.level - b.level)) {
    const v = casterValue(it);
    if (bestCaster && v < bestCaster.v * 0.9) casterDrop.push(`lv${it.level} ${it.id}(价值 ${v.toFixed(1)}) 低于 lv${bestCaster.it.level} ${bestCaster.it.id}(价值 ${bestCaster.v.toFixed(1)})`);
    if (!bestCaster || v > bestCaster.v) bestCaster = { it, v };
  }
  check('法系武器属性不倒退(法强价值 90% 线)', casterDrop.length === 0, casterDrop.join(' | '));
}

/* ---------- 附魔 / 合成 / 打造 ---------- */
{
  const SLOTS = new Set(['weapon', 'offhand', 'head', 'chest', 'gloves', 'legs', 'boots', 'cloak',
    'neck', 'ring', 'trinket', 'ring1', 'ring2', 'trinket1', 'trinket2']);
  const badEnchantSlot = Object.values(D.ENCHANTS)
    .filter((e) => (e.slots || []).some((s) => !SLOTS.has(s))).map((e) => `${e.id}:${e.slots.join('/')}`);
  check('附魔适用槽位合法', badEnchantSlot.length === 0, badEnchantSlot.join(','));

  const badMats = [];
  for (const e of Object.values(D.ENCHANTS)) for (const m of Object.keys(e.mats || {})) if (!D.ITEMS[m]) badMats.push(`${e.id}→${m}`);
  for (const [rid, r] of Object.entries(Object.assign({}, D.SYNTH, D.CRAFTS))) {
    for (const m of Object.keys(r.mats || {})) if (!D.ITEMS[m]) badMats.push(`${rid}→${m}`);
    if (r.item && !D.ITEMS[r.item]) badMats.push(`${rid} 产物 ${r.item} 不存在`);
  }
  check('附魔/合成/打造的材料与产物都存在', badMats.length === 0, badMats.join(','));
}

/* ---------- 任务 / 成就 ---------- */
{
  const badQuestTarget = Object.values(D.QUESTS).filter((q) => !D.MONSTERS[q.target]).map((q) => q.id);
  check('任务目标怪物存在', badQuestTarget.length === 0, badQuestTarget.join(','));

  const badQuestItem = [];
  const unwired = [];
  for (const q of Object.values(D.QUESTS)) {
    for (const i of q.rewardItems || []) if (!D.ITEMS[i]) badQuestItem.push(`${q.id}→${i}`);
    if (!(D.ZONES[q.zone] && (D.ZONES[q.zone].quests || []).includes(q.id))) unwired.push(`${q.id}@${q.zone}`);
  }
  check('任务奖励物品存在', badQuestItem.length === 0, badQuestItem.join(','));
  check(`全部任务接入区域任务板(${Object.keys(D.QUESTS).length} 个)`, unwired.length === 0, unwired.join(','));

  const badAchItem = Object.values(D.ACHIEVEMENTS)
    .flatMap((a) => ((a.reward && a.reward.items) || []).filter((i) => !D.ITEMS[i]).map((i) => `${a.id}→${i}`));
  check('成就奖励物品存在', badAchItem.length === 0, badAchItem.join(','));

  const badAchTarget = Object.values(D.ACHIEVEMENTS)
    .filter((a) => a.target && a.type === 'dungeon' && !D.DUNGEONS[a.target]).map((a) => `${a.id}→${a.target}`);
  check('成就副本目标存在', badAchTarget.length === 0, badAchTarget.join(','));

  // 成就 type 必须有触发点(character.js 或 combat.js 里出现过该 type 字面量)
  const noTrigger = [...new Set(Object.values(D.ACHIEVEMENTS).map((a) => a.type).filter(Boolean))]
    .filter((t) => !hasWord(SRC_ENGINE, t));
  check('成就类型都有触发点', noTrigger.length === 0, noTrigger.join(','));
}

/* ---------- 消耗品效果 ---------- */
{
  const keySet = new Set();
  for (const it of Object.values(D.ITEMS)) {
    for (const k of Object.keys(it.consumable || {})) keySet.add(k);
    for (const k of Object.keys(it.scroll || {})) keySet.add(k);
    for (const k of Object.keys(it.poison || {})) keySet.add(k);
  }
  const unimpl = [...keySet].filter((k) => !hasWord(SRC_ALL, k));
  check('消耗品/卷轴/毒药效果都有实现', unimpl.length === 0, unimpl.join(','));
}

console.log('');
if (failed) {
  console.error(`❌ 数据交叉引用审计未通过: ${failed} 项失败`);
  console.error('   这通常意味着新增了数据但没有接进游戏(掉落/任务板/遭遇表/习得途径……)。');
  process.exit(1);
}
console.log('✅ 数据交叉引用审计全部通过');
