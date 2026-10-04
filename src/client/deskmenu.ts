/**
 * The menu on computers (from 1024px). MENU opens a white sheet under the header with the whole
 * shop at once: the dresses in large type with their counts, the sizes (hers underlined), the
 * occasions, the shop's other tools and its address, and the photograph of the dress behind the
 * link under the pointer. Phones and tablets keep the dark drawer (drawers.ts).
 *
 * Not a modal: the header stays in use, and MENU (now MBYLL), Escape, a click on the page or any
 * link closes it. It sits right after MENU in the page, so Tab walks into it; Tab out of it closes it.
 */
import { CATEGORIES, OCCASIONS, OCCASION_PATH, SIZES, SIZE_LETTER, forOccasion, formatLek } from '../shared/catalog';
import { copy, href, type Lang } from '../shared/copy';
import { html, raw } from '../shared/html';
import { catalogue } from './bag';
import { INSTAGRAM, MAPS, MESSAGE } from './links';
import * as me from './me';
import { gsap, motionStopped, reducedMotion } from './motion';
import { linkPictures, showIn } from './peek';

/** Where the sheet stands in for the dark drawer: the header shows its desktop row from here. */
export const desktop = window.matchMedia('(min-width: 1024px)');

const OUT = raw('<svg class="dmenu__out" width="10" height="10" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 9 9 3M4.5 3H9v4.5" fill="none" stroke="currentColor" stroke-width="1.1"/></svg>');
const PIC_SIZES = 'clamp(190px, 19vw, 300px)';

export class DeskMenu {
  private sheet: HTMLElement | null = null;
  private scrim: HTMLElement | null = null;
  private button: HTMLButtonElement | null = document.querySelector<HTMLButtonElement>('.nav__menu');
  private opened = false;
  private shownId = '';
  private timer = 0;

