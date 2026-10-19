// Extract poster JPEGs (first paint, slow networks, reduced motion) from the packed AVIF chunks.
// usage: node scripts/posters.mjs [outDir] [times...]   (default: public/media/posters, POSTER_TIMES)
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
const require = createRequire(new URL("../package.json", import.meta.url));
const { chromium } = require("playwright");
const root = new URL("../public/", import.meta.url).pathname;
const out = process.argv[2] ?? join(root, "media/posters");
const DEFAULT = [0.9, 1.85, 2.4, 3.3, 4.3, 5.5, 6.5, 8.3, 9.0, 10.1, 11.1];
const times = process.argv.length > 3 ? process.argv.slice(3).map(Number) : DEFAULT;
mkdirSync(out, { recursive: true });
const b = await chromium.launch();
const p = await b.newPage();
await p.route("http://local/**", (r) => {
  const path = new URL(r.request().url()).pathname;
  r.fulfill({ body: readFileSync(join(root, path)), contentType: path.endsWith(".json") ? "application/json" : "application/octet-stream" });
});
await p.goto("http://local/media/frames/manifest.json");
const res = await p.evaluate(async (times) => {
  const m = await (await fetch("/media/frames/manifest.json")).json();
  const outs = [];
  for (const t of times) {
    const c = m.chunks.find((c) => t >= c.t0 - 1e-3 && t <= c.t0 + (c.count - 1) / m.fps + 1e-3)
      ?? m.chunks.reduce((a, c) => (Math.abs(c.t0 - t) < Math.abs(a.t0 - t) ? c : a));
    const i = Math.max(0, Math.min(c.count - 1, Math.round((t - c.t0) * m.fps)));
    const buf = await (await fetch(`/media/frames/${c.file}`)).arrayBuffer();
    const bmp = await createImageBitmap(new Blob([buf.slice(c.offsets[i], c.offsets[i + 1])], { type: "image/avif" }));
    const cv = new OffscreenCanvas(bmp.width, bmp.height);
    cv.getContext("2d").drawImage(bmp, 0, 0);
    const blob = await cv.convertToBlob({ type: "image/jpeg", quality: 0.72 });
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let s = "";
    for (let k = 0; k < bytes.length; k++) s += String.fromCharCode(bytes[k]);
    outs.push({ t, b64: btoa(s) });
  }
  return outs;
}, times);
for (const { t, b64 } of res) writeFileSync(join(out, `p-${t.toFixed(2)}.jpg`), Buffer.from(b64, "base64"));
await b.close();
console.log(res.map((r) => `p-${r.t.toFixed(2)}.jpg`).join(" "));
