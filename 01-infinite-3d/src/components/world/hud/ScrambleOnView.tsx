"use client";
import { useEffect, useRef, useState } from "react";
import { Scramble } from "./Scramble";

/**
 * Replays the two-front reveal every time it scrolls into view (so headings re-animate on each lap).
 * Not while html[data-wrapped] (set for 1.2 s after a phone touch-wrap): the hero that just replaced
 * its loop clone must stay pixel-identical to it, so the teleport stays invisible.
 */
export function ScrambleOnView({
  text,
  className,
  line,
  replayOnHover,
  lockup,
}: {
  text: string;
  className?: string;
  line?: number;
  replayOnHover?: boolean;
  lockup?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [trigger, setTrigger] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (document.documentElement.hasAttribute("data-wrapped")) return;
        entries.forEach((e) => e.isIntersecting && setTrigger((k) => k + 1));
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <span ref={ref} className={className}>
      <Scramble text={text} trigger={trigger} line={line} replayOnHover={replayOnHover} lockup={lockup} />
    </span>
  );
}
