/* ==========================================================================
   home.js — the front page.
   Content comes from data/site.json:
     openingImage, letter.paragraphs, collage[], contact{}, countdownTarget …
   Motion pieces live in their own files (loader.js, envelope.js,
   lightbox.js, motion/odometer.js) and are started from here.
   ========================================================================== */
import { site, ready, reveal, refreshSoon, pageShown, markPageShown } from './main.js';
import { motionOK, isTouch, qs, qsa } from './motion/env.js';
import { fetchJSON, esc, isBlank, phLandscape, PH_COLORS, imageOr } from './data.js';
import { telHref } from './chrome.js';
import { Odometer } from './motion/odometer.js';
import { runLoader } from './loader.js';
import { initEnvelope } from './envelope.js';
import { openLightbox } from './lightbox.js';
import { renderFrontPage, deliverNewspaper } from './newspaper.js';

/* ---- 1. The front page: fill it in, then (after the loader on a first
         visit) the newspaper is "delivered". The rest of the page's reveals
         wait until it has landed. ---- */
const frontPage = Promise.all([site, fetchJSON('data/registrations.json')]).then(([s, reg]) => {
  const ticket = (id) => (reg?.tickets || []).find((t) => t.id === id);
  renderFrontPage(s, ticket('delegate'), ticket('press'));
});
const afterLoader = document.documentElement.classList.contains('is-loading');
runLoader(() => {
  Promise.all([ready, frontPage])
    .then(() => deliverNewspaper({ delay: afterLoader ? 0.25 : 0.1 }))
    .then(markPageShown);
});

/* ---- 2. Fill the page from site.json, then add the motion ---- */
site.then(async (s) => {
  renderOpening(s);
  const letterDone = renderLetter(s);
  renderCollage(s);
  renderContacts(s);
  renderMap(s);
  renderPartner(s);
  initCountdown(s);

  await Promise.all([ready, pageShown, letterDone]);
  initOpeningMotion();
  initEnvelope();
  initCollageMotion(s);
  initMapReveal();
  refreshSoon();
});

/* --------------------------------------------------------------------------
   Opening image: uncovers from the centre, then drifts (parallax).
   -------------------------------------------------------------------------- */
function initOpeningMotion() {
  const frame = qs('[data-opening]');
  const media = qs('[data-opening-media]');
  if (!frame) return;

  frame.addEventListener('click', () => {
    const caption = qs('.opening__caption .caption')?.textContent || '';
    openLightbox([{ html: media.innerHTML, caption }], 0, [frame]);
  });

  if (!motionOK()) return;
  const { gsap } = window;
  gsap.fromTo(frame, { clipPath: 'inset(12% 18% 12% 18%)' }, {
    clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, ease: 'power2.out',
    scrollTrigger: { trigger: frame, start: 'top 80%', once: true },
  });
  // Scaled up a little so the edges never show while it drifts.
  gsap.set(media, { scale: 1.18 });
  gsap.fromTo(media, { yPercent: -8 }, {
    yPercent: 8, ease: 'none',
    scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: true },
  });
}

/* --------------------------------------------------------------------------
   Collage: prints drift at different speeds; click opens the lightbox.
   -------------------------------------------------------------------------- */
