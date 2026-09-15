import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import TopBar from './components/TopBar';
import NotebookCanvas from './components/NotebookCanvas';
import EffectsPanel from './components/EffectsPanel';
import FolderShelf from './components/FolderShelf';
import ExportModal from './components/ExportModal';
import GradientLab from './components/GradientLab';
import SplashScreen from './components/SplashScreen';
import { FRAME_PRESETS, type FrameNodeData } from './components/FrameNode';
import { NOTEBOOKS, type NotebookKey } from './lib/textures';
import { createPlacedImage, createTextNode, duplicatePlacedImage, type PlacedImage } from './lib/imageNode';
import { applyRecipe, type Recipe } from './lib/recipes';
import { exportPlacedImage, type ExportFileType, type ExportPreset } from './lib/exportImage';
import { renderGradient, type GradientPreset } from './lib/gradients';
import { generateDemos } from './lib/demos';
import './styles/workstation.css';

export default function App() {
  const [notebook, setNotebook] = useState<NotebookKey>('grid');
  const [showSplash, setShowSplash] = useState(true);
  const [showFolders, setShowFolders] = useState(false);
  const [images, setImages] = useState<PlacedImage[]>(() => generateDemos());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [frames, setFrames] = useState<FrameNodeData[]>([]);
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null);
  const [showGradientLab, setShowGradientLab] = useState(false);
  // Copy/paste clipboard, holds a full PlacedImage snapshot, not just an id,
  // so it survives the original being deleted before pasting.
  const clipboardRef = useRef<PlacedImage | null>(null);

  const paper = NOTEBOOKS.find((n) => n.key === notebook) ?? NOTEBOOKS[0];
  const selectedImage = images.find((img) => img.id === selectedId) ?? null;

  const addFiles = useCallback((files: File[], centerX: number, centerY: number) => {
    const created = files.map((file, i) => createPlacedImage(file, centerX + i * 18, centerY + i * 18));
    setImages((prev) => [...prev, ...created]);
    setSelectedId(created[created.length - 1]?.id ?? null);
  }, []);

  const updateImage = useCallback((id: string, patch: Partial<PlacedImage>) => {
    setImages((prev) => prev.map((img) => (img.id === id ? { ...img, ...patch } : img)));
  }, []);

  const deleteImage = useCallback((id: string) => {
    setImages((prev) => {
      const target = prev.find((img) => img.id === id);
      const rest = prev.filter((img) => img.id !== id);
      // A duplicate shares its original's object URL, so only release it once
      // nothing else on the page is still drawing from it.
      if (target?.src && !rest.some((img) => img.src === target.src)) {
        URL.revokeObjectURL(target.src);
      }
      return rest;
    });
    setSelectedId((cur) => (cur === id ? null : cur));
  }, []);

  const clearAll = useCallback(() => {
    setImages((prev) => {
      new Set(prev.map((img) => img.src).filter(Boolean)).forEach((src) => URL.revokeObjectURL(src));
      return [];
    });
    setSelectedId(null);
  }, []);

  /** Nodes paint in array order, so front/back is just a move within it. */
  const restack = useCallback((id: string, to: 'front' | 'back') => {
    setImages((prev) => {
      const node = prev.find((img) => img.id === id);
      if (!node) return prev;
      const rest = prev.filter((img) => img.id !== id);
      return to === 'front' ? [...rest, node] : [node, ...rest];
    });
  }, []);

  const addText = useCallback((centerX: number, centerY: number) => {
    const node = createTextNode(centerX, centerY);
    setImages((prev) => [...prev, node]);
    setSelectedId(node.id);
  }, []);

  const addGradient = useCallback((preset: GradientPreset) => {
    const canvas = renderGradient(preset.config, 480, 480);
    const centerX = 300, centerY = 220;
    const placed: PlacedImage = {
      id: crypto.randomUUID(),
      src: canvas.toDataURL('image/png'),
      x: centerX - 110,
      y: centerY - 110,
      width: 220,
      height: 220,
      rotation: Math.random() * 6 - 3,
      effectStack: [],
      grain: 0,
      cutout: { type: 'none', paperColor: '#F2EDE4', removeBackground: false, bgThreshold: 30 },
    };
    setImages((prev) => [...prev, placed]);
    setSelectedId(placed.id);
    setShowGradientLab(false);
  }, []);

  const selectImage = useCallback((id: string | null) => {
    setSelectedId(id);
    if (id) setSelectedFrameId(null);
  }, []);

  const selectFrame = useCallback((id: string | null) => {
    setSelectedFrameId(id);
    if (id) setSelectedId(null);
  }, []);

  const addFrame = useCallback((presetIndex: number, centerX: number, centerY: number) => {
    const preset = FRAME_PRESETS[presetIndex];
    if (!preset) return;
    const frame: FrameNodeData = {
      id: crypto.randomUUID(),
      label: preset.label,
      presetW: preset.presetW,
      presetH: preset.presetH,
      width: preset.displayW,
      height: preset.displayH,
      x: centerX - preset.displayW / 2,
      y: centerY - preset.displayH / 2,
      color: preset.color,
    };
    setFrames((prev) => [...prev, frame]);
    setSelectedFrameId(frame.id);
    setSelectedId(null);
  }, []);

  const updateFrame = useCallback((id: string, patch: Partial<FrameNodeData>) => {
    setFrames((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }, []);

  const deleteFrame = useCallback((id: string) => {
    setFrames((prev) => prev.filter((f) => f.id !== id));
    setSelectedFrameId((cur) => (cur === id ? null : cur));
  }, []);

  const duplicateImage = useCallback(
    (id: string) => {
      const source = images.find((img) => img.id === id);
      if (!source) return;
      const copy = duplicatePlacedImage(source);
      setImages((prev) => [...prev, copy]);
      setSelectedId(copy.id);
    },
    [images],
  );

  const copyImage = useCallback((id: string) => {
    const source = images.find((img) => img.id === id);
    if (source) clipboardRef.current = source;
  }, [images]);

  const pasteImage = useCallback(() => {
    const clip = clipboardRef.current;
    if (!clip) return;
    const copy = duplicatePlacedImage(clip);
    clipboardRef.current = copy; // cascade: repeated pastes step diagonally
    setImages((prev) => [...prev, copy]);
    setSelectedId(copy.id);
  }, []);

  const handleRecipe = useCallback((recipe: Recipe) => {
    if (!selectedId) return;
    updateImage(selectedId, applyRecipe(recipe));
  }, [selectedId, updateImage]);

  const runExport = useCallback(
    async (fileType: ExportFileType, preset: ExportPreset | null) => {
      if (!selectedImage) return;
      setExporting(true);
      try {
        await exportPlacedImage(selectedImage, fileType, preset);
        setShowExport(false);
      } finally {
        setExporting(false);
      }
    },
    [selectedImage],
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'Escape') {
        setSelectedId(null);
        setSelectedFrameId(null);
        return;
      }
      if (selectedFrameId && (e.key === 'Delete' || e.key === 'Backspace')) {
        e.preventDefault();
        deleteFrame(selectedFrameId);
        return;
      }
      if (!selectedId) return;
      const meta = e.metaKey || e.ctrlKey;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteImage(selectedId);
      } else if (meta && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        copyImage(selectedId);
      } else if (meta && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        duplicateImage(selectedId);
      } else if (e.key === ']') {
        e.preventDefault();
        restack(selectedId, 'front');
      } else if (e.key === '[') {
        e.preventDefault();
        restack(selectedId, 'back');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedId, selectedFrameId, deleteImage, copyImage, duplicateImage, restack, deleteFrame]);

  // A single native paste handler covers both sources: a real image on the OS
  // clipboard (a screenshot, an image copied from another app) is imported as
  // a new photo; otherwise, if a photo on the page was copied with Cmd/Ctrl+C,
  // paste duplicates it.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      const files = Array.from(e.clipboardData?.files ?? []).filter((f) => f.type.startsWith('image/'));
      if (files.length) {
        e.preventDefault();
        addFiles(files, 260, 260);
        return;
      }
      if (clipboardRef.current) {
        e.preventDefault();
        pasteImage();
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [addFiles, pasteImage]);

  return (
    <div className="workstation">
      <div className="scene-backdrop" style={{ background: paper.backdrop }} />

      <TopBar
        notebook={notebook}
        onNotebook={setNotebook}
        onClear={clearAll}
        onFolders={() => setShowFolders((v) => !v)}
        onExport={() => setShowExport(true)}
        foldersOpen={showFolders}
        hasContent={images.length > 0}
        hasSelection={selectedId !== null}
      />

      <NotebookCanvas
        paper={paper}
        hasContent={images.length > 0}
        images={images}
        selectedId={selectedId}
        onSelect={selectImage}
        onUpdate={updateImage}
        onDelete={deleteImage}
        onDuplicate={duplicateImage}
        onRestack={restack}
        onAddFiles={addFiles}
        onAddText={addText}
        onOpenGradientLab={() => setShowGradientLab(true)}
        frames={frames}
        selectedFrameId={selectedFrameId}
        onSelectFrame={selectFrame}
        onUpdateFrame={updateFrame}
        onDeleteFrame={deleteFrame}
        onAddFrame={addFrame}
      />

      <EffectsPanel image={selectedImage} onUpdate={updateImage} />

      <FolderShelf
        open={showFolders}
        onClose={() => setShowFolders(false)}
        hasSelection={selectedId !== null}
        onApply={handleRecipe}
      />

      <ExportModal
        open={showExport}
        onClose={() => {
          if (!exporting) setShowExport(false);
        }}
        onExport={runExport}
        busy={exporting}
      />

      <GradientLab
        open={showGradientLab}
        onClose={() => setShowGradientLab(false)}
        onPick={addGradient}
      />

      <AnimatePresence>
        {showSplash && <SplashScreen onStart={() => setShowSplash(false)} />}
      </AnimatePresence>
    </div>
  );
}
