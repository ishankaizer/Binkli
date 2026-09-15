import type { EffectType, EffectParams } from './effects';

export interface EffectDef {
  type: EffectType;
  label: string;
  symbol: string;
  defaultParams: EffectParams;
}

const FOUNDATION_FX: EffectDef[] = [
  { type: 'exposure',      label: 'Exposure',   symbol: '☼', defaultParams: { exposureValue: 0 } },
  { type: 'contrast',      label: 'Contrast',   symbol: '◐', defaultParams: { contrastValue: 0 } },
  { type: 'brightness',    label: 'Brightness', symbol: '✦', defaultParams: { brightnessValue: 0 } },
  { type: 'saturation',    label: 'Saturation', symbol: '◎', defaultParams: { saturationValue: 0 } },
  { type: 'hsl-shift',     label: 'Hue Shift',  symbol: '⟳', defaultParams: { hueShift: 0 } },
  { type: 'levels',        label: 'Levels',     symbol: '◨', defaultParams: { levelsBlack: 0, levelsWhite: 255, levelsGamma: 100 } },
  { type: 'color-balance', label: 'Colour Bal', symbol: '⚖', defaultParams: { balanceR: 0, balanceG: 0, balanceB: 0 } },
  { type: 'posterize',     label: 'Posterize',  symbol: '▤', defaultParams: { posterizeLevels: 5 } },
  { type: 'invert',        label: 'Invert',     symbol: '◑', defaultParams: {} },
];

const COLOR_FX: EffectDef[] = [
  { type: 'gradient-map',  label: 'Grad Map',      symbol: '▤', defaultParams: { gradientPreset: 0 } },
  { type: 'duotone',       label: 'Duotone',       symbol: '◑', defaultParams: { color1: '#2D3BCC', color2: '#14121F' } },
  { type: 'overprint',     label: 'Overprint',     symbol: '⊛', defaultParams: { color1: '#E83030', color2: '#2D3BCC' } },
  { type: 'cross-process', label: 'Cross Process', symbol: '⟳', defaultParams: {} },
  { type: 'bleach-bypass', label: 'Bleach Bypass', symbol: '◎', defaultParams: { vignetteStrength: 80 } },
  { type: 'threshold',     label: 'Two-Tone',      symbol: '▣', defaultParams: { threshold: 128, color1: '#14121F', color2: '#FFFCF5' } },
  { type: 'solarize',      label: 'Solarize',      symbol: '◓', defaultParams: { threshold: 128 } },
  { type: 'thermal',       label: 'Thermal',       symbol: '🌡', defaultParams: {} },
];

const SIMPLIFY_FX: EffectDef[] = [
  { type: 'blur',        label: 'Blur',        symbol: '○', defaultParams: { blurRadius: 6 } },
  { type: 'field-blur',  label: 'Field',       symbol: '◐', defaultParams: { blurRadius: 18 } },
  { type: 'pixel',       label: 'Pixelate',    symbol: '⊞', defaultParams: { pixelSize: 12 } },
  { type: 'crystallize', label: 'Crystallize', symbol: '⬡', defaultParams: { pixelSize: 18 } },
];

const STYLIZE_FX: EffectDef[] = [
  { type: 'find-edges', label: 'Find Edges', symbol: '◿', defaultParams: { sharpenAmount: 50, edgeInvert: 1 } },
  { type: 'emboss',     label: 'Emboss',     symbol: '◳', defaultParams: { sharpenAmount: 60 } },
  { type: 'oil-paint',  label: 'Oil Paint',  symbol: '❋', defaultParams: { pixelSize: 6 } },
  { type: 'comic',      label: 'Comic',      symbol: '✎', defaultParams: { posterizeLevels: 4, threshold: 60 } },
  { type: 'crosshatch', label: 'Crosshatch', symbol: '⋕', defaultParams: { dotSize: 7, color1: '#14121F', color2: '#FFFCF5' } },
];

const PRINT_FX: EffectDef[] = [
  { type: 'halftone-dot',    label: 'Dot Grid',   symbol: '⊙', defaultParams: { dotSize: 10, color1: '#14121F', color2: '#FFFCF5' } },
  { type: 'halftone-circle', label: 'Concentric', symbol: '◎', defaultParams: { dotSize: 12, color1: '#2D3BCC', color2: '#14121F' } },
  { type: 'halftone-line',   label: 'Scanline',   symbol: '≡', defaultParams: { dotSize: 8,  color1: '#E83030', color2: '#14121F' } },
  { type: 'cmyk-halftone',   label: 'CMYK Print', symbol: '◍', defaultParams: { dotSize: 8 } },
  { type: 'risograph',       label: 'Risograph',  symbol: '⊕', defaultParams: { color1: '#FF1464', color2: '#00CFCF', dotSize: 8 } },
  { type: 'bitmap',          label: 'Bitmap',     symbol: '⊟', defaultParams: { pixelSize: 4, threshold: 128, color1: '#14121F', color2: '#FFFCF5' } },
  { type: 'dither',          label: 'Dither',     symbol: '▦', defaultParams: { color1: '#14121F', color2: '#F0EEE5' } },
  { type: 'ascii',           label: 'ASCII',      symbol: '@', defaultParams: { pixelSize: 8, color1: '#2D3BCC', color2: '#FFFCF5' } },
  { type: 'dot-matrix',      label: 'Dot Matrix', symbol: '⣿', defaultParams: { pixelSize: 10, color1: '#0A0A12' } },
  { type: 'stamp',           label: 'Stamp',      symbol: '⬡', defaultParams: { threshold: 160, color1: '#14121F', color2: '#FFFCF5' } },
  { type: 'text-mask',       label: 'Word Fill',  symbol: 'Aa', defaultParams: { textMaskFontSize: 12, textMaskText: '', color2: '#F5F1E8' } },
];

