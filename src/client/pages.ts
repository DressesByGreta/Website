/** What each server-rendered page does once it is on screen (first load and every swap). */
import { SIZE_LETTER, formatLek, isSize, pad2, photoAt, type Zone } from '../shared/catalog';
import { copy, href, type Lang } from '../shared/copy';
import { esc } from '../shared/html';
import { bag, type Snap } from './bag';
import type { Drawers } from './drawers';
import { dropIntoBag, gsap, pageMotion, printPlate, reducedMotion } from './motion';
import { navigate, type PageInit } from './router';
import { personal } from './personal';
import { trackForm, trackView, visitSource } from './stats';

interface ProductData extends Snap {
  id: string;
}

export function initPage(lang: Lang, drawers: Drawers): PageInit {
  return (main, arrivedByFlight) => {
    const offs: (() => void)[] = [];
    pageMotion(main, { arrivedByFlight });
    main.querySelectorAll<HTMLFormElement>('form[data-add]').forEach((f) => addForm(f, lang));
    const kind = main.dataset.page;
    if (kind) trackView(kind);
    markNav();
    if (kind === 'home' || kind === 'shop') offs.push(indexPreview(main));
    if (kind === 'home' || kind === 'shop' || kind === 'product') offs.push(personal(main, lang));
    if (kind === 'product') offs.push(productPage(main, lang), viewer(main, lang), loupe(main));
    if (kind === 'checkout') offs.push(checkoutPage(main, lang));
    if (kind === 'confirmation') confirmationPage(main);
    if (kind === 'pay') payPage(main);
    if (kind === 'notfound') {
      main.querySelector<HTMLFormElement>('[data-missing-search]')?.addEventListener('submit', (e) => {
        e.preventDefault();
        drawers.search(String(new FormData(e.currentTarget as HTMLFormElement).get('q') ?? '').trim());
      });
    }
    drawers.syncLanguageLinks();
    return () => offs.forEach((off) => off());
  };
}

/* ------------------------------------------------------------ header + index ------------------------------------------------------------- */

