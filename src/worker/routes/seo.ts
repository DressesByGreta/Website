/**
 * For search engines: robots.txt, a product feed (/feed.xml, for Google Merchant Center's free
 * Shopping listings and the Instagram and Facebook shop), and a sitemap built from the live catalogue. Every page is listed
 * in the three languages with its alternates (hreflang, Albanian as x-default), and every dress with
 * its photographs, so the shop can also be found through image search. Drafts never appear: the
 * sitemap lists exactly what the shop shows. /llms.txt says the same in plain text for AI search
 * assistants (ChatGPT, Perplexity, Google's AI answers), which quote it when asked about the shop.
 */
import { Hono } from 'hono';
import { CATEGORIES, OCCASIONS, OCCASION_PATH, photoAt, SIZES } from '../../shared/catalog';
import { copy, href, isLang, LANGS, type Lang } from '../../shared/copy';
import { getLegalSettings, listVisible } from '../db';
import { listLookbooks } from '../lookbooks';
import { SITE } from '../site';
import type { AppEnv } from '../types';

export const seo = new Hono<AppEnv>();

const HOUR = { 'cache-control': 'public, max-age=3600' };
const xml = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

seo.get('/robots.txt', (c) => {
  const origin = new URL(c.req.url).origin;
  const body = ['User-agent: *', 'Allow: /', 'Disallow: /admin', 'Disallow: /api/', 'Disallow: /porosia', 'Disallow: /pagesa/', 'Disallow: /te-ruajtura', '', `Sitemap: ${origin}/sitemap.xml`, ''];
  return c.text(body.join('\n'), 200, HOUR);
});

seo.get('/sitemap.xml', async (c) => {
  const origin = new URL(c.req.url).origin;
  const db = c.env.DB;
  const [products, dates, legal, books] = await Promise.all([
    listVisible(db, 'sq'),
    db.prepare(`SELECT slug, updated_at FROM products WHERE status = 'published'`).all<{ slug: string; updated_at: string }>(),
    getLegalSettings(db),
    listLookbooks(db, 'sq'),
  ]);
  const updated = new Map((dates.results ?? []).map((r) => [r.slug, r.updated_at.slice(0, 10)]));
  const pages: { path: string; params?: Record<string, string>; lastmod?: string; images?: string[] }[] = [
    { path: '/' },
    { path: '/dyqani' },
    ...OCCASIONS.map((o) => ({ path: OCCASION_PATH[o] })),
    // only categories that hold a dress: an empty one would be a thin page
    ...CATEGORIES.filter((cat) => products.some((p) => p.categories.includes(cat))).map((cat) => ({ path: '/dyqani', params: { kategoria: cat } })),
    ...products.map((p) => ({ path: `/fustan/${p.slug}`, lastmod: updated.get(p.slug), images: p.photos.slice(0, 6).map((ph) => origin + photoAt(ph, 1600)) })),
    ...(books.length ? [{ path: '/lookbook' }] : []),
    ...books.map((b) => ({ path: `/lookbook/${b.slug}`, lastmod: b.updated, images: b.photos.slice(0, 20).map((ph) => origin + photoAt(ph, 1600)) })),
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
  const [products, { business, returns }, books] = await Promise.all([listVisible(c.env.DB, 'en'), getLegalSettings(c.env.DB), listLookbooks(c.env.DB, 'en')]);
  const all = (l: Lang) => origin + href('/dyqani', l);
  const lines = [
    `# ${SITE.name}`,
    '',
    `> ${t.meta.homeDescription}`,
    '',
    `${SITE.name} is a dress boutique in Tirana, Albania, at ${SITE.address}, with an online shop in Albanian, English and French. Prices are in Albanian lek (ALL). Orders are placed online and paid on delivery. Dresses can also be rented: message the shop on Instagram with the dress, size and date.`,
    '',
    '## Shop',
    '',
    `- [All dresses](${all('en')}): every dress with its price and the sizes in stock (also in [Albanian](${all('sq')}) and [French](${all('fr')}))`,
    ...CATEGORIES.filter((cat) => products.some((p) => p.categories.includes(cat))).map((cat) => `- [${t.categories[cat]}](${origin + href('/dyqani', 'en', { kategoria: cat })})`),
    ...OCCASIONS.map((o) => `- [${t.occasions[o].label}](${origin + href(OCCASION_PATH[o], 'en')}): ${t.occasions[o].description}`),
    ...books.map((b) => `- [Lookbook: ${b.title}](${origin + href(`/lookbook/${b.slug}`, 'en')})${b.intro ? `: ${b.intro.replace(/\s+/g, ' ').slice(0, 160)}` : ''}`),
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

/**
 * The product feed: one item per dress and size (grouped by the dress, as Google and Meta expect for
 * clothing), with the size's own availability, the price in lek and up to ten photographs. Albanian
 * by default, ?lang=en for an English catalogue. Drafts never appear.
 */
seo.get('/feed.xml', async (c) => {
  const origin = new URL(c.req.url).origin;
  const q = c.req.query('lang');
  const lang: Lang = isLang(q) ? q : 'sq';
  const t = copy[lang];
  const products = (await listVisible(c.env.DB, lang)).filter((p) => p.price !== null && p.photos.length);
  const tag = (name: string, v: string | number) => `<${name}>${xml(String(v))}</${name}>`;
  const items = products.flatMap((p) => {
    const desc = (p.description || `${p.name}, ${t.meta.homeDescription}`).replace(/\s+/g, ' ').slice(0, 4900);
    const cat = p.categories.find((x) => x !== 'tv');
    return SIZES.map((size) =>
      [
        '<item>',
        tag('g:id', `${p.slug}-${size}`),
        tag('g:item_group_id', p.slug),
        tag('title', `${p.name} (${size})`),
        tag('description', desc),
        tag('link', origin + href(`/fustan/${p.slug}`, lang, { masa: size })),
        tag('g:image_link', origin + photoAt(p.photos[0]!, 1600)),
        ...p.photos.slice(1, 11).map((ph) => tag('g:additional_image_link', origin + photoAt(ph, 1600))),
        tag('g:availability', p.stock[size] > 0 ? 'in_stock' : 'out_of_stock'),
        // a dress with a "was" price shows as a sale: the old price, and the price now
        ...(p.comparePrice && p.comparePrice > p.price! ? [tag('g:price', `${p.comparePrice} ALL`), tag('g:sale_price', `${p.price} ALL`)] : [tag('g:price', `${p.price} ALL`)]),
        tag('g:condition', 'new'),
        tag('g:brand', SITE.name),
        tag('g:google_product_category', '2271'),
        ...(cat ? [tag('g:product_type', t.categories[cat])] : []),
        tag('g:gender', 'female'),
        tag('g:age_group', 'adult'),
        tag('g:size', size),
        tag('g:size_system', 'EU'),
        ...(p.color ? [tag('g:color', p.color)] : []),
        tag('g:identifier_exists', 'no'),
        '</item>',
      ].join(''),
    );
  });
  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0"><channel>',
    tag('title', SITE.name),
    tag('link', origin + href('/', lang)),
    tag('description', t.meta.homeDescription),
    ...items,
    '</channel></rss>',
    '',
  ].join('\n');
  return c.body(body, 200, { ...HOUR, 'content-type': 'application/xml; charset=utf-8' });
});
