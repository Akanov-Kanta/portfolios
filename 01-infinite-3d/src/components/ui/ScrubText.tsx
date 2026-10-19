/**
 * Jitter-style scroll scrub: every word starts dim and lights up in reading order as the
 * paragraph scrolls into place. Pure CSS (view() timeline on the paragraph, one staggered range
 * per word); the text itself is plain and fully readable without it.
 */
export function ScrubText({ text, className = "" }: { text: string; className?: string }) {
  const words = text.split(" ");
  const n = Math.max(1, words.length - 1);
  return (
    <p className={`scrub ${className}`}>
      {words.map((w, i) => (
        <span key={i} className="scrub-word" style={{ ["--k" as string]: (i / n).toFixed(3) }}>
          {w}
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </p>
  );
}
