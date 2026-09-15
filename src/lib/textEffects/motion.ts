// Motion group: motion blur, radial (zoom) blur, echo, arc. Mirrors
// TEXT_EFFECT_GROUPS's 'Motion' entries in types.ts.

import type { TextConfig } from './types';
import { eachLine, type Layout } from './helpers';

export function renderMotion(ctx: CanvasRenderingContext2D, _canvas: HTMLCanvasElement, cfg: TextConfig, l: Layout, s: number) {
  const dist = Math.max(1, Math.round(cfg.size * (0.02 + s * 0.35)));
  ctx.fillStyle = cfg.color;
  for (let d = dist; d >= 1; d--) {
    ctx.globalAlpha = 0.5 / dist;
    eachLine(l, (line, x, y) => ctx.fillText(line, x - d, y));
    eachLine(l, (line, x, y) => ctx.fillText(line, x + d, y));
  }
  ctx.globalAlpha = 1;
  eachLine(l, (line, x, y) => ctx.fillText(line, x, y));
}

export function renderZoom(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, cfg: TextConfig, l: Layout, s: number) {
  const steps = 18;
  const max = 1 + s * 0.35;
  ctx.fillStyle = cfg.color;
  for (let i = steps; i >= 1; i--) {
    const k = 1 + (max - 1) * (i / steps);
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(k, k);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);
    ctx.globalAlpha = 0.55 / steps;
    eachLine(l, (line, x, y) => ctx.fillText(line, x, y));
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  eachLine(l, (line, x, y) => ctx.fillText(line, x, y));
}

export function renderEcho(ctx: CanvasRenderingContext2D, _canvas: HTMLCanvasElement, cfg: TextConfig, l: Layout, s: number) {
  const spread = cfg.size * (0.05 + s * 0.45);
  for (let i = 4; i >= 1; i--) {
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = i % 2 ? cfg.color2 : cfg.color;
    eachLine(l, (line, x, y) => ctx.fillText(line, x + (spread * i) / 4, y + (spread * i) / 8));
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = cfg.color;
  eachLine(l, (line, x, y) => ctx.fillText(line, x, y));
}

export function renderArc(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, cfg: TextConfig, l: Layout, s: number) {
  const bend = (s - 0.5) * 2; // -1..1
  ctx.fillStyle = cfg.color;
  eachLine(l, (line, _x, y) => {
    const chars = [...line];
    const widths = chars.map((c) => ctx.measureText(c).width);
    const totalW = widths.reduce((a, b) => a + b, 0);
    const radius = Math.max(cfg.size * 2, canvas.width) * (1.4 - Math.abs(bend) * 0.9);
    const arcAngle = totalW / radius;
    let angle = -arcAngle / 2;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.translate(canvas.width / 2, y + (bend >= 0 ? radius : -radius));
    chars.forEach((c, i) => {
      const step = widths[i] / radius;
      angle += step / 2;
      ctx.save();
      ctx.rotate(bend >= 0 ? angle : -angle);
      ctx.translate(0, bend >= 0 ? -radius : radius);
      ctx.fillText(c, 0, 0);
      ctx.restore();
      angle += step / 2;
    });
    ctx.restore();
  });
}
