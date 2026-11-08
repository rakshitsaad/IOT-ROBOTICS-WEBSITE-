import { Pill } from "@/components/ui";

/**
 * Section B, the statement. Lines and paragraphs carry [data-reveal]; the
 * pills are <Pill reveal>. HomeScroll reveals each line once as it enters
 * (rise 40px + fade), then grows its pills 150ms later; the robot shows a
 * happy face as each pill appears. Rendered in its final state, so it reads
 * the same without JS and under reduced motion.
 */
export function Statement({ clubName }: { clubName: string }) {
  return (
    <section
      data-statement
      aria-labelledby="statement-title"
      className="relative flex min-h-svh items-center py-[clamp(5rem,14svh,10rem)]"
    >
      <div className="shell">
        <h2
          id="statement-title"
          className="text-[length:clamp(2.4rem,5.5vw,5.5rem)] leading-[1.12] font-semibold tracking-[-0.035em]"
        >
          <span data-reveal className="block">
            <Pill color="white" reveal>
              {clubName}
            </Pill>{" "}
            is where
          </span>
          <span data-reveal className="block">
            <span aria-hidden="true" className="mr-[0.3em] inline-block size-[0.36em] rounded-full bg-red align-[0.1em]" />
            students build things
          </span>
          <span data-reveal className="block">
            that{" "}
            <Pill color="raised" reveal>
              move
            </Pill>
            ,{" "}
            <Pill color="raised" reveal>
              fly
            </Pill>
          </span>
          <span data-reveal className="block">
            and{" "}
            <Pill color="red" reveal>
              think
            </Pill>
            .
          </span>
        </h2>

        <div className="mt-10 max-w-[46ch] space-y-4 text-[17px] leading-[1.65] text-muted md:mt-14 md:ml-[8vw]">
          <p data-reveal>
            <strong className="font-bold text-text">We start with a soldering iron,</strong> not a slide deck. Members
            prototype drones, robots and connected devices, then test them where things actually break.
          </p>
          <p data-reveal>
            <strong className="font-bold text-text">Every semester brings workshops,</strong> build sprints and
            competitions, plus a research division writing up what we build.
          </p>
        </div>
      </div>
    </section>
  );
}
