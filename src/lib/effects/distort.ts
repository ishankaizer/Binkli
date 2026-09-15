// Distort category: chromatic aberration, VHS tape, glass warp, motion/radial
// blur, twirl, bulge, wave, kaleidoscope. Mirrors effectCatalog.ts's
// DISTORT_FX list exactly.

import type { EffectParams } from './types';
import { lum } from './helpers';

export function applyChromatic(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
  const s = p.chromaticStrength ?? 8;
  const d = sc.getImageData(0, 0, w, h), out = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y*w+x)*4;
    const rx = Math.min(w-1, x+s), ri = (y*w+rx)*4;
    const bx = Math.max(0, x-s), bi = (y*w+bx)*4;
    out.data[i]   = d.data[ri];
    out.data[i+1] = d.data[i+1];
    out.data[i+2] = d.data[bi+2];
    out.data[i+3] = d.data[i+3];
  }
  ctx.putImageData(out, 0, 0);
}

// ── VHS tape artifact ─────────────────────────────────────────────────────────
// RGB channel shift + horizontal scan wobble + luminance noise
export function applyVHS(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
  const str = (p.vhsStrength ?? 60) / 100;
  const d   = sc.getImageData(0, 0, w, h);
  const px  = d.data;
  const src = new Uint8ClampedArray(px);

  const shift = Math.round(str * 10);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i  = (y * w + x) * 4;
      const ri = (y * w + Math.min(w-1, x + shift)) * 4;
      const bi = (y * w + Math.max(0, x - shift)) * 4;
      px[i]   = src[ri];
      px[i+2] = src[bi+2];
    }
  }

  const scanSrc = new Uint8ClampedArray(px);
  for (let y = 0; y < h; y++) {
    if (Math.random() < 0.06 * str) {
      const noise  = (Math.random() - 0.5) * str * 22;
      const hShift = Math.round((Math.random() - 0.5) * str * 14);
      for (let x = 0; x < w; x++) {
        const srcX = Math.max(0, Math.min(w-1, x + hShift));
        const si = (y * w + srcX) * 4;
        const di = (y * w + x) * 4;
        px[di]   = Math.max(0, Math.min(255, scanSrc[si]   + noise));
        px[di+1] = Math.max(0, Math.min(255, scanSrc[si+1] + noise));
        px[di+2] = Math.max(0, Math.min(255, scanSrc[si+2] + noise));
      }
    }
  }

  const noiseAmt = str * 20;
  for (let i = 0; i < px.length; i += 4) {
    const n = (Math.random() - 0.5) * noiseAmt;
    px[i]   = Math.max(0, Math.min(255, px[i]   + n));
    px[i+1] = Math.max(0, Math.min(255, px[i+1] + n));
    px[i+2] = Math.max(0, Math.min(255, px[i+2] + n));
  }

  ctx.putImageData(d, 0, 0);
}

export function applyGlass(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
  const strength = p.glassStrength ?? 15, d = sc.getImageData(0, 0, w, h), out = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y*w+x)*4, l = lum(d.data[i],d.data[i+1],d.data[i+2])/255;
    const nx = Math.max(0, Math.min(w-1, x + Math.sin(y*0.1+l*Math.PI)*strength|0));
    const ny = Math.max(0, Math.min(h-1, y + Math.cos(x*0.1+l*Math.PI)*strength|0));
    const si = (ny*w+nx)*4;
    out.data[i]=d.data[si]; out.data[i+1]=d.data[si+1]; out.data[i+2]=d.data[si+2]; out.data[i+3]=d.data[si+3];
  }
  ctx.putImageData(out, 0, 0);
}

export function applyMotionBlur(ctx: CanvasRenderingContext2D, sc: HTMLCanvasElement, w: number, h: number, p: EffectParams) {
  const amount = Math.max(2, p.blurAmount ?? 20);
  const angle  = ((p.blurAngle ?? 0) * Math.PI) / 180;
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const samples = Math.min(32, Math.max(8, Math.round(amount * 0.8)));
  const step    = (amount * 2) / samples;
  const alpha   = 1 / samples;

  ctx.clearRect(0, 0, w, h);
  ctx.globalAlpha = alpha;
  ctx.filter = `blur(${Math.max(0.5, amount * 0.05)}px)`;
  for (let i = 0; i < samples; i++) {
    const offset = -amount + i * step;
    ctx.drawImage(sc, dx * offset, dy * offset, w, h);
  }
  ctx.filter = 'none';
  ctx.globalAlpha = 1;
}

