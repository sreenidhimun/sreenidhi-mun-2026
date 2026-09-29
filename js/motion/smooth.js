/* ==========================================================================
   smooth.js — Lenis smooth scrolling, kept in sync with GSAP ScrollTrigger.
   - Wheel/trackpad scrolling is smoothed; touch scrolling stays native.
   - stopScroll()/startScroll() freeze the page while the menu, bio drawer
     or lightbox is open.
   - In-page links (href="#…") glide to their target.
   - Reduced motion: Lenis is not created; the browser scrolls normally.
   ========================================================================== */
import { reduce, gsapReady } from './env.js';

/** The Lenis instance (null when smooth scrolling is off). */
export let lenis = null;

export function initSmooth() {
  if (!reduce && gsapReady() && typeof window.Lenis !== 'undefined') {
    lenis = new window.Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true });

    // Keep ScrollTrigger in step with Lenis, and drive Lenis from GSAP's clock.
    lenis.on('scroll', window.ScrollTrigger.update);
    window.gsap.ticker.add((time) => lenis.raf(time * 1000));
    window.gsap.ticker.lagSmoothing(0);
  }

  // In-page anchor links (e.g. "Read the Secretary-General's letter").
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link || e.defaultPrevented || link.classList.contains('skip-link')) return;
    const hash = link.getAttribute('href');
    if (link.hasAttribute('data-back-to-top')) {
      e.preventDefault();
      scrollToY(0);
      document.getElementById('main')?.focus({ preventScroll: true });
      return;
    }
    if (hash.length < 2) return;
    const target = document.getElementById(decodeURIComponent(hash.slice(1)));
    if (!target) return;
    e.preventDefault();
    scrollToTarget(target);
    // Move keyboard focus too, so the next Tab continues from the target.
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  });
}

/** Smoothly scroll to an element (offset leaves room for the glass nav). */
export function scrollToTarget(el, offset = -90) {
  if (lenis) {
    lenis.scrollTo(el, { offset, duration: 1.2 });
  } else {
    const y = el.getBoundingClientRect().top + window.scrollY + offset;
    window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
  }
}

export function scrollToY(y) {
  if (lenis) lenis.scrollTo(y, { duration: 1.2 });
  else window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
}

/* ---- Freeze / unfreeze page scrolling (counts, so overlays can nest) ---- */
let locks = 0;
export function stopScroll() {
  locks += 1;
  if (locks > 1) return;
  if (lenis) lenis.stop();
  document.documentElement.classList.add('scroll-locked');
}
export function startScroll() {
  locks = Math.max(0, locks - 1);
  if (locks > 0) return;
  document.documentElement.classList.remove('scroll-locked');
  if (lenis) lenis.start();
}
