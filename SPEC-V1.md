# SMUN XIV Website — v1 Specification

This is the complete blueprint. Build exactly this. When the spec and the `/design` PNGs disagree on a small visual detail, the PNG wins; on behaviour, this spec wins.

---
## 0. Scope — FULL MOTION v1 (everything ships now)
Build **every** page, component and interaction in this document in v1. Nothing is deferred.
Motion stack: **GSAP 3** (core, ScrollTrigger, SplitText, DrawSVGPlugin, Flip, Observer — all free) + **Lenis** smooth scroll + the **View Transitions API** (with a GSAP fallback).
Sections §1–§13 describe layout and base behaviour; **§14 "Full-motion layer" is mandatory** and upgrades several of them (where §14 and an earlier section differ, §14 wins).

Performance budget while doing all this: animate only `transform`, `opacity`, `clip-path` and SVG stroke; target 60fps on a mid-range phone; no layout thrashing; `will-change` only during an active animation; pause off-screen loops; every effect has a `prefers-reduced-motion` fallback and a touch fallback.

---
## 1. File structure
```
index.html  secretariat.html  committees.html  committee.html
registrations.html  schedule.html  resources.html  404.html
css/tokens.css  css/base.css  css/components.css
css/pages/home.css  css/pages/secretariat.css  css/pages/committees.css
css/pages/registrations.css  css/pages/schedule.css  css/pages/resources.css
js/main.js            → shared bootstrap: inject chrome, mobile menu, glass nav, reading-progress line, scroll reveals, reduced-motion helper
js/motion/smooth.js   → Lenis + ScrollTrigger integration, lenis.stop()/start() helpers, anchor scrolling
js/motion/cursor.js   → ink-dot cursor with states
js/motion/magnetic.js → magnetic buttons
js/motion/transitions.js → page-turn transitions (View Transitions + GSAP fallback)
js/motion/odometer.js → rolling digits
js/envelope.js        → pinned envelope → letter → signature sequence
js/lightbox.js        → collage lightbox with Flip
js/allocation-search.js → Google Sheets CSV search
js/chrome.js          → returns nav + footer HTML (single source of truth)
js/data.js            → fetchJSON(path) helper with error handling
js/loader.js          → scales loader (home page only)
js/home.js            → countdown, contacts copy, collage, letter reveal
js/namelist.js        → reusable hover name list + drawer + mobile cards
js/committees.js      → index rendering + committee template rendering (?id=slug)
js/registrations.js   → ticket rendering
js/resources.js       → tabs + search + video embeds
data/site.json  data/secretariat.json  data/committees.json
data/registrations.json  data/resources.json
assets/svg/scales.svg  assets/svg/emblem-placeholder.svg  assets/svg/grain.svg
assets/img/  assets/logos/  assets/pdf/
README.md  PROGRESS.md
```
Scripts on every page: GSAP core + ScrollTrigger + SplitText + DrawSVGPlugin + Flip + Observer (one pinned 3.x version, jsDelivr) and Lenis (one pinned 1.x version, jsDelivr, plus its recommended CSS), then the modules.
Every page `<head>`: charset, viewport, title "Page — SMUN XIV", meta description, Open Graph tags (title, description, image placeholder), favicon (use the emblem SVG), font preconnect + stylesheet, tokens/base/components CSS + the page CSS. Scripts: GSAP CDN (pinned) then `<script type="module" src="js/main.js">` + page module.

Each page body skeleton:
```html
<a class="skip-link" href="#main">Skip to content</a>
<div id="chrome-top"></div>       <!-- dateline + masthead injected by chrome.js -->
<main id="main"> … page sections … </main>
<div id="chrome-bottom"></div>    <!-- footer injected -->
```
Pass the active page via `<body data-page="home">` so the nav can underline the current link. Because chrome is injected by JS, also include a `<noscript>` basic link list.

---
## 2. Global styles

### 2.1 Page & grain
- `body{background:var(--paper);color:var(--ink);font-family:var(--font-read);}`
- Paper grain: create `assets/svg/grain.svg` using `<feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="3" stitchTiles="stitch"/>` over a 300×300 rect. Apply via `body::before{content:"";position:fixed;inset:0;background:url(../assets/svg/grain.svg);opacity:.06;pointer-events:none;z-index:1;mix-blend-mode:multiply}`. Keep content above it (`main,header,footer{position:relative;z-index:2}`).

### 2.2 Layout
- `.container{max-width:var(--maxw);margin-inline:auto;padding-inline:var(--gutter)}`; for the 1248 content to show at 1440 the padding is 96px.
- Sections: `.section{padding-block:var(--section-y)}`. Alternate background sections use `--paper-deep`.
- Breakpoints: mobile < 768, tablet 768–1199, desktop ≥ 1200.

### 2.3 Typography classes
| Class | Font | Size (desktop → mobile via clamp) | Other |
|---|---|---|---|
| `.kicker` | Inter 600 | 11px | uppercase, letter-spacing .27em, color `--terra` |
| `.meta` | Inter 500 | 11px | uppercase, letter-spacing .18em, `--muted` |
| `.h-hero` | Playfair 400 | clamp(56px, 8.6vw, 124px) | line-height .94, letter-spacing -.01em |
| `.h-page` | Playfair 400 | clamp(48px, 6.7vw, 96px) | line-height .98 |
| `.h-section` | Playfair 400 | clamp(34px, 3.6vw, 52px) | line-height 1.05 |
| `.numeral` | Playfair italic 400 | clamp(36px, 3.9vw, 56px) | color `--orange` |
| `.deck` | Playfair italic 400 | clamp(18px, 1.5vw, 21px) | line-height 1.45, `--muted`, max-width 60ch |
| `.body` | Libre Caslon 400 | 16px (15px mobile) | line-height 1.65 |
| `.caption` | Playfair italic | 14px | `--muted` |
| `.btn` | Inter 600 | 14px | see buttons |

