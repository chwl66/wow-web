/* 版本号 → 安卓 versionCode 的唯一换算处。
 * gen-version.js(写入 js/version.js)与 update-artifacts.js(写入 update.json 的 code)
 * 必须同源,否则安卓端「比较更新版本」会拿两个口径的 code 互相打架。
 * 规则:major*10000 + minor*100 + patch;minor/patch 需在 0-99,否则拒绝(避免进位串档)。 */
'use strict';

function parts(version) {
  return String(version || '0.0.0').replace(/^v/, '').split('.').map((n) => parseInt(n, 10) || 0);
}

function versionCode(version) {
  const [major, minor, patch] = parts(version);
  if (minor > 99 || patch > 99) {
    throw new Error(`版本号 minor/patch 段超出上限(需 ≤99):${version}(否则 versionCode 会跨档进位,与旧版本比较出错)`);
  }
  return major * 10000 + minor * 100 + patch;
}

module.exports = { versionCode, parts };
