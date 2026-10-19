import Moon from "../art/Moon";
import OniMask from "../art/OniMask";
import { cloudBand } from "../art/HeroScene";

const ROOFS =
  "M0,200 L0,120 L60,120 Q80,110 100,80 L200,80 Q220,110 240,120 L300,120 L300,140 L360,140 Q376,128 392,104 L470,104 Q486,128 502,140 L560,140 L560,96 L590,96 Q610,84 626,56 L734,56 Q750,84 770,96 L800,96 L800,130 L880,130 Q896,116 910,92 L1010,92 Q1024,116 1040,130 L1100,130 L1100,110 L1140,110 Q1160,96 1176,70 L1284,70 Q1300,96 1320,110 L1400,110 L1400,200 Z";

export default function Footer() {
  return (
    <footer className="relative overflow-clip bg-ink text-rice">
      {/* night stage: moon rising behind the rooftops */}
      <div className="relative h-[38rem] overflow-hidden bg-ink-2 md:h-[36rem]">
        <div aria-hidden="true" className="pointer-events-none absolute -right-32 top-[17rem] w-[26rem] md:right-[-6rem] md:top-10 md:w-[42rem]" data-parallax="0.35">
          <Moon className="w-full" />
        </div>
        <svg aria-hidden="true" viewBox="0 0 1400 200" preserveAspectRatio="xMidYMax slice" className="absolute inset-x-0 bottom-0 h-44 w-full md:h-60">
          <path d={cloudBand(860, 12, 460, 22)} fill="var(--ink)" opacity={0.35} />
          <path d={ROOFS} fill="var(--ink)" />
          <path d={ROOFS.replace(/ L1400,200 L0,200 Z$|L1400,200 Z$/, "")} fill="none" stroke="var(--steel)" strokeWidth={2} opacity={0.6} />
        </svg>
        <div className="relative mx-auto max-w-[1400px] px-4 pt-24 md:px-8 md:pt-32">
          <p data-reveal="slash" className="max-w-3xl font-display text-5xl font-extrabold leading-[1.02] hard-text md:text-8xl">
            The night is <span className="text-vermilion">just</span> beginning.
          </p>
        </div>
      </div>

      <div className="relative mx-auto max-w-[1400px] px-4 md:px-8">
        <div className="relative grid gap-10 border-t-2 border-gold pt-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <a href="#top" className="flex items-center gap-3">
              <OniMask className="w-14" detailed={false} />
              <span className="font-display text-4xl font-extrabold tracking-[0.18em]">ONI</span>
            </a>
            <p className="mt-4 max-w-xs text-rice/70">
              Late-night ramen &amp; izakaya. 9 Lantern Alley, under the Kōsen rail bridge.
            </p>
          </div>
          <nav aria-label="Footer">
            <p className="label mb-3 text-gold">Go</p>
            <ul className="space-y-1.5 text-lg">
              {[
                ["#menu", "Menu"],
                ["#story", "Story"],
                ["#chef", "Chef"],
                ["#visit", "Hours & map"],
                ["#reserve", "Reserve"],
              ].map(([h, l]) => (
                <li key={h}>
                  <a href={h} className="hover:text-vermilion">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div>
            <p className="label mb-3 text-gold">Hours</p>
            <p className="text-lg leading-relaxed">
              Tue–Thu 18:00–02:00
              <br />
              Fri–Sat 18:00–04:00
              <br />
              Sun 17:00–00:00
              <br />
              <span className="text-rice/50">Mon closed</span>
            </p>
          </div>
          <div>
            <p className="label mb-3 text-gold">Follow</p>
            <ul className="space-y-1.5 text-lg">
              <li>
                <a href="#top" className="hover:text-vermilion">
                  Instagram ↗
                </a>
              </li>
              <li>
                <a href="#top" className="hover:text-vermilion">
                  Newsletter ↗
                </a>
              </li>
              <li>
                <a href="tel:+15550140400" className="hover:text-vermilion">
                  +1 (555) 014-0400
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t-2 border-ink-2 py-6 text-sm text-rice/50 md:flex-row md:items-center md:justify-between">
          <p>© 2026 ONI Ramen &amp; Izakaya. Drink responsibly — the last train is at 00:42.</p>
          <p className="font-display text-base text-rice/70">夜はこれから</p>
        </div>
      </div>
    </footer>
  );
}
