"use client";

import gsap from "gsap";
import { useRef, useState, type FormEvent } from "react";
import { Crane, Hanko } from "../art/Scenery";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function Newsletter() {
  const [state, setState] = useState<"idle" | "error" | "done">("idle");
  const [email, setEmail] = useState("");
  const stamp = useRef<HTMLDivElement>(null);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!EMAIL.test(email.trim())) {
      setState("error");
      return;
    }
    setState("done");
    requestAnimationFrame(() => {
      if (!stamp.current || !document.documentElement.classList.contains("motion")) return;
      gsap.fromTo(
        stamp.current,
        { scale: 1.8, rotate: -14, autoAlpha: 0 },
        { scale: 1, rotate: -6, autoAlpha: 1, duration: 0.32, ease: "power4.in" },
      );
    });
  };

  return (
    <section
      id="newsletter"
      aria-labelledby="newsletter-title"
      className="paper relative z-[60] -mt-[8vw] overflow-hidden pt-[calc(8vw+5rem)] pb-28 md:pb-36"
      style={{ clipPath: "polygon(0 0, 100% 8vw, 100% 100%, 0 100%)" }}
    >
      <div aria-hidden className="absolute right-[4vw] top-[20%] hidden w-[30vw] opacity-90 md:block" data-parallax="-0.3">
        <Crane className="w-full" fill="var(--ink)" />
      </div>
      <div className="relative mx-auto max-w-[1100px] px-5 md:px-10">
        <p className="label text-crimson">The Night Ledger · 夜の帳</p>
        <h2
          id="newsletter-title"
          data-reveal
          className="mt-4 max-w-[16ch] font-display text-[clamp(2.4rem,5.4vw,4.6rem)] leading-[1.02] font-extrabold text-ink"
        >
          One letter for every full moon.
        </h2>
        <p data-rise className="mt-5 max-w-[48ch] leading-relaxed text-ink/75">
          Release dates for each numbered lot, seasonal pressings that never leave Kyoto, and an invitation to the
          kura&apos;s winter night tasting. Thirteen letters a year — no more.
        </p>

        {state === "done" ? (
          <div className="relative mt-12 flex max-w-xl items-center gap-6 border-y-2 border-ink py-8" role="status">
            <div ref={stamp} className="shrink-0" style={{ transform: "rotate(-6deg)" }}>
              <Hanko className="h-20 w-20" chars={["記", "帳"]} />
            </div>
            <div>
              <p className="font-display text-2xl font-extrabold text-ink">Your name is in the ledger.</p>
              <p className="mt-2 text-ink/70">The next letter arrives with the next full moon.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="mt-12 max-w-2xl">
            <label htmlFor="email" className="label text-ink">
              Email address
            </label>
            <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-end">
              <input
                id="email"
                type="email"
                name="email"
                autoComplete="email"
                inputMode="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (state === "error") setState("idle");
                }}
                aria-invalid={state === "error"}
                aria-describedby="email-note"
                className="min-w-0 flex-1 border-b-2 border-ink bg-transparent py-3 font-display text-xl text-ink outline-none placeholder:text-ink/35 focus:border-crimson"
              />
              <button type="submit" className="btn btn-ink shrink-0">
                <span>Sign the ledger</span>
              </button>
            </div>
            <p id="email-note" className={`mt-4 text-sm ${state === "error" ? "font-medium text-crimson" : "text-ink/60"}`} aria-live="polite">
              {state === "error"
                ? "That address doesn't look right — please check it."
                : "By signing you confirm you are of legal drinking age. Unsubscribe with one click."}
            </p>
          </form>
        )}
      </div>
    </section>
  );
}
