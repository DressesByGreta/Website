/**
 * Lookbooks: the index of published lookbooks, and one lookbook as a column of photographs, each at
 * its own proportions (never cropped, so a mark sits exactly on its dress). A mark is a numbered
 * square; under each photograph the same numbers list the dresses, which is also the way in for a
 * screen reader or anyone who would rather not tap the photograph.
 */
import { formatLek, pad2, photoAt, type Photo } from '../../shared/catalog';
import { copy, href, type Lang } from '../../shared/copy';
import { html, type Raw } from '../../shared/html';
import type { PublicLookbook } from '../lookbooks';
import { plate } from './parts';

export function lookbookIndexView(lang: Lang, list: { slug: string; title: string; intro: string; cover: Photo; frames: number }[]): Raw {
  const t = copy[lang].lookbook;
  return html`<section class="lbk-head container">
      <h1 class="heading lbk-head__title" data-lines>${t.title}</h1>
      <p class="body-lg lbk-head__intro" data-lines>${t.intro}</p>
    </section>
    <ol class="lbk-index container">
      ${list.map(
        (l, i) => html`<li class="lbk-index__item">
          <a class="lbk-index__link" href="${href(`/lookbook/${l.slug}`, lang)}">
            ${plate(l.cover, { alt: '', sizes: '(min-width: 1024px) 46vw, 100vw', eager: i === 0, target: 960, cls: 'lbk-index__plate', tag: 'span' })}
            <span class="lbk-index__meta"><span class="lbk-index__title">${l.title}</span><span class="lbk-index__count">${t.photos(l.frames)}</span></span>
            ${l.intro ? html`<span class="small lbk-index__intro">${l.intro}</span>` : ''}
          </a>
        </li>`,
      )}
    </ol>`;
}

export function lookbookView(lang: Lang, l: PublicLookbook): Raw {
  const t = copy[lang];
  return html`<section class="lbk-head container">
      <p class="lbk-head__back"><a class="tlink" href="${href('/lookbook', lang)}">${t.lookbook.title}</a></p>
      <h1 class="heading lbk-head__title" data-lines>${l.title}</h1>
      ${l.intro ? html`<p class="body-lg lbk-head__intro" data-lines>${l.intro}</p>` : ''}
    </section>
    <div class="lbk-frames">
      ${l.frames.map(
        (f, fi) => html`<figure class="lbk-frame" data-frame>
          <div class="lbk-photo" style="--ar: ${(f.photo.w / Math.max(1, f.photo.h)).toFixed(4)}">
            ${plate(f.photo, { alt: f.photo.alt, sizes: '(min-width: 1024px) 70vw, 100vw', eager: fi === 0, target: 1600, cls: 'lbk-plate', tag: 'span' })}
            ${f.spots.map(
              (s, i) => html`<button class="lbk-spot" type="button" style="left: ${(s.x * 100).toFixed(1)}%; top: ${(s.y * 100).toFixed(1)}%" data-spot="${i}" aria-expanded="false" aria-controls="lbk-card-${fi}" aria-label="${t.lookbook.spot(pad2(i + 1), s.dress.name)}"><span aria-hidden="true">${pad2(i + 1)}</span></button>`,
            )}
            ${f.spots.length ? html`<div class="lbk-card" id="lbk-card-${fi}" role="dialog" aria-label="${t.lookbook.inPhoto}" hidden data-card></div>` : ''}
          </div>
          ${f.caption || f.spots.length
            ? html`<figcaption class="lbk-cap">
                ${f.caption ? html`<p class="body lbk-cap__text">${f.caption}</p>` : ''}
                ${f.spots.length
                  ? html`<p class="lbk-cap__h">${t.lookbook.inPhoto}</p>
                    <ol class="lbk-list">${f.spots.map(
                      (s, i) => html`<li><a class="lbk-list__link" href="${href(`/fustan/${s.dress.slug}`, lang)}" data-spot-link="${i}" data-name="${s.dress.name}" data-price="${s.dress.price !== null ? formatLek(s.dress.price, lang) : ''}"${s.dress.photos[0] ? html` data-cover="${photoAt(s.dress.photos[0], 480)}"` : ''}>
                        <span class="lbk-list__n">${pad2(i + 1)}</span><span class="lbk-list__name">${s.dress.name}</span><span class="lbk-list__price">${s.dress.price !== null ? formatLek(s.dress.price, lang) : ''}</span>
                      </a></li>`,
                    )}</ol>`
                  : ''}
              </figcaption>`
            : ''}
        </figure>`,
      )}
    </div>`;
}
