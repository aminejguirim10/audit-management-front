import { Routes } from '@angular/router';

import { ForgotPassword } from './components/pages/forgot-password/forgot-password';
import { ResetPassword } from './components/pages/reset-password/reset-password';
import { AppShell } from './components/layout/app-shell/app-shell';
import { AdminAuditTypesPage } from './components/pages/admin/admin-audit-types-page/admin-audit-types-page';
import { AdminAuditorsPage } from './components/pages/admin/admin-auditors-page/admin-auditors-page';
import { AdminAuditsPage } from './components/pages/admin/admin-audits-page/admin-audits-page';
import { AdminDashboardPage } from './components/pages/admin/admin-dashboard-page/admin-dashboard-page';
import { AdminDepartmentsPage } from './components/pages/admin/admin-departments-page/admin-departments-page';
import { AdminStudentsPage } from './components/pages/admin/admin-students-page/admin-students-page';
import { AuditeCorrectiveActionsPage } from './components/pages/audite/audite-corrective-actions-page/audite-corrective-actions-page';
import { AuditeDashboardPage } from './components/pages/audite/audite-dashboard-page/audite-dashboard-page';
import { AuditeSettingsPage } from './components/pages/audite/audite-settings-page/audite-settings-page';
import { AuditeurDashboardPage } from './components/pages/auditeur/auditeur-dashboard-page/auditeur-dashboard-page';
import { AuditeurHistoryPage } from './components/pages/auditeur/auditeur-history-page/auditeur-history-page';
import { AuditeurSettingsPage } from './components/pages/auditeur/auditeur-settings-page/auditeur-settings-page';
import { AuditeurStudentIdeasPage } from './components/pages/auditeur/auditeur-student-ideas-page/auditeur-student-ideas-page';
import { EtudiantMyIdeasPage } from './components/pages/etudiant/etudiant-my-ideas-page/etudiant-my-ideas-page';
import { EtudiantSubmitIdeaPage } from './components/pages/etudiant/etudiant-submit-idea-page/etudiant-submit-idea-page';
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
    component: AdminDashboardPage,
  },
  {
    path: 'types-audits',
    component: AdminAuditTypesPage,
  },
  {
    path: 'audits',
    component: AdminAuditsPage,
  },
  {
    path: 'chefs-departements',
    component: AdminDepartmentsPage,
  },
  {
    path: 'auditeurs',
    component: AdminAuditorsPage,
  },
  {
    path: 'etudiants',
    component: AdminStudentsPage,
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
    component: AuditeurDashboardPage,
  },
  {
    path: 'historique',
    component: AuditeurHistoryPage,
  },
  {
    path: 'idees-etudiants',
    component: AuditeurStudentIdeasPage,
  },
  {
    path: 'parametres',
    component: AuditeurSettingsPage,
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
    component: AuditeDashboardPage,
  },
  {
    path: 'actions-correctives',
    component: AuditeCorrectiveActionsPage,
  },
  {
    path: 'parametres',
    component: AuditeSettingsPage,
  },
];

const etudiantChildRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'soumettre-idee',
  },
  {
    path: 'soumettre-idee',
    component: EtudiantSubmitIdeaPage,
  },
  {
    path: 'mes-idees',
    component: EtudiantMyIdeasPage,
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
