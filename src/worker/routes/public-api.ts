/** Public JSON: the catalogue for search and the bag, order submission, the local test gateway. */
import { Hono } from 'hono';
import { isLang } from '../../shared/copy';
import { hit, listVisible } from '../db';
import { clientIp } from '../auth';
import { createOrder, getOrder, parseOrderInput, setOrderStatus, setPaymentStatus } from '../orders';
import { gatewayFor } from '../payments';
import { BOT_UA, count, parseHit, rowsFor, tooMany } from '../stats';
import { bookedOn, createRequest, parseRequest } from '../requests';
import { askStylist, dailyLimit, StylistError, stylistReady } from '../stylist';
import { inStock, isSize, photoAt } from '../../shared/catalog';
import { tiranaDay } from '../../shared/time';
import { orderAlert, requestAlert } from '../telegram';
import type { AppEnv, ExtraEnv } from '../types';

export const publicApi = new Hono<AppEnv>();

/** Everything the bag and the search drawer need, in one small response. */
publicApi.get('/products', async (c) => {
  const lang = isLang(c.req.query('lang')) ? (c.req.query('lang') as 'sq' | 'en') : 'sq';
  const list = await listVisible(c.env.DB, lang);
  return c.json(
    list.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      price: p.price,
      color: p.color,
      categories: p.categories,
      occasions: p.occasions,
      stock: p.stock,
      cover: p.photos[0] ?? null,
      isNew: p.isNew,
    })),
    200,
    { 'cache-control': 'public, max-age=20' },
  );
});

publicApi.post('/orders', async (c) => {
  if (c.req.header('Origin') !== new URL(c.req.url).origin) return c.json({ error: 'bad_origin' }, 403);
  const body = (await c.req.json().catch(() => null)) as Record<string, unknown> | null;
  // The honeypot field is invisible to people; anything in it came from a bot.
  if (!body || (typeof body.website === 'string' && body.website.trim())) return c.json({ error: 'invalid' }, 400);
  const { input, errors } = parseOrderInput(body);
  if (!input) return c.json({ error: 'invalid', fields: errors }, 400);
  // Ten orders an hour from one address; the local dev build is exempt so test runs do not trip it.
  if (!(await hit(c.env.DB, `order:${clientIp(c)}`, import.meta.env.DEV ? 1000 : 10, 60 * 60))) return c.json({ error: 'too_many_orders' }, 429);
  const origin = new URL(c.req.url).origin;
  const res = await createOrder(c.env, input, origin);
  if (!res.ok) return c.json({ error: res.error, unavailable: res.unavailable ?? [] }, res.status);
  // Telegram, after the response: cash orders now, card orders once the bank says paid
  if (res.created && !res.payUrl) c.executionCtx.waitUntil(orderAlert(c.env, origin, res.id));
  return c.json({ id: res.id, number: res.number, payUrl: res.payUrl ?? null }, 201);
});

/**
 * The stylist (stylist.ts): her words, her language, and her saved size and date if she has them;
 * back come up to three dresses from what she can actually buy or rent, each with a reason.
 */
publicApi.post('/stylist', async (c) => {
  const env = c.env as Env & ExtraEnv;
  if (!stylistReady(env)) return c.json({ error: 'off' }, 404);
  if (c.req.header('Origin') !== new URL(c.req.url).origin) return c.json({ error: 'bad_origin' }, 403);
  const b = (await c.req.json().catch(() => null)) as Record<string, unknown> | null;
  const q = typeof b?.q === 'string' ? b.q.trim() : '';
  if (q.length < 5 || q.length > 400) return c.json({ error: 'short' }, 400);
  const lang = isLang(b?.lang) ? b.lang : 'sq';
  const size = isSize(b?.size) ? b.size : undefined;
  const today = tiranaDay();
  const date = typeof b?.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(b.date) && b.date >= today ? b.date : undefined;
  if (!(await hit(c.env.DB, `stylist:${clientIp(c)}`, import.meta.env.DEV ? 1000 : 10, 60 * 60))) return c.json({ error: 'too_many' }, 429);
  if (!(await hit(c.env.DB, `stylist-day:${today}`, dailyLimit(env), 26 * 60 * 60))) return c.json({ error: 'limit' }, 429);
  // the dresses on sale: priced and in stock in some size; the ones booked in her size on her date go separately
  const list = (await listVisible(c.env.DB, lang)).filter((p) => p.price !== null && inStock(p));
  const booked = date && size ? [...new Set((await bookedOn(c.env.DB, date)).filter((x) => x.size === size).map((x) => x.id))] : [];
  try {
    const answer = await askStylist(env, lang, q, list, { size, date, today, booked });
    const byId = new Map(list.map((p) => [p.id, p]));
    return c.json({
      message: answer.message,
      picks: answer.picks.map((x) => {
        const p = byId.get(x.id)!;
        return { slug: p.slug, name: p.name, price: p.price, cover: p.photos[0] ? photoAt(p.photos[0], 480) : null, reason: x.reason };
      }),
    });
  } catch (e) {
    const code = e instanceof StylistError ? e.code : 'failed';
    return c.json({ error: code }, code === 'busy' ? 503 : code === 'refused' ? 422 : 502);
  }
});

