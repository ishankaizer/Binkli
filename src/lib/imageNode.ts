import type { EffectLayer } from './effects';
import { defaultTextConfig, type TextConfig } from './textEffects';

/**
 * A node placed on the notebook page. x/y/width/height are in page-local px
 * (relative to the notebook element's top-left).
 *
 * A node is either photo-backed (`src`) or text-backed (`text`). Both render
 * to the same `<canvas>`, so everything downstream — the effect stack, grain,
 * recipes, export — treats them identically and needs no special-casing.
 *
 * effectStack is order-dependent, raster (canvas) compositing — each layer is
 * applied to the output of the previous one, so a blur before a duotone gives
 * a different result than a duotone before a blur. See lib/effects.ts.
 */
export interface PlacedImage {
  id: string;
  /** Object URL for photo nodes; empty string for text nodes. */
  src: string;
  /** Present only on text nodes. */
  text?: TextConfig;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  effectStack: EffectLayer[];
  grain: number; // 0-100, applied last, always on top of the stack
}

export const isTextNode = (node: PlacedImage): boolean => node.text !== undefined;

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

const TEXT_W = 420;
const TEXT_H = 220;

export function createTextNode(centerX: number, centerY: number): PlacedImage {
  return {
    id: crypto.randomUUID(),
    src: '',
    text: defaultTextConfig(),
    x: centerX - TEXT_W / 2,
    y: centerY - TEXT_H / 2,
    width: TEXT_W,
    height: TEXT_H,
    rotation: Math.random() * 6 - 3,
    effectStack: [],
    grain: 0,
  };
}

/**
 * Clones a node (new id, fresh layer ids so the two stacks never share
 * references), offset so the copy doesn't sit exactly on top of the original.
 * Reuses the same `src` object URL, safe: multiple <canvas>/<img> consumers
 * can read the same blob URL, it's only revoked on delete.
 */
export function duplicatePlacedImage(image: PlacedImage, offset = 24): PlacedImage {
  return {
    ...image,
    id: crypto.randomUUID(),
    x: image.x + offset,
    y: image.y + offset,
    text: image.text ? { ...image.text } : undefined,
    effectStack: image.effectStack.map((layer) => ({ ...layer, id: crypto.randomUUID() })),
  };
}
