import { COLORS } from "./tokens";

/**
 * The /join hero's crowd (DESIGN.md §21): a fixed, seeded crowd of small flat figures (front view, chest up), built as
 * data and drawn as one SVG by components/join/Crowd.tsx. The same seed gives the same crowd on every visit, on the
 * server and the client. It does not depend on the member count. Client-safe.
 *
 * Rows go from the back (smaller, higher, darker: their colours are mixed towards the page's black, as if further
 * away) to the front (larger, lower). Within a row, people are spaced by their size with a little jitter, and every
 * other row is offset by half a place, so heads behind show between the heads in front.
 */

/**
 * Illustration colours for the figures. These are not UI tokens (like the robot's palette.ts, §11): don't use them
 * elsewhere. Clothing is deliberately muted; about 8% of shirts are the accent red.
 */
export const CROWD_PALETTE = {
  skin: ["#F1C9A8", "#E2AF89", "#C98F68", "#A9704C", "#8A5638", "#5F3B27"],
  hair: ["#17120F", "#241812", "#3A271C", "#5A3C27", "#7A5434", "#8D8A86"],
  /** Charcoal, slate, warm grey, soft beige, deep navy. */
  clothes: ["#2E2F33", "#4A5260", "#7A726A", "#C8B8A2", "#1F2A44"],
  /** Headscarves: the darker clothing colours, plus a dusty rose. */
  scarf: ["#4A5260", "#1F2A44", "#7A726A", "#8E6E6A", "#2E2F33"],
  ink: "#16110E",
  /** A collared shirt's collar; lanyard straps (with the accent) and their badge. */
  collar: "#E9E4DA",
  strap: ["#8C8478", "#3B4A63"],
  badge: "#E4DFD6",
  accent: COLORS.red,
  bg: COLORS.bg,
};

export const HAIR_STYLES = ["crop", "side", "buzz", "long", "bun", "curly", "bob", "scarf"] as const;
export type HairStyle = (typeof HAIR_STYLES)[number];
export type Neckline = "crew" | "v" | "collar";

export interface CrowdPerson {
  x: number;
  y: number;
  /** Scale of the 1-unit figure (head radius 10). */
  k: number;
  skin: string;
  shirt: string;
  /** The shirt a shade darker (the arms' edges). */
  fold: string;
  /** Some wear an event lanyard: its strap colour, or null; and its badge. */
  lanyard: string | null;
  badge: string;
  /** The collar's light colour (collared shirts). */
  collar: string;
  hair: string;
  style: HairStyle;
  neckline: Neckline;
  glasses: boolean;
  /** Front rows only: a small smile. */
  smile: boolean;
}

export interface CrowdLayout {
  width: number;
  height: number;
  rows: CrowdPerson[][];
  count: number;
}

export type CrowdVariant = "wide" | "narrow";

/**
 * The two crowds: md+ (about 260 people in 7 rows) and phones (about 100 in 5 rows). `scale` runs from the back row to
 * the front; `step` is how far each row sits above the one in front, in places (1 = the row's spacing); `chest` is how
 * much of the front row shows below its heads; `dark` is how far the back row is mixed towards black. The height
 * follows from the rows (the crowd is drawn edge to edge in its own box, then fitted to the hero with `slice`).
 */
export const CROWD = {
  wide: { width: 1600, rows: 7, people: 260, scale: [0.74, 1.22], step: 0.8, chest: 1.3, dark: 0.72, seed: 2026 },
  narrow: { width: 820, rows: 5, people: 100, scale: [0.84, 1.36], step: 0.82, chest: 1.3, dark: 0.66, seed: 1984 },
} as const;

