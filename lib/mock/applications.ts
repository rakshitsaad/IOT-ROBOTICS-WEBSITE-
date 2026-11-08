import type { Application } from "@/lib/types";

/**
 * The applications table. The mock keeps applications in server memory only (lost on restart) and doesn't store the
 * resume; with Supabase, addApplication() in lib/data.ts uploads the file to Storage and inserts a row.
 */
export const applications: Application[] = [];
