/**
 * Visit counts kept by the shop itself, so Greta sees where visitors come from, which dresses they
 * look at and how the order form does, without a cookie banner. Each page view sends one small
 * beacon (src/client/stats.ts): no cookie, no identifier, and nothing about the visitor is stored,
 * only +1 on a row per day, metric and key. The IP address is used in memory to slow a flood of
 * beacons and is never written anywhere. Days are Tirana days, like the sales report's.
 */
import { addDays, dayStart, tiranaDay } from '../shared/time';

const KINDS = new Set(['home', 'shop', 'product', 'checkout', 'confirmation', 'notfound', 'privacy', 'terms', 'lookbook']);
/** The shop's own tools a visitor used (one +1 each, no detail): her size saved, her event date set,
 *  a dress saved, the saved list sent, a lookbook mark opened, a dress video seen, WhatsApp pressed. */
export const USES = ['size', 'date', 'save', 'share', 'mark', 'video', 'whatsapp', 'stylist'] as const;
const USE_SET = new Set<string>(USES);
const FIELDS = new Set(['name', 'phone', 'email', 'zone', 'city', 'address', 'payment']);
/** crawlers and test browsers that say what they are */
export const BOT_UA = /bot|crawl|spider|slurp|headless|lighthouse|pagespeed/i;

export interface Hit {
  t: 'view' | 'submit' | 'invalid' | 'use';
  k: string;
  slug?: string;
  entry?: boolean;
  src?: string;
  campaign?: string;
  fields?: string[];
}

const clean = (v: unknown, max: number): string => (typeof v === 'string' ? v.toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, max) : '');

export function parseHit(raw: unknown): Hit | null {
  const b = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const t = b.t === 'submit' || b.t === 'invalid' || b.t === 'use' ? b.t : b.t === 'view' ? 'view' : null;
  const k = typeof b.k === 'string' && (t === 'use' ? USE_SET.has(b.k) : KINDS.has(b.k)) ? b.k : null;
  if (!t || !k) return null;
  const slug = typeof b.s === 'string' && /^[a-z0-9-]{1,80}$/.test(b.s) ? b.s : undefined;
  const fields = Array.isArray(b.f) ? b.f.filter((f): f is string => typeof f === 'string' && FIELDS.has(f)).slice(0, 7) : undefined;
  return { t, k, slug, entry: b.e === true, src: clean(b.src, 40) || undefined, campaign: clean(b.c, 60) || undefined, fields };
}

/** The rows one beacon adds 1 to. */
export function rowsFor(h: Hit): [string, string][] {
  if (h.t === 'submit') return [['submit', '']];
  if (h.t === 'use') return [['use', h.k]];
  if (h.t === 'invalid') return [['invalid', ''], ...(h.fields ?? []).map((f): [string, string] => ['invalid_field', f])];
  const rows: [string, string][] = [['view', h.k]];
  if (h.k === 'product' && h.slug) rows.push(['dress', h.slug]);
  if (h.entry) {
    const src = h.src ?? 'direct';
    rows.push(['visit', ''], ['source', src]);
    if (h.campaign) rows.push(['campaign', `${src}/${h.campaign}`]);
  }
  return rows;
}

export async function count(db: D1Database, rows: [string, string][]): Promise<void> {
  if (!rows.length) return;
  const day = tiranaDay();
  await db.batch(
    rows.map(([metric, key]) =>
      db.prepare('INSERT INTO stats (day, metric, key, n) VALUES (?, ?, ?, 1) ON CONFLICT (day, metric, key) DO UPDATE SET n = n + 1').bind(day, metric, key),
    ),
  );
}

/** At most 120 beacons a minute from one address, counted in memory per instance only. */
const recent = new Map<string, { n: number; at: number }>();
export function tooMany(ip: string): boolean {
  const now = Date.now();
  if (recent.size > 5000) recent.clear();
  const r = recent.get(ip);
  if (!r || now - r.at > 60_000) {
    recent.set(ip, { n: 1, at: now });
    return false;
  }
  r.n++;
  return r.n > 120;
}

