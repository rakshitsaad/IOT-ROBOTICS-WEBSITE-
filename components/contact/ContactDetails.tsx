"use client";

import { useEffect, useRef, useState } from "react";
import { LogoMark } from "@/components/layout/Logo";
import { SocialIcon, type SocialNetwork } from "@/components/members/SocialIcon";
import { cn } from "@/lib/cn";
import { CONTACT_MOTION, mapOpenUrl } from "@/lib/contact";
import { ContactIcon, type ContactIconName } from "./icons";

/**
 * The panel's sidebar (DESIGN.md §20): the club's mark and name, then a row per way to reach us (email, phone, lab
 * address, Instagram, LinkedIn, GitHub), each with a copy button that shows a "Copied" tick for 1.5s.
 */

export interface ContactDetailsProps {
  clubName: string;
  collegeName: string;
  email: string;
  phone: string | null;
  address: string;
  mapQuery: string;
  instagram: string | null;
  linkedin: string | null;
  github: string | null;
}

interface Row {
  id: string;
  label: string;
  /** Shown. */
  text: string;
  /** Copied. */
  value: string;
  href: string;
  icon: ContactIconName | SocialNetwork;
}

/** "https://www.instagram.com/iotr/" → "instagram.com/iotr". */
const pretty = (url: string) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

export function ContactDetails(p: ContactDetailsProps) {
  const social = (id: SocialNetwork, label: string, url: string | null): Row | null =>
    url ? { id, label, text: pretty(url), value: url, href: url, icon: id } : null;
  const rows = [
    { id: "email", label: "Email", text: p.email, value: p.email, href: `mailto:${p.email}`, icon: "mail" },
    p.phone ? { id: "phone", label: "Phone", text: p.phone, value: p.phone, href: `tel:${p.phone.replace(/[^\d+]/g, "")}`, icon: "phone" } : null,
    { id: "address", label: "Lab address", text: p.address, value: p.address, href: mapOpenUrl(p.mapQuery), icon: "pin" },
    social("instagram", "Instagram", p.instagram),
    social("linkedin", "LinkedIn", p.linkedin),
    social("github", "GitHub", p.github),
  ].filter((r): r is Row => r !== null);

  return (
    <div>
      <div className="flex items-center gap-3">
        <LogoMark />
        <div className="min-w-0">
          <p className="truncate text-[15px] leading-tight font-bold tracking-[-0.02em]">{p.clubName}</p>
          <p className="mt-0.5 truncate text-[12px] text-muted">{p.collegeName}</p>
        </div>
      </div>
      <ul className="mt-6">
        {rows.map((r) => (
          <DetailRow key={r.id} row={r} />
        ))}
      </ul>
    </div>
  );
}

function DetailRow({ row }: { row: Row }) {
  const external = row.href.startsWith("http");
  const social = row.icon === "instagram" || row.icon === "linkedin" || row.icon === "github";
  return (
    <li className="border-t border-line py-3">
      <div className="flex items-center gap-2.5">
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-text/5 text-text/80 ring-1 ring-line">
          {social ? <SocialIcon network={row.icon as SocialNetwork} className="size-3.5" /> : <ContactIcon name={row.icon as ContactIconName} className="size-3.5" />}
        </span>
        <p className="mono-label min-w-0 flex-1 truncate text-[10px] text-muted md:text-[10px]">{row.label}</p>
        <CopyButton value={row.value} label={row.label} />
      </div>
      <a
        href={row.href}
        data-cursor="link"
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className="mt-1.5 block text-[13px] leading-snug [overflow-wrap:anywhere] text-text/90 underline-offset-4 transition-colors duration-[350ms] hover:text-text hover:underline"
      >
        {row.text}
      </a>
    </li>
  );
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    const ok = await writeClipboard(value);
    if (!ok) return;
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), CONTACT_MOTION.copied);
  };

  return (
    <span className="relative shrink-0">
      <button
        type="button"
        data-cursor="link"
        onClick={copy}
        aria-label={copied ? `${label} copied` : `Copy ${label.toLowerCase()}`}
        className={cn(
          "grid size-8 place-items-center rounded-full ring-1 transition-[color,background-color,box-shadow] duration-[350ms]",
          copied ? "bg-red/15 text-text ring-red/60" : "text-muted ring-transparent hover:bg-text/5 hover:text-text hover:ring-line",
        )}
      >
        <ContactIcon name={copied ? "check" : "copy"} className="size-[15px]" />
      </button>
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute top-1/2 right-full mr-1.5 -translate-y-1/2 rounded-pill bg-text px-2 py-1 font-mono text-[10px] leading-none tracking-[0.08em] whitespace-nowrap text-bg uppercase transition-[opacity,translate] duration-[350ms] ease-power3",
          copied ? "translate-x-0 opacity-100" : "translate-x-1 opacity-0",
        )}
      >
        Copied
      </span>
      <span role="status" className="sr-only">
        {copied ? `${label} copied` : ""}
      </span>
    </span>
  );
}

/** The Clipboard API, or the old textarea trick where it isn't available (an insecure origin). */
async function writeClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;top:0;left:0;opacity:0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }
}
