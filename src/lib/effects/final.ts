// Final category: sharpen, polaroid frame, VHS frame, texture overlay.
// These are meant to sit last in a stack. Mirrors effectCatalog.ts's
// FINAL_FX list exactly.

import type { EffectParams } from './types';

export function applySharpen(ctx: CanvasRenderingContext2D, sc: HTMLCanvasElement, w: number, h: number, p: EffectParams) {
  const amount = (p.sharpenAmount ?? 50) / 100;
  if (amount <= 0) { ctx.drawImage(sc, 0, 0, w, h); return; }
  const blurC = document.createElement('canvas');
  blurC.width = w; blurC.height = h;
  const bctx = blurC.getContext('2d', { willReadFrequently: true })!;
  bctx.filter = 'blur(1.5px)';
  bctx.drawImage(sc, 0, 0, w, h);

  const blur = bctx.getImageData(0, 0, w, h);
  const orig = sc.getContext('2d', { willReadFrequently: true })!.getImageData(0, 0, w, h);
  const out = ctx.createImageData(w, h);
  const o = orig.data, b = blur.data, x = out.data;
  for (let i = 0; i < o.length; i += 4) {
    x[i]   = Math.max(0, Math.min(255, o[i]   + (o[i]   - b[i])   * amount * 2));
    x[i+1] = Math.max(0, Math.min(255, o[i+1] + (o[i+1] - b[i+1]) * amount * 2));
    x[i+2] = Math.max(0, Math.min(255, o[i+2] + (o[i+2] - b[i+2]) * amount * 2));
    x[i+3] = o[i+3];
  }
  ctx.putImageData(out, 0, 0);
}

// ── Polaroid frame ────────────────────────────────────────────────────────────
export function applyPolaroid(ctx: CanvasRenderingContext2D, sc: HTMLCanvasElement, w: number, h: number, p: EffectParams) {
  const style  = p.polaroidStyle ?? 0;
  const bSide  = Math.round(w * 0.072);
  const bTop   = Math.round(h * 0.072);
  const bBot   = Math.round(h * 0.26);
  const photoW = w - bSide * 2;
  const photoH = h - bTop - bBot;
  const fill   = style === 2 ? '#1A1818' : style === 1 ? '#F2EACC' : '#F8F8F2';

  ctx.fillStyle = fill;
  ctx.fillRect(0, 0, w, h);

  ctx.shadowColor = 'rgba(0,0,0,0.22)'; ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 3; ctx.shadowOffsetY = 4;
  ctx.fillRect(bSide, bTop, photoW, photoH);
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;

  ctx.drawImage(sc, bSide, bTop, photoW, photoH);

  if (style === 1) {
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = 'rgba(240,210,140,0.12)';
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
  }

  const label = p.polaroidLabel ?? '';
  if (label) {
    const textColor = style === 2 ? '#D0C0A0' : style === 1 ? '#5A4020' : '#3A3028';
    const fontSize  = Math.max(12, Math.round(bBot * 0.28));
    ctx.fillStyle = textColor;
    ctx.font = `italic ${fontSize}px Georgia, "Times New Roman", serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(label, w / 2, h - bBot * 0.46);
  }
}

// ── VHS frame / tape decoration ───────────────────────────────────────────────
export function applyVhsFrame(ctx: CanvasRenderingContext2D, sc: HTMLCanvasElement, w: number, h: number, _p: EffectParams) {
  ctx.drawImage(sc, 0, 0, w, h);

  for (let y = 0; y < h; y += 3) {
    ctx.fillStyle = 'rgba(0,0,0,0.09)';
    ctx.fillRect(0, y, w, 1);
  }

  const barH = Math.round(h * 0.11);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, barH);
  ctx.fillRect(0, h - barH, w, barH);

  const dotR = Math.round(barH * 0.18);
  const dotX = Math.round(w * 0.05);
  const dotY = Math.round(barH * 0.5);
  ctx.fillStyle = '#FF2020';
  ctx.beginPath(); ctx.arc(dotX, dotY, dotR, 0, Math.PI * 2); ctx.fill();

  const fs = Math.round(barH * 0.38);
  ctx.fillStyle = '#FFF'; ctx.font = `bold ${fs}px monospace`;
  ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  ctx.fillText('● REC', Math.round(w * 0.09), dotY);
  ctx.textAlign = 'right'; ctx.fillStyle = '#FFFF80';
  ctx.fillText('CH.02  00:00:00', w - Math.round(w * 0.03), dotY);

  const bY = h - Math.round(barH * 0.5);
  ctx.textAlign = 'left'; ctx.fillStyle = '#FFFF80';
  ctx.fillText('SP  T-120', Math.round(w * 0.04), bY);
  ctx.textAlign = 'right';
  ctx.fillText('0001', w - Math.round(w * 0.04), bY);
}

// ── Texture overlay (grain / scanner / crumple / old film) ────────────────────
export function applyTextureOverlay(ctx: CanvasRenderingContext2D, sc: HTMLCanvasElement, w: number, h: number, p: EffectParams) {
  ctx.drawImage(sc, 0, 0, w, h);

  const preset  = p.texturePreset  ?? 0;
  const opacity = (p.textureOpacity ?? 35) / 100;

  const texC = document.createElement('canvas'); texC.width = w; texC.height = h;
  const tc = texC.getContext('2d', { willReadFrequently: true })!;

  if (preset === 0) {
    const imgData = tc.createImageData(w, h); const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = Math.random() * 255;
      d[i] = d[i+1] = d[i+2] = n; d[i+3] = Math.floor(Math.random() * 140);
    }
    tc.putImageData(imgData, 0, 0);
  } else if (preset === 1) {
    for (let y = 0; y < h; y += 2) {
      tc.fillStyle = y % 4 === 0 ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.06)';
      tc.fillRect(0, y, w, 1);
    }
  } else if (preset === 2) {
    for (let i = 0; i < 800; i++) {
      const x = Math.random() * w, y = Math.random() * h;
      const len = 8 + Math.random() * 50;
      const angle = Math.random() * Math.PI;
      const a = 0.03 + Math.random() * 0.09;
      tc.strokeStyle = Math.random() > 0.5 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a})`;
      tc.lineWidth = 0.4 + Math.random() * 1.8;
      tc.beginPath(); tc.moveTo(x, y);
      tc.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len); tc.stroke();
    }
  } else {
    const imgData = tc.createImageData(w, h); const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = Math.random() * 200;
      d[i] = d[i+1] = d[i+2] = n; d[i+3] = Math.floor(Math.random() * 90);
    }
    tc.putImageData(imgData, 0, 0);
    for (let i = 0; i < 120; i++) {
      tc.fillStyle = `rgba(255,255,255,${0.3 + Math.random() * 0.5})`;
      tc.beginPath(); tc.arc(Math.random() * w, Math.random() * h, 0.5 + Math.random() * 2, 0, Math.PI * 2); tc.fill();
    }
  }

  ctx.globalAlpha = opacity;
  ctx.globalCompositeOperation = 'overlay';
  ctx.drawImage(texC, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
}