const DISTORT_FX: EffectDef[] = [
  { type: 'chromatic',    label: 'Chromatic',   symbol: '⊛', defaultParams: { chromaticStrength: 8 } },
  { type: 'vhs',          label: 'VHS Tape',    symbol: '▶', defaultParams: { vhsStrength: 60 } },
  { type: 'glass',        label: 'Glass Warp',  symbol: '◈', defaultParams: { glassStrength: 15 } },
  { type: 'motion-blur',  label: 'Motion',      symbol: '⇨', defaultParams: { blurAmount: 20, blurAngle: 0 } },
  { type: 'radial-blur',  label: 'Radial Zoom', symbol: '◉', defaultParams: { blurAmount: 15 } },
  { type: 'twirl',        label: 'Twirl',       symbol: '🌀', defaultParams: { twirlStrength: 45 } },
  { type: 'bulge',        label: 'Bulge',       symbol: '◯', defaultParams: { bulgeStrength: 50 } },
  { type: 'wave',         label: 'Wave',        symbol: '∿', defaultParams: { waveAmp: 12, waveFreq: 4 } },
  { type: 'kaleidoscope', label: 'Kaleidoscope', symbol: '❁', defaultParams: { kaleidoSegments: 6 } },
];

const GLITCH_FX: EffectDef[] = [
  { type: 'pixel-sort',   label: 'Pixel Sort',  symbol: '⇅', defaultParams: { sortThreshold: 90, sortVertical: 0 } },
  { type: 'slice-glitch', label: 'Slice Shift', symbol: '⧉', defaultParams: { sliceCount: 14, sliceOffset: 30 } },
  { type: 'jpeg-crush',   label: 'JPEG Crush',  symbol: '▩', defaultParams: { crushAmount: 65 } },
  { type: 'scanlines',    label: 'CRT Lines',   symbol: '☰', defaultParams: { scanGap: 3, scanStrength: 55 } },
  { type: 'channel-swap', label: 'Chan Swap',   symbol: '⇄', defaultParams: { channelMode: 0 } },
];

const LIGHT_FX: EffectDef[] = [
  { type: 'neon',       label: 'Neon Glow',  symbol: '✦', defaultParams: { neonColor: '#FFD600', neonStrength: 60 } },
  { type: 'vignette',   label: 'Vignette',   symbol: '◍', defaultParams: { vignetteStrength: 70 } },
  { type: 'bloom',      label: 'Bloom',      symbol: '❂', defaultParams: { bloomThreshold: 180, bloomStrength: 60 } },
  { type: 'light-leak', label: 'Light Leak', symbol: '◔', defaultParams: { leakColor: '#FF7A1A', leakStrength: 55, leakCorner: 0 } },
];

const FINAL_FX: EffectDef[] = [
  { type: 'sharpen',          label: 'Sharpen',        symbol: '◆', defaultParams: { sharpenAmount: 50 } },
  { type: 'polaroid',         label: 'Polaroid Frame', symbol: '▢', defaultParams: { polaroidStyle: 0, polaroidLabel: '' } },
  { type: 'vhs-frame',        label: 'VHS Frame',      symbol: '▶', defaultParams: {} },
  { type: 'texture-overlay',  label: 'Texture',        symbol: '⊡', defaultParams: { texturePreset: 0, textureOpacity: 35 } },
];

export interface EffectCategory {
  label: string;
  /** Accent colour — every effect from this group is tagged with it, so a
      stack of four effects reads as four distinguishable things at a glance. */
  color: string;
  defs: EffectDef[];
}

export const EFFECT_CATALOG: EffectCategory[] = [
  { label: 'Foundation', color: '#C8A200', defs: FOUNDATION_FX },
  { label: 'Color',      color: '#7C5CD6', defs: COLOR_FX },
  { label: 'Simplify',   color: '#2D8FCC', defs: SIMPLIFY_FX },
  { label: 'Stylize',    color: '#0E9BA8', defs: STYLIZE_FX },
  { label: 'Print',      color: '#157F3C', defs: PRINT_FX },
  { label: 'Distort',    color: '#D62B6B', defs: DISTORT_FX },
  { label: 'Glitch',     color: '#E8342C', defs: GLITCH_FX },
  { label: 'Light',      color: '#2D3BCC', defs: LIGHT_FX },
  { label: 'Final',      color: '#E06A1B', defs: FINAL_FX },
];

export const EFFECT_DEFS: EffectDef[] = EFFECT_CATALOG.flatMap((c) => c.defs);

export function effectLabel(type: EffectType): string {
  return EFFECT_DEFS.find((d) => d.type === type)?.label ?? type;
}

export function effectDef(type: EffectType): EffectDef | undefined {
  return EFFECT_DEFS.find((d) => d.type === type);
}

export function effectColor(type: EffectType): string {
  return EFFECT_CATALOG.find((c) => c.defs.some((d) => d.type === type))?.color ?? '#8A8898';
}
