import { motion } from 'framer-motion';
import { FOLDERS } from '../lib/folders';

interface FolderShelfProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Bottom drawer of recipe/preset categories, shown as the REAL folder-tab
 * graphics (background-removed scans). Selecting a folder wires to the effect
 * recipes in a later step; for now it showcases the folders as designed.
 */
export default function FolderShelf({ open, onClose }: FolderShelfProps) {
  return (
    <motion.div
      className="folder-shelf"
      initial={false}
      animate={{ y: open ? 0 : '110%' }}
      transition={{ type: 'spring', stiffness: 320, damping: 34 }}
    >
      <div className="folder-shelf-head">
        <span className="folder-shelf-title">recipe folders</span>
        <span className="folder-shelf-hint">pick a vibe — presets land here soon</span>
        <button className="folder-shelf-close" onClick={onClose} aria-label="close">
          ×
        </button>
      </div>

      <div className="folder-row">
        {FOLDERS.map((f) => (
          <button key={f.label} className="folder-card" type="button">
            <img src={f.src} alt={f.label} draggable={false} />
            <span className="folder-card-label">{f.label}</span>
            <span className="folder-card-blurb">{f.blurb}</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
