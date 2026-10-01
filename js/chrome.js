/* ==========================================================================
   chrome.js — the site "chrome": dateline, masthead, mobile menu, glass pill
   nav and footers. This file is the SINGLE SOURCE OF TRUTH for navigation:
   edit NAV below to add/rename pages.

   It runs before the first paint (the <script> tag has blocking="render"),
   so the masthead is already there when a page-turn transition captures it.
   Site details (dates, contacts…) come from data/site.json; a copy is kept
   in sessionStorage so later pages can draw them instantly.
   ========================================================================== */
import { esc, isBlank } from './data.js';

/* ---- Navigation (edit here) ---- */
export const NAV = [
  { id: 'home',          label: 'Home',          href: 'index.html' },
  { id: 'secretariat',   label: 'Secretariat',   href: 'secretariat.html' },
  { id: 'committees',    label: 'Committees',    href: 'committees.html' },
  { id: 'registrations', label: 'Registrations', href: 'registrations.html' },
  { id: 'schedule',      label: 'Schedule',      href: 'schedule.html' },
  { id: 'resources',     label: 'Resources',     href: 'resources.html' },
];

const page = document.body.dataset.page || '';
const activeId = page === 'committee' ? 'committees' : page;   // committee pages light up "Committees"

/* ---- Cached site data (instant render on later pages) ---- */
function readCache(key) {
  try { return JSON.parse(sessionStorage.getItem(key) || 'null'); } catch { return null; }
}
export function writeCache(key, value) {
  try { sessionStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode — fine */ }
}
const cachedSite = readCache('smunSite') || {};

/* --------------------------------------------------------------------------
   Emblem = the Sreenidhi logo (assets/svg/logo.svg, inlined below so it is
   on screen from the very first paint). The path has data-emblem-mark so
   pages can animate it (it "draws" itself in ink, then fills).
   To swap the logo later: either paste the new SVG path below, or save the
   file and set "logo": "assets/svg/your-logo.svg" in data/site.json.
   -------------------------------------------------------------------------- */
export const LOGO_PATH = 'M130.0 0.0 L153.9 0.0 L155.0 0.5 L162.0 1.1 L173.8 3.0 L186.0 6.1 L197.8 10.1 L209.0 15.0 L213.0 17.1 L213.8 18.2 L195.2 26.1 L180.2 34.1 L165.2 44.1 L152.0 55.2 L144.0 63.2 L138.1 70.2 L129.0 83.2 L121.1 98.5 L116.1 112.0 L112.0 129.2 L111.0 136.9 L110.3 149.5 L111.1 167.5 L114.0 184.5 L119.1 201.8 L126.1 218.0 L135.1 233.5 L145.1 246.5 L154.2 255.8 L161.2 261.6 L170.5 267.7 L172.4 268.8 L173.8 268.8 L184.7 257.5 L189.6 251.8 L194.6 245.5 L200.8 236.5 L203.7 231.5 L207.8 223.0 L209.7 217.8 L211.6 209.5 L211.9 198.5 L210.8 190.6 L207.7 182.2 L203.7 175.2 L198.7 168.2 L191.4 160.2 L162.2 133.6 L154.1 124.8 L150.1 119.5 L147.1 114.2 L145.0 108.8 L144.2 105.0 L144.0 98.0 L145.0 92.2 L147.1 86.8 L152.0 78.2 L157.0 71.9 L164.2 64.2 L173.2 56.2 L184.0 47.9 L184.5 47.9 L184.6 48.5 L180.0 55.2 L177.1 61.5 L175.0 70.0 L175.0 75.7 L176.0 80.5 L178.0 85.0 L181.2 89.8 L185.9 94.8 L190.2 98.6 L202.2 106.7 L215.0 113.7 L249.8 131.0 L261.8 138.1 L271.5 145.1 L279.8 152.9 L284.7 159.2 L288.7 167.2 L290.2 174.5 L290.8 175.2 L290.8 190.2 L290.2 191.2 L289.6 195.2 L287.7 202.2 L283.7 211.8 L278.6 220.5 L271.7 229.5 L262.8 238.6 L254.5 245.7 L243.5 253.6 L233.5 259.6 L221.5 265.7 L209.8 270.6 L198.2 274.7 L183.5 278.7 L173.0 280.7 L159.8 282.2 L158.4 282.8 L136.0 282.8 L134.9 282.2 L128.5 281.6 L119.2 279.7 L102.0 274.7 L87.0 268.7 L75.2 262.7 L62.2 254.7 L50.2 245.5 L41.8 237.8 L32.1 227.5 L23.0 215.5 L15.2 202.5 L9.0 189.2 L5.1 177.8 L2.1 165.5 L0.6 153.2 L0.0 151.9 L0.0 129.5 L0.5 128.3 L1.1 122.0 L3.1 110.5 L8.1 93.0 L12.1 83.8 L20.1 69.2 L28.1 57.2 L36.2 47.2 L46.0 37.1 L55.2 29.1 L66.5 21.1 L77.0 15.1 L88.0 10.0 L102.5 5.1 L115.8 2.1 L129.0 0.5 Z';