/** The header's category links say which one is open (the header survives page swaps). */
function markNav(): void {
  const here = new URL(location.href);
  document.querySelectorAll<HTMLAnchorElement>('.nav__list a').forEach((a) => {
    const u = new URL(a.href);
    const on = u.pathname === here.pathname && (u.searchParams.get('kategoria') ?? '') === (here.searchParams.get('kategoria') ?? '');
    if (on) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
}

/** Desktop index: one preview plate beside the typeset list prints the line under the pointer. */
function indexPreview(main: HTMLElement): () => void {
  const box = main.querySelector<HTMLElement>('.toc-preview');
  const plate = box?.querySelector<HTMLElement>('.toc-preview__plate');
  const img = plate?.querySelector<HTMLImageElement>('img');
  const name = box?.querySelector<HTMLElement>('[data-preview-name]');
  if (!box || !plate || !img) return () => undefined;
  let current = plate.dataset.flipId ?? '';
  // Resting on a line for a moment prints its second photograph: the other angle, without a click.
  let rest = 0;
  const second = (a: HTMLAnchorElement) => {
    window.clearTimeout(rest);
    if (!a.dataset.src2) return;
    rest = window.setTimeout(() => {
      if (current !== a.dataset.flip) return;
      img.srcset = a.dataset.srcset2 ?? '';
      img.src = a.dataset.src2 ?? '';
      if (!reducedMotion()) printPlate(plate, 0, 0.55);
    }, 700);
  };
  const show = (e: Event) => {
    const a = (e.target as Element).closest<HTMLAnchorElement>('.toc__link');
    if (!a || !a.dataset.flip || a.dataset.flip === current || box.offsetParent === null) return;
    second(a);
    current = a.dataset.flip;
    plate.dataset.flipId = current;
    img.srcset = a.dataset.srcset ?? '';
    img.src = a.dataset.src ?? '';
    img.style.backgroundImage = a.dataset.lqip ? `url(${a.dataset.lqip})` : '';
    if (name) name.textContent = a.dataset.name ?? '';
    main.querySelectorAll('.toc__link.is-on').forEach((x) => x.classList.remove('is-on'));
    a.classList.add('is-on');
    if (!reducedMotion()) printPlate(plate, 0, 0.55);
  };
  main.addEventListener('pointerover', show);
  main.addEventListener('focusin', show);
  return () => {
    window.clearTimeout(rest);
    main.removeEventListener('pointerover', show);
    main.removeEventListener('focusin', show);
  };
}

/* ------------------------------------------------------------- photo viewer ------------------------------------------------------------- */

const ICON = {
  close: '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3l10 10M13 3L3 13" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>',
  prev: '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M10 2 4 8l6 6" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>',
  next: '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="m6 2 6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>',
};

/** Tapping a product photograph opens every photograph whole, one screen each. */
function viewer(main: HTMLElement, lang: Lang): () => void {
  const t = copy[lang];
  const buttons = [...main.querySelectorAll<HTMLButtonElement>('[data-zoom]')];
  const imgs = buttons.map((b) => b.querySelector<HTMLImageElement>('img')).filter((x): x is HTMLImageElement => !!x);
  if (!imgs.length) return () => undefined;

  const open = (start: number, opener: HTMLElement) => {
    const d = document.createElement('dialog');
    d.className = 'viewer';
    d.setAttribute('aria-label', t.a11y.gallery);
    const many = imgs.length > 1;
    d.innerHTML = `<div class="viewer__track" data-track>${imgs
      .map((im) => `<figure class="viewer__slide"><img src="${esc(im.currentSrc || im.src)}" srcset="${esc(im.srcset)}" sizes="100vw" alt="${esc(im.alt)}" decoding="async" /></figure>`)
      .join('')}</div>
      <p class="viewer__count" data-count aria-live="polite"></p>
      <button class="viewer__btn viewer__close" type="button" data-close aria-label="${esc(t.a11y.close)}">${ICON.close}</button>
      ${many ? `<button class="viewer__btn viewer__prev" type="button" data-step="-1" aria-label="${esc(t.a11y.prev)}">${ICON.prev}</button><button class="viewer__btn viewer__next" type="button" data-step="1" aria-label="${esc(t.a11y.next)}">${ICON.next}</button>` : ''}`;
    document.body.appendChild(d);
    const track = d.querySelector<HTMLElement>('[data-track]')!;
    const count = d.querySelector<HTMLElement>('[data-count]')!;
    let index = start;
    const say = () => (count.textContent = many ? t.a11y.photoOf(index + 1, imgs.length) : '');
    const goTo = (i: number, smooth = true) => {
      index = (i + imgs.length) % imgs.length;
      track.scrollTo({ left: index * track.clientWidth, behavior: smooth && !reducedMotion() ? 'smooth' : 'auto' });
      say();
    };
    const close = () => {
      d.close();
      d.remove();
      opener.focus({ preventScroll: true });
    };
    d.addEventListener('click', (e) => {
      const el = e.target as Element;
      if (el.closest('[data-close]')) return close();
      const step = el.closest<HTMLElement>('[data-step]');
      if (step) goTo(index + Number(step.dataset.step));
    });
    d.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') goTo(index + 1);
      if (e.key === 'ArrowLeft') goTo(index - 1);
    });
    d.addEventListener('cancel', (e) => {
      e.preventDefault();
      close();
    });
    track.addEventListener('scroll', () => {
      const i = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
      if (i !== index) {
        index = i;
        say();
      }
    });
    d.showModal();
    goTo(start, false);
    d.querySelector<HTMLElement>('[data-close]')?.focus();
    if (!reducedMotion()) gsap.fromTo(d, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'power2.out' });
  };

  const onClick = (e: Event) => {
    const b = (e.target as Element).closest<HTMLButtonElement>('[data-zoom]');
    if (b) open(Number(b.dataset.zoom ?? 0), b);
  };
  main.addEventListener('click', onClick);
  return () => main.removeEventListener('click', onClick);
}

/**
 * The loupe: on a computer, the pointer over a dress's photograph carries a square of the fabric at
 * two and a half times, read from the sharpest width the photograph has (the 2400px original where
 * the admin has one), so sequins, lace and tulle can be seen before buying. Square like every corner
 * on the site; it follows with a short ease (at once with reduced motion). Clicking still opens the viewer.
 */
const LOUPE = { size: 240, zoom: 2.5 };

