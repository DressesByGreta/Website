/** D1 access: catalogue reads for the storefront, full records for the admin, settings. */
import { SIZES, emptyStock, parseMeasures, type Measures, isCategory, isOccasion, isSize, isTag, ZONES, type Category, type Occasion, type Tag, type Photo, type Product, type Size, type Stock, type Zone } from '../shared/catalog';
import type { Lang } from '../shared/copy';
import { EMPTY_BUSINESS, EMPTY_RETURNS, UPDATED, type Business, type Returns } from '../shared/legal';

export interface ProductRow {
  id: string;
  slug: string;
  name_sq: string;
  name_en: string;
  description_sq: string;
  description_en: string;
  price: number | null;
  compare_price: number | null;
  color: string;
  categories: string;
  status: 'draft' | 'published';
  featured: number;
  instagram_url: string;
  sort: number;
  created_at: string;
  updated_at: string;
  new_until: string | null;
  measures: string;
  fit_sq: string;
  fit_en: string;
}

export interface ImageRow {
  id: string;
  product_id: string;
  key: string;
  ext: string;
  widths: string;
  w: number;
  h: number;
  lqip: string;
  alt_sq: string;
  alt_en: string;
  sort: number;
}

interface SizeRow {
  product_id: string;
  size: string;
  stock: number;
}

/** The admin's view of a product: both languages, raw status, every photo. */
export interface AdminProduct {
  id: string;
  slug: string;
  nameSq: string;
  nameEn: string;
  descriptionSq: string;
  descriptionEn: string;
  price: number | null;
  comparePrice: number | null;
  color: string;
  categories: Tag[];
  status: 'draft' | 'published';
  featured: boolean;
  instagramUrl: string;
  sort: number;
  stock: Stock;
  photos: (Photo & { altSq: string; altEn: string })[];
  updatedAt: string;
  /** Shown as new until then; null until the first publication. */
  newUntil: string | null;
  measures: Measures;
  fitSq: string;
  fitEn: string;
}

const parseList = <T>(json: string, keep: (v: unknown) => v is T): T[] => {
  try {
    const v = JSON.parse(json) as unknown;
    return Array.isArray(v) ? v.filter(keep) : [];
  } catch {
    return [];
  }
};
const parseCategories = (json: string): Category[] => parseList(json, isCategory);
const parseOccasions = (json: string): Occasion[] => parseList(json, isOccasion);
const parseTags = (json: string): Tag[] => parseList(json, isTag);

const parseWidths = (json: string): number[] => {
  try {
    const v = JSON.parse(json) as unknown;
    return Array.isArray(v) ? v.filter((n): n is number => Number.isInteger(n)).sort((a, b) => a - b) : [];
  } catch {
    return [];
  }
};

export const toPhoto = (r: ImageRow, lang: Lang): Photo => ({
  id: r.id,
  key: r.key,
  ext: r.ext === 'jpg' ? 'jpg' : 'webp',
  widths: parseWidths(r.widths),
  w: r.w,
  h: r.h,
  lqip: r.lqip,
  // French has no admin fields of its own: it reads the English ones.
  alt: (lang !== 'sq' ? r.alt_en || r.alt_sq : r.alt_sq || r.alt_en) || '',
});

function assemble(rows: ProductRow[], sizes: SizeRow[], images: ImageRow[], lang: Lang): Product[] {
  const stock = new Map<string, Stock>();
  for (const s of sizes) {
    if (!isSize(s.size)) continue;
    const st = stock.get(s.product_id) ?? emptyStock();
    st[s.size] = s.stock;
    stock.set(s.product_id, st);
  }
  const photos = new Map<string, Photo[]>();
  for (const im of images) {
    const list = photos.get(im.product_id) ?? [];
    list.push(toPhoto(im, lang));
    photos.set(im.product_id, list);
  }
  const now = new Date().toISOString();
  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: lang !== 'sq' ? r.name_en || r.name_sq : r.name_sq,
    description: lang !== 'sq' ? r.description_en || r.description_sq : r.description_sq || r.description_en,
    price: r.price,
    comparePrice: r.compare_price,
    color: r.color,
    categories: parseCategories(r.categories),
    occasions: parseOccasions(r.categories),
    featured: r.featured === 1,
    instagramUrl: r.instagram_url,
    stock: stock.get(r.id) ?? emptyStock(),
    photos: photos.get(r.id) ?? [],
    isNew: r.new_until !== null && r.new_until > now,
    measures: parseMeasures(r.measures),
    fit: lang !== 'sq' ? r.fit_en || r.fit_sq : r.fit_sq || r.fit_en,
  }));
}

