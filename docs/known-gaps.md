# Known gaps

Everything genuinely lost in the Vite rebuild has been ported back (see
[`changelog.md`](./changelog.md) #10) — the items below were cut on purpose,
not missed. If a future task needs one of these, it's new work, not a bug.

- **Gradient Lab's live-tuning UI.** The original `binkli-reference` had a
  424-line live grain/blur/noise tuning panel for generated gradients.
  This rebuild ports the 12 presets (`lib/gradients.ts`) but drops a
  generated background onto the page as an ordinary photo node instead —
  picking a preset and then styling it with the real effect stack was
  judged the more valuable 80% for the size of the port.
- **Procedural demo art.** The original's `demos.ts` was ~150 lines of
  generated canvas art for the empty-state seed photos. This rebuild reuses
  the real sticker/folder scans already in `public/` instead, per the
  "real assets, not vectors" rule (see [`architecture.md`](./architecture.md)) —
  simpler, and consistent with why the rebuild exists at all.
- **Live Google Fonts search/API.** `TEXT_FONTS` (`lib/textEffects.ts`) is a
  static curated list of 17 fonts loaded via a `<link>` in `index.html`, not
  a searchable picker against the Google Fonts API. The user said "for now"
  when this was expanded from 5 to 17 (changelog #11) — a live search is a
  reasonable future ask, not an oversight.
- **A bundled background-removal model.** `lib/cutout.ts`'s
  `removeBackground()` is perimeter k-means clustering + feathered alpha,
  pure JS, no model. Real remove.bg-quality segmentation needs a bundled
  ONNX model (~80MB), judged not worth the install size here. `rembg` is
  used elsewhere in this user's other projects for cases where accuracy
  matters more than bundle size (see the portfolio repo's `scripts/cutout.py`).
