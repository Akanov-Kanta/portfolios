/** Sumi-e landscape: crimson sun, washed mountains, burning castle, pine, crows. */
export function InkCastle({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 600 560" className={className} aria-hidden="true">
      <circle data-depth="0.4" cx="420" cy="150" r="112" fill="var(--crimson)" />
      <g data-depth="0.25">
        <path d="M0 330L70 262l50 26 96-104 64 58 58-44 92 74 58-46 112 62V560H0z" fill="var(--wash-1)" />
        <path d="M216 184l-20 30 22-8 6 16 8-20 18 6zM458 248l-14 18 16-4 6 10 6-12 12 4z" fill="var(--rice)" />
      </g>

      {/* smoke columns drifting right */}
      <g data-depth="0.15" fill="var(--wash-2)">
        <path d="M262 240c-14-40 10-62 40-70 30-8 36-40 70-46 30-4 54 16 86 6-18 24-50 30-76 26-22 0-30 26-56 36-22 8-36 22-40 48z" />
        <path d="M300 196c20-18 54-16 70-34 14-16 40-20 62-10-24 4-36 22-52 34-22 16-50 10-80 10z" fill="var(--wash-3)" />
      </g>

      {/* mid hill */}
      <path d="M0 410c100-40 180-68 260-78 80-8 160 18 340 58V560H0z" fill="var(--wash-2)" />

      {/* castle */}
      <g>
        <path d="M196 336h148l-14-46H210z" fill="var(--wash-3)" />
        <path d="M210 312h120M216 300h108" stroke="var(--wash-2)" strokeWidth="2" />
        <g fill="var(--ink)">
          <rect x="222" y="258" width="96" height="32" />
          <path d="M204 264q18-6 24-20h84q6 14 24 20z" />
          <rect x="236" y="224" width="68" height="24" />
          <path d="M220 230q16-6 20-18h60q4 12 20 18z" />
          <rect x="248" y="194" width="44" height="22" />
          <path d="M234 200q14-6 18-18h36q4 12 18 18z" />
          <path d="M256 182l-4-10 6 4 4-4v10zM284 182l4-10-6 4-4-4v10z" />
          <path d="M256 244l14-12 14 12z" />
        </g>
        <g fill="var(--rice)">
          <rect x="232" y="268" width="6" height="10" />
          <rect x="252" y="268" width="6" height="10" />
          <rect x="282" y="268" width="6" height="10" />
          <rect x="302" y="268" width="6" height="10" />
          <rect x="248" y="230" width="5" height="9" />
          <rect x="287" y="230" width="5" height="9" />
        </g>
        {/* fire */}
        <g data-flame>
          <path d="M296 262c-8-26 6-34 2-62 18 18 26 34 20 62zM230 262c-10-20-2-38-10-58 20 14 26 34 22 58z" fill="var(--crimson)" />
          <path d="M300 258c-2-16 4-22 4-38 8 10 12 22 8 38zM226 258c-4-12 0-22-4-34 10 8 14 20 12 34z" fill="var(--vermilion)" />
          <path d="M262 196c-6-26 10-44 6-70 22 22 30 50 18 70z" fill="var(--crimson)" />
          <path d="M268 192c-2-18 6-28 6-44 10 14 12 30 6 44z" fill="var(--vermilion)" />
        </g>
      </g>

      {/* crows */}
      <g fill="var(--ink)" data-depth="0.5">
        <path d="M120 120l14 6 10-8-6 12 14 2-16 2-6 10-2-12z" />
        <path d="M160 92l10 4 8-6-4 9 10 1-12 2-4 7-2-9z" />
        <path d="M96 150l8 3 6-5-3 7 8 1-9 1-3 6-2-7z" />
      </g>

      {/* foreground ground + pine */}
      <path d="M0 470c150-36 300-24 600-50V560H0z" fill="var(--ink)" />
      <g fill="var(--ink)">
        <path d="M70 560c14-60 6-110 34-160 18-32 50-52 58-86l10 4c-8 40-40 62-56 92-22 42-12 92-28 150z" />
        <path d="M100 440c-20-10-40-6-60-14l2-8c22 6 40 4 62 12zM150 340c22-12 50-12 70-26l6 6c-22 16-48 16-72 28z" />
        <path d="M2 418c10-22 40-30 66-26 22 4 40-6 58 4 14 8 10 24-6 26H10c-12 0-14-2-8-4z" />
        <path d="M112 324c14-22 46-26 70-18 18 6 34 2 46 12 10 10 2 22-12 22h-98c-10 0-12-8-6-16z" />
        <path d="M176 290c10-16 34-18 52-12 14 4 26 4 34 12 6 8 0 16-10 16h-70c-8 0-10-8-6-16z" />
      </g>
      <g stroke="var(--wash-3)" strokeWidth="2" fill="none">
        <path d="M20 426l12-14M40 426l12-16M60 426l12-16M80 426l12-16M100 426l12-14" />
        <path d="M130 334l12-14M150 334l12-16M170 334l12-16M190 334l12-16M210 334l12-14" />
        <path d="M190 300l10-12M210 300l10-14M230 300l10-12" />
      </g>
    </svg>
  );
}
