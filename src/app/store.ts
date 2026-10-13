import { Injectable, computed, inject, signal } from '@angular/core';
import { Fx } from './fx';

export type Role = 'parent' | 'child';
export type Repeat = 'once' | 'daily' | 'weekdays' | 'weekends' | 'custom';
export type ReqStatus = 'pending' | 'approved' | 'declined';
export type Period = 'week' | 'month' | 'all';

export interface Member { id: string; name: string; role: Role; avatar: string; color: string; email?: string }
export interface Task {
  id: string; title: string; description: string; emoji: string; points: number;
  assigneeId: string; startDate: string; time: string; repeat: Repeat; days: number[];
}
export interface Completion { id: string; taskId: string; date: string; byId: string; status: 'pending' | 'approved' | 'rejected'; at: number }
export interface Override { taskId: string; date: string; toId: string }
export interface Req {
  id: string; kind: 'edit' | 'swap'; taskId: string; date: string; fromId: string;
  toId?: string; newTime?: string; message: string; status: ReqStatus; at: number;
}
export interface Reward { id: string; title: string; emoji: string; cost: number }
export interface Redemption { id: string; rewardId: string; childId: string; status: ReqStatus; at: number }
export interface RewardIdea { id: string; title: string; emoji: string; cost: number; byId: string; status: ReqStatus; at: number }
export interface LedgerEntry { id: string; childId: string; points: number; reason: string; date: string; kind: 'task' | 'reward' | 'bonus' }
export interface Family {
  id: string; name: string; emoji: string; code: string;
  members: Member[]; tasks: Task[]; completions: Completion[]; overrides: Override[];
  requests: Req[]; rewards: Reward[]; redemptions: Redemption[]; ledger: LedgerEntry[]; ideas: RewardIdea[];
}
export type InstStatus = 'todo' | 'pending' | 'done' | 'redo' | 'missed';
export interface Instance {
  task: Task; date: string; assigneeId: string; status: InstStatus;
  completion?: Completion; swapped: boolean; openRequest?: Req;
}

export const AVATARS = ['🦊', '🐼', '🐸', '🦄', '🐯', '🐙', '🦖', '🐧', '🐻', '🦁', '🐰', '🦉'];
export const TASK_EMOJIS = ['🛏️', '🐶', '📚', '🌱', '🧹', '🍽️', '♻️', '🧺', '🦷', '🎒', '🚿', '🧸'];
export const REWARD_EMOJIS = ['🎬', '🎮', '🍦', '📖', '🏕️', '🍕', '🎢', '🧁', '⚽', '🎨'];
export const COLORS = ['#FF8A3D', '#2BB3A3', '#4C8DF6', '#F2557A', '#8BC34A', '#F2B01E'];
export const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function iso(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}
export function parse(s: string): Date { return new Date(s + 'T00:00:00'); }
export function addDays(s: string, n: number): string { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); }

let seq = 100;
const uid = (p: string) => `${p}${++seq}`;

