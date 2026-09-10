# Binkli — project handoff

> Read this file first in any new session before touching code. It's the single
> source of truth for what Binkli is, what's built, and what's next. Keep it
> updated as work lands — this doc is the thing that keeps sessions in sync.

## THIS is the active project

`X:\CLAUDE\binkli` (this folder) is the **current, active** codebase — the
Vite + React rebuild described below. Work here.

`X:\CLAUDE\binkli-reference` is the **old, superseded** Next.js app kept only
as a read-only reference for what NOT to do (see "Why this is a rebuild").
Do not build features there.

**Deploy status (as of 2026-09-11): LIVE.** `https://binkli.vercel.app/`
serves this rebuild. It's connected to `github.com/ishankaizer/Binkli`;
Vercel's "Production Branch" setting was greyed out/disabled in the
dashboard for this project (cause unconfirmed), so instead of switching
branches there, the rebuild was pushed directly onto the branch Vercel
already tracks (`claude/image-effects-editor-app-Ixmsa`). Framework Preset
is set to Vite, output directory left at the Vite default (`dist`). The
`rebuild` branch also exists with the same content (redundant, harmless).
To ship a change: commit, then `git push origin rebuild && git push origin
rebuild:claude/image-effects-editor-app-Ixmsa` — a git push permission rule
is set in `.claude/settings.local.json` so this runs without a prompt.

## What this is

Binkli is a browser-based scrapbook/zine-style image-editing studio. Drop a
photo on a notebook page, then pile on tape, real die-cut stickers, torn
paper, and filters (blur, halftone, polaroid, VHS, riso...). Aesthetic:
Studio Dogu × Prickly Pear — handwritten fonts, torn paper, pastel palette,
sticker-button offset shadows, deadpan sticker wit.

## Why this is a rebuild

The original version (Next.js, `github.com/ishankaizer/Binkli`, branch
`claude/image-effects-editor-app-Ixmsa`) redrew the ripped-paper dividers as
flat 2D SVG bezier paths instead of using the real texture images the user
supplied. **The whole point of the rebuild is to respect real image assets
(PNG/JPG textures used as-is) and never redraw them as vector shapes.** This
rule governs every asset decision in this codebase — see "Real assets, not
vectors" below.

## Stack

- Vite + React 19 + TypeScript (not Next.js — deliberate change from the original)
- Framer Motion for animation
- Canvas 2D for image effects — raster, order-dependent layer stack (see Status #5)
- Plain CSS with design tokens (`src/styles/tokens.css`), no CSS framework
- Fonts via Google Fonts `<link>` in `index.html` (no Next.js font loader)

## Running it

```
cd X:\CLAUDE\binkli
npm run dev
```

Dev server on `http://localhost:5173`. Also registered as launch config
`binkli-dev` in `X:\CLAUDE\.claude\launch.json`.

**Browser verification gotcha:** the Claude Browser `computer{screenshot}`
tool times out in this environment. Use Playwright MCP
(`browser_navigate` → `browser_take_screenshot` to a file → `Read` the PNG)
for visual checks instead. Playwright's allowed filesystem root for
screenshots is `X:\CLAUDE` (or `X:\CLAUDE\.playwright-mcp`) — pass a relative
filename and it lands in `X:\CLAUDE\`.

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

## Real assets, not vectors

This is the core constraint of the whole rebuild. Every texture, sticker, and
folder graphic is a real photographed/scanned image, never a CSS or SVG
recreation:

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
  index.css                  global reset
  styles/
    tokens.css                design tokens (color, shadow, font vars) — ported verbatim from old globals.css
    workstation.css           all component styles
  lib/
    textures.ts                NOTEBOOKS (paper types) + SCENES (backdrops) + TEXTURES registry
    stickers.ts                STICKERS registry + pickStickers() helper
    folders.ts                 FOLDERS registry (recipe-card content)
    imageNode.ts                PlacedImage type (x/y/width/height/rotation/effectStack/grain), createPlacedImage()
    effects.ts                  the raster effects engine — ~30 canvas-based effect renderers + applyEffectLayer()
    effectCatalog.ts             EFFECT_CATALOG (7 categories x effect defs) for the "add effect" picker
  components/
    SplashScreen.tsx           landing screen — matches splash2.png
    TopBar.tsx                 paper/scene pickers, recipes/clear-all(wired)/export buttons
    NotebookCanvas.tsx         the page surface; owns drag-drop/file-picker import + position clamping
    ImageNode.tsx              a placed photo: <canvas> raster compositing + move/resize/rotate/delete/select
    CanvasDecor.tsx            ambient washi tape + placed stickers on the canvas
    EffectsPanel.tsx           right rail; ordered effect-stack editor (add/reorder/remove/opacity/params) + grain
    FolderShelf.tsx            bottom drawer of recipe-folder cards (display-only, not wired to effects yet)
scripts/
  cut_assets.py                 sticker/folder background removal (flood-fill)
  make_torn_paper.py            generates the torn-paper texture PNGs
public/
  textures/, stickers/, folders/    all real image assets, see above
references/                        78 design reference images
```

## Status / roadmap

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
   `lib/effects.ts`.
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
     deferred rather than rushed), recipe presets (`lib/recipes.ts`) wiring
     to this engine, gradient-lab. Flag if these matter for a future pass.
6. Export + gradient lab + recipe-folder wiring (folders are currently
   display-only, clicking a card does nothing yet) — not started

## Design tokens quick reference

See `src/styles/tokens.css` for the full list. Highlights: warm paper bg
`#FBF6EE`, ink `#14121F`, cobalt accent `#2D3BCC`, signature "sticker button"
shadow (`0 3px 0 var(--ink)` — flat offset, not a blur). Fonts: Permanent
Marker (headline marker style), Kalam / Patrick Hand (handwritten body),
IBM Plex Mono (labels/mono), Plus Jakarta Sans (UI sans).

## Standing preferences (carried over from the user's general working style)

- Implementation only — don't render spec/planning text in the UI itself.
- Keep the scrapbook aesthetic consistent; no emojis in code or UI copy.
- Minimal code comments — only for non-obvious WHY (e.g. why flood-fill beat
  rembg), never restating what the code does.
- Git push runs without a permission prompt (rule set in
  `.claude/settings.local.json`) — still push deliberately, not reflexively.
