/**
 * Menu (left), bag (right), search (top) drawers and the follow card. All native <dialog>
 * elements; GSAP slides them (one engine). Escape and the backdrop close them; focus returns.
 */
import { markSvg } from '../shared/brand';
import { CATEGORIES, MEASURES, OCCASIONS, OCCASION_PATH, SIZES, SIZE_LETTER, formatLek, isSize, photoAt, recommendSize, type Body } from '../shared/catalog';
import { copy, href, LANGS, type Copy, type Lang } from '../shared/copy';
import { esc, html, raw, type Raw } from '../shared/html';
import { bag, catalogue, type CatalogueItem, type Line } from './bag';
import * as me from './me';
import { linkPictures, showIn } from './peek';
import { trackUse } from './stats';
import { gsap, motionStopped, printPlate, reducedMotion } from './motion';

const SIDE = { menu: 'left', bag: 'right', search: 'top', me: 'right', stylist: 'right' } as const;
type Kind = keyof typeof SIDE;
const INSTAGRAM = 'https://www.instagram.com/dressesbygreta/';
const MESSAGE = 'https://ig.me/m/dressesbygreta';
const MAPS = 'https://maps.google.com/?q=41.320034%2C19.812943';
/** Search ignores case and accents: phones often type e for ë and c for ç. */
const fold = (s: string): string => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
const ICON = {
  close: raw('<svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true"><path d="M3 3l16 16M19 3L3 19" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>'),
  out: raw('<svg class="macc__out" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 9 9 3M4.5 3H9v4.5" fill="none" stroke="currentColor" stroke-width="1.1"/></svg>'),
  instagram: raw('<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.4" cy="6.6" r="0.9" fill="currentColor" stroke="none"/></svg>'),
};
/** This page in another language (Albanian carries no parameter). */
const langUrl = (l: Lang): string => {
  const u = new URL(location.href);
  u.searchParams.delete('lang');
  if (l !== 'sq') u.searchParams.set('lang', l);
  return u.href;
};
/** What /api/stylist answers: up to three dresses with a reason each, or an error code. */
interface StylistReply {
  message?: string;
  picks?: { slug: string; name: string; price: number | null; cover: string | null; reason: string }[];
  error?: string;
}
const MINUS = raw('<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M1 6h10" stroke="currentColor" stroke-width="1.2"/></svg>');
const PLUS = raw('<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M1 6h10M6 1v10" stroke="currentColor" stroke-width="1.2"/></svg>');

export class Drawers {
  private d: Record<Kind, HTMLDialogElement>;
  private opener: Element | null = null;

  constructor(private lang: Lang) {
    this.d = { menu: this.make('menu'), bag: this.make('bag'), search: this.make('search'), me: this.make('me'), stylist: this.make('stylist') };
    this.buildMenu();
    this.buildSearch();
    document.addEventListener('click', (e) => {
      const b = (e.target as Element).closest<HTMLElement>('[data-open]');
      if (b && !b.closest('dialog')) {
        e.preventDefault();
        this.open(b.dataset.open as Kind, b);
      }
    });
    bag.subscribe((lines) => this.renderBag(lines));
  }

  private get t() {
    return copy[this.lang];
  }

  private make(kind: Kind): HTMLDialogElement {
    const d = document.createElement('dialog');
    d.className = `drawer drawer--${SIDE[kind]}${kind === 'menu' ? ' drawer--dark' : ''}`;
    d.dataset.kind = kind;
    const title = { menu: this.t.nav.menu, bag: this.t.bag.title, me: this.t.me.title, search: this.t.search.title, stylist: this.t.stylist.title }[kind];
    d.setAttribute('aria-label', title);
    d.innerHTML = kind === 'menu' ? html`<div class="drawer__bar drawer__bar--x"><button class="drawer__x" type="button" data-close aria-label="${this.t.nav.close}">${ICON.close}</button><p class="drawer__title sr-only">${title}</p><a class="drawer__brand" href="${href('/', this.lang)}" aria-label="${this.t.a11y.wordmark}">${raw(markSvg('drawer__mark'))}</a></div><div class="drawer__body" data-body></div><div class="drawer__foot" data-foot hidden></div>`.value : html`<div class="drawer__bar">
        <p class="drawer__title">${title}</p>
        <button class="drawer__close" type="button" data-close>${this.t.nav.close}</button>
      </div>
      <div class="drawer__body" data-body></div>
      <div class="drawer__foot" data-foot hidden></div>`.value;
    document.body.appendChild(d);
    d.querySelector('[data-close]')!.addEventListener('click', () => void this.close(d));
    d.addEventListener('cancel', (e) => {
      e.preventDefault();
      void this.close(d);
    });
    d.addEventListener('click', (e) => {
      if (e.target === d) return void this.close(d); // the backdrop
      // Links inside a drawer navigate; the drawer steps out of the way first.
      const a = (e.target as Element).closest('a[href]');
      if (a?.getAttribute('aria-disabled') === 'true') return e.preventDefault();
      if (a && !a.hasAttribute('target')) void this.close(d, false);
    });
    return d;
  }

