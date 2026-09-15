import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { EFFECT_CATALOG, effectColor, effectLabel } from '../lib/effectCatalog';
import { useEffectThumbs } from '../lib/effectThumbs';
import { GRADIENT_MAP_PRESETS, type EffectLayer, type EffectParams, type EffectType } from '../lib/effects';
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
  color1: { label: 'ink 1', type: 'color' },
  color2: { label: 'ink 2', type: 'color' },
  gradientPreset: {
    label: 'ramp', type: 'select',
    options: GRADIENT_MAP_PRESETS.map((p, i) => ({ label: p.name, value: i })),
  },
  pixelSize: { label: 'cell size', type: 'number', min: 2, max: 40, step: 1 },
  glassStrength: { label: 'warp', type: 'number', min: 0, max: 40, step: 1 },
  chromaticStrength: { label: 'shift', type: 'number', min: 0, max: 30, step: 1 },
  threshold: { label: 'threshold', type: 'number', min: 0, max: 255, step: 1 },
  neonColor: { label: 'glow', type: 'color' },
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
  hueShift: { label: 'hue', type: 'number', min: -180, max: 180, step: 1 },
  posterizeLevels: { label: 'levels', type: 'number', min: 2, max: 16, step: 1 },
  sharpenAmount: { label: 'amount', type: 'number', min: 0, max: 100, step: 1 },
  polaroidStyle: {
    label: 'frame', type: 'select',
    options: [{ label: 'white', value: 0 }, { label: 'vintage', value: 1 }, { label: 'dark', value: 2 }],
  },
  polaroidLabel: { label: 'caption', type: 'text' },
  textMaskFontSize: { label: 'type size', type: 'number', min: 6, max: 24, step: 1 },
  texturePreset: {
    label: 'texture', type: 'select',
    options: [
      { label: 'grain', value: 0 }, { label: 'scanner', value: 1 },
      { label: 'crumple', value: 2 }, { label: 'film', value: 3 },
    ],
  },
  textureOpacity: { label: 'amount', type: 'number', min: 0, max: 100, step: 1 },
};

