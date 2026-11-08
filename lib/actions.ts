"use server";

import { addContactMessage, addRecruitmentSubscriber } from "./data";
import { contactSchema, type ContactResult } from "./contact";

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
