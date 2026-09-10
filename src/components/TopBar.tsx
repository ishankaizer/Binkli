import { NOTEBOOKS, SCENES, type NotebookKey, type SceneKey } from '../lib/textures';

interface TopBarProps {
  notebook: NotebookKey;
  scene: SceneKey;
  onNotebook: (k: NotebookKey) => void;
  onScene: (k: SceneKey) => void;
  onClear: () => void;
  onFolders: () => void;
}

export default function TopBar({ notebook, scene, onNotebook, onScene, onClear, onFolders }: TopBarProps) {
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

      <div className="picker-group">
        <span className="picker-label">scene</span>
        {SCENES.map((s) => (
          <button
            key={s.key}
            className={`picker-chip${scene === s.key ? ' is-active' : ''}`}
            onClick={() => onScene(s.key)}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="topbar-spacer" />

      <button className="sticker-btn" onClick={onFolders}>
        recipes
      </button>
      <button className="sticker-btn" onClick={onClear}>
        clear all
      </button>
      <button className="sticker-btn accent">export</button>
    </div>
  );
}
