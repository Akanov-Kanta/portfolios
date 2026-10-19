import { site } from "@/content/site";
import { SOCIAL_ICONS, socialKey } from "./social-icons";
import { socialStore } from "@/components/world/state/social-store";
import { frame, wake, worldStore } from "@/components/world/state/world-store";
import { haptic } from "@/components/phone/haptics";
import { EASE, cssEase } from "@/components/world/theme";

/** a tap is short and still, a flick is quick and mostly horizontal, a hold is a still press */
const TAP_MS = 250;
const TAP_PX = 10;
const FLICK_PX = 40;
const FLICK_MS = 400;
const HOLD_MS = 250;

/**
 * The phone contact stage's behaviour, wired onto the server-rendered stage (Contact.tsx: the orb slot
 * and the social grid). Lazy-loaded on phones only (phone/PhoneHome.tsx, in the PhoneHud chunk), so
 * desktops never download it.
 * - Orb slot ([data-frame-slot="orb"]; the camera lens-shifts the 3D orb into it): tap = next platform,
 *   horizontal flick = next / previous (socialStore.step fires the morph + impulse), press and hold =
 *   the orbs flee the finger (frame.pointer in canvas NDC + frame.pointerLive; the only writer of both
 *   on phones) until it lifts. touch-action pan-y pinch-zoom (CSS): a vertical swipe or a pinch still
 *   scrolls / zooms from the slot, and cancels a hold.
 * - Social grid: pointerdown / focus selects a chip first, so the orb morphs before the link opens.
 * - Store → DOM: data-active on the chip matching the orb; the DOM brand icon (the stand-in before the
 *   world is ready, and without WebGL) swaps with the selection and fades out at webglReady (CSS).
 * - Copy email: an Android tick once a copy succeeded (ContactStatus swaps the label only then).
 */
