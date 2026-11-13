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
  /** Full name, shown huge in Instrument Serif capitals. Two words or more read best ("Aarav Mehta"). */
  name: string;
  /** Position title, e.g. "President". */
  role: string;
  /** Short line set above the name, e.g. "The President". null hides it. */
  kicker: string | null;
  /** Year of study, 1–4. */
  year: MemberYear;
  /** e.g. "B.Tech CSE". */
  branch: string;
  /** Max 200 characters (the mock throws if longer), or null for no quote. Shown in italic. */
  quote: string | null;
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

const BIO = "Placeholder bio. Two or three sentences on what they do in the club, what they build and what they are known for.";

// Heads first, then sub-heads. year, branch and bio are still placeholders: fill them in per person.
export const seniorCore: SeniorRow[] = [
  { name: "Tanmay Sahai", role: "President", kicker: "The President", year: 4, branch: "Branch", quote: "Somewhere, something incredible is waiting to be known", bio: BIO, photo: "/members/senior/tanmay-sahai.jpg", cutout: null, socials: NO_SOCIALS },
  { name: "Sujal Raj", role: "Vice President", kicker: "The Vice President", year: 4, branch: "Branch", quote: null, bio: BIO, photo: "/members/senior/sujal-raj.jpg", cutout: null, socials: NO_SOCIALS },
  { name: "Nikhil Yadav", role: "General Secretary", kicker: "The General Secretary", year: 4, branch: "Branch", quote: "Powered by curiosity, caffeine, and game changing last-minute decisions.", bio: BIO, photo: "/members/senior/nikhil-yadav.jpg", cutout: null, socials: NO_SOCIALS },
  { name: "Rushil Gupta", role: "Design Head", kicker: "The Design Head", year: 4, branch: "Branch", quote: "Simplicity is about subtracting the obvious and adding the meaningful.", bio: BIO, photo: "/members/senior/rushil-gupta.jpg", cutout: null, socials: NO_SOCIALS },
  { name: "Aval Tuteja", role: "Management Head", kicker: "The Management Head", year: 4, branch: "Branch", quote: "Somehow in charge, still figuring out why.", bio: BIO, photo: "/members/senior/aval-tuteja.jpg", cutout: null, socials: NO_SOCIALS },
  { name: "Arnav Shrivastava", role: "Social Media & Multimedia Head", kicker: "The Social Media & Multimedia Head", year: 4, branch: "Branch", quote: null, bio: BIO, photo: "/members/senior/arnav-shrivastava.jpg", cutout: null, socials: NO_SOCIALS },
  { name: "Kanishka", role: "PR & Outreach Head", kicker: "The PR & Outreach Head", year: 4, branch: "Branch", quote: "The world feels a little smaller when we make an effort to connect.", bio: BIO, photo: "/members/senior/kanishka.jpg", cutout: null, socials: NO_SOCIALS },
  { name: "Manan Uppal", role: "Tech Head", kicker: "The Tech Head", year: 4, branch: "Branch", quote: "What's up bitch", bio: BIO, photo: "/members/senior/manan-uppal.jpg", cutout: null, socials: NO_SOCIALS },
  { name: "Kartikeyan Sharma", role: "Research Head", kicker: "The Research Head", year: 4, branch: "Branch", quote: null, bio: BIO, photo: "/members/senior/kartikeyan-sharma.jpg", cutout: null, socials: NO_SOCIALS },
  { name: "Daksh Malav", role: "Tech Sub-head", kicker: "The Tech Sub-head", year: 4, branch: "Branch", quote: "Less talk, more prototypes. I believe in turning ideas into tangible innovations.", bio: BIO, photo: "/members/senior/daksh-malav.jpg", cutout: null, socials: NO_SOCIALS },
  { name: "Prakrity Sharma", role: "Management Sub-head", kicker: "The Management Sub-head", year: 4, branch: "Branch", quote: "I have always believed that ideas are only the beginning. What truly matters is the willingness to take responsibility, bring people together, and turn possibilities into something real", bio: BIO, photo: "/members/senior/prakrity-sharma.jpg", cutout: null, socials: NO_SOCIALS },
  { name: "Yagay", role: "Management Sub-head", kicker: "The Management Sub-head", year: 4, branch: "Branch", quote: "Great things happen when teamwork meets execution", bio: BIO, photo: "/members/senior/yagay.jpg", cutout: null, socials: NO_SOCIALS },
  { name: "Ramya Garg", role: "Design Sub-head", kicker: "The Design Sub-head", year: 4, branch: "Branch", quote: "There is a certain beauty in creating something that once existed only in your imagination, something that no one else could see until you gave it a form", bio: BIO, photo: "/members/senior/ramya-garg.jpg", cutout: null, socials: NO_SOCIALS },
  { name: "Krrish Joydeep", role: "Multimedia Sub-head", kicker: "The Multimedia Sub-head", year: 4, branch: "Branch", quote: "Purpose in every move, precision in every action.", bio: BIO, photo: "/members/senior/krrish-joydeep.jpg", cutout: null, socials: NO_SOCIALS },
  { name: "Aayushi Malik", role: "Social Media Sub-head", kicker: "The Social Media Sub-head", year: 4, branch: "Branch", quote: "I choose growth over pressure.", bio: BIO, photo: "/members/senior/aayushi-malik.jpg", cutout: null, socials: NO_SOCIALS },
];
