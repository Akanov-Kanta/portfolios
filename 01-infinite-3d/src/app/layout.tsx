import type { Metadata, Viewport } from "next";
import { preload } from "react-dom";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./phone-runtime.css";
import "./phone-hud.css";
import "./phone-stations.css";
import "./phone-pwa.css";
import { site } from "@/content/site";
import { siteUrl } from "@/content/site-url";
import { ScrollLoopProvider } from "@/components/world/scroll/ScrollLoopProvider";
import { WorldRoot } from "@/components/world/WorldRoot";
import { StationHud } from "@/components/world/hud/StationHud";
import { AnchoredLabels } from "@/components/world/hud/AnchoredLabels";
import { IntroLoader } from "@/components/world/hud/IntroLoader";
import { Cursor } from "@/components/world/hud/Cursor";
import { PwaBoot, PwaRegister } from "@/components/pwa/PwaRegister";

const display = Geist({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const mono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

/** iPhone portrait screens [css width, css height, dpr] → solid void startup images (scripts/pwa-assets.mjs) */
const SPLASH = [
  [375, 667, 2], [414, 736, 3], [375, 812, 3], [414, 896, 2], [414, 896, 3], [390, 844, 3],
  [428, 926, 3], [393, 852, 3], [430, 932, 3], [402, 874, 3], [440, 956, 3], [420, 912, 3],
] as const;

// The favicon (app/icon.svg), share card (app/opengraph-image.tsx) and apple-touch-icon (app/apple-icon.png)
// come from the metadata file conventions; all carry the '[NA]' monogram. The web app manifest is app/manifest.ts.
export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: `${site.name} - ${site.role}`,
  description: site.manifesto,
  applicationName: site.name,
  authors: [{ name: site.name }],
  openGraph: {
    title: `${site.name} - ${site.role}`,
    description: site.manifesto,
    siteName: site.name,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} - ${site.role}`,
    description: site.manifesto,
  },
  appleWebApp: {
    capable: true,
    title: "Akanov",
    // NOT black-translucent: with viewport-fit=cover, iOS 26 (WebKit bug 301108) leaves a dead band at the bottom
    statusBarStyle: "black",
    startupImage: SPLASH.map(([w, h, d]) => ({
      url: `/pwa/splash/${w * d}x${h * d}.png`,
      media: `(device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${d}) and (orientation: portrait)`,
    })),
  },
  // Next 16 emits only mobile-web-app-capable; iOS still needs this one for startup images and the status bar
  other: { "apple-mobile-web-app-capable": "yes" },
  // no tel: links out of the HUD digits (coordinates, clock)
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#0a0b10",
  colorScheme: "dark",
  // env(safe-area-inset-*) become real on phones (0 on desktop); never maximumScale / userScalable
  viewportFit: "cover",
};

/** everything but PHONE_MQ (phones mount the world later, on their own terms: mount-gate.ts) */
const NOT_PHONE = "(pointer: fine), (pointer: none), (min-width: 768px) and (min-height: 501px)";
/** the world's models and decoder, fetched from the document head while the JS arrives (desktop) */
const WORLD_PRELOADS = ["/models/kit.glb", "/models/devices.glb", "/draco/draco_wasm_wrapper.js", "/draco/draco_decoder.wasm"];

export default function RootLayout({ children }: LayoutProps<"/">) {
  // same request mode as three's FileLoader (fetch, same-origin credentials), so the loader reuses them
  for (const href of WORLD_PRELOADS) preload(href, { as: "fetch", crossOrigin: "anonymous", media: NOT_PHONE });
  return (
    // data-loading: the loading screen is up (hud/IntroLoader.tsx removes it as it lifts)
    <html lang="en" className={`${display.variable} ${mono.variable} h-full`} data-loading="">
      <body className="min-h-full">
        <noscript>
          <style>{"html[data-loading]{overflow:visible}#page-loader{display:none}"}</style>
        </noscript>
        {/* PWA_BOOT first: an inline script, so the skip link stays the first tab stop */}
        <PwaBoot />
        <a href="#content" className="skip-link marker">
          Skip to content
        </a>
        <ScrollLoopProvider>
          <WorldRoot />
          <div className="grain" aria-hidden="true" />
          <AnchoredLabels />
          <StationHud />
          {/* the skip link's target on every route (home's <main id="loop-root">, a project's <main>); no box styles */}
          <div id="content">{children}</div>
          <IntroLoader />
          <Cursor />
        </ScrollLoopProvider>
        <PwaRegister />
      </body>
    </html>
  );
}
