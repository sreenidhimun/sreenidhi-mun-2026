/* ==========================================================================
   main.js — shared bootstrap for every page.
   - registers GSAP plugins and starts smooth scrolling, page-turns
     and magnetic buttons (the normal mouse cursor is used everywhere)
   - loads data/site.json and fills [data-site-*] slots
   - mobile menu, glass pill nav, reading-progress line
   - the scroll-reveal system (reveal()) used by every page

   Page scripts import what they need from here, e.g.
     import { site, ready, reveal, refreshSoon } from './main.js';
   ========================================================================== */
import { reduce, canHover, isTouch, gsapReady, motionOK, fontsReady, qs, qsa, trapFocus, announce } from './motion/env.js';
import { bindSite, loadLogo, writeCache, getPath } from './chrome.js';
import { fetchJSON } from './data.js';
import { initSmooth, stopScroll, startScroll } from './motion/smooth.js';
import { initTransitions } from './motion/transitions.js';
import { initMagnetic } from './motion/magnetic.js';

export { reduce, canHover, isTouch, motionOK };

const html = document.documentElement;

/* ---- 0. Safety: if GSAP didn't arrive, show everything statically ---- */
clearTimeout(window.__smunFailsafe);
if (!gsapReady()) {
  html.classList.add('motion-failsafe');
} else {
  const { gsap, ScrollTrigger, SplitText, DrawSVGPlugin, Flip, Observer } = window;
  gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin, Flip, Observer);
  ScrollTrigger.config({ ignoreMobileResize: true });   // no jumps when the phone's address bar hides
}

/* ---- 1. Site data ---- */
export const site = fetchJSON('data/site.json').then((data) => {
  if (data) {
    writeCache('smunSite', data);
    bindSite(data);
    loadLogo(data.logo);
  }
  return data || {};
});

/** Resolves when site.json and the web fonts are both ready. */
export const ready = Promise.all([site, fontsReady]).then(([data]) => data);

/* ---- 2. "Page shown" — on the home page the loader resolves this when it
         hands over; everywhere else it's immediate. Reveals wait for it. ---- */
let resolveShown;
export const pageShown = new Promise((res) => { resolveShown = res; });
export function markPageShown() { resolveShown(); }
if (!html.classList.contains('is-loading')) markPageShown();

/* ---- 3. Refresh ScrollTrigger after content changes size ---- */
let refreshTimer = 0;
export function refreshSoon(delay = 120) {
  if (!gsapReady()) return;
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(() => window.ScrollTrigger.refresh(), delay);
}
window.addEventListener('load', () => refreshSoon(0));
// Late-loading images can change heights: refresh once they arrive.
document.addEventListener('load', (e) => { if (e.target.tagName === 'IMG') refreshSoon(250); }, true);

/* ---- 4. Start the motion layer ---- */
initSmooth();
initTransitions();
if (canHover && !reduce) initMagnetic();
initMenu();
initPill();
initProgress();
initCopyButtons();

ready.then(() => reveal(document));

/* ==========================================================================
   Mobile menu (full-screen overlay)
   ========================================================================== */
function initMenu() {
  const menu = qs('#site-menu');
  if (!menu) return;
  const openers = qsa('[data-menu-open]');
  const closer = qs('[data-menu-close]', menu);
  let release = null;
  let isOpen = false;

  function open(trigger) {
    if (isOpen) return;
    isOpen = true;
    menu.hidden = false;
    openers.forEach((b) => b.setAttribute('aria-expanded', 'true'));
    stopScroll();
    release = trapFocus(menu, trigger);
    closer.focus({ preventScroll: true });
    if (motionOK()) {
      const { gsap } = window;
      gsap.fromTo(menu, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power2.out' });
      gsap.fromTo(qsa('.menu__links li, .menu__dateline, .menu__cta', menu),
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.55, stagger: 0.05, ease: 'power3.out', delay: 0.08 });
    }
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    openers.forEach((b) => b.setAttribute('aria-expanded', 'false'));
    if (release) { release(); release = null; }
    const done = () => { menu.hidden = true; startScroll(); };
    if (motionOK()) window.gsap.to(menu, { opacity: 0, duration: 0.25, ease: 'power2.in', onComplete: done });
    else done();
  }

  openers.forEach((btn) => btn.addEventListener('click', () => open(btn)));
  closer.addEventListener('click', close);
  menu.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  // If the window grows to desktop size, the menu isn't needed any more.
  window.matchMedia('(min-width: 1200px)').addEventListener('change', (e) => { if (e.matches) close(); });
}

