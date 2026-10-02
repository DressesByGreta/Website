/** A dress: every photograph down the left, the caption held beside it, the next dress at the foot. */
import { formatLek, pad2, photoAt, type Product, type Size, type Zone } from '../../shared/catalog';
import { copy, href, type Lang } from '../../shared/copy';
import { html, raw, type Raw } from '../../shared/html';
import type { Returns } from '../../shared/legal';
import { SITE } from '../site';
import { bagData } from './shop';
import { flipId, folio, newTag, plate, price, sizePicker } from './parts';

/** Where the shop delivers and for how much, as set in the admin (a fee left empty is confirmed by phone). */
function deliveryZones(lang: Lang, zones: Zone[]): Raw | '' {
  const t = copy[lang];
  const on = zones.filter((z) => z.enabled);
  if (!on.length) return '';
  return html`<ul class="body acc__list">${on.map((z) => html`<li>${t.product.deliveryZone(t.checkout.zones[z.id], z.fee === null ? t.product.feeByPhone : z.fee === 0 ? '0' : formatLek(z.fee, lang))}</li>`)}</ul>`;
}

export function productView(lang: Lang, p: Product, index: number, total: number, next: Product | null, zones: Zone[], size?: Size): Raw {
  const t = copy[lang];
  const sold = !Object.values(p.stock).some((n) => n > 0);
  const paragraphs = p.description.split(/\n{2,}/).map((s) => s.trim()).filter(Boolean);
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
              })}</button></li>`,
          )}
        </ol>
        ${p.photos.length > 1
          ? html`<p class="product__count" aria-hidden="true"><span data-gallery-i>01</span> / ${pad2(p.photos.length)}</p>
              <span class="product__progress" aria-hidden="true"><span data-gallery-bar style="--g:${(1 / p.photos.length).toFixed(4)}"></span></span>`
          : ''}
      </div>

      <div class="product__info">
        <div class="product__hold">
          <h1 class="product__name">${p.name}${newTag(p, lang)}</h1>
          ${price(p, lang, 'price product__price')}
          <form class="product__form" data-add data-product="${bagData(p)}" novalidate>
            ${sold ? html`<p class="spread__sold">${t.shop.soldOut}</p>` : sizePicker(p, lang, 'size', size)}
            <p class="pick__hint small" data-pick-hint aria-live="polite"></p>
            <button class="btn btn--wide" type="submit" data-add-btn${sold ? raw(' disabled') : ''}>${sold ? t.shop.soldOut : t.product.add}</button>
          </form>
          <p class="product__trust"><span>${t.checkout.cod}</span><span aria-hidden="true">·</span><a href="${href('/', lang)}#visit">${t.nav.visit}</a></p>
          <p class="small product__guide">${t.sizes.guide}</p>
          ${paragraphs.length
            ? html`<details class="acc" open><summary class="acc__sum">${t.product.description}</summary><div class="acc__body">${paragraphs.map((s) => html`<p class="body">${s}</p>`)}</div></details>`
            : ''}
          <details class="acc"><summary class="acc__sum">${t.product.delivery}</summary><div class="acc__body"><p class="body">${t.product.deliveryBody}</p>${deliveryZones(lang, zones)}</div></details>
          <p class="product__links">
            <a class="tlink" href="${SITE.message}" target="_blank" rel="noopener">${t.product.rent}</a>
            ${p.instagramUrl ? html`<a class="tlink" href="${p.instagramUrl}" target="_blank" rel="noopener">${t.product.instagram}</a>` : ''}
            <button class="tlink" type="button" data-share>${t.product.share}</button>
            <span class="sr-only" aria-live="polite" data-share-status></span>
          </p>
          <p class="product__foot"><span>${folio(index, total)}</span><a class="tlink" href="${href('/dyqani', lang)}">${t.product.back}</a></p>
        </div>
      </div>
    </article>

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
