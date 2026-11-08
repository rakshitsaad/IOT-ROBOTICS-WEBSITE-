# DESIGN.md — IoT & Robotics, Bennett University

The design system and global layout for the club website. **Read this before
every task.** If you change a token, primitive or rule, update this file in the
same change.

Check everything visually at **`/lab`**. The robot mascot's developer test page is
**`/lab/robot`**; never link to it from the site.

---

## 0. Stack and project map

- Next.js 16 (App Router, TypeScript, **Cache Components on**, see §9), Tailwind CSS v4 (CSS-first config, no `tailwind.config`).
- Motion: `gsap` + `@gsap/react` (ScrollTrigger), `lenis`, `motion` (Framer Motion).
- 3D: `three`, `@react-three/fiber`, `@react-three/drei`, loaded lazily: the robot mascot (§11) and its sidekick drone
  (§12, in the robot's canvas), the /projects reel (§16), and the /lab/drone bench (§18, which also uses
  `@react-three/postprocessing` for its bloom).
- State: `zustand` (`lib/store.ts`, client UI state only).
- Data: Supabase later. For now, typed mock data.

```
app/
  globals.css        tokens, Tailwind theme, utilities, base, reduced-motion CSS
  fonts.ts           next/font setup (5 families)
  layout.tsx         root layout: providers, header, footer, cursor
  template.tsx       route transition wrapper
  page.tsx           home: hero, statement, lab, featured, event, numbers, join; the robot travels through them (§12)
  about/page.tsx     /about: the pinned hands sequence, mission and vision, pillars, history, teams (§15)
  members/page.tsx   /members: Senior Core spreads + Junior Core team accordions (§13)
  gallery/page.tsx   /gallery: the shelf of event journals (§14)
  gallery/[slug]/    the journal viewer: 3D page fan, grid view, lightbox (§14)
  projects/layout.tsx the projects stage (WebGL reel, gallery strip), shared by both routes so it animates between them (§16)
  projects/page.tsx  /projects plain list: phone carousel, reduced-motion grid (§16)
  projects/[slug]/   the plain project page: info + photo stack + full-screen viewer (§16)
  events/page.tsx    /events: the feature card showcase, the All events grid (§17)
  achievements/page.tsx /achievements: the card-expansion slider, the All achievements list (§19)
  contact/page.tsx   /contact: the planet-horizon hero, the contact panel (details, form, map), the FAQ (§20)
  join/page.tsx      /join: the crowd hero, why join, teams, how it works, FAQ, last call (§21)
  join/apply/        /join/apply: the application form (§21)
  lab/page.tsx       primitive showcase (noindex)
  lab/robot/page.tsx robot mascot controls (noindex, dev only, not linked)
  lab/drone/page.tsx drone test bench: a button per effect (noindex, dev only, not linked)
components/
  ui/                primitives (Pill, MonoLabel, GridBackground, IrisButton, PillButton, Capsule, DotGrid, CrossMark,
                     RotatingBadge, Accordion)
                     + pill-reveal.ts (pillReveal(), the <Pill reveal> animation; not in the barrel)
  layout/            Header, AnnouncementBar, MenuOverlay, Logo, Cursor, Footer, FitText
  providers/         Providers, SmoothScroll, PageTransition
  robot/             ClubBot mascot: store, stage, mood engine, scene, model, face, icons,
                     BotHeadIcon (flat head, no three.js) (§11)
  home/              home page (§12): HomeHero, Statement, Lab (+ LabPanel, lab-store),
                     Featured (+ FeaturedSlider), UpcomingEvent (+ Countdown, ScrollTilt),
                     Numbers (+ CountUp), JoinCard (+ NotifyForm),
                     HomeRobot (the stage), HomeScroll (the choreography)
  members/           /members (§13): SeniorCore (+ SeniorSpreads, parts, SpreadNav),
                     SeniorCoreTrack (pin, keys, drag, reveals),
                     JuniorCore (+ JuniorCoreNav: sticky team pills, TeamAccordion: one team's cards,
                     SocialIcon, junior-scroll.ts: header offset + Lenis/native scroll)
  gallery/           /gallery (§14): JournalShelf (+ JournalCover), JournalViewer (state, FLIP),
                     JournalFan (+ fan.ts geometry), JournalPages (photo, video, collage, note),
                     JournalScrubber, JournalGrid, Lightbox, JournalBackdrop, JournalChrome (top bar,
                     toolbar, popovers, toast), icons, download.ts (download, share, copy)
  about/             /about (§15): HandsSection (+ HandsScroll: pin, timeline, parallax), IrisRing,
                     AboutSections (Purpose, Pillars, History, TeamsOverview), AboutReveals, icons
  projects/          /projects (§16): ProjectsStage (engine: physics, flight, keys, hit buttons),
                     ReelCanvas (+ reel-shaders, reel-state: shared mutable reel), ReelTitle (vertical title),
                     ProjectStrip (gallery tiles), ImageView (enlarged photo), parts (label, count, filters,
                     tags, info panel), ProjectsIndex (phone carousel, grid), ProjectDetail (+ phone viewer)
  events/            /events (§17): EventsExperience (state, autoplay, keys, overlays), EventShowcase (the card,
                     banners, cutout, entrance, swipe, progress), EventThumbs, EventDetail (full-screen overlay),
                     AllEvents (grid by year), EventTint (+ useEventColor), parts (status badge, details line, title)
  achievements/      /achievements (§19): AchievementsExperience (filters, crossfade, list → slide), AchievementsSlider
                     (background layers, cards, expansion, autoplay, keys, swipe), AchievementsList (rows by year),
                     parts (ResultBadge, Odometer, icons)
  contact/           /contact (§20): ContactHero (planet, badge, headline, partners, motion), ContactPanel (window,
                     stand-up scroll, map) with ContactDetails (rows + copy) and ContactForm (react-hook-form + zod,
                     sending / sent / error), ContactFaq (accordion), scroll.ts (to the form), icons
  join/              /join (§21): JoinHero (headline, button, the crowd's entrance and parallax), Crowd (the SVG crowd),
                     CharacterAvatar (a team character's face crop), JoinSections (why, teams, steps, FAQ, last call),
                     JoinReveals (fade-up reveals), ApplyForm (react-hook-form + zod, resume upload)
  forms/             fields.tsx: Field, inputClass, SentCheck (shared by /contact and /join/apply)
  drone/             the drone (§18): Drone (model), Trail; the home sidekick: Sidekick (+ sidekick-plan.ts: zones,
                     stops, routes, stunts) (§12); the /lab/drone bench: DroneRig, director, ScanBeam, HoloGlobe,
                     Dissolve, DroneCanvas (bloom), DroneStage (lazy mount, poster), store
  lab/               /lab helpers (MotionDemos, RobotLab, DroneLab + MissionDashboard: the bench's stat cards)
hooks/               useReducedMotion, useMediaQuery
lib/
  types.ts           row types for every Supabase table
  mock/              mock rows, one file per table
  data.ts            data access layer (the only thing pages import for data)
  actions.ts         server actions (recruitment "Get notified")
  home.ts            home config: lab stations, photo depths, pan distance
  about.ts           /about config: the hands timeline (ABOUT_HANDS), mission and vision, pillars; client-safe
  gallery.ts         journal pages from gallery items (buildJournalPages), seeded(), dates; client-safe
  members.ts         /members config: term, layout cycle, name lines, Bodoni capital widths, social links;
                     Junior Core: cards per line, row ids, first name, initials
  projects.ts        /projects config: filters, REEL constants and curve maths, Sora capital widths, the split title,
                     STRIP sizes and buildStrip(); client-safe
  events.ts          /events config: showcase order, filters, IST dates, EVENTS_MOTION, EVENT_BANNER; client-safe
  achievements.ts    /achievements config: filters, ACH_MOTION, ACH_CARD, isWin, link label, IST dates; client-safe
  contact.ts         /contact config: subjects, limits, the zod schema (form + server action), FAQ, map URLs,
                     CONTACT_MOTION; client-safe
  join.ts            /join config: JOIN_CHARACTERS (team, image, pitch, skills, face box), isHiring, JOIN_HERO,
                     benefits, steps, FAQ, the application schema and resume rules; client-safe
  crowd.ts           the /join crowd: CROWD (rows, counts, perspective), CROWD_PALETTE, buildCrowd() (seeded); client-safe
  mission.ts         /lab/drone bench: MissionStats type, PODIUM, MISSION (bench drone settings); client-safe
  tokens.ts          JS mirror of tokens, team accent map, textOn()
  motion.ts          EASE / BEZIER / DURATION / STAGGER constants
  gsap.ts            the only place GSAP is imported from and plugins registered
  store.ts           zustand UI store (lenis instance, menuOpen)
  nav.ts             nav items
  cn.ts              cn(): class joiner + tailwind-merge configured for our theme
  announcement.ts    announcement dismiss key + no-flash inline script
```

---

## 1. Colour tokens

A black, deep red and warm white system: premium, cinematic, industrial. Defined as CSS variables on `:root` in
`app/globals.css` and exposed to Tailwind via `@theme inline`. **The default Tailwind palette is removed**: only the
colours below exist (plus `white` and `black`). Use opacity modifiers (`text-text/60`, `bg-text/5`) for tints. Never
hard-code hex values in components.

| Token        | Value                       | Tailwind                   | Use                                          |
| ------------ | --------------------------- | -------------------------- | -------------------------------------------- |
| `--bg`       | `#090909` matte black       | `bg-bg`, `text-bg`         | Page background, dark text on light fills    |
| `--bg-2`     | `#171717` charcoal          | `bg-bg-2`                  | Raised surfaces: cards, bars, panels         |
| `--line`     | `#292929` border grey       | `border-line`, `bg-line`   | Hairlines, borders, dividers                 |
| `--text`     | `#F2F0EB` warm white        | `text-text`, `bg-text`     | Headings, primary text, light fills          |
| `--muted`    | `#858585` muted grey        | `text-muted`               | Body copy, secondary text, labels            |
| `--red`      | `#C62828` deep red          | `bg-red`, `text-red`       | The one signal colour: primary CTA, active states, a highlighted word |
| `--red-deep` | `#A82222`                   | `bg-red-deep`              | Red at 85% toward black: the primary button's hover only |
| `--maroon`   | `#5A1717` dark maroon       | `bg-maroon`                | Quiet fills (status badge), gradient partner of red |
| `--grid`     | `rgba(242,240,235,0.035)`   | (used by GridBackground)   | Grid lines, fainter than `--line`; dev pages only |

