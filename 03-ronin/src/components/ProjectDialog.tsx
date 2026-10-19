"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import type { Project } from "@/content";
import { Brush } from "./art";
import { Hanko } from "./Hanko";

/**
 * The project's details as an unrolled scroll in a native <dialog> (focus trap, Esc, inert page for free).
 * Opening: one crimson flash frame, then the sheet is cut in along a diagonal (CSS, off under reduced motion).
 */
export function ProjectDialog({ project, onClose }: { project: Project | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (project && !d.open) d.showModal();
    if (!project && d.open) d.close();
  }, [project]);

  return (
    <dialog
      ref={ref}
      className="scroll-dialog"
      data-lenis-prevent=""
      aria-labelledby="dlg-title"
      onClose={onClose}
      onClick={(e) => {
        // a click on the backdrop area (the dialog itself, outside the sheet) closes it
        if (e.target === e.currentTarget) e.currentTarget.close();
      }}
    >
      <div className="dialog-flash" aria-hidden="true" />
      {project && (
        <div
          className="h-full overflow-y-auto overscroll-contain"
          onClick={(e) => {
            if (e.target === e.currentTarget) ref.current?.close();
          }}
        >
        <div
          className="flex min-h-full items-start justify-center px-4 py-16 sm:items-center sm:px-10"
          onClick={(e) => {
            if (e.target === e.currentTarget) ref.current?.close();
          }}
        >
          <article className="scroll-sheet paper relative w-full max-w-5xl shadow-[14px_14px_0_0_var(--crimson)]">
            {/* wooden rollers */}
            <span aria-hidden="true" className="absolute -top-3 left-[-10px] right-[-10px] h-3 bg-ink" />
            <span aria-hidden="true" className="absolute -bottom-3 left-[-10px] right-[-10px] h-3 bg-ink" />
            <span aria-hidden="true" className="absolute -top-4 left-[-16px] h-5 w-3 bg-gold" />
            <span aria-hidden="true" className="absolute -top-4 right-[-16px] h-5 w-3 bg-gold" />
            <span aria-hidden="true" className="absolute -bottom-4 left-[-16px] h-5 w-3 bg-gold" />
            <span aria-hidden="true" className="absolute -bottom-4 right-[-16px] h-5 w-3 bg-gold" />

            <button
              type="button"
              onClick={() => ref.current?.close()}
              className="label absolute right-3 top-3 z-10 flex items-center gap-2 bg-ink px-3 py-2 text-[11px] text-rice hover:bg-vermilion sm:right-5 sm:top-5"
              autoFocus
            >
              <span lang="ja" aria-hidden="true" className="font-serif text-sm tracking-normal">
                閉
              </span>
              Close
            </button>

            <div className="grid gap-8 p-5 pt-16 sm:p-10 sm:pt-12 md:grid-cols-[1.05fr_1fr]">
              <div className="order-2 flex min-w-0 flex-col gap-5 md:order-1">
                <div className="gold-leaf border-[3px] border-ink p-3">
                  <Image
                    src={project.image.src}
                    alt={project.image.alt}
                    width={project.image.width}
                    height={project.image.height}
                    sizes="(min-width: 768px) 480px, 92vw"
                    className="h-auto w-full border-2 border-ink"
                  />
                </div>
                {project.detailImage && (
                  <div className="gold-leaf border-[3px] border-ink p-3">
                    <Image
                      src={project.detailImage.src}
                      alt={project.detailImage.alt}
                      width={project.detailImage.width}
                      height={project.detailImage.height}
                      sizes="(min-width: 768px) 480px, 92vw"
                      className="h-auto w-full border-2 border-ink"
                    />
                  </div>
                )}
              </div>

              <div className="order-1 flex min-w-0 flex-col md:order-2">
                <div className="flex items-start gap-4">
                  <span lang="ja" aria-hidden="true" className="vertical-upright display text-6xl text-crimson">
                    {project.kanji}
                  </span>
                  <div>
                    <p className="label text-crimson">{project.date}</p>
                    <h3 id="dlg-title" className="display mt-2 break-words text-[clamp(2rem,6vw,3.6rem)]">
                      {project.name}
                    </h3>
                    <Brush className="mt-3 h-3 w-40 text-vermilion" />
                  </div>
                </div>
                <p className="mt-6 text-xl leading-snug font-semibold">{project.tagline}</p>
                {project.role && <p className="label mt-4 text-ink/70">{project.role}</p>}
                <p className="mt-5 font-cond text-[17px] leading-relaxed text-ink/90">{project.description}</p>

                <ul className="mt-6 flex flex-wrap gap-2" aria-label="Stack">
                  {project.tags.map((t) => (
                    <li key={t} className="label border-2 border-ink px-2.5 py-1.5 text-[11px]">
                      {t}
                    </li>
                  ))}
                </ul>

                <div className="mt-8 flex flex-wrap items-center gap-4">
                  {project.url && (
                    <a
                      href={project.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="label hard-shadow bg-vermilion px-5 py-3.5 text-rice transition-transform duration-100 hover:-translate-y-0.5"
                    >
                      Visit the site ↗
                    </a>
                  )}
                  {project.repo && (
                    <a
                      href={project.repo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="label border-2 border-ink px-5 py-3 transition-colors duration-100 hover:bg-ink hover:text-rice"
                    >
                      Read the source ↗
                    </a>
                  )}
                  <Hanko text={project.kanji.slice(0, 2)} size={54} className="ml-auto rotate-[5deg]" color="var(--crimson)" />
                </div>
              </div>
            </div>
          </article>
        </div>
        </div>
      )}
    </dialog>
  );
}
