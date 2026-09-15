import '../styles/components/TopBar.css';
import { NOTEBOOKS, type NotebookKey } from '../lib/textures';

interface TopBarProps {
  notebook: NotebookKey;
  onNotebook: (k: NotebookKey) => void;
  onClear: () => void;
  onFolders: () => void;
  onExport: () => void;
  foldersOpen: boolean;
  hasContent: boolean;
  hasSelection: boolean;
}

export default function TopBar({
  notebook,
  onNotebook,
  onClear,
  onFolders,
  onExport,
  foldersOpen,
  hasContent,
  hasSelection,
}: TopBarProps) {
  return (
    <div className="topbar">
      <div className="wordmark">
        binkli<span className="dot">.</span>
      </div>

      <div className="picker-group">
        <span className="picker-label">paper</span>
        {NOTEBOOKS.map((n) => (
          <button
            key={n.key}
            className={`picker-chip${notebook === n.key ? ' is-active' : ''}`}
            onClick={() => onNotebook(n.key)}
          >
            {n.label}
          </button>
        ))}
      </div>

      <div className="topbar-spacer" />

      <button className={`sticker-btn${foldersOpen ? ' is-active' : ''}`} onClick={onFolders}>
        recipes
      </button>
      <button className="sticker-btn" onClick={onClear} disabled={!hasContent}>
        clear all
      </button>
      <button
        className="sticker-btn accent"
        onClick={onExport}
        disabled={!hasSelection}
        title={hasSelection ? 'Download the selected photo as a PNG' : 'Select a photo to export it'}
      >
        export
      </button>
    </div>
  );
}
