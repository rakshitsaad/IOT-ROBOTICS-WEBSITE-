import type { Metadata } from "next";
import { GridBackground } from "@/components/ui";
import { JuniorCore } from "@/components/members/JuniorCore";
import { SeniorCore } from "@/components/members/SeniorCore";
import { getJuniorCoreByTeam, getSeniorCore, getSettings } from "@/lib/data";

export const metadata: Metadata = {
  title: "Members",
  description: "The Senior Core and Junior Core of the club.",
};

export default async function MembersPage() {
  const [settings, seniors, juniorTeams] = await Promise.all([getSettings(), getSeniorCore(), getJuniorCoreByTeam()]);

  return (
    <>
      <GridBackground />
      <SeniorCore members={seniors} settings={settings} />
      <JuniorCore teams={juniorTeams} />
    </>
  );
}
