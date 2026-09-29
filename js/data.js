/* ==========================================================================
   data.js — loading the /data/*.json files + small content helpers.
   ========================================================================== */

/**
 * Load a JSON file. Returns the parsed data, or null if it failed
 * (and shows a friendly notice if the site was opened as a plain file).
 */
export async function fetchJSON(path) {
  try {
    const res = await fetch(path, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return await res.json();
  } catch (err) {
    console.warn(`[SMUN] Could not load ${path}:`, err.message);
    showServerNotice();
    return null;
  }
}

/** Shown once if data can't be fetched — usually because the site was double-clicked open. */
function showServerNotice() {
  if (document.querySelector('.server-notice')) return;
  const note = document.createElement('div');
  note.className = 'server-notice';
  note.setAttribute('role', 'alert');
  note.innerHTML = 'Some content could not load. Open this site through a local server: <code>python3 -m http.server</code> — then visit <code>http://localhost:8000</code>.';
  document.body.appendChild(note);
}

/** Escape text before putting it inside HTML (so "&" or "<" in the JSON can't break the page). */
export function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** true for null, undefined, "" and "   ". */
export const isBlank = (v) => v === null || v === undefined || String(v).trim() === '';

/** true for values like "[ Committee Name ]" (a placeholder still waiting for real content). */
export const isPlaceholder = (v) => /^\s*\[[\s\S]*\]\s*$/.test(String(v ?? ''));

/** 1 → "I", 4 → "IV", 9 → "IX" … */
export function toRoman(num) {
  const map = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'],
    [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  let out = '';
  for (const [value, letters] of map) {
    while (num >= value) { out += letters; num -= value; }
  }
  return out;
}

/** Two-digit index: 3 → "03". */
export const pad2 = (n) => String(n).padStart(2, '0');

/* --------------------------------------------------------------------------
   Placeholder art — shown wherever a photo hasn't been added yet, so the
   site never shows a broken-image icon. (Matches the Figma placeholders.)
   -------------------------------------------------------------------------- */
export const PH_COLORS = ['#5E6F63', '#7A6A55', '#4F6470', '#6E7A5A', '#6B5B4E', '#58705F', '#3F5A66', '#7C6650'];
export const PORTRAIT_COLORS = ['#3F6A55', '#3F6876', '#A16A3F', '#1E4D3A', '#6B5B4E', '#58705F', '#3F5A66', '#7C6650'];

/** Landscape placeholder: coloured block + pale sun + two hills. */
export function phLandscape(color = PH_COLORS[0], label = '') {
  return `<div class="ph" style="--ph:${esc(color)}" role="img" aria-label="${esc(label || 'Photo coming soon')}">
    <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <circle cx="300" cy="84" r="22" fill="#fff" fill-opacity=".28"/>
      <path d="M-10 262 L112 150 L250 262 Z" fill="#fff" fill-opacity=".2"/>
      <path d="M150 262 L292 128 L430 226 L430 262 Z" fill="#fff" fill-opacity=".14"/>
      <rect y="262" width="400" height="40" fill="#000" fill-opacity=".05"/>
    </svg>
    ${label ? `<span class="ph__label" aria-hidden="true">${esc(label)}</span>` : ''}
  </div>`;
}

/** Portrait placeholder: coloured block + head-and-shoulders silhouette. */
export function phPortrait(color = PORTRAIT_COLORS[0], label = 'Portrait', wide = false) {
  const shape = wide
    ? '<circle cx="200" cy="112" r="56" fill="#fff" fill-opacity=".22"/><ellipse cx="200" cy="232" rx="136" ry="82" fill="#fff" fill-opacity=".18"/>'
    : '<circle cx="165" cy="150" r="50" fill="#fff" fill-opacity=".22"/><ellipse cx="165" cy="365" rx="120" ry="130" fill="#fff" fill-opacity=".18"/>';
  const box = wide ? '0 0 400 242' : '0 0 330 430';
  return `<div class="ph" style="--ph:${esc(color)}" aria-hidden="true">
    <svg viewBox="${box}" preserveAspectRatio="xMidYMid slice">${shape}</svg>
    <span class="ph__label">${esc(label)}</span>
  </div>`;
}

/** An <img> when a src exists, otherwise the given placeholder HTML. */
export function imageOr(src, alt, placeholderHTML, { className = 'media-cover', lazy = true } = {}) {
  if (isBlank(src)) return placeholderHTML;
  return `<img class="${className}" src="${esc(src)}" alt="${esc(alt)}"${lazy ? ' loading="lazy" decoding="async"' : ''}>`;
}