  constructor(private lang: Lang) {
    // on computers MENU discloses the sheet; below 1024px it opens the drawer (a dialog)
    const roles = () => {
      const b = this.button;
      if (!b) return;
      if (desktop.matches) {
        b.removeAttribute('aria-haspopup');
        b.setAttribute('aria-expanded', String(this.opened));
      } else {
        this.closeNow();
        b.setAttribute('aria-haspopup', 'dialog');
        b.removeAttribute('aria-expanded');
      }
    };
    roles();
    desktop.addEventListener('change', roles);
    document.addEventListener('greta:navigated', () => this.closeNow());
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' || !this.opened) return;
      e.preventDefault();
      void this.close(true);
    });
    // a click anywhere outside (the page under the veil, the header's other links) closes it
    document.addEventListener('click', (e) => {
      const target = e.target as Node;
      if (this.opened && !this.sheet?.contains(target) && !this.button?.contains(target)) void this.close(false);
    });
  }

  get isOpen(): boolean {
    return this.opened;
  }

  toggle(button: HTMLButtonElement): void {
    this.button = button;
    if (this.opened) void this.close(true);
    else this.open();
  }

  open(): void {
    const button = this.button;
    if (!button) return;
    if (!this.sheet) this.mount(button);
    const sheet = this.sheet!;
    const scrim = this.scrim!;
    const items = sheet.querySelectorAll('[data-in]');
    gsap.killTweensOf([sheet, scrim, ...items]);
    this.opened = true;
    sheet.hidden = false;
    scrim.hidden = false;
    button.setAttribute('aria-expanded', 'true');
    document.documentElement.classList.add('dmenu-open');
    this.fill();
    if (!this.shownId) this.picture('all', 0);
    if (reducedMotion()) return;
    gsap.fromTo(sheet, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.55, ease: 'power3.out', clearProps: 'clipPath' });
    gsap.fromTo(items, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out', stagger: 0.018, delay: 0.08, clearProps: 'transform,opacity' });
    gsap.fromTo(scrim, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'power2.out' });
  }

  async close(restoreFocus: boolean): Promise<void> {
    if (!this.opened || !this.sheet || !this.scrim) return;
    const sheet = this.sheet;
    const scrim = this.scrim;
    this.opened = false;
    this.button?.setAttribute('aria-expanded', 'false');
    if (!reducedMotion()) {
      gsap.killTweensOf([sheet, scrim, ...sheet.querySelectorAll('[data-in]')]);
      await Promise.all([
        gsap.to(sheet, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.3, ease: 'power3.in' }),
        gsap.to(scrim, { opacity: 0, duration: 0.3, ease: 'power2.in' }),
      ]);
    }
    // MENU pressed again while it closed: it is open once more
    if (this.opened) return;
    this.finish();
    if (restoreFocus) this.button?.focus();
  }

  /** At once, without motion: a drawer takes its place, the page changed, the window narrowed. */
  closeNow(): void {
    if (!this.opened) return;
    this.opened = false;
    this.button?.setAttribute('aria-expanded', 'false');
    this.finish();
  }

  private finish(): void {
    const sheet = this.sheet!;
    const scrim = this.scrim!;
    gsap.killTweensOf([sheet, scrim, ...sheet.querySelectorAll('[data-in]')]);
    gsap.set([sheet, scrim, ...sheet.querySelectorAll('[data-in]')], { clearProps: 'clipPath,opacity,transform' });
    sheet.hidden = true;
    scrim.hidden = true;
    window.clearTimeout(this.timer);
    document.documentElement.classList.remove('dmenu-open');
  }

  private mount(button: HTMLButtonElement): void {
    const t = copy[this.lang];
    const l = this.lang;
    const flags = document.body.dataset;
    const shop: [key: string, url: string, label: string][] = [
      ['all', href('/dyqani', l), t.nav.all],
      ...('new' in flags ? [['cat:new', href('/dyqani', l, { kategoria: 'new' }), t.categories.new] as [string, string, string]] : []),
      ...CATEGORIES.map((c): [string, string, string] => [`cat:${c}`, href('/dyqani', l, { kategoria: c }), t.categories[c]]),
    ];
    const sheet = document.createElement('nav');
    sheet.className = 'dmenu';
    sheet.id = 'dmenu';
    sheet.setAttribute('aria-label', t.nav.menu);
    sheet.hidden = true;
    sheet.innerHTML = html`<div class="dmenu__grid">
      <div class="dmenu__col">
        <p class="dmenu__h" id="dm-shop" data-in>${t.nav.shop}</p>
        <ul class="dmenu__bigs" aria-labelledby="dm-shop">${shop.map(
          ([key, url, label]) => html`<li data-in><a class="dmenu__big" href="${url}" data-pic="${key}"><span>${label}</span><span class="dmenu__n" data-n="${key}"></span></a></li>`,
        )}</ul>
        <p class="dmenu__h" id="dm-size" data-in>${t.nav.bySize}</p>
        <div class="dmenu__sizes" role="group" aria-labelledby="dm-size" data-in>${SIZES.map(
          (s) => html`<a class="dmenu__size" href="${href('/dyqani', l, { masa: s })}" data-pic="size:${s}" data-size="${s}" aria-label="${t.sizes.label(s, SIZE_LETTER[s])}"><span>${s}</span><span>${SIZE_LETTER[s]}</span></a>`,
        )}</div>
        <button class="dmenu__find" type="button" data-open="me" aria-haspopup="dialog" data-in>${t.me.find}</button>
      </div>
      <div class="dmenu__col">
        <p class="dmenu__h" id="dm-occ" data-in>${t.occasions.heading}</p>
        <ul class="dmenu__links" aria-labelledby="dm-occ">${OCCASIONS.map(
          (o) => html`<li data-in><a href="${href(OCCASION_PATH[o], l)}" data-pic="occ:${o}"><span>${t.occasions[o].label}</span><span class="dmenu__n" data-n="occ:${o}"></span></a></li>`,
        )}</ul>
      </div>
      <div class="dmenu__col">
        <p class="dmenu__h" id="dm-more" data-in>${t.nav.more}</p>
        <ul class="dmenu__links" aria-labelledby="dm-more">
          ${'lookbook' in flags ? html`<li data-in><a href="${href('/lookbook', l)}">${t.lookbook.title}</a></li>` : ''}
          <li data-in><a href="${href('/te-ruajtura', l)}"><span>${t.saved.title}</span><span class="dmenu__n" data-saved></span></a></li>
          ${'stylist' in flags ? html`<li data-in><button type="button" data-open="stylist" aria-haspopup="dialog">${t.stylist.open}</button></li>` : ''}
          <li data-in><a href="${MESSAGE}" target="_blank" rel="noopener">${t.visit.ask}${OUT}</a></li>
          <li data-in><a href="${INSTAGRAM}" target="_blank" rel="noopener">${t.nav.instagram}${OUT}</a></li>
        </ul>
        <p class="dmenu__h" id="dm-visit" data-in>${t.nav.visit}</p>
        <p class="dmenu__addr" data-in>${t.visit.address}</p>
        <a class="dmenu__maps" href="${MAPS}" target="_blank" rel="noopener" data-in>${t.visit.maps}${OUT}</a>
        <button class="dmenu__motion" type="button" data-motion-toggle data-in>${motionStopped() ? t.motion.play : t.motion.stop}</button>
      </div>
      <a class="dmenu__pic" href="${href('/dyqani', l)}" tabindex="-1" aria-hidden="true" data-in>
        <span class="plate dmenu__plate"><span class="plate__inner"><img class="plate__img" alt="" decoding="async" /><span class="plate__scan"></span></span></span>
        <span class="dmenu__pic-name"></span>
        <span class="dmenu__pic-price"></span>
      </a>
    </div>`.value;
    button.after(sheet);
    button.setAttribute('aria-controls', sheet.id);
    const scrim = document.createElement('div');
    scrim.className = 'dmenu-scrim';
    scrim.hidden = true;
    document.body.appendChild(scrim);
    this.sheet = sheet;
    this.scrim = scrim;

    // the photograph follows the link under the pointer or the keyboard
    const follow = (e: Event) => {
      const a = (e.target as Element).closest<HTMLElement>('[data-pic]');
      if (a) this.picture(a.dataset.pic!);
    };
    sheet.addEventListener('pointerover', follow);
    sheet.addEventListener('focusin', follow);
    // a link in the sheet leads away: the sheet steps aside as the page turns
    sheet.addEventListener('click', (e) => {
      const a = (e.target as Element).closest('a[href]');
      if (a && !a.hasAttribute('target')) void this.close(false);
    });
    sheet.addEventListener('focusout', (e) => {
      const to = e.relatedTarget as Node | null;
      if (to && !sheet.contains(to) && to !== this.button) void this.close(false);
    });
  }

  /** What changes between openings: the open page, her size, her saved dresses, the counts. */
  private fill(): void {
    const sheet = this.sheet!;
    const t = copy[this.lang];
    const here = new URL(location.href);
    sheet.querySelectorAll<HTMLAnchorElement>('.dmenu__col a[href]:not([target])').forEach((a) => {
      const u = new URL(a.href);
      const on = u.pathname === here.pathname && ['kategoria', 'masa'].every((k) => (u.searchParams.get(k) ?? '') === (here.searchParams.get(k) ?? ''));
      if (on) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    const now = me.get();
    sheet.querySelectorAll<HTMLAnchorElement>('.dmenu__size').forEach((a) => {
      const s = a.dataset.size as keyof typeof SIZE_LETTER;
      const mine = s === now.size;
      a.classList.toggle('is-mine', mine);
      a.setAttribute('aria-label', mine ? `${t.sizes.label(s, SIZE_LETTER[s])}, ${t.me.yourSize.toLowerCase()}` : t.sizes.label(s, SIZE_LETTER[s]));
    });
    sheet.querySelector('[data-saved]')!.textContent = now.saved.length ? String(now.saved.length) : '';
    void catalogue(this.lang)
      .then((list) => {
        const n = new Map<string, number>([
          ['all', list.length],
          ['cat:new', list.filter((p) => p.isNew).length],
        ]);
        for (const c of CATEGORIES) n.set(`cat:${c}`, list.filter((p) => p.categories.includes(c)).length);
        for (const o of OCCASIONS) n.set(`occ:${o}`, forOccasion(list, o).length);
        sheet.querySelectorAll<HTMLElement>('[data-n]').forEach((el) => (el.textContent = n.get(el.dataset.n!) ? String(n.get(el.dataset.n!)) : ''));
      })
      .catch(() => {
        /* no counts this time; the links work without them */
      });
  }

  /** Shows the dress behind a link after a short rest, so a pointer crossing the sheet does not flash every photograph. */
  private picture(key: string, rest = 90): void {
    window.clearTimeout(this.timer);
    this.timer = window.setTimeout(async () => {
      const p = (await linkPictures(this.lang)).get(key);
      if (!p?.cover || p.id === this.shownId || !this.opened || !this.sheet) return;
      this.shownId = p.id;
      const box = this.sheet.querySelector<HTMLAnchorElement>('.dmenu__pic')!;
      box.href = href(`/fustan/${p.slug}`, this.lang);
      box.querySelector('.dmenu__pic-name')!.textContent = p.name;
      box.querySelector('.dmenu__pic-price')!.textContent = p.price !== null ? formatLek(p.price, this.lang) : '';
      showIn(box.querySelector<HTMLElement>('.dmenu__plate')!, p, PIC_SIZES);
    }, rest);
  }
}
