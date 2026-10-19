/* Hand-built character silhouettes. viewBox 0 0 300 400, ground at y≈396. */

export function Kaede({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 300 400" className={className} aria-hidden="true">
      {/* white mane streaming behind */}
      <g fill="var(--rice)">
        <path d="M126 72c-6-28 24-46 50-38 38-4 76 18 100 52-18-6-32-4-40 2 30 18 54 52 60 90-20-18-42-26-56-26 22 28 30 62 22 96-14-26-34-42-52-48 8 28 4 56-10 76-6-30-18-54-34-68 0-28-6-68-16-98z" />
        <path d="M236 88l64-20-48 30zM262 248l26 44-34-38zM210 276l4 40-16-36zM276 86l22-34-14 40z" />
      </g>
      <g fill="var(--ink)">
        {/* sash streaming (under body) */}
        <circle cx="148" cy="82" r="18" />
        <path d="M138 98h28l-2 10h-24z" />
        <path d="M132 104h40l12 48-6 52h-50l-6-52z" />
        {/* arms raised: hasso-no-kamae, blade up and back */}
        <path d="M136 108l-26 32-4 18 14 4 8-18 22-26z" />
        <path d="M168 108l-24 34-30 16 4 10 34-16 26-34z" />
        <path d="M110 160l6-22 9 3-6 22z" />
        {/* hakama, deep lunge */}
        <path d="M126 200h54l18 60 48 120-50 6-30-96-16-8-30 48-32 56-38-6 54-80z" />
        <path d="M46 380l42 4v8H40zM196 384l52-4 2 12h-54z" />
      </g>
      <path d="M126 76c2-20 22-28 42-16-8 6-18 6-24 20-4-6-10-8-18-4z" fill="var(--rice)" />
      {/* vermilion obi tails */}
      <path d="M178 182c24 4 54-4 86 8-26 6-52 10-86 6zM180 192c18 8 40 8 58 22-22 0-40-6-60-12z" fill="var(--vermilion)" />
      <path d="M126 186h54v12h-54z" fill="var(--vermilion)" />
      {/* blade */}
      <ellipse cx="117" cy="141" rx="10" ry="4" transform="rotate(50 117 141)" fill="var(--ink)" />
      <path d="M112 136l7 5L26 20l-4-2z" fill="var(--steel)" />
      <path d="M119 141L26 20" stroke="var(--rice)" strokeWidth="2" />
      <g fill="none" stroke="var(--ink-2)" strokeWidth="2.2">
        <path d="M152 110l-2 80M140 210l-36 120M160 214l10 60M176 214l40 140" />
      </g>
      <path d="M172 104l12 48-6 52M180 200l18 60 48 120" fill="none" stroke="var(--crimson)" strokeWidth="3" />
    </svg>
  );
}