  open(kind: Kind, opener?: Element): void {
    const d = this.d[kind];
    if (d.open) return;
    for (const other of Object.values(this.d)) if (other.open && other !== d) other.close();
    this.opener = opener ?? document.activeElement;
    if (kind === 'bag') {
      // the lines wait (hidden) for the refresh, which may draw them again, then arrive
      const items = d.querySelectorAll('.bag__item');
      if (items.length && !reducedMotion()) gsap.set(items, { opacity: 0 });
      void bag.refresh(this.lang).finally(() => this.bagEntrance());
    }
    if (kind === 'me') this.renderMe();
    if (kind === 'stylist') this.renderStylist();
    d.showModal();
    document.documentElement.classList.add('drawer-open');
    const side = SIDE[kind];
    const from = side === 'left' ? { xPercent: -100 } : side === 'right' ? { xPercent: 100 } : { yPercent: -100 };
    if (!reducedMotion()) gsap.fromTo(d, from, { xPercent: 0, yPercent: 0, duration: 0.42, ease: 'power3.out', clearProps: 'transform' });
    if (kind === 'search') {
      d.querySelector<HTMLInputElement>('input')?.focus();
      void this.runSearch();
    } else if (kind === 'stylist' && window.matchMedia('(pointer: fine)').matches) d.querySelector<HTMLElement>('textarea')?.focus();
    else d.querySelector<HTMLElement>('[data-close]')?.focus();
  }

  async close(d: HTMLDialogElement, restoreFocus = true): Promise<void> {
    if (!d.open) return;
    const side = SIDE[d.dataset.kind as Kind];
    const to = side === 'left' ? { xPercent: -100 } : side === 'right' ? { xPercent: 100 } : { yPercent: -100 };
    if (!reducedMotion()) await gsap.to(d, { ...to, duration: 0.26, ease: 'power3.in' });
    d.close();
    gsap.set(d, { clearProps: 'transform' });
    document.documentElement.classList.remove('drawer-open');
    if (restoreFocus) (this.opener as HTMLElement | null)?.focus?.();
    this.opener = null;
  }

  closeAll(): void {
    for (const d of Object.values(this.d)) if (d.open) void this.close(d, false);
  }

  /** Opens the search with words already typed (the not-found page's field). */
  search(words: string): void {
    const input = this.d.search.querySelector<HTMLInputElement>('input');
    if (input) input.value = words;
    this.open('search');
  }

  /* ------------------------------------------------------------ menu ------------------------------------------------------------ */

