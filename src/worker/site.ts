/** Verified brand facts (public Instagram profile, read 2026-09-16). Nothing here is inferred. */
export const SITE = {
  name: 'Dresses by Greta',
  handle: 'dressesbygreta',
  instagram: 'https://www.instagram.com/dressesbygreta/',
  message: 'https://ig.me/m/dressesbygreta',
  address: 'Rruga Andon Zako Çajupi, pas LSI, Tiranë',
  maps: 'https://maps.google.com/?q=41.320034%2C19.812943',
  geo: { lat: 41.320034, lng: 19.812943 },
  /** the home photograph (a Reel cover of the shop's), enlarged 2x, at four widths in WebP and
   *  JPEG (tools/hero-upscale.py, tools/hero-variants.py) */
  hero: { base: '/brand/hero-garden', widths: [828, 1216, 1824, 2432], width: 1216, height: 2160 },
  /** link previews: the logo on the ivory of the Instagram picture (tools/brand-assets.mjs) */
  ogImage: '/brand/og.jpg',
  /** followers read by hand from the profile on 2026-09-16 (26.2K); the footer shows it until the
   *  admin links Instagram or types a newer number (instagram.ts) */
  followersSeed: 26200,
} as const;
