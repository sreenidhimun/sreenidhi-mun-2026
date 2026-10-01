/* ==========================================================================
   newspaper.js — the home page's front page, and its "delivery".

   renderFrontPage(site, delegateTicket)
     Fills the parts that come from data: the lead story (site.json →
     frontPage.story), the "Inside this edition" index (built from the site
     navigation + frontPage.inside blurbs), the T–minus ear (countdownTarget)
     and the registration stamp (the delegate ticket in registrations.json).

   deliverNewspaper({ delay })
     The statement piece. The paper arrives folded in half (only the top half,
     "above the fold", shows), falls from above the screen in front of the
     masthead, lands with a little squash and slide, then the bottom half
     swings down from behind the fold. Finally it settles straight, the
     "Open" stamps thump onto the notices and the logo draws itself in ink.
       • ≈2 seconds. Any click, key, scroll or touch finishes it instantly.
       • Phones: the paper drops and slides but doesn't fold (too tall).
       • Reduced motion: no delivery — the paper is simply there.
     Returns a promise that resolves once the paper has settled.
   ========================================================================== */
import { motionOK, qs, qsa } from './motion/env.js';
import { stopScroll, startScroll } from './motion/smooth.js';
import { esc, stampFor } from './data.js';
import { NAV } from './chrome.js';
import { countUp } from './main.js';

/* ==========================================================================
   Content
   ========================================================================== */
export function renderFrontPage(site = {}, delegate = null, press = null) {
  const fp = site.frontPage || {};

  // Lead story — the first paragraph gets the drop cap (CSS).
  const story = qs('[data-np-story]');
  if (story && Array.isArray(fp.story) && fp.story.length) {
    story.innerHTML = fp.story.map((p) => `<p>${esc(p)}</p>`).join('');
  }

  // "Inside this edition": every page except Home, numbered A2, A3 …
  const index = qs('[data-np-index]');
  if (index) {
    const blurbs = fp.inside || {};
    index.innerHTML = NAV.filter((n) => n.id !== 'home').map((n, i) => `
      <li><a href="${n.href}">
        <span class="np__index-name">${esc(n.label)}</span>
        <span class="np__index-folio">A${i + 2}</span>
        ${blurbs[n.id] ? `<span class="np__index-blurb">${esc(blurbs[n.id])}</span>` : ''}
      </a></li>`).join('');
  }

  renderTminus(site);

  // Registration notices (delegates on the right, International Press on the
  // left): each gets its ticket's status stamp + description from registrations.json.
  const tickets = { delegate, press };
  for (const [id, ticket] of Object.entries(tickets)) {
    if (!ticket) continue;
    const stamp = qs(`[data-np-stamp="${id}"]`);
    if (stamp) {
      const s = stampFor(ticket);
      stamp.className = `stamp stamp--${s.cls} np__stamp`;
      stamp.innerHTML = `<span class="sr-only">Registration status: </span>${esc(s.text)}`;
      stamp.hidden = false;
    }
    const text = qs(`[data-np-ad-text="${id}"]`);
    if (text && ticket.description) text.textContent = ticket.description;
  }

  fitNameplate();
}

/* The right-hand "ear": T–minus N days, or the conference's state. */
function renderTminus(site) {
  const ear = qs('[data-np-tminus]');
  if (!ear) return;
  const kicker = qs('.np__ear-kicker', ear);
  const big = qs('[data-np-days]', ear);
  const label = qs('[data-np-days-label]', ear);
  const target = Date.parse(site.countdownTarget || '');
  const end = Date.parse(site.conferenceEnd || '');
  const now = Date.now();

  if (isNaN(target)) {
    kicker.textContent = 'Dates';
    big.textContent = '';
    label.textContent = 'To be announced';
  } else if (now < target) {
    const days = Math.ceil((target - now) / 864e5);
    kicker.textContent = 'T–minus';
    big.textContent = days;
    label.textContent = days === 1 ? 'day to Day I' : 'days to Day I';
  } else {
    kicker.textContent = 'Latest';
    big.textContent = '';
    label.textContent = isNaN(end) || now < end ? 'In session' : 'Concluded';
  }
}

/* On wide screens the nameplate sits on one line between the ears:
   shrink its type until it fits (max 72px). */
