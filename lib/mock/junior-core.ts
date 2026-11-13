import type { MemberSocials } from "@/lib/types";

/*
 * JUNIOR CORE: the people in the team sections on /members. Edit this file only;
 * lib/mock/members.ts turns these rows into members.
 *
 * Order matters: within a team, the first row is the first card (the one that starts open).
 * Photos: public/members/junior/firstname-lastname.jpg, cropped to 4:5 with the face in the
 * middle (a closed card is a narrow strip down the centre of the photo).
 */

export interface JuniorRow {
  name: string;
  /** The section the person appears in. "tech" is Tech & Research, "social" is Social Media & Multimedia. */
  team: "tech" | "design" | "social" | "management" | "pr";
  /** Shown under the name on the open card, e.g. "Tech Lead". */
  role: string;
  /** Max 160 characters, or null to leave it out. */
  bio: string | null;
  /** "/members/junior/firstname-lastname.jpg", or null for an initials avatar. */
  photo: string | null;
  /** Profile URLs, or null to hide that link. */
  socials: MemberSocials;
}

const NO_SOCIALS: MemberSocials = { linkedin: null, github: null, instagram: null };

// role and bio are still placeholders: fill them in per person.
export const juniorCore: JuniorRow[] = [
  // Tech & Research (Tech and Research are one department)
  { name: "Paras", team: "tech", role: "Junior Core", bio: null, photo: "/members/junior/paras.jpg", socials: NO_SOCIALS },
  { name: "Dhairya", team: "tech", role: "Junior Core", bio: null, photo: "/members/junior/dhairya.jpg", socials: NO_SOCIALS },
  { name: "Krishna Shail", team: "tech", role: "Junior Core", bio: null, photo: "/members/junior/krishna-shail.jpg", socials: NO_SOCIALS },
  { name: "Yana Behera", team: "tech", role: "Junior Core", bio: null, photo: "/members/junior/yana-behera.jpg", socials: NO_SOCIALS },
  { name: "Aastha Tiwari", team: "tech", role: "Junior Core", bio: null, photo: "/members/junior/aastha-tiwari.jpg", socials: NO_SOCIALS },
  { name: "Jigyasa Purohit", team: "tech", role: "Junior Core", bio: null, photo: "/members/junior/jigyasa-purohit.jpg", socials: NO_SOCIALS },
  { name: "Love Kumar", team: "tech", role: "Junior Core", bio: null, photo: "/members/junior/love-kumar.jpg", socials: NO_SOCIALS },
  { name: "Milind Singh", team: "tech", role: "Junior Core", bio: null, photo: "/members/junior/milind-singh.jpg", socials: NO_SOCIALS },
  { name: "Prafull Kumar", team: "tech", role: "Junior Core", bio: null, photo: "/members/junior/prafull-kumar.jpg", socials: NO_SOCIALS },
  { name: "Srisha Sharma", team: "tech", role: "Junior Core", bio: null, photo: "/members/junior/srisha-sharma.jpg", socials: NO_SOCIALS },
  // Design
  { name: "Rakshit Saad", team: "design", role: "Junior Core", bio: null, photo: "/members/junior/rakshit-saad.jpg", socials: NO_SOCIALS },
  { name: "Aayushman Utkrisht", team: "design", role: "Junior Core", bio: null, photo: "/members/junior/aayushman-utkrisht.jpg", socials: NO_SOCIALS },
  { name: "Adya Bansal", team: "design", role: "Junior Core", bio: null, photo: "/members/junior/adya-bansal.jpg", socials: NO_SOCIALS },
  { name: "Astha Rawat", team: "design", role: "Junior Core", bio: null, photo: "/members/junior/astha-rawat.jpg", socials: NO_SOCIALS },
  // Social Media & Multimedia (one department)
  { name: "Arihant", team: "social", role: "Junior Core", bio: null, photo: "/members/junior/arihant.jpg", socials: NO_SOCIALS },
  { name: "Mishthi", team: "social", role: "Junior Core", bio: null, photo: "/members/junior/mishthi.jpg", socials: NO_SOCIALS },
  { name: "Kanika Agarwal", team: "social", role: "Junior Core", bio: null, photo: "/members/junior/kanika-agarwal.jpg", socials: NO_SOCIALS },
  { name: "Nandika Arora", team: "social", role: "Junior Core", bio: null, photo: "/members/junior/nandika-arora.jpg", socials: NO_SOCIALS },
  { name: "Dipanshu", team: "social", role: "Junior Core", bio: null, photo: "/members/junior/dipanshu.jpg", socials: NO_SOCIALS },
  { name: "Prakshi Banga", team: "social", role: "Junior Core", bio: null, photo: "/members/junior/prakshi-banga.jpg", socials: NO_SOCIALS },
  // Management
  { name: "Anushka Pandey", team: "management", role: "Junior Core", bio: null, photo: "/members/junior/anushka-pandey.jpg", socials: NO_SOCIALS },
  { name: "Ayushi", team: "management", role: "Junior Core", bio: null, photo: "/members/junior/ayushi.jpg", socials: NO_SOCIALS },
  { name: "Devansh Vardhan", team: "management", role: "Junior Core", bio: null, photo: "/members/junior/devansh-vardhan.jpg", socials: NO_SOCIALS },
  { name: "Palak Chhabra", team: "management", role: "Junior Core", bio: null, photo: "/members/junior/palak-chhabra.jpg", socials: NO_SOCIALS },
  { name: "Prajjwal Kumar", team: "management", role: "Junior Core", bio: null, photo: "/members/junior/prajjwal-kumar.jpg", socials: NO_SOCIALS },
  { name: "Ricky Chauhan", team: "management", role: "Junior Core", bio: null, photo: "/members/junior/ricky-chauhan.jpg", socials: NO_SOCIALS },
  { name: "Samyak Samanvay", team: "management", role: "Junior Core", bio: null, photo: "/members/junior/samyak-samanvay.jpg", socials: NO_SOCIALS },
  // PR & Outreach
  { name: "Anishka", team: "pr", role: "Junior Core", bio: null, photo: "/members/junior/anishka.jpg", socials: NO_SOCIALS },
  { name: "Harshit Verma", team: "pr", role: "Junior Core", bio: null, photo: "/members/junior/harshit-verma.jpg", socials: NO_SOCIALS },
  { name: "Ishani Agarwal", team: "pr", role: "Junior Core", bio: null, photo: "/members/junior/ishani-agarwal.jpg", socials: NO_SOCIALS },
  { name: "Khushi Sahni", team: "pr", role: "Junior Core", bio: null, photo: "/members/junior/khushi-sahni.jpg", socials: NO_SOCIALS },
  { name: "Lakshya Satwani", team: "pr", role: "Junior Core", bio: null, photo: "/members/junior/lakshya-satwani.jpg", socials: NO_SOCIALS },
  { name: "Sahil Tomar", team: "pr", role: "Junior Core", bio: null, photo: "/members/junior/sahil-tomar.jpg", socials: NO_SOCIALS },
  { name: "Shourya Vijay", team: "pr", role: "Junior Core", bio: null, photo: "/members/junior/shourya-vijay.jpg", socials: NO_SOCIALS },
];
