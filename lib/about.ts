/**
 * /about config (DESIGN.md §15). Client-safe: the hands' scroll controller
 * reads ABOUT_HANDS, the server sections read the copy.
 */
import type { Accent } from "./types";

export const ABOUT_HANDS = {
  /** Pin length, in screens (100svh each). */
  pin: { desktop: 3, mobile: 1.8 },
  /** Gap between the fingertips, in vw, at each stage of the pin. */
  gap: { start: 40, near: 8, close: 2, hold: 1.2, meet: 0, reduced: 2 },
  /** Marks on the pinned timeline, as a share of the pin (0–1). */
  at: {
    /** Title gone, ring at `ring.near`; the hands are about `gap.near` apart. */
    near: 0.35,
    /** The hands are `gap.close` apart. */
    close: 0.65,
    /** Block A rises in, then block B. */
    aIn: 0.37,
    bIn: 0.44,
    /** Blocks A and B slide up and out; block C fades in. */
    out: 0.66,
    cIn: 0.74,
    /** The fingertips close the last gap… */
    meet: 0.9,
    /** …and touch: the glow and the ring flash. */
    touch: 0.955,
  },
  title: { scale: 0.9, blur: 8 },
  ring: { near: 1.15, burst: 1.7 },
  /** Cursor parallax, px: the hands follow the cursor, the ring goes the other way. */
  parallax: { hands: 12, ring: 6 },
  /** After the pin lets go, the stage fades out over this share of a screen. */
  exit: 0.6,
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
