/**
 * Orders: creation from the checkout form, the admin's status changes, and the release of stock
 * held by card orders that were never paid. Prices always come from D1, never from the browser.
 */
import { isSize, SIZES, type Size, type ZoneId } from '../shared/catalog';
import { isLang, type Lang } from '../shared/copy';
import { getZones } from './db';
import { gatewayFor } from './payments';

export type OrderStatus = 'awaiting_payment' | 'new' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'pending' | 'paid' | 'failed' | 'refunded';

export interface OrderRow {
  id: string;
  number: number;
  client_ref: string | null;
  status: OrderStatus;
  payment_method: 'cod' | 'card';
  payment_status: PaymentStatus;
  payment_ref: string;
  customer_name: string;
  phone: string;
  email: string;
  zone: ZoneId;
  city: string;
  address: string;
  notes: string;
  subtotal: number;
  delivery_fee: number | null;
  total: number;
  lang: Lang;
  created_at: string;
  updated_at: string;
}

export interface OrderItemRow {
  order_id: string;
  product_id: string | null;
  name: string;
  size: string;
  qty: number;
  price: number;
  image_key: string;
}

export interface OrderInput {
  ref: string;
  items: { id: string; size: Size; qty: number }[];
  name: string;
  phone: string;
  email: string;
  zone: ZoneId;
  city: string;
  address: string;
  notes: string;
  payment: 'cod' | 'card';
  lang: Lang;
}

export type FieldError = { field: string; code: 'required' | 'invalid' };

const str = (v: unknown, max: number): string => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** Validates the raw JSON body. Returns field errors in the order the form shows them. */
export function parseOrderInput(body: unknown): { input?: OrderInput; errors: FieldError[] } {
  const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  const errors: FieldError[] = [];
  const name = str(b.name, 80);
  const phone = str(b.phone, 30);
  const email = str(b.email, 120);
  const city = str(b.city, 60);
  const address = str(b.address, 200);
  const notes = str(b.notes, 500);
  const ref = str(b.ref, 64);
  const zone = str(b.zone, 20) as ZoneId;
  const payment = b.payment === 'card' ? 'card' : b.payment === 'cod' ? 'cod' : null;

  if (name.length < 2) errors.push({ field: 'name', code: name ? 'invalid' : 'required' });
  const digits = phone.replace(/\D/g, '');
  if (!phone) errors.push({ field: 'phone', code: 'required' });
  else if (!/^\+?[\d\s()./-]+$/.test(phone) || digits.length < 8 || digits.length > 15) errors.push({ field: 'phone', code: 'invalid' });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors.push({ field: 'email', code: 'invalid' });
  if (!['tirana', 'albania', 'kosovo'].includes(zone)) errors.push({ field: 'zone', code: 'required' });
  if (city.length < 2) errors.push({ field: 'city', code: city ? 'invalid' : 'required' });
  if (address.length < 5) errors.push({ field: 'address', code: address ? 'invalid' : 'required' });
  if (!payment) errors.push({ field: 'payment', code: 'required' });
  if (!/^[A-Za-z0-9-]{8,64}$/.test(ref)) errors.push({ field: 'ref', code: 'invalid' });

  const rawItems = Array.isArray(b.items) ? b.items.slice(0, 20) : [];
  const merged = new Map<string, { id: string; size: Size; qty: number }>();
  for (const it of rawItems) {
    const o = (it && typeof it === 'object' ? it : {}) as Record<string, unknown>;
    const id = str(o.id, 40);
    const qty = Number(o.qty);
    if (!id || !isSize(o.size) || !Number.isInteger(qty) || qty < 1 || qty > 5) continue;
    const k = `${id}:${o.size}`;
    const prev = merged.get(k);
    merged.set(k, { id, size: o.size, qty: Math.min(5, (prev?.qty ?? 0) + qty) });
  }
  if (!merged.size) errors.push({ field: 'items', code: 'required' });
  if (errors.length || !payment) return { errors };
  return {
    errors,
    input: { ref, items: [...merged.values()], name, phone, email, zone, city, address, notes, payment, lang: isLang(b.lang) ? b.lang : 'sq' },
  };
}

export type CreateResult =
  | { ok: true; id: string; number: number; payUrl?: string }
  | { ok: false; status: 400 | 409 | 503; error: string; unavailable?: { id: string; size: string; name: string; left: number }[] };

