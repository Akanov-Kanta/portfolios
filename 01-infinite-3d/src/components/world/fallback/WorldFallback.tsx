import { MOODS, PALETTE } from "../theme";
import { GlowPoster } from "./GlowPoster";

/**
 * The lap's moods as one tall vertical band, top to bottom: warm room (hero, about), cold void
 * (projects), violet gate, teal server room, and back to the room so the loop seam matches.
 * Built from the same MOODS keys as the 3D grade (fogHigh, the lighter fog tone), so the fallback
 * reads as the same night.
 */
const [hero, about, projects, portal, contact] = MOODS.map((m) => m.fogHigh);
const [, , voidDeep] = MOODS.map((m) => m.fog);
const BAND = `linear-gradient(to bottom, ${hero} 0%, ${hero} 10%, ${about} 26%, ${projects} 42%, ${voidDeep} 54%, ${portal} 66%, ${contact} 78%, ${hero} 90%, ${hero} 100%)`;

/**
 * CSS-only backdrop: shown before the canvas is warm and forever when WebGL2 is missing.
 * The band slides with the page scroll (globals.css .fallback-moods, a compositor-only scroll
 * timeline); without scroll-timeline support it rests on the room. Fixed on top of it: igloo's
 * diagonal (darker bottom-left), the moon glare top-right, and a few stars. Every tone stays dark
 * enough that ink and muted text keep AA contrast. Phones add the GlowPoster over the room.
 */
export function WorldFallback() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true" style={{ background: PALETTE.void }}>
      <div className="fallback-moods absolute inset-x-0 top-0 will-change-transform" style={{ height: "500%", background: BAND }} />
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to top right, rgba(10,11,16,0.45) 0%, rgba(10,11,16,0) 60%), radial-gradient(70% 55% at 100% 0%, ${PALETTE.moon}24, transparent 70%)`,
        }}
      />
      <div
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "radial-gradient(1px 1px at 12% 18%, #c3d0ff 50%, transparent 51%), radial-gradient(1px 1px at 48% 8%, #8aa3ff 50%, transparent 51%), radial-gradient(1.5px 1.5px at 78% 22%, #e8e9f0 50%, transparent 51%), radial-gradient(1px 1px at 88% 64%, #c3d0ff 50%, transparent 51%), radial-gradient(1px 1px at 32% 52%, #8aa3ff 50%, transparent 51%), radial-gradient(1px 1px at 62% 78%, #c3d0ff 50%, transparent 51%)",
          backgroundSize: "600px 400px",
        }}
      />
      <GlowPoster />
    </div>
  );
}
