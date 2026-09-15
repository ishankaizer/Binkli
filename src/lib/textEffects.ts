/**
 * Editable text as a first-class node. Text is laid out and drawn onto a
 * canvas here, which means the whole image effect stack in lib/effects.ts
 * composites on top of it for free — a text node can be halftoned, pixel
 * sorted or run through a recipe exactly like a photo.
 *
 * Everything below is real canvas drawing. No CSS text is rendered to screen,
 * so what you see on the page is what exports.
 */

export type TextEffectType =
  // classics
  | 'plain' | 'outline' | 'shadow' | 'long-shadow' | 'extrude' | 'letterpress'
  | 'neon' | 'gradient' | 'motion' | 'zoom'
  // current
  | 'chromatic' | 'bubble' | 'chrome' | 'sticker' | 'glitch' | 'halftone'
  | 'varsity' | 'marker' | 'arc' | 'rainbow' | 'echo' | 'ransom';

export type TextFontKey =
  | 'marker' | 'hand' | 'hand2' | 'sans' | 'mono'
  | 'caveat' | 'shadows' | 'architects' | 'gochi' | 'indie'
  | 'amatic' | 'bangers' | 'special-elite' | 'rock-salt' | 'bebas' | 'anton' | 'satisfy';

export interface TextConfig {
  text: string;
  font: TextFontKey;
  /** Cap height in px, in node-local space. */
  size: number;
  color: string;
  color2: string;
  effect: TextEffectType;
  /** Generic 0..100 intensity knob, meaning depends on the effect. */
  strength: number;
  align: CanvasTextAlign;
}

export const TEXT_FONTS: { key: TextFontKey; label: string; family: string; weight: string }[] = [
  { key: 'marker',       label: 'Marker',    family: '"Permanent Marker", cursive', weight: '400' },
  { key: 'hand',         label: 'Kalam',     family: '"Kalam", cursive', weight: '700' },
  { key: 'hand2',        label: 'Patrick',   family: '"Patrick Hand", cursive', weight: '400' },
  { key: 'caveat',       label: 'Caveat',    family: '"Caveat", cursive', weight: '700' },
  { key: 'shadows',      label: 'Shadows',   family: '"Shadows Into Light", cursive', weight: '400' },
  { key: 'architects',   label: 'Architect', family: '"Architects Daughter", cursive', weight: '400' },
  { key: 'gochi',        label: 'Gochi',     family: '"Gochi Hand", cursive', weight: '400' },
  { key: 'indie',        label: 'Indie',     family: '"Indie Flower", cursive', weight: '400' },
  { key: 'satisfy',      label: 'Satisfy',   family: '"Satisfy", cursive', weight: '400' },
  { key: 'amatic',       label: 'Amatic',    family: '"Amatic SC", cursive', weight: '700' },
  { key: 'bangers',      label: 'Bangers',   family: '"Bangers", cursive', weight: '400' },
  { key: 'special-elite', label: 'Typewriter', family: '"Special Elite", cursive', weight: '400' },
  { key: 'rock-salt',    label: 'Rock Salt', family: '"Rock Salt", cursive', weight: '400' },
  { key: 'bebas',        label: 'Bebas',     family: '"Bebas Neue", sans-serif', weight: '400' },
  { key: 'anton',        label: 'Anton',     family: '"Anton", sans-serif', weight: '400' },
  { key: 'sans',         label: 'Jakarta',   family: '"Plus Jakarta Sans", system-ui, sans-serif', weight: '800' },
  { key: 'mono',         label: 'Plex Mono', family: '"IBM Plex Mono", monospace', weight: '600' },
];

export interface TextEffectDef {
  type: TextEffectType;
  label: string;
  group: string;
  /** What the strength slider actually does, shown under the slider. */
  strengthLabel: string;
}

