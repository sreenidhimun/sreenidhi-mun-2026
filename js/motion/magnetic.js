/* ==========================================================================
   magnetic.js — buttons lean towards the pointer, then spring back.
   Applies to .btn--primary, .btn--ghost and anything with [data-magnetic].
   Starts when the pointer is within 24px of the button; the button moves
   30% of the distance (max 12px) and its label 15%.
   Off on touch devices and with reduced motion.
   ========================================================================== */
import { reduce, canHover, gsapReady, clamp } from './env.js';

const SELECTOR = '.btn--primary:not(.is-disabled), .btn--ghost:not(.is-disabled), [data-magnetic]';
const REACH = 24;     // px around the button that already "pulls"
const MAX = 12;       // px maximum travel

export function initMagnetic() {
  if (reduce || !canHover || !gsapReady()) return;
  const { gsap } = window;
  let active = null;          // the button currently being pulled
  let frame = 0;
  let lastEvent = null;

  // Wrap each button's text in a span so the label can move separately.
  function prepare(btn) {
    if (btn._mag) return btn._mag;
    let label = btn.querySelector(':scope > .btn__label');
    if (!label) {
      label = document.createElement('span');
      label.className = 'btn__label';
      while (btn.firstChild) label.appendChild(btn.firstChild);
      btn.appendChild(label);
    }
    btn._mag = {
      label,
      x: gsap.quickTo(btn, 'x', { duration: 0.3, ease: 'power3' }),
      y: gsap.quickTo(btn, 'y', { duration: 0.3, ease: 'power3' }),
      lx: gsap.quickTo(label, 'x', { duration: 0.3, ease: 'power3' }),
      ly: gsap.quickTo(label, 'y', { duration: 0.3, ease: 'power3' }),
    };
    return btn._mag;
  }

  function release(btn) {
    const m = btn._mag;
    if (!m) return;
    gsap.to(btn, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.4)', overwrite: true });
    gsap.to(m.label, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.4)', overwrite: true });
  }

  function update() {
    frame = 0;
    const e = lastEvent;
    let found = null;
    for (const btn of document.querySelectorAll(SELECTOR)) {
      const r = btn.getBoundingClientRect();
      if (!r.width) continue;
      // The rect includes the current pull, so remove it to get the "home" position.
      const ox = gsap.getProperty(btn, 'x') || 0;
      const oy = gsap.getProperty(btn, 'y') || 0;
      const left = r.left - ox, top = r.top - oy;
      if (e.clientX > left - REACH && e.clientX < left + r.width + REACH &&
          e.clientY > top - REACH && e.clientY < top + r.height + REACH) {
        found = { btn, cx: left + r.width / 2, cy: top + r.height / 2 };
        break;
      }
    }
    if (active && (!found || found.btn !== active)) { release(active); active = null; }
    if (!found) return;
    active = found.btn;
    const m = prepare(active);
    const dx = e.clientX - found.cx;
    const dy = e.clientY - found.cy;
    m.x(clamp(dx * 0.3, -MAX, MAX));
    m.y(clamp(dy * 0.3, -MAX, MAX));
    m.lx(clamp(dx * 0.15, -8, 8));   // the label drifts a little further than the pill
    m.ly(clamp(dy * 0.15, -5, 5));
  }

  window.addEventListener('pointermove', (e) => {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    lastEvent = e;
    if (!frame) frame = requestAnimationFrame(update);
  }, { passive: true });

  document.documentElement.addEventListener('mouseleave', () => {
    if (active) { release(active); active = null; }
  });
}
