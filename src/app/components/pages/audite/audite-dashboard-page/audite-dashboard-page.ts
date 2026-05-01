import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { from, of } from 'rxjs';
import { catchError, concatMap, finalize, map, toArray } from 'rxjs/operators';
import { AuditDetails, AuditStatus, AuditSummary, Question, QuestionOption } from '../../../../models/audit.model';
import { AddReponseDto, UpdateReponseDto } from '../../../../models/reponse.model';
import { AuditService } from '../../../../services/audit.service';
import { ReponseService } from '../../../../services/reponse.service';
import { AuditReportComponent } from '../../../shared/audit-report/audit-report.component';


const AUDIT_STATUS_LABELS: Record<AuditStatus, string> = {
  PLANIFIE: 'Planifie',
  EN_COURS: 'En cours',
  TERMINEE: 'Termine',
};

const AUDIT_STATUS_CLASSES: Record<AuditStatus, string> = {
  PLANIFIE: 'status-planifie',
  EN_COURS: 'status-encours',
  TERMINEE: 'status-termine',
};

interface DraftSelection {
  optionId: number;
}

type SubmitResult = true | { error: unknown; questionId: number };


@Component({
  selector: 'app-audite-dashboard-page',
  imports: [CommonModule, AuditReportComponent],
  templateUrl: './audite-dashboard-page.html',
  styleUrl: './audite-dashboard-page.css',
})
export class AuditeDashboardPage implements OnInit {
  private readonly auditService = inject(AuditService);
  private readonly reponseService = inject(ReponseService);
  private readonly toastr = inject(ToastrService);
  private readonly router = inject(Router);

  readonly audits = signal<AuditSummary[]>([]);
  readonly selectedAuditSummary = signal<AuditSummary | null>(null);
  readonly selectedAuditDetails = signal<AuditDetails | null>(null);
  readonly reportAudit = signal<AuditDetails | null>(null);
  readonly showAuditWorkspace = signal(false);
  readonly loading = signal(false);
  readonly loadingDetails = signal(false);
  readonly submittingAnswers = signal(false);
  readonly searchTerm = signal('');
  readonly selectedStatus = signal<'TOUS' | AuditStatus>('TOUS');
  readonly draftSelections = signal<Record<number, DraftSelection>>({});

  readonly statusOptions: Array<'TOUS' | AuditStatus> = ['TOUS', 'PLANIFIE', 'EN_COURS', 'TERMINEE'];

  readonly stats = computed(() => ({
    total: this.audits().length,
    planned: this.audits().filter((audit) => audit.status === 'PLANIFIE').length,
    active: this.audits().filter((audit) => audit.status === 'EN_COURS').length,
    completed: this.audits().filter((audit) => audit.status === 'TERMINEE').length,
  }));

  readonly filteredAudits = computed(() => {
    const status = this.selectedStatus();
    const term = this.searchTerm().trim().toLowerCase();

    return this.audits().filter((audit) => {
      const matchesStatus = status === 'TOUS' || audit.status === status;
      const matchesSearch =
        !term ||
        [audit.title, audit.typeAuditName, audit.department, audit.auditeurName]
          .join(' ')
          .toLowerCase()
          .includes(term);

      return matchesStatus && matchesSearch;
    });
  });

  readonly answeredQuestionsCount = computed(() => {
    const details = this.selectedAuditDetails();
    if (!details) {
      return 0;
    }

    return details.questions.filter((question) => this.hasPersistedResponse(question)).length;
  });

  readonly completedDraftQuestionsCount = computed(() => {
    const details = this.selectedAuditDetails();
    if (!details) {
      return 0;
    }

    return details.questions.filter((question) => this.getSelectedOptionId(question) !== null).length;
  });

  readonly completionRatio = computed(() => {
    const details = this.selectedAuditDetails();
    if (!details?.questions.length) {
      return 0;
    }

    return Math.round((this.completedDraftQuestionsCount() / details.questions.length) * 100);
  });

  readonly scorePercentage = computed(() => {
    const details = this.selectedAuditDetails();
    if (!details?.questions.length) {
      return 0;
    }

    return Math.round((details.scoreTotal / details.questions.length) * 100);
  });

  readonly canSubmitCurrentAudit = computed(() => {
    const details = this.selectedAuditDetails();
    if (!details || details.status !== 'EN_COURS' || details.questions.length === 0) {
      return false;
    }

    return details.questions.every((question) => this.getSelectedOptionId(question) !== null);
  });

  readonly hasUnsavedAnswers = computed(() => {
    const details = this.selectedAuditDetails();
    if (!details) {
      return false;
    }

    return details.questions.some((question) => this.hasQuestionChanged(question));
  });

  ngOnInit(): void {
    this.loadAudits();
  }

