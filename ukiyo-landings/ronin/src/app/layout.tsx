import type { Metadata, Viewport } from "next";
import { Shippori_Mincho_B1, Barlow_Condensed } from "next/font/google";
import "./globals.css";

const mincho = Shippori_Mincho_B1({
  variable: "--font-mincho",
  weight: ["500", "800"],
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const grotesk = Barlow_Condensed({
  variable: "--font-grotesk",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "RŌNIN — One blade. No master.",
  description:
    "RŌNIN is a hand-inked samurai action game from Kagerō Works. One-strike duels under a red moon. Wishlist now.",
};

export const viewport: Viewport = {
  themeColor: "#9e1b1b",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${mincho.variable} ${grotesk.variable}`}>
      <body>
        {children}
        <div className="grain" aria-hidden="true" />
      </body>
    </html>
  );
}
