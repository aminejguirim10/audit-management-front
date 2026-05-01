import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs/operators';
import { StudentIdeaService } from '../../../../services/student-idea.service';
import { ToastrService } from 'ngx-toastr';
import {
  FindOneIdeaDto,
  IdeaStatusUpdateDto,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  STATUS_LABELS,
  STATUS_COLORS,
  DEPARTMENT_LABELS,
  IdeaStatus,
} from '../../../../models/student-idea.model';

type IdeaWithRuntimeId = FindOneIdeaDto & { runtimeId: number };

@Component({
  selector: 'app-auditeur-student-ideas-page',
  imports: [CommonModule],
  templateUrl: './auditeur-student-ideas-page.html',
  styleUrl: './auditeur-student-ideas-page.css',
})

export class AuditeurStudentIdeasPage implements OnInit {
  private readonly ideaService = inject(StudentIdeaService);
  private readonly toastr = inject(ToastrService);

  // Signaux
  readonly ideas = signal<IdeaWithRuntimeId[]>([]);
  readonly loading = signal(false);
  readonly searchTerm = signal('');
  readonly filterStatus = signal<'TOUS' | 'ENCOURS' | 'ACCEPTE' | 'REJETE'>('TOUS');
  readonly updatingIdeaId = signal<number | null>(null);
  readonly activeCommentIdeaId = signal<number | null>(null);
  readonly hasIdeasWithMissingIds = computed(() =>
    this.ideas().some((idea) => idea.id == null)
  );
  readonly totalIdeas = computed(() => this.ideas().length);
  readonly pendingIdeas = computed(() =>
    this.ideas().filter((idea) => idea.status === 'ENCOURS').length
  );
  readonly acceptedIdeas = computed(() =>
    this.ideas().filter((idea) => idea.status === 'ACCEPTE').length
  );
  readonly rejectedIdeas = computed(() =>
    this.ideas().filter((idea) => idea.status === 'REJETE').length
  );

  // Computed signals
  readonly filteredIdeas = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const status = this.filterStatus();

    return this.ideas().filter((idea) => {
      const matchesSearch =
        idea.title.toLowerCase().includes(term) ||
        idea.description.toLowerCase().includes(term) ||
        idea.studentName.toLowerCase().includes(term);

      const matchesStatus = status === 'TOUS' || idea.status === status;

      return matchesSearch && matchesStatus;
    });
  });

  readonly categoryLabels = CATEGORY_LABELS;
  readonly categoryColors = CATEGORY_COLORS;
  readonly statusLabels = STATUS_LABELS;
  readonly statusColors = STATUS_COLORS;
  readonly departmentLabels = DEPARTMENT_LABELS;

  ngOnInit(): void {
    this.loadIdeas();
  }

  private loadIdeas(): void {
    this.loading.set(true);
    this.ideaService
      .findAll()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => {
          const ideasWithIds = data.map((idea, index) => ({
            ...idea,
            runtimeId: index + 1,
          }));
          this.ideas.set(ideasWithIds);
        },
        error: (err) => {
          const message = err.error?.message ?? 'Erreur lors du chargement des idées';
          this.toastr.error(message, 'Erreur');
        },
      });
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  toggleComments(runtimeId: number): void {
    this.activeCommentIdeaId.update((current) => (current === runtimeId ? null : runtimeId));
  }

  updateStatus(idea: IdeaWithRuntimeId, status: IdeaStatus): void {
    if (!idea.id) {
      this.toastr.error('Impossible de mettre à jour cette idée : identifiant manquant', 'Erreur');
      console.error('Missing idea id for update', idea);
      return;
    }

    const dto: IdeaStatusUpdateDto = {
      ideaId: idea.id,
      status,
    };

    this.updatingIdeaId.set(idea.id);

    this.ideaService
      .updateStatus(dto)
      .pipe(finalize(() => this.updatingIdeaId.set(null)))
      .subscribe({
        next: () => {
          this.ideas.update((current) =>
            current.map((i) => (i.id === idea.id ? { ...i, status } : i))
          );
          this.toastr.success('Statut de l\'idée mis à jour avec succès', 'Succès');
        },
        error: (err) => {
          const message = err.error?.message ?? 'Erreur lors de la mise à jour du statut';
          this.toastr.error(message, 'Erreur');
        },
      });
  }

  getStatusBadgeClass(status: IdeaStatus): string {
    const classes: Record<IdeaStatus, string> = {
      ENCOURS: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      ACCEPTE: 'bg-green-100 text-green-800 border-green-300',
      REJETE: 'bg-red-100 text-red-800 border-red-300',
    };
    return classes[status] || '';
  }

  getCategoryBadgeClass(category: string): string {
    return this.categoryColors[category as keyof typeof this.categoryColors] || '';
  }
}
