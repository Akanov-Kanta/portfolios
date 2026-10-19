import { Fira_Sans_Extra_Condensed, IBM_Plex_Mono, Inter_Tight, M_PLUS_Rounded_1c, Quicksand } from "next/font/google";

/**
 * CASE FILE type system (reference/top/DIRECTION.md §3A). Every family covers Kazakh Cyrillic except
 * Quicksand, which falls back glyph-by-glyph to M PLUS Rounded 1c (the caption stack in tokens.css).
 *
 *   display   Fira Sans Extra Condensed 800, uppercase, up to ~17vw (names, the email)
 *   mono      IBM Plex Mono 400/500, 11 px uppercase metadata
 *   caption   Quicksand 500, 15 px caps: only the typed captions (the edit's voice)
 *   body      Inter Tight, 16/1.5: project copy in the file view
 */
export const displayFont = Fira_Sans_Extra_Condensed({
  weight: ["800"],
  subsets: ["latin", "cyrillic"],
  variable: "--font-display",
  display: "block", // the name is the first thing on screen: never swap it mid-cut
});

export const monoFont = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin", "cyrillic"],
  variable: "--font-mono",
  display: "swap",
});

export const captionFont = Quicksand({
  subsets: ["latin"],
  variable: "--font-caption",
  display: "block", // never re-flow a caption mid-type
});

/** Cyrillic fallback under Quicksand (Quicksand has none). Not preloaded: only fetched if a caption needs it. */
export const captionCyrFont = M_PLUS_Rounded_1c({
  weight: ["500"],
  subsets: ["cyrillic"],
  variable: "--font-caption-cyr",
  display: "swap",
  preload: false,
});

export const bodyFont = Inter_Tight({
  subsets: ["latin", "cyrillic"],
  variable: "--font-body",
  display: "swap",
});

export const fontVariables = [displayFont, monoFont, captionFont, captionCyrFont, bodyFont].map((f) => f.variable).join(" ");