function sharpest(img: HTMLImageElement): string {
  let best = { w: 0, url: img.currentSrc || img.src };
  for (const part of img.srcset.split(',')) {
    const [url, w] = part.trim().split(/\s+/);
    const n = parseInt(w ?? '', 10);
    if (url && n > best.w) best = { w: n, url };
  }
  return best.url;
}

function loupe(main: HTMLElement): () => void {
  if (!window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 1024px)').matches) return () => undefined;
  const lens = document.createElement('span');
  lens.className = 'loupe';
  lens.setAttribute('aria-hidden', 'true');
  const ease = reducedMotion() ? 0 : 0.28;
  const xTo = gsap.quickTo(lens, 'x', { duration: ease, ease: 'power3.out' });
  const yTo = gsap.quickTo(lens, 'y', { duration: ease, ease: 'power3.out' });
  let host: HTMLElement | null = null;
  let img: HTMLImageElement | null = null;

  const place = (e: PointerEvent, now = false) => {
    if (!host || !img || !img.naturalWidth) return;
    const box = host.getBoundingClientRect();
    const px = e.clientX - box.left;
    const py = e.clientY - box.top;
    // where the photograph really sits inside its frame (object-fit: cover and its object-position)
    const ratio = img.naturalWidth / img.naturalHeight;
    const wide = ratio > box.width / box.height;
    const w = wide ? box.height * ratio : box.width;
    const h = wide ? box.height : box.width / ratio;
    const [ox, oy] = getComputedStyle(img).objectPosition.split(' ').map((v) => parseFloat(v) / 100);
    const left = (box.width - w) * (ox ?? 0.5);
    const top = (box.height - h) * (oy ?? 0.5);
    const fx = (px - left) / w;
    const fy = (py - top) / h;
    lens.style.backgroundSize = `${w * LOUPE.zoom}px ${h * LOUPE.zoom}px`;
    lens.style.backgroundPosition = `${-(fx * w * LOUPE.zoom - LOUPE.size / 2)}px ${-(fy * h * LOUPE.zoom - LOUPE.size / 2)}px`;
    const x = px - LOUPE.size / 2;
    const y = py - LOUPE.size / 2;
    if (now) gsap.set(lens, { x, y });
    else {
      xTo(x);
      yTo(y);
    }
  };
  const enter = (e: PointerEvent) => {
    const b = (e.target as Element).closest<HTMLElement>('.product__zoom');
    if (!b || b === host) return;
    host = b;
    img = b.querySelector<HTMLImageElement>('img');
    if (!img) return;
    lens.style.backgroundImage = `url("${sharpest(img)}")`;
    b.appendChild(lens);
    place(e, true);
    gsap.fromTo(lens, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: reducedMotion() ? 0 : 0.3, ease: 'power3.out', overwrite: 'auto' });
  };
  const leave = (e: PointerEvent) => {
    if (!host || (e.relatedTarget instanceof Node && host.contains(e.relatedTarget))) return;
    host = null;
    gsap.to(lens, { opacity: 0, scale: 0.9, duration: reducedMotion() ? 0 : 0.2, ease: 'power2.in', onComplete: () => lens.remove() });
  };
  const move = (e: PointerEvent) => place(e);
  main.addEventListener('pointerover', enter);
  main.addEventListener('pointerout', leave);
  main.addEventListener('pointermove', move, { passive: true });
  return () => {
    main.removeEventListener('pointerover', enter);
    main.removeEventListener('pointerout', leave);
    main.removeEventListener('pointermove', move);
    lens.remove();
  };
}

/* --------------------------------------------------------------- add to bag --------------------------------------------------------------- */

