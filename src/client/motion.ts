/**
 * Motion. GSAP is the only engine and gsap.ticker the only scheduler (DESIGN.md); no pin, no snap,
 * no smooth-scroll library. Every entrance starts from the visible default in CSS (--p: 1,
 * opacity 1); hidden start states are set only inside the no-preference branch, so a
 * reduced-motion visitor or a failed script still sees the complete page. Delayed from() tweens
 * take lazy: false: a start state left to render at the end of the tick was wiped when the next
 * ScrollTrigger was created in the same task, so the element showed, then blinked out on cue.
 *
 * The page turn: spreads are sticky sheets; as the next one slides up over the last, the last
 * recedes to 0.94 and 45% and the newcomer prints in under the scan bar.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });
ScrollTrigger.defaults({ invalidateOnRefresh: true });

export const reducedMotion = (): boolean => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export { gsap, ScrollTrigger };

let mm: gsap.MatchMedia | null = null;

/** Tears down the previous page's triggers and tweens and builds the new page's. */
export function pageMotion(main: HTMLElement, opts: { arrivedByFlight: boolean }): void {
  mm?.revert();
  mm = gsap.matchMedia();
  const kind = main.dataset.page ?? '';
  const nav = document.querySelector<HTMLElement>('[data-nav]');

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    const undo: Array<() => void> = [];
    if (kind === 'home') undo.push(hero(main));
    if (kind === 'home' || kind === 'shop') shop(main, opts.arrivedByFlight);
    if (kind === 'product') product(main, opts.arrivedByFlight);
    if (kind === 'confirmation') confirmation(main);
    return () => undo.forEach((f) => f());
  });

  // State, not decoration: over the hero the header is transparent; it turns solid once the
  // photograph has left. Every other page keeps it solid. On home the header's logo line waits
  // (data-dock) until the hero's logo hands it over.
  mm.add('all', () => {
    if (!nav) return;
    const overPhoto = main.dataset.navMode === 'photo';
    nav.classList.toggle('is-solid', !overPhoto);
    nav.classList.remove('is-scrolled');
    nav.toggleAttribute('data-dock', Boolean(main.querySelector('.hero-brand')));
    if (overPhoto && main.querySelector('#hero')) {
      ScrollTrigger.create({ trigger: '#hero', start: 'bottom 60px', end: 'max', toggleClass: { targets: nav, className: 'is-scrolled' } });
    }
  });

  // The router has already put the page where it belongs (the top, a #hash, or the remembered spot
  // on back/forward). Without clearing, the refresh scrolls back to where the previous page was.
  requestAnimationFrame(() => {
    ScrollTrigger.clearScrollMemory();
    ScrollTrigger.refresh();
  });
}

/** Prints a plate (0 to 1 on --p) once, after its photograph has decoded (never waits over 2.5 s). */
export function printPlate(plate: HTMLElement, delay = 0, duration = 0.9): void {
  const img = plate.querySelector<HTMLImageElement>('img');
  plate.style.setProperty('--p', '0');
  const state = { p: 0 };
  const tween = gsap.to(state, {
    p: 1,
    duration,
    delay,
    ease: 'power3.out',
    paused: true,
    onUpdate: () => plate.style.setProperty('--p', state.p.toFixed(4)),
  });
  const ready =
    !img || (img.complete && img.naturalWidth > 0)
      ? Promise.resolve()
      : new Promise<void>((r) => {
          img.addEventListener('load', () => r(), { once: true });
          img.addEventListener('error', () => r(), { once: true });
        });
  void Promise.race([ready, new Promise((r) => setTimeout(r, 2500))]).then(() => tween.play());
}

function hero(main: HTMLElement): () => void {
  gsap.from('.hero__content', { opacity: 0, y: 10, duration: 0.5, ease: 'expo.out', delay: 0.3, lazy: false });
  const plate = main.querySelector<HTMLElement>('.hero__plate');
  if (plate) printPlate(plate, 0, 1.1);
  // The photograph lags the page (it drifts down inside its frame), so the edge it uncovers is
  // always the top one, already scrolled out of sight. Drifting up showed the blurred stand-in.
  gsap.to('.hero__plate', { '--drift': '6%', ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true } });
  // The logo itself has no entrance: it is on the first paint and stays there (hiding it to
  // reveal it again blinked); its one motion is the hand-over below.
  return dock(main);
}

