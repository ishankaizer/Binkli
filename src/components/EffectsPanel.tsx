import { buildFilter, LAYERS, TONES, type LayerId, type PlacedImage, type ToneId } from '../lib/imageNode';
import { TEXTURES } from '../lib/textures';

interface EffectsPanelProps {
  image: PlacedImage | null;
  onUpdate: (id: string, patch: Partial<PlacedImage>) => void;
}

/** Small live-filtered preview of the selected photo, so chips show what they'll actually do. */
function Swatch({ src, tone, layer }: { src: string; tone?: ToneId; layer?: LayerId }) {
  const filter = buildFilter({
    tone: tone ?? 'none',
    layers: layer && layer !== 'polaroid' ? [{ id: layer, intensity: 70 }] : [],
  });
  return (
    <div className="fx-swatch">
      <img src={src} alt="" style={filter ? { filter } : undefined} draggable={false} />
      {layer === 'grain' && <div className="image-node-grain" style={{ opacity: 0.5 }} />}
      {layer === 'halftone' && <div className="image-node-halftone" style={{ opacity: 0.5 }} />}
      {layer === 'noise' && <div className="image-node-noise" style={{ opacity: 0.5 }} />}
      {layer === 'vignette' && <div className="image-node-vignette" style={{ opacity: 0.9 }} />}
    </div>
  );
}

/**
 * Effects panel. The left edge is a REAL torn-paper strip (scanned grain,
 * irregular alpha) — not a redrawn vector. When a photo is selected, shows
 * its tone (pick one), layers (stack freely), and intensity sliders for
 * whichever layers are currently active.
 */
export default function EffectsPanel({ image, onUpdate }: EffectsPanelProps) {
  const setTone = (tone: ToneId) => {
    if (!image) return;
    onUpdate(image.id, { tone: image.tone === tone ? 'none' : tone });
  };

  const toggleLayer = (id: LayerId) => {
    if (!image) return;
    const active = image.layers.find((l) => l.id === id);
    if (active) {
      onUpdate(image.id, { layers: image.layers.filter((l) => l.id !== id) });
    } else {
      const meta = LAYERS.find((l) => l.id === id)!;
      onUpdate(image.id, { layers: [...image.layers, { id, intensity: meta.defaultIntensity }] });
    }
  };

  const setIntensity = (id: LayerId, intensity: number) => {
    if (!image) return;
    onUpdate(image.id, { layers: image.layers.map((l) => (l.id === id ? { ...l, intensity } : l)) });
  };

  const activeTunable = image ? image.layers.filter((l) => LAYERS.find((m) => m.id === l.id)?.tunable) : [];

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
        <div className="panel-scroll">
          <div className="panel-group-label">tone</div>
          <div className="chip-grid">
            {TONES.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`effect-chip${image.tone === t.id ? ' is-active' : ''}`}
                onClick={() => setTone(t.id)}
              >
                <Swatch src={image.src} tone={t.id} />
                {t.label}
              </button>
            ))}
          </div>

          <div className="panel-group-label">layers</div>
          <div className="chip-grid">
            {LAYERS.map((l) => (
              <button
                key={l.id}
                type="button"
                className={`effect-chip${image.layers.some((a) => a.id === l.id) ? ' is-active' : ''}`}
                onClick={() => toggleLayer(l.id)}
              >
                <Swatch src={image.src} layer={l.id} />
                {l.label}
              </button>
            ))}
          </div>

          {activeTunable.length > 0 && (
            <>
              <div className="panel-group-label">adjust</div>
              <div className="fx-sliders">
                {activeTunable.map((l) => (
                  <div key={l.id} className="fx-slider-row">
                    <span className="fx-slider-label">{LAYERS.find((m) => m.id === l.id)?.label}</span>
                    <input
                      type="range"
                      min={5}
                      max={100}
                      value={l.intensity}
                      onChange={(e) => setIntensity(l.id, Number(e.target.value))}
                    />
                    <button
                      type="button"
                      className="fx-slider-remove"
                      onClick={() => toggleLayer(l.id)}
                      aria-label={`remove ${l.id}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </aside>
  );
}
