import { useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { buildFilter, type PlacedImage } from '../lib/imageNode';

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
  const dragRef = useRef<DragState | null>(null);
  const loadedRef = useRef(false);

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

  const filter = buildFilter(image);
  const isPolaroid = image.layers.includes('polaroid');

  return (
    <div
      ref={nodeRef}
      className={`image-node${selected ? ' selected' : ''}${isPolaroid ? ' polaroid' : ''}`}
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
      <img
        src={image.src}
        alt=""
        draggable={false}
        style={filter ? { filter } : undefined}
        onLoad={(e) => {
          if (loadedRef.current) return;
          loadedRef.current = true;
          const el = e.currentTarget;
          if (el.naturalWidth && el.naturalHeight) {
            onUpdate(image.id, { height: image.width / (el.naturalWidth / el.naturalHeight) });
          }
        }}
      />

      {image.layers.includes('grain') && <div className="image-node-grain" />}
      {image.layers.includes('halftone') && <div className="image-node-halftone" />}
      {image.layers.includes('vhs') && <div className="image-node-vhs" />}

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
