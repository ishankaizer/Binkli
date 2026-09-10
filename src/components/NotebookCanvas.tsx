import { NOTEBOOKS, type NotebookKey } from '../lib/textures';
import CanvasDecor from './CanvasDecor';

interface NotebookCanvasProps {
  notebook: NotebookKey;
  hasContent: boolean;
}

export default function NotebookCanvas({ notebook, hasContent }: NotebookCanvasProps) {
  const paper = NOTEBOOKS.find((n) => n.key === notebook) ?? NOTEBOOKS[0];

  return (
    <div className="canvas-area">
      <div
        className={`notebook${paper.ruled ? ' ruled' : ''}`}
        style={{ backgroundImage: `url('${paper.texture}')` }}
      >
        <div className="margin-line" />

        <CanvasDecor />

        {/* Pan/zoom layer for image nodes (wired in Step 4) */}
        <div className="pan-layer" />

        {!hasContent && (
          <div className="empty-hint">
            <div>
              <div className="marker">drop an image.</div>
              <div className="sub">…then make it weird.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
