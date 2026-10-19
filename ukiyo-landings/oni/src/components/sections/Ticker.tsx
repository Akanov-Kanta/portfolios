const WORDS = [
  ["Tonkotsu", "豚骨"],
  ["Open till 4 a.m.", "深夜"],
  ["Cold sake", "冷酒"],
  ["Charcoal yakitori", "焼鳥"],
  ["Lace gyoza", "餃子"],
  ["Twenty seats", "二十席"],
  ["Last train, first bowl", "終電"],
];

function Row() {
  return (
    <div className="flex shrink-0 items-center">
      {WORDS.map(([en, jp]) => (
        <span key={en} className="flex items-center gap-4 px-6">
          <span className="font-sans text-2xl font-bold uppercase tracking-[0.14em] text-ink md:text-3xl">{en}</span>
          <span className="font-display text-xl font-extrabold text-rice md:text-2xl">{jp}</span>
          <span className="ml-6 inline-block h-3 w-3 rotate-45 bg-ink" aria-hidden="true" />
        </span>
      ))}
    </div>
  );
}

/** Tilted vermilion band between hero and menu. */
export default function Ticker() {
  return (
    <div className="relative z-20 -my-8 overflow-x-clip md:-my-10" aria-hidden="true">
      <div className="-mx-[5%] -rotate-[2.5deg] border-y-4 border-ink bg-vermilion py-3 md:py-4">
        <div className="flex w-max animate-marquee">
          <Row />
          <Row />
        </div>
      </div>
    </div>
  );
}