function seedFamily(): Family {
  const today = iso(new Date());
  const ago = (n: number) => addDays(today, -n);
  const members: Member[] = [
    { id: 'm1', name: 'Alain', role: 'parent', avatar: '🦁', color: COLORS[2], email: 'alain.elemia@gmail.com' },
    { id: 'm2', name: 'Dana', role: 'parent', avatar: '🦉', color: COLORS[1] },
    { id: 'm3', name: 'Mika', role: 'child', avatar: '🦊', color: COLORS[0] },
    { id: 'm4', name: 'Theo', role: 'child', avatar: '🐼', color: COLORS[3] },
    { id: 'm5', name: 'Zuri', role: 'child', avatar: '🐸', color: COLORS[4] },
  ];
  const t = (id: string, title: string, emoji: string, points: number, assigneeId: string, time: string, repeat: Repeat, days: number[] = [], description = ''): Task =>
    ({ id, title, emoji, points, assigneeId, time, repeat, days, description, startDate: ago(40) });
  const tasks: Task[] = [
    t('t1', 'Make your bed', '🛏️', 10, 'm3', '07:30', 'daily', [], 'Straighten the sheets and fluff the pillow.'),
    t('t2', 'Make your bed', '🛏️', 10, 'm4', '07:30', 'daily', [], 'Pull the blanket up and line up the teddy bears.'),
    t('t3', 'Feed Biscuit', '🐶', 15, 'm4', '18:00', 'daily', [], 'One scoop of food and fresh water in the blue bowl.'),
    t('t4', 'Homework time', '📚', 20, 'm3', '16:30', 'weekdays', [], 'Finish homework before screens.'),
    t('t5', 'Water the plants', '🌱', 10, 'm5', '09:00', 'custom', [1, 3, 5], 'Balcony pots first, then the kitchen window.'),
    t('t6', 'Tidy the playroom', '🧸', 25, 'm5', '10:00', 'weekends', [], 'Toys in the bins, books on the shelf.'),
    t('t7', 'Take out recycling', '♻️', 15, 'm3', '19:00', 'custom', [2, 4], 'Paper and plastic go in the big blue bin.'),
    t('t8', 'Read for 20 minutes', '📖', 15, 'm4', '20:00', 'daily', [], 'Any book you like. Tell us the best part!'),
    t('t9', 'Empty the dishwasher', '🍽️', 15, 'm5', '17:30', 'weekdays', [], 'Plates on the low shelf, cups up top.'),
  ];
  const rewards: Reward[] = [
    { id: 'r1', title: 'Pick the dinner', emoji: '🍕', cost: 60 },
    { id: 'r2', title: '30 min extra game time', emoji: '🎮', cost: 80 },
    { id: 'r3', title: 'Movie night pick', emoji: '🎬', cost: 100 },
    { id: 'r4', title: 'Ice cream trip', emoji: '🍦', cost: 150 },
    { id: 'r5', title: 'A brand new book', emoji: '📖', cost: 200 },
    { id: 'r6', title: 'Backyard campout', emoji: '🏕️', cost: 300 },
  ];
  const ledger: LedgerEntry[] = [];
  const plan: Record<string, number[]> = {
    m3: [30, 25, 40, 20, 35, 15, 45, 30, 20, 25, 35, 30],
    m4: [20, 25, 15, 30, 25, 20, 10, 25, 30, 15, 20, 25],
    m5: [10, 25, 15, 20, 10, 25, 15, 10, 20, 15, 25, 10],
  };
  Object.entries(plan).forEach(([cid, arr]) => arr.forEach((p, i) => {
    ledger.push({ id: uid('l'), childId: cid, points: p, reason: 'Finished chores', date: ago(i * 2 + 1), kind: 'task' });
  }));
  ledger.push({ id: uid('l'), childId: 'm3', points: -100, reason: 'Movie night pick', date: ago(6), kind: 'reward' });
  ledger.push({ id: uid('l'), childId: 'm4', points: -60, reason: 'Pick the dinner', date: ago(9), kind: 'reward' });
  ledger.push({ id: uid('l'), childId: 'm5', points: 20, reason: 'Bonus: helped grandma', date: ago(3), kind: 'bonus' });

  const completions: Completion[] = [
    { id: 'c1', taskId: 't2', date: today, byId: 'm4', status: 'pending', at: Date.now() - 3600_000 },
    { id: 'c2', taskId: 't1', date: today, byId: 'm3', status: 'approved', at: Date.now() - 7200_000 },
  ];
  const requests: Req[] = [
    { id: 'q1', kind: 'edit', taskId: 't4', date: today, fromId: 'm3', newTime: '17:30', message: 'I have soccer practice until 5, can I do homework later?', status: 'pending', at: Date.now() - 5400_000 },
    { id: 'q2', kind: 'swap', taskId: 't9', date: today, fromId: 'm5', toId: 'm4', message: 'I have a sleepover party to get ready for. Theo said yes!', status: 'pending', at: Date.now() - 1800_000 },
  ];
  const redemptions: Redemption[] = [{ id: 'd1', rewardId: 'r2', childId: 'm3', status: 'pending', at: Date.now() - 900_000 }];

  const ideas: RewardIdea[] = [{ id: 'i1', title: 'Trampoline park trip', emoji: '🎢', cost: 250, byId: 'm4', status: 'pending', at: Date.now() - 2400_000 }];
  return { id: 'f1', name: 'The Rivera Family', emoji: '🏡', code: 'RIV-4829', members, tasks, completions, overrides: [], requests, rewards, redemptions, ledger, ideas };
}

@Injectable({ providedIn: 'root' })
export class Store {
  readonly today = iso(new Date());
  readonly signedIn = signal(false);
  readonly families = signal<Family[]>([seedFamily()]);
  readonly activeId = signal('f1');
  readonly meId = signal('m1');
  readonly toastMsg = signal<{ text: string; emoji: string } | null>(null);
  private toastTimer: ReturnType<typeof setTimeout> | undefined;
  private fx = inject(Fx);

