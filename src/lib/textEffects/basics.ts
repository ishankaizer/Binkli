// Basics group: plain, outline, hard shadow, long shadow, highlighter marker,
// die-cut sticker. Mirrors TEXT_EFFECT_GROUPS's 'Basics' entries in types.ts.

import type { TextConfig } from './types';
import { eachLine, type Layout } from './helpers';

export function renderPlain(ctx: CanvasRenderingContext2D, _canvas: HTMLCanvasElement, cfg: TextConfig, l: Layout) {
  ctx.fillStyle = cfg.color;
  eachLine(l, (line, x, y) => ctx.fillText(line, x, y));
}

export function renderOutline(ctx: CanvasRenderingContext2D, _canvas: HTMLCanvasElement, cfg: TextConfig, l: Layout, s: number) {
  ctx.strokeStyle = cfg.color;
  ctx.lineWidth = Math.max(1, cfg.size * (0.02 + s * 0.09));
  eachLine(l, (line, x, y) => ctx.strokeText(line, x, y));
}

export function renderShadow(ctx: CanvasRenderingContext2D, _canvas: HTMLCanvasElement, cfg: TextConfig, l: Layout, s: number) {
  const off = cfg.size * (0.02 + s * 0.12);
  ctx.fillStyle = cfg.color2;
  eachLine(l, (line, x, y) => ctx.fillText(line, x + off, y + off));
  ctx.fillStyle = cfg.color;
  eachLine(l, (line, x, y) => ctx.fillText(line, x, y));
}

export function renderLongShadow(ctx: CanvasRenderingContext2D, _canvas: HTMLCanvasElement, cfg: TextConfig, l: Layout, s: number) {
  const depth = Math.round(cfg.size * (0.08 + s * 0.85));
  ctx.fillStyle = cfg.color2;
  for (let d = depth; d > 0; d--) {
    eachLine(l, (line, x, y) => ctx.fillText(line, x + d, y + d));
  }
  ctx.fillStyle = cfg.color;
  eachLine(l, (line, x, y) => ctx.fillText(line, x, y));
}

export function renderMarker(ctx: CanvasRenderingContext2D, _canvas: HTMLCanvasElement, cfg: TextConfig, l: Layout, s: number) {
  const bandH = cfg.size * (0.4 + s * 0.6);
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = cfg.color2;
  eachLine(l, (line, x, y) => {
    const wLine = ctx.measureText(line).width;
    if (!wLine) return;
    const left = cfg.align === 'center' ? x - wLine / 2 : cfg.align === 'right' ? x - wLine : x;
    const jitter = cfg.size * 0.06;
    ctx.beginPath();
    ctx.moveTo(left - jitter, y - bandH / 2 + jitter * 0.5);
    ctx.lineTo(left + wLine + jitter, y - bandH / 2 - jitter * 0.4);
    ctx.lineTo(left + wLine + jitter * 0.7, y + bandH / 2 + jitter * 0.3);
    ctx.lineTo(left - jitter * 0.8, y + bandH / 2 - jitter * 0.2);
    ctx.closePath();
    ctx.fill();
  });
  ctx.restore();
  ctx.fillStyle = cfg.color;
  eachLine(l, (line, x, y) => ctx.fillText(line, x, y));
}

export function renderSticker(ctx: CanvasRenderingContext2D, _canvas: HTMLCanvasElement, cfg: TextConfig, l: Layout, s: number) {
  const cut = cfg.size * (0.06 + s * 0.16);
  ctx.save();
  ctx.shadowColor = 'rgba(20,18,31,0.35)';
  ctx.shadowBlur = cfg.size * 0.12;
  ctx.shadowOffsetY = cfg.size * 0.05;
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = cut * 2;
  eachLine(l, (line, x, y) => ctx.strokeText(line, x, y));
  ctx.restore();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = cut * 2;
  eachLine(l, (line, x, y) => ctx.strokeText(line, x, y));
  ctx.fillStyle = cfg.color;
  eachLine(l, (line, x, y) => ctx.fillText(line, x, y));
}
