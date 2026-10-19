/*
 * Service worker for the portfolio. Hand-written, no build step, no framework coupling.
 *
 *   navigations          network first (navigation preload); the last good HTML per path is kept
 *                        only as an offline fallback, then /offline.html. Online, HTML is never
 *                        served from this cache, so a new deploy can never be masked. The page a
 *                        visitor landed on before this worker existed, and every page a <Link> opens
 *                        (an RSC fetch this worker never sees), are stored too (the "warm" message).
 *                        /x and /x/ share one entry.
 *   RSC / prefetch       untouched (browser network). If it fails offline, Next falls back to a
 *                        full navigation, which lands in the branch above.
 *   /_next/static/*      cache first; content-hashed and immutable, keyed by full URL (incl. ?dpl=).
 *                        Only responses marked `immutable` are stored (so `next dev` never is).
 *   /models, /draco,     network first (same cost as today's revalidation), cache as offline fallback;
 *   /projects/*.webp     rewritten only when the network copy differs (ETag / Last-Modified + length).
 *   everything else      untouched.
 *
 * Bump VERSION only when this file's logic changes. activate carries the previous version's static and
 * asset entries over (content-hashed, or network-first: still valid), then deletes its caches.
 */
const VERSION = "v3";
const CORE = `core-${VERSION}`;
const PAGES = `pages-${VERSION}`;
const STATIC = `static-${VERSION}`;
const ASSETS = `assets-${VERSION}`;
const OWN = /^(core|pages|static|assets)-/;
const LIMIT = { [PAGES]: 12, [STATIC]: 160, [ASSETS]: 24 };
const OFFLINE_URL = "/offline.html";

const isAsset = (p) => p.startsWith("/models/") || p.startsWith("/draco/") || /^\/projects\/[^/]+\.(webp|avif|png|jpe?g)$/.test(p);
/** one key per page: no query, no trailing slash (online, Next redirects /x/ to /x; offline, /x/ must still find /x) */
const pageKey = (href) => {
  const u = new URL(href);
  return u.origin + u.pathname.replace(/(.)\/+$/, "$1");
};
const okPage = (r) =>
  r && r.status === 200 && r.type === "basic" && !r.redirected && (r.headers.get("content-type") || "").includes("text/html");
const okStatic = (r) => r && r.status === 200 && r.type === "basic" && /immutable/.test(r.headers.get("cache-control") || "");
const okAsset = (r) => r && r.status === 200 && r.type === "basic";
/** the network copy is the stored one (a revalidation the HTTP cache answered): skip the disk write */
const sameEntity = (a, b) => {
  if (!a || !b) return false;
  const ea = a.headers.get("etag");
  const eb = b.headers.get("etag");
  if (ea || eb) return ea === eb;
  const lm = a.headers.get("last-modified");
  return !!lm && lm === b.headers.get("last-modified") && a.headers.get("content-length") === b.headers.get("content-length");
};

async function trim(name) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - LIMIT[name]; i++) await cache.delete(keys[i]);
}

/** copy the entries of an older version's cache that the new one lacks (oldest first, so trim keeps the newest) */
async function carry(from, to) {
  try {
    const src = await caches.open(from);
    const dst = await caches.open(to);
    const keys = await src.keys();
    const hits = await Promise.all(keys.map(async (req) => ((await dst.match(req)) ? null : src.match(req))));
    for (let i = 0; i < keys.length; i++) if (hits[i]) await dst.put(keys[i], hits[i]);
    await trim(to);
  } catch {}
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const core = await caches.open(CORE);
      await core.add(new Request(OFFLINE_URL, { cache: "reload" }));
      try {
        const home = await fetch("/", { cache: "no-cache" });
        if (okPage(home)) await (await caches.open(PAGES)).put(pageKey(home.url), home);
      } catch {}
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([CORE, PAGES, STATIC, ASSETS]);
      for (const name of await caches.keys()) {
        if (!OWN.test(name) || keep.has(name)) continue;
        // an update must not leave an offline launch without its chunks and models
        if (name.startsWith("static-")) await carry(name, STATIC);
        else if (name.startsWith("assets-")) await carry(name, ASSETS);
        await caches.delete(name);
      }
      if (self.registration.navigationPreload) await self.registration.navigationPreload.enable();
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.mode === "navigate") return event.respondWith(navigate(event));
  if (request.headers.has("rsc") || request.headers.has("next-router-prefetch") || url.searchParams.has("_rsc")) return;
  if (url.pathname.startsWith("/_next/static/")) return event.respondWith(cacheFirst(event));
  if (isAsset(url.pathname)) return event.respondWith(networkFirst(event));
});

