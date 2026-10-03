/** /api/admin/*: Greta's back office. Every route below the sign-in block requires a session. */
import { Hono, type Context } from 'hono';
import { CATEGORIES, NEW_DAYS, OCCASIONS, SIZES, isTag, parseMeasures, slugify, type Size, type Stock } from '../../shared/catalog';
import type { Business, Returns } from '../../shared/legal';
import { isDay } from '../../shared/time';
import { clearHits, adminGet, adminList, countNew, getLegalSettings, getSetting, getZones, hit, setSetting, uniqueSlug } from '../db';
import { clientIp, devLoginAllowed, endSession, isAdmin, renewSession, requireAdmin, startSession, verifyPassword } from '../auth';
import { deleteVariants, parseUploadMeta, storeClip, storeVariants } from '../images';
import { instagramState, linkInstagram, setFollowersByHand, syncInstagram, unlinkInstagram, type InstagramState } from '../instagram';
import { allowedNext, getOrder, setOrderStatus, setPaymentStatus, type OrderStatus, type PaymentStatus } from '../orders';
import { gatewayFor } from '../payments';
import { salesReport } from '../sales';
import { report } from '../stats';
import { adminLookbook, adminLookbooks, frameKeys, frameRow, lookbookSlugFree, MAX_FRAMES, parseSpots } from '../lookbooks';
import { countNewRequests, listRequests, REQUEST_STATUSES, setRequestStatus, waitingFor, type RequestStatus } from '../requests';
import { botName, checkLink, linkedChats, removeChat, restockAlert, sendTest, startLink, telegramReady } from '../telegram';
import type { AppEnv } from '../types';
import { setFollowers, setNewCount } from '../views/layout';

export const adminApi = new Hono<AppEnv>();

/* --------------------------------------------------------------- sign in --------------------------------------------------------------- */

adminApi.get('/me', async (c) => {
  const admin = await isAdmin(c);
  if (admin) await renewSession(c);
  return c.json({ admin, devLogin: devLoginAllowed(c), passwordSet: Boolean(c.env.ADMIN_PASSWORD_HASH) }, 200, { 'cache-control': 'no-store' });
});

adminApi.post('/login', async (c) => {
  if (c.req.header('Origin') !== new URL(c.req.url).origin) return c.json({ error: 'bad_origin' }, 403);
  if (!c.env.ADMIN_PASSWORD_HASH) return c.json({ error: 'no_password_set' }, 503);
  const key = `login:${clientIp(c)}`;
  if (!(await hit(c.env.DB, key, 10, 15 * 60))) return c.json({ error: 'too_many_attempts' }, 429);
  const body = (await c.req.json().catch(() => ({}))) as { password?: unknown };
  const password = typeof body.password === 'string' ? body.password.slice(0, 200) : '';
  if (!password || !(await verifyPassword(c.env.ADMIN_PASSWORD_HASH, password))) return c.json({ error: 'wrong_password' }, 401);
  await clearHits(c.env.DB, key);
  await startSession(c);
  return c.json({ ok: true });
});

adminApi.post('/dev-login', async (c) => {
  if (!devLoginAllowed(c)) return c.json({ error: 'not_available' }, 404);
  if (c.req.header('Origin') !== new URL(c.req.url).origin) return c.json({ error: 'bad_origin' }, 403);
  await startSession(c);
  return c.json({ ok: true });
});

adminApi.post('/logout', (c) => {
  endSession(c);
  return c.json({ ok: true });
});

/* ---------------------------------------------------------- everything else ------------------------------------------------------------ */

const open = new Set(['/api/admin/me', '/api/admin/login', '/api/admin/dev-login', '/api/admin/logout']);
adminApi.use('*', async (c, next) => (open.has(c.req.path) ? next() : requireAdmin(c, next)));
adminApi.use('*', async (c, next) => {
  await next();
  c.header('cache-control', 'no-store');
});

adminApi.get('/summary', async (c) => {
  const db = c.env.DB;
  const [p, o, low] = await db.batch([
    db.prepare(`SELECT status, COUNT(*) AS n FROM products GROUP BY status`),
    db.prepare(`SELECT status, COUNT(*) AS n FROM orders GROUP BY status`),
    db.prepare(`SELECT COUNT(*) AS n FROM products p WHERE p.status = 'published' AND NOT EXISTS (SELECT 1 FROM product_sizes s WHERE s.product_id = p.id AND s.stock > 0)`),
  ]);
  const count = (rows: unknown[] | undefined, key: string) => ((rows ?? []) as { status: string; n: number }[]).find((r) => r.status === key)?.n ?? 0;
  return c.json({
    published: count(p?.results, 'published'),
    drafts: count(p?.results, 'draft'),
    newOrders: count(o?.results, 'new'),
    awaitingPayment: count(o?.results, 'awaiting_payment'),
    confirmed: count(o?.results, 'confirmed'),
    soldOut: ((low?.results ?? [])[0] as { n?: number } | undefined)?.n ?? 0,
    newRequests: await countNewRequests(db),
    demo: (await getSetting(db, 'demo_data')) === '1',
  });
});

