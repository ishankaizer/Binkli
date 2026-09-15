// Light category: neon glow, vignette, bloom, light leak. Mirrors
// effectCatalog.ts's LIGHT_FX list exactly.

import type { EffectParams } from './types';
import { hexToRgb, lum, boxBlur, tmp } from './helpers';

export function applyNeon(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
  const [nr,ng,nb] = hexToRgb(p.neonColor ?? '#00E5CC'), str = (p.neonStrength ?? 50) / 100;
  const d = sc.getImageData(0, 0, w, h);
  const glow = ctx.createImageData(w, h);
  for (let i = 0; i < d.data.length; i += 4) {
    const l = 255 - lum(d.data[i],d.data[i+1],d.data[i+2]);
    const g = Math.min(255, l * 1.4);
    glow.data[i] = nr*(g/255); glow.data[i+1] = ng*(g/255); glow.data[i+2] = nb*(g/255); glow.data[i+3] = d.data[i+3];
  }
  boxBlur(glow, w, h, 4);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, h);
  const tmp2 = document.createElement('canvas'); tmp2.width=w; tmp2.height=h;
  tmp2.getContext('2d', { willReadFrequently: true })!.putImageData(glow, 0, 0);
  ctx.globalAlpha = 0.7 + str * 0.3;
  ctx.drawImage(tmp2, 0, 0);
  ctx.globalAlpha = 1;
  for (let i = 0; i < glow.data.length; i += 4) {
    const l = lum(glow.data[i],glow.data[i+1],glow.data[i+2]);
    if (l > 160) {
      glow.data[i] = Math.min(255, nr+80); glow.data[i+1] = Math.min(255, ng+80); glow.data[i+2] = Math.min(255, nb+80);
    } else {
      glow.data[i+3] = 0;
    }
  }
  const sharp = document.createElement('canvas'); sharp.width=w; sharp.height=h;
  sharp.getContext('2d', { willReadFrequently: true })!.putImageData(glow, 0, 0);
  ctx.drawImage(sharp, 0, 0);
}

export function applyVignette(ctx: CanvasRenderingContext2D, sc: HTMLCanvasElement, w: number, h: number, p: EffectParams) {
  ctx.drawImage(sc, 0, 0, w, h);
  const strength = Math.min(0.98, (p.vignetteStrength ?? 70) / 100);
  const cx = w / 2, cy = h / 2;
  const innerR = Math.min(w, h) * 0.28;
  const outerR = Math.sqrt(cx * cx + cy * cy) * 1.05;
  const grad = ctx.createRadialGradient(cx, cy, innerR, cx, cy, outerR);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(0.6, `rgba(0,0,0,${strength * 0.35})`);
  grad.addColorStop(1,   `rgba(0,0,0,${strength})`);
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'source-over';
}

/** Bloom: isolate the highlights, blur them, screen them back over the image. */
export function applyBloom(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
  const cut = p.bloomThreshold ?? 180;
  const strength = (p.bloomStrength ?? 60) / 100;
  const [glow, gctx] = tmp(w, h);
  const d = sc.getImageData(0, 0, w, h);
  const bright = gctx.createImageData(w, h);
  for (let i = 0; i < d.data.length; i += 4) {
    const L = lum(d.data[i], d.data[i+1], d.data[i+2]);
    const on = L > cut ? 1 : 0;
    bright.data[i] = d.data[i] * on;
    bright.data[i+1] = d.data[i+1] * on;
    bright.data[i+2] = d.data[i+2] * on;
    bright.data[i+3] = 255 * on;
  }
  gctx.putImageData(boxBlur(bright, w, h, Math.max(2, Math.round(Math.min(w, h) / 60))), 0, 0);
  ctx.drawImage(sc.canvas, 0, 0);
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = strength;
  ctx.drawImage(glow, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}

export function applyLightLeak(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
  const color = p.leakColor ?? '#FF7A1A';
  const strength = (p.leakStrength ?? 55) / 100;
  const corner = Math.max(0, Math.min(3, Math.round(p.leakCorner ?? 0)));
  ctx.drawImage(sc.canvas, 0, 0);
  const pts = [[w, 0], [0, 0], [0, h], [w, h]][corner];
  const g = ctx.createRadialGradient(pts[0], pts[1], 0, pts[0], pts[1], Math.hypot(w, h) * 0.75);
  const [r, gg, b] = hexToRgb(color);
  g.addColorStop(0, `rgba(${r},${gg},${b},${strength})`);
  g.addColorStop(0.45, `rgba(${r},${gg},${b},${strength * 0.32})`);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'source-over';
}
