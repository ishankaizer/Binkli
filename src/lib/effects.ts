// Canvas-based image effects engine — supports single effects and stacking.
// Ported from the pre-rebuild Next.js app (binkli-reference/app/lib/effects.ts),
// which is framework-agnostic pure canvas code. Order-dependent: applyEffectLayer
// takes a source canvas and returns a new one, so the caller folds a stack of
// layers by feeding each result as the next input — a blur before a duotone
// produces a different result than a duotone before a blur.

export type EffectType =
  | 'none'
  | 'exposure' | 'contrast' | 'brightness' | 'saturation' | 'hsl-shift' | 'posterize' | 'sharpen'
  | 'halftone-dot' | 'halftone-circle' | 'halftone-line'
  | 'duotone' | 'overprint' | 'threshold' | 'gradient-map'
  | 'pixel' | 'bitmap' | 'ascii' | 'dither'
  | 'glass' | 'neon' | 'stamp' | 'chromatic'
  | 'risograph' | 'vhs' | 'cross-process' | 'bleach-bypass'
  | 'blur' | 'motion-blur' | 'radial-blur' | 'field-blur'
  | 'vignette'
  | 'polaroid' | 'vhs-frame' | 'text-mask' | 'texture-overlay';

export interface GradientMapPreset {
  name: string;
  stops: string[];
  emoji: string;
}

export const GRADIENT_MAP_PRESETS: GradientMapPreset[] = [
  { name: 'Sunset',    emoji: '🌅', stops: ['#1A1A2E', '#7B2FBE', '#E63329', '#FF6B35', '#FFD600'] },
  { name: 'Ocean',     emoji: '🌊', stops: ['#0d0d1a', '#0d3b66', '#00B4D8', '#90E0EF', '#ffffff'] },
  { name: 'Botanical', emoji: '🌿', stops: ['#0a1628', '#1a472a', '#2d6a4f', '#74c69d', '#d8f3dc'] },
  { name: 'Violet',    emoji: '💜', stops: ['#0d0d1a', '#7B2FBE', '#FF3D9A', '#FFD6E7', '#ffffff'] },
  { name: 'Infrared',  emoji: '🔥', stops: ['#000000', '#3d0000', '#ff0000', '#ff8800', '#ffff00', '#ffffff'] },
  { name: 'Riso',      emoji: '🖨', stops: ['#0000cc', '#ff0099', '#ffcc00'] },
  { name: 'Chrome',    emoji: '🪞', stops: ['#000000', '#555577', '#aaaacc', '#ffffff', '#aaaacc', '#555577', '#000000'] },
  { name: 'B&W',       emoji: '⬛', stops: ['#000000', '#ffffff'] },
  { name: 'Heat',      emoji: '🌡', stops: ['#000000', '#3d0000', '#8b0000', '#ff4400', '#ffcc00', '#ffffff'] },
  { name: 'Forest',    emoji: '🌲', stops: ['#0a1f0a', '#1a4a1a', '#2d7a2d', '#7acc7a', '#d4f5d4'] },
  { name: 'Acid',      emoji: '☢', stops: ['#0a0a1f', '#1a003d', '#004400', '#00cc00', '#aaff00', '#ffffff'] },
  { name: 'Rose',      emoji: '🌸', stops: ['#1a0a10', '#5a1a30', '#c8657a', '#f0a89a', '#fdf0ee'] },
  { name: 'Terminal',  emoji: '🖥', stops: ['#000000', '#001a00', '#003300', '#00aa00', '#33ff33'] },
  { name: 'Cyan',      emoji: '💧', stops: ['#0d1b2a', '#1b365d', '#4472ca', '#a8c9f0', '#e8f4fd'] },
  { name: 'Sepia',     emoji: '📷', stops: ['#1a0d00', '#5c3317', '#a07050', '#d4a574', '#f5e6d0'] },
  { name: 'Copper',    emoji: '🔶', stops: ['#1a0800', '#5c2800', '#b05020', '#d4804a', '#f0c890'] },
  { name: 'Mars',      emoji: '🔴', stops: ['#1a0800', '#5c1a00', '#8b2500', '#c86540', '#e8b090'] },
  { name: 'Polaroid',  emoji: '📸', stops: ['#1a1a10', '#3d3020', '#808070', '#d0c8b0', '#f5f0e5'] },
];

