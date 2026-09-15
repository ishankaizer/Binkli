// Live preview tile for one text effect, drawn with the node's own colours
// and font, shown in the Text tab's effect picker grid.

import { useEffect, useRef } from 'react';
import { TEXT_EFFECTS, fontsReady, renderTextCanvas, type TextConfig, type TextEffectType } from '../../lib/textEffects';

export function TextEffectTile({ cfg, type, active, onPick }: {
  cfg: TextConfig;
  type: TextEffectType;
  active: boolean;
  onPick: () => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const label = TEXT_EFFECTS.find((t) => t.type === type)?.label ?? type;

  useEffect(() => {
    let cancelled = false;
    fontsReady().then(() => {
      const canvas = ref.current;
      if (cancelled || !canvas) return;
      const preview = renderTextCanvas({ ...cfg, text: 'Aa', effect: type, size: 34 }, 78, 52);
      canvas.width = 78;
      canvas.height = 52;
      canvas.getContext('2d')!.drawImage(preview, 0, 0);
    });
    return () => { cancelled = true; };
  }, [cfg, type]);

  return (
    <button type="button" className={`tx-tile${active ? ' is-active' : ''}`} onClick={onPick} title={label}>
      <canvas ref={ref} className="tx-tile-art" />
      <span className="tx-tile-label">{label}</span>
    </button>
  );
}
