"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

// Register once, on the client. Every client module imports GSAP from here so plugins are always present.
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);
}

/** Media queries shared by every gsap.matchMedia() call. */
export const MQ = {
  motion: "(prefers-reduced-motion: no-preference)",
  reduce: "(prefers-reduced-motion: reduce)",
  finePointer: "(hover: hover) and (pointer: fine)",
} as const;

export { gsap, ScrollTrigger, SplitText, useGSAP };
