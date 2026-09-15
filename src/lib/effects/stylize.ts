// Stylize category: find edges, emboss, oil paint, comic, crosshatch.
// Mirrors effectCatalog.ts's STYLIZE_FX list exactly.

import type { EffectParams } from './types';
import { lum, c255 } from './helpers';

export function applyFindEdges(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
  const d = sc.getImageData(0, 0, w, h).data;
  const out = ctx.createImageData(w, h);
  const invertEdges = (p.edgeInvert ?? 1) > 0;
  const gain = (p.sharpenAmount ?? 50) / 50;
  const gray = new Float32Array(w * h);
  for (let i = 0, j = 0; i < d.length; i += 4, j++) gray[j] = lum(d[i], d[i+1], d[i+2]);
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const j = y * w + x;
    const gx = -gray[j-w-1] - 2*gray[j-1] - gray[j+w-1] + gray[j-w+1] + 2*gray[j+1] + gray[j+w+1];
    const gy = -gray[j-w-1] - 2*gray[j-w] - gray[j-w+1] + gray[j+w-1] + 2*gray[j+w] + gray[j+w+1];
    const m = c255(Math.hypot(gx, gy) * gain);
    const v = invertEdges ? 255 - m : m;
    const i = j * 4;
    out.data[i] = out.data[i+1] = out.data[i+2] = v;
    out.data[i+3] = d[i+3];
  }
  ctx.putImageData(out, 0, 0);
}

export function applyEmboss(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
  const amount = (p.sharpenAmount ?? 60) / 50;
  const d = sc.getImageData(0, 0, w, h).data;
  const out = ctx.createImageData(w, h);
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = (y*w+x)*4, a = ((y-1)*w+(x-1))*4, b = ((y+1)*w+(x+1))*4;
    for (let k = 0; k < 3; k++) out.data[i+k] = c255(128 + (d[a+k] - d[b+k]) * amount);
    out.data[i+3] = d[i+3];
  }
  ctx.putImageData(out, 0, 0);
}

/** Kuwahara — the painterly/oil filter: each pixel takes the mean of whichever
    quadrant around it has the lowest variance, so edges stay hard. */
export function applyOilPaint(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
  const r = Math.max(1, Math.min(6, Math.round((p.pixelSize ?? 6) / 2)));
  const d = sc.getImageData(0, 0, w, h).data;
  const out = ctx.createImageData(w, h);
  const quads = [[-r, 0, -r, 0], [0, r, -r, 0], [-r, 0, 0, r], [0, r, 0, r]];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let bestVar = Infinity, bR = 0, bG = 0, bB = 0;
    for (const [x0, x1, y0, y1] of quads) {
      let sR = 0, sG = 0, sB = 0, sL = 0, sL2 = 0, n = 0;
      for (let dy = y0; dy <= y1; dy++) {
        const yy = y + dy; if (yy < 0 || yy >= h) continue;
        for (let dx = x0; dx <= x1; dx++) {
          const xx = x + dx; if (xx < 0 || xx >= w) continue;
          const i = (yy*w+xx)*4, L = lum(d[i], d[i+1], d[i+2]);
          sR += d[i]; sG += d[i+1]; sB += d[i+2]; sL += L; sL2 += L*L; n++;
        }
      }
      if (!n) continue;
      const variance = sL2/n - (sL/n)*(sL/n);
      if (variance < bestVar) { bestVar = variance; bR = sR/n; bG = sG/n; bB = sB/n; }
    }
    const i = (y*w+x)*4;
    out.data[i] = bR; out.data[i+1] = bG; out.data[i+2] = bB; out.data[i+3] = d[i+3];
  }
  ctx.putImageData(out, 0, 0);
}

/** Engraving: dark tones get more hatch passes, like a woodcut. */
export function applyCrosshatch(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
  const gap = Math.max(3, p.dotSize ?? 7);
  const ink = p.color1 ?? '#14121F';
  const paper = p.color2 ?? '#FFFCF5';
  const d = sc.getImageData(0, 0, w, h).data;
  ctx.fillStyle = paper; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = ink; ctx.lineWidth = Math.max(1, gap / 7);
  ctx.lineCap = 'round';
  const passes = [
    { angle: Math.PI / 4, below: 210 },
    { angle: -Math.PI / 4, below: 160 },
    { angle: 0, below: 110 },
    { angle: Math.PI / 2, below: 60 },
  ];
  const diag = Math.hypot(w, h);
  for (const pass of passes) {
    const cos = Math.cos(pass.angle), sin = Math.sin(pass.angle);
    for (let t = -diag; t < diag; t += gap) {
      ctx.beginPath();
      let drawing = false;
      for (let s = -diag; s < diag; s += 2) {
        const x = Math.round(w/2 + cos * s - sin * t);
        const y = Math.round(h/2 + sin * s + cos * t);
        if (x < 0 || y < 0 || x >= w || y >= h) { drawing = false; continue; }
        const i = (y*w+x)*4;
        const dark = lum(d[i], d[i+1], d[i+2]) < pass.below;
        if (dark && !drawing) { ctx.moveTo(x, y); drawing = true; }
        else if (dark) ctx.lineTo(x, y);
        else drawing = false;
      }
      ctx.stroke();
    }
  }
}

/** Cel shading: flatten to few tones, then lay the edge map over as ink. */
export function applyComic(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
  const levels = Math.max(2, Math.min(8, p.posterizeLevels ?? 4));
  const step = 255 / (levels - 1);
  const d = sc.getImageData(0, 0, w, h);
  const src = new Uint8ClampedArray(d.data);
  for (let i = 0; i < d.data.length; i += 4) {
    d.data[i] = Math.round(Math.round(d.data[i]/step)*step);
    d.data[i+1] = Math.round(Math.round(d.data[i+1]/step)*step);
    d.data[i+2] = Math.round(Math.round(d.data[i+2]/step)*step);
  }
  const gray = new Float32Array(w * h);
  for (let i = 0, j = 0; i < src.length; i += 4, j++) gray[j] = lum(src[i], src[i+1], src[i+2]);
  const edgeAt = (p.threshold ?? 60);
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const j = y*w+x;
    const gx = -gray[j-w-1] - 2*gray[j-1] - gray[j+w-1] + gray[j-w+1] + 2*gray[j+1] + gray[j+w+1];
    const gy = -gray[j-w-1] - 2*gray[j-w] - gray[j-w+1] + gray[j+w-1] + 2*gray[j+w] + gray[j+w+1];
    if (Math.hypot(gx, gy) > edgeAt) {
      const i = j*4;
      d.data[i] = d.data[i+1] = d.data[i+2] = 20;
    }
  }
  ctx.putImageData(d, 0, 0);
}
