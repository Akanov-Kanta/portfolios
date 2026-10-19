"use client";

import { useRef } from "react";
import { site } from "@/content/site";
import { TypeCaption, type TypeCaptionHandle } from "@/components/fx/TypeCaption";
import { sfx } from "@/lib/audio";
import { gsap, MQ, ScrollTrigger, useGSAP } from "@/lib/gsap";

const PIN = 0.6;

/**
 * Chapter 6 — OUTRO (f4_046). On a hard cut from the inverted chapter: a flat mid-grey wash (150 ms)
 * that falls to black (200 ms, power1.inOut), then the handle types on, centred at ~54% height with the
 * caption bloom, then the socials, email and copyright fade up as real links. The drone fades out.
 * Reduced motion: everything there, static.
 */
export function Outro() {
  const root = useRef<HTMLElement>(null);
  const handle = useRef<TypeCaptionHandle>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const q = gsap.utils.selector(el);
      const mm = gsap.matchMedia();

      mm.add(MQ.motion, () => {
        const wash = q("[data-wash]")[0];
        const late = q("[data-late]");
        gsap.set(el, { autoAlpha: 0 });
        gsap.set(late, { autoAlpha: 0 });

        const tl = gsap
          .timeline({ paused: true })
          .set(wash, { autoAlpha: 1, backgroundColor: "#6e6e6e" }, 0)
          .to(wash, { autoAlpha: 0, duration: 0.2, ease: "power1.inOut" }, 0.15)
          .call(() => handle.current?.play(), [], 0.45)
          .to(late, { autoAlpha: 1, duration: 0.3, ease: "power1.out", stagger: 0.12 }, 1.0);

        ScrollTrigger.create({
          trigger: el,
          start: "top top",
          end: "max",
          onToggle: (self) => gsap.set(el, { autoAlpha: self.isActive ? 1 : 0 }),
        });
        ScrollTrigger.create({
          trigger: el,
          start: "top top",
          end: `+=${PIN * 100}%`,
          pin: true,
          onEnter: () => {
            sfx.scene("outro");
            tl.restart();
          },
          onLeaveBack: () => {
            sfx.scene("drone");
            tl.pause(0);
            gsap.set(wash, { autoAlpha: 0 });
            gsap.set(late, { autoAlpha: 0 });
            handle.current?.reset();
          },
        });
        return () => tl.kill();
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  const links = [
    ...site.socials.map((s) => ({ label: s.label, href: s.href, external: true })),
    { label: site.email, href: `mailto:${site.email}`, external: false },
  ];

  return (
    <div className="ch56-overlap relative" style={{ zIndex: 3 }}>
      <footer>
        <section
          id="outro"
          ref={root}
          aria-label="Contact"
          className="relative h-svh w-full overflow-hidden"
          style={{ background: "var(--ink-0)" }}
        >
          <div data-wash aria-hidden className="ch34-pre absolute inset-0 motion-reduce:hidden" />
          <div className="absolute inset-x-0 flex flex-col items-center px-[var(--gutter)]" style={{ top: "54%", transform: "translateY(-50%)" }}>
            <TypeCaption ref={handle} trigger="manual" lines={[`@${site.handle.toUpperCase()}`]} className="ch56-handle" />
            <ul data-late className="ch34-pre caption mt-[5vh] flex flex-wrap justify-center gap-x-[2.2em] gap-y-3">
              {links.map((l) => (
                <li key={l.href}>
                  <a
                    className="ch56-link"
                    href={l.href}
                    {...(l.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  >
                    {l.label.toUpperCase()}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <p
            data-late
            className="ch34-pre caption absolute inset-x-0 text-center"
            style={{ bottom: "calc(var(--gutter) * 1.4)" }}
          >
            <span style={{ opacity: 0.4 }}>
              © <span suppressHydrationWarning>{new Date().getFullYear()}</span> {site.name.toUpperCase()}.{" "}
              {site.location.city.toUpperCase()}.
            </span>
          </p>
        </section>
      </footer>
    </div>
  );
}
