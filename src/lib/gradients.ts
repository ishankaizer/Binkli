// Grainy-gradient background generator — produces a canvas that becomes a
// new node's `src`, so it runs through the full effect stack like any photo.
// Ported near-verbatim from binkli-reference/app/lib/gradients.ts.

export type GradientType = 'linear' | 'radial' | 'aurora' | 'blob' | 'mesh' | 'sweep';

export interface GradientConfig {
  type: GradientType;
  stops: string[];
  angle: number;      // 0..360 (linear / sweep)
  grain: number;       // 0..100
  blur: number;        // 0..40 px
  noiseScale: number;  // 1..6
  glow: number;        // 0..100
}

export interface GradientPreset {
  id: string;
  name: string;
  emoji: string;
  swatches: string[];
  config: GradientConfig;
  bg: string;
  ink: string;
}

export const GRADIENT_PRESETS: GradientPreset[] = [
  { id: 'soft-aurora', name: 'Soft Aurora', emoji: '🌌', swatches: ['#C9BFEC', '#B8D9F5', '#FBF6EE'], bg: '#F1ECFB', ink: '#2A1A5A',
    config: { type: 'aurora', stops: ['#C9BFEC', '#B8D9F5', '#FFE9F3', '#FBF6EE'], angle: 135, grain: 40, blur: 18, noiseScale: 2, glow: 30 } },
  { id: 'peach-fog', name: 'Peach Fog', emoji: '🍑', swatches: ['#FFC9A8', '#FFA08A', '#FFE39A'], bg: '#FFF1E5', ink: '#5A2A0A',
    config: { type: 'aurora', stops: ['#FFE39A', '#FFC9A8', '#FFA08A', '#FFE9F3'], angle: 110, grain: 38, blur: 22, noiseScale: 2, glow: 40 } },
  { id: 'dream-mesh', name: 'Dream Mesh', emoji: '☁', swatches: ['#FFB6D9', '#C9BFEC', '#B8D9F5'], bg: '#FFE9F3', ink: '#5A1A3A',
    config: { type: 'mesh', stops: ['#FFB6D9', '#C9BFEC', '#B8D9F5', '#B6E9D4', '#FFE39A'], angle: 90, grain: 32, blur: 16, noiseScale: 2.5, glow: 28 } },
  { id: 'analog-blue', name: 'Analog Blue', emoji: '🌊', swatches: ['#B8D9F5', '#B6E9D4', '#0A2A5A'], bg: '#E8F2FC', ink: '#0A2A5A',
    config: { type: 'radial', stops: ['#B6E9D4', '#B8D9F5', '#0A2A5A'], angle: 0, grain: 45, blur: 8, noiseScale: 1.5, glow: 18 } },
  { id: 'candy-airbrush', name: 'Candy Airbrush', emoji: '🍭', swatches: ['#FFB6D9', '#FFE39A', '#FFC9A8'], bg: '#FFE9F3', ink: '#5A1A3A',
    config: { type: 'blob', stops: ['#FFB6D9', '#FFE39A', '#FFC9A8', '#FFA08A'], angle: 45, grain: 36, blur: 26, noiseScale: 2, glow: 50 } },
  { id: 'chrome-haze', name: 'Chrome Haze', emoji: '🪞', swatches: ['#C9BFEC', '#B8D9F5', '#F0EAD8'], bg: '#F1ECFB', ink: '#2A1A5A',
    config: { type: 'sweep', stops: ['#C9BFEC', '#B8D9F5', '#F0EAD8', '#C9BFEC'], angle: 0, grain: 50, blur: 12, noiseScale: 1.5, glow: 22 } },
  { id: 'mint-vapor', name: 'Mint Vapor', emoji: '🌿', swatches: ['#B6E9D4', '#C9BFEC', '#FFE39A'], bg: '#E8F8F0', ink: '#00533A',
    config: { type: 'aurora', stops: ['#B6E9D4', '#C9BFEC', '#FFE39A', '#FFE9F3'], angle: 60, grain: 34, blur: 20, noiseScale: 2, glow: 35 } },
  { id: 'sunset-strip', name: 'Sunset Strip', emoji: '🌇', swatches: ['#FFA08A', '#FFB6D9', '#FFE39A'], bg: '#FFEDE5', ink: '#5A1A0A',
    config: { type: 'linear', stops: ['#FFE39A', '#FFC9A8', '#FFA08A', '#FFB6D9', '#C9BFEC'], angle: 160, grain: 28, blur: 4, noiseScale: 2, glow: 25 } },
  { id: 'rose-quartz', name: 'Rose Quartz', emoji: '🌸', swatches: ['#FFB6D9', '#FFE9F3', '#FFA08A'], bg: '#FFE9F3', ink: '#5A1A3A',
    config: { type: 'radial', stops: ['#FFE9F3', '#FFB6D9', '#FFA08A'], angle: 0, grain: 36, blur: 12, noiseScale: 2, glow: 38 } },
  { id: 'lavender-fog', name: 'Lavender Fog', emoji: '💜', swatches: ['#C9BFEC', '#FFE9F3', '#F1ECFB'], bg: '#F1ECFB', ink: '#2A1A5A',
    config: { type: 'blob', stops: ['#F1ECFB', '#C9BFEC', '#FFE9F3', '#FFFCF5'], angle: 90, grain: 30, blur: 24, noiseScale: 2.2, glow: 45 } },
  { id: 'sky-mist', name: 'Sky Mist', emoji: '☁', swatches: ['#B8D9F5', '#FFFCF5', '#C9BFEC'], bg: '#E8F2FC', ink: '#0A2A5A',
    config: { type: 'linear', stops: ['#B8D9F5', '#FFFCF5', '#C9BFEC'], angle: 180, grain: 22, blur: 8, noiseScale: 2, glow: 20 } },
  { id: 'ember-glow', name: 'Ember Glow', emoji: '🔥', swatches: ['#FFA08A', '#5A1A0A', '#FFE39A'], bg: '#FFEDE5', ink: '#5A1A0A',
    config: { type: 'radial', stops: ['#FFE39A', '#FFA08A', '#5A1A0A'], angle: 0, grain: 48, blur: 6, noiseScale: 1.5, glow: 30 } },
];