/**
 * The name leaves the logo for the header. While the top of the photograph scrolls away the
 * hero's logo is held on screen: the G fades and recedes, and the line of capitals travels and
 * shrinks onto the header's own copy, which then takes over as the header turns to paper. Both
 * are fixed to the screen, so the hand-over is exact and nothing has to chase the page's native
 * scroll. Scrolling back up (or the header logo on home, router.ts) runs it in reverse.
 */
function dock(main: HTMLElement): () => void {
  const nav = document.querySelector<HTMLElement>('[data-nav]');
  const target = nav?.querySelector<SVGSVGElement>('.nav__name');
  const mark = main.querySelector<HTMLElement>('.hero__mark');
  const name = main.querySelector<HTMLElement>('.hero-brand__name');
  const g = main.querySelector<HTMLElement>('.hero-brand__g');
  if (!nav || !target || !mark || !name || !g) return () => undefined;
  mark.classList.add('is-docking');

  let docked = false;
  const handOver = (on: boolean): void => {
    if (on === docked) return;
    docked = on;
    nav.classList.toggle('is-docked', on);
    mark.style.visibility = on ? 'hidden' : '';
  };
  // Where the name has to go, measured without the travel applied.
  const geo = { dx: 0, dy: 0, s: 1 };
  const measure = (): void => {
    const keep = name.style.transform;
    name.style.transform = 'none';
    const a = name.getBoundingClientRect();
    const b = target.getBoundingClientRect();
    name.style.transform = keep;
    geo.dx = b.left - a.left;
    geo.dy = b.top - a.top;
    geo.s = a.width > 0 ? b.width / a.width : 1;
  };
  measure();

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: '#hero',
      start: 'top top',
      end: () => `+=${Math.round(window.innerHeight * 0.55)}`,
      scrub: 0.5,
      onRefreshInit: measure,
      // A refresh (load, resize, rotation, zoom, Back to a scrolled home) re-renders the
      // timeline without its callbacks; take the state from where the page actually is.
      onRefresh: (self) => handOver(self.progress > 0.999),
    },
    onUpdate: () => handOver(tl.progress() > 0.999),
  });
  tl.fromTo(name, { x: 0, y: 0, scale: 1 }, { x: () => geo.dx, y: () => geo.dy, scale: () => geo.s, ease: 'power2.inOut', duration: 1 }, 0).fromTo(
    g,
    { opacity: 1, scale: 1, yPercent: 0 },
    { opacity: 0, scale: 0.94, yPercent: -3, ease: 'power1.out', duration: 0.6 },
    0,
  );

  return () => {
    nav.classList.remove('is-docked');
    mark.classList.remove('is-docking');
    mark.style.visibility = '';
  };
}

