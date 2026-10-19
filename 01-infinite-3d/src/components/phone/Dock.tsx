"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type RefObject } from "react";
import { site } from "@/content/site";
import { STATIONS, useWorld } from "@/components/world/state/world-store";
import { isStandalone, usePhoneLand } from "@/components/world/phone";
import { haptic } from "./haptics";
import { jump } from "./jump";
import { installDockMotion } from "./dock-motion";
import { useOnline } from "./useOnline";

/**
 * One-constant fallback (verification §7): if Safari 26's collapsing bar fights a bottom Dock on a
 * real iPhone, set 'top'. It applies only to iPhone Safari in browser mode; standalone and Android
 * keep the bottom Dock. Both edges are styled (phone-hud.css [data-edge]).
 */
const IOS_BROWSER_EDGE = "bottom" as "bottom" | "top";

function topEdge(): boolean {
  if (IOS_BROWSER_EDGE !== "top") return false;
  const ua = navigator.userAgent;
  return /iPhone|iPod/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua) && !isStandalone();
}

const pad = (i: number) => String(i + 1).padStart(2, "0");

/** '[≡]': the monogram's bracket grammar around three bars */
function MenuGlyph() {
  return (
    <svg viewBox="0 0 24 16" width="24" height="16" fill="none" aria-hidden="true">
      <path d="M4.5 1H1V15H4.5M19.5 1H23V15H19.5M7.5 4.5H16.5M7.5 8H16.5M7.5 11.5H16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
    </svg>
  );
}

/**
 * The phone's station nav: a floating bottom bar (portrait) or a right rail (phone-land).
 * Four labelled tabs, a divider and the Menu button; a 2 px cyan lap hairline (scale = frame.t);
 * 3 project micro-dots under WORK; a shimmer on the hairline while the world mounts.
 * On home the tabs are buttons that jump (phone/jump.ts); on inner pages they are Links to
 * /#station with the route's station (WORK) active. Per-frame work lives in dock-motion.ts.
 * It is never display:none or visibility:hidden: receding is a transform, so it stays in the
 * accessibility tree.
 */
export function Dock({ menuOpen, onMenu, menuRef }: { menuOpen: boolean; onMenu: () => void; menuRef: RefObject<HTMLButtonElement | null> }) {
  const rail = usePhoneLand();
  const isHome = useWorld((s) => s.isHome);
  const active = useWorld((s) => (s.isHome ? s.station : s.route));
  const laps = useWorld((s) => s.laps);
  const loading = useWorld((s) => s.mounting && !s.webglReady);
  const online = useOnline();
  const pathname = usePathname();
  // client-only component (PhoneHud is ssr:false), so reading the UA in the initializer is safe
  const [edge] = useState(() => (topEdge() ? "top" : undefined));
  const nav = useRef<HTMLElement>(null);
  const fill = useRef<HTMLSpanElement>(null);
  const dots = useRef<HTMLSpanElement>(null);
  const innerDot = useRef(-1);
  const lapsSeen = useRef(laps);

  useEffect(() => {
    innerDot.current = site.projects.findIndex((p) => pathname === `/projects/${p.slug}`);
  }, [pathname]);

  // the WORK tab switches between <button> and <Link> with the route, so re-bind to its dots
  useEffect(() => {
    if (!nav.current) return;
    return installDockMotion({ nav: nav.current, fill: fill.current, dots: dots.current, innerDot });
  }, [isHome]);

  // a completed lap: HOME's pill springs in again (its glow is keyed by laps) with an Android tick
  useEffect(() => {
    if (laps > lapsSeen.current) haptic(10);
    lapsSeen.current = laps;
  }, [laps]);

  return (
    <nav ref={nav} aria-label="Stations" data-phone-dock="" data-variant={rail ? "rail" : "bar"} data-edge={rail ? undefined : edge} className="ph-dock">
      <span className="ph-lap" aria-hidden="true">
        <span ref={fill} className="ph-lap-fill" />
        {loading && <span className="ph-shimmer" />}
      </span>
      <ul className="ph-tabs">
        {STATIONS.map((id, i) => {
          const on = active === id;
          const inner = (
            <>
              {on && <span key={id === "hero" ? laps : 0} className="nav-pill-glow ph-tab-glow" aria-hidden="true" />}
              <span className="ph-tab-num" aria-hidden="true">
                {pad(i)}
              </span>
              <span className="ph-tab-label">{site.phone.dock[id]}</span>
              {id === "projects" && (
                <span ref={dots} className="ph-dots" aria-hidden="true">
                  {site.projects.map((p) => (
                    <span key={p.slug} className="ph-dot" />
                  ))}
                </span>
              )}
            </>
          );
          return (
            <li key={id} className="ph-tab-item">
              {isHome ? (
                <button
                  type="button"
                  className="ph-tab"
                  aria-current={on ? "true" : undefined}
                  data-sfx="tick"
                  onClick={() => {
                    haptic(8);
                    jump(id);
                  }}
                >
                  {inner}
                </button>
              ) : (
                <Link href={`/#${id}`} className="ph-tab" aria-current={on ? "true" : undefined} data-sfx="tick" onClick={() => haptic(8)}>
                  {inner}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
      <span className="ph-divider" aria-hidden="true" />
      <button
        ref={menuRef}
        type="button"
        className="ph-menu"
        data-phone-menu=""
        aria-haspopup="dialog"
        aria-controls="index-sheet"
        aria-expanded={menuOpen}
        data-sfx="tick"
        onClick={onMenu}
      >
        <MenuGlyph />
        <span className="sr-only">Menu{online ? "" : `, ${site.phone.offline}`}</span>
        {!online && <span className="ph-offline-dot" aria-hidden="true" />}
      </button>
    </nav>
  );
}
