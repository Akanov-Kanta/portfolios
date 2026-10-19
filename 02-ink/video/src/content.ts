// All page copy and the video timeline live here.
// Words wrapped in *asterisks* inside subtitle lines are highlighted in red
// (the source edit does the same with single words).

export type Segment = {
  /** seconds in the source edit where this section's scrub starts */
  from: number;
  /** seconds where it ends */
  to: number;
  /** static frame used under prefers-reduced-motion */
  poster: number;
  /** overall brightness of the footage behind this section (0..1) */
  exposure: number;
  /** 1 = invert the footage (turns white-paper ink frames into white ink on black) */
  invert?: number;
};

export const site = {
  title: 'Nazar Akanov — Student Developer',
  handle: '@NAZARAKANOV',
  credit: 'Visuals: edit by @pzxepitsu (TikTok) — demo only',
  copyright: '© 2026 Nazar Akanov — Astana, KZ',
};

export const hero = {
  index: '01',
  label: 'HERO',
  first: 'NAZAR',
  last: 'AKANOV',
  kicker: 'THE DEVELOPER:',
  subtitle: 'STUDENT DEVELOPER — ASTANA',
  scrollCue: 'SCROLL TO SCRUB',
  segment: { from: 0, to: 1.46, poster: 0.32, exposure: 0.95 } as Segment,
  /** muted autoplay loop shown before the first scroll */
  loop: { from: 0, to: 1.42 },
};

export const about = {
  index: '02',
  label: 'ABOUT',
  blocks: [
    { title: 'THE STUDENT:', lines: ['COMPUTER SCIENCE IN *ASTANA*.', 'LEARNS BY SHIPPING, NOT BY WATCHING.'] },
    { title: 'THE CODE:', lines: ['BORN FROM *CURIOSITY*.', 'SHAPED BY DEADLINES.'] },
    { title: 'THE WORK:', lines: ['CAMPUS APPS, REALTIME TOOLS, AI BUILDERS —', 'FROM A NIGHT IDEA TO *PRODUCTION*.'] },
  ],
  /** big quoted words, swapped like the edit's "HUMAN?" -> "GHOUL?" */
  quote: ['STUDENT?', 'BUILDER.'],
  segment: { from: 8.9, to: 10.66, poster: 9.25, exposure: 0.78, invert: 1 } as Segment,
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
  segment: { from: 2.28, to: 4.52, poster: 2.95, exposure: 0.72 } as Segment,
};

export const stack = {
  index: '04',
  label: 'STACK',
  kicker: 'THE STACK:',
  caption: ['TOOLS SHAPED BY USE.', 'NOT BY HYPE.'],
  items: ['REACT', 'NEXT.JS', 'NESTJS', 'FLUTTER', 'GO', 'TYPESCRIPT'],
  segment: { from: 1.46, to: 2.27, poster: 1.62, exposure: 0.9 } as Segment,
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
};

export const ui = {
  soundOn: 'SOUND ON',
  soundOff: 'SOUND OFF',
  loading: 'LOADING FOOTAGE',
};