export function renderGradient(config: GradientConfig, w: number, h: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  switch (config.type) {
    case 'linear': paintLinear(ctx, config, w, h); break;
    case 'radial': paintRadial(ctx, config, w, h); break;
    case 'sweep': paintSweep(ctx, config, w, h); break;
    case 'aurora': paintAurora(ctx, config, w, h); break;
    case 'blob': paintBlobs(ctx, config, w, h); break;
    case 'mesh': paintMesh(ctx, config, w, h); break;
  }

  if (config.glow > 0) {
    const blurC = document.createElement('canvas');
    blurC.width = w; blurC.height = h;
    const bctx = blurC.getContext('2d')!;
    bctx.filter = `blur(${Math.round(Math.max(w, h) * 0.08)}px)`;
    bctx.drawImage(canvas, 0, 0);
    bctx.filter = 'none';
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = (config.glow / 100) * 0.55;
    ctx.drawImage(blurC, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }

  if (config.blur > 0) {
    const blurC = document.createElement('canvas');
    blurC.width = w; blurC.height = h;
    const bctx = blurC.getContext('2d')!;
    bctx.filter = `blur(${config.blur * 0.5}px)`;
    bctx.drawImage(canvas, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(blurC, 0, 0);
  }

  if (config.grain > 0) applyGrain(ctx, w, h, config.grain, config.noiseScale);

  return canvas;
}

function paintLinear(ctx: CanvasRenderingContext2D, c: GradientConfig, w: number, h: number) {
  const a = (c.angle * Math.PI) / 180;
  const dx = (Math.cos(a) * w) / 2;
  const dy = (Math.sin(a) * h) / 2;
  const cx = w / 2, cy = h / 2;
  const g = ctx.createLinearGradient(cx - dx, cy - dy, cx + dx, cy + dy);
  c.stops.forEach((s, i) => g.addColorStop(i / (c.stops.length - 1), s));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function paintRadial(ctx: CanvasRenderingContext2D, c: GradientConfig, w: number, h: number) {
  const cx = w / 2, cy = h / 2;
  const r = Math.max(w, h) * 0.7;
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  c.stops.forEach((s, i) => g.addColorStop(i / (c.stops.length - 1), s));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function paintSweep(ctx: CanvasRenderingContext2D, c: GradientConfig, w: number, h: number) {
  paintLinear(ctx, { ...c, type: 'linear' }, w, h);
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = 0.55;
  paintRadial(ctx, { ...c, type: 'radial' }, w, h);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}

function paintAurora(ctx: CanvasRenderingContext2D, c: GradientConfig, w: number, h: number) {
  ctx.fillStyle = c.stops[0];
  ctx.fillRect(0, 0, w, h);
  const blobs = Math.max(3, c.stops.length);
  for (let i = 0; i < blobs; i++) {
    const seed = i * 137.5;
    const cx = w * (0.2 + 0.6 * pseudo(seed));
    const cy = h * (0.15 + 0.7 * pseudo(seed + 1));
    const r = Math.max(w, h) * (0.35 + 0.4 * pseudo(seed + 2));
    const stop = c.stops[(i + 1) % c.stops.length];
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, stop);
    g.addColorStop(1, stop + '00');
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.globalAlpha = 1;
}

function paintBlobs(ctx: CanvasRenderingContext2D, c: GradientConfig, w: number, h: number) {
  ctx.fillStyle = c.stops[0];
  ctx.fillRect(0, 0, w, h);
  for (let i = 1; i < c.stops.length; i++) {
    const t = i / c.stops.length;
    const cx = w * (0.15 + 0.7 * Math.sin(i * 2.1));
    const cy = h * (0.15 + 0.7 * Math.cos(i * 1.7));
    const r = Math.max(w, h) * (0.45 + 0.2 * t);
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, c.stops[i]);
    g.addColorStop(0.7, c.stops[i] + 'AA');
    g.addColorStop(1, c.stops[i] + '00');
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.globalAlpha = 1;
}

function paintMesh(ctx: CanvasRenderingContext2D, c: GradientConfig, w: number, h: number) {
  const grid = 3;
  ctx.fillStyle = c.stops[0];
  ctx.fillRect(0, 0, w, h);
  for (let y = 0; y < grid; y++) {
    for (let x = 0; x < grid; x++) {
      const i = (y * grid + x) % c.stops.length;
      const cx = w * ((x + 0.5) / grid + (pseudo(x * 7 + y) - 0.5) * 0.12);
      const cy = h * ((y + 0.5) / grid + (pseudo(x * 11 + y * 3) - 0.5) * 0.12);
      const r = Math.max(w, h) * 0.45;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, c.stops[i]);
      g.addColorStop(1, c.stops[i] + '00');
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
  }
  ctx.globalAlpha = 1;
}

function pseudo(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function applyGrain(ctx: CanvasRenderingContext2D, w: number, h: number, amount: number, scale: number) {
  const intensity = (amount / 100) * 80;
  const d = ctx.getImageData(0, 0, w, h);
  const px = d.data;
  const step = Math.max(1, Math.round(scale));
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      const n = (Math.random() - 0.5) * intensity;
      for (let dy = 0; dy < step && y + dy < h; dy++) {
        for (let dx = 0; dx < step && x + dx < w; dx++) {
          const i = ((y + dy) * w + (x + dx)) * 4;
          px[i] = Math.max(0, Math.min(255, px[i] + n));
          px[i + 1] = Math.max(0, Math.min(255, px[i + 1] + n));
          px[i + 2] = Math.max(0, Math.min(255, px[i + 2] + n));
        }
      }
    }
  }
  ctx.putImageData(d, 0, 0);
}
