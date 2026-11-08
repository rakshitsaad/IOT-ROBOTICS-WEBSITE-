import type { ContactMessage } from "@/lib/types";

/**
 * The contact_messages table. The mock keeps messages in server memory only (they are lost on restart); with Supabase,
 * addContactMessage() in lib/data.ts inserts a row instead.
 */
export const contactMessages: ContactMessage[] = [];
