"use client";

import { toggleSound, useSound } from "@/lib/sound";

/**
 * "SOUND: OFF" / "SOUND: ON", set vertically on the right edge like a film-edge marking (reads bottom to
 * top). Round 3: moved off the top-right corner, where it sat under the evidence strip's measured zone
 * (x 37.5–96 %, y 4–32 %); the right edge between the strip zones and the bottom-right caption is free on
 * every layout. State lives in lib/sound (the audio engine subscribes there).
 */
export function SoundToggle() {
  const on = useSound();
  return (
    <button
      type="button"
      onClick={toggleSound}
      aria-pressed={on}
      aria-label={on ? "Sound on. Turn sound off" : "Sound off. Turn sound on"}
      className="sound-toggle caption fixed cursor-pointer select-none transition-opacity duration-200 hover:opacity-100"
      data-tone-lock=""
      style={{
        zIndex: "var(--z-ui)",
        opacity: on ? 1 : 0.62,
        background: "none",
        border: 0,
      }}
    >
      SOUND: <span className="inline-block text-left [inline-size:3.2ch]">{on ? "ON" : "OFF"}</span>
    </button>
  );
}
