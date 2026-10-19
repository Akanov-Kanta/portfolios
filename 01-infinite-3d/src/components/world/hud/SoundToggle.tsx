"use client";
import { useWorld } from "../state/world-store";
import { setSound } from "../audio/ambient";

const BARS = [0.4, 0.9, 0.6, 1];

/** `[ ▮▮▮▮ Sound on ]`: an interactive control, so it uses the bracket grammar. The 4-bar equaliser moves only while sound plays. */
export function SoundToggle({ className = "" }: { className?: string }) {
  const on = useWorld((s) => s.sound);
  return (
    <button
      type="button"
      onClick={() => setSound(!on)}
      aria-pressed={on}
      data-magnetic=""
      data-cursor="link"
      data-sfx="tick"
      className={`marker pointer-events-auto inline-flex py-1.5 transition-colors hover:text-screen ${className}`}
    >
      <span className="inline-flex">
        <span className="inline-flex items-center gap-2 whitespace-nowrap">
          <span aria-hidden="true">[</span>
          <span aria-hidden="true" className="inline-flex h-3 items-end gap-px">
            {BARS.map((h, i) => (
              <span
                key={i}
                className={`w-px origin-bottom bg-current transition-opacity duration-300 ${on ? "motion-safe:animate-[pulse_1s_ease-in-out_infinite_alternate]" : ""}`}
                style={{ height: `${h * 100}%`, opacity: on ? 1 : 0.35, animationDuration: `${0.8 + i * 0.2}s`, animationDelay: `${-i * 0.13}s` }}
              />
            ))}
          </span>
          <span>
            Sound<span className="sr-only">:</span> <span className="marker-muted">{on ? "on" : "off"}</span>
          </span>
          <span aria-hidden="true">]</span>
        </span>
      </span>
    </button>
  );
}
