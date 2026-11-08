import { Photo } from "@/components/ui";
import { cn } from "@/lib/cn";
import { initials, socialLinks } from "@/lib/members";
import type { Member } from "@/lib/types";
import { SocialIcon } from "./SocialIcon";

/**
 * Pieces shared by the /members profiles (DESIGN.md §13): the portrait (always 4:5, anchored at the member's focal
 * point, or an initials placeholder), the year line and the profile links.
 */

const YEAR = ["", "1st year", "2nd year", "3rd year", "4th year"];

export function memberMeta(m: Member): string {
  return [m.branch, YEAR[m.year]].filter(Boolean).join(" · ");
}

export function Portrait({ member, sizes, className }: { member: Member; sizes: string; className?: string }) {
  if (!member.photo_url) {
    return (
      <div
        role="img"
        aria-label={`${member.full_name} (no photo yet)`}
        className={cn("grid aspect-[4/5] place-items-center rounded-image border border-line bg-bg-2", className)}
      >
        <span aria-hidden="true" className="text-[clamp(1.5rem,3vw,2.25rem)] font-semibold tracking-[-0.02em] text-faint">
          {initials(member.full_name)}
        </span>
      </div>
    );
  }
  return (
    <Photo
      src={member.photo_url}
      alt={`Portrait of ${member.full_name}`}
      sizes={sizes}
      ratio="aspect-[4/5]"
      position={member.focal_point}
      zoom
      className={className}
    />
  );
}

export function MemberSocials({ member, className }: { member: Member; className?: string }) {
  const links = socialLinks(member);
  if (links.length === 0) return null;
  return (
    <ul className={cn("flex gap-1.5", className)}>
      {links.map((s) => (
        <li key={s.network}>
          <a
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${member.full_name} on ${s.label}`}
            title={s.label}
            className="grid size-8 place-items-center rounded-control border border-line text-muted transition-colors duration-300 hover:border-text/40 hover:text-text"
          >
            <SocialIcon network={s.network} className="size-[15px]" />
          </a>
        </li>
      ))}
    </ul>
  );
}
