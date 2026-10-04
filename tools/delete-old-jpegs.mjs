// Removes the JPEG copies left in the shop's photo store after the photographs were re-encoded as
// WebP (2026-10-03). Run it yourself, once, after a backup:
//
//   npm run backup
//   node tools/delete-old-jpegs.mjs
//
// It deletes a JPEG only when (1) no photograph in the shop uses JPEG for that key any more, (2) its
// WebP of the same width is in the store, and (3) the JPEG is in the backup folder. It lists what
// it would delete and asks you to type DELETE first. Deleting cannot be undone in the shop; the
// files stay in the backup.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';

const root = resolve(dirname(new URL(import.meta.url).pathname), '..');
const config = JSON.parse(
  readFileSync(join(root, 'wrangler.jsonc'), 'utf8')
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n'),
);
const DB = config.d1_databases[0].database_name;
const KV = config.kv_namespaces[0].id;
const BACKUP = resolve((process.argv[2] ?? join(homedir(), 'Documents', 'Dresses by Greta backups')).replace(/^~(?=$|\/)/, homedir()));
const wrangler = (args) => execFileSync('npx', ['wrangler', ...args], { cwd: root, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'inherit'] });

const keys = new Set(JSON.parse(wrangler(['kv', 'key', 'list', '--namespace-id', KV, '--remote'])).map((k) => k.name));
const rows = JSON.parse(wrangler(['d1', 'execute', DB, '--remote', '--json', '--command', 'SELECT key, ext FROM product_images UNION ALL SELECT key, ext FROM lookbook_frames']))[0].results;
const stillJpeg = new Set(rows.filter((r) => r.ext === 'jpg').map((r) => r.key));

const doomed = [];
const kept = [];
for (const k of keys) {
  const m = /^(.*)\/(\d+)\.jpg$/.exec(k);
  if (!m) continue;
  const [, base, width] = m;
  const why = stillJpeg.has(base) ? 'still used as JPEG' : !keys.has(`${base}/${width}.webp`) ? 'no WebP beside it' : !existsSync(join(BACKUP, 'media', k)) ? 'not in the backup' : '';
  (why ? kept : doomed).push(why ? `${k} (${why})` : k);
}

console.log(`JPEG files in the store: ${doomed.length + kept.length}`);
console.log(`  safe to delete: ${doomed.length}`);
if (kept.length) console.log(`  kept: ${kept.length}\n    ${kept.slice(0, 10).join('\n    ')}${kept.length > 10 ? '\n    …' : ''}`);
if (!doomed.length) process.exit(0);

const rl = createInterface({ input: process.stdin, output: process.stdout });
const answer = await rl.question(`Type DELETE to remove those ${doomed.length} JPEG files from the shop's store (they stay in ${BACKUP}): `);
rl.close();
if (answer.trim() !== 'DELETE') {
  console.log('Nothing deleted.');
  process.exit(0);
}
const file = join(mkdtempSync(join(tmpdir(), 'greta-')), 'keys.json');
writeFileSync(file, JSON.stringify(doomed));
execFileSync('npx', ['wrangler', 'kv', 'bulk', 'delete', file, '--namespace-id', KV, '--remote', '--force'], { cwd: root, stdio: 'inherit' });
console.log(`Deleted ${doomed.length} JPEG files.`);
