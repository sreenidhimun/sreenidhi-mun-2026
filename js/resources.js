/* ==========================================================================
   resources.js — Training Resources page.
   Everything comes from data/resources.json:
     videos    [{ title, youtubeId, duration, description }]
     documents [{ title, file, type, size, source, description }]
     iimun     [{ title, description, url }]      ← always credited to IIMUN
   Tabs filter instantly (cards glide into place with GSAP Flip), the search
   box matches titles + descriptions, and the address bar keeps the current
   view (?type=videos&q=position) so it can be shared.
   ========================================================================== */
import { ready, reveal, refreshSoon } from './main.js';
import { motionOK, qs, qsa } from './motion/env.js';
import { fetchJSON, esc, isBlank, phLandscape } from './data.js';

const VIDEO_COLORS = ['#3F6A55', '#3F6876', '#A16A3F'];
const TYPES = ['all', 'videos', 'documents', 'iimun'];

const panel = qs('[data-res-panel]');
const tabs = qsa('.res-tab');
const input = qs('#res-q');
const empty = qs('[data-empty]');
const state = { type: 'all', q: '' };

fetchJSON('data/resources.json').then(async (data) => {
  if (!panel || !data) return;
  renderVideos(data.videos || []);
  renderDocuments(data.documents || []);
  renderIimun(data.iimun || []);

  // Start from the address bar (?type=…&q=…), if present.
  const params = new URLSearchParams(location.search);
  if (TYPES.includes(params.get('type'))) state.type = params.get('type');
  state.q = params.get('q') || '';
  input.value = state.q;
  apply({ animate: false });

  await ready;
  qsa('[data-list]', panel).forEach((list) => list.setAttribute('data-reveal-stagger', ''));
  reveal(document);
  refreshSoon();
});

/* --------------------------------------------------------------------------
   Rendering
   -------------------------------------------------------------------------- */
const searchText = (...parts) => esc(parts.filter(Boolean).join(' ').toLowerCase());

