// Light group: neon glow, linear gradient, rainbow. Mirrors
// TEXT_EFFECT_GROUPS's 'Light' entries in types.ts.

import type { TextConfig } from './types';
import { eachLine, type Layout } from './helpers';

export function renderNeon(ctx: CanvasRenderingContext2D, _canvas: HTMLCanvasElement, cfg: TextConfig, l: Layout, s: number) {
  const glow = 6 + s * 44;
  ctx.save();
  ctx.shadowColor = cfg.color2;
  ctx.strokeStyle = cfg.color2;
  ctx.lineWidth = Math.max(2, cfg.size * 0.05);
  for (let pass = 0; pass < 3; pass++) {
    ctx.shadowBlur = glow * (pass + 1) * 0.5;
    eachLine(l, (line, x, y) => ctx.strokeText(line, x, y));
  }
  ctx.shadowBlur = glow * 0.4;
  ctx.fillStyle = '#FFFFFF';
  eachLine(l, (line, x, y) => ctx.fillText(line, x, y));
  ctx.restore();
}

export function renderGradient(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, cfg: TextConfig, l: Layout, s: number) {
  const angle = s * Math.PI;
  const dx = Math.cos(angle) * canvas.width, dy = Math.sin(angle) * canvas.height;
  const g = ctx.createLinearGradient((canvas.width - dx) / 2, (canvas.height - dy) / 2, (canvas.width + dx) / 2, (canvas.height + dy) / 2);
  g.addColorStop(0, cfg.color);
  g.addColorStop(1, cfg.color2);
  ctx.fillStyle = g;
  eachLine(l, (line, x, y) => ctx.fillText(line, x, y));
}

export function renderRainbow(ctx: CanvasRenderingContext2D, _canvas: HTMLCanvasElement, cfg: TextConfig, l: Layout, s: number) {
  const g = ctx.createLinearGradient(0, l.startY - cfg.size, 0, l.startY + l.lines.length * l.lineHeight);
  const bands = ['#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#00AEEF', '#5856D6', '#E83FBF'];
  bands.forEach((c, i) => g.addColorStop(Math.min(1, (i / (bands.length - 1)) * (0.4 + s)), c));
  ctx.fillStyle = g;
  eachLine(l, (line, x, y) => ctx.fillText(line, x, y));
}
