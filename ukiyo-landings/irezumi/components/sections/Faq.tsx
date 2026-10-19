"use client";

import { useState } from "react";
import SectionHead from "../SectionHead";

const QA = [
  {
    q: "Do you tattoo first-timers?",
    a: "Often. Plenty of our bodysuits began as someone’s first tattoo. We’ll usually suggest starting with a piece that can grow later: a koi on the forearm can become a sleeve.",
  },
  {
    q: "Can I bring my own design?",
    a: "Bring references, sketches, photos, anything. We won’t copy another artist’s tattoo, but we will draw something original in the same spirit and fit it to your body.",
  },
  {
    q: "Does tebori hurt more than the machine?",
    a: "Most clients say it hurts less, more of a rhythmic pressure than a buzz. It is slower, so sittings run longer. Colour packs in dense and heals soft.",
  },
  {
    q: "How long does a full sleeve take?",
    a: "Usually eight to fourteen sittings of three to five hours, spread over a year or so. Skin needs time to heal between colour passes.",
  },
  {
    q: "Can I go to an onsen with tattoos?",
    a: "Many Japanese bathhouses still turn away visible tattoos. We keep an updated list of tattoo-friendly onsen and sentō, and we’ll gladly share it.",
  },
  {
    q: "Do you do cover-ups?",
    a: "Yes. Dark backgrounds of waves, wind bars and clouds are made for it. Send clear photos with your request so we can judge what’s possible.",
  },
  {
    q: "How should I prepare for a sitting?",
    a: "Sleep well, eat a proper meal, skip alcohol the night before. Wear loose clothes that expose the area. We supply tea and the playlist.",
  },
];

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="cut fibers relative z-[56] bg-rice pb-28 text-ink" aria-labelledby="faq-title">
      <div className="relative mx-auto grid max-w-[1500px] gap-12 px-4 sm:px-8 lg:grid-cols-[0.8fr_1.2fr]">
        <SectionHead
          no="07"
          kanji="問答"
          label="Questions"
          tone="light"
          title={
            <span id="faq-title">
              Asked
              <br />
              <span className="text-crimson">and answered.</span>
            </span>
          }
        />
        <ul className="border-t-[3px] border-ink">
          {QA.map((item, i) => {
            const isOpen = open === i;
            return (
              <li key={item.q} className="border-b-[3px] border-ink">
                <h3>
                  <button
                    type="button"
                    id={`faq-q-${i}`}
                    aria-expanded={isOpen}
                    aria-controls={`faq-a-${i}`}
                    onClick={() => setOpen(isOpen ? null : i)}
                    className={`group flex w-full items-center gap-4 px-1 py-5 text-left transition-colors duration-100 ${isOpen ? "bg-ink px-4 text-rice" : "hover:bg-ink/5"}`}
                  >
                    <span className={`label w-8 shrink-0 ${isOpen ? "text-vermilion" : "text-crimson"}`}>{String(i + 1).padStart(2, "0")}</span>
                    <span className="flex-1 font-display text-xl font-extrabold sm:text-2xl">{item.q}</span>
                    <span aria-hidden="true" className="relative h-6 w-6 shrink-0">
                      <span className={`absolute left-0 top-1/2 h-[3px] w-6 -translate-y-1/2 ${isOpen ? "bg-vermilion" : "bg-ink"}`} />
                      <span className={`absolute left-1/2 top-0 h-6 w-[3px] -translate-x-1/2 transition-transform duration-200 ${isOpen ? "rotate-90 scale-y-0 bg-vermilion" : "bg-ink"}`} />
                    </span>
                  </button>
                </h3>
                <div id={`faq-a-${i}`} role="region" aria-labelledby={`faq-q-${i}`} className="acc-body" data-open={isOpen}>
                  <div>
                    <p className="max-w-2xl py-5 pl-13 pr-4 text-lg leading-relaxed text-ink/80">{item.a}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
