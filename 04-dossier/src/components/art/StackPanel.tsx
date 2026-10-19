/** "THE STACK" strip: the skills as an indexed grid on hairlines, a classified-terminal readout. */
export function StackPanel({ skills }: { skills: readonly string[] }) {
  return (
    <div className="caption relative grid h-full w-full grid-cols-4 grid-rows-2 max-md:grid-cols-2 max-md:grid-rows-4" style={{ textShadow: "none" }}>
      {skills.map((s, i) => (
        <div
          key={s}
          className="flex flex-col justify-between px-[8%] py-[6%] max-md:justify-center max-md:py-0"
          style={{
            borderTop: "1px solid rgba(240,240,240,0.18)",
            borderLeft: i % 4 ? "1px solid rgba(240,240,240,0.1)" : undefined,
          }}
        >
          <span className="max-md:hidden" style={{ fontSize: "max(10px, 0.62em)", opacity: 0.45, letterSpacing: "0.14em" }}>
            #{String(i + 1).padStart(2, "0")}
          </span>
          <span className="truncate" style={{ textShadow: "var(--glow-text)" }}>
            {s.toUpperCase()}
          </span>
        </div>
      ))}
    </div>
  );
}
