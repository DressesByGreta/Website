/**
 * Lookbooks (migrations/0005): editorial pages made of photographs ("frames"), each with numbered
 * marks on the dresses it shows, so a visitor can go from the story to the dress. Greta makes them
 * in the admin; the shop shows the published ones that have at least one frame. A mark whose dress
 * is no longer on sale is left out of the public page (it stays in the admin).
 */
import { photoAt, type Photo, type Product } from '../shared/catalog';
import type { Lang } from '../shared/copy';
import { listVisible } from './db';

export interface Spot {
  /** fractions of the photograph, from its left and top edges */
  x: number;
  y: number;
  product: string;
}

interface LookbookRow {
  id: string;
  slug: string;
  title_sq: string;
  title_en: string;
  intro_sq: string;
  intro_en: string;
  status: 'draft' | 'published';
  sort: number;
  created_at: string;
  updated_at: string;
}

interface FrameRow {
  id: string;
  lookbook_id: string;
  sort: number;
  key: string;
  ext: 'webp' | 'jpg';
  widths: string;
  w: number;
  h: number;
  lqip: string;
  caption_sq: string;
  caption_en: string;
  spots: string;
}

export interface AdminFrame {
  id: string;
  photo: Photo;
  captionSq: string;
  captionEn: string;
  spots: Spot[];
}

export interface AdminLookbook {
  id: string;
  slug: string;
  titleSq: string;
  titleEn: string;
  introSq: string;
  introEn: string;
  status: 'draft' | 'published';
  updatedAt: string;
  frames: AdminFrame[];
}

/** A frame as the shop shows it: its marks joined to the dresses (in the page's language). */
export interface PublicFrame {
  id: string;
  photo: Photo;
  caption: string;
  spots: (Spot & { dress: Product })[];
}

export interface PublicLookbook {
  slug: string;
  title: string;
  intro: string;
  updated: string;
  frames: PublicFrame[];
}

export const MAX_SPOTS = 12;
export const MAX_FRAMES = 30;

export function parseSpots(raw: unknown): Spot[] {
  let v = raw;
  if (typeof v === 'string') {
    try {
      v = JSON.parse(v);
    } catch {
      v = [];
    }
  }
  if (!Array.isArray(v)) return [];
  const out: Spot[] = [];
  for (const s of v) {
    const o = s && typeof s === 'object' ? (s as Record<string, unknown>) : {};
    const x = Number(o.x);
    const y = Number(o.y);
    const product = typeof o.product === 'string' ? o.product : '';
    if (Number.isFinite(x) && Number.isFinite(y) && x >= 0 && x <= 1 && y >= 0 && y <= 1 && /^[a-z0-9-]{6,40}$/.test(product)) {
      out.push({ x: Math.round(x * 1000) / 1000, y: Math.round(y * 1000) / 1000, product });
    }
    if (out.length >= MAX_SPOTS) break;
  }
  return out;
}

const framePhoto = (f: FrameRow, alt: string): Photo => ({
  id: f.id,
  key: f.key,
  ext: f.ext,
  widths: JSON.parse(f.widths) as number[],
  w: f.w,
  h: f.h,
  lqip: f.lqip,
  alt,
});

const toAdminFrame = (f: FrameRow): AdminFrame => ({
  id: f.id,
  photo: framePhoto(f, ''),
  captionSq: f.caption_sq,
  captionEn: f.caption_en,
  spots: parseSpots(f.spots),
});

/* ----------------------------------------------------------------- admin ------------------------------------------------------------------ */

export async function adminLookbooks(db: D1Database): Promise<(Omit<AdminLookbook, 'frames'> & { frames: number; cover: Photo | null })[]> {
  const [l, f] = await db.batch([
    db.prepare('SELECT * FROM lookbooks ORDER BY sort ASC, created_at DESC'),
    db.prepare('SELECT * FROM lookbook_frames ORDER BY sort ASC'),
  ]);
  const frames = (f?.results ?? []) as unknown as FrameRow[];
  return ((l?.results ?? []) as unknown as LookbookRow[]).map((r) => {
    const own = frames.filter((x) => x.lookbook_id === r.id);
    return {
      id: r.id,
      slug: r.slug,
      titleSq: r.title_sq,
      titleEn: r.title_en,
      introSq: r.intro_sq,
      introEn: r.intro_en,
      status: r.status,
      updatedAt: r.updated_at,
      frames: own.length,
      cover: own[0] ? framePhoto(own[0], '') : null,
    };
  });
}

