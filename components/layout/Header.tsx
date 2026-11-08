"use client";

import { useSyncExternalStore } from "react";
import { useUIStore } from "@/lib/store";
import { cn } from "@/lib/cn";
import { IrisButton } from "@/components/ui/IrisButton";
import { PillButton } from "@/components/ui/PillButton";
import { AnnouncementBar } from "./AnnouncementBar";
import { Logo } from "./Logo";
import { MenuOverlay, type MenuOverlayProps } from "./MenuOverlay";

/**
 * Fixed header = announcement bar + navbar.
 * Transparent at the top; after 40px of scroll the navbar gains a blurred
 * bg-2 background and the announcement bar collapses.
 * Pages clear it with the `pt-header` utility.
 */

const SCROLL_THRESHOLD = 40;

function subscribeScroll(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
}

export interface HeaderProps extends MenuOverlayProps {
  clubName: string;
  clubShortName: string;
  announcement: {
    text: string;
    linkLabel: string | null;
    linkUrl: string | null;
    dismissKey: string;
  } | null;
}

export function Header({ clubName, clubShortName, announcement, ...menuProps }: HeaderProps) {
  const scrolled = useSyncExternalStore(
    subscribeScroll,
    () => window.scrollY > SCROLL_THRESHOLD,
    () => false,
  );
  const menuOpen = useUIStore((s) => s.menuOpen);

  return (
    <>
      <header
        data-scrolled={scrolled}
        data-menu={menuOpen}
        className="group/header fixed inset-x-0 top-0 z-50"
      >
        {announcement && (
          <div
            data-announcement
            className={cn(
              "grid grid-rows-[1fr] transition-[grid-template-rows] duration-600 ease-power3",
              "group-data-[scrolled=true]/header:grid-rows-[0fr] group-data-[menu=true]/header:grid-rows-[0fr]",
            )}
          >
            <div className="min-h-0 overflow-hidden">
              <AnnouncementBar {...announcement} />
            </div>
          </div>
        )}

        <div className="relative">
          {/* Scrolled background */}
          <div
            aria-hidden="true"
            className={cn(
              "absolute inset-0 border-b border-line bg-bg-2/75 opacity-0 backdrop-blur-xl backdrop-saturate-150",
              "transition-opacity duration-600 ease-power3",
              "group-data-[scrolled=true]/header:opacity-100 group-data-[menu=true]/header:opacity-0",
            )}
          />
          <nav aria-label="Primary" className="shell relative flex h-(--nav-h) items-center justify-between gap-3">
            <Logo name={clubName} shortName={clubShortName} />
            <div className="flex items-center gap-2">
              <IrisButton href="/join">Join us</IrisButton>
              <PillButton href="/contact" variant="light">
                Contact
              </PillButton>
              <MenuButton />
            </div>
          </nav>
        </div>
      </header>
      <MenuOverlay {...menuProps} />
    </>
  );
}

function MenuButton() {
  const open = useUIStore((s) => s.menuOpen);
  const toggle = useUIStore((s) => s.toggleMenu);

  return (
    <button
      id="menu-button"
      type="button"
      onClick={toggle}
      aria-expanded={open}
      aria-controls="site-menu"
      aria-label={open ? "Close menu" : "Open menu"}
      data-cursor="link"
      className={cn(
        "relative flex size-10 shrink-0 items-center justify-center rounded-full border md:size-11",
        "transition-[background-color,border-color] duration-[350ms] ease-power3",
        open
          ? "border-transparent bg-text text-bg"
          : "border-line bg-text/[0.04] text-text hover:border-text/30 hover:bg-text/10",
      )}
    >
      <span className="relative block h-2.5 w-4" aria-hidden="true">
        <span
          className={cn(
            "absolute left-0 top-0 h-[1.5px] w-full rounded-full bg-current transition-transform duration-600 ease-expo",
            open && "translate-y-[4.25px] rotate-45",
          )}
        />
        <span
          className={cn(
            "absolute bottom-0 left-0 h-[1.5px] w-full rounded-full bg-current transition-transform duration-600 ease-expo",
            open && "-translate-y-[4.25px] -rotate-45",
          )}
        />
      </span>
    </button>
  );
}
