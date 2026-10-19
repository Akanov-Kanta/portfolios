import { Quicksand } from "next/font/google";

/**
 * The one place the UI face is chosen. Quicksand is a variable font (300–700), so 400/500 for captions and
 * 300 for the big title come from one file. To swap faces, change this import; everything else reads
 * `--font-caption` through `--font-ui` in tokens.css.
 */
export const captionFont = Quicksand({
  subsets: ["latin"],
  variable: "--font-caption",
  display: "block", // never re-flow a caption mid-type
});
