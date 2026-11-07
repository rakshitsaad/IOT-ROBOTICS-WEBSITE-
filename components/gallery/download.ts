/**
 * Downloads and sharing for the journal viewer (client only).
 */

/** A file name for a gallery item: "<event-slug>-<n>.<ext>". */
export function mediaFileName(slug: string, n: number, kind: "photo" | "video", url: string): string {
  const ext =
    /\.(mp4|webm|mov|jpe?g|png|webp|avif|gif)(?:$|\?)/i.exec(url)?.[1]?.toLowerCase() ?? (kind === "video" ? "mp4" : "jpg");
  return `${slug}-${String(n).padStart(2, "0")}.${ext}`;
}

/**
 * Saves a photo or video. A cross-origin `<a download>` is ignored by browsers,
 * so the file is fetched as a blob first: from its own host when that allows it
 * (CORS), else, for images, through the same-origin next/image optimizer at
 * full width. If both fail it opens in a new tab.
 */
export async function downloadMedia(url: string, fileName: string, kind: "photo" | "video"): Promise<void> {
  const sources = [url];
  if (kind === "photo") sources.push(`/_next/image?url=${encodeURIComponent(url)}&w=3840&q=75`);

  for (const src of sources) {
    try {
      const res = await fetch(src, { mode: "cors" });
      if (!res.ok) continue;
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = fileName;
      document.body.append(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(href), 4000);
      return;
    } catch {
      // try the next source
    }
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

/**
 * Shares a link with the system share sheet where there is one, else copies it.
 * Resolves to what happened, so the caller can say "Link copied".
 */
export async function shareLink(title: string, url: string): Promise<"shared" | "copied" | "failed"> {
  if (typeof navigator.share === "function") {
    try {
      await navigator.share({ title, url });
      return "shared";
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return "shared";
    }
  }
  return copyLink(url);
}

export async function copyLink(url: string): Promise<"copied" | "failed"> {
  try {
    await navigator.clipboard.writeText(url);
    return "copied";
  } catch {
    return "failed";
  }
}
