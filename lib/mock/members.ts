import { seniorCore } from "./senior-core";
import { DEFAULT_FOCAL_POINT, MEMBER_LIMITS, type Member, type MemberSocials } from "@/lib/types";

/*
 * Placeholder people. Replace with real rows from Supabase.
 * Portraits are picsum.photos placeholders; /members/cutout-*.png are
 * generated placeholder silhouettes (see DESIGN.md §13), not real cutouts.
 */

const T = {
  tech: "10000000-0000-4000-8000-000000000001",
  research: "10000000-0000-4000-8000-000000000002",
  design: "10000000-0000-4000-8000-000000000003",
  multimedia: "10000000-0000-4000-8000-000000000004",
  social: "10000000-0000-4000-8000-000000000005",
  management: "10000000-0000-4000-8000-000000000006",
  pr: "10000000-0000-4000-8000-000000000007",
} as const;

/** Ids 1–18 predate Senior Core's extra rows (19–21) and Junior Core's (22+), so other mocks' references stay valid. */
const id = (n: number) => `20000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

type MemberInput = Pick<Member, "full_name" | "role" | "year" | "branch"> &
  Partial<Omit<Member, "socials">> & { socials?: Partial<MemberSocials> };

const NO_SOCIALS: MemberSocials = { linkedin: null, github: null, instagram: null };

/** Seniors 1–8 keep the ids other mocks (projects, achievements) point at; 9–15 come after the juniors' 22–47. */
const SENIOR_IDS = [1, 2, 3, 4, 5, 19, 20, 21, 48, 49, 50, 51, 52, 53, 54];

let order = 0;
function member(n: number, { socials, ...input }: MemberInput): Member {
  order += 1;
  const row: Member = {
    id: id(n),
    kicker: null,
    team_id: null,
    tier: "member",
    photo_url: null,
    focal_point: DEFAULT_FOCAL_POINT,
    cutout_url: null,
    bio: null,
    quote: null,
    is_active: true,
    sort_order: order,
    created_at: "2026-07-15T10:00:00+05:30",
    ...input,
    socials: { ...NO_SOCIALS, ...socials },
  };
  // Keep the mock inside the column limits the real table will enforce (they depend on the tier).
  const limits = MEMBER_LIMITS[row.tier];
  for (const key of ["quote", "bio"] as const) {
    const text = row[key];
    if (text && text.length > limits[key]) {
      throw new Error(`${row.full_name}: ${key} is ${text.length} characters (max ${limits[key]} for ${row.tier})`);
    }
  }
  return row;
}

/** A 4:5 placeholder portrait. */
const portrait = (seed: string) => `https://picsum.photos/seed/iotr-${seed}/960/1200`;

const LI = "https://www.linkedin.com/";
const GH = "https://github.com/";
const IG = "https://www.instagram.com/";