export interface StatsReport {
  days: number;
  visits: number;
  views: number;
  daily: { day: string; n: number }[];
  sources: { key: string; visits: number; orders: number }[];
  campaigns: { key: string; n: number }[];
  dresses: { slug: string; name: string; n: number }[];
  funnel: { checkout: number; submit: number; invalid: number; orders: number };
  invalidFields: { key: string; n: number }[];
  sales: { orders: number; total: number };
  /** the shop's tools: uses counted by beacon, and the requests sent (from the requests table) */
  uses: Record<(typeof USES)[number] | 'rental' | 'restock', number>;
}

/** What the admin's Statistikat page shows for the last `days` days (today included). */
export async function report(db: D1Database, days: number): Promise<StatsReport> {
  const since = addDays(tiranaDay(), -(days - 1));
  const placed = `status NOT IN ('cancelled', 'awaiting_payment') AND created_at >= ?`;
  const [agg, daily, sales, bySource, names, requests] = await db.batch([
    db.prepare('SELECT metric, key, SUM(n) AS n FROM stats WHERE day >= ? GROUP BY metric, key').bind(since),
    db.prepare(`SELECT day, SUM(n) AS n FROM stats WHERE metric = 'visit' AND day >= ? GROUP BY day`).bind(since),
    db.prepare(`SELECT COUNT(*) AS n, COALESCE(SUM(total), 0) AS total FROM orders WHERE ${placed}`).bind(dayStart(since)),
    db.prepare(`SELECT source, COUNT(*) AS n FROM orders WHERE ${placed} GROUP BY source`).bind(dayStart(since)),
    db.prepare('SELECT slug, name_sq FROM products'),
    db.prepare(`SELECT kind, COUNT(*) AS n FROM requests WHERE created_at >= ? GROUP BY kind`).bind(dayStart(since)),
  ]);
  const asked = new Map(((requests?.results ?? []) as { kind: string; n: number }[]).map((r) => [r.kind, r.n]));
  const rows = (agg?.results ?? []) as { metric: string; key: string; n: number }[];
  const sum = (metric: string, key?: string) => rows.filter((r) => r.metric === metric && (key === undefined || r.key === key)).reduce((n, r) => n + r.n, 0);
  const list = (metric: string) =>
    rows
      .filter((r) => r.metric === metric)
      .map((r) => ({ key: r.key, n: r.n }))
      .sort((a, b) => b.n - a.n);
  const perDay = new Map(((daily?.results ?? []) as { day: string; n: number }[]).map((r) => [r.day, r.n]));
  const name = new Map(((names?.results ?? []) as { slug: string; name_sq: string }[]).map((r) => [r.slug, r.name_sq]));
  const orderSources = new Map<string, number>();
  for (const r of (bySource?.results ?? []) as { source: string; n: number }[]) {
    const key = r.source.split('/')[0] || 'direct';
    orderSources.set(key, (orderSources.get(key) ?? 0) + r.n);
  }
  const visitSources = list('source');
  const sourceKeys = [...new Set([...visitSources.map((s) => s.key), ...orderSources.keys()])];
  const s = ((sales?.results ?? [])[0] ?? { n: 0, total: 0 }) as { n: number; total: number };
  return {
    days,
    visits: sum('visit'),
    views: sum('view'),
    daily: Array.from({ length: days }, (_, i) => {
      const day = addDays(since, i);
      return { day, n: perDay.get(day) ?? 0 };
    }),
    sources: sourceKeys
      .map((key) => ({ key, visits: visitSources.find((v) => v.key === key)?.n ?? 0, orders: orderSources.get(key) ?? 0 }))
      .sort((a, b) => b.visits - a.visits || b.orders - a.orders),
    campaigns: list('campaign').slice(0, 20),
    dresses: list('dress')
      .slice(0, 15)
      .map((d) => ({ slug: d.key, name: name.get(d.key) ?? d.key, n: d.n })),
    funnel: { checkout: sum('view', 'checkout'), submit: sum('submit'), invalid: sum('invalid'), orders: s.n },
    invalidFields: list('invalid_field'),
    sales: { orders: s.n, total: s.total },
    uses: {
      ...(Object.fromEntries(USES.map((k) => [k, sum('use', k)])) as Record<(typeof USES)[number], number>),
      rental: asked.get('rental') ?? 0,
      restock: asked.get('restock') ?? 0,
    },
  };
}
