import { PortraitAkane, PortraitDaichi, PortraitRen } from "../art/portraits";
import SectionHead from "../SectionHead";

const ARTISTS = [
  {
    name: "Ren Kaneshiro",
    hori: "彫蓮",
    horiEn: "Hori-Ren",
    focus: "Dragons, backpieces & bodysuits",
    bio: "Twenty-two years at the needle. Ren works big: munewari bodysuits, dragons coiling from the shoulder blade down to the calf.",
    tags: ["Ryū", "Horimono", "Tebori"],
    since: "2003",
    Portrait: PortraitRen,
  },
  {
    name: "Akane Sato",
    hori: "彫茜",
    horiEn: "Hori-Akane",
    focus: "Koi, peony & botanical sleeves",
    bio: "Akane draws water as if it moves. Her koi climb waterfalls up the forearm and her peonies open across the ribs.",
    tags: ["Koi", "Botan", "Colour"],
    since: "2011",
    Portrait: PortraitAkane,
  },
  {
    name: "Daichi Okabe",
    hori: "彫大地",
    horiEn: "Hori-Daichi",
    focus: "Hannya, oni & black-and-grey",
    bio: "Masks, demons and the heavy black of sumi-e. Daichi still does his shading by hand, the tebori way.",
    tags: ["Hannya", "Black & grey", "Tebori"],
    since: "2008",
    Portrait: PortraitDaichi,
  },
];

function ScreenOrnament() {
  // ink-line clouds on gold leaf, like a folding screen
  return (
    <svg viewBox="0 0 300 360" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <g fill="none" stroke="var(--ink)" strokeWidth="2" opacity="0.22">
        <path d="M-10,60 a20,18 0 0 1 40,0 a26,22 0 0 1 52,0 a18,16 0 0 1 36,0 a14,12 0 0 1 -14,12 L4,72 a10,10 0 0 1 -14,-12 Z" />
        <path d="M180,300 a22,20 0 0 1 44,0 a30,26 0 0 1 60,0 a16,14 0 0 1 32,0 a14,12 0 0 1 -14,12 L194,312 a10,10 0 0 1 -14,-12 Z" />
        <path d="M200,40 a14,12 0 0 1 28,0 a20,18 0 0 1 40,0 a12,10 0 0 1 24,0" />
        <path d="M0,250 C40,240 60,262 100,250 C130,240 150,256 170,250" />
      </g>
      {/* screen panel folds */}
      <g stroke="var(--ink)" strokeWidth="2" opacity="0.28">
        <line x1="75" y1="0" x2="75" y2="360" />
        <line x1="150" y1="0" x2="150" y2="360" />
        <line x1="225" y1="0" x2="225" y2="360" />
      </g>
    </svg>
  );
}

export default function Artists() {
  return (
    <section id="artists" className="cut-rev relative z-20 bg-ink pb-28" aria-labelledby="artists-title">
      <div className="mx-auto max-w-[1500px] px-4 sm:px-8">
        <SectionHead
          no="02"
          kanji="彫師"
          label="The hands"
          title={
            <span id="artists-title">
              Three artists.
              <br />
              <span className="text-gold">Three disciplines of the needle.</span>
            </span>
          }
        />

        <ul className="mt-16 grid gap-10 md:grid-cols-3 md:gap-8">
          {ARTISTS.map((a, i) => (
            <li key={a.name} data-reveal className={`group ${i === 1 ? "md:mt-16" : ""}`}>
              <article className="relative">
                <div
                  aria-hidden="true"
                  className="absolute inset-0 aspect-[300/360] translate-x-[10px] translate-y-[10px] bg-crimson"
                  style={{ clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 34px), calc(100% - 34px) 100%, 0 100%)" }}
                />
                <div
                  className="glint relative aspect-[300/360] overflow-hidden bg-gold transition-transform duration-150 group-hover:-translate-x-1 group-hover:-translate-y-1"
                  style={{ clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 34px), calc(100% - 34px) 100%, 0 100%)" }}
                >
                  <ScreenOrnament />
                  <div className="absolute left-1/2 top-[14%] aspect-square w-[72%] -translate-x-1/2 rounded-full bg-crimson" />
                  <div className="absolute inset-x-0 bottom-0 top-[6%]">
                    <a.Portrait />
                  </div>
                  <span className="vertical absolute right-3 top-4 font-display text-3xl font-extrabold text-ink">{a.hori}</span>
                  <span className="label absolute bottom-4 left-4 bg-ink px-2 py-1 text-gold">Since {a.since}</span>
                </div>
                <div className="mt-7">
                  <p className="label text-vermilion">{a.horiEn}</p>
                  <h3 className="mt-1 font-display text-3xl font-extrabold text-rice">{a.name}</h3>
                  <p className="mt-1 font-narrow text-lg font-semibold uppercase tracking-wider text-gold">{a.focus}</p>
                  <p className="mt-3 leading-relaxed text-rice/75">{a.bio}</p>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {a.tags.map((t) => (
                      <li key={t} className="label border-2 border-rice/30 px-2 py-1 text-rice/80">
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
