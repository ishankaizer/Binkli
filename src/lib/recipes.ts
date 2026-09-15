import type { EffectLayer } from './effects';

/**
 * Preset effect stacks, ported from the pre-rebuild app
 * (binkli-reference/app/lib/recipes.ts). Each one is a tuned, ordered stack —
 * applying a recipe replaces the selected photo's stack and grain.
 *
 * `folder` names the real folder-tab PNG used as the card art (public/folders).
 */
export interface Recipe {
  id: string;
  name: string;
  tag: string;
  description: string;
  folder: string;
  effectStack: Omit<EffectLayer, 'id'>[];
  grain: number;
}

export const RECIPES: Recipe[] = [
  {
    id: 'cyberpunk-newspaper',
    name: 'Cyberpunk Newspaper',
    tag: 'PRINT',
    description: 'fine cyan dots on dark + strong chromatic shift',
    folder: 'checker-stars',
    effectStack: [
      { type: 'halftone-dot', opacity: 1,   params: { dotSize: 6, color1: '#00E5FF', color2: '#050510' } },
      { type: 'chromatic',    opacity: 0.9, params: { chromaticStrength: 16 } },
      { type: 'vignette',     opacity: 0.5, params: { vignetteStrength: 40 } },
    ],
    grain: 32,
  },
  {
    id: 'bootleg-manga',
    name: 'Bootleg Manga',
    tag: 'PRINT',
    description: '2px bitmap dither + scanline overlay',
    folder: 'crocodile',
    effectStack: [
      { type: 'bitmap',        opacity: 1,   params: { pixelSize: 2, threshold: 125, color1: '#0A0A0F', color2: '#F0EEE5' } },
      { type: 'halftone-line', opacity: 0.2, params: { dotSize: 4, color1: '#000000', color2: '#F0EEE5' } },
    ],
    grain: 18,
  },
  {
    id: 'photocopier-hell',
    name: 'Photocopier Hell',
    tag: 'DESTROY',
    description: 'over-exposed stamp + destructive threshold',
    folder: 'star-horse',
    effectStack: [
      { type: 'stamp',     opacity: 1,   params: { threshold: 148, color1: '#111111', color2: '#FFFFF0' } },
      { type: 'threshold', opacity: 0.6, params: { threshold: 100, color1: '#111111', color2: '#F5F5EE' } },
    ],
    grain: 62,
  },
  {
    id: 'punk-flyer',
    name: 'Underground Punk Flyer',
    tag: 'PUNK',
    description: 'aggressive red duotone + large concentric halftone',
    folder: 'fragile',
    effectStack: [
      { type: 'duotone',         opacity: 1,    params: { color1: '#DD2000', color2: '#FFF5E0' } },
      { type: 'halftone-circle', opacity: 0.52, params: { dotSize: 14, color1: '#111111', color2: '#FFF5E0' } },
    ],
    grain: 28,
  },
  {
    id: 'risograph-print',
    name: 'Risograph Print',
    tag: 'RISO',
    description: '2-colour riso with misregistration offset',
    folder: 'strawberry',
    effectStack: [
      { type: 'risograph', opacity: 1, params: { color1: '#FF1464', color2: '#00CFCF', dotSize: 8 } },
    ],
    grain: 22,
  },
  {
    id: 'crt-damage',
    name: 'CRT Damage',
    tag: 'GLITCH',
    description: 'neon glow + heavy chromatic + edge burn',
    folder: 'fur-stars',
    effectStack: [
      { type: 'neon',      opacity: 1,    params: { neonColor: '#AAFF00', neonStrength: 85 } },
      { type: 'chromatic', opacity: 0.85, params: { chromaticStrength: 22 } },
      { type: 'vignette',  opacity: 1,    params: { vignetteStrength: 75 } },
    ],
    grain: 22,
  },
  {
    id: 'corrupted-memory',
    name: 'Corrupted Memory',
    tag: 'GLITCH',
    description: 'heavy pixelation + glass warp + chromatic bleed',
    folder: 'caterpillars',
    effectStack: [
      { type: 'pixel',     opacity: 1,    params: { pixelSize: 18 } },
      { type: 'glass',     opacity: 0.85, params: { glassStrength: 25 } },
      { type: 'chromatic', opacity: 0.65, params: { chromaticStrength: 12 } },
    ],
    grain: 22,
  },
  {
    id: 'vhs-rewind',
    name: 'VHS Rewind',
    tag: 'ANALOG',
    description: 'tape artifacts + colour bleed + edge burn',
    folder: 'dachshund',
    effectStack: [
      { type: 'vhs',       opacity: 1,   params: { vhsStrength: 68 } },
      { type: 'chromatic', opacity: 0.6, params: { chromaticStrength: 14 } },
      { type: 'vignette',  opacity: 0.7, params: { vignetteStrength: 60 } },
    ],
    grain: 35,
  },
  {
    id: 'bayer-dream',
    name: 'Bayer Dream',
    tag: 'DIGITAL',
    description: 'ordered Bayer dithering — digital pixel poetry',
    folder: 'monkey-corduroy',
    effectStack: [
      { type: 'dither', opacity: 1, params: { color1: '#0A0A14', color2: '#E8F4FF' } },
    ],
    grain: 8,
  },
  {
    id: 'y2k-album',
    name: 'Y2K Album Cover',
    tag: 'Y2K',
    description: 'violet gradient + chromatic',
    folder: 'rabbits',
    effectStack: [
      { type: 'gradient-map', opacity: 1,   params: { gradientPreset: 3 } },
      { type: 'chromatic',    opacity: 0.5, params: { chromaticStrength: 10 } },
    ],
    grain: 12,
  },
  {
    id: 'cross-processed',
    name: 'Cross-Processed',
    tag: 'FILM',
    description: 'E6-in-C41 film development — saturated shift',
    folder: 'caterpillar-green',
    effectStack: [
      { type: 'cross-process', opacity: 1,   params: {} },
      { type: 'chromatic',     opacity: 0.4, params: { chromaticStrength: 6 } },
      { type: 'vignette',      opacity: 0.6, params: { vignetteStrength: 50 } },
    ],
    grain: 16,
  },
  {
    id: 'bleach-bypass',
    name: 'Bleach Bypass',
    tag: 'FILM',
    description: 'silver retention — desaturated high contrast',
    folder: 'checker-stars',
    effectStack: [
      { type: 'bleach-bypass', opacity: 1,   params: { vignetteStrength: 80 } },
      { type: 'vignette',      opacity: 0.8, params: { vignetteStrength: 65 } },
    ],
    grain: 28,
  },
  {
    id: 'midnight-noir',
    name: 'Midnight Noir',
    tag: 'FILM',
    description: 'B&W gradient + strong vignette + heavy grain',
    folder: 'crocodile',
    effectStack: [
      { type: 'gradient-map', opacity: 1, params: { gradientPreset: 7 } },
      { type: 'vignette',     opacity: 1, params: { vignetteStrength: 85 } },
    ],
    grain: 45,
  },
  {
    id: 'thermal-scan',
    name: 'Thermal Scan',
    tag: 'DATA',
    description: 'heat map gradient + fine halftone',
    folder: 'star-horse',
    effectStack: [
      { type: 'gradient-map', opacity: 1,   params: { gradientPreset: 8 } },
      { type: 'halftone-dot', opacity: 0.5, params: { dotSize: 5, color1: '#FF4400', color2: '#000000' } },
    ],
    grain: 18,
  },
  {
    id: 'ink-bleed',
    name: 'Ink Bleed',
    tag: 'ANALOG',
    description: 'dual-colour overprint + stamp texture',
    folder: 'fragile',
    effectStack: [
      { type: 'overprint', opacity: 1,    params: { color1: '#111111', color2: '#00D4FF' } },
      { type: 'stamp',     opacity: 0.38, params: { threshold: 178, color1: '#000000', color2: '#FAF6EE' } },
    ],
    grain: 38,
  },
  {
    id: 'riso-ghost',
    name: 'Riso Ghost',
    tag: 'RISO',
    description: 'sunset gradient + halftone dot overlay',
    folder: 'strawberry',
    effectStack: [
      { type: 'gradient-map', opacity: 1,    params: { gradientPreset: 0 } },
      { type: 'halftone-dot', opacity: 0.62, params: { dotSize: 9, color1: '#FF5500', color2: '#0A0A0F' } },
      { type: 'chromatic',    opacity: 0.4,  params: { chromaticStrength: 6 } },
    ],
    grain: 24,
  },
  {
    id: 'ocean-data',
    name: 'Ocean Data',
    tag: 'DATA',
    description: 'deep ocean gradient + ASCII character grid',
    folder: 'fur-stars',
    effectStack: [
      { type: 'gradient-map', opacity: 1,    params: { gradientPreset: 1 } },
      { type: 'ascii',        opacity: 0.65, params: { pixelSize: 10, color1: '#00E5FF', color2: '#000814' } },
    ],
    grain: 20,
  },
  {
    id: 'chrome-future',
    name: 'Chrome Future',
    tag: 'SCI-FI',
    description: 'chrome gradient + purple neon + subtle shift',
    folder: 'caterpillars',
    effectStack: [
      { type: 'gradient-map', opacity: 1,   params: { gradientPreset: 6 } },
      { type: 'neon',         opacity: 0.5, params: { neonColor: '#8B5CF6', neonStrength: 38 } },
      { type: 'chromatic',    opacity: 0.4, params: { chromaticStrength: 6 } },
    ],
    grain: 14,
  },
];

/** Materialises a recipe into a live stack (fresh layer ids). */
export function applyRecipe(recipe: Recipe): { effectStack: EffectLayer[]; grain: number } {
  return {
    effectStack: recipe.effectStack.map((l) => ({ ...l, id: crypto.randomUUID() })),
    grain: recipe.grain,
  };
}
