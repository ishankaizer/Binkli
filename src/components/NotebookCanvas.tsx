import { useRef, useState } from 'react';
import type { DragEvent } from 'react';
import type { NotebookPaper } from '../lib/textures';
import type { PlacedImage } from '../lib/imageNode';
import CanvasDecor from './CanvasDecor';
import ImageNode from './ImageNode';

interface NotebookCanvasProps {
  paper: NotebookPaper;
  hasContent: boolean;
  images: PlacedImage[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onUpdate: (id: string, patch: Partial<PlacedImage>) => void;
  onDelete: (id: string) => void;
  onAddFiles: (files: File[], centerX: number, centerY: number) => void;
}

export default function NotebookCanvas({
  paper,
  hasContent,
  images,
  selectedId,
  onSelect,
  onUpdate,
  onDelete,
  onAddFiles,
}: NotebookCanvasProps) {
  const pageRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dropping, setDropping] = useState(false);

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
    onAddFiles(files, e.clientX - rect.left, e.clientY - rect.top);
  };

  const openPicker = () => fileInputRef.current?.click();

  const handleFileChange = () => {
    const files = Array.from(fileInputRef.current?.files ?? []);
    const rect = pageRef.current?.getBoundingClientRect();
    if (files.length && rect) onAddFiles(files, rect.width / 2, rect.height / 2);
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
    const clampAxis = (v: number, size: number, extent: number) => {
      const slack = extent - size;
      return slack >= 0 ? Math.min(Math.max(v, 0), slack) : Math.min(Math.max(v, slack), 0);
    };
    const clamped = { ...patch };
    if (patch.x !== undefined) clamped.x = clampAxis(patch.x, width, rect.width);
    if (patch.y !== undefined) clamped.y = clampAxis(patch.y, height, rect.height);
    onUpdate(id, clamped);
  };

  return (
    <div className="canvas-area">
      <div
        ref={pageRef}
        className={`notebook${paper.ruled ? ' ruled' : ''}${dropping ? ' is-dropping' : ''}`}
        style={{ backgroundImage: `url('${paper.texture}')` }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => onSelect(null)}
      >
        {!paper.noMargin && <div className="margin-line" />}

        <CanvasDecor />

        <div className="pan-layer">
          {images.map((img) => (
            <ImageNode
              key={img.id}
              image={img}
              selected={img.id === selectedId}
              onSelect={onSelect}
              onUpdate={handleUpdate}
              onDelete={onDelete}
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
    </div>
  );
}
