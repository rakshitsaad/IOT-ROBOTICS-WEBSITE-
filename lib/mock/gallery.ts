import type { GalleryItem } from "@/lib/types";

/**
 * Mock gallery: five event journals. 3D Verse 2026 (14 items) is real (bottom of the file). The other four
 * (Tech Expo 2025, Hack the Hardware, Build Night: October, 22–28 items each, and ROS 2 From Zero, 10 items)
 * are placeholders: photos and video posters are picsum.photos images, and the two
 * video clips are CC0 samples from MDN (they show a flower and a street, not
 * the club). Replace them with real files in Supabase Storage.
 */

const eventId = (n: number) => `40000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const itemId = (event: number, n: number) => `60000000-0000-4000-8${event}00-${String(n).padStart(12, "0")}`;

type Shape = "L" | "P" | "S";
const SIZE: Record<Shape, [number, number]> = { L: [1600, 1067], P: [1067, 1600], S: [1200, 1200] };

const VIDEO = {
  flower: { url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4", width: 1280, height: 720 },
  friday: { url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4", width: 1280, height: 720 },
} as const;

/**
 * A journal row:
 * - ["photo", shape, alt, caption?, group?]
 * - ["video", clip, alt, caption?]
 * - ["note", text]
 */
type Row =
  | readonly ["photo", Shape, string, (string | null)?, string?]
  | readonly ["video", keyof typeof VIDEO, string, (string | null)?]
  | readonly ["note", string];

function journal(event: number, seed: string, takenAt: string, rows: readonly Row[]): GalleryItem[] {
  return rows.map((row, i): GalleryItem => {
    const n = i + 1;
    const base = {
      id: itemId(event, n),
      event_id: eventId(event),
      sort_order: n,
      taken_at: takenAt,
      created_at: `${takenAt}T20:00:00+05:30`,
    };
    if (row[0] === "note") {
      return {
        ...base,
        type: "photo",
        url: null,
        poster_url: null,
        caption: row[1],
        alt: row[1],
        width: null,
        height: null,
        layout_group: null,
      };
    }
    if (row[0] === "video") {
      const clip = VIDEO[row[1]];
      return {
        ...base,
        type: "video",
        url: clip.url,
        poster_url: `https://picsum.photos/seed/${seed}-${n}/1280/720`,
        caption: row[3] ?? null,
        alt: row[2],
        width: clip.width,
        height: clip.height,
        layout_group: null,
      };
    }
    const [width, height] = SIZE[row[1]];
    return {
      ...base,
      type: "photo",
      url: `https://picsum.photos/seed/${seed}-${n}/${width}/${height}`,
      poster_url: null,
      caption: row[3] ?? null,
      alt: row[2],
      width,
      height,
      layout_group: row[4] ?? null,
    };
  });
}

/* Tech Expo 2025 (event 6): 24 items, 19 pages. */
const techExpo = journal(6, "iotr-expo25", "2025-11-22", [
  ["photo", "L", "The atrium before the doors opened, tables still being set up", "7:40am, nothing works yet"],
  ["photo", "P", "A volunteer taping cables to the floor"],
  ["note", "Expo day. 31 projects, one floor, zero sleep."],
  ["photo", "S", "Name cards laid out on a table", null, "setup"],
  ["photo", "P", "A rover charging under a table", null, "setup"],
  ["photo", "L", "Extension boards daisy-chained behind a stall", null, "setup"],
  ["photo", "L", "Visitors crowding around the robotic arm demo", "everyone wanted a turn"],
  ["video", "flower", "Slow clip of the plant-watering rig switching on", "the plant survived"],
  ["photo", "P", "A school student steering the line follower from a phone", "she beat our best lap"],
  ["photo", "L", "Faculty judges reading a project poster"],
  ["photo", "P", "Close-up of a hand-drawn project poster", null, "posters"],
  ["photo", "S", "Sticky notes with visitors' questions on a board", null, "posters"],
  ["photo", "S", "A quadcopter hovering inside the drone cage"],
  ["photo", "L", "A crowd watching the drone demo through the netting", "louder than expected"],
  ["photo", "P", "A member explaining a sensor dashboard on a tablet"],
  ["note", "Most asked question: “does it connect to wifi?” (yes)"],
  ["photo", "L", "The weather station prototype on the atrium balcony"],
  ["photo", "S", "Paper plates of samosas on a workbench", null, "lunch"],
  ["photo", "P", "Two members asleep on beanbags", null, "lunch"],
  ["photo", "L", "Someone fixing a loose wire mid-lunch", null, "lunch"],
  ["video", "friday", "Clip of the atrium filling up with visitors"],
  ["photo", "P", "The robotic arm stacking cubes"],
  ["photo", "L", "The core team on the atrium stairs", "core team, expo '25"],
  ["photo", "S", "Tables packed away at the end of the day", "see you next year"],
]);

