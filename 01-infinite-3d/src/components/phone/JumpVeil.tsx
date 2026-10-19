/**
 * Void veil for far station jumps (phone/jump.ts toggles [data-on]): DUR.jumpIn up on --ease-hard,
 * DUR.jumpOut down on --ease-soft (phone-hud.css). Decorative, never hit-testable; it sits under the
 * Dock and the monogram, so the chrome stays put while the world cuts.
 */
export function JumpVeil() {
  return <div data-jump-veil="" aria-hidden="true" className="ph-veil" />;
}
