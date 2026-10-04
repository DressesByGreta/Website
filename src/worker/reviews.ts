/**
 * What customers said (migrations/0007): a quote in their own words and language, a first name and
 * a city, optionally their photograph in the dress, added by Greta with the customer's permission.
 * Shown on the dress's page and, the latest ones, on the home page. A photograph is stored like a
 * dress photograph under r/<dress>/<review>.
 */
import type { Photo } from '../shared/catalog';
import type { Lang } from '../shared/copy';

export interface Review {
  id: string;
  productId: string;
  name: string;
  city: string;
  text: string;
  lang: Lang;
  photo: Photo | null;
  createdAt: string;
}

interface ReviewRow {
  id: string;
  product_id: string;
  name: string;
  city: string;
  text: string;
  lang: Lang;
  photo: string;
  created_at: string;
}

function toReview(r: ReviewRow): Review {
  let photo: Photo | null = null;
  try {
    const p = JSON.parse(r.photo || 'null') as Omit<Photo, 'alt'> | null;
    if (p && typeof p.key === 'string' && Array.isArray(p.widths)) photo = { ...p, alt: '' };
  } catch {
    photo = null;
  }
  return { id: r.id, productId: r.product_id, name: r.name, city: r.city, text: r.text, lang: r.lang, photo, createdAt: r.created_at };
}

export async function reviewsFor(db: D1Database, productId: string): Promise<Review[]> {
  const rows = await db.prepare('SELECT * FROM reviews WHERE product_id = ? ORDER BY created_at DESC LIMIT 20').bind(productId).all<ReviewRow>();
  return (rows.results ?? []).map(toReview);
}

/** The latest reviews of dresses on sale, with the dress's slug and name, for the home page. */
export async function latestReviews(db: D1Database, limit = 6): Promise<(Review & { slug: string; dress: string })[]> {
  const rows = await db
    .prepare(
      `SELECT r.*, p.slug AS slug, p.name_sq AS dress FROM reviews r JOIN products p ON p.id = r.product_id
       WHERE p.status = 'published' ORDER BY r.created_at DESC LIMIT ?`,
    )
    .bind(limit)
    .all<ReviewRow & { slug: string; dress: string }>();
  return (rows.results ?? []).map((r) => ({ ...toReview(r), slug: r.slug, dress: r.dress }));
}

export async function reviewRow(db: D1Database, id: string): Promise<ReviewRow | null> {
  return db.prepare('SELECT * FROM reviews WHERE id = ?').bind(id).first<ReviewRow>();
}