export function wireContact(stage: HTMLElement): () => void {
  const slot = stage.querySelector<HTMLElement>('[data-frame-slot="orb"]');
  const grid = stage.querySelector<HTMLElement>("[data-social-grid]");
  const icon = stage.querySelector<HTMLElement>("[data-orb-icon]");
  const chips = grid ? [...grid.querySelectorAll<HTMLAnchorElement>("a")] : [];
  const offs: (() => void)[] = [];
  const on = <K extends keyof HTMLElementEventMap>(el: HTMLElement, type: K, fn: (e: HTMLElementEventMap[K]) => void) => {
    el.addEventListener(type, fn);
    offs.push(() => el.removeEventListener(type, fn));
  };

  // ---- store → DOM ----
  const n = site.socials.length;
  let shown = 0; // the server renders socials[0]
  const show = (index: number, animate: boolean) => {
    const k = ((index % n) + n) % n;
    chips.forEach((c, j) => c.toggleAttribute("data-active", j === k));
    const glyph = icon?.querySelector<HTMLElement>("[data-orb-glyph]");
    const svg = glyph?.querySelector("svg");
    if (k === shown || !glyph || !svg) return;
    shown = k;
    const s = site.socials[k]!;
    const def = SOCIAL_ICONS[socialKey(s.label, s.href)] ?? SOCIAL_ICONS.globe!;
    svg.setAttribute("viewBox", def.vb);
    svg.innerHTML = def.inner;
    if (animate && !matchMedia("(prefers-reduced-motion: reduce)").matches)
      glyph.animate([{ opacity: 0, transform: "translateY(6px) scale(0.85)" }, { opacity: 1, transform: "none" }], { duration: 320, easing: cssEase(EASE.soft) });
  };
  const ready = (v: boolean) => icon?.toggleAttribute("data-ready", v);
  show(socialStore.getState().index, false);
  ready(worldStore.getState().webglReady);
  offs.push(socialStore.subscribe((s, p) => s.index !== p.index && show(s.index, true)));
  offs.push(worldStore.subscribe((s, p) => s.webglReady !== p.webglReady && ready(s.webglReady)));

  // ---- the Email pill's shimmer (finite on phones, phone-stations.css): replayed on arriving at contact ----
  const shimmer = stage.querySelector<HTMLElement>(".btn-shimmer");
  if (shimmer) {
    const io = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) shimmer.getAnimations().forEach((a) => a.playState === "finished" && a.play());
    }, { threshold: 0.5 });
    io.observe(stage);
    offs.push(() => io.disconnect());
  }

  // ---- copy email: tick when the label swaps away from the address ----
  const copyLabel = stage.querySelector<HTMLElement>(".st-copy .lm");
  if (copyLabel) {
    const mo = new MutationObserver(() => {
      if (copyLabel.dataset.text !== site.email) haptic(8);
    });
    mo.observe(copyLabel, { attributes: true, attributeFilter: ["data-text"] });
    offs.push(() => mo.disconnect());
  }

  // ---- social grid: select on press / focus ----
  if (grid) {
    const pick = (e: Event) => {
      const a = (e.target as Element | null)?.closest("a");
      const k = a ? chips.indexOf(a as HTMLAnchorElement) : -1;
      const s = socialStore.getState();
      if (k < 0 || s.index === k) return;
      s.set({ index: k });
      haptic(8);
    };
    on(grid, "pointerdown", pick);
    on(grid, "focusin", pick);
  }

  // ---- orb slot: tap / flick / hold ----
  let id = -1, x0 = 0, y0 = 0, t0 = 0, x = 0, y = 0, moved = false, holding = false, timer = 0;
  // the canvas rect, read once per hold: frame.pointer is NDC of the (100lvh) canvas, not the window
  let rl = 0, rt = 0, rw = 1, rh = 1;
  const aim = () => {
    frame.pointer.x = ((x - rl) / rw) * 2 - 1;
    frame.pointer.y = -(((y - rt) / rh) * 2 - 1);
    wake(500);
  };
  const hold = () => {
    if (id === -1 || moved) return;
    const r = document.querySelector("canvas[data-engine]")?.getBoundingClientRect();
    rl = r?.left ?? 0;
    rt = r?.top ?? 0;
    rw = r?.width || innerWidth;
    rh = r?.height || innerHeight;
    holding = true;
    frame.pointerLive = true;
    aim();
  };
  const end = () => {
    window.clearTimeout(timer);
    id = -1;
    if (!holding) return;
    holding = false;
    frame.pointerLive = false;
    wake(500);
  };
  const step = (dir: number) => {
    socialStore.getState().step(dir);
    haptic(8);
    wake(600);
  };
  if (slot) {
    on(slot, "pointerdown", (e) => {
      if (id !== -1 || !e.isPrimary) return;
      id = e.pointerId;
      x0 = x = e.clientX;
      y0 = y = e.clientY;
      t0 = performance.now();
      moved = false;
      timer = window.setTimeout(hold, HOLD_MS);
    });
    on(slot, "pointermove", (e) => {
      if (e.pointerId !== id) return;
      x = e.clientX;
      y = e.clientY;
      if (holding) aim();
      else if (Math.hypot(x - x0, y - y0) > TAP_PX) moved = true;
    });
    on(slot, "pointerup", (e) => {
      if (e.pointerId !== id) return;
      const held = holding;
      const dt = performance.now() - t0, dx = e.clientX - x0, dy = e.clientY - y0;
      end();
      if (held) return;
      if (dt < TAP_MS && Math.hypot(dx, dy) < TAP_PX) step(1);
      else if (dt < FLICK_MS && Math.abs(dx) > FLICK_PX && Math.abs(dx) > 1.5 * Math.abs(dy)) step(dx < 0 ? 1 : -1);
    });
    on(slot, "pointercancel", (e) => {
      if (e.pointerId === id) end();
    });
    // a long press must not open the callout / context menu over the orb
    on(slot, "contextmenu", (e) => e.preventDefault());
  }

  return () => {
    end();
    offs.forEach((off) => off());
  };
}
