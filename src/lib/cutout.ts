// Cutout masking and background removal. Ported near-verbatim from
// binkli-reference/app/lib/cutout.ts, which was already framework-agnostic
// canvas code — see README Status #10.

export type CutoutType = 'none' | 'torn' | 'rough' | 'clean' | 'circle';

export interface CutoutOptions {
  type: CutoutType;
  paperColor: string;
  removeBackground: boolean;
  bgThreshold: number; // 0-100
}

export const DEFAULT_CUTOUT: CutoutOptions = {
  type: 'none',
  paperColor: '#F2EDE4',
  removeBackground: false,
  bgThreshold: 30,
};

// Smooth noise using sum-of-sines for a natural torn-paper look.
function noise(t: number, freq: number, roughness: number): number {
  return (
    Math.sin(t * freq * 2.1 + 0.4) * 0.40 +
    Math.sin(t * freq * 5.3 + 1.1) * 0.25 +
    Math.sin(t * freq * 11.7 + 2.3) * 0.20 +
    Math.sin(t * freq * 23.9 + 0.8) * 0.15
  ) * roughness;
}

function buildTornPath(ctx: CanvasRenderingContext2D, w: number, h: number, roughness: number) {
  const steps = 120;
  const pad = 4;
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = t * w;
    const y = pad + noise(t, 3, roughness * 18);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = w - pad - noise(t + 0.25, 3.7, roughness * 18);
    const y = t * h;
    ctx.lineTo(x, y);
  }
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = (1 - t) * w;
    const y = h - pad - noise(t + 0.5, 2.9, roughness * 18);
    ctx.lineTo(x, y);
  }
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = pad + noise(t + 0.75, 4.1, roughness * 18);
    const y = (1 - t) * h;
    ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function buildRoughPath(ctx: CanvasRenderingContext2D, w: number, h: number) {
  buildTornPath(ctx, w, h, 0.4);
}

