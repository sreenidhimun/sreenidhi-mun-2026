/* ==========================================================================
   loader.js — the "Scales of Justice" loader (home page, first visit only).

   Timeline (≈ 2.4s):
     0.00–0.60  the stand, beam, chains and pans draw in ink (DrawSVG)
     0.50–1.50  "weighing": the beam tips +9°, −7°, +4° — the pans stay upright
                (if the page is still loading we keep weighing, max 2.5s total)
     1.50–1.80  it settles level with a soft elastic bounce · 100%
     1.80–2.10  the flame ignites at the fulcrum and the glow blooms
     2.10–2.45  hand-off: everything fades except the beam, which becomes a
                full-width line and slides up into the masthead's double rule;
                then the page appears and the hero intro plays.

   Shown once per visitor (localStorage "smunLoaderSeen"). Add ?loader=1 to
   the address to see it again. Reduced motion: the balanced, lit scales show
   for half a second, then fade.
   ========================================================================== */
import { reduce, gsapReady, qs, qsa, wait, fontsReady } from './motion/env.js';
import { stopScroll, startScroll } from './motion/smooth.js';

const html = document.documentElement;
const HALF_BEAM = 170;          // the beam runs from x=90 to x=430 around the fulcrum at x=260
const MAX_WAIT = 2.5;           // seconds: never hold the visitor longer than this

/**
 * Run the loader if the page asked for it (html.is-loading).
 * @param {Function} onReveal  called once, the moment the page becomes visible.
 */
