import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChefDepartementService } from '../../../../services/chef-departement.service';
import { Chef } from '../../../../models/chef.model';

@Component({
  selector: 'app-admin-departments-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-departments-page.html',
  styleUrl: './admin-departments-page.css',
})
export class AdminDepartmentsPage implements OnInit {
  private service = inject(ChefDepartementService);
  chefs: Chef[] = [];
  chargement = false;
  erreur = '';
  recherche = '';

  get totalChefs(): number {
    return this.chefs.length;
  }

  readonly departements = ['INFORMATIQUE', 'ELECTRIQUE', 'INDUS'];
  readonly departementsLabels: Record<string, string> = {
    INFORMATIQUE: 'Génie Informatique',
    ELECTRIQUE: 'Génie Électrique',
    INDUS: 'Génie Industriel',
  };

  ngOnInit(): void {
    this.loadChefs();
  }

  get filteredChefs(): Chef[] {
    const term = this.recherche.trim().toLowerCase();
    if (!term) return this.chefs;
    return this.chefs.filter(
      (c) =>
        c.name?.toLowerCase().includes(term) ||
        c.email?.toLowerCase().includes(term) ||
        c.departement?.toLowerCase().includes(term),
    );
  }

  loadChefs(): void {
    this.chargement = true;
    this.erreur = '';
    this.service.findAll().subscribe({
      next: (data: Chef[]) => {
        this.chefs = data;
        this.chargement = false;
      },
      error: () => {
        this.erreur = 'Erreur lors du chargement des chefs';
        this.chargement = false;
      },
    });
  }

  // ── Circle helpers ──
  /** Stroke-dashoffset for a circle with r=40 (circumference ≈ 251.2) */
  getOffset(value: number, total: number): number {
    if (total === 0) return 251.2;
    const pct = Math.min(value / total, 1);
    return 251.2 * (1 - pct);
  }

  countByDept(dept: string): number {
    return this.chefs.filter((c) => c.departement === dept).length;
  }

  getPct(dept: string): number {
    if (this.totalChefs === 0) return 0;
    return Math.round((this.countByDept(dept) / this.totalChefs) * 100);
  }

  getInitials(name: string | undefined): string {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  // ── Modal création ──
  modalCreationOuverte = false;
  nouveauChef: Partial<Chef> = {};
  erreurCreation = '';
  enCreation = false;

  ouvrirModalCreation(): void {
    this.nouveauChef = { departement: 'INFORMATIQUE' };
    this.erreurCreation = '';
    this.modalCreationOuverte = true;
  }

  fermerModalCreation(): void {
    this.modalCreationOuverte = false;
  }

  creerChef(): void {
    if (!this.nouveauChef.name?.trim()) {
      this.erreurCreation = 'Le nom complet est obligatoire !';
      return;
    }
    if (!this.nouveauChef.email?.trim()) {
      this.erreurCreation = "L'email est obligatoire !";
      return;
    }
    if (!this.nouveauChef.email.match(/^[a-zA-Z0-9._%+-]+@enicar\.ucar\.tn$/)) {
      this.erreurCreation = "L'email doit être au format @enicar.ucar.tn !";
      return;
    }
    if (!this.nouveauChef.phoneNumber?.trim()) {
      this.erreurCreation = 'Le téléphone est obligatoire !';
      return;
    }
    if (!this.nouveauChef.phoneNumber.match(/^[0-9]{8}$/)) {
      this.erreurCreation = 'Le téléphone doit contenir exactement 8 chiffres !';
      return;
    }
    if (!this.nouveauChef.departement) {
      this.erreurCreation = 'Le département est obligatoire !';
      return;
    }

    this.enCreation = true;
    this.service.create(this.nouveauChef).subscribe({
      next: () => {
        this.enCreation = false;
        this.fermerModalCreation();
        this.loadChefs();
      },
      error: (err: any) => {
        this.enCreation = false;
        this.erreurCreation = err.error?.message ?? 'Erreur lors de la création';
      },
    });
  }

  // ── Modal suppression ──
  modalSuppressionOuverte = false;
  chefASupprimer: Chef | null = null;
  enSuppression = false;

  ouvrirModalSuppression(chef: Chef): void {
    this.chefASupprimer = chef;
    this.modalSuppressionOuverte = true;
  }

  fermerModalSuppression(): void {
    this.modalSuppressionOuverte = false;
    this.chefASupprimer = null;
    this.enSuppression = false;
  }

  confirmerSuppression(): void {
    if (!this.chefASupprimer) return;
    this.enSuppression = true;
    this.service.delete(this.chefASupprimer.id).subscribe({
      next: () => {
        this.enSuppression = false;
        this.chefs = this.chefs.filter((c) => c.id !== this.chefASupprimer!.id);
        this.fermerModalSuppression();
      },
      error: () => {
        this.enSuppression = false;
        this.erreur = 'Erreur lors de la suppression';
        this.fermerModalSuppression();
      },
    });
  }
}
