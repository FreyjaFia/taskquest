import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { Store } from './store';

const auth: CanActivateFn = () => {
  const s = inject(Store);
  return s.signedIn() ? true : inject(Router).parseUrl('/login');
};
const guest: CanActivateFn = () => {
  const s = inject(Store);
  return s.signedIn() ? inject(Router).parseUrl('/') : true;
};

export const routes: Routes = [
  { path: 'login', canActivate: [guest], loadComponent: () => import('./pages/login').then(m => m.Login), title: 'Welcome | TaskQuest' },
  { path: '', pathMatch: 'full', canActivate: [auth], loadComponent: () => import('./pages/dashboard').then(m => m.Dashboard), title: 'Home | TaskQuest' },
  { path: 'tasks', canActivate: [auth], loadComponent: () => import('./pages/tasks').then(m => m.Tasks), title: 'Tasks | TaskQuest' },
  { path: 'requests', canActivate: [auth], loadComponent: () => import('./pages/requests').then(m => m.Requests), title: 'Requests | TaskQuest' },
  { path: 'rewards', canActivate: [auth], loadComponent: () => import('./pages/rewards').then(m => m.Rewards), title: 'Rewards | TaskQuest' },
  { path: 'leaderboard', canActivate: [auth], loadComponent: () => import('./pages/leaderboard').then(m => m.Leaderboard), title: 'Ranks | TaskQuest' },
  { path: 'family', canActivate: [auth], loadComponent: () => import('./pages/family').then(m => m.FamilyPage), title: 'Family | TaskQuest' },
  { path: '**', redirectTo: '' },
];
