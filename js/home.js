/* ==========================================================================
   home.js — the front page.
   Content comes from data/site.json:
     openingImage, letter.paragraphs, collage[], contact{}, countdownTarget …
   Motion pieces live in their own files (loader.js, envelope.js,
   lightbox.js, motion/odometer.js) and are started from here.
   ========================================================================== */
import { site, ready, reveal, refreshSoon } from './main.js';
import { motionOK, isTouch, qs, qsa } from './motion/env.js';
import { esc, isBlank, phLandscape, PH_COLORS, imageOr } from './data.js';
import { telHref } from './chrome.js';
import { Odometer } from './motion/odometer.js';

site.then((s) => {
  renderOpening(s);
  renderLetter(s);
  renderCollage(s);
  renderContacts(s);
  renderMap(s);
  renderPartner(s);
  initCountdown(s);
  refreshSoon();
});

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
function renderLetter(s) {
  const body = qs('[data-letter-body]');
  const paragraphs = s.letter?.paragraphs || [];
  if (body && paragraphs.length) {
    body.innerHTML = paragraphs.map((p) => `<p data-letter-line>${esc(p)}</p>`).join('');
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
      <button class="print__btn" type="button" style="--rot:${ROTATIONS[i] ?? 0}deg" data-cursor="view" data-index="${i}" aria-label="${esc(label)}">
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
    ready.then(() => window.ScrollTrigger.create({ trigger: grid, start: 'top 85%', once: true, onEnter: rollIn }));
  } else {
    rollIn();
  }
}
