/* 版本号生成脚本:从 package.json 读取版本,写入 js/version.js(浏览器端可读取)
 * 由 www:sync 调用,保证 Web/安卓端版本号与 package.json 始终一致。 */
'use strict';
const fs = require('fs');
const path = require('path');
const { versionCode } = require('./version-code');

const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
const version = (pkg.version || '1.0.0').replace(/^v/, '');
const code = versionCode(version);

const out = `/* 自动生成,请勿手动编辑 —— 由 scripts/gen-version.js 从 package.json 生成 */
window.WOW_VERSION = ${JSON.stringify(version)};
window.WOW_VERSION_CODE = ${code};
`;

// 原子写入:先写临时文件再改名,避免写一半被中断留下半个 version.js;
// Windows 上 rename 覆盖已存在文件可能失败,失败时回退为直接覆盖。
const outFile = path.join(__dirname, '..', 'js', 'version.js');
const tmpFile = outFile + '.tmp';
fs.writeFileSync(tmpFile, out);
try {
  fs.renameSync(tmpFile, outFile);
} catch (e) {
  fs.writeFileSync(outFile, out);
  try { fs.unlinkSync(tmpFile); } catch (_) { /* ignore */ }
}
console.log(`version.js → ${version} (code ${code})`);
