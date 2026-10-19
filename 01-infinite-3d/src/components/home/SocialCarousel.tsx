"use client";
import { useEffect } from "react";
import { site } from "@/content/site";
import { Scramble } from "@/components/world/hud/Scramble";
import { IconSvg, socialKey } from "./social-icons";
import { socialStore, useSocial } from "@/components/world/state/social-store";
import { useWorld } from "@/components/world/state/world-store";

/**
 * igloo-style footer selector. The brand icon lives in the 3D scene (IconCloud on the plinth)
 * and morphs with the selection. The selection index lives in socialStore so the big side
 * arrows (SocialArrows) and this label row share it. Changes only on user input, so the orb
 * solid is not constantly mid-morph. A DOM icon fallback shows only when WebGL is unavailable.
 * A change kicks fx.impulse + the morph sound (social-store) and the label re-scrambles.
 */
export function SocialCarousel() {
  const items = site.socials;
  const n = items.length;
  const i = useSocial((s) => s.index);
  const webglReady = useWorld((s) => s.webglReady);
  const at = (k: number) => items[((k % n) + n) % n];
  const active = at(i);

  // publish the selection to the 3D logo
  useEffect(() => {
    socialStore.getState().set({ count: n, key: socialKey(active.label, active.href), label: active.label, href: active.href });
  }, [n, active.label, active.href]);

  const step = (d: number) => socialStore.getState().step(d);

  return (
    <div
      className="flex flex-col items-center"
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") step(-1);
        if (e.key === "ArrowRight") step(1);
      }}
      role="group"
      aria-label="Social links"
    >
      {/* DOM icon: only when the 3D scene can't show its orb logo */}
      {!webglReady && (
        <a href={active.href} target="_blank" rel="noreferrer" className="group relative mb-6 block" aria-label={active.label}>
          <span aria-hidden="true" className="pointer-events-none absolute -inset-x-4 -inset-y-3 opacity-70">
            <span className="absolute left-0 top-0 h-3 w-3 border-l border-t border-ink" />
            <span className="absolute right-0 top-0 h-3 w-3 border-r border-t border-ink" />
            <span className="absolute bottom-0 left-0 h-3 w-3 border-b border-l border-ink" />
            <span className="absolute bottom-0 right-0 h-3 w-3 border-b border-r border-ink" />
          </span>
          <span key={active.label} className="animate-[iconIn_320ms_var(--ease-soft)] block text-ink transition-colors group-hover:text-screen">
            <IconSvg keyName={socialKey(active.label, active.href)} size={40} />
          </span>
        </a>
      )}

      <div className="flex select-none items-center justify-center gap-6 sm:gap-10">
        {n > 2 && (
          <button type="button" onClick={() => step(-1)} data-cursor="prev" data-sfx="tick" className="roll label marker-muted hidden w-28 text-right opacity-45 transition-opacity hover:opacity-80 focus-visible:opacity-80 sm:inline" aria-label={`Previous: ${at(i - 1).label}`}>
            <span className="lm" data-text={at(i - 1).label}>
              {at(i - 1).label}
            </span>
          </button>
        )}
        <a href={active.href} target="_blank" rel="noreferrer" data-cursor="open" data-cursor-text="OPEN" data-sfx="tick" className="relative block px-5 py-2 text-center">
          {/* igloo's corner brackets around the active label */}
          <span aria-hidden="true" className="pointer-events-none absolute inset-0">
            <span className="absolute left-0 top-0 h-2.5 w-2.5 border-l border-t border-ink/80" />
            <span className="absolute right-0 top-0 h-2.5 w-2.5 border-r border-t border-ink/80" />
            <span className="absolute bottom-0 left-0 h-2.5 w-2.5 border-b border-l border-ink/80" />
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 border-b border-r border-ink/80" />
          </span>
          <span className="label block w-36 text-[13px] text-ink transition-colors hover:text-screen">
            <Scramble text={active.label} replayOnHover />
          </span>
        </a>
        {n > 2 && (
          <button type="button" onClick={() => step(1)} data-cursor="next" data-sfx="tick" className="roll label marker-muted hidden w-28 text-left opacity-45 transition-opacity hover:opacity-80 focus-visible:opacity-80 sm:inline" aria-label={`Next: ${at(i + 1).label}`}>
            <span className="lm" data-text={at(i + 1).label}>
              {at(i + 1).label}
            </span>
          </button>
        )}
      </div>

      <div className="mt-4 flex gap-1.5" aria-hidden="true">
        {items.map((s, k) => (
          <button key={s.label} type="button" onClick={() => socialStore.getState().set({ index: k })} className={`h-1.5 w-1.5 rounded-full transition-colors ${k === i ? "bg-screen" : "bg-ink/30 hover:bg-ink/60"}`} tabIndex={-1} />
        ))}
      </div>
      <ul className="sr-only">
        {items.map((s) => (
          <li key={s.label}>
            <a href={s.href}>{s.label}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
