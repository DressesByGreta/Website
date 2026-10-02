/**
 * The bag. Lines live in localStorage on this device only; each carries a snapshot of the dress
 * (name, price, cover, stock) so the drawer renders instantly, and `refresh` brings the snapshot
 * up to date from the shop before anyone pays. The server recomputes every price at checkout anyway.
 */
import { isSize, type Photo, type Size, type Stock } from '../shared/catalog';
import type { Lang } from '../shared/copy';

export interface Snap {
  slug: string;
  name: string;
  price: number | null;
  cover: Photo | null;
  stock: Stock;
}

export interface Line {
  id: string;
  size: Size;
  qty: number;
  snap: Snap;
  /** Set by refresh when the dress or size is no longer on sale. */
  gone?: boolean;
}

type Listener = (lines: Line[]) => void;
const KEY = 'greta-bag-v1';
const MAX_QTY = 5;
const listeners = new Set<Listener>();
let lines: Line[] = load();

function load(): Line[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '[]') as unknown;
    if (!Array.isArray(raw)) return [];
    return raw.filter((l): l is Line => !!l && typeof l.id === 'string' && isSize(l.size) && Number.isInteger(l.qty) && l.qty > 0 && !!l.snap);
  } catch {
    return [];
  }
}

function save(): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(lines));
  } catch {
    /* private mode or full storage: the bag still works for this page view */
  }
  const snapshot = lines.map((l) => ({ ...l }));
  listeners.forEach((fn) => fn(snapshot));
}

const limit = (l: Pick<Line, 'size' | 'snap'>): number => Math.min(MAX_QTY, Math.max(0, l.snap.stock[l.size] ?? 0));

export const bag = {
  lines: (): Line[] => lines.map((l) => ({ ...l })),
  count: (): number => lines.reduce((n, l) => n + l.qty, 0),
  subtotal: (): number => lines.reduce((n, l) => n + (l.gone ? 0 : (l.snap.price ?? 0) * l.qty), 0),
  isEmpty: (): boolean => lines.length === 0,

  /** Adds one; returns false when the stock for that size is already all in the bag. */
  add(id: string, size: Size, snap: Snap): boolean {
    const hit = lines.find((l) => l.id === id && l.size === size);
    const cap = limit({ size, snap });
    if (hit) {
      hit.snap = snap;
      if (hit.qty >= cap) return false;
      hit.qty += 1;
    } else {
      if (cap < 1) return false;
      lines.unshift({ id, size, qty: 1, snap });
    }
    save();
    return true;
  },

  setQty(id: string, size: Size, qty: number): void {
    const hit = lines.find((l) => l.id === id && l.size === size);
    if (!hit) return;
    hit.qty = Math.max(1, Math.min(limit(hit) || 1, qty));
    save();
  },

  remove(id: string, size: Size): void {
    lines = lines.filter((l) => !(l.id === id && l.size === size));
    save();
  },

  clear(): void {
    lines = [];
    save();
  },

  subscribe(fn: Listener): () => void {
    listeners.add(fn);
    fn(bag.lines());
    return () => listeners.delete(fn);
  },

  /** Re-reads prices, names and stock from the shop; marks lines that can no longer be bought. */
  async refresh(lang: Lang): Promise<void> {
    if (!lines.length) return;
    try {
      const list = await catalogue(lang);
      const byId = new Map(list.map((p) => [p.id, p]));
      for (const l of lines) {
        const p = byId.get(l.id);
        if (!p || p.price === null) {
          l.gone = true;
          continue;
        }
        l.snap = { slug: p.slug, name: p.name, price: p.price, cover: p.cover, stock: p.stock };
        const cap = limit(l);
        l.gone = cap < 1;
        if (!l.gone && l.qty > cap) l.qty = cap;
      }
      save();
    } catch {
      /* offline: keep the snapshot; checkout re-validates on the server */
    }
  },
};

export interface CatalogueItem {
  id: string;
  slug: string;
  name: string;
  price: number | null;
  color: string;
  categories: string[];
  stock: Stock;
  cover: Photo | null;
  isNew: boolean;
}

const cache = new Map<Lang, { at: number; data: Promise<CatalogueItem[]> }>();

/** The published catalogue, shared by the bag refresh and the search drawer (kept 30 seconds). */
export function catalogue(lang: Lang): Promise<CatalogueItem[]> {
  const hit = cache.get(lang);
  if (hit && Date.now() - hit.at < 30_000) return hit.data;
  const data = fetch(`/api/products?lang=${lang}`, { credentials: 'same-origin' }).then((r) => {
    if (!r.ok) throw new Error(String(r.status));
    return r.json() as Promise<CatalogueItem[]>;
  });
  data.catch(() => cache.delete(lang));
  cache.set(lang, { at: Date.now(), data });
  return data;
}
