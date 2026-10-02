/** Markup pieces shared by the storefront views. */
import { SIZES, SIZE_LETTER, formatLek, pad2, photoAt, photoSrcset, type Photo, type Product } from '../../shared/catalog';
import { copy, type Lang } from '../../shared/copy';
import { html, raw, type Raw } from '../../shared/html';

export interface ImgOptions {
  sizes: string;
  alt: string;
  eager?: boolean;
  target?: number;
}

/** A responsive photograph. The tiny LQIP sits under it as a background until the pixels arrive. */
export function img(p: Photo | undefined, o: ImgOptions): Raw {
  if (!p) return html`<span class="plate__none" aria-hidden="true"></span>`;
  return html`<img class="plate__img" src="${photoAt(p, o.target ?? 960)}" srcset="${photoSrcset(p)}" sizes="${o.sizes}" width="${p.w}" height="${p.h}" alt="${o.alt}" loading="${o.eager ? 'eager' : 'lazy'}" decoding="async"${o.eager ? raw(' fetchpriority="high"') : ''}${p.lqip ? html` style="background-image:url(${p.lqip})"` : ''} />`;
}

/** A printed photograph: the plate carries --p, the scan bar rides the clip edge. */
export function plate(p: Photo | undefined, o: ImgOptions & { cls?: string; flip?: string; tag?: 'div' | 'figure' | 'span' }): Raw {
  const tag = o.tag ?? 'div';
  return html`${raw(`<${tag}`)} class="plate ${o.cls ?? ''}"${o.flip ? html` data-flip-id="${o.flip}"` : ''}>
    <span class="plate__inner">${img(p, o)}<span class="plate__scan" aria-hidden="true"></span></span>
  ${raw(`</${tag}>`)}`;
}

export const flipId = (p: Pick<Product, 'id'>): string => `p-${p.id}`;

/** "New" after a dress's name while it is new: a word in the label register, never a badge (DESIGN.md). */
export const newTag = (p: Pick<Product, 'isNew'>, lang: Lang): Raw | '' => (p.isNew ? html`<span class="tag-new">${copy[lang].product.newTag}</span>` : '');

export function price(p: Pick<Product, 'price' | 'comparePrice'>, lang: Lang, cls = 'price'): Raw {
  if (p.price === null) return html`<p class="${cls}">${copy[lang].product.noPrice}</p>`;
  const was = p.comparePrice && p.comparePrice > p.price ? p.comparePrice : null;
  return html`<p class="${cls}"><span class="price__now">${formatLek(p.price, lang)}</span>${
    was ? html` <s class="price__was"><span class="sr-only">${copy[lang].product.was} </span>${formatLek(was, lang)}</s>` : ''
  }</p>`;
}

/**
 * The size row used on spreads and product pages: real radio buttons (keyboard and screen reader
 * native), sold-out sizes disabled and struck. A single size in stock is pre-selected.
 */
export function sizePicker(p: Product, lang: Lang, name: string, preferred?: string): Raw {
  const t = copy[lang];
  const available = SIZES.filter((s) => p.stock[s] > 0);
  const chosen = preferred && available.includes(preferred as (typeof SIZES)[number]) ? preferred : available.length === 1 ? available[0] : undefined;
  return html`<fieldset class="pick">
    <legend class="pick__legend">${t.product.size}</legend>
    <div class="pick__row">
      ${SIZES.map((s) => {
        const left = p.stock[s];
        const off = left <= 0;
        return html`<label class="pick__size${off ? ' is-out' : ''}">
          <input type="radio" name="${name}" value="${s}"${off ? raw(' disabled') : ''}${chosen === s ? raw(' checked') : ''} data-left="${left}" />
          <span class="pick__n">${s}</span><span class="pick__l">${SIZE_LETTER[s]}</span>
          ${off ? html`<span class="sr-only">${t.product.soldOut}</span>` : ''}
        </label>`;
      })}
    </div>
  </fieldset>`;
}

export const folio = (i: number, total: number): string => `${pad2(i + 1)} / ${pad2(total)}`;
