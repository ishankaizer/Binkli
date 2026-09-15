import { useEffect, useRef, useState } from 'react';
import type { DragEvent, PointerEvent as ReactPointerEvent } from 'react';
import type { NotebookPaper } from '../lib/textures';
import type { PlacedImage } from '../lib/imageNode';
import CanvasDecor from './CanvasDecor';
import ImageNode from './ImageNode';
import FrameNode, { FRAME_PRESETS, type FrameNodeData } from './FrameNode';

interface NotebookCanvasProps {
  paper: NotebookPaper;
  hasContent: boolean;
  images: PlacedImage[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onUpdate: (id: string, patch: Partial<PlacedImage>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onRestack: (id: string, to: 'front' | 'back') => void;
  onAddFiles: (files: File[], centerX: number, centerY: number) => void;
  onAddText: (centerX: number, centerY: number) => void;
  onOpenGradientLab: () => void;
  frames: FrameNodeData[];
  selectedFrameId: string | null;
  onSelectFrame: (id: string | null) => void;
  onUpdateFrame: (id: string, patch: Partial<FrameNodeData>) => void;
  onDeleteFrame: (id: string) => void;
  onAddFrame: (presetIndex: number, centerX: number, centerY: number) => void;
}

const MIN_SCALE = 0.25;
const MAX_SCALE = 3;

export default function NotebookCanvas({
  paper,
  hasContent,
  images,
  selectedId,
  onSelect,
  onUpdate,
  onDelete,
  onDuplicate,
  onRestack,
  onAddFiles,
  onAddText,
  onOpenGradientLab,
  frames,
  selectedFrameId,
  onSelectFrame,
  onUpdateFrame,
  onDeleteFrame,
  onAddFrame,
}: NotebookCanvasProps) {
  const pageRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dropping, setDropping] = useState(false);
  const [showFramePicker, setShowFramePicker] = useState(false);

  // Pan/zoom is a pure view concern — only the pan-layer wrapper moves, the
  // notebook page itself and its images/frames stay in the same page-local
  // coordinates the rest of the app already works in.
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
  const panDrag = useRef<{ startX: number; startY: number; origX: number; origY: number; moved: boolean } | null>(null);

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    if (!dropping) setDropping(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    if (e.currentTarget === e.target) setDropping(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDropping(false);
    const rect = pageRef.current?.getBoundingClientRect();
    if (!rect) return;
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
    if (!files.length) return;
    onAddFiles(files, (e.clientX - rect.left - view.x) / view.scale, (e.clientY - rect.top - view.y) / view.scale);
  };

  const openPicker = () => fileInputRef.current?.click();

  const handleFileChange = () => {
    const files = Array.from(fileInputRef.current?.files ?? []);
    const rect = pageRef.current?.getBoundingClientRect();
    if (files.length && rect) {
      onAddFiles(files, rect.width / 2 / view.scale, rect.height / 2 / view.scale);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Keep a node fully on the page when it fits, so its resize/rotate handles are
  // always reachable. Oversized photos are allowed to overhang, but only enough
  // to still be pannable within the page.
  const handleUpdate = (id: string, patch: Partial<PlacedImage>) => {
    const rect = pageRef.current?.getBoundingClientRect();
    const node = images.find((i) => i.id === id);
    if (!rect || !node || (patch.x === undefined && patch.y === undefined)) {
      onUpdate(id, patch);
      return;
    }
    const width = patch.width ?? node.width;
    const height = patch.height ?? node.height;
    const extentW = rect.width / view.scale;
    const extentH = rect.height / view.scale;
    const clampAxis = (v: number, size: number, extent: number) => {
      const slack = extent - size;
      return slack >= 0 ? Math.min(Math.max(v, 0), slack) : Math.min(Math.max(v, slack), 0);
    };
    const clamped = { ...patch };
    if (patch.x !== undefined) clamped.x = clampAxis(patch.x, width, extentW);
    if (patch.y !== undefined) clamped.y = clampAxis(patch.y, height, extentH);
    onUpdate(id, clamped);
  };

  // React's synthetic wheel listener is passive (a perf default inherited from
  // the DOM), so e.preventDefault() inside a normal onWheel prop is silently
  // ignored — and throws in dev. Zooming needs to stop the page's own scroll,
  // so this attaches a real, non-passive listener instead.
  useEffect(() => {
    const el = pageRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      setView((v) => ({ ...v, scale: Math.min(MAX_SCALE, Math.max(MIN_SCALE, v.scale - e.deltaY * 0.0012)) }));
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);

  // A click on empty paper should deselect; a drag on empty paper should pan.
  // Both start the same way, so the distinction is made on release: if the
  // pointer barely moved, treat it as the click.
  const onPageDown = (e: ReactPointerEvent) => {
    if (e.button !== 0) return;
    panDrag.current = { startX: e.clientX, startY: e.clientY, origX: view.x, origY: view.y, moved: false };
    try {
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    } catch {
      /* pointer already gone */
    }
  };
  const onPageMove = (e: ReactPointerEvent) => {
    const d = panDrag.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!d.moved && Math.hypot(dx, dy) < 4) return;
    d.moved = true;
    setView((v) => ({ ...v, x: d.origX + dx, y: d.origY + dy }));
  };
  const onPageUp = () => {
    const wasClick = panDrag.current && !panDrag.current.moved;
    panDrag.current = null;
    if (wasClick) {
      onSelect(null);
      onSelectFrame(null);
    }
  };

  const resetView = () => setView({ x: 0, y: 0, scale: 1 });

  const centerOfPage = () => {
    const rect = pageRef.current?.getBoundingClientRect();
    return {
      x: rect ? (rect.width / 2 - view.x) / view.scale : 300,
      y: rect ? (rect.height / 2 - view.y) / view.scale : 220,
    };
  };

  return (
    <>
      {/* Rendered as a sibling of .canvas-area (not inside it) so it sits in
          the workstation's own top-level stacking order, otherwise it would
          be painted under the effects panel's torn-paper edge, which lives
          in a higher sibling stacking context no in-canvas z-index can beat. */}
      <div className="canvas-add-group">
        <button type="button" className="sticker-btn" onClick={openPicker}>
          + image
        </button>
        <button
          type="button"
          className="sticker-btn"
          onClick={() => {
            const c = centerOfPage();
            onAddText(c.x, c.y);
          }}
        >
          + text
        </button>
        <button type="button" className="sticker-btn" onClick={onOpenGradientLab}>
          + gradient
        </button>
        <div className="frame-picker-wrap">
          <button type="button" className="sticker-btn" onClick={() => setShowFramePicker((v) => !v)}>
            + frame
          </button>
          {showFramePicker && (
            <div className="frame-picker">
              {FRAME_PRESETS.map((p, i) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    const c = centerOfPage();
                    onAddFrame(i, c.x, c.y);
                    setShowFramePicker(false);
                  }}
                >
                  <span className="frame-picker-dot" style={{ background: p.color }} />
                  {p.label}
                  <span className="frame-picker-size">{p.presetW}×{p.presetH}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="canvas-area">
        <div
          ref={pageRef}
          className={`notebook${paper.ruled ? ' ruled' : ''}${dropping ? ' is-dropping' : ''}`}
          style={{ backgroundImage: `url('${paper.texture}')` }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onPointerDown={onPageDown}
          onPointerMove={onPageMove}
          onPointerUp={onPageUp}
          onPointerCancel={onPageUp}
        >
          {!paper.noMargin && <div className="margin-line" />}

          <CanvasDecor />

          <div
            className="pan-layer"
            style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`, transformOrigin: '0 0' }}
          >
            {frames.map((frame) => (
              <FrameNode
                key={frame.id}
                frame={frame}
                selected={frame.id === selectedFrameId}
                scale={view.scale}
                onSelect={() => {
                  onSelectFrame(frame.id);
                  onSelect(null);
                }}
                onUpdate={(patch) => onUpdateFrame(frame.id, patch)}
                onDelete={() => onDeleteFrame(frame.id)}
              />
            ))}
            {images.map((img) => (
              <ImageNode
                key={img.id}
                image={img}
                selected={img.id === selectedId}
                scale={view.scale}
                onSelect={(id) => {
                  onSelect(id);
                  onSelectFrame(null);
                }}
                onUpdate={handleUpdate}
                onDelete={onDelete}
                onDuplicate={onDuplicate}
                onRestack={onRestack}
              />
            ))}
          </div>

          {!hasContent && (
            <div className="empty-hint" onClick={openPicker}>
              <div>
                <div className="marker">drop an image.</div>
                <div className="sub">…then make it weird.</div>
                <div className="empty-browse">or click anywhere on the page to browse</div>
              </div>
            </div>
          )}

          {dropping && <div className="drop-veil"><span>drop it</span></div>}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={handleFileChange}
          />
        </div>

        <button type="button" className="zoom-badge" onClick={resetView} title="Click to reset pan and zoom">
          {Math.round(view.scale * 100)}%
          <span className="zoom-hint">scroll to zoom · drag paper to pan</span>
        </button>
      </div>
    </>
  );
}
