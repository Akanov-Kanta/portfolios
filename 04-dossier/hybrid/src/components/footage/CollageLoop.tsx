"use client";

import { useRef } from "react";
import { FootageCanvas, type FootageHandle } from "@/components/footage/FootageCanvas";
import { HERO_LOOP, HERO_PORTRAIT_FOCUS, REELS } from "@/content/footage";
import { onHit } from "@/lib/intro";
import { gsap, MQ, useGSAP } from "@/lib/gsap";

/**
 * The edit's collage block (figure + ink burst + eye strip, 4.95–6.95 s) playing forward at real time
 * on its own, looping with a 0.4 s crossfade at the seam: two stacked canvases, the current one plays;
 * in the last `crossfade` seconds the other restarts at `from` on top and fades in, then they swap.
 *
 * It plays only after the cold open's hit, while on screen and while the tab is visible (the ticker is
 * removed otherwise), and its frames only download/decode once it is near the viewport (FootageCanvas).
 * In a box narrower than ~4:3 the crop follows the figure's face across the edit's own cut at 5.72 s.
 * Reduced motion: the 6.50 s poster, static.
 */
export function CollageLoop({ className = "", contrast = 1.12 }: { className?: string; contrast?: number }) {
  const root = useRef<HTMLDivElement>(null);
  const reels = useRef<(FootageHandle | null)[]>([null, null]);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add(MQ.motion, () => {
        const layers = gsap.utils.toArray<HTMLElement>("[data-loop]", el);
        const { from, to, crossfade } = HERO_LOOP;
        const t = [HERO_LOOP.poster, from];
        let cur = 0;
        let fading = false;
        gsap.set(layers[0], { autoAlpha: 1, zIndex: 1 });
        gsap.set(layers[1], { autoAlpha: 0, zIndex: 2 });

        const shot = [-1, -1];
        let portrait = false;
        const frame = (i: number, time: number) => {
          const k = portrait ? HERO_PORTRAIT_FOCUS.findIndex((f) => time < f.until) : -2;
          if (k === shot[i]) return;
          shot[i] = k;
          const focus = k >= 0 ? HERO_PORTRAIT_FOCUS[k] : { focusX: 0.5, focusY: 0.5 };
          reels.current[i]?.setView({ focusX: focus.focusX, focusY: focus.focusY });
        };
        const measure = () => {
          const r = el.getBoundingClientRect();
          portrait = r.width / Math.max(1, r.height) < 1.3;
          shot[0] = shot[1] = -1;
          frame(0, t[0]);
          frame(1, t[1]);
        };
        const ro = new ResizeObserver(measure);
        ro.observe(el);

        const tick = (_time: number, deltaMs: number) => {
          const dt = Math.min(deltaMs, 100) / 1000; // a stalled frame never skips a chunk of footage
          const nxt = 1 - cur;
          t[cur] += dt;
          if (!fading && t[cur] >= to - crossfade) {
            fading = true;
            t[nxt] = from;
            gsap.set(layers[nxt], { zIndex: 2 });
            gsap.set(layers[cur], { zIndex: 1 });
          }
          if (fading) {
            t[nxt] += dt;
            const f = gsap.utils.clamp(0, 1, (t[cur] - (to - crossfade)) / crossfade);
            gsap.set(layers[nxt], { autoAlpha: f });
            frame(nxt, t[nxt]);
            reels.current[nxt]?.setTime(t[nxt]);
            if (f >= 1) {
              gsap.set(layers[cur], { autoAlpha: 0 });
              cur = nxt;
              fading = false;
            }
          }
          frame(cur, t[cur]);
          reels.current[cur]?.setTime(Math.min(t[cur], to));
        };

        let hit = false;
        let visible = false;
        let playing = false;
        const sync = () => {
          const should = hit && visible && !document.hidden;
          if (should && !playing) gsap.ticker.add(tick);
          if (!should && playing) gsap.ticker.remove(tick);
          playing = should;
        };
        const io = new IntersectionObserver((entries) => {
          visible = entries.some((e) => e.isIntersecting);
          sync();
        });
        io.observe(el);
        document.addEventListener("visibilitychange", sync);
        const offHit = onHit(() => {
          hit = true;
          sync();
        });

        return () => {
          offHit();
          io.disconnect();
          ro.disconnect();
          document.removeEventListener("visibilitychange", sync);
          gsap.ticker.remove(tick);
        };
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <div ref={root} className={`relative overflow-hidden ${className}`} style={{ background: "var(--ink)" }}>
      {[0, 1].map((i) => (
        <div key={i} data-loop className="absolute inset-0" style={i ? { visibility: "hidden" } : undefined}>
          <FootageCanvas
            ref={(h) => {
              reels.current[i] = h;
            }}
            range={REELS.drop}
            at={i ? HERO_LOOP.from : HERO_LOOP.poster}
            contrast={contrast}
            exposure={0.94}
            rootMargin="50% 0px"
          />
        </div>
      ))}
    </div>
  );
}
