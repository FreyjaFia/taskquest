import { Component, computed, signal } from '@angular/core';
import { Store } from '../store';

@Component({
  selector: 'app-requests',
  template: `
    <div class="page">
      <header class="page-head">
        <div>
          <h1>{{ s.isParent() ? 'Approvals' : 'My requests' }}</h1>
          <p>{{ s.isParent() ? 'Check finished work and answer questions from the kids.' : 'See what your parents said about your tasks and wishes.' }}</p>
        </div>
      </header>

      @if (s.isParent()) {
        <section class="grid">
          <h2>✅ Finished tasks <span class="chip warn">{{ completions().length }}</span></h2>
          @for (c of completions(); track c.id) {
            @let t = s.task(c.taskId);
            @let m = s.member(c.byId);
            <article class="card item">
              <span class="tile" aria-hidden="true">{{ t?.emoji }}</span>
              <div class="grow">
                <h3>{{ t?.title }}</h3>
                <p class="muted">{{ m?.avatar }} {{ m?.name }} says it is done · {{ ago(c.at) }}</p>
              </div>
              <span class="chip pts">⭐ {{ t?.points }}</span>
              <div class="row">
                <button class="btn good sm" (click)="s.resolveCompletion(c.id, true)">Approve</button>
                <button class="btn bad sm" (click)="s.resolveCompletion(c.id, false)">Try again</button>
              </div>
            </article>
          } @empty { <p class="muted quiet">No finished tasks to check. 🎈</p> }
        </section>

        <section class="grid">
          <h2>💌 Change and swap requests <span class="chip warn">{{ reqs().length }}</span></h2>
          @for (r of reqs(); track r.id) {
            @let t = s.task(r.taskId);
            @let m = s.member(r.fromId);
            <article class="card item">
              <span class="tile" aria-hidden="true">{{ r.kind === 'swap' ? '🔄' : '⏰' }}</span>
              <div class="grow">
                <h3>{{ m?.name }} wants to {{ r.kind === 'swap' ? 'swap with ' + s.member(r.toId ?? '')?.name : 'move the time to ' + fmt(r.newTime ?? '') }}</h3>
                <p class="muted">{{ t?.emoji }} {{ t?.title }} · {{ r.date === s.today ? 'today' : r.date }}</p>
                <p class="quote">"{{ r.message }}"</p>
              </div>
              <div class="row">
                <button class="btn good sm" (click)="s.resolveRequest(r.id, true)">Say yes</button>
                <button class="btn bad sm" (click)="s.resolveRequest(r.id, false)">Say no</button>
              </div>
            </article>
          } @empty { <p class="muted quiet">No requests right now.</p> }
        </section>

        <section class="grid">
          <h2>💡 Reward ideas <span class="chip warn">{{ ideas().length }}</span></h2>
          @for (i of ideas(); track i.id) {
            @let m = s.member(i.byId);
            <article class="card item">
              <span class="tile" aria-hidden="true">{{ i.emoji }}</span>
              <div class="grow">
                <h3>{{ m?.name }} suggests: {{ i.title }}</h3>
                <p class="muted">{{ m?.avatar }} Wants it to cost</p>
                <div class="row">
                  <button class="icon-btn" (click)="bump(i.id, i.cost, -10)" aria-label="Cheaper">−</button>
                  <span class="chip pts">⭐ {{ cost(i.id, i.cost) }}</span>
                  <button class="icon-btn" (click)="bump(i.id, i.cost, 10)" aria-label="Pricier">+</button>
                </div>
              </div>
              <div class="row">
                <button class="btn good sm" (click)="s.resolveIdea(i.id, true, cost(i.id, i.cost))">Add it</button>
                <button class="btn bad sm" (click)="s.resolveIdea(i.id, false)">No thanks</button>
              </div>
            </article>
          } @empty { <p class="muted quiet">No ideas from the kids yet.</p> }
        </section>

        <section class="grid">
          <h2>🎁 Reward wishes <span class="chip warn">{{ wishes().length }}</span></h2>
          @for (d of wishes(); track d.id) {
            @let r = s.reward(d.rewardId);
            @let m = s.member(d.childId);
            <article class="card item">
              <span class="tile" aria-hidden="true">{{ r?.emoji }}</span>
              <div class="grow">
                <h3>{{ m?.name }} would like: {{ r?.title }}</h3>
                <p class="muted">{{ s.balance(d.childId) }} points saved · costs {{ r?.cost }}</p>
              </div>
              <div class="row">
                <button class="btn good sm" [disabled]="s.balance(d.childId) < (r?.cost ?? 0)" (click)="s.resolveRedemption(d.id, true)">Grant</button>
                <button class="btn bad sm" (click)="s.resolveRedemption(d.id, false)">Not now</button>
              </div>
            </article>
          } @empty { <p class="muted quiet">No wishes waiting.</p> }
        </section>
      } @else {
        <section class="grid">
          @for (r of myItems(); track r.key) {
            <article class="card item">
              <span class="tile" aria-hidden="true">{{ r.icon }}</span>
              <div class="grow"><h3>{{ r.title }}</h3><p class="muted">{{ r.sub }}</p></div>
              <span class="chip" [class.warn]="r.status === 'pending'" [class.good]="r.status === 'approved'" [class.bad]="r.status === 'declined' || r.status === 'rejected'">
                {{ label(r.status) }}
              </span>
            </article>
          } @empty {
            <div class="card empty"><div class="big">📭</div><h3>No requests yet</h3><p class="muted">Use "Ask to change" on a task, or ask for a reward.</p></div>
          }
        </section>
      }
    </div>
  `,
  styles: `
    h2 { display: flex; align-items: center; gap: 10px; }
    .item { display: grid; grid-template-columns: auto 1fr auto auto; align-items: center; gap: 16px; }
    .tile { width: 56px; height: 56px; border-radius: calc(18px * var(--rs)); display: grid; place-items: center; font-size: 1.7rem; background: var(--accent-soft); }
    .grow { min-width: 0; }
    .quote { margin-top: 6px; padding: 8px 12px; border-radius: calc(12px * var(--rs)); background: var(--surface-2); font-style: italic; }
    .quiet { padding: 4px 4px 12px; }
    @media (max-width: 760px) { .item { grid-template-columns: auto 1fr; } .item > .row, .item > .chip { grid-column: 1 / -1; } }
  `,
})
export class Requests {
  readonly completions = computed(() => this.s.fam().completions.filter(c => c.status === 'pending'));
  readonly reqs = computed(() => this.s.fam().requests.filter(r => r.status === 'pending'));
  readonly ideas = computed(() => this.s.fam().ideas.filter(i => i.status === 'pending'));
  readonly ideaCost = signal<Record<string, number>>({});
  readonly wishes = computed(() => this.s.fam().redemptions.filter(r => r.status === 'pending'));

