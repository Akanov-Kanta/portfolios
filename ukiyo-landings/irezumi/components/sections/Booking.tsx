"use client";

import { useEffect, useRef, useState } from "react";
import { flashFrame } from "@/lib/flash";
import Hanko from "../Hanko";
import SectionHead from "../SectionHead";

const MOTIFS = [
  { id: "dragon", en: "Dragon", jp: "龍" },
  { id: "koi", en: "Koi", jp: "鯉" },
  { id: "tiger", en: "Tiger", jp: "虎" },
  { id: "hannya", en: "Hannya", jp: "般若" },
  { id: "peony", en: "Peony", jp: "牡丹" },
  { id: "wave", en: "Wave", jp: "波" },
  { id: "other", en: "Something else", jp: "他" },
];
const SIZES = ["One-point", "Panel", "Half sleeve", "Full sleeve", "Backpiece"];
const PLACEMENTS = ["Forearm", "Upper arm", "Shoulder", "Chest", "Ribs", "Back", "Thigh", "Calf", "Other"];
const ARTISTS = ["No preference", "Ren Kaneshiro", "Akane Sato", "Daichi Okabe"];

type Form = {
  name: string;
  email: string;
  phone: string;
  artist: string;
  motifs: string[];
  placement: string;
  size: string;
  month: string;
  idea: string;
  adult: boolean;
  deposit: boolean;
};
type Errors = Partial<Record<keyof Form, string>>;

const EMPTY: Form = {
  name: "",
  email: "",
  phone: "",
  artist: ARTISTS[0],
  motifs: [],
  placement: "",
  size: "",
  month: "",
  idea: "",
  adult: false,
  deposit: false,
};

function validate(f: Form): Errors {
  const e: Errors = {};
  if (f.name.trim().length < 2) e.name = "Tell us your name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) e.email = "We need a valid email to reply.";
  if (f.phone.trim() && !/^[+()\d\s-]{7,20}$/.test(f.phone.trim())) e.phone = "Digits, spaces and + only.";
  if (f.motifs.length === 0) e.motifs = "Pick at least one motif.";
  if (!f.placement) e.placement = "Where on the body?";
  if (!f.size) e.size = "Choose a rough size.";
  if (f.idea.trim().length < 30) e.idea = `A little more, please. At least 30 characters (${f.idea.trim().length}/30).`;
  if (!f.adult) e.adult = "We only tattoo clients aged 18 and over.";
  if (!f.deposit) e.deposit = "Please confirm you understand the deposit.";
  return e;
}

const ORDER: (keyof Form)[] = ["name", "email", "phone", "motifs", "placement", "size", "idea", "adult", "deposit"];

function Err({ id, msg }: { id: string; msg?: string }) {
  return (
    <p id={id} role={msg ? "alert" : undefined} className={`label mt-2 min-h-[1.2em] normal-case tracking-wide ${msg ? "text-crimson" : "text-transparent"}`}>
      {msg ? `× ${msg}` : " "}
    </p>
  );
}

