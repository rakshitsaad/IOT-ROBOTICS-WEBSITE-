import type { Metadata } from "next";
import { Crowd } from "@/components/join/Crowd";
import { JoinHero } from "@/components/join/JoinHero";
import { JoinReveals } from "@/components/join/JoinReveals";
import { HowItWorks, JoinCta, JoinFaq, TeamsSection, WhyJoin } from "@/components/join/JoinSections";
import { GridBackground } from "@/components/ui";
import { getSettings, getTeams } from "@/lib/data";
import { JOIN_CHARACTERS, isHiring } from "@/lib/join";
import { SENIOR_CORE_TERM } from "@/lib/members";

export const metadata: Metadata = {
  title: "Join",
  description: "Join the IoT & Robotics club: build drones, robots and connected things with people who love it. See who's hiring and apply.",
};

/** /join (DESIGN.md §21): the crowd hero, why join, the teams, how it works, the FAQ and the last call. */
export default async function JoinPage() {
  const [settings, teams] = await Promise.all([getSettings(), getTeams()]);
  const hiring = Object.fromEntries(JOIN_CHARACTERS.map((c) => [c.slug, isHiring(c.team, settings)]));
  return (
    <>
      <GridBackground />
      <JoinHero
        recruitmentOpen={settings.recruitment_open}
        year={SENIOR_CORE_TERM.year}
        crowd={
          <>
            <Crowd variant="wide" className="absolute inset-0 size-full max-md:hidden" />
            <Crowd variant="narrow" className="absolute inset-0 size-full md:hidden" />
          </>
        }
      />
      <JoinReveals>
        <WhyJoin />
        <TeamsSection teams={teams} hiring={hiring} />
        <HowItWorks />
        <JoinFaq />
        <JoinCta open={settings.recruitment_open} />
      </JoinReveals>
    </>
  );
}
