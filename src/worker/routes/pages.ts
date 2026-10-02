/** Server-rendered storefront routes. */
import { Hono, type Context } from 'hono';
import { isCategory, isSize, photoAt, type Size } from '../../shared/catalog';
import { copy, isLang } from '../../shared/copy';
import { html } from '../../shared/html';
import { getSetting, getVisibleBySlug, getZones, listVisible } from '../db';
import { getOrder } from '../orders';
import { gatewayFor } from '../payments';
import { SITE } from '../site';
import type { AppEnv } from '../types';
import { brandSprite } from '../views/brand';
import { checkoutView, confirmationView, notFoundView, payTestView } from '../views/checkout';
import { HERO_SIZES, heroSrcset, homeView, storeJsonLd } from '../views/home';
import { assetTags, page, setDemo } from '../views/layout';
import { productJsonLd, productView } from '../views/product';
import { shopView, type ShopState } from '../views/shop';

export const pages = new Hono<AppEnv>();

let demoChecked = 0;
pages.use('*', async (c, next) => {
  const q = c.req.query('lang');
  c.set('lang', isLang(q) ? q : 'sq');
  if (Date.now() - demoChecked > 60_000) {
    demoChecked = Date.now();
    setDemo((await getSetting(c.env.DB, 'demo_data')) === '1');
  }
  await next();
});

const origin = (c: Context<AppEnv>) => new URL(c.req.url).origin;
const send = (c: Context<AppEnv>, body: string, status: 200 | 404 = 200) =>
  c.html(body, status, { 'cache-control': 'no-cache', vary: 'Accept-Encoding' });

pages.get('/', async (c) => {
  const lang = c.get('lang');
  const t = copy[lang];
  const visible = await listVisible(c.env.DB, lang);
  return send(
    c,
    page({
      lang,
      origin: origin(c),
      path: '/',
      title: t.meta.homeTitle,
      description: t.meta.homeDescription,
      kind: 'home',
      overPhoto: true,
      preload: { srcset: heroSrcset('webp'), sizes: HERO_SIZES, type: 'image/webp' },
      body: homeView(lang, visible),
      jsonLd: [storeJsonLd(origin(c))],
    }),
  );
});

pages.get('/dyqani', async (c) => {
  const lang = c.get('lang');
  const t = copy[lang];
  const masa = c.req.query('masa');
  const kat = c.req.query('kategoria');
  const state: ShopState = {
    size: isSize(masa) ? masa : undefined,
    category: isCategory(kat) ? kat : undefined,
    view: c.req.query('pamja') === 'indeks' ? 'contents' : 'spreads',
  };
  const all = await listVisible(c.env.DB, lang);
  const first = all.find((p) => !state.size || p.stock[state.size] > 0)?.photos[0];
  return send(
    c,
    page({
      lang,
      origin: origin(c),
      path: '/dyqani',
      params: { masa: state.size, kategoria: state.category, pamja: state.view === 'contents' ? 'indeks' : undefined },
      title: state.size ? t.meta.sizeTitle(state.size) : t.meta.shopTitle,
      description: t.meta.shopDescription,
      kind: 'shop',
      image: first ? photoAt(first, 1600) : undefined,
      body: shopView(lang, all, state),
    }),
  );
});

pages.get('/fustan/:slug', async (c) => {
  const lang = c.get('lang');
  const p = await getVisibleBySlug(c.env.DB, c.req.param('slug'), lang);
  if (!p) return notFound(c);
  const all = await listVisible(c.env.DB, lang);
  const index = Math.max(0, all.findIndex((x) => x.id === p.id));
  const next = all.length > 1 ? (all[(index + 1) % all.length] ?? null) : null;
  const masa = c.req.query('masa');
  return send(
    c,
    page({
      lang,
      origin: origin(c),
      path: `/fustan/${p.slug}`,
      title: `${p.name}, ${SITE.name}`,
      description: p.description.slice(0, 155) || copy[lang].meta.shopDescription,
      kind: 'product',
      image: p.photos[0] ? photoAt(p.photos[0], 1600) : undefined,
      body: productView(lang, p, index, all.length, next, isSize(masa) ? (masa as Size) : undefined),
      jsonLd: [productJsonLd(origin(c), lang, p)],
    }),
  );
});

pages.get('/porosia', async (c) => {
  const lang = c.get('lang');
  return send(
    c,
    page({
      lang,
      origin: origin(c),
      path: '/porosia',
      title: copy[lang].meta.checkoutTitle,
      description: copy[lang].meta.shopDescription,
      kind: 'checkout',
      noindex: true,
      body: checkoutView(lang, await getZones(c.env.DB), Boolean(gatewayFor(c.env))),
    }),
  );
});

pages.get('/porosia/:id', async (c) => {
  const found = await getOrder(c.env.DB, c.req.param('id'));
  if (!found) return notFound(c);
  const lang = isLang(c.req.query('lang')) ? c.get('lang') : found.order.lang;
  const gateway = gatewayFor(c.env);
  const payUrl = found.order.status === 'awaiting_payment' && gateway ? (await gateway.createPayment(found.order, origin(c))).url : undefined;
  return send(
    c,
    page({
      lang,
      origin: origin(c),
      path: `/porosia/${found.order.id}`,
      title: `${copy[lang].confirmation.title(found.order.number)}, ${SITE.name}`,
      description: copy[lang].confirmation.thanks,
      kind: 'confirmation',
      noindex: true,
      body: confirmationView(lang, found.order, found.items, payUrl),
      data: { status: found.order.status, payment: found.order.payment_status },
    }),
  );
});

pages.get('/pagesa/test/:id', async (c) => {
  if (!gatewayFor(c.env)) return notFound(c);
  const found = await getOrder(c.env.DB, c.req.param('id'));
  if (!found) return notFound(c);
  const lang = found.order.lang;
  return send(
    c,
    page({
      lang,
      origin: origin(c),
      path: `/pagesa/test/${found.order.id}`,
      title: copy[lang].pay.title,
      description: copy[lang].pay.body,
      kind: 'pay',
      noindex: true,
      body: payTestView(lang, found.order),
    }),
  );
});

/** The admin is a client app; the Worker only hands it a shell. */
pages.get('/admin', (c) => adminShell(c));
pages.get('/admin/*', (c) => adminShell(c));

function adminShell(c: Context<AppEnv>) {
  return c.html(
    '<!doctype html>' +
      html`<html lang="sq">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="robots" content="noindex, nofollow" />
    <title>Admin, ${SITE.name}</title>
    <link rel="icon" href="/brand/favicon-32.png" sizes="32x32" />
    <link rel="icon" href="/brand/favicon.svg" type="image/svg+xml" />
    ${assetTags('admin')}
  </head>
  <body>
    ${brandSprite()}
    <div id="admin" class="adm-root"></div>
  </body>
</html>`.value,
    200,
    { 'cache-control': 'no-store' },
  );
}

export function notFound(c: Context<AppEnv>) {
  const lang = c.get('lang') ?? 'sq';
  return send(
    c,
    page({
      lang,
      origin: origin(c),
      path: new URL(c.req.url).pathname,
      title: copy[lang].meta.notFoundTitle,
      description: copy[lang].notFound.body,
      kind: 'notfound',
      noindex: true,
      body: notFoundView(lang),
    }),
    404,
  );
}
