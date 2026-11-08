import { ACHIEVEMENT_DESCRIPTION_MAX, type Achievement } from "@/lib/types";

const id = (n: number) => `50000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

/**
 * Mock achievements, newest first. The photos in /public/achievements/ are generated placeholders and the links point
 * at example.com; replace both with the real ones.
 */
const rows: Achievement[] = [
  {
    id: id(1),
    slug: "bennett-innovation-grant",
    title: "Innovation Grant",
    result: "Grant Awarded",
    category: "other",
    event_name: "Bennett Innovation Fund 2026",
    location: "Bennett University, Greater Noida",
    date: "2026-08-02",
    description:
      "A university seed grant to take Campus Air from one hostel to all of them: forty air-quality nodes reporting to an open dashboard by the end of the year.",
    team: ["Nisha Varghese", "Krish Verma", "Tara Joshi"],
    image_url: "/achievements/bennett-innovation-grant.jpg",
    link: null,
    sort_order: 1,
    created_at: "2026-08-03T10:00:00+05:30",
  },
  {
    id: id(2),
    slug: "ieee-best-paper",
    title: "Swarm Map Merging",
    result: "Best Paper",
    category: "research",
    event_name: "IEEE Delhi Section Student Conference",
    location: "NSUT, New Delhi",
    date: "2026-05-18",
    description:
      "Our paper on merging occupancy maps across a swarm of palm-sized robots over ESP-NOW, with no central server, won the conference's best paper award.",
    team: ["Nisha Varghese", "Neha Pillai", "Aarav Mehta"],
    image_url: "/achievements/ieee-best-paper.jpg",
    link: "https://example.com/papers/swarm-map-merging.pdf",
    sort_order: 2,
    created_at: "2026-05-20T10:00:00+05:30",
  },
  {
    id: id(3),
    slug: "tryst-line-follower",
    title: "Line Follower Sprint",
    result: "Winner",
    category: "competition",
    event_name: "Tryst 2026",
    location: "IIT Delhi, New Delhi",
    date: "2026-03-01",
    description:
      "Line Runner v3 posted the fastest lap of the final round, 11.4 seconds on a track with two blind crossings, on a PID loop tuned the night before.",
    team: ["Yash Thakur", "Arjun Bhatia"],
    image_url: "/achievements/tryst-line-follower.jpg",
    link: "https://example.com/certificates/tryst-2026.pdf",
    sort_order: 3,
    created_at: "2026-03-05T10:00:00+05:30",
  },
  {
    id: id(4),
    slug: "techfest-robo-soccer",
    title: "Robo Soccer Nationals",
    result: "1st Runner-up",
    category: "competition",
    event_name: "Techfest 2025",
    location: "IIT Bombay, Mumbai",
    date: "2025-12-20",
    description:
      "Two omni-wheel bots built from scratch made it through 64 teams to the national final, and lost it 2–1 in the last minute.",
    team: ["Aarav Mehta", "Meera Iyer", "Dev Patel"],
    image_url: "/achievements/techfest-robo-soccer.jpg",
    link: null,
    sort_order: 4,
    created_at: "2025-12-22T10:00:00+05:30",
  },
  {
    id: id(5),
    slug: "smart-india-hackathon",
    title: "Smart India Hackathon",
    result: "Winner",
    category: "competition",
    event_name: "Smart India Hackathon 2025, Hardware Edition",
    location: "Nodal Centre, Pune",
    date: "2025-12-12",
    description:
      "AgriSense, our LoRa soil-moisture network, won the agriculture track against 200+ shortlisted teams after 36 hours of building, soldering and field tests.",
    team: ["Ishita Rao", "Ananya Gupta", "Yash Thakur", "Rahul Menon"],
    image_url: "/achievements/smart-india-hackathon.jpg",
    link: "https://example.com/certificates/sih-2025.pdf",
    sort_order: 5,
    created_at: "2025-12-15T10:00:00+05:30",
  },
  {
    id: id(6),
    slug: "tinyml-best-poster",
    title: "Listening on a Microcontroller",
    result: "Best Poster",
    category: "research",
    event_name: "tinyML Asia Student Forum",
    location: "IISc, Bengaluru",
    date: "2025-11-14",
    description:
      "A keyword spotter that runs in 48 KB of RAM on a two-dollar chip, presented as a poster with a live demo that kept listening all day.",
    team: ["Sara Fernandes", "Simran Kaur"],
    image_url: "/achievements/tinyml-best-poster.jpg",
    link: "https://example.com/papers/tinyml-listen-poster.pdf",
    sort_order: 6,
    created_at: "2025-11-16T10:00:00+05:30",
  },
];

// Keep the mock inside the limit the real table will enforce.
for (const row of rows) {
  if (row.description.length > ACHIEVEMENT_DESCRIPTION_MAX) {
    throw new Error(`${row.title}: description is ${row.description.length} characters (max ${ACHIEVEMENT_DESCRIPTION_MAX})`);
  }
}

export const achievements = rows;