function buildCleanPath(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const r = 6;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(w - r, 0);
  ctx.quadraticCurveTo(w, 0, w, r);
  ctx.lineTo(w, h - r);
  ctx.quadraticCurveTo(w, h, w - r, h);
  ctx.lineTo(r, h);
  ctx.quadraticCurveTo(0, h, 0, h - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
}

function buildCirclePath(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.beginPath();
  ctx.ellipse(w / 2, h / 2, w / 2 - 2, h / 2 - 2, 0, 0, Math.PI * 2);
  ctx.closePath();
}

function buildPath(ctx: CanvasRenderingContext2D, type: CutoutType, w: number, h: number) {
  switch (type) {
    case 'torn': buildTornPath(ctx, w, h, 1.0); break;
    case 'rough': buildRoughPath(ctx, w, h); break;
    case 'clean': buildCleanPath(ctx, w, h); break;
    case 'circle': buildCirclePath(ctx, w, h); break;
  }
}

export function applyCutoutMask(canvas: HTMLCanvasElement, options: CutoutOptions): void {
  if (options.type === 'none') return;

  const w = canvas.width, h = canvas.height;
  const ctx = canvas.getContext('2d')!;
  const snap = ctx.getImageData(0, 0, w, h);

  const out = document.createElement('canvas');
  out.width = w; out.height = h;
  const oc = out.getContext('2d')!;

  oc.save();
  buildPath(oc, options.type, w, h);
  oc.clip();
  oc.fillStyle = options.paperColor;
  oc.fillRect(0, 0, w, h);

  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = w; srcCanvas.height = h;
  srcCanvas.getContext('2d')!.putImageData(snap, 0, 0);
  oc.drawImage(srcCanvas, 0, 0);
  oc.restore();

  if (options.type === 'torn' || options.type === 'rough') {
    oc.save();
    buildPath(oc, options.type, w, h);
    oc.strokeStyle = 'rgba(0,0,0,0.10)';
    oc.lineWidth = 2;
    oc.stroke();
    oc.restore();
  }

  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(out, 0, 0);
}

// ── Background removal ──────────────────────────────────────────────────────
//
// K-means clusters the image perimeter into up to 4 dominant background
// colours (handles two-tone/gradient/patterned backgrounds, not just a flat
// one), then every pixel gets a soft alpha based on its distance to the
// nearest cluster, feathered once to avoid a jagged paper-cut edge. Pure JS,
// no model — real remove.bg-quality needs a bundled ONNX model (~80MB),
// which isn't worth the install size for this.

const KMEANS_K = 4;
const KMEANS_ITERS = 6;

function rgbToLabLite(r: number, g: number, b: number): [number, number, number] {
  return [0.299 * r + 0.587 * g + 0.114 * b, r - g, g - b];
}

function kmeans(samples: number[][], k: number, iters: number): number[][] {
  const centroids: number[][] = [];
  for (let i = 0; i < k; i++) {
    centroids.push([...samples[Math.floor((i * samples.length) / k)]]);
  }
  for (let it = 0; it < iters; it++) {
    const sums: number[][] = Array.from({ length: k }, () => [0, 0, 0]);
    const counts = new Array(k).fill(0);
    for (const s of samples) {
      let bestK = 0, bestD = Infinity;
      for (let i = 0; i < k; i++) {
        const c = centroids[i];
        const d0 = s[0] - c[0], d1 = s[1] - c[1], d2 = s[2] - c[2];
        const d = d0 * d0 + d1 * d1 + d2 * d2;
        if (d < bestD) { bestD = d; bestK = i; }
      }
      sums[bestK][0] += s[0]; sums[bestK][1] += s[1]; sums[bestK][2] += s[2];
      counts[bestK]++;
    }
    for (let i = 0; i < k; i++) {
      if (counts[i] > 0) {
        centroids[i] = [sums[i][0] / counts[i], sums[i][1] / counts[i], sums[i][2] / counts[i]];
      }
    }
  }
  return centroids;
}

export function removeBackground(canvas: HTMLCanvasElement, threshold: number): void {
  const w = canvas.width, h = canvas.height;
  const ctx = canvas.getContext('2d')!;
  const d = ctx.getImageData(0, 0, w, h);
  const px = d.data;

  const samples: number[][] = [];
  const samplesPerEdge = 50;
  const inset = 2;
  for (let i = 0; i < samplesPerEdge; i++) {
    const t = i / (samplesPerEdge - 1);
    const x = Math.round(t * (w - 1));
    const y = Math.round(t * (h - 1));
    const idxs = [
      (inset * w + x) * 4,
      ((h - 1 - inset) * w + x) * 4,
      (y * w + inset) * 4,
      (y * w + (w - 1 - inset)) * 4,
    ];
    for (const i2 of idxs) samples.push(rgbToLabLite(px[i2], px[i2 + 1], px[i2 + 2]));
  }

  const clusters = kmeans(samples, KMEANS_K, KMEANS_ITERS);

  const hardT = threshold * threshold;
  const softT = (threshold * 1.6) * (threshold * 1.6);
  const alphas = new Uint8ClampedArray(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const lab = rgbToLabLite(px[i], px[i + 1], px[i + 2]);
      let bestD = Infinity;
      for (const c of clusters) {
        const d0 = lab[0] - c[0], d1 = lab[1] - c[1], d2 = lab[2] - c[2];
        const d = d0 * d0 + d1 * d1 + d2 * d2;
        if (d < bestD) bestD = d;
      }
      let a: number;
      if (bestD <= hardT) a = 0;
      else if (bestD >= softT) a = 255;
      else a = Math.round(((bestD - hardT) / (softT - hardT)) * 255);
      alphas[y * w + x] = a;
    }
  }

  const feathered = new Uint8ClampedArray(alphas);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x;
      const center = alphas[idx];
      if (center === 0 || center === 255) {
        let differs = false;
        for (let dy = -1; dy <= 1 && !differs; dy++)
          for (let dx = -1; dx <= 1 && !differs; dx++)
            if (alphas[(y + dy) * w + x + dx] !== center) differs = true;
        if (!differs) continue;
      }
      let sum = 0;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++)
          sum += alphas[(y + dy) * w + x + dx];
      feathered[idx] = Math.round(sum / 9);
    }
  }

  for (let i = 0, j = 0; i < px.length; i += 4, j++) {
    px[i + 3] = Math.min(px[i + 3], feathered[j]);
  }
  ctx.putImageData(d, 0, 0);
}
