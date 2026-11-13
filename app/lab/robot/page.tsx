import type { Metadata } from "next";
import { GridBackground, MonoLabel, Pill, PillButton } from "@/components/ui";
import { RobotLab } from "@/components/lab/RobotLab";

export const metadata: Metadata = {
  title: "Robot lab",
  robots: { index: false, follow: false },
};

export default function RobotLabPage() {
  return (
    <div className="relative pt-header">
      <GridBackground />

      <header className="shell pb-8 pt-12 md:pb-12 md:pt-20">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <MonoLabel index="LAB">Robot mascot</MonoLabel>
          <PillButton href="/lab" variant="ghost" size="sm">
            ← Design system
          </PillButton>
        </div>
        <h1 className="mt-5 max-w-4xl text-[length:clamp(2.5rem,7vw,5.5rem)] leading-[0.95] font-bold tracking-[-0.035em]">
          Meet <Pill color="raised">ClubBot</Pill>.
        </h1>
        <p className="mt-6 max-w-xl text-muted">
          Every expression, icon and gesture of the club robot, driven through the same store the site uses. Add{" "}
          <code className="font-mono text-[0.9em] text-text">?bot=poster</code> to see the fallback poster, or{" "}
          <code className="font-mono text-[0.9em] text-text">?bot=force</code> to skip the low-memory check.
        </p>
      </header>

      <div className="shell pb-6">
        <RobotLab />
      </div>
    </div>
  );
}
