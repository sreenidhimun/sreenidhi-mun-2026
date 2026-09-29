# SMUN XIV Website — Project Brain (read this first, every session)

## What this is
The official website for **Sreenidhi Model United Nations (SMUN), XIV edition, 2026** — a 3-day Model UN conference at **Sreenidhi International School, Hyderabad**.
Design direction: **"Option A — Editorial"** — a professional editorial site with a *subtle* newspaper theme (think a quality broadsheet's website, not a vintage prop).

## Who maintains it
A student (HTML, CSS, Python, some JavaScript) with **very little time (≈1 hour/day during exams)**. Therefore:
- Work **autonomously**. Only stop to ask if truly blocked; otherwise make a sensible decision, note it in `PROGRESS.md`, and continue.
- Write **simple, readable, heavily commented** code. No frameworks, no bundlers, no TypeScript, no npm build step.
- Every piece of editable content lives in `/data/*.json` so the maintainer never needs to touch layout code.

## Files you must read
1. `CLAUDE.md` (this file) — rules & tokens.
2. `SPEC-V1.md` — the complete page-by-page, component-by-component specification. **Follow it exactly.**
3. `CONTENT.md` — real content the maintainer has filled in. Anything not filled in stays a `[ bracketed placeholder ]`.
4. `/design/*.png` — exported Figma frames. These are the visual truth. Look at them before building each page.
5. `/assets/svg/scales.svg` and `/assets/svg/emblem-placeholder.svg` — ready-made SVGs to use.
6. `PROGRESS.md` — your running log (create it if missing). Read it at the start of every session to resume.

Figma source (reference only): https://www.figma.com/design/UVDPvnZyBuqCc7LGPkQVUP — page "SMUN — Final (Editorial)".
Yellow "⚡ INTERACTION" boxes in the designs are **annotations for humans — never build them.**

## Tech stack (fixed)
- Static multi-page site: **HTML5 + CSS3 + vanilla JS (ES modules)**.
- **GSAP 3** (core, ScrollTrigger, SplitText, DrawSVGPlugin, Flip, Observer) loaded from the jsDelivr CDN at one **pinned exact version**. All GSAP plugins are free.
- **Lenis** smooth scroll (pinned exact 1.x version from jsDelivr), synced to ScrollTrigger via the GSAP ticker.
- **View Transitions API** for page-turn transitions, with a GSAP fallback.
- **Full-motion v1:** every interaction in SPEC-V1.md (including §14) ships now — nothing is deferred.
- No other libraries.
- Google Fonts: Playfair Display (400, 400 italic, 600), Libre Caslon Text (400, 400 italic), Inter (400, 500, 600), Bodoni Moda (400), Pinyon Script (400). Use `display=swap` + preconnect.
- Local preview: `python3 -m http.server 8000`.
- Deploy target: Netlify (drag-and-drop) or GitHub Pages. All paths must be **relative** so it works in a subfolder.

## Design tokens (put these in `css/tokens.css`)
```css
:root{
  --paper:#F4EEE2; --paper-deep:#ECE3D2; --card:#FBF8F1;
  --ink:#1A2620; --muted:#5B6660; --rule:rgba(26,38,32,.9); --rule-soft:rgba(26,38,32,.25);
  --green:#1E4D3A; --forest:#12261D; --flame:#E8591C; --orange:#F28C28;
  --terra:#A16A3F; --sand:#DFC79C; --cream:#F0E2C8;
  --font-display:"Playfair Display",Georgia,serif;
  --font-read:"Libre Caslon Text",Georgia,serif;
  --font-ui:"Inter",system-ui,sans-serif;
  --font-digits:"Bodoni Moda",Georgia,serif;
  --font-sign:"Pinyon Script",cursive;
  --maxw:1248px; --gutter:clamp(20px,6.6vw,96px);
  --section-y:clamp(56px,8vw,96px);
  --radius-pill:999px;
  --ease-out:cubic-bezier(.2,.7,.2,1);
}
```

## Non-negotiable rules
- **Never invent** real names, phone numbers, dates, agendas, emails, prices or statistics. Use what is in `CONTENT.md`; otherwise use `[ bracketed placeholders ]`.
- Newspaper theme stays **subtle**: fine rules, double rules, datelines, numbered section headers, drop caps, "Fig." captions, faint paper grain. **No** stains, creases, coffee rings, torn edges, specks or sepia filters on everything.
- Every animation must respect `prefers-reduced-motion: reduce` (show final state instantly).
- Hover-only features must have a tap/keyboard equivalent.
- Semantic HTML, real text (never text in images), alt text on every image, visible focus styles, AA contrast.
- Mobile-first. Test mentally at 390px, 768px and 1440px.
- Commit to git after each phase with a clear message (`git add -A && git commit -m "Phase N: …"`).
- After finishing a phase, append to `PROGRESS.md`: what you built, decisions made, known issues, placeholders remaining.
