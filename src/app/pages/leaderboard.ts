import { Component, computed, signal } from '@angular/core';
import { Period, Store } from '../store';

@Component({
  selector: 'app-leaderboard',
  template: `
    <div class="page">
      <header class="page-head">
        <div><h1>Leaderboard 🏆</h1><p>Points earned from finished tasks and bonuses. Spending prizes never lowers your rank.</p></div>
        <div class="tabs" role="tablist">
          @for (p of periods; track p.id) {
            <button class="tab" role="tab" [attr.aria-selected]="period() === p.id" (click)="period.set(p.id)">{{ p.label }}</button>
          }
        </div>
      </header>

      @if (rows().length) {
        <section class="podium" aria-label="Top three">
          @for (r of podium(); track r.m.id) {
            <div class="spot" [class]="'p' + r.rank" [class.me]="r.m.id === s.me().id">
              <span class="crown" aria-hidden="true">{{ ['👑', '🥈', '🥉'][r.rank - 1] }}</span>
              <span class="avatar" [style.--c]="r.m.color" [style.--s]="r.rank === 1 ? '96px' : '76px'">{{ r.m.avatar }}</span>
              <strong>{{ r.m.name }}</strong>
              <span class="chip pts">⭐ {{ r.pts }}</span>
              <div class="pod" aria-hidden="true">{{ r.rank }}</div>
            </div>
          }
        </section>

        @if (rest().length) {
          <section class="grid">
            @for (r of rest(); track r.m.id) {
              <div class="card flat row">
                <span class="rank">{{ r.rank }}</span>
                <span class="avatar" [style.--c]="r.m.color" style="--s: 44px">{{ r.m.avatar }}</span>
                <strong>{{ r.m.name }}</strong><span class="spacer"></span><span class="chip pts">⭐ {{ r.pts }}</span>
              </div>
            }
          </section>
        }

        @if (cheer(); as c) { <div class="card cheer">{{ c }}</div> }
      } @else {
        <div class="card empty"><div class="big">🏁</div><h3>The race has not started</h3><p class="muted">Add kids and finish tasks to climb the board.</p></div>
      }
    </div>
  `,
  styles: `
    .podium { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); align-items: end; gap: 12px; max-width: 640px; width: 100%; margin: 8px auto 0; }
    .spot { display: grid; justify-items: center; gap: 6px; text-align: center; }
    .spot .crown { font-size: 2rem; }
    .spot.p1 .crown { font-size: 2.6rem; animation: bob 2.6s ease-in-out infinite; }
    .spot.me strong::after { content: ' (you)'; color: var(--muted); font-weight: 700; }
    .pod { width: 100%; display: grid; place-items: start center; padding-top: 10px; border: var(--bw) solid var(--edge); border-bottom: 0; border-radius: calc(20px * var(--rs)) calc(20px * var(--rs)) 0 0; font-family: var(--font-display); font-size: 2rem; font-weight: 700; color: #17213d; }
    .p1 .pod { height: 150px; background: #ffd23f; } .p2 .pod { height: 110px; background: #cfd8e8; } .p3 .pod { height: 80px; background: #ffb184; }
    .p1 { order: 2; } .p2 { order: 1; } .p3 { order: 3; }
    .rank { width: 32px; height: 32px; border-radius: var(--av); display: grid; place-items: center; background: var(--surface-2); font-weight: 800; }
    .cheer { text-align: center; font-weight: 800; background: var(--accent-soft); border-color: var(--sel); }
    @media (max-width: 480px) { .pod { font-size: 1.4rem; } .spot strong { font-size: .9rem; } }
  `,
})
export class Leaderboard {
  readonly period = signal<Period>('week');
  readonly periods: { id: Period; label: string }[] = [
    { id: 'week', label: 'This week' }, { id: 'month', label: 'This month' }, { id: 'all', label: 'All time' },
  ];

  readonly rows = computed(() => {
    const sorted = this.s.kids().map(m => ({ m, pts: this.s.earned(m.id, this.period()) })).sort((a, b) => b.pts - a.pts);
    return sorted.map((r, i) => ({ ...r, rank: i + 1 }));
  });
  readonly podium = computed(() => this.rows().slice(0, 3));
  readonly rest = computed(() => this.rows().slice(3));
  readonly cheer = computed(() => {
    const me = this.rows().find(r => r.m.id === this.s.me().id);
    if (!me) return '';
    const above = this.rows()[me.rank - 2];
    return me.rank === 1 ? 'You are in the lead. Keep it up, champ!' : above ? `Only ${above.pts - me.pts} more points to pass ${above.m.name}!` : '';
  });

  constructor(readonly s: Store) {}
}
