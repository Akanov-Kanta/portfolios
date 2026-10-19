import Brush from "../art/Brush";
import NorenArt from "../art/NorenArt";
import Hanko from "../art/Hanko";

const BEATS = [
  {
    n: "一",
    title: "Under the bridge",
    body: "We took the last shopfront under the Kōsen viaduct — the one nobody wanted. A train passes overhead every eleven minutes and the sake cups tick against each other. Regulars stop hearing it after the second glass.",
  },
  {
    n: "二",
    title: "Twenty seats, one fire",
    body: "Eight stools at a hinoki counter, three tables, one tatami booth. A binchotan grill and one pot of pork-bone broth that has not gone cold since the night we opened.",
  },
  {
    n: "三",
    title: "The mask over the pass",
    body: "The red oni above the kitchen came from the chef's grandfather's festival in Akita. Oni chase bad luck out of the house. Here, it just keeps the night going.",
  },
];

const STATS = [
  ["18h", "broth on the fire"],
  ["20", "seats, 8 at the counter"],
  ["04:00", "last call Fri & Sat"],
  ["40+", "sakes behind the bar"],
];

export default function Story() {
  return (
    <section
      id="story"
      className="rice-paper relative overflow-clip pb-24 pt-32 md:pb-32 md:pt-44"
      style={{ clipPath: "polygon(0 0, 100% 5vw, 100% 100%, 0 100%)", marginTop: "-5vw" }}
    >
      <div className="mx-auto grid max-w-[1400px] gap-14 px-4 md:px-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-20">
        <div className="relative order-2 lg:order-1">
          <div data-reveal="slash" className="relative">
            <NorenArt className="w-full shadow-[14px_14px_0_0_var(--vermilion)]" />
          </div>
          <Hanko text="深夜営業" className="absolute -bottom-8 -right-2 w-24 rotate-6 md:w-28" />
        </div>

        <div className="order-1 lg:order-2">
          <p data-reveal="cut" className="label mb-5 flex items-center gap-3 text-crimson">
            <span className="inline-block h-[3px] w-10 bg-crimson" /> The place · 物語
          </p>
          <h2 className="font-display text-[2.6rem] font-extrabold leading-[1.02] md:text-7xl">
            <span data-reveal="slash" className="block">
              A bar that opens
            </span>
            <span data-reveal="slash" data-delay="0.1" className="block">
              when the city
            </span>
            <span className="relative mt-1 inline-block px-3 py-1">
              <Brush className="absolute -inset-x-5 -inset-y-1" />
              <span data-reveal="slash" data-delay="0.2" className="relative block text-rice">
                closes.
              </span>
            </span>
          </h2>

          <ol className="mt-12 space-y-10">
            {BEATS.map((b, i) => (
              <li key={b.n} data-reveal="slash" data-delay={String(i * 0.08)} className="grid grid-cols-[3.5rem_1fr] gap-4 md:gap-6">
                <span className="flex h-14 w-14 items-center justify-center bg-ink font-display text-3xl font-extrabold text-rice shadow-[4px_4px_0_0_var(--vermilion)]">
                  {b.n}
                </span>
                <div>
                  <h3 className="font-display text-2xl font-extrabold md:text-3xl">{b.title}</h3>
                  <p className="mt-2 max-w-xl text-lg leading-relaxed text-ink/80">{b.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <dl className="mx-auto mt-24 grid max-w-[1400px] grid-cols-2 border-y-4 border-ink px-4 md:mt-28 md:grid-cols-4 md:px-8">
        {STATS.map(([v, l], i) => (
          <div
            key={l}
            data-reveal="cut"
            data-delay={String(i * 0.06)}
            className={`flex flex-col gap-1 py-6 md:py-8 ${i % 2 ? "pl-5 md:pl-8" : "pr-5 md:pr-8"} ${
              i > 0 ? "md:border-l-2 md:border-ink md:pl-8" : ""
            } ${i % 2 ? "border-l-2 border-ink" : ""} ${i < 2 ? "border-b-2 border-ink md:border-b-0" : ""}`}
          >
            <dt className="order-2 label text-ink/70">{l}</dt>
            <dd className="order-1 font-display text-5xl font-extrabold text-crimson md:text-6xl">{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
