import { useId } from "react";

const RIVER = "M-30,100 C150,150 250,220 330,290 C410,360 500,395 640,405";
const RAIL = "M-10,476 L620,77";
const label = { fontFamily: "var(--font-sans)", fontWeight: 700, letterSpacing: "0.18em" } as const;

function Pine({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill="var(--ink)">
      <rect x={-2} y={0} width={4} height={18} />
      <path d="M-18,4 C-18,-2 -8,-4 0,-2 C8,-4 18,-2 18,4 Z" />
      <path d="M-12,-6 C-12,-12 -4,-14 2,-12 C8,-14 14,-12 14,-6 Z" />
      <path d="M-6,-16 C-6,-21 0,-22 4,-20 C8,-22 10,-20 10,-16 Z" />
    </g>
  );
}

/** Stylised neighbourhood map: river in seigaiha, rail viaduct, station, shrine, park, walking route. */
export default function MapArt({ className }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 600 520" className={className} role="img" aria-label="Illustrated map: ONI sits under the rail viaduct on Lantern Alley, a four-minute walk from Kōsen-bashi station, on the south bank of the Kōsen river.">
      <defs>
        <pattern id={`sg${id}`} width={24} height={12} patternUnits="userSpaceOnUse">
          {[
            [12, 6],
            [0, 12],
            [24, 12],
          ].map(([cx, cy]) =>
            [11, 7.5, 4].map((r, i) => (
              <circle
                key={`${cx}-${cy}-${r}`}
                cx={cx}
                cy={cy}
                r={r}
                fill={i === 0 ? "var(--steel)" : "none"}
                stroke="var(--ink-2)"
                strokeWidth={1.2}
                opacity={0.9}
              />
            )),
          )}
        </pattern>
        <pattern id={`ht${id}`} width={8} height={8} patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <line x1={0} y1={0} x2={0} y2={8} stroke="var(--ink)" strokeWidth={1.6} opacity={0.35} />
        </pattern>
      </defs>

      <rect width={600} height={520} fill="var(--rice)" />

      {/* hatched blocks */}
      <g fill={`url(#ht${id})`} stroke="var(--ink)" strokeWidth={1.5}>
        <path d="M24,222 L150,214 L162,300 L30,312 Z" />
        <path d="M300,452 L420,440 L426,500 L306,512 Z" />
        <path d="M420,436 L520,428 L520,486 L430,494 Z" />
      </g>

      {/* river */}
      <path d={RIVER} fill="none" stroke="var(--ink)" strokeWidth={88} />
      <path d={RIVER} fill="none" stroke={`url(#sg${id})`} strokeWidth={80} />
      <text x={430} y={352} fontSize={13} fill="var(--rice)" transform="rotate(33 430 352)" style={label}>
        KŌSEN RIVER
      </text>

      {/* park */}
      <Pine x={40} y={48} />
      <Pine x={78} y={34} s={1.2} />
      <Pine x={116} y={52} s={0.9} />
      <text x={140} y={46} fontSize={11} fill="var(--ink)" style={label}>
        UME PARK
      </text>

      {/* roads */}
      <g fill="none" strokeLinecap="butt">
        {["M-10,470 L610,398", "M196,530 L236,-10", "M300,-10 C330,60 420,120 610,140", "M262,438 L262,352"].map((d, i) => (
          <g key={d}>
            <path d={d} stroke="var(--ink)" strokeWidth={i === 3 ? 12 : 18} />
            <path d={d} stroke="var(--rice)" strokeWidth={i === 3 ? 7 : 12} />
          </g>
        ))}
      </g>
      <text x={276} y={372} fontSize={10} fill="var(--ink)" style={{ ...label, writingMode: "vertical-rl" }}>
        LANTERN ALLEY
      </text>

      {/* rail viaduct */}
      <path d={RAIL} stroke="var(--ink)" strokeWidth={9} fill="none" />
      <path d={RAIL} stroke="var(--rice)" strokeWidth={4} strokeDasharray="12 12" fill="none" />
      <g transform="rotate(-32.35 300 285)">
        <rect x={236} y={274} width={128} height={22} fill="var(--ink)" />
        {[248, 268, 288, 308, 328, 348].map((x) => (
          <rect key={x} x={x} y={274} width={4} height={22} fill="var(--steel)" />
        ))}
      </g>

      {/* station */}
      <g transform="rotate(-32.35 110 406)">
        <rect x={82} y={394} width={56} height={24} fill="var(--ink)" />
        <text x={110} y={412} textAnchor="middle" fontSize={16} fill="var(--rice)" style={{ fontFamily: "var(--font-display)", fontWeight: 800 }}>
          駅
        </text>
      </g>
      <text x={14} y={372} fontSize={11} fill="var(--ink)" style={label}>
        KŌSEN-BASHI STN.
      </text>
      <text x={14} y={386} fontSize={10} fill="var(--ink)" opacity={0.7} style={label}>
        EXIT 3
      </text>

      {/* walking route */}
      <path
        d="M114,412 L120,460 L262,443 L262,362"
        fill="none"
        stroke="var(--vermilion)"
        strokeWidth={5}
        strokeDasharray="2 9"
        strokeLinecap="round"
      />
      <text x={40} y={502} fontSize={12} fill="var(--vermilion)" style={label}>
        4 MIN WALK
      </text>

      {/* shrine */}
      <g transform="translate(430 30)" fill="var(--vermilion)">
        <path d="M-26,-2 Q0,-10 26,-2 L28,-8 Q0,-18 -28,-8 Z" />
        <rect x={-20} y={4} width={40} height={5} />
        <rect x={-16} y={-2} width={5} height={36} />
        <rect x={11} y={-2} width={5} height={36} />
      </g>
      <text x={466} y={52} fontSize={11} fill="var(--ink)" style={label}>
        INARI SHRINE
      </text>

      {/* ONI pin */}
      <g transform="translate(262 348)">
        <circle r={22} fill="var(--vermilion)" className="pin-ring" />
        <circle r={22} fill="var(--vermilion)" className="pin-ring" style={{ animationDelay: "1.2s" }} />
        <rect x={-16} y={-16} width={32} height={32} fill="var(--vermilion)" stroke="var(--ink)" strokeWidth={2.5} />
        <text y={9} textAnchor="middle" fontSize={23} fill="var(--rice)" style={{ fontFamily: "var(--font-display)", fontWeight: 800 }}>
          鬼
        </text>
      </g>
      <g transform="translate(186 384)">
        <rect x={0} y={-14} width={58} height={22} fill="var(--ink)" />
        <text x={29} y={2} textAnchor="middle" fontSize={13} fill="var(--rice)" style={label}>
          ONI
        </text>
      </g>

      {/* compass */}
      <g transform="translate(556 482)">
        <circle r={24} fill="var(--rice)" stroke="var(--ink)" strokeWidth={2.5} />
        <path d="M0,-20 L7,4 L0,0 L-7,4 Z" fill="var(--vermilion)" />
        <path d="M0,20 L7,4 L0,0 L-7,4 Z" fill="var(--ink)" transform="rotate(180)" />
        <text y={-30} textAnchor="middle" fontSize={15} fill="var(--ink)" style={{ fontFamily: "var(--font-display)", fontWeight: 800 }}>
          北
        </text>
      </g>

      {/* frame */}
      <rect x={3} y={3} width={594} height={514} fill="none" stroke="var(--ink)" strokeWidth={6} />
    </svg>
  );
}
