/**
 * The Shop: every dress as a spread (the photograph full height, its second photograph or its
 * page number, and a caption with price, sizes and one black button), turned page by page. The
 * index view (?pamja=indeks) is the shop's typeset table of contents. The size index filters both.
 * It is the home page's body under the hero, and /dyqani on its own.
 */
import { SIZES, SIZE_LETTER, formatLek, inStock, pad2, photoAt, photoSrcset, type Product, type ShopFilter, type Size } from '../../shared/catalog';
import { copy, href, type Lang } from '../../shared/copy';
import { html, raw, type Raw } from '../../shared/html';
import { SITE } from '../site';
import { stylistOn } from './layout';
import { flipId, folio, newTag, plate, price, sizePicker } from './parts';

export interface ShopState {
  size?: Size;
  /** A category, or "new": the dresses inside their two weeks as new. */
  category?: ShopFilter;
  view: 'spreads' | 'contents';
}

const params = (s: ShopState, over: Partial<ShopState> = {}) => {
  const n = { ...s, ...over };
  return { masa: n.size, kategoria: n.category, pamja: n.view === 'contents' ? 'indeks' : undefined };
};

const X = raw('<svg width="9" height="9" viewBox="0 0 10 10" aria-hidden="true"><path d="M1 1l8 8M9 1L1 9" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>');

/** Data the client needs to add a dress to the bag without another request. */
export const bagData = (p: Product) =>
  JSON.stringify({ id: p.id, slug: p.slug, name: p.name, price: p.price, cover: p.photos[0] ?? null, stock: p.stock });

function sizeIndex(lang: Lang, s: ShopState, counts: Record<Size, number>, cls: string): Raw {
  const t = copy[lang];
  return html`<nav class="${cls}" aria-label="${t.a11y.sizeIndex}">
    ${s.category && cls === 'size-strip'
      ? html`<a class="si si--cat" href="${href('/dyqani', lang, params(s, { category: undefined }))}" aria-label="${t.a11y.removeFilter}: ${t.categories[s.category]}"><span class="si__n">${t.categories[s.category]}</span>${X}</a>`
      : ''}
    <a class="si${!s.size ? ' is-on' : ''}" href="${href('/dyqani', lang, params(s, { size: undefined }))}" data-size="all"${!s.size ? raw(' aria-current="true"') : ''}>
      <span class="si__n">${t.sizes.all}</span>
    </a>
    ${SIZES.map((size) => {
      const on = s.size === size;
      const n = counts[size];
      const inner = html`<span class="si__n">${size}</span><span class="si__l">${SIZE_LETTER[size]}</span><span class="si__c" aria-hidden="true">${n}</span><span class="sr-only">${t.sizes.label(size, SIZE_LETTER[size])}, ${t.sizes.count(n)}</span>`;
      return n > 0 || on
        ? html`<a class="si${on ? ' is-on' : ''}" href="${href('/dyqani', lang, params(s, { size }))}" data-size="${size}"${on ? raw(' aria-current="true"') : ''}>${inner}</a>`
        : html`<span class="si is-out" aria-disabled="true">${inner}</span>`;
    })}
    <a class="si si--views" href="${href('/dyqani', lang, params(s, { view: s.view === 'contents' ? 'spreads' : 'contents' }))}" data-view-toggle>
      <span class="si__n">${s.view === 'contents' ? t.shop.spreads : t.shop.contents}</span>
    </a>
  </nav>`;
}

function spread(p: Product, i: number, total: number, lang: Lang, s: ShopState): Raw {
  const t = copy[lang];
  const second = p.photos[1];
  const url = href(`/fustan/${p.slug}`, lang, { masa: s.size });
  const sold = !inStock(p);
  const sizes = SIZES.filter((k) => p.stock[k] > 0).join(' ');
  return html`<li class="spread${second ? '' : ' spread--solo'}" id="f-${p.slug}" data-sizes="${sizes}" data-id="${p.id}">
    <article class="spread__page" aria-labelledby="n-${p.id}">
      <a class="spread__main" href="${url}" tabindex="-1" aria-hidden="true" data-fly>
        ${plate(p.photos[0], { alt: p.photos[0]?.alt || p.name, sizes: '(min-width: 1024px) 52vw, 100vw', eager: i === 0, target: 1600, flip: flipId(p), cls: 'spread__plate' })}
      </a>
      <div class="spread__side">
        ${second
          ? plate(second, { alt: second.alt || p.name, sizes: '(min-width: 1024px) 26vw, 1px', cls: 'spread__second' })
          : html`<p class="spread__page-no" aria-hidden="true"><span class="spread__page-n">${pad2(i + 1)}</span><span class="spread__page-of">/ ${pad2(total)}</span></p>`}
        <form class="spread__cap" data-add data-product="${bagData(p)}" novalidate>
          <h2 class="spread__name" id="n-${p.id}"><a href="${url}" data-fly-link>${p.name}</a>${s.category === 'new' ? '' : newTag(p, lang)}</h2>
          ${price(p, lang, 'price spread__price')}
          <p class="spread__me small" data-me-note hidden></p>
          ${sold ? html`<p class="spread__sold">${t.shop.soldOut}</p>` : sizePicker(p, lang, `size-${p.id}`, s.size)}
          <button class="btn btn--wide" type="submit" data-add-btn${sold ? raw(' disabled') : ''}>${sold ? t.shop.soldOut : t.product.add}</button>
          <p class="spread__folio">${second ? html`<span class="spread__num">${folio(i, total)}</span>` : html`<span></span>`}<a class="tlink" href="${url}" data-fly-link>${t.shop.open}</a></p>
        </form>
      </div>
    </article>
  </li>`;
}

