/* ==========================================================================
   secretariat.js — the Secretariat page.
   People come from data/secretariat.json → "members" (in the order listed).
   ========================================================================== */
import { ready, reveal, refreshSoon } from './main.js';
import { fetchJSON } from './data.js';
import { initNameList } from './namelist.js';

const mount = document.querySelector('[data-namelist]');

fetchJSON('data/secretariat.json').then(async (data) => {
  if (!mount || !data) return;
  initNameList(mount, data.members || [], { color: '#3F6A55' });

  // Names and cards fade in one after another.
  mount.querySelector('.nl-list')?.setAttribute('data-reveal-stagger', '');
  mount.querySelector('.nl-track')?.setAttribute('data-reveal-stagger', '');
  await ready;
  reveal(mount);
  refreshSoon();
});
