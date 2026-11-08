/** Site navigation (DESIGN.md §6). */
export interface NavItem {
  label: string;
  href: string;
  /** Hidden from the desktop bar below this breakpoint (it stays in the menu and the footer). */
  from?: "xl";
}

/** The desktop bar, left to right. "Team" is the /members page. */
export const NAV_PRIMARY: NavItem[] = [
  { label: "About", href: "/about" },
  { label: "Team", href: "/members" },
  { label: "Projects", href: "/projects" },
  { label: "Events", href: "/events" },
  { label: "Achievements", href: "/achievements" },
  { label: "Gallery", href: "/gallery" },
  { label: "Contact", href: "/contact", from: "xl" },
];

/** Everything, for the phone menu. */
export const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Team", href: "/members" },
  { label: "Projects", href: "/projects" },
  { label: "Events", href: "/events" },
  { label: "Achievements", href: "/achievements" },
  { label: "Gallery", href: "/gallery" },
  { label: "Join", href: "/join" },
  { label: "Contact", href: "/contact" },
];

/** Is `href` the current section? "/projects" stays active on "/projects/swarmbots". */
export function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
