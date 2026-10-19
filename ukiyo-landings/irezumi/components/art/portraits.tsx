/*
 * Artist portraits as ink profile silhouettes. viewBox 0 0 300 360, facing right unless
 * mirrored. Gold lines pick out the kimono collar, like the line-art in the reference frames.
 */

const ink = { fill: "var(--ink)" };
const gold = { fill: "none", stroke: "var(--gold)", strokeWidth: 3, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export function PortraitRen() {
  return (
    <svg viewBox="0 0 300 360" className="h-full w-full" aria-hidden="true">
      <path
        style={ink}
        d="M20,360 C30,300 70,276 112,266 L118,236 C100,226 88,200 88,170 C88,128 112,96 150,92 C186,90 210,110 216,140 C218,150 216,156 220,162 C226,170 236,180 238,186 C232,190 226,190 224,194 L228,202 C224,204 222,206 226,210 C230,224 226,246 214,262 C206,274 196,276 186,270 L182,276 C216,286 254,302 272,360 Z"
      />
      {/* chonmage topknot */}
      <path style={ink} d="M120,104 C132,82 166,70 204,80 C212,82 212,92 204,94 C178,90 156,96 138,110 Z" />
      <path style={gold} d="M150,86 L156,98" />
      {/* beard strands */}
      <path style={{ ...gold, stroke: "var(--ink-2)" }} d="M206,232 C204,246 200,256 192,264 M216,226 C216,242 212,254 206,264" />
      <path style={gold} d="M150,160 C140,154 134,170 144,180 M196,148 C204,144 212,146 216,150" />
      <path style={gold} d="M118,272 C150,300 176,330 190,360 M200,282 C196,312 190,336 186,360" />
      <path style={{ ...gold, strokeWidth: 2 }} d="M70,320 C90,330 110,340 120,360" />
    </svg>
  );
}

export function PortraitAkane() {
  return (
    <svg viewBox="0 0 300 360" className="h-full w-full" aria-hidden="true">
      <g transform="translate(300,0) scale(-1,1)">
        <path
          style={ink}
          d="M30,360 C44,310 80,290 116,284 C116,270 115,258 117,246 C99,234 87,210 88,180 C90,142 112,114 146,108 C180,104 206,122 212,150 C214,162 214,168 218,174 C224,182 230,188 230,192 C226,195 222,196 220,199 L223,206 C220,208 219,210 222,213 C222,224 214,234 200,240 C192,244 184,244 178,242 L176,264 C210,278 250,300 268,360 Z"
        />
        {/* bun */}
        <path style={ink} d="M98,136 C70,120 70,78 104,70 C138,64 154,92 142,116 Z" />
        <path style={ink} d="M84,112 C60,108 52,88 66,78 C76,72 90,80 92,96 Z" />
        {/* kanzashi pins with dangling ornaments */}
        <path style={{ ...gold, strokeWidth: 4 }} d="M110,82 L64,40 M124,90 L104,30" />
        <circle cx="62" cy="38" r="7" fill="var(--gold)" />
        <circle cx="103" cy="27" r="6" fill="var(--gold)" />
        <path style={gold} d="M62,46 L60,70 M56,46 L48,64 M68,46 L72,66" />
        <circle cx="60" cy="74" r="3.5" fill="var(--gold)" />
        <circle cx="47" cy="67" r="3" fill="var(--gold)" />
        <circle cx="73" cy="69" r="3" fill="var(--gold)" />
        <path style={gold} d="M150,170 C142,166 136,178 144,186 M198,158 C206,154 214,156 218,160" />
        {/* hair line over the ear */}
        <path style={{ ...gold, stroke: "var(--ink-2)" }} d="M112,140 C126,150 140,152 156,148" />
        {/* deep-set back collar (emon-nuki) */}
        <path style={gold} d="M118,292 C140,300 160,320 176,360 M178,268 C196,290 204,320 206,360" />
      </g>
    </svg>
  );
}

export function PortraitDaichi() {
  return (
    <svg viewBox="0 0 300 360" className="h-full w-full" aria-hidden="true">
      <path
        style={ink}
        d="M6,360 C16,298 58,266 106,256 L110,230 C94,216 86,194 86,166 C86,122 114,94 154,92 C192,92 216,116 220,148 C222,158 220,164 224,170 C232,180 240,188 240,194 C234,198 228,198 226,202 L228,210 C224,212 222,214 226,218 C224,232 216,242 200,246 C192,248 184,248 178,246 L180,260 C230,270 272,300 294,360 Z"
      />
      {/* hachimaki headband + flying tails */}
      <path fill="var(--rice)" d="M90,128 C130,120 180,116 216,124 L218,142 C180,134 130,138 88,148 Z" />
      <path fill="var(--rice)" d="M92,134 C66,120 46,128 18,112 C36,134 58,144 90,146 Z M94,142 C72,148 54,168 26,170 C50,178 74,170 96,152 Z" />
      <circle cx="96" cy="140" r="9" fill="var(--rice)" />
      <path style={gold} d="M150,168 C140,162 134,176 142,186 M198,156 C206,152 214,154 218,158" />
      <path style={gold} d="M110,262 C140,296 168,330 182,360 M196,270 C200,300 198,330 196,360 M40,320 C70,316 96,330 110,360" />
    </svg>
  );
}