/* -------------------------------------------------------------- products --------------------------------------------------------------- */

adminApi.get('/products', async (c) => c.json(await adminList(c.env.DB)));

adminApi.post('/products', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { nameSq?: unknown };
  const nameSq = typeof body.nameSq === 'string' ? body.nameSq.trim().slice(0, 80) : '';
  if (!nameSq) return c.json({ error: 'name_required' }, 400);
  const id = crypto.randomUUID();
  const slug = await uniqueSlug(c.env.DB, slugify(nameSq));
  const db = c.env.DB;
  await db.batch([
    db.prepare(`INSERT INTO products (id, slug, name_sq, sort) VALUES (?, ?, ?, (SELECT COALESCE(MIN(sort), 0) - 1 FROM products))`).bind(id, slug, nameSq),
    ...SIZES.map((s) => db.prepare('INSERT INTO product_sizes (product_id, size, stock) VALUES (?, ?, 0)').bind(id, s)),
  ]);
  return c.json(await adminGet(db, id), 201);
});

adminApi.get('/products/:id', async (c) => {
  const p = await adminGet(c.env.DB, c.req.param('id'));
  return p ? c.json(p) : c.json({ error: 'not_found' }, 404);
});

const text = (v: unknown, max: number): string | null => (typeof v === 'string' ? v.trim().slice(0, max) : null);
const lek = (v: unknown): number | null | undefined => {
  if (v === null || v === '') return null;
  const n = Number(v);
  return Number.isInteger(n) && n > 0 && n <= 10_000_000 ? n : undefined;
};

adminApi.put('/products/:id', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  const cur = await adminGet(db, id);
  if (!cur) return c.json({ error: 'not_found' }, 404);
  const b = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const errors: string[] = [];

  const nameSq = text(b.nameSq, 80) ?? cur.nameSq;
  if (!nameSq) errors.push('nameSq');
  const nameEn = text(b.nameEn, 80) ?? cur.nameEn;
  const descriptionSq = text(b.descriptionSq, 2000) ?? cur.descriptionSq;
  const descriptionEn = text(b.descriptionEn, 2000) ?? cur.descriptionEn;
  const color = text(b.color, 30) ?? cur.color;
  const price = 'price' in b ? lek(b.price) : cur.price;
  if (price === undefined) errors.push('price');
  const comparePrice = 'comparePrice' in b ? lek(b.comparePrice) : cur.comparePrice;
  if (comparePrice === undefined) errors.push('comparePrice');
  const categories = Array.isArray(b.categories) ? [...new Set(b.categories.filter(isTag))] : cur.categories;
  const featured = typeof b.featured === 'boolean' ? b.featured : cur.featured;
  const measures = 'measures' in b ? parseMeasures(b.measures) : cur.measures;
  const fitSq = text(b.fitSq, 200) ?? cur.fitSq;
  const fitEn = text(b.fitEn, 200) ?? cur.fitEn;
  const instagramUrl = text(b.instagramUrl, 200) ?? cur.instagramUrl;
  if (instagramUrl && !/^https:\/\/(www\.)?instagram\.com\/[A-Za-z0-9_./?=&-]+$/.test(instagramUrl)) errors.push('instagramUrl');
  const status = b.status === 'published' || b.status === 'draft' ? b.status : cur.status;

  const stock: Stock = { ...cur.stock };
  if (b.stock && typeof b.stock === 'object') {
    for (const s of SIZES) {
      const v = (b.stock as Record<string, unknown>)[s];
      if (v === undefined) continue;
      const n = Number(v);
      if (Number.isInteger(n) && n >= 0 && n <= 99) stock[s] = n;
      else errors.push(`stock.${s}`);
    }
  }

  let slug = cur.slug;
  const wanted = text(b.slug, 60);
  if (wanted !== null && wanted !== cur.slug) {
    const clean = slugify(wanted);
    if (!clean) errors.push('slug');
    else slug = await uniqueSlug(db, clean, id);
  }
  if (errors.length) return c.json({ error: 'invalid', fields: errors }, 400);

  // A dress can only go live with a price and at least one photograph.
  if (status === 'published') {
    const reasons: string[] = [];
    if (price === null || price === undefined) reasons.push('price');
    if (!cur.photos.length) reasons.push('photo');
    if (reasons.length) return c.json({ error: 'cannot_publish', reasons }, 400);
  }

  // New for two weeks from the first publication; { markNew } restarts the two weeks or ends them now.
  const twoWeeks = () => new Date(Date.now() + NEW_DAYS * 86_400_000).toISOString();
  let newUntil = cur.newUntil;
  if (typeof b.markNew === 'boolean') newUntil = b.markNew ? twoWeeks() : new Date().toISOString();
  else if (status === 'published' && newUntil === null) newUntil = twoWeeks();

  await db.batch([
    db
      .prepare(
        `UPDATE products SET slug = ?, name_sq = ?, name_en = ?, description_sq = ?, description_en = ?, price = ?, compare_price = ?, color = ?,
         categories = ?, status = ?, featured = ?, instagram_url = ?, new_until = ?, measures = ?, fit_sq = ?, fit_en = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?`,
      )
      .bind(slug, nameSq, nameEn, descriptionSq, descriptionEn, price ?? null, comparePrice ?? null, color, JSON.stringify(categories), status, featured ? 1 : 0, instagramUrl, newUntil, JSON.stringify(measures), fitSq, fitEn, id),
    ...SIZES.map((s) =>
      db
        .prepare('INSERT INTO product_sizes (product_id, size, stock) VALUES (?, ?, ?) ON CONFLICT (product_id, size) DO UPDATE SET stock = excluded.stock')
        .bind(id, s, stock[s]),
    ),
  ]);
  // the header's "new" link on this instance follows at once (the others within a minute)
  setNewCount(await countNew(db));
  // sizes back in stock that people asked about: tell Greta, so she can message them
  const back = SIZES.filter((s) => cur.stock[s] === 0 && stock[s] > 0);
  if (back.length) {
    const waiting = await waitingFor(db, id, back as Size[]);
    if (Object.keys(waiting).length) c.executionCtx.waitUntil(restockAlert(c.env, new URL(c.req.url).origin, nameSq, waiting));
  }
  return c.json(await adminGet(db, id));
});

