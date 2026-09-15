// Canvas-based image effects engine — supports single effects and stacking.
// Ported from the pre-rebuild Next.js app (binkli-reference/app/lib/effects.ts),
// which is framework-agnostic pure canvas code. Order-dependent: applyEffectLayer
// takes a source canvas and returns a new one, so the caller folds a stack of
// layers by feeding each result as the next input — a blur before a duotone
// produces a different result than a duotone before a blur.
//
// This folder is split by category (see effectCatalog.ts's EFFECT_CATALOG —
// that grouping is the source of truth for what lives where). To find a bug
// in one effect, open its category file directly instead of this one; this
// file only holds the dispatcher and shared re-exports. See
// docs/effects-engine.md for the full map.

import { tmp } from './helpers';
import type { EffectLayer } from './types';

export type { EffectType, EffectParams, EffectLayer, GradientMapPreset } from './types';
export { GRADIENT_MAP_PRESETS } from './types';

import {
  applyExposure, applyContrast, applyBrightness, applySaturation, applyHslShift,
  applyPosterize, applyInvert, applyLevels, applyColorBalance,
} from './foundation';
import {
  applyDuotone, applyOverprint, applyThreshold, applyGradientMap,
  applyCrossProcess, applyBleachBypass, applySolarize, applyThermal,
} from './color';
import { applyBlurEffect, applyFieldBlur, applyPixel, applyCrystallize } from './simplify';
import { applyFindEdges, applyEmboss, applyOilPaint, applyCrosshatch, applyComic } from './stylize';
import {
  applyHalftoneDot, applyHalftoneCircle, applyHalftoneLine, applyBitmap, applyAscii,
  applyDither, applyStamp, applyRisograph, applyCmykHalftone, applyDotMatrix, applyTextMask,
} from './print';
import {
  applyChromatic, applyVHS, applyGlass, applyMotionBlur, applyRadialBlur,
  applyTwirl, applyBulge, applyWave, applyKaleidoscope,
} from './distort';
import {
  applyPixelSort, applySliceGlitch, applyJpegCrush, applyScanlines, applyChannelSwap,
} from './glitch';
import { applyNeon, applyVignette, applyBloom, applyLightLeak } from './light';
import { applySharpen, applyPolaroid, applyVhsFrame, applyTextureOverlay } from './final';

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
