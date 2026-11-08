/**
 * Row types for the Supabase tables. Column names are snake_case so these can
 * be swapped for generated Supabase types (`supabase gen types typescript`)
 * later without touching components.
 *
 * Tables: members, teams, projects, events, achievements, gallery_items, milestones, settings
 */

export type UUID = string;
/** ISO-8601 timestamp string, e.g. "2026-09-12T10:00:00+05:30" */
export type Timestamp = string;
/** ISO date string, e.g. "2026-03-21" */
export type DateString = string;

/** Accent colours: deep red (the signal colour) or warm white. See DESIGN.md → Tokens. */
export type Accent = "red" | "white";

export type TeamName =
  | "Tech"
  | "Research"
  | "Design"
  | "Multimedia"
  | "Social Media"
  | "Management"
  | "PR";

/* ------------------------------------------------------------------ teams */
export interface Team {
  id: UUID;
  slug: string;
  name: TeamName;
  /** Must follow the team accent map in DESIGN.md. */
  accent: Accent;
  description: string;
  sort_order: number;
  created_at: Timestamp;
}

/* ---------------------------------------------------------------- members */
export type MemberYear = 1 | 2 | 3 | 4;

/**
 * Where a member sits on the /members page.
 * - senior: Senior Core (full profiles at the top of /members)
 * - junior: Junior Core (grouped by team)
 * - member: everyone else
 */
export type MemberTier = "senior" | "junior" | "member";

/** Profile links (a jsonb column). Missing networks are null. */
export interface MemberSocials {
  linkedin: string | null;
  github: string | null;
  instagram: string | null;
}

export interface Member {
  id: UUID;
  full_name: string;
  /** Position title, e.g. "President", "Tech Lead", "Member". */
  role: string;
  /** Short role line set above the name in Senior Core, e.g. "The President". */
  kicker: string | null;
  /** null for Senior Core members who sit above the teams. */
  team_id: UUID | null;
  tier: MemberTier;
  year: MemberYear;
  branch: string;
  photo_url: string | null;
  /**
   * Where the portrait is anchored when it is cropped: a CSS object-position
   * value such as "50% 30%" (the column default, DEFAULT_FOCAL_POINT). Junior
   * Core crops the same photo to a 76px pill and a 460px card, so it matters there.
   */
  focal_point: string;
  /** Transparent PNG of the person, cut out from the background. Optional; not shown on the site at the moment. */
  cutout_url: string | null;
  /** Max 300 characters (seniors) or 160 (juniors): MEMBER_LIMITS. */
  bio: string | null;
  /** Max 140 characters. Senior Core profiles show it as a pull quote. */
  quote: string | null;
  socials: MemberSocials;
  is_active: boolean;
  /** Display order within the tier (ascending). */
  sort_order: number;
  created_at: Timestamp;
}

/**
 * Content limits for member text columns, per tier (also enforced on the mock
 * rows). Junior Core shows the bio on two lines of a card, so it is shorter.
 */
export const MEMBER_LIMITS: Record<MemberTier, { quote: number; bio: number }> = {
  senior: { quote: 140, bio: 300 },
  junior: { quote: 140, bio: 160 },
  member: { quote: 140, bio: 300 },
};

/** The `focal_point` column default: centred, a little above the middle (faces sit high in portraits). */
export const DEFAULT_FOCAL_POINT = "50% 30%";

/* --------------------------------------------------------------- projects */
export type ProjectStatus = "ongoing" | "completed" | "prototype";

/** One photo in a project's gallery (`projects.images`, jsonb). */
export interface ProjectImage {
  url: string;
  /** Pixel size of the file, so the /projects strip can lay tiles out before they load. */
  width: number;
  height: number;
  alt: string;
}

export interface Project {
  id: UUID;
  slug: string;
  title: string;
  /** The one-line "short description" (project cards and page intros). */
  summary: string;
  description: string;
  cover_url: string | null;
  /** 4–10 photos for the project's gallery, in display order (the cover is shown before them). */
  images: ProjectImage[];
  tags: string[];
  tech_stack: string[];
  status: ProjectStatus;
  team_id: UUID | null;
  lead_member_id: UUID | null;
  /** The people who built it; the data layer resolves them to names (`ProjectWithTeam.team`). */
  member_ids: UUID[];
  /** Source code. Optional: the "Source code" link only shows when it is set. */
  repo_url: string | null;
  demo_url: string | null;
  year: number;
  is_featured: boolean;
  sort_order: number;
  created_at: Timestamp;
}

/* ----------------------------------------------------------------- events */
export type EventType =
  | "workshop"
  | "hackathon"
  | "talk"
  | "competition"
  | "meetup"
  | "exhibition";

/** Whether an event is still ahead (registrations, countdown) or done (photos, gallery). */
export type EventStatus = "upcoming" | "past";

export interface ClubEvent {
  id: UUID;
  slug: string;
  title: string;
  summary: string;
  description: string;
  type: EventType;
  status: EventStatus;
  starts_at: Timestamp;
  ends_at: Timestamp | null;
  venue: string;
  /** Free-form labels shown as small pills, e.g. ["ESP32", "Beginner friendly"]. */
  tags: string[];
  /** Poster or cover image (4:5 works best): the home event section, the gallery shelf, the /events grid. */
  cover_url: string | null;
  /** Wide 16:9 photo or poster for the /events feature card. */
  banner_url: string | null;
  /**
   * Optional transparent PNG of the main person or object in the banner, for the /events pop-out. It is as
   * wide as the banner and 1.2× as tall: its bottom edge lines up with the banner's, and the extra 20% on top
   * holds the part of the figure that leaves the banner (the head pokes out above the card).
   */
  cutout_url: string | null;
  /** Horizontal focus of the banner when the card crops its sides (phones): 0–100, default 50. Put the figure here. */
  banner_focal_x: number | null;
  /** Optional page tint for /events (a hex colour). Without it, the page samples the banner's dominant colour. */
  accent_color: string | null;
  registration_url: string | null;
  is_published: boolean;
  created_at: Timestamp;
}

