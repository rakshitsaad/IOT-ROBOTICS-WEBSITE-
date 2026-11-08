"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Countdown } from "@/components/home/Countdown";
import { IrisButton, MonoLabel, PillButton } from "@/components/ui";
import { eventDate, eventTime, type ShowcaseEvent } from "@/lib/events";
import { BEZIER, DURATION } from "@/lib/motion";
import { useUIStore } from "@/lib/store";
import { EventIcon, StatusBadge } from "./parts";

/**
 * An event's full detail (DESIGN.md §17), opened by the card's expand button: a full-screen overlay with the
 * banner, date and time, venue, tags, the full description, the actions and every photo (each opens the
 * lightbox). Portalled to <body> at z-80 (above the header, below the lightbox). While open the page behind is
 * inert, Lenis stops and the page doesn't scroll; Esc or Close closes it and focus goes back to the expand button.
 * Reduced motion: no fade or rise.
 */

interface Props {
  event: ShowcaseEvent;
  onClose(): void;
  onPhoto(index: number): void;
  /** The lightbox is open on top: this overlay goes inert and ignores Esc. */
  covered: boolean;
  reduced: boolean;
}

export function EventDetail(props: Props) {
  return createPortal(<Panel {...props} />, document.body);
}

function Panel({ event, onClose, onPhoto, covered, reduced }: Props) {
  const lenis = useUIStore((s) => s.lenis);
  const close = useRef<HTMLButtonElement>(null);

  // The page behind: inert, no scroll. Re-applied when the lightbox closes, since it un-inerts the page itself.
  useEffect(() => {
    if (covered) return;
    const html = document.documentElement;
    const before = html.style.overflow;
    const behind = [document.getElementById("main"), document.getElementById("site-footer"), document.querySelector("header")].filter(
      (el): el is HTMLElement => el instanceof HTMLElement,
    );
    behind.forEach((el) => (el.inert = true));
    lenis?.stop();
    html.style.overflow = "hidden";
    return () => {
      behind.forEach((el) => (el.inert = false));
      lenis?.start();
      html.style.overflow = before === "hidden" ? "" : before;
    };
  }, [lenis, covered]);

  // Focus in, and back to the opener on close.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    close.current?.focus();
    return () => opener?.focus?.({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (covered) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [covered, onClose]);

  const upcoming = event.status === "upcoming";
  const transition = { duration: reduced ? 0 : DURATION.fast, ease: BEZIER.expo };

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-detail-title"
      inert={covered}
      data-lenis-prevent
      initial={reduced ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reduced ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0 }}
      transition={transition}
      className="fixed inset-0 z-80 overflow-y-auto overscroll-contain bg-bg"
    >
      <button
        ref={close}
        type="button"
        onClick={onClose}
        data-cursor="link"
        aria-label="Close"
        className="fixed top-4 right-4 z-10 grid size-12 place-items-center rounded-full bg-bg/45 text-text ring-1 ring-text/20 backdrop-blur-md transition-[background-color,scale] duration-[350ms] ease-power3 hover:scale-105 hover:bg-bg/70 md:top-6 md:right-6"
      >
        <EventIcon name="close" />
      </button>

      <motion.div
        initial={reduced ? false : { y: 40 }}
        animate={{ y: 0 }}
        transition={{ ...transition, duration: reduced ? 0 : DURATION.base }}
      >
        <div className="relative h-[min(56svh,56.25vw)] min-h-64 overflow-hidden">
          {event.banner_url && (
            <Image src={event.banner_url} alt={`${event.title} banner`} fill sizes="100vw" className="object-cover" style={{ objectPosition: `${event.banner_focal_x ?? 50}% 30%` }} />
          )}
          <div aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-bg via-bg/30 to-transparent" />
        </div>

        <div className="shell relative -mt-[clamp(4rem,12vw,9rem)] pb-[clamp(4rem,12svh,8rem)]">
          <MonoLabel as="p" tone="text">
            Event / {event.type}
          </MonoLabel>
          <h2 id="event-detail-title" className="mt-4 max-w-[16ch] text-[length:clamp(2.5rem,7vw,6rem)] leading-[0.95] font-bold tracking-[-0.04em]">
            {event.title}
          </h2>

          <dl className="mt-10 grid gap-6 border-y border-line py-8 text-[15px] sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="mono-label text-muted">Date</dt>
              <dd className="mt-2">
                <time dateTime={event.starts_at}>{eventDate(event.starts_at)}</time>
                <span className="text-muted"> · {eventTime(event.starts_at)}</span>
              </dd>
            </div>
            <div>
              <dt className="mono-label text-muted">Venue</dt>
              <dd className="mt-2">{event.venue}</dd>
            </div>
            <div>
              <dt className="mono-label text-muted">Tags</dt>
              <dd className="mt-2">{[event.type, ...event.tags].join(" · ")}</dd>
            </div>
            <div>
              <dt className="mono-label text-muted">Status</dt>
              <dd className="mt-2 text-[13px]">
                <StatusBadge event={event} />
              </dd>
            </div>
          </dl>

          <div className="mt-10 grid gap-10 md:grid-cols-12">
            <div className="md:col-span-7">
              <p className="text-[length:clamp(1.25rem,2vw,1.6rem)] leading-snug font-semibold tracking-[-0.02em]">{event.summary}</p>
              <p className="mt-5 max-w-[60ch] text-[17px] leading-relaxed text-muted">{event.description}</p>
            </div>
            <div className="flex flex-col items-start gap-6 md:col-span-5 md:items-end">
              {upcoming && <Countdown to={event.starts_at} size="sm" />}
              <div className="flex flex-wrap gap-3">
                {upcoming && event.registration_url && (
                  <IrisButton href={event.registration_url} size="lg" arrow data-cursor="link">
                    Register
                  </IrisButton>
                )}
                {!upcoming && event.has_gallery && (
                  <PillButton href={`/gallery/${event.slug}`} variant="ghost" size="lg" arrow data-cursor="link">
                    Open the journal
                  </PillButton>
                )}
              </div>
            </div>
          </div>

          {event.photos.length > 0 && (
            <section aria-labelledby="event-detail-photos" className="mt-16">
              <MonoLabel as="h3" id="event-detail-photos" tone="text">
                Photos / {event.photos.length}
              </MonoLabel>
              <ul className="mt-6 columns-2 gap-3 md:columns-3 lg:columns-4">
                {event.photos.map((p, i) => (
                  <li key={p.id} className="mb-3 break-inside-avoid">
                    <button
                      type="button"
                      onClick={() => onPhoto(i)}
                      data-cursor="view"
                      aria-label={`Open photo ${i + 1}: ${p.alt}`}
                      className="group/photo block w-full overflow-hidden rounded-image bg-bg-2"
                    >
                      <Image
                        src={p.url}
                        alt=""
                        width={p.width ?? 1200}
                        height={p.height ?? 800}
                        sizes="(min-width: 1024px) 24vw, (min-width: 768px) 32vw, 48vw"
                        className="h-auto w-full transition-transform duration-500 ease-power3 group-hover/photo:scale-[1.03]"
                      />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