adminApi.delete('/products/:id', async (c) => {
  const db = c.env.DB;
  const p = await adminGet(db, c.req.param('id'));
  if (!p) return c.json({ error: 'not_found' }, 404);
  await Promise.all(p.photos.map((ph) => deleteVariants(c.env, ph.key, ph.ext, ph.widths)));
  await dropVideo(c.env, p.id, p.video);
  await db.prepare('DELETE FROM products WHERE id = ?').bind(p.id).run();
  return c.json({ ok: true });
});

adminApi.post('/products/reorder', async (c) => {
  const b = (await c.req.json().catch(() => ({}))) as { ids?: unknown };
  const ids = Array.isArray(b.ids) ? b.ids.filter((x): x is string => typeof x === 'string').slice(0, 1000) : [];
  if (!ids.length) return c.json({ error: 'invalid' }, 400);
  const db = c.env.DB;
  await db.batch(ids.map((id, i) => db.prepare('UPDATE products SET sort = ? WHERE id = ?').bind(i, id)));
  return c.json({ ok: true });
});

/* --------------------------------------------------------------- video ----------------------------------------------------------------- */

/** Removes a dress's video files (the clip and its poster's widths). */
async function dropVideo(env: Env, productId: string, v: { id: string; ext: string; poster: { ext: string; widths: number[] } } | null): Promise<void> {
  if (!v) return;
  const key = `v/${productId}/${v.id}`;
  await Promise.all([env.PHOTOS.delete(`${key}/clip.${v.ext}`), deleteVariants(env, key, v.poster.ext, v.poster.widths)]);
}

