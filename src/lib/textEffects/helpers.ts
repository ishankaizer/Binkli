// Shared layout and canvas-scratch helpers used by every text effect group.

import type { TextConfig } from './types';
import { TEXT_FONTS } from './types';

/** Fonts are loaded via a stylesheet link; canvas needs them resolved first. */
export function fontsReady(): Promise<unknown> {
  return document.fonts ? document.fonts.ready : Promise.resolve();
}

export function fontOf(cfg: TextConfig, sizeOverride?: number): string {
  const f = TEXT_FONTS.find((t) => t.key === cfg.font) ?? TEXT_FONTS[0];
  return `${f.weight} ${sizeOverride ?? cfg.size}px ${f.family}`;
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const out: string[] = [];
  for (const paragraph of text.split('\n')) {
    if (!paragraph.trim()) { out.push(''); continue; }
    let line = '';
    for (const word of paragraph.split(/\s+/)) {
      const next = line ? `${line} ${word}` : word;
      if (ctx.measureText(next).width > maxWidth && line) { out.push(line); line = word; }
      else line = next;
    }
    out.push(line);
  }
  return out;
}

export interface Layout {
  lines: string[];
  lineHeight: number;
  startY: number;
  anchorX: number;
}

export function layout(ctx: CanvasRenderingContext2D, cfg: TextConfig, w: number, h: number): Layout {
  ctx.font = fontOf(cfg);
  const pad = Math.max(8, cfg.size * 0.28);
  const lines = wrapLines(ctx, cfg.text || ' ', Math.max(24, w - pad * 2));
  const lineHeight = cfg.size * 1.18;
  const total = lines.length * lineHeight;
  const startY = (h - total) / 2 + lineHeight * 0.5;
  const anchorX = cfg.align === 'left' ? pad : cfg.align === 'right' ? w - pad : w / 2;
  return { lines, lineHeight, startY, anchorX };
}

export function eachLine(l: Layout, fn: (line: string, x: number, y: number, i: number) => void) {
  l.lines.forEach((line, i) => fn(line, l.anchorX, l.startY + i * l.lineHeight, i));
}

export function prep(ctx: CanvasRenderingContext2D, cfg: TextConfig) {
  ctx.font = fontOf(cfg);
  ctx.textAlign = cfg.align;
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
}

export function scratch(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d', { willReadFrequently: true })!];
}

function parseHex(hex: string): [number, number, number] {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [0, 0, 0];
}

/** amount < 0 darkens toward black. */
export function shade(hex: string, amount: number): string {
  const [r, g, b] = parseHex(hex);
  const k = 1 + amount;
  return `rgb(${Math.round(r * k)},${Math.round(g * k)},${Math.round(b * k)})`;
}

/** amount 0..1 lifts toward white. */
export function tint(hex: string, amount: number): string {
  const [r, g, b] = parseHex(hex);
  return `rgb(${Math.round(r + (255 - r) * amount)},${Math.round(g + (255 - g) * amount)},${Math.round(b + (255 - b) * amount)})`;
}
