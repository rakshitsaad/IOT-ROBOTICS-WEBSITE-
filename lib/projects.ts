/**
 * /projects config and pure helpers (DESIGN.md §16). Client-safe: the reel,
 * the strip and the server pages all read it.
 */
import { seeded } from "./gallery";
import type { Project, ProjectImage } from "./types";

/** A project with its team's names resolved (lib/data.ts → getProjectsWithTeam). */
export interface ProjectWithTeam extends Project {
  team: string[];
}

/* ------------------------------------------------------------- filters */

/** The tag filter under the top-left label. A project matches when one of its tags equals the filter (any case). */
export const PROJECT_FILTERS = ["All", "Drones", "Robotics", "IoT", "Research"] as const;
export type ProjectFilter = (typeof PROJECT_FILTERS)[number];

/** `?tag=drones` → "Drones"; anything unknown → "All". */
export function parseFilter(value: string | null | undefined): ProjectFilter {
  const v = value?.toLowerCase();
  return PROJECT_FILTERS.find((f) => f.toLowerCase() === v) ?? "All";
}

export function matchesFilter(project: Pick<Project, "tags">, filter: ProjectFilter): boolean {
  return filter === "All" || project.tags.some((t) => t.toLowerCase() === filter.toLowerCase());
}

/** Projects shown for a filter: only those with a cover (the reel and the cards need one). */
export function filterProjects<P extends Project>(projects: readonly P[], filter: ProjectFilter): P[] {
  return projects.filter((p) => p.cover_url && matchesFilter(p, filter));
}

/** Read the filter from the address bar (client only; avoids useSearchParams so the page stays static). */
export function filterFromLocation(): ProjectFilter {
  return parseFilter(new URLSearchParams(window.location.search).get("tag"));
}

/** Write the filter to the address bar without a navigation. */
export function writeFilterToLocation(filter: ProjectFilter) {
  const url = new URL(window.location.href);
  if (filter === "All") url.searchParams.delete("tag");
  else url.searchParams.set("tag", filter);
  window.history.replaceState(window.history.state, "", url);
}

/* ---------------------------------------------------------------- reel */

/**
 * The curved WebGL reel (md and up, with motion). Lengths are shares of the
 * stage width unless noted; the scene uses CSS pixels as world units.
 */
export const REEL = {
  /** Panel width and the gap between panels. Panels are 4:3. */
  panel: 0.26,
  gap: 0.02,
  aspect: 4 / 3,
  /** Radius of the cylinder the panels sit on (its axis is on the viewer's side, so the edges come towards you). */
  radius: 0.62,
  /** Camera distance from the centre panel. */
  camera: 0.9,
  /** The loop is at least this long; a short list repeats until it is. */
  minLoop: 2.4,
  /** Panels whose centre is further than this along the curve are hidden (well off screen). */
  visible: 0.75,
  /** How fast the reel catches up with its target, per second (exponential lerp). */
  follow: 7,
  /** Reel px per wheel px, per dragged px, and how many seconds of a flick's speed carry on after release. */
  wheel: 1,
  drag: 1.25,
  flick: 0.22,
  /** Settle on the nearest panel this long after the last wheel event (ms). */
  snapDelay: 160,
  /** Scroll speed adds bend (up to +60% at 4000px/s) and an RGB split at the panel edges (uv units, full at 3000px/s). */
  bendBoost: 0.6,
  bendAt: 4000,
  split: 0.012,
  splitAt: 3000,
  /** Hover: the panel flattens this much towards its tangent plane and brightens. */
  hover: { flat: 0.35, bright: 0.12 },
  /** Corner radius, px (--radius-image). */
  corner: 18,
  /** Reel ↔ gallery transition, seconds (expo.inOut). */
  transition: 1.1,
} as const;

/** Reel geometry for a stage size, in px. */
export function reelMetrics(width: number) {
  const panelW = REEL.panel * width;
  return {
    panelW,
    panelH: panelW / REEL.aspect,
    spacing: (REEL.panel + REEL.gap) * width,
    radius: REEL.radius * width,
    camera: REEL.camera * width,
    visible: REEL.visible * width,
  };
}

/** How many times the list repeats so the loop is at least REEL.minLoop wide. */
export function reelCopies(count: number): number {
  if (count === 0) return 0;
  return Math.max(1, Math.ceil(REEL.minLoop / (count * (REEL.panel + REEL.gap))));
}

/** Wrap `v` into [-len/2, len/2). */
export function wrapCentered(v: number, len: number): number {
  return ((((v + len / 2) % len) + len) % len) - len / 2;
}

/* ------------------------------------------------------------- title */

/**
 * Archivo 700 advance widths in em for capitals, digits and the space, measured
 * in the browser. The title's tracking (-0.02em per
 * character) is added in titleEm(). Used to size the vertical title so the
 * longest one still fits, and to butt its two halves together.
 */
const ARCHIVO_CAPS: Record<string, number> = {
  A: 0.724, B: 0.722, C: 0.733, D: 0.739, E: 0.683, F: 0.622, G: 0.802, H: 0.754, I: 0.301, J: 0.603, K: 0.725,
  L: 0.591, M: 0.872, N: 0.754, O: 0.793, P: 0.681, Q: 0.793, R: 0.73, S: 0.679, T: 0.641, U: 0.748, V: 0.694,
  W: 0.964, X: 0.706, Y: 0.699, Z: 0.653,
  "0": 0.596, "1": 0.596, "2": 0.596, "3": 0.596, "4": 0.597, "5": 0.596, "6": 0.596, "7": 0.596, "8": 0.596,
  "9": 0.596,
  " ": 0.196,
};

