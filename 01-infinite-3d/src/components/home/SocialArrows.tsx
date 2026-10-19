"use client";
import { socialStore } from "@/components/world/state/social-store";

/**
 * igloo's side arrows: a thin horizontal line with a short angled tick at the outer end
 * (half an arrowhead). They sit about a quarter of the width in from each side, flanking the
 * orb logo; narrow windows keep them at the screen edges. Magnetic (the inner span moves, the button
 * box and its focus ring stay put); the cursor sticks to them and shows the direction. Hidden on
 * phones: the orb stage takes taps and flicks there, and the social grid carries the links.
 */
function Arrow({ dir }: { dir: -1 | 1 }) {
  const right = dir === 1;
  return (
    <button
      type="button"
      onClick={() => socialStore.getState().step(dir)}
      aria-label={right ? "Next link" : "Previous link"}
      data-magnetic=""
      data-cursor={right ? "next" : "prev"}
      data-cursor-stick=""
      data-sfx="tick"
      className={`roll group absolute top-[47%] -translate-y-1/2 p-4 text-ink/80 transition-colors hover:text-screen focus-visible:text-screen phone:hidden ${right ? "right-[3vw] sm:right-[21%]" : "left-[3vw] sm:left-[21%]"}`}
    >
      <span className="block">
        {/* letter-roll for the arrow: it slides out along its direction as a copy slides in */}
        <span className="icon-roll transition-transform duration-300 ease-[var(--ease-soft)] group-active:scale-95" style={{ ["--dir" as string]: dir }}>
          {[0, 1].map((k) => (
            <svg key={k} viewBox="0 0 80 12" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="square" aria-hidden="true" className="block h-auto w-14 sm:w-[76px]">
              {right ? <path d="M1 11 H79 L69 2" /> : <path d="M79 11 H1 L11 2" />}
            </svg>
          ))}
        </span>
      </span>
    </button>
  );
}

export function SocialArrows() {
  return (
    <>
      <Arrow dir={-1} />
      <Arrow dir={1} />
    </>
  );
}
