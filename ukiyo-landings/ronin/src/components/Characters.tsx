import type { ReactNode } from "react";
import { Ronin } from "./art/Ronin";
import { Gozan, Ganryu, Kaede } from "./art/Characters";
import { Moon } from "./art/Moon";
import { Bamboo } from "./art/Bamboo";
import { Hanko } from "./Hanko";

type Character = {
  name: string;
  kanji: string;
  role: string;
  clan: string;
  weapon: string;
  line: string;
  bg: string;
  art: ReactNode;
  backdrop?: ReactNode;
  kanjiColor: string;
};

const cast: Character[] = [
  {
    name: "Hayato Kurogane",
    kanji: "黒鉄隼人",
    role: "The Rōnin",
    clan: "None — cast out of House Asagiri",
    weapon: "Nodachi “Kuroame”",
    line: "The heir’s last guard. Every clan wants his head; he only wants one.",
    bg: "bg-crimson",
    kanjiColor: "text-rice",
    backdrop: <Moon className="absolute left-1/2 top-[44%] w-[78%] -translate-x-1/2 -translate-y-1/2" />,
    art: <Ronin className="h-[92%] w-auto" />,
  },
  {
    name: "Shirayuki no Kaede",
    kanji: "白雪楓",
    role: "The Snow Blade",
    clan: "Yukimura — the northern frost clan",
    weapon: "Katana “Tsukikage”",
    line: "White-haired, half-legend, fastest draw in six provinces. Ally — until she isn’t.",
    bg: "bg-ink-2",
    kanjiColor: "text-rice",
    backdrop: (
      <Moon tone="crimson" className="absolute left-[52%] top-[42%] w-[80%] -translate-x-1/2 -translate-y-1/2" />
    ),
    art: <Kaede className="h-[92%] w-auto" />,
  },
  {
    name: "Gōzan the Oni-Daimyō",
    kanji: "鬼大名剛山",
    role: "The Antagonist",
    clan: "Onibi — the demon-fire clan",
    weapon: "Jūmonji-yari, cross-bladed spear",
    line: "He wears the red oni mask so no one remembers the man beneath. No one living does.",
    bg: "gold-leaf",
    kanjiColor: "text-ink",
    art: <Gozan className="h-[94%] w-auto" />,
  },
  {
    name: "Ganryū",
    kanji: "岩流",
    role: "The Mountain Monk",
    clan: "Sōhei of Mount Kurama",
    weapon: "Yumi longbow & naginata",
    line: "A warrior-monk who counts his arrows like prayers. He has never needed two.",
    bg: "bg-rice",
    kanjiColor: "text-crimson",
    backdrop: (
      <div className="absolute inset-0">
        <Bamboo
          width={300}
          height={400}
          className="h-full w-full"
          stalks={[
            { x: 20, w: 8, tone: "var(--wash-1)", lean: 1 },
            { x: 70, w: 12, tone: "var(--wash-2)", lean: -1, leaves: true },
            { x: 190, w: 9, tone: "var(--wash-1)", lean: 2, leaves: true },
            { x: 250, w: 16, tone: "var(--wash-2)", lean: -2 },
            { x: 280, w: 22, tone: "var(--wash-3)", lean: 1 },
          ]}
        />
      </div>
    ),
    art: <Ganryu className="h-[92%] w-auto" />,
  },
];

export function Characters() {
  return (
    <section id="clans" className="cut-top relative overflow-x-clip bg-ink pb-28 md:pb-36">
      <span className="seam-glint" data-glint data-angle="-4" style={{ top: "calc(var(--cut) - 1px)", width: "101%" }} />
      <div className="mx-auto max-w-[1320px] px-[6vw] lg:px-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p data-cut className="label text-gold">The cast</p>
            <h2
              data-cut
              className="font-display mt-4 text-[clamp(2.4rem,5.4vw,4.6rem)] leading-[0.98] font-extrabold text-rice"
            >
              Four blades.
              <br />
              <span className="text-vermilion">One red moon.</span>
            </h2>
          </div>
          <p data-cut className="max-w-[26rem] text-lg leading-snug text-rice/80">
            Every duelist is learnable, every one is lethal. Study their stances, or meet them in the dark and
            find out.
          </p>
        </div>

        <ul data-stagger className="mt-14 grid grid-cols-1 gap-10 sm:grid-cols-2 xl:grid-cols-4 xl:gap-6">
          {cast.map((c) => (
            <li key={c.name} className="card group relative">
              <div
                className="border-[3px] border-rice bg-ink"
                style={{ boxShadow: "10px 10px 0 var(--crimson)" }}
              >
                <div className={`card-art aspect-[3/4] ${c.bg}`}>
                  {c.backdrop}
                  <div className="card-fig absolute inset-0 flex items-end justify-center">{c.art}</div>
                  <p
                    lang="ja"
                    aria-hidden="true"
                    className={`vertical font-display absolute left-3 top-3 text-[1.35rem] leading-none font-extrabold ${c.kanjiColor}`}
                  >
                    {c.kanji}
                  </p>
                  <span className="label absolute right-0 top-4 bg-ink px-3 py-1.5 text-[0.68rem] text-rice">
                    {c.role}
                  </span>
                </div>
                <div className="relative border-t-[3px] border-rice p-5">
                  <h3 className="font-display text-[1.55rem] leading-tight font-extrabold text-rice">{c.name}</h3>
                  <dl className="mt-3 space-y-2 text-[0.98rem] leading-snug">
                    <div className="flex gap-3">
                      <dt className="label w-16 shrink-0 pt-[3px] text-[0.66rem] text-gold">Clan</dt>
                      <dd className="text-rice/90">{c.clan}</dd>
                    </div>
                    <div className="flex gap-3">
                      <dt className="label w-16 shrink-0 pt-[3px] text-[0.66rem] text-gold">Weapon</dt>
                      <dd className="text-rice/90">{c.weapon}</dd>
                    </div>
                  </dl>
                  <p className="mt-4 border-t border-rice/25 pt-4 text-[0.98rem] leading-snug text-rice/70">
                    {c.line}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-16 flex items-center gap-4">
          <Hanko chars="四刃" size={44} />
          <p className="label text-rice/70">More duelists revealed before launch</p>
        </div>
      </div>
    </section>
  );
}
