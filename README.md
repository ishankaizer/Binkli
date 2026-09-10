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
- Canvas 2D for image effects (planned, not yet wired)
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
    imageNode.ts                PlacedImage type, createPlacedImage(), buildFilter(), TONES/LAYERS
  components/
    SplashScreen.tsx           landing screen — matches splash2.png
    TopBar.tsx                 paper/scene pickers, recipes/clear-all(wired)/export buttons
    NotebookCanvas.tsx         the page surface; owns drag-drop/file-picker import + position clamping
    ImageNode.tsx              a placed photo: move/resize(aspect-locked)/rotate/delete/select
    CanvasDecor.tsx            ambient washi tape + placed stickers on the canvas
    EffectsPanel.tsx           right rail; tone (radio) + layers (toggle) controls for the selected photo
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
5. Effects engine — **DONE, expanded (2026-09-11).** Each photo has one
   `tone` (8 options: `none`, `duotone-blue`, `duotone-red`, `sepia`,
   `vintage`, `grayscale`, `invert`, `posterize` — mutually exclusive) plus
   freely-stackable `layers` (8: `blur`, `grain`, `halftone`, `vhs`, `noise`,
   `vignette`, `fade`, `polaroid`), each with a 0-100 intensity. Real per-
   pixel SVG filters (not CSS approximations) defined once in `App.tsx`:
   `#duotone-blue`, `#duotone-red`, `#posterize` (feComponentTransfer),
   `#noise-gen` (feTurbulence — genuine procedural grain, not an asset or a
   generated CSS pattern). Grain reuses the real `paper-photocopy.jpg` scan
   at `background-size: cover` (not tiled — that texture is soft photocopier
   banding, not fine grain, so tiling it small produced a blocky
   checkerboard). `EffectsPanel.tsx` shows every chip as a **live-filtered
   thumbnail swatch** of the selected photo (`Swatch` sub-component, reuses
   `buildFilter()` + the same overlay CSS classes as `ImageNode`) so you see
   what an effect does before applying it, plus an "adjust" section with
   intensity sliders for whichever tunable layers are currently active.
   `lib/imageNode.ts`: `ActiveLayer` type, `buildFilter()`, `layerStrength()`.
   Not yet built: canvas-based true halftone (currently a CSS dot-pattern
   overlay approximation), effect stack reordering, recipe-folder presets
   wiring to this engine, chromatic-aberration/pixelate/sharpen effects.
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
- No git repo initialized yet for this project (`X:\CLAUDE\binkli` has no
  `.git`) — ask before setting one up or pushing anywhere.