function ParamRow({ paramKey, value, onChange }: {
  paramKey: ParamKey;
  value: unknown;
  onChange: (v: string | number) => void;
}) {
  const cfg = PARAM_CONFIG[paramKey];
  if (!cfg) return null;

  return (
    <label className="fx-param">
      <span className="fx-param-label">{cfg.label}</span>
      {cfg.type === 'color' && (
        <input className="fx-color" type="color" value={String(value)} onChange={(e) => onChange(e.target.value)} />
      )}
      {cfg.type === 'select' && (
        <select className="fx-select" value={Number(value)} onChange={(e) => onChange(Number(e.target.value))}>
          {cfg.options!.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      )}
      {cfg.type === 'text' && (
        <input
          className="fx-text"
          type="text"
          placeholder="type a caption"
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {cfg.type === 'number' && (
        <>
          <input
            className="fx-range"
            type="range"
            min={cfg.min}
            max={cfg.max}
            step={cfg.step}
            value={Number(value)}
            onChange={(e) => onChange(Number(e.target.value))}
          />
          <output className="fx-param-value">{Math.round(Number(value))}</output>
        </>
      )}
    </label>
  );
}

/**
 * Effect stack editor. The stack is ordered and raster (see lib/effects.ts) —
 * every row shows a thumbnail of what that effect does to *this* photo, and
 * carries its category colour so a four-deep stack reads as four things.
 */
export default function EffectsPanel({ image, onUpdate }: EffectsPanelProps) {
  const thumbs = useEffectThumbs(image?.src ?? null);
  const [open, setOpen] = useState<string[]>([]);
  // draggingId (state) drives the .is-dragging visual only, a render behind
  // is fine there. The drag logic itself reads draggingRef, since pointermove
  // can fire faster than a state update commits between events.
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const draggingRef = useRef<string | null>(null);
  const layerRefs = useRef(new Map<string, HTMLDivElement>());

  // Drop expanded state for layers that no longer exist.
  useEffect(() => {
    if (!image) return;
    setOpen((prev) => prev.filter((id) => image.effectStack.some((l) => l.id === id)));
  }, [image]);

  if (!image) {
    return (
      <aside className="effects-panel">
        <img className="panel-tear" src={TEXTURES.paperEdge} alt="" aria-hidden />
        <div className="panel-head">
          <div className="panel-title">effects</div>
          <div className="panel-sub">stack · blend · break</div>
        </div>
        <div className="panel-empty">
          <div className="panel-empty-mark">↖</div>
          <p>Pick a photo on the page to start stacking effects.</p>
          <p className="panel-empty-note">Order matters here — a blur under a halftone looks nothing like a blur over one.</p>
        </div>
      </aside>
    );
  }

  const img = image;
  const stack = img.effectStack;

  const addLayer = (type: EffectType, defaultParams: EffectParams) => {
    const layer: EffectLayer = { id: crypto.randomUUID(), type, opacity: 1, params: { ...defaultParams } };
    onUpdate(img.id, { effectStack: [...stack, layer] });
    setOpen((prev) => [...prev, layer.id]);
  };

  const removeLayer = (id: string) => onUpdate(img.id, { effectStack: stack.filter((l) => l.id !== id) });

  const moveLayer = (id: string, dir: -1 | 1) => {
    const i = stack.findIndex((l) => l.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= stack.length) return;
    const next = [...stack];
    [next[i], next[j]] = [next[j], next[i]];
    onUpdate(img.id, { effectStack: next });
  };

  const patchLayer = (id: string, patch: Partial<EffectLayer>) =>
    onUpdate(img.id, { effectStack: stack.map((l) => (l.id === id ? { ...l, ...patch } : l)) });

  const setParam = (id: string, key: ParamKey, value: string | number) =>
    onUpdate(img.id, {
      effectStack: stack.map((l) => (l.id === id ? { ...l, params: { ...l.params, [key]: value } } : l)),
    });

  const toggleOpen = (id: string) =>
    setOpen((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  // Live drag-to-reorder: as the pointer crosses another layer's midpoint,
  // the stack reorders immediately (not just on drop).
  const reorderTo = (dragId: string, clientY: number) => {
    const dragIndex = stack.findIndex((l) => l.id === dragId);
    if (dragIndex === -1) return;
    let targetIndex = 0;
    for (const layer of stack) {
      if (layer.id === dragId) continue;
      const el = layerRefs.current.get(layer.id);
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (clientY > rect.top + rect.height / 2) targetIndex++;
    }
    if (targetIndex === dragIndex) return;
    const next = [...stack];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(targetIndex, 0, moved);
    onUpdate(img.id, { effectStack: next });
  };

  const beginLayerDrag = (id: string) => (e: ReactPointerEvent) => {
    e.stopPropagation();
    draggingRef.current = id;
    setDraggingId(id);
    (e.target as Element).setPointerCapture(e.pointerId);
  };
  const onLayerDragMove = (id: string) => (e: ReactPointerEvent) => {
    if (draggingRef.current === id) reorderTo(id, e.clientY);
  };
  const endLayerDrag = () => {
    draggingRef.current = null;
    setDraggingId(null);
  };

  const countOf = (type: EffectType) => stack.filter((l) => l.type === type).length;

  return (
    <aside className="effects-panel">
      <img className="panel-tear" src={TEXTURES.paperEdge} alt="" aria-hidden />

      <div className="panel-head">
        <div className="panel-title">effects</div>
        <div className="panel-sub">stack · blend · break</div>
      </div>

      <div className="panel-scroll">
        <div className="panel-section-head">
          <span>stack</span>
          <span className="panel-count">{stack.length}</span>
          {stack.length > 0 && (
            <button className="panel-clear" type="button" onClick={() => onUpdate(img.id, { effectStack: [] })}>
              clear
            </button>
          )}
        </div>

        {stack.length === 0 ? (
          <p className="fx-stack-empty">Nothing stacked yet. Add an effect below — they apply top to bottom.</p>
        ) : (
          <>
            <p className="fx-stack-note">applied top → bottom</p>
            <div className="fx-stack">
              {stack.map((layer, i) => {
                const isOpen = open.includes(layer.id);
                return (
                  <div
                    key={layer.id}
                    ref={(el) => {
                      if (el) layerRefs.current.set(layer.id, el);
                      else layerRefs.current.delete(layer.id);
                    }}
                    className={`fx-layer${isOpen ? ' is-open' : ''}${draggingId === layer.id ? ' is-dragging' : ''}`}
                    style={{ ['--fx' as string]: effectColor(layer.type) }}
                  >
                    <div className="fx-layer-head">
                      <span
                        className="fx-layer-grab"
                        onPointerDown={beginLayerDrag(layer.id)}
                        onPointerMove={onLayerDragMove(layer.id)}
                        onPointerUp={endLayerDrag}
                        onPointerCancel={endLayerDrag}
                        aria-hidden
                      >
                        ⠿
                      </span>
                      <button
                        className="fx-layer-main"
                        type="button"
                        onClick={() => toggleOpen(layer.id)}
                        aria-expanded={isOpen}
                      >
                        <span className="fx-layer-step">{i + 1}</span>
                        {thumbs[layer.type] && (
                          <img className="fx-layer-thumb" src={thumbs[layer.type]} alt="" />
                        )}
                        <span className="fx-layer-text">
                          <span className="fx-layer-name">{effectLabel(layer.type)}</span>
                          <span className="fx-layer-meta">
                            {Math.round(layer.opacity * 100)}%
                            {Object.keys(layer.params).length > 0 && ` · ${Object.keys(layer.params).length} settings`}
                          </span>
                        </span>
                        <span className="fx-layer-caret">{isOpen ? '▾' : '▸'}</span>
                      </button>
                      <div className="fx-layer-tools">
                        <button type="button" onClick={() => moveLayer(layer.id, -1)} disabled={i === 0} aria-label="move up">↑</button>
                        <button type="button" onClick={() => moveLayer(layer.id, 1)} disabled={i === stack.length - 1} aria-label="move down">↓</button>
                        <button type="button" className="fx-layer-kill" onClick={() => removeLayer(layer.id)} aria-label="remove layer">×</button>
                      </div>
                    </div>

                    {isOpen && (
                      <div className="fx-layer-body">
                        <label className="fx-param">
                          <span className="fx-param-label">opacity</span>
                          <input
                            className="fx-range"
                            type="range"
                            min={0}
                            max={100}
                            value={Math.round(layer.opacity * 100)}
                            onChange={(e) => patchLayer(layer.id, { opacity: Number(e.target.value) / 100 })}
                          />
                          <output className="fx-param-value">{Math.round(layer.opacity * 100)}</output>
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
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        <div className="panel-section-head">
          <span>page grain</span>
          <span className="panel-count">{img.grain}</span>
        </div>
        <label className="fx-param fx-param-solo">
          <span className="fx-param-label">amount</span>
          <input
            className="fx-range"
            type="range"
            min={0}
            max={100}
            value={img.grain}
            onChange={(e) => onUpdate(img.id, { grain: Number(e.target.value) })}
          />
          <output className="fx-param-value">{img.grain}</output>
        </label>

        <div className="panel-section-head">
          <span>add effect</span>
        </div>
        {EFFECT_CATALOG.map((cat) => (
          <div key={cat.label} className="fx-cat" style={{ ['--fx' as string]: cat.color }}>
            <div className="fx-cat-head">
              <span className="fx-cat-dot" />
              {cat.label}
            </div>
            <div className="fx-cat-grid">
              {cat.defs.map((def) => {
                const n = countOf(def.type);
                return (
                  <button
                    key={def.type}
                    type="button"
                    className={`fx-tile${n > 0 ? ' is-applied' : ''}`}
                    onClick={() => addLayer(def.type, def.defaultParams)}
                    title={`Add ${def.label}`}
                  >
                    <span className="fx-tile-art">
                      {thumbs[def.type]
                        ? <img src={thumbs[def.type]} alt="" />
                        : <span className="fx-tile-sym">{def.symbol}</span>}
                      {n > 0 && <span className="fx-tile-badge">{n}</span>}
                    </span>
                    <span className="fx-tile-label">{def.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
