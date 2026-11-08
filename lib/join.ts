import { z } from "zod";
import type { TeamName } from "./types";

/**
 * /join config (DESIGN.md §21): one cartoon character per team (image, a one-line pitch, skills, where it stands in
 * the hero's crowd), the page's copy (benefits, steps, FAQ), the motion numbers and the application form's schema.
 * Client-safe. Whether a team is hiring comes from settings (`recruitment_open` and `open_teams`), not from here.
 */

/** A box in fractions of the character's square image: [left, top, right, bottom]. */
export type Box = [number, number, number, number];

/**
 * Where a character stands in the crowd, in a 1000-unit-wide frame (the crowd box, `min(100%, 150svh)` wide on md+,
 * the full width on phones): x = the image's centre, s = its size (it is square), b = how far its bottom sits below the
 * hero's bottom edge (negative: above it, faded out), r = its tilt in degrees, z = paint order (higher is in front),
 * fade = the share of the image's height that fades out at the bottom (back characters, so a cut-off body never shows
 * a hard edge). The layouts were checked offline so that every face is clear of the characters in front of it by 18px
 * (room for the bob, sway and parallax) and no head reaches the headline or the buttons.
 */
export interface Spot {
  x: number;
  s: number;
  b: number;
  r: number;
  z: number;
  fade?: number;
}

export type Row = "back" | "middle" | "front";

export interface JoinCharacter {
  team: TeamName;
  /** The team's slug (`teams.slug`), used in `/join/apply?team=`. */
  slug: string;
  image: string;
  /** One line for the speech bubble. */
  pitch: string;
  skills: string[];
  row: Row;
  /** The face (forehead to chin, cheek to cheek; Multimedia's includes the camera over his eye). */
  face: Box;
  /** The hover / tap target: head and shoulders, not the image's transparent corners. */
  hit: Box;
  desktop: Spot;
  /** Phones show five characters (not the back row). */
  mobile: Spot | null;
  /**
   * Load eagerly though not in the front row: the largest image on screen on md+ (the page's largest paint, since most
   * of Tech sits below the edge). The front row is also preloaded; the rest load lazily.
   */
  eager?: boolean;
}

/**
 * The art: transparent PNGs, 1254px square, chest-up. Tech, Design, Multimedia and Research were delivered with a
 * checkerboard painted into the pixels; their cut-outs are in /join/cutout/ (the originals stay in /join/).
 */
export const JOIN_CHARACTERS: JoinCharacter[] = [
  {
    team: "Management",
    slug: "management",
    image: "/join/char-management.png",
    pitch: "Budgets, venues and the plan that makes every event happen.",
    skills: ["Planning", "Budgets", "Logistics", "Spreadsheets"],
    row: "back",
    face: [0.335, 0.155, 0.605, 0.375],
    hit: [0.22, 0.01, 0.74, 0.58],
    desktop: { x: 742, s: 300, b: -100, r: 5, z: 1, fade: 0.4 },
    mobile: null,
  },
  {
    team: "Research",
    slug: "research",
    image: "/join/cutout/char-research.png",
    pitch: "Reads the papers, runs the experiments, writes up what we learn.",
    skills: ["Literature reviews", "Experiments", "Python", "Technical writing"],
    row: "back",
    face: [0.365, 0.15, 0.625, 0.415],
    hit: [0.25, 0.02, 0.73, 0.6],
    desktop: { x: 238, s: 300, b: -118, r: -5, z: 2, fade: 0.4 },
    mobile: null,
  },
  {
    team: "Design",
    slug: "design",
    image: "/join/cutout/char-design.png",
    pitch: "Posters, brand and the UI on our dashboards.",
    skills: ["Figma", "Illustration", "Typography", "Motion"],
    row: "middle",
    face: [0.405, 0.165, 0.67, 0.43],
    hit: [0.2, 0.03, 0.8, 0.62],
    desktop: { x: 366, s: 360, b: 66, r: -6, z: 3, fade: 0.25 },
    mobile: { x: 270, s: 590, b: -236, r: -6, z: 1, fade: 0.35 },
  },
  {
    team: "Multimedia",
    slug: "multimedia",
    image: "/join/cutout/char-multimedia.png",
    pitch: "Shoots the builds, cuts the reels and the after-movies.",
    skills: ["Photography", "Premiere Pro", "Reels", "Sound"],
    row: "middle",
    face: [0.25, 0.185, 0.705, 0.475],
    hit: [0.2, 0.02, 0.8, 0.62],
    desktop: { x: 872, s: 400, b: 50, r: 6, z: 4 },
    mobile: { x: 815, s: 620, b: 154, r: 4, z: 3 },
    eager: true,
  },
  {
    team: "PR",
    slug: "pr",
    image: "/join/char-pr.png",
    pitch: "Talks to sponsors and partner clubs, and gets us on stage.",
    skills: ["Outreach", "Public speaking", "Sponsorships", "Emails that get replies"],
    row: "middle",
    face: [0.395, 0.175, 0.675, 0.47],
    hit: [0.25, 0.02, 0.78, 0.62],
    desktop: { x: 655, s: 360, b: 64, r: 4, z: 5, fade: 0.25 },
    mobile: { x: 735, s: 590, b: -272, r: 5, z: 2, fade: 0.35 },
  },
  {
    team: "Social Media",
    slug: "social-media",
    image: "/join/char-social.png",
    pitch: "Runs our Instagram and LinkedIn, and keeps people talking.",
    skills: ["Content", "Copywriting", "Canva", "Analytics"],
    row: "front",
    face: [0.415, 0.165, 0.705, 0.45],
    hit: [0.08, 0.03, 0.8, 0.62],
    desktop: { x: 118, s: 430, b: 100, r: -5, z: 6 },
    mobile: { x: 170, s: 700, b: 154, r: -5, z: 4 },
  },
  {
    team: "Tech",
    slug: "tech",
    image: "/join/cutout/char-tech.png",
    pitch: "Firmware, PCBs, sensors and the robots themselves.",
    skills: ["C / C++", "ESP32", "ROS 2", "PCB design", "CAD"],
    row: "front",
    face: [0.375, 0.175, 0.65, 0.445],
    hit: [0.25, 0.02, 0.76, 0.62],
    desktop: { x: 520, s: 450, b: 190, r: 1, z: 7 },
    mobile: { x: 520, s: 780, b: 231, r: 1, z: 5 },
  },
];

