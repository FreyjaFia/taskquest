import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DAY_LABELS, Repeat, Store, TASK_EMOJIS, Task } from '../store';

@Component({
  selector: 'app-task-form',
  imports: [FormsModule],
  template: `
    <div class="scrim" (click)="closed.emit()" (keydown.escape)="closed.emit()" tabindex="-1">
      <form class="modal" role="dialog" aria-modal="true" aria-labelledby="tf-title" (click)="$event.stopPropagation()" (ngSubmit)="save()">
        <div class="modal-head">
          <h2 id="tf-title">{{ task() ? 'Edit task' : 'New task' }}</h2>
          <button type="button" class="icon-btn" (click)="closed.emit()" aria-label="Close">✕</button>
        </div>

        <div class="field">
          <label for="tt">What needs doing?</label>
          <input id="tt" name="title" class="input" [(ngModel)]="title" placeholder="Feed the fish" maxlength="40" required />
        </div>
        <div class="field">
          <label for="td">Tips for the helper <span class="hint">(optional)</span></label>
          <textarea id="td" name="desc" class="input" [(ngModel)]="description" placeholder="Two pinches of food, no more!" maxlength="200"></textarea>
        </div>

        <div class="field">
          <span class="label">Pick an icon</span>
          <div class="pick">
            @for (e of emojis; track e) {
              <button type="button" [attr.aria-pressed]="emoji === e" (click)="emoji = e" [attr.aria-label]="'Icon ' + e">{{ e }}</button>
            }
          </div>
        </div>

        <div class="field">
          <span class="label">Who is it for?</span>
          <div class="pick" role="radiogroup">
            @for (k of s.kids(); track k.id) {
              <button type="button" class="text" role="radio" [attr.aria-checked]="assigneeId === k.id" (click)="assigneeId = k.id">
                {{ k.avatar }} {{ k.name }}
              </button>
            }
          </div>
          @if (!s.kids().length) { <span class="error">Add a child in the Family page first.</span> }
        </div>

        <div class="two">
          <div class="field">
            <label for="tdate">Starts on</label>
            <input id="tdate" name="date" type="date" class="input" [(ngModel)]="startDate" required />
          </div>
          <div class="field">
            <label for="ttime">Time</label>
            <input id="ttime" name="time" type="time" class="input" [(ngModel)]="time" required />
          </div>
        </div>

        <div class="field">
          <label for="trep">How often?</label>
          <select id="trep" name="repeat" class="input" [(ngModel)]="repeat">
            <option value="once">Just once</option>
            <option value="daily">Every day</option>
            <option value="weekdays">Weekdays (Mon to Fri)</option>
            <option value="weekends">Weekends</option>
            <option value="custom">Pick the days</option>
          </select>
          @if (repeat === 'custom') {
            <div class="pick" style="margin-top:6px">
              @for (d of dayLabels; track d; let i = $index) {
                <button type="button" class="text" [attr.aria-pressed]="days.includes(i)" (click)="toggleDay(i)">{{ d }}</button>
              }
            </div>
          }
        </div>

        <div class="field">
          <span class="label">Points reward</span>
          <div class="row">
            <button type="button" class="icon-btn" (click)="points = max(5, points - 5)" aria-label="Fewer points">−</button>
            <span class="chip pts" style="font-size:1.2rem;padding:8px 20px">⭐ {{ points }}</span>
            <button type="button" class="icon-btn" (click)="points = points + 5" aria-label="More points">+</button>
          </div>
        </div>

        <div class="modal-foot">
          <button type="button" class="btn ghost" (click)="closed.emit()">Cancel</button>
          <button type="submit" class="btn primary" [disabled]="!valid()">{{ task() ? 'Save changes' : 'Add task' }}</button>
        </div>
      </form>
    </div>
  `,
  styles: `.two { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; } @media (max-width: 480px) { .two { grid-template-columns: 1fr; } }`,
})
export class TaskForm {
  readonly task = input<Task | null>(null);
  readonly presetAssignee = input<string | null>(null);
  readonly presetDate = input<string | null>(null);
  readonly closed = output<void>();

  readonly emojis = TASK_EMOJIS;
  readonly dayLabels = DAY_LABELS;

  title = ''; description = ''; emoji = '🧹'; assigneeId = ''; startDate = '';
  time = '17:00'; repeat: Repeat = 'daily'; days: number[] = []; points = 10;

  constructor(readonly s: Store) {}

  ngOnInit() {
    const t = this.task();
    if (t) {
      Object.assign(this, { title: t.title, description: t.description, emoji: t.emoji, assigneeId: t.assigneeId, startDate: t.startDate, time: t.time, repeat: t.repeat, days: [...t.days], points: t.points });
    } else {
      this.assigneeId = this.presetAssignee() ?? this.s.kids()[0]?.id ?? '';
      this.startDate = this.presetDate() ?? this.s.today;
    }
  }

  max(a: number, b: number) { return Math.max(a, b); }
  toggleDay(i: number) { this.days = this.days.includes(i) ? this.days.filter(d => d !== i) : [...this.days, i]; }
  valid() { return !!this.title.trim() && !!this.assigneeId && !!this.startDate && !!this.time && (this.repeat !== 'custom' || this.days.length > 0); }

  save() {
    if (!this.valid()) return;
    this.s.saveTask({
      id: this.task()?.id, title: this.title.trim(), description: this.description.trim(), emoji: this.emoji,
      points: this.points, assigneeId: this.assigneeId, startDate: this.startDate, time: this.time, repeat: this.repeat, days: this.days,
    });
    this.closed.emit();
  }
}
