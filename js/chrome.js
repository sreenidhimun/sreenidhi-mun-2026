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
   Emblem. Until the real logo arrives this is the placeholder emblem
   (assets/svg/emblem-placeholder.svg, cleaned up for inlining).
   To use the real logo: save it as assets/svg/logo.svg and set
   "logo": "assets/svg/logo.svg" in data/site.json. If the flame is its own
   group with id="emblem-flame", the hero will animate it.
   -------------------------------------------------------------------------- */
const PLACEHOLDER_EMBLEM = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" aria-hidden="true" focusable="false">
  <circle cx="100" cy="100" r="98" fill="#F0E2C8" stroke="#DFC79C" stroke-width="3"/>
  <circle cx="100" cy="100" r="80" fill="none" stroke="#1E4D3A" stroke-opacity=".35" stroke-width="1.5"/>
  <g data-emblem-flame><path transform="translate(68 49) scale(1.066)" fill="#F28C28" d="M30 0 C45 25 60 40 60 62 C60 82 46 96 30 96 C14 96 0 82 0 62 C0 45 12 35 18 20 C20 34 26 40 30 42 C28 28 26 14 30 0 Z"/></g>
</svg>`;

let emblemSVG = readCache('smunLogo') || PLACEHOLDER_EMBLEM;

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
      .replace(/\s(width|height)="[^"]*"/, '')                // let CSS size it
      .replace(/id="emblem-flame"/g, 'data-emblem-flame')      // ids must be unique; we use a data attribute
      .replace(/<svg\b/, '<svg aria-hidden="true" focusable="false"')
      .trim();
    if (svg === emblemSVG) return;
    emblemSVG = svg;
    writeCache('smunLogo', svg);
    paintEmblems();
  } catch (err) {
    console.warn('[SMUN] Logo could not be loaded, keeping the placeholder emblem.', err);
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
