import { FlashDragon, FlashHannya, FlashKoi, FlashPeony, FlashTiger, FlashWave } from "../art/flash";
import { WindBars } from "../art/common";
import SectionHead from "../SectionHead";
import GalleryGrid, { FlashItem } from "./GalleryGrid";

const PIECES = [
  {
    id: "dragon",
    kanji: "龍",
    romaji: "Ryū",
    title: "Dragon",
    meaning: "Wisdom, strength and the power to bring rain. Ours carry the flaming pearl of truth in one claw.",
    artist: "Ren Kaneshiro",
    placement: "Backpiece · full sleeve",
    Art: FlashDragon,
  },
  {
    id: "koi",
    kanji: "鯉",
    romaji: "Koi",
    title: "Koi",
    meaning: "The carp that swims up the waterfall becomes a dragon. Perseverance, worn swimming upstream.",
    artist: "Akane Sato",
    placement: "Forearm · thigh",
    Art: FlashKoi,
  },
  {
    id: "tiger",
    kanji: "虎",
    romaji: "Tora",
    title: "Tiger",
    meaning: "Guardian of the north wind. Protection against illness, bad luck and evil spirits.",
    artist: "Ren Kaneshiro",
    placement: "Chest · upper back",
    Art: FlashTiger,
  },
  {
    id: "hannya",
    kanji: "般若",
    romaji: "Hannya",
    title: "Hannya mask",
    meaning: "Jealousy and grief turned demon. Worn to ward off evil, and as a warning to the wearer.",
    artist: "Daichi Okabe",
    placement: "Shoulder · calf",
    Art: FlashHannya,
  },
  {
    id: "peony",
    kanji: "牡丹",
    romaji: "Botan",
    title: "Peony",
    meaning: "The king of flowers. Wealth, daring, and a life lived without regret.",
    artist: "Akane Sato",
    placement: "Ribs · hip",
    Art: FlashPeony,
  },
  {
    id: "wave",
    kanji: "波",
    romaji: "Nami",
    title: "Wave",
    meaning: "The background that binds everything together. Strength, and the ebb and flow of a life.",
    artist: "Daichi Okabe",
    placement: "Sleeve filler · back",
    Art: FlashWave,
  },
];

export default function Gallery() {
  const items: FlashItem[] = PIECES.map(({ Art, ...p }) => ({ ...p, art: <Art />, duo: <Art duo /> }));
  return (
    <section id="flash" className="cut relative z-30 overflow-hidden bg-crimson pb-36 lg:pb-52" aria-labelledby="flash-title">
      <svg viewBox="0 0 400 100" className="pointer-events-none absolute right-0 top-[12vw] w-[44vw] opacity-90 art" aria-hidden="true">
        <WindBars bars={[[60, 10, 340, 14], [140, 36, 260, 10], [220, 58, 180, 10]]} />
      </svg>
      <div className="relative mx-auto max-w-[1500px] px-4 sm:px-8">
        <SectionHead
          no="03"
          kanji="下絵"
          label="Flash · drawn in the studio"
          title={
            <span id="flash-title">
              From the
              <br />
              drawing table.
            </span>
          }
        >
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-rice/85">
            Original designs, painted by hand. Every one is a starting point: we redraw it to your body before a single line
            is tattooed. Hover to see it as a print; open it to read what it means.
          </p>
        </SectionHead>
        <GalleryGrid items={items} />
      </div>
    </section>
  );
}
