import { site } from "@/content/site";
import { Scramble } from "@/components/world/hud/Scramble";
import { ScrambleOnView } from "@/components/world/hud/ScrambleOnView";
import { ParticleName } from "@/components/ui/ParticleName";

/**
 * Pure visual of the hero. Rendered twice on the home page: once as the real
 * section (H1) and once as the inert clone at the end of the loop (H1 → <p>).
 * Everything here must render identically in both places (same classes: .reveal/.dissolve are
 * scroll-driven by the block's own timeline, so both copies sit at the same point of it). The clone's
 * manifesto is the same Scramble span markup as the hero's ScrambleOnView (it just never replays).
 * Phones (phone-stations.css, keyed on the st-hero-* hooks): the name sits R + 24 px above the visible
 * bottom over a full-width bottom scrim, which replaces the corner radial box.
 */
export function HeroVisual({ asClone = false }: { asClone?: boolean }) {
  return (
    <div className="dz-scope relative h-full w-full">
      <div data-hero-scrim="" aria-hidden="true" className="hidden phone:block" />

      {/* manifesto, igloo-style top-right block */}
      <div style={{ ["--dz-to" as string]: "55%", ["--dz-hold" as string]: "44svh" }} data-label-avoid="" className="st-hero-manifesto dissolve absolute right-5 top-36 max-w-[17rem] text-right sm:right-8 sm:top-[max(7rem,17svh)] sm:max-w-[22rem]">
        <p className="reveal label marker-muted mb-3">{"////// Manifesto"}</p>
        <p className="reveal marker text-balance sm:text-[13px]" style={{ ["--i" as string]: 1 }}>
          {asClone ? (
            <span>
              <Scramble text={site.manifesto} />
            </span>
          ) : (
            <ScrambleOnView text={site.manifesto} />
          )}
        </p>
      </div>

      {/* name + role, bottom-left */}
      <div style={{ ["--dz-to" as string]: "40%", ["--dz-hold" as string]: "32svh" }} data-label-avoid="" className="st-hero-name dissolve scrim scrim-corner absolute bottom-24 left-5 right-5 sm:bottom-28 sm:left-8 sm:right-auto">
        <p className="slash label marker-muted mb-4">{site.role}</p>
        <ParticleName as={asClone ? "p" : "h1"} words={site.name.split(" ")} className="st-hero-title display text-[clamp(3.75rem,11vw,9.5rem)] text-ink" />
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section id="hero" data-station="hero" className="station h-lvh">
      <HeroVisual />
    </section>
  );
}