  loadAudits(): void {
    this.loading.set(true);

    this.auditService
      .findAll()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (audits) => {
          this.audits.set([...audits].sort((left, right) => right.id - left.id));
        },
        error: () => {
          this.toastr.error("Impossible de charger les audits de l'audite", 'Erreur');
          this.audits.set([]);
        },
      });
  }

  openAuditWorkspace(audit: AuditSummary): void {
    this.selectedAuditSummary.set(audit);
    this.showAuditWorkspace.set(true);
    this.loadingDetails.set(true);

    this.auditService
      .findById(audit.id)
      .pipe(finalize(() => this.loadingDetails.set(false)))
      .subscribe({
        next: (details) => {
          this.selectedAuditDetails.set(details);
          this.seedDraftSelections(details.questions);
        },
        error: () => {
          this.toastr.error("Impossible de charger les details de l'audit", 'Erreur');
          this.selectedAuditDetails.set(null);
        },
      });
  }

  editAuditResponses(audit: AuditSummary): void {
    this.openAuditWorkspace(audit);
  }

  closeAuditWorkspace(): void {
    this.showAuditWorkspace.set(false);
    this.selectedAuditSummary.set(null);
    this.selectedAuditDetails.set(null);
    this.draftSelections.set({});
  }

  openReport(audit: AuditSummary): void {
    if (audit.status !== 'TERMINEE') return;
    this.auditService.findById(audit.id).subscribe({
      next: (details) => this.reportAudit.set(details),
      error: () => this.toastr.error('Impossible de charger les details pour le rapport')
    });
  }

  closeReport(): void {
    this.reportAudit.set(null);
  }

  onSearchInput(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  getStatusLabel(status: AuditStatus): string {
    return AUDIT_STATUS_LABELS[status] ?? status;
  }

  getStatusClass(status: AuditStatus): string {
    return AUDIT_STATUS_CLASSES[status] ?? '';
  }

  formatDepartment(value: string): string {
    return value
      .toLowerCase()
      .split('_')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  formatDate(value: string): string {
    if (!value) {
      return '--';
    }

    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(value));
  }

  getSelectedOptionId(question: Question): number | null {
    const persisted = this.getPersistedOptionId(question);
    if (persisted !== null) {
      return persisted;
    }

    return this.getDraftOptionId(question);
  }

  getOptionOrder(option: QuestionOption): number {
    return option.sortOrder ?? option.order ?? 0;
  }

  hasPersistedResponse(question: Question): boolean {
    return this.getPersistedOptionId(question) !== null && this.getResponseId(question) !== null;
  }

  canEditQuestion(question: Question): boolean {
    const details = this.selectedAuditDetails();
    return details?.status === 'EN_COURS';
  }

  selectOption(question: Question, option: QuestionOption): void {
    const details = this.selectedAuditDetails();
    if (details?.status !== 'EN_COURS') {
      return;
    }

    this.draftSelections.update((current) => ({
      ...current,
      [question.id]: {
        optionId: option.id,
      },
    }));
  }

  submitResponses(): void {
    const details = this.selectedAuditDetails();
    if (!details) {
      return;
    }

    if (details.status !== 'EN_COURS') {
      this.toastr.info("Cet audit n'est pas en cours. Les reponses ne peuvent pas etre modifiees.", 'Information');
      return;
    }

    const unansweredQuestions = details.questions.filter((question) => this.getSelectedOptionId(question) === null);
    if (unansweredQuestions.length > 0) {
      this.toastr.warning('Veuillez repondre a toutes les questions avant l envoi.', 'Attention');
      return;
    }

    const questionsToSubmit = details.questions.filter(
      (question) => this.getSelectedOptionId(question) !== null,
    );

    this.submittingAnswers.set(true);

    from(questionsToSubmit)
      .pipe(
        concatMap((question) => {
          const optionId = this.getSelectedOptionId(question);
          if (optionId === null) {
            return of({ error: new Error('Option manquante'), questionId: question.id } satisfies Exclude<SubmitResult, true>);
          }

          const responseId = this.getResponseId(question);
          const request$ = responseId
            ? this.reponseService.update({
                reponseId: responseId,
                optionId,
              } satisfies UpdateReponseDto)
            : this.reponseService.add({
                questionId: question.id,
                optionId,
              } satisfies AddReponseDto);

          return request$.pipe(
            map(() => true as const),
            catchError((error) => of({ error, questionId: question.id })),
          );
        }),
        toArray(),
        finalize(() => this.submittingAnswers.set(false)),
      )
      .subscribe({
        next: (results) => {
          const failed = results.find((result): result is { error: unknown; questionId: number } => result !== true);
          if (failed) {
            this.toastr.error(
              (failed.error as { error?: { message?: string } })?.error?.message ??
                "Une ou plusieurs reponses n'ont pas pu etre enregistrees.",
              'Erreur',
            );
            return;
          }

          this.toastr.success('Toutes les reponses ont ete enregistrees avec succes.', 'Succes');
          const selectedAudit = this.selectedAuditSummary();
          if (selectedAudit) {
            this.openAuditWorkspace(selectedAudit);
          }
          this.loadAudits();
        },
        error: () => {
          this.toastr.error("Erreur lors de l'envoi des reponses.", 'Erreur');
        },
      });
  }

  trackByAudit(_: number, audit: AuditSummary): number {
    return audit.id;
  }

  trackByQuestion(_: number, question: Question): number {
    return question.id;
  }

  trackByOption(_: number, option: QuestionOption): number {
    return option.id;
  }

  private seedDraftSelections(questions: Question[]): void {
    const nextDrafts: Record<number, DraftSelection> = {};

    for (const question of questions) {
      const selectedOptionId = this.getPersistedOptionId(question);
      if (selectedOptionId !== null) {
        nextDrafts[question.id] = {
          optionId: selectedOptionId,
        };
      }
    }

    this.draftSelections.set(nextDrafts);
  }

  private getPersistedOptionId(question: Question): number | null {
    return question.selectedOptionId ?? question.optionChoisieId ?? null;
  }

  private getDraftOptionId(question: Question): number | null {
    return this.draftSelections()[question.id]?.optionId ?? null;
  }

  private getResponseId(question: Question): number | null {
    return question.reponseId ?? null;
  }

  private hasQuestionChanged(question: Question): boolean {
    const persisted = this.getPersistedOptionId(question);
    const selected = this.getSelectedOptionId(question);
    return selected !== null && selected !== persisted;
  }

  openChat(audit: AuditSummary) {
    this.router.navigate(['/audite/messages', audit.id]);
  }
}
