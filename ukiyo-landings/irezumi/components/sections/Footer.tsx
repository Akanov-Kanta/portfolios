import { Seigaiha } from "../art/scenery";
import Hanko from "../Hanko";

export default function Footer() {
  return (
    <footer className="relative z-[57] -mt-[var(--cut)] bg-ink" style={{ clipPath: "polygon(0 var(--cut), 100% 0, 100% 100%, 0 100%)" }}>
      <div className="pt-[var(--cut)]">
        <Seigaiha className="block h-20 w-full" />
      </div>
      <div className="mx-auto max-w-[1500px] px-4 pb-10 pt-16 sm:px-8">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-4">
              <Hanko chars="入墨彫師" size={64} />
              <p className="font-display text-3xl font-extrabold tracking-[0.25em]">IREZUMI</p>
            </div>
            <p className="mt-6 max-w-xs leading-relaxed text-rice/70">Japanese tattooing by hand and machine. Private studio, by appointment only.</p>
            <a href="#book" className="btn glint mt-8" style={{ ["--sh" as string]: "var(--crimson)" }}>
              Book a consultation
            </a>
          </div>
          <div>
            <p className="label text-gold">Studio</p>
            <address className="mt-4 not-italic leading-relaxed text-rice/80">
              2-14-7 Kitazawa, 3F
              <br />
              Setagaya-ku, Tokyo
              <br />
              155-0031, Japan
            </address>
          </div>
          <div>
            <p className="label text-gold">Hours</p>
            <ul className="mt-4 leading-relaxed text-rice/80">
              <li>Tue – Sat · 12:00 – 20:00</li>
              <li>Sun · consultations</li>
              <li>Mon · closed</li>
            </ul>
          </div>
          <div>
            <p className="label text-gold">Contact</p>
            <ul className="mt-4 grid gap-1 leading-relaxed">
              <li>
                <a className="text-rice/80 underline decoration-vermilion decoration-2 underline-offset-4 hover:text-rice" href="mailto:hello@irezumi.example">
                  hello@irezumi.example
                </a>
              </li>
              <li>
                <a className="text-rice/80 underline decoration-vermilion decoration-2 underline-offset-4 hover:text-rice" href="#top">
                  Instagram
                </a>
              </li>
              <li className="text-rice/80">+81 3-0000-0000</li>
            </ul>
          </div>
        </div>

        <p aria-hidden="true" className="display mt-20 select-none text-[clamp(4rem,19vw,19rem)] font-extrabold leading-[0.8] text-transparent" style={{ WebkitTextStroke: "2px var(--ink-2)" }}>
          IREZUMI
        </p>
        <div className="mt-8 flex flex-col gap-3 border-t-2 border-ink-2 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="label text-rice/50">© 2026 Irezumi Studio · All flash is original. Please don’t copy it.</p>
          <p className="label text-rice/50">
            <span className="font-display tracking-normal text-vermilion">一期一会</span> · one time, one meeting
          </p>
        </div>
      </div>
    </footer>
  );
}