export async function adminLookbook(db: D1Database, id: string): Promise<AdminLookbook | null> {
  const [l, f] = await db.batch([
    db.prepare('SELECT * FROM lookbooks WHERE id = ?').bind(id),
    db.prepare('SELECT * FROM lookbook_frames WHERE lookbook_id = ? ORDER BY sort ASC').bind(id),
  ]);
  const r = (l?.results ?? [])[0] as unknown as LookbookRow | undefined;
  if (!r) return null;
  return {
    id: r.id,
    slug: r.slug,
    titleSq: r.title_sq,
    titleEn: r.title_en,
    introSq: r.intro_sq,
    introEn: r.intro_en,
    status: r.status,
    updatedAt: r.updated_at,
    frames: ((f?.results ?? []) as unknown as FrameRow[]).map(toAdminFrame),
  };
}

export async function lookbookSlugFree(db: D1Database, slug: string, exceptId?: string): Promise<boolean> {
  const row = await db.prepare('SELECT id FROM lookbooks WHERE slug = ?').bind(slug).first<{ id: string }>();
  return !row || row.id === exceptId;
}

export async function frameKeys(db: D1Database, lookbookId: string): Promise<FrameRow[]> {
  return ((await db.prepare('SELECT * FROM lookbook_frames WHERE lookbook_id = ?').bind(lookbookId).all<FrameRow>()).results ?? []) as FrameRow[];
}

export async function frameRow(db: D1Database, frameId: string): Promise<FrameRow | null> {
  return db.prepare('SELECT * FROM lookbook_frames WHERE id = ?').bind(frameId).first<FrameRow>();
}

/* ------------------------------------------------------------------ shop ------------------------------------------------------------------ */

const PUBLISHED = `status = 'published' AND EXISTS (SELECT 1 FROM lookbook_frames f WHERE f.lookbook_id = lookbooks.id)`;

export async function countLookbooks(db: D1Database): Promise<number> {
  return (await db.prepare(`SELECT COUNT(*) AS n FROM lookbooks WHERE ${PUBLISHED}`).first<{ n: number }>())?.n ?? 0;
}

/** The published lookbooks for the index page and the sitemap: title, intro, cover, frame count. */
export async function listLookbooks(db: D1Database, lang: Lang): Promise<{ slug: string; title: string; intro: string; updated: string; cover: Photo; frames: number; photos: Photo[] }[]> {
  const [l, f] = await db.batch([
    db.prepare(`SELECT * FROM lookbooks WHERE ${PUBLISHED} ORDER BY sort ASC, created_at DESC`),
    db.prepare(`SELECT * FROM lookbook_frames WHERE lookbook_id IN (SELECT id FROM lookbooks WHERE ${PUBLISHED}) ORDER BY sort ASC`),
  ]);
  const frames = (f?.results ?? []) as unknown as FrameRow[];
  return ((l?.results ?? []) as unknown as LookbookRow[]).map((r) => {
    const title = lang !== 'sq' ? r.title_en || r.title_sq : r.title_sq;
    const own = frames.filter((x) => x.lookbook_id === r.id).map((x) => framePhoto(x, title));
    return { slug: r.slug, title, intro: lang !== 'sq' ? r.intro_en || r.intro_sq : r.intro_sq, updated: r.updated_at.slice(0, 10), cover: own[0]!, frames: own.length, photos: own };
  });
}

/** One published lookbook with its frames, each mark joined to its dress (marks of dresses no
 *  longer on sale are left out). */
export async function getLookbook(db: D1Database, slug: string, lang: Lang): Promise<PublicLookbook | null> {
  const r = await db.prepare(`SELECT * FROM lookbooks WHERE slug = ? AND ${PUBLISHED}`).bind(slug).first<LookbookRow>();
  if (!r) return null;
  const [frames, dresses] = await Promise.all([
    db.prepare('SELECT * FROM lookbook_frames WHERE lookbook_id = ? ORDER BY sort ASC').bind(r.id).all<FrameRow>(),
    listVisible(db, lang),
  ]);
  const byId = new Map(dresses.map((d) => [d.id, d]));
  const title = lang !== 'sq' ? r.title_en || r.title_sq : r.title_sq;
  return {
    slug: r.slug,
    title,
    intro: lang !== 'sq' ? r.intro_en || r.intro_sq : r.intro_sq,
    updated: r.updated_at.slice(0, 10),
    frames: (frames.results ?? []).map((f, i) => {
      const caption = lang !== 'sq' ? f.caption_en || f.caption_sq : f.caption_sq;
      const spots = parseSpots(f.spots)
        .map((s) => ({ ...s, dress: byId.get(s.product)! }))
        .filter((s) => s.dress);
      return { id: f.id, caption, photo: framePhoto(f, caption || `${title}, ${i + 1}`), spots };
    }),
  };
}

/** The first photograph of a lookbook, for link previews. */
export const lookbookImage = (l: PublicLookbook): string | undefined => (l.frames[0] ? photoAt(l.frames[0].photo, 1600) : undefined);
