import { cn } from "@/lib/cn";
import type { Settings } from "@/lib/types";

/**
 * Home hero: the giant two-line wordmark on plain black (no corner labels, scroll hint or decorations).
 * The robot is not in here: it lives on the page's fixed stage (HomeRobot)
 * and stands in front of line 2. HomeScroll pins this section and drives
 * the wordmark ([data-hero-wordmark]): it rises at 1.4× scroll speed and fades out.
 */

/** 40ms between letters, after a short wait so the first paint settles. */
const LETTER_DELAY_MS = 150;
const LETTER_STAGGER_MS = 40;

export function HomeHero({ settings }: { settings: Settings }) {
  const words = settings.club_name.trim().split(/\s+/);
  const lines = words.length > 1 ? [words.slice(0, -1).join(" "), words[words.length - 1]] : words;
  let letter = 0;

  return (
    <section data-home-hero aria-labelledby="hero-title" className="relative isolate min-h-svh overflow-hidden">
      <div className="shell relative z-10 flex min-h-svh flex-col pt-header">
        {/* Phones: the wordmark ends at 42svh; the robot's antenna (40svh) just overlaps it. md+: centred, a little high. */}
        <div className="flex flex-1 flex-col justify-end pb-[58svh] md:justify-center md:pb-[9svh]">
          <h1
            id="hero-title"
            data-hero-wordmark
            // Sized so line 2 ("ROBOTICS" is ~5.1em wide in Archivo 700 at this tracking) fits: 16vw on phones
            // (18vw would be ~95vw before the indent), 15vw up to a 14.5rem cap that fits the 1440 shell.
            // svh caps keep it inside short landscape screens.
            className="text-[length:min(16vw,28svh)] leading-[0.85] font-bold tracking-[-0.03em] uppercase will-change-transform md:text-[length:clamp(4rem,min(15vw,30svh),14.5rem)]"
          >
            <span className="sr-only">{settings.club_name}</span>
            <span aria-hidden="true" className="block">
              {lines.map((line, i) => (
                <span
                  key={i}
                  data-hero-line
                  // Vertical-only mask, padded so glyph edges outside the 0.85 line box are not clipped.
                  className={cn(
                    "-my-[0.06em] block overflow-y-clip py-[0.06em] whitespace-nowrap",
                    i === 1 && "pl-[5vw] md:pl-[min(8vw,7.2rem)]",
                  )}
                >
                  {[...line].map((ch, j) =>
                    ch === " " ? (
                      " "
                    ) : (
                      <span
                        key={j}
                        data-letter
                        className="inline-block animate-rise motion-reduce:animate-none"
                        style={{ animationDelay: `${LETTER_DELAY_MS + letter++ * LETTER_STAGGER_MS}ms` }}
                      >
                        {ch}
                      </span>
                    ),
                  )}
                </span>
              ))}
            </span>
          </h1>
        </div>
      </div>
    </section>
  );
}
