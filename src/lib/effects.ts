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
  | 'polaroid' | 'vhs-frame' | 'text-mask' | 'texture-overlay'
  // added in the second effects pass
  | 'invert' | 'solarize' | 'levels' | 'color-balance' | 'channel-swap'
  | 'find-edges' | 'emboss' | 'oil-paint' | 'crosshatch' | 'comic' | 'crystallize'
  | 'twirl' | 'bulge' | 'wave' | 'kaleidoscope' | 'pixel-sort' | 'slice-glitch'
  | 'bloom' | 'light-leak' | 'thermal'
  | 'cmyk-halftone' | 'dot-matrix' | 'jpeg-crush' | 'scanlines';

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
  textMaskText?: string;     // the words the mask is built from
  texturePreset?: number;    // 0=grain 1=scanner 2=crumple 3=film
  textureOpacity?: number;   // 0..100
  levelsBlack?: number;      // 0..255
  levelsWhite?: number;      // 0..255
  levelsGamma?: number;      // 10..300 (percent, 100 = linear)
  balanceR?: number;         // -100..100
  balanceG?: number;
  balanceB?: number;
  channelMode?: number;      // 0..5 RGB permutation
  edgeInvert?: number;       // 0/1 — dark lines on white vs glow on black
  twirlStrength?: number;    // -100..100
  bulgeStrength?: number;    // -100..100
  waveAmp?: number;          // 0..60
  waveFreq?: number;         // 1..12
  kaleidoSegments?: number;  // 2..16
  sortThreshold?: number;    // 0..255 brightness a run must beat to be sorted
  sortVertical?: number;     // 0/1
  sliceCount?: number;       // 2..40
  sliceOffset?: number;      // 0..100
  bloomThreshold?: number;   // 0..255
  bloomStrength?: number;    // 0..100
  leakColor?: string;
  leakStrength?: number;     // 0..100
  leakCorner?: number;       // 0..3
  crushAmount?: number;      // 0..100
  scanGap?: number;          // 2..12
  scanStrength?: number;     // 0..100
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

/**
 * Word Fill: the photo is only visible through the glyphs of repeated text.
 * `textMaskText` lets the words be the user's own, which is the whole point of
 * the effect — the default lorem is just a starting state.
 */
