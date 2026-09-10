import { EFFECT_CATALOG, effectLabel } from '../lib/effectCatalog';
import { GRADIENT_MAP_PRESETS, type EffectLayer, type EffectParams } from '../lib/effects';
import type { PlacedImage } from '../lib/imageNode';
import { TEXTURES } from '../lib/textures';

interface EffectsPanelProps {
  image: PlacedImage | null;
  onUpdate: (id: string, patch: Partial<PlacedImage>) => void;
}

type ParamKey = keyof EffectParams;

interface ParamConfig {
  label: string;
  type: 'number' | 'color' | 'select' | 'text';
  min?: number;
  max?: number;
  step?: number;
  options?: { label: string; value: number }[];
}

const PARAM_CONFIG: Partial<Record<ParamKey, ParamConfig>> = {
  dotSize: { label: 'dot size', type: 'number', min: 2, max: 40, step: 1 },
  color1: { label: 'color 1', type: 'color' },
  color2: { label: 'color 2', type: 'color' },
  gradientPreset: {
    label: 'preset', type: 'select',
    options: GRADIENT_MAP_PRESETS.map((p, i) => ({ label: p.name, value: i })),
  },
  pixelSize: { label: 'pixel size', type: 'number', min: 2, max: 40, step: 1 },
  glassStrength: { label: 'strength', type: 'number', min: 0, max: 40, step: 1 },
  chromaticStrength: { label: 'strength', type: 'number', min: 0, max: 30, step: 1 },
  threshold: { label: 'threshold', type: 'number', min: 0, max: 255, step: 1 },
  neonColor: { label: 'neon color', type: 'color' },
  neonStrength: { label: 'strength', type: 'number', min: 0, max: 100, step: 1 },
  blurRadius: { label: 'radius', type: 'number', min: 0, max: 40, step: 1 },
  blurAngle: { label: 'angle', type: 'number', min: 0, max: 360, step: 1 },
  blurAmount: { label: 'amount', type: 'number', min: 0, max: 60, step: 1 },
  vignetteStrength: { label: 'strength', type: 'number', min: 0, max: 100, step: 1 },
  vhsStrength: { label: 'strength', type: 'number', min: 0, max: 100, step: 1 },
  exposureValue: { label: 'exposure', type: 'number', min: -100, max: 100, step: 1 },
  contrastValue: { label: 'contrast', type: 'number', min: -100, max: 100, step: 1 },
  brightnessValue: { label: 'brightness', type: 'number', min: -100, max: 100, step: 1 },
  saturationValue: { label: 'saturation', type: 'number', min: -100, max: 100, step: 1 },
  hueShift: { label: 'hue shift', type: 'number', min: -180, max: 180, step: 1 },
  posterizeLevels: { label: 'levels', type: 'number', min: 2, max: 16, step: 1 },
  sharpenAmount: { label: 'amount', type: 'number', min: 0, max: 100, step: 1 },
  polaroidStyle: {
    label: 'style', type: 'select',
    options: [{ label: 'white', value: 0 }, { label: 'vintage', value: 1 }, { label: 'dark', value: 2 }],
  },
  polaroidLabel: { label: 'caption', type: 'text' },
  textMaskFontSize: { label: 'font size', type: 'number', min: 6, max: 24, step: 1 },
  texturePreset: {
    label: 'preset', type: 'select',
    options: [{ label: 'grain', value: 0 }, { label: 'scanner', value: 1 }, { label: 'crumple', value: 2 }, { label: 'film', value: 3 }],
  },
  textureOpacity: { label: 'opacity', type: 'number', min: 0, max: 100, step: 1 },
};