function renderVideos(videos) {
  qs('[data-list="videos"]').innerHTML = videos.map((v, i) => {
    const color = VIDEO_COLORS[i % VIDEO_COLORS.length];
    const playable = !isBlank(v.youtubeId);
    const thumb = playable
      ? `<img class="media-cover" src="https://i.ytimg.com/vi/${esc(v.youtubeId)}/hqdefault.jpg" alt="" loading="lazy" decoding="async">`
      : phLandscape(color);
    const inner = `${thumb}<span class="video__play" aria-hidden="true"><svg viewBox="0 0 20 20"><path d="M6 4 L16 10 L6 16 Z" fill="currentColor"/></svg></span>`;
    return `
      <article class="video" data-item data-text="${searchText(v.title, v.description)}">
        ${playable
          ? `<button class="video__thumb" type="button" data-play="${esc(v.youtubeId)}" data-title="${esc(v.title)}"
               data-cursor="view" data-cursor-label="Play ▶" aria-label="Play video: ${esc(v.title)}">${inner}</button>`
          : `<div class="video__thumb video__thumb--soon">${inner}<span class="ph__label">Video coming soon</span></div>`}
        <p class="kicker video__kicker">Video <span class="video__dur">${esc(v.duration)}</span></p>
        <h3 class="video__title">${esc(v.title)}</h3>
      </article>`;
  }).join('');

  // Click → swap the thumbnail for the YouTube player (privacy-enhanced mode).
  qsa('[data-play]').forEach((btn) => btn.addEventListener('click', () => {
    const frame = document.createElement('iframe');
    frame.className = 'video__frame';
    frame.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(btn.dataset.play)}?autoplay=1&rel=0`;
    frame.title = btn.dataset.title || 'Video';
    frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    frame.allowFullscreen = true;
    btn.replaceWith(frame);
    frame.focus();
  }));
}

function renderDocuments(docs) {
  qs('[data-list="documents"]').innerHTML = docs.map((d) => {
    const type = d.type || 'PDF';
    const meta = [d.source || 'MUN Club Doc', type, d.size].filter(Boolean).map(esc).join(' · ');
    const action = isBlank(d.file)
      ? '<span class="doc__soon">Coming soon</span>'
      : `<a class="link-green doc__dl" href="${esc(d.file)}" download>Download <span aria-hidden="true">↓</span><span class="sr-only"> ${esc(d.title)} (${esc(type)})</span></a>`;
    return `
      <li class="doc" data-item data-text="${searchText(d.title, d.description, type)}">
        <span class="doc__icon" aria-hidden="true"><span>${esc(type)}</span></span>
        <h3 class="doc__title">${esc(d.title)}</h3>
        <span class="doc__meta">${meta}</span>
        ${action}
      </li>`;
  }).join('');
}

function renderIimun(links) {
  qs('[data-list="iimun"]').innerHTML = links.map((l) => {
    const live = !isBlank(l.url) && l.url !== '#';
    const body = `
      <span class="iimun__top"><span class="kicker">Source: IIMUN</span><span class="iimun__arrow" aria-hidden="true">↗</span></span>
      <h3 class="iimun__title">${esc(l.title)}</h3>
      <p class="iimun__desc">${esc(l.description)}</p>
      <span class="iimun__note">${live ? 'Opens the IIMUN source in a new tab' : 'Link coming soon'}</span>`;
    return live
      ? `<a class="iimun" href="${esc(l.url)}" target="_blank" rel="noopener" data-item data-text="${searchText(l.title, l.description)}">${body}</a>`
      : `<article class="iimun iimun--soon" data-item data-text="${searchText(l.title, l.description)}">${body}</article>`;
  }).join('');
}

/* --------------------------------------------------------------------------
   Filtering (tabs + search)
   -------------------------------------------------------------------------- */
function apply({ animate = true } = {}) {
  const groups = qsa('.res-group', panel);
  const items = qsa('[data-item]', panel);
  const useFlip = animate && motionOK() && window.Flip;
  const flipState = useFlip ? window.Flip.getState([...groups, ...items]) : null;
  const needle = state.q.trim().toLowerCase();
  let shown = 0;

  groups.forEach((group) => {
    const typeMatches = state.type === 'all' || state.type === group.dataset.group;
    let visible = 0;
    qsa('[data-item]', group).forEach((item) => {
      const show = typeMatches && (!needle || item.dataset.text.includes(needle));
      item.style.display = show ? '' : 'none';
      if (show) visible++;
    });
    group.style.display = visible ? '' : 'none';
    shown += visible;
  });

  empty.hidden = shown > 0;
  if (!shown) empty.textContent = needle ? `No resources match “${state.q.trim()}”.` : 'Nothing here yet.';

  tabs.forEach((tab) => {
    const on = tab.dataset.type === state.type;
    tab.setAttribute('aria-selected', String(on));
    tab.tabIndex = on ? 0 : -1;
    if (on) panel.setAttribute('aria-labelledby', tab.id);
  });

  // Keep the address bar in sync (without adding history entries).
  const params = new URLSearchParams();
  if (state.type !== 'all') params.set('type', state.type);
  if (needle) params.set('q', state.q.trim());
  const query = params.toString();
  history.replaceState(null, '', query ? `?${query}` : location.pathname);

  if (flipState) {
    const { gsap, Flip } = window;
    Flip.from(flipState, {
      duration: 0.5,
      ease: 'power2.inOut',
      absolute: true,
      nested: true,
      onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, duration: 0.4, ease: 'power2.out' }),
      onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.96, duration: 0.25, ease: 'power2.in' }),
      onComplete: refreshSoon,
    });
  } else {
    refreshSoon();
  }
}

tabs.forEach((tab, i) => {
  tab.addEventListener('click', () => {
    if (state.type === tab.dataset.type) return;
    state.type = tab.dataset.type;
    apply();
  });
  // ← → move between tabs (standard tab keyboard pattern).
  tab.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
    next.focus();
    next.click();
  });
});

let searchTimer = 0;
input?.addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => { state.q = input.value; apply(); }, 120);
});
