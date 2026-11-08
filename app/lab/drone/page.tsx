import type { Metadata } from "next";
import { Button, GridBackground, MonoLabel } from "@/components/ui";
import { DroneLab } from "@/components/lab/DroneLab";
import { getMissionStats } from "@/lib/data";

export const metadata: Metadata = {
  title: "Drone lab",
  robots: { index: false, follow: false },
};

export default async function DroneLabPage() {
  const stats = await getMissionStats();
  return (
    <div className="relative pt-header">
      <GridBackground />

      <header className="shell pb-8 pt-12 md:pb-10 md:pt-16">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <MonoLabel index="LAB">Drone · test bench</MonoLabel>
          <Button href="/lab" variant="secondary" size="sm">
            ← Design system
          </Button>
        </div>
        <h1 className="mt-5 max-w-4xl text-[length:clamp(2.5rem,7vw,5.5rem)] font-extrabold leading-[0.95] tracking-[-0.045em]">
          Meet the drone.
        </h1>
        <p className="mt-6 max-w-xl text-muted">
          Every drone effect, one button each, over a dashboard of club stats. On the home page the same drone model
          flies as the robot&apos;s sidekick (add <code className="font-mono text-[0.9em] text-text">?sidekick=debug</code> there for its event log).
        </p>
      </header>

      <DroneLab stats={stats} />
    </div>
  );
}
