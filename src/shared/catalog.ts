/** Catalogue vocabulary shared by the Worker, the storefront and the admin. */
import type { Lang } from './copy';

export const SIZES = ['34', '36', '38', '40', '42'] as const;
export type Size = (typeof SIZES)[number];
export const SIZE_LETTER: Record<Size, string> = { '34': 'XS', '36': 'S', '38': 'M', '40': 'L', '42': 'XL' };
export const isSize = (v: unknown): v is Size => typeof v === 'string' && (SIZES as readonly string[]).includes(v);

export const CATEGORIES = ['gowns', 'mini', 'black', 'tv'] as const;
export type Category = (typeof CATEGORIES)[number];
export const isCategory = (v: unknown): v is Category => typeof v === 'string' && (CATEGORIES as readonly string[]).includes(v);

/**
 * Occasions: what a dress is for, in the words people type into Google (fustane mbrëmjeje, mature,
 * për dasma, koktej, me qera). Each has its own page; Greta ticks them per dress in the admin, next to
 * the categories, and they are stored in the same list. Until she ticks one, its page shows the
 * dresses of its fallback categories (an empty list there means every dress).
 */
export const OCCASIONS = ['evening', 'prom', 'wedding', 'cocktail', 'rental'] as const;
export type Occasion = (typeof OCCASIONS)[number];
export const isOccasion = (v: unknown): v is Occasion => typeof v === 'string' && (OCCASIONS as readonly string[]).includes(v);
export const OCCASION_PATH: Record<Occasion, string> = {
  evening: '/fustane-mbremjeje',
  prom: '/fustane-mature',
  wedding: '/fustane-per-dasma',
  cocktail: '/fustane-koktej',
  rental: '/fustane-me-qera',
};
const OCCASION_FALLBACK: Record<Occasion, Category[]> = { evening: ['gowns'], prom: ['gowns', 'mini'], wedding: ['gowns', 'mini'], cocktail: ['mini'], rental: [] };
/** A category or an occasion: what the admin stores in a dress's list. */
export type Tag = Category | Occasion;
export const isTag = (v: unknown): v is Tag => isCategory(v) || isOccasion(v);

/** The dresses an occasion page shows: those Greta ticked, or its fallback while she has ticked none. */
export function forOccasion(all: Product[], o: Occasion): Product[] {
  const ticked = all.filter((p) => p.occasions.includes(o));
  if (ticked.length) return ticked;
  const cats = OCCASION_FALLBACK[o];
  return cats.length ? all.filter((p) => p.categories.some((c) => cats.includes(c))) : all;
}

/** A dress counts as new for two weeks from its first publication; the admin can restart or end them. */
export const NEW_DAYS = 14;
/** The shop's filters: the categories Greta ticks, and the new dresses, which the shop works out itself. */
export type ShopFilter = Category | 'new';
export const isShopFilter = (v: unknown): v is ShopFilter => v === 'new' || isCategory(v);

export const ZONES = ['tirana', 'albania', 'kosovo'] as const;
export type ZoneId = (typeof ZONES)[number];
export interface Zone {
  id: ZoneId;
  /** Lek; null means the fee is confirmed by phone. */
  fee: number | null;
  enabled: boolean;
}

/** Widths the admin produces for every photograph; the largest is capped by the original. 2400 is
 *  for the original photographs: big and retina screens, and the full-screen viewer. */
export const PHOTO_WIDTHS = [480, 960, 1600, 2400] as const;
/** Narrower photographs look soft on large screens (the Instagram copies are about 1160 px wide):
 *  the admin marks them and asks for the original. */
export const PHOTO_SHARP_WIDTH = 1600;
/** Largest single file the Worker stores (the admin re-encodes smaller if a width comes out bigger). */
export const PHOTO_MAX_BYTES = 4 * 1024 * 1024;

export interface Photo {
  id: string;
  key: string;
  ext: 'webp' | 'jpg';
  widths: number[];
  w: number;
  h: number;
  lqip: string;
  alt: string;
}

export type Stock = Record<Size, number>;

