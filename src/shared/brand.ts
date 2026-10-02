/**
 * The logo as markup. Every page carries one inline sprite with the outlines
 * (src/worker/views/brand.ts); each placement is a small <svg> pointing into it with <use>,
 * coloured through `color` (fill: currentColor). Only the boxes are imported here, so the
 * browser bundles stay free of the outlines.
 */
import { LOGO_BOX } from './brand-logo';

type Box = readonly [number, number, number, number];
const r = (v: number): string => String(Math.round(v * 100) / 100);

/** Breathing room (logo units) so anti-aliased edges are never cut by the viewBox. */
export const NAME_PAD = 0.6;
export const MARK_PAD = 1;

export const viewBox = (b: Box, pad = 0): string => `${r(b[0] - pad)} ${r(b[1] - pad)} ${r(b[2] - b[0] + 2 * pad)} ${r(b[3] - b[1] + 2 * pad)}`;

const svg = (cls: string, box: Box, pad: number, body: string): string =>
  `<svg class="${cls}" viewBox="${viewBox(box, pad)}" fill="currentColor" aria-hidden="true" focusable="false">${body}</svg>`;

/** DRESSES BY GRETA, the line of capitals that runs across the G. */
export const nameSvg = (cls = 'brand-name'): string => svg(cls, LOGO_BOX.name, NAME_PAD, '<use href="#brand-name"/>');

/** The whole logo: the script G with the name across it. */
export const markSvg = (cls = 'brand-mark'): string => svg(cls, LOGO_BOX.all, MARK_PAD, '<use href="#brand-g"/><use href="#brand-name"/>');
