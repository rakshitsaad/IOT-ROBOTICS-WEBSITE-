import { Anton, Bodoni_Moda, Caveat, JetBrains_Mono, Sora } from "next/font/google";

/**
 * Font roles (see DESIGN.md → Typography):
 * - Sora: display + body. Use weights 500–800 only (body = 500).
 * - JetBrains Mono: small uppercase technical labels. Weights 400–500.
 * - Bodoni Moda: Senior Core section ONLY. 400–700 + italic.
 * - Caveat: handwritten gallery captions ONLY.
 * - Anton: the /achievements slide titles ONLY (condensed uppercase display). One weight (400).
 *
 * All four are variable fonts, so one file covers the weight range; the
 * allowed weights are a design rule, not a loading restriction.
 * Bodoni Moda, Caveat and Anton are not preloaded: the browser only downloads them
 * on pages that actually render text in those families.
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

export const bodoniModa = Bodoni_Moda({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  variable: "--font-bodoni-moda",
  display: "swap",
  preload: false,
});

export const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
  display: "swap",
  preload: false,
});

export const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-anton",
  display: "swap",
  preload: false,
});

export const fontVariables = [
  sora.variable,
  jetbrainsMono.variable,
  bodoniModa.variable,
  caveat.variable,
  anton.variable,
].join(" ");
