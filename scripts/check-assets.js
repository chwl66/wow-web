/* 静态资源自检:校验 index.html 引用的本地 js/css 文件都存在,并汇报首屏体积。
 * 引用缺失是运行期才炸的错误(某个 WOW.Data 未定义),必须在 CI 拦下。
 * 体积超预算只告警不失败 —— 本项目靠数据扩充成长,超限是提醒而非阻断。
 * 用法: node scripts/check-assets.js [预算KB,默认900] */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

const refs = [];
for (const m of html.matchAll(/<script[^>]*\bsrc\s*=\s*["']([^"']+)["']/g)) refs.push(m[1]);
for (const m of html.matchAll(/<link[^>]*\bhref\s*=\s*["']([^"']+)["']/g)) refs.push(m[1]);

const local = refs.filter((r) => !/^(https?:|data:|\/\/)/i.test(r));
// 统一剥离 ?query/#hash 后再解析本地路径,避免「缺失检查 / 存在检查 / 体积统计」三处口径不一致
const localPath = (r) => path.join(ROOT, r.split(/[?#]/)[0]);
const missing = local.filter((r) => !fs.existsSync(localPath(r)));

for (const r of local) {
  const ok = fs.existsSync(localPath(r));
  console.log(`${ok ? '  ✅' : '  ❌'} ${r}`);
}
if (missing.length) {
  console.error(`\n❌ index.html 引用了 ${missing.length} 个不存在的文件: ${missing.join(', ')}`);
  console.error('   新增 js/*.js 后记得在 index.html 按依赖顺序补 <script src>。');
  process.exit(1);
}

let total = 0;
for (const r of local) total += fs.statSync(localPath(r)).size;
const kb = total / 1024;
const budget = parseFloat(process.argv[2]) || 900;
console.log(`\n首屏资源: ${local.length} 个文件, ${kb.toFixed(1)} KB(未压缩)`);
if (kb > budget) {
  console.warn(`::warning::首屏资源 ${kb.toFixed(1)} KB 超出预算 ${budget} KB。`);
  console.warn('   可考虑: 确认托管端已开 gzip; 或把增长最多的数据表拆分为按需加载。');
} else {
  console.log(`预算内(≤ ${budget} KB)`);
}

// 脚本加载顺序自检:被依赖的文件不能排在依赖者之后
const order = ['ns.js', 'data-races.js', 'data-world.js', 'data-talents.js', 'engine.js',
  'character.js', 'combat.js', 'battle.js', 'world.js', 'main.js'];
const seq = [];
for (const m of html.matchAll(/<script[^>]*\bsrc\s*=\s*["']js\/([^"']+)["']/g)) seq.push(m[1]);
const bad = [];
for (let i = 0; i < seq.length; i++) {
  const at = order.indexOf(seq[i]);
  if (at < 0) continue;
  for (let j = i + 1; j < seq.length; j++) {
    const bt = order.indexOf(seq[j]);
    if (bt >= 0 && bt < at) bad.push(`${seq[j]} 必须在 ${seq[i]} 之前`);
  }
}
if (bad.length) {
  console.error(`\n❌ 脚本顺序有误(后者依赖前者挂载的 WOW.*):\n   ${bad.join('\n   ')}`);
  process.exit(1);
}
console.log('脚本加载顺序符合依赖关系');
