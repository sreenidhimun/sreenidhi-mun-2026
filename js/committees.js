/* ==========================================================================
   committees.js — both committee pages.
     committees.html            → the list of committees (+ floating logo)
     committee.html?id=<slug>   → one committee, built from its entry in
                                  data/committees.json (unknown id → "not found")
   ========================================================================== */
import { ready, reveal, refreshSoon } from './main.js';
import { motionOK, canHover, isTouch, qs, qsa, clamp } from './motion/env.js';
import { fetchJSON, esc, isBlank, toRoman } from './data.js';
import { initNameList } from './namelist.js';

const listEl = qs('[data-committee-list]');
const pageEl = qs('[data-committee-page]');

fetchJSON('data/committees.json').then(async (data) => {
  const committees = data?.committees || [];
  if (listEl) renderIndex(committees);
  if (pageEl) renderCommittee(committees);
  await ready;
  reveal(document);
  refreshSoon();
});

/* --------------------------------------------------------------------------
   A committee's round logo: its image if there is one, otherwise a circle in
   the committee colour with its abbreviation.
   -------------------------------------------------------------------------- */
export function logoHTML(c, size) {
  const abbr = c.abbr || c.name.split(/\s+/).map((w) => w[0]).join('').slice(0, 5);
  const factor = abbr.length <= 2 ? 0.34 : abbr.length <= 3 ? 0.28 : abbr.length <= 5 ? 0.2 : 0.17;
  const inner = isBlank(c.logo)
    ? `<span class="c-logo__abbr" style="font-size:${Math.round(size * factor)}px">${esc(abbr)}</span>`
    : `<img src="${esc(c.logo)}" alt="" loading="lazy" decoding="async">`;
  return `<span class="c-logo" style="--c:${esc(c.color || '#3F6A55')};--size:${size}px" aria-hidden="true">${inner}</span>`;
}

/* ==========================================================================
   Index
   ========================================================================== */
function renderIndex(committees) {
  listEl.innerHTML = committees.map((c, i) => `
    <li>
      <a class="committee-row" href="committee.html?id=${encodeURIComponent(c.slug)}" data-i="${i}"
         data-cursor="view" data-cursor-label="Open →">
        <span class="committee-row__num" aria-hidden="true">${toRoman(i + 1)}.</span>
        <span class="committee-row__logo">${logoHTML(c, 52)}</span>
        <span class="committee-row__name">${esc(c.name)}</span>
        <span class="committee-row__agenda">Agenda: ${esc(c.agenda)}</span>
        <span class="committee-row__arrow" aria-hidden="true"><span class="committee-row__open">Open</span> →</span>
      </a>
    </li>`).join('');
  listEl.setAttribute('data-reveal-stagger', '');
  initFloatingLogo(committees);
}

/* --------------------------------------------------------------------------
   Floating logo: a 200px circle that follows the pointer while you hover the
   list, tilting with your movement. Desktop with a mouse only.
   -------------------------------------------------------------------------- */
function initFloatingLogo(committees) {
  if (!canHover || !motionOK()) return;
  const { gsap } = window;
  const float = document.createElement('div');
  float.className = 'float-logo';
  float.setAttribute('aria-hidden', 'true');
  document.body.appendChild(float);
  gsap.set(float, { scale: 0, rotation: -4, xPercent: -50, yPercent: -50 });

  const moveX = gsap.quickTo(float, 'x', { duration: 0.5, ease: 'power3' });
  const moveY = gsap.quickTo(float, 'y', { duration: 0.5, ease: 'power3' });
  const turn = gsap.quickTo(float, 'rotation', { duration: 0.6, ease: 'power3' });
  let lastX = 0;
  let lastT = 0;
  let stillTimer = 0;
  let current = -1;
  let placed = false;

  listEl.addEventListener('pointermove', (e) => {
    if (!placed) { gsap.set(float, { x: e.clientX + 40, y: e.clientY - 100 }); placed = true; }
    moveX(e.clientX + 40);
    moveY(e.clientY - 100);
    // Tilt with horizontal speed (px per second × 0.02, max ±8°).
    const now = performance.now();
    const velocityX = ((e.clientX - lastX) / Math.max(1, now - lastT)) * 1000;
    lastX = e.clientX; lastT = now;
    turn(clamp(velocityX * 0.02, -8, 8));
    clearTimeout(stillTimer);
    stillTimer = setTimeout(() => turn(-4), 120);
  });

  qsa('.committee-row', listEl).forEach((row) => {
    row.addEventListener('pointerenter', () => {
      const i = Number(row.dataset.i);
      if (i === current) return;
      const wasHidden = current === -1;
      current = i;
      const html = logoHTML(committees[i], 200);
      if (wasHidden) {
        float.innerHTML = html;
        gsap.to(float, { scale: 1, duration: 0.35, ease: 'back.out(1.7)', overwrite: 'auto' });
      } else {
        // Quick cross-fade between committees.
        const next = document.createElement('div');
        next.className = 'float-logo__layer';
        next.innerHTML = html;
        float.appendChild(next);
        gsap.fromTo(next, { opacity: 0 }, {
          opacity: 1, duration: 0.2, ease: 'power1.out',
          onComplete: () => { float.innerHTML = html; },
        });
      }
    });
  });
  listEl.addEventListener('pointerleave', () => {
    current = -1;
    gsap.to(float, { scale: 0, duration: 0.3, ease: 'power2.in', overwrite: 'auto' });
  });
}

/* ==========================================================================
   Committee template (committee.html?id=slug)
   ========================================================================== */
