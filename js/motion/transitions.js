/* ==========================================================================
   transitions.js — "page-turn" transitions between pages.

   1. Modern browsers (Chrome/Edge/Safari 18+): the View Transitions API does
      it natively. The keyframes live in css/base.css (@view-transition).
   2. Other browsers: this fallback. When an internal link is clicked, a cream
      "sheet" sweeps in from the right, then we navigate. On the next page the
      sheet (already covering the screen from the first paint, thanks to the
      inline script in <head>) sweeps away to the left.
   Reduced motion: normal, instant navigation.
   ========================================================================== */
import { reduce, gsapReady } from './env.js';

const FLAG = 'smunSheet';
const supportsNativeTurn = 'CSSViewTransitionRule' in window;
let sheet = null;

function getSheet() {
  if (!sheet) {
    sheet = document.createElement('div');
    sheet.className = 'page-sheet';
    sheet.setAttribute('aria-hidden', 'true');
    window.gsap.set(sheet, { xPercent: 101 });   // parked off-screen to the right
    document.body.appendChild(sheet);
  }
  return sheet;
}

export function initTransitions() {
  const html = document.documentElement;
  const arriving = html.classList.contains('sheet-arriving');
  try { sessionStorage.removeItem(FLAG); } catch { /* ignore */ }

  // Arriving from a fallback page-turn: sweep the covering sheet away.
  if (arriving) {
    if (reduce || !gsapReady()) {
      html.classList.remove('sheet-arriving');
    } else {
      const s = getSheet();
      window.gsap.set(s, { xPercent: 0 });
      html.classList.remove('sheet-arriving');
      window.gsap.to(s, { xPercent: -101, duration: 0.55, ease: 'power3.inOut', delay: 0.05 });
    }
  }

  if (reduce || supportsNativeTurn || !gsapReady()) return;

  document.addEventListener('click', onLinkClick);

  // Coming "back" to a page from the browser cache: make sure the sheet is gone.
  window.addEventListener('pageshow', (e) => {
    if (e.persisted && sheet) window.gsap.set(sheet, { xPercent: 101 });
  });
}

function onLinkClick(e) {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const link = e.target.closest('a[href]');
  if (!link) return;
  const raw = link.getAttribute('href');
  if (!raw || raw.startsWith('#') || link.hasAttribute('download') || link.hasAttribute('data-no-transition')) return;
  if (link.target && link.target !== '_self') return;

  const url = new URL(link.href, location.href);
  if (url.origin !== location.origin) return;                                  // external site
  if (url.pathname === location.pathname && url.search === location.search) return; // same page
  if (!/\.html?$|\/$/.test(url.pathname)) return;                              // PDFs etc.

  e.preventDefault();
  const s = getSheet();
  window.gsap.fromTo(s, { xPercent: 101 }, {
    xPercent: 0,
    duration: 0.55,
    ease: 'power3.inOut',
    onComplete() {
      try { sessionStorage.setItem(FLAG, '1'); } catch { /* ignore */ }
      location.href = url.href;
    },
  });
}
