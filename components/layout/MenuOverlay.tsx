"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import { BEZIER, DURATION } from "@/lib/motion";
import { NAV_ITEMS } from "@/lib/nav";
import { useUIStore } from "@/lib/store";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/**
 * Full-screen menu. Sits under the fixed header (z-40 vs z-50) so the logo
 * and the menu button (now a close button) stay usable.
 * Locks scroll (stops Lenis), makes the page inert, closes on Escape, link
 * click or route change.
 */
export interface MenuOverlayProps {
  email: string;
  socials: { label: string; href: string }[];
}

export function MenuOverlay(props: MenuOverlayProps) {
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

function MenuPanel({ onClose, email, socials }: MenuOverlayProps & { onClose: () => void }) {
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
      className="fixed inset-0 z-40 flex flex-col overflow-y-auto overscroll-contain bg-bg pt-(--nav-h)"
      initial={reduced ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reduced ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0 }}
      transition={{ duration: DURATION.fast, ease: BEZIER.out }}
    >

      <nav aria-label="Site" className="shell flex flex-1 flex-col justify-center py-6 md:py-10">
        <ul className="group/list">
          {NAV_ITEMS.map((item, i) => {
            const active = pathname === item.href;
            return (
              <li key={item.href} className="overflow-hidden border-b border-line first:border-t">
                <motion.div
                  initial={reduced ? false : { y: "110%" }}
                  animate={{ y: "0%" }}
                  transition={{ duration: DURATION.base, ease: BEZIER.expo, delay: 0.1 + i * 0.05 }}
                >
                  <Link
                    ref={i === 0 ? firstLink : undefined}
                    href={item.href}
                    onClick={onClose}
                    aria-current={active ? "page" : undefined}
                    data-cursor="link"
                    className={cn(
                      "group/item flex items-center gap-4 py-2 md:gap-8 md:py-2.5",
                      "transition-opacity duration-[350ms] ease-power3 group-hover/list:opacity-40 hover:opacity-100! focus-visible:opacity-100!",
                    )}
                  >
                    <span
                      className="font-bold leading-[1.04] tracking-[-0.035em] transition-transform duration-600 ease-expo group-hover/item:translate-x-3"
                      style={{ fontSize: "clamp(2rem, min(9vw, 6.6vh), 6.5rem)" }}
                    >
                      {item.label}
                    </span>
                    {active && (
                      <span className="ml-auto size-2.5 shrink-0 rounded-full bg-red md:size-3" aria-hidden="true" />
                    )}
                  </Link>
                </motion.div>
              </li>
            );
          })}
        </ul>
      </nav>

      <motion.div
        className="shell flex flex-col gap-3 pb-6 sm:flex-row sm:items-center sm:justify-between md:pb-8"
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: DURATION.fast, delay: 0.5 }}
      >
        <a href={`mailto:${email}`} data-cursor="link" className="mono-label text-text transition-colors duration-[350ms] hover:text-red">
          {email}
        </a>
        <ul className="flex flex-wrap gap-x-5 gap-y-2">
          {socials.map((s) => (
            <li key={s.label}>
              <a
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="link"
                className="mono-label text-muted transition-colors duration-[350ms] hover:text-text"
              >
                {s.label} ↗
              </a>
            </li>
          ))}
        </ul>
      </motion.div>
    </motion.div>
  );
}
