"""
Generate real-paper torn-edge PNGs with transparent, irregular alpha edges.

The FILL is real paper grain (sampled from a scanned photo, mapped onto a warm
cream tone), the EDGE is an organic multi-octave noise boundary with a lighter
exposed-fibre deckle and speckled fringe -- NOT a smooth vector path.

Outputs:
  public/textures/paper-edge.png     vertical strip, torn LEFT edge
  public/textures/paper-divider.png  horizontal strip, torn TOP + BOTTOM edges
"""

import os
import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEX = os.path.join(ROOT, "public", "textures")
SRC = os.path.join(TEX, "paper-photocopy.jpg")

CREAM = np.array([245, 236, 214], dtype=np.float32)   # warm paper base
DECKLE = np.array([252, 247, 233], dtype=np.float32)  # lighter torn fibre core
rng = np.random.default_rng(7)


def smooth(a, k):
    """1-D box smooth (wrap-safe enough for our purposes)."""
    if k <= 1:
        return a
    ker = np.ones(k) / k
    return np.convolve(a, ker, mode="same")


def paper_fill(h, w):
    """
    Real paper grain mapped onto a warm cream tone. We HIGH-PASS the scan
    (subtract a heavy blur) so the photocopy's grey streaks drop out and only
    the fine fibre grain survives -- clean warm torn paper, not smoky grey.
    """
    img = Image.open(SRC).convert("L").resize((w, h))
    lum = np.asarray(img, dtype=np.float32)
    low = np.asarray(img.filter(ImageFilter.GaussianBlur(28)), dtype=np.float32)
    grain = (lum - low) / 255.0                    # streak-free fine grain
    shade = np.clip(1.0 + grain * 0.85, 0.9, 1.08)[..., None]
    rgb = np.clip(CREAM[None, None, :] * shade, 0, 255)
    return rgb


def torn_boundary(n, base, amp):
    """Organic edge position for each of n rows/cols: multi-octave noise."""
    edge = np.full(n, base, dtype=np.float32)
    for wl, a in [(n / 2.0, amp), (n / 7.0, amp * 0.5), (n / 23.0, amp * 0.28)]:
        phase = rng.uniform(0, 2 * np.pi)
        edge += np.sin(np.linspace(0, 2 * np.pi * (n / wl), n) + phase) * a
    edge += smooth(rng.uniform(-1, 1, n), 9) * amp * 0.6   # random wander
    return edge


def apply_edge(rgb, alpha, coord, edge, inside_is_greater):
    """
    Carve a torn edge. coord: per-pixel position along the tear axis.
    inside_is_greater: True if paper is where coord > edge (left tear),
    the exposed deckle sits in a thin band just inside the boundary.
    """
    h, w, _ = rgb.shape
    dist = coord - edge if inside_is_greater else edge - coord
    # feathered alpha across ~1.5px
    a = np.clip((dist + 0.75) / 1.5, 0, 1)
    # speckled fringe: random dropouts / bits just outside the edge
    fr = (dist > -6) & (dist < 1)
    spk = rng.random(dist.shape)
    a = np.where(fr & (spk < 0.35), a * spk, a)
    fibre = (dist > 0.5) & (dist < 1.5)          # stray fibres poking out
    a = np.where(fibre & (spk > 0.78), np.maximum(a, 0.85), a)
    alpha = np.minimum(alpha, (a * 255).astype(np.float32))
    # lighter exposed-fibre deckle just inside the tear
    deck = np.clip(1 - np.abs(dist - 2.0) / 2.5, 0, 1)[..., None] * 0.4
    rgb = rgb * (1 - deck) + DECKLE[None, None, :] * deck
    return rgb, alpha


def make_vertical(path, w=170, h=1600):
    rgb = paper_fill(h, w)
    alpha = np.full((h, w), 255.0, dtype=np.float32)
    xx = np.broadcast_to(np.arange(w, dtype=np.float32)[None, :], (h, w))
    edge = torn_boundary(h, base=w * 0.42, amp=w * 0.16)[:, None]
    rgb, alpha = apply_edge(rgb, alpha, xx, edge, inside_is_greater=True)
    save(path, rgb, alpha)


def make_divider(path, w=1600, h=170):
    rgb = paper_fill(h, w)
    alpha = np.full((h, w), 255.0, dtype=np.float32)
    yy = np.broadcast_to(np.arange(h, dtype=np.float32)[:, None], (h, w))
    top = torn_boundary(w, base=h * 0.22, amp=h * 0.11)[None, :]
    bot = torn_boundary(w, base=h * 0.78, amp=h * 0.11)[None, :]
    rgb, alpha = apply_edge(rgb, alpha, yy, top, inside_is_greater=True)
    rgb, alpha = apply_edge(rgb, alpha, yy, bot, inside_is_greater=False)
    save(path, rgb, alpha)


def save(path, rgb, alpha):
    out = np.dstack([np.clip(rgb, 0, 255), np.clip(alpha, 0, 255)]).astype(np.uint8)
    Image.fromarray(out, "RGBA").save(path)
    print("wrote", path, out.shape)


def make_clean_paper(path, w=1100, h=1400):
    """
    A clean warm cream notebook page: isotropic synthetic fibre grain (no
    directional streaks) + gentle large-scale mottling + soft edge vignette.
    """
    # fine isotropic grain, lightly blurred so it reads as paper fibre
    fine = np.asarray(
        Image.fromarray(rng.integers(0, 256, (h, w), dtype=np.uint8)).filter(
            ImageFilter.GaussianBlur(0.6)
        ),
        dtype=np.float32,
    ) / 255.0
    shade = (0.985 + (fine - 0.5) * 0.06)[..., None]
    rgb = np.clip(CREAM[None, None, :] * shade, 0, 255)
    # subtle large-scale mottling for a hand-made, uneven-paper feel
    small = rng.uniform(-1, 1, (max(h // 40, 2), max(w // 40, 2))).astype(np.float32)
    mott = np.asarray(
        Image.fromarray(((small + 1) * 127).astype(np.uint8)).resize((w, h)).filter(
            ImageFilter.GaussianBlur(18)
        ),
        dtype=np.float32,
    ) / 255.0
    rgb = np.clip(rgb * (0.96 + mott[..., None] * 0.08), 0, 255)
    # soft vignette toward the corners
    yy, xx = np.mgrid[0:h, 0:w]
    d = np.sqrt(((xx - w / 2) / (w / 2)) ** 2 + ((yy - h / 2) / (h / 2)) ** 2)
    vig = np.clip(1 - (d - 0.7) * 0.12, 0.9, 1)[..., None]
    rgb = np.clip(rgb * vig, 0, 255)
    Image.fromarray(rgb.astype(np.uint8), "RGB").save(path, quality=92)
    print("wrote", path, rgb.shape)


if __name__ == "__main__":
    make_vertical(os.path.join(TEX, "paper-edge.png"))
    make_divider(os.path.join(TEX, "paper-divider.png"))
    make_clean_paper(os.path.join(TEX, "paper-cream.jpg"))
