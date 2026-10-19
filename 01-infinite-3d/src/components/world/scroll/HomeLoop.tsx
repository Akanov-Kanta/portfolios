"use client";
import { useLayoutEffect } from "react";
import { useAutoCenter } from "./useAutoCenter";
import { returnSlot } from "./return-slot";

/** Home-only behaviours that need a client component. */
export function HomeLoop() {
  useAutoCenter();
  // Phones: Back from a project page lands on its stop (restore.ts, filled in by the phone chunk; a
  // layout effect, so it runs before WorldRoot's route effect). The rest of the phone home wiring
  // (touch-wrap settle, whole-pixel clone, contact stage) lives in the lazy PhoneHud tree.
  useLayoutEffect(() => {
    returnSlot.run?.();
  }, []);
  return null;
}
