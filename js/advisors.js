/* ==========================================================================
   advisors.js — the Advisory Committee page.
   People come from data/advisors.json → "members" (in the order listed).
   Each person is drawn as a large portrait "plate", then (in this order)
   their name, school position + organisation, and SMUN role.
   ========================================================================== */
import { ready, reveal, refreshSoon } from './main.js';
import { fetchJSON, esc, isBlank, imageOr, phPortrait, PORTRAIT_COLORS } from './data.js';

const mount = document.querySelector('[data-advisors]');

fetchJSON('data/advisors.json').then(async (data) => {
  if (!mount || !data) return;
  const members = data.members || [];

  mount.innerHTML = members.map((m, i) => `
    <li class="adv">
      <figure class="adv__plate">
        <div class="adv__frame">
          ${imageOr(m.photo, m.alt || `Portrait of ${m.name}`,
                    phPortrait(PORTRAIT_COLORS[i % PORTRAIT_COLORS.length], m.name),
                    { lazy: false })}
        </div>
      </figure>
      <div class="adv__text">
        <h3 class="adv__name">${esc(m.name)}</h3>
        <!-- 1) Their position at school -->
        ${isBlank(m.position) ? '' : `<p class="adv__position">${esc(m.position)}</p>`}
        ${isBlank(m.organisation) ? '' : `<p class="adv__org">${esc(m.organisation)}</p>`}
        <div class="rule rule--soft adv__rule"></div>
        <!-- 2) Their role at SMUN -->
        ${isBlank(m.role) ? '' : `<p class="adv__position">${esc(m.role)}</p>`}
        ${isBlank(m.roleOrganisation) ? '' : `<p class="adv__org">${esc(m.roleOrganisation)}</p>`}
      </div>
    </li>`).join('');

  // Plates fade in one after another. (The attribute is added only now, after
  // the plates exist — the site-wide reveal on page load would otherwise
  // claim the still-empty list and skip it.)
  mount.setAttribute('data-reveal-stagger', '');
  await ready;
  reveal(mount.parentElement);
  refreshSoon();
});
