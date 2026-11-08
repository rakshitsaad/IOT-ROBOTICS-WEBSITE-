import Link from "next/link";
import type { Settings } from "@/lib/types";
import { MonoLabel } from "@/components/ui/MonoLabel";
import { LogoMark } from "./Logo";

/**
 * Site footer (DESIGN.md §6): the club and the university, the site's links in two columns, social profiles and the
 * contact details from settings, then the copyright line. Nothing here is invented: rows without data are left out.
 */
export function socialLinks(settings: Settings) {
  return [
    settings.instagram_url && { label: "Instagram", href: settings.instagram_url },
    settings.linkedin_url && { label: "LinkedIn", href: settings.linkedin_url },
    settings.github_url && { label: "GitHub", href: settings.github_url },
  ].filter((s): s is { label: string; href: string } => Boolean(s));
}

const EXPLORE = [
  { label: "About", href: "/about" },
  { label: "Team", href: "/members" },
  { label: "Projects", href: "/projects" },
  { label: "Events", href: "/events" },
];

const CLUB = [
  { label: "Achievements", href: "/achievements" },
  { label: "Gallery", href: "/gallery" },
  { label: "Join the club", href: "/join" },
  { label: "Contact", href: "/contact" },
];

export function Footer({ settings }: { settings: Settings }) {
  const socials = socialLinks(settings);

  return (
    <footer id="site-footer" className="border-t border-line bg-bg">
      <div className="shell grid gap-12 pt-16 pb-12 md:pt-20 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-4">
          <Link href="/" className="group/logo inline-flex items-center gap-3">
            <LogoMark />
            <span className="text-[17px] font-semibold tracking-[-0.02em]">{settings.club_name}</span>
          </Link>
          <p className="mt-2 text-[14px] text-faint">{settings.college_name}</p>
          <p className="mt-8 max-w-[30ch] text-[20px] leading-snug font-medium tracking-[-0.02em] text-text/90">{settings.tagline}</p>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-[1fr_1fr_1fr_1.7fr] lg:col-span-8">
          <FooterColumn title="Explore" items={EXPLORE} />
          <FooterColumn title="Club" items={CLUB} />

          {socials.length > 0 && (
            <div>
              <MonoLabel as="h2">Follow</MonoLabel>
              <ul className="mt-5 space-y-3">
                {socials.map((s) => (
                  <li key={s.label}>
                    <a href={s.href} target="_blank" rel="noopener noreferrer" className={LINK}>
                      {s.label}
                      <span aria-hidden="true" className="ml-1 text-faint">
                        ↗
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="col-span-2 sm:col-span-1">
            <MonoLabel as="h2">Contact</MonoLabel>
            <address className="mt-5 space-y-3 not-italic">
              <a href={`mailto:${settings.contact_email}`} className={`${LINK} block [overflow-wrap:anywhere]`}>
                {settings.contact_email}
              </a>
              {settings.contact_phone && (
                <a href={`tel:${settings.contact_phone.replace(/\s/g, "")}`} className={`${LINK} block`}>
                  {settings.contact_phone}
                </a>
              )}
              <p className="text-[13px] leading-relaxed text-faint">{settings.lab_address}</p>
            </address>
          </div>
        </div>
      </div>

      <div className="shell">
        <div className="flex flex-col gap-3 border-t border-line py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] text-faint">
            © 2026 {settings.club_name}, {settings.college_name}
          </p>
          <a href="#main" className="mono-label text-faint transition-colors duration-300 hover:text-text">
            Back to top ↑
          </a>
        </div>
      </div>
    </footer>
  );
}

const LINK = "text-[14px] text-muted transition-colors duration-300 hover:text-text";

function FooterColumn({ title, items }: { title: string; items: { label: string; href: string }[] }) {
  return (
    <div>
      <MonoLabel as="h2">{title}</MonoLabel>
      <ul className="mt-5 space-y-3">
        {items.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className={LINK}>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
