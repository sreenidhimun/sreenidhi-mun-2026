/* ==========================================================================
   envelope.js — the Secretary-General's letter arrives in a sealed envelope.

   The letter waits inside the envelope. Click (or tap, or press Enter on)
   the red wax seal and it plays once, about 3 seconds:
     • the seal cracks and two wax fragments fall
     • the flap opens (3D, hinged at the top) and tucks behind the letter
     • the letter rises out; the envelope slides down and fades
     • the letter's lines appear one after another
     • the signature writes itself, then the sign-off appears
   Reduced motion: nothing to open — the letter sits in front of its envelope.

   Signature: if data/site.json has "signatureSvg" (e.g. "assets/svg/signature.svg"),
   that drawing is traced with DrawSVG. Otherwise the name is written in
   Pinyon Script and revealed left → right while a small ink nib travels along.
   ========================================================================== */
import { motionOK, qs, qsa } from './motion/env.js';
import { scrollToTarget } from './motion/smooth.js';

export function initEnvelope() {
  const stage = qs('[data-letter-stage]');
  const letter = qs('[data-letter]');
  const envelope = qs('[data-envelope]');
  if (!stage || !letter || !envelope || !motionOK()) return;

  const { gsap, SplitText } = window;
  const parts = qsa('[data-env-part]', envelope);            // back, pocket, flap, seal
  const flap = qs('[data-env-flap]', envelope);
  const seal = qs('[data-env-seal]', envelope);
  const shards = qsa('[data-env-shard]', envelope);
  const hint = qs('[data-env-hint]', envelope);
  const signText = qs('[data-sign-text]', letter);
  const signSvgPaths = qsa('.letter__sign-svg path', letter);
  const nib = qs('[data-nib]', letter);
  const signoff = qs('[data-signoff]', letter);
  const paragraphs = qsa('[data-letter-body] p', letter);
  const blocks = [...qsa('.letter__salutation', letter), ...paragraphs, ...qsa('.letter__closing', letter)];

  stage.classList.add('is-animated');

  // The seal becomes a real button.
  seal.removeAttribute('tabindex');
  seal.removeAttribute('aria-hidden');
  if (hint) hint.hidden = false;

  let opened = false;
  let m = {};

  /* ---- Where everything sits while the letter is still inside ---- */
  function measure() {
    const letterH = letter.offsetHeight;
    const letterTop = letter.offsetTop;                       // inside the stage
    const envH = envelope.offsetHeight;
    const band = Math.max(letterH, envH + 120);
    const envTop = Math.max(24, (band - envH) / 2);
    envelope.style.top = `${envTop}px`;
    const startY = envTop + 18 - letterTop;                  // letter tucked just inside
    const clip = Math.max(0, startY + letterTop + letterH - (envTop + envH) + 6);
    m = { envH, startY, clip };
  }

  function prime() {
    measure();
    // (Negative clip insets keep the letter's soft shadow; the bottom inset
    //  hides whatever would poke out below the envelope.)
    gsap.set(letter, { y: m.startY, clipPath: `inset(-40px -40px ${m.clip}px -40px)` });
    gsap.set(blocks, { opacity: 0, y: 10 });
    gsap.set(signoff, { opacity: 0 });
    gsap.set(flap, { rotationX: 0, transformPerspective: 1200, zIndex: 4 });
    if (signSvgPaths.length) gsap.set(signSvgPaths, { drawSVG: '0%' });
    else gsap.set(signText, { clipPath: 'inset(-30% 100% -40% -8%)' });
    gsap.set(nib, { opacity: 0, x: 0 });
  }
  prime();

  // Keep the closed envelope tidy if the window changes size before it's opened.
  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    if (opened) return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(prime, 150);
  });

  /* ---- Open! ---- */
  seal.addEventListener('click', () => {
    if (opened) return;
    opened = true;
    const fromKeyboard = document.activeElement === seal;

    // Bring the letter into view if the top of the stage is off-screen.
    if (stage.getBoundingClientRect().top < 0) scrollToTarget(stage, -110);

    // Split later paragraphs into lines (the first keeps its drop cap intact).
    const split = paragraphs.length > 1
      ? SplitText.create(paragraphs.slice(1), { type: 'lines', linesClass: 'letter-line' })
      : { lines: [], revert() {} };
    gsap.set(paragraphs.slice(1), { opacity: 1, y: 0 });
    gsap.set(split.lines, { opacity: 0, y: 10 });
    const lines = [...qsa('.letter__salutation', letter), ...paragraphs.slice(0, 1), ...split.lines, ...qsa('.letter__closing', letter)];

    stage.classList.add('is-opening');                       // stops the seal's "click me" ripple
    const tl = gsap.timeline({ onComplete: done });

    // Seal cracks
    tl.to(hint, { opacity: 0, duration: 0.25 }, 0)
      .to(seal, { scale: 1.15, rotation: -6, duration: 0.16, ease: 'power1.out' }, 0)
      .to(seal, { scale: 0, rotation: 14, opacity: 0, duration: 0.28, ease: 'power2.in' }, 0.16)
      .fromTo(shards, { opacity: 0, x: 0, y: 0, rotation: 0 },
        { opacity: 1, x: (i) => (i ? 14 : -16), y: 26, rotation: (i) => (i ? 50 : -40), duration: 0.18, ease: 'power1.out' }, 0.19)
      .to(shards, { y: 80, opacity: 0, duration: 0.22, ease: 'power1.in' }, 0.37);

    // Flap opens, then tucks behind the letter
    tl.to(flap, { rotationX: 180, duration: 0.8, ease: 'power2.inOut' }, 0.32)
      .set(flap, { zIndex: 1 }, 0.72);

    // Letter rises out; envelope drops away
    tl.to(letter, { y: 0, clipPath: 'inset(-40px -40px -40px -40px)', duration: 1.1, ease: 'power3.inOut' }, 0.95)
      .to(parts, { y: m.envH * 0.45, opacity: 0, duration: 0.8, ease: 'power2.in' }, 1.25);

    // Lines appear
    const span = 0.9;
    tl.to(lines, {
      opacity: 1, y: 0, duration: 0.4, ease: 'power2.out',
      stagger: lines.length > 1 ? span / (lines.length - 1) : 0,
    }, 1.75);

    // Signature, then sign-off
    const sig = 1.75 + span + 0.25;
    if (signSvgPaths.length) {
      tl.to(signSvgPaths, { drawSVG: '100%', duration: 0.5, stagger: 0.04, ease: 'power1.inOut' }, sig);
    } else {
      tl.to(signText, { clipPath: 'inset(-30% -12% -40% -8%)', duration: 0.5, ease: 'power1.inOut' }, sig)
        .to(nib, { opacity: 1, duration: 0.05 }, sig)
        .to(nib, { x: () => signText.offsetWidth, duration: 0.5, ease: 'power1.inOut' }, sig)
        .to(nib, { opacity: 0, duration: 0.12 }, sig + 0.5);
    }
    tl.to(signoff, { opacity: 1, duration: 0.3 }, sig + 0.45);

    function done() {
      split.revert();                                        // back to natural, reflowable text
      seal.hidden = true;
      if (hint) hint.hidden = true;
      if (fromKeyboard) {                                    // keyboard users land on the letter
        letter.setAttribute('tabindex', '-1');
        letter.focus({ preventScroll: true });
      }
    }
  });
}
