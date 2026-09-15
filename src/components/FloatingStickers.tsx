import { useEffect, useRef } from 'react';
import '../styles/components/FloatingStickers.css';
import { STICKERS } from '../lib/stickers';

/**
 * The ambient floating layer from the pre-rebuild app, with one change: these
 * are the REAL die-cut sticker scans rather than vector redraws (see the
 * "Real assets, not vectors" rule in the README).
 *
 * Each sticker drifts, bounces off the page edges, shoves its neighbours and
 * scatters away from the cursor. Decorative and click-through — it never eats
 * a pointer event meant for a photo.
 */
const COUNT = 14;
const REPEL_RADIUS = 170;
const REPEL_STRENGTH = 3.0;
const CONTACT_STRENGTH = 1.6;
const DAMPING = 0.975;
const MAX_SPEED = 4.5;
const DRIFT = 0.016;

interface Floater {
  el: HTMLImageElement;
  x: number; y: number;
  vx: number; vy: number;
  size: number;
  spin: number;
  angle: number;
}

export default function FloatingStickers() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const bounds = () => host.getBoundingClientRect();
    const rect0 = bounds();
    const floaters: Floater[] = [];

    for (let i = 0; i < COUNT; i++) {
      const sticker = STICKERS[i % STICKERS.length];
      const size = 46 + ((i * 37) % 46);
      const el = document.createElement('img');
      el.src = sticker.src;
      el.alt = '';
      el.className = 'floating-sticker';
      el.style.width = `${size}px`;
      host.appendChild(el);
      floaters.push({
        el,
        x: 40 + Math.random() * Math.max(80, rect0.width - 120),
        y: 40 + Math.random() * Math.max(80, rect0.height - 120),
        vx: (Math.random() - 0.5) * 1.1,
        vy: (Math.random() - 0.5) * 1.1,
        size,
        spin: (Math.random() - 0.5) * 0.25,
        angle: Math.random() * 40 - 20,
      });
    }

    const pointer = { x: -9999, y: -9999 };
    const onMove = (e: PointerEvent) => {
      const r = bounds();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
    };
    const onLeave = () => { pointer.x = -9999; pointer.y = -9999; };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerleave', onLeave);

    let raf = 0;
    const tick = () => {
      const r = bounds();
      const w = r.width || 1;
      const h = r.height || 1;

      for (let i = 0; i < floaters.length; i++) {
        const a = floaters[i];

        // cursor shove
        const dx = a.x - pointer.x;
        const dy = a.y - pointer.y;
        const dist = Math.hypot(dx, dy);
        if (dist < REPEL_RADIUS && dist > 0.001) {
          const push = (1 - dist / REPEL_RADIUS) * REPEL_STRENGTH;
          a.vx += (dx / dist) * push;
          a.vy += (dy / dist) * push;
        }

        // keep each other at arm's length
        for (let j = i + 1; j < floaters.length; j++) {
          const b = floaters[j];
          const bx = a.x - b.x;
          const by = a.y - b.y;
          const bd = Math.hypot(bx, by);
          const min = (a.size + b.size) * 0.5;
          if (bd < min && bd > 0.001) {
            const push = (1 - bd / min) * CONTACT_STRENGTH;
            const ux = (bx / bd) * push;
            const uy = (by / bd) * push;
            a.vx += ux; a.vy += uy;
            b.vx -= ux; b.vy -= uy;
          }
        }

        a.vx += (Math.random() - 0.5) * DRIFT;
        a.vy += (Math.random() - 0.5) * DRIFT;
        a.vx *= DAMPING;
        a.vy *= DAMPING;

        const speed = Math.hypot(a.vx, a.vy);
        if (speed > MAX_SPEED) {
          a.vx = (a.vx / speed) * MAX_SPEED;
          a.vy = (a.vy / speed) * MAX_SPEED;
        }

        a.x += a.vx;
        a.y += a.vy;
        a.angle += a.spin * speed;

        const half = a.size / 2;
        if (a.x < half) { a.x = half; a.vx = Math.abs(a.vx) * 0.7; }
        if (a.x > w - half) { a.x = w - half; a.vx = -Math.abs(a.vx) * 0.7; }
        if (a.y < half) { a.y = half; a.vy = Math.abs(a.vy) * 0.7; }
        if (a.y > h - half) { a.y = h - half; a.vy = -Math.abs(a.vy) * 0.7; }

        a.el.style.transform = `translate3d(${a.x - half}px, ${a.y - half}px, 0) rotate(${a.angle}deg)`;
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerleave', onLeave);
      floaters.forEach((f) => f.el.remove());
    };
  }, []);

  return <div ref={hostRef} className="floating-layer" aria-hidden />;
}
