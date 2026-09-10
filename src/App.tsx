import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import TopBar from './components/TopBar';
import NotebookCanvas from './components/NotebookCanvas';
import EffectsPanel from './components/EffectsPanel';
import FolderShelf from './components/FolderShelf';
import SplashScreen from './components/SplashScreen';
import { SCENES, type NotebookKey, type SceneKey } from './lib/textures';
import './styles/workstation.css';

export default function App() {
  const [notebook, setNotebook] = useState<NotebookKey>('grid');
  const [scene, setScene] = useState<SceneKey>('cream');
  const [showSplash, setShowSplash] = useState(true);
  const [showFolders, setShowFolders] = useState(false);

  // Image nodes arrive in Step 4; the shell already accounts for them.
  const hasContent = false;

  const backdrop = SCENES.find((s) => s.key === scene) ?? SCENES[0];

  return (
    <div className="workstation">
      <div className="scene-backdrop" style={{ background: backdrop.background }} />

      <TopBar
        notebook={notebook}
        scene={scene}
        onNotebook={setNotebook}
        onScene={setScene}
        onClear={() => {}}
        onFolders={() => setShowFolders((v) => !v)}
      />

      <NotebookCanvas notebook={notebook} hasContent={hasContent} />

      <EffectsPanel />

      <FolderShelf open={showFolders} onClose={() => setShowFolders(false)} />

      <AnimatePresence>
        {showSplash && <SplashScreen onStart={() => setShowSplash(false)} />}
      </AnimatePresence>
    </div>
  );
}
