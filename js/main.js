/* 魔兽世界 · 战大陆 — 主流程:标题画面 / 角色创建(阵营→种族→职业→命名) */
(function () {
  'use strict';
  const W = window.WOW;
  const D = W.Data;
  const C = W.Config;
  const U = W.Utils;

  const Main = {
    create: { faction: null, race: null, classId: null, name: '' },

    init() {
      // 读取持久化 UI 偏好(音效静音;设置面板与标题按钮共用)
      try { W.Audio.muted = localStorage.getItem(W.Audio.SOUND_KEY) === '1'; } catch (e) { /* ignore */ }
      this._bindTitle();
      this._bindCreate();
      this._bindSettings();
      this.renderTitle();
      W.UI.showView('title');
    },

    /* ============ 标题 ============ */
    _bindTitle() {
      const root = document.getElementById('view-title');
      root.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-act]');
        if (!btn) return;
        W.Audio.click();
        const act = btn.dataset.act;
        if (act === 'new') this.startCreate();
        else if (act === 'continue') this.continueGame();
        else if (act === 'saves') this.titleSaves();
        else if (act === 'help') this.openHelp();
        else if (act === 'sound') {
          W.Audio.muted = !W.Audio.muted;
          try { localStorage.setItem(W.Audio.SOUND_KEY, W.Audio.muted ? '1' : '0'); } catch (e) { /* ignore */ }
          if (!W.Audio.muted) W.Audio.init(); // 取消静音时补建音频上下文(否则首次点击在静音态跳过,取消后无声)
          btn.innerHTML = W.Audio.muted ? '🔇 音效：关' : '🔊 音效：开';
        }
      });
    },

    renderTitle() {
      const slots = W.State.loadSlots();
      const hasSave = slots.some(Boolean);
      document.getElementById('view-title').innerHTML = `
        <div class="title-content">
          <div class="wow-logo">
            <span class="wow-w">W</span><span class="wow-o">O</span><span class="wow-w">W</span>
          </div>
          <div class="wow-sub">魔兽世界·战大陆</div>
          <div class="wow-tagline">为了联盟！为了部落！</div>
          <div class="title-menu">
            <button class="btn gold big title-btn" data-act="new">⚔️ 创建新英雄</button>
            <button class="btn big title-btn ${hasSave ? '' : 'disabled'}" data-act="continue" ${hasSave ? '' : 'disabled'}>⏩ 继续冒险</button>
            <button class="btn big title-btn" data-act="saves">💾 存档管理</button>
            <button class="btn big title-btn" data-act="help">❓ 玩法说明</button>
            <button class="btn ghost title-btn" data-act="sound">${W.Audio.muted ? '🔇 音效：关' : '🔊 音效：开'}</button>
          </div>
          <div class="title-foot">8 大种族 × 9 大职业 · 41 种经典组合</div>
        </div>`;
    },

    continueGame() {
      const slots = W.State.loadSlots();
      if (!slots.some(Boolean)) { W.UI.toast('没有存档，请先创建角色', 'warn'); return; }
      if (W.State.load(W.State._saveSlot)) {
        W.UI.toast('欢迎回来，' + W.State.character.name, 'ok');
        W.World.showWorld();
      } else {
        const idx = slots.findIndex(Boolean);
        W.State.load(idx);
        W.World.showWorld();
      }
    },

    titleSaves() {
      const slots = W.State.loadSlots();
      let html = '<div class="save-slots">';
      for (let i = 0; i < C.MAX_SLOTS; i++) {
        const s = slots[i];
        if (s) {
          html += W.State.saveRowHtml(s, i, { load: true, del: true, primary: 'load' });
        } else {
          html += `<div class="save-row empty"><div class="save-info">空存档槽</div></div>`;
        }
      }
      html += '</div>';
      W.UI.openModal(html, { title: '存档管理' });
      const m = document.getElementById('modal-root');
      m.querySelectorAll('[data-load]').forEach((btn) => btn.addEventListener('click', () => {
        if (W.State.load(parseInt(btn.dataset.load, 10))) {
          W.UI.closeModal();
          W.UI.toast('读档成功', 'ok');
          W.World.showWorld();
        }
      }));
      m.querySelectorAll('[data-del]').forEach((btn) => btn.addEventListener('click', () => {
        W.State.erase(parseInt(btn.dataset.del, 10));
        this.titleSaves();
      }));
    },

    openHelp() {
      W.UI.openModal(`
        <div class="help-list">
          <div class="help-item"><b>⚔️ 战斗</b> —— 回合制。选择技能（或按快捷键 1-9），点击敌方卡牌切换目标。暴击、闪避、护甲、元素抗性一应俱全。</div>
          <div class="help-item"><b>🎭 职业资源</b> —— 战士用怒气（受击/造成伤害积攒），盗贼用能量+连击点，其余职业用法力。</div>
          <div class="help-item"><b>🛡️ 种族天赋</b> —— 每个种族都有被动与主动天赋，主动天赋会出现在技能栏中。</div>
          <div class="help-item"><b>🌟 三系天赋</b> —— 10 级起每级获得 1 点天赋点，可在三大天赋树中强化技能：左键学习、右键卸载、可花钱重置。第 3 层主动天赋会解锁全新技能（技能书与技能栏带「天赋」标记），天赋弹窗附有每职业两套推荐点法，可一键分配。</div>
          <div class="help-item"><b>✨ 天赋主动技能机制</b> —— 气定神闲：下一技能零消耗且不进入冷却；冰霜新星/破胆怒吼：控制所有敌人（战争践踏同为群体眩晕）；暗言术：灭：若击杀目标会反噬自身；疾跑：大幅提升闪避；肾击：消耗连击点眩晕目标；暗言术/死亡缠绕：造成伤害的同时恐惧或治疗自己。</div>
          <div class="help-item"><b>♾️ 被动技能（常驻）</b> —— 31 个经典技能优化为常驻被动，不占技能栏、效果永久生效：属性类直接加成（战斗怒吼+攻击、盾牌格挡+护甲、切割/嗜血/猎豹形态+伤害、熊形态+攻防、血性狂暴/狂暴等）；<b>天赋爆发类</b>按「爆发×覆盖率」折算为常驻小加成（鲁莽/死亡之愿/盾墙+护甲、燃烧/奥术强化/复仇之怒/元素掌握/暗影形态/狂暴/猛虎之怒/急速射击+攻击与暴击，狂野怒火/恶魔狂暴同时强化宠物）；战斗类常驻触发（正义圣印攻击附加神圣伤害、荆棘反弹近战伤害）。<b>起始护盾</b>：萨满「大地之盾」、法师「寒冰护体」、圣骑士「神圣防护」在<b>战斗开始时</b>自动获得吸收护盾（大地之盾受击还会回血）；<b>自动标记</b>：猎人「猎人印记」在战斗开始时自动标记首个敌人，提高其受到的伤害。对应天赋（强化战斗怒吼/切割/嗜血/形态/猎人印记/大地之盾）会进一步强化被动；战斗界面玩家卡牌下方以金色水印图标展示当前生效的被动。</div>
          <div class="help-item"><b>⚒️ 锻造铺</b> —— 世界界面底部「锻造」集齐<b>强化 · 附魔 · 分解 · 合成 · 打造</b>：强化消耗金币与材料逐级提升属性（满 +15，11 级起消耗双倍水晶；武器每级 +1 伤害、护甲每级 +2、属性每 2 级 +1）；附魔为装备附加永久效果（基础附魔 + 60 级高级附魔如怒火吸血 / 致命暴击 / 力量智慧雕文，可替换）；分解把背包中不用的优秀（绿）/精良（蓝）装备还原为锻造材料；<b>🧪 材料合成</b>把 5 粉尘→1 精华、5 精华→1 水晶（另需少量金币）；<b>🔨 装备打造</b>消耗材料与金币直接制作 10 款蓝/紫装备。锻造铺与背包均提供「⚡ 一键分解全部绿色装备」按钮（二次确认）。材料由怪物掉落、任务奖励、副本通关宝箱、商贩出售、分解装备或合成获得；副本最终 Boss 必定掉落奥术水晶。</div>
          <div class="help-item"><b>🛡️ 副手装备</b> —— 主手武器之外的<b>独立副手槽</b>（不占背包、不与武器冲突），<b>任何职业</b>均可装备，可正常强化 + 附魔。三类副手各有侧重：<b>盾牌</b>（兽皮圆盾→龙鳞守卫）高护甲 + 耐力（高级盾牌额外带力量/闪避），适合<b>战士 / 圣骑士</b>；<b>副刃</b>（猎手短刃/剃刀副刃）敏捷（剃刀副刃附加暴击），适合<b>盗贼 / 猎人</b>；<b>圣物</b>（月神圣物/日神圣物）智力 + 精神（日神圣物附加暴击），适合<b>萨满 / 德鲁伊 / 牧师 / 法师 / 术士</b>等施法职业；另有<b>加丁的黑暗密典</b>（通灵学院掉落）。12 级起各区域商贩与怪物掉落均有产出，技能书顶部可查看完整适用说明。</div>
          <div class="help-item"><b>👑 装备套装</b> —— 熔火之心 / 黑翼之巢 / 奥妮克希亚的巢穴 / 祖尔格拉布 / 安其拉神殿产出的史诗与传说装备带有套装标识（📦），集齐 <b>2 件 / 4 件</b>自动激活套装加成：攻击力提升、暴击、吸血、减伤、治疗加成等，属性实时计入面板与战斗。状态面板「装备套装」区显示每套当前件数与已激活 / 未激活加成，背包中每件套装装备也标注实时件数（悬停查看详情）；世界首领与团本 Boss 的传说武器亦是套装核心件。</div>
          <div class="help-item"><b>🏅 成就系统</b> —— 世界界面底部「成就」面板汇总全部成就与进度（已达成 / 未达成、实时进度条、奖励预览）。成就随行为自动解锁：通关副本（5 人本 / 熔火之心 / 安其拉神殿）、击杀稀有精英与世界首领、锻造强化至 +10 / 满级 +15、首次附魔与打造、累计击杀 100 怪、升到 60 级、集齐 4 件套装等；解锁瞬间自动发放金币、经验与物品奖励，战斗中达成会在战斗日志弹出成就提示，副本通关结算界面也会展示新成就。</div>
          <div class="help-item"><b>👹 首领图鉴</b> —— 世界界面底部「图鉴」面板记录你的首领猎杀史：已击败 X / 全部首领、累计击杀次数，以及每位首领的<b>通关次数</b>与<b>最快回合</b>（首杀时间一并记录）。图鉴分「🔥 团本首领 / ⚔️ 副本首领 / 🌍 世界首领」三组，未击杀的首领显示其出没地（副本名 / 区域名），方便按图索骥；每次击败副本最终 Boss 或世界首领自动更新记录。</div>
          <div class="help-item"><b>🏛️ 阵营声望</b> —— 世界界面底部「声望」面板记录你与 5 大阵营（暴风城 / 奥格瑞玛 / 银色黎明 / 塞纳里奥议会 / 瑟银兄弟会）的关系：经典魔兽声望等级（中立→友善→尊敬→崇敬→崇拜）与实时进度。声望通过<b>击杀对应区域怪物、通关对应副本、完成区域任务</b>自动获取（副本通关大额获取，提升等级时战斗日志与结算弹窗会提示）。达到 <b>尊敬</b> 可向军需官购买精良装备、<b>崇敬</b> 解锁史诗装备、<b>崇拜</b> 可购买<b>专属坐骑</b>（收藏后每匹永久 +2% 金币获取，状态面板展示坐骑收藏）。<b>🎖️ 声望徽章</b>：各阵营的精英怪与副本首领掉落专属徽章（暴风城 / 奥格瑞玛 / 银色黎明 / 塞纳里奥 / 瑟银），在声望面板中可上交，每个徽章换取 <b>+300 声望</b>（支持一键全部上交）——刷精英时留意徽章掉落，上交加速冲声望等级。</div>
          <div class="help-item"><b>💀 首领独特机制</b> —— 团本与 5 人副本的最终首领都拥有标志性技能，悬停其卡牌可查看技能说明：团本方面 <b>克苏恩</b>「眼棱」灼烧护甲（-35%，2 回合）、<b>奈法利安</b>「龙翼打击」AOE 击退并削弱攻击（-30%）、<b>奥妮克希亚</b>「深呼吸」全屏烈焰 + 持续灼烧、<b>拉格纳罗斯</b>「熔岩轰击」高伤火焰 + 灼烧、<b>哈卡</b>「腐化之血」强力流血并抑制治疗（-50%）；<b>5 人副本</b>同样各有绝活：<b>范克里夫</b>「双刀乱舞」AOE 压制攻击、<b>阿鲁高</b>「狼人诅咒」召唤狼人并抑疗、<b>阿扎达斯</b>「泰坦震击」全场眩晕、<b>克尔苏加德</b>「寒冰锁链」冰伤减速、<b>瑞文戴尔</b>「死亡缠绕」暗影重创 + 生命虹吸等 20 个招牌技能（新增 8 副本首领：怒焰裂谷杰尔戈什「燃尽魔印」、暴风城监狱斯奈德「监狱铁链」、黑暗深渊阿库麦尔「暗影潮汐」、诺莫瑞根瑟玛普拉格「辐射污染」、剃刀沼泽卡尔加「剃刀冲锋」、剃刀高地阿姆纳尔「冰寒墓地」、血色修道院怀特迈恩「圣光之怒」、沉没的神庙哈卡化身「灵魂汲取」）。这些减益都会显示为战斗卡牌上的负面图标，合理走位 / 防御姿态 / 治疗爆发是获胜关键。<b>进本前情报</b>：进入副本后区域面板直接展示「⚔️ 首领战前预览」（最终首领 + 招牌技能），点击「📖 副本手册」可逐波查看每波敌人的技能详解，「独特机制」技能以红色标签高亮——知己知彼，百战不殆。</div>
          <div class="help-item"><b>🗺️ 60 级终局</b> —— 新增 5 大高级区域：诅咒之地（48-55）、费伍德森林 / 艾萨拉（50-58）、东瘟疫之地 / 希利苏斯（58-60），各自出没稀有精英与高级掉落。<b>9 大新副本</b>：5 人本「黑石塔 / 厄运之槌 / 斯坦索姆」，团本「熔火之心（拉格纳罗斯）/ 黑翼之巢（奈法利安）/ 奥妮克希亚的巢穴 / 祖尔格拉布（哈卡）/ 安其拉废墟 / 安其拉神殿（克苏恩）」，团本均为 5 波制、Boss 掉落史诗与传说武器（拉格纳罗斯之手 / 奈法利安之刃 / 克苏恩之眼），击败必掉双倍奥术水晶。</div>
          <div class="help-item"><b>⛏️ 经典 8 副本扩充</b> —— 补齐 8 个经典 5 人副本，覆盖 13-51 级全阶段：部落「怒焰裂谷」（奥格瑞玛，13-16）、联盟「暴风城监狱」（暴风城，22-26）、中立「黑暗深渊」（尘泥沼泽，20-26）、联盟「诺莫瑞根」（赤脊山，24-30）、部落「剃刀沼泽 / 剃刀高地」（贫瘠之地，25-31 / 33-40）、「血色修道院」（瘟疫之地，29-41）、「沉没的神庙」（安戈洛环形山，45-51）。每本 4 波（双小怪波 + 精英波 + 最终首领），首领持有独特机制与专属掉落：30 级以上副本 Boss 掉落史诗装备（辐射光枪 / 剃刀战斧 / 寒霜之刃 / 血色圣袍 / 哈卡莱战刃），低等级 Boss 掉落精良武器（怒焰仪式之刃 / 暗巷刺刀 / 深渊珊瑚护符）；副本宝箱与任务奖励同步供给锻造材料，最终 Boss 必定掉落奥术水晶。</div>
          <div class="help-item"><b>🧭 探索</b> —— 在野外探索有概率遭遇怪物；击杀怪物可获得经验、金币与任务进度。</div>
          <div class="help-item"><b>🌍 世界首领</b> —— 卡扎克（燃烧平原）与艾萨拉绿龙（冬泉谷）是世界级威胁，被击败后 <b>30 分钟</b>重新现身（区域面板实时倒计时、旅行面板标注出没区域）。55 级起可挑战：击败必掉稀有装备——卡扎克掉落传说「卡扎克之刃」、史诗「深渊徽记」，绿龙掉落史诗「翡翠龙鳞之盔」「艾萨拉寒冰法杖」，两者均必定掉落奥术水晶×2。</div>
          <div class="help-item"><b>⛏️ 副本</b> —— 共 9 个副本：死亡矿井、哀嚎洞穴、影牙城堡、奥达曼、祖尔法拉克、玛拉顿、黑石深渊、通灵学院、纳克萨玛斯（最终挑战）。每座副本为 4 波战斗（副本内可拾取宝箱），最终首领拥有特殊阶段机制且必定掉落奥术水晶。<b>30 级以上</b>副本最终 Boss 掉落<b>紫色史诗</b>装备，<b>50 级以上</b>副本有几率掉落<b>橙色传说</b>装备，最终 Boss 更有几率掉落<b>极品橙色传说</b>（属性大幅提升）。</div>
          <div class="help-item"><b>📜 战斗卷轴</b> —— 商人处购买「力量/保护/爆击/迅捷/生命/法力」卷轴，战斗中在卷轴栏点击<b>免费使用、不占回合</b>：攻击/护甲/暴击/闪避类祝福持续 5 回合，生命/法力卷轴立即恢复。</div>
          <div class="help-item"><b>⚔️ 战后休整</b> —— 野外战斗胜利后自动恢复部分生命；状态面板可直接把<b>已装备</b>的多余装备<b>分解</b>为材料或<b>出售</b>换金币。</div>
          <div class="help-item"><b>🏨 旅店</b> —— 免费恢复全部状态并保存进度。战斗中死亡会回到主城复活。</div>
          <div class="help-item"><b>🐯 宠物</b> —— 猎人可召唤白虎，术士可召唤虚空行者（自带嘲讽），萨满可召唤石爪图腾。猎人还可驯服野兽：战斗中「驯服野兽」可驯服生命低于 50% 的野兽，击败野兽也有几率自动驯服；宠物栏（世界界面「🐾 宠物」）可切换出战。</div>
          <div class="help-item"><b>☠️ 毒药（盗贼）</b> —— 在商店购买毒药（速效/致命/致残），背包中为武器涂抹：普通攻击必触发、近战技能 60% 几率触发，共 20 次命中机会。速效附加自然伤害，致命使目标持续中毒，致残降低目标攻击。</div>
          <div class="help-item"><b>💜 灵魂碎片（术士）</b> —— 每击败一个敌人收割 1 枚灵魂碎片（上限 20）。消耗 1 枚施放「灵魂之火」造成毁灭性伤害，消耗 3 枚召唤「地狱火」（自带嘲讽）。</div>
          <div class="help-item"><b>💾 自动存档</b> —— 进度会在<b>战斗结算、死亡复活、旅行、任务交付、旅店休息</b>等关键节点自动保存（同名同职业自动覆盖原槽位，新角色自动占用空槽，槽位被其他角色占满时不会覆盖他人存档），并每 60 秒兜底保存、关闭页面时也会保存。也可随时在旅店或存档管理中手动保存。世界界面右上角显示最近自动存档时间。</div>
        </div>`, { title: '玩法说明' });
    },

    /* ============ 角色创建 ============ */
    startCreate() {
      this.create = { faction: null, race: null, classId: null, name: '' };
      this.stepFaction();
      W.UI.showView('create');
    },

    _bindCreate() {
      const root = document.getElementById('view-create');
      root.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-act]');
        if (!btn) return;
        W.Audio.click();
        const act = btn.dataset.act;
        if (act.startsWith('faction-')) this.stepRace(act.slice(8));
        else if (act.startsWith('race-')) { this.create.race = act.slice(5); this.stepClass(); }
        else if (act.startsWith('class-')) { this.create.classId = act.slice(6); this.stepName(); }
        else if (act === 'back-faction') this.stepFaction();
        else if (act === 'back-race') this.stepRace(this.create.faction);
        else if (act === 'back-class') this.stepClass();
        else if (act === 'create') this.confirmCreate();
        else if (act === 'random-name') {
          const race = D.RACES[this.create.race];
          const names = race.names || ['阿尔萨斯', '萨尔', '吉安娜', '瓦里安', '希尔瓦娜斯', '玛法里奥', '泰兰德', '伊利丹', '格罗姆', '乌瑟尔', '凯尔萨斯', '安度因'];
          const input = document.getElementById('char-name');
          input.value = RNG.pick(names);
        }
      });
    },

    stepFaction() {
      this.create = { faction: null, race: null, classId: null, name: '' };
      const root = document.getElementById('view-create');
      const factionCard = (id, emblem, name, tagline, startZone, act) => {
        const races = Object.values(D.RACES).filter((r) => r.faction === id);
        return `
          <button class="faction-card ${id}" data-act="${act}">
            <div class="fc-emblem">${emblem}</div>
            <div class="fc-name">${name}</div>
            <div class="fc-tagline">${tagline}</div>
            <div class="fc-races">${races.map((r) => `<span class="fc-race-chip" title="${U.esc(r.name)}">${r.icon}</span>`).join('')}</div>
            <div class="fc-desc">${races.map((r) => U.esc(r.name)).join(' · ')}</div>
            <div class="fc-zone">📍 起始之地：${startZone}</div>
            <div class="fc-go">选择${name} →</div>
          </button>`;
      };
      root.innerHTML = `
        <div class="create-step-title">选择你的阵营</div>
        <div class="faction-pick">
          ${factionCard('alliance', '🦁', '联盟', '为圣光与荣耀而战', '艾尔文森林', 'faction-alliance')}
          ${factionCard('horde', '🐺', '部落', '鲜血与荣耀', '杜隆塔尔', 'faction-horde')}
        </div>`;
    },

    stepRace(faction) {
      this.create.faction = faction;
      const root = document.getElementById('view-create');
      const races = Object.values(D.RACES).filter((r) => r.faction === faction);
      const factionCN = faction === 'alliance' ? '联盟' : '部落';
      let html = `
        <div class="create-step-title">选择你的种族 · <b class="fc-${faction}">${factionCN}</b></div>
        <div class="race-pick pick-${faction}">
          ${races.map((r) => `
            <button class="race-card" data-act="race-${r.id}">
              <span class="rc-badge">${r.icon}</span>
              <span class="rc-name">${U.esc(r.name)}</span>
              <span class="rc-en">${r.en}</span>
              <span class="rc-classes" title="可玩职业">${r.classes.map((cid) => D.CLASSES[cid] ? `<span class="rc-class" title="${U.esc(D.CLASSES[cid].name)}">${D.CLASSES[cid].icon}</span>` : '').join('')}</span>
              <span class="rc-traits">${r.traits.map((t) => t.name).join(' · ')}</span>
            </button>`).join('')}
        </div>
        <button class="btn ghost back-btn" data-act="back-faction">← 返回选择阵营</button>`;
      root.innerHTML = html;
      // 悬停显示详情（触屏设备改为首次点击显示详情，再次点击进入下一步）
      root.querySelectorAll('.race-card').forEach((card) => {
        const showDetail = () => {
          const r = D.RACES[card.dataset.act.slice(5)];
          const tip = document.getElementById('race-detail');
          if (tip) {
            tip.innerHTML = `<b>${U.esc(r.name)}</b> <span class="tag ${faction === 'alliance' ? 'ally-tag' : 'horde-tag'}">${factionCN}</span> — ${U.esc(r.desc)}<br>${r.traits.map((t) => `· ${U.esc(t.name)}：${U.esc(t.desc)}`).join('<br>')}`;
          }
        };
        card.addEventListener('mouseenter', showDetail);
        card.addEventListener('click', (e) => {
          // 仅触屏(无悬停):首次点击停在详情,避免直接跳转
          const coarse = window.matchMedia && window.matchMedia('(hover: none)').matches;
          if (coarse && !card.dataset.seen) {
            e.stopPropagation();
            card.dataset.seen = '1';
            showDetail();
          }
        });
      });
      const coarse = window.matchMedia && window.matchMedia('(hover: none)').matches;
      const desc = U.el('div', 'race-detail', (coarse ? '点击卡片查看详情，再点一次即可选择' : '将鼠标悬停在种族上查看详情') + ` · ${factionCN}`);
      desc.id = 'race-detail';
      root.appendChild(desc);
    },

    stepClass() {
      const root = document.getElementById('view-create');
      const race = D.RACES[this.create.race];
      const classes = race.classes.map((id) => D.CLASSES[id]);
      // 职责徽章配色(按角色关键词归类)
      const roleColor = { 近战: '#e67e22', 远程: '#3498db', 治疗: '#27ae60', 元素: '#9b59b6', 暗影: '#7d3fbf', 变形: '#16a085' };
      let html = `
        <div class="create-step-title">选择你的职业 · <b>${U.esc(race.name)}</b><span class="tag cls-count">可玩 ${classes.length} 个</span></div>
        <div class="class-pick">
          ${classes.map((c) => {
            const rc = roleColor[String(c.role).split('·')[0].trim()] || '#8a8a8a';
            return `
            <button class="class-card" data-act="class-${c.id}" style="--c1:${c.colors[0]};--c2:${c.colors[1]}">
              <span class="cc-icon">${c.icon}</span>
              <span class="cc-name">${U.esc(c.name)}</span>
              <span class="cc-role" style="background:${rc}">${U.esc(c.role)}</span>
              <span class="cc-desc">${U.esc(c.desc)}</span>
            </button>`;
          }).join('')}
        </div>
        <button class="btn ghost back-btn" data-act="back-race">← 返回选择种族</button>`;
      root.innerHTML = html;
    },

    stepName() {
      const root = document.getElementById('view-create');
      const race = D.RACES[this.create.race];
      const cls = D.CLASSES[this.create.classId];
      root.innerHTML = `
        <div class="create-step-title">为你的人类英雄命名</div>
        <div class="name-pick">
          <div class="name-summary">${race.icon} <b>${U.esc(race.name)}</b> · ${cls.icon} <b>${U.esc(cls.name)}</b></div>
          <input id="char-name" class="name-input" maxlength="12" placeholder="输入英雄的名字…" autocomplete="off">
          <div class="modal-actions">
            <button class="btn gold big" data-act="create">⚔️ 创建英雄</button>
            <button class="btn ghost" data-act="random-name">🎲 随机名字</button>
            <button class="btn ghost" data-act="back-class">← 返回</button>
          </div>
        </div>`;
      document.getElementById('char-name').focus();
      document.getElementById('char-name').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.confirmCreate();
      });
    },

    confirmCreate() {
      const input = document.getElementById('char-name');
      const name = (input ? input.value : '').trim();
      if (name.length < 2) { W.UI.toast('名字至少 2 个字符', 'warn'); return; }
      this.create.name = name;
      const char = W.Char.create(name, this.create.race, this.create.classId);
      W.State.newCharacter(char);
      W.Audio.levelup();
      W.UI.toast(`欢迎来到艾泽拉斯，${name}！`, 'ok');
      W.World.showWorld();
    },

    /* ============ 设置 ============ */
    _bindSettings() {
      document.getElementById('modal-root').addEventListener('click', (e) => {
        // 战斗结算等锁定弹窗(data-lock)不可通过点击遮罩关闭,避免游戏卡死
        const locked = document.querySelector('#modal-root .modal[data-lock]');
        if (e.target.classList.contains('modal-mask') && !locked) W.UI.closeModal();
      });
    },
  };

  const RNG = W.RNG;
  W.Main = Main;

  /* 启动 */
  document.addEventListener('DOMContentLoaded', () => {
    W.BattleView.init();
    W.World.init();
    Main.init();
    // 自动存档:周期兜底(商店/锻造/天赋等操作也会被定期捕获;战斗中跳过,避免保存瞬时状态) + 关闭页面保存
    W.State._autoTimer = setInterval(() => {
      const b = W.Combat && W.Combat.battle;
      if (!b || b.ended) W.State.autoSave();
    }, C.AUTO_SAVE_PERIOD * 1000);
    window.addEventListener('beforeunload', () => W.State.autoSave(true));
  });
})();