export default function Booking() {
  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [tried, setTried] = useState(false);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<null | { ref: string; name: string }>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const successRef = useRef<HTMLDivElement>(null);

  // the lightbox can pre-select a motif
  useEffect(() => {
    const onMotif = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      setDone(null);
      setForm((f) => (f.motifs.includes(id) ? f : { ...f, motifs: [...f.motifs, id] }));
    };
    window.addEventListener("irezumi:motif", onMotif);
    return () => window.removeEventListener("irezumi:motif", onMotif);
  }, []);

  useEffect(() => {
    if (done) successRef.current?.focus();
  }, [done]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    const next = { ...form, [k]: v };
    setForm(next);
    if (tried) setErrors(validate(next));
  };

  const toggleMotif = (id: string) => set("motifs", form.motifs.includes(id) ? form.motifs.filter((m) => m !== id) : [...form.motifs, id]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTried(true);
    const errs = validate(form);
    setErrors(errs);
    const first = ORDER.find((k) => errs[k]);
    if (first) {
      const el = formRef.current?.querySelector<HTMLElement>(`[data-field="${first}"]`);
      el?.focus();
      return;
    }
    setSending(true);
    // front-end only: pretend to send
    window.setTimeout(() => {
      let h = 0;
      for (const c of form.email + form.name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
      setSending(false);
      flashFrame("var(--vermilion)");
      setDone({ ref: `IRZ-${(h % 9000) + 1000}`, name: form.name.trim().split(" ")[0] });
    }, 900);
  };

  const reset = () => {
    setForm(EMPTY);
    setErrors({});
    setTried(false);
    setDone(null);
  };

  const inv = (k: keyof Form) => (errors[k] ? true : undefined);

  return (
    <section id="book" className="cut-rev relative z-[55] overflow-hidden bg-ink pb-28" aria-labelledby="book-title">
      <div aria-hidden="true" className="pointer-events-none absolute -right-[55vw] top-0 aspect-square w-[100vw] md:-right-[20vw] md:top-[10%] md:w-[70vw]" data-parallax="0.08">
        <div className="absolute inset-0 rounded-full bg-crimson" />
        <div className="absolute left-0 top-[48%] h-[4%] w-full bg-ink" />
        <div className="absolute left-0 top-[58%] h-[2%] w-[80%] bg-ink" />
      </div>
      <div className="relative mx-auto grid max-w-[1500px] gap-14 px-4 sm:px-8 lg:grid-cols-[0.8fr_1.2fr]">
        <SectionHead
          no="06"
          kanji="予約"
          label="Booking"
          title={
            <span id="book-title">
              Request a<br />
              consultation.
            </span>
          }
        >
          <p className="mt-6 max-w-md text-lg leading-relaxed text-rice/85">
            Tell us about the piece. We reply within three working days, usually with questions. Nothing is booked until
            we&rsquo;ve talked.
          </p>
          <ul className="mt-8 grid max-w-sm gap-3">
            {["Consultations are free", "Deposit only once the design is agreed", "English & Japanese spoken"].map((t) => (
              <li key={t} className="flex items-center gap-3">
                <span className="h-3 w-3 rotate-45 bg-vermilion" aria-hidden="true" />
                <span className="label text-rice">{t}</span>
              </li>
            ))}
          </ul>
        </SectionHead>

        <div className="relative">
          <span aria-hidden="true" className="absolute inset-0 translate-x-[14px] translate-y-[14px] bg-vermilion" />
          <div className="fibers relative bg-rice p-5 text-ink sm:p-10">
            {done ? (
              <div ref={successRef} tabIndex={-1} className="slash-in flex min-h-[560px] flex-col items-start justify-center outline-none" aria-live="polite">
                <div className="stamp-in">
                  <Hanko chars="承" size={120} tilt={-6} />
                </div>
                <p className="label mt-8 text-crimson">Request received · {done.ref}</p>
                <h3 className="display mt-3 text-5xl font-extrabold sm:text-6xl">Thank you, {done.name}.</h3>
                <p className="mt-5 max-w-md text-lg leading-relaxed text-ink/80">
                  Your request is on the drawing table. Expect an email within three working days with a few questions and
                  some consultation times.
                </p>
                <button type="button" onClick={reset} className="btn glint mt-8" style={{ ["--sh" as string]: "var(--ink)" }}>
                  Send another request
                </button>
              </div>
            ) : (
              <form ref={formRef} onSubmit={onSubmit} noValidate aria-describedby="form-note">
                <div className="grid gap-x-8 sm:grid-cols-2">
                  <div>
                    <label htmlFor="f-name" className="label text-ink/70">
                      Name *
                    </label>
                    <input id="f-name" data-field="name" className="field" autoComplete="name" value={form.name} onChange={(e) => set("name", e.target.value)} aria-invalid={inv("name")} aria-describedby="e-name" />
                    <Err id="e-name" msg={errors.name} />
                  </div>
                  <div>
                    <label htmlFor="f-email" className="label text-ink/70">
                      Email *
                    </label>
                    <input id="f-email" data-field="email" type="email" className="field" autoComplete="email" value={form.email} onChange={(e) => set("email", e.target.value)} aria-invalid={inv("email")} aria-describedby="e-email" />
                    <Err id="e-email" msg={errors.email} />
                  </div>
                  <div>
                    <label htmlFor="f-phone" className="label text-ink/70">
                      Phone <span className="normal-case tracking-normal opacity-70">(optional)</span>
                    </label>
                    <input id="f-phone" data-field="phone" type="tel" className="field" autoComplete="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} aria-invalid={inv("phone")} aria-describedby="e-phone" />
                    <Err id="e-phone" msg={errors.phone} />
                  </div>
                  <div>
                    <label htmlFor="f-artist" className="label text-ink/70">
                      Artist
                    </label>
                    <select id="f-artist" className="field" value={form.artist} onChange={(e) => set("artist", e.target.value)}>
                      {ARTISTS.map((a) => (
                        <option key={a}>{a}</option>
                      ))}
                    </select>
                    <Err id="e-artist" />
                  </div>
                </div>

                <fieldset className="mt-2" aria-describedby="e-motifs">
                  <legend className="label text-ink/70">Motif *</legend>
                  <div className="mt-3 flex flex-wrap gap-2" role="group">
                    {MOTIFS.map((m, i) => {
                      const on = form.motifs.includes(m.id);
                      return (
                        <button
                          key={m.id}
                          type="button"
                          data-field={i === 0 ? "motifs" : undefined}
                          aria-pressed={on}
                          onClick={() => toggleMotif(m.id)}
                          className={`flex items-baseline gap-2 border-2 px-3 py-2 font-narrow text-sm font-bold uppercase tracking-[0.14em] transition-[transform,background-color] duration-100 ${
                            on ? "border-ink bg-ink text-rice" : "border-ink/60 bg-transparent text-ink hover:-translate-y-0.5 hover:border-ink"
                          }`}
                          style={on ? { boxShadow: "4px 4px 0 0 var(--vermilion)" } : undefined}
                        >
                          <span className={`font-display text-base normal-case tracking-normal ${on ? "text-vermilion" : "text-crimson"}`}>{m.jp}</span>
                          {m.en}
                        </button>
                      );
                    })}
                  </div>
                  <Err id="e-motifs" msg={errors.motifs} />
                </fieldset>

                <div className="grid gap-x-8 sm:grid-cols-2">
                  <div>
                    <label htmlFor="f-placement" className="label text-ink/70">
                      Placement *
                    </label>
                    <select id="f-placement" data-field="placement" className="field" value={form.placement} onChange={(e) => set("placement", e.target.value)} aria-invalid={inv("placement")} aria-describedby="e-placement">
                      <option value="">Choose…</option>
                      {PLACEMENTS.map((p) => (
                        <option key={p}>{p}</option>
                      ))}
                    </select>
                    <Err id="e-placement" msg={errors.placement} />
                  </div>
                  <div>
                    <label htmlFor="f-month" className="label text-ink/70">
                      Ideal start <span className="normal-case tracking-normal opacity-70">(optional)</span>
                    </label>
                    <input id="f-month" type="month" className="field" value={form.month} onChange={(e) => set("month", e.target.value)} />
                    <Err id="e-month" />
                  </div>
                </div>

                <fieldset aria-describedby="e-size">
                  <legend className="label text-ink/70">Size *</legend>
                  <div className="mt-3 grid grid-cols-2 gap-[2px] border-2 border-ink bg-ink sm:grid-cols-5">
                    {SIZES.map((s, i) => (
                      <label key={s} className={`relative cursor-pointer bg-rice text-center ${i === SIZES.length - 1 ? "col-span-2 sm:col-span-1" : ""}`}>
                        <input
                          type="radio"
                          name="size"
                          value={s}
                          checked={form.size === s}
                          onChange={() => set("size", s)}
                          className="peer sr-only"
                          data-field={i === 0 ? "size" : undefined}
                        />
                        <span className="block px-2 py-3 font-narrow text-sm font-bold uppercase tracking-[0.12em] transition-colors duration-100 peer-checked:bg-ink peer-checked:text-rice peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-vermilion hover:bg-ink/10">
                          {s}
                        </span>
                      </label>
                    ))}
                  </div>
                  <Err id="e-size" msg={errors.size} />
                </fieldset>

                <div>
                  <label htmlFor="f-idea" className="label text-ink/70">
                    The idea *
                  </label>
                  <textarea
                    id="f-idea"
                    data-field="idea"
                    rows={4}
                    className="field resize-y"
                    placeholder="A koi climbing a waterfall up my left forearm, peonies behind, wind bars into the elbow…"
                    value={form.idea}
                    onChange={(e) => set("idea", e.target.value)}
                    aria-invalid={inv("idea")}
                    aria-describedby="e-idea"
                  />
                  <Err id="e-idea" msg={errors.idea} />
                </div>

                <div className="grid gap-1">
                  {(
                    [
                      ["adult", "I am 18 or older and will bring photo ID."],
                      ["deposit", "I understand the ¥20,000 deposit is non-refundable once the design is drawn."],
                    ] as const
                  ).map(([k, text]) => (
                    <div key={k}>
                      <label className="flex cursor-pointer items-start gap-3">
                        <input
                          type="checkbox"
                          data-field={k}
                          checked={form[k]}
                          onChange={(e) => set(k, e.target.checked)}
                          aria-invalid={inv(k)}
                          aria-describedby={`e-${k}`}
                          className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer appearance-none border-2 border-ink bg-transparent checked:border-ink checked:bg-vermilion"
                          style={{ boxShadow: form[k] ? "inset 0 0 0 3px var(--rice)" : undefined }}
                        />
                        <span className="leading-snug text-ink/85">{text}</span>
                      </label>
                      <Err id={`e-${k}`} msg={errors[k]} />
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                  <p id="form-note" className="label max-w-[16rem] normal-case tracking-wide text-ink/60">
                    * required. We never share your details.
                  </p>
                  <button type="submit" className="btn glint" disabled={sending} aria-busy={sending}>
                    {sending ? "Sending…" : "Send request"}
                    <span aria-hidden="true">→</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
