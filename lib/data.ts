import "server-only";
import { cacheLife } from "next/cache";
import * as mock from "./mock";
import { buildJournalPages, isMedia, journalYear, type Journal, type JournalSummary } from "./gallery";
import { sortShowcase, type EventPhoto, type ShowcaseEvent } from "./events";
import type { ProjectWithTeam } from "./projects";
import { LAB_STATIONS } from "./home";
import { SENIOR_CORE_TERM } from "./members";
import { PODIUM, type MissionStats } from "./mission";
import type {
  Achievement,
  ClubEvent,
  Application,
  ContactMessage,
  GalleryItem,
  Member,
  Milestone,
  Partner,
  Project,
  Settings,
  Team,
} from "./types";

/**
 * Data access layer. Every page/component reads through these functions.
 * Today they return mock data; later each body becomes a Supabase query.
 *
 * Cache Components is on (next.config.ts). When these start doing real I/O,
 * keep `'use cache'` (plus cacheLife/cacheTag) at the top of each function so
 * the shared layout stays in the static shell. Read cookies/headers outside
 * these functions and pass values in as arguments.
 */

export async function getSettings(): Promise<Settings> {
  "use cache";
  return mock.settings;
}

export async function getTeams(): Promise<Team[]> {
  "use cache";
  return [...mock.teams].sort((a, b) => a.sort_order - b.sort_order);
}

export async function getMembers(): Promise<Member[]> {
  "use cache";
  return mock.members
    .filter((m) => m.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);
}

/** Senior Core (tier "senior"), in display order: the /members spreads. */
export async function getSeniorCore(): Promise<Member[]> {
  "use cache";
  return (await getMembers()).filter((m) => m.tier === "senior");
}

/** Junior Core (tier "junior"), in display order. */
export async function getJuniorCore(): Promise<Member[]> {
  "use cache";
  return (await getMembers()).filter((m) => m.tier === "junior");
}

/** One team's Junior Core members, for the /members accordions. */
export interface JuniorCoreTeam {
  team: Team;
  members: Member[];
}

/**
 * Junior Core grouped by team, in the teams' `sort_order`; members keep their
 * own `sort_order` within a team. Teams without juniors are left out.
 */
export async function getJuniorCoreByTeam(): Promise<JuniorCoreTeam[]> {
  "use cache";
  const [teams, juniors] = await Promise.all([getTeams(), getJuniorCore()]);
  return teams
    .map((team) => ({ team, members: juniors.filter((m) => m.team_id === team.id) }))
    .filter((group) => group.members.length > 0);
}

export async function getProjects(): Promise<Project[]> {
  "use cache";
  return [...mock.projects].sort((a, b) => a.sort_order - b.sort_order);
}

/**
 * Every project with its team's names (from `member_ids`, in that order;
 * unknown or inactive members are left out): the /projects reel and gallery.
 */
export async function getProjectsWithTeam(): Promise<ProjectWithTeam[]> {
  "use cache";
  const [projects, members] = await Promise.all([getProjects(), getMembers()]);
  const names = new Map(members.map((m) => [m.id, m.full_name]));
  return projects.map((p) => ({
    ...p,
    team: p.member_ids.flatMap((id) => names.get(id) ?? []),
  }));
}

/** One project (/projects/[slug]), or null. */
export async function getProject(slug: string): Promise<ProjectWithTeam | null> {
  "use cache";
  return (await getProjectsWithTeam()).find((p) => p.slug === slug) ?? null;
}

export async function getEvents(): Promise<ClubEvent[]> {
  "use cache";
  return mock.events
    .filter((e) => e.is_published)
    .sort((a, b) => b.starts_at.localeCompare(a.starts_at));
}

export async function getAchievements(): Promise<Achievement[]> {
  "use cache";
  return [...mock.achievements].sort((a, b) => a.sort_order - b.sort_order);
}

export async function getGalleryItems(): Promise<GalleryItem[]> {
  "use cache";
  return [...mock.galleryItems].sort((a, b) => a.sort_order - b.sort_order);
}