export interface EffectParams {
  dotSize?: number;
  color1?: string;
  color2?: string;
  gradientPreset?: number;
  pixelSize?: number;
  glassStrength?: number;
  chromaticStrength?: number;
  threshold?: number;
  neonColor?: string;
  neonStrength?: number;
  blurRadius?: number;
  blurAngle?: number;
  blurAmount?: number;
  vignetteStrength?: number;
  vhsStrength?: number;
  exposureValue?: number;    // -100..100
  contrastValue?: number;    // -100..100
  brightnessValue?: number;  // -100..100
  saturationValue?: number;  // -100..100
  hueShift?: number;         // -180..180
  posterizeLevels?: number;  // 2..16
  sharpenAmount?: number;    // 0..100
  polaroidStyle?: number;    // 0=white 1=vintage 2=dark
  polaroidLabel?: string;    // caption text in bottom margin
  textMaskFontSize?: number; // 6..24
  texturePreset?: number;    // 0=grain 1=scanner 2=crumple 3=film
  textureOpacity?: number;   // 0..100
}

export interface EffectLayer {
  id: string;
  type: EffectType;
  opacity: number; // 0-1
  visible?: boolean; // default true; false skips this layer
  params: EffectParams;
}

// ── helpers ─────────────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? [parseInt(r[1], 16), parseInt(r[2], 16), parseInt(r[3], 16)] : [0, 0, 0];
}

function lum(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function tmp(w: number, h: number, src?: HTMLCanvasElement | HTMLImageElement): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  if (src) ctx.drawImage(src as CanvasImageSource, 0, 0, w, h);
  return [c, ctx];
}

function buildGradientLut(stops: string[]): Uint8ClampedArray {
  const [, lctx] = tmp(256, 1);
  const g = lctx.createLinearGradient(0, 0, 256, 0);
  stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c));
  lctx.fillStyle = g;
  lctx.fillRect(0, 0, 256, 1);
  return lctx.getImageData(0, 0, 256, 1).data;
}

function boxBlur(data: ImageData, w: number, h: number, radius: number): ImageData {
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

// ── individual effect renderers ──────────────────────────────────────────────

function applyHalftoneDot(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
  const size = p.dotSize ?? 10, c1 = p.color1 ?? '#1A1A2E', c2 = p.color2 ?? '#F2EDE4';
  ctx.fillStyle = c2; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = c1;
  for (let y = 0; y < h; y += size) for (let x = 0; x < w; x += size) {
    const d = sc.getImageData(x + size/2|0, y + size/2|0, 1, 1).data;
    const r = ((255 - lum(d[0],d[1],d[2])) / 255) * (size/2) * 0.95;
    if (r > 0.5) { ctx.beginPath(); ctx.arc(x+size/2, y+size/2, r, 0, Math.PI*2); ctx.fill(); }
  }
}

function applyHalftoneCircle(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
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

function applyHalftoneLine(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
  const size = p.dotSize ?? 8, c1 = p.color1 ?? '#E63329', c2 = p.color2 ?? '#F2EDE4';
  ctx.fillStyle = c2; ctx.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += size) for (let x = 0; x < w; x += size) {
    const d = sc.getImageData(x+size/2|0, y+size/2|0, 1, 1).data;
    const t = ((255 - lum(d[0],d[1],d[2])) / 255) * size * 0.9;
    if (t > 0.3) { ctx.fillStyle = c1; ctx.fillRect(x, y + (size-t)/2, size, t); }
  }
}

function applyDuotone(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
  const d = sc.getImageData(0, 0, w, h);
  const [r1,g1,b1] = hexToRgb(p.color1 ?? '#2D3BCC'), [r2,g2,b2] = hexToRgb(p.color2 ?? '#FAF6EE');
  for (let i = 0; i < d.data.length; i += 4) {
    const t = lum(d.data[i],d.data[i+1],d.data[i+2]) / 255;
    d.data[i] = r1+(r2-r1)*t; d.data[i+1] = g1+(g2-g1)*t; d.data[i+2] = b1+(b2-b1)*t;
  }
  ctx.putImageData(d, 0, 0);
}

function applyOverprint(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
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

function applyThreshold(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
  const d = sc.getImageData(0, 0, w, h), thr = p.threshold ?? 128;
  const [r1,g1,b1] = hexToRgb(p.color1 ?? '#2D3BCC'), [r2,g2,b2] = hexToRgb(p.color2 ?? '#F2EDE4');
  for (let i = 0; i < d.data.length; i += 4) {
    const below = lum(d.data[i],d.data[i+1],d.data[i+2]) < thr;
    d.data[i] = below?r1:r2; d.data[i+1] = below?g1:g2; d.data[i+2] = below?b1:b2; d.data[i+3] = 255;
  }
  ctx.putImageData(d, 0, 0);
}

function applyGradientMap(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
  const preset = GRADIENT_MAP_PRESETS[p.gradientPreset ?? 0];
  const lut = buildGradientLut(preset.stops);
  const d = sc.getImageData(0, 0, w, h);
  for (let i = 0; i < d.data.length; i += 4) {
    const l = Math.min(255, lum(d.data[i],d.data[i+1],d.data[i+2])|0);
    d.data[i] = lut[l*4]; d.data[i+1] = lut[l*4+1]; d.data[i+2] = lut[l*4+2];
  }
  ctx.putImageData(d, 0, 0);
}

function applyPixel(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
  const size = p.pixelSize ?? 12, d = sc.getImageData(0, 0, w, h);
  ctx.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += size) for (let x = 0; x < w; x += size) {
    const i = (y*w+x)*4;
    ctx.fillStyle = `rgba(${d.data[i]},${d.data[i+1]},${d.data[i+2]},${d.data[i+3]/255})`;
    ctx.fillRect(x, y, size, size);
  }
}

function applyBitmap(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
  const size = p.pixelSize ?? 4, c1 = p.color1 ?? '#1A1A2E', c2 = p.color2 ?? '#F2EDE4', thr = p.threshold ?? 128;
  ctx.fillStyle = c2; ctx.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += size) for (let x = 0; x < w; x += size) {
    const d = sc.getImageData(x+size/2|0, y+size/2|0, 1, 1).data;
    if (lum(d[0],d[1],d[2]) < thr) { ctx.fillStyle = c1; ctx.fillRect(x, y, size, size); }
  }
}