/** One short video per dress: the clip, and its poster prepared in the browser like a photograph. */
adminApi.post('/products/:id/video', async (c) => {
  const db = c.env.DB;
  const cur = await adminGet(db, c.req.param('id'));
  if (!cur) return c.json({ error: 'not_found' }, 404);
  const form = await c.req.formData();
  const ext = form.get('ext') === 'webm' ? 'webm' : 'mp4';
  let metaRaw: unknown = null;
  try {
    metaRaw = JSON.parse(String(form.get('meta') ?? ''));
  } catch {
    /* handled below */
  }
  const poster = parseUploadMeta(metaRaw);
  const w = Number(form.get('w'));
  const h = Number(form.get('h'));
  if (!poster || !Number.isInteger(w) || !Number.isInteger(h) || w < 100 || h < 100 || w > 8000 || h > 8000) return c.json({ error: 'invalid_meta' }, 400);
  const id = crypto.randomUUID();
  const key = `v/${cur.id}/${id}`;
  const clipProblem = await storeClip(c.env, key, ext, form.get('video'));
  if (clipProblem) return c.json({ error: 'invalid_file', detail: clipProblem }, 400);
  const posterProblem = await storeVariants(c.env, key, poster, form);
  if (posterProblem) {
    await c.env.PHOTOS.delete(`${key}/clip.${ext}`);
    return c.json({ error: 'invalid_file', detail: posterProblem }, 400);
  }
  const video = { id, ext, w, h, bytes: (form.get('video') as File).size, poster: { key, ext: poster.ext, widths: poster.widths, w: poster.w, h: poster.h, lqip: poster.lqip } };
  await db.prepare(`UPDATE products SET video = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?`).bind(JSON.stringify(video), cur.id).run();
  await dropVideo(c.env, cur.id, cur.video);
  return c.json(await adminGet(db, cur.id));
});

adminApi.delete('/products/:id/video', async (c) => {
  const db = c.env.DB;
  const cur = await adminGet(db, c.req.param('id'));
  if (!cur) return c.json({ error: 'not_found' }, 404);
  await db.prepare(`UPDATE products SET video = '', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?`).bind(cur.id).run();
  await dropVideo(c.env, cur.id, cur.video);
  return c.json(await adminGet(db, cur.id));
});

/* --------------------------------------------------------------- photos ---------------------------------------------------------------- */

adminApi.post('/products/:id/photos', async (c) => {
  const db = c.env.DB;
  const productId = c.req.param('id');
  const exists = await db.prepare('SELECT id FROM products WHERE id = ?').bind(productId).first();
  if (!exists) return c.json({ error: 'not_found' }, 404);
  const count = await db.prepare('SELECT COUNT(*) AS n FROM product_images WHERE product_id = ?').bind(productId).first<{ n: number }>();
  if ((count?.n ?? 0) >= 12) return c.json({ error: 'too_many_photos' }, 400);

  const form = await c.req.formData();
  let metaRaw: unknown = null;
  try {
    metaRaw = JSON.parse(String(form.get('meta') ?? ''));
  } catch {
    /* handled below */
  }
  const meta = parseUploadMeta(metaRaw);
  if (!meta) return c.json({ error: 'invalid_meta' }, 400);
  const imageId = crypto.randomUUID();
  const key = `p/${productId}/${imageId}`;
  const problem = await storeVariants(c.env, key, meta, form);
  if (problem) return c.json({ error: 'invalid_file', detail: problem }, 400);
  const altSq = text(form.get('altSq'), 160) ?? '';
  const altEn = text(form.get('altEn'), 160) ?? '';
  await db
    .prepare(
      `INSERT INTO product_images (id, product_id, key, ext, widths, w, h, lqip, alt_sq, alt_en, sort)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, (SELECT COALESCE(MAX(sort), -1) + 1 FROM product_images WHERE product_id = ?))`,
    )
    .bind(imageId, productId, key, meta.ext, JSON.stringify(meta.widths), meta.w, meta.h, meta.lqip, altSq, altEn, productId)
    .run();
  await db.prepare(`UPDATE products SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?`).bind(productId).run();
  return c.json(await adminGet(db, productId), 201);
});

adminApi.put('/products/:id/photos/order', async (c) => {
  const db = c.env.DB;
  const productId = c.req.param('id');
  const b = (await c.req.json().catch(() => ({}))) as { ids?: unknown };
  const ids = Array.isArray(b.ids) ? b.ids.filter((x): x is string => typeof x === 'string').slice(0, 50) : [];
  if (!ids.length) return c.json({ error: 'invalid' }, 400);
  await db.batch(ids.map((id, i) => db.prepare('UPDATE product_images SET sort = ? WHERE id = ? AND product_id = ?').bind(i, id, productId)));
  return c.json(await adminGet(db, productId));
});

adminApi.patch('/photos/:photoId', async (c) => {
  const db = c.env.DB;
  const b = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const row = await db.prepare('SELECT product_id FROM product_images WHERE id = ?').bind(c.req.param('photoId')).first<{ product_id: string }>();
  if (!row) return c.json({ error: 'not_found' }, 404);
  await db
    .prepare('UPDATE product_images SET alt_sq = COALESCE(?, alt_sq), alt_en = COALESCE(?, alt_en) WHERE id = ?')
    .bind(text(b.altSq, 160), text(b.altEn, 160), c.req.param('photoId'))
    .run();
  return c.json(await adminGet(db, row.product_id));
});