/** What a visitor can buy: published, priced, photographed. Sold-out dresses stay listed, after the rest. */
const VISIBLE = `status = 'published' AND price IS NOT NULL AND EXISTS (SELECT 1 FROM product_images i WHERE i.product_id = products.id)`;

export async function listVisible(db: D1Database, lang: Lang): Promise<Product[]> {
  const [p, s, i] = await db.batch([
    db.prepare(`SELECT * FROM products WHERE ${VISIBLE} ORDER BY sort ASC, created_at DESC`),
    db.prepare(`SELECT ps.* FROM product_sizes ps JOIN products ON products.id = ps.product_id WHERE ${VISIBLE}`),
    db.prepare(`SELECT pi.* FROM product_images pi JOIN products ON products.id = pi.product_id WHERE ${VISIBLE} ORDER BY pi.sort ASC`),
  ]);
  const all = assemble((p?.results ?? []) as unknown as ProductRow[], (s?.results ?? []) as unknown as SizeRow[], (i?.results ?? []) as unknown as ImageRow[], lang);
  const available = all.filter((x) => SIZES.some((k) => x.stock[k] > 0));
  const soldOut = all.filter((x) => !SIZES.some((k) => x.stock[k] > 0));
  return [...available, ...soldOut];
}

/** Dresses a visitor can see that are still new: the header shows the "new" filter only when there are some. */
export async function countNew(db: D1Database): Promise<number> {
  const row = await db.prepare(`SELECT COUNT(*) AS n FROM products WHERE ${VISIBLE} AND new_until > ?`).bind(new Date().toISOString()).first<{ n: number }>();
  return row?.n ?? 0;
}

export async function getVisibleBySlug(db: D1Database, slug: string, lang: Lang): Promise<Product | null> {
  const row = await db.prepare(`SELECT * FROM products WHERE slug = ? AND ${VISIBLE}`).bind(slug).first<ProductRow>();
  if (!row) return null;
  const [s, i] = await db.batch([
    db.prepare('SELECT * FROM product_sizes WHERE product_id = ?').bind(row.id),
    db.prepare('SELECT * FROM product_images WHERE product_id = ? ORDER BY sort ASC').bind(row.id),
  ]);
  return assemble([row], (s?.results ?? []) as unknown as SizeRow[], (i?.results ?? []) as unknown as ImageRow[], lang)[0] ?? null;
}

/* ------------------------------------------------------------------ admin ------------------------------------------------------------------ */

function toAdmin(r: ProductRow, sizes: SizeRow[], images: ImageRow[]): AdminProduct {
  const stock = emptyStock();
  for (const s of sizes) if (s.product_id === r.id && isSize(s.size)) stock[s.size] = s.stock;
  return {
    id: r.id,
    slug: r.slug,
    nameSq: r.name_sq,
    nameEn: r.name_en,
    descriptionSq: r.description_sq,
    descriptionEn: r.description_en,
    price: r.price,
    comparePrice: r.compare_price,
    color: r.color,
    categories: parseTags(r.categories),
    status: r.status,
    featured: r.featured === 1,
    instagramUrl: r.instagram_url,
    sort: r.sort,
    stock,
    photos: images
      .filter((im) => im.product_id === r.id)
      .map((im) => ({ ...toPhoto(im, 'sq'), altSq: im.alt_sq, altEn: im.alt_en })),
    updatedAt: r.updated_at,
    newUntil: r.new_until,
    measures: parseMeasures(r.measures),
    fitSq: r.fit_sq,
    fitEn: r.fit_en,
  };
}

export async function adminList(db: D1Database): Promise<AdminProduct[]> {
  const [p, s, i] = await db.batch([
    db.prepare('SELECT * FROM products ORDER BY sort ASC, created_at DESC'),
    db.prepare('SELECT * FROM product_sizes'),
    db.prepare('SELECT * FROM product_images ORDER BY sort ASC'),
  ]);
  const sizes = (s?.results ?? []) as unknown as SizeRow[];
  const images = (i?.results ?? []) as unknown as ImageRow[];
  return ((p?.results ?? []) as unknown as ProductRow[]).map((r) => toAdmin(r, sizes, images));
}

