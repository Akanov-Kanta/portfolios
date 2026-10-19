"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import OniMask from "../art/OniMask";
import Hanko from "../art/Hanko";
import { slotsFor } from "@/lib/data";
import { MOTION_OK } from "../motion/Motion";

type Values = {
  name: string;
  phone: string;
  email: string;
  date: string;
  time: string;
  guests: number;
  seating: "table" | "booth" | "any";
  notes: string;
};
type Field = keyof Values;
type Errors = Partial<Record<Field, string>>;

const INITIAL: Values = { name: "", phone: "", email: "", date: "", time: "", guests: 2, seating: "any", notes: "" };
const ORDER: Field[] = ["name", "phone", "email", "date", "time", "guests", "seating", "notes"];
const SEATING: { id: Values["seating"]; label: string; hint: string }[] = [
  { id: "any", label: "No preference", hint: "We'll seat you" },
  { id: "table", label: "Table", hint: "1–4 guests" },
  { id: "booth", label: "Tatami booth", hint: "4–8 guests" },
];
const MAX_NOTES = 200;

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return y && m && d ? new Date(y, m - 1, d) : null;
};

const noop = () => () => {};
/** today's date as YYYY-MM-DD, read only on the client */
const useToday = () => useSyncExternalStore(noop, () => iso(new Date()), () => "");

function validate(v: Values, today: string): Errors {
  const e: Errors = {};
  if (v.name.trim().length < 2) e.name = "Tell us who to expect.";
  const digits = v.phone.replace(/\D/g, "");
  if (!v.phone.trim()) e.phone = "A number we can call if you're running late.";
  else if (!/^[\d\s()+.-]+$/.test(v.phone) || digits.length < 7 || digits.length > 15)
    e.phone = "That number doesn't look right.";
  if (!v.email.trim()) e.email = "We send the confirmation here.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim())) e.email = "That email doesn't look right.";

  const d = parse(v.date);
  if (!d) e.date = "Pick a night.";
  else if (today) {
    const t = parse(today)!;
    const max = new Date(t);
    max.setDate(max.getDate() + 30);
    if (d < t) e.date = "That night has already passed.";
    else if (d > max) e.date = "We only book 30 days ahead.";
    else if (d.getDay() === 1) e.date = "Closed on Mondays — the oni sleeps.";
  }
  if (!e.date && d && !slotsFor(d.getDay()).includes(v.time)) e.time = "Pick a time.";
  else if (!v.time) e.time = "Pick a time.";

  if (v.seating === "table" && v.guests > 4) e.seating = "Tables seat up to four — try the tatami booth.";
  if (v.seating === "booth" && v.guests < 4) e.seating = "The tatami booth is for 4 to 8 guests.";
  if (v.notes.length > MAX_NOTES) e.notes = `Keep it under ${MAX_NOTES} characters.`;
  return e;
}

function Err({ id, msg }: { id: string; msg?: string }) {
  return (
    <p id={id} className="mt-2 min-h-[1.25rem] text-sm font-semibold text-crimson" aria-live="polite">
      {msg ? `✕ ${msg}` : ""}
    </p>
  );
}

