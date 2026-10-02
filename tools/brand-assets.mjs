// The logo's raster companions, made from public/brand/logo.svg (tools/brand-logo.py):
// browser icons and the link-preview card, gold on the ivory of the Instagram picture.
//   node tools/brand-assets.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
// sharp arrives with wrangler (miniflare); it is not a direct dependency of the shop
import sharp from 'sharp';

const root = new URL('../public/brand/', import.meta.url);
const file = (name) => fileURLToPath(new URL(name, root));
const logo = readFileSync(file('logo.svg'), 'utf8');
const [vx, vy, vw, vh] = logo.match(/viewBox="([^"]+)"/)[1].split(' ').map(Number);
const path = logo.match(/<g fill=[\s\S]*<\/g>/)[0];
const IVORY = '#f3f3e7';
const INK = logo.match(/<g fill="(#[0-9a-f]{6})"/)[1];

/**
 * The logo centred on an ivory canvas, its larger side `fill` of the canvas. `bold` thickens the
 * strokes of the G (in logo units) for tab icons, where its hairlines would otherwise vanish; the
 * name stays thin, a faint band across the G, instead of a bar that reads as a strike-through.
 */
function card(w, h, fill, round = 0, bold = 0) {
  const s = Math.min((w * fill) / vw, (h * fill) / vh);
  const x = (w - vw * s) / 2 - vx * s;
  const y = (h - vh * s) / 2 - vy * s;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" rx="${round}" fill="${IVORY}"/><g transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${s.toFixed(5)})">${bold ? path.replace('<path fill-rule="evenodd" ', `<path fill-rule="evenodd" stroke="${INK}" stroke-width="${bold}" stroke-linejoin="round" `) : path}</g></svg>`;
}

// The tab icon, square like everything on the site: an SVG for browsers that take one (crisp at
// every size), a PNG for the rest.
writeFileSync(file('favicon.svg'), card(64, 64, 0.94, 0, 8) + '\n');
await sharp(Buffer.from(card(32, 32, 0.94, 0, 8)), { density: 288 }).resize(32, 32).png().toFile(file('favicon-32.png'));
// iOS draws its own rounded corners and wants an opaque square.
await sharp(Buffer.from(card(180, 180, 0.78)), { density: 144 }).resize(180, 180).png().toFile(file('apple-touch-icon.png'));
// Link previews (WhatsApp, Instagram DMs, Facebook): the logo on ivory, 1200 x 630.
await sharp(Buffer.from(card(1200, 630, 0.7)), { density: 144 }).resize(1200, 630).jpeg({ quality: 88, mozjpeg: true }).toFile(file('og.jpg'));
console.log('favicon.svg, favicon-32.png, apple-touch-icon.png, og.jpg');
