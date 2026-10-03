/**
 * The privacy notice and the terms of sale: a Read page, one column at reading width. The business
 * details and the returns policy come from the admin (getLegalSettings) and slot into the text.
 */
import { copy, href, type Lang } from '../../shared/copy';
import { html, type Raw } from '../../shared/html';
import { LEGAL, returnsSection, sellerText, updatedLine, whoText, type Business, type Returns } from '../../shared/legal';
import { stylistOn } from './layout';

const NBSP = String.fromCharCode(160);
/** French keeps a non-breaking space before : ; ? ! and inside guillemets. */
const typeset = (s: string, lang: Lang): string => (lang === 'fr' ? s.replace(/ ([:;?!»])/g, `${NBSP}$1`).replace(/« /g, `«${NBSP}`) : s);

export const legalTitle = (kind: 'privacy' | 'terms', lang: Lang): string => LEGAL[kind][lang].title;
export const legalIntro = (kind: 'privacy' | 'terms', lang: Lang): string => typeset(LEGAL[kind][lang].intro, lang);

export function legalView(kind: 'privacy' | 'terms', lang: Lang, s: { business: Business; returns: Returns; updated: string }): Raw {
  const d = LEGAL[kind][lang];
  const other = kind === 'privacy' ? 'terms' : 'privacy';
  const t = copy[lang].legal;
  const sections = d.sections.flatMap((sec) => {
    // the stylist's paragraph only while the stylist is on
    if (sec.id === 'stylist') return stylistOn() ? [sec] : [];
    if (sec.id === 'who') return [{ ...sec, p: [whoText(lang, s.business), ...sec.p.slice(1)] }];
    if (sec.id === 'seller') return [{ ...sec, p: [sellerText(lang, s.business)] }];
    if (sec.id === 'delivery') {
      const returns = returnsSection(lang, s.returns);
      return returns ? [sec, returns] : [sec];
    }
    return [sec];
  });
  return html`<article class="legal container" aria-labelledby="legal-title">
    <span class="legal__progress" aria-hidden="true" data-read-progress></span>
    <header class="legal__head">
      <h1 class="legal__title" id="legal-title" data-lines>${d.title}</h1>
      <p class="legal__date"><time datetime="${s.updated}">${updatedLine(s.updated, lang)}</time></p>
    </header>
    <p class="legal__intro">${typeset(d.intro, lang)}</p>
    ${sections.map(
      (sec) => html`<section class="legal__part">
        <h2 class="legal__h">${typeset(sec.h, lang)}</h2>
        ${sec.p.map((p) => html`<p>${typeset(p, lang)}</p>`)}
      </section>`,
    )}
    <p class="legal__other"><a class="tlink" href="${href(other === 'privacy' ? '/privatesia' : '/kushtet', lang)}">${other === 'privacy' ? t.privacy : t.terms}</a></p>
  </article>`;
}
