import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';
import { AuditDetails, AuditStatus, AuditSummary } from '../../../../models/audit.model';
import { AuditService } from '../../../../services/audit.service';

interface AuditTimelineItem {
  id: string;
  auditId: number;
  title: string;
  subtitle: string;
  status: AuditStatus;
  period: string;
}

type HistoryFilterValue = 'TOUS' | string;

const AUDIT_STATUS_LABELS: Record<AuditStatus, string> = {
  PLANIFIE: 'Planifie',
  EN_COURS: 'En cours',
  TERMINEE: 'Termine',
};

@Component({
  selector: 'app-auditeur-history-page',
  imports: [CommonModule],
  templateUrl: './auditeur-history-page.html',
  styleUrl: './auditeur-history-page.css',
})
export class AuditeurHistoryPage implements OnInit {
  private readonly auditService = inject(AuditService);

  readonly audits = signal<AuditSummary[]>([]);
  readonly auditDetails = signal<Record<number, AuditDetails>>({});
  readonly loading = signal(true);
  readonly loadingTimeline = signal(false);
  readonly errorMessage = signal('');
  readonly searchTerm = signal('');
  readonly selectedDepartment = signal<HistoryFilterValue>('TOUS');
  readonly selectedType = signal<HistoryFilterValue>('TOUS');

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
          },
        ];
      })
      .sort((left, right) => right.auditId - left.auditId);
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

  trackByAudit(_: number, audit: AuditSummary): number {
    return audit.id;
  }

  trackByTimeline(_: number, item: AuditTimelineItem): string {
    return item.id;
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