**Distribution.** About 75% black and charcoal, 15% warm white, 8% red, 2% maroon. Black always dominates.
- Red is for one thing per view: the primary CTA, an active state (current team pill, a lit timeline dot, an open
  card's ring), or a single highlighted word. Never red body text: red on black is 3.7:1, so it is for large type,
  small labels that repeat a heading, and shapes.
- Maroon is barely visible on black (1.5:1), so it is a fill (with warm white text) or a gradient partner, never text.
- No other hues. Decoration is warm white at low opacity (`text-text/45`) or red, never a new colour.

The JS mirror is `lib/tokens.ts` (`COLORS`, `ACCENTS`, `IRIS_STOPS`): use it
only where JS needs a raw value (three.js materials, canvas, GSAP colour tweens).

### `--iris`: the brand signature

```css
--iris: linear-gradient(110deg, #5A1717, #C62828 50%, #5A1717);
```

A restrained maroon → red → maroon sheen, like light along a machined edge. (The name is kept from the earlier
rainbow version; it now means this sheen.) Use it **sparingly**, only for:
- the robot bezel (the logo mark uses it),
- active borders (`iris-border` utility),
- soft blurred blobs behind content (Senior Core puts one behind every spread at 30%, §13; the /about ring, §15, is a
  conic gradient of maroon and red shaped into a soft ring).

Senior Core's vertical spread also uses a small iris rectangle at 25% opacity over a
portrait's corner; that is the only iris fill shape outside the list above.

/about (§15) sets one word in `text-red`: "machines" in the hero title.

/events (§17) marks an upcoming event's status with a `maroon` Pill ("Registrations open"), so it never competes
with the card's red `IrisButton` ("Register").

/achievements (§19) has more red than one thing per view, because the design asks for it: a short dash before the event
line, the autoplay line under the header, the round share button and the result badge of a win ("Winner"). They are
small shapes; every other result's badge is muted (`bg-text/10`).

/contact (§20) is lit by its accent: the planet's rim and glow are red, as are the badge's arrow dot, the "Send a message"
and "Send message" buttons, focused fields, the panel's top-edge glow and the sent check. The rim is a light source, not
a fill; text stays warm white or muted (form errors are warm white beside a red dot).

/join (§21) keeps red to its two "Apply now" `IrisButton`s (hero and last call, pages apart), the soft glow behind the
crowd and about 8% of the crowd's shirts (a touch muted). Its "Hiring" pills are `maroon`, the team cards' Apply buttons
ghost pills.

Junior Core (§13) uses `iris-border` twice: the 1px ring of each team's open card
(one per team row) and the thin ring of the initials avatar shown for a member
without a photo.

**Never** as a page or section background, never for text, never on more
than one or two elements per viewport. Utilities: `bg-iris`, `iris-border`.

Gradients otherwise: only dark-to-darker (`from-bg/95` scrims over photos) or a faint red tint where it earns its place
(the /events page tint, §17). No rainbow or neon gradients, and keep glows low (the open Junior Core card's glow is
35%/45% red; the robot's bezel glow is a short flash).

### Text on colour

Warm white beats dark text on the accents: **warm white on red is 4.9:1** (dark text 3.5:1) and on maroon 11.7:1. So
red, maroon, iris and the dark fills (`bg-bg`, `bg-bg-2`) take light text (`text-text`), and only the warm white fill
(`bg-text`) takes dark text (`text-bg`, 17:1). `textOn(fill)` in `lib/tokens.ts` encodes this rule.

### Accents and the team accent map

`Accent` (`lib/types.ts`) is `red | white` (white = the warm white `--text`). Mono labels, icon circles and lab
stations pick one: red marks the one emphasised item, warm white the rest.

Every team's accent is **red**, so a team's active state (its current pill in the Junior Core bar, the highlight bar
under its name, the open card's glow) is the same deep red everywhere. Lists of teams that are not states (the join
card's open teams, the /about teams row) use charcoal `raised` pills instead, so red stays rare.

Use `TEAM_ACCENT` / `teamAccent(name)` from `lib/tokens.ts`. The `teams.accent`
column must match this map.

---

## 2. Radius

| Token            | Value | Tailwind        | Use                         |
| ---------------- | ----- | --------------- | --------------------------- |
| `--radius-pill`  | 999px | `rounded-pill`  | Pills, buttons, capsules    |
| `--radius-card`  | 28px  | `rounded-card`  | Cards, panels, sections     |
| `--radius-image` | 18px  | `rounded-image` | Images, thumbnails, swatches |

Exceptions: the /events thumbnail row (§17) uses **10px** (`rounded-[10px]`), because 18px on a 72px-tall thumbnail
reads as a pill; the /achievements waiting cards (§19) use **16px** (`ACH_CARD.radius`), the spec's value, animating to
0 as a card grows into the background; the /contact panel (§20) uses **24px** (the spec's app-window radius) and its
fields **14px** (also on /join/apply, §21).

---

## 3. Typography

Loaded in `app/fonts.ts` with `next/font/google` and exposed as Tailwind font
families. All but Anton are variable fonts, so the weight ranges below are **design
rules**, not loading limits.

| Family         | Tailwind                  | Weights               | Use |
| -------------- | ------------------------- | --------------------- | --- |
| Sora           | `font-sans` (default), `font-display` | **500–800** | All display and body text. Body is 500 (set on `body`). Headlines 700–800 with negative tracking (`-0.02em` to `-0.05em`). Never use 100–400. |
| JetBrains Mono | `font-mono`, `mono-label` | **400–500**           | Small uppercase technical labels only: 11px (12px ≥ md), `letter-spacing: 0.14em`. Use the `mono-label` utility or `<MonoLabel>`. |
| Bodoni Moda    | `font-serif`              | 400–700 + *italic*    | **Senior Core section only.** Nowhere else. |
| Caveat         | `font-hand`               | default               | **Handwritten gallery captions only** (caption tags, note pages, lightbox captions, §14). Nowhere else. |
| Anton          | `font-condensed`          | 400 (its only weight) | **/achievements slide titles only** (§19): huge, condensed, uppercase. Nowhere else. |

**One exception to the mono rule:** the home event countdown (`components/home/Countdown.tsx`)
sets its digits in large JetBrains Mono 500, because the design calls for it. Its `size="sm"`
variant (`clamp(1.4rem, 2.2vw, 1.9rem)` digits, "Days / Hrs / Min") does the same on the /events card and detail
overlay (§17). Nothing else uses big mono.

Junior Core's cards (§13) keep their mono labels (the vertical first name, the role)
at 11px from md up instead of 12px, because the 76px pill is that narrow.

The /projects title (§16) is Sora 800, uppercase, set vertically (reading upwards), up to
about 20% of the screen height per letter. It is sized from measured Sora 800 capital
widths (`SORA_CAPS` in `lib/projects.ts`), so re-measure them if the weight changes.

Bodoni Moda, Caveat and Anton have `preload: false`, so they download only on pages
that render them.

Fluid display sizes: use `text-[length:clamp(min,vw,max)]` (the `length:` hint is
required so Tailwind treats it as a font size).

---

## 4. Layout

- **Mobile first, works from 360px.** Test at 360, 768, 1280 and 1440.
- `shell` utility: `max-width: 1440px`, centred, side padding `--gutter`.
- `--gutter`: 16px (base), 32px (≥ 768px), 48px (≥ 1280px). `px-gutter` applies it without the max-width.
- `--nav-h`: 72px (base), 84px (≥ 768px). `--ann-h`: 40px, or 0 when the announcement is off or dismissed.
- `pt-header` utility: `padding-top: calc(var(--nav-h) + var(--ann-h))`. Every page's first section must clear the fixed header with it (or account for it in a full-bleed hero).
- **No background grid on the site.** Pages sit on the plain matte black of `html`. `<GridBackground>` (§5) is kept for the `/lab` dev pages only; don't add it to site pages, the menu or sections.
- `html` has `scrollbar-gutter: stable` so locking scroll causes no layout shift.
- Focus rings are 2px `--red` (offset 3px); text selection is `--red` with warm white text.

---

## 5. Primitives (`components/ui`)

Import from `@/components/ui`. All are server-compatible except `Capsule`
(client, for parallax), `RotatingBadge` (client, it spins) and `Accordion` (client, it opens). Every primitive accepts `className`, merged with
`cn()` (tailwind-merge taught our colours, radii, fonts and eases), so a
passed class overrides the primitive's default instead of conflicting with it.
When you add a token to `globals.css`, add it to `lib/cn.ts` too.
Watch the order of font-size and leading classes: tailwind-merge treats a font size as also
setting line-height, so a `leading-*` that comes *before* a `text-*` size in the same `cn()`
call is dropped. Put the size first.

### `<Pill color>`
A rounded highlight behind a word or phrase. Inherits the parent's font size and wraps cleanly across lines.
`color`: `red | maroon | white | iris | dark | raised` (default `white`). Text colour follows §1 "Text on colour" (warm white on everything but `white`). Keep `red` to one pill per headline.
```tsx
<h2>We build robots that <Pill color="red">think</Pill>.</h2>
```
`reveal`: a non-wrapping variant built from layers (`data-pill-bg`, `data-pill-word`, and a light copy `data-pill-ghost`) for a highlighter reveal. Animate it with `pillReveal(pill, timelineVars)` from `@/components/ui/pill-reveal`: the background grows from the left (scaleX 0 → 1, 0.9s expo.out) and the word turns from light to its on-colour text exactly where the background has reached. It renders in its final state, so skip the animation under reduced motion. The pill is 0.1em taller than the line box (negative margin, so line spacing is unchanged); use line-height ≥ 1.1 where pills stack.
```tsx
<h2>Things that <Pill color="raised" reveal>move</Pill>.</h2>
tl.add(pillReveal(el.querySelector("[data-pill]")!), 0.15);
```

### `<MonoLabel>`
The technical label style. Props: `index?: number | string` (numbers are zero-padded: `1` gives `[01]`), `tone?: muted | text | red | white` (default `muted`), `as?` (element, default `span`), `id?`.
```tsx
<MonoLabel index={1}>About the club</MonoLabel>
```

### `<GridBackground>`
Faint 80px grid lines (`--grid`) plus 4 small corner brackets.
Props: `fixed` (default `true`, so it covers the viewport and brackets sit at the viewport corners; `false` fills the nearest positioned parent), `size` (80), `brackets` (true), `fade` (radial edge fade, false). Always `pointer-events: none`, `-z-10`.
Panning: the lines layer (`[data-grid-lines]`) offsets its background by the CSS variables `--grid-x` / `--grid-y` (px, default 0). **Dev pages only** (`/lab`, `/lab/robot`, `/lab/drone`): the site itself has no grid (§4).

### `<IrisButton>`
The primary action. Deep red pill (`--red`) with warm white text. On hover/focus the fill darkens to `--red-deep` inside a 1px `--red` rim (a lit edge, no glow). Use **one per view**.
Props: `href` (renders Next `Link`, or `<a target=_blank>` for external/mailto links), otherwise a `<button>`; `size: sm | md | lg`; `arrow` (adds an ↗ that nudges on hover).

### `<PillButton>`
Secondary pill. `variant: light` (light fill, dark text, e.g. the navbar "Contact") or `ghost` (transparent, `--line` border). Same `href`/`size`/`arrow` API as IrisButton.

### `<Capsule>`
Tall, fully rounded rectangle used as a decorative parallax shape. Size it with `className` (default `w-20 h-56`, `md:w-28 md:h-80`).
Props: `tone: red | white | maroon | iris | iris-line | raised | outline | glass | haze` (`iris-line`: raised fill with a 1px `--iris` border; `haze`: near-white at 6%, a faint light shape, cheaper than `glass` because it has no blur), `speed` (parallax factor; the shape travels `speed × 120px` each way while crossing the viewport; negative moves against scroll; `0` is static), `rotate` (deg), `children` (e.g. an image clipped to the capsule). Parallax is a scrubbed ScrollTrigger and is off under reduced motion.

### `<DotGrid rows cols>` and `<CrossMark>`
Small decorative SVGs coloured by `currentColor` (default `text-muted`, so tint with a text class).
- `DotGrid`: `rows` (3), `cols` (3), `size` (dot diameter, 3px), `gap` (centre-to-centre, 12px).
- `CrossMark`: `size` (12px), `strokeWidth` (1.25px).

### `<RotatingBadge items>`
A circular text badge: `items` in mono caps around a ring, each followed by `*` and spread evenly over the whole ring (SVG `textPath` with `textLength`), a faint inner ring and an x in the centre. Colour follows `currentColor` (default `text-text`); size it with `className` (default `size-36`, `md:size-44`).
Props: `items: string[]`, `period` (seconds per turn at rest, 20), `label` (accessible name; without it the badge is `aria-hidden`).
Motion: one turn per `period`; scrolling multiplies the speed by up to 8× (scroll speed / 450px/s), easing back over about a second. Paused while off screen. Static under reduced motion.
```tsx
<RotatingBadge items={[settings.club_name, "Senior Core", "2026"]} />
```

### `<Accordion items>` (client)
Questions on hairlines that open one at a time or together: each question is a button (`aria-expanded`) with a round
+ that turns into a red ×; its answer opens by its grid row going from `0fr` to `1fr` while it fades in (500ms power3),
and is `inert` while closed. Props: `items: { q, a }[]` (`a` can be any node), `defaultOpen` (indices, default `[0]`).
Used by the /contact and /join FAQs. Instant under reduced motion.
```tsx
<Accordion items={[{ q: "Who can apply?", a: "Any student." }]} />
```

### Utilities (`globals.css`)
`mono-label`, `bg-iris`, `iris-border`, `shell`, `px-gutter`, `pt-header`.
`paper` (warm white `--text` with a faint grain: gallery pages, caption tags) and `paper-ruled` (the same with faint grey
rules every `--rule`, default 2rem, and a red margin line: note pages). Gallery only (§14).
Animations: `animate-rise` (letters rising out of a mask) and `animate-nudge` (a nudging arrow; unused since the home scroll hint was removed), see §7 "First-load entrances"; `animate-grow-x` (scaleX 0 → 1, 5s linear, `both`; the slider's active indicator, which sets its duration inline and advances on `animationend`); `animate-fade-up` (opacity 0 and 12px down → in place, 0.9s power3.out, `both`; small first-load labels, staggered with `animation-delay`); `animate-letter-in` / `animate-letter-out` (the /projects title's letters: in from translateX(−110%) over 0.7s expo, out to translateX(110%) over 0.45s `cubic-bezier(0.7, 0, 0.84, 0)`; in vertical text, local x is "up", §16).
The /events first load (§17), all `both`: `animate-wipe-in` (a left-to-right `clip-path` wipe with a fade, 0.8s expo),
`animate-settle` (scale 1.08 → 1, 0.8s expo), `animate-pop-up` (opacity 0 and 40px down → in place, 0.8s expo) and
`animate-slide-up` (opacity 0 and 20px down → in place, 0.6s power3).
Ambient loops (always with `motion-reduce:animate-none`): `animate-float` (±2.5px up and down, 4s), `animate-breathe` (scale 0.98 ↔ 1.02, 6s), `animate-orbit` (one turn per 40s, linear) and `animate-pulse-soft` (scale 0.85 ↔ 1.15 with opacity, 1.8s). The /about hands use all four (§15).
/contact (§20): `animate-planet-rise` (25vh up into place, 1.6s expo, `both`), `animate-rim` (fades in over 1.6s, then
breathes 1 ↔ 0.85 every 5s), `animate-streak` (a light along the rim every 8s, from the registered `--streak` angle) and
`animate-twinkle` (a star dims to a quarter of its `--o` and back). The looks are utilities: `contact-dots` (faint dot
texture), `contact-planet` (the surface), `contact-rim` (the 2px edge and its glows) and `contact-streak` (the masked
conic light).
/join (§21): `animate-crowd-in` (the crowd fades in and rises 30px as one layer, 1.2s power3.out, `both`).
Note: a `var()` inside an `--animate-*` value resolves once, on `:root`, so per-element timing goes in inline
`animation-delay` / `animation-duration`.

---

## 6. Global layout (`app/layout.tsx`)

Order: inline no-flash script, skip link, `<Providers>` → `<Header>` → `<main id="main">` → `<Footer>` → `<Cursor>`.

- **Announcement bar** (`components/layout/AnnouncementBar.tsx`): text, link and on/off come from `settings` (`announcement_enabled`, `announcement_text`, `announcement_link_label`, `announcement_link_url`). Dismissible: the dismissal is stored in `localStorage` against a hash of the text and link, so a new announcement shows again. An inline script in the layout sets `html[data-ann="off"]` before first paint, which hides the bar and sets `--ann-h: 0`. It collapses once the page is scrolled past 40px or the menu is open.
- **Navbar** (`Header.tsx`): fixed and transparent. After **40px** of scroll it gains a blurred `bg-2/75` background and a bottom hairline. Logo top-left (short name below `sm`). Right side: "Join us" `IrisButton` → `/join`, "Contact" light `PillButton` → `/contact`, round menu button.
- **Menu overlay** (`MenuOverlay.tsx`): full-screen, below the header (z-40 vs z-50) so the menu button becomes the close button. Lists Home, About, Members, Projects, Events, Achievements, Gallery, Join, Contact (`lib/nav.ts`) in large Sora (names only, no numbers), staggered in (0.05s apart, expo.out). Locks scroll (stops Lenis), makes `main` and the footer `inert`, focuses the first link, closes on Escape, link click or route change, and returns focus to the menu button. The current page gets a red dot.
- **Custom cursor** (`Cursor.tsx`): fine pointers only (`(hover: hover) and (pointer: fine)`), never rendered on touch. A 6px dot plus a 36px ring that lags (`gsap.quickTo`, 0.5s power3.out). States via attributes:
  - `data-cursor="view"` / `"drag"`: the ring becomes a light pill labelled VIEW / DRAG (`data-cursor-label="…"` overrides the label)
  - `data-cursor="link"`: the ring grows to a 56px soft filled circle. Links and buttons get this automatically.
  - `data-cursor="none"`: hides the custom cursor. Text inputs hide it and keep the native text cursor.
  The native cursor is hidden only while `html[data-custom-cursor]` is set.
- **Footer** (`Footer.tsx`): tagline and email, quick links (Explore / Club), socials (Instagram, LinkedIn, GitHub, email from `settings`) and the club wordmark scaled to span the full width (`FitText`). No copyright line or dot grid.
- **Route transition** (`app/template.tsx` → `PageTransition`): page content fades in and rises 12px (0.6s power3.out) on client navigations. The first server-rendered page is not animated (its HTML must be visible before JS), and nothing animates under reduced motion.

---

## 7. Motion

### Libraries: which one for what
- **GSAP + ScrollTrigger**: anything scroll-linked (reveals, scrub, pinning, parallax) and multi-step timelines. Always import from `@/lib/gsap`, and use `useGSAP` (it cleans up automatically) with `scope`.
- **Motion (Framer)** (`motion/react`): mount/unmount presence (`AnimatePresence`), such as the menu overlay and route transition, and simple state-driven UI.
- **CSS transitions**: hover/press micro-feedback.
- **CSS keyframes**: first-load entrances above the fold only (see below).
- **Lenis**: smooth scrolling only.

### Lenis + GSAP sync (`components/providers/SmoothScroll.tsx`)
```ts
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);
```
Get the instance with `useUIStore((s) => s.lenis)` (null when off). Use `data-lenis-prevent` on nested scroll areas. Never set `scroll-behavior: smooth` in CSS.

### House easing and durations
| Use | GSAP | Motion | CSS (Tailwind) |
| --- | ---- | ------ | -------------- |
| Default | `power3.out` (`EASE.out`) | `BEZIER.out` | `ease-power3` |
| Big moves (overlays, hero type, pinned sequences) | `expo.out` (`EASE.expo`) | `BEZIER.expo` | `ease-expo` |

- Entrances, reveals and scroll motion: **0.6–1.2s** (`DURATION.fast` 0.6, `.base` 0.9, `.slow` 1.2). GSAP defaults are set to `power3.out` / 0.9s in `lib/gsap.ts`.
- Exception: hover/press micro-feedback (colour, border, small nudges) uses **0.35s** (`DURATION.micro`, `duration-[350ms]`), because 0.6s feels laggy on hover.
  Senior Core's portraits are the one slower hover: black and white to colour over **600ms** (a deliberate, slow reveal, §13).
- Exception: the **Junior Core accordion** (§13, `JUNIOR_CORE_MOTION` in `TeamAccordion.tsx`) resizes its cards over
  **550ms** with **`cubic-bezier(0.22, 1, 0.36, 1)`**, because the design specifies that curve and timing. It covers the width
  (desktop) or height (phones) together with the radius, plus the glow, the iris ring, the portrait filter and the portrait/avatar
  moving. Text follows the same curve: the details fade in and rise 8px over 450ms, **starting 150ms after the resize ends**
  (a 700ms delay); on collapse they leave at once (120ms, no delay); the closed card's labels come back after 250ms over 350ms.
  Hover opens a card after an 80ms intent. The delays use `motion-safe:`, since the reduced-motion CSS cuts durations, not delays.
  Nothing else uses this curve or timing.
- Exception: the **gallery journal fan** (§14) moves on a Motion **spring** (`FAN.spring`: stiffness 150, damping 23), not a
  timed tween, because drags and flicks hand it their velocity. The lightbox's button zoom eases over 350ms (`ease-power3`).
- Exception: the **/projects reel and strip** (§16) follow their target with an exponential lerp (`REEL.follow`: 7 per
  second), not a tween, so drags, wheels and flicks blend. The reel ↔ gallery flight is **1.1s `expo.inOut`** (the spec's
  timing; reversing mid-flight takes the remaining share, at least 0.35s). The title's letters swap 25ms apart (§5
  `animate-letter-in/out`).
- Exception: the **drone** flies on a damped spring rather than tweens, so targets, the cursor and stunts blend; its tilt,
  yaw and effects ease with exponential damping. The home sidekick (§12) uses stiffness 30 (darts 85, stunts 60, damping
  ratio 0.8, in 1/60s substeps) and follows Catmull-Rom curves (`easeInOutSine` along the curve); the /lab/drone bench
  (§18) uses `FLIGHT` (stiffness 14, damping 0.82). Stunts take 1–2s (cubic in-out).
- Exception: the **/events entrance** (§17, `EVENTS_MOTION` in `lib/events.ts`) follows the spec's offsets: banner 0.8s
  expo, cutout at +150ms, title letters at +300ms (**30ms** apart), details at +550ms, thumbnails at +650ms (**40ms**
  apart). The old event leaves in **250ms**. The thumbnails widen over 500ms, and the background tint crossfades over
  900ms (linear).
- Exception: the **/achievements slider** (§19, `ACH_MOTION` in `lib/achievements.ts`): a card grows into the background
  over **1.1s `expo.inOut`**, the other cards slide one slot over 0.9s `expo.inOut` (**60ms** apart), the old text leaves in
  **300ms**, the new title lines rise **80ms** apart and the details fade up **50ms** apart.
- Exception: the **/contact hero** (§20, `CONTACT_MOTION` in `lib/contact.ts`): the planet rises over **1.6s** expo and its
  text starts at **300ms** (the headline's words **60ms** apart); the rim breathes over **5s** and a streak runs along it
  every **8s**; the glow follows the cursor on a 1.4s `quickTo`. The FAQ answers open over **500ms** power3.
- The **/join hero** (§21, `JOIN_HERO` in `lib/join.ts`) is deliberately quiet: its text fades up 12px **60ms** apart
  from 120ms, and the crowd fades in and rises 30px as one layer over **1.2s** from 360ms; on scroll it moves at
  **0.85×** the page and fades.
- Stagger siblings by **0.06s** (`STAGGER`); long lists (menu) use 0.05s.
- Scrubbed tweens use `ease: "none"`. Exception: the **/about hands** (§15) close in on `1 − (1 − t)^2.5` over the first 65% of their
  pin, so they are fast at first and settle into the close-up without a sudden change of speed; the touch uses `sine.inOut`.
- Scroll triggers: reveal at `start: "top 80%"`.

### First-load entrances
Entrances that play when the page first appears (the hero letters) run as CSS
keyframes, so they start from the server HTML without waiting for JS and the
text is never hidden behind hydration. Use the `animate-rise` utility
(translateY 110% → 0, 1.2s expo.out) inside an overflow-clipped line, stagger it
with an inline `animation-delay`, and always add `motion-reduce:animate-none`
(the global reduced-motion rule shortens durations but not delays).

### Pinning and scroll timelines
- Create the pin's ScrollTrigger before any trigger below it, in the same `useGSAP`.
- Don't use a pinned element as the trigger of another ScrollTrigger: its start is pushed back by its own pin length. Trigger on a wrapper instead (`HomeScroll` does this).
- A timeline whose phases start at exact scroll positions can use px of scroll as its time unit, with `end: "+=" + tl.duration()`. Rebuild it when the measured sizes change (`HomeScroll` watches them with a ResizeObserver and uses `revertOnUpdate`).
- Measure section positions before creating the pin (the pin's spacer moves everything below it): `HomeScroll` stores each section's top and adds the pin length.
- A pinned layer that must sit **between** fixed layers (the lab: photos below the robot's stage, the card above it) uses CSS `position: sticky`, not a GSAP pin, because a GSAP pin wraps it in a spacer and pins it with `position: fixed`. The sticky layers' section must not create a stacking context (no transform, opacity, filter or z-index on it) so their z-index competes with the stage's.
- ScrollTriggers created by child components (`ScrollTilt`, `CountUp`) set `refreshPriority: -1` so they refresh after the pins above them, and `HomeScroll` calls `ScrollTrigger.refresh()` once it has built.
- GSAP folds an element's CSS `translate` (every Tailwind `translate-*` class) into its own transform the first time it tweens
  a transform there, converting the value to px; tweening `x` then replaces it. Keep a CSS pose (`-translate-1/2`, a vw
  start offset) on a wrapper and tween an inner element (the /about hands, title and glow do this).
- Horizontal sections: pin a viewport, tween its track's `x` with `ease: "none"`, and give animations inside it `containerAnimation` (Senior Core, §13). If anything jumps the scroll instantly (arrow keys, drag), set `snap.inertia: false`, or the jump reads as a huge flick and the snap throws several steps ahead.

### Reduced motion: the rule
When `prefers-reduced-motion: reduce` is set:
1. **No Lenis.** SmoothScroll does not create an instance.
2. **No pinning.**
3. **No scrubbed animation** (including parallax).
4. **Show final states.** Elements render where they end up; no entrance animation, no stagger, no route transition.

How to comply (every animated component must check):
```tsx
import { useReducedMotion, prefersReducedMotion } from "@/hooks/use-reduced-motion";

const reduced = useReducedMotion();          // render logic
useGSAP(() => {
  if (prefersReducedMotion()) return;        // synchronous check inside effects
  gsap.from(...);
}, { scope, dependencies: [reduced] });      // re-run if the OS setting changes
```
The synchronous check is needed because the hook returns the server value
(`false`) on the very first client render. A component that builds different
things per breakpoint can use `gsap.matchMedia()` with a
`(prefers-reduced-motion: reduce)` condition instead; it rebuilds by itself
when either changes (`SeniorCoreTrack` does this). It calls back only while **at least one** condition
matches, so give it complementary width conditions (`phone` and `desktop`), or the case where none match (a phone
with motion) builds nothing (`HandsScroll` does this). Motion components: pass
`initial={reduced ? false : {...}}`; `MotionConfig reducedMotion="user"` is
also set globally as a safety net. `globals.css` cuts all CSS transitions and
keyframes to ~0ms under reduced motion.

Reference implementation: `components/lab/MotionDemos.tsx` (`RevealDemo`).

---

## 8. Data

- Row types for every table in `lib/types.ts`: `members`, `teams`, `projects`, `events` (`ClubEvent`), `achievements`, `gallery_items` (`GalleryItem`), `milestones`, `partners`, `contact_messages` (`ContactMessage`), `settings` (single row). Columns are snake_case so generated Supabase types can replace them.
- `members`: `tier` (`senior` = Senior Core, `junior` = Junior Core, shown grouped by team, `member`), `sort_order` (display order within the tier), `kicker` (short role line, "The President"), `quote` (max 140 characters), `bio`, `photo_url`, `focal_point` (where a cropped portrait is anchored: a CSS `object-position` value, default `DEFAULT_FOCAL_POINT` = `"50% 30%"`), `cutout_url` (optional transparent PNG of the person, for Senior Core's cutout spread), `socials` (jsonb: `{ linkedin, github, instagram }`, each a URL or null).
  - Limits are per tier in `MEMBER_LIMITS` (`lib/types.ts`): quote 140 for every tier; bio **300** for seniors (and `member`), **160** for juniors. The mock throws if a row breaks its tier's limit.
  - The mock has 8 seniors with placeholder portraits; `/members/cutout-1.png` is a generated placeholder figure, not a real cutout. It also has 33 juniors across all 7 teams: Tech has 10 (so its accordion wraps onto a second line), Manav Arora (Tech) and Aditya Rawat (PR) have no photo (initials avatar), and a few set a non-default `focal_point`. Replace the photos with real ones.
- `settings.founded_year` feeds the "years running" count (the mock value is a placeholder).
- `settings.recruitment_open` switches the home join card between "Apply now" and "Get notified"; `settings.open_teams` (team names) lists the teams taking applications.
- `settings.contact_phone` (null hides the row), `settings.lab_address` and `settings.map_query` (what the map searches
  for: a place name or "lat,lng") feed /contact (§20). The mock phone and lab room are placeholders.
- `events.tags` (string array) are shown as pills on the home event section and in the /events details line.
- `events` for /events (§17): `status` (`upcoming` | `past`), `banner_url` (16:9), `cutout_url` (optional transparent PNG
  of the banner's subject, framed by the cutout convention in §17), `banner_focal_x` (0–100, where the banner is
  anchored horizontally when the card crops it, default 50) and `accent_color` (optional; without it the page samples
  the banner's dominant colour and snaps it to red or maroon, §17). The mock has 6 events (2 upcoming, 4 past) with generated placeholder banners and
  cutouts in `/public/events/`; replace them with real art. `projects.tags` decide which lab station a project's photo appears at (a tag equal to the station's domain, any case: `Drones`, `Robotics`, `IoT`, `Research`), and which /projects filter shows it (§16).
- `projects`: `slug`, `title`, `year`, `status`, `tags`, `summary` (the one-line "short description"), `description`, `cover_url`, `images` (jsonb array of `{ url, width, height, alt }`, 4–10 per project; the gallery strip and the phone page show the cover first, then these), `member_ids` (the team; `getProjectsWithTeam()` resolves them to names as `team`), `repo_url` (optional: the "Source code" button shows only when set), `is_featured`. The mock has 12 projects (the home lab shows up to 3 per station), with picsum photos in five shapes.
- Mock rows in `lib/mock/*.ts`. Image URLs are `picsum.photos` placeholders (allowed in `next.config.ts` `images.remotePatterns`, along with `*.supabase.co` storage).
- **Pages and components read data only through `lib/data.ts`** (`getSettings`, `getTeams`, `getMembers`, `getSeniorCore`, `getJuniorCore`, `getProjects`, `getEvents`, `getAchievements`, `getGalleryItems`, `getMilestones`). Switching to Supabase means changing those function bodies only.
- Derived reads: `getJuniorCoreByTeam()` (juniors grouped by team, in the teams' order, teams without juniors left out), `getFeaturedProjects()` (`is_featured`), `getUpcomingEvent()` (the earliest event with `starts_at` in the future, or `null`) `getHomeStats()` (members, projects, events that have started, years since `founded_year`) and `getMissionStats()` (the /lab/drone bench's dashboard, §18: members and their running total by joining year, from `year` of study and the Senior Core term; projects per lab domain; this year's events, done and coming; the next event; workshops that have run (type `workshop`, started) and the next one; competitions won = achievements whose `result` is a podium, `PODIUM` in `lib/mission.ts`). The last three depend on the current time, so they use `cacheLife("hours")`.
- `gallery_items`: `event_id`, `type` (`photo` | `video`), `url` (null for a note), `poster_url` (videos), `caption`,
  `alt`, `width` / `height` (null for notes), `layout_group`, `sort_order` (the spec's "order"; every table here uses
  `sort_order`), `taken_at`. How they become journal pages is in §14. The mock has four journals (Tech Expo 2025, Hack the
  Hardware, Build Night: October, 22–28 items each; ROS from Zero, 10 items): picsum photos and posters, and two CC0 sample clips from MDN
  (`interactive-examples.mdn.mozilla.net`, not the club). Replace them with real files.
- Project reads: `getProjectsWithTeam()` (every project with `team`, the member names) and `getProject(slug)` (one, or null).
- Gallery reads: `getJournals()` (the shelf: events with gallery items, newest first, with page, photo and video counts) and
  `getJournal(slug)` (`{ event, items, pages }`, or null).
- Event reads: `getEventShowcase()` (every event with `photos`, its photo gallery items that have a file, and
  `has_gallery`; upcoming first, soonest first, then past, newest first).
- `achievements` (§19): `slug`, `title` (short: it is set huge, in two lines), `result` ("Winner", "1st Runner-up",
  "Best Paper"; `isWin()` in `lib/achievements.ts` picks the red badge), `category` (`competition` | `research` | `other`;
  the page filters on the first two), `event_name`, `location`, `date` (`YYYY-MM-DD`), `description` (max **200**
  characters, `ACHIEVEMENT_DESCRIPTION_MAX`; the mock throws past it), `team` (member names, as text), `image_url` (a
  landscape photo, required: it becomes the full-screen background), `link` (optional: certificate or paper) and
  `sort_order` (newest first). The mock has 6 rows with generated placeholder photos in `/public/achievements/`
  (1920×1080, graded into the palette); replace them with real photos.
- `milestones`: `year`, `title`, `description` (one line), `sort_order` (oldest first). The /about timeline (§15) reads them
  with `getMilestones()`. The mock's seven rows are placeholders (2019–2026); replace them with the club's real history.
- `partners` (§20): `name`, `logo_url` (a light logo on a transparent background, about 5:1), `url` (optional),
  `sort_order`. `getPartners()` reads them; none hides the /contact logo row. The mock's five are made-up names with
  generated logos in `/public/partners/`; replace them with the real partners and sponsors.
- `contact_messages`: `name`, `email`, `subject` (`general` | `join` | `collaboration` | `sponsorship` | `workshop` |
  `other`), `message` (max 1000), `created_at`.
- `applications` (§21): `reference` (shown to the applicant, "IOTR-26-4F7K"), `name`, `phone`, `email` (the college's
  domain, `COLLEGE_EMAIL_DOMAIN`), `year`, `branch`, `team` (`teams.slug`), `skills`, `why`, `linkedin`, `github`
  (optional), `resume_path` (Supabase Storage), `created_at`. A team is hiring when `settings.recruitment_open` and it
  is in `settings.open_teams` (`isHiring` in `lib/join.ts`).
- `getUpcomingWorkshop()`: the next workshop that hasn't started (the /contact badge while recruitment is closed;
  `cacheLife("hours")`).
- Writes: `addRecruitmentSubscriber(email)` (a mock no-op for now), called only from the server action `notifyWhenRecruiting` in `lib/actions.ts`, which validates the email.
  `addContactMessage(message)` (the mock keeps it in server memory after a 700ms pause; Supabase: an insert into
  `contact_messages`), called only from `sendContactMessage` in `lib/actions.ts`, which validates with the same zod
  schema as the form and quietly drops submissions that fill the honeypot.
  `addApplication(input, resume)` (the mock keeps the row in memory and records the file's name and size; Supabase:
  upload to Storage, then insert), called only from `submitApplication` in `lib/actions.ts`, which re-checks the schema,
  the resume (PDF / PNG / JPG / WebP, at most 5MB) and that the team is hiring. Server actions accept bodies up to
  **6mb** (`experimental.serverActions.bodySizeLimit` in `next.config.ts`) for that upload.

---

## 9. Next.js 16 notes

- `cacheComponents` and `partialPrefetching` are on. Data functions in `lib/data.ts` are marked `'use cache'`; keep that when they start querying Supabase, so the layout stays in the static shell. Read cookies/headers outside cached functions and pass values in.
- In shared layouts, a client component that calls `usePathname()` must sit inside `<Suspense>` once routes with dynamic params exist, unless it only renders after user interaction (as the menu panel does).
- A static page that reads the query string on the client (`useSearchParams`, as /join/apply does for `?team=`) wraps
  that component in `<Suspense>` with a fallback the size of the content; the rest of the page stays prerendered.
- Dynamic routes: await `params` inside a `<Suspense>` boundary, even when `generateStaticParams` lists every value.
  - Use a small async child, as `app/projects/[slug]/page.tsx` and `app/gallery/[slug]/page.tsx` do.
  - Otherwise the dev overlay's instant-navigation check reports the route as blocking a client navigation
    (`instant-shell-url-data`).
  - `notFound()` still works inside the boundary.
  - Give the boundary a fallback the size of the content (the journal's is an `h-svh` block), so the footer never flashes up.
- Time-dependent values: cached functions that read `Date.now()` set a short `cacheLife`; client clocks (the event `Countdown`) use `useSyncExternalStore` with a `null` server snapshot, so the static shell never bakes in a time and hydration doesn't mismatch.
- Read `node_modules/next/dist/docs/` before using an unfamiliar Next API; this version differs from older docs.
- Route types (`LayoutProps`, `PageProps`) are generated: run `npx next typegen` if `tsc` can't find them.

---

## 10. Do / don't

- Do use tokens and Tailwind theme classes; don't add hex values or arbitrary colours.
- Do keep `--iris` rare; don't use it as a background.
- Do use `MonoLabel` / `mono-label` for technical labels; don't hand-roll mono styles.
- Do keep Bodoni Moda to the Senior Core section and Caveat to gallery captions and notes.
- Do check `useReducedMotion` / `prefersReducedMotion` in every animated component.
- Do test at 360px; no horizontal scroll, ever.
- Do add `data-cursor="view"` to clickable media and `data-cursor="drag"` to draggable carousels.
- Do drive the robot through `useBotStore`, `botActions` and `botTransform`. Don't mount more than one `<BotStage>` per page, and don't mirror `botTransform` in React state.
- Do give a section's robot state with `botActions.hold(id, face, icon)` and drop it with `release(id)`; don't set `face`/`icon` directly while the mood engine runs (it overwrites them).

---

## 11. Robot mascot (`components/robot`)

ClubBot is the club's own robot, built from three.js primitives in code:
- a matte graphite head with a dark metal bezel lit by a slow maroon → red sheen, around a glossy black screen;
- cylinder ears, with an antenna and a deep red "online" LED on its right ear;
- a narrower torso with the matte black logo chest plate and three LEDs (one red, two dim maroon);
- two-segment capsule arms with ball joints and mitten hands, and short legs;
- dark metallic grey joints and limbs;
- a hexagonal dock with faint maroon and red circuit traces, which the robot floats above.

The face on the screen is warm white. Red is kept to details (bezel, LEDs, traces, the rim light), never the whole robot.

Size: about 2.4 units tall, with the head about 45% of the height. About 14k triangles (budget: 60k).

**"Right" always means the robot's own right** (screen left). The antenna and the waving arm are on that side.

### Using it

```tsx
import { BotStage, useBotMood, botActions, botTransform } from "@/components/robot";

<BotStage />                                  // once per page: fixed, full viewport, pointer-events:none, z-30
useBotMood();                                 // optional "brain": moods, blinks, reactions (see "Mood engine")
botActions.setFace("happy");                  // idle | blink | happy | surprised | sleepy | wink | look-left | look-right
botActions.setIcon("drone");                  // icon instead of eyes (null = face)
botActions.wave(); botActions.nod(); botActions.bootUp();
botActions.lookAt([2, 1.8, 2], 2500);         // world point, hold ms
botActions.glow(ACCENTS.red);                 // brief bezel tint + brighten, then eases back
botActions.react("happy", 900);               // face for holdMs, above moods and reactions (needs useBotMood)
botActions.hold("lab", "idle", "drone");      // a section's resting face/icon instead of random moods (needs useBotMood)
botActions.release("lab");                    // back to random moods (only if "lab" holds it)
botActions.track(true);                       // lookAtCursor
gsap.to(botTransform, { x: 1.2, scale: 0.8, scrollTrigger: { /* ... */ } });
```

- **Non-fixed stage:** `<BotStage fixed={false} />` fills the nearest positioned parent instead; the lab does this, and the home page puts it inside its own fixed box (§12).
- **Layering:** override the layer with `className`, e.g. `-z-[5]` to sit behind content.
- **Props:**
  - `logoUrl` (default `/logo.svg`) and `bootOnMount` (default true);
  - `transform`: initial `botTransform` values for this page (applied before paint, so the server-rendered poster is already in place; reset on unmount);
  - `interactive` (default true): an invisible, focusable `<button>` over the robot. Hover sets `hovered`; click, tap or Enter calls `poke()`. It is positioned every frame from `botScreen` (the head and body projected to stage pixels), so it follows the robot wherever `botTransform` puts it;
  - `label`: the hit button's accessible name (default "Say hi to the robot");
  - `preloadPoster` (default: same as `fixed`): preload the poster for an above-the-fold stage;
  - `sidekick` (default false): the home sidekick drone flies in this canvas (§12; 3D only, so never with the poster).
- **`<ClubBot />`** (`@/components/robot/ClubBot`) is the robot itself, for use inside your own R3F `<Canvas>`. It pulls in three.js, so the barrel `@/components/robot` deliberately does not export it.
- **`<BotHeadIcon icon label? />`** (`@/components/robot/BotHeadIcon`): a flat drawing of the head (iris sheen bezel, black screen, ears) showing a screen icon, or the eyes when `icon` is null. Plain SVG/CSS and server-compatible; use it where the 3D robot isn't shown (the stacked lab stations). Size it with `className` (default `size-11`); decorative unless you pass `label`.

### State

- **`useBotStore` (zustand):** `{ face, icon, lookAtCursor, gesture, glowColor }`, plus the setters `setFace`, `setIcon`, `setLookAtCursor`, `setGesture(name, {point, holdMs})` and `setGlowColor`.
  - `setFace("blink")` is momentary and keeps the current face.
  - Setting a face clears the icon.
  - `ambient` (default true): ClubBot runs its own blinks and idle moves. The mood engine turns it off and drives them itself.
  - `asleep`: the head droops slowly (3.2s), tracking fades out and the screen dims; waking takes 0.7s.
  - Also: `idleMove` (`setIdleMove("tilt" | "glance", dir)`), `flash()` (the bezel flashes brighter), `poke()` (`pokeKey`), `hovered`, and `booting` (true while bootUp owns the screen).
  - `react(face, holdMs)` sets `reaction`; the mood engine plays it (see "Mood engine").
  - `scene` (`{ id, face, icon }` or null, set with `setScene`, or `botActions.hold` / `release`): a resting state held by a page section; the mood engine shows it instead of random moods.
- **`botInput`:** mutable inputs from the brain, read every frame: `pitch` (extra head pitch in radians, used for scroll) and `gaze { x, y, active, slow }` (a look target in -1..1 when there is no cursor, e.g. touch wander or device tilt).
- **`botScreen`:** written by ClubBot every frame: the robot's on-screen box in stage pixels (`x, y, w, h, valid`). The hit area uses it.
- **`botAnchors`:** written by ClubBot every frame: the head's centre, the screen's front and the top of the head, in world
  units (`head`, `face`, `top`, plus `scale`), so something in the same scene (the home sidekick, §12) can orbit, boop or
  sit on the head as it turns and droops.
- **`botInput.look`** `{ x, y, z, active }`: a world point the head follows while active, above the cursor (below an explicit
  `lookAt`). The sidekick sets it during its stunts near the robot.
- **`botActions.nudge()`:** counts as visitor activity for the mood engine: it wakes the robot and restarts its sleep timer.
- **`botTransform` `{ x, y, z, rotX, rotY, scale }`:** a plain mutable object in world units and radians, read every frame in `useFrame`.
  - Tween it with GSAP.
  - Cursor tracking and idle moves turn the head relative to the body, so they add on top of whatever `botTransform` does (scroll sets the base pose, the cursor adds head rotation).
  - Never put per-frame values in React state.
  - The lab and `<BotStage transform>` reset it on unmount.
- **`botActions`:** the same calls as plain functions, safe to call before the robot mounts.

### Behaviour

| What | Rule |
| --- | --- |
| Float | ±0.03 units, 3s sine (the dock stays still) |
| Blink | every 2.5–5s, 0.16s, open-eyed faces only, no glitch (ClubBot's own timer runs only while `ambient`) |
| Idle move | every 6–10s: a head tilt up to 10° or a side glance (head and eyes); glances only when not tracking |
| Cursor | window `pointermove`, damped (never snaps); max 25° yaw / 15° pitch; body follows at 30% |
| Eyes | shift on the screen towards the cursor, up to 12% of the screen width (7% vertically), so the robot still looks at you when the head is at its limit (screen texture offset, no redraw) |
| Cursor leaves window | the head looks past the exit edge for 2s, then returns |
| Asleep | the head droops and rolls slightly, tracking and float fade out, screen and bezel dim |
| Face change | 120ms glitch (a red / warm white split + 2 displaced scanlines) on the old face, then the new one |
| Antenna | deep red pulse every 2s |
| wave | robot's right arm up, forearm waves, head tilts, about 2.6s |
| nod | two dips, about 1.1s |
| bootUp | about 1.9s: screen off with the head slumped, then a scan line, a flicker, the face (with glitch), the head rising (expo), and the eyes opening. It ends on the store's `face` (the mood engine sets `happy`) |
| lookAt(point) | head turns to the world point for `holdMs`, then back |
| glow(color) | bezel tints to the colour over 0.25s, holds 0.35s, eases back over 1.2s (boost 1.6×, a flash, not neon) |

**Reduced motion:** final states only.
- **Dropped:** float, sway, ambient blinks, idle moves, cursor tracking, the sleep droop, wave/nod/bootUp, and the glitch.
- **Still works:** face and icon changes (instant), explicit blinks (`setFace("blink")`), `lookAt` and the glow.

In practice, visitors with reduced motion get the poster (see "Performance and fallback"), which blinks slowly, so this only matters inside your own canvas.

### Mood engine (`useBotMood`)

The robot's "brain". Mount it once next to `<BotStage>`. It writes to `useBotStore` and `botInput`, and ClubBot plays the result. Weights and timings are exported as `BOT_MOOD_WEIGHTS` and `BOT_MOOD_TIMING`. Pass `{ enabled: false }` to switch it off.

| What | Rule |
| --- | --- |
| Blink | its own timer, every 2.5–5s, never stops (also while asleep or reacting) |
| Random mood | every 4–8s: pick one, hold it 1.5–3s, then back to `idle`. Weights: idle 40, happy 20, look-left 10, look-right 10, wink 8, surprised 7, sleepy 5. Never the same pick twice in a row. Skipped while a reaction runs, while hovered, while asleep, or while a scene is held |
| Idle move | every 6–10s: a head tilt or a side glance |
| Scene (`botActions.hold`) | its face and icon replace the random mood (a change glitch-switches at once). Reactions play on top and return to it; but while the scene has an **icon**, only a click (poke) or a page cue (`react()`) replaces it, so sleep, wake, hover and fast-cursor reactions leave the icon on screen (the head still droops when asleep) |
| Icons | only from a held scene; otherwise the engine clears `icon` |

Reactions interrupt the random mood. Priority: leave-window 1, wake 2, click 3, `botActions.react()` 4 (page cues such as scroll moments, so they win while they play); a weaker reaction can't cut a stronger one.

| Visitor does | Robot does |
| --- | --- |
| Cursor very fast (smoothed speed over `max(2800, 2.2 × viewport width)` px/s) | `surprised` for 1s (3s cooldown) |
| Cursor still for 8s (mouse/trackpad only) | `asleep`: `sleepy`, and the head droops slowly |
| Moves again (pointer, scroll, wheel, key, click) | wakes: `surprised` 0.9s, then `happy` 1.6s |
| Cursor over the robot | `happy` while over it, plus a nod (3s cooldown) |
| Click or tap on the robot | `wink` 1.6s, wave, bezel flash |
| Cursor leaves the window | `look-left` / `look-right` towards that edge (`idle` for top and bottom) for 2s; ignored while asleep |
| Page scrolled | the head pitches down, up to 0.2 rad (full at 90% of a viewport) |
| Boot finishes | `happy` for 1.8s |
| Page calls `botActions.react(face, ms)` | that face for `ms` (home: `look-left` at 60% of the hero pin, `happy` for 0.9s as each statement pill appears, `surprised` for 0.9s when the featured slide changes) |

**Touch (no hover-capable pointer):** no sleep and no cursor tracking. The robot looks around by itself (a new target every 2.5–4.5s, slow damping). If the device reports `deviceorientation`, it follows the tilt instead, re-centring slowly. On iOS the permission prompt is requested on the first tap on the robot, because it needs a user gesture.

**Reduced motion:** no tracking, no moods and no reactions; only a slow blink every 5–9s.

### Home page

The home page's stage, placement, scroll choreography and scenes are in §12.

### Face

`face.ts` draws a 512×512 canvas, white on black, used as the screen's emissive map (the material tints it warm white). It **redraws only when something changes**: face, icon, blink step, glance or glitch frame.

Icons are stroked `Path2D`s from `icons.ts`, on a 24×24 grid: drone, robot-arm, wifi-chip, atom, calendar, quote, play and heart. Add an icon there and the store, renderer and lab pick it up.

### Performance and fallback

- **Lazy loading:** `BotStage` loads the canvas with `next/dynamic` (`ssr: false`), so three.js ships only to devices that render it.
- **Poster instead of WebGL:** `/robot-poster.png` (720×1000, transparent; the robot fills its height) is used when:
  - reduced motion is on,
  - WebGL is missing, or
  - `navigator.deviceMemory` is 4 or less.

  The poster is also in the server HTML and shows while three.js loads, then fades out. It follows `botTransform` (x, y, z and scale, not rotations) using the camera maths in `config.ts`.

  When the poster is the final mode, it blinks: `/robot-poster-blink.png` (same framing, eyes closed) shows for 140ms every 2.5–5s (5–9s under reduced motion).

  The current files are renders of this model (re-rendered for the black + red palette; the blink frame has the eyes closed). Re-render them if the materials change, framed the same way: front view, 2.4 world units = 1000px, camera centred on y = 1.2.
- **Rendering:** dpr `[1, 1.75]`. Rendering stops (`frameloop="never"`) when:
  - the stage is off screen,
  - the tab is hidden, or
  - `botTransform` has moved the robot out of the stage.
- **Lighting:**
  - drei `Environment` built from `Lightformer`s at low intensity (no HDR download);
  - key light upper left and a deep red rim light from behind (a thin red edge on the silhouette);
  - `ContactShadows` under the dock;
  - transparent background.

  The dock top is a Lambert (diffuse-only) material. A PBR top seen at this grazing angle turns into one red sheen from the rim light.
- **QA overrides:** `?bot=poster` forces the poster, and `?bot=force` skips the memory check.
- **`useBotSupport()`** returns the mode: `webgl`, `poster:reduced-motion`, `poster:no-webgl`, `poster:low-memory`, `poster:forced`, or `pending` before hydration.

### Files and the GLB swap

```
components/robot/
  index.ts      public API (no three.js)
  store.ts      useBotStore, botTransform, botInput, botScreen, botActions (incl. hold/release), BOT_FACES
  useBotMood.ts mood engine: blinks, random moods, visitor reactions, touch wander/tilt
  BotStage.tsx  stage, support check, poster (+ blink), hit area, visibility
  BotCanvas.tsx the <Canvas> (dynamic import target)
  BotScene.tsx  lights, environment, ClubBot, stats probe
  ClubBot.tsx   behaviour: idle, tracking, eye shift, sleep, gestures, face, glow, screen box
  geometry.tsx  PrimitiveRobot: meshes + materials, fills the rig
  rig.ts        BotRig: the contract between model and behaviour
  face.ts       FaceDisplay canvas renderer
  icons.ts      screen icons
  BotHeadIcon.tsx flat head drawing with a screen icon (no three.js)
  textures.ts   bezel sheen loop, circuit traces, chest plate
  palette.ts    robot material colours
  config.ts     camera, poster size, debug stats
```

To replace the primitives with a Blender or Spline `.glb`:
1. Write a component that loads the file and fills a `BotRig`. `rig.ts` lists what it needs:
   - nodes: `root`, `body`, `head`, `shoulder_L/R`, `elbow_L/R`;
   - materials: `screen`, `bezel`, `antenna_led`, `chest_led_1..3`;
   - the rest pose.
2. Render it instead of `<PrimitiveRobot>` in `ClubBot.tsx`. Nothing else changes.

The screen needs 0–1 UVs across its face, and the bezel's U should run around the frame.

### Robot palette (`palette.ts`)

These are material colours for the model, not UI tokens. Don't use them in UI.

| Part | Colour |
| --- | --- |
| graphite (body, matte: roughness 0.62, metalness 0.18) | `#424244` |
| joint (dark metallic grey: roughness 0.34, metalness 0.7) | `#232325` |
| plate (matte black) | `#161616` |
| screen | `#050505` |
| bezel (no iridescence; emissive sheen at 0.75) | `#121212` |
| dock | `#121212` / `#1E1E1F` |
| face (screen emissive) | `#F2F0EB` (= `--text`) |
| online LED | `#C62828` (= `--red`), unlit `#1A0707` |

Red and maroon come from `COLORS` in `lib/tokens.ts`. Lights: the rim lights and the environment's ring are `--red`.

---

## 12. Home page (`app/page.tsx`, `components/home`)

```tsx
<HomeScroll>                          // the hero pin, the one scroll timeline, robot scenes, statement reveals
  <HomeHero settings />               // A: the wordmark
  <HomeRobot />                       // the page's only <BotStage sidekick> (in a fixed box) + useBotMood()
  <Statement clubName />              // B
  <Lab projects />                    // C: "Inside the lab", four stations
  <Featured projects />               // D: featured slider
  {event && <UpcomingEvent event />}  // E: only when an event is in the future
  <Numbers stats />                   // F
  <JoinCard settings />               // G
</HomeScroll>
```

Data comes from `getSettings`, `getProjects`, `getFeaturedProjects`, `getUpcomingEvent` and `getHomeStats` (§8). Section labels: `[03]` featured, `[04]` event, `[05]` numbers, `[06]` join (the lab stations use `[01]`–`[04]`).

### Hero (`HomeHero`)
- 100svh, pinned for an extra **120vh** (60vh on phones).
- Wordmark: `club_name` split into two lines (all words but the last, then the last word), uppercase Sora 800, line-height 0.85, tracking -0.04em, line 2 indented `min(8vw, 7.2rem)` (5vw on phones).
- Wordmark size: `clamp(4rem, min(15vw, 30svh), 14.5rem)`; phones `min(16vw, 28svh)`. "ROBOTICS" is about 5.3em wide, so 18vw cannot fit a phone and a 15rem cap overflows the 1440 shell. Re-check at 360 and 1920 if the club name changes.
- Letters rise out of a vertical mask on load (`animate-rise`, 40ms apart from 150ms), alongside the robot's bootUp.
- Nothing else: the wordmark sits on plain black, with no corner labels, scroll hint or decorations (capsules, dot grids,
  cross marks).

### Robot stage (`HomeRobot`)
The stage box is fixed and z-30, so the robot stands in front of the page content (the lab card and the header sit above it). `HOME_ROBOT` makes the robot 70% of the stage height with its base at 88%, turned -20°. The box decides where that lands, so the server-rendered poster is already in place:
- **md and up:** from 32% of the width to the right edge, `min(100svh, 95vw)` tall, bottom-anchored, so the robot stands at 66% of the width, in front of line 2. On portrait tablets the box is shorter than the screen, so the robot can never go above its top; the lab and join poses account for this.
- **Phones:** full width, bottom 71.4svh, so the robot is 50svh tall, centred under the wordmark, its antenna just over line 2.
- **Reduced motion:** the same box, but `absolute` at the top of the page, so the poster stays in the hero and scrolls away with it.

### Scroll choreography (`HomeScroll`; tune with `HOME_SCROLL`)
One pin (the hero), then **one scrubbed timeline** (scrub 1, `ease: "none"`, time unit = px of scroll). It moves the robot through every section by tweening `botTransform`, and also drives the hero while it is pinned, the lab's photo pans and pips. Section positions are measured before the pin exists; the timeline is rebuilt when the page, hero, stage or footer change size.

| Scroll | What happens |
| --- | --- |
| 0 → end of pin | Wordmark rises at 1.4× scroll speed and fades out. The robot drops 25vh, scales ×1.12 and turns to face the camera |
| 60% of the pin, scrolling down | The robot looks down-left towards the statement (`lookAt` + `react("look-left", 1600)`) |
| end of pin → +85vh (md and up) | The robot moves to the right edge (one gutter in), scale ×0.6, body turned -0.45 rad towards the headline |
| lab top enters → lab top reaches the viewport top (md and up) | The robot moves to centre-right (55% of the width, base at 93% of the stage) at 1.1× its hero size (smaller on screens squarer than 1.55:1), facing the camera. Where the card would cover it, it steps left of the card (landscape, 1.2:1 or wider) or stands above the card, as big as fits under the heading (portrait tablets) |
| each station boundary, over 0.7 screens centred on it | The photo layers pan left one station (`LAB_PAN` 1.25 screens × depth: back 0.6×, mid 1×, front 1.3×), and the robot turns 0.26 rad (≈15°) towards the incoming photos and back |
| each station (one screen) | Its pip's fill grows (scaleX 0 → 1) |
| lab lets go → +0.8 screens (md and up) | The robot ducks into the bottom-right corner: 34% of the stage tall, 22% of the stage peeking over the bottom edge, turned -0.3 rad. It stays there through the slider, the event and the numbers |
| join card comes up (md and up) | The robot moves to the centre and lands on the card's top edge when the card's bottom reaches 90% of the viewport (lower if needed, so the robot stays clear of the header and inside its stage) |
| after landing | It rides up with the card (1:1), then fades out (`autoAlpha`) over 0.25 screens, gone when the footer's top reaches 80% of the viewport (portrait tablets: when half of it has ridden out of its stage). Off stage, the canvas stops |
| end of pin → +45vh (phones) | The robot stage fades out (`autoAlpha`) while the robot sinks, then the robot moves off stage so the canvas stops. Phones don't show the robot after the statement |

The mood engine keeps running throughout: blinks, moods, sleep and wake, and cursor tracking on top of the scroll pose.

### Robot scenes (md and up)
The timeline's `onUpdate` works out which section the robot is in and holds a scene (§11 `botActions.hold`); outside them it releases it, and unmounting or rebuilding releases it too.

| Scene | Starts | Robot |
| --- | --- | --- |
| `lab` | half a screen before the lab top | the station's icon (`hold("lab", "idle", icon)`); at each station change the face glitch-switches to the new icon and `glow()` flashes the bezel in the station accent (red). The station index goes to `useLabStore` (counter, card) |
| `slider` | slider top at 60% of the viewport | `sleepy`; `surprised` for 0.9s on every slide change (FeaturedSlider) |
| `event` | event top at 60% of the viewport | the calendar icon |
| (none) | numbers top at 60% of the viewport | released: random moods |
| `join` | 35% of a screen before it lands | `happy`, and a wave when it arrives scrolling down |

### Sidekick drone (`components/drone/Sidekick.tsx`, `sidekick-plan.ts`; numbers in `SIDEKICK`)
The drone (§18) as the robot's little sidekick in the hero: about a sixth of the robot's size (drone width = robot height /
6; phones 0.13), rendered in the robot's own canvas (`<BotStage sidekick>` → `BotScene`; no second canvas). Its rotor rings,
lens and LED strip are the site's red; the trail is red with some warm white, at most **300** particles (110 on phones),
each living **0.8s**, more when it flies faster.
- **Free flight**: it enters from the top after the robot boots. Each stop is a random point in the hero inside the stage
  (inset from the edges, below the header), never on the wordmark's letters or the header's links and buttons, and not in
  front of the robot. It flies there along a Catmull-Rom curve through 2–3 random midpoints (1.4–3s), on its spring,
  tilting (≤ 20°) and banking with its motion, and hovers 1–2s with a gentle bob. A midpoint that would sit on a letter is
  lifted above the wordmark. If the straight line crosses the robot, the path goes **behind** it (past its near side, behind
  its centre at −1.15 × its scale, out past the far side) or over its head; never through it. Phones, with little room:
  the open grid spot farthest from every zone.
- **Stunts** after every 2–3 flights, at random, never the same twice in a row (phones: flip and orbit only), 1–2s each:
  barrel roll (sideways, rolling once), flip (forward, in place, small burst), loop (a small vertical circle), orbit (two
  laps round the robot's head, behind it; the robot watches it and looks happy), peekaboo (hides behind the robot, pops out
  the other side; the robot looks surprised), wobble (loses its balance, drops, boosts back up), boop (taps the robot's
  screen; the robot blinks and winks). Orbit, peekaboo and boop wake the robot first (`botActions.nudge()`), and during any
  stunt near the robot the robot's head follows the drone instead of the cursor (`botInput.look`).
- **Cursor** (mouse): coming at it fast (over 350px/s within 120px), it darts 210px away and settles; a slow approach
  doesn't startle it. **Click or tap** on it (hit-tested by projecting it to the screen: the canvas takes no pointer events):
  a flip and a sparkle; the click goes no further (the robot isn't poked).
- **Idle**: a cursor that has been still for 6s (mouse users, once they have moved it): it lands on the robot's head
  (`botAnchors.top`, following the head as it droops), its rotors slow and its lights dim, and the robot holds `sleepy`
  (`hold("sidekick")`). Any input wakes both. Touch and an untouched page keep flying.
- **Scroll**: when the hero's bottom passes 70% of the viewport it zips off the top (trail doubled) and hides; above 82% it
  flies back in.
- **Reduced motion**: no drone (the robot is the poster). Debug: `?sidekick=debug` exposes `window.__sidekick` (runtime,
  event log, the robot's store, `stunt(name)`, `flip()`, `nap()`).

### Statement (`Statement`)
- Headline: Sora 600, `clamp(2.4rem, 5.5vw, 5.5rem)`, line-height 1.12, four explicit lines of about four words; a red dot starts line 2. Pills (`<Pill reveal>`): club name `white`, "move" and "fly" `raised` (charcoal), "think" `red` (the headline's one red word).
- Two paragraphs: max 46ch, 17px, muted, opening phrase bold in `text-text`; indented 8vw from md.
- Each `[data-reveal]` (headline lines and paragraphs) rises 40px and fades in once at `top 80%` (0.9s power3.out). Its pills grow 150ms later (0.06s apart), and the robot shows `happy` for 0.9s as each one starts.
- The section is `min-h-svh` with its content centred, so the robot holds beside it while it is read.

### Inside the lab (`Lab`, `LabPanel`, `lab-store`; config in `lib/home.ts`)
- Stations: `LAB_STATIONS` (domain, title, short counter word, icon, accent, one-sentence description): Drones & Aerial Systems (drone), Robotics & Mechatronics (robot-arm), IoT & Embedded (wifi-chip), Research & AI (atom); every station's accent is red (its mono label and the robot's bezel flash).
- Photos: up to 3 projects per station whose tags include the domain and that have a cover (`stationProjects`). "See projects" goes to `/projects?tag=<domain>` (`stationHref`).
- **md and up, with motion:** the section is (stations + 1) × 100svh tall. Two sticky layers hold for one screen per station (sticky, not a GSAP pin, §7):
  - `[data-lab-photos]`, below the robot: three layers (`[data-lab-layer]` back / mid / front), each station's frames one pan to the right of the previous. Back frames 15vw at 40% opacity, mid 21vw at 80%, front 18.5vw at 4:5; all `rounded-image`; mid and front have a mono "Title / year" caption.
  - `[data-lab-ui]` (z-35, above the robot): the heading top left, two `Pill`s, "What we build" (red) and "inside the lab" (white); the counter top right (`[02/04] ROBOTICS`, the number and the word roll like an odometer, 0.9s expo); the card bottom right (`bg-2`, `rounded-card`, max 360px): station label in its accent, title, description, ghost "See projects" button and the pips (the active pip is a 40px bar whose fill the timeline scrubs; the rest are dots). The card's content cross-fades on a station change.
- **Phones and reduced motion:** four stacked blocks, photos (two-column grid) then the card, with a `BotHeadIcon` showing the station's icon beside each title. No pinning.

### Featured slider (`Featured`, `FeaturedSlider`)
- Featured projects with a cover. Full bleed with 16px side margins (`px-4`), `rounded-card`, 80svh, `data-cursor="drag"`.
- Autoplay every 5s, only while 35% of it is in view and not paused or dragged. The active indicator (bottom centre) is a pill whose fill runs `animate-grow-x`; its `animationend` moves to the next slide. The others are dots; all are buttons. A pause/play button sits beside them.
- Drag or swipe (Motion `drag="x"`): a swipe counts past min(160px, 18% of the width) or 500px/s, and a drag never follows a link. It loops.
- Caption bottom left over a dark gradient (`bg-linear-to-t from-bg/95`): "Featured / year" label, title, tags as small mono pills, "Explore" button to `/projects/<slug>`.
- Accessibility: `aria-roledescription` carousel / slide, inactive slides `inert`, a polite live region announces the current slide.
- **Reduced motion:** no autoplay; slide changes are instant.

### Upcoming event (`UpcomingEvent`, `Countdown`, `ScrollTilt`)
- Rendered only when `getUpcomingEvent()` returns an event.
- Poster (`rounded-image`, 4:5) tilted 3° that straightens as it scrolls in (`ScrollTilt`: scrubbed from entering the viewport until its centre reaches the middle; straight under reduced motion).
- Mono date and time in IST ("Fri 20 Nov 2026 · 14:00 IST"), title, venue, tags (event type + `tags`), live countdown (days / hours / minutes in large mono, `role="timer"`, "--" until hydrated, updated every 5s), "Register" IrisButton (`registration_url`, else `/events/<slug>`) and an "All events" ghost PillButton.

### Numbers (`Numbers`, `CountUp`)
- Four counts from `getHomeStats()`: members, projects built, events hosted (events that have started), years running.
- Large Sora 800 digits (`clamp(3.4rem, 8vw, 7.5rem)`) with mono labels, 2 columns on phones, 4 from md. Each counts up once at `top 85%` (1.2s power3.out, 0.06s apart). The server HTML has the final numbers, and nothing counts under reduced motion.

### Join card (`JoinCard`, `NotifyForm`)
- `bg-2`, hairline border, `rounded-card`. Left: "Hands on with hardware" with "Hands on" in a red pill. Right: two sentences, `settings.open_teams` as small charcoal (`raised`) pills, "Apply now" IrisButton (`join_form_url`, else `/join`).
- When `recruitment_open` is false: closed-intake copy and a "Get notified" email form (`useActionState` + the `notifyWhenRecruiting` server action).
- md and up, with motion: 40svh of space above the card and 22svh below it, so the robot can land on it, ride and fade before the footer.

### Reduced motion
Nothing is built: no pin, no scrub, no reveals, no scenes. Everything renders in its final position: the robot is the poster in the hero (it only blinks), the lab is stacked, the slider doesn't autoplay, the event poster is straight and the numbers show their final values.

---

## 13. Members page (`app/members/page.tsx`, `components/members`)

```tsx
<SeniorCore members={getSeniorCore()} settings />   // [01] editorial spreads, Bodoni Moda
<JuniorCore teams={getJuniorCoreByTeam()} />        // team pills + one expanding accordion per team (Sora)
```

### Senior Core
An editorial run of full-screen "spreads" on the near-black background (`bg-bg`
covers the grid), and the only place Bodoni Moda is used. The genre is a fashion
magazine: huge serif names, black-and-white portraits, a cut-out figure in front
of giant letters, a spinning badge and `*01` counters. Keep it original: no
borrowed layouts, assets or branding.

Order: **intro**, one spread per senior (`tier = "senior"`, by `sort_order`), **closing**.
- **Intro**: `[01] Senior Core / 2026-27`, "The" small italic over "CORE" huge
  (`min(34cqw, 48svh)`; its letters rise with `animate-rise` on first load), one line of text
  ("Eight people who…", counted from the data), the `RotatingBadge`
  (`club_name * SENIOR CORE * 2026 *`) and a "Meet them" next arrow. It holds the page's `h1`.
  The term is `SENIOR_CORE_TERM` in `lib/members.ts`, a constant so the page stays static. Update it yearly.
- **Member spreads**: `seniorLayout()` picks the layout by position, cycling A, B, C, D:
  - **A, Split**: the portrait fills the left half at full height. On the right: kicker, name, hairline, quote (Bodoni italic), role / branch, Connect.
  - **B, Vertical**: the name in two vertical columns (`writing-mode: vertical-rl` + `rotate-180`, reading upwards) either side of a medium portrait set high, with an iris rectangle (25%) over its lower corner. Kicker, role (Bodoni italic), bio and Connect sit bottom left; the quote bottom right.
  - **C, Cutout** (the signature spread): the name in two giant lines across the full width (fitted to the width, up to `26svh` / 20rem), with the `cutout_url` figure standing on the bottom edge between them. Line 1 sits behind the person. Line 2's fill also sits behind, and a 1px outline copy sits in front, so the line passes partly behind. **Without a `cutout_url` it falls back to A.** Portrait tablets (`md:portrait:`) make the figure 74svh and move the lines to 26% / 52%.
  - **D, Stacked**: first name, last name and "the {role}" (italic, 0.42em) stacked top left; a small square portrait bottom left; the badge (`name * role * Senior Core`) on the right; the bio beside the portrait (two columns from `lg`).
- **Closing**: "Want a seat / at this / *table?*", the view's one `IrisButton` ("Join the club" → `join_form_url`, else `/join`) and a ghost "Junior Core ↓" button to `#junior-core`. The pin then lets go and the page scrolls on to Junior Core.
- **Bottom right of every spread**: mono `LI / GH / IG` links (only the networks the member has), prev/next arrows, and the counter `*01` (Sora 700, `clamp(3rem, 6.5vw, 6rem)`, tabular figures).
- **Phones**: each spread stacks portrait, then name, then text, about one screen tall. Layout C keeps its figure in front of the name.

Shared parts (`parts.tsx`):
- **Names**: Bodoni Moda 500, uppercase, leading 0.86. The size is `min(clamp(4rem, 11vw, 12rem), column / width, 17svh)`:
  - `--col` is the column's width, set per layout in `cqw` (each spread is a size container).
  - `--em` is the widest line's width in em, from the measured Bodoni capital widths in `lib/members.ts` (`capsWidth`).

  So a name always fills its column without overflowing. Two-word names break between the first words and the last word; a one-word name splits in half.
- **Kicker**: Sora 500, 11px, tracking 0.6em, uppercase ("T H E   P R E S I D E N T").
- **Portraits**: `grayscale contrast-110`, turning to colour on hover over 600ms (§7 exception). `rounded-image`, except A's full-bleed half.
- **Blobs**: `bg-iris` (the maroon → red sheen) at 30%, `blur(clamp(48px, 7vw, 110px))`, behind the content (each spread is `isolate`): a dim red light pool on black.
- **Body text**: 14px, muted, narrow columns.
- **Connect**: a caps link with a long arrow line that extends on hover. It goes to the first of LinkedIn, GitHub, Instagram that the member has.
- Links inside the track must set `data-cursor="link"` themselves, or the track's DRAG state wins.

### Motion (`SeniorCoreTrack`, `SENIOR_CORE_MOTION`)
The spreads render **stacked**, which is also the layout without JS, on phones and under reduced motion. `gsap.matchMedia()` picks what to build:

| Media | What is built |
| --- | --- |
| md+ with motion | **Horizontal.** The viewport gets `data-mode="h"` (CSS lays the track out as a row; the viewport becomes `h-svh overflow-clip`) and `data-cursor="drag"`. It is pinned (`start: "top top"`, end `+= track.scrollWidth − viewport.clientWidth`) and the track tweens to `x: −that` with `ease: "none"` and scrub 1, snapping to each spread (`inertia: false`). |
| Phones with motion | Stacked, with the same reveals on vertical ScrollTriggers (`top 72%`); blobs drift ±70px × their speed. |
| Reduced motion | Nothing is built: stacked, final states, badges still, arrows jump instantly. |

Horizontal controls. They all move the page scroll, so there is only one timeline:
- **Arrow keys**: ← / → while the section is pinned (ignored in form fields and while the menu is open). The scroll jumps; the scrub (1s, expo) animates the track.
- **Prev/next arrows** on every spread (`SpreadNav`): the same jump. Focus then moves to the same arrow on the new spread, and a polite live region announces "3 of 10: Kabir Sethi". On phones they scroll to the spread instead (Lenis, 1.2s).
- **Drag** (mouse, pen, touch; `touch-action: pan-y`):
  - after 6px of horizontal movement it scrolls 1:1, and the scrub drops to 0.12s so the track follows the pointer;
  - on release it goes to the nearest spread (a flick over 400px/s goes one further in its direction);
  - a drag never follows a link.
- **Sideways trackpad swipes** move the track too (Lenis only reads vertical deltas).
- **Tab** into another spread brings that spread in (`overflow: clip` stops focus from scrolling the viewport itself).

Reveals play once per spread as it enters (horizontal: `containerAnimation`, at `left 62%`):
- letters rise out of their masks (`yPercent` 110 → 0, 1.2s expo, 0.04s apart; the vertical name moves sideways instead);
- portraits wipe up (`clip-path: inset(100% 0 0 0)` → `inset(0)`);
- text rises 24px and fades in;
- the counter rolls like an odometer from the previous number (each digit is a 0–9 column, twice over; the ones digit spins a full turn).

Blobs drift against the track at their own speeds (scrubbed with `containerAnimation`, ±14% of the width × speed). Badges spin faster while the page scrolls.

### Junior Core (`JuniorCore`, `JuniorCoreNav`, `TeamAccordion`)
The juniors (`tier = "junior"`) are grouped by team, in the teams' order (`getJuniorCoreByTeam()`), with one expanding
accordion per team. **Sora and mono only** (no Bodoni). The section keeps the `#junior-core` id that Senior Core's
closing button links to.

- **Heading**: the mono label `[33] MEMBERS / [07] TEAMS` (both numbers counted from the data), then "Junior Core" (Sora 800, `clamp(3rem, 9vw, 8rem)`).
- **Team bar** (`JuniorCoreNav`):
  - **Layout.** A sticky strip of team `Pill`s (`raised`, the current team in its accent), `sticky top-(--nav-h)`, `bg/80` with a backdrop blur and hairlines above and below. No ancestor up to `main` may set `overflow` or `transform`, or it stops sticking.
  - **Why only `--nav-h`.** It sticks at `--nav-h`, not `--nav-h + --ann-h`: the announcement bar has always collapsed (past 40px of scroll) by the time this section is on screen.
  - **Phones.** The pills scroll sideways, with no scrollbar, and the current pill is kept centred.
  - **Click.** It scrolls to the team's row: Lenis, or native smooth scroll without it; 1.2s; instant under reduced motion. It lands 24px below the bar. The offset is the bar's measured bottom (`stickyOffset()` in `junior-scroll.ts`), so it follows the header height.
  - **Click effects.** It also marks the pill `aria-current`, highlights the row for 1.8s (`data-highlight`: the team name turns its accent and an accent bar grows under it), and moves focus to the row's heading.
  - **Lenis anchors.** The click handler stops propagation, because Lenis (`anchors: true`) would otherwise scroll to the anchor itself without the offset.
  - **Without JS.** The pills are real `#jc-<slug>` links, and the rows have a scroll-margin for the header and bar.
  - **Scroll spy.** A row is current while it spans a line 40% down the screen (never above the bar). Its ScrollTriggers use `refreshPriority: -1`, below Senior Core's pin.
- **Row**: the team name, an accent bar (shown while highlighted) and `[10] Members` sit above the accordion below `lg`, and in a 10rem column to its left from `lg`. The row sets `--jc-accent` to the team's accent (`teamAccent`).
- **Accordion, md and up** (`@container`; sizes are CSS variables in `cqw`, so a full line with one card open always fits the column):
  - **Line.** A flex row of cards 440px tall, gap `clamp(8px, 1.1cqw, 12px)`. Each line holds up to 8 cards (`JUNIOR_CORE.perLine`). More members continue on a second line of the same accordion, and the lines are fixed, so cards never jump between them.
  - **Closed card.** A pill `clamp(44px, 6.6cqw, 76px)` wide (radius half its width, so it can animate). The portrait is `object-cover` at the member's `focal_point`, dimmed with `grayscale-40 brightness-80`. The first name runs vertically at the bottom (mono 11px, `text-text/60`) over a faint bottom gradient.
  - **Open card.** `clamp(280px, 42cqw, 460px)` wide, `rounded-card`, full colour. It has the 1px `iris-border` ring and a faint glow in `--jc-accent` (red at 35% / 45%).
  - **Open card's details.** A bottom gradient from transparent to `black/85`, with:
    - the name (Sora 600, 24px);
    - the role (mono 11px);
    - the bio (13px), clamped to 2 lines from `lg`, 3 at md, 4 on phones, so the longest 160-character bios end in an ellipsis on desktop;
    - round social icon links (`SocialIcon`; LinkedIn, GitHub, Instagram, only those the member has; `data-cursor="link"`).
  - **Opening.** One card per accordion is open, the first to start with. A click, tap or Enter/Space opens a card; so does hovering with a mouse (md and up, after an 80ms intent).
  - **Motion.** Width and radius animate together over 550ms with `cubic-bezier(0.22, 1, 0.36, 1)`. The text comes in 150ms after that and leaves at once on collapse (the §7 exception).
- **Accordion, phones (< md)**: a vertical list of full-width 72px pills. Each has a 56px circular portrait on the left and the name and role beside it.
  - **Open card.** It grows to 380px tall (`rounded-card`), the portrait fills it, and the details appear. It uses the same timing, animating height.
  - **Keeping it in view.** Tapping a card scrolls just enough to keep the whole opened card on screen, below the bar. This allows for the previously open card above it shrinking.
  - **Variant gotcha.** Phone-only states use `max-md:`, because Tailwind sorts `data-*` variants after `md:`.
- **No photo**: an initials avatar (first and last initial, Sora 700) in a thin `iris-border` ring on the dark card. It is in the circle slot on phones and high in the card from md up, and it grows when the card opens.
- **Accessibility**:
  - **Structure.** Each card is a list item holding a full-size `<button aria-expanded aria-controls>`, whose accessible name is "Name, Role". The button comes first, so Tab reaches a card's links right after its button.
  - **Arrow keys.** ← / → (and Home / End) move focus between a team's cards; Enter / Space open the focused one.
  - **Focus ring.** A 2px `text` outline, offset 4px, following the card's radius.
  - **Closed details.** They are `inert`, so their links are never tabbable.
- **Entrance**: each team's cards rise 30px and fade in, 0.06s apart (0.9s power3.out). This plays once, when the row reaches `top 80%`. The ScrollTrigger uses `refreshPriority: -1`.
- **Reduced motion**:
  - no entrance;
  - no width or height transition (`motion-reduce:transition-none`), so the open card switches instantly and its details show at once (no delay);
  - the pills and the phone keep-in-view jump instead of scrolling.

---

## 14. Gallery (`app/gallery`, `components/gallery`)

Each event's photos are a **journal**. `/gallery` is the shelf; `/gallery/[slug]` opens one journal as a fan of pages
in 3D, with a grid view and a lightbox. Every journal is prerendered (`generateStaticParams` from `getJournals()`).

### Pages from items (`lib/gallery.ts` → `buildJournalPages`)
Items in `sort_order` become pages:
- a photo is a page; a video is a page;
- consecutive photos with the same `layout_group` become **collage** pages of 2–3 photos (a run of 4 gives 2 + 2, 5 gives
  3 + 2; a group of one is a plain photo page);
- a row with a `caption` and no `url` is a **note** page.

Collage rotations and stickers come from `seeded(id)` (a hash), so the server and the client agree.

### Shelf (`/gallery`: `JournalShelf`, `JournalCover`)
- "Journals" (Sora 800, `clamp(3.4rem, 11vw, 10rem)`) under the mono label `[03] EVENTS / [61] PHOTOS` (photos with a file,
  counted from the data).
- Year filter `Pill`s ("All" and each year, newest first; `aria-pressed`). Changing the year fades the covers out and the
  rest slide into place (Motion layout); instant under reduced motion.
- Grid: 1 column on phones, 3 from md. A cover is the event's `cover_url` bound like a notebook (4:5, `rounded-image`, a
  spine shade and crease, an elastic band), then the title (Sora 700), `[19] PAGES` and the mono date (IST).
- Hover or keyboard focus: the cover turns **rotateY(-12°)** on its spine and three white page edges slide out from its right
  side (7%, 10%, 13% of the width, 40ms apart), 600ms power3, plain CSS. `data-cursor="view"`. It links to `/gallery/<slug>`.

### Viewer layout (`JournalViewer`)
Journal view fills the screen (`h-svh`, `pt-header`), top to bottom:
- **Top bar** (`JournalTopBar`): a round back button (to `/gallery`) and the journal/grid toggle on the left; the title
  (Sora 600) and `[23] PAGES` in the centre (on phones it wraps to its own row); share and a "More" menu on the right. More
  has "About the event", "Copy link", "Download this page" and "All journals". In grid view the bar sticks under the header.
- **The fan** (below).
- **Scrubber** (`JournalScrubber`): a hairline track whose fill follows the position every frame, a dot, and `12 / 40`. Click
  or drag along it to jump. It is a `role="slider"`.
- **Toolbar** (`JournalToolbar`): a frosted pill (`bg-bg-2/55`, `backdrop-blur-xl`, hairline) with info, share, download and
  grid. Info opens a panel with the event's date, venue and summary, the photo and video counts, and the centre page's caption.
- **Backdrop** (`JournalBackdrop`): the centre page's image (a photo, a video's poster or a collage's first photo; a note uses
  the nearest page with one) at `blur(80px)` and 25% opacity, fixed behind everything, crossfading over 0.9s when it changes.
  It is fetched at 96px, since it is blurred anyway, and loads eagerly: being full-screen, it is what the browser counts
  as the page's largest paint.

Share uses the system share sheet where there is one, otherwise it copies the link and a toast says so. The address follows
the page (`?page=12`, replaced 400ms after the page changes), and opening that link starts on that page. Download saves the
centre page's file(s) (`download.ts`): fetched as a blob from its host, else through the same-origin `/_next/image` at full
width, else opened in a new tab.

### The fan (`JournalFan`, `fan.ts`)
All page transforms come from **one continuous float**, `pos`: a Motion value that springs (`FAN.spring`, §7) to the active
index. With `d = index − pos`:

| d | Transform |
| --- | --- |
| 0 | facing forward, `translateZ(0)`, scale 1 |
| other | `translateX(sign(d) × (52% + 6% × (\|d\| − 1)))` of the page width, `rotateY(−sign(d) × 62°)`, `translateZ(−110px × \|d\|)` |

- Between the centre and the first side page, x and the turn are interpolated, so a page turns smoothly.
- Up to **7 pages per side** from md and **3 on phones**. They fade after |d| = 5 and are gone at 8; on phones they fade over
  the last page.
- z-index goes by distance. The stage is `isolate`, so these z-indexes stay inside it.
- The stage has `perspective: 1800px`; each page's wrapper carries it, so the wrapper can be FLIP-animated while the page
  keeps its 3D transform.
- `pos` changes are written straight to the DOM. React re-renders only when the rounded page changes.

Pages:
- **Size and shape**: 4:5, `rounded-image`, a 6px `paper` print border and a soft shadow. Width: as tall as the stage
  allows, capped at 76% of the width on phones, 46% on tablets and 34% from lg (`--page-w`, in container units).
- **Page curl** (centre page): a light-to-dark band on the edge in the direction of travel. It strengthens with speed and
  with how far the page has turned.
- **Rendering and loading**: only pages within **8** of the position are in the DOM. Images use `next/image` with
  `sizes`. The opening page is preloaded and the 2 pages each side load eagerly. A video's `<video>` (and so its source)
  exists only within **1** of the centre.

Navigation:
- **Drag or swipe** (pointer events, `touch-action: pan-y`):
  - it starts after 6px of sideways movement and follows 1:1, at 52% of a page width per page;
  - past the ends it runs at 30%;
  - on release, the position carries on for 0.24s of its velocity, so a flick skips pages;
  - a drag never counts as a click.
- **Trackpad sideways scroll**: follows the fingers and settles on the nearest page 140ms after the last event.
- **Mouse wheel**: one page per notch. At the first or last page it lets the page scroll on, after a 600ms hold.
  The stage has `data-lenis-prevent-wheel`.
- **Keys**: ← → (Home / End) anywhere on the page, except in fields or while the menu or the lightbox is open.
- **Clicks**: clicking a side page brings it to the centre; clicking the centre page opens the lightbox at that item
  (on a collage, the photo you clicked).
- **Focus**: only the centre page is in the tab order, and keyboard focus follows it.

### Page types (`JournalPages`; sizes in `cqw`, each page is a container)
- **photo**: full bleed. A caption becomes a handwritten note (Caveat) on a small `paper` tag with a punched hole, rotated
  -3°, in the bottom-left corner.
- **video**: a muted loop that plays only while centred. A sound toggle sits on the centre page (outside its button). The
  poster shows otherwise, with a small play badge.
- **collage**: 2–3 photos in white print borders, each turned 2–5° (alternating direction, seeded). Each has translucent tape
  strips over two corners. There is one sticker: a red star, a maroon spark, or the club logo on a white disc.
- **note**: `paper-ruled`, with the caption handwritten large on the rules and the event date in mono at the top right.

### Grid view and the switch (`JournalGrid`)
- **The grid**: a masonry (CSS columns: 2 on phones, 3 from md, 4 from lg) of every item. Notes are small ruled cards.
  Photos and videos open the lightbox; videos show a play badge, and captions sit over a dark gradient in Caveat.
- **The switch (FLIP)**:
  1. The items on screen are measured in the old view.
  2. The page scrolls to the top.
  3. In the new view, each item with an old box flies from it over **900ms expo**. Grid tiles animate themselves; fan pages
     animate their wrapper around the page's centre.
  4. Everything else fades up (30px, 0.03s apart).

### Lightbox (`Lightbox`)
- **Layout**: portalled to `<body>` at z-90 (above the header, below the cursor). It holds the photo full screen
  (`object-contain`) or the video with controls, the counter and title, the caption in Caveat, and prev/next, download, zoom
  and close buttons. Prev/next sit at the sides from md and at the bottom on phones.
- **While open**: it makes `#main`, the footer and the header `inert`, stops Lenis, locks the scroll and focuses Close.
  Esc closes it, and focus goes back to the page. The fan then waits on the page of the item you were looking at.
- **Zoom (photos)**:
  - the wheel or a trackpad pinch (ctrl + wheel) zooms around the pointer, up to 5×;
  - a two-finger pinch zooms on touch;
  - double click toggles 2.5×;
  - +/− work as keys and buttons.

  Zoomed in, a drag pans; at 1×, a sideways swipe changes the item. ← → change the item.

### Reduced motion
- The fan becomes a **flat horizontal slider**: neighbours sit 108% of a page width apart, with no 3D and no curl.
- Page changes are instant. Videos don't autoplay; the lightbox plays them with controls.
- No flights between views, no backdrop crossfade, no lightbox fades, and the shelf filter doesn't animate.
- The shelf's cover tilt is a CSS transition, so it is instant like every transition.

### Placeholders
The mock photos and posters are `picsum.photos`, and the two clips are MDN's CC0 samples. "About the event" links to
`/events/<slug>`, which doesn't exist yet.

---

## 15. About page (`app/about/page.tsx`, `components/about`)

```tsx
<HandsSection clubName />        // section 1: the pinned hands sequence (HandsScroll)
<AboutReveals>                   // reveals for everything below
  <Purpose />                    // [01] mission & vision cards
  <Pillars />                    // [02] workshops, projects, competitions
  <History milestones />         // [03] the timeline (getMilestones)
  <TeamsOverview teams />        // [04] team pills → /members
</AboutReveals>
```

### Section 1: Hands (`HandsSection`, `HandsScroll`, `IrisRing`; numbers in `ABOUT_HANDS`)
A human hand reaches in from the left and a robot hand from the right, like a fresco's two outstretched fingers, in front of
a soft iridescent ring. Scrolling brings the fingertips together while copy fades in and out around them.

**Assets.** `/public/about/hand-human.png` and `/public/about/hand-robot.png`: transparent cut-outs of a hand and forearm, 5:2
(2000×800), loaded with `next/image` `preload` (Next 16's name for `priority`). Framing contract: the index fingertip touches
the image's **inner edge** (right edge for the human, left for the robot) **40% of the way down**, and the forearm runs off
the outer edge. The current files are generated placeholders; replace them with real cut-outs framed the same way.

**Layout.** Everything is placed against `--tip-y`, the line the fingertips point along: 42% of the screen on phones, 52%
from md (the middle of the area below the header). Layers, back to front:
- `bg-bg`;
- the **iris ring** (`IrisRing`), 70vmin, centred on the contact point: a conic gradient of maroon and red with clear
  gaps, masked into a ring that fades over about 30px each side (the look of a 30px blur), plus a fine edge line. It turns
  once per 40s (`animate-orbit`) and breathes (`animate-breathe`). The softness comes from the mask, **not**
  `filter: blur()`: a blurred layer that rotates is re-blurred every frame, while a masked one is rasterised once and only
  turned by the compositor;
- the **title** (the page's `h1`): `club_name` (Sora 700) over "where humans meet machines" (Sora 500, `text-text/75`,
  "machines" in `text-red`), `clamp(2.25rem, 4.4vw, 4.5rem)` from md, centred above the hands;
- the **hands**: 54vw wide (55vw on phones), each made of four wrappers: the CSS pose (placement and the start
  translate of ±20vw, never touched by GSAP, §7), the scroll x, the cursor parallax and the float (`animate-float`, the
  robot 1.6s out of phase);
- a **glow** at the contact point (a warm white radial gradient, `animate-pulse-soft`), hidden until the touch;
- three **copy blocks**:
  - **A**, bottom left: "01 / Who we are", "Built by students, for the real world" (Sora 600,
    `clamp(2rem, min(4.5vw, 7svh), 4rem)`; the svh cap keeps it under the hands on short laptop screens), and one muted line;
  - **B**, top right, right-aligned: "Sense. / Understand. / Adapt." and one muted line;
  - **C**, bottom right, right-aligned: "02 / How we build", "Precision. With feeling." and one muted line.

  On phones the blocks sit in the band below the hands: A at its top, B at its bottom, and C where A was.

**Timeline.** It is pinned for 300vh from md and 180vh on phones (scrub 1). Its time runs 0 → 1 over the pin:

| Pin | What happens |
| --- | --- |
| 0 | Fingertips 40vw apart, title fully visible |
| 0 → 0.35 | The hands close to about 8vw (on the `1 − (1 − t)^2.5` curve, §7). The title scales to 0.9, blurs 0 → 8px and fades out; the ring scales 1 → 1.15 |
| 0.35 → 0.65 | The hands close to 2vw. A rises in (60px, from 0.37), then B (30px, from 0.44) |
| 0.65 → 0.9 | The hands drift to 1.2vw. A and B slide up 56px and fade out; C rises in (40px, from 0.74) |
| 0.9 → 0.96 | The fingertips meet (`sine.inOut`) |
| 0.955 → 1 | The glow appears at the contact point; the ring flashes (a warm white copy, 0 → 1 → 0) and expands to 1.7× while fading out |
| after the pin | The stage fades out over 0.6 of a screen as it scrolls away into the mission cards |

**Cursor parallax** (md and up, fine pointers only): the hands drift up to 12px towards the cursor, and the ring up to 6px
the other way (`gsap.quickTo`, 0.9s power3.out).

**Reduced motion.** Nothing is pinned or scrubbed. The CSS shows the final layout instead of the first frame: the hands 2vw
apart (`motion-reduce:` translate), the ring still, no glow, and the three blocks stacked below the scene in a plain column.
The pinned layout's positions are all `motion-safe:` classes, so the default classes are the reduced-motion layout.

### Below the hands (`AboutSections`, `AboutReveals`)
Each section has a mono index label and a Sora 700 heading (`clamp(2.2rem, 5vw, 4.5rem)`).
- **Purpose** (`[01] Mission & vision`): two large cards side by side from md (`bg-2`, `rounded-card`, hairline, a
  `DotGrid` in the corner): the accent mono label (Mission red, Vision warm white), a heading and a paragraph. Copy in
  `ABOUT_PURPOSE`.
- **Pillars** (`[02] What we do`): Workshops, Projects, Competitions (`ABOUT_PILLARS`), three columns from md. Each has an
  icon (`components/about/icons.tsx`, 24px line icons) in an accent circle (Projects red with warm white; Workshops and Competitions warm white with dark), a heading and about two lines.
- **History** (`[03] Our story`): a vertical line (centred from md, at the left on phones) with a dot and a year card for each
  milestone. From md the cards alternate left and right, overlapping a little so they zig-zag. The line draws itself
  (scaleY, scrubbed from the list's top at 70% of the viewport to its bottom at 70%). Each dot lights up red as the line
  reaches it. Each card slides in 40px from its side (rises 30px on phones).
- **Teams** (`[04] Teams`): "Seven teams, one club" (the count is spelled from the data), a line, and a row of large team
  charcoal (`raised`) `Pill`s, each linking to `/members` with a small red ↗ that nudges on hover; on hover or focus the pill
  fills red and the ↗ turns warm white.

Reveals: `[data-reveal]` and `[data-reveal-group]` items rise 40px and fade in once at `top 80%` (0.06s apart). Every trigger
uses `refreshPriority: -1`, below the hands' pin. Under reduced motion nothing animates, the line is drawn and every dot is lit.

---

## 16. Projects (`app/projects`, `components/projects`)

```tsx
// app/projects/layout.tsx: shared by /projects and /projects/[slug], so the stage stays mounted between them
<ProjectsStage projects={getProjectsWithTeam()} clubName />   // md+ with motion: reel → gallery → enlarged photo
<div data-projects-plain className="md:motion-safe:hidden">{children}</div>
// app/projects/page.tsx:        <ProjectsIndex />   phone carousel, reduced-motion grid
// app/projects/[slug]/page.tsx: <ProjectDetail />   info + photo stack + full-screen viewer
```

Three states on md and up with motion: the **reel** (`/projects`), one project's **gallery** (`/projects/<slug>`) and an
**enlarged photo**.
- **The stage**: one full-screen section (`h-svh`, `bg-bg`, a size container). The footer is hidden while it shows
  (`globals.css`).
- **The plain versions**: the pages underneath render them, and CSS shows them instead of the stage on phones, under reduced
  motion, without JS (a `<noscript>` style) and without WebGL2 (`html[data-projects-fallback]`).
- **Rendering**: every project is prerendered. The page reads `params` inside `<Suspense>`, so a client navigation never
  waits on them.

### Chrome
- **Top left**: mono `[club_name] / Projects` (the page's `h1`), with the filter `Pill`s under it: All, Drones, Robotics, IoT,
  Research (`PROJECT_FILTERS`).
  - A project matches when one of its tags equals the filter, in any case.
  - The filter is kept in `?tag=`.
  - Changing it fades the reel out (0.3s) and back in (0.6s).
- **Top right**: `[12] Builds`, the filtered count.
- **Bottom centre**: every project's name in mono, with thin dividers between them.
  - The active name is in `text`, the rest `muted`.
  - The row scrolls sideways, with faded edges, when it doesn't fit.
  - Clicking a name brings that panel to the centre.
- **Top centre** (gallery and photo only): "Back to projects", which becomes "Close image" while a photo is enlarged.

### State 1: the reel (`ReelCanvas`, `reel-shaders.ts`, `reel-state.ts`; numbers in `REEL`)
- **Panels**: each project's cover on a 4:3 panel, 26% of the stage width, 2% apart.
  - **Shape.** They sit on the inside of a cylinder (radius 0.62 × width) whose axis is on the viewer's side. So each panel
    bends, and the edge panels turn towards the centre and come forward.
  - **Geometry.** One `PlaneGeometry(1, 1, 32, 1)` and one `ShaderMaterial` per panel.
  - **Vertex shader.** It wraps the panel along the arc: x = sin(sk)/k and z = 2 sin²(sk/2)/k for arc length s.
  - **Fragment shader.** It crops the texture like `object-cover`, rounds the corners (18px, `--radius-image`, an SDF with
    `fwidth`) and adds the RGB split.
  - **Camera.** It is placed so z = 0 maps 1:1 to CSS px (distance 0.9 × width).
- **Loop**: the list repeats until the loop is at least 2.4 widths long (`reelCopies`), and every panel wraps around it, so it
  never ends. Panels further than 0.75 widths along the curve are hidden.
- **Moving it**: drag (it starts after 6px and moves 1.25 reel px per px), the mouse wheel, trackpads (both axes) and the
  arrow keys (one panel per press).
  - The reel follows its target with a lerp (`REEL.follow`, §7).
  - A released drag carries on for 0.22s of its speed.
  - The reel settles on the nearest panel; after a wheel, 160ms after the last event.
- **Speed**: scrolling adds up to 60% more bend (full at 4000px/s) and an RGB split at the panel edges (full at 3000px/s).
  Both ease back as the reel slows.
- **Active panel**: the one nearest the centre. Its title shows over the panels (`ReelTitle`, below).
- **Hover**: the panel flattens 35% towards its tangent plane and brightens 12%. The cursor shows a VIEW pill.
- **Hit areas**: an invisible `<button>` per visible panel ("Open <title>"), moved every frame over the projected panel.
  - They take hover, click and keyboard focus.
  - Only the active one is in the tab order; Enter opens it.
- **Intro**: once the first textures are in (or after 2.5s), the panels fade in from the centre outwards (1.6s expo).
- **Performance**:
  - three.js loads only here (`next/dynamic`, `ssr: false`);
  - dpr `[1, 1.75]`;
  - `frameloop="demand"`, so frames render only while something moves, and `"never"` while the tab is hidden;
  - textures load nearest the centre first, three at a time, through `/_next/image` (1080px), so remote hosts need no CORS;
  - a lost WebGL context falls back to the plain pages.

### The title (`ReelTitle`)
- **Style.** Sora 800, uppercase, vertical (`writing-mode: vertical-rl` + `rotate-180`, reading upwards). It is centred over
  the panels and sits behind the gallery tiles.
- **Size.** `min(--title-max, --title-fit / its length in em)`. On the stage these are 19.5cqh and 64cqh. Below lg the length
  also stays between the filter row and the names, because there the pills reach the middle column.
- **Change.** The old letters slide up out of their mask and the new ones come in from below, 25ms apart
  (`animate-letter-out` / `animate-letter-in`).
- **Halves.** It is two halves (`splitTitle`), split at the space nearest the middle, or else in the middle.
  - In the reel they butt into one word.
  - In the gallery the first half rests at the bottom (`--title-bottom`) and the rest at the top (`--title-top`), at 38%
    opacity, behind the photos.

### The flight (reel ↔ gallery)
One progress value `p` (0 reel, 1 gallery) is tweened over 1.1s `expo.inOut` and written to the stage as `--p`. CSS reads it
for everything outside WebGL: the title's halves, the filters and names fading, the tiles' entrance and the info panel. So a
reversal mid-flight just tweens `p` back.
- **The clicked panel** unbends (the shader mixes its curved pose into a flat rectangle) and grows into the cover tile's place.
- **The other panels** slide 0.9 widths outwards and fade.
- **Handover.** Once the panel lands and the DOM cover has loaded (at most 1.5s), the DOM tile takes over and the canvas is
  hidden.
- **The URL** follows. A click pushes `/projects/<slug>`.
  - Back, Esc and the browser's back button play the flight in reverse.
  - Opened from the reel, "Back" is `router.back()`; otherwise it pushes `/projects`.
  - A direct visit to `/projects/<slug>` starts in the gallery, with no flight.
- **Focus** moves to the info panel's heading after opening, and back to the panel's button after closing.

### State 2: the gallery strip (`ProjectStrip`, `buildStrip`; numbers in `STRIP`)
- **Tiles**: the cover (4:3, large) and the project's `images`, as flat tiles in one long row, at alternating heights between
  17% and 88% of the screen.
  - **Sizes.** Large is 46vh tall (speed 1, in front), medium 34vh (0.82) and small 24vh (0.66, at the back).
  - **Mixing.** No two large tiles sit side by side, and no size runs three times in a row.
  - **Seed.** The layout is seeded by the project id, so the server and the client agree.
- **Moving it**: drag, the wheel, trackpads or ← →. Each tile moves at its size's speed, so the smaller ones lag behind
  (depth). Every tile is placed to reach the centre in order, overlapping its neighbours a little.
- **Entrance**: the tiles fade and slide in after the cover lands (staggered on `--p`).
- **Hover**: scale 1.04, and the cursor shows OPEN.
- **Info panel** (bottom left; `ProjectInfo`: `bg-2`, `rounded-image`, hairline ring, max 380px): year / status, the title
  (`h2`), tag pills, the description, the team's names, and a "Source code" ghost button only when `repo_url` is set.

### State 3: the enlarged photo (`ImageView`)
- **Opening.** A click on a tile flies it (FLIP, 0.9s expo.out) to the centre of the band between the top label and the
  counter. It is at most 80% of the stage's height and width.
- **Behind it.** The other tiles, the title and the info panel dim to 30% and blur 4px (600ms).
- **Stepping.** The label becomes "Close image". ← → (keys and buttons) step through the photos with a short crossfade, and
  the strip scrolls that tile behind the photo. A mono `02 / 11` counter sits below.
- **Closing.** Esc, the label or a click outside the photo closes it. It flies back to its tile (0.7s expo.out), and focus
  returns there.

### Phones (< md: `ProjectsIndex`, `ProjectDetail`)
- **No WebGL.** The reel is a horizontal scroll-snap carousel of 78vw cards.
  - Each card turns in 3D towards the centre, by up to 26° depending on its distance.
  - The same vertical title (`ReelTitle`, up to 11svh a letter) sits over the cards.
  - A `01 / 12` counter and the summary sit below.
- **Project page.** A card links to `/projects/<slug>`: the info panel, then the photos stacked (two columns from md, under
  reduced motion).
- **Viewer.** Tapping a photo opens a full-screen viewer (portalled, z-90). Swipe or ← → moves between photos; Esc or
  "Close image" closes it, and focus returns to the photo.
- **Image loading.**
  - The carousel's first two covers and the project page's first photo load eagerly.
  - Where the carousel is hidden, its `sizes` is 1px, so other screens fetch only a 16px thumbnail.
  - The strip's cover does the same where the stage is hidden.

### Reduced motion
A grid of project cards (1/2/3 columns) linking to the plain project page. There is no WebGL, no bending, no flight, no split
title and no letter animation, and the footer shows.

---

## 17. Events (`app/events/page.tsx`, `components/events`)

```tsx
<EventsExperience events={getEventShowcase()}>   // client: owns the active event, filter, autoplay, overlays
  <EventTint />                                  // fixed accent glow behind everything
  heading + filters
  <EventShowcase />                              // the feature card, thumbnails, progress
  <AllEvents />                                  // [02] Archive: every event, grouped by year
  <EventDetail />, <Lightbox />                  // overlays (the gallery's Lightbox, §14)
</EventsExperience>
```

A streaming-app style showcase: one big card per event, its subject popping out above the card's top edge.

### Order, heading and filters
- **Order** (`sortShowcase`): upcoming first (soonest first), then past (newest first).
- **Heading**: the page's `h1` is the mono label `Events / [06] Total`. Under it, filter `Pill` buttons (`aria-pressed`):
  All, Upcoming, Past and each year, newest first (`eventFilters`). The current one is `white`, the rest `raised`.
  Changing the filter keeps the current event if it still matches, otherwise it shows the first that does.

### The feature card (`EventShowcase`)
- **Size**: 86vw × 62vh, centred, `rounded-card`, `data-cursor="drag"`. Phones: full width with 16px margins, 70svh.
  The card is a size container, so everything inside is sized in `cq*` units.
- **Banner**: 16:9, cropping like `object-cover`. When the card is wider than 16:9, it crops the top first (up to 9% of
  the banner, `EVENT_BANNER.cropTop`), then the bottom, so heads stay in. When it is narrower, it is anchored at
  `banner_focal_x`. Two gradients sit over it: `bg` from the bottom (50%; 65% on phones, where the title sits over more of
  the picture) and from the left (40%, 75% strong).
- **Cutout convention**: `cutout_url` is the banner's subject on a transparent PNG, **the banner's width and 1.2× its
  height, bottom edges aligned**, so the extra 20% sits above the banner. Put the top of the head about **5% of the banner
  height above the banner's top**. The page lays it exactly over the banner, unclipped at the top, so the head and
  shoulders rise above the card: about 30px on phones, about 7% of the width on desktops. The cutout layer is clipped at
  the card's sides only, and fades out downwards (from 40% to 62% of the card height; from 12% to 32% on phones) so the
  title reads over the banner, not over a sharp figure. Without a cutout the card is just the banner.
- **Bottom left**: the title (Sora 700, white, `clamp(2.5rem, min(6vw, 11cqh), 5.5rem)`; phones `clamp(2rem, 9vw, 3rem)`;
  the `cqh` cap keeps it inside short cards), the 13px details line (date | venue | tags | status badge, hairline
  dividers; a divider never ends a wrapped line), then:
  - **upcoming**: the countdown (`Countdown size="sm"`) and a "Register" `IrisButton`, only when `registration_url` is set;
  - **past**: a "View gallery" ghost `PillButton` to `/gallery/<slug>`, only when the event has a journal.
- **Status badge**: "Registrations open" in a `maroon` Pill (`raised` in lists), or "Completed" in a muted pill (`bg-text/10`).
- **Thumbnails** (`EventThumbs`, 120 × 72, 10px radius, §2): a past event shows its photos (they open the lightbox, VIEW
  cursor); an upcoming event shows the other events (they switch to them). Hover or keyboard focus widens one to 220px over
  500ms (`ease-power3`) with its title or caption underneath, and its neighbours move aside. The row scrolls sideways with
  faded edges when it doesn't fit.
- **Chrome**: a frosted round expand button top right (opens the detail overlay), prev/next round arrows on the card's
  side edges (higher up on phones, clear of the text), and under the card a progress bar of one segment per event (buttons)
  with an `01 / 06` counter. The active segment fills over the autoplay time.

### Background tint (`EventTint`)
A fixed layer behind the page: a radial `color-mix(in oklab, accent 12%, bg)` centred behind the card (4% at mid-radius),
fading to `bg`, so the page stays matte black with a faint red light. The colour is a registered `@property --tint`, so it
crossfades over 900ms. The colour is `accent_color`, or the banner's dominant colour sampled on a canvas from a 64px
`/_next/image` copy (`useEventColor`, cached per banner) and snapped into the palette (`paletteTint`): warm, saturated
hues give `--red`, anything else `--maroon`. A colourful banner never brings a foreign hue onto the page.

### Switching
- **Ways in**: the arrows, ← / → anywhere on the page (not in fields, the menu or an overlay), a touch or mouse swipe on the
  card (past min(80px, 12% of the width); a swipe never counts as a click), event thumbnails, the progress segments and the
  All events grid.
- **Autoplay**: the next event every 7s (the progress segment's `animate-grow-x`; its `animationend` steps on). Paused while
  the pointer is over the card, while less than 35% of the showcase is on screen, while the tab is hidden or an overlay or
  the menu is open. It stops for good once the visitor does anything.
- **Leave**: the title, details and thumbnails (`[data-ev-leave]`) fade down 12px over 250ms. The next banner preloads
  meanwhile; the new event comes in once both are done (at most 1s waiting for the banner).
- **Entrance** (every switch, GSAP; the first load uses the same steps as CSS keyframes from the server HTML, §5):

| From the start | What |
| --- | --- |
| 0 | The banner fades in behind a left-to-right `clip-path` wipe while its image scales 1.08 → 1 (0.8s expo) |
| 150ms | The cutout rises 40px and fades in |
| 300ms | The title's letters rise out of per-word masks, 30ms apart |
| 550ms | The details and actions fade in |
| 650ms | The thumbnails slide up 20px, 40ms apart |

- **Accessibility**: the section is a carousel (`aria-roledescription`), a polite live region announces "2 of 6: RoboWars
  2026", and the title has a screen-reader copy so the split letters aren't read one by one.

### Detail overlay (`EventDetail`) and lightbox
- **Detail overlay**: full screen, portalled at z-80 (above the header, below the lightbox). It shows the banner, the
  title, the date, venue, tags and status, the summary and full description, the countdown and Register (upcoming) or
  "Open the journal" (past), and every photo in a masonry. While open it makes the page `inert`, stops Lenis and locks the
  scroll. Esc or Close closes it and focus returns to the expand button.
- **Lightbox**: the gallery's `Lightbox` (§14) over the event's photos. Opened from the overlay, the overlay goes `inert`
  until the lightbox has fully closed.

### All events (`AllEvents`)
`[02] Archive`, "All events", then one block per year (newest first, with a `[04]` count): 2 / 3 / 4 columns of cards (the
banner at 4:5, `rounded-image`; the title, the date and a quiet status badge). Clicking one scrolls back up (Lenis, 1.2s)
and switches the showcase to it; the showing event's card has a ring.

### Phones
The card is 70svh, the title smaller, the thumbnails scroll sideways and the pop-out is about 30px (the card is portrait,
so the banner is cropped at the sides and the subject is large).

### Reduced motion
Switches are a 0.3s crossfade (no wipe, scale, rises or staggers), there is no autoplay, the first-load keyframes don't run
and the thumbnails widen instantly. The tint changes instantly.

### Placeholders
The banners and cutouts in `/public/events/` are generated placeholders (procedural scenes, the robot poster and the
members cutout figure), graded into the palette: dark areas fall to black and charcoal, and only bright, colourful light
maps through maroon and red to warm white. Replace them with real art that follows the cutout convention above; real
photography keeps its own colours, but event art made for the site should follow the same grade.

---

## 18. The drone (`components/drone`)

A small club quadcopter built in code, used in two places:
- on the home page, as the robot's **sidekick** in the hero, in the robot's own canvas (§12, `Sidekick.tsx`);
- on **`/lab/drone`**, a test bench where it flies over a dashboard of club stats with its own canvas, so each effect
  (fly to a card, scan, globe, flip, dissolve, reassemble) can be checked in isolation.

Its lights are the site's deep red (maroon for glows), per §1; the reference it was designed from was cyan and violet.

### The drone (`Drone.tsx`)
Primitives in code, about 1.6 units across (rotor tip to tip on the diagonal): a rounded matte light grey body
(`#C9CBD1`, the one light material, like brushed aluminium) with a dark glossy top panel, a front LED strip in the iris
sheen, four arms in an X (dark metallic), motor pods with an emissive red ring under each rotor, two-blade props drawn
with a faint motion-blur disc, and a gimbal with a red lens dot. Seen from a little above (base pitch 0.42 rad).
Emissive parts are pushed past 1.0 (`GLOW`) and not tone mapped. `power` (0–1, a ref read every frame) slows the rotors
and dims the rings and lens: the sidekick naps at 12%.

**Flight on the bench** (`DroneRig`, `FLIGHT`): a damped spring to the director's target (§7). It tilts towards its motion
(velocity × 0.11 + acceleration × 0.016, **capped at 20°**), yaws a little into lateral motion (≤ 0.5 rad), bobs ±0.035
units while slow, and wobbles slightly. Phones: 60% scale. (The home sidekick, §12, flies its own way: `Sidekick.tsx`.)

### Effects
- **Trail** (`Trail`; `max`, `life`, `size` props): ONE `Points` ring buffer. The bench: max **1500** (750 on phones). Emission ≈ 2 + 260 × speed per second
  (≤ 700/s), from behind the rotors; each particle drifts down, slows, shrinks and fades over **1.4s** (all in the vertex
  shader; the CPU only writes new particles). Red, a quarter warm white, additive. The sidekick (§12): 300, 0.8s.
- **Scan beam** (`ScanBeam`): an open cone from the lens to the card (radius ≤ 34% of its width), additive, brightest at
  the apex and fading towards the card, brighter at its silhouette edges, with scanlines running down.
- **Globe** (`HoloGlobe`): 620 Fibonacci dots, latitude and longitude rings, 8 city points and arcs with pulses, turning
  slowly on a tilted axis; it reveals from the bottom up, the far side dimmer, with a light cone up from the top panel.
- **Dissolve** (`Dissolve`): 900 surface samples (420 on phones) become points that peel from the nose back and shoot
  down and towards the camera as streaks (longer as they speed up). A pure function of the amount.
- **Bloom** (`DroneCanvas`): `@react-three/postprocessing` Bloom (threshold 1, mipmap blur, intensity 1.15) then ACES
  tone mapping, so only the emissive parts bloom and the look matches with bloom off. Off when `deviceMemory` ≤ 4
  (`?drone=nobloom` / `?drone=bloom` force it).

### Bench performance
- The canvas loads with `next/dynamic` (`ssr: false`), mounted in idle time once the bench is within a screen and
  unmounted when it is further away; it renders only while the bench is on screen and the tab is visible.
- dpr `[1, 1.5]`. Every shader is compiled at mount and drawn for 4 warm-up frames (the canvas renders for 0.8s after it
  mounts, off screen), so the beam, globe and dissolve never stall a frame when they first appear.
- If frames run slower than 45fps, the trail's emission drops (to 30% at worst) before anything else; it recovers above 58fps.

### The bench (`/lab/drone`: `DroneLab`, `MissionDashboard`, `DroneStage`)
- A full-height box with a faint maroon radial glow and six stat cards (`getMissionStats()`, §8): Members (running total by
  joining year), Projects built (per lab domain), Events this year, Next event (`Countdown size="sm"`), Workshops run,
  Competitions won. A scanned card (`data-scanning`) lifts (`translateZ(40px) rotateX(8deg)`), gets a red border and glow,
  and re-counts from 0.
- Buttons (`droneActions`): choose a card, then Fly to card, Scan card, Globe on/off, Flip, Dissolve, Reassemble, Follow
  cursor (hover or tap a card to scan it; patrols after 4s still), Patrol, Home. Live speed, tilt, particles and fps.
- `window.__drone` (state, actions, store) exists on this page only, for scripted checks.
- Reduced motion or no WebGL: `/drone-poster.png` (a render of the model, 884×508, transparent) instead of the canvas.

---

## 19. Achievements (`app/achievements/page.tsx`, `components/achievements`)

```tsx
<AchievementsExperience items={getAchievements()}>   // client: filter, crossfade, list → slide
  <section h-svh>                                     // the slider (100svh, under the transparent header)
    <AchievementsSlider key={filter} />               // remounts per filter
    heading + filters                                 // top left, under the header
  </section>
  <AchievementsList />                                // [02] Record: every achievement, grouped by year
</AchievementsExperience>
```

A full-screen card-expansion slider: the current achievement fills the screen, the next ones wait as a row of cards on
the right, and the first card grows into the next background.

### Layout
- **Background**: the active photo (`object-cover`) under a gradient from `black/75` at the left to `black/20` at the
  right (phones 60% → 25%), a light radial vignette, and soft scrims at the top (under the header) and the bottom.
- **Heading and filters** (top left, under the header, 6vw in from md): the page's `h1` is the mono label
  `Achievements / [06] Total`; under it the filter `Pill` buttons All, Competitions, Research (`aria-pressed`; the current
  one `white`, the rest `raised` with a blur).
- **Text** (left, max 520px, 6vw in; centred in the band between the filters and the controls from md):
  - a short red dash and "event / location" (13px);
  - the title in **Anton** (§3), uppercase, two lines split at the space nearest the middle (`titleLines`), each line in
    its own mask: `clamp(3rem, min(7vw, 11svh), 6.5rem)`, line-height 0.95 (phones `clamp(2.2rem, 10vw, 3.2rem)`);
  - the result badge (`ResultBadge`: a win in red, anything else `bg-text/10`) and the date in mono (IST, "12 DEC 2025");
  - the description (15px, muted, at most 3 lines) and the team (small, after a mono "Team");
  - a round red share button (system share sheet, else it copies `/achievements?a=<slug>` and says "Link copied"), and
    a ghost `PillButton` "View certificate" / "Read paper" (research), only when `link` is set.
- **Waiting cards** (`ACH_CARD`): the next achievements in order, from 52vw to past the right edge (one card always starts
  off screen), 170 × 260, 18px apart, 16px radius, a soft shadow, the photo with a dark bottom gradient, the title (12px
  bold caps, two lines) and the result (10px mono). `data-cursor="view"`.
- **Bottom**: round frosted prev/next buttons at the left, a hairline track whose fill shows the position, and the slide
  number at the bottom right (Sora 700, 64px, an `Odometer` that rolls each digit as a 0–9 column, with `/ 06` in mono).
- **Autoplay line**: a 2px red line just under the header that fills over the autoplay interval.

### Motion (`AchievementsSlider`; numbers in `ACH_MOTION`)
Every achievement near the current one (the current one, the previous one, the next two, and a far card while it is
being opened; the outgoing one stays until a change ends) has a full-screen background **layer**, mounted with its photo
loaded and hidden until needed. A change waits for the target photo to decode (at most 900ms), so a card never grows
empty.
- **Next / a card click**: the target's layer starts exactly on its card (same box, 16px radius, the same card face) above
  the old background, and grows to cover the section over 1.1s `expo.inOut` (the radius goes to 0, the card face fades
  out, the background shade fades in). It **is** the new background when it lands: nothing is swapped, so there is no blank
  frame.
- **Prev**: the reverse: the previous achievement waits underneath, and the current background shrinks into the first card
  slot (the shade fades out, the card face fades in), where the card takes over.
- **Cards**: keyed by slug and laid out per slot, so a change FLIP-slides each card to its new slot (0.9s `expo.inOut`,
  60ms apart). A card new to the row fades in at the far end; one that a card click passed over fades out where it was
  first; one that leaves the row while on screen fades out (a copy of it does).
- **Text**: the old title lines slide up out of their masks and the rest fades (300ms) as the card starts growing; at 90%
  of the growth the new title lines rise (0.9s expo, 80ms apart), then the event line, badge, description, team and
  buttons fade up (50ms apart). The first load plays the same entrance as CSS keyframes (`animate-rise`,
  `animate-fade-up`) from the server HTML.
- **Number**: the odometer rolls to the new number (900ms expo) as the change starts.
- **Filters**: the slider fades out (0.3s), remounts for the filtered list, and fades in (0.6s) once its first photo is
  decoded.

### Behaviour
- **Autoplay**: the next achievement every 6s (the red line fills, then the change plays). Paused while the pointer is over
  the slider or focus is inside it, while less than 35% of it is on screen, while the tab is hidden or the menu is open, and
  for 10s after any action. It loops.
- **Ways in**: the arrows, ← / → while the slider is on screen (not in fields or with the menu open), a touch swipe (past
  min(80px, 12% of the width); a swipe never counts as a click), a card click (that card grows), and the list below.
- **`?a=<slug>`** opens on that achievement (the share link).
- **Loading**: the first photo is preloaded; the other layers and the cards load eagerly at low priority (no preload in the
  head competing with the first photo).
- **Accessibility**: the slider is a carousel (`aria-roledescription`); a polite live region announces "2 of 6: Swarm Map
  Merging, Best Paper"; the cards are buttons ("Show <title>, <result>").

### All achievements (`AchievementsList`)
`[02] Record`, "All achievements", then one block per year (newest first, with a `[03]` count): a row per achievement with
the date (mono), the title (Sora 600), the event / location (muted) and the result badge, on hairlines. The showing one has
a red dot. Clicking a row scrolls back up (Lenis, 1.2s) and then opens that slide (its card grows); a row outside the
current filter switches to All first and the rebuilt slider starts on it.

### Phones (< 768px)
The cards are a small strip along the bottom (110 × 160, 10px apart, from 16px in), above the controls, with the text
above them; the title is `clamp(2.2rem, 10vw, 3.2rem)`. The expansion works the same. On phones the text, the strip and
the controls are laid out in flow (the slider is at least a screen tall, its text bottom-aligned above the strip), so a
short phone makes the section taller instead of overlapping the filters.

### Reduced motion
No expansion and no sliding: the new background crossfades in (0.45s); the cards switch at once and the text when it ends. No
autoplay, and the first-load keyframes don't run.

### Placeholders
The photos in `/public/achievements/` are generated placeholder scenes graded into the palette, and the links point to
`example.com`; replace both with the real ones.

---

## 20. Contact (`app/contact/page.tsx`, `components/contact`)

```tsx
<ContactHero email badge partners />   // 100svh: headline over a planet's glowing horizon
<ContactPanel {...settings} />         // the app-window panel rising from the horizon: details, form, map
<ContactFaq />                         // [02] FAQ: an accordion
```

Built from a reference of a dark SaaS hero (a centred headline, a glowing planet horizon, an app window rising under the
glow); here the window is the contact form, and the light is the site's red.

### Hero (`ContactHero`)
- **Background**: `bg` with a faint dot texture (`contact-dots`) and 46 tiny stars (1px, a few 1.5px; 20–40% opacity,
  fixed seeded positions in the top 64%) twinkling slowly (`animate-twinkle`, 3.5–7.5s each).
- **Content** (centred, max 760px):
  - a badge `Link`: a `bg-2` pill with a hairline, "Recruitment for 2026 is open" (`SENIOR_CORE_TERM.year`) and a small red
    circle with an arrow, to `join_form_url` or `/join`. While recruitment is closed: "Workshop: <title>" (the next
    workshop, else "Next up: <title>", the next event) to `/events`; with neither, no badge;
  - the `h1` "Let's build something together": Sora 500, `clamp(2.4rem, min(5.5vw, 8.5svh), 4.5rem)` (phones
    `clamp(2rem, 9vw, 2.6rem)`), tracking -0.04em, each word a warm white → 65% gradient clipped to the text;
  - a muted line (17px; 15px on phones) and two buttons: "Email us" (ghost `PillButton`, mail icon, `mailto:`) and
    "Send a message" (`IrisButton`: scrolls to the form with Lenis over 1.2s, landing 24px under the navbar, then focuses
    Name). Phones stack them full width;
  - above the arc, the mono label "Trusted by our partners" and the partners' logos (`getPartners()`), greyscale at 50%
    (80% on hover). No partners, no row.
- **The planet**: the hero is a column (header padding, content, logos, then a band 32svh tall), and the rim is the top
  of that band, so on a full-height hero it sits at 68% and a taller one (short screens) pushes it down instead of
  overlapping. Inside the band:
  - the surface: a circle 180vw wide (260vw on phones, so the arc stays gentle), `contact-planet`: red at 15% under the
    rim fading to `bg` within ~34svh, plus a brighter band just under the rim;
  - the rim: the same circle with `contact-rim` (a 2px edge of red mixed with warm white, a tight glow, a wide glow and a
    glow on the surface);
  - the streak: the same circle with `contact-streak`, a conic wedge masked to the edge;
  - the surface, rim and streak sit in a band clipped from 10rem above the rim to 64svh below it, fading out at the
    bottom, so the planet never covers the page below;
  - above it, a wide radial red glow centred on the rim (so past the planet's sides it fades below the rim too), a
    blurred bright spot (46vw × 14svh, red at 55%, blur 44px) and a small warm white core at the apex.
- **Load** (CSS keyframes from the server HTML): the planet rises 25vh into place over 1.6s (expo) while the rim's glow
  fades in, like a sunrise; the badge fades up at 300ms, the words rise out of masks from 400ms (60ms apart), then the
  line, the buttons and the logos.
- **Idle**: the rim breathes (opacity 1 ↔ 0.85, 5s); a short light runs along the rim from left to right every 8s.
- **Cursor** (md+, fine pointers): the bright spot and the core move towards the cursor's x, up to 10vw at the screen's
  edges (`gsap.quickTo`, 1.4s; the core at 55%).
- **Scroll** (scrubbed): the planet moves at 0.6× the page (parallax: it drifts down 0.4× the scroll inside the hero),
  and the text is gone by half the hero's height.

### The panel (`ContactPanel`, `ContactDetails`, `ContactForm`)
- **Window**: max 1120px, 24px radius, `bg-2/85` with `backdrop-blur-xl`, a hairline ring, a deep shadow, and a red line
  with a soft red glow along the top edge. It overlaps the hero's bottom by 16svh (18svh on phones), so it stands on the
  planet.
- **Stand-up** (scrubbed from the top of the page until its top reaches 25% of the screen): from md it rises 80px and tilts
  from `rotateX(18deg)` to flat, hinged at its bottom edge, under `perspective: 1400px`; phones only rise.
- **Columns**: sidebar 240px | form | map 300px from lg; md puts the map in a full-width row under the other two; phones
  stack sidebar, form, map. Hairlines between them.
- **Sidebar** (`ContactDetails`): the logo mark, the club and the college, then a row per way in (Email, Phone, Lab
  address, Instagram, LinkedIn, GitHub; only those set): an icon in a small ring, the mono label, a copy button, and the
  value as a link below (mailto, tel, Maps, the profile). Copy writes the full value (the Clipboard API, else a textarea
  fallback); the button turns into a tick in a red ring with a "Copied" pill beside it for 1.5s, and a status region
  announces it.
- **Form** (`ContactForm`): Name and Email (two columns from sm), Subject (a native select: General, Join the club,
  Collaboration, Sponsorship, Workshop request, Other; it starts on "Choose a subject"), Message (a textarea, a mono
  `0 / 1000` counter, `maxLength` 1000). Fields: `bg/70`, 14px radius, a hairline ring; focus turns it red with a soft red
  glow; an error keeps it red, with the message under it (warm white beside a red dot, `aria-describedby`).
  - Validation: react-hook-form with `zodResolver(contactSchema)` (`lib/contact.ts`), `mode: "onTouched"` (a field is
    checked once left, then as you type; submitting checks all and focuses the first error).
  - A honeypot (`website`) sits off screen, out of the tab order.
  - Submit: a full-width `IrisButton`. Sending: a spinner and "Sending…", disabled. Sent: the form slides 56px left and
    fades (0.55s expo, then `inert`), and the sent state fades up in its place (a circle that draws itself and a tick,
    "Message sent. We'll get back within 48 hours.", "Send another", which clears the form and focuses Name). Error: an
    alert under the fields with the message and "Try again".
  - The server action `sendContactMessage` (§8) validates again and saves the message.
- **Map**: "Find the lab", a Google Maps embed (`mapEmbedUrl(map_query)`, no API key, lazy) at 340px from lg (260px md,
  220px phones), darkened with `filter: invert(0.9) hue-rotate(180deg) saturate(0.7)`, then the address and "Open in Maps".

### FAQ (`ContactFaq`)
`[02] FAQ`, "Good questions" and a "Send us a message" link (it scrolls to the form) in the left third; the questions
(`CONTACT_FAQ`, six) on hairlines on the right. A question is a button (`aria-expanded`); its answer opens by its grid
row going from 0fr to 1fr while it fades in (500ms power3), and the round + turns into a red ×. Several can be open; the
first starts open. Closed answers are `inert`.

### Reduced motion
No rise, breathing, streak, twinkle, cursor glow, parallax, fade or tilt: the planet, the panel and the text are in their
final places. The sent state appears without sliding, the check is drawn, and the FAQ opens instantly.

### Placeholders
The partners (names and logos), the phone number and the lab room in the address are placeholders.

---

## 21. Join (`app/join/page.tsx`, `app/join/apply/page.tsx`, `components/join`)

```tsx
<JoinHero recruitmentOpen year crowd={<Crowd variant="wide" /> + <Crowd variant="narrow" />} />  // 100svh
<JoinReveals>                                   // subtle fade-up reveals only
  <WhyJoin /> <TeamsSection teams hiring /> <HowItWorks /> <JoinFaq /> <JoinCta open />
</JoinReveals>
```

Simple and premium, from a reference of a big uppercase headline over a crowd of tiny flat-illustrated people filling
the bottom of the screen. The sections below share its calm: generous space, cards without borders, one radius, and
only fade-up reveals.

### Hero (`JoinHero`)
- **Background**: `bg` and one soft, wide red glow (a radial gradient, 10%) rising from behind the crowd. Nothing else:
  no grid, no stars, no shapes.
- **Text** (centred in the space above the crowd, which is the top 55%, 60% on phones): the mono label "Recruitment 2026"
  (`SENIOR_CORE_TERM.year`); the `h1` "Join our community" (Sora 700, uppercase, tracking 0.03em, `text`,
  `clamp(2.6rem, 6.5vw, 5.5rem)`; phones `clamp(2rem, 9vw, 2.6rem)`, on two lines); one muted line (17px, 15px on
  phones, max 480px); and one button, "Apply now" (`IrisButton` → `/join/apply`, its → slides 3px right on hover), or,
  while recruitment is closed, the "Get notified" email form (`NotifyForm`, §12).
- **The crowd**: the bottom 45% of the hero (40% on phones), edge to edge, cut off at the bottom; a dark gradient over its
  bottom 15% fades it into the page. Decorative and inert (`aria-hidden`, no pointer events).
- **Motion**: on load (CSS keyframes from the server HTML) the label, headline, line and button fade up 12px, 60ms
  apart, and the crowd fades in and rises 30px as one layer over 1.2s, just after; on scroll (scrubbed) the crowd moves at
  0.85× the page and fades out as the hero leaves. Nothing reacts to the cursor, and no figure moves on its own.
- **Reduced motion**: no fade-ups and no parallax; everything is in place.

### The crowd (`Crowd`, `buildCrowd` and `CROWD` in `lib/crowd.ts`)
- **Generated, not counted**: a fixed crowd from a seeded generator (mulberry32), the same on every visit and on the
  server and the client; it does not depend on the member count. md+: 271 people in 7 rows; phones: 108 in 5 rows. Both
  are server-rendered SVGs (the page shows one per breakpoint); no JS.
- **A figure**: front view, chest up, in local units (head radius 10): rounded shoulders with soft arm lines, a neck, a
  crew, V or collared neckline, ears, two dots for eyes (a small smile in the front rows), one of 8 hair shapes (crop,
  side part, buzz, long, bun, curly, bob, a headscarf), glasses on about a fifth and an event lanyard on some. Built from
  `<symbol>`s coloured per person through `fill` and `color`, so the markup stays small.
- **Colour** (`CROWD_PALETTE`: illustration colours, not UI tokens): natural, varied skin tones; clothes in charcoal,
  slate, warm grey, soft beige and deep navy, with about 8% of shirts in the accent red (muted a little); headscarves in
  the darker colours. Back rows are mixed up to 72% towards the page's black (66% on phones), as if further away.
- **Layout**: rows from the back (smaller, higher, darker) to the front (larger, lower; 0.74× to 1.22× on md+), each row
  spaced by its people's size with jitter in x, y and size, and every other row offset by half a place, so heads behind
  show between the heads in front. The box's height follows from the rows; the SVG fills the hero's band with
  `xMidYMax slice`, so narrower screens crop the sides: about 185 people are on screen at 1440 × 900 and about 40 on a
  390px phone, keeping them small and evenly spaced rather than shrinking them to a thin strip.

### The characters (`JOIN_CHARACTERS` in `lib/join.ts`)
- **Art**: transparent PNGs, 1254px square, chest-up, one per team (all in the club's black tee with the red chip logo),
  used as the team cards' avatars (`CharacterAvatar`, a round crop on the `face` box), beside the apply form's team, and
  peeking up from the last call. Management, PR and Social Media are the delivered files in `/public/join/`. Tech,
  Design, Multimedia and Research were delivered with a checkerboard painted into the pixels; their cut-outs
  (closed-form matting from a trimap of the checkerboard, faces protected) are in `/public/join/cutout/`, and the
  originals are untouched. Replace them with real transparent exports when there are some.
- **Per character**: the team and its slug (`/join/apply?team=`), the image, a one-line pitch, skills and the face box.
- **Hiring**: from settings (`isHiring`): recruitment open and the team in `open_teams`. The mock hires Tech, Research,
  Design and Multimedia.

### Sections (`JoinSections`, `JoinReveals`)
Calm: sections start `clamp(6.5rem, 18svh, 12rem)` apart; cards are `bg-2` with `rounded-card` and no border; nothing
moves on hover; the only motion is the reveal (each block, or each card in a list, fades in and rises 20px once at
`top 80%`, 0.06s apart). Nothing under reduced motion.
- **Why join** (`[01]`): four cards (Hands-on hardware, Real projects, Competitions and travel, Mentors and alumni): an
  icon in a quiet circle, a heading and two lines.
- **Teams** (`[02]`, `#teams`): a card per team in the teams' order: the character's face avatar, a status pill
  ("Hiring" in `maroon`, "Closed" muted), what the team does (`teams.description`), skill tags and "Apply to <team>"
  (ghost), or a disabled "Opens next round". 1 / 2 / 3 columns.
- **How it works** (`[03]`): Apply online, Task round, Interview, Welcome aboard, joined by a static hairline from dot to
  dot (across from md, down on phones).
- **FAQ** (`[04]`): an `<Accordion>` (§5): who can apply, experience, time, two teams, results.
- **Last call**: a wide `bg-2` card with a faint red glow from below, "Ready to build with us?", "Apply now" (or "Ask us
  anything" while recruitment is closed), and Design, Tech and PR peeking up from its bottom edge.

### Apply (`/join/apply`, `ApplyForm`)
- **Page**: "Apply to the crew", the hiring teams' avatars, and the form in a `bg-2` card. `?team=<slug>` preselects a
  hiring team; a closed team isn't preselected and the form says it opens next round. The form reads the query on the
  client inside `<Suspense>` (§9). While recruitment is closed, a note replaces the form.
- **Fields**: full name, phone (10-digit Indian mobile, `+91` optional), college email (`@bennett.edu.in`), year, branch,
  preferred team (closed teams disabled, the chosen team's avatar and pitch beside it), skills, why you want to join (a
  50–800 character counter), LinkedIn, GitHub (optional), and the resume: a dashed drop box (pick or drop a PDF, PNG,
  JPG or WebP, at most 5MB; it shows the file's name and size). The same `Field` and input style as /contact (14px
  radius, red focus glow, errors in warm white beside a red dot).
- **Validation**: react-hook-form with the zod schema in `lib/join.ts` (plus the resume, client-side), `onTouched`;
  submitting focuses the first error. `submitApplication` checks everything again on the server.
- **States**: sending (spinner, disabled), received (the form slides away; a drawn check, "Application received for
  <team>.", the reference, the next three steps, "Back to Join" and "Apply for someone else"), error (an alert with
  "Try again").

### Placeholders
The four cut-outs stand in for real transparent exports; the mock stores applications in memory and doesn't keep the
resume. The crowd is illustration, not the club's members.
