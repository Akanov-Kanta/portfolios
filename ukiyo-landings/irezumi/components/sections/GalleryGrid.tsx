"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { flashFrame } from "@/lib/flash";

export type FlashItem = {
  id: string;
  kanji: string;
  romaji: string;
  title: string;
  meaning: string;
  artist: string;
  placement: string;
  art: React.ReactNode;
  duo: React.ReactNode;
};

export default function GalleryGrid({ items }: { items: FlashItem[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [index, setIndex] = useState<number | null>(null);

  const open = (i: number, el: HTMLButtonElement) => {
    triggerRef.current = el;
    setIndex(i);
    flashFrame("var(--rice)");
  };

  useEffect(() => {
    const dlg = dialogRef.current;
    if (index !== null && dlg && !dlg.open) dlg.showModal();
  }, [index]);
  const close = useCallback(() => dialogRef.current?.close(), []);
  const step = useCallback((d: number) => setIndex((i) => (i === null ? i : (i + d + items.length) % items.length)), [items.length]);

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    const onClose = () => {
      setIndex(null);
      triggerRef.current?.focus();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    dlg.addEventListener("close", onClose);
    dlg.addEventListener("keydown", onKey);
    return () => {
      dlg.removeEventListener("close", onClose);
      dlg.removeEventListener("keydown", onKey);
    };
  }, [step]);

  const request = (id: string) => {
    window.dispatchEvent(new CustomEvent("irezumi:motif", { detail: id }));
    close();
    document.getElementById("book")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const cur = index === null ? null : items[index];

  return (
    <>
      <ul className="mt-16 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-3 lg:gap-x-10 lg:gap-y-14">
        {items.map((it, i) => (
          <li key={it.id} data-reveal className={i % 3 === 1 ? "lg:translate-y-14" : ""}>
            <button
              type="button"
              onClick={(e) => open(i, e.currentTarget)}
              className="tile group relative block w-full text-left"
              aria-label={`Open ${it.title} flash`}
            >
              <span aria-hidden="true" className="absolute inset-0 translate-x-[8px] translate-y-[8px] bg-ink sm:translate-x-[12px] sm:translate-y-[12px]" />
              <span className="relative block aspect-[400/520] overflow-hidden border-[3px] border-ink bg-rice transition-transform duration-150 group-hover:-translate-x-1 group-hover:-translate-y-1">
                {it.art}
                <span className="duo-layer absolute inset-0 block">{it.duo}</span>
                <span className="absolute right-0 top-0 grid h-9 w-9 place-items-center bg-ink font-display text-lg font-extrabold text-rice sm:h-12 sm:w-12 sm:text-2xl">
                  {it.kanji.slice(0, 1)}
                </span>
              </span>
              <span className="relative mt-4 flex items-baseline justify-between gap-2">
                <span className="font-display text-xl font-extrabold text-rice sm:text-2xl">{it.title}</span>
                <span className="label hidden text-ink sm:inline">{it.romaji} · View</span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <dialog ref={dialogRef} className="lightbox" aria-labelledby="lb-title" onClick={(e) => e.target === e.currentTarget && close()}>
        {cur && (
          <div className="lb-panel relative flex min-h-full flex-col bg-ink md:flex-row" key={cur.id}>
            <div className="relative flex items-center justify-center bg-crimson p-6 md:w-[55%] md:p-12">
              <span aria-hidden="true" className="absolute left-1/2 top-1/2 aspect-square w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink/25 md:w-[70%]" />
              <div className="relative aspect-[400/520] w-full max-w-[min(420px,52dvh)] border-[3px] border-ink" style={{ boxShadow: "12px 12px 0 0 var(--ink)" }}>
                {cur.art}
              </div>
            </div>
            <div className="relative flex flex-1 flex-col justify-between gap-8 p-6 md:p-12">
              <div className="flex items-start justify-between gap-6">
                <p className="label text-vermilion">
                  Flash {String((index ?? 0) + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
                </p>
                <button type="button" onClick={close} className="label flex items-center gap-2 text-rice hover:text-vermilion" autoFocus>
                  Close <span aria-hidden="true" className="text-2xl leading-none">×</span>
                </button>
              </div>
              <div className="flex gap-6">
                <span aria-hidden="true" className="vertical font-display text-6xl font-extrabold leading-none text-gold md:text-8xl">
                  {cur.kanji}
                </span>
                <div>
                  <p className="label text-gold">{cur.romaji}</p>
                  <h3 id="lb-title" className="display mt-2 text-5xl font-extrabold md:text-7xl">
                    {cur.title}
                  </h3>
                  <p className="mt-5 max-w-md text-lg leading-relaxed text-rice/85">{cur.meaning}</p>
                  <dl className="mt-6 grid max-w-md grid-cols-2 gap-4 border-t-2 border-rice/20 pt-4">
                    <div>
                      <dt className="label text-rice/60">Artist</dt>
                      <dd className="mt-1 font-display text-lg font-semibold">{cur.artist}</dd>
                    </div>
                    <div>
                      <dt className="label text-rice/60">Best on</dt>
                      <dd className="mt-1 font-display text-lg font-semibold">{cur.placement}</dd>
                    </div>
                  </dl>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <button type="button" className="btn glint" onClick={() => request(cur.id)} style={{ ["--sh" as string]: "var(--crimson)" }}>
                  Request this design
                </button>
                <div className="flex gap-2">
                  <button type="button" onClick={() => step(-1)} className="label grid h-12 w-12 place-items-center border-2 border-rice/40 text-rice hover:border-vermilion hover:text-vermilion" aria-label="Previous design">
                    ←
                  </button>
                  <button type="button" onClick={() => step(1)} className="label grid h-12 w-12 place-items-center border-2 border-rice/40 text-rice hover:border-vermilion hover:text-vermilion" aria-label="Next design">
                    →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