  readonly fam = computed(() => this.families().find(f => f.id === this.activeId()) ?? this.families()[0]);
  readonly me = computed(() => this.fam().members.find(m => m.id === this.meId()) ?? this.fam().members[0]);
  readonly isParent = computed(() => this.me().role === 'parent');
  readonly kids = computed(() => this.fam().members.filter(m => m.role === 'child'));
  readonly parents = computed(() => this.fam().members.filter(m => m.role === 'parent'));
  readonly pendingCount = computed(() => {
    const f = this.fam();
    if (this.isParent()) {
      return f.completions.filter(c => c.status === 'pending').length
        + f.requests.filter(r => r.status === 'pending').length
        + f.redemptions.filter(r => r.status === 'pending').length
        + f.ideas.filter(r => r.status === 'pending').length;
    }
    return 0;
  });

  // ---------- helpers ----------
  member(id: string): Member | undefined { return this.fam().members.find(m => m.id === id); }
  task(id: string): Task | undefined { return this.fam().tasks.find(t => t.id === id); }
  reward(id: string): Reward | undefined { return this.fam().rewards.find(r => r.id === id); }

  toast(text: string, emoji = '🎉') {
    clearTimeout(this.toastTimer);
    this.toastMsg.set({ text, emoji });
    this.toastTimer = setTimeout(() => this.toastMsg.set(null), 3200);
  }

  private patch(fn: (f: Family) => Family) {
    const id = this.activeId();
    this.families.update(list => list.map(f => (f.id === id ? fn(f) : f)));
  }

  // ---------- auth & families ----------
  signIn(asKid = false) {
    this.signedIn.set(true);
    this.meId.set(asKid ? 'm3' : 'm1');
    this.activeId.set('f1');
  }
  signOut() { this.signedIn.set(false); }
  switchMember(id: string) { this.meId.set(id); }
  switchFamily(id: string) {
    this.activeId.set(id);
    const f = this.fam();
    const mine = f.members.find(m => m.id === this.meId()) ?? f.members[0];
    this.meId.set(mine.id);
  }
  createFamily(name: string, emoji: string) {
    const id = uid('f');
    const meId = uid('m');
    const code = name.slice(0, 3).toUpperCase().padEnd(3, 'X') + '-' + Math.floor(1000 + Math.random() * 9000);
    const f: Family = {
      id, name, emoji, code,
      members: [{ id: meId, name: 'Alain', role: 'parent', avatar: '🦁', color: COLORS[2], email: 'alain.elemia@gmail.com' }],
      tasks: [], completions: [], overrides: [], requests: [],
      rewards: [{ id: uid('r'), title: 'Pick the dinner', emoji: '🍕', cost: 60 }],
      redemptions: [], ledger: [], ideas: [],
    };
    this.families.update(l => [...l, f]);
    this.activeId.set(id);
    this.meId.set(meId);
    this.toast(`${name} is ready! Add your kids next.`, emoji);
  }
  joinFamily(code: string): boolean {
    const f = this.families().find(x => x.code.toLowerCase() === code.trim().toLowerCase());
    if (!f) return false;
    this.switchFamily(f.id);
    this.toast(`Welcome to ${f.name}!`, f.emoji);
    return true;
  }

  // ---------- members ----------
  addMember(name: string, role: Role, avatar: string) {
    const color = COLORS[this.fam().members.length % COLORS.length];
    this.patch(f => ({ ...f, members: [...f.members, { id: uid('m'), name, role, avatar, color }] }));
    this.toast(`${name} joined the family!`, avatar);
  }
  setRole(id: string, role: Role) {
    this.patch(f => ({ ...f, members: f.members.map(m => (m.id === id ? { ...m, role } : m)) }));
  }
  removeMember(id: string) {
    this.patch(f => ({
      ...f,
      members: f.members.filter(m => m.id !== id),
      tasks: f.tasks.filter(t => t.assigneeId !== id),
    }));
  }

