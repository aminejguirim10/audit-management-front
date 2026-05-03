import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';
import { AuditDetails, AuditStatus, AuditSummary } from '../../../../models/audit.model';
import { AuditService } from '../../../../services/audit.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { 
  faFileAlt, 
  faLayerGroup, 
  faBuilding, 
  faUser, 
  faCheckCircle, 
  faClock,
  faHistory,
  faSync,
  faTimes,
  faInfoCircle,
  faExclamationTriangle,
  faChartBar
} from '@fortawesome/free-solid-svg-icons';
import { AuditReportComponent } from '../../../shared/audit-report/audit-report.component';

interface AuditTimelineItem {
  id: string;
  auditId: number;
  title: string;
  subtitle: string;
  status: AuditStatus;
  period: string;
  dateDebut: string;
}

type HistoryFilterValue = 'TOUS' | string;

const AUDIT_STATUS_LABELS: Record<AuditStatus, string> = {
  PLANIFIE: 'Planifie',
  EN_COURS: 'En cours',
  TERMINEE: 'Termine',
};

@Component({
  selector: 'app-auditeur-history-page',
  imports: [CommonModule, FontAwesomeModule, AuditReportComponent],
  templateUrl: './auditeur-history-page.html',
  styleUrl: './auditeur-history-page.css',
})
export class AuditeurHistoryPage implements OnInit {
  // Icons
  faFileAlt = faFileAlt;
  faLayerGroup = faLayerGroup;
  faBuilding = faBuilding;
  faUser = faUser;
  faCheckCircle = faCheckCircle;
  faClock = faClock;
  faHistory = faHistory;
  faSync = faSync;
  faTimes = faTimes;
  faInfoCircle = faInfoCircle;
  faExclamationTriangle = faExclamationTriangle;
  faChartBar = faChartBar;

  private readonly auditService = inject(AuditService);

  readonly audits = signal<AuditSummary[]>([]);
  readonly auditDetails = signal<Record<number, AuditDetails>>({});
  readonly loading = signal(true);
  readonly loadingDetails = signal(false);
  readonly loadingTimeline = signal(false);
  readonly errorMessage = signal('');
  readonly searchTerm = signal('');
  readonly selectedDepartment = signal<HistoryFilterValue>('TOUS');
  readonly selectedType = signal<HistoryFilterValue>('TOUS');
  readonly selectedAudit = signal<AuditDetails | null>(null);
  readonly reportAudit = signal<AuditDetails | null>(null);

  readonly completedAudits = computed(() =>
    this.audits()
      .filter((audit) => audit.status === 'TERMINEE')
      .sort((left, right) => right.id - left.id),
  );

  readonly departmentOptions = computed(() =>
    [...new Set(this.completedAudits().map((audit) => audit.department).filter(Boolean))].sort(),
  );

  readonly typeOptions = computed(() =>
    [...new Set(this.completedAudits().map((audit) => audit.typeAuditName).filter(Boolean))].sort(),
  );

  readonly filteredCompletedAudits = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const department = this.selectedDepartment();
    const type = this.selectedType();

