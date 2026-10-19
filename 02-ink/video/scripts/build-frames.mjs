// Builds the scroll-scrub image sequence from public/media/edit.mp4.
// 1. Swift + AVFoundation extracts frames (60 fps, cropped to 960x560 so the
//    burned-in subtitles and the TikTok watermark in the bottom band are gone).
// 2. Frames of each range are packed into one .bin (concatenated AVIF files)
//    plus a manifest with byte offsets, so the browser fetches 3 files, not 400.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const video = path.join(root, 'public/media/edit.mp4');
const cache = path.join(root, '.cache/frames');
const out = path.join(root, 'public/media/frames');
const FPS = 60;
const CROP = [0, 0, 960, 560]; // x y w h in source pixels (source is 960x720)
const QUALITY = process.env.Q ?? '0.6';

// Only the ranges the page actually uses (see src/content.ts).
const RANGES = [
  { name: 'a', t0: 0, t1: 1.5 },     // sphere -> vortex face -> ember (hero)
  { name: 'b', t0: 1.5, t1: 4.6 },   // red/violet smear, poppies, veins, red clouds (stack + work)
  { name: 'c', t0: 8.9, t1: 10.68 }, // black/white ink, falling figure (about); burned-in text starts ~10.68s
];

fs.mkdirSync(out, { recursive: true });
const manifest = { fps: FPS, width: CROP[2], height: CROP[3], chunks: [] };
let total = 0;
for (const r of RANGES) {
  const dir = path.join(cache, r.name);
  fs.rmSync(dir, { recursive: true, force: true });
  execFileSync('swift', [
    path.join(root, 'scripts/extract-frames.swift'), video, dir,
    String(FPS), String(r.t0), String(r.t1), ...CROP.map(String), String(CROP[2]), 'avif', QUALITY,
  ], { stdio: ['ignore', 'inherit', 'ignore'] });
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

// Poster for first paint (JPEG, shown before the frames arrive).
const pdir = path.join(cache, 'poster');
fs.rmSync(pdir, { recursive: true, force: true });
execFileSync('swift', [path.join(root, 'scripts/extract-frames.swift'), video, pdir, '1', '0.3', '0.31', ...CROP.map(String), '960', 'jpg', '0.7'], { stdio: 'ignore' });
fs.copyFileSync(path.join(pdir, 'f0000.jpg'), path.join(root, 'public/media/poster.jpg'));
console.log(`total frames: ${(total / 1024 / 1024).toFixed(2)} MB`);
