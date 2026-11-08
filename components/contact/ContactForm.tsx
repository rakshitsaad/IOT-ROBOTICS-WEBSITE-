"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "motion/react";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { IrisButton } from "@/components/ui";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { sendContactMessage } from "@/lib/actions";
import { cn } from "@/lib/cn";
import { CONTACT_LIMITS, CONTACT_SUBJECTS, contactSchema, type ContactFormValues, type ContactInput } from "@/lib/contact";
import { BEZIER } from "@/lib/motion";
import { Field, SentCheck, inputClass } from "@/components/forms/fields";
import { ContactIcon } from "./icons";

/**
 * The contact form (DESIGN.md §20): react-hook-form + the zod schema in lib/contact.ts (the server action checks it
 * again). Errors show under each field once it has been left (then update as you type). Sending shows a spinner; on
 * success the form slides away and the sent state comes in (an animated check, "Send another"); on an error, a message
 * and a retry button. A hidden honeypot field catches bots.
 */
type Status = "idle" | "sending" | "sent" | "error";

export function ContactForm() {
  const reduced = useReducedMotion();
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    reset,
    control,
    setFocus,
    formState: { errors },
  } = useForm<ContactFormValues, unknown, ContactInput>({
    resolver: zodResolver(contactSchema),
    mode: "onTouched",
    // The subject starts empty: the select shows "Choose a subject" and the schema asks for one.
    defaultValues: { name: "", email: "", subject: "" as ContactFormValues["subject"], message: "", website: "" },
  });
  const message = useWatch({ control, name: "message" }) ?? "";

  const send = async (values: ContactInput) => {
    setStatus("sending");
    setError("");
    try {
      const res = await sendContactMessage(values);
      if (res.status === "ok") {
        setStatus("sent");
        window.setTimeout(() => document.getElementById("contact-sent")?.focus({ preventScroll: true }), 350);
      } else {
        setStatus("error");
        setError(res.message);
      }
    } catch {
      setStatus("error");
      setError("We couldn't reach the server. Check your connection and try again.");
    }
  };
  const submit = handleSubmit(send);

  const again = () => {
    reset();
    setStatus("idle");
    window.setTimeout(() => setFocus("name"), 50);
  };

  const sent = status === "sent";
  const ease = { duration: reduced ? 0 : 0.55, ease: BEZIER.expo };

  return (
    <div className="grid">
      {/* The form. */}
      <motion.form
        noValidate
        onSubmit={submit}
        aria-labelledby="message"
        inert={sent}
        animate={{ x: sent ? -56 : 0, opacity: sent ? 0 : 1 }}
        transition={ease}
        className="[grid-area:1/1]"
      >
        <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
          <Field label="Name" id="contact-name" error={errors.name?.message}>
            {(p) => <input {...p} type="text" autoComplete="name" maxLength={CONTACT_LIMITS.name} {...register("name")} className={inputClass(p)} />}
          </Field>
          <Field label="Email" error={errors.email?.message}>
            {(p) => <input {...p} type="email" autoComplete="email" inputMode="email" maxLength={CONTACT_LIMITS.email} {...register("email")} className={inputClass(p)} />}
          </Field>
          <Field label="Subject" error={errors.subject?.message} className="sm:col-span-2">
            {(p) => (
              <span className="relative block">
                <select {...p} {...register("subject")} className={cn(inputClass(p), "appearance-none pr-11")}>
                  <option value="" hidden>
                    Choose a subject
                  </option>
                  {CONTACT_SUBJECTS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <ContactIcon name="chevron" className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-muted" />
              </span>
            )}
          </Field>
          <Field
            label="Message"
            error={errors.message?.message}
            className="sm:col-span-2"
            aside={
              <span className={cn("font-mono text-[11px] tabular-nums", message.length >= CONTACT_LIMITS.message ? "text-text" : "text-muted")}>
                {message.length} / {CONTACT_LIMITS.message}
              </span>
            }
          >
            {(p) => (
              <textarea
                {...p}
                rows={6}
                maxLength={CONTACT_LIMITS.message}
                {...register("message")}
                className={cn(inputClass(p), "h-auto min-h-36 resize-y py-3.5 leading-relaxed md:min-h-40")}
              />
            )}
          </Field>
        </div>

        {/* Honeypot: off screen and out of the tab order; people never fill it. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label>
            Website
            <input type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
          </label>
        </div>

        {status === "error" && (
          <div role="alert" className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-3 rounded-[14px] bg-red/10 px-4 py-3 ring-1 ring-red/40">
            <span aria-hidden="true" className="grid size-5 shrink-0 place-items-center rounded-full bg-red text-[12px] font-bold text-text">
              !
            </span>
            <p className="min-w-0 flex-1 text-[14px] text-text/90">{error}</p>
            <button
              type="button"
              data-cursor="link"
              onClick={() => submit()}
              className="rounded-pill px-3 py-1.5 text-[13px] font-semibold text-text ring-1 ring-text/30 transition-colors duration-[350ms] hover:bg-text/10"
            >
              Try again
            </button>
          </div>
        )}

        <IrisButton type="submit" size="lg" disabled={status === "sending"} className="mt-6 w-full disabled:pointer-events-none">
          {status === "sending" ? (
            <>
              <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-text/30 border-t-text" />
              Sending…
            </>
          ) : (
            <>
              Send message
              <ContactIcon name="send" className="size-[15px]" />
            </>
          )}
        </IrisButton>
        <p className="mt-3 text-center text-[12px] text-muted">We only use your email to reply to you.</p>
      </motion.form>

      {/* Sent. */}
      <motion.div
        inert={!sent}
        aria-hidden={!sent}
        initial={false}
        animate={{ opacity: sent ? 1 : 0, y: sent ? 0 : 20 }}
        transition={{ ...ease, delay: sent && !reduced ? 0.25 : 0 }}
        className="flex flex-col items-center justify-center text-center [grid-area:1/1]"
      >
        <SentCheck play={sent} reduced={reduced} />
        <h3 id="contact-sent" tabIndex={-1} className="mt-7 max-w-[22ch] text-2xl leading-tight font-semibold tracking-[-0.02em] outline-none md:text-3xl">
          Message sent. We&apos;ll get back within 48 hours.
        </h3>
        <button
          type="button"
          data-cursor="link"
          onClick={again}
          className="mt-6 text-[14px] font-semibold text-text underline decoration-text/30 underline-offset-4 transition-colors duration-[350ms] hover:decoration-text"
        >
          Send another
        </button>
      </motion.div>
      <p role="status" className="sr-only">
        {status === "sending" ? "Sending your message" : sent ? "Message sent. We'll get back within 48 hours." : ""}
      </p>
    </div>
  );
}
