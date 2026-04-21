import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuditChatService } from '../../../../services/audit-chat.service';
import { ChatAuditSummary } from '../../../../models/audit-chat.model';


@Component({
  selector: 'app-audite-dashboard-page',
  imports: [CommonModule],
  templateUrl: './audite-dashboard-page.html',
  styleUrl: './audite-dashboard-page.css',
})
export class AuditeDashboardPage implements OnInit {
  private readonly auditChatService = inject(AuditChatService);
  private readonly router = inject(Router);

  audits: ChatAuditSummary[] = [];
  loading = false;
  error = '';

  ngOnInit(): void {
    this.loadAudits();
  }

  trackByAuditId(_: number, item: ChatAuditSummary): number {
    return item.id;
  }

  openChat(auditId: number): void {
    void this.router.navigateByUrl(`/audite/messages/${auditId}`);
  }

  formatDate(value: string | null | undefined): string {
    if (!value) {
      return 'N/A';
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

  private loadAudits(): void {
    this.loading = true;
    this.error = '';

    this.auditChatService.findMyChatAudits().subscribe({
      next: (data) => {
        this.audits = data;
        this.loading = false;
      },
      error: () => {
        this.error = 'Impossible de charger vos audits pour la messagerie.';
        this.loading = false;
      },
    });
  }
}
