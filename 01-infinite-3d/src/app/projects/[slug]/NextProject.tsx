import Link from "next/link";
import { accentOf, site } from "@/content/site";
import { ScrambleOnView } from "@/components/world/hud/ScrambleOnView";

/**
 * igloo's "next project" footer: a huge title that re-scrambles as it scrolls in, over a hairline that
 * fills with the page scroll (CSS view timeline). It only ever navigates on click / Enter: the fill is
 * decoration, never a countdown. Phones (st-next-* hooks): display-l size and a 48 px target.
 */
export function NextProject({ index }: { index: number }) {
  const n = site.projects.length;
  const ni = (index + 1) % n;
  const next = site.projects[ni]!;
  const accent = accentOf(next, ni);
  return (
    <div className="st-next mt-24" style={{ ["--accent" as string]: accent }}>
      <div className="next-fill" aria-hidden="true" />
      <p className="slash label marker-muted mt-6">
        Next <span className="marker-muted">{String(ni + 1).padStart(2, "0")}</span>
      </p>
      <Link
        href={`/projects/${next.slug}`}
        aria-label={`Next project: ${next.name}`}
        data-cursor="next"
        data-cursor-text="NEXT"
        data-cursor-accent={accent}
        data-sfx="tick"
        className="st-next-title display lockup mt-3 inline-block text-[clamp(3rem,9vw,7.5rem)] text-ink transition-colors hover:text-[var(--accent)] focus-visible:text-[var(--accent)]"
      >
        <ScrambleOnView text={next.name} lockup={ni} replayOnHover />
      </Link>
    </div>
  );
}
