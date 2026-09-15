// Dimension group: 3D extrude, bubble, letterpress, chrome, varsity.
// Mirrors TEXT_EFFECT_GROUPS's 'Dimension' entries in types.ts.

import type { TextConfig } from './types';
import { eachLine, shade, tint, type Layout } from './helpers';

export function renderExtrude(ctx: CanvasRenderingContext2D, _canvas: HTMLCanvasElement, cfg: TextConfig, l: Layout, s: number) {
  const depth = Math.max(2, Math.round(cfg.size * (0.04 + s * 0.34)));
  for (let d = depth; d > 0; d--) {
    const t = d / depth;
    ctx.fillStyle = shade(cfg.color2, -0.35 * (1 - t));
    eachLine(l, (line, x, y) => ctx.fillText(line, x + d * 0.72, y + d));
  }
  ctx.fillStyle = cfg.color;
  eachLine(l, (line, x, y) => ctx.fillText(line, x, y));
  ctx.strokeStyle = shade(cfg.color, -0.5);
  ctx.lineWidth = Math.max(1, cfg.size * 0.02);
  eachLine(l, (line, x, y) => ctx.strokeText(line, x, y));
}

export function renderLetterpress(ctx: CanvasRenderingContext2D, _canvas: HTMLCanvasElement, cfg: TextConfig, l: Layout, s: number) {
  const off = Math.max(1, cfg.size * (0.01 + s * 0.035));
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  eachLine(l, (line, x, y) => ctx.fillText(line, x, y + off));
  ctx.fillStyle = shade(cfg.color, -0.25);
  eachLine(l, (line, x, y) => ctx.fillText(line, x, y - off * 0.6));
  ctx.fillStyle = cfg.color;
  eachLine(l, (line, x, y) => ctx.fillText(line, x, y));
}

/**
 * Inflate the silhouette with a fat round stroke, then light it from above so
 * it reads as a puffed-up balloon letter. The inflation is deliberately
 * modest — past about a sixth of the cap height the counters close up and
 * the word turns into one unreadable blob.
 */
export function renderBubble(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, cfg: TextConfig, l: Layout, s: number) {
  const fat = cfg.size * (0.03 + s * 0.14);
  ctx.strokeStyle = shade(cfg.color, -0.5);
  ctx.lineWidth = fat + Math.max(2, cfg.size * 0.045);
  eachLine(l, (line, x, y) => ctx.strokeText(line, x, y));
  ctx.strokeStyle = cfg.color;
  ctx.lineWidth = fat;
  eachLine(l, (line, x, y) => ctx.strokeText(line, x, y));
  const g = ctx.createLinearGradient(0, l.startY - cfg.size * 0.75, 0, l.startY + cfg.size * 0.55);
  g.addColorStop(0, tint(cfg.color, 0.72));
  g.addColorStop(0.55, cfg.color);
  g.addColorStop(1, shade(cfg.color, -0.22));
  ctx.fillStyle = g;
  eachLine(l, (line, x, y) => ctx.fillText(line, x, y));
  // Highlight, clipped to the letterforms so it can only land on the type.
  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';
  const hg = ctx.createLinearGradient(0, l.startY - cfg.size * 0.62, 0, l.startY - cfg.size * 0.05);
  hg.addColorStop(0, 'rgba(255,255,255,0.72)');
  hg.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = hg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
}

export function renderChrome(ctx: CanvasRenderingContext2D, _canvas: HTMLCanvasElement, cfg: TextConfig, l: Layout, s: number) {
  const g = ctx.createLinearGradient(0, l.startY - cfg.size * 0.7, 0, l.startY + cfg.size * 0.7);
  g.addColorStop(0.00, '#FFFFFF');
  g.addColorStop(0.28, '#9FB4C7');
  g.addColorStop(0.46, '#2B3A4A');
  g.addColorStop(0.54, '#6E88A0');
  g.addColorStop(0.72, '#FFFFFF');
  g.addColorStop(1.00, tint(cfg.color2, 0.25 + s * 0.4));
  ctx.fillStyle = g;
  eachLine(l, (line, x, y) => ctx.fillText(line, x, y));
  ctx.strokeStyle = '#14121F';
  ctx.lineWidth = Math.max(1, cfg.size * 0.022);
  eachLine(l, (line, x, y) => ctx.strokeText(line, x, y));
}

export function renderVarsity(ctx: CanvasRenderingContext2D, _canvas: HTMLCanvasElement, cfg: TextConfig, l: Layout, s: number) {
  const step = cfg.size * (0.03 + s * 0.06);
  ctx.strokeStyle = cfg.color2;
  ctx.lineWidth = step * 4;
  eachLine(l, (line, x, y) => ctx.strokeText(line, x, y));
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = step * 2.4;
  eachLine(l, (line, x, y) => ctx.strokeText(line, x, y));
  ctx.fillStyle = cfg.color;
  eachLine(l, (line, x, y) => ctx.fillText(line, x, y));
}
