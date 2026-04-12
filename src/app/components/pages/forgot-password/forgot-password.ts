import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toastr = inject(ToastrService);

  readonly isSubmitting = signal(false);

  readonly forgotForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  submit(): void {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    this.authService
      .forgotPassword(this.forgotForm.getRawValue())
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (response) => {
          this.toastr.success(
            response.message || 'Un lien de reinitialisation a ete envoye a votre email.',
            'Email envoye',
          );
          void this.router.navigateByUrl('/login');
        },
        error: (httpError) => {
          const errorMessage =
            httpError?.error?.message ||
            "Echec de l'envoi de l'email de reinitialisation. Veuillez reessayer.";
          this.toastr.error(errorMessage, 'Erreur');
        },
      });
  }

  get emailControl() {
    return this.forgotForm.controls.email;
  }
}