/* ----------------------------------------------------------- achievements */
export type AchievementCategory = "competition" | "research" | "other";

/** Longest allowed achievement description (the /achievements slide shows it in at most 3 lines). */
export const ACHIEVEMENT_DESCRIPTION_MAX = 200;

/** One win, award or published result, shown on /achievements (DESIGN.md §19). */
export interface Achievement {
  id: UUID;
  slug: string;
  /** Short name, set huge on the slide in two lines, e.g. "Smart India Hackathon". */
  title: string;
  /** "Winner", "1st Runner-up", "Best Paper", "Grant Awarded"… */
  result: string;
  category: AchievementCategory;
  /** The competition, conference or programme, e.g. "Smart India Hackathon 2025". */
  event_name: string;
  /** Where it happened, e.g. "IIT Delhi, New Delhi". */
  location: string;
  date: DateString;
  /** At most ACHIEVEMENT_DESCRIPTION_MAX characters. */
  description: string;
  /** Team members' names, as shown. */
  team: string[];
  /** A landscape photo of the team or the event (the slide's full-screen background). */
  image_url: string;
  /** Optional proof: a certificate, a paper or a news story. */
  link: string | null;
  sort_order: number;
  created_at: Timestamp;
}

/* ---------------------------------------------------------- gallery_items */
export type GalleryItemType = "photo" | "video";

/**
 * One photo, video or note in an event's journal (/gallery/[slug]). The
 * journal turns consecutive items into pages (lib/gallery.ts):
 * - a photo or a video is a page;
 * - consecutive photos sharing a `layout_group` become one collage page;
 * - a row with a caption and no `url` is a handwritten note page.
 */
export interface GalleryItem {
  id: UUID;
  event_id: UUID;
  type: GalleryItemType;
  /** The photo or video file. null for a note (caption only). */
  url: string | null;
  /** Still frame shown before a video plays. Videos only. */
  poster_url: string | null;
  /** Short caption shown under the photo; a note's whole text. */
  caption: string | null;
  /** Describes the photo or video for screen readers. */
  alt: string;
  /** Intrinsic size of the photo or video, for the masonry grid and next/image. null for notes. */
  width: number | null;
  height: number | null;
  /** Consecutive photos with the same group become one collage page (2–3 photos each). */
  layout_group: string | null;
  /** Order within the event's journal (ascending). */
  sort_order: number;
  taken_at: DateString | null;
  created_at: Timestamp;
}

/* ------------------------------------------------------------- milestones */
/** One moment in the club's history: a dot and a year card on the /about timeline. */
export interface Milestone {
  id: UUID;
  year: number;
  title: string;
  /** One line. */
  description: string;
  /** Display order (ascending), oldest first. */
  sort_order: number;
  created_at: Timestamp;
}

/* --------------------------------------------------------------- partners */
/** A partner or sponsor, shown as a greyscale logo in the /contact hero. */
export interface Partner {
  id: UUID;
  name: string;
  /** A light (white) logo on a transparent background, SVG or PNG, about 5:1. */
  logo_url: string;
  url: string | null;
  sort_order: number;
  created_at: Timestamp;
}

/* ------------------------------------------------------- contact_messages */
/** The /contact form's subjects (the `subject` column). */
export type ContactSubject = "general" | "join" | "collaboration" | "sponsorship" | "workshop" | "other";

export interface ContactMessage {
  id: UUID;
  name: string;
  email: string;
  subject: ContactSubject;
  /** At most 1000 characters (CONTACT_LIMITS in lib/contact.ts). */
  message: string;
  created_at: Timestamp;
}

/* ----------------------------------------------------------- applications */
/** A recruitment application from /join/apply. `resume_path` is where the uploaded file is stored (Supabase Storage). */
export interface Application {
  id: UUID;
  /** Shown to the applicant, e.g. "IOTR-26-4F7K". */
  reference: string;
  name: string;
  phone: string;
  email: string;
  year: string;
  branch: string;
  /** `teams.slug`. */
  team: string;
  skills: string;
  why: string;
  linkedin: string;
  github: string | null;
  resume_path: string;
  created_at: Timestamp;
}

/* --------------------------------------------------------------- settings */
/** Single-row table holding site-wide content. */
export interface Settings {
  id: UUID;
  club_name: string;
  /** Short form used where space is tight (e.g. the logo on mobile). */
  club_short_name: string;
  college_name: string;
  /** Year the club was founded, shown as "EST. 2019" in the home hero. */
  founded_year: number | null;
  tagline: string;
  contact_email: string;
  /** Shown on /contact with a copy button; null hides the row. */
  contact_phone: string | null;
  /** The lab's postal address (/contact sidebar and map caption). */
  lab_address: string;
  /** What the /contact map searches for (a place name or "lat,lng"). */
  map_query: string;
  instagram_url: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  announcement_enabled: boolean;
  announcement_text: string;
  announcement_link_label: string | null;
  announcement_link_url: string | null;
  recruitment_open: boolean;
  /** Teams currently taking applications, shown as pills on the home join card. */
  open_teams: TeamName[];
  join_form_url: string | null;
  updated_at: Timestamp;
}
