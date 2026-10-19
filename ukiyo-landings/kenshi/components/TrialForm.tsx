"use client";

import { useEffect, useId, useRef, useState } from "react";
import { DAYS, DISCIPLINES, PLANS } from "@/lib/data";
import { BowPictogram } from "./art/Pictograms";
import { Hanko } from "./art/Hanko";
import type { PrefillDetail } from "./Schedule";

type Values = {
  name: string;
  email: string;
  phone: string;
  discipline: string;
  day: string;
  experience: string;
  note: string;
  consent: boolean;
  plan: string;
};

type Errors = Partial<Record<keyof Values, string>>;

const EMPTY: Values = {
  name: "",
  email: "",
  phone: "",
  discipline: "",
  day: "",
  experience: "none",
  note: "",
  consent: false,
  plan: "",
};

const EXPERIENCE = [
  { id: "none", label: "Never held a sword" },
  { id: "some", label: "Some martial arts" },
  { id: "graded", label: "Graded kendōka / iaidōka" },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(v: Values): Errors {
  const e: Errors = {};
  if (v.name.trim().length < 2) e.name = "Tell us what to call you on the floor.";
  if (!v.email.trim()) e.email = "We need an email to confirm your class.";
  else if (!EMAIL_RE.test(v.email.trim())) e.email = "That email looks mistyped.";
  if (v.phone.trim() && !/^[+()\d\s-]{7,}$/.test(v.phone.trim())) e.phone = "Digits, spaces, + and dashes only.";
  if (!v.discipline) e.discipline = "Choose a path to try.";
  if (!v.day) e.day = "Pick the day you can come.";
  if (v.note.length > 400) e.note = "Keep it under 400 characters.";
  if (!v.consent) e.consent = "Please accept the dojo safety rules.";
  return e;
}

const ORDER: (keyof Values)[] = ["name", "email", "phone", "discipline", "day", "note", "consent"];

export function TrialForm() {
  const uid = useId();
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof Values, boolean>>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [flash, setFlash] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onPrefill = (ev: Event) => {
      const d = (ev as CustomEvent<PrefillDetail>).detail ?? {};
      setStatus((s) => (s === "done" ? "idle" : s));
      setValues((v) => ({
        ...v,
        discipline: d.discipline ?? v.discipline,
        day: d.day ?? v.day,
        plan: d.plan ?? v.plan,
      }));
    };
    window.addEventListener("kenshi:prefill", onPrefill);
    return () => window.removeEventListener("kenshi:prefill", onPrefill);
  }, []);

  useEffect(() => {
    if (status === "done") doneRef.current?.focus();
  }, [status]);

  const set = <K extends keyof Values>(k: K, val: Values[K]) => {
    const next = { ...values, [k]: val };
    setValues(next);
    if (touched[k] || errors[k]) setErrors(validate(next));
  };

  const blur = (k: keyof Values) => {
    setTouched((t) => ({ ...t, [k]: true }));
    setErrors(validate(values));
  };

  const shown = (k: keyof Values) => (touched[k] ? errors[k] : undefined);

  const onSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const e = validate(values);
    setErrors(e);
    setTouched(Object.fromEntries(ORDER.map((k) => [k, true])));
    const first = ORDER.find((k) => e[k]);
    if (first) {
      const el = formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`);
      el?.focus();
      return;
    }
    setStatus("sending");
    window.setTimeout(() => {
      setStatus("done");
      setFlash((n) => n + 1);
    }, 900);
  };

  const reset = () => {
    setValues(EMPTY);
    setErrors({});
    setTouched({});
    setStatus("idle");
  };

  const id = (k: string) => `${uid}-${k}`;
  const describedBy = (k: keyof Values, hint?: boolean) =>
    [hint ? id(`${k}-hint`) : null, shown(k) ? id(`${k}-err`) : null].filter(Boolean).join(" ") || undefined;

  const disc = DISCIPLINES.find((d) => d.id === values.discipline);
  const dayName = DAYS.find((d) => d.id === values.day)?.long;
  const plan = PLANS.find((p) => p.id === values.plan);

  const renderErr = (k: keyof Values) =>
    shown(k) ? (
      <p id={id(`${k}-err`)} className="mt-2 flex items-center gap-2 text-sm font-semibold text-vermilion">
        <span aria-hidden="true" className="inline-block h-[3px] w-3 -rotate-[28deg] bg-vermilion" />
        {shown(k)}
      </p>
    ) : null;

  return (
    <section id="trial" aria-labelledby="trial-title" className="edge-top-rev relative z-50 overflow-hidden bg-ink pb-28 pt-[calc(6vw+6rem)] text-rice [--edge:6vw]">
      {flash > 0 ? <div key={flash} className="flash flash--intro" style={{ animationDelay: "0s" }} aria-hidden="true" /> : null}

      {/* crimson diagonal field behind the illustration */}
      <div aria-hidden="true" className="absolute inset-y-0 left-0 hidden w-[52%] bg-crimson [clip-path:polygon(0_0,100%_0,72%_100%,0_100%)] lg:block" />

      <div className="relative mx-auto grid max-w-[1300px] gap-14 px-5 sm:px-10 lg:grid-cols-[1fr_1.15fr] lg:gap-20">
        <div className="relative">
          <p className="label mb-4 flex items-center gap-3 text-rice/70">
            <span className="text-gold">06</span>
            <span data-slash-line className="inline-block h-[2px] w-12 origin-left bg-gold" />
            Free trial
          </p>
          <h2 id="trial-title" data-reveal="slash" className="font-display text-[clamp(2.4rem,5.4vw,4.8rem)] font-extrabold leading-[1.02]">
            Your first class
            <br />
            is on us.
          </h2>
          <p className="mt-6 max-w-[26rem] text-lg leading-relaxed text-rice/85">
            Come in loose clothes, ten minutes early. We lend everything else. Book below and a sensei will confirm within a day.
          </p>
          <div className="mt-10 aspect-square w-full max-w-[22rem]">
            <BowPictogram />
          </div>
          <p aria-hidden="true" className="vertical absolute right-0 top-0 hidden font-display text-6xl font-extrabold text-ink/70 lg:block">
            礼に始まり
          </p>
        </div>

        <div className="relative border-2 border-ink bg-rice text-ink shadow-[12px_12px_0_var(--vermilion)]">
          {status === "done" ? (
            <div ref={doneRef} tabIndex={-1} className="relative flex min-h-[38rem] flex-col justify-center p-7 outline-none sm:p-12" role="status">
              <div className="stamp absolute right-6 top-6 sm:right-10 sm:top-10">
                <Hanko glyph="受付" size={120} title="Accepted" />
              </div>
              <p className="label text-crimson">Booked · 受付</p>
              <h3 className="mt-4 max-w-[22rem] font-display text-4xl font-extrabold leading-tight sm:text-5xl">
                See you on the floor, {values.name.trim().split(/\s+/)[0]}.
              </h3>
              <dl className="mt-8 grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 border-t-2 border-ink pt-6">
                <dt className="label text-ink/60">Path</dt>
                <dd className="font-display text-xl">{disc?.name}</dd>
                <dt className="label text-ink/60">Day</dt>
                <dd className="font-display text-xl">{dayName}</dd>
                {plan ? (
                  <>
                    <dt className="label text-ink/60">Plan</dt>
                    <dd className="font-display text-xl">{plan.name}</dd>
                  </>
                ) : null}
                <dt className="label text-ink/60">Confirm to</dt>
                <dd className="break-all text-lg">{values.email}</dd>
              </dl>
              <p className="mt-6 text-ink/70">Nothing was actually sent — this demo form lives only in your browser.</p>
              <div className="mt-10">
                <button type="button" onClick={reset} className="btn btn-ghost">
                  Book another
                </button>
              </div>
            </div>
          ) : (
            <form ref={formRef} noValidate onSubmit={onSubmit} className="grid gap-7 p-7 sm:grid-cols-2 sm:p-10" aria-describedby={id("req")}>
              <p id={id("req")} className="label text-ink/60 sm:col-span-2">
                Fields marked <span className="text-vermilion">*</span> are required
                {plan ? (
                  <span className="ml-2 inline-block bg-crimson px-2 py-0.5 text-rice">Plan: {plan.name}</span>
                ) : null}
              </p>

              <div className="sm:col-span-2">
                <label htmlFor={id("name")} className="label block">
                  Full name <span className="text-vermilion">*</span>
                </label>
                <input
                  id={id("name")}
                  name="name"
                  autoComplete="name"
                  className="field"
                  value={values.name}
                  onChange={(e) => set("name", e.target.value)}
                  onBlur={() => blur("name")}
                  aria-invalid={!!shown("name")}
                  aria-describedby={describedBy("name")}
                  placeholder="Miyamoto Musashi"
                />
                {renderErr("name")}
              </div>

              <div>
                <label htmlFor={id("email")} className="label block">
                  Email <span className="text-vermilion">*</span>
                </label>
                <input
                  id={id("email")}
                  name="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  className="field"
                  value={values.email}
                  onChange={(e) => set("email", e.target.value)}
                  onBlur={() => blur("email")}
                  aria-invalid={!!shown("email")}
                  aria-describedby={describedBy("email")}
                  placeholder="you@example.com"
                />
                {renderErr("email")}
              </div>

              <div>
                <label htmlFor={id("phone")} className="label block">
                  Phone <span className="text-ink/50">(optional)</span>
                </label>
                <input
                  id={id("phone")}
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  className="field"
                  value={values.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  onBlur={() => blur("phone")}
                  aria-invalid={!!shown("phone")}
                  aria-describedby={describedBy("phone")}
                  placeholder="+1 555 010 1998"
                />
                {renderErr("phone")}
              </div>

              <div>
                <label htmlFor={id("discipline")} className="label block">
                  Path to try <span className="text-vermilion">*</span>
                </label>
                <select
                  id={id("discipline")}
                  name="discipline"
                  className="field"
                  value={values.discipline}
                  onChange={(e) => set("discipline", e.target.value)}
                  onBlur={() => blur("discipline")}
                  aria-invalid={!!shown("discipline")}
                  aria-describedby={describedBy("discipline")}
                >
                  <option value="">Choose…</option>
                  {DISCIPLINES.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                {renderErr("discipline")}
              </div>

              <div>
                <label htmlFor={id("day")} className="label block">
                  Preferred day <span className="text-vermilion">*</span>
                </label>
                <select
                  id={id("day")}
                  name="day"
                  className="field"
                  value={values.day}
                  onChange={(e) => set("day", e.target.value)}
                  onBlur={() => blur("day")}
                  aria-invalid={!!shown("day")}
                  aria-describedby={describedBy("day")}
                >
                  <option value="">Choose…</option>
                  {DAYS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.long}
                    </option>
                  ))}
                </select>
                {renderErr("day")}
              </div>

              <fieldset className="sm:col-span-2">
                <legend className="label">Experience</legend>
                <div className="mt-3 flex flex-wrap gap-2">
                  {EXPERIENCE.map((x) => {
                    const checked = values.experience === x.id;
                    return (
                      <label
                        key={x.id}
                        className={`label cursor-pointer border-2 border-ink px-3 py-2 !tracking-[0.14em] transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-vermilion ${
                          checked ? "bg-ink text-rice" : "hover:bg-mist"
                        }`}
                      >
                        <input
                          type="radio"
                          name="experience"
                          value={x.id}
                          checked={checked}
                          onChange={() => set("experience", x.id)}
                          className="sr-only"
                        />
                        {x.label}
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <div className="sm:col-span-2">
                <label htmlFor={id("note")} className="label block">
                  Anything we should know? <span className="text-ink/50">(optional)</span>
                </label>
                <textarea
                  id={id("note")}
                  name="note"
                  rows={2}
                  className="field resize-none"
                  value={values.note}
                  onChange={(e) => set("note", e.target.value)}
                  onBlur={() => blur("note")}
                  aria-invalid={!!shown("note")}
                  aria-describedby={describedBy("note", true)}
                  placeholder="Old knee injury, coming with a friend…"
                />
                <p id={id("note-hint")} className="mt-1 text-right text-xs text-ink/50 tabular-nums">
                  {values.note.length}/400
                </p>
                {renderErr("note")}
              </div>

              <div className="sm:col-span-2">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    name="consent"
                    checked={values.consent}
                    onChange={(e) => set("consent", e.target.checked)}
                    onBlur={() => blur("consent")}
                    aria-invalid={!!shown("consent")}
                    aria-describedby={describedBy("consent")}
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center border-2 border-ink bg-rice text-rice peer-checked:bg-vermilion peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-vermilion"
                  >
                    <svg viewBox="0 0 12 12" className="h-3.5 w-3.5">
                      <path d="M1 7 L 5 10 L 11 1" fill="none" stroke="currentColor" strokeWidth={2.5} />
                    </svg>
                  </span>
                  <span className="leading-snug">
                    I&apos;ll follow the dojo safety rules and bow in like everyone else. <span className="text-vermilion">*</span>
                  </span>
                </label>
                {renderErr("consent")}
              </div>

              <div className="flex flex-wrap items-center gap-5 sm:col-span-2">
                <button type="submit" className="btn btn-red" disabled={status === "sending"}>
                  {status === "sending" ? "Drawing the blade…" : "Book my free class"}
                </button>
                <p className="text-sm text-ink/60">No card needed. Cancel by replying to the email.</p>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
