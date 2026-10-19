/** Section heading: numeral seal, big kanji, English label. */
export function SectionLabel({
  num,
  kanji,
  en,
  tone = "dark",
  id,
}: {
  num: string;
  kanji: string;
  en: string;
  tone?: "dark" | "light";
  id?: string;
}) {
  const fg = tone === "dark" ? "text-ink" : "text-rice";
  return (
    <div className="flex items-end gap-3 sm:gap-4" data-slash="">
      <span
        lang="ja"
        className="flex h-11 w-11 shrink-0 items-center justify-center bg-vermilion font-serif text-xl font-extrabold text-rice"
        aria-hidden="true"
      >
        {num}
      </span>
      <h2 id={id} className={`flex flex-wrap items-end gap-x-4 gap-y-2 ${fg}`}>
        <span lang="ja" className="display whitespace-nowrap text-[3.25rem] sm:text-7xl lg:text-8xl">
          {kanji}
        </span>
        <span className="label pb-1.5 text-[13px]">{en}</span>
      </h2>
    </div>
  );
}

/**
 * The blade line along a section's diagonal cut. --cut is 7vw, so the cut is always atan(0.07) = 4.004°;
 * the line is a flat bar rotated to match (scaled in from the left on scroll).
 */
export function CutLine({ color = "var(--ink)", reverse = false, width = 6 }: { color?: string; reverse?: boolean; width?: number }) {
  return (
    <span
      aria-hidden="true"
      data-cutline=""
      className="pointer-events-none absolute left-0 z-20 block w-[101%] origin-left"
      style={{
        top: reverse ? 0 : "var(--cut)",
        height: width,
        background: color,
        translate: "0 -50%",
        rotate: reverse ? "4.004deg" : "-4.004deg",
      }}
    />
  );
}
