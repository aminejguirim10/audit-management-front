import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { forkJoin, from, of } from 'rxjs';
import { catchError, mergeMap, finalize, map, toArray } from 'rxjs/operators';
import { AuditDetails, AuditStatus, AuditSummary, Question, QuestionOption } from '../../../../models/audit.model';
import { AddReponseDto, UpdateReponseDto } from '../../../../models/reponse.model';
import { AuditService } from '../../../../services/audit.service';
import { ReponseService } from '../../../../services/reponse.service';
import { AuditReportComponent } from '../../../shared/audit-report/audit-report.component';
import { AiService } from '../../../../services/ai.service';
import { CorrectiveActionService } from '../../../../services/corrective-action.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faPlus,
  faChartBar,
  faFilter,
  faSearch,
  faTable,
  faFileAlt,
  faLayerGroup,
  faBuilding,
  faUser,
  faCheckCircle,
  faClock,
  faComment,
  faEdit,
  faTrash,
  faChevronRight,
  faChevronLeft,
  faHistory,
  faTimes,
  faInfoCircle,
  faExclamationTriangle,
  faSync,
  faClipboardList,
  faCheckDouble,
  faCalendarAlt
} from '@fortawesome/free-solid-svg-icons';


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

interface DraftSelection {
  optionId: number;
}

type SubmitResult = true | { error: unknown; questionId: number };


@Component({
  selector: 'app-audite-dashboard-page',
  imports: [CommonModule, AuditReportComponent, FontAwesomeModule],
  templateUrl: './audite-dashboard-page.html',
  styleUrl: './audite-dashboard-page.css',
})
export class AuditeDashboardPage implements OnInit {
  // Icons
  faPlus = faPlus;
  faChartBar = faChartBar;
  faFilter = faFilter;
  faSearch = faSearch;
  faTable = faTable;
  faFileAlt = faFileAlt;
  faLayerGroup = faLayerGroup;
  faBuilding = faBuilding;
  faUser = faUser;
  faCheckCircle = faCheckCircle;
  faClock = faClock;
  faComment = faComment;
  faEdit = faEdit;
  faTrash = faTrash;
  faChevronRight = faChevronRight;
  faChevronLeft = faChevronLeft;
  faHistory = faHistory;
  faTimes = faTimes;
  faInfoCircle = faInfoCircle;
  faExclamationTriangle = faExclamationTriangle;
  faSync = faSync;
  faClipboardList = faClipboardList;
  faCheckDouble = faCheckDouble;
  faCalendarAlt = faCalendarAlt;
  private readonly auditService = inject(AuditService);
  private readonly reponseService = inject(ReponseService);
  private readonly toastr = inject(ToastrService);
  private readonly router = inject(Router);
  private readonly aiService = inject(AiService);
  private readonly correctiveActionService = inject(CorrectiveActionService);

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
          const sortedDetails = this.sortAuditDetails(details);
          this.selectedAuditDetails.set(sortedDetails);
          this.seedDraftSelections(sortedDetails.questions);
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
      next: (details) => this.reportAudit.set(this.sortAuditDetails(details)),
      error: () => this.toastr.error('Impossible de charger les details pour le rapport')
    });
  }

  private sortAuditDetails(details: AuditDetails): AuditDetails {
    if (!details || !details.questions) return details;

    // Trier les questions par ID (ordre de création)
    details.questions.sort((a, b) => a.id - b.id);

    // Trier les options de chaque question par sortOrder ou ID
    details.questions.forEach(q => {
      if (q.options) {
        q.options.sort((a, b) => {
          const orderA = a.sortOrder ?? a.order ?? a.id;
          const orderB = b.sortOrder ?? b.order ?? b.id;
          return orderA - orderB;
        });
      }
    });

    return details;
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
        mergeMap((question) => {
          const optionId = this.getSelectedOptionId(question);
          if (optionId === null) {
            return of({ error: new Error('Option manquante'), questionId: question.id });
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
          
          // Mise à jour optimiste locale pour éviter les clignotements
          const currentDetails = this.selectedAuditDetails();
          if (currentDetails) {
            const updatedQuestions = currentDetails.questions.map(q => ({
              ...q,
              reponseId: q.reponseId || 999, // Fake ID to trigger "Repondu" text
              selectedOptionId: this.getSelectedOptionId(q)
            }));
            this.selectedAuditDetails.set({ ...currentDetails, status: 'TERMINEE', questions: updatedQuestions });
          }

          const currentSummary = this.selectedAuditSummary();
          const auditId = currentSummary?.id;

          // Fermeture immédiate du workspace
          this.closeAuditWorkspace();
          this.loadAudits();
          
          if (auditId) {
            this.triggerAiAnalysisIfNeeded(auditId);
          }
        },
        error: () => {
          this.toastr.error("Erreur lors de l'envoi des reponses.", 'Erreur');
        },
      });
  }

  private triggerAiAnalysisIfNeeded(auditId: number): void {
    this.auditService.findById(auditId).subscribe({
      next: (freshDetails) => {
        const failedQuestions = freshDetails.questions
          .filter(q => q.score === 0)
          .map(q => q.title);

        if (failedQuestions.length > 0) {
          this.aiService.analyzeFailedQuestions(failedQuestions).subscribe({
            next: (response) => {
              const actions = response.actions;
              if (actions && actions.length > 0) {
                // Créer les actions correctives en PARALLÈLE pour plus de rapidité
                const saveRequests = actions.map(action => 
                  this.correctiveActionService.addCorrectiveAction(auditId, {
                    title: action.title,
                    description: action.description,
                    priority: action.priority,
                    tempsEstime: action.temps_estime
                  })
                );

                forkJoin(saveRequests).subscribe({
                  next: () => {
                    this.toastr.success(`${actions.length} actions correctives générées par l'IA.`, 'Analyse IA Terminée');
                  },
                  error: (err) => {
                    console.error('Failed to save AI corrective actions:', err);
                  }
                });
              }
            },
            error: (err) => console.error('AI Analysis failed:', err)
          });
        }
      }
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
