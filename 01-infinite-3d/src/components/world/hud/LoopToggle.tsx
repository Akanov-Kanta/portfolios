"use client";
import { useLoopPref, writeLoopPref } from "../scroll/loop-pref";

/** `[ Loop on ]`: bracket grammar (interactive), magnetic label, tick on hover / focus. */
export function LoopToggle() {
  const pref = useLoopPref();
  const on = pref === "on";
  return (
    <button
      type="button"
      onClick={() => writeLoopPref(on ? "off" : "on")}
      aria-pressed={on}
      data-magnetic=""
      data-cursor="link"
      data-sfx="tick"
      className="marker pointer-events-auto inline-flex py-1.5 transition-colors hover:text-screen"
    >
      <span className="inline-flex">
        <span className="inline-flex items-center gap-2 whitespace-nowrap">
          <span aria-hidden="true">[</span>
          <span>
            Loop<span className="sr-only">:</span> <span className="marker-muted">{on ? "on" : "off"}</span>
          </span>
          <span aria-hidden="true">]</span>
        </span>
      </span>
    </button>
  );
}
