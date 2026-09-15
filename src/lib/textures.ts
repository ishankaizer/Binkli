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

export type NotebookKey = 'grid' | 'ruled' | 'plain' | 'meadow' | 'dark';

export interface NotebookPaper {
  key: NotebookKey;
  label: string;
  /** Real paper photo used as the page surface. */
  texture: string;
  /** Backdrop behind the page — each paper carries its own. */
  backdrop: string;
  /** Whether to overlay CSS rule lines on top of the paper. */
  ruled?: boolean;
  /** Hide the red margin line (only notebook papers have one). */
  noMargin?: boolean;
}

export const NOTEBOOKS: NotebookPaper[] = [
  { key: 'grid', label: 'grid', texture: TEXTURES.gridCrumpled, backdrop: 'var(--bg)' },
  { key: 'ruled', label: 'ruled', texture: TEXTURES.cream, backdrop: 'var(--bg)', ruled: true },
  { key: 'plain', label: 'plain', texture: TEXTURES.cream, backdrop: 'var(--bg)' },
  // Real photograph (cow in a meadow) used as the page surface itself.
  { key: 'meadow', label: 'meadow', texture: TEXTURES.sceneMeadow, backdrop: '#1e3a6e', noMargin: true },
  { key: 'dark', label: 'dark', texture: TEXTURES.photocopy, backdrop: '#14121F', noMargin: true },
];
