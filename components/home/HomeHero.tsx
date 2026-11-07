import { Capsule, CrossMark, DotGrid, MonoLabel, type CapsuleTone } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { Settings } from "@/lib/types";

/**
 * Home hero: the giant two-line wordmark, corner labels and decorations.
 * The robot is not in here: it lives on the page's fixed stage (HomeRobot)
 * and stands in front of line 2. HomeScroll pins this section and drives
 * every [data-*] hook below:
 *   data-hero-wordmark  rises at 1.4× scroll speed and fades out
 *   data-rise="n"       moves up at n× scroll speed (capsules)
 *   data-drift="px"     slides sideways by px (dot grids)
 *   data-spin           rotates 90° (cross marks)
 *   data-hero-scroll    the scroll hint, fades out first
 */

/** 40ms between letters, after a short wait so the first paint settles. */
const LETTER_DELAY_MS = 150;
const LETTER_STAGGER_MS = 40;

interface Decor {
  /** Position (and colour), per breakpoint. */
  className: string;
}

/** Desktop: 4 around the robot (it stands at 66% of the width). Phones: only the two without `hidden`. */
const CAPSULES: (Decor & { tone: CapsuleTone; rise: number; size: string; rotate?: number })[] = [
  { tone: "raised", rise: 0.6, className: "hidden md:block md:left-[44%] md:top-[14%]", size: "md:h-72 md:w-24" },
  {
    tone: "iris-line",
    rise: 1.1,
    className: "left-[7%] top-[60%] md:left-[80%] md:top-[44%]",
    size: "h-40 w-12 md:h-80 md:w-24",
  },
  { tone: "raised", rise: 1.6, className: "hidden md:block md:left-[89%] md:top-[11%]", size: "md:h-52 md:w-16" },
  {
    tone: "haze",
    rise: 0.6,
    className: "right-[7%] top-[52%] md:right-auto md:left-[55%] md:top-[50%]",
    size: "h-56 w-14 md:h-[26rem] md:w-28",
  },
];

const DOT_GRIDS: (Decor & { drift: number; rows: number; cols: number })[] = [
  { drift: -90, rows: 3, cols: 4, className: "right-[10%] top-[20%] text-text/30 md:right-auto md:left-[35%] md:top-[19%]" },
  { drift: 120, rows: 2, cols: 6, className: "left-[5%] bottom-[14%] text-muted md:left-[7%] md:bottom-[17%]" },
  { drift: -70, rows: 4, cols: 3, className: "right-[5%] top-[78%] text-red/55 md:right-[4%] md:top-[34%]" },
];

const CROSSES: (Decor & { size: number; tone: "muted" | "red" })[] = [
  { tone: "muted", size: 14, className: "left-[62%] top-[17%] md:left-[52%] md:top-[25%]" },
  { tone: "red", size: 12, className: "left-[30%] top-[52%] md:left-[39%] md:top-[76%]" },
  { tone: "muted", size: 16, className: "right-[30%] bottom-[11%] md:right-[13%] md:bottom-[15%]" },
  { tone: "red", size: 12, className: "right-[6%] top-[46%] md:right-[24%] md:top-[15%]" },
];

export function HomeHero({ settings }: { settings: Settings }) {
  const words = settings.club_name.trim().split(/\s+/);
  const lines = words.length > 1 ? [words.slice(0, -1).join(" "), words[words.length - 1]] : words;
  let letter = 0;

  return (
    <section data-home-hero aria-labelledby="hero-title" className="relative isolate min-h-svh overflow-hidden">
      {/* Decorations, behind the wordmark (the robot is in front of everything). */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {CAPSULES.map(({ tone, rise, rotate, className, size }, i) => (
          <div key={i} data-rise={rise} className={cn("absolute will-change-transform", className)}>
            <Capsule tone={tone} rotate={rotate} className={size} />
          </div>
        ))}
        {DOT_GRIDS.map(({ drift, rows, cols, className }, i) => (
          <div key={i} data-drift={drift} className={cn("absolute will-change-transform", className)}>
            <DotGrid rows={rows} cols={cols} className="text-current" />
          </div>
        ))}
        {CROSSES.map(({ tone, size, className }, i) => (
          <div key={i} data-spin className={cn("absolute will-change-transform", className)}>
            <CrossMark size={size} strokeWidth={1.5} className={tone === "red" ? "text-red" : "text-text/45"} />
          </div>
        ))}
      </div>

      <div className="shell relative z-10 flex min-h-svh flex-col pt-header">
        <MonoLabel className="mt-6 md:mt-8">
          {settings.college_name}
          {settings.founded_year ? ` / Est. ${settings.founded_year}` : null}
        </MonoLabel>

        {/* Phones: the wordmark ends at 42svh; the robot's antenna (40svh) just overlaps it. md+: centred, a little high. */}
        <div className="flex flex-1 flex-col justify-end pb-[58svh] md:justify-center md:pb-[9svh]">
          <h1
            id="hero-title"
            data-hero-wordmark
            // Sized so line 2 ("ROBOTICS" is ~5.3em wide in Sora 800) fits: 16vw on phones
            // (18vw would be ~95vw before the indent), 15vw up to a 14.5rem cap that fits the 1440 shell.
            // svh caps keep it inside short landscape screens.
            className="text-[length:min(16vw,28svh)] leading-[0.85] font-extrabold tracking-[-0.04em] uppercase will-change-transform md:text-[length:clamp(4rem,min(15vw,30svh),14.5rem)]"
          >
            <span className="sr-only">{settings.club_name}</span>
            <span aria-hidden="true" className="block">
              {lines.map((line, i) => (
                <span
                  key={i}
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

      <div className="shell absolute inset-x-0 bottom-5 z-10 flex items-end justify-between gap-6 md:bottom-8">
        <MonoLabel>IoT / Robotics / Research</MonoLabel>
        <span data-hero-scroll className="mono-label inline-flex items-center gap-2 text-muted">
          Scroll
          <svg
            aria-hidden="true"
            width="10"
            height="14"
            viewBox="0 0 10 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.25"
            className="animate-nudge text-text motion-reduce:animate-none"
          >
            <path d="M5 1v11M1.5 8.5 5 12l3.5-3.5" />
          </svg>
        </span>
      </div>
    </section>
  );
}
