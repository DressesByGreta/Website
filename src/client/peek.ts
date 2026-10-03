/**
 * The navigation shows the dresses. Each shop link (all, a category, an occasion) stands for its
 * first dress in stock: on a computer the header's links print that dress's photograph just below
 * the link as the pointer rests on them; the menu drawer shows it beside or before its links.
 */
import { CATEGORIES, OCCASIONS, forOccasion, photoAt, photoSrcset } from '../shared/catalog';
import type { Lang } from '../shared/copy';
import { catalogue, type CatalogueItem } from './bag';
import { printPlate, reducedMotion } from './motion';

let pics: Promise<Map<string, CatalogueItem>> | null = null;

/** The dress behind each link key: 'all', 'cat:<category>' (with 'cat:new'), 'occ:<occasion>'. */
export function linkPictures(lang: Lang): Promise<Map<string, CatalogueItem>> {
  pics ??= catalogue(lang)
    .then((all) => {
      const list = all.filter((p) => p.cover);
      // each link prefers a dress in stock that no earlier link shows, so the menu reads as a
      // contact sheet rather than one photograph repeated
      const used = new Set<string>();
      const inStock = (p: CatalogueItem) => Object.values(p.stock).some((n) => n > 0);
      const first = (xs: CatalogueItem[]) =>
        xs.find((p) => inStock(p) && !used.has(p.id)) ?? xs.find((p) => !used.has(p.id)) ?? xs.find(inStock) ?? xs[0];
      const map = new Map<string, CatalogueItem>();
      const put = (key: string, p?: CatalogueItem) => {
        if (!p) return;
        used.add(p.id);
        map.set(key, p);
      };
      put('all', first(list));
      put('cat:new', first(list.filter((p) => p.isNew)));
      for (const c of CATEGORIES) put(`cat:${c}`, first(list.filter((p) => p.categories.includes(c))));
      for (const o of OCCASIONS) put(`occ:${o}`, first(forOccasion(list, o)));
      return map;
    })
    .catch(() => {
      pics = null;
      return new Map();
    });
  return pics;
}

const wide = () => window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 1024px)').matches;

/** Puts a dress's photograph into a plate and prints it (at once with reduced motion). */
export function showIn(plate: HTMLElement, p: CatalogueItem, sizes: string): void {
  const img = plate.querySelector<HTMLImageElement>('img');
  if (!img || !p.cover) return;
  img.srcset = photoSrcset(p.cover);
  img.sizes = sizes;
  img.src = photoAt(p.cover, 960);
  if (!reducedMotion()) printPlate(plate, 0, 0.55);
}

/** The header's peek: one plate under the header that follows the link the pointer rests on. */
export function headerPeek(lang: Lang): void {
  const nav = document.querySelector<HTMLElement>('.nav__list');
  if (!nav) return;
  const peek = document.createElement('div');
  peek.className = 'peek';
  peek.setAttribute('aria-hidden', 'true');
  peek.innerHTML = '<span class="plate peek__plate"><span class="plate__inner"><img class="plate__img" alt="" decoding="async" /><span class="plate__scan"></span></span></span><span class="peek__name"></span>';
  document.body.appendChild(peek);
  const plate = peek.querySelector<HTMLElement>('.peek__plate')!;
  const name = peek.querySelector<HTMLElement>('.peek__name')!;
  let current = '';
  let timer = 0;
  const hide = () => {
    window.clearTimeout(timer);
    current = '';
    peek.classList.remove('is-on');
  };
  const show = (a: HTMLAnchorElement) => {
    window.clearTimeout(timer);
    // a short rest first, so a pointer crossing the row does not flash every link
    timer = window.setTimeout(async () => {
      const key = a.dataset.pic!;
      const p = (await linkPictures(lang)).get(key);
      if (!p?.cover || !a.matches(':hover, :focus-visible')) return;
      const r = a.getBoundingClientRect();
      peek.style.left = `${Math.max(16, Math.min(r.left, window.innerWidth - peek.offsetWidth - 16))}px`;
      if (key !== current) {
        current = key;
        name.textContent = p.name;
        showIn(plate, p, '220px');
      }
      peek.classList.add('is-on');
    }, 140);
  };
  nav.addEventListener('pointerover', (e) => {
    const a = (e.target as Element).closest<HTMLAnchorElement>('a[data-pic]');
    if (a && wide()) show(a);
  });
  nav.addEventListener('pointerleave', hide);
  nav.addEventListener('focusin', (e) => {
    const a = (e.target as Element).closest<HTMLAnchorElement>('a[data-pic]');
    if (a && wide() && a.matches(':focus-visible')) show(a);
  });
  nav.addEventListener('focusout', hide);
  nav.addEventListener('click', hide);
  window.addEventListener('scroll', hide, { passive: true });
  document.addEventListener('greta:navigated', hide);
}
