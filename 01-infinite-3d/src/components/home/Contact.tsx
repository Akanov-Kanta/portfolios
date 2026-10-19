import { ContactStatus } from "./FooterModules";
import { SocialCarousel } from "./SocialCarousel";
import { SocialArrows } from "./SocialArrows";
import { SocialGrid } from "./SocialGrid";
import { OrbLink } from "./OrbLink";
import { IconSvg, socialKey } from "./social-icons";
import { ScrambleOnView } from "@/components/world/hud/ScrambleOnView";
import { site } from "@/content/site";

const first = site.socials[0];

/**
 * One screen, pinned over the server-room hold (igloo's final frame):
 * heading + status top-left, orb logo centre (click opens the platform: OrbLink), side arrows,
 * platform label in the floor ring,
 * no footer strip (igloo). The section is 150svh so the stage stays pinned
 * while you linger; near the wrap it is pushed up by at most 15% (the loop's transition window),
 * so nothing important sits in the stage's top 15%.
 *
 * Phones (phone-stations.css, st-contact-* hooks): the stage (data-slot-root) becomes a column: the
 * heading band under the top zone, the orb slot in the middle (the camera frames the 3D orb into it;
 * the DOM brand icon in corner brackets stands in before the world is ready and without WebGL), a 2x2
 * grid of real social links, then the install offer, all above the Dock. The slot and the grid are
 * server-rendered and display:none elsewhere; the phone-only PhoneHud chunk adds their behaviour
 * (phone/PhoneHome.tsx → OrbStage) and portals the install offer in as the stage's last child. The
 * arrows and the label carousel are hidden there; the carousel stays mounted, so it keeps publishing
 * the selection.
 */
export function Contact() {
  return (
    <section id="contact" data-station="contact" className="station min-h-[150svh]">
      <div data-slot-root="" className="st-contact sticky top-0 h-svh w-full">
        <OrbLink />
        <div className="st-contact-band scrim absolute left-5 top-[15svh] max-w-md sm:left-8 sm:top-[29svh] lg:left-16" style={{ ["--scrim-at" as string]: "20% 40%", ["--scrim-a" as string]: "0.7" }}>
          <h2 className="st-display-l display text-5xl text-ink sm:text-6xl md:text-7xl">
            <ScrambleOnView text="Let's talk." />
          </h2>
          <ContactStatus />
        </div>
        <SocialArrows />
        <div className="absolute inset-x-0 bottom-[16svh] flex justify-center px-5 sm:bottom-[8svh] phone:hidden">
          <SocialCarousel />
        </div>
        {first && (
          <div data-frame-slot="orb" role="presentation" aria-hidden="true" className="st-orb hidden phone:flex">
            <span data-orb-icon="">
              <span data-orb-glyph="">
                <IconSvg keyName={socialKey(first.label, first.href)} size={96} />
              </span>
            </span>
          </div>
        )}
        <SocialGrid />
      </div>
    </section>
  );
}
