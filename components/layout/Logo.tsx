import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * Club logo: a robot-face mark with an --iris bezel, plus the club name.
 * Short name below `sm`, full name from `sm` up.
 * Swap the mark for the real logo file when it exists (keep the 32px box).
 */
interface LogoProps {
  name: string;
  shortName: string;
  className?: string;
}

export function Logo({ name, shortName, className }: LogoProps) {
  return (
    <Link
      href="/"
      aria-label={`${name}, home`}
      data-cursor="link"
      className={cn("group/logo inline-flex items-center gap-2.5", className)}
    >
      <LogoMark />
      <span className="whitespace-nowrap text-[15px] font-display font-semibold leading-none tracking-[-0.01em] md:text-base">
        <span className="sm:hidden">{shortName}</span>
        <span className="hidden sm:inline">{name}</span>
      </span>
    </Link>
  );
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("relative inline-flex size-8 shrink-0 rounded-[10px] bg-iris p-[1.5px]", className)}
    >
      <span className="flex size-full items-center justify-center gap-[5px] rounded-[8.5px] bg-bg">
        <span className="size-[5px] rounded-full bg-text transition-transform duration-[350ms] ease-power3 group-hover/logo:scale-y-[0.3]" />
        <span className="size-[5px] rounded-full bg-text transition-transform duration-[350ms] ease-power3 group-hover/logo:scale-y-[0.3]" />
      </span>
    </span>
  );
}
