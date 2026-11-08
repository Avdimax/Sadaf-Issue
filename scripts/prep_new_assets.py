#!/usr/bin/env python3
"""Prepare web assets: tea mood board + portrait photo."""
from PIL import Image, ImageEnhance
import os

# 1) Tea mood board → public/mood/tea.jpg
src = "/home/z/my-project/assets_raw/moodboard_tea_gen.png"
img = Image.open(src).convert("RGB")
img = img.resize((1600, int(1600 * img.height / img.width)), Image.LANCZOS)
# gentle editorial grade: slight warmth
img = ImageEnhance.Color(img).enhance(1.04)
img = ImageEnhance.Contrast(img).enhance(1.02)
img.save("/home/z/my-project/public/mood/tea.jpg", quality=88, optimize=True)
print(f"tea.jpg: {img.size}, {os.path.getsize('/home/z/my-project/public/mood/tea.jpg')//1024}KB")

# 2) Portrait → public/portrait.jpg (keep square, web-sized)
src2 = "/home/z/my-project/upload/pasted_image_1794062504444.jpg"
p = Image.open(src2).convert("RGB")
p = p.resize((1200, 1200), Image.LANCZOS)
p = ImageEnhance.Contrast(p).enhance(1.02)
p.save("/home/z/my-project/public/portrait.jpg", quality=87, optimize=True)
print(f"portrait.jpg: {p.size}, {os.path.getsize('/home/z/my-project/public/portrait.jpg')//1024}KB")
