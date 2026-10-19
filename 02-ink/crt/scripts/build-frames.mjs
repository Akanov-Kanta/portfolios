// Builds the scroll-scrub image sequence from source/edit.mp4 (1280x720 HEVC, 30 fps).
// 1. Swift + AVFoundation extracts frames at the source rate, cropped to the
//    inside of the edit's own CRT bezel (1152x648, still 16:9), so the page can
//    draw its own screen shape at any aspect ratio.
// 2. Frames of each range are packed into one .bin (concatenated AVIF files)
//    plus a manifest with byte offsets, so the browser fetches 4 files, not 270.
// 3. A JPEG poster for first paint and the audio track (.m4a) for the sound toggle.
//
// Burned-in "tiktok.com/@.maisamu" text runs from ~3.60 s to ~4.25 s (the
// ring segment). No range below touches it.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const video = path.join(root, 'source/edit.mp4');
const cache = path.join(root, '.cache/frames');
const out = path.join(root, 'public/media/frames');
const swift = (file, args, stdio = ['ignore', 'inherit', 'ignore']) =>
  execFileSync('swift', [path.join(root, 'scripts', file), ...args], { stdio });

const FPS = 30;
const CROP = [64, 36, 1152, 648]; // x y w h in source pixels: inside the rounded bezel
const OUT_W = Number(process.env.W ?? 1152);
const QUALITY = Number(process.env.Q ?? 0.5);

// Only the ranges the page uses (see src/content.ts).
const RANGES = [
  { name: 'a', t0: 1.1, t1: 3.567 }, // monitor wall, Kaneki on the chair (hero). Watermark text starts at 3.60 s
  { name: 'b', t0: 4.3, t1: 6.4 }, //   dome -> red eye -> veins -> red/white smear tunnel (about + stack)
  { name: 'c', t0: 6.4, t1: 8.2 }, //   red brutalist city, halftone close-up, figure in the canyon (work)
  // halftone centipede spiral turning red (outro). Its dense dot screen costs ~150 KB/frame at the
  // default quality; at q0.22 the dots stay crisp for a third of that.
  { name: 'd', t0: 8.8, t1: 11.134, q: 0.22 },
];

fs.mkdirSync(out, { recursive: true });
const manifest = { fps: FPS, width: OUT_W, height: Math.round((CROP[3] * OUT_W) / CROP[2]), chunks: [] };
let total = 0;
for (const r of RANGES) {
  const dir = path.join(cache, r.name);
  fs.rmSync(dir, { recursive: true, force: true });
  swift('extract-frames.swift', [video, dir, String(FPS), String(r.t0), String(r.t1), ...CROP.map(String), String(OUT_W), 'avif', String(r.q ?? QUALITY)]);
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.avif')).sort();
  const bufs = files.map((f) => fs.readFileSync(path.join(dir, f)));
  const offsets = [0];
  for (const b of bufs) offsets.push(offsets[offsets.length - 1] + b.length);
  const file = `${r.name}.bin`;
  fs.writeFileSync(path.join(out, file), Buffer.concat(bufs));
  const luma = JSON.parse(fs.readFileSync(path.join(dir, 'luma.json'), 'utf8'));
  manifest.chunks.push({ name: r.name, file, t0: r.t0, count: files.length, offsets, luma });
  total += offsets[offsets.length - 1];
  console.log(`${file}: ${files.length} frames, ${(offsets.at(-1) / 1024 / 1024).toFixed(2)} MB`);
}
fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify(manifest));

// Poster for first paint (JPEG, shown before the frames arrive): the first hero frame.
const pdir = path.join(cache, 'poster');
fs.rmSync(pdir, { recursive: true, force: true });
swift('extract-frames.swift', [video, pdir, '1', '1.6', '1.61', ...CROP.map(String), '1152', 'jpg', '0.72'], 'ignore');
fs.copyFileSync(path.join(pdir, 'f0000.jpg'), path.join(root, 'public/media/poster.jpg'));

// Sound toggle source: just the audio track.
swift('extract-audio.swift', [video, path.join(root, 'public/media/audio.m4a')]);
console.log(`total frames: ${(total / 1024 / 1024).toFixed(2)} MB`);
