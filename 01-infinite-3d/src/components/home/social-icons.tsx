/** Brand glyphs as a single source of truth: inner SVG markup with currentColor. */
export interface IconDef {
  vb: string;
  inner: string;
}

export const SOCIAL_ICONS: Record<string, IconDef> = {
  github: { vb: "0 0 24 24", inner: '<path fill="currentColor" d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.2 11.39.6.11.82-.26.82-.58l-.01-2.05c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5.99.11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.34-5.47-5.95 0-1.31.47-2.39 1.24-3.23-.12-.3-.54-1.53.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.77.84 1.24 1.92 1.24 3.23 0 4.62-2.81 5.64-5.49 5.94.43.37.81 1.1.81 2.22l-.01 3.29c0 .32.22.7.83.58A12.01 12.01 0 0 0 24 12.5C24 5.87 18.63.5 12 .5Z"/>' },
  linkedin: { vb: "0 0 24 24", inner: '<path fill="currentColor" d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.55V9h3.57v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.22.79 24 1.77 24h20.45C23.2 24 24 23.22 24 22.27V1.73C24 .77 23.2 0 22.22 0Z"/>' },
  x: { vb: "0 0 24 24", inner: '<path fill="currentColor" d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.22-6.82-5.97 6.82H1.66l7.73-8.84L1.24 2.25h6.83l4.71 6.23 5.46-6.23Zm-1.16 17.52h1.83L7.01 4.13H5.04l12.04 15.64Z"/>' },
  telegram: { vb: "0 0 24 24", inner: '<path fill="currentColor" d="M23.91 3.79 20.3 20.84c-.25 1.21-.98 1.5-1.99.93l-5.5-4.05-2.65 2.55c-.3.3-.55.56-1.1.56l.38-5.56 10.12-9.14c.44-.39-.1-.61-.68-.22L6.32 13.02.49 11.2c-1.27-.4-1.29-1.27.27-1.88L22.27 1.03c1.06-.4 1.98.24 1.64 2.76Z"/>' },
  instagram: { vb: "0 0 24 24", inner: '<rect x="2" y="2" width="20" height="20" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor"/>' },
  youtube: { vb: "0 0 24 24", inner: '<path fill="currentColor" d="M23.5 6.2a3 3 0 0 0-2.11-2.12C19.5 3.56 12 3.56 12 3.56s-7.5 0-9.39.52A3 3 0 0 0 .5 6.2 31.4 31.4 0 0 0 0 12a31.4 31.4 0 0 0 .5 5.8 3 3 0 0 0 2.11 2.12c1.89.52 9.39.52 9.39.52s7.5 0 9.39-.52a3 3 0 0 0 2.11-2.12A31.4 31.4 0 0 0 24 12a31.4 31.4 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.2 3.6-6.2 3.6Z"/>' },
  dribbble: { vb: "0 0 24 24", inner: '<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path fill="none" stroke="currentColor" stroke-width="2" d="M5 6c3.5 4 9 5.5 14 4.5M8 3.5C11 7 13 12 13.5 20M20 15c-5-1.5-10 0-13 4"/>' },
  globe: { vb: "0 0 24 24", inner: '<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path fill="none" stroke="currentColor" stroke-width="2" d="M2 12h20M12 2c3 3 3 17 0 20M12 2c-3 3-3 17 0 20"/>' },
};

const MATCH: { test: RegExp; key: string }[] = [
  { test: /github/i, key: "github" },
  { test: /linkedin/i, key: "linkedin" },
  { test: /(twitter|x\.com|(^|[^a-z])x([^a-z]|$))/i, key: "x" },
  { test: /(telegram|t\.me)/i, key: "telegram" },
  { test: /instagram/i, key: "instagram" },
  { test: /(youtube|youtu\.be)/i, key: "youtube" },
  { test: /dribbble/i, key: "dribbble" },
];

export function socialKey(label: string, href: string): string {
  const hay = `${label} ${href}`;
  return MATCH.find(({ test }) => test.test(hay))?.key ?? "globe";
}

/** DOM icon (inherits `color`, so hover works). */
export function IconSvg({ keyName, size = 40, className }: { keyName: string; size?: number; className?: string }) {
  const def = SOCIAL_ICONS[keyName] ?? SOCIAL_ICONS.globe;
  return <svg viewBox={def.vb} width={size} height={size} className={className} aria-hidden="true" dangerouslySetInnerHTML={{ __html: def.inner }} />;
}

/** Baked icy-white SVG data URL for the 3D texture, with igloo-style corner brackets. */
export function iconDataUrl(keyName: string, color = "#dfe6ff"): string {
  const def = SOCIAL_ICONS[keyName] ?? SOCIAL_ICONS.globe;
  const white = def.inner.replace(/currentColor/g, color);
  const bracket = `<g fill="none" stroke="#e8e9f0" stroke-width="1.1"><path d="M-6 -2 V-6 H-2"/><path d="M26 -6 H30 V-2"/><path d="M-6 26 V30 H-2"/><path d="M30 26 V30 H26"/></g>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="-8 -8 40 40">${bracket}${white}</svg>`;
  return "data:image/svg+xml," + encodeURIComponent(svg);
}
