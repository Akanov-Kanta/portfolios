// All copy for the page lives here. Edit freely; layout adapts to line lengths.
// Keep everything uppercase-friendly: the type system renders it in caps anyway.

export interface Project {
  id: string;
  title: string;
  kind: string;
  desc: string;
  stack: string[];
  href: string;
}

export interface StackItem {
  name: string;
  note: string;
}

export interface LinkItem {
  label: string;
  href: string;
}

export const content = {
  meta: {
    title: 'Nazar Akanov | Student Developer, Astana',
    description:
      'Nazar Akanov, student developer from Astana, Kazakhstan. Web, mobile and realtime projects.',
  },

  handle: '@NAZARAKANOV',
  monogram: 'N/A',

  // Labels shown in the top-right scene counter.
  scenes: ['ORIGIN', 'THE DEVELOPER', 'THE WORK', 'THE STACK', 'THE END?'],

  hero: {
    kicker: 'PORTFOLIO / VOL. 01',
    first: 'NAZAR',
    last: 'AKANOV',
    subtitle: 'STUDENT DEVELOPER — ASTANA',
    scrollHint: 'SCROLL TO ENTER',
  },

  about: {
    label: 'THE DEVELOPER:',
    lines: [
      'A STUDENT FROM ASTANA',
      'WHO BUILDS FOR THE WEB',
      'AND FOR THE PHONE IN YOUR HAND.',
      'LATE NIGHTS IN. SHIPPED THINGS OUT.',
    ],
    quote: 'HUMAN?',
    aside: 'PART STUDENT. PART COMPILER.',
  },

  work: {
    label: 'THE WORK:',
    lines: ['FOUR THINGS THAT GREW OUT OF THE DARK.'],
    projects: [
      {
        id: '01',
        title: 'QAIRU NFC',
        kind: 'CAMPUS NFC PWA',
        desc: 'Tap-to-check-in progressive web app for campus life.',
        stack: ['REACT', 'NESTJS'],
        href: '#',
      },
      {
        id: '02',
        title: 'SAT BOARD',
        kind: 'REALTIME WHITEBOARD',
        desc: 'Multiplayer canvas with live cursors and shared boards.',
        stack: ['REALTIME', 'CANVAS'],
        href: '#',
      },
      {
        id: '03',
        title: 'BARIWEB',
        kind: 'AI WEBSITE BUILDER',
        desc: 'Describe a business, get a working website.',
        stack: ['AI', 'WEB'],
        href: '#',
      },
      {
        id: '04',
        title: 'PORTFOLIO 3D',
        kind: 'INFINITE SCROLL WORLD',
        desc: 'An endless looping 3D world you scroll through.',
        stack: ['R3F', 'THREE.JS'],
        href: '#',
      },
    ] as Project[],
  },

  stack: {
    label: 'THE STACK:',
    lines: ['TOOLS HE BENDS INTO SHAPE.'],
    items: [
      { name: 'REACT', note: 'INTERFACES' },
      { name: 'NEXT.JS', note: 'PRODUCT WEB' },
      { name: 'NESTJS', note: 'APIS' },
      { name: 'FLUTTER', note: 'MOBILE' },
      { name: 'GO', note: 'SERVICES' },
      { name: 'TYPESCRIPT', note: 'EVERYWHERE' },
    ] as StackItem[],
  },

  outro: {
    label: 'THE END?',
    lines: ["LET'S BUILD SOMETHING THAT FEELS ALIVE."],
    links: [
      { label: 'GITHUB', href: '#' },
      { label: 'LINKEDIN', href: 'https://www.linkedin.com/in/nazarakanov' },
      { label: 'TELEGRAM', href: '#' },
    ] as LinkItem[],
    footer: '© 2026 NAZAR AKANOV — ASTANA, KZ',
  },
};
