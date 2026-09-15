import { motion } from 'framer-motion';
import { RECIPES, type Recipe } from '../lib/recipes';

interface FolderShelfProps {
  open: boolean;
  onClose: () => void;
  /** Null when no photo is selected — recipes need a target. */
  hasSelection: boolean;
  onApply: (recipe: Recipe) => void;
}

/**
 * Recipe drawer: preset effect stacks, shown on the REAL folder-tab graphics
 * (background-removed scans). Clicking one replaces the selected photo's
 * stack and grain.
 */
export default function FolderShelf({ open, onClose, hasSelection, onApply }: FolderShelfProps) {
  return (
    <motion.div
      className="folder-shelf"
      initial={false}
      animate={{ y: open ? 0 : '110%' }}
      transition={{ type: 'spring', stiffness: 320, damping: 34 }}
    >
      <div className="folder-shelf-head">
        <span className="folder-shelf-title">recipes</span>
        <span className="folder-shelf-hint">
          {hasSelection
            ? 'click one to drop a whole stack onto the selected photo'
            : 'select a photo on the page first'}
        </span>
        <button className="folder-shelf-close" onClick={onClose} aria-label="close">×</button>
      </div>

      <div className="folder-row">
        {RECIPES.map((r) => (
          <button
            key={r.id}
            className="folder-card"
            type="button"
            disabled={!hasSelection}
            onClick={() => onApply(r)}
          >
            <img src={`/folders/${r.folder}.png`} alt="" draggable={false} />
            <span className="folder-card-label">{r.name}</span>
            <span className="folder-card-tag">{r.tag}</span>
            <span className="folder-card-blurb">{r.description}</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
