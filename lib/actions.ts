"use server";

import { addRecruitmentSubscriber } from "./data";

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
