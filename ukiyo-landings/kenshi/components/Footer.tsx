import { Hanko } from "./art/Hanko";

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-ink text-rice">
      <div className="mx-auto grid max-w-[1300px] gap-12 px-5 pb-10 pt-20 sm:px-10 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-4">
            <Hanko glyph="剣士" size={64} />
            <p className="font-display text-3xl font-extrabold tracking-[0.3em]">KENSHI</p>
          </div>
          <p className="mt-6 max-w-[18rem] leading-relaxed text-rice/70">
            Kendō, iaidō and conditioning since 1998. Founded by Hayashi Ren in a timber warehouse at the edge of the grove.
          </p>
        </div>
        <div>
          <p className="label text-gold">Dojo</p>
          <address className="mt-4 not-italic leading-relaxed text-rice/80">
            14 Kiln Street
            <br />
            Bamboo District
            <br />
            Second floor, ring twice
          </address>
        </div>
        <div>
          <p className="label text-gold">Hours</p>
          <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-rice/80">
            <dt>Mon–Fri</dt>
            <dd className="tabular-nums">06:30–21:00</dd>
            <dt>Sat</dt>
            <dd className="tabular-nums">09:00–13:30</dd>
            <dt>Sun</dt>
            <dd className="tabular-nums">08:00–10:30</dd>
          </dl>
        </div>
        <div>
          <p className="label text-gold">Contact</p>
          <ul className="mt-4 space-y-1 text-rice/80">
            <li>
              <a className="hover:text-vermilion" href="mailto:dojo@kenshi.example">
                dojo@kenshi.example
              </a>
            </li>
            <li>
              <a className="hover:text-vermilion" href="#trial">
                Book a free class
              </a>
            </li>
            <li>
              <a className="hover:text-vermilion" href="#timetable">
                Timetable
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="relative mx-auto max-w-[1300px] px-5 sm:px-10">
        <p aria-hidden="true" className="select-none font-display text-[22vw] font-extrabold leading-[0.8] tracking-[0.02em] text-ink-2 lg:text-[17rem]">
          KENSHI
        </p>
        <p aria-hidden="true" className="vertical absolute right-5 top-0 font-display text-4xl font-extrabold text-crimson sm:right-10 sm:text-6xl">
          剣士
        </p>
      </div>
      <div className="label mx-auto flex max-w-[1300px] flex-col gap-2 border-t border-rice/15 px-5 py-6 text-rice/50 sm:flex-row sm:justify-between sm:px-10">
        <span>© KENSHI Dojo</span>
        <span>Bow in · Train hard · Bow out</span>
      </div>
    </footer>
  );
}
