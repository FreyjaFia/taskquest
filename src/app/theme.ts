import { Injectable, signal } from '@angular/core';

export type StyleId = 'playful' | 'calm' | 'arcade' | 'jungle' | 'bubblegum' | 'doodle' | 'space';
export const STYLES: { id: StyleId; name: string; blurb: string; swatch: string[] }[] = [
  { id: 'playful', name: 'Playful', blurb: 'Bouncy, bright and chunky', swatch: ['#ff8a3d', '#4c8df6', '#2bb3a3'] },
  { id: 'calm', name: 'Calm', blurb: 'Soft, tidy and flat', swatch: ['#5cc9b6', '#e3e8ef', '#1c2733'] },
  { id: 'arcade', name: 'Arcade', blurb: 'Dark pixel game vibes', swatch: ['#b8f23c', '#4a5c97', '#0b0f1a'] },
  { id: 'jungle', name: 'Jungle', blurb: 'Leafy greens, friendly and round', swatch: ['#86cf4a', '#e9f5e4', '#1b3322'] },
  { id: 'bubblegum', name: 'Bubblegum', blurb: 'Pastel pink, extra bouncy', swatch: ['#ff7eb6', '#fff0f7', '#8fd3ff'] },
  { id: 'doodle', name: 'Doodle', blurb: 'Sketchbook with wobbly lines', swatch: ['#ffd93d', '#f8fafc', '#232830'] },
  { id: 'space', name: 'Space', blurb: 'Night sky and shiny stars', swatch: ['#ffcf33', '#18214a', '#070b1f'] },
];

@Injectable({ providedIn: 'root' })
export class Theme {
  readonly style = signal<StyleId>('playful');
  readonly dark = signal(false);

  constructor() {
    let saved: string | null = null;
    let savedDark: string | null = null;
    try { saved = localStorage.getItem('tq-style'); savedDark = localStorage.getItem('tq-dark'); } catch { /* storage blocked */ }
    if (STYLES.some(s => s.id === saved)) this.style.set(saved as StyleId);
    this.dark.set(savedDark ? savedDark === '1' : window.matchMedia('(prefers-color-scheme: dark)').matches);
    this.apply();
  }

  /** Arcade and Space are always dark, so the light/dark toggle does nothing there. */
  get locked() { return this.style() === 'arcade' || this.style() === 'space'; }

  setStyle(id: StyleId) {
    this.style.set(id);
    this.apply();
    try { localStorage.setItem('tq-style', id); } catch { /* ignore */ }
  }
  toggleDark() {
    this.dark.update(v => !v);
    this.apply();
    try { localStorage.setItem('tq-dark', this.dark() ? '1' : '0'); } catch { /* ignore */ }
  }

  private apply() {
    const el = document.documentElement;
    el.dataset['style'] = this.style();
    el.dataset['theme'] = this.locked || this.dark() ? 'dark' : 'light';
  }
}
