import { Injectable, inject } from '@angular/core';
import { StyleId, Theme } from './theme';

type Shape = 'rect' | 'circle' | 'star' | 'pixel' | 'emoji' | 'leaf';
interface Particle {
  x: number; y: number; vx: number; vy: number; g: number; rot: number; vr: number;
  size: number; color: string; shape: Shape; life: number; max: number; glyph?: string;
}
export type BurstKind = 'small' | 'big' | 'stars';

const LOOK: Record<StyleId, { colors: string[]; shapes: Shape[]; gravity: number; speed: number; count: [number, number]; spin: boolean }> = {
  playful: { colors: ['#ff8a3d', '#2bb3a3', '#4c8df6', '#f2557a', '#8bc34a', '#f2b01e'], shapes: ['rect', 'circle', 'star'], gravity: .32, speed: 1, count: [26, 90], spin: true },
  calm: { colors: ['#5cc9b6', '#a8dcff', '#cdeee7', '#ffd9a8', '#e3e8ef'], shapes: ['circle'], gravity: .12, speed: .65, count: [14, 40], spin: false },
  arcade: { colors: ['#b8f23c', '#f1f5ff', '#7f93d6', '#ffd166', '#ff7b86'], shapes: ['pixel'], gravity: .4, speed: 1.15, count: [22, 70], spin: false },
  jungle: { colors: ['#86cf4a', '#4fb06b', '#f2b01e', '#c98a4b', '#2f8f5b'], shapes: ['leaf', 'circle', 'leaf'], gravity: .2, speed: .85, count: [24, 80], spin: true },
  bubblegum: { colors: ['#ff7eb6', '#8fd3ff', '#ffe27a', '#ffffff', '#c9a7ff'], shapes: ['circle', 'circle', 'star'], gravity: .1, speed: 1, count: [30, 100], spin: false },
  doodle: { colors: ['#ffd93d', '#ff6b6b', '#4ecdc4', '#232830', '#6c9bff'], shapes: ['rect', 'star', 'circle'], gravity: .3, speed: 1, count: [24, 80], spin: true },
  space: { colors: ['#ffcf33', '#ffffff', '#7cc4ff', '#ffdc66'], shapes: ['star', 'circle', 'star'], gravity: .05, speed: .9, count: [22, 80], spin: true },
};

/** Lightweight celebration effects. Particles are drawn on one canvas, outside Angular's change detection. */
@Injectable({ providedIn: 'root' })
export class Fx {
  private theme = inject(Theme);
  private last = { x: window.innerWidth / 2, y: window.innerHeight / 3 };
  private canvas?: HTMLCanvasElement;
  private ctx?: CanvasRenderingContext2D | null;
  private parts: Particle[] = [];
  private raf = 0;
  private reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  constructor() {
    document.addEventListener('pointerdown', e => { this.last = { x: e.clientX, y: e.clientY }; }, true);
  }

  /** Fire a celebration from the last place the user tapped. */
  burst(kind: BurstKind = 'small', opts: { label?: string; emoji?: string } = {}) {
    if (opts.label) this.floatText(opts.label);
    if (this.reduced.matches) return;
    const look = LOOK[this.theme.style()];
    const n = kind === 'big' ? look.count[1] : look.count[0];
    const { x, y } = this.last;
    this.ensureCanvas();
    for (let i = 0; i < n; i++) {
      const a = kind === 'big' ? Math.random() * Math.PI * 2 : -Math.PI / 2 + (Math.random() - .5) * 2.2;
      const v = (3 + Math.random() * (kind === 'big' ? 9 : 6)) * look.speed;
      const useEmoji = (kind === 'stars' || opts.emoji) && i % 5 === 0;
      this.parts.push({
        x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - (kind === 'big' ? 3 : 1), g: look.gravity,
        rot: Math.random() * 6, vr: look.spin ? (Math.random() - .5) * .4 : 0,
        size: look.shapes[0] === 'pixel' ? 6 + Math.floor(Math.random() * 3) * 2 : 6 + Math.random() * 7,
        color: look.colors[i % look.colors.length],
        shape: useEmoji ? 'emoji' : look.shapes[i % look.shapes.length],
        glyph: opts.emoji ?? '⭐', life: 0, max: 70 + Math.random() * 50,
      });
    }
    if (!this.raf) this.raf = requestAnimationFrame(() => this.tick());
  }

  private floatText(text: string) {
    const el = document.createElement('div');
    el.className = 'fx-float';
    el.textContent = text;
    el.style.left = `${Math.min(Math.max(this.last.x, 60), window.innerWidth - 60)}px`;
    el.style.top = `${this.last.y}px`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1300);
  }

  private ensureCanvas() {
    if (this.canvas) return;
    const c = document.createElement('canvas');
    c.setAttribute('aria-hidden', 'true');
    c.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:120';
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = window.innerWidth * dpr;
    c.height = window.innerHeight * dpr;
    document.body.appendChild(c);
    this.canvas = c;
    this.ctx = c.getContext('2d');
    this.ctx?.scale(dpr, dpr);
  }

  private tick() {
    const ctx = this.ctx;
    const c = this.canvas;
    if (!ctx || !c) return;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    const stepped = this.theme.style() === 'arcade';
    this.parts = this.parts.filter(p => p.life < p.max && p.y < window.innerHeight + 40);
    for (const p of this.parts) {
      p.life++;
      p.vy += p.g;
      p.vx *= .985;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      ctx.globalAlpha = Math.min(1, (p.max - p.life) / 20);
      ctx.fillStyle = p.color;
      ctx.save();
      const px = stepped ? Math.round(p.x / 4) * 4 : p.x;
      const py = stepped ? Math.round(p.y / 4) * 4 : p.y;
      ctx.translate(px, py);
      ctx.rotate(p.rot);
      this.draw(ctx, p);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    if (this.parts.length) {
      this.raf = requestAnimationFrame(() => this.tick());
    } else {
      this.raf = 0;
      c.remove();
      this.canvas = undefined;
    }
  }

  private draw(ctx: CanvasRenderingContext2D, p: Particle) {
    const s = p.size;
    switch (p.shape) {
      case 'circle': ctx.beginPath(); ctx.arc(0, 0, s / 2, 0, Math.PI * 2); ctx.fill(); break;
      case 'pixel': ctx.fillRect(-s / 2, -s / 2, s, s); break;
      case 'leaf': ctx.beginPath(); ctx.ellipse(0, 0, s / 1.2, s / 2.6, 0, 0, Math.PI * 2); ctx.fill(); break;
      case 'rect': ctx.fillRect(-s / 2, -s / 4, s, s / 2); break;
      case 'emoji': ctx.font = `${s * 2.2}px system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(p.glyph ?? '⭐', 0, 0); break;
      case 'star': {
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
          const r = i % 2 ? s / 4 : s / 1.6;
          const a = (i * Math.PI) / 5;
          ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath();
        ctx.fill();
      }
    }
  }
}
