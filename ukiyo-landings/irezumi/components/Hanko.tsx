/** Red square seal ("hanko") with rice-paper characters and a rough stamped edge. */
export default function Hanko({
  chars,
  size = 56,
  className = "",
  tilt = -6,
  tone = "vermilion",
}: {
  chars: string;
  size?: number;
  className?: string;
  tilt?: number;
  tone?: "vermilion" | "crimson";
}) {
  const list = Array.from(chars);
  return (
    <span
      aria-hidden="true"
      className={`inline-grid shrink-0 place-items-center ${className}`}
      style={{
        width: size,
        height: size,
        transform: `rotate(${tilt}deg)`,
        background: tone === "vermilion" ? "var(--vermilion)" : "var(--crimson)",
        filter: "url(#rough)",
        boxShadow: "inset 0 0 0 3px var(--rice), inset 0 0 0 5px currentColor",
        color: tone === "vermilion" ? "var(--vermilion)" : "var(--crimson)",
      }}
    >
      <span
        className={`grid font-display leading-none font-extrabold text-rice`}
        style={{
          fontSize: list.length >= 4 ? size * 0.32 : list.length === 2 ? size * 0.36 : size * 0.58,
          writingMode: list.length === 2 ? "vertical-rl" : undefined,
          direction: list.length >= 4 ? "rtl" : undefined,
          gridTemplateRows: list.length >= 4 ? "repeat(2, auto)" : undefined,
          gridAutoFlow: list.length >= 4 ? "column" : undefined,
        }}
      >
        {list.length >= 4 ? list.map((c, i) => <span key={i}>{c}</span>) : chars}
      </span>
    </span>
  );
}
