"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useRef, useState, type ReactNode, type RefObject } from "react";
import { MonoLabel } from "@/components/ui";
import { cn } from "@/lib/cn";
import { pad2 } from "@/lib/gallery";
import { BEZIER, DURATION } from "@/lib/motion";
import { JournalIcon, type JournalIconName } from "./icons";

/**
 * The journal viewer's chrome (DESIGN.md §14): the top bar, the frosted bottom
 * toolbar, their popovers and the toast.
 */

export type JournalView = "journal" | "grid";

/* --------------------------------------------------------------- buttons */

export function IconButton({
  icon,
  label,
  onClick,
  pressed,
  expanded,
  controls,
  className,
}: {
  icon: JournalIconName;
  label: string;
  onClick(): void;
  pressed?: boolean;
  expanded?: boolean;
  controls?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      aria-expanded={expanded}
      aria-controls={controls}
      onClick={onClick}
      data-cursor="link"
      className={cn(
        "grid size-11 shrink-0 place-items-center rounded-full text-text",
        "transition-[background-color,color,transform] duration-[350ms] ease-power3 hover:bg-text/10 active:scale-95",
        "aria-expanded:bg-text aria-expanded:text-bg",
        className,
      )}
    >
      <JournalIcon name={icon} />
    </button>
  );
}

/** Journal / grid segmented toggle. */
function ViewToggle({ view, onView }: { view: JournalView; onView(view: JournalView): void }) {
  const options: Array<{ value: JournalView; label: string; icon: JournalIconName }> = [
    { value: "journal", label: "Journal view", icon: "journal" },
    { value: "grid", label: "Grid view", icon: "grid" },
  ];
  return (
    <div role="group" aria-label="View" className="flex rounded-pill border border-line bg-bg-2/70 p-1 backdrop-blur-md">
      {options.map((o) => {
        const on = view === o.value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            aria-label={o.label}
            title={o.label}
            onClick={() => onView(o.value)}
            data-cursor="link"
            className={cn(
              "grid h-9 w-10 place-items-center rounded-pill transition-[background-color,color] duration-[350ms] ease-power3 md:w-11",
              on ? "bg-text text-bg" : "text-muted hover:text-text",
            )}
          >
            <JournalIcon name={o.icon} className="size-[18px]" />
          </button>
        );
      })}
    </div>
  );
}

/* --------------------------------------------------------------- popover */

