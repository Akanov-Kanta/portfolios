"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { site } from "@/content/site";
import { useFileSlug } from "@/lib/fileRoute";
import { SectionHead } from "./SectionHead";
import { FileRow } from "./FileRow";
import { FileView } from "./FileView";

/**
 * 02 FILES: the work index, and the file view it opens. The open file follows the URL (?file=<slug>);
 * `shown` lags it while the close animation plays.
 */
export function Files() {
  const route = useFileSlug();
  const [shown, setShown] = useState<string | null>(null);
  const [prev, setPrev] = useState<string | null>(null);
  if (route !== prev) {
    setPrev(route);
    if (route) setShown(route);
  }
  const closing = shown !== null && route === null;
  const years = site.projects.map((p) => p.date.slice(-4)).sort();

  return (
    <section id="files" aria-labelledby="files-title" className="files">
      <SectionHead
        id="files-title"
        index="02"
        title="Files"
        note={`Selected work, ${years[0]}–${years[years.length - 1]}`}
        count={`${String(site.projects.length).padStart(2, "0")} entries`}
      />
      <ol className="rows">
        {site.projects.map((p, i) => (
          <FileRow key={p.slug} project={p} index={i} total={site.projects.length} />
        ))}
      </ol>
      {shown
        ? createPortal(<FileView key={shown} slug={shown} closing={closing} onClosed={() => setShown(null)} />, document.body)
        : null}
    </section>
  );
}
