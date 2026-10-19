import { EyeDefs } from "@/components/art/Eye";
import { Grain } from "./Grain";
import { FLASH_ID } from "./flash";

/**
 * Full-screen post layer, above everything, never interactive: vignette, film grain, white flash,
 * plus the shared SVG defs referenced by id across the page (#fx-glow bloom; the eye gradient + bloom).
 * Nothing here uses `filter` on a wrapper (that would make a containing block and break fixed/pinned
 * descendants); the grain is a blend-mode layer.
 */
export function FxLayer() {
  return (
    <>
      <svg aria-hidden width="0" height="0" className="pointer-events-none absolute" focusable="false">
        <defs>
          {/* bloom: tight + wide blur merged under the source */}
          <filter id="fx-glow" x="-40%" y="-80%" width="180%" height="260%" colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="b1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="9" result="b2" />
            <feComponentTransfer in="b2" result="b2s">
              <feFuncA type="linear" slope="1.6" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode in="b2s" />
              <feMergeNode in="b1" />
              <feMergeNode in="b1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>
      <EyeDefs />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{ zIndex: "var(--z-fx)", background: "var(--vignette)" }}
      />
      <Grain />
      <div
        id={FLASH_ID}
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-0"
        style={{ zIndex: "var(--z-flash)", background: "var(--paper-0)" }}
      />
    </>
  );
}
