/* 同步 Web 静态资源到 www/(Capacitor 安卓工程的 webDir)
 * 复制 index.html + css/ + js/,目标目录先删后拷,保证不残留已删除的旧文件。
 * 由 npm run www:sync 调用(cap:sync / apk / apk:release 均依赖它)。 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const WWW = path.join(ROOT, 'www');
const FILES = ['index.html'];
const DIRS = ['css', 'js'];

fs.mkdirSync(WWW, { recursive: true });

for (const f of FILES) {
  const src = path.join(ROOT, f);
  if (!fs.existsSync(src)) {
    console.error(`❌ 缺少 ${f}`);
    process.exit(1);
  }
  fs.copyFileSync(src, path.join(WWW, f));
}

let count = FILES.length;
for (const d of DIRS) {
  const src = path.join(ROOT, d);
  if (!fs.existsSync(src)) {
    console.error(`❌ 缺少 ${d}/`);
    process.exit(1);
  }
  const dest = path.join(WWW, d);
  fs.rmSync(dest, { recursive: true, force: true });
  fs.cpSync(src, dest, { recursive: true });
  count += fs.readdirSync(dest).length;
}

console.log(`www/ ← index.html + ${DIRS.join(' + ')} (${count} 项)`);