function addForm(form: HTMLFormElement, lang: Lang): void {
  const t = copy[lang];
  let data: ProductData;
  try {
    data = JSON.parse(form.dataset.product ?? '') as ProductData;
  } catch {
    return;
  }
  const btn = form.querySelector<HTMLButtonElement>('[data-add-btn]');
  const hint = form.querySelector<HTMLElement>('[data-pick-hint]');
  const say = (text: string) => {
    if (hint) hint.textContent = text;
  };
  let timer = 0;
  const label = (text: string) => {
    if (!btn) return;
    btn.textContent = text;
    window.clearTimeout(timer);
    timer = window.setTimeout(() => (btn.textContent = t.product.add), 1600);
  };

  form.addEventListener('change', (e) => {
    const r = e.target as HTMLInputElement;
    if (r.type !== 'radio') return;
    say(r.dataset.left === '1' ? t.product.lastOne : '');
  });

  // A sold-out size answers a tap with a small shake, so it reads as "not this one", not as broken.
  form.addEventListener('click', (e) => {
    const out = (e.target as Element).closest<HTMLElement>('.pick__size.is-out');
    if (out && !reducedMotion()) gsap.fromTo(out, { x: -3 }, { x: 0, duration: 0.45, ease: 'elastic.out(1, 0.3)', overwrite: true });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const picked = form.querySelector<HTMLInputElement>('input[type="radio"]:checked');
    if (!picked || !isSize(picked.value)) {
      say(t.product.chooseSize);
      label(t.product.chooseSize);
      form.querySelector<HTMLInputElement>('input[type="radio"]:not(:disabled)')?.focus();
      if (!reducedMotion()) gsap.fromTo(form.querySelector('.pick__row'), { x: -4 }, { x: 0, duration: 0.4, ease: 'elastic.out(1, 0.3)' });
      return;
    }
    const { id, ...snap } = data;
    if (!bag.add(id, picked.value, snap)) {
      say(t.bag.onlyLeft(Number(picked.dataset.left ?? 0)));
      return;
    }
    const card = form.closest('.spread, .product');
    const plate = card?.querySelector<HTMLElement>('.spread__plate, .product__plate') ?? null;
    dropIntoBag(plate);
    // a short tick on phones that can (Android); iPhones ignore it
    if (window.matchMedia('(pointer: coarse)').matches) navigator.vibrate?.(12);
    label(t.product.added);
    say('');
  });
}

/* ----------------------------------------------------------------- product ---------------------------------------------------------------- */

/**
 * Share a dress: on a phone its own share sheet (WhatsApp, Instagram, messages); on a computer the
 * link is copied, which is what people expect there. The link says it was shared, so the stats
 * can count those visits.
 */
function shareButton(main: HTMLElement, lang: Lang): void {
  const b = main.querySelector<HTMLButtonElement>('[data-share]');
  const status = main.querySelector<HTMLElement>('[data-share-status]');
  if (!b) return;
  const t = copy[lang].product;
  b.addEventListener('click', async () => {
    const url = new URL(location.pathname, location.origin);
    if (lang !== 'sq') url.searchParams.set('lang', lang);
    url.searchParams.set('utm_source', 'share');
    // the dress's name alone, without the "new" word that may follow it in the heading
    const name = main.querySelector('.product__name')?.firstChild?.textContent?.trim();
    const title = name || document.title;
    if (navigator.share && window.matchMedia('(pointer: coarse)').matches) {
      try {
        await navigator.share({ title, url: url.href });
      } catch {
        /* the sheet was closed */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url.href);
      b.textContent = t.copied;
      if (status) status.textContent = t.copied;
      window.setTimeout(() => {
        b.textContent = t.share;
        if (status) status.textContent = '';
      }, 2000);
    } catch {
      /* no clipboard here: nothing to promise */
    }
  });
}

/**
 * The dress page's requests (rent this dress, tell me when a size is back): posted to /api/requests;
 * a field the server turns down is marked beside it, a sent request leaves its thank-you in place.
 */
function requestForms(main: HTMLElement, lang: Lang): void {
  const t = copy[lang].product;
  main.querySelectorAll<HTMLFormElement>('form[data-request]').forEach((form) => {
    const status = form.querySelector<HTMLElement>('.rq__status');
    const mark = (names: string[]) => {
      form.querySelectorAll<HTMLElement>('.field__error').forEach((p) => (p.hidden = true));
      form.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
      for (const n of names) {
        const input = form.querySelector<HTMLElement>(`[name="${n}"]`);
        const err = input && form.querySelector<HTMLElement>(`#${input.id}-error`);
        if (!input || !err) continue;
        input.setAttribute('aria-invalid', 'true');
        input.setAttribute('aria-describedby', err.id);
        err.textContent = t.formCheck;
        err.hidden = false;
      }
      form.querySelector<HTMLElement>('[aria-invalid]')?.focus();
    };
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form)) as Record<string, string>;
      const missing = [...form.querySelectorAll<HTMLInputElement>('[required]')].filter((el) => !el.value.trim()).map((el) => el.name);
      if (missing.length) return mark(missing);
      const btn = form.querySelector<HTMLButtonElement>('button[type="submit"]');
      if (btn) btn.disabled = true;
      try {
        const res = await fetch('/api/requests', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ ...data, kind: form.dataset.request, productId: form.dataset.productId, lang }),
        });
        if (res.status === 201) {
          mark([]);
          form.reset();
          if (status) status.textContent = form.dataset.request === 'rental' ? t.rentDone : t.restockDone;
          return;
        }
        const body = (await res.json().catch(() => ({}))) as { fields?: string[] };
        if (res.status === 400 && body.fields?.length) mark(body.fields);
        else if (status) status.textContent = t.formFailed;
      } catch {
        if (status) status.textContent = t.formFailed;
      } finally {
        if (btn) btn.disabled = false;
      }
    });
  });
}