function renderCommittee(committees) {
  const id = new URLSearchParams(location.search).get('id');
  const index = committees.findIndex((c) => c.slug === id);
  const c = committees[index];

  if (!c) {
    document.title = 'Committee not found — SMUN XIV';
    pageEl.innerHTML = `
      <header class="page-head container">
        <p class="kicker" data-reveal>The Committees</p>
        <h1 class="h-page" data-split>Committee not found.</h1>
        <p class="deck" data-reveal data-reveal-delay="0.3">We couldn’t find ${id ? `a committee called “${esc(id)}”` : 'that committee'}. It may have been renamed — the full list is one click away.</p>
        <div class="rule" data-draw></div>
      </header>
      <div class="container committee-missing" data-reveal>
        <a class="btn btn--primary" href="committees.html"><span aria-hidden="true">←</span> All committees</a>
      </div>`;
    return;
  }

  const roman = toRoman(index + 1);
  document.title = `${c.name} — SMUN XIV`;
  const desc = document.querySelector('meta[name="description"]');
  const blurb = `${c.name} at Sreenidhi Model United Nations XIV — agenda, executive board and background guide.`;
  if (desc) desc.setAttribute('content', blurb);
  document.querySelector('meta[property="og:title"]')?.setAttribute('content', document.title);
  document.querySelector('meta[property="og:description"]')?.setAttribute('content', blurb);

  const g = c.guide || {};
  const hasPdf = !isBlank(g.pdf);
  const size = isBlank(g.sizeMB) ? '[ 0.0 ] MB' : `${g.sizeMB} MB`;
  const pages = isBlank(g.pages) ? '[ 00 ]' : g.pages;
  const guideActions = hasPdf
    ? `<a class="btn btn--primary" href="${esc(g.pdf)}" download>Download PDF <span aria-hidden="true">↓</span></a>
       <a class="btn btn--ghost" href="${esc(g.pdf)}" target="_blank" rel="noopener">Preview in browser<span class="sr-only"> (opens in a new tab)</span></a>`
    : `<span class="btn btn--primary is-disabled" aria-disabled="true">Background guide coming soon</span>`;

  pageEl.innerHTML = `
    <div class="container committee-top">
      <nav class="breadcrumb" aria-label="Breadcrumb" data-reveal>
        <a href="committees.html">Committees</a><span aria-hidden="true">/</span><span aria-current="page">${esc(c.name)}</span>
      </nav>
      <header class="committee-hero">
        <div class="committee-hero__logo" data-reveal>${logoHTML(c, 240)}</div>
        <div class="committee-hero__text">
          <p class="kicker" data-reveal>Committee ${roman}</p>
          <h1 class="committee-hero__name" data-split data-reveal-delay="0.1">${esc(c.name)}</h1>
          <p class="meta committee-hero__label" data-reveal data-reveal-delay="0.3">The Agenda</p>
          <p class="committee-hero__agenda" data-reveal data-reveal-delay="0.35">“${esc(c.agenda)}”</p>
        </div>
      </header>
      <div class="rule" data-draw></div>
      <dl class="facts" data-reveal-stagger>
        <div class="facts__cell"><dt class="kicker">Level</dt><dd class="facts__value">${esc(c.level)}</dd></div>
        <div class="facts__cell"><dt class="kicker">Delegates</dt><dd class="facts__value" data-count>${esc(c.delegates)}</dd></div>
        <div class="facts__cell"><dt class="kicker">Procedure</dt><dd class="facts__value">${esc(c.procedure)}</dd></div>
        <div class="facts__cell"><dt class="kicker">Background Guide</dt><dd class="facts__value">PDF · ${esc(size)}</dd></div>
      </dl>
      <div class="rule" data-draw></div>
    </div>

    <section class="section board" aria-labelledby="board-title">
      <div class="container">
        <header class="section-head" data-reveal>
          <div class="section-head__title"><span class="numeral" aria-hidden="true">01</span><h2 id="board-title" class="h-section">The Executive Board</h2></div>
          <span class="meta">${isTouch ? 'Tap a name' : 'Hover a name'}</span>
        </header>
        <div class="rule" data-draw></div>
        <div data-board></div>
      </div>
    </section>

    <section class="section guide-section" aria-labelledby="guide-title">
      <div class="container">
        <header class="section-head" data-reveal>
          <div class="section-head__title"><span class="numeral" aria-hidden="true">02</span><h2 id="guide-title" class="h-section">The Background Guide</h2></div>
          <span class="meta">Research</span>
        </header>
        <div class="rule" data-draw></div>
        <article class="guide" data-reveal>
          <div class="guide__thumb" aria-hidden="true">
            <span class="guide__page guide__page--back"></span>
            <span class="guide__page guide__page--front">
              ${logoHTML(c, 50)}
              <span class="kicker guide__kicker">Background Guide</span>
              <span class="guide__name">${esc(c.abbr || c.name)}</span>
              <span class="guide__lines"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span>
            </span>
          </div>
          <div class="guide__info">
            <p class="meta">PDF · ${esc(pages)} Pages · ${esc(size)}</p>
            <h3 class="guide__heading">Background Guide — ${esc(c.name)}</h3>
            <p class="guide__desc">${esc(g.description || '')}</p>
            <div class="guide__actions">${guideActions}</div>
          </div>
        </article>
        <p class="committee-back" data-reveal><a class="link-green back-link" href="committees.html"><span aria-hidden="true">←</span> All committees</a></p>
      </div>
    </section>`;

  const board = qs('[data-board]', pageEl);
  initNameList(board, c.board || [], { color: c.color, excerpt: true });
  qs('.nl-list', board)?.setAttribute('data-reveal-stagger', '');
  qs('.nl-track', board)?.setAttribute('data-reveal-stagger', '');
}
