import { cn } from "@/lib/cn";

/**
 * Small decorative cluster of dots. Colour follows `currentColor`, so tint it
 * with a text class (default text-muted).
 *
 *   <DotGrid rows={3} cols={5} className="text-red/60" />
 */
interface DotGridProps {
  rows?: number;
  cols?: number;
  /** Dot diameter in px. */
  size?: number;
  /** Centre-to-centre distance in px. */
  gap?: number;
  className?: string;
}

export function DotGrid({
  rows = 3,
  cols = 3,
  size = 3,
  gap = 12,
  className,
}: DotGridProps) {
  const r = size / 2;
  const width = (cols - 1) * gap + size;
  const height = (rows - 1) * gap + size;

  return (
    <svg
      aria-hidden="true"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("pointer-events-none shrink-0 text-muted", className)}
      fill="currentColor"
    >
      {Array.from({ length: rows * cols }, (_, i) => {
        const row = Math.floor(i / cols);
        const col = i % cols;
        return <circle key={i} cx={r + col * gap} cy={r + row * gap} r={r} />;
      })}
    </svg>
  );
}
