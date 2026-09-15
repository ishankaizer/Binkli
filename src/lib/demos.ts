import type { PlacedImage } from './imageNode';
import { DEFAULT_CUTOUT } from './cutout';

/**
 * Seeds the page with a few placed photos on first load, so it never opens
 * empty. Unlike the pre-rebuild app's demos.ts (procedurally drawn shapes),
 * these use the real sticker/folder scans already in public/ — see the
 * README's "Real assets, not vectors" rule.
 */
export function generateDemos(): PlacedImage[] {
  const specs: Array<{
    src: string; w: number; h: number; x: number; y: number; rot: number; grain: number;
    layers: PlacedImage['effectStack'];
  }> = [
    {
      src: '/folders/caterpillars.png', w: 190, h: 190, x: 40, y: 60, rot: -4, grain: 12,
      layers: [{ id: 'demo-1a', type: 'halftone-dot', opacity: 1, visible: true, params: { dotSize: 8, color1: '#14121F', color2: '#FFFCF5' } }],
    },
    {
      src: '/folders/strawberry.png', w: 170, h: 170, x: 260, y: 40, rot: 5, grain: 0,
      layers: [{ id: 'demo-2a', type: 'duotone', opacity: 1, visible: true, params: { color1: '#2D3BCC', color2: '#FAF6EE' } }],
    },
    {
      src: '/folders/fur-stars.png', w: 210, h: 170, x: 460, y: 70, rot: -2, grain: 18,
      layers: [
        { id: 'demo-3a', type: 'gradient-map', opacity: 1, visible: true, params: { gradientPreset: 0 } },
        { id: 'demo-3b', type: 'halftone-line', opacity: 0.5, visible: true, params: { dotSize: 6, color1: '#FF3D9A', color2: 'transparent' } },
      ],
    },
    {
      src: '/folders/checker-stars.png', w: 180, h: 180, x: 90, y: 300, rot: 3, grain: 0,
      layers: [{ id: 'demo-4a', type: 'overprint', opacity: 1, visible: true, params: { color1: '#E63329', color2: '#2D3BCC' } }],
    },
    {
      src: '/folders/crocodile.png', w: 200, h: 150, x: 320, y: 300, rot: -3, grain: 8,
      layers: [{ id: 'demo-5a', type: 'neon', opacity: 1, visible: true, params: { neonColor: '#00E5CC', neonStrength: 70 } }],
    },
  ];

  return specs.map((s, i) => ({
    id: `demo-${i}`,
    src: s.src,
    x: s.x,
    y: s.y,
    width: s.w,
    height: s.h,
    rotation: s.rot,
    effectStack: s.layers,
    grain: s.grain,
    cutout: DEFAULT_CUTOUT,
  }));
}
