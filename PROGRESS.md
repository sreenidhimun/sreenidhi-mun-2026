# PROGRESS — SMUN XIV website (v1, full motion)

> **Next session:** read this file first, then continue from the first unchecked phase.

## Phase plan
- [ ] **Phase 0 — Foundations:** file structure, tokens/base/components CSS, grain.svg, data.js, all /data/*.json
- [ ] **Phase 1 — Motion core + shared chrome:** smooth.js (Lenis ↔ ScrollTrigger), chrome.js + main.js (dateline, masthead, mobile menu, glass pill, progress line, footers), transitions.js, cursor.js, magnetic.js, all 7 pages + 404 with heads/skeletons/page headers
- [ ] **Phase 2 — Home layout:** hero, fact strip, opening image, countdown, letter + envelope markup, collage, contact & map, partners, full footer
- [ ] **Phase 3 — Loader + home motion:** scales loader, hero intro + breathing glow, opening image reveal + parallax, odometer, envelope sequence, collage parallax + Flip lightbox, copy buttons, map overlay
- [ ] **Phase 4 — Secretariat:** namelist.js (list, caption, portrait, settle, drawer, mobile cards)
- [ ] **Phase 5 — Committees:** index + floating logo, committee.html?id= template, fanning PDF card, not-found
- [ ] **Phase 6 — Registrations:** ticket cards (perforation, stamps, tilt, tear, disabled) + allocation search (all states)
- [ ] **Phase 7 — Schedule & Resources:** Stop Press + ghost preview; tabs + Flip + search + URL sync + in-place YouTube + IIMUN cards
- [ ] **Phase 8 — Motion pass:** reveal system everywhere, §14.12–14.13 polish, timing tune, refresh after fonts/images, pins after transitions/resize
- [ ] **Phase 9 — QA:** SPEC §13 checklist; desktop / touch / reduced motion; JSON validity; console; links; 390px overflow; screenshots vs /design
- [ ] **Phase 10 — Handover:** README.md; final PROGRESS.md (built, decisions, known issues, placeholders by file)

## Session log

### Phase 0 — Foundations ✅
- Created `css/tokens.css` (brief tokens + `--sage`, `--wax`, z-index layers, and AA-safe `--terra-ink`/`--flame-ink`), `css/base.css` (reset, grain, container, type classes, rules, section head, buttons, pills, focus, skip link, `@view-transition` page-turn keyframes, motion pre-hide + failsafe), `css/components.css` (chrome, menu, pill nav, progress line, footers, page head, fact strip, notice + stamps, placeholders, name list, drawer, cursor), page CSS stubs.
- `assets/svg/grain.svg` (feTurbulence fractalNoise .8 / 3 octaves, 300×300).
- `js/data.js` (fetchJSON + file:// notice, esc, placeholder art, roman numerals) and `js/motion/env.js` (reduced-motion/hover flags, focus trap with `inert`, live-region announcer, fontsReady).
- All `/data/*.json` created and validated.
- **Decisions:**
  - GSAP pinned to **3.15.0**, Lenis to **1.3.26** (latest stable on jsDelivr, verified 200).
  - Contrast: terra (#A16A3F) is 3.9:1 and flame 3.4:1 on paper — below AA for 11–13px text. Small labels use `--terra-ink` #8A5733 (5.2:1) and `--flame-ink` #B8410F; outlines/big type keep the brand colours. Orange numerals are decorative (`aria-hidden`).
  - Playfair is requested as a variable font (wght 400..600) so the name-list weight change animates smoothly.
  - Secretariat: CONTENT.md lists 18 people (some roles shared by two) → 18 separate entries, roles written out in full ("USG Design" → "Under-Secretary-General of Design").
  - Committees: CONTENT.md's 9 committees replace the spec's 6 placeholders; slugs are readable (`unodc`, `disec`, … `lok-sabha`, `marvel`). Spec gave 6 colours; 3 more taken from the collage palette (#58705F, #7A6A55, #3F5A66).
  - DG phone written as "+91 91544 90961" (CONTENT.md had "+91 91 5449 096 1" — same 10 digits, regrouped). **Please confirm.**
  - Countdown target = **30 Oct 2026, 00:00 IST** (no start time given); caption shows "Friday, 30 October 2026 · [ time ]". Conference end = 1 Nov 2026, 17:00 IST (from CONTENT.md).
  - Delegate + Press tickets marked **OPEN** (their forms exist); Social marked **OPENING SOON** (no form yet). **Please confirm.**
  - Letter paragraph 1 uses the design's opening sentence + a bracketed placeholder; paragraph 2 is fully bracketed. Signature = "Aanya Dey" (Pinyon Script) since the SG's name is known.
  - `sheetUrl: null` means "this ticket has no allocation sheet" (Social); `""` means "sheet coming soon".
