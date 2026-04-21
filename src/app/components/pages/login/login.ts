import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toastr = inject(ToastrService);

  readonly isSubmitting = signal(false);
  readonly showPassword = signal(false);

  readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  constructor() {
    if (this.authService.isAuthenticated()) {
      const roleHome = this.authService.getDefaultRouteForCurrentRole() ?? '/login';
      void this.router.navigateByUrl(roleHome);
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((currentState) => !currentState);
  }

  submit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    this.authService
      .login(this.loginForm.getRawValue())
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (response) => {
          this.toastr.success(response.message || 'Connexion reussie', 'Succes');

          const returnUrl =
            this.route.snapshot.queryParamMap.get('returnUrl') ||
            this.authService.getDefaultRouteForCurrentRole() ||
            '/login';
          void this.router.navigateByUrl(returnUrl);
        },
        error: (httpError) => {
          const errorMessage =
            httpError?.error?.message ||
            'Impossible de se connecter pour le moment. Veuillez reessayer.';
          this.toastr.error(errorMessage, 'Connexion echouee');
        },
      });
  }

  get emailControl() {
    return this.loginForm.controls.email;
  }

  get passwordControl() {
    return this.loginForm.controls.password;
  }
}
