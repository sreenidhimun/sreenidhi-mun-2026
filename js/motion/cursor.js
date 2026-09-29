/* ==========================================================================
   cursor.js — the "ink-dot" cursor (desktop with a mouse only).

   A 10px ink dot follows the pointer; a 36px ring trails behind it.
   States (chosen from whatever the pointer is over):
     default — dot + ring
     link    — over links/buttons: ring grows (×1.6) with a faint fill
     view    — over [data-cursor="view"] (photos, portraits, rows…):
               ring becomes an 84px ink circle with a label ("View →").
               Set data-cursor-label="Open →" to change the label.
     hidden  — over .btn (the magnetic effect is feedback enough; the
               normal pointer shows) and over text fields / the map.
   Never used on touch devices or with reduced motion.
   ========================================================================== */
import { reduce, canHover, gsapReady } from './env.js';

export function initCursor() {
  if (reduce || !canHover || !gsapReady()) return;
  const { gsap } = window;

  const root = document.createElement('div');
  root.className = 'cursor is-away';
  root.setAttribute('aria-hidden', 'true');
  root.dataset.state = 'default';
  root.innerHTML = `
    <div class="cursor__ring"><span class="cursor__ring-bg"></span><span class="cursor__label">View →</span></div>
    <div class="cursor__dot"></div>`;
  document.body.appendChild(root);
  document.documentElement.classList.add('has-custom-cursor');

  const dot = root.querySelector('.cursor__dot');
  const ring = root.querySelector('.cursor__ring');
  const label = root.querySelector('.cursor__label');

  const dotX = gsap.quickTo(dot, 'x', { duration: 0.15, ease: 'power3' });
  const dotY = gsap.quickTo(dot, 'y', { duration: 0.15, ease: 'power3' });
  const ringX = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3' });
  const ringY = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3' });

  let placed = false;
  window.addEventListener('pointermove', (e) => {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    if (!placed) {                       // first move: jump there instead of flying in
      gsap.set([dot, ring], { x: e.clientX, y: e.clientY });
      placed = true;
    }
    root.classList.remove('is-away');
    dotX(e.clientX); dotY(e.clientY);
    ringX(e.clientX); ringY(e.clientY);
  }, { passive: true });

  // Hide when the pointer leaves the window.
  document.documentElement.addEventListener('mouseleave', () => root.classList.add('is-away'));
  document.documentElement.addEventListener('mouseenter', () => root.classList.remove('is-away'));

  // Work out the state from the element under the pointer.
  document.addEventListener('pointerover', (e) => {
    const [state, text] = stateFor(e.target);
    if (root.dataset.state !== state) root.dataset.state = state;
    if (state === 'view' && label.textContent !== text) label.textContent = text;
  });
}

function stateFor(el) {
  if (!(el instanceof Element)) return ['default'];
  if (el.tagName === 'IFRAME' || el.closest('input, textarea, select, [contenteditable="true"]')) return ['hidden'];
  const special = el.closest('[data-cursor]');
  if (special) {
    const s = special.dataset.cursor;
    return [s, special.dataset.cursorLabel || 'View →'];
  }
  if (el.closest('.btn')) return ['hidden'];
  if (el.closest('a[href], button, [role="button"], [role="tab"], label[for], summary')) return ['link'];
  return ['default'];
}
