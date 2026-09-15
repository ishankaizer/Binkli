// Color category: gradient map, duotone, overprint, cross-process, bleach
// bypass, two-tone threshold, solarize, thermal. Mirrors effectCatalog.ts's
// COLOR_FX list exactly.

import type { EffectParams } from './types';
import { GRADIENT_MAP_PRESETS } from './types';
import { hexToRgb, lum, buildGradientLut } from './helpers';

export function applyDuotone(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
  const d = sc.getImageData(0, 0, w, h);
  const [r1,g1,b1] = hexToRgb(p.color1 ?? '#2D3BCC'), [r2,g2,b2] = hexToRgb(p.color2 ?? '#FAF6EE');
  for (let i = 0; i < d.data.length; i += 4) {
    const t = lum(d.data[i],d.data[i+1],d.data[i+2]) / 255;
    d.data[i] = r1+(r2-r1)*t; d.data[i+1] = g1+(g2-g1)*t; d.data[i+2] = b1+(b2-b1)*t;
  }
  ctx.putImageData(d, 0, 0);
}

export function applyOverprint(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
  const d = sc.getImageData(0, 0, w, h), out = ctx.createImageData(w, h);
  const [r1,g1,b1] = hexToRgb(p.color1 ?? '#E63329'), [r2,g2,b2] = hexToRgb(p.color2 ?? '#2D3BCC');
  for (let i = 0; i < d.data.length; i += 4) {
    const l = lum(d.data[i],d.data[i+1],d.data[i+2]);
    if (l > 127) { out.data[i]=r2; out.data[i+1]=g2; out.data[i+2]=b2; }
    else { out.data[i]=r1; out.data[i+1]=g1; out.data[i+2]=b1; }
    out.data[i+3] = 255;
  }
  ctx.putImageData(out, 0, 0);
}

export function applyThreshold(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
  const d = sc.getImageData(0, 0, w, h), thr = p.threshold ?? 128;
  const [r1,g1,b1] = hexToRgb(p.color1 ?? '#2D3BCC'), [r2,g2,b2] = hexToRgb(p.color2 ?? '#F2EDE4');
  for (let i = 0; i < d.data.length; i += 4) {
    const below = lum(d.data[i],d.data[i+1],d.data[i+2]) < thr;
    d.data[i] = below?r1:r2; d.data[i+1] = below?g1:g2; d.data[i+2] = below?b1:b2; d.data[i+3] = 255;
  }
  ctx.putImageData(d, 0, 0);
}

export function applyGradientMap(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
  const preset = GRADIENT_MAP_PRESETS[p.gradientPreset ?? 0];
  const lut = buildGradientLut(preset.stops);
  const d = sc.getImageData(0, 0, w, h);
  for (let i = 0; i < d.data.length; i += 4) {
    const l = Math.min(255, lum(d.data[i],d.data[i+1],d.data[i+2])|0);
    d.data[i] = lut[l*4]; d.data[i+1] = lut[l*4+1]; d.data[i+2] = lut[l*4+2];
  }
  ctx.putImageData(d, 0, 0);
}

// Film cross-processing
export function applyCrossProcess(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, _p: EffectParams) {
  const d = sc.getImageData(0, 0, w, h);
  const px = d.data;

  for (let i = 0; i < px.length; i += 4) {
    let r = px[i] / 255, g = px[i+1] / 255, b = px[i+2] / 255;

    r = Math.min(1, r * 1.12 + 0.04 + r * r * 0.18);
    g = Math.min(1, g * 1.06 + g * (1 - g) * 0.08);
    b = Math.min(1, b > 0.5 ? b * 0.88 + 0.12 : b * 0.38);

    const con = (v: number) => Math.min(1, Math.max(0, (v - 0.5) * 1.28 + 0.5));
    px[i]   = con(r) * 255;
    px[i+1] = con(g) * 255;
    px[i+2] = con(b) * 255;
  }
  ctx.putImageData(d, 0, 0);
}

// Bleach bypass
export function applyBleachBypass(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
  const intensity = (p.vignetteStrength ?? 80) / 100;
  const d  = sc.getImageData(0, 0, w, h);
  const px = d.data;

  for (let i = 0; i < px.length; i += 4) {
    const l = lum(px[i], px[i+1], px[i+2]);
    px[i]   = Math.round(px[i]   * (1 - intensity) + l * intensity);
    px[i+1] = Math.round(px[i+1] * (1 - intensity) + l * intensity);
    px[i+2] = Math.round(px[i+2] * (1 - intensity) + l * intensity);
    for (let c = 0; c < 3; c++) {
      const v = px[i + c] / 255;
      px[i + c] = Math.max(0, Math.min(255, Math.round(((v - 0.5) * 1.45 + 0.5) * 255)));
    }
  }
  ctx.putImageData(d, 0, 0);
}

/** Sabattier: tones above the threshold flip, the classic darkroom over-exposure. */
export function applySolarize(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
  const t = p.threshold ?? 128;
  const d = sc.getImageData(0, 0, w, h);
  for (let i = 0; i < d.data.length; i += 4) {
    for (let k = 0; k < 3; k++) { const v = d.data[i+k]; d.data[i+k] = v < t ? v : 255 - v; }
  }
  ctx.putImageData(d, 0, 0);
}

const THERMAL_STOPS = ['#000018', '#2C0F63', '#8E1B6B', '#E0432F', '#FF9A00', '#FFE23D', '#FFFFFF'];
export function applyThermal(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number) {
  const lut = buildGradientLut(THERMAL_STOPS);
  const d = sc.getImageData(0, 0, w, h);
  for (let i = 0; i < d.data.length; i += 4) {
    const L = Math.round(lum(d.data[i], d.data[i+1], d.data[i+2]));
    d.data[i] = lut[L*4]; d.data[i+1] = lut[L*4+1]; d.data[i+2] = lut[L*4+2];
  }
  ctx.putImageData(d, 0, 0);
}
