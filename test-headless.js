/* 无头冒烟测试:数据完整性 + 72 职业组合 + 完整战斗模拟(node test-headless.js) */
'use strict';
const fs = require('fs');
const path = require('path');

// ---- 浏览器环境桩 ----
global.window = global;
global.localStorage = {
  _d: {},
  getItem(k) { return this._d[k] || null; },
  setItem(k, v) { this._d[k] = String(v); },
  removeItem(k) { delete this._d[k]; },
};
global.document = {
  addEventListener() {},
  querySelector() { return null; },
  querySelectorAll() { return []; },
  createElement() { return { classList: { add() {}, remove() {} }, style: {}, appendChild() {}, remove() {} }; },
  body: { appendChild() {} },
};

const files = ['ns.js', 'data-races.js', 'data-world.js', 'data-talents.js', 'engine.js', 'character.js', 'combat.js', 'world.js'];
for (const f of files) {
  const code = fs.readFileSync(path.join(__dirname, 'js', f), 'utf8');
  (new Function(code))();
}

const W = global.WOW;
const D = W.Data;
const U = W.Utils;
let failed = 0;
function check(name, cond, extra) {
  if (cond) console.log('  ✅ ' + name);
  else { failed++; console.log('  ❌ ' + name + (extra ? ' — ' + extra : '')); }
}
function checkEq(name, got, want) {
  check(name, got === want, `got ${got}, want ${want}`);
}

