// Shared types for the effects engine. See index.ts for the dispatcher and
// docs/effects-engine.md for how this folder is organized.

export type EffectType =
  | 'none'
  | 'exposure' | 'contrast' | 'brightness' | 'saturation' | 'hsl-shift' | 'posterize' | 'sharpen'
  | 'halftone-dot' | 'halftone-circle' | 'halftone-line'
  | 'duotone' | 'overprint' | 'threshold' | 'gradient-map'
  | 'pixel' | 'bitmap' | 'ascii' | 'dither'
  | 'glass' | 'neon' | 'stamp' | 'chromatic'
  | 'risograph' | 'vhs' | 'cross-process' | 'bleach-bypass'
  | 'blur' | 'motion-blur' | 'radial-blur' | 'field-blur'
  | 'vignette'
  | 'polaroid' | 'vhs-frame' | 'text-mask' | 'texture-overlay'
  // added in the second effects pass
  | 'invert' | 'solarize' | 'levels' | 'color-balance' | 'channel-swap'
  | 'find-edges' | 'emboss' | 'oil-paint' | 'crosshatch' | 'comic' | 'crystallize'
  | 'twirl' | 'bulge' | 'wave' | 'kaleidoscope' | 'pixel-sort' | 'slice-glitch'
  | 'bloom' | 'light-leak' | 'thermal'
  | 'cmyk-halftone' | 'dot-matrix' | 'jpeg-crush' | 'scanlines';

export interface GradientMapPreset {
  name: string;
  stops: string[];
  emoji: string;
}

export const GRADIENT_MAP_PRESETS: GradientMapPreset[] = [
  { name: 'Sunset',    emoji: '🌅', stops: ['#1A1A2E', '#7B2FBE', '#E63329', '#FF6B35', '#FFD600'] },
  { name: 'Ocean',     emoji: '🌊', stops: ['#0d0d1a', '#0d3b66', '#00B4D8', '#90E0EF', '#ffffff'] },
  { name: 'Botanical', emoji: '🌿', stops: ['#0a1628', '#1a472a', '#2d6a4f', '#74c69d', '#d8f3dc'] },
  { name: 'Violet',    emoji: '💜', stops: ['#0d0d1a', '#7B2FBE', '#FF3D9A', '#FFD6E7', '#ffffff'] },
  { name: 'Infrared',  emoji: '🔥', stops: ['#000000', '#3d0000', '#ff0000', '#ff8800', '#ffff00', '#ffffff'] },
  { name: 'Riso',      emoji: '🖨', stops: ['#0000cc', '#ff0099', '#ffcc00'] },
  { name: 'Chrome',    emoji: '🪞', stops: ['#000000', '#555577', '#aaaacc', '#ffffff', '#aaaacc', '#555577', '#000000'] },
  { name: 'B&W',       emoji: '⬛', stops: ['#000000', '#ffffff'] },
  { name: 'Heat',      emoji: '🌡', stops: ['#000000', '#3d0000', '#8b0000', '#ff4400', '#ffcc00', '#ffffff'] },
  { name: 'Forest',    emoji: '🌲', stops: ['#0a1f0a', '#1a4a1a', '#2d7a2d', '#7acc7a', '#d4f5d4'] },
  { name: 'Acid',      emoji: '☢', stops: ['#0a0a1f', '#1a003d', '#004400', '#00cc00', '#aaff00', '#ffffff'] },
  { name: 'Rose',      emoji: '🌸', stops: ['#1a0a10', '#5a1a30', '#c8657a', '#f0a89a', '#fdf0ee'] },
  { name: 'Terminal',  emoji: '🖥', stops: ['#000000', '#001a00', '#003300', '#00aa00', '#33ff33'] },
  { name: 'Cyan',      emoji: '💧', stops: ['#0d1b2a', '#1b365d', '#4472ca', '#a8c9f0', '#e8f4fd'] },
  { name: 'Sepia',     emoji: '📷', stops: ['#1a0d00', '#5c3317', '#a07050', '#d4a574', '#f5e6d0'] },
  { name: 'Copper',    emoji: '🔶', stops: ['#1a0800', '#5c2800', '#b05020', '#d4804a', '#f0c890'] },
  { name: 'Mars',      emoji: '🔴', stops: ['#1a0800', '#5c1a00', '#8b2500', '#c86540', '#e8b090'] },
  { name: 'Polaroid',  emoji: '📸', stops: ['#1a1a10', '#3d3020', '#808070', '#d0c8b0', '#f5f0e5'] },
];

export interface EffectParams {
  dotSize?: number;
  color1?: string;
  color2?: string;
  gradientPreset?: number;
  pixelSize?: number;
  glassStrength?: number;
  chromaticStrength?: number;
  threshold?: number;
  neonColor?: string;
  neonStrength?: number;
  blurRadius?: number;
  blurAngle?: number;
  blurAmount?: number;
  vignetteStrength?: number;
  vhsStrength?: number;
  exposureValue?: number;    // -100..100
  contrastValue?: number;    // -100..100
  brightnessValue?: number;  // -100..100
  saturationValue?: number;  // -100..100
  hueShift?: number;         // -180..180
  posterizeLevels?: number;  // 2..16
  sharpenAmount?: number;    // 0..100
  polaroidStyle?: number;    // 0=white 1=vintage 2=dark
  polaroidLabel?: string;    // caption text in bottom margin
  textMaskFontSize?: number; // 6..24
  textMaskText?: string;     // the words the mask is built from
  texturePreset?: number;    // 0=grain 1=scanner 2=crumple 3=film
  textureOpacity?: number;   // 0..100
  levelsBlack?: number;      // 0..255
  levelsWhite?: number;      // 0..255
  levelsGamma?: number;      // 10..300 (percent, 100 = linear)
  balanceR?: number;         // -100..100
  balanceG?: number;
  balanceB?: number;
  channelMode?: number;      // 0..5 RGB permutation
  edgeInvert?: number;       // 0/1 — dark lines on white vs glow on black
  twirlStrength?: number;    // -100..100
  bulgeStrength?: number;    // -100..100
  waveAmp?: number;          // 0..60
  waveFreq?: number;         // 1..12
  kaleidoSegments?: number;  // 2..16
  sortThreshold?: number;    // 0..255 brightness a run must beat to be sorted
  sortVertical?: number;     // 0/1
  sliceCount?: number;       // 2..40
  sliceOffset?: number;      // 0..100
  bloomThreshold?: number;   // 0..255
  bloomStrength?: number;    // 0..100
  leakColor?: string;
  leakStrength?: number;     // 0..100
  leakCorner?: number;       // 0..3
  crushAmount?: number;      // 0..100
  scanGap?: number;          // 2..12
  scanStrength?: number;     // 0..100
}

export interface EffectLayer {
  id: string;
  type: EffectType;
  opacity: number; // 0-1
  visible?: boolean; // default true; false skips this layer
  params: EffectParams;
}