adminApi.delete('/photos/:photoId', async (c) => {
  const db = c.env.DB;
  const row = await db
    .prepare('SELECT product_id, key, ext, widths FROM product_images WHERE id = ?')
    .bind(c.req.param('photoId'))
    .first<{ product_id: string; key: string; ext: string; widths: string }>();
  if (!row) return c.json({ error: 'not_found' }, 404);
  const left = await db.prepare('SELECT COUNT(*) AS n FROM product_images WHERE product_id = ?').bind(row.product_id).first<{ n: number }>();
  const live = await db.prepare(`SELECT status FROM products WHERE id = ?`).bind(row.product_id).first<{ status: string }>();
  // A published dress keeps at least one photograph; unpublish it first to remove the last one.
  if ((left?.n ?? 0) <= 1 && live?.status === 'published') return c.json({ error: 'last_photo_of_published' }, 400);
  await deleteVariants(c.env, row.key, row.ext, JSON.parse(row.widths) as number[]);
  await db.prepare('DELETE FROM product_images WHERE id = ?').bind(c.req.param('photoId')).run();
  return c.json(await adminGet(db, row.product_id));
});

/* --------------------------------------------------------------- orders ---------------------------------------------------------------- */

adminApi.get('/orders', async (c) => {
  const status = c.req.query('status');
  const db = c.env.DB;
  const where = status && ['awaiting_payment', 'new', 'confirmed', 'shipped', 'delivered', 'cancelled'].includes(status) ? 'WHERE o.status = ?' : '';
  const stmt = db.prepare(
    `SELECT o.id, o.number, o.status, o.payment_method, o.payment_status, o.customer_name, o.phone, o.city, o.total, o.delivery_fee, o.created_at,
            (SELECT COALESCE(SUM(qty), 0) FROM order_items i WHERE i.order_id = o.id) AS pieces
     FROM orders o ${where} ORDER BY o.created_at DESC LIMIT 300`,
  );
  const rows = await (where ? stmt.bind(status) : stmt).all();
  return c.json(rows.results ?? []);
});

adminApi.get('/orders/:id', async (c) => {
  const o = await getOrder(c.env.DB, c.req.param('id'));
  if (!o) return c.json({ error: 'not_found' }, 404);
  return c.json({ ...o, next: allowedNext(o.order.status) });
});

adminApi.patch('/orders/:id', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  const b = (await c.req.json().catch(() => ({}))) as { status?: unknown; paymentStatus?: unknown };
  if (typeof b.status === 'string') {
    const res = await setOrderStatus(db, id, b.status as OrderStatus);
    if (res !== 'ok') return c.json({ error: res }, res === 'not_found' ? 404 : 400);
  }
  if (typeof b.paymentStatus === 'string') {
    if (!['unpaid', 'paid', 'refunded'].includes(b.paymentStatus)) return c.json({ error: 'invalid' }, 400);
    await setPaymentStatus(db, id, b.paymentStatus as PaymentStatus);
  }
  const o = await getOrder(db, id);
  return o ? c.json({ ...o, next: allowedNext(o.order.status) }) : c.json({ error: 'not_found' }, 404);
});

/* -------------------------------------------------------------- lookbooks -------------------------------------------------------------- */

adminApi.get('/lookbooks', async (c) => c.json(await adminLookbooks(c.env.DB)));

adminApi.post('/lookbooks', async (c) => {
  const db = c.env.DB;
  const b = (await c.req.json().catch(() => ({}))) as { titleSq?: unknown };
  const titleSq = text(b.titleSq, 80);
  if (!titleSq) return c.json({ error: 'invalid', fields: ['titleSq'] }, 400);
  let slug = slugify(titleSq) || 'lookbook';
  for (let i = 2; !(await lookbookSlugFree(db, slug)); i++) slug = `${slugify(titleSq) || 'lookbook'}-${i}`;
  const id = crypto.randomUUID();
  const top = await db.prepare('SELECT MIN(sort) AS s FROM lookbooks').first<{ s: number | null }>();
  await db.prepare('INSERT INTO lookbooks (id, slug, title_sq, sort) VALUES (?, ?, ?, ?)').bind(id, slug, titleSq, (top?.s ?? 0) - 1).run();
  return c.json(await adminLookbook(db, id), 201);
});

adminApi.get('/lookbooks/:id', async (c) => {
  const l = await adminLookbook(c.env.DB, c.req.param('id'));
  return l ? c.json(l) : c.json({ error: 'not_found' }, 404);
});

