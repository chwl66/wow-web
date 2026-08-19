/* DOM 流程测试:用 jsdom 真实执行 UI 代码路径(node test-dom.js) */
'use strict';
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

let failed = 0;
function check(name, cond, extra) {
  if (cond) console.log('  ✅ ' + name);
  else { failed++; console.log('  ❌ ' + name + (extra ? ' — ' + extra : '')); }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async function main() {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const dom = new JSDOM(html, { runScripts: 'outside-only', pretendToBeVisual: true, url: 'http://localhost/' });
  const { window } = dom;
  const doc = window.document;

  // 确定性随机数
  let seed = 20260810;
  const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

  // 按序加载脚本
  const jsFiles = ['ns.js', 'data-races.js', 'data-world.js', 'data-talents.js', 'engine.js', 'character.js', 'combat.js', 'battle.js', 'world.js', 'main.js'];
  for (const f of jsFiles) {
    const code = fs.readFileSync(path.join(__dirname, 'js', f), 'utf8');
    window.eval(code);
  }
  const W = window.WOW;
  const D = W.Data;
  // 注入确定性 RNG
  W.RNG.rand = rnd;
  W.RNG.int = (a, b) => Math.floor(rnd() * (b - a + 1)) + a;
  W.RNG.chance = (p) => rnd() < p;
  W.RNG.pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  W.RNG.weighted = (items) => {
    const total = items.reduce((s, [w]) => s + w, 0);
    let r = rnd() * total;
    for (const [w, v] of items) { r -= w; if (r <= 0) return v; }
    return items[items.length - 1][1];
  };
  // 加速战斗延迟
  W.Utils.delay = () => Promise.resolve();
  // jsdom 无 PointerEvent:用 MouseEvent 顶替,让滑动绑定走 Pointer 路径(真实浏览器原生支持)
  window.PointerEvent = window.MouseEvent;

  // 手动触发初始化
  doc.dispatchEvent(new window.Event('DOMContentLoaded'));

  const click = (sel) => {
    const el = doc.querySelector(sel);
    if (!el) { console.log('  ⚠ 找不到元素 ' + sel); return false; }
    el.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
    return true;
  };
  // 智能自动战斗:优先 AOE/强力技能
  const clickBestSkill = () => {
    const alive = doc.querySelectorAll('.enemy-card:not(.dead)').length;
    const pick = (id) => {
      const btn = doc.querySelector('.skill-btn[data-skill="' + id + '"]');
      if (btn && !btn.disabled) { btn.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); return true; }
      return false;
    };
    if (alive >= 2 && pick('whirlwind')) return;
    if (pick('mortal_strike')) return;
    if (pick('heroic_strike')) return;
    const any = doc.querySelector('.skill-btn[data-skill]:not(:disabled)');
    if (any) any.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    else click('[data-act="attack"]');
  };
  const text = (sel) => { const el = doc.querySelector(sel); return el ? el.textContent.trim() : ''; };

  console.log('== 标题画面 ==');
  check('标题可见', doc.getElementById('view-title').classList.contains('active'));
  check('显示 WOW 标志', text('.wow-logo').length > 0);

  console.log('== 角色创建流程 ==');
  click('[data-act="new"]');
  check('阵营选择页', text('.create-step-title').includes('阵营'));
  check('阵营卡种族预览图标(8个)', doc.querySelectorAll('.faction-card .fc-race-chip').length === 8);
  check('阵营卡带主题色(联盟/部落)', !!doc.querySelector('.faction-card.alliance') && !!doc.querySelector('.faction-card.horde'));
  check('阵营卡 CTA 文案', !!doc.querySelector('.faction-card .fc-go'));
  click('[data-act="faction-alliance"]');
  check('种族选择页', text('.create-step-title').includes('种族'));
  check('种族卡带可玩职业图标', doc.querySelectorAll('.race-card .rc-class').length >= 12);
  check('种族卡带阵营描边', !!doc.querySelector('.pick-alliance .race-card'));
  click('[data-act="race-human"]');
  check('职业选择页', text('.create-step-title').includes('职业'));
  check('职业卡带职责徽章', doc.querySelectorAll('.class-card .cc-role').length >= 5);
  check('职业可玩数角标', text('.create-step-title').includes('可玩'));
  click('[data-act="class-mage"]');
  check('命名页', !!doc.getElementById('char-name'));
  doc.getElementById('char-name').value = '吉安娜';
  click('[data-act="create"]');
  check('进入世界界面', doc.getElementById('view-world').classList.contains('active'));
  check('头部显示角色名', text('.wh-name').includes('吉安娜'));
  check('显示区域名', text('.zone-name').includes('艾尔文森林'));
  check('显示探索按钮', text('.zone-actions').includes('外出探索'));
  check('探索主按钮通栏(explore-btn)', !!doc.querySelector('.zone-actions .explore-btn'));
  check('功能按钮四宫格(商人/旅店/任务/旅行)', doc.querySelectorAll('.zone-actions .util-btn').length === 4);
  check('商人按钮主题色描边', !!doc.querySelector('.zone-actions .act-shop'));
  check('世界界面显示自动存档指示器', !!doc.querySelector('.wh-save'));

  console.log('== 世界界面操作 ==');
  // 任务板
  click('[data-act="quests"]');
  check('任务板打开', text('.modal-title').includes('任务板'));
  check('任务板统计头部', !!doc.querySelector('.quest-head'));
  const accept = doc.querySelector('[data-accept]');
  if (accept) { accept.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); check('接取任务', W.State.character.quests['q_boar'] != null); }
  click('.close-x');
  // 商店
  click('[data-act="shop"]');
  check('商店打开', text('.modal-title').includes('商店'));
  check('商店头部摘要(店名+金币)', !!doc.querySelector('.shop-head') && text('.shop-head').includes('金币'));
  click('.close-x');
  // 旅店(仅休息恢复,已移除保存进度按钮)
  click('[data-act="inn"]');
  check('旅店打开', text('.modal-title').includes('旅店'));
  check('旅店状态卡渲染', doc.querySelectorAll('.inn-stat').length >= 2);
  check('旅店无保存进度按钮', !doc.querySelector('[data-save]'));
  const rest = doc.querySelector('[data-rest]');
  rest.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  check('旅店恢复', W.State.character.hp >= W.State.character.hpMax);
  click('.close-x');

  console.log('== 探索与战斗 ==');
  // 强制遇怪(override encounter chance via seeded rnd -> 使用随机也可能不遇怪,这里直接调用内部战斗)
  const char = W.State.character;
  const invBefore = W.Char.Inventory.list(char).length;
  char.zone = 'elwynn';
  W.World.showWorld();
  // 直接触发探索(若未遇怪则重试,最多 5 次)
  let inBattle = false;
  for (let i = 0; i < 5 && !inBattle; i++) {
    W.World.explore();
    inBattle = doc.getElementById('view-battle').classList.contains('active');
    if (!inBattle) { await sleep(10); W.World.showWorld(); }
  }
  check('进入战斗界面', inBattle);
  const b = W.Combat.battle;
  check('战斗初始化', !!b && b.enemies.length > 0);
  check('敌方卡牌渲染', doc.querySelectorAll('.enemy-card').length === b.enemies.length);
  check('技能栏有按钮', doc.querySelectorAll('.skill-bar .skill-btn').length >= 3);

  // 点第一个技能
  const skillBtn = doc.querySelector('.skill-btn[data-skill]');
  const before = doc.querySelectorAll('.log-line').length;
  if (skillBtn) {
    skillBtn.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    await sleep(60);
    check('点击技能后日志增加', doc.querySelectorAll('.log-line').length > before);
  } else {
    check('有技能按钮可点', false);
  }
  // 战斗推进(自动点击可用技能直到结束,最多 50 轮)
  let guard = 0;
  while (!b.ended && guard++ < 50) {
    const btn = doc.querySelector('.skill-btn[data-skill]:not(:disabled)') || doc.querySelector('[data-act="attack"]');
    if (!btn) break;
    btn.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    await sleep(30);
  }
  check('战斗正常结算', b.ended, 'ended=' + b.ended);
  console.log(`  战斗结果: ${b.victory ? '胜利 ✅' : '失败/逃跑'} ${b.round} 回合`);

  console.log('== 战斗结算弹窗 ==');
  await sleep(500);
  if (b.victory) {
    check('胜利弹窗出现', doc.getElementById('modal-root').classList.contains('show'));
    // 回归:结算弹窗锁定,点击遮罩不会关闭(避免卡在战斗界面)
    check('结算弹窗锁定(data-lock)', !!doc.querySelector('#modal-root .modal[data-lock]'));
    const mask = doc.querySelector('.modal-mask');
    if (mask) mask.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    await sleep(80);
    check('点击遮罩后结算弹窗仍显示', doc.getElementById('modal-root').classList.contains('show'));
    // 掉落展示:只要战斗后背包变多,结算弹窗就应显示拾取行(与具体随机结果解耦)
    const invAfter = W.Char.Inventory.list(W.State.character).length;
    if (invAfter > invBefore) {
      check('结算弹窗显示掉落物品', text('.modal-body').includes('拾取'));
      check('掉落数量与拾取行一致', (b.rewards.drops || []).length >= invAfter - invBefore);
    } else {
      check('本场无掉落(跳过展示校验)', true);
    }
    // 自动存档:战斗胜利后按角色自动写入存档槽
    check('战斗胜利后自动存档(吉安娜)', W.State.saveSlots.some((e) => e && e.name === '吉安娜'),
      `slots=${JSON.stringify(W.State.saveSlots.map((s) => s && s.name))}`);
    const cont = doc.querySelector('[data-continue]');
    if (cont) cont.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    await sleep(50);
    check('返回世界界面', doc.getElementById('view-world').classList.contains('active'));
    check('返回后指示器显示保存时间', !text('.wh-save').includes('—'));
  }

  console.log('== 战斗卷轴(免费不占回合) + 战后回血 ==');
  {
    const sc = W.Char.create('卷轴师', 'human', 'mage');
    sc.level = 10;
    sc.inventory.push({ id: 's_force', count: 2 }, { id: 's_spirit', count: 1 });
    const scc = W.Char.computed(sc);
    sc.hp = Math.floor(scc.hpMax * 0.45); sc.hpMax = scc.hpMax; sc.mana = scc.manaMax; sc.manaMax = scc.manaMax;
    W.State.newCharacter(sc);
    W.World.showWorld();
    W.BattleView.start({ enemies: [D.MONSTERS.elwynn_boar], name: '测试遭遇' }, {});
    check('卷轴栏渲染(力量/生命)', !!doc.querySelector('[data-scroll="s_force"]') && !!doc.querySelector('[data-scroll="s_spirit"]'));
    const sb = W.Combat.battle;
    const round0 = sb.round;
    click('[data-scroll="s_force"]');
    await sleep(80);
    check('力量卷轴:不占回合+祝福生效', sb.round === round0 && !sb.ended && sb.player.buffs.some((x) => x.key === 'sc_atk') && W.Char.Inventory.count(sc, 's_force') === 1);
    click('[data-scroll="s_spirit"]');
    await sleep(80);
    check('生命卷轴:立即恢复+不占回合', sb.round === round0 && W.Char.Inventory.count(sc, 's_spirit') === 0);
    let g = 0;
    while (!sb.ended && g++ < 60) {
      const btn = doc.querySelector('.skill-btn[data-skill]:not(:disabled)') || doc.querySelector('[data-act="attack"]');
      if (!btn) break;
      btn.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
      await sleep(30);
    }
    check('卷轴战斗正常胜利', sb.ended && sb.victory);
    await sleep(500);
    if (sb.victory) {
      check('战后回血提示(恢复生命)', text('.modal-body').includes('战后休整') && text('.modal-body').includes('恢复'), text('.modal-body').slice(0, 120));
      const cont = doc.querySelector('[data-continue]');
      if (cont) cont.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
      await sleep(60);
    }
  }

  console.log('== 战斗药水(免费不占回合+冷却) ==');
  {
    const pc = W.Char.create('药水师', 'human', 'mage');
    pc.level = 12;
    pc.inventory.push({ id: 'c_heal', count: 3 }, { id: 'c_mana', count: 2 }, { id: 's_force', count: 1 });
    const pcc = W.Char.computed(pc);
    pc.hp = Math.floor(pcc.hpMax * 0.4); pc.hpMax = pcc.hpMax; pc.mana = pcc.manaMax; pc.manaMax = pcc.manaMax;
    W.State.newCharacter(pc);
    W.World.showWorld();
    W.BattleView.start({ enemies: [D.MONSTERS.elwynn_boar], name: '测试遭遇' }, {});
    check('药水按钮渲染(战斗道具栏)', !!doc.querySelector('[data-potion="c_heal"]') && !!doc.querySelector('[data-potion="c_mana"]'));
    const pb = W.Combat.battle;
    const pr0 = pb.round;
    const hp0 = pb.player.hp;
    click('[data-potion="c_heal"]');
    await sleep(80);
    check('点击药水:恢复生命+不占回合', pb.player.hp > hp0 && pb.round === pr0 && W.Char.Inventory.count(pc, 'c_heal') === 2);
    const potionBtn = doc.querySelector('[data-potion="c_heal"]');
    check('药水按钮冷却期禁用', !!potionBtn && potionBtn.disabled === true);
    check('药水与卷轴共存于战斗道具栏', !!doc.querySelector('[data-potion="c_heal"]') && !!doc.querySelector('[data-scroll="s_force"]'));
  }

  console.log('== 战斗道具栏折叠 ==');
  {
    try { localStorage.removeItem('wow_battle_items_collapsed'); } catch (e) {}
    W.BattleView._itemsCollapsed = false;
    const fc = W.Char.create('折叠师', 'human', 'mage');
    fc.level = 12;
    fc.inventory.push({ id: 'c_heal', count: 2 }, { id: 's_force', count: 1 });
    const fcc = W.Char.computed(fc);
    fc.hp = Math.floor(fcc.hpMax * 0.5); fc.hpMax = fcc.hpMax; fc.mana = fcc.manaMax; fc.manaMax = fcc.manaMax;
    W.State.newCharacter(fc);
    W.World.showWorld();
    W.BattleView.start({ enemies: [D.MONSTERS.elwynn_boar], name: '测试遭遇' }, {});
    const bar = doc.querySelector('.scroll-bar');
    check('折叠开关渲染', !!doc.querySelector('[data-toggle-items]'));
    check('默认展开(按钮可见)', !!doc.querySelector('[data-potion="c_heal"]') && !bar.classList.contains('collapsed'));
    click('[data-toggle-items]');
    await sleep(60);
    check('点击折叠:栏收起(按钮由CSS隐藏)', bar.classList.contains('collapsed'));
    click('[data-toggle-items]');
    await sleep(60);
    check('再点击展开:栏展开(按钮恢复)', !bar.classList.contains('collapsed') && !!doc.querySelector('[data-potion="c_heal"]'));
    try { localStorage.removeItem('wow_battle_items_collapsed'); } catch (e) {}
  }

  console.log('== 折叠态药水快捷键急救 ==');
  {
    try { localStorage.removeItem('wow_battle_items_collapsed'); } catch (e) {}
    W.BattleView._itemsCollapsed = false;
    const kc = W.Char.create('急救师', 'human', 'mage');
    kc.level = 12;
    kc.inventory.push({ id: 'c_heal', count: 2 }, { id: 'c_mana', count: 1 });
    const kcc = W.Char.computed(kc);
    kc.hp = Math.floor(kcc.hpMax * 0.4); kc.hpMax = kcc.hpMax; kc.mana = kcc.manaMax; kc.manaMax = kcc.manaMax;
    W.State.newCharacter(kc);
    W.World.showWorld();
    W.BattleView.init(); // jsdom 中 DOMContentLoaded 已提前触发,需手动绑定快捷键
    W.BattleView.start({ enemies: [D.MONSTERS.elwynn_boar], name: '测试遭遇' }, {});
    const bar = doc.querySelector('.scroll-bar');
    click('[data-toggle-items]');
    await sleep(60);
    check('折叠态渲染迷你急救按钮(带键位)', !!doc.querySelector('.mini-potion[data-hk="Q"]') && !!doc.querySelector('.mini-potion[data-hk="E"]'));
    check('折叠态隐藏卷轴按钮', !doc.querySelector('[data-scroll]'));
    const eBtn = doc.querySelector('.mini-potion[data-hk="E"]');
    check('E 键映射次强药水(面包)', eBtn && eBtn.dataset.potion === 'c_bread');
    const rBtn = doc.querySelector('.mini-potion[data-hk="R"]');
    check('R 键映射法力药水(按回复量降序)', rBtn && rBtn.dataset.potion === 'c_mana');

    const kb = W.Combat.battle;
    const kround = kb.round;
    const khp0 = kb.player.hp;
    doc.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'q', bubbles: true }));
    await sleep(80);
    check('按 Q 键一键喝药(恢复+不占回合)', kb.player.hp > khp0 && kb.round === kround && W.Char.Inventory.count(kc, 'c_heal') === 1);
    const khp1 = kb.player.hp;
    doc.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'q', bubbles: true }));
    await sleep(80);
    check('冷却期按 Q 无效且不消耗', kb.player.hp === khp1 && W.Char.Inventory.count(kc, 'c_heal') === 1);
    try { localStorage.removeItem('wow_battle_items_collapsed'); } catch (e) {}
  }

  console.log('== 设置面板(UI 偏好同步) ==');
  {
    const LS = window.localStorage;
    try { LS.removeItem('wow_battle_items_collapsed'); LS.removeItem('wow_sound_muted'); } catch (e) {}
    W.BattleView._itemsCollapsed = false;
    W.Audio.muted = false;
    const sc = W.Char.create('设置师', 'human', 'warrior');
    sc.level = 10;
    W.State.newCharacter(sc);
    W.World.showWorld();
    W.World.openSettings();
    const swColl = doc.querySelector('[data-set="itemsCollapsed"]');
    const swSnd = doc.querySelector('[data-set="sound"]');
        check('设置面板渲染 2 个偏好开关', !!swColl && !!swSnd);
    check('折叠开关默认关闭(展开态)', swColl && !swColl.classList.contains('on'));
    check('音效开关默认开启', swSnd && swSnd.classList.contains('on'));
    click('[data-set="itemsCollapsed"]');
    check('点击折叠开关:翻转开启', swColl.classList.contains('on'));
    check('点击折叠开关:BattleView 同步', W.BattleView._itemsCollapsed === true);
    check('点击折叠开关:localStorage 持久化', LS.getItem('wow_battle_items_collapsed') === '1');
    // 反向:外部(战斗内折叠开关)改动 → 重开面板反映
    W.BattleView._itemsCollapsed = false;
    try { LS.setItem('wow_battle_items_collapsed', '0'); } catch (e) {}
    W.World.openSettings();
    check('重开面板:开关反映外部状态', !doc.querySelector('[data-set="itemsCollapsed"]').classList.contains('on'));
    click('[data-set="sound"]');
    check('点击音效开关:Audio 静音', W.Audio.muted === true);
    check('点击音效开关:localStorage 持久化', LS.getItem('wow_sound_muted') === '1');
    check('点击音效开关:开关翻转关闭', !doc.querySelector('[data-set="sound"]').classList.contains('on'));
    try { LS.removeItem('wow_battle_items_collapsed'); LS.removeItem('wow_sound_muted'); } catch (e) {}
  }
  console.log('== 存档 ==');
  W.World.openSave();
  check('存档界面显示自动来源标签', !!doc.querySelector('.save-src-auto'));
  check('存档界面显示进度摘要(金币/位置)', text('.save-meta').includes('金币'));
  const sv = doc.querySelector('[data-save]');
  if (sv) sv.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  check('存档成功', W.State.saveSlots.some(Boolean));
  check('手动保存后显示手动来源标签', !!doc.querySelector('.save-src-manual'));
  click('.close-x');

  console.log('== 天赋界面 ==');
  {
    const tc = W.Char.create('天赋测试', 'human', 'mage');
    tc.level = 12;
    const cc = W.Char.computed(tc);
    tc.hp = cc.hpMax; tc.hpMax = cc.hpMax; tc.mana = cc.manaMax; tc.manaMax = cc.manaMax;
    W.State.newCharacter(tc);
    W.World.showWorld();
    click('[data-act="talents"]');
    check('天赋弹窗打开', text('.modal-title').includes('天赋'));
    check('显示可用天赋点(12级=3点)', text('.talent-points').includes('3'));
    check('三系标签渲染', doc.querySelectorAll('.talent-tab').length === 3);
    const fireTab = doc.querySelector('.talent-tab[data-tree="fire"]');
    check('火焰系标签存在', !!fireTab);
    fireTab.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    const node = doc.querySelector('.talent-node[data-talent="m_fire_fireball"]');
    check('天赋节点渲染', !!node);
    check('火焰系两个主动天赋节点', doc.querySelectorAll('.talent-node.is-active').length === 2);
    node.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    check('学习后天赋点-1', text('.talent-points').includes('2'));
    check('角色等级记录', W.Char.rankOf(tc, 'fire', 'm_fire_fireball') === 1);
    const locked = doc.querySelector('.talent-node[data-talent="m_fire_impact"]');
    check('第2层节点存在', !!locked);
    locked.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    check('锁定层无法学习', W.Char.rankOf(tc, 'fire', 'm_fire_impact') === 0);
    node.dispatchEvent(new window.MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
    check('右键卸载成功', W.Char.rankOf(tc, 'fire', 'm_fire_fireball') === 0 && text('.talent-points').includes('3'));
    click('.close-x');
    check('关闭天赋弹窗', !doc.getElementById('modal-root').classList.contains('show'));

    // 推荐搭配面板与一键分配
    click('[data-act="talents"]');
    const fb2 = doc.querySelector('.talent-tab[data-tree="fire"]');
    if (fb2) fb2.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    check('推荐搭配面板渲染', doc.querySelectorAll('.build-row').length === 2);
    const applyBtn = doc.querySelector('[data-apply="0"]');
    check('一键分配按钮存在', !!applyBtn);
    if (applyBtn) {
      applyBtn.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
      check('一键分配后已分配3/3点', text('.talent-points').includes('已分配 3/3'));
      check('强化火球术获得3级', W.Char.rankOf(tc, 'fire', 'm_fire_fireball') === 3);
    }
    click('.close-x');
  }

  console.log('== 副本流程(死亡矿井) ==');
  {
    // 新建一个 18 级满装备战士直接进入副本
    const dc = W.Char.create('矿洞杀手', 'human', 'warrior');
    dc.level = 18;
    dc.equipment = {
      weapon: 'vancleef_fang', offhand: null, head: 'a_helm', chest: 'a_blue', gloves: 'a_gloves',
      legs: 'a_legs', boots: 'a_boots', cloak: 'a_cloak', neck: 'a_neck', ring1: 'a_ring', ring2: 'a_ring',
    };
    const cc = W.Char.computed(dc);
    dc.hp = cc.hpMax; dc.hpMax = cc.hpMax; dc.mana = cc.manaMax; dc.manaMax = cc.manaMax;
    for (const sid of D.CLASSES.warrior.skills) {
      const s = D.SKILLS[sid];
      if (s && s.learn <= dc.level && !dc.learnedSkills.includes(sid)) dc.learnedSkills.push(sid);
    }
    W.State.newCharacter(dc);
    dc.zone = 'deadmines';
    dc.dungeon = { id: 'deadmines', wave: 0 };
    W.World.showWorld();
    check('副本区域显示', text('.zone-name').includes('死亡矿井'));
    check('副本内仅深入/任务板/离开按钮', !!doc.querySelector('.zone-actions .explore-btn')
      && !doc.querySelector('.zone-actions .act-shop') && !doc.querySelector('.zone-actions .act-inn')
      && !!doc.querySelector('.zone-actions .act-quests') && text('.zone-actions').includes('离开副本'));
    // 副本手册 / 战前预览
    check('战前预览显示最终首领', text('.dungeon-preview').includes('范克里夫'));
    check('副本手册按钮存在', !!doc.querySelector('.zone-actions .act-manual'));
    W.World.openDungeonManual();
    check('手册弹窗显示副本名', text('.dm-manual').includes('死亡矿井'));
    const dmWaves = D.DUNGEONS.deadmines.waves.length;
    check('手册弹窗逐波展示敌人(含中途首领)', doc.querySelectorAll('.dm-wave').length === dmWaves, 'waves=' + doc.querySelectorAll('.dm-wave').length);
    check('手册弹窗首领技能详解', text('.dm-manual').includes('撕咬') || text('.dm-manual').includes('召唤'));
    check('手册弹窗展示范克里夫独特机制', text('.dm-manual').includes('双刀乱舞') && text('.dm-manual').includes('独特机制'));
    click('.close-x');
    // 战前预览包含新独特技能
    check('战前预览含双刀乱舞', text('.dungeon-preview').includes('双刀乱舞'));
    W.World.openQuestBoard();
    check('副本任务板显示副本任务(死亡矿井的覆灭)', text('.modal-body').includes('死亡矿井的覆灭'));
    click('.close-x');
    let cleared = false, lost = false;
    for (let wave = 0; wave < dmWaves && !lost; wave++) {
      W.World._dungeonNext();
      check(`副本第 ${wave + 1} 波进入战斗`, doc.getElementById('view-battle').classList.contains('active'));
      const bb = W.Combat.battle;
      let g = 0;
      while (!bb.ended && g++ < 80) {
        clickBestSkill();
        await sleep(20);
      }
      check(`副本第 ${wave + 1} 波胜利`, bb.victory);
      if (!bb.victory) { lost = true; break; }
      await sleep(400);
      const cont = doc.querySelector('[data-continue]');
      check(`结算弹窗出现(波${wave + 1})`, !!cont);
      // 通关弹窗文本在点击 continue 前读取(弹窗仍处于打开状态,不受 200ms 延迟清空影响)
      if (wave === dmWaves - 1) {
        cleared = true;
        check('副本通关弹窗', text('.dungeon-clear').length > 0);
        check('副本通关弹窗标注5人本', text('.dungeon-clear').includes('5人本'), text('.dungeon-clear'));
        check('通关结算成就行带5人本标记', text('.ach-done').includes('5人本'), text('.ach-done'));
        check('副本宝箱发放材料', text('.chest-row').includes('副本宝箱') && W.Char.Inventory.count(W.State.character, 'm_crystal') >= 1,
          `crystal=${W.Char.Inventory.count(W.State.character, 'm_crystal')}`);
        check('宝箱包含三种材料', W.Char.Inventory.count(W.State.character, 'm_dust') >= 2 && W.Char.Inventory.count(W.State.character, 'm_essence') >= 2);
        check('通关结算下一站提示行', text('.next-dg-row').includes('下一站') && text('.next-dg-row').includes('哀嚎洞穴'), text('.next-dg-row'));
        check('下一站一键前往按钮(哀嚎)', !!doc.querySelector('[data-ach-next-go="wailing_caverns"]'));
      }
      if (cont) cont.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
      await sleep(60);
    }
    check('副本全部通关', cleared);
    check('副本状态清除', !W.State.character.dungeon);
    // 首领图鉴:击杀记录 / 通关次数 / 最快回合
    const vc = W.State.character.codex && W.State.character.codex.vancleef;
    check('图鉴记录范克里夫击杀', !!vc && vc.kills === 1, JSON.stringify(vc));
    check('图鉴记录最快回合', !!vc && vc.fastest > 0 && vc.fastest <= 80, vc ? 'fastest=' + vc.fastest : 'no entry');
    check('图鉴累计击杀 5 次(4 中途首领+最终首领)', W.Char.Codex.totalKills(W.State.character) === 5,
      'total=' + W.Char.Codex.totalKills(W.State.character));
    check('中途首领已记录图鉴(拉克佐尔)', !!W.State.character.codex.rhahkzor && W.State.character.codex.rhahkzor.kills === 1);
    W.World.openCodex();
    check('图鉴面板显示范克里夫', text('.codex-panel').includes('范克里夫'));
    check('图鉴面板显示击杀次数', text('.codex-panel').includes('1 次'));
    check('图鉴面板显示未击杀首领', text('.codex-panel').includes('拉格纳罗斯') && text('.codex-panel').includes('未击杀'));
    click('.close-x');
  }

  console.log('== 通关后一键前往下一副本 ==');
  {
    const gn = W.Char.create('赶路侠', 'human', 'warrior');
    gn.level = 20;
    gn.zone = 'deadmines';
    gn.dungeon = { id: 'deadmines', wave: D.DUNGEONS.deadmines.waves.length - 1 };
    W.State.newCharacter(gn);
    W.World.showWorld();
    // 直接构造通关结算(最后一波胜利)
    W.World.onBattleVictory({ context: 'dungeon', round: 12, rewards: { xp: 300, gold: 500, drops: [] } });
    const goBtn = doc.querySelector('[data-ach-next-go]');
    check('通关结算弹窗含下一站按钮', !!goBtn);
    check('下一站为目标副本(哀嚎洞穴)', !!goBtn && goBtn.dataset.achNextGo === 'wailing_caverns', goBtn ? goBtn.dataset.achNextGo : '无');
    check('下一站行含推荐等级角标', !!goBtn && text('.next-dg-row').includes('Lv.13'), text('.next-dg-row'));
    if (goBtn) {
      goBtn.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
      check('点击一键前往传送并进入副本', W.State.character.zone === 'wailing_caverns' && W.State.character.dungeon && W.State.character.dungeon.id === 'wailing_caverns',
        W.State.character.zone + '/' + JSON.stringify(W.State.character.dungeon));
      check('一键前往后结算弹窗关闭', !doc.getElementById('modal-root').classList.contains('show'));
      check('一键前往后进入副本世界视图', doc.getElementById('view-world').classList.contains('active'));
    }
  }

  console.log('== 跨阵营地图连通性 ==');
  {
    // 联盟:荆棘谷乘船→贫瘠之地→奥格瑞玛(跨大陆航线)
    const allyT = W.Char.create('联盟旅者', 'human', 'warrior');
    allyT.level = 25;
    allyT.zone = 'stv';
    W.State.newCharacter(allyT);
    W.World.showWorld();
    W.World.openTravel();
    const barRow = doc.querySelector('.travel-row[data-zone="barrens"]');
    check('联盟在荆棘谷可见贫瘠之地(商船航线)', !!barRow);
    check('商船直连航线标注🚀直达', !!barRow && text('.travel-row[data-zone="barrens"]').includes('🚀 直达'));
    check('中立区域无阵营标签', !!barRow && !/联盟|部落/.test(barRow.textContent), barRow ? barRow.textContent : '无');
    if (barRow) {
      barRow.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
      check('联盟乘船抵达贫瘠之地', W.State.character.zone === 'barrens', W.State.character.zone);
      W.World.openTravel();
      const ogRow = doc.querySelector('.travel-row[data-zone="orgrimmar"]');
      check('联盟可继续前往奥格瑞玛', !!ogRow);
      if (ogRow) {
        ogRow.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
        check('联盟抵达部落主城奥格瑞玛', W.State.character.zone === 'orgrimmar', W.State.character.zone);
      }
    }
    // 部落反向:贫瘠之地乘船→荆棘谷
    const hordeT = W.Char.create('部落旅者', 'orc', 'warrior');
    hordeT.level = 25;
    hordeT.zone = 'barrens';
    W.State.newCharacter(hordeT);
    W.World.showWorld();
    W.World.openTravel();
    const stvRow = doc.querySelector('.travel-row[data-zone="stv"]');
    check('部落在贫瘠之地可见荆棘谷', !!stvRow);
    if (stvRow) {
      stvRow.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
      check('部落乘船抵达荆棘谷', W.State.character.zone === 'stv', W.State.character.zone);
    }
    // 联盟深入部落侧区域(千针石林→尘泥沼泽)
    const allyD = W.Char.create('联盟副本旅', 'human', 'warrior');
    allyD.level = 40;
    allyD.zone = 'thousand_needles';
    W.State.newCharacter(allyD);
    W.World.showWorld();
    W.World.openTravel();
    check('联盟到达部落侧区域(尘泥沼泽)', !!doc.querySelector('.travel-row[data-zone="dustwallow"]'));
    const dwRow = doc.querySelector('.travel-row[data-zone="dustwallow"]');
    if (dwRow) {
      dwRow.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
      check('联盟抵达尘泥沼泽(可进黑暗深渊)', W.State.character.zone === 'dustwallow', W.State.character.zone);
    }
  }

  console.log('== 旅行面板:推荐等级排序与最近路径标注 ==');
  {
    const tv = W.Char.create('旅者', 'human', 'warrior');
    tv.level = 25;
    tv.zone = 'westfall'; // 直连:艾尔文/暴风城/赤脊山/死亡矿井
    W.State.newCharacter(tv);
    W.World.showWorld();
    W.World.openTravel();
    const tvRows = doc.querySelectorAll('.travel-row');
    check('旅行面板列出全图可达区域(≥45)', tvRows.length >= 45, 'rows=' + tvRows.length);
    check('提示行含直连统计与最近路径图例', /直连 \d+ 个区域/.test(text('.travel-hint')) && text('.travel-hint').includes('直达=最近路径'));
    let secs = doc.querySelectorAll('.travel-sec');
    let secD = doc.querySelector('.travel-sec.direct-sec');
    let secM = doc.querySelector('.travel-sec.map-sec');
    check('直达/中转双分区渲染', secs.length === 2 && !!secD && !!secM);
    check('直达分区标题含计数', !!secD && /🚀 直达/.test(text('.travel-sec.direct-sec .travel-sec-title')) && /\d+ 个/.test(text('.travel-sec.direct-sec .travel-sec-title')));
    check('中转分区标题含计数', !!secM && /🗺️ 中转区域/.test(text('.travel-sec.map-sec .travel-sec-title')) && /\d+ 个/.test(text('.travel-sec.map-sec .travel-sec-title')));
    const dmHop = doc.querySelector('.travel-row[data-zone="deadmines"] .tz-hop');
    check('直达区域带🚀徽标(死亡矿井)', !!dmHop && text('.travel-row[data-zone="deadmines"]').includes('🚀 直达'));
    check('直达行高亮(is-direct)', !!doc.querySelector('.travel-row.is-direct[data-zone="deadmines"]'));
    check('直达区含死亡矿井/中转区不含', !!secD.querySelector('.travel-row[data-zone="deadmines"]') && !secM.querySelector('.travel-row[data-zone="deadmines"]'));
    const stvTz = doc.querySelector('.travel-row[data-zone="stv"]');
    check('多跳区域显示站数与首站(荆棘谷)', !!stvTz && /\d+ 站/.test(text('.travel-row[data-zone="stv"]')) && text('.travel-row[data-zone="stv"]').includes('首站'));
    check('中转区含荆棘谷/直达区不含', !!secM.querySelector('.travel-row[data-zone="stv"]') && !secD.querySelector('.travel-row[data-zone="stv"]'));
    // 中转区默认折叠,点击标题展开/收起,偏好持久化
    check('中转区默认折叠(collapsed类)', !!secM && secM.classList.contains('collapsed'));
    const secTg = secM && secM.querySelector('.travel-sec-title .sec-toggle');
    check('折叠态显示▸展开提示', !!secTg && secTg.textContent.includes('▸ 展开'));
    if (secM && secTg) {
      secM.querySelector('.travel-sec-title').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
      check('点击标题展开中转区', !secM.classList.contains('collapsed') && secTg.textContent.includes('▾ 收起'));
      check('展开偏好持久化(localStorage=0)', window.localStorage.getItem('wow_travel_transit_collapsed') === '0');
      secM.querySelector('.travel-sec-title').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
      check('再次点击收起中转区', secM.classList.contains('collapsed') && secTg.textContent.includes('▸ 展开'));
      check('收起偏好持久化(localStorage=1)', window.localStorage.getItem('wow_travel_transit_collapsed') === '1');
      // 键盘操作:Enter 展开/收起(与点击等价)
      const titleEl = secM.querySelector('.travel-sec-title');
      check('中转标题带 role=button 键盘可达', titleEl.getAttribute('role') === 'button' && titleEl.getAttribute('tabindex') === '0');
      titleEl.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      check('键盘 Enter 展开中转区', !secM.classList.contains('collapsed') && secTg.textContent.includes('▾ 收起'));
      titleEl.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      check('键盘 Enter 再收起', secM.classList.contains('collapsed') && secTg.textContent.includes('▸ 展开'));
      // 清理偏好后重开面板,应恢复默认折叠(真实重渲染,而非残留状态)
      try { window.localStorage.removeItem('wow_travel_transit_collapsed'); } catch (e) {}
      click('.close-x');
      W.World.openTravel();
      secs = doc.querySelectorAll('.travel-sec');
      secD = doc.querySelector('.travel-sec.direct-sec');
      secM = doc.querySelector('.travel-sec.map-sec');
      const secTg2 = secM && secM.querySelector('.travel-sec-title .sec-toggle');
      check('清理偏好后重开面板恢复默认折叠', !!secM && secM.classList.contains('collapsed') && !!secTg2 && secTg2.textContent.includes('▸ 展开'));
    }
    const lvOk = (sec) => {
      const arr = Array.from(sec.querySelectorAll('.travel-row:not(.is-cur) .tz-level')).map((n) => {
        const m = n.textContent.match(/推荐等级\s*(\d+)/);
        return m ? parseInt(m[1], 10) : 0;
      });
      return arr.every((lv, i) => i === 0 || arr[i - 1] <= lv);
    };
    check('各分区内按推荐等级升序', secs.length === 2 && lvOk(secD) && lvOk(secM), secD ? Array.from(secD.querySelectorAll('.tz-level')).slice(0, 4).map((n) => n.textContent).join('|') : 'no-secD');
    check('当前区域置顶并标注', !!doc.querySelector('.travel-row.is-cur') && text('.travel-row.is-cur').includes('西部荒野') && text('.travel-row.is-cur').includes('已在此处'));
    // 多跳区域:点击后沿最近路径前往首站(赤脊山),而非直接瞬移
    const farStv = doc.querySelector('.travel-row[data-zone="stv"]');
    check('多跳区域动作标签为首站→', !!farStv && text('.travel-row[data-zone="stv"]').includes('首站 →'));
    if (farStv) {
      farStv.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
      await sleep(30);
      check('多跳区域点击前往首站(赤脊山)', W.State.character.zone === 'redridge', 'zone=' + W.State.character.zone);
    }
    click('.close-x');
  }

  console.log('== 直达航线(飞艇/远洋商船) ==');
  {
    // 复用既有角色名(旅者,人类战士):旅行点击触发自动存档,同名同职业覆盖原槽位,不占用新存档槽
    const fc = W.Char.create('旅者', 'human', 'warrior');
    fc.level = 30;
    fc.zone = 'stormwind';
    W.State.newCharacter(fc);
    W.World.showWorld();
    W.World.openTravel();
    const ogRow = doc.querySelector('.travel-row[data-zone="orgrimmar"]');
    check('飞艇航线徽标(暴风城→奥格瑞玛)', !!ogRow && text('.travel-row[data-zone="orgrimmar"]').includes('🚁 飞艇'));
    check('飞艇行 is-air 高亮', !!doc.querySelector('.travel-row.is-air[data-zone="orgrimmar"]'));
    check('提示行含飞艇航线计数', text('.travel-hint').includes('🚁 飞艇'));
    if (ogRow) {
      ogRow.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
      await sleep(30);
      check('乘飞艇直达奥格瑞玛', W.State.character.zone === 'orgrimmar', 'zone=' + W.State.character.zone);
    }
    // 远洋商船:西部荒野→尘泥沼泽
    fc.zone = 'westfall';
    W.World.showWorld();
    W.World.openTravel();
    const dwRow = doc.querySelector('.travel-row[data-zone="dustwallow"]');
    check('远洋商船徽标(西部荒野→尘泥沼泽)', !!dwRow && text('.travel-row[data-zone="dustwallow"]').includes('⛵ 远洋商船'));
    if (dwRow) {
      dwRow.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
      await sleep(30);
      check('乘商船直达尘泥沼泽', W.State.character.zone === 'dustwallow', 'zone=' + W.State.character.zone);
    }
  }

  console.log('== 阵营声望流程 ==');
  {
    const rc = W.Char.create('声望使者', 'human', 'warrior');
    rc.level = 20;
    rc.gold = 500000;
    const rcGoldBase = W.Char.computed(rc).goldMult;
    W.State.newCharacter(rc);
    W.World.showWorld();
    check('声望入口按钮存在', !!doc.querySelector('[data-act="rep"]'));
    W.World.openRep();
    const repTxt = text('.rep-panel');
    check('声望面板显示 5 阵营', repTxt.includes('暴风城') && repTxt.includes('奥格瑞玛') && repTxt.includes('银色黎明')
      && repTxt.includes('塞纳里奥') && repTxt.includes('瑟银兄弟会'), repTxt.slice(0, 60));
    check('声望面板初始中立', repTxt.includes('中立'));
    check('声望面板显示徽章上交区', !!doc.querySelector('.rep-badge'));
    // 徽章上交:精英掉落物换取声望
    W.Char.Inventory.add(W.State.character, 'r_badge_sw', 2);
    W.World.openRep();
    check('持有徽章时显示上交按钮', !!doc.querySelector('[data-badge="sw"]'));
    doc.querySelector('[data-badge="sw"][data-mode="all"]').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    check('全部上交后声望 +600', W.Char.Reps.value(W.State.character, 'sw') === 600
      && W.Char.Inventory.count(W.State.character, 'r_badge_sw') === 0,
      'sw=' + W.Char.Reps.value(W.State.character, 'sw'));
    W.World.openQuartermaster('sw');
    check('军需官商店含商品与锁', text('.qm-panel').includes('暴风城军马') && text('.qm-panel').includes('需要 尊敬'));
    click('.close-x');
    // 尊敬(6000):解锁精良装备
    W.Char.Reps.add(W.State.character, 'sw', 6500);
    W.World.openQuartermaster('sw');
    check('尊敬解锁精良装备', !!doc.querySelector('[data-rbuy="r_sw_sword"]')
      && !text('.qm-panel').includes('需要 尊敬'));
    const buySword = doc.querySelector('[data-rbuy="r_sw_sword"]');
    buySword.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    check('购买精良武器入包', W.Char.Inventory.count(W.State.character, 'r_sw_sword') >= 1);
    // 崇敬(12000):解锁史诗
    W.Char.Reps.add(W.State.character, 'sw', 6500);
    W.World.openQuartermaster('sw');
    check('崇敬解锁史诗装备', !!doc.querySelector('[data-rbuy="r_sw_plate"]'));
    click('.close-x');
    // 崇拜(21000):解锁坐骑
    W.Char.Reps.add(W.State.character, 'sw', 9000);
    const goldBefore = W.State.character.gold;
    W.World.openQuartermaster('sw');
    const mountBtn = doc.querySelector('[data-rbuy="r_sw_horse"]');
    check('崇拜解锁坐骑', !!mountBtn);
    mountBtn.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    check('坐骑入收藏', W.State.character.mounts.includes('r_sw_horse'));
    check('坐骑购买扣款', W.State.character.gold < goldBefore);
    check('坐骑金币加成生效', Math.abs(W.Char.computed(W.State.character).goldMult - (rcGoldBase + 0.02)) < 0.001,
      'goldMult=' + W.Char.computed(W.State.character).goldMult + ' base=' + rcGoldBase);
    W.World.openStatus();
    check('状态面板显示坐骑收藏', text('.status-grid').includes('坐骑收藏') && text('.status-grid').includes('暴风城军马'));
    click('.close-x');
  }

  console.log('== 副本流程(奥达曼) ==');
  {
    // 新建一个 38 级满装备战士,从母区域荒芜之地旅行进入奥达曼(中途首领波次延长战斗,等级略高确保稳定通关)
    const uc = W.Char.create('遗迹猎手', 'human', 'warrior');
    uc.level = 38;
    uc.equipment = {
      weapon: 'w_steam_saber', offhand: null, head: 'a_blackrock_helm', chest: 'a_badlands_plate', gloves: 'a_gloves',
      legs: 'a_searing_legs', boots: 'a_badlands_boots', cloak: 'a_stv_cloak', neck: 'a_neck', ring1: 'a_ring', ring2: 'a_ring',
    };
    const ucc = W.Char.computed(uc);
    uc.hp = ucc.hpMax; uc.hpMax = ucc.hpMax; uc.mana = ucc.manaMax; uc.manaMax = ucc.manaMax;
    for (const sid of D.CLASSES.warrior.skills) {
      const s = D.SKILLS[sid];
      if (s && s.learn <= uc.level && !uc.learnedSkills.includes(sid)) uc.learnedSkills.push(sid);
    }
    W.State.newCharacter(uc);
    check('母区域旅行含奥达曼', D.ZONES.badlands.travel.includes('uldaman'));
    uc.zone = 'uldaman';
    uc.dungeon = { id: 'uldaman', wave: 0 };
    W.World.showWorld();
    check('副本区域显示(奥达曼)', text('.zone-name').includes('奥达曼'));
    W.World.openQuestBoard();
    check('副本任务板显示(奥达曼的石板)', text('.modal-body').includes('奥达曼的石板'));
    click('.close-x');
    let cleared = false, lost = false;
    const ulWaves = D.DUNGEONS.uldaman.waves.length;
    for (let wave = 0; wave < ulWaves && !lost; wave++) {
      W.World._dungeonNext();
      check(`奥达曼第 ${wave + 1} 波进入战斗`, doc.getElementById('view-battle').classList.contains('active'));
      const bb = W.Combat.battle;
      let g = 0;
      while (!bb.ended && g++ < 100) {
        clickBestSkill();
        await sleep(15);
      }
      check(`奥达曼第 ${wave + 1} 波胜利`, bb.victory);
      if (!bb.victory) { lost = true; break; }
      await sleep(400);
      const cont = doc.querySelector('[data-continue]');
      check(`奥达曼结算弹窗出现(波${wave + 1})`, !!cont);
      if (wave === ulWaves - 1) {
        cleared = true;
        check('奥达曼通关弹窗', text('.dungeon-clear').includes('奥达曼'));
        check('奥达曼宝箱含饰品', text('.chest-row').includes('副本宝箱') && W.Char.Inventory.count(W.State.character, 'tr_ember_heart') >= 1);
        check('奥达曼宝箱含水晶', W.Char.Inventory.count(W.State.character, 'm_crystal') >= 1);
      }
      if (cont) cont.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
      await sleep(60);
    }
    check('奥达曼副本全部通关', cleared);
    check('奥达曼副本状态清除', !W.State.character.dungeon);
  }

  console.log('== 死亡与复活 ==');
  {
    const dc = W.Char.create('赴死者', 'human', 'mage');
    const cc = W.Char.computed(dc);
    dc.hp = 1; dc.hpMax = cc.hpMax; dc.mana = cc.manaMax; dc.manaMax = cc.manaMax;
    W.State.newCharacter(dc);
    dc.zone = 'elwynn';
    W.World.showWorld();
    W.BattleView.start({ enemies: [D.MONSTERS.hogger], name: '霍格' }, {});
    const bb = W.Combat.battle;
    let g = 0;
    while (!bb.ended && g++ < 30) {
      const btn = doc.querySelector('.skill-btn[data-skill]:not(:disabled)') || doc.querySelector('[data-act="attack"]');
      if (!btn) break;
      btn.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
      await sleep(20);
    }
    await sleep(400);
    check('死亡结算出现', bb.ended && !bb.victory);
    const revive = doc.querySelector('[data-continue]');
    check('复活弹窗出现', !!revive);
    if (revive) revive.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    await sleep(60);
    check('死亡后回到主城', W.State.character.zone === 'stormwind');
    check('死亡复活后自动存档(赴死者)', W.State.saveSlots.some((e) => e && e.name === '赴死者'),
      `slots=${JSON.stringify(W.State.saveSlots.map((s) => s && s.name))}`);
    check('复活后生命>0', W.State.character.hp > 0);
    check('回到世界界面', doc.getElementById('view-world').classList.contains('active'));
  }

  console.log('== 职业专精UI(毒药/宠物/灵魂碎片) ==');
  // 盗贼:背包涂抹毒药 + 技能书职业面板
  {
    const rc = W.Char.create('毒刃', 'human', 'rogue');
    const cc = W.Char.computed(rc);
    rc.hp = cc.hpMax; rc.hpMax = cc.hpMax; rc.mana = cc.manaMax; rc.manaMax = cc.manaMax;
    rc.inventory.push({ id: 'p_instant', count: 1 });
    W.State.newCharacter(rc);
    W.World.showWorld();
    check('宠物按钮对非猎人隐藏', doc.querySelector('[data-act="pets"]').style.display === 'none');
    click('[data-act="bag"]');
    const poisonBtn = doc.querySelector('[data-poison="p_instant"]');
    check('背包显示涂抹按钮', !!poisonBtn);
    if (poisonBtn) poisonBtn.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    check('涂抹速效毒药成功', !!W.State.character.poison && W.State.character.poison.id === 'p_instant');
    click('.close-x');
    click('[data-act="skills"]');
    check('技能书显示毒药系统面板', text('.class-panel').includes('毒药'));
    click('.close-x');
  }
  // 猎人:宠物面板 + 默认白虎出战
  {
    const hc = W.Char.create('猎手', 'orc', 'hunter');
    const cc = W.Char.computed(hc);
    hc.hp = cc.hpMax; hc.hpMax = cc.hpMax; hc.mana = cc.manaMax; hc.manaMax = cc.manaMax;
    W.State.newCharacter(hc);
    W.World.showWorld();
    check('宠物按钮对猎人可见', doc.querySelector('[data-act="pets"]').style.display !== 'none');
    click('[data-act="pets"]');
    check('宠物面板打开', text('.modal-title').includes('宠物'));
    check('默认白虎出战', text('.pet-name').includes('白虎'));
    click('.close-x');
  }
  // 术士:战斗中灵魂碎片条 + 地狱火碎片门槛
  {
    const wc = W.Char.create('痛苦术', 'undead', 'warlock');
    wc.level = 20;
    const cc = W.Char.computed(wc);
    wc.hp = cc.hpMax; wc.hpMax = cc.hpMax; wc.mana = cc.manaMax; wc.manaMax = cc.manaMax;
    for (const sid of D.CLASSES.warlock.skills) {
      const s = D.SKILLS[sid];
      if (s && s.learn <= wc.level && !wc.learnedSkills.includes(sid)) wc.learnedSkills.push(sid);
    }
    wc.soulShards = 2;
    W.State.newCharacter(wc);
    W.World.showWorld();
    W.BattleView.start({ enemies: [D.MONSTERS.elwynn_boar], name: '测试' }, {});
    check('战斗中显示灵魂碎片条', text('.ally-card').includes('碎片 2'));
    const inf = doc.querySelector('[data-skill="summon_infernal"]');
    check('召唤地狱火出现在技能栏', !!inf);
    check('碎片不足时地狱火按钮禁用', !!inf && inf.disabled);
    W.World.showWorld();
  }

  console.log('== 锻造铺UI(强化/附魔) ==');
  {
    const fc = W.Char.create('铁匠', 'human', 'warrior');
    fc.level = 15;
    fc.gold = 999999;
    fc.inventory.push({ id: 'm_dust', count: 50 }, { id: 'm_essence', count: 50 }, { id: 'a_ring', count: 1 }, { id: 'a_helm', count: 1 });
    fc.equipment.weapon = 'w_battle_axe';
    fc.equipment.chest = 'a_plate';
    const cc = W.Char.computed(fc);
    fc.hp = cc.hpMax; fc.hpMax = cc.hpMax; fc.mana = cc.manaMax; fc.manaMax = cc.manaMax;
    W.State.newCharacter(fc);
    W.World.showWorld();
    check('锻造按钮可见', !!doc.querySelector('[data-act="forge"]'));
    click('[data-act="forge"]');
    check('锻造铺打开', text('.modal-title').includes('锻造'));
    const atkBefore = W.Char.computed(fc).atkMin;
    const enh = doc.querySelector('[data-enhance="w_battle_axe"]');
    check('强化按钮存在', !!enh);
    if (enh) {
      enh.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
      check('强化成功(+1)', (W.Char.Forge.get(fc, 'w_battle_axe') || {}).level === 1);
      check('强化后攻击提升', W.Char.computed(fc).atkMin > atkBefore);
      check('锻造面板显示+1强化标签', text('.forge-row').includes('+1 强化'));
    }
    const toggle = doc.querySelector('[data-enchant-toggle="w_battle_axe"]');
    if (toggle) {
      toggle.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
      const box = doc.querySelector('[data-enchants="w_battle_axe"]');
      check('附魔列表展开', !!box && box.style.display !== 'none');
      const apply = doc.querySelector('[data-enchant-apply="w_battle_axe:e_flame"]');
      check('灼热武器可附魔', !!apply);
      if (apply) {
        apply.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
        check('附魔成功(灼热武器)', (W.Char.Forge.get(fc, 'w_battle_axe') || {}).enchant === 'e_flame');
        check('锻造面板显示附魔标签', text('.forge-row').includes('灼热武器'));
      }
    }
    // 分解:绿色装备 → 锻造材料
    check('锻造铺显示分解区', !!doc.querySelector('.forge-de-title'));
    const deBtn = doc.querySelector('[data-disenchant="a_ring"]');
    check('分解按钮存在(生命之戒)', !!deBtn);
    const dust0 = W.Char.Inventory.count(fc, 'm_dust');
    if (deBtn) {
      deBtn.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
      check('分解成功并获得粉尘', W.Char.Inventory.count(fc, 'a_ring') === 0 && W.Char.Inventory.count(fc, 'm_dust') > dust0);
      check('分解后列表刷新(戒指行消失)', !doc.querySelector('[data-disenchant="a_ring"]'));
    }
    click('.close-x');
    // 背包中:材料标签 + 绿色装备快捷分解按钮
    click('[data-act="bag"]');
    check('背包材料显示材料标签', !!doc.querySelector('.tag.mat-tag'));
    check('背包绿色装备显示分解按钮', !!doc.querySelector('[data-disenchant="a_helm"]'));
    const essence0 = W.Char.Inventory.count(fc, 'm_essence');
    const helmBtn = doc.querySelector('[data-disenchant="a_helm"]');
    if (helmBtn) {
      helmBtn.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
      check('背包分解成功(头盔→精华)', W.Char.Inventory.count(fc, 'a_helm') === 0 && W.Char.Inventory.count(fc, 'm_essence') === essence0 + 1);
    }
    click('.close-x');
  }

  console.log('== 一键批量分解UI(锻造铺 + 背包) ==');
  {
    const bc = W.Char.create('批量分解', 'human', 'warrior');
    bc.level = 15;
    bc.inventory.push({ id: 'a_ring', count: 1 }, { id: 'a_helm', count: 1 }, { id: 'a_wolf_cloak', count: 1 }, { id: 'a_band', count: 1 }, { id: 'w_warblade', count: 1 });
    const cc = W.Char.computed(bc);
    bc.hp = cc.hpMax; bc.hpMax = cc.hpMax; bc.mana = cc.manaMax; bc.manaMax = cc.manaMax;
    W.State.newCharacter(bc);
    W.World.showWorld();
    click('[data-act="forge"]');
    const batch = doc.querySelector('[data-disenchant-all="green"]');
    check('一键分解按钮存在(含件数)', !!batch && batch.textContent.includes('4'), batch ? batch.textContent : '无');
    if (batch) {
      batch.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
      check('首次点击进入确认态', text('[data-disenchant-all="green"]').includes('确认分解'));
      batch.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
      check('一键分解全部绿色(4件)', W.Char.Inventory.count(bc, 'a_ring') === 0 && W.Char.Inventory.count(bc, 'a_helm') === 0
        && W.Char.Inventory.count(bc, 'a_wolf_cloak') === 0 && W.Char.Inventory.count(bc, 'a_band') === 0);
      check('蓝色装备未被批量分解', W.Char.Inventory.count(bc, 'w_warblade') === 1);
      // a_ring(绿9)→粉尘4; a_helm(绿10)→粉尘4+精华1; a_wolf_cloak(绿8)→粉尘3; a_band(绿10)→粉尘4+精华1
      check('批量分解材料汇总(粉尘15+精华2)', W.Char.Inventory.count(bc, 'm_dust') === 15 && W.Char.Inventory.count(bc, 'm_essence') === 2,
        `dust=${W.Char.Inventory.count(bc, 'm_dust')} ess=${W.Char.Inventory.count(bc, 'm_essence')}`);
      check('剩余蓝装仍可单独分解', !!doc.querySelector('[data-disenchant="w_warblade"]'));
    }
    click('.close-x');
    // 背包中的一键分解入口:绿色已清空 → 按钮禁用
    click('[data-act="bag"]');
    check('背包显示一键分解入口', !!doc.querySelector('.bag-batch'));
    const bagBatch = doc.querySelector('[data-disenchant-all="green"]');
    check('无绿色装备时按钮禁用', !!bagBatch && bagBatch.disabled);
    click('.close-x');
  }

  console.log('== 被动技能(常驻)UI ==');
  {
    const pc = W.Char.create('怒吼', 'human', 'warrior');
    pc.level = 8;
    for (const sid of D.CLASSES.warrior.skills) {
      const s = D.SKILLS[sid];
      if (s && s.learn <= pc.level && !pc.learnedSkills.includes(sid)) pc.learnedSkills.push(sid);
    }
    W.State.newCharacter(pc);
    W.World.showWorld();
    click('[data-act="skills"]');
    const skBody = text('.modal-body');
    check('技能书显示被动技能分组', skBody.includes('被动技能'));
    const bsRow = [...doc.querySelectorAll('.skill-row')].find((r) => r.textContent.includes('战斗怒吼'));
    check('战斗怒吼带被动常驻标签且无消耗', !!bsRow && bsRow.textContent.includes('被动 · 常驻') && !bsRow.textContent.includes('怒气'));
    click('.close-x');
    // 战斗技能栏不渲染被动技能按钮
    W.BattleView.start({ enemies: [D.MONSTERS.elwynn_boar], name: '测试' }, {});
    check('战斗技能栏不含战斗怒吼按钮', !doc.querySelector('[data-skill="battle_shout"]'));
    check('技能栏仍含主动技能', !!doc.querySelector('[data-skill="heroic_strike"]'));
    check('被动加成已计入战斗单位攻击', W.Combat.battle.player.atkMin === W.Char.computed(pc).atkMin,
      `unit=${W.Combat.battle.player.atkMin} computed=${W.Char.computed(pc).atkMin}`);
    // 状态面板显示被动技能块
    W.World.openStatus();
    const stText = text('.status-grid');
    check('状态面板显示被动技能块', stText.includes('被动技能') && stText.includes('战斗怒吼'));
    click('.close-x');
    // 第二批转化:盾牌格挡(6级)同入被动组且不进技能栏
    click('[data-act="skills"]');
    const sbRow = [...doc.querySelectorAll('.skill-row')].find((r) => r.textContent.includes('盾牌格挡'));
    check('盾牌格挡带被动常驻标签', !!sbRow && sbRow.textContent.includes('被动 · 常驻') && !sbRow.textContent.includes('怒气'));
    click('.close-x');
    W.BattleView.start({ enemies: [D.MONSTERS.elwynn_boar], name: '测试' }, {});
    check('技能栏不含盾牌格挡按钮', !doc.querySelector('[data-skill="shield_block"]'));
    check('战士战斗开始无起始护盾', W.Combat.battle.player.shield == null);
  }

  console.log('== 天赋被动标签(心灵之火/寒冰护体) ==');
  {
    const tc = W.Char.create('灵火', 'human', 'priest');
    tc.level = 20;
    tc.talents = { disc: { pr_disc_shield: 5, pr_disc_fh: 5 } };
    check('学习心灵之火天赋', W.Char.learnTalent(tc, 'disc', 'pr_disc_if').ok);
    W.State.newCharacter(tc);
    W.World.showWorld();
    click('[data-act="talents"]');
    const tn = [...doc.querySelectorAll('.talent-node')].find((n) => n.dataset.talent === 'pr_disc_if');
    check('心灵之火天赋节点标记为被动', !!tn && tn.textContent.includes('被动') && !tn.textContent.includes('主动'));
    check('心灵之火天赋描述为常驻', !!tn && tn.textContent.includes('常驻'));
    click('.close-x');
    // 猎人:战斗开始自动标记
    const hc = W.Char.create('印记', 'night_elf', 'hunter');
    hc.level = 5;
    for (const sid of D.CLASSES.hunter.skills) {
      const s = D.SKILLS[sid];
      if (s && s.learn <= hc.level && !hc.learnedSkills.includes(sid)) hc.learnedSkills.push(sid);
    }
    W.State.newCharacter(hc);
    W.World.showWorld();
    W.BattleView.start({ enemies: [D.MONSTERS.elwynn_boar], name: '测试' }, {});
    check('猎人战斗开始自动标记首个敌人', W.Combat.battle.enemies[0].buffs.some((x) => x.mod && x.mod.takenPct === 0.12));
    check('猎人战斗日志含印记', text('.combat-log').includes('猎人印记'));
  }

  console.log('== 战斗界面被动常驻标识 ==');
  {
    const bc = W.Char.create('标识战', 'human', 'warrior');
    bc.level = 8;
    for (const sid of D.CLASSES.warrior.skills) {
      const s = D.SKILLS[sid];
      if (s && s.learn <= bc.level && !bc.learnedSkills.includes(sid)) bc.learnedSkills.push(sid);
    }
    W.State.newCharacter(bc);
    W.World.showWorld();
    W.BattleView.start({ enemies: [D.MONSTERS.elwynn_boar], name: '测试' }, {});
    const chips = doc.querySelectorAll('.ally-card .passive-chip');
    check('玩家卡牌显示被动常驻标识(战斗怒吼+盾牌格挡)', chips.length === 2, `chips=${chips.length}`);
    check('被动标识带水印常驻角标', [...chips].every((c) => !!c.querySelector('.pp-mark') && c.querySelector('.pp-mark').textContent === '常'));
    check('被动标识悬停显示效果说明', chips.length > 0 && [...chips].some((c) => c.title.includes('被动 · 常驻') && c.title.includes('护甲')), [...chips].map((c) => c.title).join(' | '));
    check('宠物/敌人卡牌无被动标识', !doc.querySelector('.pet .passive-bar') && !doc.querySelector('.enemy-card .passive-bar'));
    // 猎人:敌方身上的印记徽章显示专用弓箭图标
    const hc2 = W.Char.create('标识猎', 'night_elf', 'hunter');
    hc2.level = 5;
    for (const sid of D.CLASSES.hunter.skills) {
      const s = D.SKILLS[sid];
      if (s && s.learn <= hc2.level && !hc2.learnedSkills.includes(sid)) hc2.learnedSkills.push(sid);
    }
    W.State.newCharacter(hc2);
    W.World.showWorld();
    W.BattleView.start({ enemies: [D.MONSTERS.elwynn_boar], name: '测试' }, {});
    check('猎人玩家卡牌被动标识(鹰之守护+印记)', doc.querySelectorAll('.ally-card .passive-chip').length === 2);
    check('敌方印记徽章显示弓箭图标且提示常驻', [...doc.querySelectorAll('.enemy-card .buff-chip')].some((c) => c.textContent === '🎯' && c.title.includes('猎人印记') && c.title.includes('常驻')));
    check('常驻效果不显示剩余回合数', ![...doc.querySelectorAll('.enemy-card .buff-chip')].some((c) => c.title.includes('剩 999')));
  }

  console.log('== 第三批被动:种族/职业 buff 转被动 ==');
  {
    // 兽人战士:血性狂暴被动入战斗标识 + 不进技能栏 + 状态面板标记为被动
    const oc = W.Char.create('兽战', 'orc', 'warrior');
    oc.level = 8;
    for (const sid of D.CLASSES.warrior.skills) {
      const s = D.SKILLS[sid];
      if (s && s.learn <= oc.level && !oc.learnedSkills.includes(sid)) oc.learnedSkills.push(sid);
    }
    W.State.newCharacter(oc);
    W.World.showWorld();
    W.BattleView.start({ enemies: [D.MONSTERS.elwynn_boar], name: '测试' }, {});
    const chips = [...doc.querySelectorAll('.ally-card .passive-chip')].map((c) => c.title);
    check('兽人战士被动标识含血性狂暴', chips.some((t) => t.includes('血性狂暴')), chips.join(' | '));
    check('技能栏不含血性狂暴按钮', !doc.querySelector('[data-skill="blood_fury"]'));
    W.World.openStatus();
    const stText = text('.status-grid');
    check('状态面板血性狂暴标记为被动', stText.includes('被动：血性狂暴'));
    click('.close-x');
    // 萨满:嗜血不进技能栏
    const sc = W.Char.create('萨满', 'orc', 'shaman');
    sc.level = 18;
    for (const sid of D.CLASSES.shaman.skills) {
      const s = D.SKILLS[sid];
      if (s && s.learn <= sc.level && !sc.learnedSkills.includes(sid)) sc.learnedSkills.push(sid);
    }
    W.State.newCharacter(sc);
    W.World.showWorld();
    W.BattleView.start({ enemies: [D.MONSTERS.elwynn_boar], name: '测试' }, {});
    check('技能栏不含嗜血按钮', !doc.querySelector('[data-skill="bloodlust"]'));
    check('萨满被动标识含嗜血', [...doc.querySelectorAll('.ally-card .passive-chip')].some((c) => c.title.includes('嗜血')));
    // 德鲁伊:形态常驻直接提升属性
    const dc = W.Char.create('形态', 'tauren', 'druid');
    dc.level = 14;
    for (const sid of D.CLASSES.druid.skills) {
      const s = D.SKILLS[sid];
      if (s && s.learn <= dc.level && !dc.learnedSkills.includes(sid)) dc.learnedSkills.push(sid);
    }
    W.State.newCharacter(dc);
    W.World.showWorld();
    W.BattleView.start({ enemies: [D.MONSTERS.elwynn_boar], name: '测试' }, {});
    check('德鲁伊技能栏不含形态按钮', !doc.querySelector('[data-skill="cat_form"]') && !doc.querySelector('[data-skill="bear_form"]'));
    check('德鲁伊被动标识含熊/猎豹形态', [...doc.querySelectorAll('.ally-card .passive-chip')].some((c) => c.title.includes('熊形态')) && [...doc.querySelectorAll('.ally-card .passive-chip')].some((c) => c.title.includes('猎豹形态')));
  }

  console.log('== 第四批:天赋爆发短增益转被动 ==');
  {
    // 法师:火焰爆发配点后燃烧为被动,入技能书被动组/天赋节点常驻/不进技能栏/战斗水印标识
    const mc = W.Char.create('燃烧法', 'human', 'mage');
    mc.level = 25;
    const fire = D.TALENT_BUILDS.mage.find((b) => b.name === '火焰爆发');
    W.Char.applyBuild(mc, fire);
    W.State.newCharacter(mc);
    W.World.showWorld();
    click('[data-act="skills"]');
    const cmRow = [...doc.querySelectorAll('.skill-row')].find((r) => r.textContent.includes('燃烧'));
    check('燃烧列于被动组且带常驻标签', !!cmRow && cmRow.textContent.includes('被动 · 常驻') && !cmRow.textContent.includes('法力'), (cmRow || {}).textContent || 'no row');
    check('技能书被动机制说明含天赋爆发类别', ((doc.querySelector('.passive-note') || {}).textContent || '').includes('天赋爆发'));
    click('.close-x');
    click('[data-act="talents"]');
    click('[data-tree="fire"]');
    const tn2 = [...doc.querySelectorAll('.talent-node')].find((n) => n.dataset.talent === 'm_fire_combust');
    check('燃烧天赋节点描述为常驻', !!tn2 && tn2.textContent.includes('常驻'), (tn2 || {}).textContent || 'node missing');
    click('.close-x');
    W.BattleView.start({ enemies: [D.MONSTERS.elwynn_boar], name: '测试' }, {});
    check('技能栏不含燃烧按钮', !doc.querySelector('[data-skill="combustion"]'));
    check('法师被动标识含燃烧', [...doc.querySelectorAll('.ally-card .passive-chip')].some((c) => c.title.includes('燃烧')));
  }

  console.log('== 技能书/帮助面板被动机制教学 ==');
  {
    const nc = W.Char.create('教学战', 'human', 'warrior');
    nc.level = 8;
    for (const sid of D.CLASSES.warrior.skills) {
      const s = D.SKILLS[sid];
      if (s && s.learn <= nc.level && !nc.learnedSkills.includes(sid)) nc.learnedSkills.push(sid);
    }
    W.State.newCharacter(nc);
    W.World.showWorld();
    click('[data-act="skills"]');
    const note = doc.querySelector('.passive-note');
    check('技能书显示被动机制说明', !!note && note.textContent.includes('效果常驻') && note.textContent.includes('起始护盾') && note.textContent.includes('自动标记'));
    // 可折叠:默认收起,点击展开/再点收起
    const pnBody = note.querySelector('.pn-body');
    const pnToggle = note.querySelector('.pn-toggle');
    check('被动说明默认收起', !!pnBody && pnBody.hidden === true);
    check('折叠标题栏存在(含提示)', !!pnToggle && pnToggle.getAttribute('aria-expanded') === 'false' && pnToggle.textContent.includes('效果常驻'));
    click('.pn-toggle');
    check('点击展开被动说明', pnBody.hidden === false && pnToggle.classList.contains('open') && pnToggle.getAttribute('aria-expanded') === 'true');
    click('.pn-toggle');
    check('再次点击收起', pnBody.hidden === true && !pnToggle.classList.contains('open') && pnToggle.getAttribute('aria-expanded') === 'false');
    // 总览双入口:折叠说明栏内也提供总览按钮
    const poInNote = note.querySelector('.pn-overview');
    check('折叠栏内含总览入口按钮', !!poInNote && poInNote.textContent.includes('被动效果总览'));
    click('.pn-overview');
    check('技能书总览入口打开总览面板', text('.modal-title').includes('被动效果总览') && doc.querySelectorAll('.po-tab').length === 9);
    click('.close-x');
    // 副手装备引导:所有职业技能书顶部常驻可折叠说明,含盾牌/副刃/圣物适用职业
    W.World.showWorld();
    click('[data-act="skills"]');
    const offNote = doc.querySelector('.off-note');
    check('技能书显示副手装备引导块', !!offNote && offNote.textContent.includes('副手装备') && offNote.textContent.includes('独立槽位'));
    check('副手说明含盾牌/副刃/圣物三类', !!offNote && offNote.textContent.includes('盾牌') && offNote.textContent.includes('副刃') && offNote.textContent.includes('圣物'));
    check('副手说明含适用职业(战士/盗贼/法师)', !!offNote && offNote.textContent.includes('战士') && offNote.textContent.includes('盗贼') && offNote.textContent.includes('法师'));
    const ofBody = offNote.querySelector('.pn-body');
    const ofToggle = offNote.querySelector('.of-toggle');
    check('副手说明默认收起', !!ofBody && ofBody.hidden === true && ofToggle.getAttribute('aria-expanded') === 'false');
    click('.of-toggle');
    check('点击展开副手说明', ofBody.hidden === false && ofToggle.classList.contains('open') && ofToggle.getAttribute('aria-expanded') === 'true');
    click('.of-toggle');
    check('再次点击收起副手说明', ofBody.hidden === true && !ofToggle.classList.contains('open'));
    click('.close-x');
    // 帮助面板含副手条目
    click('[data-act="help"]');
    check('帮助面板含副手装备条目', text('.help-list').includes('副手装备') && text('.help-list').includes('圣物'));
    click('.close-x');
    // 无被动角色不显示被动说明(副手引导不受影响)
    const bare = W.Char.create('裸战', 'human', 'warrior'); // 1 级无被动
    W.State.newCharacter(bare);
    W.World.showWorld();
    click('[data-act="skills"]');
    check('无被动角色不显示机制说明', !doc.querySelector('.passive-note'));
    click('.close-x');
    // 帮助面板教学(含起始护盾/自动标记/水印提示)
    W.Main.openHelp();
    const helpText = text('.help-list');
    check('帮助面板含被动技能教学', helpText.includes('被动技能（常驻）') && helpText.includes('起始护盾') && helpText.includes('自动标记') && helpText.includes('水印图标'));
    click('.close-x');
  }

  console.log('== 被动效果总览面板 ==');
  {
    const oc = W.Char.create('总览兽战', 'orc', 'warrior');
    oc.level = 10;
    for (const sid of D.CLASSES.warrior.skills) {
      const s = D.SKILLS[sid];
      if (s && s.learn <= oc.level && !oc.learnedSkills.includes(sid)) oc.learnedSkills.push(sid);
    }
    W.State.newCharacter(oc);
    W.World.showWorld();
    W.World.openStatus();
    check('状态面板含总览入口', !!doc.querySelector('[data-passive-overview]'));
    click('[data-passive-overview]');
    const body = text('.modal-body');
    check('总览面板标题与9职业页签', text('.modal-title').includes('被动效果总览') && doc.querySelectorAll('.po-tab').length === 9);
    check('当前职业页签高亮(战士)', !!doc.querySelector('.po-tab.active[data-cls="warrior"]'));
    check('已习得被动显示实时加成', body.includes('战斗怒吼') && body.includes('攻击 +') && body.includes('✅ 已习得'));
    check('未习得被动显示锁定与基础数值', body.includes('盾墙') && body.includes('🔒 未习得') && body.includes('护甲 +12%'));
    check('兽人种族被动展示(种族分组+标签)', body.includes('血性狂暴') && body.includes('种族被动') && !!doc.querySelector('.po-row .race-src'));
    check('当前页签显示被动加成总计(实时)', !!doc.querySelector('.po-summary:not(.ref)') && body.includes('被动加成总计') && body.includes('攻击 +') && !body.includes('参考合计'));
    // 切换职业页签
    click('.po-tab[data-cls="mage"]');
    const body2 = text('.modal-body');
    check('切到法师页签显示天赋被动与参考标注', body2.includes('燃烧') && body2.includes('奥术强化') && body2.includes('参考'));
    check('法师页签无实时加成(非当前职业)', !doc.querySelector('.po-live-chip') && body2.includes('🔒 未习得'));
    check('其他职业页签显示参考合计', !!doc.querySelector('.po-summary.ref') && body2.includes('被动加成参考合计'));
    click('.po-tab[data-cls="warrior"]');
    check('切回战士页签实时加成仍在', text('.modal-body').includes('攻击 +') && text('.modal-body').includes('✅ 已习得'));
    // 天赋被动:来源树 + 解锁点数 + 点击跳转天赋面板
    const wBody = text('.modal-body');
    check('天赋被动显示来源系与解锁点数', wBody.includes('盾墙') && wBody.includes('防护系天赋') && wBody.includes('需本系 10 点解锁') && !!doc.querySelector('.po-talent-go[data-tree="prot"]'));
    click('.po-talent-go[data-tree="prot"]');
    check('点击跳转天赋面板并选中防护系', text('.modal-title').includes('天赋') && !!doc.querySelector('.talent-tab.active[data-tree="prot"]'));
    click('.close-x');
  }

  console.log('== 存档槽扩容(10)与背包属性 ==');
  {
    const cc = W.Char.create('属性王', 'human', 'warrior');
    cc.level = 8;
    cc.inventory.push({ id: 'a_ring', count: 1 }, { id: 'c_bread', count: 3 });
    W.State.newCharacter(cc);
    W.World.showWorld();
    click('[data-act="bag"]');
    const bagText = text('.modal-body');
    check('背包显示装备属性(属性/伤害)', /护甲|力量|敏捷|耐力|智力|精神|伤害/.test(bagText), bagText.slice(0, 150));
    check('背包显示消耗品效果', bagText.includes('恢复'));
    check('背包显示分解预览', bagText.includes('分解可得'));
    click('.close-x');
    W.World.openSave();
    const rows = doc.querySelectorAll('.save-slots .save-row').length;
    check('存档管理显示10个槽位', rows === 10, `rows=${rows}`);
    click('.close-x');
    // 标题界面存档管理同样 10 槽
    W.Main.titleSaves();
    check('标题界面存档管理显示10个槽位', doc.querySelectorAll('.save-slots .save-row').length === 10);
    click('.close-x');
  }

  console.log('== 背包卖价与装备对比 ==');
  {
    const bc = W.Char.create('对比王', 'human', 'warrior');
    bc.level = 5;
    // 已装备 亚麻布衣(护甲6 智力1);背包放入 硬皮护甲(护甲14 耐力2)、生命之戒(耐力3) 与 亚麻布衣副本
    bc.inventory.push({ id: 'a_leather', count: 1 }, { id: 'a_ring', count: 1 }, { id: 'a_cloth', count: 1 });
    W.State.newCharacter(bc);
    W.World.showWorld();
    click('[data-act="bag"]');
    const bagText = text('.modal-body');
    check('背包显示出售价', bagText.includes('💰 卖'));
    const cmps = [...doc.querySelectorAll('.item-compare')].map((e) => e.textContent).join(' ');
    check('装备对比提示(硬皮护甲 vs 亚麻布衣)', cmps.includes('对比已装备') && cmps.includes('护甲 +8'), cmps);
    check('对比升降配色(绿升/红降)', !!doc.querySelector('.cmp-up') && !!doc.querySelector('.cmp-down'));
    check('空闲槽位提示(戒指)', cmps.includes('槽位空闲'));
    // 已装备的 亚麻布衣 行:显示已装备标签且不显示对比
    const eqRow = [...doc.querySelectorAll('.bag-row')].find((r) => r.textContent.includes('亚麻布衣'));
    check('已装备物品不显示对比', !!eqRow && !!eqRow.querySelector('.eq-tag') && !eqRow.querySelector('.item-compare'));
    click('.close-x');
    // 装备硬皮护甲后:它离开背包,旧胸甲回到背包并显示新对比
    W.Char.Equipment.equip(bc, 'a_leather');
    click('[data-act="bag"]');
    const bg2 = text('.modal-body');
    check('装备后物品离开背包', !bg2.includes('硬皮护甲'));
    check('旧装备对比对象更新(护甲 -8)', bg2.includes('对比已装备') && bg2.includes('护甲 -8'));
    click('.close-x');
  }

  console.log('== 主城商人购买背包扩充 ==');
  {
    const bc = W.Char.create('包神', 'human', 'warrior');
    bc.level = 45; // 商店按 角色等级+3 过滤商品,45 级可看到全部三档背包
    bc.gold = 50000;
    bc.zone = 'stormwind';
    W.State.newCharacter(bc);
    W.World.showWorld();
    click('[data-act="shop"]');
    check('主城商店上架三档背包', !!doc.querySelector('[data-item="bg_linen"]') && !!doc.querySelector('[data-item="bg_wool"]') && !!doc.querySelector('[data-item="bg_traveler"]'));
    const linenRow = doc.querySelector('[data-item="bg_linen"]');
    check('背包物品显示容量说明', !!linenRow && linenRow.textContent.includes('容量'), linenRow ? linenRow.textContent.slice(0, 120) : '无');
    const buyBtn = linenRow && linenRow.querySelector('button');
    if (buyBtn) buyBtn.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    check('购买亚麻背包后入包', W.Char.Inventory.count(bc, 'bg_linen') === 1);
    check('购买后扣除金币', bc.gold === 50000 - D.ITEMS.bg_linen.buy, `gold=${bc.gold}`);
    click('.close-x');
    click('[data-act="bag"]');
    const useBtn = doc.querySelector('[data-use="bg_linen"]');
    check('背包内背包物品有使用按钮', !!useBtn && useBtn.textContent.includes('使用'));
    if (useBtn) useBtn.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    check('使用后容量+10(40→50)', W.Char.bagSize(bc) === 50, 'size=' + W.Char.bagSize(bc));
    check('使用后物品消耗', W.Char.Inventory.count(bc, 'bg_linen') === 0);
    check('背包面板显示新容量(背包 1 / 50)', text('.modal-body').includes('/ 50'), text('.modal-body').slice(0, 80));
    click('.close-x');
  }

  console.log('== 旅行面板未接任务数 ==');
  {
    const tc = W.Char.create('任务王', 'human', 'warrior');
    tc.level = 6;
    W.State.newCharacter(tc);
    W.World.showWorld();
    click('[data-act="travel"]');
    const row = [...doc.querySelectorAll('.travel-row')].find((r) => r.dataset.zone === 'elwynn');
    const m1 = row && row.textContent.match(/📜 可接 (\d+)/);
    check('旅行面板行内显示未接任务徽标', !!m1, row ? row.textContent.slice(0, 130) : '无elwynn行');
    const hint = text('.travel-hint');
    check('顶部汇总显示全图可接任务数', /全图可接任务 \d+/.test(hint), hint.slice(0, 110));
    click('.close-x');
    // 接取一个任务后徽标减一(与任务板口径联动)
    const n0 = m1 ? parseInt(m1[1], 10) : -1;
    W.Char.QuestLog.start(tc, 'q_boar');
    click('[data-act="travel"]');
    const row2 = [...doc.querySelectorAll('.travel-row')].find((r) => r.dataset.zone === 'elwynn');
    const m2 = row2 && row2.textContent.match(/📜 可接 (\d+)/);
    check('接取任务后未接徽标-1', m2 && parseInt(m2[1], 10) === n0 - 1, m2 ? m2[0] : '无徽标');
    click('.close-x');
  }

  console.log('== 21-30段中期装备(商店可见) ==');
  {
    const mc = W.Char.create('中装王', 'human', 'warrior');
    mc.level = 28;
    mc.gold = 99999;
    mc.zone = 'stv';
    W.State.newCharacter(mc);
    W.World.showWorld();
    click('[data-act="shop"]');
    check('荆棘谷商店上架弯刀/皮甲/猎戒', !!doc.querySelector('[data-item="w_stv_cutlass"]') && !!doc.querySelector('[data-item="a_stv_chest"]') && !!doc.querySelector('[data-item="a_stv_ring"]'));
    check('新武器行显示属性', text('[data-item="w_stv_cutlass"]').includes('伤害'), text('[data-item="w_stv_cutlass"]').slice(0, 100));
    click('.close-x');
    // 背包渲染新装备属性
    mc.zone = 'badlands';
    W.Char.Inventory.add(mc, 'a_badlands_legs', 1);
    W.World.showWorld();
    click('[data-act="bag"]');
    const bagT = text('.modal-body');
    check('背包渲染新护腿属性', bagT.includes('荒芜护腿') && /护甲 52/.test(bagT), bagT.slice(0, 120));
    click('.close-x');
  }

  console.log('== 31-35段野怪(区域展示与战斗) ==');
  {
    const mc = W.Char.create('野怪王', 'human', 'warrior');
    mc.level = 34;
    mc.zone = 'badlands';
    W.State.newCharacter(mc);
    W.World.showWorld();
    const zoneText = text('.zone-panel');
    check('区域面板展示新野怪', zoneText.includes('石皮蜥蜴') && zoneText.includes('荒原迅猛龙'), zoneText.slice(0, 150));
    // 直接对新野怪发起战斗并结算
    W.BattleView.start({ enemies: [D.MONSTERS.badlands_basilisk], name: '石皮蜥蜴' }, {});
    const b = W.Combat.battle;
    let guard = 0;
    while (b && !b.ended && guard++ < 60) {
      const btn = doc.querySelector('.skill-btn[data-skill]:not(:disabled)') || doc.querySelector('[data-act="attack"]');
      if (!btn) break;
      btn.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
      await sleep(25);
    }
    check('新野怪战斗正常结算', !!b && b.ended, b ? 'ended=' + b.ended + ' victory=' + b.victory : '无战斗');
    // 结算弹窗出现(胜利弹拾取行/失败弹复活)
    await sleep(400);
    check('战斗结算弹窗出现', doc.getElementById('modal-root').classList.contains('show'));
    // 关闭锁定结算弹窗(避免残留影响后续测试块)
    const cont = doc.querySelector('#modal-root [data-continue]');
    if (cont) cont.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    await sleep(60);
    check('结算弹窗已关闭', !doc.getElementById('modal-root').classList.contains('show'));
    mc.zone = 'searing';
    W.World.showWorld();
    check('灼热峡谷面板展示新野怪', text('.zone-panel').includes('灼热野狼') && text('.zone-panel').includes('熔岩幼龙'));
    click('.close-x');
  }

  console.log('== 任务经验再平衡(任务板数值) ==');
  {
    const qc = W.Char.create('经验王', 'human', 'warrior');
    qc.level = 10;
    W.State.newCharacter(qc);
    W.World.showWorld();
    click('[data-act="quests"]');
    const boarRow = [...doc.querySelectorAll('.quest-row')].find((r) => r.textContent.includes('猎杀野猪'));
    check('任务板渲染再平衡后经验', !!boarRow && new RegExp('奖励：' + D.QUESTS.q_boar.exp + ' 经验').test(boarRow.textContent),
      boarRow ? boarRow.textContent.slice(0, 130) : '无q_boar行');
    check('任务板奖励含补偿材料', !!boarRow && boarRow.textContent.includes('奥术粉尘'), boarRow ? boarRow.textContent.slice(0, 130) : '无');
    click('.close-x');
  }

  console.log('== 可装备标记/一键出售白色/团本标记 ==');
  {
    const bc = W.Char.create('标记王', 'human', 'warrior');
    bc.level = 8;
    W.Char.Inventory.add(bc, 'w_short_sword', 1); // 白色 Lv3 可装备
    W.Char.Inventory.add(bc, 'w_frostmourne', 1); // Lv60 橙色
    W.Char.Inventory.add(bc, 'a_leather', 1); // 白色 Lv5 可装备
    W.Char.Inventory.add(bc, 'm_dust', 3); // 材料
    W.Char.Inventory.add(bc, 'c_bread', 2); // 消耗品
    W.Char.Inventory.add(bc, 'p_instant', 2); // 毒药(盗贼)
    W.State.newCharacter(bc);
    W.World.showWorld();
    click('[data-act="bag"]');
    const bagT = text('.modal-body');
    check('背包显示可装备标记', bagT.includes('可装备'), bagT.slice(0, 200));
    check('背包显示需要X级标记', bagT.includes('需要60级'), bagT.slice(0, 200));
    check('材料行有出售按钮', !!doc.querySelector('[data-sell-bag="m_dust"]'));
    check('消耗品行有出售按钮', !!doc.querySelector('[data-sell-bag="c_bread"]'));
    check('毒药行有出售按钮', !!doc.querySelector('[data-sell-bag="p_instant"]'));
    const sellAll = doc.querySelector('[data-sell-all="white"]');
    check('一键出售白色按钮含件数', !!sellAll && sellAll.textContent.includes('2'), sellAll ? sellAll.textContent : '无');
    const g0 = bc.gold;
    if (sellAll) {
      sellAll.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
      check('首次点击进入确认态', text('[data-sell-all="white"]').includes('确认出售'));
      sellAll.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
      await sleep(30);
      check('白色装备全部售出(金币入账)', W.Char.Inventory.count(bc, 'w_short_sword') === 0 && W.Char.Inventory.count(bc, 'a_leather') === 0 && bc.gold > g0);
      check('非白色保留(霜之哀伤/材料/面包)', W.Char.Inventory.count(bc, 'w_frostmourne') === 1 && W.Char.Inventory.count(bc, 'm_dust') === 3 && W.Char.Inventory.count(bc, 'c_bread') >= 2);
    }
    click('.close-x');
    // 团本/5人本标记:旅行面板与副本手册
    bc.zone = 'burning';
    W.World.showWorld();
    W.World.openTravel();
    const tr = text('.modal-body');
    check('旅行面板标注5人本(黑石深渊)', tr.includes('5人本'), tr.slice(0, 150));
    check('旅行面板标注团本(黑翼之巢)', tr.includes('团本'), tr.slice(0, 150));
    const raidRow = doc.querySelector('.travel-row[data-zone="molten_core"]');
    check('团本行带raid-tag样式', !!raidRow && !!raidRow.querySelector('.raid-tag'));
    click('.close-x');
    // 进入黑石深渊入口区域:区域面板标注 5人本
    bc.zone = 'blackrock_depths';
    W.World.showWorld();
    check('副本区域面板标注5人本', text('.zone-name').includes('5人本'), text('.zone-name'));
    W.World.openDungeonManual();
    check('副本手册标注5人本', text('.modal-body').includes('5人本'), text('.modal-body').slice(0, 150));
    click('.close-x');
    // 熔火之心入口:区域面板标注团本
    bc.zone = 'molten_core';
    W.World.showWorld();
    check('团本区域面板标注团本', text('.zone-name').includes('团本'), text('.zone-name'));
  }

  console.log('== 按品质/按槽位批量出售(可配置) ==');
  {
    const bs = W.Char.create('批量售', 'human', 'warrior');
    bs.level = 8;
    bs.equipment.weapon = null; // 卸下初始木棍/亚麻布衣,避免干扰槽位统计
    bs.equipment.chest = null;
    W.Char.Inventory.add(bs, 'w_short_sword', 1); // 白色武器
    W.Char.Inventory.add(bs, 'a_leather', 1);     // 白色护甲(胸)
    W.Char.Inventory.add(bs, 'a_ring', 1);        // 绿色戒指
    W.State.newCharacter(bs);
    W.World.showWorld();
    click('[data-act="bag"]');
    const qw = doc.querySelector('[data-sell-all="white"]');
    const qg = doc.querySelector('[data-sell-all="green"]');
    const qe = doc.querySelector('[data-sell-all="epic,purple"]');
    const sw = doc.querySelector('[data-sell-slot="weapon"]');
    const sa = doc.querySelector('[data-sell-slot="armor"]');
    const sr = doc.querySelector('[data-sell-slot="ring"]');
    check('品质芯片渲染(白色2/绿色1/史诗0)', !!qw && !!qg && !!qe && qw.textContent.includes('2') && qg.textContent.includes('1') && qe.textContent.includes('0'),
      (qw ? qw.textContent : '') + ' | ' + (qg ? qg.textContent : '') + ' | ' + (qe ? qe.textContent : ''));
    check('槽位芯片渲染(武器1/护甲1/戒指1)', !!sw && !!sa && !!sr && sw.textContent.includes('1') && sa.textContent.includes('1') && sr.textContent.includes('1'),
      (sw ? sw.textContent : '') + ' | ' + (sa ? sa.textContent : '') + ' | ' + (sr ? sr.textContent : ''));
    check('史诗芯片0件为禁用态', !!qe && qe.disabled);
    // 按槽位出售武器:只卖短剑,护甲/戒指保留
    const g0 = bs.gold;
    if (sw) {
      sw.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
      check('槽位出售进入确认态', text('[data-sell-slot="weapon"]').includes('确认出售'));
      sw.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
      await sleep(30);
      check('武器槽出售成功(短剑售出)', W.Char.Inventory.count(bs, 'w_short_sword') === 0);
      check('其他槽位保留(护甲/戒指)', W.Char.Inventory.count(bs, 'a_leather') === 1 && W.Char.Inventory.count(bs, 'a_ring') === 1);
      check('出售金币入账', bs.gold > g0);
      check('出售后武器芯片计数归零', !!doc.querySelector('[data-sell-slot="weapon"]') && doc.querySelector('[data-sell-slot="weapon"]').textContent.includes('0'));
    }
    click('.close-x');
  }

  console.log('== 状态面板装备栏空槽候选(可装备/等级不足联动) ==');
  {
    const sc = W.Char.create('状态候选', 'human', 'warrior');
    sc.level = 5;
    sc.equipment.weapon = null; // 卸下初始木棍,让武器槽空出(展示霜之哀伤候选)
    sc.equipment.chest = null;  // 卸下初始亚麻布衣,让胸甲槽空出(展示硬皮护甲候选)
    sc.inventory.push({ id: 'a_leather', count: 1 }, { id: 'w_frostmourne', count: 1 });
    W.State.newCharacter(sc);
    W.World.showWorld();
    W.World.openStatus();
    const st = text('.modal-body');
    check('装备栏空槽显示可装备候选(硬皮护甲)', st.includes('可装备'), st.slice(0, 200));
    check('装备栏空槽显示等级不足(霜之哀伤需要60级)', st.includes('需要60级'), st.slice(0, 200));
    check('装备区有直达背包按钮', !!doc.querySelector('[data-open-bag]'));
    const chestBtn = doc.querySelector('[data-eq-from-bag="chest:a_leather:0"]');
    check('可装备候选带直接装备按钮', !!chestBtn);
    if (chestBtn) {
      chestBtn.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
      check('状态面板直接装备成功(胸甲槽)', sc.equipment.chest === 'a_leather', JSON.stringify(sc.equipment));
      check('装备后该槽候选按钮消失', !doc.querySelector('[data-eq-from-bag^="chest:"]'));
      check('装备后显示为已装备行(含卸下)', text('.modal-body').includes('卸下'));
      check('等级不足候选仍提示(霜之哀伤)', text('.modal-body').includes('需要60级'));
    }
    click('.close-x');
  }

  console.log('== 饰品双槽(装备/状态/锻造附魔) ==');
  {
    const tc2 = W.Char.create('饰者', 'human', 'warrior');
    tc2.level = 20;
    tc2.gold = 999999;
    tc2.inventory.push({ id: 'tr_brass_charm', count: 1 }, { id: 'tr_might_signet', count: 1 }, { id: 'm_dust', count: 20 }, { id: 'm_essence', count: 20 });
    W.State.newCharacter(tc2);
    W.World.showWorld();
    click('[data-act="bag"]');
    check('背包显示饰品物品', text('.modal-body').includes('猛击徽章') && text('.modal-body').includes('黄铜护符'));
    click('[data-use="tr_might_signet"]');
    check('饰品装备到trinket1', tc2.equipment.trinket1 === 'tr_might_signet', JSON.stringify(tc2.equipment));
    check('已装备饰品显示已装备标签(不占背包)', text('.modal-body').includes('已装备'));
    click('[data-use="tr_brass_charm"]');
    check('第二件饰品装备到trinket2', tc2.equipment.trinket2 === 'tr_brass_charm', JSON.stringify(tc2.equipment));
    click('.close-x');
    W.World.openStatus();
    const st2 = text('.modal-body');
    check('状态面板含饰品槽位行', st2.includes('饰品') && st2.includes('猛击徽章') && st2.includes('黄铜护符'));
    click('.close-x');
    click('[data-act="forge"]');
    const keenApply = doc.querySelector('[data-enchant-apply="tr_might_signet:e_keen"]');
    check('锻造铺饰品可附魔(敏锐)', !!keenApply);
    if (keenApply) {
      keenApply.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
      check('饰品附魔成功(敏锐)', (W.Char.Forge.get(tc2, 'tr_might_signet') || {}).enchant === 'e_keen');
    }
    click('.close-x');
  }

  console.log('== 副手物品(首件)装备/状态 ==');
  {
    const oh = W.Char.create('学者', 'human', 'mage');
    oh.level = 60;
    oh.inventory.push({ id: 'w_gandling_book', count: 1 });
    W.State.newCharacter(oh);
    W.World.showWorld();
    click('[data-act="bag"]');
    const useBtn = doc.querySelector('[data-use="w_gandling_book"]');
    check('背包显示副手物品', !!useBtn && text('.modal-body').includes('加丁的黑暗密典'));
    if (useBtn) {
      useBtn.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
      check('副手装备到offhand槽', oh.equipment.offhand === 'w_gandling_book', JSON.stringify(oh.equipment));
      check('已装备副手显示已装备标签(不占背包)', text('.modal-body').includes('已装备'));
      const bareOh = W.Char.create('裸', 'human', 'mage');
      bareOh.level = 60;
      check('副手属性计入(智力+12)', W.Char.computed(oh).int - W.Char.computed(bareOh).int >= 12);
    }
    click('.close-x');
    W.World.openStatus();
    check('状态面板含副手槽位行', text('.modal-body').includes('副手') && text('.modal-body').includes('加丁的黑暗密典'));
    click('.close-x');
  }

  console.log('== 已装备物品分解/出售 ==');
  {
    const es = W.Char.create('装备处理', 'human', 'warrior');
    es.level = 20;
    es.equipment.weapon = 'w_warblade';
    es.equipment.boots = 'a_steel_boots';
    es.equipment.chest = 'a_plate';
    const esc = W.Char.computed(es);
    es.hp = esc.hpMax; es.hpMax = esc.hpMax;
    W.State.newCharacter(es);
    W.World.showWorld();
    W.World.openStatus();
    check('状态面板已装备行有出售按钮', !!doc.querySelector('[data-sell-eq="boots"]'));
    check('状态面板已装备行有分解按钮(蓝装)', !!doc.querySelector('[data-de-eq="weapon"]'));
    check('白色装备不显示分解按钮', !doc.querySelector('[data-de-eq="chest"]'));
    const g0 = es.gold;
    click('[data-sell-eq="boots"]');
    await sleep(60);
    check('已装备出售成功(金币入账)', !es.equipment.boots && es.gold > g0);
    check('分解按钮仍显示(未售武器)', !!doc.querySelector('[data-de-eq="weapon"]'));
    click('[data-de-eq="weapon"]');
    await sleep(60);
    check('已装备分解成功(槽位清空+材料入账)', !es.equipment.weapon && W.Char.Inventory.count(es, 'm_dust') > 0);
    click('.close-x');
  }

  console.log('== 60 级新区域(荆棘谷/黑石深渊) ==');
  {
    // 等级锁:20 级在燃烧平原无法进入黑石深渊
    const lo = W.Char.create('低等级', 'human', 'warrior');
    lo.level = 20;
    W.State.newCharacter(lo);
    lo.zone = 'burning';
    W.World.showWorld();
    W.World.openTravel();
    const brdLocked = doc.querySelector('.travel-row[data-zone="blackrock_depths"]');
    check('20级进入黑石深渊被锁定(等级不足)', !!brdLocked && brdLocked.classList.contains('locked'));
    // 60 级角色:暮色森林 → 荆棘谷
    const tc = W.Char.create('旅行者', 'human', 'warrior');
    tc.level = 60;
    // 60 级角色配高等级装备(裸装打副本波次过于脆弱,易受 RNG 影响)
    tc.equipment = {
      weapon: 'w_frostmourne', offhand: 'w_gandling_book', head: 'a_emerald_drake_helm', chest: 'a_necropolis_plate',
      legs: 'a_searing_legs', boots: 'a_badlands_boots', gloves: 'a_winter_gloves', cloak: 'a_winter_cloak',
      neck: 'a_silithus_neck', ring1: 'a_silithus_ring', ring2: 'a_silithus_ring',
      trinket1: 'tr_kelthuzad_heart', trinket2: 'tr_abyssal_signet',
    };
    const tcC = W.Char.computed(tc);
    tc.hp = tcC.hpMax; tc.hpMax = tcC.hpMax; tc.mana = tcC.manaMax; tc.manaMax = tcC.manaMax;
    W.State.newCharacter(tc);
    tc.zone = 'duskwood';
    W.World.showWorld();
    W.World.openTravel();
    const tr1 = text('.modal-body');
    check('暮色森林旅行面板显示荆棘谷(18-26)', tr1.includes('荆棘谷') && tr1.includes('18-26'));
    check('旅行面板标注当前所在', tr1.includes('当前所在'));
    const stvRow = doc.querySelector('.travel-row[data-zone="stv"]');
    check('荆棘谷可出发(未锁定)', !!stvRow && !stvRow.classList.contains('locked'));
    stvRow.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    await sleep(30);
    check('旅行至荆棘谷', W.State.character.zone === 'stv' && text('.zone-name').includes('荆棘谷'));
    // 燃烧平原 → 黑石深渊入口
    tc.zone = 'burning';
    W.World.showWorld();
    W.World.openTravel();
    const tr2 = text('.modal-body');
    check('燃烧平原旅行面板显示黑石深渊(44-52)', tr2.includes('黑石深渊') && tr2.includes('44-52'));
    const brdRow = doc.querySelector('.travel-row[data-zone="blackrock_depths"]');
    check('60级黑石深渊未锁定', !!brdRow && !brdRow.classList.contains('locked'));
    brdRow.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    await sleep(30);
    check('进入黑石深渊入口(设置副本状态)', W.State.character.zone === 'blackrock_depths' && W.State.character.dungeon && W.State.character.dungeon.id === 'blackrock_depths');
    check('黑石深渊区域显示', text('.zone-name').includes('黑石深渊'));
    // 前 2 波战斗
    for (const wave of [0, 1]) {
      W.World._dungeonNext();
      check(`黑石深渊第 ${wave + 1} 波进入战斗`, doc.getElementById('view-battle').classList.contains('active'));
      const bb = W.Combat.battle;
      let g = 0;
      while (!bb.ended && g++ < 90) { clickBestSkill(); await sleep(20); }
      check(`黑石深渊第 ${wave + 1} 波胜利`, bb.victory, `ended=${bb.ended}`);
      if (!bb.victory) break;
      await sleep(400);
      const cont = doc.querySelector('[data-continue]');
      check(`结算弹窗出现(黑石深渊波${wave + 1})`, !!cont);
      if (cont) cont.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
      await sleep(60);
    }
    W.State.character.dungeon = null;
  }

  console.log('== 稀有精英提示 ==');
  {
    const ec = W.Char.create('猎星者', 'human', 'warrior');
    ec.level = 30;
    W.State.newCharacter(ec);
    ec.zone = 'stv';
    W.World.showWorld();
    const zp = text('.zone-elites');
    check('区域面板显示稀有精英已刷新', zp.includes('血帆海盗船长') && zp.includes('已刷新'), zp);
    // 击杀后显示倒计时
    ec.elites.stv_elite = Date.now();
    W.World.render();
    const zp2 = text('.zone-elites');
    check('击杀后显示刷新倒计时', zp2.includes('血帆海盗船长') && zp2.includes('刷新') && /\d{2}:\d{2}/.test(zp2), zp2);
    // 刷新完成后重新显示已刷新
    ec.elites.stv_elite = Date.now() - W.Config.ELITE_RESPAWN_MS - 1000;
    W.World.render();
    check('刷新完成后重新提示已刷新', text('.zone-elites').includes('已刷新'));
    // 旅行面板稀有徽标
    ec.zone = 'duskwood';
    W.World.showWorld();
    W.World.openTravel();
    const tr = text('.modal-body');
    check('旅行面板为荆棘谷标注稀有徽标', tr.includes('🔥 稀有精英出没'), tr);
    click('.close-x');
    // 主城无精英提示
    ec.zone = 'stormwind';
    W.World.showWorld();
    check('主城无稀有精英行', !doc.querySelector('.zone-elites'));
  }

  console.log('== 极品装备与任务扩充 ==');
  {
    const pc = W.Char.create('极品种草', 'human', 'warrior');
    W.State.newCharacter(pc);
    W.Char.Inventory.add(pc, 'w_warblade', 1, { perf: true });
    W.World.showWorld();
    W.World.openBag();
    const bg = text('.modal-body');
    check('背包显示极品标签', bg.includes('✨ 极品'), bg);
    check('背包显示极品强化属性(伤害 33-51)', bg.includes('33-51'), bg);
    check('背包提示已装备不占格', text('.bag-info').includes('已装备 2 件不占背包'), text('.bag-info'));
    const equipBtn = doc.querySelector('[data-use="w_warblade"]');
    check('极品装备按钮携带 perf 标记', !!equipBtn && equipBtn.dataset.perf === '1');
    equipBtn.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    await sleep(30);
    click('.close-x');
    W.World.openStatus();
    check('状态面板显示极品标签', text('.modal-body').includes('极品'));
    click('.close-x');
    // 任务板:西郡新任务
    pc.zone = 'westfall';
    W.World.showWorld();
    W.World.openQuestBoard();
    const qb = text('.modal-body');
    check('任务板显示新增任务(豺狼人的围攻)', qb.includes('豺狼人的围攻') && qb.includes('收割者的威胁'), qb);
    click('.close-x');
  }

  console.log('== 触屏滑动:天赋树切换专精 ==');
  {
    const sc = W.Char.create('滑屏者', 'human', 'mage');
    sc.level = 12;
    const cc = W.Char.computed(sc);
    sc.hp = cc.hpMax; sc.hpMax = cc.hpMax; sc.mana = cc.manaMax; sc.manaMax = cc.manaMax;
    W.State.newCharacter(sc);
    W.World.showWorld();
    click('[data-act="talents"]');
    check('天赋滑动提示渲染', !!doc.querySelector('.swipe-hint'));
    const tab0 = doc.querySelector('.talent-tab.active');
    check('初始专精标签激活', !!tab0);
    const swipe = (el, x1, y1, x2, y2) => {
      el.dispatchEvent(new window.MouseEvent('pointerdown', { clientX: x1, clientY: y1, bubbles: true }));
      el.dispatchEvent(new window.MouseEvent('pointermove', { clientX: (x1 + x2) / 2, clientY: (y1 + y2) / 2, bubbles: true }));
      el.dispatchEvent(new window.MouseEvent('pointerup', { clientX: x2, clientY: y2, bubbles: true }));
    };
    const before = tab0.dataset.tree;
    swipe(doc.querySelector('.talent-tree'), 300, 200, 150, 205);
    const after = doc.querySelector('.talent-tab.active').dataset.tree;
    check('左滑切换专精', after !== before, `${before} → ${after}`);
    check('切换后节点渲染', doc.querySelectorAll('.talent-node').length > 0);
    // 滑动后 400ms 内点击被抑制(防误触学习)
    // 注意:jsdom 无指针捕获语义,此处只能验证抑制逻辑;「指针捕获把容器内按钮 click 重定向」
    // 这类真实浏览器缺陷需用真实输入(CDP)回归,切勿把 _bindSwipe 的捕获改回 pointerdown 即捕获
    const learnable = doc.querySelector('.talent-node.learnable');
    if (learnable) {
      const rankBefore = W.Char.rankOf(sc, learnable.dataset.tree, learnable.dataset.talent);
      learnable.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
      check('滑动后节点点击被抑制', W.Char.rankOf(sc, learnable.dataset.tree, learnable.dataset.talent) === rankBefore);
    } else {
      check('滑动后无可用节点(跳过抑制检查)', true);
    }
    swipe(doc.querySelector('.talent-tree'), 120, 210, 280, 205);
    check('右滑切回上一系', doc.querySelector('.talent-tab.active').dataset.tree === before);
    click('.close-x');
  }

  console.log('== 触屏滑动:技能书分页 ==');
  {
    const pc = W.Char.create('翻页者', 'human', 'mage');
    pc.level = 20;
    for (const sid of D.CLASSES.mage.skills) {
      const s = D.SKILLS[sid];
      if (s && s.learn <= pc.level && !pc.learnedSkills.includes(sid)) pc.learnedSkills.push(sid);
    }
    const cc = W.Char.computed(pc);
    pc.hp = cc.hpMax; pc.hpMax = cc.hpMax; pc.mana = cc.manaMax; pc.manaMax = cc.manaMax;
    const oldPageSize = W.Config.SKILL_PAGE_SIZE;
    W.Config.SKILL_PAGE_SIZE = 3; // 强制多页验证翻页
    W.State.newCharacter(pc);
    W.World.showWorld();
    click('[data-act="skills"]');
    const pages = doc.querySelectorAll('.skill-page');
    const rows = doc.querySelectorAll('.skill-row').length;
    check('技能行完整渲染', rows >= 6, `rows=${rows}`);
    check('技能书分页渲染', pages.length === Math.ceil(rows / 3), `pages=${pages.length} rows=${rows}`);
    check('第一页默认激活', doc.querySelector('.skill-page.active').dataset.page === '0');
    check('页码指示点渲染', doc.querySelectorAll('.skill-dot').length === pages.length);
    check('翻页滑动提示渲染', !!doc.querySelector('.skill-hint'));
    const sSwipe = (x1, x2) => {
      const el = doc.querySelector('.skill-pages');
      el.dispatchEvent(new window.MouseEvent('pointerdown', { clientX: x1, clientY: 300, bubbles: true }));
      el.dispatchEvent(new window.MouseEvent('pointermove', { clientX: (x1 + x2) / 2, clientY: 302, bubbles: true }));
      el.dispatchEvent(new window.MouseEvent('pointerup', { clientX: x2, clientY: 305, bubbles: true }));
    };
    sSwipe(300, 150);
    check('左滑翻到第二页', doc.querySelector('.skill-page.active').dataset.page === '1');
    check('页码指示同步', doc.querySelector('.skill-dot.active').dataset.page === '1');
    sSwipe(120, 280);
    check('右滑回到第一页', doc.querySelector('.skill-page.active').dataset.page === '0');
    const dot2 = doc.querySelector('.skill-dot[data-page="2"]');
    if (dot2) {
      dot2.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
      check('点击页码跳页', doc.querySelector('.skill-page.active').dataset.page === '2');
    }
    click('.close-x');
    W.Config.SKILL_PAGE_SIZE = oldPageSize;
    // 单页时隐藏翻页控件(8 技能法师按默认每页 8 条恰好单页)
    click('[data-act="skills"]');
    check('单页技能书不渲染翻页控件', !doc.querySelector('.skill-nav') && !doc.querySelector('.skill-hint'));
    click('.close-x');
  }

  console.log('== 世界首领挑战流程 ==');
  {
    const wbChar = W.Char.create('卡扎克猎手', 'human', 'warrior');
    wbChar.level = 60;
    wbChar.equipment = {
      weapon: 'w_frostmourne', offhand: 'w_gandling_book', head: 'a_emerald_drake_helm', chest: 'a_necropolis_plate',
      legs: 'a_searing_legs', boots: 'a_badlands_boots', gloves: 'a_winter_gloves', cloak: 'a_winter_cloak',
      neck: 'a_silithus_neck', ring1: 'a_silithus_ring', ring2: 'a_silithus_ring',
      trinket1: 'tr_kelthuzad_heart', trinket2: 'tr_abyssal_signet',
    };
    for (const bd of D.TALENT_BUILDS.warrior) W.Char.applyBuild(wbChar, bd);
    const wbc = W.Char.computed(wbChar);
    wbChar.hp = wbc.hpMax; wbChar.hpMax = wbc.hpMax; wbChar.mana = wbc.manaMax; wbChar.manaMax = wbc.manaMax;
    wbChar.zone = 'burning';
    W.State.character = wbChar;
    W.World.showWorld();
    check('世界首领面板渲染(挑战按钮)', !!doc.querySelector('.world-boss .wb-btn'));
    check('世界首领面板含卡扎克与稀有标签', text('.world-boss').includes('卡扎克') && text('.world-boss').includes('世界首领'));
    // 旅行面板世界首领出没指示
    click('[data-act="travel"]');
    await sleep(40);
    check('旅行面板标注世界首领出没', doc.querySelectorAll('.tz-elite.wb').length >= 1);
    click('.close-x');
    await sleep(60);
    // 挑战世界首领
    click('[data-act="worldboss"]');
    await sleep(40);
    check('世界首领战进入战斗界面', doc.getElementById('view-battle').classList.contains('active'));
    check('敌人卡牌带世界首领标签', text('.enemy-card').includes('世界首领'));
    const wbb = W.Combat.battle;
    let guard = 0;
    while (!wbb.ended && guard++ < 200) {
      clickBestSkill();
      await sleep(15);
    }
    check('世界首领战正常结算', wbb.ended, 'ended=' + wbb.ended);
    console.log(`  世界首领战: ${wbb.victory ? '胜利 ✅' : '落败'} ${wbb.round} 回合`);
    check('击杀后记录刷新时间', wbb.victory && wbChar.worldBosses && wbChar.worldBosses.kazzak,
      `victory=${wbb.victory} wb=${JSON.stringify(wbChar.worldBosses)}`);
    if (wbb.victory) {
      await sleep(200);
      const cont = doc.querySelector('[data-continue]');
      if (cont) cont.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
      await sleep(80);
      W.World.showWorld();
      check('世界首领显示重新现身倒计时', /已被击败|重新现身/.test(text('.world-boss')));
    }
  }

  console.log('== 深入敌营 · 敌方主城限定突袭 ==');
  {
    // 部落角色身处暴风城:渲染限定突袭卡片
    const crChar = W.Char.create('突袭者', 'orc', 'warrior');
    crChar.level = 45;
    crChar.equipment = {
      weapon: 'w_drakkisath_axe', offhand: null, head: 'a_drakkisath_plate', chest: 'a_dragonscale',
      legs: 'a_blackrock_helm', boots: 'a_burning_boots', gloves: 'a_badlands_plate', cloak: 'a_winter_cloak',
      neck: 'a_silithus_neck', ring1: 'a_silithus_ring', ring2: 'a_silithus_ring',
    };
    const crc = W.Char.computed(crChar);
    crChar.hp = crc.hpMax; crChar.hpMax = crc.hpMax; crChar.mana = crc.manaMax; crChar.manaMax = crc.manaMax;
    crChar.zone = 'stormwind';
    W.State.newCharacter(crChar);
    W.World.showWorld();
    check('深入敌营卡片渲染(限定标签+突袭按钮)', !!doc.querySelector('.capital-raid .cr-btn') && text('.capital-raid').includes('深入敌营') && text('.capital-raid').includes('限定'));
    check('卡片标注奖励(声望+水晶+金币)', text('.capital-raid').includes('奥术水晶') && text('.capital-raid').includes('声望'));
    // 联盟角色身处暴风城(自己的主城):不渲染卡片
    const allyInOwn = W.Char.create('守卫军', 'human', 'warrior');
    allyInOwn.level = 45; allyInOwn.zone = 'stormwind';
    W.State.newCharacter(allyInOwn);
    W.World.showWorld();
    check('自己的主城不显示突袭卡片', !doc.querySelector('.capital-raid'));
    // 回到部落角色:发起突袭
    W.State.newCharacter(crChar);
    W.World.showWorld();
    click('[data-act="capital-raid"]');
    await sleep(60);
    check('突袭进入战斗界面', doc.getElementById('view-battle').classList.contains('active'));
    check('第一波城防卫兵上阵', text('.enemy-card').includes('暴风城卫兵'));
    // 通关第一波
    const crb = W.Combat.battle;
    let crg = 0;
    while (!crb.ended && crg++ < 200) {
      clickBestSkill();
      await sleep(15);
    }
    check('第一波突袭战结算', crb.ended, 'ended=' + crb.ended);
    if (crb.victory) {
      await sleep(500);
      const cont = doc.querySelector('[data-continue]');
      check('突袭胜利弹窗(继续深入)', !!cont && text('#modal-root').includes('突袭进度'));
      if (cont) cont.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
      await sleep(500);
      check('第二波皇家卫队上阵', crChar.capitalRaid && crChar.capitalRaid.wave === 1 && text('.enemy-card').includes('暴风城卫队长'));
      // 突袭战(副本模式)无法逃跑:逃跑被拒,进度保留
      click('[data-act="flee"]');
      await sleep(250);
      check('突袭战中无法逃跑(进度保留)', crChar.capitalRaid && crChar.capitalRaid.wave === 1 && !W.Combat.battle.ended);
      // 打赢第二波 → 撤离按钮 → 放弃进度(回归:撤离路径曾遗留 capitalRaid 导致按钮静默失效)
      const crb2 = W.Combat.battle;
      let crg2 = 0;
      while (!crb2.ended && crg2++ < 200) {
        clickBestSkill();
        await sleep(15);
      }
      if (crb2.victory) {
        await sleep(500);
        const backBtn = doc.querySelector('[data-back]');
        check('撤离按钮存在于胜利弹窗', !!backBtn);
        if (backBtn) backBtn.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
        await sleep(100);
        check('撤离后突袭进度清空', crChar.capitalRaid === null && (!crChar.capitalRaids || !crChar.capitalRaids.stormwind));
      } else {
        check('撤离按钮存在于胜利弹窗(跳过分支)', false, 'wave2 落败');
      }
    }
    // 低于最低等级:按钮锁定
    const lowChar = W.Char.create('新兵', 'orc', 'warrior');
    lowChar.level = 39; lowChar.zone = 'stormwind';
    W.State.newCharacter(lowChar);
    W.World.showWorld();
    const crLocked = doc.querySelector('.capital-raid .cr-btn');
    check('低于 40 级突袭按钮锁定', !!crLocked && crLocked.disabled);
  }

  console.log('== 锻造铺UI(材料合成/装备打造) ==');
  {
    const fc2 = W.Char.create('锻造师二代', 'human', 'warrior');
    fc2.level = 60;
    fc2.gold = 999999;
    fc2.inventory.push({ id: 'm_dust', count: 20 }, { id: 'm_essence', count: 20 }, { id: 'm_crystal', count: 10 });
    const c2 = W.Char.computed(fc2);
    fc2.hp = c2.hpMax; fc2.hpMax = c2.hpMax; fc2.mana = c2.manaMax; fc2.manaMax = c2.manaMax;
    W.State.newCharacter(fc2);
    W.World.showWorld();
    click('[data-act="forge"]');
    check('锻造铺含合成区', !!doc.querySelector('.synth-head'));
    check('锻造铺含打造区', !!doc.querySelector('.craft-head'));
    const synthEssence = doc.querySelector('[data-synth="m_essence"]');
    check('合成精华按钮存在', !!synthEssence);
    if (synthEssence) {
      synthEssence.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
      check('合成精华成功(+1)', W.Char.Inventory.count(fc2, 'm_essence') === 21 && W.Char.Inventory.count(fc2, 'm_dust') === 15);
    }
    const craftBtn = doc.querySelector('[data-craft="craft_doom"]');
    check('打造按钮存在(末日战斧)', !!craftBtn);
    if (craftBtn) {
      craftBtn.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
      check('打造成功获得装备', W.Char.Inventory.count(fc2, 'w_doom_cleaver') === 1);
    }
    const craftEpic = doc.querySelector('[data-craft="craft_rivendare"]');
    check('史诗打造按钮渲染', !!craftEpic);
  }

  console.log('== 套装面板 ==');
  {
    const sc = W.Char.create('套装侠', 'human', 'warrior');
    sc.level = 60;
    sc.equipment.head = 'a_mc_crown';
    sc.equipment.chest = 'a_mc_plate';
    sc.equipment.gauntlets = 'a_mc_gauntlets';
    sc.equipment.legs = 'a_mc_leggings';
    sc.equipment.boots = 'a_mc_boots';
    sc.equipment.weapon = 'w_ragnaros_hand';
    const scC = W.Char.computed(sc);
    sc.hp = scC.hpMax; sc.hpMax = scC.hpMax; sc.mana = scC.manaMax; sc.manaMax = scC.manaMax;
    W.State.newCharacter(sc);
    W.World.showWorld();
    click('[data-act="status"]');
    check('状态面板含套装区块', !!doc.querySelector('.set-list'));
    check('套装名显示(熔火之魂)', /熔火之魂/.test(doc.querySelector('.set-list').textContent));
    check('套装件数标签 6/6', /6\/6 件/.test(doc.querySelector('.set-list').textContent));
    const ons = doc.querySelectorAll('.set-bonus.on').length;
    check('两档加成均激活', ons === 2, `on=${ons}`);
    // 背包行套装标记(背包中放入一件套件装备)
    W.Char.Inventory.add(sc, 'a_mc_boots', 1);
    click('[data-act="bag"]');
    const setMark = doc.querySelector('.item-set');
    check('背包行显示套装标记', !!setMark);
    if (setMark)    check('背包套装标记含件数', /6\/6/.test(setMark.textContent));
    check('背包套装标记含套装名', setMark && /熔火之魂/.test(setMark.textContent));


    // ===== 中期套装状态面板展示(荆棘谷猎手 3 件) =====
    const mid = W.Char.create('中期面板', 'human', 'rogue');
    mid.level = 26;
    mid.equipment.weapon = 'w_stv_cutlass';
    mid.equipment.chest = 'a_stv_chest';
    mid.equipment.ring1 = 'a_stv_ring';
    const midC = W.Char.computed(mid);
    mid.hp = midC.hpMax; mid.hpMax = midC.hpMax; mid.mana = midC.manaMax; mid.manaMax = midC.manaMax;
    W.State.newCharacter(mid);
    W.World.showWorld();
    click('[data-act="status"]');
    check('状态面板含中期套装名', /荆棘谷猎手/.test(doc.querySelector('.set-list').textContent));
    check('中期套装件数标签 3/5', /3\/5 件/.test(doc.querySelector('.set-list').textContent));
    const midOn = doc.querySelectorAll('.set-bonus.on').length;
    check('中期套装 3 件激活 2 档', midOn === 2, 'on=' + midOn);
  }

  console.log('== 成就面板 ==');
  {
    const ac = W.Char.create('成就展示', 'human', 'warrior');
    ac.level = 60;
    ac.gold = 100000;
    ac.inventory.push({ id: 'm_dust', count: 50 }, { id: 'm_essence', count: 50 }, { id: 'm_crystal', count: 30 });
    ac.equipment.head = 'a_mc_crown';
    ac.equipment.chest = 'a_mc_plate';
    ac.equipment.gauntlets = 'a_mc_gauntlets';
    ac.equipment.legs = 'a_mc_leggings';
    ac.equipment.boots = 'a_mc_boots';
    ac.equipment.weapon = 'w_ragnaros_hand';
    W.Char.Achievements.trigger(ac, 'dungeon', { mark: 'deadmines' });
    W.Char.Achievements.trigger(ac, 'dungeon', { mark: 'molten_core' });
    W.Char.Achievements.checkSpecial(ac);
    const acC = W.Char.computed(ac);
    ac.hp = acC.hpMax; ac.hpMax = acC.hpMax; ac.mana = acC.manaMax; ac.manaMax = acC.manaMax;
    W.State.newCharacter(ac);
    W.World.showWorld();
    const achBtn = doc.querySelector('[data-act="ach"]');
    check('成就按钮存在', !!achBtn);
    click('[data-act="ach"]');
    const panel = doc.querySelector('.ach-panel');
    check('成就面板打开', !!panel);
    if (panel) {
      check('面板含汇总(已达成)', /已达成/.test(panel.textContent));
      check('分类标题渲染(副本/锻造)', /副本系成就/.test(panel.textContent) && /锻造系成就/.test(panel.textContent));
      const doneRows = panel.querySelectorAll('.ach-row.done').length;
      check('已解锁成就标亮', doneRows >= 3, 'done=' + doneRows);
      check('未解锁含进度条', !!panel.querySelector('.ach-progress'));
      check('奖励文案展示', /金币/.test(panel.textContent));
      check('成就面板团本标记(烈焰之子)', !!panel.querySelector('.ach-row .raid-tag'));
      check('成就面板5人本标记(初次试炼)', !!panel.querySelector('.ach-row .d5-tag'));
      check('成就面板标记文案(团本/5人本)', /团本/.test(panel.textContent) && /5人本/.test(panel.textContent));
      // 副本直达按钮:多副本成就跳首个未通关(60级时哀嚎洞穴Lv13),指定副本成就直达
      const goBtns = panel.querySelectorAll('[data-ach-go]');
      check('成就直达按钮渲染(≥3)', goBtns.length >= 3, 'n=' + goBtns.length);
      const firstGo = panel.querySelector('[data-ach-go="wailing_caverns"]');
      check('多副本成就直达首个未通关(哀嚎洞穴)', !!firstGo);
      check('直达按钮含推荐等级角标(哀嚎Lv13)', !!firstGo && firstGo.textContent.includes('Lv.13'), firstGo ? firstGo.textContent : '无');
      const mcBtn = panel.querySelector('[data-ach-go="molten_core"]');
      check('熔火之心成就直达按钮存在', !!mcBtn);
      check('直达按钮含推荐等级角标(熔火Lv60)', !!mcBtn && mcBtn.textContent.includes('Lv.60'), mcBtn ? mcBtn.textContent : '无');
      check('等级达标按钮非锁定态', !!mcBtn && !mcBtn.classList.contains('locked'));
      if (mcBtn) {
        mcBtn.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
        check('点击直达熔火之心区域并进入副本', W.State.character.zone === 'molten_core' && W.State.character.dungeon && W.State.character.dungeon.id === 'molten_core',
          W.State.character.zone + '/' + JSON.stringify(W.State.character.dungeon));
        check('直达后成就面板关闭', !doc.getElementById('modal-root').classList.contains('show'));
        check('直达后进入副本世界视图', doc.getElementById('view-world').classList.contains('active'));
      }
    }
  }

  console.log('== 满级经验隐藏 + 副本首领序列 ==');
  {
    const mx = W.Char.create('巅峰', 'human', 'warrior');
    mx.level = 60;
    W.State.newCharacter(mx);
    W.World.showWorld();
    check('满级世界视图显示巅峰标识', text('.wh-maxlv').includes('满级 Lv.60'));
    check('满级世界视图隐藏经验条', !doc.querySelector('.wh-expbar'));
    mx.exp = 500; // 试图塞入经验
    W.Char.addExp(mx, 1000);
    check('满级 addExp 后经验恒为 0', mx.exp === 0, 'exp=' + mx.exp);
    check('满级不再升级', mx.level === 60);
    // 副本首领序列渲染(熔火之心 9 首领:战斗流程预览/首领图鉴)
    check('熔火之心注册 9 首领序列', W.Data.DUNGEONS.molten_core.bosses.length === 9);
    check('死亡矿井注册 5 首领序列', W.Data.DUNGEONS.deadmines.bosses.length === 5);
    check('中途首领带精英标记', W.Data.MONSTERS.lucifron && W.Data.MONSTERS.lucifron.elite === 1 && W.Data.MONSTERS.lucifron.sub === 1);
    check('奥妮克希亚单首领成阵', W.Data.DUNGEONS.onyxias_lair.bosses.length === 1 && W.Data.DUNGEONS.onyxias_lair.bosses[0] === 'onyxia');
    // 新地图悬赏/副本讨伐任务数据
    check('地图悬赏任务已接入任务板', Object.keys(W.Data.ZONES).some((z) => (W.Data.ZONES[z].quests || []).some((q) => String(q).startsWith('q_map_'))));
    check('副本讨伐任务已接入任务板', Object.keys(W.Data.ZONES).some((z) => (W.Data.ZONES[z].quests || []).some((q) => String(q).startsWith('q_dg_'))));
  }

  console.log('== 成就直达等级门槛 ==');
  {
    const low = W.Char.create('低等', 'human', 'warrior');
    low.level = 10;
    W.State.newCharacter(low);
    W.World.showWorld();
    W.World.openAchievements();
    const mcLow = doc.querySelector('[data-ach-go="molten_core"]');
    check('低等级成就直达按钮仍显示(熔火之心)', !!mcLow);
    check('低等级按钮带锁定角标(🔒 Lv.60)', !!mcLow && mcLow.classList.contains('locked') && mcLow.textContent.includes('Lv.60'), mcLow ? mcLow.textContent : '无');
    if (mcLow) {
      mcLow.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
      check('低等级点击提示不传送', low.zone === 'elwynn' && !low.dungeon, low.zone + '/' + JSON.stringify(low.dungeon));
      check('低等级点击成就面板保持打开', doc.getElementById('modal-root').classList.contains('show'));
    }
    click('.close-x');
  }

  console.log('== 成就搜索筛选 ==');
  {
    const fc = W.Char.create('筛选侠', 'human', 'warrior');
    fc.gold = 5000;
    W.Char.Achievements.trigger(fc, 'dungeon', { mark: 'deadmines' });
    fc.level = 20; // trigger 会发放经验,等级需在触发后设置
    W.State.newCharacter(fc);
    W.World.showWorld();
    W.World.openAchievements();
    const toolbar = doc.querySelector('.ach-toolbar');
    check('成就面板搜索栏存在', !!doc.querySelector('.ach-search'));
    check('成就面板筛选工具栏存在', !!toolbar && !!doc.querySelector('.ach-chips'));
    check('筛选芯片含未完成/团本/可直达', /未完成/.test(text('[data-ach-done="todo"]')) && /团本/.test(text('[data-ach-raid="1"]')) && /可直达/.test(text('[data-ach-reach="1"]')));
    check('未完成芯片计数正确(37)', text('[data-ach-done="todo"]').indexOf('37') >= 0, text('[data-ach-done="todo"]'));
    check('可直达芯片计数正确(7)', text('[data-ach-reach="1"]').indexOf('7') >= 0, text('[data-ach-reach="1"]'));
    // 搜索过滤:输入「熔火」只剩烈焰之子一行
    const search = doc.querySelector('.ach-search');
    search.value = '熔火';
    search.dispatchEvent(new window.Event('input', { bubbles: true }));
    const qRows = doc.querySelectorAll('.ach-body .ach-row');
    check('搜索「熔火」过滤为 1 行', qRows.length === 1 && qRows[0].textContent.includes('烈焰之子'), 'n=' + qRows.length);
    check('搜索后实时计数联动(全部→1)', text('[data-ach-count="all"]') === '1', text('[data-ach-count="all"]'));
    // 搜索无结果 → 空态提示
    search.value = '不存在的词xyz';
    search.dispatchEvent(new window.Event('input', { bubbles: true }));
    check('搜索无结果空态提示', !!doc.querySelector('.ach-empty'), doc.querySelector('.ach-body').textContent.slice(0, 60));
    // 清空搜索 → 未完成筛选
    search.value = '';
    search.dispatchEvent(new window.Event('input', { bubbles: true }));
    doc.querySelector('[data-ach-done="todo"]').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    const todoRows = doc.querySelectorAll('.ach-body .ach-row');
    check('未完成筛选激活态', doc.querySelector('[data-ach-done="todo"]').classList.contains('active'));
    check('未完成筛选无已解锁行', todoRows.length > 0 && !doc.querySelector('.ach-body .ach-row.done'), 'n=' + todoRows.length);
    check('未完成筛选不含死亡矿井成就(迪菲亚的覆灭)', !doc.querySelector('.ach-body').textContent.includes('迪菲亚的覆灭'));
    // 恢复全部 → 团本筛选
    doc.querySelector('[data-ach-done="all"]').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    doc.querySelector('[data-ach-raid="1"]').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    const raidRows = doc.querySelectorAll('.ach-body .ach-row');
    check('团本筛选恰 5 行', raidRows.length === 5, 'n=' + raidRows.length);
    check('团本筛选行均带团本标记', raidRows.length === 5 && !!doc.querySelector('.ach-body .raid-tag') && !doc.querySelector('.ach-body .d5-tag'));
    // 关团本 → 可直达筛选(20级 = 7 行,全部可点)  
    doc.querySelector('[data-ach-raid="1"]').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    doc.querySelector('[data-ach-reach="1"]').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    const reachRows = doc.querySelectorAll('.ach-body .ach-row');
    check('可直达筛选(20级)恰 7 行', reachRows.length === 7, 'n=' + reachRows.length);
    check('可直达行均无锁定按钮', reachRows.length === 7 && !doc.querySelector('.ach-body .ach-go.locked'));
    check('可直达行均有直达按钮', reachRows.length === 7 && doc.querySelectorAll('.ach-body [data-ach-go]').length === 7);
    // 组合:团本 + 可直达(60级角色全团本可直达 5 行)
    const f60 = W.Char.create('满级侠', 'human', 'warrior');
    f60.level = 60;
    W.State.newCharacter(f60);
    W.World.openAchievements();
    doc.querySelector('[data-ach-raid="1"]').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    doc.querySelector('[data-ach-reach="1"]').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    const combo = doc.querySelectorAll('.ach-body .ach-row');
    check('团本+可直达组合(60级)恰 5 行', combo.length === 5, 'n=' + combo.length);
    click('.close-x');
  }

  console.log(failed === 0 ? '\n🎉 DOM 流程全部通过' : `\n❌ ${failed} 项失败`);
  window.close();
  process.exit(failed === 0 ? 0 : 1);
})().catch((e) => { console.error('测试崩溃:', e); process.exit(1); });
