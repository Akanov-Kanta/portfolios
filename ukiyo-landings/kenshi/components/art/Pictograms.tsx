import { blade, limb, type Pt } from "./geometry";

/*
 * Pictograms share one skeleton vocabulary: round-capped limbs of equal weight,
 * a disc head, a flat crimson sun behind. 200×200 viewBox.
 */

const W = 15; // limb weight

function Body({ parts }: { parts: [Pt, Pt, number?, number?][] }) {
  return (
    <>
      {parts.map(([a, b, wa = W, wb], i) => (
        <path key={i} d={limb(a, b, wa, wb ?? wa)} />
      ))}
    </>
  );
}

function Frame({ children, label, disc = [100, 100] as Pt }: { children: React.ReactNode; label: string; disc?: Pt }) {
  return (
    <svg viewBox="0 0 200 200" role="img" aria-label={label} className="h-full w-full">
      <circle cx={disc[0]} cy={disc[1]} r={78} fill="var(--crimson)" />
      <path d="M8 186 L 192 180" stroke="var(--ink)" strokeWidth={4} strokeLinecap="round" />
      <g fill="var(--ink)">{children}</g>
    </svg>
  );
}

/** Men-uchi: stepping in, shinai coming down onto the head. */
export function KendoPictogram() {
  const head: Pt = [104, 50];
  const chest: Pt = [100, 76];
  const hip: Pt = [90, 116];
  const hand: Pt = [140, 52];
  return (
    <Frame label="Pictogram: kendōka striking men">
      {/* shinai */}
      <path d={blade(hand, [192, 8], 6, 0)} fill="var(--ink)" />
      <circle cx={head[0]} cy={head[1]} r={15} />
      {/* men flap */}
      <path d="M90 46 L 82 70 L 98 64 Z" />
      {/* hakama: one flared wedge */}
      <path d="M78 112 L 104 112 L 140 176 L 118 180 L 92 140 L 70 182 L 44 178 Z" />
      <Body
        parts={[
          [hip, chest, 22, 20],
          [[106, 78], [128, 72]],
          [[128, 72], hand, 14, 13],
          [[96, 76], [124, 64]],
          [[124, 64], hand, 13, 12],
        ]}
      />
      <path d="M136 180 L 152 180" stroke="var(--ink)" strokeWidth={8} strokeLinecap="round" />
    </Frame>
  );
}

/** Nukitsuke: rising from tatehiza, the blade leaves the saya horizontally. */
export function IaidoPictogram() {
  const hip: Pt = [86, 132];
  const chest: Pt = [96, 92];
  const hand: Pt = [146, 96];
  return (
    <Frame label="Pictogram: iaidōka drawing the sword">
      {/* the arc of the cut */}
      <path d="M150 70 C 186 80 196 106 182 128" fill="none" stroke="var(--rice)" strokeWidth={5} strokeLinecap="round" />
      <path d={blade(hand, [196, 88], 6, -0.04)} />
      <circle cx={102} cy={66} r={15} />
      <Body
        parts={[
          [hip, chest, 24, 22],
          // kneeling back leg
          [hip, [66, 170], 18, 15],
          [[66, 170], [32, 172], 13, 10],
          // raised front knee
          [hip, [124, 134], 18, 16],
          [[124, 134], [128, 174], 15, 13],
          // sword arm
          [[100, 94], [124, 102]],
          [[124, 102], hand, 13, 12],
          // saya hand pulling back
          [[94, 96], [78, 114], 13],
          [[78, 114], [86, 128], 12],
        ]}
      />
      {/* saya */}
      <path d={limb([92, 126], [28, 140], 7, 6)} />
    </Frame>
  );
}

/** Mawashi-geri: the conditioning class, all hips. */
export function MmaPictogram() {
  const hip: Pt = [98, 116];
  const chest: Pt = [82, 78];
  return (
    <Frame label="Pictogram: fighter throwing a high kick">
      {/* motion lines */}
      <g stroke="var(--rice)" strokeWidth={5} strokeLinecap="round">
        <path d="M150 112 L 176 98" />
        <path d="M144 128 L 168 120" />
        <path d="M156 94 L 182 76" />
      </g>
      <circle cx={70} cy={54} r={15} />
      <Body
        parts={[
          [hip, chest, 24, 22],
          // standing leg
          [hip, [96, 146], 18, 16],
          [[96, 146], [92, 176], 15, 13],
          [[92, 176], [110, 178], 10, 9],
          // kicking leg, shin horizontal at head height
          [hip, [136, 94], 19, 16],
          [[136, 94], [178, 66], 15, 12],
          // guard
          [[82, 80], [66, 100], 13],
          [[66, 100], [60, 80], 12],
          [[88, 82], [104, 98], 13],
          [[104, 98], [94, 78], 12],
        ]}
      />
      {/* hand wraps */}
      <circle cx={60} cy={78} r={9} />
      <circle cx={94} cy={76} r={9} />
    </Frame>
  );
}

/** Rei — standing bow, sword held at the left hip. */
export function BowPictogram() {
  return (
    <svg viewBox="0 0 200 200" aria-hidden="true" className="h-full w-full">
      <circle cx={104} cy={92} r={78} className="fill-crimson lg:fill-ink" />
      <g fill="var(--rice)">
        {/* hakama: straight, still */}
        <path d="M80 108 L 108 108 L 120 182 L 98 182 L 94 140 L 90 182 L 68 182 Z" />
        {/* torso bowed ~35° */}
        <path d={limb([94, 112], [124, 78], 26, 22)} />
        <circle cx={140} cy={70} r={14} />
        {/* arm hanging along the thigh */}
        <path d={limb([122, 82], [122, 112], 12, 11)} />
        {/* sword in the left hand, tip trailing low behind */}
        <path d={limb([104, 112], [30, 136], 6, 5)} />
        <path d={limb([104, 112], [118, 108], 10, 9)} />
      </g>
      <path d="M14 186 L 186 184" stroke="var(--rice)" strokeWidth={4} strokeLinecap="round" />
    </svg>
  );
}