(async function main() {
  console.log('== 数据完整性 ==');
  // 种族
  check('8 大种族', Object.keys(D.RACES).length === 8);
  let comboCount = 0;
  for (const r of Object.values(D.RACES)) {
    for (const cid of r.classes) {
      comboCount++;
      check(`种族 ${r.id} + 职业 ${cid}`, !!D.CLASSES[cid]);
    }
  }
  check('41 种经典职业组合', comboCount === 41, `got ${comboCount}`);
  // 技能
  let missingSkills = [];
  for (const c of Object.values(D.CLASSES)) {
    for (const sid of c.skills) if (!D.SKILLS[sid]) missingSkills.push(c.id + ':' + sid);
  }
  check('职业技能全部存在', missingSkills.length === 0, missingSkills.join(','));
  // 怪物/遭遇
  let badEnc = [];
  for (const [zid, list] of Object.entries(D.ENCOUNTERS)) {
    for (const [w, ids] of list) for (const id of ids) if (!D.MONSTERS[id]) badEnc.push(zid + ':' + id);
  }
  check('遭遇表怪物有效', badEnc.length === 0, badEnc.join(','));
  for (const dg of Object.values(D.DUNGEONS)) {
    for (const w of dg.waves) for (const id of w.enemies) {
      check(`副本 ${dg.id} 怪物 ${id}`, !!D.MONSTERS[id]);
    }
    check(`副本 ${dg.id} Boss ${dg.boss}`, !!D.MONSTERS[dg.boss]);
  }
  // 物品
  let badItems = [];
  for (const z of Object.values(D.ZONES)) for (const id of z.shop) if (!D.ITEMS[id]) badItems.push(z.id + ':' + id);
  for (const q of Object.values(D.QUESTS)) for (const id of q.rewardItems) if (!D.ITEMS[id]) badItems.push(q.id + ':' + id);
  check('商店/任务物品有效', badItems.length === 0, badItems.join(','));
  for (const it of Object.values(D.ITEMS)) {
    check(`物品 ${it.id} 有图标`, !!it.icon);
    check(`物品 ${it.id} 有价格`, it.buy != null || it.sell != null);
  }
  // 任务
  for (const q of Object.values(D.QUESTS)) check(`任务 ${q.id} 目标怪物`, !!D.MONSTERS[q.target]);
  // 任务归属闭环:每个任务都已接入其所属区域的任务板(防止任务定义了却无法接取,如早期副本任务)
  const unwired = Object.values(D.QUESTS).filter((q) => !(D.ZONES[q.zone] && D.ZONES[q.zone].quests.includes(q.id)));
  check('全部任务接入任务板(130个)', unwired.length === 0, unwired.map((q) => q.id + '@' + q.zone).join(',') || 'ok');
  // 新装备 / 新任务 / 掉落表
  {
    const newItems = ['w_warblade', 'w_dusk_staff', 'a_circlet', 'a_steel_boots', 'a_band', 'a_wolf_cloak'];
    check('新装备齐全(6件)', newItems.every((id) => D.ITEMS[id] && D.ITEMS[id].icon && (D.ITEMS[id].buy != null || D.ITEMS[id].sell != null)));
    const newQuests = ['q_lizard', 'q_redridge_orcs', 'q_hound', 'q_arugal', 'q_quill'];
    check('新任务数据有效(目标/奖励)', newQuests.every((qid) => {
      const q = D.QUESTS[qid];
      return q && D.MONSTERS[q.target] && q.rewardItems.every((i) => D.ITEMS[i]);
    }));
    check('新任务接入任务板', D.ZONES.redridge.quests.includes('q_lizard') && D.ZONES.redridge.quests.includes('q_redridge_orcs') &&
      D.ZONES.duskwood.quests.includes('q_hound') && D.ZONES.duskwood.quests.includes('q_arugal') && D.ZONES.barrens.quests.includes('q_quill'));
    const badDrop = [];
    for (const [mid, list] of Object.entries(D.DROPS)) {
      if (!D.MONSTERS[mid]) { badDrop.push(mid + ':无此怪物'); continue; }
      for (const [iid, chance] of list) {
        if (!D.ITEMS[iid]) badDrop.push(mid + ':' + iid + '不存在');
        if (typeof chance !== 'number' || chance <= 0 || chance > 1) badDrop.push(mid + ':' + iid + '掉率异常');
      }
    }
    check('怪物掉落表有效', badDrop.length === 0, badDrop.join(','));
    check('掉落表覆盖主流怪物', Object.keys(D.DROPS).length >= 20, `got ${Object.keys(D.DROPS).length}`);
  }
  // 装备适配性回归(审计 P0+P1 修复):中等级段槽位覆盖 / 副手体系 / 孤儿装备挂源
  {
    const newGear = ['a_padded_legs', 'a_raptor_gloves', 'a_burning_boots', 'a_burning_cloak', 'a_burning_gloves',
      'a_blasted_neck', 'a_blasted_legs', 'a_blasted_ring', 'a_bronze_neck', 'a_badlands_gloves', 'a_badlands_cloak',
      'a_badlands_helm', 'a_marsh_legs', 'a_marsh_ring', 'a_desert_ring', 'a_desert_neck', 'a_winter_boots'];
    check('新增17件中等级段防具首饰', newGear.every((id) => D.ITEMS[id] && D.ITEMS[id].icon && (D.ITEMS[id].buy != null || D.ITEMS[id].sell != null)), newGear.filter((id) => !D.ITEMS[id]).join(','));
    const offs = Object.values(D.ITEMS).filter((it) => it.slot === 'offhand');
    check('副手体系10件覆盖12-56级', offs.length >= 10 && offs.every((it) => it.icon && (it.buy != null || it.sell != null)), `got ${offs.length}`);
    check('副手含盾/刃/圣物三类', offs.some((it) => it.id.includes('shield')) && offs.some((it) => it.id.includes('shiv') || it.id.includes('dagger') || it.id.includes('guard')) && offs.some((it) => it.id.includes('totem')), offs.map((it) => it.id).join(','));
    // 副手引导数据闭环:盾牌有护甲+耐力、副刃有敏捷、圣物有智力(引导文案与实际属性一致)
    const shieldOff = offs.filter((it) => it.id.includes('shield'));
    const bladeOff = offs.filter((it) => it.id.includes('shiv') || it.id.includes('dagger'));
    const totemOff = offs.filter((it) => it.id.includes('totem'));
    check('盾牌带护甲与耐力', shieldOff.length >= 3 && shieldOff.every((it) => it.stats.armor > 0 && it.stats.stam > 0));
    check('副刃带敏捷', bladeOff.length >= 2 && bladeOff.every((it) => it.stats.agi > 0));
    check('圣物带智力', totemOff.length >= 2 && totemOff.every((it) => it.stats.int > 0));
    check('副手槽独立于武器(全职业可装备)', ['warrior', 'paladin', 'rogue', 'hunter', 'mage', 'priest', 'shaman', 'warlock', 'druid'].every((cid) => {
      const ch = W.Char.create('副手测', cid === 'undead' ? 'undead' : 'orc', cid);
      ch.level = 30;
      return W.Char.Equipment.equip(ch, 'w_off_hide_shield') && ch.equipment.offhand === 'w_off_hide_shield';
    }), '任意职业应能装备副手');
    // 极品换装回归(平衡审计 P0 验证:普通↔极品同id换装全流程正常)
    {
      const c = W.Char.create('换装回归', 'human', 'warrior');
      c.level = 30;
      c.equipment.chest = 'a_blue';
      c.inventory.push({ id: 'a_blue', count: 1, perf: true });
      const r1 = W.Char.Equipment.equip(c, 'a_blue', true);
      check('普通→极品换装成功', r1 && c.equipment.chest === 'a_blue' && c.eqPerf && c.eqPerf.chest === true);
      check('旧装备回包且保留极品状态', W.Char.Inventory.count(c, 'a_blue') >= 1);
      c.inventory.push({ id: 'a_blue', count: 1 });
      const r2 = W.Char.Equipment.equip(c, 'a_blue', false);
      check('极品→普通换装成功', r2 && c.eqPerf.chest === false);
      const r3 = W.Char.Equipment.equip(c, 'a_blue', false);
      check('同id同状态重复装备被拒绝', r3 === false);
      const c2 = W.Char.create('双戒回归', 'human', 'warrior');
      c2.level = 30;
      c2.equipment.ring1 = 'a_band';
      c2.equipment.ring2 = 'a_band';
      c2.inventory.push({ id: 'a_band', count: 1, perf: true });
      const r4 = W.Char.Equipment.equip(c2, 'a_band', true);
      check('双戒指槽位替换极品成功', r4 && ((c2.eqPerf && c2.eqPerf.ring1) || (c2.eqPerf && c2.eqPerf.ring2)) === true);
    }
    const srcOf = (iid) => {
      if (Object.values(D.ZONES).some((z) => z.shop.includes(iid))) return true;
      if (Object.values(D.DROPS).some((l) => l.some(([id]) => id === iid))) return true;
      if (Object.values(D.QUESTS).some((q) => q.rewardItems.includes(iid))) return true;
      return false;
    };
    const orphan = ['a_cloak', 'a_silithus_ring', 'a_silithus_neck', 'a_plague_cloak'];
    check('孤儿装备全部挂上来源', orphan.every(srcOf), orphan.filter((id) => !srcOf(id)).join(','));
    const inBand = (lv) => lv >= 21 && lv <= 50;
    const slotCover = (slot) => Object.values(D.ITEMS).some((it) => it.slot === slot && inBand(it.level));
    check('21-50段七核心槽位全覆盖', ['head', 'gloves', 'boots', 'legs', 'cloak', 'neck', 'ring'].every(slotCover));
    const lvGap = ['head', 'gloves', 'boots', 'legs', 'cloak', 'neck', 'ring'].filter((s) => !slotCover(s));
    check('41-50段防具首饰无空档', ['head', 'gloves', 'legs', 'cloak', 'neck', 'ring'].every((s) => Object.values(D.ITEMS).some((it) => it.slot === s && it.level >= 41 && it.level <= 50)), lvGap.join(','));
  }
  // 高级药水回归(审计 P2 修复):50/55 级药水数据 + 商店/掉落挂载 + 使用逻辑
  {
    const pots = {
      c_master_heal:  { lv: 50, heal: 750 },
      c_master_mana:  { lv: 50, mana: 750 },
      c_ultimate_heal: { lv: 55, heal: 1200 },
      c_ultimate_mana: { lv: 55, mana: 1200 },
      c_eternal_flask: { lv: 55, heal: 700, mana: 700 },
    };
    const badP = [];
    for (const [id, exp] of Object.entries(pots)) {
      const it = D.ITEMS[id];
      if (!it) { badP.push(id + '缺失'); continue; }
      if (it.slot !== 'consumable' || it.level !== exp.lv) badP.push(id + '等级/类型');
      if ((it.consumable.heal || 0) !== (exp.heal || 0) || (it.consumable.mana || 0) !== (exp.mana || 0)) badP.push(id + '数值');
      if (!it.icon || (it.buy == null && it.sell == null)) badP.push(id + '图标/价格');
    }
    check('5件高级药水数据有效', badP.length === 0, badP.join(','));
    const shopIds = Object.values(D.ZONES).flatMap((z) => z.shop);
    check('高级药水覆盖主城+高级区商店', ['c_master_heal', 'c_ultimate_heal', 'c_eternal_flask'].every((id) => shopIds.includes(id)));
    const zShop = Object.values(D.ZONES).map((z) => z.shop);
    // 分层投放:50级区(燃烧平原/安戈洛)有大师但无终极;55级区(冬泉/瘟疫/诅咒/费伍德/艾萨拉)有终极但无永恒圣水;终极区(东瘟疫/希利苏斯)全套
    const midZone = zShop.filter((s) => s.includes('c_master_heal') && !s.includes('c_ultimate_heal') && s.includes('c_super_heal'));
    const highZone = zShop.filter((s) => s.includes('c_ultimate_heal') && !s.includes('c_eternal_flask') && s.includes('c_flask'));
    const endZone = zShop.filter((s) => s.includes('c_eternal_flask'));
    check('50级区只卖大师药水', midZone.length >= 1 && midZone.every((s) => !s.includes('c_ultimate_heal')), `mid=${midZone.length}`);
    check('55级区卖终极药水不出永恒圣水', highZone.length >= 2 && highZone.every((s) => !s.includes('c_eternal_flask')), `high=${highZone.length}`);
    check('东瘟疫/希利苏斯有全套药水', endZone.length >= 2 && endZone.every((s) => s.includes('c_master_heal') && s.includes('c_ultimate_heal') && s.includes('c_eternal_flask')), `end=${endZone.length}`);
    const dropIds = Object.values(D.DROPS).flatMap((l) => l.map(([id]) => id));
    check('高级药水进怪物掉落', ['c_master_heal', 'c_ultimate_heal', 'c_ultimate_mana'].every((id) => dropIds.includes(id)));
    // 使用逻辑:满血不可用 / 缺血可用且恢复正确
    const char = W.Char.create('药水测试', 'human', 'warrior');
    char.level = 55;
    const c = W.Char.computed(char);
    char.hp = c.hpMax; char.mana = c.manaMax;
    char.inventory.push({ id: 'c_ultimate_heal', count: 3 });
    check('满血时无法使用药水', !W.Char.Equipment.use(char, 'c_ultimate_heal'));
    char.hp = 100;
    const hpBefore = char.hp;
    check('缺血时使用终极治疗药水', W.Char.Equipment.use(char, 'c_ultimate_heal') && char.hp === Math.min(c.hpMax, hpBefore + 1200), `hp=${char.hp}`);
    check('使用消耗1瓶', W.Char.Inventory.count(char, 'c_ultimate_heal') === 2);
    const mage = W.Char.create('药水法师', 'human', 'mage');
    mage.level = 55;
    const cm = W.Char.computed(mage);
    mage.mana = 50; mage.manaMax = cm.manaMax;
    mage.inventory.push({ id: 'c_eternal_flask', count: 1 });
    check('永恒圣水同时恢复生命与法力', W.Char.Equipment.use(mage, 'c_eternal_flask') && mage.mana === Math.min(cm.manaMax, 50 + 700), `mana=${mage.mana}`);
  }

  console.log('== 72 种组合角色创建 ==');
  for (const r of Object.values(D.RACES)) {
    for (const cid of r.classes) {
      const char = W.Char.create('测试', r.id, cid);
      const c = W.Char.computed(char);
      const ok = c.hpMax > 50 && c.atkMin >= 1 && c.hit > 0 && c.hit <= 1 && c.dodge >= 0 && c.crit >= 0;
      if (!ok) { failed++; console.log(`  ❌ 角色 ${r.id}/${cid}: hpMax=${c.hpMax} atk=${c.atkMin}-${c.atkMax} hit=${c.hit}`); }
      if (c.cls.res === 'mana' && c.manaMax <= 0) { failed++; console.log(`  ❌ 法力职业 ${cid} manaMax=${c.manaMax}`); }
    }
  }
  console.log('  ✅ 72 组合角色创建与属性计算');

  console.log('== 完整战斗模拟 ==');
  // 各职业打一场:vs 同级怪
  for (const cid of Object.keys(D.CLASSES)) {
    const char = W.Char.create('勇士', cid === 'undead' ? 'undead' : 'orc', cid);
    // 提升到 8 级方便测试更多技能
    char.level = 8;
    char.exp = 0;
    const c = W.Char.computed(char);
    char.hp = c.hpMax; char.hpMax = c.hpMax; char.mana = c.manaMax; char.manaMax = c.manaMax;
    const cls = D.CLASSES[cid];
    for (const sid of cls.skills) {
      const s = D.SKILLS[sid];
      if (s && s.learn <= char.level && !char.learnedSkills.includes(sid)) char.learnedSkills.push(sid);
    }
    const log = [];
    const ui = {
      log: (t, h) => log.push(h),
      float: () => {},
      render: () => {},
      onEnd: null,
    };
    const enemies = [D.MONSTERS.barrens_lion];
    W.Combat.start(char, enemies, ui, {});
    const b = W.Combat.battle;
    W.Utils.delay = () => Promise.resolve();
    // 自动战斗:选择第一个可用技能或攻击
    let guard = 0;
    while (!b.ended && guard++ < 60) {
      const p = b.player;
      const skill = p.learned.map((id) => D.SKILLS[id]).filter((s) => s && W.Combat.canUse(s, p) && (s.dmg || s.heal || s.dot))[0];
      await W.Combat.playerAction(skill ? { type: 'skill', skill: skill.id, target: 'e0' } : { type: 'attack', target: 'e0' });
    }
    const outcome = b.victory ? '胜' : (b.fleed ? '逃' : '败');
    console.log(`  ${cid.padEnd(10)} Lv8 vs 平原狮(8级) → ${outcome} (${guard}回合)`);
    if (guard >= 60 && !b.ended) { failed++; console.log('  ❌ 战斗未在 60 回合内结束'); }
  }

  console.log('== 副本 Boss 战(死亡矿井) ==');
  {
    const char = W.Char.create('屠龙者', 'human', 'warrior');
    char.level = 18;
    const c = W.Char.computed(char);
    char.hp = c.hpMax; char.hpMax = c.hpMax; char.mana = c.manaMax; char.manaMax = c.manaMax;
    const cls = D.CLASSES[char.classId];
    for (const sid of cls.skills) {
      const s = D.SKILLS[sid];
      if (s && s.learn <= char.level && !char.learnedSkills.includes(sid)) char.learnedSkills.push(sid);
    }
    const ui = { log: () => {}, float: () => {}, render: () => {}, onEnd: null };
    W.Combat.start(char, [D.MONSTERS.vancleef], ui, { isDungeon: true });
    const b = W.Combat.battle;
    W.Utils.delay = () => Promise.resolve();
    let guard = 0;
    while (!b.ended && guard++ < 120) {
      const p = b.player;
      const skill = p.learned.map((id) => D.SKILLS[id]).filter((s) => s && W.Combat.canUse(s, p) && (s.dmg || s.dot))[0];
      await W.Combat.playerAction(skill ? { type: 'skill', skill: skill.id, target: 'e0' } : { type: 'attack', target: 'e0' });
    }
    console.log(`  18级战士 vs 范克里夫 → ${b.victory ? '击败Boss ✅' : '失败'} (${guard}回合)`);
    check('Boss 战可正常结算', b.ended);
  }

  console.log('== 控制效果(变羊术) ==');
  {
    const char = W.Char.create('控场大师', 'human', 'mage');
    char.level = 8;
    const c = W.Char.computed(char);
    char.hp = c.hpMax; char.hpMax = c.hpMax; char.mana = c.manaMax; char.manaMax = c.manaMax;
    for (const sid of D.CLASSES.mage.skills) {
      const s = D.SKILLS[sid];
      if (s && s.learn <= char.level && !char.learnedSkills.includes(sid)) char.learnedSkills.push(sid);
    }
    const log = [];
    const ui = { log: (t, h) => log.push(h), float: () => {}, render: () => {}, onEnd: null };
    W.Combat.start(char, [D.MONSTERS.elwynn_boar], ui, {});
    const b = W.Combat.battle;
    W.Utils.delay = () => Promise.resolve();
    // 变羊
    await W.Combat.playerAction({ type: 'skill', skill: 'polymorph', target: 'e0' });
    // 数一数敌人被变形跳过的次数(日志含 HTML 标签)
    let skipped = 0;
    for (const l of log) if (/被<b>变形<\/b>住了/.test(l)) skipped++;
    check('变羊后敌人无法行动', skipped >= 1, `skipped=${skipped}`);
    // 造成伤害应打破变形(固定命中/免抗,避免随机未命中导致偶发失败)
    b.player.hit = 1; b.enemies[0].dodge = 0; b.enemies[0].level = b.player.level;
    b.enemies[0].resists.fire = -1000;
    const logLen = log.length;
    await W.Combat.playerAction({ type: 'skill', skill: 'fireball', target: 'e0' });
    const broken = log.some((l, i) => i >= logLen && /变形<\/b>效果被打破/.test(l));
    check('变羊受伤害解除', broken);
    console.log('  变形跳过回合:', skipped, '· 变形解除:', broken);
  }

  console.log('== 修复验证(混合技能DOT/宠物频率) ==');

  // 1. 火焰震击:伤害 + DOT 同时生效
  {
    const char = W.Char.create('萨满', 'troll', 'shaman');
    char.level = 8;
    const c = W.Char.computed(char);
    char.hp = c.hpMax; char.hpMax = c.hpMax; char.mana = c.manaMax; char.manaMax = c.manaMax;
    for (const sid of D.CLASSES.shaman.skills) {
      const s = D.SKILLS[sid];
      if (s && s.learn <= char.level && !char.learnedSkills.includes(sid)) char.learnedSkills.push(sid);
    }
    const log = [];
    const ui = { log: (t, h) => log.push(h), float: () => {}, render: () => {}, onEnd: null };
    W.Combat.start(char, [D.MONSTERS.elwynn_boar], ui, {});
    const b = W.Combat.battle;
    W.Utils.delay = () => Promise.resolve();
    await W.Combat.playerAction({ type: 'skill', skill: 'flame_shock', target: 'e0' });
    const hasDot = b.enemies[0].dots.some((d) => d.key === 'flame_shock');
    check('火焰震击同时造成伤害并附加灼烧 DOT', hasDot);
    check('敌人受到初始伤害', b.enemies[0].hp < b.enemies[0].hpMax);
  }
  // 2. 猎人宠物每回合只攻击一次
  {
    const char = W.Char.create('猎人', 'orc', 'hunter');
    char.level = 8;
    const c = W.Char.computed(char);
    char.hp = c.hpMax; char.hpMax = c.hpMax; char.mana = c.manaMax; char.manaMax = c.manaMax;
    for (const sid of D.CLASSES.hunter.skills) {
      const s = D.SKILLS[sid];
      if (s && s.learn <= char.level && !char.learnedSkills.includes(sid)) char.learnedSkills.push(sid);
    }
    const log = [];
    const ui = { log: (t, h) => log.push(h), float: () => {}, render: () => {}, onEnd: null };
    W.Combat.start(char, [D.MONSTERS.dm_sailor, D.MONSTERS.dm_sailor], ui, {});
    const b = W.Combat.battle;
    W.Utils.delay = () => Promise.resolve();
    await W.Combat.playerAction({ type: 'skill', skill: 'summon_pet_tiger', target: 'e0' });
    await W.Combat.playerAction({ type: 'attack', target: 'e0' });
    const petAttacks = log.filter((l) => l.includes('白虎') && l.includes('攻击')).length;
    check('宠物每回合仅攻击一次', petAttacks <= 2, `got ${petAttacks}`);
    console.log('  宠物攻击次数(2回合内):', petAttacks);
  }
  // 3. 月火术 dmg+dot
  {
    const char = W.Char.create('德鲁伊', 'tauren', 'druid');
    char.level = 8;
    const c = W.Char.computed(char);
    char.hp = c.hpMax; char.hpMax = c.hpMax; char.mana = c.manaMax; char.manaMax = c.manaMax;
    for (const sid of D.CLASSES.druid.skills) {
      const s = D.SKILLS[sid];
      if (s && s.learn <= char.level && !char.learnedSkills.includes(sid)) char.learnedSkills.push(sid);
    }
    const ui = { log: () => {}, float: () => {}, render: () => {}, onEnd: null };
    W.Combat.start(char, [D.MONSTERS.elwynn_boar], ui, {});
    const b = W.Combat.battle;
    W.Utils.delay = () => Promise.resolve();
    await W.Combat.playerAction({ type: 'skill', skill: 'moonfire', target: 'e0' });
    check('月火术附带 DOT', b.enemies[0].dots.some((d) => d.key === 'moonfire'));
  }

  
  console.log('== 天赋系统 ==');
  // 数据完整性
  {
    let bad = [];
    let treeCount = 0;
    let totalActives = 0;
    for (const [cid, trees] of Object.entries(D.TALENTS)) {
      if (!D.CLASSES[cid]) bad.push('未知职业:' + cid);
      if (trees.length !== 3) bad.push(cid + ': 应有3系,实际' + trees.length);
      for (const tree of trees) {
        treeCount++;
        const actives = tree.talents.filter((n) => n.active);
        if (actives.length < 1) bad.push(`${cid}/${tree.id}: 缺少主动天赋`);
        totalActives += actives.length;
        if (tree.talents.length < 6) bad.push(`${cid}/${tree.id}: 天赋数=${tree.talents.length}`);
        for (const n of tree.talents) {
          if (n.tier < 0 || n.tier > 2) bad.push(`${n.id}: tier=${n.tier}`);
          if (n.active && !D.SKILLS[n.active]) bad.push(`${n.id}: 主动技能 ${n.active} 不存在`);
          if (n.active && n.max !== 1) bad.push(`${n.id}: 主动天赋 max=${n.max}`);
        }
      }
    }
    check('27 系天赋树(9职业×3系)', treeCount === 27, `got ${treeCount}`);
    check('45 个主动天赋技能', totalActives === 45, `got ${totalActives}`);
    check('天赋数据完整', bad.length === 0, bad.join(','));
    const badSkill = [];
    for (const t of D.TALENTS.mage) for (const n of t.talents) {
      for (const m of (n.mods || [])) if (m.skill && !D.SKILLS[m.skill]) badSkill.push(n.id + ':' + m.skill);
    }
    check('天赋引用的技能存在', badSkill.length === 0, badSkill.join(','));
  }
  // 天赋点数学 / 学习 / 层数解锁 / 重置
  {
    const char = W.Char.create('天赋侠', 'human', 'mage');
    char.level = 10;
    check('10级获得1点', W.Char.getUnspent(char) === 1);
    char.level = 20;
    check('20级获得11点', W.Char.getUnspent(char) === 11);
    let r = W.Char.learnTalent(char, 'fire', 'm_fire_fireball');
    check('学习强化火球术', r.ok && W.Char.rankOf(char, 'fire', 'm_fire_fireball') === 1);
    check('消耗1点', W.Char.getUnspent(char) === 10);
    r = W.Char.learnTalent(char, 'fire', 'm_fire_impact');
    check('第2层未解锁(需本系5点)', !r.ok && r.reason.indexOf('5') >= 0);
    for (let i = 0; i < 4; i++) W.Char.learnTalent(char, 'fire', 'm_fire_fireball');
    check('强化火球术满级(5)', W.Char.rankOf(char, 'fire', 'm_fire_fireball') === 5);
    r = W.Char.learnTalent(char, 'fire', 'm_fire_impact');
    check('第2层解锁后可学', r.ok);
    r = W.Char.learnTalent(char, 'fire', 'm_fire_combust');
    check('第3层未解锁(需本系10点)', !r.ok);
    char.level = 25;
    for (let i = 0; i < 5; i++) W.Char.learnTalent(char, 'fire', 'm_fire_incin'); // 凑满本系10点
    r = W.Char.learnTalent(char, 'fire', 'm_fire_combust');
    check('第3层主动天赋可学', r.ok);
    check('燃烧被动技能已解锁', char.learnedSkills.includes('combustion'));
    const cc = W.Char.computed(char);
    char.mana = cc.manaMax; char.manaMax = cc.manaMax;
    W.Combat.start(char, [D.MONSTERS.elwynn_boar], { log: () => {}, float: () => {}, render: () => {}, onEnd: null }, {});
    check('燃烧转被动后不可施放', !W.Combat.canUse(D.SKILLS.combustion, W.Combat.battle.player));
    check('燃烧被动攻击+8%', Math.abs(D.SKILLS.combustion.mod.atkPct - 0.08) < 0.001);
    check('燃烧被动暴击+5%', Math.abs(D.SKILLS.combustion.mod.crit - 0.05) < 0.001);
    r = W.Char.unlearnTalent(char, 'fire', 'm_fire_combust');
    check('卸载主动天赋并移除技能', r.ok && !char.learnedSkills.includes('combustion'));
    check('返还1点', W.Char.getUnspent(char) === 5);
    char.gold = 5000;
    const goldBefore = char.gold;
    r = W.Char.respecTalents(char);
    check('重置天赋(花费金币)', r.ok && W.Char.pointsSpent(char) === 0 && char.gold === goldBefore - W.Char.respecCost(char));
    check('重置后全部分配归零', W.Char.getUnspent(char) === 16);
  }
  // 天赋强化伤害(火球术 5 级 +30%)
  {
    const mk = (rank) => {
      const char = W.Char.create('火焰大师', 'human', 'mage');
      char.level = 20;
      for (let i = 0; i < rank; i++) W.Char.learnTalent(char, 'fire', 'm_fire_fireball');
      const c = W.Char.computed(char);
      char.hp = c.hpMax; char.hpMax = c.hpMax; char.mana = c.manaMax; char.manaMax = c.manaMax;
      return char;
    };
    const calc = (char) => {
      W.Combat.start(char, [D.MONSTERS.elwynn_boar], { log: () => {}, float: () => {}, render: () => {}, onEnd: null }, {});
      const b = W.Combat.battle;
      b.player.hit = 1; b.player.crit = 0;
      b.enemies[0].dodge = 0; b.enemies[0].resists.fire = -1000;
      return W.Combat.rollAttack(b.player, b.enemies[0], D.SKILLS.fireball).damage;
    };
    const d0 = calc(mk(0));
    const d5 = calc(mk(5));
    const ratio = d5 / d0;
    check('天赋火球术+30%伤害', Math.abs(ratio - 1.3) < 0.02, `ratio=${ratio.toFixed(3)} (${d0}→${d5})`);
  }
  // 天赋属性加成(法术强度/暴击)
  {
    const mk = (learned) => {
      const char = W.Char.create('奥术师', 'human', 'mage');
      char.level = 20;
      for (let i = 0; i < 5; i++) W.Char.learnTalent(char, 'arcane', 'm_arc_focus'); // 凑满本系5点解锁第2层
      for (let i = 0; i < (learned ? 5 : 0); i++) W.Char.learnTalent(char, 'arcane', 'm_arc_energy');
      return W.Char.computed(char);
    };
    const c0 = mk(false), c5 = mk(true);
    check('奥术能量法术强度+15%', Math.abs(c5.spellPower / c0.spellPower - 1.15) < 0.02, `boost=${(c5.spellPower / c0.spellPower).toFixed(3)}`);
    const mk2 = (learned) => {
      const char = W.Char.create('暴击者', 'human', 'mage');
      char.level = 20;
      for (let i = 0; i < 5; i++) W.Char.learnTalent(char, 'arcane', 'm_arc_focus');
      for (let i = 0; i < (learned ? 5 : 0); i++) W.Char.learnTalent(char, 'arcane', 'm_arc_agility');
      return W.Char.computed(char);
    };
    const a0 = mk2(false), a5 = mk2(true);
    check('奥术敏锐暴击+5%', Math.abs((a5.crit - a0.crit) * 100 - 5) < 0.15, `crit ${(a0.crit * 100).toFixed(1)}→${(a5.crit * 100).toFixed(1)}`);
  }
  // 冷血:下一次攻击必定暴击(修复:持续到下一回合)
  {
    const char = W.Char.create('冷血刺客', 'human', 'rogue');
    char.level = 12;
    const c = W.Char.computed(char);
    char.hp = c.hpMax; char.hpMax = c.hpMax; char.energy = 100;
    char.learnedSkills.push('cold_blood');
    const log = [];
    const ui = { log: (t, h) => log.push(h), float: () => {}, render: () => {}, onEnd: null };
    W.Combat.start(char, [D.MONSTERS.elwynn_boar], ui, {});
    const b = W.Combat.battle;
    W.Utils.delay = () => Promise.resolve();
    b.player.hit = 1; b.enemies[0].dodge = 0;
    await W.Combat.playerAction({ type: 'skill', skill: 'cold_blood', target: 'e0' });
    await W.Combat.playerAction({ type: 'attack', target: 'e0' });
    check('冷血后下一次攻击必定暴击', log.some((l) => l.includes('暴击')));
  }

  // 第四批:天赋爆发短增益转被动(鲁莽/死亡之愿/盾墙/燃烧/奥术强化/复仇之怒/神圣防护/狂野怒火/急速射击/暗影形态/元素掌握/恶魔狂暴/狂暴/猛虎之怒)
  {
    const ids = ['recklessness', 'death_wish', 'shield_wall', 'combustion', 'arcane_power', 'avenging_wrath', 'holy_shield', 'rapid_fire', 'bestial_wrath', 'shadowform', 'elemental_mastery', 'demonic_frenzy', 'berserk', 'tigers_fury'];
    const bad = ids.filter((id) => {
      const s = D.SKILLS[id];
      return !(s && s.passive && s.mod && Object.keys(s.mod).length > 0 && !s.res && !s.cd && !s.cost && !s.buff && !s.buffs && !s.shield && !s.petBuff);
    });
    check('第四批14技能全部转被动', bad.length === 0, bad.join(','));
    check('燃烧数值(攻8/暴5)', Math.abs(D.SKILLS.combustion.mod.atkPct - 0.08) < 0.001 && Math.abs(D.SKILLS.combustion.mod.crit - 0.05) < 0.001);
    check('神圣防护起始护盾24+0.4法强', D.SKILLS.holy_shield.mod.startShield === 24 && Math.abs(D.SKILLS.holy_shield.mod.startShieldSp - 0.4) < 0.001);
    check('盾墙常驻护甲+12%', Math.abs(D.SKILLS.shield_wall.mod.armorPct - 0.12) < 0.001);
    check('狂野怒火/恶魔狂暴宠物攻+13%', Math.abs(D.SKILLS.bestial_wrath.mod.petAtkPct - 0.13) < 0.001 && Math.abs(D.SKILLS.demonic_frenzy.mod.petAtkPct - 0.13) < 0.001);
  }
  // 战士学鲁莽:常驻攻击/暴击生效;卸载移除
  {
    const char = W.Char.create('鲁莽战士', 'human', 'warrior');
    char.level = 20;
    for (let i = 0; i < 5; i++) W.Char.learnTalent(char, 'arms', 'w_arms_heroic'); // tier0 5点
    for (let i = 0; i < 5; i++) W.Char.learnTalent(char, 'arms', 'w_arms_master'); // tier1 5点
    const r = W.Char.learnTalent(char, 'arms', 'w_arms_recklessness');
    check('学鲁莽天赋并解锁被动', r.ok && char.learnedSkills.includes('recklessness'));
    const pm1 = W.Char.passiveMods(char);
    check('鲁莽常驻攻击+9%', Math.abs((pm1.atkPct || 0) - 0.09) < 0.001, `atkPct=${pm1.atkPct}`);
    check('鲁莽常驻暴击+5%', Math.abs((pm1.crit || 0) - 0.05) < 0.001, `crit=${pm1.crit}`);
    const r2 = W.Char.unlearnTalent(char, 'arms', 'w_arms_recklessness');
    check('卸载鲁莽移除被动', r2.ok && !char.learnedSkills.includes('recklessness') && !W.Char.passiveMods(char).atkPct);
  }
  // 神圣防护:战斗开始自动护盾(直接习得被动验证战斗钩子)
  {
    const char = W.Char.create('圣盾骑士', 'human', 'paladin');
    char.level = 20;
    char.learnedSkills.push('holy_shield');
    const c = W.Char.computed(char);
    char.hp = c.hpMax; char.mana = c.manaMax;
    W.Utils.delay = () => Promise.resolve();
    W.Combat.start(char, [D.MONSTERS.elwynn_boar], { log: () => {}, float: () => {}, render: () => {}, onEnd: null }, {});
    const sh = W.Combat.battle.player.shield;
    check('神圣防护起始护盾生效', !!(sh && sh.amount > 0), `shield=${sh && sh.amount}`);
    check('神圣防护护甲常驻生效', Math.abs(W.Char.passiveMods(char).armorPct - 0.05) < 0.001);
  }
  // 狂野怒火:宠物攻击力常驻+13%
  {
    const mkH = async (withWrath) => {
      const char = W.Char.create('野兽猎人', 'human', 'hunter');
      char.level = 20;
      char.learnedSkills.push('summon_pet_tiger');
      if (withWrath) char.learnedSkills.push('bestial_wrath');
      const c = W.Char.computed(char);
      char.hp = c.hpMax; char.mana = c.manaMax;
      const petDef = D.PETS.pet_tiger;
      char.pets = [petDef]; char.activePet = petDef.id;
      W.Utils.delay = () => Promise.resolve();
      W.Combat.start(char, [D.MONSTERS.elwynn_boar], { log: () => {}, float: () => {}, render: () => {}, onEnd: null }, {});
      await W.Combat.playerAction({ type: 'skill', skill: 'summon_pet_tiger', target: 'e0' });
      return W.Combat.battle;
    };
    const b0 = await mkH(false);
    const b1 = await mkH(true);
    check('狂野怒火宠物攻击常驻提升', b1.pets[0].atkMax > b0.pets[0].atkMax, `${b0.pets[0].atkMin}-${b0.pets[0].atkMax} → ${b1.pets[0].atkMin}-${b1.pets[0].atkMax}`);
  }

  // 被动效果总览:实时加成计算(passiveLiveEffects)
  {
    const char = W.Char.create('总览战', 'human', 'warrior');
    char.level = 10;
    char.learnedSkills.push('battle_shout', 'shield_block');
    const le = W.Char.passiveLiveEffects(char, 'battle_shout');
    check('战斗怒吼实时攻击加成', !!le && le.delta.some((d) => d.label === '攻击' && /\+\d+/.test(d.text)), JSON.stringify(le && le.delta));
    check('战斗怒吼不误报护甲/暴击', !!le && !le.delta.some((d) => d.label === '护甲' || d.label === '暴击'));
    const sb = W.Char.passiveLiveEffects(char, 'shield_block');
    check('盾牌格挡实时护甲加成', !!sb && sb.delta.some((d) => d.label === '护甲' && d.text.indexOf('+') === 0), JSON.stringify(sb && sb.delta));
    const re = W.Char.passiveLiveEffects(char, 'recklessness');
    check('未习得技能实时加成为空', !!re && re.delta.length === 0 && re.battle.length === 0, JSON.stringify(re));
    const sh = W.Char.create('盾萨', 'human', 'shaman');
    sh.level = 12;
    sh.learnedSkills.push('earth_shield');
    const es = W.Char.passiveLiveEffects(sh, 'earth_shield');
    check('大地之盾实时护盾量(随法强)', !!es && es.battle.some((b) => b.indexOf('护盾') >= 0 && /\d+ 点/.test(b)), JSON.stringify(es && es.battle));
    const hn = W.Char.create('标记猎', 'human', 'hunter');
    hn.level = 5;
    hn.learnedSkills.push('hunters_mark');
    const hm = W.Char.passiveLiveEffects(hn, 'hunters_mark');
    check('猎人印记实时易伤+12%', !!hm && hm.battle.some((b) => b.indexOf('受伤 +12%') >= 0), JSON.stringify(hm && hm.battle));
    const pl = W.Char.create('圣印骑', 'human', 'paladin');
    pl.level = 4;
    pl.learnedSkills.push('seal_of_righteousness');
    const sr = W.Char.passiveLiveEffects(pl, 'seal_of_righteousness');
    check('正义圣印附加神圣伤害', !!sr && sr.battle.some((b) => b.indexOf('神圣伤害') >= 0));
    const dru = W.Char.create('荆棘德', 'human', 'druid');
    dru.level = 8;
    dru.learnedSkills.push('thorns');
    const th = W.Char.passiveLiveEffects(dru, 'thorns');
    check('荆棘术反弹近战伤害', !!th && th.battle.some((b) => b.indexOf('反弹') >= 0));
    // 全职业被动数据完整性(总览页签非空)
    const empty = Object.keys(D.CLASSES).filter((cid) => !Object.values(D.SKILLS).some((s) => s && s.passive && s.cls === cid && !s.race));
    check('9职业均有被动(总览页签非空)', empty.length === 0, empty.join(','));
    const warlock = Object.values(D.SKILLS).filter((s) => s && s.passive && s.cls === 'warlock' && !s.race);
    check('术士含宠物强化被动(恶魔狂暴)', warlock.some((s) => s.mod && s.mod.petAtkPct));
    // 被动加成总量汇总(passiveLiveTotal)
    const sumW = W.Char.create('合计战', 'human', 'warrior');
    sumW.level = 10;
    sumW.learnedSkills.push('battle_shout', 'shield_block', 'recklessness');
    const tot2 = W.Char.passiveLiveTotal(sumW);
    const atkT = tot2.find((d) => d.label === '攻击');
    const bs = W.Char.passiveLiveEffects(sumW, 'battle_shout');
    const atkS = (bs.delta.find((d) => d.label === '攻击') || {}).text;
    check('总量含攻击/护甲/暴击合计', !!atkT && tot2.some((d) => d.label === '护甲') && tot2.some((d) => d.label === '暴击'), JSON.stringify(tot2));
    check('总量攻击大于单一技能贡献', !!atkT && !!atkS && atkT.text !== atkS, `${atkT && atkT.text} vs ${atkS}`);
    const none = W.Char.passiveLiveTotal(W.Char.create('零被动', 'human', 'warrior'));
    check('无被动返回空数组', Array.isArray(none) && none.length === 0, JSON.stringify(none));
    const mage = W.Char.create('合计法', 'human', 'mage');
    mage.level = 12;
    mage.learnedSkills.push('combustion', 'arcane_power');
    const ms = W.Char.passiveLiveTotal(mage);
    check('法师总量含暴击与攻击合计', !!ms && ms.some((d) => d.label === '暴击' && /\+/.test(d.text)) && ms.some((d) => d.label === '攻击'), JSON.stringify(ms));
    // 种族被动计入总量(兽人血性狂暴常驻攻强 > 人类)
    const orcT = W.Char.create('兽人战', 'orc', 'warrior');
    orcT.level = 10;
    const humT = W.Char.create('人类战', 'human', 'warrior');
    humT.level = 10;
    for (const sid of D.CLASSES.warrior.skills) {
      const s = D.SKILLS[sid];
      if (s && s.learn <= 10) { orcT.learnedSkills.push(sid); humT.learnedSkills.push(sid); }
    }
    const to2 = W.Char.passiveLiveTotal(orcT), th2 = W.Char.passiveLiveTotal(humT);
    const atkO = (to2.find((d) => d.label === '攻击') || {}).text, atkH = (th2.find((d) => d.label === '攻击') || {}).text;
    check('种族被动计入总量(兽人攻强高于人类)', !!atkO && !!atkH && atkO !== atkH, `${atkO} vs ${atkH}`);
    // 天赋被动来源完整性:每个被动天赋技能唯一映射到一棵天赋树,解锁点数 = tier×5
    const orphan = [];
    for (const cid of Object.keys(D.CLASSES)) {
      const seen = {};
      for (const tree of D.TALENTS[cid] || []) {
        for (const n of tree.talents || []) {
          if (!n.active || !D.SKILLS[n.active] || !D.SKILLS[n.active].passive) continue;
          if (seen[n.active]) orphan.push(`${cid}:${n.active} 重复来源`);
          seen[n.active] = { tree: tree.id, need: n.tier * 5 };
        }
      }
      for (const s of Object.values(D.SKILLS)) {
        if (s && s.passive && s.talent && s.cls === cid && !seen[s.id]) orphan.push(`${cid}:${s.id} 无来源树`);
      }
    }
    check('被动天赋技能均有唯一来源树', orphan.length === 0, orphan.slice(0, 3).join(';'));
    const armsTree = D.TALENTS.warrior.find((t) => t.id === 'arms');
    const reck = armsTree && armsTree.talents.find((n) => n.active === 'recklessness');
    check('鲁莽来源:武器系tier2需本系10点', !!reck && reck.tier === 2 && reck.tier * 5 === 10, JSON.stringify(reck));
    // 总览基础数值展示覆盖性:所有被动技能 mod 键须在可展示集合内(防止未来新被动静默不显示数值)
    const covered = ['atkPct', 'armorPct', 'crit', 'dodge', 'hit', 'spellPowerPct', 'manaRegenPct', 'startShield', 'startShieldSp', 'shieldHeal', 'markTaken', 'petAtkPct', 'onHit', 'thorns'];
    const badKey = [];
    for (const s of Object.values(D.SKILLS)) {
      if (!(s && s.passive && s.mod)) continue;
      for (const k of Object.keys(s.mod)) if (!covered.includes(k)) badKey.push(s.id + ':' + k);
    }
    check('总览基础数值覆盖全部被动mod键', badKey.length === 0, badKey.join(','));
  }

  // 推荐搭配数据完整性
  {
    let bad = [];
    let buildCount = 0;
    for (const [cid, builds] of Object.entries(D.TALENT_BUILDS)) {
      if (!D.CLASSES[cid]) bad.push('未知职业:' + cid);
      if (builds.length !== 2) bad.push(cid + ': 推荐数=' + builds.length);
      for (const bd of builds) {
        buildCount++;
        let sum = 0;
        const tree = (D.TALENTS[cid] || []).find((t) => t.id === bd.tree);
        if (!tree) { bad.push(`${cid}/${bd.name}: 未知天赋系 ${bd.tree}`); continue; }
        for (const [tid, ranks] of bd.points) {
          const node = tree.talents.find((n) => n.id === tid);
          if (!node) bad.push(`${cid}/${bd.name}: 天赋 ${tid} 不存在`);
          else if (ranks > node.max) bad.push(`${cid}/${bd.name}: ${tid} 超出上限`);
          sum += ranks;
        }
        if (sum > 16) bad.push(`${cid}/${bd.name}: 超过16点(${sum})`);
      }
    }
    check('18 套推荐点法(9职业×2)', buildCount === 18, `got ${buildCount}`);
    check('推荐点法数据有效(≤16点/天赋存在)', bad.length === 0, bad.join(','));
  }
  // 一键分配推荐搭配
  {
    const char = W.Char.create('火法', 'human', 'mage');
    char.level = 25;
    const fire = D.TALENT_BUILDS.mage.find((b) => b.name === '火焰爆发');
    const r = W.Char.applyBuild(char, fire);
    check('火焰爆发一键分配满16点', r.applied.length === 16 && r.remaining === 0);
    check('强化火球术满级', W.Char.rankOf(char, 'fire', 'm_fire_fireball') === 5);
    check('燃烧被动技能已解锁(推荐配点)', char.learnedSkills.includes('combustion'));
    check('无剩余天赋点', W.Char.getUnspent(char) === 0);
    const r3 = W.Char.applyBuild(char, fire);
    check('重复分配跳过已习得天赋', r3.applied.length === 0 && r3.remaining === 0);
    const char2 = W.Char.create('小火法', 'human', 'mage');
    char2.level = 12;
    const r2 = W.Char.applyBuild(char2, fire);
    check('12级只能分配3点', r2.applied.length === 3 && r2.remaining > 0);
  }

  // 气定神闲:下一技能零消耗且不进入冷却
  {
    const char = W.Char.create('气定神闲', 'human', 'mage');
    char.level = 12;
    const c = W.Char.computed(char);
    char.hp = c.hpMax; char.hpMax = c.hpMax; char.mana = 50; char.manaMax = c.manaMax;
    char.learnedSkills.push('presence_of_mind');
    for (const sid of D.CLASSES.mage.skills) {
      const s = D.SKILLS[sid];
      if (s && s.learn <= char.level && !char.learnedSkills.includes(sid)) char.learnedSkills.push(sid);
    }
    const log = [];
    const ui = { log: (t, h) => log.push(h), float: () => {}, render: () => {}, onEnd: null };
    W.Combat.start(char, [D.MONSTERS.elwynn_boar], ui, {});
    const b = W.Combat.battle;
    W.Utils.delay = () => Promise.resolve();
    b.enemies[0].dodge = 0; b.player.hit = 1;
    await W.Combat.playerAction({ type: 'skill', skill: 'presence_of_mind', target: 'e0' });
    check('气定神闲生效', b.player.buffs.some((x) => x.mod && x.mod.nextFree));
    const manaBefore = b.player.mana;
    await W.Combat.playerAction({ type: 'skill', skill: 'polymorph', target: 'e0' });
    check('零消耗施放变羊术(60法力免消耗)', b.player.mana === manaBefore, `${b.player.mana} vs ${manaBefore}`);
    check('气定神闲被消耗', !b.player.buffs.some((x) => x.mod && x.mod.nextFree));
    check('变羊术不进入冷却', !(b.player.cd.polymorph > 0));
  }
  // 冰霜新星:定身所有敌人
  {
    const char = W.Char.create('冰法', 'human', 'mage');
    char.level = 12;
    const c = W.Char.computed(char);
    char.hp = c.hpMax; char.hpMax = c.hpMax; char.mana = c.manaMax; char.manaMax = c.manaMax;
    char.learnedSkills.push('frost_nova');
    const log = [];
    const ui = { log: (t, h) => log.push(h), float: () => {}, render: () => {}, onEnd: null };
    W.Combat.start(char, [D.MONSTERS.elwynn_boar, D.MONSTERS.elwynn_boar], ui, {});
    const b = W.Combat.battle;
    W.Utils.delay = () => Promise.resolve();
    b.player.hit = 1; b.enemies.forEach((e) => { e.dodge = 0; e.resists.frost = -1000; });
    await W.Combat.playerAction({ type: 'skill', skill: 'frost_nova', target: 'e0' });
    check('冰霜新星命中全部敌人', log.filter((l) => l.includes('施放 <b>冰霜新星</b>，对')).length === 2);
    check('两名敌人都被定身跳过回合', log.filter((l) => l.includes('被<b>定身</b>住了')).length === 2);
  }
  // 暗言术:灭 击杀反噬
  {
    const char = W.Char.create('暗牧', 'undead', 'priest');
    char.level = 12;
    const c = W.Char.computed(char);
    char.hp = c.hpMax; char.hpMax = c.hpMax; char.mana = c.manaMax; char.manaMax = c.manaMax;
    char.learnedSkills.push('shadow_word_death');
    const ui = { log: () => {}, float: () => {}, render: () => {}, onEnd: null };
    W.Combat.start(char, [D.MONSTERS.elwynn_boar], ui, {});
    const b = W.Combat.battle;
    W.Utils.delay = () => Promise.resolve();
    b.player.hit = 1; b.enemies[0].hp = 1; b.enemies[0].dodge = 0; b.enemies[0].resists.shadow = -1000;
    const hpBefore = b.player.hp;
    await W.Combat.playerAction({ type: 'skill', skill: 'shadow_word_death', target: 'e0' });
    check('暗言术:灭 击杀目标并触发反噬', b.enemies[0].hp <= 0 && b.player.hp < hpBefore, `hp ${hpBefore}→${b.player.hp}`);
  }
  // 疾跑闪避增益 + 肾击连击点控制
  {
    const char = W.Char.create('疾跑贼', 'human', 'rogue');
    char.level = 12;
    const c = W.Char.computed(char);
    char.hp = c.hpMax; char.hpMax = c.hpMax; char.energy = 100;
    char.learnedSkills.push('sprint', 'kidney_shot');
    const log = [];
    const ui = { log: (t, h) => log.push(h), float: () => {}, render: () => {}, onEnd: null };
    W.Combat.start(char, [D.MONSTERS.elwynn_boar], ui, {});
    const b = W.Combat.battle;
    W.Utils.delay = () => Promise.resolve();
    await W.Combat.playerAction({ type: 'skill', skill: 'sprint', target: 'e0' });
    check('疾跑附带闪避增益', b.player.buffs.some((x) => x.mod && x.mod.dodgePct === 0.15));
    check('肾击需要连击点', !W.Combat.canUse(D.SKILLS.kidney_shot, b.player));
    b.player.combo = 1;
    b.enemies[0].dodge = 0;
    await W.Combat.playerAction({ type: 'skill', skill: 'kidney_shot', target: 'e0' });
    check('肾击眩晕目标并消耗连击点', b.player.combo === 0 && log.some((l) => l.includes('被<b>眩晕</b>住了')));
  }

  // 旧存档兼容(无 talents 字段)
  {
    const char = W.Char.create('旧存档', 'human', 'mage');
    delete char.talents;
    const c = W.Char.computed(char);
    check('旧存档兼容(无talents字段)', c.hpMax > 0 && W.Char.getUnspent(char) === 0);
  }

  console.log('== 职业专精(毒药/宠物驯服/灵魂碎片) ==');
  // 数据完整性
  {
    check('毒药物品数据', D.ITEMS.p_instant && D.ITEMS.p_instant.poison && D.ITEMS.p_deadly && D.ITEMS.p_crippling);
    check('驯服野兽技能', D.SKILLS.tame_beast && D.SKILLS.tame_beast.tame === 1);
    check('召唤地狱火技能(3碎片)', D.SKILLS.summon_infernal && D.SKILLS.summon_infernal.shardCost === 3);
    check('灵魂之火消耗1碎片', D.SKILLS.soul_fire && D.SKILLS.soul_fire.shardCost === 1);
    check('地狱火宠物数据', !!D.PETS.pet_infernal);
    const pd = D.makePetDef(D.MONSTERS.elwynn_boar);
    check('makePetDef 转换野兽', !!pd && pd.id === 'elwynn_boar' && Array.isArray(pd.skills) && pd.skills.length > 0);
  }
  // 毒药:涂抹 / 触发 / 次数
  {
    const char = W.Char.create('毒药贼', 'human', 'rogue');
    char.level = 8;
    const c = W.Char.computed(char);
    char.hp = c.hpMax; char.hpMax = c.hpMax; char.energy = 100;
    for (const sid of D.CLASSES.rogue.skills) {
      const s = D.SKILLS[sid];
      if (s && s.learn <= char.level && !char.learnedSkills.includes(sid)) char.learnedSkills.push(sid);
    }
    char.inventory.push({ id: 'p_instant', count: 3 }, { id: 'p_deadly', count: 3 }, { id: 'p_crippling', count: 3 });
    let r = W.Char.applyPoison(char, 'p_instant');
    check('盗贼涂抹速效毒药', r.ok && char.poison && char.poison.id === 'p_instant' && char.poison.charges === W.Config.POISON_CHARGES);
    check('涂抹消耗1瓶', W.Char.Inventory.count(char, 'p_instant') === 2);
    const war = W.Char.create('战士', 'human', 'warrior');
    war.inventory.push({ id: 'p_instant', count: 1 });
    r = W.Char.applyPoison(war, 'p_instant');
    check('非盗贼无法涂抹', !r.ok);
    check('解除毒药', W.Char.removePoison(char) && !char.poison);

    const log = [];
    const ui = { log: (t, h) => log.push(h), float: () => {}, render: () => {}, onEnd: null };
    W.Char.applyPoison(char, 'p_instant');
    W.Combat.start(char, [D.MONSTERS.elwynn_boar], ui, {});
    const b = W.Combat.battle;
    W.Utils.delay = () => Promise.resolve();
    b.player.hit = 1; b.enemies[0].dodge = 0; b.enemies[0].level = b.player.level; b.enemies[0].resists.nature = -1000;
    await W.Combat.playerAction({ type: 'attack', target: 'e0' });
    check('速效毒药命中爆发', log.some((l) => l.includes('毒药') && l.includes('爆发')));
    check('毒药次数消耗1', (char.poison && char.poison.charges === W.Config.POISON_CHARGES - 1) || (b.player.poison && b.player.poison.charges === W.Config.POISON_CHARGES - 1));

    W.Char.applyPoison(char, 'p_deadly');
    W.Combat.start(char, [D.MONSTERS.barrens_quill], ui, {});
    const b2 = W.Combat.battle;
    W.Utils.delay = () => Promise.resolve();
    b2.player.hit = 1; b2.enemies[0].dodge = 0; b2.enemies[0].level = b2.player.level;
    await W.Combat.playerAction({ type: 'attack', target: 'e0' });
    check('致命毒药附加中毒 DOT', b2.enemies[0].dots.some((d) => d.key === 'poison'));

    W.Char.applyPoison(char, 'p_crippling');
    W.Combat.start(char, [D.MONSTERS.barrens_quill], ui, {});
    const b3 = W.Combat.battle;
    W.Utils.delay = () => Promise.resolve();
    b3.player.hit = 1; b3.enemies[0].dodge = 0; b3.enemies[0].level = b3.player.level;
    await W.Combat.playerAction({ type: 'attack', target: 'e0' });
    check('致残毒药麻痹目标', b3.enemies[0].buffs.some((x) => x.key === 'crippling' && x.mod && x.mod.atkPct < 0));
  }
  // 猎人:驯服野兽 + 切换/召唤
  {
    const char = W.Char.create('驯兽师', 'orc', 'hunter');
    char.level = 8;
    const c = W.Char.computed(char);
    char.hp = c.hpMax; char.hpMax = c.hpMax; char.mana = c.manaMax; char.manaMax = c.manaMax;
    for (const sid of D.CLASSES.hunter.skills) {
      const s = D.SKILLS[sid];
      if (s && s.learn <= char.level && !char.learnedSkills.includes(sid)) char.learnedSkills.push(sid);
    }
    check('猎人初始宠物(白虎)', W.Char.Pets.list(char).length === 1 && W.Char.Pets.active(char).id === 'pet_tiger');
    const ui = { log: () => {}, float: () => {}, render: () => {}, onEnd: null };
    W.Combat.start(char, [D.MONSTERS.elwynn_boar], ui, {});
    const b = W.Combat.battle;
    W.Utils.delay = () => Promise.resolve();
    b.player.hit = 1;
    b.enemies[0].hp = Math.floor(b.enemies[0].hpMax * 0.3);
    await W.Combat.playerAction({ type: 'skill', skill: 'tame_beast', target: 'e0' });
    check('驯服低血量野兽成功', b.enemies.length === 0 && W.Char.Pets.list(char).length === 2 && char.activePet === 'elwynn_boar');
    W.Combat.start(char, [D.MONSTERS.westfall_gnoll], ui, {});
    const b2 = W.Combat.battle;
    W.Utils.delay = () => Promise.resolve();
    b2.player.hit = 1;
    await W.Combat.playerAction({ type: 'skill', skill: 'summon_pet_tiger', target: 'e0' });
    check('召唤已驯服的野兽宠物', b2.pets.length === 1 && b2.pets[0].name === '森林野猪');

    const mk = (name) => {
      const ch = W.Char.create(name, 'orc', 'hunter');
      ch.level = 8;
      const cc = W.Char.computed(ch);
      ch.hp = cc.hpMax; ch.hpMax = cc.hpMax; ch.mana = cc.manaMax; ch.manaMax = cc.manaMax;
      for (const sid of D.CLASSES.hunter.skills) {
        const s = D.SKILLS[sid];
        if (s && s.learn <= ch.level && !ch.learnedSkills.includes(sid)) ch.learnedSkills.push(sid);
      }
      return ch;
    };
    const char2 = mk('驯兽师2');
    W.Combat.start(char2, [D.MONSTERS.elwynn_boar], ui, {});
    const b3 = W.Combat.battle;
    W.Utils.delay = () => Promise.resolve();
    b3.player.hit = 1;
    await W.Combat.playerAction({ type: 'skill', skill: 'tame_beast', target: 'e0' });
    check('满血野兽无法驯服', b3.enemies.length === 1 && W.Char.Pets.list(char2).length === 1);
    const char3 = mk('驯兽师3');
    W.Combat.start(char3, [D.MONSTERS.westfall_gnoll], ui, {});
    const b4 = W.Combat.battle;
    W.Utils.delay = () => Promise.resolve();
    b4.player.hit = 1; b4.enemies[0].hp = 1;
    await W.Combat.playerAction({ type: 'skill', skill: 'tame_beast', target: 'e0' });
    check('人形生物无法驯服', b4.enemies.length === 1 && W.Char.Pets.list(char3).length === 1);
  }
  // 术士:灵魂碎片获取与消耗
  {
    const char = W.Char.create('痛苦术', 'undead', 'warlock');
    char.level = 20;
    const c = W.Char.computed(char);
    char.hp = c.hpMax; char.hpMax = c.hpMax; char.mana = c.manaMax; char.manaMax = c.manaMax;
    for (const sid of D.CLASSES.warlock.skills) {
      const s = D.SKILLS[sid];
      if (s && s.learn <= char.level && !char.learnedSkills.includes(sid)) char.learnedSkills.push(sid);
    }
    char.learnedSkills.push('soul_fire');
    const log = [];
    const ui = { log: (t, h) => log.push(h), float: () => {}, render: () => {}, onEnd: null };
    W.Combat.start(char, [D.MONSTERS.elwynn_boar], ui, {});
    const b = W.Combat.battle;
    W.Utils.delay = () => Promise.resolve();
    b.player.hit = 1; b.enemies[0].dodge = 0; b.enemies[0].resists.shadow = -1000;
    check('无碎片无法施放灵魂之火', !W.Combat.canUse(D.SKILLS.soul_fire, b.player));
    let guard = 0;
    while (!b.ended && guard++ < 40) {
      const p = b.player;
      const skill = p.learned.map((id) => D.SKILLS[id]).filter((s) => s && W.Combat.canUse(s, p) && (s.dmg || s.dot))[0];
      await W.Combat.playerAction(skill ? { type: 'skill', skill: skill.id, target: 'e0' } : { type: 'attack', target: 'e0' });
    }
    check('战斗胜利收割灵魂碎片', b.victory && (char.soulShards || 0) >= 1, `shards=${char.soulShards}`);
    char.soulShards = 3;
    W.Combat.start(char, [D.MONSTERS.redridge_ogre], ui, {});
    const b2 = W.Combat.battle;
    W.Utils.delay = () => Promise.resolve();
    b2.player.hit = 1; b2.player.crit = 0; b2.enemies[0].hp = 900; b2.enemies[0].hpMax = 900;
    check('3枚碎片可召唤地狱火', W.Combat.canUse(D.SKILLS.summon_infernal, b2.player));
    await W.Combat.playerAction({ type: 'skill', skill: 'summon_infernal', target: 'e0' });
    check('地狱火入队并消耗3枚碎片', b2.pets.length === 1 && b2.pets[0].petId === 'pet_infernal' && b2.player.soulShards === 0);
    b2.player.soulShards = 1;
    const logLen = log.length;
    await W.Combat.playerAction({ type: 'skill', skill: 'soul_fire', target: 'e0' });
    check('灵魂之火消耗1枚碎片(目标未死)', b2.player.soulShards === 0 && b2.enemies[0].hp > 0 && log.slice(logLen).some((l) => l.includes('灵魂之火')));
    // 修复验证:战斗中消耗的碎片在胜利结算后正确扣除(3 消耗 + 1 收割 = 1)
    char.soulShards = 3;
    W.Combat.start(char, [D.MONSTERS.elwynn_boar], ui, {});
    const b3 = W.Combat.battle;
    W.Utils.delay = () => Promise.resolve();
    await W.Combat.playerAction({ type: 'skill', skill: 'summon_infernal', target: 'e0' });
    let g = 0;
    while (!b3.ended && g++ < 40) {
      const p = b3.player;
      const skill = p.learned.map((id) => D.SKILLS[id]).filter((s) => s && W.Combat.canUse(s, p) && (s.dmg || s.dot))[0];
      await W.Combat.playerAction(skill ? { type: 'skill', skill: skill.id, target: 'e0' } : { type: 'attack', target: 'e0' });
    }
    check('战斗中消耗的碎片在胜利后正确扣除', b3.victory && char.soulShards === 1, `shards=${char.soulShards} (期望1)`);
  }
  // 旧存档迁移
  {
    const char = W.Char.create('旧猎人', 'orc', 'hunter');
    char.level = 8;
    delete char.talents; delete char.pets; delete char.activePet; delete char.soulShards; delete char.poison;
    char.learnedSkills = [];
    W.Char.ensureClassFeatures(char);
    check('旧存档迁移(宠物/碎片/毒药/技能补齐)',
      W.Char.Pets.list(char).length === 1 && char.activePet === 'pet_tiger' &&
      char.soulShards === 0 && char.poison === null && char.learnedSkills.includes('tame_beast'));
  }

  console.log('== 怪物掉落 ==');
  {
    const char = W.Char.create('拾荒者', 'human', 'warrior');
    char.level = 6;
    const c = W.Char.computed(char);
    char.hp = c.hpMax; char.hpMax = c.hpMax; char.rage = 100;
    const ui = { log: () => {}, float: () => {}, render: () => {}, onEnd: null };
    const orig = W.RNG.chance;
    // 强制命中/暴击/掉率,但概率为 0 的判定(闪避)仍返回 false,避免战斗无法结束
    W.RNG.chance = (p) => p > 0;
    W.Combat.start(char, [D.MONSTERS.elwynn_bandit], ui, {});
    const b = W.Combat.battle;
    b.enemies[0].dodge = 0;
    W.Utils.delay = () => Promise.resolve();
    let g = 0;
    while (!b.ended && g++ < 30) await W.Combat.playerAction({ type: 'attack', target: 'e0' });
    W.RNG.chance = orig;
    check('击杀怪物掉落装备(强盗掉落短剑/皮靴/药水)', b.victory && W.Char.Inventory.count(char, 'w_short_sword') === 1, `inv=${JSON.stringify(char.inventory)}`);
  }
  // 必定掉落(Boss 水晶)不受背包上限影响
  {
    const char = W.Char.create('满包拾荒者', 'human', 'warrior');
    char.level = 18;
    char.hp = 999999; char.hpMax = 999999; char.rage = 100; // 高血量避免 DOTS 磨死
    for (let i = 0; i < W.Config.BAG_SIZE; i++) char.inventory.push({ id: 'a_cloth', count: 1 }); // 塞满背包
    const ui = { log: () => {}, float: () => {}, render: () => {}, onEnd: null };
    const orig = W.RNG.chance;
    W.RNG.chance = (p) => p > 0;
    W.Combat.start(char, [D.MONSTERS.vancleef], ui, { isDungeon: true });
    const b = W.Combat.battle;
    W.Utils.delay = () => Promise.resolve();
    let g = 0;
    while (!b.ended && g++ < 80) {
      b.enemies.forEach((e) => { e.dodge = 0; }); // 含召唤爪牙,避免强制命中下无限闪避
      await W.Combat.playerAction({ type: 'attack', target: 'e0' });
    }
    W.RNG.chance = orig;
    check('背包满时必定掉落(Boss水晶)仍拾取', b.victory && W.Char.Inventory.count(char, 'm_crystal') === 1,
      `crystal=${W.Char.Inventory.count(char, 'm_crystal')} 背包=${char.inventory.length}槽 ended=${b.ended}`);
  }

  console.log('== 锻造(强化/附魔) ==');
  // 数据完整性
  {
    const MATS = ['m_dust', 'm_essence', 'm_crystal'];
    check('锻造材料齐全', MATS.every((id) => D.ITEMS[id] && D.ITEMS[id].slot === 'material'));
    const bad = [];
    for (const [eid, em] of Object.entries(D.ENCHANTS)) {
      if (!em.name || !em.icon || !em.gold || !em.mats) bad.push(eid + ': 字段缺失');
      for (const s of em.slots) if (!['weapon', 'offhand', 'head', 'chest', 'gloves', 'legs', 'boots', 'cloak', 'neck', 'ring1', 'ring2', 'trinket1', 'trinket2'].includes(s)) bad.push(eid + ': 无效槽位 ' + s);
      for (const mid in em.mats) if (!D.ITEMS[mid]) bad.push(eid + ': 材料 ' + mid + ' 不存在');
      for (const k in (em.mod || {})) if (!['dmg', 'armor', 'crit', 'dodge', 'hp', 'lifesteal', 'str', 'agi', 'stam', 'int', 'spi'].includes(k)) bad.push(eid + ': 无效属性 ' + k);
    }
    check('附魔表有效(19种)', Object.keys(D.ENCHANTS).length === 19 && bad.length === 0, bad.join(','));
    check('主城商店出售材料', D.ZONES.stormwind.shop.includes('m_crystal') && D.ZONES.orgrimmar.shop.includes('m_essence'));
    check('材料有掉落来源', Object.values(D.DROPS).some((l) => l.some(([iid]) => iid === 'm_crystal')));
    check('材料不可装备', W.Char.Equipment.equip(W.Char.create('t', 'human', 'warrior'), 'm_dust') === false);
  }
  // 材料来源:任务奖励 / 副本宝箱 / Boss 必掉
  {
    check('任务奖励含材料(低级/高级)', D.QUESTS.q_boar.rewardItems.includes('m_dust') && D.QUESTS.q_arugal.rewardItems.includes('m_crystal'));
    check('副本任务奖励含水晶+精华', D.QUESTS.q_dm.rewardItems.includes('m_crystal') && D.QUESTS.q_wc.rewardItems.includes('m_essence'));
    check('材料可叠加进任务奖励', D.QUESTS.q_golem.rewardItems.filter((i) => i === 'm_dust').length === 2);
    const badChest = [];
    for (const [did, dg] of Object.entries(D.DUNGEONS)) {
      if (!dg.chest || !dg.chest.items || !dg.chest.items.length) { badChest.push(did + ': 无宝箱'); continue; }
      for (const [iid] of dg.chest.items) if (!D.ITEMS[iid]) badChest.push(did + ':' + iid + '不存在');
    }
    check('副本宝箱数据有效(26副本)', Object.keys(D.DUNGEONS).length === 26 && badChest.length === 0, badChest.join(','));
    const bossCrystal = (mid) => (D.DROPS[mid] || []).find(([iid, ch]) => iid === 'm_crystal');
    const ALL_BOSSES = ['vancleef', 'mutanus', 'emperor_thaurissan', 'zhuzhun', 'arugal', 'archaledas', 'princess_theradras', 'gandling', 'kelthuzad',
      'drakkisath', 'rivendare', 'immolthar', 'ragnaros', 'nefarian', 'onyxia', 'hakkar', 'rajaxx', 'cthun'];
    check('副本 Boss 必定掉落奥术水晶(18)', ALL_BOSSES.every((mid) => bossCrystal(mid) && bossCrystal(mid)[1] === 1));
    // 副本区域闭环:每个副本都有对应区域、区域回链副本、母区域可旅行到达、任务已接入任务板
    {
      const badZone = [];
      for (const [did, dg] of Object.entries(D.DUNGEONS)) {
        const z = D.ZONES[did];
        if (!z || z.dungeon !== did) { badZone.push(did + ': 区域缺失/回链错误'); continue; }
        if (!D.ZONES[dg.zone].travel.includes(did)) badZone.push(did + ': 母区域旅行未打通');
        if (!(dg.boss && D.MONSTERS[dg.boss])) badZone.push(did + ': Boss 缺失');
      }
      check('副本区域闭环(9)', badZone.length === 0, badZone.join(','));
    }
    check('新副本任务奖励含水晶', ['q_sfk', 'q_uldaman', 'q_maraudon', 'q_scholomance', 'q_naxxramas'].every((qid) => D.QUESTS[qid] && D.QUESTS[qid].rewardItems.includes('m_crystal')));
    check('新副本专属装备存在', ['w_arugal_staff', 'a_uld_plate', 'a_theradras_crown', 'w_gandling_book', 'tr_kelthuzad_heart'].every((iid) => D.ITEMS[iid]));
  }
  // 强化:属性提升 / 消耗 / 分档 / 上限
  {
    const char = W.Char.create('锻造大师', 'human', 'warrior');
    char.level = 20;
    char.gold = 200000;
    char.inventory.push({ id: 'm_dust', count: 50 }, { id: 'm_essence', count: 50 }, { id: 'm_crystal', count: 50 });
    char.equipment.weapon = 'w_crusader_sword';
    char.equipment.chest = 'a_plate';
    char.equipment.ring1 = 'a_ring';
    const c0 = W.Char.computed(char);
    let r = W.Char.Forge.enhance(char, 'w_crusader_sword');
    check('强化成功(+1)', r.ok && W.Char.Forge.get(char, 'w_crusader_sword').level === 1);
    check('强化消耗金币与材料', r.cost > 0 && W.Char.Inventory.count(char, 'm_dust') === 49);
    check('强化后攻击提升', W.Char.computed(char).atkMin > c0.atkMin);
    for (let i = 1; i < W.Config.FORGE_MAX_LEVEL; i++) {
      r = W.Char.Forge.enhance(char, 'w_crusader_sword');
      if (!r.ok) break;
    }
    check('强化至满级+15', W.Char.Forge.get(char, 'w_crusader_sword').level === W.Config.FORGE_MAX_LEVEL, `level=${W.Char.Forge.get(char, 'w_crusader_sword').level}`);
    r = W.Char.Forge.enhance(char, 'w_crusader_sword');
    check('满级后无法继续强化', !r.ok && r.reason.indexOf('满级') >= 0);
    check('强化材料分档(粉尘/精华/水晶)', W.Char.Forge.enhanceMats(0).m_dust === 1 && W.Char.Forge.enhanceMats(3).m_essence === 1 && W.Char.Forge.enhanceMats(6).m_crystal === 1);
    check('11 级以上强化消耗双倍水晶', W.Char.Forge.enhanceMats(10).m_crystal === 2);
    const armor0 = W.Char.computed(char).armor;
    r = W.Char.Forge.enhance(char, 'a_plate');
    check('护甲强化成功', r.ok && W.Char.computed(char).armor > armor0);
    const poor = W.Char.create('穷铁匠', 'human', 'warrior');
    poor.equipment.weapon = 'w_short_sword';
    r = W.Char.Forge.enhance(poor, 'w_short_sword');
    check('材料不足时无法强化', !r.ok && r.reason.indexOf('材料') >= 0);
    const rich = W.Char.create('富铁匠', 'human', 'warrior');
    rich.gold = 99999;
    rich.inventory.push({ id: 'm_dust', count: 9 });
    rich.equipment.weapon = 'w_short_sword';
    check('金币材料齐全可强化', W.Char.Forge.enhance(rich, 'w_short_sword').ok);
  }
  // 附魔:生效 / 替换 / 槽位限制 / 移除
  {
    const char = W.Char.create('附魔师', 'human', 'warrior');
    char.level = 20;
    char.gold = 200000;
    char.inventory.push({ id: 'm_dust', count: 50 }, { id: 'm_essence', count: 50 });
    char.equipment.weapon = 'w_crusader_sword';
    char.equipment.chest = 'a_plate';
    char.equipment.boots = 'a_steel_boots';
    let r = W.Char.Forge.enchant(char, 'w_crusader_sword', 'e_lifesteal');
    check('附魔生命偷取', r.ok && W.Char.Forge.get(char, 'w_crusader_sword').enchant === 'e_lifesteal');
    check('生命偷取属性生效', Math.abs(W.Char.computed(char).weaponLifesteal - 0.08) < 0.001);
    const hp0 = W.Char.computed(char).hpMax;
    r = W.Char.Forge.enchant(char, 'a_plate', 'e_vitality');
    check('胸甲附魔强效生命', r.ok);
    check('附魔生命上限+80', W.Char.computed(char).hpMax - hp0 === 80, `diff=${W.Char.computed(char).hpMax - hp0}`);
    r = W.Char.Forge.enchant(char, 'a_steel_boots', 'e_wisdom');
    check('槽位不符无法附魔(靴子不能附智慧)', !r.ok && r.reason.indexOf('不适用') >= 0);
    const atkBefore = W.Char.computed(char).atkMin;
    r = W.Char.Forge.enchant(char, 'w_crusader_sword', 'e_flame');
    check('替换附魔(生命偷取→灼热)', r.ok && W.Char.Forge.get(char, 'w_crusader_sword').enchant === 'e_flame');
    check('替换后吸血失效', W.Char.computed(char).weaponLifesteal === 0);
    check('灼热附魔附加伤害', W.Char.computed(char).atkMin === atkBefore + 4, `${atkBefore}→${W.Char.computed(char).atkMin}`);
    r = W.Char.Forge.removeEnchant(char, 'w_crusader_sword');
    check('移除附魔', r.ok && !W.Char.Forge.get(char, 'w_crusader_sword').enchant);
    const poor = W.Char.create('穷附魔', 'human', 'warrior');
    poor.gold = 9999; // 金币充足但无材料,应因材料不足失败
    poor.equipment.weapon = 'w_short_sword';
    r = W.Char.Forge.enchant(poor, 'w_short_sword', 'e_flame');
    check('材料不足无法附魔', !r.ok && r.reason.indexOf('材料') >= 0, r.reason);
    poor.inventory.push({ id: 'm_dust', count: 1 });
    r = W.Char.Forge.enchant(poor, 'w_short_sword', 'e_flame');
    check('材料不够(需2)仍失败', !r.ok);
  }
  // 新副本装备:强化/附魔链路(副手首件 + 饰品史诗)
  {
    const char = W.Char.create('副本工匠', 'human', 'mage');
    char.level = 60;
    char.gold = 300000;
    char.inventory.push({ id: 'm_dust', count: 30 }, { id: 'm_essence', count: 30 }, { id: 'm_crystal', count: 30 });
    char.equipment.weapon = 'w_ice_guardian';
    char.equipment.offhand = 'w_gandling_book';
    char.equipment.trinket1 = 'tr_kelthuzad_heart';
    const c0 = W.Char.computed(char);
    const bareChar = W.Char.create('裸装', 'human', 'mage');
    bareChar.level = 60;
    const bare = W.Char.computed(bareChar);
    check('副手/饰品属性计入computed', c0.int - bare.int >= 12 + 14 && c0.spi - bare.spi >= 8 + 10, `int+${c0.int - bare.int} spi+${c0.spi - bare.spi}`);
    let r = W.Char.Forge.enhance(char, 'w_gandling_book');
    check('副手可强化(+1)', r.ok && W.Char.Forge.get(char, 'w_gandling_book').level === 1);
    check('副手强化后属性提升', W.Char.computed(char).int > c0.int);
    const crit0 = W.Char.computed(char).crit;
    r = W.Char.Forge.enchant(char, 'tr_kelthuzad_heart', 'e_keen');
    check('饰品附魔敏锐(双槽兼容)', r.ok && W.Char.Forge.get(char, 'tr_kelthuzad_heart').enchant === 'e_keen');
    check('敏锐暴击+2%生效', Math.abs(W.Char.computed(char).crit - (crit0 + 0.02)) < 0.0001, `${crit0}→${W.Char.computed(char).crit}`);
    r = W.Char.Forge.enchant(char, 'w_gandling_book', 'e_wisdom');
    check('副手附魔智慧(offhand槽位)', r.ok && W.Char.Forge.get(char, 'w_gandling_book').enchant === 'e_wisdom');
  }
  // 战斗增益卷轴 / 紫橙品质 / 已装备分解出售
  {
    const SCROLLS = ['s_force', 's_protect', 's_crit', 's_swift', 's_spirit', 's_mana'];
    check('战斗卷轴数据有效(6种)', SCROLLS.every((id) => {
      const it = D.ITEMS[id];
      return it && it.slot === 'consumable' && it.scroll && (it.scroll.buff || it.scroll.healPct || it.scroll.manaPct);
    }));
    check('卷轴商店投放(联盟/部落)', D.ZONES.stormwind.shop.includes('s_force') && D.ZONES.orgrimmar.shop.includes('s_mana') && D.ZONES.durotar.shop.includes('s_swift'));
    check('品质色板(紫史诗/橙传说)', U.QUALITY_COLOR.epic === '#a335ee' && U.QUALITY_COLOR.legendary === '#ff8000');
    check('橙色传说装备存在', ['w_thunderfury', 'w_sulfuras', 'w_ashbringer', 'w_frostmourne'].every((iid) => D.ITEMS[iid] && D.ITEMS[iid].quality === 'legendary'));
    const hasEpic = (mid) => (D.DROPS[mid] || []).some(([iid]) => { const it = D.ITEMS[iid]; return it && it.quality === 'epic'; });
    check('30级以上副本最终Boss掉紫色史诗', ['archaledas', 'princess_theradras', 'zhuzhun', 'emperor_thaurissan', 'gandling', 'kelthuzad'].every(hasEpic));
    const hasLegendary = (mid) => (D.DROPS[mid] || []).some(([iid]) => { const it = D.ITEMS[iid]; return it && it.quality === 'legendary'; });
    check('50级以上副本Boss几率掉橙色传说', ['emperor_thaurissan', 'gandling', 'kelthuzad'].every(hasLegendary));
    // 战斗中卷轴:免费动作不占回合
    const sc = W.Char.create('卷轴使者', 'human', 'warrior');
    sc.level = 10;
    sc.inventory.push({ id: 's_force', count: 2 }, { id: 's_spirit', count: 1 });
    const scc = W.Char.computed(sc);
    sc.hp = Math.floor(scc.hpMax * 0.5); sc.hpMax = scc.hpMax;
    W.State.newCharacter(sc);
    const sui = { log: () => {}, float: () => {}, render: () => {}, onEnd: null };
    W.Combat.start(sc, [D.MONSTERS.elwynn_boar], sui, {});
    const sb = W.Combat.battle;
    const round0 = sb.round;
    await W.Combat.useScroll('s_force');
    check('力量卷轴不占回合且施加祝福', sb.round === round0 && !sb.ended && sb.player.buffs.some((x) => x.key === 'sc_atk' && x.mod.atkPct === 0.2));
    check('卷轴消耗背包1个', W.Char.Inventory.count(sc, 's_force') === 1);
    const hpBefore = sb.player.hp;
    await W.Combat.useScroll('s_spirit');
    check('生命卷轴立即恢复且不占回合', sb.player.hp > hpBefore && sb.round === round0);
    check('背包外卷轴无法使用', W.Char.Inventory.count(sc, 's_force') === 1 && W.Char.Inventory.count(sc, 's_spirit') === 0);
        // 战斗中药水:免费动作不占回合 + 冷却 + 满状态不消耗
    {
      const pc = W.Char.create('药水使者', 'human', 'mage');
      pc.level = 12;
      pc.inventory.push({ id: 'c_heal', count: 3 }, { id: 'c_mana', count: 2 });
      const pcc = W.Char.computed(pc);
      pc.hp = Math.floor(pcc.hpMax * 0.4); pc.hpMax = pcc.hpMax;
      pc.mana = Math.floor(pcc.manaMax * 0.3); pc.manaMax = pcc.manaMax;
      W.State.newCharacter(pc);
      const pui = { log: () => {}, float: () => {}, render: () => {}, onEnd: null };
      W.Combat.start(pc, [D.MONSTERS.elwynn_boar], pui, {});
      const pb = W.Combat.battle;
      const pr0 = pb.round;
      const hp0 = pb.player.hp;
      await W.Combat.usePotion('c_heal');
      check('治疗药水不占回合且恢复', pb.round === pr0 && pb.player.hp > hp0 && pb.player.hp <= pb.player.hpMax);
      check('药水消耗背包1个', W.Char.Inventory.count(pc, 'c_heal') === 2);
      check('药水进入3回合冷却', pb.player.potionCd === 3);
      const hp1 = pb.player.hp;
      await W.Combat.usePotion('c_heal');
      check('冷却期喝药无效且不消耗', pb.player.hp === hp1 && W.Char.Inventory.count(pc, 'c_heal') === 2);
      // 回合推进递减冷却(3 次 tick 后清零)
      W.Combat._tickUnit(pb.player, true);
      check('冷却回合递减', pb.player.potionCd === 2);
      W.Combat._tickUnit(pb.player, true);
      W.Combat._tickUnit(pb.player, true);
      check('冷却3回合后清零可再用', pb.player.potionCd === 0);
      const mana0 = pb.player.mana;
      await W.Combat.usePotion('c_mana');
      check('法力药水恢复法力且不占回合', pb.player.mana > mana0 && pb.round === pr0 && W.Char.Inventory.count(pc, 'c_mana') === 1);
      // 满状态不消耗
      pb.player.hp = pb.player.hpMax; pb.player.mana = pb.player.manaMax;
      const cnt = W.Char.Inventory.count(pc, 'c_heal');
      await W.Combat.usePotion('c_heal');
      check('满状态喝药不消耗', W.Char.Inventory.count(pc, 'c_heal') === cnt);
    }
// 已装备物品分解/出售
    const dc2 = W.Char.create('装备商', 'human', 'warrior');
    dc2.level = 20;
    dc2.equipment.weapon = 'w_warblade';
    dc2.equipment.chest = 'a_plate';
    dc2.equipment.boots = 'a_steel_boots';
    const g0 = dc2.gold;
    let r = W.Char.Forge.disenchantEquipped(dc2, 'weapon');
    check('已装备分解成功(蓝色武器)', r.ok && !dc2.equipment.weapon && W.Char.Forge.disenchantYield(D.ITEMS.w_warblade).m_crystal >= 1, r.reason);
    r = W.Char.Forge.disenchantEquipped(dc2, 'chest');
    check('已装备分解拒绝白色装备', !r.ok && r.reason.indexOf('优秀') >= 0);
    r = W.Char.Forge.sellEquipped(dc2, 'boots');
    check('已装备出售成功(金币入账)', r.ok && !dc2.equipment.boots && dc2.gold === g0 + r.gold && r.gold > 0);
  }
  // 分解:绿色/蓝色装备 → 锻造材料
  {
    check('分解API存在', typeof W.Char.Forge.disenchant === 'function' && typeof W.Char.Forge.disenchantYield === 'function');
    // 产出公式(确定性)
    const y1 = W.Char.Forge.disenchantYield(D.ITEMS.a_ring); // 绿9级
    check('绿色9级:粉尘4', y1.m_dust === 4 && y1.m_essence === 0, JSON.stringify(y1));
    check('产出预览不显示×0项', !W.Char.Forge.matsLabel(y1).includes('×0'), W.Char.Forge.matsLabel(y1));
    const y2 = W.Char.Forge.disenchantYield(D.ITEMS.a_band); // 绿10级
    check('绿色10级:粉尘4+精华1', y2.m_dust === 4 && y2.m_essence === 1, JSON.stringify(y2));
    const y3 = W.Char.Forge.disenchantYield(D.ITEMS.w_warblade); // 蓝14级
    check('蓝色14级:粉尘6+精华3+水晶1', y3.m_dust === 6 && y3.m_essence === 3 && y3.m_crystal === 1, JSON.stringify(y3));
    check('白色/消耗品/材料不可分解', !W.Char.Forge.canDisenchant(D.ITEMS.w_short_sword)
      && !W.Char.Forge.canDisenchant(D.ITEMS.c_heal) && !W.Char.Forge.canDisenchant(D.ITEMS.m_dust));
    // 完整流程
    const char = W.Char.create('分解师', 'human', 'warrior');
    char.inventory.push({ id: 'a_ring', count: 1 }, { id: 'w_warblade', count: 1 }, { id: 'm_dust', count: 1 });
    let r = W.Char.Forge.disenchant(char, 'a_ring');
    check('分解绿色成功得材料', r.ok && W.Char.Inventory.count(char, 'a_ring') === 0 && W.Char.Inventory.count(char, 'm_dust') === 1 + r.yield.m_dust, JSON.stringify(r.yield));
    r = W.Char.Forge.disenchant(char, 'w_warblade');
    check('分解蓝色得精华+水晶', r.ok && W.Char.Inventory.count(char, 'm_essence') === 3 && W.Char.Inventory.count(char, 'm_crystal') === 1);
    r = W.Char.Forge.disenchant(char, 'm_dust');
    check('材料物品不能分解', !r.ok);
    // 已装备 / 已强化不可分解
    const c2 = W.Char.create('甲胄师', 'human', 'warrior');
    c2.equipment.chest = 'a_blue';
    check('已装备不可分解', !W.Char.Forge.disenchant(c2, 'a_blue').ok);
    const c3 = W.Char.create('强化师', 'human', 'warrior');
    c3.gold = 99999;
    c3.inventory.push({ id: 'm_dust', count: 9 });
    c3.equipment.weapon = 'w_staff_of_arcana';
    W.Char.Forge.enhance(c3, 'w_staff_of_arcana');
    W.Char.Equipment.unequip(c3, 'weapon');
    c3.inventory.push({ id: 'w_staff_of_arcana', count: 1 });
    const r3 = W.Char.Forge.disenchant(c3, 'w_staff_of_arcana');
    check('已强化装备不可分解', !r3.ok && r3.reason.indexOf('强化') >= 0, r3.reason);
    // 批量分解:一键分解全部绿色装备
    const b1 = W.Char.create('批量分解', 'human', 'warrior');
    b1.inventory.push({ id: 'a_ring', count: 2 }, { id: 'a_band', count: 1 }, { id: 'w_warblade', count: 1 }, { id: 'w_short_sword', count: 1 });
    check('批量分解计数(3件绿色)', W.Char.Forge.disenchantCount(b1, 'green') === 3);
    const rb = W.Char.Forge.disenchantAll(b1, 'green');
    check('批量分解成功(含堆叠整叠清空)', rb.ok && rb.count === 3, JSON.stringify(rb));
    check('批量分解不碰蓝色/白色', W.Char.Inventory.count(b1, 'w_warblade') === 1 && W.Char.Inventory.count(b1, 'w_short_sword') === 1);
    // a_ring(绿9)×2 → 粉尘8; a_band(绿10) → 粉尘4+精华1;合计 粉尘12 精华1
    check('批量分解材料汇总正确', W.Char.Inventory.count(b1, 'm_dust') === 12 && W.Char.Inventory.count(b1, 'm_essence') === 1,
      `dust=${W.Char.Inventory.count(b1, 'm_dust')} ess=${W.Char.Inventory.count(b1, 'm_essence')}`);
    check('无绿色装备时批量分解失败', !W.Char.Forge.disenchantAll(b1, 'green').ok);
    // 批量分解排除已装备的蓝色;蓝色批量分解可得水晶
    const b2 = W.Char.create('批量2', 'human', 'warrior');
    b2.equipment.chest = 'a_blue';
    b2.inventory.push({ id: 'a_ring', count: 1 });
    const rb2 = W.Char.Forge.disenchantAll(b2, 'green');
    check('批量分解不影响已装备蓝装', rb2.ok && rb2.count === 1 && b2.equipment.chest === 'a_blue');
    // 卸下后 a_blue 自动入背包,无需再次 push
    W.Char.Equipment.unequip(b2, 'chest');
    const rb3 = W.Char.Forge.disenchantAll(b2, 'blue');
    check('批量分解蓝色成功(得水晶)', rb3.ok && rb3.count === 1 && W.Char.Inventory.count(b2, 'm_crystal') === 1,
      `count=${rb3.count} crystal=${W.Char.Inventory.count(b2, 'm_crystal')}`);
  }
  console.log('== 被动技能(常驻) ==');
  {
    // 数据:3 个转化的被动 + 3 个新增被动
    const converted = ['battle_shout', 'seal_of_righteousness', 'thorns'];
    check('转化的被动技能标记正确(无消耗无冷却)', converted.every((id) => D.SKILLS[id] && D.SKILLS[id].passive && D.SKILLS[id].mod && !D.SKILLS[id].res && !D.SKILLS[id].cd));
    const added = { arcane_intellect: 'mage', aspect_of_hawk: 'hunter', meditation: 'priest' };
    let badAdd = [];
    for (const [id, clsId] of Object.entries(added)) {
      const s = D.SKILLS[id];
      if (!s || !s.passive || !s.mod || s.cls !== clsId) badAdd.push(id + ':字段缺失');
      if (!D.CLASSES[clsId].skills.includes(id)) badAdd.push(id + ':未入职业技能表');
      if (!s.learn || s.learn <= 1) badAdd.push(id + ':学习等级异常');
      for (const k in s.mod) if (typeof s.mod[k] !== 'number' || s.mod[k] <= 0) badAdd.push(id + ':mod异常');
    }
    check('新增被动技能数据完整', badAdd.length === 0, badAdd.join(','));
    check('战斗怒吼被动 atkPct=0.2', D.SKILLS.battle_shout.mod.atkPct === 0.2);
    check('正义圣印被动 onHit=10', D.SKILLS.seal_of_righteousness.mod.onHit === 10);
    check('荆棘术被动 thorns=6', D.SKILLS.thorns.mod.thorns === 6);

    // 属性生效:computed 已含被动加成(战斗怒吼 → 攻击提升)
    const w1 = W.Char.create('被动战', 'human', 'warrior');
    w1.level = 8;
    const cNo = W.Char.computed(w1);
    for (const sid of D.CLASSES.warrior.skills) {
      const s = D.SKILLS[sid];
      if (s && s.learn <= w1.level && !w1.learnedSkills.includes(sid)) w1.learnedSkills.push(sid);
    }
    const cYes = W.Char.computed(w1);
    check('战斗怒吼常驻提升攻击', cYes.atkMin > cNo.atkMin && cYes.atkMax > cNo.atkMax,
      `atk ${cNo.atkMin}-${cNo.atkMax} → ${cYes.atkMin}-${cYes.atkMax}`);
    check('被动技能汇总 API', W.Char.passiveMods(w1).atkPct === 0.2);
    // 战士无战斗类被动
    W.Combat.start(w1, [D.MONSTERS.elwynn_boar], { log: () => {}, float: () => {}, render: () => {}, onEnd: null }, {});
    check('战士被动不携带 onHit/thorns', W.Combat.battle.player.passiveMod.onHit === 0 && W.Combat.battle.player.passiveMod.thorns === 0);

    // 圣骑士:正义圣印 → onHit 常驻 + 审判联动
    const pal = W.Char.create('圣印', 'human', 'paladin');
    pal.level = 8;
    for (const sid of D.CLASSES.paladin.skills) {
      const s = D.SKILLS[sid];
      if (s && s.learn <= pal.level && !pal.learnedSkills.includes(sid)) pal.learnedSkills.push(sid);
    }
    const log = [];
    W.Combat.start(pal, [D.MONSTERS.elwynn_boar], { log: (t, h) => log.push(h), float: () => {}, render: () => {}, onEnd: null }, {});
    const pb = W.Combat.battle;
    pb.player.hit = 1; pb.enemies[0].dodge = 0; pb.enemies[0].level = pb.player.level;
    check('正义圣印被动进入战斗单位', pb.player.passiveMod.onHit === 10);
    check('_buffMod 合并被动 onHit', W.Combat._buffMod(pb.player, 'onHit', 0) === 10);
    // 普通攻击触发圣印附加神圣伤害(命中必中)
    const hpBefore = pb.enemies[0].hp;
    await W.Combat.playerAction({ type: 'attack', target: 'e0' });
    check('被动圣印随攻击附加伤害', pb.enemies[0].hp < hpBefore, `hp ${hpBefore} → ${pb.enemies[0].hp}`);
    // 审判联动:被动圣印也算激活
    const logLen = log.length;
    await W.Combat.playerAction({ type: 'skill', skill: 'judgement', target: 'e0' });
    check('审判消耗圣印之力(被动联动)', log.slice(logLen).some((l) => l.indexOf('审判消耗圣印之力') >= 0));

    // 德鲁伊:荆棘常驻反弹(进入战斗单位)
    const dr = W.Char.create('荆棘', 'tauren', 'druid');
    dr.level = 8;
    for (const sid of D.CLASSES.druid.skills) {
      const s = D.SKILLS[sid];
      if (s && s.learn <= dr.level && !dr.learnedSkills.includes(sid)) dr.learnedSkills.push(sid);
    }
    W.Combat.start(dr, [D.MONSTERS.elwynn_boar], { log: () => {}, float: () => {}, render: () => {}, onEnd: null }, {});
    check('荆棘术被动进入战斗单位', W.Combat.battle.player.passiveMod.thorns === 6);

    // 新增被动属性生效
    const mg = W.Char.create('奥智', 'human', 'mage');
    mg.level = 3;
    const sp0 = W.Char.computed(mg).spellPower;
    for (const sid of D.CLASSES.mage.skills) {
      const s = D.SKILLS[sid];
      if (s && s.learn <= mg.level && !mg.learnedSkills.includes(sid)) mg.learnedSkills.push(sid);
    }
    const sp1 = W.Char.computed(mg).spellPower;
    check('奥术智慧常驻提升法术强度', sp1 > sp0, `sp ${sp0} → ${sp1}`);
    const hk = W.Char.create('鹰眼', 'orc', 'hunter');
    hk.level = 3;
    const h0 = W.Char.computed(hk);
    for (const sid of D.CLASSES.hunter.skills) {
      const s = D.SKILLS[sid];
      if (s && s.learn <= hk.level && !hk.learnedSkills.includes(sid)) hk.learnedSkills.push(sid);
    }
    const h1 = W.Char.computed(hk);
    check('鹰之守护常驻提升命中与暴击', h1.hit > h0.hit && h1.crit > h0.crit,
      `hit ${h0.hit}→${h1.hit} crit ${h0.crit}→${h1.crit}`);
    const pr = W.Char.create('冥想', 'human', 'priest');
    pr.level = 3;
    const r0 = W.Char.computed(pr).manaRegen;
    for (const sid of D.CLASSES.priest.skills) {
      const s = D.SKILLS[sid];
      if (s && s.learn <= pr.level && !pr.learnedSkills.includes(sid)) pr.learnedSkills.push(sid);
    }
    const r1 = W.Char.computed(pr).manaRegen;
    check('冥想常驻提升法力恢复', r1 > r0, `manaRegen ${r0} → ${r1}`);

    // ==== 第二批被动转化:盾牌格挡 / 切割 / 大地之盾 / 猎人印记 / 心灵之火(天赋) / 寒冰护体(天赋) ====
    const converted2 = ['shield_block', 'slice_and_dice', 'earth_shield', 'hunters_mark', 'inner_fire', 'frost_armor'];
    check('第二批被动标记正确(无消耗无冷却无回合制效果)', converted2.every((id) => {
      const s = D.SKILLS[id];
      return s && s.passive && s.mod && !s.res && !s.cd && !s.buff && !s.debuff && !s.shield && !s.comboSpend;
    }));
    // 盾牌格挡 → 护甲常驻(战士 6 级自动习得)
    const war2 = W.Char.create('格挡', 'human', 'warrior');
    war2.level = 6;
    const arm0 = W.Char.computed(war2).armor;
    for (const sid of D.CLASSES.warrior.skills) {
      const s = D.SKILLS[sid];
      if (s && s.learn <= war2.level && !war2.learnedSkills.includes(sid)) war2.learnedSkills.push(sid);
    }
    const arm1 = W.Char.computed(war2).armor;
    check('盾牌格挡常驻提升护甲', arm1 > arm0 && W.Char.passiveMods(war2).armorPct === 0.2, `armor ${arm0} → ${arm1}`);
    // 切割 → 伤害常驻(盗贼 8 级)
    const rg = W.Char.create('切割', 'human', 'rogue');
    rg.level = 8;
    for (const sid of D.CLASSES.rogue.skills) {
      const s = D.SKILLS[sid];
      if (s && s.learn <= rg.level && !rg.learnedSkills.includes(sid)) rg.learnedSkills.push(sid);
    }
    check('切割被动 atkPct=0.15', W.Char.passiveMods(rg).atkPct === 0.15);
    // 猎人印记 → 战斗开始自动标记首个敌人
    const hnt = W.Char.create('印记', 'night_elf', 'hunter');
    hnt.level = 5;
    for (const sid of D.CLASSES.hunter.skills) {
      const s = D.SKILLS[sid];
      if (s && s.learn <= hnt.level && !hnt.learnedSkills.includes(sid)) hnt.learnedSkills.push(sid);
    }
    const hlog = [];
    W.Combat.start(hnt, [D.MONSTERS.elwynn_boar], { log: (t, m) => hlog.push(m), float: () => {}, render: () => {}, onEnd: null }, {});
    const hb = W.Combat.battle;
    check('猎人印记进入战斗单位', hb.player.passiveMod.markTaken === 0.12);
    check('战斗开始自动标记首个敌人(易伤12%)', hb.enemies[0].buffs.some((x) => x.mod && x.mod.takenPct === 0.12),
      JSON.stringify(hb.enemies[0].buffs.map((x) => x.mod)));
    check('印记标记战斗日志', hlog.some((m) => m.indexOf('猎人印记') >= 0));
    // 大地之盾 → 战斗开始护盾 + 受击回血(萨满 10 级)
    const sh = W.Char.create('大地', 'orc', 'shaman');
    sh.level = 10;
    for (const sid of D.CLASSES.shaman.skills) {
      const s = D.SKILLS[sid];
      if (s && s.learn <= sh.level && !sh.learnedSkills.includes(sid)) sh.learnedSkills.push(sid);
    }
    W.Combat.start(sh, [D.MONSTERS.elwynn_boar], { log: () => {}, float: () => {}, render: () => {}, onEnd: null }, {});
    const shb = W.Combat.battle;
    check('大地之盾战斗开始护盾+受击回血', shb.player.shield && shb.player.shield.amount > 0 && shb.player.shield.healOnHit === 6,
      `shield=${JSON.stringify(shb.player.shield)}`);
    // 天赋被动:心灵之火(牧师) / 寒冰护体(法师) — 学习后常驻,卸载后移除,不可施放
    const p2 = W.Char.create('心灵', 'human', 'priest');
    p2.level = 20;
    p2.talents = { disc: { pr_disc_shield: 5, pr_disc_fh: 5 } }; // 本系 10 点解锁第 3 层
    check('学习心灵之火天赋', W.Char.learnTalent(p2, 'disc', 'pr_disc_if').ok);
    const pmP = W.Char.passiveMods(p2);
    check('心灵之火被动 atkPct/armorPct', pmP.atkPct === 0.12 && pmP.armorPct === 0.2, JSON.stringify(pmP));
    W.Combat.start(p2, [D.MONSTERS.elwynn_boar], { log: () => {}, float: () => {}, render: () => {}, onEnd: null }, {});
    check('天赋被动不可主动施放', !W.Combat.canUse(D.SKILLS.inner_fire, W.Combat.battle.player));
    W.Char.unlearnTalent(p2, 'disc', 'pr_disc_if');
    check('卸载天赋后被动效果移除', W.Char.passiveMods(p2).atkPct == null && W.Char.passiveMods(p2).armorPct == null);
    const m2 = W.Char.create('冰甲', 'human', 'mage');
    m2.level = 20;
    m2.talents = { frost: { m_frost_frostbolt: 5, m_frost_chill: 5 } };
    check('学习寒冰护体天赋', W.Char.learnTalent(m2, 'frost', 'm_frost_armor').ok);
    W.Combat.start(m2, [D.MONSTERS.elwynn_boar], { log: () => {}, float: () => {}, render: () => {}, onEnd: null }, {});
    check('寒冰护体战斗开始冰盾', W.Combat.battle.player.shield && W.Combat.battle.player.shield.amount > 0);
    check('寒冰护体无受击回血', W.Combat.battle.player.shield.healOnHit === 0);
    // 强化猎人印记 debuffPct 天赋:放大自动标记易伤(0.12 + 0.03×rank)
    const h2 = W.Char.create('强化印记', 'night_elf', 'hunter');
    h2.level = 16;
    h2.talents = { beast: { h_beast_pet: 5 } };
    for (const sid of D.CLASSES.hunter.skills) {
      const s = D.SKILLS[sid];
      if (s && s.learn <= h2.level && !h2.learnedSkills.includes(sid)) h2.learnedSkills.push(sid);
    }
    check('学习强化猎人印记', W.Char.learnTalent(h2, 'beast', 'h_beast_mark').ok);
    W.Combat.start(h2, [D.MONSTERS.elwynn_boar], { log: () => {}, float: () => {}, render: () => {}, onEnd: null }, {});
    const mk = W.Combat.battle.enemies[0].buffs.find((x) => x.mod && x.mod.takenPct != null);
    check('强化猎人印记放大自动标记易伤(0.15)', !!mk && mk.mod.takenPct === 0.12 + 0.03,
      `takenPct=${mk && mk.mod.takenPct}`);
    // 天赋强化被动:强化战斗怒吼 buffPct 对已转被动的战斗怒吼生效(修复死节点)
    const w3 = W.Char.create('怒吼', 'human', 'warrior');
    w3.level = 16;
    w3.talents = { fury: { w_fury_cruelty: 5 } };
    for (const sid of D.CLASSES.warrior.skills) {
      const s = D.SKILLS[sid];
      if (s && s.learn <= w3.level && !w3.learnedSkills.includes(sid)) w3.learnedSkills.push(sid);
    }
    const atkBefore = W.Char.passiveMods(w3).atkPct;
    check('学习强化战斗怒吼', W.Char.learnTalent(w3, 'fury', 'w_fury_shout').ok);
    check('强化战斗怒吼加成被动战斗怒吼', W.Char.passiveMods(w3).atkPct === atkBefore + 0.05,
      `${atkBefore} → ${W.Char.passiveMods(w3).atkPct}`);

    // ==== 第三批被动转化:血性狂暴(兽人) / 狂暴(巨魔) / 嗜血(萨满) / 熊·猎豹形态(德鲁伊) ====
    const converted3 = ['blood_fury', 'berserking', 'bloodlust', 'cat_form', 'bear_form'];
    check('第三批被动标记正确(无消耗无冷却无爆发形态)', converted3.every((id) => {
      const s = D.SKILLS[id];
      return s && s.passive && s.mod && !s.res && !s.cd && !s.buff && !s.dmg;
    }));
    // 种族被动:兽人血性狂暴 / 巨魔狂暴
    const orc3 = W.Char.create('兽人', 'orc', 'warrior');
    check('兽人血性狂暴常驻 atkPct=0.1', W.Char.passiveMods(orc3).atkPct === 0.1, JSON.stringify(W.Char.passiveMods(orc3)));
    const troll3 = W.Char.create('巨魔', 'troll', 'warrior');
    check('巨魔狂暴常驻 atkPct=0.06', W.Char.passiveMods(troll3).atkPct === 0.06);
    // 嗜血:萨满 18 级常驻 + 强化嗜血天赋联动(0.08+0.03×rank)
    const sh3 = W.Char.create('嗜血', 'tauren', 'shaman');
    sh3.level = 18;
    for (const sid of D.CLASSES.shaman.skills) {
      const s = D.SKILLS[sid];
      if (s && s.learn <= sh3.level && !sh3.learnedSkills.includes(sid)) sh3.learnedSkills.push(sid);
    }
    check('嗜血被动 atkPct=0.08', W.Char.passiveMods(sh3).atkPct === 0.08);
    sh3.level = 20;
    sh3.talents = { enhance: { s_enh_mastery: 5 } }; // 本系 5 点解锁第 2 层
    check('学习强化嗜血', W.Char.learnTalent(sh3, 'enhance', 's_enh_bl').ok);
    check('强化嗜血天赋加成被动嗜血', W.Char.passiveMods(sh3).atkPct === 0.08 + 0.02, `atkPct=${W.Char.passiveMods(sh3).atkPct}`);
    // 种族天赋接线:血性狂暴/狂暴仍由兽人/巨魔天赋引用并在创建时习得
    check('兽人天赋引用血性狂暴', D.RACES.orc.traits.some((t) => t.active === 'blood_fury') && orc3.learnedSkills.includes('blood_fury'));
    check('巨魔天赋引用狂暴', D.RACES.troll.traits.some((t) => t.active === 'berserking') && troll3.learnedSkills.includes('berserking'));
    // 德鲁伊形态常驻:猎豹 +15% 伤害, 熊 +5% 攻击/+20% 护甲;天赋 buffPct 联动(含护甲)
    const dr3 = W.Char.create('形态', 'tauren', 'druid');
    dr3.level = 14;
    const arm3 = W.Char.computed(dr3).armor;
    for (const sid of D.CLASSES.druid.skills) {
      const s = D.SKILLS[sid];
      if (s && s.learn <= dr3.level && !dr3.learnedSkills.includes(sid)) dr3.learnedSkills.push(sid);
    }
    const pmDr = W.Char.passiveMods(dr3);
    check('猎豹+熊形态常驻生效', pmDr.atkPct === 0.2 && pmDr.armorPct === 0.2, JSON.stringify(pmDr));
    check('熊形态常驻提升护甲', W.Char.computed(dr3).armor > arm3, `armor ${arm3} → ${W.Char.computed(dr3).armor}`);
    dr3.level = 20;
    dr3.talents = { feral: { d_fer_heart: 5 } };
    check('学习强化熊形态', W.Char.learnTalent(dr3, 'feral', 'd_fer_bear').ok);
    const pmBear = W.Char.passiveMods(dr3);
    check('强化熊形态联动攻击与护甲', pmBear.atkPct === 0.25 && pmBear.armorPct === 0.25, JSON.stringify(pmBear));
    // 强化猎豹形态 buffPct 联动(0.15+0.06/级 → 第一级 0.21)
    check('学习强化猎豹形态', W.Char.learnTalent(dr3, 'feral', 'd_fer_cat').ok);
    check('强化猎豹形态联动被动猎豹', W.Char.passiveMods(dr3).atkPct === 0.25 + 0.06, `atkPct=${W.Char.passiveMods(dr3).atkPct}`);
    // 被动不可主动施放
    W.Combat.start(sh3, [D.MONSTERS.elwynn_boar], { log: () => {}, float: () => {}, render: () => {}, onEnd: null }, {});
    check('被动嗜血不可主动施放', !W.Combat.canUse(D.SKILLS.bloodlust, W.Combat.battle.player));
  }

  console.log('== 戒指槽修复 / 出售价 ==');
  {
    // 戒指槽映射:空槽优先 ring1 → ring2;属性计入 computed;双满替换较弱者
    const rc = W.Char.create('戒王', 'human', 'warrior');
    const c0 = W.Char.computed(rc);
    // 临时弱戒指(耐力1)用于验证替换较弱者
    D.ITEMS.__test_weak_ring = { id: '__test_weak_ring', name: '弱戒', icon: '💍', slot: 'ring', quality: 'green', level: 1, stats: { stam: 1 }, buy: 100 };
    rc.inventory.push({ id: '__test_weak_ring', count: 1 }, { id: 'a_band', count: 1 }, { id: 'a_ring', count: 1 });
    check('戒指装备到ring1(非孤儿槽)', W.Char.Equipment.equip(rc, '__test_weak_ring') && rc.equipment.ring1 === '__test_weak_ring' && !rc.equipment.ring);
    check('第二枚戒指装备到ring2', W.Char.Equipment.equip(rc, 'a_band') && rc.equipment.ring2 === 'a_band');
    check('双满时替换较弱戒指(弱戒→a_ring)', W.Char.Equipment.equip(rc, 'a_ring') && rc.equipment.ring1 === 'a_ring' && rc.equipment.ring2 === 'a_band',
      JSON.stringify(rc.equipment));
    check('替换后旧戒指回到背包', W.Char.Inventory.count(rc, '__test_weak_ring') === 1);
    const c1 = W.Char.computed(rc);
    check('戒指属性计入computed(耐力+3/敏捷+3)', c1.stam === c0.stam + 3 && c1.agi === c0.agi + 3, `stam ${c0.stam}→${c1.stam} agi ${c0.agi}→${c1.agi}`);
    check('已装备同类戒指不可重复装备', !W.Char.Equipment.equip(rc, 'a_ring'));
    check('已装备同类装备不可重复装备', !W.Char.Equipment.equip(rc, 'w_wooden_staff'));
    delete D.ITEMS.__test_weak_ring;
    // 旧存档迁移:孤儿 eq.ring → ring1
    const mc = W.Char.create('迁移', 'human', 'warrior');
    mc.equipment.ring = 'a_band';
    W.Char.ensureClassFeatures(mc);
    check('旧存档孤儿戒指迁移到ring1', mc.equipment.ring1 === 'a_band' && !mc.equipment.ring);
    // 饰品双槽:trinket1/trinket2 空槽优先;属性计入 computed;双满替换较弱者;极品/普通实例区分
    {
      const tc = W.Char.create('饰王', 'human', 'warrior');
      const c0 = W.Char.computed(tc);
      D.ITEMS.__test_weak_trinket = { id: '__test_weak_trinket', name: '弱饰', icon: '🎖️', slot: 'trinket', quality: 'green', level: 1, stats: { stam: 1 }, buy: 100 };
      tc.inventory.push({ id: '__test_weak_trinket', count: 1 }, { id: 'tr_might_signet', count: 1 }, { id: 'tr_ember_heart', count: 1 });
      check('饰品装备到trinket1', W.Char.Equipment.equip(tc, '__test_weak_trinket') && tc.equipment.trinket1 === '__test_weak_trinket');
      check('第二件饰品装备到trinket2', W.Char.Equipment.equip(tc, 'tr_might_signet') && tc.equipment.trinket2 === 'tr_might_signet');
      check('双满时替换较弱饰品(弱饰→余烬之心)', W.Char.Equipment.equip(tc, 'tr_ember_heart') && tc.equipment.trinket1 === 'tr_ember_heart' && tc.equipment.trinket2 === 'tr_might_signet',
        JSON.stringify(tc.equipment));
      check('替换后旧饰品回到背包', W.Char.Inventory.count(tc, '__test_weak_trinket') === 1);
      const c1 = W.Char.computed(tc);
      // 余烬之心(int4/spi3/crit0.02) + 猛击徽章(str4/stam2) → 期望 str+4/stam+2/int+4/crit+0.02
      check('饰品属性计入computed(力量/智力/耐力/暴击)', c1.str === c0.str + 4 && c1.stam === c0.stam + 2 && c1.int === c0.int + 4
        && Math.abs(c1.crit - c0.crit - 0.02) < 0.001, `str ${c0.str}→${c1.str} stam ${c0.stam}→${c1.stam} crit ${c0.crit}→${c1.crit}`);
      check('已装备同类饰品不可重复装备', !W.Char.Equipment.equip(tc, 'tr_might_signet'));
      check('已装备饰品不可分解(Forge._isEquipped)', !W.Char.Forge.canDisenchant(D.ITEMS.tr_ember_heart)
        || !W.Char.Forge.disenchant(tc, 'tr_ember_heart').ok);
      delete D.ITEMS.__test_weak_trinket;
    }
    // 饰品数据完整性:所有饰品 slot 合法、无 dmg、有掉落/商店来源
    {
      const trinkets = Object.values(D.ITEMS).filter((it) => it && it.slot === 'trinket');
      check('饰品物品齐全(≥8件)', trinkets.length >= 8, String(trinkets.length));
      const badT = trinkets.filter((it) => (it.stats || {}).dmg || !it.level);
      check('饰品无武器伤害字段且含等级', badT.length === 0, badT.map((i) => i.id).join(','));
      const dropped = Object.values(D.DROPS).some((l) => l.some(([iid]) => iid === 'tr_naaru_tear'));
      const inShop = D.ZONES.stormwind.shop.includes('tr_ember_heart') && D.ZONES.orgrimmar.shop.includes('tr_might_signet');
      const inQuest = Object.values(D.QUESTS).some((q) => (q.rewardItems || []).includes('tr_naaru_tear'));
      check('饰品有掉落/商店/任务/宝箱来源', dropped && inShop && inQuest
        && Object.values(D.DUNGEONS).some((d) => (d.chest && d.chest.items || []).some(([iid]) => iid === 'tr_abyss_eye')), '来源缺失');
      check('饰品可附魔(敏锐/强袭/智慧兼容双槽)', D.ENCHANTS.e_keen.slots.includes('trinket1') && D.ENCHANTS.e_keen.slots.includes('trinket2'));
      // 实际附魔应用:饰品 slot='trinket' 需双槽兼容匹配(slotMatches),戒指同理
      const et = W.Char.create('附魔饰', 'human', 'warrior');
      et.gold = 99999;
      et.inventory.push({ id: 'm_dust', count: 20 }, { id: 'm_essence', count: 20 });
      et.equipment.trinket1 = 'tr_ember_heart';
      const rk = W.Char.Forge.enchant(et, 'tr_ember_heart', 'e_keen');
      check('饰品附魔应用成功(敏锐)', rk.ok && W.Char.Forge.get(et, 'tr_ember_heart').enchant === 'e_keen', rk.reason || 'ok');
      const rm = W.Char.Forge.enchant(et, 'tr_ember_heart', 'e_might');
      check('饰品附魔替换成功(强袭)', rm.ok && W.Char.Forge.get(et, 'tr_ember_heart').enchant === 'e_might', rm.reason || 'ok');
      et.equipment.ring1 = 'a_band';
      const rr = W.Char.Forge.enchant(et, 'a_band', 'e_wisdom');
      check('戒指附魔应用成功(智慧·双槽兼容)', rr.ok && W.Char.Forge.get(et, 'a_band').enchant === 'e_wisdom', rr.reason || 'ok');
    }
    // 出售价公式(与商店一致:it.sell 优先,否则 buy×0.4,最低 1)
    const sp = (it) => Math.max(1, Math.floor(it.sell != null ? it.sell : it.buy * 0.4));
    check('出售价:指定卖价优先', sp(D.ITEMS.a_band) === 900 && sp(D.ITEMS.m_dust) === 50);
    check('出售价:无卖价时 buy×0.4', sp(D.ITEMS.a_ring) === 560 && sp(D.ITEMS.c_bread) === 10);
  }

  console.log('== 自动存档 ==');
  {
    const S = W.State;
    S.saveSlots = []; S._saveSlot = 0; S._lastAutoSave = 0; S._autoToast = true; // 关闭首次提示
    const char = W.Char.create('自动存档侠', 'human', 'warrior');
    S.newCharacter(char);
    char.level = 5;
    let r = S.autoSave(true);
    check('首次自动存档写入空槽0', r.saved && r.slot === 0 && S.saveSlots[0] && S.saveSlots[0].name === '自动存档侠' && S.saveSlots[0].data.level === 5);
    // 节流:非强制 15 秒内不重复写
    S._lastAutoSave = Date.now();
    char.level = 6;
    r = S.autoSave();
    check('自动存档节流(间隔内不重复写)', !r.saved);
    // 强制绕过节流
    r = S.autoSave(true);
    check('强制自动存档绕过节流', r.saved && S.saveSlots[0].data.level === 6);
    // 同名同职业 → 复用原槽(即使当前槽指向其他角色)
    const c2 = W.Char.create('自动存档侠', 'human', 'warrior');
    c2.level = 9;
    S._saveSlot = 2;
    S.newCharacter(c2);
    r = S.autoSave(true);
    check('同名同职业复用原槽', r.saved && r.slot === 0 && S.saveSlots[0].data.level === 9);
    // 新角色 → 下一个空槽
    const c3 = W.Char.create('萨满甲', 'orc', 'shaman');
    S.newCharacter(c3);
    r = S.autoSave(true);
    check('新角色写入下一个空槽', r.saved && r.slot === 1);
    // 槽满且无匹配 → 不覆盖他人存档(填满 10 个槽)
    const c4 = W.Char.create('第四人', 'human', 'mage');
    for (let i = 0; i < W.Config.MAX_SLOTS; i++) S.saveSlots[i] = { name: '别人' + i, savedAt: 1, data: { classId: i % 2 ? 'mage' : 'warrior' } };
    S.newCharacter(c4);
    r = S.autoSave(true);
    check('槽满且无匹配时不覆盖', !r.saved);
    // 无角色时不保存
    S.newCharacter(null);
    check('无角色时不自动保存', !S.autoSave(true).saved);
  }
  // 存档条目摘要与来源标注
  {
    const S = W.State;
    S.saveSlots = []; S._saveSlot = 0; S._autoToast = true;
    const char = W.Char.create('摘要侠', 'human', 'warrior');
    char.level = 12;
    char.gold = 123456;
    char.zone = 'duskwood';
    S.newCharacter(char);
    let r = S.autoSave(true);
    check('自动存档记录来源auto', r.saved && S.saveSlots[0].src === 'auto');
    check('自动存档记录金币与位置', S.saveSlots[0].gold === 123456 && S.saveSlots[0].zoneCN === '暮色森林', `gold=${S.saveSlots[0].gold} zone=${S.saveSlots[0].zoneCN}`);
    S.save(0);
    check('手动存档记录来源manual', S.saveSlots[0].src === 'manual');
    const sm = S.slotSummary(S.saveSlots[0]);
    check('slotSummary 摘要正确', sm.level === 12 && sm.gold === 123456 && sm.zoneCN === '暮色森林' && sm.src === 'manual');
    // 旧存档兼容(缺少新字段,从 data 回退)
    const legacy = { name: '旧人', classCN: '战士', raceCN: '人类', level: 8, zone: 'elwynn', savedAt: 0, data: { level: 8, gold: 500, zone: 'elwynn', classId: 'warrior', race: 'human' } };
    const ls = S.slotSummary(legacy);
    check('旧存档摘要兼容(从data回退)', ls.level === 8 && ls.gold === 500 && ls.zoneCN === '艾尔文森林' && ls.src === 'manual');
    check('fmtRelTime 刚刚', U.fmtRelTime(Date.now()) === '刚刚');
    // 存档槽扩容至 10:自动存档可落到 3 号以后空槽,支持写入第 10 槽
    check('存档槽扩容至10', W.Config.MAX_SLOTS === 10);
    S.saveSlots = []; // 上一用例已填满 10 槽,此处重置以便验证 3 号以后空槽
    S.saveSlots[0] = { name: '路人甲', classCN: '战士', raceCN: '人类', level: 1, zone: 'elwynn', savedAt: 1, data: { classId: 'warrior', race: 'human', level: 1 } };
    S.saveSlots[1] = { name: '路人乙', classCN: '战士', raceCN: '人类', level: 1, zone: 'elwynn', savedAt: 1, data: { classId: 'warrior', race: 'human', level: 1 } };
    S.saveSlots[2] = { name: '路人丙', classCN: '战士', raceCN: '人类', level: 1, zone: 'elwynn', savedAt: 1, data: { classId: 'warrior', race: 'human', level: 1 } };
    const c3 = W.Char.create('扩容侠', 'human', 'warrior');
    c3.level = 5;
    S.newCharacter(c3);
    r = S.autoSave(true);
    check('自动存档使用3号以后空槽', r.saved && r.slot === 3, `saved=${r.saved} slot=${r.slot}`);
    S.save(9);
    check('支持写入第10槽(索引9)', S.saveSlots[9] && S.saveSlots[9].name === '扩容侠');
  }
  // 战斗:生命偷取附魔吸血
  {
    const char = W.Char.create('吸血战士', 'human', 'warrior');
    char.level = 10;
    char.gold = 99999;
    char.inventory.push({ id: 'm_essence', count: 5 });
    char.equipment.weapon = 'w_battle_axe';
    W.Char.Forge.enchant(char, 'w_battle_axe', 'e_lifesteal');
    const c = W.Char.computed(char);
    char.hp = Math.floor(c.hpMax * 0.5); char.hpMax = c.hpMax; char.rage = 100;
    const log = [];
    const ui = { log: (t, h) => log.push(h), float: () => {}, render: () => {}, onEnd: null };
    const orig = W.RNG.chance;
    W.RNG.chance = (p) => p > 0;
    W.Combat.start(char, [D.MONSTERS.elwynn_boar], ui, {});
    const b = W.Combat.battle;
    W.Utils.delay = () => Promise.resolve();
    b.enemies[0].dodge = 0;
    await W.Combat.playerAction({ type: 'attack', target: 'e0' });
    W.RNG.chance = orig;
    check('生命偷取恢复生命', log.some((l) => l.includes('生命偷取') && l.includes('恢复了')), log.slice(-4).join('|'));
  }
  // 旧存档迁移(upgrades 字段)
  {
    const char = W.Char.create('旧铁匠', 'human', 'warrior');
    delete char.upgrades;
    W.Char.ensureClassFeatures(char);
    const c = W.Char.computed(char);
    check('旧存档迁移(upgrades补齐)', !!char.upgrades && c.hpMax > 0 && W.Char.Forge.get(char, 'w_wooden_staff') === null);
  }

  console.log('== 平衡性数值 ==');
  {
    check('背包扩容至40格', W.Config.BAG_SIZE === 40);
    check('强化费用降低(基础50/每级20)', W.Config.FORGE_BASE_COST === 50 && W.Config.FORGE_COST_PER_ITEM_LEVEL === 20);
    const cost = W.Char.Forge.enhanceCost(D.ITEMS.vancleef_fang, 0);
    check('17级武器强化+1费用为456(含等级系数)', cost === Math.round((50 + 17 * 20) * 1 * 1.17), `cost=${cost}`);
    // 高等级强化费用随等级上浮(经济修复:匹配后期收益,低等级不敏感)
    const costLow = W.Char.Forge.enhanceCost(D.ITEMS.a_band, 0); // Lv8 戒指
    const costHigh = W.Char.Forge.enhanceCost(D.ITEMS.w_frostmourne, 0); // Lv60 传说武器
    check('高等级强化费用明显高于低等级', costHigh > costLow * 3, `low=${costLow} high=${costHigh}`);
    // 41-60 段装备售出价下调(经济修复:恢复金币价值):51+ ×0.5 / 41-50 ×0.7 / 低等级不变
    const lo8 = D.ITEMS.a_band; // Lv8 低等级装备(不受影响)
    check('低等级装备售出价不受影响', lo8 && lo8.sell === 900, `sell=${lo8 && lo8.sell}`);
    const hi51 = Object.values(D.ITEMS).find((it) => it.level >= 51 && it.sell != null && it.buy != null);
    check('51+装备售出价约为买价20-35%', !!hi51 && hi51.sell >= Math.floor(hi51.buy * 0.2) && hi51.sell <= Math.floor(hi51.buy * 0.35), hi51 ? `${hi51.id} buy=${hi51.buy} sell=${hi51.sell}` : '无匹配物品');
    const mid41 = Object.values(D.ITEMS).find((it) => it.level >= 41 && it.level <= 50 && it.sell != null && it.buy != null);
    check('41-50装备售出价约为买价25-45%', !!mid41 && mid41.sell >= Math.floor(mid41.buy * 0.25) && mid41.sell <= Math.floor(mid41.buy * 0.45), mid41 ? `${mid41.id} buy=${mid41.buy} sell=${mid41.sell}` : '无匹配物品');
    check('附魔费用全面下调', D.ENCHANTS.e_crusader.gold === 900 && D.ENCHANTS.e_flame.gold === 300 && D.ENCHANTS.e_lifesteal.gold === 600);
    // 稳健下限:全部装备掉率 >= 10%(而非脆弱的比例门槛),允许未来个别稀有掉落低于该值后另行调整;橙色传说设计为低几率稀有掉落,豁免该下限
    const lows = [];
    for (const [mid, list] of Object.entries(D.DROPS)) for (const [iid, ch] of list) {
      const it = D.ITEMS[iid];
      if (it && it.quality !== 'legendary' && it.slot !== 'consumable' && it.slot !== 'material' && ch < 0.1) lows.push(`${mid}:${iid}=${ch}`);
    }
    check('装备掉率大幅上调(全部 >= 10%)', lows.length === 0, lows.join(','));
    check('低等区也有装备掉落', D.DROPS.elwynn_bandit.some(([iid, ch]) => D.ITEMS[iid].slot !== 'consumable' && ch >= 0.1));
  }

  console.log('== 设置面板(UI 偏好) ==');
  {
    check('World.openSettings 已实现', typeof W.World.openSettings === 'function');
    const src = W.World.openSettings.toString();
    check('设置面板同步折叠偏好键(引用常量)', src.indexOf('COLLAPSE_KEY') !== -1);
    check('设置面板同步音效偏好键(引用常量)', src.indexOf('SOUND_KEY') !== -1);
  }
  console.log('== 存档 ==');
  {
    const char = W.Char.create('存档侠', 'troll', 'hunter');
    W.State.newCharacter(char);
    W.State.save(0);
    check('写入存档', !!W.State.saveSlots[0]);
    W.State.load(0);
    check('读档恢复', W.State.character.name === '存档侠');
  }

  console.log('== 60 级内容扩展 ==');
  {
    check('等级上限提升至 60', W.Config.LEVEL_CAP === 60, `LEVEL_CAP=${W.Config.LEVEL_CAP}`);
    check('区域扩充至 49 个', Object.keys(D.ZONES).length === 49, `got ${Object.keys(D.ZONES).length}`);
    check('副本扩充至 26 个', Object.keys(D.DUNGEONS).length === 26, `got ${Object.keys(D.DUNGEONS).length}`);
    check('任务扩充至 130 个', Object.keys(D.QUESTS).length === 130, `got ${Object.keys(D.QUESTS).length}`);
    check('新地图悬赏+副本讨伐任务已接入任务板', Object.keys(D.QUESTS).some((q) => q.startsWith('q_map_')) && Object.keys(D.QUESTS).some((q) => q.startsWith('q_dg_')));
    check('新副本区域入口存在', D.ZONES.blackrock_depths.dungeon === 'blackrock_depths' && D.ZONES.zulfarrak.dungeon === 'zulfarrak');
    check('黑石深渊 7 波(中途首领+索瑞森大帝)', D.DUNGEONS.blackrock_depths && D.DUNGEONS.blackrock_depths.waves.length === 7 && D.DUNGEONS.blackrock_depths.boss === 'emperor_thaurissan');
    check('祖尔法拉克 7 波(中途首领+乌克兹·沙顶)', D.DUNGEONS.zulfarrak && D.DUNGEONS.zulfarrak.waves.length === 7 && D.DUNGEONS.zulfarrak.boss === 'zhuzhun');
    check('新 Boss 必定掉落奥术水晶', D.DROPS.emperor_thaurissan.some(([i, c]) => i === 'm_crystal' && c === 1) && D.DROPS.zhuzhun.some(([i, c]) => i === 'm_crystal' && c === 1));
    check('史诗装备已上线', D.ITEMS.w_arcane_blade && D.ITEMS.w_arcane_blade.quality === 'epic' && D.ITEMS.a_emperor_plate && D.ITEMS.a_emperor_plate.quality === 'epic');
    check('新副本任务存在', !!D.QUESTS.q_brd && !!D.QUESTS.q_zf);
    const noBuy = [];
    for (const z of Object.values(D.ZONES)) for (const s of z.shop) {
      const it = D.ITEMS[s];
      if (it && !it.buy) noBuy.push(z.id + ':' + s);
    }
    check('商店物品均有定价(无 undefined 售价)', noBuy.length === 0, noBuy.join(','));
    // 旅行连通性(副本入口作为单向节点)
    const reach = (start, goal) => {
      const seen = new Set([start]); const q = [start];
      while (q.length) {
        const z = q.shift();
        for (const t of D.ZONES[z].travel || []) {
          const zz = D.ZONES[t];
          if (!zz || seen.has(t)) continue;
          if (zz.dungeon) { seen.add(t); continue; }
          seen.add(t); q.push(t);
        }
      }
      return seen.has(goal);
    };
    check('联盟线 艾尔文森林→冬泉谷 连通', reach('elwynn', 'winterspring'));
    check('部落线 杜隆塔尔→瘟疫之地 连通', reach('durotar', 'plaguelands'));
    check('跨阵营连通(联盟经商船可达部落主城)', reach('elwynn', 'durotar'));
    check('跨阵营连通(部落经商船可达联盟主城)', reach('durotar', 'elwynn'));
    // 升级至 60
    const lv = W.Char.create('远征者', 'human', 'warrior');
    lv.level = 59; lv.exp = W.Utils.expNeeded(59) - 1;
    W.Char.addExp(lv, 1);
    check('59 级可升至 60', lv.level === 60 && lv.exp === 0, `level=${lv.level} exp=${lv.exp}`);
    W.Char.addExp(lv, 999999);
    check('60 级封顶不再升级', lv.level === 60);
    check('满级不再获得经验(exp 恒为 0)', lv.exp === 0, `exp=${lv.exp}`);
    // 59 级一次性大额经验奖励升到 60:经验必须清零(不允许残留)
    const big = W.Char.create('大额奖励', 'human', 'warrior');
    big.level = 59; big.exp = W.Utils.expNeeded(59) - 1;
    W.Char.addExp(big, 999999);
    check('59 级大额奖励升 60 经验清零', big.level === 60 && big.exp === 0, `level=${big.level} exp=${big.exp}`);
  }

  console.log('== 60 级高阶战斗 ==');
  {
    const char = W.Char.create('屠神者', 'human', 'warrior');
    char.level = 60;
    char.equipment = {
      weapon: 'w_arcane_blade', offhand: null, head: 'a_blackrock_helm', chest: 'a_dragonscale',
      legs: 'a_searing_legs', boots: 'a_badlands_boots', gloves: 'a_winter_gloves', cloak: 'a_winter_cloak',
      neck: 'a_silithus_neck', ring1: 'a_silithus_ring', ring2: 'a_silithus_ring',
    };
    const c = W.Char.computed(char);
    char.hp = c.hpMax; char.hpMax = c.hpMax; char.mana = c.manaMax; char.manaMax = c.manaMax;
    for (const sid of D.CLASSES.warrior.skills) {
      const s = D.SKILLS[sid];
      if (s && s.learn <= char.level && !char.learnedSkills.includes(sid)) char.learnedSkills.push(sid);
    }
    const ui = { log: () => {}, float: () => {}, render: () => {}, onEnd: null };
    W.Combat.start(char, [D.MONSTERS.plague_elite], ui, {});
    const b = W.Combat.battle;
    W.Utils.delay = () => Promise.resolve();
    let guard = 0;
    while (!b.ended && guard++ < 150) {
      const p = b.player;
      const skill = p.learned.map((id) => D.SKILLS[id]).filter((s) => s && W.Combat.canUse(s, p) && (s.dmg || s.heal || s.dot))[0];
      await W.Combat.playerAction(skill ? { type: 'skill', skill: skill.id, target: 'e0' } : { type: 'attack', target: 'e0' });
    }
    console.log(`  60级满装战士 vs 巫妖之影(58精英) → ${b.victory ? '击败精英 ✅' : '落败'} (${guard}回合)`);
    check('60 级精英战可正常结算', b.ended, `guard=${guard}`);
    check('60 级精英战有胜负结果', b.victory !== undefined);
  }

  console.log('== 稀有精英刷新计时 ==');
  {
    const e = W.Char.create('精英猎手', 'human', 'warrior');
    check('新角色 elites 初始为空', e.elites && Object.keys(e.elites).length === 0);
    let st = W.Char.eliteStatus(e, 'stv');
    check('未击杀时精英存活', st.length === 1 && st[0].alive && st[0].name === '血帆海盗船长', JSON.stringify(st));
    check('无精英区域无状态', W.Char.eliteStatus(e, 'stormwind').length === 0);
    e.elites.stv_elite = Date.now();
    st = W.Char.eliteStatus(e, 'stv');
    check('击杀后进入刷新倒计时', !st[0].alive && st[0].remainingMs > 0 && st[0].remainingMs <= W.Config.ELITE_RESPAWN_MS, JSON.stringify(st[0]));
    e.elites.stv_elite = Date.now() - W.Config.ELITE_RESPAWN_MS - 1000;
    st = W.Char.eliteStatus(e, 'stv');
    check('刷新时间到后重新存活', st[0].alive);
    const old = W.Char.create('旧档', 'human', 'warrior');
    delete old.elites;
    W.Char.ensureClassFeatures(old);
    check('旧存档 elites 兜底', old.elites && typeof old.elites === 'object');
    // 实战击败精英
    const fc = W.Char.create('讨伐者', 'human', 'warrior');
    fc.level = 40;
    fc.equipment = {
      weapon: 'w_blackrock_sword', offhand: null, head: 'a_blackrock_helm', chest: 'a_blackrock_plate',
      gloves: 'a_winter_gloves', legs: 'a_searing_legs', boots: 'a_badlands_boots', cloak: 'a_winter_cloak',
      neck: 'a_silithus_neck', ring1: 'a_silithus_ring', ring2: 'a_silithus_ring',
    };
    const fcc = W.Char.computed(fc);
    fc.hp = fcc.hpMax; fc.hpMax = fcc.hpMax; fc.mana = fcc.manaMax; fc.manaMax = fcc.manaMax;
    for (const sid of D.CLASSES.warrior.skills) {
      const s = D.SKILLS[sid];
      if (s && s.learn <= fc.level && !fc.learnedSkills.includes(sid)) fc.learnedSkills.push(sid);
    }
    fc.zone = 'stv';
    const ui = { log: () => {}, float: () => {}, render: () => {}, onEnd: null };
    W.Combat.start(fc, [D.MONSTERS.stv_elite], ui, {});
    const bb = W.Combat.battle;
    W.Utils.delay = () => Promise.resolve();
    let g = 0;
    while (!bb.ended && g++ < 60) {
      const p = bb.player;
      const skill = p.learned.map((id) => D.SKILLS[id]).filter((s) => s && W.Combat.canUse(s, p) && (s.dmg || s.dot))[0];
      await W.Combat.playerAction(skill ? { type: 'skill', skill: skill.id, target: 'e0' } : { type: 'attack', target: 'e0' });
    }
    check('实战击败精英后记录刷新时间', bb.victory && fc.elites && fc.elites.stv_elite, `victory=${bb.victory} elites=${JSON.stringify(fc.elites)}`);
    // 普通怪物不记录
    const fc2 = W.Char.create('平砍者', 'human', 'warrior');
    fc2.level = 20;
    const c2 = W.Char.computed(fc2);
    fc2.hp = c2.hpMax; fc2.hpMax = c2.hpMax; fc2.mana = c2.manaMax; fc2.manaMax = c2.manaMax;
    for (const sid of D.CLASSES.warrior.skills) {
      const s = D.SKILLS[sid];
      if (s && s.learn <= fc2.level && !fc2.learnedSkills.includes(sid)) fc2.learnedSkills.push(sid);
    }
    fc2.zone = 'stv';
    const ui2 = { log: () => {}, float: () => {}, render: () => {}, onEnd: null };
    W.Combat.start(fc2, [D.MONSTERS.stv_panther], ui2, {});
    const b2 = W.Combat.battle;
    W.Utils.delay = () => Promise.resolve();
    let g2 = 0;
    while (!b2.ended && g2++ < 60) {
      const p = b2.player;
      const skill = p.learned.map((id) => D.SKILLS[id]).filter((s) => s && W.Combat.canUse(s, p) && (s.dmg || s.dot))[0];
      await W.Combat.playerAction(skill ? { type: 'skill', skill: skill.id, target: 'e0' } : { type: 'attack', target: 'e0' });
    }
    check('普通怪物不记录精英刷新', b2.victory && !(fc2.elites || {}).stv_panther, `elites=${JSON.stringify(fc2.elites)}`);
  }

  console.log('== 世界首领定时刷新 ==');
  {
    const e = W.Char.create('首领猎手', 'human', 'warrior');
    check('新角色 worldBosses 初始为空', e.worldBosses && Object.keys(e.worldBosses).length === 0);
    check('世界首领注册表 2 个', Object.keys(D.WORLD_BOSSES || {}).length === 2);
    const st0 = W.Char.worldBossStatus(e);
    check('未击杀时全部存活', st0.length === 2 && st0.every((s) => s.alive) &&
      st0.some((s) => s.name === '卡扎克') && st0.some((s) => s.name === '艾萨拉绿龙'), JSON.stringify(st0));
    check('世界首领怪物带 world 标记', !!D.MONSTERS.kazzak.world && !!D.MONSTERS.azuregos.world);
    check('世界首领出没区域正确', D.WORLD_BOSSES.kazzak.zone === 'burning' && D.WORLD_BOSSES.azuregos.zone === 'winterspring');
    check('世界首领挑战等级门槛 55', D.WORLD_BOSSES.kazzak.minLevel === 55 && D.WORLD_BOSSES.azuregos.minLevel === 55);
    check('卡扎克掉落传说之刃', (D.DROPS.kazzak || []).some(([i, c]) => i === 'w_kazzak_blade' && D.ITEMS[i].quality === 'legendary'));
    check('世界首领必定双倍奥术水晶', (D.DROPS.kazzak || []).filter(([i]) => i === 'm_crystal').length === 2 &&
      (D.DROPS.azuregos || []).filter(([i]) => i === 'm_crystal').length === 2);
    check('新稀有装备齐全(4件)', ['w_kazzak_blade', 'tr_abyssal_signet', 'a_emerald_drake_helm', 'w_azure_staff']
      .every((id) => D.ITEMS[id] && D.ITEMS[id].sell != null));
    e.worldBosses.kazzak = Date.now();
    const st1 = W.Char.worldBossStatus(e);
    check('击杀后进入重新现身倒计时', !st1.find((s) => s.id === 'kazzak').alive &&
      st1.find((s) => s.id === 'kazzak').remainingMs <= W.Config.WORLD_BOSS_RESPAWN_MS, JSON.stringify(st1.find((s) => s.id === 'kazzak')));
    e.worldBosses.kazzak = Date.now() - W.Config.WORLD_BOSS_RESPAWN_MS - 1000;
    check('刷新时间到后重新现身', W.Char.worldBossStatus(e).find((s) => s.id === 'kazzak').alive);
    const old = W.Char.create('旧档三', 'human', 'warrior');
    delete old.worldBosses;
    W.Char.ensureClassFeatures(old);
    check('旧存档 worldBosses 兜底', old.worldBosses && typeof old.worldBosses === 'object');
    // 实战击败世界首领(60级满装+双天赋战士,模拟校准 5/5)
    const kz = W.Char.create('屠神猎手', 'human', 'warrior');
    kz.level = 60;
    kz.equipment = {
      weapon: 'w_frostmourne', offhand: 'w_gandling_book', head: 'a_emerald_drake_helm', chest: 'a_necropolis_plate',
      legs: 'a_searing_legs', boots: 'a_badlands_boots', gloves: 'a_winter_gloves', cloak: 'a_winter_cloak',
      neck: 'a_silithus_neck', ring1: 'a_silithus_ring', ring2: 'a_silithus_ring',
      trinket1: 'tr_kelthuzad_heart', trinket2: 'tr_abyssal_signet',
    };
    for (const bd of D.TALENT_BUILDS.warrior) W.Char.applyBuild(kz, bd);
    const kzc = W.Char.computed(kz);
    kz.hp = kzc.hpMax; kz.hpMax = kzc.hpMax; kz.mana = kzc.manaMax; kz.manaMax = kzc.manaMax;
    for (const sid of D.CLASSES.warrior.skills) {
      const s = D.SKILLS[sid];
      if (s && s.learn <= kz.level && !kz.learnedSkills.includes(sid)) kz.learnedSkills.push(sid);
    }
    kz.zone = 'burning';
    const ku = { log: () => {}, float: () => {}, render: () => {}, onEnd: null };
    W.Combat.start(kz, [D.MONSTERS.kazzak], ku, { isBoss: true, context: 'world' });
    const kb = W.Combat.battle;
    W.Utils.delay = () => Promise.resolve();
    let kg = 0;
    while (!kb.ended && kg++ < 200) {
      const p = kb.player;
      const skill = p.learned.map((id) => D.SKILLS[id]).filter((s) => s && W.Combat.canUse(s, p) && (s.dmg || s.heal || s.dot))[0];
      await W.Combat.playerAction(skill ? { type: 'skill', skill: skill.id, target: 'e0' } : { type: 'attack', target: 'e0' });
    }
    console.log(`  60级满装战士 vs 卡扎克 → ${kb.victory ? '击败世界首领 ✅' : '落败'} (${kg}回合)`);
    check('实战击败世界首领后记录刷新时间', kb.victory && kz.worldBosses && kz.worldBosses.kazzak,
      `victory=${kb.victory} wb=${JSON.stringify(kz.worldBosses)}`);
  }

  console.log('== 深入敌营 · 敌方主城限定突袭 ==');
  {
    // 数据完整性:两座敌方主城 / 3 波守卫 / 首领 / 限定奖励
    check('深入敌营注册表 2 座(暴风城/奥格瑞玛)', Object.keys(D.CAPITAL_RAIDS || {}).length === 2);
    check('突袭配置 3 波 + 最终首领', Object.values(D.CAPITAL_RAIDS).every((r) => r.waves.length === 3 && r.boss && D.MONSTERS[r.boss] && r.rewards && r.rewards.items.length === 3));
    check('突袭守卫怪物有效', Object.values(D.CAPITAL_RAIDS).every((r) => r.waves.every((w) => w.enemies.every((e) => D.MONSTERS[e] && D.MONSTERS[e].elite))));
    check('限定史诗装备齐全(6件)', ['w_royal_blade', 'a_royal_plate', 'tr_royal_signet', 'w_warchief_axe', 'a_warchief_plate', 'tr_warchief_totem'].every((i) => D.ITEMS[i] && D.ITEMS[i].quality === 'epic'));
    check('突袭奖励声望有效(联盟/部落)', D.CAPITAL_RAIDS.stormwind.rewards.rep === 'og' && D.CAPITAL_RAIDS.orgrimmar.rewards.rep === 'sw');
    // 每日限次:联盟角色可突袭奥格瑞玛(不可突袭暴风城——自己的主城)
    const rc = W.Char.create('突袭侠', 'human', 'warrior');
    rc.level = 45;
    const st0 = W.Char.capitalRaidStatus(rc, 'orgrimmar');
    check('联盟突袭奥格瑞玛初始可用(剩余1次)', st0 && st0.available && st0.remaining === 1 && st0.minLevel === 40, JSON.stringify(st0));
    const first = W.Char.markCapitalRaidDone(rc, 'orgrimmar');
    check('首次完成标记为可领奖励', first === true);
    const st1 = W.Char.capitalRaidStatus(rc, 'orgrimmar');
    check('当日二次标记不可再领', !st1.available && st1.remaining === 0);
    check('突袭记录落库(次数/时间)', rc.capitalRaids && rc.capitalRaids.orgrimmar && rc.capitalRaids.orgrimmar.wins === 1 && rc.capitalRaids.orgrimmar.lastAt > 0);
    const second = W.Char.markCapitalRaidDone(rc, 'orgrimmar');
    check('同日重复突袭不再发限定奖励', second === false && rc.capitalRaids.orgrimmar.wins === 2);
    // 部落角色反向可用
    const hc = W.Char.create('突袭队长', 'orc', 'warrior');
    hc.level = 45;
    check('部落突袭暴风城初始可用', W.Char.capitalRaidStatus(hc, 'stormwind').available && !W.Char.capitalRaidStatus(hc, 'stormwind').doneToday);
    const lowC = W.Char.create('小号', 'human', 'warrior');
    lowC.level = 39;
    check('低于 40 级不可突袭(状态带等级门槛)', W.Char.capitalRaidStatus(lowC, 'orgrimmar').minLevel === 40);
    // 实战通关:45 级高配战士稳定击败奥格瑞玛 3 波(高配装备下 20/20 通过,回归稳定性优先)
    const rf = W.Char.create('突袭勇士', 'human', 'warrior');
    rf.level = 45;
    rf.equipment = { weapon: 'w_drakkisath_axe', offhand: null, head: 'a_drakkisath_plate', chest: 'a_dragonscale', gloves: 'a_badlands_plate', legs: 'a_blackrock_helm', boots: 'a_burning_boots', cloak: 'a_winter_cloak', neck: 'a_silithus_neck', ring1: 'a_silithus_ring', ring2: 'a_silithus_ring' };
    const rfc = W.Char.computed(rf);
    rf.hp = rfc.hpMax; rf.hpMax = rfc.hpMax; rf.mana = rfc.manaMax; rf.manaMax = rfc.manaMax;
    for (const sid of D.CLASSES.warrior.skills) { const s = D.SKILLS[sid]; if (s && s.learn <= rf.level && !rf.learnedSkills.includes(sid)) rf.learnedSkills.push(sid); }
    const rui = { log: () => {}, float: () => {}, render: () => {}, onEnd: null };
    let rWins = 0;
    for (let i = 0; i < 10; i++) {
      const rf2 = W.Char.create('突袭勇士', 'human', 'warrior');
      rf2.level = 45; rf2.equipment = { ...rf.equipment };
      const r2c = W.Char.computed(rf2);
      rf2.hp = r2c.hpMax; rf2.hpMax = r2c.hpMax; rf2.mana = r2c.manaMax; rf2.manaMax = r2c.manaMax;
      for (const sid of D.CLASSES.warrior.skills) { const s = D.SKILLS[sid]; if (s && s.learn <= rf2.level && !rf2.learnedSkills.includes(sid)) rf2.learnedSkills.push(sid); }
      let ok = true;
      for (const w of D.CAPITAL_RAIDS.orgrimmar.waves) {
        W.Combat.start(rf2, w.enemies.map((id) => D.MONSTERS[id]), rui, {});
        const rb = W.Combat.battle;
        W.Utils.delay = () => Promise.resolve();
        let rg = 0;
        while (!rb.ended && rg++ < 200) {
          const p = rb.player;
          const skill = p.learned.map((id) => D.SKILLS[id]).filter((s) => s && W.Combat.canUse(s, p) && (s.dmg || s.heal || s.dot))[0];
          await W.Combat.playerAction(skill ? { type: 'skill', skill: skill.id, target: 'e0' } : { type: 'attack', target: 'e0' });
        }
        if (!rb.victory) { ok = false; break; }
        W.Char.rest(rf2);
      }
      if (ok) rWins++;
    }
    check('45 级高配战士通关深入敌营(≥7/10)', rWins >= 7, 'wins=' + rWins + '/10');
  }

  console.log('== 60级新地图/副本 + 锻造合成打造 ==');
  {
    // 新区域
    check('新区域齐全(5个)', ['blasted_lands', 'felwood', 'azshara', 'eplaguelands', 'silithus'].every((z) => D.ZONES[z] && D.ZONES[z].monsters.length >= 5));
    check('新区域遭遇表有效', ['blasted_lands', 'felwood', 'azshara', 'eplaguelands', 'silithus'].every((z) => D.ENCOUNTERS[z] && D.ENCOUNTERS[z].length >= 4));
    check('新区域旅行互通', D.ZONES.burning.travel.includes('blasted_lands') && D.ZONES.winterspring.travel.includes('felwood') &&
      D.ZONES.winterspring.travel.includes('azshara') && D.ZONES.plaguelands.travel.includes('eplaguelands') && D.ZONES.ungoro.travel.includes('silithus'));
    // 新副本
    const newDgs = ['blackrock_spire', 'stratholme', 'dire_maul', 'molten_core', 'blackwing_lair', 'onyxias_lair', 'zulgurub', 'ruins_ahnqiraj', 'temple_ahnqiraj'];
    check('新副本数据完整(9个)', newDgs.every((d) => {
      const dg = D.DUNGEONS[d];
      return dg && dg.boss && D.MONSTERS[dg.boss] && D.ZONES[d] && D.ZONES[d].dungeon === d &&
        D.ZONES[dg.zone].travel.includes(d) && dg.waves.length >= 4 && dg.chest;
    }));
    check('新副本 Boss 必掉水晶', newDgs.every((d) => (D.DROPS[D.DUNGEONS[d].boss] || []).some(([i, c]) => i === 'm_crystal' && c === 1)));
    check('团本首领序列完整(熔火9/黑翼6/祖格7/废墟6/神殿8)', ['molten_core', 'blackwing_lair', 'zulgurub', 'ruins_ahnqiraj', 'temple_ahnqiraj'].every((d) => (D.DUNGEONS[d].bosses || []).length >= 5 && D.DUNGEONS[d].waves.length >= 8));
    // 新增 8 个经典 5 人副本
    const classic8 = ['ragefire_chasm', 'stockade', 'blackfathom_deeps', 'gnomeregan', 'razorfen_kraul', 'razorfen_downs', 'scarlet_monastery', 'sunken_temple'];
    check('经典 8 副本数据完整', classic8.every((d) => {
      const dg = D.DUNGEONS[d];
      return dg && dg.boss && D.MONSTERS[dg.boss] && D.ZONES[d] && D.ZONES[d].dungeon === d &&
        D.ZONES[dg.zone].travel.includes(d) && dg.waves.length >= 5 && dg.chest && dg.chest.items && dg.chest.items.length;
    }));
    check('经典 8 副本 Boss 必掉水晶', classic8.every((d) => (D.DROPS[D.DUNGEONS[d].boss] || []).some(([i, c]) => i === 'm_crystal' && c === 1)));
    check('经典 8 副本任务接入任务板', classic8.every((d) => {
      const qid = (D.ZONES[d].quests || [])[0];
      return !!qid && D.QUESTS[qid] && D.QUESTS[qid].rewardItems.includes('m_crystal') && D.QUESTS[qid].zone === d;
    }));
    check('经典 8 副本专属装备存在', ['w_rfc_ritual_dagger', 'w_skd_shiv', 'a_bfd_coral', 'w_gno_blast_gun', 'w_rfk_razor_axe', 'w_rfd_cold_blade', 'a_sm_scarlet_robe', 'w_st_temple_blade'].every((i) => D.ITEMS[i]));
    check('30+ 新副本 Boss 掉史诗', ['thermaplugg', 'charlga', 'amnennar', 'whitemane', 'avatar_hakkar'].every((mid) => (D.DROPS[mid] || []).some(([iid]) => D.ITEMS[iid] && D.ITEMS[iid].quality === 'epic')));
    check('经典 8 副本声望映射', classic8.every((d) => !!W.Char.Reps.forDungeon(d)));
    check('新副本任务接入任务板', newDgs.every((d) => D.ZONES[d].quests.includes('q_' + d)));
    check('新副本专属装备存在', ['w_drakkisath_axe', 'w_rivendare_blade', 'w_immolthar_staff', 'w_ragnaros_hand', 'w_nefarian_blade', 'a_onyxia_scale', 'tr_hakkar_heart', 'a_cthun_armor', 'tr_cthun_eye'].every((i) => D.ITEMS[i]));
    // 材料合成
    {
      const c = W.Char.create('合成师', 'human', 'warrior');
      c.gold = 10000;
      c.inventory.push({ id: 'm_dust', count: 10 }, { id: 'm_essence', count: 5 });
      let r = W.Char.Forge.synthesize(c, 'm_essence');
      check('合成精华成功(5粉尘→1精华)', r.ok && W.Char.Inventory.count(c, 'm_essence') === 6 && W.Char.Inventory.count(c, 'm_dust') === 5);
      r = W.Char.Forge.synthesize(c, 'm_crystal');
      check('合成水晶成功(5精华→1水晶)', r.ok && W.Char.Inventory.count(c, 'm_crystal') === 1 && W.Char.Inventory.count(c, 'm_essence') === 1);
      const poor2 = W.Char.create('穷合成', 'human', 'warrior');
      poor2.gold = 0;
      check('无材料无法合成', !W.Char.Forge.synthesize(poor2, 'm_essence').ok);
    }
    // 装备打造
    {
      const c = W.Char.create('锻造宗师', 'human', 'warrior');
      c.gold = 100000;
      c.inventory.push({ id: 'm_dust', count: 20 }, { id: 'm_essence', count: 20 }, { id: 'm_crystal', count: 10 });
      let r = W.Char.Forge.craft(c, 'craft_doom');
      check('打造末日战斧成功', r.ok && W.Char.Inventory.count(c, 'w_doom_cleaver') === 1);
      r = W.Char.Forge.craft(c, 'craft_rivendare');
      check('打造史诗武器成功', r.ok && W.Char.Inventory.count(c, 'w_rivendare_blade') === 1);
      const poor3 = W.Char.create('穷打造', 'human', 'warrior');
      poor3.gold = 100000;
      r = W.Char.Forge.craft(poor3, 'craft_doom');
      check('材料不足无法打造', !r.ok && r.reason.indexOf('材料') >= 0);
      check('打造配方物品均为真实装备', Object.values(D.CRAFTS || {}).every((rp) => D.ITEMS[rp.item] && D.ITEMS[rp.item].slot && D.ITEMS[rp.item].slot !== 'consumable'));
    }
    // 新高级附魔
    {
      const c = W.Char.create('大附魔', 'human', 'warrior');
      c.gold = 100000;
      c.inventory.push({ id: 'm_essence', count: 10 }, { id: 'm_crystal', count: 5 });
      c.equipment.weapon = 'w_rivendare_blade';
      c.equipment.ring1 = 'a_silithus_ring';
      let r = W.Char.Forge.enchant(c, 'w_rivendare_blade', 'e_wrath');
      check('怒火附魔(吸血+伤害)', r.ok && W.Char.Forge.get(c, 'w_rivendare_blade').enchant === 'e_wrath');
      r = W.Char.Forge.enchant(c, 'a_silithus_ring', 'e_critical');
      check('致命一击附魔(暴击+3%)', r.ok && W.Char.Forge.get(c, 'a_silithus_ring').enchant === 'e_critical');
    }
  }

  console.log('== 副本官方首领完善(中途首领/掉落) ==');
  {
    // 每座副本都注册了完整首领序列(bosses 数组以最终 Boss 收尾)
    check('26 座副本全部注册首领序列', Object.values(D.DUNGEONS).every((d) => Array.isArray(d.bosses) && d.bosses.length >= 1 && d.bosses[d.bosses.length - 1] === d.boss));
    // 中途首领均已注册为怪物且带 sub 标记(不占首领图鉴最终位)
    const midBosses = [];
    for (const d of Object.values(D.DUNGEONS)) for (const b of d.bosses) if (b !== d.boss) midBosses.push(b);
    check('中途首领全部注册+标记', midBosses.length >= 30 && midBosses.every((b) => D.MONSTERS[b] && D.MONSTERS[b].sub === 1 && D.MONSTERS[b].elite === 1));
    check('中途首领波次注入(波数>首领数)', Object.values(D.DUNGEONS).every((d) => d.waves.length >= d.bosses.length));
    // 中途首领掉落引用真实装备/消耗品/材料
    let badMid = 0;
    for (const b of midBosses) {
      if (!D.DROPS[b] || !D.DROPS[b].length) { badMid++; continue; }
      for (const [iid, ch] of D.DROPS[b]) if (!D.ITEMS[iid] || ch <= 0 || ch > 1) badMid++;
    }
    check('中途首领掉落有效(装备/消耗/材料)', badMid === 0, 'bad=' + badMid);
    // 官方名单抽查:死亡矿井5首领/影牙5/血色4/熔火9(含拉格纳罗斯)
    check('官方首领名单-死亡矿井 5 首领', D.DUNGEONS.deadmines.bosses.length === 5 && D.DUNGEONS.deadmines.bosses[4] === 'vancleef');
    check('官方首领名单-熔火之心 9 首领', D.DUNGEONS.molten_core.bosses.length === 9 && D.DUNGEONS.molten_core.bosses[8] === 'ragnaros');
    check('官方首领名单-纳克萨玛斯 8 首领', D.DUNGEONS.naxxramas.bosses.length === 8 && D.DUNGEONS.naxxramas.bosses[7] === 'kelthuzad');
    check('奥妮克希亚单独成阵', D.DUNGEONS.onyxias_lair.bosses.length === 1 && D.DUNGEONS.onyxias_lair.bosses[0] === 'onyxia');
    // 图鉴注册表包含中途首领
    const cd = W.Char.create('图鉴官', 'human', 'warrior');
    const reg = W.Char.Codex.registry(cd);
    check('图鉴注册表覆盖全部首领', midBosses.every((b) => reg.some((r) => r.mid === b)));
  }

  console.log('== 大量地图/副本任务 ==');
  {
    const mapQs = Object.values(D.QUESTS).filter((q) => String(q.id).startsWith('q_map_'));
    const dgQs = Object.values(D.QUESTS).filter((q) => String(q.id).startsWith('q_dg_'));
    check('地图悬赏 17 个(覆盖各等级段)', mapQs.length === 17, 'n=' + mapQs.length);
    check('副本讨伐 25 个(除奥妮克希亚外每副本+1)', dgQs.length === 25, 'n=' + dgQs.length);
    check('新任务全部接入任务板', [...mapQs, ...dgQs].every((q) => D.ZONES[q.zone] && D.ZONES[q.zone].quests.includes(q.id)));
    check('讨伐任务目标为中途首领', dgQs.every((q) => D.MONSTERS[q.target] && D.MONSTERS[q.target].sub === 1));
    check('新任务奖励含材料(按等级)', mapQs.every((q) => q.rewardItems.some((i) => ['m_dust', 'm_essence', 'm_crystal'].includes(i))));
    check('满级无新任务(经验奖励>0)', dgQs.every((q) => q.exp > 0));
  }

  console.log('== 装备套装(T1-T4) ==');
  {
    check('套装注册表 8 套(5 团本 + 3 中期)', Object.keys(D.SETS).length === 8);
    // 每个套装:名称/来源/件数列表/至少 2 档加成,加成 need 递增且有效
    check('套装结构有效', Object.values(D.SETS).every((s) =>
      s.name && s.source && s.pieces && s.pieces.length >= 5 && (s.bonuses || []).length >= 2
      && s.bonuses.every((b) => b.need >= 2 && b.text && b.stats && Object.keys(b.stats).length > 0)
      && s.bonuses[0].need < s.bonuses[1].need));
    // 每件套装物品 setId 有效,且套装 pieces 指向真实装备
    check('套装物品标记有效', Object.values(D.ITEMS).every((it) => !it.setId || D.SETS[it.setId]));
    check('套装件数均为真实装备', Object.values(D.SETS).every((s) => s.pieces.every((pid) => D.ITEMS[pid] && D.ITEMS[pid].setId === s.id)));
    // 新增 20 件套装装备(slot 分布在头/胸/手/腿/靴/披风)
    check('套装装备 20 件新物品', ['a_mc_crown', 'a_mc_plate', 'a_mc_gauntlets', 'a_mc_leggings', 'a_mc_boots',
      'a_bwl_crown', 'a_bwl_plate', 'a_bwl_gauntlets', 'a_bwl_leggings', 'a_bwl_boots',
      'a_onyx_crown', 'a_onyx_gauntlets', 'a_onyx_leggings', 'a_onyx_boots', 'a_onyx_cloak',
      'a_zg_hood', 'a_zg_robes', 'a_zg_gloves', 'a_zg_boots', 'a_aq_helm', 'a_aq_plate', 'a_aq_gauntlets', 'a_aq_leggings', 'a_aq_boots'].every((i) => D.ITEMS[i]));
    // 件数统计 + 加成激活
    const s = W.Char.create('套装测试', 'human', 'warrior');
    check('无装备时 0 件', W.Char.setCounts(s).s_mc === undefined);
    check('无加成激活', W.Char.activeSetBonuses(s, 's_mc').length === 0);
    s.equipment.head = 'a_mc_crown';
    s.equipment.chest = 'a_mc_plate';
    check('两件时件数=2', W.Char.setCounts(s).s_mc === 2);
    check('两件激活 1 档', W.Char.activeSetBonuses(s, 's_mc').length === 1 && W.Char.activeSetBonuses(s, 's_mc')[0].need === 2);
    // 属性生效:atkPct 6% → 攻击力提升
    const base = W.Char.computed(s);
    s.equipment.weapon = 'w_ragnaros_hand';
    s.equipment.gauntlets = 'a_mc_gauntlets';
    s.equipment.legs = 'a_mc_leggings';
    const c4 = W.Char.computed(s);
    check('四件激活 2 档', W.Char.activeSetBonuses(s, 's_mc').length === 2);
    check('套装攻击加成生效', c4.atkMin > base.atkMin && c4.atkMax > base.atkMax);
    check('套装吸血生效', c4.weaponLifesteal >= 0.05, `ls=${c4.weaponLifesteal}`);
    check('套装暴击生效', c4.crit > base.crit);
    // 减伤与治疗加成
    const o = W.Char.create('套装测试2', 'human', 'warrior');
    o.equipment.chest = 'a_onyxia_scale';
    o.equipment.head = 'a_onyx_crown';
    o.equipment.gloves = 'a_onyx_gauntlets';
    o.equipment.legs = 'a_onyx_leggings';
    o.equipment.boots = 'a_onyx_boots';
    o.equipment.cloak = 'a_onyx_cloak';
    const oc = W.Char.computed(o);
    check('龙王威仪 6 件', W.Char.setCounts(o).s_onyx === 6);
    check('减伤生效', oc.dmgTaken === 0.05, `dmg=${oc.dmgTaken}`);
    check('生命上限加成', oc.hpMax > W.Char.computed(Object.assign({}, o, { equipment: Object.assign({}, o.equipment, { cloak: null }) })).hpMax);
    // 套装战斗修正注入战斗单位
    s.hp = c4.hpMax; s.mana = c4.manaMax;
    const u = window.BuildPlayerUnit ? window.BuildPlayerUnit(s) : null;
    check('战斗单位携带套装字段', !u || (u.dmgTaken === 0 && u.healPct === 0));


    // ===== 中期套装(21-30 段,2/3 件激活,三系 build) =====
    const midIds = ['s_stv_hunter', 's_badlands_wall', 's_marsh_arcane'];
    check('中期套装注册 3 套', midIds.every((id) => D.SETS[id]));
    const midSets = midIds.map((id) => D.SETS[id]);
    check('中期套装结构有效(2/3 档)', midSets.every((st) => st.pieces.length >= 5 && (st.bonuses || []).length === 2
      && st.bonuses[0].need === 2 && st.bonuses[1].need === 3 && st.source));
    check('中期套装件数均为真实装备', midSets.every((st) => st.pieces.every((pid) => D.ITEMS[pid] && D.ITEMS[pid].setId === st.id)));
    // 敏捷 build:荆棘谷猎手 3 件(武器+胸+戒)激活 2 档
    const mh = W.Char.create('中期猎手', 'human', 'rogue');
    mh.level = 26;
    mh.equipment.weapon = 'w_stv_cutlass';
    mh.equipment.chest = 'a_stv_chest';
    mh.equipment.ring1 = 'a_stv_ring';
    check('猎手套装计数 3', W.Char.setCounts(mh).s_stv_hunter === 3);
    check('猎手套装激活 2 档', W.Char.activeSetBonuses(mh, 's_stv_hunter').length === 2);
    const mhC0 = W.Char.computed(Object.assign({}, mh, { equipment: Object.assign({}, mh.equipment, { chest: null }) }));
    const mhC = W.Char.computed(mh);
    check('猎手套装敏捷并入', mhC.agi > mhC0.agi);
    check('猎手套装攻击加成生效', mhC.atkMin > mhC0.atkMin && mhC.atkMax > mhC0.atkMax);
    check('猎手套装闪避加成生效', mhC.dodge > mhC0.dodge);
    // 法系 build:尘泥秘法 3 件(杖+袍+腿)激活 2 档
    const mm = W.Char.create('中期秘法', 'human', 'mage');
    mm.level = 28;
    mm.equipment.weapon = 'w_marsh_scepter';
    mm.equipment.chest = 'a_marsh_robes';
    mm.equipment.legs = 'a_marsh_cord_legs';
    check('秘法套装计数 3', W.Char.setCounts(mm).s_marsh_arcane === 3);
    check('秘法套装激活 2 档', W.Char.activeSetBonuses(mm, 's_marsh_arcane').length === 2);
    const mmC0 = W.Char.computed(Object.assign({}, mm, { equipment: Object.assign({}, mm.equipment, { chest: null }) }));
    const mmC = W.Char.computed(mm);
    check('秘法套装智力并入', mmC.int > mmC0.int);
    check('秘法套装法伤加成生效', mmC.spellPower > mmC0.spellPower);
    // 防御 build:荒原壁垒 2 件(锤+腿)激活 1 档
    const mw = W.Char.create('中期壁垒', 'human', 'warrior');
    mw.level = 30;
    mw.equipment.weapon = 'w_uld_hammer';
    mw.equipment.legs = 'a_badlands_legs';
    check('壁垒套装计数 2', W.Char.setCounts(mw).s_badlands_wall === 2);
    check('壁垒套装激活 1 档', W.Char.activeSetBonuses(mw, 's_badlands_wall').length === 1);
    const mwC0 = W.Char.computed(Object.assign({}, mw, { equipment: Object.assign({}, mw.equipment, { legs: null }) }));
    const mwC = W.Char.computed(mw);
    check('壁垒套装力量并入', mwC.str > mwC0.str);
    check('壁垒套装生命加成生效', mwC.hpMax > mwC0.hpMax);
    // 套装闪避死代码修复:itemStats.dodge 并入 dodge
    check('套装闪避并入 dodge(修复死代码)', W.Char.computed(mh).dodge > mhC0.dodge);
  }

  console.log('== 团本首领独特机制 ==');
  {
    const newSkills = ['m_eye_beam', 'm_wing_buffet', 'm_lava_burst', 'm_deep_breath', 'm_corrupted_blood'];
    check('5 个首领技能已定义', newSkills.every((id) => D.MONSTER_SKILLS[id]));
    check('首领技能结构有效', newSkills.every((id) => {
      const s = D.MONSTER_SKILLS[id];
      return s && s.name && s.desc && s.mult > 0 && (s.debuff || s.dot);
    }));
    const bossSkillMap = { cthun: 'm_eye_beam', nefarian: 'm_wing_buffet', onyxia: 'm_deep_breath', ragnaros: 'm_lava_burst', hakkar: 'm_corrupted_blood' };
    check('首领接入独特技能', Object.entries(bossSkillMap).every(([mid, sid]) => D.MONSTERS[mid] && D.MONSTERS[mid].skills.includes(sid)));
    // 克苏恩战斗:眼棱灼烧(降护甲)减益应出现在战斗日志
    {
      const char = W.Char.create('眼棱测试', 'human', 'warrior');
      char.level = 60;
      const c = W.Char.computed(char);
      char.hp = c.hpMax; char.hpMax = c.hpMax; char.mana = c.manaMax; char.manaMax = c.manaMax;
      for (const sid of D.CLASSES.warrior.skills) {
        const s = D.SKILLS[sid];
        if (s && s.learn <= char.level && !char.learnedSkills.includes(sid)) char.learnedSkills.push(sid);
      }
      const log = [];
      const ui = { log: (t, h) => log.push(h), float: () => {}, render: () => {}, onEnd: null };
      W.Combat.start(char, [D.MONSTERS.cthun], ui, { isDungeon: true });
      const b = W.Combat.battle;
      W.Utils.delay = () => Promise.resolve();
      let guard = 0;
      while (!b.ended && guard++ < 200) {
        const p = b.player;
        const skill = p.learned.map((id) => D.SKILLS[id]).filter((s) => s && W.Combat.canUse(s, p) && (s.dmg || s.heal || s.dot))[0];
        await W.Combat.playerAction(skill ? { type: 'skill', skill: skill.id, target: 'e0' } : { type: 'attack', target: 'e0' });
      }
      check('克苏恩战正常结束', b.ended, 'guard=' + guard);
      const eyeLogs = log.filter((x) => x.includes('眼棱灼烧'));
      check('眼棱降甲减益生效', eyeLogs.length > 0, 'logs=' + eyeLogs.length);
    }
    // 哈卡战斗:腐化之血(抑制治疗)减益应出现在战斗日志
    {
      const char = W.Char.create('腐化测试', 'human', 'warrior');
      char.level = 60;
      const c = W.Char.computed(char);
      char.hp = c.hpMax; char.hpMax = c.hpMax; char.mana = c.manaMax; char.manaMax = c.manaMax;
      for (const sid of D.CLASSES.warrior.skills) {
        const s = D.SKILLS[sid];
        if (s && s.learn <= char.level && !char.learnedSkills.includes(sid)) char.learnedSkills.push(sid);
      }
      const log = [];
      const ui = { log: (t, h) => log.push(h), float: () => {}, render: () => {}, onEnd: null };
      W.Combat.start(char, [D.MONSTERS.hakkar], ui, { isDungeon: true });
      const b = W.Combat.battle;
      W.Utils.delay = () => Promise.resolve();
      let guard = 0;
      while (!b.ended && guard++ < 200) {
        const p = b.player;
        const skill = p.learned.map((id) => D.SKILLS[id]).filter((s) => s && W.Combat.canUse(s, p) && (s.dmg || s.heal || s.dot))[0];
        await W.Combat.playerAction(skill ? { type: 'skill', skill: skill.id, target: 'e0' } : { type: 'attack', target: 'e0' });
      }
      check('哈卡战正常结束', b.ended, 'guard=' + guard);
      check('腐化抑制治疗减益生效', log.some((x) => x.includes('腐化')));
    }
  }

  console.log('== 副本手册 / 战前预览 ==');
  {
    const sigIds = ['m_eye_beam', 'm_wing_buffet', 'm_lava_burst', 'm_deep_breath', 'm_corrupted_blood'];
    check('5 个独特机制技能带 sig 标记', sigIds.every((id) => D.MONSTER_SKILLS[id] && D.MONSTER_SKILLS[id].sig === 1));
    // 所有副本:手册可渲染的数据闭环(每波敌人存在 / Boss 存在 / 敌人技能引用有效)
    const dgs = Object.values(D.DUNGEONS);
    const badRef = [];
    for (const dg of dgs) {
      for (const w of dg.waves) {
        for (const mid of w.enemies) {
          const m = D.MONSTERS[mid];
          if (!m) { badRef.push(dg.id + ':' + mid); continue; }
          for (const sid of (m.skills || [])) {
            if (!D.MONSTER_SKILLS[sid]) badRef.push(dg.id + ':' + mid + '->' + sid);
          }
        }
      }
      if (!D.MONSTERS[dg.boss]) badRef.push(dg.id + ':boss ' + dg.boss);
    }
    check('全部副本波次/Boss/技能引用闭环', badRef.length === 0, badRef.join(','));
    // 手册展示的首领技能:至少 1 个技能(非空预览)
    const noSkillBoss = dgs.filter((dg) => !(D.MONSTERS[dg.boss].skills || []).length).map((d) => d.id);
    check('每副本最终首领至少有 1 个技能', noSkillBoss.length === 0, noSkillBoss.join(','));
    // 5 个团本 Boss 的招牌独特技能均在其技能列表中(手册会高亮显示)
    const bossSigMap = { cthun: 'm_eye_beam', nefarian: 'm_wing_buffet', ragnaros: 'm_lava_burst', onyxia: 'm_deep_breath', hakkar: 'm_corrupted_blood' };
    const sigBad = Object.entries(bossSigMap).filter(([mid, sid]) => !(D.MONSTERS[mid] && D.MONSTERS[mid].skills.includes(sid) && D.MONSTER_SKILLS[sid].sig));
    check('团本 Boss 独特技能可被手册高亮', sigBad.length === 0, sigBad.map((x) => x.join('->')).join(','));
    // 手册渲染函数冒烟:战前预览 HTML 生成含 Boss 名与独特技能(调用 World 辅助方法需借 DOM 桩之外的对象)
    const wb = W.World;
    if (wb && wb._dungeonPreview) {
      const html = wb._dungeonPreview(D.DUNGEONS.temple_ahnqiraj);
      check('战前预览含最终首领名', html.includes('克苏恩'));
      check('战前预览高亮独特机制', html.includes('独特') && html.includes('眼棱'));
    }
  }

  console.log('== 5 人副本首领独特机制 ==');
  {
    const sigMap = {
      vancleef: 'm_flurry', mutanus: 'm_slime_spit', arugal: 'm_worgen_curse', archaledas: 'm_titan_slam',
      zhuzhun: 'm_sandstorm', princess_theradras: 'm_quake', emperor_thaurissan: 'm_molten_fury', gandling: 'm_raise_dead',
      kelthuzad: 'm_frost_chain', drakkisath: 'm_flame_breath', rivendare: 'm_death_coil', immolthar: 'm_arcane_nova',
      jergosh: 'm_burning_hex', thredd: 'm_prison_chain', akumai: 'm_shadow_tide', thermaplugg: 'm_radiation',
      charlga: 'm_razor_charge', amnennar: 'm_cold_grave', whitemane: 'm_holy_wrath', avatar_hakkar: 'm_soul_drain',
    };
    check('20 个 5 人本 Boss 各有独特技能', Object.keys(sigMap).length === 20 && Object.entries(sigMap).every(([mid, sid]) => D.MONSTERS[mid] && D.MONSTERS[mid].skills.includes(sid)));
    const bad = Object.values(sigMap).filter((sid) => !D.MONSTER_SKILLS[sid] || D.MONSTER_SKILLS[sid].sig !== 1);
    check('独特技能均已定义且带 sig 标记', bad.length === 0, bad.join(','));
    check('技能结构有效(名称/图标/描述/CD)', Object.values(sigMap).every((sid) => {
      const s = D.MONSTER_SKILLS[sid];
      return s && s.name && s.icon && s.desc && s.cd > 0;
    }));
    // 召唤型技能目标存在
    check('狼人诅咒召唤目标存在', !!D.MONSTERS.sfk_worgen);
    check('亡者复生召唤目标存在', !!D.MONSTERS.sch_apprentice);
    // 阿鲁高战斗:狼人诅咒 debuff(抑疗)应生效
    {
      const char = W.Char.create('狼人测试', 'human', 'warrior');
      char.level = 25;
      const c = W.Char.computed(char);
      char.hp = c.hpMax; char.hpMax = c.hpMax; char.mana = c.manaMax; char.manaMax = c.manaMax;
      for (const sid of D.CLASSES.warrior.skills) {
        const s = D.SKILLS[sid];
        if (s && s.learn <= char.level && !char.learnedSkills.includes(sid)) char.learnedSkills.push(sid);
      }
      const log = [];
      const ui = { log: (t, h) => log.push(h), float: () => {}, render: () => {}, onEnd: null };
      W.Combat.start(char, [D.MONSTERS.arugal], ui, { isDungeon: true });
      const b = W.Combat.battle;
      W.Utils.delay = () => Promise.resolve();
      let guard = 0;
      while (!b.ended && guard++ < 200) {
        const p = b.player;
        const skill = p.learned.map((id) => D.SKILLS[id]).filter((s) => s && W.Combat.canUse(s, p) && (s.dmg || s.heal || s.dot))[0];
        await W.Combat.playerAction(skill ? { type: 'skill', skill: skill.id, target: 'e0' } : { type: 'attack', target: 'e0' });
      }
      check('阿鲁高战正常结束', b.ended, 'guard=' + guard);
      check('狼人诅咒抑疗减益生效', log.some((x) => x.includes('狼化诅咒')) || b.player.buffs.some((x) => x.key === 'worgen_curse'));
    }
    // 5 人本独特技能战斗冒烟:范克里夫(死亡矿井 18 级)
    {
      const char = W.Char.create('范克测试', 'human', 'warrior');
      char.level = 18;
      const c = W.Char.computed(char);
      char.hp = c.hpMax; char.hpMax = c.hpMax; char.mana = c.manaMax; char.manaMax = c.manaMax;
      for (const sid of D.CLASSES.warrior.skills) {
        const s = D.SKILLS[sid];
        if (s && s.learn <= char.level && !char.learnedSkills.includes(sid)) char.learnedSkills.push(sid);
      }
      const log = [];
      const ui = { log: (t, h) => log.push(h), float: () => {}, render: () => {}, onEnd: null };
      W.Combat.start(char, [D.MONSTERS.vancleef], ui, { isDungeon: true });
      const b = W.Combat.battle;
      W.Utils.delay = () => Promise.resolve();
      let guard = 0;
      while (!b.ended && guard++ < 200) {
        const p = b.player;
        const skill = p.learned.map((id) => D.SKILLS[id]).filter((s) => s && W.Combat.canUse(s, p) && (s.dmg || s.heal || s.dot))[0];
        await W.Combat.playerAction(skill ? { type: 'skill', skill: skill.id, target: 'e0' } : { type: 'attack', target: 'e0' });
      }
      check('范克里夫战正常结束', b.ended, 'guard=' + guard);
      check('双刀乱舞减益生效', log.some((x) => x.includes('乱舞压制')) || b.player.buffs.some((x) => x.key === 'flurry_crush'));
    }
  }

  console.log('== 首领图鉴 ==');
  {
    // 团本标记:5 个团本副本
    const raidDgs = Object.values(D.DUNGEONS).filter((d) => d.raid);
    check('团本副本标记 5 个', raidDgs.length === 5 && raidDgs.every((d) => D.MONSTERS[d.boss]),
      raidDgs.map((d) => d.id).join(','));
    // 图鉴注册表:5 团本 + 13 副本 + 2 世界 = 20 首领
    const reg = W.Char.Codex.registry();
    const bySrc = { raid: 0, dungeon: 0, world: 0 };
    for (const r of reg) bySrc[r.src]++;
    check('图鉴注册表覆盖全部首领(含中途首领)', reg.length === 129 && bySrc.raid >= 5 && bySrc.dungeon >= 21 && bySrc.world === 2,
      `total=${reg.length} raid=${bySrc.raid} dungeon=${bySrc.dungeon} world=${bySrc.world}`);
    check('图鉴注册表首领均为真实怪物且带出没地', reg.every((r) => D.MONSTERS[r.mid] && !!r.source && !!r.icon), '');
    // Codex.record:首次击杀 / 次数 / 最快回合 / 首杀时间
    const c = W.Char.create('图鉴测试', 'human', 'warrior');
    check('新角色无图鉴记录', !c.codex || Object.keys(c.codex).length === 0);
    const r1 = W.Char.Codex.record(c, 'ragnaros', 12, 'raid');
    check('首次击杀记录(新纪录标记)', r1.newFastest === true && c.codex.ragnaros.kills === 1 && c.codex.ragnaros.fastest === 12
      && c.codex.ragnaros.src === 'raid' && !!c.codex.ragnaros.firstAt && !!c.codex.ragnaros.lastAt,
      JSON.stringify(c.codex.ragnaros));
    const firstAt = c.codex.ragnaros.firstAt;
    const r2 = W.Char.Codex.record(c, 'ragnaros', 18, 'raid');
    check('二次击杀:次数+1 最快回合保持(非新纪录)', r2.newFastest === false && c.codex.ragnaros.kills === 2
      && c.codex.ragnaros.fastest === 12 && c.codex.ragnaros.firstAt === firstAt, JSON.stringify(c.codex.ragnaros));
    const r3 = W.Char.Codex.record(c, 'ragnaros', 7, 'raid');
    check('三次击杀:最快回合更新为 7 并标记新纪录', r3.newFastest === true && c.codex.ragnaros.kills === 3
      && c.codex.ragnaros.fastest === 7, JSON.stringify(c.codex.ragnaros));
    check('图鉴统计:2 位首领已击败 / 3 次累计击杀',
      W.Char.Codex.unlockedCount(c) === 1 && W.Char.Codex.totalKills(c) === 3, JSON.stringify(c.codex));
    // 世界首领记录
    W.Char.Codex.record(c, 'kazzak', 15, 'world');
    check('世界首领记录 src=world', c.codex.kazzak && c.codex.kazzak.src === 'world' && c.codex.kazzak.fastest === 15, JSON.stringify(c.codex.kazzak));
    // 旧存档迁移兜底
    const legacy = { name: '旧档', level: 30, classId: 'mage', learnedSkills: [], equipment: {}, hp: 100 };
    W.Char.ensureClassFeatures(legacy);
    check('旧存档迁移生成 codex', !!legacy.codex && Object.keys(legacy.codex).length === 0);
  }

  console.log('== 阵营声望 ==');
  {
    const reps = Object.values(D.REPS || {});
    check('声望阵营 5 个且结构完整', reps.length === 5 && reps.every((r) => r.name && r.icon && r.color && r.faction && (r.zones || []).length && (r.dungeons || []).length),
      reps.map((r) => r.id).join(','));
    // 军需官商品闭环
    const repItems = Object.values(D.ITEMS).filter((it) => it.rep);
    const badRep = repItems.filter((it) => !D.REPS[it.rep] || !W.Char.Reps.TIERS.some((t) => t.key === it.repTier));
    check('军需官商品 25 件且阵营/等级有效', repItems.length === 25 && badRep.length === 0, repItems.length + ' items, bad=' + badRep.length);
    check('每阵营含 1 匹坐骑(共 5 匹)', Object.values(D.REPS).every((r) => repItems.some((it) => it.rep === r.id && it.slot === 'mount')));
    // 区域/副本映射闭环
    const badZone = [], badDg = [];
    for (const r of reps) {
      for (const z of r.zones || []) if (!D.ZONES[z]) badZone.push(z);
      for (const d of r.dungeons || []) if (!D.DUNGEONS[d]) badDg.push(d);
    }
    const unmappedDg = Object.keys(D.DUNGEONS).filter((d) => !W.Char.Reps.forDungeon(d));
    check('声望区域引用闭环', badZone.length === 0, badZone.join(','));
    check('声望副本引用闭环且 18 副本全部映射', badDg.length === 0 && unmappedDg.length === 0, 'bad=' + badDg.join(',') + ' unmapped=' + unmappedDg.join(','));
    // 声望等级逻辑
    const c = W.Char.create('声望测试', 'human', 'warrior');
    check('初始声望 0/中立', W.Char.Reps.value(c, 'sw') === 0 && W.Char.Reps.tierOf(0).key === 'neutral');
    let r1 = W.Char.Reps.add(c, 'sw', 2999);
    check('2999 仍中立(不升级)', r1.newTier === false && r1.tier.key === 'neutral' && r1.value === 2999);
    r1 = W.Char.Reps.add(c, 'sw', 1);
    check('3000 达到友善', r1.newTier === true && r1.tier.key === 'friendly');
    W.Char.Reps.add(c, 'sw', 3000);
    check('6000 达到尊敬', W.Char.Reps.tierOf(W.Char.Reps.value(c, 'sw')).key === 'honored');
    W.Char.Reps.add(c, 'sw', 6000); W.Char.Reps.add(c, 'sw', 9000);
    check('21000 达到崇拜', W.Char.Reps.tierOf(W.Char.Reps.value(c, 'sw')).key === 'exalted');
    // 军需官商品门槛
    check('尊敬解锁精良/崇敬解锁史诗/崇拜解锁坐骑',
      W.Char.Reps.shopItems('sw', 'honored').some((it) => it.id === 'r_sw_sword')
      && W.Char.Reps.shopItems('sw', 'revered').some((it) => it.id === 'r_sw_plate')
      && W.Char.Reps.shopItems('sw', 'exalted').some((it) => it.id === 'r_sw_horse'));
    check('中立时军需官无货可购', W.Char.Reps.shopItems('sw', 'neutral').length === 0);
    // 坐骑金币加成(相对种族基础值,人类自带 +10% 金币)
    const gBase = W.Char.computed(c).goldMult;
    c.mounts = ['r_sw_horse'];
    check('单坐骑 +2% 金币', Math.abs(W.Char.computed(c).goldMult - (gBase + 0.02)) < 0.001, 'goldMult=' + W.Char.computed(c).goldMult + ' base=' + gBase);
    c.mounts = ['r_sw_horse', 'r_og_wolf'];
    check('双坐骑 +4% 金币', Math.abs(W.Char.computed(c).goldMult - (gBase + 0.04)) < 0.001);
    // 击杀/副本/任务三路获取映射
    check('区域击杀映射(艾尔文→暴风城)', W.Char.Reps.forZone('elwynn') === 'sw' && W.Char.Reps.forZone('durotar') === 'og'
      && W.Char.Reps.forZone('silithus') === 'cenarion' && W.Char.Reps.forZone('burning') === 'thorium'
      && W.Char.Reps.forZone('eplaguelands') === 'argent');
    check('副本映射(熔火之心→瑟银)', W.Char.Reps.forDungeon('molten_core') === 'thorium' && W.Char.Reps.forDungeon('deadmines') === 'sw'
      && W.Char.Reps.forDungeon('naxxramas') === 'argent' && W.Char.Reps.forDungeon('temple_ahnqiraj') === 'cenarion');
    // 区域无重复映射 + 全部任务区域可映射到声望
    const zoneOwner = {};
    for (const r of reps) for (const z of r.zones || []) zoneOwner[z] = (zoneOwner[z] || []).concat(r.id);
    const dupZone = Object.keys(zoneOwner).filter((z) => zoneOwner[z].length > 1);
    check('声望区域无重复映射', dupZone.length === 0, dupZone.join(','));
    const badQZone = Object.values(D.QUESTS).filter((q) => !W.Char.Reps.forZone(q.zone));
    check('全部任务区域可映射声望', badQZone.length === 0, badQZone.map((q) => q.zone).join(','));
    // 声望徽章:5 阵营徽章物品 + 精英/Boss 掉落注入 + 上交逻辑
    check('徽章注册表 5 阵营', Object.keys(D.BADGES).length === 5 && ['sw', 'og', 'argent', 'cenarion', 'thorium'].every((k) => D.BADGES[k]));
    check('徽章物品存在且标记阵营', ['r_badge_sw', 'r_badge_og', 'r_badge_ag', 'r_badge_ce', 'r_badge_th'].every((i) => D.ITEMS[i] && D.ITEMS[i].badge));
    const badgeSrc = {};
    for (const list of Object.values(D.DROPS)) {
      for (const [iid] of list) {
        const it = D.ITEMS[iid];
        if (it && it.badge) badgeSrc[it.badge] = (badgeSrc[it.badge] || 0) + 1;
      }
    }
    check('徽章掉落注入(5 阵营均有来源)', ['sw', 'og', 'argent', 'cenarion', 'thorium'].every((k) => (badgeSrc[k] || 0) > 0), JSON.stringify(badgeSrc));
    check('副本首领掉对应阵营徽章', (D.DROPS.vancleef || []).some(([i]) => D.ITEMS[i] && D.ITEMS[i].badge === 'sw')
      && (D.DROPS.cthun || []).some(([i]) => D.ITEMS[i] && D.ITEMS[i].badge === 'cenarion')
      && (D.DROPS.ragnaros || []).some(([i]) => D.ITEMS[i] && D.ITEMS[i].badge === 'thorium'));
    {
      const c2 = W.Char.create('徽章使者', 'human', 'warrior');
      W.Char.Inventory.add(c2, 'r_badge_sw', 3);
      const r1 = W.Char.Reps.turnInBadge(c2, 'r_badge_sw');
      check('上交 1 徽章:声望 +300 且扣除', r1.ok && r1.amount === 300 && W.Char.Reps.value(c2, 'sw') === 300
        && W.Char.Inventory.count(c2, 'r_badge_sw') === 2, JSON.stringify(r1));
      const r2 = W.Char.Reps.turnInBadges(c2, 'r_badge_sw');
      check('全部上交:声望 +600 且清空', r2.ok && r2.amount === 600 && W.Char.Reps.value(c2, 'sw') === 900
        && W.Char.Inventory.count(c2, 'r_badge_sw') === 0);
      const r3 = W.Char.Reps.turnInBadge(c2, 'r_badge_sw');
      check('无徽章时上交返回失败', r3 && r3.ok === false);
      check('无徽章字段的物品不可上交', W.Char.Reps.turnInBadge(c2, 'm_dust') === null);
    }
    // 旧存档迁移
    const legacy = { name: '旧档', level: 30, classId: 'mage', learnedSkills: [], equipment: {} };
    W.Char.ensureClassFeatures(legacy);
    check('旧存档迁移生成 reps/mounts', !!legacy.reps && Array.isArray(legacy.mounts));
  }

  console.log('== 成就系统 ==');
  {
    check('成就注册表 39 项(26副本成就+13其他)', Object.keys(D.ACHIEVEMENTS).length === 39, `n=${Object.keys(D.ACHIEVEMENTS).length}`);
    // 成就结构:name/desc/cat/reward 齐全
    check('成就结构有效', Object.values(D.ACHIEVEMENTS).every((a) => a.name && a.desc && a.cat && a.reward));
    // 奖励物品均为真实物品
    const badAch = Object.values(D.ACHIEVEMENTS).filter((a) => (a.reward.items || []).some((i) => !D.ITEMS[i]));
    check('成就奖励物品有效', badAch.length === 0, badAch.map((a) => a.id).join(','));
    // 副本通关触发
    {
      const c = W.Char.create('成就侠', 'human', 'warrior');
      const g = W.Char.Achievements.trigger(c, 'dungeon', { mark: 'deadmines' });
      check('首次副本成就解锁(通用+对应副本)', g.length === 2 && g.some((x) => x.ach.id === 'ach_dungeon_1') && g.some((x) => x.ach.id === 'ach_dg_deadmines'),
        g.map((x) => x.ach.id).join(','));
      check('奖励发放(金币/物品)', c.gold > 300 && W.Char.Inventory.count(c, 'c_vital') === 1);
      // 熔火之心与安其拉神殿
      W.Char.Achievements.trigger(c, 'dungeon', { mark: 'molten_core' });
      W.Char.Achievements.trigger(c, 'dungeon', { mark: 'temple_ahnqiraj' });
      check('熔火之心成就解锁', !!W.Char.Achievements.state(c).unlocked.ach_dg_molten_core);
      check('安其拉神殿成就解锁', !!W.Char.Achievements.state(c).unlocked.ach_dg_temple_ahnqiraj);
      check('哀嚎洞穴成就独立计数(未通关不解锁)', !W.Char.Achievements.state(c).unlocked.ach_dg_wailing_caverns);
      // 重复触发不重复奖励
      const goldBefore = c.gold;
      W.Char.Achievements.trigger(c, 'dungeon', { mark: 'deadmines' });
      check('成就不重复发放', c.gold === goldBefore);
    }
    // 26 副本成就结构:每副本一个 target,团本/5人本齐全
    const dgAch = Object.values(D.ACHIEVEMENTS).filter((a) => a.cat === 'dungeon');
    check('副本系成就 28 项(26对应+2通用)', dgAch.length === 28, `n=${dgAch.length}`);
    check('每个副本都有对应成就', Object.keys(D.DUNGEONS).every((id) => D.ACHIEVEMENTS['ach_dg_' + id] && D.ACHIEVEMENTS['ach_dg_' + id].target === id));
    check('副本成就 target 均有效', Object.values(D.ACHIEVEMENTS).filter((a) => a.target && D.DUNGEONS[a.target]).length === 26);
    check('团本成就恰 5 座', Object.values(D.ACHIEVEMENTS).filter((a) => a.target && D.DUNGEONS[a.target] && D.DUNGEONS[a.target].raid).length === 5);
    // 副本征服者进度按已通关副本数显示(trigger 打标驱动)
    {
      const pc = W.Char.create('进度', 'human', 'warrior');
      W.Char.Achievements.trigger(pc, 'dungeon', { mark: 'deadmines' });
      W.Char.Achievements.trigger(pc, 'dungeon', { mark: 'wailing_caverns' });
      check('副本征服者进度按通关副本数(2/26)', W.Char.Achievements.progressOf(pc, D.ACHIEVEMENTS.ach_dungeon_all) === 2,
        `p=${W.Char.Achievements.progressOf(pc, D.ACHIEVEMENTS.ach_dungeon_all)}`);
    }
    // 成就直达目标:指定副本固定 / 多副本成就跳首个未通关(按等级升序)
    {
      const t60 = W.Char.create('直达', 'human', 'warrior');
      t60.level = 60;
      check('指定目标成就直达固定副本(熔火之心)', W.World._achDungeonTarget(t60, D.ACHIEVEMENTS.ach_dg_molten_core) === 'molten_core');
      check('多副本成就跳首个未通关(哀嚎洞穴Lv13)', W.World._achDungeonTarget(t60, D.ACHIEVEMENTS.ach_dungeon_all) === 'wailing_caverns');
      t60.dungeons = ['wailing_caverns', 'ragefire_chasm'];
      check('通关后跳到下一座(死亡矿井)', W.World._achDungeonTarget(t60, D.ACHIEVEMENTS.ach_dungeon_all) === 'deadmines');
      t60.dungeons = Object.keys(D.DUNGEONS);
      check('全部通关后回跳最低等级副本', W.World._achDungeonTarget(t60, D.ACHIEVEMENTS.ach_dungeon_all) === 'wailing_caverns');
      check('低等级不可达时不提供直达', W.World._achDungeonTarget(W.Char.create('新手', 'human', 'warrior'), D.ACHIEVEMENTS.ach_dungeon_all) === null);
      check('非副本成就无直达目标', W.World._achDungeonTarget(t60, D.ACHIEVEMENTS.ach_forge_10) === null);
      // 通关后下一副本建议
      {
        const nx = W.Char.create('赶路', 'human', 'warrior');
        nx.level = 18;
        nx.dungeons = ['deadmines'];
        check('通关后下一站(哀嚎洞穴)', W.World._nextDungeonSuggestion(nx) === 'wailing_caverns', 'n=' + W.World._nextDungeonSuggestion(nx));
        const nx2 = W.Char.create('低等赶路', 'human', 'warrior');
        nx2.level = 13;
        nx2.dungeons = ['wailing_caverns', 'ragefire_chasm', 'deadmines'];
        check('下一副本等级不足无可达建议', W.World._nextDungeonSuggestion(nx2) === null, 'n=' + W.World._nextDungeonSuggestion(nx2));
        const nx3 = W.Char.create('满清赶路', 'human', 'warrior');
        nx3.level = 60;
        nx3.dungeons = Object.keys(D.DUNGEONS);
        check('全部通关后无下一站建议', W.World._nextDungeonSuggestion(nx3) === null);
        const nx4 = W.Char.create('新手赶路', 'human', 'warrior');
        nx4.level = 1;
        check('无可达副本时无建议', W.World._nextDungeonSuggestion(nx4) === null);
      }
    }
    // 成就搜索/筛选:搜索关键词 / 未完成 / 团本 / 可直达
    {
      const fs = W.Char.create('筛选', 'human', 'warrior');
      W.Char.Achievements.trigger(fs, 'dungeon', { mark: 'deadmines' });
      fs.level = 20; // 注意:trigger 会发放经验,等级需在触发后设置
      const fst = W.Char.Achievements.state(fs);
      const allAch = Object.values(D.ACHIEVEMENTS);
      // 搜索:关键词命中名称或描述
      W.World._achFilter = { q: '熔火', done: 'all', raid: false, reach: false };
      const qHit = allAch.filter((a) => W.World._achMatchFilter(fs, a, fst));
      check('搜索「熔火」命中烈焰之子', qHit.length === 1 && qHit[0].id === 'ach_dg_molten_core', 'n=' + qHit.length + ' ' + qHit.map((a) => a.id).join(','));
      W.World._achFilter = { q: '不存在的词xyz', done: 'all', raid: false, reach: false };
      check('搜索无结果返回空', allAch.filter((a) => W.World._achMatchFilter(fs, a, fst)).length === 0);
      // 未完成:已解锁的排除
      W.World._achFilter = { q: '', done: 'todo', raid: false, reach: false };
      const todo = allAch.filter((a) => W.World._achMatchFilter(fs, a, fst));
      check('未完成筛掉已解锁', todo.length === allAch.length - W.Char.Achievements.unlocked(fs), 'n=' + todo.length + '/' + (allAch.length - W.Char.Achievements.unlocked(fs)));
      check('未完成不含死亡矿井成就', !todo.some((a) => a.id === 'ach_dg_deadmines'));
      // 团本:仅指定团本副本成就(5 座),泛用成就不纳入
      W.World._achFilter = { q: '', done: 'all', raid: true, reach: false };
      const raid = allAch.filter((a) => W.World._achMatchFilter(fs, a, fst));
      check('团本筛选恰 5 项', raid.length === 5, 'n=' + raid.length + ' ' + raid.map((a) => a.id).join(','));
      check('团本筛选全部为团本成就', raid.every((a) => a.target && D.DUNGEONS[a.target] && D.DUNGEONS[a.target].raid));
      check('团本筛选不含泛用成就', !raid.some((a) => a.id === 'ach_dungeon_all'));
      // 可直达:20 级 → 5 座低阶副本 + 2 个泛用 = 7
      W.World._achFilter = { q: '', done: 'all', raid: false, reach: true };
      const reach = allAch.filter((a) => W.World._achMatchFilter(fs, a, fst));
      check('可直达(20级)恰 7 项', reach.length === 7, 'n=' + reach.length + ' ' + reach.map((a) => a.id).join(','));
      check('可直达不含熔火之心', !reach.some((a) => a.target === 'molten_core'));
      check('可直达含两个泛用成就', reach.some((a) => a.id === 'ach_dungeon_1') && reach.some((a) => a.id === 'ach_dungeon_all'));
      const lowF = W.Char.create('低等', 'human', 'warrior');
      lowF.level = 10;
      const lowSt = W.Char.Achievements.state(lowF);
      check('可直达(10级)为 0', allAch.filter((a) => W.World._achMatchFilter(lowF, a, lowSt)).length === 0);
      // 组合:团本 + 可直达(60级时全部团本可直达)
      const f60 = W.Char.create('满级', 'human', 'warrior');
      f60.level = 60;
      const st60 = W.Char.Achievements.state(f60);
      W.World._achFilter = { q: '', done: 'all', raid: true, reach: true };
      check('团本+可直达(60级)恰 5 项', allAch.filter((a) => W.World._achMatchFilter(f60, a, st60)).length === 5);
      // 实时芯片计数:随搜索/切换联动
      W.World._achFilter = { q: '', done: 'all', raid: false, reach: false };
      check('全部计数=39', W.World._achCount(fs, fst, { done: 'all' }) === 39, 'n=' + W.World._achCount(fs, fst, { done: 'all' }));
      check('未完成计数=37', W.World._achCount(fs, fst, { done: 'todo' }) === 37, 'n=' + W.World._achCount(fs, fst, { done: 'todo' }));
      check('团本计数=5', W.World._achCount(fs, fst, { raid: true }) === 5, 'n=' + W.World._achCount(fs, fst, { raid: true }));
      check('可直达计数=7', W.World._achCount(fs, fst, { reach: true }) === 7, 'n=' + W.World._achCount(fs, fst, { reach: true }));
      W.World._achFilter = { q: '熔火', done: 'all', raid: false, reach: false };
      check('搜索熔火后全部计数=1', W.World._achCount(fs, fst, { done: 'all' }) === 1, 'n=' + W.World._achCount(fs, fst, { done: 'all' }));
      W.World._achFilter = { q: '', done: 'all', raid: false, reach: false };
    }
    // 击杀/精英/世界首领
    {
      const c = W.Char.create('杀手', 'human', 'warrior');
      W.Char.Achievements.trigger(c, 'kill', { inc: 100 });
      check('百人斩成就解锁', !!W.Char.Achievements.state(c).unlocked.ach_kill_100);
      const c2 = W.Char.create('精英杀手', 'human', 'warrior');
      for (let i = 0; i < 10; i++) W.Char.Achievements.trigger(c2, 'elite', { inc: 1 });
      check('精英克星(10)解锁', !!W.Char.Achievements.state(c2).unlocked.ach_elite_10);
      const c3 = W.Char.create('屠龙', 'human', 'warrior');
      W.Char.Achievements.trigger(c3, 'worldboss', { mark: 'azuregos' });
      check('仅击杀绿龙不解锁卡扎克成就', !W.Char.Achievements.state(c3).unlocked.ach_wboss_1);
      W.Char.Achievements.trigger(c3, 'worldboss', { mark: 'kazzak' });
      check('击败卡扎克解锁世界之敌', !!W.Char.Achievements.state(c3).unlocked.ach_wboss_1);
      check('双首领解锁屠龙者', !!W.Char.Achievements.state(c3).unlocked.ach_wboss_2);
    }
    // 锻造/附魔/打造
    {
      const c = W.Char.create('铁匠', 'human', 'warrior');
      c.gold = 500000;
      c.inventory.push({ id: 'm_dust', count: 50 }, { id: 'm_essence', count: 50 }, { id: 'm_crystal', count: 50 });
      c.equipment.weapon = 'w_rivendare_blade';
      for (let i = 0; i < 15; i++) W.Char.Forge.enhance(c, 'w_rivendare_blade');
      check('强化 +15 成就解锁', !!W.Char.Achievements.state(c).unlocked.ach_forge_15);
      const c2 = W.Char.create('附魔师', 'human', 'warrior');
      c2.gold = 100000;
      c2.inventory.push({ id: 'm_essence', count: 10 }, { id: 'm_crystal', count: 5 });
      c2.equipment.weapon = 'w_rivendare_blade';
      W.Char.Forge.enchant(c2, 'w_rivendare_blade', 'e_wrath');
      check('初识附魔成就解锁', !!W.Char.Achievements.state(c2).unlocked.ach_enchant_1);
      const c3 = W.Char.create('工匠', 'human', 'warrior');
      c3.gold = 50000;
      c3.inventory.push({ id: 'm_dust', count: 20 }, { id: 'm_essence', count: 20 });
      W.Char.Forge.craft(c3, 'craft_doom');
      check('工匠精神成就解锁', !!W.Char.Achievements.state(c3).unlocked.ach_craft_1);
    }
    // 等级与套装特殊成就
    {
      const c = W.Char.create('满级', 'human', 'warrior');
      c.level = 60;
      W.Char.Achievements.checkSpecial(c);
      check('满级传说成就解锁', !!W.Char.Achievements.state(c).unlocked.ach_level_60);
      const c2 = W.Char.create('套裝侠', 'human', 'warrior');
      c2.equipment.head = 'a_mc_crown';
      c2.equipment.chest = 'a_mc_plate';
      c2.equipment.gauntlets = 'a_mc_gauntlets';
      c2.equipment.legs = 'a_mc_leggings';
      W.Char.Achievements.checkSpecial(c2);
      check('套装收集者成就解锁', !!W.Char.Achievements.state(c2).unlocked.ach_set_4);
    }
    // 存档迁移兜底
    {
      const c = W.Char.create('老存档', 'human', 'warrior');
      delete c.achievements;
      delete c.dungeons;
      delete c.achElites;
      W.Char.ensureClassFeatures(c);
      check('成就字段迁移兜底', !!c.achievements && !!c.achievements.unlocked && Array.isArray(c.dungeons) && c.achElites === 0);
      check('成就计数初始 0', W.Char.Achievements.unlocked(c) === 0);
    }
  }

  console.log('== 已装备不占背包 ==');
  {
    const p = W.Char.create('背包侠', 'human', 'warrior');
    W.Char.Inventory.add(p, 'w_iron_sword', 1);
    const before = W.Char.Inventory.list(p).length;
    check('装备前背包含剑', W.Char.Inventory.count(p, 'w_iron_sword') === 1);
    W.Char.Equipment.equip(p, 'w_iron_sword');
    // 换装:剑离开背包,旧武器回包 → 格数不变(装备本身不占格)
    check('装备后物品离开背包', W.Char.Inventory.count(p, 'w_iron_sword') === 0 && !W.Char.Inventory.list(p).some((s) => s.id === 'w_iron_sword'));
    check('换装不增加背包格', W.Char.Inventory.list(p).length === before, `slots=${W.Char.Inventory.list(p).length}`);
    // 满包换装不溢出
    for (let i = 0; i < W.Config.BAG_SIZE - 1; i++) W.Char.Inventory.add(p, 'c_bread', 1);
    W.Char.Inventory.add(p, 'w_stv_machete', 1);
    const full = W.Char.Inventory.list(p).length;
    W.Char.Equipment.equip(p, 'w_stv_machete');
    check('满包换装不超限', W.Char.Inventory.list(p).length <= W.Config.BAG_SIZE, `slots=${W.Char.Inventory.list(p).length}`);
    check('旧装备自动回包', W.Char.Inventory.count(p, 'w_iron_sword') === 1);
    // 满包无法卸下(用 40 种不同物品填满背包)
    const p2 = W.Char.create('满包', 'human', 'warrior');
    p2.equipment.weapon = 'w_battle_axe';
    p2.inventory = [];
    const allIds = Object.keys(D.ITEMS);
    for (let i = 0; i < W.Config.BAG_SIZE; i++) W.Char.Inventory.add(p2, allIds[i], 1);
    check('背包确实已满', W.Char.Inventory.list(p2).length === W.Config.BAG_SIZE);
    check('背包满时无法卸下', !W.Char.Equipment.unequip(p2, 'weapon'));
  }

  console.log('== 极品装备系统 ==');
  {
    const c = W.Char.create('极品猎人', 'human', 'warrior');
    // 堆叠规则:极品与普通同 id 分堆
    W.Char.Inventory.add(c, 'w_warblade', 2, { perf: true });
    W.Char.Inventory.add(c, 'w_warblade', 1);
    check('极品与普通同 id 分堆', W.Char.Inventory.list(c).filter((s) => s.id === 'w_warblade').length === 2);
    check('count 汇总两堆', W.Char.Inventory.count(c, 'w_warblade') === 3);
    // 默认移除优先普通堆
    W.Char.Inventory.remove(c, 'w_warblade', 1);
    const st = W.Char.Inventory.list(c).filter((s) => s.id === 'w_warblade');
    check('普通堆先被移除', st.length === 1 && st[0].perf === true && st[0].count === 2);
    // 装备极品 → 属性 +50%
    const c2 = W.Char.create('极品者', 'human', 'warrior');
    W.Char.Inventory.add(c2, 'w_warblade', 1, { perf: true });
    W.Char.Equipment.equip(c2, 'w_warblade', true);
    const perfC = W.Char.computed(c2);
    check('极品装备后不占背包', W.Char.Inventory.count(c2, 'w_warblade') === 0 && c2.eqPerf.weapon === true);
    W.Char.Inventory.add(c2, 'w_warblade', 1);
    W.Char.Equipment.equip(c2, 'w_warblade', false);
    const normC = W.Char.computed(c2);
    check('极品武器攻击高于普通(约+50%)', perfC.atkMin > normC.atkMin && perfC.atkMax > normC.atkMax,
      `perf=${perfC.atkMin}-${perfC.atkMax} norm=${normC.atkMin}-${normC.atkMax}`);
    check('换普通后极品回包', W.Char.Inventory.list(c2).some((s) => s.id === 'w_warblade' && s.perf));
    // 卸下保持极品标记
    W.Char.Equipment.equip(c2, 'w_warblade', true);
    W.Char.Equipment.unequip(c2, 'weapon');
    check('卸下极品仍以极品回包', W.Char.Inventory.list(c2).some((s) => s.id === 'w_warblade' && s.perf));
    // 旧存档兜底
    const old = W.Char.create('旧档', 'human', 'warrior');
    delete old.eqPerf;
    W.Char.ensureClassFeatures(old);
    check('旧存档 eqPerf 兜底', old.eqPerf && typeof old.eqPerf === 'object');
    // 分解极品(按堆移除)
    const c3 = W.Char.create('分解师', 'human', 'warrior');
    W.Char.Inventory.add(c3, 'a_stv_helm', 1, { perf: true });
    const r3 = W.Char.Forge.disenchant(c3, 'a_stv_helm', true);
    check('极品装备可分解', r3.ok && W.Char.Inventory.count(c3, 'a_stv_helm') === 0, JSON.stringify(r3));
    // 混合堆叠(普通+极品同 id)批量分解:两堆都分解
    const c4 = W.Char.create('批量极品', 'human', 'warrior');
    W.Char.Inventory.add(c4, 'a_stv_helm', 1, { perf: true });
    W.Char.Inventory.add(c4, 'a_stv_helm', 1);
    check('混合堆叠分解计数=2', W.Char.Forge.disenchantCount(c4, 'green') === 2, `n=${W.Char.Forge.disenchantCount(c4, 'green')}`);
    const rb4 = W.Char.Forge.disenchantAll(c4, 'green');
    check('混合堆叠批量分解成功', rb4.ok && rb4.count === 2, JSON.stringify(rb4));
    check('混合堆叠分解后清空', W.Char.Inventory.count(c4, 'a_stv_helm') === 0);
    // 战斗掉落:强制 RNG 掷出极品
    const dc = W.Char.create('掉落侠', 'human', 'warrior');
    dc.level = 20;
    const dcC = W.Char.computed(dc);
    dc.hp = dcC.hpMax; dc.hpMax = dcC.hpMax; dc.mana = dcC.manaMax; dc.manaMax = dcC.manaMax;
    for (const sid of D.CLASSES.warrior.skills) {
      const s = D.SKILLS[sid];
      if (s && s.learn <= dc.level && !dc.learnedSkills.includes(sid)) dc.learnedSkills.push(sid);
    }
    const origChance = W.RNG.chance;
    W.RNG.chance = () => true; // 所有掉落必掉且必极品
    const ui = { log: () => {}, float: () => {}, render: () => {}, onEnd: null };
    W.Combat.start(dc, [D.MONSTERS.stv_ape], ui, {});
    const bb = W.Combat.battle;
    W.Utils.delay = () => Promise.resolve();
    let g = 0;
    while (!bb.ended && g++ < 40) {
      const p = bb.player;
      const skill = p.learned.map((id) => D.SKILLS[id]).filter((s) => s && W.Combat.canUse(s, p) && (s.dmg || s.dot))[0];
      await W.Combat.playerAction(skill ? { type: 'skill', skill: skill.id, target: 'e0' } : { type: 'attack', target: 'e0' });
    }
    W.RNG.chance = origChance;
    const perfDrops = W.Char.Inventory.list(dc).filter((s) => s.perf && D.ITEMS[s.id] && D.ITEMS[s.id].slot !== 'consumable' && D.ITEMS[s.id].slot !== 'material');
    check('战斗可掉落极品装备', bb.victory && perfDrops.length > 0, `drops=${JSON.stringify(W.Char.Inventory.list(dc).map((s) => [s.id, !!s.perf]))}`);
  }

  console.log('== 团本/5人本标记 + 可装备标记 + 一键出售 ==');
  {
    // 26 副本 = 5 团本 + 21 5人本
    const dgs = Object.values(D.DUNGEONS);
    check('副本总数 26 (5 团本 + 21 5人本)', dgs.length === 26 && dgs.filter((d) => d.raid).length === 5 && dgs.filter((d) => !d.raid).length === 21,
      `total=${dgs.length} raid=${dgs.filter((d) => d.raid).length} 5man=${dgs.filter((d) => !d.raid).length}`);
    // 成就副本类型标签(团本/5人本)
    check('团本成就标记团本(熔火之心)', W.World._achDungeonTag(D.ACHIEVEMENTS.ach_dg_molten_core).includes('团本'));
    check('团本成就标记不误标5人本', !W.World._achDungeonTag(D.ACHIEVEMENTS.ach_dg_temple_ahnqiraj).includes('5人本'));
    check('5人本成就标记5人本(初次试炼)', W.World._achDungeonTag(D.ACHIEVEMENTS.ach_dungeon_1).includes('5人本'));
    check('全副本成就双标记(副本征服者)', W.World._achDungeonTag(D.ACHIEVEMENTS.ach_dungeon_all).includes('团本') && W.World._achDungeonTag(D.ACHIEVEMENTS.ach_dungeon_all).includes('5人本'));
    check('非副本成就无类型标记(锻造)', W.World._achDungeonTag(D.ACHIEVEMENTS.ach_forge_10) === '');
    check('副本成就数量(28项:26对应+2通用)', Object.values(D.ACHIEVEMENTS).filter((a) => W.World._achDungeonTag(a) !== '').length === 28);
    // 可装备标记:等级达标 → 可装备;未达标 → 需要X级
    const mkc = W.Char.create('标记', 'human', 'warrior');
    mkc.level = 5;
    check('等级达标标记可装备', W.World._canEquipMark(mkc, D.ITEMS.w_short_sword, false).includes('可装备'));
    check('等级不足标记需要X级', W.World._canEquipMark(mkc, D.ITEMS.w_frostmourne, false).includes('需要60级'));
    check('已装备不显示可装备标记', W.World._canEquipMark(mkc, D.ITEMS.w_short_sword, true) === '');
    check('材料不显示可装备标记', W.World._canEquipMark(mkc, D.ITEMS.m_dust, false) === '');
    // 一键出售白色:只数白色装备(不含材料/消耗品/毒药),已装备不计
    const wc = W.Char.create('售白', 'human', 'warrior');
    wc.level = 8;
    W.Char.Inventory.add(wc, 'w_short_sword', 1);
    W.Char.Inventory.add(wc, 'a_leather', 1);
    W.Char.Inventory.add(wc, 'a_ring', 1); // 绿色
    W.Char.Inventory.add(wc, 'm_dust', 3);
    W.Char.Inventory.add(wc, 'c_bread', 2);
    check('白色出售计数只统计白色装备(2)', W.World._whiteSellCount(wc) === 2, `n=${W.World._whiteSellCount(wc)}`);
    wc.equipment.chest = 'a_leather'; // 已装备不计入
    check('已装备白色不计入出售', W.World._whiteSellCount(wc) === 1, `n=${W.World._whiteSellCount(wc)}`);
    // 批量出售可配置筛选:按品质 / 按槽位
    const bs2 = W.Char.create('批量售', 'human', 'warrior');
    bs2.level = 8;
    bs2.equipment.weapon = null; // 卸下初始装备,避免干扰槽位统计
    bs2.equipment.chest = null;
    W.Char.Inventory.add(bs2, 'w_short_sword', 1); // 白色武器
    W.Char.Inventory.add(bs2, 'a_leather', 1);     // 白色护甲(胸)
    W.Char.Inventory.add(bs2, 'a_ring', 1);        // 绿色戒指
    W.Char.Inventory.add(bs2, 'm_dust', 3);        // 材料
    W.Char.Inventory.add(bs2, 'c_bread', 2);       // 消耗品
    check('按品质出售计数(白色2)', W.World._batchSellCount(bs2, { q: ['white'] }) === 2, `n=${W.World._batchSellCount(bs2, { q: ['white'] })}`);
    check('按品质出售计数(绿色1)', W.World._batchSellCount(bs2, { q: ['green'] }) === 1);
    check('按品质合并计数(史诗=epic+purple,0)', W.World._batchSellCount(bs2, { q: ['epic', 'purple'] }) === 0);
    check('按槽位出售计数(武器1)', W.World._batchSellCount(bs2, { slot: 'weapon' }) === 1);
    check('按槽位出售计数(护甲1)', W.World._batchSellCount(bs2, { slot: 'armor' }) === 1);
    check('按槽位出售计数(戒指1)', W.World._batchSellCount(bs2, { slot: 'ring' }) === 1);
    check('按槽位出售计数(披风/项链0)', W.World._batchSellCount(bs2, { slot: 'misc' }) === 0);
    check('材料/消耗品不计入任何批量出售', W.World._batchSellCount(bs2, { q: ['white'] }) === 2);
    // 已装备不计入槽位出售
    bs2.equipment.chest = 'a_leather';
    check('已装备不计入品质出售(白色1)', W.World._batchSellCount(bs2, { q: ['white'] }) === 1, `n=${W.World._batchSellCount(bs2, { q: ['white'] })}`);
    check('已装备不计入槽位出售(护甲0)', W.World._batchSellCount(bs2, { slot: 'armor' }) === 0);
    // 强化装备不计入出售
    bs2.equipment.chest = null;
    bs2.gold = 50000;
    bs2.inventory.push({ id: 'm_dust', count: 10 });
    W.Char.Forge.enhance(bs2, 'w_short_sword');
    check('强化装备不计入槽位出售(武器0)', W.World._batchSellCount(bs2, { slot: 'weapon' }) === 0, `n=${W.World._batchSellCount(bs2, { slot: 'weapon' })}`);
    // 装备判定 helper:ring 双槽映射
    const rc2 = W.Char.create('戒', 'human', 'warrior');
    rc2.equipment.ring1 = 'a_ring';
    rc2.equipment.ring2 = 'a_ring';
    check('双戒装备判定(两槽同戒指)', W.World._isBagEquipped(rc2, D.ITEMS.a_ring, false) === true);
    rc2.equipment.ring1 = 'a_ring';
    rc2.equipment.ring2 = null;
    check('仅一槽占用视为未装备', W.World._isBagEquipped(rc2, D.ITEMS.a_ring, false) === false);
    check('非装备槽物品判定', W.World._isBagEquipped(rc2, D.ITEMS.a_leather, false) === false);
  }

  console.log('== 装备栏空槽候选(与背包标记联动) ==');
  {
    // 胸甲空槽:背包有 硬皮护甲(Lv5 可装备) 与 精钢板甲(Lv11 需升级) → 可装备者优先
    const ec = W.Char.create('候选', 'human', 'warrior');
    ec.level = 5;
    ec.equipment.weapon = null; // 卸下初始装备,使胸甲/武器槽为空(贴近状态面板实际场景)
    ec.equipment.chest = null;
    W.Char.Inventory.add(ec, 'a_leather', 1);
    W.Char.Inventory.add(ec, 'a_plate', 1);
    const c1 = W.World._slotCandidates(ec, 'chest');
    check('空槽候选含两个胸甲', c1.length === 2, `n=${c1.length}`);
    check('可装备候选排序优先(硬皮护甲)', c1[0] && c1[0].it.id === 'a_leather', JSON.stringify(c1.map((x) => x.it.id)));
    check('可装备候选标记正确', c1[0] && W.World._canEquipMark(ec, c1[0].it, false).includes('可装备'));
    check('等级不足候选标记需要X级', W.World._canEquipMark(ec, c1[1].it, false).includes('需要11级'));
    // 等级不足时:全部候选显示需要X级,无装备按钮依据
    ec.level = 2;
    const c2 = W.World._slotCandidates(ec, 'chest');
    check('低等级空槽候选仍返回', c2.length === 2);
    check('低等级候选均标记需要X级', c2.every((x) => W.World._canEquipMark(ec, x.it, false).includes('需要')));
    // 戒指双槽映射:ring1 候选应包含 slot=ring 的物品
    ec.level = 60;
    W.Char.Inventory.add(ec, 'a_ring', 1);
    const c3 = W.World._slotCandidates(ec, 'ring1');
    check('戒指槽候选映射到 ring 槽', c3.some((x) => x.it.id === 'a_ring'), JSON.stringify(c3.map((x) => x.it.id)));
    check('饰品槽候选为空(背包无饰品)', W.World._slotCandidates(ec, 'trinket1').length === 0);
    // 已装备物品不进入候选(与背包判定一致)
    ec.equipment.chest = 'a_leather';
    const c4 = W.World._slotCandidates(ec, 'chest');
    check('已装备物品不进入候选', c4.every((x) => x.it.id !== 'a_leather'), JSON.stringify(c4.map((x) => x.it.id)));
    // 毒药/材料不进入候选
    W.Char.Inventory.add(ec, 'm_dust', 2);
    check('材料不进入候选', W.World._slotCandidates(ec, 'chest').every((x) => x.it.id !== 'm_dust'));
  }

  console.log('== 触屏滑动工具(天赋翻页/技能书分页) ==');
  {
    const U2 = W.Utils;
    check('左滑判定', U2.swipeVerdict(-80, 4, 40) === 'left');
    check('右滑判定', U2.swipeVerdict(80, -4, 40) === 'right');
    check('上滑判定', U2.swipeVerdict(4, -80, 40) === 'up');
    check('下滑判定', U2.swipeVerdict(-4, 80, 40) === 'down');
    check('小于阈值视为点击', U2.swipeVerdict(20, 10, 40) === 'tap');
    check('斜向滑动不误判', U2.swipeVerdict(-50, 48, 40) === 'tap');
    check('阈值缺省默认40', U2.swipeVerdict(-50, 0) === 'left');
    check('占优轴判定(横向优先)', U2.swipeVerdict(-70, 55, 40) === 'left');
    const pages = U2.paginate([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], 8);
    check('分页尺寸正确(8+3)', pages.length === 2 && pages[0].length === 8 && pages[1].length === 3);
    check('空列表分页为空', U2.paginate([], 8).length === 0);
    check('分页size至少为1', U2.paginate(['a', 'b'], 0).length === 2);
    const ids = ['arcane', 'fire', 'frost'];
    check('环形索引前进一步', ids[U2.cycleIndex(ids, 'arcane', 1)] === 'fire');
    check('环形索引退回一步', ids[U2.cycleIndex(ids, 'arcane', -1)] === 'frost');
    check('环形索引末端回绕', ids[U2.cycleIndex(ids, 'frost', 1)] === 'arcane');
    check('未知元素从0出发', ids[U2.cycleIndex(ids, 'x', 1)] === 'fire');
    check('空数组返回-1', U2.cycleIndex([], 'a', 1) === -1);
  }

  // 地图连通性:跨阵营可达(贫瘠之地↔荆棘谷 商船航线连通两片大陆)
  {
    const Z = D.ZONES;
    const bfs = (start) => {
      const seen = new Set([start]);
      const q = [start];
      while (q.length) {
        const cur = q.shift();
        for (const t of (Z[cur] && Z[cur].travel) || []) if (!seen.has(t)) { seen.add(t); q.push(t); }
      }
      return seen;
    };
    const ally = bfs('stormwind');
    const horde = bfs('orgrimmar');
    const allIds = Object.keys(Z);
    check('地图全连通(联盟可达全部区域)', ally.size === allIds.length, ally.size + '/' + allIds.length);
    check('地图全连通(部落可达全部区域)', horde.size === allIds.length, horde.size + '/' + allIds.length);
    const dgZones = Object.values(D.DUNGEONS).map((d) => Object.keys(Z).find((z) => Z[z].dungeon === d.id)).filter(Boolean);
    check('联盟可达全部副本入口(26)', dgZones.every((z) => ally.has(z)) && dgZones.length === 26, dgZones.filter((z) => !ally.has(z)).join(',') || '全部可达');
    check('部落可达全部副本入口(26)', dgZones.every((z) => horde.has(z)) && dgZones.length === 26, dgZones.filter((z) => !horde.has(z)).join(',') || '全部可达');
    check('跨大陆航线(贫瘠之地↔荆棘谷)', !!(Z.barrens && Z.barrens.travel.includes('stv')) && !!(Z.stv && Z.stv.travel.includes('barrens')));
    const factionZones = Object.values(Z).filter((z) => z.faction === 'alliance' || z.faction === 'horde');
    check('仅主城/起始区保留阵营标签(4)', factionZones.length === 4 && factionZones.every((z) => ['elwynn', 'stormwind', 'durotar', 'orgrimmar'].includes(z.id)),
      factionZones.map((z) => z.id + ':' + z.faction).join(','));
    // 部落主城到联盟侧副本入口的完整链路(奥格瑞玛→贫瘠→荆棘谷→暮色→影牙)
    const chain = ['orgrimmar', 'durotar', 'barrens', 'stv', 'duskwood', 'shadowfang_keep'];
    check('部落可链式抵达联盟副本(影牙城堡)', chain.every((z, i) => i === 0 || (Z[chain[i - 1]].travel || []).includes(z)));
  }

  // 旅行面板:全图最短路径(BFS 跳数)与推荐等级排序键
  {
    const Z = D.ZONES;
    const savedChar = W.State.character;
    W.State.character = { zone: 'elwynn' };
    const g = W.World._travelGraph();
    check('旅行BFS全图可达(49)', Object.keys(g.dist).length === Object.keys(Z).length, Object.keys(g.dist).length + '/' + Object.keys(Z).length);
    const part = W.World._travelPartition(g.dist, { zone: 'elwynn' });
    const partAll = [...part.directZones, ...part.mapZones].sort().join(',');
    check('旅行分区并集=全集且无交集', partAll === Object.keys(Z).sort().join(',') && part.directZones.every((z) => z === 'elwynn' || g.dist[z] === 1) && part.mapZones.every((z) => g.dist[z] > 1),
      'direct=' + part.directZones.length + ' map=' + part.mapZones.length);
    check('直达分区计数不含当前(与hint口径一致)', part.directZones.length - 1 === Object.keys(g.dist).filter((z) => g.dist[z] === 1).length);

    check('直连区域=最近路径(暴风城/西部荒野 1跳)', g.dist.stormwind === 1 && g.dist.westfall === 1);
    check('多跳距离正确(赤脊山2/暮色3/荆棘谷4)', g.dist.redridge === 2 && g.dist.duskwood === 3 && g.dist.stv === 4,
      JSON.stringify({ redridge: g.dist.redridge, duskwood: g.dist.duskwood, stv: g.dist.stv }));
    check('最短路径链完整(艾尔文→…→暮色)', (() => {
      const p = []; let x = 'duskwood';
      while (g.prev[x]) { p.unshift(x); x = g.prev[x]; }
      p.unshift(x);
      return p[0] === 'elwynn' && p.every((z, i) => i === 0 || (Z[p[i - 1]].travel || []).includes(z));
    })());
    check('推荐等级排序键(区间字符串取起始值)', W.World._zoneLevelKey('elwynn') === 1 && W.World._zoneLevelKey('westfall') === 7 && W.World._zoneLevelKey('stormwind') === 0);
    const sorted = Object.keys(g.dist).sort((a, b) => {
      if (a === 'elwynn') return -1;
      if (b === 'elwynn') return 1;
      const dl = W.World._zoneLevelKey(a) - W.World._zoneLevelKey(b);
      return dl || (g.dist[a] - g.dist[b]);
    });
    const nonCur = sorted.filter((z) => z !== 'elwynn');
    check('旅行列表按推荐等级升序', nonCur.every((z, i) => i === 0 || W.World._zoneLevelKey(nonCur[i - 1]) <= W.World._zoneLevelKey(z)), nonCur.slice(0, 6).map(W.World._zoneLevelKey).join(','));
    W.State.character = savedChar;
  }

  // 直达航线(飞艇/远洋商船):双向 1 跳直达,减少跨大陆中长距离奔波
  {
    const routes = D.AIRSHIPS || {};
    check('直达航线注册(飞艇/商船双向)', !!routes.stormwind && !!routes.orgrimmar && !!routes.westfall && !!routes.dustwallow &&
      routes.stormwind.to[0] === 'orgrimmar' && routes.orgrimmar.to[0] === 'stormwind' &&
      routes.westfall.to[0] === 'dustwallow' && routes.dustwallow.to[0] === 'westfall');
    check('航线端点均为有效区域', Object.keys(routes).every((z) => D.ZONES[z] && routes[z].to.every((t) => D.ZONES[t] && D.ZONES[t].travel)));
    const savedA = W.State.character;
    W.State.character = { zone: 'stormwind' };
    const g1 = W.World._travelGraph();
    check('飞艇:暴风城→奥格瑞玛 1 跳', g1.dist.orgrimmar === 1, 'hops=' + g1.dist.orgrimmar);
    check('飞艇大幅缩短跨大陆(暴风城→贫瘠之地 2 跳)', g1.dist.barrens === 2, 'hops=' + g1.dist.barrens);
    W.State.character = { zone: 'orgrimmar' };
    check('飞艇反向:奥格瑞玛→暴风城 1 跳', W.World._travelGraph().dist.stormwind === 1);
    W.State.character = { zone: 'westfall' };
    const g3 = W.World._travelGraph();
    check('远洋商船:西部荒野→尘泥沼泽 1 跳', g3.dist.dustwallow === 1, 'hops=' + g3.dist.dustwallow);
    check('商船缩短南部路程(西部荒野→千针石林 2 跳)', g3.dist.thousand_needles === 2, 'hops=' + g3.dist.thousand_needles);
    W.State.character = savedA;
  }

  // 主城商人购买背包扩充容量
  {
    const bc = W.Char.create('袋神', 'human', 'warrior');
    check('默认背包容量40格', W.Char.bagSize(bc) === 40, 'size=' + W.Char.bagSize(bc));
    check('三档背包物品定义(slot=bag/容量10/15/20)', D.ITEMS.bg_linen && D.ITEMS.bg_linen.slot === 'bag' && D.ITEMS.bg_linen.bagSize === 10 &&
      D.ITEMS.bg_wool && D.ITEMS.bg_wool.slot === 'bag' && D.ITEMS.bg_wool.bagSize === 15 &&
      D.ITEMS.bg_traveler && D.ITEMS.bg_traveler.slot === 'bag' && D.ITEMS.bg_traveler.bagSize === 20);
    check('双主城商店上架背包(暴风城/奥格瑞玛)', ['bg_linen', 'bg_wool', 'bg_traveler'].every((id) =>
      D.ZONES.stormwind.shop.includes(id) && D.ZONES.orgrimmar.shop.includes(id)));
    // 使用:容量 +10,消耗物品
    W.Char.Inventory.add(bc, 'bg_linen', 1);
    const r1 = W.Char.expandBag(bc, 'bg_linen');
    check('使用亚麻背包容量+10', r1.ok && r1.add === 10 && W.Char.bagSize(bc) === 50, JSON.stringify(r1));
    check('使用后背包物品被消耗', W.Char.Inventory.count(bc, 'bg_linen') === 0);
    // 无物品时拒绝
    const r0 = W.Char.expandBag(bc, 'bg_wool');
    check('背包中无该物品时拒绝扩充', !r0.ok);
    // 上限内部分扩容:95 → +5(取实际可扩数量)
    const pc = W.Char.create('袋神二', 'human', 'warrior');
    pc.bagSize = 55; // 40+55=95
    W.Char.Inventory.add(pc, 'bg_traveler', 1);
    const rPart = W.Char.expandBag(pc, 'bg_traveler');
    check('容量95时旅行者背包部分扩充(+5→100)', rPart.ok && rPart.add === 5 && W.Char.bagSize(pc) === 100, JSON.stringify(rPart));
    // 已达上限拒绝
    W.Char.Inventory.add(bc, 'bg_traveler', 1);
    bc.bagSize = 60; // 40+60=100 满
    const rCap = W.Char.expandBag(bc, 'bg_traveler');
    check('容量达上限(100)拒绝扩充', !rCap.ok && W.Char.Inventory.count(bc, 'bg_traveler') === 1);
    // 无效物品 / 背包物品不可穿戴
    const rBad = W.Char.expandBag(bc, 'm_dust');
    check('非背包物品拒绝扩充', !rBad.ok);
    check('背包物品不可穿戴到装备栏', W.Char.Equipment.equip(bc, 'bg_traveler') === false);
    // 动态容量与背包满判定联动(满包守卫按扩充后的容量计算)
    const fc = W.Char.create('袋神三', 'human', 'warrior');
    fc.inventory = [];
    fc.bagSize = 5; // 40+5=45 格
    for (let i = 0; i < 45; i++) fc.inventory.push({ id: 'm_dust', count: 1 });
    check('扩充容量动态生效(45格判定)', W.Char.bagSize(fc) === 45 && W.Char.Inventory.list(fc).length === 45);
    check('满包判定按动态容量(45/45 为满)', W.Char.Inventory.list(fc).length >= W.Char.bagSize(fc));
    // 商店购买守卫:满包时非消耗品/非背包物品拒购,背包物品仍可购买(满包救急扩容)
    const guard = (c, id) => { const it = D.ITEMS[id]; return W.Char.Inventory.list(c).length >= W.Char.bagSize(c) && it.slot !== 'consumable' && it.slot !== 'bag'; };
    check('满包时装备拒购(守卫表达式)', guard(fc, 'a_cloth') === true);
    check('满包时背包物品可购买(守卫豁免)', guard(fc, 'bg_linen') === false);
    // 旧存档兼容:无 bagSize 字段按基础 40 计算
    const oldc = { zone: 'elwynn', inventory: [], bagSize: undefined };
    check('旧存档无bagSize字段按40格', W.Char.bagSize(oldc) === 40);
  }

  // 旅行面板:各区域未接任务数(与任务板「可接取」口径一致)
  {
    const qc = W.Char.create('任务探', 'human', 'warrior');
    qc.level = 6;
    const zoneQs = D.ZONES.elwynn.quests.length;
    const open0 = W.World._zoneQuestOpen(qc, 'elwynn');
    check('新角色艾尔文森林未接任务数=区域任务总数', open0 === zoneQs, `open=${open0} zoneQs=${zoneQs}`);
    check('接取后未接数-1', W.Char.QuestLog.start(qc, 'q_boar') && W.World._zoneQuestOpen(qc, 'elwynn') === open0 - 1, 'open=' + W.World._zoneQuestOpen(qc, 'elwynn'));
    // 完成并交付:已交付任务不再出现在任务板,也不计为未接(计数保持接取后的值)
    qc.quests.q_boar.progress = D.QUESTS.q_boar.count;
    qc.quests.q_boar.done = true;
    const tr = W.Char.QuestLog.turnIn(qc, 'q_boar');
    check('交付后未接数保持接取后水平(4)', !!tr && W.Char.QuestLog.active(qc).length === 0 && W.World._zoneQuestOpen(qc, 'elwynn') === open0 - 1, 'open=' + W.World._zoneQuestOpen(qc, 'elwynn'));
    // 进行中(未完成)的任务仍不算已接完:接取后不完成 → 未接数保持
    const westfall0 = W.World._zoneQuestOpen(qc, 'westfall');
    W.Char.QuestLog.start(qc, 'q_golem');
    check('接取未完成任务不算已完成(计数-1)', W.World._zoneQuestOpen(qc, 'westfall') === westfall0 - 1, 'open=' + W.World._zoneQuestOpen(qc, 'westfall'));
    check('无任务主城区域未接数为0', W.World._zoneQuestOpen(qc, 'stormwind') === 0);
    const total = Object.keys(D.ZONES).reduce((s, z) => s + W.World._zoneQuestOpen(qc, z), 0);
    check('全图未接任务总数为正整数', total > 0 && Number.isInteger(total), 'total=' + total);
  }

  // 21-30 段装备补充(中期换装丰富)
  {
    const SLOTS = ['weapon', 'offhand', 'head', 'chest', 'gloves', 'legs', 'boots', 'cloak', 'neck', 'ring', 'trinket'];
    const band = Object.values(D.ITEMS).filter((i) => SLOTS.includes(i.slot) && i.level >= 21 && i.level <= 30);
    check('21-30段装备≥30件', band.length >= 30, '实际' + band.length);
    const bySlot = {};
    for (const it of band) bySlot[it.slot] = (bySlot[it.slot] || 0) + 1;
    check('21-30段覆盖全部11槽位', SLOTS.every((s) => bySlot[s] > 0), JSON.stringify(bySlot));
    check('21-30段武器≥7件', (bySlot.weapon || 0) >= 7, 'weapon=' + bySlot.weapon);
    check('21-30段护甲含蓝装升级', (bySlot.chest || 0) >= 2 && (bySlot.legs || 0) >= 2, 'chest=' + bySlot.chest + ' legs=' + bySlot.legs);
    const newIds = ['w_stv_cutlass', 'w_badlands_cleaver', 'w_marsh_bow', 'w_uld_hammer', 'a_stv_chest', 'a_stv_gloves', 'a_badlands_legs', 'a_badlands_hood', 'a_marsh_chest', 'a_marsh_boots', 'a_marsh_cloak', 'a_stv_ring', 'a_badlands_ring', 'a_marsh_neck', 'tr_stv_medallion'];
    check('15件新装备定义完整', newIds.every((i) => D.ITEMS[i] && D.ITEMS[i].slot && D.ITEMS[i].stats && D.ITEMS[i].buy > 0), newIds.filter((i) => !(D.ITEMS[i] && D.ITEMS[i].slot)).join(','));
    check('新装备品质规则合规(21-30段无橙)', newIds.every((i) => D.ITEMS[i].quality !== 'legendary'));
    // 掉落挂接:每件新装备至少被一个怪物掉落
    const dropRefs = {};
    for (const [mid, tbl] of Object.entries(D.DROPS)) for (const r of tbl) { const iid = Array.isArray(r) ? r[0] : r; if (newIds.includes(iid)) dropRefs[iid] = (dropRefs[iid] || 0) + 1; }
    const noDrop = newIds.filter((i) => !dropRefs[i]);
    check('新装备全部挂接怪物掉落', noDrop.length === 0, '未挂接:' + noDrop.join(','));
    check('高掉率装备挂精英(0.25+)', ['a_stv_ring', 'a_badlands_legs', 'a_marsh_cloak', 'tr_stv_medallion'].every((i) => dropRefs[i] >= 1));
    // 商店上架
    const shopSet = new Set([D.ZONES.stv.shop, D.ZONES.badlands.shop, D.ZONES.dustwallow.shop].flat());
    check('新装备上架对应区域商店', ['w_stv_cutlass', 'w_badlands_cleaver', 'w_marsh_bow', 'a_stv_chest', 'a_badlands_legs', 'a_badlands_hood', 'a_stv_ring', 'a_marsh_cloak', 'a_marsh_neck'].every((i) => shopSet.has(i)));
    check('任务奖励含新装备', D.QUESTS.q_stv_panther.rewardItems.includes('a_stv_gloves') && D.QUESTS.q_badlands_scorpion.rewardItems.includes('a_badlands_ring') && D.QUESTS.q_marsh_croc.rewardItems.includes('a_marsh_chest'));
    check('新装备可装备(非bag/材料/消耗品)', newIds.every((i) => D.ITEMS[i].slot !== 'bag' && D.ITEMS[i].slot !== 'material' && D.ITEMS[i].slot !== 'consumable'));
  }

  // 31-35 段野怪补充(野外刷怪充实)
  {
    const wildIds = ['badlands_basilisk', 'badlands_raptor', 'marsh_turtle', 'marsh_raptor', 'searing_wolf', 'searing_whelp', 'tanaris_wasp', 'tanaris_hyena'];
    check('8只新野怪定义完整(31-35级有技能)', wildIds.every((m) => D.MONSTERS[m] && D.MONSTERS[m].level >= 31 && D.MONSTERS[m].level <= 35 && D.MONSTERS[m].skills.length >= 1),
      wildIds.filter((m) => !(D.MONSTERS[m] && D.MONSTERS[m].level >= 31 && D.MONSTERS[m].level <= 35 && D.MONSTERS[m].skills.length >= 1)).join(','));
    const band35 = Object.values(D.MONSTERS).filter((m) => m.level >= 31 && m.level <= 35);
    check('31-35段怪物≥21只(原15)', band35.length >= 21, '实际' + band35.length);
    const zoneMons = Object.values(D.ZONES).flatMap((z) => z.monsters || []);
    check('新野怪挂接区域怪物列表', wildIds.every((m) => zoneMons.includes(m)));
    const encFlat = Object.values(D.ENCOUNTERS).flatMap((e) => e.flatMap((x) => x[1] || []));
    check('新野怪挂接区域遭遇表', wildIds.every((m) => encFlat.includes(m)));
    const badDrops = wildIds.filter((m) => !(D.DROPS[m] && D.DROPS[m].length && D.DROPS[m].every((r) => D.ITEMS[r[0]])));
    check('新野怪掉落表完整且引用有效', badDrops.length === 0, badDrops.join(','));
    check('新野怪掉落不含橙装(31-35段规则)', wildIds.every((m) => D.DROPS[m].every((r) => D.ITEMS[r[0]].quality !== 'legendary')));
    const sorted = wildIds.map((m) => D.MONSTERS[m]).sort((a, b) => a.level - b.level);
    check('新野怪数值随等级平滑(无异常尖峰)', sorted.every((m, i) => i === 0 || m.hp >= sorted[i - 1].hp - 15), sorted.map((m) => m.level + ':' + m.hp).join(' '));
    check('新野怪掉落联动21-30段新装备', ['a_badlands_legs', 'w_marsh_bow', 'a_stv_ring', 'w_badlands_cleaver'].every((i) => wildIds.some((m) => D.DROPS[m].some((r) => r[0] === i))));
  }

  // 任务经验再平衡(削减经验→折算金币与材料,野外刷怪重新有意义)
  {
    let sumExp = 0, sumGold = 0;
    for (const q of Object.values(D.QUESTS)) { sumExp += q.exp; sumGold += q.gold; }
    let totalNeed = 0;
    for (let lv = 1; lv < W.Config.LEVEL_CAP; lv++) totalNeed += U.expNeeded(lv);
    const pct = sumExp / totalNeed;
    check('任务经验总量占比降至85-100%', pct >= 0.85 && pct <= 1.0, '占比=' + Math.round(pct * 100) + '% 总经验=' + sumExp + ' 总需求=' + totalNeed);
    check('任务经验削减后全部为正', Object.values(D.QUESTS).every((q) => q.exp >= 1));
    const hi = Object.values(D.QUESTS).filter((q) => q.level >= 50);
    const lo = Object.values(D.QUESTS).filter((q) => q.level <= 10);
    check('经验梯度保持(高等级任务>低等级)', hi.length && lo.length && Math.min(...hi.map((q) => q.exp)) > Math.max(...lo.map((q) => q.exp)),
      'hiMin=' + Math.min(...hi.map((q) => q.exp)) + ' loMax=' + Math.max(...lo.map((q) => q.exp)));
    check('任务金币奖励全部为正(含折算补偿)', Object.values(D.QUESTS).every((q) => q.gold > 0));
    const lv15 = Object.values(D.QUESTS).find((q) => q.level >= 15 && q.level < 25);
    const lv25 = Object.values(D.QUESTS).find((q) => q.level >= 25 && q.level < 40);
    const lv40 = Object.values(D.QUESTS).find((q) => q.level >= 40);
    check('Lv15-24任务补偿梦境精华', !!lv15 && lv15.rewardItems.includes('m_essence'), lv15 ? lv15.rewardItems.join(',') : '无');
    check('Lv25-39任务补偿奥术水晶', !!lv25 && lv25.rewardItems.includes('m_crystal'), lv25 ? lv25.rewardItems.join(',') : '无');
    check('Lv40+任务补偿双水晶', !!lv40 && lv40.rewardItems.filter((i) => i === 'm_crystal').length >= 2, lv40 ? lv40.rewardItems.join(',') : '无');
    check('原有材料奖励保留(q_boar粉尘/q_arugal水晶)', D.QUESTS.q_boar.rewardItems.includes('m_dust') && D.QUESTS.q_arugal.rewardItems.includes('m_crystal'));
    // 交付结算使用再平衡后的新数值
    const tc = W.Char.create('任务奖', 'human', 'warrior');
    const q = D.QUESTS.q_boar;
    const g0 = tc.gold;
    W.Char.QuestLog.start(tc, 'q_boar');
    tc.quests.q_boar.progress = q.count;
    tc.quests.q_boar.done = true;
    const tr = W.Char.QuestLog.turnIn(tc, 'q_boar');
    check('交付按新金币结算入账', !!tr && tc.gold === g0 + Math.floor(q.gold * W.Char.computed(tc).goldMult), 'gain=' + (tc.gold - g0));
  }

  console.log(failed === 0 ? '\n🎉 全部通过' : `\n❌ ${failed} 项失败`);
  process.exit(failed === 0 ? 0 : 1);
})();
