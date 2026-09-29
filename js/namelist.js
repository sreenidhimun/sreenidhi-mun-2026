/* ==========================================================================
   namelist.js — the "hover a name" list used on the Secretariat page and for
   each committee's Executive Board.

     initNameList(rootElement, people, options)
       people  = [{ name, role, photo, alt, bio }]   (from the JSON files)
       options = { color: '#3F6A55',   placeholder portrait colour
                   excerpt: false }     show the active person's bio under the list

   Desktop with a mouse (≥ 900px):
     • names sit at 22% ink; the one you point at (or Tab to) brightens,
       grows and slides right while its letters "settle"
     • the role + number fade in on the left, level with that name
     • the portrait on the right cross-fades and follows your cursor's height
     • click / Enter / Space opens the bio drawer
   Phones & tablets: a row of swipeable cards with dots; tap to open the drawer.
   The drawer: Esc / ✕ / backdrop close it, ← → switch person, focus is kept
   inside and returns to the name you came from.
   ========================================================================== */
import { motionOK, canHover, fontsReady, qs, qsa, clamp, trapFocus } from './motion/env.js';
import { stopScroll, startScroll } from './motion/smooth.js';
import { esc, pad2, isBlank, phPortrait } from './data.js';

export function initNameList(root, people, options = {}) {
  if (!root || !people?.length) return;
  const color = options.color || '#3F6A55';
  const total = people.length;

  const portraitHTML = (p, wide = false) => (isBlank(p.photo)
    ? phPortrait(color, 'Portrait', wide)
    : `<img class="media-cover" src="${esc(p.photo)}" alt="${esc(p.alt || `Portrait of ${p.name}`)}" loading="lazy" decoding="async">`);

  /* ---------------- Render ---------------- */
  root.innerHTML = `
  <div class="nl">
    <div class="nl-desktop">
      <div class="nl-caption" aria-hidden="true">
        <span class="nl-caption__index"></span>
        <span class="nl-caption__role"></span>
      </div>
      <ul class="nl-list" role="list">
        ${people.map((p, i) => `
          <li>
            <button class="nl-item" type="button" data-i="${i}" aria-haspopup="dialog"
              aria-label="${esc(p.name)}, ${esc(p.role)}. Open profile.">
              <span class="nl-item__name">${esc(p.name)}</span>
            </button>
          </li>`).join('')}
      </ul>
      ${options.excerpt ? '<p class="nl-excerpt" aria-hidden="true"></p>' : ''}
      <div class="nl-portrait" aria-hidden="true" data-cursor="view" data-cursor-label="Read →">
        <div class="nl-portrait__frame">
          ${people.map((p, i) => `<div class="nl-portrait__img" data-i="${i}">${portraitHTML(p)}</div>`).join('')}
        </div>
        <span class="nl-portrait__cta">Click to read more <span aria-hidden="true">→</span></span>
      </div>
    </div>

    <div class="nl-cards">
      <ul class="nl-track" role="list">
        ${people.map((p, i) => `
          <li class="nl-card-wrap">
            <button class="nl-card" type="button" data-i="${i}" aria-haspopup="dialog">
              <span class="nl-card__photo">${portraitHTML(p)}</span>
              <span class="kicker">${esc(p.role)}</span>
              <span class="nl-card__name">${esc(p.name)}</span>
              <span class="nl-card__hint">Tap to read their story</span>
            </button>
          </li>`).join('')}
      </ul>
      <div class="nl-pager">
        <span class="nl-pager__hint" aria-hidden="true">← swipe →</span>
        <div class="nl-dots">
          ${people.map((p, i) => `<button class="nl-dot" type="button" data-i="${i}" aria-label="Show ${esc(p.name)}"${i === 0 ? ' aria-current="true"' : ''}></button>`).join('')}
        </div>
      </div>
    </div>
  </div>`;

  const desktop = qs('.nl-desktop', root);
  const items = qsa('.nl-item', root);
  const caption = qs('.nl-caption', root);
  const capIndex = qs('.nl-caption__index', root);
  const capRole = qs('.nl-caption__role', root);
  const portrait = qs('.nl-portrait', root);
  const imgs = qsa('.nl-portrait__img', root);
  const excerpt = qs('.nl-excerpt', root);
  const { gsap } = window;
  const animate = motionOK();

  /* ---------------- Fit long names ----------------
     Real names can be long ("Vyshnavi Reddy Mandipalli"). If the widest name
     (bold, scaled ×1.1 and nudged 18px) wouldn't fit its column, shrink the
     whole list's type a little so nothing collides with the portrait. */
  function fit() {
    if (!desktop.offsetParent) return;                  // list hidden (touch layout)
    root.style.removeProperty('--nl-size');
    const list = qs('.nl-list', root);
    const available = list.clientWidth;
    const base = parseFloat(getComputedStyle(items[0].firstElementChild).fontSize);
    const widest = Math.max(...items.map((b) => b.firstElementChild.offsetWidth));
    const needed = widest * 1.06 * 1.1 + 18;
    if (needed > available) root.style.setProperty('--nl-size', `${Math.floor(base * (available / needed))}px`);
  }

  /* ---------------- Desktop: active name ---------------- */
  let active = -1;

  // Vertical centre of row i, measured from the top of the list area.
  // (Uses the <li>'s layout position, so reveal animations don't throw it off.)
  const rowCenter = (i) => {
    const li = items[i].parentElement;
    return li.offsetTop + li.offsetHeight / 2;
  };
  const placeCaption = (i) => {
    const y = rowCenter(i) - caption.offsetHeight / 2;
    if (animate) gsap.set(caption, { y }); else caption.style.transform = `translateY(${y}px)`;
  };
  const splits = new Map();

  function settle(nameEl) {
    if (!animate || !window.SplitText) return;
    if (splits.has(nameEl)) splits.get(nameEl).revert();
    const split = window.SplitText.create(nameEl, { type: 'chars', aria: 'none' });
    splits.set(nameEl, split);
    gsap.fromTo(split.chars, { yPercent: 16, opacity: 0.55 }, {
      yPercent: 0, opacity: 1, duration: 0.5, stagger: 0.01, ease: 'power3.out',
      onComplete: () => { split.revert(); splits.delete(nameEl); },   // back to real, kerned text
    });
  }

  function setActive(i, { alignPortrait = false } = {}) {
    if (i === active) return;
    const prev = active;
    active = i;
    items.forEach((b, k) => b.classList.toggle('is-active', k === i));
    const person = people[i];
    const row = items[i];

    // Role caption beside the active row.
    capIndex.textContent = pad2(i + 1);
    capRole.textContent = person.role;
    placeCaption(i);
    if (animate) gsap.fromTo(caption, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power2.out' });

    // Portrait cross-fade.
    if (animate) {
      if (prev > -1) gsap.to(imgs[prev], { opacity: 0, x: 14, rotation: 2, duration: 0.35, ease: 'power2.out', overwrite: true });
      gsap.fromTo(imgs[i], { opacity: 0, x: -8, rotation: -1 }, { opacity: 1, x: 0, rotation: 0, duration: 0.35, ease: 'power2.out', overwrite: true });
    } else {
      imgs.forEach((img, k) => img.classList.toggle('is-active', k === i));
    }

    if (excerpt) excerpt.textContent = person.bio || '';
    if (prev > -1) settle(row.firstElementChild);
    if (alignPortrait) followY(rowCenter(i));
  }

  // The portrait glides to the cursor's height (kept inside the list).
  const moveY = animate ? gsap.quickTo(portrait, 'y', { duration: 0.6, ease: 'power3' }) : (v) => { portrait.style.transform = `translateY(${v}px)`; };
  function followY(centerY) {
    const max = Math.max(0, desktop.offsetHeight - portrait.offsetHeight - 24);
    moveY(clamp(centerY - portrait.offsetHeight / 2, 0, max));
  }

  items.forEach((btn, i) => {
    btn.addEventListener('pointerenter', () => setActive(i));
    btn.addEventListener('focus', () => setActive(i, { alignPortrait: true }));
    btn.addEventListener('click', () => openDrawer(i, btn));
    btn.addEventListener('keydown', (e) => {         // ↑ ↓ move between names
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        items[clamp(i + (e.key === 'ArrowDown' ? 1 : -1), 0, total - 1)].focus();
      }
    });
  });
  if (canHover) {
    desktop.addEventListener('pointermove', (e) => {
      followY(e.clientY - desktop.getBoundingClientRect().top);
    });
  }
  // Clicking the portrait opens the active person too.
  portrait.style.pointerEvents = 'auto';
  portrait.addEventListener('click', () => { if (active > -1) openDrawer(active, items[active]); });

  /* ---------------- Mobile cards ---------------- */
  const track = qs('.nl-track', root);
  const cards = qsa('.nl-card', root);
  const dots = qsa('.nl-dot', root);
  cards.forEach((card, i) => card.addEventListener('click', () => openDrawer(i, card)));
  dots.forEach((dot, i) => dot.addEventListener('click', () => {
    const wrap = cards[i].parentElement;
    track.scrollTo({ left: wrap.offsetLeft - track.offsetLeft - parseFloat(getComputedStyle(track).paddingLeft), behavior: motionOK() ? 'smooth' : 'auto' });
  }));
  const setDot = (i) => dots.forEach((d, k) => (k === i ? d.setAttribute('aria-current', 'true') : d.removeAttribute('aria-current')));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) setDot(Number(en.target.firstElementChild.dataset.i)); });
  }, { root: track, threshold: 0.6 });
  cards.forEach((c) => io.observe(c.parentElement));

  /* ---------------- Start ---------------- */
  fontsReady.then(() => {
    fit();
    setActive(0);
    followY(rowCenter(0));
  });
  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      fit();
      if (active > -1) placeCaption(active);
    }, 150);
  });

  /* ---------------- Drawer ---------------- */
  function openDrawer(i, trigger) {
    Drawer.open(people, i, trigger, portraitHTML);
  }
}

