/**
 * Central registry of real texture assets (served from /public/textures).
 * Rule of the rebuild: these are REAL scanned/photographed papers used as-is.
 * Never redraw them as flat vector shapes.
 *
 * Drop new files into public/textures and add them here.
 */

export const TEXTURES = {
  gridCrumpled: '/textures/paper-grid-crumpled.jpg',
  cream: '/textures/paper-cream.jpg',
  photocopy: '/textures/paper-photocopy.jpg',
  sceneMeadow: '/textures/scene-meadow.jpg',
  tornCollage: '/textures/paper-torn-collage.jpg',
  polaroidFrame: '/textures/polaroid-frame.jpg',
  // Real torn-paper strips (scanned grain, irregular alpha edges).
  paperEdge: '/textures/paper-edge.png',       // vertical — panel seam
  paperDivider: '/textures/paper-divider.png', // horizontal — section dividers
} as const;

export type NotebookKey = 'grid' | 'ruled' | 'plain';

export interface NotebookPaper {
  key: NotebookKey;
  label: string;
  /** Real paper photo used as the page surface. */
  texture: string;
  /** Whether to overlay CSS rule lines on top of the paper. */
  ruled?: boolean;
}

export const NOTEBOOKS: NotebookPaper[] = [
  { key: 'grid', label: 'grid', texture: TEXTURES.gridCrumpled },
  { key: 'ruled', label: 'ruled', texture: TEXTURES.cream, ruled: true },
  { key: 'plain', label: 'plain', texture: TEXTURES.cream },
];

export type SceneKey = 'cream' | 'meadow' | 'dark';

export interface Scene {
  key: SceneKey;
  label: string;
  /** Backdrop behind the notebook page. */
  background: string;
}

export const SCENES: Scene[] = [
  { key: 'cream', label: 'cream', background: 'var(--bg)' },
  {
    key: 'meadow',
    label: 'meadow',
    // Real photograph (cow in a meadow) — an actual image, not a CSS gradient.
    background: `#1e3a6e url('${TEXTURES.sceneMeadow}') center/cover no-repeat`,
  },
  { key: 'dark', label: 'dark', background: '#14121F' },
];