const NAME_MAX = 72;
export function fitNameplate() {
  const name = qs('.np__nameplate');
  const sheet = name?.closest('.np');
  if (!name || !sheet) return;
  sheet.style.removeProperty('--np-name-size');
  if (!window.matchMedia('(min-width: 1000px)').matches) return;
  sheet.style.setProperty('--np-name-size', `${NAME_MAX}px`);
  const available = name.clientWidth;
  const needed = name.scrollWidth;
  if (needed > available) {
    sheet.style.setProperty('--np-name-size', `${Math.floor((NAME_MAX * available) / needed) - 1}px`);
  }
}
let fitTimer = 0;
window.addEventListener('resize', () => {
  clearTimeout(fitTimer);
  fitTimer = setTimeout(fitNameplate, 150);
});

/* ==========================================================================
   The delivery
   ========================================================================== */
export function deliverNewspaper({ delay = 0 } = {}) {
  const stage = qs('[data-np-stage]');
  if (!stage) return Promise.resolve();
  fitNameplate();                                   // fonts are in by now

  if (!motionOK()) {
    stage.style.visibility = 'visible';
    return Promise.resolve();
  }

  const { gsap } = window;
  const sheet = qs('[data-np]', stage);
  const shadow = qs('[data-np-shadow]', stage);
  const under = qs('[data-np-under]', stage);
  const crease = qs('[data-np-crease]', stage);
  const stamps = qsa('[data-np-stamp]:not([hidden])', stage);
  const mark = qs('.hero__emblem [data-emblem-mark]', stage);      // the logo's path
  const glow = qs('[data-hero-glow]', stage);
  const fold = window.matchMedia('(min-width: 768px)').matches;   // phones: drop only

  return new Promise((resolve) => {
    let finished = false;
    let flap = null;
    stopScroll();

    // Numbers in "At a glance" count up after landing (or when scrolled to).
    const landing = delay + (fold ? 2.0 : 1.4);
    qsa('[data-np-count]', stage).forEach((el) => {
      const inView = el.getBoundingClientRect().top < window.innerHeight;
      countUp(el, { delay: inView ? landing : 0.2, duration: 1.2 });
    });

    /* ---- Starting position: folded, tilted, above the screen ---- */
    const rect = stage.getBoundingClientRect();
    const visibleHeight = fold ? rect.height / 2 : rect.height;
    const fromY = -(rect.top + visibleHeight + 160);

    if (stamps.length) gsap.set(stamps, { opacity: 0, scale: 1.7 });
    // The logo starts as an empty outline waiting to be "inked".
    if (mark) gsap.set(mark, { attr: { stroke: '#E48023', 'stroke-width': 3 }, fillOpacity: 0, drawSVG: '0%' });
    if (fold) flap = buildFlap(stage, sheet);        // clone first, so it matches the page exactly
    gsap.set(stage, {
      visibility: 'visible',
      y: fromY,
      x: fold ? -60 : -24,
      rotation: fold ? -11 : -6,
      rotationX: fold ? 28 : 14,
      transformPerspective: 1800,
      transformOrigin: fold ? '50% 25%' : '50% 40%',
    });
    gsap.set(shadow, { opacity: 0, scaleX: 1.25, scaleY: fold ? 0.62 : 1.25 });
    gsap.set(under, { opacity: 0 });
    if (fold) {
      gsap.set(sheet, { clipPath: 'inset(0% 0% 50% 0%)' });   // only the top half shows
      gsap.set(crease, { opacity: 1 });
      gsap.set(flap, { visibility: 'hidden', rotationX: -90, transformPerspective: 1400, transformOrigin: '50% 0%' });
    }

    const tl = gsap.timeline({ delay, onComplete: finish });

    /* ---- 1. Fall (gravity: speeds up) ---- */
    const fall = fold ? 0.8 : 0.65;
    tl.to(stage, { y: 0, x: fold ? -14 : -6, rotation: fold ? -4 : -2, rotationX: 0, duration: fall, ease: 'power3.in' }, 0)
      .to(shadow, { opacity: 1, scaleX: 1, scaleY: fold ? 0.5 : 1, duration: fall, ease: 'power3.in' }, 0);

    /* ---- 2. Land: a tiny squash, then it slides to a stop ---- */
    tl.to(stage, { scaleY: 0.985, duration: 0.07, ease: 'power2.out', yoyo: true, repeat: 1 }, fall)
      .to(stage, { x: 0, rotation: fold ? -1.5 : 0, duration: 0.5, ease: 'power3.out' }, fall);

    /* ---- 3. Unfold: the bottom half swings down from behind the fold ---- */
    if (fold) {
      const t = 1.1;
      const shade = qs('.np__flap-shade', flap);
      tl.set(flap, { visibility: 'visible' }, t)
        .to(flap, { rotationX: 0, duration: 0.45, ease: 'power2.in' }, t)
        .to(flap, { rotationX: -5, duration: 0.12, ease: 'power1.out' }, t + 0.45)   // a little rebound
        .to(flap, { rotationX: 0, duration: 0.15, ease: 'power2.in' }, t + 0.57)
        .fromTo(shade, { opacity: 1 }, { opacity: 0, duration: 0.7, ease: 'power1.in' }, t)
        .to(shadow, { scaleY: 1, duration: 0.45, ease: 'power2.in' }, t)
        .add(unfolded, t + 0.74);
    }

    /* ---- 4. Settle straight, stamps, logo ---- */
    const settle = fold ? 1.85 : 1.15;
    tl.to(stage, { rotation: 0, duration: 0.35, ease: 'power2.inOut' }, settle)
      .to(under, { opacity: 1, duration: 0.4 }, settle);
    if (fold) tl.to(crease, { opacity: 0, duration: 0.5 }, settle);
    if (stamps.length) {
      tl.to(stamps, { opacity: 0.85, scale: 1, duration: 0.2, ease: 'power4.in', stagger: 0.18 }, settle + 0.1);
    }
    if (mark) {
      // The outline draws itself, then the orange "ink" floods in.
      tl.to(mark, { drawSVG: '100%', duration: 0.6, ease: 'power2.inOut' }, settle)
        .to(mark, { fillOpacity: 1, duration: 0.35, ease: 'power1.out' }, settle + 0.3);
    }

    /* ---- Impatient visitor? Jump straight to the end. ---- */
    const skip = () => tl.progress(1);
    const SKIP_EVENTS = ['wheel', 'touchstart', 'keydown', 'pointerdown'];
    SKIP_EVENTS.forEach((ev) => window.addEventListener(ev, skip, { passive: true }));

    function unfolded() {
      if (flap) { flap.remove(); flap = null; }
      gsap.set(sheet, { clearProps: 'clipPath' });
    }

    function finish() {
      if (finished) return;
      finished = true;
      SKIP_EVENTS.forEach((ev) => window.removeEventListener(ev, skip));
      unfolded();
      gsap.set(stage, { clearProps: 'transform' });     // crisp text at rest
      if (mark) {                                         // a plain filled logo again
        gsap.set(mark, { clearProps: 'all' });
        mark.removeAttribute('stroke');
        mark.removeAttribute('stroke-width');
      }
      if (crease) gsap.set(crease, { opacity: 0 });
      startScroll();
      breathe(glow);
      resolve();
    }
  });
}