function applyAscii(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
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
function applyDither(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
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

function applyGlass(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
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

function applyNeon(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
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

function applyStamp(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
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

function applyChromatic(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
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

// ── Risograph print simulation ────────────────────────────────────────────────
// 2-color halftone misregistration mimics real risograph machine aesthetics.
function applyRisograph(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
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

// ── VHS tape artifact ─────────────────────────────────────────────────────────
// RGB channel shift + horizontal scan wobble + luminance noise
function applyVHS(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
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

// ── Film cross-processing ─────────────────────────────────────────────────────
function applyCrossProcess(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, _p: EffectParams) {
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

// ── Bleach bypass ─────────────────────────────────────────────────────────────
function applyBleachBypass(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
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

// ── Foundation effects — exposure, contrast, brightness, saturation, hsl, posterize ──

function applyExposure(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
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

function applyContrast(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
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

function applyBrightness(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
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

function applySaturation(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
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

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
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
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
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

function applyHslShift(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
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

function applyPosterize(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
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

function applySharpen(ctx: CanvasRenderingContext2D, sc: HTMLCanvasElement, w: number, h: number, p: EffectParams) {
  const amount = (p.sharpenAmount ?? 50) / 100;
  if (amount <= 0) { ctx.drawImage(sc, 0, 0, w, h); return; }
  const blurC = document.createElement('canvas');
  blurC.width = w; blurC.height = h;
  const bctx = blurC.getContext('2d', { willReadFrequently: true })!;
  bctx.filter = 'blur(1.5px)';
  bctx.drawImage(sc, 0, 0, w, h);

  const blur = bctx.getImageData(0, 0, w, h);
  const orig = sc.getContext('2d', { willReadFrequently: true })!.getImageData(0, 0, w, h);
  const out = ctx.createImageData(w, h);
  const o = orig.data, b = blur.data, x = out.data;
  for (let i = 0; i < o.length; i += 4) {
    x[i]   = Math.max(0, Math.min(255, o[i]   + (o[i]   - b[i])   * amount * 2));
    x[i+1] = Math.max(0, Math.min(255, o[i+1] + (o[i+1] - b[i+1]) * amount * 2));
    x[i+2] = Math.max(0, Math.min(255, o[i+2] + (o[i+2] - b[i+2]) * amount * 2));
    x[i+3] = o[i+3];
  }
  ctx.putImageData(out, 0, 0);
}

function applyBlurEffect(ctx: CanvasRenderingContext2D, sc: HTMLCanvasElement, w: number, h: number, p: EffectParams) {
  const radius = p.blurRadius ?? 6;
  ctx.filter = `blur(${radius}px)`;
  ctx.drawImage(sc, 0, 0, w, h);
  ctx.filter = 'none';
}

function applyMotionBlur(ctx: CanvasRenderingContext2D, sc: HTMLCanvasElement, w: number, h: number, p: EffectParams) {
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

function applyRadialBlur(ctx: CanvasRenderingContext2D, sc: HTMLCanvasElement, w: number, h: number, p: EffectParams) {
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

function applyFieldBlur(ctx: CanvasRenderingContext2D, sc: HTMLCanvasElement, w: number, h: number, p: EffectParams) {
  const radius = Math.max(2, p.blurRadius ?? 18);
  ctx.filter = `blur(${radius * 0.6}px)`;
  ctx.drawImage(sc, 0, 0, w, h);
  ctx.filter = `blur(${radius * 0.4}px)`;
  ctx.drawImage(ctx.canvas, 0, 0);
  ctx.filter = 'none';
}

function applyVignette(ctx: CanvasRenderingContext2D, sc: HTMLCanvasElement, w: number, h: number, p: EffectParams) {
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

// ── Polaroid frame ────────────────────────────────────────────────────────────
function applyPolaroid(ctx: CanvasRenderingContext2D, sc: HTMLCanvasElement, w: number, h: number, p: EffectParams) {
  const style  = p.polaroidStyle ?? 0;
  const bSide  = Math.round(w * 0.072);
  const bTop   = Math.round(h * 0.072);
  const bBot   = Math.round(h * 0.26);
  const photoW = w - bSide * 2;
  const photoH = h - bTop - bBot;
  const fill   = style === 2 ? '#1A1818' : style === 1 ? '#F2EACC' : '#F8F8F2';

  ctx.fillStyle = fill;
  ctx.fillRect(0, 0, w, h);

  ctx.shadowColor = 'rgba(0,0,0,0.22)'; ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 3; ctx.shadowOffsetY = 4;
  ctx.fillRect(bSide, bTop, photoW, photoH);
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;

  ctx.drawImage(sc, bSide, bTop, photoW, photoH);

  if (style === 1) {
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = 'rgba(240,210,140,0.12)';
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
  }

  const label = p.polaroidLabel ?? '';
  if (label) {
    const textColor = style === 2 ? '#D0C0A0' : style === 1 ? '#5A4020' : '#3A3028';
    const fontSize  = Math.max(12, Math.round(bBot * 0.28));
    ctx.fillStyle = textColor;
    ctx.font = `italic ${fontSize}px Georgia, "Times New Roman", serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(label, w / 2, h - bBot * 0.46);
  }
}

// ── VHS frame / tape decoration ───────────────────────────────────────────────
function applyVhsFrame(ctx: CanvasRenderingContext2D, sc: HTMLCanvasElement, w: number, h: number, _p: EffectParams) {
  ctx.drawImage(sc, 0, 0, w, h);

  for (let y = 0; y < h; y += 3) {
    ctx.fillStyle = 'rgba(0,0,0,0.09)';
    ctx.fillRect(0, y, w, 1);
  }

  const barH = Math.round(h * 0.11);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, barH);
  ctx.fillRect(0, h - barH, w, barH);

  const dotR = Math.round(barH * 0.18);
  const dotX = Math.round(w * 0.05);
  const dotY = Math.round(barH * 0.5);
  ctx.fillStyle = '#FF2020';
  ctx.beginPath(); ctx.arc(dotX, dotY, dotR, 0, Math.PI * 2); ctx.fill();

  const fs = Math.round(barH * 0.38);
  ctx.fillStyle = '#FFF'; ctx.font = `bold ${fs}px monospace`;
  ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  ctx.fillText('● REC', Math.round(w * 0.09), dotY);
  ctx.textAlign = 'right'; ctx.fillStyle = '#FFFF80';
  ctx.fillText('CH.02  00:00:00', w - Math.round(w * 0.03), dotY);

  const bY = h - Math.round(barH * 0.5);
  ctx.textAlign = 'left'; ctx.fillStyle = '#FFFF80';
  ctx.fillText('SP  T-120', Math.round(w * 0.04), bY);
  ctx.textAlign = 'right';
  ctx.fillText('0001', w - Math.round(w * 0.04), bY);
}

// ── Text mask (lorem ipsum colored by image pixels) ───────────────────────────
const LOREM_TEXT = ('Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor ' +
  'incididunt ut labore et dolore magna aliqua Ut enim ad minim veniam quis nostrud exercitation ' +
  'ullamco laboris nisi ut aliquip ex ea commodo consequat Duis aute irure dolor in reprehenderit ' +
  'in voluptate velit esse cillum dolore eu fugiat nulla pariatur Excepteur sint occaecat cupidatat ' +
  'non proident sunt in culpa qui officia deserunt mollit anim id est laborum ').repeat(14);

function applyTextMask(ctx: CanvasRenderingContext2D, sc: HTMLCanvasElement, w: number, h: number, p: EffectParams) {
  const fontSize = Math.max(6, Math.min(24, p.textMaskFontSize ?? 12));
  const lineH    = Math.ceil(fontSize * 1.18);
  const charW    = fontSize * 0.615;

  const maskC = document.createElement('canvas'); maskC.width = w; maskC.height = h;
  const mc = maskC.getContext('2d', { willReadFrequently: true })!;
  mc.fillStyle = '#000'; mc.fillRect(0, 0, w, h);
  mc.fillStyle = '#fff';
  mc.font = `bold ${fontSize}px "Courier New", Courier, monospace`;
  mc.textBaseline = 'top';
  let idx = 0;
  for (let y = 0; y < h; y += lineH) {
    for (let x = 0; x < w; x += charW) {
      mc.fillText(LOREM_TEXT[idx % LOREM_TEXT.length], x, y); idx++;
    }
  }

  const compC = document.createElement('canvas'); compC.width = w; compC.height = h;
  const cc = compC.getContext('2d', { willReadFrequently: true })!;
  cc.drawImage(sc, 0, 0, w, h);
  cc.globalCompositeOperation = 'destination-in';
  cc.drawImage(maskC, 0, 0);

  ctx.fillStyle = '#F5F1E8'; ctx.fillRect(0, 0, w, h);
  ctx.drawImage(compC, 0, 0);
}

// ── Texture overlay (grain / scanner / crumple / old film) ────────────────────
function applyTextureOverlay(ctx: CanvasRenderingContext2D, sc: HTMLCanvasElement, w: number, h: number, p: EffectParams) {
  ctx.drawImage(sc, 0, 0, w, h);

  const preset  = p.texturePreset  ?? 0;
  const opacity = (p.textureOpacity ?? 35) / 100;

  const texC = document.createElement('canvas'); texC.width = w; texC.height = h;
  const tc = texC.getContext('2d', { willReadFrequently: true })!;

  if (preset === 0) {
    const imgData = tc.createImageData(w, h); const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = Math.random() * 255;
      d[i] = d[i+1] = d[i+2] = n; d[i+3] = Math.floor(Math.random() * 140);
    }
    tc.putImageData(imgData, 0, 0);
  } else if (preset === 1) {
    for (let y = 0; y < h; y += 2) {
      tc.fillStyle = y % 4 === 0 ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.06)';
      tc.fillRect(0, y, w, 1);
    }
  } else if (preset === 2) {
    for (let i = 0; i < 800; i++) {
      const x = Math.random() * w, y = Math.random() * h;
      const len = 8 + Math.random() * 50;
      const angle = Math.random() * Math.PI;
      const a = 0.03 + Math.random() * 0.09;
      tc.strokeStyle = Math.random() > 0.5 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a})`;
      tc.lineWidth = 0.4 + Math.random() * 1.8;
      tc.beginPath(); tc.moveTo(x, y);
      tc.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len); tc.stroke();
    }
  } else {
    const imgData = tc.createImageData(w, h); const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = Math.random() * 200;
      d[i] = d[i+1] = d[i+2] = n; d[i+3] = Math.floor(Math.random() * 90);
    }
    tc.putImageData(imgData, 0, 0);
    for (let i = 0; i < 120; i++) {
      tc.fillStyle = `rgba(255,255,255,${0.3 + Math.random() * 0.5})`;
      tc.beginPath(); tc.arc(Math.random() * w, Math.random() * h, 0.5 + Math.random() * 2, 0, Math.PI * 2); tc.fill();
    }
  }

  ctx.globalAlpha = opacity;
  ctx.globalCompositeOperation = 'overlay';
  ctx.drawImage(texC, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
}

// ── public API ───────────────────────────────────────────────────────────────

export function applyEffectLayer(
  src: HTMLCanvasElement | HTMLImageElement,
  layer: EffectLayer,
  w: number, h: number
): HTMLCanvasElement {
  const [out, ctx] = tmp(w, h);
  const [sc, sctx] = tmp(w, h, src);

  switch (layer.type) {
    case 'none':           ctx.drawImage(src as CanvasImageSource, 0, 0, w, h); break;
    case 'exposure':       applyExposure(ctx, sctx, w, h, layer.params); break;
    case 'contrast':       applyContrast(ctx, sctx, w, h, layer.params); break;
    case 'brightness':     applyBrightness(ctx, sctx, w, h, layer.params); break;
    case 'saturation':     applySaturation(ctx, sctx, w, h, layer.params); break;
    case 'hsl-shift':      applyHslShift(ctx, sctx, w, h, layer.params); break;
    case 'posterize':      applyPosterize(ctx, sctx, w, h, layer.params); break;
    case 'sharpen':        applySharpen(ctx, sc, w, h, layer.params); break;
    case 'halftone-dot':   applyHalftoneDot(ctx, sctx, w, h, layer.params); break;
    case 'halftone-circle':applyHalftoneCircle(ctx, sctx, w, h, layer.params); break;
    case 'halftone-line':  applyHalftoneLine(ctx, sctx, w, h, layer.params); break;
    case 'duotone':        applyDuotone(ctx, sctx, w, h, layer.params); break;
    case 'overprint':      applyOverprint(ctx, sctx, w, h, layer.params); break;
    case 'threshold':      applyThreshold(ctx, sctx, w, h, layer.params); break;
    case 'gradient-map':   applyGradientMap(ctx, sctx, w, h, layer.params); break;
    case 'pixel':          applyPixel(ctx, sctx, w, h, layer.params); break;
    case 'bitmap':          applyBitmap(ctx, sctx, w, h, layer.params); break;
    case 'ascii':           applyAscii(ctx, sctx, w, h, layer.params); break;
    case 'dither':           applyDither(ctx, sctx, w, h, layer.params); break;
    case 'glass':            applyGlass(ctx, sctx, w, h, layer.params); break;
    case 'neon':             applyNeon(ctx, sctx, w, h, layer.params); break;
    case 'stamp':            applyStamp(ctx, sctx, w, h, layer.params); break;
    case 'chromatic':        applyChromatic(ctx, sctx, w, h, layer.params); break;
    case 'risograph':        applyRisograph(ctx, sctx, w, h, layer.params); break;
    case 'vhs':               applyVHS(ctx, sctx, w, h, layer.params); break;
    case 'cross-process':     applyCrossProcess(ctx, sctx, w, h, layer.params); break;
    case 'bleach-bypass':     applyBleachBypass(ctx, sctx, w, h, layer.params); break;
    case 'blur':              applyBlurEffect(ctx, sc, w, h, layer.params); break;
    case 'motion-blur':       applyMotionBlur(ctx, sc, w, h, layer.params); break;
    case 'radial-blur':       applyRadialBlur(ctx, sc, w, h, layer.params); break;
    case 'field-blur':        applyFieldBlur(ctx, sc, w, h, layer.params); break;
    case 'vignette':          applyVignette(ctx, sc, w, h, layer.params); break;
    case 'polaroid':          applyPolaroid(ctx, sc, w, h, layer.params); break;
    case 'vhs-frame':         applyVhsFrame(ctx, sc, w, h, layer.params); break;
    case 'text-mask':         applyTextMask(ctx, sc, w, h, layer.params); break;
    case 'texture-overlay':   applyTextureOverlay(ctx, sc, w, h, layer.params); break;
  }

  return out;
}

export function applyGrainOverlay(ctx: CanvasRenderingContext2D, w: number, h: number, amount: number) {
  if (amount <= 0) return;
  const d = ctx.getImageData(0, 0, w, h);
  const scale = amount / 100;
  for (let i = 0; i < d.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 255 * scale;
    d.data[i]   = Math.max(0, Math.min(255, d.data[i]+n));
    d.data[i+1] = Math.max(0, Math.min(255, d.data[i+1]+n));
    d.data[i+2] = Math.max(0, Math.min(255, d.data[i+2]+n));
  }
  ctx.putImageData(d, 0, 0);
}
