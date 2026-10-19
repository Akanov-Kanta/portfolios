import type { MetadataRoute } from "next";
import { site } from "@/content/site";
import { siteUrl } from "@/content/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  return [
    { url: new URL("/", base).href, changeFrequency: "monthly", priority: 1 },
    ...site.projects.map((p) => ({ url: new URL(`/projects/${p.slug}`, base).href, changeFrequency: "monthly" as const, priority: 0.8 })),
  ];
}
