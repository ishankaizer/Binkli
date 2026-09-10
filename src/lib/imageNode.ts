import type { EffectLayer } from './effects';

/**
 * A user-dropped photo placed on the notebook page. x/y/width/height are in
 * page-local px (relative to the notebook element's top-left).
 *
 * effectStack is order-dependent, raster (canvas) compositing — each layer is
 * applied to the output of the previous one, so a blur before a duotone gives
 * a different result than a duotone before a blur. See lib/effects.ts.
 */
export interface PlacedImage {
  id: string;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  effectStack: EffectLayer[];
  grain: number; // 0-100, applied last, always on top of the stack
}

const DEFAULT_SIZE = 220;

export function createPlacedImage(file: File, centerX: number, centerY: number): PlacedImage {
  return {
    id: crypto.randomUUID(),
    src: URL.createObjectURL(file),
    x: centerX - DEFAULT_SIZE / 2,
    y: centerY - DEFAULT_SIZE / 2,
    width: DEFAULT_SIZE,
    height: DEFAULT_SIZE,
    rotation: Math.random() * 10 - 5,
    effectStack: [],
    grain: 0,
  };
}