  readonly myItems = computed(() => {
    const f = this.s.fam();
    const id = this.s.me().id;
    const out: { key: string; at: number; icon: string; title: string; sub: string; status: string }[] = [];
    f.requests.filter(r => r.fromId === id).forEach(r => out.push({
      key: r.id, at: r.at, icon: r.kind === 'swap' ? '🔄' : '⏰',
      title: r.kind === 'swap' ? `Swap ${this.s.task(r.taskId)?.title} with ${this.s.member(r.toId ?? '')?.name}` : `Move ${this.s.task(r.taskId)?.title} to ${this.fmt(r.newTime ?? '')}`,
      sub: r.message, status: r.status,
    }));
    f.redemptions.filter(d => d.childId === id).forEach(d => out.push({
      key: d.id, at: d.at, icon: this.s.reward(d.rewardId)?.emoji ?? '🎁', title: `Wish: ${this.s.reward(d.rewardId)?.title}`,
      sub: `${this.s.reward(d.rewardId)?.cost} points`, status: d.status,
    }));
    f.ideas.filter(i => i.byId === id).forEach(i => out.push({ key: i.id, at: i.at, icon: i.emoji, title: `Idea: ${i.title}`, sub: `You suggested ${i.cost} points`, status: i.status }));
    f.completions.filter(c => c.byId === id).forEach(c => out.push({
      key: c.id, at: c.at, icon: this.s.task(c.taskId)?.emoji ?? '✅', title: `Finished: ${this.s.task(c.taskId)?.title}`,
      sub: c.status === 'rejected' ? 'A parent asked you to try again.' : 'Sent for checking', status: c.status,
    }));
    return out.sort((a, b) => b.at - a.at);
  });

  constructor(readonly s: Store) {}

  cost(id: string, base: number) { return this.ideaCost()[id] ?? base; }
  bump(id: string, base: number, d: number) { this.ideaCost.update(c => ({ ...c, [id]: Math.max(10, this.cost(id, base) + d) })); }
  label(st: string) { return st === 'pending' ? 'Waiting' : st === 'approved' ? 'Approved' : st === 'rejected' ? 'Try again' : 'Not this time'; }
  ago(t: number) { const m = Math.round((Date.now() - t) / 60000); return m < 60 ? `${m} min ago` : `${Math.round(m / 60)} hr ago`; }
  fmt(t: string) {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
  }
}