export function Gozan({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 300 400" className={className} aria-hidden="true">
      {/* spear trail */}
      <path d="M290 26C200 96 100 168 0 210v26C110 196 214 110 294 32z" fill="var(--vermilion)" />
      {/* embers */}
      <g fill="var(--vermilion)">
        <rect x="40" y="120" width="6" height="6" transform="rotate(20 43 123)" />
        <rect x="70" y="80" width="4" height="4" />
        <rect x="250" y="300" width="5" height="5" transform="rotate(40 252 302)" />
        <rect x="262" y="150" width="4" height="4" />
        <rect x="24" y="300" width="5" height="5" />
      </g>
      <g fill="var(--ink)">
        {/* kuwagata horns */}
        <path d="M150 72c-30-10-60-30-80-66 26 18 50 30 76 44z" />
        <path d="M150 72c30-10 60-30 80-66-26 18-50 30-76 44z" />
        {/* kabuto + shikoro */}
        <path d="M110 86q40-52 80 0l10 12H100z" />
        <path d="M100 98l-18-16 6 30zM200 98l18-16-6 30z" />
        <path d="M96 98h108l14 32H82z" />
        {/* sode — great shoulder plates */}
        <path d="M54 132l58-10 6 92-54 12z" />
        <path d="M246 132l-58-10-6 92 54 12z" />
        {/* dō */}
        <path d="M108 126h84l8 124h-100z" />
        {/* kusazuri */}
        <path d="M94 248h112l22 74H72z" />
        {/* legs */}
        <path d="M94 320h40l-6 72H78zM166 320h40l16 72h-50z" />
        <path d="M70 388h62v8H64zM168 388h62l4 8h-66z" />
        {/* forearms + fists on the shaft */}
        <path d="M190 206l22-54-12-8-24 54z" />
        <path d="M110 244l-10 46 12 4 14-48z" />
        <circle cx="205" cy="146" r="10" />
        <circle cx="104" cy="290" r="10" />
      </g>
      {/* line-work: tomoe swirl + lacing in indigo */}
      <g fill="none" stroke="var(--ink-2)" strokeWidth="3">
        <path d="M150 196a24 24 0 1 1-24-24 14 14 0 1 1 14 14" />
        <path d="M60 154l54-8M62 176l54-8M64 198l54-8M240 154l-54-8M238 176l-54-8M236 198l-54-8" />
        <path d="M86 272h128M80 296h140M112 250l-8 72M134 250l-4 72M166 250l4 72M188 250l8 72" />
        <path d="M92 110h116M88 120h124" />
      </g>
      {/* gold rim edges */}
      <g fill="none" stroke="var(--rice)" strokeWidth="2">
        <path d="M246 132l-10 104M150 72c30-10 60-30 80-66" />
      </g>
      {/* spear shaft + jumonji cross blade */}
      <path d="M24 398L268 58" stroke="var(--ink)" strokeWidth="7" />
      <path d="M262 64l8-8 26-40-18 46zM240 44l28 16 26 22-30-14z" fill="var(--rice)" />
      <path d="M270 56l26-40M240 44l54 38" stroke="var(--steel)" strokeWidth="1.5" />
      {/* oni menpō */}
      <path d="M124 96h52l8 22-10 24-24 10-24-10-10-24z" fill="var(--vermilion)" />
      <g fill="var(--ink)">
        <path d="M128 108l20 6-18 6zM172 108l-20 6 18 6z" />
        <path d="M126 102l22 6-1 3-22-5zM174 102l-22 6 1 3 22-5z" />
        <path d="M146 118h8l2 8h-12z" />
        <path d="M132 130q18 10 36 0l-4 12q-14 6-28 0z" />
      </g>
      <path d="M138 131l3 9 3-8zM162 131l-3 9-3-8z" fill="var(--rice)" />
      <path d="M150 72l-8 14h16z" fill="var(--gold)" />
    </svg>
  );
}

export function Ganryu({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 300 400" className={className} aria-hidden="true">
      {/* yumi + string */}
      <path d="M214 6c44 44 50 114 38 144 10 80-2 180-36 246" fill="none" stroke="var(--ink)" strokeWidth="7" strokeLinecap="round" />
      <path d="M214 6L142 140l74 256" fill="none" stroke="var(--ink)" strokeWidth="1.6" />
      <g fill="var(--ink)">
        {/* hood (kashira-zutsumi) */}
        <path d="M106 118c-4-32 16-46 32-44 18 2 26 18 22 46l-12 14-32 2z" />
        <path d="M108 124c-10 10-14 30-8 44l14-30z" />
        {/* bow arm */}
        <path d="M150 140l102 4 2 12-104 6z" />
        {/* draw arm, elbow back */}
        <path d="M118 148l-30-14 4-10 32 14z" />
        <path d="M90 126l52 8-2 12-50-8z" />
        {/* robe with deep sleeves */}
        <path d="M108 138h52l14 84 14 170H94l4-170z" />
        <path d="M94 136c-26 32-34 68-26 100l34-34z" />
        <path d="M156 160c18 20 26 44 22 72l-16-26z" />
        <path d="M92 392h34v6H88zM150 392h36l2 6h-38z" />
      </g>
      {/* arrow */}
      <path d="M128 140l170 10" stroke="var(--ink)" strokeWidth="3" />
      <path d="M298 150l-12-6 2 6-2 6z" fill="var(--ink)" />
      <path d="M128 140l14-8 6 9zM128 140l12 8 8-6z" fill="var(--vermilion)" />
      {/* prayer beads + rope belt */}
      <g fill="var(--rice)">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <circle key={i} cx={112 + i * 6} cy={154 + i * 7} r="2.6" />
        ))}
      </g>
      <path d="M100 226h72" stroke="var(--vermilion)" strokeWidth="6" />
      <path d="M168 228l8 26-10-2z" fill="var(--vermilion)" />
      <g fill="none" stroke="var(--ink-2)" strokeWidth="2.2">
        <path d="M124 240l-12 150M144 240l2 150M160 240l14 150" />
      </g>
    </svg>
  );
}
