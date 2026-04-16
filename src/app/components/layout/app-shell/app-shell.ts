import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { UserRole } from '../../../models/auth.model';
import { NotificationResponse } from '../../../models/notification.model';
import { AuthService } from '../../../services/auth.service';
import { NotificationService } from '../../../services/notification.service';
import { RealtimeMessagingService } from '../../../services/realtime-messaging.service';
import { Subscription } from 'rxjs';

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
export class AppShell implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly realtimeMessagingService = inject(RealtimeMessagingService);
  private readonly router = inject(Router);
  private readonly subscriptions = new Subscription();

  readonly user = this.authService.user;
  readonly sidebarOpen = signal(false);
  readonly notificationPanelOpen = signal(false);
  readonly notificationPanelLoading = signal(false);
  readonly notificationPanelError = signal('');
  readonly notifications = signal<NotificationResponse[]>([]);
  readonly unreadNotificationsCount = signal(0);
  readonly unreadNotificationsCaption = computed(() =>
    this.unreadNotificationsCount() > 1 ? 'non lues' : 'non lue',
  );
  private hasHydratedNotifications = false;
  private isHydratingNotifications = false;

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

  ngOnInit(): void {
    if (!this.showNotificationButton()) {
      return;
    }

    this.notifications.set(this.notificationService.getCachedNotifications());
    this.unreadNotificationsCount.set(this.notificationService.getCachedUnreadCount());
    this.hydrateNotificationsOnStartup();

    this.realtimeMessagingService.connect();

    this.subscriptions.add(
      this.realtimeMessagingService.notification$.subscribe((incoming) => {
        this.notificationService.syncRealtimeNotification(incoming);
        this.notifications.set(this.notificationService.getCachedNotifications());
        this.unreadNotificationsCount.set(this.notificationService.getCachedUnreadCount());
      }),
    );

    this.subscriptions.add(
      this.realtimeMessagingService.unreadCount$.subscribe((count) => {
        this.notificationService.syncRealtimeUnreadCount(count);
        this.unreadNotificationsCount.set(this.notificationService.getCachedUnreadCount());
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.realtimeMessagingService.disconnect();
  }

  toggleSidebar(): void {
    this.sidebarOpen.update((isOpen) => !isOpen);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  onNavigate(): void {
    this.closeSidebar();
    this.notificationPanelOpen.set(false);
  }

  toggleNotificationsPanel(): void {
    if (!this.showNotificationButton()) {
      return;
    }

    this.notificationPanelOpen.update((isOpen) => !isOpen);
    this.notificationPanelError.set('');

    if (
      this.notificationPanelOpen() &&
      !this.hasHydratedNotifications &&
      !this.isHydratingNotifications
    ) {
      this.loadNotifications();
    }
  }

  openNotification(notification: NotificationResponse): void {
    const routePrefix = this.currentRole() === 'AUDITE' ? '/audite/messages' : '/auditeur/messages';
    const routeTarget =
      notification.auditId && notification.auditId > 0
        ? [routePrefix, notification.auditId]
        : [routePrefix.replace('/messages', '/tableau-de-bord')];

    if (!notification.isRead) {
      this.notifications.set(
        this.notifications().map((item) =>
          item.id === notification.id ? { ...item, isRead: true } : item,
        ),
      );
      this.unreadNotificationsCount.update((current) => Math.max(0, current - 1));

      this.subscriptions.add(
        this.notificationService.markAsRead(notification.id).subscribe({
          next: () => {
            this.notifications.set(this.notificationService.getCachedNotifications());
            this.unreadNotificationsCount.set(this.notificationService.getCachedUnreadCount());
          },
          error: () => {
            this.notificationPanelError.set('Impossible de synchroniser la notification.');
          },
        }),
      );
    }

    this.notificationPanelOpen.set(false);
    void this.router.navigate(routeTarget);
  }

  formatNotificationDate(value: string | null | undefined): string {
    if (!value) {
      return '--';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    const hasMeaningfulTime =
      date.getHours() !== 0 || date.getMinutes() !== 0 || date.getSeconds() !== 0;

    if (!hasMeaningfulTime) {
      return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(date);
    }

    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  trackByNotificationId(_: number, item: NotificationResponse): number {
    return item.id;
  }

  private loadNotifications(): void {
    this.notificationPanelLoading.set(true);
    this.notificationPanelError.set('');

    this.subscriptions.add(
      this.notificationService.getMyNotifications().subscribe({
        next: (notifications) => {
          this.notifications.set(notifications);
          this.unreadNotificationsCount.set(this.notificationService.getCachedUnreadCount());
          this.notificationPanelLoading.set(false);
          this.hasHydratedNotifications = true;
        },
        error: () => {
          this.notificationPanelError.set('Impossible de charger les notifications.');
          this.notificationPanelLoading.set(false);
        },
      }),
    );
  }

  private hydrateNotificationsOnStartup(): void {
    if (this.hasHydratedNotifications || this.isHydratingNotifications) {
      return;
    }

    if (this.notificationService.hasCachedNotifications()) {
      this.hasHydratedNotifications = true;
      return;
    }

    this.isHydratingNotifications = true;

    this.subscriptions.add(
      this.notificationService.getMyNotifications().subscribe({
        next: (notifications) => {
          this.notifications.set(notifications);
          this.unreadNotificationsCount.set(this.notificationService.getCachedUnreadCount());
          this.hasHydratedNotifications = true;
          this.isHydratingNotifications = false;
        },
        error: () => {
          this.isHydratingNotifications = false;
          this.loadUnreadNotificationsCount();
        },
      }),
    );
  }

  private loadUnreadNotificationsCount(): void {
    this.subscriptions.add(
      this.notificationService.getUnreadCount().subscribe({
        next: (count) => {
          this.unreadNotificationsCount.set(Math.max(0, count));
        },
      }),
    );
  }

  logout(): void {
    this.authService.logout();
    this.closeSidebar();
    this.notificationPanelOpen.set(false);
    void this.router.navigate(['/login']);
  }
}
