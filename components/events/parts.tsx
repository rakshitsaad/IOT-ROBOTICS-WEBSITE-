import { Fragment, type CSSProperties } from "react";
import { Pill } from "@/components/ui";
import { cn } from "@/lib/cn";
import { eventDate, type ShowcaseEvent } from "@/lib/events";

/**
 * Small shared pieces of /events (DESIGN.md §17).
 */

/**
 * "Registrations open" (maroon pill) for upcoming events, "Completed" (muted pill) for past ones. Maroon, not red,
 * so it never competes with the red Register button beside it. `quiet` uses a charcoal pill, for lists.
 */
export function StatusBadge({ event, quiet, className }: { event: Pick<ShowcaseEvent, "status">; quiet?: boolean; className?: string }) {
  return event.status === "upcoming" ? (
    <Pill color={quiet ? "raised" : "maroon"} className={cn("inline-block px-2.5 py-1 leading-none font-medium whitespace-nowrap", className)}>
      Registrations open
    </Pill>
  ) : (
    <span
      className={cn(
        "inline-block rounded-pill bg-text/10 px-2.5 py-1 leading-none font-medium whitespace-nowrap text-muted",
        className,
      )}
    >
      Completed
    </span>
  );
}

/** date | venue | tags | status, in 13px with thin dividers. */
export function DetailsLine({ event, className }: { event: ShowcaseEvent; className?: string }) {
  const parts = [
    <time key="d" dateTime={event.starts_at}>
      {eventDate(event.starts_at)}
    </time>,
    <span key="v">{event.venue}</span>,
    event.tags.length > 0 ? <span key="t">{event.tags.join(" · ")}</span> : null,
    <StatusBadge key="s" event={event} />,
  ].filter(Boolean);
  // Each part carries its divider on its left edge, and the line is pulled left by one gap under a clipped wrapper,
  // so a divider never dangles at the end of a wrapped line: the one that starts a line is clipped away.
  return (
    <div className={cn("overflow-x-clip", className)}>
      <p className="-ml-6 flex flex-wrap items-center gap-y-2 text-[13px] leading-snug text-text/85">
        {parts.map((part, i) => (
          <span
            key={i}
            className="relative ml-3 flex items-center pl-3 before:absolute before:top-1/2 before:left-0 before:h-3.5 before:w-px before:-translate-y-1/2 before:bg-text/25"
          >
            {part}
          </span>
        ))}
      </p>
    </div>
  );
}

/**
 * The title split into letters inside per-word masks, for the rise. `intro` adds the first-load CSS animation
 * (30ms apart from `delay`); later switches animate the same `[data-ev-char]` letters with GSAP.
 */
export function SplitTitle({ text, intro, delay, stagger }: { text: string; intro: boolean; delay: number; stagger: number }) {
  let n = 0;
  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {text.split(" ").map((word, w) => (
          <Fragment key={w}>
            {w > 0 && " "}
            <span className="-mb-[0.12em] inline-block overflow-clip pb-[0.12em] align-bottom">
              {[...word].map((ch, c) => {
                const i = n++;
                return (
                  <span
                    key={c}
                    data-ev-char
                    className={cn("inline-block", intro && "animate-rise motion-reduce:animate-none")}
                    style={intro ? ({ animationDelay: `${Math.round((delay + i * stagger) * 1000)}ms` } as CSSProperties) : undefined}
                  >
                    {ch}
                  </span>
                );
              })}
            </span>
          </Fragment>
        ))}
      </span>
    </>
  );
}

export type EventIconName = "prev" | "next" | "expand" | "close";

/** 24px line icons in currentColor (the site's line-mark style). Decorative. */
export function EventIcon({ name, className }: { name: EventIconName; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("size-5 shrink-0", className)}
    >
      {name === "prev" && <path d="M15 5l-7 7 7 7" />}
      {name === "next" && <path d="M9 5l7 7-7 7" />}
      {name === "expand" && <path d="M14 4h6v6M10 20H4v-6M20 4l-6.5 6.5M4 20l6.5-6.5" />}
      {name === "close" && <path d="M6 6l12 12M18 6 6 18" />}
    </svg>
  );
}
