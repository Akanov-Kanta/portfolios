/**
 * All site copy lives here. Derived from the main portfolio's content (reference/portfolio-site.ts).
 * Captions follow the edit's format: "LABEL:" + up to two short lines (≤ 60 characters each).
 */
export interface ProjectMedia {
  /** grayscale screen recording, public/projects/rec/<slug>.{webm,mp4,jpg} (live projects only) */
  rec?: string;
  /** screenshot under public/projects/ */
  still: string;
  /** what the still/recording shows, for alt text and the figure caption */
  alt: string;
}

export interface Project {
  slug: string;
  name: string;
  date: string; // display string, e.g. "06.2026"
  tagline: string;
  description: string;
  tags: string[];
  /** my part, short (mono metadata) */
  role: string;
  /** team size, short */
  team: string;
  status: string;
  url?: string;
  repo?: string;
  media: ProjectMedia;
}

export interface Social {
  label: string;
  href: string;
  /** what the mono row shows after the label */
  handle: string;
}

/** One typed caption: "LABEL:" then lines. */
export interface CaptionCopy {
  label: string;
  lines: readonly string[];
}

export const site = {
  name: "Nazar Akanov",
  handle: "nazarakanov",
  role: "Software engineer",
  location: { city: "Astana", country: "Kazakhstan", lat: "51.0893° N", lng: "71.4171° E", tz: "Asia/Almaty", utc: "UTC+5" },
  email: "nazarakanov@gmail.com",
  /** hero metadata; edit freely */
  availability: "Open to work",
  bio: [
    "I'm Nazar. I build AI products end to end, from the model to the app people actually tap on.",
    "A few AI olympiad medals, a hackathon win and a FLEX year in Georgia (the state) later, I'm digging into fine-tuning and evaluation.",
  ],
  statement: "AI products, built end to end. From the model to the app people tap on.",
  record: [
    ["AI olympiads", "Medals"],
    ["Hackathon", "Win"],
    ["FLEX exchange", "Georgia, US"],
  ] as const,
  skills: ["TypeScript", "React", "Next.js", "three.js", "Node", "PostgreSQL", "Flutter", "Go"],
  socials: [
    { label: "GitHub", href: "https://github.com/akanov-kanta", handle: "akanov-kanta" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/nazar-akanov-7554a92bb/", handle: "nazar-akanov" },
    { label: "Instagram", href: "https://www.instagram.com/akanov.nazar/", handle: "akanov.nazar" },
    { label: "Telegram", href: "https://t.me/AkanovN", handle: "AkanovN" },
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
      role: "Model, engine, interface",
      team: "Solo",
      status: "Live",
      url: "https://glassbox-fawn.vercel.app",
      repo: "https://github.com/Akanov-Kanta/glassbox",
      media: {
        rec: "glassbox",
        still: "/projects/glassbox.webp",
        alt: "Glassbox generating Kazakh verse character by character, with the next-character candidates and attention heads beside it",
      },
    },
    {
      slug: "bariweb",
      name: "BARIWEB",
      date: "03.2026",
      tagline: "One script tag that makes any website accessible, with an AI agent that uses the site for you.",
      description:
        "An AI accessibility platform for businesses in Kazakhstan, built as a team. One line of HTML adds an accessibility toolbar and an AI agent that presses buttons, opens pages and fills in forms on request, typed or spoken, in Kazakh, Russian or English. I built the RAG pipeline that indexes each customer's site (page extraction, enrichment, embeddings and a Milvus vector store) and the deployment to Vercel.",
      tags: ["Python", "RAG", "Milvus", "LLM agents"],
      role: "RAG pipeline, deployment",
      team: "Team",
      status: "Live",
      url: "https://bariweb.vercel.app",
      media: {
        rec: "bariweb",
        still: "/projects/bariweb.webp",
        alt: "The Bariweb landing page and its live demo of the agent using a city-services site",
      },
    },
    {
      slug: "niscourses",
      name: "NISCOURSES",
      date: "06.2023",
      tagline: "Course enrollment for a whole school, live on every screen.",
      description:
        "A course-enrollment system for NIS (Nazarbayev Intellectual School) in Petropavlovsk that replaced the paper sign-up sheets, built by a team of three in summer 2023 without AI coding tools. One Flutter app serves three roles on Firebase: students claim seats in real time under a one-course-per-type rule and get a generated weekly timetable, teachers watch their rosters fill up live, and admins run the whole catalogue and export the school's enrollment to Excel in one click.",
      tags: ["Flutter", "Dart", "Firebase"],
      role: "App, real-time enrollment",
      team: "Team of 3",
      status: "Shipped 2023",
      repo: "https://github.com/Akanov-Kanta/Courses",
      media: {
        still: "/projects/niscourses.webp",
        alt: "Three NISCOURSES phone screens: a student's weekly timetable, a course category and a course roster",
      },
    },
  ] satisfies Project[],
  /** the hero's one typed caption */
  subject: {
    label: "THE SUBJECT",
    lines: ["NAZAR AKANOV. SOFTWARE ENGINEER. ASTANA.", "A FEW AI OLYMPIAD MEDALS. A HACKATHON WIN."],
  } satisfies CaptionCopy,
  /** the cold open's caption */
  coldOpen: "SUBJECT: NAZAR AKANOV",
  currently: "Building a web NFC campus app and this site.",
  /** the footage is the Makima edit by @pzxepitsu, shown with credit as a demo */
  credit: "VISUALS: EDIT BY @PZXEPITSU (TIKTOK) — DEMO ONLY",
  creditHref: "https://www.tiktok.com/@pzxepitsu",
} as const;

export type Site = typeof site;
export type SiteProject = (typeof site.projects)[number];
export const projectBySlug = (slug: string | null | undefined) => site.projects.find((p) => p.slug === slug);
