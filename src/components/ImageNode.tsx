import { useCallback, useEffect, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { applyEffectLayer, applyGrainOverlay } from '../lib/effects';
import { fontsReady, renderTextCanvas } from '../lib/textEffects';
import { applyCutoutMask, removeBackground } from '../lib/cutout';
import type { PlacedImage } from '../lib/imageNode';

interface ImageNodeProps {
  image: PlacedImage;
  selected: boolean;
  /** Current pan/zoom scale of the enclosing layer, so a drag's on-screen
      pixels map back to the correct page-local delta at any zoom level. */
  scale: number;
  onSelect: (id: string) => void;
  onUpdate: (id: string, patch: Partial<PlacedImage>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onRestack: (id: string, to: 'front' | 'back') => void;
}

type DragMode = 'move' | 'resize' | 'rotate';

interface DragState {
  mode: DragMode;
  startX: number;
  startY: number;
  orig: PlacedImage;
  centerX: number;
  centerY: number;
  startAngle: number;
}

/** Photo nodes get a print border; text floats bare on the paper. */
const PHOTO_BORDER = 4;

/** Capture keeps the drag alive outside the handle. A pointer that has already
    been released throws here, and that must not abort the rest of the drag setup. */
function capturePointer(el: Element, pointerId: number) {
  try {
    el.setPointerCapture(pointerId);
  } catch {
    /* pointer already gone — the drag still works, it just isn't captured */
  }
}

export default function ImageNode({ image, selected, scale, onSelect, onUpdate, onDelete, onDuplicate, onRestack }: ImageNodeProps) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const loadedRef = useRef(false);
  // While a resize drag is live the canvas is just stretched by CSS. Re-running
  // a whole effect stack on every pointermove is what made resizing crawl.
  const resizingRef = useRef(false);

  const isText = image.text !== undefined;

  // Raster compositing: fold the effect stack in order (each layer's output
  // feeds the next), then the grain overlay on top. Order-dependent by design.
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const inset = isText ? 0 : PHOTO_BORDER * 2;
    const w = Math.max(1, Math.round(image.width - inset));
    const h = Math.max(1, Math.round(image.height - inset));

    let source: HTMLCanvasElement | HTMLImageElement | null = null;
    if (isText) {
      source = renderTextCanvas(image.text!, w, h);
    } else {
      const img = imgRef.current;
      if (!img || !img.complete) return;
      source = img;
    }

    canvas.width = w;
    canvas.height = h;

    let workCanvas = document.createElement('canvas');
    workCanvas.width = w;
    workCanvas.height = h;
    workCanvas.getContext('2d', { willReadFrequently: true })!.drawImage(source, 0, 0, w, h);

    // Background removal reads the untouched source pixels, before any effect
    // has a chance to repaint them, then its alpha mask is multiplied back in
    // once the stack has run — that way an effect like duotone still sees the
    // full photo, not a photo with a hole already cut in it.
    let bgAlphaMask: Uint8ClampedArray | null = null;
    if (!isText && image.cutout?.removeBackground) {
      const scratch = document.createElement('canvas');
      scratch.width = w;
      scratch.height = h;
      scratch.getContext('2d', { willReadFrequently: true })!.drawImage(workCanvas, 0, 0);
      removeBackground(scratch, image.cutout.bgThreshold);
      const md = scratch.getContext('2d', { willReadFrequently: true })!.getImageData(0, 0, w, h);
      bgAlphaMask = new Uint8ClampedArray(w * h);
      for (let i = 0, j = 0; i < md.data.length; i += 4, j++) bgAlphaMask[j] = md.data[i + 3];
    }

    for (const layer of image.effectStack) {
      if (layer.visible === false) continue;
      const result = applyEffectLayer(workCanvas, layer, w, h);
      if (layer.opacity >= 0.99) {
        workCanvas = result;
      } else {
        const blended = document.createElement('canvas');
        blended.width = w;
        blended.height = h;
        const bctx = blended.getContext('2d', { willReadFrequently: true })!;
        bctx.drawImage(workCanvas, 0, 0);
        bctx.globalAlpha = layer.opacity;
        bctx.drawImage(result, 0, 0);
        bctx.globalAlpha = 1;
        workCanvas = blended;
      }
    }

    if (bgAlphaMask) {
      const wctx = workCanvas.getContext('2d', { willReadFrequently: true })!;
      const d = wctx.getImageData(0, 0, w, h);
      for (let i = 0, j = 0; i < d.data.length; i += 4, j++) {
        d.data[i + 3] = Math.min(d.data[i + 3], bgAlphaMask[j]);
      }
      wctx.putImageData(d, 0, 0);
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(workCanvas, 0, 0);

    if (image.grain > 0) applyGrainOverlay(ctx, w, h, image.grain);

    if (!isText && image.cutout && image.cutout.type !== 'none') {
      applyCutoutMask(canvas, image.cutout);
    }
  }, [isText, image.text, image.effectStack, image.grain, image.cutout, image.width, image.height]);

  useEffect(() => {
    if (isText) {
      // Canvas draws with whatever font is resolved at call time, so wait for
      // the webfont once, otherwise the first paint is in a fallback face.
      let cancelled = false;
      fontsReady().then(() => { if (!cancelled) render(); });
      return () => { cancelled = true; };
    }
    const img = new Image();
    img.src = image.src;
    img.onload = () => {
      imgRef.current = img;
      if (!loadedRef.current) {
        loadedRef.current = true;
        if (img.naturalWidth && img.naturalHeight) {
          onUpdate(image.id, { height: image.width / (img.naturalWidth / img.naturalHeight) });
          return; // the height update re-triggers render() via the effect below
        }
      }
      render();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image.src, isText]);

  useEffect(() => {
    if (resizingRef.current) return;
    if (isText || imgRef.current?.complete) render();
  }, [render, isText]);

  const beginDrag = (mode: DragMode) => (e: ReactPointerEvent) => {
    e.stopPropagation();
    onSelect(image.id);
    capturePointer(e.target as Element, e.pointerId);
    if (mode === 'resize') resizingRef.current = true;

    let centerX = 0;
    let centerY = 0;
    let startAngle = 0;
    if (mode === 'rotate' && nodeRef.current) {
      const rect = nodeRef.current.getBoundingClientRect();
      centerX = rect.left + rect.width / 2;
      centerY = rect.top + rect.height / 2;
      startAngle = (Math.atan2(e.clientY - centerY, e.clientX - centerX) * 180) / Math.PI;
    }

    dragRef.current = { mode, startX: e.clientX, startY: e.clientY, orig: image, centerX, centerY, startAngle };
  };

  const onDragMove = (e: ReactPointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    // Screen-space pointer movement maps to a bigger page-local delta when
    // zoomed out, and a smaller one zoomed in — the node has to move (or
    // grow) by the same amount on the page either way.
    const dx = (e.clientX - d.startX) / scale;
    const dy = (e.clientY - d.startY) / scale;

    if (d.mode === 'move') {
      onUpdate(image.id, { x: d.orig.x + dx, y: d.orig.y + dy });
    } else if (d.mode === 'resize') {
      const aspect = d.orig.width / d.orig.height;
      const width = Math.max(60, d.orig.width + dx);
      onUpdate(image.id, { width, height: width / aspect });
    } else if (d.mode === 'rotate') {
      const angle = (Math.atan2(e.clientY - d.centerY, e.clientX - d.centerX) * 180) / Math.PI;
      onUpdate(image.id, { rotation: d.orig.rotation + (angle - d.startAngle) });
    }
  };

  const onDragEnd = () => {
    const wasResizing = dragRef.current?.mode === 'resize';
    dragRef.current = null;
    if (wasResizing) {
      resizingRef.current = false;
      render(); // one sharp re-render at the final size
    }
  };

  return (
    <div
      ref={nodeRef}
      className={`image-node${selected ? ' selected' : ''}${isText ? ' is-text' : ''}`}
      style={{
        left: image.x,
        top: image.y,
        width: image.width,
        height: image.height,
        transform: `rotate(${image.rotation}deg)`,
        zIndex: selected ? 999 : 1,
      }}
      onPointerDown={beginDrag('move')}
      onPointerMove={onDragMove}
      onPointerUp={onDragEnd}
      onPointerCancel={onDragEnd}
      onClick={(e) => e.stopPropagation()}
    >
      <canvas ref={canvasRef} />

      {selected && (
        <>
          <button
            type="button"
            className="image-node-duplicate"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onDuplicate(image.id)}
            aria-label="duplicate"
            title="Duplicate (Cmd/Ctrl+D)"
          >
            ⧉
          </button>
          <button
            type="button"
            className="image-node-delete"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onDelete(image.id)}
            aria-label="delete"
          >
            ×
          </button>
          <div className="image-node-stack">
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => onRestack(image.id, 'front')}
              aria-label="bring to front"
              title="Bring to front ( ] )"
            >
              ⤒
            </button>
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => onRestack(image.id, 'back')}
              aria-label="send to back"
              title="Send to back ( [ )"
            >
              ⤓
            </button>
          </div>
          <div
            className="image-node-handle image-node-rotate"
            onPointerDown={beginDrag('rotate')}
            onPointerMove={onDragMove}
            onPointerUp={onDragEnd}
            onPointerCancel={onDragEnd}
          />
          <div
            className="image-node-handle image-node-resize"
            onPointerDown={beginDrag('resize')}
            onPointerMove={onDragMove}
            onPointerUp={onDragEnd}
            onPointerCancel={onDragEnd}
          />
        </>
      )}
    </div>
  );
}
