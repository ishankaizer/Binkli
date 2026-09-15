// Print category: halftones, CMYK print, risograph, bitmap, dither, ASCII,
// dot matrix, stamp, word fill. Mirrors effectCatalog.ts's PRINT_FX list
// exactly.

import type { EffectParams } from './types';
import { hexToRgb, lum } from './helpers';

export function applyHalftoneDot(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
  const size = p.dotSize ?? 10, c1 = p.color1 ?? '#1A1A2E', c2 = p.color2 ?? '#F2EDE4';
  ctx.fillStyle = c2; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = c1;
  for (let y = 0; y < h; y += size) for (let x = 0; x < w; x += size) {
    const d = sc.getImageData(x + size/2|0, y + size/2|0, 1, 1).data;
    const r = ((255 - lum(d[0],d[1],d[2])) / 255) * (size/2) * 0.95;
    if (r > 0.5) { ctx.beginPath(); ctx.arc(x+size/2, y+size/2, r, 0, Math.PI*2); ctx.fill(); }
  }
}

export function applyHalftoneCircle(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
  const size = p.dotSize ?? 12, c1 = p.color1 ?? '#2D3BCC', c2 = p.color2 ?? '#F2EDE4';
  ctx.fillStyle = c2; ctx.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += size) for (let x = 0; x < w; x += size) {
    const d = sc.getImageData(x + size/2|0, y + size/2|0, 1, 1).data;
    const rings = Math.ceil(((255 - lum(d[0],d[1],d[2])) / 255) * 4);
    for (let r = rings; r > 0; r--) {
      ctx.beginPath(); ctx.arc(x+size/2, y+size/2, (r/4)*(size/2)*0.9, 0, Math.PI*2);
      ctx.strokeStyle = c1; ctx.lineWidth = 1.2; ctx.stroke();
    }
  }
}

export function applyHalftoneLine(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
  const size = p.dotSize ?? 8, c1 = p.color1 ?? '#E63329', c2 = p.color2 ?? '#F2EDE4';
  ctx.fillStyle = c2; ctx.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += size) for (let x = 0; x < w; x += size) {
    const d = sc.getImageData(x+size/2|0, y+size/2|0, 1, 1).data;
    const t = ((255 - lum(d[0],d[1],d[2])) / 255) * size * 0.9;
    if (t > 0.3) { ctx.fillStyle = c1; ctx.fillRect(x, y + (size-t)/2, size, t); }
  }
}

export function applyBitmap(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
  const size = p.pixelSize ?? 4, c1 = p.color1 ?? '#1A1A2E', c2 = p.color2 ?? '#F2EDE4', thr = p.threshold ?? 128;
  ctx.fillStyle = c2; ctx.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += size) for (let x = 0; x < w; x += size) {
    const d = sc.getImageData(x+size/2|0, y+size/2|0, 1, 1).data;
    if (lum(d[0],d[1],d[2]) < thr) { ctx.fillStyle = c1; ctx.fillRect(x, y, size, size); }
  }
}

export function applyAscii(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
  const csize = p.pixelSize ?? 8, chars = '@#S%?*+;:,. ', c1 = p.color1 ?? '#1A1A2E', c2 = p.color2 ?? '#F2EDE4';
  ctx.fillStyle = c2; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = c1; ctx.font = `${csize}px monospace`; ctx.textBaseline = 'top';
  for (let y = 0; y < h; y += csize) for (let x = 0; x < w; x += csize) {
    const d = sc.getImageData(x, y, 1, 1).data;
    const idx = Math.floor((lum(d[0],d[1],d[2])/255)*(chars.length-1));
    ctx.fillText(chars[idx], x, y);
  }
}

// Ordered Bayer dithering — sharp digital pixel aesthetic
const BAYER4 = [[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]];
export function applyDither(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
  const c1 = p.color1 ?? '#1A1A2E', c2 = p.color2 ?? '#F5F0E8';
  const [r1,g1,b1] = hexToRgb(c1), [r2,g2,b2] = hexToRgb(c2);
  const d = sc.getImageData(0, 0, w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const l = lum(d.data[i], d.data[i+1], d.data[i+2]);
      const useInk = l < (BAYER4[y % 4][x % 4] / 16) * 255;
      d.data[i]   = useInk ? r1 : r2;
      d.data[i+1] = useInk ? g1 : g2;
      d.data[i+2] = useInk ? b1 : b2;
      d.data[i+3] = 255;
    }
  }
  ctx.putImageData(d, 0, 0);
}

