// A copy of the shop on this computer: the database (orders, dresses, settings, requests) as SQL,
// and every photograph and video. The photographs never change once stored (each has its own key),
// so a run downloads only what is new since the last one; the database is exported whole each time.
//
//   npm run backup                          -> ~/Documents/Dresses by Greta backups
//   npm run backup -- "/path/to/a/folder"   -> anywhere, e.g. a folder in iCloud Drive
//
// Needs wrangler signed in to the shop's Cloudflare account (npx wrangler login). Read only: it
// changes nothing in the shop. SHOP_URL overrides the address the files are downloaded from.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

const root = resolve(dirname(new URL(import.meta.url).pathname), '..');
const config = JSON.parse(
  readFileSync(join(root, 'wrangler.jsonc'), 'utf8')
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n'),
);
const DB = config.d1_databases[0].database_name;
const KV = config.kv_namespaces[0].id;
const SITE = (process.env.SHOP_URL ?? 'https://www.dressesbygreta.workers.dev').replace(/\/$/, '');
const arg = process.argv[2];
const DEST = arg ? resolve(arg.replace(/^~(?=$|\/)/, homedir())) : join(homedir(), 'Documents', 'Dresses by Greta backups');

const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
mkdirSync(join(DEST, 'database'), { recursive: true });
mkdirSync(join(DEST, 'media'), { recursive: true });
const wrangler = (args, opts = {}) => execFileSync('npx', ['wrangler', ...args], { cwd: root, maxBuffer: 256 * 1024 * 1024, ...opts });

// 1. the database, whole
const sqlFile = join(DEST, 'database', `greta-${stamp}.sql`);
console.log(`Database -> ${sqlFile}`);
wrangler(['d1', 'export', DB, '--remote', '--output', sqlFile], { stdio: ['ignore', 'ignore', 'inherit'] });

// 2. every photograph and video, only the ones not yet here
const keys = JSON.parse(wrangler(['kv', 'key', 'list', '--namespace-id', KV, '--remote'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] })).map((k) => k.name);
const missing = keys.filter((k) => {
  const file = join(DEST, 'media', k);
  return !existsSync(file) || statSync(file).size === 0;
});
console.log(`Photos and videos: ${keys.length} in the shop, ${missing.length} new to download`);
let done = 0;
let failed = 0;
const queue = [...missing];
await Promise.all(
  Array.from({ length: 8 }, async () => {
    for (let key = queue.shift(); key; key = queue.shift()) {
      const url = `${SITE}/${key.includes('/clip.') ? 'vid' : 'img'}/${key}`;
      try {
        const res = await fetch(url, { headers: { 'user-agent': 'greta-backup' } });
        if (!res.ok) throw new Error(String(res.status));
        const file = join(DEST, 'media', key);
        mkdirSync(dirname(file), { recursive: true });
        writeFileSync(file, Buffer.from(await res.arrayBuffer()));
        done++;
      } catch (e) {
        failed++;
        console.error(`  could not download ${key}: ${e.message}`);
      }
    }
  }),
);

writeFileSync(
  join(DEST, 'README.txt'),
  `Dresses by Greta, backup

database/  the shop's database as SQL, one file per backup (orders, dresses, settings, requests).
media/     every photograph and video, under the same names the shop stores them by.

To restore into a new Cloudflare database:
  npx wrangler d1 create greta-restored
  npx wrangler d1 execute greta-restored --remote --file database/<the file>.sql
then put its id in wrangler.jsonc. To put the photographs back, upload media/ into a KV namespace
with npx wrangler kv bulk put (keys are the paths under media/).

Last backup: ${new Date().toISOString()} (${keys.length} files in the shop).
`,
);
console.log(`Done: ${done} downloaded${failed ? `, ${failed} failed (run it again)` : ''}. Backup in ${DEST}`);
if (failed) process.exitCode = 1;
