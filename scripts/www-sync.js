/* 同步 Web 静态资源到 www/(Capacitor 安卓工程的 webDir)
 * 复制 index.html + css/ + js/,目标目录整体先删后拷,保证不残留已删除的旧文件
 * (含 www/ 顶层历史遗留文件,而不只是 css/、js/ 子目录)。
 * 由 npm run www:sync 调用(cap:sync / apk / apk:release 均依赖它)。 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const WWW = path.join(ROOT, 'www');
const FILES = ['index.html'];
const DIRS = ['css', 'js'];

// 先校验源文件齐全,再重建 www/,避免缺文件时把已有的 www/ 删空
for (const f of FILES) {
  if (!fs.existsSync(path.join(ROOT, f))) { console.error(`❌ 缺少 ${f}`); process.exit(1); }
}
for (const d of DIRS) {
  if (!fs.existsSync(path.join(ROOT, d))) { console.error(`❌ 缺少 ${d}/`); process.exit(1); }
}

fs.rmSync(WWW, { recursive: true, force: true });
fs.mkdirSync(WWW, { recursive: true });

let count = 0;
for (const f of FILES) {
  fs.copyFileSync(path.join(ROOT, f), path.join(WWW, f));
  count++;
}

function countFiles(dir) {
  let n = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) n += countFiles(path.join(dir, entry.name));
    else n++;
  }
  return n;
}

for (const d of DIRS) {
  const dest = path.join(WWW, d);
  fs.cpSync(path.join(ROOT, d), dest, { recursive: true });
  count += countFiles(dest);
}

console.log(`www/ ← index.html + ${DIRS.join(' + ')} (${count} 项)`);
