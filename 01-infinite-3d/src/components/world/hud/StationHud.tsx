"use client";
import dynamic from "next/dynamic";
import { useEffect, useState, type ComponentType, type CSSProperties } from "react";
import { site } from "@/content/site";
import { useWorld } from "../state/world-store";
import { usePhone } from "../phone";
import { Scramble } from "./Scramble";
import { SoundToggle } from "./SoundToggle";
import { LoopToggle } from "./LoopToggle";
import { Monogram } from "./Monogram";
import { LapMap } from "./LapMap";
import { StatusLine } from "./StatusLine";
import { NavPill } from "./NavPill";

const loadPhoneHud = () => import("@/components/phone/PhoneHud");
/** That chunk failed (offline, not cached): no phone chrome rather than the route's error page; 'online' retries. */
function PhoneHudRetry() {
  const [Hud, setHud] = useState<ComponentType | null>(null);
  useEffect(() => {
    const retry = () => loadPhoneHud().then((m) => setHud(() => m.default), () => {});
    addEventListener("online", retry);
    return () => removeEventListener("online", retry);
  }, []);
  return Hud ? <Hud /> : null;
}
/** Phone chrome (Dock / rail, Index sheet, jump veil, first-run cue): its own lazy chunk, mounted only on phones. */
const PhoneHud = dynamic(() => loadPhoneHud().catch(() => ({ default: PhoneHudRetry })), { ssr: false });

/** Astana wall clock (the desktop telemetry corner; the phone Index sheet footer mounts it while open). */
export function Clock() {
  const [time, setTime] = useState("--:--:--");
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: site.location.tz,
    });
    const tick = () => setTime(fmt.format(new Date()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);
  return <span suppressHydrationWarning>{time}</span>;
}

/** HUD boot module props: stagger index (globals.css `[data-boot]`), plus the frame it draws. */
const boot = (i: number) => ({ "data-boot": "", style: { ["--boot-i" as string]: i } as CSSProperties });
/** label that types on during boot: n = characters, for the stepped mask */
const typed = (n: number) => ({ "data-boot-type": "", style: { ["--n" as string]: n } as CSSProperties });

/**
 * Fixed mono HUD chrome (igloo-style corners). Reads only discrete store values.
 * Label grammar: '//' for passive labels, '[ ]' only on interactive things.
 * Each corner is a boot module (IntroLoader runs the boot after the intro).
 * Phones (components/world/phone.ts): the desktop corners are display:none from first paint
 * (phone:hidden) and unmounted after hydration; the monogram stays and <PhoneHud/> takes over.
 */
export function StationHud() {
  const phone = usePhone();
  const laps = useWorld((s) => s.laps);
  const mode = useWorld((s) => s.loopMode);
  const isHome = useWorld((s) => s.isHome);
  const hint = `${site.hint} ${site.hintLoop}`;
  const place = `${site.location.lat} ${site.location.lng}`;
  return (
    <div className="pointer-events-none fixed hud-safe z-20" data-hud>
      {/* top-left: monogram (opens into the handle); the station lives in the nav pill */}
      <header className="absolute left-5 top-5 sm:left-8 sm:top-8" {...boot(0)}>
        <span className="boot-frame" aria-hidden="true" />
        <Monogram />
      </header>

      {/* desktop corners: phone:hidden covers first paint on phones, then they unmount (no ticks, no clock) */}
      {!phone && (
        <>
          {/* floating glass pill nav: top-centre on desktop, top-right on phones */}
          <div className="absolute right-4 top-4 sm:right-auto sm:left-1/2 sm:top-7 sm:-translate-x-1/2 phone:hidden">
            <NavPill />
          </div>

          <aside aria-label="Scroll status">
            {/* bottom-left: hint + sound (igloo's corner) */}
            <div className="absolute bottom-5 left-5 sm:bottom-8 sm:left-8 phone:hidden" {...boot(1)}>
              <span className="boot-frame" aria-hidden="true" />
              {isHome && (mode === "loop" || mode === "touch-wrap") && laps === 0 && (
                <p className="slash label">
                  <span {...typed(hint.length)}>
                    {site.hint} <span className="marker-muted">{site.hintLoop}</span>
                  </span>
                </p>
              )}
              <div className="flex items-center gap-5">
                <SoundToggle />
                {isHome && <LoopToggle />}
              </div>
            </div>

            {/* bottom-right: coordinates + clock + telemetry */}
            <div className="label marker-muted absolute bottom-5 right-5 hidden text-right sm:bottom-8 sm:right-8 sm:block phone:hidden" {...boot(2)}>
              <span className="boot-frame" aria-hidden="true" />
              <p className="slash">
                <Scramble text={place} boot={2} />
              </p>
              <p className="mt-1">
                <span {...typed(site.location.city.length + 9)}>
                  {site.location.city} <Clock />
                </span>
              </p>
              <StatusLine className="mt-1" />
            </div>

            <div className="contents phone:hidden">{isHome && <LapMap />}</div>
          </aside>
        </>
      )}

      {phone && <PhoneHud />}
    </div>
  );
}
