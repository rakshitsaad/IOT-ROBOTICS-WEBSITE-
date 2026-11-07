import { cn } from "@/lib/cn";

/**
 * Small decorative "x" mark. Colour follows `currentColor` (default text-muted).
 *
 *   <CrossMark size={14} className="text-red" />
 */
interface CrossMarkProps {
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function CrossMark({ size = 12, strokeWidth = 1.25, className }: CrossMarkProps) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 12 12"
      className={cn("pointer-events-none shrink-0 text-muted", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth={(strokeWidth * 12) / size}
      strokeLinecap="square"
    >
      <path d="M1 1L11 11M11 1L1 11" />
    </svg>
  );
}
