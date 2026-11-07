import { gsap } from "@/lib/gsap";
import { DURATION, EASE } from "@/lib/motion";

/**
 * Highlighter reveal for <Pill reveal>: the background grows from the left
 * (scaleX 0 → 1) behind the word, and the word turns from light to its
 * on-colour text exactly where the background has reached.
 *
 * Returns a timeline that sets the hidden state immediately; add it to your
 * own timeline or let it play. Skip it under reduced motion (the pill is
 * already rendered in its final state).
 *
 *   tl.add(pillReveal(pill, { onStart: () => ... }), 0.15);
 */
export function pillReveal(pill: Element, vars: gsap.TimelineVars = {}): gsap.core.Timeline {
  const bg = pill.querySelector("[data-pill-bg]");
  const word = pill.querySelector("[data-pill-word]");
  const ghost = pill.querySelector("[data-pill-ghost]");
  const tl = gsap.timeline(vars);
  if (!bg || !word || !ghost) return tl;

  const motion = { duration: DURATION.base, ease: EASE.expo };
  tl.fromTo(bg, { scaleX: 0 }, { scaleX: 1, ...motion }, 0)
    .fromTo(word, { clipPath: "inset(0% 100% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", ...motion }, 0)
    .fromTo(ghost, { clipPath: "inset(0% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 100%)", ...motion }, 0);
  return tl;
}
