/* 魔兽世界 · 网页版 — 回合制战斗引擎
 * 命中/闪避/暴击/护甲/抗性/持续伤害(DOT)/持续治疗(HOT)/增益减益/控制/召唤/宠物/Boss阶段 */
(function () {
  'use strict';
  const W = window.WOW;
  const D = W.Data;
  const C = W.Config;
  const U = W.Utils;
  const RNG = W.RNG;

  const CC_CN = { stun: '眩晕', sheep: '变形', fear: '恐惧', root: '定身' };
  const TYPE_CN = { physical: '物理', fire: '火焰', frost: '冰霜', nature: '自然', shadow: '暗影', holy: '神圣', arcane: '奥术' };
  // 战斗中喝药水的冷却回合(不占回合的免费动作,冷却期内无法再喝,防止无限磨)
  const POTION_CD_ROUNDS = 3;

  /* ============ 构建战斗单位 ============ */
  function buildPlayerUnit(char) {
    const c = W.Char.computed(char);
    const cls = c.cls, race = c.race;
    const pm = W.Char.passiveMods(char);
    return {
      key: 'p', name: char.name, icon: cls.icon, isPlayer: true,
      level: c.lvl, kind: 'player', cls: cls.id, race: race.id,
      hp: char.hp, hpMax: c.hpMax,
      mana: char.mana, manaMax: c.manaMax, res: cls.res,
      rage: char.rage, energy: char.energy, combo: char.combo,
      atkMin: c.atkMin, atkMax: c.atkMax, armor: c.armor, spellPower: c.spellPower,
      hit: c.hit, dodge: c.dodge, crit: c.crit, resists: c.resists,
      ccReduce: c.ccReduce, regenPct: c.regenPct, petDmgMult: c.petDmgMult, beastDmg: c.beastDmg,
      goldMult: c.goldMult, weapon: c.weapon, weaponLifesteal: c.weaponLifesteal || 0,
      critMult: c.critMult || 0, talents: W.Char.talentMods(char),
      dmgTaken: c.dmgTaken || 0, healPct: c.healPct || 0,
      buffs: [], dots: [], hots: [], shield: null, cd: {}, ccs: [],
      learned: char.learnedSkills.slice(),
      // 被动技能:常驻的战斗类效果(onHit 圣印 / thorns 荆棘 / 起始护盾 / 印记);属性类已在 computed() 生效
      passiveMod: {
        onHit: pm.onHit || 0, thorns: pm.thorns || 0,
        startShield: pm.startShield || 0, startShieldSp: pm.startShieldSp || 0,
        shieldHeal: pm.shieldHeal || 0, markTaken: pm.markTaken || 0,
        petAtkPct: pm.petAtkPct || 0,
      },
      // 职业专精:毒药 / 灵魂碎片 / 宠物栏
      poison: char.poison || null,
      soulShards: char.soulShards || 0,
      petDefs: (char.pets || []).slice(),
      activePet: char.activePet || null,
    };
  }

  function buildPetUnit(player, petDef) {
    const base = player.level * 2.5 * (petDef.atkMult || 0.6);
    return {
      key: 'pet', name: petDef.name, icon: petDef.icon, isPet: true,
      level: player.level, kind: 'pet', petId: petDef.id,
      hp: Math.floor(player.hpMax * petDef.hpMult), hpMax: Math.floor(player.hpMax * petDef.hpMult),
      atkMin: Math.max(2, Math.floor(base * 0.8 * (1 + ((player.passiveMod && player.passiveMod.petAtkPct) || 0)))), atkMax: Math.max(3, Math.floor(base * 1.2 * (1 + ((player.passiveMod && player.passiveMod.petAtkPct) || 0)))),
      armor: petDef.armor || 10, hit: 0.9, dodge: 0.04, crit: 0.05,
      resists: { fire: 0, frost: 0, nature: 0, shadow: 0, arcane: 0, holy: 0 },
      buffs: [], dots: [], hots: [], shield: null, cd: {}, ccs: [],
      taunt: !!petDef.taunt, roundsLeft: petDef.rounds, skills: petDef.skills,
      petDmgMult: (player.petDmgMult || 1) * (1 + ((player.talents && player.talents.petDmg) || 0)),
    };
  }

  function buildEnemyUnit(monster, idx) {
    return {
      key: 'e' + idx, mid: monster.id, name: monster.name, icon: monster.icon, isEnemy: true,
      level: monster.level, kind: monster.kind, elite: !!monster.elite, boss: !!monster.boss, sub: !!monster.sub, world: !!monster.world,
      title: monster.title, ai: monster.ai || 'smart',
      hp: monster.hp, hpMax: monster.hp, atkMin: monster.atk[0], atkMax: monster.atk[1],
      armor: monster.armor, hit: 0.9, dodge: 0.02 + monster.level * 0.001, crit: 0.05,
      resists: { fire: 0, frost: 0, nature: 0, shadow: 0, arcane: 0, holy: 0 },
      mSkills: monster.skills || [], mSkillCds: {}, bossPhase2: !monster.boss, _usedOnce: false,
      buffs: [], dots: [], hots: [], shield: null, ccs: [],
      xp: monster.xp, gold: monster.gold, drops: (D.DROPS && D.DROPS[monster.id]) || monster.drops || [], summonAdds: 0,
    };
  }

  /* ============ 战斗引擎 ============ */
  const Battle = {
    battle: null,

    start(char, enemyDefs, ui, opts) {
      opts = opts || {};
      const player = buildPlayerUnit(char);
      const enemies = enemyDefs.map(buildEnemyUnit);
      this.battle = {
        char, ui, player, enemies, pets: [], round: 1, ended: false, busy: false,
        isDungeon: !!opts.isDungeon, isBoss: !!opts.isBoss, context: opts.context || 'wild',
        victory: false, fleed: false, rewards: null, onEnd: ui.onEnd || null,
      };
      this._applyPassiveStart();
      return this.battle;
    },

    // 被动技能的战斗开始效果:起始护盾(萨满大地之盾 / 法师寒冰护体)与猎人印记自动标记
    _applyPassiveStart() {
      const b = this.battle;
      const player = b.player;
      const pm = player.passiveMod || {};
      // 起始护盾(天赋 shieldPct 强化吸收)
      if (pm.startShield > 0 || (pm.startShieldSp || 0) > 0) {
        const t = player.talents || {};
        const amt = Math.max(1, Math.round((pm.startShield + (pm.startShieldSp || 0) * (player.spellPower || 0)) * (1 + (t.shieldPct || 0))));
        player.shield = { amount: amt, rounds: 999, healOnHit: pm.shieldHeal || 0 };
        b.ui.log('buff', `<span class="dn">${player.icon}</span> <b>${player.name}</b> 的守护之力提供了 <b>${amt}</b> 点吸收护盾`);
      }
      // 猎人印记:自动标记首个敌人(天赋 debuffPct 强化易伤)
      if (pm.markTaken > 0 && b.enemies.length) {
        const t = player.talents || {};
        const pct = pm.markTaken + ((t.debuffPct && t.debuffPct.hunters_mark) || 0);
        const e = b.enemies[0];
        e.buffs = e.buffs.filter((x) => x.key !== 'hunters_mark');
        e.buffs.push({ key: 'hunters_mark', name: '猎人印记', rounds: 999, mod: { takenPct: pct }, isNegative: true });
        b.ui.log('debuff', `<span class="dn">${player.icon}</span> <b>${e.name}</b> 被<b>猎人印记</b>标记，受到的伤害提高 ${Math.round(pct * 100)}%`);
      }
    },

    /* ---------- 伤害计算 ---------- */
    // 返回 {damage, crit, miss, dodged, resisted, invuln, shielded}
    rollAttack(attacker, defender, skill) {
      const b = this.battle;
      const isMagic = !!(skill && (skill.magic || (skill.dmg && skill.dmg.type !== 'physical')));
      const dmgType = isMagic ? ((skill.dmg && skill.dmg.type) || 'fire') : 'physical';

      // 命中
      let hitChance = attacker.hit - (defender.level - attacker.level) * C.HIT_PER_LEVEL_DIFF;
      if (attacker.isEnemy && defender.buffs.some((x) => x.mod && x.mod.stealth)) hitChance *= 0.5;
      if (defender.buffs.some((x) => x.mod && x.mod.invuln)) return { invuln: true, dmgType };
      hitChance = U.clamp01(hitChance);
      if (!RNG.chance(hitChance)) return { miss: true, dmgType };

      // 闪避(物理;疾跑等可提升闪避)
      if (!isMagic) {
        const dodgeChance = U.clamp01(defender.dodge + this._buffMod(defender, 'dodgePct', 0));
        if (RNG.chance(dodgeChance)) return { dodged: true, dmgType };
      }

      // 暴击(冷血必定暴击 / 暴击增益)
      const isCrit = this._buffMod(attacker, 'guaranteedCrit', 0) > 0 ||
        RNG.chance(U.clamp01(attacker.crit + this._buffMod(attacker, 'critPct', 0)));

      // 基础伤害
      let base;
      if (isMagic) {
        if (skill.dmg && skill.dmg.base != null) {
          base = skill.dmg.base + (skill.dmg.scale || 0) * (attacker.spellPower || 0);
        } else {
          const r = RNG.rand();
          base = (attacker.atkMin + r * (attacker.atkMax - attacker.atkMin)) * (skill.mult || 1);
        }
      } else if (skill && skill.dmg) {
        base = skill.dmg.base + (skill.dmg.scale || 0) * (attacker.atkMin + attacker.atkMax) / 2 * 1.5;
      } else {
        const r = RNG.rand();
        base = (attacker.atkMin + r * (attacker.atkMax - attacker.atkMin)) * ((skill && skill.mult) || 1);
      }

      // 增益/减益修正
      base *= (1 + this._buffMod(attacker, 'atkPct', 0));
      if (attacker.isPlayer && attacker.beastDmg && defender.kind === 'beast') base *= (1 + attacker.beastDmg);
      let stealthBonus = 1;
      if (attacker.isPlayer && defender.isEnemy && attacker.buffs.some((x) => x.mod && x.mod.stealth)) {
        stealthBonus = (skill && skill.stealthMult) || 1.5;
      }
      base *= stealthBonus;
      // 天赋:技能伤害 / 系别伤害强化
      if (attacker.talents) {
        if (skill && skill.id) base *= (1 + (attacker.talents.skillDmg[skill.id] || 0));
        if (skill && skill.dmg && skill.dmg.type) base *= (1 + (attacker.talents.dmgType[skill.dmg.type] || 0));
      }
      if (isCrit) base *= (C.CRIT_MULT + (attacker.critMult || 0));
      base *= (1 + this._buffMod(defender, 'takenPct', 0));
      // 宠物伤害加成(种族 / 天赋)
      if (attacker.isPet) base *= attacker.petDmgMult || 1;

      // 减伤(护甲受 buff 修正:克苏恩眼棱灼烧可降低护甲)
      if (!isMagic) {
        const effArmor = Math.max(0, defender.armor * (1 + this._buffMod(defender, 'armorPct', 0)));
        const reduction = U.clamp01(effArmor / (effArmor + C.ARMOR_DENOM + 85 * attacker.level));
        base *= (1 - Math.min(reduction, C.ARMOR_CAP));
      } else if (dmgType !== 'holy') {
        const resist = (defender.resists && defender.resists[dmgType]) || 0;
        const resistChance = U.clamp01(C.RESIST_FULL_CHANCE + resist * 0.001);
        if (RNG.chance(resistChance)) return { resisted: true, dmgType };
      }

      let damage = Math.max(1, Math.round(base));

      // 护盾吸收
      if (defender.shield && defender.shield.amount > 0) {
        const absorb = Math.min(defender.shield.amount, damage);
        defender.shield.amount -= absorb;
        damage -= absorb;
        b.ui.log('spell', `<span class="dn">${defender.icon}</span> <b>${defender.name}</b> 的护盾吸收了 ${absorb} 点伤害`);
        if (defender.shield.amount <= 0) defender.shield = null;
        if (damage <= 0) return { shielded: true, crit: isCrit, dmgType };
      }

      // 变羊术:受到伤害即解除
      if (defender.ccs && defender.ccs.some((c) => c.type === 'sheep')) {
        defender.ccs = defender.ccs.filter((c) => c.type !== 'sheep');
        b.ui.log('buff', `<span class="dn">${defender.icon}</span> <b>${defender.name}</b> 的<b>变形</b>效果被打破了！`);
      }

      // 荆棘反弹(敌方物理攻击)
      const thorns = this._buffMod(defender, 'thorns', 0);
      if (thorns > 0 && attacker.isEnemy && attacker.hp > 0) {
        const thornsPct = 1 + ((defender.talents && defender.talents.thornsPct) || 0);
        const rt = Math.max(1, Math.round((thorns + attacker.level) * thornsPct));
        attacker.hp = Math.max(0, attacker.hp - rt);
        b.ui.log('dot', `<span class="dn">${defender.icon}</span> <b>${defender.name}</b> 的荆棘反弹了 <b>${rt}</b> 点伤害`);
        this._float(attacker, rt, 'dot');
      }

      // 怒气产生
      if (attacker.isPlayer && attacker.res === 'rage') {
        attacker.rage = Math.min(C.RAGE_MAX, attacker.rage + Math.floor(damage * C.RAGE_DMG_RATE));
      }
      if (defender.isPlayer && defender.res === 'rage') {
        defender.rage = Math.min(C.RAGE_MAX, defender.rage + Math.floor(damage * C.RAGE_TAKEN_RATE));
      }
      // 大地之盾
      if (defender.shield && defender.shield.healOnHit && defender.hp > 0) {
        const h = defender.shield.healOnHit;
        defender.hp = Math.min(defender.hpMax, defender.hp + h);
        b.ui.log('heal', `<span class="dn">${defender.icon}</span> 大地之盾恢复了 <b>${h}</b> 点生命`);
      }
      // 正义圣印
      const seal = this._buffMod(attacker, 'onHit', 0);
      if (seal > 0) {
        const extra = Math.round(seal + attacker.level);
        defender.hp = Math.max(0, defender.hp - extra);
        b.ui.log('holy', `<span class="dn">${attacker.icon}</span> 正义圣印对 <b>${defender.name}</b> 附加 <b>${extra}</b> 点神圣伤害`);
        this._float(defender, extra, 'holy');
      }

      return { damage, crit: isCrit, stealth: stealthBonus > 1, dmgType };
    },

    _buffMod(unit, key, def) {
      let v = def;
      // 被动技能常驻效果(与增益叠加)
      if (unit.passiveMod && unit.passiveMod[key] != null) v += unit.passiveMod[key];
      for (const x of unit.buffs) if (x.mod && x.mod[key] != null) v += x.mod[key];
      return v;
    },

    _applyDamage(unit, amount) {
      // 套装减伤(仅玩家):dmgTaken = 受到的伤害降低
      if (unit && unit.isPlayer && unit.dmgTaken) amount = Math.max(0, Math.round(amount * (1 - unit.dmgTaken)));
      unit.hp = Math.max(0, unit.hp - amount);
    },
    _applyHeal(unit, amount) {
      if (unit.hp <= 0) return 0;
      // 受治疗增减益(哈卡腐化之血等)
      amount = Math.max(0, Math.round(amount * (1 - this._buffMod(unit, 'healTaken', 0))));
      const before = unit.hp;
      unit.hp = Math.min(unit.hpMax, unit.hp + amount);
      return unit.hp - before;
    },

    /* ---------- 盗贼毒药(命中触发) ---------- */
    // isSkill=true 时技能触发率 60%;普通攻击必触发
    _procPoison(target, isSkill) {
      const b = this.battle;
      const player = b.player;
      if (!player.poison || player.poison.charges <= 0 || !target || target.hp <= 0) return;
      if (player.cls !== 'rogue') return;
      if (isSkill && !RNG.chance(0.6)) return;
      const it = D.ITEMS[player.poison.id];
      const p = it && it.poison;
      if (!p) return;
      player.poison.charges--;
      if (p.type === 'instant') {
        const extra = Math.max(1, Math.round(p.per + player.level * 2));
        this._applyDamage(target, extra);
        b.ui.log('debuff', `<span class="dn">${player.icon}</span> <b>${it.name}</b> 爆发，对 <b>${target.name}</b> 额外造成 <b>${extra}</b> 点自然伤害`);
        this._float(target, extra, 'dot');
        W.Audio.dot();
      } else if (p.type === 'deadly') {
        const per = Math.max(1, Math.round(p.per + player.level * 1.5));
        target.dots = target.dots.filter((x) => x.key !== 'poison');
        target.dots.push({ key: 'poison', name: it.name, per, rounds: p.rounds || 3, type: 'nature' });
        b.ui.log('dot', `<b>${it.name}</b> 渗入 <b>${target.name}</b> 的血肉，持续中毒`);
      } else if (p.type === 'crippling') {
        target.buffs = target.buffs.filter((x) => x.key !== 'crippling');
        target.buffs.push({ key: 'crippling', name: it.name, rounds: p.rounds || 2, mod: { atkPct: -(p.pct || 0.2) }, isNegative: true });
        b.ui.log('debuff', `<b>${target.name}</b> 被 <b>${it.name}</b> 麻痹，攻击力下降`);
      }
      if (player.poison.charges <= 0) {
        player.poison = null;
        b.ui.log('buff', `<span class="dn">${player.icon}</span> 武器上的毒药已耗尽`);
      }
    },

    /* ---------- 玩家行动 ---------- */
    canUse(skill, player) {
      const b = this.battle;
      if (skill.passive) return false; // 被动技能效果常驻,不可主动施放
      if (!player.learned.includes(skill.id) && !skill.race) return false;
      if (player.cd[skill.id] > 0) return false;
      if (skill.res) {
        const res = { rage: player.rage, energy: player.energy, mana: player.mana }[skill.res];
        const pom = player.buffs.some((x) => x.mod && x.mod.nextFree);
        if (res < (pom ? 0 : this._effCost(player, skill))) return false;
      }
      if (skill.comboReq && player.combo < skill.comboReq) return false;
      if (skill.reqStealth && !player.buffs.some((x) => x.mod && x.mod.stealth)) return false;
      if (skill.shardCost && (player.soulShards || 0) < skill.shardCost) return false;
      return true;
    },

    // 实际技能消耗(天赋降低消耗)
    _effCost(player, skill) {
      return Math.max(0, Math.round((skill.cost || 0) * (1 - ((player.talents && player.talents.cost) || 0))));
    },
    // 实际冷却(天赋缩短冷却)
    _effCd(player, skill) {
      if (!skill.cd) return 0;
      const t = player.talents || {};
      return Math.max(0, skill.cd - (t.cdReduce || 0) - (t.cdSkill[skill.id] || 0));
    },

    /* ---------- 战斗增益卷轴(免费动作,不占用回合) ---------- */
    async useScroll(scrollId) {
      const b = this.battle;
      if (b.ended || b.busy) return;
      const char = W.State.character;
      const it = D.ITEMS[scrollId];
      if (!it || !it.scroll) return;
      if (W.Char.Inventory.count(char, scrollId) <= 0) return;
      const player = b.player;
      const sc = it.scroll;
      b.busy = true;
      try {
        W.Char.Inventory.remove(char, scrollId, 1);
        if (sc.healPct) {
          const h = this._applyHeal(player, Math.round(player.hpMax * sc.healPct));
          b.ui.log('heal', `<span class="dn">📜</span> 使用 <b>${it.name}</b>！恢复 <b class="heal">${h}</b> 点生命（不占回合）`);
          this._float(player, '+' + h, 'heal');
        } else if (sc.manaPct) {
          const before = player.mana;
          player.mana = Math.min(player.manaMax, player.mana + Math.round(player.manaMax * sc.manaPct));
          b.ui.log('buff', `<span class="dn">📜</span> 使用 <b>${it.name}</b>！恢复 <b>${player.mana - before}</b> 点法力（不占回合）`);
        } else if (sc.buff) {
          // 同类卷轴增益刷新时长,不叠加
          player.buffs = player.buffs.filter((x) => x.key !== sc.key);
          player.buffs.push({ key: sc.key, name: sc.name, rounds: sc.rounds || 5, mod: sc.buff });
          b.ui.log('buff', `<span class="dn">📜</span> 使用 <b>${it.name}</b>！获得 <b>${sc.name}</b>（${sc.rounds || 5} 回合，不占回合）`);
        }
        if (b.ui.render) b.ui.render();
        W.Audio.spell();
      } finally {
        b.busy = false;
      }
    },

    /* ---------- 战斗药水(免费动作,不占用回合;冷却期内禁用) ---------- */
    async usePotion(itemId) {
      const b = this.battle;
      if (b.ended || b.busy) return;
      const char = W.State.character;
      const it = D.ITEMS[itemId];
      if (!it || !it.consumable) return;
      if (!(it.consumable.heal || it.consumable.mana)) return;
      if (W.Char.Inventory.count(char, itemId) <= 0) return;
      const player = b.player;
      if (player.potionCd > 0) {
        b.ui.log('warn', `<span class="dn">🧪</span> <b>${it.name}</b> 冷却中，还需 <b>${player.potionCd}</b> 回合`);
        return;
      }
      // 满状态时不允许浪费药水
      const needHeal = !!(it.consumable.heal && player.hp < player.hpMax);
      const needMana = !!(it.consumable.mana && player.mana < player.manaMax);
      if (!needHeal && !needMana) {
        b.ui.log('warn', `<span class="dn">🧪</span> 生命与法力已满，无需使用 <b>${it.name}</b>`);
        return;
      }
      b.busy = true;
      try {
        W.Char.Inventory.remove(char, itemId, 1);
        const parts = [];
        if (it.consumable.heal && player.hp < player.hpMax) {
          const h = this._applyHeal(player, it.consumable.heal);
          if (h > 0) {
            parts.push(`恢复 <b class="heal">${h}</b> 生命`);
            this._float(player, '+' + h, 'heal');
          }
        }
        if (it.consumable.mana && player.mana < player.manaMax) {
          const before = player.mana;
          player.mana = Math.min(player.manaMax, player.mana + it.consumable.mana);
          if (player.mana > before) parts.push(`恢复 <b>${player.mana - before}</b> 法力`);
        }
        player.potionCd = POTION_CD_ROUNDS;
        b.ui.log('heal', `<span class="dn">🧪</span> 使用 <b>${it.name}</b>！${parts.join('，')}（不占回合，冷却 ${POTION_CD_ROUNDS} 回合）`);
        if (b.ui.render) b.ui.render();
        W.Audio.spell();
      } finally {
        b.busy = false;
      }
    },

    async playerAction(action) {
      const b = this.battle;
      if (b.ended || b.busy) return;
      b.busy = true;
      const player = b.player;
      // 能量职业每回合回复能量(冲动等天赋可提升回复)
      if (player.res === 'energy') {
        let regen = C.ENERGY_REGEN;
        for (const x of player.buffs) if (x.mod && x.mod.energyRegen) regen += x.mod.energyRegen;
        player.energy = Math.min(C.ENERGY_MAX, player.energy + regen);
      }
      let target = b.enemies.find((e) => e.key === (action.target || 'e0')) || b.enemies[0];
      // 目标已死亡时自动切换存活目标
      if ((!target || target.hp <= 0) && action.type !== 'flee' && action.type !== 'defend') {
        target = b.enemies.find((e) => e.hp > 0) || null;
      }

      try {
        if (!target && action.type !== 'flee' && action.type !== 'defend') return;

        // 被控制则跳过行动
        if (this._isCCed(player)) {
          const c = player.ccs[0];
          b.ui.log('cc', `<span class="dn">${player.icon}</span> <b>${player.name}</b> 被<b>${CC_CN[c.type]}</b>住了，无法行动！`);
        } else if (action.type === 'flee') {
          await this._flee(player, target);
        } else if (action.type === 'defend') {
          player.buffs = player.buffs.filter((x) => x.key !== 'defend');
          player.buffs.push({ key: 'defend', name: '防御', rounds: 1, mod: { armorPct: C.DEFEND_ARMOR_BONUS } });
          b.ui.log('buff', `<span class="dn">${player.icon}</span> <b>${player.name}</b> 摆出防御姿态`);
        } else if (action.type === 'attack') {
          await this._playerAttack(player, target, null);
        } else if (action.type === 'skill') {
          const skill = D.SKILLS[action.skill];
          if (!skill || !this.canUse(skill, player)) { b.ui.log('info', '暂时无法使用该技能'); return; }
          await this._executeSkill(player, skill, target);
        }

        // 玩家回合结束:递减玩家自身控制时长(保证控制至少生效一个完整回合)
        this._tickCC(player);
        for (const p of b.pets.slice()) this._tickCC(p);

        b.ui.render();
        await this._enemyTurn();
        if (!b.ended) {
          const end = await this._checkEnd();
          if (!end) { this._nextRound(); }
        }
        b.ui.render();
      } finally {
        b.busy = false;
      }
    },

    async _flee(player, target) {
      const b = this.battle;
      if (b.isDungeon || b.isBoss) { b.ui.log('info', '这里无法逃跑！'); return; }
      const diff = player.level - (target ? target.level : 0);
      const chance = U.clamp01(C.FLEE_BASE + diff * 0.05);
      if (RNG.chance(chance)) {
        b.ui.log('info', '你成功脱离了战斗！');
        W.Audio.flee();
        b.fleed = true; b.ended = true;
        this._finish();
      } else {
        b.ui.log('miss', '你试图逃跑，但没有成功！');
        W.Audio.miss();
      }
    },

    async _playerAttack(player, target, skill) {
      const b = this.battle;
      const ui = b.ui;
      if (player.buffs.some((x) => x.mod && x.mod.stealth) && !skill) this._removeBuff(player, 'stealth');
      const r = this.rollAttack(player, target, skill);
      if (r.miss) {
        ui.log('miss', `<span class="dn">${player.icon}</span> <b>${player.name}</b> 的攻击<b>未命中</b>`);
        this._float(target, '未命中', 'miss'); W.Audio.miss();
      } else if (r.dodged) {
        ui.log('miss', `<b>${target.name}</b> 闪避了你的攻击！`);
        this._float(target, '闪避', 'miss'); W.Audio.miss();
      } else if (r.invuln) {
        ui.log('buff', `<b>${target.name}</b> 免疫了这次攻击！`);
      } else if (r.shielded) {
        this._float(target, '吸收', 'shield');
      } else {
        this._applyDamage(target, r.damage);
        ui.log(r.crit ? 'crit' : 'hit',
          `<span class="dn">${player.icon}</span> <b>${player.name}</b> ${r.crit ? '<b>暴击！</b>' : '攻击'}了 <b>${target.name}</b>，造成 <b class="dmg">${r.damage}</b> 点伤害`);
        this._float(target, (r.crit ? '暴击 ' : '') + r.damage, r.crit ? 'crit' : 'hit');
        W.Audio.crit();
        // 毒药触发(普通攻击必触发)
        this._procPoison(target, false);
        // 武器附魔:生命偷取
        if (player.weaponLifesteal > 0) {
          const h = this._applyHeal(player, Math.max(1, Math.round(r.damage * player.weaponLifesteal)));
          if (h > 0) {
            ui.log('heal', `<span class="dn">${player.icon}</span> <b>生命偷取</b>恢复了 <b>${h}</b> 点生命`);
            this._float(player, '+' + h, 'heal');
            W.Audio.heal();
          }
        }
      }
    },

    async _executeSkill(player, skill, target) {
      const b = this.battle;
      const ui = b.ui;
      const t = player.talents || {};
      // 气定神闲:下一技能零消耗且不进入冷却
      const pom = player.buffs.some((x) => x.mod && x.mod.nextFree);

      // 消耗资源(天赋降低消耗;气定神闲免除)
      const cost = pom ? 0 : this._effCost(player, skill);
      if (skill.res === 'rage') player.rage = Math.max(0, player.rage - cost);
      if (skill.res === 'energy') player.energy = Math.max(0, player.energy - cost);
      if (skill.res === 'mana') player.mana = Math.max(0, player.mana - cost);
      if (skill.rage) player.rage = Math.min(C.RAGE_MAX, player.rage + skill.rage);
      // 灵魂碎片消耗(术士)
      if (skill.shardCost) {
        player.soulShards = Math.max(0, (player.soulShards || 0) - skill.shardCost);
        ui.log('debuff', `<span class="dn">${player.icon}</span> 消耗了 <b>${skill.shardCost}</b> 枚灵魂碎片（剩余 ${player.soulShards}）`);
      }

      // 潜行处理
      const wasStealthed = player.buffs.some((x) => x.mod && x.mod.stealth);
      if (skill.breakStealth && wasStealthed) this._removeBuff(player, 'stealth');
      if (wasStealthed && skill.dmg) this._removeBuff(player, 'stealth');

      if (skill.buff) this._removeBuff(player, skill.buff.key);
      if (skill.debuff && target) this._removeBuff(target, skill.debuff.key);

      const cast = () => {
        ui.log('spell', `<span class="dn">${player.icon}</span> <b>${player.name}</b> 施放 <b>${skill.name}</b>！`);
      };
      let didCast = false;

      // 控制(ccAoe 控制全体敌人;战争践踏/冰霜新星/破胆怒吼)
      if (skill.cc) {
        const ccTargets = skill.ccAoe ? b.enemies.filter((e) => e.hp > 0) : (target && target.hp > 0 ? [target] : []);
        for (const ct of ccTargets) {
          let rounds = skill.cc.rounds;
          if (ct.isPlayer) rounds = Math.max(1, Math.round(rounds * (1 - (ct.ccReduce || 0))));
          if (!this._applyCC(ct, skill.cc.type, rounds)) ui.log('info', `<b>${ct.name}</b> 免疫了控制效果！`);
          else ui.log('cc', `<span class="dn">${player.icon}</span> <b>${player.name}</b> 对 <b>${ct.name}</b> 施放 <b>${skill.name}</b>！${skill.cc.type === 'sheep' ? '（受到伤害会解除）' : ''}`);
        }
      }

      // 伤害(与 DOT 独立,火球+灼烧类技能可同时生效)
      if (skill.dmg) {
        // 剔骨:连击点数增伤
        let effSkill = skill;
        if (skill.comboScale && player.combo > 0) {
          effSkill = Object.assign({}, skill, { dmg: Object.assign({}, skill.dmg, { base: Math.round(skill.dmg.base * (1 + player.combo * skill.comboScale)) }) });
        }
        const targets = skill.aoe ? b.enemies.filter((e) => e.hp > 0) : [target];
        if (targets.length) { cast(); didCast = true; }
        for (const t of targets) {
          const r = this.rollAttack(player, t, effSkill);
          if (r.miss) { ui.log('miss', `<b>${t.name}</b> 抵抗了 <b>${skill.name}</b>！`); continue; }
          if (r.dodged) { ui.log('miss', `<b>${t.name}</b> 闪避了 <b>${skill.name}</b>！`); this._float(t, '闪避', 'miss'); continue; }
          if (r.invuln) { ui.log('buff', `<b>${t.name}</b> 免疫了 <b>${skill.name}</b>！`); continue; }
          if (r.resisted) { ui.log('miss', `<b>${t.name}</b> <b>抵抗</b>了 <b>${skill.name}</b>！`); this._float(t, '抵抗', 'miss'); continue; }
          if (r.shielded) { this._float(t, '吸收', 'shield'); continue; }
          this._applyDamage(t, r.damage);
          ui.log(r.crit ? 'crit' : 'spell',
            `<span class="dn">${player.icon}</span> <b>${player.name}</b> 施放 <b>${skill.name}</b>，对 <b>${t.name}</b> 造成 <b class="dmg">${r.damage}</b> 点${TYPE_CN[r.dmgType] || ''}伤害${r.crit ? '（<b>暴击</b>）' : ''}`);
          this._float(t, (r.crit ? '暴击 ' : '') + r.damage, r.crit ? 'crit' : 'spell');
          this._soundType(r.dmgType, r.crit);
          // 毒药触发(近战技能有 60% 几率)
          if (r.dmgType === 'physical') this._procPoison(t, true);
          // 暗言术:灭 击杀反噬
          if (skill.backfirePct && t.hp <= 0) {
            const bf = Math.max(1, Math.round(player.hpMax * skill.backfirePct));
            player.hp = Math.max(1, player.hp - bf);
            ui.log('debuff', `<span class="dn">${player.icon}</span> <b>${skill.name}</b> 的反噬灼伤了 <b>${player.name}</b>（${bf} 点伤害）`);
            this._float(player, '-' + bf, 'dot');
          }
          // 吸取生命(天赋强化吸取)
          if (skill.lifesteal) {
            const h = this._applyHeal(player, Math.round(r.damage * (1 + t.lifestealPct)));
            ui.log('heal', `<span class="dn">${player.icon}</span> <b>${skill.name}</b> 汲取了 <b>${h}</b> 点生命`);
            this._float(player, '+' + h, 'heal');
          }
        }
      }
      // 持续伤害(与伤害独立判断)
      if (skill.dot) {
        if (!didCast) { cast(); didCast = true; }
        this._refreshDot(target, skill.dot, skill);
        ui.log('dot', `<b>${skill.name}</b> 使 <b>${target.name}</b> 持续受到${TYPE_CN[skill.dot.type] || ''}伤害`);
        W.Audio.dot();
      }
      // 驯服野兽(猎人:生命低于 50% 的野兽)
      if (skill.tame) {
        if (!didCast) { cast(); didCast = true; }
        const t = target;
        if (t && t.isEnemy && t.kind === 'beast' && !t.boss && !t.elite && t.hp > 0 && t.hp / t.hpMax <= 0.5) {
          const src = t.mid ? (D.MONSTERS[t.mid] || t) : t;
          const def = D.makePetDef(src);
          if (W.Char.Pets.tame(b.char, def)) {
            b.player.activePet = def.id;
            b.enemies = b.enemies.filter((e) => e !== t);
            ui.log('info', `<span class="dn">${player.icon}</span> 你成功驯服了 <b>${t.name}</b>！已加入宠物栏（可在世界界面「宠物」面板切换出战）`);
            this._float(t, '驯服！', 'buff');
            W.Audio.holy();
          } else {
            ui.log('info', '宠物栏已满（最多 ' + C.PET_STABLE + ' 只）！');
          }
        } else {
          ui.log('info', `<b>${skill.name}</b> 失败：目标必须是生命值低于 50% 的野兽`);
          this._float(target, '驯服失败', 'miss');
        }
      }
      // 召唤宠物(猎人召唤当前出战宠物;其余按固定宠物)
      if (skill.summon) {
        if (!didCast) { cast(); didCast = true; }
        let petDef = D.PETS[skill.summon];
        if (skill.summon === 'active') {
          petDef = (player.petDefs || []).find((d) => d.id === player.activePet) || (player.petDefs || [])[0] || null;
        }
        if (petDef) {
          b.pets = [];
          const pet = buildPetUnit(player, petDef);
          b.pets.push(pet);
          ui.log('spell', `<span class="dn">${player.icon}</span> <b>${pet.name}</b> 加入了战斗！`);
          W.Audio.spell();
        }
      }
      // 假死脱战
      if (skill.flee) {
        if (b.isDungeon || b.isBoss) { ui.log('info', '此地无法假死脱战！'); }
        else {
          ui.log('info', `<b>${player.name}</b> 使用 <b>${skill.name}</b> 脱离战斗！`);
          W.Audio.flee();
          b.fleed = true; b.ended = true;
          this._finish();
        }
      }
      // 纯增益/其他技能
      if (!didCast) {
        cast();
        W.Audio.spell();
      }

      // 治疗 / HOT(天赋强化 + 套装治疗加成)
      const healMult = 1 + (t.healMult || 0) + (player.healPct || 0);
      const skillHealBoost = (sid) => 1 + (t.skillHeal[sid] || 0);
      if (skill.heal) {
        const h = Math.round((skill.heal.base + skill.heal.scale * player.spellPower) * healMult * skillHealBoost(skill.id));
        const healed = this._applyHeal(player, h);
        ui.log('heal', `<span class="dn">${player.icon}</span> <b>${player.name}</b> 施放 <b>${skill.name}</b>，恢复 <b class="heal">${healed}</b> 点生命`);
        this._float(player, '+' + healed, 'heal');
        W.Audio.heal();
      }
      if (skill.healPct) {
        const h = Math.round(player.hpMax * skill.healPct * healMult);
        const healed = this._applyHeal(player, h);
        ui.log('heal', `<span class="dn">${player.icon}</span> <b>${skill.name}</b> 恢复了 <b>${healed}</b> 点生命`);
        this._float(player, '+' + healed, 'heal');
        W.Audio.heal();
      }
      if (skill.hot) {
        player.hots.push({ key: skill.id, name: skill.name, per: Math.round((skill.hot.per + Math.round(player.spellPower * (skill.hot.scale || 0))) * healMult * skillHealBoost(skill.id)), rounds: skill.hot.rounds });
        ui.log('heal', `<b>${skill.name}</b> 开始持续恢复生命`);
      }

      // 护盾(天赋强化吸收)
      if (skill.shield) {
        const amt = Math.round((skill.shield.base + skill.shield.scale * player.spellPower) * (1 + t.shieldPct));
        player.shield = { amount: amt, rounds: skill.shield.rounds, healOnHit: skill.shieldHeal };
        ui.log('buff', `<b>${skill.name}</b> 为你提供了 <b>${amt}</b> 点吸收护盾`);
      }

      // 增益(支持多增益 buffs 数组;天赋强化数值/持续回合)
      const buffList = skill.buffs || (skill.buff ? [skill.buff] : []);
      for (const bf of buffList) {
        if (bf.key) this._removeBuff(player, bf.key);
        let rounds = bf.rounds;
        // 切割:每连击点延长 1 回合
        if (skill.comboSpend && player.combo > 0) rounds += player.combo;
        rounds += (t.buffDur[skill.id] || 0);
        const mod = this._modFromBuff(bf);
        const bp = t.buffPct[skill.id] || 0;
        if (bp > 0) {
          if (mod.atkPct != null) mod.atkPct += bp;
          if (mod.armorPct != null) mod.armorPct += bp;
        }
        player.buffs.push({ key: bf.key, name: bf.name, rounds, mod });
        ui.log('buff', `<span class="dn">${player.icon}</span> <b>${player.name}</b> 获得 <b>${bf.name}</b> 效果`);
        W.Audio.holy();
      }

      // 减益(天赋强化易伤)
      if (skill.debuff && target) {
        const dbf = Object.assign({}, skill.debuff);
        const dp = t.debuffPct[skill.id] || 0;
        if (dp > 0 && dbf.pct != null) dbf.pct += dp;
        target.buffs.push({ key: dbf.key, name: dbf.name, rounds: dbf.rounds, mod: this._modFromDebuff(dbf) });
        ui.log('debuff', `<span class="dn">${target.icon}</span> <b>${target.name}</b> 受到 <b>${dbf.name}</b> 影响`);
      }

      // 宠物强化(狂野怒火 / 恶魔狂暴)
      if (skill.petBuff) {
        for (const pet of b.pets) {
          pet.buffs.push({ key: 'petBuff', name: skill.petBuff.name || skill.name, rounds: skill.petBuff.rounds, mod: { atkPct: skill.petBuff.atkPct } });
        }
        if (b.pets.length) ui.log('buff', `<b>${skill.name}</b> 使宠物进入狂暴状态`);
      }
      // 重置冷却(预备)
      if (skill.resetCd) {
        player.cd = {};
        ui.log('buff', `<span class="dn">${player.icon}</span> <b>${skill.name}</b> 重置了所有技能冷却！`);
      }
      // 法力之潮
      if (skill.manaPct) {
        const m = Math.round(player.manaMax * skill.manaPct);
        player.mana = Math.min(player.manaMax, player.mana + m);
        ui.log('heal', `<b>${skill.name}</b> 恢复了 <b>${m}</b> 点法力`);
        this._float(player, '+' + m, 'heal');
        W.Audio.heal();
      }
      // 自伤(地狱烈焰)
      if (skill.selfDmgPct) {
        const sd = Math.max(1, Math.round(player.hpMax * skill.selfDmgPct));
        player.hp = Math.max(1, player.hp - sd);
        ui.log('debuff', `<b>${player.name}</b> 被 <b>${skill.name}</b> 灼伤，受到 ${sd} 点伤害`);
        this._float(player, '-' + sd, 'dot');
      }

      // 审判增幅(被动正义圣印同样视为圣印激活)
      if (skill.judgmentBoost && (player.buffs.some((x) => x.mod && x.mod.onHit) || (player.passiveMod && player.passiveMod.onHit > 0)) && target) {
        const extra = Math.round(skill.judgmentBoost + 0.5 * player.spellPower);
        this._applyDamage(target, extra);
        ui.log('holy', `<span class="dn">${player.icon}</span> 审判消耗圣印之力，追加 <b>${extra}</b> 点神圣伤害`);
        this._float(target, extra, 'holy');
      }

      // 清除负面
      if (skill.cleanse) {
        const hadDot = player.dots.length > 0;
        player.dots = [];
        if (skill.cleanseStrong) {
          player.ccs = [];
          player.buffs = player.buffs.filter((x) => !x.isNegative);
        }
        ui.log('buff', `<b>${skill.name}</b> 解除了身上的负面效果`);
      }

      // 法力唤醒
      if (skill.manaHot) {
        player.buffs.push({ key: 'evocation', name: '唤醒', rounds: skill.manaHot.rounds, mod: { manaHot: skill.manaHot.pct } });
      }

      // 连击点
      if (skill.combo) player.combo = Math.min(5, player.combo + skill.combo);
      if (skill.comboSpend) player.combo = Math.max(0, player.combo - skill.comboSpend);

      // 冷却(天赋缩短;气定神闲免除)
      const effCd = pom ? 0 : this._effCd(player, skill);
      if (effCd > 0) player.cd[skill.id] = effCd;
      // 消耗气定神闲
      if (pom) {
        this._removeBuff(player, 'pom');
        ui.log('buff', `<span class="dn">${player.icon}</span> <b>${player.name}</b> 的<b>气定神闲</b>效果被消耗`);
      }
    },

    _modFromBuff(buff) {
      const mod = {};
      if (buff.key === 'atk') mod.atkPct = buff.pct;
      if (buff.key === 'armor') mod.armorPct = buff.pct;
      if (buff.key === 'invuln') mod.invuln = 1;
      if (buff.key === 'onHit') mod.onHit = buff.val;
      if (buff.key === 'thorns') mod.thorns = buff.val;
      if (buff.key === 'stealth') mod.stealth = 1;
      if (buff.key === 'bear') { mod.atkPct = 0.2; mod.armorPct = 0.5; }
      if (buff.key === 'ccImmune') mod.ccImmune = 1;
      if (buff.key === 'crit') mod.critPct = buff.pct;
      if (buff.key === 'guaranteedCrit') mod.guaranteedCrit = 1;
      if (buff.key === 'energyRegen') mod.energyRegen = buff.val;
      if (buff.key === 'dodgePct') mod.dodgePct = buff.pct;
      if (buff.key === 'pom') mod.nextFree = 1;
      return mod;
    },
    _modFromDebuff(debuff) {
      const mod = {};
      if (debuff.key === 'atk') mod.atkPct = debuff.pct;
      if (debuff.key === 'taken') mod.takenPct = debuff.pct;
      if (debuff.key === 'healTaken') mod.healTakenPct = debuff.pct;
      return mod;
    },

    _applyCC(unit, type, rounds) {
      if (unit.buffs.some((x) => x.mod && x.mod.ccImmune)) return false;
      unit.ccs = unit.ccs.filter((c) => c.type !== type);
      unit.ccs.push({ type, rounds });
      return true;
    },
    _isCCed(unit) {
      return unit.ccs.length > 0;
    },

    _refreshDot(target, dot, skill) {
      const t = this.battle.player.talents || {};
      const per = Math.round((dot.per + Math.round((dot.scale || 0) * (this.battle.player.spellPower || 0))) * (1 + (t.dotType[dot.type] || 0)));
      target.dots = target.dots.filter((x) => x.key !== skill.id);
      target.dots.push({ key: skill.id, name: skill.name, per, rounds: dot.rounds, type: dot.type, ramp: dot.ramp });
    },

    _removeBuff(unit, key) { unit.buffs = unit.buffs.filter((x) => x.key !== key); },

    /* ---------- 回合结算 ---------- */
    _tickUnit(unit, isAlly) {
      const b = this.battle;
      const ui = b.ui;

      unit.buffs = unit.buffs.filter((x) => {
        x.rounds--;
        if (x.rounds <= 0) {
          ui.log('buff', `<span class="dn">${unit.icon}</span> ${unit.name} 的 <b>${x.name}</b> 效果消失了`);
          return false;
        }
        return true;
      });

      // 玩家药水冷却每回合递减
      if (unit === b.player && unit.potionCd > 0) unit.potionCd--;

      for (const d of unit.dots.slice()) {
        let dmg = d.per;
        if (d.ramp) dmg = Math.round(d.per * 1.5);
        if (d.type && d.type !== 'physical') {
          const resist = (unit.resists && unit.resists[d.type]) || 0;
          if (RNG.chance(U.clamp01(C.RESIST_FULL_CHANCE + resist * 0.001))) dmg = Math.round(dmg * 0.3);
        }
        dmg = Math.max(1, dmg);
        if (unit.hp <= 0) break;
        unit.hp = Math.max(0, unit.hp - dmg);
        ui.log('dot', `<span class="dn">${unit.icon}</span> <b>${unit.name}</b> 受到 <b>${d.name}</b> 的 ${dmg} 点${TYPE_CN[d.type] || ''}伤害`);
        this._float(unit, dmg, 'dot');
        W.Audio.dot();
        d.rounds--;
        if (d.rounds <= 0) unit.dots = unit.dots.filter((x) => x !== d);
      }

      for (const h of unit.hots.slice()) {
        const healed = this._applyHeal(unit, h.per);
        if (healed > 0) ui.log('heal', `<span class="dn">${unit.icon}</span> <b>${h.name}</b> 恢复了 ${healed} 点生命`);
        h.rounds--;
        if (h.rounds <= 0) unit.hots = unit.hots.filter((x) => x !== h);
      }

      if (unit.shield) {
        unit.shield.rounds--;
        if (unit.shield.rounds <= 0) unit.shield = null;
      }
      for (const k in unit.cd) if (unit.cd[k] > 0) unit.cd[k]--;
      // 巨魔再生
      if (isAlly && unit.regenPct && unit.hp > 0 && unit.hp < unit.hpMax) {
        const h = Math.max(1, Math.round(unit.hpMax * unit.regenPct));
        unit.hp = Math.min(unit.hpMax, unit.hp + h);
      }
    },

    // 控制时长递减(单位自身回合结束后调用)
    _tickCC(unit) {
      const ui = this.battle.ui;
      unit.ccs = unit.ccs.filter((c) => {
        c.rounds--;
        if (c.rounds <= 0) {
          ui.log('buff', `<span class="dn">${unit.icon}</span> ${unit.name} 从 <b>${CC_CN[c.type]}</b> 中恢复`);
          return false;
        }
        return true;
      });
    },

    _nextRound() {
      const b = this.battle;
      b.round++;
      for (const p of b.pets.slice()) {
        if (p.roundsLeft != null) {
          p.roundsLeft--;
          if (p.roundsLeft <= 0) {
            b.pets = b.pets.filter((x) => x !== p);
            b.ui.log('info', `<span class="dn">${p.icon}</span> <b>${p.name}</b> 消失了`);
          }
        }
      }
    },

    async _enemyTurn() {
      const b = this.battle;
      const order = b.enemies.filter((e) => e.hp > 0)
        .map((e) => ({ e, spd: e.level + RNG.int(0, 2) }))
        .sort((a, b) => b.spd - a.spd);

      for (const { e } of order) {
        if (b.ended) break;
        if (this._isDead(b.player) && !b.pets.some((p) => p.hp > 0)) break;
        await this._enemyAct(e);
        this._tickUnit(e, false);
        this._tickCC(e);
        b.ui.render();
        await U.delay(420);
      }
      // 敌方行动结束后,宠物攻击一次(每回合固定一次)
      this._petTurn();
      b.ui.render();
      this._tickUnit(b.player, true);
      for (const p of b.pets.slice()) this._tickUnit(p, true);
    },

    _petTurn() {
      const b = this.battle;
      if (!b.pets.length || b.ended) return;
      for (const pet of b.pets.slice()) {
        if (pet.hp <= 0) continue;
        const target = b.enemies.find((e) => e.hp > 0);
        if (!target) return;
        // 宠物技能
        let usedSkill = null;
        for (const s of pet.skills || []) {
          if (!(pet.cd[s.id] > 0) && RNG.chance(0.4)) { usedSkill = s; pet.cd[s.id] = s.cd || 2; break; }
        }
        const mult = usedSkill ? usedSkill.mult : 1;
        const r = this.rollAttack(pet, target, { mult });
        if (r.damage) {
          this._applyDamage(target, r.damage);
          b.ui.log('hit',
            `<span class="dn">${pet.icon}</span> <b>${pet.name}</b> ${usedSkill ? '施放 <b>' + usedSkill.name + '</b>' : '攻击'}，对 <b>${target.name}</b> 造成 <b class="dmg">${r.damage}</b> 点伤害${r.crit ? '（暴击）' : ''}`);
          this._float(target, (r.crit ? '暴击 ' : '') + r.damage, r.crit ? 'crit' : 'hit');
          W.Audio.hit();
        } else if (r.miss || r.dodged) {
          b.ui.log('miss', `<b>${pet.name}</b> 的攻击未命中 <b>${target.name}</b>`);
        }
      }
    },

    async _enemyAct(e) {
      const b = this.battle;
      const ui = b.ui;
      const player = b.player;

      if (this._isCCed(e)) {
        const c = e.ccs[0];
        ui.log('cc', `<span class="dn">${e.icon}</span> <b>${e.name}</b> 被<b>${CC_CN[c.type]}</b>住了，无法行动${c.type === 'fear' ? '（瑟瑟发抖）' : ''}`);
        await U.delay(300);
        return;
      }

      // 目标选择:召唤宠物站前排替主人挡伤害——嘲讽宠物优先度最高,其余存活宠物次之,最后才是玩家
      let target = b.pets.find((p) => p.taunt && p.hp > 0)
        || b.pets.find((p) => p.hp > 0)
        || player;

      // Boss 狂暴阶段
      if (e.boss && !e.bossPhase2 && e.hp / e.hpMax <= 0.5) {
        e.bossPhase2 = true;
        e.buffs.push({ key: 'enrage', name: '狂暴', rounds: 5, mod: { atkPct: 0.3 } });
        ui.log('boss', `<span class="dn">${e.icon}</span> <b>${e.name}</b> <b>陷入了狂暴！</b>攻击力大幅提升！`);
        this._float(e, '狂暴！', 'boss');
        W.Audio.stun();
        await U.delay(500);
        return;
      }

      const skill = this._pickEnemySkill(e);
      if (skill) {
        e.mSkillCds[skill.id] = skill.cd || 1;
        if (skill.summon) {
          const add = buildEnemyUnit(D.MONSTERS[skill.summon], b.enemies.length);
          add.key = 'e' + b.enemies.length;
          b.enemies.push(add);
          ui.log('boss', `<span class="dn">${e.icon}</span> <b>${e.name}</b> 施放 <b>${skill.name}</b>！召唤了 <b>${add.name}</b>`);
          this._float(e, '召唤！', 'boss');
          W.Audio.spell();
          // 召唤技能可同时附带诅咒类 debuff(如阿鲁高狼人诅咒)
          if (skill.debuff) {
            const db = skill.debuff;
            player.buffs = player.buffs.filter((x) => x.key !== db.key);
            player.buffs.push({ key: db.key, name: db.name, rounds: db.rounds || 2, mod: db.mod || {}, isNegative: true });
            ui.log('debuff', `<span class="dn">${player.icon}</span> <b>${player.name}</b> 中了 <b>${db.name}</b>！`);
            this._float(player, db.name, 'debuff');
          }
          return;
        }
        if (skill.healPct) {
          const h = Math.round(e.hpMax * skill.healPct);
          this._applyHeal(e, h);
          ui.log('heal', `<span class="dn">${e.icon}</span> <b>${e.name}</b> 施放 <b>${skill.name}</b>，恢复 <b>${h}</b> 点生命`);
          this._float(e, '+' + h, 'heal');
          W.Audio.heal();
          return;
        }
        if (skill.hot) {
          e.hots.push({ key: 'regen', name: skill.name, per: Math.round(e.hpMax * skill.hot.per), rounds: skill.hot.rounds });
          ui.log('heal', `<span class="dn">${e.icon}</span> <b>${e.name}</b> 施放 <b>${skill.name}</b>，急速再生`);
          return;
        }
        if (skill.atkBuff) {
          e.buffs = e.buffs.filter((x) => x.key !== 'warcry');
          e.buffs.push({ key: 'warcry', name: skill.name, rounds: skill.rounds || 3, mod: { atkPct: skill.atkBuff } });
          ui.log('buff', `<span class="dn">${e.icon}</span> <b>${e.name}</b> 施放 <b>${skill.name}</b>，攻击力提升！`);
          W.Audio.spell();
          return;
        }

        // 伤害技能(AOE 或单体)
        const realTargets = skill.aoe ? [player].concat(b.pets.filter((p) => p.hp > 0)) : [target];
        ui.log('spell', `<span class="dn">${e.icon}</span> <b>${e.name}</b> 施放 <b>${skill.name}</b>！`);
        for (const t of realTargets) {
          if (t.hp <= 0) continue;
          const r = this.rollAttack(e, t, { magic: skill.magic, mult: skill.mult, dmg: skill.magic ? { type: 'shadow' } : null });
          if (r.miss) { ui.log('miss', `<b>${t.name}</b> 躲开了 <b>${skill.name}</b>`); continue; }
          if (r.dodged) { ui.log('miss', `<b>${t.name}</b> 闪避了攻击`); continue; }
          if (r.invuln) { ui.log('buff', `<b>${t.name}</b> 免疫了 <b>${skill.name}</b>！`); continue; }
          if (r.resisted) { ui.log('miss', `<b>${t.name}</b> <b>抵抗</b>了 <b>${skill.name}</b>！`); continue; }
          this._applyDamage(t, r.damage);
          ui.log(r.crit ? 'crit' : 'hit',
            `<span class="dn">${e.icon}</span> <b>${e.name}</b> 的 <b>${skill.name}</b> 对 <b>${t.name}</b> 造成 <b class="dmg">${r.damage}</b> 点伤害${r.crit ? '（暴击）' : ''}`);
          this._float(t, (r.crit ? '暴击 ' : '') + r.damage, r.crit ? 'crit' : 'hit');
          W.Audio.hit();
          if (skill.stun && t.isPlayer && !this._applyCC(t, 'stun', 1)) ui.log('info', `<b>${t.name}</b> 免疫了眩晕`);
          if (skill.slow && t.isPlayer) {
            this._removeBuff(t, 'slow');
            t.buffs.push({ key: 'slow', name: '寒冰', rounds: 2, mod: { atkPct: -0.25 }, isNegative: true });
            ui.log('debuff', `<b>${t.name}</b> 被减速，攻击力下降`);
          }
        }
        // Boss 独特机制:debuff(眼棱灼烧降护甲 / 龙翼重创降攻击 / 腐化抑制治疗)
        if (skill.debuff) {
          for (const t of realTargets) {
            if (t.hp <= 0) continue;
            const db = skill.debuff;
            t.buffs = t.buffs.filter((x) => x.key !== db.key);
            t.buffs.push({ key: db.key, name: db.name, rounds: db.rounds || 2, mod: db.mod || {}, isNegative: true });
            ui.log('debuff', `<b>${t.name}</b> 中了 <b>${db.name}</b>！`);
            this._float(t, db.name, 'debuff');
          }
        }
        // 敌方 DOT
        if (skill.dot) {
          for (const t of realTargets) {
            if (t.hp <= 0) continue;
            t.dots = t.dots.filter((x) => x.key !== skill.id);
            t.dots.push({ key: skill.id, name: skill.name, per: Math.max(1, Math.round((e.atkMin + e.atkMax) / 2 * skill.dot.per)), rounds: skill.dot.rounds, type: skill.dotType || 'nature', isNegative: true });
          }
          ui.log('dot', `<b>${skill.name}</b> 使目标持续中毒`);
        }
        return;
      }

      // 普通攻击
      const r = this.rollAttack(e, target, null);
      if (r.miss) { ui.log('miss', `<b>${e.name}</b> 的攻击被 <b>${target.name}</b> 躲开了`); W.Audio.miss(); }
      else if (r.dodged) { ui.log('miss', `<b>${target.name}</b> 闪避了 <b>${e.name}</b> 的攻击`); W.Audio.miss(); }
      else if (r.invuln) { ui.log('buff', `<b>${target.name}</b> 免疫了 <b>${e.name}</b> 的攻击！`); }
      else if (r.shielded) { this._float(target, '吸收', 'shield'); }
      else {
        this._applyDamage(target, r.damage);
        ui.log(r.crit ? 'crit' : 'hit',
          `<span class="dn">${e.icon}</span> <b>${e.name}</b> 攻击 <b>${target.name}</b>，造成 <b class="dmg">${r.damage}</b> 点伤害${r.crit ? '（暴击！）' : ''}`);
        this._float(target, (r.crit ? '暴击 ' : '') + r.damage, r.crit ? 'crit' : 'hit');
        W.Audio.hit();
      }
    },

    _pickEnemySkill(e) {
      const ready = (e.mSkills || []).filter((sid) => !(e.mSkillCds[sid] > 0));
      if (!ready.length) return null;
      const pool = [];
      for (const sid of ready) {
        const s = D.MONSTER_SKILLS[sid];
        if (!s) continue;
        if (s.summon && e.summonAdds >= 2) continue;
        if (s.healPct && e.hp / e.hpMax > 0.4) continue;
        if (s.atkBuff && e.buffs.some((x) => x.key === 'warcry')) continue;
        if (s.hot && e.hots.some((x) => x.key === 'regen')) continue;
        if (s.once && e._usedOnce) continue;
        pool.push([1, s]);
      }
      if (!pool.length) return null;
      const s = RNG.weighted(pool);
      if (s.once) e._usedOnce = true;
      if (s.summon) e.summonAdds++;
      return s;
    },

    /* ---------- 胜负与奖励 ---------- */
    _isDead(unit) { return unit.hp <= 0; },

    _checkAlive() {
      const b = this.battle;
      return { enemiesAlive: b.enemies.some((e) => e.hp > 0) };
    },

    async _checkEnd() {
      const b = this.battle;
      if (b.ended) return true;
      const st = this._checkAlive();
      if (this._isDead(b.player)) {
        b.ended = true; b.victory = false;
        b.ui.log('death', `<span class="dn">💀</span> <b>${b.player.name}</b> 倒下了……`);
        W.Audio.lose();
        this._finish();
        return true;
      }
      if (!st.enemiesAlive) {
        b.ended = true; b.victory = true;
        await this._reward();
        W.Audio.win();
        this._finish();
        return true;
      }
      return false;
    },

    async _reward() {
      const b = this.battle;
      const ui = b.ui;
      const char = b.char;
      const player = b.player;

      // 先同步战斗中的实际状态(避免胜利后满血;战斗中消耗的碎片/毒药也以战斗结算为准)
      char.hp = Math.max(0, b.player.hp);
      char.mana = Math.max(0, b.player.mana);
      char.rage = Math.max(0, b.player.rage);
      char.energy = Math.max(0, b.player.energy);
      char.combo = 0;
      char.soulShards = Math.max(0, b.player.soulShards);

      let xp = 0, gold = 0, xpGold = 0;
      const drops = [];

      for (const e of b.enemies) {
        xp += e.xp;
        gold += e.gold;
        // 任务进度
        if (e.mid && e.mid !== 'dm_add') {
          W.Char.QuestLog.onKill(char, { id: e.mid });
        }
        // 阵营声望:击杀所在区域怪物获取区域声望(召唤物不计数,数值随区域等级提升)
        const zrep = (e.mid !== 'dm_add') ? W.Char.Reps.forZone(char.zone) : null;
        if (zrep && D.REPS[zrep]) {
          const zr = W.Char.Reps.add(char, zrep, Math.max(6, Math.round((D.ZONES[char.zone] ? D.ZONES[char.zone].level : 10) * 1.2)));
          if (zr && zr.newTier) ui.log('buff', `<span class="dn">🏛️</span> 你在 <b>${D.REPS[zrep].name}</b> 的声望达到了 <b>${zr.tier.name}</b>！`);
        }
        // 物品/装备掉落:每个阵亡敌人独立掷取;装备掉率大幅上调(×DROP_EQUIP_BOOST)
        let bagFullLogged = false;
        for (const [dropId, chance] of (e.drops || [])) {
          const it = D.ITEMS[dropId];
          if (!it) continue;
          const isGear = !!it.slot && it.slot !== 'consumable' && it.slot !== 'material';
          const effChance = isGear ? Math.min(0.95, chance * C.DROP_EQUIP_BOOST) : chance;
          if (!RNG.chance(effChance)) continue;
          // 必定掉落(chance>=1,如 Boss 奥术水晶)不受背包上限影响;其余掉落背包满则跳过本件
          const guaranteed = chance >= 1;
          if (!guaranteed && it.slot !== 'consumable' && W.Char.Inventory.list(char).length >= W.Char.bagSize(char)) {
            if (!bagFullLogged) { ui.log('info', '🎒 背包已满，部分掉落未能拾取'); bagFullLogged = true; }
            continue;
          }
          // 小概率掉落极品装备(属性 +50%);橙色传说装备极品率更高
          const perfChance = it.quality === 'legendary' ? C.LEGENDARY_PERFECT_CHANCE : C.PERFECT_CHANCE;
          const perf = isGear && RNG.chance(perfChance);
          W.Char.Inventory.add(char, dropId, 1, { perf });
          drops.push(dropId);
          ui.log('gold', perf
            ? `✨ 掉落了 <b>极品</b> ${it.icon} ${U.esc(it.name)}！属性 +${Math.round((C.PERFECT_STAT_MULT - 1) * 100)}%`
            : `拾取了 <b>${it.icon} ${U.esc(it.name)}</b>`);
        }
      }
      // 稀有精英击杀:记录刷新计时(仅限本区域出没的精英,Boss/副本精英不在此列)
      const zoneMonsters = (D.ZONES[char.zone] || {}).monsters || [];
      for (const e of b.enemies) {
        if (e.elite && !e.boss && e.mid && zoneMonsters.includes(e.mid)) {
          if (!char.elites) char.elites = {};
          char.elites[e.mid] = Date.now();
          ui.log('elite', `👑 稀有精英 <b>${e.name}</b> 已被击败！${Math.round(C.ELITE_RESPAWN_MS / 60000)} 分钟后刷新`);
        }
      }
      // 副本中途首领击杀:记录首领图鉴(最终首领在通关结算时记录,不重复计数)
      for (const e of b.enemies) {
        if (e.boss && e.sub && e.mid) {
          const dg = char.dungeon && D.DUNGEONS[char.dungeon.id];
          W.Char.Codex.record(char, e.mid, b.round, dg && dg.raid ? 'raid' : 'dungeon');
        }
      }
      // 世界首领击杀:记录重新现身计时(击杀后可挑战下一个,30 分钟循环)
      for (const e of b.enemies) {
        if (e.world && e.mid && (D.WORLD_BOSSES || {})[e.mid]) {
          if (!char.worldBosses) char.worldBosses = {};
          char.worldBosses[e.mid] = Date.now();
          if (!char.achWboss) char.achWboss = [];
          if (!char.achWboss.includes(e.mid)) char.achWboss.push(e.mid);
          // 首领图鉴:记录世界首领击杀
          W.Char.Codex.record(char, e.mid, b.round, 'world');
          ui.log('boss', `🌍 世界首领 <b>${e.name}</b> 已被击败！${Math.round(C.WORLD_BOSS_RESPAWN_MS / 60000)} 分钟后重新现身`);
        }
      }
      // 成就:击杀 / 精英 / 世界首领
      const achUnlocked = W.Char.Achievements.trigger(char, 'kill', { inc: b.enemies.length });
      if (char.achWboss && char.achWboss.length) {
        for (const wb of char.achWboss) achUnlocked.push(...W.Char.Achievements.trigger(char, 'worldboss', { mark: wb }));
      }
      for (const e of b.enemies) {
        if (e.elite && !e.boss) { char.achElites = (char.achElites || 0) + 1; achUnlocked.push(...W.Char.Achievements.trigger(char, 'elite', { inc: 1 })); }
      }
      if (achUnlocked.length) {
        ui.log('ach', '🏅 成就达成！' + achUnlocked.map((g) => g.ach.name).join('、'));
      }
      gold = Math.floor(gold * player.goldMult);
      if (gold > 0) {
        char.gold += gold;
        ui.log('gold', `拾取了 ${U.plainMoney(gold)}`);
      }
      // 术士灵魂碎片:每个阵亡敌人收割 1 枚
      if (player.cls === 'warlock') {
        const kills = b.enemies.filter((e) => e.hp <= 0 && e.mid !== 'dm_add').length;
        if (kills > 0) {
          const before = char.soulShards || 0;
          char.soulShards = Math.min(C.SOUL_SHARD_CAP, before + kills);
          const gained = char.soulShards - before;
          if (gained > 0) ui.log('debuff', `💜 收割了 <b>${gained}</b> 枚灵魂碎片（当前 ${char.soulShards}/${C.SOUL_SHARD_CAP}）`);
        }
      }
      // 猎人自动驯服:击败的野兽有 30% 几率加入宠物栏(精英/Boss 除外)
      if (player.cls === 'hunter') {
        let tamed = 0;
        for (const e of b.enemies) {
          if (e.kind === 'beast' && !e.boss && !e.elite && e.hp <= 0 && RNG.chance(0.3) && W.Char.Pets.list(char).length < C.PET_STABLE) {
            const src = e.mid ? (D.MONSTERS[e.mid] || e) : e;
            if (W.Char.Pets.tame(char, D.makePetDef(src))) tamed++;
          }
        }
        if (tamed) ui.log('info', `🐾 战斗中驯服了 <b>${tamed}</b> 只野兽（已加入宠物栏）`);
      }
      if (xp > 0) {
        if (char.level >= C.LEVEL_CAP) {
          // 满级:经验不再累计,按少量比例转为金币
          const eg = Math.max(0, Math.floor(xp * C.MAXLVL_EXP_GOLD * player.goldMult));
          if (eg > 0) {
            char.gold += eg;
            ui.log('gold', `满级：<b>${xp}</b> 点经验已转为 <b>${U.plainMoney(eg)}</b> 金币`);
            xpGold = eg;
          }
        } else {
          ui.log('info', `获得 <b>${xp}</b> 点经验`);
          char.exp += xp;
          while (char.level < C.LEVEL_CAP && char.exp >= U.expNeeded(char.level)) {
            char.exp -= U.expNeeded(char.level);
            char.level++;
            const c = W.Char.computed(char);
            char.hpMax = c.hpMax; char.manaMax = c.manaMax;
            char.hp = c.hpMax; char.mana = c.manaMax;
            const cls = D.CLASSES[char.classId];
            const newSkills = [];
            for (const sid of cls.skills) {
              const s = D.SKILLS[sid];
              if (s && s.learn === char.level && !char.learnedSkills.includes(sid)) {
                char.learnedSkills.push(sid);
                newSkills.push(s);
              }
            }
            ui.log('levelup', `🎉 <b>${char.name}</b> 升到了 <b>${char.level}</b> 级！` + (newSkills.length ? ` 学会了：${newSkills.map((s) => s.name).join('、')}` : ''));
            W.Audio.levelup();
            if (char.level === 10) ui.log('info', '🌟 <b>天赋系统解锁！</b>从 10 级起每级获得 1 点天赋点（点击「天赋」按钮分配）');
            else if (char.level > 10) ui.log('info', '🌟 获得 1 点天赋点！');
          }
        }
      }
      b.rewards = { xp, gold, drops, xpGold };
      b.player.hp = char.hp; b.player.mana = char.mana; b.player.rage = char.rage; b.player.energy = char.energy;
      b.player.soulShards = char.soulShards;
    },

    _finish() {
      const b = this.battle;
      const char = b.char;
      if (char) {
        char.hp = Math.max(0, b.player.hp);
        char.mana = Math.max(0, b.player.mana);
        char.rage = Math.max(0, b.player.rage);
        char.energy = Math.max(0, b.player.energy);
        char.combo = 0;
        char.poison = b.player.poison;
        char.soulShards = b.player.soulShards;
        char.activePet = b.player.activePet || char.activePet;
      }
      if (b.victory) char.kills++;
      if (!b.victory && !b.fleed) char.deaths++;
      if (b.onEnd) b.onEnd(b);
    },

    _float(unit, text, cls) {
      this.battle.ui.float && this.battle.ui.float(unit.key, text, cls);
    },
    _soundType(type, crit) {
      if (crit) { W.Audio.crit(); return; }
      const m = { fire: 'fire', frost: 'frost', nature: 'spell', shadow: 'shadow', holy: 'holy', arcane: 'spell' }[type];
      if (m && W.Audio[m]) W.Audio[m](); else W.Audio.spell();
    },

    getState() { return this.battle; },
  };

  W.Combat = Battle;
  W.Combat.POTION_CD_ROUNDS = POTION_CD_ROUNDS;
})();