/** How a dress fits, in centimetres, as Greta measured it: the length, and bust, waist and hips per size.
 *  Any of them may be missing; the dress page shows only what is there. */
export const MEASURES = ['bust', 'waist', 'hips'] as const;
export type Measure = (typeof MEASURES)[number];
export interface Measures {
  length?: number;
  sizes: Partial<Record<Size, Partial<Record<Measure, number>>>>;
}
const cm = (v: unknown): number | undefined => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 10 && n <= 250 ? Math.round(n) : undefined;
};
/** Reads (and cleans) stored or posted measurements: unknown sizes, keys and odd numbers are dropped. */
export function parseMeasures(raw: unknown): Measures {
  let v = raw;
  if (typeof v === 'string') {
    try {
      v = JSON.parse(v);
    } catch {
      v = null;
    }
  }
  const o = v && typeof v === 'object' ? (v as Record<string, unknown>) : {};
  const sizes: Measures['sizes'] = {};
  const src = o.sizes && typeof o.sizes === 'object' ? (o.sizes as Record<string, unknown>) : {};
  for (const s of SIZES) {
    const row = src[s] && typeof src[s] === 'object' ? (src[s] as Record<string, unknown>) : {};
    const clean: Partial<Record<Measure, number>> = {};
    for (const m of MEASURES) {
      const n = cm(row[m]);
      if (n !== undefined) clean[m] = n;
    }
    if (Object.keys(clean).length) sizes[s] = clean;
  }
  const length = cm(o.length);
  return length !== undefined ? { length, sizes } : { sizes };
}
export const hasMeasures = (m: Measures): boolean => m.length !== undefined || Object.keys(m.sizes).length > 0;

/** A product as the storefront sees it, already resolved to one language. */
export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number | null;
  comparePrice: number | null;
  color: string;
  categories: Category[];
  occasions: Occasion[];
  featured: boolean;
  instagramUrl: string;
  stock: Stock;
  photos: Photo[];
  /** Inside its two weeks as new (NEW_DAYS). */
  isNew: boolean;
  measures: Measures;
  /** "Fits small, take one size up": in the page's language, '' when Greta has not written one. */
  fit: string;
}

export const emptyStock = (): Stock => ({ '34': 0, '36': 0, '38': 0, '40': 0, '42': 0 });
export const inStock = (p: Pick<Product, 'stock'>, size?: Size): boolean =>
  size ? p.stock[size] > 0 : SIZES.some((s) => p.stock[s] > 0);
export const totalStock = (s: Stock): number => SIZES.reduce((n, k) => n + s[k], 0);

export const photoUrl = (p: Pick<Photo, 'key' | 'ext'>, width: number): string => `/img/${p.key}/${width}.${p.ext}`;
export const photoSrcset = (p: Photo): string => p.widths.map((w) => `${photoUrl(p, w)} ${w}w`).join(', ');
/** The variant closest to `target` without going below it (or the largest there is). */
export const photoAt = (p: Photo, target: number): string =>
  photoUrl(p, p.widths.find((w) => w >= target) ?? p.widths[p.widths.length - 1] ?? target);

/**
 * Lek amounts, identical on the server and in the browser (the Workers runtime ships no Albanian
 * number data, so Intl would disagree with the page): 21 000 Lekë, or 21,000 ALL in English.
 */
const NBSP = String.fromCharCode(160);
const group = (n: number, sep: string): string => String(Math.round(Math.abs(n))).replace(/\B(?=(\d{3})+(?!\d))/g, sep);
export const formatLek = (n: number, lang: Lang): string =>
  (n < 0 ? '-' : '') +
  (lang === 'sq' ? `${group(n, NBSP)}${NBSP}Lekë` : lang === 'fr' ? `${group(n, NBSP)}${NBSP}ALL` : `${group(n, ',')}${NBSP}ALL`);

export const pad2 = (n: number): string => String(n).padStart(2, '0');

/** Lower-case ASCII slug from a dress name; Albanian letters fold to their base form. */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/ë/gi, 'e')
    .replace(/ç/gi, 'c')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}
