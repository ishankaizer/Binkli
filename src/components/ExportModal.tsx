import { useEffect, useState } from 'react';
import '../styles/components/ExportModal.css';
import { EXPORT_PRESETS, type ExportFileType, type ExportPreset } from '../lib/exportImage';

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  onExport: (fileType: ExportFileType, preset: ExportPreset | null) => void;
  busy: boolean;
}

export default function ExportModal({ open, onClose, onExport, busy }: ExportModalProps) {
  const [presetId, setPresetId] = useState<string | null>(null);
  const [fileType, setFileType] = useState<ExportFileType>('png');

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      setPresetId(null);
      setFileType('png');
    }
  }, [open]);

  if (!open) return null;

  const preset = presetId ? (EXPORT_PRESETS.find((p) => p.id === presetId) ?? null) : null;

  return (
    <div className="export-backdrop" onClick={busy ? undefined : onClose}>
      <div className="export-panel" onClick={(e) => e.stopPropagation()}>
        <div className="export-head">
          <div>
            <div className="export-title">export</div>
            <div className="export-sub">choose a format, or skip for original size</div>
          </div>
          <button type="button" className="export-close" onClick={onClose} disabled={busy} aria-label="close">
            ×
          </button>
        </div>

        <div className="export-body">
          <div className="panel-group-label">format</div>
          <div className="export-grid">
            <button
              type="button"
              className={`export-preset${presetId === null ? ' is-active' : ''}`}
              onClick={() => setPresetId(null)}
            >
              <div className="export-preset-art export-preset-art--original">as placed</div>
              <div className="export-preset-name">Original size</div>
              <div className="export-preset-meta">no cropping or scaling</div>
            </button>
            {EXPORT_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`export-preset${presetId === p.id ? ' is-active' : ''}`}
                style={{ ['--preset-bg' as string]: p.bg, ['--preset-accent' as string]: p.accent }}
                onClick={() => setPresetId(p.id)}
              >
                <div className="export-preset-art">
                  <span className="export-preset-swatch" style={{ aspectRatio: `${p.width} / ${p.height}` }} />
                </div>
                <div className="export-preset-name">{p.name}</div>
                <div className="export-preset-meta">
                  {p.ratio} · {p.pixels}
                </div>
              </button>
            ))}
          </div>

          <div className="panel-group-label">file type</div>
          <div className="export-filetype-row">
            {(['png', 'jpg'] as const).map((t) => (
              <button
                key={t}
                type="button"
                className={`export-filetype${fileType === t ? ' is-active' : ''}`}
                onClick={() => setFileType(t)}
              >
                .{t.toUpperCase()}
                <span className="export-filetype-note">{t === 'png' ? 'transparency' : 'smaller file'}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="export-foot">
          <button
            type="button"
            className="sticker-btn accent export-download"
            onClick={() => !busy && onExport(fileType, preset)}
            disabled={busy}
          >
            {busy ? 'rendering…' : '↓ download'}
          </button>
        </div>
      </div>
    </div>
  );
}
