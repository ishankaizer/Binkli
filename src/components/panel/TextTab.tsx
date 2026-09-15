// EffectsPanel's "Text" tab: the write/font/colour/effect controls for a text
// node. Only rendered when the selected node is text-backed.

import { TEXT_EFFECTS, TEXT_EFFECT_GROUPS, TEXT_FONTS, type TextConfig } from '../../lib/textEffects';
import { TextEffectTile } from './TextEffectTile';

export function TextTab({ text, patchText }: {
  text: TextConfig;
  patchText: (patch: Partial<TextConfig>) => void;
}) {
  return (
    <>
      <textarea
        className="tx-input"
        value={text.text}
        rows={3}
        spellCheck={false}
        placeholder="type something"
        onChange={(e) => patchText({ text: e.target.value })}
      />

      <div className="tx-row">
        <select
          className="fx-select"
          value={text.font}
          onChange={(e) => patchText({ font: e.target.value as TextConfig['font'] })}
        >
          {TEXT_FONTS.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
        </select>
        <div className="seg-mini" role="group" aria-label="align">
          {(['left', 'center', 'right'] as const).map((a) => (
            <button
              key={a}
              type="button"
              className={text.align === a ? 'is-active' : ''}
              onClick={() => patchText({ align: a })}
              aria-label={a}
            >
              {a === 'left' ? '⯇' : a === 'center' ? '≡' : '⯈'}
            </button>
          ))}
        </div>
      </div>

      <label className="fx-param">
        <span className="fx-param-label">size</span>
        <input
          className="fx-range"
          type="range"
          min={12}
          max={180}
          value={text.size}
          onChange={(e) => patchText({ size: Number(e.target.value) })}
        />
        <output className="fx-param-value">{text.size}</output>
      </label>

      <div className="tx-row">
        <label className="tx-swatch">
          <input type="color" value={text.color} onChange={(e) => patchText({ color: e.target.value })} />
          <span>main</span>
        </label>
        <label className="tx-swatch">
          <input type="color" value={text.color2} onChange={(e) => patchText({ color2: e.target.value })} />
          <span>accent</span>
        </label>
      </div>

      <label className="fx-param fx-param-solo">
        <span className="fx-param-label">amount</span>
        <input
          className="fx-range"
          type="range"
          min={0}
          max={100}
          value={text.strength}
          onChange={(e) => patchText({ strength: Number(e.target.value) })}
        />
        <output className="fx-param-value">{text.strength}</output>
      </label>

      {TEXT_EFFECT_GROUPS.map((group) => (
        <div key={group} className="fx-cat">
          <div className="fx-cat-head"><span className="fx-cat-dot" />{group}</div>
          <div className="tx-grid">
            {TEXT_EFFECTS.filter((t) => t.group === group).map((t) => (
              <TextEffectTile
                key={t.type}
                cfg={text}
                type={t.type}
                active={text.effect === t.type}
                onPick={() => patchText({ effect: t.type })}
              />
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