### 2.4 Rules (the newspaper motif)
- `.rule{height:1px;background:var(--rule)}`; `.rule--soft{background:var(--rule-soft)}`
- `.rule--double{border-top:2px solid var(--ink);border-bottom:1px solid var(--ink);height:5px}` (2px + 3px gap + 1px).
- Column rules between cells: `border-left:1px solid var(--rule-soft)` on cells 2+.

### 2.5 Section header component (used on every numbered section)
```html
<header class="section-head" data-reveal>
  <div class="section-head__title"><span class="numeral">01</span><h2 class="h-section">The Countdown</h2></div>
  <span class="meta">Until the gavel falls</span>
</header>
<div class="rule" data-draw></div>
```
Flex row, space-between, align baseline. On mobile the meta label drops under the title.

### 2.6 Buttons
- `.btn` pill: padding 15px 28px (small: 10px 20px, 13px text), radius 999px, Inter 600, letter-spacing .02em, transition .25s.
- `.btn--primary`: bg `--green`, text `--card`; hover bg `--forest`, translateY(-1px).
- `.btn--ghost`: 1.2px border `--ink` at 70%, text `--ink`; hover bg `--ink`, text `--card`.
- `.link-underline`: Inter 500 14px, underline offset 4px, thickness 1px; hover `--green`.
- Arrows are text: "→", "↗", "↓".

### 2.7 Focus & accessibility
- `:focus-visible{outline:2px solid var(--orange);outline-offset:3px;border-radius:4px}`
- `.skip-link` visible on focus. `.sr-only` utility.
- `const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches` exported from main.js; every animation checks it.

---
## 3. Shared chrome (js/chrome.js)

### 3.1 Dateline bar
Container row, space-between, 18px top padding, `.meta` text: left `VOL. XIV — 2026 EDITION`, centre `site.dates` (or `[ CONFERENCE DATES ]`), right `HYDERABAD, INDIA`. Soft rule below (`.rule--soft`, 35% ink). Hidden < 768px except the left item.

### 3.2 Masthead nav (desktop ≥ 1200)
Row, space-between, align centre, padding 14px 0:
- **Brand** (link to index): emblem SVG 42px + two-line wordmark: "Sreenidhi" Playfair 600 21px / "MODEL UNITED NATIONS" Inter 600 9px letter-spacing .28em `--terra`.
- **Links** (gap 30px), Playfair 400 16px: Home, Secretariat, Committees, Registrations, Schedule, Resources. Active = Playfair 600, `--green`, underline 1px offset 6px. Hover = `--green`.
- **Register** `.btn--primary` small → `registrations.html`.
- Double rule underneath (`.rule--double`).

### 3.3 Tablet & mobile nav (< 1200)
Brand + "Menu" button (Inter 600 13px + two-line hamburger icon). Opens a full-screen overlay (`--paper` bg, grain visible): links stacked in Playfair 44px with an italic orange numeral before each (01–06), the dateline below, Register button at the bottom. Close button top-right. Trap focus, Esc closes, body scroll locked. Animation: overlay fades in .3s, links rise 20px staggered .05s.

### 3.4 Glass pill nav (all pages, desktop and mobile)
When the masthead scrolls out of view (IntersectionObserver on the masthead), show a fixed pill: `top:16px; left:50%; translateX(-50%); width:min(880px, calc(100% - 32px))`. Styles: `background:rgba(251,248,241,.72); backdrop-filter:blur(16px) saturate(1.2); border:1px solid rgba(255,255,255,.85); box-shadow:0 8px 24px rgba(26,38,32,.10); border-radius:999px; padding:8px 8px 8px 16px`. Content: emblem 28px, links (Playfair 15px; on mobile only the "Menu" button), small Register button. Enter: translateY(-120%)→0 + fade, .35s var(--ease-out). Exit reverse. Fallback if no backdrop-filter support: solid `--card` 96%.

### 3.5 Footer
**Full footer (home):** double rule; "Sreenidhi Model United Nations" Playfair 64px (clamp 36–64); 4 columns (PAGES / CONTACT / VISIT / FOLLOW) with `.kicker` headings and 14px `--muted` links; soft rule; bottom row: "© 2026 Sreenidhi International School" left, "Vol. XIV · Printed in Hyderabad" Playfair italic right.
**Slim footer (all other pages):** double rule; row: wordmark Playfair 28px left, "© 2026 Sreenidhi International School · Vol. XIV" 12px right.
Footer pulls contacts from `data/site.json`.

---
## 4. Loader — Scales of Justice (home page only; `js/loader.js`)

- Use `assets/svg/scales.svg` inlined into a full-screen overlay `#loader` (`--paper` bg + grain, z-index 100). Centred. Width `min(440px, 80vw)`.
- Top-left `.meta` "SREENIDHI MODEL UNITED NATIONS"; top-right `.meta` "VOL. XIV — 2026". Bottom-right "Skip →" button (Inter 500 13px, `--muted`).
- Under the scales: caption "Weighing the arguments…" (Playfair italic 24px) and a percentage `.kicker` (starts 0%).
- Show only on the **first visit** (`localStorage.smunLoaderSeen`). Add `?loader=1` to the URL to force it for testing.
- While the loader is visible, hide page content (`html.is-loading main{visibility:hidden}`) to avoid flashes.

**GSAP timeline (total ≈ 2.4s):**
| Time | Action |
|---|---|
| 0.00–0.60 | DrawSVG from 0% on `#pillar`, `#base`, `#foot`, then `#beam`, `#chains`, `#pans` (stagger .08, ease power2.inOut). Knob `#knob` scales from 0. |
| 0.50–1.50 | "Weighing": rotate `#beam-assembly` around the fulcrum (`svgOrigin:"260 80"`) to +9°, −7°, +4° (yoyo, ease sine.inOut). **Pans must stay vertical**: in an `onUpdate`, move each pan group to its beam end and do not rotate it (compute end points from the angle). Percentage counts up in sync. |
| 1.50–1.80 | Settle to 0° with `ease:"elastic.out(1,0.55)"`; percentage hits 100%. |
| 1.80–2.10 | Ignite: `#glow` opacity 0→1 & scale .6→1; `#flame` scaleY 0→1 from the bottom (`transformOrigin:"50% 100%"`), slight flicker (two quick scaleX 0.92↔1.04). |
| 2.10–2.45 | Handoff: fade out everything except the beam; stretch a full-width 2px line from the beam's screen position (scaleX from beam width to viewport width), then move it to the masthead double-rule's Y position (measure with getBoundingClientRect), fade the overlay, reveal the page and run the hero intro (§5.2). |