/* Hack the Hardware (event 4): 28 items, 23 pages. */
const hackTheHardware = journal(4, "iotr-hack26", "2026-03-14", [
  ["photo", "L", "Teams queueing at registration with backpacks of components", "hour 0, optimism high"],
  ["photo", "S", "The components library: drawers of sensors and motors"],
  ["photo", "P", "Problem statements pinned to a board", null, "kickoff"],
  ["photo", "L", "The organisers on stage at the kickoff", null, "kickoff"],
  ["photo", "S", "A table of laptops and breadboards", null, "kickoff"],
  ["note", "24 hours. 38 teams. One campus problem each."],
  ["photo", "P", "A team sketching a system diagram on a glass wall"],
  ["photo", "L", "Soldering stations with smoke curling up", "smells like progress"],
  ["video", "friday", "Clip of a soil sensor prototype streaming live readings"],
  ["photo", "S", "A 3D printer halfway through a bracket"],
  ["photo", "P", "A mentor debugging an ESP32 with a team", "it was the ground wire"],
  ["photo", "L", "Pizza boxes stacked on a bench at midnight", null, "midnight"],
  ["photo", "P", "Pin numbers written on a hand in marker", null, "midnight"],
  ["photo", "L", "The hall at 3am with half the lights off"],
  ["note", "3:14am: the parking sensor finally detects a car (it was a chair)"],
  ["photo", "P", "Someone asleep under a desk, hoodie over their face"],
  ["photo", "S", "A smart dustbin lid opening on its own"],
  ["photo", "L", "A team testing a water-level alarm in a bucket", "do not knock over the bucket"],
  ["photo", "P", "Sunrise through the auditorium windows", null, "sunrise"],
  ["photo", "S", "Coffee cups lined up on a windowsill", null, "sunrise"],
  ["photo", "L", "Final wiring being zip-tied", null, "sunrise"],
  ["video", "flower", "Clip of the final demo of an automatic streetlight model", "lights on at dusk, every time"],
  ["photo", "L", "Judges watching a demo"],
  ["photo", "P", "A team pitching with a cardboard prototype"],
  ["photo", "S", "The prize cheque on a table"],
  ["photo", "L", "The winning team holding the trophy", "we actually won?!"],
  ["note", "Lesson: always bring spare jumper wires."],
  ["photo", "L", "Every team together in the auditorium", "hack the hardware '26"],
]);

/* Build Night: October (event 3): 22 items, 19 pages. */
const buildNight = journal(3, "iotr-build26", "2026-10-17", [
  ["photo", "L", "The makerspace at 7pm with every bench taken", "bring-your-own-project night"],
  ["note", "Rule of the night: nobody leaves with a broken project."],
  ["photo", "P", "A member soldering a sensor board", "11pm, 14th attempt"],
  ["photo", "S", "A half-built hexapod on a cutting mat", null, "benches"],
  ["photo", "L", "Multimeters and wire strippers on a pegboard", null, "benches"],
  ["photo", "S", "A senior pointing at an oscilloscope trace"],
  ["video", "flower", "Clip of an LED matrix scrolling the club name"],
  ["photo", "P", "A first-year holding up a blinking LED", "first blink :)"],
  ["photo", "L", "Two teams sharing one bench power supply"],
  ["photo", "P", "Chai in paper cups", null, "snacks"],
  ["photo", "S", "A box of biscuits next to a soldering iron", null, "snacks"],
  ["photo", "L", "Someone reading a datasheet on a phone", null, "snacks"],
  ["photo", "L", "A robot arm drawing a circle with a marker", "it's a circle if you squint"],
  ["photo", "P", "A member wiring a relay board"],
  ["note", "Fixed tonight: 2 drones, 1 rover, 1 very stubborn display."],
  ["photo", "S", "A whiteboard full of circuit sketches", "the plan (v7)"],
  ["video", "friday", "Clip of a quadcopter's first hover in the cage", "it flew!"],
  ["photo", "L", "Three people watching the drone cage"],
  ["photo", "P", "Hands holding a finished PCB"],
  ["photo", "S", "A rover driving across the makerspace floor"],
  ["photo", "L", "The makerspace at 11pm, half empty"],
  ["photo", "L", "Everyone who stayed till the end", "build night, oct '26"],
]);

