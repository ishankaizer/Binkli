import { useEffect, useRef } from 'react';
import '../styles/components/GradientLab.css';
import { GRADIENT_PRESETS, renderGradient, type GradientPreset } from '../lib/gradients';

interface GradientLabProps {
  open: boolean;
  onClose: () => void;
  onPick: (preset: GradientPreset) => void;
}

function Swatch({ preset }: { preset: GradientPreset }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const rendered = renderGradient(preset.config, 96, 72);
    canvas.width = 96;
    canvas.height = 72;
    canvas.getContext('2d')!.drawImage(rendered, 0, 0);
  }, [preset]);
  return <canvas ref={ref} className="grad-swatch" />;
}

/**
 * A curated set of generated backgrounds — pick one and it drops onto the
 * page as a new photo node, running through the exact same effect stack,
 * grain and export path as anything else. See lib/gradients.ts.
 */
export default function GradientLab({ open, onClose, onPick }: GradientLabProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="export-backdrop" onClick={onClose}>
      <div className="export-panel grad-panel" onClick={(e) => e.stopPropagation()}>
        <div className="export-head">
          <div>
            <div className="export-title">gradient lab</div>
            <div className="export-sub">pick a background, then make it weird like anything else</div>
          </div>
          <button type="button" className="export-close" onClick={onClose} aria-label="close">×</button>
        </div>

        <div className="export-body">
          <div className="grad-grid">
            {GRADIENT_PRESETS.map((p) => (
              <button key={p.id} type="button" className="grad-card" onClick={() => onPick(p)}>
                <Swatch preset={p} />
                <span className="grad-card-name">{p.emoji} {p.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
