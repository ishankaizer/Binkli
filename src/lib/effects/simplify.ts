// Simplify category: blur, field blur, pixelate, crystallize. Mirrors
// effectCatalog.ts's SIMPLIFY_FX list exactly.

import type { EffectParams } from './types';

export function applyBlurEffect(ctx: CanvasRenderingContext2D, sc: HTMLCanvasElement, w: number, h: number, p: EffectParams) {
  const radius = p.blurRadius ?? 6;
  ctx.filter = `blur(${radius}px)`;
  ctx.drawImage(sc, 0, 0, w, h);
  ctx.filter = 'none';
}

export function applyFieldBlur(ctx: CanvasRenderingContext2D, sc: HTMLCanvasElement, w: number, h: number, p: EffectParams) {
  const radius = Math.max(2, p.blurRadius ?? 18);
  ctx.filter = `blur(${radius * 0.6}px)`;
  ctx.drawImage(sc, 0, 0, w, h);
  ctx.filter = `blur(${radius * 0.4}px)`;
  ctx.drawImage(ctx.canvas, 0, 0);
  ctx.filter = 'none';
}

export function applyPixel(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
  const size = p.pixelSize ?? 12, d = sc.getImageData(0, 0, w, h);
  ctx.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += size) for (let x = 0; x < w; x += size) {
    const i = (y*w+x)*4;
    ctx.fillStyle = `rgba(${d.data[i]},${d.data[i+1]},${d.data[i+2]},${d.data[i+3]/255})`;
    ctx.fillRect(x, y, size, size);
  }
}

/** Jittered-grid Voronoi — each pixel takes the colour of its nearest cell seed. */
export function applyCrystallize(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
  const cell = Math.max(4, p.pixelSize ?? 18);
  const d = sc.getImageData(0, 0, w, h).data;
  const out = ctx.createImageData(w, h);
  const cols = Math.ceil(w / cell) + 1, rows = Math.ceil(h / cell) + 1;
  const seeds: { x: number; y: number; r: number; g: number; b: number }[] = [];
  for (let gy = 0; gy < rows; gy++) for (let gx = 0; gx < cols; gx++) {
    const sx = Math.min(w - 1, Math.max(0, Math.round((gx + (Math.sin(gx*12.9898 + gy*78.233) * 43758.5453 % 1 + 1) % 1) * cell)));
    const sy = Math.min(h - 1, Math.max(0, Math.round((gy + (Math.sin(gx*39.3468 + gy*11.135) * 24634.6345 % 1 + 1) % 1) * cell)));
    const i = (sy*w+sx)*4;
    seeds.push({ x: sx, y: sy, r: d[i], g: d[i+1], b: d[i+2] });
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const gx = Math.floor(x / cell), gy = Math.floor(y / cell);
    let best = Infinity, bi = 0;
    for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
      const cx = gx + ox, cy = gy + oy;
      if (cx < 0 || cy < 0 || cx >= cols || cy >= rows) continue;
      const s = seeds[cy * cols + cx];
      const dist = (s.x - x) ** 2 + (s.y - y) ** 2;
      if (dist < best) { best = dist; bi = cy * cols + cx; }
    }
    const s = seeds[bi], i = (y*w+x)*4;
    out.data[i] = s.r; out.data[i+1] = s.g; out.data[i+2] = s.b; out.data[i+3] = d[i+3];
  }
  ctx.putImageData(out, 0, 0);
}
