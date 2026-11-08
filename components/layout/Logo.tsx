import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * The club's identity: the robot-face mark plus the name, with the university under it.
 * Swap the mark for the real logo file when it exists (keep the 32px box).
 */
interface LogoProps {
  name: string;
  college: string;
  className?: string;
}

export function Logo({ name, college, className }: LogoProps) {
  return (
    <Link href="/" aria-label={`${name}, ${college}: home`} className={cn("group/logo inline-flex items-center gap-3", className)}>
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span className="whitespace-nowrap text-[15px] font-semibold tracking-[-0.02em]">{name}</span>
        <span className="mt-1.5 whitespace-nowrap font-mono text-[10px] tracking-[0.12em] text-faint uppercase">{college}</span>
      </span>
    </Link>
  );
}

/** The mark: a screen with two eyes and the red "online" light. Decorative. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("relative inline-flex size-8 shrink-0 items-center justify-center gap-[5px] rounded-[8px] border border-text/20 bg-bg-2", className)}
    >
      <span className="h-[9px] w-[4px] rounded-pill bg-text transition-transform duration-300 ease-power3 group-hover/logo:scale-y-[0.3]" />
      <span className="h-[9px] w-[4px] rounded-pill bg-text transition-transform duration-300 ease-power3 group-hover/logo:scale-y-[0.3]" />
      <span className="absolute -top-[3px] -right-[3px] size-[7px] rounded-pill border-2 border-bg bg-red" />
    </span>
  );
}