/** A typeset contents line: number, name, a hairline leader, sizes, price. Phones show the plate. */
function tocItem(p: Product, i: number, lang: Lang, s: ShopState): Raw {
  const url = href(`/fustan/${p.slug}`, lang, { masa: s.size });
  const cover = p.photos[0];
  const second = p.photos[1];
  return html`<li class="toc__item" data-id="${p.id}">
    <a class="toc__link" href="${url}" data-fly-link data-flip="${flipId(p)}" data-name="${p.name}"${
      cover ? html` data-src="${photoAt(cover, 960)}" data-srcset="${photoSrcset(cover)}" data-lqip="${cover.lqip}"` : ''
    }${second ? html` data-src2="${photoAt(second, 960)}" data-srcset2="${photoSrcset(second)}"` : ''}>
      <span class="toc__num">${pad2(i + 1)}</span>
      ${plate(cover, { alt: '', sizes: '(min-width: 768px) 24vw, 46vw', eager: i === 0, target: 480, flip: flipId(p), cls: 'toc__plate', tag: 'span' })}
      <span class="toc__name">${p.name}${s.category === 'new' ? '' : newTag(p, lang)}</span>
      <span class="toc__lead" aria-hidden="true"></span>
      <span class="toc__sizes">${SIZES.map((k) => (p.stock[k] > 0 ? html`<span>${k}</span>` : html`<s>${k}</s>`))}</span>
      <span class="toc__price">${p.price !== null ? formatLek(p.price, lang) : ''}</span>
    </a>
  </li>`;
}

export function shopView(lang: Lang, all: Product[], s: ShopState, opts: { embedded?: boolean } = {}): Raw {
  const t = copy[lang];
  const cat = s.category;
  const inCategory = cat === 'new' ? all.filter((p) => p.isNew) : cat ? all.filter((p) => p.categories.includes(cat)) : all;
  const counts = Object.fromEntries(SIZES.map((k) => [k, inCategory.filter((p) => p.stock[k] > 0).length])) as Record<Size, number>;
  const list = s.size ? inCategory.filter((p) => p.stock[s.size!] > 0) : inCategory;
  const count = s.size ? t.shop.inSize(list.length, s.size) : t.shop.count(list.length);
  const title = s.category ? `${t.shop.title} · ${t.categories[s.category]}` : t.shop.title;
  const H = opts.embedded ? 'h2' : 'h1';

  let body: Raw;
  if (!all.length) {
    body = html`<div class="lb-empty lb-empty--tagline"><p class="lb-tagline" lang="en">${t.shop.tagline}</p><a class="btn" href="${SITE.instagram}" target="_blank" rel="noopener">${t.nav.instagram}</a></div>`;
  } else if (!list.length) {
    body = html`<div class="lb-empty"><p class="body-lg">${s.size ? t.shop.empty(s.size) : t.shop.emptyCategory}</p><a class="btn btn--line" href="${href('/dyqani', lang, params(s, { size: undefined, category: undefined }))}">${t.nav.all}</a></div>`;
  } else if (s.view === 'contents') {
    const first = list[0]!;
    body = html`<div class="toc-wrap">
      <ol class="toc" aria-label="${t.shop.contents}">${list.map((p, i) => tocItem(p, i, lang, s))}</ol>
      <div class="toc-preview" aria-hidden="true">
        ${plate(first.photos[0], { alt: '', sizes: '24vw', eager: true, target: 960, flip: flipId(first), cls: 'toc-preview__plate', tag: 'span' })}
        <span class="toc-preview__name" data-preview-name>${first.name}</span>
      </div>
    </div>`;
  } else {
    body = html`<ol class="spreads" aria-label="${t.a11y.spreads}">${list.map((p, i) => spread(p, i, list.length, lang, s))}</ol>`;
  }

  return html`<div class="lookbook" id="shop" data-lookbook data-view="${s.view}">
    <div class="lb-head">
      ${raw(`<${H} class="lb-title">`)}<span>${title}</span><span class="lb-title__count" data-lb-count>${count}</span>${raw(`</${H}>`)}
      <span class="lb-head__end">
        ${stylistOn() ? html`<button class="tlink lb-me" type="button" data-open="stylist" aria-haspopup="dialog">${t.stylist.open}</button>` : ''}
        <button class="tlink lb-me" type="button" data-open="me" aria-haspopup="dialog" data-me-label>${t.me.open}</button>
      </span>
    </div>
    ${sizeIndex(lang, s, counts, 'size-strip')}
    <div class="lb-body">
      ${body}
      ${sizeIndex(lang, s, counts, 'size-index')}
    </div>
  </div>`;
}

/** The dresses a visitor saved, from the list in the link (?f=slug,slug), so a shared list opens
 *  the same on a friend's phone. The page's script fills the link from the visitor's own list. */
export function savedView(lang: Lang, list: Product[], asked: number): Raw {
  const t = copy[lang];
  return html`<section class="saved container" data-saved-page>
      <h1 class="heading saved__title">${t.saved.title} <span class="lb-title__count">${list.length ? t.saved.count(list.length) : ''}</span></h1>
      ${list.length
        ? html`<p class="saved__acts"><button class="btn btn--line" type="button" data-saved-share>${t.saved.share}</button><span class="small" role="status" aria-live="polite" data-saved-status></span></p>`
        : html`<p class="body-lg saved__empty" data-saved-empty${asked ? '' : raw(' data-saved-fill')}>${t.saved.empty}</p>`}
    </section>
    ${list.length ? shopView(lang, list, { view: 'spreads' }, { embedded: true }) : ''}`;
}
