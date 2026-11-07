/**
 * JS mirror of the design tokens in app/globals.css.
 * Use the CSS variables / Tailwind classes in markup; use these only where JS
 * needs a raw value (canvas, three.js materials, GSAP colour tweens).
 * Keep in sync with globals.css and DESIGN.md.
 */
import type { Accent, TeamName } from "./types";

export const COLORS = {
  bg: "#090909",
  bg2: "#171717",
  line: "#292929",
  text: "#F2F0EB",
  muted: "#858585",
  red: "#C62828",
  redDeep: "#A82222",
  maroon: "#5A1717",
} as const;

/** Accent values for JS. Red is the signal colour; white is the warm white (--text). */
export const ACCENTS: Record<Accent, string> = {
  red: COLORS.red,
  white: COLORS.text,
};

/** Stops of the --iris sheen, in order (maroon → red → maroon). The robot's bezel loop adds a dark gap. */
export const IRIS_STOPS = [COLORS.maroon, COLORS.red, COLORS.maroon] as const;

/** Every team takes red: a team is "active" (current pill, highlight bar, open card glow) in red. */
export const TEAM_ACCENT: Record<TeamName, Accent> = {
  Tech: "red",
  Research: "red",
  Design: "red",
  Multimedia: "red",
  "Social Media": "red",
  Management: "red",
  PR: "red",
};

export function teamAccent(team: TeamName): Accent {
  return TEAM_ACCENT[team];
}

/**
 * Text colour to put on top of a fill so it stays readable.
 * Warm white on red (4.9:1) and maroon (11.7:1) beats black on them (3.5:1, 1.5:1), so red, maroon and the iris
 * sheen take light text, like the dark fills. Only the warm white fill takes dark text (17:1).
 */
export type Fill = Accent | "maroon" | "iris" | "dark" | "raised";
export function textOn(fill: Fill): "dark" | "light" {
  return fill === "white" ? "dark" : "light";
}

export const RADIUS = { pill: 999, card: 28, image: 18 } as const;
