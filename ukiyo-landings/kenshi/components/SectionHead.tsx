type Props = {
  index: string;
  label: string;
  title: React.ReactNode;
  kanji: string;
  tone?: "dark" | "light" | "red";
  id?: string;
};

/** Numbered label, slash-revealed serif title, and a vertical kanji tag. */
export function SectionHead({ index, label, title, kanji, tone = "light", id }: Props) {
  const muted = tone === "light" ? "text-ink/60" : "text-rice/70";
  const accent = tone === "red" ? "text-ink" : tone === "dark" ? "text-vermilion" : "text-crimson";
  const rule = tone === "red" ? "bg-ink" : "bg-vermilion";
  return (
    <div className="relative flex items-start gap-5 sm:gap-8">
      <p
        aria-hidden="true"
        className={`vertical font-display text-5xl font-extrabold leading-none sm:text-7xl ${accent}`}
      >
        {kanji}
      </p>
      <div className="min-w-0">
        <p className={`label mb-4 flex items-center gap-3 ${muted}`}>
          <span className={tone === "red" ? "text-ink" : "text-vermilion"}>{index}</span>
          <span data-slash-line className={`inline-block h-[2px] w-12 origin-left ${rule}`} />
          {label}
        </p>
        <h2 id={id} data-reveal="slash" className="font-display text-[clamp(2.3rem,5.2vw,4.6rem)] font-extrabold leading-[1.02]">
          {title}
        </h2>
      </div>
    </div>
  );
}