  // ---------- tasks ----------
  occursOn(t: Task, date: string): boolean {
    if (date < t.startDate) return false;
    const dow = parse(date).getDay();
    switch (t.repeat) {
      case 'once': return date === t.startDate;
      case 'daily': return true;
      case 'weekdays': return dow >= 1 && dow <= 5;
      case 'weekends': return dow === 0 || dow === 6;
      case 'custom': return t.days.includes(dow);
    }
  }
  repeatLabel(t: Task): string {
    switch (t.repeat) {
      case 'once': return 'One time';
      case 'daily': return 'Every day';
      case 'weekdays': return 'Weekdays';
      case 'weekends': return 'Weekends';
      case 'custom': return t.days.length ? t.days.map(d => DAY_LABELS[d]).join(', ') : 'Pick days';
    }
  }
  instancesOn(date: string, memberId?: string): Instance[] {
    const f = this.fam();
    const out: Instance[] = [];
    for (const task of f.tasks) {
      if (!this.occursOn(task, date)) continue;
      const ov = f.overrides.find(o => o.taskId === task.id && o.date === date);
      const assigneeId = ov ? ov.toId : task.assigneeId;
      if (memberId && assigneeId !== memberId) continue;
      const completion = [...f.completions].reverse().find(c => c.taskId === task.id && c.date === date);
      let status: InstStatus = 'todo';
      if (completion?.status === 'pending') status = 'pending';
      else if (completion?.status === 'approved') status = 'done';
      else if (completion?.status === 'rejected') status = 'redo';
      else if (date < this.today) status = 'missed';
      const openRequest = f.requests.find(r => r.taskId === task.id && r.date === date && r.status === 'pending');
      out.push({ task, date, assigneeId, status, completion, swapped: !!ov, openRequest });
    }
    return out.sort((a, b) => a.task.time.localeCompare(b.task.time));
  }
  saveTask(t: Omit<Task, 'id'> & { id?: string }) {
    if (t.id) {
      this.patch(f => ({ ...f, tasks: f.tasks.map(x => (x.id === t.id ? (t as Task) : x)) }));
      this.toast('Task updated!', '✏️');
    } else {
      this.patch(f => ({ ...f, tasks: [...f.tasks, { ...t, id: uid('t') } as Task] }));
      this.fx.burst('small', { emoji: '🚀' });
      this.toast('New task added!', '🚀');
    }
  }
  deleteTask(id: string) {
    this.patch(f => ({ ...f, tasks: f.tasks.filter(t => t.id !== id) }));
    this.toast('Task removed', '🗑️');
  }

  // ---------- completion ----------
  submitDone(taskId: string, date: string) {
    const by = this.meId();
    const parentDirect = this.isParent();
    this.patch(f => ({
      ...f,
      completions: [...f.completions, { id: uid('c'), taskId, date, byId: by, status: parentDirect ? 'approved' : 'pending', at: Date.now() }],
    }));
    if (parentDirect) {
      const t = this.task(taskId);
      if (t) this.award(this.instancesOn(date).find(i => i.task.id === taskId)?.assigneeId ?? t.assigneeId, t.points, t.title, date);
    } else {
      this.fx.burst('stars', { label: 'Nice one!' });
      this.toast('Awesome! Sent to a parent to check.', '⭐');
    }
  }
  private award(childId: string, points: number, reason: string, date: string) {
    const before = this.level(childId).level;
    this.patch(f => ({ ...f, ledger: [...f.ledger, { id: uid('l'), childId, points, reason, date, kind: 'task' }] }));
    const after = this.level(childId).level;
    this.fx.burst('big', { label: `+${points} ⭐` });
    if (after > before) setTimeout(() => { this.fx.burst('big', { emoji: '🆙', label: `Level ${after}!` }); this.toast(`${this.member(childId)?.name} reached level ${after}!`, '🚀'); }, 700);
  }
  resolveCompletion(id: string, ok: boolean) {
    const c = this.fam().completions.find(x => x.id === id);
    if (!c) return;
    this.patch(f => ({ ...f, completions: f.completions.map(x => (x.id === id ? { ...x, status: ok ? 'approved' : 'rejected' } : x)) }));
    if (ok) {
      const t = this.task(c.taskId);
      if (t) this.award(c.byId, t.points, t.title, c.date);
      this.toast(`+${t?.points ?? 0} points sent to ${this.member(c.byId)?.name}!`, '🌟');
    } else {
      this.toast('Sent back to try again', '↩️');
    }
  }
  undoCompletion(taskId: string, date: string) {
    this.patch(f => ({ ...f, completions: f.completions.filter(c => !(c.taskId === taskId && c.date === date && c.status === 'pending')) }));
  }

  // ---------- requests ----------
  sendRequest(r: Omit<Req, 'id' | 'status' | 'at' | 'fromId'>) {
    this.patch(f => ({ ...f, requests: [...f.requests, { ...r, id: uid('q'), fromId: this.meId(), status: 'pending', at: Date.now() }] }));
    this.fx.burst('small', { emoji: '💌' });
    this.toast('Request sent! A parent will take a look.', '💌');
  }
  resolveRequest(id: string, ok: boolean) {
    const r = this.fam().requests.find(x => x.id === id);
    if (!r) return;
    this.patch(f => {
      let tasks = f.tasks;
      let overrides = f.overrides;
      if (ok && r.kind === 'edit' && r.newTime) tasks = tasks.map(t => (t.id === r.taskId ? { ...t, time: r.newTime! } : t));
      if (ok && r.kind === 'swap' && r.toId) overrides = [...overrides.filter(o => !(o.taskId === r.taskId && o.date === r.date)), { taskId: r.taskId, date: r.date, toId: r.toId }];
      return { ...f, tasks, overrides, requests: f.requests.map(x => (x.id === id ? { ...x, status: ok ? 'approved' : 'declined' } : x)) };
    });
    if (ok) this.fx.burst('small');
    this.toast(ok ? 'Request approved' : 'Request declined', ok ? '👍' : '🙅');
  }

