"use client";
import { useEffect } from "react";
import { pwaBoot } from "./boot";

/**
 * First child of <body>: the PWA_BOOT inline script. A client component only because PHONE_MQ lives in
 * phone.ts, a hook module that server components can't import. The script text exists only in the server
 * render: it runs once, during HTML parse, and hydration adopts the element as is (suppressHydrationWarning;
 * React never rewrites a hydrated element's inner HTML), so the string stays out of the client bundle
 * (Next folds `typeof window`). The client-side type is the documented guard against React's dev-only
 * "script tag" warning (docs: guides/preventing-flash-before-hydration).
 */
export function PwaBoot() {
  const server = typeof window === "undefined";
  return <script type={server ? "text/javascript" : "text/plain"} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: server ? pwaBoot() : "" }} />;
}

/**
 * The clean-up half of the service-worker wiring: next dev and NEXT_PUBLIC_SW=off unregister any worker a
 * production run left behind and drop its caches, on every device. A normal production build folds this
 * effect to nothing. Registration itself (phones only, THE gate, after load + idle) starts from the
 * phone-only PhoneHud chunk (phone/PhoneHud.tsx), so no route's first-load JS carries it and desktops and
 * tablets never fetch ./register. Renders nothing.
 */
export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_SW !== "off") return;
    // an explicit `in` test: the minifier dropped a plain `if (!sw) return` on the property read
    if (!("serviceWorker" in navigator) || !navigator.serviceWorker) return;
    const sw = navigator.serviceWorker;
    let live = true;
    import("./register").then(
      (m) => {
        if (live) m.unregisterOwn(sw);
      },
      () => {},
    );
    return () => {
      live = false;
    };
  }, []);
  return null;
}
