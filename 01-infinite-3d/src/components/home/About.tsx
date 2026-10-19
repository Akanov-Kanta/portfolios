import { site } from "@/content/site";
import { ScrubText } from "@/components/ui/ScrubText";
import { SpotlightCard } from "@/components/ui/SpotlightCard";

/**
 * Left column only: the monitors glow centre-right in this camera pose, so text never crosses them.
 * Bio words light up as they scroll into place (Jitter); below, a gapless 2-column bento
 * (grid-flow-dense: Stack spans 2, then Now + Based in = 4 cells, no voids) of spotlight cards.
 * Phones (phone-stations.css, st-about-* hooks): each paragraph fades up as it enters instead of the
 * per-word scrub, the bento is one column of solid cards and the bottom padding clears the Dock;
 * landscape keeps the text in the left 60 % so the room stays visible on the right.
 */
export function About() {
  return (
    <section id="about" data-station="about" className="station min-h-svh">
      <div className="st-about dz-scope scrim scrim-left flex min-h-svh flex-col justify-center px-5 py-24 sm:px-8 lg:px-16">
        <div className="st-about-bio dissolve prose-ink max-w-xl space-y-5 text-xl leading-[1.3] tracking-[-0.015em] text-ink sm:text-2xl md:text-[1.75rem]">
          {site.bio.map((p, i) => (
            <ScrubText key={i} text={p} />
          ))}
        </div>
        <div style={{ ["--dz-to" as string]: "40%", ["--dz-hold" as string]: "32svh" }} className="st-about-bento dissolve mt-10 grid max-w-xl grid-flow-dense grid-cols-1 gap-3 sm:grid-cols-2">
          <SpotlightCard className="sm:col-span-2">
            <p className="slash label marker-muted mb-3">Stack</p>
            <ul className="flex flex-wrap gap-1.5">
              {site.skills.map((s) => (
                <li key={s} className="chip">
                  {s}
                </li>
              ))}
            </ul>
          </SpotlightCard>
          <SpotlightCard>
            <p className="slash label marker-muted mb-3">Now</p>
            <p className="marker text-[13px] leading-relaxed">{site.currently}</p>
          </SpotlightCard>
          <SpotlightCard>
            <p className="slash label marker-muted mb-3">Based in</p>
            <p className="marker text-[13px] leading-relaxed">
              {site.location.city}, Kazakhstan
              <br />
              <span className="marker-muted">Open to remote</span>
            </p>
          </SpotlightCard>
        </div>
      </div>
    </section>
  );
}
