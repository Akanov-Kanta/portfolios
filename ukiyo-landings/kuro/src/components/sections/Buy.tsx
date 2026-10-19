import { Masu } from "../art/Objects";

const STOCKISTS = [
  { city: "Kyoto", jp: "京都", shop: "Kurosawa Kura — cellar door", area: "Fushimi", tag: "Tastings nightly" },
  { city: "Tokyo", jp: "東京", shop: "Tsukiyo Sakaya", area: "Kagurazaka", tag: "Full range" },
  { city: "New York", jp: "紐育", shop: "Ink & Rice Wine Merchants", area: "Lower East Side", tag: "Tsuki · Hi" },
  { city: "London", jp: "倫敦", shop: "The Lantern Cellar", area: "Clerkenwell", tag: "Full range" },
  { city: "Paris", jp: "巴里", shop: "Maison Nuit Blanche", area: "Le Marais", tag: "Kin allocation" },
  { city: "Singapore", jp: "星港", shop: "Moonwell Provisions", area: "Tiong Bahru", tag: "Tsuki · Kin" },
];

export default function Buy() {
  return (
    <section
      id="buy"
      aria-labelledby="buy-title"
      className="relative z-50 -mt-[8vw] bg-ink pt-[calc(8vw+5rem)] pb-28 md:pb-36"
      style={{ clipPath: "polygon(0 8vw, 100% 0, 100% 100%, 0 100%)" }}
    >
      <div className="mx-auto grid max-w-[1400px] gap-14 px-5 md:px-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] lg:gap-20">
        <div>
          <p className="label text-gold">Where to buy · 取扱店</p>
          <h2 id="buy-title" data-reveal className="mt-4 font-display text-[clamp(2.4rem,5vw,4.4rem)] leading-[1.02] font-extrabold">
            Find the moon in a cup.
          </h2>
          <p data-rise className="mt-5 max-w-[42ch] leading-relaxed text-rice/70">
            The Night Series is released in small numbered lots. Ask for it by name at these houses, or order direct
            from the kura — we ship to 24 countries, adult signature required.
          </p>
          <div data-reveal className="relative mt-10 max-w-[420px]">
            <div aria-hidden className="absolute inset-[8%] rounded-full bg-ink-2" />
            <Masu className="relative h-auto w-full" />
          </div>
          <div data-rise className="mt-8 flex flex-wrap gap-4">
            <a href="#newsletter" className="btn btn-gold">
              <span>Order direct</span>
            </a>
            <a href="#newsletter" className="btn btn-ghost">
              <span>Trade enquiries</span>
            </a>
          </div>
        </div>

        <div className="lg:pt-6">
          <div className="flex items-end justify-between border-b-2 border-gold pb-3">
            <span className="label text-gold">Stockist ledger</span>
            <span className="vertical-upright hidden font-display text-sm tracking-[0.4em] text-gold/70 sm:block">台帳</span>
          </div>
          <ul>
            {STOCKISTS.map((s) => (
              <li key={s.city} data-rise>
                <div
                  className="group relative grid grid-cols-[3.2rem_minmax(0,1fr)_auto] items-center gap-4 overflow-hidden border-b border-gold/30 py-5 sm:grid-cols-[4rem_minmax(0,1fr)_minmax(0,1fr)_auto] sm:gap-6"
                >
                  {/* slash highlight */}
                  <span
                    aria-hidden
                    className="absolute inset-0 -z-0 bg-gold transition-[clip-path] duration-300 ease-[cubic-bezier(.8,0,.2,1)] [clip-path:polygon(0_0,0_0,-20%_100%,-20%_100%)] group-hover:[clip-path:polygon(0_0,120%_0,100%_100%,-20%_100%)]"
                  />
                  <span className="relative font-display text-2xl font-bold text-gold transition-colors group-hover:text-ink">
                    {s.jp}
                  </span>
                  <span className="relative">
                    <span className="block font-display text-xl font-bold transition-colors group-hover:text-ink">
                      {s.city}
                    </span>
                    <span className="block text-sm text-rice/65 transition-colors group-hover:text-ink sm:hidden">{s.shop}</span>
                  </span>
                  <span className="relative hidden transition-colors group-hover:text-ink sm:block">
                    <span className="block">{s.shop}</span>
                    <span className="block text-sm text-rice/55 group-hover:text-ink/70">{s.area}</span>
                  </span>
                  <span className="label relative text-right text-[0.62rem]! text-rice/60 transition-colors group-hover:text-ink">
                    {s.tag}
                    <span aria-hidden className="ml-2">→</span>
                  </span>
                </div>
              </li>
            ))}
          </ul>
          <p className="label mt-6 text-[0.62rem]! leading-loose text-rice/50">
            Allocation is limited to two bottles of Kin per household. Please drink responsibly.
          </p>
        </div>
      </div>
    </section>
  );
}
