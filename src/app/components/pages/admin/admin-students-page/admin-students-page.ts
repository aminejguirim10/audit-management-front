import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudentService } from '../../../../services/student.service';
import { Student } from '../../../../models/student.model';

@Component({
  selector: 'app-admin-students-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-students-page.html',
  styleUrl: './admin-students-page.css',
})
export class AdminStudentsPage implements OnInit {
  private service = inject(StudentService);
  students: Student[] = [];
  chargement = false;
  erreur = '';
  recherche = '';

  get totalStudents(): number { return this.students.length; }

  readonly departements = ['INFORMATIQUE', 'ELECTRIQUE', 'INDUS'];
  readonly departementsLabels: Record<string, string> = {
    'INFORMATIQUE': 'Génie Informatique',
    'ELECTRIQUE': 'Génie Électrique',
    'INDUS': 'Génie Industriel'
  };

  ngOnInit(): void { this.loadStudents(); }

  get filteredStudents(): Student[] {
    const term = this.recherche.trim().toLowerCase();
    if (!term) return this.students;
    return this.students.filter(s =>
      s.name?.toLowerCase().includes(term) ||
      s.email?.toLowerCase().includes(term) ||
      s.departement?.toLowerCase().includes(term)
    );
  }

  loadStudents(): void {
    this.chargement = true;
    this.erreur = '';
    this.service.findAll().subscribe({
      next: (data: Student[]) => { this.students = data; this.chargement = false; },
      error: () => { this.erreur = 'Erreur lors du chargement'; this.chargement = false; }
    });
  }

  // ── Circle helpers ──
  getOffset(value: number, total: number): number {
    if (total === 0) return 251.2;
    return 251.2 * (1 - Math.min(value / total, 1));
  }

  countByDept(dept: string): number {
    return this.students.filter(s => s.departement === dept).length;
  }

  getPct(dept: string): number {
    if (this.totalStudents === 0) return 0;
    return Math.round((this.countByDept(dept) / this.totalStudents) * 100);
  }

  getInitials(name: string | undefined): string {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  // ── Modal création ──
  modalCreationOuverte = false;
  nouveauStudent: Partial<Student> = {};
  erreurCreation = '';
  enCreation = false;

  ouvrirModalCreation(): void {
    this.nouveauStudent = { departement: 'INFORMATIQUE' };
    this.erreurCreation = '';
    this.modalCreationOuverte = true;
  }

  fermerModalCreation(): void { this.modalCreationOuverte = false; }

  creerStudent(): void {
    if (!this.nouveauStudent.name?.trim()) { this.erreurCreation = 'Le nom est obligatoire !'; return; }
    if (!this.nouveauStudent.email?.trim()) { this.erreurCreation = "L'email est obligatoire !"; return; }
    if (!this.nouveauStudent.email.match(/^[a-zA-Z0-9._%+-]+@enicar\.ucar\.tn$/)) {
      this.erreurCreation = "L'email doit être au format @enicar.ucar.tn !"; return;
    }
    if (!this.nouveauStudent.phoneNumber?.trim()) { this.erreurCreation = 'Le téléphone est obligatoire !'; return; }
    if (!this.nouveauStudent.phoneNumber.match(/^[0-9]{8}$/)) {
      this.erreurCreation = 'Le téléphone doit contenir exactement 8 chiffres !'; return;
    }
    if (!this.nouveauStudent.departement) { this.erreurCreation = 'Le département est obligatoire !'; return; }
    
    this.enCreation = true;
    this.service.create(this.nouveauStudent).subscribe({
      next: () => { 
        this.enCreation = false;
        this.fermerModalCreation(); 
        this.loadStudents(); 
      },
      error: (err: any) => { 
        this.enCreation = false;
        this.erreurCreation = err.error?.message ?? 'Erreur lors de la création'; 
      }
    });
  }

  // ── Modal suppression ──
  modalSuppressionOuverte = false;
  studentASupprimer: Student | null = null;
  enSuppression = false;

  ouvrirModalSuppression(student: Student): void {
    this.studentASupprimer = student;
    this.modalSuppressionOuverte = true;
  }

  fermerModalSuppression(): void {
    this.modalSuppressionOuverte = false;
    this.studentASupprimer = null;
    this.enSuppression = false;
  }

  confirmerSuppression(): void {
    if (!this.studentASupprimer) return;
    this.enSuppression = true;
    this.service.delete(this.studentASupprimer.id).subscribe({
      next: () => {
        this.enSuppression = false;
        this.students = this.students.filter(s => s.id !== this.studentASupprimer!.id);
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