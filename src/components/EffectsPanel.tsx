import { useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { EFFECT_CATALOG, effectColor, effectLabel } from '../lib/effectCatalog';
import { useEffectThumbs } from '../lib/effectThumbs';
import { GRADIENT_MAP_PRESETS, type EffectLayer, type EffectParams, type EffectType } from '../lib/effects';
import type { PlacedImage } from '../lib/imageNode';
import { TEXTURES } from '../lib/textures';
import { DEFAULT_CUTOUT, type CutoutOptions, type CutoutType } from '../lib/cutout';
import {
  TEXT_EFFECTS,
  TEXT_EFFECT_GROUPS,
  TEXT_FONTS,
  fontsReady,
  renderTextCanvas,
  type TextConfig,
  type TextEffectType,
} from '../lib/textEffects';

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
  textMaskFontSize: { label: 'type size', type: 'number', min: 6, max: 48, step: 1 },
  textMaskText: { label: 'words', type: 'text' },
  texturePreset: {
    label: 'texture', type: 'select',
    options: [
      { label: 'grain', value: 0 }, { label: 'scanner', value: 1 },
      { label: 'crumple', value: 2 }, { label: 'film', value: 3 },
    ],
  },
  textureOpacity: { label: 'amount', type: 'number', min: 0, max: 100, step: 1 },
  levelsBlack: { label: 'black', type: 'number', min: 0, max: 255, step: 1 },
  levelsWhite: { label: 'white', type: 'number', min: 0, max: 255, step: 1 },
  levelsGamma: { label: 'gamma', type: 'number', min: 10, max: 300, step: 1 },
  balanceR: { label: 'red', type: 'number', min: -100, max: 100, step: 1 },
  balanceG: { label: 'green', type: 'number', min: -100, max: 100, step: 1 },
  balanceB: { label: 'blue', type: 'number', min: -100, max: 100, step: 1 },
  channelMode: {
    label: 'order', type: 'select',
    options: [
      { label: 'R B G', value: 0 }, { label: 'G R B', value: 1 }, { label: 'G B R', value: 2 },
      { label: 'B R G', value: 3 }, { label: 'B G R', value: 4 }, { label: 'R G B', value: 5 },
    ],
  },
  edgeInvert: {
    label: 'style', type: 'select',
    options: [{ label: 'glow on black', value: 0 }, { label: 'ink on white', value: 1 }],
  },
  twirlStrength: { label: 'twist', type: 'number', min: -100, max: 100, step: 1 },
  bulgeStrength: { label: 'bulge', type: 'number', min: -100, max: 100, step: 1 },
  waveAmp: { label: 'height', type: 'number', min: 0, max: 60, step: 1 },
  waveFreq: { label: 'waves', type: 'number', min: 1, max: 12, step: 1 },
  kaleidoSegments: { label: 'segments', type: 'number', min: 2, max: 16, step: 1 },
  sortThreshold: { label: 'catch at', type: 'number', min: 0, max: 255, step: 1 },
  sortVertical: {
    label: 'direction', type: 'select',
    options: [{ label: 'rows', value: 0 }, { label: 'columns', value: 1 }],
  },
  sliceCount: { label: 'slices', type: 'number', min: 2, max: 40, step: 1 },
  sliceOffset: { label: 'shift', type: 'number', min: 0, max: 100, step: 1 },
  bloomThreshold: { label: 'catch at', type: 'number', min: 0, max: 255, step: 1 },
  bloomStrength: { label: 'glow', type: 'number', min: 0, max: 100, step: 1 },
  leakColor: { label: 'leak', type: 'color' },
  leakStrength: { label: 'strength', type: 'number', min: 0, max: 100, step: 1 },
  leakCorner: {
    label: 'from', type: 'select',
    options: [
      { label: 'top right', value: 0 }, { label: 'top left', value: 1 },
      { label: 'bottom left', value: 2 }, { label: 'bottom right', value: 3 },
    ],
  },
  crushAmount: { label: 'crush', type: 'number', min: 0, max: 100, step: 1 },
  scanGap: { label: 'line gap', type: 'number', min: 2, max: 12, step: 1 },
  scanStrength: { label: 'strength', type: 'number', min: 0, max: 100, step: 1 },
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
          placeholder="type here"
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

/** Live preview of a text effect, drawn with the node's own colours and font. */
function TextEffectTile({ cfg, type, active, onPick }: {
  cfg: TextConfig;
  type: TextEffectType;
  active: boolean;
  onPick: () => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const label = TEXT_EFFECTS.find((t) => t.type === type)?.label ?? type;

  useEffect(() => {
    let cancelled = false;
    fontsReady().then(() => {
      const canvas = ref.current;
      if (cancelled || !canvas) return;
      const preview = renderTextCanvas({ ...cfg, text: 'Aa', effect: type, size: 34 }, 78, 52);
      canvas.width = 78;
      canvas.height = 52;
      canvas.getContext('2d')!.drawImage(preview, 0, 0);
    });
    return () => { cancelled = true; };
  }, [cfg, type]);

  return (
    <button type="button" className={`tx-tile${active ? ' is-active' : ''}`} onClick={onPick} title={label}>
      <canvas ref={ref} className="tx-tile-art" />
      <span className="tx-tile-label">{label}</span>
    </button>
  );
}

type Tab = 'stack' | 'add' | 'text';

/**
 * Effect stack editor. The stack is ordered and raster (see lib/effects.ts) —
 * every row shows a thumbnail of what that effect does to *this* node, and
 * carries its category colour so a four-deep stack reads as four things.
 */
export default function EffectsPanel({ image, onUpdate }: EffectsPanelProps) {
  const thumbs = useEffectThumbs(image?.text ? null : (image?.src ?? null), image?.text);
  const [open, setOpen] = useState<string[]>([]);
  const [tab, setTab] = useState<Tab>('add');
  const [query, setQuery] = useState('');
  // draggingId (state) drives the .is-dragging visual only, a render behind
  // is fine there. The drag logic itself reads draggingRef, since pointermove
  // can fire faster than a state update commits between events.
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const draggingRef = useRef<string | null>(null);
  const layerRefs = useRef(new Map<string, HTMLDivElement>());

  const isText = image?.text !== undefined;
  const nodeId = image?.id ?? null;

  // Drop expanded state for layers that no longer exist.
  useEffect(() => {
    if (!image) return;
    setOpen((prev) => prev.filter((id) => image.effectStack.some((l) => l.id === id)));
  }, [image]);

  // Landing on a newly selected node, show the tab that is most useful for it.
  useEffect(() => {
    if (!nodeId) return;
    setTab(isText ? 'text' : 'add');
    setQuery('');
  }, [nodeId, isText]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return EFFECT_CATALOG;
    return EFFECT_CATALOG
      .map((cat) => ({ ...cat, defs: cat.defs.filter((d) => d.label.toLowerCase().includes(q) || cat.label.toLowerCase().includes(q)) }))
      .filter((cat) => cat.defs.length > 0);
  }, [query]);

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
          <p>Pick a photo or a bit of text on the page to start stacking effects.</p>
          <p className="panel-empty-note">Order matters here — a blur under a halftone looks nothing like a blur over one.</p>
        </div>
      </aside>
    );
  }

  const img = image;
  const stack = img.effectStack;

  const addLayer = (type: EffectType, defaultParams: EffectParams) => {
    const layer: EffectLayer = { id: crypto.randomUUID(), type, opacity: 1, visible: true, params: { ...defaultParams } };
    onUpdate(img.id, { effectStack: [...stack, layer] });
    setOpen((prev) => [...prev, layer.id]);
    setTab('stack');
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

  const patchText = (patch: Partial<TextConfig>) =>
    img.text && onUpdate(img.id, { text: { ...img.text, ...patch } });

  const cutout: CutoutOptions = img.cutout ?? DEFAULT_CUTOUT;
  const patchCutout = (patch: Partial<CutoutOptions>) =>
    onUpdate(img.id, { cutout: { ...cutout, ...patch } });

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
    try {
      (e.target as Element).setPointerCapture(e.pointerId);
    } catch {
      /* pointer already released — reordering still tracks via pointermove */
    }
  };
  const onLayerDragMove = (id: string) => (e: ReactPointerEvent) => {
    if (draggingRef.current === id) reorderTo(id, e.clientY);
  };
  const endLayerDrag = () => {
    draggingRef.current = null;
    setDraggingId(null);
  };

  const countOf = (type: EffectType) => stack.filter((l) => l.type === type).length;
  const hiddenCount = stack.filter((l) => l.visible === false).length;

  return (
    <aside className="effects-panel">
      <img className="panel-tear" src={TEXTURES.paperEdge} alt="" aria-hidden />

      <div className="panel-head">
        <div className="panel-title">{isText ? 'text' : 'effects'}</div>
        <div className="panel-sub">{isText ? 'write · style · break' : 'stack · blend · break'}</div>
      </div>

      <div className="panel-tabs" role="tablist">
        {isText && (
          <button type="button" className={`panel-tab${tab === 'text' ? ' is-active' : ''}`} onClick={() => setTab('text')}>
            Text
          </button>
        )}
        <button type="button" className={`panel-tab${tab === 'add' ? ' is-active' : ''}`} onClick={() => setTab('add')}>
          Add
        </button>
        <button type="button" className={`panel-tab${tab === 'stack' ? ' is-active' : ''}`} onClick={() => setTab('stack')}>
          Stack{stack.length > 0 && <span className="panel-tab-count">{stack.length}</span>}
        </button>
      </div>

      <div className="panel-scroll">
        {tab === 'text' && img.text && (
          <>
            <textarea
              className="tx-input"
              value={img.text.text}
              rows={3}
              spellCheck={false}
              placeholder="type something"
              onChange={(e) => patchText({ text: e.target.value })}
            />

            <div className="tx-row">
              <select
                className="fx-select"
                value={img.text.font}
                onChange={(e) => patchText({ font: e.target.value as TextConfig['font'] })}
              >
                {TEXT_FONTS.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
              </select>
              <div className="seg-mini" role="group" aria-label="align">
                {(['left', 'center', 'right'] as const).map((a) => (
                  <button
                    key={a}
                    type="button"
                    className={img.text!.align === a ? 'is-active' : ''}
                    onClick={() => patchText({ align: a })}
                    aria-label={a}
                  >
                    {a === 'left' ? '⯇' : a === 'center' ? '≡' : '⯈'}
                  </button>
                ))}
              </div>
            </div>

            <label className="fx-param">
              <span className="fx-param-label">size</span>
              <input
                className="fx-range"
                type="range"
                min={12}
                max={180}
                value={img.text.size}
                onChange={(e) => patchText({ size: Number(e.target.value) })}
              />
              <output className="fx-param-value">{img.text.size}</output>
            </label>

            <div className="tx-row">
              <label className="tx-swatch">
                <input type="color" value={img.text.color} onChange={(e) => patchText({ color: e.target.value })} />
                <span>main</span>
              </label>
              <label className="tx-swatch">
                <input type="color" value={img.text.color2} onChange={(e) => patchText({ color2: e.target.value })} />
                <span>accent</span>
              </label>
            </div>

            <label className="fx-param fx-param-solo">
              <span className="fx-param-label">amount</span>
              <input
                className="fx-range"
                type="range"
                min={0}
                max={100}
                value={img.text.strength}
                onChange={(e) => patchText({ strength: Number(e.target.value) })}
              />
              <output className="fx-param-value">{img.text.strength}</output>
            </label>

            {TEXT_EFFECT_GROUPS.map((group) => (
              <div key={group} className="fx-cat">
                <div className="fx-cat-head"><span className="fx-cat-dot" />{group}</div>
                <div className="tx-grid">
                  {TEXT_EFFECTS.filter((t) => t.group === group).map((t) => (
                    <TextEffectTile
                      key={t.type}
                      cfg={img.text!}
                      type={t.type}
                      active={img.text!.effect === t.type}
                      onPick={() => patchText({ effect: t.type })}
                    />
                  ))}
                </div>
              </div>
            ))}
          </>
        )}

        {tab === 'add' && (
          <>
            <input
              className="fx-search"
              type="search"
              value={query}
              placeholder="search effects"
              onChange={(e) => setQuery(e.target.value)}
            />
            {filtered.length === 0 && <p className="fx-stack-empty">Nothing matches “{query}”.</p>}
            {filtered.map((cat) => (
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
          </>
        )}

        {tab === 'stack' && (
          <>
            <div className="panel-section-head">
              <span>stack</span>
              <span className="panel-count">{stack.length}</span>
              {hiddenCount > 0 && <span className="panel-muted">{hiddenCount} hidden</span>}
              {stack.length > 0 && (
                <button className="panel-clear" type="button" onClick={() => onUpdate(img.id, { effectStack: [] })}>
                  clear
                </button>
              )}
            </div>

            {stack.length === 0 ? (
              <p className="fx-stack-empty">
                Nothing stacked yet. Open <b>Add</b> and pick an effect — they apply top to bottom.
              </p>
            ) : (
              <>
                <p className="fx-stack-note">applied top → bottom</p>
                <div className="fx-stack">
                  {stack.map((layer, i) => {
                    const isOpen = open.includes(layer.id);
                    const hidden = layer.visible === false;
                    return (
                      <div
                        key={layer.id}
                        ref={(el) => {
                          if (el) layerRefs.current.set(layer.id, el);
                          else layerRefs.current.delete(layer.id);
                        }}
                        className={`fx-layer${isOpen ? ' is-open' : ''}${draggingId === layer.id ? ' is-dragging' : ''}${hidden ? ' is-hidden' : ''}`}
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
                            type="button"
                            className="fx-layer-eye"
                            onClick={() => patchLayer(layer.id, { visible: hidden })}
                            aria-label={hidden ? 'show layer' : 'hide layer'}
                            title={hidden ? 'Show this effect' : 'Hide this effect'}
                          >
                            {hidden ? '◠' : '◉'}
                          </button>
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
                                {hidden ? 'hidden' : `${Math.round(layer.opacity * 100)}%`}
                                {Object.keys(layer.params).length > 0 && ` · ${Object.keys(layer.params).length} settings`}
                              </span>
                            </span>
                            <span className="fx-layer-caret">{isOpen ? '▾' : '▸'}</span>
                          </button>
                        </div>

                        {isOpen && (
                          <div className="fx-layer-body">
                            <div className="fx-layer-tools">
                              <button type="button" onClick={() => moveLayer(layer.id, -1)} disabled={i === 0} aria-label="move up">↑ up</button>
                              <button type="button" onClick={() => moveLayer(layer.id, 1)} disabled={i === stack.length - 1} aria-label="move down">↓ down</button>
                              <button type="button" className="fx-layer-kill" onClick={() => removeLayer(layer.id)} aria-label="remove layer">× remove</button>
                            </div>
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

            {!isText && (
              <>
                <div className="panel-section-head">
                  <span>cutout</span>
                </div>
                <div className="cut-shape-row">
                  {(['none', 'torn', 'rough', 'clean', 'circle'] as CutoutType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={`cut-shape${cutout.type === t ? ' is-active' : ''}`}
                      onClick={() => patchCutout({ type: t })}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                {cutout.type !== 'none' && (
                  <label className="fx-param fx-param-solo">
                    <span className="fx-param-label">paper</span>
                    <input
                      className="fx-color"
                      type="color"
                      value={cutout.paperColor}
                      onChange={(e) => patchCutout({ paperColor: e.target.value })}
                    />
                    <span className="fx-param-hint">shows through a torn/rough edge</span>
                  </label>
                )}

                <label className="cut-bg-toggle">
                  <input
                    type="checkbox"
                    checked={cutout.removeBackground}
                    onChange={(e) => patchCutout({ removeBackground: e.target.checked })}
                  />
                  remove background
                </label>
                {cutout.removeBackground && (
                  <label className="fx-param fx-param-solo">
                    <span className="fx-param-label">threshold</span>
                    <input
                      className="fx-range"
                      type="range"
                      min={5}
                      max={80}
                      value={cutout.bgThreshold}
                      onChange={(e) => patchCutout({ bgThreshold: Number(e.target.value) })}
                    />
                    <output className="fx-param-value">{cutout.bgThreshold}</output>
                  </label>
                )}
              </>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
