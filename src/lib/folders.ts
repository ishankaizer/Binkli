/**
 * Real folder-tab graphics — background removed into transparent PNGs
 * (scripts/cut_assets.py). Served from /public/folders. Used as the site's
 * folder cards (recipe / preset categories).
 */
export interface Folder {
  src: string;
  label: string;
  blurb: string;
}

const f = (name: string, label: string, blurb: string): Folder => ({
  src: `/folders/${name}.png`,
  label,
  blurb,
});

export const FOLDERS: Folder[] = [
  f('rabbits', 'soft focus', 'blurs, glows, dreamy edges'),
  f('checker-stars', 'riso pop', 'halftone, duotone, spot colour'),
  f('crocodile', 'cutouts', 'isolate & mask your subject'),
  f('star-horse', 'grunge', 'noise, dust, photocopy grit'),
  f('strawberry', 'vintage', 'polaroid, VHS, faded film'),
  f('fragile', 'glitch', 'chromatic, displace, ripple'),
  f('fur-stars', 'dreamcore', 'soft surreal, hazy pastel'),
  f('caterpillar-green', 'storybook', 'collage, warm, hand-made'),
  f('monkey-corduroy', 'scrapbook', 'tape, stickers, doodles'),
  f('caterpillars', 'critters', 'playful, silly, fun'),
  f('dachshund', 'retro print', 'old postcard, letterpress'),
];
