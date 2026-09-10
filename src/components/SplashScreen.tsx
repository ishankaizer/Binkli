import { motion } from 'framer-motion';
import { STICKERS } from '../lib/stickers';
import { TEXTURES } from '../lib/textures';

interface SplashScreenProps {
  onStart: () => void;
}

// Scattered floating stickers around the headline. Each bobs on its own clock.
const FLOATERS = [
  { slug: 'trex', top: '12%', left: '8%', w: 140, rot: -8, dur: 5.5 },
  { slug: 'star-face', top: '20%', left: '82%', w: 96, rot: 12, dur: 4.4 },
  { slug: 'cat-pink', top: '62%', left: '6%', w: 120, rot: 6, dur: 6.2 },
  { slug: 'fish-ok', top: '70%', left: '84%', w: 128, rot: -10, dur: 5.0 },
  { slug: 'nugget', top: '8%', left: '54%', w: 84, rot: 9, dur: 4.8 },
  { slug: 'monkey-red', top: '78%', left: '40%', w: 96, rot: -6, dur: 5.8 },
  { slug: 'shark-toilet', top: '46%', left: '90%', w: 78, rot: 8, dur: 6.6 },
  { slug: 'tomato', top: '40%', left: '2%', w: 84, rot: -12, dur: 5.2 },
  { slug: 'dragon-blue', top: '84%', left: '66%', w: 110, rot: 5, dur: 4.6 },
  { slug: 'frog', top: '30%', left: '70%', w: 70, rot: -14, dur: 6.0 },
];

const find = (slug: string) => STICKERS.find((s) => s.src.includes(`/${slug}.png`))!;

export default function SplashScreen({ onStart }: SplashScreenProps) {
  return (
    <motion.div
      className="splash"
      style={{ backgroundImage: `url('${TEXTURES.gridCrumpled}')` }}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.4 } }}
    >
      <div className="splash-wash" />

      {FLOATERS.map((f) => {
        const st = find(f.slug);
        return (
          <motion.img
            key={f.slug}
            className="splash-floater"
            src={st.src}
            alt={st.label}
            style={{ top: f.top, left: f.left, width: f.w }}
            initial={{ rotate: f.rot, y: 0 }}
            animate={{ y: [0, -16, 0], rotate: [f.rot, f.rot + 3, f.rot] }}
            transition={{ duration: f.dur, repeat: Infinity, ease: 'easeInOut' }}
          />
        );
      })}

      <div className="splash-center">
        <div className="splash-kicker">a mixed-media image studio</div>
        <h1 className="splash-title">make it weird.</h1>
        <p className="splash-sub">
          drop a photo on the page, then pile on tape, stickers, torn paper and
          filthy little filters.
        </p>

        <div className="splash-actions">
          <button className="splash-start" onClick={onStart}>
            drop an image
          </button>
          <button className="splash-skip" onClick={onStart}>
            or just poke around →
          </button>
        </div>
      </div>
    </motion.div>
  );
}