/** A small panel anchored to a button: closes on Escape, outside click, or `onClose`. */
function Popover({
  id,
  open,
  onClose,
  anchor,
  className,
  children,
}: {
  id: string;
  open: boolean;
  onClose(): void;
  anchor: RefObject<HTMLElement | null>;
  className?: string;
  children: ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!panel.current?.contains(t) && !anchor.current?.contains(t)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      onClose();
      anchor.current?.querySelector("button")?.focus();
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, anchor]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panel}
          id={id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8, transition: { duration: DURATION.micro } }}
          transition={{ duration: DURATION.micro, ease: BEZIER.out }}
          className={cn(
            "absolute z-40 rounded-card border border-line bg-bg-2/90 p-2 shadow-2xl shadow-black/60 backdrop-blur-xl",
            className,
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const MENU_ITEM =
  "flex w-full items-center gap-3 rounded-[18px] px-4 py-3 text-left text-sm font-semibold text-text transition-colors duration-[350ms] ease-power3 hover:bg-text/10";

/* --------------------------------------------------------------- top bar */

export function JournalTopBar({
  title,
  pages,
  view,
  onView,
  onShare,
  onCopy,
  onDownload,
  eventHref,
  sticky,
}: {
  title: string;
  pages: number;
  view: JournalView;
  onView(view: JournalView): void;
  onShare(): void;
  onCopy(): void;
  /** Download the centre page (journal view only). */
  onDownload: (() => void) | null;
  eventHref: string;
  /** Grid view: the bar sticks under the header while the grid scrolls. */
  sticky: boolean;
}) {
  const [menu, setMenu] = useState(false);
  const menuAnchor = useRef<HTMLDivElement>(null);
  const menuId = useId();

  return (
    <div
      className={cn(
        "z-30 border-b border-transparent",
        sticky && "sticky top-(--nav-h) border-line bg-bg/75 backdrop-blur-xl backdrop-saturate-150",
      )}
    >
      <div className="shell flex flex-wrap items-center gap-x-3 gap-y-2 py-3 md:grid md:grid-cols-[1fr_auto_1fr] md:py-4">
        <div className="flex items-center gap-2 md:gap-3">
          <Link
            href="/gallery"
            aria-label="Back to all journals"
            title="All journals"
            data-cursor="link"
            className="grid size-11 shrink-0 place-items-center rounded-full border border-line bg-bg-2/70 text-text backdrop-blur-md transition-[background-color,transform] duration-[350ms] ease-power3 hover:bg-text/10 active:scale-95"
          >
            <JournalIcon name="back" />
          </Link>
          <ViewToggle view={view} onView={onView} />
        </div>

        <div className="order-last basis-full text-center md:order-none md:basis-auto">
          <h1 className="text-[17px] leading-tight font-semibold tracking-[-0.015em] md:text-xl">{title}</h1>
          <MonoLabel as="p" className="mt-1">
            [{pad2(pages)}] Pages
          </MonoLabel>
        </div>

        <div className="ml-auto flex items-center gap-1 md:justify-self-end">
          <IconButton icon="share" label="Share this journal" onClick={onShare} />
          <div ref={menuAnchor} className="relative">
            <IconButton
              icon="more"
              label="More"
              onClick={() => setMenu((m) => !m)}
              expanded={menu}
              controls={menuId}
            />
            <Popover id={menuId} open={menu} onClose={() => setMenu(false)} anchor={menuAnchor} className="top-full right-0 mt-2 w-60">
              <ul className="grid gap-0.5">
                <li>
                  <Link href={eventHref} className={MENU_ITEM} data-cursor="link" onClick={() => setMenu(false)}>
                    About the event
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    className={MENU_ITEM}
                    data-cursor="link"
                    onClick={() => {
                      onCopy();
                      setMenu(false);
                    }}
                  >
                    Copy link
                  </button>
                </li>
                {onDownload && (
                  <li>
                    <button
                      type="button"
                      className={MENU_ITEM}
                      data-cursor="link"
                      onClick={() => {
                        onDownload();
                        setMenu(false);
                      }}
                    >
                      Download this page
                    </button>
                  </li>
                )}
                <li>
                  <Link href="/gallery" className={MENU_ITEM} data-cursor="link" onClick={() => setMenu(false)}>
                    All journals
                  </Link>
                </li>
              </ul>
            </Popover>
          </div>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- toolbar */

export interface JournalInfo {
  title: string;
  date: string;
  venue: string;
  summary: string;
  photos: number;
  videos: number;
  /** The centre page's caption, if it has one. */
  caption: string | null;
}

export function JournalToolbar({
  info,
  onShare,
  onDownload,
  onGrid,
}: {
  info: JournalInfo;
  onShare(): void;
  onDownload(): void;
  onGrid(): void;
}) {
  const [open, setOpen] = useState(false);
  const anchor = useRef<HTMLDivElement>(null);
  const infoId = useId();

  return (
    <div ref={anchor} className="relative mx-auto w-fit">
      <div
        role="toolbar"
        aria-label="Journal"
        className="flex items-center gap-1 rounded-pill border border-line bg-bg-2/55 p-1.5 shadow-2xl shadow-black/40 backdrop-blur-xl backdrop-saturate-150"
      >
        <IconButton icon="info" label="About this journal" onClick={() => setOpen((o) => !o)} expanded={open} controls={infoId} />
        <IconButton icon="share" label="Share" onClick={onShare} />
        <IconButton icon="download" label="Download this page" onClick={onDownload} />
        <IconButton icon="grid" label="Grid view" onClick={onGrid} />
      </div>
      <Popover
        id={infoId}
        open={open}
        onClose={() => setOpen(false)}
        anchor={anchor}
        className="bottom-full left-1/2 mb-3 w-[min(340px,calc(100vw-2*var(--gutter)))] -translate-x-1/2 p-5"
      >
        <MonoLabel as="p">
          {info.date} · {info.venue}
        </MonoLabel>
        <p className="mt-2 text-lg leading-snug font-semibold tracking-[-0.01em]">{info.title}</p>
        <p className="mt-2 text-sm text-muted">{info.summary}</p>
        <MonoLabel as="p" className="mt-4">
          [{pad2(info.photos)}] Photos / [{pad2(info.videos)}] Videos
        </MonoLabel>
        {info.caption && <p className="mt-4 border-t border-line pt-4 font-hand text-2xl leading-tight">“{info.caption}”</p>}
      </Popover>
    </div>
  );
}

/* ----------------------------------------------------------------- toast */

export function Toast({ message }: { message: string | null }) {
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-28 z-[95] flex justify-center px-gutter">
      <AnimatePresence>
        {message && (
          <motion.p
            key={message}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DURATION.micro, ease: BEZIER.out }}
            className="rounded-pill bg-text px-5 py-3 text-sm font-semibold text-bg shadow-2xl shadow-black/50"
          >
            {message}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
