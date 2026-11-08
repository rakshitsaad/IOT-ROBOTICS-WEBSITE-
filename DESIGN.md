# DESIGN.md — IoT & Robotics, Bennett University

The design system and global layout for the club website. **Read this before every task.** If you change a token,
primitive or rule, update this file in the same change.

Check everything visually at **`/lab`**. The robot mascot's developer page is **`/lab/robot`** and the drone's is
**`/lab/drone`**; never link to them from the site.

**Direction: industrial minimalism × editorial design × engineering culture.** The site should read like the official
website of an established engineering organisation: dark neutral surfaces, warm white type, one deep red used sparingly,
hairlines instead of boxes, real information instead of decoration. Every element has a job. If a section starts to
look like a template (three identical cards, a pill on every word, a glow), redesign it.

---

## 0. Stack and project map

- Next.js 16 (App Router, TypeScript, **Cache Components on**, see §9), Tailwind CSS v4 (CSS-first config, no `tailwind.config`).
- Motion: CSS transitions and keyframes for almost everything; `motion` (Framer) for mount/unmount (menu, lightbox, form
  states); `lenis` for restrained smooth scrolling; `gsap` only inside the robot and drone code and the dev pages.
- 3D: `three`, `@react-three/fiber`, `@react-three/drei`, loaded lazily: the robot mascot in the home hero (§11) and the
  /lab/drone bench (§18, which also uses `@react-three/postprocessing`).
- State: `zustand` (`lib/store.ts`, client UI state only).
- Data: Supabase later. For now, typed mock data read through `lib/data.ts` (§8).

```
app/
  globals.css        tokens, Tailwind theme, the type scale, layout utilities, reveals, reduced-motion CSS
  fonts.ts           next/font setup (Sora, JetBrains Mono)
  layout.tsx         root layout: providers, header, footer, reveals
  template.tsx       route transition wrapper
  page.tsx           home (§12)
  about/             /about (§15)
  members/           /members, "Team" in the navigation (§13)
  projects/          /projects and /projects/[slug] (§16)
  events/            /events and /events/[slug] (§17)
  achievements/      /achievements (§19)
  gallery/           /gallery and /gallery/[slug] (§14)
  join/              /join and /join/apply (§21)
  contact/           /contact (§20)
  lab/               primitive showcase + robot and drone dev pages (noindex, not linked)
components/
  ui/                primitives (§5): Button, ArrowLink, Tag, TagList, MonoLabel, SectionHeader, PageHeader, FactList,
                     Photo, Accordion; GridBackground and CrossMark (dev pages only)
  layout/            Header, AnnouncementBar, MenuOverlay, Logo, Footer
  providers/         Providers, SmoothScroll, PageTransition, Reveals
  shared/            sections used on several pages: FocusAreas, ProjectCard, EventFeature, EventRow, JoinCta
  home/              HomeHero (+ HeroRobot), HomeIntro, FeaturedProjects, HomeEvents, HomeAchievements, Countdown, NotifyForm
  about/             AboutSections (Story, Purpose, Practice, History, PhotoSet, TeamsOverview)
  members/           MemberSections (SeniorCore, JuniorCore), MemberParts (Portrait, MemberSocials), SocialIcon
  projects/          ProjectsBrowser (filters, spotlight, grid), ProjectDetail
  events/            EventSections (NextEvent, UpcomingList, PastEvents)
  achievements/      AchievementsArchive (filters, the record, ?a= deep links)
  gallery/           MediaGrid (photo grid + lightbox), Lightbox, ShareButton, download.ts, icons
  join/              JoinSections, ApplyForm, CharacterAvatar
  contact/           ContactDetails, ContactForm, icons
  forms/             fields.tsx: Field, inputClass, SentCheck (shared by /contact and /join/apply)
  robot/             ClubBot mascot (§11)
  drone/             the drone (§18)
  lab/               /lab helpers (MotionDemos, RobotLab, DroneLab, MissionDashboard)
hooks/               useReducedMotion, useMediaQuery
lib/
  types.ts           row types for every Supabase table
  mock/              mock rows, one file per table
  data.ts            data access layer (the only thing pages import for data)
  actions.ts         server actions (notify, contact, apply)
  home.ts            the four focus areas (LAB_STATIONS)
  about.ts           mission, vision, the three pillars
  members.ts         the Senior Core term, social links, initials
  projects.ts        filters, categories, status labels, project images
  events.ts          IST dates, type labels, sorting
  achievements.ts    filters, category labels, isWin, dates
  gallery.ts         journal types and dates
  contact.ts         subjects, limits, the zod schema, FAQ, map URLs
  join.ts            team characters, isHiring, benefits, steps, FAQ, the application schema
  mission.ts         /lab/drone bench settings
  tokens.ts          JS mirror of the tokens
  motion.ts          EASE / BEZIER / DURATION / STAGGER constants
  gsap.ts            the only place GSAP is imported from and plugins registered
  store.ts           zustand UI store (lenis instance, menuOpen)
  nav.ts             navigation items and isActive()
  cn.ts              cn(): class joiner + tailwind-merge configured for our theme
  announcement.ts    announcement dismiss key + no-flash inline script
```

---

## 1. Colour tokens

Defined as CSS variables on `:root` in `app/globals.css` and exposed to Tailwind via `@theme inline`. **The default
Tailwind palette is removed**: only these colours exist (plus `white` and `black`). Use opacity modifiers
(`text-text/90`, `bg-text/5`) for tints. Never hard-code hex values in components.

