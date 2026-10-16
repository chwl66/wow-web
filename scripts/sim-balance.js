/* 魔兽世界 · 战大陆 — 平衡模拟(node scripts/sim-balance.js)
 * 对每个职业在各等级段跑批量战斗,统计「各职业通关率」,用于校验被动体系调整后的难度。
 * 用法: node scripts/sim-balance.js [每档对局数] */
'use strict';
const fs = require('fs');
const path = require('path');

// ---- 浏览器环境桩(与 test-headless.js 保持一致) ----
global.window = global;
global.localStorage = { _d: {}, getItem(k) { return this._d[k] || null; }, setItem(k, v) { this._d[k] = String(v); }, removeItem(k) { delete this._d[k]; } };
global.document = {
  addEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; },
  createElement() { return { classList: { add() {}, remove() {} }, style: {}, appendChild() {}, remove() {} }; },
  body: { appendChild() {} },
};

const files = ['ns.js', 'data-races.js', 'data-world.js', 'data-talents.js', 'engine.js', 'character.js', 'combat.js', 'world.js'];
for (const f of files) {
  const code = fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8');
  (new Function(code))();
}

const W = global.WOW;
const D = W.Data;
const U = W.Utils;
U.delay = () => Promise.resolve();
// 允许通过环境变量试算不同难度系数(不改变默认配置);非法输入忽略,避免把配置改成 NaN
const envNum = (name) => {
  const v = parseFloat(process.env[name]);
  return Number.isFinite(v) && v > 0 ? v : null;
};
const monHp = envNum('MON_HP'); if (monHp != null) W.Config.MONSTER_HP_MULT = monHp;
const monAtk = envNum('MON_ATK'); if (monAtk != null) W.Config.MONSTER_ATK_MULT = monAtk;

// 每档对局数:取第一个纯数字参数(允许 `--noge 500` 这类顺序,不再只看 argv[2])
const trialsArg = process.argv.slice(2).find((a) => /^\d+$/.test(a));
const TRIALS = Math.max(1, parseInt(trialsArg, 10) || 120);
const LEVELS = [10, 20, 35, 50, 60];
const SLOTS = ['weapon', 'offhand', 'head', 'chest', 'gloves', 'legs', 'boots', 'cloak', 'neck', 'ring1', 'ring2', 'trinket1', 'trinket2'];
const GEAR_SLOT_OF = { weapon: 'weapon', offhand: 'offhand', head: 'head', chest: 'chest', gloves: 'gloves', legs: 'legs', boots: 'boots', cloak: 'cloak', neck: 'neck', ring: 'ring1', trinket: 'trinket1' };

// 按等级挑选该槽位最优装备(等级≤L,优先高等级/高品质)
const ITEM_SCORE_QUAL = { gray: 0, white: 1, green: 2, blue: 3, epic: 4, purple: 4, legendary: 5, orange: 5 };
const bySlot = {};
for (const it of Object.values(D.ITEMS)) {
  if (!it || !it.slot) continue;
  (bySlot[it.slot] = bySlot[it.slot] || []).push(it);
}
function bestGear(level) {
  const eq = {};
  const pick = (slot, want) => {
    const list = (bySlot[want] || []).filter((it) => it.level <= level && !it.consumable);
    if (!list.length) return null;
    list.sort((a, b) => (b.level - a.level) || ((ITEM_SCORE_QUAL[b.quality] || 0) - (ITEM_SCORE_QUAL[a.quality] || 0)));
    return list[0].id;
  };
  for (const s of ['weapon', 'offhand', 'head', 'chest', 'gloves', 'legs', 'boots', 'cloak', 'neck']) { const id = pick(s, s); if (id) eq[s] = id; }
  const r = pick('ring', 'ring'); if (r) { eq.ring1 = r; eq.ring2 = r; }
  const t = pick('trinket', 'trinket'); if (t) { eq.trinket1 = t; eq.trinket2 = t; }
  return eq;
}

// 组一个「等级内合理养成」的角色:满装 + 推荐天赋 + 全部已解锁职业技能
const GEARED = !process.argv.includes('--noge');
function makeChar(raceId, clsId, level) {
  const char = W.Char.create('模拟', raceId, clsId);
  char.level = level;
  if (GEARED) char.equipment = bestGear(level);
  const builds = (D.TALENT_BUILDS && D.TALENT_BUILDS[clsId]) || [];
  for (const bd of builds) W.Char.applyBuild(char, bd);
  for (const sid of D.CLASSES[clsId].skills) {
    const s = D.SKILLS[sid];
    if (s && s.learn <= level && !char.learnedSkills.includes(sid)) char.learnedSkills.push(sid);
  }
  return char;
}

function healSkill(p, hpRatio) {
  if (hpRatio > 0.5) return null;
  return p.learned.map((id) => D.SKILLS[id]).filter((s) => s && !s.passive && W.Combat.canUse(s, p) && (s.heal || s.hot))[0] || null;
}
// 挑伤害期望最高的技能;已有同类 DOT 在身则不再重复上毒(避免 AI 无脑刷 DOT)
function dmgSkill(p, target) {
  const dots = (target && target.dots ? target.dots : []).map((d) => d.key);
  return p.learned.map((id) => D.SKILLS[id])
    .filter((s) => s && !s.passive && W.Combat.canUse(s, p) && (s.dmg || s.dot))
    .filter((s) => !(s.dot && !s.dmg && s.dot && dots.includes(s.id)))
    .sort((a, b) => est(a, p) - est(b, p)).pop() || null;
}
function est(s, p) {
  let v = 0;
  if (s.dmg) v += s.dmg.base + (s.dmg.scale || 0) * (p.spellPower || 0);
  if (s.aoe && (s.dmg || s.dot)) v *= 1.25;
  if (s.dot) v += (s.dot.per + (s.dot.scale || 0) * (p.spellPower || 0)) * (s.dot.rounds || 1) * 0.6;
  return v;
}