const DEFAULT_EMBLEM = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 291 283" aria-hidden="true" focusable="false">
  <path data-emblem-mark fill="#E48023" d="${LOGO_PATH}"/>
</svg>`;

let emblemSVG = readCache('smunLogo') || DEFAULT_EMBLEM;

/** HTML for an emblem of any size (size is set in CSS). */
export function emblem(extraClass = '') {
  return `<span class="emblem ${extraClass}" data-emblem>${emblemSVG}</span>`;
}

/** Fill every empty [data-emblem] slot on the page (e.g. the big hero emblem). */
export function paintEmblems(root = document) {
  root.querySelectorAll('[data-emblem]').forEach((el) => { el.innerHTML = emblemSVG; });
}

/** Load the real logo (if site.json names one) and swap it in everywhere. */
export async function loadLogo(path) {
  if (isBlank(path)) return;
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error(res.status);
    let svg = await res.text();
    svg = svg
      .replace(/<\?xml[\s\S]*?\?>/g, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<metadata[\s\S]*?<\/metadata>/g, '')
      .replace(/\s(width|height|role|aria-label)="[^"]*"/g, '') // let CSS size it; it's decorative here
      .replace(/id="emblem-(flame|mark)"/g, 'data-emblem-mark') // ids must be unique; we use a data attribute
      .replace(/<svg\b/, '<svg aria-hidden="true" focusable="false"')
      .trim();
    if (svg === emblemSVG) return;
    emblemSVG = svg;
    writeCache('smunLogo', svg);
    paintEmblems();
  } catch (err) {
    console.warn('[SMUN] Logo could not be loaded, keeping the built-in one.', err);
  }
}

/* ---- Small helpers ---- */
const arrow = (a = '→') => `<span aria-hidden="true">${a}</span>`;
const current = (id) => (id === activeId ? ' aria-current="page"' : '');
const datesText = () => cachedSite.dates || '[ Conference Dates ]';

function navLinks(extraClass = '') {
  return `<ul class="nav-links ${extraClass}" role="list">
    ${NAV.map((n) => `<li><a href="${n.href}"${current(n.id)}>${n.label}</a></li>`).join('')}
  </ul>`;
}

function menuButton(extraClass = '') {
  return `<button class="menu-btn ${extraClass}" type="button" aria-expanded="false" aria-controls="site-menu" data-menu-open>
    <span>Menu</span><span class="menu-btn__icon" aria-hidden="true"><i></i><i></i></span>
  </button>`;
}

/* --------------------------------------------------------------------------
   Top chrome: dateline + masthead + (hidden) pill nav + menu + progress line
   -------------------------------------------------------------------------- */
function topHTML() {
  return `
  <div class="site-top">
    <div class="container">
      <div class="dateline">
        <span class="meta dateline__item">Vol. XIV — 2026 Edition</span>
        <span class="meta dateline__item" data-site-text="dates">${esc(datesText())}</span>
        <span class="meta dateline__item">Hyderabad, India</span>
      </div>
      <div class="rule dateline__rule"></div>
      <header class="masthead">
        <a class="brand" href="index.html" aria-label="Sreenidhi Model United Nations — home">
          ${emblem('brand__emblem')}
          <span class="brand__words" aria-hidden="true">
            <span class="brand__name">Sreenidhi</span>
            <span class="brand__sub">Model United Nations</span>
          </span>
        </a>
        <nav class="masthead__nav" aria-label="Main">${navLinks()}</nav>
        <a class="btn btn--primary btn--sm masthead__cta" href="registrations.html">Register ${arrow()}</a>
        ${menuButton()}
      </header>
      <div class="rule--double masthead__rule" data-masthead-rule></div>
    </div>
  </div>

  <div class="pill-nav" inert>
    <nav class="pill-nav__row" aria-label="Main (compact)">
      <a class="pill-nav__brand" href="index.html" aria-label="Home">${emblem()}</a>
      ${navLinks()}
      ${menuButton()}
      <a class="btn btn--primary btn--sm pill-nav__cta" href="registrations.html">Register ${arrow()}</a>
    </nav>
    <span class="progress-line progress-line--pill" aria-hidden="true"></span>
  </div>
  <span class="progress-line progress-line--top" aria-hidden="true"></span>

  <div class="menu" id="site-menu" role="dialog" aria-modal="true" aria-label="Site menu" hidden>
    <div class="menu__inner container">
      <div class="menu__top">
        <a class="brand" href="index.html" aria-label="Sreenidhi Model United Nations — home">
          ${emblem('brand__emblem')}
          <span class="brand__words" aria-hidden="true">
            <span class="brand__name">Sreenidhi</span>
            <span class="brand__sub">Model United Nations</span>
          </span>
        </a>
        <button class="menu__close" type="button" data-menu-close><span aria-hidden="true">✕</span> Close</button>
      </div>
      <div class="rule--double"></div>
      <nav aria-label="Menu">
        <ol class="menu__links" role="list">
          ${NAV.map((n, i) => `<li><a href="${n.href}"${current(n.id)}><span class="menu__num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>${n.label}</a></li>`).join('')}
        </ol>
      </nav>
      <p class="menu__dateline">
        <span class="meta">Vol. XIV — 2026 Edition</span>
        <span class="meta" data-site-text="dates">${esc(datesText())}</span>
        <span class="meta">Hyderabad, India</span>
      </p>
      <div class="menu__cta"><a class="btn btn--primary btn--block" href="registrations.html">Register ${arrow()}</a></div>
    </div>
  </div>`;
}

/* --------------------------------------------------------------------------
   Footers — full (home) and slim (everything else)
   -------------------------------------------------------------------------- */
function fullFooterHTML() {
  const c = cachedSite.contact || {};
  const lines = c.addressLines || ['[ Address line ]', 'Hyderabad, Telangana'];
  return `
  <footer class="site-footer site-footer--full site-bottom">
    <div class="container">
      <div class="rule--double"></div>
      <p class="footer__title">Sreenidhi Model United Nations</p>
      <div class="footer__cols">
        <div>
          <h2 class="kicker">Pages</h2>
          <ul role="list">${NAV.map((n) => `<li><a href="${n.href}">${n.label}</a></li>`).join('')}</ul>
        </div>
        <div>
          <h2 class="kicker">Contact</h2>
          <ul role="list">
            <li><a data-site-mailto="contact.email" href="${c.email ? 'mailto:' + esc(c.email) : '#'}"><span data-site-text="contact.email">${esc(c.email || '[ email ]')}</span></a></li>
            <li><a data-site-tel="contact.secGen.phone" href="#"><span data-site-text="contact.secGen.phone">${esc(c.secGen?.phone || '[ Sec-Gen phone ]')}</span></a></li>
            <li><a data-site-tel="contact.dirGen.phone" href="#"><span data-site-text="contact.dirGen.phone">${esc(c.dirGen?.phone || '[ DG phone ]')}</span></a></li>
          </ul>
        </div>
        <div>
          <h2 class="kicker">Visit</h2>
          <address>
            <span data-site-text="venue">${esc(cachedSite.venue || 'Sreenidhi International School')}</span>
            <span data-site-text="contact.addressLines.0">${esc(lines[0])}</span>
            <span data-site-text="contact.addressLines.1">${esc(lines[1])}</span>
          </address>
        </div>
        <div>
          <h2 class="kicker">Follow</h2>
          <ul role="list">
            <li><a data-site-href="instagram" href="${esc(cachedSite.instagram || '#')}" target="_blank" rel="noopener">Instagram ${arrow('↗')}<span class="sr-only"> (opens in a new tab)</span></a></li>
            <li><a href="#main" data-back-to-top>Back to top ${arrow('↑')}</a></li>
          </ul>
        </div>
      </div>
      <div class="rule rule--soft"></div>
      <div class="footer__bottom">
        <span>© 2026 Preetham Kommareddy &amp; Aryan Akula</span>
        <span class="footer__imprint">Vol. XIV · Printed in Hyderabad</span>
      </div>
    </div>
  </footer>`;
}

function slimFooterHTML() {
  return `
  <footer class="site-footer site-footer--slim site-bottom">
    <div class="container">
      <div class="rule--double"></div>
      <div class="footer__slim-row">
        <p class="footer__wordmark">Sreenidhi Model United Nations</p>
        <p class="footer__copy">© 2026 Preetham Kommareddy &amp; Aryan Akula · Vol. XIV</p>
      </div>
    </div>
  </footer>`;
}

/* --------------------------------------------------------------------------
   Fill [data-site-*] placeholders from site.json. Works anywhere on a page:
     data-site-text="contact.email"   → sets the text
     data-site-href="instagram"       → sets href
     data-site-mailto="contact.email" → sets href="mailto:…"
     data-site-tel="contact.secGen.phone" → sets href="tel:…"
   -------------------------------------------------------------------------- */
export const getPath = (obj, path) => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
export const telHref = (phone) => 'tel:' + String(phone).replace(/[^\d+]/g, '');

export function bindSite(site, root = document) {
  if (!site) return;
  root.querySelectorAll('[data-site-text]').forEach((el) => {
    const v = getPath(site, el.dataset.siteText);
    if (!isBlank(v)) el.textContent = v;
  });
  root.querySelectorAll('[data-site-href]').forEach((el) => {
    const v = getPath(site, el.dataset.siteHref);
    if (!isBlank(v)) el.setAttribute('href', v);
  });
  root.querySelectorAll('[data-site-mailto]').forEach((el) => {
    const v = getPath(site, el.dataset.siteMailto);
    if (!isBlank(v)) el.setAttribute('href', 'mailto:' + v);
  });
  root.querySelectorAll('[data-site-tel]').forEach((el) => {
    const v = getPath(site, el.dataset.siteTel);
    if (!isBlank(v) && /\d{6,}/.test(String(v).replace(/\s/g, ''))) el.setAttribute('href', telHref(v));
  });
}

/* ---- Inject immediately (this module runs before first paint) ---- */
const top = document.getElementById('chrome-top');
const bottom = document.getElementById('chrome-bottom');
if (top) top.innerHTML = topHTML();
if (bottom) bottom.innerHTML = document.body.dataset.footer === 'full' ? fullFooterHTML() : slimFooterHTML();
paintEmblems(document.querySelector('main') || document);
bindSite(cachedSite);
