/**
 * The document shell every storefront page shares: head (SEO, alternates, assets), the three-zone
 * header, <main> (the only part the client router swaps), the footer.
 */
import { CATEGORIES, SIZES, SIZE_LETTER } from '../../shared/catalog';
import { copy, href, LANGS, type Lang } from '../../shared/copy';
import { html, raw, type Html, type Raw } from '../../shared/html';
import { SITE } from '../site';

export interface PageOptions {
  lang: Lang;
  origin: string;
  /** Path without the language parameter, e.g. /dyqani */
  path: string;
  /** Query parameters that belong to the canonical URL (masa, pamja). */
  params?: Record<string, string | undefined>;
  title: string;
  description: string;
  /** Absolute or root-relative image for link previews. */
  image?: string;
  kind: 'home' | 'shop' | 'product' | 'checkout' | 'confirmation' | 'pay' | 'notfound';
  body: Raw;
  /** Transparent header over a photograph (home). */
  overPhoto?: boolean;
  noindex?: boolean;
  jsonLd?: object[];
  /** Serialised into data-page for the client (escaped as an attribute). */
  data?: object;
  preload?: string;
}

const B = String.fromCharCode(92);

/** Set from the settings table: the catalogue holds invented demo prices (local testing only). */
let demoData = false;
export const setDemo = (on: boolean): void => {
  demoData = on;
};
const ldJson = (o: object): string => JSON.stringify(o).replace(/</g, `${B}u003c`);

function assets(kind: 'store' | 'admin'): Raw {
  const entry = kind === 'store' ? 'client/main' : 'admin/main';
  const style = kind === 'store' ? 'client/styles/index' : 'admin/admin';
  if (import.meta.env.DEV) {
    return raw(
      `<link rel="stylesheet" href="/src/${style}.css" />` +
        `<script type="module" src="/@vite/client"></script>` +
        `<script type="module" src="/src/${entry}.ts"></script>`,
    );
  }
  const name = kind === 'store' ? 'app' : 'admin';
  const css = kind === 'store' ? 'styles' : 'admin-styles';
  return raw(`<link rel="stylesheet" href="/entry/${css}.css?v=${__BUILD_ID__}" /><script type="module" src="/entry/${name}.js?v=${__BUILD_ID__}"></script>`);
}

export const assetTags = assets;

function header(lang: Lang, o: PageOptions): Raw {
  const t = copy[lang];
  return html`<header class="nav${o.overPhoto ? '' : ' is-solid'}" data-nav>
    <div class="nav__left">
      <button class="nav__menu" type="button" data-open="menu" aria-haspopup="dialog">${t.nav.menu}</button>
      <nav class="nav__list" aria-label="${t.nav.shop}">
        <a class="tlink" href="${href('/dyqani', lang)}">${t.nav.lookbook}</a>
        ${CATEGORIES.map((c) => html`<a class="tlink" href="${href('/dyqani', lang, { kategoria: c })}">${t.categories[c]}</a>`)}
      </nav>
    </div>
    <a class="nav__wordmark wordmark" href="${href('/', lang)}" aria-label="${t.a11y.wordmark}">${t.hero.wordmark}</a>
    <div class="nav__right">
      <span class="nav__langs">${LANGS.map((l) => html`<a class="tlink" href="${href(o.path, l, o.params ?? {})}" hreflang="${l}" lang="${l}" data-lang-link="${l}" data-no-router${l === lang ? raw(' aria-current="true"') : ''}>${copy[l].langShort}</a>`)}</span>
      <button class="tlink" type="button" data-open="search" aria-haspopup="dialog">${t.nav.search}</button>
      <button class="tlink" type="button" data-open="bag" aria-haspopup="dialog"><span>${t.nav.bag}</span><span class="nav__count" data-bag-count aria-live="polite"></span></button>
    </div>
  </header>`;
}

