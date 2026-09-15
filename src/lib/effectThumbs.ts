import { useEffect, useState } from 'react';
import { applyEffectLayer } from './effects';
import { EFFECT_DEFS } from './effectCatalog';

const SIZE = 64;

/** Rendered thumbs are stable per source image, so cache across mounts. */
const cache = new Map<string, Record<string, string>>();

/**
 * Renders every catalog effect onto a small square crop of the given photo,
 * so the panel can show what each effect actually does to *this* image
 * instead of 30 identical-looking buttons. Computed once per source.
 */
export function useEffectThumbs(src: string | null): Record<string, string> {
  const [thumbs, setThumbs] = useState<Record<string, string>>(
    () => (src ? cache.get(src) ?? {} : {})
  );

  useEffect(() => {
    if (!src) {
      setThumbs({});
      return;
    }
    const cached = cache.get(src);
    if (cached) {
      setThumbs(cached);
      return;
    }

    let cancelled = false;
    const img = new Image();
    img.src = src;
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
        0, 0, SIZE, SIZE
      );

      const baseUrl = base.toDataURL();
      const out: Record<string, string> = { base: baseUrl };
      for (const def of EFFECT_DEFS) {
        try {
          const result = applyEffectLayer(
            base,
            { id: 'thumb', type: def.type, opacity: 1, params: def.defaultParams },
            SIZE,
            SIZE
          );
          out[def.type] = result.toDataURL();
        } catch {
          out[def.type] = baseUrl;
        }
      }

      cache.set(src, out);
      if (!cancelled) setThumbs(out);
    };
    img.onerror = () => {
      if (!cancelled) setThumbs({});
    };

    return () => {
      cancelled = true;
    };
  }, [src]);

  return thumbs;
}
