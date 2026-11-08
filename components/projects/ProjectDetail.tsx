"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { projectImages, type ProjectWithTeam } from "@/lib/projects";
import { useUIStore } from "@/lib/store";
import type { ProjectImage } from "@/lib/types";
import { ProjectInfo } from "./parts";

/**
 * /projects/[slug] for phones and reduced motion (DESIGN.md §16): the info
 * panel, then every photo stacked (two columns from md). A photo opens the
 * full-screen viewer, which swipes between photos (native scroll-snap).
 * md+ with motion shows the stage's gallery strip instead.
 */
export function ProjectDetail({ project }: { project: ProjectWithTeam }) {
  const images = projectImages(project);
  const [viewer, setViewer] = useState<number | null>(null);

  return (
    <article className="shell pt-header pb-16">
      <div className="pt-6">
        <Link
          href="/projects"
          className="mono-label inline-flex items-center gap-2 text-text underline-offset-4 hover:underline"
        >
          <span aria-hidden="true">←</span> Back to projects
        </Link>
      </div>
      <ProjectInfo project={project} headingAs="h1" className="mt-5 md:max-w-xl" />
      <ul aria-label={`${project.title}: photos`} className="mt-6 flex flex-col gap-3 md:grid md:grid-cols-2 md:gap-4">
        {images.map((img, i) => (
          <li key={`${i}-${img.url}`}>
            <button
              type="button"
              onClick={() => setViewer(i)}
              data-cursor="view"
              aria-label={`View photo ${i + 1} of ${images.length}: ${img.alt}`}
              className="relative block w-full overflow-hidden rounded-image bg-bg-2"
              style={{ aspectRatio: `${img.width} / ${img.height}` }}
            >
              {/* The first photo is the page's largest image on phones, so it loads at once. */}
              <Image
                src={img.url}
                alt=""
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                loading={i === 0 ? "eager" : undefined}
                className="object-cover"
              />
            </button>
          </li>
        ))}
      </ul>
      {viewer !== null && (
        <PhotoViewer images={images} index={viewer} title={project.title} onClose={() => setViewer(null)} />
      )}
    </article>
  );
}

/** Only mounted after a tap, so `document` exists. */
function PhotoViewer(props: { images: ProjectImage[]; index: number; title: string; onClose(): void }) {
  return createPortal(<ViewerPanel {...props} />, document.body);
}

function ViewerPanel({
  images,
  index,
  title,
  onClose,
}: {
  images: ProjectImage[];
  index: number;
  title: string;
  onClose(): void;
}) {
  const lenis = useUIStore((s) => s.lenis);
  const reduced = useReducedMotion();
  const scroller = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const [current, setCurrent] = useState(index);
  const count = images.length;

  // Open on the tapped photo.
  useLayoutEffect(() => {
    const el = scroller.current;
    if (el) el.scrollLeft = index * el.clientWidth;
    // Only on open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The page behind: inert, no scroll; focus in, and back out on close.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const html = document.documentElement;
    const overflow = html.style.overflow;
    const behind = [document.getElementById("main"), document.getElementById("site-footer"), document.querySelector("header")].filter(
      (el): el is HTMLElement => el instanceof HTMLElement,
    );
    behind.forEach((el) => (el.inert = true));
    lenis?.stop();
    html.style.overflow = "hidden";
    closeButton.current?.focus();
    return () => {
      behind.forEach((el) => (el.inert = false));
      lenis?.start();
      html.style.overflow = overflow;
      opener?.focus?.({ preventScroll: true });
    };
  }, [lenis]);

  const go = (i: number) => {
    const el = scroller.current;
    if (!el) return;
    const next = (i + count) % count;
    el.scrollTo({ left: next * el.clientWidth, behavior: reduced ? "auto" : "smooth" });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") go(current - 1);
      else if (e.key === "ArrowRight") go(current + 1);
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div role="dialog" aria-modal="true" aria-label={`${title}: photos`} className="fixed inset-0 z-[90] bg-bg">
      <div
        ref={scroller}
        data-lenis-prevent
        onScroll={(e) => {
          const el = e.currentTarget;
          setCurrent(Math.round(el.scrollLeft / Math.max(el.clientWidth, 1)));
        }}
        className="flex h-full snap-x snap-mandatory overflow-x-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {images.map((img, i) => (
          <div key={`${i}-${img.url}`} className="relative h-full w-full shrink-0 snap-center snap-always">
            <Image
              src={img.url}
              alt={img.alt}
              fill
              sizes="100vw"
              className="object-contain px-4 py-20"
            />
          </div>
        ))}
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-4">
        <p className="mono-label text-muted" aria-live="polite">
          <span className="text-text">{current + 1}</span> / {count}
          <span className="sr-only">: {images[current]?.alt}</span>
        </p>
        <button
          ref={closeButton}
          type="button"
          onClick={onClose}
          className="mono-label pointer-events-auto rounded-pill border border-line px-4 py-2 text-text"
        >
          Close image
        </button>
      </div>

      {count > 1 && (
        <div className="absolute inset-x-0 bottom-0 flex justify-between p-4">
          <button
            type="button"
            onClick={() => go(current - 1)}
            aria-label="Previous photo"
            className="grid size-12 place-items-center rounded-full border border-line bg-bg/60 text-lg text-text"
          >
            <span aria-hidden="true">←</span>
          </button>
          <button
            type="button"
            onClick={() => go(current + 1)}
            aria-label="Next photo"
            className="grid size-12 place-items-center rounded-full border border-line bg-bg/60 text-lg text-text"
          >
            <span aria-hidden="true">→</span>
          </button>
        </div>
      )}
    </div>
  );
}
