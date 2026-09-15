# Changelog

Numbered status log, oldest first. Moved out of README.md so a session
investigating a specific area doesn't have to read the whole project history
first — see [`architecture.md`](./architecture.md) for current file layout,
[`effects-engine.md`](./effects-engine.md) for the effects system specifically.

1. Scaffold — **DONE**
2. Shell + canvas (topbar, notebook page, effects rail frame) — **DONE**
3. Real assets integrated (textures, stickers, folders wired into shell) — **DONE**
4. Image nodes — **DONE (2026-09-11).** Drag-and-drop or click-to-browse
   import, move/resize(aspect-locked)/rotate via handles, delete via button
   or Delete/Backspace, topbar "clear all" wired up. `ImageNode.tsx` +
   `lib/imageNode.ts`. Position is clamped so a drag can never push a photo
   fully outside the notebook's clipped bounds (was a real bug, now fixed).
5. Effects engine — **rebuilt as a raster, order-dependent stack (2026-09-11).**
   Superseded the earlier CSS-filter version (tone + fixed-order layers) at
   the user's explicit request: "photoshop style editing, raster based and
   proper layer based effects... if I place a gaussian blur and then another
   effect on top, it should be different than if the effect was applied
   before." Ported wholesale from the pre-rebuild Next.js app
   (`binkli-reference/app/lib/effects.ts`), which was already a
   framework-agnostic canvas engine — copied close to verbatim into
   `lib/effects.ts` (later split into `lib/effects/` by category, see
   [`effects-engine.md`](./effects-engine.md)).
   - **Data model** (`lib/imageNode.ts`): `PlacedImage.effectStack:
     EffectLayer[]` — an ordered array, each `{ id, type, opacity, params }`.
     `PlacedImage.grain: number` is a separate always-last overlay (matches
     the old app's model).
   - **Rendering** (`ImageNode.tsx`): the node is a `<canvas>`, not an `<img>`.
     `render()` folds the stack in array order — each layer's
     `applyEffectLayer()` output becomes the next layer's input (with opacity
     alpha-blended against the pre-layer state when < 100%) — then
     `applyGrainOverlay()` on top. This is why order matters: reordering two
     layers in the stack changes which canvas each one reads from. Verified
     directly: applying Blur-then-Duotone vs Duotone-then-Blur to the same
     photo produces byte-different canvas output (`canvas.toDataURL()`
     diffed programmatically in-session, not just eyeballed).
   - **Catalog** (`lib/effectCatalog.ts`): ~30 effect types across 7
     categories (Foundation: exposure/contrast/brightness/saturation/
     hue-shift/posterize; Color: gradient-map/duotone/overprint/
     cross-process/bleach-bypass/two-tone; Simplify: blur/field-blur/pixelate;
     Print: dot-grid/concentric/scanline halftones, risograph, bitmap,
     dither, ASCII, stamp, word-fill; Distort: chromatic/VHS-tape/glass-warp/
     motion-blur/radial-zoom; Light: neon/vignette; Final: sharpen/polaroid-
     frame/VHS-frame/texture-overlay) — this is the full catalog the user
     had built in the old app, not a trimmed-down subset.
   - **UI** (`EffectsPanel.tsx`): "add effect" buttons grouped by category;
     an ordered stack list with move-up/down, per-layer opacity slider, a
     generic param editor (`PARAM_CONFIG` maps each param key to a
     number/color/select/text control) driven by whatever keys are present
     on that layer's `params` object, and a remove button; a grain slider.
     Deliberately plain — the user said visual design will be decided later,
     so effort went into engine correctness and catalog completeness, not
     polish.
   - Perf: temp canvases created with `{ willReadFrequently: true }` — many
     effects (risograph, halftone, ASCII, bitmap) do per-cell `getImageData`
     reads in a loop, which Chrome flags without that hint.
   - **Not ported from the old app**: cutout/background-removal
     (`lib/cutout.ts`, 289 lines — a separate subsystem, deliberately
     deferred rather than rushed), gradient-lab. Recipe wiring is now done,
     see #7. Flag if cutout/gradient-lab matter for a future pass.
6. Export (v1) — superseded by #8: originally just downloaded the selected
   photo's small on-page `<canvas>` as a PNG, no format options.