  private buildMenu(): void {
    const t = this.t;
    const l = this.lang;
    // Babyboo-style: uppercase rows on a dark sheet, a plus that opens each row in place.
    const row = (id: string, label: string, body: Raw) => html`<div class="macc">
        <button class="macc__head" type="button" aria-expanded="false" aria-controls="macc-${id}" data-acc>
          <span>${label}</span><span class="macc__plus" aria-hidden="true"></span>
        </button>
        <div class="macc__panel" id="macc-${id}" inert><div class="macc__inner">${body}</div></div>
      </div>`;
    this.d.menu.querySelector('[data-body]')!.innerHTML = html`<nav class="mnav" aria-label="${t.nav.menu}">
      ${row(
        'shop',
        t.nav.lookbook,
        // "new" leads the categories while the shop has new dresses (the page says so: body[data-new])
        html`<a class="mnav__child" href="${href('/dyqani', l)}" data-pic="all">${t.nav.all}</a>${[...('new' in document.body.dataset ? (['new'] as const) : []), ...CATEGORIES].map(
          (c) => html`<a class="mnav__child" href="${href('/dyqani', l, { kategoria: c })}" data-pic="cat:${c}">${t.categories[c]}</a>`,
        )}`,
      )}
      ${row(
        'occasions',
        t.occasions.heading,
        html`${OCCASIONS.map((o) => html`<a class="mnav__child" href="${href(OCCASION_PATH[o], l)}" data-pic="occ:${o}">${t.occasions[o].label}</a>`)}`,
      )}
      ${row(
        'sizes',
        t.nav.bySize,
        html`<div class="mnav__sizes">${SIZES.map(
          (s) => html`<a class="mnav__size" href="${href('/dyqani', l, { masa: s })}" aria-label="${t.sizes.label(s, SIZE_LETTER[s])}"><span>${s}</span><span>${SIZE_LETTER[s]}</span></a>`,
        )}</div>`,
      )}
      ${row('visit', t.nav.visit, html`<p class="mnav__text">${t.visit.address}</p><a class="mnav__child" href="${MAPS}" target="_blank" rel="noopener">${t.visit.maps}</a>`)}
      ${'lookbook' in document.body.dataset ? html`<div class="macc"><a class="macc__head" href="${href('/lookbook', l)}"><span>${t.lookbook.title}</span></a></div>` : ''}
      <div class="macc">
        <a class="macc__head" href="${INSTAGRAM}" target="_blank" rel="noopener"><span>${t.nav.instagram}</span>${ICON.out}</a>
      </div>
      <div class="mnav__secondary">
        <a href="${MESSAGE}" target="_blank" rel="noopener">${t.visit.ask}</a>
        <a href="${INSTAGRAM}" target="_blank" rel="noopener">${t.footer.rules}</a>
        <button type="button" data-menu-me>${t.me.open}</button>
        ${'stylist' in document.body.dataset ? html`<button type="button" data-menu-stylist>${t.stylist.open}</button>` : ''}
        <a href="${href('/te-ruajtura', l)}">${t.saved.title}</a>
        <button type="button" data-menu-search>${t.nav.search}</button>
        <button type="button" data-motion-toggle>${motionStopped() ? t.motion.play : t.motion.stop}</button>
      </div>
      <div class="mnav__langs" role="group" aria-label="${t.nav.region}">
        ${LANGS.map(
          (x) => html`<a href="${langUrl(x)}" lang="${x}" hreflang="${x}" data-no-router data-lang-link="${x}"${x === l ? raw(' aria-current="true"') : ''}>${copy[x].langName}</a>`,
        )}
      </div>
      <div class="mnav__social"><a href="${INSTAGRAM}" target="_blank" rel="noopener" aria-label="${t.nav.instagram}">${ICON.instagram}</a></div>
    </nav>
    <div class="mnav__preview" aria-hidden="true"><span class="plate mnav__plate"><span class="plate__inner"><img class="plate__img" alt="" decoding="async" /><span class="plate__scan"></span></span></span><span class="mnav__preview-name"></span></div>`.value;
    this.menuPictures();
    this.d.menu.querySelectorAll<HTMLButtonElement>('[data-acc]').forEach((b) =>
      b.addEventListener('click', () => {
        const open = b.getAttribute('aria-expanded') !== 'true';
        b.setAttribute('aria-expanded', String(open));
        this.d.menu.querySelector(`#${b.getAttribute('aria-controls')}`)?.toggleAttribute('inert', !open);
      }),
    );
    this.d.menu.querySelector('[data-menu-search]')!.addEventListener('click', () => {
      this.d.menu.close();
      document.documentElement.classList.remove('drawer-open');
      this.open('search');
    });
    this.d.menu.querySelector('[data-menu-me]')!.addEventListener('click', () => {
      this.d.menu.close();
      document.documentElement.classList.remove('drawer-open');
      this.open('me');
    });
    this.d.menu.querySelector('[data-menu-stylist]')?.addEventListener('click', () => {
      this.d.menu.close();
      document.documentElement.classList.remove('drawer-open');
      this.open('stylist');
    });
  }

