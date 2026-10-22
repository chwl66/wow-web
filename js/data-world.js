/* 魔兽世界 · 战大陆 — 区域 / 怪物 / 物品 / 任务 数据 */
(function () {
  'use strict';
  const W = window.WOW;
  const D = W.Data = W.Data || {};

  /* ============ 怪物技能(敌方 AI 使用) ============ */
  D.MONSTER_SKILLS = {
    m_bite:      { id: 'm_bite',      name: '撕咬',   icon: '🦷', mult: 1.35, cd: 2, desc: '猛力撕咬目标。' },
    m_claw:      { id: 'm_claw',      name: '爪击',   icon: '🐾', mult: 1.2,  cd: 1, desc: '利爪挥击。' },
    m_rend:      { id: 'm_rend',      name: '撕裂',   icon: '🩸', dot: { per: 0.12, rounds: 3 }, cd: 3, desc: '撕裂伤口，持续流血。' },
    m_poison:    { id: 'm_poison',    name: '毒液',   icon: '☠️', dot: { per: 0.1, rounds: 3 }, cd: 3, desc: '注入毒液，持续中毒。' },
    m_bash:      { id: 'm_bash',      name: '击晕',   icon: '💫', stun: 1, cd: 4, desc: '重击头部，眩晕 1 回合。' },
    m_charge:    { id: 'm_charge',    name: '猛冲',   icon: '💨', mult: 1.5, stun: 1, cd: 4, desc: '野蛮冲撞，造成伤害并眩晕。' },
    m_war_cry:   { id: 'm_war_cry',   name: '战吼',   icon: '📢', atkBuff: 0.2, rounds: 3, cd: 4, desc: '怒吼提升攻击力。' },
    m_fireball:  { id: 'm_fireball',  name: '火球术', icon: '🔥', mult: 1.6, magic: 1, cd: 3, desc: '投掷火球造成火焰伤害。' },
    m_shadow:    { id: 'm_shadow',    name: '暗影箭', icon: '🌑', mult: 1.5, magic: 1, cd: 3, desc: '暗影能量轰击。' },
    m_frost:     { id: 'm_frost',     name: '冰霜箭', icon: '❄️', mult: 1.4, magic: 1, slow: 1, cd: 3, desc: '寒冰之箭，减速目标。' },
    m_heal:      { id: 'm_heal',      name: '治疗',   icon: '✨', healPct: 0.13, cd: 4, desc: '恢复自身生命。' },
    /* Boss 专属 */
    m_breath:    { id: 'm_breath',    name: '剧毒吐息', icon: '🤢', aoe: 1, dot: { per: 0.1, rounds: 3 }, cd: 3, desc: '喷吐剧毒，所有敌人持续中毒。' },
    m_regen:     { id: 'm_regen',     name: '再生',   icon: '🌿', hot: { per: 0.05, rounds: 3 }, cd: 5, desc: '急速再生，持续恢复生命。' },
    m_enrage:    { id: 'm_enrage',    name: '狂暴',   icon: '😡', atkBuff: 0.3, rounds: 5, cd: 99, once: 1, desc: '血量危急时狂暴化，攻击力大幅提升！' },
    m_summon:    { id: 'm_summon',    name: '召唤爪牙', icon: '👥', summon: 'dm_add', cd: 4, desc: '召唤迪菲亚爪牙助战！' },
    /* ===== 团本首领独特机制 ===== */
    m_eye_beam:      { id: 'm_eye_beam',      name: '眼棱',     icon: '👁️', sig: 1, mult: 1.75, magic: 1, cd: 4, debuff: { key: 'eye_burn', name: '眼棱灼烧', mod: { armorPct: -0.15 }, rounds: 2 }, desc: '克苏恩之眼射出一道眼棱，灼烧目标的护甲。' },
    /* ===== 5 人副本首领独特机制 ===== */
    m_flurry:        { id: 'm_flurry',        name: '双刀乱舞', icon: '🗡️', sig: 1, mult: 1.4, aoe: 1, cd: 4, debuff: { key: 'flurry_crush', name: '乱舞压制', mod: { atkPct: -0.12 }, rounds: 2 }, desc: '范克里夫双刀疾舞，横扫全场并压制目标的攻击。' },
    m_slime_spit:    { id: 'm_slime_spit',    name: '毒液喷吐', icon: '☠️', sig: 1, mult: 1.25, magic: 1, cd: 3, dot: { per: 0.1, rounds: 3 }, dotType: 'nature', debuff: { key: 'slime_acid', name: '酸蚀', mod: { armorPct: -0.12 }, rounds: 2 }, desc: '喷吐腐蚀酸液，持续中毒并溶解护甲。' },
    m_worgen_curse:  { id: 'm_worgen_curse',  name: '狼人诅咒', icon: '🐺', sig: 1, summon: 'sfk_worgen', cd: 5, debuff: { key: 'worgen_curse', name: '狼化诅咒', mod: { healTaken: -0.2 }, rounds: 3 }, desc: '阿鲁高的诅咒召来狼人，并抑制目标的治疗效果。' },
    m_titan_slam:    { id: 'm_titan_slam',    name: '泰坦震击', icon: '🏛️', sig: 1, mult: 0.9, aoe: 1, stun: 1, cd: 7, desc: '远古石像苏醒，雷霆一击眩晕全场。' },
    m_quake:         { id: 'm_quake',         name: '大地震击', icon: '🌍', sig: 1, mult: 1.4, aoe: 1, cd: 4, debuff: { key: 'quake_armor', name: '地裂碎甲', mod: { armorPct: -0.15 }, rounds: 2 }, desc: '瑟莱德丝以大地之力震裂地面，削碎目标的护甲。' },
    m_sandstorm:     { id: 'm_sandstorm',     name: '沙尘风暴', icon: '🌀', sig: 1, mult: 1.3, magic: 1, aoe: 1, cd: 4, debuff: { key: 'sand_blind', name: '沙盲', mod: { atkPct: -0.15 }, rounds: 2 }, desc: '掀起遮天蔽日的沙尘，迷盲并削弱目标的攻击。' },
    m_molten_fury:   { id: 'm_molten_fury',   name: '熔火之怒', icon: '🌋', sig: 1, mult: 1.15, magic: 1, cd: 6, dot: { per: 0.05, rounds: 3 }, dotType: 'fire', desc: '唤起熔火之力轰击目标，使其持续灼烧。' },
    m_raise_dead:    { id: 'm_raise_dead',    name: '亡者复生', icon: '☠️', sig: 1, summon: 'sch_apprentice', magic: 1, cd: 8, desc: '加丁的咒语唤醒亡灵学徒为其作战。' },
    m_frost_chain:   { id: 'm_frost_chain',   name: '寒冰锁链', icon: '❄️', sig: 1, mult: 1.6, magic: 1, cd: 4, slow: 1, dot: { per: 0.06, rounds: 3 }, dotType: 'frost', desc: '掷出寒冰锁链冻结目标，持续冰伤并减速。' },
    m_flame_breath:  { id: 'm_flame_breath',  name: '烈焰吐息', icon: '🔥', sig: 1, mult: 1.5, magic: 1, aoe: 1, cd: 4, dot: { per: 0.06, rounds: 3 }, dotType: 'fire', desc: '喷吐灼热龙焰，焚烧所有敌人并造成持续灼伤。' },
    m_death_coil:    { id: 'm_death_coil',    name: '死亡缠绕', icon: '💀', sig: 1, mult: 1.8, magic: 1, cd: 4, debuff: { key: 'death_siphon', name: '生命虹吸', mod: { healTaken: -0.25 }, rounds: 2 }, desc: '以死灵之力缠绕目标，重创并抑制其治疗。' },
    m_arcane_nova:   { id: 'm_arcane_nova',   name: '奥术新星', icon: '🔮', sig: 1, mult: 1.6, magic: 1, aoe: 1, cd: 5, debuff: { key: 'arcane_drain', name: '奥术冲击', mod: { atkPct: -0.12 }, rounds: 2 }, desc: '释放奥术能量冲击全场，干扰目标的施法。' },
    m_wing_buffet:   { id: 'm_wing_buffet',   name: '龙翼打击', icon: '🪽', sig: 1, mult: 1.6, aoe: 1, cd: 3, debuff: { key: 'wing_crush', name: '龙翼重创', mod: { atkPct: -0.15 }, rounds: 2 }, desc: '巨龙振翅横扫，击退敌人并削弱其攻击。' },
    m_lava_burst:    { id: 'm_lava_burst',    name: '熔岩轰击', icon: '🌋', sig: 1, mult: 1.9, magic: 1, cd: 4, dot: { per: 0.06, rounds: 3 }, desc: '投掷滚烫熔岩，造成火焰伤害并持续灼烧。' },
    m_deep_breath:   { id: 'm_deep_breath',   name: '深呼吸',   icon: '🔥', sig: 1, mult: 2.0, magic: 1, aoe: 1, cd: 5, dot: { per: 0.05, rounds: 3 }, desc: '深吸一口气，喷吐毁灭性的烈焰风暴！' },
    m_corrupted_blood: { id: 'm_corrupted_blood', name: '腐化之血', icon: '🩸', sig: 1, mult: 0.7, magic: 1, cd: 4, dot: { per: 0.1, rounds: 3 }, debuff: { key: 'corruption', name: '腐化', mod: { healTaken: -0.3 }, rounds: 3 }, desc: '释放腐化之血，持续侵蚀并抑制治疗。' },
    /* ===== 新增 8 副本首领独特机制 ===== */
    m_burning_hex:    { id: 'm_burning_hex',    name: '燃尽魔印', icon: '🔥', sig: 1, mult: 1.5, magic: 1, cd: 4, dot: { per: 0.07, rounds: 3 }, dotType: 'fire', desc: '杰尔戈什烙下燃尽魔印，持续灼烧目标的灵魂。' },
    m_prison_chain:   { id: 'm_prison_chain',   name: '监狱铁链', icon: '⛓️', sig: 1, mult: 1.35, aoe: 1, cd: 4, debuff: { key: 'shackled', name: '镣铐压制', mod: { atkPct: -0.12 }, rounds: 2 }, desc: '斯奈德甩出铁链横扫全场，压制所有敌人的攻击。' },
    m_shadow_tide:    { id: 'm_shadow_tide',    name: '暗影潮汐', icon: '🌊', sig: 1, mult: 1.5, magic: 1, aoe: 1, cd: 5, debuff: { key: 'tide_erode', name: '潮汐侵蚀', mod: { armorPct: -0.15 }, rounds: 2 }, desc: '阿库麦尔掀起暗影潮汐冲击全场，侵蚀目标的护甲。' },
    m_radiation:      { id: 'm_radiation',      name: '辐射污染', icon: '☢️', sig: 1, mult: 1.4, magic: 1, cd: 5, dot: { per: 0.08, rounds: 3 }, dotType: 'nature', debuff: { key: 'rad_sick', name: '辐射病', mod: { atkPct: -0.12 }, rounds: 2 }, desc: '瑟玛普拉格释放致命辐射，令目标持续中毒并虚弱。' },
    m_razor_charge:   { id: 'm_razor_charge',   name: '剃刀冲锋', icon: '🐗', sig: 1, mult: 1.4, aoe: 1, cd: 4, dot: { per: 0.06, rounds: 3 }, dotType: 'nature', desc: '卡尔加狂暴冲锋，剃刀撕裂所有敌人的血肉。' },
    m_cold_grave:     { id: 'm_cold_grave',     name: '冰寒墓地', icon: '❄️', sig: 1, mult: 1.15, magic: 1, cd: 5, slow: 1, dot: { per: 0.04, rounds: 3 }, dotType: 'frost', debuff: { key: 'grave_chill', name: '墓穴寒意', mod: { atkPct: -0.08 }, rounds: 2 }, desc: '阿姆纳尔召唤冰寒墓地的死气，冻结并削弱目标。' },
    m_holy_wrath:     { id: 'm_holy_wrath',     name: '圣光之怒', icon: '☀️', sig: 1, mult: 1.35, magic: 1, aoe: 1, cd: 5, debuff: { key: 'holy_burn', name: '圣焰灼心', mod: { healTaken: -0.2 }, rounds: 3 }, desc: '怀特迈恩以灼热圣光轰击全场，抑制目标的治疗。' },
    m_soul_drain:     { id: 'm_soul_drain',     name: '灵魂汲取', icon: '🩸', sig: 1, mult: 1.45, magic: 1, cd: 5, dot: { per: 0.05, rounds: 3 }, dotType: 'shadow', debuff: { key: 'soul_leak', name: '灵魂流失', mod: { healTaken: -0.2 }, rounds: 3 }, desc: '哈卡之影汲取目标的灵魂，持续流失生命并抑制治疗。' },
  };

  /* ============ 怪物 ============ */
  const M = (id, name, icon, level, hp, atk, armor, xp, gold, kind, skills, extra) => Object.assign({
    id, name, icon, level, hp, atk, armor, xp, gold,
    kind: kind || 'humanoid', skills: skills || [], ai: 'smart',
  }, extra);

  D.MONSTERS = {
    /* 艾尔文森林 (1-6) */
    elwynn_boar:      M('elwynn_boar', '森林野猪', '🐗', 1, 58, [7, 10], 4, 12, 8, 'beast', ['m_bite']),
    elwynn_wolf:      M('elwynn_wolf', '灰狼', '🐺', 2, 72, [9, 13], 5, 16, 12, 'beast', ['m_bite', 'm_rend']),
    elwynn_kobold:    M('elwynn_kobold', '狗头人矿工', '🕯️', 2, 68, [8, 12], 6, 15, 14, 'humanoid', ['m_claw', 'm_bash']),
    elwynn_bandit:    M('elwynn_bandit', '迪菲亚强盗', '🔪', 4, 95, [12, 17], 8, 26, 26, 'humanoid', ['m_bite', 'm_rend', 'm_bash']),
    hogger:           M('hogger', '霍格', '👹', 6, 340, [18, 24], 12, 120, 80, 'humanoid', ['m_rend', 'm_charge', 'm_war_cry'], { elite: 1, title: '艾尔文森林的梦魇' }),
    /* 西部荒野 (7-12) */
    westfall_golem:   M('westfall_golem', '收割傀儡', '🤖', 8, 160, [20, 27], 18, 55, 42, 'elemental', ['m_claw', 'm_war_cry']),
    westfall_gnoll:   M('westfall_gnoll', '豺狼人战士', '🐕', 9, 185, [22, 30], 16, 62, 48, 'humanoid', ['m_bite', 'm_rend']),
    westfall_sailor:  M('westfall_sailor', '迪菲亚水手', '⛵', 10, 205, [25, 33], 17, 72, 55, 'humanoid', ['m_bite', 'm_bash']),
    westfall_croc:    M('westfall_croc', '死沼鳄鱼', '🐊', 11, 240, [27, 36], 22, 82, 62, 'beast', ['m_bite', 'm_rend', 'm_bash']),
    /* 赤脊山 (10-14) */
    redridge_lizard:  M('redridge_lizard', '赤脊山蜥蜴', '🦎', 11, 225, [26, 35], 20, 80, 60, 'beast', ['m_bite', 'm_poison']),
    redridge_orc:     M('redridge_orc', '黑石兽人', '🧌', 13, 265, [30, 40], 24, 98, 78, 'humanoid', ['m_claw', 'm_war_cry', 'm_bash']),
    redridge_ogre:    M('redridge_ogre', '石锤食人魔', '👺', 14, 300, [34, 45], 28, 112, 90, 'humanoid', ['m_charge', 'm_rend', 'm_war_cry']),
    /* 暮色森林 (13-18) */
    dusk_ghoul:       M('dusk_ghoul', '腐烂食尸鬼', '🧟', 14, 290, [33, 44], 24, 110, 85, 'undead', ['m_bite', 'm_rend']),
    dusk_hound:       M('dusk_hound', '暗影猎犬', '🐕‍🦺', 16, 340, [38, 50], 26, 132, 105, 'beast', ['m_bite', 'm_poison', 'm_bash']),
    dusk_spider:      M('dusk_spider', '暮色毒蛛', '🕷️', 17, 360, [40, 53], 27, 145, 115, 'beast', ['m_poison', 'm_bite']),
    arugal_shadow:    M('arugal_shadow', '阿鲁高之影', '👻', 18, 780, [46, 60], 30, 420, 300, 'undead', ['m_shadow', 'm_rend', 'm_war_cry'], { elite: 1, title: '暮色森林的领主' }),
    /* 杜隆塔尔 (1-6) */
    durotar_boar:     M('durotar_boar', '杜隆塔尔野猪', '🐗', 1, 60, [7, 11], 5, 12, 8, 'beast', ['m_bite']),
    durotar_scorpion: M('durotar_scorpion', '沙漠毒蝎', '🦂', 3, 82, [10, 14], 8, 20, 18, 'beast', ['m_claw', 'm_poison']),
    durotar_traitor:  M('durotar_traitor', '叛逃兽人', '💢', 4, 92, [12, 16], 9, 25, 24, 'humanoid', ['m_bite', 'm_rend']),
    durotar_centaur:  M('durotar_centaur', '半人马斥候', '🏇', 5, 110, [14, 19], 10, 32, 30, 'humanoid', ['m_claw', 'm_bash']),
    /* 贫瘠之地 (8-14) */
    barrens_lion:     M('barrens_lion', '平原狮', '🦁', 8, 165, [20, 28], 16, 55, 42, 'beast', ['m_bite', 'm_rend']),
    barrens_centaur:  M('barrens_centaur', '半人马强盗', '🏹', 10, 210, [25, 34], 18, 72, 55, 'humanoid', ['m_bite', 'm_bash']),
    barrens_lizard:   M('barrens_lizard', '雷霆蜥蜴', '🦎', 12, 250, [29, 38], 22, 90, 70, 'beast', ['m_charge', 'm_poison']),
    barrens_quill:    M('barrens_quill', '钢鬃野猪人', '🐷', 14, 300, [33, 44], 26, 110, 88, 'humanoid', ['m_war_cry', 'm_bite', 'm_bash']),
    /* 死亡矿井 (副本) */
    dm_sailor:        M('dm_sailor', '迪菲亚水手', '⛵', 15, 250, [31, 41], 26, 128, 100, 'humanoid', ['m_bite', 'm_bash']),
    dm_wizard:        M('dm_wizard', '迪菲亚巫师', '🔮', 16, 230, [34, 38], 20, 140, 110, 'humanoid', ['m_fireball', 'm_shadow']),
    dm_greenpaw:      M('dm_greenpaw', '绿皮队长', '🧑‍✈️', 17, 720, [40, 52], 32, 460, 320, 'humanoid', ['m_charge', 'm_war_cry', 'm_rend'], { elite: 1, title: '死亡矿井 · 精英' }),
    vancleef:         M('vancleef', '埃德温·范克里夫', '🎩', 18, 950, [38, 48], 36, 900, 700, 'humanoid', ['m_flurry', 'm_rend', 'm_bash', 'm_summon'], { elite: 1, boss: 1, title: '死亡矿井 · 最终首领' }),
    /* 哀嚎洞穴 (副本) */
    wc_bat:           M('wc_bat', '洞穴蝙蝠', '🦇', 13, 230, [30, 38], 22, 104, 82, 'beast', ['m_bite', 'm_rend']),
    wc_viper:         M('wc_viper', '毒牙蛇', '🐍', 14, 245, [32, 41], 24, 116, 92, 'beast', ['m_poison', 'm_bite']),
    wc_fang:          M('wc_fang', '尖牙德鲁伊', '🧝', 15, 700, [38, 48], 30, 430, 300, 'humanoid', ['m_fireball', 'm_heal', 'm_war_cry'], { elite: 1, title: '哀嚎洞穴 · 精英' }),
    mutanus:          M('mutanus', '穆坦努斯', '🐉', 17, 900, [38, 48], 34, 860, 680, 'beast', ['m_slime_spit', 'm_breath', 'm_regen'], { elite: 1, boss: 1, title: '哀嚎洞穴 · 最终首领' }),
    /* 荆棘谷 (18-26) */
    stv_panther:      M('stv_panther', '丛林豹', '🐆', 18, 385, [44, 58], 28, 148, 118, 'beast', ['m_bite', 'm_rend']),
    stv_ape:          M('stv_ape', '猿猴战士', '🐵', 20, 425, [49, 64], 30, 163, 132, 'beast', ['m_claw', 'm_bash']),
    stv_tiger:        M('stv_tiger', '荆棘谷猛虎', '🐅', 22, 460, [53, 70], 33, 178, 145, 'beast', ['m_bite', 'm_rend', 'm_charge']),
    stv_basilisk:     M('stv_basilisk', '石蜥蜴', '🦎', 24, 500, [57, 75], 38, 194, 158, 'beast', ['m_bite', 'm_poison']),
    stv_elite:        M('stv_elite', '血帆海盗船长', '🏴‍☠️', 26, 1250, [66, 86], 42, 620, 420, 'humanoid', ['m_rend', 'm_bash', 'm_war_cry'], { elite: 1, title: '荆棘谷 · 血帆首领' }),
    /* 荒芜之地 (26-34) */
    badlands_wolf:    M('badlands_wolf', '荒原狼', '🐺', 26, 540, [62, 82], 40, 210, 170, 'beast', ['m_bite', 'm_rend']),
    badlands_scorpion: M('badlands_scorpion', '沙地巨蝎', '🦂', 28, 580, [66, 87], 44, 225, 183, 'beast', ['m_claw', 'm_poison']),
    badlands_vulture: M('badlands_vulture', '秃鹫', '🦅', 30, 620, [70, 93], 46, 240, 196, 'beast', ['m_bite', 'm_rend', 'm_bash']),
    badlands_ogre:    M('badlands_ogre', '食人魔蛮兵', '👺', 32, 660, [75, 99], 52, 255, 210, 'humanoid', ['m_charge', 'm_war_cry', 'm_bash']),
    badlands_elite:   M('badlands_elite', '熔岩犬首领', '🔥', 34, 1650, [88, 116], 58, 850, 560, 'beast', ['m_breath', 'm_rend', 'm_war_cry'], { elite: 1, title: '荒芜之地 · 熔岩守护者' }),
    /* 灼热峡谷 (34-42) */
    searing_lava:     M('searing_lava', '熔岩元素', '🌋', 34, 700, [78, 103], 54, 270, 222, 'elemental', ['m_fireball', 'm_charge']),
    searing_dwarf:    M('searing_dwarf', '黑铁矮人矿工', '⛏️', 36, 740, [82, 108], 58, 285, 236, 'humanoid', ['m_bash', 'm_war_cry']),
    searing_lizard:   M('searing_lizard', '火蜥蜴', '🦎', 38, 780, [86, 114], 62, 300, 250, 'beast', ['m_bite', 'm_poison']),
    searing_elemental: M('searing_elemental', '焦灼守卫', '🤖', 40, 830, [91, 120], 68, 316, 264, 'elemental', ['m_fireball', 'm_bash', 'm_war_cry']),
    searing_elite:    M('searing_elite', '黑铁督军', '🪓', 42, 2050, [106, 140], 75, 1050, 720, 'humanoid', ['m_charge', 'm_war_cry', 'm_rend'], { elite: 1, title: '灼热峡谷 · 黑铁督军' }),
    /* 燃烧平原 (42-50) */
    burning_whelp:    M('burning_whelp', '黑石幼龙', '🐉', 42, 860, [95, 126], 70, 332, 276, 'beast', ['m_bite', 'm_fireball']),
    burning_orc:      M('burning_orc', '黑石精英兽人', '🧌', 44, 910, [100, 132], 76, 350, 290, 'humanoid', ['m_claw', 'm_war_cry', 'm_bash']),
    burning_hound:    M('burning_hound', '熔核猎犬', '🐕‍🦺', 46, 960, [105, 139], 80, 368, 305, 'beast', ['m_bite', 'm_rend', 'm_poison']),
    burning_dragon:   M('burning_dragon', '大熔炉龙兽', '🐲', 48, 1020, [110, 146], 86, 386, 320, 'beast', ['m_fireball', 'm_bite', 'm_charge']),
    burning_elite:    M('burning_elite', '大熔炉守卫', '👹', 50, 2500, [128, 170], 95, 1300, 900, 'humanoid', ['m_charge', 'm_war_cry', 'm_enrage'], { elite: 1, title: '燃烧平原 · 大熔炉的守望者' }),
    /* 冬泉谷 (50-58) */
    winter_frostwolf: M('winter_frostwolf', '冬泉霜狼', '🐺', 50, 1020, [112, 148], 90, 400, 330, 'beast', ['m_bite', 'm_rend']),
    winter_yeti:      M('winter_yeti', '雪人', '🦍', 52, 1080, [117, 155], 96, 420, 345, 'humanoid', ['m_charge', 'm_bash', 'm_war_cry']),
    winter_owl:       M('winter_owl', '雪原枭兽', '🦉', 54, 1140, [122, 162], 102, 440, 360, 'beast', ['m_frost', 'm_bite']),
    winter_giant:     M('winter_giant', '冰霜巨人', '🗿', 56, 1200, [128, 170], 110, 460, 375, 'humanoid', ['m_charge', 'm_rend', 'm_war_cry']),
    winter_elite:     M('winter_elite', '深冬之影', '👁️', 58, 2950, [148, 196], 120, 1600, 1100, 'undead', ['m_shadow', 'm_frost', 'm_enrage'], { elite: 1, title: '冬泉谷 · 深冬之影' }),
    /* 千针石林 (18-26) */
    needle_vulture:   M('needle_vulture', '千针秃鹫', '🦅', 18, 380, [44, 58], 27, 147, 117, 'beast', ['m_bite', 'm_rend']),
    needle_coyote:    M('needle_coyote', '荒漠郊狼', '🐺', 20, 420, [49, 64], 30, 162, 130, 'beast', ['m_bite', 'm_bash']),
    needle_turtle:    M('needle_turtle', '深水龟', '🐢', 22, 470, [52, 68], 40, 178, 145, 'beast', ['m_bite', 'm_rend']),
    needle_centaur:   M('needle_centaur', '裂蹄半人马', '🏹', 24, 500, [57, 75], 36, 194, 158, 'humanoid', ['m_bite', 'm_charge', 'm_bash']),
    needle_elite:     M('needle_elite', '雷角酋长', '🦬', 26, 1230, [66, 88], 42, 620, 420, 'humanoid', ['m_charge', 'm_war_cry', 'm_rend'], { elite: 1, title: '千针石林 · 雷角酋长' }),
    /* 尘泥沼泽 (26-34) */
    marsh_croc:       M('marsh_croc', '巨型沼泽鳄鱼', '🐊', 26, 545, [62, 82], 42, 210, 170, 'beast', ['m_bite', 'm_rend']),
    marsh_slime:      M('marsh_slime', '泥沼软泥怪', '🫠', 28, 590, [66, 87], 40, 225, 183, 'elemental', ['m_poison', 'm_bash']),
    marsh_spider:     M('marsh_spider', '沼泽毒蛛', '🕷️', 30, 625, [70, 92], 46, 240, 196, 'beast', ['m_poison', 'm_bite']),
    marsh_ogre:       M('marsh_ogre', '泥沼食人魔', '👺', 32, 665, [75, 99], 50, 255, 210, 'humanoid', ['m_charge', 'm_war_cry']),
    marsh_elite:      M('marsh_elite', '沼泽巫医', '🧙', 34, 1600, [86, 112], 55, 830, 550, 'humanoid', ['m_fireball', 'm_shadow', 'm_heal'], { elite: 1, title: '尘泥沼泽 · 沼泽巫医' }),
    /* 塔纳利斯 (34-42) */
    tanaris_vulture:  M('tanaris_vulture', '塔纳利斯秃鹫', '🦅', 34, 695, [78, 103], 52, 270, 222, 'beast', ['m_bite', 'm_rend']),
    /* ===== 31-35 段野怪补充(充实野外刷怪) ===== */
    badlands_basilisk: M('badlands_basilisk', '石皮蜥蜴', '🦎', 31, 630, [72, 95], 50, 242, 198, 'beast', ['m_bite', 'm_poison']),
    badlands_raptor:   M('badlands_raptor', '荒原迅猛龙', '🦖', 33, 675, [77, 101], 52, 262, 216, 'beast', ['m_bite', 'm_rend', 'm_charge']),
    marsh_turtle:      M('marsh_turtle', '沼泽巨龟', '🐢', 31, 685, [70, 92], 62, 240, 195, 'beast', ['m_bite']),
    marsh_raptor:      M('marsh_raptor', '暗鳞迅猛龙', '🦖', 33, 670, [77, 101], 51, 262, 216, 'beast', ['m_bite', 'm_rend']),
    searing_wolf:      M('searing_wolf', '灼热野狼', '🐺', 34, 700, [79, 104], 53, 271, 223, 'beast', ['m_bite', 'm_rend', 'm_charge']),
    searing_whelp:     M('searing_whelp', '熔岩幼龙', '🐉', 35, 735, [82, 108], 55, 282, 232, 'beast', ['m_bite', 'm_breath']),
    tanaris_wasp:      M('tanaris_wasp', '沙漠黄蜂', '🐝', 34, 690, [78, 103], 51, 270, 222, 'beast', ['m_poison', 'm_bite']),
    tanaris_hyena:     M('tanaris_hyena', '沙漠鬣狗', '🐕', 35, 720, [81, 107], 53, 281, 231, 'beast', ['m_bite', 'm_rend']),
    tanaris_scorpion: M('tanaris_scorpion', '沙漠毒蝎王', '🦂', 36, 740, [82, 108], 56, 285, 236, 'beast', ['m_claw', 'm_poison']),
    tanaris_turtle:   M('tanaris_turtle', '硬壳海龟', '🐢', 38, 800, [85, 112], 68, 300, 250, 'beast', ['m_bite', 'm_bash']),
    tanaris_wastewalker: M('tanaris_wastewalker', '沙地巨像', '🤖', 40, 830, [91, 120], 70, 316, 264, 'elemental', ['m_charge', 'm_war_cry', 'm_bash']),
    tanaris_elite:    M('tanaris_elite', '沙怒酋长', '🏜️', 42, 2000, [106, 140], 74, 1040, 710, 'humanoid', ['m_charge', 'm_war_cry', 'm_rend'], { elite: 1, title: '塔纳利斯 · 沙怒酋长' }),
    /* 安戈洛环形山 (42-50) */
    ungoro_raptor:    M('ungoro_raptor', '迅猛龙', '🦖', 42, 860, [95, 126], 68, 332, 276, 'beast', ['m_bite', 'm_rend', 'm_charge']),
    ungoro_gorilla:   M('ungoro_gorilla', '巨型猩猩', '🦍', 44, 910, [100, 132], 74, 350, 290, 'beast', ['m_claw', 'm_bash', 'm_war_cry']),
    ungoro_dino:      M('ungoro_dino', '剑龙', '🦕', 46, 975, [104, 138], 88, 368, 305, 'beast', ['m_charge', 'm_rend']),
    ungoro_plant:     M('ungoro_plant', '食人花', '🌺', 48, 1020, [110, 145], 80, 386, 320, 'elemental', ['m_poison', 'm_bite']),
    ungoro_elite:     M('ungoro_elite', '环形山巨兽', '🦣', 50, 2480, [128, 170], 96, 1300, 900, 'beast', ['m_charge', 'm_war_cry', 'm_enrage'], { elite: 1, title: '安戈洛 · 环形山巨兽' }),
    /* 瘟疫之地 (50-58) */
    plague_zombie:    M('plague_zombie', '天灾僵尸', '🧟', 50, 1010, [112, 148], 88, 400, 330, 'undead', ['m_bite', 'm_rend', 'm_poison']),
    plague_bat:       M('plague_bat', '瘟疫蝙蝠', '🦇', 52, 1070, [117, 155], 94, 420, 345, 'beast', ['m_bite', 'm_rend']),
    plague_knight:    M('plague_knight', '死亡骑士', '🗡️', 54, 1140, [123, 163], 108, 440, 360, 'undead', ['m_shadow', 'm_rend', 'm_war_cry']),
    plague_abomination: M('plague_abomination', '憎恶', '🧟‍♂️', 56, 1230, [127, 169], 104, 460, 375, 'undead', ['m_charge', 'm_poison', 'm_war_cry']),
    plague_elite:     M('plague_elite', '巫妖之影', '💀', 58, 2900, [148, 196], 118, 1600, 1100, 'undead', ['m_shadow', 'm_frost', 'm_enrage'], { elite: 1, title: '瘟疫之地 · 巫妖之影' }),
    /* 黑石深渊 (副本) */
    brd_guard:        M('brd_guard', '黑铁守卫', '⚔️', 44, 780, [96, 126], 82, 300, 240, 'humanoid', ['m_bash', 'm_war_cry']),
    brd_mage:         M('brd_mage', '暗炉施法者', '🔮', 45, 720, [98, 110], 60, 320, 250, 'humanoid', ['m_fireball', 'm_frost']),
    brd_elite:        M('brd_elite', '暗炉将军', '🛡️', 48, 2200, [120, 156], 100, 1200, 800, 'humanoid', ['m_charge', 'm_war_cry', 'm_rend'], { elite: 1, title: '黑石深渊 · 精英' }),
    emperor_thaurissan: M('emperor_thaurissan', '达格兰·索瑞森大帝', '👑', 52, 3100, [100, 132], 110, 3600, 2800, 'humanoid', ['m_molten_fury', 'm_fireball', 'm_charge', 'm_enrage'], { elite: 1, boss: 1, title: '黑石深渊 · 最终首领' }),
    /* 祖尔法拉克 (副本) */
    zf_mummy:         M('zf_mummy', '沙怒木乃伊', '🧟', 36, 620, [80, 104], 60, 260, 200, 'undead', ['m_bite', 'm_poison']),
    zf_priest:        M('zf_priest', '沙怒祭司', '🧙', 38, 660, [82, 96], 55, 280, 220, 'humanoid', ['m_shadow', 'm_heal']),
    zf_elite:         M('zf_elite', '祖尔法拉克督军', '🏹', 40, 1900, [104, 136], 85, 1100, 700, 'humanoid', ['m_charge', 'm_war_cry', 'm_bash'], { elite: 1, title: '祖尔法拉克 · 精英' }),
    zhuzhun:          M('zhuzhun', '乌克兹·沙顶', '🏺', 44, 2800, [104, 136], 100, 3300, 2600, 'humanoid', ['m_sandstorm', 'm_shadow', 'm_breath', 'm_enrage'], { elite: 1, boss: 1, title: '祖尔法拉克 · 最终首领' }),
    /* 影牙城堡 (副本) */
    sfk_worgen:       M('sfk_worgen', '影牙狼人', '🐺', 20, 380, [42, 56], 30, 152, 120, 'beast', ['m_bite', 'm_rend']),
    sfk_ghoul:        M('sfk_ghoul', '腐皮食尸鬼', '🧟', 21, 400, [44, 58], 28, 160, 128, 'undead', ['m_bite', 'm_poison']),
    sfk_shadow:       M('sfk_shadow', '暗影斥候', '🗡️', 22, 350, [48, 56], 24, 170, 136, 'humanoid', ['m_shadow', 'm_rend']),
    sfk_elite:        M('sfk_elite', '席瓦莱恩男爵', '🧛', 23, 1000, [54, 70], 38, 680, 440, 'undead', ['m_rend', 'm_war_cry', 'm_bash'], { elite: 1, title: '影牙城堡 · 精英' }),
    arugal:           M('arugal', '阿鲁高', '🐺', 25, 1200, [44, 56], 40, 1500, 1150, 'humanoid', ['m_worgen_curse', 'm_shadow', 'm_summon', 'm_enrage'], { elite: 1, boss: 1, title: '影牙城堡 · 最终首领' }),
    /* 奥达曼 (副本) */
    uld_trogg:        M('uld_trogg', '石腭怪', '🗿', 30, 620, [72, 95], 56, 240, 196, 'humanoid', ['m_bash', 'm_war_cry']),
    uld_gnome:        M('uld_gnome', '疯狂技师', '🤖', 31, 570, [74, 90], 44, 250, 205, 'humanoid', ['m_fireball', 'm_poison']),
    uld_golem:        M('uld_golem', '石像守卫', '🏛️', 32, 700, [76, 100], 70, 262, 215, 'elemental', ['m_charge', 'm_bash']),
    uld_elite:        M('uld_elite', '古代守护者', '🗿', 34, 1750, [92, 122], 80, 980, 620, 'elemental', ['m_charge', 'm_war_cry', 'm_enrage'], { elite: 1, title: '奥达曼 · 精英' }),
    archaledas:       M('archaledas', '阿扎达斯', '🏛️', 36, 1950, [86, 114], 82, 2250, 1800, 'elemental', ['m_titan_slam', 'm_charge', 'm_enrage', 'm_war_cry'], { elite: 1, boss: 1, title: '奥达曼 · 最终首领' }),
    /* 玛拉顿 (副本) */
    mara_satyr:       M('mara_satyr', '瑟莱德丝信徒', '🐐', 35, 720, [82, 108], 58, 285, 236, 'humanoid', ['m_claw', 'm_shadow']),
    mara_water:       M('mara_water', '污染水元素', '💧', 36, 780, [84, 100], 50, 300, 248, 'elemental', ['m_poison', 'm_frost']),
    mara_dryad:       M('mara_dryad', '腐化树妖', '🌿', 37, 760, [86, 108], 54, 315, 260, 'elemental', ['m_poison', 'm_heal', 'm_bash']),
    mara_elite:       M('mara_elite', '怒蟒之灵', '🐍', 38, 1950, [100, 132], 72, 1100, 700, 'beast', ['m_poison', 'm_bite', 'm_charge'], { elite: 1, title: '玛拉顿 · 精英' }),
    princess_theradras: M('princess_theradras', '瑟莱德丝公主', '👸', 40, 2450, [102, 134], 78, 2650, 2100, 'elemental', ['m_quake', 'm_charge', 'm_breath', 'm_enrage'], { elite: 1, boss: 1, title: '玛拉顿 · 最终首领' }),
    /* 通灵学院 (副本) */
    sch_apprentice:   M('sch_apprentice', '亡灵学徒', '🧟', 54, 640, [80, 108], 90, 415, 345, 'undead', ['m_shadow', 'm_bash']),
    sch_lecturer:     M('sch_lecturer', '食尸鬼讲师', '🎓', 55, 1100, [120, 158], 88, 430, 355, 'undead', ['m_bite', 'm_rend', 'm_poison']),
    sch_mage:         M('sch_mage', '天灾法师', '🔮', 56, 1000, [124, 150], 70, 445, 368, 'undead', ['m_frost', 'm_shadow', 'm_fireball']),
    sch_elite:        M('sch_elite', '血腥收割者', '🪓', 57, 2850, [142, 188], 105, 1550, 1050, 'undead', ['m_charge', 'm_war_cry', 'm_enrage'], { elite: 1, title: '通灵学院 · 精英' }),
    gandling:         M('gandling', '黑暗院长加丁', '🎓', 58, 3200, [108, 142], 112, 3900, 3100, 'undead', ['m_raise_dead', 'm_shadow', 'm_enrage'], { elite: 1, boss: 1, title: '通灵学院 · 最终首领' }),
    /* 纳克萨玛斯 (副本) */
    naxx_spider:      M('naxx_spider', '织网蛛魔', '🕷️', 57, 1150, [126, 166], 100, 430, 358, 'beast', ['m_poison', 'm_bite']),
    naxx_plague:      M('naxx_plague', '瘟疫蛆虫', '🐛', 58, 1200, [128, 170], 96, 445, 370, 'undead', ['m_poison', 'm_bash', 'm_rend']),
    naxx_knight:      M('naxx_knight', '天启骑士', '🐴', 58, 1180, [132, 172], 112, 448, 372, 'undead', ['m_charge', 'm_rend', 'm_war_cry']),
    naxx_elite:       M('naxx_elite', '萨菲隆之影', '🐉', 59, 4270, [180, 238], 118, 1650, 1100, 'undead', ['m_frost', 'm_breath', 'm_enrage'], { elite: 1, title: '纳克萨玛斯 · 精英' }),
    kelthuzad:        M('kelthuzad', '克尔苏加德', '💀', 60, 6130, [197, 259], 115, 5200, 4200, 'undead', ['m_frost_chain', 'm_frost', 'm_summon', 'm_enrage'], { elite: 1, boss: 1, title: '纳克萨玛斯 · 最终首领' }),
    /* 世界首领(定时刷新,不可随机遭遇) */
    kazzak:           M('kazzak', '卡扎克', '👹', 60, 8180, [223, 290], 115, 6000, 5000, 'demon', ['m_shadow', 'm_enrage', 'm_war_cry'], { boss: 1, world: 1, title: '燃烧平原 · 深渊魔王' }),
    azuregos:         M('azuregos', '艾萨拉绿龙', '🐉', 58, 7300, [210, 277], 104, 5500, 4600, 'dragon', ['m_frost', 'm_breath', 'm_enrage'], { boss: 1, world: 1, title: '冬泉谷 · 蓝龙之王' }),
    /* 深入敌营 · 暴风城守卫(部落突袭) */
    sw_guard:         M('sw_guard', '暴风城卫兵', '🛡️', 40, 1100, [76, 100], 60, 1800, 1400, 'humanoid', ['m_charge', 'm_rend', 'm_war_cry'], { elite: 1, title: '暴风城 · 城防卫兵' }),
    sw_captain:       M('sw_captain', '暴风城卫队长', '⚔️', 41, 1350, [84, 110], 70, 2300, 1800, 'humanoid', ['m_charge', 'm_rend', 'm_war_cry', 'm_enrage'], { elite: 1, title: '暴风城 · 皇家卫队' }),
    sw_king:          M('sw_king', '乌瑞恩国王', '👑', 43, 2000, [94, 124], 80, 3800, 3000, 'humanoid', ['m_charge', 'm_war_cry', 'm_rend', 'm_enrage'], { elite: 1, boss: 1, title: '暴风城 · 人类国王' }),
    /* 深入敌营 · 奥格瑞玛守卫(联盟突袭) */
    og_guard:         M('og_guard', '库卡隆卫兵', '🪓', 40, 1120, [78, 102], 62, 1800, 1400, 'humanoid', ['m_charge', 'm_rend', 'm_war_cry'], { elite: 1, title: '奥格瑞玛 · 库卡隆卫兵' }),
    og_captain:       M('og_captain', '库卡隆队长', '⚔️', 41, 1380, [86, 112], 72, 2300, 1800, 'humanoid', ['m_charge', 'm_rend', 'm_war_cry', 'm_enrage'], { elite: 1, title: '奥格瑞玛 · 库卡隆队长' }),
    og_warchief:      M('og_warchief', '大酋长萨尔', '🐺', 43, 2050, [96, 126], 82, 3800, 3000, 'humanoid', ['m_charge', 'm_war_cry', 'm_enrage', 'm_rend'], { elite: 1, boss: 1, title: '奥格瑞玛 · 部落大酋长' }),
    /* 诅咒之地 (48-55) */
    bl_hellhound:     M('bl_hellhound', '地狱犬', '🐕', 50, 1010, [112, 148], 90, 400, 330, 'demon', ['m_bite', 'm_rend']),
    bl_mauler:        M('bl_mauler', '恶魔卫士', '👹', 52, 1080, [117, 155], 96, 420, 345, 'demon', ['m_charge', 'm_bash', 'm_war_cry']),
    bl_raptor:        M('bl_raptor', '荒原迅猛龙', '🦖', 54, 1140, [123, 163], 100, 440, 360, 'beast', ['m_bite', 'm_rend']),
    bl_imp:           M('bl_imp', '虚空小鬼', '😈', 53, 1020, [115, 152], 82, 430, 350, 'demon', ['m_shadow', 'm_claw']),
    bl_elite:         M('bl_elite', '深渊领主', '😈', 55, 2300, [128, 168], 108, 1200, 850, 'demon', ['m_shadow', 'm_charge', 'm_enrage'], { elite: 1, title: '诅咒之地 · 深渊领主' }),
    /* 费伍德森林 (50-58) */
    fel_satyr:        M('fel_satyr', '萨特', '🐐', 52, 1070, [117, 155], 92, 420, 345, 'demon', ['m_shadow', 'm_rend']),
    fel_treant:       M('fel_treant', '腐化树人', '🌳', 54, 1160, [123, 163], 106, 440, 360, 'elemental', ['m_charge', 'm_bash']),
    fel_worg:         M('fel_worg', '污染座狼', '🐺', 56, 1230, [127, 169], 100, 460, 375, 'beast', ['m_bite', 'm_rend', 'm_poison']),
    fel_spore:        M('fel_spore', '污染孢子', '🍄', 55, 1100, [122, 162], 90, 450, 365, 'elemental', ['m_poison', 'm_bash']),
    fel_elite:        M('fel_elite', '末日守卫', '💀', 58, 2500, [140, 182], 116, 1350, 950, 'demon', ['m_shadow', 'm_war_cry', 'm_enrage'], { elite: 1, title: '费伍德森林 · 末日守卫' }),
    /* 艾萨拉 (50-58) */
    azz_naga:         M('azz_naga', '娜迦海妖', '🧜', 52, 1060, [116, 154], 90, 420, 345, 'humanoid', ['m_frost', 'm_bash']),
    azz_lizard:       M('azz_lizard', '雷鳞蜥蜴', '🦎', 54, 1120, [121, 161], 98, 440, 360, 'beast', ['m_bite', 'm_rend']),
    azz_drake:        M('azz_drake', '蓝龙幼崽', '🐲', 56, 1210, [126, 168], 104, 460, 375, 'dragon', ['m_frost', 'm_breath']),
    azz_ogre:         M('azz_ogre', '海岸食人魔', '🧌', 53, 1180, [120, 160], 104, 435, 355, 'humanoid', ['m_charge', 'm_bash', 'm_war_cry']),
    azz_elite:        M('azz_elite', '艾萨拉奥术师', '🧙', 58, 2480, [138, 180], 112, 1350, 950, 'humanoid', ['m_fireball', 'm_shadow', 'm_enrage'], { elite: 1, title: '艾萨拉 · 大奥术师' }),
    /* 东瘟疫之地 (58-60) */
    epl_ghoul:        M('epl_ghoul', '天灾食尸鬼', '🧟', 58, 1260, [132, 172], 108, 480, 390, 'undead', ['m_bite', 'm_rend', 'm_poison']),
    epl_gargoyle:     M('epl_gargoyle', '石像鬼', '🗿', 59, 1300, [135, 176], 118, 495, 400, 'undead', ['m_charge', 'm_shadow']),
    epl_abom:         M('epl_abom', '巨型憎恶', '🫀', 60, 1380, [140, 182], 114, 510, 415, 'undead', ['m_charge', 'm_poison', 'm_war_cry']),
    epl_necromancer:  M('epl_necromancer', '死灵法师', '🧙', 59, 1180, [132, 173], 96, 500, 405, 'undead', ['m_shadow', 'm_summon']),
    epl_elite:        M('epl_elite', '亡灵将军', '⚰️', 60, 2900, [148, 194], 120, 1600, 1100, 'undead', ['m_shadow', 'm_rend', 'm_enrage'], { elite: 1, title: '东瘟疫之地 · 亡灵将军' }),
    /* 希利苏斯 (58-60) */
    sil_sandcrawler:  M('sil_sandcrawler', '沙行者', '🦂', 58, 1250, [131, 171], 106, 480, 390, 'beast', ['m_bite', 'm_poison']),
    sil_beetle:       M('sil_beetle', '巨型甲虫', '🪲', 59, 1290, [134, 175], 112, 495, 400, 'beast', ['m_bite', 'm_rend']),
    sil_soldier:      M('sil_soldier', '其拉士兵', '🦗', 60, 1360, [139, 181], 118, 510, 415, 'elemental', ['m_charge', 'm_war_cry', 'm_bash']),
    sil_scarab:       M('sil_scarab', '圣甲虫', '🪲', 59, 1240, [133, 174], 104, 495, 400, 'beast', ['m_bite', 'm_poison']),
    sil_elite:        M('sil_elite', '虫巢领主', '🐜', 60, 2880, [147, 193], 122, 1600, 1100, 'beast', ['m_bite', 'm_poison', 'm_enrage'], { elite: 1, title: '希利苏斯 · 虫巢领主' }),
    /* 黑石塔 (55-58) */
    brs_orc:          M('brs_orc', '黑石兽人', '🧌', 55, 1180, [126, 166], 106, 455, 375, 'humanoid', ['m_charge', 'm_war_cry', 'm_rend']),
    brs_whelp:        M('brs_whelp', '黑石龙人', '🐲', 56, 1230, [130, 170], 112, 465, 385, 'dragon', ['m_breath', 'm_rend']),
    brs_spellblade:   M('brs_spellblade', '火印法师', '🔥', 57, 1100, [128, 168], 95, 470, 390, 'humanoid', ['m_fireball', 'm_shadow']),
    brs_elite:        M('brs_elite', '大酋长雷德', '🪓', 57, 2800, [140, 182], 114, 1500, 1000, 'humanoid', ['m_charge', 'm_war_cry', 'm_enrage'], { elite: 1, title: '黑石塔 · 精英' }),
    drakkisath:       M('drakkisath', '达基萨斯将军', '🐉', 58, 3450, [142, 186], 110, 4200, 3400, 'dragon', ['m_flame_breath', 'm_breath', 'm_war_cry', 'm_enrage'], { elite: 1, boss: 1, title: '黑石塔 · 最终首领' }),
    /* 斯坦索姆 (56-60) */
    str_ghoul:        M('str_ghoul', '亡灵侍从', '🧟', 57, 1220, [128, 168], 108, 470, 385, 'undead', ['m_bite', 'm_rend']),
    str_necro:        M('str_necro', '通灵师', '🧙', 58, 1150, [130, 170], 98, 480, 395, 'undead', ['m_shadow', 'm_summon']),
    str_knight:       M('str_knight', '亡灵骑士', '⚔️', 59, 1340, [138, 180], 118, 495, 405, 'undead', ['m_charge', 'm_rend', 'm_war_cry']),
    str_elite:        M('str_elite', '血色十字军首领', '⛪', 59, 2850, [144, 188], 116, 1550, 1050, 'humanoid', ['m_charge', 'm_enrage', 'm_war_cry'], { elite: 1, title: '斯坦索姆 · 精英' }),
    rivendare:        M('rivendare', '瑞文戴尔男爵', '🐎', 60, 3600, [146, 192], 114, 4800, 3900, 'undead', ['m_death_coil', 'm_shadow', 'm_charge', 'm_enrage'], { elite: 1, boss: 1, title: '斯坦索姆 · 最终首领' }),
    /* 厄运之槌 (55-58) */
    dum_satyr:        M('dum_satyr', '厄运萨特', '🐐', 55, 1190, [127, 167], 104, 455, 375, 'demon', ['m_shadow', 'm_rend']),
    dum_treant:       M('dum_treant', '古树', '🌳', 56, 1300, [130, 170], 120, 465, 385, 'elemental', ['m_charge', 'm_bash']),
    dum_ghost:        M('dum_ghost', '幽灵法师', '👻', 57, 1120, [129, 169], 96, 470, 390, 'undead', ['m_shadow', 'm_frost']),
    dum_elite:        M('dum_elite', '奥兹恩', '😈', 57, 2750, [139, 181], 112, 1500, 1000, 'demon', ['m_shadow', 'm_summon', 'm_enrage'], { elite: 1, title: '厄运之槌 · 精英' }),
    immolthar:        M('immolthar', '伊莫塔尔', '👁️', 58, 3500, [143, 187], 108, 4300, 3500, 'demon', ['m_arcane_nova', 'm_shadow', 'm_war_cry', 'm_enrage'], { elite: 1, boss: 1, title: '厄运之槌 · 最终首领' }),
    /* 熔火之心 (60) */
    mc_lava:          M('mc_lava', '熔火犬', '🐕', 60, 1380, [140, 182], 112, 520, 420, 'elemental', ['m_bite', 'm_fireball']),
    mc_giant:         M('mc_giant', '熔核巨人', '🗿', 60, 1450, [145, 188], 128, 530, 430, 'elemental', ['m_charge', 'm_bash', 'm_war_cry']),
    mc_shaman:        M('mc_shaman', '火焰术士', '🧙', 60, 1200, [140, 182], 100, 520, 420, 'humanoid', ['m_fireball', 'm_shadow']),
    mc_elite:         M('mc_elite', '加尔', '🔥', 60, 4480, [187, 242], 122, 1750, 1200, 'elemental', ['m_fireball', 'm_charge', 'm_enrage'], { elite: 1, title: '熔火之心 · 精英' }),
    ragnaros:         M('ragnaros', '拉格纳罗斯', '🌋', 60, 7050, [216, 282], 128, 12000, 9000, 'elemental', ['m_lava_burst', 'm_fireball', 'm_war_cry', 'm_enrage'], { elite: 1, boss: 1, title: '熔火之心 · 火焰领主' }),
    /* 黑翼之巢 (60) */
    bwl_drake:        M('bwl_drake', '黑翼幼龙', '🐲', 60, 1360, [141, 183], 114, 520, 420, 'dragon', ['m_breath', 'm_rend']),
    bwl_dragon:       M('bwl_dragon', '黑翼龙人', '🐉', 60, 1420, [144, 187], 122, 530, 430, 'dragon', ['m_breath', 'm_charge']),
    bwl_sorcerer:     M('bwl_sorcerer', '黑翼法师', '🧙', 60, 1210, [141, 183], 100, 520, 420, 'humanoid', ['m_fireball', 'm_shadow']),
    bwl_elite:        M('bwl_elite', '堕落的瓦拉斯塔兹', '🐲', 60, 4620, [190, 245], 124, 1800, 1250, 'dragon', ['m_breath', 'm_fireball', 'm_enrage'], { elite: 1, title: '黑翼之巢 · 精英' }),
    nefarian:         M('nefarian', '奈法利安', '🦇', 60, 6970, [214, 279], 125, 12500, 9500, 'dragon', ['m_wing_buffet', 'm_breath', 'm_shadow', 'm_enrage'], { elite: 1, boss: 1, title: '黑翼之巢 · 最终首领' }),
    /* 奥妮克希亚的巢穴 (60) */
    onx_whelp:        M('onx_whelp', '雏龙', '🐉', 59, 1300, [135, 176], 112, 500, 405, 'dragon', ['m_breath', 'm_bite']),
    onx_guard:        M('onx_guard', '奥妮克希亚卫士', '🗡️', 60, 1390, [140, 182], 118, 520, 420, 'humanoid', ['m_charge', 'm_rend']),
    onx_mage:         M('onx_mage', '黑龙法师', '🧙', 60, 1200, [139, 181], 100, 520, 420, 'humanoid', ['m_fireball', 'm_frost']),
    onx_elite:        M('onx_elite', '黑衣守卫', '🛡️', 60, 4410, [185, 240], 122, 1700, 1150, 'humanoid', ['m_charge', 'm_war_cry', 'm_enrage'], { elite: 1, title: '奥妮克希亚巢穴 · 精英' }),
    onyxia:           M('onyxia', '奥妮克希亚', '🐲', 60, 6640, [207, 270], 120, 11500, 8800, 'dragon', ['m_deep_breath', 'm_breath', 'm_fireball', 'm_enrage'], { elite: 1, boss: 1, title: '奥妮克希亚的巢穴 · 最终首领' }),
    /* 祖尔格拉布 (60) */
    zg_troll:         M('zg_troll', '祖格巨魔', '🧌', 60, 1370, [140, 182], 112, 520, 420, 'humanoid', ['m_charge', 'm_war_cry']),
    zg_priest:        M('zg_priest', '妖术师', '🧙', 60, 1210, [139, 181], 100, 520, 420, 'humanoid', ['m_shadow', 'm_heal']),
    zg_panther:       M('zg_panther', '祖格猎豹', '🐆', 60, 1330, [142, 184], 108, 520, 420, 'beast', ['m_bite', 'm_rend']),
    zg_elite:         M('zg_elite', '血领主曼多基尔', '🦅', 60, 4550, [188, 244], 122, 1780, 1220, 'humanoid', ['m_charge', 'm_war_cry', 'm_enrage'], { elite: 1, title: '祖尔格拉布 · 精英' }),
    hakkar:           M('hakkar', '哈卡', '🐍', 60, 6800, [210, 275], 122, 11800, 9200, 'humanoid', ['m_corrupted_blood', 'm_shadow', 'm_poison', 'm_enrage'], { elite: 1, boss: 1, title: '祖尔格拉布 · 血神' }),
    /* 安其拉废墟 (60) */
    aq_warrior:       M('aq_warrior', '其拉斗士', '🦗', 60, 1380, [141, 183], 116, 520, 420, 'elemental', ['m_charge', 'm_war_cry']),
    aq_observer:      M('aq_observer', '观察者', '👁️', 60, 1220, [140, 182], 102, 520, 420, 'elemental', ['m_shadow', 'm_frost']),
    aq_hiveswarm:     M('aq_hiveswarm', '虫群卫士', '🐜', 60, 1340, [143, 185], 110, 520, 420, 'beast', ['m_bite', 'm_poison']),
    aq_elite:         M('aq_elite', '库林纳克斯', '🪳', 60, 4450, [186, 241], 120, 1720, 1180, 'beast', ['m_bite', 'm_poison', 'm_enrage'], { elite: 1, title: '安其拉废墟 · 精英' }),
    rajaxx:           M('rajaxx', '拉贾克斯将军', '⚔️', 60, 6550, [203, 266], 118, 11000, 8600, 'humanoid', ['m_charge', 'm_war_cry', 'm_enrage'], { elite: 1, boss: 1, title: '安其拉废墟 · 最终首领' }),
    /* 安其拉神殿 (60) */
    aqt_twilight:     M('aqt_twilight', '暮光教徒', '🧙', 60, 1230, [141, 183], 102, 525, 425, 'humanoid', ['m_shadow', 'm_fireball']),
    aqt_anubisath:    M('aqt_anubisath', '阿努比萨斯', '🗿', 60, 1460, [146, 190], 130, 535, 435, 'elemental', ['m_charge', 'm_bash']),
    aqt_eye:          M('aqt_eye', '克苏恩之眼', '👁️', 60, 1240, [142, 184], 104, 525, 425, 'elemental', ['m_shadow', 'm_breath']),
    aqt_elite:        M('aqt_elite', '维克洛尔大帝', '🪬', 60, 4690, [192, 247], 126, 1850, 1300, 'elemental', ['m_shadow', 'm_charge', 'm_enrage'], { elite: 1, title: '安其拉神殿 · 精英' }),
    cthun:            M('cthun', '克苏恩', '🫀', 60, 7560, [223, 288], 132, 15000, 12000, 'elemental', ['m_eye_beam', 'm_shadow', 'm_breath', 'm_enrage'], { elite: 1, boss: 1, title: '安其拉神殿 · 千眼之魔' }),
    /* ===== 新增 8 副本 ===== */
    /* 怒焰裂谷 (15-16) */
    rfc_trooper:      M('rfc_trooper', '怒焰狂暴者', '🧌', 13, 240, [28, 38], 22, 105, 82, 'humanoid', ['m_bash', 'm_war_cry']),
    rfc_cultist:      M('rfc_cultist', '暗影议会成员', '🧙', 14, 250, [30, 40], 20, 112, 90, 'humanoid', ['m_shadow', 'm_claw']),
    rfc_imp:          M('rfc_imp', '虚空小鬼', '👿', 14, 220, [26, 34], 14, 108, 78, 'demon', ['m_bite', 'm_fireball']),
    rfc_elite:        M('rfc_elite', '烈焰守卫', '🔥', 15, 700, [40, 54], 30, 520, 330, 'humanoid', ['m_charge', 'm_war_cry'], { elite: 1, title: '怒焰裂谷 · 精英' }),
    jergosh:          M('jergosh', '杰尔戈什·召唤者', '🧙', 16, 800, [38, 48], 32, 820, 640, 'humanoid', ['m_burning_hex', 'm_shadow', 'm_bash'], { elite: 1, boss: 1, title: '怒焰裂谷 · 最终首领' }),
    /* 暴风城监狱 (24-26) */
    skd_convict:      M('skd_convict', '迪菲亚囚犯', '⛓️', 22, 480, [52, 68], 40, 195, 155, 'humanoid', ['m_claw', 'm_bash']),
    skd_brute:        M('skd_brute', '监狱暴徒', '💢', 24, 540, [56, 74], 46, 215, 172, 'humanoid', ['m_bash', 'm_war_cry']),
    skd_hound:        M('skd_hound', '监狱猎犬', '🐕', 23, 460, [54, 70], 38, 205, 162, 'beast', ['m_bite', 'm_rend']),
    skd_elite:        M('skd_elite', '典狱长', '🔑', 25, 1300, [78, 102], 56, 980, 620, 'humanoid', ['m_charge', 'm_rend'], { elite: 1, title: '暴风城监狱 · 精英' }),
    thredd:           M('thredd', '巴基·斯奈德', '🗡️', 26, 1350, [56, 74], 52, 1600, 1250, 'humanoid', ['m_prison_chain', 'm_charge', 'm_enrage'], { elite: 1, boss: 1, title: '暴风城监狱 · 最终首领' }),
    /* 黑暗深渊 (24-26) */
    bfd_naga:         M('bfd_naga', '深渊纳迦', '🧜', 21, 460, [50, 64], 42, 190, 150, 'humanoid', ['m_claw', 'm_bash']),
    bfd_priestess:    M('bfd_priestess', '深渊祭司', '🧝', 22, 440, [48, 62], 36, 198, 158, 'humanoid', ['m_shadow', 'm_heal']),
    bfd_turtle:       M('bfd_turtle', '深渊巨龟', '🐢', 23, 560, [52, 68], 52, 205, 160, 'beast', ['m_bite', 'm_bash']),
    bfd_elite:        M('bfd_elite', '暮光守卫', '🌆', 25, 1250, [76, 100], 58, 950, 600, 'humanoid', ['m_shadow', 'm_war_cry'], { elite: 1, title: '黑暗深渊 · 精英' }),
    akumai:           M('akumai', '阿库麦尔', '🦑', 26, 1400, [54, 72], 54, 1620, 1270, 'elemental', ['m_shadow_tide', 'm_breath', 'm_regen'], { elite: 1, boss: 1, title: '黑暗深渊 · 最终首领' }),
    /* 诺莫瑞根 (28-30) */
    gno_mech:         M('gno_mech', '失控机械', '🤖', 25, 560, [60, 78], 50, 210, 165, 'elemental', ['m_charge', 'm_bash']),
    gno_trooper:      M('gno_trooper', '侏儒机械师', '👨‍🔧', 26, 580, [62, 82], 48, 220, 172, 'humanoid', ['m_claw', 'm_fireball']),
    gno_slime:        M('gno_slime', '辐射软泥', '🟢', 27, 620, [56, 74], 40, 230, 180, 'elemental', ['m_poison', 'm_bash']),
    gno_elite:        M('gno_elite', '群体打击者9-60', '🤖', 29, 1500, [86, 112], 62, 1150, 720, 'elemental', ['m_charge', 'm_war_cry'], { elite: 1, title: '诺莫瑞根 · 精英' }),
    thermaplugg:      M('thermaplugg', '瑟玛普拉格', '🎩', 30, 1650, [68, 90], 60, 1900, 1480, 'elemental', ['m_radiation', 'm_fireball', 'm_enrage'], { elite: 1, boss: 1, title: '诺莫瑞根 · 最终首领' }),
    /* 剃刀沼泽 (29-31) */
    rfk_quill:        M('rfk_quill', '剃刀野猪人', '🐗', 26, 600, [60, 78], 50, 218, 170, 'humanoid', ['m_bash', 'm_war_cry']),
    rfk_boar:         M('rfk_boar', '巨型剃刀野猪', '🐖', 27, 640, [58, 76], 54, 226, 178, 'beast', ['m_charge', 'm_bite']),
    rfk_shaman:       M('rfk_shaman', '野猪人萨满', '🪄', 28, 600, [62, 82], 44, 236, 186, 'humanoid', ['m_shadow', 'm_heal']),
    rfk_elite:        M('rfk_elite', '剃刀卫士', '🛡️', 30, 1550, [90, 116], 64, 1200, 750, 'humanoid', ['m_charge', 'm_rend'], { elite: 1, title: '剃刀沼泽 · 精英' }),
    charlga:          M('charlga', '卡尔加·刺肋', '👸', 31, 1750, [72, 94], 62, 2000, 1560, 'humanoid', ['m_razor_charge', 'm_poison', 'm_enrage'], { elite: 1, boss: 1, title: '剃刀沼泽 · 最终首领' }),
    /* 剃刀高地 (38-40) */
    rfd_bones:        M('rfd_bones', '白骨魔像', '💀', 35, 900, [84, 108], 70, 290, 235, 'undead', ['m_bash', 'm_rend']),
    rfd_witch:        M('rfd_witch', '亡者女巫', '🧙‍♀️', 36, 880, [86, 110], 64, 300, 245, 'undead', ['m_shadow', 'm_heal']),
    rfd_worm:         M('rfd_worm', '巨型蛆虫', '🐛', 37, 1000, [82, 106], 74, 310, 255, 'beast', ['m_bite', 'm_poison']),
    rfd_elite:        M('rfd_elite', '坟墓守卫', '⚰️', 39, 2200, [110, 144], 80, 1700, 1050, 'undead', ['m_charge', 'm_rend'], { elite: 1, title: '剃刀高地 · 精英' }),
    amnennar:         M('amnennar', '阿姆纳尔·冷铸者', '🧊', 40, 2450, [88, 116], 78, 2650, 2100, 'undead', ['m_cold_grave', 'm_shadow', 'm_enrage'], { elite: 1, boss: 1, title: '剃刀高地 · 最终首领' }),
    /* 血色修道院 (39-41) */
    sm_knight:        M('sm_knight', '血色骑士', '⛨', 36, 940, [90, 114], 74, 305, 248, 'humanoid', ['m_bash', 'm_war_cry']),
    sm_crusader:      M('sm_crusader', '血色十字军', '⛪', 37, 980, [94, 120], 78, 315, 258, 'humanoid', ['m_charge', 'm_rend']),
    sm_cleric:        M('sm_cleric', '血色牧师', '🙏', 38, 920, [88, 112], 66, 325, 268, 'humanoid', ['m_heal', 'm_shadow']),
    sm_elite:         M('sm_elite', '血色勇士', '⚔️', 40, 2300, [116, 150], 84, 1800, 1100, 'humanoid', ['m_charge', 'm_war_cry'], { elite: 1, title: '血色修道院 · 精英' }),
    whitemane:        M('whitemane', '大检察官怀特迈恩', '👩‍⚖️', 41, 2550, [92, 122], 82, 2750, 2180, 'humanoid', ['m_holy_wrath', 'm_war_cry', 'm_enrage'], { elite: 1, boss: 1, title: '血色修道院 · 最终首领' }),
    /* 沉没的神庙 (49-51) */
    st_troll:         M('st_troll', '哈卡莱巨魔', '🧟', 46, 1350, [116, 150], 92, 420, 345, 'humanoid', ['m_bash', 'm_war_cry']),
    st_priest:        M('st_priest', '哈卡莱祭司', '🧙', 47, 1300, [114, 148], 84, 435, 358, 'humanoid', ['m_shadow', 'm_heal']),
    st_snake:         M('st_snake', '疯狂巨蟒', '🐍', 48, 1450, [112, 146], 96, 450, 370, 'beast', ['m_poison', 'm_bite']),
    st_elite:         M('st_elite', '神像守护者', '🗿', 50, 2900, [140, 178], 100, 2400, 1500, 'elemental', ['m_charge', 'm_rend'], { elite: 1, title: '沉没的神庙 · 精英' }),
    avatar_hakkar:    M('avatar_hakkar', '哈卡的化身', '🫀', 51, 3100, [104, 138], 104, 3500, 2750, 'elemental', ['m_soul_drain', 'm_breath', 'm_enrage'], { elite: 1, boss: 1, title: '沉没的神庙 · 最终首领' }),
  };
  /* 召唤物(怪物专用) */
  D.MONSTERS.dm_add = M('dm_add', '迪菲亚爪牙', '🔪', 16, 170, [27, 35], 24, 90, 70, 'humanoid', ['m_claw']);

  /* 死亡矿井 / 哀嚎洞穴 的怪物波次 */
  D.DUNGEONS = {
    deadmines: {
      id: 'deadmines', name: '死亡矿井', icon: '⛏️', zone: 'westfall', minLevel: 16, boss: 'vancleef',
      waves: [
        { enemies: ['dm_sailor', 'dm_sailor'], name: '甲板守卫' },
        { enemies: ['dm_wizard'], name: '货舱巫师' },
        { enemies: ['dm_greenpaw'], name: '精英：绿皮队长' },
        { enemies: ['vancleef'], name: '最终首领：范克里夫' },
      ],
      desc: '迪菲亚兄弟会盘踞的矿洞据点，传说范克里夫在此策划着惊天阴谋。',
      chest: { items: [['m_dust', 2], ['m_essence', 2], ['m_crystal', 1]], gold: [900, 1500] },
    },
    wailing_caverns: {
      id: 'wailing_caverns', name: '哀嚎洞穴', icon: '🌿', zone: 'barrens', minLevel: 14, boss: 'mutanus',
      waves: [
        { enemies: ['wc_bat', 'wc_viper'], name: '洞穴入口' },
        { enemies: ['wc_viper', 'wc_bat'], name: '藤蔓走廊' },
        { enemies: ['wc_fang'], name: '精英：尖牙德鲁伊' },
        { enemies: ['mutanus'], name: '最终首领：穆坦努斯' },
      ],
      desc: '贫瘠之地深处的神秘洞穴，古老的邪恶在暗流中苏醒。',
      chest: { items: [['m_dust', 2], ['m_essence', 3], ['m_crystal', 1]], gold: [1000, 1700] },
    },
    blackrock_depths: {
      id: 'blackrock_depths', name: '黑石深渊', icon: '⛏️', zone: 'burning', minLevel: 50, boss: 'emperor_thaurissan',
      waves: [
        { enemies: ['brd_guard', 'brd_guard'], name: '黑铁岗哨' },
        { enemies: ['brd_mage'], name: '暗炉祭坛' },
        { enemies: ['brd_elite'], name: '精英：暗炉将军' },
        { enemies: ['emperor_thaurissan'], name: '最终首领：达格兰·索瑞森大帝' },
      ],
      desc: '黑铁矮人深掘大熔炉而成的庞大要塞，索瑞森大帝在此密谋复兴黑铁王朝。',
      chest: { items: [['m_dust', 3], ['m_essence', 3], ['m_crystal', 2], ['tr_imperial_seal', 1]], gold: [2600, 3800] },
    },
    zulfarrak: {
      id: 'zulfarrak', name: '祖尔法拉克', icon: '🏺', zone: 'tanaris', minLevel: 42, boss: 'zhuzhun',
      waves: [
        { enemies: ['zf_mummy', 'zf_mummy'], name: '沙怒陵墓' },
        { enemies: ['zf_priest'], name: '沙怒祭坛' },
        { enemies: ['zf_elite'], name: '精英：祖尔法拉克督军' },
        { enemies: ['zhuzhun'], name: '最终首领：乌克兹·沙顶' },
      ],
      desc: '塔纳利斯沙漠深处的巨魔古都，沙怒巨魔的亡魂在此守护着古老的秘宝。',
      chest: { items: [['m_dust', 3], ['m_essence', 3], ['m_crystal', 1], ['tr_abyss_eye', 1]], gold: [2200, 3200] },
    },
    shadowfang_keep: {
      id: 'shadowfang_keep', name: '影牙城堡', icon: '🐺', zone: 'duskwood', minLevel: 23, boss: 'arugal',
      waves: [
        { enemies: ['sfk_worgen', 'sfk_worgen'], name: '城门狼群' },
        { enemies: ['sfk_ghoul', 'sfk_shadow'], name: '地窖亡灵' },
        { enemies: ['sfk_elite'], name: '精英：席瓦莱恩男爵' },
        { enemies: ['arugal'], name: '最终首领：阿鲁高' },
      ],
      desc: '狼人诅咒的源头，阿鲁高的巫术在城堡高塔中低语，夜风里传来撕咬声。',
      chest: { items: [['m_dust', 2], ['m_essence', 3], ['m_crystal', 1]], gold: [1400, 2200] },
    },
    uldaman: {
      id: 'uldaman', name: '奥达曼', icon: '🏛️', zone: 'badlands', minLevel: 34, boss: 'archaledas',
      waves: [
        { enemies: ['uld_trogg', 'uld_trogg'], name: '泰坦之门' },
        { enemies: ['uld_gnome', 'uld_golem'], name: '符文大厅' },
        { enemies: ['uld_elite'], name: '精英：古代守护者' },
        { enemies: ['archaledas'], name: '最终首领：阿扎达斯' },
      ],
      desc: '泰坦造物沉睡的远古遗迹，石像的符文仍在低鸣，失落的神器在深处等待。',
      chest: { items: [['m_dust', 3], ['m_essence', 3], ['m_crystal', 1], ['tr_ember_heart', 1]], gold: [2000, 3000] },
    },
    maraudon: {
      id: 'maraudon', name: '玛拉顿', icon: '💧', zone: 'dustwallow', minLevel: 38, boss: 'princess_theradras',
      waves: [
        { enemies: ['mara_satyr', 'mara_satyr'], name: '污染泉眼' },
        { enemies: ['mara_water', 'mara_dryad'], name: '腐化林地' },
        { enemies: ['mara_elite'], name: '精英：怒蟒之灵' },
        { enemies: ['princess_theradras'], name: '最终首领：瑟莱德丝公主' },
      ],
      desc: '被污染的泉水深处，瑟莱德丝公主以枯萎之力守护着堕落的秘密。',
      chest: { items: [['m_dust', 3], ['m_essence', 3], ['m_crystal', 2], ['tr_imperial_seal', 1]], gold: [2400, 3400] },
    },
    scholomance: {
      id: 'scholomance', name: '通灵学院', icon: '🎓', zone: 'plaguelands', minLevel: 56, boss: 'gandling',
      waves: [
        { enemies: ['sch_apprentice', 'sch_apprentice'], name: '昏暗讲堂' },
        { enemies: ['sch_lecturer', 'sch_mage'], name: '解剖室' },
        { enemies: ['sch_elite'], name: '精英：血腥收割者' },
        { enemies: ['gandling'], name: '最终首领：黑暗院长加丁' },
      ],
      desc: '天灾军团培养死灵法师的学府，加丁院长的讲台上堆满被遗忘的亡灵。',
      chest: { items: [['m_dust', 3], ['m_essence', 4], ['m_crystal', 2], ['tr_abyss_eye', 1]], gold: [3600, 4800] },
    },
    naxxramas: {
      id: 'naxxramas', name: '纳克萨玛斯', icon: '💀', zone: 'winterspring', minLevel: 58, boss: 'kelthuzad',
      waves: [
        { enemies: ['naxx_spider', 'naxx_spider'], name: '织网蛛巢' },
        { enemies: ['naxx_plague', 'naxx_knight'], name: '瘟疫回廊' },
        { enemies: ['naxx_elite'], name: '精英：萨菲隆之影' },
        { enemies: ['kelthuzad'], name: '最终首领：克尔苏加德' },
      ],
      desc: '悬浮于天际的巫妖要塞，克尔苏加德的寒冰王座俯瞰着整个大陆。',
      chest: { items: [['m_dust', 4], ['m_essence', 4], ['m_crystal', 3], ['tr_naaru_tear', 1]], gold: [5000, 6500] },
    },
    blackrock_spire: {
      id: 'blackrock_spire', name: '黑石塔', icon: '🏰', zone: 'burning', minLevel: 56, boss: 'drakkisath',
      waves: [
        { enemies: ['brs_orc', 'brs_orc'], name: '黑石大门' },
        { enemies: ['brs_whelp', 'brs_spellblade'], name: '龙人走廊' },
        { enemies: ['brs_elite'], name: '精英：大酋长雷德' },
        { enemies: ['drakkisath'], name: '最终首领：达基萨斯将军' },
      ],
      desc: '黑石山中的兽人与龙人要塞，达基萨斯将军统治着这座燃烧的堡垒。',
      chest: { items: [['m_dust', 3], ['m_essence', 4], ['m_crystal', 2], ['tr_immolthar_eye', 1]], gold: [4200, 5600] },
    },
    stratholme: {
      id: 'stratholme', name: '斯坦索姆', icon: '🏛️', zone: 'eplaguelands', minLevel: 58, boss: 'rivendare',
      waves: [
        { enemies: ['str_ghoul', 'str_ghoul'], name: '亡灵广场' },
        { enemies: ['str_necro', 'str_knight'], name: '十字军大厅' },
        { enemies: ['str_elite'], name: '精英：血色十字军首领' },
        { enemies: ['rivendare'], name: '最终首领：瑞文戴尔男爵' },
      ],
      desc: '被天灾军团吞没的人类主城，瑞文戴尔男爵的亡灵骑士团在此巡逻。',
      chest: { items: [['m_dust', 3], ['m_essence', 4], ['m_crystal', 2], ['tr_hakkar_heart', 1]], gold: [4600, 6000] },
    },
    dire_maul: {
      id: 'dire_maul', name: '厄运之槌', icon: '🌿', zone: 'felwood', minLevel: 56, boss: 'immolthar',
      waves: [
        { enemies: ['dum_satyr', 'dum_treant'], name: '月神庙宇' },
        { enemies: ['dum_ghost', 'dum_satyr'], name: '亡灵庭院' },
        { enemies: ['dum_elite'], name: '精英：奥兹恩' },
        { enemies: ['immolthar'], name: '最终首领：伊莫塔尔' },
      ],
      desc: '辛德拉精灵的古城，恶魔伊莫塔尔盘踞在幻象宫殿深处。',
      chest: { items: [['m_dust', 3], ['m_essence', 4], ['m_crystal', 2], ['w_immolthar_staff', 1]], gold: [4000, 5400] },
    },
    molten_core: {
      id: 'molten_core', name: '熔火之心', icon: '🌋', zone: 'burning', minLevel: 60, raid: 1, boss: 'ragnaros',
      waves: [
        { enemies: ['mc_lava', 'mc_lava'], name: '熔岩庭院' },
        { enemies: ['mc_giant', 'mc_shaman'], name: '烈焰回廊' },
        { enemies: ['mc_elite'], name: '精英：加尔' },
        { enemies: ['mc_giant', 'mc_lava'], name: '熔核卫士' },
        { enemies: ['ragnaros'], name: '最终首领：火焰领主拉格纳罗斯' },
      ],
      desc: '火焰领主拉格纳罗斯的巢穴，灼热的熔岩吞噬一切入侵者。',
      chest: { items: [['m_dust', 5], ['m_essence', 5], ['m_crystal', 3], ['w_ragnaros_hand', 1]], gold: [7000, 9000] },
    },
    blackwing_lair: {
      id: 'blackwing_lair', name: '黑翼之巢', icon: '🦇', zone: 'blackrock_depths', minLevel: 60, raid: 1, boss: 'nefarian',
      waves: [
        { enemies: ['bwl_drake', 'bwl_drake'], name: '龙翼前厅' },
        { enemies: ['bwl_dragon', 'bwl_sorcerer'], name: '实验大厅' },
        { enemies: ['bwl_elite'], name: '精英：堕落的瓦拉斯塔兹' },
        { enemies: ['bwl_dragon', 'bwl_drake'], name: '黑翼卫队' },
        { enemies: ['nefarian'], name: '最终首领：奈法利安' },
      ],
      desc: '奈法利安的黑翼堡垒，黑龙军团进行着邪恶的龙族实验。',
      chest: { items: [['m_dust', 5], ['m_essence', 5], ['m_crystal', 3], ['w_nefarian_blade', 1]], gold: [6800, 8800] },
    },
    onyxias_lair: {
      id: 'onyxias_lair', name: '奥妮克希亚的巢穴', icon: '🐲', zone: 'dustwallow', minLevel: 60, raid: 1, boss: 'onyxia',
      waves: [
        { enemies: ['onx_whelp', 'onx_whelp'], name: '幼龙洞穴' },
        { enemies: ['onx_guard', 'onx_mage'], name: '黑龙前哨' },
        { enemies: ['onx_elite'], name: '精英：黑衣守卫' },
        { enemies: ['onyxia'], name: '最终首领：奥妮克希亚' },
      ],
      desc: '黑龙公主奥妮克希亚在尘泥沼泽的隐秘巢穴，她伪装成人类贵族统治王国。',
      chest: { items: [['m_dust', 4], ['m_essence', 5], ['m_crystal', 3], ['a_onyxia_scale', 1]], gold: [6500, 8400] },
    },
    zulgurub: {
      id: 'zulgurub', name: '祖尔格拉布', icon: '🐍', zone: 'stv', minLevel: 60, raid: 1, boss: 'hakkar',
      waves: [
        { enemies: ['zg_troll', 'zg_troll'], name: '巨魔营地' },
        { enemies: ['zg_priest', 'zg_panther'], name: '妖术祭坛' },
        { enemies: ['zg_elite'], name: '精英：血领主曼多基尔' },
        { enemies: ['zg_troll', 'zg_priest'], name: '神庙前殿' },
        { enemies: ['hakkar'], name: '最终首领：血神哈卡' },
      ],
      desc: '巨魔帝国的神圣废墟，血神哈卡被召唤于此渴望鲜血。',
      chest: { items: [['m_dust', 4], ['m_essence', 5], ['m_crystal', 3], ['tr_hakkar_heart', 1]], gold: [6600, 8600] },
    },
    ruins_ahnqiraj: {
      id: 'ruins_ahnqiraj', name: '安其拉废墟', icon: '🪲', zone: 'silithus', minLevel: 60, boss: 'rajaxx',
      waves: [
        { enemies: ['aq_warrior', 'aq_warrior'], name: '甲虫广场' },
        { enemies: ['aq_observer', 'aq_hiveswarm'], name: '虫巢回廊' },
        { enemies: ['aq_elite'], name: '精英：库林纳克斯' },
        { enemies: ['aq_warrior', 'aq_observer'], name: '将军卫队' },
        { enemies: ['rajaxx'], name: '最终首领：拉贾克斯将军' },
      ],
      desc: '其拉虫人在希利苏斯的古老要塞，拉贾克斯将军统领着无尽的虫群。',
      chest: { items: [['m_dust', 4], ['m_essence', 5], ['m_crystal', 3], ['tr_cthun_eye', 1]], gold: [6400, 8200] },
    },
    temple_ahnqiraj: {
      id: 'temple_ahnqiraj', name: '安其拉神殿', icon: '🐛', zone: 'silithus', minLevel: 60, raid: 1, boss: 'cthun',
      waves: [
        { enemies: ['aqt_twilight', 'aqt_twilight'], name: '暮光之门' },
        { enemies: ['aqt_anubisath', 'aqt_eye'], name: '神殿守卫' },
        { enemies: ['aqt_elite'], name: '精英：维克洛尔大帝' },
        { enemies: ['aqt_anubisath', 'aqt_eye'], name: '千眼回廊' },
        { enemies: ['cthun'], name: '最终首领：千眼之魔克苏恩' },
      ],
      desc: '古老虫人帝国的圣殿，沉睡的克苏恩在黑暗中凝视着所有入侵者。',
      chest: { items: [['m_dust', 5], ['m_essence', 6], ['m_crystal', 4], ['a_cthun_armor', 1]], gold: [8000, 10500] },
    },
    /* ===== 新增 8 个经典 5 人副本 ===== */
    ragefire_chasm: {
      id: 'ragefire_chasm', name: '怒焰裂谷', icon: '🔥', zone: 'orgrimmar', minLevel: 15, boss: 'jergosh',
      waves: [
        { enemies: ['rfc_trooper', 'rfc_cultist'], name: '怒焰前厅' },
        { enemies: ['rfc_imp', 'rfc_imp'], name: '暗影祭坛' },
        { enemies: ['rfc_elite'], name: '精英：烈焰守卫' },
        { enemies: ['jergosh'], name: '最终首领：杰尔戈什·召唤者' },
      ],
      desc: '奥格瑞玛地下的熔岩裂隙，暗影议会在此召唤来自深渊的邪火。',
      chest: { items: [['m_dust', 2], ['m_essence', 1]], gold: [900, 1500] },
    },
    stockade: {
      id: 'stockade', name: '暴风城监狱', icon: '⛓️', zone: 'stormwind', minLevel: 24, boss: 'thredd',
      waves: [
        { enemies: ['skd_convict', 'skd_convict'], name: '牢房走廊' },
        { enemies: ['skd_hound', 'skd_brute'], name: '巡逻猎犬' },
        { enemies: ['skd_elite'], name: '精英：典狱长' },
        { enemies: ['thredd'], name: '最终首领：巴基·斯奈德' },
      ],
      desc: '暴风城地下的阴暗牢房，迪菲亚暴动分子正谋划越狱。',
      chest: { items: [['m_dust', 2], ['m_essence', 1]], gold: [1500, 2300] },
    },
    blackfathom_deeps: {
      id: 'blackfathom_deeps', name: '黑暗深渊', icon: '🕳️', zone: 'dustwallow', minLevel: 24, boss: 'akumai',
      waves: [
        { enemies: ['bfd_naga', 'bfd_turtle'], name: '潮汐之门' },
        { enemies: ['bfd_priestess', 'bfd_priestess'], name: '暮光祭坛' },
        { enemies: ['bfd_elite'], name: '精英：暮光守卫' },
        { enemies: ['akumai'], name: '最终首领：阿库麦尔' },
      ],
      desc: '尘泥沼泽深处的无底海渊，暮光之锤在此崇拜深渊中的古老恐惧。',
      chest: { items: [['m_dust', 2], ['m_essence', 1]], gold: [1400, 2100] },
    },
    gnomeregan: {
      id: 'gnomeregan', name: '诺莫瑞根', icon: '🤖', zone: 'redridge', minLevel: 28, boss: 'thermaplugg',
      waves: [
        { enemies: ['gno_mech', 'gno_trooper'], name: '机械工坊' },
        { enemies: ['gno_slime', 'gno_slime'], name: '辐射通道' },
        { enemies: ['gno_elite'], name: '精英：群体打击者9-60' },
        { enemies: ['thermaplugg'], name: '最终首领：瑟玛普拉格' },
      ],
      desc: '侏儒的科技之城毁于辐射灾难，疯狂的机械仍在地下轰鸣。',
      chest: { items: [['m_dust', 3], ['m_essence', 2]], gold: [1700, 2500] },
    },
    razorfen_kraul: {
      id: 'razorfen_kraul', name: '剃刀沼泽', icon: '🌾', zone: 'barrens', minLevel: 29, boss: 'charlga',
      waves: [
        { enemies: ['rfk_quill', 'rfk_boar'], name: '野猪人营地' },
        { enemies: ['rfk_shaman', 'rfk_shaman'], name: '萨满祭坛' },
        { enemies: ['rfk_elite'], name: '精英：剃刀卫士' },
        { enemies: ['charlga'], name: '最终首领：卡尔加·刺肋' },
      ],
      desc: '贫瘠之地南部的荆棘迷宫，野猪人部族盘踞其中。',
      chest: { items: [['m_dust', 3], ['m_essence', 2]], gold: [1800, 2600] },
    },
    razorfen_downs: {
      id: 'razorfen_downs', name: '剃刀高地', icon: '🥀', zone: 'barrens', minLevel: 38, boss: 'amnennar',
      waves: [
        { enemies: ['rfd_bones', 'rfd_worm'], name: '白骨回廊' },
        { enemies: ['rfd_witch', 'rfd_witch'], name: '亡者祭坛' },
        { enemies: ['rfd_elite'], name: '精英：坟墓守卫' },
        { enemies: ['amnennar'], name: '最终首领：阿姆纳尔·冷铸者' },
      ],
      desc: '野猪人圣地的幽暗墓穴，亡灵巫师在此散布瘟疫。',
      chest: { items: [['m_dust', 3], ['m_essence', 2], ['m_crystal', 1]], gold: [2300, 3300] },
    },
    scarlet_monastery: {
      id: 'scarlet_monastery', name: '血色修道院', icon: '⛪', zone: 'plaguelands', minLevel: 39, boss: 'whitemane',
      waves: [
        { enemies: ['sm_knight', 'sm_crusader'], name: '血色大厅' },
        { enemies: ['sm_cleric', 'sm_cleric'], name: '圣光礼拜堂' },
        { enemies: ['sm_elite'], name: '精英：血色勇士' },
        { enemies: ['whitemane'], name: '最终首领：大检察官怀特迈恩' },
      ],
      desc: '血色十字军的圣殿，狂热的圣光信徒在此审判一切异端。',
      chest: { items: [['m_dust', 3], ['m_essence', 2], ['m_crystal', 1]], gold: [2000, 3000] },
    },
    sunken_temple: {
      id: 'sunken_temple', name: '沉没的神庙', icon: '🐍', zone: 'ungoro', minLevel: 49, boss: 'avatar_hakkar',
      waves: [
        { enemies: ['st_troll', 'st_snake'], name: '哈卡莱回廊' },
        { enemies: ['st_priest', 'st_priest'], name: '神庙祭坛' },
        { enemies: ['st_elite'], name: '精英：神像守护者' },
        { enemies: ['avatar_hakkar'], name: '最终首领：哈卡的化身' },
      ],
      desc: '巨魔古都阿塔哈卡神庙沉入沼泽，哈卡的血祭仍在黑暗中继续。',
      chest: { items: [['m_dust', 3], ['m_essence', 3], ['m_crystal', 2]], gold: [3600, 5000] },
    },
  };

  /* ============ 区域 ============ */
  const Z = (id, name, icon, faction, level, desc, opts) => Object.assign({
    id, name, icon, faction, level, desc,
    travel: [], monsters: [], shop: [], quests: [], inn: true, shopName: '商人',
  }, opts);

  D.ZONES = {
    elwynn: Z('elwynn', '艾尔文森林', '🌲', 'alliance', '1-6',
      '暴风城外的翠绿林地，野猪与狗头人出没，迪菲亚强盗的阴影正笼罩北郡。',
      { travel: ['stormwind', 'westfall'], monsters: ['elwynn_boar', 'elwynn_wolf', 'elwynn_kobold', 'elwynn_bandit', 'hogger'],
        quests: ['q_boar', 'q_bandit', 'q_hogger', 'q_elwynn_wolf', 'q_elwynn_kobold'], shop: ['w_wooden_staff', 'w_short_sword', 'a_cloth', 'c_bread', 'a_cloak', 'a_padded_legs'] }),
    stormwind: Z('stormwind', '暴风城', '🏰', 'alliance', '—',
      '人类王国的首都，雄伟的暴风要塞矗立于此，商贾云集、旅店舒适。',
      { travel: ['elwynn', 'westfall', 'stockade'], monsters: [], shop: ['w_short_sword', 'w_hunting_bow', 'w_battle_axe', 'w_staff_of_arcana', 'w_iron_sword', 'w_warblade', 'w_dusk_staff', 'w_steam_saber', 'w_blackrock_sword', 'w_arcane_blade', 'w_ice_guardian', 'w_silithus_scythe', 'a_cloth', 'a_leather', 'a_mail', 'a_plate', 'a_circlet', 'a_steel_boots', 'a_band', 'a_wolf_cloak', 'a_blackrock_plate', 'a_blackrock_helm', 'a_dragonscale', 'a_emperor_plate', 'tr_brass_charm', 'tr_boar_talisman', 'tr_might_signet', 'tr_ember_heart', 'tr_imperial_seal', 'c_bread', 'c_feast', 'c_heal', 'c_mana', 'c_vital', 'c_great_heal', 'c_great_mana', 'c_super_heal', 'c_super_mana', 'c_flask', 'c_master_heal', 'c_master_mana', 'c_ultimate_heal', 'c_ultimate_mana', 'c_eternal_flask', 's_force', 's_protect', 's_crit', 's_swift', 's_spirit', 's_mana', 'p_instant', 'p_deadly', 'p_crippling', 'm_dust', 'm_essence', 'm_crystal', 'bg_linen', 'bg_wool', 'bg_traveler'] }),
    westfall: Z('westfall', '西部荒野', '🌾', 'neutral', '7-12',
      '金色麦浪与荒芜农场交织的平原，收割傀儡在田间游荡，迪菲亚的势力蔓延至此。',
      { travel: ['elwynn', 'stormwind', 'redridge', 'deadmines'], monsters: ['westfall_golem', 'westfall_gnoll', 'westfall_sailor', 'westfall_croc'],
        quests: ['q_golem', 'q_westfall_gnoll', 'q_westfall_croc'], shop: ['w_iron_sword', 'a_leather', 'a_mail', 'c_feast', 'c_heal', 'c_mana', 's_force', 's_protect', 's_spirit', 'p_instant', 'a_wolf_cloak', 'm_dust'] }),
    redridge: Z('redridge', '赤脊山', '⛰️', 'neutral', '10-14',
      '湖畔群山，黑石兽人与食人魔在此盘踞，湖畔镇的人们生活在威胁之下。',
      { travel: ['westfall', 'duskwood', 'gnomeregan'], monsters: ['redridge_lizard', 'redridge_orc', 'redridge_ogre'],
        quests: ['q_lizard', 'q_redridge_orcs', 'q_redridge_ogre'], shop: ['w_iron_sword', 'w_crusader_sword', 'a_mail', 'a_plate', 'c_heal', 'c_mana', 'a_circlet', 'm_dust', 'm_essence'] }),
    duskwood: Z('duskwood', '暮色森林', '🌑', 'neutral', '13-18',
      '常年笼罩在黑暗中的森林，亡者游荡、暗影蔓延，阿鲁高之影注视着一切。',
      { travel: ['redridge', 'westfall', 'stv', 'shadowfang_keep'], monsters: ['dusk_ghoul', 'dusk_hound', 'dusk_spider', 'arugal_shadow'],
        quests: ['q_ghoul', 'q_hound', 'q_arugal', 'q_dusk_spider'], shop: ['w_crusader_sword', 'w_nightblade', 'w_warblade', 'w_dusk_staff', 'a_plate', 'a_steel_boots', 'a_blue', 'tr_might_signet', 'tr_ember_heart', 'c_heal', 'c_mana', 'c_vital', 'm_essence', 'm_crystal', 'w_off_dagger', 'a_raptor_gloves', 'a_bronze_neck'] }),
    deadmines: Z('deadmines', '死亡矿井', '⛏️', 'neutral', '15-18',
      '迪菲亚兄弟会的地下据点，铁镐声与阴谋的低语在黑暗中回响。',
      { travel: ['westfall'], monsters: [], dungeon: 'deadmines', inn: false,
        quests: ['q_dm'] }),
    durotar: Z('durotar', '杜隆塔尔', '🏜️', 'horde', '1-6',
      '部落的起始之地，红土荒野上野猪成群，叛徒与半人马威胁着新生部落。',
      { travel: ['orgrimmar', 'barrens'], monsters: ['durotar_boar', 'durotar_scorpion', 'durotar_traitor', 'durotar_centaur'],
        quests: ['q_durotar_boar', 'q_durotar_scorpion', 'q_durotar_centaur'], shop: ['w_wooden_staff', 'w_short_sword', 'a_cloth', 'c_bread', 's_force', 's_swift', 'a_cloak', 'a_padded_legs'] }),
    orgrimmar: Z('orgrimmar', '奥格瑞玛', '🔥', 'horde', '—',
      '部落的荣耀之城，雷霆崖与大熔炉见证了兽人的力量与骄傲。',
      { travel: ['durotar', 'barrens', 'ragefire_chasm'], monsters: [], shop: ['w_short_sword', 'w_hunting_bow', 'w_battle_axe', 'w_staff_of_arcana', 'w_iron_sword', 'w_warblade', 'w_dusk_staff', 'a_cloth', 'a_leather', 'a_mail', 'a_plate', 'a_circlet', 'a_steel_boots', 'a_band', 'a_wolf_cloak', 'tr_brass_charm', 'tr_boar_talisman', 'tr_might_signet', 'tr_ember_heart', 'tr_imperial_seal', 'c_bread', 'c_feast', 'c_heal', 'c_mana', 'c_vital', 'c_great_heal', 'c_great_mana', 'c_super_heal', 'c_super_mana', 'c_flask', 'c_master_heal', 'c_master_mana', 'c_ultimate_heal', 'c_ultimate_mana', 'c_eternal_flask', 's_force', 's_protect', 's_crit', 's_swift', 's_spirit', 's_mana', 'p_instant', 'p_deadly', 'p_crippling', 'm_dust', 'm_essence', 'm_crystal', 'bg_linen', 'bg_wool', 'bg_traveler'] }),
    barrens: Z('barrens', '贫瘠之地', '🦁', 'neutral', '8-14',
      '一望无际的草原，狮群、半人马与野猪人在这片土地上争夺领地。棘齿城的商船可抵达荆棘谷的藏宝海湾。',
      { travel: ['durotar', 'orgrimmar', 'wailing_caverns', 'thousand_needles', 'razorfen_kraul', 'razorfen_downs', 'stv'], monsters: ['barrens_lion', 'barrens_centaur', 'barrens_lizard', 'barrens_quill'],
        quests: ['q_centaur', 'q_lion', 'q_quill', 'q_barrens_lizard'], shop: ['w_iron_sword', 'a_leather', 'a_mail', 'c_feast', 'c_heal', 'c_mana', 'p_deadly', 'p_crippling', 'a_band', 'm_dust', 'm_essence'] }),
    wailing_caverns: Z('wailing_caverns', '哀嚎洞穴', '🌿', 'neutral', '13-17',
      '洞穴深处回响着古老的哀嚎，扭曲的植物与野兽守卫着黑暗的秘密。',
      { travel: ['barrens'], monsters: [], dungeon: 'wailing_caverns', inn: false,
        quests: ['q_wc'] }),
    /* 联盟新区域 (18-58) */
    stv: Z('stv', '荆棘谷', '🌴', 'neutral', '18-26',
      '潮湿闷热的热带丛林，猛虎与猿猴潜伏于树冠之间，血帆海盗盘踞在海岸线。藏宝海湾的商船可前往贫瘠之地的棘齿城。',
      { travel: ['duskwood', 'badlands', 'zulgurub', 'barrens'], monsters: ['stv_panther', 'stv_ape', 'stv_tiger', 'stv_basilisk', 'stv_elite'],
        quests: ['q_stv_panther', 'q_stv_elite', 'q_stv_tiger'], shop: ['w_stv_machete', 'w_jungle_staff', 'w_stv_cutlass', 'a_stv_cloak', 'a_stv_helm', 'a_stv_chest', 'a_stv_ring', 'c_heal', 'c_mana', 'm_dust', 'w_off_hide_shield', 'w_off_iron_shield', 'a_raptor_gloves', 'a_bronze_neck'] }),
    badlands: Z('badlands', '荒芜之地', '🏜️', 'neutral', '26-34',
      '赤色山峦寸草不生，巨蝎与秃鹫争夺残骸，荒原深处传来熔岩的低吼。',
      { travel: ['stv', 'searing', 'uldaman'], monsters: ['badlands_wolf', 'badlands_scorpion', 'badlands_vulture', 'badlands_ogre', 'badlands_basilisk', 'badlands_raptor', 'badlands_elite'],
        quests: ['q_badlands_scorpion', 'q_badlands_elite', 'q_badlands_vulture'], shop: ['w_badlands_hammer', 'w_grim_staff', 'w_badlands_cleaver', 'a_badlands_plate', 'a_badlands_boots', 'a_badlands_legs', 'a_badlands_hood', 'a_marsh_robes', 'a_marsh_cord_legs', 'c_great_heal', 'c_great_mana', 'm_essence', 'a_badlands_gloves', 'a_badlands_cloak', 'a_badlands_helm', 'w_off_razor_shiv'] }),
    searing: Z('searing', '灼热峡谷', '🌋', 'neutral', '34-42',
      '黑铁矮人挖掘出的灼热之地，熔岩河奔流不息，大熔炉的黑烟遮天蔽日。',
      { travel: ['badlands', 'burning'], monsters: ['searing_lava', 'searing_dwarf', 'searing_lizard', 'searing_elemental', 'searing_wolf', 'searing_whelp', 'searing_elite'],
        quests: ['q_searing_lava', 'q_searing_elite', 'q_searing_dwarf'], shop: ['w_steam_saber', 'w_searing_axe', 'w_searing_staff', 'w_flame_staff', 'a_searing_mail', 'a_searing_legs', 'c_great_heal', 'c_great_mana', 'm_essence', 'a_burning_boots', 'a_burning_cloak', 'a_burning_gloves', 'w_off_moon_totem', 'w_off_mithril_shield'] }),
    burning: Z('burning', '燃烧平原', '🔥', 'neutral', '42-50',
      '黑石山的阴影笼罩着这片焦土，巨龙与黑石兽人把守着通往黑石深渊的道路。',
      { travel: ['searing', 'winterspring', 'blackrock_depths', 'blasted_lands', 'blackrock_spire', 'molten_core'], monsters: ['burning_whelp', 'burning_orc', 'burning_hound', 'burning_dragon', 'burning_elite'],
        quests: ['q_burning_dragon', 'q_burning_elite', 'q_burning_hound'], shop: ['w_blackrock_sword', 'w_brd_staff', 'w_drake_blade', 'a_blackrock_plate', 'a_blackrock_helm', 'c_super_heal', 'c_super_mana', 'c_master_heal', 'c_master_mana', 'm_crystal', 'a_blasted_ring', 'w_off_sun_totem'] }),
    winterspring: Z('winterspring', '冬泉谷', '❄️', 'neutral', '50-58',
      '终年积雪的冰川谷地，冰霜巨人行走在暴风雪中，深冬之影在极光下若隐若现。',
      { travel: ['burning', 'naxxramas', 'felwood', 'azshara'], monsters: ['winter_frostwolf', 'winter_yeti', 'winter_owl', 'winter_giant', 'winter_elite'],
        quests: ['q_winter_giant', 'q_winter_elite', 'q_winter_owl'], shop: ['w_winter_axe', 'w_winter_staff', 'w_arcane_blade', 'w_frost_staff', 'a_winter_cloak', 'a_winter_leather', 'a_winter_gloves', 'tr_naaru_tear', 'c_super_heal', 'c_flask', 'c_ultimate_heal', 'c_ultimate_mana', 'm_crystal', 'a_winter_boots', 'w_off_dark_guard'] }),
    blackrock_depths: Z('blackrock_depths', '黑石深渊', '⛏️', 'neutral', '44-52',
      '黑铁矮人的地下要塞，熔炉的火光映照着千年复仇的执念。',
      { travel: ['burning', 'blackwing_lair'], monsters: [], dungeon: 'blackrock_depths', inn: false,
        quests: ['q_brd'] }),
    /* 部落新区域 (18-58) */
    thousand_needles: Z('thousand_needles', '千针石林', '🌵', 'neutral', '18-26',
      '直插云霄的砂岩巨柱矗立在峡谷之间，半人马部落与古老巨龟共享这片奇境。',
      { travel: ['barrens', 'dustwallow'], monsters: ['needle_vulture', 'needle_coyote', 'needle_turtle', 'needle_centaur', 'needle_elite'],
        quests: ['q_needle_coyote', 'q_needle_elite', 'q_needle_turtle'], shop: ['w_stv_machete', 'w_jungle_staff', 'a_stv_cloak', 'a_stv_helm', 'c_heal', 'c_mana', 'm_dust'] }),
    dustwallow: Z('dustwallow', '尘泥沼泽', '🐊', 'neutral', '26-34',
      '腐臭的泥沼笼罩着水汽，巨型鳄鱼与软泥怪在迷雾中潜伏，沼泽巫医的低吟令人不安。',
      { travel: ['thousand_needles', 'tanaris', 'maraudon', 'onyxias_lair', 'blackfathom_deeps'], monsters: ['marsh_croc', 'marsh_slime', 'marsh_spider', 'marsh_ogre', 'marsh_turtle', 'marsh_raptor', 'marsh_elite'],
        quests: ['q_marsh_croc', 'q_marsh_elite', 'q_marsh_spider'], shop: ['w_badlands_hammer', 'w_grim_staff', 'w_marsh_bow', 'w_marsh_scepter', 'a_badlands_plate', 'a_badlands_boots', 'a_marsh_cloak', 'a_marsh_neck', 'a_marsh_robes', 'a_marsh_cord_legs', 'c_great_heal', 'c_great_mana', 'm_essence', 'a_badlands_cloak', 'a_marsh_legs', 'a_marsh_ring', 'w_off_razor_shiv'] }),
    tanaris: Z('tanaris', '塔纳利斯', '🏜️', 'neutral', '34-42',
      '一望无际的金色沙海，巨魔古都祖尔法拉克的废墟在烈日下诉说着古老传说。',
      { travel: ['dustwallow', 'ungoro', 'zulfarrak'], monsters: ['tanaris_vulture', 'tanaris_scorpion', 'tanaris_turtle', 'tanaris_wastewalker', 'tanaris_wasp', 'tanaris_hyena', 'tanaris_elite'],
        quests: ['q_tanaris_scorpion', 'q_tanaris_elite', 'q_tanaris_turtle'], shop: ['w_steam_saber', 'w_searing_axe', 'w_searing_staff', 'w_flame_staff', 'a_searing_mail', 'a_searing_legs', 'c_great_heal', 'c_great_mana', 'm_essence', 'a_desert_ring', 'a_desert_neck', 'a_burning_cloak', 'a_burning_gloves', 'w_off_moon_totem', 'w_off_mithril_shield'] }),
    ungoro: Z('ungoro', '安戈洛环形山', '🦕', 'neutral', '42-50',
      '远古陨石坑中的神秘丛林，恐龙与巨型昆虫横行，奇异的能量涌动在这片土地上。',
      { travel: ['tanaris', 'plaguelands', 'silithus', 'sunken_temple'], monsters: ['ungoro_raptor', 'ungoro_gorilla', 'ungoro_dino', 'ungoro_plant', 'ungoro_elite'],
        quests: ['q_ungoro_dino', 'q_ungoro_elite', 'q_ungoro_gorilla'], shop: ['w_blackrock_sword', 'w_brd_staff', 'w_drake_blade', 'a_blackrock_plate', 'a_blackrock_helm', 'c_super_heal', 'c_super_mana', 'c_master_heal', 'c_master_mana', 'm_crystal'] }),
    plaguelands: Z('plaguelands', '瘟疫之地', '💀', 'neutral', '50-58',
      '被天灾军团腐蚀的荒芜大地，亡灵游荡于毒雾之中，巫妖之影凝视着每一个入侵者。',
      { travel: ['ungoro', 'scholomance', 'eplaguelands', 'scarlet_monastery'], monsters: ['plague_zombie', 'plague_bat', 'plague_knight', 'plague_abomination', 'plague_elite'],
        quests: ['q_plague_abom', 'q_plague_elite', 'q_plague_bat'], shop: ['w_winter_axe', 'w_winter_staff', 'w_arcane_blade', 'w_frost_staff', 'a_winter_cloak', 'a_winter_leather', 'a_winter_gloves', 'c_super_heal', 'c_flask', 'c_ultimate_heal', 'c_ultimate_mana', 'm_crystal'] }),
    zulfarrak: Z('zulfarrak', '祖尔法拉克', '🏺', 'neutral', '36-44',
      '沙怒巨魔的古老都城，被诅咒的木乃伊在断壁残垣间守卫着失落的神器。',
      { travel: ['tanaris'], monsters: [], dungeon: 'zulfarrak', inn: false,
        quests: ['q_zf'] }),
    shadowfang_keep: Z('shadowfang_keep', '影牙城堡', '🐺', 'neutral', '19-25',
      '狼人诅咒的源头，阿鲁高的巫术在城堡高塔中低语。',
      { travel: ['duskwood'], monsters: [], dungeon: 'shadowfang_keep', inn: false,
        quests: ['q_sfk'] }),
    uldaman: Z('uldaman', '奥达曼', '🏛️', 'neutral', '30-36',
      '泰坦造物沉睡的远古遗迹，失落的神器在符文深处等待。',
      { travel: ['badlands'], monsters: [], dungeon: 'uldaman', inn: false,
        quests: ['q_uldaman'] }),
    maraudon: Z('maraudon', '玛拉顿', '💧', 'neutral', '34-40',
      '被污染的泉水深处，瑟莱德丝公主守护着堕落的秘密。',
      { travel: ['dustwallow'], monsters: [], dungeon: 'maraudon', inn: false,
        quests: ['q_maraudon'] }),
    scholomance: Z('scholomance', '通灵学院', '🎓', 'neutral', '54-58',
      '天灾军团培养死灵法师的学府，加丁院长在黑暗中授课。',
      { travel: ['plaguelands'], monsters: [], dungeon: 'scholomance', inn: false,
        quests: ['q_scholomance'] }),
    naxxramas: Z('naxxramas', '纳克萨玛斯', '💀', 'neutral', '57-60',
      '悬浮于天际的巫妖要塞，克尔苏加德的寒冰王座俯瞰着整个大陆。',
      { travel: ['winterspring'], monsters: [], dungeon: 'naxxramas', inn: false,
        quests: ['q_naxxramas'] }),
    /* 60 级新区域 */
    blasted_lands: Z('blasted_lands', '诅咒之地', '🌋', 'neutral', '48-55',
      '恶魔撕裂大地的一角，深渊领主在暗影中徘徊，黑暗之门在远方若隐若现。',
      { travel: ['burning'], monsters: ['bl_hellhound', 'bl_mauler', 'bl_raptor', 'bl_imp', 'bl_elite'],
        quests: ['q_bl_elite', 'q_bl_mauler'], shop: ['w_doom_cleaver', 'w_necropolis_staff', 'a_blasted_plate', 'a_felwood_robe', 'tr_blasted_seal', 'c_super_heal', 'c_flask', 'c_ultimate_heal', 'c_ultimate_mana', 'm_crystal', 'a_blasted_neck', 'a_blasted_legs', 'w_off_dark_guard'] }),
    felwood: Z('felwood', '费伍德森林', '🌲', 'neutral', '50-58',
      '被恶魔污染的黑森林，萨特与腐化生物在此横行，厄运之槌的尖塔若隐若现。',
      { travel: ['winterspring', 'azshara', 'dire_maul'], monsters: ['fel_satyr', 'fel_treant', 'fel_worg', 'fel_spore', 'fel_elite'],
        quests: ['q_fel_elite', 'q_fel_satyr'], shop: ['w_doom_cleaver', 'w_necropolis_staff', 'a_blasted_plate', 'a_felwood_robe', 'tr_blasted_seal', 'c_super_heal', 'c_flask', 'c_ultimate_heal', 'c_ultimate_mana', 'm_crystal'] }),
    azshara: Z('azshara', '艾萨拉', '🌊', 'neutral', '50-58',
      '精灵女王曾钟爱的海岸，如今娜迦与蓝龙争霸，遗迹中蕴藏着古老的奥术力量。',
      { travel: ['felwood', 'winterspring'], monsters: ['azz_naga', 'azz_lizard', 'azz_drake', 'azz_ogre', 'azz_elite'],
        quests: ['q_azz_elite', 'q_azz_drake'], shop: ['w_doom_cleaver', 'w_necropolis_staff', 'a_felwood_robe', 'a_epl_helm', 'tr_blasted_seal', 'c_super_heal', 'c_flask', 'c_ultimate_heal', 'c_ultimate_mana', 'm_crystal'] }),
    eplaguelands: Z('eplaguelands', '东瘟疫之地', '☠️', 'neutral', '58-60',
      '天灾军团的心脏地带，亡灵大军永不停歇地游荡，斯坦索姆的阴影笼罩着这片死地。',
      { travel: ['plaguelands', 'stratholme'], monsters: ['epl_ghoul', 'epl_gargoyle', 'epl_abom', 'epl_necromancer', 'epl_elite'],
        quests: ['q_epl_elite', 'q_epl_abom'], shop: ['w_silithid_stinger', 'w_necropolis_staff', 'a_silithid_chitin', 'a_epl_helm', 'c_super_heal', 'c_flask', 'c_master_heal', 'c_master_mana', 'c_ultimate_heal', 'c_ultimate_mana', 'c_eternal_flask', 'm_crystal', 'a_plague_cloak', 'w_off_dragon_shield'] }),
    silithus: Z('silithus', '希利苏斯', '🏜️', 'neutral', '58-60',
      '无垠沙漠下的虫巢帝国，其拉虫人正从安其拉的封印中苏醒。',
      { travel: ['ungoro', 'ruins_ahnqiraj', 'temple_ahnqiraj'], monsters: ['sil_sandcrawler', 'sil_beetle', 'sil_soldier', 'sil_scarab', 'sil_elite'],
        quests: ['q_sil_elite', 'q_sil_beetle'], shop: ['w_silithid_stinger', 'w_necropolis_staff', 'a_silithid_chitin', 'a_epl_helm', 'c_super_heal', 'c_flask', 'c_master_heal', 'c_master_mana', 'c_ultimate_heal', 'c_ultimate_mana', 'c_eternal_flask', 'm_crystal', 'a_silithus_ring', 'a_silithus_neck', 'w_off_dragon_shield'] }),
    /* 新副本区域 */
    blackrock_spire: Z('blackrock_spire', '黑石塔', '🏰', 'neutral', '55-58',
      '黑石山巅的要塞，达基萨斯将军的龙人军团把守着每一层塔楼。',
      { travel: ['burning'], monsters: [], dungeon: 'blackrock_spire', inn: false, quests: ['q_blackrock_spire'] }),
    stratholme: Z('stratholme', '斯坦索姆', '🏛️', 'neutral', '56-60',
      '亡灵之城，瑞文戴尔男爵的坐骑踏过满地白骨。',
      { travel: ['eplaguelands'], monsters: [], dungeon: 'stratholme', inn: false, quests: ['q_stratholme'] }),
    dire_maul: Z('dire_maul', '厄运之槌', '🌿', 'neutral', '55-58',
      '精灵古城中的幻象宫殿，恶魔之眼注视着每一个闯入者。',
      { travel: ['felwood'], monsters: [], dungeon: 'dire_maul', inn: false, quests: ['q_dire_maul'] }),
    molten_core: Z('molten_core', '熔火之心', '🌋', 'neutral', '60',
      '火焰领主的地底熔炉，灼热岩浆是这里唯一的风景。',
      { travel: ['burning'], monsters: [], dungeon: 'molten_core', inn: false, quests: ['q_molten_core'] }),
    blackwing_lair: Z('blackwing_lair', '黑翼之巢', '🦇', 'neutral', '60',
      '奈法利安的空中堡垒，黑龙军团的阴谋在此酝酿。',
      { travel: ['blackrock_depths'], monsters: [], dungeon: 'blackwing_lair', inn: false, quests: ['q_blackwing_lair'] }),
    onyxias_lair: Z('onyxias_lair', '奥妮克希亚的巢穴', '🐲', 'neutral', '60',
      '尘泥沼泽深处的黑龙巢穴，奥妮克希亚在此囤积她的财宝。',
      { travel: ['dustwallow'], monsters: [], dungeon: 'onyxias_lair', inn: false, quests: ['q_onyxias_lair'] }),
    zulgurub: Z('zulgurub', '祖尔格拉布', '🐍', 'neutral', '60',
      '巨魔帝国的神圣之地，血神的祭坛渴望着祭品。',
      { travel: ['stv'], monsters: [], dungeon: 'zulgurub', inn: false, quests: ['q_zulgurub'] }),
    ruins_ahnqiraj: Z('ruins_ahnqiraj', '安其拉废墟', '🪲', 'neutral', '60',
      '其拉虫人的前线要塞，虫群如潮水般涌出。',
      { travel: ['silithus'], monsters: [], dungeon: 'ruins_ahnqiraj', inn: false, quests: ['q_ruins_ahnqiraj'] }),
    temple_ahnqiraj: Z('temple_ahnqiraj', '安其拉神殿', '🐛', 'neutral', '60',
      '古神克苏恩的沉睡之地，千眼之魔的梦境笼罩着整座神殿。',
      { travel: ['silithus'], monsters: [], dungeon: 'temple_ahnqiraj', inn: false, quests: ['q_temple_ahnqiraj'] }),
    /* ===== 新增 8 副本区域 ===== */
    ragefire_chasm: Z('ragefire_chasm', '怒焰裂谷', '🔥', 'neutral', '15-16',
      '奥格瑞玛地下的熔岩裂隙，暗影议会在此召唤来自深渊的邪火。',
      { travel: ['orgrimmar'], monsters: [], dungeon: 'ragefire_chasm', inn: false, quests: ['q_ragefire'] }),
    stockade: Z('stockade', '暴风城监狱', '⛓️', 'neutral', '24-26',
      '暴风城地下的阴暗牢房，迪菲亚暴动分子正谋划越狱。',
      { travel: ['stormwind'], monsters: [], dungeon: 'stockade', inn: false, quests: ['q_stockade'] }),
    blackfathom_deeps: Z('blackfathom_deeps', '黑暗深渊', '🕳️', 'neutral', '24-26',
      '尘泥沼泽深处的无底海渊，暮光之锤在此崇拜深渊中的古老恐惧。',
      { travel: ['dustwallow'], monsters: [], dungeon: 'blackfathom_deeps', inn: false, quests: ['q_blackfathom'] }),
    gnomeregan: Z('gnomeregan', '诺莫瑞根', '🤖', 'neutral', '28-30',
      '侏儒的科技之城毁于辐射灾难，疯狂的机械仍在地下轰鸣。',
      { travel: ['redridge'], monsters: [], dungeon: 'gnomeregan', inn: false, quests: ['q_gnomeregan'] }),
    razorfen_kraul: Z('razorfen_kraul', '剃刀沼泽', '🌾', 'neutral', '29-31',
      '贫瘠之地南部的荆棘迷宫，野猪人部族盘踞其中。',
      { travel: ['barrens'], monsters: [], dungeon: 'razorfen_kraul', inn: false, quests: ['q_razorfen_kraul'] }),
    razorfen_downs: Z('razorfen_downs', '剃刀高地', '🥀', 'neutral', '38-40',
      '野猪人圣地的幽暗墓穴，亡灵巫师在此散布瘟疫。',
      { travel: ['barrens'], monsters: [], dungeon: 'razorfen_downs', inn: false, quests: ['q_razorfen_downs'] }),
    scarlet_monastery: Z('scarlet_monastery', '血色修道院', '⛪', 'neutral', '39-41',
      '血色十字军的圣殿，狂热的圣光信徒在此审判一切异端。',
      { travel: ['plaguelands'], monsters: [], dungeon: 'scarlet_monastery', inn: false, quests: ['q_scarlet_monastery'] }),
    sunken_temple: Z('sunken_temple', '沉没的神庙', '🐍', 'neutral', '49-51',
      '巨魔古都阿塔哈卡神庙沉入沼泽，哈卡的血祭仍在黑暗中继续。',
      { travel: ['ungoro'], monsters: [], dungeon: 'sunken_temple', inn: false, quests: ['q_sunken_temple'] }),
  };

  /* ============ 物品 ============ */
  const IT = (id, name, icon, slot, quality, level, stats, opts, extra) => Object.assign({
    id, name, icon, slot, quality, level, stats: stats || {},
    buy: opts && opts.buy, sell: opts && opts.sell, consumable: opts && opts.consumable,
  }, opts || {}, extra || {});

  D.ITEMS = {
    /* 武器 */
    w_wooden_staff:    IT('w_wooden_staff', '木棍', '🥢', 'weapon', 'white', 1, { dmg: [4, 8], str: 1 }, { buy: 80 }),
    w_short_sword:     IT('w_short_sword', '短剑', '🗡️', 'weapon', 'white', 3, { dmg: [7, 13], agi: 1 }, { buy: 300 }),
    w_hunting_bow:     IT('w_hunting_bow', '猎弓', '🏹', 'weapon', 'white', 5, { dmg: [9, 16], agi: 2 }, { buy: 700 }),
    w_battle_axe:      IT('w_battle_axe', '战斧', '🪓', 'weapon', 'white', 7, { dmg: [12, 20], str: 2 }, { buy: 1200 }),
    w_staff_of_arcana: IT('w_staff_of_arcana', '奥术法杖', '🪄', 'weapon', 'green', 9, { dmg: [8, 12], int: 4, spi: 3 }, { buy: 1800 }),
    w_iron_sword:      IT('w_iron_sword', '精钢长剑', '⚔️', 'weapon', 'white', 11, { dmg: [16, 26], str: 2 }, { buy: 2600 }),
    w_crusader_sword:  IT('w_crusader_sword', '十字军之剑', '⚜️', 'weapon', 'green', 13, { dmg: [20, 32], str: 4, stam: 3 }, { buy: 4200 }),
    w_nightblade:      IT('w_nightblade', '夜刃', '🔪', 'weapon', 'green', 15, { dmg: [24, 38], agi: 5, stam: 2 }, { buy: 6000 }),
    vancleef_fang:     IT('vancleef_fang', '范克里夫之牙', '🗡️', 'weapon', 'blue', 17, { dmg: [30, 46], agi: 6, crit: 0.02 }, { sell: 5200 }),
    /* 护甲 */
    a_cloth:  IT('a_cloth', '亚麻布衣', '👕', 'chest', 'white', 2, { armor: 6, int: 1 }, { buy: 120 }),
    a_leather: IT('a_leather', '硬皮护甲', '🧥', 'chest', 'white', 5, { armor: 14, stam: 2 }, { buy: 800 }),
    a_mail:   IT('a_mail', '锁甲战衣', '🦺', 'chest', 'white', 8, { armor: 26, str: 2, stam: 1 }, { buy: 1600 }),
    a_plate:  IT('a_plate', '精钢板甲', '🛡️', 'chest', 'white', 11, { armor: 42, str: 3, stam: 2 }, { buy: 3200 }),
    a_blue:   IT('a_blue', '夜幕胸甲', '🌑', 'chest', 'blue', 15, { armor: 60, agi: 4, stam: 4 }, { buy: 7200, sell: 3600 }),
    a_helm:   IT('a_helm', '战士头盔', '🪖', 'head', 'green', 10, { armor: 22, str: 2, stam: 2 }, { buy: 1500 }),
    a_boots:  IT('a_boots', '旅行皮靴', '🥾', 'boots', 'white', 4, { armor: 8, agi: 1 }, { buy: 500 }),
    a_gloves: IT('a_gloves', '作战手套', '🧤', 'gloves', 'white', 6, { armor: 12, str: 1 }, { buy: 900 }),
    a_legs:   IT('a_legs', '守卫护腿', '👖', 'legs', 'green', 12, { armor: 30, stam: 3, str: 1 }, { buy: 3800 }),
    a_cloak:  IT('a_cloak', '旅者披风', '🧣', 'cloak', 'white', 3, { armor: 5, spi: 1 }, { buy: 350 }),
    a_neck:   IT('a_neck', '铜质项链', '📿', 'neck', 'white', 5, { int: 2 }, { buy: 650 }),
    a_ring:   IT('a_ring', '生命之戒', '💍', 'ring', 'green', 9, { stam: 3 }, { buy: 1400 }),
    /* 消耗品 */
    /* 回复类消耗品:一律按「最大生命/法力的百分比」回复(healPct / manaPct)
     * ——固定值在高等级会被稀释、在低等级又会被越级嗑药滥用,百分比让每档药水在自己等级段保持同一强度占比。 */
    c_bread:  IT('c_bread', '魔法面包', '🍞', 'consumable', 'white', 1, {}, { consumable: { healPct: 0.10 }, buy: 25 }),
    c_feast:  IT('c_feast', '香烤大餐', '🍖', 'consumable', 'green', 8, {}, { consumable: { healPct: 0.20 }, buy: 150 }),
    c_heal:   IT('c_heal', '治疗药水', '🧪', 'consumable', 'green', 10, {}, { consumable: { healPct: 0.25 }, buy: 350 }),
    c_mana:   IT('c_mana', '法力药水', '💧', 'consumable', 'green', 10, {}, { consumable: { manaPct: 0.15 }, buy: 350 }),
    c_vital:  IT('c_vital', '活力药水', '⚗️', 'consumable', 'blue', 12, {}, { consumable: { healPct: 0.15, manaPct: 0.10 }, buy: 600 }),
    /* 盗贼毒药 */
    p_instant:   IT('p_instant', '速效毒药', '💉', 'consumable', 'green', 6, {}, { poison: { type: 'instant', per: 12 }, buy: 220, sell: 60 }),
    p_deadly:    IT('p_deadly', '致命毒药', '🩸', 'consumable', 'green', 8, {}, { poison: { type: 'deadly', per: 10, rounds: 3 }, buy: 280, sell: 75 }),
    p_crippling: IT('p_crippling', '致残毒药', '🕸️', 'consumable', 'green', 7, {}, { poison: { type: 'crippling', pct: 0.2, rounds: 2 }, buy: 250, sell: 65 }),
    /* 新装备 */
    w_warblade:    IT('w_warblade', '战刃', '🗡️', 'weapon', 'blue', 14, { dmg: [22, 34], agi: 5, crit: 0.02 }, { buy: 5200, sell: 2600 }),
    w_dusk_staff:  IT('w_dusk_staff', '暮影法杖', '🪄', 'weapon', 'green', 13, { dmg: [12, 18], int: 5, spi: 3 }, { buy: 3900, sell: 1900 }),
    a_circlet:     IT('a_circlet', '奥术头环', '🪖', 'head', 'green', 9, { armor: 14, int: 3, spi: 2 }, { buy: 1900, sell: 950 }),
    a_steel_boots: IT('a_steel_boots', '钢质战靴', '🥾', 'boots', 'green', 13, { armor: 18, str: 2, stam: 1 }, { buy: 3400, sell: 1700 }),
    a_band:        IT('a_band', '猎风指环', '💍', 'ring', 'green', 10, { agi: 3 }, { buy: 1800, sell: 900 }),
    a_wolf_cloak:  IT('a_wolf_cloak', '狼皮披风', '🧣', 'cloak', 'green', 8, { armor: 10, agi: 2 }, { buy: 1200, sell: 600 }),
    /* 饰品(双槽:trinket1/trinket2) */
    tr_brass_charm:   IT('tr_brass_charm', '黄铜护符', '🎖️', 'trinket', 'white', 6, { stam: 1 }, { buy: 500, sell: 250 }),
    tr_boar_talisman: IT('tr_boar_talisman', '野猪之牙护符', '🦷', 'trinket', 'green', 12, { stam: 3, agi: 1 }, { buy: 1800, sell: 900 }),
    tr_might_signet:  IT('tr_might_signet', '猛击徽章', '🛡️', 'trinket', 'green', 18, { str: 4, stam: 2 }, { buy: 4600, sell: 2300 }),
    tr_ember_heart:   IT('tr_ember_heart', '余烬之心', '❤️‍🔥', 'trinket', 'green', 26, { int: 4, spi: 3, crit: 0.02 }, { buy: 9800, sell: 4900 }),
    tr_lucky_clover:  IT('tr_lucky_clover', '幸运四叶草', '🍀', 'trinket', 'blue', 32, { crit: 0.03, stam: 5, agi: 2 }, { buy: 16000, sell: 8000 }),
    tr_imperial_seal: IT('tr_imperial_seal', '统御之印', '👑', 'trinket', 'green', 38, { str: 6, stam: 5, crit: 0.01 }, { buy: 26000, sell: 13000 }),
    tr_abyss_eye:     IT('tr_abyss_eye', '深渊之眼', '👁️', 'trinket', 'blue', 46, { int: 7, spi: 6, crit: 0.02 }, { buy: 40000, sell: 14000 }),
    tr_naaru_tear:    IT('tr_naaru_tear', '纳鲁之泪', '💧', 'trinket', 'blue', 54, { stam: 8, int: 8, crit: 0.02 }, { buy: 64000, sell: 16000 }),
    /* 锻造材料 */
    m_dust:    IT('m_dust', '奥术粉尘', '✨', 'material', 'green', 5, {}, { buy: 150, sell: 50 }),
    m_essence: IT('m_essence', '梦境精华', '🔮', 'material', 'blue', 12, {}, { buy: 800, sell: 300 }),
    m_crystal: IT('m_crystal', '奥术水晶', '💎', 'material', 'epic', 16, {}, { buy: 2500, sell: 900 }),
    // 背包扩容物品(主城商人出售,使用后永久扩充容量)
    bg_linen:    IT('bg_linen', '亚麻背包', '🎒', 'bag', 'white', 5, {}, { buy: 1200, sell: 300, bagSize: 10 }),
    bg_wool:     IT('bg_wool', '毛皮背包', '🎒', 'bag', 'green', 20, {}, { buy: 4500, sell: 1200, bagSize: 15 }),
    bg_traveler: IT('bg_traveler', '旅行者背包', '🧳', 'bag', 'blue', 40, {}, { buy: 12000, sell: 3500, bagSize: 20 }),
    /* ===== 高阶武器 (18-58) ===== */
    w_stv_machete:    IT('w_stv_machete', '荆棘砍刀', '🔪', 'weapon', 'green', 18, { dmg: [26, 40], agi: 4, stam: 2 }, { buy: 7800, sell: 3900 }),
    w_jungle_staff:   IT('w_jungle_staff', '丛林法杖', '🪄', 'weapon', 'green', 20, { dmg: [16, 24], int: 6, spi: 4 }, { buy: 9200, sell: 4600 }),
    w_badlands_hammer: IT('w_badlands_hammer', '荒芜战锤', '🔨', 'weapon', 'green', 26, { dmg: [36, 54], str: 6, stam: 3 }, { buy: 14500, sell: 7200 }),
    w_grim_staff:     IT('w_grim_staff', '幽暗法杖', '🪄', 'weapon', 'green', 28, { dmg: [22, 30], int: 8, spi: 5 }, { buy: 16500, sell: 8200 }),
    w_steam_saber:    IT('w_steam_saber', '蒸汽之刃', '🗡️', 'weapon', 'blue', 30, { dmg: [40, 60], agi: 8, crit: 0.02 }, { buy: 26000, sell: 13000 }),
    w_searing_axe:    IT('w_searing_axe', '灼热战斧', '🪓', 'weapon', 'green', 34, { dmg: [48, 72], str: 8, stam: 4 }, { buy: 23500, sell: 11700 }),
    w_flame_staff:    IT('w_flame_staff', '烈焰法杖', '🪄', 'weapon', 'green', 36, { dmg: [28, 40], int: 10, spi: 6 }, { buy: 26000, sell: 13000 }),
    w_blackrock_sword: IT('w_blackrock_sword', '黑石巨剑', '⚔️', 'weapon', 'blue', 40, { dmg: [56, 84], str: 10, stam: 6 }, { buy: 42000, sell: 21000 }),
    w_drake_blade:    IT('w_drake_blade', '龙鳞之刃', '🐉', 'weapon', 'blue', 44, { dmg: [62, 94], agi: 10, crit: 0.03 }, { buy: 52000, sell: 18200 }),
    w_frost_staff:    IT('w_frost_staff', '冰霜法杖', '❄️', 'weapon', 'green', 46, { dmg: [38, 52], int: 12, spi: 8 }, { buy: 38000, sell: 13300 }),
    w_winter_axe:     IT('w_winter_axe', '冬泉战斧', '🪓', 'weapon', 'blue', 50, { dmg: [70, 106], str: 12, stam: 8 }, { buy: 68000, sell: 23800 }),
    w_arcane_blade:   IT('w_arcane_blade', '奥术巨刃', '✨', 'weapon', 'epic', 54, { dmg: [80, 120], str: 14, agi: 6, crit: 0.03 }, { buy: 95000, sell: 23750 }),
    w_silithus_scythe: IT('w_silithus_scythe', '暮光收割者', '☠️', 'weapon', 'epic', 56, { dmg: [85, 128], agi: 14, crit: 0.04, lifesteal: 0.05 }, { buy: 105000, sell: 26250 }),
    w_ice_guardian:   IT('w_ice_guardian', '冰封守护者', '🧊', 'weapon', 'epic', 58, { dmg: [84, 122], int: 16, spi: 10, crit: 0.03 }, { buy: 120000, sell: 29000 }),
    /* ===== 中期法系武器补充(31-55 段法杖空档:每 5 级段都有可换的法杖) ===== */
    w_searing_staff:  IT('w_searing_staff', '灼热法杖', '🪄', 'weapon', 'green', 33, { dmg: [24, 36], int: 9, spi: 6 }, { buy: 21000, sell: 5250 }),
    w_brd_staff:      IT('w_brd_staff', '黑铁符文法杖', '🪄', 'weapon', 'blue', 42, { dmg: [34, 48], int: 11, spi: 7, crit: 0.01 }, { buy: 39000, sell: 9750 }),
    w_winter_staff:   IT('w_winter_staff', '严冬法杖', '🪄', 'weapon', 'blue', 53, { dmg: [46, 60], int: 13, spi: 9, crit: 0.01 }, { buy: 66000, sell: 16500 }),
    /* ===== 高阶防具 (18-58) ===== */
    a_stv_cloak:      IT('a_stv_cloak', '丛林披风', '🧣', 'cloak', 'green', 18, { armor: 14, agi: 3 }, { buy: 5600, sell: 2800 }),
    a_stv_helm:       IT('a_stv_helm', '猎头者头盔', '🪖', 'head', 'green', 20, { armor: 30, agi: 4, stam: 2 }, { buy: 8600, sell: 4300 }),
    a_badlands_plate: IT('a_badlands_plate', '荒芜板甲', '🛡️', 'chest', 'green', 26, { armor: 90, str: 5, stam: 4 }, { buy: 12800, sell: 6400 }),
    a_badlands_boots: IT('a_badlands_boots', '熔岩之靴', '🥾', 'boots', 'green', 28, { armor: 26, str: 3, stam: 2 }, { buy: 9400, sell: 4700 }),
    /* ===== 21-30 中期装备补充(丰富换装选择) ===== */
    w_stv_cutlass:    IT('w_stv_cutlass', '荆棘谷弯刀', '🗡️', 'weapon', 'green', 23, { dmg: [33, 50], agi: 5, crit: 0.01 }, { buy: 12500, sell: 6200 }, { setId: 's_stv_hunter' }),
    w_badlands_cleaver: IT('w_badlands_cleaver', '荒芜屠刀', '🪓', 'weapon', 'green', 25, { dmg: [35, 53], str: 5, stam: 4 }, { buy: 13800, sell: 6900 }, { setId: 's_badlands_wall' }),
    w_marsh_bow:      IT('w_marsh_bow', '尘泥长弓', '🏹', 'weapon', 'green', 27, { dmg: [40, 60], agi: 7, crit: 0.01 }, { buy: 15500, sell: 7700 }, { setId: 's_stv_hunter' }),
    w_uld_hammer:     IT('w_uld_hammer', '泰坦战锤', '🔨', 'weapon', 'blue', 30, { dmg: [42, 64], str: 8, stam: 5 }, { buy: 21500, sell: 10700 }, { setId: 's_badlands_wall' }),
    a_stv_chest:      IT('a_stv_chest', '荆棘谷皮甲', '🥋', 'chest', 'blue', 23, { armor: 66, agi: 5, stam: 3 }, { buy: 11600, sell: 5800 }, { setId: 's_stv_hunter' }),
    a_stv_gloves:     IT('a_stv_gloves', '猎手手套', '🧤', 'gloves', 'green', 22, { armor: 18, agi: 3, crit: 0.01 }, { buy: 5200, sell: 2600 }, { setId: 's_stv_hunter' }),
    a_badlands_legs:  IT('a_badlands_legs', '荒芜护腿', '🦵', 'legs', 'blue', 27, { armor: 52, str: 6, stam: 4 }, { buy: 12600, sell: 6300 }, { setId: 's_badlands_wall' }),
    a_badlands_hood:  IT('a_badlands_hood', '荒芜兜帽', '🪖', 'head', 'blue', 29, { armor: 38, int: 6, spi: 4 }, { buy: 13100, sell: 6500 }, { setId: 's_marsh_arcane' }),
    a_marsh_chest:    IT('a_marsh_chest', '尘泥鳞甲', '🛡️', 'chest', 'green', 28, { armor: 96, str: 5, stam: 4 }, { buy: 9100, sell: 4500 }, { setId: 's_badlands_wall' }),
    a_marsh_boots:    IT('a_marsh_boots', '沼泽皮靴', '🥾', 'boots', 'green', 24, { armor: 22, agi: 4, stam: 1 }, { buy: 6100, sell: 3000 }),
    a_marsh_cloak:    IT('a_marsh_cloak', '尘泥斗篷', '🧥', 'cloak', 'blue', 26, { armor: 16, int: 4, spi: 3 }, { buy: 8900, sell: 4400 }, { setId: 's_marsh_arcane' }),
    a_stv_ring:       IT('a_stv_ring', '荆棘谷猎戒', '💍', 'ring', 'blue', 25, { agi: 5, crit: 0.02, stam: 2 }, { buy: 9200, sell: 4600 }, { setId: 's_stv_hunter' }),
    a_badlands_ring:  IT('a_badlands_ring', '荒芜之环', '💍', 'ring', 'green', 27, { stam: 5, str: 2 }, { buy: 6300, sell: 3100 }),
    a_marsh_neck:     IT('a_marsh_neck', '沼泽护符', '📿', 'neck', 'green', 29, { spi: 6, int: 3 }, { buy: 7300, sell: 3600 }, { setId: 's_marsh_arcane' }),
    tr_stv_medallion: IT('tr_stv_medallion', '荆棘谷勇士徽章', '🎖️', 'trinket', 'blue', 26, { str: 5, stam: 4, crit: 0.01 }, { buy: 12100, sell: 6000 }, { setId: 's_badlands_wall' }),
    /* ===== 中期套装补充(法系 build) ===== */
    w_marsh_scepter:  IT('w_marsh_scepter', '尘泥秘法杖', '🪄', 'weapon', 'blue', 28, { dmg: [24, 34], int: 9, spi: 5 }, { buy: 19500, sell: 9700 }, { setId: 's_marsh_arcane' }),
    a_marsh_robes:    IT('a_marsh_robes', '尘泥法袍', '👘', 'chest', 'blue', 27, { armor: 42, int: 8, spi: 5 }, { buy: 12500, sell: 6200 }, { setId: 's_marsh_arcane' }),
    a_marsh_cord_legs: IT('a_marsh_cord_legs', '尘泥魔纹腿', '👖', 'legs', 'green', 26, { armor: 34, int: 6, spi: 4 }, { buy: 8500, sell: 4200 }, { setId: 's_marsh_arcane' }),
    a_searing_mail:   IT('a_searing_mail', '灼热锁甲', '🦺', 'chest', 'green', 34, { armor: 120, str: 6, stam: 5 }, { buy: 19800, sell: 9900 }),
    a_searing_legs:   IT('a_searing_legs', '火鳞护腿', '👖', 'legs', 'green', 36, { armor: 60, stam: 5, str: 3 }, { buy: 16800, sell: 8400 }),
    a_blackrock_plate: IT('a_blackrock_plate', '黑石板甲', '🛡️', 'chest', 'blue', 40, { armor: 150, str: 8, stam: 6 }, { buy: 36000, sell: 18000 }),
    a_blackrock_helm: IT('a_blackrock_helm', '黑铁头盔', '🪖', 'head', 'blue', 42, { armor: 70, str: 6, stam: 4 }, { buy: 29000, sell: 10150 }),
    a_winter_cloak:   IT('a_winter_cloak', '雪鬃披风', '🧣', 'cloak', 'green', 44, { armor: 22, agi: 4, int: 2 }, { buy: 13500, sell: 4690 }),
    a_winter_leather: IT('a_winter_leather', '霜纹皮甲', '🧥', 'chest', 'green', 46, { armor: 100, agi: 6, stam: 4 }, { buy: 26500, sell: 9240 }),
    a_winter_gloves:  IT('a_winter_gloves', '冰霜手套', '🧤', 'gloves', 'green', 48, { armor: 45, int: 6, spi: 3 }, { buy: 14800, sell: 5180 }),
    a_dragonscale:    IT('a_dragonscale', '龙鳞护胸', '🐲', 'chest', 'epic', 50, { armor: 180, str: 10, stam: 8 }, { buy: 78000, sell: 27300 }),
    a_silithus_ring:  IT('a_silithus_ring', '沙漠之环', '💍', 'ring', 'blue', 52, { stam: 8, int: 4 }, { buy: 34000, sell: 8500 }),
    a_silithus_neck:  IT('a_silithus_neck', '守护者坠饰', '📿', 'neck', 'blue', 54, { int: 8, spi: 5 }, { buy: 32000, sell: 8000 }),
    a_plague_cloak:   IT('a_plague_cloak', '瘟疫披风', '🧣', 'cloak', 'blue', 56, { armor: 30, stam: 8, dodge: 0.01 }, { buy: 42000, sell: 10500 }),
    a_emperor_plate:  IT('a_emperor_plate', '帝王板甲', '🛡️', 'chest', 'epic', 58, { armor: 220, str: 12, stam: 10 }, { buy: 95000, sell: 23000 }),
    /* ===== 副本专属装备 (19-60) ===== */
    w_arugal_staff:   IT('w_arugal_staff', '阿鲁高的巫术法杖', '🪄', 'weapon', 'blue', 24, { dmg: [22, 30], int: 7, spi: 5, crit: 0.02 }, { sell: 7800 }),
    a_uld_plate:      IT('a_uld_plate', '阿扎达斯石板甲', '🛡️', 'chest', 'blue', 34, { armor: 110, str: 7, stam: 5 }, { sell: 15000 }),
    a_theradras_crown: IT('a_theradras_crown', '瑟莱德丝的翡翠之冠', '👑', 'head', 'blue', 38, { armor: 78, int: 7, spi: 5, crit: 0.02 }, { sell: 18500 }),
    w_gandling_book:  IT('w_gandling_book', '加丁的黑暗密典', '📖', 'offhand', 'blue', 57, { int: 12, spi: 8, crit: 0.03 }, { sell: 21000 }),
    tr_kelthuzad_heart: IT('tr_kelthuzad_heart', '克尔苏加德的冰霜之心', '❄️', 'trinket', 'epic', 60, { int: 14, spi: 10, crit: 0.03 }, { sell: 26000 }),
    /* ===== 高阶药水 ===== */
    c_great_heal:     IT('c_great_heal', '强效治疗药水', '🧪', 'consumable', 'green', 20, {}, { consumable: { healPct: 0.30 }, buy: 1200, sell: 300 }),
    c_great_mana:     IT('c_great_mana', '强效法力药水', '💧', 'consumable', 'green', 20, {}, { consumable: { manaPct: 0.20 }, buy: 1200, sell: 300 }),
    c_super_heal:     IT('c_super_heal', '超级治疗药水', '🧪', 'consumable', 'blue', 35, {}, { consumable: { healPct: 0.40 }, buy: 3200, sell: 800 }),
    c_super_mana:     IT('c_super_mana', '超级法力药水', '💧', 'consumable', 'blue', 35, {}, { consumable: { manaPct: 0.30 }, buy: 3200, sell: 800 }),
    c_flask:          IT('c_flask', '全能药水', '⚗️', 'consumable', 'epic', 45, {}, { consumable: { healPct: 0.25, manaPct: 0.15 }, buy: 7000, sell: 1800 }),
    c_master_heal:    IT('c_master_heal', '大师治疗药水', '🧪', 'consumable', 'blue', 50, {}, { consumable: { healPct: 0.50 }, buy: 6500, sell: 1600 }),
    c_master_mana:    IT('c_master_mana', '大师法力药水', '💧', 'consumable', 'blue', 50, {}, { consumable: { manaPct: 0.40 }, buy: 6500, sell: 1600 }),
    c_ultimate_heal:  IT('c_ultimate_heal', '终极治疗药水', '🧪', 'consumable', 'blue', 55, {}, { consumable: { healPct: 0.60 }, buy: 10500, sell: 2600 }),
    c_ultimate_mana:  IT('c_ultimate_mana', '终极法力药水', '💧', 'consumable', 'blue', 55, {}, { consumable: { manaPct: 0.55 }, buy: 10500, sell: 2600 }),
    c_eternal_flask:  IT('c_eternal_flask', '永恒圣水', '⚗️', 'consumable', 'epic', 55, {}, { consumable: { healPct: 0.45, manaPct: 0.35 }, buy: 16000, sell: 4000 }),
    /* ===== 战斗增益卷轴(战斗中免费使用,不占回合) ===== */
    s_force:          IT('s_force', '力量卷轴', '📜', 'consumable', 'green', 10, {}, { scroll: { name: '力量祝福', key: 'sc_atk', rounds: 5, buff: { atkPct: 0.2 } }, buy: 400, sell: 80 }),
    s_protect:        IT('s_protect', '保护卷轴', '🛡️', 'consumable', 'green', 12, {}, { scroll: { name: '守护祝福', key: 'sc_armor', rounds: 5, buff: { armorPct: 0.3 } }, buy: 500, sell: 100 }),
    s_crit:           IT('s_crit', '爆击卷轴', '🎯', 'consumable', 'green', 15, {}, { scroll: { name: '精准祝福', key: 'sc_crit', rounds: 5, buff: { critPct: 0.15 } }, buy: 600, sell: 120 }),
    s_swift:          IT('s_swift', '迅捷卷轴', '💨', 'consumable', 'green', 15, {}, { scroll: { name: '疾风祝福', key: 'sc_dodge', rounds: 5, buff: { dodgePct: 0.15 } }, buy: 600, sell: 120 }),
    s_spirit:         IT('s_spirit', '生命卷轴', '❤️', 'consumable', 'green', 12, {}, { scroll: { name: '治愈之光', key: 'sc_heal', healPct: 0.25 }, buy: 500, sell: 100 }),
    s_mana:           IT('s_mana', '法力卷轴', '💧', 'consumable', 'green', 12, {}, { scroll: { name: '魔力涌动', key: 'sc_mana', manaPct: 0.3 }, buy: 500, sell: 100 }),
    /* ===== 紫色/橙色传说装备 (30-60) ===== */
    a_titan_guard:    IT('a_titan_guard', '泰坦守护者', '🏛️', 'chest', 'epic', 36, { armor: 130, str: 8, stam: 7 }, { sell: 20000 }),
    w_verdant_rod:    IT('w_verdant_rod', '翡翠圣杖', '🪄', 'weapon', 'epic', 40, { dmg: [34, 46], int: 11, spi: 8, crit: 0.03 }, { sell: 26000 }),
    a_necropolis_plate: IT('a_necropolis_plate', '天灾板甲', '⚰️', 'chest', 'epic', 57, { armor: 210, str: 11, stam: 9 }, { sell: 34000 }),
    // 等级上限提到 70 后,外域蓝装会把「传说武器必须领先同线非传说 ≥1.2× 引擎战力」挤到临界,
    // 故经典传说武器的伤害/属性随外域版本同步上调(伤害曲线每级涨幅仍 ≤60%,不产生断崖)。
    w_thunderfury:    IT('w_thunderfury', '雷霆之怒', '⚡', 'weapon', 'legendary', 58, { dmg: [136, 200], agi: 42, crit: 0.11, stam: 24 }, { sell: 68000 }),
    w_sulfuras:       IT('w_sulfuras', '萨弗拉斯之锤', '🔨', 'weapon', 'legendary', 59, { dmg: [156, 228], str: 26, crit: 0.05 }, { sell: 70000 }),
    w_ashbringer:     IT('w_ashbringer', '灰烬使者', '🔥', 'weapon', 'legendary', 60, { dmg: [158, 232], str: 24, stam: 14, crit: 0.06, lifesteal: 0.06 }, { sell: 74000 }),
    w_frostmourne:    IT('w_frostmourne', '霜之哀伤', '❄️', 'weapon', 'legendary', 60, { dmg: [164, 236], str: 22, agi: 20, crit: 0.07, lifesteal: 0.08 }, { sell: 88000 }),
    /* 世界首领专属稀有装备 */
    w_kazzak_blade:   IT('w_kazzak_blade', '卡扎克之刃', '🗡️', 'weapon', 'legendary', 60, { dmg: [160, 232], str: 24, stam: 12, crit: 0.05 }, { sell: 72000 }),
    w_atiesh:         IT('w_atiesh', '阿泰丝·守护者之杖', '🔮', 'weapon', 'legendary', 60, { dmg: [122, 180], int: 24, spi: 16, crit: 0.04 }, { sell: 86000 }, { setId: 's_oldgod' }),
    tr_abyssal_signet: IT('tr_abyssal_signet', '深渊徽记', '💀', 'trinket', 'epic', 60, { str: 9, stam: 6, crit: 0.03 }, { sell: 21000 }),
    a_emerald_drake_helm: IT('a_emerald_drake_helm', '翡翠龙鳞之盔', '🐉', 'head', 'epic', 58, { armor: 82, int: 10, spi: 6, crit: 0.02 }, { sell: 19000 }),
    w_azure_staff:    IT('w_azure_staff', '艾萨拉寒冰法杖', '🧊', 'weapon', 'epic', 58, { dmg: [76, 106], int: 15, spi: 11, crit: 0.03 }, { sell: 22500 }),
    /* ===== 传说防具与首饰(橙色不再只是武器:泰坦铸卫 · 物理/敏捷 | 上古低语 · 法系) ===== */
    a_titan_crown:     IT('a_titan_crown', '泰坦守望之冠', '👑', 'head', 'legendary', 60, { armor: 110, str: 13, agi: 11, stam: 11, crit: 0.03 }, { sell: 46000 }, { setId: 's_titan' }),
    a_titan_plate:     IT('a_titan_plate', '泰坦铸卫胸甲', '🛡️', 'chest', 'legendary', 60, { armor: 270, str: 18, agi: 10, stam: 14, crit: 0.02 }, { sell: 52000 }, { setId: 's_titan' }),
    a_titan_gauntlets: IT('a_titan_gauntlets', '泰坦铸卫护手', '🧤', 'gloves', 'legendary', 60, { armor: 150, str: 13, agi: 10, stam: 12 }, { sell: 38000 }, { setId: 's_titan' }),
    a_titan_leggings:  IT('a_titan_leggings', '泰坦铸卫护腿', '👖', 'legs', 'legendary', 60, { armor: 185, str: 13, agi: 9, stam: 11 }, { sell: 42000 }, { setId: 's_titan' }),
    a_titan_boots:     IT('a_titan_boots', '泰坦铸卫长靴', '🥾', 'boots', 'legendary', 60, { armor: 135, str: 10, agi: 8, stam: 11 }, { sell: 34000 }, { setId: 's_titan' }),
    a_titan_cloak:     IT('a_titan_cloak', '泰坦披风', '🧣', 'cloak', 'legendary', 60, { armor: 62, agi: 11, stam: 5, dodge: 0.015 }, { sell: 30000 }, { setId: 's_titan' }),
    a_titan_ring:      IT('a_titan_ring', '泰坦之环', '💍', 'ring', 'legendary', 60, { stam: 14, str: 10, agi: 9, crit: 0.025 }, { sell: 32000 }, { setId: 's_titan' }),
    a_titan_neck:      IT('a_titan_neck', '泰坦守望者坠饰', '📿', 'neck', 'legendary', 60, { stam: 8, str: 6, agi: 6, crit: 0.01 }, { sell: 31000 }, { setId: 's_titan' }),
    w_off_titan_wall:  IT('w_off_titan_wall', '泰坦壁垒', '🛡️', 'offhand', 'legendary', 60, { armor: 36, stam: 13, str: 9, dodge: 0.015 }, { sell: 36000 }, { setId: 's_titan' }),
    a_oldgod_hood:     IT('a_oldgod_hood', '上古低语兜帽', '🪖', 'head', 'legendary', 60, { armor: 96, int: 20, spi: 13, stam: 6, crit: 0.03 }, { sell: 44000 }, { setId: 's_oldgod' }),
    a_oldgod_robe:     IT('a_oldgod_robe', '上古低语法袍', '👘', 'chest', 'legendary', 60, { armor: 180, int: 31, spi: 20, stam: 10, crit: 0.03 }, { sell: 50000 }, { setId: 's_oldgod' }),
    a_oldgod_gloves:   IT('a_oldgod_gloves', '上古低语护手', '🧤', 'gloves', 'legendary', 60, { armor: 126, int: 15, spi: 10, stam: 5, crit: 0.02 }, { sell: 37000 }, { setId: 's_oldgod' }),
    a_oldgod_legs:     IT('a_oldgod_legs', '上古低语护腿', '👖', 'legs', 'legendary', 60, { armor: 196, int: 25, spi: 18, stam: 8, crit: 0.03 }, { sell: 41000 }, { setId: 's_oldgod' }),
    a_oldgod_boots:    IT('a_oldgod_boots', '上古低语之靴', '🥾', 'boots', 'legendary', 60, { armor: 130, int: 14, spi: 10, stam: 5 }, { sell: 33000 }, { setId: 's_oldgod' }),
    /* 60 级高级装备(新区域/新副本) */
    w_doom_cleaver:   IT('w_doom_cleaver', '末日战斧', '🪓', 'weapon', 'blue', 56, { dmg: [74, 106], str: 12, stam: 8, crit: 0.01 }, { buy: 52000, sell: 13000 }),
    w_silithid_stinger: IT('w_silithid_stinger', '其拉毒刺', '🐝', 'weapon', 'blue', 58, { dmg: [76, 108], agi: 11, crit: 0.02 }, { buy: 64000, sell: 16000 }),
    w_necropolis_staff: IT('w_necropolis_staff', '天灾法杖', '🪄', 'weapon', 'blue', 58, { dmg: [58, 82], int: 15, spi: 9 }, { buy: 60000, sell: 15000 }),
    a_blasted_plate:  IT('a_blasted_plate', '诅咒板甲', '⚰️', 'chest', 'blue', 52, { armor: 175, str: 8, stam: 6 }, { buy: 48000, sell: 12000 }),
    a_felwood_robe:   IT('a_felwood_robe', '费伍德法袍', '🧥', 'chest', 'blue', 54, { armor: 120, int: 9, spi: 7 }, { buy: 52000, sell: 13000 }),
    a_silithid_chitin: IT('a_silithid_chitin', '甲虫壳胸甲', '🪲', 'chest', 'blue', 58, { armor: 195, stam: 9, str: 7 }, { buy: 68000, sell: 17000 }),
    a_epl_helm:       IT('a_epl_helm', '天灾颅盔', '💀', 'head', 'blue', 58, { armor: 85, str: 8, stam: 5 }, { buy: 56000, sell: 14000 }),
    tr_blasted_seal:  IT('tr_blasted_seal', '诅咒之印', '🔮', 'trinket', 'blue', 52, { str: 7, stam: 6, crit: 0.01 }, { buy: 40000, sell: 10000 }),
    w_drakkisath_axe: IT('w_drakkisath_axe', '达基萨斯战斧', '🪓', 'weapon', 'epic', 57, { dmg: [86, 118], str: 13, crit: 0.04 }, { sell: 24000 }),
    w_rivendare_blade: IT('w_rivendare_blade', '瑞文戴尔之剑', '🗡️', 'weapon', 'epic', 58, { dmg: [82, 112], str: 11, stam: 7, crit: 0.03 }, { sell: 26000 }),
    w_immolthar_staff: IT('w_immolthar_staff', '伊莫塔尔法杖', '🪄', 'weapon', 'epic', 56, { dmg: [60, 84], int: 14, spi: 8, crit: 0.02 }, { sell: 22000 }),
    a_drakkisath_plate: IT('a_drakkisath_plate', '达基萨斯板甲', '🛡️', 'chest', 'epic', 57, { armor: 205, str: 10, stam: 9, crit: 0.01 }, { sell: 25000 }),
    a_rivendare_helm: IT('a_rivendare_helm', '瑞文戴尔之盔', '🎩', 'head', 'epic', 58, { armor: 95, str: 9, stam: 6 }, { sell: 24000 }),
    tr_immolthar_eye: IT('tr_immolthar_eye', '伊莫塔尔之眼', '👁️', 'trinket', 'epic', 56, { int: 10, spi: 5, crit: 0.03 }, { sell: 21000 }),
    w_ragnaros_hand:  IT('w_ragnaros_hand', '拉格纳罗斯之手', '🔥', 'weapon', 'legendary', 60, { dmg: [162, 234], str: 26, crit: 0.06 }, { sell: 76000 }, { setId: 's_mc' }),
    w_nefarian_blade: IT('w_nefarian_blade', '奈法利安之刃', '🦇', 'weapon', 'legendary', 60, { dmg: [168, 242], agi: 30, crit: 0.08 }, { sell: 74000 }, { setId: 's_bwl' }),
    a_onyxia_scale:   IT('a_onyxia_scale', '奥妮克希亚鳞甲', '🐲', 'chest', 'epic', 60, { armor: 230, str: 13, stam: 10, crit: 0.01 }, { sell: 31000 }, { setId: 's_onyx' }),
    tr_hakkar_heart:  IT('tr_hakkar_heart', '哈卡之心', '❤️', 'trinket', 'epic', 60, { stam: 12, crit: 0.03 }, { sell: 29000 }, { setId: 's_zg' }),
    a_cthun_armor:    IT('a_cthun_armor', '克苏恩之躯', '🫀', 'chest', 'epic', 60, { armor: 225, int: 14, spi: 8 }, { sell: 34000 }),
    tr_cthun_eye:     IT('tr_cthun_eye', '克苏恩之眼', '👁️', 'trinket', 'legendary', 60, { int: 28, spi: 20, crit: 0.1 }, { sell: 60000 }, { setId: 's_aq' }),

    /* ===== 深入敌营 · 限定装备(敌方主城突袭奖励) ===== */
    w_royal_blade:    IT('w_royal_blade', '皇家裁决之剑', '⚔️', 'weapon', 'epic', 42, { dmg: [58, 86], str: 9, crit: 0.03 }, { sell: 19000 }),
    a_royal_plate:    IT('a_royal_plate', '皇家卫队胸甲', '🛡️', 'chest', 'epic', 42, { armor: 168, str: 10, stam: 8 }, { sell: 15000 }),
    tr_royal_signet:  IT('tr_royal_signet', '暴风城皇家徽记', '🏅', 'trinket', 'epic', 42, { int: 8, spi: 6, crit: 0.02 }, { sell: 12000 }),
    w_warchief_axe:   IT('w_warchief_axe', '大酋长战斧', '🪓', 'weapon', 'epic', 42, { dmg: [58, 86], str: 10, crit: 0.02 }, { sell: 19000 }),
    a_warchief_plate: IT('a_warchief_plate', '大酋长战甲', '🛡️', 'chest', 'epic', 42, { armor: 172, str: 11, stam: 7 }, { sell: 15000 }),
    tr_warchief_totem: IT('tr_warchief_totem', '大酋长战旗', '🚩', 'trinket', 'epic', 42, { agi: 8, stam: 6, crit: 0.02 }, { sell: 12000 }),

    /* ===== 套装装备(T1-T4) ===== */
    a_mc_crown:       IT('a_mc_crown', '熔火领主之冠', '👑', 'head', 'epic', 60, { armor: 92, str: 9, stam: 7, crit: 0.02 }, { sell: 26000 }, { setId: 's_mc' }),
    a_mc_plate:       IT('a_mc_plate', '熔火之心胸甲', '🛡️', 'chest', 'epic', 60, { armor: 245, str: 13, stam: 10 }, { sell: 32000 }, { setId: 's_mc' }),
    a_mc_gauntlets:   IT('a_mc_gauntlets', '熔火之拳', '🧤', 'gloves', 'epic', 60, { armor: 132, str: 8, agi: 6, stam: 5 }, { sell: 21500 }, { setId: 's_mc' }),
    a_mc_leggings:    IT('a_mc_leggings', '熔火护腿', '👖', 'legs', 'epic', 60, { armor: 168, str: 10, stam: 8, crit: 0.01 }, { sell: 23500 }, { setId: 's_mc' }),
    a_mc_boots:       IT('a_mc_boots', '熔火长靴', '🥾', 'boots', 'epic', 60, { armor: 118, stam: 7, int: 5, spi: 4 }, { sell: 19500 }, { setId: 's_mc' }),
    a_bwl_crown:      IT('a_bwl_crown', '黑翼王冠', '👑', 'head', 'epic', 60, { armor: 96, agi: 10, stam: 7, crit: 0.02 }, { sell: 28000 }, { setId: 's_bwl' }),
    a_bwl_plate:      IT('a_bwl_plate', '黑翼板甲', '🛡️', 'chest', 'epic', 60, { armor: 250, agi: 9, str: 9, stam: 8 }, { sell: 33000 }, { setId: 's_bwl' }),
    a_bwl_gauntlets:  IT('a_bwl_gauntlets', '黑翼护手', '🧤', 'gloves', 'epic', 60, { armor: 136, agi: 12, stam: 7, crit: 0.02 }, { sell: 22500 }, { setId: 's_bwl' }),
    a_bwl_leggings:   IT('a_bwl_leggings', '黑翼护腿', '👖', 'legs', 'epic', 60, { armor: 172, agi: 9, stam: 7 }, { sell: 24500 }, { setId: 's_bwl' }),
    a_bwl_boots:      IT('a_bwl_boots', '黑翼长靴', '🥾', 'boots', 'epic', 60, { armor: 122, agi: 7, stam: 5 }, { sell: 20500 }, { setId: 's_bwl' }),
    a_onyx_crown:     IT('a_onyx_crown', '奥妮克希亚之冠', '👑', 'head', 'epic', 60, { armor: 98, str: 10, stam: 8, crit: 0.01 }, { sell: 29000 }, { setId: 's_onyx' }),
    a_onyx_gauntlets: IT('a_onyx_gauntlets', '奥妮克希亚护手', '🧤', 'gloves', 'epic', 60, { armor: 138, str: 9, stam: 6 }, { sell: 23000 }, { setId: 's_onyx' }),
    a_onyx_leggings:  IT('a_onyx_leggings', '奥妮克希亚护腿', '👖', 'legs', 'epic', 60, { armor: 174, str: 11, stam: 9 }, { sell: 25000 }, { setId: 's_onyx' }),
    a_onyx_boots:     IT('a_onyx_boots', '奥妮克希亚战靴', '🥾', 'boots', 'epic', 60, { armor: 124, stam: 9, crit: 0.02 }, { sell: 21000 }, { setId: 's_onyx' }),
    a_onyx_cloak:     IT('a_onyx_cloak', '黑龙披风', '🧣', 'cloak', 'epic', 60, { armor: 58, dodge: 0.02, stam: 6 }, { sell: 19000 }, { setId: 's_onyx' }),
    a_zg_hood:        IT('a_zg_hood', '赞达拉之颅', '🪖', 'head', 'epic', 60, { armor: 90, int: 12, spi: 8, crit: 0.02 }, { sell: 26500 }, { setId: 's_zg' }),
    a_zg_robes:       IT('a_zg_robes', '赞达拉法袍', '👘', 'chest', 'epic', 60, { armor: 150, int: 14, spi: 9 }, { sell: 30000 }, { setId: 's_zg' }),
    a_zg_gloves:      IT('a_zg_gloves', '赞达拉护手', '🧤', 'gloves', 'epic', 60, { armor: 120, int: 9, spi: 6 }, { sell: 22000 }, { setId: 's_zg' }),
    a_zg_boots:       IT('a_zg_boots', '赞达拉之靴', '🥾', 'boots', 'epic', 60, { armor: 116, int: 8, stam: 6 }, { sell: 20000 }, { setId: 's_zg' }),
    a_aq_helm:        IT('a_aq_helm', '安其拉守护者之盔', '⛑️', 'head', 'epic', 60, { armor: 100, stam: 10, int: 8, spi: 6 }, { sell: 28500 }, { setId: 's_aq' }),
    a_aq_plate:       IT('a_aq_plate', '安其拉神谕胸甲', '🛡️', 'chest', 'epic', 60, { armor: 255, stam: 12, int: 9 }, { sell: 34000 }, { setId: 's_aq' }),
    a_aq_gauntlets:   IT('a_aq_gauntlets', '安其拉之爪', '🧤', 'gloves', 'epic', 60, { armor: 140, stam: 8, int: 6, crit: 0.01 }, { sell: 23000 }, { setId: 's_aq' }),
    a_aq_leggings:    IT('a_aq_leggings', '安其拉护腿', '👖', 'legs', 'epic', 60, { armor: 176, stam: 10, int: 8 }, { sell: 25500 }, { setId: 's_aq' }),
    a_aq_boots:       IT('a_aq_boots', '安其拉远征靴', '🥾', 'boots', 'epic', 60, { armor: 126, stam: 8, spi: 5 }, { sell: 21500 }, { setId: 's_aq' }),
    /* ===== 新增 8 副本 Boss 掉落 ===== */
    w_rfc_ritual_dagger: IT('w_rfc_ritual_dagger', '怒焰仪式之刃', '🔪', 'weapon', 'green', 16, { dmg: [26, 38], agi: 4, stam: 2 }, { sell: 3200 }),
    w_skd_shiv:         IT('w_skd_shiv', '暗巷刺刀', '🗡️', 'weapon', 'blue', 26, { dmg: [36, 54], agi: 6, crit: 0.02 }, { sell: 6800 }),
    a_bfd_coral:        IT('a_bfd_coral', '深渊珊瑚护符', '📿', 'neck', 'blue', 26, { int: 5, spi: 4, stam: 2 }, { sell: 5600 }),
    w_gno_blast_gun:    IT('w_gno_blast_gun', '辐射光枪', '🔫', 'weapon', 'epic', 30, { dmg: [44, 66], agi: 8, crit: 0.03 }, { sell: 11000 }),
    w_rfk_razor_axe:    IT('w_rfk_razor_axe', '剃刀战斧', '🪓', 'weapon', 'epic', 31, { dmg: [46, 68], str: 9, stam: 4 }, { sell: 11500 }),
    w_rfd_cold_blade:   IT('w_rfd_cold_blade', '寒霜之刃', '❄️', 'weapon', 'epic', 40, { dmg: [60, 88], agi: 10, crit: 0.03, stam: 4 }, { sell: 16000 }),
    a_sm_scarlet_robe:  IT('a_sm_scarlet_robe', '血色圣袍', '🥋', 'chest', 'epic', 41, { armor: 132, int: 12, spi: 7, stam: 5 }, { sell: 11550 }),
    w_st_temple_blade:  IT('w_st_temple_blade', '哈卡莱战刃', '🗡️', 'weapon', 'epic', 51, { dmg: [76, 112], str: 12, agi: 6, crit: 0.02 }, { sell: 11500 }),

    a_padded_legs: IT('a_padded_legs', '棉布护腿', '👖', 'legs', 'white', 4, { armor: 10, stam: 1 }, { buy: 600 }),
    a_raptor_gloves: IT('a_raptor_gloves', '迅猛龙皮手套', '🧤', 'gloves', 'green', 16, { armor: 16, agi: 3, stam: 1 }, { buy: 4800 }),
    a_bronze_neck: IT('a_bronze_neck', '铜纹项链', '📿', 'neck', 'green', 18, { str: 3, stam: 2 }, { buy: 5200 }),
    a_badlands_gloves: IT('a_badlands_gloves', '荒原皮手套', '🧤', 'gloves', 'green', 24, { armor: 20, str: 3, stam: 2 }, { buy: 8200 }),
    a_badlands_cloak: IT('a_badlands_cloak', '荒原斗篷', '🧥', 'cloak', 'green', 24, { armor: 14, agi: 3, stam: 1 }, { buy: 7800 }),
    a_badlands_helm: IT('a_badlands_helm', '荒原战盔', '🪖', 'head', 'green', 26, { armor: 34, str: 4, stam: 2 }, { buy: 8800 }),
    a_marsh_legs: IT('a_marsh_legs', '沼泽护腿', '👖', 'legs', 'green', 26, { armor: 40, stam: 4, str: 2 }, { buy: 9200 }),
    a_marsh_ring: IT('a_marsh_ring', '沼泽之戒', '💍', 'ring', 'green', 28, { stam: 4, int: 2 }, { buy: 9600 }),
    a_burning_boots: IT('a_burning_boots', '熔岩战靴', '👢', 'boots', 'blue', 34, { armor: 40, agi: 5, stam: 3 }, { buy: 18000 }),
    a_burning_cloak: IT('a_burning_cloak', '灼热披风', '🧥', 'cloak', 'blue', 34, { armor: 18, int: 5, spi: 3 }, { buy: 17500 }),
    a_desert_ring: IT('a_desert_ring', '沙漠之戒', '💍', 'ring', 'blue', 36, { crit: 0.02, stam: 5, agi: 3 }, { buy: 19800 }),
    a_burning_gloves: IT('a_burning_gloves', '灼热链甲手套', '🧤', 'gloves', 'blue', 36, { armor: 44, str: 6, stam: 3 }, { buy: 19600 }),
    a_desert_neck: IT('a_desert_neck', '沙漠护符', '📿', 'neck', 'blue', 38, { int: 6, spi: 4, stam: 2 }, { buy: 20500 }),
    a_winter_boots: IT('a_winter_boots', '冬泉长靴', '👢', 'boots', 'green', 44, { armor: 30, stam: 5, agi: 3 }, { buy: 14200 }),
    a_blasted_neck: IT('a_blasted_neck', '诅咒之地项圈', '📿', 'neck', 'blue', 46, { agi: 6, crit: 0.02, stam: 3 }, { buy: 30000 }),
    a_blasted_legs: IT('a_blasted_legs', '诅咒护腿', '👖', 'legs', 'blue', 48, { armor: 80, str: 8, stam: 5 }, { buy: 32000 }),
    a_blasted_ring: IT('a_blasted_ring', '诅咒之戒', '💍', 'ring', 'blue', 48, { str: 6, agi: 4, stam: 3 }, { buy: 31000 }),
    w_off_dagger: IT('w_off_dagger', '猎手短刃', '🔪', 'offhand', 'green', 12, { agi: 3, stam: 1 }, { buy: 3400 }),
    w_off_hide_shield: IT('w_off_hide_shield', '兽皮圆盾', '🛡️', 'offhand', 'green', 16, { armor: 12, stam: 3 }, { buy: 5200 }),
    w_off_iron_shield: IT('w_off_iron_shield', '铁盾', '🛡️', 'offhand', 'green', 22, { armor: 16, stam: 4, str: 2 }, { buy: 8600 }),
    w_off_razor_shiv: IT('w_off_razor_shiv', '剃刀副刃', '🔪', 'offhand', 'blue', 28, { agi: 6, crit: 0.02 }, { buy: 12500 }),
    w_off_moon_totem: IT('w_off_moon_totem', '月神圣物', '🌙', 'offhand', 'blue', 34, { int: 5, spi: 3, stam: 2 }, { buy: 18500 }),
    w_off_mithril_shield: IT('w_off_mithril_shield', '秘银壁垒', '🛡️', 'offhand', 'blue', 38, { armor: 22, stam: 6, str: 3 }, { buy: 22500 }),
    w_off_sun_totem: IT('w_off_sun_totem', '日神圣物', '☀️', 'offhand', 'blue', 44, { int: 7, spi: 4, crit: 0.02 }, { buy: 28500 }),
    w_off_dark_guard: IT('w_off_dark_guard', '暗影守卫', '🛡️', 'offhand', 'blue', 50, { armor: 26, stam: 8, dodge: 0.01 }, { buy: 42000 }),
    w_off_dragon_shield: IT('w_off_dragon_shield', '龙鳞守卫', '🐉', 'offhand', 'epic', 56, { armor: 30, stam: 10, str: 6 }, { buy: 65000 }),
  };

  /* ============ 装备套装(T1-T4) ============ */
  // stats: 属性类加成(直接并入角色属性) / crit,dodge,lifesteal: 战斗修正 / dmg: 附加武器伤害 / hp: 生命上限
  D.SETS = {
    s_mc: {
      id: 's_mc', name: '熔火之魂 (T1)', source: '熔火之心', icon: '🔥', pieces: ['w_ragnaros_hand', 'a_mc_crown', 'a_mc_plate', 'a_mc_gauntlets', 'a_mc_leggings', 'a_mc_boots'],
      bonuses: [
        { need: 2, text: '攻击力 +6%', stats: { atkPct: 0.06 } },
        { need: 4, text: '暴击 +3% · 攻击吸血 5%', stats: { crit: 0.03, lifesteal: 0.05 } },
      ],
    },
    s_bwl: {
      id: 's_bwl', name: '黑翼统御 (T2)', source: '黑翼之巢', icon: '🦇', pieces: ['w_nefarian_blade', 'a_bwl_crown', 'a_bwl_plate', 'a_bwl_gauntlets', 'a_bwl_leggings', 'a_bwl_boots'],
      bonuses: [
        { need: 2, text: '敏捷 +15 · 攻击力 +4%', stats: { agi: 15, atkPct: 0.04 } },
        { need: 4, text: '暴击 +4% · 闪避 +2% · 吸血 4%', stats: { crit: 0.04, dodge: 0.02, lifesteal: 0.04 } },
      ],
    },
    s_onyx: {
      id: 's_onyx', name: '龙王威仪', source: '奥妮克希亚的巢穴', icon: '🐉', pieces: ['a_onyxia_scale', 'a_onyx_crown', 'a_onyx_gauntlets', 'a_onyx_leggings', 'a_onyx_boots', 'a_onyx_cloak'],
      bonuses: [
        { need: 2, text: '耐力 +20 · 生命上限 +250', stats: { stam: 20, hp: 250 } },
        { need: 4, text: '护甲 +10% · 受到伤害 -5%', stats: { armorPct: 0.10, dmgTaken: 0.05 } },
      ],
    },
    s_zg: {
      id: 's_zg', name: '赞达拉预兆', source: '祖尔格拉布', icon: '🪔', pieces: ['tr_hakkar_heart', 'a_zg_hood', 'a_zg_robes', 'a_zg_gloves', 'a_zg_boots'],
      bonuses: [
        { need: 2, text: '智力 +15 · 法术强度 +10%', stats: { int: 15, spellPowerPct: 0.10 } },
        { need: 4, text: '暴击 +3% · 治疗量 +8%', stats: { crit: 0.03, healPct: 0.08 } },
      ],
    },
    s_aq: {
      id: 's_aq', name: '安其拉神谕 (T3)', source: '安其拉神殿/废墟', icon: '🐛', pieces: ['tr_cthun_eye', 'a_aq_helm', 'a_aq_plate', 'a_aq_gauntlets', 'a_aq_leggings', 'a_aq_boots'],
      bonuses: [
        { need: 2, text: '全属性 +10 · 生命上限 +300', stats: { str: 10, agi: 10, stam: 10, int: 10, spi: 10, hp: 300 } },
        { need: 4, text: '暴击 +3% · 吸血 5% · 治疗效果 +6%', stats: { crit: 0.03, lifesteal: 0.05, healPct: 0.06 } },
      ],
    },
    /* ===== 中期套装(21-30 段,2/3 件激活,对应三系 build) ===== */
    /* ===== 传说套装(60 级终局:23 件传说自成一档,2/4 件激活) ===== */
    s_titan: {
      id: 's_titan', name: '泰坦铸卫 (传说)', source: '熔火之心 / 黑翼之巢 / 奥妮克希亚的巢穴 / 祖尔格拉布 / 安其拉神殿 / 纳克萨玛斯 / 世界首领', icon: '🏛️', pieces: ['a_titan_crown', 'a_titan_plate', 'a_titan_gauntlets', 'a_titan_leggings', 'a_titan_boots', 'a_titan_cloak', 'a_titan_ring', 'a_titan_neck', 'w_off_titan_wall'],
      bonuses: [
        { need: 2, text: '全属性 +12 · 生命上限 +200', stats: { str: 12, agi: 12, stam: 12, int: 12, spi: 12, hp: 200 } },
        { need: 4, text: '攻击力 +8% · 暴击 +4% · 吸血 5% · 受到伤害 -5%', stats: { atkPct: 0.08, crit: 0.04, lifesteal: 0.05, dmgTaken: 0.05 } },
      ],
    },
    s_oldgod: {
      id: 's_oldgod', name: '上古低语 (传说)', source: '安其拉神殿 / 纳克萨玛斯 / 世界首领', icon: '🐛', pieces: ['w_atiesh', 'a_oldgod_hood', 'a_oldgod_robe', 'a_oldgod_gloves', 'a_oldgod_legs', 'a_oldgod_boots'],
      bonuses: [
        { need: 2, text: '智力 +20 · 法术强度 +12%', stats: { int: 20, spellPowerPct: 0.12 } },
        { need: 4, text: '暴击 +4% · 治疗量 +10% · 吸血 4%', stats: { crit: 0.04, healPct: 0.10, lifesteal: 0.04 } },
      ],
    },
    s_stv_hunter: {
      id: 's_stv_hunter', name: '荆棘谷猎手', source: '荆棘谷', icon: '🐆', pieces: ['w_stv_cutlass', 'w_marsh_bow', 'a_stv_chest', 'a_stv_gloves', 'a_stv_ring'],
      bonuses: [
        { need: 2, text: '敏捷 +10 · 暴击 +1.5%', stats: { agi: 10, crit: 0.015 } },
        { need: 3, text: '攻击力 +5% · 闪避 +2%', stats: { atkPct: 0.05, dodge: 0.02 } },
      ],
    },
    s_badlands_wall: {
      id: 's_badlands_wall', name: '荒原壁垒', source: '荒芜之地', icon: '🛡️', pieces: ['w_badlands_cleaver', 'w_uld_hammer', 'a_badlands_legs', 'a_marsh_chest', 'tr_stv_medallion'],
      bonuses: [
        { need: 2, text: '力量 +12 · 耐力 +8', stats: { str: 12, stam: 8 } },
        { need: 3, text: '护甲 +6% · 生命上限 +150', stats: { armorPct: 0.06, hp: 150 } },
      ],
    },
    s_marsh_arcane: {
      id: 's_marsh_arcane', name: '尘泥秘法', source: '尘泥沼泽', icon: '🔮', pieces: ['w_marsh_scepter', 'a_badlands_hood', 'a_marsh_robes', 'a_marsh_cord_legs', 'a_marsh_cloak', 'a_marsh_neck'],
      bonuses: [
        { need: 2, text: '智力 +12 · 法术强度 +8%', stats: { int: 12, spellPowerPct: 0.08 } },
        { need: 3, text: '暴击 +2% · 治疗量 +6%', stats: { crit: 0.02, healPct: 0.06 } },
      ],
    },
  };

  /* ============ 装备附魔表 ============ */
  // mod: dmg=武器附加伤害 / armor=护甲 / 五维属性 / crit=暴击 / dodge=闪避 / hp=生命上限 / lifesteal=攻击吸血比例
  D.ENCHANTS = {
    e_flame:     { id: 'e_flame', name: '灼热武器', icon: '🔥', slots: ['weapon', 'offhand'], desc: '武器附加 4 点火焰伤害', gold: 300, mats: { m_dust: 2 }, mod: { dmg: 4 } },
    e_frost:     { id: 'e_frost', name: '寒冰武器', icon: '❄️', slots: ['weapon', 'offhand'], desc: '武器附加 3 点伤害与 2 点耐力', gold: 300, mats: { m_dust: 2 }, mod: { dmg: 3, stam: 2 } },
    e_lifesteal: { id: 'e_lifesteal', name: '生命偷取', icon: '🩸', slots: ['weapon', 'offhand'], desc: '攻击造成伤害的 8% 转化为生命', gold: 600, mats: { m_essence: 1 }, mod: { lifesteal: 0.08 } },
    e_crusader:  { id: 'e_crusader', name: '十字军', icon: '⚜️', slots: ['weapon', 'offhand'], desc: '力量 +5，攻击附加 2 点神圣伤害', gold: 900, mats: { m_essence: 2 }, mod: { dmg: 2, str: 5 } },
    e_vitality:  { id: 'e_vitality', name: '强效生命', icon: '❤️', slots: ['head', 'chest', 'gloves', 'legs', 'boots', 'cloak'], desc: '生命上限 +80', gold: 400, mats: { m_dust: 3 }, mod: { hp: 80 } },
    e_defense:   { id: 'e_defense', name: '防护', icon: '🛡️', slots: ['head', 'chest', 'gloves', 'legs', 'boots', 'cloak'], desc: '护甲 +20', gold: 500, mats: { m_essence: 1 }, mod: { armor: 20 } },
    e_hearty:    { id: 'e_hearty', name: '健硕', icon: '💪', slots: ['head', 'chest', 'gloves', 'legs', 'boots', 'cloak'], desc: '全属性 +2', gold: 600, mats: { m_essence: 2 }, mod: { str: 2, agi: 2, stam: 2, int: 2, spi: 2 } },
    e_agility:   { id: 'e_agility', name: '灵巧', icon: '🦵', slots: ['boots', 'cloak'], desc: '敏捷 +4，闪避 +1%', gold: 450, mats: { m_dust: 2 }, mod: { agi: 4, dodge: 0.01 } },
    e_wisdom:    { id: 'e_wisdom', name: '智慧', icon: '🧠', slots: ['neck', 'ring1', 'ring2', 'offhand', 'trinket1', 'trinket2'], desc: '智力 +4，精神 +2', gold: 450, mats: { m_dust: 2 }, mod: { int: 4, spi: 2 } },
    e_might:     { id: 'e_might', name: '强袭', icon: '⚔️', slots: ['neck', 'ring1', 'ring2', 'trinket1', 'trinket2'], desc: '力量 +4，耐力 +2', gold: 450, mats: { m_dust: 2 }, mod: { str: 4, stam: 2 } },
    e_keen:      { id: 'e_keen', name: '敏锐', icon: '🎯', slots: ['trinket1', 'trinket2'], desc: '暴击率提高 2%', gold: 800, mats: { m_essence: 2 }, mod: { crit: 0.02 } },
    /* 高级附魔(60 级) */
    e_flametongue: { id: 'e_flametongue', name: '烈焰武器', icon: '🔥', slots: ['weapon', 'offhand'], desc: '武器附加 6 点伤害与 3 点智力', gold: 1200, mats: { m_essence: 2 }, mod: { dmg: 6, int: 3 } },
    e_frostbrand: { id: 'e_frostbrand', name: '冰霜之刃', icon: '❄️', slots: ['weapon', 'offhand'], desc: '武器附加 5 点伤害与 3 点敏捷', gold: 1200, mats: { m_essence: 2 }, mod: { dmg: 5, agi: 3 } },
    e_wrath:     { id: 'e_wrath', name: '怒火', icon: '😡', slots: ['weapon', 'offhand'], desc: '武器附加 8 点伤害与 4% 吸血', gold: 2200, mats: { m_crystal: 2 }, mod: { dmg: 8, lifesteal: 0.04 } },
    e_major_might: { id: 'e_major_might', name: '力量雕文', icon: '🦾', slots: ['neck', 'ring1', 'ring2', 'trinket1', 'trinket2'], desc: '力量 +7', gold: 1100, mats: { m_essence: 2 }, mod: { str: 7 } },
    e_major_wisdom: { id: 'e_major_wisdom', name: '智慧雕文', icon: '🧠', slots: ['neck', 'ring1', 'ring2', 'offhand', 'trinket1', 'trinket2'], desc: '智力 +7', gold: 1100, mats: { m_essence: 2 }, mod: { int: 7 } },
    e_major_vitality: { id: 'e_major_vitality', name: '强效生命II', icon: '❤️', slots: ['head', 'chest', 'gloves', 'legs', 'boots', 'cloak'], desc: '生命上限 +150', gold: 1200, mats: { m_essence: 2 }, mod: { hp: 150 } },
    e_major_defense: { id: 'e_major_defense', name: '钢铁壁垒', icon: '🛡️', slots: ['head', 'chest', 'gloves', 'legs', 'boots', 'cloak'], desc: '护甲 +45', gold: 1300, mats: { m_essence: 2 }, mod: { armor: 45 } },
    e_critical:  { id: 'e_critical', name: '致命一击', icon: '💥', slots: ['ring1', 'ring2', 'trinket1', 'trinket2'], desc: '暴击率提高 3%', gold: 2000, mats: { m_crystal: 1 }, mod: { crit: 0.03 } },
  };

  /* ============ 材料合成 ============ */
  // 低级材料向上合成:5 粉尘 → 1 精华;5 精华 → 1 水晶
  D.SYNTH = {
    m_essence: { from: 'm_dust', n: 5, gold: 100, desc: '奥术粉尘 ×5 → 梦境精华 ×1' },
    m_crystal: { from: 'm_essence', n: 5, gold: 400, desc: '梦境精华 ×5 → 奥术水晶 ×1' },
  };

  /* ============ 装备打造配方 ============ */
  // 消耗材料与金币直接制作装备(材料消耗的出口,配合分解/合成形成闭环)
  D.CRAFTS = {
    craft_doom:      { id: 'craft_doom', name: '末日战斧', icon: '🪓', item: 'w_doom_cleaver', mats: { m_dust: 10, m_essence: 3 }, gold: 6000 },
    craft_stinger:   { id: 'craft_stinger', name: '其拉毒刺', icon: '🐝', item: 'w_silithid_stinger', mats: { m_essence: 5, m_crystal: 1 }, gold: 9500 },
    craft_necrostaff: { id: 'craft_necrostaff', name: '天灾法杖', icon: '🪄', item: 'w_necropolis_staff', mats: { m_essence: 5, m_crystal: 1 }, gold: 9000 },
    craft_plate:     { id: 'craft_plate', name: '诅咒板甲', icon: '⚰️', item: 'a_blasted_plate', mats: { m_dust: 10, m_essence: 3 }, gold: 5500 },
    craft_robe:      { id: 'craft_robe', name: '费伍德法袍', icon: '🧥', item: 'a_felwood_robe', mats: { m_dust: 10, m_essence: 3 }, gold: 6000 },
    craft_chitin:    { id: 'craft_chitin', name: '甲虫壳胸甲', icon: '🪲', item: 'a_silithid_chitin', mats: { m_essence: 5, m_crystal: 1 }, gold: 10000 },
    craft_helm:      { id: 'craft_helm', name: '天灾颅盔', icon: '💀', item: 'a_epl_helm', mats: { m_essence: 4, m_crystal: 1 }, gold: 8500 },
    craft_seal:      { id: 'craft_seal', name: '诅咒之印', icon: '🔮', item: 'tr_blasted_seal', mats: { m_dust: 8, m_essence: 3 }, gold: 5000 },
    craft_drakkisath: { id: 'craft_drakkisath', name: '达基萨斯战斧', icon: '🪓', item: 'w_drakkisath_axe', mats: { m_essence: 8, m_crystal: 3 }, gold: 18000 },
    craft_rivendare: { id: 'craft_rivendare', name: '瑞文戴尔之剑', icon: '🗡️', item: 'w_rivendare_blade', mats: { m_essence: 8, m_crystal: 3 }, gold: 20000 },
  };

  /* ============ 成就系统 ============ */
  // cat: dungeon=副本 / boss=首领 / forge=锻造 / combat=战斗 / level=等级 / set=套装
  // target+count: 判定条件(次数/特定id); reward: {gold, exp, items[]} 解锁时自动发放
  D.ACHIEVEMENTS = {
    ach_dungeon_1:  { id: 'ach_dungeon_1', name: '初次试炼', icon: '⛩️', cat: 'dungeon', type: 'dungeon', desc: '通关任意一个 5 人副本', count: 1, reward: { gold: 5000, exp: 5000, items: ['c_vital', 'm_dust'] } },
    ach_dungeon_all: { id: 'ach_dungeon_all', name: '副本征服者', icon: '🏰', cat: 'dungeon', type: 'dungeon', desc: '通关全部 50 个副本', count: 50, reward: { gold: 50000, exp: 50000, items: ['tr_abyss_eye', 'm_crystal'] } },
    ach_elite_1:    { id: 'ach_elite_1', name: '精英猎手', icon: '👑', cat: 'boss', type: 'elite', desc: '首次击杀稀有精英', count: 1, reward: { gold: 3000, exp: 3000, items: ['m_essence'] } },
    ach_elite_10:   { id: 'ach_elite_10', name: '精英克星', icon: '💀', cat: 'boss', type: 'elite', desc: '击杀 10 名稀有精英', count: 10, reward: { gold: 12000, exp: 12000, items: ['m_crystal'] } },
    ach_wboss_1:    { id: 'ach_wboss_1', name: '世界之敌', icon: '🌍', cat: 'boss', type: 'worldboss', target: 'kazzak', desc: '击败卡扎克', count: 1, reward: { gold: 15000, exp: 15000, items: ['a_onyxia_scale', 'm_crystal'] } },
    ach_wboss_2:    { id: 'ach_wboss_2', name: '屠龙者', icon: '🐉', cat: 'boss', type: 'worldboss', desc: '击败卡扎克与艾萨拉绿龙', count: 2, reward: { gold: 40000, exp: 40000, items: ['w_thunderfury', 'm_crystal'] } },
    ach_forge_10:   { id: 'ach_forge_10', name: '锻造大师', icon: '🔨', cat: 'forge', type: 'forge10', desc: '将任意装备强化至 +10', count: 1, reward: { gold: 10000, exp: 10000, items: ['m_essence'] } },
    ach_forge_15:   { id: 'ach_forge_15', name: '完美锻造', icon: '⚒️', cat: 'forge', type: 'forge15', desc: '将任意装备强化至满级 +15', count: 1, reward: { gold: 30000, exp: 30000, items: ['w_ashbringer', 'm_crystal'] } },
    ach_enchant_1:  { id: 'ach_enchant_1', name: '初识附魔', icon: '✨', cat: 'forge', type: 'enchant', desc: '首次为装备附魔', count: 1, reward: { gold: 2000, exp: 2000, items: ['m_dust'] } },
    ach_craft_1:    { id: 'ach_craft_1', name: '工匠精神', icon: '🛠️', cat: 'forge', type: 'craft', desc: '通过打造制作一件装备', count: 1, reward: { gold: 3000, exp: 3000, items: ['m_essence'] } },
    ach_kill_100:   { id: 'ach_kill_100', name: '百人斩', icon: '⚔️', cat: 'combat', type: 'kill', desc: '累计击杀 100 个怪物', count: 100, reward: { gold: 8000, exp: 8000, items: ['c_vital', 'm_dust'] } },
    ach_level_60:   { id: 'ach_level_60', name: '满级传说', icon: '🚀', cat: 'level', desc: '角色达到 60 级', count: 60, reward: { gold: 50000, exp: 0, items: ['tr_abyssal_signet', 'm_crystal'] } },
    ach_set_4:      { id: 'ach_set_4', name: '套装收集者', icon: '👑', cat: 'set', desc: '同时装备 4 件套装', count: 4, reward: { gold: 20000, exp: 20000, items: ['m_crystal'] } },
    /* ===== 橙色传说相关成就(cond 由 character.js checkSpecial 判定) ===== */
    ach_legend_1:   { id: 'ach_legend_1', name: '传说初临', icon: '🟠', cat: 'set', cond: 'legend', desc: '获得任意一件橙色传说装备', count: 1, reward: { gold: 20000, exp: 20000, items: ['m_crystal'] } },
    ach_set_legend: { id: 'ach_set_legend', name: '登峰造极', icon: '🏛️', cat: 'set', cond: 'legendset', desc: '同时装备 4 件传说套装（泰坦铸卫 / 上古低语）', count: 4, reward: { gold: 60000, exp: 60000, items: ['a_titan_ring', 'm_crystal'] } },
    ach_codex_all:  { id: 'ach_codex_all', name: '群首猎尽', icon: '👹', cat: 'boss', cond: 'codex', desc: '击败首领图鉴中的全部首领', count: 1, reward: { gold: 80000, exp: 80000, items: ['a_oldgod_boots', 'm_crystal'] } },
  };
  // 26 座副本通关成就(数据驱动生成:每副本一项,带 target 供直达入口;奖励随副本等级分档)
  (function () {
    const names = {
      wailing_caverns: '哀嚎的回响', ragefire_chasm: '烈焰裂隙', deadmines: '迪菲亚的覆灭', shadowfang_keep: '狼人的诅咒',
      blackfathom_deeps: '深渊低语', stockade: '铁窗之外', gnomeregan: '侏儒的复仇', razorfen_kraul: '沼泽野性',
      scarlet_monastery: '血色的忠诚', uldaman: '泰坦的遗物', razorfen_downs: '高地亡魂', maraudon: '大地公主之怒',
      zulfarrak: '沙怒秘宝', blackrock_depths: '黑铁之王', sunken_temple: '翡翠守护', scholomance: '亡者学院',
      blackrock_spire: '黑石之巅', dire_maul: '厄运三塔', stratholme: '斯坦索姆的净化', naxxramas: '天灾的圣殿',
      molten_core: '烈焰之子', blackwing_lair: '黑翼之影', onyxias_lair: '奥妮克希亚的终结', zulgurub: '血神坠落',
      ruins_ahnqiraj: '废墟虫潮', temple_ahnqiraj: '上古之神的低语',
    };
    const icons = {
      wailing_caverns: '🌿', ragefire_chasm: '🌋', deadmines: '⛏️', shadowfang_keep: '🐺', blackfathom_deeps: '🫧',
      stockade: '⛓️', gnomeregan: '🤖', razorfen_kraul: '🐗', scarlet_monastery: '🩸', uldaman: '🗿',
      razorfen_downs: '💀', maraudon: '🌪️', zulfarrak: '🏜️', blackrock_depths: '⛰️', sunken_temple: '🛕',
      scholomance: '📚', blackrock_spire: '🐉', dire_maul: '🦌', stratholme: '🏚️', naxxramas: '❄️',
      molten_core: '🔥', blackwing_lair: '🦇', onyxias_lair: '🐲', zulgurub: '🐍', ruins_ahnqiraj: '🐜', temple_ahnqiraj: '🐛',
    };
    // 奖励材料随副本等级分档;经典团本保留招牌掉落
    const special = {
      molten_core: ['m_crystal'],
      temple_ahnqiraj: ['tr_naaru_tear', 'm_crystal'],
    };
    const matBy = (lv) => (lv < 20 ? ['m_dust'] : lv < 40 ? ['m_essence'] : ['m_crystal']);
    for (const id in D.DUNGEONS) {
      const d = D.DUNGEONS[id];
      const lv = d.minLevel || 1;
      D.ACHIEVEMENTS['ach_dg_' + id] = {
        id: 'ach_dg_' + id, name: names[id] || '通关' + d.name, icon: icons[id] || d.icon,
        cat: 'dungeon', type: 'dungeon', target: id,
        desc: '通关' + d.name + (d.raid ? '（团本）' : '（5人本）'),
        count: 1, reward: { gold: 2500 + lv * 150, exp: 2500 + lv * 150, items: special[id] || matBy(lv) },
      };
    }
  })();

  /* ============ 怪物掉落表 ============ */
  // [物品id, 掉率] — 每个阵亡敌人独立掷取;装备/材料掉率已大幅上调(约 2~2.5 倍)
  D.DROPS = {
    elwynn_boar:      [['c_bread', 0.18], ['a_cloth', 0.12], ['a_padded_legs', 0.25]],
    elwynn_wolf:      [['c_bread', 0.22], ['a_boots', 0.12]],
    elwynn_kobold:    [['c_bread', 0.2], ['a_cloth', 0.15], ['a_cloak', 0.2]],
    elwynn_bandit:    [['w_short_sword', 0.2], ['a_boots', 0.18], ['c_heal', 0.1]],
    hogger:           [['a_helm', 0.5], ['c_vital', 0.5], ['w_battle_axe', 0.3], ['tr_brass_charm', 0.25]],
    westfall_golem:   [['a_leather', 0.35], ['c_feast', 0.25]],
    westfall_gnoll:   [['c_feast', 0.2], ['a_gloves', 0.2]],
    westfall_sailor:  [['c_heal', 0.15], ['a_wolf_cloak', 0.2], ['m_dust', 0.3]],
    westfall_croc:    [['a_boots', 0.28], ['c_feast', 0.2], ['m_dust', 0.35]],
    redridge_lizard:  [['a_neck', 0.25], ['c_feast', 0.2], ['m_dust', 0.4]],
    redridge_orc:     [['w_iron_sword', 0.25], ['c_heal', 0.18], ['a_circlet', 0.12], ['m_essence', 0.25], ['tr_boar_talisman', 0.12]],
    redridge_ogre:    [['a_legs', 0.35], ['w_crusader_sword', 0.15], ['c_vital', 0.15], ['m_essence', 0.3]],
    dusk_ghoul:       [['c_vital', 0.15], ['a_neck', 0.2], ['m_dust', 0.3], ['tr_might_signet', 0.12], ['a_bronze_neck', 0.2], ['w_off_dagger', 0.25]],
    dusk_hound:       [['a_wolf_cloak', 0.25], ['c_vital', 0.18], ['m_essence', 0.3], ['a_bronze_neck', 0.2]],
    dusk_spider:      [['w_nightblade', 0.15], ['c_vital', 0.18], ['m_essence', 0.4], ['w_off_dagger', 0.25]],
    arugal_shadow:    [['w_warblade', 0.6], ['a_blue', 0.6], ['c_vital', 0.6], ['m_essence', 0.7], ['m_crystal', 0.5]],
    durotar_boar:     [['c_bread', 0.18], ['a_cloth', 0.12], ['a_padded_legs', 0.25]],
    durotar_scorpion: [['c_bread', 0.2], ['a_cloth', 0.15], ['a_cloak', 0.2]],
    durotar_traitor:  [['c_heal', 0.12], ['a_boots', 0.15]],
    durotar_centaur:  [['a_boots', 0.2], ['c_feast', 0.12]],
    barrens_lion:     [['c_feast', 0.18], ['a_wolf_cloak', 0.15]],
    barrens_centaur:  [['c_heal', 0.15], ['a_gloves', 0.2]],
    barrens_lizard:   [['a_ring', 0.25], ['c_heal', 0.15], ['m_dust', 0.4]],
    barrens_quill:    [['w_iron_sword', 0.25], ['c_feast', 0.18], ['a_steel_boots', 0.12], ['m_essence', 0.25]],
    dm_sailor:        [['c_heal', 0.18], ['a_wolf_cloak', 0.15]],
    dm_wizard:        [['c_mana', 0.25], ['w_dusk_staff', 0.2], ['m_essence', 0.5]],
    dm_greenpaw:      [['a_blue', 0.6], ['w_crusader_sword', 0.5], ['m_essence', 0.7]],
    vancleef:         [['vancleef_fang', 0.8], ['a_blue', 0.6], ['m_crystal', 1], ['m_essence', 0.7]],
    wc_bat:           [['c_heal', 0.15], ['a_boots', 0.15], ['m_dust', 0.25]],
    wc_viper:         [['c_mana', 0.18], ['c_vital', 0.12], ['a_neck', 0.15], ['m_dust', 0.3]],
    wc_fang:          [['a_blue', 0.6], ['w_dusk_staff', 0.4], ['m_essence', 0.7]],
    mutanus:          [['w_staff_of_arcana', 0.7], ['a_blue', 0.6], ['m_crystal', 1], ['m_essence', 0.7]],
    /* 荆棘谷 */
    stv_panther:      [['c_heal', 0.2], ['a_stv_cloak', 0.22], ['m_essence', 0.2], ['tr_ember_heart', 0.12], ['a_raptor_gloves', 0.25], ['w_stv_cutlass', 0.2], ['a_stv_gloves', 0.2]],
    stv_ape:          [['c_feast', 0.2], ['a_stv_helm', 0.18], ['m_dust', 0.3], ['w_off_hide_shield', 0.25]],
    stv_tiger:        [['w_stv_machete', 0.18], ['c_vital', 0.2], ['m_essence', 0.25], ['a_raptor_gloves', 0.25], ['w_off_hide_shield', 0.2], ['tr_stv_medallion', 0.15]],
    stv_basilisk:     [['a_ring', 0.25], ['c_vital', 0.18], ['m_essence', 0.3], ['w_off_iron_shield', 0.25], ['a_stv_chest', 0.18]],
    stv_elite:        [['w_stv_machete', 0.5], ['a_stv_helm', 0.5], ['c_vital', 0.6], ['m_essence', 0.7], ['m_crystal', 0.5], ['tr_ember_heart', 0.35], ['w_off_iron_shield', 0.5], ['a_stv_ring', 0.35], ['tr_stv_medallion', 0.3]],
    /* 荒芜之地 */
    badlands_wolf:    [['c_feast', 0.2], ['a_badlands_boots', 0.22], ['m_essence', 0.25], ['a_badlands_gloves', 0.25], ['w_badlands_cleaver', 0.18]],
    badlands_scorpion: [['c_great_heal', 0.18], ['m_essence', 0.35], ['tr_lucky_clover', 0.12], ['a_badlands_gloves', 0.25]],
    badlands_vulture: [['a_neck', 0.2], ['c_great_mana', 0.18], ['m_essence', 0.3], ['a_badlands_cloak', 0.2]],
    badlands_ogre:    [['w_badlands_hammer', 0.2], ['a_badlands_plate', 0.22], ['c_vital', 0.18], ['m_essence', 0.3], ['a_badlands_helm', 0.25], ['w_off_razor_shiv', 0.2], ['a_badlands_hood', 0.2]],
    badlands_elite:   [['w_grim_staff', 0.5], ['a_badlands_plate', 0.5], ['c_vital', 0.6], ['m_essence', 0.7], ['m_crystal', 0.5], ['tr_lucky_clover', 0.35], ['a_badlands_helm', 0.5], ['w_off_razor_shiv', 0.4], ['a_badlands_legs', 0.3], ['a_badlands_ring', 0.3]],
    /* 灼热峡谷 */
    searing_lava:     [['c_great_heal', 0.2], ['m_essence', 0.35], ['a_burning_boots', 0.25]],
    searing_dwarf:    [['a_searing_legs', 0.22], ['c_great_mana', 0.18], ['m_essence', 0.3], ['a_burning_gloves', 0.25], ['w_off_mithril_shield', 0.2]],
    searing_lizard:   [['a_ring', 0.25], ['c_great_heal', 0.18], ['m_essence', 0.35], ['a_burning_boots', 0.25]],
    searing_elemental: [['w_searing_axe', 0.2], ['w_searing_staff', 0.2], ['a_searing_mail', 0.22], ['c_vital', 0.2], ['m_essence', 0.35], ['tr_imperial_seal', 0.12], ['a_burning_cloak', 0.2], ['w_off_moon_totem', 0.2]],
    searing_elite:    [['w_steam_saber', 0.55], ['a_searing_mail', 0.5], ['c_vital', 0.6], ['m_essence', 0.7], ['m_crystal', 0.6], ['tr_imperial_seal', 0.35], ['a_burning_gloves', 0.5], ['a_desert_neck', 0.4]],
    /* 燃烧平原 */
    burning_whelp:    [['c_super_heal', 0.18], ['m_essence', 0.3], ['a_blasted_ring', 0.2], ['c_master_heal', 0.15]],
    burning_orc:      [['a_blackrock_helm', 0.2], ['c_super_mana', 0.18], ['m_essence', 0.35], ['w_off_sun_totem', 0.25]],
    burning_hound:    [['c_vital', 0.2], ['m_crystal', 0.1], ['m_essence', 0.35], ['a_blasted_ring', 0.2], ['w_off_sun_totem', 0.2]],
    burning_dragon:   [['w_drake_blade', 0.18], ['c_super_heal', 0.18], ['m_crystal', 0.12], ['m_essence', 0.35], ['tr_abyss_eye', 0.1], ['w_off_dragon_shield', 0.4], ['c_ultimate_heal', 0.15]],
    burning_elite:    [['w_blackrock_sword', 0.55], ['w_brd_staff', 0.5], ['a_blackrock_plate', 0.5], ['c_vital', 0.6], ['m_crystal', 0.7], ['m_essence', 0.7], ['tr_abyss_eye', 0.35]],
    /* 冬泉谷 */
    winter_frostwolf: [['c_super_heal', 0.2], ['a_winter_cloak', 0.22], ['m_crystal', 0.1], ['a_winter_boots', 0.25], ['c_master_heal', 0.18]],
    winter_yeti:      [['c_vital', 0.2], ['a_winter_leather', 0.2], ['m_crystal', 0.12]],
    winter_owl:       [['c_super_mana', 0.2], ['m_crystal', 0.12], ['m_essence', 0.3], ['a_winter_boots', 0.25]],
    winter_giant:     [['w_winter_axe', 0.22], ['w_winter_staff', 0.2], ['a_winter_gloves', 0.2], ['c_vital', 0.2], ['m_crystal', 0.15], ['tr_naaru_tear', 0.1], ['w_off_dark_guard', 0.3]],
    winter_elite:     [['w_arcane_blade', 0.6], ['a_winter_leather', 0.5], ['c_vital', 0.6], ['m_crystal', 0.8], ['m_essence', 0.7], ['tr_naaru_tear', 0.35]],
    /* 千针石林 */
    needle_vulture:   [['c_heal', 0.2], ['a_stv_cloak', 0.2], ['m_dust', 0.3]],
    needle_coyote:    [['c_feast', 0.2], ['a_stv_helm', 0.18], ['m_essence', 0.2]],
    needle_turtle:    [['c_heal', 0.2], ['m_essence', 0.25]],
    needle_centaur:   [['w_stv_machete', 0.18], ['c_vital', 0.18], ['m_essence', 0.3]],
    needle_elite:     [['w_jungle_staff', 0.5], ['a_stv_helm', 0.5], ['c_vital', 0.6], ['m_essence', 0.7], ['m_crystal', 0.5]],
    /* 尘泥沼泽 */
    marsh_croc:       [['c_great_heal', 0.2], ['a_badlands_plate', 0.2], ['m_essence', 0.3], ['a_marsh_legs', 0.25], ['w_marsh_bow', 0.18], ['a_marsh_cord_legs', 0.18]],
    marsh_slime:      [['c_great_mana', 0.2], ['m_essence', 0.35], ['a_badlands_cloak', 0.2]],
    marsh_spider:     [['a_badlands_boots', 0.22], ['c_great_heal', 0.18], ['m_essence', 0.3], ['a_marsh_legs', 0.25], ['a_marsh_boots', 0.22], ['a_marsh_robes', 0.18]],
    marsh_ogre:       [['w_badlands_hammer', 0.2], ['a_ring', 0.25], ['m_essence', 0.3], ['a_marsh_ring', 0.2], ['w_off_razor_shiv', 0.2], ['a_marsh_chest', 0.2]],
    marsh_elite:      [['w_grim_staff', 0.5], ['a_badlands_plate', 0.5], ['c_vital', 0.6], ['m_essence', 0.7], ['m_crystal', 0.5], ['a_marsh_ring', 0.4], ['a_marsh_cloak', 0.3], ['a_marsh_neck', 0.3], ['w_marsh_scepter', 0.4]],
    /* 塔纳利斯 */
    tanaris_vulture:  [['c_great_heal', 0.2], ['m_essence', 0.3], ['a_burning_cloak', 0.2]],
    badlands_basilisk: [['c_great_heal', 0.2], ['m_essence', 0.3], ['a_badlands_ring', 0.15], ['a_badlands_legs', 0.18]],
    badlands_raptor:   [['c_great_heal', 0.18], ['m_essence', 0.3], ['w_badlands_cleaver', 0.2], ['a_badlands_hood', 0.18]],
    marsh_turtle:      [['c_great_heal', 0.2], ['m_essence', 0.3], ['a_marsh_chest', 0.2], ['w_off_iron_shield', 0.2]],
    marsh_raptor:      [['c_great_heal', 0.2], ['m_essence', 0.3], ['w_marsh_bow', 0.18], ['a_marsh_boots', 0.22]],
    searing_wolf:      [['c_great_heal', 0.2], ['m_essence', 0.35], ['w_searing_axe', 0.15], ['a_burning_gloves', 0.22]],
    searing_whelp:     [['c_great_heal', 0.2], ['m_essence', 0.4], ['w_flame_staff', 0.2], ['w_searing_staff', 0.18], ['a_searing_legs', 0.2]],
    tanaris_wasp:      [['c_great_heal', 0.2], ['m_essence', 0.35], ['w_stv_cutlass', 0.18], ['a_stv_ring', 0.18]],
    tanaris_hyena:     [['c_great_heal', 0.18], ['m_essence', 0.35], ['w_badlands_cleaver', 0.2], ['a_badlands_hood', 0.2]],
    tanaris_scorpion: [['c_great_mana', 0.18], ['m_essence', 0.35], ['a_desert_ring', 0.2]],
    tanaris_turtle:   [['a_searing_legs', 0.2], ['c_great_heal', 0.18], ['m_essence', 0.3], ['a_burning_gloves', 0.2], ['w_off_mithril_shield', 0.2]],
    tanaris_wastewalker: [['w_searing_axe', 0.2], ['c_vital', 0.2], ['m_essence', 0.35], ['a_desert_ring', 0.2], ['w_off_moon_totem', 0.2], ['w_marsh_scepter', 0.15]],
    tanaris_elite:    [['w_flame_staff', 0.55], ['a_searing_mail', 0.5], ['c_vital', 0.6], ['m_essence', 0.7], ['m_crystal', 0.6], ['a_desert_neck', 0.4]],
    /* 安戈洛环形山 */
    ungoro_raptor:    [['c_super_heal', 0.18], ['m_essence', 0.3], ['c_master_heal', 0.18]],
    ungoro_gorilla:   [['a_blackrock_helm', 0.2], ['c_super_mana', 0.18], ['m_essence', 0.35]],
    ungoro_dino:      [['a_blackrock_plate', 0.22], ['c_vital', 0.2], ['m_crystal', 0.12]],
    ungoro_plant:     [['c_super_heal', 0.2], ['m_crystal', 0.1], ['m_essence', 0.35]],
    ungoro_elite:     [['w_blackrock_sword', 0.55], ['a_blackrock_plate', 0.5], ['c_vital', 0.6], ['m_crystal', 0.7], ['m_essence', 0.7]],
    /* 瘟疫之地 */
    plague_zombie:    [['c_super_heal', 0.2], ['m_crystal', 0.1], ['m_essence', 0.3]],
    plague_bat:       [['c_super_mana', 0.2], ['a_winter_cloak', 0.2], ['m_crystal', 0.1]],
    plague_knight:    [['a_winter_leather', 0.2], ['c_vital', 0.2], ['m_crystal', 0.12]],
    plague_abomination: [['w_winter_axe', 0.22], ['w_winter_staff', 0.2], ['c_vital', 0.2], ['m_crystal', 0.15]],
    plague_elite:     [['w_arcane_blade', 0.6], ['a_winter_gloves', 0.5], ['c_vital', 0.6], ['m_crystal', 0.8], ['m_essence', 0.7]],
    /* 黑石深渊 */
    brd_guard:        [['c_super_heal', 0.2], ['a_blackrock_helm', 0.25], ['m_essence', 0.4]],
    brd_mage:         [['c_super_mana', 0.25], ['m_essence', 0.5]],
    brd_elite:        [['w_blackrock_sword', 0.5], ['a_blackrock_plate', 0.5], ['m_essence', 0.7], ['m_crystal', 0.5]],
    emperor_thaurissan: [['w_ice_guardian', 0.8], ['a_dragonscale', 0.6], ['w_sulfuras', 0.03], ['m_crystal', 1], ['m_essence', 0.8]],
    /* 祖尔法拉克 */
    zf_mummy:         [['c_great_heal', 0.2], ['m_essence', 0.4]],
    zf_priest:        [['c_great_mana', 0.22], ['m_essence', 0.45]],
    zf_elite:         [['w_steam_saber', 0.5], ['a_searing_mail', 0.5], ['m_essence', 0.7], ['m_crystal', 0.5]],
    zhuzhun:          [['w_silithus_scythe', 0.8], ['a_emperor_plate', 0.6], ['m_crystal', 1], ['m_essence', 0.8]],
    /* 影牙城堡 */
    sfk_worgen:       [['c_vital', 0.2], ['a_steel_boots', 0.15], ['m_essence', 0.3]],
    sfk_ghoul:        [['c_heal', 0.2], ['a_neck', 0.18], ['m_essence', 0.35]],
    sfk_shadow:       [['c_mana', 0.25], ['w_nightblade', 0.15], ['m_essence', 0.4]],
    sfk_elite:        [['w_warblade', 0.6], ['a_blue', 0.5], ['m_essence', 0.7], ['m_crystal', 0.4]],
    arugal:           [['w_arugal_staff', 0.8], ['a_blue', 0.6], ['m_crystal', 1], ['m_essence', 0.7]],
    /* 奥达曼 */
    uld_trogg:        [['c_feast', 0.2], ['a_badlands_boots', 0.18], ['m_essence', 0.35]],
    uld_gnome:        [['c_mana', 0.25], ['m_essence', 0.4], ['tr_imperial_seal', 0.1]],
    uld_golem:        [['c_vital', 0.2], ['a_badlands_plate', 0.15], ['m_essence', 0.4]],
    uld_elite:        [['w_grim_staff', 0.6], ['a_badlands_plate', 0.5], ['m_essence', 0.7], ['m_crystal', 0.4], ['w_uld_hammer', 0.25]],
    archaledas:       [['a_uld_plate', 0.8], ['w_steam_saber', 0.5], ['a_titan_guard', 0.5], ['m_crystal', 1], ['m_essence', 0.7], ['w_uld_hammer', 0.5]],
    /* 玛拉顿 */
    mara_satyr:       [['c_heal', 0.2], ['a_searing_legs', 0.18], ['m_essence', 0.35]],
    mara_water:       [['c_mana', 0.25], ['a_searing_mail', 0.15], ['m_essence', 0.4]],
    mara_dryad:       [['c_vital', 0.2], ['w_flame_staff', 0.15], ['m_essence', 0.4]],
    mara_elite:       [['w_steam_saber', 0.6], ['a_searing_mail', 0.5], ['m_essence', 0.7], ['m_crystal', 0.4]],
    princess_theradras: [['a_theradras_crown', 0.8], ['w_flame_staff', 0.5], ['w_verdant_rod', 0.5], ['m_crystal', 1], ['m_essence', 0.7]],
    /* 通灵学院 */
    sch_apprentice:   [['c_mana', 0.25], ['a_winter_cloak', 0.18], ['m_crystal', 0.15]],
    sch_lecturer:     [['c_vital', 0.2], ['a_winter_leather', 0.18], ['m_crystal', 0.15]],
    sch_mage:         [['c_mana', 0.25], ['w_frost_staff', 0.15], ['m_crystal', 0.2]],
    sch_elite:        [['w_drake_blade', 0.6], ['a_dragonscale', 0.5], ['m_essence', 0.7], ['m_crystal', 0.5]],
    gandling:         [['w_gandling_book', 0.8], ['a_dragonscale', 0.6], ['a_necropolis_plate', 0.6], ['w_thunderfury', 0.04], ['m_crystal', 1], ['m_essence', 0.7]],
    /* 纳克萨玛斯 */
    naxx_spider:      [['c_vital', 0.2], ['a_winter_cloak', 0.18], ['m_crystal', 0.2]],
    naxx_plague:      [['c_heal', 0.2], ['a_winter_leather', 0.18], ['m_crystal', 0.2]],
    naxx_knight:      [['c_feast', 0.2], ['w_drake_blade', 0.12], ['m_crystal', 0.25]],
    naxx_elite:       [['w_drake_blade', 0.6], ['a_dragonscale', 0.5], ['a_titan_ring', 0.03], ['a_oldgod_gloves', 0.03], ['a_oldgod_legs', 0.03], ['m_crystal', 0.6]],
    kelthuzad:        [['tr_kelthuzad_heart', 0.8], ['a_dragonscale', 0.6], ['w_frostmourne', 0.05], ['w_ashbringer', 0.03], ['a_oldgod_gloves', 0.08], ['a_oldgod_legs', 0.06], ['w_off_titan_wall', 0.08], ['m_crystal', 1], ['m_essence', 0.7]],
    /* 世界首领:稀有装备掉落(必定双倍奥术水晶) */
    kazzak:           [['w_kazzak_blade', 0.15], ['tr_abyssal_signet', 0.5], ['a_necropolis_plate', 0.35], ['a_titan_neck', 0.1], ['m_crystal', 1], ['m_crystal', 1], ['m_essence', 0.8]],
    azuregos:         [['a_emerald_drake_helm', 0.4], ['w_azure_staff', 0.25], ['a_winter_cloak', 0.5], ['a_oldgod_boots', 0.08], ['m_crystal', 1], ['m_crystal', 1], ['m_essence', 0.8]],
    /* 新区域怪物掉落 */
    bl_hellhound:     [['c_super_heal', 0.2], ['a_blasted_plate', 0.18], ['m_essence', 0.35], ['m_crystal', 0.08], ['a_blasted_legs', 0.2], ['c_master_heal', 0.18]],
    bl_mauler:        [['w_doom_cleaver', 0.2], ['a_felwood_robe', 0.18], ['m_essence', 0.35], ['m_crystal', 0.08], ['a_blasted_neck', 0.2]],
    bl_raptor:        [['w_doom_cleaver', 0.18], ['tr_blasted_seal', 0.12], ['m_essence', 0.3], ['m_crystal', 0.08], ['a_blasted_neck', 0.2]],
    bl_imp:           [['w_necropolis_staff', 0.16], ['c_super_heal', 0.2], ['m_essence', 0.3], ['m_crystal', 0.08]],
    bl_elite:         [['w_doom_cleaver', 0.6], ['a_blasted_plate', 0.55], ['tr_blasted_seal', 0.4], ['m_crystal', 0.8], ['m_essence', 0.7], ['a_blasted_legs', 0.4], ['w_off_dark_guard', 0.4]],
    fel_satyr:        [['w_doom_cleaver', 0.2], ['a_felwood_robe', 0.2], ['m_essence', 0.35], ['m_crystal', 0.08]],
    fel_treant:       [['a_felwood_robe', 0.22], ['c_flask', 0.2], ['m_essence', 0.35], ['m_crystal', 0.08]],
    fel_worg:         [['w_doom_cleaver', 0.18], ['a_epl_helm', 0.15], ['m_essence', 0.35], ['m_crystal', 0.08]],
    fel_spore:        [['c_flask', 0.22], ['a_felwood_robe', 0.18], ['m_essence', 0.3], ['m_crystal', 0.08]],
    fel_elite:        [['w_doom_cleaver', 0.6], ['a_felwood_robe', 0.55], ['a_epl_helm', 0.45], ['m_crystal', 0.8], ['m_essence', 0.7]],
    azz_naga:         [['w_necropolis_staff', 0.2], ['a_felwood_robe', 0.2], ['m_essence', 0.35], ['m_crystal', 0.08]],
    azz_lizard:       [['w_doom_cleaver', 0.18], ['c_super_heal', 0.2], ['m_essence', 0.35], ['m_crystal', 0.08]],
    azz_drake:        [['w_necropolis_staff', 0.2], ['a_epl_helm', 0.15], ['m_essence', 0.35], ['m_crystal', 0.1]],
    azz_ogre:         [['w_doom_cleaver', 0.22], ['a_blasted_plate', 0.18], ['m_essence', 0.3], ['m_crystal', 0.08]],
    azz_elite:        [['w_necropolis_staff', 0.6], ['a_epl_helm', 0.5], ['tr_blasted_seal', 0.4], ['m_crystal', 0.8], ['m_essence', 0.7]],
    epl_ghoul:        [['w_silithid_stinger', 0.2], ['a_epl_helm', 0.18], ['m_essence', 0.4], ['m_crystal', 0.1], ['a_plague_cloak', 0.2]],
    epl_gargoyle:     [['w_silithid_stinger', 0.18], ['a_silithid_chitin', 0.15], ['m_essence', 0.4], ['m_crystal', 0.1], ['a_plague_cloak', 0.2]],
    epl_abom:         [['w_silithid_stinger', 0.22], ['a_epl_helm', 0.2], ['m_essence', 0.4], ['m_crystal', 0.12], ['w_off_dragon_shield', 0.3]],
    epl_necromancer:  [['w_necropolis_staff', 0.22], ['a_silithid_chitin', 0.18], ['m_essence', 0.4], ['m_crystal', 0.1], ['a_plague_cloak', 0.25]],
    epl_elite:        [['w_silithid_stinger', 0.6], ['a_epl_helm', 0.5], ['a_silithid_chitin', 0.45], ['m_crystal', 0.9], ['m_essence', 0.7]],
    sil_sandcrawler:  [['w_silithid_stinger', 0.2], ['a_silithid_chitin', 0.18], ['m_essence', 0.4], ['m_crystal', 0.1], ['a_silithus_ring', 0.2]],
    sil_beetle:       [['a_silithid_chitin', 0.22], ['c_flask', 0.2], ['m_essence', 0.4], ['m_crystal', 0.1], ['a_silithus_ring', 0.2], ['c_ultimate_heal', 0.18], ['c_ultimate_mana', 0.18]],
    sil_soldier:      [['w_silithid_stinger', 0.2], ['a_epl_helm', 0.18], ['m_essence', 0.4], ['m_crystal', 0.12], ['a_silithus_neck', 0.2]],
    sil_scarab:       [['a_silithid_chitin', 0.2], ['c_super_heal', 0.2], ['m_essence', 0.4], ['m_crystal', 0.1], ['a_silithus_neck', 0.2]],
    sil_elite:        [['w_silithid_stinger', 0.6], ['a_silithid_chitin', 0.55], ['a_epl_helm', 0.5], ['m_crystal', 0.9], ['m_essence', 0.7], ['a_silithus_ring', 0.4], ['w_off_dragon_shield', 0.4]],
    /* 新副本杂兵掉落 */
    brs_orc:          [['c_super_heal', 0.2], ['a_blasted_plate', 0.2], ['m_essence', 0.4], ['m_crystal', 0.1]],
    brs_whelp:        [['w_doom_cleaver', 0.2], ['a_epl_helm', 0.18], ['m_essence', 0.4], ['m_crystal', 0.12]],
    brs_spellblade:   [['w_necropolis_staff', 0.22], ['c_flask', 0.2], ['m_essence', 0.4], ['m_crystal', 0.1]],
    brs_elite:        [['a_drakkisath_plate', 0.5], ['w_drakkisath_axe', 0.4], ['m_crystal', 0.8], ['m_essence', 0.7]],
    drakkisath:       [['w_drakkisath_axe', 0.8], ['a_drakkisath_plate', 0.6], ['tr_immolthar_eye', 0.3], ['m_crystal', 1], ['m_essence', 0.8]],
    str_ghoul:        [['c_super_heal', 0.2], ['a_epl_helm', 0.2], ['m_essence', 0.4], ['m_crystal', 0.1]],
    str_necro:        [['w_necropolis_staff', 0.22], ['c_flask', 0.2], ['m_essence', 0.4], ['m_crystal', 0.1]],
    str_knight:       [['w_silithid_stinger', 0.2], ['a_silithid_chitin', 0.18], ['m_essence', 0.4], ['m_crystal', 0.12]],
    str_elite:        [['a_rivendare_helm', 0.5], ['w_rivendare_blade', 0.4], ['m_crystal', 0.8], ['m_essence', 0.7]],
    rivendare:        [['w_rivendare_blade', 0.8], ['a_rivendare_helm', 0.6], ['tr_hakkar_heart', 0.3], ['m_crystal', 1], ['m_essence', 0.8]],
    dum_satyr:        [['w_doom_cleaver', 0.2], ['a_felwood_robe', 0.2], ['m_essence', 0.4], ['m_crystal', 0.1]],
    dum_treant:       [['a_felwood_robe', 0.22], ['c_flask', 0.2], ['m_essence', 0.4], ['m_crystal', 0.1]],
    dum_ghost:        [['w_necropolis_staff', 0.22], ['c_super_heal', 0.2], ['m_essence', 0.4], ['m_crystal', 0.1]],
    dum_elite:        [['tr_immolthar_eye', 0.5], ['w_immolthar_staff', 0.4], ['m_crystal', 0.8], ['m_essence', 0.7]],
    immolthar:        [['w_immolthar_staff', 0.8], ['tr_immolthar_eye', 0.6], ['a_felwood_robe', 0.5], ['m_crystal', 1], ['m_essence', 0.8]],
    mc_lava:          [['c_flask', 0.22], ['a_silithid_chitin', 0.18], ['m_essence', 0.5], ['m_crystal', 0.12]],
    mc_giant:         [['a_blasted_plate', 0.2], ['w_doom_cleaver', 0.18], ['m_essence', 0.5], ['m_crystal', 0.12]],
    mc_shaman:        [['w_necropolis_staff', 0.22], ['c_flask', 0.2], ['m_essence', 0.5], ['m_crystal', 0.12]],
    mc_elite:         [['a_onyxia_scale', 0.4], ['w_ragnaros_hand', 0.08], ['a_titan_plate', 0.03], ['a_titan_leggings', 0.03], ['m_crystal', 0.9], ['m_essence', 0.8]],
    ragnaros:         [['w_ragnaros_hand', 0.35], ['a_onyxia_scale', 0.7], ['tr_hakkar_heart', 0.4], ['a_titan_plate', 0.07], ['a_titan_leggings', 0.07], ['m_crystal', 1], ['m_crystal', 1], ['m_essence', 0.9]],
    bwl_drake:        [['c_flask', 0.22], ['a_epl_helm', 0.18], ['m_essence', 0.5], ['m_crystal', 0.12]],
    bwl_dragon:       [['a_onyxia_scale', 0.16], ['w_doom_cleaver', 0.2], ['m_essence', 0.5], ['m_crystal', 0.12]],
    bwl_sorcerer:     [['w_necropolis_staff', 0.22], ['c_flask', 0.2], ['m_essence', 0.5], ['m_crystal', 0.12]],
    bwl_elite:        [['a_onyxia_scale', 0.45], ['w_nefarian_blade', 0.08], ['a_titan_gauntlets', 0.03], ['a_titan_boots', 0.03], ['m_crystal', 0.9], ['m_essence', 0.8]],
    nefarian:         [['w_nefarian_blade', 0.35], ['a_onyxia_scale', 0.7], ['tr_cthun_eye', 0.35], ['a_titan_gauntlets', 0.08], ['a_titan_boots', 0.08], ['m_crystal', 1], ['m_crystal', 1], ['m_essence', 0.9]],
    // 奥妮克希亚的巢穴无中途首领(单独成阵),套装散件改由副本内小怪与精英产出
    onx_whelp:        [['c_super_heal', 0.22], ['a_silithid_chitin', 0.18], ['a_onyx_boots', 0.2], ['m_essence', 0.45], ['m_crystal', 0.12]],
    onx_guard:        [['w_silithid_stinger', 0.2], ['a_epl_helm', 0.2], ['a_onyx_cloak', 0.2], ['m_essence', 0.45], ['m_crystal', 0.12]],
    onx_mage:         [['w_necropolis_staff', 0.22], ['c_flask', 0.2], ['a_onyx_gauntlets', 0.2], ['m_essence', 0.45], ['m_crystal', 0.12]],
    onx_elite:        [['a_onyxia_scale', 0.45], ['a_onyx_crown', 0.35], ['w_rivendare_blade', 0.4], ['a_titan_crown', 0.03], ['a_titan_cloak', 0.03], ['m_crystal', 0.9], ['m_essence', 0.8]],
    onyxia:           [['a_onyxia_scale', 0.75], ['w_rivendare_blade', 0.5], ['tr_hakkar_heart', 0.4], ['a_onyx_leggings', 0.35], ['a_titan_crown', 0.07], ['a_titan_cloak', 0.08], ['m_crystal', 1], ['m_crystal', 1], ['m_essence', 0.9]],
    zg_troll:         [['c_flask', 0.22], ['a_silithid_chitin', 0.18], ['m_essence', 0.45], ['m_crystal', 0.12]],
    zg_priest:        [['w_necropolis_staff', 0.22], ['a_epl_helm', 0.18], ['m_essence', 0.45], ['m_crystal', 0.12]],
    zg_panther:       [['w_silithid_stinger', 0.2], ['c_super_heal', 0.2], ['m_essence', 0.45], ['m_crystal', 0.12]],
    zg_elite:         [['tr_hakkar_heart', 0.45], ['w_nefarian_blade', 0.06], ['m_crystal', 0.9], ['m_essence', 0.8]],
    hakkar:           [['tr_hakkar_heart', 0.7], ['a_cthun_armor', 0.5], ['w_ragnaros_hand', 0.2], ['a_titan_ring', 0.08], ['m_crystal', 1], ['m_crystal', 1], ['m_essence', 0.9]],
    aq_warrior:       [['c_flask', 0.22], ['a_silithid_chitin', 0.18], ['m_essence', 0.45], ['m_crystal', 0.12]],
    aq_observer:      [['w_necropolis_staff', 0.22], ['a_epl_helm', 0.18], ['m_essence', 0.45], ['m_crystal', 0.12]],
    aq_hiveswarm:     [['w_silithid_stinger', 0.2], ['c_super_heal', 0.2], ['m_essence', 0.45], ['m_crystal', 0.12]],
    aq_elite:         [['a_cthun_armor', 0.4], ['tr_cthun_eye', 0.3], ['a_oldgod_hood', 0.03], ['a_oldgod_robe', 0.03], ['m_crystal', 0.9], ['m_essence', 0.8]],
    rajaxx:           [['a_cthun_armor', 0.65], ['tr_cthun_eye', 0.45], ['w_nefarian_blade', 0.15], ['m_crystal', 1], ['m_crystal', 1], ['m_essence', 0.9]],
    aqt_twilight:     [['w_necropolis_staff', 0.22], ['c_flask', 0.2], ['m_essence', 0.45], ['m_crystal', 0.12]],
    aqt_anubisath:    [['a_cthun_armor', 0.14], ['w_doom_cleaver', 0.2], ['m_essence', 0.45], ['m_crystal', 0.12]],
    aqt_eye:          [['w_necropolis_staff', 0.22], ['a_epl_helm', 0.18], ['m_essence', 0.45], ['m_crystal', 0.12]],
    aqt_elite:        [['a_cthun_armor', 0.45], ['tr_cthun_eye', 0.35], ['a_oldgod_hood', 0.03], ['a_oldgod_robe', 0.03], ['a_oldgod_boots', 0.03], ['a_titan_neck', 0.03], ['m_crystal', 0.9], ['m_essence', 0.8]],
    cthun:            [['tr_cthun_eye', 0.6], ['a_cthun_armor', 0.7], ['w_ragnaros_hand', 0.25], ['w_atiesh', 0.06], ['a_oldgod_hood', 0.07], ['a_oldgod_robe', 0.07], ['m_crystal', 1], ['m_crystal', 1], ['m_essence', 1]],
    /* ===== 新增 8 副本掉落 ===== */
    rfc_trooper:      [['c_heal', 0.15], ['a_cloth', 0.15], ['m_dust', 0.35]],
    rfc_cultist:      [['c_mana', 0.15], ['a_circlet', 0.12], ['m_dust', 0.35]],
    rfc_imp:          [['c_heal', 0.18], ['m_dust', 0.4]],
    rfc_elite:        [['w_iron_sword', 0.4], ['a_boots', 0.4], ['m_essence', 0.5], ['m_crystal', 0.3]],
    jergosh:          [['w_rfc_ritual_dagger', 0.7], ['a_blue', 0.5], ['m_crystal', 1], ['m_essence', 0.6]],
    skd_convict:      [['c_heal', 0.15], ['a_gloves', 0.18], ['m_dust', 0.4]],
    skd_brute:        [['c_vital', 0.15], ['a_steel_boots', 0.15], ['m_dust', 0.4]],
    skd_hound:        [['c_feast', 0.18], ['a_wolf_cloak', 0.15], ['m_dust', 0.35]],
    skd_elite:        [['w_iron_sword', 0.5], ['a_blue', 0.4], ['m_essence', 0.6], ['m_crystal', 0.35]],
    thredd:           [['w_skd_shiv', 0.7], ['a_blue', 0.55], ['m_crystal', 1], ['m_essence', 0.65]],
    bfd_naga:         [['c_heal', 0.15], ['a_leather', 0.18], ['m_dust', 0.4]],
    bfd_priestess:    [['c_mana', 0.18], ['a_circlet', 0.12], ['m_essence', 0.25]],
    bfd_turtle:       [['c_feast', 0.18], ['a_boots', 0.18], ['m_dust', 0.4]],
    bfd_elite:        [['w_iron_sword', 0.45], ['a_neck', 0.4], ['m_essence', 0.6], ['m_crystal', 0.35]],
    akumai:           [['a_bfd_coral', 0.7], ['w_dusk_staff', 0.4], ['m_crystal', 1], ['m_essence', 0.65]],
    gno_mech:         [['c_heal', 0.15], ['a_gloves', 0.18], ['m_dust', 0.5]],
    gno_trooper:      [['c_mana', 0.15], ['w_iron_sword', 0.15], ['m_dust', 0.4]],
    gno_slime:        [['c_vital', 0.15], ['m_essence', 0.3], ['m_dust', 0.4]],
    gno_elite:        [['w_warblade', 0.5], ['a_helm', 0.45], ['m_essence', 0.65], ['m_crystal', 0.4]],
    thermaplugg:      [['w_gno_blast_gun', 0.7], ['a_blue', 0.55], ['m_crystal', 1], ['m_essence', 0.7]],
    rfk_quill:        [['c_heal', 0.15], ['a_leather', 0.18], ['m_dust', 0.4]],
    rfk_boar:         [['c_feast', 0.18], ['a_boots', 0.18], ['m_dust', 0.4]],
    rfk_shaman:       [['c_mana', 0.18], ['a_circlet', 0.12], ['m_essence', 0.25]],
    rfk_elite:        [['w_iron_sword', 0.5], ['a_mail', 0.45], ['m_essence', 0.6], ['m_crystal', 0.35]],
    charlga:          [['w_rfk_razor_axe', 0.7], ['a_blue', 0.55], ['m_crystal', 1], ['m_essence', 0.7]],
    rfd_bones:        [['c_vital', 0.18], ['a_boots', 0.18], ['m_essence', 0.3]],
    rfd_witch:        [['c_mana', 0.2], ['a_circlet', 0.15], ['m_essence', 0.35]],
    rfd_worm:         [['c_feast', 0.18], ['a_gloves', 0.18], ['m_dust', 0.45]],
    rfd_elite:        [['w_badlands_hammer', 0.5], ['a_blue', 0.5], ['m_essence', 0.7], ['m_crystal', 0.4]],
    amnennar:         [['w_rfd_cold_blade', 0.7], ['a_theradras_crown', 0.3], ['m_crystal', 1], ['m_essence', 0.75]],
    sm_knight:        [['c_vital', 0.18], ['a_mail', 0.18], ['m_essence', 0.3]],
    sm_crusader:      [['c_great_heal', 0.18], ['a_blue', 0.15], ['m_essence', 0.35]],
    sm_cleric:        [['c_mana', 0.2], ['a_circlet', 0.15], ['m_essence', 0.35]],
    sm_elite:         [['w_warblade', 0.55], ['a_helm', 0.5], ['m_essence', 0.7], ['m_crystal', 0.4]],
    whitemane:        [['a_sm_scarlet_robe', 0.7], ['w_dusk_staff', 0.4], ['m_crystal', 1], ['m_essence', 0.75]],
    st_troll:         [['c_great_heal', 0.2], ['a_mail', 0.2], ['m_essence', 0.4]],
    st_priest:        [['c_great_mana', 0.2], ['a_circlet', 0.18], ['m_essence', 0.45]],
    st_snake:         [['c_vital', 0.2], ['a_gloves', 0.2], ['m_dust', 0.5]],
    st_elite:         [['w_badlands_hammer', 0.55], ['a_blue', 0.55], ['m_essence', 0.75], ['m_crystal', 0.5]],
    avatar_hakkar:    [['w_st_temple_blade', 0.7], ['a_theradras_crown', 0.35], ['m_crystal', 1], ['m_essence', 0.8]],
  };

  /* ============ 声望系统(军需官专属装备与坐骑) ============ */
  // RP 封装:军需官商品带 rep(声望阵营) 与 repTier(所需声望等级) 标记
  const RP = (id, name, icon, slot, quality, level, stats, buy, rep, tier) => IT(id, name, icon, slot, quality, level, stats, { buy, sell: Math.floor(buy * 0.25) }, { rep, repTier: tier });

  Object.assign(D.ITEMS, {
    /* 暴风城(联盟) */
    r_sw_sword:   RP('r_sw_sword', '暴风城卫兵长剑', '⚔️', 'weapon', 'blue', 14, { dmg: [24, 36], stam: 3, agi: 2 }, 12000, 'sw', 'honored'),
    r_sw_cloak:   RP('r_sw_cloak', '暴风城荣誉披风', '🧣', 'cloak', 'blue', 12, { armor: 12, stam: 2, agi: 1 }, 9000, 'sw', 'honored'),
    r_sw_plate:   RP('r_sw_plate', '暴风城骑士板甲', '🛡️', 'chest', 'purple', 18, { armor: 42, str: 6, stam: 6 }, 26000, 'sw', 'revered'),
    r_sw_ring:    RP('r_sw_ring', '暴风城皇家指环', '💍', 'ring', 'purple', 16, { crit: 0.02, stam: 2, agi: 2 }, 22000, 'sw', 'revered'),
    r_sw_horse:   RP('r_sw_horse', '暴风城军马', '🐎', 'mount', 'epic', 10, {}, 80000, 'sw', 'exalted'),
    /* 奥格瑞玛(部落) */
    r_og_axe:     RP('r_og_axe', '奥格瑞玛战斧', '🪓', 'weapon', 'blue', 14, { dmg: [26, 38], str: 3, stam: 2 }, 12000, 'og', 'honored'),
    r_og_helm:    RP('r_og_helm', '奥格瑞玛战盔', '🪖', 'head', 'blue', 12, { armor: 24, stam: 5 }, 9000, 'og', 'honored'),
    r_og_mail:    RP('r_og_mail', '奥格瑞玛督军胸甲', '🦺', 'chest', 'purple', 18, { armor: 40, str: 5, stam: 6, agi: 2 }, 26000, 'og', 'revered'),
    r_og_trinket: RP('r_og_trinket', '大酋长的怒火', '🔥', 'trinket', 'purple', 16, { crit: 0.02, stam: 2, str: 2 }, 22000, 'og', 'revered'),
    r_og_wolf:    RP('r_og_wolf', '奥格瑞玛座狼', '🐺', 'mount', 'epic', 10, {}, 80000, 'og', 'exalted'),
    /* 银色黎明(中立) */
    r_ag_chest:   RP('r_ag_chest', '银色黎明胸甲', '🥋', 'chest', 'blue', 56, { armor: 74, stam: 12, int: 8 }, 42000, 'argent', 'honored'),
    r_ag_staff:   RP('r_ag_staff', '银色黎明法杖', '🪄', 'weapon', 'blue', 56, { dmg: [52, 78], int: 13, spi: 9 }, 46000, 'argent', 'honored'),
    r_ag_helm:    RP('r_ag_helm', '银色黎明指挥官之盔', '👑', 'head', 'purple', 58, { armor: 52, stam: 14, str: 10 }, 90000, 'argent', 'revered'),
    r_ag_ring:    RP('r_ag_ring', '银色黎明的胜利', '💍', 'ring', 'purple', 58, { crit: 0.04, stam: 8, agi: 6 }, 80000, 'argent', 'revered'),
    r_ag_charger: RP('r_ag_charger', '银色战马', '🐴', 'mount', 'epic', 55, {}, 180000, 'argent', 'exalted'),
    /* 塞纳里奥议会(中立) */
    r_ce_gloves:  RP('r_ce_gloves', '塞纳里奥治疗手套', '🧤', 'gloves', 'blue', 58, { armor: 34, int: 12, spi: 10 }, 46000, 'cenarion', 'honored'),
    r_ce_sword:   RP('r_ce_sword', '塞纳里奥之刃', '🗡️', 'weapon', 'blue', 58, { dmg: [74, 104], agi: 11, stam: 10 }, 50000, 'cenarion', 'honored'),
    r_ce_cloak:   RP('r_ce_cloak', '塞纳里奥议会披风', '🧣', 'cloak', 'purple', 60, { armor: 22, agi: 6, int: 5, stam: 3 }, 95000, 'cenarion', 'revered'),
    r_ce_ring:    RP('r_ce_ring', '自然庇护指环', '💍', 'ring', 'purple', 60, { stam: 12, agi: 8, crit: 0.03 }, 88000, 'cenarion', 'revered'),
    r_ce_cat:     RP('r_ce_cat', '塞纳里奥战豹', '🐆', 'mount', 'epic', 58, {}, 190000, 'cenarion', 'exalted'),
    /* 瑟银兄弟会(中立) */
    r_th_gloves:  RP('r_th_gloves', '瑟银护手', '🧤', 'gloves', 'blue', 48, { armor: 30, stam: 10, str: 8 }, 34000, 'thorium', 'honored'),
    r_th_axe:     RP('r_th_axe', '瑟银战斧', '🪓', 'weapon', 'blue', 50, { dmg: [68, 100], str: 12, stam: 8, crit: 0.01 }, 38000, 'thorium', 'honored'),
    r_th_chest:   RP('r_th_chest', '瑟银兄弟会胸甲', '🛡️', 'chest', 'purple', 55, { armor: 68, stam: 14, str: 12 }, 85000, 'thorium', 'revered'),
    r_th_ring:    RP('r_th_ring', '瑟银徽记', '💍', 'ring', 'purple', 52, { crit: 0.04, str: 8, agi: 6 }, 78000, 'thorium', 'revered'),
    r_th_wolf:    RP('r_th_wolf', '黑铁战狼', '🐺', 'mount', 'epic', 50, {}, 170000, 'thorium', 'exalted'),
  });

  /* 声望徽章:精英怪掉落,可在声望面板上交换取声望(加速冲声望) */
  Object.assign(D.ITEMS, {
    r_badge_sw:  IT('r_badge_sw', '暴风城徽章', '🦁', 'material', 'green', 1, {}, { sell: 80 }, { badge: 'sw' }),
    r_badge_og:  IT('r_badge_og', '奥格瑞玛徽章', '⚔️', 'material', 'green', 1, {}, { sell: 80 }, { badge: 'og' }),
    r_badge_ag:  IT('r_badge_ag', '银色黎明徽章', '🌕', 'material', 'green', 1, {}, { sell: 80 }, { badge: 'argent' }),
    r_badge_ce:  IT('r_badge_ce', '塞纳里奥徽章', '🌿', 'material', 'green', 1, {}, { sell: 80 }, { badge: 'cenarion' }),
    r_badge_th:  IT('r_badge_th', '瑟银徽章', '🔥', 'material', 'green', 1, {}, { sell: 80 }, { badge: 'thorium' }),
  });

  /* ============ 全等级段槽位覆盖补件 ============
   * 覆盖审计发现若干槽位在某些 5 级段内没有任何可获取装备(如 35-39 级无物理武器、
   * 43-58 级无头盔、53 级区间无护腿/靴子……),玩家在这些等级段「想换装也没得换」。
   * 这里按槽位把空段补齐,并统一挂到对应区域商店与怪物掉落。 */
  Object.assign(D.ITEMS, {
    /* 6-10 段 */
    a_boar_legs:        IT('a_boar_legs', '野猪皮护腿', '👖', 'legs', 'green', 8, { armor: 16, stam: 2 }, { buy: 900, sell: 225 }),
    a_boar_boots:       IT('a_boar_boots', '野猪皮战靴', '🥾', 'boots', 'green', 8, { armor: 12, agi: 1, stam: 1 }, { buy: 800, sell: 200 }),
    a_linen_pendant:    IT('a_linen_pendant', '亚麻坠饰', '📿', 'neck', 'green', 8, { int: 3, spi: 1 }, { buy: 950, sell: 240 }),
    /* 11-15 段 */
    a_tin_ring:         IT('a_tin_ring', '锡质戒指', '💍', 'ring', 'green', 13, { stam: 4 }, { buy: 2200, sell: 550 }),
    a_greywood_pendant: IT('a_greywood_pendant', '灰木坠饰', '📿', 'neck', 'green', 13, { int: 3, spi: 2 }, { buy: 3600, sell: 900 }),
    a_thorn_gloves:     IT('a_thorn_gloves', '荆棘手套', '🧤', 'gloves', 'green', 14, { armor: 14, str: 2, stam: 1 }, { buy: 2600, sell: 650 }),
    /* 16-20 段 */
    a_raptor_legs:      IT('a_raptor_legs', '迅猛龙皮护腿', '👖', 'legs', 'green', 18, { armor: 36, agi: 3, stam: 2 }, { buy: 5400, sell: 1350 }),
    a_raptor_boots:     IT('a_raptor_boots', '迅猛龙皮战靴', '🥾', 'boots', 'green', 18, { armor: 20, agi: 3, stam: 2 }, { buy: 4600, sell: 1150 }),
    /* 21-25 段 */
    a_jungle_crown:     IT('a_jungle_crown', '丛林之冠', '🪖', 'head', 'green', 23, { armor: 32, agi: 4, stam: 3 }, { buy: 8200, sell: 2050 }),
    a_jungle_legs:      IT('a_jungle_legs', '丛林护腿', '👖', 'legs', 'green', 23, { armor: 44, agi: 4, stam: 3 }, { buy: 8600, sell: 2150 }),
    a_jungle_pendant:   IT('a_jungle_pendant', '丛林护符', '📿', 'neck', 'green', 23, { str: 4, stam: 3 }, { buy: 6200, sell: 1550 }),
    tr_jungle_charm:    IT('tr_jungle_charm', '丛林巫毒护符', '🎖️', 'trinket', 'green', 23, { int: 5, spi: 3 }, { buy: 7400, sell: 1850 }),
    /* 26-30 段 */
    a_dust_gloves:      IT('a_dust_gloves', '尘泥手套', '🧤', 'gloves', 'green', 28, { armor: 22, str: 3, stam: 2 }, { buy: 9600, sell: 2400 }),
    /* 31-35 段 */
    a_searing_hood:     IT('a_searing_hood', '灼热兜帽', '🪖', 'head', 'green', 33, { armor: 42, str: 5, stam: 3 }, { buy: 15500, sell: 3875 }),
    a_searing_gauntlets: IT('a_searing_gauntlets', '灼热铸铁护手', '🧤', 'gloves', 'green', 33, { armor: 28, str: 4, stam: 3 }, { buy: 11800, sell: 2950 }),
    a_lava_legs:        IT('a_lava_legs', '熔岩护腿', '👖', 'legs', 'green', 33, { armor: 56, str: 5, stam: 4 }, { buy: 13400, sell: 3350 }),
    a_lava_ring:        IT('a_lava_ring', '熔岩指环', '💍', 'ring', 'green', 33, { crit: 0.01, agi: 4, stam: 4 }, { buy: 12500, sell: 3125 }),
    a_lava_pendant:     IT('a_lava_pendant', '熔岩坠饰', '📿', 'neck', 'green', 33, { int: 5, spi: 5, stam: 2 }, { buy: 10800, sell: 2700 }),
    /* 36-40 段 */
    a_ash_boots:        IT('a_ash_boots', '灰烬战靴', '🥾', 'boots', 'green', 38, { armor: 32, agi: 4, stam: 3 }, { buy: 15000, sell: 3750 }),
    a_ash_cloak:        IT('a_ash_cloak', '灰烬披风', '🧣', 'cloak', 'green', 38, { armor: 20, int: 4, spi: 3 }, { buy: 14000, sell: 3500 }),
    /* 41-45 段 */
    a_brd_gauntlets:    IT('a_brd_gauntlets', '黑铁护手', '🧤', 'gloves', 'green', 43, { armor: 52, str: 6, stam: 4 }, { buy: 24000, sell: 6000 }),
    a_brd_leggings:     IT('a_brd_leggings', '黑铁护腿', '👖', 'legs', 'green', 43, { armor: 74, str: 7, stam: 5 }, { buy: 26000, sell: 6500 }),
    a_brd_torc:         IT('a_brd_torc', '黑铁颈环', '📿', 'neck', 'green', 43, { agi: 6, crit: 0.01, stam: 3 }, { buy: 21000, sell: 5250 }),
    a_brd_ring:         IT('a_brd_ring', '黑铁指环', '💍', 'ring', 'green', 43, { crit: 0.02, agi: 4, stam: 4 }, { buy: 22000, sell: 5500 }),
    tr_brd_totem:       IT('tr_brd_totem', '黑铁图腾', '🎖️', 'trinket', 'green', 43, { int: 7, spi: 5, crit: 0.01 }, { buy: 24000, sell: 6000 }),
    /* 46-50 段 */
    a_frozen_crown:     IT('a_frozen_crown', '寒冰之冠', '🪖', 'head', 'green', 48, { armor: 56, int: 7, spi: 4 }, { buy: 27000, sell: 6750 }),
    a_frozen_boots:     IT('a_frozen_boots', '寒冰战靴', '🥾', 'boots', 'green', 48, { armor: 46, agi: 5, stam: 4 }, { buy: 24000, sell: 6000 }),
    a_frozen_cloak:     IT('a_frozen_cloak', '寒冰披风', '🧣', 'cloak', 'green', 48, { armor: 24, agi: 5, stam: 4 }, { buy: 22000, sell: 5500 }),
    /* 51-55 段 */
    a_plague_crown:     IT('a_plague_crown', '瘟疫之冠', '🪖', 'head', 'green', 53, { armor: 64, str: 7, stam: 5 }, { buy: 38000, sell: 9500 }),
    a_plague_gauntlets: IT('a_plague_gauntlets', '瘟疫护手', '🧤', 'gloves', 'green', 53, { armor: 60, str: 7, stam: 5 }, { buy: 34000, sell: 8500 }),
    a_scourge_legs:     IT('a_scourge_legs', '天灾护腿', '👖', 'legs', 'green', 53, { armor: 88, str: 8, stam: 6 }, { buy: 44000, sell: 11000 }),
    a_scourge_boots:    IT('a_scourge_boots', '天灾战靴', '🥾', 'boots', 'green', 53, { armor: 52, agi: 6, stam: 5 }, { buy: 36000, sell: 9000 }),
    a_scourge_cloak:    IT('a_scourge_cloak', '天灾披风', '🧣', 'cloak', 'green', 53, { armor: 28, stam: 6, agi: 4 }, { buy: 32000, sell: 8000 }),
    w_off_obsidian_shield: IT('w_off_obsidian_shield', '黑曜石盾', '🛡️', 'offhand', 'blue', 52, { armor: 28, stam: 9, str: 4 }, { buy: 45000, sell: 11250 }),
    /* 56-60 段 */
    a_obsidian_torc:    IT('a_obsidian_torc', '黑曜石颈环', '📿', 'neck', 'blue', 57, { int: 9, spi: 6, stam: 3 }, { buy: 46000, sell: 11500 }),
    /* 35-39 段物理武器(补齐 34→40 之间的换装空档) */
    w_tanaris_scimitar: IT('w_tanaris_scimitar', '塔纳利斯弯刀', '🗡️', 'weapon', 'green', 37, { dmg: [54, 76], str: 9, stam: 5 }, { buy: 27000, sell: 6750 }),
  });

  // 补件上架:挂到对应等级段的区域商店
  const COVER_SHOPS = {
    elwynn: ['a_boar_legs', 'a_boar_boots'],
    durotar: ['a_boar_legs', 'a_boar_boots'],
    stormwind: ['a_linen_pendant', 'a_tin_ring', 'w_doom_cleaver', 'w_ice_guardian', 'a_plague_cloak', 'a_epl_helm', 'a_silithid_chitin', 'a_emperor_plate', 'a_obsidian_torc'],
    orgrimmar: ['a_linen_pendant', 'a_tin_ring', 'w_doom_cleaver', 'w_ice_guardian', 'a_plague_cloak', 'a_epl_helm', 'a_silithid_chitin', 'a_emperor_plate', 'a_obsidian_torc'],
    westfall: ['a_thorn_gloves'],
    barrens: ['a_thorn_gloves'],
    duskwood: ['a_thorn_gloves', 'a_tin_ring', 'a_greywood_pendant'],
    redridge: ['a_greywood_pendant'],
    stv: ['a_raptor_legs', 'a_raptor_boots', 'a_jungle_crown', 'a_jungle_legs', 'a_jungle_pendant', 'tr_jungle_charm'],
    thousand_needles: ['a_raptor_legs', 'a_raptor_boots'],
    badlands: ['a_jungle_crown', 'a_jungle_legs', 'tr_jungle_charm', 'a_dust_gloves'],
    dustwallow: ['a_jungle_pendant', 'a_dust_gloves'],
    searing: ['a_searing_hood', 'a_searing_gauntlets', 'a_lava_legs', 'a_lava_ring', 'a_lava_pendant', 'w_tanaris_scimitar'],
    tanaris: ['a_searing_hood', 'a_searing_gauntlets', 'a_lava_legs', 'a_lava_ring', 'a_lava_pendant', 'a_ash_boots', 'a_ash_cloak', 'w_tanaris_scimitar'],
    burning: ['a_ash_boots', 'a_ash_cloak', 'a_brd_gauntlets', 'a_brd_leggings', 'a_brd_torc', 'a_brd_ring', 'tr_brd_totem', 'w_tanaris_scimitar'],
    ungoro: ['a_brd_gauntlets', 'a_brd_leggings', 'a_brd_torc', 'a_brd_ring', 'tr_brd_totem'],
    winterspring: ['a_frozen_crown', 'a_frozen_boots', 'a_frozen_cloak'],
    plaguelands: ['a_frozen_crown', 'a_frozen_boots', 'a_frozen_cloak'],
    blasted_lands: ['w_off_obsidian_shield'],
    eplaguelands: ['a_plague_crown', 'a_plague_gauntlets', 'a_scourge_legs', 'a_scourge_boots', 'a_scourge_cloak', 'w_off_obsidian_shield', 'a_obsidian_torc'],
    silithus: ['a_plague_crown', 'a_plague_gauntlets', 'a_scourge_legs', 'a_scourge_boots', 'a_scourge_cloak', 'w_off_obsidian_shield', 'a_obsidian_torc'],
  };
  for (const zid in COVER_SHOPS) {
    const z = D.ZONES[zid];
    if (!z) continue;
    for (const iid of COVER_SHOPS[zid]) if (!z.shop.includes(iid)) z.shop.push(iid);
  }

  // 补件掉落:挂到对应区域怪物(每个阵亡敌人独立掷取)
  const COVER_DROPS = {
    elwynn_boar: [['a_boar_legs', 0.15]],
    durotar_boar: [['a_boar_legs', 0.15]],
    elwynn_wolf: [['a_boar_boots', 0.15]],
    durotar_traitor: [['a_boar_boots', 0.15]],
    elwynn_kobold: [['a_linen_pendant', 0.12]],
    durotar_scorpion: [['a_linen_pendant', 0.12]],
    westfall_gnoll: [['a_thorn_gloves', 0.15]],
    barrens_centaur: [['a_thorn_gloves', 0.15]],
    dusk_ghoul: [['a_tin_ring', 0.12]],
    dusk_spider: [['a_greywood_pendant', 0.12]],
    stv_panther: [['a_raptor_legs', 0.18]],
    needle_centaur: [['a_raptor_legs', 0.15]],
    stv_tiger: [['a_raptor_boots', 0.18]],
    needle_vulture: [['a_raptor_boots', 0.15]],
    stv_ape: [['a_jungle_crown', 0.15]],
    badlands_raptor: [['a_jungle_legs', 0.15]],
    marsh_ogre: [['a_jungle_pendant', 0.15]],
    stv_elite: [['tr_jungle_charm', 0.2]],
    marsh_slime: [['a_dust_gloves', 0.18]],
    searing_dwarf: [['a_searing_hood', 0.18]],
    tanaris_turtle: [['a_searing_gauntlets', 0.18]],
    searing_lava: [['a_lava_legs', 0.18]],
    tanaris_wasp: [['a_lava_ring', 0.16]],
    searing_whelp: [['a_lava_pendant', 0.16]],
    tanaris_wastewalker: [['a_ash_boots', 0.16]],
    tanaris_elite: [['a_ash_cloak', 0.35]],
    burning_orc: [['a_brd_gauntlets', 0.15]],
    burning_whelp: [['a_brd_leggings', 0.18]],
    ungoro_raptor: [['a_brd_torc', 0.15]],
    ungoro_gorilla: [['a_brd_ring', 0.15]],
    burning_elite: [['tr_brd_totem', 0.3]],
    winter_owl: [['a_frozen_crown', 0.15]],
    winter_yeti: [['a_frozen_boots', 0.15]],
    plague_bat: [['a_frozen_cloak', 0.18]],
    epl_ghoul: [['a_plague_crown', 0.18]],
    sil_sandcrawler: [['a_plague_gauntlets', 0.16]],
    epl_gargoyle: [['a_scourge_legs', 0.18]],
    sil_beetle: [['a_scourge_boots', 0.16]],
    epl_necromancer: [['a_scourge_cloak', 0.18]],
    bl_elite: [['w_off_obsidian_shield', 0.35]],
    sil_elite: [['a_obsidian_torc', 0.35]],
    searing_wolf: [['w_tanaris_scimitar', 0.15]],
  };
  for (const mid in COVER_DROPS) {
    if (!D.DROPS[mid]) continue;
    D.DROPS[mid] = D.DROPS[mid].concat(COVER_DROPS[mid]);
  }

  // 声望阵营注册表:经典魔兽声望阈值(中立0/友善3000/尊敬6000/崇敬12000/崇拜21000)
  D.REPS = {
    sw: { id: 'sw', name: '暴风城', icon: '🦁', color: '#6aa5d9', faction: 'alliance',
      desc: '联盟的主城，狮王旗飘扬之处皆为暴风城之地。',
      zones: ['elwynn', 'westfall', 'redridge', 'duskwood', 'stv', 'badlands', 'stormwind'],
      dungeons: ['deadmines', 'shadowfang_keep', 'uldaman', 'zulgurub', 'stockade', 'gnomeregan'],
      sources: '击败暴风城势力区域怪物、通关死亡矿井/影牙城堡/奥达曼等副本、完成区域任务' },
    og: { id: 'og', name: '奥格瑞玛', icon: '⚔️', color: '#d9655b', faction: 'horde',
      desc: '部落的主城，钢铁与战鼓铸就的荣耀。',
      zones: ['durotar', 'barrens', 'thousand_needles', 'tanaris', 'dustwallow', 'orgrimmar'],
      dungeons: ['wailing_caverns', 'zulfarrak', 'maraudon', 'dire_maul', 'ragefire_chasm', 'razorfen_kraul', 'razorfen_downs'],
      sources: '击败奥格瑞玛势力区域怪物、通关哀嚎洞穴/祖尔法拉克等副本、完成区域任务' },
    argent: { id: 'argent', name: '银色黎明', icon: '🌕', color: '#e8d48b', faction: 'neutral',
      desc: '对抗天灾军团的中立组织，驻守东瘟疫之地。',
      zones: ['plaguelands', 'eplaguelands', 'winterspring'],
      dungeons: ['stratholme', 'scholomance', 'naxxramas', 'scarlet_monastery'],
      sources: '击败瘟疫之地/冬泉谷怪物、通关斯坦索姆/通灵学院/纳克萨玛斯、完成区域任务' },
    cenarion: { id: 'cenarion', name: '塞纳里奥议会', icon: '🌿', color: '#8fd48b', faction: 'neutral',
      desc: '守护自然平衡的德鲁伊组织，驻守希利苏斯对抗其拉虫人。',
      zones: ['silithus', 'ungoro', 'felwood', 'azshara'],
      dungeons: ['ruins_ahnqiraj', 'temple_ahnqiraj', 'blackfathom_deeps', 'sunken_temple'],
      sources: '击败希利苏斯/费伍德/艾萨拉怪物、通关安其拉副本、完成希利苏斯任务' },
    thorium: { id: 'thorium', name: '瑟银兄弟会', icon: '🔥', color: '#d9a05b', faction: 'neutral',
      desc: '黑石山的矮人锻造大师，收集稀世金属打造神兵。',
      zones: ['searing', 'burning', 'blasted_lands'],
      dungeons: ['blackrock_depths', 'blackrock_spire', 'molten_core', 'blackwing_lair', 'onyxias_lair'],
      sources: '击败黑石山/诅咒之地怪物、通关黑石深渊/黑石塔/熔火之心等副本、完成黑石山任务' },
  };

  /* ============ 世界首领(定时刷新) ============ */
  // zone: 出没区域 / minLevel: 挑战最低等级
  D.WORLD_BOSSES = {
    kazzak:   { mid: 'kazzak',   zone: 'burning',      minLevel: 55 },
    azuregos: { mid: 'azuregos', zone: 'winterspring', minLevel: 55 },
  };

  /* ============ 深入敌营 · 敌方主城限定突袭 ============ */
  // 玩家进入敌方主城(部落→暴风城 / 联盟→奥格瑞玛)后出现的限定挑战:
  // 连续 3 波守卫战 → 最终首领,每日限次 1 次发放限定奖励(专属史诗装备+金币+奥术水晶+声望)
  D.CAPITAL_RAIDS = {
    stormwind: {
      zone: 'stormwind', enemyFaction: 'alliance', minLevel: 40, daily: 1,
      name: '深入暴风城', icon: '🦁',
      desc: '潜入联盟的心脏，突破城防卫队，直面人类的国王！',
      waves: [
        { enemies: ['sw_guard', 'sw_guard'], name: '城防卫兵' },
        { enemies: ['sw_captain', 'sw_guard'], name: '皇家卫队' },
        { enemies: ['sw_king'], name: '乌瑞恩国王' },
      ],
      boss: 'sw_king',
      rewards: { gold: 9000, crystal: 2, rep: 'og', repAmt: 1500, items: ['w_royal_blade', 'a_royal_plate', 'tr_royal_signet'] },
    },
    orgrimmar: {
      zone: 'orgrimmar', enemyFaction: 'horde', minLevel: 40, daily: 1,
      name: '深入奥格瑞玛', icon: '🐺',
      desc: '深入部落的堡垒，突破库卡隆卫队，直面大酋长！',
      waves: [
        { enemies: ['og_guard', 'og_guard'], name: '库卡隆卫兵' },
        { enemies: ['og_captain', 'og_guard'], name: '库卡隆精英' },
        { enemies: ['og_warchief'], name: '大酋长萨尔' },
      ],
      boss: 'og_warchief',
      rewards: { gold: 9000, crystal: 2, rep: 'sw', repAmt: 1500, items: ['w_warchief_axe', 'a_warchief_plate', 'tr_warchief_totem'] },
    },
  };

  // 跨大陆直达航线:飞艇/远洋商船(双向),减少中长距离奔波——旅行面板标注独立徽标并可直达
  D.AIRSHIPS = {
    stormwind: { icon: '🚁', name: '飞艇', to: ['orgrimmar'] },
    orgrimmar: { icon: '🚁', name: '飞艇', to: ['stormwind'] },
    westfall: { icon: '⛵', name: '远洋商船', to: ['dustwallow'] },
    dustwallow: { icon: '⛵', name: '远洋商船', to: ['westfall'] },
  };

  /* ============ 任务 ============ */
  const Q = (id, name, zone, level, desc, target, count, exp, gold, rewardItems, opts) => Object.assign({
    id, name, zone, level, desc, type: 'kill', target, count, exp, gold,
    rewardItems: rewardItems || [], giver: '悬赏板',
  }, opts || {});

  D.QUESTS = {
    q_boar:   Q('q_boar', '猎杀野猪', 'elwynn', 1, '北郡的野猪泛滥成灾，请猎杀 6 只森林野猪。', 'elwynn_boar', 6, 90, 150, ['m_dust']),
    q_bandit: Q('q_bandit', '迪菲亚情报', 'elwynn', 3, '迪菲亚强盗正在北郡活动，消灭 5 名迪菲亚强盗。', 'elwynn_bandit', 5, 260, 400, ['w_short_sword', 'm_dust']),
    q_hogger: Q('q_hogger', '霍格的末日', 'elwynn', 5, '霍格是艾尔文森林的梦魇，击败这个精英怪物！', 'hogger', 1, 800, 1200, ['a_boots', 'a_neck', 'tr_brass_charm']),
    q_golem:  Q('q_golem', '收割者的威胁', 'westfall', 8, '收割傀儡毁坏了农场，摧毁 6 个收割傀儡。', 'westfall_golem', 6, 520, 700, ['a_ring', 'm_dust', 'm_dust']),
    q_lizard: Q('q_lizard', '蜥蜴的毒液', 'redridge', 11, '赤脊山的蜥蜴毒液污染了湖水，猎杀 5 只赤脊山蜥蜴。', 'redridge_lizard', 5, 700, 850, ['a_wolf_cloak', 'm_dust', 'm_essence']),
    q_redridge_orcs: Q('q_redridge_orcs', '黑石兽人的威胁', 'redridge', 12, '黑石兽人在湖畔镇附近劫掠商旅，消灭 6 名黑石兽人。', 'redridge_orc', 6, 950, 1100, ['a_circlet', 'tr_boar_talisman']),
    q_ghoul:  Q('q_ghoul', '腐烂之心', 'duskwood', 14, '暮色森林的食尸鬼日益猖獗，消灭 8 只腐烂食尸鬼。', 'dusk_ghoul', 8, 1400, 1600, ['a_blue', 'm_essence']),
    q_hound:  Q('q_hound', '暗影猎犬的嚎叫', 'duskwood', 15, '暗影猎犬在夜色中游荡袭击行人，猎杀 6 只暗影猎犬。', 'dusk_hound', 6, 1300, 1500, ['a_band', 'm_essence', 'm_essence']),
    q_arugal: Q('q_arugal', '阿鲁高之影', 'duskwood', 17, '阿鲁高之影统治着暮色森林的黑暗，击败这个精英！', 'arugal_shadow', 1, 2400, 2800, ['w_warblade', 'm_crystal']),
    q_durotar_boar: Q('q_durotar_boar', '磨砺之爪', 'durotar', 1, '新战士需要证明自己，猎杀 6 只杜隆塔尔野猪。', 'durotar_boar', 6, 90, 150, ['m_dust']),
    q_centaur: Q('q_centaur', '半人马的威胁', 'barrens', 9, '半人马在贫瘠之地劫掠商队，消灭 6 名半人马强盗。', 'barrens_centaur', 6, 600, 800, ['a_ring', 'm_dust']),
    q_lion:   Q('q_lion', '草原霸主', 'barrens', 8, '平原狮威胁着部落的补给线，猎杀 5 只平原狮。', 'barrens_lion', 5, 480, 650, ['a_boots', 'm_dust']),
    q_quill:  Q('q_quill', '钢鬃的崛起', 'barrens', 13, '钢鬃野猪人聚集势力威胁部落，消灭 6 名钢鬃野猪人。', 'barrens_quill', 6, 1000, 1200, ['a_steel_boots', 'm_essence']),
    q_dm:     Q('q_dm', '死亡矿井的覆灭', 'deadmines', 15, '深入死亡矿井，击败迪菲亚首领范克里夫！', 'vancleef', 1, 3000, 3000, ['vancleef_fang', 'm_crystal', 'm_essence'], { giver: '机密委托' }),
    q_wc:     Q('q_wc', '哀嚎洞穴的秘密', 'wailing_caverns', 14, '净化哀嚎洞穴，击败邪恶的古神眷族穆坦努斯！', 'mutanus', 1, 2800, 2800, ['a_blue', 'm_crystal', 'm_essence'], { giver: '机密委托' }),
    /* 荆棘谷 */
    q_stv_panther: Q('q_stv_panther', '丛林猎手', 'stv', 18, '荆棘谷的丛林豹捕食商队驮马，猎杀 6 只丛林豹。', 'stv_panther', 6, 1200, 1400, ['a_stv_cloak', 'a_stv_gloves', 'm_essence']),
    q_stv_elite:   Q('q_stv_elite', '血帆的覆灭', 'stv', 24, '血帆海盗船长盘踞南海岸，击败这个精英海盗！', 'stv_elite', 1, 2600, 3000, ['w_stv_machete', 'tr_ember_heart']),
    /* 荒芜之地 */
    q_badlands_scorpion: Q('q_badlands_scorpion', '毒尾的威胁', 'badlands', 26, '沙地巨蝎的毒液让探险队损失惨重，猎杀 6 只沙地巨蝎。', 'badlands_scorpion', 6, 1700, 1900, ['a_badlands_boots', 'a_badlands_ring', 'm_essence']),
    q_badlands_elite: Q('q_badlands_elite', '熔岩守护者', 'badlands', 32, '熔岩犬首领盘踞在火山口，击败这个精英守护者！', 'badlands_elite', 1, 3600, 4000, ['w_grim_staff', 'm_crystal']),
    /* 灼热峡谷 */
    q_searing_lava: Q('q_searing_lava', '熔岩元素暴动', 'searing', 34, '灼热峡谷的熔岩元素躁动不安，摧毁 7 个熔岩元素。', 'searing_lava', 7, 2400, 2600, ['a_searing_legs', 'm_essence', 'm_essence']),
    q_searing_elite: Q('q_searing_elite', '黑铁督军', 'searing', 40, '黑铁督军统领着峡谷的矮人部队，击败这个精英！', 'searing_elite', 1, 5200, 5600, ['w_steam_saber', 'tr_imperial_seal']),
    /* 燃烧平原 */
    q_burning_dragon: Q('q_burning_dragon', '大熔炉的龙兽', 'burning', 44, '黑石山的龙兽不断袭击营地，猎杀 5 只大熔炉龙兽。', 'burning_dragon', 5, 3400, 3700, ['a_blackrock_helm', 'm_essence']),
    q_burning_elite: Q('q_burning_elite', '守望者', 'burning', 48, '大熔炉守卫是黑石山的最后防线，击败这个精英！', 'burning_elite', 1, 7000, 7500, ['w_drake_blade', 'm_crystal']),
    /* 冬泉谷 */
    q_winter_giant: Q('q_winter_giant', '冰霜巨人的咆哮', 'winterspring', 52, '冰霜巨人踏平了冬泉谷的营地，猎杀 5 个冰霜巨人。', 'winter_giant', 5, 5000, 5400, ['a_winter_gloves', 'm_crystal']),
    q_winter_elite: Q('q_winter_elite', '深冬之影', 'winterspring', 56, '极光下的深冬之影是这片冰原的主宰，击败这个精英！', 'winter_elite', 1, 12000, 13000, ['w_arcane_blade', 'tr_naaru_tear', 'm_crystal']),
    /* 千针石林 */
    q_needle_coyote: Q('q_needle_coyote', '荒漠郊狼的夜嚎', 'thousand_needles', 19, '荒漠郊狼成群袭击牧民，猎杀 6 只荒漠郊狼。', 'needle_coyote', 6, 1250, 1450, ['a_stv_helm', 'm_essence']),
    q_needle_elite: Q('q_needle_elite', '雷角酋长', 'thousand_needles', 24, '雷角酋长率半人马劫掠石林商道，击败这个精英！', 'needle_elite', 1, 2600, 3000, ['w_jungle_staff', 'm_crystal']),
    /* 尘泥沼泽 */
    q_marsh_croc: Q('q_marsh_croc', '沼泽巨鳄', 'dustwallow', 27, '巨型沼泽鳄鱼阻塞了水路运输，猎杀 6 只巨型沼泽鳄鱼。', 'marsh_croc', 6, 1750, 1950, ['a_badlands_plate', 'a_marsh_chest', 'm_essence']),
    q_marsh_elite: Q('q_marsh_elite', '沼泽巫医', 'dustwallow', 32, '沼泽巫医的诅咒笼罩着整个泥沼，击败这个精英！', 'marsh_elite', 1, 3600, 4000, ['w_badlands_hammer', 'm_crystal']),
    /* 塔纳利斯 */
    q_tanaris_scorpion: Q('q_tanaris_scorpion', '沙漠毒蝎王', 'tanaris', 35, '沙漠毒蝎王侵扰热砂港，猎杀 7 只沙漠毒蝎王。', 'tanaris_scorpion', 7, 2500, 2700, ['a_searing_mail', 'm_essence']),
    q_tanaris_elite: Q('q_tanaris_elite', '沙怒酋长', 'tanaris', 40, '沙怒酋长在古都废墟集结亡灵大军，击败这个精英！', 'tanaris_elite', 1, 5200, 5600, ['w_flame_staff', 'm_crystal']),
    /* 安戈洛环形山 */
    q_ungoro_dino: Q('q_ungoro_dino', '远古巨兽', 'ungoro', 44, '环形山剑龙的冲撞毁坏了补给站，猎杀 5 只剑龙。', 'ungoro_dino', 5, 3400, 3700, ['a_blackrock_helm', 'm_essence']),
    q_ungoro_elite: Q('q_ungoro_elite', '环形山巨兽', 'ungoro', 48, '环形山巨兽是这片原始之地的王者，击败这个精英！', 'ungoro_elite', 1, 7000, 7500, ['w_drake_blade', 'm_crystal']),
    /* 瘟疫之地 */
    q_plague_abom: Q('q_plague_abom', '天灾的走狗', 'plaguelands', 53, '憎恶是瘟疫之地最凶残的天灾造物，摧毁 5 只憎恶。', 'plague_abomination', 5, 5200, 5600, ['a_winter_cloak', 'm_crystal']),
    q_plague_elite: Q('q_plague_elite', '巫妖之影', 'plaguelands', 56, '巫妖之影统领着瘟疫之地的亡灵军团，击败这个精英！', 'plague_elite', 1, 12000, 13000, ['a_dragonscale', 'm_crystal', 'm_crystal']),
    /* 新副本 */
    q_brd: Q('q_brd', '黑石深渊的诅咒', 'blackrock_depths', 46, '深入黑石深渊，击败黑铁王朝的君主达格兰·索瑞森大帝！', 'emperor_thaurissan', 1, 15000, 15000, ['w_ice_guardian', 'm_crystal', 'm_crystal'], { giver: '机密委托' }),
    q_zf:  Q('q_zf', '祖尔法拉克的秘宝', 'zulfarrak', 38, '潜入祖尔法拉克古都，击败沙怒巨魔的统治者乌克兹·沙顶！', 'zhuzhun', 1, 12000, 12000, ['a_emperor_plate', 'm_crystal', 'm_crystal'], { giver: '机密委托' }),
    q_sfk:  Q('q_sfk', '影牙城堡的诅咒', 'shadowfang_keep', 20, '深入影牙城堡，终结狼人诅咒的源头阿鲁高！', 'arugal', 1, 4200, 4200, ['w_arugal_staff', 'm_crystal', 'm_essence'], { giver: '机密委托' }),
    q_uldaman: Q('q_uldaman', '奥达曼的石板', 'uldaman', 32, '找回泰坦遗迹中失落的神秘石板，击败守护者阿扎达斯！', 'archaledas', 1, 7000, 7000, ['a_uld_plate', 'm_crystal', 'm_essence'], { giver: '机密委托' }),
    q_maraudon: Q('q_maraudon', '玛拉顿的净化', 'maraudon', 36, '净化被污染的泉水，击败堕落的瑟莱德丝公主！', 'princess_theradras', 1, 9000, 9000, ['a_theradras_crown', 'm_crystal', 'm_essence'], { giver: '机密委托' }),
    q_scholomance: Q('q_scholomance', '通灵学院的末日', 'scholomance', 55, '摧毁天灾的学府，击败黑暗院长加丁！', 'gandling', 1, 16000, 16000, ['w_gandling_book', 'm_crystal', 'm_crystal'], { giver: '机密委托' }),
    q_naxxramas: Q('q_naxxramas', '纳克萨玛斯的降临', 'naxxramas', 58, '远征悬浮天际的巫妖要塞，击败克尔苏加德！', 'kelthuzad', 1, 26000, 26000, ['tr_kelthuzad_heart', 'm_crystal', 'm_crystal'], { giver: '机密委托' }),
    /* 全地图任务扩充(+19) */
    q_elwynn_wolf:  Q('q_elwynn_wolf', '灰狼之患', 'elwynn', 2, '灰狼袭击了北郡的农场牲畜，猎杀 5 只灰狼。', 'elwynn_wolf', 5, 200, 280, ['a_boots', 'm_dust']),
    q_elwynn_kobold: Q('q_elwynn_kobold', '矿工的麻烦', 'elwynn', 3, '狗头人矿工霸占了北郡的矿洞，赶走 6 名狗头人矿工。', 'elwynn_kobold', 6, 240, 320, ['a_cloth', 'm_dust']),
    q_westfall_gnoll: Q('q_westfall_gnoll', '豺狼人的围攻', 'westfall', 9, '豺狼人战士不断袭扰西部荒野的哨所，消灭 6 名豺狼人战士。', 'westfall_gnoll', 6, 620, 800, ['a_wolf_cloak', 'm_dust']),
    q_westfall_croc: Q('q_westfall_croc', '死沼鳄鱼', 'westfall', 10, '死沼鳄鱼阻塞了水路交通，猎杀 5 只死沼鳄鱼。', 'westfall_croc', 5, 700, 900, ['a_ring', 'm_essence']),
    q_redridge_ogre: Q('q_redridge_ogre', '食人魔的劫掠', 'redridge', 13, '石锤食人魔抢劫湖畔镇的商队，消灭 4 名石锤食人魔。', 'redridge_ogre', 4, 900, 1000, ['a_legs', 'm_essence']),
    q_dusk_spider: Q('q_dusk_spider', '毒蛛之巢', 'duskwood', 16, '暮色毒蛛在蛛网谷繁殖蔓延，摧毁 5 只暮色毒蛛。', 'dusk_spider', 5, 1300, 1500, ['a_band', 'm_essence']),
    q_durotar_scorpion: Q('q_durotar_scorpion', '蝎毒之患', 'durotar', 3, '沙漠毒蝎的尾针携带剧毒，猎杀 5 只沙漠毒蝎。', 'durotar_scorpion', 5, 190, 260, ['a_cloth', 'm_dust']),
    q_durotar_centaur: Q('q_durotar_centaur', '斥候的密信', 'durotar', 5, '半人马斥候窥探部落营地，消灭 4 名半人马斥候。', 'durotar_centaur', 4, 300, 380, ['a_boots', 'm_dust']),
    q_barrens_lizard: Q('q_barrens_lizard', '雷霆蜥蜴', 'barrens', 11, '雷霆蜥蜴的静电破坏了三号水井，猎杀 5 只雷霆蜥蜴。', 'barrens_lizard', 5, 850, 950, ['a_band', 'm_essence']),
    q_stv_tiger: Q('q_stv_tiger', '猛虎之牙', 'stv', 21, '荆棘谷猛虎袭击了探险营地，猎杀 5 只荆棘谷猛虎。', 'stv_tiger', 5, 1500, 1700, ['a_stv_helm', 'm_essence']),
    q_badlands_vulture: Q('q_badlands_vulture', '秃鹫盘旋', 'badlands', 29, '荒原秃鹫群啃食商队遗体，射杀 5 只秃鹫。', 'badlands_vulture', 5, 2100, 2300, ['a_badlands_boots', 'm_essence']),
    q_searing_dwarf: Q('q_searing_dwarf', '黑铁矿工', 'searing', 35, '黑铁矮人矿工挖穿了地下河道，驱逐 6 名黑铁矮人矿工。', 'searing_dwarf', 6, 2700, 2900, ['a_searing_legs', 'm_essence']),
    q_burning_hound: Q('q_burning_hound', '熔核猎犬', 'burning', 45, '熔核猎犬群袭击了营地补给线，猎杀 5 只熔核猎犬。', 'burning_hound', 5, 3600, 3900, ['a_blackrock_helm', 'm_crystal']),
    q_winter_owl: Q('q_winter_owl', '雪原枭兽', 'winterspring', 53, '雪原枭兽的嚎叫扰乱了冬泉谷的平静，猎杀 5 只雪原枭兽。', 'winter_owl', 5, 5200, 5600, ['a_winter_cloak', 'm_crystal']),
    q_needle_turtle: Q('q_needle_turtle', '深水巨龟', 'thousand_needles', 21, '深水龟爬上了石林湖岸践踏作物，驱离 5 只深水龟。', 'needle_turtle', 5, 1500, 1700, ['a_stv_cloak', 'm_essence']),
    q_marsh_spider: Q('q_marsh_spider', '沼泽毒蛛', 'dustwallow', 29, '沼泽毒蛛在哨塔四周结网封锁道路，清除 5 只沼泽毒蛛。', 'marsh_spider', 5, 2100, 2300, ['a_badlands_plate', 'm_essence']),
    q_tanaris_turtle: Q('q_tanaris_turtle', '硬壳海龟', 'tanaris', 37, '硬壳海龟群堵塞了热砂港航道，驱逐 5 只硬壳海龟。', 'tanaris_turtle', 5, 2800, 3000, ['a_searing_mail', 'm_essence']),
    q_ungoro_gorilla: Q('q_ungoro_gorilla', '巨型猩猩', 'ungoro', 43, '巨型猩猩砸毁了环形山的采集站，赶走 5 只巨型猩猩。', 'ungoro_gorilla', 5, 3500, 3800, ['a_blackrock_helm', 'm_essence']),
    q_plague_bat: Q('q_plague_bat', '瘟疫蝙蝠', 'plaguelands', 51, '瘟疫蝙蝠群在毒雾中盘旋觅食，猎杀 5 只瘟疫蝙蝠。', 'plague_bat', 5, 5100, 5500, ['a_winter_leather', 'm_crystal']),
    q_bl_mauler: Q('q_bl_mauler', '深渊的爪牙', 'blasted_lands', 49, '诅咒之地的恶魔正在集结，消灭 6 只恶魔卫士。', 'bl_mauler', 6, 7200, 7600, ['a_blasted_plate', 'm_essence']),
    q_bl_elite: Q('q_bl_elite', '深渊领主', 'blasted_lands', 52, '深渊领主把守着黑暗之门，击败这个精英！', 'bl_elite', 1, 9000, 9500, ['w_doom_cleaver', 'm_crystal']),
    q_fel_satyr: Q('q_fel_satyr', '森林的腐化', 'felwood', 51, '萨特正在腐化费伍德的古老林地，消灭 6 只萨特。', 'fel_satyr', 6, 7400, 7800, ['a_felwood_robe', 'm_essence']),
    q_fel_elite: Q('q_fel_elite', '末日守卫', 'felwood', 55, '末日守卫在费伍德深处降临，击败这个精英！', 'fel_elite', 1, 10500, 11000, ['a_epl_helm', 'm_crystal']),
    q_azz_drake: Q('q_azz_drake', '蓝龙的幼崽', 'azshara', 52, '蓝龙幼崽在艾萨拉海岸肆虐，消灭 5 只蓝龙幼崽。', 'azz_drake', 5, 7600, 8000, ['w_necropolis_staff', 'm_essence']),
    q_azz_elite: Q('q_azz_elite', '大奥术师', 'azshara', 55, '艾萨拉遗迹中的大奥术师掌握了禁忌法术，击败他！', 'azz_elite', 1, 10800, 11500, ['tr_blasted_seal', 'm_crystal']),
    q_epl_abom: Q('q_epl_abom', '憎恶的威胁', 'eplaguelands', 58, '巨型憎恶在东瘟疫之地横行，消灭 5 只巨型憎恶。', 'epl_abom', 5, 13000, 14000, ['a_silithid_chitin', 'm_crystal']),
    q_epl_elite: Q('q_epl_elite', '亡灵将军', 'eplaguelands', 60, '亡灵将军统率着东瘟疫的大军，击败这个精英！', 'epl_elite', 1, 16000, 17000, ['w_silithid_stinger', 'm_crystal']),
    q_sil_beetle: Q('q_sil_beetle', '虫群涌动', 'silithus', 59, '巨型甲虫正从希利苏斯的沙丘下涌出，消灭 6 只巨型甲虫。', 'sil_beetle', 6, 13500, 14500, ['a_epl_helm', 'm_essence']),
    q_sil_elite: Q('q_sil_elite', '虫巢领主', 'silithus', 60, '虫巢领主在希利苏斯深处指挥虫群，击败这个精英！', 'sil_elite', 1, 16500, 17500, ['a_silithid_chitin', 'm_crystal']),
    q_blackrock_spire: Q('q_blackrock_spire', '黑石塔的征服', 'blackrock_spire', 56, '攻入黑石塔，击败达基萨斯将军！', 'drakkisath', 1, 17500, 17500, ['w_drakkisath_axe', 'm_crystal', 'm_crystal'], { giver: '机密委托' }),
    q_stratholme: Q('q_stratholme', '斯坦索姆的亡魂', 'stratholme', 57, '净化斯坦索姆，击败瑞文戴尔男爵！', 'rivendare', 1, 18500, 18500, ['w_rivendare_blade', 'm_crystal', 'm_crystal'], { giver: '机密委托' }),
    q_dire_maul: Q('q_dire_maul', '厄运之槌的幻象', 'dire_maul', 56, '深入厄运之槌，击败恶魔伊莫塔尔！', 'immolthar', 1, 17800, 17800, ['w_immolthar_staff', 'm_crystal', 'm_crystal'], { giver: '机密委托' }),
    q_molten_core: Q('q_molten_core', '火焰领主的末日', 'molten_core', 60, '远征熔火之心，击败火焰领主拉格纳罗斯！', 'ragnaros', 1, 30000, 30000, ['w_ragnaros_hand', 'm_crystal', 'm_crystal'], { giver: '机密委托' }),
    q_blackwing_lair: Q('q_blackwing_lair', '黑龙的阴谋', 'blackwing_lair', 60, '摧毁黑翼之巢，击败奈法利安！', 'nefarian', 1, 31000, 31000, ['w_nefarian_blade', 'm_crystal', 'm_crystal'], { giver: '机密委托' }),
    q_onyxias_lair: Q('q_onyxias_lair', '黑龙公主', 'onyxias_lair', 60, '深入奥妮克希亚的巢穴，击败黑龙公主！', 'onyxia', 1, 29000, 29000, ['a_onyxia_scale', 'm_crystal', 'm_crystal'], { giver: '机密委托' }),
    q_zulgurub: Q('q_zulgurub', '血神的祭坛', 'zulgurub', 60, '阻止哈卡的血祭，击败血神哈卡！', 'hakkar', 1, 29500, 29500, ['tr_hakkar_heart', 'm_crystal', 'm_crystal'], { giver: '机密委托' }),
    q_ruins_ahnqiraj: Q('q_ruins_ahnqiraj', '安其拉废墟', 'ruins_ahnqiraj', 60, '攻破安其拉废墟，击败拉贾克斯将军！', 'rajaxx', 1, 28500, 28500, ['a_cthun_armor', 'm_crystal', 'm_crystal'], { giver: '机密委托' }),
    q_temple_ahnqiraj: Q('q_temple_ahnqiraj', '千眼之魔', 'temple_ahnqiraj', 60, '踏入安其拉神殿，击败古神克苏恩！', 'cthun', 1, 35000, 35000, ['tr_cthun_eye', 'm_crystal', 'm_crystal'], { giver: '机密委托' }),
    /* ===== 新增 8 副本任务 ===== */
    q_ragefire: Q('q_ragefire', '怒焰裂谷的邪火', 'ragefire_chasm', 16, '深入奥格瑞玛地下的怒焰裂谷，击败杰尔戈什·召唤者！', 'jergosh', 1, 1400, 1100, ['w_rfc_ritual_dagger', 'm_crystal', 'm_essence'], { giver: '机密委托' }),
    q_stockade: Q('q_stockade', '暴风城监狱的暴动', 'stockade', 26, '平息暴风城监狱的越狱暴动，击败巴基·斯奈德！', 'thredd', 1, 3200, 2500, ['w_skd_shiv', 'm_crystal', 'm_essence'], { giver: '机密委托' }),
    q_blackfathom: Q('q_blackfathom', '黑暗深渊的恐惧', 'blackfathom_deeps', 26, '净化黑暗深渊，击败深渊中的阿库麦尔！', 'akumai', 1, 3100, 2450, ['a_bfd_coral', 'm_crystal', 'm_essence'], { giver: '机密委托' }),
    q_gnomeregan: Q('q_gnomeregan', '诺莫瑞根的辐射', 'gnomeregan', 30, '终结诺莫瑞根的辐射灾难，击败瑟玛普拉格！', 'thermaplugg', 1, 4600, 3600, ['w_gno_blast_gun', 'm_crystal', 'm_essence'], { giver: '机密委托' }),
    q_razorfen_kraul: Q('q_razorfen_kraul', '剃刀沼泽的威胁', 'razorfen_kraul', 31, '肃清剃刀沼泽的野猪人，击败卡尔加·刺肋！', 'charlga', 1, 4800, 3750, ['w_rfk_razor_axe', 'm_crystal', 'm_essence'], { giver: '机密委托' }),
    q_razorfen_downs: Q('q_razorfen_downs', '剃刀高地的诅咒', 'razorfen_downs', 40, '打破剃刀高地的亡灵诅咒，击败阿姆纳尔·冷铸者！', 'amnennar', 1, 9000, 7000, ['w_rfd_cold_blade', 'm_crystal', 'm_essence'], { giver: '机密委托' }),
    q_scarlet_monastery: Q('q_scarlet_monastery', '血色十字军的狂热', 'scarlet_monastery', 41, '攻入血色修道院，击败大检察官怀特迈恩！', 'whitemane', 1, 9500, 7400, ['a_sm_scarlet_robe', 'm_crystal', 'm_essence'], { giver: '机密委托' }),
    q_sunken_temple: Q('q_sunken_temple', '沉没的神庙之秘', 'sunken_temple', 51, '深入沉没的神庙，击败哈卡的化身！', 'avatar_hakkar', 1, 15000, 11500, ['w_st_temple_blade', 'm_crystal', 'm_essence'], { giver: '机密委托' }),
  };

  /* 区域可用怪物 -> 组队遭遇(高等级区域出现双怪) */
  D.ENCOUNTERS = {
    elwynn:   [[1, ['elwynn_boar']], [1, ['elwynn_wolf']], [1, ['elwynn_kobold']], [0.8, ['elwynn_bandit']], [0.15, ['hogger']]],
    westfall: [[1, ['westfall_golem']], [1, ['westfall_gnoll']], [0.8, ['westfall_sailor']], [0.5, ['westfall_croc']], [0.35, ['westfall_sailor', 'westfall_gnoll']]],
    redridge: [[1, ['redridge_lizard']], [0.8, ['redridge_orc']], [0.6, ['redridge_ogre']], [0.3, ['redridge_orc', 'redridge_lizard']]],
    duskwood: [[1, ['dusk_ghoul']], [0.8, ['dusk_hound']], [0.6, ['dusk_spider']], [0.25, ['dusk_ghoul', 'dusk_hound']], [0.1, ['arugal_shadow']]],
    durotar:  [[1, ['durotar_boar']], [0.9, ['durotar_scorpion']], [0.7, ['durotar_traitor']], [0.4, ['durotar_centaur']]],
    barrens:  [[1, ['barrens_lion']], [0.9, ['barrens_centaur']], [0.6, ['barrens_lizard']], [0.5, ['barrens_quill']], [0.3, ['barrens_lion', 'barrens_centaur']]],
    stv:      [[1, ['stv_panther']], [0.9, ['stv_ape']], [0.7, ['stv_tiger']], [0.6, ['stv_basilisk']], [0.4, ['stv_tiger', 'stv_ape']], [0.12, ['stv_elite']]],
    badlands: [[1, ['badlands_wolf']], [0.9, ['badlands_scorpion']], [0.8, ['badlands_basilisk']], [0.7, ['badlands_vulture']], [0.6, ['badlands_ogre']], [0.6, ['badlands_raptor']], [0.35, ['badlands_wolf', 'badlands_scorpion']], [0.12, ['badlands_elite']]],
    searing:  [[1, ['searing_lava']], [0.9, ['searing_dwarf']], [0.8, ['searing_lizard']], [0.8, ['searing_wolf']], [0.6, ['searing_elemental']], [0.6, ['searing_whelp']], [0.3, ['searing_lava', 'searing_dwarf']], [0.1, ['searing_elite']]],
    burning:  [[1, ['burning_whelp']], [0.9, ['burning_orc']], [0.7, ['burning_hound']], [0.6, ['burning_dragon']], [0.3, ['burning_hound', 'burning_orc']], [0.1, ['burning_elite']]],
    winterspring: [[1, ['winter_frostwolf']], [0.9, ['winter_yeti']], [0.7, ['winter_owl']], [0.6, ['winter_giant']], [0.3, ['winter_yeti', 'winter_frostwolf']], [0.1, ['winter_elite']]],
    blasted_lands: [[1, ['bl_hellhound']], [0.9, ['bl_mauler']], [0.7, ['bl_raptor']], [0.6, ['bl_imp']], [0.3, ['bl_hellhound', 'bl_mauler']], [0.1, ['bl_elite']]],
    felwood: [[1, ['fel_satyr']], [0.9, ['fel_treant']], [0.7, ['fel_worg']], [0.6, ['fel_spore']], [0.3, ['fel_satyr', 'fel_worg']], [0.1, ['fel_elite']]],
    azshara: [[1, ['azz_naga']], [0.9, ['azz_lizard']], [0.7, ['azz_drake']], [0.6, ['azz_ogre']], [0.3, ['azz_naga', 'azz_drake']], [0.1, ['azz_elite']]],
    eplaguelands: [[1, ['epl_ghoul']], [0.9, ['epl_gargoyle']], [0.7, ['epl_abom']], [0.6, ['epl_necromancer']], [0.3, ['epl_ghoul', 'epl_necromancer']], [0.1, ['epl_elite']]],
    silithus: [[1, ['sil_sandcrawler']], [0.9, ['sil_beetle']], [0.7, ['sil_soldier']], [0.6, ['sil_scarab']], [0.3, ['sil_beetle', 'sil_scarab']], [0.1, ['sil_elite']]],
    thousand_needles: [[1, ['needle_vulture']], [0.9, ['needle_coyote']], [0.7, ['needle_turtle']], [0.6, ['needle_centaur']], [0.35, ['needle_coyote', 'needle_vulture']], [0.12, ['needle_elite']]],
    dustwallow: [[1, ['marsh_croc']], [0.9, ['marsh_slime']], [0.8, ['marsh_turtle']], [0.7, ['marsh_spider']], [0.6, ['marsh_ogre']], [0.6, ['marsh_raptor']], [0.35, ['marsh_croc', 'marsh_slime']], [0.12, ['marsh_elite']]],
    tanaris:  [[1, ['tanaris_vulture']], [0.9, ['tanaris_scorpion']], [0.8, ['tanaris_wasp']], [0.7, ['tanaris_turtle']], [0.6, ['tanaris_wastewalker']], [0.6, ['tanaris_hyena']], [0.3, ['tanaris_scorpion', 'tanaris_vulture']], [0.1, ['tanaris_elite']]],
    ungoro:   [[1, ['ungoro_raptor']], [0.9, ['ungoro_gorilla']], [0.7, ['ungoro_dino']], [0.6, ['ungoro_plant']], [0.3, ['ungoro_dino', 'ungoro_raptor']], [0.1, ['ungoro_elite']]],
    plaguelands: [[1, ['plague_zombie']], [0.9, ['plague_bat']], [0.7, ['plague_knight']], [0.6, ['plague_abomination']], [0.3, ['plague_zombie', 'plague_bat']], [0.1, ['plague_elite']]],
  };







  /* ==================== 燃烧的远征(The Burning Crusade) ====================
   * 外域:7 张野外区域 + 沙塔斯城 + 时光之穴/卡拉赞/奎尔丹纳斯岛,16 座 5 人本 + 8 座团本,
   * 配套 61-70 装备/武器/传说/材料/消耗品/声望/任务/世界首领(等级上限 70)。
   * 数值口径与 scripts/audit-data.js 的品质预算带、战力曲线、掉落闭环规则一致。 */
  /* BEGIN TBC */
  (function () {
    /* ---------- 外域怪物技能(邪能 / 虚空系) ---------- */
    Object.assign(D.MONSTER_SKILLS, {
      m_fel_cleave: { id: 'm_fel_cleave', name: '邪能劈砍', icon: '🪓', sig: 1, mult: 1.6, aoe: 1, cd: 4, debuff: { key: 'fel_crush', name: '邪能压制', mod: { armorPct: -0.15 }, rounds: 2 }, desc: '邪能武器横扫全场，削碎目标的护甲。' },
      m_fel_flames: { id: 'm_fel_flames', name: '邪能烈焰', icon: '🔥', sig: 1, mult: 1.7, magic: 1, cd: 4, dot: { per: 0.07, rounds: 3 }, dotType: 'fire', desc: '灼热的邪能烈焰持续焚烧目标。' },
      m_supernova: { id: 'm_supernova', name: '星界新星', icon: '✨', sig: 1, mult: 1.5, magic: 1, aoe: 1, cd: 5, debuff: { key: 'nova_daze', name: '星界眩晕', mod: { atkPct: -0.12 }, rounds: 2 }, desc: '引爆星界能量冲击全场，干扰目标的攻击。' },
      m_void_strike: { id: 'm_void_strike', name: '虚空重击', icon: '🌑', sig: 1, mult: 1.9, magic: 1, cd: 4, dot: { per: 0.06, rounds: 3 }, dotType: 'shadow', debuff: { key: 'void_sear', name: '虚空灼伤', mod: { healTaken: -0.2 }, rounds: 2 }, desc: '虚空的裂隙撕扯目标，持续侵蚀并抑制治疗。' },
      m_nether_ward: { id: 'm_nether_ward', name: '虚空护盾', icon: '🛡️', sig: 1, healPct: 0.12, hot: { per: 0.05, rounds: 3 }, cd: 5, desc: '以虚空能量包裹自身，持续恢复生命。' },
    });

    /* ---------- 外域材料与消耗品 ---------- */
    Object.assign(D.ITEMS, {
      m_feliron: IT('m_feliron', '魔铁锭', '⛓️', 'material', 'green', 60, {}, { buy: 2200, sell: 550 }),
      m_nether: IT('m_nether', '虚空水晶', '🟣', 'material', 'epic', 66, {}, { buy: 6800, sell: 1700 }),
      c_out_heal: IT('c_out_heal', '外域治疗药水', '🧪', 'consumable', 'blue', 62, {}, { consumable: { healPct: 0.65 }, buy: 16000, sell: 4000 }),
      c_out_mana: IT('c_out_mana', '外域法力药水', '🧪', 'consumable', 'blue', 62, {}, { consumable: { manaPct: 0.6 }, buy: 16000, sell: 4000 }),
      c_nether_flask: IT('c_nether_flask', '虚空合剂', '⚗️', 'consumable', 'epic', 68, {}, { consumable: { healPct: 0.5, manaPct: 0.45 }, buy: 34000, sell: 8500 }),
    });

    /* ---------- 61-70 装备(每槽位 3 件覆盖两个等级段,属性线轮转) ---------- */
    Object.assign(D.ITEMS, {
      a_out_helm: IT('a_out_helm', '外域钢盔', '⛑️', 'head', 'blue', 62, {str: 13,stam: 4,crit: 0.03,armor: 91}, { buy: 82000, sell: 20500 }),
      a_void_hood: IT('a_void_hood', '虚空兜帽', '🎩', 'head', 'epic', 66, {int: 14,spi: 12,stam: 4,crit: 0.03,armor: 113}, { buy: 148000, sell: 37000 }),
      a_sun_crown: IT('a_sun_crown', '太阳井王冠', '👑', 'head', 'epic', 70, {agi: 18,stam: 6,crit: 0.04,armor: 121}, { buy: 162000, sell: 40500 }),
      a_out_chest: IT('a_out_chest', '外域胸甲', '🦺', 'chest', 'blue', 62, {int: 12,spi: 11,stam: 3,crit: 0.03,armor: 225}, { buy: 82000, sell: 20500 }),
      a_void_plate: IT('a_void_plate', '虚空板甲', '🛡️', 'chest', 'epic', 66, {str: 21,stam: 7,crit: 0.05,armor: 277}, { buy: 148000, sell: 37000 }),
      a_sun_robe: IT('a_sun_robe', '太阳井法袍', '🥻', 'chest', 'epic', 70, {int: 18,spi: 16,stam: 5,crit: 0.04,armor: 297}, { buy: 162000, sell: 40500 }),
      a_out_gloves: IT('a_out_gloves', '外域护手', '🧤', 'gloves', 'blue', 62, {agi: 13,stam: 4,crit: 0.03,armor: 129}, { buy: 82000, sell: 20500 }),
      a_void_gauntlets: IT('a_void_gauntlets', '虚空护手', '🧤', 'gloves', 'epic', 66, {str: 18,stam: 6,crit: 0.04,armor: 156}, { buy: 148000, sell: 37000 }),
      a_sun_gloves: IT('a_sun_gloves', '太阳井手套', '🧤', 'gloves', 'epic', 70, {agi: 20,stam: 6,crit: 0.05,armor: 164}, { buy: 162000, sell: 40500 }),
      a_out_legs: IT('a_out_legs', '外域护腿', '👖', 'legs', 'blue', 62, {str: 14,stam: 5,crit: 0.03,armor: 165}, { buy: 82000, sell: 20500 }),
      a_void_legs: IT('a_void_legs', '虚空护腿', '👖', 'legs', 'epic', 66, {agi: 20,stam: 7,crit: 0.05,armor: 201}, { buy: 148000, sell: 37000 }),
      a_sun_legs: IT('a_sun_legs', '太阳井护腿', '👖', 'legs', 'epic', 70, {int: 17,spi: 15,stam: 5,crit: 0.04,armor: 213}, { buy: 162000, sell: 40500 }),
      a_out_boots: IT('a_out_boots', '外域战靴', '🥾', 'boots', 'blue', 62, {int: 8,spi: 7,stam: 2,crit: 0.02,armor: 116}, { buy: 82000, sell: 20500 }),
      a_void_boots: IT('a_void_boots', '虚空战靴', '🥾', 'boots', 'epic', 66, {str: 14,stam: 5,crit: 0.03,armor: 140}, { buy: 148000, sell: 37000 }),
      a_sun_boots: IT('a_sun_boots', '太阳井长靴', '🥾', 'boots', 'epic', 70, {agi: 15,stam: 5,crit: 0.04,armor: 148}, { buy: 162000, sell: 40500 }),
      a_out_cloak: IT('a_out_cloak', '外域披风', '🧣', 'cloak', 'blue', 62, {agi: 9,stam: 3,crit: 0.02,armor: 55}, { buy: 82000, sell: 20500 }),
      a_void_cloak: IT('a_void_cloak', '虚空披风', '🧣', 'cloak', 'epic', 66, {int: 10,spi: 9,stam: 3,crit: 0.02,armor: 66}, { buy: 148000, sell: 37000 }),
      a_sun_cloak: IT('a_sun_cloak', '太阳井披风', '🧣', 'cloak', 'epic', 70, {str: 13,stam: 4,crit: 0.03,armor: 70}, { buy: 162000, sell: 40500 }),
      a_out_neck: IT('a_out_neck', '外域护符', '📿', 'neck', 'blue', 62, {str: 12,stam: 4,crit: 0.03}, { buy: 82000, sell: 20500 }),
      a_void_neck: IT('a_void_neck', '虚空坠饰', '📿', 'neck', 'epic', 66, {int: 13,spi: 12,stam: 4,crit: 0.03}, { buy: 148000, sell: 37000 }),
      a_sun_neck: IT('a_sun_neck', '太阳井项链', '📿', 'neck', 'epic', 70, {agi: 17,stam: 6,crit: 0.04}, { buy: 162000, sell: 40500 }),
      a_out_ring: IT('a_out_ring', '外域指环', '💍', 'ring', 'blue', 62, {int: 11,spi: 10,stam: 3,crit: 0.02}, { buy: 82000, sell: 20500 }),
      a_void_ring: IT('a_void_ring', '虚空指环', '💍', 'ring', 'epic', 66, {agi: 19,stam: 6,crit: 0.04}, { buy: 148000, sell: 37000 }),
      a_sun_ring: IT('a_sun_ring', '太阳井戒指', '💍', 'ring', 'epic', 70, {str: 20,stam: 6,crit: 0.05}, { buy: 162000, sell: 40500 }),
      tr_out_signet: IT('tr_out_signet', '外域徽记', '🔮', 'trinket', 'blue', 62, {agi: 15,stam: 5,crit: 0.03}, { buy: 82000, sell: 20500 }),
      tr_void_eye: IT('tr_void_eye', '虚空之眼', '👁️', 'trinket', 'epic', 66, {int: 16,spi: 14,stam: 4,crit: 0.04}, { buy: 148000, sell: 37000 }),
      tr_sun_seal: IT('tr_sun_seal', '太阳井印记', '🔆', 'trinket', 'epic', 70, {str: 21,stam: 7,crit: 0.05}, { buy: 162000, sell: 40500 }),
      w_off_out_shield: IT('w_off_out_shield', '外域盾牌', '🛡️', 'offhand', 'blue', 62, {str: 14,stam: 4,crit: 0.03,armor: 33}, { buy: 82000, sell: 20500 }),
      w_off_void_totem: IT('w_off_void_totem', '虚空图腾', '🪬', 'offhand', 'epic', 66, {int: 15,spi: 13,stam: 4,crit: 0.03,armor: 40}, { buy: 148000, sell: 37000 }),
      w_off_sun_blade: IT('w_off_sun_blade', '太阳井副刃', '🗡️', 'offhand', 'epic', 70, {agi: 20,stam: 6,crit: 0.05,armor: 44}, { buy: 162000, sell: 40500 }),
    });

    /* ---------- 外域武器(物理/敏捷/法系三线,61-69 逐段可换) ---------- */
    Object.assign(D.ITEMS, {
      w_outland_blade: IT('w_outland_blade', '外域战刃', '⚔️', 'weapon', 'blue', 61, {dmg: [98,142],str: 18,stam: 12,crit: 0.02}, { buy: 81000, sell: 20250 }),
      w_zangar_claw: IT('w_zangar_claw', '赞加裂爪', '🗡️', 'weapon', 'blue', 63, {dmg: [102,146],agi: 20,crit: 0.03}, { buy: 84000, sell: 21000 }),
      w_shattered_blade: IT('w_shattered_blade', '破碎之刃', '⚔️', 'weapon', 'blue', 65, {dmg: [102,146],str: 22,stam: 12,crit: 0.03}, { buy: 86000, sell: 21500 }),
      w_nether_edge: IT('w_nether_edge', '虚空之刃', '🗡️', 'weapon', 'blue', 67, {dmg: [106,158],agi: 26,crit: 0.04}, { buy: 88000, sell: 22000 }),
      w_outland_staff: IT('w_outland_staff', '外域法杖', '🪄', 'weapon', 'blue', 61, {dmg: [86,122],int: 24,spi: 16,crit: 0.02}, { buy: 81000, sell: 20250 }),
      w_nether_staff: IT('w_nether_staff', '虚空法杖', '🪄', 'weapon', 'blue', 65, {dmg: [90,126],int: 26,spi: 18,crit: 0.03}, { buy: 86000, sell: 21500 }),
    });

    /* ---------- 传说武器 / 传说饰品(预算按同槽位同线最强史诗 ≥1.3× 反推,橙色确实更强) ---------- */
    Object.assign(D.ITEMS, {
      w_black_temple_blade: IT('w_black_temple_blade', '黑暗神殿战刃', '⚔️', 'weapon', 'legendary', 69, {dmg: [196,284],str: 34,stam: 20,crit: 0.05}, { sell: 220000 }),
      w_void_staff: IT('w_void_staff', '虚空风暴法杖', '🪄', 'weapon', 'legendary', 68, {dmg: [164,236],int: 42,spi: 26,crit: 0.05}, { sell: 220000 }),
      w_warglaive: IT('w_warglaive', '埃辛诺斯战刃', '🗡️', 'weapon', 'legendary', 70, {dmg: [280,400],agi: 44,crit: 0.09}, { sell: 220000 }),
      w_thori_dal: IT('w_thori_dal', '索利达尔·群星之怒', '🏹', 'weapon', 'legendary', 70, {dmg: [272,388],agi: 36,hit: 0.04,lifesteal: 0.03}, { sell: 220000 }),
      w_naaru_staff: IT('w_naaru_staff', '纳鲁的恩典', '🪄', 'weapon', 'legendary', 70, {dmg: [248,352],int: 52,spi: 32,crit: 0.06}, { sell: 220000 }),
      tr_skull_guldan: IT('tr_skull_guldan', '古尔丹之颅', '💀', 'trinket', 'legendary', 70, {int: 28,spi: 25,stam: 8,crit: 0.06}, { sell: 200000 }),
    });

    /* ---------- 外域商店与副本掉落池 ---------- */
    const TBC_SHOP = {
      hellfire: ['a_out_helm','a_out_chest','a_out_legs','a_out_boots','w_outland_blade','w_outland_staff','tr_out_signet','a_out_neck','c_out_heal','c_out_mana','m_feliron','m_nether'],
      zangarmarsh: ['a_out_helm','a_out_chest','a_out_gloves','a_out_cloak','a_out_ring','w_outland_staff','w_zangar_claw','c_out_heal','c_out_mana','m_feliron','m_nether'],
      terokkar: ['a_out_helm','a_out_legs','a_out_neck','a_out_ring','w_nether_staff','w_outland_blade','w_off_out_shield','c_out_heal','c_out_mana','m_feliron','m_nether'],
      nagrand: ['a_void_hood','a_void_legs','a_void_boots','a_void_ring','tr_void_eye','w_nether_edge','w_nether_staff','c_out_heal','c_out_mana','m_feliron','m_nether'],
      bladesedge: ['a_void_gauntlets','a_void_legs','a_void_cloak','a_void_neck','w_nether_edge','w_off_void_totem','c_out_heal','c_out_mana','c_nether_flask','m_feliron','m_nether'],
      netherstorm: ['a_sun_crown','a_void_plate','a_void_gauntlets','a_void_boots','a_void_cloak','tr_void_eye','w_nether_staff','c_out_heal','c_out_mana','c_nether_flask','m_feliron','m_nether'],
      shadowmoon: ['a_sun_crown','a_sun_robe','a_sun_gloves','a_sun_legs','a_sun_boots','a_sun_cloak','a_sun_neck','a_sun_ring','tr_sun_seal','w_off_sun_blade','w_nether_edge','c_out_heal','c_out_mana','c_nether_flask','m_feliron','m_nether'],
      shattrath: ['a_out_helm','a_void_hood','a_sun_crown','a_out_chest','a_void_plate','a_sun_robe','a_out_gloves','a_void_gauntlets','a_sun_gloves','a_out_legs','a_void_legs','a_sun_legs','a_out_boots','a_void_boots','a_sun_boots','a_out_cloak','a_void_cloak','a_sun_cloak','a_out_neck','a_void_neck','a_sun_neck','a_out_ring','a_void_ring','a_sun_ring','tr_out_signet','tr_void_eye','tr_sun_seal','w_off_out_shield','w_off_void_totem','w_off_sun_blade','w_outland_blade','w_zangar_claw','w_shattered_blade','w_nether_edge','w_outland_staff','w_nether_staff','c_out_heal','c_out_mana','c_nether_flask','m_feliron','m_nether','m_crystal'],
    };
    const TBC_POOL = {
      hellfire_ramparts: ['a_out_helm','w_outland_blade','a_out_boots','tr_out_signet'],
      blood_furnace: ['a_out_chest','w_outland_staff','a_out_legs','tr_out_signet'],
      shattered_halls: ['a_void_gauntlets','w_shattered_blade','a_void_boots','tr_void_eye'],
      slave_pens: ['a_out_gloves','a_out_cloak','w_outland_staff','a_out_neck'],
      underbog: ['a_out_ring','a_out_legs','w_zangar_claw','tr_out_signet'],
      steamvault: ['a_void_ring','a_void_neck','w_nether_staff','w_off_void_totem'],
      mana_tombs: ['tr_out_signet','a_out_neck','w_outland_blade','a_out_helm'],
      auchenai_crypts: ['a_out_helm','w_off_out_shield','a_out_gloves','tr_out_signet'],
      sethekk_halls: ['a_void_hood','w_nether_edge','a_void_legs','tr_void_eye'],
      shadow_labyrinth: ['a_void_hood','a_void_cloak','w_nether_edge','tr_void_eye'],
      old_hillsbrad: ['a_void_legs','a_out_cloak','w_nether_staff','a_void_ring'],
      black_morass: ['a_void_cloak','w_nether_edge','a_void_neck','tr_void_eye'],
      mechanar: ['a_void_gauntlets','w_nether_staff','a_void_ring','w_off_void_totem'],
      botanica: ['a_void_plate','a_void_boots','w_nether_edge','tr_void_eye'],
      arcatraz: ['a_sun_crown','w_void_staff','a_sun_boots','tr_sun_seal'],
      magisters_terrace: ['a_sun_robe','w_off_sun_blade','a_sun_gloves','tr_sun_seal'],
      karazhan: ['a_sun_crown','w_nether_edge','a_sun_cloak','tr_sun_seal'],
      gruuls_lair: ['a_sun_gloves','a_sun_legs','tr_sun_seal','m_nether'],
      magtheridons_lair: ['a_sun_robe','a_sun_crown','a_sun_boots','tr_sun_seal'],
      serpentshrine_cavern: ['a_sun_legs','w_void_staff','a_sun_neck','tr_sun_seal'],
      tempest_keep: ['a_sun_robe','w_naaru_staff','a_sun_cloak','tr_sun_seal'],
      battle_for_hyjal: ['a_sun_crown','a_sun_robe','w_black_temple_blade','tr_sun_seal'],
      black_temple: ['w_warglaive','tr_skull_guldan','a_sun_crown','a_sun_gloves'],
      sunwell_plateau: ['a_sun_robe','w_thori_dal','a_sun_boots','tr_sun_seal'],
    };

    /* ---------- 外域区域(野外 + 枢纽 + 副本入口) ---------- */
    D.ZONES.blasted_lands.travel.push('hellfire');
    D.ZONES.duskwood.travel.push('karazhan');
    D.ZONES.tanaris.travel.push('caverns_of_time');
    Object.assign(D.ZONES, {
      hellfire: Z('hellfire', '地狱火半岛', '🔥', 'neutral', '58-63',
        '黑暗之门彼端的第一片焦土，邪兽人与燃烧军团的残部在破碎的红色荒原上厮杀。',
        { travel: ['blasted_lands','zangarmarsh','shattrath','hellfire_ramparts','blood_furnace','shattered_halls','magtheridons_lair'], monsters: ['hell_boar','hell_ravager','hell_orc','hell_demon','hell_elite'], quests: ['q_tbc_hell_ravager'],
          shop: TBC_SHOP.hellfire, inn: true, shopName: '远征军粮官' }),
      zangarmarsh: Z('zangarmarsh', '赞加沼泽', '🍄', 'neutral', '60-64',
        '巨大的蘑菇森林覆盖着湿热的沼泽，暗鳞纳迦与远征队在争夺这片水域。',
        { travel: ['hellfire','terokkar','shattrath','slave_pens','underbog','steamvault','serpentshrine_cavern'], monsters: ['zang_bog','zang_naga','zang_spore','zang_hydra','zang_elite'], quests: ['q_tbc_zang_naga'],
          shop: TBC_SHOP.zangarmarsh, inn: true, shopName: '远征军粮官' }),
      terokkar: Z('terokkar', '泰罗卡森林', '🌲', 'neutral', '62-66',
        '鸦人的古老林海，白骨荒野的亡灵与奥金尼的祭司在树影间徘徊。',
        { travel: ['zangarmarsh','nagrand','shattrath','mana_tombs','auchenai_crypts','sethekk_halls','shadow_labyrinth'], monsters: ['ter_arakkoa','ter_spider','ter_wolf','ter_treant','ter_elite'], quests: ['q_tbc_ter_spider'],
          shop: TBC_SHOP.terokkar, inn: true, shopName: '远征军粮官' }),
      nagrand: Z('nagrand', '纳格兰', '🦬', 'neutral', '64-68',
        '悬浮在虚空中的绿色草原，裂蹄牛群与石拳食人魔共享着这片最后的乐园。',
        { travel: ['terokkar','bladesedge','shattrath'], monsters: ['nag_clefthoof','nag_ogre','nag_windroc','nag_ravager','nag_elite'], quests: ['q_tbc_nag_ogre'],
          shop: TBC_SHOP.nagrand, inn: true, shopName: '远征军粮官' }),
      bladesedge: Z('bladesedge', '刀锋山', '⛰️', 'neutral', '65-69',
        '刀刃般的岩峰刺破天穹，格鲁尔的子嗣与虚空幼龙在峭壁间厮杀。',
        { travel: ['nagrand','netherstorm','shattrath','gruuls_lair'], monsters: ['be_ogre','be_ravager','be_drake','be_gnome','be_elite'], quests: ['q_tbc_be_drake'],
          shop: TBC_SHOP.bladesedge, inn: true, shopName: '远征军粮官' }),
      netherstorm: Z('netherstorm', '虚空风暴', '⚡', 'neutral', '67-70',
        '被虚空撕裂的浮空群岛，虚灵、恶魔与凯尔萨斯的奥术军团在此争夺法力熔炉。',
        { travel: ['bladesedge','shadowmoon','shattrath','mechanar','botanica','arcatraz','tempest_keep'], monsters: ['net_ether','net_mana','net_void','net_robot','net_elite'], quests: ['q_tbc_net_void'],
          shop: TBC_SHOP.netherstorm, inn: true, shopName: '远征军粮官' }),
      shadowmoon: Z('shadowmoon', '影月谷', '🌑', 'neutral', '67-70',
        '被邪能染黑的谷地，伊利丹的军团与黑暗神殿的阴影笼罩着整片大地。',
        { travel: ['netherstorm','shattrath','quel_danas','black_temple'], monsters: ['sm_demon','sm_wolf','sm_drake','sm_elemental','sm_elite'], quests: ['q_tbc_sm_drake'],
          shop: TBC_SHOP.shadowmoon, inn: true, shopName: '远征军粮官' }),
      shattrath: Z('shattrath', '沙塔斯城', '🏛️', 'neutral', '—',
        '外域的中立圣城，纳鲁的光辉照亮了流亡者的避难所，各阵营的军需官在此驻守。',
        { travel: ['hellfire','zangarmarsh','terokkar','nagrand','bladesedge','netherstorm','shadowmoon'], monsters: [], quests: [], shop: TBC_SHOP.shattrath, inn: true, shopName: '沙塔斯商贩' }),
      caverns_of_time: Z('caverns_of_time', '时光之穴', '⏳', 'neutral', '63-70',
        '守卫时光的青铜龙巢穴，通往历史关键节点的传送门在此开启。',
        { travel: ['tanaris','old_hillsbrad','black_morass','battle_for_hyjal'], monsters: [], quests: [], shop: [], inn: false }),
      karazhan: Z('karazhan', '卡拉赞', '🏰', 'neutral', '70',
        '麦迪文遗留的魔法高塔，扭曲的时空让亡者与幻象永不停歇地游荡。',
        { travel: ['duskwood'], monsters: [], quests: [], shop: [], inn: false }),
      quel_danas: Z('quel_danas', '奎尔丹纳斯岛', '🌅', 'neutral', '70',
        '血精灵的圣岛，太阳之井的余烬仍在燃烧，基尔加丹的阴影逼近。',
        { travel: ['shadowmoon','magisters_terrace','sunwell_plateau'], monsters: [], quests: [], shop: [], inn: false }),
      hellfire_ramparts: Z('hellfire_ramparts', '地狱火城墙', '🏰', 'neutral', '58-61',
        '地狱火堡垒的外围城墙，龙喉兽人把守着通往黑暗之门的要道。',
        { travel: ['hellfire'], monsters: [], dungeon: 'hellfire_ramparts', inn: false, quests: ['q_tbc_hellfire_ramparts'] }),
      blood_furnace: Z('blood_furnace', '血熔炉', '🔥', 'neutral', '60-63',
        '地狱火堡垒地下的邪能熔炉，玛瑟里顿的血在此炼成狂暴的邪兽人。',
        { travel: ['hellfire'], monsters: [], dungeon: 'blood_furnace', inn: false, quests: ['q_tbc_blood_furnace'] }),
      shattered_halls: Z('shattered_halls', '破碎大厅', '⚔️', 'neutral', '68-70',
        '卡加斯·刃拳统治的堡垒深处，被邪能强化的部落战士在此接受最后的试炼。',
        { travel: ['hellfire'], monsters: [], dungeon: 'shattered_halls', inn: false, quests: ['q_tbc_shattered_halls'] }),
      slave_pens: Z('slave_pens', '奴隶围栏', '🌿', 'neutral', '61-64',
        '盘牙水库的奴隶围栏，纳迦在此驱使俘虏为瓦斯琪挖掘水源。',
        { travel: ['zangarmarsh'], monsters: [], dungeon: 'slave_pens', inn: false, quests: ['q_tbc_slave_pens'] }),
      underbog: Z('underbog', '幽暗沼泽', '🍄', 'neutral', '62-65',
        '赞加沼泽水面之下的幽暗洞穴，巨型孢子与沼泽生物在黑暗中蠕动。',
        { travel: ['zangarmarsh'], monsters: [], dungeon: 'underbog', inn: false, quests: ['q_tbc_underbog'] }),
      steamvault: Z('steamvault', '蒸汽地窟', '⚙️', 'neutral', '68-70',
        '盘牙水库的蒸汽核心，水泵的轰鸣中藏着瓦斯琪的战争机器。',
        { travel: ['zangarmarsh'], monsters: [], dungeon: 'steamvault', inn: false, quests: ['q_tbc_steamvault'] }),
      mana_tombs: Z('mana_tombs', '法力陵墓', '🔮', 'neutral', '63-66',
        '鸦人王族的墓穴被虚灵洗劫，奥术构造体在密封的厅堂中守卫着陪葬品。',
        { travel: ['terokkar'], monsters: [], dungeon: 'mana_tombs', inn: false, quests: ['q_tbc_mana_tombs'] }),
      auchenai_crypts: Z('auchenai_crypts', '奥金尼地穴', '💀', 'neutral', '64-67',
        '德莱尼祭司的安息之地被黑暗仪式亵渎，亡者的低语在墓道中回荡。',
        { travel: ['terokkar'], monsters: [], dungeon: 'auchenai_crypts', inn: false, quests: ['q_tbc_auchenai_crypts'] }),
      sethekk_halls: Z('sethekk_halls', '塞泰克大厅', '🕊️', 'neutral', '66-69',
        '鸦人先知的圣殿，塞泰克教派在此唤醒沉睡的利爪之王。',
        { travel: ['terokkar'], monsters: [], dungeon: 'sethekk_halls', inn: false, quests: ['q_tbc_sethekk_halls'] }),
      shadow_labyrinth: Z('shadow_labyrinth', '暗影迷宫', '🌑', 'neutral', '69-70',
        '奥金顿地下的暗影议会密室，被封印的元素之音正在唤醒毁灭。',
        { travel: ['terokkar'], monsters: [], dungeon: 'shadow_labyrinth', inn: false, quests: ['q_tbc_shadow_labyrinth'] }),
      old_hillsbrad: Z('old_hillsbrad', '旧希尔斯布莱德', '🕰️', 'neutral', '64-67',
        '穿越时光回到旧希尔斯布莱德，护送萨尔逃离敦霍尔德的囚笼。',
        { travel: ['caverns_of_time'], monsters: [], dungeon: 'old_hillsbrad', inn: false, quests: ['q_tbc_old_hillsbrad'] }),
      black_morass: Z('black_morass', '黑色沼泽', '🐊', 'neutral', '66-69',
        '守护黑暗之门的开启，抵挡无限龙族对时间线的侵蚀。',
        { travel: ['caverns_of_time'], monsters: [], dungeon: 'black_morass', inn: false, quests: ['q_tbc_black_morass'] }),
      mechanar: Z('mechanar', '能源舰', '🤖', 'neutral', '68-70',
        '凯尔萨斯的风暴要塞卫星舰，太阳井法力在此被抽取炼成奥术兵器。',
        { travel: ['netherstorm'], monsters: [], dungeon: 'mechanar', inn: false, quests: ['q_tbc_mechanar'] }),
      botanica: Z('botanica', '生态船', '🌺', 'neutral', '68-70',
        '风暴要塞的生态舱，被扭曲的植物在奥术催化下疯狂生长。',
        { travel: ['netherstorm'], monsters: [], dungeon: 'botanica', inn: false, quests: ['q_tbc_botanica'] }),
      arcatraz: Z('arcatraz', '禁魔监狱', '🔒', 'neutral', '70-70',
        '纳鲁关押宇宙中最危险存在的牢狱，封印正在一道一道崩坏。',
        { travel: ['netherstorm'], monsters: [], dungeon: 'arcatraz', inn: false, quests: ['q_tbc_arcatraz'] }),
      magisters_terrace: Z('magisters_terrace', '魔导师平台', '🏛️', 'neutral', '70-70',
        '凯尔萨斯在太阳之井废墟中重塑肉身，血骑士与秘法师誓死护卫。',
        { travel: ['quel_danas'], monsters: [], dungeon: 'magisters_terrace', inn: false, quests: ['q_tbc_magisters_terrace'] }),
      karazhan: Z('karazhan', '卡拉赞', '🏰', 'neutral', '70-70',
        '麦迪文的魔法高塔已沦为鬼蜮，玛克扎尔王子在塔顶谋划着扭曲的阴谋。',
        { travel: ['karazhan'], monsters: [], dungeon: 'karazhan', inn: false, quests: ['q_tbc_karazhan'] }),
      gruuls_lair: Z('gruuls_lair', '格鲁尔的巢穴', '🐗', 'neutral', '70-70',
        '刀锋山巅的食人魔王座，戈隆之王格鲁尔以巨龙的血肉为食。',
        { travel: ['bladesedge'], monsters: [], dungeon: 'gruuls_lair', inn: false, quests: ['q_tbc_gruuls_lair'] }),
      magtheridons_lair: Z('magtheridons_lair', '玛瑟里顿的巢穴', '🐉', 'neutral', '70-70',
        '被锁链束缚的深渊领主，伊利丹以一整座堡垒囚禁着这位燃烧军团的指挥官。',
        { travel: ['hellfire'], monsters: [], dungeon: 'magtheridons_lair', inn: false, quests: ['q_tbc_magtheridons_lair'] }),
      serpentshrine_cavern: Z('serpentshrine_cavern', '毒蛇神殿', '🐍', 'neutral', '70-70',
        '盘牙水库最深处的祭坛，瓦斯琪女士正为她的新主人抽取外域的水源。',
        { travel: ['zangarmarsh'], monsters: [], dungeon: 'serpentshrine_cavern', inn: false, quests: ['q_tbc_serpentshrine_cavern'] }),
      tempest_keep: Z('tempest_keep', '风暴要塞', '🛸', 'neutral', '70-70',
        '纳鲁的旗舰要塞，凯尔萨斯占据了这座水晶飞船并向虚空宣誓效忠。',
        { travel: ['netherstorm'], monsters: [], dungeon: 'tempest_keep', inn: false, quests: ['q_tbc_tempest_keep'] }),
      battle_for_hyjal: Z('battle_for_hyjal', '海加尔山之战', '🌳', 'neutral', '70-70',
        '回到海加尔山的圣战，与吉安娜、萨尔和泰兰德并肩抵挡燃烧军团。',
        { travel: ['caverns_of_time'], monsters: [], dungeon: 'battle_for_hyjal', inn: false, quests: ['q_tbc_battle_for_hyjal'] }),
      black_temple: Z('black_temple', '黑暗神殿', '👁️', 'neutral', '70-70',
        '伊利丹的黑暗神殿，背叛者的怒火与邪能火焰在此燃烧。',
        { travel: ['shadowmoon'], monsters: [], dungeon: 'black_temple', inn: false, quests: ['q_tbc_black_temple'] }),
      sunwell_plateau: Z('sunwell_plateau', '太阳井高地', '☀️', 'neutral', '70-70',
        '太阳之井的废墟之上，燃烧军团之主正从虚空裂隙中踏入艾泽拉斯。',
        { travel: ['quel_danas'], monsters: [], dungeon: 'sunwell_plateau', inn: false, quests: ['q_tbc_sunwell_plateau'] }),
    });

    /* ---------- 外域野外怪物 ---------- */
    Object.assign(D.MONSTERS, {
      hell_boar: M('hell_boar', '地狱火野猪', '🐗', 58, 1250, [137,178], 109, 505, 409, 'beast', ['m_bite','m_rend']),
      hell_ravager: M('hell_ravager', '地狱火掠食者', '🦗', 59, 1290, [140,182], 111, 515, 417, 'beast', ['m_claw','m_charge','m_bash']),
      hell_orc: M('hell_orc', '龙喉兽人', '🪓', 60, 1330, [142,185], 112, 525, 425, 'humanoid', ['m_rend','m_war_cry','m_bash']),
      hell_demon: M('hell_demon', '魔火恶魔', '👿', 61, 1370, [144,187], 113, 535, 433, 'demon', ['m_fel_flames','m_shadow','m_war_cry']),
      hell_elite: M('hell_elite', '深渊领主', '👹', 63, 3190, [161,209], 122, 1665, 1167, 'demon', ['m_fel_cleave','m_fel_flames','m_enrage'], { elite: 1, title: '深渊领主 · 外域稀有精英' }),
      zang_bog: M('zang_bog', '沼泽行者', '🦎', 60, 1330, [142,185], 112, 525, 425, 'beast', ['m_bite','m_poison']),
      zang_naga: M('zang_naga', '暗鳞纳迦', '🐍', 61, 1370, [144,187], 113, 535, 433, 'humanoid', ['m_frost','m_claw','m_war_cry']),
      zang_spore: M('zang_spore', '孢子蝙蝠', '🦇', 62, 1410, [147,191], 115, 545, 441, 'beast', ['m_bite','m_poison','m_rend']),
      zang_hydra: M('zang_hydra', '沼泽九头蛇', '🐉', 63, 1450, [149,194], 116, 555, 449, 'beast', ['m_breath','m_bite','m_regen']),
      zang_elite: M('zang_elite', '沼泽领主', '🍄', 64, 3278, [164,213], 123, 1695, 1188, 'elemental', ['m_breath','m_poison','m_enrage'], { elite: 1, title: '沼泽领主 · 外域稀有精英' }),
      ter_arakkoa: M('ter_arakkoa', '鸦人猎手', '🐦', 62, 1410, [147,191], 115, 545, 441, 'humanoid', ['m_shadow','m_charge','m_war_cry']),
      ter_spider: M('ter_spider', '泰罗卡毒蛛', '🕷️', 63, 1450, [149,194], 116, 555, 449, 'beast', ['m_poison','m_bite','m_rend']),
      ter_wolf: M('ter_wolf', '森林座狼', '🐺', 64, 1490, [152,198], 117, 565, 457, 'beast', ['m_bite','m_rend','m_charge']),
      ter_treant: M('ter_treant', '泰罗卡树人', '🌳', 65, 1530, [154,200], 119, 575, 465, 'elemental', ['m_bash','m_regen','m_war_cry']),
      ter_elite: M('ter_elite', '鸦人先知', '🦅', 66, 3454, [168,218], 126, 1755, 1230, 'humanoid', ['m_void_strike','m_supernova','m_nether_ward'], { elite: 1, title: '鸦人先知 · 外域稀有精英' }),
      nag_clefthoof: M('nag_clefthoof', '裂蹄牛', '🦬', 64, 1490, [152,198], 117, 565, 457, 'beast', ['m_charge','m_rend','m_bash']),
      nag_ogre: M('nag_ogre', '石拳食人魔', '👺', 65, 1530, [154,200], 119, 575, 465, 'humanoid', ['m_charge','m_war_cry','m_rend']),
      nag_windroc: M('nag_windroc', '风鹏', '🦅', 66, 1570, [156,203], 120, 585, 473, 'beast', ['m_claw','m_bite','m_charge']),
      nag_ravager: M('nag_ravager', '塔布羊掠夺者', '🐏', 67, 1610, [159,207], 121, 595, 481, 'beast', ['m_bite','m_bash','m_enrage']),
      nag_elite: M('nag_elite', '元素领主', '🌀', 68, 3630, [174,226], 128, 1815, 1271, 'elemental', ['m_supernova','m_charge','m_enrage'], { elite: 1, title: '元素领主 · 外域稀有精英' }),
      be_ogre: M('be_ogre', '刀锋食人魔', '👹', 65, 1530, [154,200], 119, 575, 465, 'humanoid', ['m_charge','m_rend','m_war_cry']),
      be_ravager: M('be_ravager', '刀锋掠食者', '🦗', 66, 1570, [156,203], 120, 585, 473, 'beast', ['m_claw','m_charge','m_rend']),
      be_drake: M('be_drake', '虚空幼龙', '🐲', 67, 1610, [159,207], 121, 595, 481, 'dragon', ['m_breath','m_fel_flames','m_enrage']),
      be_gnome: M('be_gnome', '侏儒技师', '🤖', 68, 1650, [161,209], 122, 605, 489, 'mechanical', ['m_charge','m_war_cry','m_bash']),
      be_elite: M('be_elite', '格鲁尔之子', '🐗', 69, 3718, [177,230], 130, 1845, 1292, 'beast', ['m_bash','m_charge','m_enrage'], { elite: 1, title: '格鲁尔之子 · 外域稀有精英' }),
      net_ether: M('net_ether', '虚灵掠夺者', '👽', 67, 1610, [159,207], 121, 595, 481, 'humanoid', ['m_void_strike','m_shadow','m_war_cry']),
      net_mana: M('net_mana', '法力浮龙', '🦋', 68, 1650, [161,209], 122, 605, 489, 'elemental', ['m_supernova','m_frost','m_regen']),
      net_void: M('net_void', '虚空行者', '🌑', 69, 1690, [164,213], 124, 615, 497, 'elemental', ['m_void_strike','m_shadow','m_enrage']),
      net_robot: M('net_robot', '虚空机械', '🤖', 69, 1690, [164,213], 124, 615, 497, 'mechanical', ['m_charge','m_bash','m_enrage']),
      net_elite: M('net_elite', '虚空领主', '👁️', 70, 3806, [179,233], 131, 1875, 1313, 'demon', ['m_supernova','m_void_strike','m_nether_ward'], { elite: 1, title: '虚空领主 · 外域稀有精英' }),
      sm_demon: M('sm_demon', '恶魔卫士', '👿', 67, 1610, [159,207], 121, 595, 481, 'demon', ['m_fel_cleave','m_fel_flames','m_war_cry']),
      sm_wolf: M('sm_wolf', '邪能座狼', '🐺', 68, 1650, [161,209], 122, 605, 489, 'beast', ['m_bite','m_rend','m_enrage']),
      sm_drake: M('sm_drake', '影月幼龙', '🐉', 69, 1690, [164,213], 124, 615, 497, 'dragon', ['m_breath','m_fel_flames','m_enrage']),
      sm_elemental: M('sm_elemental', '暗影元素', '🌀', 69, 1690, [164,213], 124, 615, 497, 'elemental', ['m_shadow','m_supernova','m_nether_ward']),
      sm_elite: M('sm_elite', '恶魔领主', '😈', 70, 3806, [179,233], 131, 1875, 1313, 'demon', ['m_fel_cleave','m_void_strike','m_enrage'], { elite: 1, title: '恶魔领主 · 外域稀有精英' }),
    });

    /* ---------- 副本怪物(杂兵 + 最终首领;中途首领由下方表统一注册) ---------- */
    Object.assign(D.MONSTERS, {
      rampart_orc: M('rampart_orc', '龙喉步兵', '🪓', 58, 1325, [137,178], 109, 556, 409, 'humanoid', ['m_charge','m_rend','m_war_cry']),
      rampart_whelp: M('rampart_whelp', '地狱火幼龙', '🐉', 58, 1325, [137,178], 109, 556, 409, 'dragon', ['m_breath','m_bite']),
      vazruden: M('vazruden', '瓦兹鲁登·先锋', '👹', 59, 3660, [153,199], 116, 4460, 3600, 'humanoid', ['m_charge','m_war_cry','m_enrage'], { elite: 1, boss: 1, title: '地狱火城墙 · 最终首领' }),
      bf_guard: M('bf_guard', '血熔炉守卫', '🪓', 60, 1410, [142,185], 112, 578, 425, 'humanoid', ['m_charge','m_rend','m_bash']),
      bf_imp: M('bf_imp', '魔火小鬼', '👿', 60, 1410, [142,185], 112, 578, 425, 'demon', ['m_fireball','m_fel_flames']),
      kelidan: M('kelidan', '击碎者基尔罗格', '🧙', 61, 3780, [160,208], 119, 4980, 4000, 'demon', ['m_fel_flames','m_shadow','m_enrage'], { elite: 1, boss: 1, title: '血熔炉 · 最终首领' }),
      sh_legionnaire: M('sh_legionnaire', '邪兽人百夫长', '🪓', 68, 1749, [161,209], 122, 666, 489, 'humanoid', ['m_charge','m_rend','m_war_cry']),
      sh_archer: M('sh_archer', '邪兽人射手', '🏹', 68, 1749, [161,209], 122, 666, 489, 'humanoid', ['m_bite','m_bash','m_charge']),
      kargath: M('kargath', '卡加斯·刃拳', '🪓', 69, 4260, [185,241], 128, 7060, 5600, 'humanoid', ['m_fel_cleave','m_rend','m_enrage'], { elite: 1, boss: 1, title: '破碎大厅 · 最终首领' }),
      sp_keeper: M('sp_keeper', '暗鳞奴隶主', '🐍', 61, 1452, [144,187], 113, 589, 433, 'humanoid', ['m_frost','m_claw','m_war_cry']),
      sp_crab: M('sp_crab', '深渊巨蟹', '🦀', 61, 1452, [144,187], 113, 589, 433, 'beast', ['m_bash','m_claw','m_rend']),
      quagmirran: M('quagmirran', '夸格米拉', '🦐', 62, 3840, [163,212], 120, 5240, 4200, 'beast', ['m_breath','m_bite','m_enrage'], { elite: 1, boss: 1, title: '奴隶围栏 · 最终首领' }),
      ub_lord: M('ub_lord', '沼泽领主', '🐊', 62, 1495, [147,191], 115, 600, 441, 'beast', ['m_bite','m_breath','m_rend']),
      ub_spore: M('ub_spore', '孢囊', '🍄', 62, 1495, [147,191], 115, 600, 441, 'elemental', ['m_poison','m_regen','m_breath']),
      black_stalker: M('black_stalker', '黑色追踪者', '🕷️', 63, 3900, [166,216], 121, 5500, 4400, 'beast', ['m_poison','m_bite','m_enrage'], { elite: 1, boss: 1, title: '幽暗沼泽 · 最终首领' }),
      sv_giant: M('sv_giant', '蒸汽巨人', '🗿', 68, 1749, [161,209], 122, 666, 489, 'elemental', ['m_bash','m_charge','m_war_cry']),
      sv_naga: M('sv_naga', '纳迦侍从', '🐍', 68, 1749, [161,209], 122, 666, 489, 'humanoid', ['m_frost','m_claw','m_heal']),
      kalithresh: M('kalithresh', '督军卡利瑟里斯', '🔱', 69, 4260, [185,241], 128, 7060, 5600, 'humanoid', ['m_frost','m_charge','m_enrage'], { elite: 1, boss: 1, title: '蒸汽地窟 · 最终首领' }),
      mt_ethereal: M('mt_ethereal', '虚灵盗墓者', '👽', 63, 1537, [149,194], 116, 611, 449, 'humanoid', ['m_void_strike','m_shadow','m_war_cry']),
      mt_arcane: M('mt_arcane', '奥术幽灵', '✨', 63, 1537, [149,194], 116, 611, 449, 'elemental', ['m_supernova','m_shadow']),
      shaffar: M('shaffar', '节点亲王沙法尔', '💠', 64, 3960, [169,220], 122, 5760, 4600, 'humanoid', ['m_supernova','m_void_strike','m_enrage'], { elite: 1, boss: 1, title: '法力陵墓 · 最终首领' }),
      ac_ghost: M('ac_ghost', '奥金尼幽灵', '👻', 64, 1579, [152,198], 117, 622, 457, 'undead', ['m_shadow','m_frost','m_rend']),
      ac_skeleton: M('ac_skeleton', '骷髅卫士', '🦴', 64, 1579, [152,198], 117, 622, 457, 'undead', ['m_bash','m_charge','m_war_cry']),
      maladaar: M('maladaar', '主教玛拉达尔', '🧙', 65, 4020, [172,224], 123, 6020, 4800, 'humanoid', ['m_shadow','m_soul_drain','m_enrage'], { elite: 1, boss: 1, title: '奥金尼地穴 · 最终首领' }),
      seth_talon: M('seth_talon', '塞泰克利爪', '🐦', 66, 1664, [156,203], 120, 644, 473, 'humanoid', ['m_shadow','m_charge','m_bash']),
      seth_priest: M('seth_priest', '塞泰克祭司', '🧙', 66, 1664, [156,203], 120, 644, 473, 'humanoid', ['m_shadow','m_heal','m_war_cry']),
      ikiss: M('ikiss', '塔瓦洛克·艾基斯', '🦅', 67, 4140, [179,233], 126, 6540, 5200, 'humanoid', ['m_supernova','m_shadow','m_enrage'], { elite: 1, boss: 1, title: '塞泰克大厅 · 最终首领' }),
      sl_cultist: M('sl_cultist', '暗影教团信徒', '🕯️', 69, 1791, [164,213], 124, 677, 497, 'humanoid', ['m_shadow','m_soul_drain','m_war_cry']),
      sl_walker: M('sl_walker', '虚空行者', '🌑', 69, 1791, [164,213], 124, 677, 497, 'elemental', ['m_void_strike','m_shadow','m_enrage']),
      murmur: M('murmur', '穆鲁之音', '🌀', 70, 4320, [188,244], 129, 7320, 5800, 'elemental', ['m_void_strike','m_supernova','m_enrage'], { elite: 1, boss: 1, title: '暗影迷宫 · 最终首领' }),
      oh_guard: M('oh_guard', '敦霍尔德卫兵', '🛡️', 64, 1579, [152,198], 117, 622, 457, 'humanoid', ['m_charge','m_rend','m_war_cry']),
      oh_dragon: M('oh_dragon', '时光幼龙', '🐲', 64, 1579, [152,198], 117, 622, 457, 'dragon', ['m_breath','m_bite']),
      epoch_hunter: M('epoch_hunter', '时光猎手埃波克', '🐉', 65, 4020, [172,224], 123, 6020, 4800, 'dragon', ['m_breath','m_void_strike','m_enrage'], { elite: 1, boss: 1, title: '旧希尔斯布莱德 · 最终首领' }),
      bm_lurker: M('bm_lurker', '沼泽潜伏者', '🐊', 66, 1664, [156,203], 120, 644, 473, 'beast', ['m_bite','m_breath','m_rend']),
      bm_drake: M('bm_drake', '时光龙人', '🐲', 66, 1664, [156,203], 120, 644, 473, 'dragon', ['m_breath','m_shadow','m_war_cry']),
      aeonus: M('aeonus', '埃欧努斯', '🐉', 67, 4140, [179,233], 126, 6540, 5200, 'dragon', ['m_breath','m_void_strike','m_enrage'], { elite: 1, boss: 1, title: '黑色沼泽 · 最终首领' }),
      mech_guard: M('mech_guard', '能源舰守卫', '🤖', 68, 1749, [161,209], 122, 666, 489, 'mechanical', ['m_bash','m_charge','m_war_cry']),
      mech_engineer: M('mech_engineer', '能源舰工程师', '🔧', 68, 1749, [161,209], 122, 666, 489, 'mechanical', ['m_charge','m_war_cry','m_heal']),
      pathaleon: M('pathaleon', '计算者帕萨雷恩', '🧮', 69, 4260, [185,241], 128, 7060, 5600, 'humanoid', ['m_supernova','m_charge','m_enrage'], { elite: 1, boss: 1, title: '能源舰 · 最终首领' }),
      bot_sprout: M('bot_sprout', '温室新芽', '🌱', 68, 1749, [161,209], 122, 666, 489, 'elemental', ['m_poison','m_regen']),
      bot_keeper: M('bot_keeper', '植物园守卫', '🌿', 68, 1749, [161,209], 122, 666, 489, 'humanoid', ['m_bash','m_charge','m_war_cry']),
      warpsplinter: M('warpsplinter', '迁跃扭木', '🌳', 69, 4260, [185,241], 128, 7060, 5600, 'elemental', ['m_bash','m_poison','m_enrage'], { elite: 1, boss: 1, title: '生态船 · 最终首领' }),
      arc_warden: M('arc_warden', '禁魔守卫', '🤖', 70, 1834, [166,216], 125, 688, 505, 'mechanical', ['m_bash','m_charge','m_war_cry']),
      arc_prisoner: M('arc_prisoner', '虚灵囚徒', '👽', 70, 1834, [166,216], 125, 688, 505, 'humanoid', ['m_void_strike','m_shadow','m_enrage']),
      skyriss: M('skyriss', '预言者斯克瑞斯', '👁️', 70, 4320, [188,244], 129, 7320, 5800, 'demon', ['m_void_strike','m_supernova','m_enrage'], { elite: 1, boss: 1, title: '禁魔监狱 · 最终首领' }),
      mt_blood_knight: M('mt_blood_knight', '血骑士', '🩸', 70, 1834, [166,216], 125, 688, 505, 'humanoid', ['m_charge','m_rend','m_war_cry']),
      mt_priestess: M('mt_priestess', '秘法女祭司', '✨', 70, 1834, [166,216], 125, 688, 505, 'humanoid', ['m_supernova','m_frost','m_heal']),
      kael_reborn: M('kael_reborn', '重生的凯尔萨斯', '🔥', 70, 4320, [188,244], 129, 7320, 5800, 'humanoid', ['m_fel_flames','m_supernova','m_enrage'], { elite: 1, boss: 1, title: '魔导师平台 · 最终首领' }),
      kara_ghost: M('kara_ghost', '亡魂仆从', '👻', 70, 1834, [166,216], 125, 688, 505, 'undead', ['m_shadow','m_frost','m_rend']),
      kara_wolf: M('kara_wolf', '狼人守卫', '🐺', 70, 1834, [166,216], 125, 688, 505, 'beast', ['m_bite','m_rend','m_charge']),
      prince_malchezaar: M('prince_malchezaar', '玛克扎尔王子', '👑', 70, 7200, [270,351], 140, 18500, 14800, 'demon', ['m_void_strike','m_supernova','m_enrage'], { elite: 1, boss: 1, title: '卡拉赞 · 最终首领' }),
      gruul_ogre: M('gruul_ogre', '食人魔蛮兵', '👹', 70, 1834, [166,216], 125, 688, 505, 'humanoid', ['m_charge','m_rend','m_war_cry']),
      gruul_hound: M('gruul_hound', '深渊恶犬', '🐺', 70, 1834, [166,216], 125, 688, 505, 'beast', ['m_bite','m_rend','m_enrage']),
      gruul: M('gruul', '屠龙者格鲁尔', '🐗', 70, 7200, [270,351], 140, 18500, 14800, 'humanoid', ['m_bash','m_charge','m_enrage'], { elite: 1, boss: 1, title: '格鲁尔的巢穴 · 最终首领' }),
      mag_felguard: M('mag_felguard', '恶魔卫士', '👿', 70, 1834, [166,216], 125, 688, 505, 'demon', ['m_fel_cleave','m_fel_flames','m_war_cry']),
      mag_summoner: M('mag_summoner', '暗影议会术士', '🧙', 70, 1834, [166,216], 125, 688, 505, 'humanoid', ['m_shadow','m_soul_drain','m_heal']),
      magtheridon: M('magtheridon', '深渊领主玛瑟里顿', '😈', 70, 7200, [270,351], 140, 18500, 14800, 'demon', ['m_fel_cleave','m_fel_flames','m_enrage'], { elite: 1, boss: 1, title: '玛瑟里顿的巢穴 · 最终首领' }),
      ssc_naga: M('ssc_naga', '盘牙纳迦', '🐍', 70, 1834, [166,216], 125, 688, 505, 'humanoid', ['m_frost','m_claw','m_war_cry']),
      ssc_hydra: M('ssc_hydra', '深海九头蛇', '🐉', 70, 1834, [166,216], 125, 688, 505, 'beast', ['m_breath','m_poison','m_regen']),
      lady_vashj: M('lady_vashj', '瓦斯琪女士', '🔱', 70, 7200, [270,351], 140, 18500, 14800, 'humanoid', ['m_frost','m_supernova','m_enrage'], { elite: 1, boss: 1, title: '毒蛇神殿 · 最终首领' }),
      tk_solar: M('tk_solar', '太阳鹰', '🦅', 70, 1834, [166,216], 125, 688, 505, 'elemental', ['m_fel_flames','m_charge','m_enrage']),
      tk_void: M('tk_void', '虚空守卫', '🌑', 70, 1834, [166,216], 125, 688, 505, 'demon', ['m_void_strike','m_shadow','m_war_cry']),
      kaelthas: M('kaelthas', '凯尔萨斯·逐日者', '🔥', 70, 7200, [270,351], 140, 18500, 14800, 'humanoid', ['m_fel_flames','m_supernova','m_void_strike'], { elite: 1, boss: 1, title: '风暴要塞 · 最终首领' }),
      hyjal_ghoul: M('hyjal_ghoul', '天灾食尸鬼', '🧟', 70, 1834, [166,216], 125, 688, 505, 'undead', ['m_bite','m_rend','m_charge']),
      hyjal_abom: M('hyjal_abom', '天灾憎恶', '🧌', 70, 1834, [166,216], 125, 688, 505, 'undead', ['m_bash','m_rend','m_enrage']),
      archimonde: M('archimonde', '污染者阿克蒙德', '👹', 70, 8280, [270,351], 140, 18500, 14800, 'demon', ['m_fel_cleave','m_fel_flames','m_enrage'], { elite: 1, boss: 1, title: '海加尔山之战 · 最终首领' }),
      bt_bloodelf: M('bt_bloodelf', '血精灵卫兵', '🩸', 70, 1834, [166,216], 125, 688, 505, 'humanoid', ['m_charge','m_rend','m_war_cry']),
      bt_demon: M('bt_demon', '恶魔守卫', '👿', 70, 1834, [166,216], 125, 688, 505, 'demon', ['m_fel_cleave','m_fel_flames','m_war_cry']),
      illidan: M('illidan', '伊利丹·怒风', '😈', 70, 8280, [270,351], 140, 18500, 14800, 'demon', ['m_fel_cleave','m_void_strike','m_enrage'], { elite: 1, boss: 1, title: '黑暗神殿 · 最终首领' }),
      swp_priestess: M('swp_priestess', '太阳之井女祭司', '✨', 70, 1834, [166,216], 125, 688, 505, 'humanoid', ['m_supernova','m_heal','m_war_cry']),
      swp_dragon: M('swp_dragon', '太阳龙', '🐉', 70, 1834, [166,216], 125, 688, 505, 'dragon', ['m_breath','m_fel_flames','m_enrage']),
      kiljaeden: M('kiljaeden', '燃烧军团之主基尔加丹', '😈', 70, 8280, [270,351], 140, 18500, 14800, 'demon', ['m_fel_cleave','m_fel_flames','m_void_strike'], { elite: 1, boss: 1, title: '太阳井高地 · 最终首领' }),
      doomwalker: M('doomwalker', '末日行者', '🤖', 70, 9000, [250,325], 150, 20000, 16000, 'mechanical', ['m_supernova','m_bash','m_enrage'], { elite: 1, boss: 1, title: '外域世界首领' }),
    });

    /* ---------- 副本注册表(5 人本 16 座 + 团本 8 座) ---------- */
    Object.assign(D.DUNGEONS, {
      hellfire_ramparts: {
        id: 'hellfire_ramparts', name: '地狱火城墙', icon: '🏰', zone: 'hellfire', minLevel: 58, boss: 'vazruden',
        waves: [
          { enemies: ['rampart_orc','rampart_whelp'], name: '前厅守卫' },
          { enemies: ['rampart_orc','rampart_whelp'], name: '回廊巡逻' },
          { enemies: ['vazruden'], name: '最终首领：瓦兹鲁登·先锋' },
        ],
        desc: '地狱火堡垒的外围城墙，龙喉兽人把守着通往黑暗之门的要道。',
        chest: { items: [['m_feliron', 3], ['m_nether', 2], ['m_crystal', 2]], gold: [5200,7200] },
      },
      blood_furnace: {
        id: 'blood_furnace', name: '血熔炉', icon: '🔥', zone: 'hellfire', minLevel: 60, boss: 'kelidan',
        waves: [
          { enemies: ['bf_guard','bf_imp'], name: '前厅守卫' },
          { enemies: ['bf_guard','bf_imp'], name: '回廊巡逻' },
          { enemies: ['kelidan'], name: '最终首领：击碎者基尔罗格' },
        ],
        desc: '地狱火堡垒地下的邪能熔炉，玛瑟里顿的血在此炼成狂暴的邪兽人。',
        chest: { items: [['m_feliron', 3], ['m_nether', 2], ['m_crystal', 2]], gold: [6000,8200] },
      },
      shattered_halls: {
        id: 'shattered_halls', name: '破碎大厅', icon: '⚔️', zone: 'hellfire', minLevel: 68, boss: 'kargath',
        waves: [
          { enemies: ['sh_legionnaire','sh_archer'], name: '前厅守卫' },
          { enemies: ['sh_legionnaire','sh_archer'], name: '回廊巡逻' },
          { enemies: ['kargath'], name: '最终首领：卡加斯·刃拳' },
        ],
        desc: '卡加斯·刃拳统治的堡垒深处，被邪能强化的部落战士在此接受最后的试炼。',
        chest: { items: [['m_feliron', 3], ['m_nether', 2], ['m_crystal', 2]], gold: [9000,12000] },
      },
      slave_pens: {
        id: 'slave_pens', name: '奴隶围栏', icon: '🌿', zone: 'zangarmarsh', minLevel: 61, boss: 'quagmirran',
        waves: [
          { enemies: ['sp_keeper','sp_crab'], name: '前厅守卫' },
          { enemies: ['sp_keeper','sp_crab'], name: '回廊巡逻' },
          { enemies: ['quagmirran'], name: '最终首领：夸格米拉' },
        ],
        desc: '盘牙水库的奴隶围栏，纳迦在此驱使俘虏为瓦斯琪挖掘水源。',
        chest: { items: [['m_feliron', 3], ['m_nether', 2], ['m_crystal', 2]], gold: [6400,8800] },
      },
      underbog: {
        id: 'underbog', name: '幽暗沼泽', icon: '🍄', zone: 'zangarmarsh', minLevel: 62, boss: 'black_stalker',
        waves: [
          { enemies: ['ub_lord','ub_spore'], name: '前厅守卫' },
          { enemies: ['ub_lord','ub_spore'], name: '回廊巡逻' },
          { enemies: ['black_stalker'], name: '最终首领：黑色追踪者' },
        ],
        desc: '赞加沼泽水面之下的幽暗洞穴，巨型孢子与沼泽生物在黑暗中蠕动。',
        chest: { items: [['m_feliron', 3], ['m_nether', 2], ['m_crystal', 2]], gold: [6800,9200] },
      },
      steamvault: {
        id: 'steamvault', name: '蒸汽地窟', icon: '⚙️', zone: 'zangarmarsh', minLevel: 68, boss: 'kalithresh',
        waves: [
          { enemies: ['sv_giant','sv_naga'], name: '前厅守卫' },
          { enemies: ['sv_giant','sv_naga'], name: '回廊巡逻' },
          { enemies: ['kalithresh'], name: '最终首领：督军卡利瑟里斯' },
        ],
        desc: '盘牙水库的蒸汽核心，水泵的轰鸣中藏着瓦斯琪的战争机器。',
        chest: { items: [['m_feliron', 3], ['m_nether', 2], ['m_crystal', 2]], gold: [9200,12200] },
      },
      mana_tombs: {
        id: 'mana_tombs', name: '法力陵墓', icon: '🔮', zone: 'terokkar', minLevel: 63, boss: 'shaffar',
        waves: [
          { enemies: ['mt_ethereal','mt_arcane'], name: '前厅守卫' },
          { enemies: ['mt_ethereal','mt_arcane'], name: '回廊巡逻' },
          { enemies: ['shaffar'], name: '最终首领：节点亲王沙法尔' },
        ],
        desc: '鸦人王族的墓穴被虚灵洗劫，奥术构造体在密封的厅堂中守卫着陪葬品。',
        chest: { items: [['m_feliron', 3], ['m_nether', 2], ['m_crystal', 2]], gold: [7000,9600] },
      },
      auchenai_crypts: {
        id: 'auchenai_crypts', name: '奥金尼地穴', icon: '💀', zone: 'terokkar', minLevel: 64, boss: 'maladaar',
        waves: [
          { enemies: ['ac_ghost','ac_skeleton'], name: '前厅守卫' },
          { enemies: ['ac_ghost','ac_skeleton'], name: '回廊巡逻' },
          { enemies: ['maladaar'], name: '最终首领：主教玛拉达尔' },
        ],
        desc: '德莱尼祭司的安息之地被黑暗仪式亵渎，亡者的低语在墓道中回荡。',
        chest: { items: [['m_feliron', 3], ['m_nether', 2], ['m_crystal', 2]], gold: [7200,10000] },
      },
      sethekk_halls: {
        id: 'sethekk_halls', name: '塞泰克大厅', icon: '🕊️', zone: 'terokkar', minLevel: 66, boss: 'ikiss',
        waves: [
          { enemies: ['seth_talon','seth_priest'], name: '前厅守卫' },
          { enemies: ['seth_talon','seth_priest'], name: '回廊巡逻' },
          { enemies: ['ikiss'], name: '最终首领：塔瓦洛克·艾基斯' },
        ],
        desc: '鸦人先知的圣殿，塞泰克教派在此唤醒沉睡的利爪之王。',
        chest: { items: [['m_feliron', 3], ['m_nether', 2], ['m_crystal', 2]], gold: [8000,11000] },
      },
      shadow_labyrinth: {
        id: 'shadow_labyrinth', name: '暗影迷宫', icon: '🌑', zone: 'terokkar', minLevel: 69, boss: 'murmur',
        waves: [
          { enemies: ['sl_cultist','sl_walker'], name: '前厅守卫' },
          { enemies: ['sl_cultist','sl_walker'], name: '回廊巡逻' },
          { enemies: ['murmur'], name: '最终首领：穆鲁之音' },
        ],
        desc: '奥金顿地下的暗影议会密室，被封印的元素之音正在唤醒毁灭。',
        chest: { items: [['m_feliron', 3], ['m_nether', 2], ['m_crystal', 2]], gold: [10000,13000] },
      },
      old_hillsbrad: {
        id: 'old_hillsbrad', name: '旧希尔斯布莱德', icon: '🕰️', zone: 'caverns_of_time', minLevel: 64, boss: 'epoch_hunter',
        waves: [
          { enemies: ['oh_guard','oh_dragon'], name: '前厅守卫' },
          { enemies: ['oh_guard','oh_dragon'], name: '回廊巡逻' },
          { enemies: ['epoch_hunter'], name: '最终首领：时光猎手埃波克' },
        ],
        desc: '穿越时光回到旧希尔斯布莱德，护送萨尔逃离敦霍尔德的囚笼。',
        chest: { items: [['m_feliron', 3], ['m_nether', 2], ['m_crystal', 2]], gold: [7400,10200] },
      },
      black_morass: {
        id: 'black_morass', name: '黑色沼泽', icon: '🐊', zone: 'caverns_of_time', minLevel: 66, boss: 'aeonus',
        waves: [
          { enemies: ['bm_lurker','bm_drake'], name: '前厅守卫' },
          { enemies: ['bm_lurker','bm_drake'], name: '回廊巡逻' },
          { enemies: ['aeonus'], name: '最终首领：埃欧努斯' },
        ],
        desc: '守护黑暗之门的开启，抵挡无限龙族对时间线的侵蚀。',
        chest: { items: [['m_feliron', 3], ['m_nether', 2], ['m_crystal', 2]], gold: [8400,11400] },
      },
      mechanar: {
        id: 'mechanar', name: '能源舰', icon: '🤖', zone: 'netherstorm', minLevel: 68, boss: 'pathaleon',
        waves: [
          { enemies: ['mech_guard','mech_engineer'], name: '前厅守卫' },
          { enemies: ['mech_guard','mech_engineer'], name: '回廊巡逻' },
          { enemies: ['pathaleon'], name: '最终首领：计算者帕萨雷恩' },
        ],
        desc: '凯尔萨斯的风暴要塞卫星舰，太阳井法力在此被抽取炼成奥术兵器。',
        chest: { items: [['m_feliron', 3], ['m_nether', 2], ['m_crystal', 2]], gold: [9200,12400] },
      },
      botanica: {
        id: 'botanica', name: '生态船', icon: '🌺', zone: 'netherstorm', minLevel: 68, boss: 'warpsplinter',
        waves: [
          { enemies: ['bot_sprout','bot_keeper'], name: '前厅守卫' },
          { enemies: ['bot_sprout','bot_keeper'], name: '回廊巡逻' },
          { enemies: ['warpsplinter'], name: '最终首领：迁跃扭木' },
        ],
        desc: '风暴要塞的生态舱，被扭曲的植物在奥术催化下疯狂生长。',
        chest: { items: [['m_feliron', 3], ['m_nether', 2], ['m_crystal', 2]], gold: [9200,12400] },
      },
      arcatraz: {
        id: 'arcatraz', name: '禁魔监狱', icon: '🔒', zone: 'netherstorm', minLevel: 70, boss: 'skyriss',
        waves: [
          { enemies: ['arc_warden','arc_prisoner'], name: '前厅守卫' },
          { enemies: ['arc_warden','arc_prisoner'], name: '回廊巡逻' },
          { enemies: ['skyriss'], name: '最终首领：预言者斯克瑞斯' },
        ],
        desc: '纳鲁关押宇宙中最危险存在的牢狱，封印正在一道一道崩坏。',
        chest: { items: [['m_feliron', 3], ['m_nether', 2], ['m_crystal', 2]], gold: [10400,13800] },
      },
      magisters_terrace: {
        id: 'magisters_terrace', name: '魔导师平台', icon: '🏛️', zone: 'quel_danas', minLevel: 70, boss: 'kael_reborn',
        waves: [
          { enemies: ['mt_blood_knight','mt_priestess'], name: '前厅守卫' },
          { enemies: ['mt_blood_knight','mt_priestess'], name: '回廊巡逻' },
          { enemies: ['kael_reborn'], name: '最终首领：重生的凯尔萨斯' },
        ],
        desc: '凯尔萨斯在太阳之井废墟中重塑肉身，血骑士与秘法师誓死护卫。',
        chest: { items: [['m_feliron', 3], ['m_nether', 2], ['m_crystal', 2]], gold: [10600,14000] },
      },
      karazhan: {
        id: 'karazhan', name: '卡拉赞', icon: '🏰', zone: 'karazhan', minLevel: 70, raid: 1, boss: 'prince_malchezaar',
        waves: [
          { enemies: ['kara_ghost','kara_wolf'], name: '前厅守卫' },
          { enemies: ['kara_ghost','kara_wolf'], name: '回廊巡逻' },
          { enemies: ['prince_malchezaar'], name: '最终首领：玛克扎尔王子' },
        ],
        desc: '麦迪文的魔法高塔已沦为鬼蜮，玛克扎尔王子在塔顶谋划着扭曲的阴谋。',
        chest: { items: [['m_feliron', 3], ['m_nether', 2], ['m_crystal', 2]], gold: [13000,17000] },
      },
      gruuls_lair: {
        id: 'gruuls_lair', name: '格鲁尔的巢穴', icon: '🐗', zone: 'bladesedge', minLevel: 70, raid: 1, boss: 'gruul',
        waves: [
          { enemies: ['gruul_ogre','gruul_hound'], name: '前厅守卫' },
          { enemies: ['gruul_ogre','gruul_hound'], name: '回廊巡逻' },
          { enemies: ['gruul'], name: '最终首领：屠龙者格鲁尔' },
        ],
        desc: '刀锋山巅的食人魔王座，戈隆之王格鲁尔以巨龙的血肉为食。',
        chest: { items: [['m_feliron', 3], ['m_nether', 2], ['m_crystal', 2]], gold: [13500,17500] },
      },
      magtheridons_lair: {
        id: 'magtheridons_lair', name: '玛瑟里顿的巢穴', icon: '🐉', zone: 'hellfire', minLevel: 70, raid: 1, boss: 'magtheridon',
        waves: [
          { enemies: ['mag_felguard','mag_summoner'], name: '前厅守卫' },
          { enemies: ['mag_felguard','mag_summoner'], name: '回廊巡逻' },
          { enemies: ['magtheridon'], name: '最终首领：深渊领主玛瑟里顿' },
        ],
        desc: '被锁链束缚的深渊领主，伊利丹以一整座堡垒囚禁着这位燃烧军团的指挥官。',
        chest: { items: [['m_feliron', 3], ['m_nether', 2], ['m_crystal', 2]], gold: [13500,17500] },
      },
      serpentshrine_cavern: {
        id: 'serpentshrine_cavern', name: '毒蛇神殿', icon: '🐍', zone: 'zangarmarsh', minLevel: 70, raid: 1, boss: 'lady_vashj',
        waves: [
          { enemies: ['ssc_naga','ssc_hydra'], name: '前厅守卫' },
          { enemies: ['ssc_naga','ssc_hydra'], name: '回廊巡逻' },
          { enemies: ['lady_vashj'], name: '最终首领：瓦斯琪女士' },
        ],
        desc: '盘牙水库最深处的祭坛，瓦斯琪女士正为她的新主人抽取外域的水源。',
        chest: { items: [['m_feliron', 3], ['m_nether', 2], ['m_crystal', 2]], gold: [14000,18000] },
      },
      tempest_keep: {
        id: 'tempest_keep', name: '风暴要塞', icon: '🛸', zone: 'netherstorm', minLevel: 70, raid: 1, boss: 'kaelthas',
        waves: [
          { enemies: ['tk_solar','tk_void'], name: '前厅守卫' },
          { enemies: ['tk_solar','tk_void'], name: '回廊巡逻' },
          { enemies: ['kaelthas'], name: '最终首领：凯尔萨斯·逐日者' },
        ],
        desc: '纳鲁的旗舰要塞，凯尔萨斯占据了这座水晶飞船并向虚空宣誓效忠。',
        chest: { items: [['m_feliron', 3], ['m_nether', 2], ['m_crystal', 2]], gold: [14500,18500] },
      },
      battle_for_hyjal: {
        id: 'battle_for_hyjal', name: '海加尔山之战', icon: '🌳', zone: 'caverns_of_time', minLevel: 70, raid: 1, boss: 'archimonde',
        waves: [
          { enemies: ['hyjal_ghoul','hyjal_abom'], name: '前厅守卫' },
          { enemies: ['hyjal_ghoul','hyjal_abom'], name: '回廊巡逻' },
          { enemies: ['archimonde'], name: '最终首领：污染者阿克蒙德' },
        ],
        desc: '回到海加尔山的圣战，与吉安娜、萨尔和泰兰德并肩抵挡燃烧军团。',
        chest: { items: [['m_feliron', 3], ['m_nether', 2], ['m_crystal', 2]], gold: [14500,18500] },
      },
      black_temple: {
        id: 'black_temple', name: '黑暗神殿', icon: '👁️', zone: 'shadowmoon', minLevel: 70, raid: 1, boss: 'illidan',
        waves: [
          { enemies: ['bt_bloodelf','bt_demon'], name: '前厅守卫' },
          { enemies: ['bt_bloodelf','bt_demon'], name: '回廊巡逻' },
          { enemies: ['illidan'], name: '最终首领：伊利丹·怒风' },
        ],
        desc: '伊利丹的黑暗神殿，背叛者的怒火与邪能火焰在此燃烧。',
        chest: { items: [['m_feliron', 3], ['m_nether', 2], ['m_crystal', 2]], gold: [15500,20000] },
      },
      sunwell_plateau: {
        id: 'sunwell_plateau', name: '太阳井高地', icon: '☀️', zone: 'quel_danas', minLevel: 70, raid: 1, boss: 'kiljaeden',
        waves: [
          { enemies: ['swp_priestess','swp_dragon'], name: '前厅守卫' },
          { enemies: ['swp_priestess','swp_dragon'], name: '回廊巡逻' },
          { enemies: ['kiljaeden'], name: '最终首领：燃烧军团之主基尔加丹' },
        ],
        desc: '太阳之井的废墟之上，燃烧军团之主正从虚空裂隙中踏入艾泽拉斯。',
        chest: { items: [['m_feliron', 3], ['m_nether', 2], ['m_crystal', 2]], gold: [17500,23000] },
      },
    });

    /* ---------- 中途首领(按最终首领数值缩放后插入到最终波次之前) ---------- */
    (function () {
      const B = {
        hellfire_ramparts: [['gargolmar','守望者加格玛尔','🛡️','humanoid',['m_charge','m_bash','m_war_cry']],['omor','刀枪不入的奥摩','👺','humanoid',['m_fel_cleave','m_rend','m_enrage']]],
        blood_furnace: [['the_maker','制造者','🧪','humanoid',['m_bash','m_war_cry','m_rend']],['broggok','布洛戈克','👁️','demon',['m_fel_flames','m_bash','m_enrage']]],
        shattered_halls: [['nethekurse','高阶术士奈瑟库斯','🔮','humanoid',['m_shadow','m_fel_flames','m_war_cry']],['omrogg','战争使者奥姆罗格','👹','humanoid',['m_bash','m_charge','m_enrage']]],
        slave_pens: [['mennu','巨钳船长门努','🦀','humanoid',['m_bash','m_charge','m_war_cry']],['rokmora','沼地先知洛克玛拉','🧙','humanoid',['m_frost','m_heal','m_war_cry']]],
        underbog: [['hungarfen','饥饿者芬古尔','🌱','elemental',['m_poison','m_breath','m_enrage']],['ghazan','加兹安','🦎','beast',['m_poison','m_bash','m_charge']]],
        steamvault: [['sepethrea','水术师塞斯皮娅','🌊','humanoid',['m_frost','m_breath','m_war_cry']],['mekgineer','机械师斯蒂里格','🤖','mechanical',['m_charge','m_bash','m_enrage']]],
        mana_tombs: [['pandemonius','潘德莫纽斯','🌑','demon',['m_void_strike','m_shadow','m_enrage']],['tavarok','塔瓦洛克','🗿','humanoid',['m_bash','m_charge','m_war_cry']]],
        auchenai_crypts: [['shirrak','亡语者希尔拉克','☠️','undead',['m_shadow','m_soul_drain','m_war_cry']]],
        sethekk_halls: [['syth','暗织者西斯','🕸️','humanoid',['m_void_strike','m_shadow','m_war_cry']]],
        shadow_labyrinth: [['hellmaw','大使赫尔亚','👄','demon',['m_shadow','m_death_coil','m_war_cry']],['vorpil','大宗师沃尔皮尔','🧙','humanoid',['m_soul_drain','m_shadow','m_heal']]],
        old_hillsbrad: [['drake','德拉克中尉','⚔️','humanoid',['m_charge','m_rend','m_enrage']],['skarloc','队长斯卡洛克','🛡️','humanoid',['m_bash','m_war_cry','m_charge']]],
        black_morass: [['deja','时光领主德亚','⏳','dragon',['m_breath','m_frost','m_war_cry']],['temporus','永恒者泰姆普鲁斯','🐉','dragon',['m_breath','m_void_strike','m_enrage']]],
        mechanar: [['capacitus','机械领主卡帕西图斯','⚙️','mechanical',['m_supernova','m_bash','m_enrage']],['sepethrea2','星术师塞皮瑟蕾','✨','humanoid',['m_supernova','m_frost','m_war_cry']]],
        botanica: [['sarannis','指挥官萨拉妮丝','🎖️','humanoid',['m_supernova','m_charge','m_war_cry']],['freywinn','高阶植物学家弗雷温','🌿','humanoid',['m_poison','m_heal','m_enrage']]],
        arcatraz: [['zereketh','湮灭者泽雷凯斯','🌑','demon',['m_void_strike','m_shadow','m_enrage']],['dalliah','女祭司达莉娅','🧙','humanoid',['m_shadow','m_soul_drain','m_heal']]],
        magisters_terrace: [['selin','炽炎塞琳','🔥','humanoid',['m_fel_flames','m_supernova','m_war_cry']],['delrissa','女祭司德莉希亚','🗡️','humanoid',['m_shadow','m_heal','m_charge']]],
        karazhan: [['attumen','猎手阿图门','🐎','undead',['m_charge','m_rend','m_war_cry']],['moroes','莫罗斯','🗡️','undead',['m_shadow','m_death_coil','m_war_cry']],['curator','馆长','🛡️','mechanical',['m_supernova','m_bash','m_enrage']]],
        gruuls_lair: [['maulgar','大君王莫加尔','👑','humanoid',['m_charge','m_war_cry','m_rend']]],
        magtheridons_lair: [['mag_hellfire','炎爆守卫','🔥','elemental',['m_fel_flames','m_bash','m_enrage']],['mag_knight','深渊骑士','⚔️','demon',['m_fel_cleave','m_charge','m_war_cry']]],
        serpentshrine_cavern: [['lurker','深渊潜伏者','🦑','beast',['m_breath','m_bite','m_enrage']],['leotheras','盲眼莱欧瑟拉斯','🗡️','demon',['m_void_strike','m_rend','m_enrage']],['karathress','深水领主卡拉瑟雷斯','🔱','humanoid',['m_frost','m_heal','m_war_cry']]],
        tempest_keep: [['alar','凤凰阿兰娜','🔥','elemental',['m_fel_flames','m_charge','m_enrage']],['void_reaver','虚空掠夺者','🤖','mechanical',['m_supernova','m_bash','m_enrage']],['solarian','高阶星术师索拉瑞恩','✨','humanoid',['m_supernova','m_frost','m_war_cry']]],
        battle_for_hyjal: [['winterchill','寒冬之怒','❄️','elemental',['m_frost','m_breath','m_enrage']],['anetheron','阿奈瑟隆','😈','demon',['m_fel_cleave','m_shadow','m_war_cry']],['kazrogal','卡兹洛加尔','👿','demon',['m_fel_flames','m_bash','m_enrage']]],
        black_temple: [['najentus','高阶督军纳因图斯','🛡️','humanoid',['m_charge','m_bash','m_war_cry']],['supremus','苏普雷姆斯','👹','demon',['m_bash','m_charge','m_enrage']],['teron','特隆·血魔','💀','undead',['m_void_strike','m_soul_drain','m_enrage']]],
        sunwell_plateau: [['kalecgos','蓝龙卡雷苟斯','🐲','dragon',['m_breath','m_frost','m_enrage']],['brutallus','布鲁塔卢斯','👹','demon',['m_bash','m_charge','m_enrage']],['felmyst','菲米丝','🐍','dragon',['m_breath','m_poison','m_enrage']]],
      };
      for (const dgid in B) {
        const dg = D.DUNGEONS[dgid];
        if (!dg || !dg.boss) continue;
        const fb = D.MONSTERS[dg.boss];
        if (!fb) continue;
        const pool = TBC_POOL[dgid] || ['m_feliron'];
        dg.bosses = [];
        const n = B[dgid].length;
        B[dgid].forEach(function (b, bi) {
          const mid = b[0], name = b[1], icon = b[2], kind = b[3], skills = b[4];
          const step = n > 1 ? bi / (n - 1) : 0;
          D.MONSTERS[mid] = {
            id: mid, name: name, icon: icon, level: Math.max(1, Math.min(W.Config.LEVEL_CAP, fb.level - 1)),
            hp: Math.round(fb.hp * (0.62 + 0.26 * step)),
            atk: [Math.round(fb.atk[0] * (0.93 + 0.06 * step)), Math.round(fb.atk[1] * (0.93 + 0.06 * step))],
            armor: Math.round(fb.armor * (0.92 + 0.04 * step)),
            xp: Math.round(fb.xp * (0.52 + 0.22 * step)), gold: Math.round(fb.gold * (0.5 + 0.22 * step)),
            kind: kind, skills: skills, ai: 'smart', elite: 1, boss: 1, sub: 1,
            title: dg.name + ' · 首领',
          };
          const eq = pool[bi % pool.length];
          const csm = pool[(bi + 1) % pool.length];
          const mat = pool.length > 2 ? pool[(bi + 2) % pool.length] : 'm_feliron';
          D.DROPS[mid] = [[eq, 0.4], [csm, 0.3], [mat, 0.5]];
          dg.bosses.push(mid);
          dg.waves.splice(dg.waves.length - 1, 0, { enemies: [mid], name: '首领：' + name });
        });
        dg.bosses.push(dg.boss);
      }
    })();

    /* ---------- 外域掉落(材料 / 药水 / 61-70 装备) ---------- */
    Object.assign(D.DROPS, {
      hell_boar: [['a_out_helm',0.14],['m_feliron',0.35],['c_out_heal',0.16],['m_nether',0.08]],
      hell_ravager: [['a_out_cloak',0.14],['m_feliron',0.35],['c_out_heal',0.16],['m_nether',0.08]],
      hell_orc: [['a_out_ring',0.14],['m_feliron',0.35],['c_out_heal',0.16],['m_nether',0.08]],
      hell_demon: [['a_out_gloves',0.14],['m_feliron',0.35],['c_out_heal',0.16],['m_nether',0.08]],
      hell_elite: [['tr_out_signet',0.5],['m_feliron',0.7],['c_out_heal',0.6],['m_nether',0.4],['a_out_neck',0.35],['c_nether_flask',0.25]],
      zang_bog: [['w_outland_blade',0.14],['m_feliron',0.35],['c_out_heal',0.16],['m_nether',0.08]],
      zang_naga: [['w_outland_staff',0.14],['m_feliron',0.35],['c_out_heal',0.16],['m_nether',0.08]],
      zang_spore: [['a_out_neck',0.14],['m_feliron',0.35],['c_out_heal',0.16],['m_nether',0.08]],
      zang_hydra: [['a_out_boots',0.14],['m_feliron',0.35],['c_out_heal',0.16],['m_nether',0.08]],
      zang_elite: [['a_out_helm',0.5],['m_feliron',0.7],['c_out_heal',0.6],['m_nether',0.4],['a_out_gloves',0.35],['c_nether_flask',0.25]],
      ter_arakkoa: [['a_out_cloak',0.14],['m_feliron',0.35],['c_out_heal',0.16],['m_nether',0.08]],
      ter_spider: [['a_out_ring',0.14],['m_feliron',0.35],['c_out_heal',0.16],['m_nether',0.08]],
      ter_wolf: [['a_out_gloves',0.14],['m_feliron',0.35],['c_out_heal',0.16],['m_nether',0.08]],
      ter_treant: [['tr_void_eye',0.14],['m_feliron',0.35],['c_out_heal',0.16],['m_nether',0.08]],
      ter_elite: [['w_nether_edge',0.5],['m_feliron',0.7],['c_out_heal',0.6],['m_nether',0.4],['a_void_boots',0.35],['c_nether_flask',0.25]],
      nag_clefthoof: [['w_outland_staff',0.14],['m_feliron',0.35],['c_out_heal',0.16],['m_nether',0.08]],
      nag_ogre: [['a_void_legs',0.14],['m_feliron',0.35],['c_out_heal',0.16],['m_nether',0.08]],
      nag_windroc: [['a_void_boots',0.14],['m_feliron',0.35],['c_out_heal',0.16],['m_nether',0.08]],
      nag_ravager: [['a_void_hood',0.14],['m_feliron',0.35],['c_out_heal',0.16],['m_nether',0.08]],
      nag_elite: [['a_sun_cloak',0.5],['m_feliron',0.7],['c_out_heal',0.6],['m_nether',0.4],['tr_sun_seal',0.35],['c_nether_flask',0.25]],
      be_ogre: [['a_void_ring',0.14],['m_feliron',0.35],['c_out_heal',0.16],['m_nether',0.08]],
      be_ravager: [['a_void_neck',0.14],['m_feliron',0.35],['c_out_heal',0.16],['m_nether',0.08]],
      be_drake: [['tr_void_eye',0.14],['m_feliron',0.35],['c_out_heal',0.16],['m_nether',0.08]],
      be_gnome: [['a_sun_gloves',0.14],['m_feliron',0.35],['c_out_heal',0.16],['m_nether',0.08]],
      be_elite: [['a_sun_legs',0.5],['m_feliron',0.7],['c_out_heal',0.6],['m_nether',0.4],['a_sun_crown',0.35],['c_nether_flask',0.25]],
      net_ether: [['a_void_legs',0.14],['m_feliron',0.35],['c_out_heal',0.16],['m_nether',0.08]],
      net_mana: [['w_nether_edge',0.14],['m_feliron',0.35],['c_out_heal',0.16],['m_nether',0.08]],
      net_void: [['a_sun_crown',0.14],['m_feliron',0.35],['c_out_heal',0.16],['m_nether',0.08]],
      net_robot: [['a_sun_cloak',0.14],['m_feliron',0.35],['c_out_heal',0.16],['m_nether',0.08]],
      net_elite: [['a_sun_ring',0.5],['m_feliron',0.7],['c_out_heal',0.6],['m_nether',0.4],['a_sun_gloves',0.35],['c_nether_flask',0.25]],
      sm_demon: [['a_void_neck',0.14],['m_feliron',0.35],['c_out_heal',0.16],['m_nether',0.08]],
      sm_wolf: [['tr_sun_seal',0.14],['m_feliron',0.35],['c_out_heal',0.16],['m_nether',0.08]],
      sm_drake: [['a_sun_gloves',0.14],['m_feliron',0.35],['c_out_heal',0.16],['m_nether',0.08]],
      sm_elemental: [['a_sun_legs',0.14],['m_feliron',0.35],['c_out_heal',0.16],['m_nether',0.08]],
      sm_elite: [['a_sun_boots',0.5],['m_feliron',0.7],['c_out_heal',0.6],['m_nether',0.4],['a_sun_cloak',0.35],['c_nether_flask',0.25]],
      rampart_orc: [['m_feliron',0.3],['c_out_mana',0.14],['m_nether',0.12]],
      rampart_whelp: [['m_feliron',0.3],['c_out_mana',0.14],['m_nether',0.12]],
      bf_guard: [['m_feliron',0.3],['c_out_mana',0.14],['m_nether',0.12]],
      bf_imp: [['m_feliron',0.3],['c_out_mana',0.14],['m_nether',0.12]],
      sh_legionnaire: [['m_feliron',0.3],['c_out_mana',0.14],['m_nether',0.12]],
      sh_archer: [['m_feliron',0.3],['c_out_mana',0.14],['m_nether',0.12]],
      sp_keeper: [['m_feliron',0.3],['c_out_mana',0.14],['m_nether',0.12]],
      sp_crab: [['m_feliron',0.3],['c_out_mana',0.14],['m_nether',0.12]],
      ub_lord: [['m_feliron',0.3],['c_out_mana',0.14],['m_nether',0.12]],
      ub_spore: [['m_feliron',0.3],['c_out_mana',0.14],['m_nether',0.12]],
      sv_giant: [['m_feliron',0.3],['c_out_mana',0.14],['m_nether',0.12]],
      sv_naga: [['m_feliron',0.3],['c_out_mana',0.14],['m_nether',0.12]],
      mt_ethereal: [['m_feliron',0.3],['c_out_mana',0.14],['m_nether',0.12]],
      mt_arcane: [['m_feliron',0.3],['c_out_mana',0.14],['m_nether',0.12]],
      ac_ghost: [['m_feliron',0.3],['c_out_mana',0.14],['m_nether',0.12]],
      ac_skeleton: [['m_feliron',0.3],['c_out_mana',0.14],['m_nether',0.12]],
      seth_talon: [['m_feliron',0.3],['c_out_mana',0.14],['m_nether',0.12]],
      seth_priest: [['m_feliron',0.3],['c_out_mana',0.14],['m_nether',0.12]],
      sl_cultist: [['m_feliron',0.3],['c_out_mana',0.14],['m_nether',0.12]],
      sl_walker: [['m_feliron',0.3],['c_out_mana',0.14],['m_nether',0.12]],
      oh_guard: [['m_feliron',0.3],['c_out_mana',0.14],['m_nether',0.12]],
      oh_dragon: [['m_feliron',0.3],['c_out_mana',0.14],['m_nether',0.12]],
      bm_lurker: [['m_feliron',0.3],['c_out_mana',0.14],['m_nether',0.12]],
      bm_drake: [['m_feliron',0.3],['c_out_mana',0.14],['m_nether',0.12]],
      mech_guard: [['m_feliron',0.3],['c_out_mana',0.14],['m_nether',0.12]],
      mech_engineer: [['m_feliron',0.3],['c_out_mana',0.14],['m_nether',0.12]],
      bot_sprout: [['m_feliron',0.3],['c_out_mana',0.14],['m_nether',0.12]],
      bot_keeper: [['m_feliron',0.3],['c_out_mana',0.14],['m_nether',0.12]],
      arc_warden: [['m_feliron',0.3],['c_out_mana',0.14],['m_nether',0.12]],
      arc_prisoner: [['m_feliron',0.3],['c_out_mana',0.14],['m_nether',0.12]],
      mt_blood_knight: [['m_feliron',0.3],['c_out_mana',0.14],['m_nether',0.12]],
      mt_priestess: [['m_feliron',0.3],['c_out_mana',0.14],['m_nether',0.12]],
      kara_ghost: [['m_feliron',0.3],['c_out_mana',0.14],['m_nether',0.12]],
      kara_wolf: [['m_feliron',0.3],['c_out_mana',0.14],['m_nether',0.12]],
      gruul_ogre: [['m_feliron',0.3],['c_out_mana',0.14],['m_nether',0.12]],
      gruul_hound: [['m_feliron',0.3],['c_out_mana',0.14],['m_nether',0.12]],
      mag_felguard: [['m_feliron',0.3],['c_out_mana',0.14],['m_nether',0.12]],
      mag_summoner: [['m_feliron',0.3],['c_out_mana',0.14],['m_nether',0.12]],
      ssc_naga: [['m_feliron',0.3],['c_out_mana',0.14],['m_nether',0.12]],
      ssc_hydra: [['m_feliron',0.3],['c_out_mana',0.14],['m_nether',0.12]],
      tk_solar: [['m_feliron',0.3],['c_out_mana',0.14],['m_nether',0.12]],
      tk_void: [['m_feliron',0.3],['c_out_mana',0.14],['m_nether',0.12]],
      hyjal_ghoul: [['m_feliron',0.3],['c_out_mana',0.14],['m_nether',0.12]],
      hyjal_abom: [['m_feliron',0.3],['c_out_mana',0.14],['m_nether',0.12]],
      bt_bloodelf: [['m_feliron',0.3],['c_out_mana',0.14],['m_nether',0.12]],
      bt_demon: [['m_feliron',0.3],['c_out_mana',0.14],['m_nether',0.12]],
      swp_priestess: [['m_feliron',0.3],['c_out_mana',0.14],['m_nether',0.12]],
      swp_dragon: [['m_feliron',0.3],['c_out_mana',0.14],['m_nether',0.12]],
    });

    /* ---------- 副本最终首领掉落(招牌装备 + 材料;必掉奥术水晶) ---------- */
    Object.assign(D.DROPS, {
      vazruden: [['a_out_helm',0.6],['w_outland_blade',0.5],['m_crystal',1],['m_nether',0.7],['m_feliron',0.8],['c_nether_flask',0.35]],
      kelidan: [['a_out_chest',0.6],['w_outland_staff',0.5],['m_crystal',1],['m_nether',0.7],['m_feliron',0.8],['c_nether_flask',0.35]],
      kargath: [['a_void_gauntlets',0.6],['w_shattered_blade',0.5],['m_crystal',1],['m_nether',0.7],['m_feliron',0.8],['c_nether_flask',0.35]],
      quagmirran: [['a_out_gloves',0.6],['a_out_cloak',0.5],['m_crystal',1],['m_nether',0.7],['m_feliron',0.8],['c_nether_flask',0.35]],
      black_stalker: [['a_out_ring',0.6],['a_out_legs',0.5],['m_crystal',1],['m_nether',0.7],['m_feliron',0.8],['c_nether_flask',0.35]],
      kalithresh: [['a_void_ring',0.6],['a_void_neck',0.5],['m_crystal',1],['m_nether',0.7],['m_feliron',0.8],['c_nether_flask',0.35]],
      shaffar: [['tr_out_signet',0.6],['a_out_neck',0.5],['m_crystal',1],['m_nether',0.7],['m_feliron',0.8],['c_nether_flask',0.35]],
      maladaar: [['a_out_helm',0.6],['w_off_out_shield',0.5],['m_crystal',1],['m_nether',0.7],['m_feliron',0.8],['c_nether_flask',0.35]],
      ikiss: [['a_void_hood',0.6],['w_nether_edge',0.5],['m_crystal',1],['m_nether',0.7],['m_feliron',0.8],['c_nether_flask',0.35]],
      murmur: [['a_void_hood',0.6],['a_void_cloak',0.5],['m_crystal',1],['m_nether',0.7],['m_feliron',0.8],['c_nether_flask',0.35]],
      epoch_hunter: [['a_void_legs',0.6],['a_out_cloak',0.5],['m_crystal',1],['m_nether',0.7],['m_feliron',0.8],['c_nether_flask',0.35]],
      aeonus: [['a_void_cloak',0.6],['w_nether_edge',0.5],['m_crystal',1],['m_nether',0.7],['m_feliron',0.8],['c_nether_flask',0.35]],
      pathaleon: [['a_void_gauntlets',0.6],['w_nether_staff',0.5],['m_crystal',1],['m_nether',0.7],['m_feliron',0.8],['c_nether_flask',0.35]],
      warpsplinter: [['a_void_plate',0.6],['a_void_boots',0.5],['m_crystal',1],['m_nether',0.7],['m_feliron',0.8],['c_nether_flask',0.35]],
      skyriss: [['a_sun_crown',0.6],['w_void_staff',0.5],['m_crystal',1],['m_nether',0.7],['m_feliron',0.8],['c_nether_flask',0.35]],
      kael_reborn: [['a_sun_robe',0.6],['w_off_sun_blade',0.5],['m_crystal',1],['m_nether',0.7],['m_feliron',0.8],['c_nether_flask',0.35]],
      prince_malchezaar: [['a_sun_crown',0.6],['w_nether_edge',0.5],['m_crystal',1],['m_nether',0.7],['m_feliron',0.8],['c_nether_flask',0.35]],
      gruul: [['a_sun_gloves',0.6],['a_sun_legs',0.5],['m_crystal',1],['m_nether',0.7],['m_feliron',0.8],['c_nether_flask',0.35]],
      magtheridon: [['a_sun_robe',0.6],['a_sun_crown',0.5],['m_crystal',1],['m_nether',0.7],['m_feliron',0.8],['c_nether_flask',0.35]],
      lady_vashj: [['a_sun_legs',0.6],['w_void_staff',0.5],['m_crystal',1],['m_nether',0.7],['m_feliron',0.8],['c_nether_flask',0.35]],
      kaelthas: [['a_sun_robe',0.6],['w_naaru_staff',0.5],['m_crystal',1],['m_nether',0.7],['m_feliron',0.8],['c_nether_flask',0.35]],
      archimonde: [['a_sun_crown',0.6],['a_sun_robe',0.5],['m_crystal',1],['m_nether',0.7],['m_feliron',0.8],['c_nether_flask',0.35]],
      illidan: [['w_warglaive',0.6],['tr_skull_guldan',0.5],['m_crystal',1],['m_nether',0.7],['m_feliron',0.8],['c_nether_flask',0.35]],
      kiljaeden: [['a_sun_robe',0.6],['w_thori_dal',0.5],['m_crystal',1],['m_nether',0.7],['m_feliron',0.8],['c_nether_flask',0.35]],
      doomwalker: [['w_black_temple_blade',0.5],['tr_sun_seal',0.5],['m_nether',0.9],['m_crystal',1],['c_nether_flask',0.5]],
    });

    /* ---------- 外域任务(副本讨伐 + 区域悬赏;通用地图悬赏由文件末尾生成器补) ---------- */
    Object.assign(D.QUESTS, {
      q_tbc_hellfire_ramparts: Q('q_tbc_hellfire_ramparts', '远征：地狱火城墙', 'hellfire_ramparts', 58, '深入地狱火城墙，击败瓦兹鲁登·先锋！', 'vazruden', 1, 30160, 24360, ['a_out_helm','m_nether','m_crystal'], { giver: '远征军需官' }),
      q_tbc_blood_furnace: Q('q_tbc_blood_furnace', '远征：血熔炉', 'blood_furnace', 60, '深入血熔炉，击败击碎者基尔罗格！', 'kelidan', 1, 31200, 25200, ['a_out_chest','m_nether','m_crystal'], { giver: '远征军需官' }),
      q_tbc_shattered_halls: Q('q_tbc_shattered_halls', '远征：破碎大厅', 'shattered_halls', 68, '深入破碎大厅，击败卡加斯·刃拳！', 'kargath', 1, 35360, 28560, ['a_void_gauntlets','m_nether','m_crystal'], { giver: '远征军需官' }),
      q_tbc_slave_pens: Q('q_tbc_slave_pens', '远征：奴隶围栏', 'slave_pens', 61, '深入奴隶围栏，击败夸格米拉！', 'quagmirran', 1, 31720, 25620, ['a_out_gloves','m_nether','m_crystal'], { giver: '远征军需官' }),
      q_tbc_underbog: Q('q_tbc_underbog', '远征：幽暗沼泽', 'underbog', 62, '深入幽暗沼泽，击败黑色追踪者！', 'black_stalker', 1, 32240, 26040, ['a_out_ring','m_nether','m_crystal'], { giver: '远征军需官' }),
      q_tbc_steamvault: Q('q_tbc_steamvault', '远征：蒸汽地窟', 'steamvault', 68, '深入蒸汽地窟，击败督军卡利瑟里斯！', 'kalithresh', 1, 35360, 28560, ['a_void_ring','m_nether','m_crystal'], { giver: '远征军需官' }),
      q_tbc_mana_tombs: Q('q_tbc_mana_tombs', '远征：法力陵墓', 'mana_tombs', 63, '深入法力陵墓，击败节点亲王沙法尔！', 'shaffar', 1, 32760, 26460, ['tr_out_signet','m_nether','m_crystal'], { giver: '远征军需官' }),
      q_tbc_auchenai_crypts: Q('q_tbc_auchenai_crypts', '远征：奥金尼地穴', 'auchenai_crypts', 64, '深入奥金尼地穴，击败主教玛拉达尔！', 'maladaar', 1, 33280, 26880, ['a_out_helm','m_nether','m_crystal'], { giver: '远征军需官' }),
      q_tbc_sethekk_halls: Q('q_tbc_sethekk_halls', '远征：塞泰克大厅', 'sethekk_halls', 66, '深入塞泰克大厅，击败塔瓦洛克·艾基斯！', 'ikiss', 1, 34320, 27720, ['a_void_hood','m_nether','m_crystal'], { giver: '远征军需官' }),
      q_tbc_shadow_labyrinth: Q('q_tbc_shadow_labyrinth', '远征：暗影迷宫', 'shadow_labyrinth', 69, '深入暗影迷宫，击败穆鲁之音！', 'murmur', 1, 35880, 28980, ['a_void_hood','m_nether','m_crystal'], { giver: '远征军需官' }),
      q_tbc_old_hillsbrad: Q('q_tbc_old_hillsbrad', '远征：旧希尔斯布莱德', 'old_hillsbrad', 64, '深入旧希尔斯布莱德，击败时光猎手埃波克！', 'epoch_hunter', 1, 33280, 26880, ['a_void_legs','m_nether','m_crystal'], { giver: '远征军需官' }),
      q_tbc_black_morass: Q('q_tbc_black_morass', '远征：黑色沼泽', 'black_morass', 66, '深入黑色沼泽，击败埃欧努斯！', 'aeonus', 1, 34320, 27720, ['a_void_cloak','m_nether','m_crystal'], { giver: '远征军需官' }),
      q_tbc_mechanar: Q('q_tbc_mechanar', '远征：能源舰', 'mechanar', 68, '深入能源舰，击败计算者帕萨雷恩！', 'pathaleon', 1, 35360, 28560, ['a_void_gauntlets','m_nether','m_crystal'], { giver: '远征军需官' }),
      q_tbc_botanica: Q('q_tbc_botanica', '远征：生态船', 'botanica', 68, '深入生态船，击败迁跃扭木！', 'warpsplinter', 1, 35360, 28560, ['a_void_plate','m_nether','m_crystal'], { giver: '远征军需官' }),
      q_tbc_arcatraz: Q('q_tbc_arcatraz', '远征：禁魔监狱', 'arcatraz', 70, '深入禁魔监狱，击败预言者斯克瑞斯！', 'skyriss', 1, 36400, 29400, ['a_sun_crown','m_nether','m_crystal'], { giver: '远征军需官' }),
      q_tbc_magisters_terrace: Q('q_tbc_magisters_terrace', '远征：魔导师平台', 'magisters_terrace', 70, '深入魔导师平台，击败重生的凯尔萨斯！', 'kael_reborn', 1, 36400, 29400, ['a_sun_robe','m_nether','m_crystal'], { giver: '远征军需官' }),
      q_tbc_karazhan: Q('q_tbc_karazhan', '远征：卡拉赞', 'karazhan', 70, '深入卡拉赞，击败玛克扎尔王子！', 'prince_malchezaar', 1, 36400, 29400, ['a_sun_crown','m_nether','m_crystal'], { giver: '远征军需官' }),
      q_tbc_gruuls_lair: Q('q_tbc_gruuls_lair', '远征：格鲁尔的巢穴', 'gruuls_lair', 70, '深入格鲁尔的巢穴，击败屠龙者格鲁尔！', 'gruul', 1, 36400, 29400, ['a_sun_gloves','m_nether','m_crystal'], { giver: '远征军需官' }),
      q_tbc_magtheridons_lair: Q('q_tbc_magtheridons_lair', '远征：玛瑟里顿的巢穴', 'magtheridons_lair', 70, '深入玛瑟里顿的巢穴，击败深渊领主玛瑟里顿！', 'magtheridon', 1, 36400, 29400, ['a_sun_robe','m_nether','m_crystal'], { giver: '远征军需官' }),
      q_tbc_serpentshrine_cavern: Q('q_tbc_serpentshrine_cavern', '远征：毒蛇神殿', 'serpentshrine_cavern', 70, '深入毒蛇神殿，击败瓦斯琪女士！', 'lady_vashj', 1, 36400, 29400, ['a_sun_legs','m_nether','m_crystal'], { giver: '远征军需官' }),
      q_tbc_tempest_keep: Q('q_tbc_tempest_keep', '远征：风暴要塞', 'tempest_keep', 70, '深入风暴要塞，击败凯尔萨斯·逐日者！', 'kaelthas', 1, 36400, 29400, ['a_sun_robe','m_nether','m_crystal'], { giver: '远征军需官' }),
      q_tbc_battle_for_hyjal: Q('q_tbc_battle_for_hyjal', '远征：海加尔山之战', 'battle_for_hyjal', 70, '深入海加尔山之战，击败污染者阿克蒙德！', 'archimonde', 1, 36400, 29400, ['a_sun_crown','m_nether','m_crystal'], { giver: '远征军需官' }),
      q_tbc_black_temple: Q('q_tbc_black_temple', '远征：黑暗神殿', 'black_temple', 70, '深入黑暗神殿，击败伊利丹·怒风！', 'illidan', 1, 36400, 29400, ['w_warglaive','m_nether','m_crystal'], { giver: '远征军需官' }),
      q_tbc_sunwell_plateau: Q('q_tbc_sunwell_plateau', '远征：太阳井高地', 'sunwell_plateau', 70, '深入太阳井高地，击败燃烧军团之主基尔加丹！', 'kiljaeden', 1, 36400, 29400, ['a_sun_robe','m_nether','m_crystal'], { giver: '远征军需官' }),
      q_tbc_hell_ravager: Q('q_tbc_hell_ravager', '清剿地狱火掠食者', 'hellfire', 58, '地狱火半岛的地狱火掠食者威胁远征军的补给线，消灭 5 只。', 'hell_ravager', 5, 2668, 754, ['m_feliron', 'm_crystal']),
      q_tbc_zang_naga: Q('q_tbc_zang_naga', '清剿暗鳞纳迦', 'zangarmarsh', 60, '赞加沼泽的暗鳞纳迦威胁远征军的补给线，消灭 6 只。', 'zang_naga', 6, 2760, 780, ['m_feliron', 'm_crystal']),
      q_tbc_ter_spider: Q('q_tbc_ter_spider', '清剿泰罗卡毒蛛', 'terokkar', 62, '泰罗卡森林的泰罗卡毒蛛威胁远征军的补给线，消灭 6 只。', 'ter_spider', 6, 2852, 806, ['m_feliron', 'm_crystal']),
      q_tbc_nag_ogre: Q('q_tbc_nag_ogre', '清剿石拳食人魔', 'nagrand', 64, '纳格兰的石拳食人魔威胁远征军的补给线，消灭 5 只。', 'nag_ogre', 5, 2944, 832, ['m_feliron', 'm_crystal']),
      q_tbc_be_drake: Q('q_tbc_be_drake', '清剿虚空幼龙', 'bladesedge', 65, '刀锋山的虚空幼龙威胁远征军的补给线，消灭 5 只。', 'be_drake', 5, 2990, 845, ['m_feliron', 'm_crystal']),
      q_tbc_net_void: Q('q_tbc_net_void', '清剿虚空行者', 'netherstorm', 67, '虚空风暴的虚空行者威胁远征军的补给线，消灭 6 只。', 'net_void', 6, 3082, 871, ['m_feliron', 'm_crystal']),
      q_tbc_sm_drake: Q('q_tbc_sm_drake', '清剿影月幼龙', 'shadowmoon', 67, '影月谷的影月幼龙威胁远征军的补给线，消灭 5 只。', 'sm_drake', 5, 3082, 871, ['m_feliron', 'm_crystal']),
    });

    /* ---------- 外域遭遇表 ---------- */
    Object.assign(D.ENCOUNTERS, {
      hellfire: [[1,['hell_boar']],[0.9,['hell_ravager']],[0.8,['hell_orc']],[0.6,['hell_demon']],[0.35,['hell_boar','hell_ravager']],[0.1,['hell_elite']]],
      zangarmarsh: [[1,['zang_bog']],[0.9,['zang_naga']],[0.8,['zang_spore']],[0.6,['zang_hydra']],[0.35,['zang_bog','zang_naga']],[0.1,['zang_elite']]],
      terokkar: [[1,['ter_arakkoa']],[0.9,['ter_spider']],[0.8,['ter_wolf']],[0.6,['ter_treant']],[0.35,['ter_arakkoa','ter_spider']],[0.1,['ter_elite']]],
      nagrand: [[1,['nag_clefthoof']],[0.9,['nag_ogre']],[0.8,['nag_windroc']],[0.6,['nag_ravager']],[0.35,['nag_clefthoof','nag_ogre']],[0.1,['nag_elite']]],
      bladesedge: [[1,['be_ogre']],[0.9,['be_ravager']],[0.8,['be_drake']],[0.6,['be_gnome']],[0.35,['be_ogre','be_ravager']],[0.1,['be_elite']]],
      netherstorm: [[1,['net_ether']],[0.9,['net_mana']],[0.8,['net_void']],[0.6,['net_robot']],[0.35,['net_ether','net_mana']],[0.1,['net_elite']]],
      shadowmoon: [[1,['sm_demon']],[0.9,['sm_wolf']],[0.8,['sm_drake']],[0.6,['sm_elemental']],[0.35,['sm_demon','sm_wolf']],[0.1,['sm_elite']]],
    });

    /* ---------- 外域声望阵营(军需官 / 徽章 / 坐骑) ---------- */
    Object.assign(D.REPS, {
      cenarion_exp: { id: 'cenarion_exp', name: '塞纳里奥远征队', icon: '🌿', color: '#7fd4a0', faction: 'neutral',
        desc: '深入外域研究生态的德鲁伊远征军，驻守赞加沼泽。',
        zones: ['zangarmarsh', 'hellfire', 'nagrand'], dungeons: ['slave_pens', 'underbog', 'steamvault', 'serpentshrine_cavern'],
        sources: '击败赞加沼泽/地狱火半岛怪物、通关奴隶围栏/幽暗沼泽/蒸汽地窟/毒蛇神殿、完成外域任务' },
      shattar: { id: 'shattar', name: '沙塔尔', icon: '✨', color: '#e8d7a0', faction: 'neutral',
        desc: '纳鲁在沙塔斯城建立的联合阵线，对抗燃烧军团与伊利丹。',
        zones: ['terokkar', 'shattrath', 'caverns_of_time', 'karazhan'], dungeons: ['mana_tombs', 'auchenai_crypts', 'sethekk_halls', 'shadow_labyrinth', 'old_hillsbrad', 'black_morass', 'arcatraz', 'battle_for_hyjal', 'hellfire_ramparts', 'blood_furnace', 'shattered_halls', 'karazhan'],
        sources: '击败泰罗卡森林怪物、通关法力陵墓/奥金尼地穴/暗影迷宫/时光之穴副本、完成外域任务' },
      scryers: { id: 'scryers', name: '占星者', icon: '🔮', color: '#c3b0ff', faction: 'neutral',
        desc: '对抗燃烧军团的血精灵占星者，驻守虚空风暴与影月谷。',
        zones: ['netherstorm', 'bladesedge', 'shadowmoon', 'quel_danas'], dungeons: ['mechanar', 'botanica', 'tempest_keep', 'black_temple', 'sunwell_plateau', 'magisters_terrace', 'gruuls_lair', 'magtheridons_lair'],
        sources: '击败虚空风暴/刀锋山/影月谷怪物、通关能源舰/生态船/风暴要塞/黑暗神殿/太阳井高地、完成外域任务' },
    });

    /* ---------- 外域军需官装备(尊敬蓝装 / 崇敬紫装 / 崇拜坐骑) ---------- */
    const TBC_REP_GEAR = [
      ['r_tb_cexp_gloves', '远征队护手', '🧤', 'gloves', 'blue', 63, {int: 11,spi: 9,stam: 3,crit: 0.02,armor: 131}, 62000, 'cenarion_exp', 'honored'],
      ['r_tb_cexp_ring', '远征队指环', '💍', 'ring', 'purple', 68, {agi: 20,stam: 6,crit: 0.05}, 118000, 'cenarion_exp', 'revered'],
      ['r_tb_cexp_mount', '远征队角鹰兽', '🦅', 'mount', 'epic', 62, {}, 240000, 'cenarion_exp', 'exalted'],
      ['r_tb_shattar_neck', '沙塔尔坠饰', '📿', 'neck', 'blue', 64, {int: 10,spi: 9,stam: 3,crit: 0.02}, 66000, 'shattar', 'honored'],
      ['r_tb_shattar_cloak', '沙塔尔圣光披风', '🧣', 'cloak', 'purple', 69, {str: 13,stam: 4,crit: 0.03,armor: 69}, 124000, 'shattar', 'revered'],
      ['r_tb_shattar_mount', '沙塔尔虚空鳐', '🐟', 'mount', 'epic', 65, {}, 250000, 'shattar', 'exalted'],
      ['r_tb_scryers_legs', '占星者护腿', '👖', 'legs', 'blue', 63, {str: 14,stam: 5,crit: 0.03,armor: 168}, 64000, 'scryers', 'honored'],
      ['r_tb_scryers_trinket', '占星者星图', '🔮', 'trinket', 'purple', 69, {int: 16,spi: 15,stam: 5,crit: 0.04}, 120000, 'scryers', 'revered'],
      ['r_tb_scryers_mount', '占星者虚空龙', '🐉', 'mount', 'epic', 68, {}, 260000, 'scryers', 'exalted'],
    ];
    for (const [rid, rname, ricon, rslot, rqual, rlv, rstats, rbuy, rrep, rtier] of TBC_REP_GEAR) {
      D.ITEMS[rid] = RP(rid, rname, ricon, rslot, rqual, rlv, rstats, rbuy, rrep, rtier);
    }

    /* ---------- 外域声望徽章(精英与首领掉落,可上交加速冲声望) ---------- */
    Object.assign(D.ITEMS, {
      r_badge_cexp: IT('r_badge_cexp', '塞纳里奥远征队徽章', '🌿', 'material', 'green', 1, {}, { sell: 120 }, { badge: 'cenarion_exp' }),
      r_badge_shattar: IT('r_badge_shattar', '沙塔尔徽章', '✨', 'material', 'green', 1, {}, { sell: 120 }, { badge: 'shattar' }),
      r_badge_scryers: IT('r_badge_scryers', '占星者徽章', '🔮', 'material', 'green', 1, {}, { sell: 120 }, { badge: 'scryers' }),
    });

    /* ---------- 外域打造配方(魔铁锭 / 虚空水晶的消耗口) ---------- */
    Object.assign(D.CRAFTS, {
      craft_nether_edge: { id: 'craft_nether_edge', name: '虚空之刃', icon: '🗡️', item: 'w_nether_edge', mats: { m_feliron: 8, m_nether: 4 }, gold: 32000 },
      craft_nether_staff: { id: 'craft_nether_staff', name: '虚空法杖', icon: '🪄', item: 'w_nether_staff', mats: { m_nether: 6, m_crystal: 2 }, gold: 34000 },
      craft_void_plate: { id: 'craft_void_plate', name: '虚空板甲', icon: '🛡️', item: 'a_void_plate', mats: { m_feliron: 10, m_nether: 3 }, gold: 30000 },
      craft_sun_robe: { id: 'craft_sun_robe', name: '太阳井法袍', icon: '🥻', item: 'a_sun_robe', mats: { m_feliron: 12, m_nether: 6, m_crystal: 3 }, gold: 48000 },
    });

    /* ---------- 外域世界首领与虚空航线 ---------- */
    D.WORLD_BOSSES.doomwalker = { mid: 'doomwalker', zone: 'shadowmoon', minLevel: 70 };
    D.AIRSHIPS.shattrath = { icon: '🚁', name: '虚空飞艇', to: ['stormwind', 'orgrimmar'] };
    D.AIRSHIPS.stormwind.to.push('shattrath');
    D.AIRSHIPS.orgrimmar.to.push('shattrath');

    /* ---------- 外域副本成就 + 满级成就 ---------- */
    const TBC_ACH = {
      hellfire_ramparts: ['城墙之上', '🏰'],
      blood_furnace: ['邪能熔炉', '🔥'],
      shattered_halls: ['刃拳的末日', '⚔️'],
      slave_pens: ['挣脱枷锁', '🌿'],
      underbog: ['沼泽之后', '🍄'],
      steamvault: ['蒸汽核心', '⚙️'],
      mana_tombs: ['墓穴盗影', '🔮'],
      auchenai_crypts: ['亡者安息', '💀'],
      sethekk_halls: ['利爪之王', '🕊️'],
      shadow_labyrinth: ['穆鲁之音', '🌑'],
      old_hillsbrad: ['时光囚笼', '🕰️'],
      black_morass: ['时间线守卫', '🐊'],
      mechanar: ['能源舰陷落', '🤖'],
      botanica: ['温室浩劫', '🌺'],
      arcatraz: ['牢狱崩坏', '🔒'],
      magisters_terrace: ['王子的陨落', '🏛️'],
      karazhan: ['塔中幻梦', '🏰'],
      gruuls_lair: ['屠龙者', '🐗'],
      magtheridons_lair: ['深渊囚徒', '🐉'],
      serpentshrine_cavern: ['盘牙之渊', '🐍'],
      tempest_keep: ['风暴降伏', '🛸'],
      battle_for_hyjal: ['海加尔圣战', '🌳'],
      black_temple: ['背叛者的终末', '👁️'],
      sunwell_plateau: ['太阳井的余烬', '☀️'],
    };
    const TBC_ACH_SPECIAL = { sunwell_plateau: ['tr_skull_guldan', 'm_nether'], black_temple: ['tr_sun_seal', 'm_nether'], tempest_keep: ['tr_sun_seal', 'm_nether'] };
    for (const tbcId in TBC_ACH) {
      const dg = D.DUNGEONS[tbcId];
      if (!dg) continue;
      const lv = dg.minLevel || 1;
      D.ACHIEVEMENTS['ach_dg_' + tbcId] = {
        id: 'ach_dg_' + tbcId, name: TBC_ACH[tbcId][0], icon: TBC_ACH[tbcId][1],
        cat: 'dungeon', type: 'dungeon', target: tbcId,
        desc: '通关' + dg.name + (dg.raid ? '（团本）' : '（5人本）'),
        count: 1, reward: { gold: 2500 + lv * 150, exp: 2500 + lv * 150, items: TBC_ACH_SPECIAL[tbcId] || ['m_crystal'] },
      };
    }
    D.ACHIEVEMENTS.ach_level_70 = { id: 'ach_level_70', name: '外域远征军', icon: '🌌', cat: 'level', desc: '角色达到 70 级', count: 70, reward: { gold: 80000, exp: 0, items: ['tr_skull_guldan', 'm_nether'] } };

  })();
  /* END TBC */


  /* ============ 声望徽章(精英掉落 · 上交加速冲声望) ============ */
  // 每阵营一枚徽章;区域精英→区域阵营 / 副本精英与Boss→副本阵营 / 世界首领→所在区域阵营
  D.BADGES = {
    sw:      { id: 'sw',      item: 'r_badge_sw', name: '暴风城徽章', icon: '🦁', rep: 'sw' },
    og:      { id: 'og',      item: 'r_badge_og', name: '奥格瑞玛徽章', icon: '⚔️', rep: 'og' },
    argent:  { id: 'argent',  item: 'r_badge_ag', name: '银色黎明徽章', icon: '🌕', rep: 'argent' },
    cenarion: { id: 'cenarion', item: 'r_badge_ce', name: '塞纳里奥徽章', icon: '🌿', rep: 'cenarion' },
    thorium: { id: 'thorium', item: 'r_badge_th', name: '瑟银徽章', icon: '🔥', rep: 'thorium' },
    /* 外域阵营徽章(TBC) */
    cenarion_exp: { id: 'cenarion_exp', item: 'r_badge_cexp', name: '塞纳里奥远征队徽章', icon: '🌿', rep: 'cenarion_exp' },
    shattar: { id: 'shattar', item: 'r_badge_shattar', name: '沙塔尔徽章', icon: '✨', rep: 'shattar' },
    scryers: { id: 'scryers', item: 'r_badge_scryers', name: '占星者徽章', icon: '🔮', rep: 'scryers' },
  };
  (function () {
    const repOfZone = (zid) => {
      for (const r of Object.values(D.REPS || {})) {
        if ((r.zones || []).includes(zid) || (r.dungeons || []).includes(zid)) return r.id;
      }
      return null;
    };
    const addBadge = (mid, repId, chance) => {
      if (!repId || !D.BADGES[repId]) return;
      const list = D.DROPS[mid] || (D.DROPS[mid] = []);
      if (!list.some(([i]) => i === D.BADGES[repId].item)) list.push([D.BADGES[repId].item, chance]);
    };
    // 区域精英(野外刷新的稀有精英)
    for (const z of Object.values(D.ZONES || {})) {
      if (z.dungeon) continue;
      const rid = repOfZone(z.id);
      for (const mid of z.monsters || []) {
        const m = D.MONSTERS[mid];
        if (m && m.elite) addBadge(mid, rid, 0.35);
      }
    }
    // 副本精英 / 最终首领
    for (const dg of Object.values(D.DUNGEONS || {})) {
      const rid = repOfZone(dg.id);
      for (const w of dg.waves || []) for (const mid of w.enemies || []) {
        const m = D.MONSTERS[mid];
        if (m && (m.elite || m.boss)) addBadge(mid, rid, m.boss ? 0.8 : 0.4);
      }
    }
    // 世界首领
    for (const wb of Object.values(D.WORLD_BOSSES || {})) {
      const m = D.MONSTERS[wb.mid];
      if (m && m.boss) addBadge(wb.mid, repOfZone(wb.zone), 0.9);
    }
  })();
})();

  /* ============ 副本官方首领(完善所有副本:中途首领/数值/掉落) ============ */
  // 每座副本按官方BOSS名单补充中途首领:自动注册怪物/掉落,并插入到最终首领波次之前
  (function () {
    const D = window.WOW.Data;
    // [mid, 中文名, 图标, 头衔, hp倍率, atk倍率, armor倍率, xp倍率, gold倍率, 类型, 技能]
    const B = {
      'ragefire_chasm': [
        ['taragaman', '塔拉加曼', '🔥', '怒焰裂谷 · 饥饿者', 0.72, 0.96, 0.94, 0.6, 0.6, 'humanoid', ['m_charge', 'm_rend', 'm_war_cry']],
        ['bazzalan', '巴扎兰', '🕷️', '怒焰裂谷 · 邪能卫士', 0.8, 0.98, 0.96, 0.68, 0.68, 'humanoid', ['m_poison', 'm_bite', 'm_enrage']],
      ],
      'wailing_caverns': [
        ['anacondra', '安娜科德拉', '🐍', '哀嚎洞穴 · 毒蛇女祭司', 0.62, 0.94, 0.92, 0.55, 0.55, 'humanoid', ['m_poison', 'm_shadow', 'm_bite']],
        ['pythas', '皮萨斯', '🦎', '哀嚎洞穴 · 堕落之蛇', 0.68, 0.95, 0.93, 0.6, 0.6, 'beast', ['m_bite', 'm_poison', 'm_enrage']],
        ['serpentis', '瑟芬迪斯', '🐍', '哀嚎洞穴 · 剧毒蛇王', 0.74, 0.97, 0.94, 0.66, 0.66, 'beast', ['m_bite', 'm_poison', 'm_war_cry']],
        ['skum', '斯卡姆', '🐢', '哀嚎洞穴 · 深渊巨龟', 0.82, 0.99, 0.96, 0.72, 0.72, 'beast', ['m_bash', 'm_charge', 'm_regen']],
      ],
      'deadmines': [
        ['rhahkzor', '拉克佐尔', '🧌', '死亡矿井 · 处刑者', 0.62, 0.95, 0.9, 0.55, 0.55, 'humanoid', ['m_charge', 'm_rend', 'm_war_cry']],
        ['sneed', '斯尼德', '⚙️', '死亡矿井 · 船坞工头', 0.68, 0.95, 0.9, 0.6, 0.6, 'humanoid', ['m_charge', 'm_flurry', 'm_rend']],
        ['gilnid', '基尔尼格', '🔥', '死亡矿井 · 熔炼大师', 0.74, 0.96, 0.92, 0.66, 0.66, 'humanoid', ['m_fireball', 'm_war_cry', 'm_rend']],
        ['greenskin', '格林斯金船长', '🏴‍☠️', '死亡矿井 · 海盗船长', 0.8, 0.98, 0.94, 0.72, 0.72, 'humanoid', ['m_charge', 'm_flurry', 'm_summon']],
      ],
      'shadowfang_keep': [
        ['rethilgore', '雷希戈尔', '🦇', '影牙城堡 · 吸血恶魔', 0.62, 0.95, 0.92, 0.55, 0.55, 'undead', ['m_bite', 'm_rend', 'm_shadow']],
        ['razorclaw', '利爪', '🐺', '影牙城堡 · 屠夫之狼', 0.68, 0.96, 0.93, 0.6, 0.6, 'beast', ['m_bite', 'm_rend', 'm_enrage']],
        ['silverlaine', '席瓦莱恩男爵', '🧛', '影牙城堡 · 幽魂贵族', 0.74, 0.97, 0.94, 0.66, 0.66, 'undead', ['m_shadow', 'm_death_coil', 'm_rend']],
        ['springvale', '斯普林瓦尔', '⚔️', '影牙城堡 · 血色指挥官', 0.8, 0.98, 0.95, 0.72, 0.72, 'humanoid', ['m_charge', 'm_war_cry', 'm_rend']],
      ],
      'blackfathom_deeps': [
        ['ghamoora', '加摩拉', '🦀', '黑暗深渊 · 深海巨兽', 0.62, 0.95, 0.92, 0.55, 0.55, 'beast', ['m_bash', 'm_charge', 'm_enrage']],
        ['sarevess', '萨利维丝', '🧜', '黑暗深渊 · 海妖女祭司', 0.68, 0.96, 0.93, 0.6, 0.6, 'humanoid', ['m_shadow', 'm_poison', 'm_breath']],
        ['kelris', '凯尔里斯', '🌑', '黑暗深渊 · 暮光领主', 0.78, 0.98, 0.95, 0.68, 0.68, 'humanoid', ['m_shadow', 'm_soul_drain', 'm_war_cry']],
      ],
      'stockade': [
        ['kam', '卡姆·深怒', '⛓️', '暴风城监狱 · 铁链囚徒', 0.68, 0.96, 0.93, 0.6, 0.6, 'humanoid', ['m_charge', 'm_rend', 'm_war_cry']],
        ['bruegal', '布鲁格尔', '💪', '暴风城监狱 · 铁拳囚犯', 0.76, 0.98, 0.95, 0.66, 0.66, 'humanoid', ['m_bash', 'm_charge', 'm_enrage']],
      ],
      'gnomeregan': [
        ['grubbis', '格鲁比斯', '🧪', '诺莫瑞根 · 突变侏儒', 0.62, 0.95, 0.92, 0.55, 0.55, 'humanoid', ['m_poison', 'm_radiation', 'm_bite']],
        ['electro6k', '电刑器6000', '⚡', '诺莫瑞根 · 电刑机械', 0.7, 0.97, 0.94, 0.62, 0.62, 'mechanical', ['m_charge', 'm_war_cry', 'm_enrage']],
        ['pummeler', '群体打击者9-60', '🤖', '诺莫瑞根 · 攻城机械', 0.78, 0.98, 0.95, 0.68, 0.68, 'mechanical', ['m_bash', 'm_charge', 'm_enrage']],
      ],
      'razorfen_kraul': [
        ['agathelos', '阿加赛罗斯', '🐗', '剃刀沼泽 · 狂暴野猪', 0.68, 0.96, 0.93, 0.6, 0.6, 'beast', ['m_bash', 'm_charge', 'm_enrage']],
        ['deathsworn', '亡誓者队长', '💀', '剃刀沼泽 · 骷髅队长', 0.76, 0.98, 0.95, 0.66, 0.66, 'undead', ['m_charge', 'm_rend', 'm_war_cry']],
      ],
      'scarlet_monastery': [
        ['herod', '赫洛德', '⚔️', '血色修道院 · 十字军统帅', 0.66, 0.95, 0.93, 0.58, 0.58, 'humanoid', ['m_charge', 'm_rend', 'm_war_cry']],
        ['loksey', '猎犬训练师洛克希', '🐕', '血色修道院 · 训犬师', 0.72, 0.97, 0.94, 0.64, 0.64, 'humanoid', ['m_bite', 'm_war_cry', 'm_rend']],
        ['doan', '杜安', '🔮', '血色修道院 · 血色法师', 0.78, 0.98, 0.95, 0.7, 0.7, 'humanoid', ['m_fireball', 'm_shadow', 'm_war_cry']],
      ],
      'uldaman': [
        ['baelog', '巴尔洛戈', '⚔️', '奥达曼 · 探险者勇士', 0.6, 0.94, 0.92, 0.52, 0.52, 'humanoid', ['m_charge', 'm_rend', 'm_war_cry']],
        ['olaf', '奥拉夫', '🛡️', '奥达曼 · 探险者守卫', 0.66, 0.95, 0.93, 0.58, 0.58, 'humanoid', ['m_bash', 'm_charge', 'm_rend']],
        ['ironaya', '艾隆纳亚', '🤖', '奥达曼 · 泰坦造物', 0.78, 0.98, 0.95, 0.68, 0.68, 'mechanical', ['m_charge', 'm_enrage', 'm_war_cry']],
      ],
      'razorfen_downs': [
        ['tutenkash', '图特卡什', '🐍', '剃刀高地 · 腐烂巨蛇', 0.66, 0.95, 0.93, 0.58, 0.58, 'undead', ['m_poison', 'm_bite', 'm_shadow']],
        ['mordresh', '摩德雷什·火眼', '🔥', '剃刀高地 · 烈焰术士', 0.72, 0.97, 0.94, 0.64, 0.64, 'undead', ['m_fireball', 'm_shadow', 'm_war_cry']],
        ['glutton', '贪食者', '👹', '剃刀高地 · 墓穴吞噬者', 0.78, 0.98, 0.95, 0.7, 0.7, 'undead', ['m_bite', 'm_rend', 'm_enrage']],
      ],
      'maraudon': [
        ['vyletongue', '维利塔恩', '👅', '玛拉顿 · 腐化领主', 0.66, 0.95, 0.93, 0.58, 0.58, 'humanoid', ['m_poison', 'm_shadow', 'm_soul_drain']],
        ['celebras', '塞雷布拉斯', '🌳', '玛拉顿 · 远古树人', 0.72, 0.97, 0.94, 0.64, 0.64, 'elemental', ['m_charge', 'm_enrage', 'm_war_cry']],
        ['rotgrip', '洛特格里普', '🦈', '玛拉顿 · 沼泽巨鲨', 0.8, 0.99, 0.96, 0.72, 0.72, 'beast', ['m_bite', 'm_rend', 'm_enrage']],
      ],
      'zulfarrak': [
        ['gahzrilla', '加兹瑞拉', '🦎', '祖尔法拉克 · 水图腾之兽', 0.66, 0.95, 0.93, 0.58, 0.58, 'beast', ['m_bite', 'm_breath', 'm_enrage']],
        ['antusul', '安图苏尔', '🪲', '祖尔法拉克 · 圣甲虫之王', 0.72, 0.97, 0.94, 0.64, 0.64, 'beast', ['m_bite', 'm_poison', 'm_enrage']],
        ['zumrah', '祖姆拉', '🧙', '祖尔法拉克 · 巫毒祭司', 0.78, 0.98, 0.95, 0.7, 0.7, 'humanoid', ['m_shadow', 'm_poison', 'm_war_cry']],
      ],
      'blackrock_depths': [
        ['roccor', '罗克科尔', '🔥', '黑石深渊 · 熔岩看守', 0.66, 0.95, 0.93, 0.58, 0.58, 'elemental', ['m_lava_burst', 'm_charge', 'm_enrage']],
        ['grebmar', '格莱布玛', '🛡️', '黑石深渊 · 猎犬训练官', 0.72, 0.97, 0.94, 0.64, 0.64, 'humanoid', ['m_bite', 'm_war_cry', 'm_rend']],
        ['flamelash', '烈焰使者', '🔥', '黑石深渊 · 火焰大法师', 0.8, 0.98, 0.95, 0.72, 0.72, 'humanoid', ['m_fireball', 'm_lava_burst', 'm_war_cry']],
      ],
      'sunken_temple': [
        ['jammalan', '预言者贾玛兰', '🧙', '沉没的神庙 · 巨魔祭司', 0.66, 0.95, 0.93, 0.58, 0.58, 'humanoid', ['m_shadow', 'm_soul_drain', 'm_war_cry']],
        ['morphaz', '摩弗拉兹', '🐲', '沉没的神庙 · 梦境巨龙', 0.74, 0.97, 0.94, 0.66, 0.66, 'dragon', ['m_breath', 'm_shadow', 'm_enrage']],
        ['eranikus', '伊兰尼库斯', '🐉', '沉没的神庙 · 绿龙守护者', 0.82, 0.99, 0.96, 0.74, 0.74, 'dragon', ['m_breath', 'm_charge', 'm_enrage']],
      ],
      'blackrock_spire': [
        ['omokk', '欧莫克大王', '🧌', '黑石塔 · 蛮兵酋长', 0.6, 0.94, 0.92, 0.52, 0.52, 'humanoid', ['m_charge', 'm_war_cry', 'm_rend']],
        ['voone', '战争统帅沃恩', '⚔️', '黑石塔 · 兽人督军', 0.66, 0.95, 0.93, 0.58, 0.58, 'humanoid', ['m_charge', 'm_rend', 'm_war_cry']],
        ['urok', '乌洛克·末日嚎', '👹', '黑石塔 · 末日预言者', 0.74, 0.97, 0.94, 0.66, 0.66, 'humanoid', ['m_war_cry', 'm_enrage', 'm_charge']],
        ['gyth', '盖斯', '🐉', '黑石塔 · 龙兽之王', 0.82, 0.99, 0.96, 0.74, 0.74, 'dragon', ['m_breath', 'm_charge', 'm_enrage']],
      ],
      'scholomance': [
        ['jandice', '詹迪斯·巴罗夫', '🎭', '通灵学院 · 幻术师', 0.62, 0.95, 0.92, 0.55, 0.55, 'undead', ['m_shadow', 'm_fireball', 'm_war_cry']],
        ['rattlegore', '亡灵导师', '🦴', '通灵学院 · 骷髅巨人', 0.68, 0.96, 0.93, 0.6, 0.6, 'undead', ['m_bash', 'm_charge', 'm_enrage']],
        ['krastinov', '克拉斯丁博士', '🔪', '通灵学院 · 疯狂外科医生', 0.72, 0.97, 0.94, 0.64, 0.64, 'undead', ['m_rend', 'm_poison', 'm_charge']],
        ['malicia', '玛莉西亚女士', '🧙', '通灵学院 · 亡灵导师', 0.76, 0.98, 0.95, 0.68, 0.68, 'undead', ['m_shadow', 'm_war_cry', 'm_soul_drain']],
        ['frostwhisper', '弗罗斯特维斯', '⛄', '通灵学院 · 冰霜大法师', 0.82, 0.99, 0.96, 0.74, 0.74, 'undead', ['m_frost', 'm_shadow', 'm_war_cry']],
      ],
      'dire_maul': [
        ['zevrim', '泽维姆·索恩胡夫', '🐐', '厄运之槌 · 邪能兽人', 0.62, 0.95, 0.92, 0.55, 0.55, 'humanoid', ['m_charge', 'm_rend', 'm_war_cry']],
        ['hydrospawn', '水元素之王', '💧', '厄运之槌 · 元素领主', 0.7, 0.97, 0.94, 0.62, 0.62, 'elemental', ['m_breath', 'm_charge', 'm_enrage']],
        ['lethtendris', '蕾瑟塔蒂丝', '🕷️', '厄运之槌 · 奥术法师', 0.76, 0.98, 0.95, 0.68, 0.68, 'humanoid', ['m_fireball', 'm_shadow', 'm_war_cry']],
        ['alzzin', '阿尔津', '🌿', '厄运之槌 · 恶魔术士', 0.82, 0.99, 0.96, 0.74, 0.74, 'humanoid', ['m_shadow', 'm_soul_drain', 'm_enrage']],
      ],
      'stratholme': [
        ['skul', '斯库尔', '💀', '斯坦索姆 · 食尸鬼将军', 0.6, 0.94, 0.92, 0.52, 0.52, 'undead', ['m_bite', 'm_rend', 'm_enrage']],
        ['balnazzar', '巴纳扎尔', '🐍', '斯坦索姆 · 恐惧魔王', 0.66, 0.95, 0.93, 0.58, 0.58, 'demon', ['m_shadow', 'm_death_coil', 'm_soul_drain']],
        ['anastari', '安娜丝塔丽', '💃', '斯坦索姆 · 女妖男爵', 0.72, 0.97, 0.94, 0.64, 0.64, 'undead', ['m_shadow', 'm_death_coil', 'm_war_cry']],
        ['nerubenkan', '奈鲁布恩坎', '🕷️', '斯坦索姆 · 蛛魔领主', 0.76, 0.98, 0.95, 0.68, 0.68, 'undead', ['m_bite', 'm_poison', 'm_rend']],
        ['maleki', '马勒基', '⛄', '斯坦索姆 · 苍白骑士', 0.82, 0.99, 0.96, 0.74, 0.74, 'undead', ['m_shadow', 'm_breath', 'm_charge']],
      ],
      'naxxramas': [
        ['anub', '阿努布雷坎', '🕷️', '纳克萨玛斯 · 蛛魔领主', 0.6, 0.94, 0.92, 0.52, 0.52, 'undead', ['m_bite', 'm_poison', 'm_charge']],
        ['faerlina', '黑女巫法琳娜', '🕷️', '纳克萨玛斯 · 黑女巫', 0.64, 0.95, 0.93, 0.56, 0.56, 'humanoid', ['m_shadow', 'm_poison', 'm_war_cry']],
        ['maexxna', '迈克斯纳', '🕸️', '纳克萨玛斯 · 蛛后', 0.68, 0.96, 0.93, 0.6, 0.6, 'beast', ['m_bite', 'm_poison', 'm_enrage']],
        ['noth', '药剂师诺斯', '💀', '纳克萨玛斯 · 天灾药剂师', 0.72, 0.97, 0.94, 0.64, 0.64, 'undead', ['m_poison', 'm_shadow', 'm_war_cry']],
        ['heigan', '希尔盖·拉文德雷', '🔥', '纳克萨玛斯 · 瘟疫使者', 0.76, 0.98, 0.95, 0.68, 0.68, 'undead', ['m_fireball', 'm_shadow', 'm_war_cry']],
        ['patchwerk', '帕奇维克', '💪', '纳克萨玛斯 · 憎恶战士', 0.82, 0.99, 0.96, 0.74, 0.74, 'undead', ['m_bash', 'm_charge', 'm_enrage']],
        ['sapphiron', '萨菲隆', '🐉', '纳克萨玛斯 · 冰霜巨龙', 0.88, 1.0, 0.97, 0.8, 0.8, 'dragon', ['m_breath', 'm_charge', 'm_enrage']],
      ],
      'molten_core': [
        ['lucifron', '鲁西弗隆', '👿', '熔火之心 · 咒术师', 0.6, 0.92, 0.92, 0.5, 0.5, 'demon', ['m_shadow', 'm_soul_drain', 'm_war_cry']],
        ['magmadar', '玛格曼达', '🐕', '熔火之心 · 熔核猎犬', 0.64, 0.93, 0.93, 0.54, 0.54, 'beast', ['m_bite', 'm_fireball', 'm_enrage']],
        ['gehennas', '基赫纳斯', '🔥', '熔火之心 · 火焰术士', 0.68, 0.94, 0.93, 0.58, 0.58, 'demon', ['m_fireball', 'm_lava_burst', 'm_war_cry']],
        ['garr', '加尔', '🪨', '熔火之心 · 熔核巨兽', 0.72, 0.95, 0.94, 0.62, 0.62, 'elemental', ['m_charge', 'm_enrage', 'm_war_cry']],
        ['geddon', '迦顿男爵', '🔥', '熔火之心 · 火焰魔王', 0.76, 0.96, 0.94, 0.66, 0.66, 'elemental', ['m_fireball', 'm_lava_burst', 'm_enrage']],
        ['shazzrah', '沙斯拉尔', '✨', '熔火之心 · 奥术魔王', 0.8, 0.97, 0.95, 0.7, 0.7, 'demon', ['m_shadow', 'm_fireball', 'm_war_cry']],
        ['sulfuron', '萨弗隆先知', '👹', '熔火之心 · 火焰先知', 0.84, 0.98, 0.95, 0.74, 0.74, 'demon', ['m_fireball', 'm_shadow', 'm_war_cry']],
        ['executus', '管理者埃克索图斯', '👑', '熔火之心 · 熔火管理者', 0.88, 0.99, 0.96, 0.78, 0.78, 'humanoid', ['m_fireball', 'm_war_cry', 'm_enrage']],
      ],
      'blackwing_lair': [
        ['razorgore', '狂野的拉佐格尔', '🦎', '黑翼之巢 · 失控龙兽', 0.6, 0.92, 0.92, 0.5, 0.5, 'dragon', ['m_breath', 'm_charge', 'm_enrage']],
        ['vaelastrasz', '瓦拉斯塔兹', '🐉', '黑翼之巢 · 红龙勇士', 0.64, 0.93, 0.93, 0.54, 0.54, 'dragon', ['m_breath', 'm_fireball', 'm_enrage']],
        ['broodlord', '勒什雷尔', '🦅', '黑翼之巢 · 龙人督军', 0.7, 0.95, 0.94, 0.6, 0.6, 'dragon', ['m_breath', 'm_charge', 'm_war_cry']],
        ['firemaw', '费尔默', '🐉', '黑翼之巢 · 烈焰巨龙', 0.76, 0.96, 0.94, 0.66, 0.66, 'dragon', ['m_breath', 'm_fireball', 'm_enrage']],
        ['chromaggus', '克洛玛古斯', '🐲', '黑翼之巢 · 多彩巨龙', 0.84, 0.98, 0.95, 0.74, 0.74, 'dragon', ['m_breath', 'm_shadow', 'm_enrage']],
      ],
      'zulgurub': [
        ['jeklik', '高阶祭司耶克里克', '🦇', '祖尔格拉布 · 蝙蝠祭司', 0.58, 0.92, 0.92, 0.48, 0.48, 'undead', ['m_shadow', 'm_poison', 'm_war_cry']],
        ['venoxis', '高阶祭司温诺希斯', '🐍', '祖尔格拉布 · 毒蛇祭司', 0.62, 0.93, 0.92, 0.52, 0.52, 'humanoid', ['m_poison', 'm_shadow', 'm_war_cry']],
        ['marli', '高阶祭司玛尔里', '🕷️', '祖尔格拉布 · 蜘蛛祭司', 0.66, 0.94, 0.93, 0.56, 0.56, 'humanoid', ['m_shadow', 'm_poison', 'm_war_cry']],
        ['mandokir', '血领主曼多基尔', '⚔️', '祖尔格拉布 · 血领主', 0.72, 0.95, 0.94, 0.62, 0.62, 'humanoid', ['m_charge', 'm_rend', 'm_war_cry']],
        ['thekal', '高阶祭司塞卡尔', '🐯', '祖尔格拉布 · 猛虎祭司', 0.76, 0.96, 0.94, 0.66, 0.66, 'humanoid', ['m_bite', 'm_charge', 'm_enrage']],
        ['jindo', '金度', '🧙', '祖尔格拉布 · 暗影猎手', 0.84, 0.98, 0.95, 0.74, 0.74, 'humanoid', ['m_shadow', 'm_soul_drain', 'm_war_cry']],
      ],
      'ruins_ahnqiraj': [
        ['kurinnaxx', '库林纳克斯', '🪲', '安其拉废墟 · 虫巢统领', 0.66, 0.94, 0.93, 0.56, 0.56, 'beast', ['m_bite', 'm_poison', 'm_enrage']],
        ['moam', '莫阿姆', '👁️', '安其拉废墟 · 法力吞噬者', 0.72, 0.96, 0.94, 0.62, 0.62, 'elemental', ['m_soul_drain', 'm_shadow', 'm_enrage']],
        ['buru', '布鲁', '🐛', '安其拉废墟 · 吞噬者', 0.76, 0.97, 0.94, 0.66, 0.66, 'beast', ['m_bite', 'm_poison', 'm_enrage']],
        ['ayamiss', '亚尔基公主', '🕷️', '安其拉废墟 · 蛛后', 0.8, 0.98, 0.95, 0.7, 0.7, 'beast', ['m_bite', 'm_poison', 'm_shadow']],
        ['ossirian', '奥兹里安', '🏜️', '安其拉废墟 · 废墟看守', 0.86, 0.99, 0.96, 0.76, 0.76, 'elemental', ['m_charge', 'm_war_cry', 'm_enrage']],
      ],
      'temple_ahnqiraj': [
        ['skeram', '预言者斯克拉姆', '🧙', '安其拉神殿 · 上古先知', 0.58, 0.92, 0.92, 0.48, 0.48, 'elemental', ['m_shadow', 'm_soul_drain', 'm_war_cry']],
        ['kri', '维克尼拉斯', '🪲', '安其拉神殿 · 虫群领主', 0.62, 0.93, 0.92, 0.52, 0.52, 'beast', ['m_bite', 'm_poison', 'm_enrage']],
        ['sartura', '沙尔图拉', '🦂', '安其拉神殿 · 狂乱战士', 0.66, 0.94, 0.93, 0.56, 0.56, 'humanoid', ['m_charge', 'm_rend', 'm_war_cry']],
        ['fankriss', '范克瑞斯', '🐍', '安其拉神殿 · 蠕虫之王', 0.7, 0.95, 0.94, 0.6, 0.6, 'beast', ['m_bite', 'm_poison', 'm_enrage']],
        ['viscidus', '维希度斯', '🫧', '安其拉神殿 · 软泥巨兽', 0.74, 0.96, 0.94, 0.64, 0.64, 'elemental', ['m_poison', 'm_shadow', 'm_enrage']],
        ['huhuran', '哈霍兰公主', '🕷️', '安其拉神殿 · 毒液女皇', 0.78, 0.97, 0.95, 0.68, 0.68, 'beast', ['m_bite', 'm_poison', 'm_enrage']],
        ['ouro', '奥罗', '🪱', '安其拉神殿 · 沙虫之王', 0.84, 0.98, 0.95, 0.74, 0.74, 'elemental', ['m_bite', 'm_charge', 'm_enrage']],
      ],
    };
    const POOL = {
      'ragefire_chasm': ['w_rfc_ritual_dagger', 'a_boots', 'c_heal', 'm_dust'],
      'wailing_caverns': ['a_boots', 'a_cloak', 'tr_brass_charm', 'c_heal', 'm_dust'],
      'deadmines': ['w_short_sword', 'a_gloves', 'tr_brass_charm', 'c_vital', 'm_dust'],
      'shadowfang_keep': ['w_arugal_staff', 'a_ring', 'tr_might_signet', 'c_vital', 'm_essence'],
      'blackfathom_deeps': ['a_bfd_coral', 'a_blue', 'tr_might_signet', 'c_great_heal', 'm_essence'],
      'stockade': ['w_off_dagger', 'a_blue', 'a_ring', 'c_heal', 'm_essence'],
      'gnomeregan': ['w_gno_blast_gun', 'a_blue', 'tr_ember_heart', 'c_great_heal', 'm_essence'],
      'razorfen_kraul': ['w_rfk_razor_axe', 'a_blue', 'c_great_heal', 'm_essence'],
      'scarlet_monastery': ['a_sm_scarlet_robe', 'a_blue', 'tr_imperial_seal', 'c_great_heal', 'm_essence'],
      'uldaman': ['a_uld_plate', 'w_crusader_sword', 'tr_imperial_seal', 'c_super_heal', 'm_essence'],
      'razorfen_downs': ['w_rfd_cold_blade', 'a_blue', 'tr_imperial_seal', 'c_super_heal', 'm_essence'],
      'maraudon': ['a_theradras_crown', 'a_marsh_legs', 'w_flame_staff', 'c_super_heal', 'm_crystal'],
      'zulfarrak': ['a_desert_neck', 'a_desert_ring', 'tr_imperial_seal', 'c_super_heal', 'm_essence'],
      'blackrock_depths': ['a_emperor_plate', 'a_blackrock_plate', 'tr_imperial_seal', 'c_super_heal', 'm_crystal'],
      'sunken_temple': ['w_st_temple_blade', 'a_marsh_legs', 'tr_imperial_seal', 'c_master_heal', 'm_crystal'],
      'blackrock_spire': ['w_drakkisath_axe', 'a_drakkisath_plate', 'tr_imperial_seal', 'c_master_heal', 'm_crystal'],
      'scholomance': ['w_gandling_book', 'a_necropolis_plate', 'tr_abyssal_signet', 'c_master_heal', 'm_crystal'],
      'dire_maul': ['w_immolthar_staff', 'tr_immolthar_eye', 'w_verdant_rod', 'c_master_heal', 'm_crystal'],
      'stratholme': ['w_rivendare_blade', 'a_rivendare_helm', 'tr_abyssal_signet', 'c_ultimate_heal', 'm_crystal'],
      'naxxramas': ['a_necropolis_plate', 'w_necropolis_staff', 'tr_kelthuzad_heart', 'c_ultimate_heal', 'm_crystal'],
      // 团本套装各槽位散件放在中途首领身上(每场各一件,按 bi/bi+1/bi+2 轮转掷取 0.4/0.3/0.5),
      // 最终首领只保留招牌装备与材料 —— 全套不再只靠最终首领产出。
      'molten_core': ['a_mc_crown', 'a_mc_plate', 'a_mc_gauntlets', 'a_mc_leggings', 'a_mc_boots', 'tr_abyss_eye', 'm_crystal'],
      'blackwing_lair': ['a_bwl_crown', 'a_bwl_plate', 'a_bwl_gauntlets', 'a_bwl_leggings', 'a_bwl_boots', 'w_nefarian_blade', 'm_crystal'],
      'zulgurub': ['a_zg_hood', 'a_zg_robes', 'a_zg_gloves', 'a_zg_boots', 'tr_hakkar_heart', 'm_crystal'],
      'ruins_ahnqiraj': ['a_aq_helm', 'a_aq_plate', 'a_aq_gauntlets', 'a_aq_leggings', 'a_aq_boots', 'm_crystal'],
      'temple_ahnqiraj': ['a_aq_helm', 'a_cthun_armor', 'a_aq_leggings', 'a_aq_boots', 'tr_cthun_eye', 'm_crystal'],
    };
    for (const dgid in B) {
      const d = D.DUNGEONS[dgid];
      if (!d || !d.boss) continue;
      const fb = D.MONSTERS[d.boss];
      if (!fb) continue;
      const pool = POOL[dgid] || ['m_dust'];
      d.bosses = [];
      B[dgid].forEach(function (b, bi) {
        const mid = b[0], name = b[1], icon = b[2], title = b[3];
        const hpH = b[4], atkH = b[5], armH = b[6], xpH = b[7], goldH = b[8], kind = b[9], skills = b[10];
        D.MONSTERS[mid] = {
          id: mid, name: name, icon: icon, level: Math.max(1, Math.min(window.WOW.Config.LEVEL_CAP, fb.level - 1)),
          hp: Math.round(fb.hp * hpH), atk: [Math.round(fb.atk[0] * atkH), Math.round(fb.atk[1] * atkH)],
          armor: Math.round(fb.armor * armH), xp: Math.round(fb.xp * xpH), gold: Math.round(fb.gold * goldH),
          kind: kind, skills: skills, ai: 'smart', elite: 1, boss: 1, sub: 1, title: title,
        };
        // 掉落:装备(按波次轮转) + 消耗品 + 材料
        const eq = pool[bi % pool.length];
        const csm = pool[(bi + 1) % pool.length];
        const mat = pool.length > 2 ? pool[(bi + 2) % pool.length] : 'm_dust';
        D.DROPS[mid] = [[eq, 0.4], [csm, 0.3], [mat, 0.5]];
        d.bosses.push(mid);
        d.waves.splice(d.waves.length - 1, 0, { enemies: [mid], name: '首领：' + name });
      });
      d.bosses.push(d.boss);
    }
    // 无中途首领的副本(如奥妮克希亚的巢穴)也注册首领序列
    for (const dgid in D.DUNGEONS) {
      const d = D.DUNGEONS[dgid];
      if (d.boss && !d.bosses) d.bosses = [d.boss];
    }
  })();

  /* ============ 大量地图任务与副本首领讨伐任务 ============ */
  // 每张野外地图 +1 悬赏;每座有中途首领的副本 +1 讨伐任务(数据驱动生成)
  (function () {
    const D = window.WOW.Data;
    const usedTarget = {};
    for (const q of Object.values(D.QUESTS || {})) usedTarget[q.target] = 1;
    const Q = function (id, name, zone, lv, desc, target, count, exp, gold, items) {
      D.QUESTS[id] = { id: id, name: name, zone: zone, level: lv, desc: desc, type: 'kill', target: target, count: count, exp: exp, gold: gold, rewardItems: items || [], giver: '悬赏板' };
    };
    const lvMid = function (s) { const m = String(s).match(/(\d+)/); return m ? parseInt(m[1], 10) : 10; };
    const matFor = function (lv) { return lv < 20 ? 'm_dust' : lv < 45 ? 'm_essence' : 'm_crystal'; };
    let n = 0;
    // 地图悬赏:每张野外地图 +1
    for (const zid in D.ZONES) {
      const z = D.ZONES[zid];
      if (z.dungeon || !z.monsters || !z.monsters.length) continue;
      const t = z.monsters.filter(function (m) { return D.MONSTERS[m] && !usedTarget[m] && !D.MONSTERS[m].boss; })[0];
      if (!t) continue;
      usedTarget[t] = 1;
      const mon = D.MONSTERS[t];
      const lv = lvMid(z.level);
      Q('q_map_' + zid + '_b', '清剿' + mon.name, zid, Math.max(1, lv - 2),
        '近日' + z.name + '的' + mon.name + '愈发猖獗，消灭 5 只为当地除害。', t, 5,
        Math.round(lv * 46), Math.round(lv * 13), [mon.drops && D.DROPS[t] && D.DROPS[t][0] ? D.DROPS[t][0][0] : 'm_dust', matFor(lv)]);
      n++;
      (D.ZONES[zid].quests = D.ZONES[zid].quests || []).push('q_map_' + zid + '_b');
    }
    // 副本讨伐:每座有中途首领的副本 +1(目标=首位中途首领)
    for (const dgid in D.DUNGEONS) {
      const d = D.DUNGEONS[dgid];
      const mids = (d.bosses || []).filter(function (m) { return m !== d.boss; });
      if (!mids.length) continue;
      const mid = mids[0];
      const mon = D.MONSTERS[mid];
      if (!mon) continue;
      const lv = d.minLevel || 10;
      Q('q_dg_' + dgid + '_boss', '讨伐' + mon.name, dgid, Math.min(70, lv + 1),
        '深入' + d.name + '，击败首领' + mon.name + '！', mid, 1,
        1600 + lv * 80, 1500 + lv * 60, ['m_essence', matFor(lv)]);
      n++;
      (D.ZONES[dgid].quests = D.ZONES[dgid].quests || []).push('q_dg_' + dgid + '_boss');
    }
    D._GEN_QUESTS = n;
    /* ===== 任务经验再平衡:削减经验,折算金币与锻造材料(让野外刷怪重新有意义) ===== */
    (function () {
      const CUT = 0.68;          // 任务经验削减至 68%:总量由约 136% 降至约 92% 总需求
      const EXP_TO_GOLD = 0.28;  // 每削减 1 点经验,折算 0.28 金币补偿
      for (const q of Object.values(D.QUESTS)) {
        const cut = Math.floor(q.exp * (1 - CUT));
        q.exp = Math.max(1, Math.floor(q.exp * CUT));
        // 等级段修正:41-50 与 61-69 任务稀疏,提高单任务经验;60 级任务扎堆,压低防经验泡沫
        let segMult = 1;
        if (q.level >= 41 && q.level <= 50) segMult = 1.55;
        else if (q.level === 60) segMult = 0.45;
        else if (q.level >= 61 && q.level <= 69) segMult = 1.3;
        if (segMult !== 1) q.exp = Math.max(1, Math.round(q.exp * segMult));
        q.gold += Math.max(5, Math.floor(cut * EXP_TO_GOLD));
        // 材料补偿按等级补齐(Lv40+ 双水晶;已含材料的按缺额补足)
        if (q.level >= 40) {
          while (q.rewardItems.filter((i) => i === 'm_crystal').length < 2) q.rewardItems.push('m_crystal');
        } else if (q.level >= 25) {
          if (!q.rewardItems.includes('m_crystal')) q.rewardItems.push('m_crystal');
        } else if (q.level >= 15) {
          if (!q.rewardItems.includes('m_essence')) q.rewardItems.push('m_essence');
        }
      }
    })();
  })();

  /* ============ 城市委托:给无任务区域补内容 ============ */
  (function () {
    const D = window.WOW.Data;
    const defs = [
      { id: 'q_city_sw', name: '暴风城委托：西部荒野的威胁', zone: 'stormwind', lv: 10, target: 'westfall_gnoll', count: 8, exp: 620, gold: 900, items: ['m_dust', 'c_heal'] },
      { id: 'q_city_org', name: '奥格瑞玛委托：杜隆塔尔的蝎患', zone: 'orgrimmar', lv: 8, target: 'durotar_scorpion', count: 8, exp: 420, gold: 700, items: ['m_dust', 'c_bread'] },
      { id: 'q_city_shattrath', name: '沙塔斯委托：地狱火半岛的清剿', zone: 'shattrath', lv: 62, target: 'hell_boar', count: 10, exp: 28000, gold: 26000, items: ['m_crystal', 'c_out_heal'] },
      { id: 'q_city_time', name: '时光之穴委托：时光猎手', zone: 'caverns_of_time', lv: 64, target: 'epoch_hunter', count: 1, exp: 12000, gold: 16000, items: ['m_nether', 'm_crystal'],
        desc: '青铜龙军团的委托：旧希尔斯布莱德的时光线遭到扰动，进入传送门终结时光猎手埃波克，让历史重回正轨。', giver: '青铜龙使者' },
      { id: 'q_city_queldanas', name: '奎尔丹纳斯委托：太阳井的终局', zone: 'quel_danas', lv: 70, target: 'kiljaeden', count: 1, exp: 16000, gold: 22000, items: ['m_nether', 'm_crystal', 'm_crystal'],
        desc: '破碎残阳的求援：基尔加丹的阴影笼罩太阳之井，深入太阳井高地，终结燃烧军团的入侵。', giver: '破碎残阳指挥官' },
    ];
    for (const d of defs) {
      if (!D.ZONES[d.zone] || !D.MONSTERS[d.target]) continue;
      D.QUESTS[d.id] = {
        id: d.id, name: d.name, zone: d.zone, level: d.lv,
        desc: d.desc || '城门口的告示板贴出了悬赏：为商队与平民清除周边的威胁。',
        type: 'kill', target: d.target, count: d.count,
        exp: d.exp, gold: d.gold, rewardItems: d.items, giver: d.giver || '城市告示板',
      };
      const z = D.ZONES[d.zone];
      z.quests = z.quests || [];
      if (!z.quests.includes(d.id)) z.quests.push(d.id);
      if (!z.shop) z.shop = [];
    }
  })();

  /* ============ 成就奖励再平衡:一次性奖励打折,避免成就成为主要成长来源 ============ */
  (function () {
    const D = window.WOW.Data;
    for (const a of Object.values(D.ACHIEVEMENTS || {})) {
      if (!a.reward) continue;
      if (a.reward.gold) a.reward.gold = Math.round(a.reward.gold * 0.6);
      if (a.reward.exp) a.reward.exp = Math.round(a.reward.exp * 0.5);
    }
  })();
