import { Component, signal } from '@angular/core';
import { Member, Store } from '../store';
import { MemberModal } from '../modals/small-modals';

@Component({
  selector: 'app-family',
  imports: [MemberModal],
  template: `
    <div class="page">
      <header class="page-head">
        <div><h1>{{ s.fam().emoji }} {{ s.fam().name }}</h1><p>Who is on the team, and who is in charge.</p></div>
        @if (s.isParent()) { <button class="btn primary" (click)="add.set(true)">➕ Add someone</button> }
      </header>

      <section class="card invite">
        <div>
          <h2>Invite code</h2>
          <p class="muted">Share this with family members so they can join with their Google account.</p>
        </div>
        <div class="row">
          <code class="code">{{ s.fam().code }}</code>
          <button class="btn sm" (click)="copy()">{{ copied() ? 'Copied!' : 'Copy' }}</button>
        </div>
      </section>

      @for (g of groups(); track g.title) {
        <section class="grid">
          <h2>{{ g.title }} <span class="chip">{{ g.list.length }}</span></h2>
          <div class="grid people">
            @for (m of g.list; track m.id) {
              <article class="card person">
                <span class="avatar" [style.--c]="m.color" style="--s: 72px">{{ m.avatar }}</span>
                <h3>{{ m.name }}</h3>
                <span class="chip" [class.info]="m.role === 'parent'" [class.pts]="m.role === 'child'">{{ m.role === 'parent' ? 'Parent' : 'Kid' }}</span>
                @if (m.role === 'child') { <p class="muted">⭐ {{ s.balance(m.id) }} points · Level {{ s.level(m.id).level }}</p> }
                @if (m.email) { <p class="muted mail">{{ m.email }}</p> }
                @if (s.isParent() && m.id !== s.me().id) {
                  <div class="row wrap">
                    <button class="btn ghost sm" (click)="toggle(m)">Make {{ m.role === 'parent' ? 'kid' : 'parent' }}</button>
                    <button class="btn ghost sm" (click)="remove(m)">Remove</button>
                  </div>
                }
              </article>
            }
          </div>
        </section>
      }

      <section class="card roles">
        <h2>How roles work</h2>
        <div class="grid two">
          <div><h3>🧑 Parents</h3><p class="muted">Create tasks and rewards, approve finished work, answer requests and give bonus points.</p></div>
          <div><h3>🧒 Kids</h3><p class="muted">Do tasks, tap "I did it", ask to change or swap, earn points and wish for rewards.</p></div>
        </div>
      </section>
    </div>
    @if (add()) { <app-member-modal (closed)="add.set(false)" /> }
  `,
  styles: `
    .invite { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px; background: var(--info-soft); }
    .code { font-family: var(--font-display); font-size: 1.8rem; letter-spacing: .08em; padding: 8px 18px; border-radius: calc(14px * var(--rs)); background: var(--surface); border: var(--bw) dashed var(--info); }
    h2 { display: flex; align-items: center; gap: 10px; }
    .people { grid-template-columns: repeat(auto-fill, minmax(min(100%, 230px), 1fr)); }
    .person { display: grid; justify-items: center; text-align: center; gap: 8px; }
    .mail { font-size: .85rem; word-break: break-all; }
    .two { grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr)); gap: 20px; margin-top: 10px; }
  `,
})
export class FamilyPage {
  readonly add = signal(false);
  readonly copied = signal(false);

  constructor(readonly s: Store) {}

  groups() {
    return [{ title: 'Parents', list: this.s.parents() }, { title: 'Kids', list: this.s.kids() }].filter(g => g.list.length || g.title === 'Kids');
  }
  toggle(m: Member) {
    if (m.role === 'parent' && this.s.parents().length < 2) { this.s.toast('Keep at least one parent!', '🛟'); return; }
    this.s.setRole(m.id, m.role === 'parent' ? 'child' : 'parent');
  }
  remove(m: Member) { if (confirm(`Remove ${m.name} and their tasks?`)) this.s.removeMember(m.id); }
  async copy() {
    try { await navigator.clipboard.writeText(this.s.fam().code); } catch { /* ignore */ }
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 1800);
  }
}