export function applyStamp(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
  const c1 = p.color1 ?? '#E63329', c2 = p.color2 ?? '#F2EDE4', thr = p.threshold ?? 160;
  const d = sc.getImageData(0, 0, w, h), out = ctx.createImageData(w, h);
  const [r1,g1,b1] = hexToRgb(c1), [r2,g2,b2] = hexToRgb(c2);
  for (let i = 0; i < d.data.length; i += 4) {
    const l = lum(d.data[i],d.data[i+1],d.data[i+2]);
    const below = l < thr;
    out.data[i] = below?r1:r2; out.data[i+1] = below?g1:g2; out.data[i+2] = below?b1:b2; out.data[i+3] = 255;
  }
  const noisy = new ImageData(new Uint8ClampedArray(out.data), w, h);
  for (let i = 0; i < noisy.data.length; i += 4) {
    if (noisy.data[i+3] > 0) {
      const n = (Math.random() - 0.5) * 40;
      noisy.data[i] = Math.max(0, Math.min(255, noisy.data[i]+n));
      noisy.data[i+1] = Math.max(0, Math.min(255, noisy.data[i+1]+n));
      noisy.data[i+2] = Math.max(0, Math.min(255, noisy.data[i+2]+n));
    }
  }
  ctx.putImageData(noisy, 0, 0);
}