7. Recipe wiring + live effect thumbnails + paper/scene merge —
   **DONE.** Picked back up after a session that ran out of credits mid-way
   with this work uncommitted (functionally complete, just never landed):
   - `lib/recipes.ts`: 18 preset effect stacks ported from
     `binkli-reference/app/lib/recipes.ts` (`RECIPES`, `applyRecipe()`).
     `FolderShelf` cards call `onApply(recipe)` → `App.tsx: handleRecipe`,
     which replaces the selected photo's `effectStack` + `grain` wholesale.
     Disabled with an inline hint ("select a photo on the page first") when
     nothing is selected.
   - `lib/effectThumbs.ts`: `useEffectThumbs(src)` renders every catalog
     effect onto a 64px crop of the *current* photo (cached per source), so
     both the "add effect" tile grid and each stacked layer's row show a
     real preview instead of a generic icon.
   - `EffectsPanel.tsx` rewritten: the stack list is now collapsible rows
     (thumbnail + name + opacity/setting count, click to expand params),
     each carrying its category colour via a `--fx` custom property (a
     4-deep stack reads as 4 distinguishable things); the "add effect" list
     became a 3-column tile grid grouped by category, each tile showing its
     live thumbnail and an applied-count badge.
   - `TopBar`/`lib/textures.ts`: the separate "scene" (backdrop) picker was
     folded into the paper picker — each `NotebookPaper` now carries its own
     `backdrop`, so `grid`/`ruled`/`plain`/`meadow`/`dark` is one control
     instead of two. Also added: Escape to deselect, `clear all`/`export`
     disabled states, recipes button active-state.
   - **What was actually missing when this was picked back up**: not the
     feature logic (it worked, verified end-to-end), but `workstation.css`
     had no rules at all for ~30 of the new class names the rewritten
     `EffectsPanel.tsx` introduced (`fx-layer-*`, `fx-param`, `fx-cat-*`,
     `fx-tile-*`, `panel-head`, `panel-empty*`, `panel-section-head`,
     `panel-count`, `panel-clear`). Everything rendered as unstyled block
     flow, passable by accident for plain text, badly overlapping for the
     flex rows (opacity/level sliders, the layer header). Added the missing
     CSS; removed the now-dead `.fx-param-row`/`.fx-layer-index`/
     `.fx-layer-remove`/`.fx-add-row` rules the rewrite had orphaned.
8. Recipe disabled-state fix, bigger canvas, add-image button, copy/paste/
   duplicate, drag-to-reorder effects, real export modal — **DONE.**
   - **Recipes "not working" bug**: `.folder-card:disabled` had no CSS at
     all, a card with no photo selected looked identical to an enabled one
     and silently did nothing when clicked, no error, no visual cue. This
     was the actual root cause (the wiring itself was already correct).
     Added a disabled state (greyed out, `cursor: not-allowed`) and styled
     `.folder-card-tag`, also missing.
   - **Canvas resized**: `.canvas-area`/`.notebook` no longer centre a
     fixed `min(62vw, 780px)` card with a decorative rotation. It now fills
     a uniform 28px margin on top/left/bottom, stopping at `right: 260px`
     so it tucks in just under the effects panel's torn edge.
   - **`+ add image`** (`NotebookCanvas.tsx`): a persistent button, top
     right of the canvas, opens the same file picker as the empty-state
     click. Had to be rendered as a sibling of `.canvas-area` (not a child),
     a child's z-index can never beat the effects panel's torn-edge image,
     which lives in a higher sibling stacking context, regardless of the
     value used, so it was rendering correctly but visually buried under
     the torn paper the whole time.
   - **Copy / paste / duplicate**: `lib/imageNode.ts: duplicatePlacedImage()`
     clones a photo (new id, fresh layer ids, offset position). Wired as a
     duplicate button on the selected node (top-left, mirrors the delete
     button), Cmd/Ctrl+D, Cmd/Ctrl+C then Cmd/Ctrl+V (cascades diagonally on
     repeated paste), and a native `paste` handler that imports a real image
     from the OS clipboard (a screenshot, a copied image) when there is one.
   - **Drag-to-reorder** (`EffectsPanel.tsx`): a grab handle (⠿) on each
     stacked layer, live reorder as the pointer crosses a neighbour's
     midpoint (not just on drop). The existing ↑/↓ buttons stay. Tracks the
     dragged id in a ref, not state, pointermove can fire faster than a
     state update commits between events, which silently dropped moves.
   - **Export rebuilt** (`lib/exportImage.ts`, `ExportModal.tsx`): re-renders
     the full effect stack fresh at export resolution (was exporting the
     small on-page canvas as-is). A preset cover-fits the source into the
     target frame, matching `binkli-reference`'s old behaviour; "Original
     size" skips that. Six presets (Square Post, Story, Poster, Album Cover,
     Wallpaper, Desktop) each carry an existing pastel token for their
     swatch, PNG/JPG choice, busy state while rendering.
