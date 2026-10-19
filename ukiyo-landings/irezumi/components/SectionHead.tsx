/** Section heading: vertical kanji column + numbered label + big serif title. */
export default function SectionHead({
  no,
  kanji,
  label,
  title,
  tone = "dark",
  children,
  className = "",
}: {
  no: string;
  kanji: string;
  label: string;
  title: React.ReactNode;
  tone?: "dark" | "light";
  children?: React.ReactNode;
  className?: string;
}) {
  const fg = tone === "dark" ? "text-rice" : "text-ink";
  return (
    <div className={`flex items-start gap-5 sm:gap-8 ${className}`}>
      <div className="flex shrink-0 flex-col items-center gap-3 pt-1">
        <span className="label text-vermilion">{no}</span>
        <span className={`vertical font-display text-2xl font-extrabold sm:text-3xl ${tone === "dark" ? "text-gold" : "text-crimson"}`}>{kanji}</span>
        <span className="h-16 w-[2px] bg-vermilion" />
      </div>
      <div className="min-w-0">
        <p className={`label mb-4 ${tone === "dark" ? "text-gold" : "text-crimson"}`}>{label}</p>
        <h2 data-reveal className={`display text-[clamp(2.4rem,6.4vw,5.6rem)] font-extrabold ${fg}`}>
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}
