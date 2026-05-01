import { Component, OnInit, inject, signal, computed, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs/operators';
import { AuditService } from '../../../../services/audit.service';
import { TypeAuditService } from '../../../../services/type-audit.service';
import {
  AddAuditDto,
  AuditStatus,
  AuditSummary,
  Audite,
  AuditDetails,
  Question,
  QuestionOption,
  UpdateAuditDto,
} from '../../../../models/audit.model';
import { TypeAudit } from '../../../../models/type-audit.model';

const AUDIT_STATUS_LABELS: Record<AuditStatus, string> = {
  PLANIFIE: 'Planifié',
  EN_COURS: 'En cours',
  TERMINEE: 'Terminée',
};

const AUDIT_STATUS_CLASSES: Record<AuditStatus, string> = {
  PLANIFIE: 'badge-planifie',
  EN_COURS: 'badge-encours',
  TERMINEE: 'badge-termine',
};

const DEPARTMENTS = ['INFORMATIQUE', 'ELECTRIQUE', 'INDUS'];

@Component({
  selector: 'app-auditeur-dashboard-page',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './auditeur-dashboard-page.html',
  styleUrl: './auditeur-dashboard-page.css',
})
export class AuditeurDashboardPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auditService = inject(AuditService);
  private readonly typeAuditService = inject(TypeAuditService);
  private readonly toastr = inject(ToastrService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly audits = signal<AuditSummary[]>([]);
  readonly audites = signal<Audite[]>([]);
  readonly loading = signal(false);
  readonly loadingDetails = signal(false);
  readonly filterTerm = signal('');
  readonly selectedStatus = signal<'TOUS' | AuditStatus>('TOUS');
  readonly showCreatePanel = signal(false);
  readonly selectedAudit = signal<AuditDetails | null>(null);
  readonly editingAudit = signal<AuditSummary | null>(null);
  readonly auditToDelete = signal<AuditSummary | null>(null);
  readonly typeAudits = signal<TypeAudit[]>([]);
  readonly currentStep = signal(1);
  readonly savingEdit = signal(false);
  readonly deletingAudit = signal(false);
  readonly loadingEditAudit = signal(false);

  readonly statusOptions: Array<'TOUS' | AuditStatus> = [
    'TOUS',
    'PLANIFIE',
    'EN_COURS',
    'TERMINEE',
  ];
  readonly departments = DEPARTMENTS;

  readonly auditForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    department: ['INFORMATIQUE', Validators.required],
    typeAuditId: [null as number | null, Validators.required],
    auditeId: [null as number | null, Validators.required],
    dateDebut: ['', Validators.required],
    dateFin: ['', Validators.required],
    questions: this.fb.array([]),
  });

  readonly editAuditForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    department: ['INFORMATIQUE', Validators.required],
    typeAuditId: [null as number | null, Validators.required],
    dateDebut: ['', Validators.required],
    dateFin: ['', Validators.required],
  });

  // Track questions array to force updates
  readonly questionsCount = signal(0);

  readonly stats = computed(() => ({
    total: this.audits().length,
    planned: this.audits().filter((a) => a.status === 'PLANIFIE').length,
    active: this.audits().filter((a) => a.status === 'EN_COURS').length,
    completed: this.audits().filter((a) => a.status === 'TERMINEE').length,
  }));

  readonly filteredAudits = computed(() => {
    const term = this.filterTerm().toLowerCase();
    const status = this.selectedStatus();
    return this.audits().filter((a) => {
      const statusMatch = status === 'TOUS' || a.status === status;
      const textMatch =
        !term ||
        [a.title, a.typeAuditName, a.department, a.auditeName, a.auditeurName]
          .join(' ')
          .toLowerCase()
          .includes(term);
      return statusMatch && textMatch;
    });
  });

  ngOnInit(): void {
    this.loadAudits();
    this.loadTypeAudits();
    this.loadAudites();
  }

  get questions(): FormArray {
    const qa = this.auditForm.get('questions') as FormArray;
    if (!qa) {
      throw new Error('Questions FormArray not found in auditForm');
    }
    return qa;
  }

  getQuestionOptions(index: number): FormArray {
    const q = this.questions.at(index);
    if (!q) {
      throw new Error(`Question at index ${index} not found`);
    }
    const opts = q.get('options') as FormArray;
    if (!opts) {
      throw new Error(`Options FormArray not found in question at index ${index}`);
    }
    return opts;
  }

  getOptions(index: number): FormArray {
    return this.getQuestionOptions(index);
  }

  createOption(): FormGroup {
    return this.fb.group({
      label: ['', Validators.required],
      sortOrder: [1],
    });
  }

  createQuestion(): FormGroup {
    return this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      type: ['RADIO', Validators.required],
      options: this.fb.array([this.createOption()]),
    });
  }

  addQuestion(): void {
    try {
      // Create the question
      const newQuestion = this.createQuestion();
      
      // Add to FormArray
      this.questions.push(newQuestion);
      
      // Update signal to trigger change detection
      this.questionsCount.update(c => c + 1);
      
      // Update form validity
      this.auditForm.updateValueAndValidity();
      
      // Trigger change detection
      this.cdr.markForCheck();
      
    } catch (error) {
      console.error('Error adding question:', error);
      this.toastr.error('Erreur lors de l\'ajout de la question', 'Erreur');
    }
  }

  removeQuestion(index: number): void {
    try {
      if (this.questions.length > 0 && index >= 0 && index < this.questions.length) {
        this.questions.removeAt(index);
        this.questionsCount.update(c => c - 1);
        this.auditForm.updateValueAndValidity();
      }
    } catch (error) {
      console.error('Error removing question:', error);
      this.toastr.error('Erreur lors de la suppression de la question', 'Erreur');
    }
  }

  addOption(questionIndex: number): void {
    try {
      if (questionIndex >= 0 && questionIndex < this.questions.length) {
        this.getQuestionOptions(questionIndex).push(this.createOption());
        this.questionsCount.update(c => c);
        this.auditForm.updateValueAndValidity();
      }
    } catch (error) {
      console.error('Error adding option:', error);
      this.toastr.error('Erreur lors de l\'ajout de l\'option', 'Erreur');
    }
  }

  removeOption(questionIndex: number, optionIndex: number): void {
    try {
      if (questionIndex >= 0 && questionIndex < this.questions.length) {
        const opts = this.getQuestionOptions(questionIndex);
        if (optionIndex >= 0 && optionIndex < opts.length && opts.length > 1) {
          opts.removeAt(optionIndex);
          this.questionsCount.update(c => c);
          this.auditForm.updateValueAndValidity();
        }
      }
    } catch (error) {
      console.error('Error removing option:', error);
      this.toastr.error('Erreur lors de la suppression de l\'option', 'Erreur');
    }
  }

  onQuestionTypeChange(index: number): void {
    const q = this.questions.at(index) as FormGroup;
    const type = q.get('type')?.value;
    const opts = q.get('options') as FormArray;

    if (type === 'TRUE_FALSE') {
      while (opts.length > 0) opts.removeAt(0);
    } else if (type === 'RADIO' && opts.length === 0) {
      opts.push(this.createOption());
    }
  }

  nextStep(): void {
    if (this.currentStep() < 3) {
      this.currentStep.update((s) => s + 1);
    }
  }

  previousStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.update((s) => s - 1);
    }
  }

  cancelCreation(): void {
    this.showCreatePanel.set(false);
    this.currentStep.set(1);
    this.resetForm();
  }

  toggleCreatePanel(): void {
    this.showCreatePanel.update((s) => !s);
  }

  viewAuditDetails(audit: AuditSummary): void {
    this.loadingDetails.set(true);
    this.auditService.findById(audit.id).pipe(
      finalize(() => this.loadingDetails.set(false))
    ).subscribe({
      next: (details) => {
        this.selectedAudit.set(details);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des détails', err);
        this.toastr.error('Impossible de charger les détails de l\'audit');
      }
    });
  }

  closeAuditDetails(): void {
    this.selectedAudit.set(null);
  }

  editAudit(audit: AuditSummary): void {
    this.editingAudit.set(audit);
    this.editAuditForm.reset({
      title: audit.title,
      department: audit.department,
      typeAuditId: this.findTypeAuditIdByName(audit.typeAuditName),
      dateDebut: '',
      dateFin: '',
    });

    this.loadingEditAudit.set(true);
    this.auditService.findById(audit.id).pipe(
      finalize(() => this.loadingEditAudit.set(false))
    ).subscribe({
      next: (details) => {
        this.editAuditForm.patchValue({
          title: details.title,
          department: details.department,
          typeAuditId: this.findTypeAuditIdByName(details.typeAuditName),
          dateDebut: details.dateDebut,
          dateFin: details.dateFin,
        });
      },
      error: (err) => {
        console.error('Erreur lors du chargement pour modification', err);
        this.toastr.error('Impossible de préremplir les champs de cet audit');
      }
    });
  }

  cancelEditAudit(): void {
    this.editingAudit.set(null);
    this.editAuditForm.reset();
  }

  saveAuditChanges(): void {
    if (!this.editingAudit() || this.editAuditForm.invalid) {
      return;
    }

    this.savingEdit.set(true);
    const auditId = this.editingAudit()!.id;
    const updateDto: UpdateAuditDto = {
      auditId,
      title: this.editAuditForm.get('title')?.value ?? '',
      typeAuditId: Number(this.editAuditForm.get('typeAuditId')?.value ?? 0),
      department: this.editAuditForm.get('department')?.value ?? '',
      dateDebut: this.editAuditForm.get('dateDebut')?.value ?? '',
      dateFin: this.editAuditForm.get('dateFin')?.value ?? '',
    };

    this.auditService.update(updateDto).pipe(
      finalize(() => this.savingEdit.set(false))
    ).subscribe({
      next: () => {
        this.toastr.success('Audit modifié avec succès');
        this.editingAudit.set(null);
        this.editAuditForm.reset();
        this.loadAudits();
      },
      error: (err) => {
        console.error('Erreur lors de la modification', err);
        this.toastr.error(err.error?.message || 'Erreur lors de la modification de l\'audit');
      }
    });
  }

  confirmDeleteAudit(audit: AuditSummary): void {
    this.auditToDelete.set(audit);
  }

  cancelDelete(): void {
    this.auditToDelete.set(null);
  }

  deleteAudit(): void {
    if (!this.auditToDelete()) {
      return;
    }

    this.deletingAudit.set(true);
    const auditId = this.auditToDelete()!.id;

    this.auditService.delete(auditId).pipe(
      finalize(() => this.deletingAudit.set(false))
    ).subscribe({
      next: () => {
        this.toastr.success('Audit supprimé avec succès');
        this.auditToDelete.set(null);
        this.loadAudits();
      },
      error: (err) => {
        console.error('Erreur lors de la suppression', err);
        this.toastr.error(err.error?.message || 'Erreur lors de la suppression de l\'audit');
      }
    });
  }

  getQuestionResponseLabel(question: Question): string {
    const selectedOption = question.options.find((opt: QuestionOption) => opt.id === question.optionChoisieId);
    return selectedOption ? selectedOption.label : 'Non répondu';
  }

  getSelectedOptionId(question: Question): number | null {
    return question.optionChoisieId ?? question.selectedOptionId ?? null;
  }

  getAuditScorePercentage(audit: AuditDetails | null): number {
    if (!audit || !audit.questions?.length) {
      return 0;
    }

    return Math.round((audit.scoreTotal / audit.questions.length) * 100);
  }

  resetForm(): void {
    this.auditForm.reset({
      title: '',
      department: 'INFORMATIQUE',
      typeAuditId: null,
      auditeId: null,
      dateDebut: '',
      dateFin: '',
    });
    const qArray = this.auditForm.get('questions') as FormArray;
    qArray.clear();
  }

  submitAudit(): void {
    if (this.auditForm.invalid || this.questions.length === 0) {
      this.toastr.warning('Remplissez tous les champs requis', 'Attention');
      return;
    }

    const val = this.auditForm.getRawValue();
    const dto: AddAuditDto = {
      title: val.title ?? '',
      department: val.department ?? 'INFORMATIQUE',
      typeAuditId: Number(val.typeAuditId),
      auditeId: Number(val.auditeId),
      dateDebut: val.dateDebut ?? '',
      dateFin: val.dateFin ?? '',
      questions: (val.questions ?? []).map((q: any) => ({
        title: q.title ?? '',
        type: q.type ?? 'RADIO',
        options: q.type === 'RADIO' ? (q.options ?? []) : [],
      })),
    };

    this.auditService.add(dto).subscribe({
      next: () => {
        this.toastr.success('Audit créé avec succès', 'Succès');
        this.resetForm();
        this.loadAudits();
        this.cancelCreation();
      },
      error: (err) => {
        const message = err.error?.message ?? 'Erreur lors de la création de l\'audit';
        this.toastr.error(message, 'Erreur');
      },
    });
  }

  onSearchInput(e: Event): void {
    const v = (e.target as HTMLInputElement).value;
    this.filterTerm.set(v);
  }

  loadAudits(): void {
    this.loading.set(true);
    this.auditService
      .findAll()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (a) => this.audits.set(a),
        error: () => this.toastr.error('Erreur charg audits', 'Erreur'),
      });
  }

  loadTypeAudits(): void {
    this.typeAuditService.findAll().subscribe({
      next: (t) => this.typeAudits.set(t),
      error: () => this.toastr.warning('Erreur types audit', 'Attention'),
    });
  }

  loadAudites(): void {
    this.auditService.findAllAudites().subscribe({
      next: (a) => this.audites.set(a),
      error: () => this.toastr.warning('Erreur chargement audites', 'Attention'),
    });
  }

  getStatusLabel(status: AuditStatus): string {
    return AUDIT_STATUS_LABELS[status] || status;
  }

  getStatusClass(status: AuditStatus): string {
    return AUDIT_STATUS_CLASSES[status] || '';
  }

  getTypeAuditName(id: number | null | undefined): string {
    if (!id) return 'Non défini';
    const t = this.typeAudits().find((x) => x.id === id);
    return t?.name || 'Non défini';
  }

  trackByAudit(_: number, a: AuditSummary): number {
    return a.id;
  }

  trackByIndex(i: number): number {
    return i;
  }

  private findTypeAuditIdByName(typeAuditName: string | null | undefined): number | null {
    if (!typeAuditName) {
      return null;
    }

    const matchedType = this.typeAudits().find(
      (type) => type.name.trim().toLowerCase() === typeAuditName.trim().toLowerCase()
    );

    return matchedType?.id ?? null;
  }
}
