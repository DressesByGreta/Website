/**
 * Requests Greta answers herself (migrations/0004_requests.sql): a dress for a date (rental) and a
 * word when a sold-out size is back (restock). Visitors send them from the dress page; she sees
 * them in the admin's Kërkesat with a WhatsApp message ready to send, and gets a Telegram alert.
 * Confirmed rentals become the dress's booked dates, shown on its page without any name.
 */
import { isSize, type Size } from '../shared/catalog';
import { isLang, type Lang } from '../shared/copy';
import { tiranaDay } from '../shared/time';

export type RequestKind = 'rental' | 'restock';
export type RequestStatus = 'new' | 'confirmed' | 'declined' | 'done';
export const REQUEST_STATUSES: RequestStatus[] = ['new', 'confirmed', 'declined', 'done'];

export interface RequestInput {
  kind: RequestKind;
  productId: string;
  size: Size;
  eventDate: string | null;
  name: string;
  phone: string;
  note: string;
  lang: Lang;
}

export interface RequestRow {
  id: string;
  kind: RequestKind;
  product_id: string;
  size: Size;
  event_date: string | null;
  name: string;
  phone: string;
  note: string;
  lang: Lang;
  status: RequestStatus;
  created_at: string;
  /** joined for the admin and the alerts */
  product_name?: string;
  product_slug?: string;
}

const PHONE_RE = /^\+?[\d\s()./-]{6,20}$/;
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export function parseRequest(body: unknown): { input?: RequestInput; errors: string[] } {
  const b = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  const errors: string[] = [];
  const kind = b.kind === 'rental' || b.kind === 'restock' ? b.kind : null;
  if (!kind) errors.push('kind');
  const productId = str(b.productId, 40);
  if (!/^[a-z0-9-]{6,40}$/.test(productId)) errors.push('productId');
  const size = isSize(b.size) ? b.size : null;
  if (!size) errors.push('size');
  const phone = str(b.phone, 30);
  if (!PHONE_RE.test(phone) || phone.replace(/\D/g, '').length < 6) errors.push('phone');
  let eventDate: string | null = null;
  if (kind === 'rental') {
    eventDate = str(b.eventDate, 10);
    const today = tiranaDay();
    // a date from today up to a year ahead
    const max = tiranaDay(Date.now() + 366 * 86_400_000);
    if (!DAY_RE.test(eventDate) || eventDate < today || eventDate > max) errors.push('eventDate');
  }
  const name = str(b.name, 80);
  if (kind === 'rental' && !name) errors.push('name');
  if (errors.length || !kind || !size) return { errors };
  return { input: { kind, productId, size, eventDate, name, phone, note: str(b.note, 500), lang: isLang(b.lang) ? b.lang : 'sq' }, errors };
}

export async function createRequest(db: D1Database, input: RequestInput): Promise<string> {
  const id = crypto.randomUUID();
  await db
    .prepare('INSERT INTO requests (id, kind, product_id, size, event_date, name, phone, note, lang) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(id, input.kind, input.productId, input.size, input.eventDate, input.name, input.phone, input.note, input.lang)
    .run();
  return id;
}

const JOINED = `SELECT r.*, p.name_sq AS product_name, p.slug AS product_slug FROM requests r JOIN products p ON p.id = r.product_id`;

export async function getRequest(db: D1Database, id: string): Promise<RequestRow | null> {
  return db.prepare(`${JOINED} WHERE r.id = ?`).bind(id).first<RequestRow>();
}

/** The admin's list: open ones first (new, then confirmed by date), then the rest, newest first. */
export async function listRequests(db: D1Database, kind: RequestKind): Promise<RequestRow[]> {
  const rows = await db
    .prepare(
      `${JOINED} WHERE r.kind = ? ORDER BY CASE r.status WHEN 'new' THEN 0 WHEN 'confirmed' THEN 1 ELSE 2 END,
       CASE WHEN r.status = 'confirmed' THEN r.event_date END ASC, r.created_at DESC LIMIT 300`,
    )
    .bind(kind)
    .all<RequestRow>();
  return rows.results ?? [];
}

export async function countNewRequests(db: D1Database): Promise<number> {
  return (await db.prepare(`SELECT COUNT(*) AS n FROM requests WHERE status = 'new'`).first<{ n: number }>())?.n ?? 0;
}

export async function setRequestStatus(db: D1Database, id: string, status: RequestStatus): Promise<boolean> {
  const closed = status === 'done' || status === 'declined';
  const res = await db
    .prepare(`UPDATE requests SET status = ?, closed_at = CASE WHEN ? THEN strftime('%Y-%m-%dT%H:%M:%fZ', 'now') ELSE NULL END WHERE id = ?`)
    .bind(status, closed ? 1 : 0, id)
    .run();
  return (res.meta.changes ?? 0) > 0;
}

/** The same instant n calendar months earlier (the 31st falls back to the month's last day). */
function monthsAgo(n: number, from = new Date()): Date {
  const d = new Date(from);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() - n);
  d.setUTCDate(Math.min(day, new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate()));
  return d;
}

/**
 * Requests delete themselves, as the privacy page promises: a rental six months after the date of
 * its event; a waiting-list request one month after the visitor was told (closed), and in any case
 * six months after it was sent. Run by the scheduled job; returns how many went.
 */
export async function purgeRequests(db: D1Database, now = new Date()): Promise<number> {
  const sixMonths = monthsAgo(6, now);
  const res = await db
    .prepare(
      `DELETE FROM requests WHERE
         (kind = 'rental' AND event_date < ?1)
         OR (kind = 'restock' AND ((closed_at IS NOT NULL AND closed_at < ?2) OR created_at < ?3))`,
    )
    .bind(tiranaDay(sixMonths.getTime()), monthsAgo(1, now).toISOString(), sixMonths.toISOString())
    .run();
  return res.meta.changes ?? 0;
}

/** A dress's confirmed rentals from today on: the dates (and sizes) its page shows as booked. */
export async function bookedDates(db: D1Database, productId: string): Promise<{ date: string; size: Size }[]> {
  const rows = await db
    .prepare(`SELECT event_date AS date, size FROM requests WHERE product_id = ? AND kind = 'rental' AND status = 'confirmed' AND event_date >= ? ORDER BY event_date LIMIT 40`)
    .bind(productId, tiranaDay())
    .all<{ date: string; size: Size }>();
  return rows.results ?? [];
}

/** People still waiting for these sizes of this dress (to tell Greta when she restocks). */
export async function waitingFor(db: D1Database, productId: string, sizes: Size[]): Promise<Record<string, number>> {
  if (!sizes.length) return {};
  const rows = await db
    .prepare(`SELECT size, COUNT(*) AS n FROM requests WHERE product_id = ? AND kind = 'restock' AND status = 'new' AND size IN (${sizes.map(() => '?').join(',')}) GROUP BY size`)
    .bind(productId, ...sizes)
    .all<{ size: string; n: number }>();
  return Object.fromEntries((rows.results ?? []).map((r) => [r.size, r.n]));
}

/** Every dress and size booked (confirmed rentals) on one day: what "shop by date" dims. No names. */
export async function bookedOn(db: D1Database, day: string): Promise<{ id: string; size: Size }[]> {
  const rows = await db
    .prepare(`SELECT product_id AS id, size FROM requests WHERE kind = 'rental' AND status = 'confirmed' AND event_date = ?`)
    .bind(day)
    .all<{ id: string; size: Size }>();
  return rows.results ?? [];
}
