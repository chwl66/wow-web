/* 魔兽世界 · 战大陆 — 怪物贴图（程序化 SVG）
 *
 * 与 portrait.js 同一套思路：零图片资源、矢量不糊、按需生成。
 * 但怪物不能用「种族 × 职业」拼装 —— 501 个怪物只有 kind（7 类）和 emoji 两个分类线索，
 * 所以走「kind 定骨架 + emoji 定物种变体 + 配色微调」：
 *   🐺 → 狼头（尖耳长吻）  🐗 → 野猪头（獠牙拱鼻）  🕷️ → 蜘蛛（多腿圆腹）
 *   💀 → 骷髅（深眼窝牙列）🔥 → 火元素（火焰轮廓）  🤖 → 机械（方头横条眼）
 * 未收录的 emoji 回退到 kind 的默认剪影，所以任何新怪物都不会没有贴图。
 *
 * 用法：
 *   WOW.MonsterArt.html(monster, { size: 40 })   monster 是 D.MONSTERS 的实例
 *   WOW.MonsterArt.uri(monster, { size: 40 })
 *   WOW.MonsterArt.svg(monster)
 */
(function () {
  'use strict';

  const W = window.WOW || (window.WOW = {});
  let seq = 0;
  const uid = () => 'ma' + (++seq);
  const cache = Object.create(null);

  // ---------- 通用 ----------
  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

  function bg(tint, glow) {
    return (
      `<rect x="0" y="0" width="100" height="100" fill="${tint}"/>` +
      `<circle cx="50" cy="50" r="48" fill="${glow}" opacity=".16"/>`
    );
  }

  function vignette() {
    const g = uid();
    return (
      `<defs><radialGradient id="${g}" cx="50%" cy="46%" r="58%">` +
      `<stop offset=".55" stop-color="#000" stop-opacity="0"/>` +
      `<stop offset="1" stop-color="#000" stop-opacity=".42"/>` +
      `</radialGradient></defs>` +
      `<rect x="0" y="0" width="100" height="100" fill="url(#${g})"/>`
    );
  }

  function frame(ring, shape) {
    if (shape === 'none') return '';
    if (shape === 'rounded') {
      return `<rect x="2" y="2" width="96" height="96" rx="16" fill="none" stroke="${ring}" stroke-width="3"/>`;
    }
    return (
      `<circle cx="50" cy="50" r="48.2" fill="none" stroke="${ring}" stroke-width="3"/>` +
      `<circle cx="50" cy="50" r="45.4" fill="none" stroke="${ring}" stroke-width="1" opacity=".4"/>`
    );
  }

  // 发光眼:核 + 外晕(不用 filter,纯半透明圆,便宜)
  function eye(cx, cy, r, color, glowR) {
    return (
      `<circle cx="${cx}" cy="${cy}" r="${glowR || r * 2.6}" fill="${color}" opacity=".2"/>` +
      `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}"/>` +
      `<circle cx="${cx}" cy="${cy - r * 0.35}" r="${r * 0.4}" fill="#fff" opacity=".75"/>`
    );
  }

  // 竖瞳(爬行类/龙)
  function slitEye(cx, cy, color) {
    return (
      `<ellipse cx="${cx}" cy="${cy}" rx="4.4" ry="4" fill="${color}" opacity=".25"/>` +
      `<ellipse cx="${cx}" cy="${cy}" rx="3.4" ry="3.2" fill="${color}"/>` +
      `<ellipse cx="${cx}" cy="${cy}" rx=".9" ry="2.8" fill="#1a1410"/>`
    );
  }

  // ---------- 剪影 ----------
  const SHAPES = {
    /* 狼 / 犬 / 狐:楔形头 + 尖耳 + 长吻 */
    beast_wolf(s) {
      return (
        // 耳
        `<path d="M36,34 L28,13 L45,26 Z" fill="${s.fur}" stroke="${s.dark}" stroke-width="1.4"/>` +
        `<path d="M64,34 L72,13 L55,26 Z" fill="${s.fur}" stroke="${s.dark}" stroke-width="1.4"/>` +
        `<path d="M36,32 L32,20 L42,28 Z" fill="${s.dark}" opacity=".55"/>` +
        `<path d="M64,32 L68,20 L58,28 Z" fill="${s.dark}" opacity=".55"/>` +
        // 头 + 吻
        `<path d="M35,36 C38,26 62,26 65,36 C69,45 67,54 60,60 L52,70 L48,70 L40,60 C33,54 31,45 35,36 Z" fill="${s.fur}" stroke="${s.dark}" stroke-width="1.5"/>` +
        // 面部阴影
        `<path d="M50,28 C62,28 67,36 66,46 C65,55 58,60 52,66 C56,54 56,38 50,28 Z" fill="${s.dark}" opacity=".18"/>` +
        // 鼻头
        `<ellipse cx="50" cy="66" rx="6" ry="4.4" fill="${s.dark}"/>` +
        `<ellipse cx="48" cy="64.6" rx="1.2" ry="1" fill="#000" opacity=".5"/>` +
        `<ellipse cx="52" cy="64.6" rx="1.2" ry="1" fill="#000" opacity=".5"/>` +
        // 眼
        eye(42, 45, 3.2, s.eye, 8) +
        eye(58, 45, 3.2, s.eye, 8) +
        // 眉骨
        `<path d="M36,39 L46,37" stroke="${s.dark}" stroke-width="2.6" stroke-linecap="round"/>` +
        `<path d="M64,39 L54,37" stroke="${s.dark}" stroke-width="2.6" stroke-linecap="round"/>` +
        // 獠牙 + 口线
        `<path d="M42,64 C44,69 48,70 50,70 C52,70 56,69 58,64" fill="none" stroke="${s.dark}" stroke-width="1.6" stroke-linecap="round"/>` +
        `<path d="M43.5,64 L44.4,58 L46.6,64 Z" fill="#f2eddd"/>` +
        `<path d="M56.5,64 L55.6,58 L53.4,64 Z" fill="#f2eddd"/>`
      );
    },

    /* 野猪:宽头 + 拱鼻 + 上翘獠牙 + 鬃毛 */
    beast_boar(s) {
      return (
        // 鬃毛
        `<path d="M40,30 L36,16 L46,25 L50,12 L54,25 L64,16 L60,30 Z" fill="${s.dark}"/>` +
        // 头
        `<path d="M31,40 C33,29 67,29 69,40 C71,50 66,58 58,62 L50,66 L42,62 C34,58 29,50 31,40 Z" fill="${s.fur}" stroke="${s.dark}" stroke-width="1.5"/>` +
        // 拱鼻
        `<ellipse cx="50" cy="59" rx="11" ry="8" fill="${s.snout}" stroke="${s.dark}" stroke-width="1.3"/>` +
        `<ellipse cx="46" cy="58.5" rx="1.7" ry="2.2" fill="${s.dark}"/>` +
        `<ellipse cx="54" cy="58.5" rx="1.7" ry="2.2" fill="${s.dark}"/>` +
        // 眼
        eye(40, 44, 2.8, s.eye, 7) +
        eye(60, 44, 2.8, s.eye, 7) +
        // 眉骨
        `<path d="M33,39 L44,37.5" stroke="${s.dark}" stroke-width="3" stroke-linecap="round"/>` +
        `<path d="M67,39 L56,37.5" stroke="${s.dark}" stroke-width="3" stroke-linecap="round"/>` +
        // 上翘獠牙
        `<path d="M39,56 C34,50 34,43 38,39 C38,46 40,51 43,55 Z" fill="#f6f1e0" stroke="#c9bfa4" stroke-width="1"/>` +
        `<path d="M61,56 C66,50 66,43 62,39 C62,46 60,51 57,55 Z" fill="#f6f1e0" stroke="#c9bfa4" stroke-width="1"/>`
      );
    },

    /* 蜘蛛:圆腹 + 八腿 + 复眼 + 螯牙 */
    beast_spider(s) {
      const leg = (d) => `<path d="${d}" fill="none" stroke="${s.dark}" stroke-width="3.4" stroke-linecap="round"/>`;
      return (
        leg('M32,48 C22,44 14,48 10,54') +
        leg('M31,54 C21,54 13,60 10,68') +
        leg('M33,60 C24,64 18,72 17,80') +
        leg('M38,65 C32,72 30,80 31,86') +
        leg('M68,48 C78,44 86,48 90,54') +
        leg('M69,54 C79,54 87,60 90,68') +
        leg('M67,60 C76,64 82,72 83,80') +
        leg('M62,65 C68,72 70,80 69,86') +
        // 腹部
        `<ellipse cx="50" cy="54" rx="23" ry="25" fill="${s.fur}" stroke="${s.dark}" stroke-width="1.6"/>` +
        // 背部花纹
        `<path d="M50,32 C58,38 60,50 56,62 C52,70 48,70 44,62 C40,50 42,38 50,32 Z" fill="${s.dark}" opacity=".3"/>` +
        `<path d="M50,38 L54,50 L50,62 L46,50 Z" fill="${s.mark}" opacity=".55"/>` +
        // 复眼
        `<circle cx="41" cy="45" r="4.4" fill="${s.eye}" opacity=".28"/>` +
        `<circle cx="59" cy="45" r="4.4" fill="${s.eye}" opacity=".28"/>` +
        `<circle cx="41" cy="45" r="2.6" fill="${s.eye}"/>` +
        `<circle cx="59" cy="45" r="2.6" fill="${s.eye}"/>` +
        `<circle cx="46" cy="39" r="1.7" fill="${s.eye}"/>` +
        `<circle cx="54" cy="39" r="1.7" fill="${s.eye}"/>` +
        `<circle cx="50" cy="49" r="1.4" fill="${s.eye}" opacity=".8"/>` +
        // 螯牙
        `<path d="M45,70 C43,76 45,80 49,79 C47,76 46,73 47,70 Z" fill="#e8e0c8"/>` +
        `<path d="M55,70 C57,76 55,80 51,79 C53,76 54,73 53,70 Z" fill="#e8e0c8"/>`
      );
    },

    /* 蛇 / 蜥蜴:三角头 + 竖瞳 + 分叉舌 */
    beast_serpent(s) {
      return (
        // 兜帽/颈部张开
        `<path d="M50,26 C66,30 74,44 70,60 C64,54 58,50 50,50 C42,50 36,54 30,60 C26,44 34,30 50,26 Z" fill="${s.dark}" opacity=".5"/>` +
        // 头
        `<path d="M50,24 C61,24 70,34 70,45 C70,56 61,66 50,66 C39,66 30,56 30,45 C30,34 39,24 50,24 Z" fill="${s.fur}" stroke="${s.dark}" stroke-width="1.5"/>` +
        // 鳞纹
        `<path d="M40,34 C46,31 54,31 60,34" fill="none" stroke="${s.dark}" stroke-width="1.2" opacity=".5"/>` +
        `<path d="M38,58 C44,62 56,62 62,58" fill="none" stroke="${s.dark}" stroke-width="1.2" opacity=".5"/>` +
        slitEye(41, 44, s.eye) +
        slitEye(59, 44, s.eye) +
        // 眉棱
        `<path d="M31,38 L45,36" stroke="${s.dark}" stroke-width="2.4" stroke-linecap="round"/>` +
        `<path d="M69,38 L55,36" stroke="${s.dark}" stroke-width="2.4" stroke-linecap="round"/>` +
        // 鼻孔
        `<circle cx="46" cy="55" r="1.3" fill="${s.dark}"/>` +
        `<circle cx="54" cy="55" r="1.3" fill="${s.dark}"/>` +
        // 口线 + 分叉舌
        `<path d="M38,58 C44,63 56,63 62,58" fill="none" stroke="${s.dark}" stroke-width="1.6"/>` +
        `<path d="M50,63 L50,76 M50,76 L45,82 M50,76 L55,82" stroke="${s.tongue}" stroke-width="2" fill="none" stroke-linecap="round"/>` +
        // 獠牙
        `<path d="M43,59 L44,52 L46.4,59 Z" fill="#f2eddd"/>` +
        `<path d="M57,59 L56,52 L53.6,59 Z" fill="#f2eddd"/>`
      );
    },

    /* 龟 / 甲兽:壳 + 伸出的头 */
    beast_turtle(s) {
      return (
        // 壳
        `<path d="M14,66 C14,44 30,30 50,30 C70,30 86,44 86,66 Z" fill="${s.shell}" stroke="${s.dark}" stroke-width="1.8"/>` +
        `<path d="M50,30 L50,66 M30,38 L38,66 M70,38 L62,66" stroke="${s.dark}" stroke-width="1.4" opacity=".5"/>` +
        `<path d="M22,54 C34,46 66,46 78,54" fill="none" stroke="${s.dark}" stroke-width="1.4" opacity=".5"/>` +
        // 头
        `<ellipse cx="50" cy="72" rx="17" ry="14" fill="${s.fur}" stroke="${s.dark}" stroke-width="1.5"/>` +
        eye(43, 70, 2.6, s.eye, 6) +
        eye(57, 70, 2.6, s.eye, 6) +
        // 喙
        `<path d="M44,79 L50,84 L56,79" fill="${s.dark}"/>` +
        `<path d="M44,79 L50,84 L56,79" fill="none" stroke="${s.shell}" stroke-width="1"/>`
      );
    },

    /* 人形 · 蛮兵:宽肩 + 简易铁盔 + 獠牙 */
    humanoid_brute(s) {
      return (
        // 躯干
        `<path d="M6,100 C8,80 22,69 50,69 C78,69 92,80 94,100 Z" fill="${s.cloth}"/>` +
        `<path d="M9,100 C9,83 18,72 31,71 L35,85 L23,100 Z" fill="${s.metal}"/>` +
        `<path d="M91,100 C91,83 82,72 69,71 L65,85 L77,100 Z" fill="${s.metal}"/>` +
        // 脖子
        `<path d="M43,50 L57,50 L57,71 L43,71 Z" fill="${s.skinDark}"/>` +
        // 头
        `<path d="M50,24 C60,24 66,31 66,41 C66,52 60,62 50,62 C40,62 34,52 34,41 C34,31 40,24 50,24 Z" fill="${s.skin}" stroke="${s.skinDark}" stroke-width="1.5"/>` +
        // 铁盔
        `<path d="M32,36 C32,25 39,19 50,19 C61,19 68,25 68,36 L68,40 L61,40 L61,30 C57,26 43,26 39,30 L39,40 L32,40 Z" fill="${s.metal}" stroke="${s.metalDark}" stroke-width="1.2"/>` +
        `<path d="M50,19 L50,40" stroke="${s.metalDark}" stroke-width="2"/>` +
        // 眼
        eye(43, 44, 2.6, s.eye, 6) +
        eye(57, 44, 2.6, s.eye, 6) +
        // 下颚獠牙
        `<path d="M44,55 C47,58 53,58 56,55" fill="none" stroke="${s.skinDark}" stroke-width="1.5"/>` +
        `<path d="M45,55 L45.6,49.5 L47.6,55 Z" fill="#f2eddd"/>` +
        `<path d="M55,55 L54.4,49.5 L52.4,55 Z" fill="#f2eddd"/>`
      );
    },

    /* 人形 · 施法者:深兜帽 + 发光眼 + 法杖 */
    humanoid_caster(s) {
      return (
        // 法杖
        `<path d="M82,26 L74,88" stroke="${s.wood}" stroke-width="3.4" stroke-linecap="round"/>` +
        `<circle cx="83" cy="22" r="7" fill="${s.glow}" opacity=".28"/>` +
        `<circle cx="83" cy="22" r="3.4" fill="${s.glow}"/>` +
        // 躯干
        `<path d="M8,100 C10,80 24,69 50,69 C76,69 90,80 92,100 Z" fill="${s.cloth}"/>` +
        `<path d="M42,72 Q50,84 58,72" fill="none" stroke="${s.clothDark}" stroke-width="2.4"/>` +
        // 头
        `<path d="M50,26 C60,26 66,33 66,43 C66,53 60,62 50,62 C40,62 34,53 34,43 C34,33 40,26 50,26 Z" fill="${s.skin}" stroke="${s.skinDark}" stroke-width="1.4"/>` +
        // 兜帽
        `<path d="M29,46 C29,24 38,16 50,16 C62,16 71,24 71,46 C70,34 61,28 50,28 C39,28 30,34 29,46 Z" fill="${s.clothDark}"/>` +
        `<path d="M29,46 C29,24 38,16 50,16 C62,16 71,24 71,46" fill="none" stroke="${s.cloth}" stroke-width="1.6"/>` +
        // 阴影中的发光眼
        eye(43, 44, 2.6, s.glow, 7) +
        eye(57, 44, 2.6, s.glow, 7) +
        // 阴影压暗下半脸
        `<path d="M36,50 C40,58 60,58 64,50 C60,54 40,54 36,50 Z" fill="${s.clothDark}" opacity=".5"/>`
      );
    },

    /* 亡灵 · 骷髅:深眼窝 + 鼻腔 + 牙列 */
    undead_skeleton(s) {
      return (
        // 躯干(破布 + 肋骨)
        `<path d="M10,100 C12,82 25,71 50,71 C75,71 88,82 90,100 Z" fill="${s.cloth}"/>` +
        `<path d="M40,78 L60,78 M38,85 L62,85 M40,92 L60,92" stroke="${s.bone}" stroke-width="2.6" stroke-linecap="round" opacity=".8"/>` +
        // 颈椎
        `<path d="M45,56 L55,56 L55,72 L45,72 Z" fill="${s.bone}" stroke="${s.boneDark}" stroke-width="1"/>` +
        // 头骨
        `<path d="M50,20 C61,20 68,28 68,40 C68,49 64,55 58,58 L58,64 C58,67 54,69 50,69 C46,69 42,67 42,64 L42,58 C36,55 32,49 32,40 C32,28 39,20 50,20 Z" fill="${s.bone}" stroke="${s.boneDark}" stroke-width="1.5"/>` +
        // 眼窝
        `<ellipse cx="42" cy="41" rx="6.4" ry="6.8" fill="#1c1e1a"/>` +
        `<ellipse cx="58" cy="41" rx="6.4" ry="6.8" fill="#1c1e1a"/>` +
        `<circle cx="42" cy="41.5" r="2.2" fill="${s.glow}"/>` +
        `<circle cx="58" cy="41.5" r="2.2" fill="${s.glow}"/>` +
        `<circle cx="42" cy="41.5" r="5.4" fill="${s.glow}" opacity=".26"/>` +
        `<circle cx="58" cy="41.5" r="5.4" fill="${s.glow}" opacity=".26"/>` +
        // 鼻腔
        `<path d="M50,47 L47,53 L53,53 Z" fill="#1c1e1a"/>` +
        // 颧骨高光
        `<path d="M34,47 C36,50 39,52 41,52" fill="none" stroke="#fff" stroke-width="1.4" opacity=".28"/>` +
        `<path d="M66,47 C64,50 61,52 59,52" fill="none" stroke="#fff" stroke-width="1.4" opacity=".28"/>` +
        // 牙列
        `<path d="M42,58 L58,58 L58,64 C54,67 46,67 42,64 Z" fill="#1c1e1a" opacity=".8"/>` +
        `<path d="M44,58.5 L44,63 M47,58.5 L47,64.6 M50,58.5 L50,65 M53,58.5 L53,64.6 M56,58.5 L56,63" stroke="${s.bone}" stroke-width="2" stroke-linecap="round"/>`
      );
    },

    /* 亡灵 · 僵尸:腐烂不对称 + 一只凸眼 */
    undead_zombie(s) {
      return (
        `<path d="M8,100 C10,80 24,69 50,69 C76,69 90,80 92,100 Z" fill="${s.cloth}"/>` +
        // 破布撕裂
        `<path d="M30,80 L36,92 L42,82 L48,94 L54,84 L60,94 L66,82" fill="none" stroke="${s.clothDark}" stroke-width="2"/>` +
        `<path d="M43,50 L57,50 L57,71 L43,71 Z" fill="${s.skinDark}"/>` +
        // 头(不对称,左侧腐坏)
        `<path d="M50,23 C61,23 67,31 67,42 C67,53 61,63 50,63 C39,63 33,53 33,42 C33,31 39,23 50,23 Z" fill="${s.skin}" stroke="${s.skinDark}" stroke-width="1.5"/>` +
        // 腐烂区
        `<path d="M33,42 C33,31 39,23 50,23 C46,32 45,48 48,60 C41,58 34,52 33,42 Z" fill="${s.rot}" opacity=".55"/>` +
        `<path d="M37,36 L42,40 L38,45 Z" fill="${s.skinDark}" opacity=".7"/>` +
        // 一大一小的眼
        `<circle cx="42" cy="43" r="5" fill="#20241e"/>` +
        `<circle cx="42" cy="43" r="2.6" fill="${s.glow}"/>` +
        `<circle cx="42" cy="43" r="6.4" fill="${s.glow}" opacity=".2"/>` +
        `<circle cx="59" cy="44" r="2.4" fill="#20241e"/>` +
        // 歪嘴 + 缺牙
        `<path d="M41,55 C46,59 54,57 58,53" fill="none" stroke="${s.skinDark}" stroke-width="2" stroke-linecap="round"/>` +
        `<path d="M45,55.5 L45,59 M50,56.5 L50,60" stroke="#e9e7dd" stroke-width="2.2" stroke-linecap="round"/>`
      );
    },

    /* 火元素:多层火焰 + 核心 */
    elem_fire(s) {
      return (
        `<path d="M50,12 C56,28 68,34 70,50 C72,64 62,76 50,78 C38,76 28,64 30,50 C32,40 38,36 42,28 C43,38 48,42 50,12 Z" fill="${s.deep}" opacity=".95"/>` +
        `<path d="M50,26 C55,38 62,42 63,53 C64,63 58,71 50,73 C42,71 36,63 37,53 C38,45 45,41 50,26 Z" fill="${s.main}"/>` +
        `<path d="M50,40 C53,48 57,51 57,58 C57,65 54,69 50,70 C46,69 43,65 43,58 C43,52 47,48 50,40 Z" fill="${s.hot}"/>` +
        // 眼
        `<ellipse cx="44" cy="52" rx="2.6" ry="3.4" fill="#2a1408"/>` +
        `<ellipse cx="56" cy="52" rx="2.6" ry="3.4" fill="#2a1408"/>` +
        `<circle cx="44" cy="52" r="5" fill="${s.hot}" opacity=".35"/>` +
        `<circle cx="56" cy="52" r="5" fill="${s.hot}" opacity=".35"/>` +
        // 火星
        `<circle cx="34" cy="26" r="2" fill="${s.hot}" opacity=".7"/>` +
        `<circle cx="70" cy="32" r="1.5" fill="${s.hot}" opacity=".55"/>` +
        `<circle cx="24" cy="58" r="1.6" fill="${s.hot}" opacity=".45"/>`
      );
    },

    /* 石元素:岩块 + 发光裂缝 */
    elem_stone(s) {
      return (
        `<path d="M22,74 L14,52 L24,32 L44,22 L66,26 L80,44 L78,68 L62,80 L38,82 Z" fill="${s.stone}" stroke="${s.dark}" stroke-width="1.8"/>` +
        // 块面
        `<path d="M24,32 L44,22 L50,44 L32,52 Z" fill="${s.light}" opacity=".5"/>` +
        `<path d="M50,44 L66,26 L80,44 L62,52 Z" fill="${s.dark}" opacity=".35"/>` +
        `<path d="M32,52 L50,44 L62,52 L62,80 L38,82 Z" fill="${s.dark}" opacity=".22"/>` +
        // 发光裂缝
        `<path d="M36,36 L44,44 L40,52 L48,60" fill="none" stroke="${s.glow}" stroke-width="2" opacity=".85"/>` +
        `<path d="M68,40 L62,50 L66,58" fill="none" stroke="${s.glow}" stroke-width="1.6" opacity=".7"/>` +
        // 眼
        eye(42, 50, 3, s.glow, 8) +
        eye(58, 48, 3, s.glow, 8) +
        // 苔藓
        `<circle cx="30" cy="70" r="4" fill="${s.moss}" opacity=".55"/>` +
        `<circle cx="72" cy="64" r="3" fill="${s.moss}" opacity=".45"/>`
      );
    },

    /* 树 / 植物:树干 + 树冠 + 树洞眼 */
    elem_tree(s) {
      return (
        // 树干
        `<path d="M40,86 C40,70 36,58 34,46 L66,46 C64,58 60,70 60,86 Z" fill="${s.wood}" stroke="${s.dark}" stroke-width="1.6"/>` +
        `<path d="M46,86 L46,52 M54,86 L54,52" stroke="${s.dark}" stroke-width="1.2" opacity=".5"/>` +
        // 树冠
        `<circle cx="36" cy="38" r="15" fill="${s.leaf}"/>` +
        `<circle cx="64" cy="38" r="15" fill="${s.leaf}"/>` +
        `<circle cx="50" cy="26" r="17" fill="${s.leafLight}"/>` +
        `<circle cx="50" cy="44" r="13" fill="${s.leaf}"/>` +
        // 叶簇暗部
        `<circle cx="30" cy="46" r="9" fill="${s.leafDark}" opacity=".55"/>` +
        `<circle cx="70" cy="46" r="9" fill="${s.leafDark}" opacity=".55"/>` +
        // 树洞眼
        `<ellipse cx="43" cy="60" rx="4.4" ry="5.2" fill="#1c1a12"/>` +
        `<ellipse cx="57" cy="60" rx="4.4" ry="5.2" fill="#1c1a12"/>` +
        `<circle cx="43" cy="60" r="2" fill="${s.glow}"/>` +
        `<circle cx="57" cy="60" r="2" fill="${s.glow}"/>` +
        `<circle cx="43" cy="60" r="5" fill="${s.glow}" opacity=".25"/>` +
        `<circle cx="57" cy="60" r="5" fill="${s.glow}" opacity=".25"/>` +
        // 裂口嘴
        `<path d="M44,72 C47,76 53,76 56,72" fill="none" stroke="${s.dark}" stroke-width="2" stroke-linecap="round"/>`
      );
    },

    /* 恶魔 · 角魔:弯角 + 獠牙 + 竖瞳 */
    demon_horned(s) {
      return (
        // 角
        `<path d="M38,26 C28,16 18,16 12,24 C20,22 28,26 34,34 Z" fill="${s.horn}" stroke="${s.hornDark}" stroke-width="1.2"/>` +
        `<path d="M62,26 C72,16 82,16 88,24 C80,22 72,26 66,34 Z" fill="${s.horn}" stroke="${s.hornDark}" stroke-width="1.2"/>` +
        // 躯干
        `<path d="M8,100 C10,80 24,69 50,69 C76,69 90,80 92,100 Z" fill="${s.cloth}"/>` +
        `<path d="M9,100 C9,83 18,72 31,71 L35,85 L23,100 Z" fill="${s.armor}"/>` +
        `<path d="M91,100 C91,83 82,72 69,71 L65,85 L77,100 Z" fill="${s.armor}"/>` +
        `<path d="M43,50 L57,50 L57,71 L43,71 Z" fill="${s.skinDark}"/>` +
        // 头
        `<path d="M50,24 C61,24 67,32 67,43 C67,54 61,64 50,64 C39,64 33,54 33,43 C33,32 39,24 50,24 Z" fill="${s.skin}" stroke="${s.skinDark}" stroke-width="1.5"/>` +
        // 眉骨 + 眼
        `<path d="M35,38 L46,36" stroke="${s.skinDark}" stroke-width="3.2" stroke-linecap="round"/>` +
        `<path d="M65,38 L54,36" stroke="${s.skinDark}" stroke-width="3.2" stroke-linecap="round"/>` +
        slitEye(42, 43, s.eye) +
        slitEye(58, 43, s.eye) +
        // 鼻
        `<path d="M50,46 L47.6,52 L52.4,52 Z" fill="${s.skinDark}"/>` +
        // 嘴 + 獠牙
        `<path d="M42,56 C46,59 54,59 58,56" fill="none" stroke="${s.skinDark}" stroke-width="1.8"/>` +
        `<path d="M44,56 L44.6,49.5 L47,56 Z" fill="#f4efe0"/>` +
        `<path d="M56,56 L55.4,49.5 L53,56 Z" fill="#f4efe0"/>`
      );
    },

    /* 龙:长吻 + 双角 + 鳞 + 竖瞳 */
    dragon_wyrm(s) {
      return (
        // 角
        `<path d="M38,28 C30,18 20,14 12,16 C20,22 28,30 33,38 Z" fill="${s.horn}" stroke="${s.hornDark}" stroke-width="1.2"/>` +
        `<path d="M62,28 C70,18 80,14 88,16 C80,22 72,30 67,38 Z" fill="${s.horn}" stroke="${s.hornDark}" stroke-width="1.2"/>` +
        // 颈
        `<path d="M30,100 C32,78 40,68 50,68 C60,68 68,78 70,100 Z" fill="${s.scale}"/>` +
        `<path d="M40,78 C44,86 56,86 60,78" fill="none" stroke="${s.scaleDark}" stroke-width="1.6" opacity=".7"/>` +
        // 头 + 长吻
        `<path d="M50,22 C62,22 70,31 70,42 C70,50 66,55 60,58 L54,76 L46,76 L40,58 C34,55 30,50 30,42 C30,31 38,22 50,22 Z" fill="${s.scale}" stroke="${s.scaleDark}" stroke-width="1.6"/>` +
        // 鳞片
        `<path d="M36,32 C42,29 58,29 64,32" fill="none" stroke="${s.scaleDark}" stroke-width="1.2" opacity=".55"/>` +
        `<path d="M33,38 C39,35 61,35 67,38" fill="none" stroke="${s.scaleDark}" stroke-width="1.2" opacity=".4"/>` +
        // 眼
        slitEye(41, 44, s.eye) +
        slitEye(59, 44, s.eye) +
        // 眉棱
        `<path d="M31,37 L46,35" stroke="${s.scaleDark}" stroke-width="2.6" stroke-linecap="round"/>` +
        `<path d="M69,37 L54,35" stroke="${s.scaleDark}" stroke-width="2.6" stroke-linecap="round"/>` +
        // 鼻孔 + 烟
        `<circle cx="47" cy="66" r="1.5" fill="${s.scaleDark}"/>` +
        `<circle cx="53" cy="66" r="1.5" fill="${s.scaleDark}"/>` +
        `<circle cx="42" cy="72" r="2.4" fill="${s.smoke}" opacity=".35"/>` +
        `<circle cx="58" cy="73" r="2" fill="${s.smoke}" opacity=".28"/>` +
        // 口 + 獠牙
        `<path d="M42,70 C46,74 54,74 58,70" fill="none" stroke="${s.scaleDark}" stroke-width="1.8"/>` +
        `<path d="M44,70 L44.6,64 L47,70 Z" fill="#f4efe0"/>` +
        `<path d="M56,70 L55.4,64 L53,70 Z" fill="#f4efe0"/>`
      );
    },

    /* 机械:方形头 + 横条眼 + 天线 + 铆钉 */
    mech_bot(s) {
      return (
        // 躯干
        `<path d="M14,100 C16,84 28,74 50,74 C72,74 84,84 86,100 Z" fill="${s.body}"/>` +
        `<path d="M22,86 L38,86 M62,86 L78,86" stroke="${s.dark}" stroke-width="2.2" stroke-linecap="round" opacity=".6"/>` +
        // 脖子
        `<path d="M44,64 L56,64 L56,76 L44,76 Z" fill="${s.dark}"/>` +
        // 方形头
        `<rect x="28" y="22" width="44" height="42" rx="8" fill="${s.body}" stroke="${s.dark}" stroke-width="2"/>` +
        `<rect x="32" y="26" width="36" height="34" rx="5" fill="${s.face}"/>` +
        // 横条眼
        `<rect x="37" y="38" width="26" height="7" rx="3.5" fill="${s.eye}"/>` +
        `<rect x="37" y="38" width="26" height="7" rx="3.5" fill="${s.eyeHot}" opacity=".55"/>` +
        // 通风口
        `<path d="M40,50 L60,50 M43,54 L57,54" stroke="${s.dark}" stroke-width="2" stroke-linecap="round" opacity=".65"/>` +
        // 天线
        `<path d="M50,22 L50,12" stroke="${s.dark}" stroke-width="2.4"/>` +
        `<circle cx="50" cy="10" r="3.2" fill="${s.eye}" opacity=".9"/>` +
        `<circle cx="50" cy="10" r="6" fill="${s.eye}" opacity=".22"/>` +
        // 铆钉
        `<circle cx="33" cy="27" r="1.6" fill="${s.dark}"/>` +
        `<circle cx="67" cy="27" r="1.6" fill="${s.dark}"/>` +
        `<circle cx="33" cy="59" r="1.6" fill="${s.dark}"/>` +
        `<circle cx="67" cy="59" r="1.6" fill="${s.dark}"/>`
      );
    },

    /* 人形 · 刺客:兜帽压眉 + 面罩 + 匕首(盗匪/斥候/爪牙) */
    humanoid_rogue(s) {
      return (
        // 匕首
        `<path d="M80,30 L74,52" stroke="${s.blade}" stroke-width="3" stroke-linecap="round"/>` +
        `<path d="M80,30 L83,24 L81,32 Z" fill="${s.blade}"/>` +
        `<path d="M72,52 L77,54" stroke="${s.wood}" stroke-width="3.4" stroke-linecap="round"/>` +
        // 躯干(暗色皮甲)
        `<path d="M8,100 C10,80 24,69 50,69 C76,69 90,80 92,100 Z" fill="${s.cloth}"/>` +
        `<path d="M13,100 C14,86 21,76 31,74 L33,83 L24,100 Z" fill="${s.armor}"/>` +
        `<path d="M87,100 C86,86 79,76 69,74 L67,83 L76,100 Z" fill="${s.armor}"/>` +
        // 头(大部分藏在兜帽阴影里)
        `<path d="M50,28 C59,28 65,34 65,44 C65,53 59,61 50,61 C41,61 35,53 35,44 C35,34 41,28 50,28 Z" fill="${s.skin}"/>` +
        // 兜帽(压低到眉骨)
        `<path d="M28,48 C28,24 37,15 50,15 C63,15 72,24 72,48 C71,35 62,29 50,29 C38,29 29,35 28,48 Z" fill="${s.cloth}"/>` +
        `<path d="M28,48 C28,24 37,15 50,15 C63,15 72,24 72,48" fill="none" stroke="${s.armor}" stroke-width="1.5"/>` +
        // 兜帽下的阴影
        `<path d="M33,44 C37,52 63,52 67,44 C63,50 37,50 33,44 Z" fill="#000" opacity=".45"/>` +
        // 阴影中发光的眼
        eye(43, 45, 2.4, s.eye, 6.5) +
        eye(57, 45, 2.4, s.eye, 6.5) +
        // 面罩(只遮口鼻)
        `<path d="M36,50 Q50,55 64,50 L64,60 Q50,66 36,60 Z" fill="${s.cloth}"/>` +
        `<path d="M36,50 Q50,55 64,50" fill="none" stroke="${s.armor}" stroke-width="1.2" opacity=".85"/>`
      );
    },

    /* 水 / 冰元素:流动水滴 + 内部漩涡 + 冰晶棱 */
    elem_water(s) {
      return (
        // 主体水滴
        `<path d="M50,12 C62,32 76,42 76,56 C76,70 64,80 50,80 C36,80 24,70 24,56 C24,42 38,32 50,12 Z" fill="${s.main}" opacity=".92"/>` +
        // 内部漩涡
        `<path d="M50,34 C60,42 64,50 62,58 C60,68 52,73 45,72 C38,71 34,64 36,57 C38,50 46,46 52,48" fill="none" stroke="${s.light}" stroke-width="2.4" opacity=".5" stroke-linecap="round"/>` +
        // 高光
        `<path d="M40,42 C42,36 46,32 50,30" fill="none" stroke="#fff" stroke-width="2.6" opacity=".4" stroke-linecap="round"/>` +
        // 冰晶棱角
        `<path d="M28,52 L22,44 L30,42 Z" fill="${s.light}" opacity=".7"/>` +
        `<path d="M72,50 L80,44 L74,40 Z" fill="${s.light}" opacity=".6"/>` +
        `<path d="M44,18 L50,10 L56,19 Z" fill="${s.light}" opacity=".5"/>` +
        // 眼
        `<ellipse cx="43" cy="52" rx="3" ry="4" fill="#0c1c24" opacity=".8"/>` +
        `<ellipse cx="57" cy="52" rx="3" ry="4" fill="#0c1c24" opacity=".8"/>` +
        `<circle cx="43" cy="52" r="2" fill="${s.eye}"/>` +
        `<circle cx="57" cy="52" r="2" fill="${s.eye}"/>` +
        `<circle cx="43" cy="52" r="5" fill="${s.eye}" opacity=".3"/>` +
        `<circle cx="57" cy="52" r="5" fill="${s.eye}" opacity=".3"/>` +
        // 飞溅水珠
        `<circle cx="30" cy="26" r="2.2" fill="${s.light}" opacity=".65"/>` +
        `<circle cx="72" cy="28" r="1.6" fill="${s.light}" opacity=".5"/>`
      );
    },

    /* 幽灵:半透明飘浮 + 空洞眼 */
    undead_ghost(s) {
      return (
        // 飘动的尾
        `<path d="M50,30 C70,30 80,46 78,62 C76,76 70,84 64,92 C66,82 60,80 58,88 C54,96 46,96 42,88 C40,80 34,82 36,92 C30,84 24,76 22,62 C20,46 30,30 50,30 Z" fill="${s.skin}" opacity=".72"/>` +
        // 头
        `<path d="M50,22 C62,22 69,31 69,43 C69,55 62,64 50,64 C38,64 31,55 31,43 C31,31 38,22 50,22 Z" fill="${s.skin}" opacity=".9"/>` +
        // 空洞眼
        `<ellipse cx="42" cy="42" rx="4.6" ry="5.6" fill="#101418"/>` +
        `<ellipse cx="58" cy="42" rx="4.6" ry="5.6" fill="#101418"/>` +
        `<circle cx="42" cy="42" r="1.8" fill="${s.glow}"/>` +
        `<circle cx="58" cy="42" r="1.8" fill="${s.glow}"/>` +
        `<circle cx="42" cy="42" r="4.6" fill="${s.glow}" opacity=".28"/>` +
        `<circle cx="58" cy="42" r="4.6" fill="${s.glow}" opacity=".28"/>` +
        // 哀嚎的嘴
        `<ellipse cx="50" cy="55" rx="4.4" ry="5.6" fill="#101418" opacity=".85"/>` +
        // 高光
        `<path d="M36,30 C40,26 46,24 50,24" fill="none" stroke="#fff" stroke-width="2" opacity=".22"/>`
      );
    },
  };

  // ---------- emoji → 物种 ----------
  // 只列「能显著提升辨识度」的物种;没列到的按 kind 回退,保证 501 个怪物都有贴图
  const EMOJI = {
    // 兽
    '🐺': { s: 'beast_wolf', fur: '#8a8578', dark: '#4a4640', eye: '#ffc94d', bg: '#1e1c1a', ring: '#6a6458' },
    '🐕': { s: 'beast_wolf', fur: '#9a7a52', dark: '#5a4228', eye: '#ffc94d', bg: '#201b16', ring: '#6a5a44' },
    '🐕‍🦺': { s: 'beast_wolf', fur: '#8a6a44', dark: '#4a3420', eye: '#ffc94d', bg: '#201b16', ring: '#6a5a44' },
    '🦊': { s: 'beast_wolf', fur: '#c46a32', dark: '#7a3a18', eye: '#ffe08a', bg: '#241a12', ring: '#8a5a3a' },
    '🐗': { s: 'beast_boar', fur: '#6a5a48', dark: '#3a2e22', snout: '#a8846a', eye: '#ff9a3c', bg: '#1e1a16', ring: '#6a5a48' },
    '🐷': { s: 'beast_boar', fur: '#c99a9a', dark: '#8a5a5a', snout: '#e8b8b8', eye: '#3a2a2a', bg: '#221a1a', ring: '#8a6a6a' },
    '🐖': { s: 'beast_boar', fur: '#c99a9a', dark: '#8a5a5a', snout: '#e8b8b8', eye: '#3a2a2a', bg: '#221a1a', ring: '#8a6a6a' },
    '🕷️': { s: 'beast_spider', fur: '#3a3440', dark: '#1e1a24', mark: '#c04030', eye: '#ff4a3a', bg: '#16141a', ring: '#4a4050' },
    '🕸️': { s: 'beast_spider', fur: '#3a3440', dark: '#1e1a24', mark: '#8a8a9a', eye: '#ff4a3a', bg: '#16141a', ring: '#4a4050' },
    '🦂': { s: 'beast_spider', fur: '#8a5a2a', dark: '#4a2e12', mark: '#c08a3a', eye: '#ffd24d', bg: '#1e1810', ring: '#6a4a28' },
    '🐍': { s: 'beast_serpent', fur: '#5a7a3a', dark: '#2e421e', eye: '#c8ff5a', tongue: '#c03a4a', bg: '#161c12', ring: '#4a5a3a' },
    '🐉': { s: 'dragon_wyrm', scale: '#8a3a2a', scaleDark: '#4a1e14', horn: '#d8c9a8', hornDark: '#8a7a5a', eye: '#ffb43a', smoke: '#c9c9c9', bg: '#20120e', ring: '#7a3a2a' },
    '🐲': { s: 'dragon_wyrm', scale: '#3a7a4a', scaleDark: '#1e4228', horn: '#c9d8b8', hornDark: '#7a8a6a', eye: '#ffd24d', smoke: '#b8d8b8', bg: '#0e1e14', ring: '#3a6a4a' },
    '🦖': { s: 'dragon_wyrm', scale: '#5a6a3a', scaleDark: '#2e3a1e', horn: '#a8a888', hornDark: '#6a6a52', eye: '#ffcf4d', smoke: '#c9c9a8', bg: '#161a10', ring: '#4a5a32' },
    '🦕': { s: 'dragon_wyrm', scale: '#6a7a5a', scaleDark: '#3a422e', horn: '#b8b8a0', hornDark: '#7a7a68', eye: '#ffd97a', smoke: '#c9c9b8', bg: '#181c14', ring: '#5a6a48' },
    '🦎': { s: 'beast_serpent', fur: '#6a8a3a', dark: '#3a4e1e', eye: '#ffd24d', tongue: '#c03a4a', bg: '#161c10', ring: '#4a6a2a' },
    '🐊': { s: 'beast_serpent', fur: '#4a6a3a', dark: '#24361e', eye: '#ffd24d', tongue: '#c03a4a', bg: '#121a12', ring: '#3a5a2a' },
    '🐢': { s: 'beast_turtle', shell: '#5a6a3a', fur: '#7a8a5a', dark: '#2e3a1e', eye: '#ffd24d', bg: '#141a12', ring: '#4a5a3a' },
    // 人形
    '🧙': { s: 'humanoid_caster', skin: '#c9a882', skinDark: '#8a6a48', cloth: '#3a4a7a', clothDark: '#1e2a48', wood: '#6a4a2a', glow: '#8fc4ff', bg: '#141828', ring: '#3a4a7a' },
    '🧙‍♀️': { s: 'humanoid_caster', skin: '#c9a882', skinDark: '#8a6a48', cloth: '#5a3a7a', clothDark: '#2e1e48', wood: '#6a4a2a', glow: '#c08fff', bg: '#1a1428', ring: '#5a3a7a' },
    '🎓': { s: 'humanoid_caster', skin: '#c9a882', skinDark: '#8a6a48', cloth: '#3a3a4a', clothDark: '#1e1e28', wood: '#6a4a2a', glow: '#a8d8ff', bg: '#141420', ring: '#4a4a5a' },
    '⚔️': { s: 'humanoid_brute', skin: '#a88a6a', skinDark: '#6a5238', cloth: '#7a2e28', metal: '#a8b0ba', metalDark: '#5a626c', eye: '#ffd24d', bg: '#20120e', ring: '#8a5a4a' },
    '🗡️': { s: 'humanoid_brute', skin: '#a88a6a', skinDark: '#6a5238', cloth: '#3a3a44', metal: '#b8c0ca', metalDark: '#626a74', eye: '#ffd24d', bg: '#141418', ring: '#5a5a66' },
    '🔪': { s: 'humanoid_brute', skin: '#a88a6a', skinDark: '#6a5238', cloth: '#3a2e2a', metal: '#a8b0ba', metalDark: '#5a626c', eye: '#ffd24d', bg: '#181410', ring: '#5a4a40' },
    '🪓': { s: 'humanoid_brute', skin: '#8a7a5a', skinDark: '#4e442e', cloth: '#5a3a22', metal: '#9aa4ae', metalDark: '#525a64', eye: '#ffb43a', bg: '#1a140e', ring: '#6a4a2a' },
    '🛡️': { s: 'humanoid_brute', skin: '#b09a7a', skinDark: '#6e5c40', cloth: '#2e4a7a', metal: '#c0c8d2', metalDark: '#6a7480', eye: '#a8d8ff', bg: '#121828', ring: '#3a5a8a' },
    '🧌': { s: 'humanoid_brute', skin: '#7a9a5a', skinDark: '#42582e', cloth: '#4a3a22', metal: '#8a8a7a', metalDark: '#4e4e42', eye: '#ffcf4d', bg: '#141a10', ring: '#4a6a3a' },
    '👹': { s: 'demon_horned', skin: '#b03a2e', skinDark: '#6e1e16', horn: '#e8d8b0', hornDark: '#8a7a52', cloth: '#3a1e1a', armor: '#7a5a2a', eye: '#ffd24d', bg: '#22100c', ring: '#8a3a2a' },
    '👺': { s: 'demon_horned', skin: '#c04a2e', skinDark: '#7a2414', horn: '#f0e0b8', hornDark: '#9a8a5a', cloth: '#2e1a14', armor: '#8a3a22', eye: '#ffe14d', bg: '#24120e', ring: '#9a4a2a' },
    // 亡灵
    '💀': { s: 'undead_skeleton', bone: '#ddd8c8', boneDark: '#8a8474', cloth: '#2e2e34', glow: '#7fff9a', bg: '#16181a', ring: '#5a5a52' },
    '☠️': { s: 'undead_skeleton', bone: '#cfc9b8', boneDark: '#7a7466', cloth: '#2a2a30', glow: '#a8ff8a', bg: '#141618', ring: '#52524a' },
    '🦴': { s: 'undead_skeleton', bone: '#e0dbc8', boneDark: '#8e8878', cloth: '#303036', glow: '#8affaa', bg: '#181a1c', ring: '#5e5e56' },
    '🧟': { s: 'undead_zombie', skin: '#8a9a6a', skinDark: '#4e5a38', rot: '#5a6a3a', cloth: '#3a3428', clothDark: '#221e16', glow: '#c8ff6a', bg: '#181a12', ring: '#5a6a48' },
    '🧟‍♂️': { s: 'undead_zombie', skin: '#8a9a6a', skinDark: '#4e5a38', rot: '#5a6a3a', cloth: '#3a3428', clothDark: '#221e16', glow: '#c8ff6a', bg: '#181a12', ring: '#5a6a48' },
    '👻': { s: 'undead_ghost', skin: '#b8c8d8', glow: '#8fe8ff', bg: '#141a22', ring: '#5a6a7a' },
    '🧛': { s: 'demon_horned', skin: '#c9c0d8', skinDark: '#7a7088', horn: '#8a3a4a', hornDark: '#4a1e28', cloth: '#1e1420', armor: '#3a2440', eye: '#ff3a4a', bg: '#1a1018', ring: '#5a3a4a' },
    // 元素
    '🔥': { s: 'elem_fire', deep: '#a82a08', main: '#f06a1e', hot: '#ffd24d', bg: '#20100a', ring: '#8a3a1a' },
    '🌋': { s: 'elem_fire', deep: '#8a1e08', main: '#d84a14', hot: '#ffb43a', bg: '#1c0c08', ring: '#7a2e12' },
    '🗿': { s: 'elem_stone', stone: '#8a8478', light: '#b8b2a4', dark: '#4e4a42', glow: '#ffd24d', moss: '#5f8a4a', bg: '#181614', ring: '#6a6458' },
    '🪨': { s: 'elem_stone', stone: '#7a7468', light: '#a8a294', dark: '#42403a', glow: '#8fd8ff', moss: '#4a6a3a', bg: '#141412', ring: '#5a564c' },
    '🌳': { s: 'elem_tree', wood: '#6a4a2e', dark: '#3a2818', leaf: '#3a6a32', leafLight: '#4e8a3e', leafDark: '#28481e', glow: '#c8ff6a', bg: '#101a10', ring: '#3a5a2a' },
    '🌿': { s: 'elem_tree', wood: '#5a4a2e', dark: '#322818', leaf: '#4a7a3a', leafLight: '#5e9a48', leafDark: '#2e5224', glow: '#d8ff8a', bg: '#121a10', ring: '#446a32' },
    '🍄': { s: 'elem_tree', wood: '#c9c0b0', dark: '#7a7468', leaf: '#b03a3a', leafLight: '#d84a4a', leafDark: '#7a2424', glow: '#ffd24d', bg: '#1a1414', ring: '#7a4a4a' },
    '🤖': { s: 'mech_bot', body: '#8a929c', dark: '#4a525c', face: '#1e242a', eye: '#6fd8ff', eyeHot: '#d8f8ff', bg: '#141820', ring: '#5a626c' },
    '⚙️': { s: 'mech_bot', body: '#9a8a6a', dark: '#544a36', face: '#241e16', eye: '#ffc94d', eyeHot: '#ffe9a8', bg: '#1a1610', ring: '#6a5e44' },
    '🔧': { s: 'mech_bot', body: '#8a8a8a', dark: '#4a4a4a', face: '#1e1e1e', eye: '#ff9a3c', eyeHot: '#ffd24d', bg: '#161616', ring: '#5a5a5a' },
    '⛏️': { s: 'mech_bot', body: '#8a7a5a', dark: '#4a3e2a', face: '#241e14', eye: '#ffd24d', eyeHot: '#fff0b8', bg: '#18140e', ring: '#64563a' },
    '👁️': { s: 'elem_stone', stone: '#6a4a6a', light: '#9a6a9a', dark: '#3a2440', glow: '#ff6a8a', moss: '#5a3a5a', bg: '#1a1018', ring: '#5a3a5a' },
    '🌑': { s: 'undead_ghost', skin: '#5a4a6a', glow: '#c06fff', bg: '#100c16', ring: '#4a3a5a' },
    '😈': { s: 'demon_horned', skin: '#7a3a9a', skinDark: '#4a1e62', horn: '#e0d0b0', hornDark: '#8a7a5a', cloth: '#241428', armor: '#5a3a7a', eye: '#c06fff', bg: '#160c1c', ring: '#5a3a6a' },
    '👿': { s: 'demon_horned', skin: '#9a2a4a', skinDark: '#5a1428', horn: '#e8d8b8', hornDark: '#8a7a5a', cloth: '#28141a', armor: '#6a2a3a', eye: '#ff4a6a', bg: '#1c0e12', ring: '#6a2a3a' },
  };

  /* ---------- 名字染色 ----------
   * emoji 只是「物种」的近似,不携带温度/属性信息:冰霜巨人的 emoji 是 🗿(石像),
   * 但显然该是冰蓝而不是土黄;熔岩犬的 emoji 是 🐕,该是赤红。
   * 所以用怪物名字里的关键词覆盖「主色 + 背景 + 圆环」,形状保持不变。
   * 每个剪影声明自己的主色字段(MAIN_KEY),这样覆盖规则不用关心具体剪影。 */
  const MAIN_KEY = {
    beast_wolf: 'fur', beast_boar: 'fur', beast_spider: 'fur', beast_serpent: 'fur', beast_turtle: 'shell',
    humanoid_brute: 'skin', humanoid_caster: 'skin', humanoid_rogue: 'skin',
    undead_skeleton: 'bone', undead_zombie: 'skin', undead_ghost: 'skin',
    elem_fire: 'main', elem_stone: 'stone', elem_tree: 'leaf', elem_water: 'main',
    demon_horned: 'skin', dragon_wyrm: 'scale', mech_bot: 'body',
  };

  const NAME_TINTS = [
    { re: /冰|霜|雪|寒|冻|凛|极寒/, main: '#8fc4d8', bg: '#101820', ring: '#5a8aa8' },
    { re: /火|熔|焰|炎|燃|烬|炭|炽|烈焰/, main: '#c0522a', bg: '#1c0e08', ring: '#8a3a1a' },
    { re: /毒|酸|腐|疫|瘟|病/, main: '#7a9a3a', bg: '#12180e', ring: '#5a7a2a' },
    { re: /血|骨|尸|骸|屠/, main: '#8a3a3a', bg: '#180e0e', ring: '#6a2a2a' },
    { re: /暗|影|幽|魂|冥|虚|梦|暮/, main: '#5a4a6a', bg: '#0e0c14', ring: '#4a3a5a' },
    { re: /娜迦|鱼人|海|潮|浪|渊|水/, main: '#4a8a9a', bg: '#0c1618', ring: '#3a6a7a' },
    { re: /雷|电|风暴|飓/, main: '#7a6ac0', bg: '#12101e', ring: '#5a4a9a' },
    { re: /圣|光|辉|曜|金|神/, main: '#d8c07a', bg: '#1a1710', ring: '#a88a3a' },
    { re: /石|岩|土|砂|矿/, main: '#8a8478', bg: '#16140f', ring: '#6a6458' },
  ];

  function tintBy(spec, name) {
    const key = MAIN_KEY[spec.s];
    if (!key || !name) return spec;
    for (const t of NAME_TINTS) {
      if (t.re.test(name)) {
        const out = Object.assign({}, spec);
        out[key] = t.main;
        out.bg = t.bg;
        out.ring = t.ring;
        return out;
      }
    }
    return spec;
  }

  /* ---------- 个体差异 ----------
   * 124 个人形怪如果都用同一个 spec,在列表里会像克隆人。
   * 用 id 做确定性哈希,对主色做 ±10% 的暖冷偏移:同族不同个体,但同一怪物每次渲染都一样。 */
  function hash01(str) {
    let h = 2166136261;
    for (let i = 0; i < (str || '').length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0) / 4294967296;
  }

  function vary(hex, seed) {
    if (!hex || hex[0] !== '#' || hex.length !== 7) return hex;
    const n = parseInt(hex.slice(1), 16);
    const d = (seed - 0.5) * 0.2; // ±10%
    const ch = (v, k) => {
      const x = Math.round(v * (1 + d * k));
      return Math.max(0, Math.min(255, x)).toString(16).padStart(2, '0');
    };
    return '#' + ch((n >> 16) & 255, 1) + ch((n >> 8) & 255, 0.6) + ch(n & 255, -0.5);
  }

  // kind 兜底:保证任何怪物都有贴图
  const KIND = {
    beast: { s: 'beast_wolf', fur: '#8a7a5a', dark: '#4a3e28', eye: '#ffc94d', bg: '#1c1812', ring: '#6a5a44' },
    humanoid: { s: 'humanoid_brute', skin: '#a88a6a', skinDark: '#6a5238', cloth: '#4a3a2a', metal: '#9aa4ae', metalDark: '#525a64', eye: '#ffd24d', bg: '#181410', ring: '#5a4a3a' },
    undead: { s: 'undead_skeleton', bone: '#d8d3c2', boneDark: '#84806e', cloth: '#2c2c32', glow: '#8aff9a', bg: '#15171a', ring: '#55554e' },
    elemental: { s: 'elem_stone', stone: '#8a8478', light: '#b8b2a4', dark: '#4e4a42', glow: '#ffd24d', moss: '#5f8a4a', bg: '#181614', ring: '#6a6458' },
    demon: { s: 'demon_horned', skin: '#9a3a3a', skinDark: '#5e1e1e', horn: '#e0d0b0', hornDark: '#8a7a5a', cloth: '#241418', armor: '#6a3a2a', eye: '#ffd24d', bg: '#1c0e0e', ring: '#6a2e2e' },
    dragon: { s: 'dragon_wyrm', scale: '#7a3a2a', scaleDark: '#421e14', horn: '#d0c8a8', hornDark: '#847a5a', eye: '#ffb43a', smoke: '#c0c0c0', bg: '#1c1210', ring: '#6a3a2a' },
    mechanical: { s: 'mech_bot', body: '#8a929c', dark: '#4a525c', face: '#1e242a', eye: '#6fd8ff', eyeHot: '#d8f8ff', bg: '#141820', ring: '#5a626c' },
  };

  /* ---------- 族匹配 ----------
   * 同一个 emoji 会跨 kind 出现:👹 既是霍格(豺狼人/humanoid)也是卡扎克(恶魔/demon),
   * 💀 既是巫妖(undead)也是末日守卫(demon)。直接按 emoji 取剪影会让豺狼人长出恶魔角。
   * 所以:emoji 与 kind 同族才采用 emoji 剪影,跨族回退到 kind 的默认骨架,
   * 只有「emoji 明显更准确」的少数组合(蛇人、蛛魔、龙兽)进 CROSS_KEEP 白名单。 */
  const SPEC_FAMILY = {
    beast_wolf: 'beast', beast_boar: 'beast', beast_spider: 'beast', beast_serpent: 'beast', beast_turtle: 'beast',
    humanoid_brute: 'humanoid', humanoid_caster: 'humanoid', humanoid_rogue: 'humanoid',
    undead_skeleton: 'undead', undead_zombie: 'undead', undead_ghost: 'undead',
    elem_fire: 'elemental', elem_stone: 'elemental', elem_tree: 'elemental', elem_water: 'elemental',
    demon_horned: 'demon', dragon_wyrm: 'dragon', mech_bot: 'mechanical',
  };

  // 跨族但 emoji 更准的例外(kind:emoji → 剪影)
  const CROSS_KEEP = {
    'humanoid:🐍': 'beast_serpent',  // 蛇人 / 哈卡
    'humanoid:🐗': 'beast_boar',     // 野猪人
    'humanoid:🦂': 'beast_spider',   // 蝎人
    'humanoid:🕷️': 'beast_spider',  // 蛛魔
    'humanoid:🐕': 'beast_wolf',     // 豺狼人
    'humanoid:🦍': 'beast_wolf',     // 雪人
    'beast:🐉': 'dragon_wyrm',       // 龙兽 / 幼龙
    'beast:🐲': 'dragon_wyrm',
    'beast:🦎': 'beast_serpent',
    'undead:🕷️': 'beast_spider',
    'undead:🐛': 'beast_spider',
    'elemental:🐛': 'beast_spider',
    'elemental:🦑': 'beast_spider',
  };

  /* 名字决定剪影:同一 emoji 下的「强盗」和「卫兵」不该长得一样。
   * 限定 kind 是必须的 —— 否则「冰霜巨人(humanoid)」会被 elemental 的冰规则抢走。 */
  const NAME_SHAPE = [
    { kind: 'humanoid', re: /强盗|盗贼|刺客|斥候|爪牙|匪|掠夺|走私|海盗|扒手|暗影斥候/, s: 'humanoid_rogue' },
    { kind: 'elemental', re: /冰|霜|雪|寒|冻|凛|水|潮|浪|渊|漩涡|虚空|雨/, s: 'elem_water' },
  ];

  // 每个剪影的默认配色(跨族改剪影时用来补齐字段)
  const SHAPE_DEFAULT = {
    // 名字规则专用剪影:EMOJI 表里没有,这里给默认配色
    humanoid_rogue: { s: 'humanoid_rogue', skin: '#a88a6a', skinDark: '#6a5238', cloth: '#2e2e38',
      armor: '#4a4a56', blade: '#b8c0ca', wood: '#5a4228', eye: '#8fd0ff', bg: '#141418', ring: '#4a4a56' },
    elem_water: { s: 'elem_water', main: '#3a8ab8', light: '#8fd8f0', eye: '#d8f8ff',
      bg: '#0c1820', ring: '#3a7a9a' },
  };
  Object.keys(EMOJI).forEach((k) => {
    const sp = EMOJI[k];
    if (!SHAPE_DEFAULT[sp.s]) SHAPE_DEFAULT[sp.s] = sp;
  });

  function resolve(monster) {
    const m = monster || {};
    const kind = m.kind || 'humanoid';
    const kd = KIND[kind] || KIND.humanoid;
    const byEmoji = m.icon && EMOJI[m.icon];
    // 名字规则优先:直接决定剪影,配色取该剪影默认值
    const byName = NAME_SHAPE.find((r) => r.kind === kind && r.re.test(m.name || ''));
    if (byName && SHAPE_DEFAULT[byName.s]) {
      const tinted = tintBy(SHAPE_DEFAULT[byName.s], m.name);
      const k = MAIN_KEY[tinted.s];
      if (!k) return tinted;
      const out = Object.assign({}, tinted);
      out[k] = vary(tinted[k], hash01(m.id || m.name || ''));
      return out;
    }
    let base;
    if (byEmoji && SPEC_FAMILY[byEmoji.s] === kind) {
      base = byEmoji;                       // 同族:emoji 精确剪影
    } else if (byEmoji && CROSS_KEEP[kind + ':' + m.icon]) {
      const s = CROSS_KEEP[kind + ':' + m.icon];
      base = SHAPE_DEFAULT[s] || kd;        // 白名单:换剪影,配色取该剪影默认值
    } else {
      base = kd;                            // 跨族:回到 kind 骨架
    }
    const tinted = tintBy(base, m.name);
    // 个体差异只作用在主色上,眼睛/发光/金属等强调色保持不变
    const key = MAIN_KEY[tinted.s];
    if (!key) return tinted;
    const out = Object.assign({}, tinted);
    out[key] = vary(tinted[key], hash01(m.id || m.name || ''));
    return out;
  }

  function build(monster, opts) {
    const o = opts || {};
    const spec = resolve(monster);
    const shape = SHAPES[spec.s] || SHAPES.humanoid_brute;
    // 精英/首领:圆环换成对应品质色,让卡牌一眼看出强度
    let ring = spec.ring;
    if (monster && monster.world) ring = '#a335ee';
    else if (monster && monster.boss) ring = '#ff6a5e';
    else if (monster && monster.elite) ring = '#f0c75e';
    return bg(spec.bg, spec.ring) + shape(spec) + vignette() + frame(ring, o.frame || 'circle');
  }

  const MonsterArt = {
    svg(monster, opts) {
      const o = opts || {};
      const size = o.size ? ` width="${o.size}" height="${o.size}"` : '';
      return (
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"${size} role="img" ` +
        `aria-label="${(monster && monster.name) || '怪物'}">${build(monster, o)}</svg>`
      );
    },

    uri(monster, opts) {
      const o = opts || {};
      // 缓存键:emoji + kind + 强度标记 + 尺寸,足够区分且不会因对象引用失效
      const key = [(monster && monster.icon) || '', (monster && monster.kind) || '',
        monster && monster.boss ? 'b' : '', monster && monster.elite ? 'e' : '',
        monster && monster.world ? 'w' : '', o.size || 0, o.frame || 'circle'].join('|');
      if (!cache[key]) cache[key] = 'data:image/svg+xml,' + encodeURIComponent(this.svg(monster, o));
      return cache[key];
    },

    html(monster, opts) {
      const o = opts || {};
      const size = o.size || 40;
      const cls = o.cls ? ' ' + o.cls : '';
      return (
        `<img class="ma-portrait${cls}" src="${this.uri(monster, o)}" width="${size}" height="${size}" ` +
        `alt="${(monster && monster.name) || ''}" draggable="false" loading="lazy">`
      );
    },

    // 便于测试/统计:某个怪物会落到哪个剪影
    shapeOf(monster) {
      return resolve(monster).s;
    },
    EMOJI,
    KIND,
  };

  W.MonsterArt = MonsterArt;
})();
