#!/usr/bin/env python3
"""Audit all public/ images: validity, dimensions, file size, mode."""
import os
from PIL import Image

ROOT = "/home/z/my-project/public"
rows = []
total = 0
for dirpath, _, files in os.walk(ROOT):
    for f in sorted(files):
        p = os.path.join(dirpath, f)
        if not f.lower().endswith((".jpg", ".jpeg", ".png", ".webp", ".svg")):
            continue
        size = os.path.getsize(p)
        total += size
        rel = os.path.relpath(p, ROOT)
        try:
            im = Image.open(p)
            im.load()
            rows.append((rel, im.width, im.height, im.mode, size, "OK"))
        except Exception as e:
            rows.append((rel, "-", "-", "-", size, f"BROKEN: {e}"))

print(f"{'file':24} {'WxH':>12} {'mode':8} {'KB':>8}  status")
for rel, w, h, mode, size, st in sorted(rows):
    print(f"{rel:24} {str(w)+'x'+str(h):>12} {mode:8} {size/1024:8.0f}  {st}")
print(f"\nTotal: {total/1024/1024:.1f} MB across {len(rows)} files")
