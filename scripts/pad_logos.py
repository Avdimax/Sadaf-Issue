#!/usr/bin/env python3
"""Add transparent padding to logo PNGs so marks breathe and never look sliced."""
from PIL import Image
import os

WORK = "/home/z/my-project/public/work"
LOGOS = [
    "nabavi-gradient.png", "nabavi-gold.png", "nabavi-dark.png",
    "hoor-color.png", "hoor-bw.png",
    "northpeak-color.png", "northpeak-black.png",
    "soha-color.png", "soha-black.png",
]

for f in LOGOS:
    p = os.path.join(WORK, f)
    img = Image.open(p).convert("RGBA")
    w, h = img.size
    px = max(10, round(w * 0.055))
    py = max(10, round(h * 0.055))
    out = Image.new("RGBA", (w + 2 * px, h + 2 * py), (0, 0, 0, 0))
    out.paste(img, (px, py), img)
    out.save(p, optimize=True)
    print(f"{f}: {w}x{h} -> {out.size[0]}x{out.size[1]} (+{px},+{py})")
