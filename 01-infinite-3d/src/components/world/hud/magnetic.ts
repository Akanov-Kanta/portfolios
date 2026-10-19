import { DUR, SPRING_CSS } from "../theme";

/** share of the pointer's offset from the control's centre that the moving layer follows */
const PULL = 0.3;
/** the inner label (the layer's first child) goes a little further: parallax inside the control */
const LABEL = 0.45;
const RETURN = `translate ${DUR.magneticReturn}ms ${SPRING_CSS}`;

interface Active {
  host: HTMLElement;
  layer: HTMLElement;
  label: HTMLElement | null;
  /** current / target offset, px */
  x: number;
  y: number;
  tx: number;
  ty: number;
}

/**
 * Delegated magnetic controls. `[data-magnetic]` marks the control; its FIRST element child is
 * the layer that moves (inline `translate`), so the control's layout box and its focus outline
 * never move (no CLS). Leaving springs the layer home with a CSS transition (SPRING_CSS).
 * Installed once by Cursor (fine pointers, motion allowed). Returns { step(dt), dispose }.
 */
export function installMagnetic() {
  let active: Active | null = null;

  const release = (a: Active) => {
    for (const el of [a.layer, a.label]) {
      if (!el) continue;
      el.style.transition = RETURN;
      el.style.translate = "0px 0px";
    }
  };

  const onOver = (e: PointerEvent) => {
    if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
    const host = (e.target as Element | null)?.closest<HTMLElement>("[data-magnetic]") ?? null;
    if (host === active?.host) return;
    if (active) release(active);
    active = null;
    const layer = host?.firstElementChild as HTMLElement | null;
    if (!host || !layer) return;
    const label = (layer.firstElementChild as HTMLElement | null) ?? null;
    for (const el of [layer, label]) if (el) el.style.transition = "none";
    active = { host, layer, label, x: 0, y: 0, tx: 0, ty: 0 };
    onMove(e);
  };
  const onMove = (e: PointerEvent) => {
    if (!active) return;
    const r = active.host.getBoundingClientRect();
    active.tx = (e.clientX - (r.left + r.width / 2)) * PULL;
    active.ty = (e.clientY - (r.top + r.height / 2)) * PULL;
  };
  const onOut = (e: PointerEvent) => {
    if (!active) return;
    const to = e.relatedTarget as Node | null;
    if (to && active.host.contains(to)) return;
    release(active);
    active = null;
  };

  addEventListener("pointerover", onOver, { passive: true });
  addEventListener("pointermove", onMove, { passive: true });
  addEventListener("pointerout", onOut, { passive: true });

  return {
    /** lerp the active layer toward its target; call from the cursor tick */
    step(dt: number) {
      const a = active;
      if (!a) return;
      const k = 1 - Math.exp(-12 * dt);
      a.x += (a.tx - a.x) * k;
      a.y += (a.ty - a.y) * k;
      a.layer.style.translate = `${a.x.toFixed(2)}px ${a.y.toFixed(2)}px`;
      // the label sits inside the layer: add only the extra share on top of the layer's move
      if (a.label) {
        const extra = (LABEL - PULL) / PULL;
        a.label.style.translate = `${(a.x * extra).toFixed(2)}px ${(a.y * extra).toFixed(2)}px`;
      }
    },
    dispose() {
      if (active) release(active);
      active = null;
      removeEventListener("pointerover", onOver);
      removeEventListener("pointermove", onMove);
      removeEventListener("pointerout", onOut);
    },
  };
}
