import { rng, r2 } from "@/lib/random";
import { Eye } from "./Eye";

/**
 * Procedural stand-in for an owner photo (strip panels, mask windows) when there is none: a grayscale,
 * manga-ish "eye close-up" crop. A posterized (hard-stop) radial highlight like blown-out skin, hatching
 * in the shadow side, long hair strands falling across, and a pair of large hand-drawn eyes cropped by
 * the strip edges. Seeded: each variant is a different crop.
 */
export function ProceduralCrop({ variant = 0, className = "" }: { variant?: number; className?: string }) {
  const R = rng(variant * 977 + 3);
  const flip = R.next() < 0.5;
  const eyeW = r2(R.range(34, 40));
  const gap = r2(eyeW * R.range(0.95, 1.1));
  const x0 = r2(flip ? R.range(4, 12) : R.range(22, 30));
  const hx = r2(flip ? R.range(70, 85) : R.range(10, 25));
  const hy = r2(R.range(25, 60));
  const strands = Array.from({ length: 14 }, () => {
    const sx = R.range(-5, 105);
    const ex = sx + R.range(-18, 18);
    return {
      d: `M${r2(sx)} -5 C${r2(sx + R.spread(14))} ${r2(R.range(20, 60))} ${r2(ex + R.spread(14))} ${r2(R.range(40, 80))} ${r2(ex)} 105`,
      w: r2(R.range(0.6, 2.4)),
      light: R.next() < 0.3,
    };
  });
  const shade = flip ? "90deg" : "270deg";

  return (
    <div
      aria-hidden
      className={`relative h-full w-full overflow-hidden ${className}`}
      style={{
        background: [
          // blown highlight, posterized into 4 tones
          `radial-gradient(ellipse 55% 140% at ${hx}% ${hy}%, #ececec 0 26%, #bdbdbd 26% 40%, #8a8a8a 40% 55%, transparent 55%)`,
          `linear-gradient(${shade}, #565656 0 35%, #2c2c2c 35% 70%, #121212 70% 100%)`,
        ].join(", "),
        filter: "contrast(1.12)",
      }}
    >
      {/* hatching on the shadow side */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "repeating-linear-gradient(-58deg, rgba(8,8,8,0.6) 0 1px, transparent 1px 6px)",
          maskImage: `linear-gradient(${shade}, transparent 25%, #000 75%)`,
          WebkitMaskImage: `linear-gradient(${shade}, transparent 25%, #000 75%)`,
        }}
      />
      {/* the eyes, close up: cropped by the strip edges */}
      {[0, 1].map((i) => (
        <Eye
          key={i}
          seed={variant * 10 + 21 + i}
          glow={false}
          className="absolute h-auto"
          style={{
            left: `${x0 + i * gap}%`,
            top: "50%",
            width: `${eyeW}%`,
            transform: `translateY(-50%) rotate(${r2(R.spread(5))}deg) scaleX(${i ? -1 : 1})`,
          }}
        />
      ))}
      {/* hair strands falling across, in front of the eyes */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {strands.map((s, i) => (
          <path
            key={i}
            d={s.d}
            fill="none"
            stroke={s.light ? "#d8d8d8" : "#080808"}
            strokeOpacity={s.light ? 0.45 : 0.7}
            strokeWidth={s.w}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      <div className="absolute inset-0" style={{ boxShadow: "inset 0 0 40px rgba(0,0,0,0.65)" }} />
    </div>
  );
}