| Token        | Value     | Tailwind                  | Use |
| ------------ | --------- | ------------------------- | --- |
| `--bg`       | `#0B0B0C` | `bg-bg`, `text-bg`        | Page background; dark text on the warm white fill |
| `--bg-2`     | `#151517` | `bg-bg-2`                 | Surfaces: form cards, the announcement bar, photo placeholders |
| `--bg-3`     | `#1D1D20` | `bg-bg-3`                 | Elevated: solid tags, the open menu button |
| `--line`     | `#29292C` | `border-line`, `divide-line` | Hairlines, borders, dividers |
| `--text`     | `#F1EEE8` | `text-text`, `bg-text`    | Headings, primary text, the active filter |
| `--muted`    | `#A7A39E` | `text-muted`              | Secondary: body copy, descriptions, inactive nav links |
| `--faint`    | `#77736F` | `text-faint`              | Tertiary: metadata, captions, mono labels. 4.1:1 on `--bg`, so 11–14px metadata only, never paragraphs |
| `--red`      | `#B71932` | `bg-red`, `text-red`, `border-red` | The accent |
| `--red-deep` | `#97152A` | `bg-red-deep`             | The primary button's hover only |
| `--maroon`   | `#5A1717` |                           | Robot materials and the dev pages only |

**Red is for:**
- the primary button (one per view: Join, Apply, Register, Send);
- the current page's bar in the navigation;
- accent tags: a win ("Winner"), "Registrations open", "Hiring" (a red dot and a red hairline, warm white text);
- small signals: the announcement dot, a pull quote's rule, the arrow of a hovered row, a form error's dot and ring.

Never red body text, never a red background block, no glows. Warm white on red is 5.6:1.

`--iris` (maroon → red → maroon) survives only as the mascot's bezel and in the dev pages (`bg-iris`, `iris-border`).

The JS mirror is `lib/tokens.ts` (`COLORS`, `ACCENTS`): use it only where JS needs a raw value (three.js materials,
canvas, GSAP colour tweens). Teams all map to red in `TEAM_ACCENT`; the `teams.accent` column must match it.

Gradients: none in the UI, except two quiet ones: the soft floor light under the robot in the hero panel, and
`bg-linear-to-*` scrims if a caption ever has to sit over a photo (avoid that; captions go under photos).

---

## 2. Radius

| Token              | Value | Tailwind          | Use |
| ------------------ | ----- | ----------------- | --- |
| `--radius-card`    | 10px  | `rounded-card`    | Form cards, the hero panel, fact lists, the map |
| `--radius-image`   | 6px   | `rounded-image`   | Photos and thumbnails |
| `--radius-control` | 6px   | `rounded-control` | Buttons, inputs, filter buttons, icon buttons |
| `--radius-tag`     | 4px   | `rounded-tag`     | Tags |
| `--radius-pill`    | 999px | `rounded-pill`    | Dots and status lights only |

Most content has no container at all: sections are separated by hairlines (`border-t border-line`) and lists by
`divide-y divide-line`.

---

## 3. Typography

Two families, loaded in `app/fonts.ts` with `next/font/google`:

| Family         | Tailwind                  | Use |
| -------------- | ------------------------- | --- |
| Sora           | `font-sans` (default)     | Everything. Body 400; UI and emphasis 500–600; headings 600–650. |
| JetBrains Mono | `font-mono`, `mono-label` | Small technical text: labels, dates, counts, tags, the tech stack, the countdown digits. |

The scale is a set of utilities in `globals.css`, so every page uses the same sizes:

| Utility        | Size                             | Use |
| -------------- | -------------------------------- | --- |
| `type-display` | `clamp(2.6rem, 6.2vw, 6rem)`     | The home hero headline only (~76–96px on large desktops) |
| `type-h1`      | `clamp(2.4rem, 5vw, 4.25rem)`    | Inner page headings (~52–68px) |
| `type-h2`      | `clamp(1.75rem, 3vw, 2.625rem)`  | Section headings (~32–42px) |
| `type-h3`      | `clamp(1.2rem, 1.7vw, 1.5rem)`   | Card and item headings (~20–24px) |
| `type-lead`    | `clamp(1.0625rem, 1.4vw, 1.25rem)` | Page intros. Pair with `text-muted` |
| `type-body`    | 15px (16px from md), line-height 1.7 | Body copy. Pair with `text-muted` |
| `mono-label`   | 11px (12px from md), +0.12em, uppercase | Labels. Usually `text-faint` |

Headings use negative tracking (built into the utilities) and `text-balance`. The only larger type outside these is the
closing invitation's heading (`clamp(2.25rem, 5vw, 4rem)`, `JoinCta` and the /join last call). Don't add new display sizes.

Fluid sizes in a class: `text-[clamp(...)]`. tailwind-merge treats the `type-*` utilities as font sizes, so a `text-[..]`
passed later overrides them.

---

## 4. Layout

- **Mobile first, works from 360px.** Test at 1440, 1280, 1024, 768, 390 and 360. No horizontal scroll, ever.
- `shell`: content up to **1320px** wide, centred, with side padding `--gutter` (20px, 32px from md, 48px from xl).
- The grid: a **12-column** grid from lg (`lg:grid-cols-12 lg:gap-8`). Typical splits: 7/5 (hero), 5–6/6–7 (copy beside
  a photo), 4/8 or 4/7 offset (a heading column beside a list), 2/10 (a year beside its entries).
- `section-y`: vertical padding between sections, `clamp(4.5rem, 9vw, 8rem)`. Sections are separated by
  `border-t border-line`.
- `--nav-h`: 64px (72px from md). `--ann-h`: 36px, or 0 when the announcement is off or dismissed. `pt-header` clears both;
  every page's first section uses it (`PageHeader` does).
