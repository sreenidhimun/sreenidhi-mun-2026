/* ==========================================================================
   allocation-search.js — "Find Your Allocation".
   Reads a Google Sheet that has been published as CSV and filters it as you
   type — no server needed. Updating the sheet updates the site.

   Setup (data/registrations.json → "allocationSearch"):
     "delegatesCsv": "https://docs.google.com/…/pub?output=csv",
     "pressCsv":     "https://docs.google.com/…/pub?output=csv",
     "columns": { "name": "Name", "school": "School",
                  "committee": "Committee", "portfolio": "Country/Portfolio" },
     "lastUpdated": "12 October 2026"
   In Google Sheets: File → Share → Publish to web → choose the sheet →
   "Comma-separated values (.csv)" → Publish → copy the link.
   Only the four columns named above are ever shown.
   ========================================================================== */
import { motionOK, qs, qsa, announce } from './motion/env.js';
import { esc, isBlank } from './data.js';

const MAX_RESULTS = 5;

export function initAllocationSearch(root, config, site = {}) {
  const email = site?.contact?.email || '';
  const cols = { name: 'Name', school: 'School', committee: 'Committee', portfolio: 'Country/Portfolio', ...(config.columns || {}) };
  const sources = {
    delegates: { url: config.delegatesCsv, label: 'Delegate' },
    press: { url: config.pressCsv, label: 'Press member' },
  };
  const cache = {};                 // parsed rows per sheet (fetched once)
  let current = 'delegates';
  let timer = 0;
  let requestId = 0;

  const mail = email && !/^\s*\[/.test(email) ? `<a href="mailto:${esc(email)}">${esc(email)}</a>` : 'the Secretariat';
  const updated = isBlank(config.lastUpdated) ? '[ date ]' : esc(config.lastUpdated);

  root.innerHTML = `
    <div class="container">
      <header class="section-head" data-reveal>
        <div class="section-head__title">
          <span class="section-head__glyph" aria-hidden="true">
            <svg viewBox="0 0 40 40" width="0.7em" height="0.7em"><path fill="currentColor" d="M20 0 C21.5 12 28 18.5 40 20 C28 21.5 21.5 28 20 40 C18.5 28 12 21.5 0 20 C12 18.5 18.5 12 20 0 Z"/></svg>
          </span>
          <h2 id="allocation-title" class="h-section">Find Your Allocation</h2>
        </div>
        <span class="meta">Search the sheet</span>
      </header>
      <div class="rule" data-draw></div>

      <div class="alloc__controls" data-reveal>
        <div class="alloc__search">
          <label class="sr-only" for="alloc-q">Search the allocation sheet by name</label>
          <span class="alloc__icon" aria-hidden="true">⌕</span>
          <input id="alloc-q" class="alloc__input" type="search" placeholder="Type your full name…" autocomplete="off" spellcheck="false" aria-describedby="alloc-status">
        </div>
        <div class="alloc__toggles" role="group" aria-label="Which allocation sheet">
          <button class="alloc__toggle" type="button" data-sheet="delegates" aria-pressed="true">Delegates</button>
          <button class="alloc__toggle" type="button" data-sheet="press" aria-pressed="false">International Press</button>
        </div>
      </div>

      <div class="alloc__results" data-results></div>
      <p class="sr-only" id="alloc-status" aria-live="polite" data-status></p>
      <p class="caption alloc__source" data-reveal>Source: SMUN allocation sheet · last updated ${updated}. Can’t find your name? Email ${mail}.</p>
    </div>`;

  const input = qs('.alloc__input', root);
  const results = qs('[data-results]', root);
  const status = qs('[data-status]', root);
  const toggles = qsa('.alloc__toggle', root);

  /* ---- States ---- */
  const show = (html, message) => {
    results.innerHTML = html;
    if (message) status.textContent = message;
  };
  const idle = () => {
    if (isBlank(sources[current].url)) return error();
    show('<p class="alloc__note">Start typing your name — at least two letters.</p>', '');
  };
  const loading = () => show(`
    <div class="alloc__card alloc__card--skeleton" aria-hidden="true">${'<div class="alloc__cell"><i></i><b></b></div>'.repeat(4)}</div>
    <div class="alloc__card alloc__card--skeleton" aria-hidden="true">${'<div class="alloc__cell"><i></i><b></b></div>'.repeat(4)}</div>`, 'Searching…');
  const error = () => show('<p class="alloc__note alloc__note--error">Allocations aren’t published yet — check back soon.</p>', 'Allocations are not published yet.');
  const none = (q) => show(`<p class="alloc__note">No match for “${esc(q)}”. Can’t find your name? Email ${mail}.</p>`, `No match for ${q}.`);

  function render(matches, q) {
    const label = sources[current].label;
    const highlight = (text) => {
      const t = String(text ?? '');
      const at = t.toLowerCase().indexOf(q.toLowerCase());
      if (at < 0) return esc(t);
      return `${esc(t.slice(0, at))}<mark>${esc(t.slice(at, at + q.length))}</mark>${esc(t.slice(at + q.length))}`;
    };
    const cell = (k, v, hl = false) => `<div class="alloc__cell"><span class="kicker">${k}</span><span class="alloc__value">${hl ? highlight(v) : esc(v || '—')}</span></div>`;
    show(matches.map((r) => `
      <div class="alloc__card">
        ${cell(label, r.name, true)}
        ${cell('School', r.school)}
        ${cell('Committee', r.committee)}
        ${cell('Country / Portfolio', r.portfolio)}
      </div>`).join(''), `${matches.length} result${matches.length === 1 ? '' : 's'} found.`);
    if (motionOK()) {
      window.gsap.fromTo(qsa('.alloc__card', results), { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, stagger: 0.05, ease: 'power3.out' });
    }
  }

  /* ---- Data ---- */
  async function load(sheet) {
    if (cache[sheet]) return cache[sheet];
    const url = sources[sheet].url;
    if (isBlank(url)) throw new Error('No CSV link yet');
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${res.status}`);
    const rows = parseCSV(await res.text());
    const header = (rows.shift() || []).map((h) => h.trim().toLowerCase());
    const col = (name) => header.indexOf(String(name).trim().toLowerCase());
    const idx = { name: col(cols.name), school: col(cols.school), committee: col(cols.committee), portfolio: col(cols.portfolio) };
    if (idx.name < 0) throw new Error(`Column "${cols.name}" not found`);
    cache[sheet] = rows
      .filter((r) => r[idx.name] && r[idx.name].trim())
      .map((r) => ({
        name: r[idx.name].trim(),
        school: idx.school >= 0 ? r[idx.school] : '',
        committee: idx.committee >= 0 ? r[idx.committee] : '',
        portfolio: idx.portfolio >= 0 ? r[idx.portfolio] : '',
      }));
    return cache[sheet];
  }

  async function search() {
    const q = input.value.trim().replace(/\s+/g, ' ');
    if (q.length < 2) return idle();
    if (isBlank(sources[current].url)) return error();
    const id = ++requestId;
    if (!cache[current]) loading();
    try {
      const rows = await load(current);
      if (id !== requestId) return;                       // a newer search has started
      const needle = q.toLowerCase();
      const matches = rows.filter((r) => r.name.toLowerCase().includes(needle)).slice(0, MAX_RESULTS);
      if (matches.length) render(matches, q); else none(q);
    } catch (err) {
      console.warn('[SMUN] Allocation sheet could not be loaded:', err.message);
      if (id === requestId) error();
    }
  }

  input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(search, 150); });
  toggles.forEach((btn) => btn.addEventListener('click', () => {
    current = btn.dataset.sheet;
    toggles.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    announce(`Searching the ${btn.textContent} sheet.`);
    search();
  }));
  idle();
}

/* --------------------------------------------------------------------------
   A small CSV parser that understands quotes ("Smith, Jr." and "" escapes).
   -------------------------------------------------------------------------- */
export function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += ch;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows;
}
