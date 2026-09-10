/** Mutually exclusive base color treatment. */
export type ToneId =
  | 'none'
  | 'duotone-blue'
  | 'duotone-red'
  | 'sepia'
  | 'vintage'
  | 'grayscale'
  | 'invert'
  | 'posterize';

/** Freely stackable overlay/structural effects, each with a 0-100 intensity. */
export type LayerId = 'blur' | 'grain' | 'halftone' | 'vhs' | 'noise' | 'vignette' | 'fade' | 'polaroid';

export interface ActiveLayer {
  id: LayerId;
  intensity: number;
}

export const TONES: { id: ToneId; label: string }[] = [
  { id: 'none', label: 'none' },
  { id: 'duotone-blue', label: 'duotone blue' },
  { id: 'duotone-red', label: 'duotone red' },
  { id: 'sepia', label: 'sepia' },
  { id: 'vintage', label: 'vintage' },
  { id: 'grayscale', label: 'grayscale' },
  { id: 'invert', label: 'invert' },
  { id: 'posterize', label: 'posterize' },
];

export const LAYERS: { id: LayerId; label: string; defaultIntensity: number; tunable: boolean }[] = [
  { id: 'blur', label: 'blur', defaultIntensity: 40, tunable: true },
  { id: 'grain', label: 'grain', defaultIntensity: 60, tunable: true },
  { id: 'halftone', label: 'halftone', defaultIntensity: 70, tunable: true },
  { id: 'vhs', label: 'vhs', defaultIntensity: 60, tunable: true },
  { id: 'noise', label: 'noise', defaultIntensity: 45, tunable: true },
  { id: 'vignette', label: 'vignette', defaultIntensity: 55, tunable: true },
  { id: 'fade', label: 'fade', defaultIntensity: 60, tunable: true },
  { id: 'polaroid', label: 'polaroid', defaultIntensity: 100, tunable: false },
];

/**
 * A user-dropped photo placed on the notebook page. x/y/width/height are in
 * page-local px (relative to the notebook element's top-left).
 */
export interface PlacedImage {
  id: string;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  tone: ToneId;
  layers: ActiveLayer[];
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
    tone: 'none',
    layers: [],
  };
}

function findLayer(image: Pick<PlacedImage, 'layers'>, id: LayerId): ActiveLayer | undefined {
  return image.layers.find((l) => l.id === id);
}

/** Builds the CSS filter chain for a node's tone plus its intensity-scaled filter layers. */
export function buildFilter(image: Pick<PlacedImage, 'tone' | 'layers'>): string {
  const parts: string[] = [];

  switch (image.tone) {
    case 'duotone-blue':
      parts.push('url(#duotone-blue)');
      break;
    case 'duotone-red':
      parts.push('url(#duotone-red)');
      break;
    case 'sepia':
      parts.push('sepia(0.9) contrast(1.05) brightness(1.02)');
      break;
    case 'vintage':
      parts.push('sepia(0.55) saturate(1.4) contrast(1.08) brightness(1.06)');
      break;
    case 'grayscale':
      parts.push('grayscale(1) contrast(1.1)');
      break;
    case 'invert':
      parts.push('invert(1) saturate(1.1)');
      break;
    case 'posterize':
      parts.push('url(#posterize) saturate(1.15)');
      break;
  }

  const vhs = findLayer(image, 'vhs');
  if (vhs) {
    const t = vhs.intensity / 100;
    parts.push(`saturate(${(1 + 0.35 * t).toFixed(2)}) hue-rotate(${(-5 * t).toFixed(1)}deg) contrast(${(1 + 0.06 * t).toFixed(2)})`);
  }

  const halftone = findLayer(image, 'halftone');
  if (halftone) {
    const t = halftone.intensity / 100;
    parts.push(`contrast(${(1 + 0.4 * t).toFixed(2)}) grayscale(${(0.3 * t).toFixed(2)})`);
  }

  const fade = findLayer(image, 'fade');
  if (fade) {
    const t = fade.intensity / 100;
    parts.push(`contrast(${(1 - 0.18 * t).toFixed(2)}) saturate(${(1 - 0.3 * t).toFixed(2)}) brightness(${(1 + 0.1 * t).toFixed(2)})`);
  }

  const blur = findLayer(image, 'blur');
  if (blur) parts.push(`blur(${((blur.intensity / 100) * 14).toFixed(1)}px)`);

  return parts.join(' ');
}

/** 0-1 opacity for an overlay-based layer, driven by its intensity (0 if inactive). */
export function layerStrength(image: Pick<PlacedImage, 'layers'>, id: LayerId): number {
  const l = findLayer(image, id);
  return l ? l.intensity / 100 : 0;
}
