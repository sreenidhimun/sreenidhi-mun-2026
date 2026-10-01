/* ==========================================================================
   registrations.js — the Registrations page.
   Tickets come from data/registrations.json → "tickets":
     formUrl  ""  → "Link coming soon" (disabled)
     sheetUrl ""  → "Link coming soon" (disabled) · null → no sheet button at all
     status   "OPEN" | "OPENING SOON" | "CLOSING" | "CLOSED"
     closesOn "2026-10-20" → the stamp says "Closes in X days" when ≤ 7 days away
   ========================================================================== */
import { site, ready, reveal, refreshSoon } from './main.js';
import { motionOK, canHover, qs, qsa, clamp } from './motion/env.js';
import { fetchJSON, esc, isBlank, pad2, stampFor } from './data.js';
import { initAllocationSearch } from './allocation-search.js';

const ticketsEl = qs('[data-tickets]');
const allocationEl = qs('[data-allocation]');

Promise.all([fetchJSON('data/registrations.json'), site]).then(async ([data, s]) => {
  if (!data) return;
  if (ticketsEl) renderTickets(data.tickets || []);
  if (allocationEl) initAllocationSearch(allocationEl, data.allocationSearch || {}, s);
  await ready;
  reveal(document);
  refreshSoon();
});

const arrowSpan = (a) => `<span aria-hidden="true">${a}</span>`;
const newTab = '<span class="sr-only"> (opens in a new tab)</span>';

function linkOrDisabled(url, label, cls, extra = '') {
  if (isBlank(url)) return `<span class="btn ${cls} btn--block is-disabled" aria-disabled="true">Link coming soon</span>`;
  return `<a class="btn ${cls} btn--block" href="${esc(url)}" target="_blank" rel="noopener" ${extra}>${label}${newTab}</a>`;
}

/* --------------------------------------------------------------------------
   Tickets
   -------------------------------------------------------------------------- */
function renderTickets(tickets) {
  ticketsEl.innerHTML = tickets.map((t, i) => {
    const stamp = stampFor(t);
    const closed = stamp.cls === 'closed';
    const register = closed
      ? '<span class="btn btn--primary btn--block is-disabled" aria-disabled="true">Registrations closed</span>'
      : linkOrDisabled(t.formUrl, `Register ${arrowSpan('→')}`, 'btn--primary', 'data-tear');
    const sheet = t.sheetUrl === null || t.sheetUrl === undefined
      ? ''
      : linkOrDisabled(t.sheetUrl, `View allocation sheet ${arrowSpan('↗')}`, 'btn--ghost');
    return `
      <article class="ticket" aria-labelledby="ticket-${esc(t.id)}">
        <div class="ticket__body">
          <p class="kicker">${esc(t.kicker)}</p>
          <h3 class="ticket__title" id="ticket-${esc(t.id)}">${esc(t.title)}</h3>
          <p class="ticket__desc">${esc(t.description)}</p>
          <p class="stamp stamp--${stamp.cls} ticket__stamp"><span class="sr-only">Status: </span>${esc(stamp.text)}</p>
        </div>
        <div class="ticket__stub">
          <span class="ticket__perf" aria-hidden="true"></span>
          <div class="ticket__actions">${register}${sheet}</div>
          <div class="ticket__foot">
            <span class="ticket__no">No. ${pad2(i + 1)}</span>
            <span class="meta">SMUN XIV</span>
          </div>
        </div>
      </article>`;
  }).join('');
  ticketsEl.setAttribute('data-reveal-stagger', '');
  qsa('.ticket', ticketsEl).forEach(initTicketMotion);
}

/* Tilt towards the pointer (max 4°) + lift; "tear" the stub when Register is clicked. */
function initTicketMotion(ticket) {
  const register = qs('[data-tear]', ticket);
  const stub = qs('.ticket__stub', ticket);

  if (register) {
    register.addEventListener('click', (e) => {
      if (!motionOK() || e.metaKey || e.ctrlKey || e.shiftKey) return;   // let the browser handle it
      e.preventDefault();
      const url = register.href;
      const { gsap } = window;
      gsap.timeline()
        .to(stub, { rotation: 3, y: 6, duration: 0.25, ease: 'power2.out', transformOrigin: '0% 0%' })
        .add(() => {
          const win = window.open(url, '_blank');
          if (win) win.opener = null;
          else window.location.href = url;          // pop-up blocked: open it here instead
        })
        .to(stub, { rotation: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.6)', delay: 1 });
    });
  }

  if (!canHover || !motionOK()) return;
  const { gsap } = window;
  gsap.set(ticket, { transformPerspective: 900 });
  const rx = gsap.quickTo(ticket, 'rotationX', { duration: 0.5, ease: 'power3' });
  const ry = gsap.quickTo(ticket, 'rotationY', { duration: 0.5, ease: 'power3' });
  const ty = gsap.quickTo(ticket, 'y', { duration: 0.35, ease: 'power3' });
  ticket.addEventListener('pointerenter', () => { ticket.classList.add('is-lifted'); ty(-10); });
  ticket.addEventListener('pointermove', (e) => {
    const r = ticket.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;      // −0.5 … 0.5
    const py = (e.clientY - r.top) / r.height - 0.5;
    ry(clamp(px * 8, -4, 4));
    rx(clamp(-py * 8, -4, 4));
  });
  ticket.addEventListener('pointerleave', () => {
    ticket.classList.remove('is-lifted');
    rx(0); ry(0); ty(0);
  });
}
