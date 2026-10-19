// All page copy and the video timeline live here.
// Copy matches variant B (video/) so the variants can be compared side by side.
// Words wrapped in *asterisks* inside subtitle lines are highlighted in red.

export type Segment = {
  /** seconds in the source edit where this section's scrub starts */
  from: number;
  /** seconds where it ends */
  to: number;
  /** static frame used under prefers-reduced-motion */
  poster: number;
  /** overall brightness of the footage behind this section (0..1) */
  exposure: number;
  /** horizontal focus (0..1) of the cover crop when the screen is narrower than 16:9 (phones) */
  focusX: number;
  /** strength of the shader halftone screen on top of the footage (0..1) */
  halftone: number;
  /** fraction of the section's scroll range the scrub takes (rest holds the last frame) */
  scrubEnd?: number;
};

export const site = {
  title: 'Nazar Akanov — Student Developer',
  handle: '@NAZARAKANOV',
  credit: 'Visuals: edit by @.maisamu (TikTok)',
  music: 'Audio: “Binary Data” — HDN',
  copyright: '© 2026 Nazar Akanov — Astana, KZ',
  coords: '51.1694°N 71.4491°E',
};

export const hero = {
  index: '01',
  label: 'HERO',
  first: 'NAZAR',
  last: 'AKANOV',
  kicker: 'THE DEVELOPER:',
  subtitle: 'STUDENT DEVELOPER — ASTANA',
  scrollCue: 'SCROLL TO SCRUB',
  // Kaneki on the chair in front of the monitor wall
  segment: { from: 1.1, to: 3.55, poster: 1.6, exposure: 1.0, focusX: 0.5, halftone: 0.12 } as Segment,
  /** muted autoplay loop shown before the first scroll */
  loop: { from: 1.1, to: 3.5 },
  /** face-tracking box on the figure's head, in frame coordinates (0..1 of the 16:9 frame) */
  track: { u0: 0.458, u1: 0.552, v0: 0.29, v1: 0.45 },
};

export const about = {
  index: '02',
  label: 'ABOUT',
  file: 'SUBJECT FILE',
  blocks: [
    { title: 'THE STUDENT:', lines: ['COMPUTER SCIENCE IN *ASTANA*.', 'LEARNS BY SHIPPING, NOT BY WATCHING.'] },
    { title: 'THE CODE:', lines: ['BORN FROM *CURIOSITY*.', 'SHAPED BY DEADLINES.'] },
    { title: 'THE WORK:', lines: ['CAMPUS APPS, REALTIME TOOLS, AI BUILDERS —', 'FROM A NIGHT IDEA TO *PRODUCTION*.'] },
  ],
  /** big quoted words, swapped as the eye turns red */
  quote: ['STUDENT?', 'BUILDER.'],
  // glass dome inside the rings -> the red eye opens -> veins
  segment: { from: 4.3, to: 5.62, poster: 5.12, exposure: 1.0, focusX: 0.5, halftone: 0.18 } as Segment,
};

export const work = {
  index: '03',
  label: 'WORK',
  kicker: 'THE WORK:',
  heading: ['SELECTED', 'PROJECTS'],
  projects: [
    {
      name: 'QAIRU NFC',
      blurb: 'Campus NFC progressive web app. React on the front, NestJS behind it.',
      tags: ['React', 'NestJS', 'PWA'],
      href: '#',
    },
    {
      name: 'SAT BOARD',
      blurb: 'Realtime whiteboard. Many people, one canvas, no refresh button.',
      tags: ['TypeScript', 'Realtime', 'Canvas'],
      href: '#',
    },
    {
      name: 'BARIWEB',
      blurb: 'AI website builder. Describe the site, get a working first version.',
      tags: ['Next.js', 'AI', 'Builder'],
      href: '#',
    },
    {
      name: 'PORTFOLIO 3D',
      blurb: 'Infinite scroll world. A 3D loop you travel through instead of reading.',
      tags: ['R3F', 'Three.js', 'WebGL'],
      href: '#',
    },
  ],
  // red brutalist city: halftone close-up, then the figure in the canyon
  segment: { from: 6.42, to: 8.15, poster: 7.0, exposure: 0.92, focusX: 0.5, halftone: 0.1 } as Segment,
};

export const stack = {
  index: '04',
  label: 'STACK',
  kicker: 'THE STACK:',
  caption: ['TOOLS SHAPED BY USE.', 'NOT BY HYPE.'],
  items: ['REACT', 'NEXT.JS', 'NESTJS', 'FLUTTER', 'GO', 'TYPESCRIPT'],
  // red veins -> static -> red/white pixel-smear tunnel
  segment: { from: 5.62, to: 6.28, poster: 6.1, exposure: 0.9, focusX: 0.5, halftone: 0.16 } as Segment,
};

export const outro = {
  index: '05',
  label: 'CONTACT',
  kicker: 'THE END:',
  line: 'OPEN TO INTERNSHIPS, COLLABS AND STRANGE IDEAS.',
  links: [
    { label: 'GITHUB', href: '#' },
    { label: 'LINKEDIN', href: 'https://www.linkedin.com/in/nazarakanov' },
    { label: 'TELEGRAM', href: '#' },
  ],
  // halftone centipede curls into a spiral and turns red, then the set powers off
  segment: { from: 8.8, to: 11.12, poster: 10.6, exposure: 0.96, focusX: 0.22, halftone: 0.0, scrubEnd: 0.58 } as Segment,
  /** section progress where the CRT power-off starts / ends */
  powerOff: [0.6, 0.76] as [number, number],
};

export const ui = {
  soundOn: 'SOUND ON',
  soundOff: 'SOUND OFF',
  loading: 'TUNING SIGNAL',
  noSignal: 'NO SIGNAL',
};
