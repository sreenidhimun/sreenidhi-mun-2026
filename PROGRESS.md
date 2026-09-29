# PROGRESS — SMUN XIV website (v1, full motion)

> **Next session:** read this file first, then continue from the first unchecked phase.

## Phase plan
- [x] **Phase 0 — Foundations:** file structure, tokens/base/components CSS, grain.svg, data.js, all /data/*.json
- [x] **Phase 1 — Motion core + shared chrome:** smooth.js (Lenis ↔ ScrollTrigger), chrome.js + main.js (dateline, masthead, mobile menu, glass pill, progress line, footers), transitions.js, cursor.js, magnetic.js, all 7 pages + 404 with heads/skeletons/page headers
- [x] **Phase 2 — Home layout:** hero, fact strip, opening image, countdown, letter + envelope markup, collage, contact & map, partners, full footer
- [x] **Phase 3 — Loader + home motion:** scales loader, hero intro + breathing glow, opening image reveal + parallax, odometer, envelope sequence, collage parallax + Flip lightbox, copy buttons, map overlay
- [x] **Phase 4 — Secretariat:** namelist.js (list, caption, portrait, settle, drawer, mobile cards)
- [x] **Phase 5 — Committees:** index + floating logo, committee.html?id= template, fanning PDF card, not-found
- [x] **Phase 6 — Registrations:** ticket cards (perforation, stamps, tilt, tear, disabled) + allocation search (all states)
- [x] **Phase 7 — Schedule & Resources:** Stop Press + ghost preview; tabs + Flip + search + URL sync + in-place YouTube + IIMUN cards
- [x] **Phase 8 — Motion pass:** reveal system everywhere, §14.12–14.13 polish, timing tune, refresh after fonts/images, pins after transitions/resize
- [ ] **Phase 9 — QA:** SPEC §13 checklist; desktop / touch / reduced motion; JSON validity; console; links; 390px overflow; screenshots vs /design
- [x] **Phase 10 — Handover:** README.md; final PROGRESS.md (built, decisions, known issues, placeholders by file)

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

### Phase 1 — Motion core + shared chrome ✅
- `js/chrome.js` draws dateline, masthead, glass pill, top progress line, mobile menu and the full/slim footer. It runs as `<script type="module" blocking="render">` *before* the GSAP tags, so the masthead is on screen in the very first frame (needed for a clean View-Transition page turn). Site data is cached in sessionStorage for instant repeat renders; `[data-site-text|href|mailto|tel]` attributes bind any element to site.json.
- `js/main.js`: plugin registration, site.json loading, menu (focus trap via `inert`, Esc, scroll lock, stagger-in), glass pill (IntersectionObserver on the masthead + hides on fast downward scroll > 1600px/s, returns on scroll up, never while it has keyboard focus), reading-progress line (pill + top-of-window), and the reveal system (`reveal()`, `splitLines()`, `countUp()`), `pageShown` promise (the loader resolves it), `refreshSoon()`.
- `js/motion/smooth.js` (Lenis lerp .1, synced via gsap.ticker, anchor scrolling offset −90, stop/start with a lock counter), `transitions.js` (native cross-document View Transitions; GSAP sheet fallback + sessionStorage flag + bfcache reset), `cursor.js`, `magnetic.js`.
- All 7 pages + 404 generated with identical heads (SEO + OG + favicon + fonts + pinned CDN scripts), skip link, noscript nav, page headers.
- **Decisions:**
  - Over `.btn` the custom cursor hides and the normal pointer shows (the spec hides the ink dot there; showing *no* cursor at all felt broken).
  - Index/other page scripts are ES modules; everything waits for fonts before SplitText.
  - A 5-second failsafe in each page's `<head>` shows all content if scripts fail to load.
  - Committees deck uses the design's wording ("Hover a committee to preview its emblem…") with a touch variant ("Tap a committee…"), same approach as the Secretariat deck.
  - `.h-page` tracking −.012em so "The Minds Behind SMUN XIV." fits one line at 1440 like the design.

### Phase 2 — Home layout ✅
- `index.html`: loader markup (inline scales SVG, cleaned of metadata, flame wrapped in `<g id="flame">` so it can scale from its base), hero, fact strip, opening image, 01 countdown, 02 letter + envelope (back / pocket / flap / seal as *siblings* of the letter inside `.letter-stage` so the letter can slide between the envelope's back and pocket), 03 collage, 04 contact + map, 05 partners.
- `css/pages/home.css`: all home sections + loader + lightbox styles; mobile-first (hero figure first on phones, 2×2 fact strip and countdown, 2-column collage with half rotations).
- `js/home.js`: renders letter paragraphs, collage prints (placeholder art when `src` is empty), contact rows (tel:/mailto: links on touch), map iframe + directions link from `contact.mapQuery`, partner mailto with subject, countdown with all states (no date / counting / in session / concluded) and an SR-only text updated each minute.
- `js/main.js`: site-wide `[data-copy]` / `[data-copy-from]` copy buttons (Clipboard API + textarea fallback, "Copied ✓" 1.8s, announced via live region).
- **Decisions:** collage note combines the design's "Click any photograph to enlarge." with the spec's "More photographs coming after the conference."; countdown caption left-aligned as in the design (spec said centred); placeholder label on the opening image sits bottom-left as in the design. Reduced-motion/static letter layout follows the PNG: letter in front, closed envelope + wax seal beneath.

### Phase 3 — Loader + home motion ✅
- `js/loader.js`: DrawSVG ink draw → weighing (+9/−7/+4°, pans repositioned every frame from the beam angle so they hang straight) → holds a gentle weigh loop if the page is still loading (never beyond 2.5s) → elastic settle + 100% → flame ignites + glow blooms + flicker → hand-off (beam becomes a 2px line, stretches full width, glides into the masthead double rule, overlay fades, hero intro starts). Once per visitor, `?loader=1` forces it, Skip works, reduced motion shows the lit scales for 0.5s.
- Hero intro (in `js/home.js`): SplitText masked line rise, kicker/deck/actions/figure fade-up, emblem flame ignites, glow breathes (paused off-screen).
- Opening image: clip-path `inset(12% 18%)` → 0 at 20% in view; parallax −8% → 8%.
- `js/motion/odometer.js`: per-digit strips, only changed digits roll (downwards, 0→9 wraps from the bottom "0"), first reveal rolls every digit up from 0 with a stagger; static when off-screen or reduced motion.
- `js/envelope.js`: pinned (≥900px, `+=160%`, scrub 1) seal crack + shards → 3D flap (tucks behind after 90°) → letter rises out of the pocket (clip hides the part below the envelope) while the envelope drops and fades → lines appear → signature wipe + travelling nib (or DrawSVG if `letter.signatureSvg` is set) → sign-off. Phones: same timeline played once in 2.6s, then the split text is reverted. Long letters glide upwards inside the pin so the end stays readable.
- `js/lightbox.js`: Flip.fit from the print to centre and back to whichever print is showing; ←/→/Esc, Observer swipe, backdrop click, focus trap, Lenis stopped. The opening image also opens in it.
- Collage parallax (≥768px), map clip reveal from the centre (where Google's pin sits), countdown roll-in after the page is shown.
- Added `?reduce=1` to preview the reduced-motion version without changing OS settings.
- **Decisions:** opening-image parallax uses scale 1.18 (not 1.12) because ±8% travel would otherwise expose the frame edges. The drop-cap paragraph of the letter fades in as one block (splitting it into lines breaks the drop cap's wrap); later paragraphs reveal line by line.

### Phase 4 — Secretariat ✅
- `js/namelist.js` → `initNameList(root, people, { color, excerpt })`: three-zone desktop list (≥900px + mouse), active name (100% ink, weight 400→600 animated via the variable font, scale 1.1, +18px), role caption + index level with the active row, portrait cross-fade (old one drifts 14px/+2°) following the cursor's Y with `quickTo`, clamped to the list; keyboard focus aligns the portrait to the row; ↑/↓ move between names; per-hover SplitText "settle" of the letters (split is reverted afterwards so kerning is restored).
- Bio drawer (shared singleton): slides in from the right, backdrop, counter "05 / 18", portrait, role, name, bio, prev/next with neighbour names; Esc/✕/backdrop close; ←/→ switch with a small cross-fade; focus trapped and returned; Lenis stopped.
- Mobile/touch: scroll-snap cards (82vw, alternating ±1.5°), "← swipe →", dots pager synced with an IntersectionObserver; tap → same drawer (full-screen on phones).
- `js/secretariat.js` loads `data/secretariat.json` and staggers the list in.
- **Decisions:** real names are long ("Vyshnavi Reddy Mandipalli"), so the list auto-fits: if the widest name (bold, ×1.1, +18px) wouldn't fit its column, the whole list's font-size shrinks (≈43px at 1440 instead of 58px) rather than colliding with the portrait. The portrait is also clickable (opens the active person) and shows a "Read →" cursor.

### Phase 5 — Committees ✅
- `js/committees.js`: index rows from `data/committees.json` (roman numeral, logo circle — image or colour + abbreviation, name, agenda, arrow → "Open →"); floating 200px logo that follows the pointer (+40, −100) with `quickTo`, tilts with horizontal velocity (±8°, settles to −4°), pops in with `back.out(1.7)`, cross-fades between committees, shrinks away when leaving the list (desktop + motion only).
- `committee.html?id=slug`: breadcrumb, hero (logo 240/140px, "Committee III", name, agenda in curly quotes), fact strip, 01 Executive Board via `initNameList` (with the design's bio excerpt under the list, portraits in the committee colour), 02 Background Guide card (CSS paper stack that lifts/fans on hover; download + preview when `guide.pdf` is set, otherwise a disabled "Background guide coming soon"), back link, page title/description/OG updated from the data, friendly not-found state.
- `css/pages/committees.css`.
- **Decisions:** row hover moves the content 24px with a transform (not padding) so nothing reflows; the section meta reads "Tap a name" on touch devices; committee logo placeholder shows the abbreviation (from CONTENT.md) instead of the design's "–".

### Phase 6 — Registrations ✅
- `js/registrations.js`: ticket cards from `data/registrations.json` — body + stub as two pieces under one drop-shadow, dashed 6/6 perforation with 28px notches, perforations level across cards (body min-height), computed stamps (`stampFor`: OPEN / OPENING SOON / CLOSING / CLOSED, "Closes in X days" when `closesOn` ≤ 7 days away, "Closed" once it has passed), disabled "Link coming soon" for empty URLs, no sheet button when `sheetUrl` is `null`, "Registrations closed" when closed. Desktop: 3D tilt toward the pointer (max 4°) + 10px lift + deeper shadow. Register click: the stub tears (3°, 6px, .25s) and then the form opens in a new tab (falls back to the same tab if a pop-up blocker refuses); the stub springs back a second later.
- `js/allocation-search.js`: ✦ section head, pill search (56px, green focus ring), Delegates / International Press toggles (`aria-pressed`), CSV fetched once per sheet and cached, quote-aware parser, 150ms debounce, ≥2 characters, max 5 matches, matched text highlighted, only the four configured columns ever shown. States: idle hint, loading skeletons, results (stagger in), "No match for '…'. Can't find your name? Email …", and "Allocations aren't published yet — check back soon" (empty link or fetch error). Verified with an in-memory CSV (quoted commas, escaped quotes, accents, extra columns hidden).
- Info row with the site email + Copy button.
- **Note for testing locally:** Python's built-in server occasionally resets a connection when a page requests many files at once; a refresh fixes it (not an issue on Netlify/GitHub Pages).

### Phase 7 — Schedule & Resources ✅
- `schedule.html` + `css/pages/schedule.css`: Stop Press notice (double border, COMING SOON stamp, Instagram link bound to `site.instagram`, "Register meanwhile"), ghost three-day preview at 40% with column rules, `aria-hidden`. The ghost uses the same `.day / .day__time / .day__event` markup a real programme would use (instructions in an HTML comment).
- `resources.html` + `js/resources.js` + `css/pages/resources.css`: `role="tablist"` pills (All / Videos / Documents / IIMUN Resources, ←/→ keys), search (title + description, case-insensitive, 120ms debounce), empty state "No resources match '…'.", address bar kept in sync (`?type=videos&q=…`, shareable, restored on load), GSAP Flip reflow with fade/scale enter/leave. Videos: YouTube thumbnail from the id (or placeholder art), 56px play circle, click swaps in a `youtube-nocookie.com` player (autoplay) in place, "Play ▶" cursor, thumbnail scale 1.04 on hover. Documents: file icon with type label, meta line, Download ↓ (or "Coming soon" when no file). IIMUN cards credit "Source: IIMUN" and open in a new tab; placeholder links (`#`) render as non-links with "Link coming soon".
- **Decision:** videos without a `youtubeId` show "Video coming soon" and aren't clickable (instead of a broken player).

### Phase 8 — Motion pass ✅
- Reveal system verified on every page (page headers split into masked lines; section numerals slide in from −12px with a skew that settles; rules draw left→right; fact strips stagger and count up — "9", "800"; lists/cards stagger in after they're rendered).
- **Fixed:** reveal triggers below the pinned letter fired 1440px too early (they were measured before the pin existed). The pin now has `refreshPriority: 1` and triggers are re-sorted + refreshed after it's created — verified the collage heading now starts exactly where expected.
- Removed static `will-change` declarations (GSAP promotes layers only while animating).
- Verified: native View-Transition page turn (masthead stays put), GSAP-sheet fallback arrival (sheet covers from the first paint, sweeps left, flag cleared), magnetic pull (capped at 12px, elastic return), cursor states, pill hide/show, progress line, pins re-measure on resize.
- Timings kept calm: reveals .8s power3.out, rules 1s, page turn .7s, drawer .45s, lightbox .65s, loader ≈2.4s.
- **Testing note:** the in-app test browser doesn't fire media-query `change` events when its viewport is resized, so crossing the 900px breakpoint *without reloading* couldn't be observed there. `gsap.matchMedia()` handles this in real browsers (it reverts the pin and switches to the phone timeline); a reload at any width always works.
