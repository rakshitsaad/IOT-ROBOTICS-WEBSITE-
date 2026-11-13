import { Archivo, IBM_Plex_Mono, Instrument_Serif, Manrope } from "next/font/google";

/**
 * Font roles (see DESIGN.md → Typography). Four families, nothing else:
 * - Archivo: headings and display type. Weights 600–700. Its width axis is loaded too, for the
 *   condensed /achievements slide titles.
 * - Manrope: body and UI text. Weights 400–500.
 * - IBM Plex Mono: small technical labels, dates, counters. Weight 400.
 * - Instrument Serif: editorial accents (Senior Core, an italic word in a heading, gallery captions).
 *   One weight (400), roman and italic.
 *
 * Archivo and Manrope are variable fonts, so one file covers the weight range; the allowed weights are
 * a design rule, not a loading restriction. Instrument Serif is not preloaded: the browser downloads
 * it only on pages that render text in it.
 */

export const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

export const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-plex-mono",
  display: "swap",
});

export const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "swap",
  preload: false,
});

export const fontVariables = [archivo.variable, manrope.variable, plexMono.variable, instrumentSerif.variable].join(" ");
