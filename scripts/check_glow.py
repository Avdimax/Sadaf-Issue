#!/usr/bin/env python3
"""Analyze logo rasters: check for baked-in glow halos and alpha stats."""
from PIL import Image
import os

WORK = "/home/z/my-project/public/work"

for name in sorted(os.listdir(WORK)):
    if not name.endswith(".png"):
        continue
    img = Image.open(os.path.join(WORK, name)).convert("RGBA")
    w, h = img.size
    px = img.load()

    # Sample alpha and brightness across the image
    total = 0
    opaque = 0
    bright_opaque = 0
    semi = 0  # semi-transparent pixels (glow halos live here)
    max_lum = 0
    # grid sample
    step = max(1, w // 200)
    for y in range(0, h, step):
        for x in range(0, w, step):
            r, g, b, a = px[x, y]
            total += 1
            if a > 200:
                opaque += 1
                lum = 0.299 * r + 0.587 * g + 0.114 * b
                max_lum = max(max_lum, lum)
                if lum > 200:
                    bright_opaque += 1
            elif a > 8:
                semi += 1

    print(f"{name:26s} {w}x{h:5d}  opaque={opaque/total:5.1%}  semi(glow)={semi/total:5.1%}  bright>200={bright_opaque/total:4.1%}  maxLum={max_lum:.0f}")
