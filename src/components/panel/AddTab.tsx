// EffectsPanel's "Add" tab: search + category grid of every effect in
// EFFECT_CATALOG, with a live thumbnail per tile and a badge when it's
// already applied to the selected node.

import '../../styles/components/panel/AddTab.css';
import type { EffectCategory } from '../../lib/effectCatalog';
import type { EffectParams, EffectType } from '../../lib/effects';

export function AddTab({ query, setQuery, filtered, thumbs, countOf, addLayer }: {
  query: string;
  setQuery: (q: string) => void;
  filtered: EffectCategory[];
  thumbs: Record<string, string>;
  countOf: (type: EffectType) => number;
  addLayer: (type: EffectType, defaultParams: EffectParams) => void;
}) {
  return (
    <>
      <input
        className="fx-search"
        type="search"
        value={query}
        placeholder="search effects"
        onChange={(e) => setQuery(e.target.value)}
      />
      {filtered.length === 0 && <p className="fx-stack-empty">Nothing matches “{query}”.</p>}
      {filtered.map((cat) => (
        <div key={cat.label} className="fx-cat" style={{ ['--fx' as string]: cat.color }}>
          <div className="fx-cat-head">
            <span className="fx-cat-dot" />
            {cat.label}
          </div>
          <div className="fx-cat-grid">
            {cat.defs.map((def) => {
              const n = countOf(def.type);
              return (
                <button
                  key={def.type}
                  type="button"
                  className={`fx-tile${n > 0 ? ' is-applied' : ''}`}
                  onClick={() => addLayer(def.type, def.defaultParams)}
                  title={`Add ${def.label}`}
                >
                  <span className="fx-tile-art">
                    {thumbs[def.type]
                      ? <img src={thumbs[def.type]} alt="" />
                      : <span className="fx-tile-sym">{def.symbol}</span>}
                    {n > 0 && <span className="fx-tile-badge">{n}</span>}
                  </span>
                  <span className="fx-tile-label">{def.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}
