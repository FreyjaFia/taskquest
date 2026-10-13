import { Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import { STYLES, StyleId, Theme } from './theme';

@Component({
  selector: 'app-style-picker',
  template: `
    <button class="trigger" (click)="open.set(!open())" [attr.aria-expanded]="open()" aria-haspopup="menu">
      <span aria-hidden="true">🎨</span><span class="lbl">Style</span><span aria-hidden="true">▾</span>
    </button>
    @if (open()) {
      <div class="menu" role="menu" aria-label="Choose a style">
        <p class="title">Pick a look</p>
        @for (s of styles; track s.id) {
          <button role="menuitemradio" class="opt" [class.cur]="t.style() === s.id" [attr.aria-checked]="t.style() === s.id" (click)="pick(s.id)">
            <span class="sw" aria-hidden="true">
              @for (c of s.swatch; track c) { <i [style.background]="c"></i> }
            </span>
            <span class="txt"><strong>{{ s.name }}</strong><small>{{ s.blurb }}</small></span>
            @if (t.style() === s.id) { <span aria-hidden="true">✓</span> }
          </button>
        }
      </div>
    }
  `,
  styles: `
    :host { position: relative; display: inline-block; }
    .trigger { display: inline-flex; align-items: center; gap: 8px; min-height: 44px; padding: 0 14px; border-radius: var(--pill); border: var(--bw) solid var(--line); background: var(--surface); font-weight: 800; }
    .trigger:hover { background: var(--surface-2); }
    .menu { max-height: calc(100dvh - 80px); overflow-y: auto; position: absolute; top: calc(100% + 8px); right: 0; z-index: 70; width: 290px; max-width: calc(100vw - 32px); padding: 10px; display: grid; gap: 4px; background: var(--surface); border: var(--bw) solid var(--edge); border-radius: calc(22px * var(--rs)); box-shadow: 0 6px 0 var(--hard), var(--shadow); animation: pop .22s cubic-bezier(.16, 1, .3, 1) both; }
    .title { font-family: var(--font-display); padding: 6px 10px 2px; }
    .opt { display: flex; align-items: center; gap: 12px; min-height: 58px; padding: 6px 10px; text-align: left; border: var(--bw) solid transparent; border-radius: calc(16px * var(--rs)); background: transparent; }
    .opt:hover { background: var(--surface-2); }
    .opt.cur { border-color: var(--sel); background: var(--accent-soft); }
    .txt { display: grid; flex: 1; } .txt small { color: var(--muted); font-weight: 600; }
    .sw { display: flex; } .sw i { width: 18px; height: 34px; border: 1px solid rgba(128, 128, 128, .35); }
    .sw i:first-child { border-radius: 10px 0 0 10px; } .sw i:last-child { border-radius: 0 10px 10px 0; }
    @media (max-width: 560px) { .lbl { display: none; } .trigger { padding: 0 12px; } .menu { position: fixed; left: 12px; right: 12px; top: 64px; width: auto; max-width: none; } }
  `,
})
export class StylePicker {
  readonly t = inject(Theme);
  readonly styles = STYLES;
  readonly open = signal(false);
  private host = inject(ElementRef<HTMLElement>);

  pick(id: StyleId) { this.t.setStyle(id); this.open.set(false); }

  @HostListener('document:click', ['$event'])
  away(e: Event) { if (this.open() && !this.host.nativeElement.contains(e.target)) this.open.set(false); }
  @HostListener('document:keydown.escape')
  esc() { this.open.set(false); }
}
