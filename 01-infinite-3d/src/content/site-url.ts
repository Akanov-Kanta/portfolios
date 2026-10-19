/** Absolute base for URL-based metadata (the opengraph-image convention, sitemap, robots):
 *  NEXT_PUBLIC_SITE_URL, else Vercel's system env (production domain, then this deployment),
 *  else localhost. Setting it explicitly also silences the "metadataBase not set" build warning. */
export function siteUrl(): URL {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return new URL(explicit);
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (host) return new URL(`https://${host}`);
  return new URL("http://localhost:3000");
}
