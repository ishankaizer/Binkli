import { useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import '../styles/components/EffectsPanel.css';
import { EFFECT_CATALOG } from '../lib/effectCatalog';
import { useEffectThumbs } from '../lib/effectThumbs';
import type { EffectLayer, EffectParams, EffectType } from '../lib/effects';
import type { PlacedImage } from '../lib/imageNode';
import { TEXTURES } from '../lib/textures';
import { DEFAULT_CUTOUT, type CutoutOptions } from '../lib/cutout';
import type { TextConfig } from '../lib/textEffects';
import { TextTab } from './panel/TextTab';
import { AddTab } from './panel/AddTab';
import { StackTab } from './panel/StackTab';
import type { ParamKey } from './panel/paramConfig';

interface EffectsPanelProps {
  image: PlacedImage | null;
  onUpdate: (id: string, patch: Partial<PlacedImage>) => void;
}

type Tab = 'stack' | 'add' | 'text';

/**
 * Effect stack editor shell: owns node-editing state and handlers, and
 * switches between three tabs (see components/panel/*.tsx for each one's
 * own UI — Text is write/font/effect controls for a text node, Add is the
 * effect-catalog picker, Stack is the ordered layer list + grain + cutout).
 * The stack itself is order-dependent, raster compositing (see lib/effects/).
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
          <TextTab text={img.text} patchText={patchText} />
        )}

        {tab === 'add' && (
          <AddTab
            query={query}
            setQuery={setQuery}
            filtered={filtered}
            thumbs={thumbs}
            countOf={countOf}
            addLayer={addLayer}
          />
        )}

        {tab === 'stack' && (
          <StackTab
            stack={stack}
            open={open}
            draggingId={draggingId}
            thumbs={thumbs}
            hiddenCount={hiddenCount}
            layerRefs={layerRefs}
            toggleOpen={toggleOpen}
            beginLayerDrag={beginLayerDrag}
            onLayerDragMove={onLayerDragMove}
            endLayerDrag={endLayerDrag}
            moveLayer={moveLayer}
            removeLayer={removeLayer}
            patchLayer={patchLayer}
            setParam={setParam}
            clearStack={() => onUpdate(img.id, { effectStack: [] })}
            grain={img.grain}
            setGrain={(v) => onUpdate(img.id, { grain: v })}
            isText={isText}
            cutout={cutout}
            patchCutout={patchCutout}
          />
        )}
      </div>
    </aside>
  );
}