export const members: Member[] = [
  // Senior Core: edit lib/mock/senior-core.ts. Every spread uses layout A (lib/members.ts CYCLE).
  ...seniorCore.map((row, i) =>
    member(SENIOR_IDS[i] ?? 100 + i, {
      full_name: row.name,
      role: row.role,
      kicker: row.kicker,
      tier: "senior",
      year: row.year,
      branch: row.branch,
      photo_url: row.photo,
      cutout_url: row.cutout,
      quote: row.quote,
      bio: row.bio,
      socials: row.socials,
    }),
  ),

  // Junior Core (tier "junior"), grouped by team on the page; each team's first row is its lead.
  // Tech has 10 so its accordion wraps past 8. Manav Arora and Aditya Rawat have no photo (initials avatar).
  member(6, {
    full_name: "Ananya Gupta", tier: "junior", role: "Tech Lead", team_id: T.tech, year: 3, branch: "B.Tech ECE",
    photo_url: portrait("ananya"),
    bio: "Runs the firmware stand-ups and reviews every pull request that goes anywhere near a motor driver.",
    socials: { github: GH, linkedin: LI },
  }),
  member(7, {
    full_name: "Vihaan Malhotra", tier: "junior", role: "Research Lead", team_id: T.research, year: 3, branch: "B.Tech CSE",
    photo_url: portrait("vihaan"),
    bio: "Runs the reading group and turns the best paper of the month into an experiment the club can build.",
    socials: { linkedin: LI, github: GH },
  }),
  member(8, {
    full_name: "Saanvi Nair", tier: "junior", role: "Design Lead", team_id: T.design, year: 3, branch: "B.Des Communication Design",
    photo_url: portrait("saanvi"),
    bio: "Sets the look of every poster, badge and dashboard, and guards the brand gradient from overuse.",
    socials: { instagram: IG, linkedin: LI },
  }),
  member(9, {
    full_name: "Arjun Bhatia", tier: "junior", role: "Multimedia Lead", team_id: T.multimedia, year: 3, branch: "BA Journalism & Mass Comm.",
    photo_url: portrait("arjun"), focal_point: "50% 50%",
    bio: "Shoots the after-movies and keeps the camera kit charged, labelled and mostly in one piece.",
    socials: { instagram: IG },
  }),
  member(10, {
    full_name: "Diya Chawla", tier: "junior", role: "Social Media Lead", team_id: T.social, year: 2, branch: "BBA",
    photo_url: portrait("diya"),
    bio: "Plans the posting calendar and writes the captions that make a night of soldering sound exciting.",
    socials: { instagram: IG, linkedin: LI },
  }),
  member(11, {
    full_name: "Krish Verma", tier: "junior", role: "Management Lead", team_id: T.management, year: 3, branch: "B.Tech CSE",
    photo_url: portrait("krish"),
    bio: "Books the venues, chases the permissions and keeps every event run-sheet accurate to the minute.",
    socials: { linkedin: LI },
  }),
  member(12, {
    full_name: "Tara Joshi", tier: "junior", role: "PR Lead", team_id: T.pr, year: 3, branch: "B.Tech Biotechnology",
    photo_url: portrait("tara"), focal_point: "60% 25%",
    bio: "Talks to sponsors, partner clubs and other campuses, and lines up the speakers for our talks.",
    socials: { linkedin: LI, instagram: IG },
  }),

  // Tech
  member(22, {
    full_name: "Neha Pillai", tier: "junior", role: "Firmware Engineer", team_id: T.tech, year: 3, branch: "B.Tech ECE",
    photo_url: portrait("neha"),
    bio: "ESP32, FreeRTOS and a soft spot for oscilloscopes. Neha maintains the club's firmware template.",
    socials: { github: GH },
  }),
  member(23, {
    full_name: "Rahul Menon", tier: "junior", role: "Embedded Systems", team_id: T.tech, year: 3, branch: "B.Tech Electrical",
    photo_url: portrait("rahul"),
    bio: "Writes the low-level drivers for our sensor boards and keeps the bring-up checklist honest.",
    socials: { github: GH, linkedin: LI },
  }),
  member(24, {
    full_name: "Simran Kaur", tier: "junior", role: "PCB Designer", team_id: T.tech, year: 2, branch: "B.Tech ECE",
    photo_url: portrait("simran"), focal_point: "50% 45%",
    bio: "Lays out the club's boards in KiCad, from the drone flight controller to the line-follower shields.",
    socials: { linkedin: LI },
  }),
  member(25, {
    full_name: "Dev Patel", tier: "junior", role: "ROS Developer", team_id: T.tech, year: 3, branch: "B.Tech CSE",
    photo_url: portrait("dev"),
    bio: "Maps the corridors with lidar so the delivery robot can find its own way back to the lab.",
    socials: { github: GH, linkedin: LI },
  }),
  member(26, {
    full_name: "Aisha Qureshi", tier: "junior", role: "Vision Engineer", team_id: T.tech, year: 2, branch: "B.Tech CSE (AI/ML)",
    photo_url: portrait("aisha"), focal_point: "35% 30%",
    bio: "Trains small vision models that run on a Raspberry Pi and still spot a ball across the arena.",
    socials: { github: GH },
  }),
  member(27, {
    full_name: "Kunal Shah", tier: "junior", role: "Mechanical Designer", team_id: T.tech, year: 3, branch: "B.Tech Mechanical",
    photo_url: portrait("kunal"),
    bio: "CAD, 3D printing and laser cutting. If a robot has a chassis, Kunal has reprinted it twice.",
    socials: { linkedin: LI, instagram: IG },
  }),
  member(28, {
    full_name: "Pooja Reddy", tier: "junior", role: "Drone Pilot", team_id: T.tech, year: 2, branch: "B.Tech ECE",
    photo_url: portrait("pooja"),
    bio: "Tunes the PID loops for the quadcopter team and flies the test sessions on the football ground.",
    socials: { instagram: IG },
  }),
  member(29, {
    full_name: "Manav Arora", tier: "junior", role: "IoT Developer", team_id: T.tech, year: 2, branch: "B.Tech CSE",
    // No photo on purpose: shows the initials avatar.
    bio: "Connects the sensors to dashboards: MQTT brokers, time-series databases and the alerts at 3 a.m.",
    socials: { github: GH, linkedin: LI },
  }),
  member(30, {
    full_name: "Tanvi Jain", tier: "junior", role: "Test Engineer", team_id: T.tech, year: 2, branch: "B.Tech ECE",
    photo_url: portrait("tanvi"), focal_point: "55% 20%",
    // Close to the 160-character limit: clamped to two lines on the desktop card.
    bio: "Breaks things on purpose. Tanvi builds the rigs that run every board for a whole night before it is allowed anywhere near a competition robot.",
    socials: { github: GH },
  }),

  // Research
  member(31, {
    full_name: "Ira Banerjee", tier: "junior", role: "Edge AI", team_id: T.research, year: 3, branch: "B.Tech CSE (Data Science)",
    photo_url: portrait("ira"),
    bio: "Squeezes neural networks onto microcontrollers and measures every milliwatt they cost.",
    socials: { github: GH, linkedin: LI },
  }),
  member(32, {
    full_name: "Harsh Vardhan", tier: "junior", role: "Literature Review", team_id: T.research, year: 2, branch: "B.Tech CSE",
    photo_url: portrait("harsh"),
    bio: "Keeps the club's shared bibliography and writes the related-work sections nobody else wants to.",
    socials: { linkedin: LI },
  }),
  member(33, {
    full_name: "Mehak Sood", tier: "junior", role: "Robotics Research", team_id: T.research, year: 3, branch: "B.Tech Mechanical",
    photo_url: portrait("mehak"), focal_point: "60% 25%",
    bio: "Studies soft grippers and builds the prototypes in silicone, one mould at a time.",
    socials: { linkedin: LI, github: GH },
  }),

  // Design
  member(34, {
    full_name: "Rhea Kapoor", tier: "junior", role: "UI Designer", team_id: T.design, year: 2, branch: "B.Des Interaction Design",
    photo_url: portrait("rhea"),
    bio: "Designs the dashboards for our IoT projects and the component library behind this website.",
    socials: { linkedin: LI, instagram: IG },
  }),
  member(35, {
    full_name: "Aryan Sinha", tier: "junior", role: "Brand Designer", team_id: T.design, year: 3, branch: "B.Des Communication Design",
    photo_url: portrait("aryan"),
    bio: "Draws the event identities and the stickers that end up on every laptop in the lab.",
    socials: { instagram: IG },
  }),
  member(36, {
    full_name: "Kavya Menon", tier: "junior", role: "Illustrator", team_id: T.design, year: 2, branch: "B.Des",
    photo_url: portrait("kavya"), focal_point: "50% 50%",
    bio: "Illustrates the build logs, the workshop handouts and the robot mascot's many expressions.",
    socials: { instagram: IG },
  }),
  member(37, {
    full_name: "Nikhil Rao", tier: "junior", role: "Motion Designer", team_id: T.design, year: 2, branch: "B.Des",
    photo_url: portrait("nikhil"),
    bio: "Animates the titles on our reels and the countdowns before every event.",
    socials: { instagram: IG, linkedin: LI },
  }),

  // Multimedia
  member(38, {
    full_name: "Sneha Das", tier: "junior", role: "Photographer", team_id: T.multimedia, year: 2, branch: "BA Journalism & Mass Comm.",
    photo_url: portrait("sneha"),
    bio: "Photographs every build session. Most of the photos on this site are hers.",
    socials: { instagram: IG },
  }),
  member(39, {
    full_name: "Rohit Yadav", tier: "junior", role: "Video Editor", team_id: T.multimedia, year: 2, branch: "B.Tech CSE",
    photo_url: portrait("rohit"), focal_point: "45% 35%",
    bio: "Edits the after-movies overnight, so they are out before the event's hashtag cools down.",
    socials: { instagram: IG, linkedin: LI },
  }),
  member(40, {
    full_name: "Ishaan Gill", tier: "junior", role: "Sound & Livestream", team_id: T.multimedia, year: 3, branch: "B.Tech ECE",
    photo_url: portrait("ishaan"),
    bio: "Runs the sound and the livestream at our events, and the playlist during build nights.",
  }),

  // Social Media
  member(41, {
    full_name: "Zara Ahmed", tier: "junior", role: "Content Writer", team_id: T.social, year: 2, branch: "BA English",
    photo_url: portrait("zara"),
    bio: "Writes the threads and carousels that explain a project in under a minute.",
    socials: { instagram: IG, linkedin: LI },
  }),
  member(42, {
    full_name: "Varun Nair", tier: "junior", role: "Community", team_id: T.social, year: 2, branch: "BBA",
    photo_url: portrait("varun"),
    bio: "Answers the DMs, runs the polls and knows which first-years keep asking about drones.",
    socials: { instagram: IG },
  }),

  // Management
  member(43, {
    full_name: "Anika Bose", tier: "junior", role: "Events", team_id: T.management, year: 3, branch: "BBA",
    photo_url: portrait("anika"),
    bio: "Plans the workshops, from the first poster to the last chair stacked.",
    socials: { linkedin: LI },
  }),
  member(44, {
    full_name: "Siddharth Jha", tier: "junior", role: "Finance", team_id: T.management, year: 2, branch: "B.Com (Hons)",
    photo_url: portrait("siddharth"),
    bio: "Tracks every rupee of the parts budget and gets the reimbursements filed on time.",
    socials: { linkedin: LI },
  }),
  member(45, {
    full_name: "Prisha Malhotra", tier: "junior", role: "Logistics", team_id: T.management, year: 2, branch: "B.Tech Mechanical",
    photo_url: portrait("prisha"),
    bio: "Packs the competition crates and knows where every spare battery is.",
    socials: { instagram: IG },
  }),

  // PR
  member(46, {
    full_name: "Aditya Rawat", tier: "junior", role: "Outreach", team_id: T.pr, year: 2, branch: "B.Tech CSE",
    // No photo on purpose: shows the initials avatar.
    bio: "Runs the school outreach days, where our robots meet a room full of ten-year-olds.",
    socials: { linkedin: LI },
  }),
  member(47, {
    full_name: "Laila Khan", tier: "junior", role: "Sponsorships", team_id: T.pr, year: 3, branch: "BBA",
    photo_url: portrait("laila"),
    bio: "Writes the sponsorship decks and follows up until the parts actually arrive.",
    socials: { linkedin: LI, instagram: IG },
  }),

  // Members
  member(13, { full_name: "Neel Saxena", role: "Member", team_id: T.tech, year: 2, branch: "B.Tech ECE" }),
  member(14, { full_name: "Riya Deshpande", role: "Member", team_id: T.tech, year: 2, branch: "B.Tech CSE" }),
  member(15, { full_name: "Aditya Kulkarni", role: "Member", team_id: T.research, year: 2, branch: "B.Tech CSE (Data Science)" }),
  member(16, { full_name: "Zoya Khan", role: "Member", team_id: T.design, year: 1, branch: "B.Des" }),
  member(17, { full_name: "Parth Agarwal", role: "Member", team_id: T.multimedia, year: 1, branch: "B.Tech CSE" }),
  member(18, { full_name: "Myra Singh", role: "Member", team_id: T.social, year: 1, branch: "BA Economics" }),
];
