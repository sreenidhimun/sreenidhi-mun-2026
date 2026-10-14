/* ==========================================================================
   schedule.js — the three-day programme.
   Everything comes from data/schedule.json:
     days [{ label: "Day I", date: "Friday, 30 October 2026", iso: "2026-10-30",
             items: [{ start: "1:30 pm", end: "2:00 pm", title: "Registration" }] }]
   To change a timing, edit that file — no code changes needed.

   Rows are styled by their title:
     "…break…"                              → quiet (muted, italic)
     "…ceremony…" / "…social…"              → highlighted (green, display type)
     "registration" / "arrival" / "departure" → logistics (slightly muted)
   During the conference, the session happening right now is marked "Now"
   (times are India Standard Time).
   ========================================================================== */
import { ready, reveal, refreshSoon } from './main.js';
import { qs } from './motion/env.js';
import { fetchJSON, esc, isBlank } from './data.js';

const root = qs('[data-schedule]');

fetchJSON('data/schedule.json').then(async (data) => {
  const days = data?.days || [];
  if (!root || !days.length) return;
  root.innerHTML = days.map(dayHTML).join('');
  root.removeAttribute('aria-hidden');
  markNow(days);
  setInterval(() => markNow(days), 60 * 1000);   // keep "Now" moving during the event

  await ready;
  reveal(root);
  refreshSoon();
});

/* --------------------------------------------------------------------------
   Rendering
   -------------------------------------------------------------------------- */
function dayHTML(day, d) {
  const rows = (day.items || []).map((item, i) => `
    <li class="day__row ${kindOf(item.title)}" data-day="${d}" data-item="${i}">
      <span class="day__time">${esc(timeRange(item.start, item.end))}</span>
      <span class="day__event">${esc(item.title)}<span class="day__now" aria-hidden="true">Now</span></span>
    </li>`).join('');
  return `
    <section class="day" aria-label="${esc(day.label)}, ${esc(day.date)}" data-reveal>
      <p class="day__label">${esc(day.label)}</p>
      <h2 class="day__date">${esc(day.date)}</h2>
      <ul class="day__rows" role="list">${rows}</ul>
    </section>`;
}

function kindOf(title = '') {
  if (/break/i.test(title)) return 'is-break';
  if (/ceremony|social/i.test(title)) return 'is-key';
  if (/registration|arrival|departure/i.test(title)) return 'is-logistics';
  return 'is-session';
}

/** "1:30 pm" + "2:00 pm" → "1:30 – 2:00 pm"; "11:30 am" + "12:55 pm" → "11:30 am – 12:55 pm" */
function timeRange(start = '', end = '') {
  if (isBlank(end)) return start;
  const a = start.trim().split(/\s+/);
  const b = end.trim().split(/\s+/);
  if (a[1] && b[1] && a[1].toLowerCase() === b[1].toLowerCase()) return `${a[0]} – ${end.trim()}`;
  return `${start.trim()} – ${end.trim()}`;
}

/* --------------------------------------------------------------------------
   "Now" marker
   -------------------------------------------------------------------------- */
/** "1:30 pm" on "2026-10-30" → a Date in India Standard Time. */
function toDate(iso, time) {
  const m = /^(\d{1,2}):(\d{2})\s*(am|pm)$/i.exec(String(time).trim());
  if (!iso || !m) return null;
  let h = Number(m[1]) % 12;
  if (m[3].toLowerCase() === 'pm') h += 12;
  return new Date(`${iso}T${String(h).padStart(2, '0')}:${m[2]}:00+05:30`);
}

function markNow(days) {
  const now = Date.now();
  root.querySelectorAll('.day__row.is-now').forEach((row) => row.classList.remove('is-now'));
  days.forEach((day, d) => (day.items || []).forEach((item, i) => {
    const start = toDate(day.iso, item.start);
    const end = toDate(day.iso, item.end);
    if (start && end && now >= start && now < end) {
      root.querySelector(`[data-day="${d}"][data-item="${i}"]`)?.classList.add('is-now');
    }
  }));
}
