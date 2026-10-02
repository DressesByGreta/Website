/**
 * For search engines: robots.txt, and a sitemap built from the live catalogue. Every page is listed
 * in the three languages with its alternates (hreflang, Albanian as x-default), and every dress with
 * its photographs, so the shop can also be found through image search. Drafts never appear: the
 * sitemap lists exactly what the shop shows. /llms.txt says the same in plain text for AI search
 * assistants (ChatGPT, Perplexity, Google's AI answers), which quote it when asked about the shop.
 */
import { Hono } from 'hono';
import { CATEGORIES, photoAt, SIZES } from '../../shared/catalog';
import { copy, href, LANGS, type Lang } from '../../shared/copy';
import { getLegalSettings, listVisible } from '../db';
import { SITE } from '../site';
import type { AppEnv } from '../types';

export const seo = new Hono<AppEnv>();

const HOUR = { 'cache-control': 'public, max-age=3600' };
const xml = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

seo.get('/robots.txt', (c) => {
  const origin = new URL(c.req.url).origin;
  const body = ['User-agent: *', 'Allow: /', 'Disallow: /admin', 'Disallow: /api/', 'Disallow: /porosia', 'Disallow: /pagesa/', '', `Sitemap: ${origin}/sitemap.xml`, ''];
  return c.text(body.join('\n'), 200, HOUR);
});

seo.get('/sitemap.xml', async (c) => {
  const origin = new URL(c.req.url).origin;
  const db = c.env.DB;
  const [products, dates, legal] = await Promise.all([
    listVisible(db, 'sq'),
    db.prepare(`SELECT slug, updated_at FROM products WHERE status = 'published'`).all<{ slug: string; updated_at: string }>(),
    getLegalSettings(db),
  ]);
  const updated = new Map((dates.results ?? []).map((r) => [r.slug, r.updated_at.slice(0, 10)]));
  const pages: { path: string; params?: Record<string, string>; lastmod?: string; images?: string[] }[] = [
    { path: '/' },
    { path: '/dyqani' },
    // only categories that hold a dress: an empty one would be a thin page
    ...CATEGORIES.filter((cat) => products.some((p) => p.categories.includes(cat))).map((cat) => ({ path: '/dyqani', params: { kategoria: cat } })),
    ...products.map((p) => ({ path: `/fustan/${p.slug}`, lastmod: updated.get(p.slug), images: p.photos.slice(0, 6).map((ph) => origin + photoAt(ph, 1600)) })),
    { path: '/kushtet', lastmod: legal.updated },
    { path: '/privatesia', lastmod: legal.updated },
  ];
  const urls = pages.flatMap((pg) => {
    const at = (l: Lang) => xml(origin + href(pg.path, l, pg.params ?? {}));
    const alternates = [...LANGS.map((l) => `<xhtml:link rel="alternate" hreflang="${l}" href="${at(l)}"/>`), `<xhtml:link rel="alternate" hreflang="x-default" href="${at('sq')}"/>`].join('');
    const images = (pg.images ?? []).map((src) => `<image:image><image:loc>${xml(src)}</image:loc></image:image>`).join('');
    return LANGS.map((l) => `<url><loc>${at(l)}</loc>${pg.lastmod ? `<lastmod>${pg.lastmod}</lastmod>` : ''}${alternates}${images}</url>`);
  });
  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n');
  return c.body(body, 200, { ...HOUR, 'content-type': 'application/xml; charset=utf-8' });
});

seo.get('/llms.txt', async (c) => {
  const origin = new URL(c.req.url).origin;
  const t = copy.en;
  const [products, { business, returns }] = await Promise.all([listVisible(c.env.DB, 'en'), getLegalSettings(c.env.DB)]);
  const all = (l: Lang) => origin + href('/dyqani', l);
  const lines = [
    `# ${SITE.name}`,
    '',
    `> ${t.meta.homeDescription}`,
    '',
    `${SITE.name} is a dress boutique in Tirana, Albania, at ${SITE.address}, with an online shop in Albanian, English and French. Prices are in Albanian lek (ALL). Orders are placed online and paid on delivery.`,
    '',
    '## Shop',
    '',
    `- [All dresses](${all('en')}): every dress with its price and the sizes in stock (also in [Albanian](${all('sq')}) and [French](${all('fr')}))`,
    ...CATEGORIES.filter((cat) => products.some((p) => p.categories.includes(cat))).map((cat) => `- [${t.categories[cat]}](${origin + href('/dyqani', 'en', { kategoria: cat })})`),
    `- [Terms and returns](${origin + href('/kushtet', 'en')})`,
    `- [Privacy](${origin + href('/privatesia', 'en')})`,
    '',
    '## Dresses',
    '',
    ...(products.length
      ? products.map((p) => {
          const sizes = SIZES.filter((s) => p.stock[s] > 0);
          const price = p.price !== null ? `${p.price.toLocaleString('en')} ALL` : 'price on request';
          const stock = sizes.length ? `sizes ${sizes.join(', ')}` : 'sold out';
          return `- [${p.name}](${origin + href(`/fustan/${p.slug}`, 'en')}): ${price}, ${stock}${p.description ? `. ${p.description.replace(/\s+/g, ' ').slice(0, 160)}` : ''}`;
        })
      : ['- New dresses are being added; see Instagram for the latest.']),
    '',
    '## Contact',
    '',
    `- Instagram: ${SITE.instagram} (messages: ${SITE.message})`,
    `- Boutique: ${SITE.address} (map: ${SITE.maps})`,
    ...(business.phone ? [`- Phone: ${business.phone}`] : []),
    ...(business.email ? [`- Email: ${business.email}`] : []),
    ...(returns.mode ? [`- Returns: see ${origin + href('/kushtet', 'en')}`] : []),
    '',
  ];
  return c.text(lines.join('\n'), 200, { ...HOUR, 'content-type': 'text/plain; charset=utf-8' });
});
