/**
 * The sales report's numbers and its Excel file, both made from the rows /api/admin/sales returns
 * (src/worker/sales.ts), so the page and the file always agree. Cancelled orders are listed and
 * counted apart, never in a total.
 */
import { SIZES } from '../shared/catalog';
import { addDays, tiranaDay, wall } from '../shared/time';
import type { SaleOrder, SalesReport } from './api';
import { workbook, type Sheet } from './xlsx';

/** An order counts unless it was cancelled. */
export const counted = (o: SaleOrder): boolean => o.status !== 'cancelled';
const pieces = (o: SaleOrder): number => o.items.reduce((n, i) => n + i.qty, 0);

export interface Summary {
  orders: number;
  total: number;
  pieces: number;
  cancelled: number;
  average: number;
}

export function summarize(list: SaleOrder[]): Summary {
  const live = list.filter(counted);
  const total = live.reduce((s, o) => s + o.total, 0);
  return {
    orders: live.length,
    total,
    pieces: live.reduce((s, o) => s + pieces(o), 0),
    cancelled: list.length - live.length,
    average: live.length ? Math.round(total / live.length) : 0,
  };
}

export interface DressLine {
  name: string;
  qty: number;
  value: number;
  sizes: [string, number][];
}

/** Dresses sold, most pieces first: one line per dress (renamed or deleted ones keep their order's name). */
export function byDress(list: SaleOrder[]): DressLine[] {
  const lines = new Map<string, { name: string; qty: number; value: number; sizes: Map<string, number> }>();
  for (const o of list.filter(counted)) {
    for (const i of o.items) {
      const key = i.product_id ?? `name:${i.name}`;
      const d = lines.get(key) ?? { name: i.name, qty: 0, value: 0, sizes: new Map<string, number>() };
      d.name = i.name;
      d.qty += i.qty;
      d.value += i.qty * i.price;
      d.sizes.set(i.size, (d.sizes.get(i.size) ?? 0) + i.qty);
      lines.set(key, d);
    }
  }
  return [...lines.values()]
    .map((d) => ({ name: d.name, qty: d.qty, value: d.value, sizes: [...d.sizes].sort((a, b) => Number(a[0]) - Number(b[0])) }))
    .sort((a, b) => b.qty - a.qty || b.value - a.value);
}

/** Pieces sold in each size, every size listed. */
export function bySize(list: SaleOrder[]): [string, number][] {
  const n = new Map<string, number>(SIZES.map((s) => [s, 0]));
  for (const o of list.filter(counted)) for (const i of o.items) n.set(i.size, (n.get(i.size) ?? 0) + i.qty);
  return [...n];
}

/** Orders counted on each Tirana day of [from, to). */
export function byDay(list: SaleOrder[], from: string, to: string): { day: string; orders: number }[] {
  const n = new Map<string, number>();
  for (const o of list.filter(counted)) {
    const d = tiranaDay(Date.parse(o.created_at));
    n.set(d, (n.get(d) ?? 0) + 1);
  }
  const out: { day: string; orders: number }[] = [];
  for (let d = from; d < to; d = addDays(d, 1)) out.push({ day: d, orders: n.get(d) ?? 0 });
  return out;
}

/** How many orders share each value of `key`, the largest first. */
export function tally(list: SaleOrder[], key: (o: SaleOrder) => string): [string, number][] {
  const n = new Map<string, number>();
  for (const o of list) n.set(key(o), (n.get(key(o)) ?? 0) + 1);
  return [...n].sort((a, b) => b[1] - a[1]);
}

/** The admin's Albanian words for the codes stored with an order. */
export interface Labels {
  status: Record<string, string>;
  method: Record<string, string>;
  payment: Record<string, string>;
  zone: Record<string, string>;
  source: (s: string) => string;
}

const FOOT = 'Gjithsej, pa të anuluarat';

/** Two sheets: the orders, one per line, and the dresses in them, one line per dress and size. */
export function salesFile(r: SalesReport, l: Labels): Blob {
  const at = (iso: string) => ({ at: wall(Date.parse(iso)) });
  const live = r.orders.filter(counted);
  const sum = (f: (o: SaleOrder) => number) => live.reduce((s, o) => s + f(o), 0);
  const orders: Sheet = {
    name: 'Porositë',
    columns: [
      { title: 'Nr.', width: 8 },
      { title: 'Data', width: 17 },
      { title: 'Statusi', width: 13 },
      { title: 'Pagesa', width: 12 },
      { title: 'Statusi i pagesës', width: 17 },
      { title: 'Klienti', width: 24 },
      { title: 'Telefoni', width: 15 },
      { title: 'Qyteti', width: 16 },
      { title: 'Zona', width: 24 },
      { title: 'Fustane', width: 9 },
      { title: 'Nëntotali', width: 12 },
      { title: 'Transporti', width: 11 },
      { title: 'Totali', width: 12 },
      { title: 'Nga erdhi', width: 22 },
    ],
    rows: r.orders.map((o) => [
      o.number,
      at(o.created_at),
      l.status[o.status] ?? o.status,
      l.method[o.payment_method] ?? o.payment_method,
      l.payment[o.payment_status] ?? o.payment_status,
      o.customer_name,
      o.phone,
      o.city,
      l.zone[o.zone] ?? o.zone,
      pieces(o),
      { lek: o.subtotal },
      o.delivery_fee === null ? null : { lek: o.delivery_fee },
      { lek: o.total },
      l.source(o.source),
    ]),
    foot: [[FOOT, null, null, null, null, null, null, null, null, sum(pieces), { lek: sum((o) => o.subtotal) }, { lek: sum((o) => o.delivery_fee ?? 0) }, { lek: sum((o) => o.total) }, null]],
  };
  const lines = r.orders.flatMap((o) => o.items.map((i) => ({ o, i })));
  const kept = lines.filter(({ o }) => counted(o));
  const dresses: Sheet = {
    name: 'Fustanet',
    columns: [
      { title: 'Nr. i porosisë', width: 14 },
      { title: 'Data', width: 17 },
      { title: 'Fustani', width: 30 },
      { title: 'Masa', width: 7 },
      { title: 'Copë', width: 7 },
      { title: 'Çmimi', width: 12 },
      { title: 'Vlera', width: 12 },
      { title: 'Statusi i porosisë', width: 18 },
    ],
    rows: lines.map(({ o, i }) => [o.number, at(o.created_at), i.name, Number(i.size), i.qty, { lek: i.price }, { lek: i.qty * i.price }, l.status[o.status] ?? o.status]),
    foot: [[FOOT, null, null, null, kept.reduce((s, x) => s + x.i.qty, 0), null, { lek: kept.reduce((s, x) => s + x.i.qty * x.i.price, 0) }, null]],
  };
  return workbook([orders, dresses]);
}
