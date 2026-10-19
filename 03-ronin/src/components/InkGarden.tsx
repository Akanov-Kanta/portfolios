"use client";

import { useEffect, useRef } from "react";
import { createInkGarden, type InkGarden as Engine, type InkGardenOptions } from "@/lib/ink-garden";

type Props = Omit<InkGardenOptions, "canvas" | "input" | "font"> & {
  className?: string;
  /** accessible label of the hidden text field (interactive only) */
  label?: string;
  inputId?: string;
};

/**
 * Canvas wrapper for the Ink Garden engine. It sleeps while off screen, and while its shot is
 * hidden by the film (the nearest [data-shot] carries data-live="false").
 */
export function InkGarden({ className = "", label = "Type a message", inputId, ...opts }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const optsRef = useRef(opts);
  useEffect(() => {
    optsRef.current = opts;
  });

  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;
    const font = getComputedStyle(document.documentElement).getPropertyValue("--font-mincho").trim();
    const o = optsRef.current;
    const engine: Engine = createInkGarden({
      ...o,
      canvas: cv,
      input: input.current,
      font,
      onChange: (t) => optsRef.current.onChange?.(t),
      onEnter: o.onEnter ? (t) => optsRef.current.onEnter?.(t) : undefined,
      onFocusChange: (f) => optsRef.current.onFocusChange?.(f),
    });

    let seen = true;
    const shot = cv.closest<HTMLElement>("[data-shot]");
    const sync = () => engine.setActive(seen && shot?.dataset.live !== "false");
    const io = new IntersectionObserver(([e]) => {
      seen = e.isIntersecting;
      sync();
    });
    io.observe(cv);
    const mo = shot ? new MutationObserver(sync) : null;
    mo?.observe(shot!, { attributes: true, attributeFilter: ["data-live"] });
    return () => {
      io.disconnect();
      mo?.disconnect();
      engine.destroy();
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 block h-full w-full" />
      {opts.interactive && (
        <>
          <label htmlFor={inputId} className="sr-only">
            {label}
          </label>
          <input
            ref={input}
            id={inputId}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            className="ink-input"
          />
        </>
      )}
    </div>
  );
}
