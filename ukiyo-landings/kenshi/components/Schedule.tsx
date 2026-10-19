"use client";

import { useMemo, useState } from "react";
import { DAYS, DISCIPLINES, LEVELS, SCHEDULE, type ClassSlot, type DayId, type Level } from "@/lib/data";
import { SectionHead } from "./SectionHead";

type DayFilter = DayId | "all";
type LevelFilter = Level | "any";

const DISC_NAME = Object.fromEntries(DISCIPLINES.map((d) => [d.id, d.name])) as Record<ClassSlot["discipline"], string>;
const DISC_MARK: Record<ClassSlot["discipline"], string> = { kendo: "剣", iaido: "居", mma: "鍛" };

export type PrefillDetail = { discipline?: string; day?: string; plan?: string };

export function prefillTrial(detail: PrefillDetail) {
  window.dispatchEvent(new CustomEvent<PrefillDetail>("kenshi:prefill", { detail }));
  document.getElementById("trial")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function FilterButton({
  active,
  onClick,
  children,
  controls,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  controls: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-controls={controls}
      onClick={onClick}
      className={`label relative border-2 border-ink px-3 py-2 transition-[transform,box-shadow] duration-100 ${
        active ? "bg-ink text-rice shadow-[4px_4px_0_var(--vermilion)]" : "bg-rice text-ink hover:-translate-y-0.5 hover:shadow-[3px_3px_0_var(--ink)]"
      }`}
    >
      {children}
    </button>
  );
}

export function Schedule() {
  const [day, setDay] = useState<DayFilter>("all");
  const [level, setLevel] = useState<LevelFilter>("any");

  const groups = useMemo(() => {
    const rows = SCHEDULE.filter((s) => (day === "all" || s.day === day) && (level === "any" || s.level === level));
    return DAYS.map((d) => ({ day: d, rows: rows.filter((r) => r.day === d.id) })).filter((g) => g.rows.length > 0);
  }, [day, level]);

  const count = groups.reduce((n, g) => n + g.rows.length, 0);
  const key = `${day}-${level}`;

  return (
    <section id="timetable" aria-labelledby="tt-title" className="edge-top relative z-30 bg-crimson pb-28 pt-[calc(5vw+6rem)] text-rice [--edge:6vw]">
      {/* ink diagonal slab behind the table */}
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[55%] bg-ink [clip-path:polygon(0_22%,100%_0,100%_100%,0_100%)]" />

      <div className="relative mx-auto max-w-[1300px] px-5 sm:px-10">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <SectionHead index="03" label="Weekly timetable" kanji="稽古" tone="red" id="tt-title" title={<>Keiko,<br />every day.</>} />
          <p className="max-w-[26rem] text-lg leading-relaxed text-rice/85">
            Pick a day and a level. Every class marked <em className="not-italic text-rice underline decoration-ink decoration-2 underline-offset-4">Beginner</em> or{" "}
            <em className="not-italic text-rice underline decoration-ink decoration-2 underline-offset-4">All levels</em> is open to free-trial students.
          </p>
        </div>

        <div className="mt-14 border-2 border-ink bg-rice text-ink shadow-[10px_10px_0_var(--ink)]">
          {/* filters */}
          <div className="flex flex-col gap-4 border-b-2 border-ink p-4 sm:p-6">
            <div role="group" aria-label="Filter by day" className="flex flex-wrap items-center gap-2">
              <span aria-hidden="true" className="label w-full text-ink/50 sm:mr-2 sm:w-14">Day</span>
              <FilterButton controls="tt-body" active={day === "all"} onClick={() => setDay("all")}>
                All week
              </FilterButton>
              {DAYS.map((d) => (
                <FilterButton key={d.id} controls="tt-body" active={day === d.id} onClick={() => setDay(d.id)}>
                  <span aria-hidden="true" className="mr-1 font-display normal-case tracking-normal">
                    {d.kanji}
                  </span>
                  <span className="sr-only">{d.long}</span>
                  <span aria-hidden="true">{d.short}</span>
                </FilterButton>
              ))}
            </div>
            <div role="group" aria-label="Filter by level" className="flex flex-wrap items-center gap-2">
              <span aria-hidden="true" className="label w-full text-ink/50 sm:mr-2 sm:w-14">Level</span>
              <FilterButton controls="tt-body" active={level === "any"} onClick={() => setLevel("any")}>
                Any level
              </FilterButton>
              {LEVELS.map((l) => (
                <FilterButton key={l} controls="tt-body" active={level === l} onClick={() => setLevel(l)}>
                  {l}
                </FilterButton>
              ))}
            </div>
          </div>

          <p className="label flex items-center justify-between border-b-2 border-ink px-4 py-3 sm:px-6" aria-live="polite">
            <span>
              <span className="font-display text-xl text-crimson">{count}</span> {count === 1 ? "class" : "classes"} found
            </span>
            {day !== "all" || level !== "any" ? (
              <button
                type="button"
                className="underline decoration-vermilion decoration-2 underline-offset-4 hover:text-vermilion"
                onClick={() => {
                  setDay("all");
                  setLevel("any");
                }}
              >
                Clear filters
              </button>
            ) : (
              <span className="hidden text-ink/50 sm:inline">Times are local · doors open 15 min before</span>
            )}
          </p>

          <div id="tt-body" key={key}>
            {/* column heads (desktop) */}
            <div className={`label hidden grid-cols-[6rem_1fr] border-b-2 border-ink py-3 text-ink/55 ${count ? "lg:grid" : ""}`} aria-hidden="true">
              <span className="px-6">Day</span>
              <div className="grid grid-cols-[8.5rem_1fr_11rem_8.5rem_7.5rem_7rem] gap-4 px-6">
                <span>Time</span>
                <span>Class</span>
                <span>Discipline</span>
                <span>Level</span>
                <span>Sensei</span>
                <span />
              </div>
            </div>

            {count === 0 ? (
              <div className="row-in flex flex-col items-center gap-3 px-6 py-16 text-center">
                <p className="font-display text-3xl">休</p>
                <p className="font-display text-2xl">No class matches.</p>
                <p className="text-ink/70">Rest is training too — or try another day.</p>
              </div>
            ) : (
              <ul>
                {groups.map((g, gi) => (
                  <li key={g.day.id} className="relative border-b-2 border-ink last:border-b-0 lg:grid lg:grid-cols-[6rem_1fr]">
                    <div className="flex items-center gap-3 bg-ink px-4 py-2 text-rice lg:flex-col lg:items-start lg:justify-start lg:px-6 lg:py-5">
                      <span aria-hidden="true" className="font-display text-3xl font-extrabold text-vermilion lg:text-4xl">
                        {g.day.kanji}
                      </span>
                      <span className="label">{g.day.short}</span>
                    </div>
                    <ul>
                      {g.rows.map((r, ri) => (
                        <li
                          key={`${r.day}-${r.start}`}
                          className="row-in group relative grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 border-b border-ink/20 px-4 py-4 last:border-b-0 hover:bg-mist sm:px-6 lg:grid-cols-[8.5rem_1fr_11rem_8.5rem_7.5rem_7rem] lg:gap-4"
                          style={{ animationDelay: `${Math.min(gi * 60 + ri * 40, 500)}ms` }}
                        >
                          <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 origin-top scale-y-0 bg-vermilion transition-transform duration-150 group-hover:scale-y-100" />
                          <span className="font-display text-lg font-semibold tabular-nums lg:text-xl">
                            {r.start}
                            <span className="text-ink/40">–{r.end}</span>
                          </span>
                          <span className="col-span-2 row-start-2 font-display text-xl font-extrabold lg:col-span-1 lg:row-start-auto">{r.title}</span>
                          <span className="col-span-2 flex items-center gap-2 text-ink/80 lg:col-span-1">
                            <span aria-hidden="true" className="grid h-6 w-6 place-items-center bg-crimson font-display text-xs text-rice">
                              {DISC_MARK[r.discipline]}
                            </span>
                            {DISC_NAME[r.discipline]}
                            <span className="text-ink/40 lg:hidden">· {r.level} · Sensei {r.sensei}</span>
                          </span>
                          <span className="label hidden !tracking-[0.14em] lg:block">{r.level}</span>
                          <span className="hidden text-ink/80 lg:block">{r.sensei}</span>
                          <button
                            type="button"
                            onClick={() => prefillTrial({ discipline: r.discipline, day: r.day })}
                            className="label col-start-2 row-start-1 justify-self-end border-2 border-ink px-3 py-1.5 transition-colors hover:bg-vermilion hover:text-rice lg:col-start-auto lg:row-start-auto"
                            aria-label={`Try ${r.title} on ${g.day.long} at ${r.start}`}
                          >
                            Try it
                          </button>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
