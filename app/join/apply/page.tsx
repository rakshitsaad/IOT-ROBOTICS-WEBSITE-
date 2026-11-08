import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ApplyForm } from "@/components/join/ApplyForm";
import { CharacterAvatar } from "@/components/join/CharacterAvatar";
import { MonoLabel } from "@/components/ui";
import { getSettings } from "@/lib/data";
import { JOIN_CHARACTERS, JOIN_STEPS, isHiring } from "@/lib/join";
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
  const hiringTeams = JOIN_CHARACTERS.filter((c) => hiring[c.slug]);

  return (
    <section aria-labelledby="apply-title" className="pt-header">
      <div className="shell">
        <nav aria-label="Breadcrumb" className="pt-8 md:pt-12">
          <ol className="flex items-center gap-2 text-[13px] text-faint">
            <li>
              <Link href="/join" className="transition-colors duration-300 hover:text-text">
                Join
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-muted">
              Apply
            </li>
          </ol>
        </nav>

        <div className="grid gap-12 pt-10 pb-8 md:pt-14 lg:grid-cols-12 lg:gap-8">
          <aside className="lg:col-span-4">
            <div className="lg:sticky lg:top-[calc(var(--nav-h)+2.5rem)]">
              <MonoLabel as="p">Recruitment {SENIOR_CORE_TERM.year}</MonoLabel>
              <h1 id="apply-title" className="type-h1 mt-6">
                Apply to the club.
              </h1>
              <p className="type-body mt-5 max-w-[36ch] text-muted">Five minutes. Pick a team, tell us about yourself, attach your resume.</p>

              {hiringTeams.length > 0 && (
                <div className="mt-10 border-t border-line pt-6">
                  <p className="mono-label text-faint">Hiring now</p>
                  <ul className="mt-4 space-y-3">
                    {hiringTeams.map((c) => (
                      <li key={c.slug} className="flex items-center gap-3 text-[14px]">
                        <CharacterAvatar character={c} sizes="64px" className="size-8 border border-line" />
                        {c.team}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-10 border-t border-line pt-6">
                <p className="mono-label text-faint">What happens next</p>
                <ol className="mt-4 space-y-3">
                  {JOIN_STEPS.map((s, i) => (
                    <li key={s.title} className="flex gap-3 text-[14px]">
                      <span className="font-mono text-[12px] text-faint">{String(i + 1).padStart(2, "0")}</span>
                      <span className="text-text/90">{s.title}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </aside>

          <div className="lg:col-span-8">
            {settings.recruitment_open ? (
              <Suspense fallback={<div className="h-[72rem] rounded-card border border-line bg-bg-2" />}>
                <ApplyForm hiring={hiring} />
              </Suspense>
            ) : (
              <p className="rounded-card border border-line bg-bg-2 p-8 text-[15px] text-muted">
                Applications are closed for now. They open again at the start of next semester; watch the announcement bar.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
