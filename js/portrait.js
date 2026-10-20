/* 魔兽世界 · 战大陆 — 程序化角色贴图（SVG）
 *
 * 为什么不用 PNG 立绘：
 *   1. 本工程硬约束是「双击 index.html 直接运行」，无构建、无网络、无 CDN；
 *   2. APK 走增量热更新，几 MB 的位图会让每个补丁体积失控；
 *   3. 8 种族 × 9 职业 = 72 种组合，位图要 72 张且无法按装备换装；
 *      而「头骨 + 种族特征 + 职业装备」三层程序化拼装只需一套骨架，
 *      单张 2~3 KB、矢量任意缩放不糊、可按等级/装备实时换装。
 *
 * 用法：
 *   WOW.Portrait.uri('orc', 'warrior', { size: 64 })   -> 'data:image/svg+xml,...'
 *   WOW.Portrait.svg('orc', 'warrior')                 -> '<svg ...>...</svg>'
 *   WOW.Portrait.html('orc', 'warrior', { size: 40 })  -> '<img class="pg-portrait" ...>'
 *   WOW.Portrait.el('orc', 'warrior', 40)              -> <img> 元素
 *
 * 兼容：任何字段缺失都回退到人类 / 战士，绝不抛错。
 */
(function () {
  'use strict';

  const W = window.WOW || (window.WOW = {});
  let seq = 0;
  const uid = () => 'pg' + (++seq);
  const uriCache = Object.create(null);

  // ---------- 肤色 / 发色 ----------
  const SKIN = {
    human: { base: '#e9bd93', shade: '#c99669', dark: '#8a5f3c', hair: '#6b4a2f' },
    dwarf: { base: '#e3ab80', shade: '#bd8259', dark: '#7d5233', hair: '#c07a33' },
    night_elf: { base: '#bda9d8', shade: '#9a85bd', dark: '#5f4f7d', hair: '#4a3a6b' },
    gnome: { base: '#f2c8a8', shade: '#d3a080', dark: '#8f6248', hair: '#d9d2c4' },
    orc: { base: '#82ab63', shade: '#61884a', dark: '#3c5629', hair: '#2e2a24' },
    tauren: { base: '#8d6c4d', shade: '#6d5137', dark: '#43301f', hair: '#3a2817' },
    troll: { base: '#84a2ba', shade: '#63829b', dark: '#3c556d', hair: '#c85a2e' },
    undead: { base: '#bcc2b9', shade: '#939a90', dark: '#5c615a', hair: '#4a4f48' },
  };

  // ---------- 职业配色 / 甲种 ----------
  const CLS = {
    warrior: { cloth: '#8d3a33', cloth2: '#5a231e', metal: '#bcc5d0', metal2: '#7b8794', glow: '#ff8a6b', armor: 'plate' },
    paladin: { cloth: '#e8e2cf', cloth2: '#b9ad8c', metal: '#e9cf7a', metal2: '#a98a34', glow: '#ffe9a8', armor: 'plate' },
    hunter: { cloth: '#6d8f4d', cloth2: '#3f5a2c', metal: '#a08a63', metal2: '#6d5b3d', glow: '#b6e07a', armor: 'leather' },
    rogue: { cloth: '#4a4f5a', cloth2: '#2a2e36', metal: '#9aa3ad', metal2: '#5f6773', glow: '#8fd0ff', armor: 'leather' },
    priest: { cloth: '#efeade', cloth2: '#bdb5a2', metal: '#f4f0e4', metal2: '#c3bba8', glow: '#fff6cf', armor: 'cloth' },
    shaman: { cloth: '#3d6f92', cloth2: '#254a63', metal: '#a8c6d6', metal2: '#6b8b9c', glow: '#6fd0ff', armor: 'leather' },
    mage: { cloth: '#43689f', cloth2: '#2a4470', metal: '#a8c0e8', metal2: '#6c85b5', glow: '#8fc4ff', armor: 'cloth' },
    warlock: { cloth: '#5b3579', cloth2: '#35204a', metal: '#a07fc0', metal2: '#6b4d85', glow: '#b06fff', armor: 'cloth' },
    druid: { cloth: '#a8762f', cloth2: '#6d4a1c', metal: '#b0a070', metal2: '#7d7050', glow: '#ffd98f', armor: 'leather' },
  };

  // ---------- 头骨比例（相对基准头型缩放） ----------
  const HEAD = {
    human: { sx: 1.0, sy: 1.0 },
    dwarf: { sx: 1.07, sy: 0.95 },
    night_elf: { sx: 0.94, sy: 1.0 },
    gnome: { sx: 1.32, sy: 1.14 },
    orc: { sx: 1.13, sy: 0.95 },
    tauren: { sx: 1.08, sy: 0.94 },
    troll: { sx: 0.97, sy: 1.02 },
    undead: { sx: 1.0, sy: 0.97 },
  };

  // 基准头型：蛋形，x 33.5~66.5 / y 22~61（中心 50,41.5）
  const HEAD_PATH = 'M50,22 C60,22 66.5,28.5 66.5,39 C66.5,50 60,61 50,61 C40,61 33.5,50 33.5,39 C33.5,28.5 40,22 50,22Z';

  // ---------- 各层 ----------

  // 背景：职业色晕染
  function bg(c) {
    return (
      `<rect x="0" y="0" width="100" height="100" fill="${c.cloth2}"/>` +
      `<circle cx="50" cy="48" r="48" fill="${c.cloth}" opacity=".72"/>` +
      `<circle cx="50" cy="34" r="28" fill="${c.glow}" opacity=".14"/>`
    );
  }

  // 暗角：把视线收到脸部（放在最上层，压住背景亮度）
  function vignette() {
    const g = uid();
    return (
      `<defs><radialGradient id="${g}" cx="50%" cy="46%" r="56%">` +
      `<stop offset=".5" stop-color="#000" stop-opacity="0"/>` +
      `<stop offset="1" stop-color="#000" stop-opacity=".34"/>` +
      `</radialGradient></defs>` +
      `<rect x="0" y="0" width="100" height="100" fill="url(#${g})"/>`
    );
  }

  // 头后层：长发 / 长耳 / 双角（压在躯干之下，形成前后关系）
  function behind(raceId, s, c) {
    switch (raceId) {
      case 'night_elf':
        return (
          `<path d="M33,34 C24,44 22,62 26,76 C32,66 34,52 36,40 Z" fill="${s.hair}"/>` +
          `<path d="M67,34 C76,44 78,62 74,76 C68,66 66,52 64,40 Z" fill="${s.hair}"/>`
        );
      case 'tauren':
        return (
          // 鬃毛
          `<path d="M31,40 C26,54 30,70 40,74 C34,62 34,50 37,42 Z" fill="${s.hair}"/>` +
          `<path d="M69,40 C74,54 70,70 60,74 C66,62 66,50 63,42 Z" fill="${s.hair}"/>`
        );
      case 'troll':
        return (
          // 长耳：从头侧向后下方垂落（细长，避免读成翅膀）
          `<path d="M34.5,40 C28,46 23,55 24,63 C26.5,56 30,48 36,43.5 Z" fill="${s.base}" stroke="${s.dark}" stroke-width="1"/>` +
          `<path d="M65.5,40 C72,46 77,55 76,63 C73.5,56 70,48 64,43.5 Z" fill="${s.base}" stroke="${s.dark}" stroke-width="1"/>`
        );
      case 'undead':
        return `<path d="M33,40 C27,44 25,50 27,55 C30,50 32,46 35,44 Z" fill="${s.shade}" opacity=".8"/>`;
      default:
        return '';
    }
  }

  // 躯干 + 肩甲
  function torso(c) {
    const plate = c.armor === 'plate';
    let out =
      `<path d="M4,100 C6,80 20,69 50,69 C80,69 94,80 96,100 Z" fill="${c.cloth2}"/>` +
      `<path d="M16,100 C18,83 31,72 50,72 C69,72 82,83 84,100 Z" fill="${c.cloth}"/>` +
      `<path d="M43,71 L50,85 L57,71" fill="none" stroke="${c.metal2}" stroke-width="2" stroke-linejoin="round"/>`;
    if (plate) {
      out +=
        `<path d="M9,100 C9,83 18,72 31,71 L35,85 L23,100 Z" fill="${c.metal}"/>` +
        `<path d="M91,100 C91,83 82,72 69,71 L65,85 L77,100 Z" fill="${c.metal}"/>` +
        `<path d="M9,100 C9,83 18,72 31,71 L32,76 C21,78 15,88 14,100 Z" fill="${c.metal2}" opacity=".7"/>` +
        `<path d="M91,100 C91,83 82,72 69,71 L68,76 C79,78 85,88 86,100 Z" fill="${c.metal2}" opacity=".7"/>` +
        `<path d="M17,73 L13,64 L26,71 Z" fill="${c.metal}"/>` +
        `<path d="M83,73 L87,64 L74,71 Z" fill="${c.metal}"/>`;
    } else if (c.armor === 'leather') {
      out +=
        `<path d="M13,100 C14,86 21,76 31,74 L33,83 L24,100 Z" fill="${c.metal}"/>` +
        `<path d="M87,100 C86,86 79,76 69,74 L67,83 L76,100 Z" fill="${c.metal}"/>`;
    } else {
      // 布甲：软褶皱
      out +=
        `<path d="M20,100 C22,86 30,77 50,77 C70,77 78,86 80,100" fill="none" stroke="${c.metal2}" stroke-width="1.6" opacity=".55"/>`;
    }
    return out;
  }

  function neck(s) {
    return (
      `<path d="M43,50 L57,50 L57,71 L43,71 Z" fill="${s.shade}"/>` +
      `<path d="M43,50 L57,50 L57,58 L43,58 Z" fill="${s.dark}" opacity=".5"/>`
    );
  }

  // 头骨（带径向渐变，避免平涂死板）
  function skull(raceId, s) {
    const h = HEAD[raceId] || HEAD.human;
    const g = uid();
    return (
      `<defs><radialGradient id="${g}" cx="36%" cy="28%" r="78%">` +
      `<stop offset="0" stop-color="${s.base}"/>` +
      `<stop offset=".62" stop-color="${s.base}"/>` +
      `<stop offset="1" stop-color="${s.shade}"/>` +
      `</radialGradient></defs>` +
      `<g transform="translate(50,41.5) scale(${h.sx},${h.sy}) translate(-50,-41.5)">` +
      `<path d="${HEAD_PATH}" fill="url(#${g})"/>` +
      `<path d="${HEAD_PATH}" fill="none" stroke="${s.dark}" stroke-width="1.5" stroke-opacity=".5"/>` +
      `</g>`
    );
  }

  // 单只眼睛
  function eye(cx, style, s, glowColor) {
    if (style === 'glow') {
      const gc = glowColor || '#6fd8ff';
      return (
        `<ellipse cx="${cx}" cy="40" rx="3.7" ry="4" fill="#f4fbff"/>` +
        `<circle cx="${cx}" cy="40" r="2" fill="${gc}"/>` +
        `<circle cx="${cx}" cy="40" r="6.2" fill="${gc}" opacity=".2"/>`
      );
    }
    if (style === 'fel') {
      return (
        `<ellipse cx="${cx}" cy="40" rx="3.6" ry="3.9" fill="#1a0f22"/>` +
        `<circle cx="${cx}" cy="40" r="2.2" fill="#c06fff"/>` +
        `<circle cx="${cx}" cy="40" r="6" fill="#b06fff" opacity=".26"/>`
      );
    }
    if (style === 'sunken') {
      return (
        `<ellipse cx="${cx}" cy="39.8" rx="5.1" ry="5.5" fill="#242822"/>` +
        `<circle cx="${cx}" cy="40" r="2" fill="#cdff92"/>` +
        `<circle cx="${cx}" cy="40" r="5.2" fill="#a8e06a" opacity=".32"/>`
      );
    }
    return (
      `<ellipse cx="${cx}" cy="40" rx="3.5" ry="3.9" fill="#f7f3ea"/>` +
      `<circle cx="${cx + 0.4}" cy="40.5" r="1.9" fill="#3a2a20"/>` +
      `<circle cx="${cx - 0.7}" cy="39" r="0.85" fill="#fff" opacity=".9"/>`
    );
  }

  // 眉 / 眼 / 鼻 / 嘴
  function face(raceId, clsId, s) {
    let style = 'normal';
    let glow = null;
    if (raceId === 'night_elf') { style = 'glow'; glow = '#7fe0ff'; }
    if (raceId === 'undead') style = 'sunken';
    if (clsId === 'warlock' && raceId !== 'undead') { style = 'fel'; }

    let out = '';
    const browW = (raceId === 'orc' || raceId === 'dwarf') ? 3.6 : 2.3;

    // 兽人：外扩的粗眉骨
    if (raceId === 'orc') {
      out +=
        `<path d="M36,33.5 L46,31.5" stroke="${s.dark}" stroke-width="4" stroke-linecap="round"/>` +
        `<path d="M64,33.5 L54,31.5" stroke="${s.dark}" stroke-width="4" stroke-linecap="round"/>` +
        // 宽下颚阴影
        `<path d="M35,46 C36,58 42,62 50,62 C58,62 64,58 65,46 C60,54 40,54 35,46 Z" fill="${s.dark}" opacity=".18"/>`;
    } else if (raceId !== 'undead') {
      out +=
        `<path d="M37.5,34.2 L45,32.8" stroke="${s.dark}" stroke-width="${browW}" stroke-linecap="round"/>` +
        `<path d="M62.5,34.2 L55,32.8" stroke="${s.dark}" stroke-width="${browW}" stroke-linecap="round"/>`;
    }

    // 亡灵：破损的眼眶阴影
    if (raceId === 'undead') {
      out +=
        `<path d="M34,33 L46,31 L47,45 L34,44 Z" fill="${s.dark}" opacity=".45"/>` +
        `<path d="M66,33 L54,31 L53,45 L66,44 Z" fill="${s.dark}" opacity=".45"/>`;
    }

    out += eye(43, style, s, glow) + eye(57, style, s, glow);

    // 鼻
    if (raceId === 'dwarf') {
      out += `<ellipse cx="50" cy="47.5" rx="5" ry="4.3" fill="${s.base}" stroke="${s.shade}" stroke-width="1.2"/>`;
    } else if (raceId === 'tauren') {
      // 牛头人：向前延伸的长吻 + 深色鼻头
      out +=
        `<path d="M43,43 C43,54 46,60 50,60 C54,60 57,54 57,43 Z" fill="${s.base}"/>` +
        `<ellipse cx="50" cy="57.5" rx="6.2" ry="3.6" fill="${s.shade}"/>` +
        `<ellipse cx="47.6" cy="57.4" rx="1.1" ry="1.4" fill="${s.dark}"/>` +
        `<ellipse cx="52.4" cy="57.4" rx="1.1" ry="1.4" fill="${s.dark}"/>` +
        `<circle cx="50" cy="62" r="3" fill="none" stroke="#dccfae" stroke-width="1.3"/>`;
    } else if (raceId === 'undead') {
      out +=
        `<path d="M47.5,45 L47.5,49" stroke="${s.dark}" stroke-width="1.8" stroke-linecap="round"/>` +
        `<path d="M52.5,45 L52.5,49" stroke="${s.dark}" stroke-width="1.8" stroke-linecap="round"/>`;
    } else if (raceId === 'troll') {
      out += `<path d="M50,42 L48.4,50 L51.6,50 Z" fill="${s.shade}"/>`;
    } else {
      out += `<path d="M50,44 L48.6,48.5 L51.4,48.5 Z" fill="${s.shade}"/>`;
    }

    // 嘴 / 獠牙 / 牙列
    if (raceId === 'orc') {
      out +=
        `<path d="M43,54.5 Q50,57 57,54.5" stroke="${s.dark}" stroke-width="1.6" fill="none" stroke-linecap="round"/>` +
        `<path d="M42.6,55 L43.3,45.5 L46.9,55 Z" fill="#f8f4e6"/>` +
        `<path d="M57.4,55 L56.7,45.5 L53.1,55 Z" fill="#f8f4e6"/>`;
    } else if (raceId === 'troll') {
      out +=
        `<path d="M44,54 Q50,56 56,54" stroke="${s.dark}" stroke-width="1.5" fill="none" stroke-linecap="round"/>` +
        `<path d="M44,54.4 L44.4,48 L46.6,54.4 Z" fill="#f6f2e4"/>` +
        `<path d="M56,54.4 L55.6,48 L53.4,54.4 Z" fill="#f6f2e4"/>`;
    } else if (raceId === 'undead') {
      out +=
        `<path d="M43,52.5 L57,52.5 L56,57 Q50,59.6 44,57 Z" fill="${s.dark}" opacity=".75"/>` +
        `<path d="M46,52.9 L46,56.2 M50,52.9 L50,57.2 M54,52.9 L54,56.4" stroke="#e9e7dd" stroke-width="2.4" stroke-linecap="round"/>`;
    } else if (raceId === 'dwarf') {
      // 被胡子遮住，只露一点唇线
      out += `<path d="M46.5,53 Q50,54.6 53.5,53" stroke="${s.dark}" stroke-width="1.3" fill="none" stroke-linecap="round"/>`;
    } else {
      out += `<path d="M46,52.5 Q50,55 54,52.5" stroke="${s.dark}" stroke-width="1.4" fill="none" stroke-linecap="round"/>`;
    }

    return out;
  }

  // 种族专属：双角 / 发型 / 耳（在头盔之下）
  function racial(raceId, s) {
    switch (raceId) {
      case 'dwarf':
        return ''; // 胡子见 beard()：必须压在兜帽/头盔之上
      case 'tauren':
        // 双角：从头顶两侧向外平伸再上翘（牛角，不是兔耳）
        return (
          `<path d="M38,28 C27,24 17,28 11,37 C9,41 10,45 13,47" fill="none" stroke="#e2d5b6" stroke-width="8.5" stroke-linecap="round"/>` +
          `<path d="M62,28 C73,24 83,28 89,37 C91,41 90,45 87,47" fill="none" stroke="#e2d5b6" stroke-width="8.5" stroke-linecap="round"/>` +
          `<path d="M38,28 C27,24 17,28 11,37" fill="none" stroke="#f6eeda" stroke-width="3.5" stroke-linecap="round" opacity=".8"/>` +
          `<path d="M62,28 C73,24 83,28 89,37" fill="none" stroke="#f6eeda" stroke-width="3.5" stroke-linecap="round" opacity=".8"/>`
        );
      case 'troll':
        // 莫西干尖刺
        return (
          `<path d="M43,24 L37,9 L46,21 Z" fill="${s.hair}"/>` +
          `<path d="M48,21 L49,5 L52,21 Z" fill="${s.hair}"/>` +
          `<path d="M54,21 L61,9 L57,24 Z" fill="${s.hair}"/>` +
          `<path d="M45,22 L49,9" stroke="#e89150" stroke-width="1.2" opacity=".75" stroke-linecap="round"/>`
        );
      case 'orc':
        // 后梳马尾
        return `<path d="M44,22 C46,14 54,14 56,22 C54,18 46,18 44,22 Z" fill="${s.hair}"/>`;
      case 'gnome':
        // 大头 + 大圆耳 + 腮红（与人类区分）
        return (
          `<path d="M35,27 C37,18 43,14 50,14 C57,14 63,18 65,27 C58,21 42,21 35,27 Z" fill="${s.hair}"/>` +
          `<ellipse cx="31.5" cy="41" rx="4.6" ry="6.6" fill="${s.base}" stroke="${s.dark}" stroke-width="1"/>` +
          `<ellipse cx="68.5" cy="41" rx="4.6" ry="6.6" fill="${s.base}" stroke="${s.dark}" stroke-width="1"/>` +
          `<ellipse cx="37.5" cy="47" rx="3.6" ry="2.4" fill="#e8877a" opacity=".2"/>` +
          `<ellipse cx="62.5" cy="47" rx="3.6" ry="2.4" fill="#e8877a" opacity=".2"/>`
        );
      case 'night_elf':
        return (
          // 长尖耳（斜向后上）+ 额饰
          `<path d="M35,36 C28,31 21,27 16,26 C22,31 28,38 33,44 Z" fill="${s.base}" stroke="${s.dark}" stroke-width="1"/>` +
          `<path d="M65,36 C72,31 79,27 84,26 C78,31 72,38 67,44 Z" fill="${s.base}" stroke="${s.dark}" stroke-width="1"/>` +
          `<path d="M50,22 L50,27" stroke="#cfc0e8" stroke-width="1.6" stroke-linecap="round" opacity=".9"/>` +
          `<circle cx="50" cy="28.6" r="1.5" fill="#cfc0e8"/>`
        );
      case 'human':
        return (
          // 短发
          `<path d="M34,36 C33,25 40,19 50,19 C60,19 67,25 66,36 C64,28 58,25 50,25 C42,25 36,28 34,36 Z" fill="${s.hair}"/>`
        );
      default:
        return '';
    }
  }

  // 职业装备：头盔 / 兜帽 / 面罩 / 尖帽
  function gear(clsId, s, c) {
    switch (clsId) {
      case 'warrior':
        return (
          // 护额 + 护耳：只压住额头，露出头顶发型（否则各族的头发/角全被盖住）
          `<path d="M33,32 C33,26 38,22 50,22 C62,22 67,26 67,32 L67,36 L61,36 L61,30 C57,27 43,27 39,30 L39,36 L33,36 Z" fill="${c.metal}"/>` +
          `<path d="M33,33 L29,44 L33,49 L36.5,40 Z" fill="${c.metal}"/>` +
          `<path d="M67,33 L71,44 L67,49 L63.5,40 Z" fill="${c.metal}"/>` +
          `<path d="M39,30 C43,27 57,27 61,30" fill="none" stroke="${c.metal2}" stroke-width="1.5"/>` +
          `<circle cx="50" cy="27" r="2.2" fill="${c.glow}" opacity=".9"/>`
        );
      case 'paladin':
        return (
          // 额冠 + 头顶光环
          `<path d="M34,33 C34,25 40,20 50,20 C60,20 66,25 66,33 L66,35 L60,35 L60,29 C56,26 44,26 40,29 L40,35 L34,35 Z" fill="${c.metal}"/>` +
          `<circle cx="50" cy="14" r="7.5" fill="none" stroke="${c.glow}" stroke-width="2.2" opacity=".95"/>` +
          `<circle cx="50" cy="14" r="7.5" fill="none" stroke="#fff8dd" stroke-width="0.9"/>` +
          `<circle cx="50" cy="20.5" r="2.6" fill="${c.glow}"/>`
        );
      case 'hunter':
        return (
          // 皮兜帽：压住头顶与两鬓，露出额头；帽侧插羽毛
          `<path d="M31,40 C31,22 39,16 50,16 C61,16 69,22 69,40 C68,30 61,26 50,26 C39,26 32,30 31,40 Z" fill="${c.metal}"/>` +
          `<path d="M31,40 C31,22 39,16 50,16 C61,16 69,22 69,40" fill="none" stroke="${c.metal2}" stroke-width="1.6"/>` +
          `<path d="M31,38 C27,42 26,48 27,53 C29,47 31,42 34,39 Z" fill="${c.metal}"/>` +
          `<path d="M69,38 C73,42 74,48 73,53 C71,47 69,42 66,39 Z" fill="${c.metal}"/>` +
          `<path d="M67,27 C72,20 78,17 81,18 C77,23 72,28 69,32 Z" fill="#dbe8bd"/>` +
          `<path d="M67,27 C72,20 78,17 81,18" fill="none" stroke="#8fa870" stroke-width="1"/>`
        );
      case 'rogue':
        return (
          // 兜帽压到眉骨，面罩只遮口鼻，眼睛留在阴影里
          `<path d="M30,42 C30,21 39,14 50,14 C61,14 70,21 70,42 C69,31 61,26 50,26 C39,26 31,31 30,42 Z" fill="${c.cloth2}"/>` +
          `<path d="M30,42 C30,21 39,14 50,14 C61,14 70,21 70,42" fill="none" stroke="${c.metal2}" stroke-width="1.4"/>` +
          `<path d="M34,47 Q50,52 66,47 L66,58 Q50,64 34,58 Z" fill="${c.cloth2}"/>` +
          `<path d="M34,47 Q50,52 66,47" fill="none" stroke="${c.metal2}" stroke-width="1.1" opacity=".85"/>`
        );
      case 'priest':
        return (
          // 白兜帽 + 光环
          `<path d="M30,44 C30,22 39,15 50,15 C61,15 70,22 70,44 C69,31 61,26 50,26 C39,26 31,31 30,44 Z" fill="${c.cloth}"/>` +
          `<path d="M30,44 C30,22 39,15 50,15 C61,15 70,22 70,44" fill="none" stroke="${c.metal2}" stroke-width="1.5"/>` +
          `<ellipse cx="50" cy="12" rx="8.5" ry="3.2" fill="none" stroke="${c.glow}" stroke-width="2" opacity=".9"/>`
        );
      case 'shaman':
        return (
          // 狼头皮兜帽：头顶狼吻 + 两侧垂下的毛皮（区别于牛头人的双角）
          `<path d="M31,40 C31,21 39,15 50,15 C61,15 69,21 69,40 C68,29 61,25 50,25 C39,25 32,29 31,40 Z" fill="${c.metal}"/>` +
          `<path d="M31,38 C26,43 25,51 27,58 C30,50 31,44 34,40 Z" fill="${c.metal}"/>` +
          `<path d="M69,38 C74,43 75,51 73,58 C70,50 69,44 66,40 Z" fill="${c.metal}"/>` +
          `<path d="M50,16 L45,26 L50,30 L55,26 Z" fill="${c.metal2}"/>` +
          `<path d="M31,38 C26,43 25,51 27,58" fill="none" stroke="${c.metal2}" stroke-width="1.1"/>` +
          `<path d="M69,38 C74,43 75,51 73,58" fill="none" stroke="${c.metal2}" stroke-width="1.1"/>` +
          `<path d="M35,32 Q40,28 45,29" fill="none" stroke="${c.glow}" stroke-width="1.4" opacity=".65"/>` +
          `<path d="M65,32 Q60,28 55,29" fill="none" stroke="${c.glow}" stroke-width="1.4" opacity=".65"/>`
        );
      case 'mage':
        return (
          // 尖顶长帽
          `<path d="M50,2 L64,30 C59,26 54,24 50,24 C46,24 41,26 36,30 Z" fill="${c.cloth}"/>` +
          `<path d="M50,2 L57,17 C54,15 52,14 50,14 Z" fill="${c.metal2}" opacity=".45"/>` +
          `<path d="M31,30 Q50,22 69,30 L69,34 Q50,26 31,34 Z" fill="${c.metal2}"/>` +
          `<circle cx="50" cy="27" r="2.4" fill="${c.glow}"/>` +
          `<circle cx="50" cy="27" r="5.6" fill="${c.glow}" opacity=".28"/>`
        );
      case 'warlock':
        return (
          // 兜帽 + 恶魔小角
          `<path d="M30,44 C30,22 39,15 50,15 C61,15 70,22 70,44 C69,31 61,26 50,26 C39,26 31,31 30,44 Z" fill="${c.cloth2}"/>` +
          `<path d="M30,44 C30,22 39,15 50,15 C61,15 70,22 70,44" fill="none" stroke="${c.metal2}" stroke-width="1.5"/>` +
          `<path d="M36,20 C30,14 27,9 29,5 C33,10 37,15 41,18 Z" fill="#3a2440"/>` +
          `<path d="M64,20 C70,14 73,9 71,5 C67,10 63,15 59,18 Z" fill="#3a2440"/>` +
          `<circle cx="50" cy="17" r="2" fill="${c.glow}" opacity=".85"/>`
        );
      case 'druid':
        return (
          // 分叉鹿角 + 叶饰兜帽
          `<path d="M39,25 C34,16 27,10 19,7" fill="none" stroke="${c.metal2}" stroke-width="3.2" stroke-linecap="round"/>` +
          `<path d="M61,25 C66,16 73,10 81,7" fill="none" stroke="${c.metal2}" stroke-width="3.2" stroke-linecap="round"/>` +
          `<path d="M32,16 L26,8" fill="none" stroke="${c.metal2}" stroke-width="2.6" stroke-linecap="round"/>` +
          `<path d="M68,16 L74,8" fill="none" stroke="${c.metal2}" stroke-width="2.6" stroke-linecap="round"/>` +
          `<path d="M24,11 L18,6" fill="none" stroke="${c.metal2}" stroke-width="2.2" stroke-linecap="round"/>` +
          `<path d="M76,11 L82,6" fill="none" stroke="${c.metal2}" stroke-width="2.2" stroke-linecap="round"/>` +
          `<path d="M31,40 C31,23 39,17 50,17 C61,17 69,23 69,40 C68,30 61,25 50,25 C39,25 32,30 31,40 Z" fill="${c.cloth2}"/>` +
          `<path d="M33,34 L28,30 L33,27 Z" fill="#7fae54"/>` +
          `<path d="M67,34 L72,30 L67,27 Z" fill="#7fae54"/>`
        );
      default:
        return '';
    }
  }

  // 胡子（必须压在兜帽/面罩之上，否则矮人戴帽就"没胡子"了）
  function beard(raceId, s) {
    if (raceId !== 'dwarf') return '';
    return (
      `<path d="M32,44 C32,58 39,71 50,71 C61,71 68,58 68,44 C65,52 58,56 50,56 C42,56 35,52 32,44 Z" fill="${s.hair}"/>` +
      `<path d="M40,50 C42,61 46,65 50,65 C54,65 58,61 60,50 C56,56 44,56 40,50 Z" fill="#a8641f" opacity=".45"/>` +
      `<path d="M44,57 C46,63 48,66 50,66" stroke="#f0c98a" stroke-width="1.2" fill="none" opacity=".55"/>` +
      `<path d="M56,57 C54,63 52,66 50,66" stroke="#f0c98a" stroke-width="1.2" fill="none" opacity=".55"/>`
    );
  }

  // 组装
  function build(raceId, clsId) {
    const s = SKIN[raceId] || SKIN.human;
    const c = CLS[clsId] || CLS.warrior;
    return (
      bg(c) +
      behind(raceId, s, c) +
      torso(c) +
      neck(s) +
      skull(raceId, s) +
      face(raceId, clsId, s) +
      racial(raceId, s) +
      gear(clsId, s, c) +
      beard(raceId, s) +
      vignette()
    );
  }

  // 外框
  function frame(shape, c) {
    if (shape === 'none') return '';
    if (shape === 'rounded') {
      return `<rect x="2" y="2" width="96" height="96" rx="18" fill="none" stroke="${c.metal2}" stroke-width="3"/>`;
    }
    return (
      `<circle cx="50" cy="50" r="48.2" fill="none" stroke="${c.metal2}" stroke-width="3"/>` +
      `<circle cx="50" cy="50" r="45.4" fill="none" stroke="${c.glow}" stroke-width="1" opacity=".55"/>`
    );
  }

  const Portrait = {
    /** 返回完整 SVG 字符串 */
    svg(raceId, clsId, opts) {
      const o = opts || {};
      const c = CLS[clsId] || CLS.warrior;
      const shape = o.frame || 'circle';
      const clip = uid();
      const size = o.size ? ` width="${o.size}" height="${o.size}"` : '';
      const inner = build(raceId, clsId);
      const body = shape === 'none'
        ? inner
        : `<g clip-path="url(#${clip})">${inner}</g>`;
      const defs = shape === 'none' ? '' : `<clipPath id="${clip}"><circle cx="50" cy="50" r="48"/></clipPath>`;
      return (
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"${size} ` +
        `role="img" aria-label="${(raceId || '')}-${(clsId || '')} 头像">` +
        `<defs>${defs}</defs>${body}${frame(shape, c)}</svg>`
      );
    },

    /** data URI（可直接放进 <img src>，也可作 CSS background-image） */
    uri(raceId, clsId, opts) {
      const o = opts || {};
      // 战斗界面每次重绘都会取头像，必须缓存：同一组合只生成一次
      const key = (raceId || '') + '|' + (clsId || '') + '|' + (o.size || 0) + '|' + (o.frame || 'circle');
      if (!uriCache[key]) {
        uriCache[key] = 'data:image/svg+xml,' + encodeURIComponent(this.svg(raceId, clsId, o));
      }
      return uriCache[key];
    },

    /** <img> 标签字符串 */
    html(raceId, clsId, opts) {
      const o = opts || {};
      const size = o.size || 40;
      const cls = o.cls ? ' ' + o.cls : '';
      return (
        `<img class="pg-portrait${cls}" src="${this.uri(raceId, clsId, o)}" ` +
        `width="${size}" height="${size}" alt="${(raceId || '')} ${(clsId || '')}" ` +
        `draggable="false" loading="lazy">`
      );
    },

    /** DOM 元素 */
    el(raceId, clsId, size, extraCls) {
      const img = document.createElement('img');
      img.className = 'pg-portrait' + (extraCls ? ' ' + extraCls : '');
      img.src = this.uri(raceId, clsId, { size: size || 40 });
      img.width = size || 40;
      img.height = size || 40;
      img.alt = (raceId || '') + ' ' + (clsId || '');
      img.draggable = false;
      return img;
    },

    /** 便捷：把一段 emoji 图标替换成贴图（渐进增强，失败时保留 emoji） */
    replaceIcon(iconEl, raceId, clsId, size) {
      try {
        if (!iconEl) return;
        iconEl.innerHTML = this.html(raceId, clsId, { size: size || 40 });
      } catch (e) { /* 保留原 emoji */ }
    },

    RACES: Object.keys(SKIN),
    CLASSES: Object.keys(CLS),
  };

  W.Portrait = Portrait;
})();
