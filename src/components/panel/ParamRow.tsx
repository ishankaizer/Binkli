// One editable row in a Stack-tab layer's expanded body. Which control it
// renders (slider/color/select/text) comes from PARAM_CONFIG in paramConfig.ts.

import { PARAM_CONFIG, type ParamKey } from './paramConfig';

export function ParamRow({ paramKey, value, onChange }: {
  paramKey: ParamKey;
  value: unknown;
  onChange: (v: string | number) => void;
}) {
  const cfg = PARAM_CONFIG[paramKey];
  if (!cfg) return null;

  return (
    <label className="fx-param">
      <span className="fx-param-label">{cfg.label}</span>
      {cfg.type === 'color' && (
        <input className="fx-color" type="color" value={String(value)} onChange={(e) => onChange(e.target.value)} />
      )}
      {cfg.type === 'select' && (
        <select className="fx-select" value={Number(value)} onChange={(e) => onChange(Number(e.target.value))}>
          {cfg.options!.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      )}
      {cfg.type === 'text' && (
        <input
          className="fx-text"
          type="text"
          placeholder="type here"
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {cfg.type === 'number' && (
        <>
          <input
            className="fx-range"
            type="range"
            min={cfg.min}
            max={cfg.max}
            step={cfg.step}
            value={Number(value)}
            onChange={(e) => onChange(Number(e.target.value))}
          />
          <output className="fx-param-value">{Math.round(Number(value))}</output>
        </>
      )}
    </label>
  );
}
