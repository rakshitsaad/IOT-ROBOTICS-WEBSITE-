import { juniorCore } from "./junior-core";
import { seniorCore } from "./senior-core";
import { DEFAULT_FOCAL_POINT, MEMBER_LIMITS, type Member, type MemberSocials } from "@/lib/types";

/*
 * The club's people. Seniors live in ./senior-core.ts and juniors in ./junior-core.ts;
 * the plain members at the bottom are still placeholders. Replace with rows from Supabase.
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

/** Juniors keep the ids the old placeholder juniors had (6–12, 22–47), then 55 on. */
const JUNIOR_IDS = [6, 7, 8, 9, 10, 11, 12, ...Array.from({ length: 26 }, (_, i) => 22 + i), 55, 56, 57, 58, 59, 60];
/** Tech & Research share the Tech team's section, Social Media & Multimedia the Social Media team's (JUNIOR_SECTION_NAME). */
const JUNIOR_TEAM = { tech: T.tech, design: T.design, social: T.social, management: T.management, pr: T.pr } as const;

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

  // Junior Core: edit lib/mock/junior-core.ts. Grouped by team on the page; a team's first row is its first card.
  ...juniorCore.map((row, i) =>
    member(JUNIOR_IDS[i] ?? 200 + i, {
      full_name: row.name,
      role: row.role,
      tier: "junior",
      team_id: JUNIOR_TEAM[row.team],
      year: 2,
      branch: "",
      photo_url: row.photo,
      bio: row.bio,
      socials: row.socials,
    }),
  ),

  // Members
  member(13, { full_name: "Neel Saxena", role: "Member", team_id: T.tech, year: 2, branch: "B.Tech ECE" }),
  member(14, { full_name: "Riya Deshpande", role: "Member", team_id: T.tech, year: 2, branch: "B.Tech CSE" }),
  member(15, { full_name: "Aditya Kulkarni", role: "Member", team_id: T.research, year: 2, branch: "B.Tech CSE (Data Science)" }),
  member(16, { full_name: "Zoya Khan", role: "Member", team_id: T.design, year: 1, branch: "B.Des" }),
  member(17, { full_name: "Parth Agarwal", role: "Member", team_id: T.multimedia, year: 1, branch: "B.Tech CSE" }),
  member(18, { full_name: "Myra Singh", role: "Member", team_id: T.social, year: 1, branch: "BA Economics" }),
];
