"use client";

import { useEffect, useRef, type Ref } from "react";
import type { SiteProject } from "@/content/site";

interface MediaProps {
  project: SiteProject;
  /** strip: lazy (preload none), plays only while `active`; plate: loads and autoplays */
  variant: "strip" | "plate";
  active?: boolean;
  /** seconds to start from (the strip's time when a file opens, so the cut is continuous) */
  startAt?: number;
  className?: string;
  ref?: Ref<HTMLVideoElement>;
}

/**
 * A project's evidence: its grayscale screen recording (WebM VP9 + MP4 H.264 for Safari, muted loop) when
 * the project is live, otherwise its screenshot. Always grayscale(1) contrast(1.1), object-fit cover, so
 * the same element can be any shape (strip, full screen, plate) during the file transition.
 */
export function Media({ project, variant, active = true, startAt = 0, className = "", ref }: MediaProps) {
  const video = useRef<HTMLVideoElement | null>(null);
  const rec = "rec" in project.media ? project.media.rec : undefined;

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    if (active) {
      if (startAt && v.readyState === 0) {
        const seek = () => {
          v.currentTime = startAt % (v.duration || Infinity);
        };
        v.addEventListener("loadedmetadata", seek, { once: true });
      } else if (startAt) v.currentTime = startAt;
      void v.play().catch(() => {});
    } else v.pause();
  }, [active, startAt]);

  if (!rec) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- plain img: it is resized every frame of the flip
      <img className={`media ${className}`} src={project.media.still} alt={project.media.alt} decoding="async" loading={variant === "strip" ? "lazy" : "eager"} draggable={false} />
    );
  }
  return (
    <video
      ref={(el) => {
        video.current = el;
        if (typeof ref === "function") ref(el);
        else if (ref) ref.current = el;
      }}
      className={`media ${className}`}
      muted
      loop
      playsInline
      preload={variant === "plate" ? "auto" : "none"}
      poster={`/projects/rec/${rec}.jpg`}
      aria-label={project.media.alt}
      disablePictureInPicture
    >
      <source src={`/projects/rec/${rec}.mp4`} type="video/mp4" />
      <source src={`/projects/rec/${rec}.webm`} type="video/webm" />
    </video>
  );
}
