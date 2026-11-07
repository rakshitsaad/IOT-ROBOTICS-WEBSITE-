import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Line icons for the journal viewer, on a 24px grid with a 1.6px stroke in
 * currentColor (the site's line-mark style). Decorative: the button around
 * each one carries its name.
 */
export type JournalIconName =
  | "back"
  | "journal"
  | "grid"
  | "share"
  | "more"
  | "info"
  | "download"
  | "sound-on"
  | "sound-off"
  | "close"
  | "prev"
  | "next"
  | "play"
  | "zoom-in"
  | "zoom-out";

export function JournalIcon({ name, className }: { name: JournalIconName; className?: string }) {
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
      {PATHS[name]}
    </svg>
  );
}

const PATHS: Record<JournalIconName, ReactNode> = {
  back: <path d="M19 12H5M11 6l-6 6 6 6" />,
  journal: (
    // Three pages fanned out around a centre page.
    <>
      <rect x="8.5" y="4.5" width="7" height="15" rx="1.6" />
      <path d="M6 7.2 3.8 8v8.6L6 17.4M18 7.2l2.2.8v8.6l-2.2.8" />
    </>
  ),
  grid: (
    <>
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.6" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6" />
    </>
  ),
  share: (
    <>
      <path d="M12 15V4M8 8l4-4 4 4" />
      <path d="M7 11H6a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2h-1" />
    </>
  ),
  more: (
    <>
      <circle cx="5.5" cy="12" r="1.1" fill="currentColor" />
      <circle cx="12" cy="12" r="1.1" fill="currentColor" />
      <circle cx="18.5" cy="12" r="1.1" fill="currentColor" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5.5" />
      <circle cx="12" cy="7.8" r="0.5" fill="currentColor" />
    </>
  ),
  download: (
    <>
      <path d="M12 4v11M7.5 10.5 12 15l4.5-4.5" />
      <path d="M4.5 16.5V18a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-1.5" />
    </>
  ),
  "sound-on": (
    <>
      <path d="M4 9.5h3l4.5-4v13L7 14.5H4z" />
      <path d="M15 9a4.2 4.2 0 0 1 0 6M17.6 6.5a8 8 0 0 1 0 11" />
    </>
  ),
  "sound-off": (
    <>
      <path d="M4 9.5h3l4.5-4v13L7 14.5H4z" />
      <path d="m15.5 9.5 5 5M20.5 9.5l-5 5" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6 6 18" />,
  prev: <path d="M15 5.5 8.5 12l6.5 6.5" />,
  next: <path d="M9 5.5 15.5 12 9 18.5" />,
  play: <path d="M8 5.8v12.4a.6.6 0 0 0 .9.5l9.6-6.2a.6.6 0 0 0 0-1L8.9 5.3a.6.6 0 0 0-.9.5z" fill="currentColor" stroke="none" />,
  "zoom-in": (
    <>
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="M15 15l5 5M10.5 8v5M8 10.5h5" />
    </>
  ),
  "zoom-out": (
    <>
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="M15 15l5 5M8 10.5h5" />
    </>
  ),
};
