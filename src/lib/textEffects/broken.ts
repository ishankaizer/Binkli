// Broken group: chromatic split, glitch, halftone, ransom note. Mirrors
// TEXT_EFFECT_GROUPS's 'Broken' entries in types.ts.

import type { TextConfig } from './types';
import { eachLine, prep, scratch, type Layout } from './helpers';

export function renderChromatic(ctx: CanvasRenderingContext2D, _canvas: HTMLCanvasElement, cfg: TextConfig, l: Layout, s: number) {
  const off = cfg.size * (0.02 + s * 0.16);
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = '#FF0033';
  eachLine(l, (line, x, y) => ctx.fillText(line, x - off, y));
  ctx.fillStyle = '#00E5FF';
  eachLine(l, (line, x, y) => ctx.fillText(line, x + off, y));
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = cfg.color;
  ctx.globalAlpha = 0.85;
  eachLine(l, (line, x, y) => ctx.fillText(line, x, y));
  ctx.globalAlpha = 1;
}

export function renderGlitch(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, cfg: TextConfig, l: Layout, s: number) {
  const [base, bctx] = scratch(canvas.width, canvas.height);
  prep(bctx, cfg);
  bctx.fillStyle = cfg.color;
  eachLine(l, (line, x, y) => bctx.fillText(line, x, y));
  const shift = cfg.size * (0.04 + s * 0.3);
  ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(base, 0, 0);
  const bands = 9;
  for (let i = 0; i < bands; i++) {
    const y = Math.round((i / bands) * canvas.height);
    const bh = Math.ceil(canvas.height / bands);
    const dx = Math.round(Math.sin(i * 51.7) * shift);
    ctx.clearRect(0, y, canvas.width, bh);
    ctx.drawImage(base, 0, y, canvas.width, bh, dx, y, canvas.width, bh);
  }
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = 0.6;
  ctx.drawImage(base, -shift * 0.5, 0);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
}

export function renderHalftone(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, cfg: TextConfig, l: Layout, s: number) {
  const [, bctx] = scratch(canvas.width, canvas.height);
  prep(bctx, cfg);
  bctx.fillStyle = '#000000';
  eachLine(l, (line, x, y) => bctx.fillText(line, x, y));
  const data = bctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const cell = Math.max(3, Math.round(3 + s * 14));
  ctx.fillStyle = cfg.color;
  for (let y = cell / 2; y < canvas.height; y += cell) {
    for (let x = cell / 2; x < canvas.width; x += cell) {
      const i = ((Math.round(y) * canvas.width) + Math.round(x)) * 4;
      const a = data[i + 3] / 255;
      if (a < 0.05) continue;
      ctx.beginPath();
      ctx.arc(x, y, (cell / 2) * 0.95 * a, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export function renderRansom(ctx: CanvasRenderingContext2D, _canvas: HTMLCanvasElement, cfg: TextConfig, l: Layout, s: number) {
  const chaos = s;
  eachLine(l, (line, _x, y) => {
    const chars = [...line];
    const widths = chars.map((c) => ctx.measureText(c).width);
    const totalW = widths.reduce((a, b) => a + b, 0);
    let cx = l.anchorX - (cfg.align === 'center' ? totalW / 2 : cfg.align === 'right' ? totalW : 0);
    chars.forEach((c, i) => {
      const wCh = widths[i];
      if (c.trim()) {
        const rot = (Math.sin(i * 37.1 + y) * 0.22) * chaos;
        ctx.save();
        ctx.translate(cx + wCh / 2, y);
        ctx.rotate(rot);
        ctx.textAlign = 'center';
        const alt = (i + Math.round(y)) % 3;
        ctx.fillStyle = alt === 0 ? cfg.color2 : alt === 1 ? '#FFFFFF' : '#FFD600';
        const boxW = wCh * 1.18, boxH = cfg.size * 1.08;
        ctx.fillRect(-boxW / 2, -boxH / 2, boxW, boxH);
        ctx.fillStyle = alt === 1 ? cfg.color : '#14121F';
        ctx.fillText(c, 0, 0);
        ctx.restore();
      }
      cx += wCh;
    });
  });
  ctx.textAlign = cfg.align;
}
