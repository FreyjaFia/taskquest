import { Component, computed, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Store } from './store';
import { Theme } from './theme';
import { FamilyModal } from './modals/family-modal';
import { StylePicker } from './style-picker';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, FamilyModal, StylePicker],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  readonly menu = signal<'none' | 'family' | 'profile'>('none');
  readonly familyModal = signal(false);

  readonly nav = computed(() => {
    const parent = this.s.isParent();
    const pending = this.s.pendingCount();
    return [
      { path: '/', label: 'Home', icon: '🏠', exact: true, badge: 0 },
      { path: '/tasks', label: 'Tasks', icon: '📋', exact: false, badge: 0 },
      { path: '/requests', label: parent ? 'Approvals' : 'Requests', icon: '📬', exact: false, badge: pending },
      { path: '/rewards', label: 'Rewards', icon: '🎁', exact: false, badge: 0 },
      { path: '/leaderboard', label: 'Ranks', icon: '🏆', exact: false, badge: 0 },
    ];
  });

  constructor(readonly s: Store, readonly theme: Theme, private router: Router) {}

  toggle(m: 'family' | 'profile') { this.menu.update(v => (v === m ? 'none' : m)); }
  close() { this.menu.set('none'); }

  pickFamily(id: string) { this.s.switchFamily(id); this.close(); this.router.navigateByUrl('/'); }
  pickMember(id: string) { this.s.switchMember(id); this.close(); this.router.navigateByUrl('/'); }
  signOut() { this.close(); this.s.signOut(); this.router.navigateByUrl('/login'); }
}
