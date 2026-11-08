import type { ReactNode } from "react";
import type { PillarIconName } from "@/lib/about";

/** Line icons for the /about pillars: 24×24, stroked in currentColor. */
const PATHS: Record<PillarIconName, ReactNode> = {
  // A soldering iron with a spark at the tip.
  workshop: (
    <>
      <path d="M3.5 20.5l3-3" />
      <path d="M6 15.5l2.5 2.5 6-6-2.5-2.5z" />
      <path d="M12.8 8.7l3-3a2.3 2.3 0 0 1 3.3 3.3l-3 3" />
      <path d="M5.5 3.5v3M4 5h3" />
    </>
  ),
  // A chip.
  project: (
    <>
      <rect x="6" y="6" width="12" height="12" rx="2" />
      <rect x="9.5" y="9.5" width="5" height="5" rx="1" />
      <path d="M9.5 3v3M14.5 3v3M9.5 18v3M14.5 18v3M3 9.5h3M3 14.5h3M18 9.5h3M18 14.5h3" />
    </>
  ),
  // A trophy.
  competition: (
    <>
      <path d="M7.5 4h9v5a4.5 4.5 0 0 1-9 0z" />
      <path d="M7.5 6H5a2.5 2.5 0 0 0 2.8 3.5M16.5 6H19a2.5 2.5 0 0 1-2.8 3.5" />
      <path d="M12 13.5V17M8.5 20.5h7M10 17h4l.5 3.5h-5z" />
    </>
  ),
};

export function PillarIcon({ name, className }: { name: PillarIconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {PATHS[name]}
    </svg>
  );
}
