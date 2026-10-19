import { site } from "@/content/site";
import { IconSvg, socialKey } from "./social-icons";

/**
 * Phone contact links: a 2x2 grid of real links (48 px chips: brand glyph, label, ↗; new tab).
 * Server-rendered markup only (display:none off phones, zero JS on desktop). On phones OrbStage's
 * wireContact() adds the behaviour: pointerdown / focus selects a chip first, so the orb morphs to that
 * platform before the link opens, and data-active follows the orb (cyan hairline; index 0 at load).
 */
export function SocialGrid() {
  return (
    <ul data-social-grid="" aria-label="Social links" className="hidden phone:grid">
      {site.socials.map((s, k) => (
        <li key={s.label}>
          <a href={s.href} target="_blank" rel="noreferrer" data-active={k === 0 ? "" : undefined} data-sfx="tick">
            <IconSvg keyName={socialKey(s.label, s.href)} size={18} />
            <span data-social-label="">{s.label}</span>
            <span aria-hidden="true" data-social-arrow="">
              ↗
            </span>
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
