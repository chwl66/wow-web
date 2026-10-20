/* 魔兽世界 · 战大陆 — 旅行地图（程序化 SVG）
 *
 * 原来的「中转地图」只是一串文字行。这里把它画成真正的图形地图：
 * 三个大陆各自一张 SVG（卡利姆多 / 东部王国 / 外域），
 * 每个区域是一个地形符号 + 名字，连线表示旅行通路。
 *
 * 为什么要按大陆拆三张：33 个区域挤在一张 1000×700 的图里，
 * 缩到手机屏宽（约 340px）后节点只剩十几像素，名字完全看不清。
 * 拆开后每张只需容纳 10~12 个点，缩放到 0.85 倍仍然可读。
 *
 * 坐标是手工排的（数据里只有 travel 连通关系，没有位置信息），
 * 按魔兽世界真实地理的相对方位摆放：卡利姆多在西、东部王国在东、外域单独一块。
 */
(function () {
  'use strict';

  const W = window.WOW || (window.WOW = {});

  /* ---------- 地形符号 ----------
   * 都在以 (0,0) 为中心的 20×20 范围内画，外层用 translate 定位。
   * 比 emoji 好的地方:颜色可控、在深色底上不会糊成一团、不依赖系统字体。 */
  const LAND = {
    forest: (c) =>
      `<path d="M0,-9 L5,-1 L2,-1 L6,5 L-6,5 L-2,-1 L-5,-1 Z" fill="${c.main}"/>` +
      `<path d="M0,-4 L3,2 L-3,2 Z" fill="${c.light}" opacity=".55"/>` +
      `<rect x="-1" y="5" width="2" height="4" fill="${c.dark}"/>`,

    darkwood: (c) =>
      `<path d="M-5,-7 L0,-9 L5,-7 L6,1 L2,6 L-2,6 L-6,1 Z" fill="${c.main}"/>` +
      `<path d="M0,-6 L3,-1 L0,4 L-3,-1 Z" fill="${c.light}" opacity=".4"/>` +
      `<rect x="-1" y="6" width="2" height="3" fill="${c.dark}"/>`,

    mountain: (c) =>
      `<path d="M-9,6 L-2,-8 L4,2 L7,-3 L10,6 Z" fill="${c.main}"/>` +
      `<path d="M-2,-8 L2,-2 L-6,6 L-2,6 Z" fill="${c.light}" opacity=".45"/>` +
      `<path d="M7,-3 L9,1 L5,6 Z" fill="${c.dark}" opacity=".5"/>`,

    snow: (c) =>
      `<path d="M-9,6 L-2,-8 L4,2 L7,-3 L10,6 Z" fill="${c.main}"/>` +
      `<path d="M-2,-8 L1,-3 L-4,1 L-6,6 L-2,6 Z" fill="#fff" opacity=".75"/>` +
      `<path d="M7,-3 L9,0 L6,3 Z" fill="#fff" opacity=".5"/>`,

    desert: (c) =>
      `<path d="M-10,5 C-6,-2 0,-3 4,1 C7,4 9,2 10,5 Z" fill="${c.main}"/>` +
      `<path d="M-10,5 C-6,0 0,-1 4,3 L-10,5 Z" fill="${c.light}" opacity=".5"/>` +
      `<circle cx="6" cy="-5" r="3" fill="${c.light}" opacity=".45"/>`,

    swamp: (c) =>
      `<path d="M-10,2 C-6,-2 0,0 4,-2 C7,-3 9,-1 10,2 L10,6 L-10,6 Z" fill="${c.main}"/>` +
      `<path d="M-7,4 L-3,4 M0,2 L4,2 M-4,6 L2,6" stroke="${c.light}" stroke-width="1.2" opacity=".7"/>` +
      `<path d="M-2,-8 L-2,-2 M-2,-5 L-5,-7 M-2,-5 L1,-7" stroke="${c.dark}" stroke-width="1.4"/>`,

    city: (c) =>
      `<path d="M-8,6 L-8,-3 L-5,-3 L-5,-6 L-2,-6 L-2,-3 L2,-3 L2,-7 L5,-7 L5,-3 L8,-3 L8,6 Z" fill="${c.main}"/>` +
      `<path d="M-5,-3 L-5,6 L-2,6 L-2,-3 Z" fill="${c.light}" opacity=".4"/>` +
      `<rect x="-1" y="1" width="3" height="5" fill="${c.dark}"/>` +
      `<path d="M-6,-8 L-6,-6 M-6.6,-6 L-5.4,-6" stroke="${c.light}" stroke-width="1"/>`,

    volcano: (c) =>
      `<path d="M-9,6 L-3,-7 L3,-7 L9,6 Z" fill="${c.main}"/>` +
      `<path d="M-3,-7 L3,-7 L2,-3 L-2,-3 Z" fill="${c.light}"/>` +
      `<path d="M0,-3 C-2,1 -3,3 -1,6 M1,-3 C3,0 4,3 2,6" stroke="${c.dark}" stroke-width="1.6" fill="none"/>`,

    wasteland: (c) =>
      `<path d="M-9,6 L-5,0 L-1,3 L3,-2 L7,2 L9,6 Z" fill="${c.main}"/>` +
      `<path d="M-5,0 L-1,3 L2,1 L-3,6 L-8,6 Z" fill="${c.dark}" opacity=".45"/>` +
      `<path d="M3,-2 L5,1 L2,4" stroke="${c.light}" stroke-width="1.2" fill="none" opacity=".6"/>`,

    coast: (c) =>
      `<path d="M-9,4 C-5,-1 0,-2 4,0 C7,1 9,4 9,6 L-9,6 Z" fill="${c.main}"/>` +
      `<path d="M-9,6 C-5,3 -1,3 3,5 C6,6 8,6 9,6 Z" fill="${c.light}" opacity=".45"/>` +
      `<path d="M-4,-6 L-4,0 M-4,-4 L-7,-6 M-4,-4 L-1,-6" stroke="${c.dark}" stroke-width="1.3"/>`,

    void: (c) =>
      `<circle cx="0" cy="0" r="7" fill="${c.main}"/>` +
      `<circle cx="0" cy="0" r="4" fill="${c.dark}" opacity=".8"/>` +
      `<circle cx="0" cy="0" r="1.8" fill="${c.light}"/>` +
      `<path d="M-8,-4 A9,9 0 0 1 0,-8" stroke="${c.light}" stroke-width="1.2" fill="none" opacity=".6"/>`,

    island: (c) =>
      `<path d="M-7,3 C-4,-2 2,-3 6,0 C8,1 8,4 6,5 C2,7 -4,7 -7,3 Z" fill="${c.main}"/>` +
      `<path d="M-2,-2 L0,-7 L2,-2 Z" fill="${c.light}"/>` +
      `<path d="M-9,7 C-5,5 5,5 9,7" stroke="${c.light}" stroke-width="1" fill="none" opacity=".5"/>`,
  };

  // 地形配色
  const LAND_COLOR = {
    forest: { main: '#3f7a3a', light: '#5fa04e', dark: '#2a5228' },
    darkwood: { main: '#33523a', light: '#4e7a52', dark: '#1e3324' },
    mountain: { main: '#6a6458', light: '#9a9488', dark: '#443f36' },
    snow: { main: '#8a9aae', light: '#c8d8e8', dark: '#5a6a7a' },
    desert: { main: '#b89a5a', light: '#e0c884', dark: '#8a7038' },
    swamp: { main: '#4a6a4a', light: '#6a8a5a', dark: '#2e442e' },
    city: { main: '#a88a4a', light: '#d8c078', dark: '#6a5228' },
    volcano: { main: '#7a3a2a', light: '#c05a2a', dark: '#4a1e12' },
    wasteland: { main: '#8a6a4a', light: '#b08a5a', dark: '#5a422a' },
    coast: { main: '#3a6a7a', light: '#5a9aae', dark: '#244a56' },
    void: { main: '#5a3a7a', light: '#a06ad0', dark: '#2e1e44' },
    island: { main: '#5a7a4a', light: '#8ab06a', dark: '#3a5230' },
  };

  /* ---------- 区域坐标 ----------
   * x/y 在各自大陆的 viewBox 里。land 决定地形符号。 */
  const ZONE_POS = {
    /* 卡利姆多(西) */
    winterspring: { x: 152, y: 58, land: 'snow' },
    azshara: { x: 268, y: 92, land: 'coast' },
    felwood: { x: 170, y: 120, land: 'darkwood' },
    barrens: { x: 190, y: 190, land: 'wasteland' },
    orgrimmar: { x: 258, y: 208, land: 'city' },
    durotar: { x: 272, y: 245, land: 'wasteland' },
    thousand_needles: { x: 150, y: 262, land: 'mountain' },
    dustwallow: { x: 256, y: 292, land: 'swamp' },
    ungoro: { x: 108, y: 300, land: 'forest' },
    tanaris: { x: 176, y: 334, land: 'desert' },
    silithus: { x: 96, y: 364, land: 'desert' },

    /* 东部王国(东) */
    plaguelands: { x: 238, y: 58, land: 'darkwood' },
    eplaguelands: { x: 302, y: 84, land: 'wasteland' },
    burning: { x: 252, y: 142, land: 'volcano' },
    searing: { x: 208, y: 180, land: 'volcano' },
    badlands: { x: 190, y: 214, land: 'wasteland' },
    redridge: { x: 272, y: 238, land: 'mountain' },
    duskwood: { x: 202, y: 264, land: 'darkwood' },
    elwynn: { x: 256, y: 288, land: 'forest' },
    stormwind: { x: 198, y: 304, land: 'city' },
    westfall: { x: 158, y: 318, land: 'desert' },
    stv: { x: 198, y: 350, land: 'forest' },
    blasted_lands: { x: 260, y: 340, land: 'volcano' },

    /* 外域 */
    bladesedge: { x: 196, y: 78, land: 'mountain' },
    netherstorm: { x: 300, y: 92, land: 'void' },
    zangarmarsh: { x: 128, y: 138, land: 'swamp' },
    shattrath: { x: 198, y: 152, land: 'city' },
    terokkar: { x: 214, y: 192, land: 'forest' },
    nagrand: { x: 146, y: 216, land: 'forest' },
    shadowmoon: { x: 276, y: 214, land: 'darkwood' },
    hellfire: { x: 228, y: 264, land: 'wasteland' },
    caverns_of_time: { x: 178, y: 300, land: 'mountain' },
    quel_danas: { x: 332, y: 244, land: 'island' },
  };

  /* ---------- 大陆轮廓 ----------
   * 手绘的简化形状,只要能把区域"包"进去、有大陆的辨识度即可。
   * 不用真实地图数据:那是矢量素材,和"零资源"的约束冲突。 */
  const CONTINENTS = [
    {
      id: 'kalimdor',
      name: '卡利姆多',
      vb: '40 30 300 360',
      shape:
        'M120,34 C168,20 224,40 246,78 C262,106 250,140 264,168 ' +
        'C278,196 292,228 280,258 C268,288 240,308 214,330 ' +
        'C188,360 150,384 110,378 C82,372 64,346 70,312 ' +
        'C74,278 88,254 84,226 C80,196 66,172 72,142 ' +
        'C78,110 90,78 102,54 C108,44 112,38 120,34 Z',
      zones: ['winterspring', 'azshara', 'felwood', 'barrens', 'orgrimmar', 'durotar',
        'thousand_needles', 'dustwallow', 'ungoro', 'tanaris', 'silithus'],
    },
    {
      id: 'eastern',
      name: '东部王国',
      vb: '130 30 220 360',
      shape:
        'M212,40 C254,30 300,50 314,88 C326,120 314,152 300,178 ' +
        'C288,202 282,230 278,258 C274,288 286,318 278,344 ' +
        'C270,368 238,382 202,378 C166,374 138,378 128,354 ' +
        'C118,330 130,304 138,280 C146,256 150,234 146,210 ' +
        'C142,186 130,170 138,146 C146,122 162,106 168,84 ' +
        'C174,62 190,46 212,40 Z',
      zones: ['plaguelands', 'eplaguelands', 'burning', 'searing', 'badlands', 'redridge',
        'duskwood', 'elwynn', 'stormwind', 'westfall', 'stv', 'blasted_lands'],
    },
    {
      id: 'outland',
      name: '外域',
      vb: '90 50 270 290',
      shape:
        'M124,72 C160,52 200,62 214,92 C226,118 212,142 228,160 ' +
        'C244,178 272,172 292,188 C312,204 320,232 304,256 ' +
        'C288,280 252,294 224,286 C198,278 184,256 164,252 ' +
        'C138,246 108,252 94,228 C80,204 86,174 102,154 ' +
        'C118,134 108,104 124,72 Z',
      zones: ['bladesedge', 'netherstorm', 'zangarmarsh', 'shattrath', 'terokkar',
        'nagrand', 'shadowmoon', 'hellfire', 'caverns_of_time', 'quel_danas'],
    },
  ];

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[m]));

  /* ---------- 渲染 ---------- */

  // 单个区域节点。state: current / direct / transit / visited
  function node(zid, opts) {
    const p = ZONE_POS[zid];
    const Z = (W.Data && W.Data.ZONES && W.Data.ZONES[zid]) || null;
    if (!p || !Z) return '';
    const state = zid === opts.current ? 'current'
      : (opts.dist && opts.dist[zid] === 1) ? 'direct'
        : 'transit';
    const land = LAND[p.land] || LAND.wasteland;
    const col = LAND_COLOR[p.land] || LAND_COLOR.wasteland;
    const dungeon = !!Z.dungeon;
    const label = esc(Z.name);

    return (
      `<g class="wm-node wm-${state}${dungeon ? ' wm-dungeon' : ''}" data-zone="${zid}" ` +
      `role="button" tabindex="0" aria-label="${label}（${state === 'current' ? '当前所在' : state === 'direct' ? '直达' : '需中转'}）">` +
      // 当前所在:外圈脉冲光环
      (state === 'current'
        ? `<circle class="wm-pulse" cx="${p.x}" cy="${p.y}" r="16" fill="none" stroke="#f0c75e" stroke-width="1.6"/>` +
          `<circle class="wm-ring" cx="${p.x}" cy="${p.y}" r="16.5" fill="none" stroke="#f0c75e" stroke-width="1.2" opacity=".55"/>`
        : '') +
      `<circle class="wm-hit" cx="${p.x}" cy="${p.y}" r="15" fill="transparent"/>` +
      `<circle class="wm-disc" cx="${p.x}" cy="${p.y}" r="12.5"/>` +
      `<g transform="translate(${p.x},${p.y}) scale(0.7)">${land(col)}</g>` +
      `<text class="wm-label" x="${p.x}" y="${p.y + 24}" text-anchor="middle">${label}</text>` +
      `</g>`
    );
  }

  // 同一大陆内的旅行连线(去重:A-B 与 B-A 只画一次)
  function links(cont, opts) {
    const inCont = new Set(cont.zones);
    const seen = new Set();
    let out = '';
    cont.zones.forEach((a) => {
      const Z = W.Data && W.Data.ZONES && W.Data.ZONES[a];
      if (!Z || !Z.travel) return;
      Z.travel.forEach((b) => {
        if (!inCont.has(b) || !ZONE_POS[a] || !ZONE_POS[b]) return;
        const k = a < b ? a + '|' + b : b + '|' + a;
        if (seen.has(k)) return;
        seen.add(k);
        const A = ZONE_POS[a], B = ZONE_POS[b];
        const active = a === opts.current || b === opts.current;
        out += `<line class="wm-link${active ? ' wm-link-on' : ''}" x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}"/>`;
      });
    });
    return out;
  }

  function continentSvg(cont, opts) {
    return (
      `<svg class="wm-svg" viewBox="${cont.vb}" preserveAspectRatio="xMidYMid meet" ` +
      `data-cont="${cont.id}" role="img" aria-label="${cont.name}地图">` +
      `<defs>` +
      `<linearGradient id="wmLand-${cont.id}" x1="0" y1="0" x2="0" y2="1">` +
      `<stop offset="0" stop-color="#2a2418"/><stop offset="1" stop-color="#1a1710"/>` +
      `</linearGradient>` +
      `</defs>` +
      // 大陆本体 + 海岸描边
      `<path class="wm-land" d="${cont.shape}" fill="url(#wmLand-${cont.id})"/>` +
      `<path class="wm-coast" d="${cont.shape}" fill="none"/>` +
      links(cont, opts) +
      cont.zones.map((z) => node(z, opts)).join('') +
      `</svg>`
    );
  }

  const WorldMap = {
    /* 返回完整 HTML:大陆 tab + 每个大陆一张图(只有当前 tab 可见) */
    html(opts) {
      const o = opts || {};
      const tabs = CONTINENTS.map((c, i) =>
        `<button class="wm-tab${i === (o.active || 0) ? ' active' : ''}" data-cont="${c.id}">${c.name}</button>`
      ).join('');
      const svgs = CONTINENTS.map((c, i) =>
        `<div class="wm-pane${i === (o.active || 0) ? ' active' : ''}" data-pane="${c.id}">${continentSvg(c, o)}</div>`
      ).join('');
      return `<div class="wmap"><div class="wm-tabs">${tabs}</div>${svgs}` +
        `<div class="wm-legend">` +
        `<span class="wm-key wm-current">当前</span>` +
        `<span class="wm-key wm-direct">直达</span>` +
        `<span class="wm-key wm-transit">需中转</span>` +
        `</div></div>`;
    },

    /* 绑定 tab 切换与节点点击 */
    bind(root, onPick) {
      if (!root) return;
      root.querySelectorAll('.wm-tab').forEach((tab) => {
        tab.addEventListener('click', () => {
          const id = tab.dataset.cont;
          root.querySelectorAll('.wm-tab').forEach((t) => t.classList.toggle('active', t === tab));
          root.querySelectorAll('.wm-pane').forEach((p) => p.classList.toggle('active', p.dataset.pane === id));
          if (W.Audio) W.Audio.click();
        });
      });
      root.querySelectorAll('.wm-node').forEach((g) => {
        const pick = () => { if (onPick) onPick(g.dataset.zone); };
        g.addEventListener('click', pick);
        g.addEventListener('keydown', (ev) => {
          if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); pick(); }
        });
      });
    },

    /* 单个区域的地形符号:世界界面顶部的区域大图标复用,替代原来的 emoji */
    iconSvg(zoneId, size) {
      const p = ZONE_POS[zoneId];
      if (!p) return null;
      const col = LAND_COLOR[p.land] || LAND_COLOR.wasteland;
      const land = LAND[p.land] || LAND.wasteland;
      const s = size || 64;
      return `<svg class="wm-zone-icon" viewBox="-11 -11 22 22" width="${s}" height="${s}" aria-hidden="true">${land(col)}</svg>`;
    },

    CONTINENTS,
    ZONE_POS,
    LAND_COLOR,
  };

  W.WorldMap = WorldMap;
})();
