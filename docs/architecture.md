# Architecture

## Real assets, not vectors

This is the core constraint of the whole rebuild (see README's "Why this is
a rebuild" for why). Every texture, sticker, and folder graphic is a real
photographed/scanned image, never a CSS or SVG recreation:

- **Textures** (`public/textures/`, manifest `src/lib/textures.ts`): grid
  paper, cream paper, photocopy grain, meadow photo backdrop, torn-paper
  strips. `paper-edge.png` / `paper-divider.png` / `paper-cream.jpg` are
  **generated**, not vector-drawn, by `scripts/make_torn_paper.py`
  (Pillow + numpy — real scanned grain from `paper-photocopy.jpg`,
  high-passed to kill streaks; clean page uses synthetic isotropic grain).
  Re-run: `python scripts/make_torn_paper.py`.
- **Stickers** (`public/stickers/`, 19 files, manifest `src/lib/stickers.ts`):
  background-removed scans, cut via `scripts/cut_assets.py` (flood-fill from
  the image borders, preserves interior whites — this beat `rembg` for these
  specific assets, even though `rembg` is installed). Re-run:
  `python scripts/cut_assets.py`.
- **Folders** (`public/folders/`, 11 files, manifest `src/lib/folders.ts`):
  same cutout pipeline, used as recipe-preset cards in `FolderShelf`.

If a future task looks like "draw a torn paper edge" or "make a sticker
shape" — stop. It should be a real image asset run through the scripts
above, not hand-authored SVG/CSS.

## File map

```
src/
  App.tsx                    top-level state: notebook, scene, splash/folders visibility
  main.tsx                   entry
  index.css                  global reset; @imports tokens.css and shared.css
  styles/
    tokens.css                 design tokens (color, shadow, font vars) — ported verbatim from old globals.css
    shared.css                  cross-cutting primitives used by 2+ components (currently: .sticker-btn)
    components/                 one CSS file per component, each imported directly by its .tsx file —
                                 see "Where a component's CSS lives" below
  lib/
    textures.ts                NOTEBOOKS (paper types) + SCENES (backdrops) + TEXTURES registry
    stickers.ts                STICKERS registry + pickStickers() helper
    folders.ts                 FOLDERS registry (recipe-card content)
    imageNode.ts                PlacedImage type (x/y/width/height/rotation/effectStack/grain), createPlacedImage()
    effects/                    the raster IMAGE effects engine, split by category — see effects-engine.md
      index.ts                    applyEffectLayer() dispatcher, applyGrainOverlay(), re-exports types
      types.ts                    EffectType, EffectParams, EffectLayer, GRADIENT_MAP_PRESETS
      helpers.ts                  shared pixel-math helpers
      foundation.ts, color.ts, simplify.ts, stylize.ts, print.ts,
      distort.ts, glitch.ts, light.ts, final.ts   one file per EFFECT_CATALOG category
    effectCatalog.ts             EFFECT_CATALOG (9 categories x effect defs) for the "add effect" picker —
                                  source of truth for which effect belongs in which effects/*.ts file
    effectThumbs.ts              useEffectThumbs() hook — renders every catalog effect onto a 64px crop of the
                                  selected photo, cached per source image, so the panel shows real previews
    recipes.ts                   RECIPES — 18 preset effect stacks ported from binkli-reference, + applyRecipe()
    textEffects/                 the TEXT effects engine — TextConfig, TEXT_FONTS (17), 22 text renderers,
                                  split by TEXT_EFFECT_GROUPS category — see effects-engine.md
      index.ts                     renderTextCanvas() dispatcher, re-exports types
      types.ts                     TextEffectType, TextFontKey, TextConfig, TEXT_FONTS, TEXT_EFFECTS
      helpers.ts                   layout/prep/scratch/shade/tint helpers
      basics.ts, dimension.ts, light.ts, motion.ts, broken.ts   one file per TEXT_EFFECT_GROUPS category
    exportImage.ts                EXPORT_PRESETS + exportPlacedImage() — re-renders the effect stack fresh at
                                   export resolution (cover-fit into a preset, or native size) and downloads it.
                                   Independently replicates the live alpha-masking order — see effects-engine.md
    cutout.ts                     CutoutOptions, applyCutoutMask() (5 edge shapes), removeBackground()
                                   (perimeter k-means + feathered alpha, no bundled model)
    gradients.ts                  GRADIENT_PRESETS (12), renderGradient() — 6 generator types, used by GradientLab
    demos.ts                      generateDemos() — seeds the page with 5 real assets + tuned effect stacks
  components/
    SplashScreen.tsx           landing screen — matches splash2.png
    TopBar.tsx                 paper picker (scene backdrop folded in), recipes/clear-all/export (all wired)
    NotebookCanvas.tsx         the page surface; owns drag-drop/file-picker import + position clamping; also
                                renders the "+ add image" button as a sibling, not a child
    ImageNode.tsx              a placed photo or text node: <canvas> raster compositing +
                                move/resize/rotate/duplicate/delete/select. Owns the live alpha-masking order —
                                see effects-engine.md
    CanvasDecor.tsx            ambient washi tape + placed stickers on the canvas
    FloatingStickers.tsx       the drifting sticker layer — cursor repulsion, collisions, edge bounce
    EffectsPanel.tsx           right rail shell: node-editing state/handlers, switches between panel/*.tsx tabs
    panel/                      one file per EffectsPanel tab — see effects-engine.md
      TextTab.tsx, TextEffectTile.tsx    text-node write/font/effect controls
      AddTab.tsx                          search + category grid, calls addLayer()
      StackTab.tsx                        ordered layer list, grain, cutout/background-removal (photos only)
      paramConfig.ts, ParamRow.tsx        generic per-param editor for the Stack tab's expanded layer body
    FolderShelf.tsx            bottom drawer of recipe cards, wired to the effects engine
    ExportModal.tsx            format (6 presets + original) and PNG/JPG picker, calls lib/exportImage.ts
    FrameNode.tsx              a draggable layout guide (label tab, dims, dot grid) — 6 device/format presets
    GradientLab.tsx            preset picker for lib/gradients.ts, drops a generated background onto the page
scripts/
  cut_assets.py                 sticker/folder background removal (flood-fill)
  make_torn_paper.py            generates the torn-paper texture PNGs
public/
  textures/, stickers/, folders/    all real image assets, see above
references/                        78 design reference images
```

## Where a component's CSS lives

Every component imports its own CSS file directly (`import '../styles/components/X.css'` at the
top of `X.tsx`) — open the component file and its CSS import tells you exactly which stylesheet
to edit next. A class used by more than one component lives in `shared.css` (global primitives,
imported once from `index.css`) or, within the effects panel specifically, in
`components/EffectsPanel.css` (rules shared across 2+ panel tabs) — both call this out in a
comment at the point of use.

| Component | CSS file |
|---|---|
| `App.tsx` | `styles/components/App.css` |
| `TopBar.tsx` | `styles/components/TopBar.css` |
| `NotebookCanvas.tsx` | `styles/components/NotebookCanvas.css` (canvas, pan/zoom, empty state, zoom badge) |
| `ImageNode.tsx` | `styles/components/ImageNode.css` |
| `FrameNode.tsx` | `styles/components/FrameNode.css` |
| `EffectsPanel.tsx` | `styles/components/EffectsPanel.css` (shell: header, tabs, empty state, section heads, + rules shared across tabs) |
| `panel/AddTab.tsx` | `styles/components/panel/AddTab.css` |
| `panel/StackTab.tsx` | `styles/components/panel/StackTab.css` |
| `panel/TextTab.tsx` | `styles/components/panel/TextTab.css` |
| `FolderShelf.tsx` | `styles/components/FolderShelf.css` |
| `SplashScreen.tsx` | `styles/components/SplashScreen.css` |
| `CanvasDecor.tsx` | `styles/components/CanvasDecor.css` |
| `FloatingStickers.tsx` | `styles/components/FloatingStickers.css` |
| `ExportModal.tsx` | `styles/components/ExportModal.css` |
| `GradientLab.tsx` | `styles/components/GradientLab.css` (reuses ExportModal's `.export-panel` shell) |
| (cross-cutting: `.sticker-btn`) | `styles/shared.css` |

## Reference material

- `X:\CLAUDE\references\` — 78 design refs the aesthetic is drawn from
  (also copied into `binkli/references/`)
- `X:\CLAUDE\splash.png` — reference mock of the **main workstation** view
  (topbar with paper/scene pickers, canvas with empty-state hint, effects
  panel, recipe-folders drawer open, dark scene)
- `X:\CLAUDE\splash2.png` — reference mock of the **landing splash screen**
  (floating stickers, "MAKE IT WEIRD." headline, drop-an-image CTA)
- Both of the above are implemented and confirmed pixel-matching against the
  live app as of 2026-09-10 (`SplashScreen.tsx` for splash2, `App.tsx` +
  `TopBar`/`NotebookCanvas`/`EffectsPanel`/`FolderShelf` for splash).

## Design tokens quick reference

See `src/styles/tokens.css` for the full list. Highlights: warm paper bg
`#FBF6EE`, ink `#14121F`, cobalt accent `#2D3BCC`, signature "sticker button"
shadow (`0 3px 0 var(--ink)` — flat offset, not a blur). Fonts: Permanent
Marker (headline marker style), Kalam / Patrick Hand (handwritten body),
IBM Plex Mono (labels/mono), Plus Jakarta Sans (UI sans) — plus 12 more
handwritten/display fonts in `TEXT_FONTS` (`lib/textEffects/types.ts`) for
text nodes specifically.