/* ==========================================================================
   Glass pill nav — appears once the masthead has scrolled away,
   hides while scrolling down quickly, returns on scroll up.
   ========================================================================== */
function initPill() {
  const pill = qs('.pill-nav');
  const masthead = qs('.masthead');
  if (!pill || !masthead) return;
  let pastMasthead = false;
  let hiddenByScroll = false;

  function render() {
    const show = pastMasthead && !hiddenByScroll;
    pill.classList.toggle('is-visible', show);
    html.classList.toggle('pill-visible', show);
    pill.inert = !show;
  }

  new IntersectionObserver(([entry]) => {
    pastMasthead = !entry.isIntersecting && entry.boundingClientRect.top < 0;
    if (!pastMasthead) hiddenByScroll = false;
    render();
  }).observe(masthead);

  const onDirection = (down, fast) => {
    if (pill.contains(document.activeElement)) return;   // never yank it away from a keyboard user
    if (down && fast && !hiddenByScroll) { hiddenByScroll = true; render(); }
    else if (!down && hiddenByScroll) { hiddenByScroll = false; render(); }
  };

  if (gsapReady()) {
    window.ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => onDirection(self.direction === 1, Math.abs(self.getVelocity()) > 1600),
    });
  } else {
    let lastY = window.scrollY;
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      onDirection(y > lastY, y - lastY > 30);
      lastY = y;
    }, { passive: true });
  }
}

/* ==========================================================================
   Reading-progress line (under the pill nav, or along the top of the
   window while the masthead is visible).
   ========================================================================== */
function initProgress() {
  const lines = qsa('.progress-line');
  if (!lines.length) return;
  if (gsapReady()) {
    const setScale = window.gsap.quickSetter(lines, 'scaleX');
    window.ScrollTrigger.create({ start: 0, end: 'max', onUpdate: (self) => setScale(self.progress) });
  } else {
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? window.scrollY / max : 0;
      lines.forEach((l) => { l.style.transform = `scaleX(${p})`; });
    };
    window.addEventListener('scroll', update, { passive: true });
    update();
  }
}

/* ==========================================================================
   Copy buttons (anywhere on the site)
     <button data-copy="text to copy">Copy</button>
     <button data-copy-from="contact.email">Copy</button>   ← value from site.json
   The button says "Copied ✓" for 1.8s and screen readers hear it too.
   ========================================================================== */
function initCopyButtons() {
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-copy], [data-copy-from]');
    if (!btn) return;
    let text = btn.dataset.copy;
    if (!text && btn.dataset.copyFrom) text = getPath(await site, btn.dataset.copyFrom);
    if (!text) return;
    const ok = await copyText(String(text));
    if (!btn.dataset.label) btn.dataset.label = btn.textContent;
    btn.textContent = ok ? 'Copied ✓' : 'Select & copy';
    btn.classList.toggle('is-done', ok);
    announce(ok ? `Copied to clipboard: ${text}` : 'Could not copy automatically.');
    clearTimeout(btn._copyTimer);
    btn._copyTimer = setTimeout(() => {
      btn.textContent = btn.dataset.label;
      btn.classList.remove('is-done');
    }, 1800);
  });
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older browsers / non-secure pages: fall back to a hidden textarea.
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
    document.body.appendChild(area);
    area.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    area.remove();
    return ok;
  }
}

/* ==========================================================================
   REVEAL SYSTEM — call reveal(container) after adding content to a page.
   Markup hooks:
     [data-reveal]            fade + rise 24px when it scrolls into view
     [data-reveal-delay="0.2"] optional delay (seconds)
     [data-reveal-stagger]    its children reveal one after another (.08s)
     [data-split]             headline: lines rise out of a mask
     [data-draw]              a rule that draws itself left → right
     .section-head[data-reveal]  numeral slides in, then title, then label
     [data-count]             a number that counts up (e.g. "800")
   Each element is only ever set up once.
   ========================================================================== */