  /**
   * The menu shows the dresses: on a computer, the link under the pointer prints a photograph of its
   * first dress in the open space beside the menu; on a phone each link carries a small one.
   */
  private menuPictures(): void {
    const menu = this.d.menu;
    const preview = menu.querySelector<HTMLElement>('.mnav__preview')!;
    const plate = preview.querySelector<HTMLElement>('.mnav__plate')!;
    const name = preview.querySelector<HTMLElement>('.mnav__preview-name')!;
    const wide = () => window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 1024px)').matches;
    // phones: a small photograph before each shop and occasion link, once the menu first opens
    const thumbs = async () => {
      const pics = await linkPictures(this.lang);
      menu.querySelectorAll<HTMLAnchorElement>('[data-pic]').forEach((a) => {
        const p = pics.get(a.dataset.pic!);
        if (!p?.cover || a.querySelector('.mnav__thumb')) return;
        a.insertAdjacentHTML('afterbegin', `<img class="mnav__thumb" src="${esc(photoAt(p.cover, 480))}" alt="" width="32" height="43" loading="lazy" decoding="async" />`);
      });
    };
    new MutationObserver(() => menu.open && void thumbs()).observe(menu, { attributes: true, attributeFilter: ['open'] });
    // computers (the menu opens there in French below 1120px): the dress prints beside the menu
    let current = '';
    const show = async (e: Event) => {
      const a = (e.target as Element).closest<HTMLAnchorElement>('[data-pic]');
      if (!a || !wide() || a.dataset.pic === current) return;
      const p = (await linkPictures(this.lang)).get(a.dataset.pic!);
      if (!p?.cover) return;
      current = a.dataset.pic!;
      name.textContent = p.name;
      showIn(plate, p, '28vw');
      preview.classList.add('is-on');
    };
    menu.addEventListener('pointerover', (e) => void show(e));
    menu.addEventListener('focusin', (e) => void show(e));
  }

  /** The language links point at the current page; call after every navigation. */
  syncLanguageLinks(): void {
    this.d.menu.querySelectorAll<HTMLAnchorElement>('[data-lang-link]').forEach((a) => {
      a.href = langUrl(a.dataset.langLink as Lang);
    });
  }

  /* ------------------------------------------------------------- bag ------------------------------------------------------------ */

  private renderBag(lines: Line[]): void {
    const t = this.t;
    const l = this.lang;
    const n = lines.reduce((s, x) => s + x.qty, 0);
    document.querySelectorAll<HTMLElement>('[data-bag-count]').forEach((c) => (c.textContent = n ? `(${n})` : ''));
    const body = this.d.bag.querySelector<HTMLElement>('[data-body]')!;
    const foot = this.d.bag.querySelector<HTMLElement>('[data-foot]')!;
    if (!lines.length) {
      body.innerHTML = html`<div class="bag__empty">
        <span class="bag__seal" aria-hidden="true">${raw(markSvg('bag__mark'))}</span>
        <p class="ui">${t.bag.empty}</p>
        <p class="body muted">${t.bag.emptyBody}</p>
        <a class="btn btn--line" href="${href('/dyqani', l)}">${t.bag.browse}</a>
        <div class="bag__picks" data-picks hidden></div>
      </div>`.value;
      foot.hidden = true;
      void this.bagPicks(body.querySelector<HTMLElement>('[data-picks]')!);
      this.lastTotal = 0;
      return;
    }
    body.innerHTML = html`<ul class="bag">${lines.map((x) => {
      const url = href(`/fustan/${x.snap.slug}`, l);
      const cap = Math.min(5, x.snap.stock[x.size] ?? 0);
      return html`<li class="bag__item${x.gone ? ' is-gone' : ''}">
        <a href="${url}" class="bag__thumb" tabindex="-1" aria-hidden="true">${x.snap.cover ? html`<img src="${photoAt(x.snap.cover, 480)}" alt="" width="72" height="96" loading="lazy" decoding="async" />` : ''}</a>
        <div class="bag__meta">
          <a class="bag__name" href="${url}">${x.snap.name}</a>
          <span class="bag__row"><span>${t.bag.size} ${x.size} (${SIZE_LETTER[x.size]})</span><span class="bag__price">${x.snap.price !== null ? formatLek(x.snap.price * x.qty, l) : ''}</span></span>
          ${x.gone
            ? html`<span class="bag__warn">${t.bag.unavailable}</span>`
            : html`<span class="qty" role="group" aria-label="${t.bag.qty}">
                <button type="button" data-qty="-1" data-id="${x.id}" data-size="${x.size}" aria-label="${t.a11y.qtyDown}"${x.qty <= 1 ? ' disabled' : ''}>${MINUS}</button>
                <span class="qty__n" aria-live="polite">${x.qty}</span>
                <button type="button" data-qty="1" data-id="${x.id}" data-size="${x.size}" aria-label="${t.a11y.qtyUp}"${x.qty >= cap ? ' disabled' : ''}>${PLUS}</button>
              </span>
              ${x.qty >= cap && cap <= 2 ? html`<span class="bag__note">${t.bag.onlyLeft(cap)}</span>` : ''}`}
          <button class="bag__remove" type="button" data-remove data-id="${x.id}" data-size="${x.size}">${t.bag.remove}</button>
        </div>
      </li>`;
    })}</ul>`.value;
    const blocked = lines.some((x) => x.gone);
    foot.hidden = false;
    foot.innerHTML = html`<div class="bag__sum"><span>${t.bag.subtotal}</span><span data-total>${formatLek(bag.subtotal(), l)}</span></div>
      <p class="small">${t.bag.note}</p>
      <a class="btn btn--wide${blocked ? ' is-blocked' : ''}" href="${href('/porosia', l)}"${blocked ? raw(' aria-disabled="true"') : ''}>${t.bag.checkout}</a>`.value;
    // the total counts to its new value instead of jumping
    const total = bag.subtotal();
    const el = foot.querySelector<HTMLElement>('[data-total]');
    if (el && this.lastTotal && this.lastTotal !== total && !reducedMotion()) {
      const v = { n: this.lastTotal };
      gsap.to(v, { n: total, duration: 0.5, ease: 'power2.out', onUpdate: () => (el.textContent = formatLek(Math.round(v.n), l)) });
    }
    this.lastTotal = total;
    body.querySelectorAll<HTMLButtonElement>('[data-qty]').forEach((b) =>
      b.addEventListener('click', () => {
        const line = lines.find((x) => x.id === b.dataset.id && x.size === b.dataset.size);
        if (line) bag.setQty(line.id, line.size, line.qty + Number(b.dataset.qty));
      }),
    );
    body.querySelectorAll<HTMLButtonElement>('[data-remove]').forEach((b) =>
      b.addEventListener('click', () => {
        const line = lines.find((x) => x.id === b.dataset.id && x.size === b.dataset.size);
        if (line) bag.remove(line.id, line.size);
      }),
    );
  }

  /* -------------------------------------------------------- size and date -------------------------------------------------------- */

  /**
   * Find my size and shop by date: her measurements (or a size picked directly) and the date of her
   * event. The size shows as she types; Save keeps it on this phone and every page marks it.
   */
  private renderMe(): void {
    const t = this.t;
    const now = me.get();
    const body = this.d.me.querySelector<HTMLElement>('[data-body]')!;
    const foot = this.d.me.querySelector<HTMLElement>('[data-foot]')!;
    const today = this.today();
    body.innerHTML = html`<form class="me" data-me-form novalidate>
      <fieldset class="me__sec">
        <legend class="me__h">${t.me.measuresTitle}</legend>
        <p class="small">${t.me.measuresHint}</p>
        <div class="me__fields">${MEASURES.map(
          (k) => html`<div class="field"><label class="field__label" for="me-${k}">${t.product.measure[k]}</label><input class="field__input" id="me-${k}" name="${k}" inputmode="numeric" maxlength="3" autocomplete="off" value="${now.body[k] ?? ''}" /></div>`,
        )}</div>
        <p class="me__result" data-me-result aria-live="polite"></p>
      </fieldset>
      <fieldset class="me__sec">
        <legend class="me__h">${t.me.orPick}</legend>
        <div class="pick__row">${SIZES.map(
          (s) => html`<label class="pick__size"><input type="radio" name="size" value="${s}"${now.size === s ? raw(' checked') : ''} /><span class="pick__n">${s}</span><span class="pick__l">${SIZE_LETTER[s]}</span></label>`,
        )}</div>
      </fieldset>
      <fieldset class="me__sec">
        <legend class="me__h">${t.me.dateTitle}</legend>
        <p class="small">${t.me.dateHint}</p>
        <div class="me__date"><input class="field__input" type="date" name="date" min="${today}" value="${now.date && now.date >= today ? now.date : ''}" aria-label="${t.me.dateTitle}" /><button class="tlink" type="button" data-me-nodate>${t.me.clearDate}</button></div>
      </fieldset>
      <p class="small me__privacy">${t.me.privacy}</p>
    </form>`.value;
    foot.hidden = false;
    foot.innerHTML = html`<button class="btn btn--wide" type="button" data-me-save>${t.me.save}</button><button class="tlink me__clear" type="button" data-me-clear>${t.me.clear}</button>`.value;
    const form = body.querySelector<HTMLFormElement>('[data-me-form]')!;
    const result = form.querySelector<HTMLElement>('[data-me-result]')!;
    const read = (): Body => {
      const b: Body = {};
      for (const k of MEASURES) {
        const n = parseInt((form.elements.namedItem(k) as HTMLInputElement).value.replace(/\D/g, ''), 10);
        if (n >= 40 && n <= 200) b[k] = n;
      }
      return b;
    };
    const show = () => {
      const rec = recommendSize(read());
      if (!rec) return void (result.textContent = '');
      // her size on the chart, live; the size buttons follow it
      form.querySelectorAll<HTMLInputElement>('input[name="size"]').forEach((r) => (r.checked = r.value === rec.size));
      result.innerHTML = rec.size
        ? html`<span class="me__label">${t.me.yourSize}</span><span class="me__size">${rec.size}</span><span class="me__letter">${SIZE_LETTER[rec.size]}</span><span class="small me__note">${t.me.chartNote}</span>`.value
        : html`<span class="small">${t.me.tooBig}</span>`.value;
    };
    form.addEventListener('input', (e) => {
      const el = e.target as HTMLInputElement;
      if ((MEASURES as readonly string[]).includes(el.name)) show();
    });
    // a size picked directly sets the measurements aside
    form.addEventListener('change', (e) => {
      const el = e.target as HTMLInputElement;
      if (el.name !== 'size') return;
      for (const k of MEASURES) (form.elements.namedItem(k) as HTMLInputElement).value = '';
      result.textContent = '';
    });
    form.querySelector('[data-me-nodate]')!.addEventListener('click', () => ((form.elements.namedItem('date') as HTMLInputElement).value = ''));
    foot.querySelector('[data-me-save]')!.addEventListener('click', () => {
      const picked = form.querySelector<HTMLInputElement>('input[name="size"]:checked')?.value;
      const date = (form.elements.namedItem('date') as HTMLInputElement).value || null;
      const body = read();
      const before = me.get();
      me.setAll({ body, size: isSize(picked) ? picked : null, date });
      if ((Object.keys(body).length || isSize(picked)) && (JSON.stringify(body) !== JSON.stringify(before.body) || picked !== before.size)) trackUse('size');
      if (date && date !== before.date) trackUse('date');
      void this.close(this.d.me);
    });
    foot.querySelector('[data-me-clear]')!.addEventListener('click', () => {
      me.setAll({ body: {}, size: null, date: null });
      this.renderMe();
    });
    show();
  }

  /* ------------------------------------------------------------ stylist ------------------------------------------------------------ */

  /**
   * The AI stylist (worker/stylist.ts): she describes her event in her own words and Claude picks up
   * to three dresses from the shop, a reason under each. Her saved size and date go with the
   * question and the drawer says so; the answer stays until she asks again.
   */
  private renderStylist(): void {
    const t = this.t;
    const body = this.d.stylist.querySelector<HTMLElement>('[data-body]')!;
    if (!body.querySelector('[data-sty-form]')) {
      body.innerHTML = html`<form class="sty" data-sty-form novalidate>
          <p class="body">${t.stylist.intro}</p>
          <div class="field">
            <label class="field__label" for="sty-q">${t.stylist.label}</label>
            <textarea class="field__input field__input--area" id="sty-q" name="q" rows="4" maxlength="400" placeholder="${t.stylist.example}"></textarea>
          </div>
          <p class="small sty__quiet" data-sty-context hidden></p>
          <button class="btn btn--wide" type="submit">${t.stylist.ask}</button>
          <p class="small sty__quiet">${t.stylist.privacy}</p>
        </form>
        <div class="sty__answer" data-sty-answer aria-live="polite"></div>`.value;
      body.querySelector('[data-sty-form]')!.addEventListener('submit', (e) => {
        e.preventDefault();
        void this.askStylist();
      });
    }
    const now = me.get();
    const date = now.date && now.date >= this.today() ? now.date : null;
    const context = body.querySelector<HTMLElement>('[data-sty-context]')!;
    context.hidden = !now.size && !date;
    context.textContent = context.hidden ? '' : t.stylist.context(now.size, date && t.me.day(date));
  }

  /** Opens the stylist with her words already written (a search that found nothing hands them over). */
  askWith(words: string): void {
    this.open('stylist');
    const q = this.d.stylist.querySelector<HTMLTextAreaElement>('textarea');
    if (q && words) q.value = words;
  }

  private async askStylist(): Promise<void> {
    const t = this.t;
    const l = this.lang;
    const form = this.d.stylist.querySelector<HTMLFormElement>('[data-sty-form]')!;
    const answer = this.d.stylist.querySelector<HTMLElement>('[data-sty-answer]')!;
    const button = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
    const field = form.querySelector<HTMLTextAreaElement>('textarea')!;
    const say = (text: string) => (answer.innerHTML = html`<p class="sty__msg">${text}</p>`.value);
    const q = field.value.trim();
    if (q.length < 5) {
      say(t.stylist.errors.short);
      return field.focus();
    }
    const now = me.get();
    button.disabled = true;
    button.textContent = t.stylist.asking;
    answer.setAttribute('aria-busy', 'true');
    let data: StylistReply = {};
    let ok = false;
    try {
      const res = await fetch('/api/stylist', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ q, lang: l, size: now.size, date: now.date && now.date >= this.today() ? now.date : null }),
      });
      data = (await res.json().catch(() => ({}))) as StylistReply;
      ok = res.ok && Array.isArray(data.picks);
    } catch {
      /* offline or cut off: said below as a failure */
    }
    button.disabled = false;
    answer.removeAttribute('aria-busy');
    if (!ok) {
      button.textContent = t.stylist.ask;
      const errors = t.stylist.errors;
      say(errors[data.error && data.error in errors ? (data.error as keyof Copy['stylist']['errors']) : 'failed']);
      return;
    }
    trackUse('stylist');
    button.textContent = t.stylist.again;
    answer.innerHTML = html`<p class="sty__msg">${data.message ?? ''}</p>
      ${data.picks!.length
        ? html`<ul class="sty__picks">${data.picks!.map(
            (p) => html`<li class="sty__pick">
              <a class="sty__link" href="${href(`/fustan/${p.slug}`, l)}">
                <span class="sty__thumb">${p.cover ? html`<img src="${p.cover}" alt="" width="72" height="96" loading="lazy" decoding="async" />` : ''}</span>
                <span class="sty__meta">
                  <span class="sty__name">${p.name}</span>
                  ${p.price !== null ? html`<span class="sty__price">${formatLek(p.price, l)}</span>` : ''}
                  <span class="small sty__why">${p.reason}</span>
                </span>
              </a>
            </li>`,
          )}</ul>`
        : ''}
      <p class="small sty__quiet">${t.stylist.note}</p>`.value;
    answer.scrollIntoView({ block: 'nearest', behavior: reducedMotion() ? 'auto' : 'smooth' });
    if (!reducedMotion()) gsap.from(answer.querySelectorAll('.sty__msg, .sty__pick, .sty__quiet'), { opacity: 0, y: 12, duration: 0.42, ease: 'power3.out', stagger: 0.07, clearProps: 'all' });
  }

  /** Today on her phone's calendar (dates she picks are hers, not the server's). */
  private today(): string {
    return new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
  }

  private lastTotal = 0;

  /** The empty bag offers a way back in: the dresses she saved, or else the new ones. */
  private async bagPicks(box: HTMLElement): Promise<void> {
    const t = this.t;
    const l = this.lang;
    let list: CatalogueItem[];
    try {
      list = await catalogue(l);
    } catch {
      return;
    }
    const saved = me.get().saved;
    const mine = saved.map((s) => list.find((p) => p.slug === s)).filter((p): p is CatalogueItem => !!p?.cover);
    const picks = (mine.length ? mine : list.filter((p) => p.isNew && p.cover)).slice(0, 4);
    if (!picks.length || !box.isConnected) return;
    box.innerHTML = html`<p class="ui">${mine.length ? t.saved.title : t.categories.new}</p>
      <ul class="bag__grid">${picks.map(
        (p) => html`<li><a class="bag__pick" href="${href(`/fustan/${p.slug}`, l)}"><span class="plate bag__plate"><span class="plate__inner"><img class="plate__img" src="${photoAt(p.cover!, 480)}" alt="" loading="lazy" decoding="async" /><span class="plate__scan"></span></span></span><span class="bag__pick-name">${p.name}</span></a></li>`,
      )}</ul>`.value;
    box.hidden = false;
    if (!reducedMotion()) box.querySelectorAll<HTMLElement>('.bag__plate').forEach((pl, i) => printPlate(pl, 0.1 + i * 0.08, 0.7));
  }

  /** Opening the bag: the G prints when it is empty, otherwise its lines arrive one after another. */
  private bagEntrance(): void {
    if (reducedMotion()) return;
    const body = this.d.bag.querySelector<HTMLElement>('[data-body]')!;
    const mark = body.querySelector<HTMLElement>('.bag__seal');
    // lazy: false, so the hidden start state is drawn at once, never one frame late (motion.ts)
    if (mark) gsap.fromTo(mark, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 0.9, ease: 'power3.out', delay: 0.15, lazy: false, clearProps: 'clipPath' });
    const items = body.querySelectorAll('.bag__item');
    if (items.length) gsap.fromTo(items, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.45, ease: 'expo.out', stagger: 0.05, delay: 0.12, lazy: false, clearProps: 'all' });
  }

  /* ----------------------------------------------------------- search ----------------------------------------------------------- */

  private buildSearch(): void {
    const t = this.t;
    const body = this.d.search.querySelector<HTMLElement>('[data-body]')!;
    body.classList.remove('drawer__body');
    body.innerHTML = html`<form class="search__form" role="search" data-form>
        <input class="search__input" type="search" name="q" autocomplete="off" placeholder="${t.search.placeholder}" aria-label="${t.search.title}" />
        <button class="btn btn--line" type="button" data-clear>${t.search.clear}</button>
      </form>
      <p class="search__status small" data-status aria-live="polite"></p>
      ${'stylist' in document.body.dataset ? html`<p class="search__ask" data-ask hidden><button class="tlink" type="button">${t.stylist.open}</button></p>` : ''}
      <div class="search__results" data-results></div>`.value;
    const input = body.querySelector<HTMLInputElement>('input')!;
    input.addEventListener('input', () => void this.runSearch());
    body.querySelector('[data-form]')!.addEventListener('submit', (e) => {
      e.preventDefault();
      void this.runSearch();
    });
    body.querySelector('[data-clear]')!.addEventListener('click', () => {
      input.value = '';
      void this.runSearch();
      input.focus();
    });
    body.querySelector('[data-ask] button')?.addEventListener('click', () => this.askWith(input.value.trim()));
  }

  private async runSearch(): Promise<void> {
    const t = this.t;
    const l = this.lang;
    const body = this.d.search;
    const q = fold((body.querySelector<HTMLInputElement>('input')?.value ?? '').trim());
    const status = body.querySelector<HTMLElement>('[data-status]')!;
    const results = body.querySelector<HTMLElement>('[data-results]')!;
    let list;
    try {
      list = await catalogue(l);
    } catch {
      status.textContent = '';
      return;
    }
    const cats = copy[l].categories as Record<string, string>;
    // the colour is stored as an English word (red); the visitor may type it in her own language
    const colors = copy[l].search.colors;
    const words = (p: (typeof list)[number]) =>
      fold(`${p.name} ${p.color} ${colors[p.color] ?? ''} ${p.categories.map((c) => `${c} ${cats[c] ?? ''}`).join(' ')} ${p.isNew ? `new ${cats.new} ${t.product.newTag}` : ''}`);
    const hits = q ? list.filter((p) => words(p).includes(q)) : list.slice(0, 12);
    status.textContent = q ? (hits.length ? t.search.results(hits.length) : t.search.none) : '';
    const ask = body.querySelector<HTMLElement>('[data-ask]');
    if (ask) ask.hidden = !q || hits.length > 0;
    results.innerHTML = hits
      .slice(0, 24)
      .map(
        (p) => `<a class="search__hit" href="${esc(href(`/fustan/${p.slug}`, l))}">
          <span class="search__well">${p.cover ? `<img src="${esc(photoAt(p.cover, 480))}" alt="" loading="lazy" decoding="async" />` : ''}</span>
          <span class="search__name">${esc(p.name)}${p.isNew ? `<span class="tag-new">${esc(t.product.newTag)}</span>` : ''}</span>
          <span class="search__price">${p.price !== null ? esc(formatLek(p.price, l)) : ''}</span>
        </a>`,
      )
      .join('');
  }

  /* ------------------------------------------------------------ popup ----------------------------------------------------------- */

  /** The follow card: once per session, after a moment; never over a drawer, a dress page (on a
   *  phone it would cover the dress and its buy button) or checkout. Blocked, it waits and asks again. */
  schedulePopup(delayMs = 9000): void {
    try {
      if (sessionStorage.getItem('greta-follow') === '1') return;
    } catch {
      return;
    }
    const attempt = () => {
      const kind = document.querySelector<HTMLElement>('main')?.dataset.page ?? '';
      if (document.querySelector('dialog[open]') || ['product', 'checkout', 'confirmation', 'pay'].includes(kind)) {
        window.setTimeout(attempt, 6000);
        return;
      }
      const t = this.t;
      const p = document.createElement('dialog');
      p.className = 'popup';
      p.setAttribute('aria-label', t.popup.lead);
      p.innerHTML = html`<button class="popup__close" type="button" data-close aria-label="${t.popup.close}">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="1.2" /></svg>
        </button>
        <span class="popup__avatar" role="img" aria-label="${t.hero.wordmark}">${raw(markSvg('popup__mark'))}</span>
        <p class="popup__lead">${t.popup.lead}</p>
        <p class="small">${t.popup.body}</p>
        <a class="btn btn--wide" href="${INSTAGRAM}" target="_blank" rel="noopener">${t.popup.cta}</a>`.value;
      document.body.appendChild(p);
      const done = () => {
        try {
          sessionStorage.setItem('greta-follow', '1');
        } catch {
          /* shown again next visit; harmless */
        }
        p.close();
        p.remove();
      };
      p.querySelector('[data-close]')!.addEventListener('click', done);
      p.querySelector('a')!.addEventListener('click', done);
      p.addEventListener('cancel', (e) => {
        e.preventDefault();
        done();
      });
      p.addEventListener('click', (e) => {
        if (e.target === p) done();
      });
      p.showModal();
      p.querySelector<HTMLElement>('a')?.focus({ preventScroll: true });
      if (!reducedMotion()) gsap.fromTo(p, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power3.out', clearProps: 'transform' });
    };
    window.setTimeout(attempt, delayMs);
  }
}
