import { useCallback, useEffect, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { applyEffectLayer, applyGrainOverlay } from '../lib/effects';
import type { PlacedImage } from '../lib/imageNode';

interface ImageNodeProps {
  image: PlacedImage;
  selected: boolean;
  onSelect: (id: string) => void;
  onUpdate: (id: string, patch: Partial<PlacedImage>) => void;
  onDelete: (id: string) => void;
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

export default function ImageNode({ image, selected, onSelect, onUpdate, onDelete }: ImageNodeProps) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const loadedRef = useRef(false);

  // Raster compositing: fold the effect stack in order (each layer's output
  // feeds the next), then the grain overlay on top. Order-dependent by design.
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !img.complete) return;

    const w = image.width, h = image.height;
    canvas.width = w;
    canvas.height = h;

    let workCanvas = document.createElement('canvas');
    workCanvas.width = w;
    workCanvas.height = h;
    workCanvas.getContext('2d', { willReadFrequently: true })!.drawImage(img, 0, 0, w, h);

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

    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(workCanvas, 0, 0);

    if (image.grain > 0) applyGrainOverlay(ctx, w, h, image.grain);
  }, [image.effectStack, image.grain, image.width, image.height]);

  useEffect(() => {
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
  }, [image.src]);

  useEffect(() => {
    if (imgRef.current?.complete) render();
  }, [render]);

  const beginDrag = (mode: DragMode) => (e: ReactPointerEvent) => {
    e.stopPropagation();
    onSelect(image.id);
    (e.target as Element).setPointerCapture(e.pointerId);

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
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;

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
    dragRef.current = null;
  };

  return (
    <div
      ref={nodeRef}
      className={`image-node${selected ? ' selected' : ''}`}
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
      onClick={(e) => e.stopPropagation()}
    >
      <canvas ref={canvasRef} width={image.width} height={image.height} />

      {selected && (
        <>
          <button
            type="button"
            className="image-node-delete"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onDelete(image.id)}
            aria-label="delete image"
          >
            ×
          </button>
          <div
            className="image-node-handle image-node-rotate"
            onPointerDown={beginDrag('rotate')}
            onPointerMove={onDragMove}
            onPointerUp={onDragEnd}
          />
          <div
            className="image-node-handle image-node-resize"
            onPointerDown={beginDrag('resize')}
            onPointerMove={onDragMove}
            onPointerUp={onDragEnd}
          />
        </>
      )}
    </div>
  );
}