function shop(main: HTMLElement, arrivedByFlight: boolean): void {
  const spreads = gsap.utils.toArray<HTMLElement>('.spread', main);
  const list = main.querySelector<HTMLElement>('.spreads');
  if (list && spreads.length) {
    const first = spreads[0]!;
    // The first sheet prints when it reaches the eye: at once on /dyqani, under the hero on home.
    if (!arrivedByFlight) {
      const p = first.querySelector<HTMLElement>('.spread__plate');
      const s = first.querySelector<HTMLElement>('.spread__second');
      const n = first.querySelector<HTMLElement>('.spread__page-n');
      const cap = first.querySelector<HTMLElement>('.spread__cap');
      if (p) p.style.setProperty('--p', '0');
      if (s) s.style.setProperty('--p', '0');
      if (n) gsap.set(n, { yPercent: 100 });
      if (cap) gsap.set(cap, { opacity: 0, y: 12 });
      ScrollTrigger.create({
        trigger: first,
        start: 'top 85%',
        once: true,
        onEnter: () => {
          if (p) printPlate(p, 0.05, 1);
          if (s) printPlate(s, 0.25, 0.9);
          if (n) gsap.to(n, { yPercent: 0, duration: 1, ease: 'expo.out', delay: 0.2 });
          if (cap) gsap.to(cap, { opacity: 1, y: 0, duration: 0.6, ease: 'expo.out', delay: 0.35 });
        },
      });
    }
    // Scroll positions are computed from the list (never from a stuck sheet, whose box moves).
    const geo = () => {
      const top = list.getBoundingClientRect().top + window.scrollY;
      const h = first.getBoundingClientRect().height;
      const stick = parseFloat(getComputedStyle(first).top) || 0;
      return { top, h, stick };
    };
    spreads.forEach((sp, i) => {
      if (i === 0) return;
      const prev = spreads[i - 1]!;
      const enter = () => {
        const g = geo();
        return g.top + i * g.h - window.innerHeight;
      };
      const stuck = () => {
        const g = geo();
        return g.top + i * g.h - g.stick;
      };
      const at = (f: number) => () => enter() + (stuck() - enter()) * f;
      const plate = sp.querySelector<HTMLElement>('.spread__plate');
      const second = sp.querySelector<HTMLElement>('.spread__second');
      const pageNo = sp.querySelector<HTMLElement>('.spread__page-n');
      const cap = sp.querySelector<HTMLElement>('.spread__cap');
      // The print runs ahead of the sheet's edge, so the scan line visibly leads it.
      if (plate) gsap.fromTo(plate, { '--p': 0 }, { '--p': 1, ease: 'none', scrollTrigger: { start: enter, end: at(0.5), scrub: true } });
      if (second) gsap.fromTo(second, { '--p': 0 }, { '--p': 1, ease: 'none', scrollTrigger: { start: at(0.2), end: at(0.7), scrub: true } });
      if (pageNo) gsap.fromTo(pageNo, { yPercent: 100 }, { yPercent: 0, ease: 'none', scrollTrigger: { start: at(0.25), end: at(0.8), scrub: true } });
      if (cap) gsap.fromTo(cap, { opacity: 0, y: 16 }, { opacity: 1, y: 0, ease: 'none', scrollTrigger: { start: at(0.4), end: stuck, scrub: true } });
      gsap.to(prev.querySelector('.spread__page'), { scale: 0.94, opacity: 0.45, ease: 'none', scrollTrigger: { start: enter, end: stuck, scrub: true } });
    });
  }

  // Index view: phones print each plate as it arrives; desktop prints the preview once.
  const tiles = gsap.utils.toArray<HTMLElement>('.toc__plate', main).filter((el) => el.offsetParent !== null);
  if (tiles.length) {
    gsap.set(tiles, { '--p': 0 });
    ScrollTrigger.batch(tiles, {
      start: 'top 92%',
      once: true,
      onEnter: (b) => gsap.to(b, { '--p': 1, duration: 0.6, ease: 'power3.out', stagger: 0.05, overwrite: true }),
    });
  }
  const preview = main.querySelector<HTMLElement>('.toc-preview__plate');
  if (preview && preview.offsetParent !== null && !arrivedByFlight) printPlate(preview, 0.1, 0.9);
  const rows = gsap.utils.toArray<HTMLElement>('.toc__link', main).slice(0, 14);
  if (rows.length && tiles.length === 0) gsap.from(rows, { opacity: 0, y: 8, duration: 0.5, ease: 'expo.out', stagger: 0.025 });
}

function product(main: HTMLElement, arrivedByFlight: boolean): void {
  const plates = gsap.utils.toArray<HTMLElement>('.product__plate', main);
  plates.forEach((pl, i) => {
    if (i === 0) {
      if (!arrivedByFlight) printPlate(pl, 0.05, 1);
      return;
    }
    gsap.set(pl, { '--p': 0 });
    ScrollTrigger.create({ trigger: pl, start: 'top 85%', once: true, onEnter: () => printPlate(pl, 0, 0.8) });
  });
  gsap.from(main.querySelectorAll('.product__hold > *'), { opacity: 0, y: 10, duration: 0.55, ease: 'expo.out', stagger: 0.04, delay: arrivedByFlight ? 0.35 : 0.15, lazy: false });
  const next = main.querySelector<HTMLElement>('.next-dress__plate');
  if (next) {
    gsap.set(next, { '--p': 0 });
    ScrollTrigger.create({ trigger: next, start: 'top 80%', once: true, onEnter: () => printPlate(next, 0, 0.9) });
  }
}

function confirmation(main: HTMLElement): void {
  gsap.from(main.querySelector('.confirm__num'), { yPercent: 60, opacity: 0, duration: 1, ease: 'expo.out' });
  gsap.from(main.querySelectorAll('.confirm__lead > *, .confirm__grid > *'), { opacity: 0, y: 10, duration: 0.6, ease: 'expo.out', stagger: 0.06, delay: 0.25 });
}

