import { cn } from "@/lib/cn";
import { BOT_ICONS, type BotIcon } from "./icons";

/**
 * A small flat drawing of the robot's head (iris bezel, black screen, ears)
 * showing one of its screen icons, or its eyes when `icon` is null. Plain
 * SVG/CSS (no three.js), so it can stand in for the robot where the 3D stage
 * isn't shown, e.g. the stacked lab stations on phones. Size it with
 * `className` (default 44px). Decorative unless you pass `label`.
 */
export function BotHeadIcon({
  icon,
  label,
  className,
}: {
  icon: BotIcon | null;
  label?: string;
  className?: string;
}) {
  const paths = icon ? BOT_ICONS[icon].paths : null;
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("relative inline-flex size-11 shrink-0", className)}
    >
      <span className="absolute -left-[7%] top-[33%] h-[34%] w-[12%] rounded-[3px] bg-bg-2 ring-1 ring-line" />
      <span className="absolute -right-[7%] top-[33%] h-[34%] w-[12%] rounded-[3px] bg-bg-2 ring-1 ring-line" />
      <span className="relative flex size-full rounded-[30%] bg-iris p-[8%]">
        <span className="flex size-full items-center justify-center rounded-[26%] bg-bg">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.7}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-[70%] text-text"
          >
            {paths ? (
              paths.map((d, i) => <path key={i} d={d} />)
            ) : (
              <>
                <rect x="6.5" y="8" width="3.4" height="8" rx="1.7" fill="currentColor" stroke="none" />
                <rect x="14.1" y="8" width="3.4" height="8" rx="1.7" fill="currentColor" stroke="none" />
              </>
            )}
          </svg>
        </span>
      </span>
    </span>
  );
}
