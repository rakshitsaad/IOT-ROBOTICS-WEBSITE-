/**
 * /about copy (DESIGN.md §15): mission and vision, and the three ways the club works. Client-safe.
 */
import type { Accent } from "./types";

/** Mission and vision. */
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

/** The three pillars: how the club works. */
export const ABOUT_PILLARS: { title: string; body: string }[] = [
  {
    title: "Workshops",
    body: "Hands-on sessions on soldering, ESP32, sensors and ROS. We bring the kits.",
  },
  {
    title: "Projects",
    body: "Small teams take a drone, rover or connected device from sketch to prototype.",
  },
  {
    title: "Competitions",
    body: "We take our builds to hackathons and robotics meets, and bring back trophies.",
  },
];