- `[id]` elements get `scroll-margin-top` for the header, so in-page anchors land below it.
- `html` has `scrollbar-gutter: stable`, so locking scroll causes no layout shift.
- Focus rings: 2px warm white, offset 3px. Selection: red with warm white text.
- Spacing comes from Tailwind's 4px scale; stick to multiples of 4 (mostly 8).

---

## 5. Primitives (`components/ui`)

Import from `@/components/ui`. Every primitive accepts `className`, merged with `cn()` (tailwind-merge knows our colours,
radii, fonts, eases and type utilities). When you add a token to `globals.css`, add it to `lib/cn.ts` too.

### `<Button variant size arrow>`
The one button family. `variant`: `primary` (red fill, the view's main action; hover `--red-deep`), `secondary` (warm
white hairline), `ghost` (text only, a faint fill on hover). `size`: `sm` 36px, `md` 44px, `lg` 48px. `arrow` adds → for
internal links and ↗ for external ones, nudging on hover. With `href` it renders a Next `Link` (internal) or an `<a>`
(external links open in a new tab; `mailto:`/`tel:` don't); otherwise a `<button>`.

### `<ArrowLink href>`
A quiet text link with an arrow ("All projects →", "Source code ↗"), for navigation inside content.

### `<Tag tone>` and `<TagList items>`
Small metadata labels: mono 11px, 4px radius, a hairline. `tone`: `default` (technologies, categories), `accent` (a red
dot and red hairline: a win, "Registrations open", "Hiring"; one per item), `solid` (charcoal fill: "Completed",
"Closed").

### `<MonoLabel index tone as>`
The technical label. With `index`, renders "01 —— Label" (the number, a short hairline, the label). `tone`: `faint`
(default), `muted`, `text`, `red`.

### `<SectionHeader index label title intro action layout>`
How every section starts: the indexed label and an h2, with an optional intro and an `ArrowLink`. `layout="split"`
(default) puts the intro on the right from lg; `stack` keeps one column. It carries `data-reveal`.

### `<PageHeader label title intro aside>` and `<FactList items>`
The top of every inner page: clears the header, a mono label, the h1, the lead and optional actions (children), with an
optional `aside` on the right from lg; it ends on a hairline. Its text fades up on load (CSS, from the server HTML).
`FactList` is the usual aside: a 2-column grid of counts taken from the data ("Members 47").

### `<Photo src alt sizes ratio priority position zoom>`
Every photo goes through it: a fixed aspect ratio (so no layout shift), `rounded-image`, a charcoal placeholder while
it loads, `object-cover` at `position` (a member's focal point). `zoom` scales it to 1.03 over 700ms when an ancestor with
`group/photo` is hovered. Without `src` it renders `PhotoPlaceholder`: charcoal with a faint frame icon, never an
invented picture.

### `<Accordion items defaultOpen>` (client)
Questions on hairlines. Each question is a button (`aria-expanded`) with a square +/× control; the answer opens by its
grid row going from `0fr` to `1fr` while it fades in (450ms power3) and is `inert` while closed. Used by the /join and
/contact FAQs.

### Utilities (`globals.css`)
`type-*` and `mono-label` (§3), `shell`, `px-gutter`, `pt-header`, `section-y` (§4), `bg-iris` / `iris-border` (dev only).
Animations: `animate-rise` (a line rising out of an overflow-clipped mask, 1s expo; the home headline),
`animate-fade-up` (12px up and in, 0.8s power3; page headers), `animate-grow-x` (a bar filling, dev pages). Always
behind `motion-safe:`. A `var()` inside an `--animate-*` value resolves once on `:root`, so stagger with
`[animation-delay:120ms]`.

---

## 6. Global layout (`app/layout.tsx`)

Order: the inline no-flash script, a skip link, `<Providers>` → `<Header>` → `<main id="main">` → `<Footer>` →
`<Reveals>`.

- **Announcement bar** (`AnnouncementBar.tsx`): a compact 36px line on `bg-2`: a red dot, the text and its link from
  `settings`, and a dismiss button. The dismissal is stored in `localStorage` against a hash of the text and link (an
  inline script hides it before first paint, `html[data-ann="off"]`). It collapses once the page has scrolled 24px or
  the menu is open.
- **Navbar** (`Header.tsx`): fixed, solid `bg`, with a hairline under it once the page has scrolled 24px.
  - Left: the logo (`Logo.tsx`): the robot-face mark with its red "online" light, the club name and the university in
    mono.
  - From lg: the section links (`NAV_PRIMARY` in `lib/nav.ts`): About, Team (`/members`), Projects, Events, Achievements,
    Gallery, and Contact from xl. Inactive links are `text-muted`; the current section (`isActive()`, so
    `/projects/swarmbots` marks Projects) is warm white with `aria-current="page"` and a 2px red bar on the header's
    bottom edge. The links read the path inside `<Suspense>` (§9).
  - Right: "Join the club" (primary, small; "Join" below sm) → `join_form_url` or `/join`, and below lg the menu
    button.
- **Menu** (`MenuOverlay.tsx`, below lg): full screen under the header (z-40 vs z-50), so the menu button becomes its close
  button. Every page (`NAV_ITEMS`) on hairlines with a mono index; the current page gets a short red bar. Then a
  full-width "Join the club", the email and the socials. Locks scroll (stops Lenis), makes `main` and the footer
  `inert`, focuses the first link, closes on Escape, a link click, a route change or the window growing past lg, and
  returns focus to the menu button.
- **Footer** (`Footer.tsx`): the logo, the university and the tagline; Explore and Club link columns; Follow (the socials
  from `settings`); Contact (email, phone, lab address, only those set); then the copyright line and "Back to top".
- **Route transition** (`app/template.tsx` → `PageTransition`): client navigations fade in and rise 12px (0.6s
  power3.out). The first server-rendered page isn't animated, and nothing animates under reduced motion.
- There is no custom cursor.

---

## 7. Motion

Motion is there to confirm an action or ease content in, never to perform. No scroll-jacking, no pinning, no scrubbed
scenes, no ambient loops, no cursor followers (the mascot's head following the cursor is its character, §11).

| What | How |
| --- | --- |
| Hover and press feedback | CSS transitions, **300ms** `ease-power3` (colours, borders, a 2–4px arrow nudge) |
| Photo hover | scale 1.03 over 700ms `ease-power3` (`<Photo zoom>`) |
| Page header and home hero text | CSS keyframes from the server HTML: `animate-fade-up` / `animate-rise`, 60–120ms apart |
| Content below the fold | `data-reveal`: fades up 16px once, 0.8s power3, as it enters (`Reveals.tsx`) |
| Route change | fade + 12px rise, 0.6s (`PageTransition`) |
| Menu, lightbox, form states | Motion (`AnimatePresence`), 0.2–0.6s |
| Accordion | grid rows 0fr → 1fr, 450ms power3 |
| Scrolling | Lenis, `lerp: 0.14` (a short glide), anchors offset below the header |

**Reveals** (`components/providers/Reveals.tsx`): one IntersectionObserver for the whole site. Content is visible in the
server HTML; when the script runs, elements already on screen are marked shown first and only then does
`html[data-reveals]` switch the hiding on, so nothing above the fold flickers. Stagger siblings with an inline
`--reveal-delay` (60–80ms). It re-scans after navigations and streamed content.

House easing: `power3.out` (`ease-power3`, `BEZIER.out`) by default; `expo.out` (`ease-expo`, `BEZIER.expo`) for the
headline rise and the menu button. Durations: 300ms for feedback, 0.6–1s for entrances.

**Reduced motion**: no Lenis, no reveals (everything is visible), no keyframes, no route transition; `globals.css` cuts
every transition and animation to ~0ms, and Motion components pass `initial={reduced ? false : ...}`. The robot is the
blinking poster (§11). Check `useReducedMotion()` / `prefersReducedMotion()` in any new animated component.

---

## 8. Data

- Row types for every table in `lib/types.ts`: `members`, `teams`, `projects`, `events` (`ClubEvent`), `achievements`, `gallery_items` (`GalleryItem`), `milestones`, `partners`, `contact_messages` (`ContactMessage`), `settings` (single row). Columns are snake_case so generated Supabase types can replace them.
- `members`: `tier` (`senior` = Senior Core, `junior` = Junior Core, shown grouped by team, `member`), `sort_order` (display order within the tier), `kicker` (short role line, "The President"; not shown at the moment, the profiles use `role`), `quote` (max 140 characters), `bio`, `photo_url`, `focal_point` (where a cropped portrait is anchored: a CSS `object-position` value, default `DEFAULT_FOCAL_POINT` = `"50% 30%"`), `cutout_url` (optional transparent PNG of the person; not shown at the moment), `socials` (jsonb: `{ linkedin, github, instagram }`, each a URL or null).
  - Limits are per tier in `MEMBER_LIMITS` (`lib/types.ts`): quote 140 for every tier; bio **300** for seniors (and `member`), **160** for juniors. The mock throws if a row breaks its tier's limit.
  - The mock has 8 seniors with placeholder portraits; `/members/cutout-1.png` is a generated placeholder figure, not a real cutout. It also has 33 juniors across all 7 teams: Tech has 10, Manav Arora (Tech) and Aditya Rawat (PR) have no photo (initials placeholder), and a few set a non-default `focal_point`. Replace the photos with real ones.
- `settings.founded_year` feeds the hero's "Est. 2019" label and the "years running" count (the mock value is a placeholder).
- `settings.recruitment_open` switches the closing invitation (`JoinCta`, the /join header) between "Apply now" and "Get notified"; `settings.open_teams` (team names) lists the teams taking applications.
- `settings.contact_phone` (null hides the row), `settings.lab_address` and `settings.map_query` (what the map searches
  for: a place name or "lat,lng") feed /contact (§20). The mock phone and lab room are placeholders.
- `events.tags` (string array) are shown as tags on the event pages.
- `events` for /events (§17): `status` (`upcoming` | `past`), `banner_url` (16:9), `cutout_url` (optional transparent PNG
  of the banner's subject, framed by the cutout convention in §17), `banner_focal_x` (0–100, where the banner is
  anchored horizontally when the card crops it, default 50) and `accent_color` (optional; without it the page samples
  the banner's dominant colour and snaps it to red or maroon, §17). The mock has 6 events (2 upcoming, 4 past) with generated placeholder banners and
  cutouts in `/public/events/`; replace them with real art. `projects.tags` decide which lab station a project's photo appears at (a tag equal to the station's domain, any case: `Drones`, `Robotics`, `IoT`, `Research`), and which /projects filter shows it (§16).
- `projects`: `slug`, `title`, `year`, `status`, `tags`, `summary` (the one-line "short description"), `description`, `cover_url`, `images` (jsonb array of `{ url, width, height, alt }`, 4–10 per project; the project page's photo grid), `member_ids` (the team; `getProjectsWithTeam()` resolves them to names as `team`), `repo_url` (optional: the "Source code" button shows only when set), `is_featured`. The mock has 12 projects, with picsum photos in five shapes.
- Mock rows in `lib/mock/*.ts`. Image URLs are `picsum.photos` placeholders (allowed in `next.config.ts` `images.remotePatterns`, along with `*.supabase.co` storage).
- **Pages and components read data only through `lib/data.ts`** (`getSettings`, `getTeams`, `getMembers`, `getSeniorCore`, `getJuniorCore`, `getProjects`, `getEvents`, `getAchievements`, `getGalleryItems`, `getMilestones`). Switching to Supabase means changing those function bodies only.
- Derived reads: `getJuniorCoreByTeam()` (juniors grouped by team, in the teams' order, teams without juniors left out), `getFeaturedProjects()` (`is_featured`), `getUpcomingEvent()` (the earliest event with `starts_at` in the future, or `null`) `getHomeStats()` (members, projects, events that have started, years since `founded_year`) and `getMissionStats()` (the /lab/drone bench's dashboard, §18: members and their running total by joining year, from `year` of study and the Senior Core term; projects per lab domain; this year's events, done and coming; the next event; workshops that have run (type `workshop`, started) and the next one; competitions won = achievements whose `result` is a podium, `PODIUM` in `lib/mission.ts`). The last three depend on the current time, so they use `cacheLife("hours")`.
- `gallery_items`: `event_id`, `type` (`photo` | `video`), `url` (null for a note), `poster_url` (videos), `caption`,
  `alt`, `width` / `height` (null for notes), `layout_group` (kept for the data, not used by the grid), `sort_order` (the spec's "order"; every table here uses
  `sort_order`), `taken_at`. How a journal shows them is in §14. The mock has four journals (Tech Expo 2025, Hack the
  Hardware, Build Night: October, 22–28 items each; ROS from Zero, 10 items): picsum photos and posters, and two CC0 sample clips from MDN
  (`interactive-examples.mdn.mozilla.net`, not the club). Replace them with real files.
- Project reads: `getProjectsWithTeam()` (every project with `team`, the member names) and `getProject(slug)` (one, or null).
- Gallery reads: `getJournals()` (the index: events with gallery items, newest first, with photo, video and note counts) and
  `getJournal(slug)` (`{ event, items }`, or null). `getGalleryHighlights(n)`: landscape photos from the journals,
  round-robin across events, newest first (the home and /about photo slots).
- Event reads: `getEventShowcase()` (every event with `photos`, its photo gallery items that have a file, and
  `has_gallery`; upcoming first, soonest first, then past, newest first) and `getEvent(slug)` (one, or null).
- `achievements` (§19): `slug`, `title` (short), `result` ("Winner", "1st Runner-up",
  "Best Paper"; `isWin()` in `lib/achievements.ts` picks the accent tag), `category` (`competition` | `research` | `other`;
  the page filters on the first two), `event_name`, `location`, `date` (`YYYY-MM-DD`), `description` (max **200**
  characters, `ACHIEVEMENT_DESCRIPTION_MAX`; the mock throws past it), `team` (member names, as text), `image_url` (a
  landscape photo, required: shown at 3:2 beside the entry), `link` (optional: certificate or paper) and
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
- In shared layouts, a client component that calls `usePathname()` must sit inside `<Suspense>` once routes with dynamic params exist, unless it only renders after user interaction (as the menu panel does). The header's section links read the path inside `<Suspense>` for this reason, and so does
  `<Reveals>`.
- A static page that reads the query string on the client (`useSearchParams`: /join/apply's `?team=`, /projects' `?tag=`,
  /achievements' `?a=`) wraps
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

- Do use tokens, the type utilities and the primitives; don't add hex values, arbitrary colours or new display sizes.
- Do keep red to the primary action, the active state and accent tags; don't use it for decoration, backgrounds or glows.
- Do separate with hairlines and whitespace; don't wrap every paragraph in a bordered card or every word in a pill.
- Do vary compositions (split, index list, ruled timeline, lead story + grid); don't default to three identical cards.
- Do show only what the data says; don't invent numbers, outcomes, testimonials or photos. A missing photo is a
  `PhotoPlaceholder`, a missing row is left out.
- Do put captions under photos; don't lay labels over images.
- Do use `MonoLabel` / `mono-label` / `Tag` for technical labels; don't hand-roll mono styles.
- Do check `useReducedMotion` / `prefersReducedMotion` in every animated component.
- Do test at 360px; no horizontal scroll, ever. Touch targets are at least 36px (buttons), usually 44px.
- Don't add: purple, pink, yellow, orange or cyan; neon; glassmorphism; heavy shadows; emoji or icon-pack decoration;
  floating 3D extras; terminal-style sections; random dots, crosses or particles.
- Do drive the robot through `useBotStore`, `botActions` and `botTransform`. Don't mount more than one `<BotStage>` per
  page, and don't mirror `botTransform` in React state.

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

- **Non-fixed stage:** `<BotStage fixed={false} />` fills the nearest positioned parent instead; the lab does this, and so does the home hero's framed panel (§12).
- **Layering:** override the layer with `className`, e.g. `-z-[5]` to sit behind content.
- **Props:**
  - `logoUrl` (default `/logo.svg`) and `bootOnMount` (default true);
  - `transform`: initial `botTransform` values for this page (applied before paint, so the server-rendered poster is already in place; reset on unmount);
  - `interactive` (default true): an invisible, focusable `<button>` over the robot. Hover sets `hovered`; click, tap or Enter calls `poke()`. It is positioned every frame from `botScreen` (the head and body projected to stage pixels), so it follows the robot wherever `botTransform` puts it;
  - `label`: the hit button's accessible name (default "Say hi to the robot");
  - `preloadPoster` (default: same as `fixed`): preload the poster for an above-the-fold stage;
  - `sidekick` (default false): the sidekick drone flies in this canvas (§18; 3D only, so never with the poster). No page uses it at the moment.
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
  units (`head`, `face`, `top`, plus `scale`), so something in the same scene (the sidekick, §18) can orbit, boop or
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
| Page calls `botActions.react(face, ms)` | that face for `ms` (no page uses this at the moment) |

**Touch (no hover-capable pointer):** no sleep and no cursor tracking. The robot looks around by itself (a new target every 2.5–4.5s, slow damping). If the device reports `deviceorientation`, it follows the tilt instead, re-centring slowly. On iOS the permission prompt is requested on the first tap on the robot, because it needs a user gesture.

**Reduced motion:** no tracking, no moods and no reactions; only a slow blink every 5–9s.

### Home page

The home hero's placement is in §12. The robot appears on the home page only; it does not travel with the scroll.

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
<HomeHero settings stats />             // what the club is, two actions, four counts, the mascot
<HomeIntro tagline photo />             // 01 About the club
<FocusAreas projects index={2} />       // 02 the four areas (shared)
<FeaturedProjects projects index={3} /> // 03 a lead project + up to three cards
<HomeEvents next events index={4} />    // 04 the next event in full + a short list
<HomeAchievements items index={5} />    // 05 the latest four results
<JoinCta settings index={6} />          // 06 the closing invitation (shared)
```

Data: `getSettings`, `getProjects`, `getFeaturedProjects`, `getUpcomingEvent`, `getEvents`, `getAchievements`,
`getHomeStats`, `getGalleryHighlights(1)`.

- **Hero** (`HomeHero`): 7/5 columns from lg, at least one screen tall there. Left: the mono line "{college} · Est.
  {founded_year}"; the `h1` "We don't just imagine the future. / We build it." (`type-display`; the first sentence
  `text-muted`, the second warm white; each line rises out of a mask on load); one sentence; "Join the club" (primary) and
  "Explore projects" (secondary); then four counts from `getHomeStats()` on a hairline (members, projects built, events
  hosted, years running; years only when `founded_year` is set). Right: the mascot in a framed panel (`rounded-card`,
  hairline, `bg-2`, 4:5 from lg, 4:3 / 5:4 below) with a soft floor light, and a caption. Phones: the panel follows the
  text.
- **Mascot** (`HeroRobot`): the page's only `<BotStage fixed={false}>`, filling the panel: 74% of its height, base at 90%,
  turned −0.3 rad; plus `useBotMood()`. It boots on load, blinks, has moods, follows the cursor and waves when clicked.
  It never moves with the scroll; off screen, the canvas stops.
- **About the club** (`HomeIntro`): the tagline as the heading beside two short paragraphs and "Our story"; then a 3:2
  photo from the journals (with its alt text and event as the caption) beside the mission and vision.
- **Focus areas** (`components/shared/FocusAreas.tsx`): an index of `LAB_STATIONS` (`lib/home.ts`), one ruled row each:
  number, title with an arrow, project count, description and (md+) a 16:10 photo from one of its projects. Each row links
  to `/projects?tag=<domain>`.
- **Featured projects**: the first featured project with a cover as a lead story (a 16:10 photo, 7 columns, beside its
  category, year and status, title, summary, description, "Built with" tags, "View project" and "Source code" when
  `repo_url` is set), then up to three more as `ProjectCard`s.
- **Events** (`HomeEvents`): `EventFeature` for `getUpcomingEvent()` (the banner beside the type, "Registrations open",
  title, summary, description, date / time / venue, the live `Countdown` and "Register" when `registration_url` is set),
  then up to four other events as `EventRow`s (upcoming first). Without an upcoming event the section is "Recent events".
- **Achievements** (`HomeAchievements`): a 4/8 split: the heading and "Full record" beside the latest four as rows (date,
  title, event · place, the result tag). Each links to `/achievements?a=<slug>`.
- **Join** (`JoinCta`, also on /about and /members): "Hands on with hardware." beside the recruitment copy, the open teams
  as tags, "Apply now" (`join_form_url` or `/join/apply`) and "How joining works"; while `recruitment_open` is false, the
  closed copy and the "Get notified" form (`NotifyForm`, the `notifyWhenRecruiting` server action).
- **Reduced motion**: everything is in place; the robot is the poster.

---

## 13. Team page (`app/members/page.tsx`, `components/members`)

"Team" in the navigation; the route stays `/members`.

- **Header**: `PageHeader` with the term (`SENIOR_CORE_TERM`), "The people behind the builds.", jump buttons to
  `#senior-core` and `#junior-core`, and counts (members, Senior Core, Junior Core, teams).
- **Senior Core** (`SeniorCore`): two columns of full profiles from lg (one below). A profile: a 4:5 portrait (240px wide,
  anchored at `focal_point`), the role in mono, the name (`type-h3`), branch · year, the bio, the quote as a pull quote
  with a red rule, and the profile links as small square icon buttons (`MemberSocials`; LinkedIn, GitHub, Instagram,
  only those set).
- **Junior Core** (`JuniorCore`): a ruled row of jump links to each team (with counts), then one block per team
  (`id="jc-<slug>"`, `juniorRowId`): the team name, count and description in the left 3 columns, its members in a grid of
  2 / 3 / 4 columns. A member card: the 4:5 portrait, name, role, the bio clamped to three lines, and the links.
- **No photo**: a charcoal 4:5 block with the initials (`Portrait`), never a generated face.
- All portraits share one size per group, so the team reads as one organisation. Hovering a profile zooms its photo
  slightly. Closing: `JoinCta`.

---

## 14. Gallery (`app/gallery`, `components/gallery`)

Photography first: one journal per event, shown as a plain photo grid.

- **`/gallery`**: `PageHeader` ("One journal per event.", counts of journals, photos and videos), then the journals grouped
  by year: a 3:2 cover, the date in mono, the title with an arrow, and "24 photos · 2 videos · 3 notes". Each links to
  `/gallery/<slug>`.
- **`/gallery/[slug]`**: a breadcrumb, the date and venue, the title, the counts, a Share button (the system share sheet,
  else it copies the link and says "Link copied") and "About the event" → `/events/<slug>`. Then `MediaGrid` in masonry:
  CSS columns (2 / 3 / 4), every photo in its own shape, `rounded-image`, its caption underneath in small text; videos show
  their poster with a small "Video" label; notes (items without a file) are short text cards. Prerendered for every
  journal; params read inside `<Suspense>` (§9).
- **Lightbox** (`Lightbox.tsx`, also used by event and project pages): portalled to `<body>` at z-90 on solid `bg`: the
  counter and title, zoom, download and close at the top; the photo (`object-contain`) or the video with controls; the
  caption below; prev/next at the sides from md and at the bottom on phones. While open it makes the page `inert`, stops
  Lenis, locks scroll and focuses Close; Esc closes and focus returns to the photo that opened it. ← → change the item;
  the wheel, a trackpad pinch or a two-finger pinch zoom (up to 5×), double click toggles 2.5×, a drag pans when zoomed
  and swipes at 1×. Download fetches the file as a blob (or through `/_next/image`), else opens it.
- **Reduced motion**: no fades; zoom jumps.

Placeholders: the mock photos and posters are `picsum.photos`; the two clips are MDN's CC0 samples.

---

## 15. About page (`app/about/page.tsx`, `components/about`)

```tsx
<PageHeader … aside={<FactList />} />  // "Built by students, for the real world." + founded, teams, members, projects
<Story photo />                        // 01 a photo from the journals beside who we are / how we build
<Purpose />                            // 02 mission and vision as two statements, divided by a hairline
<Practice />                           // 03 what we do: a sticky heading beside three numbered rows (ABOUT_PILLARS)
<History milestones />                 // 04 one ruled row per milestone: year (mono), title, one line
<FocusAreas index={5} />               // 05 shared with home
<PhotoSet photos />                    // 06 one large and four small photos from the journals → /gallery
<TeamsOverview teams />                // 07 the teams in two columns, each → /members#jc-<slug>
<JoinCta />
```

Copy lives in `lib/about.ts` (`ABOUT_PURPOSE`, `ABOUT_PILLARS`); the history is `getMilestones()`; photos are
`getGalleryHighlights(6)`.

---

## 16. Projects (`app/projects`, `components/projects`)

An engineering portfolio.

- **`/projects`**: `PageHeader` (the count and year range from the data), then `ProjectsBrowser`:
  - a ruled filter bar: All, Drones, Robotics, IoT, Research (`PROJECT_FILTERS`), each a button (`aria-pressed`) with its
    count; the active one is a warm white fill. The filter lives in `?tag=` and is written with
    `history.replaceState(null, …)`, which Next syncs with `useSearchParams` (passing Next's own history state would stop
    the sync). The page renders the browser inside `<Suspense>` with the unfiltered list as the fallback, so it stays
    static;
  - unfiltered: a **spotlight** on the first featured project (a 16:10 photo beside its category, year, status, title,
    summary, description and stack);
  - a grid of `ProjectCard`s (1 / 2 / 3 columns): the 4:3 cover, category tag, year · status, title, summary and the first
    four technologies in mono. The whole card is one link. An empty filter says so and offers "Show all projects".
- **`/projects/[slug]`** (`ProjectDetail`), using only what the data holds: a breadcrumb; the category, year and status;
  the title (`type-h1`) and summary; the cover at 16:9; **Overview** (the description) and **Hardware & software**
  (`tech_stack` as tags) beside a fact sheet (year, status, tags, team) with "Source code" / "Live demo" when
  `repo_url` / `demo_url` are set; **Photos** (`images` in a 3:2 `MediaGrid` that opens the lightbox); and up to three more
  projects from the same category. No invented "problem", "approach" or "results" sections: add them to the data first.
- `projectCategory()` is the first tag that is a filter; `STATUS_LABEL` maps `ongoing` / `completed` / `prototype` to
  "In progress" / "Completed" / "Prototype".

---

## 17. Events (`app/events`, `components/events`)

- **`/events`**: `PageHeader` (upcoming and past counts), then:
  - **Next up**: `EventFeature` for the soonest upcoming event (its banner preloaded);
  - **Upcoming**: the other upcoming events as `EventRow`s beside a heading (4/8);
  - **Archive**: past events grouped by year, as cards: a 16:9 banner, date · type in mono, the title (the card links to
    the event page), the venue, the summary and "View photos" (with the count) when it has a journal.
- **`EventRow`** (shared): a date block (day in Sora, month and year in mono), the title with an arrow, the venue, and the
  type tag plus "Registrations open" (upcoming with a `registration_url`) or "Completed". The row links to the event.
- **`/events/[slug]`**: a breadcrumb; the type and status tags; the title and summary; the banner at 16:9; **About the
  event** (description and tags) beside the facts (date or date range, time in IST, venue, type), the countdown and
  "Register" (upcoming) and "Open the journal" (when it has one); up to twelve photos in a `MediaGrid` with "Full
  journal"; and three more events. Prerendered for every event; params inside `<Suspense>`.
- Dates are formatted in IST (`lib/events.ts`), so the server and the browser agree. The countdown renders dashes on the
  server and ticks on the client (§9).

Placeholders: the banners in `/public/events/` are generated and graded into the palette; replace them with real
photography. `cutout_url`, `banner_focal_x` and `accent_color` stay in the data but aren't used by this layout.

---

## 18. The drone (`components/drone`)

A small club quadcopter built in code, used in two places:
- as the robot's **sidekick**, in the robot's own canvas (`<BotStage sidekick>`, `Sidekick.tsx`). It flew around the old home hero; since the redesign no page turns it on, and it stays available for the dev pages;
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
units while slow, and wobbles slightly. Phones: 60% scale. (The sidekick flies its own way: `Sidekick.tsx`, `sidekick-plan.ts`, numbers in `SIDEKICK`.)

### Effects
- **Trail** (`Trail`; `max`, `life`, `size` props): ONE `Points` ring buffer. The bench: max **1500** (750 on phones). Emission ≈ 2 + 260 × speed per second
  (≤ 700/s), from behind the rotors; each particle drifts down, slows, shrinks and fades over **1.4s** (all in the vertex
  shader; the CPU only writes new particles). Red, a quarter warm white, additive. The sidekick: 300, 0.8s.
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

- **Header**: `PageHeader` ("Results, on the record.") with counts: entries, wins (`isWin`), competitions, research.
- **The record** (`AchievementsArchive`): a ruled filter bar (All, Competitions, Research, with counts), then one block
  per year (newest first): the year and its count in the left 2 columns, the entries in the other 10. An entry
  (`id=<slug>`): the 3:2 photo; date · category in mono; the title (`type-h3`); the result as a tag (accent for a win)
  beside event · place; the description; the team; the proof link ("Read paper" for research, else "View certificate")
  when `link` is set; and "Copy link" (copies `/achievements?a=<slug>` and says "Link copied").
- **`?a=<slug>`** (the copied link and the home rows): the entry stays visible whatever the filter, is marked with a
  charcoal panel and a hairline ring, and scrolls into the middle of the screen. The page wraps the archive in
  `<Suspense>` with the plain list as its fallback.

Placeholders: the photos in `/public/achievements/` are generated scenes and the links point at `example.com`.

---

## 20. Contact (`app/contact/page.tsx`, `components/contact`)

- **Header**: `PageHeader` ("Get in touch.", "We usually reply within 48 hours"), an "Email …" secondary button, and a
  one-line notice: recruitment while it's open (→ `/join`), else the next workshop or event (→ its page).
- **Details and form**: `ContactDetails` in the left 4 columns (the club and university, then a ruled row per way in:
  email, phone, lab address, Instagram, LinkedIn, GitHub, only those set; each with a copy button that turns into a tick
  for 1.5s and is announced) beside the form card (`bg-2`, `rounded-card`, hairline): "Send us a message" and
  `ContactForm`.
- **`ContactForm`**: Name and Email, Subject (a native select), Message (a 0 / 1000 counter). react-hook-form +
  `zodResolver(contactSchema)` (`lib/contact.ts`), `mode: "onTouched"`; submitting focuses the first error. Fields
  (`components/forms/fields.tsx`): `bg` with a hairline ring, `rounded-control`; focus brightens the ring to warm white;
  an error turns it red with the message below (warm white beside a red dot, `aria-describedby`). A honeypot catches
  bots. Sending: a spinner, disabled. Sent: the form slides away and the sent state (a drawn check, "Message sent…",
  "Send another") takes its place. Error: an alert with "Try again". The server action `sendContactMessage` validates
  again (§8).
- **Find the lab**: the address and "Open in Maps" beside a darkened Google Maps embed (lazy).
- **Partners**: the partners' logos in one quiet row (greyscale at 60%), when there are any.
- **FAQ**: a heading beside an `Accordion` of `CONTACT_FAQ`.

Placeholders: the partners, the phone number and the lab room.

---

## 21. Join (`app/join/page.tsx`, `app/join/apply/page.tsx`, `components/join`)

- **Header**: `PageHeader` with a status line ("Recruitment 2026 · Open", a red dot while open), "Join the club.", one
  sentence and "Apply now" (`join_form_url` or `/join/apply`) + "See the teams" (`#teams`), or the "Get notified" form while
  recruitment is closed. Aside: the four facts applicants ask first, taken from the FAQ (who, experience, time, results).
- **Why join** (`[01]`): `JOIN_BENEFITS` in a 2 × 2 ruled grid with numbers; no icons.
- **Teams** (`[02]`, `#teams`): a ruled row per team (`getTeams()`): the team's character as a small round avatar
  (`CharacterAvatar`, cropped to the face box in `JOIN_CHARACTERS`), name, description, skills in mono, and "Hiring"
  (accent tag) with an "Apply" button → `/join/apply?team=<slug>`, or "Closed" and "Opens next round". A team is hiring when
  `settings.recruitment_open` and it is in `settings.open_teams` (`isHiring`).
- **How it works** (`[03]`): `JOIN_STEPS` as four columns on hairlines (the first step's dot is red).
- **FAQ** (`[04]`): a heading beside an `Accordion` of `JOIN_FAQ`.
- **Last call**: "Ready to build with us?" with "Apply now" and "Ask us anything" (→ /contact).
- **`/join/apply`**: a breadcrumb; a sticky left column (the heading, the hiring teams with their avatars, the four
  steps) beside `ApplyForm` in a `bg-2` card. `?team=<slug>` preselects a hiring team (read on the client inside
  `<Suspense>`, §9); a closed team isn't preselected and the form says it opens next round. While recruitment is closed, a
  note replaces the form.
- **`ApplyForm`**: full name, phone (10-digit Indian mobile), college email (`@bennett.edu.in`), year, branch, team
  (closed teams disabled; the chosen team's avatar and pitch beside it), skills, why (50–800 characters), LinkedIn,
  GitHub (optional) and the resume (PDF / PNG / JPG / WebP, up to 5MB, a dashed drop box). react-hook-form + the zod
  schema in `lib/join.ts`, `onTouched`; `submitApplication` re-checks everything on the server. States: sending,
  received (the reference and next steps) and error.

The character images are illustrations the club supplied (`/public/join/`; four were cut out from a checkerboard,
`/public/join/cutout/`). Replace them with real transparent exports when there are some.
