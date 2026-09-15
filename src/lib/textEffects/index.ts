/**
 * Editable text as a first-class node. Text is laid out and drawn onto a
 * canvas here, which means the whole image effect stack in lib/effects/
 * composites on top of it for free — a text node can be halftoned, pixel
 * sorted or run through a recipe exactly like a photo.
 *
 * Everything below is real canvas drawing. No CSS text is rendered to screen,
 * so what you see on the page is what exports.
 *
 * Split by TEXT_EFFECT_GROUPS category (Basics/Dimension/Light/Motion/Broken,
 * see types.ts) — to find a bug in one effect, open its group file directly.
 * See docs/effects-engine.md.
 */

import { layout, prep } from './helpers';
import type { TextConfig } from './types';

export type { TextEffectType, TextFontKey, TextConfig, TextEffectDef } from './types';
export { TEXT_FONTS, TEXT_EFFECTS, TEXT_EFFECT_GROUPS, textEffectLabel, defaultTextConfig } from './types';
export { fontsReady } from './helpers';

import { renderPlain, renderOutline, renderShadow, renderLongShadow, renderMarker, renderSticker } from './basics';
import { renderExtrude, renderBubble, renderLetterpress, renderChrome, renderVarsity } from './dimension';
import { renderNeon, renderGradient, renderRainbow } from './light';
import { renderMotion, renderZoom, renderEcho, renderArc } from './motion';
import { renderChromatic, renderGlitch, renderHalftone, renderRansom } from './broken';

/** Renders one text node into a fresh canvas of w x h. */
export function renderTextCanvas(cfg: TextConfig, w: number, h: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(w));
  canvas.height = Math.max(1, Math.round(h));
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  prep(ctx, cfg);
  const l = layout(ctx, cfg, canvas.width, canvas.height);
  const s = Math.max(0, Math.min(100, cfg.strength)) / 100;

  switch (cfg.effect) {
    case 'outline':       renderOutline(ctx, canvas, cfg, l, s); break;
    case 'shadow':        renderShadow(ctx, canvas, cfg, l, s); break;
    case 'long-shadow':   renderLongShadow(ctx, canvas, cfg, l, s); break;
    case 'extrude':       renderExtrude(ctx, canvas, cfg, l, s); break;
    case 'letterpress':   renderLetterpress(ctx, canvas, cfg, l, s); break;
    case 'neon':          renderNeon(ctx, canvas, cfg, l, s); break;
    case 'gradient':      renderGradient(ctx, canvas, cfg, l, s); break;
    case 'rainbow':       renderRainbow(ctx, canvas, cfg, l, s); break;
    case 'motion':        renderMotion(ctx, canvas, cfg, l, s); break;
    case 'zoom':          renderZoom(ctx, canvas, cfg, l, s); break;
    case 'echo':          renderEcho(ctx, canvas, cfg, l, s); break;
    case 'chromatic':     renderChromatic(ctx, canvas, cfg, l, s); break;
    case 'bubble':        renderBubble(ctx, canvas, cfg, l, s); break;
    case 'chrome':        renderChrome(ctx, canvas, cfg, l, s); break;
    case 'sticker':       renderSticker(ctx, canvas, cfg, l, s); break;
    case 'glitch':        renderGlitch(ctx, canvas, cfg, l, s); break;
    case 'halftone':      renderHalftone(ctx, canvas, cfg, l, s); break;
    case 'varsity':       renderVarsity(ctx, canvas, cfg, l, s); break;
    case 'marker':        renderMarker(ctx, canvas, cfg, l, s); break;
    case 'arc':           renderArc(ctx, canvas, cfg, l, s); break;
    case 'ransom':         renderRansom(ctx, canvas, cfg, l, s); break;
    case 'plain':
    default:               renderPlain(ctx, canvas, cfg, l); break;
  }

  return canvas;
}
