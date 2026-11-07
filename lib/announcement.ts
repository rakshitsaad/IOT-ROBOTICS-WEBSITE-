/**
 * Shared by the root layout (server, inline no-flash script) and the
 * AnnouncementBar (client, dismiss button). Kept out of the client module so
 * the server can read the constant's value.
 */
export const ANNOUNCEMENT_STORAGE_KEY = "iotr:announcement-dismissed";

/** Stable short key for an announcement; changes whenever its content does. */
export function announcementKey(text: string, url: string | null): string {
  const input = `${text}|${url ?? ""}`;
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(36);
}

/** Inline script: applies a stored dismissal before first paint. */
export function announcementScript(key: string): string {
  return `try{if(localStorage.getItem(${JSON.stringify(ANNOUNCEMENT_STORAGE_KEY)})===${JSON.stringify(key)})document.documentElement.dataset.ann="off"}catch(e){}`;
}
