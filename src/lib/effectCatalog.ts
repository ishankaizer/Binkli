import type { EffectType, EffectParams } from './effects';

export interface EffectDef {
  type: EffectType;
  label: string;
  symbol: string;
  defaultParams: EffectParams;
}

const FOUNDATION_FX: EffectDef[] = [
  { type: 'exposure',   label: 'Exposure',   symbol: '☼', defaultParams: { exposureValue: 0 } },
  { type: 'contrast',   label: 'Contrast',   symbol: '◐', defaultParams: { contrastValue: 0 } },
  { type: 'brightness', label: 'Brightness', symbol: '✦', defaultParams: { brightnessValue: 0 } },
  { type: 'saturation', label: 'Saturation', symbol: '◎', defaultParams: { saturationValue: 0 } },
  { type: 'hsl-shift',  label: 'Hue Shift',  symbol: '⟳', defaultParams: { hueShift: 0 } },
  { type: 'posterize',  label: 'Posterize',  symbol: '▤', defaultParams: { posterizeLevels: 5 } },
];
const COLOR_FX: EffectDef[] = [
  { type: 'gradient-map',  label: 'Grad Map',      symbol: '▤', defaultParams: { gradientPreset: 0 } },
  { type: 'duotone',       label: 'Duotone',       symbol: '◑', defaultParams: { color1: '#2D3BCC', color2: '#14121F' } },
  { type: 'overprint',     label: 'Overprint',     symbol: '⊛', defaultParams: { color1: '#E83030', color2: '#2D3BCC' } },
  { type: 'cross-process', label: 'Cross Process', symbol: '⟳', defaultParams: {} },
  { type: 'bleach-bypass', label: 'Bleach Bypass', symbol: '◎', defaultParams: { vignetteStrength: 80 } },
  { type: 'threshold',     label: 'Two-Tone',      symbol: '▣', defaultParams: { threshold: 128, color1: '#14121F', color2: '#FFFCF5' } },
];
const SIMPLIFY_FX: EffectDef[] = [
  { type: 'blur',        label: 'Blur',     symbol: '○', defaultParams: { blurRadius: 6 } },
  { type: 'field-blur',  label: 'Field',    symbol: '◐', defaultParams: { blurRadius: 18 } },
  { type: 'pixel',       label: 'Pixelate', symbol: '⊞', defaultParams: { pixelSize: 12 } },
];
const PRINT_FX: EffectDef[] = [
  { type: 'halftone-dot',    label: 'Dot Grid',   symbol: '⊙', defaultParams: { dotSize: 10, color1: '#14121F', color2: '#FFFCF5' } },
  { type: 'halftone-circle', label: 'Concentric', symbol: '◎', defaultParams: { dotSize: 12, color1: '#2D3BCC', color2: '#14121F' } },
  { type: 'halftone-line',   label: 'Scanline',   symbol: '≡', defaultParams: { dotSize: 8,  color1: '#E83030', color2: '#14121F' } },
  { type: 'risograph',       label: 'Risograph',  symbol: '⊕', defaultParams: { color1: '#FF1464', color2: '#00CFCF', dotSize: 8 } },
  { type: 'bitmap',          label: 'Bitmap',     symbol: '⊟', defaultParams: { pixelSize: 4, threshold: 128, color1: '#14121F', color2: '#FFFCF5' } },
  { type: 'dither',          label: 'Dither',     symbol: '▦', defaultParams: { color1: '#14121F', color2: '#F0EEE5' } },
  { type: 'ascii',           label: 'ASCII',      symbol: '@', defaultParams: { pixelSize: 8, color1: '#2D3BCC', color2: '#FFFCF5' } },
  { type: 'stamp',           label: 'Stamp',      symbol: '⬡', defaultParams: { threshold: 160, color1: '#14121F', color2: '#FFFCF5' } },
  { type: 'text-mask',       label: 'Word Fill',  symbol: 'Aa', defaultParams: { textMaskFontSize: 12 } },
];
const DISTORT_FX: EffectDef[] = [
  { type: 'chromatic',   label: 'Chromatic',   symbol: '⊛', defaultParams: { chromaticStrength: 8 } },
  { type: 'vhs',         label: 'VHS Tape',    symbol: '▶', defaultParams: { vhsStrength: 60 } },
  { type: 'glass',       label: 'Glass Warp',  symbol: '◈', defaultParams: { glassStrength: 15 } },
  { type: 'motion-blur', label: 'Motion',      symbol: '⇨', defaultParams: { blurAmount: 20, blurAngle: 0 } },
  { type: 'radial-blur', label: 'Radial Zoom', symbol: '◉', defaultParams: { blurAmount: 15 } },
];
const LIGHT_FX: EffectDef[] = [
  { type: 'neon',     label: 'Neon Glow', symbol: '✦', defaultParams: { neonColor: '#FFD600', neonStrength: 60 } },
  { type: 'vignette', label: 'Vignette',  symbol: '◍', defaultParams: { vignetteStrength: 70 } },
];
const FINAL_FX: EffectDef[] = [
  { type: 'sharpen',          label: 'Sharpen',        symbol: '◆', defaultParams: { sharpenAmount: 50 } },
  { type: 'polaroid',         label: 'Polaroid Frame', symbol: '📷', defaultParams: { polaroidStyle: 0, polaroidLabel: '' } },
  { type: 'vhs-frame',        label: 'VHS Frame',      symbol: '▶', defaultParams: {} },
  { type: 'texture-overlay',  label: 'Texture',        symbol: '⊡', defaultParams: { texturePreset: 0, textureOpacity: 35 } },
];

export interface EffectCategory {
  label: string;
  defs: EffectDef[];
}

export const EFFECT_CATALOG: EffectCategory[] = [
  { label: 'Foundation', defs: FOUNDATION_FX },
  { label: 'Color',      defs: COLOR_FX },
  { label: 'Simplify',   defs: SIMPLIFY_FX },
  { label: 'Print',      defs: PRINT_FX },
  { label: 'Distort',    defs: DISTORT_FX },
  { label: 'Light',      defs: LIGHT_FX },
  { label: 'Final',      defs: FINAL_FX },
];

export const EFFECT_DEFS: EffectDef[] = EFFECT_CATALOG.flatMap((c) => c.defs);

export function effectLabel(type: EffectType): string {
  return EFFECT_DEFS.find((d) => d.type === type)?.label ?? type;
}
