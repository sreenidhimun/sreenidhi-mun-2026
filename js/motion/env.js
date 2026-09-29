/* ==========================================================================
   env.js — small shared helpers used by every script.
   (Kept separate from main.js so modules can share it without import loops.)
   ========================================================================== */

/** true when the visitor asked their device for reduced motion. */
export const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** true on devices with a real mouse/trackpad (hover effects, custom cursor). */
export const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/** true on phones/tablets (no hover). */
export const isTouch = !canHover;

/** GSAP is loaded from a CDN — check it actually arrived before using it. */
export function gsapReady() {
  return typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
}

/** Should we animate? (GSAP present, no reduced motion, no failsafe). */
export function motionOK() {
  return !reduce && gsapReady() && !document.documentElement.classList.contains('motion-failsafe');
}

export const qs = (sel, root = document) => root.querySelector(sel);
export const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));
export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
export const wait = (ms) => new Promise((res) => setTimeout(res, ms));

/** Wait for web fonts (max 3s so a slow font never blocks the page). */
export const fontsReady = Promise.race([
  document.fonts ? document.fonts.ready : Promise.resolve(),
  wait(3000),
]);

/* --------------------------------------------------------------------------
   Focus trap for overlays (menu, bio drawer, lightbox).
   - Makes everything OUTSIDE the overlay "inert" (not clickable/focusable).
   - Keeps Tab / Shift+Tab cycling inside the overlay.
   Returns a release() function that undoes it and restores focus.
   -------------------------------------------------------------------------- */
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, iframe, [tabindex]:not([tabindex="-1"])';

export function trapFocus(container, returnFocusTo = document.activeElement) {
  // 1. Inert everything outside the container (walk up to <body>).
  const changed = [];
  let node = container;
  while (node && node !== document.body && node.parentElement) {
    for (const sib of node.parentElement.children) {
      if (sib !== node && !sib.inert && !['SCRIPT', 'STYLE', 'LINK', 'TEMPLATE'].includes(sib.tagName)) {
        sib.inert = true;
        changed.push(sib);
      }
    }
    node = node.parentElement;
  }

  // 2. Keep Tab inside.
  function onKey(e) {
    if (e.key !== 'Tab') return;
    const items = qsa(FOCUSABLE, container).filter((el) => el.getClientRects().length > 0);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  document.addEventListener('keydown', onKey);

  return function release() {
    document.removeEventListener('keydown', onKey);
    changed.forEach((el) => { el.inert = false; });
    if (returnFocusTo && typeof returnFocusTo.focus === 'function') {
      returnFocusTo.focus({ preventScroll: true });
    }
  };
}

/** Announce a short message to screen readers (uses one shared live region). */
export function announce(message) {
  let region = document.getElementById('sr-live');
  if (!region) {
    region = document.createElement('div');
    region.id = 'sr-live';
    region.className = 'sr-only';
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('role', 'status');
    document.body.appendChild(region);
  }
  region.textContent = '';
  // Small delay so repeated identical messages are still read out.
  setTimeout(() => { region.textContent = message; }, 60);
}
