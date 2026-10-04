/** A dress: every photograph down the left, the caption held beside it, the next dress at the foot. */
import { MEASURES, SIZES, formatLek, hasMeasures, pad2, photoAt, videoUrl, type Product, type Size, type Zone } from '../../shared/catalog';
import { copy, href, type Lang } from '../../shared/copy';
import { html, raw, type Raw } from '../../shared/html';
import type { Returns } from '../../shared/legal';
import { SITE } from '../site';
import type { Review } from '../reviews';
import { bagData } from './shop';
import { voicesView } from './voices';
import { flipId, folio, newTag, plate, price, sizePicker } from './parts';

/** Where the shop delivers and for how much, as set in the admin (a fee left empty is confirmed by phone). */
function deliveryZones(lang: Lang, zones: Zone[]): Raw | '' {
  const t = copy[lang];
  const on = zones.filter((z) => z.enabled);
  if (!on.length) return '';
  return html`<ul class="body acc__list">${on.map((z) => html`<li>${t.product.deliveryZone(t.checkout.zones[z.id], z.fee === null ? t.product.feeByPhone : z.fee === 0 ? '0' : formatLek(z.fee, lang))}</li>`)}</ul>`;
}

/** What the dress page needs beyond the dress: the shop's WhatsApp number, booked dates, today in Tirana. */
export interface ProductExtras {
  whatsapp: string | null;
  booked: { date: string; size: Size }[];
  today: string;
  maxDay: string;
  reviews: Review[];
}

/** A WhatsApp number in international digits: an Albanian 06x number gains 355, anything else keeps its own code. */
export function waNumber(phone: string): string | null {
  let d = phone.replace(/[^\d+]/g, '');
  if (!d) return null;
  if (d.startsWith('+')) d = d.slice(1);
  else if (d.startsWith('00')) d = d.slice(2);
  else if (d.startsWith('0')) d = `355${d.slice(1)}`;
  return /^\d{8,15}$/.test(d) ? d : null;
}

/** The measurements in centimetres: a row per size that has any, the length beneath. */
function measuresTable(lang: Lang, p: Product): Raw | '' {
  const t = copy[lang].product;
  const m = p.measures;
  if (!hasMeasures(m)) return '';
  const cols = MEASURES.filter((k) => SIZES.some((s) => m.sizes[s]?.[k] !== undefined));
  const rows = SIZES.filter((s) => m.sizes[s]);
  return html`<details class="acc"><summary class="acc__sum">${t.measures}</summary><div class="acc__body">
    ${rows.length
      ? html`<table class="measures"><thead><tr><th scope="col">${t.size}</th>${cols.map((k) => html`<th scope="col">${t.measure[k]}</th>`)}</tr></thead>
          <tbody>${rows.map((s) => html`<tr><th scope="row">${s}</th>${cols.map((k) => html`<td>${m.sizes[s]?.[k] ?? ''}</td>`)}</tr>`)}</tbody></table>`
      : ''}
    ${m.length !== undefined ? html`<p class="body">${t.measure.length} ${m.length} cm</p>` : ''}
    <p class="small">${t.measuresNote}</p>
  </div></details>`;
}

/** A small form for a request (rent this dress, tell me when a size is back), posted by the page's script. */
function field(id: string, label: string, input: Raw): Raw {
  return html`<div class="field"><label class="field__label" for="${id}">${label}</label>${input}<p class="field__error" id="${id}-error" hidden></p></div>`;
}

function rentalForm(lang: Lang, p: Product, x: ProductExtras): Raw {
  const t = copy[lang];
  const id = (n: string) => `rq-rent-${n}`;
  const inStockSizes = SIZES.filter((s) => p.stock[s] > 0);
  const sizes = inStockSizes.length ? inStockSizes : SIZES;
  return html`<details class="acc" data-request-acc><summary class="acc__sum">${t.product.rentTitle}</summary><div class="acc__body">
    <p class="body">${t.product.rentIntro}</p>
    ${x.booked.length ? html`<p class="small rq-booked"><span>${t.product.booked}</span> ${x.booked.map((b) => t.product.bookedOn(b.date, b.size)).join(', ')}</p>` : ''}
    <form class="rq" data-request="rental" data-product-id="${p.id}" novalidate>
      ${field(id('eventDate'), t.product.rentDate, html`<input class="field__input" id="${id('eventDate')}" name="eventDate" type="date" min="${x.today}" max="${x.maxDay}" required aria-required="true" />`)}
      ${field(id('size'), t.product.size, html`<select class="field__input" id="${id('size')}" name="size" required>${sizes.map((s) => html`<option value="${s}">${s}</option>`)}</select>`)}
      ${field(id('name'), t.checkout.name, html`<input class="field__input" id="${id('name')}" name="name" autocomplete="name" maxlength="80" required aria-required="true" />`)}
      ${field(id('phone'), t.checkout.phone, html`<input class="field__input" id="${id('phone')}" name="phone" type="tel" autocomplete="tel" inputmode="tel" maxlength="30" required aria-required="true" />`)}
      ${field(id('note'), t.product.noteOptional, html`<textarea class="field__input field__input--area" id="${id('note')}" name="note" rows="2" maxlength="500"></textarea>`)}
      <input class="rq__trap" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" />
      <button class="btn btn--line btn--wide" type="submit">${t.product.rentSend}</button>
      <p class="rq__status small" role="status" aria-live="polite"></p>
    </form>
  </div></details>`;
}

