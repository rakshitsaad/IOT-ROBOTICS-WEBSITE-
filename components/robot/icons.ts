/**
 * Line icons the robot can show on its screen instead of its eyes.
 * Each icon is a list of SVG path strings on a 24 × 24 grid, stroked (never
 * filled) in white with round caps and joins. To add one, add an entry here;
 * the store, face renderer and /lab/robot pick it up automatically.
 */

export interface BotIconDef {
  label: string;
  paths: string[];
}

/** Circle helper for path strings (cx, cy, r) → closed arc path. */
function circle(cx: number, cy: number, r: number): string {
  return `M${cx + r} ${cy}a${r} ${r} 0 1 1 ${-2 * r} 0a${r} ${r} 0 1 1 ${2 * r} 0z`;
}

export const BOT_ICONS = {
  drone: {
    label: "Drone",
    paths: [
      "M10.6 10h2.8a.6.6 0 0 1 .6.6v2.8a.6.6 0 0 1-.6.6h-2.8a.6.6 0 0 1-.6-.6v-2.8a.6.6 0 0 1 .6-.6z",
      "M10 10L7.3 7.3M14 10l2.7-2.7M10 14l-2.7 2.7M14 14l2.7 2.7",
      circle(5.6, 5.6, 2.4),
      circle(18.4, 5.6, 2.4),
      circle(5.6, 18.4, 2.4),
      circle(18.4, 18.4, 2.4),
    ],
  },
  "robot-arm": {
    label: "Robot arm",
    paths: [
      "M3.5 21h10",
      "M6 21v-2.5h5V21",
      "M8.5 18.5V16.2",
      circle(8.5, 14.6, 1.6),
      "M9.4 13.3l2.8-4.6",
      circle(13.1, 7.3, 1.6),
      "M14.6 7.8l3.2 1.6",
      "M17.8 9.4l2.2-2.4M17.8 9.4l1 3",
    ],
  },
  "wifi-chip": {
    label: "IoT chip",
    paths: [
      "M9 12.5h6a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1z",
      "M10.8 15.2h2.4v2.4h-2.4z",
      "M8 15H6.5M8 18H6.5M16 15h1.5M16 18h1.5M10.5 20.5V22M13.5 20.5V22",
      "M9.9 9.4a3 3 0 0 1 4.2 0",
      "M7.6 7.1a6.2 6.2 0 0 1 8.8 0",
      "M5.3 4.8a9.4 9.4 0 0 1 13.4 0",
    ],
  },
  atom: {
    label: "Research",
    paths: [
      circle(12, 12, 1.3),
      "M2.5 12a9.5 3.6 0 1 0 19 0a9.5 3.6 0 1 0-19 0z",
      "M7.25 3.77a9.5 3.6 60 1 0 9.5 16.46a9.5 3.6 60 1 0-9.5-16.46z",
      "M16.75 3.77a9.5 3.6 120 1 0-9.5 16.46a9.5 3.6 120 1 0 9.5-16.46z",
    ],
  },
  calendar: {
    label: "Calendar",
    paths: [
      "M5.5 6h13a1.5 1.5 0 0 1 1.5 1.5v11a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6z",
      "M4 10.5h16",
      "M8.5 4v3.5M15.5 4v3.5",
      "M8 14h1.5M11.25 14h1.5M14.5 14H16M8 17h1.5M11.25 17h1.5",
    ],
  },
  quote: {
    label: "Quote",
    paths: [
      "M10 6.5H5v5.5h4v1c0 2.4-1.3 4-3.8 4.6",
      "M19 6.5h-5v5.5h4v1c0 2.4-1.3 4-3.8 4.6",
    ],
  },
  play: {
    label: "Play",
    paths: [circle(12, 12, 9), "M10 8.4v7.2l5.6-3.6z"],
  },
  heart: {
    label: "Heart",
    paths: [
      "M12 19.6s-7.6-4.5-7.6-10A4.2 4.2 0 0 1 12 7.2a4.2 4.2 0 0 1 7.6 2.4c0 5.5-7.6 10-7.6 10z",
    ],
  },
} satisfies Record<string, BotIconDef>;

export type BotIcon = keyof typeof BOT_ICONS;

export const BOT_ICON_NAMES = Object.keys(BOT_ICONS) as BotIcon[];
