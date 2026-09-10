"""
Background-removal pipeline for stickers (09) and folder icons (10-misc).

Uses connected-region flood fill from the image borders so only the OUTER
background is removed -- interior whites (die-cut borders, bellies) survive.
Two hard cases get special keys: a checkerboard-transparency jpg and an
Instagram-UI screenshot. Outputs transparent PNGs + a contact sheet to review.
"""

import os
import glob
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REF = os.path.join(ROOT, "references")
rng = np.random.default_rng(3)

# Per-file overrides: pre-crop (l,t,r,b fractions) and/or key mode.
OVERRIDES = {
    "photo_62": {"crop": (0.02, 0.14, 0.99, 0.90)},   # drop Instagram chrome
    "photo_25": {"mode": "hsv_grey"},                  # checkerboard placeholder
    "photo_63": {"crop": (0.02, 0.10, 0.99, 0.95)},   # trim any UI margins
}


def autocrop(im, pad=10):
    a = np.array(im)[..., 3]
    ys, xs = np.where(a > 14)
    if len(xs) == 0:
        return im
    x0, x1 = max(0, xs.min() - pad), min(im.width, xs.max() + pad + 1)
    y0, y1 = max(0, ys.min() - pad), min(im.height, ys.max() + pad + 1)
    return im.crop((x0, y0, x1, y1))


def clean_alpha(alpha, erode=True, feather=0.8):
    am = Image.fromarray(alpha.astype(np.uint8))
    if erode:
        am = am.filter(ImageFilter.MinFilter(3))     # shave bg-tinted fringe
    if feather:
        am = am.filter(ImageFilter.GaussianBlur(feather))
    return np.array(am)


def flood_cut(orig, tol):
    work = orig.copy()
    seed = (255, 0, 255)
    W, H = work.size
    pts = [(0, 0), (W - 1, 0), (0, H - 1), (W - 1, H - 1),
           (W // 2, 0), (W // 2, H - 1), (0, H // 2), (W - 1, H // 2)]
    for p in pts:
        ImageDraw.floodfill(work, p, seed, thresh=tol)
    wa = np.array(work)
    bg = np.all(np.abs(wa.astype(int) - np.array(seed)) < 10, axis=-1)
    return np.where(bg, 0, 255).astype(np.float32)


def hsv_grey_cut(orig):
    """Key out low-saturation dark greys (checkerboard) but keep white + colour."""
    hsv = np.array(orig.convert("HSV"), dtype=np.float32) / 255.0
    s, v = hsv[..., 1], hsv[..., 2]
    bg = (s < 0.14) & (v < 0.62)
    return np.where(bg, 0, 255).astype(np.float32)


def process(path, out_dir, tol):
    name = os.path.splitext(os.path.basename(path))[0]
    ov = OVERRIDES.get(name, {})
    orig = Image.open(path).convert("RGB")
    if "crop" in ov:
        w, h = orig.size
        l, t, r, b = ov["crop"]
        orig = orig.crop((int(l * w), int(t * h), int(r * w), int(b * h)))
    if ov.get("mode") == "hsv_grey":
        alpha = hsv_grey_cut(orig)
    else:
        alpha = flood_cut(orig, tol)
    alpha = clean_alpha(alpha)
    out = np.dstack([np.array(orig), alpha]).astype(np.uint8)
    im = autocrop(Image.fromarray(out, "RGBA"))
    dest = os.path.join(out_dir, name + ".png")
    im.save(dest)
    return im


def contact_sheet(imgs, path, cols=6, cell=190, bg=(40, 40, 46)):
    rows = (len(imgs) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * cell, rows * cell), bg)
    for i, im in enumerate(imgs):
        t = im.copy()
        t.thumbnail((cell - 16, cell - 16))
        x = (i % cols) * cell + (cell - t.width) // 2
        y = (i // cols) * cell + (cell - t.height) // 2
        sheet.paste(t, (x, y), t)
    sheet.save(path)
    print("contact sheet:", path, f"({len(imgs)} items)")


def run(src_folder, out_dir, tol):
    os.makedirs(out_dir, exist_ok=True)
    paths = sorted(glob.glob(os.path.join(REF, src_folder, "*.jpg")))
    imgs = [process(p, out_dir, tol) for p in paths]
    contact_sheet(imgs, os.path.join(ROOT, "scripts", f"_sheet_{out_dir.split(os.sep)[-1]}.png"))
    return imgs


if __name__ == "__main__":
    run("09-tape-stickers-doodles", os.path.join(ROOT, "public", "stickers"), tol=52)
    run("10-misc", os.path.join(ROOT, "public", "folders"), tol=62)
