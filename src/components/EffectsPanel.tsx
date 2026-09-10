import { LAYERS, TONES, type LayerId, type PlacedImage, type ToneId } from '../lib/imageNode';
import { TEXTURES } from '../lib/textures';

interface EffectsPanelProps {
  image: PlacedImage | null;
  onUpdate: (id: string, patch: Partial<PlacedImage>) => void;
}

/**
 * Effects panel. The left edge is a REAL torn-paper strip (scanned grain,
 * irregular alpha) — not a redrawn vector. When a photo is selected, shows
 * its tone (pick one) and layers (stack freely) controls.
 */
export default function EffectsPanel({ image, onUpdate }: EffectsPanelProps) {
  const setTone = (tone: ToneId) => {
    if (!image) return;
    onUpdate(image.id, { tone: image.tone === tone ? 'none' : tone });
  };

  const toggleLayer = (layer: LayerId) => {
    if (!image) return;
    const has = image.layers.includes(layer);
    onUpdate(image.id, {
      layers: has ? image.layers.filter((l) => l !== layer) : [...image.layers, layer],
    });
  };

  return (
    <aside className="effects-panel">
      <img className="panel-tear" src={TEXTURES.paperEdge} alt="" aria-hidden />

      <div className="panel-title">effects</div>
      <div className="panel-sub">stack · blend · break</div>

      <img className="panel-divider" src={TEXTURES.paperDivider} alt="" aria-hidden />

      {!image ? (
        <div className="panel-slot">
          pick an image, then pile on effects here — blur, halftone, polaroid, VHS, riso…
        </div>
      ) : (
        <>
          <div className="panel-group-label">tone</div>
          <div className="chip-row">
            {TONES.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`effect-chip${image.tone === t.id ? ' is-active' : ''}`}
                onClick={() => setTone(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="panel-group-label">layers</div>
          <div className="chip-row">
            {LAYERS.map((l) => (
              <button
                key={l.id}
                type="button"
                className={`effect-chip${image.layers.includes(l.id) ? ' is-active' : ''}`}
                onClick={() => toggleLayer(l.id)}
              >
                {l.label}
              </button>
            ))}
          </div>
        </>
      )}
    </aside>
  );
}
