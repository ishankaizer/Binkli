import { useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';

export interface FrameNodeData {
  id: string;
  label: string;
  presetW: number;
  presetH: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

export const FRAME_PRESETS: Array<{ label: string; presetW: number; presetH: number; displayW: number; displayH: number; color: string }> = [
  { label: 'iPhone 14', presetW: 390, presetH: 844, displayW: 146, displayH: 316, color: '#FF3D9A' },
  { label: 'Android', presetW: 360, presetH: 800, displayW: 135, displayH: 300, color: '#00CFCF' },
  { label: 'Square Post', presetW: 1080, presetH: 1080, displayW: 240, displayH: 240, color: '#FFD600' },
  { label: '16:9 Slide', presetW: 1920, presetH: 1080, displayW: 360, displayH: 203, color: '#2D3BCC' },
  { label: 'Laptop', presetW: 1440, presetH: 900, displayW: 320, displayH: 200, color: '#7B2FBE' },
  { label: 'Desktop', presetW: 1920, presetH: 1200, displayW: 336, displayH: 210, color: '#E83030' },
];

interface FrameNodeProps {
  frame: FrameNodeData;
  selected: boolean;
  scale: number;
  onSelect: () => void;
  onUpdate: (patch: Partial<FrameNodeData>) => void;
  onDelete: () => void;
}

/**
 * A layout guide, not a photo — no effect stack, no resize/rotate handles,
 * just a fixed-aspect frame you can drag around to plan a composition
 * against a real target size (a phone screen, a slide, a print size).
 */
export default function FrameNode({ frame, selected, scale, onSelect, onUpdate, onDelete }: FrameNodeProps) {
  const drag = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  const onPointerDown = (e: ReactPointerEvent) => {
    e.stopPropagation();
    onSelect();
    try {
      (e.target as Element).setPointerCapture(e.pointerId);
    } catch {
      /* pointer already gone */
    }
    drag.current = { startX: e.clientX, startY: e.clientY, origX: frame.x, origY: frame.y };
  };
  const onPointerMove = (e: ReactPointerEvent) => {
    const d = drag.current;
    if (!d) return;
    onUpdate({
      x: d.origX + (e.clientX - d.startX) / scale,
      y: d.origY + (e.clientY - d.startY) / scale,
    });
  };
  const onPointerUp = () => { drag.current = null; };

  const cols = Math.min(16, Math.floor(frame.width / 26));
  const rows = Math.min(10, Math.floor(frame.height / 26));
  const dots = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      dots.push(<span key={`${r}_${c}`} className="frame-dot" style={{ left: 12 + c * 26, top: 12 + r * 26, background: frame.color }} />);
    }
  }

  return (
    <div
      className={`frame-node${selected ? ' selected' : ''}`}
      style={{
        left: frame.x,
        top: frame.y,
        width: frame.width,
        height: frame.height,
        borderColor: frame.color,
        background: `${frame.color}0F`,
        zIndex: selected ? 998 : 0,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="frame-dots">{dots}</div>
      <div className="frame-label" style={{ background: frame.color }}>
        {frame.label} <span>{frame.presetW}×{frame.presetH}</span>
      </div>
      <div className="frame-dims" style={{ color: frame.color }}>
        {Math.round(frame.width)}×{Math.round(frame.height)} px
      </div>
      {selected && (
        <button
          type="button"
          className="image-node-delete"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onDelete}
          aria-label="delete frame"
        >
          ×
        </button>
      )}
    </div>
  );
}