- The timeline must wait for `document.fonts.ready`; if the page load takes longer, hold on the "weighing" loop (max 2.5s total, then continue regardless).
- Skip → jumps to end state immediately. Reduced motion → show the balanced lit scales 500ms, fade out.

---
## 5. Home (`index.html`) — design `/design/01 Home.png`

### 5.1 Hero (`.hero`, top padding 64px, bottom 56px)
Two columns on desktop (text 800px | figure), stacked on mobile (figure first, smaller).
- `.kicker`: "№ 14 — THE 2026 EDITION".
- `<h1 class="h-hero">`: "Sreenidhi<br>Model United<br><em>Nations</em><span class="dot">.</span>" — `<em>` is Playfair italic in `--green`; the full stop is `--orange`.
- `.deck` (max 580px): "Three days of debate, diplomacy and dialogue — where the next generation of leaders takes the floor."
- Actions row (gap 26px): `.btn--primary` "Register as Delegate →" (registrations.html) + `.link-underline` "Read the Secretary-General's letter" (anchors to #letter).
- Figure: emblem SVG 300px (mobile 180px) with a soft orange glow behind (`radial-gradient(circle, rgba(242,140,40,.28), transparent 65%)` on a pseudo-element); below it a 60px rule and `.caption` centred: "Fig. 1 — The Flame of Sreenidhi, ignited on arrival."
- Under the columns: rule, **fact strip** (4 cells, column rules): DATES / VENUE / COMMITTEES / DELEGATES — `.kicker` label + Playfair 22px value from `site.json` (placeholders if empty). Mobile: 2×2 grid. Then rule.

### 5.2 Hero intro motion (runs after loader, or on load if loader skipped)
SplitText the h1 into lines (mask lines with overflow hidden); lines rise from 100% (yPercent) staggered .09s, 0.9s, power3.out. Kicker, deck, actions, figure fade-up 16px staggered after. Emblem flame (inside emblem SVG, `#emblem-flame`) scales in like the loader flame.

### 5.3 Opening image
Full-width (1248px) image, aspect 1248/560 (mobile 4/3), `object-fit:cover`. Placeholder: a `--sage`-ish (#5E6F63) block with centred `.meta` "OPENING IMAGE — CONFERENCE PHOTO". Caption row below: `.caption` "Fig. 2 — The General Assembly in session, SMUN 2025." left, `.meta` "PHOTO: [ CREDIT ]" right.
Motion: clip-path `inset(12% 18% 12% 18%)` → `inset(0)` when 20% in view (ScrollTrigger, 1.1s power2.out). Reduced motion: no clip.

### 5.4 01 — The Countdown
Section head: numeral "01", title "The Countdown", meta "UNTIL THE GAVEL FALLS".
4 equal cells with column rules: big digits in **Bodoni Moda 400**, clamp(64px, 9vw, 128px), `font-variant-numeric: lining-nums tabular-nums`; label under each in Playfair italic 18px `--muted`: Days / Hours / Minutes / Seconds. Mobile: 2×2.
Caption centred below: "Days until the gavel falls · Day I begins [ date, time ]" (fill from site.json).
Logic (`home.js`): target = `site.countdownTarget` (ISO string with +05:30). Update every second; pad to 2 digits (days can be 3). When a digit changes, fade it .2s. If target is null/invalid → show "—" in each cell and caption "Dates to be announced". If target passed → show "The conference is in session" / "SMUN XIV has concluded" based on `site.conferenceEnd`.

### 5.5 02 — A Letter from the Secretary-General (`id="letter"`, bg `--paper-deep`)
Section head: "02", "A Letter from the Secretary-General", meta "CORRESPONDENCE".
Centred letter card, max-width 680px, bg `--card`, 1px border at 8% ink, shadow `0 10px 30px rgba(26,38,32,.12)`, padding 48px 56px (mobile 28px 22px):
- Top row: emblem 46px left; "Hyderabad, [ Date ]" Playfair italic 14px `--muted` right.
- Salutation: "Dear Esteemed Delegates," Playfair italic 24px.
- Paragraphs from `site.letter.paragraphs` (Libre Caslon 16px/1.7). First paragraph has a **drop cap** (`::first-letter` Playfair 64px, `--green`, float left, 3 lines).
- Closing "With immense pride and excitement," Libre Caslon italic `--muted`.
- Signature: `site.letter.signatureName` in Pinyon Script 44px (placeholder "[ Signature ]").
- Sign-off `.kicker`: "[ NAME ] · SECRETARY-GENERAL, SMUN XIV".
- Below the card, centred: a small wax-seal circle (64px, #8E2F1D, with a small orange flame SVG) overlapping the card's bottom edge by 50%.
Motion: see §14.5 (pinned envelope sequence).

### 5.6 03 — Moments from SMUN (collage)
Section head: "03", "Moments from SMUN", meta "A SMALL COLLAGE".
Pinboard of 8 "prints" from `site.collage[]` (each: src, alt, caption). Desktop: CSS grid 12 cols with hand-placed spans (vary sizes: landscape 4 cols, portrait 3 cols) and small negative margins so prints overlap slightly. Each print: white `#fff` border 10px + 46px bottom (caption area in Playfair italic 13px `--muted`), shadow `0 6px 14px rgba(0,0,0,.14)`, rotation from a list [-4, 3, -2, 5, 3, -3, 0, -5]deg. Hover/focus: rotate(0) translateY(-8px) scale(1.03), shadow deeper, z-index up (.35s var(--ease-out)). Mobile: 2-column grid, smaller rotations (±2°).
Under: `.caption` "More photographs coming after the conference." Placeholders: coloured blocks (#5E6F63, #7A6A55, #4F6470, #6E7A5A, #6B5B4E, #58705F, #3F5A66, #7C6650).

### 5.7 04 — Contact & Location
Section head: "04", "Contact & Location", meta "FIND US".
Two columns (560px | rest), stacked on mobile.
- Left: list of rows, each with bottom soft rule and 20px padding: `.kicker` label; Playfair 22px value; 13px `--muted` sub-line; right-aligned "Copy" pill (1px border 30% ink, Inter 600 12px). Rows: ADDRESS (address + "Hyderabad, Telangana"), SECRETARY-GENERAL (phone + name), DIRECTOR-GENERAL (phone + name), EMAIL (email + "For delegations, press and partnerships").
- Copy behaviour: Clipboard API → button becomes green "Copied ✓" for 1.8s; announce via an `aria-live="polite"` region. On touch devices phone values are `tel:` links and email is `mailto:`.
- Right: map frame (border 1px 20% ink, aspect 632/440): Google Maps iframe embed `https://www.google.com/maps?q=<encoded site.contact.mapQuery>&output=embed`, `loading="lazy"`, `title="Map to Sreenidhi International School"`, CSS `filter: grayscale(.35) sepia(.2) contrast(.95)`. Below/overlaid bottom-left: `.btn--primary` small "Get directions ↗" → `https://www.google.com/maps/dir/?api=1&destination=<encoded mapQuery>` (new tab).

### 5.8 05 — Our Partners (coming soon)
Section head: "05", "Our Partners", meta "SPONSORS".
Notice box: outer 2px `--ink` border, 8px padding, inner 1px border 50% ink, centred content, padding 56px 48px:
`.kicker` "NOTICE TO READERS"; Playfair 48px "Partners to be announced."; Libre Caslon italic 17px `--muted` (max 620px) "This year's sponsors and partners will be revealed here soon. Interested in supporting SMUN XIV?"; `.btn--ghost` "Partner with SMUN →" (`mailto:` site email with subject "Partnership — SMUN XIV").
Stamp: absolutely positioned top-right, rotated -8°, 2.5px `--terra` border, radius 6px, "COMING SOON" Inter 600 16px letter-spacing .25em `--terra`, opacity .85.

### 5.9 Full footer (§3.5).

---
## 6. Secretariat (`secretariat.html`) — `/design/02 Secretariat.png`, `02b`, `02c`

### 6.1 Page header (shared pattern for all inner pages)
Padding 64px top, 48px bottom. `.kicker` "THE SECRETARIAT"; `.h-page` "The Minds Behind SMUN XIV."; `.deck` "Meet the Secretariat. Hover over a name to see who they are — click to read their story." (mobile text: "Tap a card to read their story."); rule. Title lines use the SplitText reveal.

### 6.2 Name list component (`js/namelist.js`, reused on committee pages)
`initNameList(rootEl, people)` where people = `[{name, role, photo, alt, bio}]`.

**Desktop (hover-capable, ≥ 900px): three-zone layout inside the container**
- Zone A (left, 230px): role caption area — right-aligned Inter 13px `--muted` line-height 1.4, and above it a Playfair italic 18px `--orange` index ("03"). Absolutely positioned; its `top` follows the active row.
- Zone B (middle): the list. Each person is a `<button class="nl-item">` (full row, text-align left, no chrome) containing the name in Playfair 400, `clamp(40px, 4vw, 58px)`, line-height 1.2, color `--ink` at **22% opacity**.
- Zone C (right, 330×430): portrait stack. Images absolutely stacked; the active one opacity 1, others 0. Slight rotation −1.5°, shadow `0 20px 40px rgba(26,38,32,.18)`. Under the portrait a small ink pill "Click to read more →".

**Behaviour**
- On `pointerenter`/`focus` of an item → set active: name to 100% opacity, Playfair 600, `scale(1.1)` from left origin, `translateX(18px)`; all others back to 22%. Transition .45s var(--ease-out).
- Role caption + index fade in (.3s) at the active row's vertical centre.
- Portrait: crossfade to the person's image (.35s) — the previous image fades to 0 while offset 14px/rotated +2°. The portrait container follows the **cursor's Y** within the list bounds using `gsap.quickTo(portrait, "y", {duration:.6, ease:"power3"})`, clamped so it never leaves the section. When navigating by keyboard, align it to the focused row instead.
- Default active = first person.
- Click / Enter / Space → open the **bio drawer**.

**Bio drawer** (`/design/02b`): `<dialog>`-like panel fixed right, width min(640px, 100vw), full height, bg `--card`, shadow `0 0 60px rgba(0,0,0,.3)`, padding 36px 48px. Backdrop `rgba(26,38,32,.45)`. Contents: top row "03 / 08" Playfair italic `--orange` + "✕ Close"; landscape portrait (100% × 330px, object-fit cover); `.kicker` role; Playfair 44px name; bio in Libre Caslon 15px/1.7; bottom row prev/next buttons showing neighbour names ("← [ name ]", "[ name ] →"). Slide in from right (.45s power3.out), backdrop fade. Esc/backdrop/close button closes; focus trapped; focus returns to the triggering name. Left/right arrow keys switch person.

**Mobile/touch (< 900px or no hover)** (`/design/02c`): replace the list with a horizontal scroll-snap row of cards (width 82vw, gap 16px, `scroll-snap-type:x mandatory`). Card: `--card` bg, 14px padding, portrait 4:5, `.kicker` role (9px), Playfair 26px name, Playfair italic 13px "Tap to read their story". Slight alternating rotation ±1.5°. Dots pager below (active dot 18px wide pill). Tap → same drawer (full-screen on mobile).

### 6.3 Data (`data/secretariat.json`)
8 placeholder members in this order with these roles (names stay `[ … ]` until CONTENT.md provides them): Secretary-General; Director-General; Under-Secretary-General of Design; USG of IT; USG of Delegate Affairs; USG of Logistics; USG of Press; USG of Training. (If CONTENT.md lists different roles, use those.)

### 6.4 Slim footer.

---
## 7. Committees

### 7.1 Index (`committees.html`) — `/design/03 Committees — Index.png`
Header: kicker "THE COMMITTEES", title "Choose Your Floor.", deck "Every committee, its agenda and its executive board. Select a committee to open its page."
List rendered from `data/committees.json`. Each row is an `<a>` to `committee.html?id=<slug>`: grid columns `52px | 52px | minmax(0,480px) | 1fr | auto`, padding 26px 0, soft rule under each:
Roman numeral (Playfair italic 22px `--terra`) · committee logo 52px circle (image, or placeholder circle in the committee's `color` with a 1.5px `--sand` ring) · name Playfair 40px (clamp 26–40) · agenda Libre Caslon italic 15px `--muted` · arrow "→" 22px.
Hover/focus: row bg `--paper-deep`, padding-left 24px, numeral turns `--orange`, logo scales 1.08, arrow becomes "Open →" in `--green` (.3s). Mobile: numeral + logo + name on one line, agenda below, arrow hidden.

### 7.2 Committee template (`committee.html?id=slug`) — `/design/04 Committee Page — Template.png`
Rendered entirely from the matching object in `committees.json`; unknown id → friendly "Committee not found" with a link back.
- Breadcrumb: Inter 500 12px `--muted`: "Committees / [name]" (first part links back).
- **Hero** (row, gap 56px, stacked on mobile): logo 240px (mobile 140px) | text column: `.kicker` "COMMITTEE III" (roman from order), Playfair 84px name (clamp 44–84), then "THE AGENDA" `.meta` + agenda in Playfair italic 26px wrapped in curly quotes (max 780px).
- Rule; **fact strip** with column rules: LEVEL / DELEGATES / PROCEDURE / BACKGROUND GUIDE ("PDF · [size]"); rule.
- **01 — The Executive Board**: section head (meta "HOVER A NAME") + `initNameList()` with the committee's `board[]`.
- **02 — The Background Guide**: card (`--card` bg, 1px 12% ink border, padding 36px, flex row gap 48px, stacked on mobile): left a CSS-drawn stacked-paper PDF thumbnail (220×290 white page with logo, "BACKGROUND GUIDE" kicker, name, grey text lines; a second page behind rotated 5° at 60% opacity; on hover the front page lifts and tilts −2°). Right: `.meta` "PDF · [pages] PAGES · [size] MB", Playfair 36px "Background Guide — [name]", Libre Caslon 15px description, buttons `.btn--primary` "Download PDF ↓" (`download` attribute) + `.btn--ghost` "Preview in browser" (opens PDF in new tab). If no PDF yet: buttons disabled-looking with text "Background guide coming soon".
- Back link "← All committees" (`--green`).
- Page `<title>` and meta description update from the data.

### 7.3 Data
Create 6 placeholder committees (slugs `committee-1`…`committee-6`, names `[ Committee Name ]`, colors from: #3F6A55, #3F6876, #A16A3F, #1E4D3A, #98AA68, #6B5B4E) unless CONTENT.md provides real ones. Each board: Chairperson, Vice-Chairperson, Rapporteur placeholders.

---
## 8. Allocations & Registrations (`registrations.html`) — `/design/05 Allocations & Registrations.png`
Header: kicker "ALLOCATIONS & REGISTRATIONS", title "Take Your Seat.", deck "Register as a delegate, join the International Press, or sign up for Homecoming. Allocations are published in the sheets linked below."

**Ticket cards** (3 columns desktop, 1 column mobile, gap 24px), from `data/registrations.json`:
Card 400×~560: `--card` bg, radius 14px, 1px 15% ink border, shadow `0 6px 16px rgba(26,38,32,.07)`.
- Top "body": `.kicker` (e.g. "ADMIT ONE — DELEGATE"), Playfair 30px title, Libre Caslon 15px `--muted` description.
- **Perforation**: a dashed 1.5px line (35% ink, dash 6/6) across at a fixed position, with two 28px **notches** (circles filled `--paper` with the card's border) half-cut on the left and right edges (use pseudo-elements; card `overflow:visible`).
- Status **stamp** above the perforation on the right, rotated −8°: 2.5px border, radius 6px, Inter 600 13px letter-spacing .25em. Colours: OPEN = `--green`; CLOSING/CLOSES IN X DAYS = `--flame`; OPENING SOON = `--terra`; CLOSED = `--muted`. Status text comes from JSON (`status`, optional `closesOn` date → computes "CLOSES IN X DAYS" when ≤ 7 days away).
- Bottom "stub": full-width buttons — `.btn--primary` "Register →" (formUrl) and, if present, `.btn--ghost` "View allocation sheet ↗" (sheetUrl); both `target="_blank" rel="noopener"`. If a URL is empty → button disabled with "Link coming soon". Footer row: "No. 01" Playfair italic `--muted` left, "SMUN XIV" `.meta` right.
- Hover (desktop): lift −10px, shadow `0 20px 40px rgba(26,38,32,.16)` (.35s).
Cards: (1) Delegate Registration & Allocation, (2) International Press Registration & Allocation, (3) Homecoming / Social (form only).

Below the cards: a slim info row (soft rules top/bottom): "Questions about allocations? Email [site email]" with a copy button.

---
## 9. Schedule (`schedule.html`) — `/design/06 Schedule — Coming Soon.png`
Header: kicker "THE PROGRAMME", title "Three Days at a Glance.", deck "The full conference schedule will be published here."
**Stop Press box** (same double-border style as Partners): `.kicker` "STOP PRESS"; Playfair 60px "Programme to be announced."; Libre Caslon italic 17px "The complete three-day schedule is being finalised and will appear here shortly. Check back soon, or follow us on Instagram for the announcement."; buttons `.btn--ghost` "Follow on Instagram ↗" (site.instagram) + `.btn--primary` "Register meanwhile →". "COMING SOON" stamp top-right.
**Ghost preview** at 40% opacity: 3 columns with column rules — "Day I/II/III" Playfair italic 22px `--orange`, "[ Date ]" Playfair 40px, 5 skeleton rows (a 56×8px `--terra` 50% bar + a 150–210×8px ink 25% bar, radius 4px). `aria-hidden="true"`.
Structure the HTML so a real schedule (from a future `data/schedule.json`) can replace the ghost later.

---
## 10. Training Resources (`resources.html`) — `/design/07 Training Resources.png`
Header: kicker "THE LIBRARY", title "Training Resources.", deck "Videos, documents and trusted external guides to prepare you for committee — whether it's your first conference or your fifteenth."
**Toolbar**: tab pills (All / Videos / Documents / IIMUN Resources; active = `--ink` bg + `--card` text; others `--card` bg + 20% ink border) as `role="tablist"`; search input right (pill, 360px, `--card`, placeholder "Search resources…", magnifier icon). Filtering is instant; search matches title + description, case-insensitive; show "No resources match '…'" when empty. Keep the URL in sync (`?type=videos&q=…`).
**01 Videos**: 3-column grid (1 col mobile). Card: 16:9 thumbnail (YouTube thumbnail from id, or placeholder colour) with a centred 56px `--card` play circle; `.kicker` "VIDEO" + duration; Playfair 21px title. Click → replace thumbnail with a `youtube-nocookie.com` iframe (autoplay) in place. Hover: thumbnail scale 1.04.
**02 Documents**: list rows with soft rules: file icon (40×50 card with type label), Playfair 24px title (flex 1), meta "MUN Club Doc · PDF · 2.4 MB", "Download ↓" link in `--green`.
**03 IIMUN Resources**: 3-column cards (`--card`, 1px border): top row `.kicker` "SOURCE: IIMUN" + "↗"; Playfair 26px title; Libre Caslon italic description; small "Opens the IIMUN source in a new tab". Whole card is a link (`target="_blank" rel="noopener"`). **Always credit the source.**
All from `data/resources.json`; start with 3 placeholder videos, 4 placeholder docs, 3 placeholder IIMUN links (url "#").

---
## 11. Base motion system — in `main.js` (extended by §14)
- `[data-reveal]`: fade + rise 24px, .8s power3.out, when top enters 85% of viewport; children with `[data-reveal-stagger]` stagger .08s.
- `[data-draw]` rules: scaleX 0→1 from left, 1s power2.out.
- Section numerals: fade in .6s slightly before their titles.
- Page headers: SplitText line reveal (like the hero).
- All ScrollTriggers created after fonts load; refresh on resize.
- Reduced motion: skip all of the above (elements visible immediately).

---
## 12. Data files (create with these shapes)

`data/site.json`
```json
{
  "edition": "XIV", "year": 2026,
  "dates": "[ Conference Dates ]",
  "countdownTarget": null,
  "conferenceEnd": null,
  "venue": "Sreenidhi International School",
  "committeesCount": "[ 10 ]", "delegatesCount": "[ 600+ ]",
  "contact": {
    "addressLines": ["[ Address line ]", "Hyderabad, Telangana [ PIN ]"],
    "secGen": {"name": "[ Name ]", "phone": "[ +91 00000 00000 ]"},
    "dirGen": {"name": "[ Name ]", "phone": "[ +91 00000 00000 ]"},
    "email": "[ email ]",
    "mapQuery": "Sreenidhi International School, Hyderabad"
  },
  "instagram": "#",
  "letter": {
    "date": "[ Date ]",
    "paragraphs": ["[ Placeholder — the Secretary-General's letter paragraph 1 ]", "[ paragraph 2 ]"],
    "signatureName": "[ Signature ]",
    "signOff": "[ NAME ] · SECRETARY-GENERAL, SMUN XIV"
  },
  "collage": [{"src": "", "alt": "", "caption": "SMUN [ year ]"}]
}
```
`data/secretariat.json` → `{"members":[{"name":"[ Secretary-General ]","role":"Secretary-General","photo":"","alt":"","bio":"[ Placeholder anecdote ]"}]}`
`data/committees.json` → `{"committees":[{"slug":"committee-1","name":"[ Committee Name ]","abbr":"","color":"#3F6A55","logo":"","agenda":"[ Placeholder agenda ]","level":"[ Level ]","delegates":"[ 00 ]","procedure":"[ UNA-USA ]","guide":{"pdf":"","pages":"","sizeMB":"","description":"[ … ]"},"board":[{"name":"[ Chairperson ]","role":"Chairperson","photo":"","alt":"","bio":"[ … ]"}]}]}`
`data/registrations.json` → `{"tickets":[{"id":"delegate","kicker":"ADMIT ONE — DELEGATE","title":"Delegate Registration & Allocation","description":"…","formUrl":"","sheetUrl":"","status":"OPEN","closesOn":null}]}` (+ press, social)
`data/resources.json` → `{"videos":[{"title":"","youtubeId":"","duration":""}],"documents":[{"title":"","file":"","type":"PDF","size":""}],"iimun":[{"title":"","description":"","url":"#"}]}`

Missing images → render styled placeholder blocks (never broken-image icons).
If `fetch` fails (e.g. opened via file://), show a small notice: "Open this site through a local server: python3 -m http.server".

---
## 13. Definition of done (check every item before finishing)
- [ ] All 7 pages + 404 render with no console errors at 390 / 768 / 1440 widths.
- [ ] Nav: active states, mobile menu (focus trap, Esc), glass pill appears after the masthead.
- [ ] Loader plays once, skip works, `?loader=1` forces it, reduced motion respected.
- [ ] Countdown handles null / future / live / past.
- [ ] Name list: hover, keyboard, drawer (Esc, arrows, focus return), mobile cards — on Secretariat and committee pages.
- [ ] Committee template renders all 6 ids + a not-found state.
- [ ] Tickets show correct stamps and disabled states for empty links.
- [ ] Resources tabs + search + URL sync + empty state + in-place video.
- [ ] Copy buttons work and announce.
- [ ] All content comes from /data; no invented real-world facts.
- [ ] Lighthouse-style sanity: images lazy, fonts swap, headings in order, alt text present.
- [ ] Lenis smooth scroll on all pages, synced with ScrollTrigger; stops while menu/drawer/lightbox are open.
- [ ] Page-turn transitions between every page (View Transitions + fallback).
- [ ] Ink-dot cursor states (default / link / view / hidden on buttons) — hidden on touch.
- [ ] Magnetic primary buttons.
- [ ] Odometer countdown digits.
- [ ] Envelope sequence (pinned on desktop, timeline on mobile) + signature drawing.
- [ ] Collage parallax + Flip lightbox (keyboard, swipe, Esc).
- [ ] Floating committee logo on the index.
- [ ] Allocation search with all states (idle, loading, results, none, error).
- [ ] Map "click to interact" overlay + label card.
- [ ] Reading-progress line under the glass nav.
- [ ] Every effect verified with reduced motion ON and on a touch viewport.
- [ ] README.md explains: how to preview, how to edit each JSON file, where to put images/PDFs/logos, how to deploy to Netlify (drag folder to app.netlify.com/drop) and GitHub Pages.
- [ ] PROGRESS.md lists every remaining placeholder by file.

---
## 14. Full-motion layer (REQUIRED in v1)

### 14.1 Lenis smooth scroll (`js/motion/smooth.js`)
- `const lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true })` (keep native touch scrolling — do not enable syncTouch).
- Sync: `lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0);`
- Export `stopScroll()` / `startScroll()`; call them whenever the mobile menu, bio drawer or lightbox opens/closes.
- In-page anchor links (e.g. "Read the Secretary-General's letter") use `lenis.scrollTo(target, { offset: -90, duration: 1.2 })`.
- Reduced motion: do not create Lenis; use native scrolling.

### 14.2 Page-turn transitions (`js/motion/transitions.js`)
- Primary: cross-document **View Transitions** — `@view-transition { navigation: auto; }` in base.css. Custom keyframes: the old page scales to .97 and darkens slightly (`filter: brightness(.92)`), while the new page slides in from the right edge (`translateX(100%) → 0`) with a soft shadow on its leading edge, 0.7s `cubic-bezier(.7,0,.2,1)` — like turning a newspaper page. Give the masthead `view-transition-name: masthead` so it stays put.
- Fallback (browsers without cross-document view transitions): intercept same-origin internal link clicks (skip new-tab, modified clicks, `#` links, downloads, external); animate a full-screen `--card` "sheet" with a 1px ink edge sweeping in from the right (.55s power3.inOut), then navigate; on the next page load, sweep it out to the left (.55s). Store a `sessionStorage` flag so the incoming page knows to play the exit.
- Reduced motion: instant navigation.

### 14.3 Ink-dot cursor (`js/motion/cursor.js`) — desktop with fine pointer only
- A 10px `--ink` dot follows the pointer via `gsap.quickTo` (x/y, duration .15, power3). A second 36px ring (1px ink, 35% opacity) follows more slowly (duration .45) for a trailing feel.
- States (set with data attributes, updated on `pointerover`):
  - **default** — dot + ring.
  - **link** (`a`, `button` that is not `.btn`): ring scales to 1.6 and fills `--ink` at 8%.
  - **view** (`[data-cursor="view"]`: collage prints, opening image, portraits, committee rows, video thumbnails): ring grows to 84px filled `--ink`, showing "View →" (Inter 600 12px, `--card`); the dot hides. Committee rows show "Open →"; video thumbs show "Play ▶".
  - **hidden** over `.btn` (magnetic buttons handle themselves) and over text inputs (native caret).
- Hide the native cursor only when this system is active (`html.has-custom-cursor *{cursor:none}`), never on touch (`(hover: none) or (pointer: coarse)`), never with reduced motion. Hide the custom cursor when the pointer leaves the window.

### 14.4 Magnetic buttons (`js/motion/magnetic.js`)
- Applies to `.btn--primary`, `.btn--ghost` and `[data-magnetic]`.
- On `pointermove` within the element's box + 24px: translate the button toward the pointer by 30% of the offset (max 12px) and its label by 15% (quickTo, .3s). On leave: return with `elastic.out(1, 0.4)`, .8s.
- Disabled on touch and reduced motion.

### 14.5 Envelope → letter → signature (`js/envelope.js`) — replaces the static letter reveal
Markup inside section 02: an envelope built from inline SVG/CSS — **back** (rect `#E2D3B6`, 1px 15% ink border, radius 6), **flap** (triangle `#D9C8A6`, hinged at the envelope's top edge), **front pocket** (V-shaped `#E9DCC2`, sits above the letter's bottom), **wax seal** (64px circle `#8E2F1D` with an orange flame SVG, centred on the flap tip). The letter card (§5.5) starts tucked inside, behind the pocket, clipped.
- **Desktop (≥ 900px): pinned scroll sequence.** ScrollTrigger `pin: true`, `scrub: 1`, `end: "+=160%"`:
  | Progress | Action |
  |---|---|
  | 0–15% | Seal cracks: scale 1→1.15→0 with a slight rotation, two tiny seal "fragments" fall and fade. |
  | 10–35% | Flap opens: `rotateX(0 → 180deg)`, `transformOrigin: top`, parent `perspective: 1200px`; the flap's z-index drops behind the letter after 90°. |
  | 30–65% | Letter rises out: y from inside the envelope to its final position (≈ −60% of its height); the envelope slides down and fades to 0. |
  | 55–85% | Letter text: SplitText lines of the salutation + paragraphs fade/rise in sequence. |
  | 85–100% | Signature draws (see below), then the sign-off kicker fades in. |
- **Signature:** if `assets/svg/signature.svg` exists (a real signature as a path), inline it and animate with DrawSVG 0→100%. Otherwise render `site.letter.signatureName` in Pinyon Script and reveal it with a left-to-right `clip-path: inset(0 100% 0 0) → inset(0 0 0 0)` wipe while a small ink "nib" dot travels along the baseline.
- **Mobile / tablet (< 900px):** no pinning — the same sequence as a 2.6s timeline triggered once at 30% in view.
- **Reduced motion:** show the open letter with everything visible; envelope shown open beneath it.

### 14.6 Odometer countdown (`js/motion/odometer.js`) — replaces the fading digits
- Each digit is a mask (`overflow:hidden; height:1em; line-height:1`) containing a vertical strip "0 1 2 3 4 5 6 7 8 9 0". To show digit n, tween the strip `yPercent` to `-n * (100/11)`; when rolling from 9 to 0, animate to the final "0" then snap back to the top instantly.
- Duration .6s, `power3.inOut`; only digits that change animate (the seconds column rolls every second, others rarely).
- On first reveal (ScrollTrigger), all digits roll up from 0 to their values with a .05s stagger.
- Bodoni Moda, `lining-nums tabular-nums`. Keep an `aria-live="off"` visual layer plus a visually hidden text version updated every minute for screen readers.

### 14.7 Collage parallax + lightbox (`js/lightbox.js`)
- **Parallax:** give each print `data-speed` from [-0.12, 0.08, -0.05, 0.15, 0.1, -0.1, 0.05, -0.15]; ScrollTrigger scrub moves each print `yPercent: speed * 100` across the section. Disabled < 768px and with reduced motion.
- **Hover:** straighten + lift (§5.6) plus the cursor "View →" state.
- **Lightbox:** click/Enter on a print → full-screen overlay `rgba(18,38,29,.94)`; the image **Flip**-animates from its print position to centre (max 86vw × 80vh, white 10px border kept). Caption in Playfair italic `--cream` below, counter "3 / 8" (Inter 600, tracked) top-left, "✕ Close" top-right, prev/next arrow buttons at the sides. Keyboard ←/→/Esc, swipe via GSAP Observer, click backdrop closes. Closing Flips back to the print. Stop Lenis while open; trap focus; restore focus.

### 14.8 Opening image parallax
After the clip-path reveal (§5.3), the image inside its frame moves `yPercent: -8 → 8` (scale 1.12 so edges never show) with ScrollTrigger scrub.

### 14.9 Styled map overlay (§5.7 upgrade)
- The iframe sits under a transparent "Click to interact with the map" layer (Inter 600 12px pill, centred) so scrolling with Lenis never gets trapped in the map; clicking removes the layer until the pointer leaves the map.
- A label card overlays the top-left: `--card` bg, radius 10, shadow, Playfair 600 15px "Sreenidhi International School" + 12px `--muted` area line from `site.contact.addressLines[1]`, with a small green circle containing the flame icon.
- On first reveal the frame's clip-path opens from the pin area outward (.9s).

### 14.10 Floating committee logo (committees index, §7.1 upgrade)
- One fixed element (200px circle; shows the hovered committee's logo image or its colour + abbreviation in Playfair 600) that follows the pointer at offset (+40px, −100px) via quickTo (.5s, power3).
- Rotation follows horizontal velocity: `rotate = clamp(-8°, 8°, velocityX * 0.02)`, easing back to −4° when still.
- Enter a row → scale 0→1 (`back.out(1.7)`, .35s) and swap content with a quick crossfade; leave the list → scale to 0.
- Touch & reduced motion: no floating logo (row hover styles only).

### 14.11 Allocation search (`js/allocation-search.js`) — added to Registrations under the tickets
Markup/design per the Figma: section head "✦ Find Your Allocation" (meta "SEARCH THE SHEET"), pill search input (620×56, focus ring `--green` 2px), toggle pills "Delegates" / "International Press", result cards.
- Config in `data/registrations.json`:
  ```json
  "allocationSearch": {
    "delegatesCsv": "", "pressCsv": "",
    "columns": { "name": "Name", "school": "School", "committee": "Committee", "portfolio": "Country/Portfolio" },
    "lastUpdated": ""
  }
  ```
  (CSV = Google Sheets → File → Share → Publish to web → CSV link.)
- Fetch the CSV once per toggle (cache it), parse with a small quote-aware CSV parser, search the name column (case-insensitive, trims, min 2 characters, debounce 150ms), show up to 5 matches as result cards (4 cells with column rules: DELEGATE / SCHOOL / COMMITTEE / COUNTRY-PORTFOLIO; Playfair 22px values). Highlight the matched part of the name.
- States: idle hint, loading (skeleton rows), results, "No match for '…'. Can't find your name? Email [site email]", and error ("Allocations aren't published yet — check back soon") when the CSV URL is empty or fails. Only the configured columns are ever shown.
- Results animate in (y 12px, fade, stagger .05s).

### 14.12 Reading-progress line
A 2px `--orange` line attached to the bottom edge of the glass pill nav (and to the top of the viewport while the masthead is visible) scaling 0→1 with page scroll progress (ScrollTrigger scrub on the document).

### 14.13 Additional polish (do all)
- **Hero:** after the line reveal, the emblem's glow "breathes" (opacity .7↔1, scale .98↔1.02, 3s yoyo, paused when off-screen).
- **Numerals:** section numerals slide in from −12px with a slight italic skew settling to 0.
- **Rules:** every `[data-draw]` rule draws left→right as its section enters.
- **Fact strips:** cells reveal with a .08s stagger; values count up if numeric (e.g. delegates).
- **Tickets:** on click of "Register", the stub tears slightly: the part below the perforation rotates 3° and drops 6px (.25s) before the new tab opens; tickets tilt toward the pointer in 3D (max 4°) on desktop.
- **PDF card:** front page lifts and fans out (the back page rotates to 9°) on hover.
- **Resources:** switching tabs uses Flip so cards reflow smoothly; video thumbnails scale 1.04 on hover.
- **Name list:** the hovered name's letters subtly shift (SplitText chars, stagger .01) for a typographic "settle".
- **Glass pill:** hides when scrolling down fast and reappears on scroll up (ScrollTrigger direction), only after the masthead is out of view.
- **Loader → hero:** seamless hand-off per §4; then the hero intro (§5.2).