adminApi.put('/lookbooks/:id', async (c) => {
  const db = c.env.DB;
  const cur = await adminLookbook(db, c.req.param('id'));
  if (!cur) return c.json({ error: 'not_found' }, 404);
  const b = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const errors: string[] = [];
  const titleSq = text(b.titleSq, 80) ?? cur.titleSq;
  if (!titleSq) errors.push('titleSq');
  const titleEn = text(b.titleEn, 80) ?? cur.titleEn;
  const introSq = text(b.introSq, 600) ?? cur.introSq;
  const introEn = text(b.introEn, 600) ?? cur.introEn;
  let slug = cur.slug;
  if (typeof b.slug === 'string' && b.slug.trim() !== cur.slug) {
    slug = slugify(b.slug);
    if (!slug || !(await lookbookSlugFree(db, slug, cur.id))) errors.push('slug');
  }
  const status = b.status === 'published' || b.status === 'draft' ? b.status : cur.status;
  if (errors.length) return c.json({ error: 'invalid', fields: errors }, 400);
  if (status === 'published' && !cur.frames.length) return c.json({ error: 'cannot_publish', reasons: ['photo'] }, 400);
  await db
    .prepare(`UPDATE lookbooks SET slug = ?, title_sq = ?, title_en = ?, intro_sq = ?, intro_en = ?, status = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?`)
    .bind(slug, titleSq, titleEn, introSq, introEn, status, cur.id)
    .run();
  return c.json(await adminLookbook(db, cur.id));
});

adminApi.delete('/lookbooks/:id', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  const frames = await frameKeys(db, id);
  await Promise.all(frames.map((f) => deleteVariants(c.env, f.key, f.ext, JSON.parse(f.widths) as number[])));
  await db.prepare('DELETE FROM lookbooks WHERE id = ?').bind(id).run();
  return c.json({ ok: true });
});

adminApi.post('/lookbooks/:id/frames', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  const cur = await adminLookbook(db, id);
  if (!cur) return c.json({ error: 'not_found' }, 404);
  if (cur.frames.length >= MAX_FRAMES) return c.json({ error: 'too_many_photos' }, 400);
  const form = await c.req.formData();
  let metaRaw: unknown = null;
  try {
    metaRaw = JSON.parse(String(form.get('meta') ?? ''));
  } catch {
    /* handled below */
  }
  const meta = parseUploadMeta(metaRaw);
  if (!meta) return c.json({ error: 'invalid_meta' }, 400);
  const frameId = crypto.randomUUID();
  const key = `l/${id}/${frameId}`;
  const problem = await storeVariants(c.env, key, meta, form);
  if (problem) return c.json({ error: 'invalid_file', detail: problem }, 400);
  await db
    .prepare('INSERT INTO lookbook_frames (id, lookbook_id, sort, key, ext, widths, w, h, lqip) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(frameId, id, cur.frames.length, key, meta.ext, JSON.stringify(meta.widths), meta.w, meta.h, meta.lqip)
    .run();
  await db.prepare(`UPDATE lookbooks SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?`).bind(id).run();
  return c.json(await adminLookbook(db, id), 201);
});

adminApi.patch('/lookbooks/:id/frames/:frameId', async (c) => {
  const db = c.env.DB;
  const f = await frameRow(db, c.req.param('frameId'));
  if (!f || f.lookbook_id !== c.req.param('id')) return c.json({ error: 'not_found' }, 404);
  const b = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const captionSq = text(b.captionSq, 200) ?? f.caption_sq;
  const captionEn = text(b.captionEn, 200) ?? f.caption_en;
  const spots = 'spots' in b ? parseSpots(b.spots) : parseSpots(f.spots);
  await db.batch([
    db.prepare('UPDATE lookbook_frames SET caption_sq = ?, caption_en = ?, spots = ? WHERE id = ?').bind(captionSq, captionEn, JSON.stringify(spots), f.id),
    db.prepare(`UPDATE lookbooks SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?`).bind(f.lookbook_id),
  ]);
  return c.json(await adminLookbook(db, f.lookbook_id));
});

adminApi.put('/lookbooks/:id/frames/order', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  const b = (await c.req.json().catch(() => ({}))) as { ids?: unknown };
  const ids = Array.isArray(b.ids) ? b.ids.filter((x): x is string => typeof x === 'string').slice(0, MAX_FRAMES) : [];
  if (!ids.length) return c.json({ error: 'invalid' }, 400);
  await db.batch(ids.map((fid, i) => db.prepare('UPDATE lookbook_frames SET sort = ? WHERE id = ? AND lookbook_id = ?').bind(i, fid, id)));
  return c.json(await adminLookbook(db, id));
});

