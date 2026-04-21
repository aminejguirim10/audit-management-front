import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs/operators';
import { StudentIdeaService } from '../../../../services/student-idea.service';
import {
  AddIdeaDto,
  CategoryIdea,
  Department,
  CATEGORY_LABELS,
  DEPARTMENT_LABELS,
} from '../../../../models/student-idea.model';

@Component({
  selector: 'app-etudiant-submit-idea-page',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './etudiant-submit-idea-page.html',
  styleUrl: './etudiant-submit-idea-page.css',
})
export class EtudiantSubmitIdeaPage {
  private readonly fb = inject(FormBuilder);
  private readonly ideaService = inject(StudentIdeaService);
  private readonly toastr = inject(ToastrService);

  readonly isSubmitting = signal(false);

  readonly categories: CategoryIdea[] = ['SERVICES', 'INSTALLATIONS', 'ACADEMIQUE', 'AUTRES'];
  readonly departments: Department[] = ['INFORMATIQUE', 'ELECTRIQUE', 'INDUS'];

  readonly categoryLabels = CATEGORY_LABELS;
  readonly departmentLabels = DEPARTMENT_LABELS;

  readonly ideaForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
    description: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(500)]],
    category: ['SERVICES' as CategoryIdea, Validators.required],
    department: ['INFORMATIQUE' as Department, Validators.required],
  });

  get titleError(): string {
    const control = this.ideaForm.get('title');
    if (control?.hasError('required')) return 'Le titre est requis';
    if (control?.hasError('minlength')) return 'Le titre doit contenir au moins 5 caractères';
    if (control?.hasError('maxlength')) return 'Le titre ne peut pas dépasser 100 caractères';
    return '';
  }

  get descriptionError(): string {
    const control = this.ideaForm.get('description');
    if (control?.hasError('required')) return 'La description est requise';
    if (control?.hasError('minlength')) return 'La description doit contenir au moins 20 caractères';
    if (control?.hasError('maxlength')) return 'La description ne peut pas dépasser 500 caractères';
    return '';
  }

  submit(): void {
    if (this.ideaForm.invalid) {
      this.ideaForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    const dto: AddIdeaDto = {
      title: this.ideaForm.getRawValue().title,
      description: this.ideaForm.getRawValue().description,
      category: this.ideaForm.getRawValue().category,
      department: this.ideaForm.getRawValue().department,
    };

    this.ideaService
      .add(dto)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.toastr.success('Idée soumise avec succès ! 🎉', 'Succès');
          this.ideaForm.reset({
            category: 'SERVICES',
            department: 'INFORMATIQUE',
          });
        },
        error: (err) => {
          const message = err.error?.message ?? 'Erreur lors de la soumission';
          this.toastr.error(message, 'Erreur');
        },
      });
  }
}
