/**
 * An occasion page (fustane mbrëmjeje, mature, për dasma, koktej, me qera): a short introduction in
 * the words people search for, the shop's promise (prices in lek, pay on delivery), then the
 * dresses for that occasion as the shop shows them. The rental page adds the way to ask for a rental.
 */
import { OCCASIONS, OCCASION_PATH, type Occasion, type Product } from '../../shared/catalog';
import { copy, href, type Lang } from '../../shared/copy';
import { html, type Raw } from '../../shared/html';
import { SITE } from '../site';
import { shopView } from './shop';

export function occasionView(lang: Lang, o: Occasion, list: Product[]): Raw {
  const t = copy[lang];
  const oc = t.occasions[o];
  return html`<section class="occasion container">
      <h1 class="heading occasion__title" data-lines>${oc.h1}</h1>
      <p class="body-lg occasion__intro" data-lines>${oc.intro}</p>
      <p class="occasion__usp">${t.occasions.usp}</p>
      ${o === 'rental'
        ? html`<div class="visit__cta">
            <a class="btn" href="${SITE.message}" target="_blank" rel="noopener">${t.occasions.rentAsk}</a>
            <a class="btn btn--line" href="${SITE.maps}" target="_blank" rel="noopener">${t.visit.maps}</a>
          </div>`
        : ''}
    </section>

    ${shopView(lang, list, { view: 'spreads' }, { embedded: true })}

    <nav class="occasion-links container" aria-label="${t.occasions.heading}">
      <h2 class="occasion-links__h">${t.occasions.heading}</h2>
      <ul>
        ${OCCASIONS.filter((x) => x !== o).map((x) => html`<li><a class="tlink" href="${href(OCCASION_PATH[x], lang)}">${t.occasions[x].label}</a></li>`)}
      </ul>
    </nav>`;
}
