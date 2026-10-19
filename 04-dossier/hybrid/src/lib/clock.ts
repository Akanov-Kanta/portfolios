"use client";

import { useSyncExternalStore } from "react";
import { site } from "@/content/site";

/** Local time in Astana, "21:43:07", ticking once a second (one shared interval). SSR: "--:--:--". */
const fmt =
  typeof Intl !== "undefined"
    ? new Intl.DateTimeFormat("en-GB", { timeZone: site.location.tz, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })
    : null;
let now = "";
let timer: number | undefined;
const subs = new Set<() => void>();
const read = () => (fmt ? fmt.format(new Date()) : "");

function subscribe(fn: () => void) {
  subs.add(fn);
  if (timer === undefined) {
    now = read();
    timer = window.setInterval(() => {
      now = read();
      subs.forEach((s) => s());
    }, 1000);
  }
  return () => {
    subs.delete(fn);
    if (!subs.size) {
      window.clearInterval(timer);
      timer = undefined;
    }
  };
}

export function useClock() {
  return useSyncExternalStore(
    subscribe,
    () => now || (now = read()),
    () => "--:--:--",
  );
}
