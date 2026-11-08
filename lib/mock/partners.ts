import type { Partner } from "@/lib/types";

/**
 * Placeholder partners and sponsors: made-up names with generated logos in /public/partners/. Replace them with the
 * club's real partners (light logos on transparent backgrounds), or leave the list empty to hide the row on /contact.
 */
const row = (n: number, slug: string, name: string): Partner => ({
  id: `00000000-0000-4000-8000-0000000009${String(n).padStart(2, "0")}`,
  name,
  logo_url: `/partners/${slug}.svg`,
  url: null,
  sort_order: n,
  created_at: "2026-01-10T10:00:00+05:30",
});

export const partners: Partner[] = [
  row(1, "kestrel-circuits", "Kestrel Circuits"),
  row(2, "voltaic-works", "Voltaic Works"),
  row(3, "orbit-fab", "Orbit Fab"),
  row(4, "lumen-sensorics", "Lumen Sensorics"),
  row(5, "tinkerbay", "Tinkerbay"),
];
