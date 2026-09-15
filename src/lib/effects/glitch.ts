// Glitch category: pixel sort, slice shift, JPEG crush, CRT scanlines,
// channel swap. Mirrors effectCatalog.ts's GLITCH_FX list exactly.

import type { EffectParams } from './types';
import { lum, c255 } from './helpers';

/** Pixel sort: sort each row's runs of similar brightness — the glitch-art staple. */
export function applyPixelSort(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
  const thresholdLo = p.sortThreshold ?? 90;
  const vertical = (p.sortVertical ?? 0) > 0;
  const d = sc.getImageData(0, 0, w, h);
  const px = d.data;
  const lines = vertical ? w : h;
  const len = vertical ? h : w;
  const idx = (line: number, n: number) => (vertical ? (n * w + line) : (line * w + n)) * 4;
  for (let line = 0; line < lines; line++) {
    let start = -1;
    for (let n = 0; n <= len; n++) {
      const i = n < len ? idx(line, n) : -1;
      const bright = i >= 0 ? lum(px[i], px[i+1], px[i+2]) : -1;
      const inRun = bright >= thresholdLo;
      if (inRun && start < 0) start = n;
      else if (!inRun && start >= 0) {
        const run: number[][] = [];
        for (let k = start; k < n; k++) {
          const j = idx(line, k);
          run.push([px[j], px[j+1], px[j+2], px[j+3]]);
        }
        run.sort((a, b) => lum(a[0], a[1], a[2]) - lum(b[0], b[1], b[2]));
        for (let k = start; k < n; k++) {
          const j = idx(line, k), c = run[k - start];
          px[j] = c[0]; px[j+1] = c[1]; px[j+2] = c[2]; px[j+3] = c[3];
        }
        start = -1;
      }
    }
  }
  ctx.putImageData(d, 0, 0);
}

export function applySliceGlitch(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
  const slices = Math.max(2, Math.round(p.sliceCount ?? 14));
  const maxShift = (p.sliceOffset ?? 30) / 100 * w * 0.4;
  const src = sc.canvas;
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(src, 0, 0);
  let y = 0;
  for (let n = 0; n < slices; n++) {
    const sliceH = Math.max(2, Math.round(h / slices * (0.4 + (Math.sin(n * 53.7) + 1))));
    if (y >= h) break;
    const shift = Math.round((Math.sin(n * 91.3) * maxShift));
    ctx.clearRect(0, y, w, sliceH);
    ctx.drawImage(src, 0, y, w, sliceH, shift, y, w, sliceH);
    if (shift > 0) ctx.drawImage(src, w - shift, y, shift, sliceH, 0, y, shift, sliceH);
    else if (shift < 0) ctx.drawImage(src, 0, y, -shift, sliceH, w + shift, y, -shift, sliceH);
    y += sliceH;
  }
}

/** Fake compression: quantise 8x8 blocks toward their own average, DCT-ringing style. */
export function applyJpegCrush(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
  const amount = Math.max(0, Math.min(100, p.crushAmount ?? 65)) / 100;
  const block = 8;
  const d = sc.getImageData(0, 0, w, h);
  const px = d.data;
  const q = 4 + Math.round(amount * 56);
  for (let by = 0; by < h; by += block) for (let bx = 0; bx < w; bx += block) {
    let sR = 0, sG = 0, sB = 0, n = 0;
    for (let y = by; y < Math.min(by+block, h); y++) for (let x = bx; x < Math.min(bx+block, w); x++) {
      const i = (y*w+x)*4; sR += px[i]; sG += px[i+1]; sB += px[i+2]; n++;
    }
    const aR = sR/n, aG = sG/n, aB = sB/n;
    for (let y = by; y < Math.min(by+block, h); y++) for (let x = bx; x < Math.min(bx+block, w); x++) {
      const i = (y*w+x)*4;
      for (let k = 0; k < 3; k++) {
        const avg = k === 0 ? aR : k === 1 ? aG : aB;
        const mixed = px[i+k] * (1 - amount * 0.8) + avg * (amount * 0.8);
        px[i+k] = c255(Math.round(mixed / q) * q);
      }
    }
  }
  ctx.putImageData(d, 0, 0);
}

export function applyScanlines(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
  const gap = Math.max(2, Math.round(p.scanGap ?? 3));
  const strength = Math.max(0, Math.min(100, p.scanStrength ?? 55)) / 100;
  ctx.drawImage(sc.canvas, 0, 0);
  ctx.fillStyle = `rgba(0,0,0,${strength * 0.7})`;
  for (let y = 0; y < h; y += gap) ctx.fillRect(0, y, w, Math.max(1, Math.floor(gap / 2)));
  const g = ctx.createRadialGradient(w/2, h/2, Math.min(w, h) * 0.3, w/2, h/2, Math.hypot(w, h) * 0.62);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, `rgba(0,0,0,${0.55 * strength})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

/** RGB channel permutations — cheap, and the backbone of a lot of glitch looks. */
export function applyChannelSwap(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
  const mode = Math.max(0, Math.min(5, Math.round(p.channelMode ?? 0)));
  const order = [[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0],[0,1,2]][mode];
  const d = sc.getImageData(0, 0, w, h);
  for (let i = 0; i < d.data.length; i += 4) {
    const r = d.data[i], g = d.data[i+1], b = d.data[i+2];
    const src = [r, g, b];
    d.data[i] = src[order[0]]; d.data[i+1] = src[order[1]]; d.data[i+2] = src[order[2]];
  }
  ctx.putImageData(d, 0, 0);
}
