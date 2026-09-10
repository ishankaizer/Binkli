/**
 * Real die-cut stickers — background removed from the reference scans into
 * transparent PNGs (see scripts/cut_assets.py). Served from /public/stickers.
 * These are actual images, never CSS recreations.
 */
export interface Sticker {
  src: string;
  label: string;
}

const s = (name: string, label: string): Sticker => ({
  src: `/stickers/${name}.png`,
  label,
});

export const STICKERS: Sticker[] = [
  s('trex', 'crayon t-rex'),
  s('fish-starburst', 'starburst fish'),
  s('fish-ok', 'ok fish'),
  s('fishman-run', 'running fish-man'),
  s('nugget', 'happy nugget'),
  s('cat-pink', 'pink cat'),
  s('caterpillar-clown', 'clown caterpillar'),
  s('shark-toilet', 'toilet shark'),
  s('monkey-yellow', 'yellow monkey'),
  s('monkey-red', 'red monkey'),
  s('tiger-leap', 'leaping tiger'),
  s('tiger-fat', 'fat tiger'),
  s('tomato', 'tomato guy'),
  s('monster-eye', 'one-eye monster'),
  s('star-face', 'screaming star'),
  s('frog', 'green frog'),
  s('dragon-blue', 'blue dragon'),
  s('sponge-doodle', 'sponge doodle'),
  s('worms', 'wiggle worms'),
];

/** Pick n distinct stickers starting at an offset (stable, no repeats). */
export function pickStickers(n: number, offset = 0): Sticker[] {
  const out: Sticker[] = [];
  for (let i = 0; i < n && i < STICKERS.length; i++) {
    out.push(STICKERS[(offset + i) % STICKERS.length]);
  }
  return out;
}