/** A small deterministic PRNG (mulberry32). */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Mix a hex colour towards `to` by `k` (0 = unchanged), and nudge its lightness by `lift` (−1..1, small). */
function shade(hex: string, k: number, to: string = CROWD_PALETTE.bg, lift = 0): string {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [r, g, b] = p(hex);
  const [r2, g2, b2] = p(to);
  const f = (c: number, c2: number) => {
    let v = c + (c2 - c) * k;
    v = lift >= 0 ? v + (255 - v) * lift : v * (1 + lift);
    return Math.round(Math.min(255, Math.max(0, v)))
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(r, r2)}${f(g, g2)}${f(b, b2)}`;
}

/** The figure's spacing at scale 1 (local units: head radius 10, shoulders ±27), so neighbours' shoulders overlap a little. */
const PLACE = 47;

const cache = new Map<CrowdVariant, CrowdLayout>();

export function buildCrowd(variant: CrowdVariant): CrowdLayout {
  const hit = cache.get(variant);
  if (hit) return hit;
  const c = CROWD[variant];
  const r = rng(c.seed);
  const pick = <T,>(a: readonly T[]) => a[Math.floor(r() * a.length)];
  const scales = Array.from({ length: c.rows }, (_, i) => c.scale[0] + ((c.scale[1] - c.scale[0]) * i) / (c.rows - 1));
  // Spacing so that the rows add up to about `people` across the width.
  const unit = (c.width * scales.reduce((s, k) => s + 1 / k, 0)) / c.people;
  const rows: CrowdPerson[][] = [];
  // Head centres, from the front row up; then the box's height, so the back row's hair just fits at the top.
  const ys: number[] = new Array(c.rows);
  ys[c.rows - 1] = 0;
  for (let i = c.rows - 2; i >= 0; i--) ys[i] = ys[i + 1] - c.step * unit * scales[i + 1];
  const top = ys[0] - (unit * scales[0] * 19) / PLACE;
  const height = Math.round(c.chest * unit * scales[c.rows - 1] - top);
  for (let i = 0; i < c.rows; i++) ys[i] += height - c.chest * unit * scales[c.rows - 1];

  let count = 0;
  scales.forEach((s, i) => {
    const space = unit * s;
    const k = space / PLACE;
    const dark = c.dark * Math.pow(1 - i / (c.rows - 1), 1.1);
    const offset = (i % 2) * 0.5 * space + (r() - 0.5) * space * 0.4;
    const people: CrowdPerson[] = [];
    for (let x = -space * 0.6 + offset; x < c.width + space * 0.6; x += space * (0.88 + r() * 0.24)) {
      const style = pick(HAIR_STYLES);
      const accent = r() < 0.08;
      // The accent is a touch muted, so the red shirts sit in the crowd instead of popping out of it.
      const shirtBase = accent ? shade(CROWD_PALETTE.accent, 0.2) : pick(CROWD_PALETTE.clothes);
      const lift = (r() - 0.5) * 0.08;
      const shirt = shade(shirtBase, dark, CROWD_PALETTE.bg, accent ? 0 : lift);
      people.push({
        x: x + (r() - 0.5) * space * 0.22,
        y: ys[i] + (r() - 0.5) * space * 0.2,
        k: k * (0.93 + r() * 0.14),
        skin: shade(pick(CROWD_PALETTE.skin), dark),
        shirt,
        fold: shade(shirt, 0.28),
        lanyard: r() < 0.14 ? shade(pick([CROWD_PALETTE.accent, CROWD_PALETTE.strap[0], CROWD_PALETTE.strap[1]]), dark + 0.15) : null,
        badge: shade(CROWD_PALETTE.badge, dark + 0.1),
        collar: shade(CROWD_PALETTE.collar, dark),
        hair: shade(style === "scarf" ? pick(CROWD_PALETTE.scarf) : r() < 0.9 ? pick(CROWD_PALETTE.hair.slice(0, 5)) : CROWD_PALETTE.hair[5], dark),
        style,
        neckline: style === "scarf" ? "crew" : pick(["crew", "crew", "v", "collar"] as const),
        glasses: r() < 0.22,
        smile: i >= c.rows - 3,
      });
    }
    count += people.filter((p) => p.x > -space * 0.3 && p.x < c.width + space * 0.3).length;
    rows.push(people);
  });
  const layout = { width: c.width, height, rows, count };
  cache.set(variant, layout);
  return layout;
}
