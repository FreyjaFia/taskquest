import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Instance, Store, Task } from '../store';
import { TaskCard } from '../task-card';
import { TaskForm } from '../modals/task-form';
import { RequestModal } from '../modals/request-modal';
import { BonusModal } from '../modals/small-modals';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, TaskCard, TaskForm, RequestModal, BonusModal],
  template: `
    <div class="page">
      @if (s.isParent()) {
        <header class="page-head">
          <div>
            <h1>{{ greeting() }}, {{ s.me().name }}! 👋</h1>
            <p>{{ allToday().length }} missions today across the family. {{ doneToday() }} finished so far.</p>
          </div>
          <div class="row wrap">
            <button class="btn" (click)="bonus.set(true)">🎁 Give bonus</button>
            <button class="btn primary" (click)="form.set(true)">➕ New task</button>
          </div>
        </header>

        @if (s.pendingCount()) {
          <a routerLink="/requests" class="alert">
            <span class="alert-ico" aria-hidden="true">📬</span>
            <span><strong>{{ s.pendingCount() }} thing{{ s.pendingCount() === 1 ? '' : 's' }} waiting for you.</strong> Finished chores, change requests and wishes.</span>
            <span class="btn sm primary">Review</span>
          </a>
        }

        @if (!s.kids().length) {
          <div class="card empty"><div class="big">🧒</div><h2>No kids yet</h2><p class="muted">Add your children to start handing out missions.</p><a routerLink="/family" class="btn primary">Add a child</a></div>
        }

        <section class="grid kids" aria-label="Kids today">
          @for (k of s.kids(); track k.id) {
            @let list = s.instancesOn(s.today, k.id);
            @let done = count(list, 'done');
            <article class="card kid">
              <div class="row">
                <span class="avatar" [style.--c]="k.color" style="--s: 56px">{{ k.avatar }}</span>
                <div>
                  <h3>{{ k.name }}</h3>
                  <p class="muted">Level {{ s.level(k.id).level }}</p>
                </div>
                <span class="spacer"></span>
                <span class="chip pts">⭐ {{ s.balance(k.id) }}</span>
              </div>
              <div class="bar" role="progressbar" [attr.aria-valuenow]="done" aria-valuemin="0" [attr.aria-valuemax]="list.length" [attr.aria-label]="k.name + ' progress today'">
                <span [style.width.%]="pct(done, list.length)" [style.background]="k.color"></span>
              </div>
              <p class="muted">{{ list.length ? done + ' of ' + list.length + ' done today' : 'No missions today' }}</p>
            </article>
          }
        </section>

        <section class="grid cols">
          <div class="grid">
            <div class="row"><h2>Today's missions</h2><span class="spacer"></span><a routerLink="/tasks" class="btn ghost sm">See all</a></div>
            @for (i of allToday(); track i.task.id + i.assigneeId) {
              <app-task-card [inst]="i" (edit)="editTask.set(i.task)" />
            } @empty {
              <div class="card empty"><div class="big">🌴</div><h3>Nothing scheduled today</h3><p class="muted">Enjoy the day off, or add a new task.</p></div>
            }
          </div>
          <aside class="card flat top3">
            <h2>This week's stars</h2>
            @for (r of ranked(); track r.m.id; let n = $index) {
              <div class="row lb">
                <span class="medal">{{ ['🥇', '🥈', '🥉'][n] }}</span>
                <span class="avatar" [style.--c]="r.m.color" style="--s: 40px">{{ r.m.avatar }}</span>
                <strong>{{ r.m.name }}</strong><span class="spacer"></span><span class="chip pts">⭐ {{ r.pts }}</span>
              </div>
            } @empty { <p class="muted">Stars will show up once kids earn points.</p> }
            <a routerLink="/leaderboard" class="btn ghost sm">Full leaderboard</a>
          </aside>
        </section>
      } @else {
        <header class="hero card">
          <div class="hero-text">
            <h1>Hey {{ s.me().name }}! {{ s.me().avatar }}</h1>
            <p>{{ mine().length === 0 ? 'No missions today. Enjoy!' : myDone() === mine().length ? 'All missions complete. You are a legend!' : 'You have ' + (mine().length - myDone()) + ' mission' + (mine().length - myDone() === 1 ? '' : 's') + ' left today.' }}</p>
            <div class="row wrap stats">
              <div class="stat"><span class="big-num">⭐ {{ s.balance(s.me().id) }}</span><span>points to spend</span></div>
              <div class="stat"><span class="big-num">Lv {{ lvl().level }}</span><span>{{ 100 - lvl().into }} points to next level</span></div>
            </div>
            <div class="bar tall" role="progressbar" [attr.aria-valuenow]="lvl().into" aria-valuemin="0" aria-valuemax="100" aria-label="Level progress">
              <span [style.width.%]="lvl().into"></span>
            </div>
          </div>
          <div class="ring" [style.--p]="pct(myDone(), mine().length)" role="img" [attr.aria-label]="myDone() + ' of ' + mine().length + ' missions done'">
            <div class="ring-in"><strong>{{ myDone() }}/{{ mine().length }}</strong><span>done</span></div>
          </div>
        </header>

        <section class="grid">
          <h2>Today's missions</h2>
          @for (i of mine(); track i.task.id) {
            <app-task-card [inst]="i" [showWho]="false" (ask)="request.set($event)" />
          } @empty {
            <div class="card empty"><div class="big">🏝️</div><h3>Free day!</h3><p class="muted">No missions for today. Check Rewards to see what you can win.</p><a routerLink="/rewards" class="btn primary">Visit rewards</a></div>
          }
        </section>

        @if (next(); as r) {
          <a routerLink="/rewards" class="alert">
            <span class="alert-ico" aria-hidden="true">{{ r.emoji }}</span>
            <span><strong>Next prize: {{ r.title }}</strong><br />{{ r.cost - s.balance(s.me().id) > 0 ? (r.cost - s.balance(s.me().id)) + ' more points to go!' : 'You have enough points. Ask for it!' }}</span>
            <span class="btn sm primary">See</span>
          </a>
        }
      }
    </div>

    @if (form()) { <app-task-form (closed)="form.set(false)" /> }
    @if (editTask(); as t) { <app-task-form [task]="t" (closed)="editTask.set(null)" /> }
    @if (request(); as r) { <app-request-modal [inst]="r" (closed)="request.set(null)" /> }
    @if (bonus()) { <app-bonus-modal (closed)="bonus.set(false)" /> }
  `,
  styles: `
    .alert { display: flex; align-items: center; gap: 14px; padding: 14px 18px; border-radius: var(--r); background: var(--warn-soft); border: var(--bw) solid var(--edge); color: var(--ink); text-decoration: none; box-shadow: 0 4px 0 var(--hard); }
    .alert > span:nth-child(2) { flex: 1; }
    .alert-ico { font-size: 2rem; }
    .kids { grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr)); }
    .kid { display: grid; gap: 12px; }
    .bar { height: 12px; border-radius: var(--pill); background: var(--surface-2); overflow: hidden; border: var(--bw) solid var(--line); }
    .bar.tall { height: 18px; margin-top: 6px; }
    .bar span { display: block; height: 100%; border-radius: var(--pill); background: var(--accent); transition: width .6s cubic-bezier(.16, 1, .3, 1); }
    .cols { grid-template-columns: minmax(0, 1fr) 320px; align-items: start; gap: 24px; }
    .top3 { display: grid; gap: 14px; position: sticky; top: 90px; }
    .lb { padding: 6px 0; } .medal { width: 30px; font-size: 1.4rem; text-align: center; font-weight: 800; }
    .hero { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 28px; padding: 28px; background: var(--accent-soft); border-color: var(--sel); box-shadow: 0 6px 0 var(--hard); }
    .hero-text { display: grid; gap: 14px; }
    .hero-text p { font-size: 1.1rem; }
    .stats { gap: 28px; margin-top: 4px; }
    .stat { display: grid; } .stat span:last-child { color: var(--muted); font-weight: 700; font-size: .9rem; }
    .big-num { font-family: var(--font-display); font-size: 2rem; font-weight: 600; }
    .ring { --p: 0; width: 168px; height: 168px; border-radius: 50%; display: grid; place-items: center; background: conic-gradient(var(--good) calc(var(--p) * 1%), var(--surface) 0); border: 3px solid var(--edge); }
    .ring-in { width: 124px; height: 124px; border-radius: 50%; background: var(--surface); display: grid; place-content: center; text-align: center; }
    .ring-in strong { font-family: var(--font-display); font-size: 2rem; line-height: 1; } .ring-in span { color: var(--muted); font-weight: 700; }
    @media (max-width: 900px) { .cols { grid-template-columns: 1fr; } .top3 { position: static; } }
    @media (max-width: 640px) { .hero { grid-template-columns: 1fr; padding: 20px; } .ring { width: 132px; height: 132px; justify-self: center; order: -1; } .ring-in { width: 96px; height: 96px; } }
  `,
})
export class Dashboard {
  readonly form = signal(false);
  readonly bonus = signal(false);
  readonly editTask = signal<Task | null>(null);
  readonly request = signal<Instance | null>(null);

  readonly allToday = computed(() => this.s.instancesOn(this.s.today));
  readonly doneToday = computed(() => this.count(this.allToday(), 'done'));
  readonly mine = computed(() => this.s.instancesOn(this.s.today, this.s.me().id));
  readonly myDone = computed(() => this.count(this.mine(), 'done'));
  readonly lvl = computed(() => this.s.level(this.s.me().id));
  readonly ranked = computed(() =>
    this.s.kids().map(m => ({ m, pts: this.s.earned(m.id, 'week') })).sort((a, b) => b.pts - a.pts).slice(0, 3));
  readonly next = computed(() => {
    const bal = this.s.balance(this.s.me().id);
    const sorted = [...this.s.fam().rewards].sort((a, b) => a.cost - b.cost);
    return sorted.find(r => r.cost > bal) ?? sorted[sorted.length - 1] ?? null;
  });

  constructor(readonly s: Store) {}

  greeting() { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; }
  count(list: Instance[], st: string) { return list.filter(i => i.status === st).length; }
  pct(a: number, b: number) { return b ? Math.round((a / b) * 100) : 0; }
}
