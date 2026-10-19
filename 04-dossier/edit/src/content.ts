// All page copy and the video timeline live here.
// Copy comes from the dossier site (../src/content/site.ts). Captions follow the edit's format:
// "LABEL:" + two pre-broken lines, ALL CAPS, typed on dim -> bright.
//
// Timeline: times are seconds in the source edit (public/media/edit.mp4, 11.7 s, 60 fps). Only the
// ranges listed in scripts/build-frames.mjs exist as frames; a section maps its scroll progress onto
// one or more pieces of footage. Pieces may jump in time (that is a hard cut, like the edit's own).

export type Piece = {
  /** seconds in the source edit where this piece's scrub starts */
  from: number;
  /** seconds where it ends */
  to: number;
  /** share of the section's scroll this piece takes (pieces of a section add up to 1) */
  span: number;
  /** static frame used under prefers-reduced-motion while this piece is on screen */
  poster: number;
};

export type Segment = {
  pieces: Piece[];
  /** overall brightness of the footage behind this section */
  exposure: number;
  /** vignette strength (0 for the white/inverted grounds, whose edges are bright in the edit) */
  vignette: number;
  /** cover-crop focus on phones (0 = left edge of the frame, 1 = right edge) */
  focusMobile: number;
};

export type Caption = {
  label: string;
  lines: readonly [string, string];
};

export type ZonedCaption = Caption & {
  /** where the caption sits: top-left or bottom-right, the edit's two caption zones */
  zone: 'tl' | 'br';
  /** scroll progress inside the section where it starts typing */
  at: number;
  project?: { tags: string[]; links: { label: string; href: string }[] };
};

export const site = {
  title: 'Nazar Akanov — Software Engineer',
  first: 'NAZAR',
  last: 'AKANOV',
  handle: '@NAZARAKANOV',
  coords: '51.0893° N&nbsp;&nbsp;71.4171° E',
  credit: 'Visuals: edit by @pzxepitsu (TikTok) — demo only',
  copyright: '© 2026 Nazar Akanov — Astana, KZ',
};

/** 01: the eye swarm */
export const hero = {
  index: '01',
  label: 'THE SUBJECT',
  caption: { label: 'THE SUBJECT', lines: ['SOFTWARE ENGINEER.', 'ASTANA, KAZAKHSTAN.'] } as Caption,
  scrollCue: 'SCROLL',
  segment: {
    pieces: [{ from: 0.3, to: 1.38, span: 1, poster: 0.9 }],
    exposure: 1,
    vignette: 1,
    focusMobile: 0.42,
  } as Segment,
  /** muted autoplay loop shown before the first scroll (the swarm at full strength) */
  loop: { from: 0.3, to: 1.3 },
};

/** 02: liquid warp, speed-line title, rain, hands */
export const brief = {
  index: '02',
  label: 'THE BRIEF',
  caption: {
    label: 'THE BRIEF',
    lines: ["I'M NAZAR. I BUILD AI PRODUCTS END TO END,", 'FROM THE MODEL TO THE APP PEOPLE ACTUALLY TAP ON.'],
  } as Caption,
  segment: {
    pieces: [{ from: 1.4, to: 3.98, span: 1, poster: 1.85 }],
    exposure: 1,
    vignette: 1,
    focusMobile: 0.4,
  } as Segment,
};

/** 03: the quiet pause before the drop. The caption starts typing in the silence, like the edit's. */
export const pause = {
  index: '03',
  label: 'THE PAUSE',
  caption: {
    label: 'THE SUBJECT',
    lines: ['NAZAR AKANOV. SOFTWARE ENGINEER. ASTANA.', 'A FEW AI OLYMPIAD MEDALS. A HACKATHON WIN.'],
  } as Caption,
  segment: {
    pieces: [{ from: 4.0, to: 4.68, span: 1, poster: 4.3 }],
    exposure: 1.05,
    vignette: 1,
    focusMobile: 0.45,
  } as Segment,
};

/** 04: the drop and the "THE X:" caption collage. Top-left captions only start once the ground there
 *  is dark (from 5.65 s the frames carry a baked black corner where the edit's own caption was). */
