import { Component, computed, input, output } from '@angular/core';
import { Instance, Store } from './store';

@Component({
  selector: 'app-task-card',
  template: `
    @let i = inst();
    <article class="tc" [class.done]="i.status === 'done'" [class.pend]="i.status === 'pending'">
      <div class="tile" [class.tick]="i.status === 'done'" aria-hidden="true">{{ i.status === 'done' ? '✅' : i.task.emoji }}</div>
      <div class="body">
        <div class="row wrap head">
          <h3>{{ i.task.title }}</h3>
          <span class="chip pts">⭐ {{ i.task.points }}</span>
          @switch (i.status) {
            @case ('done') { <span class="chip good">Done</span> }
            @case ('pending') { <span class="chip warn">Waiting for a parent</span> }
            @case ('redo') { <span class="chip bad">Try again</span> }
            @case ('missed') { <span class="chip">Missed</span> }
          }
          @if (i.swapped) { <span class="chip info">Swapped today</span> }
          @if (i.openRequest) { <span class="chip info">Request sent</span> }
        </div>
        <p class="meta">
          ⏰ {{ fmt(i.task.time) }}
          @if (showWho() && who(); as w) { <span class="who"><span aria-hidden="true">{{ w.avatar }}</span> {{ w.name }}</span> }
          <span>{{ s.repeatLabel(i.task) }}</span>
        </p>
        @if (i.task.description) { <p class="desc">{{ i.task.description }}</p> }

        <div class="row wrap acts">
          @if (s.isParent()) {
            @if (i.status === 'pending' && i.completion) {
              <button class="btn good sm" (click)="s.resolveCompletion(i.completion.id, true)">Approve +{{ i.task.points }}</button>
              <button class="btn bad sm" (click)="s.resolveCompletion(i.completion.id, false)">Send back</button>
            } @else if (i.status === 'todo' || i.status === 'redo' || i.status === 'missed') {
              <button class="btn sm" (click)="s.submitDone(i.task.id, i.date)">Mark done</button>
            }
            <span class="spacer"></span>
            <button class="icon-btn" (click)="edit.emit(i)" aria-label="Edit task">✏️</button>
            <button class="icon-btn" (click)="remove()" aria-label="Delete task">🗑️</button>
          } @else if (mine()) {
            @if (i.status === 'todo' || i.status === 'redo') {
              @if (i.date === s.today) {
                <button class="btn primary" (click)="s.submitDone(i.task.id, i.date)">I did it! 🎉</button>
              }
              @if (!i.openRequest) { <button class="btn ghost sm" (click)="ask.emit(i)">Ask to change</button> }
            } @else if (i.status === 'pending') {
              <button class="btn ghost sm" (click)="s.undoCompletion(i.task.id, i.date)">Oops, undo</button>
            } @else if (i.status === 'done') {
              <span class="chip good">+{{ i.task.points }} points earned!</span>
            }
          }
        </div>
      </div>
    </article>
  `,
  styles: `
    .tc { display: grid; grid-template-columns: 64px 1fr; gap: 16px; padding: 18px; background: var(--surface); border: var(--bw) solid var(--line); border-radius: var(--r); box-shadow: var(--shadow); transition: transform .15s ease; }
    .tc:hover { transform: translateY(-2px); }
    .tc.done { background: var(--good-soft); border-color: transparent; box-shadow: none; }
    .tc.pend { border-style: dashed; border-color: var(--warn); }
    .tile { width: 64px; height: 64px; border-radius: calc(20px * var(--rs)); display: grid; place-items: center; font-size: 2rem; background: var(--accent-soft); border: var(--bw) solid var(--line); }
    .tile.tick { background: transparent; border-color: transparent; }
    .body { min-width: 0; display: grid; gap: 6px; }
    .head h3 { margin-right: 4px; }
    .meta { display: flex; flex-wrap: wrap; gap: 4px 16px; color: var(--muted); font-weight: 700; font-size: .9rem; }
    .who { color: var(--ink); }
    .desc { color: var(--muted); }
    .acts { margin-top: 6px; }
    @media (max-width: 520px) { .tc { grid-template-columns: 48px 1fr; gap: 12px; padding: 14px; } .tile { width: 48px; height: 48px; font-size: 1.5rem; border-radius: calc(16px * var(--rs)); } }
  `,
})
export class TaskCard {
  readonly inst = input.required<Instance>();
  readonly showWho = input(true);
  readonly ask = output<Instance>();
  readonly edit = output<Instance>();

  readonly who = computed(() => this.s.member(this.inst().assigneeId));
  readonly mine = computed(() => this.inst().assigneeId === this.s.me().id);

  constructor(readonly s: Store) {}

  fmt(t: string) {
    const [h, m] = t.split(':').map(Number);
    return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
  }
  remove() {
    if (confirm(`Delete "${this.inst().task.title}" for everyone?`)) this.s.deleteTask(this.inst().task.id);
  }
}
