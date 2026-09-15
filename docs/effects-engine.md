# The effects engine

Read this before touching anything under `src/lib/effects/` or the Stack tab
in `src/components/panel/`. It's the raster image-effects system: canvas in,
canvas out, stackable and order-dependent.

## Where things live

`src/lib/effects/` is split by category, matching `effectCatalog.ts`'s
`EFFECT_CATALOG` grouping exactly — that file is the source of truth for
which effect belongs in which category, not this doc:

| File | Category | Effects |
|---|---|---|
| `foundation.ts` | Foundation | exposure, contrast, brightness, saturation, hue shift, levels, colour balance, posterize, invert |
| `color.ts` | Color | gradient map, duotone, overprint, cross-process, bleach bypass, two-tone threshold, solarize, thermal |
| `simplify.ts` | Simplify | blur, field blur, pixelate, crystallize |
| `stylize.ts` | Stylize | find edges, emboss, oil paint, comic, crosshatch |
| `print.ts` | Print | halftones (dot/circle/line), CMYK print, risograph, bitmap, dither, ASCII, dot matrix, stamp, word fill |
| `distort.ts` | Distort | chromatic aberration, VHS tape, glass warp, motion/radial blur, twirl, bulge, wave, kaleidoscope |
| `glitch.ts` | Glitch | pixel sort, slice shift, JPEG crush, CRT scanlines, channel swap |
| `light.ts` | Light | neon glow, vignette, bloom, light leak |
| `final.ts` | Final | sharpen, polaroid frame, VHS frame, texture overlay |
| `types.ts` | — | `EffectType`, `EffectParams`, `EffectLayer`, `GradientMapPreset`/`GRADIENT_MAP_PRESETS` |
| `helpers.ts` | — | shared pixel math: `hexToRgb`, `lum`, `c255`, `tmp`, `buildGradientLut`, `boxBlur`, `rgbToHsl`/`hslToRgb` |
| `index.ts` | — | `applyEffectLayer()` dispatcher (the big switch), `applyGrainOverlay()`, re-exports everything from `types.ts` |

**To find a bug in one effect**, open its category file directly — don't
read `index.ts` top to bottom, it's only the dispatcher. `index.ts` imports
every renderer by name and switches on `layer.type`; if an effect is
misbehaving, the renderer function itself (in its category file) is almost
always where the bug is, not the dispatch.

**External imports are unaffected.** Everything still comes from
`'../lib/effects'` or `'./effects'` — that path now resolves to
`effects/index.ts` automatically, so no call site anywhere in the codebase
needed to change when this was split (2026-09-16, see
[`changelog.md`](./changelog.md) #12).

**To add a new effect**: add its type to `EffectType` in `types.ts`, write
the renderer in the right category file (or a new one, if it's a genuinely
new category — then add it to `EFFECT_CATALOG` in `effectCatalog.ts` too),
export it, import it into `index.ts`, and add a `case` in
`applyEffectLayer`'s switch. Then add a `defaultParams` entry to the right
`*_FX` array in `effectCatalog.ts`, and a `PARAM_CONFIG` entry in
`src/components/panel/paramConfig.ts` for each new param key so its slider
actually shows up in the Stack tab.

## The panel side

`src/components/panel/` mirrors this split on the UI side:

- `TextTab.tsx` / `TextEffectTile.tsx` — text-node write/font/effect controls
- `AddTab.tsx` — the search + category grid that calls `addLayer()`
- `StackTab.tsx` — the ordered layer list, grain, and (photo nodes only) the
  cutout/background-removal controls
- `paramConfig.ts` / `ParamRow.tsx` — the generic per-param editor used by
  the Stack tab's expanded layer body

`components/EffectsPanel.tsx` itself is just the shell: it owns the
node-editing state and handlers (add/remove/reorder/patch layer, drag
reorder, grain, cutout) and switches between the three tab components. If a
bug is UI-only (a control not showing, a click not registering), start in
the tab file that owns that section, not `EffectsPanel.tsx`.

## Alpha masking

Both photo background-removal and text-effect containment use the same
pattern: **snapshot alpha before the effect stack runs, multiply it back in
after.** This is the fix for two real bugs (see `changelog.md` #11):

- **Photos** (`ImageNode.tsx` `render()`, and `exportImage.ts`): if
  `cutout.removeBackground` is on, `removeBackground()` runs against the
  *untouched* source first and its resulting alpha channel is saved. The
  effect stack then runs on the full-colour image (so duotone, halftone,
  etc. still see real content, not a photo with a hole already cut in it).
  After the stack, the saved alpha is multiplied back in
  (`Math.min(currentAlpha, savedAlpha)`), then grain, then the cutout edge
  shape (torn/rough/clean/circle) last.
- **Text nodes** (same two files): a text node's canvas starts fully
  transparent outside the glyphs. Some effects paint an opaque full-canvas
  rectangle before compositing (Pixelate is the clearest example — it fills
  the whole canvas black before drawing pixel blocks over it), which would
  otherwise turn the rectangular text box solid instead of only affecting
  the letters. The glyph alpha is snapshotted before the stack runs and
  clipped back in after, exactly like the background-removal case.

**If you add an effect that produces a visibly wrong result on a text
node** (a solid box instead of styled letters), it's very likely painting
an opaque base before compositing — that's expected and already handled by
the alpha re-clip above; it does not need a per-effect fix. Only worry about
this if the re-clip itself isn't running (check the `alphaMask` variable in
`ImageNode.tsx render()` and `exportImage.ts finishExport()`).

## Export vs. live preview

`exportImage.ts` re-renders the full effect stack fresh at export
resolution rather than scaling up the small on-page canvas, so it has to
independently replicate the live pipeline's ordering (background removal →
effect stack → alpha re-clip → grain → cutout shape). When you change the
live pipeline in `ImageNode.tsx`, check whether `exportImage.ts` needs the
matching change — the export bug in `changelog.md` #11 was exactly this:
the export path silently didn't call `removeBackground()`/
`applyCutoutMask()` at all, so it worked live but not on export. There is
no shared function for this ordering; it is duplicated by necessity (export
renders at a different resolution, and for photos may cover-fit into an
export preset first) — when editing one, check the other.
