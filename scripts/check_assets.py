#!/usr/bin/env python3
"""Check all portfolio images: validity, size, dominant colors."""
from PIL import Image
import os

def dominant_colors(img, n=4):
    small = img.convert("RGBA").resize((60, 60))
    px = list(small.getdata())
    # filter out transparent pixels
    px = [p[:3] for p in px if p[3] > 40]
    if not px:
        return []
    # simple k-means-lite: bucket by quantized color
    from collections import Counter
    q = Counter((r // 24 * 24, g // 24 * 24, b // 24 * 24) for r, g, b in px)
    return q.most_common(n)

def check_dir(d):
    print(f"\n=== {d} ===")
    for f in sorted(os.listdir(d)):
        p = os.path.join(d, f)
        if not os.path.isfile(p):
            continue
        size_kb = os.path.getsize(p) / 1024
        try:
            img = Image.open(p)
            img.load()
            has_alpha = img.mode in ("RGBA", "LA", "PA")
            alpha_ratio = 0
            if has_alpha:
                a = img.getchannel("A")
                hist = a.histogram()
                transparent = sum(hist[:16])
                alpha_ratio = transparent / (img.width * img.height)
            print(f"{f}: OK  {img.width}x{img.height}  mode={img.mode}  {size_kb:.0f}KB  transparent={alpha_ratio:.0%}")
            if "soha" in f or "portrait" in f or "pasted" in f:
                print(f"    colors: {dominant_colors(img)}")
        except Exception as e:
            print(f"{f}: BROKEN  {size_kb:.0f}KB  -> {e}")

for d in ["/home/z/my-project/public/work", "/home/z/my-project/public/mood", "/home/z/my-project/upload"]:
    check_dir(d)