  // ---------- points ----------
  balance(childId: string): number {
    return this.fam().ledger.filter(l => l.childId === childId).reduce((s, l) => s + l.points, 0);
  }
  earned(childId: string, period: Period): number {
    const start = period === 'week' ? addDays(this.today, -6) : period === 'month' ? addDays(this.today, -29) : '0000-00-00';
    return this.fam().ledger.filter(l => l.childId === childId && l.points > 0 && l.date >= start).reduce((s, l) => s + l.points, 0);
  }
  level(childId: string): { level: number; into: number } {
    const total = this.earned(childId, 'all');
    return { level: Math.floor(total / 100) + 1, into: total % 100 };
  }
  bonus(childId: string, points: number, reason: string) {
    this.patch(f => ({ ...f, ledger: [...f.ledger, { id: uid('l'), childId, points, reason: `Bonus: ${reason}`, date: this.today, kind: 'bonus' }] }));
    this.fx.burst('big', { label: `+${points} ⭐`, emoji: '🎁' });
    this.toast(`+${points} bonus points for ${this.member(childId)?.name}!`, '🎁');
  }

  // ---------- rewards ----------
  saveReward(r: Omit<Reward, 'id'> & { id?: string }) {
    if (r.id) this.patch(f => ({ ...f, rewards: f.rewards.map(x => (x.id === r.id ? (r as Reward) : x)) }));
    else this.patch(f => ({ ...f, rewards: [...f.rewards, { ...r, id: uid('r') } as Reward] }));
    this.toast('Reward saved!', r.emoji);
  }
  deleteReward(id: string) { this.patch(f => ({ ...f, rewards: f.rewards.filter(r => r.id !== id) })); }
  redeem(rewardId: string) {
    this.patch(f => ({ ...f, redemptions: [...f.redemptions, { id: uid('d'), rewardId, childId: this.meId(), status: 'pending', at: Date.now() }] }));
    this.fx.burst('stars', { emoji: '🙏' });
    this.toast('Wish sent to your parents!', '🙏');
  }
  resolveRedemption(id: string, ok: boolean) {
    const d = this.fam().redemptions.find(x => x.id === id);
    const r = d && this.reward(d.rewardId);
    if (!d || !r) return;
    this.patch(f => ({
      ...f,
      redemptions: f.redemptions.map(x => (x.id === id ? { ...x, status: ok ? 'approved' : 'declined' } : x)),
      ledger: ok ? [...f.ledger, { id: uid('l'), childId: d.childId, points: -r.cost, reason: r.title, date: this.today, kind: 'reward' }] : f.ledger,
    }));
    if (ok) this.fx.burst('big', { emoji: r.emoji, label: r.emoji + ' Granted!' });
    this.toast(ok ? `${r.title} granted!` : 'Not this time', ok ? r.emoji : '🙅');
  }
  suggestReward(title: string, emoji: string, cost: number) {
    this.patch(f => ({ ...f, ideas: [...f.ideas, { id: uid('i'), title, emoji, cost, byId: this.meId(), status: 'pending', at: Date.now() }] }));
    this.fx.burst('small', { emoji: '💡' });
    this.toast('Great idea! A parent will take a look.', '💡');
  }
  resolveIdea(id: string, ok: boolean, cost?: number) {
    const idea = this.fam().ideas.find(i => i.id === id);
    if (!idea) return;
    const price = cost ?? idea.cost;
    this.patch(f => ({
      ...f,
      ideas: f.ideas.map(i => (i.id === id ? { ...i, cost: price, status: ok ? 'approved' : 'declined' } : i)),
      rewards: ok ? [...f.rewards, { id: uid('r'), title: idea.title, emoji: idea.emoji, cost: price }] : f.rewards,
    }));
    if (ok) this.fx.burst('big', { emoji: idea.emoji, label: 'New reward!' });
    this.toast(ok ? `${idea.title} is now a reward!` : 'Idea declined', ok ? idea.emoji : '🙅');
  }
  hasPendingRedeem(childId: string, rewardId: string): boolean {
    return this.fam().redemptions.some(d => d.childId === childId && d.rewardId === rewardId && d.status === 'pending');
  }
}