/** The club's history, oldest first: the /about timeline. */
export async function getMilestones(): Promise<Milestone[]> {
  "use cache";
  return [...mock.milestones].sort((a, b) => a.sort_order - b.sort_order);
}

/** Partners and sponsors, in display order (the /contact hero's logo row). */
export async function getPartners(): Promise<Partner[]> {
  "use cache";
  return [...mock.partners].sort((a, b) => a.sort_order - b.sort_order);
}

/**
 * The /gallery shelf: every published event that has gallery items, newest
 * first, with its page, photo and video counts.
 */
export async function getJournals(): Promise<JournalSummary[]> {
  "use cache";
  const [events, items] = await Promise.all([getEvents(), getGalleryItems()]);
  return events.flatMap((event) => {
    const own = items.filter((i) => i.event_id === event.id);
    if (own.length === 0) return [];
    return [
      {
        slug: event.slug,
        title: event.title,
        date: event.starts_at,
        year: journalYear(event.starts_at),
        cover_url: event.cover_url,
        pages: buildJournalPages(own).length,
        photos: own.filter((i) => i.type === "photo" && isMedia(i)).length,
        videos: own.filter((i) => i.type === "video").length,
      },
    ];
  });
}

/** One event's journal (/gallery/[slug]), or null when the event has no gallery. */
export async function getJournal(slug: string): Promise<Journal | null> {
  "use cache";
  const [events, items] = await Promise.all([getEvents(), getGalleryItems()]);
  const event = events.find((e) => e.slug === slug);
  if (!event) return null;
  const own = items.filter((i) => i.event_id === event.id);
  if (own.length === 0) return null;
  return { event, items: own, pages: buildJournalPages(own) };
}

/**
 * /events: every published event with its gallery photos, upcoming first (soonest first), then past (newest
 * first).
 */
export async function getEventShowcase(): Promise<ShowcaseEvent[]> {
  "use cache";
  const [events, items] = await Promise.all([getEvents(), getGalleryItems()]);
  return sortShowcase(
    events.map((event) => {
      const own = items.filter((i) => i.event_id === event.id);
      return {
        ...event,
        photos: own.filter((i): i is EventPhoto => i.type === "photo" && isMedia(i)),
        has_gallery: own.length > 0,
      };
    }),
  );
}

/* ------------------------------------------------------------- derived */

export async function getFeaturedProjects(): Promise<Project[]> {
  "use cache";
  return (await getProjects()).filter((p) => p.is_featured);
}

/**
 * The next published event that hasn't started yet, or null. Depends on the
 * current time, so it is cached for an hour (the page re-renders hourly) and
 * the countdown on the page handles the last stretch on the client.
 */
export async function getUpcomingEvent(): Promise<ClubEvent | null> {
  "use cache";
  cacheLife("hours");
  const now = Date.now();
  const upcoming = (await getEvents())
    .filter((e) => Date.parse(e.starts_at) > now)
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  return upcoming[0] ?? null;
}

/** The next workshop that hasn't started, or null (the /contact badge while recruitment is closed). */
export async function getUpcomingWorkshop(): Promise<ClubEvent | null> {
  "use cache";
  cacheLife("hours");
  const now = Date.now();
  const upcoming = (await getEvents())
    .filter((e) => e.type === "workshop" && Date.parse(e.starts_at) > now)
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  return upcoming[0] ?? null;
}

export interface HomeStats {
  members: number;
  projects: number;
  /** Published events that have already started. */
  events: number;
  /** Whole years since settings.founded_year (0 if unknown). */
  years: number;
}

/** The home page's numbers, always computed from the data (never typed in). */
export async function getHomeStats(): Promise<HomeStats> {
  "use cache";
  cacheLife("hours");
  const [settings, members, projects, events] = await Promise.all([
    getSettings(),
    getMembers(),
    getProjects(),
    getEvents(),
  ]);
  const now = new Date();
  return {
    members: members.length,
    projects: projects.length,
    events: events.filter((e) => Date.parse(e.starts_at) <= now.getTime()).length,
    years: settings.founded_year ? Math.max(0, now.getFullYear() - settings.founded_year) : 0,
  };
}

