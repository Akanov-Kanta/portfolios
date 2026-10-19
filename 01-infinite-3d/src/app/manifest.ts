import type { MetadataRoute } from "next";
import { site } from "@/content/site";
import { PALETTE } from "@/components/world/theme";

/**
 * Web app manifest (Next serves it statically at /manifest.webmanifest and adds the <link rel="manifest">).
 * id "/" is the app's permanent identity: never change it or start_url's meaning (a second app would appear
 * for existing installs). start_url has no query because the SW keys the offline copy of "/" without search.
 * Deliberately absent: shortcuts (deferred), orientation (landscape is designed; WCAG 1.3.4),
 * display_override and launch_handler. Icons and screenshots come from scripts/pwa-assets.mjs.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: site.name,
    short_name: "Akanov",
    description: site.manifesto,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: PALETTE.void,
    theme_color: PALETTE.void,
    lang: "en",
    dir: "ltr",
    icons: [
      { src: "/pwa/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/pwa/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    screenshots: [
      { src: "/pwa/screen-narrow-hero.jpg", sizes: "1170x2532", type: "image/jpeg", form_factor: "narrow", label: "The night developer room, with the name drawn in particles" },
      { src: "/pwa/screen-narrow-projects.jpg", sizes: "1170x2532", type: "image/jpeg", form_factor: "narrow", label: "Projects floating as devices in the void" },
      { src: "/pwa/screen-wide-hero.jpg", sizes: "1920x1080", type: "image/jpeg", form_factor: "wide", label: "The night developer room on a desktop" },
    ],
  };
}
