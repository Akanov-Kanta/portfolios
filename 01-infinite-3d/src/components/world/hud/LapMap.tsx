"use client";
import { useEffect, useRef } from "react";
import { STATIONS, STATION_LABEL, frame, useWorld, worldStore, type StationId } from "../state/world-store";
import { STATION_T } from "../path/stations";
import { scrollToStation as go } from "../scroll/lenis-ref";
import { addTick } from "../ticker";

const title = (id: StationId) => STATION_LABEL[id].charAt(0) + STATION_LABEL[id].slice(1).toLowerCase();

/**
 * Replaces the progress ring: a rail that fills with lap progress. Station ticks on the rail are real
 * buttons. The fill is moved from a +10 ticker through a ref (no React state per frame); the static
 * tier snaps it to the current station.
 */
export function LapMap() {
  const station = useWorld((s) => s.station);
  const fill = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let last = -1;
    return addTick(() => {
      const s = worldStore.getState();
      const snap = s.tier === "static" || s.loopMode === "static";
      const t = snap ? STATION_T[s.station] : ((frame.t % 1) + 1) % 1;
      if (Math.abs(t - last) < 1e-4) return;
      last = t;
      if (fill.current) fill.current.style.transform = `scaleY(${t.toFixed(4)})`;
    }, 10);
  }, []);

  return (
    <div
      className="fixed right-5 top-1/2 hidden -translate-y-1/2 flex-col items-end gap-3 sm:flex sm:right-8"
      data-boot=""
      data-label-avoid=""
      style={{ ["--boot-i" as string]: 3 }}
    >
      <span className="boot-frame" aria-hidden="true" />
      <div className="relative h-32 w-px bg-line">
        <div ref={fill} className="absolute inset-0 origin-top bg-screen" style={{ transform: "scaleY(0)" }} />
        {STATIONS.map((id) => (
          <button
            key={id}
            type="button"
            aria-label={`Go to ${title(id)}`}
            aria-current={id === station ? "true" : undefined}
            data-sfx="tick"
            onClick={() => go(id)}
            className="group pointer-events-auto absolute left-1/2 grid h-6 w-6 -translate-x-1/2 -translate-y-1/2 cursor-pointer place-items-center"
            style={{ top: `${STATION_T[id] * 100}%` }}
          >
            <span
              aria-hidden="true"
              className={`block h-[5px] w-[5px] border transition-colors group-hover:border-screen group-hover:bg-screen ${id === station ? "border-ink bg-ink" : "border-muted bg-void"}`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
