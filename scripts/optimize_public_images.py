#!/usr/bin/env python3
"""Optimize public/ images for the web:
- mood boards: cap at 1800px wide, q80 progressive JPEG
- portrait: cap at 900px wide (rendered ~420px, 2x retina), q85
- logos: re-save PNG with optimize (keep RGBA for transparency)
Originals are backed up first."""
import os
import shutil
from PIL import Image

PUB = "/home/z/my-project/public"
BAK = "/home/z/my-project/assets_work_backup/public_pre_opt"

os.makedirs(BAK, exist_ok=True)

JOBS_JPG = {
    "mood/alpine.jpg":   (1800, 80),
    "mood/boutique.jpg": (1600, 80),
    "mood/cafe.jpg":     (1600, 80),
    "mood/horizon.jpg":  (1600, 80),
    "mood/satin.jpg":    (1600, 80),
    "mood/silk.jpg":     (1600, 80),
    "mood/tea.jpg":      (1800, 82),
    "mood/velvet.jpg":   (1600, 80),
    "portrait.jpg":      (900, 85),
}
PNG_FILES = [f"work/{f}" for f in sorted(os.listdir(os.path.join(PUB, "work"))) if f.endswith(".png")]

def kb(p): return os.path.getsize(p) / 1024

print("== JPEGs ==")
for rel, (maxw, q) in JOBS_JPG.items():
    src = os.path.join(PUB, rel)
    bak = os.path.join(BAK, rel)
    os.makedirs(os.path.dirname(bak), exist_ok=True)
    if not os.path.exists(bak):
        shutil.copy2(src, bak)
    im = Image.open(bak)
    if im.width > maxw:
        h = round(im.height * maxw / im.width)
        im = im.resize((maxw, h), Image.LANCZOS)
    im.save(src, "JPEG", quality=q, optimize=True, progressive=True)
    print(f"{rel:22} {kb(bak):7.0f} KB -> {kb(src):6.0f} KB  ({im.width}x{im.height})")

print("\n== PNGs ==")
for rel in PNG_FILES:
    src = os.path.join(PUB, rel)
    bak = os.path.join(BAK, rel)
    os.makedirs(os.path.dirname(bak), exist_ok=True)
    if not os.path.exists(bak):
        shutil.copy2(src, bak)
    im = Image.open(bak)
    im.save(src, "PNG", optimize=True)
    print(f"{rel:22} {kb(bak):7.0f} KB -> {kb(src):6.0f} KB")

total = sum(os.path.getsize(os.path.join(dp, f)) for dp, _, fs in os.walk(PUB) for f in fs)
print(f"\nTotal public/: {total/1024/1024:.2f} MB")
