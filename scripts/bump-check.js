/* 发版判定:package.json 版本是否高于最新已发布 Release。
 * 输出 key=value 行,CI 可直接重定向进 $GITHUB_OUTPUT:
 *   node scripts/bump-check.js --latest=1.0.0 >> "$GITHUB_OUTPUT"
 * 本地预演(需 gh 已登录,否则按无 Release 处理):
 *   node scripts/bump-check.js
 * 始终退出 0 —— 是否发版由 release_needed 决定,不该让判定本身中断流水线。 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const version = (JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version || '1.0.0').replace(/^v/, '');

function parse(v) { return String(v || '0.0.0').replace(/^v/, '').split('.').map((n) => parseInt(n, 10) || 0); }

// 逐段比较:缺位补 0;完全相等视为已发布,不再重复发版
function isGreater(a, b) {
  const x = parse(a), y = parse(b);
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const p = x[i] || 0, q = y[i] || 0;
    if (p > q) return true;
    if (p < q) return false;
  }
  return false;
}

function latestFromGh() {
  try {
    const out = execFileSync('gh', ['release', 'list', '--limit', '1', '--json', 'tagName', '-q', '.[0].tagName'],
      { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim();
    return out.replace(/^v/, '');
  } catch (e) {
    // 本地未装 gh / 未登录时按「无已发布 Release」处理(仍是首版语义)。
    // 但在 CI(GitHub Actions / 已注入 GH_TOKEN)中失败说明凭证或网络有问题,
    // 若继续按「无 Release」处理会误判为「需要发版」,这里必须把原因喊出来。
    if (process.env.GITHUB_ACTIONS || process.env.GH_TOKEN) {
      console.error(`⚠️ 无法读取已发布 Release(gh 调用失败),将按「无 Release」处理:`);
      console.error(`   ${(e.stderr ? e.stderr.toString() : e.message || '').trim().split('\n')[0]}`);
    }
    return '';
  }
}

const arg = process.argv.slice(2).find((a) => a.startsWith('--latest'));
const latest = arg ? (arg.split('=')[1] || '').replace(/^v/, '') : latestFromGh();
const needed = isGreater(version, latest || '0.0.0');

console.log(`version=${version}`);
console.log(`latest=${latest}`);
console.log(`release_needed=${needed}`);
console.error(needed
  ? `🚀 ${latest ? `v${latest}` : '无已发布版本'} → 将发布 v${version}`
  : `⏸️ 已是最新(v${version}),本次推送不发版`);
