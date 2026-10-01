/**
 * Page transitions without leaving the page: same-origin links fetch the next server-rendered
 * page and swap <main>. When the link belongs to a dress whose photograph is on screen, that
 * photograph flies to its place on the next page. Anything unusual falls back to a normal load.
 */
import { foldAway, gsap, land, reducedMotion, takeOff, type Flight } from './motion';

export type PageInit = (main: HTMLElement, arrivedByFlight: boolean) => void | (() => void);

const pages = new Map<string, { at: number; doc: Promise<Document> }>();
let busy = false;
let cleanup: (() => void) | void;

function eligible(a: HTMLAnchorElement, e?: MouseEvent): URL | null {
  if (e && (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)) return null;
  if (a.target && a.target !== '_self') return null;
  if (a.hasAttribute('download') || a.hasAttribute('data-no-router') || a.getAttribute('aria-disabled') === 'true') return null;
  const url = new URL(a.href, location.href);
  if (url.origin !== location.origin) return null;
  if (/^\/(admin|api|img)(\/|$)/.test(url.pathname) || /\.[a-z0-9]{2,4}$/i.test(url.pathname)) return null;
  const here = new URL(location.href);
  if ((url.searchParams.get('lang') ?? 'sq') !== (here.searchParams.get('lang') ?? 'sq')) return null;
  if (url.pathname === here.pathname && url.search === here.search && url.hash) return null;
  return url;
}

function fetchDoc(href: string): Promise<Document> {
  const hit = pages.get(href);
  if (hit && Date.now() - hit.at < 30_000) return hit.doc;
  const doc = fetch(href, { credentials: 'same-origin', headers: { 'x-nav': '1' } }).then(async (r) => {
    if (!(r.headers.get('content-type') ?? '').includes('text/html')) throw new Error('not html');
    return new DOMParser().parseFromString(await r.text(), 'text/html');
  });
  doc.catch(() => pages.delete(href));
  pages.set(href, { at: Date.now(), doc });
  return doc;
}

export function startRouter(init: PageInit): void {
  history.scrollRestoration = 'manual';
  const main = document.querySelector<HTMLElement>('main');
  if (main) cleanup = init(main, false);

  document.addEventListener('click', (e) => {
    const a = (e.target as Element).closest<HTMLAnchorElement>('a[href]');
    if (!a) return;
    const url = eligible(a, e);
    if (!url) return;
    e.preventDefault();
    // The flight leaves from whichever copy of the dress's photograph is on screen (on desktop the
    // index shows one preview plate for all its lines).
    const card = a.closest('.spread, .toc__item, .next-dress');
    const id = card?.querySelector<HTMLElement>('[data-flip-id]')?.dataset.flipId;
    const plate = id ? ([...document.querySelectorAll<HTMLElement>(`[data-flip-id="${CSS.escape(id)}"]`)].find((el) => el.getBoundingClientRect().width > 2) ?? null) : null;
    const fold = a.closest('.size-index, .size-strip') ? a.dataset.size : undefined;
    void go(url, { push: true, plate, fold });
  });

  // Warm the next page the moment a pointer settles on a link.
  const warm = (e: Event) => {
    const a = (e.target as Element).closest?.<HTMLAnchorElement>('a[href]');
    const url = a && eligible(a);
    if (url) void fetchDoc(url.href).catch(() => undefined);
  };
  document.addEventListener('pointerover', warm, { passive: true });
  document.addEventListener('touchstart', warm, { passive: true });

  window.addEventListener('popstate', (e) => {
    const state = e.state as { scroll?: number } | null;
    void go(new URL(location.href), { push: false, scroll: state?.scroll ?? 0 });
  });

  async function go(url: URL, o: { push: boolean; plate?: HTMLElement | null; scroll?: number; fold?: string }): Promise<void> {
    if (busy) return;
    busy = true;
    const docP = fetchDoc(url.href);
    const current = document.querySelector<HTMLElement>('main')!;
    history.replaceState({ ...(history.state ?? {}), scroll: window.scrollY }, '');
    const flight: Flight | null = o.plate ? takeOff(o.plate) : null;

    try {
      const folding = Boolean(o.fold && current.querySelector('.spread'));
      const out = folding
        ? foldAway(current, o.fold!)
        : reducedMotion()
          ? gsap.to(current, { opacity: 0, duration: 0.12, ease: 'none' })
          : gsap.to(current, { opacity: 0, y: flight ? 0 : -10, duration: flight ? 0.3 : 0.22, ease: 'power2.in' });
      const [doc] = await Promise.all([docP, out]);
      const next = doc.querySelector<HTMLElement>('main');
      if (!next) throw new Error('no main');

      if (typeof cleanup === 'function') cleanup();
      document.title = doc.title;
      for (const sel of ['meta[name="description"]', 'link[rel="canonical"]', 'meta[property="og:url"]', 'meta[name="robots"]']) {
        const fresh = doc.head.querySelector(sel);
        const old = document.head.querySelector(sel);
        if (fresh && old) old.replaceWith(document.importNode(fresh, true));
        else if (fresh) document.head.appendChild(document.importNode(fresh, true));
        else old?.remove();
      }
      doc.querySelectorAll<HTMLAnchorElement>('.nav [data-lang-link]').forEach((fresh) => {
        const cur = document.querySelector<HTMLAnchorElement>(`.nav [data-lang-link="${fresh.dataset.langLink}"]`);
        if (cur) cur.href = fresh.href;
      });
      const foot = doc.querySelector('footer.foot');
      if (foot) document.querySelector('footer.foot')?.replaceWith(document.importNode(foot, true));

      const fresh = document.importNode(next, true) as HTMLElement;
      current.replaceWith(fresh);
      if (o.push) history.pushState({ scroll: 0 }, '', url.href);
      const hash = url.hash ? document.getElementById(url.hash.slice(1)) : null;
      window.scrollTo(0, o.scroll ?? (hash ? hash.getBoundingClientRect().top + window.scrollY : 0));

      cleanup = init(fresh, Boolean(flight));
      if (flight) {
        gsap.fromTo(fresh, { opacity: 0 }, { opacity: 1, duration: 0.45, ease: 'power2.out', delay: 0.2 });
        await land(flight, fresh);
      } else if (!folding) {
        gsap.fromTo(fresh, { opacity: 0, y: reducedMotion() ? 0 : 10 }, { opacity: 1, y: 0, duration: 0.4, ease: 'expo.out', clearProps: 'transform' });
      }
      fresh.focus({ preventScroll: true });
      document.dispatchEvent(new CustomEvent('greta:navigated'));
    } catch {
      flight?.clone.remove();
      location.href = url.href;
    } finally {
      busy = false;
    }
  }

  navigate = (href: string) => void go(new URL(href, location.href), { push: true });
}

/** Programmatic navigation (checkout to confirmation). Falls back to a full load before start. */
export let navigate = (href: string): void => {
  location.href = href;
};