/** Spreads that do not carry the chosen size fold away (the sheet closes upward) before the swap. */
export function foldAway(main: HTMLElement, size: string): Promise<unknown> {
  if (reducedMotion()) return Promise.resolve();
  const visible = gsap.utils.toArray<HTMLElement>('.spread', main).filter((el) => {
    const r = el.getBoundingClientRect();
    return r.bottom > 0 && r.top < window.innerHeight;
  });
  const leaving = visible.filter((el) => size !== 'all' && !(el.dataset.sizes ?? '').split(' ').includes(size));
  const staying = visible.filter((el) => !leaving.includes(el));
  return Promise.all([
    leaving.length
      ? gsap.to(
          leaving.map((el) => el.querySelector('.spread__page')),
          { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.42, ease: 'power3.in', stagger: 0.04 },
        )
      : null,
    staying.length ? gsap.to(staying.map((el) => el.querySelector('.spread__cap')), { opacity: 0.35, duration: 0.3, ease: 'power2.out' }) : null,
  ]);
}

/**
 * The photograph's flight between pages: a clone of the source image travels from where it was to
 * where the same dress sits on the next page, then hands over to the real image.
 */
export interface Flight {
  clone: HTMLImageElement;
  id: string;
}

export function takeOff(plate: HTMLElement): Flight | null {
  const img = plate.querySelector<HTMLImageElement>('img');
  const id = plate.dataset.flipId;
  if (!img || !id || reducedMotion()) return null;
  const r = img.getBoundingClientRect();
  if (r.bottom < 0 || r.top > window.innerHeight || r.width < 2) return null;
  const clone = document.createElement('img');
  clone.src = img.currentSrc || img.src;
  clone.alt = '';
  clone.className = 'flight';
  Object.assign(clone.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`, objectPosition: getComputedStyle(img).objectPosition });
  document.body.appendChild(clone);
  return { clone, id };
}

export async function land(f: Flight, main: HTMLElement): Promise<boolean> {
  const target = [...main.querySelectorAll<HTMLElement>(`[data-flip-id="${CSS.escape(f.id)}"]`)].find((el) => el.getBoundingClientRect().width > 2);
  const img = target?.querySelector<HTMLImageElement>('img');
  if (!target || !img) {
    await gsap.to(f.clone, { opacity: 0, duration: 0.25, ease: 'power2.out' });
    f.clone.remove();
    return false;
  }
  target.style.setProperty('--p', '1');
  img.style.visibility = 'hidden';
  const r = img.getBoundingClientRect();
  await gsap.to(f.clone, {
    left: r.left,
    top: r.top,
    width: r.width,
    height: r.height,
    duration: 0.75,
    ease: 'expo.inOut',
    onStart: () => f.clone.style.setProperty('object-position', getComputedStyle(img).objectPosition),
  });
  img.style.visibility = '';
  await gsap.to(f.clone, { opacity: 0, duration: 0.18, ease: 'none' });
  f.clone.remove();
  return true;
}

/** A dress drops into the bag: its photograph shrinks into the header's bag link. */
export function dropIntoBag(from: HTMLElement | null): void {
  const bagBtn = document.querySelector<HTMLElement>('.nav [data-open="bag"]');
  const count = document.querySelector<HTMLElement>('[data-bag-count]');
  if (count && !reducedMotion()) gsap.fromTo(count, { scale: 1.6 }, { scale: 1, duration: 0.5, ease: 'expo.out', delay: from ? 0.55 : 0 });
  const img = from?.querySelector<HTMLImageElement>('img');
  if (!img || !bagBtn || reducedMotion()) return;
  const a = img.getBoundingClientRect();
  const b = bagBtn.getBoundingClientRect();
  if (a.width < 2 || b.width < 2) return;
  const clone = document.createElement('img');
  clone.src = img.currentSrc || img.src;
  clone.alt = '';
  clone.className = 'flight';
  Object.assign(clone.style, { left: `${a.left}px`, top: `${a.top}px`, width: `${a.width}px`, height: `${a.height}px` });
  document.body.appendChild(clone);
  const w = 28;
  gsap
    .timeline({ onComplete: () => clone.remove() })
    .to(clone, { left: b.left + b.width / 2 - w / 2, top: b.top + b.height / 2 - (w * 4) / 6, width: w, height: (w * 4) / 3, duration: 0.6, ease: 'power3.in' })
    .to(clone, { opacity: 0, duration: 0.12, ease: 'none' });
}
