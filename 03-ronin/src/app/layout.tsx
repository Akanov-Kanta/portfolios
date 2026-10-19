import type { Metadata, Viewport } from "next";
import { Barlow_Condensed } from "next/font/google";
import localFont from "next/font/local";
import { site } from "@/content";
import "./globals.css";
import "./film.css";

// Japanese serif for display + body, subset to the glyphs the site uses (scripts/subset-fonts.py; OFL, src/fonts/OFL.txt)
const mincho = localFont({
  variable: "--font-mincho",
  src: [
    { path: "../fonts/shippori-mincho-400.woff2", weight: "400" },
    { path: "../fonts/shippori-mincho-600.woff2", weight: "600" },
    { path: "../fonts/shippori-mincho-800.woff2", weight: "800" },
  ],
  display: "swap",
});

// motion allowed: pin the film stage before the first paint (Film.tsx takes over after hydration)
const filmFirst = "try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.dataset.film='on'}catch(e){}";

// narrow grotesk for labels / UI
const barlow = Barlow_Condensed({
  variable: "--font-barlow",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: `${site.name} — 浪人 · ${site.role}`,
  description: site.manifesto,
};

export const viewport: Viewport = {
  themeColor: "#0B1622",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${mincho.variable} ${barlow.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: filmFirst }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
