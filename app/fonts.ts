import { JetBrains_Mono, Sora } from "next/font/google";

/**
 * Two families, everywhere (DESIGN.md §3):
 * - Sora: all display and body text. Body 400, headings 600–700.
 * - JetBrains Mono: small uppercase technical labels, dates and numbers in metadata.
 * Both are variable fonts, so one file covers the weight range.
 */

export const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
});

export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const fontVariables = [sora.variable, jetbrainsMono.variable].join(" ");
