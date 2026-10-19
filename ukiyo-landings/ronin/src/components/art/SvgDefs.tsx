/** Shared SVG filters/patterns referenced by url(#id) across the page. */
export function SvgDefs() {
  return (
    <svg
      width="0"
      height="0"
      aria-hidden="true"
      focusable="false"
      style={{ position: "absolute", width: 0, height: 0 }}
    >
      <defs>
        {/* rough, stamped edge for hanko seals */}
        <filter id="rough" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="2" seed="3" />
          <feDisplacementMap in="SourceGraphic" scale="5" />
        </filter>
        {/* dry-brush edge for ink strokes */}
        <filter id="brush" x="-5%" y="-20%" width="110%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.04 0.6" numOctaves="2" seed="11" />
          <feDisplacementMap in="SourceGraphic" scale="9" />
        </filter>
        {/* posterized mottling for the moon: noise → hard alpha threshold → clip to fill */}
        {[
          ["moonTexA", 8, "0.011", "0 0 0 1 1"],
          ["moonTexB", 21, "0.016", "0 0 0 0 0 1"],
          ["moonTexC", 3, "0.05", "0 0 0 0 0 0 0 1"],
        ].map(([id, seed, freq, table]) => (
          <filter key={id} id={String(id)} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency={String(freq)} numOctaves="4" seed={Number(seed)} result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1 0 0 0 0" result="m" />
            <feComponentTransfer in="m" result="t">
              <feFuncA type="discrete" tableValues={String(table)} />
            </feComponentTransfer>
            <feComposite in="SourceGraphic" in2="t" operator="in" />
          </filter>
        ))}
      </defs>
    </svg>
  );
}
