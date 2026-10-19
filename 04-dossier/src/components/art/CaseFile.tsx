import type { Project } from "@/content/site";
import { Eye } from "./Eye";

const tiny: React.CSSProperties = {
  fontSize: "max(11px, 0.72em)",
  letterSpacing: "0.14em",
  lineHeight: 1.3,
};

/**
 * A project's "case file" for the evidence strip: file number and date, the name large, the tagline and
 * tags in tiny caps, and an "OPEN FILE →" affordance when the strip is a link. A dim cropped eye sits in
 * the dark half so the strip still reads as an eye strip.
 */
export function CaseFile({
  project,
  index,
  total,
  linked,
}: {
  project: Pick<Project, "name" | "date" | "tagline" | "tags">;
  index: number;
  total: number;
  linked: boolean;
}) {
  return (
    <div className="caption relative flex h-full w-full flex-col justify-between overflow-hidden px-[3%] py-[2.2%]" style={{ textShadow: "none" }}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: "repeating-linear-gradient(-58deg, rgba(240,240,240,0.05) 0 1px, transparent 1px 8px)" }}
      />
      <Eye
        seed={60 + index}
        glow={false}
        className="pointer-events-none absolute h-auto opacity-25"
        style={{ right: "-6%", top: "-30%", width: "46%" }}
      />
      <div className="relative flex justify-between" style={{ ...tiny, opacity: 0.6 }}>
        <span>
          FILE {String(index).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
        <span>{project.date}</span>
      </div>
      <div className="relative">
        <p
          className="leading-none"
          style={{
            fontSize: "clamp(22px, 3.4vw, 54px)",
            fontWeight: 400,
            letterSpacing: "0.08em",
            textShadow: "var(--glow-text)",
          }}
        >
          {project.name}
        </p>
        <p className="mt-[0.5em] truncate max-md:hidden" style={{ ...tiny, opacity: 0.7 }}>
          {project.tagline}
        </p>
      </div>
      <div className="relative flex items-end justify-between gap-4" style={tiny}>
        <span className="truncate" style={{ opacity: 0.6 }}>
          {project.tags.join(" / ")}
        </span>
        {linked ? (
          <span
            className="shrink-0 border-b pb-[2px] opacity-70 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
            style={{ borderColor: "rgba(240,240,240,0.45)" }}
          >
            OPEN FILE →
          </span>
        ) : null}
      </div>
    </div>
  );
}