    return this.completedAudits().filter((audit) => {
      const matchesDepartment = department === 'TOUS' || audit.department === department;
      const matchesType = type === 'TOUS' || audit.typeAuditName === type;
      const matchesSearch =
        !term ||
        [
          audit.title,
          audit.typeAuditName,
          audit.department,
          audit.auditeName,
          audit.auditeurName,
        ]
          .join(' ')
          .toLowerCase()
          .includes(term);

      return matchesDepartment && matchesType && matchesSearch;
    });
  });

  readonly stats = computed(() => {
    const audits = this.completedAudits();

    return {
      completedCount: audits.length,
      departmentCount: new Set(audits.map((audit) => audit.department)).size,
      typeCount: new Set(audits.map((audit) => audit.typeAuditName)).size,
    };
  });

  readonly filteredTimelineAudits = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const department = this.selectedDepartment();
    const type = this.selectedType();

    return this.audits().filter((audit) => {
      const matchesDepartment = department === 'TOUS' || audit.department === department;
      const matchesType = type === 'TOUS' || audit.typeAuditName === type;
      const matchesSearch =
        !term ||
        [
          audit.title,
          audit.typeAuditName,
          audit.department,
          audit.auditeName,
          audit.auditeurName,
        ]
          .join(' ')
          .toLowerCase()
          .includes(term);

      return matchesDepartment && matchesType && matchesSearch;
    });
  });

  readonly timelineItems = computed(() => {
    const details = this.auditDetails();

    return this.filteredTimelineAudits()
      .flatMap((audit) => {
        const detail = details[audit.id];
        if (!detail) {
          return [];
        }

        return [
          {
            id: `${audit.id}-timeline`,
            auditId: audit.id,
            title: audit.title,
            subtitle: `${audit.auditeName} - ${this.formatDepartment(audit.department)}`,
            status: audit.status,
            period: `${this.formatDate(detail.dateDebut)} - ${this.formatDate(detail.dateFin)}`,
            dateDebut: detail.dateDebut,
          },
        ];
      })
      .sort((left, right) => {
        // Sort by dateDebut descending (newest first)
        const dateLeft = left.dateDebut ? new Date(left.dateDebut).getTime() : 0;
        const dateRight = right.dateDebut ? new Date(right.dateDebut).getTime() : 0;
        return dateRight - dateLeft;
      });
  });

  readonly groupedTimeline = computed(() => {
    const items = this.timelineItems();
    const groups: { month: string; year: string; items: AuditTimelineItem[] }[] = [];

    items.forEach((item) => {
      const date = new Date(item.dateDebut);
      if (isNaN(date.getTime())) return;

      const month = new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(date);
      const year = date.getFullYear().toString();
      
      const capitalizedMonth = month.charAt(0).toUpperCase() + month.slice(1);
      
      let group = groups.find((g) => g.month === capitalizedMonth && g.year === year);
      if (!group) {
        group = { month: capitalizedMonth, year, items: [] };
        groups.push(group);
      }
      group.items.push(item);
    });

    return groups;
  });

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.auditService
      .findAll()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (audits) => {
          this.audits.set(audits);
          this.loadTimelineDetails(audits);
        },
        error: () => {
          this.errorMessage.set("Impossible de charger l'historique des audits.");
          this.audits.set([]);
          this.auditDetails.set({});
        },
      });
  }

  onSearch(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  getStatusLabel(status: AuditStatus): string {
    return AUDIT_STATUS_LABELS[status] ?? status;
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
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(value));
  }

  getTimelineBadgeLabel(status: AuditStatus): string {
    return this.getStatusLabel(status);
  }

  getTimelineBadgeClass(status: AuditStatus): string {
    switch (status) {
      case 'PLANIFIE': return 'badge-planifie';
      case 'EN_COURS': return 'badge-encours';
      case 'TERMINEE': return 'badge-terminee';
      default: return '';
    }
  }

  getTimelineStatusIcon(status: AuditStatus): any {
    switch (status) {
      case 'PLANIFIE': return this.faClock;
      case 'EN_COURS': return this.faLayerGroup;
      case 'TERMINEE': return this.faCheckCircle;
      default: return this.faCheckCircle;
    }
  }

  trackByAudit(_: number, audit: AuditSummary): number {
    return audit.id;
  }

  trackByTimeline(_: number, item: AuditTimelineItem): string {
    return item.id;
  }

  viewAuditDetails(audit: any): void {
    const id = audit.auditId || audit.id;
    this.loadingDetails.set(true);
    this.auditService
      .findById(id)
      .pipe(finalize(() => this.loadingDetails.set(false)))
      .subscribe({
        next: (details) => {
          this.selectedAudit.set(details);
        },
        error: (err) => {
          console.error('Erreur lors du chargement des détails', err);
        },
      });
  }

  closeAuditDetails(): void {
    this.selectedAudit.set(null);
  }

  openReport(audit: any): void {
    const id = audit.auditId || audit.id;
    this.auditService.findById(id).subscribe({
      next: (details) => this.reportAudit.set(details),
      error: () => console.error('Impossible de charger les détails pour le rapport'),
    });
  }

  closeReport(): void {
    this.reportAudit.set(null);
  }

  getQuestionResponseLabel(question: any): string {
    const selectedOption = question.options.find(
      (opt: any) => opt.id === question.optionChoisieId,
    );
    return selectedOption ? selectedOption.label : 'Non répondu';
  }

  getSelectedOptionId(question: any): number | null {
    return question.optionChoisieId ?? question.selectedOptionId ?? null;
  }

  getAuditScorePercentage(audit: AuditDetails | null): number {
    if (!audit || !audit.questions?.length) {
      return 0;
    }
    return Math.round((audit.scoreTotal / audit.questions.length) * 100);
  }

  private loadTimelineDetails(audits: AuditSummary[]): void {
    if (audits.length === 0) {
      this.auditDetails.set({});
      return;
    }

    this.loadingTimeline.set(true);

    forkJoin(
      audits.map((audit) =>
        this.auditService.findById(audit.id).pipe(
          map((detail) => ({ auditId: audit.id, detail })),
          catchError(() => of(null)),
        ),
      ),
    )
      .pipe(finalize(() => this.loadingTimeline.set(false)))
      .subscribe((results) => {
        const nextDetails: Record<number, AuditDetails> = {};

        for (const result of results) {
          if (result) {
            nextDetails[result.auditId] = result.detail;
          }
        }

        this.auditDetails.set(nextDetails);
      });
  }
}
