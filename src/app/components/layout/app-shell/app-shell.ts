import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { UserRole } from '../../../models/auth.model';
import { AuthService } from '../../../services/auth.service';

interface NavigationItem {
  label: string;
  route: string;
  shortLabel: string;
}

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administration',
  AUDITEUR: 'Auditeur',
  AUDITE: 'Chef de departement',
  ETUDIANT: 'Etudiant',
};

const NAVIGATION_BY_ROLE: Record<UserRole, NavigationItem[]> = {
  ADMIN: [
    { label: 'Tableau de bord', route: '/admin/tableau-de-bord', shortLabel: 'TB' },
    { label: "Types d'audits", route: '/admin/types-audits', shortLabel: 'TA' },
    { label: 'Audits', route: '/admin/audits', shortLabel: 'AU' },
    {
      label: 'Chefs de departements',
      route: '/admin/chefs-departements',
      shortLabel: 'CD',
    },
    { label: 'Auditeurs', route: '/admin/auditeurs', shortLabel: 'AR' },
    { label: 'Etudiants', route: '/admin/etudiants', shortLabel: 'ET' },
  ],
  AUDITEUR: [
    { label: 'Tableau de bord', route: '/auditeur/tableau-de-bord', shortLabel: 'TB' },
    { label: 'Historique', route: '/auditeur/historique', shortLabel: 'HI' },
    {
      label: 'Idees des etudiants',
      route: '/auditeur/idees-etudiants',
      shortLabel: 'ID',
    },
    { label: 'Parametres', route: '/auditeur/parametres', shortLabel: 'PA' },
  ],
  AUDITE: [
    { label: 'Tableau de bord', route: '/audite/tableau-de-bord', shortLabel: 'TB' },
    {
      label: 'Actions correctives',
      route: '/audite/actions-correctives',
      shortLabel: 'AC',
    },
    { label: 'Parametres', route: '/audite/parametres', shortLabel: 'PA' },
  ],
  ETUDIANT: [
    { label: 'Tableau de bord', route: '/etudiant/tableau-de-bord', shortLabel: 'TB' },
    {
      label: 'Soumettre une idee',
      route: '/etudiant/soumettre-idee',
      shortLabel: 'SI',
    },
    { label: 'Mes idees', route: '/etudiant/mes-idees', shortLabel: 'MI' },
  ],
};

@Component({
  selector: 'app-shell',
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.css',
})
export class AppShell {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly user = this.authService.user;
  readonly sidebarOpen = signal(false);

  readonly currentRole = computed(() => this.user()?.role ?? null);

  readonly roleLabel = computed(() => {
    const role = this.currentRole();
    return role ? ROLE_LABELS[role] : 'Utilisateur';
  });

  readonly email = computed(() => this.user()?.email ?? 'compte@auditpro.local');

  readonly displayName = computed(() => {
    const localPart = this.email().split('@')[0]?.trim();
    if (!localPart) {
      return this.roleLabel();
    }

    const words = localPart
      .replace(/[._-]+/g, ' ')
      .split(' ')
      .map((word) => word.trim())
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());

    return words.length > 0 ? words.join(' ') : this.roleLabel();
  });

  readonly initials = computed(() => {
    const words = this.displayName().split(' ').filter(Boolean);
    if (words.length === 0) {
      return 'AU';
    }

    if (words.length === 1) {
      return words[0].slice(0, 2).toUpperCase();
    }

    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  });

  readonly navigationItems = computed(() => {
    const role = this.currentRole();
    return role ? NAVIGATION_BY_ROLE[role] : [];
  });

  readonly showNotificationButton = computed(() => {
    const role = this.currentRole();
    return role === 'AUDITEUR' || role === 'AUDITE';
  });

  toggleSidebar(): void {
    this.sidebarOpen.update((isOpen) => !isOpen);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  onNavigate(): void {
    this.closeSidebar();
  }

  logout(): void {
    this.authService.logout();
    this.closeSidebar();
    void this.router.navigate(['/login']);
  }
}
