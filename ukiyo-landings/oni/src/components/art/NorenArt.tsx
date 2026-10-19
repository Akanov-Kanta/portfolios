import { LanternGlyph } from "./Lantern";
import Steam from "./Steam";

/** The ONI shopfront at night: lit doorway, tanzaku menu tags, chef behind the counter, swaying noren. */
export default function NorenArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 520 660" className={className} aria-hidden="true">
      {/* facade with a diagonal cut top */}
      <path d="M0,70 L520,0 L520,660 L0,660 Z" fill="var(--ink)" />
      {/* pent roof */}
      <path d="M-10,120 L530,52 L530,92 L-10,160 Z" fill="var(--ink-2)" />
      <line x1={-10} y1={160} x2={530} y2={92} stroke="var(--steel)" strokeWidth={3} />
      {Array.from({ length: 14 }, (_, i) => {
        const x = 10 + i * 38;
        const y = 160 - (x + 10) * (68 / 540);
        return <circle key={i} cx={x} cy={y + 6} r={9} fill="var(--ink)" stroke="var(--ink-2)" strokeWidth={3} />;
      })}

      {/* doorway light + interior */}
      <rect x={110} y={186} width={300} height={474} fill="var(--gold)" />
      {/* chef behind the counter */}
      <g fill="var(--ink)">
        <path d="M200,500 C204,440 230,420 260,416 C290,420 316,440 320,500 Z" />
        <circle cx={260} cy={386} r={30} />
        <rect x={228} y={372} width={64} height={10} fill="var(--vermilion)" />
        <path d="M292,374 L320,360 L316,384 Z" fill="var(--vermilion)" />
      </g>
      {/* pot + steam */}
      <rect x={150} y={444} width={56} height={56} fill="var(--ink-2)" />
      <rect x={146} y={440} width={64} height={8} fill="var(--ink)" />
      <Steam x={136} y={300} width={90} height={140} color="var(--rice)" />
      {/* counter */}
      <rect x={90} y={500} width={340} height={26} fill="var(--ink-2)" />
      <line x1={90} y1={501} x2={430} y2={501} stroke="var(--rice)" strokeWidth={3} />
      <rect x={110} y={526} width={300} height={134} fill="var(--ink)" />
      {/* stools */}
      <g fill="var(--ink-2)">
        {[150, 240, 330].map((x) => (
          <g key={x}>
            <rect x={x} y={578} width={46} height={12} />
            <rect x={x + 8} y={590} width={6} height={70} />
            <rect x={x + 32} y={590} width={6} height={70} />
          </g>
        ))}
      </g>

      {/* noren rod */}
      <rect x={84} y={180} width={352} height={10} fill="var(--ink-2)" />
      <rect x={78} y={176} width={14} height={18} fill="var(--gold)" />
      <rect x={428} y={176} width={14} height={18} fill="var(--gold)" />
      {/* four noren panels */}
      {[0, 1, 2, 3].map((i) => (
        <g
          key={i}
          className="animate-sway"
          style={{ animationDuration: `${5 + i * 0.6}s`, animationDelay: `${-i * 0.9}s` }}
        >
          <rect x={102 + i * 79} y={190} width={76} height={150} fill="var(--ink-2)" />
          <rect x={102 + i * 79} y={190} width={76} height={14} fill="var(--ink)" />
        </g>
      ))}
      {/* crest across the middle panels */}
      <circle cx={260} cy={258} r={48} fill="none" stroke="var(--rice)" strokeWidth={7} />
      <text x={260} y={279} textAnchor="middle" fontSize={60} fill="var(--rice)" style={{ fontFamily: "var(--font-display)", fontWeight: 800 }}>
        鬼
      </text>
      <text x={260} y={328} textAnchor="middle" fontSize={14} letterSpacing={10} fill="var(--rice)" style={{ fontFamily: "var(--font-sans)", fontWeight: 700 }}>
        RAMEN · SAKE
      </text>

      {/* side lattice windows */}
      {[20, 446].map((x) => (
        <g key={x}>
          <rect x={x} y={420} width={56} height={150} fill="var(--gold)" />
          {[0, 1, 2, 3, 4].map((j) => (
            <rect key={j} x={x + 4 + j * 11} y={420} width={4} height={150} fill="var(--ink)" />
          ))}
        </g>
      ))}

      {/* lanterns */}
      <LanternGlyph x={0} y={168} scale={0.78} kanji="鬼" sway />
      <LanternGlyph x={440} y={160} scale={0.78} kanji="酒" sway />
    </svg>
  );
}