function applyTextMask(ctx: CanvasRenderingContext2D, sc: HTMLCanvasElement, w: number, h: number, p: EffectParams) {
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

// ── added effects ────────────────────────────────────────────────────────────

function c255(v: number): number { return v < 0 ? 0 : v > 255 ? 255 : v; }

function applyInvert(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number) {
  const d = sc.getImageData(0, 0, w, h);
  for (let i = 0; i < d.data.length; i += 4) {
    d.data[i] = 255 - d.data[i];
    d.data[i+1] = 255 - d.data[i+1];
    d.data[i+2] = 255 - d.data[i+2];
  }
  ctx.putImageData(d, 0, 0);
}

/** Sabattier: tones above the threshold flip, the classic darkroom over-exposure. */
function applySolarize(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
  const t = p.threshold ?? 128;
  const d = sc.getImageData(0, 0, w, h);
  for (let i = 0; i < d.data.length; i += 4) {
    for (let k = 0; k < 3; k++) { const v = d.data[i+k]; d.data[i+k] = v < t ? v : 255 - v; }
  }
  ctx.putImageData(d, 0, 0);
}

function applyLevels(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
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

function applyColorBalance(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
  const rs = (p.balanceR ?? 0) * 1.28, gs = (p.balanceG ?? 0) * 1.28, bs = (p.balanceB ?? 0) * 1.28;
  const d = sc.getImageData(0, 0, w, h);
  for (let i = 0; i < d.data.length; i += 4) {
    d.data[i] = c255(d.data[i] + rs);
    d.data[i+1] = c255(d.data[i+1] + gs);
    d.data[i+2] = c255(d.data[i+2] + bs);
  }
  ctx.putImageData(d, 0, 0);
}

/** RGB channel permutations — cheap, and the backbone of a lot of glitch looks. */
function applyChannelSwap(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
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

function applyFindEdges(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
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

function applyEmboss(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
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
function applyOilPaint(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
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
function applyCrosshatch(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
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
function applyComic(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
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

/** Jittered-grid Voronoi — each pixel takes the colour of its nearest cell seed. */
function applyCrystallize(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
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

function sampleInto(out: ImageData, d: Uint8ClampedArray, w: number, h: number, x: number, y: number, i: number) {
  const sx = Math.round(x), sy = Math.round(y);
  if (sx < 0 || sy < 0 || sx >= w || sy >= h) { out.data[i+3] = 0; return; }
  const j = (sy*w+sx)*4;
  out.data[i] = d[j]; out.data[i+1] = d[j+1]; out.data[i+2] = d[j+2]; out.data[i+3] = d[j+3];
}

function applyTwirl(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
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
function applyBulge(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
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

function applyWave(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
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

function applyKaleidoscope(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
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

/** Pixel sort: sort each row's runs of similar brightness — the glitch-art staple. */
function applyPixelSort(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
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

function applySliceGlitch(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
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

/** Bloom: isolate the highlights, blur them, screen them back over the image. */
function applyBloom(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
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

function applyLightLeak(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
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

const THERMAL_STOPS = ['#000018', '#2C0F63', '#8E1B6B', '#E0432F', '#FF9A00', '#FFE23D', '#FFFFFF'];
function applyThermal(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number) {
  const lut = buildGradientLut(THERMAL_STOPS);
  const d = sc.getImageData(0, 0, w, h);
  for (let i = 0; i < d.data.length; i += 4) {
    const L = Math.round(lum(d.data[i], d.data[i+1], d.data[i+2]));
    d.data[i] = lut[L*4]; d.data[i+1] = lut[L*4+1]; d.data[i+2] = lut[L*4+2];
  }
  ctx.putImageData(d, 0, 0);
}

/** Proper 4-colour print separation: each ink gets its own screen angle. */
function applyCmykHalftone(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
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

function applyDotMatrix(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
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

/** Fake compression: quantise 8x8 blocks toward their own average, DCT-ringing style. */
function applyJpegCrush(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
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

function applyScanlines(ctx: CanvasRenderingContext2D, sc: CanvasRenderingContext2D, w: number, h: number, p: EffectParams) {
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
    case 'invert':            applyInvert(ctx, sctx, w, h); break;
    case 'solarize':          applySolarize(ctx, sctx, w, h, layer.params); break;
    case 'levels':            applyLevels(ctx, sctx, w, h, layer.params); break;
    case 'color-balance':     applyColorBalance(ctx, sctx, w, h, layer.params); break;
    case 'channel-swap':      applyChannelSwap(ctx, sctx, w, h, layer.params); break;
    case 'find-edges':        applyFindEdges(ctx, sctx, w, h, layer.params); break;
    case 'emboss':            applyEmboss(ctx, sctx, w, h, layer.params); break;
    case 'oil-paint':         applyOilPaint(ctx, sctx, w, h, layer.params); break;
    case 'crosshatch':        applyCrosshatch(ctx, sctx, w, h, layer.params); break;
    case 'comic':             applyComic(ctx, sctx, w, h, layer.params); break;
    case 'crystallize':       applyCrystallize(ctx, sctx, w, h, layer.params); break;
    case 'twirl':             applyTwirl(ctx, sctx, w, h, layer.params); break;
    case 'bulge':             applyBulge(ctx, sctx, w, h, layer.params); break;
    case 'wave':              applyWave(ctx, sctx, w, h, layer.params); break;
    case 'kaleidoscope':      applyKaleidoscope(ctx, sctx, w, h, layer.params); break;
    case 'pixel-sort':        applyPixelSort(ctx, sctx, w, h, layer.params); break;
    case 'slice-glitch':      applySliceGlitch(ctx, sctx, w, h, layer.params); break;
    case 'bloom':             applyBloom(ctx, sctx, w, h, layer.params); break;
    case 'light-leak':        applyLightLeak(ctx, sctx, w, h, layer.params); break;
    case 'thermal':           applyThermal(ctx, sctx, w, h); break;
    case 'cmyk-halftone':     applyCmykHalftone(ctx, sctx, w, h, layer.params); break;
    case 'dot-matrix':        applyDotMatrix(ctx, sctx, w, h, layer.params); break;
    case 'jpeg-crush':        applyJpegCrush(ctx, sctx, w, h, layer.params); break;
    case 'scanlines':         applyScanlines(ctx, sctx, w, h, layer.params); break;
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
