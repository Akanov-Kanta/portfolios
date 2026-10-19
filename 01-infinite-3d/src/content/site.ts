import { projectAccent } from "@/components/world/theme";

/**
 * All portfolio copy lives here. Project screenshots live in public/projects/<slug>.webp
 * (4:3, ~960x720: the device screens are about 4:3).
 */
export interface Project {
  slug: string;
  name: string;
  date: string; // display string, e.g. "06.2026"
  tagline: string;
  description: string;
  tags: string[];
  url?: string;
  repo?: string;
  /** public/projects/<slug>.webp — omitted = procedural placeholder screen */
  screenshot?: string;
  /** which kit device holds the project's screen in the 3D scene ("phones": three phones, see `screens`) */
  device: "monitor" | "laptop" | "tv" | "phones";
  /** device "phones" only: one image, the phone screens side by side left to right (each ~390:844) */
  screens?: string;
  /** accent override (#hex) for the title underline, cursor and device glow; default theme.projectAccent(i) */
  accent?: string;
}

export interface Social {
  label: string;
  href: string;
}

export interface Credit {
  name: string;
  author: string;
  license: "CC0" | "CC-BY 4.0";
  url: string;
}

export const site = {
  name: "Nazar Akanov",
  handle: "nazarakanov",
  role: "Software engineer",
  manifesto:
    "I build things for the web that feel alive: fast, tactile, and a little bit strange.",
  hint: "Scroll to discover",
  hintLoop: "(it loops)",
  /** phone-only copy (Dock, Index sheet, install hint, world deferral) */
  phone: {
    hint: "Swipe up",
    hintLoop: "it loops",
    dock: { hero: "Home", about: "About", projects: "Work", contact: "Contact" },
    blurb: { hero: "The night room", about: "Bio and stack", projects: "Selected work", contact: "Say hello" },
    install: "Install app",
    installIos: "Install: tap Share, then Add to Home Screen",
    installIosCompact: "Compact bar: ··· then Share",
    notNow: "Not now",
    share: "Share",
    loadWorld: "Load 3D world",
    stillSystem: "Follows your system setting",
    offline: "offline",
  },
  copyright: `// Copyright © ${new Date().getFullYear()}`,
  rights: "All rights reserved.",
  location: { city: "Astana", lat: "51.0893° N", lng: "71.4171° E", tz: "Asia/Almaty" },
  email: "nazarakanov@gmail.com",
  bio: [
    "I'm Nazar. I build AI products end to end, from the model to the app people actually tap on.",
    "A few AI olympiad medals, a hackathon win and a FLEX year in Georgia (the state) later, I'm digging into fine-tuning and evaluation.",
  ],
  skills: ["TypeScript", "React", "Next.js", "three.js", "Node", "PostgreSQL", "Flutter", "Go"],
  currently: "Building a web NFC campus app and this site.",
  socials: [
    { label: "GitHub", href: "https://github.com/akanov-kanta" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/nazar-akanov-7554a92bb/" },
    { label: "Instagram", href: "https://www.instagram.com/akanov.nazar/" },
    { label: "Telegram", href: "https://t.me/AkanovN" },
  ] satisfies Social[],
  projects: [
    {
      slug: "glassbox",
      name: "GLASSBOX",
      date: "10.2026",
      tagline: "A GPT you can see through, trained from scratch on Kazakh poetry.",
      description:
        "A 1.8M-parameter character-level GPT, trained from scratch in PyTorch on 328k characters of public-domain Kazakh classics (Abai and his contemporaries), that runs entirely in the browser on a transformer engine I wrote in TypeScript with no ML libraries. The engine matches PyTorch to within one part in a million, and the weights ship as 3.6 MB of float16 with no measurable loss. Click any character it writes to see the candidates it weighed and where each of its 16 attention heads was looking.",
      tags: ["PyTorch", "TypeScript", "Transformers", "React"],
      url: "https://glassbox-fawn.vercel.app",
      repo: "https://github.com/Akanov-Kanta/glassbox",
      screenshot: "/projects/glassbox.webp",
      device: "monitor",
    },
    {
      slug: "bariweb",
      name: "BARIWEB",
      date: "03.2026",
      tagline: "One script tag that makes any website accessible, with an AI agent that uses the site for you.",
      description:
        "An AI accessibility platform for businesses in Kazakhstan, built as a team. One line of HTML adds an accessibility toolbar and an AI agent that presses buttons, opens pages and fills in forms on request, typed or spoken, in Kazakh, Russian or English. I built the RAG pipeline that indexes each customer's site (page extraction, enrichment, embeddings and a Milvus vector store) and the deployment to Vercel.",
      tags: ["Python", "RAG", "Milvus", "LLM agents"],
      url: "https://bariweb.vercel.app",
      screenshot: "/projects/bariweb.webp",
      device: "laptop",
    },
    {
      slug: "niscourses",
      name: "NISCOURSES",
      date: "06.2023",
      tagline: "Course enrollment for a whole school, live on every screen.",
      description:
        "A course-enrollment system for NIS (Nazarbayev Intellectual School) in Petropavlovsk that replaced the paper sign-up sheets, built by a team of three in summer 2023 without AI coding tools. One Flutter app serves three roles on Firebase: students claim seats in real time under a one-course-per-type rule and get a generated weekly timetable, teachers watch their rosters fill up live, and admins run the whole catalogue and export the school's enrollment to Excel in one click.",
      tags: ["Flutter", "Dart", "Firebase"],
      repo: "https://github.com/Akanov-Kanta/Courses",
      screenshot: "/projects/niscourses.webp",
      // teacher roster, student timetable, admin user list
      screens: "/projects/niscourses-phones.webp",
      device: "phones",
    },
  ] satisfies Project[],
  /** 3D model attributions (mirrors public/models/CREDITS.md; not rendered yet). CC0 entries are listed as courtesy. */
  credits: [
    { name: "Furniture Kit", author: "Kenney", license: "CC0", url: "https://kenney.nl/assets/furniture-kit" },
    { name: "Furniture Bits", author: "KayKit (Kay Lousberg)", license: "CC0", url: "https://kaylousberg.itch.io/furniture-bits" },
    { name: "Television 02", author: "Benny Weimer", license: "CC0", url: "https://polyhaven.com/a/television_02" },
    { name: "Classic Laptop", author: "Arrangemonk", license: "CC0", url: "https://polyhaven.com/a/classic_laptop" },
    { name: "Television 01", author: "Gabriel Radić", license: "CC0", url: "https://polyhaven.com/a/Television_01" },
  ] satisfies Credit[],
} as const;

export type Site = typeof site;
export const projectBySlug = (slug: string) => site.projects.find((p) => p.slug === slug);
/** The project's accent: its own override, else the theme cycle. */
export const accentOf = (p: Project, i: number): string => p.accent ?? projectAccent(i);