export async function adminGet(db: D1Database, id: string): Promise<AdminProduct | null> {
  const [p, s, i] = await db.batch([
    db.prepare('SELECT * FROM products WHERE id = ?').bind(id),
    db.prepare('SELECT * FROM product_sizes WHERE product_id = ?').bind(id),
    db.prepare('SELECT * FROM product_images WHERE product_id = ? ORDER BY sort ASC').bind(id),
  ]);
  const row = (p?.results ?? [])[0] as unknown as ProductRow | undefined;
  return row ? toAdmin(row, (s?.results ?? []) as unknown as SizeRow[], (i?.results ?? []) as unknown as ImageRow[]) : null;
}

export async function uniqueSlug(db: D1Database, base: string, exceptId?: string): Promise<string> {
  const root = base || 'fustan';
  for (let n = 1; n < 500; n++) {
    const candidate = n === 1 ? root : `${root}-${n}`;
    const hit = await db.prepare('SELECT id FROM products WHERE slug = ?').bind(candidate).first<{ id: string }>();
    if (!hit || hit.id === exceptId) return candidate;
  }
  return `${root}-${crypto.randomUUID().slice(0, 8)}`;
}

/* ----------------------------------------------------------------- settings ----------------------------------------------------------------- */

export async function getSetting(db: D1Database, key: string): Promise<string | null> {
  const row = await db.prepare('SELECT value FROM settings WHERE key = ?').bind(key).first<{ value: string }>();
  return row?.value ?? null;
}

export async function setSetting(db: D1Database, key: string, value: string): Promise<void> {
  await db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value').bind(key, value).run();
}

/**
 * What the admin fills in for the privacy and terms pages: the business details, the returns
 * policy, and the day they last changed (the later of that day and the text's own date).
 */
export async function getLegalSettings(db: D1Database): Promise<{ business: Business; returns: Returns; updated: string }> {
  const rows = await db
    .prepare(`SELECT key, value FROM settings WHERE key IN ('business', 'returns', 'legal_updated', 'shop_phone')`)
    .all<{ key: string; value: string }>();
  const get = (k: string) => (rows.results ?? []).find((r) => r.key === k)?.value;
  const parse = <T extends object>(v: string | undefined, empty: T): T => {
    try {
      const o = JSON.parse(v ?? 'null') as Partial<T> | null;
      return { ...empty, ...(o && typeof o === 'object' ? o : {}) };
    } catch {
      return { ...empty };
    }
  };
  const business = parse(get('business'), EMPTY_BUSINESS);
  // the shop phone saved before the business details existed
  if (!business.phone && get('shop_phone')) business.phone = get('shop_phone') ?? '';
  const updated = [UPDATED, get('legal_updated') ?? ''].sort().at(-1) ?? UPDATED;
  return { business, returns: parse(get('returns'), EMPTY_RETURNS), updated };
}

export async function getZones(db: D1Database): Promise<Zone[]> {
  let parsed: unknown = [];
  try {
    parsed = JSON.parse((await getSetting(db, 'delivery_zones')) ?? '[]');
  } catch {
    /* fall through to defaults */
  }
  const list = Array.isArray(parsed) ? (parsed as Partial<Zone>[]) : [];
  return ZONES.map((id) => {
    const z = list.find((x) => x.id === id);
    const fee = typeof z?.fee === 'number' && Number.isInteger(z.fee) && z.fee >= 0 ? z.fee : null;
    return { id, fee, enabled: z?.enabled !== false };
  });
}

/* ---------------------------------------------------------------- rate limit ---------------------------------------------------------------- */

/** Fixed window counter. Returns false once `limit` hits have been recorded inside `windowSec`. */
export async function hit(db: D1Database, key: string, limit: number, windowSec: number): Promise<boolean> {
  const now = Math.floor(Date.now() / 1000);
  const row = await db
    .prepare(
      `INSERT INTO rate_limits (key, count, window_start) VALUES (?1, 1, ?2)
       ON CONFLICT (key) DO UPDATE SET
         count = CASE WHEN rate_limits.window_start <= ?2 - ?3 THEN 1 ELSE rate_limits.count + 1 END,
         window_start = CASE WHEN rate_limits.window_start <= ?2 - ?3 THEN ?2 ELSE rate_limits.window_start END
       RETURNING count`,
    )
    .bind(key, now, windowSec)
    .first<{ count: number }>();
  return (row?.count ?? 1) <= limit;
}

export async function clearHits(db: D1Database, key: string): Promise<void> {
  await db.prepare('DELETE FROM rate_limits WHERE key = ?').bind(key).run();
}

export type { Size };
