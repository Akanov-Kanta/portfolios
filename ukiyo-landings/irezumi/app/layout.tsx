import type { Metadata, Viewport } from "next";
import { Archivo_Narrow, Barlow_Condensed, Shippori_Mincho } from "next/font/google";
import "./globals.css";

const shippori = Shippori_Mincho({
  variable: "--font-shippori",
  weight: ["400", "600", "800"],
  subsets: ["latin"],
});

const barlow = Barlow_Condensed({
  variable: "--font-barlow",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const archivo = Archivo_Narrow({
  variable: "--font-archivo",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "IREZUMI 入れ墨 — Japanese tattoo studio, Tokyo",
  description:
    "Traditional Japanese tattooing — tebori and machine. Dragons, koi, tigers, hannya and peonies, drawn by hand in Shimokitazawa, Tokyo.",
};

export const viewport: Viewport = {
  themeColor: "#9E1B1B",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning className={`${shippori.variable} ${barlow.variable} ${archivo.variable}`}>
      <body className="bg-ink text-rice antialiased">
        {/* runs before first paint: arm the intro curtain unless the visitor prefers reduced motion */}
        <script
          dangerouslySetInnerHTML={{
            __html: "try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.classList.add('intro')}catch(e){}",
          }}
        />
        {/* shared SVG filters (referenced by id from many components) */}
        <svg width="0" height="0" aria-hidden="true" className="absolute">
          <defs>
            <filter id="rough" x="-10%" y="-10%" width="120%" height="120%">
              <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed="3" result="t" />
              <feDisplacementMap in="SourceGraphic" in2="t" scale="5" xChannelSelector="R" yChannelSelector="G" />
            </filter>
            <filter id="brush" x="-5%" y="-5%" width="110%" height="110%">
              <feTurbulence type="fractalNoise" baseFrequency="0.035 0.12" numOctaves="2" seed="11" result="t" />
              <feDisplacementMap in="SourceGraphic" in2="t" scale="9" xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </defs>
        </svg>
        {children}
        <div className="grain" aria-hidden="true" />
      </body>
    </html>
  );
}
