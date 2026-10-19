#!/usr/bin/env python3
"""How much each shot moves between consecutive 100 ms screenshots (mean abs pixel diff, 0–255) + a sheet."""
import pathlib, sys
import numpy as np
from PIL import Image
d = pathlib.Path("screenshots/motion")
rows = []
for vp in ("d", "m"):
    for shot in ("s1", "s2", "s3", "s4", "s4c", "s5", "s6"):
        fs = [np.asarray(Image.open(d / f"{vp}-{shot}-{k}.png").convert("L"), dtype=np.float32) for k in range(6)]
        diffs = [float(np.abs(fs[k + 1] - fs[k]).mean()) for k in range(5)]
        print(f"{vp} {shot:4} " + " ".join(f"{x:5.2f}" for x in diffs))
        rows.append((vp, shot))
for vp, cw in (("d", 300), ("m", 120)):
    shots = ("s1", "s2", "s3", "s4", "s4c", "s5", "s6")
    first = Image.open(d / f"{vp}-s1-0.png"); ch = round(cw * first.height / first.width)
    S = Image.new("RGB", (cw * 6, ch * len(shots)))
    for r, shot in enumerate(shots):
        for k in range(6):
            im = Image.open(d / f"{vp}-{shot}-{k}.png").convert("RGB").resize((cw, ch))
            S.paste(im, (k * cw, r * ch))
    S.save(d / f"sheet-{vp}.jpg", quality=85)
