import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditorService } from '../../../../services/auditor.service';
import { Auditor } from '../../../../models/auditor.model';

@Component({
  selector: 'app-admin-auditors-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-auditors-page.html',
  styleUrl: './admin-auditors-page.css',
})
export class AdminAuditorsPage implements OnInit {
  private service = inject(AuditorService);
  auditors: Auditor[] = [];
  chargement = false;
  erreur = '';
  recherche = '';

  get totalAuditors(): number { return this.auditors.length; }

  readonly departements = ['INFORMATIQUE', 'ELECTRIQUE', 'INDUS'];
  readonly departementsLabels: Record<string, string> = {
    'INFORMATIQUE': 'Génie Informatique',
    'ELECTRIQUE': 'Génie Électrique',
    'INDUS': 'Génie Industriel'
  };

  ngOnInit(): void { this.loadAuditors(); }

  get filteredAuditors(): Auditor[] {
    const term = this.recherche.trim().toLowerCase();
    if (!term) return this.auditors;
    return this.auditors.filter(a =>
      a.name?.toLowerCase().includes(term) ||
      a.email?.toLowerCase().includes(term) ||
      a.departement?.toLowerCase().includes(term)
    );
  }

  loadAuditors(): void {
    this.chargement = true;
    this.erreur = '';
    this.service.findAll().subscribe({
      next: (data: Auditor[]) => { this.auditors = data; this.chargement = false; },
      error: () => { this.erreur = 'Erreur lors du chargement'; this.chargement = false; }
    });
  }


  getOffset(value: number, total: number): number {
    if (total === 0) return 251.2;
    return 251.2 * (1 - Math.min(value / total, 1));
  }

  countByDept(dept: string): number {
    return this.auditors.filter(a => a.departement === dept).length;
  }

  getPct(dept: string): number {
    if (this.totalAuditors === 0) return 0;
    return Math.round((this.countByDept(dept) / this.totalAuditors) * 100);
  }

  getInitials(name: string | undefined): string {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  // ── Modal création ──
  modalCreationOuverte = false;
  nouveauAuditor: Partial<Auditor> = {};
  erreurCreation = '';
  enCreation = false;

  ouvrirModalCreation(): void {
    this.nouveauAuditor = { departement: 'INFORMATIQUE' };
    this.erreurCreation = '';
    this.modalCreationOuverte = true;
  }

  fermerModalCreation(): void { this.modalCreationOuverte = false; }

  creerAuditor(): void {
    if (!this.nouveauAuditor.name?.trim()) { this.erreurCreation = 'Le nom est obligatoire !'; return; }
    if (!this.nouveauAuditor.email?.trim()) { this.erreurCreation = "L'email est obligatoire !"; return; }
    if (!this.nouveauAuditor.email.match(/^[a-zA-Z0-9._%+-]+@enicar\.ucar\.tn$/)) {
      this.erreurCreation = "L'email doit être au format @enicar.ucar.tn !"; return;
    }
    if (!this.nouveauAuditor.phoneNumber?.trim()) { this.erreurCreation = 'Le téléphone est obligatoire !'; return; }
    if (!this.nouveauAuditor.phoneNumber.match(/^[0-9]{8}$/)) {
      this.erreurCreation = 'Le téléphone doit contenir exactement 8 chiffres !'; return;
    }
    if (!this.nouveauAuditor.departement) { this.erreurCreation = 'Le département est obligatoire !'; return; }

    this.enCreation = true;
    this.service.create(this.nouveauAuditor).subscribe({
      next: () => { 
        this.enCreation = false;
        this.fermerModalCreation(); 
        this.loadAuditors(); 
      },
      error: (err: any) => { 
        this.enCreation = false;
        this.erreurCreation = err.error?.message ?? 'Erreur lors de la création'; 
      }
    });
  }

  // ── Modal suppression ──
  modalSuppressionOuverte = false;
  auditorASupprimer: Auditor | null = null;
  enSuppression = false;

  ouvrirModalSuppression(auditor: Auditor): void {
    this.auditorASupprimer = auditor;
    this.modalSuppressionOuverte = true;
  }

  fermerModalSuppression(): void {
    this.modalSuppressionOuverte = false;
    this.auditorASupprimer = null;
    this.enSuppression = false;
  }

  confirmerSuppression(): void {
    if (!this.auditorASupprimer) return;
    this.enSuppression = true;
    this.service.delete(this.auditorASupprimer.id).subscribe({
      next: () => {
        this.enSuppression = false;
        this.auditors = this.auditors.filter(a => a.id !== this.auditorASupprimer!.id);
        this.fermerModalSuppression();
      },
      error: () => { 
        this.enSuppression = false;
        this.erreur = 'Erreur lors de la suppression'; 
        this.fermerModalSuppression(); 
      }
    });
  }
}