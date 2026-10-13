import { Component, computed, inject, signal } from '@angular/core';
import { DAY_LABELS, Instance, Store, Task, addDays, parse } from '../store';
import { TaskCard } from '../task-card';
import { TaskForm } from '../modals/task-form';
import { RequestModal } from '../modals/request-modal';

@Component({
  selector: 'app-tasks',
  imports: [TaskCard, TaskForm, RequestModal],
  template: `
    <div class="page">
      <header class="page-head">
        <div>
          <h1>{{ s.isParent() ? 'Tasks' : 'My missions' }}</h1>
          <p>{{ s.isParent() ? 'Plan the week and keep the family on track.' : 'Pick a day to see what is waiting for you.' }}</p>
        </div>
        @if (s.isParent()) { <button class="btn primary" (click)="form.set(true)">➕ New task</button> }
      </header>

      @if (s.isParent()) {
        <div class="row wrap">
          <div class="tabs" role="tablist">
            <button class="tab" role="tab" [attr.aria-selected]="view() === 'day'" (click)="view.set('day')">By day</button>
            <button class="tab" role="tab" [attr.aria-selected]="view() === 'all'" (click)="view.set('all')">All tasks</button>
          </div>
          <div class="pick filters" role="group" aria-label="Filter by child">
            <button class="text" [attr.aria-pressed]="!kid()" (click)="kid.set('')">Everyone</button>
            @for (k of s.kids(); track k.id) {
              <button class="text" [attr.aria-pressed]="kid() === k.id" (click)="kid.set(k.id)">{{ k.avatar }} {{ k.name }}</button>
            }
          </div>
        </div>
      }

      @if (view() === 'day') {
        <div class="week card flat">
          <button class="icon-btn" (click)="shift(-7)" aria-label="Previous week">‹</button>
          <div class="days" role="tablist" aria-label="Pick a day">
            @for (d of week(); track d.iso) {
              <button class="day" role="tab" [attr.aria-selected]="d.iso === date()" [class.today]="d.iso === s.today" (click)="date.set(d.iso)">
                <span class="dn">{{ d.name }}</span>
                <span class="dd">{{ d.num }}</span>
                @if (d.count) { <span class="dc" aria-label="{{ d.count }} tasks">{{ d.count }}</span> }
              </button>
            }
          </div>
          <button class="icon-btn" (click)="shift(7)" aria-label="Next week">›</button>
        </div>

        <h2>{{ dateLabel() }}</h2>
        <section class="grid">
          @for (i of list(); track i.task.id + i.assigneeId) {
            <app-task-card [inst]="i" [showWho]="s.isParent()" (ask)="request.set($event)" (edit)="editTask.set(i.task)" />
          } @empty {
            <div class="card empty">
              <div class="big">🌤️</div><h3>Nothing planned for this day</h3>
              <p class="muted">{{ s.isParent() ? 'Add a task to fill it up.' : 'Take a break, you earned it!' }}</p>
              @if (s.isParent()) { <button class="btn primary" (click)="form.set(true)">Add a task</button> }
            </div>
          }
        </section>
      } @else {
        <section class="grid all">
          @for (t of allTasks(); track t.id) {
            <article class="card tpl">
              <div class="row">
                <span class="tile" aria-hidden="true">{{ t.emoji }}</span>
                <div class="grow"><h3>{{ t.title }}</h3><p class="muted">{{ fmt(t.time) }} · {{ s.repeatLabel(t) }}</p></div>
                <span class="chip pts">⭐ {{ t.points }}</span>
              </div>
              <div class="row">
                @if (s.member(t.assigneeId); as m) {
                  <span class="avatar" [style.--c]="m.color" style="--s: 32px">{{ m.avatar }}</span><strong>{{ m.name }}</strong>
                }
                <span class="spacer"></span>
                <button class="icon-btn" (click)="editTask.set(t)" aria-label="Edit task">✏️</button>
                <button class="icon-btn" (click)="remove(t)" aria-label="Delete task">🗑️</button>
              </div>
            </article>
          } @empty {
            <div class="card empty"><div class="big">📝</div><h3>No tasks yet</h3><button class="btn primary" (click)="form.set(true)">Create the first one</button></div>
          }
        </section>
      }
    </div>

    @if (form()) { <app-task-form [presetDate]="date()" [presetAssignee]="kid() || null" (closed)="form.set(false)" /> }
    @if (editTask(); as t) { <app-task-form [task]="t" (closed)="editTask.set(null)" /> }
    @if (request(); as r) { <app-request-modal [inst]="r" (closed)="request.set(null)" /> }
  `,
  styles: `
    .filters { margin-left: auto; }
    .filters button { min-height: 44px; font-size: .95rem; }
    .week { display: flex; align-items: center; gap: 8px; padding: 10px; }
    .days { flex: 1; min-width: 0; display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 6px; }
    .day { min-width: 0; overflow: hidden; position: relative; display: grid; justify-items: center; gap: 0; padding: 8px 0; min-height: 68px; border-radius: calc(16px * var(--rs)); border: var(--bw) solid transparent; background: transparent; font-weight: 800; }
    .day:hover { background: var(--surface-2); }
    .day[aria-selected='true'] { background: var(--accent); color: #17213d; border-color: var(--sel); box-shadow: 0 3px 0 var(--hard); }
    .day.today:not([aria-selected='true']) { border-color: var(--info); }
    .dn { font-size: .75rem; color: var(--muted); text-transform: uppercase; letter-spacing: .04em; }
    .day[aria-selected='true'] .dn { color: #17213d; }
    .dd { font-family: var(--font-display); font-size: 1.4rem; }
    .dc { position: absolute; top: 4px; right: 6px; min-width: 18px; height: 18px; border-radius: calc(9px * var(--rs)); background: var(--ink); color: var(--bg); font-size: .68rem; display: grid; place-items: center; padding: 0 4px; }
    .all { grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr)); }
    .tpl { display: grid; gap: 14px; }
    .tile { width: 52px; height: 52px; border-radius: calc(16px * var(--rs)); display: grid; place-items: center; font-size: 1.6rem; background: var(--accent-soft); }
    .grow { flex: 1; min-width: 0; }
    @media (max-width: 360px) { .day { border-width: 1px; box-shadow: none !important; } .dn { font-size: .5rem; } .dd { font-size: .74rem; letter-spacing: -.04em; } .week .icon-btn { width: 26px; height: 26px; } }
    @media (max-width: 520px) { .week { padding: 6px; gap: 2px; } .week .icon-btn { width: 30px; height: 30px; flex: none; } .days { gap: 2px; } .day { padding: 6px 0; min-height: 60px; } .dn { font-size: .6rem; letter-spacing: 0; } .dd { font-size: 1.05rem; } .dc { right: 0; top: 0; min-width: 15px; height: 15px; font-size: .6rem; padding: 0 3px; } .filters { margin-left: 0; } }
  `,
})
export class Tasks {
  readonly s = inject(Store);
  readonly view = signal<'day' | 'all'>('day');
  readonly date = signal(this.s.today);
  readonly kid = signal('');
  readonly form = signal(false);
  readonly editTask = signal<Task | null>(null);
  readonly request = signal<Instance | null>(null);

  readonly week = computed(() => {
    const d = parse(this.date());
    const monday = addDays(this.date(), -((d.getDay() + 6) % 7));
    return Array.from({ length: 7 }, (_, n) => {
      const iso = addDays(monday, n);
      const who = this.s.isParent() ? this.kid() || undefined : this.s.me().id;
      return { iso, name: DAY_LABELS[parse(iso).getDay()], num: parse(iso).getDate(), count: this.s.instancesOn(iso, who).length };
    });
  });
  readonly list = computed(() => this.s.instancesOn(this.date(), this.s.isParent() ? this.kid() || undefined : this.s.me().id));
  readonly allTasks = computed(() => this.s.fam().tasks.filter(t => !this.kid() || t.assigneeId === this.kid()));

  shift(n: number) { this.date.set(addDays(this.date(), n)); }
  dateLabel() {
    if (this.date() === this.s.today) return 'Today';
    if (this.date() === addDays(this.s.today, 1)) return 'Tomorrow';
    return parse(this.date()).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  }
  fmt(t: string) {
    const [h, m] = t.split(':').map(Number);
    return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
  }
  remove(t: Task) { if (confirm(`Delete "${t.title}" for everyone?`)) this.s.deleteTask(t.id); }
}