function ParamRow({ paramKey, value, onChange }: { paramKey: ParamKey; value: unknown; onChange: (v: string | number) => void }) {
  const cfg = PARAM_CONFIG[paramKey];
  if (!cfg) return null;

  if (cfg.type === 'color') {
    return (
      <label className="fx-param-row">
        <span>{cfg.label}</span>
        <input type="color" value={String(value)} onChange={(e) => onChange(e.target.value)} />
      </label>
    );
  }
  if (cfg.type === 'select') {
    return (
      <label className="fx-param-row">
        <span>{cfg.label}</span>
        <select value={Number(value)} onChange={(e) => onChange(Number(e.target.value))}>
          {cfg.options!.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </label>
    );
  }
  if (cfg.type === 'text') {
    return (
      <label className="fx-param-row">
        <span>{cfg.label}</span>
        <input type="text" value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />
      </label>
    );
  }
  return (
    <label className="fx-param-row">
      <span>{cfg.label}</span>
      <input
        type="range"
        min={cfg.min}
        max={cfg.max}
        step={cfg.step}
        value={Number(value)}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span className="fx-param-value">{Math.round(Number(value))}</span>
    </label>
  );
}

/**
 * Effects panel — a real ordered, raster (canvas) effect stack, Photoshop-
 * style: reordering layers changes the result, since each layer composites
 * onto the output of the one before it (see lib/effects.ts + ImageNode.tsx).
 * Deliberately plain-looking for now; visual design is being decided later.
 */
export default function EffectsPanel({ image, onUpdate }: EffectsPanelProps) {
  const addLayer = (type: EffectLayer['type'], defaultParams: EffectParams) => {
    if (!image) return;
    const layer: EffectLayer = { id: crypto.randomUUID(), type, opacity: 1, params: { ...defaultParams } };
    onUpdate(image.id, { effectStack: [...image.effectStack, layer] });
  };

  const removeLayer = (id: string) => {
    if (!image) return;
    onUpdate(image.id, { effectStack: image.effectStack.filter((l) => l.id !== id) });
  };

  const moveLayer = (id: string, dir: -1 | 1) => {
    if (!image) return;
    const i = image.effectStack.findIndex((l) => l.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= image.effectStack.length) return;
    const next = [...image.effectStack];
    [next[i], next[j]] = [next[j], next[i]];
    onUpdate(image.id, { effectStack: next });
  };

  const setOpacity = (id: string, opacity: number) => {
    if (!image) return;
    onUpdate(image.id, { effectStack: image.effectStack.map((l) => (l.id === id ? { ...l, opacity } : l)) });
  };

  const setParam = (id: string, key: ParamKey, value: string | number) => {
    if (!image) return;
    onUpdate(image.id, {
      effectStack: image.effectStack.map((l) =>
        l.id === id ? { ...l, params: { ...l.params, [key]: value } } : l
      ),
    });
  };

  const setGrain = (grain: number) => {
    if (!image) return;
    onUpdate(image.id, { grain });
  };

  return (
    <aside className="effects-panel">
      <img className="panel-tear" src={TEXTURES.paperEdge} alt="" aria-hidden />

      <div className="panel-title">effects</div>
      <div className="panel-sub">stack · blend · break</div>

      <img className="panel-divider" src={TEXTURES.paperDivider} alt="" aria-hidden />

      {!image ? (
        <div className="panel-slot">
          pick an image, then pile on effects here — order matters, just like Photoshop layers.
        </div>
      ) : (
        <div className="panel-scroll">
          {image.effectStack.length > 0 && (
            <>
              <div className="panel-group-label">stack (top = applied first)</div>
              <div className="fx-stack">
                {image.effectStack.map((layer, i) => (
                  <div key={layer.id} className="fx-layer">
                    <div className="fx-layer-head">
                      <span className="fx-layer-index">{i + 1}</span>
                      <span className="fx-layer-name">{effectLabel(layer.type)}</span>
                      <button type="button" onClick={() => moveLayer(layer.id, -1)} disabled={i === 0} aria-label="move up">↑</button>
                      <button
                        type="button"
                        onClick={() => moveLayer(layer.id, 1)}
                        disabled={i === image.effectStack.length - 1}
                        aria-label="move down"
                      >
                        ↓
                      </button>
                      <button type="button" className="fx-layer-remove" onClick={() => removeLayer(layer.id)} aria-label="remove layer">×</button>
                    </div>
                    <label className="fx-param-row">
                      <span>opacity</span>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={Math.round(layer.opacity * 100)}
                        onChange={(e) => setOpacity(layer.id, Number(e.target.value) / 100)}
                      />
                      <span className="fx-param-value">{Math.round(layer.opacity * 100)}</span>
                    </label>
                    {(Object.keys(layer.params) as ParamKey[]).map((key) => (
                      <ParamRow
                        key={key}
                        paramKey={key}
                        value={layer.params[key]}
                        onChange={(v) => setParam(layer.id, key, v)}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="panel-group-label">grain</div>
          <label className="fx-param-row">
            <span>amount</span>
            <input type="range" min={0} max={100} value={image.grain} onChange={(e) => setGrain(Number(e.target.value))} />
            <span className="fx-param-value">{image.grain}</span>
          </label>

          <div className="panel-group-label">add effect</div>
          {EFFECT_CATALOG.map((cat) => (
            <div key={cat.label} className="fx-add-category">
              <div className="fx-add-category-label">{cat.label}</div>
              <div className="fx-add-row">
                {cat.defs.map((def) => (
                  <button key={def.type} type="button" onClick={() => addLayer(def.type, def.defaultParams)}>
                    {def.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}