/**
 * The /lab/drone bench's dashboard (DESIGN.md §18). Time-dependent (this year's events, the next event,
 * workshops that have run), so it is cached for hours like getHomeStats().
 */
export async function getMissionStats(): Promise<MissionStats> {
  "use cache";
  cacheLife("hours");
  const [settings, members, projects, events, achievements] = await Promise.all([
    getSettings(),
    getMembers(),
    getProjects(),
    getEvents(),
    getAchievements(),
  ]);
  const now = Date.now();
  const thisYear = new Date(now).getFullYear();

  // Year joined = the term's start year minus (year of study - 1); a running total per year.
  const joined = new Map<number, number>();
  for (const m of members) {
    const y = SENIOR_CORE_TERM.year - (m.year - 1);
    joined.set(y, (joined.get(y) ?? 0) + 1);
  }
  const years = [...joined.keys()].sort((a, b) => a - b);
  let running = 0;
  const growth = years.map((year) => ({ year, total: (running += joined.get(year) ?? 0) }));

  const domains = LAB_STATIONS.map((s) => ({
    domain: s.domain,
    label: s.short,
    count: projects.filter((p) => p.tags.some((t) => t.toLowerCase() === s.domain)).length,
  }));

  const started = (e: ClubEvent) => Date.parse(e.starts_at) <= now;
  const inYear = events.filter((e) => new Date(e.starts_at).getFullYear() === thisYear);
  const future = events.filter((e) => !started(e)).sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at));
  const workshops = events.filter((e) => e.type === "workshop");
  const nextWorkshop = future.find((e) => e.type === "workshop") ?? null;
  const podiums = achievements
    .filter((a) => PODIUM.test(a.result))
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date));

  return {
    clubName: settings.club_name,
    foundedYear: settings.founded_year,
    members: { total: members.length, growth },
    projects: { total: projects.length, domains },
    events: {
      year: thisYear,
      total: inYear.length,
      done: inYear.filter(started).length,
      upcoming: inYear.filter((e) => !started(e)).length,
    },
    next: future[0]
      ? { title: future[0].title, slug: future[0].slug, starts_at: future[0].starts_at, venue: future[0].venue }
      : null,
    workshops: {
      run: workshops.filter(started).length,
      next: nextWorkshop ? { title: nextWorkshop.title, starts_at: nextWorkshop.starts_at } : null,
    },
    competitions: {
      won: podiums.length,
      latest: podiums[0] ? { event: podiums[0].event_name, position: podiums[0].result } : null,
    },
  };
}

/* -------------------------------------------------------------- writes */

/**
 * Someone asked to be emailed when recruitment opens (home join card).
 * Mock: accepted and dropped. With Supabase: insert into a subscribers table.
 */
export async function addRecruitmentSubscriber(email: string): Promise<void> {
  void email;
}

/**
 * Saves a /contact message (contact_messages). The mock keeps it in server memory, after a short pause so the form's
 * sending state shows; with Supabase this becomes an insert.
 */
/**
 * Saves a recruitment application (applications). The mock keeps the row in server memory, records the resume's name
 * and size instead of storing it, and pauses briefly so the form's sending state shows. With Supabase: upload the file
 * to Storage, then insert the row with its path.
 */
export async function addApplication(
  input: Omit<Application, "id" | "reference" | "resume_path" | "created_at">,
  resume: File,
): Promise<string> {
  await new Promise((r) => setTimeout(r, 900));
  const reference = `IOTR-${String(new Date().getFullYear()).slice(2)}-${crypto.randomUUID().slice(0, 4).toUpperCase()}`;
  mock.applications.push({
    ...input,
    id: crypto.randomUUID(),
    reference,
    resume_path: `mock://${resume.name} (${Math.round(resume.size / 1024)} KB)`,
    created_at: new Date().toISOString(),
  });
  return reference;
}

export async function addContactMessage(input: Pick<ContactMessage, "name" | "email" | "subject" | "message">): Promise<void> {
  await new Promise((r) => setTimeout(r, 700));
  mock.contactMessages.push({ ...input, id: crypto.randomUUID(), created_at: new Date().toISOString() });
}
