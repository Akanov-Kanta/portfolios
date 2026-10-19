"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useEffectEvent, useRef, useState, useSyncExternalStore, type RefObject } from "react";
import { site } from "@/content/site";
import { STATIONS, requestWorld, useWorld, worldStore, type StationId } from "@/components/world/state/world-store";
import { DUR } from "@/components/world/theme";
import { addTick } from "@/components/world/ticker";
import { setSound } from "@/components/world/audio/ambient";
import { useLoopPref, writeLoopPref } from "@/components/world/scroll/loop-pref";
import { MonogramMark } from "@/components/world/hud/Monogram";
import { Clock } from "@/components/world/hud/StationHud";
import { IconSvg, socialKey } from "@/components/home/social-icons";
import { InstallHint } from "@/components/pwa/InstallHint";
import { canVibrate, hapticsEnabled, setHaptics } from "./haptics";
import { jump } from "./jump";
import { SwitchRow } from "./SwitchRow";
import { useOnline } from "./useOnline";

const REDUCED = "(prefers-reduced-motion: reduce)";
const subReduced = (cb: () => void) => {
  const mq = matchMedia(REDUCED);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const useReduced = () => useSyncExternalStore(subReduced, () => matchMedia(REDUCED).matches, () => false);

const pad = (i: number) => String(i + 1).padStart(2, "0");
const html = () => document.documentElement;

/** Leave the modal state: store, scroll lock. Safe to call twice. */
function release() {
  if (worldStore.getState().sheet !== "none") worldStore.getState().set({ sheet: "none" });
  delete html().dataset.sheet;
}

function CloseGlyph() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true">
      <path d="M2 2L14 14M14 2L2 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
    </svg>
  );
}

/**
 * '// SYS OK · FPS 60 · PHONE · LAP 02': the phone telemetry line (decorative, aria-hidden). Phones run
 * the PHONE profile, so it names that rather than a desktop tier. FPS rolls at 4 Hz on its own +25 tick
 * (mounted only while the sheet is open); static mode shows STATIC. Each item keeps to one line.
 */
function PhoneStatus({ laps }: { laps: number }) {
  const fps = useRef<HTMLSpanElement>(null);
  const frozen = useWorld((s) => s.tier === "static" || s.loopMode === "static");
  useEffect(() => {
    if (frozen) return;
    let frames = 0;
    let since = 0;
    let rate = 60;
    return addTick((time) => {
      frames++;
      if (!since) since = time;
      const dt = time - since;
      if (dt < 250) return;
      rate = rate * 0.5 + ((frames * 1000) / dt) * 0.5;
      frames = 0;
      since = time;
      if (fps.current) fps.current.textContent = String(Math.round(rate));
    }, 25);
  }, [frozen]);
  return (
    <p aria-hidden="true" className="ph-status">
      <span>{"// SYS OK"}</span> · {frozen ? <span>STATIC</span> : <span>FPS <span ref={fps}>60</span></span>} · <span>PHONE</span> ·{" "}
      <span>LAP {pad(laps)}</span>
    </p>
  );
}

function MailGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true" className="ph-row-icon">
      <path d="M3 5.5h18v13H3zM3.5 6l8.5 7 8.5-7" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * The phone's Index sheet: a full-screen <dialog id="index-sheet"> opened with showModal() (focus
 * moves in, the page behind is inert). While open, worldStore.sheet = 'menu' (the render policy
 * freezes WebGL) and html[data-sheet] locks page scroll. Contents: stations (a tap closes, then
 * jumps), the projects, socials + email, settings (Sound, Still = Loop off, Haptics where vibrate
 * exists, 'Load 3D world' when the mount was deferred), the install/share row and the telemetry
 * footer (PhoneStatus + Clock mounted only while open). Closes with ×, Esc and Android back (the
 * dialog's cancel / CloseWatcher); focus returns to the Menu button. The HUD root is
 * pointer-events:none and the top layer still inherits it, so the dialog sets pointer-events:auto.
 */
export default function IndexSheet({
  open,
  onClosed,
  menuRef,
}: {
  open: boolean;
  onClosed: () => void;
  menuRef: RefObject<HTMLButtonElement | null>;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  /** runs once the sheet has closed (a station row: jump after DUR.sheetOut) */
  const after = useRef<(() => void) | null>(null);
  /** the sheet closed because a link inside it changed the route: focus starts on the new page instead */
  const navClosed = useRef(false);
  const pathname = usePathname();
  const route = useRef(pathname);
  const isHome = useWorld((s) => s.isHome);
  const current = useWorld((s) => (s.isHome ? s.station : s.route));
  const sound = useWorld((s) => s.sound);
  const laps = useWorld((s) => s.laps);
  const deferred = useWorld((s) => s.worldDeferred && !s.webglReady);
  const loopPref = useLoopPref();
  const reduced = useReduced();
  const online = useOnline();
  // client-only (lazy, ssr:false): navigator / localStorage are safe in the initializers
  const [vibrate] = useState(canVibrate);
  const [haptics, setHapticsOn] = useState(hapticsEnabled);

  // `open` drives showModal; the parent dropping it (route change, unmount) closes at once
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      navClosed.current = false;
      d.removeAttribute("data-closing");
      // the dialog itself takes the initial focus (not ×, which WebKit then rings after a touch open);
      // screen readers hear the dialog's name, and Tab reaches × first
      d.setAttribute("autofocus", "");
      d.showModal();
      if (document.activeElement !== d) d.focus({ preventScroll: true });
      worldStore.getState().set({ sheet: "menu" });
      html().dataset.sheet = "menu";
    } else if (!open && d.open) d.close();
  }, [open]);

  // every way out (×, Esc / back, a station row, a route change) ends in the dialog's 'close'
  const onClose = useEffectEvent(() => {
    ref.current?.removeAttribute("data-closing");
    release();
    // closed by navigating (a project or station link): like any page change, focus starts on the new page
    // (Next announces the route). Returning it to Menu there also made WebKit ring Menu after a tap, since
    // its programmatic focus is focus-visible unless the last focus came from a mouse click.
    if (navClosed.current) (document.activeElement as HTMLElement | null)?.blur();
    else menuRef.current?.focus({ preventScroll: true });
    onClosed();
    const run = after.current;
    after.current = null;
    run?.();
  });
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const handler = () => onClose();
    d.addEventListener("close", handler);
    return () => {
      d.removeEventListener("close", handler);
      release();
    };
  }, []);

  // following a link inside the sheet: the new route shows at once
  useEffect(() => {
    if (pathname === route.current) return;
    route.current = pathname;
    if (ref.current?.open) {
      navClosed.current = true;
      ref.current.close();
    }
  }, [pathname]);

  const close = (then?: () => void) => {
    const d = ref.current;
    if (!d?.open || d.hasAttribute("data-closing")) return;
    after.current = then ?? null;
    if (matchMedia(REDUCED).matches) {
      d.close();
      return;
    }
    d.setAttribute("data-closing", "");
    window.setTimeout(() => d.close(), DUR.sheetOut);
  };

  const station = (id: StationId, i: number) => {
    const on = current === id;
    const body = (
      <>
        {on && <span className="ph-st-dot" aria-hidden="true" />}
        <span className="ph-st-idx label marker-muted" aria-hidden="true">
          {pad(i)}
        </span>
        <span className="ph-st-name">{site.phone.dock[id]}</span>
        <span className="ph-st-blurb marker marker-muted">{site.phone.blurb[id]}</span>
      </>
    );
    return isHome ? (
      <button type="button" className="ph-st" aria-current={on ? "true" : undefined} data-sfx="tick" onClick={() => close(() => jump(id))}>
        {body}
      </button>
    ) : (
      <Link href={`/#${id}`} className="ph-st" aria-current={on ? "true" : undefined} data-sfx="tick">
        {body}
      </Link>
    );
  };

  return (
    <dialog
      ref={ref}
      id="index-sheet"
      data-index-sheet=""
      aria-labelledby="index-sheet-title"
      tabIndex={-1}
      className="ph-sheet"
      onCancel={(e) => {
        // Esc / Android back: play the close; if the platform refuses the cancel, 'close' still cleans up
        e.preventDefault();
        close();
      }}
    >
      <div className="ph-sheet-inner">
        <header className="ph-sheet-head">
          <MonogramMark className="ph-sheet-mark" />
          <h2 id="index-sheet-title" className="sr-only">
            Menu
          </h2>
          <button type="button" className="ph-close" aria-label="Close menu" data-sfx="tick" onClick={() => close()}>
            <CloseGlyph />
          </button>
        </header>

        <nav aria-label="Index">
          <ul className="ph-list">
            {STATIONS.map((id, i) => (
              <li key={id}>{station(id, i)}</li>
            ))}
          </ul>
        </nav>

        <section className="ph-sheet-sec" aria-labelledby="index-sheet-work">
          <h3 id="index-sheet-work" className="slash label marker-muted">
            {site.phone.dock.projects}
          </h3>
          <ul className="ph-list">
            {site.projects.map((p) => (
              <li key={p.slug}>
                <Link href={`/projects/${p.slug}`} className="ph-row" aria-current={pathname === `/projects/${p.slug}` ? "page" : undefined} data-sfx="tick">
                  <span className="ph-project-name">{p.name}</span>
                  <span className="marker marker-muted">{p.date}</span>
                  <span className="ph-row-arrow" aria-hidden="true">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="ph-sheet-sec" aria-labelledby="index-sheet-elsewhere">
          <h3 id="index-sheet-elsewhere" className="slash label marker-muted">
            Elsewhere
          </h3>
          <ul className="ph-list">
            {site.socials.map((s) => (
              <li key={s.href}>
                <a href={s.href} target="_blank" rel="noreferrer" className="ph-row" data-sfx="tick">
                  <IconSvg keyName={socialKey(s.label, s.href)} size={18} className="ph-row-icon" />
                  <span>{s.label}</span>
                  <span className="sr-only"> (opens in a new tab)</span>
                  <span className="ph-row-arrow" aria-hidden="true">
                    ↗
                  </span>
                </a>
              </li>
            ))}
            <li>
              <a href={`mailto:${site.email}`} className="ph-row" data-sfx="tick">
                <MailGlyph />
                <span className="ph-row-mono">{site.email}</span>
                <span className="ph-row-arrow" aria-hidden="true">
                  ↗
                </span>
              </a>
            </li>
          </ul>
        </section>

        <section className="ph-sheet-sec" aria-labelledby="index-sheet-settings">
          <h3 id="index-sheet-settings" className="slash label marker-muted">
            Settings
          </h3>
          <div className="ph-list">
            <SwitchRow label="Sound" checked={sound} onChange={(on) => void setSound(on)} />
            <SwitchRow
              label="Still mode"
              checked={reduced || loopPref === "off"}
              disabled={reduced}
              note={reduced ? site.phone.stillSystem : undefined}
              onChange={(on) => writeLoopPref(on ? "off" : "on")}
            />
            {vibrate && (
              <SwitchRow
                label="Haptics"
                checked={haptics}
                onChange={(on) => {
                  setHaptics(on);
                  setHapticsOn(on);
                }}
              />
            )}
            {deferred && (
              // the sheet closes first, so the Dock shimmer and the world's fade-in / develop are seen
              <button type="button" className="ph-row ph-load" data-sfx="tick" onClick={() => close(requestWorld)}>
                <span className="bracket">{site.phone.loadWorld}</span>
              </button>
            )}
          </div>
        </section>

        <section className="ph-sheet-sec ph-sheet-app" aria-labelledby="index-sheet-app">
          <h3 id="index-sheet-app" className="slash label marker-muted">
            App
          </h3>
          <InstallHint placement="sheet" />
        </section>

        <footer className="ph-sheet-foot label marker-muted">
          <p>
            {site.location.lat} {site.location.lng} · {site.location.city} {open && <Clock />}
          </p>
          {open && <PhoneStatus laps={laps} />}
          {!online && (
            <p className="ph-offline" role="status">
              <span aria-hidden="true">{"// "}</span>
              {site.phone.offline}
            </p>
          )}
        </footer>
      </div>
    </dialog>
  );
}