/** The WhatsApp link carries the dress and, once one is picked, the size. */
function whatsappLink(main: HTMLElement, lang: Lang): void {
  const a = main.querySelector<HTMLAnchorElement>('[data-wa]');
  const form = main.querySelector<HTMLFormElement>('.product__form');
  if (!a || !form) return;
  const update = () => {
    const size = form.querySelector<HTMLInputElement>('input[type="radio"]:checked')?.value ?? null;
    const url = new URL(location.pathname, location.origin);
    if (lang !== 'sq') url.searchParams.set('lang', lang);
    a.href = `https://wa.me/${a.dataset.wa}?text=${encodeURIComponent(copy[lang].product.waText(a.dataset.waName ?? '', size, url.href))}`;
  };
  form.addEventListener('change', update);
  update();
}

function productPage(main: HTMLElement, lang: Lang): () => void {
  const t = copy[lang];
  shareButton(main, lang);
  requestForms(main, lang);
  whatsappLink(main, lang);
  const observers: IntersectionObserver[] = [];
  const counter = main.querySelector<HTMLElement>('[data-gallery-i]');
  const gallery = main.querySelector<HTMLElement>('[data-gallery]');
  const bar = main.querySelector<HTMLElement>('[data-gallery-bar]');
  const offs: (() => void)[] = [];
  if (counter && gallery) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) if (en.isIntersecting) counter.textContent = pad2([...gallery.children].indexOf(en.target) + 1);
      },
      { root: gallery, threshold: 0.6 },
    );
    [...gallery.children].forEach((li) => io.observe(li));
    observers.push(io);
  }
  // The hairline under the photographs fills as they are swiped: how far through the dress you are.
  if (gallery && bar) {
    const fill = () => bar.style.setProperty('--g', ((gallery.scrollLeft + gallery.clientWidth) / Math.max(1, gallery.scrollWidth)).toFixed(4));
    gallery.addEventListener('scroll', fill, { passive: true });
    offs.push(() => gallery.removeEventListener('scroll', fill));
  }

  const form = main.querySelector<HTMLFormElement>('.product__form');
  const buybar = main.querySelector<HTMLElement>('[data-buybar]');
  if (form && buybar) {
    const bar = buybar;
    const io = new IntersectionObserver(([en]) => {
      const show = !!en && !en.isIntersecting && en.boundingClientRect.top < 0;
      if (show === !bar.hidden) return;
      bar.hidden = !show;
      if (show && !reducedMotion()) gsap.fromTo(bar, { yPercent: 100 }, { yPercent: 0, duration: 0.35, ease: 'expo.out' });
    });
    io.observe(form);
    observers.push(io);
    bar.querySelector('[data-buybar-btn]')?.addEventListener('click', () => {
      if (form.querySelector('input[type="radio"]:checked')) return form.requestSubmit();
      form.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'center' });
      const hint = form.querySelector<HTMLElement>('[data-pick-hint]');
      if (hint) hint.textContent = t.product.chooseSize;
      window.setTimeout(() => form.querySelector<HTMLInputElement>('input[type="radio"]:not(:disabled)')?.focus({ preventScroll: true }), 400);
    });
  }
  return () => {
    observers.forEach((o) => o.disconnect());
    offs.forEach((off) => off());
  };
}

/* ----------------------------------------------------------------- checkout --------------------------------------------------------------- */

