import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { CorrectiveActionService } from '../../../../services/corrective-action.service';
import {
  AuditCorrectiveActionsCard,
  CorrectiveActionItem,
} from '../../../../models/corrective-action.model';

@Component({
  selector: 'app-audite-corrective-actions-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './audite-corrective-actions-page.html',
  styleUrl: './audite-corrective-actions-page.css',
})
export class AuditeCorrectiveActionsPage implements OnInit {
  private readonly correctiveActionService = inject(CorrectiveActionService);

  audits: AuditCorrectiveActionsCard[] = [];
  loading = false;
  error = '';

  ngOnInit(): void {
    this.loadCorrectiveActions();
  }

  get totalAudits(): number {
    return this.audits.length;
  }

  get totalActions(): number {
    return this.audits.reduce((sum, audit) => sum + audit.correctiveActions.length, 0);
  }

  loadCorrectiveActions(): void {
    this.loading = true;
    this.error = '';

    this.correctiveActionService.findCurrentAuditeAudits().subscribe({
      next: (data) => {
        this.audits = data;
        this.loading = false;
      },
      error: () => {
        this.error = 'Impossible de charger les actions correctives.';
        this.loading = false;
      },
    });
  }

  formatDate(value: string | null | undefined): string {
    if (!value) {
      return 'Non définie';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  }

  trackByAuditId(_: number, audit: AuditCorrectiveActionsCard): number {
    return audit.auditId;
  }

  trackByActionId(_: number, action: CorrectiveActionItem): number {
    return action.id;
  }
}
