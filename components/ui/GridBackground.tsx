import { cn } from "@/lib/cn";

/**
 * Faint 80px grid lines plus small corner brackets.
 * - fixed (default): covers the viewport, brackets sit at the viewport corners.
 * - fixed={false}: fills the nearest positioned parent instead.
 * Sits behind content (-z-10) and never takes pointer events. The body has
 * no background on purpose so this layer shows through; sections with their
 * own background cover it.
 *
 * Pan the lines with the `--grid-x` / `--grid-y` CSS variables on the
 * [data-grid-lines] layer (e.g. gsap.to(lines, { "--grid-x": "-120px" })).
 */
interface GridBackgroundProps {
  fixed?: boolean;
  /** Grid cell size in px. House value is 80. */
  size?: number;
  brackets?: boolean;
  /** Fade the grid out towards the edges with a radial mask. */
  fade?: boolean;
  className?: string;
}

export function GridBackground({
  fixed = true,
  size = 80,
  brackets = true,
  fade = false,
  className,
}: GridBackgroundProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none inset-0 -z-10",
        fixed ? "fixed" : "absolute",
        className,
      )}
    >
      <div
        data-grid-lines
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--grid) 1px, transparent 1px), linear-gradient(to bottom, var(--grid) 1px, transparent 1px)",
          backgroundSize: `${size}px ${size}px`,
          backgroundPosition: "calc(50% + var(--grid-x, 0px)) var(--grid-y, 0px)",
          maskImage: fade
            ? "radial-gradient(ellipse 80% 70% at 50% 40%, #000 40%, transparent 100%)"
            : undefined,
          WebkitMaskImage: fade
            ? "radial-gradient(ellipse 80% 70% at 50% 40%, #000 40%, transparent 100%)"
            : undefined,
        }}
      />
      {brackets && (
        <>
          <Bracket className="left-3 top-3 border-l border-t md:left-5 md:top-5" />
          <Bracket className="right-3 top-3 border-r border-t md:right-5 md:top-5" />
          <Bracket className="bottom-3 left-3 border-b border-l md:bottom-5 md:left-5" />
          <Bracket className="bottom-3 right-3 border-b border-r md:bottom-5 md:right-5" />
        </>
      )}
    </div>
  );
}

function Bracket({ className }: { className: string }) {
  return <span className={cn("absolute size-3.5 border-text/35 md:size-4", className)} />;
}
