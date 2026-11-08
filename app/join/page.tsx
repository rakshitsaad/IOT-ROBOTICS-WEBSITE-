import type { Metadata } from "next";
import { NotifyForm } from "@/components/home/NotifyForm";
import { HowItWorks, JoinFaq, LastCall, TeamsSection, WhyJoin } from "@/components/join/JoinSections";
import { Button, PageHeader } from "@/components/ui";
import { getSettings, getTeams } from "@/lib/data";
import { isHiring } from "@/lib/join";
import { SENIOR_CORE_TERM } from "@/lib/members";

export const metadata: Metadata = {
  title: "Join",
  description: "Join the IoT & Robotics club: build drones, robots and connected things with people who love it. See who's hiring and apply.",
};

/** The facts every applicant asks first, from the FAQ. */
const FACTS = [
  { label: "Who", value: "Any year, any branch" },
  { label: "Experience", value: "Not required" },
  { label: "Time", value: "4–6 hours a week" },
  { label: "Results", value: "About two weeks after closing" },
];

/** /join (DESIGN.md §21): the invitation, the teams and who's hiring, the process, the FAQ. */
export default async function JoinPage() {
  const [settings, teams] = await Promise.all([getSettings(), getTeams()]);
  const hiring = Object.fromEntries(teams.map((t) => [t.slug, isHiring(t.name, settings)]));
  const open = settings.recruitment_open;
  const applyHref = settings.join_form_url ?? "/join/apply";

  return (
    <>
      <PageHeader
        label={
          <span className="inline-flex items-center gap-2.5">
            <span aria-hidden="true" className={open ? "size-1.5 rounded-pill bg-red" : "size-1.5 rounded-pill bg-faint"} />
            Recruitment {SENIOR_CORE_TERM.year} · {open ? "Open" : "Closed"}
          </span>
        }
        title="Join the club."
        intro="Build drones, robots and connected things with people who love it as much as you do."
        aside={
          <dl className="divide-y divide-line border-y border-line">
            {FACTS.map((f) => (
              <div key={f.label} className="grid grid-cols-[7rem_1fr] gap-4 py-3.5 text-[14px]">
                <dt className="mono-label pt-0.5 text-faint">{f.label}</dt>
                <dd className="text-text/90">{f.value}</dd>
              </div>
            ))}
          </dl>
        }
      >
        {open ? (
          <div className="flex flex-wrap gap-3">
            <Button href={applyHref} size="lg" arrow>
              Apply now
            </Button>
            <Button href="#teams" variant="secondary" size="lg">
              See the teams
            </Button>
          </div>
        ) : (
          <NotifyForm className="max-w-md" />
        )}
      </PageHeader>
      <WhyJoin />
      <TeamsSection teams={teams} hiring={hiring} />
      <HowItWorks />
      <JoinFaq />
      <LastCall open={open} applyHref={applyHref} />
    </>
  );
}
