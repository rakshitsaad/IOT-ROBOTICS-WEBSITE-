import type { BotIcon } from "@/components/robot/icons";
import type { Project } from "./types";

/**
 * The club's four technical focus areas (DESIGN.md §12, §15): the home and /about "Focus areas" index, the /projects
 * filters and the drone bench's per-domain counts. Projects belong to an area through a tag equal to its domain (any
 * case, so the tag "IoT" matches "iot").
 */

export type LabDomain = "drones" | "robotics" | "iot" | "research";

export interface LabStation {
  domain: LabDomain;
  title: string;
  /** One word, e.g. "Robotics". */
  short: string;
  /** The robot screen icon for this area (dev pages). */
  icon: BotIcon;
  description: string;
}

export const LAB_STATIONS: readonly LabStation[] = [
  {
    domain: "drones",
    title: "Drones & Aerial Systems",
    short: "Drones",
    icon: "drone",
    description:
      "Quadcopters, VTOLs and indoor swarms we design, tune and fly ourselves, from flight controllers to fully autonomous missions.",
  },
  {
    domain: "robotics",
    title: "Robotics & Mechatronics",
    short: "Robotics",
    icon: "robot-arm",
    description:
      "Arms, rovers and competition bots, built from CAD and custom PCBs all the way up to the control loops that make them move.",
  },
  {
    domain: "iot",
    title: "IoT & Embedded",
    short: "IoT",
    icon: "wifi-chip",
    description:
      "Low-power sensor nodes, firmware and dashboards that put real data from the campus and nearby farms online.",
  },
  {
    domain: "research",
    title: "Research & AI",
    short: "Research",
    icon: "atom",
    description:
      "On-device ML, new sensors and sim-to-real experiments: we test ideas in hardware and write up what we learn.",
  },
];

/** Projects in an area, with a cover, up to `max`. */
export function stationProjects(projects: readonly Project[], station: LabStation, max = 3): Project[] {
  return projects
    .filter((p) => p.cover_url && p.tags.some((t) => t.toLowerCase() === station.domain))
    .slice(0, max);
}

/** The projects page filtered to an area. */
export function stationHref(station: LabStation) {
  return `/projects?tag=${station.domain}`;
}
