import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import TopBar from './components/TopBar';
import NotebookCanvas from './components/NotebookCanvas';
import EffectsPanel from './components/EffectsPanel';
import FolderShelf from './components/FolderShelf';
import SplashScreen from './components/SplashScreen';
import { NOTEBOOKS, type NotebookKey } from './lib/textures';
import { createPlacedImage, type PlacedImage } from './lib/imageNode';
import { applyRecipe, type Recipe } from './lib/recipes';
import './styles/workstation.css';

export default function App() {
  const [notebook, setNotebook] = useState<NotebookKey>('grid');
  const [showSplash, setShowSplash] = useState(true);
  const [showFolders, setShowFolders] = useState(false);
  const [images, setImages] = useState<PlacedImage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

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
      if (target) URL.revokeObjectURL(target.src);
      return prev.filter((img) => img.id !== id);
    });
    setSelectedId((cur) => (cur === id ? null : cur));
  }, []);

  const clearAll = useCallback(() => {
    setImages((prev) => {
      prev.forEach((img) => URL.revokeObjectURL(img.src));
      return [];
    });
    setSelectedId(null);
  }, []);

  const handleRecipe = useCallback((recipe: Recipe) => {
    if (!selectedId) return;
    updateImage(selectedId, applyRecipe(recipe));
  }, [selectedId, updateImage]);

  const handleExport = useCallback(() => {
    if (!selectedId) return;
    const canvas = document.querySelector<HTMLCanvasElement>(`canvas[data-node="${selectedId}"]`);
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `binkli-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, [selectedId]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'Escape') {
        setSelectedId(null);
        return;
      }
      if (!selectedId) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteImage(selectedId);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedId, deleteImage]);

  return (
    <div className="workstation">
      <div className="scene-backdrop" style={{ background: paper.backdrop }} />

      <TopBar
        notebook={notebook}
        onNotebook={setNotebook}
        onClear={clearAll}
        onFolders={() => setShowFolders((v) => !v)}
        onExport={handleExport}
        foldersOpen={showFolders}
        hasContent={images.length > 0}
        hasSelection={selectedId !== null}
      />

      <NotebookCanvas
        paper={paper}
        hasContent={images.length > 0}
        images={images}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onUpdate={updateImage}
        onDelete={deleteImage}
        onAddFiles={addFiles}
      />

      <EffectsPanel image={selectedImage} onUpdate={updateImage} />

      <FolderShelf
        open={showFolders}
        onClose={() => setShowFolders(false)}
        hasSelection={selectedId !== null}
        onApply={handleRecipe}
      />

      <AnimatePresence>
        {showSplash && <SplashScreen onStart={() => setShowSplash(false)} />}
      </AnimatePresence>
    </div>
  );
}