export const TEXT_EFFECTS: TextEffectDef[] = [
  { type: 'plain',       label: 'Plain',       group: 'Basics',  strengthLabel: 'unused' },
  { type: 'outline',     label: 'Outline',     group: 'Basics',  strengthLabel: 'stroke weight' },
  { type: 'shadow',      label: 'Hard Shadow', group: 'Basics',  strengthLabel: 'offset' },
  { type: 'long-shadow', label: 'Long Shadow', group: 'Basics',  strengthLabel: 'length' },
  { type: 'marker',      label: 'Highlighter', group: 'Basics',  strengthLabel: 'marker height' },
  { type: 'sticker',     label: 'Die-Cut',     group: 'Basics',  strengthLabel: 'cut width' },

  { type: 'extrude',     label: '3D Extrude',  group: 'Dimension', strengthLabel: 'depth' },
  { type: 'bubble',      label: 'Bubble',      group: 'Dimension', strengthLabel: 'inflation' },
  { type: 'letterpress', label: 'Letterpress', group: 'Dimension', strengthLabel: 'press depth' },
  { type: 'chrome',      label: 'Chrome',      group: 'Dimension', strengthLabel: 'polish' },
  { type: 'varsity',     label: 'Varsity',     group: 'Dimension', strengthLabel: 'outline weight' },

  { type: 'neon',        label: 'Neon',        group: 'Light',   strengthLabel: 'glow' },
  { type: 'gradient',    label: 'Gradient',    group: 'Light',   strengthLabel: 'angle' },
  { type: 'rainbow',     label: 'Rainbow',     group: 'Light',   strengthLabel: 'band spread' },

  { type: 'motion',      label: 'Motion Blur', group: 'Motion',  strengthLabel: 'distance' },
  { type: 'zoom',        label: 'Radial Blur', group: 'Motion',  strengthLabel: 'zoom' },
  { type: 'echo',        label: 'Echo',        group: 'Motion',  strengthLabel: 'spread' },
  { type: 'arc',         label: 'Arc',         group: 'Motion',  strengthLabel: 'curve' },

  { type: 'chromatic',   label: 'Chromatic',   group: 'Broken',  strengthLabel: 'split' },
  { type: 'glitch',      label: 'Glitch',      group: 'Broken',  strengthLabel: 'displacement' },
  { type: 'halftone',    label: 'Halftone',    group: 'Broken',  strengthLabel: 'dot size' },
  { type: 'ransom',      label: 'Ransom Note', group: 'Broken',  strengthLabel: 'chaos' },
];

export const TEXT_EFFECT_GROUPS = ['Basics', 'Dimension', 'Light', 'Motion', 'Broken'];

export function textEffectLabel(type: TextEffectType): string {
  return TEXT_EFFECTS.find((t) => t.type === type)?.label ?? type;
}

export function defaultTextConfig(): TextConfig {
  return {
    text: 'make it\nweird.',
    font: 'marker',
    size: 64,
    color: '#14121F',
    color2: '#E83030',
    effect: 'plain',
    strength: 50,
    align: 'center',
  };
}

/** Fonts are loaded via a stylesheet link; canvas needs them resolved first. */
export function fontsReady(): Promise<unknown> {
  return document.fonts ? document.fonts.ready : Promise.resolve();
}

function fontOf(cfg: TextConfig, sizeOverride?: number): string {
  const f = TEXT_FONTS.find((t) => t.key === cfg.font) ?? TEXT_FONTS[0];
  return `${f.weight} ${sizeOverride ?? cfg.size}px ${f.family}`;
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const out: string[] = [];
  for (const paragraph of text.split('\n')) {
    if (!paragraph.trim()) { out.push(''); continue; }
    let line = '';
    for (const word of paragraph.split(/\s+/)) {
      const next = line ? `${line} ${word}` : word;
      if (ctx.measureText(next).width > maxWidth && line) { out.push(line); line = word; }
      else line = next;
    }
    out.push(line);
  }
  return out;
}

interface Layout {
  lines: string[];
  lineHeight: number;
  startY: number;
  anchorX: number;
}

function layout(ctx: CanvasRenderingContext2D, cfg: TextConfig, w: number, h: number): Layout {
  ctx.font = fontOf(cfg);
  const pad = Math.max(8, cfg.size * 0.28);
  const lines = wrapLines(ctx, cfg.text || ' ', Math.max(24, w - pad * 2));
  const lineHeight = cfg.size * 1.18;
  const total = lines.length * lineHeight;
  const startY = (h - total) / 2 + lineHeight * 0.5;
  const anchorX = cfg.align === 'left' ? pad : cfg.align === 'right' ? w - pad : w / 2;
  return { lines, lineHeight, startY, anchorX };
}

