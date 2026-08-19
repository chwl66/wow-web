/* 版本号生成脚本:从 package.json 读取版本,写入 js/version.js(浏览器端可读取)
 * 由 www:sync 调用,保证 Web/安卓端版本号与 package.json 始终一致。 */
'use strict';
const fs = require('fs');
const path = require('path');

const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
const version = (pkg.version || '1.0.0').replace(/^v/, '');
const [major, minor, patch] = version.split('.').map((n) => parseInt(n, 10) || 0);
const code = major * 10000 + minor * 100 + patch;

const out = `/* 自动生成,请勿手动编辑 —— 由 scripts/gen-version.js 从 package.json 生成 */
window.WOW_VERSION = ${JSON.stringify(version)};
window.WOW_VERSION_CODE = ${code};
`;

fs.writeFileSync(path.join(__dirname, '..', 'js', 'version.js'), out);
console.log(`version.js → ${version} (code ${code})`);
