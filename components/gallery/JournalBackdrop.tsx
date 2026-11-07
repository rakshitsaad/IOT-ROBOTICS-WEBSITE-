"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { BEZIER, DURATION } from "@/lib/motion";

/**
 * Behind everything in the viewer: the centre page's image, blurred 80px at
 * 25% opacity, so the page takes on the event's colours (DESIGN.md §14). It
 * crossfades when the page changes. The image is fetched tiny (it is blurred
 * anyway) and the layer never takes pointer events. Instant under reduced motion.
 */
export function JournalBackdrop({ src, reduced }: { src: string | null; reduced: boolean }) {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-[5] overflow-hidden">
      <AnimatePresence initial={false}>
        {src && (
          <motion.div
            key={src}
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 0.25 }}
            exit={{ opacity: 0, transition: { duration: reduced ? 0 : DURATION.base, ease: BEZIER.out } }}
            transition={{ duration: reduced ? 0 : DURATION.base, ease: BEZIER.out }}
            className="absolute -inset-[10%] blur-[80px]"
          >
            {/* Always on screen and only 96px, so it loads at once (it is the largest paint on a phone-sized fan). */}
            <Image src={src} alt="" fill sizes="96px" loading="eager" className="object-cover" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
