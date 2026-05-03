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
  vue: 'cards' | 'table' = 'cards';

  // Palette de couleurs diversifiée et professionnelle
  readonly presetColors = [
    '#3B82F6', // Blue
    '#6366F1', // Indigo
    '#8B5CF6', // Violet
    '#EC4899', // Pink
    '#F43F5E', // Rose
    '#EF4444', // Red
    '#F59E0B', // Amber
    '#F97316', // Orange
    '#10B981', // Emerald
    '#22C55E', // Green
    '#14B8A6', // Teal
    '#06B6D4', // Cyan
    '#0EA5E9', // Sky
    '#64748B', // Slate
    '#475569', // Slate Dark
    '#1E293B'  // Navy
  ];

  
  modalCreationOuverte = false;
  nouveauType: AddTypeAuditDto = { name: '', description: '', color: '#6366F1' };
  erreurCreation = '';


  modalModificationOuverte = false;
  typeEnModification: TypeAudit | null = null;
  modificationDto: UpdateTypeAuditDto = {};
  erreurModification = '';

  
  modalSuppressionOuverte = false;
  typeASupprimer: TypeAudit | null = null;

  // Signaux de chargement pour les actions
  enTrainDeCreer = false;
  enTrainDeModifier = false;
  enTrainDeSupprimer = false;

  ngOnInit(): void { this.chargerTypes(); }

  get typesAuditsFiltres(): TypeAudit[] {
    if (!this.recherche.trim()) return this.typesAudits;
    const terme = this.recherche.toLowerCase().trim();
    return this.typesAudits.filter(t =>
      t.name.toLowerCase().includes(terme) ||
      t.description.toLowerCase().includes(terme) ||
      t.color.toLowerCase().includes(terme)
    );
  }

  
  getOffset(value: number, total: number): number {
    if (total === 0) return 289.03;
    return 289.03 * (1 - Math.min(value / total, 1));
  }

  get uniqueColors(): number {
    return new Set(this.typesAudits.map(t => t.color.toLowerCase())).size;
  }

  get colorPct(): number {
    if (this.typesAudits.length === 0) return 0;
    return Math.round((this.uniqueColors / this.typesAudits.length) * 100);
  }


  chargerTypes(): void {
    this.chargement = true;
    this.typeAuditService.findAll().subscribe({
      next: (data) => { this.typesAudits = data; this.chargement = false; },
      error: () => { this.erreur = "Erreur lors du chargement des types d'audits"; this.chargement = false; }
    });
  }


  ouvrirModalCreation(): void {
    this.nouveauType = { name: '', description: '', color: '#6366F1' };
    this.erreurCreation = '';
    this.modalCreationOuverte = true;
  }

  fermerModalCreation(): void { this.modalCreationOuverte = false; }

  creer(): void {
    if (!this.nouveauType.name.trim()) { this.erreurCreation = 'Le nom est obligatoire !'; return; }
    if (!this.nouveauType.description.trim()) { this.erreurCreation = 'La description est obligatoire !'; return; }
    if (!this.nouveauType.color.trim()) { this.erreurCreation = 'La couleur est obligatoire !'; return; }
    if (!this.nouveauType.color.match(/^#[0-9A-Fa-f]{6}$/)) {
      this.erreurCreation = 'La couleur doit être un code hexadécimal valide (ex: #6366F1) !'; return;
    }
    this.enTrainDeCreer = true;
    this.typeAuditService.add(this.nouveauType).subscribe({
      next: (type) => { 
        this.typesAudits.push(type); 
        this.fermerModalCreation();
        this.enTrainDeCreer = false;
      },
      error: (err: any) => { 
        this.erreurCreation = err.error?.message ?? 'Erreur lors de la création';
        this.enTrainDeCreer = false;
      }
    });
  }


  ouvrirModalModification(type: TypeAudit): void {
    this.typeEnModification = type;
    this.modificationDto = { name: type.name, description: type.description, color: type.color };
    this.erreurModification = '';
    this.modalModificationOuverte = true;
  }

  fermerModalModification(): void { this.modalModificationOuverte = false; this.typeEnModification = null; }

  modifier(): void {
    if (!this.typeEnModification) return;
    if (this.modificationDto.name !== undefined && !this.modificationDto.name.trim()) {
      this.erreurModification = 'Le nom ne peut pas être vide !'; return;
    }
    if (this.modificationDto.description !== undefined && !this.modificationDto.description.trim()) {
      this.erreurModification = 'La description ne peut pas être vide !'; return;
    }
    if (this.modificationDto.color && !this.modificationDto.color.match(/^#[0-9A-Fa-f]{6}$/)) {
      this.erreurModification = 'La couleur doit être un code hexadécimal valide !'; return;
    }
    this.enTrainDeModifier = true;
    this.typeAuditService.update(this.typeEnModification.id, this.modificationDto).subscribe({
      next: (typeModifie: TypeAudit) => {
        const index = this.typesAudits.findIndex(t => t.id === typeModifie.id);
        if (index !== -1) this.typesAudits[index] = typeModifie;
        this.fermerModalModification();
        this.enTrainDeModifier = false;
      },
      error: (err: any) => { 
        this.erreurModification = err.error?.message ?? 'Erreur lors de la modification';
        this.enTrainDeModifier = false;
      }
    });
  }

  // ── SUPPRESSION ──
  ouvrirModalSuppression(type: TypeAudit): void { this.typeASupprimer = type; this.modalSuppressionOuverte = true; }
  fermerModalSuppression(): void { this.modalSuppressionOuverte = false; this.typeASupprimer = null; }

  confirmerSuppression(): void {
    if (!this.typeASupprimer) return;
    this.enTrainDeSupprimer = true;
    this.typeAuditService.delete(this.typeASupprimer.id).subscribe({
      next: () => {
        this.typesAudits = this.typesAudits.filter(t => t.id !== this.typeASupprimer!.id);
        this.fermerModalSuppression();
        this.enTrainDeSupprimer = false;
      },
      error: () => { 
        this.fermerModalSuppression();
        this.enTrainDeSupprimer = false;
      }
    });
  }
}