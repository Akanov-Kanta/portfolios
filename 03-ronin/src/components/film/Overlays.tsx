import { site } from "@/content";

/** Cold open: black, a blade stroke, one red flash frame, the title card, then the frame splits on the diagonal. */
export function ColdOpen() {
  return (
    <div className="intro" aria-hidden="true">
      <div className="intro-a" />
      <div className="intro-b" />
      <div className="intro-card">
        <p lang="ja" className="display text-[clamp(3.5rem,11vw,9rem)] text-rice">
          浪人
        </p>
        <p className="label mt-3 text-gold">A portfolio by {site.name}</p>
      </div>
      <svg className="intro-line" viewBox="0 0 100 100" preserveAspectRatio="none">
        <line x1="-5" y1="74" x2="105" y2="32" stroke="var(--rice)" strokeWidth="0.45" pathLength="1" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="intro-flash" />
    </div>
  );
}

/** Things that only exist while the film plays: letterbox, flash frame, the sword line of a cut, particles, shot counter. */
export function FilmChrome() {
  return (
    <div className="film-chrome" aria-hidden="true">
      <canvas className="film-particles" />
      <div className="film-blade" />
      <div className="film-flash" />
      <div className="letterbox letterbox-top" />
      <div className="letterbox letterbox-bottom" />
      <p className="film-counter label">
        <span className="film-counter-n">01</span>
        <span className="mx-2 inline-block h-px w-6 bg-current align-middle" />
        <span lang="ja" className="film-counter-k font-serif text-sm tracking-normal">
          月
        </span>
        <span className="film-counter-t ml-2">The moon roof</span>
      </p>
    </div>
  );
}
