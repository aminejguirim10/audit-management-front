import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuditChatService } from '../../../../services/audit-chat.service';
import { ChatAuditSummary } from '../../../../models/audit-chat.model';

@Component({
  selector: 'app-auditeur-history-page',
  imports: [CommonModule, RouterLink],
  templateUrl: './auditeur-history-page.html',
  styleUrl: './auditeur-history-page.css',
})
export class AuditeurHistoryPage implements OnInit {
  private readonly auditChatService = inject(AuditChatService);

  audits: ChatAuditSummary[] = [];
  loading = false;
  error = '';

  ngOnInit(): void {
    this.loadAudits();
  }

  trackByAuditId(_: number, item: ChatAuditSummary): number {
    return item.id;
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
        this.error = 'Impossible de charger votre historique d audits.';
        this.loading = false;
      },
    });
  }
}
