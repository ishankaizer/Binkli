# Binkli — project handoff

> Read this file first in any new session before touching code. Deep detail
> lives in [`docs/`](./docs) — this file is the short version plus what you
> need before you can safely make a change. Keep it updated as work lands.

## THIS is the active project

`X:\CLAUDE\binkli` (this folder) is the **current, active** codebase — the
Vite + React rebuild described below. Work here.

`X:\CLAUDE\binkli-reference` is the **old, superseded** Next.js app kept only
as a read-only reference for what NOT to do (see "Why this is a rebuild"
below). Do not build features there.

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
is set in `.claude/settings.local.json` so this runs without a prompt
(still push deliberately, not reflexively).

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
rule governs every asset decision in this codebase — see
[`docs/architecture.md`](./docs/architecture.md#real-assets-not-vectors).

## Stack

- Vite + React 19 + TypeScript (not Next.js — deliberate change from the original)
- Framer Motion for animation
- Canvas 2D for image effects — raster, order-dependent layer stack, see
  [`docs/effects-engine.md`](./docs/effects-engine.md)
- Plain CSS with design tokens (`src/styles/tokens.css`), no CSS framework
- Fonts via Google Fonts `<link>` in `index.html` (no Next.js font loader)

## Running it

```
cd X:\CLAUDE\binkli
npm run dev
```

Dev server on `http://localhost:5173`. Also registered as launch config
`binkli-dev` in `X:\CLAUDE\.claude\launch.json`.

`npm run build` (`tsc -b && vite build`) and `npm run lint` (oxlint) before
shipping anything non-trivial.

**Browser verification gotcha:** the Claude Browser `computer{screenshot}`
tool times out in this environment. Use Playwright MCP
(`browser_navigate` → `browser_take_screenshot` to a file → `Read` the PNG,
or `browser_evaluate` to drive the effects engine directly for a fast,
visual-free correctness check) instead. Playwright's allowed filesystem
root for screenshots is `X:\CLAUDE` (or `X:\CLAUDE\.playwright-mcp`) — pass
a relative filename and it lands in `X:\CLAUDE\`.

## Where to look for what

| Task looks like... | Read |
|---|---|
| A specific image or text effect renders wrong, or a new one needs adding | [`docs/effects-engine.md`](./docs/effects-engine.md) |
| A UI change — styling, spacing, colour, layout of any component | [`docs/architecture.md`](./docs/architecture.md#where-a-components-css-lives) — find the component, open its one CSS file, edit, done |
| Something works live but breaks on export (or vice versa) | [`docs/effects-engine.md`](./docs/effects-engine.md#export-vs-live-preview) |
| Where a file lives, or what a `lib/`/`components/` module owns | [`docs/architecture.md`](./docs/architecture.md) |
| "Didn't we already build/try this?" | [`docs/changelog.md`](./docs/changelog.md) |
| "Is X actually missing, or cut on purpose?" | [`docs/known-gaps.md`](./docs/known-gaps.md) |

Each of those docs is scoped to its own topic — read the one that matches
the task, not all of them.

## Standing preferences (carried over from the user's general working style)

- Implementation only — don't render spec/planning text in the UI itself.
- Keep the scrapbook aesthetic consistent; no emojis in code or UI copy.
- Minimal code comments — only for non-obvious WHY (e.g. why flood-fill beat
  rembg), never restating what the code does.
- Git push runs without a permission prompt (rule set in
  `.claude/settings.local.json`) — still push deliberately, not reflexively.
