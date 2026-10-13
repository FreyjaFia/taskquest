import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Instance, Store } from '../store';

@Component({
  selector: 'app-request-modal',
  imports: [FormsModule],
  template: `
    <div class="scrim" (click)="closed.emit()" (keydown.escape)="closed.emit()" tabindex="-1">
      <form class="modal" role="dialog" aria-modal="true" aria-labelledby="rq-title" (click)="$event.stopPropagation()" (ngSubmit)="send()">
        <div class="modal-head">
          <h2 id="rq-title">{{ inst().task.emoji }} {{ inst().task.title }}</h2>
          <button type="button" class="icon-btn" (click)="closed.emit()" aria-label="Close">✕</button>
        </div>
        <p class="muted">Not going to work out? Ask a parent. They will say yes or no.</p>

        <div class="tabs" role="tablist">
          <button type="button" class="tab" role="tab" [attr.aria-selected]="kind === 'edit'" (click)="kind = 'edit'">⏰ Change the time</button>
          <button type="button" class="tab" role="tab" [attr.aria-selected]="kind === 'swap'" (click)="kind = 'swap'">🔄 Swap with someone</button>
        </div>

        @if (kind === 'edit') {
          <div class="field">
            <label for="nt">New time</label>
            <input id="nt" name="nt" type="time" class="input" [(ngModel)]="newTime" />
            <span class="hint">It is set for {{ inst().task.time }} right now.</span>
          </div>
        } @else {
          <div class="field">
            <span class="label">Who could do it today?</span>
            <div class="pick" role="radiogroup">
              @for (k of siblings(); track k.id) {
                <button type="button" class="text" role="radio" [attr.aria-checked]="toId === k.id" (click)="toId = k.id">{{ k.avatar }} {{ k.name }}</button>
              }
            </div>
            @if (!siblings().length) { <span class="error">There is nobody else to swap with yet.</span> }
          </div>
        }

        <div class="field">
          <label for="msg">Tell your parents why</label>
          <textarea id="msg" name="msg" class="input" [(ngModel)]="message" placeholder="I have swimming practice until 6!" maxlength="160"></textarea>
        </div>

        <div class="modal-foot">
          <button type="button" class="btn ghost" (click)="closed.emit()">Never mind</button>
          <button type="submit" class="btn primary" [disabled]="!ok()">Send request 💌</button>
        </div>
      </form>
    </div>
  `,
})
export class RequestModal {
  readonly inst = input.required<Instance>();
  readonly closed = output<void>();

  kind: 'edit' | 'swap' = 'edit';
  newTime = '';
  toId = '';
  message = '';

  constructor(readonly s: Store) {}

  ngOnInit() { this.newTime = this.inst().task.time; }
  siblings() { return this.s.kids().filter(k => k.id !== this.inst().assigneeId); }
  ok() {
    return !!this.message.trim() && (this.kind === 'edit' ? !!this.newTime && this.newTime !== this.inst().task.time : !!this.toId);
  }
  send() {
    if (!this.ok()) return;
    const i = this.inst();
    this.s.sendRequest({
      kind: this.kind, taskId: i.task.id, date: i.date, message: this.message.trim(),
      ...(this.kind === 'edit' ? { newTime: this.newTime } : { toId: this.toId }),
    });
    this.closed.emit();
  }
}
