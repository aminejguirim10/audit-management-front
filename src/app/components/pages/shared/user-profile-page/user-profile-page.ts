import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Subscription, from } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { UpdateUserProfileRequest, UserProfile } from '../../../../models/auth.model';
import { AuthService } from '../../../../services/auth.service';
import { SupabaseStorageService } from '../../../../services/supabase-storage.service';
import { UserProfileService } from '../../../../services/user-profile.service';

const PROFILE_IMAGE_MAX_SIZE_BYTES = 3 * 1024 * 1024;

@Component({
  selector: 'app-user-profile-page',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-profile-page.html',
  styleUrl: './user-profile-page.css',
})
export class UserProfilePage implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly profileService = inject(UserProfileService);
  private readonly supabaseStorageService = inject(SupabaseStorageService);
  private readonly authService = inject(AuthService);
  private readonly toastr = inject(ToastrService);
  private readonly subscriptions = new Subscription();

  readonly user = this.authService.user;
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly isUploadingPhoto = signal(false);
  readonly fileError = signal('');
  readonly currentPhotoUrl = signal<string | null>(null);
  readonly isBusy = computed(() => this.isLoading() || this.isSaving() || this.isUploadingPhoto());

  readonly profileForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
    phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{8}$/)]],
  });

  ngOnInit(): void {
    this.loadProfile();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  onSelectPhoto(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.item(0);
    if (!file) {
      return;
    }

    this.fileError.set('');

    if (!file.type.startsWith('image/')) {
      this.fileError.set('Veuillez selectionner un fichier image valide.');
      input.value = '';
      return;
    }

    if (file.size > PROFILE_IMAGE_MAX_SIZE_BYTES) {
      this.fileError.set('La taille maximale autorisee est de 3 Mo.');
      input.value = '';
      return;
    }

    const userId = this.user()?.id;
    if (!userId) {
      this.fileError.set('Impossible de televerser la photo sans identifiant utilisateur.');
      input.value = '';
      return;
    }

    this.isUploadingPhoto.set(true);

    this.subscriptions.add(
      from(this.supabaseStorageService.uploadUserProfilePhoto(userId, file))
        .pipe(
          finalize(() => {
            this.isUploadingPhoto.set(false);
            input.value = '';
          }),
        )
        .subscribe({
          next: (photoUrl) => {
            this.currentPhotoUrl.set(photoUrl);
            this.toastr.success('Photo importee avec succes.', 'Succes');
          },
          error: (error: unknown) => {
            const message = this.resolveErrorMessage(
              error,
              'Impossible de televerser la photo pour le moment.',
            );
            this.fileError.set(message);
            this.toastr.error(message, 'Upload echoue');
          },
        }),
    );
  }

  removePhoto(): void {
    this.currentPhotoUrl.set(null);
    this.fileError.set('');
  }

  save(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const payload: UpdateUserProfileRequest = {
      name: this.profileForm.controls.name.value.trim(),
      phoneNumber: this.profileForm.controls.phoneNumber.value.trim(),
      profilePhotoUrl: this.currentPhotoUrl() ?? '',
    };

    this.isSaving.set(true);

    this.subscriptions.add(
      this.profileService
        .updateMyProfile(payload)
        .pipe(finalize(() => this.isSaving.set(false)))
        .subscribe({
          next: (profile) => {
            this.applyProfile(profile);
            this.authService.syncUserProfile(profile);
            this.toastr.success('Profil mis a jour avec succes.', 'Succes');
          },
          error: (httpError: unknown) => {
            const message = this.resolveErrorMessage(
              httpError,
              'Impossible de mettre a jour le profil.',
            );
            this.toastr.error(message, 'Mise a jour echouee');
          },
        }),
    );
  }

  previewInitials(): string {
    const source =
      this.profileForm.controls.name.value.trim() ||
      this.user()?.name?.trim() ||
      this.user()?.email ||
      'Utilisateur';

    const words = source.split(' ').filter(Boolean);
    if (words.length === 0) {
      return 'AU';
    }

    if (words.length === 1) {
      return words[0].slice(0, 2).toUpperCase();
    }

    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }

  get nameControl() {
    return this.profileForm.controls.name;
  }

  get phoneNumberControl() {
    return this.profileForm.controls.phoneNumber;
  }

  private loadProfile(): void {
    this.isLoading.set(true);

    this.subscriptions.add(
      this.profileService
        .getMyProfile()
        .pipe(finalize(() => this.isLoading.set(false)))
        .subscribe({
          next: (profile) => {
            this.applyProfile(profile);
            this.authService.syncUserProfile(profile);
          },
          error: (httpError: unknown) => {
            const message = this.resolveErrorMessage(
              httpError,
              'Impossible de charger les informations du profil.',
            );
            this.toastr.error(message, 'Chargement echoue');
          },
        }),
    );
  }

  private applyProfile(profile: UserProfile): void {
    this.profileForm.setValue({
      name: profile.name ?? '',
      phoneNumber: profile.phoneNumber ?? '',
    });
    this.currentPhotoUrl.set(profile.profilePhotoUrl);
    this.fileError.set('');
  }

  private resolveErrorMessage(error: unknown, fallbackMessage: string): string {
    if (typeof error === 'object' && error !== null && 'error' in error) {
      const innerError = (error as { error?: { message?: string } }).error;
      if (innerError?.message) {
        return innerError.message;
      }
    }

    if (error instanceof Error && error.message) {
      return error.message;
    }

    return fallbackMessage;
  }
}
