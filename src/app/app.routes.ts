import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Dashboard } from './components/dashboard/dashboard';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login',
  },
  {
    path: 'login',
    component: Login,
  },
  {
    path: 'dashboard',
    component: Dashboard,
    canActivate: [authGuard],
  },
  {
    path: 'dashboard/admin',
    component: Dashboard,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'] },
  },
  {
    path: 'dashboard/auditeur',
    component: Dashboard,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['AUDITEUR'] },
  },
  {
    path: 'dashboard/audite',
    component: Dashboard,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['AUDITE'] },
  },
  {
    path: 'dashboard/etudiant',
    component: Dashboard,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ETUDIANT'] },
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
