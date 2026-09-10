import { useRef } from 'react';
import type { DragEvent } from 'react';
import { NOTEBOOKS, type NotebookKey } from '../lib/textures';
import type { PlacedImage } from '../lib/imageNode';
import CanvasDecor from './CanvasDecor';
import ImageNode from './ImageNode';

interface NotebookCanvasProps {
  notebook: NotebookKey;
  hasContent: boolean;
  images: PlacedImage[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onUpdate: (id: string, patch: Partial<PlacedImage>) => void;
  onDelete: (id: string) => void;
  onAddFiles: (files: File[], centerX: number, centerY: number) => void;
}

export default function NotebookCanvas({
  notebook,
  hasContent,
  images,
  selectedId,
  onSelect,
  onUpdate,
  onDelete,
  onAddFiles,
}: NotebookCanvasProps) {
  const paper = NOTEBOOKS.find((n) => n.key === notebook) ?? NOTEBOOKS[0];
  const pageRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    const rect = pageRef.current?.getBoundingClientRect();
    if (!rect) return;
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
    if (!files.length) return;
    onAddFiles(files, e.clientX - rect.left, e.clientY - rect.top);
  };

  const openPicker = () => fileInputRef.current?.click();

  // Keep at least MARGIN px of a node inside the page so a drag can never
  // shove a photo fully outside the notebook's clipped bounds (unreachable).
  const MARGIN = 40;
  const handleUpdate = (id: string, patch: Partial<PlacedImage>) => {
    const rect = pageRef.current?.getBoundingClientRect();
    const img = images.find((i) => i.id === id);
    if (!rect || !img) {
      onUpdate(id, patch);
      return;
    }
    const width = patch.width ?? img.width;
    const height = patch.height ?? img.height;
    const clamped = { ...patch };
    if (patch.x !== undefined) {
      clamped.x = Math.min(Math.max(patch.x, MARGIN - width), rect.width - MARGIN);
    }
    if (patch.y !== undefined) {
      clamped.y = Math.min(Math.max(patch.y, MARGIN - height), rect.height - MARGIN);
    }
    onUpdate(id, clamped);
  };

  const handleFileChange = () => {
    const files = Array.from(fileInputRef.current?.files ?? []);
    const rect = pageRef.current?.getBoundingClientRect();
    if (files.length && rect) {
      onAddFiles(files, rect.width / 2, rect.height / 2);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="canvas-area">
      <div
        ref={pageRef}
        className={`notebook${paper.ruled ? ' ruled' : ''}`}
        style={{ backgroundImage: `url('${paper.texture}')` }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => onSelect(null)}
      >
        <div className="margin-line" />

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
            </div>
          </div>
        )}

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
