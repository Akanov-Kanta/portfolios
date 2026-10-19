"use client";

import Image from "next/image";
import { useState } from "react";
import { art } from "@/art";
import { site } from "@/content";
import { SectionLabel } from "../bits";
import { Hanko } from "../Hanko";
import { InkGarden } from "../InkGarden";
import { CulmRush, SpeedLines } from "./Motion";
import { Sprite } from "./Sprite";

/**
 * 六 · Shot 6, the rider: the rōnin gallops off through the bamboo mist. The visitor writes a letter
 * in the Ink Garden; the send button hands the words to their mail app.
 */
export function Shot6Rider() {
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);
  const mail = `mailto:${site.email}?subject=${encodeURIComponent("A letter from your portfolio")}&body=${encodeURIComponent(text)}`;

  return (
    <section id="contact" data-shot="s6" data-near="false" aria-labelledby="contact-h" className="shot shot-s6">
      <div className="layers">
        <Image src={art.s6Bg.src} alt="" width={art.s6Bg.width} height={art.s6Bg.height} quality={85} sizes="110vw" className="bg" data-f="s6-bg" />
        <CulmRush depth="far" />
        <SpeedLines className="speed-s6" />
        {/* a tracking shot: the camera keeps pace with the horse while the grove rushes past */}
        <div className="s6-rider" data-f="s6-rider">
          <div className="s6-bob">
            <Sprite name="gallop" className="s6-horse" />
          </div>
        </div>
        <CulmRush depth="near" />
      </div>

      <div className="s6-head paper hard-shadow" data-f="s6-head">
        <SectionLabel num="五" kanji="文" en="Contact" id="contact-h" />
        <p className="display mt-4 text-[clamp(1.5rem,3vw,2.7rem)] text-ink">{site.contactLine}</p>
        <ul className="s6-socials" aria-label="Elsewhere">
          {site.socials.map((s) => (
            <li key={s.label}>
              <a href={s.href} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-2 text-ink" aria-label={s.label}>
                <Hanko text={s.mark} size={40} color="var(--crimson)" className="transition-transform group-hover:-rotate-6" />
                <span className="label hidden text-[11px] sm:inline">{s.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className={`s6-letter ${focused ? "is-focused" : ""}`} data-f="s6-letter">
        <InkGarden
          className="s6-ink"
          palette="mist"
          mode="type"
          interactive
          inputId="letter"
          label="Write me a letter: type, and it grows in ink. Then press the send button."
          sizeFrac={0.3}
          maxWFrac={0.9}
          maxLength={120}
          onChange={setText}
          onFocusChange={setFocused}
        />
        {!text && (
          <p className="s6-prompt label text-ink/70" aria-hidden="true">
            <span lang="ja" className="font-serif text-lg text-crimson">筆</span> Click here and write — space cuts · ⌫ drops a flower · enter clears
          </p>
        )}
        <div className="s6-actions">
          <a href={mail} className="label hard-shadow bg-vermilion px-5 py-3.5 text-rice transition-transform duration-100 hover:-translate-y-0.5">
            Send by mail ↗
          </a>
          <a href={`mailto:${site.email}`} className="label border-2 border-ink bg-rice/70 px-4 py-3 text-ink hover:bg-ink hover:text-rice">
            {site.email}
          </a>
        </div>
      </div>
    </section>
  );
}