function footer(lang: Lang, o: PageOptions): Raw {
  const t = copy[lang];
  return html`<footer class="foot">
    <div class="container">
      <div class="foot__cols">
        <div class="foot__col">
          <h2>${t.footer.shop}</h2>
          <span>${SITE.address}</span>
          <a href="${SITE.maps}" target="_blank" rel="noopener">${t.visit.maps}</a>
          ${LANGS.filter((l) => l !== lang).map((l) => html`<a href="${href(o.path, l, o.params ?? {})}" hreflang="${l}" lang="${l}" data-lang-link="${l}" data-no-router>${copy[l].langName}</a>`)}
        </div>
        <div class="foot__col">
          <h2>${t.footer.help}</h2>
          <a href="${SITE.message}" target="_blank" rel="noopener">${t.visit.ask}</a>
          <a href="${SITE.instagram}" target="_blank" rel="noopener">${t.footer.rules}</a>
          <a href="${SITE.instagram}" target="_blank" rel="noopener">${t.footer.follow}</a>
        </div>
        <div class="foot__col">
          <h2>${t.footer.dresses}</h2>
          <a href="${href('/dyqani', lang)}">${t.nav.lookbook}</a>
          ${CATEGORIES.map((c) => html`<a href="${href('/dyqani', lang, { kategoria: c })}">${t.categories[c]}</a>`)}
          <span class="foot__sizes">${SIZES.map((s) => html`<a href="${href('/dyqani', lang, { masa: s })}" aria-label="${t.sizes.label(s, SIZE_LETTER[s])}">${s}</a>`)}</span>
        </div>
      </div>
      <div class="foot__bottom">
        <span>${SITE.name}, ${t.footer.city}</span>
        <span>${t.footer.followers}</span>
        <span>${t.footer.privacy}</span>
      </div>
    </div>
  </footer>`;
}

export function page(o: PageOptions): string {
  const t = copy[o.lang];
  const canonical = o.origin + href(o.path, o.lang, o.params ?? {});
  const alt = (l: Lang) => o.origin + href(o.path, l, o.params ?? {});
  const image = o.image ? (o.image.startsWith('http') ? o.image : o.origin + o.image) : o.origin + SITE.ogImage;
  const ld: Html[] = (o.jsonLd ?? []).map((j) => raw(`<script type="application/ld+json">${ldJson(j)}</script>`));
  return (
    '<!doctype html>' +
    html`<html lang="${o.lang}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>${o.title}</title>
    <meta name="description" content="${o.description}" />
    ${o.noindex ? raw('<meta name="robots" content="noindex" />') : ''}
    <link rel="canonical" href="${canonical}" />
    ${LANGS.map((l) => html`<link rel="alternate" hreflang="${l}" href="${alt(l)}" />`)}
    <link rel="alternate" hreflang="x-default" href="${alt('sq')}" />
    <meta name="theme-color" content="#ffffff" />
    <meta name="color-scheme" content="light" />
    <meta property="og:site_name" content="${SITE.name}" />
    <meta property="og:title" content="${o.title}" />
    <meta property="og:description" content="${o.description}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:type" content="${o.kind === 'product' ? 'product' : 'website'}" />
    <meta property="og:locale" content="${{ sq: 'sq_AL', en: 'en_GB', fr: 'fr_FR' }[o.lang]}" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="icon" href="/brand/monogram.jpg" />
    <link rel="apple-touch-icon" href="/brand/monogram.jpg" />
    ${o.preload ? html`<link rel="preload" as="image" href="${o.preload}" fetchpriority="high" />` : ''}
    ${assets('store')}
    ${ld}
  </head>
  <body data-lang="${o.lang}">
    <a class="skip" href="#main">${t.a11y.skip}</a>
    ${header(o.lang, o)}
    <main id="main" tabindex="-1" data-page="${o.kind}" data-nav-mode="${o.overPhoto ? 'photo' : 'solid'}" data-page-json="${o.data ? JSON.stringify(o.data) : ''}">
      ${o.body}
    </main>
    ${demoData ? html`<p class="demo-note" role="note">${t.demo}</p>` : ''}
    ${footer(o.lang, o)}
  </body>
</html>`.value
  );
}
