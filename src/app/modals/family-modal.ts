import { Component, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '../store';

@Component({
  selector: 'app-family-modal',
  imports: [FormsModule],
  template: `
    <div class="scrim" (click)="closed.emit()" (keydown.escape)="closed.emit()" tabindex="-1">
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="fm-title" (click)="$event.stopPropagation()">
        <div class="modal-head">
          <h2 id="fm-title">Your family space</h2>
          <button class="icon-btn" (click)="closed.emit()" aria-label="Close">✕</button>
        </div>
        <div class="tabs" role="tablist">
          <button class="tab" role="tab" [attr.aria-selected]="mode() === 'create'" (click)="mode.set('create')">Create new</button>
          <button class="tab" role="tab" [attr.aria-selected]="mode() === 'join'" (click)="mode.set('join')">Join with code</button>
        </div>
        @if (mode() === 'create') {
          <div class="field">
            <label for="fname">Family name</label>
            <input id="fname" class="input" [(ngModel)]="name" placeholder="The Okafor Crew" maxlength="30" />
          </div>
          <div class="field">
            <span class="label">Pick a badge</span>
            <div class="pick">
              @for (e of emojis; track e) {
                <button type="button" [attr.aria-pressed]="emoji === e" (click)="emoji = e">{{ e }}</button>
              }
            </div>
          </div>
          <div class="modal-foot">
            <button class="btn ghost" (click)="closed.emit()">Cancel</button>
            <button class="btn primary" [disabled]="!name.trim()" (click)="create()">Create family</button>
          </div>
        } @else {
          <div class="field">
            <label for="code">Invite code</label>
            <input id="code" class="input" [(ngModel)]="code" placeholder="RIV-4829" />
            @if (bad()) { <span class="error">Hmm, we could not find that code. Check with a parent.</span> }
            @else { <span class="hint">Ask a parent for the code in their Family page. Try RIV-4829.</span> }
          </div>
          <div class="modal-foot">
            <button class="btn ghost" (click)="closed.emit()">Cancel</button>
            <button class="btn primary" [disabled]="!code.trim()" (click)="join()">Join family</button>
          </div>
        }
      </div>
    </div>
  `,
})
export class FamilyModal {
  readonly closed = output<void>();
  readonly mode = signal<'create' | 'join'>('create');
  readonly bad = signal(false);
  readonly emojis = ['🏡', '🚀', '🦖', '🌈', '🍀', '🐝', '⚽', '🎸'];
  name = '';
  emoji = '🏡';
  code = '';

  constructor(private s: Store, private router: Router) {}

  create() {
    this.s.createFamily(this.name.trim(), this.emoji);
    this.closed.emit();
    this.router.navigateByUrl('/family');
  }
  join() {
    if (this.s.joinFamily(this.code)) { this.closed.emit(); this.router.navigateByUrl('/'); }
    else this.bad.set(true);
  }
}
