/**
 * Phones: a zero-byte CSS poster of the room's light where the portrait room will render (cyan
 * monitors, the warm lamp / doorway, the lit shelf, rug warmth), so the empty band above the name
 * reads as a room before the world mounts. Styles and the scroll fade live in phone-runtime.css
 * ([data-glow-poster]); display:none on every other device, and gone with the fallback at world-ready.
 */
export function GlowPoster() {
  return <div data-glow-poster="" aria-hidden="true" className="absolute inset-0 hidden phone:block" />;
}