export function runLoader(onReveal) {
  const loader = qs('#loader');

  // Make sure onReveal only ever runs once, whichever path gets there first.
  let revealed = false;
  const reveal = () => {
    if (revealed) return;
    revealed = true;
    html.classList.remove('is-loading');
    onReveal();
  };

  if (!html.classList.contains('is-loading') || !loader) { reveal(); return; }

  try { localStorage.setItem('smunLoaderSeen', '1'); } catch { /* private mode */ }
  stopScroll();

  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    reveal();
    loader.remove();
    startScroll();
  };

  if (!gsapReady()) { finish(); return; }
  const { gsap } = window;

  const svg = qs('.loader__scales', loader);
  const stage = qs('.loader__stage', loader);
  const pct = qs('[data-loader-pct]', loader);
  const skip = qs('[data-loader-skip]', loader);
  const line = qs('[data-loader-line]', loader);
  const beamGroup = qs('#beam-assembly', svg);
  const beam = qs('#beam', svg);
  const panL = qs('#pan-left', svg);
  const panR = qs('#pan-right', svg);
  const flame = qs('#flame', svg);
  const glow = qs('#glow', svg);
  const knob = qs('#knob', svg);

  /* ---- Reduced motion: balanced + lit, then fade ---- */
  if (reduce) {
    gsap.set([flame, glow], { opacity: 1 });
    gsap.to(loader, { opacity: 0, duration: 0.4, delay: 0.5, onComplete: finish });
    skip.addEventListener('click', finish);
    return;
  }

  // Keep the pans hanging straight down from the ends of the tilted beam.
  gsap.set(beamGroup, { svgOrigin: '260 80' });
  const followPans = () => {
    const a = (gsap.getProperty(beamGroup, 'rotation') * Math.PI) / 180;
    const dx = HALF_BEAM * Math.cos(a);
    const dy = HALF_BEAM * Math.sin(a);
    gsap.set(panL, { x: HALF_BEAM - dx, y: -dy });
    gsap.set(panR, { x: dx - HALF_BEAM, y: dy });
  };

  /* ---- Initial state: nothing drawn yet ---- */
  const strokes = qsa('#pillar, #base, #foot', svg);
  const upper = [beam, ...qsa('.chain', svg), ...qsa('.bowl', svg)];
  gsap.set([...strokes, ...upper], { drawSVG: '0%' });
  gsap.set(knob, { scale: 0, transformOrigin: '50% 50%' });
  gsap.set(flame, { opacity: 1, scaleY: 0, transformOrigin: '50% 100%' });
  gsap.set(glow, { scale: 0.6, transformOrigin: '50% 50%' });
  gsap.set(stage, { opacity: 1 });

  const pageLoaded = new Promise((res) => {
    if (document.readyState === 'complete') res();
    else window.addEventListener('load', res, { once: true });
  });
  const startedAt = performance.now();
  const counter = { v: 0 };
  const showPct = () => { pct.textContent = Math.round(counter.v); };
  let hold = null;
  let creep = null;

  const tl = gsap.timeline({ paused: true });

  // 0.00–0.60 — ink draws
  tl.to(strokes, { drawSVG: '100%', duration: 0.42, stagger: 0.08, ease: 'power2.inOut' }, 0)
    .to(upper, { drawSVG: '100%', duration: 0.4, stagger: 0.03, ease: 'power2.inOut' }, 0.18)
    .to(knob, { scale: 1, duration: 0.3, ease: 'back.out(2)' }, 0.3)
    .to(counter, { v: 90, duration: 1.5, ease: 'power1.inOut', onUpdate: showPct }, 0);

  // 0.50–1.50 — weighing (+9°, −7°, +4°)
  tl.to(beamGroup, { rotation: 9, duration: 0.34, ease: 'sine.inOut', onUpdate: followPans }, 0.5)
    .to(beamGroup, { rotation: -7, duration: 0.34, ease: 'sine.inOut', onUpdate: followPans }, 0.84)
    .to(beamGroup, { rotation: 4, duration: 0.32, ease: 'sine.inOut', onUpdate: followPans }, 1.18);

  // 1.50 — still loading? keep weighing gently until ready (never past MAX_WAIT).
  tl.add(() => {
    const elapsed = (performance.now() - startedAt) / 1000;
    const budget = MAX_WAIT - 0.9 - elapsed;        // 0.9s = what's left of the timeline
    if (document.readyState === 'complete' || budget <= 0) return;
    tl.pause();
    hold = gsap.to(beamGroup, { rotation: -4, duration: 0.45, ease: 'sine.inOut', yoyo: true, repeat: -1, onUpdate: followPans });
    creep = gsap.to(counter, { v: 97, duration: 2, ease: 'power1.out', onUpdate: showPct });
    Promise.race([pageLoaded, wait(budget * 1000)]).then(() => {
      hold.kill(); creep.kill();
      if (!finished) tl.resume();
    });
  }, 1.5);

  // 1.50–1.80 — settle level
  tl.to(beamGroup, { rotation: 0, duration: 0.3, ease: 'elastic.out(1, 0.55)', onUpdate: followPans }, 1.5)
    .to(counter, { v: 100, duration: 0.3, ease: 'power2.out', onUpdate: showPct }, 1.5);

  // 1.80–2.10 — ignite
  tl.to(glow, { opacity: 1, scale: 1, duration: 0.3, ease: 'power2.out' }, 1.8)
    .to(flame, { scaleY: 1, duration: 0.3, ease: 'back.out(1.8)' }, 1.8)
    .to(flame, { keyframes: { scaleX: [0.92, 1.04, 0.92, 1.04, 1] }, duration: 0.28, ease: 'none' }, 1.84);

  // 2.10 — hand the beam over to the masthead
  tl.add(handoff, 2.1);

  function handoff() {
    const b = beam.getBoundingClientRect();
    const rule = qs('[data-masthead-rule]');
    const r = rule ? rule.getBoundingClientRect() : { top: 0, left: 0, width: window.innerWidth };
    const vw = window.innerWidth;
    loader.classList.add('is-leaving');          // keeps the overlay visible after is-loading goes
    gsap.set(line, { opacity: 1, x: b.left, y: b.top + b.height / 2 - 1, scaleX: b.width / vw });

    gsap.timeline({ onComplete: finish })
      .set(beam, { opacity: 0 }, 0)
      .to([...qsa('.loader__top, .loader__caption, .loader__pct, .loader__skip', loader),
        glow, flame, knob, panL, panR, ...strokes], { opacity: 0, duration: 0.18, ease: 'power1.out' }, 0)
      .to(line, { x: 0, scaleX: 1, duration: 0.16, ease: 'power2.inOut' }, 0.04)
      .to(line, { y: r.top, x: r.left, scaleX: r.width / vw, duration: 0.24, ease: 'power3.inOut' }, 0.2)
      .add(reveal, 0.44)                          // page shows beneath; hero intro starts
      .to(loader, { opacity: 0, duration: 0.32, ease: 'power1.out' }, 0.44);
  }

  /* ---- Skip: straight to the page ---- */
  skip.addEventListener('click', () => {
    tl.kill();
    if (hold) hold.kill();
    if (creep) creep.kill();
    loader.classList.add('is-leaving');
    gsap.to(loader, { opacity: 0, duration: 0.25, ease: 'power2.out', onComplete: finish });
    reveal();
  });

  // Start once the fonts are in (so the caption doesn't swap mid-animation) — max 0.8s wait.
  Promise.race([fontsReady, wait(800)]).then(() => { if (!finished) tl.play(); });
}
