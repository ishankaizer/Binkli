import { STICKERS } from '../lib/stickers';

/**
 * Ambient scrapbook decor on the notebook page — washi tape plus REAL die-cut
 * sticker images (background-removed scans). Decorative only; above the paper,
 * below image nodes.
 */
const bySlug = (slug: string) => STICKERS.find((s) => s.src.includes(`/${slug}.png`))!;

const PLACED = [
  { slug: 'trex', top: '6%', left: '60%', w: 130, rot: 7 },
  { slug: 'star-face', top: '13%', left: '12%', w: 74, rot: -12 },
  { slug: 'fish-ok', top: '70%', left: '16%', w: 96, rot: -8 },
  { slug: 'cat-pink', top: '64%', left: '74%', w: 96, rot: 6 },
];

export default function CanvasDecor() {
  return (
    <>
      <div className="washi pink" style={{ top: 18, left: '30%', transform: 'rotate(-7deg)' }} />
      <div className="washi mint" style={{ bottom: 40, right: '18%', transform: 'rotate(5deg)' }} />

      {PLACED.map((p) => {
        const st = bySlug(p.slug);
        return (
          <img
            key={p.slug}
            className="canvas-sticker"
            src={st.src}
            alt={st.label}
            style={{
              top: p.top,
              left: p.left,
              width: p.w,
              transform: `rotate(${p.rot}deg)`,
            }}
          />
        );
      })}

      <div className="doodle-note" style={{ bottom: '10%', right: '30%', fontSize: 22 }}>
        moo.
      </div>
    </>
  );
}
