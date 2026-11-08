import Image from "next/image";
import { cn } from "@/lib/cn";
import type { JoinCharacter } from "@/lib/join";

/**
 * A team's character as a round avatar, cropped to the face (DESIGN.md §21): the image is scaled so the face fills
 * about `fill` of the circle and moved so it is centred. Size it with `className`; decorative.
 */
export function CharacterAvatar({
  character,
  className,
  imgClassName,
  fill = 0.78,
  sizes = "96px",
}: {
  character: JoinCharacter;
  className?: string;
  imgClassName?: string;
  fill?: number;
  sizes?: string;
}) {
  const [x0, y0, x1, y1] = character.face;
  const k = fill / Math.max(x1 - x0, y1 - y0);
  const fx = (x0 + x1) / 2;
  const fy = (y0 + y1) / 2 + 0.02;
  return (
    <span aria-hidden="true" className={cn("relative inline-block shrink-0 overflow-hidden rounded-full bg-bg-2", className)}>
      <Image
        src={character.image}
        alt=""
        width={1254}
        height={1254}
        sizes={sizes}
        className={cn("absolute max-w-none", imgClassName)}
        style={{ width: `${k * 100}%`, height: "auto", left: `${(0.5 - fx * k) * 100}%`, top: `${(0.5 - fy * k) * 100}%` }}
      />
    </span>
  );
}
