"use client";
import { useEffect, useRef } from "react";
import { frame, useWorld, worldStore } from "../state/world-store";
import { fx } from "../theme";
import { addTick } from "../ticker";

const STATIC = "// SYS OK · STATIC";

/**
 * Decorative telemetry line (aria-hidden): rolling fps, tier, adaptive level, scroll velocity.
 * Written straight to textContent at 4 Hz from its own +25 ticker; frozen in static mode.
 */
export function StatusLine({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const frozen = useWorld((s) => s.tier === "static" || s.loopMode === "static");

  useEffect(() => {
    if (frozen) {
      if (ref.current) ref.current.textContent = STATIC;
      return;
    }
    let frames = 0;
    let since = 0;
    let fps = 60;
    return addTick((time) => {
      frames++;
      if (!since) since = time;
      const dt = time - since;
      if (dt < 250) return;
      fps = fps * 0.5 + ((frames * 1000) / dt) * 0.5;
      frames = 0;
      since = time;
      const s = worldStore.getState();
      if (ref.current)
        ref.current.textContent = `// SYS OK · FPS ${Math.round(fps)} · TIER ${s.tier.toUpperCase()} · LVL ${fx.featureLevel} · VEL ${frame.vNorm.toFixed(2)}`;
    }, 25);
  }, [frozen]);

  return (
    <p ref={ref} aria-hidden="true" className={`label marker-muted whitespace-nowrap ${className}`} suppressHydrationWarning>
      {STATIC}
    </p>
  );
}
