import { TEXTURES } from '../lib/textures';

/**
 * Effects panel (Step 2 shell). The left edge is a REAL torn-paper strip
 * (scanned grain, irregular alpha) — not a redrawn vector. Stackable effect
 * controls arrive in Step 5; this is the frame.
 */
export default function EffectsPanel() {
  return (
    <aside className="effects-panel">
      <img className="panel-tear" src={TEXTURES.paperEdge} alt="" aria-hidden />

      <div className="panel-title">effects</div>
      <div className="panel-sub">stack · blend · break</div>

      <img className="panel-divider" src={TEXTURES.paperDivider} alt="" aria-hidden />

      <div className="panel-slot">
        pick an image, then pile on effects here — blur, halftone, polaroid, VHS, riso…
      </div>
    </aside>
  );
}
