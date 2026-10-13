import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AVATARS, REWARD_EMOJIS, Reward, Role, Store } from '../store';

@Component({
  selector: 'app-reward-modal',
  imports: [FormsModule],
  template: `
    <div class="scrim" (click)="closed.emit()" (keydown.escape)="closed.emit()" tabindex="-1">
      <form class="modal" role="dialog" aria-modal="true" aria-labelledby="rw-title" (click)="$event.stopPropagation()" (ngSubmit)="save()">
        <div class="modal-head">
          <h2 id="rw-title">{{ suggest() ? 'Suggest a reward' : reward() ? 'Edit reward' : 'New reward' }}</h2>
          <button type="button" class="icon-btn" (click)="closed.emit()" aria-label="Close">✕</button>
        </div>
        <div class="field">
          <label for="rt">Reward</label>
          <input id="rt" name="t" class="input" [(ngModel)]="title" placeholder="Pizza and a movie" maxlength="36" required />
        </div>
        <div class="field">
          <span class="label">Pick an icon</span>
          <div class="pick">
            @for (e of emojis; track e) {
              <button type="button" [attr.aria-pressed]="emoji === e" (click)="emoji = e">{{ e }}</button>
            }
          </div>
        </div>
        <div class="field">
          <span class="label">{{ suggest() ? 'How many points should it cost?' : 'Costs how many points?' }}</span>
          <div class="row">
            <button type="button" class="icon-btn" (click)="cost = cost > 10 ? cost - 10 : cost" aria-label="Cheaper">−</button>
            <span class="chip pts" style="font-size:1.2rem;padding:8px 20px">⭐ {{ cost }}</span>
            <button type="button" class="icon-btn" (click)="cost = cost + 10" aria-label="Pricier">+</button>
          </div>
        </div>
        <div class="modal-foot">
          <button type="button" class="btn ghost" (click)="closed.emit()">Cancel</button>
          <button type="submit" class="btn primary" [disabled]="!title.trim()">{{ suggest() ? 'Send idea 💡' : 'Save reward' }}</button>
        </div>
      </form>
    </div>
  `,
})
export class RewardModal {
  readonly reward = input<Reward | null>(null);
  readonly suggest = input(false);
  readonly closed = output<void>();
  readonly emojis = REWARD_EMOJIS;
  title = ''; emoji = '🎁'; cost = 100;

  constructor(private s: Store) {}
  ngOnInit() {
    const r = this.reward();
    if (r) { this.title = r.title; this.emoji = r.emoji; this.cost = r.cost; }
  }
  save() {
    if (!this.title.trim()) return;
    if (this.suggest()) this.s.suggestReward(this.title.trim(), this.emoji, this.cost);
    else this.s.saveReward({ id: this.reward()?.id, title: this.title.trim(), emoji: this.emoji, cost: this.cost });
    this.closed.emit();
  }
}

@Component({
  selector: 'app-member-modal',
  imports: [FormsModule],
  template: `
    <div class="scrim" (click)="closed.emit()" (keydown.escape)="closed.emit()" tabindex="-1">
      <form class="modal" role="dialog" aria-modal="true" aria-labelledby="mm-title" (click)="$event.stopPropagation()" (ngSubmit)="save()">
        <div class="modal-head">
          <h2 id="mm-title">Add someone</h2>
          <button type="button" class="icon-btn" (click)="closed.emit()" aria-label="Close">✕</button>
        </div>
        <div class="field">
          <label for="mn">Name</label>
          <input id="mn" name="n" class="input" [(ngModel)]="name" placeholder="Nora" maxlength="20" required />
        </div>
        <div class="field">
          <span class="label">Role</span>
          <div class="pick" role="radiogroup">
            <button type="button" class="text" role="radio" [attr.aria-checked]="role === 'child'" (click)="role = 'child'">🧒 Child</button>
            <button type="button" class="text" role="radio" [attr.aria-checked]="role === 'parent'" (click)="role = 'parent'">🧑 Parent</button>
          </div>
          <span class="hint">{{ role === 'parent' ? 'Parents create tasks, approve work and hand out rewards.' : 'Children do tasks, earn points and ask for rewards.' }}</span>
        </div>
        <div class="field">
          <span class="label">Pick an avatar</span>
          <div class="pick">
            @for (a of avatars; track a) {
              <button type="button" [attr.aria-pressed]="avatar === a" (click)="avatar = a">{{ a }}</button>
            }
          </div>
        </div>
        <div class="modal-foot">
          <button type="button" class="btn ghost" (click)="closed.emit()">Cancel</button>
          <button type="submit" class="btn primary" [disabled]="!name.trim()">Add to family</button>
        </div>
      </form>
    </div>
  `,
})
export class MemberModal {
  readonly closed = output<void>();
  readonly avatars = AVATARS;
  name = ''; role: Role = 'child'; avatar = '🐯';
  constructor(private s: Store) {}
  save() {
    if (!this.name.trim()) return;
    this.s.addMember(this.name.trim(), this.role, this.avatar);
    this.closed.emit();
  }
}

@Component({
  selector: 'app-bonus-modal',
  imports: [FormsModule],
  template: `
    <div class="scrim" (click)="closed.emit()" (keydown.escape)="closed.emit()" tabindex="-1">
      <form class="modal" role="dialog" aria-modal="true" aria-labelledby="bm-title" (click)="$event.stopPropagation()" (ngSubmit)="save()">
        <div class="modal-head">
          <h2 id="bm-title">Surprise bonus</h2>
          <button type="button" class="icon-btn" (click)="closed.emit()" aria-label="Close">✕</button>
        </div>
        <div class="field">
          <span class="label">Who earned it?</span>
          <div class="pick" role="radiogroup">
            @for (k of s.kids(); track k.id) {
              <button type="button" class="text" role="radio" [attr.aria-checked]="childId === k.id" (click)="childId = k.id">{{ k.avatar }} {{ k.name }}</button>
            }
          </div>
        </div>
        <div class="field">
          <label for="br">What for?</label>
          <input id="br" name="r" class="input" [(ngModel)]="reason" placeholder="Helped carry the groceries" maxlength="40" required />
        </div>
        <div class="field">
          <span class="label">Bonus points</span>
          <div class="pick">
            @for (p of options; track p) {
              <button type="button" class="text" [attr.aria-pressed]="points === p" (click)="points = p">⭐ {{ p }}</button>
            }
          </div>
        </div>
        <div class="modal-foot">
          <button type="button" class="btn ghost" (click)="closed.emit()">Cancel</button>
          <button type="submit" class="btn primary" [disabled]="!reason.trim() || !childId">Give bonus 🎁</button>
        </div>
      </form>
    </div>
  `,
})
export class BonusModal {
  readonly preset = input<string | null>(null);
  readonly closed = output<void>();
  readonly options = [5, 10, 20, 50];
  childId = ''; reason = ''; points = 10;
  constructor(readonly s: Store) {}
  ngOnInit() { this.childId = this.preset() ?? this.s.kids()[0]?.id ?? ''; }
  save() {
    if (!this.reason.trim() || !this.childId) return;
    this.s.bonus(this.childId, this.points, this.reason.trim());
    this.closed.emit();
  }
}
