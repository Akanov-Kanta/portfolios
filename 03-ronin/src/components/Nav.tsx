import { site } from "@/content";
import { Hanko } from "./Hanko";

export const sections = [
  { id: "about", kanji: "序", label: "About" },
  { id: "works", kanji: "作", label: "Works" },
  { id: "techniques", kanji: "技", label: "Skills" },
  { id: "path", kanji: "道", label: "Path" },
  { id: "contact", kanji: "文", label: "Contact" },
] as const;

/** Flat ink strip, top right; the seal top left goes home. */
export function Nav() {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-[70] flex items-start justify-between p-3 sm:p-5">
      <a href="#top" className="pointer-events-auto block" aria-label={`${site.name}, back to top`}>
        <Hanko text={site.initials} size={46} className="sm:h-[54px] sm:w-[54px]" />
      </a>
      <nav aria-label="Sections" className="pointer-events-auto">
        <ul className="hard-shadow flex bg-ink">
          {sections.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className="group flex items-center gap-2 px-2.5 py-2.5 text-rice transition-colors duration-100 hover:bg-vermilion focus-visible:bg-vermilion sm:px-4"
              >
                <span lang="ja" className="font-serif text-lg leading-none font-extrabold">
                  {s.kanji}
                </span>
                <span className="label hidden text-[11px] md:inline">{s.label}</span>
                <span className="sr-only md:hidden">{s.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
