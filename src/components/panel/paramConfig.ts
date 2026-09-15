// Maps each EffectParams key to how it should be edited in the Stack tab's
// expanded layer body (ParamRow.tsx renders one of these per param a layer
// actually carries). Add an entry here whenever effects/*.ts grows a new
// EffectParams field, or its slider/picker won't show up in the UI.

import { GRADIENT_MAP_PRESETS, type EffectParams } from '../../lib/effects';

export type ParamKey = keyof EffectParams;

export interface ParamConfig {
  label: string;
  type: 'number' | 'color' | 'select' | 'text';
  min?: number;
  max?: number;
  step?: number;
  options?: { label: string; value: number }[];
}

export const PARAM_CONFIG: Partial<Record<ParamKey, ParamConfig>> = {
  dotSize: { label: 'dot size', type: 'number', min: 2, max: 40, step: 1 },
  color1: { label: 'ink 1', type: 'color' },
  color2: { label: 'ink 2', type: 'color' },
  gradientPreset: {
    label: 'ramp', type: 'select',
    options: GRADIENT_MAP_PRESETS.map((p, i) => ({ label: p.name, value: i })),
  },
  pixelSize: { label: 'cell size', type: 'number', min: 2, max: 40, step: 1 },
  glassStrength: { label: 'warp', type: 'number', min: 0, max: 40, step: 1 },
  chromaticStrength: { label: 'shift', type: 'number', min: 0, max: 30, step: 1 },
  threshold: { label: 'threshold', type: 'number', min: 0, max: 255, step: 1 },
  neonColor: { label: 'glow', type: 'color' },
  neonStrength: { label: 'strength', type: 'number', min: 0, max: 100, step: 1 },
  blurRadius: { label: 'radius', type: 'number', min: 0, max: 40, step: 1 },
  blurAngle: { label: 'angle', type: 'number', min: 0, max: 360, step: 1 },
  blurAmount: { label: 'amount', type: 'number', min: 0, max: 60, step: 1 },
  vignetteStrength: { label: 'strength', type: 'number', min: 0, max: 100, step: 1 },
  vhsStrength: { label: 'strength', type: 'number', min: 0, max: 100, step: 1 },
  exposureValue: { label: 'exposure', type: 'number', min: -100, max: 100, step: 1 },
  contrastValue: { label: 'contrast', type: 'number', min: -100, max: 100, step: 1 },
  brightnessValue: { label: 'brightness', type: 'number', min: -100, max: 100, step: 1 },
  saturationValue: { label: 'saturation', type: 'number', min: -100, max: 100, step: 1 },
  hueShift: { label: 'hue', type: 'number', min: -180, max: 180, step: 1 },
  posterizeLevels: { label: 'levels', type: 'number', min: 2, max: 16, step: 1 },
  sharpenAmount: { label: 'amount', type: 'number', min: 0, max: 100, step: 1 },
  polaroidStyle: {
    label: 'frame', type: 'select',
    options: [{ label: 'white', value: 0 }, { label: 'vintage', value: 1 }, { label: 'dark', value: 2 }],
  },
  polaroidLabel: { label: 'caption', type: 'text' },
  textMaskFontSize: { label: 'type size', type: 'number', min: 6, max: 48, step: 1 },
  textMaskText: { label: 'words', type: 'text' },
  texturePreset: {
    label: 'texture', type: 'select',
    options: [
      { label: 'grain', value: 0 }, { label: 'scanner', value: 1 },
      { label: 'crumple', value: 2 }, { label: 'film', value: 3 },
    ],
  },
  textureOpacity: { label: 'amount', type: 'number', min: 0, max: 100, step: 1 },
  levelsBlack: { label: 'black', type: 'number', min: 0, max: 255, step: 1 },
  levelsWhite: { label: 'white', type: 'number', min: 0, max: 255, step: 1 },
  levelsGamma: { label: 'gamma', type: 'number', min: 10, max: 300, step: 1 },
  balanceR: { label: 'red', type: 'number', min: -100, max: 100, step: 1 },
  balanceG: { label: 'green', type: 'number', min: -100, max: 100, step: 1 },
  balanceB: { label: 'blue', type: 'number', min: -100, max: 100, step: 1 },
  channelMode: {
    label: 'order', type: 'select',
    options: [
      { label: 'R B G', value: 0 }, { label: 'G R B', value: 1 }, { label: 'G B R', value: 2 },
      { label: 'B R G', value: 3 }, { label: 'B G R', value: 4 }, { label: 'R G B', value: 5 },
    ],
  },
  edgeInvert: {
    label: 'style', type: 'select',
    options: [{ label: 'glow on black', value: 0 }, { label: 'ink on white', value: 1 }],
  },
  twirlStrength: { label: 'twist', type: 'number', min: -100, max: 100, step: 1 },
  bulgeStrength: { label: 'bulge', type: 'number', min: -100, max: 100, step: 1 },
  waveAmp: { label: 'height', type: 'number', min: 0, max: 60, step: 1 },
  waveFreq: { label: 'waves', type: 'number', min: 1, max: 12, step: 1 },
  kaleidoSegments: { label: 'segments', type: 'number', min: 2, max: 16, step: 1 },
  sortThreshold: { label: 'catch at', type: 'number', min: 0, max: 255, step: 1 },
  sortVertical: {
    label: 'direction', type: 'select',
    options: [{ label: 'rows', value: 0 }, { label: 'columns', value: 1 }],
  },
  sliceCount: { label: 'slices', type: 'number', min: 2, max: 40, step: 1 },
  sliceOffset: { label: 'shift', type: 'number', min: 0, max: 100, step: 1 },
  bloomThreshold: { label: 'catch at', type: 'number', min: 0, max: 255, step: 1 },
  bloomStrength: { label: 'glow', type: 'number', min: 0, max: 100, step: 1 },
  leakColor: { label: 'leak', type: 'color' },
  leakStrength: { label: 'strength', type: 'number', min: 0, max: 100, step: 1 },
  leakCorner: {
    label: 'from', type: 'select',
    options: [
      { label: 'top right', value: 0 }, { label: 'top left', value: 1 },
      { label: 'bottom left', value: 2 }, { label: 'bottom right', value: 3 },
    ],
  },
  crushAmount: { label: 'crush', type: 'number', min: 0, max: 100, step: 1 },
  scanGap: { label: 'line gap', type: 'number', min: 2, max: 12, step: 1 },
  scanStrength: { label: 'strength', type: 'number', min: 0, max: 100, step: 1 },
};