9. Audit against the old app, 24 more effects, text nodes, panel rebuild —
   **DONE.** Audited `binkli-reference` feature by feature (see
   [`known-gaps.md`](./known-gaps.md) for what is knowingly not ported).
   - **Effects: 35 → 59.** Added Invert, Solarize, Levels, Colour Balance,
     Channel Swap, Find Edges, Emboss, Oil Paint (Kuwahara), Crosshatch,
     Comic, Crystallize, Twirl, Bulge, Wave, Kaleidoscope, Pixel Sort, Slice
     Shift, Bloom, Light Leak, Thermal, CMYK Print (real 4-ink screen angles),
     Dot Matrix, JPEG Crush, CRT Lines. Catalog regrouped into 9 categories
     (Stylize and Glitch are new).
   - **Word Fill is properly its own effect now**: `textMaskText` means the
     mask is built from the user's words, not fixed lorem, plus a paper colour.
   - **Text nodes** (`lib/textEffects.ts`): a node is now either photo-backed
     (`src`) or text-backed (`text`). Text renders to the same `<canvas>`, so
     the whole image effect stack, grain, recipes and export work on it with
     no special-casing. 22 text effects across Basics / Dimension / Light /
     Motion / Broken, each with a live preview tile drawn in the node's own
     font and colours.
   - **Effect visibility**: every stacked layer has an eye toggle. The
     `visible` flag already existed in the type and was honoured by both
     renderers — it just had no UI.
   - **Panel rebuilt**, it was a single 59-effect scroll: now Text / Add /
     Stack tabs, a search box, and reorder/remove moved into the expanded
     layer body (in the collapsed row they squeezed layer names down to
     "Oil Pa…"). Panel widened 320 → 356px.
   - **Floating stickers are back.** The old app had 28 vector-drawn doodles
     with cursor repulsion and collisions; the rebuild had 4 static images.
     Now the real die-cut scans drift, bounce and scatter from the pointer.
   - **Bugs fixed**: resizing re-ran the entire effect stack on every
     pointermove (a 3-effect stack made dragging unusable, now ~6ms/move,
     re-rastered once on release); the canvas bitmap ignored its own 4px
     print border so every photo was squashed ~8px against its box; a
     duplicate shared its original's object URL, so deleting either one blanked
     the other; `setPointerCapture` could throw and abort drag setup.
   - **Bring to front / send to back** restored (`]` / `[`, or the buttons on
     a selected node).
