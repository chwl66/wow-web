/* 魔兽世界 · 战大陆 — 三系天赋树数据
 * 每个职业 3 系天赋树,每系 6 个天赋(3 层:第1/2层各2个被动,第3层 1被动+1主动)。
 * 天赋点:10 级起每级 1 点。第 2 层需本系 5 点,第 3 层需本系 10 点。
 * mods 字段: { t: 类型, ... } 见 character.js talentMods() 解析。
 * desc 中 {n} 会被替换为当前等级效果值(per<1 按百分比显示,per>=1 按数值显示)。 */
(function () {
  'use strict';
  const W = window.WOW;
  const D = W.Data = W.Data || {};

  const T = D.TALENTS = {};

  T.warrior = [
    {
      id: 'arms', name: '武器', icon: '⚔️', color: '#c69b6d',
      desc: '精通武器技艺，以最纯粹的力量撕裂敌人。',
      talents: [
        { id: 'w_arms_heroic', name: '强化英勇打击', icon: '⚔️', tier: 0, max: 5, desc: '英勇打击伤害提高 {n}%', mods: [{ t: 'skillDmg', skill: 'heroic_strike', per: 0.06 }] },
        { id: 'w_arms_rend', name: '撕裂伤口', icon: '🩸', tier: 0, max: 5, desc: '物理持续伤害(撕裂)提高 {n}%', mods: [{ t: 'dotType', type: 'physical', per: 0.06 }] },
        { id: 'w_arms_master', name: '武器大师', icon: '🗡️', tier: 1, max: 5, desc: '攻击强度提高 {n}%', mods: [{ t: 'apPct', per: 0.04 }] },
        { id: 'w_arms_charge', name: '强化冲锋', icon: '💨', tier: 1, max: 3, desc: '冲锋冷却缩短 {n} 回合', mods: [{ t: 'cdSkill', skill: 'charge', per: 1 }] },
        { id: 'w_arms_mortal', name: '强化致死打击', icon: '💥', tier: 2, max: 5, desc: '致死打击伤害提高 {n}%', mods: [{ t: 'skillDmg', skill: 'mortal_strike', per: 0.08 }] },
        { id: 'w_arms_recklessness', name: '鲁莽', icon: '🔥', tier: 2, max: 1, active: 'recklessness', desc: '鲁莽常驻：攻击+9%，暴击+5%' },
        { id: 'w_arms_shout', name: '破胆怒吼', icon: '😱', tier: 2, max: 1, active: 'intimidating_shout', desc: '激活破胆怒吼：恐惧所有敌人 1 回合' },
      ],
    },
    {
      id: 'fury', name: '狂暴', icon: '😡', color: '#f14f2b',
      desc: '以怒气和鲜血为代价，换取毁灭性的狂暴力量。',
      talents: [
        { id: 'w_fury_cruelty', name: '残忍', icon: '👁️', tier: 0, max: 5, desc: '暴击几率提高 {n}%', mods: [{ t: 'stat', stat: 'crit', per: 0.01 }] },
        { id: 'w_fury_whirlwind', name: '强化旋风斩', icon: '🌀', tier: 0, max: 5, desc: '旋风斩伤害提高 {n}%', mods: [{ t: 'skillDmg', skill: 'whirlwind', per: 0.06 }] },
        { id: 'w_fury_power', name: '狂怒', icon: '💢', tier: 1, max: 5, desc: '暴击伤害加成提高 {n}%', mods: [{ t: 'critMult', per: 0.05 }] },
        { id: 'w_fury_shout', name: '强化战斗怒吼', icon: '📢', tier: 1, max: 5, desc: '战斗怒吼的攻击加成提高 {n}%', mods: [{ t: 'buffPct', skill: 'battle_shout', per: 0.05 }] },
        { id: 'w_fury_cost', name: '无尽怒气', icon: '🫀', tier: 2, max: 5, desc: '技能怒气消耗降低 {n}%', mods: [{ t: 'cost', per: 0.06 }] },
        { id: 'w_fury_deathwish', name: '死亡之愿', icon: '💀', tier: 2, max: 1, active: 'death_wish', desc: '死亡之愿常驻：攻击+9%，暴击+2%' },
      ],
    },
    {
      id: 'prot', name: '防护', icon: '🛡️', color: '#b8b8b8',
      desc: '钢铁般的防御，守护盟友屹立不倒。',
      talents: [
        { id: 'w_prot_spec', name: '盾牌专精', icon: '🛡️', tier: 0, max: 5, desc: '护甲提高 {n}%', mods: [{ t: 'armorPct', per: 0.04 }] },
        { id: 'w_prot_block', name: '强化盾牌格挡', icon: '⛨', tier: 0, max: 5, desc: '盾牌格挡的护甲加成提高 {n}%', mods: [{ t: 'armorPct', per: 0.02 }] },
        { id: 'w_prot_tough', name: '坚韧', icon: '🏋️', tier: 1, max: 5, desc: '最大生命提高 {n}%', mods: [{ t: 'hpPct', per: 0.03 }] },
        { id: 'w_prot_iron', name: '铁壁', icon: '⛰️', tier: 1, max: 5, desc: '护甲提高 {n}%', mods: [{ t: 'armorPct', per: 0.03 }] },
        { id: 'w_prot_vital', name: '活力', icon: '❤️', tier: 2, max: 5, desc: '最大生命提高 {n}%，护甲提高 {n2}%', mods: [{ t: 'hpPct', per: 0.02 }, { t: 'armorPct', per: 0.02 }] },
        { id: 'w_prot_wall', name: '盾墙', icon: '🧱', tier: 2, max: 1, active: 'shield_wall', desc: '盾墙常驻：护甲+12%' },
        { id: 'w_prot_slam', name: '盾牌猛击', icon: '🛡️', tier: 2, max: 1, active: 'shield_slam', desc: '激活盾牌猛击：物理伤害+目标易伤 10%' },
      ],
    },
  ];

  T.paladin = [
    {
      id: 'holy', name: '神圣', icon: '✨', color: '#f2c94c',
      desc: '沐浴圣光，以神圣之力治愈与守护。',
      talents: [
        { id: 'p_holy_hl', name: '强化圣光术', icon: '✨', tier: 0, max: 5, desc: '圣光术治疗量提高 {n}%', mods: [{ t: 'skillHeal', skill: 'holy_light', per: 0.07 }] },
        { id: 'p_holy_pow', name: '神圣之光', icon: '🌟', tier: 0, max: 5, desc: '所有治疗量提高 {n}%', mods: [{ t: 'healMult', per: 0.03 }] },
        { id: 'p_holy_focus', name: '圣光灌注', icon: '🕊️', tier: 1, max: 5, desc: '圣光术治疗量提高 {n}%，所有治疗提高 {n2}%', mods: [{ t: 'skillHeal', skill: 'holy_light', per: 0.04 }, { t: 'healMult', per: 0.02 }] },
        { id: 'p_holy_mana', name: '启迪', icon: '💡', tier: 1, max: 5, desc: '法力恢复速度提高 {n}%', mods: [{ t: 'manaRegenPct', per: 0.06 }] },
        { id: 'p_holy_grace', name: '神恩', icon: '😇', tier: 2, max: 5, desc: '所有治疗提高 {n}%，法力恢复提高 {n2}%', mods: [{ t: 'healMult', per: 0.03 }, { t: 'manaRegenPct', per: 0.03 }] },
        { id: 'p_holy_loh', name: '圣疗术', icon: '🖐️', tier: 2, max: 1, active: 'lay_on_hands', desc: '激活圣疗术：立即恢复 100% 生命' },
        { id: 'p_holy_wrath', name: '神圣愤怒', icon: '💥', tier: 2, max: 1, active: 'holy_wrath', desc: '激活神圣愤怒：对所有敌人造成神圣伤害' },
      ],
    },
    {
      id: 'prot', name: '防护', icon: '🛡️', color: '#d4b483',
      desc: '圣光的壁垒，抵御一切邪恶的侵袭。',
      talents: [
        { id: 'p_prot_spec', name: '盾牌专精', icon: '🛡️', tier: 0, max: 5, desc: '护甲提高 {n}%', mods: [{ t: 'armorPct', per: 0.04 }] },
        { id: 'p_prot_hj', name: '强化制裁之锤', icon: '🔨', tier: 0, max: 3, desc: '制裁之锤冷却缩短 {n} 回合', mods: [{ t: 'cdSkill', skill: 'hammer_of_justice', per: 1 }] },
        { id: 'p_prot_tough', name: '坚韧', icon: '🏋️', tier: 1, max: 5, desc: '最大生命提高 {n}%', mods: [{ t: 'hpPct', per: 0.03 }] },
        { id: 'p_prot_crusader', name: '强化十字军打击', icon: '✝️', tier: 1, max: 5, desc: '十字军打击伤害提高 {n}%', mods: [{ t: 'skillDmg', skill: 'crusader_strike', per: 0.06 }] },
        { id: 'p_prot_holy', name: '神圣之盾', icon: '⛨', tier: 2, max: 5, desc: '护甲提高 {n}%，最大生命提高 {n2}%', mods: [{ t: 'armorPct', per: 0.02 }, { t: 'hpPct', per: 0.02 }] },
        { id: 'p_prot_shield', name: '神圣防护', icon: '🌟', tier: 2, max: 1, active: 'holy_shield', desc: '神圣防护常驻：战斗开始自动获得护盾，护甲+5%' },
      ],
    },
    {
      id: 'ret', name: '惩戒', icon: '⚖️', color: '#f48cba',
      desc: '以圣光之锤惩戒不义，审判一切敌人。',
      talents: [
        { id: 'p_ret_str', name: '力量', icon: '💪', tier: 0, max: 5, desc: '攻击强度提高 {n}%', mods: [{ t: 'apPct', per: 0.04 }] },
        { id: 'p_ret_judge', name: '强化审判', icon: '⚖️', tier: 0, max: 5, desc: '审判伤害提高 {n}%', mods: [{ t: 'skillDmg', skill: 'judgement', per: 0.07 }] },
        { id: 'p_ret_holy', name: '神圣狂热', icon: '🔥', tier: 1, max: 5, desc: '神圣系伤害提高 {n}%', mods: [{ t: 'dmgType', type: 'holy', per: 0.05 }] },
        { id: 'p_ret_seal', name: '强化正义圣印', icon: '🔥', tier: 1, max: 5, desc: '神圣系伤害提高 {n}%，十字军打击提高 {n2}%', mods: [{ t: 'dmgType', type: 'holy', per: 0.02 }, { t: 'skillDmg', skill: 'crusader_strike', per: 0.03 }] },
        { id: 'p_ret_verdict', name: '圣光裁决', icon: '⚔️', tier: 2, max: 5, desc: '审判伤害提高 {n}%，神圣系伤害提高 {n2}%', mods: [{ t: 'skillDmg', skill: 'judgement', per: 0.05 }, { t: 'dmgType', type: 'holy', per: 0.02 }] },
        { id: 'p_ret_wrath', name: '复仇之怒', icon: '😤', tier: 2, max: 1, active: 'avenging_wrath', desc: '复仇之怒常驻：攻击+8%，暴击+3%' },
        { id: 'p_ret_repent', name: '忏悔', icon: '🙏', tier: 2, max: 1, active: 'repentance', desc: '激活忏悔：令目标变形 2 回合' },
      ],
    },
  ];

  T.hunter = [
    {
      id: 'beast', name: '野兽', icon: '🐯', color: '#aad372',
      desc: '与野兽伙伴心意相通，并肩作战。',
      talents: [
        { id: 'h_beast_pet', name: '强化宠物', icon: '🐾', tier: 0, max: 5, desc: '宠物造成的伤害提高 {n}%', mods: [{ t: 'petDmg', per: 0.05 }] },
        { id: 'h_beast_call', name: '野性召唤', icon: '🐺', tier: 0, max: 5, desc: '宠物伤害提高 {n}%，暴击提高 {n2}%', mods: [{ t: 'petDmg', per: 0.03 }, { t: 'stat', stat: 'crit', per: 0.005 }] },
        { id: 'h_beast_fero', name: '凶暴', icon: '🦁', tier: 1, max: 5, desc: '宠物造成的伤害提高 {n}%', mods: [{ t: 'petDmg', per: 0.05 }] },
        { id: 'h_beast_mark', name: '强化猎人印记', icon: '🎯', tier: 1, max: 5, desc: '猎人印记的易伤效果提高 {n}%', mods: [{ t: 'debuffPct', skill: 'hunters_mark', per: 0.03 }] },
        { id: 'h_beast_heart', name: '野兽之心', icon: '❤️', tier: 2, max: 5, desc: '宠物伤害提高 {n}%，最大生命提高 {n2}%', mods: [{ t: 'petDmg', per: 0.04 }, { t: 'hpPct', per: 0.02 }] },
        { id: 'h_beast_wrath', name: '狂野怒火', icon: '😡', tier: 2, max: 1, active: 'bestial_wrath', desc: '狂野怒火常驻：自身攻击+8%，宠物+13%' },
      ],
    },
    {
      id: 'marks', name: '射击', icon: '🏹', color: '#7fbf4d',
      desc: '百步穿杨，箭无虚发。',
      talents: [
        { id: 'h_marks_arc', name: '强化奥术射击', icon: '🔹', tier: 0, max: 5, desc: '奥术射击伤害提高 {n}%', mods: [{ t: 'skillDmg', skill: 'arcane_shot', per: 0.07 }] },
        { id: 'h_marks_ranged', name: '远程专精', icon: '🎯', tier: 0, max: 5, desc: '攻击强度提高 {n}%', mods: [{ t: 'apPct', per: 0.04 }] },
        { id: 'h_marks_steady', name: '强化稳固射击', icon: '🏹', tier: 1, max: 5, desc: '稳固射击伤害提高 {n}%', mods: [{ t: 'skillDmg', skill: 'steady_shot', per: 0.07 }] },
        { id: 'h_marks_multi', name: '强化多重射击', icon: '💫', tier: 1, max: 5, desc: '多重射击伤害提高 {n}%', mods: [{ t: 'skillDmg', skill: 'multishot', per: 0.06 }] },
        { id: 'h_marks_prec', name: '精准瞄准', icon: '👁️', tier: 2, max: 5, desc: '暴击提高 {n}%，命中提高 {n2}%', mods: [{ t: 'stat', stat: 'crit', per: 0.01 }, { t: 'stat', stat: 'hit', per: 0.01 }] },
        { id: 'h_marks_rapid', name: '急速射击', icon: '⏩', tier: 2, max: 1, active: 'rapid_fire', desc: '急速射击常驻：攻击+8%' },
        { id: 'h_marks_scatter', name: '驱散射击', icon: '💫', tier: 2, max: 1, active: 'scatter_shot', desc: '激活驱散射击：伤害+眩晕目标 1 回合' },
      ],
    },
    {
      id: 'surv', name: '生存', icon: '🌲', color: '#8fc46f',
      desc: '丛林中的猎手，陷阱与毒药皆为我所用。',
      talents: [
        { id: 'h_surv_serpent', name: '强化毒蛇钉刺', icon: '🐍', tier: 0, max: 5, desc: '自然系持续伤害提高 {n}%', mods: [{ t: 'dotType', type: 'nature', per: 0.07 }] },
        { id: 'h_surv_feign', name: '强化假死', icon: '🪦', tier: 0, max: 3, desc: '假死冷却缩短 {n} 回合', mods: [{ t: 'cdSkill', skill: 'feign_death', per: 1 }] },
        { id: 'h_surv_instinct', name: '生存本能', icon: '🛟', tier: 1, max: 5, desc: '最大生命提高 {n}%，护甲提高 {n2}%', mods: [{ t: 'hpPct', per: 0.03 }, { t: 'armorPct', per: 0.02 }] },
        { id: 'h_surv_agile', name: '灵巧', icon: '🦶', tier: 1, max: 5, desc: '闪避几率提高 {n}%', mods: [{ t: 'stat', stat: 'dodge', per: 0.01 }] },
        { id: 'h_surv_stim', name: '狩猎刺激', icon: '🏹', tier: 2, max: 5, desc: '自然持续伤害提高 {n}%，多重射击提高 {n2}%', mods: [{ t: 'dotType', type: 'nature', per: 0.03 }, { t: 'skillDmg', skill: 'multishot', per: 0.03 }] },
        { id: 'h_surv_trap', name: '冰冻陷阱', icon: '❄️', tier: 2, max: 1, active: 'freezing_trap', desc: '激活冰冻陷阱：定身目标 2 回合' },
        { id: 'h_surv_wyvern', name: '翼龙钉刺', icon: '🐉', tier: 2, max: 1, active: 'wyvern_sting', desc: '激活翼龙钉刺：令目标沉睡 2 回合' },
      ],
    },
  ];

  T.rogue = [
    {
      id: 'assass', name: '刺杀', icon: '🗡️', color: '#fff569',
      desc: '直取要害，一击毙命。',
      talents: [
        { id: 'r_assass_evisc', name: '强化剔骨', icon: '💢', tier: 0, max: 5, desc: '剔骨伤害提高 {n}%', mods: [{ t: 'skillDmg', skill: 'eviscerate', per: 0.07 }] },
        { id: 'r_assass_cold', name: '冷酷', icon: '🧊', tier: 0, max: 5, desc: '暴击几率提高 {n}%', mods: [{ t: 'stat', stat: 'crit', per: 0.01 }] },
        { id: 'r_assass_backstab', name: '强化背刺', icon: '🔪', tier: 1, max: 5, desc: '背刺伤害提高 {n}%', mods: [{ t: 'skillDmg', skill: 'backstab', per: 0.07 }] },
        { id: 'r_assass_focus', name: '专注', icon: '🎯', tier: 1, max: 5, desc: '技能能量消耗降低 {n}%', mods: [{ t: 'cost', per: 0.05 }] },
        { id: 'r_assass_lethal', name: '致命刺击', icon: '💥', tier: 2, max: 5, desc: '暴击伤害加成提高 {n}%', mods: [{ t: 'critMult', per: 0.06 }] },
        { id: 'r_assass_cb', name: '冷血', icon: '❄️', tier: 2, max: 1, active: 'cold_blood', desc: '激活冷血：下一次攻击必定暴击' },
        { id: 'r_assass_kidney', name: '肾击', icon: '👊', tier: 2, max: 1, active: 'kidney_shot', desc: '激活肾击：消耗连击点眩晕目标 1 回合' },
      ],
    },
    {
      id: 'combat', name: '战斗', icon: '⚔️', color: '#d9b98a',
      desc: '以迅捷的剑术和娴熟的技巧正面迎敌。',
      talents: [
        { id: 'r_combat_sinister', name: '强化邪恶攻击', icon: '🗡️', tier: 0, max: 5, desc: '邪恶攻击伤害提高 {n}%', mods: [{ t: 'skillDmg', skill: 'sinister_strike', per: 0.07 }] },
        { id: 'r_combat_snd', name: '强化切割', icon: '✂️', tier: 0, max: 5, desc: '切割的攻击加成提高 {n}%', mods: [{ t: 'buffPct', skill: 'slice_and_dice', per: 0.05 }] },
        { id: 'r_combat_master', name: '武器大师', icon: '🗡️', tier: 1, max: 5, desc: '攻击强度提高 {n}%', mods: [{ t: 'apPct', per: 0.04 }] },
        { id: 'r_combat_prec', name: '精准', icon: '👁️', tier: 1, max: 5, desc: '命中几率提高 {n}%', mods: [{ t: 'stat', stat: 'hit', per: 0.01 }] },
        { id: 'r_combat_train', name: '武器训练', icon: '💪', tier: 2, max: 5, desc: '攻击强度提高 {n}%，命中提高 {n2}%', mods: [{ t: 'apPct', per: 0.02 }, { t: 'stat', stat: 'hit', per: 0.005 }] },
        { id: 'r_combat_ar', name: '冲动', icon: '⚡', tier: 2, max: 1, active: 'adrenaline_rush', desc: '激活冲动：能量恢复+25/回合，持续 2 回合' },
        { id: 'r_combat_sprint', name: '疾跑', icon: '💨', tier: 2, max: 1, active: 'sprint', desc: '激活疾跑：攻击+15%，闪避+15%，持续 2 回合' },
      ],
    },
    {
      id: 'sub', name: '敏锐', icon: '🌒', color: '#c8c8c8',
      desc: '藏于阴影，伺机而动。',
      talents: [
        { id: 'r_sub_stealth', name: '强化潜行', icon: '👤', tier: 0, max: 2, desc: '潜行持续时间延长 {n} 回合', mods: [{ t: 'buffDur', skill: 'stealth', per: 1 }] },
        { id: 'r_sub_decep', name: '欺诈高手', icon: '🎭', tier: 0, max: 5, desc: '闪避几率提高 {n}%', mods: [{ t: 'stat', stat: 'dodge', per: 0.01 }] },
        { id: 'r_sub_sap', name: '强化闷棍', icon: '🥁', tier: 1, max: 3, desc: '闷棍冷却缩短 {n} 回合', mods: [{ t: 'cdSkill', skill: 'sap', per: 1 }] },
        { id: 'r_sub_camo', name: '伪装', icon: '🌫️', tier: 1, max: 5, desc: '命中提高 {n}%，闪避提高 {n2}%', mods: [{ t: 'stat', stat: 'hit', per: 0.01 }, { t: 'stat', stat: 'dodge', per: 0.005 }] },
        { id: 'r_sub_deadly', name: '致命', icon: '💀', tier: 2, max: 5, desc: '暴击伤害加成提高 {n}%，背刺提高 {n2}%', mods: [{ t: 'critMult', per: 0.04 }, { t: 'skillDmg', skill: 'backstab', per: 0.03 }] },
        { id: 'r_sub_prep', name: '预备', icon: '🔄', tier: 2, max: 1, active: 'preparation', desc: '激活预备：立即重置所有技能冷却' },
      ],
    },
  ];

  T.priest = [
    {
      id: 'disc', name: '戒律', icon: '🛡️', color: '#c0c0c0',
      desc: '以坚定的信念与真言守护自身与盟友。',
      talents: [
        { id: 'pr_disc_shield', name: '强化真言术：盾', icon: '🛡️', tier: 0, max: 5, desc: '真言术：盾吸收量提高 {n}%', mods: [{ t: 'shieldPct', per: 0.07 }] },
        { id: 'pr_disc_fh', name: '强化快速治疗', icon: '💠', tier: 0, max: 5, desc: '快速治疗治疗量提高 {n}%', mods: [{ t: 'skillHeal', skill: 'flash_heal', per: 0.07 }] },
        { id: 'pr_disc_mana', name: '坚定意志', icon: '🧘', tier: 1, max: 5, desc: '法力恢复速度提高 {n}%', mods: [{ t: 'manaRegenPct', per: 0.05 }] },
        { id: 'pr_disc_renew', name: '强化恢复', icon: '💚', tier: 1, max: 5, desc: '恢复的持续治疗效果提高 {n}%', mods: [{ t: 'hotPct', skill: 'renew', per: 0.06 }] },
        { id: 'pr_disc_spirit', name: '神圣之灵', icon: '🕊️', tier: 2, max: 5, desc: '法术强度提高 {n}%，法力恢复提高 {n2}%', mods: [{ t: 'spellPowerPct', per: 0.04 }, { t: 'manaRegenPct', per: 0.03 }] },
        { id: 'pr_disc_if', name: '心灵之火', icon: '🕯️', tier: 2, max: 1, active: 'inner_fire', desc: '心灵之火常驻：攻击+12%，护甲+20%' },
        { id: 'pr_disc_scream', name: '心灵尖啸', icon: '📢', tier: 2, max: 1, active: 'psychic_scream', desc: '激活心灵尖啸：恐惧目标 1 回合' },
      ],
    },
    {
      id: 'holy', name: '神圣', icon: '✨', color: '#f2c94c',
      desc: '圣光的使者，治愈一切伤痛。',
      talents: [
        { id: 'pr_holy_heal', name: '强化治疗术', icon: '✨', tier: 0, max: 5, desc: '治疗术治疗量提高 {n}%', mods: [{ t: 'skillHeal', skill: 'heal', per: 0.07 }] },
        { id: 'pr_holy_pow', name: '神圣专精', icon: '🌟', tier: 0, max: 5, desc: '所有治疗量提高 {n}%', mods: [{ t: 'healMult', per: 0.03 }] },
        { id: 'pr_holy_prot', name: '神圣庇护', icon: '⛨', tier: 1, max: 5, desc: '所有治疗提高 {n}%，护盾吸收提高 {n2}%', mods: [{ t: 'healMult', per: 0.03 }, { t: 'shieldPct', per: 0.03 }] },
        { id: 'pr_holy_smite', name: '强化惩击', icon: '🌕', tier: 1, max: 5, desc: '惩击伤害提高 {n}%', mods: [{ t: 'skillDmg', skill: 'smite', per: 0.08 }] },
        { id: 'pr_holy_light', name: '神圣之光', icon: '💡', tier: 2, max: 5, desc: '所有治疗提高 {n}%，法力恢复提高 {n2}%', mods: [{ t: 'healMult', per: 0.03 }, { t: 'manaRegenPct', per: 0.02 }] },
        { id: 'pr_holy_nova', name: '神圣新星', icon: '💥', tier: 2, max: 1, active: 'holy_nova', desc: '激活神圣新星：对所有敌人造成神圣伤害并治疗自身' },
      ],
    },
    {
      id: 'shadow', name: '暗影', icon: '🌑', color: '#7c6bb5',
      desc: '拥抱暗影的力量，以心灵之力摧垮敌人。',
      talents: [
        { id: 'pr_shadow_swp', name: '强化暗言术：痛', icon: '🖤', tier: 0, max: 5, desc: '暗影系持续伤害提高 {n}%', mods: [{ t: 'dotType', type: 'shadow', per: 0.07 }] },
        { id: 'pr_shadow_spec', name: '暗影专精', icon: '🌑', tier: 0, max: 5, desc: '暗影系伤害提高 {n}%', mods: [{ t: 'dmgType', type: 'shadow', per: 0.05 }] },
        { id: 'pr_shadow_mb', name: '强化心灵震爆', icon: '🧠', tier: 1, max: 5, desc: '心灵震爆伤害提高 {n}%', mods: [{ t: 'skillDmg', skill: 'mind_blast', per: 0.08 }] },
        { id: 'pr_shadow_cost', name: '心智敏锐', icon: '🎯', tier: 1, max: 5, desc: '技能法力消耗降低 {n}%', mods: [{ t: 'cost', per: 0.05 }] },
        { id: 'pr_shadow_dark', name: '黑暗', icon: '🌚', tier: 2, max: 5, desc: '暗影持续伤害提高 {n}%，暗影伤害提高 {n2}%', mods: [{ t: 'dotType', type: 'shadow', per: 0.04 }, { t: 'dmgType', type: 'shadow', per: 0.03 }] },
        { id: 'pr_shadow_form', name: '暗影形态', icon: '🌑', tier: 2, max: 1, active: 'shadowform', desc: '暗影形态常驻：攻击+8%' },
        { id: 'pr_shadow_death', name: '暗言术：灭', icon: '☠️', tier: 2, max: 1, active: 'shadow_word_death', desc: '激活暗言术：灭：大量暗影伤害，击杀则反噬自身' },
      ],
    },
  ];

  T.shaman = [
    {
      id: 'elem', name: '元素', icon: '🌋', color: '#0070de',
      desc: '驾驭元素之力，以雷霆与烈焰摧毁敌人。',
      talents: [
        { id: 's_elem_lb', name: '强化闪电箭', icon: '⚡', tier: 0, max: 5, desc: '闪电箭伤害提高 {n}%', mods: [{ t: 'skillDmg', skill: 'lightning_bolt', per: 0.07 }] },
        { id: 's_elem_focus', name: '元素专注', icon: '🎯', tier: 0, max: 5, desc: '技能法力消耗降低 {n}%', mods: [{ t: 'cost', per: 0.05 }] },
        { id: 's_elem_fs', name: '强化火焰震击', icon: '🔥', tier: 1, max: 5, desc: '火焰震击伤害提高 {n}%，灼烧提高 {n2}%', mods: [{ t: 'skillDmg', skill: 'flame_shock', per: 0.04 }, { t: 'dotType', type: 'fire', per: 0.04 }] },
        { id: 's_elem_sshock', name: '强化冰霜震击', icon: '❄️', tier: 1, max: 5, desc: '冰霜震击伤害提高 {n}%', mods: [{ t: 'skillDmg', skill: 'frost_shock', per: 0.07 }] },
        { id: 's_elem_call', name: '天怒', icon: '⛈️', tier: 2, max: 5, desc: '自然系伤害提高 {n}%，火焰系伤害提高 {n2}%', mods: [{ t: 'dmgType', type: 'nature', per: 0.03 }, { t: 'dmgType', type: 'fire', per: 0.03 }] },
        { id: 's_elem_mastery', name: '元素掌握', icon: '🌀', tier: 2, max: 1, active: 'elemental_mastery', desc: '元素掌握常驻：攻击+7%，暴击+3%' },
        { id: 's_elem_chain', name: '闪电链', icon: '⚡', tier: 2, max: 1, active: 'chain_lightning', desc: '激活闪电链：对所有敌人造成自然伤害' },
      ],
    },
    {
      id: 'enhance', name: '增强', icon: '⚔️', color: '#2459ff',
      desc: '以武器与自然之力近身搏杀。',
      talents: [
        { id: 's_enh_mastery', name: '武器掌握', icon: '🗡️', tier: 0, max: 5, desc: '攻击强度提高 {n}%', mods: [{ t: 'apPct', per: 0.04 }] },
        { id: 's_enh_totem', name: '强化石爪图腾', icon: '🗿', tier: 0, max: 3, desc: '石爪图腾冷却缩短 {n} 回合', mods: [{ t: 'cdSkill', skill: 'stoneclaw_totem', per: 1 }] },
        { id: 's_enh_bl', name: '强化嗜血', icon: '🩸', tier: 1, max: 5, desc: '嗜血的攻击加成提高 {n}%', mods: [{ t: 'buffPct', skill: 'bloodlust', per: 0.02 }] },
        { id: 's_enh_earth', name: '强化大地之盾', icon: '🗻', tier: 1, max: 5, desc: '大地之盾吸收量提高 {n}%', mods: [{ t: 'shieldPct', per: 0.05 }] },
        { id: 's_enh_weapons', name: '强化武器', icon: '💪', tier: 2, max: 5, desc: '攻击强度提高 {n}%，命中提高 {n2}%', mods: [{ t: 'apPct', per: 0.02 }, { t: 'stat', stat: 'hit', per: 0.005 }] },
        { id: 's_enh_storm', name: '风暴打击', icon: '⚡', tier: 2, max: 1, active: 'stormstrike', desc: '激活风暴打击：造成物理伤害并使目标易伤 20%，持续 2 回合' },
      ],
    },
    {
      id: 'resto', name: '恢复', icon: '🌊', color: '#4fc1ff',
      desc: '与元素共鸣，以水之力量治愈万物。',
      talents: [
        { id: 's_resto_hw', name: '强化治疗波', icon: '🌊', tier: 0, max: 5, desc: '治疗波治疗量提高 {n}%', mods: [{ t: 'skillHeal', skill: 'healing_wave', per: 0.07 }] },
        { id: 's_resto_tidal', name: '潮汐掌握', icon: '🌊', tier: 0, max: 5, desc: '所有治疗量提高 {n}%', mods: [{ t: 'healMult', per: 0.03 }] },
        { id: 's_resto_guard', name: '自然守护', icon: '🌿', tier: 1, max: 5, desc: '最大生命提高 {n}%，护甲提高 {n2}%', mods: [{ t: 'hpPct', per: 0.03 }, { t: 'armorPct', per: 0.02 }] },
        { id: 's_resto_water', name: '水之精通', icon: '💧', tier: 1, max: 5, desc: '治疗波治疗量提高 {n}%，所有治疗提高 {n2}%', mods: [{ t: 'skillHeal', skill: 'healing_wave', per: 0.04 }, { t: 'healMult', per: 0.02 }] },
        { id: 's_resto_force', name: '强化潮汐', icon: '🌊', tier: 2, max: 5, desc: '法力恢复提高 {n}%，所有治疗提高 {n2}%', mods: [{ t: 'manaRegenPct', per: 0.05 }, { t: 'healMult', per: 0.02 }] },
        { id: 's_resto_tide', name: '法力之潮', icon: '🌊', tier: 2, max: 1, active: 'mana_tide', desc: '激活法力之潮：立即恢复 30% 最大法力' },
      ],
    },
  ];

  T.mage = [
    {
      id: 'arcane', name: '奥术', icon: '🔮', color: '#69ccf0',
      desc: '研习奥术魔法的本质，以智慧驾驭能量。',
      talents: [
        { id: 'm_arc_focus', name: '奥术专注', icon: '🎯', tier: 0, max: 5, desc: '技能法力消耗降低 {n}%', mods: [{ t: 'cost', per: 0.05 }] },
        { id: 'm_arc_missiles', name: '强化奥术飞弹', icon: '🔮', tier: 0, max: 5, desc: '奥术飞弹伤害提高 {n}%', mods: [{ t: 'skillDmg', skill: 'arcane_missiles', per: 0.06 }] },
        { id: 'm_arc_energy', name: '奥术能量', icon: '⚡', tier: 1, max: 5, desc: '法术强度提高 {n}%', mods: [{ t: 'spellPowerPct', per: 0.03 }] },
        { id: 'm_arc_agility', name: '奥术敏锐', icon: '👁️', tier: 1, max: 5, desc: '暴击几率提高 {n}%', mods: [{ t: 'stat', stat: 'crit', per: 0.01 }] },
        { id: 'm_arc_mind', name: '心灵掌握', icon: '🧠', tier: 2, max: 5, desc: '法术强度提高 {n}%，暴击提高 {n2}%', mods: [{ t: 'spellPowerPct', per: 0.02 }, { t: 'stat', stat: 'crit', per: 0.005 }] },
        { id: 'm_arc_power', name: '奥术强化', icon: '🔆', tier: 2, max: 1, active: 'arcane_power', desc: '奥术强化常驻：攻击+7%' },
        { id: 'm_arc_pom', name: '气定神闲', icon: '🧘', tier: 2, max: 1, active: 'presence_of_mind', desc: '激活气定神闲：下一次技能零消耗且不进入冷却' },
      ],
    },
    {
      id: 'fire', name: '火焰', icon: '🔥', color: '#ff8000',
      desc: '掌控烈焰，将一切燃烧殆尽。',
      talents: [
        { id: 'm_fire_fireball', name: '强化火球术', icon: '🔥', tier: 0, max: 5, desc: '火球术伤害提高 {n}%', mods: [{ t: 'skillDmg', skill: 'fireball', per: 0.06 }] },
        { id: 'm_fire_incin', name: '燃尽', icon: '☄️', tier: 0, max: 5, desc: '火焰系伤害提高 {n}%', mods: [{ t: 'dmgType', type: 'fire', per: 0.04 }] },
        { id: 'm_fire_impact', name: '冲击', icon: '💥', tier: 1, max: 5, desc: '暴击伤害加成提高 {n}%', mods: [{ t: 'critMult', per: 0.04 }] },
        { id: 'm_fire_heart', name: '烈焰之心', icon: '❤️‍🔥', tier: 1, max: 5, desc: '火焰伤害提高 {n}%，火球术提高 {n2}%', mods: [{ t: 'dmgType', type: 'fire', per: 0.02 }, { t: 'skillDmg', skill: 'fireball', per: 0.03 }] },
        { id: 'm_fire_ignite', name: '引燃', icon: '🕯️', tier: 2, max: 5, desc: '火球术伤害提高 {n}%，火焰伤害提高 {n2}%', mods: [{ t: 'skillDmg', skill: 'fireball', per: 0.04 }, { t: 'dmgType', type: 'fire', per: 0.02 }] },
        { id: 'm_fire_combust', name: '燃烧', icon: '☄️', tier: 2, max: 1, active: 'combustion', desc: '燃烧常驻：攻击+8%，暴击+5%' },
        { id: 'm_fire_pyro', name: '炎爆术', icon: '☄️', tier: 2, max: 1, active: 'pyroblast', desc: '激活炎爆术：造成毁灭性火焰伤害' },
      ],
    },
    {
      id: 'frost', name: '冰霜', icon: '❄️', color: '#7fd8ff',
      desc: '以寒冰之力冻结敌人，掌控战场的节奏。',
      talents: [
        { id: 'm_frost_frostbolt', name: '强化寒冰箭', icon: '❄️', tier: 0, max: 5, desc: '寒冰箭伤害提高 {n}%', mods: [{ t: 'skillDmg', skill: 'frostbolt', per: 0.06 }] },
        { id: 'm_frost_chill', name: '寒冰刺骨', icon: '🧊', tier: 0, max: 5, desc: '冰霜系伤害提高 {n}%', mods: [{ t: 'dmgType', type: 'frost', per: 0.04 }] },
        { id: 'm_frost_blizzard', name: '强化暴风雪', icon: '🌨️', tier: 1, max: 5, desc: '暴风雪伤害提高 {n}%', mods: [{ t: 'skillDmg', skill: 'blizzard', per: 0.06 }] },
        { id: 'm_frost_winter', name: '深冬之寒', icon: '🌨️', tier: 1, max: 5, desc: '冰霜持续伤害提高 {n}%', mods: [{ t: 'dotType', type: 'frost', per: 0.05 }] },
        { id: 'm_frost_wind', name: '刺骨寒风', icon: '🌬️', tier: 2, max: 5, desc: '冰霜持续伤害提高 {n}%，冰霜伤害提高 {n2}%', mods: [{ t: 'dotType', type: 'frost', per: 0.03 }, { t: 'dmgType', type: 'frost', per: 0.02 }] },
        { id: 'm_frost_armor', name: '寒冰护体', icon: '🧊', tier: 2, max: 1, active: 'frost_armor', desc: '寒冰护体常驻：战斗开始自动获得冰霜护盾' },
        { id: 'm_frost_nova', name: '冰霜新星', icon: '❄️', tier: 2, max: 1, active: 'frost_nova', desc: '激活冰霜新星：定身所有敌人 1 回合' },
      ],
    },
  ];

  T.warlock = [
    {
      id: 'aff', name: '痛苦', icon: '😖', color: '#9482c9',
      desc: '以无尽的痛苦折磨敌人，慢慢将其侵蚀殆尽。',
      talents: [
        { id: 'wl_aff_corr', name: '强化腐蚀术', icon: '☠️', tier: 0, max: 5, desc: '暗影系持续伤害提高 {n}%', mods: [{ t: 'dotType', type: 'shadow', per: 0.07 }] },
        { id: 'wl_aff_drain', name: '强化吸取生命', icon: '🧛', tier: 0, max: 5, desc: '吸取生命伤害提高 {n}%，吸取效果提高 {n2}%', mods: [{ t: 'skillDmg', skill: 'drain_life', per: 0.06 }, { t: 'lifestealPct', per: 0.06 }] },
        { id: 'wl_aff_curse', name: '强化痛苦诅咒', icon: '😖', tier: 1, max: 5, desc: '暗影系持续伤害提高 {n}%', mods: [{ t: 'dotType', type: 'shadow', per: 0.03 }] },
        { id: 'wl_aff_fear', name: '强化恐惧术', icon: '😱', tier: 1, max: 3, desc: '恐惧术冷却缩短 {n} 回合', mods: [{ t: 'cdSkill', skill: 'fear', per: 1 }] },
        { id: 'wl_aff_ruth', name: '无情', icon: '💀', tier: 2, max: 5, desc: '暴击伤害加成提高 {n}%，暗影持续伤害提高 {n2}%', mods: [{ t: 'critMult', per: 0.05 }, { t: 'dotType', type: 'shadow', per: 0.03 }] },
        { id: 'wl_aff_curse2', name: '暗影诅咒', icon: '🔮', tier: 2, max: 1, active: 'shadow_curse', desc: '激活暗影诅咒：目标受到的伤害+20%，持续 3 回合' },
        { id: 'wl_aff_coil', name: '死亡缠绕', icon: '🩸', tier: 2, max: 1, active: 'death_coil', desc: '激活死亡缠绕：暗影伤害+恐惧 1 回合+恢复生命' },
      ],
    },
    {
      id: 'demo', name: '恶魔', icon: '😈', color: '#8a7cc4',
      desc: '与恶魔订立契约，驱使仆从作战。',
      talents: [
        { id: 'wl_demo_pet', name: '强化宠物', icon: '🐾', tier: 0, max: 5, desc: '宠物造成的伤害提高 {n}%', mods: [{ t: 'petDmg', per: 0.06 }] },
        { id: 'wl_demo_skin', name: '恶魔之皮', icon: '🧛', tier: 0, max: 5, desc: '最大生命提高 {n}%', mods: [{ t: 'hpPct', per: 0.04 }] },
        { id: 'wl_demo_know', name: '恶魔知识', icon: '📖', tier: 1, max: 5, desc: '法术强度提高 {n}%，宠物伤害提高 {n2}%', mods: [{ t: 'spellPowerPct', per: 0.03 }, { t: 'petDmg', per: 0.02 }] },
        { id: 'wl_demo_shelter', name: '恶魔庇护', icon: '⛨', tier: 1, max: 5, desc: '护甲提高 {n}%，最大生命提高 {n2}%', mods: [{ t: 'armorPct', per: 0.04 }, { t: 'hpPct', per: 0.02 }] },
        { id: 'wl_demo_power', name: '恶魔强化', icon: '💪', tier: 2, max: 5, desc: '宠物伤害提高 {n}%，最大生命提高 {n2}%', mods: [{ t: 'petDmg', per: 0.04 }, { t: 'hpPct', per: 0.02 }] },
        { id: 'wl_demo_frenzy', name: '恶魔狂暴', icon: '😈', tier: 2, max: 1, active: 'demonic_frenzy', desc: '恶魔狂暴常驻：自身攻击+8%，宠物+13%' },
      ],
    },
    {
      id: 'destro', name: '毁灭', icon: '🔥', color: '#a08bd0',
      desc: '以毁灭性的力量瞬间瓦解敌人。',
      talents: [
        { id: 'wl_destr_sb', name: '强化暗影箭', icon: '🌑', tier: 0, max: 5, desc: '暗影箭伤害提高 {n}%', mods: [{ t: 'skillDmg', skill: 'shadow_bolt', per: 0.07 }] },
        { id: 'wl_destr_dest', name: '毁灭', icon: '💥', tier: 0, max: 5, desc: '暗影系伤害提高 {n}%', mods: [{ t: 'dmgType', type: 'shadow', per: 0.04 }] },
        { id: 'wl_destr_immo', name: '强化献祭', icon: '🕯️', tier: 1, max: 5, desc: '献祭伤害提高 {n}%，灼烧提高 {n2}%', mods: [{ t: 'skillDmg', skill: 'immolate', per: 0.05 }, { t: 'dotType', type: 'fire', per: 0.04 }] },
        { id: 'wl_destr_dev', name: '清算', icon: '⚖️', tier: 1, max: 5, desc: '暴击伤害加成提高 {n}%', mods: [{ t: 'critMult', per: 0.04 }] },
        { id: 'wl_destr_conf', name: '燃尽', icon: '🔥', tier: 2, max: 5, desc: '暴击伤害加成提高 {n}%，火焰伤害提高 {n2}%', mods: [{ t: 'critMult', per: 0.03 }, { t: 'dmgType', type: 'fire', per: 0.03 }] },
        { id: 'wl_destr_hf', name: '地狱烈焰', icon: '🔥', tier: 2, max: 1, active: 'hellfire', desc: '激活地狱烈焰：对所有敌人造成火焰伤害，自身受到少量伤害' },
        { id: 'wl_destr_soul', name: '灵魂之火', icon: '🔥', tier: 2, max: 1, active: 'soul_fire', desc: '激活灵魂之火：造成毁灭性暗影伤害' },
      ],
    },
  ];

  T.druid = [
    {
      id: 'balance', name: '平衡', icon: '🌙', color: '#f0a030',
      desc: '借日月星辰之力，平衡天地的力量。',
      talents: [
        { id: 'd_bal_wrath', name: '强化愤怒', icon: '🌄', tier: 0, max: 5, desc: '愤怒伤害提高 {n}%', mods: [{ t: 'skillDmg', skill: 'wrath', per: 0.07 }] },
        { id: 'd_bal_moonfire', name: '强化月火术', icon: '🌙', tier: 0, max: 5, desc: '月火术伤害提高 {n}%，灼烧提高 {n2}%', mods: [{ t: 'skillDmg', skill: 'moonfire', per: 0.05 }, { t: 'dotType', type: 'arcane', per: 0.04 }] },
        { id: 'd_bal_fury', name: '自然之怒', icon: '🌿', tier: 1, max: 5, desc: '自然系伤害提高 {n}%', mods: [{ t: 'dmgType', type: 'nature', per: 0.04 }] },
        { id: 'd_bal_focus', name: '节能施法', icon: '🎯', tier: 1, max: 5, desc: '技能法力消耗降低 {n}%', mods: [{ t: 'cost', per: 0.05 }] },
        { id: 'd_bal_lunar', name: '月神之触', icon: '🌕', tier: 2, max: 5, desc: '法术强度提高 {n}%，奥术持续伤害提高 {n2}%', mods: [{ t: 'spellPowerPct', per: 0.04 }, { t: 'dotType', type: 'arcane', per: 0.03 }] },
        { id: 'd_bal_starfire', name: '星火术', icon: '🌟', tier: 2, max: 1, active: 'starfire', desc: '激活星火术：造成大量自然伤害' },
        { id: 'd_bal_faerie', name: '精灵之火', icon: '✨', tier: 2, max: 1, active: 'faerie_fire', desc: '激活精灵之火：目标受到的伤害+10%，持续 3 回合' },
      ],
    },
    {
      id: 'feral', name: '野性', icon: '🐆', color: '#ff6d00',
      desc: '以猎豹之敏捷与巨熊之坚韧纵横战场。',
      talents: [
        { id: 'd_fer_cat', name: '强化猎豹形态', icon: '🐆', tier: 0, max: 5, desc: '猎豹形态的攻击加成提高 {n}%', mods: [{ t: 'buffPct', skill: 'cat_form', per: 0.06 }] },
        { id: 'd_fer_bear', name: '强化熊形态', icon: '🐻', tier: 0, max: 5, desc: '熊形态的攻击与护甲加成提高 {n}%', mods: [{ t: 'buffPct', skill: 'bear_form', per: 0.05 }] },
        { id: 'd_fer_heart', name: '野性之心', icon: '❤️', tier: 1, max: 5, desc: '攻击强度提高 {n}%', mods: [{ t: 'apPct', per: 0.05 }] },
        { id: 'd_fer_thorns', name: '强化荆棘术', icon: '🌵', tier: 1, max: 5, desc: '荆棘反弹伤害提高 {n}%', mods: [{ t: 'thornsPct', per: 0.08 }] },
        { id: 'd_fer_fero', name: '兽性', icon: '🐾', tier: 2, max: 5, desc: '暴击伤害加成提高 {n}%，攻击强度提高 {n2}%', mods: [{ t: 'critMult', per: 0.05 }, { t: 'apPct', per: 0.02 }] },
        { id: 'd_fer_berserk', name: '狂暴', icon: '😡', tier: 2, max: 1, active: 'berserk', desc: '狂暴常驻：攻击+8%，暴击+3%' },
        { id: 'd_fer_tiger', name: '猛虎之怒', icon: '🐯', tier: 2, max: 1, active: 'tigers_fury', desc: '猛虎之怒常驻：攻击+8%' },
      ],
    },
    {
      id: 'resto', name: '恢复', icon: '🌿', color: '#6cc06b',
      desc: '自然之母的恩泽，让生命生生不息。',
      talents: [
        { id: 'd_resto_ht', name: '强化治疗之触', icon: '🖐️', tier: 0, max: 5, desc: '治疗之触治疗量提高 {n}%', mods: [{ t: 'skillHeal', skill: 'healing_touch', per: 0.07 }] },
        { id: 'd_resto_rejuv', name: '强化愈合', icon: '💚', tier: 0, max: 5, desc: '愈合的持续治疗效果提高 {n}%', mods: [{ t: 'hotPct', skill: 'rejuvenation', per: 0.06 }] },
        { id: 'd_resto_focus', name: '自然专注', icon: '🧘', tier: 1, max: 5, desc: '技能法力消耗降低 {n}%', mods: [{ t: 'cost', per: 0.05 }] },
        { id: 'd_resto_seed', name: '生命之种', icon: '🌱', tier: 1, max: 5, desc: '所有治疗提高 {n}%，愈合提高 {n2}%', mods: [{ t: 'healMult', per: 0.03 }, { t: 'hotPct', skill: 'rejuvenation', per: 0.03 }] },
        { id: 'd_resto_mastery', name: '强化自然', icon: '🌿', tier: 2, max: 5, desc: '所有治疗提高 {n}%，法力恢复提高 {n2}%', mods: [{ t: 'healMult', per: 0.04 }, { t: 'manaRegenPct', per: 0.03 }] },
        { id: 'd_resto_tranq', name: '宁静', icon: '🌊', tier: 2, max: 1, active: 'tranquility', desc: '激活宁静：每回合恢复生命，持续 3 回合' },
      ],
    },
  ];

  /* ============ 推荐天赋搭配(每职业 2 套经典点法,共 16 点) ============ */
  D.TALENT_BUILDS = {
    warrior: [
      { name: '武器猛攻', icon: '⚔️', tree: 'arms', desc: '剑出如虹：强化英勇打击与撕裂，武器大师提高攻强，鲁莽收尾爆发。', points: [['w_arms_heroic', 5], ['w_arms_rend', 5], ['w_arms_master', 5], ['w_arms_recklessness', 1]] },
      { name: '防护铁壁', icon: '🛡️', tree: 'prot', desc: '钢铁壁垒：盾牌专精与坚韧拉满生存，盾墙关键时候保命。', points: [['w_prot_spec', 5], ['w_prot_block', 3], ['w_prot_tough', 5], ['w_prot_vital', 2], ['w_prot_wall', 1]] },
    ],
    paladin: [
      { name: '惩戒审判', icon: '⚔️', tree: 'ret', desc: '圣光裁决：审判与神圣系伤害拉满，复仇之怒开启爆发。', points: [['p_ret_str', 5], ['p_ret_judge', 5], ['p_ret_holy', 5], ['p_ret_wrath', 1]] },
      { name: '神圣治愈', icon: '✨', tree: 'holy', desc: '圣光眷顾：强化圣光术与全体治疗，圣疗术起死回生。', points: [['p_holy_hl', 5], ['p_holy_pow', 5], ['p_holy_focus', 5], ['p_holy_loh', 1]] },
    ],
    hunter: [
      { name: '野兽主宰', icon: '🐯', tree: 'beast', desc: '人兽合一：强化宠物与猎人印记，狂野怒火令宠物狂暴。', points: [['h_beast_pet', 5], ['h_beast_call', 5], ['h_beast_fero', 5], ['h_beast_wrath', 1]] },
      { name: '远程射击', icon: '🏹', tree: 'marks', desc: '百步穿杨：射击三连强化，急速射击箭如雨下。', points: [['h_marks_arc', 5], ['h_marks_ranged', 5], ['h_marks_steady', 5], ['h_marks_rapid', 1]] },
    ],
    rogue: [
      { name: '致命刺杀', icon: '🗡️', tree: 'assass', desc: '一击毙命：剔骨背刺强化+暴击，冷血保证下一击必爆。', points: [['r_assass_evisc', 5], ['r_assass_cold', 5], ['r_assass_backstab', 5], ['r_assass_cb', 1]] },
      { name: '剑刃战斗', icon: '⚔️', tree: 'combat', desc: '正面压制：邪恶攻击与切割强化，冲动让能量源源不绝。', points: [['r_combat_sinister', 5], ['r_combat_snd', 5], ['r_combat_master', 5], ['r_combat_ar', 1]] },
    ],
    priest: [
      { name: '暗影湮灭', icon: '🌑', tree: 'shadow', desc: '拥抱暗影：暗言术：痛与心灵震爆强化，暗影形态爆发输出。', points: [['pr_shadow_swp', 5], ['pr_shadow_spec', 5], ['pr_shadow_mb', 5], ['pr_shadow_form', 1]] },
      { name: '神圣治愈', icon: '✨', tree: 'holy', desc: '救死扶伤：治疗术与治疗量全面强化，神圣新星攻守兼备。', points: [['pr_holy_heal', 5], ['pr_holy_pow', 5], ['pr_holy_prot', 5], ['pr_holy_nova', 1]] },
    ],
    shaman: [
      { name: '元素雷霆', icon: '⚡', tree: 'elem', desc: '雷霆万钧：闪电箭与震击强化，元素掌握开启爆发。', points: [['s_elem_lb', 5], ['s_elem_focus', 5], ['s_elem_fs', 5], ['s_elem_mastery', 1]] },
      { name: '增强风暴', icon: '⚔️', tree: 'enhance', desc: '风暴之力：武器与嗜血强化，风暴打击造成易伤。', points: [['s_enh_mastery', 5], ['s_enh_totem', 3], ['s_enh_bl', 5], ['s_enh_weapons', 3]] },
    ],
    mage: [
      { name: '火焰爆发', icon: '🔥', tree: 'fire', desc: '焚尽万物：火球术+火焰系伤害拉满，燃烧开启爆发。', points: [['m_fire_fireball', 5], ['m_fire_incin', 5], ['m_fire_impact', 5], ['m_fire_combust', 1]] },
      { name: '冰霜控场', icon: '❄️', tree: 'frost', desc: '冰封千里：寒冰箭与暴风雪强化，冰霜新星定身全场。', points: [['m_frost_frostbolt', 5], ['m_frost_chill', 5], ['m_frost_blizzard', 5], ['m_frost_nova', 1]] },
    ],
    warlock: [
      { name: '痛苦折磨', icon: '😖', tree: 'aff', desc: '慢性死亡：腐蚀与吸取强化，暗影诅咒让敌人更脆弱。', points: [['wl_aff_corr', 5], ['wl_aff_drain', 5], ['wl_aff_curse', 5], ['wl_aff_curse2', 1]] },
      { name: '毁灭轰炸', icon: '🔥', tree: 'destro', desc: '毁天灭地：暗影箭与献祭强化，地狱烈焰焚烧一切。', points: [['wl_destr_sb', 5], ['wl_destr_dest', 5], ['wl_destr_immo', 5], ['wl_destr_hf', 1]] },
    ],
    druid: [
      { name: '野性狂暴', icon: '🐆', tree: 'feral', desc: '化身猛兽：形态强化+野性之心，狂暴开启嗜血输出。', points: [['d_fer_cat', 5], ['d_fer_bear', 5], ['d_fer_heart', 5], ['d_fer_berserk', 1]] },
      { name: '日月平衡', icon: '🌙', tree: 'balance', desc: '自然之怒：愤怒与月火强化，星火术威力惊人。', points: [['d_bal_wrath', 5], ['d_bal_moonfire', 5], ['d_bal_fury', 5], ['d_bal_starfire', 1]] },
    ],
  };
})();
