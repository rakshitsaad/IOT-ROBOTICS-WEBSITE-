import { MonoLabel } from "@/components/ui/MonoLabel";
import { PillButton } from "@/components/ui/PillButton";

export default function NotFound() {
  return (
    <section className="shell pt-header">
      <div className="flex min-h-[60vh] flex-col items-start justify-center gap-5 py-16">
        <MonoLabel index="404">Not built yet</MonoLabel>
        <h1 className="max-w-xl text-4xl font-semibold tracking-[-0.02em] md:text-6xl">
          This page is still on the workbench.
        </h1>
        <PillButton href="/" variant="ghost">
          Back home
        </PillButton>
      </div>
    </section>
  );
}