export const file = {
  index: '04',
  label: 'THE FILE',
  steps: [
    {
      label: 'THE CODE',
      lines: ['AI PRODUCTS, BUILT END TO END.', 'FROM THE MODEL TO THE APP PEOPLE TAP ON.'],
      zone: 'br',
      at: 0.04,
    },
    {
      label: 'THE STACK',
      lines: ['TYPESCRIPT. REACT. NEXT.JS. THREE.JS.', 'NODE. POSTGRESQL. FLUTTER. GO.'],
      zone: 'tl',
      at: 0.44,
    },
    {
      label: 'GLASSBOX',
      lines: ['A GPT TRAINED FROM SCRATCH ON KAZAKH POETRY.', 'IT RUNS IN THE BROWSER. YOU CAN SEE THROUGH IT.'],
      zone: 'br',
      at: 0.58,
      project: {
        tags: ['PYTORCH', 'TYPESCRIPT', 'TRANSFORMERS', 'REACT'],
        links: [
          { label: 'OPEN', href: 'https://glassbox-fawn.vercel.app' },
          { label: 'CODE', href: 'https://github.com/Akanov-Kanta/glassbox' },
        ],
      },
    },
    {
      label: 'BARIWEB',
      lines: ['ONE SCRIPT TAG MAKES ANY SITE ACCESSIBLE.', 'AN AI AGENT USES THE SITE FOR YOU.'],
      zone: 'tl',
      at: 0.72,
      project: {
        tags: ['PYTHON', 'RAG', 'MILVUS', 'LLM AGENTS'],
        links: [{ label: 'OPEN', href: 'https://bariweb.vercel.app' }],
      },
    },
    {
      label: 'NISCOURSES',
      lines: ['THE PAPER SIGN-UP SHEETS ARE GONE.', 'A WHOLE SCHOOL ENROLLS LIVE, ON EVERY SCREEN.'],
      zone: 'br',
      at: 0.86,
      project: {
        tags: ['FLUTTER', 'DART', 'FIREBASE'],
        links: [{ label: 'CODE', href: 'https://github.com/Akanov-Kanta/Courses' }],
      },
    },
  ] as ZonedCaption[],
  segment: {
    pieces: [{ from: 4.7, to: 6.97, span: 1, poster: 6.5 }],
    exposure: 1,
    vignette: 0.6,
    focusMobile: 0.3,
  } as Segment,
};

/** 05: the clean ink burst, the burst as a window, then the black/white flip.
 *  The centre word flips between the two on scroll; the flip of the ground inverts it. */
export const question = {
  index: '05',
  label: 'THE QUESTION',
  words: ['ENGINEER?', 'ARTIST?'],
  captions: [
    {
      label: 'THE NOW',
      lines: ['BUILDING A WEB NFC CAMPUS APP. AND THIS SITE.', 'DIGGING INTO FINE-TUNING AND EVALUATION.'],
      zone: 'br',
      at: 0.6,
    },
    {
      label: 'THE PLACE',
      lines: ['ASTANA. 51.0893° N, 71.4171° E.', 'AFTER A FLEX YEAR IN GEORGIA, THE STATE.'],
      zone: 'tl',
      at: 0.8,
    },
  ] as ZonedCaption[],
  segment: {
    pieces: [
      { from: 7.02, to: 7.13, span: 0.3, poster: 7.08 }, // clean burst (held; the renderer pushes in)
      { from: 8.0, to: 8.55, span: 0.2, poster: 8.3 }, //  the burst becomes a window onto the figure
      { from: 8.58, to: 10.95, span: 0.5, poster: 10.1 }, // flip: black burst on white, inverted collage
    ],
    exposure: 1,
    vignette: 0,
    focusMobile: 0.42,
  } as Segment,
};

/** 06: wash to black, then the handle card (where the edit puts its own @PZXEPITSU) */
export const outro = {
  index: '06',
  label: 'THE END',
  caption: { label: 'THE CONTACT', lines: ['NAZARAKANOV@GMAIL.COM', 'ASTANA, KAZAKHSTAN. ASIA/ALMATY TIME.'] } as Caption,
  email: 'nazarakanov@gmail.com',
  links: [
    { label: 'GITHUB', href: 'https://github.com/akanov-kanta' },
    { label: 'LINKEDIN', href: 'https://www.linkedin.com/in/nazar-akanov-7554a92bb/' },
    { label: 'INSTAGRAM', href: 'https://www.instagram.com/akanov.nazar/' },
    { label: 'TELEGRAM', href: 'https://t.me/AkanovN' },
  ],
  segment: {
    pieces: [{ from: 10.95, to: 11.18, span: 1, poster: 11.18 }],
    exposure: 1,
    vignette: 1,
    focusMobile: 0.5,
  } as Segment,
};

export const ui = {
  soundOn: 'SOUND: ON',
  soundOff: 'SOUND: OFF',
  loading: 'LOADING FOOTAGE',
};