/** The entrance order: back row first, then the middle, then the front (left to right within a row). */
export const ENTRANCE_ORDER: string[] = (["back", "middle", "front"] as Row[]).flatMap((row) =>
  JOIN_CHARACTERS.filter((c) => c.row === row)
    .sort((a, b) => a.desktop.x - b.desktop.x)
    .map((c) => c.slug),
);

export const characterBySlug = (slug: string) => JOIN_CHARACTERS.find((c) => c.slug === slug);

/** Is a team hiring? (Recruitment open and the team in `open_teams`.) */
export const isHiring = (team: TeamName, settings: { recruitment_open: boolean; open_teams: TeamName[] }) =>
  settings.recruitment_open && settings.open_teams.includes(team);

/** Seconds, px and degrees. */
export const JOIN_MOTION = {
  /** The crowd pops up after the headline: 90ms apart, 0.9s with an overshoot (back.out(1.6)). */
  enterDelay: 0.75,
  enterStagger: 0.09,
  enterDuration: 0.9,
  /** Idle: each character bobs 4–8px over 2.5–4s and sways ±1.5deg, out of sync. */
  bob: [4, 8] as [number, number],
  bobPeriod: [2.5, 4] as [number, number],
  sway: 1.5,
  /** Cursor parallax per row (px, at the screen's edge), and the group's tilt. */
  parallax: { back: 6, middle: 14, front: 24 } as Record<Row, number>,
  tilt: 3,
  /** Hover: lift, scale, and how far the neighbours lean away. */
  lift: 14,
  scale: 1.05,
  lean: 2.5,
};

/* ------------------------------------------------------------------ copy */

export const JOIN_BENEFITS: { icon: "chip" | "build" | "trophy" | "people"; title: string; text: string }[] = [
  {
    icon: "chip",
    title: "Hands-on hardware",
    text: "Our lab, our parts drawer and our tools are yours: microcontrollers, sensors, 3D printers and a soldering bench.",
  },
  {
    icon: "build",
    title: "Real projects",
    text: "Build things people use, from campus air sensors to competition robots, with a team that ships them.",
  },
  {
    icon: "trophy",
    title: "Competitions and travel",
    text: "Represent the club at hackathons and robotics events across India, with travel and entry covered.",
  },
  {
    icon: "people",
    title: "Mentors and alumni",
    text: "Seniors who have built it before review your work, and alumni at labs and startups answer your questions.",
  },
];

