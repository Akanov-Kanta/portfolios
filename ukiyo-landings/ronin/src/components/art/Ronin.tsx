type RoninProps = {
  className?: string;
  body?: string;
  detail?: string;
  rim?: string;
  blade?: string;
};

/**
 * The rōnin Hayato: kasa hat, haori with streaming tails, wide hakama stance,
 * katana held low and out, saya at the hip. viewBox crops at the feet so the
 * element's bottom edge is the ground line.
 */
export function Ronin({
  className = "",
  body = "var(--ink)",
  detail = "var(--ink-2)",
  rim = "var(--steel)",
  blade = "var(--rice)",
}: RoninProps) {
  return (
    <svg viewBox="0 36 400 494" className={className} aria-hidden="true">
      <g fill={body}>
        {/* streaming haori tails + torn cloth */}
        <path data-cloth d="M156 120C128 128 96 128 58 120 40 116 26 112 6 118l38 10-38 16c34 8 64 10 94 6l-30 18c34 4 66-6 88-18z" />
        <path data-cloth d="M168 214c-28 12-58 18-98 14l22 12-40 12c40 6 78 2 114-14z" />
        <path d="M30 132l-22 4 12 6zM20 160l-18 10 20-2z" />
        {/* hair tie ribbon */}
        <path d="M190 96c-18-4-40 2-62-4 12 12 32 16 60 14z" />
        {/* kasa */}
        <path d="M200 44l92 48q4 7-6 7H114q-10 0-4-7z" />
        <path d="M184 98h32l-2 22h-28z" />
        {/* saya behind */}
        <path d="M170 224L54 300l8 8 116-72z" />
        {/* torso + arms */}
        <path d="M146 118h108l12 32-16 12-8 68h-78l-8-68-22-12z" />
        <path d="M148 122l-14 34-6 56 12 32 18-4-4-32 6-48z" />
        <path d="M250 120l18 36 28 42 14 40-16 8-18-38-26-40z" />
        {/* hakama */}
        <path d="M162 234h82l24 66 46 216-56 8-42-162-14-32-14 32-40 162-56-8 46-216z" />
        <path d="M88 514l62 6v8H84zM256 520l62-8 4 16h-66z" />
        {/* tsuka */}
        <path d="M296 248l-12-38 8-3 12 39z" />
      </g>
      <ellipse cx="301" cy="247" rx="11" ry="4.5" transform="rotate(-18 301 247)" fill={body} />
      {/* blade */}
      <path d="M298 252l9-4 77 270-3 6z" fill={blade} />
      <path d="M307 248l77 270" stroke={rim} strokeWidth="2.5" />
      {/* inner line-work: flat indigo, like cel shading lines */}
      <g fill="none" stroke={detail} strokeWidth="2.4" strokeLinecap="round">
        <path d="M200 50l-70 46M200 50l-34 46M200 50l34 46M200 50l70 46" />
        <path d="M200 122l-4 98M176 132l-6 86M226 132l6 86M160 160l-14 6M240 160l14 6" />
        <path d="M180 242l-30 260M196 242l-20 118M226 242l36 260M212 242l18 118" />
        <path d="M60 128c30 6 60 6 90 0M80 236c30 4 54 0 82-10" />
      </g>
      <path d="M162 222h82v12h-82z" fill={detail} />
      {/* rim light — the moon is behind him */}
      <g fill="none" stroke={rim} strokeWidth="3" strokeLinejoin="round">
        <path d="M200 44l92 48" />
        <path d="M254 118l12 32M268 156l28 42 14 40" />
        <path d="M244 234l24 66 46 216" />
      </g>
    </svg>
  );
}
