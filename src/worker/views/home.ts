/** Home: the photograph and the logo, then the shop itself (every dress), then the shop in Tirana. */
import type { Product } from '../../shared/catalog';
import { copy, type Lang } from '../../shared/copy';
import { html, type Raw } from '../../shared/html';
import { SITE } from '../site';
import { heroBrand } from './brand';
import { shopView } from './shop';

/** The photograph fills the screen; phones take the 1216 file, large screens the enlarged ones. */
export const HERO_SIZES = '100vw';
export const heroSrcset = (ext: 'webp' | 'jpg'): string => SITE.hero.widths.map((w) => `${SITE.hero.base}-${w}.${ext} ${w}w`).join(', ');

export function homeView(lang: Lang, visible: Product[]): Raw {
  const t = copy[lang];
  return html`<section class="hero" id="hero">
      <figure class="plate hero__plate" style="--p: 1">
        <div class="plate__inner">
          <picture>
            <source type="image/webp" srcset="${heroSrcset('webp')}" sizes="${HERO_SIZES}" />
            <img class="plate__img" src="${SITE.hero.base}-${SITE.hero.width}.jpg" srcset="${heroSrcset('jpg')}" sizes="${HERO_SIZES}" width="${SITE.hero.width}" height="${SITE.hero.height}" alt="${t.hero.alt}" fetchpriority="high" decoding="async" />
          </picture>
          <span class="plate__scan" aria-hidden="true"></span>
        </div>
      </figure>
      <div class="hero__overlay" aria-hidden="true"></div>
      <div class="hero__mark"><h1 class="hero__title"><span class="sr-only">${t.hero.wordmark}</span>${heroBrand()}</h1></div>
      <div class="hero__content">
        <a class="btn btn--photo" href="#shop">${t.hero.cta}</a>
      </div>
    </section>

    ${shopView(lang, visible, { view: 'spreads' }, { embedded: true })}

    <section class="visit container" id="visit">
      <h2 class="heading">${t.visit.title}</h2>
      <p class="visit__address">${SITE.address}</p>
      <div class="visit__cta">
        <a class="btn btn--line" href="${SITE.maps}" target="_blank" rel="noopener">${t.visit.maps}</a>
        <a class="btn" href="${SITE.message}" target="_blank" rel="noopener">${t.visit.ask}</a>
      </div>
      <p class="visit__line body">${t.visit.body}</p>
    </section>`;
}

export function storeJsonLd(origin: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ClothingStore',
    name: SITE.name,
    url: origin + '/',
    image: origin + SITE.ogImage,
    logo: origin + '/brand/apple-touch-icon.png',
    sameAs: [SITE.instagram],
    address: { '@type': 'PostalAddress', streetAddress: 'Rruga Andon Zako Çajupi, pas LSI', addressLocality: 'Tiranë', addressCountry: 'AL' },
    geo: { '@type': 'GeoCoordinates', latitude: SITE.geo.lat, longitude: SITE.geo.lng },
  };
}
