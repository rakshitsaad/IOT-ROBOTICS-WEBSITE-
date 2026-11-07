import type { Metadata } from "next";
import { GridBackground, MonoLabel, Pill, PillButton } from "@/components/ui";
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
          <MonoLabel index="LAB">Drone · Mission Control</MonoLabel>
          <PillButton href="/lab" variant="ghost" size="sm">
            ← Design system
          </PillButton>
        </div>
        <h1 className="mt-5 max-w-4xl text-[length:clamp(2.5rem,7vw,5.5rem)] font-extrabold leading-[0.95] tracking-[-0.045em]">
          Meet the <Pill color="raised">drone</Pill>.
        </h1>
        <p className="mt-6 max-w-xl text-muted">
          Every effect from the home page&apos;s Mission Control section, one button each. The drone here ignores the
          scroll; the home page drives the same drone through its scroll phases.
        </p>
      </header>

      <DroneLab stats={stats} />
    </div>
  );
}
