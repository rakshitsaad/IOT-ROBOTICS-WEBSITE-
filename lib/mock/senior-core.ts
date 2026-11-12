import type { MemberSocials, MemberYear } from "@/lib/types";

/*
 * SENIOR CORE: the 15 people on /members, in display order (the first one is spread 1).
 * Edit this file only; lib/mock/members.ts turns these rows into members.
 *
 * Photos: put each portrait in public/members/senior/firstname-lastname.jpg
 * (portrait 4:5, e.g. 960 × 1200) and set photo to "/members/senior/firstname-lastname.jpg".
 * Photos are cropped to 4:5 around the person, at most 1200 × 1500.
 *
 * Every spread uses the split layout: the portrait fills the left half of the screen.
 * (cutout is unused while CYCLE in lib/members.ts is split only.)
 */

export interface SeniorRow {
  /** Full name, shown huge in Bodoni Moda. Two words or more read best ("Aarav Mehta"). */
  name: string;
  /** Position title, e.g. "President". */
  role: string;
  /** Short line set above the name, e.g. "The President". null hides it. */
  kicker: string | null;
  /** Year of study, 1–4. */
  year: MemberYear;
  /** e.g. "B.Tech CSE". */
  branch: string;
  /** Max 140 characters (the mock throws if longer). Shown in italic. */
  quote: string;
  /** Max 300 characters. */
  bio: string;
  /** "/members/senior/firstname-lastname.jpg" */
  photo: string;
  /** Optional transparent PNG for the cutout layout; null = layout A instead. */
  cutout: string | null;
  /** Profile URLs, or null to hide that link. */
  socials: MemberSocials;
}

const NO_SOCIALS: MemberSocials = { linkedin: null, github: null, instagram: null };

const QUOTE = "Placeholder quote. One short line about why they build things.";
const BIO = "Placeholder bio. Two or three sentences on what they do in the club, what they build and what they are known for.";

// year, branch, quote and bio are still placeholders: fill them in per person.
export const seniorCore: SeniorRow[] = [
  { name: "Tanmay Sahai", role: "President", kicker: "The President", year: 4, branch: "Branch", quote: QUOTE, bio: BIO, photo: "/members/senior/tanmay-sahai.jpg", cutout: null, socials: NO_SOCIALS },
  { name: "Sujal Raj", role: "Vice President", kicker: "The Vice President", year: 4, branch: "Branch", quote: QUOTE, bio: BIO, photo: "/members/senior/sujal-raj.jpg", cutout: null, socials: NO_SOCIALS },
  { name: "Nikhil Yadav", role: "General Secretary", kicker: "The General Secretary", year: 4, branch: "Branch", quote: QUOTE, bio: BIO, photo: "/members/senior/nikhil-yadav.jpg", cutout: null, socials: NO_SOCIALS },
  { name: "Manan Uppal", role: "Tech Head", kicker: "The Tech Head", year: 4, branch: "Branch", quote: QUOTE, bio: BIO, photo: "/members/senior/manan-uppal.jpg", cutout: null, socials: NO_SOCIALS },
  { name: "Aval Tuteja", role: "Management Head", kicker: "The Management Head", year: 4, branch: "Branch", quote: QUOTE, bio: BIO, photo: "/members/senior/aval-tuteja.jpg", cutout: null, socials: NO_SOCIALS },
  { name: "Arnav Shrivastava", role: "Social Media & Multimedia Head", kicker: "The Social Media & Multimedia Head", year: 4, branch: "Branch", quote: QUOTE, bio: BIO, photo: "/members/senior/arnav-shrivastava.jpg", cutout: null, socials: NO_SOCIALS },
  { name: "Kanishka", role: "PR & Outreach Head", kicker: "The PR & Outreach Head", year: 4, branch: "Branch", quote: QUOTE, bio: BIO, photo: "/members/senior/kanishka.jpg", cutout: null, socials: NO_SOCIALS },
  { name: "Rushil Gupta", role: "Design Head", kicker: "The Design Head", year: 4, branch: "Branch", quote: QUOTE, bio: BIO, photo: "/members/senior/rushil-gupta.jpg", cutout: null, socials: NO_SOCIALS },
  { name: "Daksh Malav", role: "Tech Sub-head", kicker: "The Tech Sub-head", year: 4, branch: "Branch", quote: QUOTE, bio: BIO, photo: "/members/senior/daksh-malav.jpg", cutout: null, socials: NO_SOCIALS },
  { name: "Kartikeyan Sharma", role: "Research Sub-head", kicker: "The Research Sub-head", year: 4, branch: "Branch", quote: QUOTE, bio: BIO, photo: "/members/senior/kartikeyan-sharma.jpg", cutout: null, socials: NO_SOCIALS },
  { name: "Prakrity Sharma", role: "Management Sub-head", kicker: "The Management Sub-head", year: 4, branch: "Branch", quote: QUOTE, bio: BIO, photo: "/members/senior/prakrity-sharma.jpg", cutout: null, socials: NO_SOCIALS },
  { name: "Yagay", role: "Management Sub-head", kicker: "The Management Sub-head", year: 4, branch: "Branch", quote: QUOTE, bio: BIO, photo: "/members/senior/yagay.jpg", cutout: null, socials: NO_SOCIALS },
  { name: "Ramya Garg", role: "Design Sub-head", kicker: "The Design Sub-head", year: 4, branch: "Branch", quote: QUOTE, bio: BIO, photo: "/members/senior/ramya-garg.jpg", cutout: null, socials: NO_SOCIALS },
  { name: "Krrish Joydeep", role: "Multimedia Sub-head", kicker: "The Multimedia Sub-head", year: 4, branch: "Branch", quote: QUOTE, bio: BIO, photo: "/members/senior/krrish-joydeep.jpg", cutout: null, socials: NO_SOCIALS },
  { name: "Aayushi Malik", role: "Social Media Sub-head", kicker: "The Social Media Sub-head", year: 4, branch: "Branch", quote: QUOTE, bio: BIO, photo: "/members/senior/aayushi-malik.jpg", cutout: null, socials: NO_SOCIALS },
];
