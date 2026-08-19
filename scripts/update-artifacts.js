/* 生成在线增量更新产物:
 *   update.json         更新清单(版本 / 全量包 / 补丁包 / 逐文件 SHA-256)
 *   www-vX.Y.Z.zip      全量 Web 资源包
 *   patch-vX.Y.Z.zip    相对上一版本的增量补丁(仅变更/新增文件)
 * 用法:
 *   node scripts/update-artifacts.js [--base <上一版 update.json 路径>] [--out <输出目录>]
 *   (--base 提供时生成补丁;未提供则只有全量包)
 */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createZip } = require('./zip-writer');

const ROOT = path.join(__dirname, '..');
const WWW = path.join(ROOT, 'www');
const REPO = process.env.GITHUB_REPOSITORY || 'chwl66/wow-web';
const VERSION = (() => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  return (pkg.version || '1.0.0').replace(/^v/, '');
})();

function sha256(buf) { return crypto.createHash('sha256').update(buf).digest('hex'); }

function walkDir(dir, base, out) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const rel = path.join(base, name).replace(/\\/g, '/');
    const st = fs.statSync(full);
    if (st.isDirectory()) walkDir(full, rel, out);
    else out.push(rel);
  }
  return out;
}

(async function main() {
  const args = process.argv.slice(2);
  const baseArg = (args.find((a) => a.startsWith('--base=')) || '').split('=')[1] || (args.includes('--base') ? args[args.indexOf('--base') + 1] : null);
  const outArg = (args.find((a) => a.startsWith('--out=')) || '').split('=')[1] || (args.includes('--out') ? args[args.indexOf('--out') + 1] : null);

  if (!fs.existsSync(path.join(WWW, 'index.html'))) {
    console.error('❌ www/ 不存在,请先运行 npm run www:sync');
    process.exit(1);
  }

  // 1. 收集全部文件 + 哈希
  const rels = walkDir(WWW, '', []);
  const files = {};
  const entries = [];
  for (const rel of rels.sort()) {
    const buf = fs.readFileSync(path.join(WWW, rel));
    files[rel] = { sha256: sha256(buf), size: buf.length };
    entries.push({ name: rel, data: buf });
  }

  // 2. 上一版清单(用于增量补丁)
  let prev = null;
  if (baseArg && fs.existsSync(baseArg)) {
    try { prev = JSON.parse(fs.readFileSync(baseArg, 'utf8')); } catch (e) { prev = null; }
  }

  // 3. 全量包
  const fullBuf = createZip(entries);

  // 4. 补丁包(相对上一版变更/新增的文件)
  let patchBuf = null;
  let patchBase = null;
  if (prev && prev.version && prev.files) {
    const changed = entries.filter((e) => !prev.files[e.name] || prev.files[e.name].sha256 !== files[e.name].sha256);
    if (changed.length) {
      patchBuf = createZip(changed);
      patchBase = prev.version;
    }
  }

  // 5. 输出目录
  const outDir = path.resolve(outArg || path.join(ROOT, 'dist-update'));
  fs.mkdirSync(outDir, { recursive: true });

  const dl = `https://github.com/${REPO}/releases/download/v${VERSION}`;
  const manifest = {
    version: VERSION,
    code: (() => { const [m, mi, p] = VERSION.split('.').map((n) => parseInt(n, 10) || 0); return m * 10000 + mi * 100 + p; })(),
    patch: patchBuf ? {
      base: patchBase,
      url: `${dl}/patch-v${VERSION}.zip`,
      sha256: sha256(patchBuf),
      size: patchBuf.length,
    } : null,
    full: {
      url: `${dl}/www-v${VERSION}.zip`,
      sha256: sha256(fullBuf),
      size: fullBuf.length,
    },
    files,
  };

  // 6. 落盘
  fs.writeFileSync(path.join(outDir, 'update.json'), JSON.stringify(manifest, null, 2));
  fs.writeFileSync(path.join(outDir, `www-v${VERSION}.zip`), fullBuf);
  if (patchBuf) fs.writeFileSync(path.join(outDir, `patch-v${VERSION}.zip`), patchBuf);

  // 7. 摘要
  console.log(`✅ 更新产物已生成 → ${outDir}`);
  console.log(`   版本: v${VERSION} (code ${manifest.code})`);
  console.log(`   文件数: ${entries.length}, 全量包: ${(fullBuf.length / 1024).toFixed(1)} KB (sha256 ${manifest.full.sha256.slice(0, 12)}…)`);
  if (patchBuf) console.log(`   增量补丁: ${(patchBuf.length / 1024).toFixed(1)} KB (基准 v${patchBase}, ${patchBuf ? '' : ''}变更 ${(() => { const c = entries.filter((e) => !prev.files[e.name] || prev.files[e.name].sha256 !== files[e.name].sha256); return c.length; })()} 个文件, sha256 ${manifest.patch.sha256.slice(0, 12)}…)`);
  else console.log('   增量补丁: (无上一版清单,跳过)');
})();
