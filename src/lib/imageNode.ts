/** Mutually exclusive base color treatment. */
export type ToneId = 'none' | 'duotone' | 'vintage' | 'grayscale';

/** Freely stackable overlay/structural effects. */
export type LayerId = 'blur' | 'grain' | 'halftone' | 'vhs' | 'polaroid';

export const TONES: { id: ToneId; label: string }[] = [
  { id: 'none', label: 'none' },
  { id: 'duotone', label: 'riso duotone' },
  { id: 'vintage', label: 'vintage' },
  { id: 'grayscale', label: 'grayscale' },
];

export const LAYERS: { id: LayerId; label: string }[] = [
  { id: 'blur', label: 'blur' },
  { id: 'grain', label: 'grain' },
  { id: 'halftone', label: 'halftone' },
  { id: 'vhs', label: 'vhs' },
  { id: 'polaroid', label: 'polaroid' },
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
  layers: LayerId[];
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

/** Builds the CSS filter chain for a node's tone + blur layer. */
export function buildFilter(image: Pick<PlacedImage, 'tone' | 'layers'>): string {
  const parts: string[] = [];
  if (image.tone === 'duotone') parts.push('url(#duotone-riso)');
  else if (image.tone === 'vintage') parts.push('sepia(0.55) saturate(1.4) contrast(1.08) brightness(1.06)');
  else if (image.tone === 'grayscale') parts.push('grayscale(1) contrast(1.1)');
  if (image.layers.includes('vhs')) parts.push('saturate(1.3) hue-rotate(-4deg) contrast(1.05)');
  if (image.layers.includes('halftone')) parts.push('contrast(1.35) grayscale(0.25)');
  if (image.layers.includes('blur')) parts.push('blur(5px)');
  return parts.join(' ');
}
