import { Routes } from '@angular/router';

import { ForgotPassword } from './components/pages/forgot-password/forgot-password';
import { ResetPassword } from './components/pages/reset-password/reset-password';
import { AppShell } from './components/layout/app-shell/app-shell';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';
import { Login } from './components/pages/login/login';

const adminChildRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'tableau-de-bord',
  },
  {
    path: 'tableau-de-bord',
    loadComponent: () =>
      import('./components/pages/admin/admin-dashboard-page/admin-dashboard-page').then(
        (m) => m.AdminDashboardPage,
      ),
  },
  {
    path: 'types-audits',
    loadComponent: () =>
      import('./components/pages/admin/admin-audit-types-page/admin-audit-types-page').then(
        (m) => m.AdminAuditTypesPage,
      ),
  },
  {
    path: 'audits',
    loadComponent: () =>
      import('./components/pages/admin/admin-audits-page/admin-audits-page').then(
        (m) => m.AdminAuditsPage,
      ),
  },
  {
    path: 'chefs-departements',
    loadComponent: () =>
      import('./components/pages/admin/admin-departments-page/admin-departments-page').then(
        (m) => m.AdminDepartmentsPage,
      ),
  },
  {
    path: 'auditeurs',
    loadComponent: () =>
      import('./components/pages/admin/admin-auditors-page/admin-auditors-page').then(
        (m) => m.AdminAuditorsPage,
      ),
  },
  {
    path: 'etudiants',
    loadComponent: () =>
      import('./components/pages/admin/admin-students-page/admin-students-page').then(
        (m) => m.AdminStudentsPage,
      ),
  },
];

const auditeurChildRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'tableau-de-bord',
  },
  {
    path: 'tableau-de-bord',
    loadComponent: () =>
      import('./components/pages/auditeur/auditeur-dashboard-page/auditeur-dashboard-page').then(
        (m) => m.AuditeurDashboardPage,
      ),
  },
  {
    path: 'historique',
    loadComponent: () =>
      import('./components/pages/auditeur/auditeur-history-page/auditeur-history-page').then(
        (m) => m.AuditeurHistoryPage,
      ),
  },
  {
    path: 'idees-etudiants',
    loadComponent: () =>
      import('./components/pages/auditeur/auditeur-student-ideas-page/auditeur-student-ideas-page').then(
        (m) => m.AuditeurStudentIdeasPage,
      ),
  },
  {
    path: 'parametres',
    loadComponent: () =>
      import('./components/pages/auditeur/auditeur-settings-page/auditeur-settings-page').then(
        (m) => m.AuditeurSettingsPage,
      ),
  },
];

const auditeChildRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'tableau-de-bord',
  },
  {
    path: 'tableau-de-bord',
    loadComponent: () =>
      import('./components/pages/audite/audite-dashboard-page/audite-dashboard-page').then(
        (m) => m.AuditeDashboardPage,
      ),
  },
  {
    path: 'actions-correctives',
    loadComponent: () =>
      import('./components/pages/audite/audite-corrective-actions-page/audite-corrective-actions-page').then(
        (m) => m.AuditeCorrectiveActionsPage,
      ),
  },
  {
    path: 'parametres',
    loadComponent: () =>
      import('./components/pages/audite/audite-settings-page/audite-settings-page').then(
        (m) => m.AuditeSettingsPage,
      ),
  },
];

const etudiantChildRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'tableau-de-bord',
  },
  {
    path: 'tableau-de-bord',
    loadComponent: () =>
      import('./components/pages/etudiant/etudiant-dashboard-page/etudiant-dashboard-page').then(
        (m) => m.EtudiantDashboardPage,
      ),
  },
  {
    path: 'soumettre-idee',
    loadComponent: () =>
      import('./components/pages/etudiant/etudiant-submit-idea-page/etudiant-submit-idea-page').then(
        (m) => m.EtudiantSubmitIdeaPage,
      ),
  },
  {
    path: 'mes-idees',
    loadComponent: () =>
      import('./components/pages/etudiant/etudiant-my-ideas-page/etudiant-my-ideas-page').then(
        (m) => m.EtudiantMyIdeasPage,
      ),
  },
];

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
    path: 'forgot-password',
    component: ForgotPassword,
  },
  {
    path: 'reset-password',
    component: ResetPassword,
  },
  {
    path: 'admin',
    component: AppShell,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'] },
    children: adminChildRoutes,
  },
  {
    path: 'auditeur',
    component: AppShell,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['AUDITEUR'] },
    children: auditeurChildRoutes,
  },
  {
    path: 'audite',
    component: AppShell,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['AUDITE'] },
    children: auditeChildRoutes,
  },
  {
    path: 'etudiant',
    component: AppShell,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ETUDIANT'] },
    children: etudiantChildRoutes,
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