export const JOIN_STEPS: { title: string; text: string }[] = [
  { title: "Apply online", text: "Pick a team and tell us about yourself. Five minutes, no CV template needed." },
  { title: "Task round", text: "A small take-home task for your team, sized for a weekend. Your approach matters more than polish." },
  { title: "Interview", text: "A friendly 15-minute chat about your task and what you want to build." },
  { title: "Welcome aboard", text: "Results by email, then an onboarding session, your first project and the group chat." },
];

export const JOIN_FAQ: { q: string; a: string }[] = [
  {
    q: "Who can apply?",
    a: "Any Bennett University student, from any year and any branch. Most of our members are first- and second-years, and plenty aren't engineers.",
  },
  {
    q: "Do I need experience?",
    a: "No. We look for curiosity and follow-through, not a CV. The task round is designed so a beginner who tries hard can do well, and every new member gets a mentor.",
  },
  {
    q: "How much time does it take?",
    a: "Around four to six hours a week: one team meeting, project work you plan with your team, and more in the weeks before an event or competition. Exams come first.",
  },
  {
    q: "Can I join two teams?",
    a: "You apply to one team, so your task round and interview focus on it. Once you're in, you can help on other teams' projects, and you can switch teams next round.",
  },
  {
    q: "When are results announced?",
    a: "About two weeks after applications close. Everyone who applies hears back by email, with feedback on their task if they ask for it.",
  },
];

/* ------------------------------------------------------------- the form */

export const COLLEGE_EMAIL_DOMAIN = "bennett.edu.in";
export const YEARS = ["1st year", "2nd year", "3rd year", "4th year"] as const;
export const BRANCHES = [
  "Computer Science",
  "CSE (AI & ML)",
  "Electronics & Communication",
  "Electrical",
  "Mechanical",
  "Biotechnology",
  "Design",
  "Management (BBA / MBA)",
  "Media & Liberal Arts",
  "Other",
] as const;
export const RESUME = {
  maxBytes: 5 * 1024 * 1024,
  types: ["application/pdf", "image/png", "image/jpeg", "image/webp"],
  accept: ".pdf,.png,.jpg,.jpeg,.webp",
};
export const APPLY_LIMITS = { name: 80, skills: 200, why: 800, whyMin: 50 };

const url = (host: RegExp, label: string) =>
  z
    .string()
    .trim()
    .refine((v) => /^https?:\/\/\S+$/.test(v), "Paste the full link, starting with https://")
    .refine((v) => host.test(v), `That doesn't look like a ${label} link.`);

/** The application's text fields (shared by the form and the server action; the resume is checked separately). */
export const applicationSchema = z.object({
  name: z.string().trim().min(2, "Please tell us your name.").max(APPLY_LIMITS.name, "That's too long."),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s-]/g, ""))
    .refine((v) => /^(\+91)?[6-9]\d{9}$/.test(v), "Enter a 10-digit mobile number."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("That doesn't look like an email address."))
    .refine((v) => v.endsWith(`@${COLLEGE_EMAIL_DOMAIN}`), `Use your @${COLLEGE_EMAIL_DOMAIN} email.`),
  year: z.enum(YEARS, { error: "Pick your year." }),
  branch: z.enum(BRANCHES, { error: "Pick your branch." }),
  team: z.string().min(1, "Pick a team."),
  skills: z.string().trim().min(2, "List a skill or two (or what you want to learn).").max(APPLY_LIMITS.skills, "Keep it short."),
  why: z
    .string()
    .trim()
    .min(APPLY_LIMITS.whyMin, `A little more, please (at least ${APPLY_LIMITS.whyMin} characters).`)
    .max(APPLY_LIMITS.why, `Keep it under ${APPLY_LIMITS.why} characters.`),
  linkedin: url(/linkedin\.com\//i, "LinkedIn"),
  github: z.union([z.literal(""), url(/github\.com\//i, "GitHub")]),
});

export type ApplicationValues = z.input<typeof applicationSchema>;
export type ApplicationInput = z.output<typeof applicationSchema>;

/** The resume: a PDF or an image, at most 5MB. Returns an error message, or null when it's fine. */
export function resumeError(file: File | null | undefined): string | null {
  if (!file || file.size === 0) return "Attach your resume (PDF or an image).";
  if (!RESUME.types.includes(file.type)) return "Use a PDF, PNG, JPG or WebP file.";
  if (file.size > RESUME.maxBytes) return "That file is over 5MB.";
  return null;
}

export type ApplyResult = { status: "ok"; reference: string } | { status: "error"; message: string };
