"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import { BEZIER } from "@/lib/motion";
import { NAV_ITEMS, isActive } from "@/lib/nav";
import { useUIStore } from "@/lib/store";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { Button } from "@/components/ui/Button";
import { formatIndex } from "@/components/ui/MonoLabel";

/**
 * The menu for screens below lg (DESIGN.md §6). Full screen, under the fixed header (z-40 vs z-50) so the menu button
 * becomes its close button. Locks scroll (stops Lenis), makes the page inert, focuses the first link, closes on
 * Escape, a link click or a route change, and returns focus to the menu button.
 */
export interface MenuOverlayProps {
  email: string;
  socials: { label: string; href: string }[];
}

export function MenuOverlay(props: MenuOverlayProps & { joinHref: string }) {
  const open = useUIStore((s) => s.menuOpen);
  const setOpen = useUIStore((s) => s.setMenuOpen);
  const lenis = useUIStore((s) => s.lenis);

  useEffect(() => {
    if (!open) return;

    const html = document.documentElement;
    const prevOverflow = html.style.overflow;
    const inertTargets = ["main", "site-footer"]
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    lenis?.stop();
    html.style.overflow = "hidden";
    inertTargets.forEach((el) => (el.inert = true));

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
      lenis?.start();
      html.style.overflow = prevOverflow;
      inertTargets.forEach((el) => (el.inert = false));
      const menu = document.getElementById("site-menu");
      if (!document.activeElement || document.activeElement === document.body || menu?.contains(document.activeElement)) {
        document.getElementById("menu-button")?.focus();
      }
    };
  }, [open, lenis, setOpen]);

  return (
    <AnimatePresence>
      {open && <MenuPanel key="site-menu" onClose={() => setOpen(false)} {...props} />}
    </AnimatePresence>
  );
}

function MenuPanel({ onClose, email, socials, joinHref }: MenuOverlayProps & { joinHref: string; onClose: () => void }) {
  const pathname = usePathname();
  const openedAt = useRef(pathname);
  const firstLink = useRef<HTMLAnchorElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    firstLink.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (pathname !== openedAt.current) onClose();
  }, [pathname, onClose]);

  return (
    <motion.div
      id="site-menu"
      role="dialog"
      aria-modal="true"
      aria-label="Site menu"
      data-lenis-prevent
      className="fixed inset-0 z-40 flex flex-col overflow-y-auto overscroll-contain bg-bg pt-(--nav-h) lg:hidden"
      initial={reduced ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reduced ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, transition: { duration: 0.2 } }}
      transition={{ duration: 0.35, ease: BEZIER.out }}
    >
      <nav aria-label="Site" className="shell flex-1 border-t border-line pt-4 pb-6">
        <ul>
          {NAV_ITEMS.map((item, i) => {
            const active = isActive(pathname, item.href);
            return (
              <motion.li
                key={item.href}
                className="border-b border-line"
                initial={reduced ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: BEZIER.out, delay: 0.04 + i * 0.03 }}
              >
                <Link
                  ref={i === 0 ? firstLink : undefined}
                  href={item.href}
                  onClick={onClose}
                  aria-current={active ? "page" : undefined}
                  className="flex items-center gap-4 py-3.5"
                >
                  <span className="w-6 font-mono text-[11px] text-faint">{formatIndex(i + 1)}</span>
                  <span
                    className={cn(
                      "text-[clamp(1.5rem,6.5vw,2rem)] leading-tight font-semibold tracking-[-0.03em]",
                      active ? "text-text" : "text-text/80",
                    )}
                  >
                    {item.label}
                  </span>
                  {active && <span className="ml-auto h-[2px] w-5 bg-red" aria-hidden="true" />}
                </Link>
              </motion.li>
            );
          })}
        </ul>
      </nav>

      <div className="shell flex flex-col gap-5 pb-8">
        <Button href={joinHref} size="lg" arrow className="w-full">
          Join the club
        </Button>
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <a href={`mailto:${email}`} className="text-[14px] text-muted transition-colors duration-300 hover:text-text">
            {email}
          </a>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {socials.map((s) => (
              <li key={s.label}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[14px] text-muted transition-colors duration-300 hover:text-text"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}
