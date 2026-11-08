"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "motion/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, type DragEvent, type ReactNode } from "react";
import { useForm, useWatch, type UseFormRegisterReturn } from "react-hook-form";
import { z } from "zod";
import { Field, SentCheck, inputClass } from "@/components/forms/fields";
import { Button, MonoLabel } from "@/components/ui";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { submitApplication } from "@/lib/actions";
import { cn } from "@/lib/cn";
import {
  APPLY_LIMITS,
  BRANCHES,
  JOIN_CHARACTERS,
  JOIN_STEPS,
  RESUME,
  YEARS,
  applicationSchema,
  characterBySlug,
  resumeError,
  type ApplicationValues,
} from "@/lib/join";
import { BEZIER } from "@/lib/motion";
import { CharacterAvatar } from "./CharacterAvatar";

/**
 * The /join/apply form (DESIGN.md §21): react-hook-form + the zod schema in lib/join.ts (the server action checks it
 * again), plus the resume (a PDF or an image, at most 5MB; pick it or drop it on the box). `?team=` preselects a team
 * that's hiring; closed teams are disabled in the list. Sending shows a spinner; then the form slides away for the
 * "received" state with the applicant's reference and what happens next. Errors come back inline, with a retry.
 */

/** The form's schema: the shared text fields plus the resume (a FileList, so client-only). */
const formSchema = applicationSchema.extend({
  resume: z.custom<FileList | undefined>().optional().superRefine((v, ctx) => {
    const message = resumeError(v?.[0]);
    if (message) ctx.addIssue({ code: "custom", message });
  }),
});
type FormValues = z.input<typeof formSchema>;
type FormOutput = z.output<typeof formSchema>;

type Status = "idle" | "sending" | "sent" | "error";

