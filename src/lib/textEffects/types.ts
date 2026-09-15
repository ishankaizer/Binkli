// Shared types + catalog for text nodes. See index.ts for renderTextCanvas
// and docs/effects-engine.md for how this folder is organized.

export type TextEffectType =
  // classics
  | 'plain' | 'outline' | 'shadow' | 'long-shadow' | 'extrude' | 'letterpress'
  | 'neon' | 'gradient' | 'motion' | 'zoom'
  // current
  | 'chromatic' | 'bubble' | 'chrome' | 'sticker' | 'glitch' | 'halftone'
  | 'varsity' | 'marker' | 'arc' | 'rainbow' | 'echo' | 'ransom';

export type TextFontKey =
  | 'marker' | 'hand' | 'hand2' | 'sans' | 'mono'
  | 'caveat' | 'shadows' | 'architects' | 'gochi' | 'indie'
  | 'amatic' | 'bangers' | 'special-elite' | 'rock-salt' | 'bebas' | 'anton' | 'satisfy';

export interface TextConfig {
  text: string;
  font: TextFontKey;
  /** Cap height in px, in node-local space. */
  size: number;
  color: string;
  color2: string;
  effect: TextEffectType;
  /** Generic 0..100 intensity knob, meaning depends on the effect. */
  strength: number;
  align: CanvasTextAlign;
}

export const TEXT_FONTS: { key: TextFontKey; label: string; family: string; weight: string }[] = [
  { key: 'marker',       label: 'Marker',    family: '"Permanent Marker", cursive', weight: '400' },
  { key: 'hand',         label: 'Kalam',     family: '"Kalam", cursive', weight: '700' },
  { key: 'hand2',        label: 'Patrick',   family: '"Patrick Hand", cursive', weight: '400' },
  { key: 'caveat',       label: 'Caveat',    family: '"Caveat", cursive', weight: '700' },
  { key: 'shadows',      label: 'Shadows',   family: '"Shadows Into Light", cursive', weight: '400' },
  { key: 'architects',   label: 'Architect', family: '"Architects Daughter", cursive', weight: '400' },
  { key: 'gochi',        label: 'Gochi',     family: '"Gochi Hand", cursive', weight: '400' },
  { key: 'indie',        label: 'Indie',     family: '"Indie Flower", cursive', weight: '400' },
  { key: 'satisfy',      label: 'Satisfy',   family: '"Satisfy", cursive', weight: '400' },
  { key: 'amatic',       label: 'Amatic',    family: '"Amatic SC", cursive', weight: '700' },
  { key: 'bangers',      label: 'Bangers',   family: '"Bangers", cursive', weight: '400' },
  { key: 'special-elite', label: 'Typewriter', family: '"Special Elite", cursive', weight: '400' },
  { key: 'rock-salt',    label: 'Rock Salt', family: '"Rock Salt", cursive', weight: '400' },
  { key: 'bebas',        label: 'Bebas',     family: '"Bebas Neue", sans-serif', weight: '400' },
  { key: 'anton',        label: 'Anton',     family: '"Anton", sans-serif', weight: '400' },
  { key: 'sans',         label: 'Jakarta',   family: '"Plus Jakarta Sans", system-ui, sans-serif', weight: '800' },
  { key: 'mono',         label: 'Plex Mono', family: '"IBM Plex Mono", monospace', weight: '600' },
];

export interface TextEffectDef {
  type: TextEffectType;
  label: string;
  group: string;
  /** What the strength slider actually does, shown under the slider. */
  strengthLabel: string;
}

export const TEXT_EFFECTS: TextEffectDef[] = [
  { type: 'plain',       label: 'Plain',       group: 'Basics',  strengthLabel: 'unused' },
  { type: 'outline',     label: 'Outline',     group: 'Basics',  strengthLabel: 'stroke weight' },
  { type: 'shadow',      label: 'Hard Shadow', group: 'Basics',  strengthLabel: 'offset' },
  { type: 'long-shadow', label: 'Long Shadow', group: 'Basics',  strengthLabel: 'length' },
  { type: 'marker',      label: 'Highlighter', group: 'Basics',  strengthLabel: 'marker height' },
  { type: 'sticker',     label: 'Die-Cut',     group: 'Basics',  strengthLabel: 'cut width' },

  { type: 'extrude',     label: '3D Extrude',  group: 'Dimension', strengthLabel: 'depth' },
  { type: 'bubble',      label: 'Bubble',      group: 'Dimension', strengthLabel: 'inflation' },
  { type: 'letterpress', label: 'Letterpress', group: 'Dimension', strengthLabel: 'press depth' },
  { type: 'chrome',      label: 'Chrome',      group: 'Dimension', strengthLabel: 'polish' },
  { type: 'varsity',     label: 'Varsity',     group: 'Dimension', strengthLabel: 'outline weight' },

  { type: 'neon',        label: 'Neon',        group: 'Light',   strengthLabel: 'glow' },
  { type: 'gradient',    label: 'Gradient',    group: 'Light',   strengthLabel: 'angle' },
  { type: 'rainbow',     label: 'Rainbow',     group: 'Light',   strengthLabel: 'band spread' },

  { type: 'motion',      label: 'Motion Blur', group: 'Motion',  strengthLabel: 'distance' },
  { type: 'zoom',        label: 'Radial Blur', group: 'Motion',  strengthLabel: 'zoom' },
  { type: 'echo',        label: 'Echo',        group: 'Motion',  strengthLabel: 'spread' },
  { type: 'arc',         label: 'Arc',         group: 'Motion',  strengthLabel: 'curve' },

  { type: 'chromatic',   label: 'Chromatic',   group: 'Broken',  strengthLabel: 'split' },
  { type: 'glitch',      label: 'Glitch',      group: 'Broken',  strengthLabel: 'displacement' },
  { type: 'halftone',    label: 'Halftone',    group: 'Broken',  strengthLabel: 'dot size' },
  { type: 'ransom',      label: 'Ransom Note', group: 'Broken',  strengthLabel: 'chaos' },
];

export const TEXT_EFFECT_GROUPS = ['Basics', 'Dimension', 'Light', 'Motion', 'Broken'];

export function textEffectLabel(type: TextEffectType): string {
  return TEXT_EFFECTS.find((t) => t.type === type)?.label ?? type;
}

export function defaultTextConfig(): TextConfig {
  return {
    text: 'make it\nweird.',
    font: 'marker',
    size: 64,
    color: '#14121F',
    color2: '#E83030',
    effect: 'plain',
    strength: 50,
    align: 'center',
  };
}
