/* ==========================================================================
   lightbox.js — full-screen photo viewer for the collage (and the opening
   image). The photo "flies" from its print to the centre of the screen
   (GSAP Flip) and back again when closed.
   Keyboard: ← → to move, Esc to close. Phones: swipe left/right.
   Clicking the dark backdrop closes it. Page scrolling is paused while open.
   ========================================================================== */
import { motionOK, qs, trapFocus } from './motion/env.js';
import { stopScroll, startScroll } from './motion/smooth.js';

let box = null;          // the overlay element (built once)
let state = null;        // { items, index, sources, release }
let swipedAt = 0;

/**
 * Open the lightbox.
 * @param {Array}  items    [{ html, caption, portrait }] — html = the photo (img or placeholder)
 * @param {number} index    which item to show first
 * @param {Array}  sources  the elements on the page each item came from (for the Flip)
 */
export function openLightbox(items, index, sources) {
  if (state) return;
  build();
  const source = sources[index];
  state = { items, index, sources };

  render(index);
  box.hidden = false;
  box.querySelectorAll('.lightbox__nav').forEach((b) => { b.hidden = items.length < 2; });
  qs('.lightbox__count', box).hidden = items.length < 2;
  stopScroll();
  state.release = trapFocus(box, source);
  qs('.lightbox__close', box).focus({ preventScroll: true });

  const frame = qs('.lightbox__frame', box);
  if (motionOK()) {
    const { gsap, Flip } = window;
    gsap.fromTo(qs('.lightbox__backdrop', box), { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power2.out' });
    gsap.fromTo(qs('.lightbox__chrome', box), { opacity: 0 }, { opacity: 1, duration: 0.3, delay: 0.3 });
    gsap.fromTo(qs('.lightbox__caption', box), { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.4, delay: 0.35 });
    // Fly from the print to the centre.
    Flip.fit(frame, source, { scale: true });
    gsap.set(source, { visibility: 'hidden' });
    gsap.to(frame, { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, duration: 0.65, ease: 'power3.inOut' });
  } else if (source) {
    source.style.visibility = 'hidden';
  }
}

export function closeLightbox() {
  if (!state) return;
  const { sources, index, release } = state;
  const source = sources[index];
  const frame = qs('.lightbox__frame', box);
  const done = () => {
    box.hidden = true;
    sources.forEach((s) => { if (s) s.style.visibility = ''; });
    if (window.gsap) window.gsap.set(frame, { clearProps: 'transform' });
    startScroll();
    state = null;
  };
  release();
  if (source) source.focus({ preventScroll: true });   // back to the photo that's showing now
  if (motionOK() && source) {
    const { gsap, Flip } = window;
    source.style.visibility = 'hidden';
    gsap.to(qs('.lightbox__backdrop', box), { opacity: 0, duration: 0.45, ease: 'power2.inOut' });
    gsap.to([qs('.lightbox__chrome', box), qs('.lightbox__caption', box)], { opacity: 0, duration: 0.2 });
    Flip.fit(frame, source, { scale: true, duration: 0.55, ease: 'power3.inOut', onComplete: done });
  } else {
    done();
  }
}

function go(step) {
  if (!state || state.items.length < 2) return;
  const n = state.items.length;
  const next = (state.index + step + n) % n;
  const frame = qs('.lightbox__frame', box);
  const swap = () => {
    // The print we'll fly back to changes too.
    if (state.sources[state.index]) state.sources[state.index].style.visibility = '';
    state.index = next;
    if (state.sources[next]) state.sources[next].style.visibility = 'hidden';
    render(next);
  };
  if (motionOK()) {
    const { gsap } = window;
    gsap.timeline()
      .to([frame, qs('.lightbox__caption', box)], { opacity: 0, x: -24 * step, duration: 0.18, ease: 'power2.in' })
      .add(swap)
      .fromTo([frame, qs('.lightbox__caption', box)], { opacity: 0, x: 24 * step }, { opacity: 1, x: 0, duration: 0.3, ease: 'power3.out' });
  } else {
    swap();
  }
}

function render(i) {
  const item = state.items[i];
  const frame = qs('.lightbox__frame', box);
  frame.innerHTML = item.html;
  frame.classList.toggle('lightbox__frame--portrait', !!item.portrait);
  qs('.lightbox__caption', box).textContent = item.caption || '';
  qs('.lightbox__count', box).textContent = `${i + 1} / ${state.items.length}`;
}

function build() {
  if (box) return;
  box = document.createElement('div');
  box.className = 'lightbox';
  box.hidden = true;
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-label', 'Photograph viewer');
  box.innerHTML = `
    <div class="lightbox__backdrop" data-lightbox-close></div>
    <figure class="lightbox__figure">
      <div class="lightbox__frame"></div>
      <figcaption class="lightbox__caption"></figcaption>
    </figure>
    <div class="lightbox__chrome">
      <p class="lightbox__count" aria-live="polite"></p>
      <button class="lightbox__close" type="button"><span aria-hidden="true">✕</span> Close</button>
      <button class="lightbox__nav lightbox__nav--prev" type="button" aria-label="Previous photograph">←</button>
      <button class="lightbox__nav lightbox__nav--next" type="button" aria-label="Next photograph">→</button>
    </div>`;
  document.body.appendChild(box);

  qs('.lightbox__close', box).addEventListener('click', closeLightbox);
  qs('.lightbox__nav--prev', box).addEventListener('click', () => go(-1));
  qs('.lightbox__nav--next', box).addEventListener('click', () => go(1));
  qs('[data-lightbox-close]', box).addEventListener('click', () => {
    if (Date.now() - swipedAt > 350) closeLightbox();   // a swipe that ends on the backdrop isn't a click
  });
  box.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
    else if (e.key === 'ArrowRight') go(1);
    else if (e.key === 'ArrowLeft') go(-1);
  });

  // Swipe (touch + mouse drag) with GSAP Observer.
  if (window.Observer) {
    window.Observer.create({
      target: box,
      type: 'touch,pointer',
      dragMinimum: 12,
      tolerance: 40,
      onLeft: () => { swipedAt = Date.now(); go(1); },
      onRight: () => { swipedAt = Date.now(); go(-1); },
    });
  }
}

