import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditService } from '../../../../services/audit.service';
import { Audit } from '../../../../models/audit.model';

@Component({
  selector: 'app-admin-audits-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-audits-page.html',
  styleUrl: './admin-audits-page.css',
})
export class AdminAuditsPage implements OnInit {
  private service = inject(AuditService);

  audits: Audit[] = [];
  chargement = false;
  erreur = '';
  recherche = '';
  filtreStatut = '';

  readonly statusLabels: Record<string, string> = {
    'PLANIFIE': 'Planifié',
    'EN_COURS': 'En cours',
    'TERMINEE': 'Terminé'
  };

  readonly departementLabels: Record<string, string> = {
    'INFORMATIQUE': 'Informatique',
    'ELECTRIQUE': 'Électrique',
    'INDUS': 'Industriel'
  };

  ngOnInit(): void {
    this.chargerAudits();
  }

  get auditsFiltres(): Audit[] {
    let result = this.audits;

    if (this.filtreStatut) {
      result = result.filter(a => a.status === this.filtreStatut);
    }

    const term = this.recherche.trim().toLowerCase();
    if (term) {
      result = result.filter(a =>
        a.typeAuditName?.toLowerCase().includes(term) ||
        a.auditeurName?.toLowerCase().includes(term) ||
        a.auditeName?.toLowerCase().includes(term) ||
        a.department?.toLowerCase().includes(term)
      );
    }
    return result;
  }

  get totalPlanifies(): number { return this.audits.filter(a => a.status === 'PLANIFIE').length; }
  get totalEnCours(): number { return this.audits.filter(a => a.status === 'EN_COURS').length; }
  get totalTermines(): number { return this.audits.filter(a => a.status === 'TERMINEE').length; }

  chargerAudits(): void {
    this.chargement = true;
    this.erreur = '';
    this.service.findAll().subscribe({
      next: (data:any) => {
        this.audits = data.data ?? data;
        this.chargement = false;
      },
      error: () => {
        this.erreur = 'Erreur lors du chargement des audits';
        this.chargement = false;
      }
    });
  }

  formaterDate(date: string | undefined): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('fr-FR');
  }

  calculerPourcentage(audit: any): number {
    if (!audit.nombreQuestions || audit.nombreQuestions === 0) return 0;
    return Math.round(((audit.scoreTotal || 0) / audit.nombreQuestions) * 100);
  }

  getInitials(name: string | undefined): string {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
}