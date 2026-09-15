// Shared pixel-math and canvas-scratch helpers used across multiple effect
// category files. Kept here instead of duplicated per file.

export function hexToRgb(hex: string): [number, number, number] {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? [parseInt(r[1], 16), parseInt(r[2], 16), parseInt(r[3], 16)] : [0, 0, 0];
}

export function lum(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

export function c255(v: number): number { return v < 0 ? 0 : v > 255 ? 255 : v; }

export function tmp(w: number, h: number, src?: HTMLCanvasElement | HTMLImageElement): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  if (src) ctx.drawImage(src as CanvasImageSource, 0, 0, w, h);
  return [c, ctx];
}

export function buildGradientLut(stops: string[]): Uint8ClampedArray {
  const [, lctx] = tmp(256, 1);
  const g = lctx.createLinearGradient(0, 0, 256, 0);
  stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c));
  lctx.fillStyle = g;
  lctx.fillRect(0, 0, 256, 1);
  return lctx.getImageData(0, 0, 256, 1).data;
}

export function boxBlur(data: ImageData, w: number, h: number, radius: number): ImageData {
  const src = new Uint8ClampedArray(data.data);
  const dst = data.data;
  const r = Math.max(1, radius | 0);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let R = 0, G = 0, B = 0, A = 0, count = 0;
      for (let dy = -r; dy <= r; dy++) {
        const ny = Math.min(h - 1, Math.max(0, y + dy));
        for (let dx = -r; dx <= r; dx++) {
          const nx = Math.min(w - 1, Math.max(0, x + dx));
          const i = (ny * w + nx) * 4;
          R += src[i]; G += src[i+1]; B += src[i+2]; A += src[i+3]; count++;
        }
      }
      const i = (y * w + x) * 4;
      dst[i] = R/count; dst[i+1] = G/count; dst[i+2] = B/count; dst[i+3] = A/count;
    }
  }
  return data;
}

export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0; const l = (max + min) / 2;
  const dh = max - min;
  if (dh !== 0) {
    s = l > 0.5 ? dh / (2 - max - min) : dh / (max + min);
    switch (max) {
      case r: h = ((g - b) / dh + (g < b ? 6 : 0)); break;
      case g: h = ((b - r) / dh + 2); break;
      case b: h = ((r - g) / dh + 4); break;
    }
    h *= 60;
  }
  return [h, s, l];
}

export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60)        { r = c; g = x; b = 0; }
  else if (h < 120)  { r = x; g = c; b = 0; }
  else if (h < 180)  { r = 0; g = c; b = x; }
  else if (h < 240)  { r = 0; g = x; b = c; }
  else if (h < 300)  { r = x; g = 0; b = c; }
  else               { r = c; g = 0; b = x; }
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}