function restockForm(lang: Lang, p: Product): Raw | '' {
  const t = copy[lang];
  const out = SIZES.filter((s) => p.stock[s] <= 0);
  if (!out.length) return '';
  const id = (n: string) => `rq-back-${n}`;
  return html`<details class="acc" data-request-acc><summary class="acc__sum">${t.product.restockTitle}</summary><div class="acc__body">
    <p class="body">${t.product.restockIntro}</p>
    <form class="rq" data-request="restock" data-product-id="${p.id}" novalidate>
      ${field(id('size'), t.product.size, html`<select class="field__input" id="${id('size')}" name="size" required>${out.map((s) => html`<option value="${s}">${s}</option>`)}</select>`)}
      ${field(id('phone'), t.checkout.phone, html`<input class="field__input" id="${id('phone')}" name="phone" type="tel" autocomplete="tel" inputmode="tel" maxlength="30" required aria-required="true" />`)}
      <input class="rq__trap" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" />
      <button class="btn btn--line btn--wide" type="submit">${t.product.restockSend}</button>
      <p class="rq__status small" role="status" aria-live="polite"></p>
    </form>
  </div></details>`;
}

export function productView(lang: Lang, p: Product, index: number, total: number, next: Product | null, zones: Zone[], x: ProductExtras, size?: Size): Raw {
  const t = copy[lang];
  const sold = !Object.values(p.stock).some((n) => n > 0);
  const paragraphs = p.description.split(/\n{2,}/).map((s) => s.trim()).filter(Boolean);
  // the video, when there is one, is the gallery's second item
  const items = p.photos.length + (p.video ? 1 : 0);
  const motion = p.video
    ? html`<li class="product__photo product__photo--video">
        <span class="plate product__plate"><span class="plate__inner">
          <video class="plate__img product__video" muted playsinline loop preload="none" poster="${photoAt(p.video.poster, 960)}" width="${p.video.w}" height="${p.video.h}" data-src="${videoUrl(p.id, p.video)}" aria-label="${t.product.video}"></video>
          <span class="plate__scan" aria-hidden="true"></span>
        </span></span>
        <button class="product__vbtn" type="button" data-video-toggle aria-pressed="false">${t.product.videoPause}</button>
      </li>`
    : '';
  return html`<article class="product" data-product="${bagData(p)}">
      <div class="product__gallery">
        <ol class="product__photos" aria-label="${t.a11y.gallery}" data-gallery>
          ${p.photos.map(
            (ph, i) =>
              html`<li class="product__photo"><button class="product__zoom" type="button" data-zoom="${i}" aria-label="${t.a11y.zoom}: ${t.a11y.photoOf(i + 1, p.photos.length)}">${plate(ph, {
                alt: ph.alt || (i === 0 ? p.name : ''),
                sizes: '(min-width: 1024px) 56vw, 100vw',
                eager: i === 0,
                target: 1600,
                flip: i === 0 ? flipId(p) : undefined,
                cls: 'product__plate',
                tag: 'span',
              })}</button></li>${i === 0 ? motion : ''}`,
          )}
        </ol>
        ${items > 1
          ? html`<p class="product__count" aria-hidden="true"><span data-gallery-i>01</span> / ${pad2(items)}</p>
              <span class="product__progress" aria-hidden="true"><span data-gallery-bar style="--g:${(1 / items).toFixed(4)}"></span></span>`
          : ''}
      </div>

      <div class="product__info">
        <div class="product__hold">
          <h1 class="product__name">${p.name}${newTag(p, lang)}</h1>
          ${price(p, lang, 'price product__price')}
          <form class="product__form" data-add data-product="${bagData(p)}" data-measures="${JSON.stringify(p.measures)}" novalidate>
            ${sold ? html`<p class="spread__sold">${t.shop.soldOut}</p>` : sizePicker(p, lang, 'size', size)}
            <p class="pick__hint small" data-pick-hint aria-live="polite"></p>
            ${p.fit ? html`<p class="small product__fit"><span>${t.product.fit}</span> ${p.fit}</p>` : ''}
            <p class="small product__me"><span data-me-line></span> <button class="tlink" type="button" data-open="me" aria-haspopup="dialog" data-me-label>${t.me.find}</button></p>
            <button class="btn btn--wide" type="submit" data-add-btn${sold ? raw(' disabled') : ''}>${sold ? t.shop.soldOut : t.product.add}</button>
          </form>
          <p class="product__trust"><span>${t.checkout.cod}</span><span aria-hidden="true">·</span><a href="${href('/', lang)}#visit">${t.nav.visit}</a></p>
          <p class="small product__guide">${t.sizes.guide}</p>
          ${paragraphs.length
            ? html`<details class="acc" open><summary class="acc__sum">${t.product.description}</summary><div class="acc__body">${paragraphs.map((s) => html`<p class="body">${s}</p>`)}</div></details>`
            : ''}
          ${measuresTable(lang, p)}
          ${rentalForm(lang, p, x)}
          ${restockForm(lang, p)}
          <details class="acc"><summary class="acc__sum">${t.product.delivery}</summary><div class="acc__body"><p class="body">${t.product.deliveryBody}</p>${deliveryZones(lang, zones)}</div></details>
          <p class="product__links">
            ${x.whatsapp
              ? html`<a class="tlink" href="https://wa.me/${x.whatsapp}?text=${encodeURIComponent(t.product.waText(p.name, null, ''))}" target="_blank" rel="noopener" data-wa="${x.whatsapp}" data-wa-name="${p.name}">${t.product.whatsapp}</a>`
              : html`<a class="tlink" href="${SITE.message}" target="_blank" rel="noopener">${t.product.ask}</a>`}
            ${p.instagramUrl ? html`<a class="tlink" href="${p.instagramUrl}" target="_blank" rel="noopener">${t.product.instagram}</a>` : ''}
            <button class="tlink" type="button" data-save="${p.slug}" aria-pressed="false">${t.saved.save}</button>
            <button class="tlink" type="button" data-share>${t.product.share}</button>
            <span class="sr-only" aria-live="polite" data-share-status></span>
          </p>
          <p class="product__foot"><span>${folio(index, total)}</span><a class="tlink" href="${href('/dyqani', lang)}">${t.product.back}</a></p>
        </div>
      </div>
    </article>

    ${voicesView(lang, x.reviews)}

    <div class="buybar" data-buybar hidden>
      <span class="buybar__name">${p.name}</span>
      ${price(p, lang, 'price buybar__price')}
      <button class="btn" type="button" data-buybar-btn${sold ? raw(' disabled') : ''}>${sold ? t.shop.soldOut : t.product.add}</button>
    </div>

    ${next
      ? html`<nav class="next-dress" aria-label="${t.product.next}">
          <a class="next-dress__link" href="${href(`/fustan/${next.slug}`, lang)}" data-fly-link>
            ${plate(next.photos[0], { alt: '', sizes: '(min-width: 1024px) 40vw, 100vw', target: 960, flip: flipId(next), cls: 'next-dress__plate', tag: 'span' })}
            <span class="next-dress__text"><span class="next-dress__label">${t.product.next}</span><span class="next-dress__name">${next.name}</span></span>
          </a>
          <a class="tlink next-dress__back" href="${href('/dyqani', lang)}">${t.product.back}</a>
        </nav>`
      : ''}`;
}

