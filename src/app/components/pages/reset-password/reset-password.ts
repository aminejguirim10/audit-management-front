import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-reset-password',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css',
})
export class ResetPassword {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toastr = inject(ToastrService);

  readonly isSubmitting = signal(false);
  readonly token = signal<string>(this.route.snapshot.queryParamMap.get('token') ?? '');

  readonly resetForm = this.fb.nonNullable.group({
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required, Validators.minLength(8)]],
  });

  submit(): void {
    if (!this.token()) {
      this.toastr.error('Le lien est invalide ou incomplet.', 'Token manquant');
      return;
    }

    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    const payload = this.resetForm.getRawValue();
    if (payload.newPassword !== payload.confirmPassword) {
      this.toastr.error('Les mots de passe ne correspondent pas.', 'Verification');
      return;
    }

    this.isSubmitting.set(true);

    this.authService
      .resetPassword({
        token: this.token(),
        newPassword: payload.newPassword,
        confirmPassword: payload.confirmPassword,
      })
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (response) => {
          this.toastr.success(
            response.message || 'Mot de passe reinitialise avec succes.',
            'Succes',
          );
          void this.router.navigateByUrl('/login');
        },
        error: (httpError) => {
          const errorMessage =
            httpError?.error?.message ||
            'Echec de la reinitialisation du mot de passe. Veuillez reessayer.';
          this.toastr.error(errorMessage, 'Erreur');
        },
      });
  }

  get newPasswordControl() {
    return this.resetForm.controls.newPassword;
  }

  get confirmPasswordControl() {
    return this.resetForm.controls.confirmPassword;
  }
}
