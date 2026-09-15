// EffectsPanel's "Stack" tab: the ordered, drag-to-reorder effect-layer list
// (with per-layer opacity/params/visibility), page grain, and — photo nodes
// only — the cutout shape and background-removal controls.

import type { PointerEvent as ReactPointerEvent, RefObject } from 'react';
import { effectColor, effectLabel } from '../../lib/effectCatalog';
import type { EffectLayer } from '../../lib/effects';
import type { CutoutOptions, CutoutType } from '../../lib/cutout';
import { ParamRow } from './ParamRow';
import type { ParamKey } from './paramConfig';

export function StackTab({
  stack, open, draggingId, thumbs, hiddenCount, layerRefs,
  toggleOpen, beginLayerDrag, onLayerDragMove, endLayerDrag,
  moveLayer, removeLayer, patchLayer, setParam, clearStack,
  grain, setGrain,
  isText, cutout, patchCutout,
}: {
  stack: EffectLayer[];
  open: string[];
  draggingId: string | null;
  thumbs: Record<string, string>;
  hiddenCount: number;
  layerRefs: RefObject<Map<string, HTMLDivElement>>;
  toggleOpen: (id: string) => void;
  beginLayerDrag: (id: string) => (e: ReactPointerEvent) => void;
  onLayerDragMove: (id: string) => (e: ReactPointerEvent) => void;
  endLayerDrag: () => void;
  moveLayer: (id: string, dir: -1 | 1) => void;
  removeLayer: (id: string) => void;
  patchLayer: (id: string, patch: Partial<EffectLayer>) => void;
  setParam: (id: string, key: ParamKey, value: string | number) => void;
  clearStack: () => void;
  grain: number;
  setGrain: (v: number) => void;
  isText: boolean;
  cutout: CutoutOptions;
  patchCutout: (patch: Partial<CutoutOptions>) => void;
}) {
  return (
    <>
      <div className="panel-section-head">
        <span>stack</span>
        <span className="panel-count">{stack.length}</span>
        {hiddenCount > 0 && <span className="panel-muted">{hiddenCount} hidden</span>}
        {stack.length > 0 && (
          <button className="panel-clear" type="button" onClick={clearStack}>
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
                    if (el) layerRefs.current?.set(layer.id, el);
                    else layerRefs.current?.delete(layer.id);
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
        <span className="panel-count">{grain}</span>
      </div>
      <label className="fx-param fx-param-solo">
        <span className="fx-param-label">amount</span>
        <input
          className="fx-range"
          type="range"
          min={0}
          max={100}
          value={grain}
          onChange={(e) => setGrain(Number(e.target.value))}
        />
        <output className="fx-param-value">{grain}</output>
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
  );
}
