import { Hanko } from "../art/Scenery";

const COLS = [
  { title: "The Range", links: [["Tsuki 月", "#range"], ["Hi 緋", "#range"], ["Kin 金", "#range"]] },
  { title: "The Kura", links: [["Heritage", "#heritage"], ["How it's made", "#craft"], ["Press", "#press"]] },
  { title: "Visit", links: [["Where to buy", "#buy"], ["Night Ledger", "#newsletter"], ["Back to top", "#top"]] },
];

export default function Footer() {
  return (
    <footer
      className="relative z-[70] -mt-[8vw] overflow-hidden bg-ink pt-[calc(8vw+4rem)] pb-10"
      style={{ clipPath: "polygon(0 8vw, 100% 0, 100% 100%, 0 100%)" }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-[0.18em] right-[-0.06em] select-none opacity-40 font-display text-[clamp(16rem,46vw,40rem)] leading-none font-extrabold text-transparent"
        style={{ WebkitTextStroke: "1.5px var(--gold)" }}
      >
        黒
      </div>
      <div className="relative mx-auto max-w-[1400px] px-5 md:px-10">
        <div className="grid gap-12 md:grid-cols-[minmax(0,1.3fr)_minmax(0,2fr)]">
          <div>
            <div className="flex items-center gap-4">
              <Hanko className="h-12 w-12" chars={["黒"]} />
              <span className="font-display text-3xl font-extrabold tracking-[0.32em]">KURO</span>
            </div>
            <p className="mt-6 max-w-[34ch] leading-relaxed text-rice/65">
              Kurosawa Shuzō · 黒沢酒造
              <br />
              Brewing in Fushimi, Kyoto since 1789.
            </p>
          </div>
          <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {COLS.map((c) => (
              <div key={c.title}>
                <h3 className="label text-gold">{c.title}</h3>
                <ul className="mt-4 space-y-3">
                  {c.links.map(([label, href]) => (
                    <li key={label}>
                      <a href={href} className="text-rice/80 transition-colors hover:text-gold">
                        {label.split(/([\u3000-\u9fff]+)/).map((part, i) =>
                          /[\u3000-\u9fff]/.test(part) ? (
                            <span key={i} className="font-display">
                              {part}
                            </span>
                          ) : (
                            part
                          ),
                        )}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <div className="mt-20 h-px bg-gold/40" />
        <div className="mt-6 flex flex-col gap-3 text-xs text-rice/50 sm:flex-row sm:justify-between">
          <p>Enjoy KURO responsibly. Not for sale to persons under the legal drinking age.</p>
          <p>KURO is a fictional brand — a design study. © 2026</p>
        </div>
      </div>
    </footer>
  );
}
