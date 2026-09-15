// Foundation category: exposure, contrast, brightness, saturation, hue,
// levels, colour balance, posterize, invert. Mirrors effectCatalog.ts's
// FOUNDATION_FX list exactly — that's the source of truth for what belongs here.

import type { EffectParams } from './types';
import { lum, c255, rgbToHsl, hslToRgb } from './helpers';

export function applyExposure(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
  const v = (p.exposureValue ?? 0) / 100;
  const factor = Math.pow(2, v);
  const d = sc.getImageData(0, 0, w, h);
  const px = d.data;
  for (let i = 0; i < px.length; i += 4) {
    px[i]   = Math.max(0, Math.min(255, px[i]   * factor));
    px[i+1] = Math.max(0, Math.min(255, px[i+1] * factor));
    px[i+2] = Math.max(0, Math.min(255, px[i+2] * factor));
  }
  ctx.putImageData(d, 0, 0);
}

export function applyContrast(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
  const v = (p.contrastValue ?? 0) / 100;
  const factor = 1 + v;
  const d = sc.getImageData(0, 0, w, h);
  const px = d.data;
  for (let i = 0; i < px.length; i += 4) {
    px[i]   = Math.max(0, Math.min(255, (px[i]   - 128) * factor + 128));
    px[i+1] = Math.max(0, Math.min(255, (px[i+1] - 128) * factor + 128));
    px[i+2] = Math.max(0, Math.min(255, (px[i+2] - 128) * factor + 128));
  }
  ctx.putImageData(d, 0, 0);
}

export function applyBrightness(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
  const add = ((p.brightnessValue ?? 0) / 100) * 128;
  const d = sc.getImageData(0, 0, w, h);
  const px = d.data;
  for (let i = 0; i < px.length; i += 4) {
    px[i]   = Math.max(0, Math.min(255, px[i]   + add));
    px[i+1] = Math.max(0, Math.min(255, px[i+1] + add));
    px[i+2] = Math.max(0, Math.min(255, px[i+2] + add));
  }
  ctx.putImageData(d, 0, 0);
}

export function applySaturation(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
  const v = (p.saturationValue ?? 0) / 100;
  const factor = 1 + v;
  const d = sc.getImageData(0, 0, w, h);
  const px = d.data;
  for (let i = 0; i < px.length; i += 4) {
    const l = lum(px[i], px[i+1], px[i+2]);
    px[i]   = Math.max(0, Math.min(255, l + (px[i]   - l) * factor));
    px[i+1] = Math.max(0, Math.min(255, l + (px[i+1] - l) * factor));
    px[i+2] = Math.max(0, Math.min(255, l + (px[i+2] - l) * factor));
  }
  ctx.putImageData(d, 0, 0);
}

export function applyHslShift(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
  const shift = p.hueShift ?? 0;
  if (shift === 0) { ctx.drawImage(sc.canvas, 0, 0); return; }
  const d = sc.getImageData(0, 0, w, h);
  const px = d.data;
  for (let i = 0; i < px.length; i += 4) {
    const [hh, ss, ll] = rgbToHsl(px[i], px[i+1], px[i+2]);
    const [r2, g2, b2] = hslToRgb(hh + shift, ss, ll);
    px[i] = r2; px[i+1] = g2; px[i+2] = b2;
  }
  ctx.putImageData(d, 0, 0);
}

export function applyPosterize(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
  const levels = Math.max(2, Math.min(16, p.posterizeLevels ?? 5));
  const step = 255 / (levels - 1);
  const d = sc.getImageData(0, 0, w, h);
  const px = d.data;
  for (let i = 0; i < px.length; i += 4) {
    px[i]   = Math.round(Math.round(px[i]   / step) * step);
    px[i+1] = Math.round(Math.round(px[i+1] / step) * step);
    px[i+2] = Math.round(Math.round(px[i+2] / step) * step);
  }
  ctx.putImageData(d, 0, 0);
}

export function applyInvert(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number) {
  const d = sc.getImageData(0, 0, w, h);
  for (let i = 0; i < d.data.length; i += 4) {
    d.data[i] = 255 - d.data[i];
    d.data[i+1] = 255 - d.data[i+1];
    d.data[i+2] = 255 - d.data[i+2];
  }
  ctx.putImageData(d, 0, 0);
}

export function applyLevels(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
  const black = p.levelsBlack ?? 0;
  const white = p.levelsWhite ?? 255;
  const gamma = Math.max(0.05, (p.levelsGamma ?? 100) / 100);
  const range = Math.max(1, white - black);
  const lut = new Uint8ClampedArray(256);
  for (let i = 0; i < 256; i++) {
    const v = Math.max(0, Math.min(1, (i - black) / range));
    lut[i] = Math.round(Math.pow(v, 1 / gamma) * 255);
  }
  const d = sc.getImageData(0, 0, w, h);
  for (let i = 0; i < d.data.length; i += 4) {
    d.data[i] = lut[d.data[i]]; d.data[i+1] = lut[d.data[i+1]]; d.data[i+2] = lut[d.data[i+2]];
  }
  ctx.putImageData(d, 0, 0);
}

export function applyColorBalance(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
  const rs = (p.balanceR ?? 0) * 1.28, gs = (p.balanceG ?? 0) * 1.28, bs = (p.balanceB ?? 0) * 1.28;
  const d = sc.getImageData(0, 0, w, h);
  for (let i = 0; i < d.data.length; i += 4) {
    d.data[i] = c255(d.data[i] + rs);
    d.data[i+1] = c255(d.data[i+1] + gs);
    d.data[i+2] = c255(d.data[i+2] + bs);
  }
  ctx.putImageData(d, 0, 0);
}
