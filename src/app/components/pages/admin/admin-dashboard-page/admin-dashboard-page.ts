import { Component, OnInit, OnDestroy, inject, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../../../../config/api.config';
import { ApiResponse } from '../../../../models/api-response.model';
import { TypeAuditService } from '../../../../services/type-audit.service';
import { TypeAudit } from '../../../../models/type-audit.model';
import { AuditService } from '../../../../services/audit.service';
import { Audit } from '../../../../models/audit.model';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface UserStatistiques {
  totalUtilisateurs: number;
  parRole: Record<string, number>;
  parDepartement: Record<string, number>;
}

@Component({
  selector: 'app-admin-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-dashboard-page.html',
  styleUrl: './admin-dashboard-page.css',
})
export class AdminDashboardPage implements OnInit, AfterViewInit, OnDestroy {
  private http = inject(HttpClient);
  private typeAuditService = inject(TypeAuditService);
  private auditService = inject(AuditService);

  statistiques: UserStatistiques | null = null;
  typesAudits: TypeAudit[] = [];
  audits: Audit[] = [];
  chargement = false;
  erreur = '';

  private barChart: Chart | null = null;
  private pieChart: Chart | null = null;

  readonly departementsLabels: Record<string, string> = {
    'INFORMATIQUE': 'Génie Informatique',
    'ELECTRIQUE': 'Génie Électrique',
    'INDUS': 'Génie Industriel'
  };

  readonly rolesLabels: Record<string, string> = {
    'ADMIN': 'Administrateurs',
    'AUDITEUR': 'Auditeurs',
    'AUDITE': 'Chefs dept.',
    'ETUDIANT': 'Étudiants'
  };

  readonly rolesIcons: Record<string, string> = {
    'ADMIN': '🛡️',
    'AUDITEUR': '🔍',
    'AUDITE': '👥',
    'ETUDIANT': '🎓'
  };

  readonly rolesColors: Record<string, string> = {
    'ADMIN': '#8B5CF6',
    'AUDITEUR': '#3B82F6',
    'AUDITE': '#10B981',
    'ETUDIANT': '#F59E0B'
  };

  readonly rolesBg: Record<string, string> = {
    'ADMIN': '#F5F3FF',
    'AUDITEUR': '#EFF6FF',
    'AUDITE': '#ECFDF5',
    'ETUDIANT': '#FFFBEB'
  };

  readonly moisData = {
    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'],
    values: [12, 16, 14, 21, 28, 26]
  };

 
  get totalAudits(): number { return this.audits.length; }
  get auditsPlanifies(): number { return this.audits.filter(a => a.status === 'PLANIFIE').length; }
  get auditsEnCours(): number { return this.audits.filter(a => a.status === 'EN_COURS').length; }
  get auditsTermines(): number { return this.audits.filter(a => a.status === 'TERMINEE').length; }

  ngOnInit(): void {
    this.chargerStatistiques();
    this.chargerTypesAudits();
    this.chargerAudits();
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.initCharts(), 500);
  }

  ngOnDestroy(): void {
    this.barChart?.destroy();
    this.pieChart?.destroy();
  }

  chargerStatistiques(): void {
    this.chargement = true;
    this.http.get<ApiResponse<UserStatistiques>>(`${API_BASE_URL}/utilisateurs/statistiques`)
      .subscribe({
        next: (res) => {
          this.statistiques = res.data;
          this.chargement = false;
          setTimeout(() => this.initCharts(), 100);
        },
        error: () => {
          this.erreur = 'Erreur lors du chargement';
          this.chargement = false;
        }
      });
  }

  chargerTypesAudits(): void {
    this.typeAuditService.findAll().subscribe({
      next: (data) => {
        this.typesAudits = data;
        setTimeout(() => this.initPieChart(), 100);
      },
      error: () => {}
    });
  }

  chargerAudits(): void {
    this.auditService.findAll().subscribe({
      next: (data) => { this.audits = data; },
      error: () => {}
    });
  }

  initCharts(): void {
    this.initBarChart();
    this.initPieChart();
  }

  initBarChart(): void {
    const canvas = document.getElementById('barChart') as HTMLCanvasElement;
    if (!canvas) return;
    this.barChart?.destroy();
    this.barChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: this.moisData.labels,
        datasets: [{
          label: 'audits',
          data: this.moisData.values,
          backgroundColor: '#6366F1',
          borderRadius: 8,
          hoverBackgroundColor: '#4F46E5'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: (items: any) => items[0].label,
              label: (item: any) => `audits : ${item.raw}`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: '#F1F5F9' },
            ticks: { color: '#94A3B8', font: { size: 11 } }
          },
          x: {
            grid: { display: false },
            ticks: { color: '#94A3B8', font: { size: 11 } }
          }
        }
      }
    });
  }

  initPieChart(): void {
    const canvas = document.getElementById('pieChart') as HTMLCanvasElement;
    if (!canvas || this.typesAudits.length === 0) return;
    this.pieChart?.destroy();
    this.pieChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: this.typesAudits.map(t => t.name),
        datasets: [{
          data: this.typesAudits.map(() => Math.floor(Math.random() * 40) + 10),
          backgroundColor: this.typesAudits.map(t => t.color),
          borderWidth: 3,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 14,
              font: { size: 11 },
              color: '#64748B',
              usePointStyle: true,
              pointStyleWidth: 8
            }
          }
        }
      }
    });
  }

  getRoleKeys(): string[] {
    return this.statistiques ? Object.keys(this.statistiques.parRole) : [];
  }

  getDepartementKeys(): string[] {
    return this.statistiques ? Object.keys(this.statistiques.parDepartement) : [];
  }

  getMaxDepartement(): number {
    if (!this.statistiques) return 1;
    return Math.max(...Object.values(this.statistiques.parDepartement));
  }

  getBarWidth(value: number): string {
    const max = this.getMaxDepartement();
    return max > 0 ? `${(value / max) * 100}%` : '0%';
  }

  getBarHeight(value: number): number {
    const maxVal = this.statistiques
      ? Math.max(...Object.values(this.statistiques.parRole))
      : 1;
    return maxVal > 0 ? Math.round((value / maxVal) * 30) + 8 : 8;
  }
}