const PHONE_RE = /^\+?[\d\s()./-]+$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function orderRef(): string {
  const sig = bag.lines().map((l) => `${l.id}:${l.size}:${l.qty}`).join('|');
  try {
    const saved = JSON.parse(sessionStorage.getItem('greta-order-ref') ?? 'null') as { sig: string; ref: string } | null;
    if (saved && saved.sig === sig) return saved.ref;
    const ref = crypto.randomUUID();
    sessionStorage.setItem('greta-order-ref', JSON.stringify({ sig, ref }));
    return ref;
  } catch {
    return crypto.randomUUID();
  }
}

function checkoutPage(main: HTMLElement, lang: Lang): () => void {
  const t = copy[lang];
  const tc = t.checkout;
  const root = main.querySelector<HTMLElement>('[data-checkout]');
  const form = main.querySelector<HTMLFormElement>('[data-co-form]');
  if (!root || !form) return () => undefined;
  const zones = JSON.parse(root.dataset.zones ?? '[]') as Pick<Zone, 'id' | 'fee'>[];
  const grid = root.querySelector<HTMLElement>('[data-co-grid]')!;
  const empty = root.querySelector<HTMLElement>('[data-co-empty]')!;
  const items = root.querySelector<HTMLElement>('[data-co-items]')!;
  const errorBox = root.querySelector<HTMLElement>('[data-co-error]')!;
  const submit = root.querySelector<HTMLButtonElement>('[data-co-submit]')!;

  const zoneFee = (): number | null => {
    const id = (form.elements.namedItem('zone') as RadioNodeList | null)?.value;
    return zones.find((z) => z.id === id)?.fee ?? null;
  };

  const render = () => {
    const lines = bag.lines();
    empty.hidden = lines.length > 0;
    grid.hidden = lines.length === 0;
    items.innerHTML = lines
      .map((l) => {
        const img = l.snap.cover ? `<img src="${esc(photoAt(l.snap.cover, 480))}" alt="" width="56" height="75" loading="lazy" decoding="async" />` : '<span></span>';
        const total = l.snap.price !== null ? formatLek(l.snap.price * l.qty, lang) : '';
        return `<li class="co-item${l.gone ? ' is-gone' : ''}">${img}<span class="co-item__meta"><span class="ui">${esc(l.snap.name)}</span><span class="small">${esc(
          `${t.bag.size} ${l.size} (${SIZE_LETTER[l.size]}) · ${t.bag.qty} ${l.qty}`,
        )}</span>${l.gone ? `<span class="bag__warn">${esc(t.bag.unavailable)}</span>` : ''}</span><span class="ui">${esc(total)}</span></li>`;
      })
      .join('');
    const sub = bag.subtotal();
    const fee = zoneFee();
    root.querySelector('[data-co-subtotal]')!.textContent = formatLek(sub, lang);
    root.querySelector('[data-co-shipping]')!.textContent = fee === null ? tc.shippingTbc : fee === 0 ? tc.shippingFree : formatLek(fee, lang);
    root.querySelector('[data-co-total]')!.textContent = formatLek(sub + (fee ?? 0), lang);
    submit.disabled = lines.some((l) => l.gone);
  };

  const off = bag.subscribe(render);
  void bag.refresh(lang);
  form.addEventListener('change', (e) => {
    if ((e.target as HTMLInputElement).name === 'zone') render();
  });

  const fieldError = (name: string, message: string | null) => {
    const wrap = form.querySelector<HTMLElement>(`[data-field="${name}"]`);
    const input = form.querySelector<HTMLInputElement>(`[name="${name}"]`);
    const err = wrap?.querySelector<HTMLElement>('.field__error');
    if (!wrap || !err) return;
    err.hidden = !message;
    err.textContent = message ?? '';
    if (input) {
      input.toggleAttribute('aria-invalid', Boolean(message));
      const ids = [input.id + '-hint', input.id + '-error'].filter((id) => form.querySelector(`#${CSS.escape(id)}`) && (id.endsWith('-hint') || message));
      if (ids.length) input.setAttribute('aria-describedby', ids.join(' '));
    }
  };

  form.addEventListener('input', (e) => fieldError((e.target as HTMLInputElement).name, null));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorBox.hidden = true;
    const val = (n: string) => ((form.elements.namedItem(n) as HTMLInputElement | null)?.value ?? '').trim();
    const problems: [string, string][] = [];
    if (val('name').length < 2) problems.push(['name', tc.required]);
    const phone = val('phone');
    const digits = phone.replace(/\D/g, '');
    if (!phone) problems.push(['phone', tc.required]);
    else if (!PHONE_RE.test(phone) || digits.length < 8 || digits.length > 15) problems.push(['phone', tc.phoneInvalid]);
    const email = val('email');
    if (email && !EMAIL_RE.test(email)) problems.push(['email', tc.emailInvalid]);
    if (val('city').length < 2) problems.push(['city', tc.required]);
    if (val('address').length < 5) problems.push(['address', tc.required]);
    ['name', 'phone', 'email', 'city', 'address'].forEach((n) => fieldError(n, problems.find(([k]) => k === n)?.[1] ?? null));
    trackForm('submit');
    if (problems.length) {
      trackForm('invalid', problems.map(([k]) => k));
      form.querySelector<HTMLElement>(`[name="${problems[0]![0]}"]`)?.focus();
      return;
    }
    const lines = bag.lines();
    if (!lines.length || lines.some((l) => l.gone)) return;

    submit.disabled = true;
    submit.textContent = tc.placing;
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ref: orderRef(),
          items: lines.map((l) => ({ id: l.id, size: l.size, qty: l.qty })),
          name: val('name'),
          phone,
          email,
          zone: val('zone') || (form.elements.namedItem('zone') as RadioNodeList | null)?.value,
          city: val('city'),
          address: val('address'),
          notes: val('notes'),
          payment: (form.elements.namedItem('payment') as RadioNodeList | null)?.value ?? 'cod',
          website: val('website'),
          lang,
          source: visitSource(),
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { id?: string; payUrl?: string | null; error?: string; fields?: { field: string }[]; unavailable?: { name: string; size: string }[] };
      if (res.ok && body.id) {
        try {
          sessionStorage.removeItem('greta-order-ref');
        } catch {
          /* ignore */
        }
        try {
          sessionStorage.setItem('greta-just-ordered', body.id);
        } catch {
          /* ignore */
        }
        if (body.payUrl) {
          location.href = body.payUrl;
          return;
        }
        bag.clear();
        navigate(href(`/porosia/${body.id}`, lang));
        return;
      }
      if (res.status === 409 && body.unavailable?.length) {
        errorBox.textContent = body.unavailable.map((u) => tc.soldOut(u.name, u.size)).join(' ');
        void bag.refresh(lang);
      } else if (res.status === 400 && body.fields?.length) {
        body.fields.forEach((f) => fieldError(f.field, tc.required));
        errorBox.textContent = tc.failed;
      } else {
        errorBox.textContent = tc.failed;
      }
      errorBox.hidden = false;
    } catch {
      errorBox.textContent = tc.failed;
      errorBox.hidden = false;
    } finally {
      submit.disabled = bag.lines().some((l) => l.gone);
      submit.textContent = tc.place;
    }
  });

  return () => {
    off();
  };
}

