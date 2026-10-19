import Image from "next/image";
import { art, paintings } from "@/art";
import { site } from "@/content";

/** The end credits: they roll up over Yoshitoshi's moon, then the Great Wave carries the film back to the start. */
export function Credits() {
  return (
    <section id="credits" data-shot="cr" data-near="false" aria-labelledby="credits-h" className="shot shot-cr">
      <div className="layers">
        <Image src={art.pdMoon.src} alt="" width={art.pdMoon.width} height={art.pdMoon.height} quality={75} sizes="100vw" className="bg cr-moon" data-f="cr-moon" />
        <div className="cr-veil" aria-hidden="true" />
      </div>

      <div className="cr-roll" data-f="cr-roll">
        <p lang="ja" className="display text-[clamp(3rem,9vw,7rem)] text-rice" aria-hidden="true">
          浪人
        </p>
        <h2 id="credits-h" className="label mt-2 text-gold">
          Rōnin — a portfolio in six shots
        </h2>

        <dl className="cr-list">
          <div>
            <dt>Directed, written &amp; coded by</dt>
            <dd>{site.name}</dd>
          </div>
          <div>
            <dt>The rōnin, the oni &amp; the white horse</dt>
            <dd>Generated with gpt-image from one character sheet, keyed and composited by hand</dd>
          </div>
          <div>
            <dt>Ink Garden</dt>
            <dd>
              After{" "}
              <a href="https://type-garden.vercel.app" target="_blank" rel="noopener noreferrer">
                Type Garden
              </a>{" "}
              by Akshat Agarwal
            </dd>
          </div>
          <div>
            <dt>Paintings in the film · CC0 / Public Domain</dt>
            <dd>
              <ul className="space-y-2.5">
                {paintings.map((p) => (
                  <li key={p.url}>
                    <a href={p.url} target="_blank" rel="noopener noreferrer">
                      {p.artist}, <cite>{p.title}</cite>
                    </a>
                    <span className="block text-rice/60">
                      {p.date} · {p.museum}
                    </span>
                  </li>
                ))}
              </ul>
            </dd>
          </div>
          <div>
            <dt>Made with</dt>
            <dd>Next.js · GSAP · Lenis · Canvas 2D · Shippori Mincho &amp; Barlow Condensed</dd>
          </div>
        </dl>

        <p className="label mt-12 text-rice/70">© 2026 {site.name}</p>
        <p className="label mt-3 text-vermilion" data-loop-hint="">
          Keep scrolling — the film begins again
        </p>
      </div>
    </section>
  );
}

/** The wave that sweeps across between the credits and the first shot (film only). */
export function LoopWave() {
  return (
    <div className="loop-wave" aria-hidden="true" data-f="loop-wave" data-near="false">
      <Image src={art.pdWave.src} alt="" width={art.pdWave.width} height={art.pdWave.height} quality={75} sizes="140vw" className="h-full w-full object-cover" />
      <span className="loop-edge" />
    </div>
  );
}