function initCollageMotion(s) {
  const list = qs('[data-collage]');
  if (!list) return;
  const buttons = qsa('.print__btn', list);
  const items = buttons.map((btn, i) => ({
    html: qs('.print__photo', btn).innerHTML,
    caption: (s.collage || [])[i]?.caption || '',
    portrait: false,
  }));
  buttons.forEach((btn, i) => btn.addEventListener('click', () => openLightbox(items, i, buttons)));

  list.setAttribute('data-reveal-stagger', '');
  reveal(list.parentElement);

  if (!motionOK()) return;
  const { gsap } = window;
  gsap.matchMedia().add('(min-width: 768px)', () => {
    qsa('.print', list).forEach((print) => {
      const speed = parseFloat(print.dataset.speed) || 0;
      gsap.fromTo(print, { yPercent: -speed * 50 }, {
        yPercent: speed * 50, ease: 'none',
        scrollTrigger: { trigger: list, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });
  });
}

/* --------------------------------------------------------------------------
   Map: the frame opens outwards from the pin (centre) the first time it's seen.
   -------------------------------------------------------------------------- */
function initMapReveal() {
  const frame = qs('[data-map-frame]');
  if (!frame || !motionOK()) return;
  window.gsap.fromTo(frame, { clipPath: 'circle(0% at 50% 50%)' }, {
    clipPath: 'circle(75% at 50% 50%)', duration: 0.9, ease: 'power2.out',
    scrollTrigger: { trigger: frame, start: 'top 80%', once: true },
    onComplete: () => window.gsap.set(frame, { clearProps: 'clipPath' }),
  });
}

/* --------------------------------------------------------------------------
   Opening image
   -------------------------------------------------------------------------- */
function renderOpening(s) {
  const img = s.openingImage || {};
  const media = qs('[data-opening-media]');
  if (!media || isBlank(img.src)) return;
  media.innerHTML = `<img class="media-cover" src="${esc(img.src)}" alt="${esc(img.alt || img.caption || 'SMUN conference photograph')}" decoding="async">`;
}

/* --------------------------------------------------------------------------
   Letter paragraphs (salutation, date, closing and sign-off are filled
   automatically through their data-site-text attributes).
   -------------------------------------------------------------------------- */
async function renderLetter(s) {
  const body = qs('[data-letter-body]');
  const paragraphs = s.letter?.paragraphs || [];
  if (body && paragraphs.length) {
    body.innerHTML = paragraphs.map((p) => `<p>${esc(p)}</p>`).join('');
  }
  // Optional real signature drawing (an SVG made of paths).
  const svgPath = s.letter?.signatureSvg;
  const slot = qs('[data-sign-text]');
  if (!isBlank(svgPath) && slot) {
    try {
      const res = await fetch(svgPath);
      if (!res.ok) throw new Error(res.status);
      const svg = (await res.text()).replace(/<\?xml[\s\S]*?\?>/g, '').replace(/<metadata[\s\S]*?<\/metadata>/g, '');
      const wrap = document.createElement('span');
      wrap.innerHTML = svg;
      const el = wrap.querySelector('svg');
      if (el) {
        el.classList.add('letter__sign-svg');
        el.setAttribute('role', 'img');
        el.setAttribute('aria-label', `Signature: ${s.letter.signatureName || ''}`);
        slot.replaceWith(el);
      }
    } catch (err) {
      console.warn('[SMUN] Signature SVG not found, using the script signature instead.', err);
    }
  }
}

/* --------------------------------------------------------------------------
   Collage of 8 "prints"
   -------------------------------------------------------------------------- */
const ROTATIONS = [-4, 3, -2, 5, 3, -3, 0, -5];                     // degrees, per print
const PORTRAIT = [false, true, false, false, true, false, true, true];
export const PARALLAX = [-0.12, 0.08, -0.05, 0.15, 0.1, -0.1, 0.05, -0.15];

function renderCollage(s) {
  const list = qs('[data-collage]');
  if (!list) return;
  const items = (s.collage || []).slice(0, 8);
  list.innerHTML = items.map((item, i) => {
    const caption = item.caption || '';
    const label = `Enlarge photograph ${i + 1} of ${items.length}${caption ? ': ' + caption : ''}`;
    const photo = imageOr(item.src, item.alt || caption, phLandscape(PH_COLORS[i % PH_COLORS.length]));
    return `<li class="print print--${i + 1}${PORTRAIT[i] ? ' print--portrait' : ''}" data-speed="${PARALLAX[i]}">
      <button class="print__btn" type="button" style="--rot:${ROTATIONS[i] ?? 0}deg" data-index="${i}" aria-label="${esc(label)}">
        <span class="print__photo">${photo}</span>
        <span class="print__caption" aria-hidden="true">${esc(caption)}</span>
      </button>
    </li>`;
  }).join('');
}

/* --------------------------------------------------------------------------
   Contact rows (Copy buttons are handled site-wide by main.js)
   -------------------------------------------------------------------------- */
function renderContacts(s) {
  const list = qs('[data-contact-list]');
  if (!list) return;
  const c = s.contact || {};
  const lines = c.addressLines || [];
  const rows = [
    { label: 'Address', value: s.venue, sub: lines.join(', '), copy: [s.venue, ...lines].join(', ') },
    { label: 'Secretary-General', value: c.secGen?.phone, sub: c.secGen?.name, href: isTouch ? telHref(c.secGen?.phone || '') : '' },
    { label: 'Director-General', value: c.dirGen?.phone, sub: c.dirGen?.name, href: isTouch ? telHref(c.dirGen?.phone || '') : '' },
    { label: 'Email', value: c.email, sub: 'For delegations, press and partnerships', href: c.email ? `mailto:${c.email}` : '' },
  ];
  list.innerHTML = rows.map((r) => {
    const value = r.value || '[ … ]';
    const hasRealValue = !isBlank(r.value) && !/^\s*\[/.test(r.value);
    const valueHTML = r.href && hasRealValue
      ? `<a class="contact__value" href="${esc(r.href)}">${esc(value)}</a>`
      : `<span class="contact__value">${esc(value)}</span>`;
    return `<li class="contact__row">
      <div>
        <p class="kicker">${esc(r.label)}</p>
        ${valueHTML}
        ${r.sub ? `<p class="contact__sub">${esc(r.sub)}</p>` : ''}
      </div>
      ${hasRealValue ? `<button class="pill" type="button" data-copy="${esc(r.copy || value)}" aria-label="Copy ${esc(r.label.toLowerCase())}">Copy</button>` : ''}
    </li>`;
  }).join('');
  list.setAttribute('data-reveal-stagger', '');
  ready.then(() => reveal(list.parentElement));
}

/* --------------------------------------------------------------------------
   Map: Google Maps embed under a "click to interact" shield, so scrolling
   the page never gets trapped inside the map.
   -------------------------------------------------------------------------- */
function renderMap(s) {
  const map = qs('[data-map]');
  if (!map) return;
  const query = s.contact?.mapQuery || 'Sreenidhi International School, Hyderabad';
  const iframe = qs('[data-map-iframe]', map);
  const shield = qs('[data-map-shield]', map);
  const directions = qs('[data-map-directions]', map);
  iframe.src = `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
  directions.href = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;

  const activate = () => {
    map.classList.add('is-live');
    iframe.tabIndex = 0;
  };
  const deactivate = () => {
    map.classList.remove('is-live');
    iframe.tabIndex = -1;
  };
  shield.addEventListener('click', () => { activate(); iframe.focus(); });
  map.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') deactivate(); });
  map.addEventListener('focusout', (e) => { if (!map.contains(e.relatedTarget)) deactivate(); });
}

/* --------------------------------------------------------------------------
   Partners: "Partner with SMUN" opens an email with a subject line
   -------------------------------------------------------------------------- */
function renderPartner(s) {
  const link = qs('[data-partner-mailto]');
  const email = s.contact?.email;
  if (link && email && !/^\s*\[/.test(email)) {
    link.href = `mailto:${email}?subject=${encodeURIComponent('Partnership — SMUN XIV')}`;
  }
}

/* --------------------------------------------------------------------------
   01 — The Countdown
   countdownTarget: ISO date with +05:30, e.g. "2026-10-30T09:00:00+05:30"
   States: no date → "—" · counting down · in session · concluded.
   -------------------------------------------------------------------------- */
function initCountdown(s) {
  const grid = qs('[data-countdown]');
  if (!grid) return;
  const caption = qs('[data-countdown-caption]');
  const srText = qs('[data-countdown-sr]');
  const cells = {
    days: qs('[data-unit="days"]', grid),
    hours: qs('[data-unit="hours"]', grid),
    minutes: qs('[data-unit="minutes"]', grid),
    seconds: qs('[data-unit="seconds"]', grid),
  };
  const target = Date.parse(s.countdownTarget || '');
  const end = Date.parse(s.conferenceEnd || '');

  // No (valid) date yet.
  if (isNaN(target)) {
    Object.values(cells).forEach((el) => { el.textContent = '—'; });
    caption.textContent = 'Dates to be announced';
    srText.textContent = 'The conference dates are to be announced.';
    return;
  }

  caption.textContent = `Days until the gavel falls · Day I begins ${s.dayOne || '[ date, time ]'}`;

  const odos = {};
  for (const [unit, el] of Object.entries(cells)) odos[unit] = new Odometer(el, 2);

  let lastMinute = -1;
  let timer = 0;

  function tick() {
    const now = Date.now();
    const diff = target - now;
    if (diff <= 0) {
      ['days', 'hours', 'minutes', 'seconds'].forEach((u) => odos[u].set('00'));
      const live = isNaN(end) || now < end;
      caption.textContent = live ? 'The conference is in session' : 'SMUN XIV has concluded';
      srText.textContent = caption.textContent + '.';
      clearInterval(timer);
      return;
    }
    const days = Math.floor(diff / 864e5);
    const hours = Math.floor(diff / 36e5) % 24;
    const minutes = Math.floor(diff / 6e4) % 60;
    const seconds = Math.floor(diff / 1e3) % 60;
    odos.days.set(String(days).padStart(2, '0'));
    odos.hours.set(String(hours).padStart(2, '0'));
    odos.minutes.set(String(minutes).padStart(2, '0'));
    odos.seconds.set(String(seconds).padStart(2, '0'));

    // Screen readers get a calm text version, refreshed once a minute.
    const totalMinutes = Math.floor(diff / 6e4);
    if (totalMinutes !== lastMinute) {
      lastMinute = totalMinutes;
      srText.textContent = `${days} days, ${hours} hours and ${minutes} minutes until SMUN XIV begins.`;
    }
  }

  tick();
  // Line the ticks up with real seconds.
  setTimeout(() => { tick(); timer = setInterval(tick, 1000); }, 1000 - (Date.now() % 1000));

  // Pause the rolling while the countdown is off-screen (values still update, just without animation).
  new IntersectionObserver(([entry]) => {
    Object.values(odos).forEach((o) => { o.visible = entry.isIntersecting; });
  }).observe(grid);

  // First reveal: every digit rolls up from zero.
  const rollIn = () => ['days', 'hours', 'minutes', 'seconds'].forEach((u, i) => odos[u].rollIn(i * 0.1));
  if (motionOK()) {
    Promise.all([ready, pageShown]).then(() => {
      window.ScrollTrigger.create({ trigger: grid, start: 'top 85%', once: true, onEnter: rollIn });
    });
  } else {
    rollIn();
  }
}
