import MapArt from "../art/MapArt";
import HoursBoard from "./HoursBoard";

export default function Visit() {
  return (
    <section id="visit" className="rice-paper relative overflow-clip py-24 md:py-32">
      <p
        aria-hidden="true"
        className="vertical pointer-events-none absolute left-2 top-16 hidden font-display text-[10rem] font-extrabold leading-none text-ink/[0.06] md:block"
      >
        営業
      </p>
      <div className="relative mx-auto max-w-[1400px] px-4 md:px-8">
        <p data-reveal="cut" className="label mb-5 flex items-center gap-3 text-crimson">
          <span className="inline-block h-[3px] w-10 bg-crimson" /> Hours & place · 場所
        </p>
        <h2 className="font-display text-5xl font-extrabold leading-none md:text-7xl">
          <span data-reveal="slash" className="block">
            Find the red lantern.
          </span>
        </h2>

        <div className="mt-14 grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          <div className="space-y-10">
            <div data-reveal="slash" className="border-4 border-ink bg-ink text-rice shadow-[10px_10px_0_0_var(--crimson)]">
              <div className="flex items-center justify-between border-b-2 border-gold px-4 py-3">
                <h3 className="label text-gold">Opening hours</h3>
                <span className="font-display text-lg font-bold text-gold">営業時間</span>
              </div>
              <HoursBoard />
              <p className="border-t-2 border-gold px-4 py-3 text-base text-rice/75">
                Last ramen order 30 minutes before close. Counter seats are walk-in only.
              </p>
            </div>

            <address data-reveal="cut" className="grid gap-6 not-italic sm:grid-cols-2">
              <div>
                <p className="label mb-2 text-crimson">Address</p>
                <p className="text-xl font-semibold leading-snug">
                  ONI Ramen & Izakaya
                  <br />9 Lantern Alley
                  <br />
                  Under the Kōsen rail bridge, Eastside
                </p>
              </div>
              <div>
                <p className="label mb-2 text-crimson">Getting here</p>
                <p className="text-xl font-semibold leading-snug">
                  Kōsen-bashi station, exit 3 — four minutes on foot.
                </p>
                <p className="mt-3 text-lg">
                  <a href="tel:+15550140400" className="border-b-2 border-vermilion font-semibold hover:bg-vermilion">
                    +1 (555) 014-0400
                  </a>
                </p>
              </div>
            </address>
          </div>

          <div data-reveal="slash" className="relative">
            <div className="absolute inset-0 translate-x-3 translate-y-3 bg-vermilion md:translate-x-5 md:translate-y-5" aria-hidden="true" />
            <MapArt className="relative block w-full" />
          </div>
        </div>
      </div>
    </section>
  );
}
