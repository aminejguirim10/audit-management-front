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
  get auditorsActifs(): number { return 0; }
  get auditsEnCoursTotal(): number { return 0; }
  get auditsCompletesTotal(): number { return 0; }

  readonly departements = ['INFORMATIQUE', 'ELECTRIQUE', 'INDUS'];
  readonly departementsLabels: Record<string, string> = {
    'INFORMATIQUE': 'Génie Informatique',
    'ELECTRIQUE': 'Génie Électrique',
    'INDUS': 'Génie Industriel'
  };
  ngOnInit(): void {
    this.loadAuditors();
  }

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
      next: (data: Auditor[]) => {
        this.auditors = data;
        this.chargement = false;
      },
      error: () => {
        this.erreur = 'Erreur lors du chargement des auditeurs';
        this.chargement = false;
      }
    });
  }

  modalCreationOuverte = false;
  nouveauAuditor: Partial<Auditor> = {};
  erreurCreation = '';

  ouvrirModalCreation(): void {
    this.nouveauAuditor = { departement: 'INFORMATIQUE' };
    this.erreurCreation = '';
    this.modalCreationOuverte = true;
  }

  fermerModalCreation(): void {
    this.modalCreationOuverte = false;
  }

  creerAuditor(): void {
    if (!this.nouveauAuditor.name?.trim()) {
      this.erreurCreation = 'Le nom complet est obligatoire !';
      return;
    }
    if (!this.nouveauAuditor.email?.trim()) {
      this.erreurCreation = 'L\'email est obligatoire !';
      return;
    }
    if (!this.nouveauAuditor.email.match(/^[a-zA-Z0-9._%+-]+@enicar\.ucar\.tn$/)) {
      this.erreurCreation = 'L\'email doit être au format @enicar.ucar.tn !';
      return;
    }
    if (!this.nouveauAuditor.phoneNumber?.trim()) {
      this.erreurCreation = 'Le numéro de téléphone est obligatoire !';
      return;
    }
    if (!this.nouveauAuditor.phoneNumber.match(/^[0-9]{8}$/)) {
      this.erreurCreation = 'Le numéro de téléphone doit contenir exactement 8 chiffres !';
      return;
    }
    if (!this.nouveauAuditor.departement) {
      this.erreurCreation = 'Le département est obligatoire !';
      return;
    }
    this.service.create(this.nouveauAuditor).subscribe({
      next: (auditorCree: Auditor) => {
        this.auditors.push(auditorCree);
        this.fermerModalCreation();
        this.loadAuditors();
      },
      error: (err: any) => {
        this.erreurCreation = err.error?.message ?? 'Erreur lors de la création';
      }
    });
  }

  modalSuppressionOuverte = false;
  auditorASupprimer: Auditor | null = null;

  ouvrirModalSuppression(auditor: Auditor): void {
    this.auditorASupprimer = auditor;
    this.modalSuppressionOuverte = true;
  }

  fermerModalSuppression(): void {
    this.modalSuppressionOuverte = false;
    this.auditorASupprimer = null;
  }

  confirmerSuppression(): void {
    if (!this.auditorASupprimer) return;
    this.service.delete(this.auditorASupprimer.id).subscribe({
      next: () => {
        this.auditors = this.auditors.filter(a => a.id !== this.auditorASupprimer!.id);
        this.fermerModalSuppression();
      },
      error: () => {
        this.erreur = 'Erreur lors de la suppression';
        this.fermerModalSuppression();
      }
    });
  }
}
