import { z } from "zod";
import type { ContactSubject } from "./types";

/**
 * /contact config (DESIGN.md §20): the form's subjects, limits and schema (shared by the form and the server action),
 * the FAQ, the map links and the motion numbers. Client-safe.
 */

export const CONTACT_SUBJECTS: { value: ContactSubject; label: string }[] = [
  { value: "general", label: "General" },
  { value: "join", label: "Join the club" },
  { value: "collaboration", label: "Collaboration" },
  { value: "sponsorship", label: "Sponsorship" },
  { value: "workshop", label: "Workshop request" },
  { value: "other", label: "Other" },
];

export const CONTACT_LIMITS = { name: 80, email: 254, message: 1000, messageMin: 10 };

const SUBJECT_VALUES = CONTACT_SUBJECTS.map((s) => s.value) as [ContactSubject, ...ContactSubject[]];

export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please tell us your name.")
    .max(CONTACT_LIMITS.name, `Keep it under ${CONTACT_LIMITS.name} characters.`),
  email: z
    .string()
    .trim()
    .min(1, "We need an email to reply to.")
    .max(CONTACT_LIMITS.email, "That email is too long.")
    .pipe(z.email("That doesn't look like an email address.")),
  subject: z.enum(SUBJECT_VALUES, { error: "Pick a subject." }),
  message: z
    .string()
    .trim()
    .min(CONTACT_LIMITS.messageMin, `A little more, please (at least ${CONTACT_LIMITS.messageMin} characters).`)
    .max(CONTACT_LIMITS.message, `Keep it under ${CONTACT_LIMITS.message} characters.`),
  /** Honeypot: hidden from people, so anything in it came from a bot. */
  website: z.string().max(200).optional(),
});

/** What the form holds (the subject starts unset: the select shows "Choose a subject" and validation asks for one). */
export type ContactFormValues = z.input<typeof contactSchema>;
export type ContactInput = z.output<typeof contactSchema>;

export type ContactResult = { status: "ok" } | { status: "error"; message: string };

/** A Google Maps embed (no API key) and the "Open in Maps" link for a place name or "lat,lng". */
export const mapEmbedUrl = (q: string) => `https://www.google.com/maps?q=${encodeURIComponent(q)}&z=16&output=embed`;
export const mapOpenUrl = (q: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;

export const CONTACT_FAQ: { q: string; a: string }[] = [
  {
    q: "How do I join the club?",
    a: "We recruit at the start of each semester. Watch the announcement bar or the Join page for the form; you pick the teams you're interested in and we invite you to a short chat and a hands-on task.",
  },
  {
    q: "Do I need any experience?",
    a: "No. Curiosity matters more than a CV. First-years start with our workshops (soldering, Arduino and ESP32, CAD), and every project pairs newer members with someone who has built it before.",
  },
  {
    q: "Can students from other colleges collaborate with us?",
    a: "Yes. We co-host hackathons, share lab time for joint builds and team up for competitions. Send a message with \"Collaboration\" as the subject and tell us what you have in mind.",
  },
  {
    q: "How do sponsorships work?",
    a: "Sponsors fund parts, competition travel and events, and in return get their logo on our builds and event material, talks with our members, and first look at the projects. Pick \"Sponsorship\" and we'll send our deck.",
  },
  {
    q: "Can you run a workshop for our class or school?",
    a: "Often, yes. We run beginner sessions on electronics, IoT and robotics, on campus or at schools nearby. Tell us the audience, the size and a few dates that work.",
  },
  {
    q: "Can I visit the lab?",
    a: "Members can use the lab during open hours, and visitors are welcome at our demo days and exhibitions. Drop us a message before you come so someone can show you around.",
  },
];

/** How long a copy button shows "Copied" (ms). */
export const CONTACT_MOTION = { copied: 1500 };
