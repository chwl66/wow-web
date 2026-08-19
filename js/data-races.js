/* 魔兽世界 · 战大陆 — 种族 / 职业 / 技能 / 宠物 数据
 * 忠实还原经典旧世设定:8 大种族 × 9 大职业(72 种组合),每职业 7 个招牌技能。 */
(function () {
  'use strict';
  const W = window.WOW;
  const D = W.Data = W.Data || {};

  /* ============ 种族 ============ */
  D.RACES = {
    human: {
      id: 'human', name: '人类', en: 'Human', faction: 'alliance', icon: '🛡️',
      desc: '人类是艾泽拉斯最具韧性的种族之一，他们的王国暴风城是联盟的中心。',
      base: { str: 20, agi: 20, stam: 20, int: 20, spi: 21 },
      traits: [
        { id: 'human_spirit', name: '人类之魂', passive: true, desc: '精神提高 3%', mod: { spi: 0.03 } },
        { id: 'human_sword', name: '剑锤专精', passive: true, desc: '武器命中率提高 2%', mod: { hit: 0.02 } },
        { id: 'human_diplomacy', name: '外交', passive: true, desc: '获得的金币提高 10%', mod: { gold: 0.10 } },
      ],
      classes: ['warrior', 'paladin', 'hunter', 'rogue', 'priest', 'mage', 'warlock'],
    },
    dwarf: {
      id: 'dwarf', name: '矮人', en: 'Dwarf', faction: 'alliance', icon: '⛏️',
      desc: '矮人是勇敢的战士和技艺精湛的工匠，他们居住在铁炉堡的雪山之中。',
      base: { str: 22, agi: 16, stam: 23, int: 19, spi: 19 },
      traits: [
        { id: 'dwarf_stoneform', name: '石像形态', active: 'stoneform', desc: '清除流血/中毒/疾病效果，护甲提高 20%，持续 3 回合' },
        { id: 'dwarf_frost', name: '冰霜抗性', passive: true, desc: '冰霜抗性提高 10', mod: { frostResist: 10 } },
        { id: 'dwarf_gun', name: '枪械专精', passive: true, desc: '命中率提高 1%', mod: { hit: 0.01 } },
      ],
      classes: ['warrior', 'paladin', 'hunter', 'rogue', 'priest'],
    },
    night_elf: {
      id: 'night_elf', name: '暗夜精灵', en: 'Night Elf', faction: 'alliance', icon: '🌙',
      desc: '暗夜精灵是古老而神秘的种族，他们守护着卡利姆多大陆的森林。',
      base: { str: 17, agi: 25, stam: 19, int: 20, spi: 20 },
      traits: [
        { id: 'nel_shadowmeld', name: '影遁', active: 'shadowmeld', desc: '进入潜行：敌人对你的命中减半，下一次攻击伤害提高 50%' },
        { id: 'nel_dodge', name: '闪避', passive: true, desc: '闪避几率提高 1%', mod: { dodge: 0.01 } },
        { id: 'nel_nature', name: '自然抗性', passive: true, desc: '自然抗性提高 10', mod: { natureResist: 10 } },
      ],
      classes: ['warrior', 'hunter', 'rogue', 'priest', 'druid'],
    },
    gnome: {
      id: 'gnome', name: '侏儒', en: 'Gnome', faction: 'alliance', icon: '🔧',
      desc: '侏儒是聪明的发明家和工程师，虽然身材矮小但智慧过人。',
      base: { str: 15, agi: 23, stam: 19, int: 24, spi: 20 },
      traits: [
        { id: 'gnome_escape', name: '逃命专家', active: 'escape_artist', desc: '立即解除所有定身、减速和负面效果' },
        { id: 'gnome_int', name: '扩展思维', passive: true, desc: '智力提高 5%', mod: { int: 0.05 } },
        { id: 'gnome_arcane', name: '奥术抗性', passive: true, desc: '奥术抗性提高 10', mod: { arcaneResist: 10 } },
      ],
      classes: ['warrior', 'rogue', 'mage', 'warlock'],
    },
    orc: {
      id: 'orc', name: '兽人', en: 'Orc', faction: 'horde', icon: '⚔️',
      desc: '兽人是强大的战士，他们的部落文化重视荣誉和力量。',
      base: { str: 23, agi: 17, stam: 22, int: 17, spi: 23 },
      traits: [
        { id: 'orc_bloodfury', name: '血性狂暴', active: 'blood_fury', desc: '怒血沸腾常驻：攻击力提高 10%' },
        { id: 'orc_hardiness', name: '坚韧', passive: true, desc: '受到控制效果持续时间减少 30%', mod: { ccReduce: 0.30 } },
        { id: 'orc_axe', name: '斧专精', passive: true, desc: '命中率提高 1%', mod: { hit: 0.01 } },
        { id: 'orc_commander', name: '统御', passive: true, desc: '宠物造成的伤害提高 10%', mod: { petDmg: 0.10 } },
      ],
      classes: ['warrior', 'hunter', 'rogue', 'shaman', 'warlock'],
    },
    tauren: {
      id: 'tauren', name: '牛头人', en: 'Tauren', faction: 'horde', icon: '🐂',
      desc: '牛头人是高贵的萨满和战士，他们崇尚自然和大地母亲。',
      base: { str: 25, agi: 15, stam: 22, int: 15, spi: 22 },
      traits: [
        { id: 'tauren_stomp', name: '战争践踏', active: 'war_stomp', desc: '震晕所有敌人 1 回合并造成伤害' },
        { id: 'tauren_endurance', name: '耐久', passive: true, desc: '最大生命值提高 5%', mod: { hp: 0.05 } },
        { id: 'tauren_nature', name: '自然抗性', passive: true, desc: '自然抗性提高 10', mod: { natureResist: 10 } },
      ],
      classes: ['warrior', 'hunter', 'shaman', 'druid'],
    },
    troll: {
      id: 'troll', name: '巨魔', en: 'Troll', faction: 'horde', icon: '🏹',
      desc: '巨魔是古老的种族，他们拥有强大的再生能力和狂暴精神。',
      base: { str: 21, agi: 22, stam: 21, int: 16, spi: 21 },
      traits: [
        { id: 'troll_berserk', name: '狂暴', active: 'berserking', desc: '狂野之心常驻：造成的伤害提高 6%' },
        { id: 'troll_regeneration', name: '再生', passive: true, desc: '每回合回复最大生命的 1%，战斗中也有效', mod: { regen: 0.01 } },
        { id: 'troll_bow', name: '弓专精', passive: true, desc: '命中率提高 1%', mod: { hit: 0.01 } },
        { id: 'troll_beast', name: '野兽杀手', passive: true, desc: '对野兽的伤害提高 5%', mod: { beastDmg: 0.05 } },
      ],
      classes: ['warrior', 'hunter', 'rogue', 'priest', 'shaman', 'mage'],
    },
    undead: {
      id: 'undead', name: '亡灵', en: 'Undead', faction: 'horde', icon: '💀',
      desc: '被遗忘者是摆脱巫妖王控制的亡灵，他们寻求在这个世界上的立足之地。',
      base: { str: 19, agi: 18, stam: 21, int: 18, spi: 25 },
      traits: [
        { id: 'undead_will', name: '亡灵意志', active: 'will_of_forsaken', desc: '解除恐惧、定身和催眠效果，冷却 5 回合' },
        { id: 'undead_cannibalize', name: '吞噬尸体', active: 'cannibalize', desc: '吞食尸体恢复 25% 生命，冷却 8 回合' },
        { id: 'undead_shadow', name: '暗影抗性', passive: true, desc: '暗影抗性提高 10', mod: { shadowResist: 10 } },
      ],
      classes: ['warrior', 'rogue', 'priest', 'mage', 'warlock'],
    },
  };

  /* ============ 职业 ============ */
  D.CLASSES = {
    warrior: {
      id: 'warrior', name: '战士', en: 'Warrior', icon: '🗡️', role: '近战 · 坦克',
      desc: '近战大师，以怒气为资源，能承受和造成大量伤害。',
      res: 'rage', armorType: 'plate', base: { str: 8, agi: 4, stam: 7, int: 2, spi: 2 },
      growth: { str: 3, agi: 1, stam: 3, int: 1, spi: 1 },
      colors: ['#c69b6d', '#f14f2b'], skills: ['heroic_strike', 'charge', 'rend', 'shield_block', 'battle_shout', 'whirlwind', 'mortal_strike'],
    },
    paladin: {
      id: 'paladin', name: '圣骑士', en: 'Paladin', icon: '⚜️', role: '近战 · 治疗',
      desc: '神圣战士，以圣光之力治疗盟友、惩戒敌人。',
      res: 'mana', armorType: 'plate', base: { str: 6, agi: 3, stam: 6, int: 5, spi: 5 },
      growth: { str: 2, agi: 1, stam: 2, int: 2, spi: 2 },
      colors: ['#f48cba', '#f2c94c'], skills: ['crusader_strike', 'seal_of_righteousness', 'judgement', 'holy_light', 'consecration', 'hammer_of_justice', 'divine_shield'],
    },
    hunter: {
      id: 'hunter', name: '猎人', en: 'Hunter', icon: '🏹', role: '远程 · 召唤',
      desc: '远程物理专家，驯服野兽并肩作战。',
      res: 'mana', armorType: 'mail', base: { str: 3, agi: 8, stam: 5, int: 3, spi: 4 },
      growth: { str: 1, agi: 3, stam: 2, int: 1, spi: 2 },
      colors: ['#aad372', '#7fbf4d'], skills: ['hunters_mark', 'arcane_shot', 'aspect_of_hawk', 'steady_shot', 'serpent_sting', 'multishot', 'summon_pet_tiger', 'tame_beast', 'feign_death'],
    },
    rogue: {
      id: 'rogue', name: '盗贼', en: 'Rogue', icon: '🗡️', role: '近战 · 爆发',
      desc: '敏捷的刺客，以能量和连击点制造爆发伤害。',
      res: 'energy', armorType: 'leather', base: { str: 4, agi: 9, stam: 5, int: 2, spi: 3 },
      growth: { str: 2, agi: 3, stam: 2, int: 1, spi: 1 },
      colors: ['#fff569', '#d9b98a'], skills: ['stealth', 'sinister_strike', 'backstab', 'eviscerate', 'slice_and_dice', 'sap', 'vanish'],
    },
    priest: {
      id: 'priest', name: '牧师', en: 'Priest', icon: '✝️', role: '治疗 · 暗影',
      desc: '强大的治疗者，也能以暗影魔法造成伤害。',
      res: 'mana', armorType: 'cloth', base: { str: 2, agi: 3, stam: 4, int: 7, spi: 7 },
      growth: { str: 1, agi: 1, stam: 1, int: 3, spi: 3 },
      colors: ['#ffffff', '#c0c0c0'], skills: ['smite', 'meditation', 'shadow_word_pain', 'flash_heal', 'power_word_shield', 'renew', 'heal', 'mind_blast'],
    },
    shaman: {
      id: 'shaman', name: '萨满祭司', en: 'Shaman', icon: '⚡', role: '元素 · 治疗',
      desc: '与元素之灵沟通，治疗盟友或召唤图腾作战。',
      res: 'mana', armorType: 'mail', base: { str: 4, agi: 3, stam: 5, int: 5, spi: 6 },
      growth: { str: 2, agi: 1, stam: 2, int: 2, spi: 2 },
      colors: ['#0070de', '#2459ff'], skills: ['lightning_bolt', 'flame_shock', 'frost_shock', 'healing_wave', 'earth_shield', 'stoneclaw_totem', 'bloodlust'],
    },
    mage: {
      id: 'mage', name: '法师', en: 'Mage', icon: '🧙', role: '远程 · 爆发',
      desc: '奥术魔法大师，能造成毁灭性的范围伤害。',
      res: 'mana', armorType: 'cloth', base: { str: 2, agi: 2, stam: 3, int: 8, spi: 6 },
      growth: { str: 1, agi: 1, stam: 1, int: 3, spi: 3 },
      colors: ['#69ccf0', '#3aa0ff'], skills: ['fireball', 'frostbolt', 'arcane_intellect', 'arcane_missiles', 'blizzard', 'polymorph', 'evocation', 'ice_block'],
    },
    warlock: {
      id: 'warlock', name: '术士', en: 'Warlock', icon: '🔮', role: '暗影 · 召唤',
      desc: '以黑暗魔法与恶魔仆从作战，擅长持续伤害。',
      res: 'mana', armorType: 'cloth', base: { str: 2, agi: 2, stam: 4, int: 7, spi: 6 },
      growth: { str: 1, agi: 1, stam: 1, int: 3, spi: 3 },
      colors: ['#9482c9', '#7c6bb5'], skills: ['shadow_bolt', 'corruption', 'immolate', 'curse_of_agony', 'drain_life', 'summon_voidwalker', 'fear', 'summon_infernal'],
    },
    druid: {
      id: 'druid', name: '德鲁伊', en: 'Druid', icon: '🌿', role: '变形 · 多面手',
      desc: '大自然的守护者，可变形作战，攻守兼备。',
      res: 'mana', armorType: 'leather', base: { str: 4, agi: 4, stam: 5, int: 5, spi: 5 },
      growth: { str: 2, agi: 2, stam: 2, int: 2, spi: 2 },
      colors: ['#ff7c0a', '#ff6d00'], skills: ['wrath', 'moonfire', 'rejuvenation', 'healing_touch', 'thorns', 'bear_form', 'cat_form'],
    },
  };

  /* ============ 技能 ============ */
  D.SKILLS = {
    /* ---- 战士 ---- */
    heroic_strike: { id: 'heroic_strike', name: '英勇打击', icon: '⚔️', cls: 'warrior', learn: 1, res: 'rage', cost: 15, desc: '强力一击，造成高额物理伤害。', dmg: { base: 22, scale: 1.0, type: 'physical' } },
    charge: { id: 'charge', name: '冲锋', icon: '💨', cls: 'warrior', learn: 1, res: 'rage', cost: 0, cd: 4, desc: '冲向敌人造成伤害并眩晕 1 回合，产生怒气。', dmg: { base: 14, scale: 0.5, type: 'physical' }, cc: { type: 'stun', rounds: 1 }, rage: 25 },
    rend: { id: 'rend', name: '撕裂', icon: '🩸', cls: 'warrior', learn: 4, res: 'rage', cost: 10, desc: '撕裂敌人伤口，每回合造成物理伤害，持续 4 回合。', dot: { per: 9, scale: 0.25, rounds: 4, type: 'physical' } },
    shield_block: { id: 'shield_block', name: '盾牌格挡', icon: '🛡️', cls: 'warrior', passive: true, learn: 6, mod: { armorPct: 0.2 }, desc: '举盾格挡已成为本能：护甲常驻提高 20%。' },
    battle_shout: { id: 'battle_shout', name: '战斗怒吼', icon: '📢', cls: 'warrior', passive: true, learn: 8, mod: { atkPct: 0.2 }, desc: '战士的怒吼已成为本能：攻击力常驻提高 20%。' },
    whirlwind: { id: 'whirlwind', name: '旋风斩', icon: '🌀', cls: 'warrior', learn: 14, res: 'rage', cost: 30, cd: 3, desc: '旋风般挥舞武器，攻击所有敌人。', aoe: 1, dmg: { base: 20, scale: 0.7, type: 'physical' } },
    mortal_strike: { id: 'mortal_strike', name: '致死打击', icon: '💥', cls: 'warrior', learn: 20, res: 'rage', cost: 30, cd: 4, desc: '致命一击，造成大量伤害并使目标治疗量降低 50%，持续 2 回合。', dmg: { base: 42, scale: 1.4, type: 'physical' }, debuff: { key: 'healTaken', pct: 0.5, rounds: 2, name: '致死' } },
    /* ---- 圣骑士 ---- */
    crusader_strike: { id: 'crusader_strike', name: '十字军打击', icon: '✝️', cls: 'paladin', learn: 1, res: 'mana', cost: 45, desc: '以圣光之力打击敌人，造成神圣伤害。', dmg: { base: 20, scale: 0.7, type: 'holy' } },
    seal_of_righteousness: { id: 'seal_of_righteousness', name: '正义圣印', icon: '🔥', cls: 'paladin', passive: true, learn: 2, mod: { onHit: 10 }, desc: '圣印之力常驻：每次攻击附加 10 点神圣伤害。' },
    judgement: { id: 'judgement', name: '审判', icon: '⚖️', cls: 'paladin', learn: 4, res: 'mana', cost: 50, cd: 3, desc: '审判敌人，若圣印激活则造成巨量神圣伤害。', dmg: { base: 16, scale: 0.5, type: 'holy' }, judgmentBoost: 18 },
    holy_light: { id: 'holy_light', name: '圣光术', icon: '✨', cls: 'paladin', learn: 6, res: 'mana', cost: 75, desc: '召唤圣光治疗自身。', heal: { base: 55, scale: 0.9 } },
    consecration: { id: 'consecration', name: '奉献', icon: '🕯️', cls: 'paladin', learn: 12, res: 'mana', cost: 70, cd: 4, desc: '圣化脚下土地，对所有敌人造成持续神圣伤害。', aoe: 1, dot: { per: 9, scale: 0.2, rounds: 3, type: 'holy' } },
    hammer_of_justice: { id: 'hammer_of_justice', name: '制裁之锤', icon: '🔨', cls: 'paladin', learn: 16, res: 'mana', cost: 40, cd: 5, desc: '掷出神圣之锤，眩晕敌人 1 回合。', dmg: { base: 12, scale: 0.3, type: 'holy' }, cc: { type: 'stun', rounds: 1 } },
    divine_shield: { id: 'divine_shield', name: '圣盾术', icon: '🌟', cls: 'paladin', learn: 22, res: 'mana', cost: 90, cd: 8, desc: '圣光护体，免疫所有伤害，持续 2 回合。', buff: { key: 'invuln', val: 1, rounds: 2, name: '圣盾' } },
    /* ---- 猎人 ---- */
    hunters_mark: { id: 'hunters_mark', name: '猎人印记', icon: '🎯', cls: 'hunter', passive: true, learn: 1, mod: { markTaken: 0.12 }, desc: '猎手的本能常驻：战斗开始时自动标记首个敌人，其受到的伤害提高 12%。' },
    arcane_shot: { id: 'arcane_shot', name: '奥术射击', icon: '🔹', cls: 'hunter', learn: 1, res: 'mana', cost: 50, desc: '射出奥术能量箭矢，造成奥术伤害。', dmg: { base: 22, scale: 0.6, type: 'arcane' } },
    steady_shot: { id: 'steady_shot', name: '稳固射击', icon: '🏹', cls: 'hunter', learn: 4, res: 'mana', cost: 40, desc: '瞄准射击，造成稳定的物理伤害。', dmg: { base: 26, scale: 0.8, type: 'physical' } },
    serpent_sting: { id: 'serpent_sting', name: '毒蛇钉刺', icon: '🐍', cls: 'hunter', learn: 6, res: 'mana', cost: 45, desc: '毒蛇之毒入骨，每回合造成自然伤害，持续 4 回合。', dot: { per: 8, scale: 0.2, rounds: 4, type: 'nature' } },
    multishot: { id: 'multishot', name: '多重射击', icon: '💫', cls: 'hunter', learn: 14, res: 'mana', cost: 65, cd: 3, desc: '同时射出多支箭矢，攻击所有敌人。', aoe: 1, dmg: { base: 18, scale: 0.6, type: 'physical' } },
    summon_pet_tiger: { id: 'summon_pet_tiger', name: '召唤宠物', icon: '🐯', cls: 'hunter', learn: 1, res: 'mana', cost: 0, cd: 1, desc: '召唤当前出战的宠物伙伴协同作战（宠物栏可切换）。', summon: 'active' },
    tame_beast: { id: 'tame_beast', name: '驯服野兽', icon: '🪝', cls: 'hunter', learn: 5, res: 'mana', cost: 40, cd: 4, tame: 1, desc: '驯服生命值低于 50% 的野兽，加入宠物栏（击败野兽也有几率自动驯服）。' },
    feign_death: { id: 'feign_death', name: '假死', icon: '🪦', cls: 'hunter', learn: 10, res: 'mana', cost: 0, cd: 6, desc: '倒地装死，立即脱离战斗。', flee: 1 },
    aspect_of_hawk: { id: 'aspect_of_hawk', name: '鹰之守护', icon: '🦅', cls: 'hunter', passive: true, learn: 3, mod: { hit: 0.02, crit: 0.05 }, desc: '鹰之守护常驻：命中率提高 2%，暴击率提高 5%。' },
    /* ---- 盗贼 ---- */
    stealth: { id: 'stealth', name: '潜行', icon: '👤', cls: 'rogue', learn: 1, res: 'energy', cost: 15, cd: 2, desc: '遁入阴影，持续 2 回合，期间敌人命中减半。', buff: { key: 'stealth', val: 1, rounds: 2, name: '潜行' } },
    sinister_strike: { id: 'sinister_strike', name: '邪恶攻击', icon: '🗡️', cls: 'rogue', learn: 1, res: 'energy', cost: 45, desc: '挥砍目标，造成物理伤害并获得 1 点连击点数。', dmg: { base: 22, scale: 0.9, type: 'physical' }, combo: 1 },
    backstab: { id: 'backstab', name: '背刺', icon: '🔪', cls: 'rogue', learn: 5, res: 'energy', cost: 60, desc: '潜行中从背后偷袭，造成 250% 伤害并获得 2 点连击点数。', reqStealth: 1, breakStealth: 1, dmg: { base: 30, scale: 1.3, type: 'physical' }, stealthMult: 2.5, combo: 2 },
    eviscerate: { id: 'eviscerate', name: '剔骨', icon: '💢', cls: 'rogue', learn: 3, res: 'energy', cost: 35, desc: '消耗连击点数进行致命一刺，每点连击点数提升伤害 45%。', comboReq: 1, dmg: { base: 24, scale: 0.8, type: 'physical' }, comboSpend: 1, comboScale: 0.45 },
    slice_and_dice: { id: 'slice_and_dice', name: '切割', icon: '✂️', cls: 'rogue', passive: true, learn: 8, mod: { atkPct: 0.15 }, desc: '切割技艺炉火纯青：造成的伤害常驻提高 15%。' },
    sap: { id: 'sap', name: '闷棍', icon: '🥁', cls: 'rogue', learn: 12, res: 'energy', cost: 40, cd: 4, desc: '敲晕目标，眩晕 1 回合（打破潜行）。', reqStealth: 1, breakStealth: 1, cc: { type: 'stun', rounds: 1 } },
    vanish: { id: 'vanish', name: '消失', icon: '💨', cls: 'rogue', learn: 16, res: 'energy', cost: 0, cd: 5, desc: '凭空消失，立即进入潜行状态。', buff: { key: 'stealth', val: 1, rounds: 1, name: '消失' } },
    /* ---- 牧师 ---- */
    smite: { id: 'smite', name: '惩击', icon: '🌕', cls: 'priest', learn: 1, res: 'mana', cost: 50, desc: '以圣光惩击敌人，造成神圣伤害。', dmg: { base: 20, scale: 0.6, type: 'holy' } },
    shadow_word_pain: { id: 'shadow_word_pain', name: '暗言术：痛', icon: '🖤', cls: 'priest', learn: 2, res: 'mana', cost: 60, desc: '暗言咒印，每回合造成暗影伤害，持续 4 回合。', dot: { per: 9, scale: 0.22, rounds: 4, type: 'shadow' } },
    flash_heal: { id: 'flash_heal', name: '快速治疗', icon: '💠', cls: 'priest', learn: 4, res: 'mana', cost: 45, desc: '快速施放的治疗术。', heal: { base: 32, scale: 0.5 } },
    power_word_shield: { id: 'power_word_shield', name: '真言术：盾', icon: '🛡️', cls: 'priest', learn: 6, res: 'mana', cost: 55, cd: 3, desc: '真言护盾吸收伤害，持续 2 回合。', shield: { base: 35, scale: 0.6, rounds: 2 } },
    renew: { id: 'renew', name: '恢复', icon: '💚', cls: 'priest', learn: 8, res: 'mana', cost: 50, desc: '持续治疗，每回合恢复生命，持续 3 回合。', hot: { per: 14, scale: 0.25, rounds: 3 } },
    heal: { id: 'heal', name: '治疗术', icon: '✨', cls: 'priest', learn: 12, res: 'mana', cost: 75, desc: '圣光眷顾，恢复大量生命。', heal: { base: 55, scale: 0.9 } },
    mind_blast: { id: 'mind_blast', name: '心灵震爆', icon: '🧠', cls: 'priest', learn: 16, res: 'mana', cost: 70, cd: 4, desc: '以心灵之力爆发，造成大量暗影伤害。', dmg: { base: 36, scale: 1.0, type: 'shadow' } },
    meditation: { id: 'meditation', name: '冥想', icon: '🧘', cls: 'priest', passive: true, learn: 3, mod: { manaRegenPct: 0.15 }, desc: '冥想常驻：法力恢复速度提高 15%。' },
    /* ---- 萨满 ---- */
    lightning_bolt: { id: 'lightning_bolt', name: '闪电箭', icon: '⚡', cls: 'shaman', learn: 1, res: 'mana', cost: 55, desc: '召唤闪电轰击敌人，造成自然伤害。', dmg: { base: 24, scale: 0.7, type: 'nature' } },
    flame_shock: { id: 'flame_shock', name: '火焰震击', icon: '🔥', cls: 'shaman', learn: 2, res: 'mana', cost: 50, desc: '烈焰灼烧，立即造成伤害并每回合燃烧，持续 3 回合。', dmg: { base: 12, scale: 0.3, type: 'fire' }, dot: { per: 9, scale: 0.2, rounds: 3, type: 'fire' } },
    frost_shock: { id: 'frost_shock', name: '冰霜震击', icon: '❄️', cls: 'shaman', learn: 4, res: 'mana', cost: 48, cd: 3, desc: '寒冰侵袭，造成冰霜伤害并使目标攻击力降低 25%，持续 2 回合。', dmg: { base: 18, scale: 0.5, type: 'frost' }, debuff: { key: 'atk', pct: -0.25, rounds: 2, name: '冰霜' } },
    healing_wave: { id: 'healing_wave', name: '治疗波', icon: '🌊', cls: 'shaman', learn: 6, res: 'mana', cost: 80, desc: '水之力量，恢复大量生命。', heal: { base: 58, scale: 0.9 } },
    earth_shield: { id: 'earth_shield', name: '大地之盾', icon: '🗻', cls: 'shaman', passive: true, learn: 10, mod: { startShield: 22, startShieldSp: 0.5, shieldHeal: 6 }, desc: '大地之盾常驻：战斗开始时获得护盾，护盾存在期间受到攻击时恢复 6 点生命。' },
    stoneclaw_totem: { id: 'stoneclaw_totem', name: '石爪图腾', icon: '🗿', cls: 'shaman', learn: 14, res: 'mana', cost: 45, cd: 5, desc: '召唤石爪图腾，嘲讽敌人并协助作战。', summon: 'pet_totem' },
    bloodlust: { id: 'bloodlust', name: '嗜血', icon: '🩸', cls: 'shaman', passive: true, learn: 18, mod: { atkPct: 0.08 }, desc: '嗜血之欲常驻：造成的伤害提高 8%。' },
    /* ---- 法师 ---- */
    fireball: { id: 'fireball', name: '火球术', icon: '🔥', cls: 'mage', learn: 1, res: 'mana', cost: 60, desc: '投掷火球，造成大量火焰伤害。', dmg: { base: 32, scale: 0.85, type: 'fire' } },
    frostbolt: { id: 'frostbolt', name: '寒冰箭', icon: '❄️', cls: 'mage', learn: 2, res: 'mana', cost: 50, desc: '寒冰之箭，造成冰霜伤害并使目标攻击力降低 25%，持续 2 回合。', dmg: { base: 24, scale: 0.65, type: 'frost' }, debuff: { key: 'atk', pct: -0.25, rounds: 2, name: '寒冰' } },
    arcane_missiles: { id: 'arcane_missiles', name: '奥术飞弹', icon: '🔮', cls: 'mage', learn: 4, res: 'mana', cost: 55, desc: '连射三发奥术飞弹，造成奥术伤害。', dmg: { base: 30, scale: 0.8, type: 'arcane' } },
    blizzard: { id: 'blizzard', name: '暴风雪', icon: '🌨️', cls: 'mage', learn: 12, res: 'mana', cost: 85, cd: 4, desc: '召唤暴风雪，对所有敌人造成冰霜伤害并持续 2 回合。', aoe: 1, dmg: { base: 14, scale: 0.4, type: 'frost' }, dot: { per: 6, scale: 0.15, rounds: 2, type: 'frost' } },
    polymorph: { id: 'polymorph', name: '变羊术', icon: '🐑', cls: 'mage', learn: 8, res: 'mana', cost: 60, cd: 6, desc: '将目标变成绵羊 3 回合，受到伤害即解除。', cc: { type: 'sheep', rounds: 3 } },
    evocation: { id: 'evocation', name: '唤醒', icon: '🌌', cls: 'mage', learn: 16, res: 'mana', cost: 0, cd: 7, desc: '引导唤醒，每回合恢复 25% 法力，持续 2 回合。', manaHot: { pct: 0.25, rounds: 2 } },
    ice_block: { id: 'ice_block', name: '寒冰屏障', icon: '🧊', cls: 'mage', learn: 20, res: 'mana', cost: 90, cd: 8, desc: '冰晶封体，免疫所有伤害，持续 2 回合。', buff: { key: 'invuln', val: 1, rounds: 2, name: '冰封' } },
    arcane_intellect: { id: 'arcane_intellect', name: '奥术智慧', icon: '📖', cls: 'mage', passive: true, learn: 3, mod: { spellPowerPct: 0.15 }, desc: '奥术智慧常驻：法术强度提高 15%。' },
    /* ---- 术士 ---- */
    shadow_bolt: { id: 'shadow_bolt', name: '暗影箭', icon: '🌑', cls: 'warlock', learn: 1, res: 'mana', cost: 60, desc: '凝聚暗影能量，造成大量暗影伤害。', dmg: { base: 30, scale: 0.8, type: 'shadow' } },
    corruption: { id: 'corruption', name: '腐蚀术', icon: '☠️', cls: 'warlock', learn: 2, res: 'mana', cost: 55, desc: '腐蚀血肉，每回合造成暗影伤害，持续 4 回合。', dot: { per: 10, scale: 0.22, rounds: 4, type: 'shadow' } },
    immolate: { id: 'immolate', name: '献祭', icon: '🔥', cls: 'warlock', learn: 4, res: 'mana', cost: 60, desc: '烈焰献祭，立即造成伤害并每回合燃烧，持续 3 回合。', dmg: { base: 14, scale: 0.35, type: 'fire' }, dot: { per: 8, scale: 0.2, rounds: 3, type: 'fire' } },
    curse_of_agony: { id: 'curse_of_agony', name: '痛苦诅咒', icon: '😖', cls: 'warlock', learn: 6, res: 'mana', cost: 50, desc: '诅咒加深，每回合造成递增的暗影伤害，持续 5 回合。', dot: { per: 6, scale: 0.15, rounds: 5, type: 'shadow', ramp: 1 } },
    drain_life: { id: 'drain_life', name: '吸取生命', icon: '🧛', cls: 'warlock', learn: 10, res: 'mana', cost: 45, desc: '汲取目标生命力，造成暗影伤害并恢复等量生命。', dmg: { base: 20, scale: 0.55, type: 'shadow' }, lifesteal: 1 },
    summon_voidwalker: { id: 'summon_voidwalker', name: '召唤虚空行者', icon: '🕳️', cls: 'warlock', learn: 1, res: 'mana', cost: 0, cd: 1, desc: '从虚空召唤虚空行者担任护卫。', summon: 'pet_voidwalker' },
    summon_infernal: { id: 'summon_infernal', name: '召唤地狱火', icon: '🌋', cls: 'warlock', learn: 18, res: 'mana', cost: 60, cd: 6, shardCost: 3, desc: '消耗 3 枚灵魂碎片，召唤灼热的地狱火协同作战（自带嘲讽）。', summon: 'pet_infernal' },
    fear: { id: 'fear', name: '恐惧术', icon: '😱', cls: 'warlock', learn: 12, res: 'mana', cost: 75, cd: 5, desc: '使敌人陷入恐惧 2 回合，无法行动。', cc: { type: 'fear', rounds: 2 } },
    /* ---- 德鲁伊 ---- */
    wrath: { id: 'wrath', name: '愤怒', icon: '🌄', cls: 'druid', learn: 1, res: 'mana', cost: 45, desc: '呼唤自然之力，造成自然伤害。', dmg: { base: 20, scale: 0.6, type: 'nature' } },
    moonfire: { id: 'moonfire', name: '月火术', icon: '🌙', cls: 'druid', learn: 2, res: 'mana', cost: 50, desc: '月光灼烧，立即造成奥术伤害并持续 3 回合。', dmg: { base: 12, scale: 0.3, type: 'arcane' }, dot: { per: 8, scale: 0.2, rounds: 3, type: 'arcane' } },
    rejuvenation: { id: 'rejuvenation', name: '愈合', icon: '💚', cls: 'druid', learn: 4, res: 'mana', cost: 50, desc: '生命之种萌发，每回合恢复生命，持续 3 回合。', hot: { per: 15, scale: 0.25, rounds: 3 } },
    healing_touch: { id: 'healing_touch', name: '治疗之触', icon: '🖐️', cls: 'druid', learn: 8, res: 'mana', cost: 70, desc: '自然之力疗愈，恢复大量生命。', heal: { base: 52, scale: 0.85 } },
    thorns: { id: 'thorns', name: '荆棘术', icon: '🌵', cls: 'druid', passive: true, learn: 6, mod: { thorns: 6 }, desc: '荆棘护体常驻：受到近战攻击时反弹 6 点自然伤害。' },
    bear_form: { id: 'bear_form', name: '熊形态', icon: '🐻', cls: 'druid', passive: true, learn: 10, mod: { atkPct: 0.05, armorPct: 0.2 }, desc: '巨熊之力常驻：攻击力提高 5%，护甲提高 20%。' },
    cat_form: { id: 'cat_form', name: '猎豹形态', icon: '🐆', cls: 'druid', passive: true, learn: 14, mod: { atkPct: 0.15 }, desc: '猎豹之敏常驻：造成的伤害提高 15%。' },
    /* ---- 种族天赋技能 ---- */
    stoneform: { id: 'stoneform', name: '石像形态', icon: '🪨', race: 'dwarf', learn: 1, cd: 6, desc: '清除所有流血/中毒/疾病效果，护甲提高 20%，持续 3 回合。', cleanse: 1, buff: { key: 'armor', pct: 0.2, rounds: 3, name: '石像' } },
    shadowmeld: { id: 'shadowmeld', name: '影遁', icon: '🌒', race: 'night_elf', learn: 1, cd: 5, desc: '遁入阴影，敌人命中减半，下一次攻击伤害提高 50%，持续 1 回合。', buff: { key: 'stealth', val: 1, rounds: 1, name: '影遁' } },
    escape_artist: { id: 'escape_artist', name: '逃命专家', icon: '🦿', race: 'gnome', learn: 1, cd: 6, desc: '解除所有定身、减速和负面效果。', cleanse: 1, cleanseStrong: 1 },
    blood_fury: { id: 'blood_fury', name: '血性狂暴', icon: '😡', race: 'orc', passive: true, learn: 1, mod: { atkPct: 0.1 }, desc: '怒血沸腾常驻：攻击力提高 10%。' },
    war_stomp: { id: 'war_stomp', name: '战争践踏', icon: '👣', race: 'tauren', learn: 1, cd: 6, desc: '践踏大地，震晕所有敌人 1 回合并造成伤害。', aoe: 1, dmg: { base: 10, scale: 0.2, type: 'physical' }, cc: { type: 'stun', rounds: 1 }, ccAoe: 1 },
    berserking: { id: 'berserking', name: '狂暴', icon: '🫀', race: 'troll', passive: true, learn: 1, mod: { atkPct: 0.06 }, desc: '狂野之心常驻：造成的伤害提高 6%。' },
    will_of_forsaken: { id: 'will_of_forsaken', name: '亡灵意志', icon: '🧠', race: 'undead', learn: 1, cd: 5, desc: '驱散恐惧、定身与催眠，免疫控制 1 回合。', cleanse: 1, cleanseStrong: 1, buff: { key: 'ccImmune', val: 1, rounds: 1, name: '意志' } },
    cannibalize: { id: 'cannibalize', name: '吞噬尸体', icon: '🍖', race: 'undead', learn: 1, cd: 8, desc: '吞食敌人残躯，恢复 25% 最大生命。', healPct: 0.25 },

    /* ---- 天赋主动技能(三系天赋树·第3层 主动天赋解锁) ---- */
    // 战士
    recklessness: { id: 'recklessness', name: '鲁莽', icon: '🔥', cls: 'warrior', talent: 1, passive: true, learn: 10, mod: { atkPct: 0.09, crit: 0.05 }, desc: '杀意常驻：攻击力提高 9%，暴击率提高 5%。' },
    shield_wall: { id: 'shield_wall', name: '盾墙', icon: '🛡️', cls: 'warrior', talent: 1, passive: true, learn: 10, mod: { armorPct: 0.12 }, desc: '坚不可摧成为本能：护甲常驻提高 12%。' },
    death_wish: { id: 'death_wish', name: '死亡之愿', icon: '💀', cls: 'warrior', talent: 1, passive: true, learn: 10, mod: { atkPct: 0.09, crit: 0.02 }, desc: '蔑视死亡成为本能：攻击力常驻提高 9%，暴击率提高 2%。' },
    // 法师
    combustion: { id: 'combustion', name: '燃烧', icon: '☄️', cls: 'mage', talent: 1, passive: true, learn: 10, mod: { atkPct: 0.08, crit: 0.05 }, desc: '烈焰入体成为本能：攻击力常驻提高 8%，暴击率提高 5%。' },
    frost_armor: { id: 'frost_armor', name: '寒冰护体', icon: '🧊', cls: 'mage', talent: 1, passive: true, learn: 10, mod: { startShield: 26, startShieldSp: 0.45 }, desc: '寒冰护体常驻：战斗开始时自动获得一层冰霜护盾。' },
    arcane_power: { id: 'arcane_power', name: '奥术强化', icon: '🔮', cls: 'mage', talent: 1, passive: true, learn: 10, mod: { atkPct: 0.07 }, desc: '奥能涌动常驻：攻击力提高 7%。' },
    // 圣骑士
    lay_on_hands: { id: 'lay_on_hands', name: '圣疗术', icon: '🖐️', cls: 'paladin', talent: 1, learn: 10, res: 'mana', cost: 80, cd: 10, desc: '圣光灌注全身，立即恢复 100% 生命。', healPct: 1.0 },
    holy_shield: { id: 'holy_shield', name: '神圣防护', icon: '🌟', cls: 'paladin', talent: 1, passive: true, learn: 10, mod: { startShield: 24, startShieldSp: 0.4, armorPct: 0.05 }, desc: '神圣防护常驻：战斗开始时自动获得吸收护盾，护甲提高 5%。' },
    avenging_wrath: { id: 'avenging_wrath', name: '复仇之怒', icon: '⚔️', cls: 'paladin', talent: 1, passive: true, learn: 10, mod: { atkPct: 0.08, crit: 0.03 }, desc: '圣光之怒常驻：攻击力提高 8%，暴击率提高 3%。' },
    // 猎人
    bestial_wrath: { id: 'bestial_wrath', name: '狂野怒火', icon: '🐯', cls: 'hunter', talent: 1, passive: true, learn: 10, mod: { atkPct: 0.08, crit: 0.03, petAtkPct: 0.13 }, desc: '狂野怒火常驻：自身攻击力提高 8%、暴击率提高 3%，宠物攻击力提高 13%。' },
    rapid_fire: { id: 'rapid_fire', name: '急速射击', icon: '🏹', cls: 'hunter', talent: 1, passive: true, learn: 10, mod: { atkPct: 0.08 }, desc: '箭如雨下成为本能：攻击力常驻提高 8%。' },
    freezing_trap: { id: 'freezing_trap', name: '冰冻陷阱', icon: '❄️', cls: 'hunter', talent: 1, learn: 10, res: 'mana', cost: 40, cd: 5, desc: '冰封陷阱：定身目标 2 回合，无法行动。', cc: { type: 'root', rounds: 2 } },
    // 盗贼
    cold_blood: { id: 'cold_blood', name: '冷血', icon: '🧊', cls: 'rogue', talent: 1, learn: 10, res: 'energy', cost: 0, cd: 5, desc: '冷酷算计：下一次攻击必定暴击。', buff: { key: 'guaranteedCrit', val: 1, rounds: 2, name: '冷血' } },
    adrenaline_rush: { id: 'adrenaline_rush', name: '冲动', icon: '⚡', cls: 'rogue', talent: 1, learn: 10, res: 'energy', cost: 0, cd: 6, desc: '肾上腺素奔涌：能量恢复提高 25 点/回合，持续 2 回合。', buff: { key: 'energyRegen', val: 25, rounds: 2, name: '冲动' } },
    preparation: { id: 'preparation', name: '预备', icon: '🔄', cls: 'rogue', talent: 1, learn: 10, res: 'energy', cost: 0, cd: 8, desc: '重整旗鼓：立即重置所有技能冷却。', resetCd: 1 },
    // 牧师
    inner_fire: { id: 'inner_fire', name: '心灵之火', icon: '🕯️', cls: 'priest', talent: 1, passive: true, learn: 10, mod: { atkPct: 0.12, armorPct: 0.2 }, desc: '心灵之火常驻：攻击力提高 12%，护甲提高 20%。' },
    holy_nova: { id: 'holy_nova', name: '神圣新星', icon: '✨', cls: 'priest', talent: 1, learn: 10, res: 'mana', cost: 70, cd: 4, desc: '圣光爆发：对所有敌人造成神圣伤害，并为自己恢复生命。', aoe: 1, dmg: { base: 14, scale: 0.4, type: 'holy' }, heal: { base: 20, scale: 0.3 } },
    shadowform: { id: 'shadowform', name: '暗影形态', icon: '🌑', cls: 'priest', talent: 1, passive: true, learn: 10, mod: { atkPct: 0.08 }, desc: '化身暗影常驻：攻击力提高 8%。' },
    // 萨满
    elemental_mastery: { id: 'elemental_mastery', name: '元素掌握', icon: '🌋', cls: 'shaman', talent: 1, passive: true, learn: 10, mod: { atkPct: 0.07, crit: 0.03 }, desc: '元素之力常驻：攻击力提高 7%，暴击率提高 3%。' },
    stormstrike: { id: 'stormstrike', name: '风暴打击', icon: '⚡', cls: 'shaman', talent: 1, learn: 10, res: 'mana', cost: 65, cd: 4, desc: '风暴之力：造成物理伤害，并使目标受到的伤害提高 20%，持续 2 回合。', dmg: { base: 18, scale: 0.7, type: 'physical' }, debuff: { key: 'taken', pct: 0.2, rounds: 2, name: '风暴印记' } },
    mana_tide: { id: 'mana_tide', name: '法力之潮', icon: '🌊', cls: 'shaman', talent: 1, learn: 10, res: 'mana', cost: 0, cd: 8, desc: '潮汐之力：立即恢复 30% 最大法力。', manaPct: 0.3 },
    // 术士
    shadow_curse: { id: 'shadow_curse', name: '暗影诅咒', icon: '🔮', cls: 'warlock', talent: 1, learn: 10, res: 'mana', cost: 60, cd: 6, desc: '黑暗诅咒：目标受到的伤害提高 20%，持续 3 回合。', debuff: { key: 'taken', pct: 0.2, rounds: 3, name: '暗影诅咒' } },
    demonic_frenzy: { id: 'demonic_frenzy', name: '恶魔狂暴', icon: '😈', cls: 'warlock', talent: 1, passive: true, learn: 10, mod: { atkPct: 0.08, crit: 0.03, petAtkPct: 0.13 }, desc: '恶魔之力常驻：自身攻击力提高 8%、暴击率提高 3%，宠物攻击力提高 13%。' },
    hellfire: { id: 'hellfire', name: '地狱烈焰', icon: '🔥', cls: 'warlock', talent: 1, learn: 10, res: 'mana', cost: 75, cd: 5, desc: '烈焰焚身：对所有敌人造成火焰伤害，自身也受到少量伤害。', aoe: 1, dmg: { base: 22, scale: 0.5, type: 'fire' }, selfDmgPct: 0.12 },
    // 德鲁伊
    starfire: { id: 'starfire', name: '星火术', icon: '🌟', cls: 'druid', talent: 1, learn: 10, res: 'mana', cost: 60, cd: 3, desc: '星陨之力：造成大量自然伤害。', dmg: { base: 34, scale: 0.9, type: 'nature' } },
    berserk: { id: 'berserk', name: '狂暴', icon: '😡', cls: 'druid', talent: 1, passive: true, learn: 10, mod: { atkPct: 0.08, crit: 0.03 }, desc: '野性狂暴常驻：攻击力提高 8%，暴击率提高 3%。' },
    tranquility: { id: 'tranquility', name: '宁静', icon: '🌿', cls: 'druid', talent: 1, learn: 10, res: 'mana', cost: 90, cd: 8, desc: '自然之息：每回合恢复生命，持续 3 回合。', hot: { per: 22, scale: 0.3, rounds: 3 } },

    /* ---- 经典主动技能(第 2 批 · 天赋第 3 层) ---- */
    // 战士
    intimidating_shout: { id: 'intimidating_shout', name: '破胆怒吼', icon: '😱', cls: 'warrior', talent: 1, learn: 10, res: 'rage', cost: 25, cd: 6, desc: '威慑怒吼：恐惧所有敌人 1 回合并造成少量伤害。', aoe: 1, cc: { type: 'fear', rounds: 1 }, ccAoe: 1, dmg: { base: 10, scale: 0.2, type: 'physical' } },
    shield_slam: { id: 'shield_slam', name: '盾牌猛击', icon: '🛡️', cls: 'warrior', talent: 1, learn: 10, res: 'rage', cost: 20, cd: 4, desc: '以盾重击：造成物理伤害并使目标受到的伤害提高 10%，持续 2 回合。', dmg: { base: 20, scale: 0.6, type: 'physical' }, debuff: { key: 'taken', pct: 0.1, rounds: 2, name: '破甲' } },
    // 圣骑士
    repentance: { id: 'repentance', name: '忏悔', icon: '🙏', cls: 'paladin', talent: 1, learn: 10, res: 'mana', cost: 45, cd: 6, desc: '圣光责罚：令目标陷入忏悔（变形）2 回合，受到伤害会解除。', cc: { type: 'sheep', rounds: 2 } },
    holy_wrath: { id: 'holy_wrath', name: '神圣愤怒', icon: '💥', cls: 'paladin', talent: 1, learn: 10, res: 'mana', cost: 60, cd: 6, desc: '圣光之怒：对所有敌人造成神圣伤害。', aoe: 1, dmg: { base: 20, scale: 0.5, type: 'holy' } },
    // 猎人
    scatter_shot: { id: 'scatter_shot', name: '驱散射击', icon: '💫', cls: 'hunter', talent: 1, learn: 10, res: 'mana', cost: 35, cd: 4, desc: '精准一击：造成伤害并眩晕目标 1 回合。', dmg: { base: 12, scale: 0.3, type: 'physical' }, cc: { type: 'stun', rounds: 1 } },
    wyvern_sting: { id: 'wyvern_sting', name: '翼龙钉刺', icon: '🐉', cls: 'hunter', talent: 1, learn: 10, res: 'mana', cost: 50, cd: 6, desc: '翼龙之毒：令目标陷入沉睡（变形）2 回合，受到伤害会解除。', cc: { type: 'sheep', rounds: 2 } },
    // 法师
    presence_of_mind: { id: 'presence_of_mind', name: '气定神闲', icon: '🧘', cls: 'mage', talent: 1, learn: 10, res: 'mana', cost: 25, cd: 7, desc: '思维如水：下一次技能消耗为 0 且不进入冷却。', buff: { key: 'pom', val: 1, rounds: 2, name: '气定神闲' } },
    frost_nova: { id: 'frost_nova', name: '冰霜新星', icon: '❄️', cls: 'mage', talent: 1, learn: 10, res: 'mana', cost: 45, cd: 5, desc: '冰环爆发：定身所有敌人 1 回合并造成少量冰霜伤害。', aoe: 1, cc: { type: 'root', rounds: 1 }, ccAoe: 1, dmg: { base: 8, scale: 0.15, type: 'frost' } },
    pyroblast: { id: 'pyroblast', name: '炎爆术', icon: '☄️', cls: 'mage', talent: 1, learn: 10, res: 'mana', cost: 80, cd: 5, desc: '凝聚烈焰化为巨大火球，造成毁灭性火焰伤害。', dmg: { base: 60, scale: 1.4, type: 'fire' } },
    // 盗贼
    sprint: { id: 'sprint', name: '疾跑', icon: '💨', cls: 'rogue', talent: 1, learn: 10, res: 'energy', cost: 20, cd: 6, desc: '风驰电掣：攻击力提高 15%，闪避率提高 15%，持续 2 回合。', buffs: [{ key: 'atk', pct: 0.15, rounds: 2, name: '疾跑' }, { key: 'dodgePct', pct: 0.15, rounds: 2, name: '疾跑' }] },
    kidney_shot: { id: 'kidney_shot', name: '肾击', icon: '👊', cls: 'rogue', talent: 1, learn: 10, res: 'energy', cost: 40, cd: 3, desc: '重击要害：消耗全部连击点，眩晕目标 1 回合。', comboReq: 1, comboSpend: 1, cc: { type: 'stun', rounds: 1 } },
    // 牧师
    shadow_word_death: { id: 'shadow_word_death', name: '暗言术：灭', icon: '☠️', cls: 'priest', talent: 1, learn: 10, res: 'mana', cost: 70, cd: 4, desc: '暗言湮灭：造成大量暗影伤害，若目标因此死亡则自身受到反噬。', dmg: { base: 45, scale: 1.1, type: 'shadow' }, backfirePct: 0.2 },
    psychic_scream: { id: 'psychic_scream', name: '心灵尖啸', icon: '📢', cls: 'priest', talent: 1, learn: 10, res: 'mana', cost: 40, cd: 5, desc: '心灵冲击：恐惧目标 1 回合。', cc: { type: 'fear', rounds: 1 } },
    // 萨满
    chain_lightning: { id: 'chain_lightning', name: '闪电链', icon: '⚡', cls: 'shaman', talent: 1, learn: 10, res: 'mana', cost: 70, cd: 5, desc: '连环闪电：对所有敌人造成自然伤害。', aoe: 1, dmg: { base: 22, scale: 0.55, type: 'nature' } },
    // 术士
    death_coil: { id: 'death_coil', name: '死亡缠绕', icon: '🩸', cls: 'warlock', talent: 1, learn: 10, res: 'mana', cost: 60, cd: 5, desc: '暗影之触：造成暗影伤害、恐惧目标 1 回合，并为自身恢复生命。', dmg: { base: 24, scale: 0.6, type: 'shadow' }, cc: { type: 'fear', rounds: 1 }, heal: { base: 40, scale: 0.6 } },
    soul_fire: { id: 'soul_fire', name: '灵魂之火', icon: '🔥', cls: 'warlock', talent: 1, learn: 10, res: 'mana', cost: 85, cd: 6, shardCost: 1, desc: '燃烧灵魂碎片：造成毁灭性暗影伤害（消耗 1 枚灵魂碎片）。', dmg: { base: 75, scale: 1.5, type: 'shadow' } },
    // 德鲁伊
    faerie_fire: { id: 'faerie_fire', name: '精灵之火', icon: '✨', cls: 'druid', talent: 1, learn: 10, res: 'mana', cost: 30, cd: 3, desc: '精灵辉光：目标受到的伤害提高 10%，持续 3 回合。', debuff: { key: 'taken', pct: 0.1, rounds: 3, name: '精灵之火' } },
    tigers_fury: { id: 'tigers_fury', name: '猛虎之怒', icon: '🐯', cls: 'druid', talent: 1, passive: true, learn: 10, mod: { atkPct: 0.08 }, desc: '虎踞龙盘成为本能：攻击力常驻提高 8%。' },
  };

  /* ============ 宠物 ============ */
  D.PETS = {
    pet_tiger: { id: 'pet_tiger', name: '白虎', icon: '🐯', role: '输出', hpMult: 0.45, atkMult: 0.7, armor: 10, desc: '敏捷的野兽伙伴，撕咬敌人。', skills: [{ id: 'pet_bite', name: '撕咬', icon: '🦷', cd: 2, mult: 1.6, desc: '凶狠撕咬，造成高额伤害。' }] },
    pet_voidwalker: { id: 'pet_voidwalker', name: '虚空行者', icon: '🕳️', role: '坦克', hpMult: 0.85, atkMult: 0.45, armor: 25, taunt: 1, desc: '来自虚空的守护者，嘲讽敌人保护主人。', skills: [{ id: 'pet_shadow_bolt', name: '暗影打击', icon: '🌑', cd: 3, mult: 1.4, desc: '以暗影能量轰击敌人。' }] },
    pet_infernal: { id: 'pet_infernal', name: '地狱火', icon: '🌋', role: '输出 · 坦克', hpMult: 0.8, atkMult: 0.7, armor: 30, taunt: 1, desc: '燃烧的地狱火魔像，灼烧一切敌人。', skills: [{ id: 'pet_immolate', name: '献祭灼烧', icon: '🔥', cd: 2, mult: 1.8, desc: '以地狱烈焰灼烧敌人。' }] },
    pet_totem: { id: 'pet_totem', name: '石爪图腾', icon: '🗿', role: '坦克', hpMult: 0.7, atkMult: 0.4, armor: 20, taunt: 1, rounds: 3, desc: '远古石爪图腾，吸引敌人攻击。', skills: [] },
  };

  /* 将野兽怪物转换为可驯服的宠物定义(运行时读取 D.MONSTERS / D.MONSTER_SKILLS) */
  D.makePetDef = function (m) {
    if (!m) return null;
    if (D.PETS[m.id]) return D.PETS[m.id];
    const skills = (m.skills || []).map((sid) => {
      const s = D.MONSTER_SKILLS[sid];
      return s ? { id: s.id, name: s.name, icon: s.icon, cd: s.cd || 2, mult: s.mult || 1, desc: s.desc } : null;
    }).filter(Boolean);
    return {
      id: m.id, name: m.name, icon: m.icon, role: '野兽伙伴',
      hpMult: m.elite || m.boss ? 0.5 : 0.55,
      atkMult: 0.75, armor: Math.max(8, Math.floor((m.armor || 10) * 0.5)),
      skills, desc: '驯服自野外' + m.name + '的野兽伙伴。',
    };
  };
})();