export async function createOrder(env: Env, input: OrderInput, origin: string): Promise<CreateResult> {
  const db = env.DB;
  const gateway = gatewayFor(env);
  const existing = await db
    .prepare('SELECT id, number, status, total FROM orders WHERE client_ref = ?')
    .bind(input.ref)
    .first<Pick<OrderRow, 'id' | 'number' | 'status' | 'total'>>();
  if (existing) {
    // A replayed submit of an unpaid card order must still lead to the bank, not to a dead end.
    if (existing.status === 'awaiting_payment' && gateway) {
      const pay = await gateway.createPayment(existing, origin);
      return { ok: true, id: existing.id, number: existing.number, payUrl: pay.url };
    }
    return { ok: true, id: existing.id, number: existing.number };
  }
  if (input.payment === 'card' && !gateway) return { ok: false, status: 400, error: 'card_unavailable' };

  const zones = await getZones(db);
  const zone = zones.find((z) => z.id === input.zone && z.enabled);
  if (!zone) return { ok: false, status: 400, error: 'zone' };

  const ids = [...new Set(input.items.map((i) => i.id))];
  const marks = ids.map(() => '?').join(',');
  const [prodRes, sizeRes, imgRes] = await db.batch([
    db.prepare(`SELECT id, name_sq, name_en, price FROM products WHERE id IN (${marks}) AND status = 'published' AND price IS NOT NULL`).bind(...ids),
    db.prepare(`SELECT product_id, size, stock FROM product_sizes WHERE product_id IN (${marks})`).bind(...ids),
    db.prepare(`SELECT product_id, key, ext, widths FROM product_images WHERE product_id IN (${marks}) ORDER BY sort ASC`).bind(...ids),
  ]);
  const products = new Map(((prodRes?.results ?? []) as { id: string; name_sq: string; name_en: string; price: number }[]).map((p) => [p.id, p]));
  const stock = new Map(((sizeRes?.results ?? []) as { product_id: string; size: string; stock: number }[]).map((s) => [`${s.product_id}:${s.size}`, s.stock]));
  const cover = new Map<string, string>();
  for (const im of (imgRes?.results ?? []) as { product_id: string; key: string; ext: string; widths: string }[]) {
    if (cover.has(im.product_id)) continue;
    const widths = JSON.parse(im.widths) as number[];
    cover.set(im.product_id, `${im.key}/${widths[0] ?? 480}.${im.ext}`);
  }

  const unavailable: { id: string; size: string; name: string; left: number }[] = [];
  const lines = input.items.map((it) => {
    const p = products.get(it.id);
    const left = stock.get(`${it.id}:${it.size}`) ?? 0;
    const name = p ? (input.lang !== 'sq' ? p.name_en || p.name_sq : p.name_sq) : '';
    if (!p || left < it.qty) unavailable.push({ id: it.id, size: it.size, name, left: p ? left : 0 });
    return { ...it, name: p?.name_sq ?? '', price: p?.price ?? 0, image: cover.get(it.id) ?? '' };
  });
  if (unavailable.length) return { ok: false, status: 409, error: 'sold_out', unavailable };

  const subtotal = lines.reduce((n, l) => n + l.price * l.qty, 0);
  const fee = zone.fee;
  const total = subtotal + (fee ?? 0);
  const id = crypto.randomUUID();
  const card = input.payment === 'card';

  try {
    await db.batch([
      db
        .prepare(
          `INSERT INTO orders (id, number, client_ref, status, payment_method, payment_status, customer_name, phone, email, zone, city, address, notes, subtotal, delivery_fee, total, lang)
           VALUES (?1, (SELECT COALESCE(MAX(number), 1000) + 1 FROM orders), ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16)`,
        )
        .bind(id, input.ref, card ? 'awaiting_payment' : 'new', input.payment, card ? 'pending' : 'unpaid', input.name, input.phone, input.email, zone.id, input.city, input.address, input.notes, subtotal, fee, total, input.lang),
      ...lines.map((l) =>
        db.prepare('INSERT INTO order_items (order_id, product_id, name, size, qty, price, image_key) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(id, l.id, l.name, l.size, l.qty, l.price, l.image),
      ),
      // stock >= 0 is a CHECK constraint: a line that would oversell aborts the whole transaction.
      ...lines.map((l) => db.prepare('UPDATE product_sizes SET stock = stock - ? WHERE product_id = ? AND size = ?').bind(l.qty, l.id, l.size)),
    ]);
  } catch (e) {
    const msg = String((e as Error)?.message ?? e);
    if (msg.includes('client_ref')) {
      const again = await db.prepare('SELECT id, number FROM orders WHERE client_ref = ?').bind(input.ref).first<{ id: string; number: number }>();
      if (again) return { ok: true, id: again.id, number: again.number };
    }
    if (msg.includes('CHECK constraint failed')) return { ok: false, status: 409, error: 'sold_out', unavailable: [] };
    throw e;
  }

  const row = await db.prepare('SELECT number FROM orders WHERE id = ?').bind(id).first<{ number: number }>();
  const number = row?.number ?? 0;
  if (!card || !gateway) return { ok: true, id, number };

  const pay = await gateway.createPayment({ id, number, total }, origin);
  await db.prepare('UPDATE orders SET payment_ref = ? WHERE id = ?').bind(pay.ref, id).run();
  return { ok: true, id, number, payUrl: pay.url };
}

export async function getOrder(db: D1Database, id: string): Promise<{ order: OrderRow; items: OrderItemRow[] } | null> {
  const [o, i] = await db.batch([db.prepare('SELECT * FROM orders WHERE id = ?').bind(id), db.prepare('SELECT * FROM order_items WHERE order_id = ?').bind(id)]);
  const order = (o?.results ?? [])[0] as unknown as OrderRow | undefined;
  return order ? { order, items: (i?.results ?? []) as unknown as OrderItemRow[] } : null;
}

const NEXT: Record<OrderStatus, OrderStatus[]> = {
  awaiting_payment: ['new', 'cancelled'],
  new: ['confirmed', 'cancelled'],
  confirmed: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};
export const allowedNext = (s: OrderStatus): OrderStatus[] => NEXT[s];

async function restock(db: D1Database, orderId: string): Promise<void> {
  const items = await db.prepare('SELECT product_id, size, qty FROM order_items WHERE order_id = ? AND product_id IS NOT NULL').bind(orderId).all<{ product_id: string; size: string; qty: number }>();
  const stmts = (items.results ?? [])
    .filter((it) => (SIZES as readonly string[]).includes(it.size))
    .map((it) =>
      db
        .prepare(
          `INSERT INTO product_sizes (product_id, size, stock) SELECT ?1, ?2, ?3 WHERE EXISTS (SELECT 1 FROM products WHERE id = ?1)
           ON CONFLICT (product_id, size) DO UPDATE SET stock = stock + excluded.stock`,
        )
        .bind(it.product_id, it.size, it.qty),
    );
  if (stmts.length) await db.batch(stmts);
}

/** Moves an order along; cancelling returns its dresses to stock exactly once. */
export async function setOrderStatus(db: D1Database, id: string, next: OrderStatus, paymentOnCancel: PaymentStatus | null = null): Promise<'ok' | 'not_found' | 'not_allowed'> {
  const cur = await db.prepare('SELECT status, payment_status FROM orders WHERE id = ?').bind(id).first<{ status: OrderStatus; payment_status: PaymentStatus }>();
  if (!cur) return 'not_found';
  if (!NEXT[cur.status].includes(next)) return 'not_allowed';
  const payment = next === 'cancelled' && paymentOnCancel ? paymentOnCancel : cur.payment_status;
  const res = await db
    .prepare(`UPDATE orders SET status = ?, payment_status = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ? AND status = ?`)
    .bind(next, payment, id, cur.status)
    .run();
  if (res.meta.changes !== 1) return 'not_allowed';
  if (next === 'cancelled') await restock(db, id);
  return 'ok';
}

export async function setPaymentStatus(db: D1Database, id: string, status: PaymentStatus): Promise<void> {
  await db.prepare(`UPDATE orders SET payment_status = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?`).bind(status, id).run();
}

/** Card orders hold stock for 30 minutes; after that the dresses go back on sale. */
export async function releaseExpiredCardOrders(env: Env): Promise<number> {
  const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  const rows = await env.DB.prepare(`SELECT id FROM orders WHERE status = 'awaiting_payment' AND created_at < ?`).bind(cutoff).all<{ id: string }>();
  let n = 0;
  for (const r of rows.results ?? []) if ((await setOrderStatus(env.DB, r.id, 'cancelled', 'failed')) === 'ok') n++;
  return n;
}