// ── Risograph print simulation ────────────────────────────────────────────────
// 2-color halftone misregistration mimics real risograph machine aesthetics.
export function applyRisograph(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
  const ink1  = p.color1  ?? '#FF1464';
  const ink2  = p.color2  ?? '#00CFCF';
  const ds    = p.dotSize ?? 8;
  const offset = Math.round(ds * 0.45);

  ctx.fillStyle = '#F5F0E8';
  ctx.fillRect(0, 0, w, h);

  const d = sc.getImageData(0, 0, w, h);

  const sampleL = (cx: number, cy: number): number => {
    const xi = Math.max(0, Math.min(w-1, cx|0));
    const yi = Math.max(0, Math.min(h-1, cy|0));
    const i = (yi * w + xi) * 4;
    return lum(d.data[i], d.data[i+1], d.data[i+2]) / 255;
  };

  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = ink1;
  for (let y = 0; y < h; y += ds) {
    for (let x = 0; x < w; x += ds) {
      const l = sampleL(x + ds/2, y + ds/2);
      const r = (1 - l) * (ds * 0.5) * 0.95;
      if (r > 0.5) {
        ctx.globalAlpha = 0.92;
        ctx.beginPath();
        ctx.arc(x + ds/2, y + ds/2, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  ctx.fillStyle = ink2;
  for (let y = 0; y < h; y += ds) {
    for (let x = 0; x < w; x += ds) {
      const l = sampleL(x + ds/2, y + ds/2);
      const mid = Math.max(0, 1 - Math.abs(l - 0.42) * 2.4);
      const r = mid * (ds * 0.48) * 0.95;
      if (r > 0.5) {
        ctx.globalAlpha = 0.82;
        ctx.beginPath();
        ctx.arc(x + ds/2 + offset, y + ds/2 + offset, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
}

/** Proper 4-colour print separation: each ink gets its own screen angle. */
export function applyCmykHalftone(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
  const size = Math.max(3, p.dotSize ?? 8);
  const d = sc.getImageData(0, 0, w, h).data;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'multiply';
  const inks: [number, string][] = [[15, '#00AEEF'], [75, '#EC008C'], [0, '#FFF200'], [45, '#1C1C1C']];
  const diag = Math.hypot(w, h);
  inks.forEach(([angleDeg, hex], channel) => {
    const a = (angleDeg * Math.PI) / 180, cos = Math.cos(a), sin = Math.sin(a);
    ctx.fillStyle = hex;
    ctx.beginPath();
    for (let v = -diag; v < diag; v += size) {
      for (let u = -diag; u < diag; u += size) {
        const x = Math.round(w/2 + cos * u - sin * v);
        const y = Math.round(h/2 + sin * u + cos * v);
        if (x < 0 || y < 0 || x >= w || y >= h) continue;
        const i = (y*w+x)*4;
        const r = d[i]/255, g = d[i+1]/255, b = d[i+2]/255;
        const k = 1 - Math.max(r, g, b);
        let amt: number;
        if (channel === 3) amt = k;
        else {
          const denom = 1 - k || 1;
          amt = channel === 0 ? (1-r-k)/denom : channel === 1 ? (1-g-k)/denom : (1-b-k)/denom;
        }
        amt = Math.max(0, Math.min(1, amt));
        if (amt <= 0.02) continue;
        const rad = (size / 2) * Math.sqrt(amt);
        ctx.moveTo(x + rad, y);
        ctx.arc(x, y, rad, 0, Math.PI * 2);
      }
    }
    ctx.fill();
  });
  ctx.globalCompositeOperation = 'source-over';
}

export function applyDotMatrix(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
  const cell = Math.max(4, p.pixelSize ?? 10);
  const bg = p.color1 ?? '#0A0A12';
  const d = sc.getImageData(0, 0, w, h).data;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  for (let y = cell/2; y < h; y += cell) for (let x = cell/2; x < w; x += cell) {
    const px = Math.min(w-1, Math.round(x)), py = Math.min(h-1, Math.round(y));
    const i = (py*w+px)*4;
    const L = lum(d[i], d[i+1], d[i+2]) / 255;
    if (L < 0.04) continue;
    ctx.fillStyle = `rgb(${d[i]},${d[i+1]},${d[i+2]})`;
    ctx.beginPath();
    ctx.arc(x, y, (cell/2) * 0.92 * L, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Text mask (lorem ipsum colored by image pixels) ───────────────────────────
const LOREM_TEXT = ('Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor ' +
  'incididunt ut labore et dolore magna aliqua Ut enim ad minim veniam quis nostrud exercitation ' +
  'ullamco laboris nisi ut aliquip ex ea commodo consequat Duis aute irure dolor in reprehenderit ' +
  'in voluptate velit esse cillum dolore eu fugiat nulla pariatur Excepteur sint occaecat cupidatat ' +
  'non proident sunt in culpa qui officia deserunt mollit anim id est laborum ').repeat(14);

/**
 * Word Fill: the photo is only visible through the glyphs of repeated text.
 * `textMaskText` lets the words be the user's own, which is the whole point of
 * the effect — the default lorem is just a starting state.
 */
export function applyTextMask(ctx: CanvasRenderingContext2D, sc: HTMLCanvasElement, w: number, h: number, p: EffectParams) {
  const fontSize = Math.max(6, Math.min(48, p.textMaskFontSize ?? 12));
  const lineH    = Math.ceil(fontSize * 1.18);
  const charW    = fontSize * 0.615;
  const words    = (p.textMaskText ?? '').trim();
  const source   = words.length ? words.split(/\s+/) : LOREM_TEXT;

  const maskC = document.createElement('canvas'); maskC.width = w; maskC.height = h;
  const mc = maskC.getContext('2d', { willReadFrequently: true })!;
  mc.fillStyle = '#000'; mc.fillRect(0, 0, w, h);
  mc.fillStyle = '#fff';
  mc.font = `bold ${fontSize}px "Courier New", Courier, monospace`;
  mc.textBaseline = 'top';
  let idx = 0;
  for (let y = 0; y < h; y += lineH) {
    for (let x = 0; x < w; x += charW) {
      mc.fillText(source[idx % source.length], x, y); idx++;
    }
  }

  const compC = document.createElement('canvas'); compC.width = w; compC.height = h;
  const cc = compC.getContext('2d', { willReadFrequently: true })!;
  cc.drawImage(sc, 0, 0, w, h);
  cc.globalCompositeOperation = 'destination-in';
  cc.drawImage(maskC, 0, 0);

  ctx.fillStyle = p.color2 ?? '#F5F1E8';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(compC, 0, 0);
}