adminApi.delete('/lookbooks/:id/frames/:frameId', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  const f = await frameRow(db, c.req.param('frameId'));
  if (!f || f.lookbook_id !== id) return c.json({ error: 'not_found' }, 404);
  const cur = await adminLookbook(db, id);
  // a published lookbook keeps at least one photograph
  if (cur?.status === 'published' && cur.frames.length <= 1) return c.json({ error: 'last_photo_of_published' }, 400);
  await deleteVariants(c.env, f.key, f.ext, JSON.parse(f.widths) as number[]);
  await db.prepare('DELETE FROM lookbook_frames WHERE id = ?').bind(f.id).run();
  return c.json(await adminLookbook(db, id));
});

/* -------------------------------------------------------------- requests --------------------------------------------------------------- */

adminApi.get('/requests', async (c) => c.json(await listRequests(c.env.DB, c.req.query('kind') === 'restock' ? 'restock' : 'rental')));

adminApi.patch('/requests/:id', async (c) => {
  const b = (await c.req.json().catch(() => ({}))) as { status?: unknown };
  if (!REQUEST_STATUSES.includes(b.status as RequestStatus)) return c.json({ error: 'invalid' }, 400);
  return (await setRequestStatus(c.env.DB, c.req.param('id'), b.status as RequestStatus)) ? c.json({ ok: true }) : c.json({ error: 'not_found' }, 404);
});

/* -------------------------------------------------------------- settings --------------------------------------------------------------- */

adminApi.get('/settings', async (c) =>
  c.json({ zones: await getZones(c.env.DB), shopPhone: (await getSetting(c.env.DB, 'shop_phone')) ?? '', card: Boolean(gatewayFor(c.env)), categories: CATEGORIES, occasions: OCCASIONS }),
);

adminApi.put('/settings', async (c) => {
  const b = (await c.req.json().catch(() => ({}))) as { zones?: unknown; shopPhone?: unknown };
  const current = await getZones(c.env.DB);
  const incoming = Array.isArray(b.zones) ? (b.zones as Record<string, unknown>[]) : [];
  const zones = current.map((z) => {
    const u = incoming.find((x) => x.id === z.id);
    if (!u) return z;
    const fee = u.fee === null || u.fee === '' ? null : Number(u.fee);
    return {
      id: z.id,
      fee: fee === null || (Number.isInteger(fee) && fee >= 0 && fee <= 100_000) ? fee : z.fee,
      enabled: typeof u.enabled === 'boolean' ? u.enabled : z.enabled,
    };
  });
  if (!zones.some((z) => z.enabled)) return c.json({ error: 'one_zone_required' }, 400);
  await setSetting(c.env.DB, 'delivery_zones', JSON.stringify(zones));
  if (typeof b.shopPhone === 'string') await setSetting(c.env.DB, 'shop_phone', b.shopPhone.trim().slice(0, 30));
  return c.json({ zones, shopPhone: (await getSetting(c.env.DB, 'shop_phone')) ?? '' });
});

/* ------------------------------------------------------- the legal pages' details ------------------------------------------------------ */

const NIPT_RE = /^[A-Z]\d{8}[A-Z]$/;
const PHONE_RE = /^\+?[\d\s()./-]+$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

adminApi.get('/legal', async (c) => c.json(await getLegalSettings(c.env.DB)));

/** The business details and the returns policy for /kushtet and /privatesia; a change moves their date. */
adminApi.put('/legal', async (c) => {
  const b = (await c.req.json().catch(() => ({}))) as { business?: Record<string, unknown>; returns?: Record<string, unknown> };
  const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
  const business: Business = {
    legalName: text(b.business?.legalName, 120),
    nipt: text(b.business?.nipt, 20).toUpperCase().replace(/\s/g, ''),
    phone: text(b.business?.phone, 30),
    email: text(b.business?.email, 120),
  };
  const r = b.returns ?? {};
  const mode: Returns['mode'] = r.mode === 'none' || r.mode === 'exchange' || r.mode === 'refund' ? r.mode : '';
  const days = Number(r.days);
  const fields: string[] = [];
  if (business.nipt && !NIPT_RE.test(business.nipt)) fields.push('nipt');
  const digits = business.phone.replace(/\D/g, '');
  if (business.phone && (!PHONE_RE.test(business.phone) || digits.length < 8 || digits.length > 15)) fields.push('phone');
  if (business.email && !EMAIL_RE.test(business.email)) fields.push('email');
  if ((mode === 'exchange' || mode === 'refund') && !(Number.isInteger(days) && days >= 1 && days <= 90)) fields.push('days');
  if (fields.length) return c.json({ error: 'invalid', fields }, 400);
  const returns: Returns = {
    mode,
    days: Number.isInteger(days) && days >= 1 && days <= 90 ? days : 14,
    unworn: r.unworn !== false,
    shipping: r.shipping === 'shop' ? 'shop' : 'customer',
    noteSq: text(r.noteSq, 600),
    noteEn: text(r.noteEn, 600),
  };
  const db = c.env.DB;
  const before = await getLegalSettings(db);
  await setSetting(db, 'business', JSON.stringify(business));
  await setSetting(db, 'returns', JSON.stringify(returns));
  if (JSON.stringify(before.business) !== JSON.stringify(business) || JSON.stringify(before.returns) !== JSON.stringify(returns)) {
    await setSetting(db, 'legal_updated', new Date().toISOString().slice(0, 10));
  }
  return c.json(await getLegalSettings(db));
});