/* ROS 2 From Zero (event 5): 10 items, a short talk. */
const rosFromZero = journal(5, "iotr-ros26", "2026-02-08", [
  ["photo", "L", "The seminar hall filling up before the talk", "full house for a Sunday"],
  ["photo", "P", "The speaker setting up a laptop at the lectern"],
  ["photo", "L", "A Gazebo simulation on the projector screen", "the robot in the sim, not the room"],
  ["photo", "S", "A TurtleBot on the front desk", null, "demo"],
  ["photo", "S", "A member filming the demo on a phone", null, "demo"],
  ["note", "ros2 run, ros2 topic echo, ros2 bag: the three commands of the night."],
  ["photo", "P", "A student asking a question with a raised hand"],
  ["photo", "L", "The TurtleBot following a line of tape on the floor", "it found the door"],
  ["photo", "S", "Notes on a whiteboard: nodes, topics, services"],
  ["photo", "L", "The audience and the speaker after the talk", "ros 2 from zero, feb '26"],
]);

/**
 * 3D Verse 2026 (event 7): the club's own photos and clips, in public/gallery/3d-verse-2026 (web copies of the
 * uploads in "public/gallery/3D VERSE 2026": photos at most 2000px, clips as 720p H.264 with a "-poster.jpg").
 * Row: [file, width, height, alt, taken at, caption?, layout group?]; a .mp4 file is a video.
 */
const VERSE_DIR = "/gallery/3d-verse-2026";
const verseRows: readonly (readonly [string, number, number, string, string, (string | null)?, string?])[] = [
  ["img-1696.jpg", 1125, 2000, "The IoT & Robotics 3D Verse board at the club's stall", "2026-10-26", "3d verse, day one"],
  ["img-1691.jpg", 1125, 2000, "3D printers and printed parts laid out on the stall's table", "2026-10-26"],
  ["img-4039.mp4", 720, 1280, "Clip panning across the 3D Verse board", "2026-10-26"],
  ["img-20261026-122757.jpg", 1125, 2000, "A member setting up a printer at the stall as visitors look on", "2026-10-26"],
  ["video-20261026-125431.mp4", 720, 1280, "Clip of visitors looking at the printers at the stall", "2026-10-26"],
  ["img-1720.jpg", 1125, 2000, "Three members giving a thumbs up in front of the 3D Verse board", "2026-10-26"],
  ["img-4040.mp4", 720, 1280, "Clip of the 3D Verse board and its printed decorations", "2026-10-26"],
  ["video-20261026-162052.mp4", 720, 1280, "Clip of the crowd around the stall in the afternoon", "2026-10-26"],
  ["img-1866.jpg", 2000, 1125, "A full hall at the 3D Verse session, the title on the projector", "2026-10-28", "day three"],
  ["20261028-192439.mp4", 720, 1280, "Clip of the hall full of students at their laptops", "2026-10-28"],
  ["20261028-192715.mp4", 720, 1280, "Clip looking across the rows of the session", "2026-10-28"],
  ["video-20261028-192716.mp4", 1280, 720, "Clip of three resin and filament printers on the stage", "2026-10-28"],
  ["img-20261028-215105.jpg", 2000, 1125, "The team in front of the club's whiteboard", "2026-10-28", null, "team"],
  ["img-20261028-220044.jpg", 2000, 1125, "More of the team in front of the whiteboard", "2026-10-28", null, "team"],
];
const threeDVerse = verseRows.map(([file, width, height, alt, takenAt, caption, group], i): GalleryItem => {
  const video = file.endsWith(".mp4");
  return {
    id: itemId(7, i + 1),
    event_id: eventId(7),
    type: video ? "video" : "photo",
    url: `${VERSE_DIR}/${file}`,
    poster_url: video ? `${VERSE_DIR}/${file.replace(/\.mp4$/, "-poster.jpg")}` : null,
    caption: caption ?? null,
    alt,
    width,
    height,
    layout_group: group ?? null,
    sort_order: i + 1,
    taken_at: takenAt,
    created_at: `${takenAt}T20:00:00+05:30`,
  };
});

export const galleryItems: GalleryItem[] = [...threeDVerse, ...techExpo, ...hackTheHardware, ...buildNight, ...rosFromZero];
