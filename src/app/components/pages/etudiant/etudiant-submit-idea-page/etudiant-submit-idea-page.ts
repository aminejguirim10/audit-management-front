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

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faLightbulb,
  faPen,
  faAlignLeft,
  faConciergeBell,
  faTools,
  faGraduationCap,
  faEllipsisH,
  faLaptopCode,
  faBolt,
  faIndustry,
  faPaperPlane,
  faUndo,
  faTriangleExclamation
} from '@fortawesome/free-solid-svg-icons';

interface CategoryOption {
  value: CategoryIdea;
  label: string;
  icon: any;
  color: string;
}

interface DepartmentOption {
  value: Department;
  label: string;
  icon: any;
  color: string;
}

@Component({
  selector: 'app-etudiant-submit-idea-page',
  imports: [CommonModule, ReactiveFormsModule, FontAwesomeModule],
  templateUrl: './etudiant-submit-idea-page.html',
  styleUrl: './etudiant-submit-idea-page.css',
})
export class EtudiantSubmitIdeaPage {
  // Icons
  faLightbulb = faLightbulb;
  faPen = faPen;
  faAlignLeft = faAlignLeft;
  faPaperPlane = faPaperPlane;
  faUndo = faUndo;
  faTriangleExclamation = faTriangleExclamation;

  private readonly fb = inject(FormBuilder);
  private readonly ideaService = inject(StudentIdeaService);
  private readonly toastr = inject(ToastrService);

  readonly isSubmitting = signal(false);
  readonly submitted = signal(false);
  readonly focusedField = signal<string | null>(null);

  readonly categoryOptions: CategoryOption[] = [
    { value: 'SERVICES', label: 'Services', icon: faConciergeBell, color: '#3b82f6' },
    { value: 'INSTALLATIONS', label: 'Installations', icon: faTools, color: '#10b981' },
    { value: 'ACADEMIQUE', label: 'Académique', icon: faGraduationCap, color: '#f59e0b' },
    { value: 'AUTRES', label: 'Autres', icon: faEllipsisH, color: '#8b5cf6' },
  ];

  readonly departmentOptions: DepartmentOption[] = [
    { value: 'INFORMATIQUE', label: 'Informatique', icon: faLaptopCode, color: '#2563eb' },
    { value: 'ELECTRIQUE', label: 'Électrique', icon: faBolt, color: '#f59e0b' },
    { value: 'INDUS', label: 'Industriel', icon: faIndustry, color: '#64748b' },
  ];

  readonly categoryLabels = CATEGORY_LABELS;
  readonly departmentLabels = DEPARTMENT_LABELS;

  readonly ideaForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
    description: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(500)]],
    category: ['SERVICES' as CategoryIdea, Validators.required],
    department: ['INFORMATIQUE' as Department, Validators.required],
  });

  getCategoryColor(category: CategoryIdea): string {
    return this.categoryOptions.find(c => c.value === category)?.color ?? '#3b82f6';
  }

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
    if (control?.hasError('minlength'))
      return 'La description doit contenir au moins 20 caractères';
    if (control?.hasError('maxlength')) return 'La description ne peut pas dépasser 500 caractères';
    return '';
  }

  submit(): void {
    this.submitted.set(true);
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
          this.resetForm();
        },
        error: (err) => {
          const message = err.error?.message ?? 'Erreur lors de la soumission';
          this.toastr.error(message, 'Erreur');
        },
      });
  }

  resetForm(): void {
    this.ideaForm.reset({
      category: 'SERVICES',
      department: 'INFORMATIQUE',
    });
    this.submitted.set(false);
    this.focusedField.set(null);
  }
}
