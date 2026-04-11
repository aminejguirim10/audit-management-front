import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  imports: [],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly currentUser = this.authService.user;
  readonly currentYear = computed(() => new Date().getFullYear());
  readonly expectedRoles = computed<string[]>(
    () => (this.route.snapshot.data['roles'] as string[] | undefined) ?? ['AUTHENTIFIE'],
  );

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
