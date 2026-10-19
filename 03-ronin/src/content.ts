/**
 * Every piece of copy on the site lives here.
 * Source: /Users/nazarakanov/development/portfolio (branch main) — src/content/site.ts, README.md,
 * docs/CONTEXT.md and public/projects/*. Search for "TODO" to find content that is still missing.
 */

export interface Project {
  slug: string;
  name: string;
  /** kanji shown on the gold-leaf panel (decorative, one or two characters) */
  kanji: string;
  date: string;
  tagline: string;
  description: string;
  role?: string;
  tags: string[];
  url?: string;
  repo?: string;
  /** framed on the gold-leaf panel */
  image: { src: string; width: number; height: number; alt: string };
  /** optional extra image in the details scroll */
  detailImage?: { src: string; width: number; height: number; alt: string };
}

export interface Milestone {
  /** display date; null = date not known yet (rendered without a date) */
  date: string | null;
  title: string;
  text: string;
  kanji: string;
}

export interface Social {
  label: string;
  href: string;
  /** two-character mark printed inside the seal */
  mark: string;
}

export const site = {
  name: "Nazar Akanov",
  firstName: "Nazar",
  lastName: "Akanov",
  initials: "NA",
  /** katakana reading of the name, used on the vertical side label */
  nameKana: "ナザル・アカノフ",
  handle: "Akanov-Kanta",
  role: "Software engineer",
  /** vertical hero label: "ronin developer" */
  epithet: "浪人開発者",
  manifesto:
    "I build things for the web that feel alive: fast, tactile, and a little bit strange.",
  email: "nazarakanov@gmail.com",
  location: { city: "Astana", country: "Kazakhstan", note: "Open to remote" },
  bio: [
    "I'm Nazar. I build AI products end to end, from the model to the app people actually tap on.",
    "A few AI olympiad medals, a hackathon win and a FLEX year in Georgia (the state) later, I'm digging into fine-tuning and evaluation.",
  ],
  currently: "Building a web NFC campus app and this site.",
  /** big line in the contact section */
  contactLine: "A letter reaches me faster than a crow.",
  colophon: "Drawn in ink and code · Next.js · GSAP",

  /** "scroll of techniques": the core stack, then what the projects were forged with */
  techniques: {
    primary: ["TypeScript", "React", "Next.js", "three.js", "Node", "PostgreSQL", "Flutter", "Go"],
    // gathered from the project tags below
    secondary: ["Python", "PyTorch", "Transformers", "RAG", "Milvus", "LLM agents", "Dart", "Firebase", "GSAP", "React Three Fiber"],
  },

  socials: [
    { label: "GitHub", href: "https://github.com/Akanov-Kanta", mark: "GH" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/nazar-akanov-7554a92bb/", mark: "IN" },
    { label: "Telegram", href: "https://t.me/AkanovN", mark: "TG" },
    { label: "Instagram", href: "https://www.instagram.com/akanov.nazar/", mark: "IG" },
  ] satisfies Social[],

  projects: [
    {
      slug: "glassbox",
      name: "GLASSBOX",
      kanji: "硝",
      date: "10.2026",
      tagline: "A GPT you can see through, trained from scratch on Kazakh poetry.",
      description:
        "A 1.8M-parameter character-level GPT, trained from scratch in PyTorch on 328k characters of public-domain Kazakh classics (Abai and his contemporaries), that runs entirely in the browser on a transformer engine I wrote in TypeScript with no ML libraries. The engine matches PyTorch to within one part in a million, and the weights ship as 3.6 MB of float16 with no measurable loss. Click any character it writes to see the candidates it weighed and where each of its 16 attention heads was looking.",
      tags: ["PyTorch", "TypeScript", "Transformers", "React"],
      url: "https://glassbox-fawn.vercel.app",
      repo: "https://github.com/Akanov-Kanta/glassbox",
      image: { src: "/projects/glassbox.webp", width: 960, height: 720, alt: "GLASSBOX: the landing page, “A GPT you can see through.”" },
    },
    {
      slug: "bariweb",
      name: "BARIWEB",
      kanji: "門",
      date: "03.2026",
      tagline: "One script tag that makes any website accessible, with an AI agent that uses the site for you.",
      description:
        "An AI accessibility platform for businesses in Kazakhstan, built as a team. One line of HTML adds an accessibility toolbar and an AI agent that presses buttons, opens pages and fills in forms on request, typed or spoken, in Kazakh, Russian or English. I built the RAG pipeline that indexes each customer's site (page extraction, enrichment, embeddings and a Milvus vector store) and the deployment to Vercel.",
      role: "Team project · RAG pipeline & deployment",
      tags: ["Python", "RAG", "Milvus", "LLM agents"],
      url: "https://bariweb.vercel.app",
      image: { src: "/projects/bariweb.webp", width: 960, height: 720, alt: "BARIWEB: “Make your site inclusive in 1 day.”" },
    },
    {
      slug: "infinite-portfolio",
      name: "NIGHT ROOM",
      kanji: "夜",
      date: "09.2026",
      tagline: "An endless, scroll-driven 3D portfolio that loops back to where it started.",
      description:
        "An igloo.inc-style endless scroll: a real HTML page whose scroll drives a camera through a low-poly developer room, a floating stack of project devices, a portal dive and a server room where the selected social logo floats as a cursor-reactive orb solid, then wraps seamlessly back to the start. Accessible by design: the text is real DOM, it works with reduced motion, without WebGL and with a keyboard, and installs as a PWA on phones.",
      tags: ["Next.js", "React Three Fiber", "three.js", "Lenis", "PWA"],
      // TODO: confirm this is the production URL and that the repo is public
      url: "https://portfolio-alpha-sandy-krad8msap8.vercel.app",
      repo: "https://github.com/Akanov-Kanta/Akanov-portfolio",
      image: { src: "/projects/portfolio-3d.jpg", width: 1920, height: 1080, alt: "The 3D portfolio: a low-poly night developer room with the name Nazar Akanov." },
    },
    {
      slug: "niscourses",
      name: "NISCOURSES",
      kanji: "学",
      date: "06.2023",
      tagline: "Course enrollment for a whole school, live on every screen.",
      description:
        "A course-enrollment system for NIS (Nazarbayev Intellectual School) in Petropavlovsk that replaced the paper sign-up sheets, built by a team of three in summer 2023 without AI coding tools. One Flutter app serves three roles on Firebase: students claim seats in real time under a one-course-per-type rule and get a generated weekly timetable, teachers watch their rosters fill up live, and admins run the whole catalogue and export the school's enrollment to Excel in one click.",
      role: "Team of three",
      tags: ["Flutter", "Dart", "Firebase"],
      repo: "https://github.com/Akanov-Kanta/Courses",
      image: { src: "/projects/niscourses.webp", width: 960, height: 720, alt: "NISCOURSES: the course list in the Flutter app." },
      detailImage: {
        src: "/projects/niscourses-phones.webp",
        width: 1080,
        height: 780,
        alt: "NISCOURSES on three phones: a teacher roster, a student timetable and the admin user list.",
      },
    },
  ] satisfies Project[],

  /** the path: experience, education and milestones, oldest first */
  path: [
    {
      date: "06.2023",
      kanji: "学",
      title: "NISCOURSES ships",
      text: "With a team of three, replaced the paper course sign-up sheets of NIS Petropavlovsk with a real-time Flutter + Firebase app. No AI coding tools.",
    },
    {
      // TODO: add the years and the names of the olympiads / medals
      date: null,
      kanji: "銀",
      title: "AI olympiad medals",
      text: "A few medals at AI olympiads.",
    },
    {
      // TODO: add the hackathon name, year and what was built
      date: null,
      kanji: "勝",
      title: "Hackathon win",
      text: "Won a hackathon.",
    },
    {
      // TODO: add the school year (e.g. 2024–2025) and the host town / school
      date: null,
      kanji: "旅",
      title: "FLEX year in Georgia, USA",
      text: "An exchange year in Georgia (the state) on the FLEX programme.",
    },
    {
      date: "03.2026",
      kanji: "門",
      title: "BARIWEB",
      text: "Built the RAG pipeline and the deployment for an AI accessibility platform for businesses in Kazakhstan.",
    },
    {
      date: "09.2026",
      kanji: "夜",
      title: "The night-room portfolio",
      text: "An endless, scroll-driven 3D portfolio in Next.js and React Three Fiber.",
    },
    {
      date: "10.2026",
      kanji: "硝",
      title: "GLASSBOX",
      text: "A transparent GPT trained from scratch on Kazakh poetry, running on a hand-written TypeScript inference engine.",
    },
    {
      date: "Now",
      kanji: "今",
      title: "Fine-tuning & evaluation",
      text: "Digging into fine-tuning and evaluation. Building a web NFC campus app.",
    },
    // TODO: education (school / university, years) is not in the source portfolio — add it here
  ] satisfies Milestone[],
} as const;

export type Site = typeof site;
