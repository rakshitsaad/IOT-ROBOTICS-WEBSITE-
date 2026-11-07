import type { BotIcon } from "@/components/robot/icons";
import type { Accent, Project } from "./types";

/**
 * Home page content config: the "Inside the lab" stations (DESIGN.md §12).
 * Each station shows up to three photos from projects tagged with its domain
 * (tags match case-insensitively, so the tag "IoT" matches the domain "iot").
 */

export type LabDomain = "drones" | "robotics" | "iot" | "research";

export interface LabStation {
  domain: LabDomain;
  title: string;
  /** Uppercase word in the station counter, e.g. "[02/04] ROBOTICS". */
  short: string;
  /** Shown on the robot's screen (and the small head icon) at this station. */
  icon: BotIcon;
  accent: Accent;
  description: string;
}

export const LAB_STATIONS: readonly LabStation[] = [
  {
    domain: "drones",
    title: "Drones & Aerial Systems",
    short: "Drones",
    icon: "drone",
    accent: "blue",
    description:
      "Quadcopters, VTOLs and indoor swarms we design, tune and fly ourselves, from flight controllers to fully autonomous missions.",
  },
  {
    domain: "robotics",
    title: "Robotics & Mechatronics",
    short: "Robotics",
    icon: "robot-arm",
    accent: "coral",
    description:
      "Arms, rovers and competition bots, built from CAD and custom PCBs all the way up to the control loops that make them move.",
  },
  {
    domain: "iot",
    title: "IoT & Embedded",
    short: "IoT",
    icon: "wifi-chip",
    accent: "amber",
    description:
      "Low-power sensor nodes, firmware and dashboards that put real data from the campus and nearby farms online.",
  },
  {
    domain: "research",
    title: "Research & AI",
    short: "Research",
    icon: "atom",
    accent: "violet",
    description:
      "On-device ML, new sensors and sim-to-real experiments: we test ideas in hardware and write up what we learn.",
  },
];

/**
 * Photo depths behind the robot and how fast each moves when the camera pans
 * to the next station (back 0.6×, front 1.3×).
 */
export const LAB_DEPTHS = { back: 0.6, mid: 1, front: 1.3 } as const;
export type LabDepth = keyof typeof LAB_DEPTHS;

/**
 * How far the camera pans per station at depth 1, in screen widths. The back
 * layer (0.6×) then moves 75% of a screen per station, so back photos must sit
 * between 25% and 60% from the left to never show early or linger (Lab.tsx).
 * Outgoing and incoming photos overlap mid-pan.
 */
export const LAB_PAN = 1.25;

/** Projects for a station: tagged with its domain and with a cover image, up to `max`. */
export function stationProjects(projects: readonly Project[], station: LabStation, max = 3): Project[] {
  return projects
    .filter((p) => p.cover_url && p.tags.some((t) => t.toLowerCase() === station.domain))
    .slice(0, max);
}

/** The projects page filtered to a station's domain. */
export function stationHref(station: LabStation) {
  return `/projects?tag=${station.domain}`;
}