/* ==========================================================================
   Bio drawer (one per page, shared by every list)
   ========================================================================== */
const Drawer = (() => {
  let el = null;
  let people = [];
  let index = 0;
  let release = null;
  let photoFor = null;
  let isOpen = false;

  function build() {
    el = document.createElement('div');
    el.className = 'drawer';
    el.hidden = true;
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-labelledby', 'drawer-name');
    el.innerHTML = `
      <div class="drawer__backdrop" data-drawer-close></div>
      <div class="drawer__panel" data-lenis-prevent>
        <div class="drawer__top">
          <span class="drawer__count" aria-hidden="true"></span>
          <button class="drawer__close" type="button" data-drawer-close><span aria-hidden="true">✕</span> Close</button>
        </div>
        <div class="drawer__content">
          <div class="drawer__photo"></div>
          <div class="drawer__body">
            <p class="kicker drawer__role"></p>
            <h2 class="drawer__name" id="drawer-name"></h2>
            <p class="drawer__bio"></p>
          </div>
        </div>
        <div class="drawer__nav">
          <button class="drawer__prev" type="button"></button>
          <button class="drawer__next" type="button"></button>
        </div>
      </div>`;
    document.body.appendChild(el);
    qsa('[data-drawer-close]', el).forEach((b) => b.addEventListener('click', close));
    qs('.drawer__prev', el).addEventListener('click', () => go(-1));
    qs('.drawer__next', el).addEventListener('click', () => go(1));
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'ArrowRight') go(1);
    });
  }

  function fill() {
    const p = people[index];
    const n = people.length;
    const prev = people[(index - 1 + n) % n];
    const next = people[(index + 1) % n];
    qs('.drawer__count', el).textContent = `${pad2(index + 1)} / ${pad2(n)}`;
    qs('.drawer__photo', el).innerHTML = photoFor(p, true);
    qs('.drawer__role', el).textContent = p.role;
    qs('.drawer__name', el).textContent = p.name;
    qs('.drawer__bio', el).textContent = p.bio || '';
    qs('.drawer__prev', el).innerHTML = `<span aria-hidden="true">←</span> ${esc(prev.name)}<span class="sr-only"> (previous)</span>`;
    qs('.drawer__next', el).innerHTML = `${esc(next.name)} <span aria-hidden="true">→</span><span class="sr-only"> (next)</span>`;
    qs('.drawer__nav', el).hidden = n < 2;
  }

  function open(list, i, trigger, photoHTML) {
    if (!el) build();
    people = list;
    index = i;
    photoFor = photoHTML;
    fill();
    el.hidden = false;
    isOpen = true;
    stopScroll();
    release = trapFocus(el, trigger);
    qs('.drawer__close', el).focus({ preventScroll: true });
    if (motionOK()) {
      const { gsap } = window;
      gsap.fromTo(qs('.drawer__backdrop', el), { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power2.out' });
      gsap.fromTo(qs('.drawer__panel', el), { xPercent: 100 }, { xPercent: 0, duration: 0.45, ease: 'power3.out' });
      gsap.fromTo(qsa('.drawer__photo, .drawer__body > *', el), { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.05, delay: 0.15, ease: 'power3.out' });
    }
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    const done = () => { el.hidden = true; startScroll(); };
    if (release) { release(); release = null; }
    if (motionOK()) {
      const { gsap } = window;
      gsap.to(qs('.drawer__backdrop', el), { opacity: 0, duration: 0.3 });
      gsap.to(qs('.drawer__panel', el), { xPercent: 100, duration: 0.4, ease: 'power3.in', onComplete: done });
    } else {
      done();
    }
  }

  function go(step) {
    if (people.length < 2) return;
    index = (index + step + people.length) % people.length;
    if (motionOK()) {
      const { gsap } = window;
      const content = qs('.drawer__content', el);
      gsap.timeline()
        .to(content, { opacity: 0, x: -16 * step, duration: 0.16, ease: 'power2.in' })
        .add(fill)
        .fromTo(content, { opacity: 0, x: 16 * step }, { opacity: 1, x: 0, duration: 0.3, ease: 'power3.out' });
    } else {
      fill();
    }
  }

  return { open, close };
})();
