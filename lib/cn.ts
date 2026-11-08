import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge taught about our theme, so a className passed to a primitive
 * overrides its defaults instead of fighting them.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      color: ["bg", "bg-2", "bg-3", "line", "text", "muted", "faint", "red", "red-deep", "maroon", "white", "black"],
      radius: ["pill", "card", "image", "control", "tag"],
      font: ["sans", "display", "mono"],
      ease: ["power3", "expo"],
    },
    classGroups: {
      // bg-iris is a background-image, so it must not cancel bg-<color>.
      "bg-image": ["bg-iris"],
      // The type-* utilities set a font size (and more), so a later text-[..] size overrides them and vice versa.
      "font-size": ["type-display", "type-h1", "type-h2", "type-h3", "type-lead", "type-body", "mono-label"],
    },
  },
});

/** Joins class names (skipping falsy values) and resolves Tailwind conflicts. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return twMerge(classes.filter(Boolean).join(" "));
}