const START = 'top 85%';

function claim(el) {
  if (el.dataset.motionDone) return false;
  el.dataset.motionDone = '1';
  return true;
}
const delayOf = (el, fallback = 0) => parseFloat(el.dataset.revealDelay || fallback) || 0;

export function reveal(root = document) {
  if (!motionOK()) return;
  const { gsap, SplitText } = window;

  pageShown.then(() => {
    // Headlines split into lines.
    qsa('[data-split]', root).forEach((el) => {
      if (!claim(el)) return;
      splitLines(el, { delay: delayOf(el), trigger: true });
    });

    // Numbered section heads.
    qsa('.section-head[data-reveal]', root).forEach((el) => {
      if (!claim(el)) return;
      gsap.set(el, { opacity: 1 });
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: START, once: true } });
      const num = qs('.numeral, .section-head__glyph', el);
      const title = qs('.h-section', el);
      const meta = qs('.meta', el);
      if (num) tl.from(num, { x: -12, skewX: -14, opacity: 0, duration: 0.6, ease: 'power3.out' }, 0);
      if (title) tl.from(title, { y: 24, opacity: 0, duration: 0.8, ease: 'power3.out' }, 0.12);
      if (meta) tl.from(meta, { y: 8, opacity: 0, duration: 0.6, ease: 'power2.out' }, 0.3);
    });

    // Plain blocks.
    qsa('[data-reveal]', root).forEach((el) => {
      if (!claim(el)) return;
      gsap.fromTo(el, { y: 24, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: delayOf(el),
        scrollTrigger: { trigger: el, start: START, once: true },
      });
    });

    // Staggered groups.
    qsa('[data-reveal-stagger]', root).forEach((el) => {
      if (!claim(el)) return;
      gsap.fromTo(el.children, { y: 24, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', stagger: 0.08, delay: delayOf(el),
        scrollTrigger: { trigger: el, start: START, once: true },
      });
    });

    // Rules.
    qsa('[data-draw]', root).forEach((el) => {
      if (!claim(el)) return;
      gsap.fromTo(el, { scaleX: 0 }, {
        scaleX: 1, duration: 1, ease: 'power2.out', transformOrigin: '0% 50%', delay: delayOf(el),
        scrollTrigger: { trigger: el, start: 'top 92%', once: true },
      });
    });

    // Counting numbers.
    qsa('[data-count]', root).forEach((el) => {
      if (!claim(el)) return;
      countUp(el);
    });
  });
}

/** Split a headline into lines that rise out of a mask. Returns the SplitText instance. */
export function splitLines(el, { delay = 0, stagger = 0.09, duration = 0.9, trigger = false } = {}) {
  const { gsap, SplitText } = window;
  gsap.set(el, { opacity: 1 });
  return SplitText.create(el, {
    type: 'lines',
    mask: 'lines',
    linesClass: 'split-line',
    autoSplit: true,
    onSplit(self) {
      return gsap.from(self.lines, {
        yPercent: 110,
        duration,
        stagger,
        delay,
        ease: 'power3.out',
        scrollTrigger: trigger ? { trigger: el, start: 'top 90%', once: true } : undefined,
      });
    },
  });
}

/** Count a number up from 0 ("800" → 0…800). Non-numbers are left alone. */
export function countUp(el, { duration = 1.4, delay = 0.2 } = {}) {
  const text = el.textContent.trim();
  const match = text.match(/^(\d[\d,]*)(\+?)$/);
  if (!match || !motionOK()) return;
  const target = parseInt(match[1].replace(/,/g, ''), 10);
  const suffix = match[2];
  const counter = { v: 0 };
  el.textContent = '0' + suffix;
  window.gsap.to(counter, {
    v: target,
    duration,
    delay,
    ease: 'power2.out',
    scrollTrigger: { trigger: el, start: 'top 92%', once: true },
    onUpdate: () => { el.textContent = Math.round(counter.v).toLocaleString('en-IN') + suffix; },
  });
}