export function ApplyForm({ hiring }: { hiring: Record<string, boolean> }) {
  const reduced = useReducedMotion();
  const params = useSearchParams();
  const wanted = params.get("team") ?? "";
  const wantedCharacter = characterBySlug(wanted);
  const preselect = wantedCharacter && hiring[wanted] ? wanted : "";
  const closedWanted = wantedCharacter && !hiring[wanted] ? wantedCharacter.team : null;

  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");
  const [dragging, setDragging] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    setFocus,
    reset,
    formState: { errors },
  } = useForm<FormValues, unknown, FormOutput>({
    resolver: zodResolver(formSchema),
    mode: "onTouched",
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      year: "" as ApplicationValues["year"],
      branch: "" as ApplicationValues["branch"],
      team: preselect,
      skills: "",
      why: "",
      linkedin: "",
      github: "",
    },
  });
  const why = useWatch({ control, name: "why" }) ?? "";
  const team = useWatch({ control, name: "team" });
  const files = useWatch({ control, name: "resume" });
  const file = files?.[0];
  const chosen = characterBySlug(team);

  const send = async (values: FormOutput) => {
    setStatus("sending");
    setError("");
    const fd = new FormData();
    for (const k of ["name", "phone", "email", "year", "branch", "team", "skills", "why", "linkedin", "github"] as const) {
      fd.set(k, String(values[k] ?? ""));
    }
    if (values.resume?.[0]) fd.set("resume", values.resume[0]);
    try {
      const res = await submitApplication(fd);
      if (res.status === "ok") {
        setReference(res.reference);
        setStatus("sent");
        window.setTimeout(() => document.getElementById("apply-sent")?.focus({ preventScroll: true }), 350);
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

  const drop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.length) setValue("resume", e.dataTransfer.files, { shouldValidate: true, shouldTouch: true });
  };

  const sent = status === "sent";
  const ease = { duration: reduced ? 0 : 0.55, ease: BEZIER.expo };

  return (
    <div className="grid">
      <motion.form
        noValidate
        onSubmit={submit}
        aria-labelledby="apply-title"
        inert={sent}
        animate={{ x: sent ? -56 : 0, opacity: sent ? 0 : 1 }}
        transition={ease}
        className="rounded-card border border-line bg-bg-2 p-5 [grid-area:1/1] sm:p-8 md:p-10"
      >
        {closedWanted && (
          <p className="mb-6 rounded-control bg-text/[0.05] px-4 py-3 text-[14px] text-text/85 ring-1 ring-line">
            {closedWanted} opens next round. Pick one of the teams that&apos;s hiring now.
          </p>
        )}

        <fieldset className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
          <legend className="mb-5">
            <MonoLabel tone="text">01 / About you</MonoLabel>
          </legend>
          <Field label="Full name" id="apply-name" error={errors.name?.message}>
            {(p) => <input {...p} type="text" autoComplete="name" maxLength={APPLY_LIMITS.name} {...register("name")} className={inputClass(p)} />}
          </Field>
          <Field label="Phone" error={errors.phone?.message}>
            {(p) => <input {...p} type="tel" autoComplete="tel" inputMode="tel" placeholder="98765 43210" {...register("phone")} className={inputClass(p)} />}
          </Field>
          <Field label="College email" error={errors.email?.message} className="sm:col-span-2">
            {(p) => (
              <input {...p} type="email" autoComplete="email" inputMode="email" placeholder="you@bennett.edu.in" {...register("email")} className={inputClass(p)} />
            )}
          </Field>
          <Field label="Year" error={errors.year?.message}>
            {(p) => (
              <Select p={p} reg={register("year")} placeholder="Choose your year">
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Branch" error={errors.branch?.message}>
            {(p) => (
              <Select p={p} reg={register("branch")} placeholder="Choose your branch">
                {BRANCHES.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </fieldset>

        <fieldset className="mt-10 grid gap-x-4 gap-y-5 sm:grid-cols-2">
          <legend className="mb-5">
            <MonoLabel tone="text">02 / Your team</MonoLabel>
          </legend>
          <Field
            label="Preferred team"
            error={errors.team?.message}
            className="sm:col-span-2"
            aside={chosen ? <span className="text-[12px] text-muted">{chosen.pitch}</span> : undefined}
          >
            {(p) => (
              <span className="flex items-center gap-3">
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-bg ring-1 ring-line">
                  {chosen ? <CharacterAvatar character={chosen} sizes="96px" className="size-12" /> : <span className="size-2 rounded-full bg-text/25" />}
                </span>
                <Select p={p} reg={register("team")} placeholder="Choose a team" className="flex-1">
                  {JOIN_CHARACTERS.map((c) => (
                    <option key={c.slug} value={c.slug} disabled={!hiring[c.slug]}>
                      {c.team}
                      {hiring[c.slug] ? "" : " (opens next round)"}
                    </option>
                  ))}
                </Select>
              </span>
            )}
          </Field>
          <Field label="Skills" error={errors.skills?.message} className="sm:col-span-2">
            {(p) => (
              <input
                {...p}
                type="text"
                placeholder="Arduino, Figma, video editing… or what you want to learn"
                maxLength={APPLY_LIMITS.skills}
                {...register("skills")}
                className={inputClass(p)}
              />
            )}
          </Field>
          <Field
            label="Why do you want to join?"
            error={errors.why?.message}
            className="sm:col-span-2"
            aside={
              <span className={cn("font-mono text-[11px] tabular-nums", why.length >= APPLY_LIMITS.why ? "text-text" : "text-muted")}>
                {why.length} / {APPLY_LIMITS.why}
              </span>
            }
          >
            {(p) => (
              <textarea
                {...p}
                rows={5}
                maxLength={APPLY_LIMITS.why}
                placeholder="What you'd like to build, learn or bring to the team."
                {...register("why")}
                className={cn(inputClass(p), "h-auto min-h-32 resize-y py-3.5 leading-relaxed")}
              />
            )}
          </Field>
        </fieldset>

        <fieldset className="mt-10 grid gap-x-4 gap-y-5 sm:grid-cols-2">
          <legend className="mb-5">
            <MonoLabel tone="text">03 / Links and resume</MonoLabel>
          </legend>
          <Field label="LinkedIn" error={errors.linkedin?.message}>
            {(p) => <input {...p} type="url" inputMode="url" placeholder="https://linkedin.com/in/you" {...register("linkedin")} className={inputClass(p)} />}
          </Field>
          <Field label="GitHub (optional)" error={errors.github?.message}>
            {(p) => <input {...p} type="url" inputMode="url" placeholder="https://github.com/you" {...register("github")} className={inputClass(p)} />}
          </Field>
          <Field label="Resume" error={errors.resume?.message as string | undefined} className="sm:col-span-2" aside={<span className="text-[12px] text-muted">PDF or image, up to 5MB</span>}>
            {(p) => (
              <label
                htmlFor={p.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={drop}
                className={cn(
                  "flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-2 rounded-control border border-dashed px-4 py-5 transition-[border-color,background-color] duration-300",
                  dragging ? "border-red bg-red/[0.06]" : p["aria-invalid"] ? "border-red/70" : "border-line hover:border-text/30",
                )}
              >
                <input
                  {...p}
                  type="file"
                  accept={RESUME.accept}
                  className="sr-only"
                  {...register("resume")}
                />
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-text/[0.06] text-text ring-1 ring-line">
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="size-4">
                    <path d="M12 16V4M7 9l5-5 5 5M5 15v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3" />
                  </svg>
                </span>
                <span className="min-w-0 flex-1 text-[14px]">
                  {file ? (
                    <>
                      <span className="block truncate font-semibold text-text">{file.name}</span>
                      <span className="text-[12px] text-muted">{(file.size / 1024 / 1024).toFixed(2)} MB · click or drop to replace</span>
                    </>
                  ) : (
                    <>
                      <span className="font-semibold text-text">Choose a file</span>
                      <span className="text-muted"> or drop it here</span>
                    </>
                  )}
                </span>
              </label>
            )}
          </Field>
        </fieldset>

        {status === "error" && (
          <div role="alert" className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3 rounded-control bg-bg px-4 py-3 ring-1 ring-red/60">
            <span aria-hidden="true" className="grid size-5 shrink-0 place-items-center rounded-full bg-red text-[12px] font-bold text-text">
              !
            </span>
            <p className="min-w-0 flex-1 text-[14px] text-text/90">{error}</p>
            <button
              type="button"
              onClick={() => submit()}
              className="rounded-control px-3 py-1.5 text-[13px] font-semibold text-text ring-1 ring-text/30 transition-colors duration-300 hover:bg-text/10"
            >
              Try again
            </button>
          </div>
        )}

        <Button type="submit" size="lg" disabled={status === "sending"} className="mt-8 w-full disabled:pointer-events-none">
          {status === "sending" ? (
            <>
              <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-text/30 border-t-text" />
              Sending…
            </>
          ) : (
            "Send application"
          )}
        </Button>
        <p className="mt-3 text-center text-[12px] text-muted">We only use your details for this recruitment round.</p>
      </motion.form>

      {/* Received. */}
      <motion.div
        inert={!sent}
        aria-hidden={!sent}
        initial={false}
        animate={{ opacity: sent ? 1 : 0, y: sent ? 0 : 20 }}
        transition={{ ...ease, delay: sent && !reduced ? 0.25 : 0 }}
        className="self-start rounded-card border border-line bg-bg-2 p-6 text-center [grid-area:1/1] sm:p-10"
      >
        <div className="flex flex-col items-center">
          <SentCheck play={sent} reduced={reduced} />
          <h2 id="apply-sent" tabIndex={-1} className="mt-7 text-2xl leading-tight font-semibold tracking-[-0.02em] outline-none md:text-3xl">
            Application received{chosen ? ` for ${chosen.team}` : ""}.
          </h2>
          <p className="mt-3 text-[15px] text-muted">
            Your reference is <span className="font-mono text-text">{reference}</span>. We&apos;ll email you about the task round.
          </p>
        </div>
        <ol className="mx-auto mt-8 grid max-w-md gap-3 text-left">
          {JOIN_STEPS.slice(1).map((s, i) => (
            <li key={s.title} className="flex gap-3 rounded-control bg-bg/60 p-4 ring-1 ring-line">
              <span className="font-mono text-[12px] text-muted">{String(i + 2).padStart(2, "0")}</span>
              <span>
                <span className="block text-[15px] font-semibold">{s.title}</span>
                <span className="text-[13px] text-muted">{s.text}</span>
              </span>
            </li>
          ))}
        </ol>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button href="/join" variant="secondary">
            Back to Join
          </Button>
          <button
            type="button"
            onClick={() => {
              reset({ ...emptyValues(), team: "" });
              setStatus("idle");
              window.setTimeout(() => setFocus("name"), 50);
            }}
            className="h-11 rounded-control px-5 text-[14px] font-semibold text-text underline decoration-text/30 underline-offset-4 hover:decoration-text"
          >
            Apply for someone else
          </button>
        </div>
      </motion.div>
      <p role="status" className="sr-only">
        {status === "sending" ? "Sending your application" : sent ? `Application received. Reference ${reference}.` : ""}
      </p>
      <p className="mt-6 text-center text-[13px] text-muted [grid-area:2/1]">
        Questions first? <Link href="/contact" className="text-text underline decoration-text/30 underline-offset-4 hover:decoration-text">Ask us</Link>.
      </p>
    </div>
  );
}

const emptyValues = (): FormValues => ({
  name: "",
  phone: "",
  email: "",
  year: "" as ApplicationValues["year"],
  branch: "" as ApplicationValues["branch"],
  team: "",
  skills: "",
  why: "",
  linkedin: "",
  github: "",
});

function Select({
  p,
  reg,
  placeholder,
  className,
  children,
}: {
  p: { id: string; "aria-invalid": boolean; "aria-describedby"?: string };
  reg: UseFormRegisterReturn;
  placeholder: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span className={cn("relative block", className)}>
      <select {...p} {...reg} className={cn(inputClass(p), "appearance-none pr-11")}>
        <option value="" hidden>
          {placeholder}
        </option>
        {children}
      </select>
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-muted">
        <path d="M6 9l6 6 6-6" />
      </svg>
    </span>
  );
}
