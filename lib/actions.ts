"use server";

import { addApplication, addContactMessage, addRecruitmentSubscriber, getSettings } from "./data";
import { contactSchema, type ContactResult } from "./contact";
import { applicationSchema, characterBySlug, isHiring, resumeError, type ApplyResult } from "./join";

/** Result of the home join card's "Get notified" form. */
export interface NotifyState {
  status: "idle" | "ok" | "error";
  message: string;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Stores an email to contact when recruitment opens (used while settings.recruitment_open is false). */
export async function notifyWhenRecruiting(_prev: NotifyState, formData: FormData): Promise<NotifyState> {
  const email = String(formData.get("email") ?? "").trim();
  if (email.length > 254 || !EMAIL.test(email)) {
    return { status: "error", message: "Please enter a valid email address." };
  }
  await addRecruitmentSubscriber(email);
  return { status: "ok", message: "Thanks! We'll email you the day applications open." };
}

/**
 * The /contact form. Validates again on the server (the same zod schema as the form), drops bot submissions (the
 * honeypot field is filled) without saying so, and saves the message.
 */
export async function sendContactMessage(input: unknown): Promise<ContactResult> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }
  const { website, ...message } = parsed.data;
  if (website) return { status: "ok" }; // a bot: pretend it worked
  try {
    await addContactMessage(message);
    return { status: "ok" };
  } catch {
    return { status: "error", message: "We couldn't send that just now. Please try again." };
  }
}

/**
 * /join/apply. Checks everything again on the server (the same zod schema as the form, the resume's type and size, and
 * that the team exists and is hiring), then saves the application. Returns the applicant's reference.
 */
export async function submitApplication(formData: FormData): Promise<ApplyResult> {
  const fields = Object.fromEntries(
    ["name", "phone", "email", "year", "branch", "team", "skills", "why", "linkedin", "github"].map((k) => [k, String(formData.get(k) ?? "")]),
  );
  const parsed = applicationSchema.safeParse(fields);
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Please check the form." };
  const resume = formData.get("resume");
  const fileError = resumeError(resume instanceof File ? resume : null);
  if (fileError) return { status: "error", message: fileError };
  const character = characterBySlug(parsed.data.team);
  if (!character) return { status: "error", message: "Pick a team." };
  if (!isHiring(character.team, await getSettings())) {
    return { status: "error", message: `${character.team} opens next round. Pick a team that's hiring.` };
  }
  try {
    const reference = await addApplication({ ...parsed.data, github: parsed.data.github || null }, resume as File);
    return { status: "ok", reference };
  } catch {
    return { status: "error", message: "We couldn't send your application just now. Please try again." };
  }
}
