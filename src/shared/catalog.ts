/** Catalogue vocabulary shared by the Worker, the storefront and the admin. */
import type { Lang } from './copy';

export const SIZES = ['34', '36', '38', '40', '42'] as const;
export type Size = (typeof SIZES)[number];
export const SIZE_LETTER: Record<Size, string> = { '34': 'XS', '36': 'S', '38': 'M', '40': 'L', '42': 'XL' };
export const isSize = (v: unknown): v is Size => typeof v === 'string' && (SIZES as readonly string[]).includes(v);

export const CATEGORIES = ['gowns', 'mini', 'black', 'tv'] as const;
export type Category = (typeof CATEGORIES)[number];
export const isCategory = (v: unknown): v is Category => typeof v === 'string' && (CATEGORIES as readonly string[]).includes(v);

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
  featured: boolean;
  instagramUrl: string;
  stock: Stock;
  photos: Photo[];
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