10. **The five remaining gaps from #9 — DONE.** Pan/zoom, frames, cutout,
    Gradient Lab, demo seeding are all in now, closing the old app's
    feature gap entirely (everything genuinely lost in the rebuild is
    ported; what's left unported was cut on purpose — see
    [`known-gaps.md`](./known-gaps.md)).
    - **Pan/zoom** (`NotebookCanvas.tsx`): scroll to zoom (25%-300%), drag
      empty paper to pan, a scale badge (bottom-center, click to reset) —
      matches the pre-rebuild app, plus one fix: React's synthetic `onWheel`
      is passive by default, so `preventDefault()` inside it silently failed
      and errored in dev. Wheel zoom now binds a real, non-passive listener.
      `ImageNode`/`FrameNode` both take a `scale` prop and divide pointer
      deltas by it, so drag/resize track correctly at any zoom level.
    - **Frames** (`FrameNode.tsx`): 6 presets (iPhone 14, Android, Square
      Post, 16:9 Slide, Laptop, Desktop) as draggable layout guides — a
      label tab, a dimension readout, a dot grid. Guides only, no effect
      stack, no resize/rotate; `+ frame` opens a preset picker.
    - **Cutout + background removal** (`lib/cutout.ts`, ported near-verbatim):
      5 edge shapes (none/torn/rough/clean/circle) and a from-scratch
      background remover (perimeter k-means clustering + feathered alpha,
      no bundled model). Lives in the Stack tab, photo nodes only. Order
      matters and is preserved from the original: bg-removal alpha is
      computed off the untouched source, the effect stack runs on full
      colour, the alpha mask multiplies back in, then grain, then the
      cutout shape — so an effect never sees a photo with a hole already in
      it. Wired into both the live `ImageNode` render and `exportImage.ts`
      (the export half of this broke later — see #11).
    - **Gradient Lab** (`lib/gradients.ts` ported near-verbatim,
      `GradientLab.tsx` new): 12 presets (linear/radial/aurora/blob/mesh/
      sweep types) render to a canvas and drop onto the page as an ordinary
      photo node — same effect stack, grain, cutout and export as anything
      else. Built as a compact preset grid in this app's own modal
      chrome (reuses `.export-panel`) rather than porting the original's
      424-line live-tuning UI (grain/blur/noise sliders); picking a
      generated background and then styling it with the effect stack was
      judged the more valuable 80% for the size of the port.
    - **Demo seeding** (`lib/demos.ts`, new): the page now opens with 5
      placed photos instead of empty. Unlike the original's demos.ts
      (~150 lines of procedural canvas art), these are the real
      sticker/folder scans already in `public/`, per the "real assets, not
      vectors" rule — reuses assets instead of adding new generation code.
11. **Export bg-removal bug, text-box mask bleed, font expansion — DONE (2026-09-16).**
    - **Cutout export bug**: `lib/exportImage.ts` never called `removeBackground()`/
      `applyCutoutMask()` — those only ran in the live `ImageNode.tsx` canvas.
      A PNG export with "remove background" checked shipped the original,
      un-cut background (reported as "coming out as a white background").
      Fixed by mirroring the live pipeline in `exportPlacedImage`/`finishExport`:
      snapshot the bg-removal alpha off the untouched fitted image, run the
      effect stack, multiply the alpha back in, then grain, then the cutout
      shape. Verified end-to-end in-browser: exported PNG alpha is 0 at the
      background and 255 on the subject.
    - **Text "mask field" bleed**: some effects (e.g. Pixelate) paint an
      opaque full-canvas rect before compositing; on a text node — whose
      canvas starts transparent outside the glyphs — that turned the whole
      rectangular text box solid instead of only affecting the letters.
      Fixed by snapshotting the glyph alpha before the effect stack runs and
      clipping back to it after (`ImageNode.tsx` render(), and the matching
      path in `exportImage.ts` for text export), the same technique already
      used for photo bg-removal alpha. See
      [`effects-engine.md`](./effects-engine.md#alpha-masking) for the pattern.
    - **More fonts**: `TEXT_FONTS` grew from 5 to 17 (added Caveat, Shadows
      Into Light, Architects Daughter, Gochi Hand, Indie Flower, Satisfy,
      Amatic SC, Bangers, Special Elite, Rock Salt, Bebas Neue, Anton), all
      via Google Fonts `<link>` in `index.html`. Plain dropdown, no search —
      the user said "for now", so no live Google Fonts API integration.
12. **Codebase reorganized for faster lookup — DONE (2026-09-16).** The
    single `lib/effects.ts` (1459 lines, 56 effect renderers) and
    `components/EffectsPanel.tsx` (683 lines, 3 unrelated tabs) had become
    the main cost of investigating any bug in this area — reading either
    file top to bottom to find one function ran into the tens of thousands
    of tokens. User asked directly for this to be fixed so future sessions
    don't have to "comb through everything to find the issue."
    - `lib/effects.ts` → `lib/effects/` split by the *existing* category
      grouping in `effectCatalog.ts` (Foundation/Color/Simplify/Stylize/
      Print/Distort/Glitch/Light/Final), plus `types.ts` and `helpers.ts`.
      `effects/index.ts` re-exports everything, so every existing
      `from '../lib/effects'` import kept working unchanged. See
      [`effects-engine.md`](./effects-engine.md) for the map.
    - `components/EffectsPanel.tsx` → `components/panel/` with one file per
      tab (`TextTab.tsx`, `AddTab.tsx`, `StackTab.tsx`) plus
      `paramConfig.ts` and `ParamRow.tsx` (shared by Stack) and
      `TextEffectTile.tsx` (shared by Text). `EffectsPanel.tsx` itself is
      now just the state/handlers shell that switches between them.
    - `README.md` (was 400+ lines, an undifferentiated mix of setup info
      and the full changelog) split into this file, `architecture.md`,
      `effects-engine.md`, and `known-gaps.md` — README itself is now just
      what a session needs before touching anything.
    - Verified with `tsc -b`, `vite build`, `oxlint`, and an in-browser
      check that ran one representative effect from each of the 9 new
      category files through the real dispatcher, plus a UI smoke test of
      all three panel tabs (Text/Add/Stack, including the cutout controls).
