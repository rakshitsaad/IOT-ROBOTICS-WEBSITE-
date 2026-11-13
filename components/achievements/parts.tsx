import { cn } from "@/lib/cn";
import { isWin } from "@/lib/achievements";

/**
 * Small shared pieces of /achievements (DESIGN.md §19).
 */

/** "Winner" (and other wins) in the accent red; every other result muted. */
export function ResultBadge({ result, className }: { result: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-block rounded-pill px-3 py-1 text-[12px] leading-none font-medium whitespace-nowrap",
        isWin(result) ? "bg-red text-text" : "bg-text/10 text-text/80",
        className,
      )}
    >
      {result}
    </span>
  );
}

/**
 * A number (no leading zero) that rolls like an odometer when it changes: each digit is a 0–9 column moved with a CSS
 * transition (900ms expo; instant under reduced motion, like every transition). `aria-hidden`: give the value as text
 * elsewhere.
 */
export function Odometer({ value, className }: { value: number; className?: string }) {
  const digits = String(value).split("").map(Number);
  return (
    <span aria-hidden="true" className={cn("inline-flex overflow-hidden tabular-nums", className)}>
      {digits.map((d, i) => (
        // The cells set their own line-height: a font size passed in `className` would drop a `leading-*` there (cn).
        <span key={digits.length - i} className="relative inline-block h-[1em] w-[0.66em] overflow-hidden leading-none">
          <span
            className="absolute inset-x-0 top-0 flex flex-col transition-transform duration-[900ms] ease-expo"
            style={{ transform: `translateY(${-d}em)` }}
          >
            {Array.from({ length: 10 }, (_, n) => (
              <span key={n} className="block h-[1em] text-center leading-none">
                {n}
              </span>
            ))}
          </span>
        </span>
      ))}
    </span>
  );
}

export function ArrowIcon({ dir, className }: { dir: "left" | "right"; className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={cn("size-5", className)}>
      {dir === "left" ? <path d="M15 5l-7 7 7 7" /> : <path d="M9 5l7 7-7 7" />}
    </svg>
  );
}

export function ShareIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={cn("size-5", className)}>
      <path d="M12 15V3M7 8l5-5 5 5" />
      <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
    </svg>
  );
}