function eachLine(l: Layout, fn: (line: string, x: number, y: number, i: number) => void) {
  l.lines.forEach((line, i) => fn(line, l.anchorX, l.startY + i * l.lineHeight, i));
}

function prep(ctx: CanvasRenderingContext2D, cfg: TextConfig) {
  ctx.font = fontOf(cfg);
  ctx.textAlign = cfg.align;
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
}

/** Renders one text node into a fresh canvas of w x h. */
export function renderTextCanvas(cfg: TextConfig, w: number, h: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(w));
  canvas.height = Math.max(1, Math.round(h));
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  prep(ctx, cfg);
  const l = layout(ctx, cfg, canvas.width, canvas.height);
  const s = Math.max(0, Math.min(100, cfg.strength)) / 100;

  switch (cfg.effect) {
    case 'outline': {
      ctx.strokeStyle = cfg.color;
      ctx.lineWidth = Math.max(1, cfg.size * (0.02 + s * 0.09));
      eachLine(l, (line, x, y) => ctx.strokeText(line, x, y));
      break;
    }
    case 'shadow': {
      const off = cfg.size * (0.02 + s * 0.12);
      ctx.fillStyle = cfg.color2;
      eachLine(l, (line, x, y) => ctx.fillText(line, x + off, y + off));
      ctx.fillStyle = cfg.color;
      eachLine(l, (line, x, y) => ctx.fillText(line, x, y));
      break;
    }
    case 'long-shadow': {
      const depth = Math.round(cfg.size * (0.08 + s * 0.85));
      ctx.fillStyle = cfg.color2;
      for (let d = depth; d > 0; d--) {
        eachLine(l, (line, x, y) => ctx.fillText(line, x + d, y + d));
      }
      ctx.fillStyle = cfg.color;
      eachLine(l, (line, x, y) => ctx.fillText(line, x, y));
      break;
    }
    case 'extrude': {
      const depth = Math.max(2, Math.round(cfg.size * (0.04 + s * 0.34)));
      for (let d = depth; d > 0; d--) {
        const t = d / depth;
        ctx.fillStyle = shade(cfg.color2, -0.35 * (1 - t));
        eachLine(l, (line, x, y) => ctx.fillText(line, x + d * 0.72, y + d));
      }
      ctx.fillStyle = cfg.color;
      eachLine(l, (line, x, y) => ctx.fillText(line, x, y));
      ctx.strokeStyle = shade(cfg.color, -0.5);
      ctx.lineWidth = Math.max(1, cfg.size * 0.02);
      eachLine(l, (line, x, y) => ctx.strokeText(line, x, y));
      break;
    }
    case 'letterpress': {
      const off = Math.max(1, cfg.size * (0.01 + s * 0.035));
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      eachLine(l, (line, x, y) => ctx.fillText(line, x, y + off));
      ctx.fillStyle = shade(cfg.color, -0.25);
      eachLine(l, (line, x, y) => ctx.fillText(line, x, y - off * 0.6));
      ctx.fillStyle = cfg.color;
      eachLine(l, (line, x, y) => ctx.fillText(line, x, y));
      break;
    }
    case 'neon': {
      const glow = 6 + s * 44;
      ctx.save();
      ctx.shadowColor = cfg.color2;
      ctx.strokeStyle = cfg.color2;
      ctx.lineWidth = Math.max(2, cfg.size * 0.05);
      for (let pass = 0; pass < 3; pass++) {
        ctx.shadowBlur = glow * (pass + 1) * 0.5;
        eachLine(l, (line, x, y) => ctx.strokeText(line, x, y));
      }
      ctx.shadowBlur = glow * 0.4;
      ctx.fillStyle = '#FFFFFF';
      eachLine(l, (line, x, y) => ctx.fillText(line, x, y));
      ctx.restore();
      break;
    }
    case 'gradient': {
      const angle = s * Math.PI;
      const dx = Math.cos(angle) * canvas.width, dy = Math.sin(angle) * canvas.height;
      const g = ctx.createLinearGradient((canvas.width - dx) / 2, (canvas.height - dy) / 2, (canvas.width + dx) / 2, (canvas.height + dy) / 2);
      g.addColorStop(0, cfg.color);
      g.addColorStop(1, cfg.color2);
      ctx.fillStyle = g;
      eachLine(l, (line, x, y) => ctx.fillText(line, x, y));
      break;
    }
    case 'rainbow': {
      const g = ctx.createLinearGradient(0, l.startY - cfg.size, 0, l.startY + l.lines.length * l.lineHeight);
      const bands = ['#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#00AEEF', '#5856D6', '#E83FBF'];
      bands.forEach((c, i) => g.addColorStop(Math.min(1, (i / (bands.length - 1)) * (0.4 + s)), c));
      ctx.fillStyle = g;
      eachLine(l, (line, x, y) => ctx.fillText(line, x, y));
      break;
    }
    case 'motion': {
      const dist = Math.max(1, Math.round(cfg.size * (0.02 + s * 0.35)));
      ctx.fillStyle = cfg.color;
      for (let d = dist; d >= 1; d--) {
        ctx.globalAlpha = 0.5 / dist;
        eachLine(l, (line, x, y) => ctx.fillText(line, x - d, y));
        eachLine(l, (line, x, y) => ctx.fillText(line, x + d, y));
      }
      ctx.globalAlpha = 1;
      eachLine(l, (line, x, y) => ctx.fillText(line, x, y));
      break;
    }
    case 'zoom': {
      const steps = 18;
      const max = 1 + s * 0.35;
      ctx.fillStyle = cfg.color;
      for (let i = steps; i >= 1; i--) {
        const k = 1 + (max - 1) * (i / steps);
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.scale(k, k);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
        ctx.globalAlpha = 0.55 / steps;
        eachLine(l, (line, x, y) => ctx.fillText(line, x, y));
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      eachLine(l, (line, x, y) => ctx.fillText(line, x, y));
      break;
    }
    case 'echo': {
      const spread = cfg.size * (0.05 + s * 0.45);
      for (let i = 4; i >= 1; i--) {
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = i % 2 ? cfg.color2 : cfg.color;
        eachLine(l, (line, x, y) => ctx.fillText(line, x + (spread * i) / 4, y + (spread * i) / 8));
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = cfg.color;
      eachLine(l, (line, x, y) => ctx.fillText(line, x, y));
      break;
    }
    case 'chromatic': {
      const off = cfg.size * (0.02 + s * 0.16);
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = '#FF0033';
      eachLine(l, (line, x, y) => ctx.fillText(line, x - off, y));
      ctx.fillStyle = '#00E5FF';
      eachLine(l, (line, x, y) => ctx.fillText(line, x + off, y));
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = cfg.color;
      ctx.globalAlpha = 0.85;
      eachLine(l, (line, x, y) => ctx.fillText(line, x, y));
      ctx.globalAlpha = 1;
      break;
    }
    case 'bubble': {
      // Inflate the silhouette with a fat round stroke, then light it from
      // above so it reads as a puffed-up balloon letter. The inflation is
      // deliberately modest — past about a sixth of the cap height the
      // counters close up and the word turns into one unreadable blob.
      const fat = cfg.size * (0.03 + s * 0.14);
      ctx.strokeStyle = shade(cfg.color, -0.5);
      ctx.lineWidth = fat + Math.max(2, cfg.size * 0.045);
      eachLine(l, (line, x, y) => ctx.strokeText(line, x, y));
      ctx.strokeStyle = cfg.color;
      ctx.lineWidth = fat;
      eachLine(l, (line, x, y) => ctx.strokeText(line, x, y));
      const g = ctx.createLinearGradient(0, l.startY - cfg.size * 0.75, 0, l.startY + cfg.size * 0.55);
      g.addColorStop(0, tint(cfg.color, 0.72));
      g.addColorStop(0.55, cfg.color);
      g.addColorStop(1, shade(cfg.color, -0.22));
      ctx.fillStyle = g;
      eachLine(l, (line, x, y) => ctx.fillText(line, x, y));
      // Highlight, clipped to the letterforms so it can only land on the type.
      ctx.save();
      ctx.globalCompositeOperation = 'source-atop';
      const hg = ctx.createLinearGradient(0, l.startY - cfg.size * 0.62, 0, l.startY - cfg.size * 0.05);
      hg.addColorStop(0, 'rgba(255,255,255,0.72)');
      hg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = hg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
      break;
    }
    case 'chrome': {
      const g = ctx.createLinearGradient(0, l.startY - cfg.size * 0.7, 0, l.startY + cfg.size * 0.7);
      g.addColorStop(0.00, '#FFFFFF');
      g.addColorStop(0.28, '#9FB4C7');
      g.addColorStop(0.46, '#2B3A4A');
      g.addColorStop(0.54, '#6E88A0');
      g.addColorStop(0.72, '#FFFFFF');
      g.addColorStop(1.00, tint(cfg.color2, 0.25 + s * 0.4));
      ctx.fillStyle = g;
      eachLine(l, (line, x, y) => ctx.fillText(line, x, y));
      ctx.strokeStyle = '#14121F';
      ctx.lineWidth = Math.max(1, cfg.size * 0.022);
      eachLine(l, (line, x, y) => ctx.strokeText(line, x, y));
      break;
    }
    case 'sticker': {
      const cut = cfg.size * (0.06 + s * 0.16);
      ctx.save();
      ctx.shadowColor = 'rgba(20,18,31,0.35)';
      ctx.shadowBlur = cfg.size * 0.12;
      ctx.shadowOffsetY = cfg.size * 0.05;
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = cut * 2;
      eachLine(l, (line, x, y) => ctx.strokeText(line, x, y));
      ctx.restore();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = cut * 2;
      eachLine(l, (line, x, y) => ctx.strokeText(line, x, y));
      ctx.fillStyle = cfg.color;
      eachLine(l, (line, x, y) => ctx.fillText(line, x, y));
      break;
    }
    case 'varsity': {
      const step = cfg.size * (0.03 + s * 0.06);
      ctx.strokeStyle = cfg.color2;
      ctx.lineWidth = step * 4;
      eachLine(l, (line, x, y) => ctx.strokeText(line, x, y));
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = step * 2.4;
      eachLine(l, (line, x, y) => ctx.strokeText(line, x, y));
      ctx.fillStyle = cfg.color;
      eachLine(l, (line, x, y) => ctx.fillText(line, x, y));
      break;
    }
    case 'marker': {
      const bandH = cfg.size * (0.4 + s * 0.6);
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = cfg.color2;
      eachLine(l, (line, x, y) => {
        const wLine = ctx.measureText(line).width;
        if (!wLine) return;
        const left = cfg.align === 'center' ? x - wLine / 2 : cfg.align === 'right' ? x - wLine : x;
        const jitter = cfg.size * 0.06;
        ctx.beginPath();
        ctx.moveTo(left - jitter, y - bandH / 2 + jitter * 0.5);
        ctx.lineTo(left + wLine + jitter, y - bandH / 2 - jitter * 0.4);
        ctx.lineTo(left + wLine + jitter * 0.7, y + bandH / 2 + jitter * 0.3);
        ctx.lineTo(left - jitter * 0.8, y + bandH / 2 - jitter * 0.2);
        ctx.closePath();
        ctx.fill();
      });
      ctx.restore();
      ctx.fillStyle = cfg.color;
      eachLine(l, (line, x, y) => ctx.fillText(line, x, y));
      break;
    }
    case 'arc': {
      const bend = (s - 0.5) * 2; // -1..1
      ctx.fillStyle = cfg.color;
      eachLine(l, (line, _x, y) => {
        const chars = [...line];
        const widths = chars.map((c) => ctx.measureText(c).width);
        const totalW = widths.reduce((a, b) => a + b, 0);
        const radius = Math.max(cfg.size * 2, canvas.width) * (1.4 - Math.abs(bend) * 0.9);
        const arcAngle = totalW / radius;
        let angle = -arcAngle / 2;
        ctx.save();
        ctx.textAlign = 'center';
        ctx.translate(canvas.width / 2, y + (bend >= 0 ? radius : -radius));
        chars.forEach((c, i) => {
          const step = widths[i] / radius;
          angle += step / 2;
          ctx.save();
          ctx.rotate(bend >= 0 ? angle : -angle);
          ctx.translate(0, bend >= 0 ? -radius : radius);
          ctx.fillText(c, 0, 0);
          ctx.restore();
          angle += step / 2;
        });
        ctx.restore();
      });
      break;
    }
    case 'glitch': {
      const [base, bctx] = scratch(canvas.width, canvas.height);
      prep(bctx, cfg);
      bctx.fillStyle = cfg.color;
      eachLine(l, (line, x, y) => bctx.fillText(line, x, y));
      const shift = cfg.size * (0.04 + s * 0.3);
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(base, 0, 0);
      const bands = 9;
      for (let i = 0; i < bands; i++) {
        const y = Math.round((i / bands) * canvas.height);
        const bh = Math.ceil(canvas.height / bands);
        const dx = Math.round(Math.sin(i * 51.7) * shift);
        ctx.clearRect(0, y, canvas.width, bh);
        ctx.drawImage(base, 0, y, canvas.width, bh, dx, y, canvas.width, bh);
      }
      ctx.globalCompositeOperation = 'multiply';
      ctx.globalAlpha = 0.6;
      ctx.drawImage(base, -shift * 0.5, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      break;
    }
    case 'halftone': {
      const [, bctx] = scratch(canvas.width, canvas.height);
      prep(bctx, cfg);
      bctx.fillStyle = '#000000';
      eachLine(l, (line, x, y) => bctx.fillText(line, x, y));
      const data = bctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const cell = Math.max(3, Math.round(3 + s * 14));
      ctx.fillStyle = cfg.color;
      for (let y = cell / 2; y < canvas.height; y += cell) {
        for (let x = cell / 2; x < canvas.width; x += cell) {
          const i = ((Math.round(y) * canvas.width) + Math.round(x)) * 4;
          const a = data[i + 3] / 255;
          if (a < 0.05) continue;
          ctx.beginPath();
          ctx.arc(x, y, (cell / 2) * 0.95 * a, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    }
    case 'ransom': {
      const chaos = s;
      eachLine(l, (line, _x, y) => {
        const chars = [...line];
        const widths = chars.map((c) => ctx.measureText(c).width);
        const totalW = widths.reduce((a, b) => a + b, 0);
        let cx = l.anchorX - (cfg.align === 'center' ? totalW / 2 : cfg.align === 'right' ? totalW : 0);
        chars.forEach((c, i) => {
          const wCh = widths[i];
          if (c.trim()) {
            const rot = (Math.sin(i * 37.1 + y) * 0.22) * chaos;
            ctx.save();
            ctx.translate(cx + wCh / 2, y);
            ctx.rotate(rot);
            ctx.textAlign = 'center';
            const alt = (i + Math.round(y)) % 3;
            ctx.fillStyle = alt === 0 ? cfg.color2 : alt === 1 ? '#FFFFFF' : '#FFD600';
            const boxW = wCh * 1.18, boxH = cfg.size * 1.08;
            ctx.fillRect(-boxW / 2, -boxH / 2, boxW, boxH);
            ctx.fillStyle = alt === 1 ? cfg.color : '#14121F';
            ctx.fillText(c, 0, 0);
            ctx.restore();
          }
          cx += wCh;
        });
      });
      ctx.textAlign = cfg.align;
      break;
    }
    case 'plain':
    default: {
      ctx.fillStyle = cfg.color;
      eachLine(l, (line, x, y) => ctx.fillText(line, x, y));
      break;
    }
  }

  return canvas;
}

function scratch(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d', { willReadFrequently: true })!];
}

function parseHex(hex: string): [number, number, number] {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [0, 0, 0];
}

/** amount < 0 darkens toward black. */
function shade(hex: string, amount: number): string {
  const [r, g, b] = parseHex(hex);
  const k = 1 + amount;
  return `rgb(${Math.round(r * k)},${Math.round(g * k)},${Math.round(b * k)})`;
}

/** amount 0..1 lifts toward white. */
function tint(hex: string, amount: number): string {
  const [r, g, b] = parseHex(hex);
  return `rgb(${Math.round(r + (255 - r) * amount)},${Math.round(g + (255 - g) * amount)},${Math.round(b + (255 - b) * amount)})`;
}
