"use client";

import { useSyncExternalStore } from "react";
import { HOURS, fmt } from "@/lib/data";

const noop = () => () => {};
// Weekday read only on the client (never during prerender).
const useToday = () =>
  useSyncExternalStore(
    noop,
    () => new Date().getDay(),
    () => -1,
  );

export default function HoursBoard() {
  const today = useToday();
  return (
    <ul className="divide-y-2 divide-ink-2">
      {HOURS.map((h) => {
        const isToday = h.day === today;
        const closed = h.open === undefined;
        return (
          <li
            key={h.day}
            className={`relative flex items-center justify-between gap-4 px-4 py-3 ${isToday ? "bg-vermilion text-ink" : ""}`}
          >
            <span className="flex items-center gap-3">
              <span className={`font-display text-xl font-extrabold ${isToday ? "text-ink" : "text-gold"}`}>{h.jp}</span>
              <span className="label">{h.short}</span>
              {isToday && <span className="label border-2 border-ink px-1.5 !text-[0.62rem]">Tonight</span>}
            </span>
            <span className={`font-sans text-xl font-semibold tracking-wider ${closed && !isToday ? "text-rice/50" : ""}`}>
              {closed ? "Closed — the oni sleeps" : `${fmt(h.open!)} – ${fmt(h.close!)}`}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