async function navigate(event) {
  const key = pageKey(event.request.url);
  try {
    const response = (await event.preloadResponse) || (await fetch(event.request));
    if (okPage(response)) {
      const copy = response.clone();
      event.waitUntil(caches.open(PAGES).then((c) => c.put(key, copy)).then(() => trim(PAGES)));
    }
    return response;
  } catch {
    const cached = await (await caches.open(PAGES)).match(key);
    return cached || (await (await caches.open(CORE)).match(OFFLINE_URL)) || Response.error();
  }
}

async function cacheFirst(event) {
  const cache = await caches.open(STATIC);
  const hit = await cache.match(event.request);
  if (hit) return hit;
  const response = await fetch(event.request);
  if (okStatic(response)) {
    const copy = response.clone();
    event.waitUntil(cache.put(event.request, copy).then(() => trim(STATIC)));
  }
  return response;
}

async function networkFirst(event) {
  const cache = await caches.open(ASSETS);
  const stored = cache.match(event.request).catch(() => undefined);
  try {
    const response = await fetch(event.request);
    // an unchanged file (the usual revalidation) is not written again: ~1 MB of models + decoder per world mount
    if (okAsset(response) && !sameEntity(response, await stored)) {
      const copy = response.clone();
      event.waitUntil(cache.put(event.request, copy).then(() => trim(ASSETS)));
    }
    return response;
  } catch (err) {
    const hit = await stored;
    if (hit) return hit;
    throw err;
  }
}

// The page posts the same-origin static URLs it loaded before this worker controlled it, and the page(s)
// the visitor landed on (a shared project link is read before the worker exists: it must open offline too).
self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || data.type !== "warm" || !Array.isArray(data.urls)) return;
  const pages = Array.isArray(data.pages) ? data.pages.slice(0, 4) : [];
  event.waitUntil(Promise.all([warm(data.urls.slice(0, 200)), warmPages(pages)]));
});

/**
 * Landing pages and <Link>-opened pages into PAGES: revalidated against the HTTP cache (usually a 304, no body
 * re-download) and rewritten only when changed, so a stored copy follows the deploy its chunks come from.
 */
async function warmPages(hrefs) {
  const pages = await caches.open(PAGES);
  for (const href of hrefs) {
    let url;
    try {
      url = new URL(href, self.location.origin);
    } catch {
      continue;
    }
    if (url.origin !== self.location.origin) continue;
    const key = pageKey(url.href);
    try {
      const [r, hit] = await Promise.all([fetch(key, { cache: "no-cache", credentials: "same-origin" }), pages.match(key)]);
      if (okPage(r) && !sameEntity(r, hit)) await pages.put(key, r);
    } catch {}
  }
  await trim(PAGES);
}

async function warm(urls) {
  const statics = await caches.open(STATIC);
  const assets = await caches.open(ASSETS);
  await Promise.all(
    urls.map(async (href) => {
      let url;
      try {
        url = new URL(href, self.location.origin);
      } catch {
        return;
      }
      if (url.origin !== self.location.origin) return;
      const isStatic = url.pathname.startsWith("/_next/static/");
      const cache = isStatic ? statics : isAsset(url.pathname) ? assets : null;
      if (!cache || (await cache.match(url.href))) return;
      try {
        const r = await fetch(url.href);
        if (isStatic ? okStatic(r) : okAsset(r)) await cache.put(url.href, r);
      } catch {}
    }),
  );
  await trim(STATIC);
  await trim(ASSETS);
}
