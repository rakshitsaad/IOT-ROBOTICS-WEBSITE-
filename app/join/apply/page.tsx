import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ApplyForm } from "@/components/join/ApplyForm";
import { CharacterAvatar } from "@/components/join/CharacterAvatar";
import { MonoLabel } from "@/components/ui";
import { getSettings } from "@/lib/data";
import { JOIN_CHARACTERS, isHiring } from "@/lib/join";
import { SENIOR_CORE_TERM } from "@/lib/members";

export const metadata: Metadata = {
  title: "Apply",
  description: "Apply to join an IoT & Robotics team: pick a team, tell us about yourself and attach your resume.",
};

/**
 * /join/apply (DESIGN.md §21): the application form. `?team=<slug>` preselects a team that's hiring; the form reads it
 * on the client, inside a Suspense boundary, so the page stays static.
 */
export default async function ApplyPage() {
  const settings = await getSettings();
  const hiring = Object.fromEntries(JOIN_CHARACTERS.map((c) => [c.slug, isHiring(c.team, settings)]));
  return (
    <>
      <section aria-labelledby="apply-title" className="pt-header">
        <div className="mx-auto w-full max-w-[52rem] px-4 pt-[clamp(2rem,6svh,4rem)] md:px-gutter">
          <Link
            href="/join"
            data-cursor="link"
            className="inline-flex items-center gap-2 text-[13px] text-muted transition-colors duration-[350ms] hover:text-text"
          >
            <span aria-hidden="true">←</span> Join
          </Link>
          <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
            <div>
              <MonoLabel as="p" tone="text">
                Recruitment {SENIOR_CORE_TERM.year}
              </MonoLabel>
              <h1 id="apply-title" className="mt-3 text-[length:clamp(2.2rem,6vw,4rem)] leading-[1.04] font-bold tracking-[-0.04em]">
                Apply to the crew
              </h1>
              <p className="mt-3 max-w-[40ch] text-[15px] leading-relaxed text-muted md:text-[17px]">
                Five minutes. Pick a team, tell us about yourself, attach your resume.
              </p>
            </div>
            <span aria-hidden="true" className="flex">
              {JOIN_CHARACTERS.filter((c) => hiring[c.slug]).map((c, i) => (
                <CharacterAvatar key={c.slug} character={c} sizes="96px" className={`size-12 ring-2 ring-bg ${i > 0 ? "-ml-3" : ""}`} />
              ))}
            </span>
          </div>
          <div className="mt-10">
            {settings.recruitment_open ? (
              <Suspense fallback={<div className="h-[72rem] rounded-card bg-bg-2 ring-1 ring-line" />}>
                <ApplyForm hiring={hiring} />
              </Suspense>
            ) : (
              <p className="rounded-card bg-bg-2 p-8 text-[15px] text-muted ring-1 ring-line">
                Applications are closed for now. They open again at the start of next semester; watch the announcement bar.
              </p>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
