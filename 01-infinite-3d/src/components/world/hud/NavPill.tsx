"use client";
import Link from "next/link";
import { STATIONS, STATION_LABEL, useWorld } from "../state/world-store";
import { scrollToStation as go } from "../scroll/lenis-ref";

/**
 * Floating glass pill nav. On the home loop the active station is tracked; its highlight pops in
 * on a spring-shaped overshoot curve (CSS). Inner pages link back to the stations on the home page.
 * Phones show numbers, with the active label expanded.
 */
export function NavPill() {
  const station = useWorld((s) => s.station);
  const isHome = useWorld((s) => s.isHome);
  return (
    <nav aria-label="Stations" data-label-avoid="" className="nav-pill pointer-events-auto">
      <ul className="flex items-center gap-0.5">
        {STATIONS.map((id, i) => {
          const active = isHome && station === id;
          const label = STATION_LABEL[id];
          const inner = (
            <>
              {active && (
                <span className="nav-pill-glow absolute inset-0 rounded-full" aria-hidden="true" />
              )}
              <span className="relative">
                <span className={active ? "text-void/60" : "marker-muted"}>{String(i + 1).padStart(2, "0")}</span>
                <span className={active ? "ml-1.5 inline" : "ml-1.5 hidden md:inline"}>{label}</span>
              </span>
            </>
          );
          const cls = `label relative inline-flex items-center rounded-full px-3 py-1.5 transition-colors ${active ? "text-void" : "text-ink hover:text-screen"}`;
          return (
            <li key={id}>
              {isHome ? (
                <button type="button" onClick={() => go(id)} aria-current={active ? "true" : undefined} className={cls}>
                  {inner}
                </button>
              ) : (
                <Link href={`/#${id}`} className={cls}>
                  {inner}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
