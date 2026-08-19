/* 魔兽世界 · 战大陆 — 角色系统:创建 / 属性派生 / 升级 / 技能 / 装备 / 背包 */
(function () {
  'use strict';
  const W = window.WOW;
  const D = W.Data;
  const U = W.Utils;

  /* ---------- 被动技能(常驻) ---------- */
  // 已习得被动技能的效果汇总:属性类在 computed() 生效,战斗类(onHit/thorns)由战斗单位携带
  function passiveMods(char) {
    const mod = {};
    for (const sid of (char.learnedSkills || [])) {
      const s = D.SKILLS[sid];
      if (s && s.passive && s.mod) {
        for (const k in s.mod) mod[k] = (mod[k] || 0) + s.mod[k];
      }
    }
    // 天赋强化被动:强化类天赋 buffPct(强化切割/强化战斗怒吼/强化嗜血/强化形态)对已转被动的 buff 技能同样生效
    const tm = talentMods(char);
    for (const sid in tm.buffPct) {
      const s = D.SKILLS[sid];
      if (s && s.passive && s.mod) {
        if (s.mod.atkPct != null) mod.atkPct = (mod.atkPct || 0) + tm.buffPct[sid];
        if (s.mod.armorPct != null) mod.armorPct = (mod.armorPct || 0) + tm.buffPct[sid];
      }
    }
    return mod;
  }

  /* ---------- 装备套装 ---------- */
  // 统计每套已装备件数:{ setId: count }
  function setCounts(char) {
    const out = {};
    const eq = char.equipment || {};
    for (const slot in eq) {
      const item = eq[slot] ? D.ITEMS[eq[slot]] : null;
      if (item && item.setId) out[item.setId] = (out[item.setId] || 0) + 1;
    }
    return out;
  }
  // 某套当前激活的加成:{need, text, stats}
  function activeSetBonuses(char, setId) {
    const set = D.SETS[setId];
    if (!set) return [];
    const n = setCounts(char)[setId] || 0;
    return (set.bonuses || []).filter((b) => n >= b.need);
  }
  // 套装战斗修正合计(并入被动 mod):atkPct/spellPowerPct/armorPct/healPct/dmgTaken/lifesteal/dodge/crit 等
  function setMods(char) {
    const sm = {};
    const counts = setCounts(char);
    for (const setId in counts) {
      const set = D.SETS[setId];
      if (!set) continue;
      for (const b of set.bonuses || []) {
        if (counts[setId] >= b.need) {
          for (const k in (b.stats || {})) sm[k] = (sm[k] || 0) + b.stats[k];
        }
      }
    }
    return sm;
  }

  /* ---------- 被动实时加成(总览面板用):删除该被动后重算属性差值 + 战斗类效果实际数值 ----------
     注意:纯计算函数,不校验是否已习得——未习得时返回空差值/空战斗效果,调用方需自行判断习得状态 */
  // 属性差值对比(两个 computed 结果):返回 [{label,text}] 列表(passiveLiveEffects / passiveLiveTotal 共用)
  function diffComputed(c0, c1) {
    const delta = [];
    const dMin = c0.atkMin - c1.atkMin, dMax = c0.atkMax - c1.atkMax;
    if (dMin !== 0 || dMax !== 0) delta.push({ label: '攻击', text: `${dMin > 0 ? '+' : ''}${dMin}~${dMax > 0 ? '+' : ''}${dMax}` });
    const armorD = c0.armor - c1.armor;
    if (armorD !== 0) delta.push({ label: '护甲', text: `${armorD > 0 ? '+' : ''}${armorD}` });
    for (const [k, label] of [['crit', '暴击'], ['dodge', '闪避'], ['hit', '命中']]) {
      const d = c0[k] - c1[k];
      if (d !== 0) delta.push({ label, text: `${d > 0 ? '+' : ''}${Math.round(d * 1000) / 10}%` });
    }
    const hpD = c0.hpMax - c1.hpMax;
    if (hpD !== 0) delta.push({ label: '生命', text: `${hpD > 0 ? '+' : ''}${hpD}` });
    const spD = c0.spellPower - c1.spellPower;
    if (spD !== 0) delta.push({ label: '法强', text: `${spD > 0 ? '+' : ''}${spD}` });
    const manaD = c0.manaMax - c1.manaMax;
    if (manaD !== 0) delta.push({ label: '法力', text: `${manaD > 0 ? '+' : ''}${manaD}` });
    return delta;
  }

  function passiveLiveEffects(char, skillId) {
    const s = D.SKILLS[skillId];
    if (!s || !s.passive) return null;
    const c0 = computed(char);
    const clone = Object.assign({}, char, { learnedSkills: (char.learnedSkills || []).filter((x) => x !== skillId) });
    const c1 = computed(clone);
    const delta = diffComputed(c0, c1);
    const battle = [];
    const mod = s.mod || {};
    const tm = talentMods(char);
    if (mod.startShield || mod.startShieldSp) {
      const amt = Math.max(1, Math.round((mod.startShield + (mod.startShieldSp || 0) * c0.spellPower) * (1 + (tm.shieldPct || 0))));
      battle.push(`战斗开始获得 ${amt} 点吸收护盾${mod.shieldHeal ? `，受击恢复 ${mod.shieldHeal} 生命` : ''}`);
    } else if (mod.shieldHeal) {
      battle.push(`护盾期间受击恢复 ${mod.shieldHeal} 生命`);
    }
    if (mod.markTaken) {
      const pct = mod.markTaken + ((tm.debuffPct && tm.debuffPct[skillId]) || 0);
      battle.push(`自动标记首个敌人，其受伤 +${Math.round(pct * 100)}%`);
    }
    if (mod.petAtkPct) battle.push(`宠物攻击力 +${Math.round(mod.petAtkPct * 100)}%`);
    if (mod.onHit) battle.push(`每次攻击附加 ${mod.onHit} 点神圣伤害`);
    if (mod.thorns) battle.push(`受到近战攻击反弹 ${mod.thorns} 点自然伤害`);
    return { delta, battle };
  }

  // 被动加成总量:一次性移除全部已习得被动后重算属性差(避免逐技能求和因百分比叠乘产生的二次折算误差),返回与 passiveLiveEffects 同格式的 delta 数组
  function passiveLiveTotal(char) {
    const isPassive = (id) => { const s = D.SKILLS[id]; return s && s.passive; };
    const learned = (char.learnedSkills || []).filter(isPassive);
    if (!learned.length) return [];
    const c0 = computed(char);
    const clone = Object.assign({}, char, { learnedSkills: (char.learnedSkills || []).filter((id) => !isPassive(id)) });
    const c1 = computed(clone);
    const delta = diffComputed(c0, c1);
    return delta;
  }

  /* ---------- 属性派生 ---------- */
  function computed(char) {
    const race = D.RACES[char.race];
    const cls = D.CLASSES[char.classId];
    const lvl = char.level;
    const eq = char.equipment;
    const tm = talentMods(char);
    const pm = passiveMods(char); // 被动技能常驻加成
    const sm = setMods(char);      // 装备套装加成
    // 套装百分比修正(覆盖式叠加到被动 mod,供派生公式使用)
    const spm = Object.assign({}, pm);
    for (const k of ['atkPct', 'spellPowerPct', 'armorPct', 'healPct', 'dmgTaken']) {
      if (sm[k]) spm[k] = (spm[k] || 0) + sm[k];
    }

    let str = race.base.str + cls.base.str + cls.growth.str * (lvl - 1);
    let agi = race.base.agi + cls.base.agi + cls.growth.agi * (lvl - 1);
    let stam = race.base.stam + cls.base.stam + cls.growth.stam * (lvl - 1);
    let int = race.base.int + cls.base.int + cls.growth.int * (lvl - 1);
    let spi = race.base.spi + cls.base.spi + cls.growth.spi * (lvl - 1);

    // 装备属性
    let itemArmor = 0;
    const itemStats = {};
    const weapon = eq.weapon ? D.ITEMS[eq.weapon] : null;
    const up = char.upgrades || {};
    const ubonus = { dmg: 0, armor: 0, crit: 0, dodge: 0, hp: 0, lifesteal: 0, str: 0, agi: 0, stam: 0, int: 0, spi: 0 };
    for (const slot of ['weapon', 'offhand', 'head', 'chest', 'gloves', 'legs', 'boots', 'cloak', 'neck', 'ring1', 'ring2', 'trinket1', 'trinket2']) {
      const item = eq[slot] ? D.ITEMS[eq[slot]] : null;
      if (!item) continue;
      // 极品装备(perf):属性 ×PERFECT_STAT_MULT
      const pmult = (char.eqPerf && char.eqPerf[slot]) ? W.Config.PERFECT_STAT_MULT : 1;
      if (item.stats) {
        for (const k in item.stats) {
          if (k === 'armor') itemArmor += Math.round(item.stats[k] * pmult);
          else if (k === 'dmg') continue;
          else if (k === 'crit') itemStats.crit = (itemStats.crit || 0) + Math.round(item.stats.crit * pmult * 100) / 100;
          else itemStats[k] = (itemStats[k] || 0) + Math.round(item.stats[k] * pmult);
        }
      }
      // 强化 / 附魔加成
      const ub = upgradeBonus(item, up[item.id]);
      ubonus.dmg += ub.dmg; ubonus.armor += ub.armor; ubonus.crit += ub.crit;
      ubonus.dodge += ub.dodge; ubonus.hp += ub.hp; ubonus.lifesteal += ub.lifesteal;
      for (const k of ['str', 'agi', 'stam', 'int', 'spi']) ubonus[k] += ub[k];
    }
    itemArmor += ubonus.armor;
    itemStats.crit = (itemStats.crit || 0) + ubonus.crit;
    for (const k of ['str', 'agi', 'stam', 'int', 'spi']) itemStats[k] = (itemStats[k] || 0) + ubonus[k];
    // 套装:属性类加成直接并入(含护甲/生命/闪避/暴击/吸血)
    for (const k of ['str', 'agi', 'stam', 'int', 'spi']) itemStats[k] = (itemStats[k] || 0) + (sm[k] || 0);
    itemStats.crit = (itemStats.crit || 0) + (sm.crit || 0);
    itemStats.dodge = (itemStats.dodge || 0) + (sm.dodge || 0);
    ubonus.armor += sm.armor || 0;
    ubonus.hp += sm.hp || 0;
    ubonus.lifesteal += sm.lifesteal || 0;
    str += itemStats.str || 0; agi += itemStats.agi || 0; stam += itemStats.stam || 0;
    int += itemStats.int || 0; spi += itemStats.spi || 0;

    // 种族百分比修正
    for (const t of race.traits || []) {
      if (t.passive && t.mod) {
        if (t.mod.int) int = Math.floor(int * (1 + t.mod.int));
        if (t.mod.spi) spi = Math.floor(spi * (1 + t.mod.spi));
      }
    }
    // 天赋:基础属性百分比
    if (tm.statPct.int) int = Math.floor(int * (1 + tm.statPct.int));
    if (tm.statPct.spi) spi = Math.floor(spi * (1 + tm.statPct.spi));

    // 派生
    let hpMax = Math.floor(40 + lvl * 10 + stam * 5);
    let manaMax = (cls.res === 'mana') ? Math.floor(25 + lvl * 12 + int * 9) : 0;
    const armorTypeBonus = { plate: 4, mail: 3, leather: 2, cloth: 1 }[cls.armorType] || 2;
    const armor = Math.floor((itemArmor + lvl * armorTypeBonus) * (1 + tm.armorPct) * (1 + (spm.armorPct || 0)));

    const physical = cls.res === 'rage' || cls.res === 'energy' || cls.id === 'hunter';
    const ap = Math.floor(((physical ? (cls.id === 'hunter' || cls.id === 'rogue' ? agi : str) : str) * 2 + lvl * 2) * (1 + tm.apPct));
    const spellPower = Math.floor(int * 1.25 * (1 + tm.spellPowerPct) * (1 + (spm.spellPowerPct || 0)));

    // 武器伤害区间(极品 ×倍率;含强化/附魔附加伤害)
    const wpm = (char.eqPerf && char.eqPerf.weapon) ? W.Config.PERFECT_STAT_MULT : 1;
    const wMin = Math.round((weapon && weapon.stats && weapon.stats.dmg ? weapon.stats.dmg[0] : 3) * wpm) + (weapon ? ubonus.dmg : 0);
    const wMax = Math.round((weapon && weapon.stats && weapon.stats.dmg ? weapon.stats.dmg[1] : 5) * wpm) + (weapon ? ubonus.dmg : 0);
    const atkMin = Math.max(1, Math.floor((wMin + Math.floor(ap / 14)) * (1 + (spm.atkPct || 0))));
    const atkMax = Math.max(2, Math.floor((wMax + Math.floor(ap / 14)) * (1 + (spm.atkPct || 0))));

    // 战斗修正
    let hit = W.Config.HIT_BASE, dodge = W.Config.DODGE_BASE + agi * W.Config.DODGE_PER_AGI + ubonus.dodge + (itemStats.dodge || 0);
    let crit = W.Config.CRIT_BASE + agi * W.Config.CRIT_PER_AGI + (itemStats.crit || 0);
    for (const t of race.traits || []) {
      if (t.passive && t.mod) {
        if (t.mod.hit) hit += t.mod.hit;
        if (t.mod.dodge) dodge += t.mod.dodge;
      }
    }
    // 被动技能:战斗修正
    hit += pm.hit || 0;
    dodge += pm.dodge || 0;
    crit += pm.crit || 0;
    // 天赋:战斗修正
    hit += tm.stat.hit || 0;
    dodge += tm.stat.dodge || 0;
    crit += tm.stat.crit || 0;

    const resists = {
      fire: 0, frost: 0, nature: 0, shadow: 0, arcane: 0, holy: 0,
    };
    for (const t of race.traits || []) {
      if (t.passive && t.mod) {
        for (const r of ['fire', 'frost', 'nature', 'shadow', 'arcane']) {
          if (t.mod[r + 'Resist']) resists[r] += t.mod[r + 'Resist'];
        }
      }
    }

    // 种族修正(全局)
    let hpMult = 1, goldMult = 1, ccReduce = 0, regenPct = 0, petDmgMult = 1, beastDmg = 0;
    for (const t of race.traits || []) {
      if (t.passive && t.mod) {
        if (t.mod.hp) hpMult += t.mod.hp;
        if (t.mod.gold) goldMult += t.mod.gold;
        if (t.mod.ccReduce) ccReduce += t.mod.ccReduce;
        if (t.mod.regen) regenPct += t.mod.regen;
        if (t.mod.petDmg) petDmgMult += t.mod.petDmg;
        if (t.mod.beastDmg) beastDmg += t.mod.beastDmg;
      }
    }
    // 坐骑收藏:每匹坐骑 +2% 金币获取
    goldMult += 0.02 * ((char.mounts || []).length);
    hpMax = Math.floor(hpMax * hpMult * (1 + tm.hpPct)) + ubonus.hp;

    return {
      lvl, str, agi, stam, int, spi,
      hpMax, manaMax, armor, ap, spellPower, atkMin, atkMax,
      hit: U.clamp01(hit), dodge: U.clamp01(dodge), crit: U.clamp01(crit),
      resists, goldMult, ccReduce, regenPct, petDmgMult, beastDmg,
      weaponLifesteal: ubonus.lifesteal,
      critMult: tm.critMult,
      healPct: sm.healPct || 0,
      dmgTaken: sm.dmgTaken || 0,
      manaRegen: manaMax ? Math.floor((manaMax * W.Config.MANA_REGEN_PCT + spi * 0.4) * (1 + tm.manaRegenPct + (pm.manaRegenPct || 0))) : 0,
      hpRegen: Math.floor(stam * 0.15 + spi * 0.08),
      race, cls, weapon, talents: tm,
    };
  }

  /* ---------- 角色创建 ---------- */
  function create(name, raceId, classId) {
    const cls = D.CLASSES[classId];
    const skills = [];
    for (const sid of cls.skills) {
      const s = D.SKILLS[sid];
      if (s && s.learn <= 1) skills.push(sid);
    }
    // 种族天赋技能
    const race = D.RACES[raceId];
    for (const t of race.traits || []) {
      if (t.active && D.SKILLS[t.active]) skills.push(t.active);
    }
    const char = {
      name, race: raceId, classId, faction: race.faction,
      level: 1, exp: 0,
      hp: 0, hpMax: 0, mana: 0, manaMax: 0, rage: 0, energy: W.Config.ENERGY_MAX, combo: 0,
      gold: 300, // 3 银
      inventory: [{ id: 'c_bread', count: 5 }],
      equipment: { weapon: 'w_wooden_staff', offhand: null, head: null, chest: 'a_cloth', gloves: null, legs: null, boots: null, cloak: null, neck: null, ring1: null, ring2: null },
      learnedSkills: skills,
      quests: {},          // { questId: {progress, done} }
      completedQuests: [],
      zone: race.faction === 'alliance' ? 'elwynn' : 'durotar',
      visited: [],
      dungeon: null,       // {id, wave}
      kills: 0, deaths: 0, playTime: 0,
      flags: {},
      talents: {},         // { treeId: { talentId: rank } } 三系天赋树
      pets: [],            // 宠物栏(猎人可驯服/切换)
      activePet: null,     // 当前出战宠物 id
      soulShards: 0,       // 术士灵魂碎片
      poison: null,        // 盗贼已涂抹毒药 {id, charges}
      elites: {},          // 稀有精英击杀时间 { monsterId: killedAt } 用于刷新计时
      worldBosses: {},      // 世界首领击杀时间 { monsterId: killedAt } 用于刷新计时
    };
    // 猎人初始宠物(白虎)
    if (classId === 'hunter') {
      char.pets.push(JSON.parse(JSON.stringify(D.PETS.pet_tiger)));
      char.activePet = 'pet_tiger';
    }
    const c = computed(char);
    char.hpMax = c.hpMax; char.manaMax = c.manaMax;
    char.hp = c.hpMax; char.mana = c.manaMax;
    return char;
  }

  /* ---------- 升级 ---------- */
  function expNeeded(level) { return U.expNeeded(level); }

  // 返回事件数组 [{type:'levelup', level, skills:[...]}] 或 [{type:'expGold', amount, gold}]
  function addExp(char, amount) {
    const events = [];
    // 满级后不再累计经验:按少量比例转为金币(任务/成就等统一走这里)
    if (char.level >= W.Config.LEVEL_CAP) {
      char.exp = 0;
      const gp = Math.max(0, Math.floor(amount * W.Config.MAXLVL_EXP_GOLD));
      if (gp > 0) {
        char.gold += gp;
        events.push({ type: 'expGold', amount, gold: gp });
      }
      Achievements.checkSpecial(char);
      return events;
    }
    char.exp += amount;
    while (char.level < W.Config.LEVEL_CAP && char.exp >= expNeeded(char.level)) {
      char.exp -= expNeeded(char.level);
      char.level++;
      // 升到满级时清空多余经验(避免 59 级大额经验奖励溢出到 60 级残留)
      if (char.level >= W.Config.LEVEL_CAP) char.exp = 0;
      const c = computed(char);
      char.hpMax = c.hpMax; char.manaMax = c.manaMax;
      char.hp = c.hpMax; char.mana = c.manaMax;
      // 学习新技能
      const cls = D.CLASSES[char.classId];
      const newSkills = [];
      for (const sid of cls.skills) {
        const s = D.SKILLS[sid];
        if (s && s.learn === char.level && !char.learnedSkills.includes(sid)) {
          char.learnedSkills.push(sid);
          newSkills.push(s);
        }
      }
      events.push({ type: 'levelup', level: char.level, skills: newSkills });
    }
    // 成就:满级(60级)在升级后检查
    Achievements.checkSpecial(char);
    return events;
  }

  /* ---------- 战斗资源 ---------- */
  function regen(char) {
    const c = computed(char);
    if (c.cls.res === 'mana') {
      char.mana = U.clamp(char.mana + c.manaRegen, 0, c.manaMax);
      if (char.hp < c.hpMax && c.hpRegen > 0) char.hp = Math.min(c.hpMax, char.hp + c.hpRegen);
    }
    if (c.cls.res === 'energy') char.energy = Math.min(W.Config.ENERGY_MAX, char.energy + W.Config.ENERGY_REGEN);
    return c;
  }

  /* ---------- 背包 ---------- */
  const Inventory = {
    // 同 id 可能同时存在普通/极品两个堆栈(perf: true),count 汇总两者
    count(char, id) {
      return (char.inventory || []).filter((i) => i.id === id).reduce((n, i) => n + i.count, 0);
    },
    add(char, id, n, opts) {
      n = n || 1;
      const perf = !!(opts && opts.perf);
      const s = (char.inventory || []).find((i) => i.id === id && !!i.perf === perf);
      if (s) s.count += n;
      else { const e = { id, count: n }; if (perf) e.perf = true; char.inventory.push(e); }
    },
    // perf 明确指定时按极品/普通堆栈移除;未指定时优先移除普通堆栈(保护极品装备)
    remove(char, id, n, perf) {
      let s;
      if (perf != null) s = (char.inventory || []).find((i) => i.id === id && !!i.perf === !!perf);
      else s = (char.inventory || []).find((i) => i.id === id && !i.perf) || (char.inventory || []).find((i) => i.id === id);
      if (!s) return false;
      s.count -= (n || 1);
      if (s.count <= 0) char.inventory = char.inventory.filter((i) => i !== s);
      return true;
    },
    list(char) { return (char.inventory || []).filter((i) => i.count > 0); },
  };

  /* ---------- 背包容量 ---------- */
  // 当前背包容量:基础 BAG_SIZE + 已购背包扩充,上限 BAG_MAX
  function bagSize(char) {
    return Math.min((char.bagSize || 0) + W.Config.BAG_SIZE, W.Config.BAG_MAX || 999);
  }
  // 使用背包物品:永久扩充容量并消耗该物品(上限内按实际可扩数量计算)
  function expandBag(char, itemId) {
    const it = D.ITEMS[itemId];
    if (!it || it.slot !== 'bag' || !(it.bagSize > 0)) return { ok: false, reason: '无效的背包物品' };
    if (Inventory.count(char, itemId) <= 0) return { ok: false, reason: '背包中没有该物品' };
    const cap = W.Config.BAG_MAX || 999;
    const cur = bagSize(char);
    if (cur >= cap) return { ok: false, reason: '背包容量已达上限' };
    const add = Math.min(it.bagSize, cap - cur);
    if (add <= 0) return { ok: false, reason: '背包容量已达上限' };
    char.bagSize = (char.bagSize || 0) + add;
    Inventory.remove(char, itemId, 1);
    return { ok: true, add, size: bagSize(char) };
  }

  /* ---------- 装备 ---------- */
  const Equipment = {
    SLOTS: [
      ['weapon', '主手武器'], ['offhand', '副手'], ['head', '头盔'], ['chest', '胸甲'],
      ['gloves', '手套'], ['legs', '护腿'], ['boots', '靴子'], ['cloak', '披风'],
      ['neck', '项链'], ['ring1', '戒指'], ['ring2', '戒指'], ['trinket1', '饰品'], ['trinket2', '饰品'],
    ],
    // 旧存档:孤儿戒指槽(eq.ring)迁移到 ring1/ring2,槽满则放回背包
    _migrateOrphanRing(char) {
      if (char.equipment && char.equipment.ring) {
        const r = char.equipment.ring;
        delete char.equipment.ring;
        if (!char.equipment.ring1) char.equipment.ring1 = r;
        else if (!char.equipment.ring2) char.equipment.ring2 = r;
        else Inventory.add(char, r, 1);
      }
    },
    // 戒指可装备槽:空槽优先(ring1 → ring2);两个都占时替换属性较弱的一枚(粗略评分:基础属性+极品加成+升级/附魔值)
    ringTarget(char) {
      if (!char.equipment.ring1) return 'ring1';
      if (!char.equipment.ring2) return 'ring2';
      const score = (slot) => {
        const id = char.equipment[slot];
        const it = id ? D.ITEMS[id] : null;
        let s = 0;
        if (it && it.stats) {
          const m = char.eqPerf && char.eqPerf[slot] ? W.Config.PERFECT_STAT_MULT : 1;
          for (const k in it.stats) s += Math.round(it.stats[k] * m);
        }
        const ub = W.Char.upgradeBonus(it, W.Char.Forge.get(char, id));
        for (const k in ub) s += ub[k] || 0;
        return s;
      };
      return score('ring2') < score('ring1') ? 'ring2' : 'ring1';
    },
    // 饰品可装备槽:空槽优先(trinket1 → trinket2);双满时替换评分较低的一枚(与戒指同规则)
    trinketTarget(char) {
      if (!char.equipment.trinket1) return 'trinket1';
      if (!char.equipment.trinket2) return 'trinket2';
      const score = (slot) => {
        const id = char.equipment[slot];
        const it = id ? D.ITEMS[id] : null;
        let s = 0;
        if (it && it.stats) {
          const m = char.eqPerf && char.eqPerf[slot] ? W.Config.PERFECT_STAT_MULT : 1;
          for (const k in it.stats) s += Math.round(it.stats[k] * m);
        }
        const ub = W.Char.upgradeBonus(it, W.Char.Forge.get(char, id));
        for (const k in ub) s += ub[k] || 0;
        return s;
      };
      return score('trinket2') < score('trinket1') ? 'trinket2' : 'trinket1';
    },
    // 装备:itemId 从背包移除(已装备不占背包格),perf 标记极品;换装时旧装备(含其极品状态)回到背包
    equip(char, itemId, perf) {
      const item = D.ITEMS[itemId];
      if (!item || item.slot === 'consumable' || item.slot === 'material' || item.slot === 'bag') return false;
      if (!char.eqPerf) char.eqPerf = {};
      this._migrateOrphanRing(char);
      // 同 id 且同极品状态时不重复装备(允许普通→极品 极品→普通 换装)
      if (item.slot === 'ring') {
        if (char.equipment.ring1 === itemId && !!char.eqPerf.ring1 === !!perf) return false;
        if (char.equipment.ring2 === itemId && !!char.eqPerf.ring2 === !!perf) return false;
      } else if (item.slot === 'trinket') {
        if (char.equipment.trinket1 === itemId && !!char.eqPerf.trinket1 === !!perf) return false;
        if (char.equipment.trinket2 === itemId && !!char.eqPerf.trinket2 === !!perf) return false;
      } else if (char.equipment[item.slot] === itemId && !!char.eqPerf[item.slot] === !!perf) {
        return false;
      }
      const slot = item.slot === 'ring' ? this.ringTarget(char) : (item.slot === 'trinket' ? this.trinketTarget(char) : item.slot);
      const old = char.equipment[slot];
      const oldPerf = !!(char.eqPerf && char.eqPerf[slot]);
      char.equipment[slot] = itemId;
      char.eqPerf[slot] = !!perf;
      Inventory.remove(char, itemId, 1, !!perf);
      if (old) Inventory.add(char, old, 1, { perf: oldPerf });
      const c = computed(char);
      char.hpMax = c.hpMax; char.manaMax = c.manaMax;
      char.hp = Math.min(char.hp, c.hpMax); char.mana = Math.min(char.mana, c.manaMax);
      // 成就:套装件数达 4 件
      Achievements.checkSpecial(char);
      return true;
    },
    unequip(char, slot) {
      const id = char.equipment[slot];
      if (!id) return false;
      if (Inventory.list(char).length >= bagSize(char)) return false;
      const wasPerf = !!(char.eqPerf && char.eqPerf[slot]);
      char.equipment[slot] = null;
      if (char.eqPerf) delete char.eqPerf[slot];
      Inventory.add(char, id, 1, { perf: wasPerf });
      const c = computed(char);
      char.hpMax = c.hpMax; char.manaMax = c.manaMax;
      char.hp = Math.min(char.hp, c.hpMax); char.mana = Math.min(char.mana, c.manaMax);
      return true;
    },
    use(char, itemId) {
      const item = D.ITEMS[itemId];
      if (!item) return false;
      if (item.scroll) return false; // 战斗卷轴仅在战斗中免费使用
      if (item.slot === 'consumable' && item.consumable) {
        const c = computed(char);
        let used = false;
        if (item.consumable.heal && char.hp < c.hpMax) {
          char.hp = Math.min(c.hpMax, char.hp + item.consumable.heal); used = true;
        }
        if (item.consumable.mana && char.mana < c.manaMax && c.manaMax > 0) {
          char.mana = Math.min(c.manaMax, char.mana + item.consumable.mana); used = true;
        }
        if (used) { Inventory.remove(char, itemId, 1); return true; }
        return false; // 无需使用
      }
      return Equipment.equip(char, itemId);
    },
  };

  /* ---------- 锻造:强化 / 附魔 ---------- */
  // 单件装备的强化 + 附魔加成汇总
  function upgradeBonus(item, up) {
    const out = { dmg: 0, armor: 0, crit: 0, dodge: 0, hp: 0, lifesteal: 0, str: 0, agi: 0, stam: 0, int: 0, spi: 0 };
    if (!item || !up) return out;
    const L = up.level || 0;
    if (L > 0) {
      // 强化:武器每级 +1 伤害;带护甲的部位每级 +2 护甲;物品自带属性每 2 级 +1
      if (item.slot === 'weapon') out.dmg += L;
      else if (item.stats && item.stats.armor) out.armor += L * 2;
      const sb = Math.floor((L + 1) / 2);
      for (const k of ['str', 'agi', 'stam', 'int', 'spi']) if (item.stats && item.stats[k]) out[k] += sb;
    }
    if (up.enchant) {
      const em = (D.ENCHANTS[up.enchant] || {}).mod || {};
      for (const k in em) if (k in out) out[k] += em[k];
    }
    return out;
  }

  const Forge = {
    get(char, itemId) { return (char.upgrades || {})[itemId] || null; },
    ensure(char) { if (!char.upgrades) char.upgrades = {}; return char.upgrades; },
    maxLevel() { return W.Config.FORGE_MAX_LEVEL; },
    // 强化到下一级需要的金币(高等级装备费用按等级上浮,匹配后期收益;低等级基本不变)
    enhanceCost(item, curLevel) {
      const next = (curLevel || 0) + 1;
      const base = W.Config.FORGE_BASE_COST + item.level * W.Config.FORGE_COST_PER_ITEM_LEVEL;
      const lvlScale = 1 + item.level / 100; // Lv10≈1.10 / Lv30≈1.30 / Lv50≈1.50 / Lv60≈1.60
      return Math.round(base * next * lvlScale);
    },
    // 强化到下一级需要的材料(按目标等级分档:1-3 粉尘 / 4-6 精华 / 7-10 水晶 / 11-15 水晶×2)
    enhanceMats(curLevel) {
      const next = (curLevel || 0) + 1;
      if (next <= 3) return { m_dust: 1 };
      if (next <= 6) return { m_essence: 1 };
      if (next <= 10) return { m_crystal: 1 };
      return { m_crystal: 2 };
    },
    matsLabel(mats) {
      // 跳过 0 数量项(分解产出预览中未产出的材料不应显示 ×0)
      return Object.keys(mats || {}).filter((id) => mats[id] > 0)
        .map((id) => `${D.ITEMS[id] ? D.ITEMS[id].icon + ' ' + D.ITEMS[id].name : id}×${mats[id]}`).join(' · ');
    },
    _hasMats(char, mats) {
      for (const id in mats || {}) if (Inventory.count(char, id) < mats[id]) return false;
      return true;
    },
    _takeMats(char, mats) {
      for (const id in mats || {}) Inventory.remove(char, id, mats[id]);
    },
    // 强化装备(按物品 id 记录,卸下再穿保留等级)
    enhance(char, itemId) {
      const item = D.ITEMS[itemId];
      if (!item || item.slot === 'consumable' || item.slot === 'material') return { ok: false, reason: '无法强化的物品' };
      const u = this.ensure(char);
      const cur = u[itemId] || { level: 0, enchant: null };
      if (cur.level >= W.Config.FORGE_MAX_LEVEL) return { ok: false, reason: '已强化至满级（+' + cur.level + '）' };
      const cost = this.enhanceCost(item, cur.level);
      const mats = this.enhanceMats(cur.level);
      if (char.gold < cost) return { ok: false, reason: '金币不足（需要 ' + cost + ' 铜）' };
      if (!this._hasMats(char, mats)) return { ok: false, reason: '材料不足（需要 ' + this.matsLabel(mats) + '）' };
      char.gold -= cost;
      this._takeMats(char, mats);
      u[itemId] = { level: cur.level + 1, enchant: cur.enchant || null };
      _refreshStats(char);
      // 成就:强化 +10 / 满级 +15
      if (u[itemId].level === 10) Achievements.trigger(char, 'forge10', { mark: 'lvl10' });
      if (u[itemId].level >= W.Config.FORGE_MAX_LEVEL) Achievements.trigger(char, 'forge15', { mark: 'lvl15' });
      return { ok: true, level: u[itemId].level, cost, mats };
    },
    // 附魔槽位匹配:戒指/饰品的双槽命名兼容(ring/trinket → ring1/ring2/trinket1/trinket2)
    slotMatches(em, slot) {
      if (!em || !em.slots) return false;
      if (em.slots.includes(slot)) return true;
      const dual = { ring: ['ring1', 'ring2'], trinket: ['trinket1', 'trinket2'] }[slot];
      return dual ? em.slots.some((s) => dual.includes(s)) : false;
    },
    // 附魔(替换当前附魔)
    enchant(char, itemId, enchantId) {
      const item = D.ITEMS[itemId];
      const em = D.ENCHANTS[enchantId];
      if (!item || !em) return { ok: false, reason: '无效的附魔' };
      if (!this.slotMatches(em, item.slot)) return { ok: false, reason: '该附魔不适用于此装备部位' };
      const u = this.ensure(char);
      const cur = u[itemId] || { level: 0, enchant: null };
      if (cur.enchant === enchantId) return { ok: false, reason: '已附魔该效果' };
      if (char.gold < em.gold) return { ok: false, reason: '金币不足（需要 ' + em.gold + ' 铜）' };
      if (!this._hasMats(char, em.mats)) return { ok: false, reason: '材料不足（需要 ' + this.matsLabel(em.mats) + '）' };
      char.gold -= em.gold;
      this._takeMats(char, em.mats);
      u[itemId] = { level: cur.level || 0, enchant: enchantId };
      _refreshStats(char);
      Achievements.trigger(char, 'enchant', { inc: 1 });
      return { ok: true, enchant: enchantId, gold: em.gold, mats: em.mats };
    },
    // 移除附魔(免费)
    removeEnchant(char, itemId) {
      const u = this.ensure(char);
      const cur = u[itemId];
      if (!cur || !cur.enchant) return { ok: false, reason: '该装备没有附魔' };
      u[itemId] = { level: cur.level || 0, enchant: null };
      _refreshStats(char);
      return { ok: true };
    },

    /* ---------- 分解:绿色/蓝色装备 → 锻造材料 ---------- */
    // 已装备检查需精确到极品状态(普通/极品同 id 视为不同实例)
    _isEquipped(char, itemId, perf) {
      for (const slot of ['weapon', 'offhand', 'head', 'chest', 'gloves', 'legs', 'boots', 'cloak', 'neck', 'ring1', 'ring2', 'trinket1', 'trinket2']) {
        if (char.equipment[slot] === itemId && !!(char.eqPerf || {})[slot] === !!perf) return true;
      }
      return false;
    },
    // 可分解:优秀(绿)/精良(蓝)品质的装备(消耗品与材料物品除外)
    canDisenchant(item) {
      return !!item && ['green', 'blue'].includes(item.quality) && !['consumable', 'material'].includes(item.slot);
    },
    // 分解产出(随物品等级提升,完全确定性无随机):
    //   绿色 → 奥术粉尘(10 级起附加少量梦境精华);蓝色 → 粉尘 + 精华(14 级起附加奥术水晶)
    disenchantYield(item) {
      const out = { m_dust: 0, m_essence: 0, m_crystal: 0 };
      if (!this.canDisenchant(item)) return out;
      const L = item.level || 1;
      if (item.quality === 'green') {
        out.m_dust = 1 + Math.floor(L / 3);
        if (L >= 10) out.m_essence = Math.floor(L / 10);
      } else if (item.quality === 'blue') {
        out.m_dust = 2 + Math.floor(L / 3);
        out.m_essence = 1 + Math.floor(L / 5);
        if (L >= 14) out.m_crystal = Math.floor(L / 14);
      }
      return out;
    },
    // 分解:消耗背包中 1 件,返还锻造材料(已装备、已强化/附魔的不可分解,防止误操作损失投资)
    disenchant(char, itemId, perf) {
      const item = D.ITEMS[itemId];
      if (!this.canDisenchant(item)) return { ok: false, reason: '只能分解绿色（优秀）/蓝色（精良）品质的装备' };
      if (this._isEquipped(char, itemId, perf)) return { ok: false, reason: '请先卸下该装备再分解' };
      if (Inventory.count(char, itemId) <= 0) return { ok: false, reason: '背包中没有该物品' };
      const u = (char.upgrades || {})[itemId];
      if (u && (u.level || u.enchant)) return { ok: false, reason: '已强化/附魔的物品无法分解' };
      const y = this.disenchantYield(item);
      Inventory.remove(char, itemId, 1, perf);
      for (const mid in y) if (y[mid] > 0) Inventory.add(char, mid, y[mid]);
      return { ok: true, item: item.name, yield: y };
    },
    // 分解已装备物品(直接从槽位移除并返还材料;已强化/附魔的仍不可分解)
    disenchantEquipped(char, slot) {
      const itemId = char.equipment[slot];
      const item = D.ITEMS[itemId];
      if (!item) return { ok: false, reason: '该槽位没有装备' };
      if (!this.canDisenchant(item)) return { ok: false, reason: '只能分解优秀(绿)/精良(蓝)品质装备' };
      const u = (char.upgrades || {})[itemId];
      if (u && (u.level || u.enchant)) return { ok: false, reason: '已强化/附魔的物品无法分解' };
      const y = this.disenchantYield(item);
      char.equipment[slot] = null;
      if (char.eqPerf) delete char.eqPerf[slot];
      for (const mid in y) if (y[mid] > 0) Inventory.add(char, mid, y[mid]);
      _refreshStats(char);
      return { ok: true, item: item.name, yield: y };
    },
    // 出售已装备物品(直接从槽位移除并换金币;可出售任意品质;已强化/附魔的不可出售,保护投资)
    sellEquipped(char, slot) {
      const itemId = char.equipment[slot];
      const item = D.ITEMS[itemId];
      if (!item) return { ok: false, reason: '该槽位没有装备' };
      const u = (char.upgrades || {})[itemId];
      if (u && (u.level || u.enchant)) return { ok: false, reason: '已强化/附魔的物品无法出售' };
      const price = Math.max(1, Math.floor(item.sell != null ? item.sell : (item.buy || 0) * 0.4));
      char.equipment[slot] = null;
      if (char.eqPerf) delete char.eqPerf[slot];
      char.gold += price;
      _refreshStats(char);
      return { ok: true, item: item.name, gold: price };
    },
    // 背包中可批量分解的装备堆栈(可限定品质;排除已装备、已强化/附魔)
    _batchableStacks(char, quality) {
      return W.Char.Inventory.list(char).filter((s) => {
        const it = D.ITEMS[s.id];
        if (!it || !this.canDisenchant(it)) return false;
        if (quality && it.quality !== quality) return false;
        if (this._isEquipped(char, s.id, s.perf)) return false;
        const u = (char.upgrades || {})[s.id];
        return !(u && (u.level || u.enchant));
      });
    },
    // 可批量分解的装备总件数(用于按钮角标与确认提示)
    disenchantCount(char, quality) {
      return this._batchableStacks(char, quality).reduce((n, s) => n + s.count, 0);
    },
    // 批量分解:按品质分解背包中所有可分解装备(整叠清空),返回汇总
    disenchantAll(char, quality) {
      const stacks = this._batchableStacks(char, quality);
      if (!stacks.length) return { ok: false, reason: '背包中没有可分解的装备' };
      const totals = { m_dust: 0, m_essence: 0, m_crystal: 0 };
      let count = 0;
      for (const s of stacks) {
        const n = s.count; // 先取数量:Inventory.remove 会就地修改 s.count
        const y = this.disenchantYield(D.ITEMS[s.id]);
        for (const mid in y) totals[mid] += y[mid] * n;
        Inventory.remove(char, s.id, n, !!s.perf);
        count += n;
      }
      for (const mid in totals) if (totals[mid] > 0) Inventory.add(char, mid, totals[mid]);
      return { ok: true, count, yield: totals };
    },
    // 材料合成:低级材料向上合成(如 5 粉尘 → 1 精华),数据驱动 D.SYNTH
    synthesize(char, targetId) {
      const syn = (D.SYNTH || {})[targetId];
      if (!syn) return { ok: false, reason: '无效的合成目标' };
      if (Inventory.count(char, syn.from) < syn.n) return { ok: false, reason: `${D.ITEMS[syn.from] ? D.ITEMS[syn.from].name : syn.from}不足（需要 ×${syn.n}）` };
      if (char.gold < syn.gold) return { ok: false, reason: '金币不足（需要 ' + syn.gold + ' 铜）' };
      char.gold -= syn.gold;
      Inventory.remove(char, syn.from, syn.n);
      Inventory.add(char, targetId, 1);
      return { ok: true, target: targetId, from: syn.from, n: syn.n };
    },
    // 装备打造:消耗材料与金币制作装备,数据驱动 D.CRAFTS
    craft(char, recipeId) {
      const rp = (D.CRAFTS || {})[recipeId];
      if (!rp) return { ok: false, reason: '无效的打造配方' };
      const it = D.ITEMS[rp.item];
      if (!it) return { ok: false, reason: '配方指向的物品不存在' };
      if (char.gold < rp.gold) return { ok: false, reason: '金币不足（需要 ' + rp.gold + ' 铜）' };
      if (!this._hasMats(char, rp.mats)) return { ok: false, reason: '材料不足（需要 ' + this.matsLabel(rp.mats) + '）' };
      if (W.Char.Inventory.list(char).length >= bagSize(char)) return { ok: false, reason: '背包已满' };
      char.gold -= rp.gold;
      this._takeMats(char, rp.mats);
      W.Char.Inventory.add(char, rp.item, 1);
      Achievements.trigger(char, 'craft', { inc: 1 });
      return { ok: true, item: rp.item, gold: rp.gold, mats: rp.mats };
    },
  };

  /* ---------- 任务 ---------- */
  const QuestLog = {
    active(char) {
      return Object.keys(char.quests || {}).filter((id) => !char.quests[id].done);
    },
    start(char, qid) {
      if (char.quests[qid] || char.completedQuests.includes(qid)) return false;
      char.quests[qid] = { progress: 0, done: false };
      return true;
    },
    // 击杀记录:返回完成了的任务id
    onKill(char, monster) {
      const done = [];
      for (const qid of QuestLog.active(char)) {
        const q = D.QUESTS[qid];
        if (q && q.type === 'kill' && q.target === monster.id) {
          char.quests[qid].progress++;
          if (char.quests[qid].progress >= q.count) { char.quests[qid].done = true; done.push(qid); }
        }
      }
      return done;
    },
    // 交付奖励(经验会真正结算,升级时返回 events)
    turnIn(char, qid) {
      const q = D.QUESTS[qid];
      const qs = char.quests[qid];
      if (!q || !qs || !qs.done || char.completedQuests.includes(qid)) return null;
      char.completedQuests.push(qid);
      delete char.quests[qid];
      const c = computed(char);
      char.gold += Math.floor(q.gold * c.goldMult);
      for (const it of q.rewardItems) Inventory.add(char, it, 1);
      // 阵营声望:任务交付获得区域声望
      const qrep = Reps.forZone(q.zone);
      if (qrep) Reps.add(char, qrep, Math.max(20, q.level * 15));
      const events = q.exp > 0 ? addExp(char, q.exp) : [];
      return { exp: q.exp, gold: Math.floor(q.gold * c.goldMult), items: q.rewardItems, events };
    },
  };

  /* ---------- 成就系统 ---------- */
  // char.achievements = { unlocked: {id:1}, progress: {id: n}, targets: {id: {mark:1}} }
  function _achState(char) {
    if (!char.achievements) char.achievements = { unlocked: {}, progress: {}, targets: {} };
    const a = char.achievements;
    if (!a.unlocked) a.unlocked = {};
    if (!a.progress) a.progress = {};
    if (!a.targets) a.targets = {};
    return a;
  }
  const Achievements = {
    state(char) { return _achState(char); },
    unlocked(char) { return Object.keys(_achState(char).unlocked).length; },
    // 当前进度(面板展示用)
    progressOf(char, ach) {
      const st = _achState(char);
      const t = st.targets[ach.id] || {};
      if (ach.target) return Object.keys(t).length;
      if (ach.id === 'ach_level_60') return Math.min(char.level, ach.count);
      if (ach.id === 'ach_set_4') {
        const sc = setCounts(char);
        let mx = 0; for (const k in sc) if (sc[k] > mx) mx = sc[k];
        return Math.min(mx, ach.count);
      }
      // 收集型:已标记副本数优先(如副本征服者按通关副本数显示进度),无标记时回退 inc 计数
      const marks = Object.keys(t).length;
      return Math.min(marks || (st.progress[ach.id] || 0), ach.count);
    },
    // 发放奖励并标记解锁;返回新解锁的成就列表(含奖励摘要)
    _grant(char, ach) {
      const st = _achState(char);
      if (st.unlocked[ach.id]) return null;
      st.unlocked[ach.id] = 1;
      const c = computed(char);
      const gold = Math.floor((ach.reward && ach.reward.gold || 0) * c.goldMult);
      char.gold += gold;
      const items = [];
      for (const iid of (ach.reward && ach.reward.items || [])) {
        const it = D.ITEMS[iid];
        if (!it) continue;
        if (it.slot !== 'consumable' && Inventory.list(char).length >= bagSize(char)) continue;
        Inventory.add(char, iid, 1);
        items.push(iid);
      }
      const exp = ach.reward && ach.reward.exp || 0;
      const events = exp > 0 ? addExp(char, exp) : [];
      return { ach, gold, items, exp, events };
    },
    // 通用触发:type 匹配即解锁(count 型自动计进度)
    trigger(char, type, opts) {
      const out = [];
      opts = opts || {};
      for (const aid in D.ACHIEVEMENTS) {
        const ach = D.ACHIEVEMENTS[aid];
        if (!ach || ach.type !== type) continue;
        const st = _achState(char);
        if (st.unlocked[ach.id]) continue;
        const mark = opts.mark;
        if (mark && !st.targets[ach.id]) st.targets[ach.id] = {};
        if (mark) st.targets[ach.id][mark] = 1;
        if (ach.target) {
          // 指定目标型:标记列表必须包含目标
          if (!(st.targets[ach.id] || {})[ach.target]) continue;
        } else {
          // 收集型:按独立标记数判定(缺省用 inc 次数兜底)
          const n = Object.keys(st.targets[ach.id] || {}).length;
          if (n > 0) { if (n < ach.count) continue; }
          else {
            st.progress[ach.id] = (st.progress[ach.id] || 0) + (opts.inc || 0);
            if (st.progress[ach.id] < ach.count) continue;
          }
        }
        const g = this._grant(char, ach);
        if (g) out.push(g);
      }
      return out;
    },
    // 特殊条件:等级 / 套装件数
    checkSpecial(char) {
      const out = [];
      const st = _achState(char);
      for (const aid in D.ACHIEVEMENTS) {
        const ach = D.ACHIEVEMENTS[aid];
        if (!ach || st.unlocked[ach.id]) continue;
        const ok = (ach.id === 'ach_level_60' && char.level >= ach.count)
          || (ach.id === 'ach_set_4' && (function () {
            const sc = setCounts(char); let mx = 0;
            for (const k in sc) if (sc[k] > mx) mx = sc[k];
            return mx >= ach.count;
          })());
        if (ok) {
          const g = this._grant(char, ach);
          if (g) out.push(g);
        }
      }
      return out;
    },
  };

  /* ---------- 首领图鉴(击杀记录/通关次数/最快回合) ---------- */
  const Codex = {
    // 记录一次首领击杀;bossId 为怪物 id,rounds 为本场战斗回合数,src 为来源(raid/dungeon/world)
    record(char, bossId, rounds, src) {
      if (!char || !bossId) return null;
      if (!char.codex) char.codex = {};
      const now = Date.now();
      const r = Math.max(1, Math.floor(rounds) || 1);
      const cur = char.codex[bossId] || { kills: 0, fastest: 0, firstAt: 0, lastAt: 0, src: src || 'dungeon' };
      cur.kills = (cur.kills || 0) + 1;
      const newFastest = !cur.fastest || r < cur.fastest;
      cur.fastest = cur.fastest ? Math.min(cur.fastest, r) : r;
      if (!cur.firstAt) cur.firstAt = now;
      cur.lastAt = now;
      if (src) cur.src = src;
      char.codex[bossId] = cur;
      return { entry: cur, newFastest };
    },
    // 图鉴数据源:副本全部首领(bosses 数组含中途首领与最终首领,缺省回退 boss) + 世界首领
    registry() {
      const reg = [];
      for (const d of Object.values(D.DUNGEONS || {})) {
        const ids = d.bosses && d.bosses.length ? d.bosses : (d.boss ? [d.boss] : []);
        for (const mid of ids) {
          if (!D.MONSTERS[mid]) continue;
          reg.push({ mid, src: d.raid ? 'raid' : 'dungeon', source: d.name, icon: d.icon });
        }
      }
      for (const wb of Object.values(D.WORLD_BOSSES || {})) {
        if (!D.MONSTERS[wb.mid]) continue;
        reg.push({ mid: wb.mid, src: 'world', source: D.ZONES[wb.zone] ? D.ZONES[wb.zone].name : wb.zone, icon: D.MONSTERS[wb.mid].icon });
      }
      return reg;
    },
    // 累计击杀总次数
    totalKills(char) {
      return Object.values((char && char.codex) || {}).reduce((s, e) => s + (e.kills || 0), 0);
    },
    // 已击败首领数
    unlockedCount(char) {
      return Object.keys((char && char.codex) || {}).length;
    },
  };

  /* ---------- 声望系统(阵营声望/军需官/坐骑) ---------- */
  // 经典魔兽声望阈值:中立0/友善3000/尊敬6000/崇敬12000/崇拜21000
  const Reps = {
    TIERS: [
      { key: 'neutral', name: '中立', need: 0 },
      { key: 'friendly', name: '友善', need: 3000 },
      { key: 'honored', name: '尊敬', need: 6000 },
      { key: 'revered', name: '崇敬', need: 12000 },
      { key: 'exalted', name: '崇拜', need: 21000 },
    ],
    ensure(char) { if (!char.reps) char.reps = {}; return char.reps; },
    value(char, repId) { return this.ensure(char)[repId] || 0; },
    tierOf(v) {
      let t = this.TIERS[0];
      for (const x of this.TIERS) if (v >= x.need) t = x;
      return t;
    },
    _rank(k) { return this.TIERS.findIndex((t) => t.key === k); },
    // 增加声望;返回 { rep, value, tier, newTier, amount }
    add(char, repId, amount) {
      const rep = D.REPS[repId];
      if (!rep || !amount) return null;
      const reps = this.ensure(char);
      const before = reps[repId] || 0;
      const v = before + Math.max(0, Math.floor(amount));
      reps[repId] = v;
      const t0 = this.tierOf(before), t1 = this.tierOf(v);
      return { rep, value: v, tier: t1, newTier: t1.key !== t0.key, amount: Math.floor(amount) };
    },
    // 区域 → 声望阵营(野生区域与副本区域同查)
    forZone(zoneId) {
      for (const r of Object.values(D.REPS || {})) {
        if ((r.zones || []).includes(zoneId) || (r.dungeons || []).includes(zoneId)) return r.id;
      }
      return null;
    },
    // 副本 → 声望阵营
    forDungeon(dungeonId) {
      for (const r of Object.values(D.REPS || {})) {
        if ((r.dungeons || []).includes(dungeonId)) return r.id;
      }
      return null;
    },
    // 军需官可购商品(声望等级达标即可购买)
    shopItems(repId, tierKey) {
      return Object.values(D.ITEMS).filter((it) => it.rep === repId && this._rank(it.repTier) <= this._rank(tierKey));
    },
    // 坐骑收藏(金币加成在 computed 中按匹数计)
    mounts(char) { return (char.mounts || []).map((id) => D.ITEMS[id]).filter(Boolean); },
    // 声望徽章:单个上交(精英怪掉落,上交换取声望加速冲级)
    BADGE_REP: 300,
    turnInBadge(char, badgeItemId) {
      const it = D.ITEMS[badgeItemId];
      if (!it || !it.badge) return null;
      const n = Inventory.count(char, badgeItemId);
      if (n <= 0) return { ok: false, reason: '背包中没有该徽章' };
      Inventory.remove(char, badgeItemId, 1);
      const r = this.add(char, it.badge, this.BADGE_REP);
      return Object.assign({ ok: true, item: badgeItemId, countLeft: n - 1 }, r);
    },
    // 声望徽章:全部上交
    turnInBadges(char, badgeItemId) {
      const it = D.ITEMS[badgeItemId];
      if (!it || !it.badge) return null;
      const n = Inventory.count(char, badgeItemId);
      if (n <= 0) return { ok: false, reason: '背包中没有该徽章' };
      Inventory.remove(char, badgeItemId, n);
      const r = this.add(char, it.badge, this.BADGE_REP * n);
      return Object.assign({ ok: true, item: badgeItemId, count: n, countLeft: 0 }, r);
    },
  };

  /* ---------- 天赋系统 ---------- */
  // 经典规则:10 级起每级 1 点天赋点
  function talentPointsAt(level) { return Math.max(0, level - 9); }
  function ensureTalents(char) { if (!char.talents) char.talents = {}; return char.talents; }
  function pointsSpent(char) {
    let n = 0;
    const t = ensureTalents(char);
    for (const treeId in t) for (const tid in t[treeId]) n += t[treeId][tid] || 0;
    return n;
  }
  function getUnspent(char) { return Math.max(0, talentPointsAt(char.level) - pointsSpent(char)); }
  function treePoints(char, treeId) {
    let n = 0;
    const t = ensureTalents(char)[treeId] || {};
    for (const k in t) n += t[k] || 0;
    return n;
  }
  function rankOf(char, treeId, talentId) { return (ensureTalents(char)[treeId] || {})[talentId] || 0; }

  // 解析全部天赋加成(属性与战斗共用)
  function talentMods(char) {
    const tm = {
      skillDmg: {}, skillHeal: {}, hotPct: {}, buffPct: {}, debuffPct: {}, cdSkill: {}, buffDur: {},
      dmgType: {}, dotType: {}, stat: {}, statPct: {}, actives: [],
      hpPct: 0, armorPct: 0, apPct: 0, spellPowerPct: 0, cost: 0, cdReduce: 0,
      petDmg: 0, critMult: 0, healMult: 0, shieldPct: 0, manaRegenPct: 0, thornsPct: 0, lifestealPct: 0,
    };
    const trees = D.TALENTS[char.classId] || [];
    for (const tree of trees) {
      for (const node of tree.talents) {
        const rank = rankOf(char, tree.id, node.id);
        if (!rank) continue;
        if (node.active) tm.actives.push(node.active);
        for (const m of node.mods || []) {
          const v = m.per * rank;
          switch (m.t) {
            case 'skillDmg': tm.skillDmg[m.skill] = (tm.skillDmg[m.skill] || 0) + v; break;
            case 'skillHeal': tm.skillHeal[m.skill] = (tm.skillHeal[m.skill] || 0) + v; break;
            case 'hotPct': tm.hotPct[m.skill] = (tm.hotPct[m.skill] || 0) + v; break;
            case 'buffPct': tm.buffPct[m.skill] = (tm.buffPct[m.skill] || 0) + v; break;
            case 'debuffPct': tm.debuffPct[m.skill] = (tm.debuffPct[m.skill] || 0) + v; break;
            case 'cdSkill': tm.cdSkill[m.skill] = (tm.cdSkill[m.skill] || 0) + v; break;
            case 'buffDur': tm.buffDur[m.skill] = (tm.buffDur[m.skill] || 0) + v; break;
            case 'dmgType': tm.dmgType[m.type] = (tm.dmgType[m.type] || 0) + v; break;
            case 'dotType': tm.dotType[m.type] = (tm.dotType[m.type] || 0) + v; break;
            case 'stat': tm.stat[m.stat] = (tm.stat[m.stat] || 0) + v; break;
            case 'statPct': tm.statPct[m.stat] = (tm.statPct[m.stat] || 0) + v; break;
            default: if (m.t in tm) tm[m.t] += v;
          }
        }
      }
    }
    return tm;
  }

  // 学习/卸载天赋后刷新生命法力上限
  function _refreshStats(char) {
    const c = computed(char);
    char.hpMax = c.hpMax; char.manaMax = c.manaMax;
    char.hp = Math.min(char.hp, c.hpMax); char.mana = Math.min(char.mana, c.manaMax);
  }

  function learnTalent(char, treeId, talentId) {
    const tree = (D.TALENTS[char.classId] || []).find((t) => t.id === treeId);
    const node = tree && tree.talents.find((n) => n.id === talentId);
    if (!node) return { ok: false, reason: '无效的天赋' };
    if (getUnspent(char) <= 0) return { ok: false, reason: '没有可用的天赋点（10 级起每级 1 点）' };
    const cur = rankOf(char, treeId, talentId);
    if (cur >= node.max) return { ok: false, reason: '该天赋已满级' };
    if (node.tier > 0 && treePoints(char, treeId) < node.tier * 5) {
      return { ok: false, reason: `需要本系投入 ${node.tier * 5} 点天赋` };
    }
    const t = ensureTalents(char);
    t[treeId] = t[treeId] || {};
    t[treeId][talentId] = cur + 1;
    // 主动天赋:解锁对应技能
    if (node.active && cur === 0 && !char.learnedSkills.includes(node.active)) char.learnedSkills.push(node.active);
    _refreshStats(char);
    return { ok: true, node, rank: cur + 1, unspent: getUnspent(char) };
  }

  function unlearnTalent(char, treeId, talentId) {
    const tree = (D.TALENTS[char.classId] || []).find((t) => t.id === treeId);
    const node = tree && tree.talents.find((n) => n.id === talentId);
    const cur = rankOf(char, treeId, talentId);
    if (!node || cur <= 0) return { ok: false, reason: '该天赋尚未学习' };
    const t = ensureTalents(char);
    t[treeId][talentId] = cur - 1;
    if (t[treeId][talentId] <= 0) {
      delete t[treeId][talentId];
      // 主动天赋回退:移除技能
      if (node.active) char.learnedSkills = char.learnedSkills.filter((s) => s !== node.active);
    }
    _refreshStats(char);
    return { ok: true, rank: cur - 1, unspent: getUnspent(char) };
  }

  function respecCost(char) { return char.level * 50; }

  // 重置全部天赋(花费金币)
  function respecTalents(char) {
    if (pointsSpent(char) <= 0) return { ok: false, reason: '尚未分配任何天赋点' };
    const cost = respecCost(char);
    if (char.gold < cost) return { ok: false, reason: `重置需要 ${cost} 铜币（当前 ${char.gold}）` };
    char.gold -= cost;
    const actives = talentMods(char).actives;
    char.learnedSkills = char.learnedSkills.filter((s) => !actives.includes(s));
    char.talents = {};
    _refreshStats(char);
    return { ok: true, cost, unspent: getUnspent(char) };
  }

  // 一键分配推荐搭配:跳过已习得天赋,天赋点不足时停止并返回整体剩余
  function applyBuild(char, build) {
    const applied = [];
    let totalNeed = 0;
    for (const [tid, ranks] of build.points || []) {
      totalNeed += Math.max(0, ranks - rankOf(char, build.tree, tid));
    }
    for (const [tid, ranks] of build.points || []) {
      const need = Math.max(0, ranks - rankOf(char, build.tree, tid));
      for (let r = 0; r < need; r++) {
        const res = learnTalent(char, build.tree, tid);
        if (!res.ok) return { applied, remaining: totalNeed - applied.length, reason: res.reason };
        applied.push(tid);
      }
    }
    return { applied, remaining: 0 };
  }

  /* ---------- 盗贼毒药 ---------- */
  // 涂抹毒药:消耗 1 瓶,武器获得 20 次命中机会
  function applyPoison(char, itemId) {
    const it = D.ITEMS[itemId];
    if (!it || !it.poison) return { ok: false, reason: '这不是毒药' };
    if (D.CLASSES[char.classId].id !== 'rogue') return { ok: false, reason: '只有盗贼可以涂抹毒药' };
    if (Inventory.count(char, itemId) <= 0) return { ok: false, reason: '背包中没有该毒药' };
    Inventory.remove(char, itemId, 1);
    char.poison = { id: itemId, charges: W.Config.POISON_CHARGES };
    return { ok: true, name: it.name };
  }
  function removePoison(char) { char.poison = null; return true; }

  /* ---------- 猎人宠物栏 ---------- */
  const Pets = {
    ensure(char) {
      if (!char.pets) char.pets = [];
      if (char.classId === 'hunter' && !char.pets.length) {
        char.pets.push(JSON.parse(JSON.stringify(D.PETS.pet_tiger)));
        if (!char.activePet) char.activePet = 'pet_tiger';
      }
      return char.pets;
    },
    list(char) { return this.ensure(char); },
    active(char) { return this.ensure(char).find((p) => p.id === char.activePet) || null; },
    setActive(char, id) {
      if (this.ensure(char).some((p) => p.id === id)) { char.activePet = id; return true; }
      return false;
    },
    release(char, id) {
      const pets = this.ensure(char);
      if (pets.length <= 1) return { ok: false, reason: '至少要保留一只宠物' };
      if (!pets.some((p) => p.id === id)) return { ok: false, reason: '宠物不存在' };
      char.pets = pets.filter((p) => p.id !== id);
      if (char.activePet === id) char.activePet = char.pets[0].id;
      return { ok: true };
    },
    // 驯服:已有则直接设为出战;满员返回 false
    tame(char, def) {
      if (!def) return false;
      this.ensure(char);
      if (char.pets.some((p) => p.id === def.id)) { char.activePet = def.id; return true; }
      if (char.pets.length >= W.Config.PET_STABLE) return false;
      char.pets.push(def);
      char.activePet = def.id;
      return true;
    },
  };

  /* ---------- 旧存档迁移 / 职业专精字段补齐 ---------- */
  function ensureClassFeatures(char) {
    if (!char) return char;
    if (char.soulShards == null) char.soulShards = 0;
    if (char.poison == null) char.poison = null;
    if (!char.pets) char.pets = [];
    if (!char.upgrades) char.upgrades = {};
    if (!char.elites) char.elites = {}; // 旧存档兜底:稀有精英刷新计时
    if (!char.worldBosses) char.worldBosses = {}; // 旧存档兜底:世界首领刷新计时
    if (!char.eqPerf) char.eqPerf = {}; // 旧存档兜底:已装备极品标记 { slot: true }
    if (!char.achievements) char.achievements = { unlocked: {}, progress: {}, targets: {} }; // 旧存档兜底:成就
    if (!char.dungeons) char.dungeons = []; // 旧存档兜底:已通关副本 id 列表
    if (!char.achElites) char.achElites = 0; // 旧存档兜底:稀有精英累计击杀数
    if (!char.codex) char.codex = {}; // 旧存档兜底:首领图鉴
    if (!char.reps) char.reps = {};   // 旧存档兜底:阵营声望
    if (!char.mounts) char.mounts = []; // 旧存档兜底:坐骑收藏
    Equipment._migrateOrphanRing(char); // 旧存档孤儿戒指槽迁移
    if (char.classId === 'hunter') {
      if (!char.pets.length) char.pets.push(JSON.parse(JSON.stringify(D.PETS.pet_tiger)));
      if (!char.activePet) char.activePet = char.pets[0].id;
    }
    // 补齐已到等级的职业技能(新技能如驯服野兽/召唤地狱火)
    const cls = D.CLASSES[char.classId];
    if (cls && Array.isArray(char.learnedSkills)) {
      for (const sid of cls.skills) {
        const s = D.SKILLS[sid];
        if (s && s.learn <= char.level && !char.learnedSkills.includes(sid)) char.learnedSkills.push(sid);
      }
    }
    return char;
  }

  /* ---------- 完整恢复(旅店) ---------- */
  function rest(char) {
    const c = computed(char);
    char.hp = c.hpMax; char.mana = c.manaMax; char.rage = 0; char.energy = W.Config.ENERGY_MAX;
    char.zone = char.zone; // 原地
  }    W.Char = {
    computed, passiveMods, create, addExp, expNeeded, regen, rest,
    Inventory, Equipment, QuestLog, bagSize, expandBag,
    // 装备套装:件数统计 / 已激活加成 / 战斗修正合计
    setCounts, activeSetBonuses, setMods,
    // 成就系统
    Achievements,
    applyPoison, removePoison, Pets, ensureClassFeatures,
    // 深入敌营:每日限定突袭状态(每座敌方主城独立每日限次)
    // 返回 { available, remaining, doneToday, lastAt, minLevel, rewardNames }
    capitalRaidStatus(char, zoneId) {
      char = char || {};
      const raid = D.CAPITAL_RAIDS && D.CAPITAL_RAIDS[zoneId];
      if (!raid) return null;
      const day = new Date().toDateString();
      const rec = (char.capitalRaids || {})[zoneId];
      const doneToday = !!rec && rec.day === day;
      return {
        available: !doneToday,
        remaining: Math.max(0, (raid.daily || 1) - (doneToday ? 1 : 0)),
        doneToday,
        lastAt: rec ? rec.lastAt || 0 : 0,
        minLevel: raid.minLevel || 1,
        rewardNames: (raid.rewards && raid.rewards.items || []).map((i) => D.ITEMS[i] ? D.ITEMS[i].name : i),
      };
    },
    // 标记今日突袭完成(计入每日限次),返回是否首次(可领限定奖励)
    markCapitalRaidDone(char, zoneId) {
      char = char || {};
      const raid = D.CAPITAL_RAIDS && D.CAPITAL_RAIDS[zoneId];
      if (!raid) return false;
      const day = new Date().toDateString();
      if (!char.capitalRaids) char.capitalRaids = {};
      const rec = char.capitalRaids[zoneId] || { day: '', wins: 0, lastAt: 0 };
      const first = rec.day !== day;
      rec.day = day;
      rec.wins = (rec.wins || 0) + 1;
      rec.lastAt = Date.now();
      char.capitalRaids[zoneId] = rec;
      return first;
    },
    // 稀有精英刷新状态:返回 [{id,name,icon,alive,remainingMs}]
    eliteStatus(char, zoneId) {
      char = char || {};
      const zone = D.ZONES[zoneId];
      if (!zone || !zone.monsters) return [];
      const elites = zone.monsters.map((m) => D.MONSTERS[m]).filter((m) => m && m.elite && !m.boss);
      return elites.map((m) => {
        const killedAt = (char.elites || {})[m.id] || 0;
        const remainingMs = killedAt ? Math.max(0, killedAt + W.Config.ELITE_RESPAWN_MS - Date.now()) : 0;
        return { id: m.id, name: m.name, icon: m.icon, alive: remainingMs === 0, remainingMs };
      });
    },
    // 世界首领刷新状态:返回 [{id,name,icon,zoneId,zoneName,minLevel,alive,remainingMs}]
    worldBossStatus(char) {
      char = char || {};
      return Object.values(D.WORLD_BOSSES || {}).map((wb) => {
        const m = D.MONSTERS[wb.mid];
        if (!m) return null;
        const killedAt = (char.worldBosses || {})[wb.mid] || 0;
        const remainingMs = killedAt ? Math.max(0, killedAt + W.Config.WORLD_BOSS_RESPAWN_MS - Date.now()) : 0;
        const zone = D.ZONES[wb.zone];
        return {
          id: wb.mid, name: m.name, icon: m.icon, level: m.level, title: m.title || '',
          zoneId: wb.zone, zoneName: zone ? zone.name : wb.zone,
          minLevel: wb.minLevel || 1, alive: remainingMs === 0, remainingMs,
        };
      }).filter(Boolean);
    },
    upgradeBonus, Forge, Codex, Reps,
    talentMods, learnTalent, unlearnTalent, respecTalents, respecCost, applyBuild,
    passiveLiveEffects, passiveLiveTotal,
    talentPointsAt, getUnspent, treePoints, rankOf, pointsSpent, ensureTalents,
    fmtAttrs(c) {
      return {
        str: c.str, agi: c.agi, stam: c.stam, int: c.int, spi: c.spi,
        ap: c.ap, spellPower: c.spellPower, armor: c.armor,
        hit: (c.hit * 100).toFixed(1) + '%', dodge: (c.dodge * 100).toFixed(1) + '%',
        crit: (c.crit * 100).toFixed(1) + '%',
      };
    },
  };
})();
