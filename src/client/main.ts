/** Storefront entry: drawers, the bag, page transitions, per-page behaviour. */
import { copy, isLang } from '../shared/copy';
import { bag } from './bag';
import { Drawers } from './drawers';
import { loadMotionChoice, motionStopped, setMotionStopped } from './motion';
import { initPage } from './pages';
import { startRouter } from './router';

const lang = isLang(document.body.dataset.lang) ? document.body.dataset.lang : 'sq';
loadMotionChoice();
const drawers = new Drawers(lang);
startRouter(initPage(lang, drawers));
drawers.schedulePopup(9000);
void bag.refresh(lang);

/** Stop animations (footer and menu): the label says what a press will do. */
const motionLabels = (): void => {
  const label = motionStopped() ? copy[lang].motion.play : copy[lang].motion.stop;
  document.querySelectorAll<HTMLElement>('[data-motion-toggle]').forEach((b) => (b.textContent = label));
};
motionLabels();
document.addEventListener('click', (e) => {
  if (!(e.target instanceof Element) || !e.target.closest('[data-motion-toggle]')) return;
  setMotionStopped(!motionStopped());
  motionLabels();
});
