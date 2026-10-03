/**
 * Pages answer what a visitor told the shop about herself (me.ts): her size marked and chosen on a
 * dress page, the rental form filled with her date, her size marked in the shop's size strip, each
 * dress saying whether it is free on her date, and the dresses she saved. Applied on every page and
 * again whenever she changes her size, date or saved list.
 */
import { parseMeasures, type Size } from '../shared/catalog';
import { copy, href, type Lang } from '../shared/copy';
import { gsap, reducedMotion } from './motion';
import * as me from './me';
import { navigate } from './router';

const todayLocal = (): string => new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 10);

/** Confirmed rentals on a day, fetched once per day and kept for the visit. */
const bookedCache = new Map<string, Promise<{ id: string; size: Size }[]>>();
function bookedOn(day: string): Promise<{ id: string; size: Size }[]> {
  let hit = bookedCache.get(day);
  if (!hit) {
    hit = fetch(`/api/booked?date=${day}`)
      .then((r) => (r.ok ? (r.json() as Promise<{ booked: { id: string; size: Size }[] }>) : { booked: [] }))
      .then((x) => x.booked)
      .catch(() => []);
    bookedCache.set(day, hit);
  }
  return hit;
}

export function personal(main: HTMLElement, lang: Lang): () => void {
  const t = copy[lang];
  let run = 0;

  const apply = async () => {
    const mine = me.get();
    const date = mine.date && mine.date >= todayLocal() ? mine.date : null;
    const id = ++run;

    // the controls that open the drawer say what she has set
    main.querySelectorAll<HTMLElement>('[data-me-label]').forEach((b) => {
      const onDress = !!b.closest('.product__me');
      if (onDress) b.textContent = mine.size || Object.keys(mine.body).length ? t.me.change : t.me.find;
      else b.textContent = mine.size || date ? [mine.size ? `${t.me.yourSize} ${mine.size}` : '', date ? t.me.day(date) : ''].filter(Boolean).join(' · ') : t.me.open;
    });

    // ---- a dress page: her size for this dress, chosen and marked ----
    const form = main.querySelector<HTMLFormElement>('.product__form');
    if (form) {
      const rec = me.sizeFor(parseMeasures(form.dataset.measures ?? '{}'));
      const line = main.querySelector<HTMLElement>('[data-me-line]');
      main.querySelectorAll('.pick__size.is-mine').forEach((el) => el.classList.remove('is-mine'));
      if (line) line.textContent = '';
      if (rec && rec.size) {
        const input = form.querySelector<HTMLInputElement>(`input[type="radio"][value="${rec.size}"]`);
        input?.closest('.pick__size')?.classList.add('is-mine');
        if (input && !input.disabled && !form.querySelector('input[type="radio"]:checked')) {
          input.checked = true;
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
        if (line) {
          line.textContent = input?.disabled ? t.me.yoursSoldOut(rec.size) : `${t.me.forDress(rec.size)} (${rec.fromDress ? t.me.byDress : t.me.byChart}).`;
          if (input?.disabled && main.querySelector('form[data-request="restock"]')) {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'tlink';
            b.textContent = t.me.notify;
            b.addEventListener('click', () => openRestock(main, rec.size!));
            line.append(' ', b);
          }
        }
      } else if (rec && line) line.textContent = t.me.tooBig;

      // the rental form starts from her date and size
      const rent = main.querySelector<HTMLFormElement>('form[data-request="rental"]');
      if (rent) {
        const d = rent.elements.namedItem('eventDate') as HTMLInputElement | null;
        if (d && !d.value && date) d.value = date;
        const sel = rent.elements.namedItem('size') as HTMLSelectElement | null;
        if (sel && rec?.size && [...sel.options].some((o) => o.value === rec.size) && !sel.dataset.touched) sel.value = rec.size;
      }
    }

    // ---- the shop: her size in the size strip, and each dress against her date ----
    main.querySelectorAll('.si.is-mine').forEach((el) => el.classList.remove('is-mine'));
    if (mine.size) main.querySelectorAll(`.si[data-size="${mine.size}"]`).forEach((el) => el.classList.add('is-mine'));
    const dresses = [...main.querySelectorAll<HTMLElement>('.spread[data-id], .toc__item[data-id]')];
    const clear = () =>
      dresses.forEach((el) => {
        el.classList.remove('is-booked');
        const note = el.querySelector<HTMLElement>('[data-me-note]');
        if (note) note.hidden = true;
      });
    if (!date || !dresses.length) return clear();
    const booked = await bookedOn(date);
    if (id !== run) return; // she changed it again meanwhile
    const day = t.me.day(date);
    for (const el of dresses) {
      const sizes = booked.filter((b) => b.id === el.dataset.id).map((b) => b.size);
      const taken = mine.size ? sizes.includes(mine.size) : false;
      el.classList.toggle('is-booked', taken);
      const note = el.querySelector<HTMLElement>('[data-me-note]');
      if (!note) continue;
      note.textContent = taken ? t.me.booked(day) : sizes.length && !mine.size ? t.me.bookedIn(day, sizes.join(', ')) : t.me.free(day);
      note.hidden = false;
    }
  };

  // ---- saved dresses: the toggles, and the saved page ----
  const savedButtons = () =>
    main.querySelectorAll<HTMLButtonElement>('[data-save]').forEach((b) => {
      const on = me.isSaved(b.dataset.save!);
      b.setAttribute('aria-pressed', String(on));
      b.textContent = on ? t.saved.saved : t.saved.save;
    });
  const onClick = (e: Event) => {
    const b = (e.target as Element).closest<HTMLButtonElement>('[data-save]');
    if (b) {
      me.toggleSaved(b.dataset.save!);
      if (!reducedMotion()) gsap.fromTo(b, { scale: 0.92 }, { scale: 1, duration: 0.4, ease: 'back.out(3)', clearProps: 'transform' });
      return;
    }
    if ((e.target as Element).closest('[data-saved-share]')) void shareSaved(main, lang);
  };
  main.addEventListener('click', onClick);
  savedButtons();

  // the saved page opened without a list: fill the link from her own list (once)
  const fill = main.querySelector('[data-saved-fill]');
  const saved = me.get().saved;
  if (fill && saved.length) {
    const u = new URL(href('/te-ruajtura', lang), location.origin);
    u.searchParams.set('f', saved.join(','));
    navigate(u.pathname + u.search);
  }

  // the rental size she picks by hand is hers to keep
  main.querySelector('form[data-request="rental"] select[name="size"]')?.addEventListener('change', (e) => ((e.target as HTMLSelectElement).dataset.touched = '1'));

  void apply();
  const off = me.subscribe(() => {
    void apply();
    savedButtons();
  });
  return () => {
    off();
    main.removeEventListener('click', onClick);
  };
}

/** Opens "tell me when my size is back" with her size chosen. */
function openRestock(main: HTMLElement, size: Size): void {
  const form = main.querySelector<HTMLFormElement>('form[data-request="restock"]');
  if (!form) return;
  const acc = form.closest('details');
  if (acc) acc.open = true;
  const sel = form.elements.namedItem('size') as HTMLSelectElement | null;
  if (sel) sel.value = size;
  form.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'center' });
  window.setTimeout(() => (form.elements.namedItem('phone') as HTMLInputElement | null)?.focus({ preventScroll: true }), 400);
}

/** The list goes out as a link: the phone's share sheet, or copied on a computer. */
async function shareSaved(main: HTMLElement, lang: Lang): Promise<void> {
  const t = copy[lang].saved;
  const status = main.querySelector<HTMLElement>('[data-saved-status]');
  const url = location.href;
  if (navigator.share && window.matchMedia('(pointer: coarse)').matches) {
    try {
      await navigator.share({ title: document.title, text: t.shareText, url });
    } catch {
      /* the sheet was closed */
    }
    return;
  }
  try {
    await navigator.clipboard.writeText(url);
    if (status) status.textContent = t.copied;
  } catch {
    /* no clipboard: nothing to promise */
  }
}
