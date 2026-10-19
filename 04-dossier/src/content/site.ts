/**
 * All site copy lives here. Derived from the main portfolio's content (reference/portfolio-site.ts);
 * the 3D-scene fields are dropped. Dossier captions follow the edit's format: "LABEL:" + two short lines.
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
}

export interface Social {
  label: string;
  href: string;
}

/** One dossier caption: rendered as "LABEL:" then two lines, typed on. */
export interface DossierItem {
  label: string;
  lines: readonly [string, string];
  /** set for project steps: clicking the step opens this project */
  slug?: string;
}

export const site = {
  name: "Nazar Akanov",
  handle: "nazarakanov",
  role: "Software engineer",
  location: { city: "Astana", lat: "51.0893° N", lng: "71.4171° E", tz: "Asia/Almaty" },
  email: "nazarakanov@gmail.com",
  bio: [
    "I'm Nazar. I build AI products end to end, from the model to the app people actually tap on.",
    "A few AI olympiad medals, a hackathon win and a FLEX year in Georgia (the state) later, I'm digging into fine-tuning and evaluation.",
  ],
  skills: ["TypeScript", "React", "Next.js", "three.js", "Node", "PostgreSQL", "Flutter", "Go"],
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
    },
  ] satisfies Project[],
  /** Chapter 3: the caption that starts typing in the silence before the drop. */
  drop: {
    label: "THE SUBJECT",
    lines: ["NAZAR AKANOV. SOFTWARE ENGINEER. ASTANA.", "A FEW AI OLYMPIAD MEDALS. A HACKATHON WIN."],
  } satisfies DossierItem,
  /** Chapter 4 captions, in order. Kept short: each line types in under a second at ~40 chars/s. */
  dossier: [
    {
      label: "THE CODE",
      lines: ["AI PRODUCTS, BUILT END TO END.", "FROM THE MODEL TO THE APP PEOPLE TAP ON."],
    },
    {
      label: "THE STACK",
      lines: ["TYPESCRIPT. REACT. NEXT.JS. THREE.JS.", "NODE. POSTGRESQL. FLUTTER. GO."],
    },
    {
      label: "GLASSBOX",
      slug: "glassbox",
      lines: ["A GPT TRAINED FROM SCRATCH ON KAZAKH POETRY.", "IT RUNS IN THE BROWSER. YOU CAN SEE THROUGH IT."],
    },
    {
      label: "BARIWEB",
      slug: "bariweb",
      lines: ["ONE SCRIPT TAG MAKES ANY SITE ACCESSIBLE.", "AN AI AGENT USES THE SITE FOR YOU."],
    },
    {
      label: "NISCOURSES",
      slug: "niscourses",
      lines: ["THE PAPER SIGN-UP SHEETS ARE GONE.", "A WHOLE SCHOOL ENROLLS LIVE, ON EVERY SCREEN."],
    },
  ] satisfies DossierItem[],
  /** Chapter 5: the centre word flips between these two. */
  invert: ["ENGINEER?", "ARTIST?"],
  /** Chapter 5 captions, after the flip (top-left, then bottom-right; t_10.00.jpg). */
  invertCaptions: [
    {
      label: "THE NOW",
      lines: ["BUILDING A WEB NFC CAMPUS APP. AND THIS SITE.", "DIGGING INTO FINE-TUNING AND EVALUATION."],
    },
    {
      label: "THE PLACE",
      lines: ["ASTANA. 51.0893° N, 71.4171° E.", "AFTER A FLEX YEAR IN GEORGIA, THE STATE."],
    },
  ] satisfies DossierItem[],
  currently: "Building a web NFC campus app and this site.",
  /**
   * Owner photos for the photo slots (strip panels, the invert mask window), paths under public/photos/.
   * Rendered through the manga shader (art/MangaPhoto). Empty = procedural placeholder everywhere.
   */
  photos: [] as string[],
} as const;

export type Site = typeof site;
/** The photo for slot `i`, cycling through the manifest; undefined when there are no photos. */
export const photoAt = (i: number): string | undefined =>
  site.photos.length ? site.photos[((i % site.photos.length) + site.photos.length) % site.photos.length] : undefined;
export const projectBySlug = (slug: string) => site.projects.find((p) => p.slug === slug);
