"use client";

import Link from "next/link";
import { isExternal } from "@/components/ui/Action";
import { ANNOUNCEMENT_STORAGE_KEY } from "@/lib/announcement";

/**
 * A compact line above the navbar (DESIGN.md §6). Content and on/off come from settings. Dismissal is stored in
 * localStorage against a key derived from the announcement, so a new announcement shows again; the inline script in
 * the root layout applies a previous dismissal before first paint.
 */
interface AnnouncementBarProps {
  text: string;
  linkLabel: string | null;
  linkUrl: string | null;
  dismissKey: string;
}

export function AnnouncementBar({ text, linkLabel, linkUrl, dismissKey }: AnnouncementBarProps) {
  function dismiss() {
    document.documentElement.dataset.ann = "off";
    try {
      localStorage.setItem(ANNOUNCEMENT_STORAGE_KEY, dismissKey);
    } catch {
      /* storage unavailable: dismissal lasts for this page view only */
    }
  }

  const link =
    linkLabel && linkUrl ? (
      isExternal(linkUrl) ? (
        <a href={linkUrl} target="_blank" rel="noopener noreferrer" className={LINK}>
          {linkLabel} <span aria-hidden="true">↗</span>
        </a>
      ) : (
        <Link href={linkUrl} className={LINK}>
          {linkLabel} <span aria-hidden="true">→</span>
        </Link>
      )
    ) : null;

  return (
    <div role="region" aria-label="Announcement" className="relative flex h-(--ann-h) items-center border-b border-line bg-bg-2">
      <div className="shell flex items-center justify-center pr-12 sm:pr-gutter">
        <p className="flex min-w-0 items-center gap-2.5 text-[12px] leading-tight text-muted md:text-[13px]">
          <span className="size-1.5 shrink-0 rounded-pill bg-red" aria-hidden="true" />
          <span className="truncate">{text}</span>
          {link && <span className="shrink-0">{link}</span>}
        </p>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss announcement"
        className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-control text-faint transition-colors duration-300 hover:bg-text/5 hover:text-text md:right-4"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path d="M1 1l8 8M9 1L1 9" />
        </svg>
      </button>
    </div>
  );
}

const LINK = "font-semibold text-text underline decoration-text/30 underline-offset-[3px] transition-colors duration-300 hover:decoration-text";
