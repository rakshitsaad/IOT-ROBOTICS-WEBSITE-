"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useSyncExternalStore } from "react";
import { useUIStore } from "@/lib/store";
import { cn } from "@/lib/cn";
import { NAV_PRIMARY, isActive } from "@/lib/nav";
import { Button } from "@/components/ui/Button";
import { AnnouncementBar } from "./AnnouncementBar";
import { Logo } from "./Logo";
import { MenuOverlay, type MenuOverlayProps } from "./MenuOverlay";

/**
 * Fixed header = announcement bar + navbar (DESIGN.md §6).
 * - lg and up: the logo, the section links (the current one is marked) and "Join the club".
 * - Below lg: the logo, "Join" and a menu button that opens the full-screen menu.
 * Solid black; a hairline appears under it once the page has scrolled 24px, and the announcement collapses.
 * Pages clear it with the `pt-header` utility.
 */

const SCROLL_THRESHOLD = 24;

function subscribeScroll(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
}

export interface HeaderProps extends MenuOverlayProps {
  clubName: string;
  collegeName: string;
  joinHref: string;
  announcement: {
    text: string;
    linkLabel: string | null;
    linkUrl: string | null;
    dismissKey: string;
  } | null;
}

export function Header({ clubName, collegeName, joinHref, announcement, ...menuProps }: HeaderProps) {
  const scrolled = useSyncExternalStore(
    subscribeScroll,
    () => window.scrollY > SCROLL_THRESHOLD,
    () => false,
  );
  const menuOpen = useUIStore((s) => s.menuOpen);

  return (
    <>
      <header data-scrolled={scrolled} data-menu={menuOpen} className="group/header fixed inset-x-0 top-0 z-50">
        {announcement && (
          <div
            data-announcement
            className={cn(
              "grid grid-rows-[1fr] transition-[grid-template-rows] duration-500 ease-power3",
              "group-data-[scrolled=true]/header:grid-rows-[0fr] group-data-[menu=true]/header:grid-rows-[0fr]",
            )}
          >
            <div className="min-h-0 overflow-hidden">
              <AnnouncementBar {...announcement} />
            </div>
          </div>
        )}

        <div
          className={cn(
            "border-b border-transparent bg-bg transition-colors duration-300",
            "group-data-[scrolled=true]/header:border-line",
          )}
        >
          <nav aria-label="Primary" className="shell flex h-(--nav-h) items-center justify-between gap-6">
            <Logo name={clubName} college={collegeName} />

            <Suspense fallback={<NavLinks pathname={null} />}>
              <NavLinksWithPath />
            </Suspense>

            <div className="flex items-center gap-2">
              <Button href={joinHref} size="sm" className="lg:h-10 lg:px-4">
                <span className="sm:hidden">Join</span>
                <span className="hidden sm:inline">Join the club</span>
              </Button>
              <MenuButton />
            </div>
          </nav>
        </div>
      </header>
      <MenuOverlay joinHref={joinHref} {...menuProps} />
    </>
  );
}

function NavLinksWithPath() {
  return <NavLinks pathname={usePathname()} />;
}

/** The desktop section links. The current section gets `aria-current` and a red bar along the header's bottom edge. */
function NavLinks({ pathname }: { pathname: string | null }) {
  return (
    <ul className="hidden h-(--nav-h) items-stretch gap-6 lg:flex xl:gap-8">
      {NAV_PRIMARY.map((item) => {
        const active = pathname !== null && isActive(pathname, item.href);
        return (
          <li key={item.href} className={cn("flex", item.from === "xl" && "hidden xl:flex")}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex items-center text-[14px] font-medium transition-colors duration-300",
                active ? "text-text" : "text-muted hover:text-text",
              )}
            >
              {item.label}
              <span
                aria-hidden="true"
                className={cn(
                  "absolute inset-x-0 -bottom-px h-[2px] origin-left bg-red transition-transform duration-300 ease-power3",
                  active ? "scale-x-100" : "scale-x-0",
                )}
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function MenuButton() {
  const open = useUIStore((s) => s.menuOpen);
  const toggle = useUIStore((s) => s.toggleMenu);
  const setOpen = useUIStore((s) => s.setMenuOpen);

  // The menu is for small screens: close it if the window grows past lg.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = () => mq.matches && setOpen(false);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [setOpen]);

  return (
    <button
      id="menu-button"
      type="button"
      onClick={toggle}
      aria-expanded={open}
      aria-controls="site-menu"
      aria-label={open ? "Close menu" : "Open menu"}
      className={cn(
        "relative grid size-9 shrink-0 place-items-center rounded-control border transition-colors duration-300 lg:hidden",
        open ? "border-text/40 bg-bg-3 text-text" : "border-line text-text hover:border-text/30",
      )}
    >
      <span className="relative block h-[9px] w-4" aria-hidden="true">
        <span
          className={cn(
            "absolute top-0 left-0 h-[1.5px] w-full bg-current transition-transform duration-500 ease-expo",
            open && "translate-y-[3.75px] rotate-45",
          )}
        />
        <span
          className={cn(
            "absolute bottom-0 left-0 h-[1.5px] w-full bg-current transition-transform duration-500 ease-expo",
            open && "-translate-y-[3.75px] -rotate-45",
          )}
        />
      </span>
    </button>
  );
}
