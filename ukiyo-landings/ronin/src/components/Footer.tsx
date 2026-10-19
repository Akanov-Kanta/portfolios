import { Hanko } from "./Hanko";

const links = [
  ["Story", "#story"],
  ["Clans", "#clans"],
  ["Combat", "#combat"],
  ["Trailer", "#trailer"],
  ["Release", "#release"],
];

export function Footer() {
  return (
    <footer className="relative bg-ink text-rice">
      <div className="h-2 bg-vermilion" />
      <div className="mx-auto grid max-w-[1320px] grid-cols-1 gap-10 px-[6vw] py-16 md:grid-cols-12 lg:px-10">
        <div className="flex items-start gap-5 md:col-span-5">
          <Hanko size={72} />
          <div>
            <p className="font-display text-[2.4rem] leading-none font-extrabold">RŌNIN</p>
            <p className="mt-3 max-w-[22rem] text-[1rem] leading-snug text-rice/70">
              A hand-inked samurai action game by Kagerō Works, a four-person studio drawing every frame by hand.
            </p>
          </div>
        </div>
        <nav aria-label="Footer" className="md:col-span-3">
          <p className="label text-gold">Chapters</p>
          <ul className="mt-4 space-y-2">
            {links.map(([l, h]) => (
              <li key={h}>
                <a href={h} className="font-display text-lg font-medium hover:text-vermilion">
                  {l}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="md:col-span-3">
          <p className="label text-gold">Press &amp; clan</p>
          <ul className="mt-4 space-y-2 text-[1rem] text-rice/80">
            <li>Press kit — on request</li>
            <li>Discord · Bluesky · YouTube</li>
            <li>hello@kagero.works</li>
          </ul>
        </div>
        <p lang="ja" aria-hidden="true" className="vertical font-display hidden text-[1.3rem] font-extrabold tracking-[0.35em] text-crimson md:col-span-1 md:block">
          月下に刃
        </p>
      </div>
      <div className="border-t border-rice/15">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-2 px-[6vw] py-6 text-[0.85rem] text-rice/55 md:flex-row md:justify-between lg:px-10">
          <p>© 2026 Kagerō Works. RŌNIN is a fictional game — a style study.</p>
          <p>All illustrations hand-built in SVG. No photos were harmed.</p>
        </div>
      </div>
    </footer>
  );
}