async function runBattle(char, monster, opts) {
  const c = W.Char.computed(char);
  char.hp = c.hpMax; char.hpMax = c.hpMax; char.mana = c.manaMax; char.manaMax = c.manaMax;
  char.rage = 0; char.energy = 100; char.combo = 0;
  W.Combat.start(char, [monster], { log: () => {}, float: () => {}, render: () => {}, onEnd: null }, opts || {});
  const b = W.Combat.battle;
  let guard = 0;
  while (!b.ended && guard++ < 120) {
    const p = b.player;
    const h = healSkill(p, p.hp / p.hpMax);
    let action;
    if (h) action = { type: 'skill', skill: h.id, target: 'e0' };
    else {
      const t = b.enemies.find((e) => e.hp > 0) || b.enemies[0];
      const s = dmgSkill(p, t);
      action = s ? { type: 'skill', skill: s.id, target: t.key } : { type: 'attack', target: t.key };
    }
    await W.Combat.playerAction(action);
  }
  return !!b.victory;
}

function pickMonster(level, { boss } = {}) {
  const list = Object.values(D.MONSTERS).filter((m) => (boss ? (m.boss || m.elite) : (!m.boss && !m.elite && !m.world)));
  list.sort((a, b) => Math.abs(a.level - level) - Math.abs(b.level - level));
  return list[0];
}

function firstRaceFor(clsId) {
  for (const r of Object.values(D.RACES)) if (r.classes.includes(clsId)) return r.id;
  return 'human';
}

function bar(rate) {
  const n = Math.round(rate * 20);
  return '█'.repeat(n) + '░'.repeat(20 - n);
}

(async function main() {
  console.log(`平衡模拟: 每档 ${TRIALS} 局 · ${GEARED ? '满装' : '无装备'} + 推荐天赋\n`);
  const classes = Object.keys(D.CLASSES);
  const summary = {};
  for (const level of LEVELS) {
    const m = pickMonster(level);
    console.log(`━━━ Lv.${level} 普通怪: ${m.name}(Lv.${m.level}) hp=${m.hp} atk=${m.atk[0]}-${m.atk[1]} ━━━`);
    for (const cid of classes) {
      const race = firstRaceFor(cid);
      let wins = 0;
      for (let i = 0; i < TRIALS; i++) {
        const ch = makeChar(race, cid, level);
        if (await runBattle(ch, m, {})) wins++;
      }
      const rate = wins / TRIALS;
      (summary[cid] = summary[cid] || []).push(rate);
      console.log(`  ${D.CLASSES[cid].name.padEnd(4)} ${(rate * 100).toFixed(0).padStart(3)}%  ${bar(rate)}`);
    }
  }
  console.log('\n━━━ 副本首领(满装 + 推荐天赋)━━━');
  const bosses = { deadmines: 18, wailing_caverns: 22, blackfathom: 28, gnomergan: 32, uldaman: 45, zulfarrak: 50 };
  for (const [dg, level] of Object.entries(bosses)) {
    const d = D.DUNGEONS[dg];
    if (!d || !d.boss) continue;
    const m = D.MONSTERS[d.boss];
    if (!m) continue;
    const row = [];
    for (const cid of classes) {
      let wins = 0;
      for (let i = 0; i < Math.min(TRIALS, 60); i++) {
        const ch = makeChar(firstRaceFor(cid), cid, level);
        if (await runBattle(ch, m, { isDungeon: true, isBoss: true, context: 'dungeon' })) wins++;
      }
      row.push(`${D.CLASSES[cid].name}:${((wins / Math.min(TRIALS, 60)) * 100).toFixed(0)}%`);
    }
    console.log(`  ${d.name}(推荐 Lv.${level}) ${m.name} → ${row.join('  ')}`);
  }
  // 汇总:各职业平均通关率 + 最差档位
  console.log('\n━━━ 各职业总览 ━━━');
  const rows = classes.map((cid) => {
    const r = summary[cid];
    const avg = r.reduce((s, x) => s + x, 0) / r.length;
    const min = Math.min.apply(null, r);
    return { cid, avg, min, r };
  }).sort((a, b) => a.avg - b.avg);
  for (const row of rows) {
    console.log(`  ${D.CLASSES[row.cid].name.padEnd(4)} 平均 ${(row.avg * 100).toFixed(0).padStart(3)}%  最低 ${(row.min * 100).toFixed(0).padStart(3)}%  [${row.r.map((x) => (x * 100).toFixed(0) + '%').join(' ')}]`);
  }
  const worst = rows[0], best = rows[rows.length - 1];
  console.log(`\n最低:${D.CLASSES[worst.cid].name} ${(worst.avg * 100).toFixed(0)}%  最高:${D.CLASSES[best.cid].name} ${(best.avg * 100).toFixed(0)}%  极差 ${((best.avg - worst.avg) * 100).toFixed(0)} 个百分点`);
})();
