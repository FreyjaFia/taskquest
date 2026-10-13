import { Component, computed, signal } from '@angular/core';
import { Reward, Store } from '../store';
import { RewardModal } from '../modals/small-modals';

@Component({
  selector: 'app-rewards',
  imports: [RewardModal],
  template: `
    <div class="page">
      <header class="page-head">
        <div>
          <h1>Rewards 🎁</h1>
          <p>{{ s.isParent() ? 'Set the prizes and how many points they cost.' : 'Save up your points and pick a prize!' }}</p>
        </div>
        @if (s.isParent()) { <button class="btn primary" (click)="form.set(true)">➕ New reward</button> }
        @else { <div class="row wrap"><span class="chip pts wallet">⭐ {{ bal() }} points</span><button class="btn" (click)="idea.set(true)">💡 Suggest a reward</button></div> }
      </header>

      <section class="grid shelf">
        @for (r of rewards(); track r.id) {
          <article class="card prize">
            <div class="emoji" aria-hidden="true">{{ r.emoji }}</div>
            <h3>{{ r.title }}</h3>
            <span class="chip pts">⭐ {{ r.cost }}</span>

            @if (s.isParent()) {
              <div class="row">
                <button class="btn ghost sm" (click)="edit.set(r)">Edit</button>
                <button class="btn ghost sm" (click)="remove(r)">Delete</button>
              </div>
            } @else {
              <div class="bar" role="progressbar" [attr.aria-valuenow]="min(bal(), r.cost)" aria-valuemin="0" [attr.aria-valuemax]="r.cost" [attr.aria-label]="'Progress toward ' + r.title">
                <span [style.width.%]="pct(r)"></span>
              </div>
              @if (s.hasPendingRedeem(s.me().id, r.id)) {
                <button class="btn block" disabled>Waiting for a parent</button>
              } @else if (bal() >= r.cost) {
                <button class="btn primary block" (click)="s.redeem(r.id)">I want this! 🙌</button>
              } @else {
                <p class="muted need">{{ r.cost - bal() }} more points to go</p>
              }
            }
          </article>
        } @empty {
          <div class="card empty"><div class="big">🎈</div><h3>No rewards yet</h3><p class="muted">Add a prize to keep everyone motivated.</p></div>
        }
      </section>

      <section class="grid">
        <h2>Prize history</h2>
        @for (h of history(); track h.id) {
          <div class="card flat row hist">
            <span class="avatar" [style.--c]="s.member(h.childId)?.color" style="--s: 40px">{{ s.member(h.childId)?.avatar }}</span>
            <div><strong>{{ s.member(h.childId)?.name }}</strong> got <strong>{{ h.reason }}</strong><p class="muted">{{ h.date }}</p></div>
            <span class="spacer"></span><span class="chip">{{ h.points }} pts</span>
          </div>
        } @empty { <p class="muted">Nobody has claimed a prize yet. Be the first!</p> }
      </section>
    </div>

    @if (form()) { <app-reward-modal (closed)="form.set(false)" /> }
    @if (idea()) { <app-reward-modal [suggest]="true" (closed)="idea.set(false)" /> }
    @if (edit(); as r) { <app-reward-modal [reward]="r" (closed)="edit.set(null)" /> }
  `,
  styles: `
    .wallet { font-size: 1.15rem; padding: 10px 20px; }
    .shelf { grid-template-columns: repeat(auto-fill, minmax(min(100%, 230px), 1fr)); }
    .prize { display: grid; gap: 12px; justify-items: center; text-align: center; align-content: start; transition: transform .15s ease; }
    .prize:hover { transform: translateY(-3px) rotate(-.6deg); }
    .emoji { width: 96px; height: 96px; border-radius: calc(28px * var(--rs)); display: grid; place-items: center; font-size: 3.2rem; background: var(--accent-soft); border: var(--bw) solid var(--line); }
    .bar { width: 100%; height: 12px; border-radius: var(--pill); background: var(--surface-2); border: var(--bw) solid var(--line); overflow: hidden; }
    .bar span { display: block; height: 100%; background: var(--accent); border-radius: var(--pill); transition: width .6s cubic-bezier(.16, 1, .3, 1); }
    .need { font-weight: 700; font-size: .9rem; }
    .hist { padding: 12px 16px; }
    .hist .chip { flex: none; }
    .hist > div { min-width: 0; }
  `,
})
export class Rewards {
  readonly form = signal(false);
  readonly idea = signal(false);
  readonly edit = signal<Reward | null>(null);
  readonly rewards = computed(() => [...this.s.fam().rewards].sort((a, b) => a.cost - b.cost));
  readonly history = computed(() => this.s.fam().ledger.filter(l => l.kind === 'reward').sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6));

  constructor(readonly s: Store) {}

  bal() { return this.s.isParent() ? 0 : this.s.balance(this.s.me().id); }
  min(a: number, b: number) { return Math.min(a, b); }
  pct(r: Reward) { return Math.min(100, Math.round((this.bal() / r.cost) * 100)); }
  remove(r: Reward) { if (confirm(`Delete "${r.title}"?`)) this.s.deleteReward(r.id); }
}
