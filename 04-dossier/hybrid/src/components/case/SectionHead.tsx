/** A section's mono header row on the grid: index · title · note · count, over a hairline. */
export function SectionHead({ index, title, note, count, id }: { index: string; title: string; note?: string; count?: string; id?: string }) {
  return (
    <div className="grid sec-head mono">
      <span className="sec-idx">{index}</span>
      <h2 id={id} className="sec-title">
        {title}
      </h2>
      {note ? <span className="sec-note">{note}</span> : null}
      {count ? <span className="sec-count">{count}</span> : null}
    </div>
  );
}