/* -------------------------------------------------------------- confirmation -------------------------------------------------------------- */

function confirmationPage(main: HTMLElement): void {
  let data: { status?: string } = {};
  try {
    data = JSON.parse(main.dataset.pageJson || '{}') as { status?: string };
  } catch {
    /* no data */
  }
  // The bag empties once the order stands: after a cash order, or once a card payment went through.
  // Only the order this bag just placed may empty it; an old confirmation reopened later must not.
  let mine = false;
  try {
    mine = sessionStorage.getItem('greta-just-ordered') === location.pathname.split('/').pop();
    if (mine && data.status !== 'awaiting_payment') sessionStorage.removeItem('greta-just-ordered');
  } catch {
    /* no storage: keep the bag */
  }
  if (mine && data.status && data.status !== 'cancelled' && data.status !== 'awaiting_payment') bag.clear();
}

/* ------------------------------------------------------------- test gateway -------------------------------------------------------------- */

function payPage(main: HTMLElement): void {
  const root = main.querySelector<HTMLElement>('[data-pay]');
  if (!root) return;
  root.querySelectorAll<HTMLButtonElement>('[data-pay-result]').forEach((b) =>
    b.addEventListener('click', async () => {
      root.querySelectorAll('button').forEach((x) => (x.disabled = true));
      await fetch(`/api/pay/test/${root.dataset.order}`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ result: b.dataset.payResult }),
      }).catch(() => undefined);
      navigate(root.dataset.back ?? '/');
    }),
  );
}
