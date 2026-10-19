import { InkCastle } from "./art/InkCastle";
import { Hanko } from "./Hanko";

export function Story() {
  return (
    <section id="story" className="relative overflow-hidden bg-rice pt-20 pb-32 text-ink md:pt-28 md:pb-44">
      <div className="mx-auto grid max-w-[1240px] grid-cols-1 gap-12 px-[6vw] md:grid-cols-12 md:gap-8 lg:px-10">
        <p
          lang="ja"
          className="vertical font-display hidden text-[1.5rem] font-extrabold tracking-[0.4em] text-crimson md:col-span-1 md:block"
        >
          第一章・赤い月
        </p>
        <div className="md:col-span-5">
          <p data-cut className="label text-crimson">The premise</p>
          <h2
            data-cut
            className="font-display mt-4 text-[clamp(2.2rem,4.6vw,3.9rem)] leading-[1.02] font-extrabold tracking-[-0.01em]"
          >
            The year the moon turned red, the shogun&apos;s oath died with him.
          </h2>
          <div data-cut className="mt-8 space-y-5 text-[1.12rem] leading-relaxed font-medium text-ink-2">
            <p>
              Edo, 1638 — in a history that never was. The heir to the shogunate is murdered on the night of
              the red moon, and every sworn blade in Japan is cut loose. Masterless. <em>Rōnin.</em>
            </p>
            <p>
              Hayato Kurogane was the heir&apos;s last guard. Branded a traitor and hunted by his own clan, he
              follows a trail of oni-masked killers north — through drowned rice fields, burning castles and
              seas of bamboo — toward the warlord who wears the demon&apos;s face.
            </p>
          </div>
          <dl data-cut className="mt-10 grid grid-cols-3 border-t-2 border-ink pt-5">
            {[
              ["6", "Provinces"],
              ["40+", "Duelists"],
              ["1", "Strike"],
            ].map(([n, l]) => (
              <div key={l}>
                <dt className="label text-[0.68rem] text-crimson">{l}</dt>
                <dd className="font-display text-[2.6rem] leading-none font-extrabold">{n}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="relative md:col-span-6">
          <div data-cut className="relative border-[3px] border-ink bg-rice" style={{ boxShadow: "12px 12px 0 var(--crimson)" }}>
            <InkCastle className="block h-auto w-full" />
            <Hanko chars="赤月" size={58} className="absolute right-4 top-4" tilt={3} />
          </div>
          <blockquote data-cut className="relative mt-12 border-l-[6px] border-vermilion pl-6 md:ml-10">
            <p className="font-display text-[1.45rem] leading-snug font-medium md:text-[1.7rem]">
              “A samurai without a master is a blade without a hand. Then let the blade decide.”
            </p>
            <footer className="label mt-3 text-crimson">— Hayato Kurogane</footer>
          </blockquote>
        </div>
      </div>
    </section>
  );
}
