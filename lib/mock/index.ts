/**
 * Typed mock data, one export per Supabase table.
 * Components should not import from here directly — go through lib/data.ts so
 * the switch to Supabase is a one-file change.
 */
export { settings } from "./settings";
export { teams } from "./teams";
export { members } from "./members";
export { projects } from "./projects";
export { events } from "./events";
export { achievements } from "./achievements";
export { galleryItems } from "./gallery";
export { milestones } from "./milestones";