/* ------------------------------------------------------------ visit counts ------------------------------------------------------------- */

adminApi.get('/stats', async (c) => {
  const days = Number(c.req.query('days'));
  return c.json(await report(c.env.DB, [7, 30, 90].includes(days) ? days : 30));
});

/* --------------------------------------------------------------- sales ---------------------------------------------------------------- */

/** The orders of a period [from, to) and of the one before it [prev, from), Tirana days, at most 62 days each. */
adminApi.get('/sales', async (c) => {
  const [prev, from, to] = [c.req.query('prev'), c.req.query('from'), c.req.query('to')];
  if (!isDay(prev) || !isDay(from) || !isDay(to) || !(prev < from && from < to)) return c.json({ error: 'invalid' }, 400);
  const span = (a: string, b: string) => (Date.parse(b) - Date.parse(a)) / 86_400_000;
  if (span(prev, from) > 62 || span(from, to) > 62) return c.json({ error: 'invalid' }, 400);
  return c.json(await salesReport(c.env.DB, prev, from, to));
});

/* ------------------------------------------------------- order alerts on Telegram ------------------------------------------------------- */

adminApi.get('/telegram', async (c) =>
  c.json({ ready: telegramReady(c.env), bot: telegramReady(c.env) ? await botName(c.env) : null, chats: await linkedChats(c.env.DB) }),
);

/** A one-time code and the t.me link that sends it; the admin then polls /telegram/check. */
adminApi.post('/telegram/link', async (c) => {
  if (!telegramReady(c.env)) return c.json({ error: 'telegram_off' }, 503);
  const bot = await botName(c.env);
  if (!bot) return c.json({ error: 'telegram_down' }, 502);
  const code = await startLink(c.env.DB);
  return c.json({ code, bot, url: `https://t.me/${bot}?start=${code}` });
});

adminApi.post('/telegram/check', async (c) => {
  if (!telegramReady(c.env)) return c.json({ error: 'telegram_off' }, 503);
  try {
    return c.json(await checkLink(c.env));
  } catch (e) {
    console.error(e);
    return c.json({ error: 'telegram_down' }, 502);
  }
});

adminApi.delete('/telegram/chats/:id', async (c) => c.json({ chats: await removeChat(c.env.DB, Number(c.req.param('id'))) }));

adminApi.post('/telegram/test', async (c) => {
  if (!telegramReady(c.env)) return c.json({ error: 'telegram_off' }, 503);
  return c.json({ sent: await sendTest(c.env) });
});

/* ------------------------------------------------------ Instagram follower count ------------------------------------------------------- */

/** Every answer carries the state; the footer of this instance takes the new number at once. */
const igReply = (c: Context<AppEnv>, s: InstagramState) => {
  setFollowers(s.followers);
  return c.json(s);
};

adminApi.get('/instagram', async (c) => c.json(await instagramState(c.env.DB)));

/** { token } links Instagram (checked with Instagram first); { followers } sets the number by hand. */
adminApi.put('/instagram', async (c) => {
  const b = (await c.req.json().catch(() => ({}))) as { token?: unknown; followers?: unknown };
  if (typeof b.token === 'string') {
    const token = b.token.trim();
    if (!/^[A-Za-z0-9_.|-]{20,600}$/.test(token)) return c.json({ error: 'instagram_token' }, 400);
    try {
      return igReply(c, await linkInstagram(c.env, token));
    } catch (e) {
      console.error('instagram link', e);
      return c.json({ error: 'instagram_token' }, 400);
    }
  }
  const n = Number(b.followers);
  if (!Number.isInteger(n) || n < 0 || n > 100_000_000) return c.json({ error: 'invalid', fields: ['followers'] }, 400);
  return igReply(c, await setFollowersByHand(c.env.DB, n));
});

adminApi.post('/instagram/sync', async (c) => igReply(c, await syncInstagram(c.env, true)));

adminApi.delete('/instagram', async (c) => igReply(c, await unlinkInstagram(c.env.DB)));
