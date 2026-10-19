import { Seigaiha } from "./art/Seigaiha";
import { Hanko } from "./Hanko";
import { WishlistButton } from "./WishlistButton";

const platforms = [
  { name: "PC", sub: "Steam · Epic" },
  { name: "PlayStation 5", sub: "Physical & digital" },
  { name: "Xbox Series X|S", sub: "Day one on Game Pass" },
  { name: "Nintendo Switch 2", sub: "Handheld duels" },
];

export function Release() {
  return (
    <section id="release" className="cut-top-rev relative overflow-hidden bg-crimson pb-0 text-rice">
      <span className="seam-glint" data-glint data-angle="4" style={{ top: "1px", width: "101%" }} />
      <div className="relative mx-auto grid max-w-[1320px] grid-cols-1 gap-12 px-[6vw] pb-24 md:grid-cols-12 lg:px-10">
        <div className="md:col-span-7">
          <p data-cut className="label text-rice">Release date</p>
          <div data-cut className="mt-4 flex items-start gap-5">
            <h2 className="font-display leading-[0.82] font-extrabold">
              <span className="block text-[clamp(4.4rem,13vw,11rem)] tracking-[-0.03em]" style={{ textShadow: "0.05em 0.05em 0 var(--ink)" }}>
                02·27
              </span>
              <span className="mt-5 block text-[clamp(2.4rem,6vw,5rem)] text-ink">2027</span>
            </h2>
            <p lang="ja" aria-hidden="true" className="vertical font-display mt-2 text-[1.3rem] font-extrabold tracking-[0.3em] text-ink">
              令和九年・如月
            </p>
          </div>
          <p data-cut className="font-display mt-8 max-w-[32rem] text-[1.3rem] leading-snug font-medium md:text-[1.5rem]">
            The red moon rises in late winter. Wishlist now and draw on day one.
          </p>
          <div data-cut className="mt-8 flex flex-wrap items-center gap-5">
            <WishlistButton />
            <Hanko chars="予約" size={58} tilt={-8} />
          </div>
        </div>

        <div className="md:col-span-5 md:pt-6">
          <p data-cut className="label text-rice">Platforms</p>
          <ul data-stagger className="mt-5 space-y-4">
            {platforms.map((p, i) => (
              <li
                key={p.name}
                className="flex flex-col items-start gap-1 border-[3px] border-ink bg-rice px-5 py-4 text-ink sm:flex-row sm:items-center sm:justify-between md:ml-[var(--off)]"
                style={{ boxShadow: "7px 7px 0 var(--ink)", ["--off" as string]: `${i * 4}%` }}
              >
                <span className="font-display text-[1.35rem] leading-none font-extrabold">{p.name}</span>
                <span className="label text-[0.64rem] text-crimson sm:text-right">{p.sub}</span>
              </li>
            ))}
          </ul>
          <p data-cut className="mt-6 text-[0.95rem] leading-snug text-rice/85">
            Rated M for blood, blades and demons. Single-player campaign, local versus duels, Japanese &amp;
            English voice.
          </p>
        </div>
      </div>
      <Seigaiha className="block h-[120px] w-full md:h-[150px]" />
    </section>
  );
}