/** The dresses booked on a day (confirmed rentals), for "shop by date": ids and sizes only. */
publicApi.get('/booked', async (c) => {
  const day = c.req.query('date') ?? '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return c.json({ error: 'invalid' }, 400);
  return c.json({ date: day, booked: await bookedOn(c.env.DB, day) }, 200, { 'cache-control': 'public, max-age=60' });
});

/** A rental request or a "tell me when this size is back", from a dress page (requests.ts). */
publicApi.post('/requests', async (c) => {
  if (c.req.header('Origin') !== new URL(c.req.url).origin) return c.json({ error: 'bad_origin' }, 403);
  const body = (await c.req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || (typeof body.website === 'string' && body.website.trim())) return c.json({ error: 'invalid' }, 400);
  const { input, errors } = parseRequest(body);
  if (!input) return c.json({ error: 'invalid', fields: errors }, 400);
  if (!(await hit(c.env.DB, `request:${clientIp(c)}`, import.meta.env.DEV ? 1000 : 10, 60 * 60))) return c.json({ error: 'too_many' }, 429);
  const dress = await c.env.DB.prepare(`SELECT id FROM products WHERE id = ? AND status = 'published'`).bind(input.productId).first();
  if (!dress) return c.json({ error: 'invalid', fields: ['productId'] }, 400);
  const id = await createRequest(c.env.DB, input);
  c.executionCtx.waitUntil(requestAlert(c.env, new URL(c.req.url).origin, id));
  return c.json({ ok: true }, 201);
});

/** The shop's own visit counts (stats.ts): one beacon per page view, nothing kept about the visitor. */
publicApi.post('/hit', async (c) => {
  if (BOT_UA.test(c.req.header('user-agent') ?? '')) return c.body(null, 204);
  let raw: unknown = null;
  try {
    raw = JSON.parse((await c.req.text()).slice(0, 2000));
  } catch {
    /* not a beacon */
  }
  const h = parseHit(raw);
  if (h && !tooMany(clientIp(c))) c.executionCtx.waitUntil(count(c.env.DB, rowsFor(h)).catch((e) => console.error('stats', e)));
  return c.body(null, 204);
});

/** The simulated bank's answer (local development only). */
publicApi.post('/pay/test/:id', async (c) => {
  if (!gatewayFor(c.env) || c.req.header('Origin') !== new URL(c.req.url).origin) return c.json({ error: 'not_available' }, 404);
  const o = await getOrder(c.env.DB, c.req.param('id'));
  if (!o || o.order.status !== 'awaiting_payment') return c.json({ error: 'not_awaiting' }, 409);
  const { result } = (await c.req.json().catch(() => ({}))) as { result?: string };
  if (result === 'paid') {
    await setPaymentStatus(c.env.DB, o.order.id, 'paid');
    await setOrderStatus(c.env.DB, o.order.id, 'new');
    // a real gateway's paid callback does the same
    c.executionCtx.waitUntil(orderAlert(c.env, new URL(c.req.url).origin, o.order.id));
  } else {
    await setOrderStatus(c.env.DB, o.order.id, 'cancelled', 'failed');
  }
  return c.json({ ok: true });
});
