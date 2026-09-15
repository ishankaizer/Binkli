import { applyEffectLayer, applyGrainOverlay } from './effects';
import type { PlacedImage } from './imageNode';
import { fontsReady, renderTextCanvas } from './textEffects';

export interface ExportPreset {
  id: string;
  name: string;
  ratio: string;
  pixels: string;
  width: number;
  height: number;
  /** Existing pastel design tokens (see tokens.css), just picked per preset for variety. */
  bg: string;
  accent: string;
}

export const EXPORT_PRESETS: ExportPreset[] = [
  { id: 'square', name: 'Square Post', ratio: '1:1', pixels: '2048 × 2048', width: 2048, height: 2048, bg: 'var(--pink-bg)', accent: 'var(--pink)' },
  { id: 'story', name: 'Story', ratio: '9:16', pixels: '1080 × 1920', width: 1080, height: 1920, bg: 'var(--lavender-bg)', accent: 'var(--lavender)' },
  { id: 'poster', name: 'Poster', ratio: '2:3', pixels: '2000 × 3000', width: 2000, height: 3000, bg: 'var(--butter-bg)', accent: 'var(--butter)' },
  { id: 'album', name: 'Album Cover', ratio: '1:1', pixels: '3000 × 3000', width: 3000, height: 3000, bg: 'var(--peach-bg)', accent: 'var(--peach)' },
  { id: 'wallpaper', name: 'Wallpaper', ratio: '9:19.5', pixels: '1290 × 2796', width: 1290, height: 2796, bg: 'var(--mint-bg)', accent: 'var(--mint)' },
  { id: 'desktop', name: 'Desktop', ratio: '16:9', pixels: '3840 × 2160', width: 3840, height: 2160, bg: 'var(--sky-bg)', accent: 'var(--sky)' },
];

export type ExportFileType = 'png' | 'jpg';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Re-renders the full effect stack at export resolution, not the small
 * on-page display size, then triggers a download. With a preset, the source
 * is cover-fit into the target frame (scaled to fill, centered, cropped),
 * matching the pre-rebuild app's behaviour.
 */
export async function exportPlacedImage(
  image: PlacedImage,
  fileType: ExportFileType,
  preset: ExportPreset | null,
): Promise<void> {
  // Text is re-drawn at export scale rather than upscaled, so it stays sharp
  // at 3000px the same way a photo's own pixels do.
  if (image.text) {
    await fontsReady();
    const scale = preset ? Math.max(preset.width / image.width, preset.height / image.height) : 3;
    const targetW = preset?.width ?? Math.round(image.width * scale);
    const targetH = preset?.height ?? Math.round(image.height * scale);
    const drawn = renderTextCanvas({ ...image.text, size: image.text.size * scale }, targetW, targetH);
    return finishExport(drawn, image, targetW, targetH, fileType, preset);
  }

  const imgEl = await loadImage(image.src);

  const targetW = preset?.width ?? (imgEl.naturalWidth || image.width);
  const targetH = preset?.height ?? (imgEl.naturalHeight || image.height);

  let work = document.createElement('canvas');
  work.width = targetW;
  work.height = targetH;
  const initCtx = work.getContext('2d', { willReadFrequently: true })!;

  if (preset) {
    const srcAspect = imgEl.naturalWidth / imgEl.naturalHeight;
    const dstAspect = targetW / targetH;
    let dw = targetW;
    let dh = targetH;
    let dx = 0;
    let dy = 0;
    if (srcAspect > dstAspect) {
      dh = targetH;
      dw = Math.round(targetH * srcAspect);
      dx = Math.round((targetW - dw) / 2);
    } else {
      dw = targetW;
      dh = Math.round(targetW / srcAspect);
      dy = Math.round((targetH - dh) / 2);
    }
    initCtx.fillStyle = '#FBF6EE';
    initCtx.fillRect(0, 0, targetW, targetH);
    initCtx.drawImage(imgEl, dx, dy, dw, dh);
  } else {
    initCtx.drawImage(imgEl, 0, 0, targetW, targetH);
  }

  finishExport(work, image, targetW, targetH, fileType, preset);
}

/** Folds the effect stack over an already-drawn base, then downloads it. */
function finishExport(
  base: HTMLCanvasElement,
  image: PlacedImage,
  targetW: number,
  targetH: number,
  fileType: ExportFileType,
  preset: ExportPreset | null,
) {
  let work = base;
  for (const layer of image.effectStack) {
    if (layer.visible === false) continue;
    const result = applyEffectLayer(work, layer, targetW, targetH);
    if (layer.opacity >= 0.99) {
      work = result;
    } else {
      const blended = document.createElement('canvas');
      blended.width = targetW;
      blended.height = targetH;
      const bctx = blended.getContext('2d', { willReadFrequently: true })!;
      bctx.drawImage(work, 0, 0);
      bctx.globalAlpha = layer.opacity;
      bctx.drawImage(result, 0, 0);
      bctx.globalAlpha = 1;
      work = blended;
    }
  }

  const ctx = work.getContext('2d', { willReadFrequently: true })!;
  if (image.grain > 0) applyGrainOverlay(ctx, targetW, targetH, image.grain);

  let exportCanvas = work;
  if (fileType === 'jpg') {
    const flat = document.createElement('canvas');
    flat.width = targetW;
    flat.height = targetH;
    const fctx = flat.getContext('2d')!;
    fctx.fillStyle = '#fff';
    fctx.fillRect(0, 0, targetW, targetH);
    fctx.drawImage(work, 0, 0);
    exportCanvas = flat;
  }

  const a = document.createElement('a');
  a.href = exportCanvas.toDataURL(fileType === 'jpg' ? 'image/jpeg' : 'image/png', 0.92);
  a.download = preset ? `binkli-${preset.id}.${fileType}` : `binkli-export.${fileType}`;
  a.click();
}
