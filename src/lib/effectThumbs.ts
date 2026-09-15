import { useEffect, useState } from 'react';
import { applyEffectLayer } from './effects';
import { EFFECT_DEFS } from './effectCatalog';
import { fontsReady, renderTextCanvas, type TextConfig } from './textEffects';

const SIZE = 64;

/** Rendered thumbs are stable per source, so cache across mounts. */
const cache = new Map<string, Record<string, string>>();

function buildThumbs(base: HTMLCanvasElement): Record<string, string> {
  const baseUrl = base.toDataURL();
  const out: Record<string, string> = { base: baseUrl };
  for (const def of EFFECT_DEFS) {
    try {
      const result = applyEffectLayer(
        base,
        { id: 'thumb', type: def.type, opacity: 1, params: def.defaultParams },
        SIZE,
        SIZE,
      );
      out[def.type] = result.toDataURL();
    } catch {
      out[def.type] = baseUrl;
    }
  }
  return out;
}

/**
 * Renders every catalog effect onto a small square crop of the selected node,
 * so the panel shows what each effect actually does to *this* photo (or this
 * text) instead of 50-odd identical-looking buttons. Computed once per source.
 */
export function useEffectThumbs(src: string | null, text?: TextConfig): Record<string, string> {
  // Text thumbs only need redrawing when something visible about the text
  // changes, not on every keystroke of an unrelated field.
  const textKey = text ? `${text.text}|${text.font}|${text.color}|${text.color2}|${text.effect}|${text.strength}` : '';
  const key = text ? `text:${textKey}` : src;

  const [thumbs, setThumbs] = useState<Record<string, string>>(
    () => (key ? cache.get(key) ?? {} : {}),
  );

  useEffect(() => {
    if (!key) {
      setThumbs({});
      return;
    }
    const cached = cache.get(key);
    if (cached) {
      setThumbs(cached);
      return;
    }

    let cancelled = false;

    if (text) {
      fontsReady().then(() => {
        if (cancelled) return;
        const base = renderTextCanvas({ ...text, size: Math.max(12, SIZE * 0.42) }, SIZE, SIZE);
        const out = buildThumbs(base);
        cache.set(key, out);
        setThumbs(out);
      });
      return () => { cancelled = true; };
    }

    const img = new Image();
    img.src = src!;
    img.onload = () => {
      if (cancelled) return;
      const base = document.createElement('canvas');
      base.width = SIZE;
      base.height = SIZE;
      const bctx = base.getContext('2d', { willReadFrequently: true })!;
      const side = Math.min(img.naturalWidth, img.naturalHeight);
      bctx.drawImage(
        img,
        (img.naturalWidth - side) / 2,
        (img.naturalHeight - side) / 2,
        side,
        side,
        0, 0, SIZE, SIZE,
      );
      const out = buildThumbs(base);
      cache.set(key, out);
      if (!cancelled) setThumbs(out);
    };
    img.onerror = () => {
      if (!cancelled) setThumbs({});
    };

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return thumbs;
}