export default function Reserve() {
  const today = useToday();
  const [values, setValues] = useState<Values>(INITIAL);
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [ref, setRef] = useState("");
  const root = useRef<HTMLElement>(null);
  const card = useRef<HTMLDivElement>(null);

  const errors = validate(values, today);
  const show = (f: Field) => (submitted || touched[f] ? errors[f] : undefined);
  const day = parse(values.date)?.getDay();
  const slots = day === undefined || day === 1 ? [] : slotsFor(day);
  const maxDate = (() => {
    const t = parse(today);
    if (!t) return undefined;
    t.setDate(t.getDate() + 30);
    return iso(t);
  })();

  const { contextSafe } = useGSAP({ scope: root });

  const stamp = contextSafe(() => {
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      gsap
        .timeline()
        .set("[data-res-flash]", { opacity: 1 })
        .set("[data-res-flash]", { opacity: 0 }, "+=0.08")
        .from("[data-stamp]", { scale: 2.6, rotate: -30, opacity: 0, duration: 0.28, ease: "power4.in" }, 0)
        .from("[data-success-line]", { clipPath: "inset(0% 100% 0% 0%)", duration: 0.5, ease: "power3.out", stagger: 0.07 }, 0.25);
    });
  });

  const set = <K extends Field>(k: K, v: Values[K]) => {
    setValues((prev) => {
      const next = { ...prev, [k]: v };
      if (k === "date") {
        const d = parse(String(v));
        const ok = d ? slotsFor(d.getDay()) : [];
        if (!ok.includes(next.time)) next.time = "";
      }
      return next;
    });
  };
  const blur = (k: Field) => setTouched((t) => ({ ...t, [k]: true }));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const first = ORDER.find((f) => errors[f]);
    if (first) {
      const el = document.getElementById(`res-${first}`);
      el?.focus();
      return;
    }
    setStatus("sending");
    window.setTimeout(() => {
      const code = Math.random().toString(36).slice(2, 6).toUpperCase();
      setRef(`ONI-${code}`);
      setStatus("done");
      requestAnimationFrame(() => {
        card.current?.focus();
        stamp();
      });
    }, 900);
  };

  const reset = () => {
    setValues(INITIAL);
    setTouched({});
    setSubmitted(false);
    setStatus("idle");
  };

  const errCount = Object.keys(errors).length;
  const summaryDate = parse(values.date)?.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" });

  const describe = (f: Field) => ({
    "aria-invalid": show(f) ? true : undefined,
    "aria-describedby": `res-${f}-err`,
  });

  return (
    <section ref={root} id="reserve" className="relative overflow-clip bg-crimson py-24 md:py-32">
      {/* ink diagonal field behind the form */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-ink"
        style={{ clipPath: "polygon(62% 0, 100% 0, 100% 100%, 44% 100%)" }}
      />
      <div aria-hidden="true" data-parallax="0.25" className="pointer-events-none absolute -left-16 top-14 w-[21rem] md:-left-28 md:top-10 md:w-[34rem] lg:w-[44rem]">
        <OniMask className="w-full -rotate-12" />
      </div>

      <div className="relative mx-auto grid max-w-[1400px] gap-12 px-4 md:px-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10">
        <div className="flex flex-col justify-end pt-[22rem] md:pt-[30rem] lg:pt-0">
          <div className="bg-crimson/0">
            <p data-reveal="cut" className="label mb-5 flex items-center gap-3 text-rice">
              <span className="inline-block h-[3px] w-10 bg-rice" /> Reservations · 予約
            </p>
            <h2 className="font-display text-5xl font-extrabold leading-none text-rice hard-text md:text-7xl">
              <span data-reveal="slash" className="block">
                Hold a seat
              </span>
              <span data-reveal="slash" data-delay="0.08" className="block">
                for the night.
              </span>
            </h2>
            <p data-reveal="cut" className="mt-6 max-w-md bg-ink p-4 text-lg leading-relaxed text-rice shadow-[6px_6px_0_0_var(--vermilion)]">
              The eight counter stools are always walk-in. Tables and the tatami booth can be booked up to 30 days
              ahead. We hold a table for 15 minutes.
            </p>
          </div>
        </div>

        <div
          ref={card}
          tabIndex={-1}
          data-reveal="slash"
          className="relative border-4 border-ink bg-rice text-ink shadow-[14px_14px_0_0_var(--vermilion)] outline-none"
        >
          <div data-res-flash aria-hidden="true" className="pointer-events-none absolute inset-0 z-20 bg-vermilion opacity-0" />
          <div className="flex items-center justify-between border-b-4 border-ink bg-ink px-5 py-3 text-rice md:px-8">
            <p className="label text-gold">Table reservation</p>
            <p className="font-display text-lg font-bold text-gold">予約票</p>
          </div>

          {status === "done" ? (
            <div className="relative px-5 py-10 md:px-10 md:py-14" role="status">
              <div data-stamp className="absolute right-5 top-5 w-24 rotate-[-8deg] md:right-10 md:top-8 md:w-36">
                <Hanko text="予約" className="w-full" label="Reserved" />
              </div>
              <p data-success-line className="label text-crimson">Sealed · {ref}</p>
              <h3 data-success-line className="mt-4 max-w-[16ch] font-display text-4xl font-extrabold leading-tight md:text-5xl">
                See you after dark, {values.name.trim().split(" ")[0]}.
              </h3>
              <dl data-success-line className="mt-8 grid max-w-md grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-lg">
                <dt className="label self-center text-ink/60">Night</dt>
                <dd className="font-semibold">{summaryDate}</dd>
                <dt className="label self-center text-ink/60">Time</dt>
                <dd className="font-semibold">{values.time}</dd>
                <dt className="label self-center text-ink/60">Party</dt>
                <dd className="font-semibold">
                  {values.guests} {values.guests === 1 ? "guest" : "guests"} ·{" "}
                  {SEATING.find((s) => s.id === values.seating)?.label}
                </dd>
              </dl>
              <p data-success-line className="mt-8 max-w-md text-ink/80">
                A confirmation is on its way to <strong>{values.email.trim()}</strong>. If plans change, call us — we&apos;ll
                text {values.phone.trim()} if anything changes on our side.
              </p>
              <button type="button" onClick={reset} className="btn btn-red mt-10">
                Book another night
              </button>
            </div>
          ) : (
            <form noValidate onSubmit={onSubmit} className="grid gap-x-6 gap-y-3 px-5 py-8 md:grid-cols-2 md:px-8 md:py-10">
              <div className="md:col-span-2">
                <label htmlFor="res-name" className="label mb-2 block">
                  Name
                </label>
                <input
                  id="res-name"
                  className="field"
                  autoComplete="name"
                  value={values.name}
                  onChange={(e) => set("name", e.target.value)}
                  onBlur={() => blur("name")}
                  {...describe("name")}
                />
                <Err id="res-name-err" msg={show("name")} />
              </div>

              <div>
                <label htmlFor="res-phone" className="label mb-2 block">
                  Phone
                </label>
                <input
                  id="res-phone"
                  type="tel"
                  inputMode="tel"
                  className="field"
                  autoComplete="tel"
                  value={values.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  onBlur={() => blur("phone")}
                  {...describe("phone")}
                />
                <Err id="res-phone-err" msg={show("phone")} />
              </div>

              <div>
                <label htmlFor="res-email" className="label mb-2 block">
                  Email
                </label>
                <input
                  id="res-email"
                  type="email"
                  className="field"
                  autoComplete="email"
                  value={values.email}
                  onChange={(e) => set("email", e.target.value)}
                  onBlur={() => blur("email")}
                  {...describe("email")}
                />
                <Err id="res-email-err" msg={show("email")} />
              </div>

              <div>
                <label htmlFor="res-date" className="label mb-2 block">
                  Night <span className="text-ink/50">(Tue–Sun)</span>
                </label>
                <input
                  id="res-date"
                  type="date"
                  className="field"
                  min={today || undefined}
                  max={maxDate}
                  value={values.date}
                  onChange={(e) => set("date", e.target.value)}
                  onBlur={() => blur("date")}
                  {...describe("date")}
                />
                <Err id="res-date-err" msg={show("date")} />
              </div>

              <div>
                <label htmlFor="res-time" className="label mb-2 block">
                  Time
                </label>
                <select
                  id="res-time"
                  className="field"
                  value={values.time}
                  disabled={slots.length === 0}
                  onChange={(e) => set("time", e.target.value)}
                  onBlur={() => blur("time")}
                  {...describe("time")}
                >
                  <option value="">{slots.length ? "Choose a time" : "Pick a night first"}</option>
                  {slots.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <Err id="res-time-err" msg={show("time")} />
              </div>

              <fieldset id="res-guests" tabIndex={-1} className="md:col-span-2 outline-none">
                <legend className="label mb-2">Guests</legend>
                <div className="grid grid-cols-8 gap-1.5 md:gap-2">
                  {Array.from({ length: 8 }, (_, i) => i + 1).map((n) => (
                    <label key={n} className="relative">
                      <input
                        type="radio"
                        name="guests"
                        value={n}
                        checked={values.guests === n}
                        onChange={() => set("guests", n)}
                        className="peer sr-only"
                      />
                      <span className="flex h-11 cursor-pointer items-center justify-center border-2 border-ink bg-rice font-sans text-xl font-bold transition-[transform,box-shadow] duration-100 hover:-translate-y-0.5 peer-checked:-translate-x-0.5 peer-checked:-translate-y-0.5 peer-checked:bg-vermilion peer-checked:shadow-[4px_4px_0_0_var(--ink)] peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-steel">
                        {n}
                      </span>
                    </label>
                  ))}
                </div>
                <p className="mt-2 text-sm text-ink/60">Nine or more? Call us about buying out the room.</p>
              </fieldset>

              <fieldset id="res-seating" tabIndex={-1} className="mt-3 md:col-span-2 outline-none" aria-describedby="res-seating-err">
                <legend className="label mb-2">Seating</legend>
                <div className="grid gap-2 sm:grid-cols-3">
                  {SEATING.map((s) => (
                    <label key={s.id} className="relative">
                      <input
                        type="radio"
                        name="seating"
                        value={s.id}
                        checked={values.seating === s.id}
                        onChange={() => {
                          set("seating", s.id);
                          blur("seating");
                        }}
                        className="peer sr-only"
                      />
                      <span className="flex h-full cursor-pointer flex-col border-2 border-ink bg-rice px-3 py-2.5 transition-[transform,box-shadow] duration-100 hover:-translate-y-0.5 peer-checked:-translate-x-0.5 peer-checked:-translate-y-0.5 peer-checked:bg-ink peer-checked:text-rice peer-checked:shadow-[4px_4px_0_0_var(--vermilion)] peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-steel">
                        <span className="font-display text-lg font-bold">{s.label}</span>
                        <span className="label !text-[0.65rem] opacity-70">{s.hint}</span>
                      </span>
                    </label>
                  ))}
                </div>
                <Err id="res-seating-err" msg={submitted || touched.seating ? errors.seating : undefined} />
              </fieldset>

              <div className="md:col-span-2">
                <label htmlFor="res-notes" className="label mb-2 flex justify-between">
                  <span>Notes</span>
                  <span className={values.notes.length > MAX_NOTES ? "text-crimson" : "text-ink/50"}>
                    {values.notes.length}/{MAX_NOTES}
                  </span>
                </label>
                <textarea
                  id="res-notes"
                  rows={3}
                  className="field resize-none"
                  placeholder="Allergies, birthdays, the seat by the lantern…"
                  value={values.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  onBlur={() => blur("notes")}
                  {...describe("notes")}
                />
                <Err id="res-notes-err" msg={show("notes")} />
              </div>

              <div className="mt-2 flex flex-col gap-4 md:col-span-2 md:flex-row md:items-center md:justify-between">
                <p className="text-sm text-ink/70" aria-live="polite">
                  {submitted && errCount > 0
                    ? `${errCount} ${errCount === 1 ? "thing needs" : "things need"} fixing before we can seal it.`
                    : "No deposit. We confirm by email within the hour."}
                </p>
                <button type="submit" className="btn btn-red" disabled={status === "sending"} aria-busy={status === "sending"}>
                  {status === "sending" ? "Sealing…" : "Seal the reservation"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