/** Length of an uppercase title in em (Archivo 700, tracking -0.02em). */
export function titleEm(title: string): number {
  let em = 0;
  for (const ch of title.toUpperCase()) em += (ARCHIVO_CAPS[ch] ?? 0.72) - 0.02;
  return Math.max(em, 1);
}

/**
 * Split a title in two for the gallery (first half to the bottom, the rest
 * to the top): at the space nearest the middle when there is one close
 * enough, else in the middle of the letters.
 */
export function splitTitle(title: string): [string, string] {
  const mid = title.length / 2;
  let best = -1;
  for (let i = 0; i < title.length; i++) {
    if (title[i] === " " && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) best = i;
  }
  if (best > 0 && Math.abs(best - mid) <= title.length * 0.35) return [title.slice(0, best), title.slice(best + 1)];
  const cut = Math.ceil(mid);
  return [title.slice(0, cut), title.slice(cut)];
}

/* --------------------------------------------------------------- strip */

export type TileSize = "l" | "m" | "s";

/**
 * The gallery strip (State 2, md and up). Tile heights are in vh and every
 * horizontal length too, so the layout scales with the screen height.
 * Smaller tiles sit further back: they move slower and lie underneath.
 */
export const STRIP = {
  sizes: {
    l: { h: 46, speed: 1, z: 3 },
    m: { h: 34, speed: 0.82, z: 2 },
    s: { h: 24, speed: 0.66, z: 1 },
  } satisfies Record<TileSize, { h: number; speed: number; z: number }>,
  /** Tiles sit between these heights (vh). */
  band: [17, 88] as const,
  /** Neighbours overlap by up to this share of their widths when one of them is centred. */
  overlap: [0.72, 1] as const,
  /** Strip px per wheel px and per dragged px. */
  wheel: 1,
  drag: 1,
} as const;

export interface StripTile {
  key: string;
  image: ProjectImage;
  /** The project's cover (tile 0): the reel panel lands on it. */
  cover: boolean;
  size: TileSize;
  /** Size, vh. */
  w: number;
  h: number;
  /** Centre at scroll 0, vh from the screen centre. */
  x: number;
  /** Top, vh. */
  y: number;
  speed: number;
  z: number;
  /** Scroll (vh) at which the tile is centred. */
  arrive: number;
}

/** The images shown for a project: the cover (cropped 4:3, like its reel panel), then its gallery. */
export function projectImages(project: Pick<Project, "title" | "cover_url" | "images">): ProjectImage[] {
  const cover: ProjectImage[] = project.cover_url
    ? [{ url: project.cover_url, width: 4, height: 3, alt: `${project.title}, cover photo` }]
    : [];
  return [...cover, ...project.images.filter((i) => i.url !== project.cover_url)];
}

/**
 * seeded() with a final avalanche (murmur3's fmix32). FNV-1a alone gives
 * related values for neighbouring salts, which made most strips "l m m m m".
 */
function stripRandom(key: string, salt: number): number {
  let h = Math.floor(seeded(key, salt) * 4294967296);
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/**
 * Lay the strip out. Deterministic (seeded by the project id), so the server
 * HTML and the client agree. Each tile is placed so it reaches the centre a
 * little after its neighbour, whatever its speed: tiles arrive in order and
 * overlap only slightly, with alternating heights.
 */
export function buildStrip(project: Pick<Project, "id" | "title" | "cover_url" | "images">): {
  tiles: StripTile[];
  /** Scroll range, vh: the last tile is centred at its end. */
  length: number;
} {
  const images = projectImages(project);
  const [top, bottom] = STRIP.band;
  const tiles: StripTile[] = [];

  images.forEach((image, i) => {
    const prev = tiles[i - 1];
    let size: TileSize = "l";
    if (prev) {
      const r = stripRandom(project.id, i * 7 + 1);
      size = r < 0.36 ? "s" : r < 0.72 ? "m" : "l";
      // Never two large tiles side by side, nor the same size three times running.
      if (size === "l" && prev.size === "l") size = "m";
      if (size === prev.size && size === tiles[i - 2]?.size) size = size === "s" ? "m" : "s";
    }
    const spec = STRIP.sizes[size];
    const h = spec.h;
    const w = h * (image.width / image.height);
    const free = bottom - top - h;
    const lane = stripRandom(project.id, i * 7 + 2);
    // The cover is centred in the band; the rest alternate low / high.
    const y = i === 0 ? top + free / 2 : top + free * (i % 2 === 1 ? 0.55 + 0.45 * lane : 0.45 * lane);
    let arrive = 0;
    if (prev) {
      const [lo, hi] = STRIP.overlap;
      const f = lo + (hi - lo) * stripRandom(project.id, i * 7 + 3);
      arrive = prev.arrive + (((prev.w + w) / 2) * f) / spec.speed;
    }
    tiles.push({
      key: `${i}-${image.url}`,
      image,
      cover: i === 0 && Boolean(project.cover_url),
      size,
      w,
      h,
      x: arrive * spec.speed,
      y,
      speed: spec.speed,
      z: spec.z,
      arrive,
    });
  });

  return { tiles, length: tiles.at(-1)?.arrive ?? 0 };
}

/** The address of a project's page. */
export const projectHref = (slug: string) => `/projects/${slug}`;

/** A same-origin, resized copy of an image (WebGL textures need same-origin or CORS). */
export function optimizedImage(url: string, width = 1080, quality = 75): string {
  return `/_next/image?url=${encodeURIComponent(url)}&w=${width}&q=${quality}`;
}
