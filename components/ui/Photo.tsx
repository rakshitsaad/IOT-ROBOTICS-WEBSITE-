import Image from "next/image";
import { cn } from "@/lib/cn";

/**
 * Every photo on the site goes through here, so they share one treatment: a fixed aspect ratio (no layout shift), the
 * 6px image radius, a charcoal placeholder while loading, and an optional slow zoom when its link is hovered
 * (`group/photo` on the link). Without a file it shows a restrained placeholder instead of inventing a picture.
 */
export function Photo({
  src,
  alt,
  sizes,
  ratio = "aspect-[4/3]",
  priority = false,
  position,
  zoom = false,
  className,
  imgClassName,
}: {
  src: string | null | undefined;
  alt: string;
  sizes: string;
  /** A Tailwind aspect class, e.g. "aspect-[16/9]". Pass "" when the parent sizes the frame. */
  ratio?: string;
  priority?: boolean;
  /** CSS object-position, e.g. a member's focal point. */
  position?: string;
  /** Scale 1.03 when an ancestor with `group/photo` is hovered. */
  zoom?: boolean;
  className?: string;
  imgClassName?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden rounded-image bg-bg-2", ratio, className)}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          preload={priority}
          style={position ? { objectPosition: position } : undefined}
          className={cn(
            "object-cover",
            zoom && "transition-transform duration-700 ease-power3 group-hover/photo:scale-[1.03]",
            imgClassName,
          )}
        />
      ) : (
        <PhotoPlaceholder label={alt} />
      )}
    </div>
  );
}

/** A slot without a photo yet: charcoal with a faint frame mark. Decorative; the label is for screen readers. */
export function PhotoPlaceholder({ label, className }: { label: string; className?: string }) {
  return (
    <div role="img" aria-label={label} className={cn("absolute inset-0 grid place-items-center bg-bg-2", className)}>
      <svg aria-hidden="true" viewBox="0 0 48 48" className="size-10 text-line" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="6" y="10" width="36" height="28" rx="3" />
        <circle cx="18" cy="21" r="3.5" />
        <path d="M6 34l11-9 8 6 6-5 11 9" />
      </svg>
    </div>
  );
}