/* --------------------------------------------------------------------------
   The folding flap: a copy of the page (hidden from screen readers and
   keyboard) cropped to its bottom half, hinged at the fold line.
   -------------------------------------------------------------------------- */
function buildFlap(stage, sheet) {
  const width = sheet.offsetWidth;
  const height = sheet.offsetHeight;
  const half = height / 2;

  const flap = document.createElement('div');
  flap.className = 'np__flap';
  flap.setAttribute('aria-hidden', 'true');
  flap.inert = true;
  Object.assign(flap.style, {
    left: `${sheet.offsetLeft}px`,
    top: `${sheet.offsetTop + half}px`,
    width: `${width}px`,
    height: `${Math.ceil(half)}px`,
  });

  const copy = sheet.cloneNode(true);
  copy.removeAttribute('data-np');
  copy.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
  copy.querySelectorAll('[aria-labelledby]').forEach((el) => el.removeAttribute('aria-labelledby'));
  Object.assign(copy.style, { width: `${width}px`, height: `${height}px`, top: `${-half}px` });

  const shade = document.createElement('span');
  shade.className = 'np__flap-shade';
  flap.append(copy, shade);
  stage.appendChild(flap);
  return flap;
}

/* The emblem's glow "breathes" — paused whenever it's off-screen. */
function breathe(glow) {
  if (!glow || !motionOK()) return;
  const { gsap, ScrollTrigger } = window;
  const tween = gsap.fromTo(glow, { opacity: 0.7, scale: 0.98 }, {
    opacity: 1, scale: 1.02, duration: 3, ease: 'sine.inOut', yoyo: true, repeat: -1, paused: true,
  });
  ScrollTrigger.create({
    trigger: glow, start: 'top bottom', end: 'bottom top',
    onToggle: (self) => (self.isActive ? tween.play() : tween.pause()),
  });
  if (ScrollTrigger.isInViewport(glow)) tween.play();
}