export function applyRadialBlur(ctx: CanvasRenderingContext2D, sc: HTMLCanvasElement, w: number, h: number, p: EffectParams) {
  const amount  = Math.max(2, p.blurAmount ?? 15) / 100;
  const samples = 18;
  const alpha   = 1 / samples;

  ctx.clearRect(0, 0, w, h);
  ctx.globalAlpha = alpha;
  ctx.filter = `blur(${Math.max(0.5, amount * 4)}px)`;
  for (let i = 0; i < samples; i++) {
    const t  = i / (samples - 1);
    const s  = 1 + (t - 0.5) * amount;
    const tx = w * (1 - s) / 2;
    const ty = h * (1 - s) / 2;
    ctx.drawImage(sc, tx, ty, w * s, h * s);
  }
  ctx.filter = 'none';
  ctx.globalAlpha = 1;
}

function sampleInto(out: ImageData, d: Uint8ClampedArray, w: number, h: number, x: number, y: number, i: number) {
  const sx = Math.round(x), sy = Math.round(y);
  if (sx < 0 || sy < 0 || sx >= w || sy >= h) { out.data[i+3] = 0; return; }
  const j = (sy*w+sx)*4;
  out.data[i] = d[j]; out.data[i+1] = d[j+1]; out.data[i+2] = d[j+2]; out.data[i+3] = d[j+3];
}

export function applyTwirl(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
  const strength = ((p.twirlStrength ?? 45) / 100) * Math.PI * 2;
  const d = sc.getImageData(0, 0, w, h).data;
  const out = ctx.createImageData(w, h);
  const cx = w/2, cy = h/2, radius = Math.min(w, h) / 2;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = x - cx, dy = y - cy, dist = Math.hypot(dx, dy);
    const i = (y*w+x)*4;
    if (dist > radius) { sampleInto(out, d, w, h, x, y, i); continue; }
    const pct = (radius - dist) / radius;
    const a = Math.atan2(dy, dx) + strength * pct * pct;
    sampleInto(out, d, w, h, cx + Math.cos(a) * dist, cy + Math.sin(a) * dist, i);
  }
  ctx.putImageData(out, 0, 0);
}

/** Spherize: positive bulges out of the frame, negative pinches into it. */
export function applyBulge(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
  const amount = (p.bulgeStrength ?? 50) / 100;
  const d = sc.getImageData(0, 0, w, h).data;
  const out = ctx.createImageData(w, h);
  const cx = w/2, cy = h/2, radius = Math.min(w, h) / 2;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = x - cx, dy = y - cy, dist = Math.hypot(dx, dy);
    const i = (y*w+x)*4;
    if (dist > radius || dist === 0) { sampleInto(out, d, w, h, x, y, i); continue; }
    const pct = dist / radius;
    const scale = Math.pow(pct, 1 - amount * 0.85);
    sampleInto(out, d, w, h, cx + dx / pct * scale, cy + dy / pct * scale, i);
  }
  ctx.putImageData(out, 0, 0);
}

export function applyWave(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
  const amp = p.waveAmp ?? 12;
  const freq = Math.max(1, p.waveFreq ?? 4);
  const d = sc.getImageData(0, 0, w, h).data;
  const out = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y*w+x)*4;
    const ox = Math.sin((y / h) * Math.PI * 2 * freq) * amp;
    const oy = Math.cos((x / w) * Math.PI * 2 * freq) * amp * 0.5;
    sampleInto(out, d, w, h, x + ox, y + oy, i);
  }
  ctx.putImageData(out, 0, 0);
}

export function applyKaleidoscope(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
  const segments = Math.max(2, Math.min(16, Math.round(p.kaleidoSegments ?? 6)));
  const d = sc.getImageData(0, 0, w, h).data;
  const out = ctx.createImageData(w, h);
  const cx = w/2, cy = h/2, slice = (Math.PI * 2) / segments;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = x - cx, dy = y - cy;
    const dist = Math.hypot(dx, dy);
    let a = Math.atan2(dy, dx);
    a = Math.abs(((a % slice) + slice) % slice - slice / 2);
    sampleInto(out, d, w, h, cx + Math.cos(a) * dist, cy + Math.sin(a) * dist, (y*w+x)*4);
  }
  ctx.putImageData(out, 0, 0);
}
