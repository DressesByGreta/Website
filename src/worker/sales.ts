/**
 * The admin's sales report (Shitjet): every order of a week or a month with its dresses, the same for
 * the period before it, and the visits of both. The admin adds them up and writes the Excel file
 * from the same rows, so the page and the file always agree. Card orders still waiting for the bank
 * are left out; cancelled orders come along and are counted apart.
 */
import { dayStart } from '../shared/time';

export interface SaleItem {
  /** null once the dress has been deleted from the shop */
  product_id: string | null;
  name: string;
  size: string;
  qty: number;
  price: number;
}

export interface SaleOrder {
  id: string;
  number: number;
  created_at: string;
  status: string;
  payment_method: string;
  payment_status: string;
  customer_name: string;
  phone: string;
  city: string;
  zone: string;
  subtotal: number;
  delivery_fee: number | null;
  total: number;
  source: string;
  items: SaleItem[];
}

export interface SalesReport {
  prev: string;
  from: string;
  to: string;
  orders: SaleOrder[];
  previous: SaleOrder[];
  visits: number;
  prevVisits: number;
}

/** Periods are Tirana days: [prev, from) is the period before [from, to). */
export async function salesReport(db: D1Database, prev: string, from: string, to: string): Promise<SalesReport> {
  const [start, middle, end] = [dayStart(prev), dayStart(from), dayStart(to)];
  const [o, i, v] = await db.batch([
    db
      .prepare(
        `SELECT id, number, created_at, status, payment_method, payment_status, customer_name, phone, city, zone, subtotal, delivery_fee, total, source
         FROM orders WHERE status != 'awaiting_payment' AND created_at >= ? AND created_at < ? ORDER BY created_at ASC LIMIT 5000`,
      )
      .bind(start, end),
    db
      .prepare(
        `SELECT i.order_id, i.product_id, i.name, i.size, i.qty, i.price FROM order_items i JOIN orders o ON o.id = i.order_id
         WHERE o.status != 'awaiting_payment' AND o.created_at >= ? AND o.created_at < ? ORDER BY i.rowid ASC`,
      )
      .bind(start, end),
    db
      .prepare(`SELECT COALESCE(SUM(CASE WHEN day >= ? THEN n END), 0) AS now, COALESCE(SUM(CASE WHEN day < ? THEN n END), 0) AS before FROM stats WHERE metric = 'visit' AND day >= ? AND day < ?`)
      .bind(from, from, prev, to),
  ]);
  const items = new Map<string, SaleItem[]>();
  for (const r of (i?.results ?? []) as (SaleItem & { order_id: string })[]) {
    const list = items.get(r.order_id) ?? [];
    list.push({ product_id: r.product_id, name: r.name, size: r.size, qty: r.qty, price: r.price });
    items.set(r.order_id, list);
  }
  const all = ((o?.results ?? []) as Omit<SaleOrder, 'items'>[]).map((r) => ({ ...r, items: items.get(r.id) ?? [] }));
  const visits = ((v?.results ?? [])[0] ?? { now: 0, before: 0 }) as { now: number; before: number };
  return {
    prev,
    from,
    to,
    orders: all.filter((r) => r.created_at >= middle),
    previous: all.filter((r) => r.created_at < middle),
    visits: visits.now,
    prevVisits: visits.before,
  };
}
