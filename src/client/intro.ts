/**
 * The opening, on a visitor's first page (about 1.4s, calm): on the logo's own ivory the G traces
 * its outline in gold and fills, the letters of the name rise in, then the sheet lifts off the
 * page. The head's boot script (views/layout.ts, INTRO_BOOT) decides and paints the ivory before
 * the first paint, so the page never flashes first; this replaces that ivory with the drawing.
 * A tap, a key or a scroll lifts it at once. Never with reduced motion or with animations stopped,
 * and at most once in 12 hours (the boot script keeps the time).
 */
import { MARK_PAD, viewBox } from '../shared/brand';
import { LOGO_BOX } from '../shared/brand-logo';
import { gsap, ScrollTrigger } from './motion';

export function playIntro(): void {
  const root = document.documentElement;
  if (!root.classList.contains('intro')) return;
  const g = document.getElementById('brand-g');
  const letters = [...document.querySelectorAll<SVGPathElement>('.brand-sprite path[id^="brand-l"]')];
  if (!g || !letters.length) return void root.classList.remove('intro');

  const sheet = document.createElement('div');
  sheet.className = 'intro-sheet';
  sheet.setAttribute('aria-hidden', 'true');
  sheet.innerHTML =
    `<svg class="intro-sheet__logo" viewBox="${viewBox(LOGO_BOX.all, MARK_PAD)}" focusable="false">` +
    `<path class="intro-sheet__g" fill-rule="evenodd" d="${g.getAttribute('d')}"/>` +
    letters.map((l) => `<path class="intro-sheet__l" d="${l.getAttribute('d')}"/>`).join('') +
    `</svg>`;
  document.body.appendChild(sheet);
  // the drawing now stands where the boot's plain ivory stood; the page stays still beneath it
  root.classList.add('intro-on');
  root.classList.remove('intro');

  const pen = sheet.querySelector<SVGPathElement>('.intro-sheet__g')!;
  const name = sheet.querySelectorAll<SVGPathElement>('.intro-sheet__l');
  const length = pen.getTotalLength();
  gsap.set(pen, { strokeDasharray: length, strokeDashoffset: length, fillOpacity: 0 });
  gsap.set(name, { opacity: 0, y: 6 });

  // A first visit is when the page itself is busiest (scripts, the hero's decode): a long frame
  // would otherwise jump the drawing ahead. While the sheet stands, a frame over 40ms counts as
  // 16ms, so the drawing waits for the phone instead of skipping; the default comes back after.
  gsap.ticker.lagSmoothing(40, 16);
  const events = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const;
  const done = () => {
    gsap.ticker.lagSmoothing(500, 33);
    events.forEach((ev) => window.removeEventListener(ev, skip));
    sheet.remove();
    root.classList.remove('intro-on');
    // the page could not scroll while the sheet stood: measure the scroll positions again
    ScrollTrigger.refresh();
  };
  const tl = gsap.timeline({ onComplete: done });
  tl.to(pen, { strokeDashoffset: 0, duration: 0.65, ease: 'power2.inOut' }, 0)
    .to(pen, { fillOpacity: 1, strokeOpacity: 0, duration: 0.35, ease: 'power1.out' }, 0.45)
    .to(name, { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out', stagger: 0.02 }, 0.35)
    .addLabel('lift', 0.95)
    .to(sheet, { yPercent: -100, duration: 0.5, ease: 'power3.inOut' }, 'lift');

  // she wants the shop now: straight to the lift, at twice the pace
  function skip(): void {
    events.forEach((ev) => window.removeEventListener(ev, skip));
    if (tl.time() < tl.labels.lift!) tl.seek('lift');
    tl.timeScale(2);
  }
  events.forEach((ev) => window.addEventListener(ev, skip, { passive: true }));
}
