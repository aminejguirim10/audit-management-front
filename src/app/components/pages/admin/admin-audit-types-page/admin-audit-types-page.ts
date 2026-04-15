import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TypeAuditService } from '../../../../services/type-audit.service';
import { TypeAudit, AddTypeAuditDto, UpdateTypeAuditDto } from '../../../../models/type-audit.model';

@Component({
  selector: 'app-admin-audit-types-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-audit-types-page.html',
  styleUrl: './admin-audit-types-page.css'
})
export class AdminAuditTypesPage implements OnInit {
  private typeAuditService = inject(TypeAuditService);

  typesAudits: TypeAudit[] = [];
  chargement = false;
  erreur = '';
  recherche = '';

  // Modal création
  modalCreationOuverte = false;
  nouveauType: AddTypeAuditDto = { name: '', description: '', color: '#3B82F6' };
  erreurCreation = '';

  // Modal modification
  modalModificationOuverte = false;
  typeEnModification: TypeAudit | null = null;
  modificationDto: UpdateTypeAuditDto = {};
  erreurModification = '';

  // Modal suppression
  modalSuppressionOuverte = false;
  typeASupprimer: TypeAudit | null = null;

  ngOnInit(): void {
    this.chargerTypes();
  }

  get typesAuditsFiltres(): TypeAudit[] {
    if (!this.recherche.trim()) return this.typesAudits;
    const terme = this.recherche.toLowerCase().trim();
    return this.typesAudits.filter(t =>
      t.name.toLowerCase().includes(terme) ||
      t.description.toLowerCase().includes(terme) ||
      t.color.toLowerCase().includes(terme)
    );
  }

  chargerTypes(): void {
    this.chargement = true;
    this.typeAuditService.findAll().subscribe({
      next: (data) => {
        this.typesAudits = data;
        this.chargement = false;
      },
      error: () => {
        this.erreur = 'Erreur lors du chargement des types d\'audits';
        this.chargement = false;
      }
    });
  }

  // ===== CRÉATION =====
  ouvrirModalCreation(): void {
    this.nouveauType = { name: '', description: '', color: '#3B82F6' };
    this.erreurCreation = '';
    this.modalCreationOuverte = true;
  }

  fermerModalCreation(): void {
    this.modalCreationOuverte = false;
  }

  creer(): void {
  if (!this.nouveauType.name.trim()) {
    this.erreurCreation = 'Le nom est obligatoire !';
    return;
  }
  if (!this.nouveauType.description.trim()) {
    this.erreurCreation = 'La description est obligatoire !';
    return;
  }
  // Couleur vide
  if (!this.nouveauType.color.trim()) {
    this.erreurCreation = 'La couleur est obligatoire !';
    return;
  }
  // Couleur invalide
  if (!this.nouveauType.color.match(/^#[0-9A-Fa-f]{6}$/)) {
    this.erreurCreation = 'La couleur doit être un code hexadécimal valide (ex: #FF5733) !';
    return;
  }

  this.typeAuditService.add(this.nouveauType).subscribe({
    next: (type) => {
      this.typesAudits.push(type);
      this.fermerModalCreation();
    },
    error: (err: any) => {
      this.erreurCreation = err.error?.message ?? 'Erreur lors de la création';
    }
  });
}

  // ===== MODIFICATION =====
  ouvrirModalModification(type: TypeAudit): void {
    this.typeEnModification = type;
    this.modificationDto = { name: type.name, description: type.description, color: type.color };
    this.erreurModification = '';
    this.modalModificationOuverte = true;
  }

  fermerModalModification(): void {
    this.modalModificationOuverte = false;
    this.typeEnModification = null;
  }

  modifier(): void {
  if (!this.typeEnModification) return;

  if (this.modificationDto.name !== undefined && !this.modificationDto.name.trim()) {
    this.erreurModification = 'Le nom ne peut pas être vide !';
    return;
  }
  if (this.modificationDto.description !== undefined && !this.modificationDto.description.trim()) {
    this.erreurModification = 'La description ne peut pas être vide !';
    return;
  }
  // Couleur vide
  if (this.modificationDto.color !== undefined && !this.modificationDto.color.trim()) {
    this.erreurModification = 'La couleur est obligatoire !';
    return;
  }
  // Couleur invalide
  if (this.modificationDto.color && !this.modificationDto.color.match(/^#[0-9A-Fa-f]{6}$/)) {
    this.erreurModification = 'La couleur doit être un code hexadécimal valide (ex: #FF5733) !';
    return;
  }

  this.typeAuditService.update(this.typeEnModification.id, this.modificationDto).subscribe({
    next: (typeModifie: TypeAudit) => {
      const index = this.typesAudits.findIndex(t => t.id === typeModifie.id);
      if (index !== -1) this.typesAudits[index] = typeModifie;
      this.fermerModalModification();
    },
    error: (err: any) => {
      this.erreurModification = err.error?.message ?? 'Erreur lors de la modification';
    }
  });
}
  // ===== SUPPRESSION =====
  ouvrirModalSuppression(type: TypeAudit): void {
    this.typeASupprimer = type;
    this.modalSuppressionOuverte = true;
  }

  fermerModalSuppression(): void {
    this.modalSuppressionOuverte = false;
    this.typeASupprimer = null;
  }

  confirmerSuppression(): void {
    if (!this.typeASupprimer) return;
    this.typeAuditService.delete(this.typeASupprimer.id).subscribe({
      next: () => {
        this.typesAudits = this.typesAudits.filter(t => t.id !== this.typeASupprimer!.id);
        this.fermerModalSuppression();
      },
      error: () => {
        this.fermerModalSuppression();
      }
    });
  }
}