/** What customers said: quotes in their own words, with their first name, city and photograph. */
import { copy, href, type Lang } from '../../shared/copy';
import { html, raw, type Raw } from '../../shared/html';
import type { Review } from '../reviews';
import { plate } from './parts';

export function voicesView(lang: Lang, reviews: (Review & { slug?: string; dress?: string })[], opts: { heading: 'h2' | 'h3' } = { heading: 'h2' }): Raw | '' {
  if (!reviews.length) return '';
  const t = copy[lang].voices;
  return html`<section class="voices container" aria-labelledby="voices-title">
    ${raw(`<${opts.heading} class="heading" id="voices-title" data-lines>`)}${t.title}${raw(`</${opts.heading}>`)}
    <ul class="voices__list">
      ${reviews.map(
        (r) => html`<li class="voice">
          ${r.photo ? plate(r.photo, { alt: '', sizes: '(min-width: 1024px) 22vw, 60vw', target: 960, cls: 'voice__plate', tag: 'span' }) : ''}
          <blockquote class="voice__quote" lang="${r.lang}"><p>${r.text}</p></blockquote>
          <p class="voice__who">${r.name}${r.city ? html`, ${r.city}` : ''}${r.slug && r.dress ? html` · <a class="tlink" href="${href(`/fustan/${r.slug}`, lang)}">${r.dress}</a>` : ''}</p>
        </li>`,
      )}
    </ul>
  </section>`;
}
