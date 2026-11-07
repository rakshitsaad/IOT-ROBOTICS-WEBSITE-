/** Primary site navigation, used by the menu overlay and the footer. */
export interface NavItem {
  label: string;
  href: string;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Members", href: "/members" },
  { label: "Projects", href: "/projects" },
  { label: "Events", href: "/events" },
  { label: "Achievements", href: "/achievements" },
  { label: "Gallery", href: "/gallery" },
  { label: "Join", href: "/join" },
  { label: "Contact", href: "/contact" },
];
