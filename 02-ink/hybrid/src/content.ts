// All copy for the page lives here, plus the footage timing (seconds in the source edits).
// Edit freely; layout adapts to line lengths.
// Keep everything uppercase-friendly: the type system renders it in caps anyway.

export interface Project {
  id: string;
  title: string;
  kind: string;
  desc: string;
  stack: string[];
  /** the dossier a click on the card opens */
  dossier: {
    about: string[];
    year: string;
    status: string;
    role: string;
    stack: string[];
    links: { label: string; href: string }[];
    shots: { src: string; alt: string }[];
  };
}

export interface StackItem {
  name: string;
  note: string;
  /** ids of the work projects that use it (shown as "USED IN", each opens that project's dossier) */
  used: string[];
}

export interface LinkItem {
  label: string;
  href: string;
}

export interface Clip {
  /** seconds in the source edit where the scrub starts / ends */
  from: number;
  to: number;
  /** muted autoplay loop before the first scroll (hero only) */
  loop?: [number, number];
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
    /** the big quoted word scrambles from the first into the second as the ink spreads */
    quote: ['STUDENT?', 'BUILDER.'],
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
        desc: 'NFC tags for campus check-ins, with anti-forgery built in.',
        stack: ['REACT', 'WEB NFC'],
        dossier: {
          about: [
            'A PWA for a university campus: students tap NFC tags for attendance, lab door logs and an internal coin.',
            'Built so far: a live NFC lab page that scans tags, writes their URL and locks them read-only, and a mock NFC layer so the screens can be built without hardware.',
            "The core idea is anti-forgery: the server compares the ID written on a tag with the chip's hardware serial, so a copied tag is rejected.",
          ],
          year: '2026',
          status: 'EARLY STAGE · NFC LAB LIVE',
          role: 'SOLO',
          stack: ['REACT', 'WEB NFC', 'NESTJS', 'TYPESCRIPT', 'VITEST'],
          links: [{ label: 'NFC LAB', href: 'https://qairu-nfc.vercel.app' }],
          shots: [
            { src: '/media/work/qairu-1.jpg', alt: 'Qairu NFC Lab page: read, provision and lock steps for NFC tags' },
            { src: '/media/work/qairu-2.jpg', alt: 'NFC bench with mock taps: a genuine tag, a tag without a serial and a forged tag' },
          ],
        },
      },
      {
        id: '02',
        title: 'TAKTA',
        kind: 'REALTIME WHITEBOARD',
        desc: 'A shared whiteboard for lessons: open a link, type a name, draw together.',
        stack: ['REALTIME', 'CLOUDFLARE'],
        dossier: {
          about: [
            'A Miro-style whiteboard built for his own SAT lessons. Students open a link, type a name and draw on the board with the teacher. No accounts.',
            "Each board is a Cloudflare Durable Object running tldraw. The lesson template is locked on the server, and \"Lead class\" makes every student follow the teacher's slide.",
            'Lesson boards are generated through a batch API, and the board saves every 3 seconds instead of on every stroke, which keeps it inside the free plan.',
          ],
          year: '2026',
          status: 'LIVE · USED IN LESSONS',
          role: 'SOLO',
          stack: ['TLDRAW', 'REACT', 'CLOUDFLARE WORKERS', 'DURABLE OBJECTS', 'R2'],
          links: [{ label: 'OPEN TAKTA', href: 'https://takta.nazarakanov.workers.dev' }],
          shots: [
            { src: '/media/work/takta-1.jpg', alt: 'Takta home page: a shared online board for lessons' },
            { src: '/media/work/takta-2.jpg', alt: 'A demo lesson board with a question, a hint and sticky notes' },
          ],
        },
      },
      {
        id: '03',
        title: 'BARIWEB',
        kind: 'AI ACCESSIBILITY WIDGET',
        desc: 'Two lines of code add an accessibility toolbar and an AI agent to any site.',
        stack: ['AI', 'RAG'],
        dossier: {
          about: [
            'An accessibility platform for websites in Kazakhstan. Visitors get a toolbar (contrast, text size, text-to-speech) and an AI agent that presses buttons and fills forms when asked in Kazakh, Russian or English.',
            "Built by a team of four. His part: the RAG pipeline that crawls a customer's site, describes every button and field, and stores them in Milvus so the agent knows the site.",
            'Later, on his own: CI/CD on Vercel with GitHub Actions, the split into three repos, and the redesign of the landing and docs.',
          ],
          year: '2026',
          status: 'LANDING LIVE',
          role: 'RAG PIPELINE · DEVOPS · REDESIGN',
          stack: ['NEXT.JS', 'FASTAPI', 'MILVUS', 'LIT', 'PLAYWRIGHT'],
          links: [{ label: 'BARIWEB', href: 'https://bariweb.vercel.app' }],
          shots: [{ src: '/media/work/bariweb-1.jpg', alt: 'Bariweb landing: make any website accessible with two lines of code' }],
        },
      },
      {
        id: '04',
        title: 'PORTFOLIO 3D',
        kind: 'INFINITE SCROLL WORLD',
        desc: 'An endless looping 3D world you scroll through.',
        stack: ['R3F', 'THREE.JS'],
        dossier: {
          about: [
            'A portfolio after igloo.inc: scrolling drives a camera through a low-poly developer room, floating project devices, a portal and a server room, then wraps back to the start with no visible seam.',
            'The loop is Lenis infinite scroll plus an inert copy of the first screen, mapped onto a closed camera path. Transitions use a custom glitch effect.',
            'It has quality tiers, a phone mode and scripted Playwright checks for the loop seam, accessibility and performance.',
          ],
          year: '2026',
          status: 'IN PROGRESS · NOT PUBLIC YET',
          role: 'SOLO',
          stack: ['NEXT.JS', 'R3F', 'THREE.JS', 'LENIS', 'POSTPROCESSING'],
          links: [],
          shots: [{ src: '/media/work/portfolio3d-1.jpg', alt: 'The 3D portfolio: a low-poly developer room at night' }],
        },
      },
    ] as Project[],
  },

  stack: {
    label: 'THE STACK:',
    lines: ['TOOLS HE BENDS INTO SHAPE.'],
    items: [
      { name: 'REACT', note: 'INTERFACES', used: ['01', '02', '03', '04'] },
      { name: 'NEXT.JS', note: 'PRODUCT WEB', used: ['03', '04'] },
      { name: 'TYPESCRIPT', note: 'EVERYWHERE', used: ['01', '02', '03', '04'] },
      { name: 'CLOUDFLARE', note: 'EDGE + REALTIME', used: ['02'] },
      { name: 'THREE.JS', note: '3D ON THE WEB', used: ['04'] },
      { name: 'PYTHON', note: 'RAG + AI', used: ['03'] },
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
    credit: 'Visuals: edits by @pzxepitsu and @.maisamu (TikTok)',
    credit2: 'Type Garden after Akshat Agarwal',
    typing: 'TYPING…',
  },

  ui: {
    loading: 'LOADING FOOTAGE',
    soundOn: 'SOUND ON',
    soundOff: 'SOUND OFF',
  },

  // Real footage layered into the shader scenes. Ranges are watermark-free:
  // hero = @pzxepitsu edit (B), sphere -> vortex face; frames are cropped above its subtitle band.
  // outro = @.maisamu edit (C), halftone centipede curling into a spiral that turns red; that edit's
  // burned-in handle only runs 3.60-4.25 s.
  footage: {
    hero: { from: 0, to: 1.46, loop: [0, 1.42] } as Clip,
    outro: { from: 8.8, to: 11.12 } as Clip,
  },
};
