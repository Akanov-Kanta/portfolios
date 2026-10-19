import type { Metadata, Viewport } from "next";
import {
  Barlow_Condensed,
  Barlow_Semi_Condensed,
  Shippori_Mincho,
} from "next/font/google";
import "./globals.css";

const mincho = Shippori_Mincho({
  variable: "--font-mincho",
  weight: ["500", "700", "800"],
  subsets: ["latin"],
  display: "swap",
});

const condensed = Barlow_Condensed({
  variable: "--font-condensed",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  display: "swap",
});

const body = Barlow_Semi_Condensed({
  variable: "--font-body",
  weight: ["400", "500"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "KURO — Sake brewed in darkness",
  description:
    "KURO, The Night Series. Three junmai sakes from a Fushimi kura founded in 1789 — Tsuki, Hi and Kin.",
};

export const viewport: Viewport = {
  themeColor: "#0B1622",
};

/*
 * Runs synchronously before first paint:
 *  - restores the per-session age confirmation so the gate never flashes for returning visitors
 *  - opts into scroll/entrance motion only when the user hasn't asked for reduced motion
 */
const bootScript = `(function(){var d=document.documentElement;try{if(sessionStorage.getItem('kuro:age')==='ok')d.setAttribute('data-age','ok')}catch(e){}if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)d.classList.add('motion')})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${mincho.variable} ${condensed.variable} ${body.variable} antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body>
        {children}
        <div className="grain" aria-hidden />
      </body>
    </html>
  );
}
