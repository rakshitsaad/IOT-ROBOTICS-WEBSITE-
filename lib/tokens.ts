/**
 * JS mirror of the design tokens in app/globals.css.
 * Use the CSS variables / Tailwind classes in markup; use these only where JS
 * needs a raw value (canvas, three.js materials, GSAP colour tweens).
 * Keep in sync with globals.css and DESIGN.md.
 */
import type { Accent, TeamName } from "./types";

export const COLORS = {
  bg: "#08080B",
  bg2: "#101016",
  line: "rgba(255,255,255,0.08)",
  text: "#EDEDF2",
  muted: "#8B8B99",
} as const;

export const ACCENTS: Record<Accent, string> = {
  blue: "#4F7CFF",
  violet: "#8B5CFF",
  coral: "#FF5A5F",
  orange: "#FF9F43",
  amber: "#FFD24D",
};

/** Stops of the --iris gradient, in order. */
export const IRIS_STOPS = [
  "#4F7CFF",
  "#8B5CFF",
  "#FF5A5F",
  "#FF9F43",
  "#FFD24D",
] as const;

export const TEAM_ACCENT: Record<TeamName, Accent> = {
  Tech: "blue",
  Research: "violet",
  Design: "coral",
  Multimedia: "orange",
  "Social Media": "amber",
  Management: "blue",
  PR: "violet",
};

export function teamAccent(team: TeamName): Accent {
  return TEAM_ACCENT[team];
}

/**
 * Text colour to put on top of a fill so it stays readable.
 * Every accent is light enough that dark text (#08080B) has the higher WCAG
 * contrast (blue 5.4:1, violet 4.8:1, coral 6.6:1, orange 9.8:1, amber 14:1),
 * so accents always take dark text. Only dark fills take light text.
 */
export type Fill = Accent | "white" | "iris" | "dark" | "raised";
export function textOn(fill: Fill): "dark" | "light" {
  return fill === "dark" || fill === "raised" ? "light" : "dark";
}

export const RADIUS = { pill: 999, card: 28, image: 18 } as const;
