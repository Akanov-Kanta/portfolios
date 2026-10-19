import type { NextConfig } from "next";

/**
 * Baseline security headers. No CSP yet: the Draco WASM decoder, its blob: worker and the data:
 * icon URLs need an allow-list that should be tested on a preview deploy first.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  // the page uses none of these (clipboard-write stays allowed for "copy email")
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
];

/**
 * public/sw.js: never cached by the browser (a cached worker script would pin old SW logic; it is also
 * registered with updateViaCache "none"). Its CSP only governs the worker's own global (same-origin fetches).
 */
const serviceWorkerHeaders = [
  { key: "Content-Type", value: "application/javascript; charset=utf-8" },
  { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
  { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // always defined, so the service-worker kill switch is inlined and folds away when unset (an undefined
  // NEXT_PUBLIC_* stays a runtime lookup: its dev/off clean-up code would ship in every first-load bundle)
  env: { NEXT_PUBLIC_SW: process.env.NEXT_PUBLIC_SW ?? "" },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/sw.js", headers: serviceWorkerHeaders },
    ];
  },
};

export default nextConfig;
