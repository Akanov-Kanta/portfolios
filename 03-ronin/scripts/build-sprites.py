#!/usr/bin/env python3
"""Build the film's animation sprites into public/art/sprites/.

Run with the tools venv (Pillow + numpy):
  ../../tools/.venv/bin/python scripts/build-sprites.py

Sources live outside the repo in ../../art/sprites/<name>/f0..f3.png: registered RGBA frames cut from
generated 2x2 sprite sheets by tools/sprite.py. Each sprite becomes one horizontal strip (frames side by
side, upscaled 1.5x with Lanczos so browsers mostly scale down). Sprites that the wind shader animates also
get a soft grayscale mask strip: where the scarf and trailing cloth may ripple.
"""
import json
import pathlib

import numpy as np
from PIL import Image, ImageFilter

ROOT = pathlib.Path(__file__).resolve().parent.parent
ART = ROOT.parent.parent / "art"
OUT = ROOT / "public" / "art" / "sprites"
SCALE = 1.5

# name -> source frames (None = a single still from art/shots, used by the wind shader only)
SPRITES = {
    "idle": None,
    "walk": None,
    "strike": None,
    "oni": None,
    "run": None,
    "gallop": None,
}
# the generator drew these facing left; the film moves them left-to-right, so mirror every frame
MIRROR = {"run", "gallop"}
# wind masks: (sprite or still, x ramp start, x ramp end) — cloth further right streams more in the wind
WIND = {"idle": (0.40, 0.88), "s2-ronin": (0.38, 0.92)}


def frames_of(name: str) -> list[Image.Image]:
    if name == "s2-ronin":
        return [Image.open(ART / "shots" / "s2-ronin.png").convert("RGBA")]
    frames = [Image.open(ART / "sprites" / name / f"f{i}.png").convert("RGBA") for i in range(4)]
    if name in MIRROR:
        frames = [f.transpose(Image.FLIP_LEFT_RIGHT) for f in frames]
    return frames


def up(img: Image.Image) -> Image.Image:
    return img.resize((round(img.width * SCALE), round(img.height * SCALE)), Image.LANCZOS)


def strip(frames: list[Image.Image]) -> Image.Image:
    w, h = frames[0].size
    s = Image.new("RGBA", (w * len(frames), h))
    for i, f in enumerate(frames):
        s.alpha_composite(f, (i * w, 0))
    return s


def wind_mask(f: Image.Image, x0: float, x1: float) -> Image.Image:
    a = np.asarray(f).astype(np.float32)
    r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3] / 255
    scarf = ((r > 95) & (r > 1.65 * g) & (r > 1.65 * b) & (al > 0.5)).astype(np.float32)
    h, w = al.shape
    xs = np.linspace(0, 1, w)[None, :].repeat(h, 0)
    ys = np.linspace(0, 1, h)[:, None].repeat(w, 1)
    ramp = np.clip((xs - x0) / (x1 - x0), 0, 1)
    ramp = ramp * ramp * (3 - 2 * ramp)
    # trailing cloth: the right-hand silhouette below the shoulders flutters a little
    # …but never the feet planted on the roof
    cloth = al * ramp * np.clip((ys - 0.25) / 0.3, 0, 1) * np.clip((0.86 - ys) / 0.08, 0, 1) * 0.35
    m = Image.fromarray((np.maximum(scarf * (0.35 + 0.65 * ramp), cloth) * 255).astype(np.uint8))
    m = m.filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.GaussianBlur(10))
    return m


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    meta = {}
    for name in [*SPRITES, *[k for k in WIND if k not in SPRITES]]:
        frames = [up(f) for f in frames_of(name)]
        w, h = frames[0].size
        if name in SPRITES:
            s = strip(frames)
            p = OUT / f"{name}.webp"
            s.save(p, "WEBP", quality=92, alpha_quality=100, method=6)
            print(f"{p.relative_to(ROOT)}  {s.width}x{s.height}  {p.stat().st_size // 1024} KB")
        if name in WIND:
            x0, x1 = WIND[name]
            masks = [wind_mask(f, x0, x1).resize((w // 2, h // 2), Image.BILINEAR) for f in frames]
            ms = Image.new("L", (w // 2 * len(masks), h // 2))
            for i, m in enumerate(masks):
                ms.paste(m, (i * (w // 2), 0))
            p = OUT / f"{name}-wind.png"
            ms.save(p, optimize=True)
            print(f"{p.relative_to(ROOT)}  {ms.width}x{ms.height}  {p.stat().st_size // 1024} KB")
        meta[name] = {"w": w, "h": h, "n": len(frames)}
    print(json.dumps(meta))


if __name__ == "__main__":
    main()
