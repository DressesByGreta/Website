/**
 * The page's one copy of the logo's outlines (every placement points into it), and the hero
 * lockup: the G and the name as two layers, so on scroll the name can leave the G and settle
 * in the header (src/client/motion.ts).
 */
import { MARK_PAD, NAME_PAD, viewBox } from '../../shared/brand';
import { LOGO_BOX, LOGO_PATHS } from '../../shared/brand-logo';
import { raw, type Raw } from '../../shared/html';

/** The G is a trace, so even-odd is safe; the letters keep the font's own winding. */
export function brandSprite(): Raw {
  const letters = LOGO_PATHS.name.map((d, i) => `<path id="brand-l${i}" d="${d}"/>`).join('');
  const name = LOGO_PATHS.name.map((_, i) => `<use href="#brand-l${i}"/>`).join('');
  return raw(
    `<svg class="brand-sprite" width="0" height="0" aria-hidden="true" focusable="false"><defs><path id="brand-g" fill-rule="evenodd" d="${LOGO_PATHS.g}"/>${letters}<g id="brand-name">${name}</g></defs></svg>`,
  );
}

const pc = (v: number): string => `${(v * 100).toFixed(3)}%`;

/** The logo in two absolutely placed layers inside a box with the logo's own proportions. */
export function heroBrand(): Raw {
  const [l, t, rgt, b] = LOGO_BOX.all;
  const w = rgt - l;
  const h = b - t;
  const at = (box: readonly number[], pad: number): string =>
    `left:${pc((box[0]! - pad - l) / w)};top:${pc((box[1]! - pad - t) / h)};width:${pc((box[2]! - box[0]! + 2 * pad) / w)}`;
  const letters = LOGO_PATHS.name.map((_, i) => `<use class="hero-brand__l" href="#brand-l${i}"/>`).join('');
  return raw(
    `<span class="hero-brand" style="aspect-ratio:${w.toFixed(2)} / ${h.toFixed(2)}" aria-hidden="true">` +
      `<span class="hero-brand__g" style="${at(LOGO_BOX.g, MARK_PAD)}"><svg viewBox="${viewBox(LOGO_BOX.g, MARK_PAD)}" fill="currentColor" focusable="false"><use href="#brand-g"/></svg></span>` +
      `<span class="hero-brand__name" style="${at(LOGO_BOX.name, NAME_PAD)}"><svg viewBox="${viewBox(LOGO_BOX.name, NAME_PAD)}" fill="currentColor" focusable="false">${letters}</svg></span>` +
      `</span>`,
  );
}
