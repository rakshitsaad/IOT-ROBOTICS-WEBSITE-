/**
 * /about config (DESIGN.md §15). Client-safe: the intro's scroll controller reads ABOUT_INTRO, the server sections
 * read the copy.
 */
import type { Accent } from "./types";

/** The first section (DESIGN.md §15): pinned on md+ while the arm behind the page plays its intro keys (§22). */
export const ABOUT_INTRO = {
  /** Pin length on md+, in screens (100vh each). */
  pin: 1.5,
} as const;

/** Mission and vision cards. */
export const ABOUT_PURPOSE: { label: string; accent: Accent; title: string; body: string }[] = [
  {
    label: "Mission",
    accent: "red",
    title: "Put real hardware in every student's hands",
    body: "We run the workshops, labs and build nights where first-years solder their first board and final-years ship robots that compete. Everyone builds; nobody just watches.",
  },
  {
    label: "Vision",
    accent: "white",
    title: "A campus where ideas leave the slide deck",
    body: "We want Bennett to be the place where a sketch on Monday is a working prototype by Friday: drones, connected devices and robots that solve problems people actually have.",
  },
];

export type PillarIconName = "workshop" | "project" | "competition";

/** The three pillars. */
export const ABOUT_PILLARS: { icon: PillarIconName; accent: Accent; title: string; body: string }[] = [
  {
    icon: "workshop",
    accent: "white",
    title: "Workshops",
    body: "Hands-on sessions on soldering, ESP32, sensors and ROS. We bring the kits.",
  },
  {
    icon: "project",
    accent: "red",
    title: "Projects",
    body: "Small teams take a drone, rover or connected device from sketch to prototype.",
  },
  {
    icon: "competition",
    accent: "white",
    title: "Competitions",
    body: "We take our builds to hackathons and robotics meets, and bring back trophies.",
  },
];