/** Greta's returns for Google's merchant listings; nothing until she has chosen them in the admin. */
function returnPolicy(r: Returns) {
  if (!r.mode) return undefined;
  const base = { '@type': 'MerchantReturnPolicy', applicableCountry: 'AL' };
  if (r.mode === 'none') return { ...base, returnPolicyCategory: 'https://schema.org/MerchantReturnNotPermitted' };
  return {
    ...base,
    returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
    merchantReturnDays: r.days,
    returnFees: r.shipping === 'shop' ? 'https://schema.org/FreeReturn' : 'https://schema.org/ReturnShippingFees',
  };
}

export function productJsonLd(origin: string, lang: Lang, p: Product, returns: Returns) {
  const available = Object.values(p.stock).some((n) => n > 0);
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    sku: p.slug,
    description: p.description || undefined,
    image: p.photos.slice(0, 4).map((ph) => origin + photoAt(ph, 1600)),
    color: p.color || undefined,
    brand: { '@type': 'Brand', name: SITE.name },
    offers:
      p.price !== null
        ? {
            '@type': 'Offer',
            url: origin + href(`/fustan/${p.slug}`, lang),
            priceCurrency: 'ALL',
            price: p.price,
            availability: available ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut',
            itemCondition: 'https://schema.org/NewCondition',
            seller: { '@type': 'Organization', name: SITE.name },
            hasMerchantReturnPolicy: returnPolicy(returns),
          }
        : undefined,
  };
}

/** Home > Shop > the dress, so Google shows the path instead of the bare address. */
export function breadcrumbJsonLd(origin: string, lang: Lang, p: Product) {
  const t = copy[lang];
  const items = [
    { name: SITE.name, url: origin + href('/', lang) },
    { name: t.nav.shop, url: origin + href('/dyqani', lang) },
    { name: p.name, url: origin + href(`/fustan/${p.slug}`, lang) },
  ];
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: it.url })),
  };
}
