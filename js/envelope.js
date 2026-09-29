/* ==========================================================================
   envelope.js — the Secretary-General's letter arrives in an envelope.

   Desktop (≥ 900px): the section pins and the sequence follows the scroll:
      0–15%   the wax seal cracks (two fragments fall)
     10–35%   the flap opens (3D, hinged at the top) and drops behind the letter
     30–65%   the letter rises out; the envelope slides down and fades
     55–85%   the letter's lines appear one after another
     85–100%  the signature writes itself, then the sign-off appears
   Phones/tablets: the same sequence plays once as a 2.6s animation.
   Reduced motion: nothing moves — the letter sits in front of its envelope.

   Signature: if data/site.json has "signatureSvg" (e.g. "assets/svg/signature.svg"),
   that drawing is traced with DrawSVG. Otherwise the name is written in
   Pinyon Script and revealed left → right while a small ink nib travels along.
   ========================================================================== */
import { motionOK, qs, qsa } from './motion/env.js';

export function initEnvelope() {
  const section = qs('[data-letter-section]');
  const stage = qs('[data-letter-stage]');
  const letter = qs('[data-letter]');
  const envelope = qs('[data-envelope]');
  if (!section || !stage || !letter || !envelope || !motionOK()) return;

  const { gsap, SplitText } = window;
  const head = qs('[data-letter-head]', section);
  const parts = qsa('[data-env-part]', envelope);           // back, pocket, flap, seal
  const flap = qs('[data-env-flap]', envelope);
  const seal = qs('[data-env-seal]', envelope);
  const shards = qsa('[data-env-shard]', envelope);
  const signature = qs('[data-signature]', letter);
  const signText = qs('[data-sign-text]', letter);
  const signSvgPaths = qsa('.letter__sign-svg path', letter);
  const nib = qs('[data-nib]', letter);
  const signoff = qs('[data-signoff]', letter);

  stage.classList.add('is-animated');

  const mm = gsap.matchMedia();
  mm.add({ desktop: '(min-width: 900px)', mobile: '(max-width: 899px)' }, (ctx) => {
    const { desktop } = ctx.conditions;
    if (desktop) section.classList.add('is-pinned');

    // Split the paragraphs into lines. The first paragraph (with the drop cap)
    // moves as one block — splitting it would upset the drop cap's wrapping.
    const paragraphs = qsa('[data-letter-body] p', letter);
    const split = paragraphs.length > 1
      ? SplitText.create(paragraphs.slice(1), { type: 'lines', linesClass: 'letter-line' })
      : { lines: [], revert() {} };
    const lines = [
      ...qsa('.letter__salutation', letter),
      ...paragraphs.slice(0, 1),
      ...split.lines,
      ...qsa('.letter__closing', letter),
    ];

    /* ---- Measurements (re-run on every refresh / resize) ---- */
    let m = {};
    const measure = () => {
      const stageRect = stage.getBoundingClientRect();
      const sectionRect = section.getBoundingClientRect();
      const letterH = letter.offsetHeight;
      const letterTop = letter.offsetTop;                    // inside the stage
      const envH = envelope.offsetHeight;
      const stageTopInView = stageRect.top - sectionRect.top; // where the stage sits while pinned
      const band = desktop ? window.innerHeight - stageTopInView : Math.max(letterH, envH + 80);
      const envTop = Math.max(24, (band - envH) / 2);
      envelope.style.top = `${envTop}px`;
      const startY = envTop + 18 - letterTop;               // letter tucked just inside the envelope
      const clip = Math.max(0, startY + letterTop + letterH - (envTop + envH) + 6);
      const overflow = desktop ? Math.max(0, stageTopInView + letterTop + letterH + 32 - window.innerHeight) : 0;
      m = { envH, startY, clip, overflow };
    };
    measure();

    /* ---- The sequence (built in "progress" units: 1 = the whole thing) ---- */
    const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' } });

    // (The clip uses negative insets so the letter's soft shadow isn't cut off.)
    tl.set(letter, { y: () => m.startY, clipPath: () => `inset(-40px -40px ${m.clip}px -40px)` }, 0);
    tl.set(lines, { opacity: 0, y: 10 }, 0);
    tl.set(signoff, { opacity: 0 }, 0);
    tl.set(flap, { rotationX: 0, transformPerspective: 1200, zIndex: 4 }, 0);
    tl.set(parts, { y: 0, opacity: 1 }, 0);
    if (signSvgPaths.length) tl.set(signSvgPaths, { drawSVG: '0%' }, 0);
    else tl.set(signText, { clipPath: 'inset(-30% 100% -40% -8%)' }, 0).set(nib, { opacity: 0, x: 0 }, 0);

    // 0–15% seal cracks
    tl.to(seal, { scale: 1.15, rotation: -6, duration: 0.05, ease: 'power1.out' }, 0)
      .to(seal, { scale: 0, rotation: 14, opacity: 0, duration: 0.09, ease: 'power2.in' }, 0.05)
      .fromTo(shards, { opacity: 0, x: 0, y: 0, rotation: 0 },
        { opacity: 1, x: (i) => (i ? 14 : -16), y: 26, rotation: (i) => (i ? 50 : -40), duration: 0.06, ease: 'power1.out' }, 0.06)
      .to(shards, { y: 70, opacity: 0, duration: 0.06, ease: 'power1.in' }, 0.11);

    // 10–35% flap opens; after 90° it tucks behind the letter
    tl.to(flap, { rotationX: 180, duration: 0.25, ease: 'power2.inOut' }, 0.1)
      .set(flap, { zIndex: 1 }, 0.225);

    // 30–65% letter rises out; envelope slides down and fades
    tl.to(letter, { y: 0, clipPath: 'inset(-40px -40px -40px -40px)', duration: 0.35, ease: 'power3.inOut' }, 0.3)
      .to(parts, { y: () => m.envH * 0.45, opacity: 0, duration: 0.25, ease: 'power2.in' }, 0.4);

    // 55–85% lines appear
    const lineDur = 0.08;
    const stagger = lines.length > 1 ? (0.3 - lineDur) / (lines.length - 1) : 0;
    tl.to(lines, { opacity: 1, y: 0, duration: lineDur, stagger, ease: 'power2.out' }, 0.55);

    // Long letters on short screens: glide the letter up so its end is readable while pinned.
    if (desktop) {
      tl.to(letter, { y: () => -m.overflow, duration: 0.33, ease: 'none' }, 0.65)
        .to(head, { opacity: () => (m.overflow > 40 ? 0 : 1), duration: 0.1 }, 0.65);
    }

    // 85–100% signature, then sign-off
    if (signSvgPaths.length) {
      tl.to(signSvgPaths, { drawSVG: '100%', duration: 0.12, stagger: 0.01, ease: 'power1.inOut' }, 0.85);
    } else {
      tl.to(signText, { clipPath: 'inset(-30% -12% -40% -8%)', duration: 0.11, ease: 'power1.inOut' }, 0.85)
        .to(nib, { opacity: 1, duration: 0.01 }, 0.85)
        .to(nib, { x: () => signText.offsetWidth, duration: 0.11, ease: 'power1.inOut' }, 0.85)
        .to(nib, { opacity: 0, duration: 0.02 }, 0.96);
    }
    tl.to(signoff, { opacity: 1, duration: 0.04 }, 0.96);

    if (desktop) {
      window.ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: '+=160%',
        pin: true,
        scrub: 1,
        animation: tl,
        invalidateOnRefresh: true,
        refreshPriority: 1,          // measure the pin first, so everything below it accounts for the extra scroll
        onRefreshInit: () => { gsap.set(letter, { clearProps: 'transform,clipPath' }); },
        onRefresh: measure,
      });
    } else {
      tl.pause(0);
      tl.duration(2.6);                                   // play the same sequence in 2.6 seconds
      tl.eventCallback('onComplete', () => split.revert()); // back to natural text (reflows on rotate)
      window.ScrollTrigger.create({
        trigger: stage,
        start: 'top 70%',
        once: true,
        onEnter: () => tl.play(),
        onRefresh: measure,
      });
    }

    // Triggers further down the page were created before this pin: re-order and re-measure.
    window.ScrollTrigger.sort();
    window.ScrollTrigger.refresh();

    return () => {                                        // breakpoint changed: undo everything
      split.revert();
      section.classList.remove('is-pinned');
      envelope.style.top = '';
      gsap.set([letter, ...parts, flap, seal, ...shards, signText, nib, signoff, head].filter(Boolean), { clearProps: 'all' });
    };
  });
}
