"""Generate a tiny, performance-safe paper-grain tile.

The old approach (feTurbulence SVG as a background-image on a 200%-viewport
fixed layer) forced Chrome to rasterize fractal noise at the full layer size
on the main thread — seconds of blocking work + a ~100MB GPU layer that
re-composited 4.4x/sec. This script bakes the noise ONCE into a 128px PNG
tile that the compositor can repeat essentially for free.
"""
from PIL import Image, ImageFilter
import numpy as np
import random

random.seed(7)
np.random.seed(7)

SIZE = 128

# fractal-ish noise: two octaves of value noise, softened like feTurbulence
fine = np.random.randint(0, 256, (SIZE, SIZE), dtype=np.uint8)
coarse_img = Image.fromarray(np.random.randint(0, 256, (SIZE // 4, SIZE // 4), dtype=np.uint8).astype("uint8"))
coarse = np.array(coarse_img.resize((SIZE, SIZE), Image.BILINEAR))

noise = (fine.astype(np.int16) * 0.55 + coarse.astype(np.int16) * 0.45)
# soften single-pixel harshness slightly
img = Image.fromarray(np.clip(noise, 0, 255).astype(np.uint8))
img = img.filter(ImageFilter.GaussianBlur(0.4))

# quantize to 16 gray levels — visually identical at 4% opacity, 4x smaller
arr = np.array(img)
arr = (arr // 16) * 16
img = Image.fromarray(arr.astype(np.uint8))

img.save("/home/z/my-project/public/grain.png", optimize=True)

import os
print("saved", os.path.getsize("/home/z/my-project/public/grain.png"), "bytes")
