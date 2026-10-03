/**
 * What a visitor tells the shop about herself, kept on her own phone only and never sent anywhere:
 * her measurements or size ("find my size"), the date of her event ("shop by date") and the dresses
 * she saved. Pages read it to mark her size, the dresses free on her date and the ones she saved.
 */
import { isSize, MEASURES, recommendSize, type Body, type Size } from '../shared/catalog';

export interface Me {
  body: Body;
  /** her size: chosen directly, or worked out from her measurements on the chart */
  size: Size | null;
  /** YYYY-MM-DD */
  date: string | null;
  /** slugs of the dresses she saved, newest first */
  saved: string[];
}

const KEY = 'greta-me-v1';
const MAX_SAVED = 40;
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const listeners = new Set<(me: Me) => void>();

function load(): Me {
  const empty: Me = { body: {}, size: null, date: null, saved: [] };
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Partial<Me> | null;
    if (!raw || typeof raw !== 'object') return empty;
    const body: Body = {};
    for (const m of MEASURES) {
      const v = Number(raw.body?.[m]);
      if (Number.isFinite(v) && v >= 40 && v <= 200) body[m] = Math.round(v);
    }
    return {
      body,
      size: isSize(raw.size) ? raw.size : null,
      date: typeof raw.date === 'string' && DAY_RE.test(raw.date) ? raw.date : null,
      saved: Array.isArray(raw.saved) ? raw.saved.filter((s): s is string => typeof s === 'string' && /^[a-z0-9-]{1,80}$/.test(s)).slice(0, MAX_SAVED) : [],
    };
  } catch {
    return empty;
  }
}

let me = load();

function save(next: Me): void {
  me = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(me));
  } catch {
    /* private mode or blocked storage: it holds for this visit */
  }
  listeners.forEach((fn) => fn(get()));
}

export const get = (): Me => ({ ...me, body: { ...me.body }, saved: [...me.saved] });

export function subscribe(fn: (me: Me) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/**
 * Saves what the "size and date" drawer holds, in one go: measurements (her size then follows from
 * them on the chart) or a size chosen directly, and the date.
 */
export function setAll(next: { body: Body; size: Size | null; date: string | null }): void {
  const clean: Body = {};
  for (const m of MEASURES) if (typeof next.body[m] === 'number' && next.body[m]! >= 40 && next.body[m]! <= 200) clean[m] = Math.round(next.body[m]!);
  const size = Object.keys(clean).length ? (recommendSize(clean)?.size ?? null) : next.size;
  save({ ...me, body: clean, size, date: next.date && DAY_RE.test(next.date) ? next.date : null });
}

export const isSaved = (slug: string): boolean => me.saved.includes(slug);

export function toggleSaved(slug: string): boolean {
  const on = !me.saved.includes(slug);
  save({ ...me, saved: on ? [slug, ...me.saved].slice(0, MAX_SAVED) : me.saved.filter((s) => s !== slug) });
  return on;
}

/** Her size for one dress: from the dress's own measurements when there are any, else her size. */
export function sizeFor(measures?: Parameters<typeof recommendSize>[1]): { size: Size | null; fromDress: boolean } | null {
  if (Object.keys(me.body).length) return recommendSize(me.body, measures);
  return me.size ? { size: me.size, fromDress: false } : null;
}

