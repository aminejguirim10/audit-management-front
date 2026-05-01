import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs/operators';
import { StudentIdeaService } from '../../../../services/student-idea.service';
import { CommentService } from '../../../../services/comment.service';
import { VoteService } from '../../../../services/vote.service';
import {
  FindOneIdeaDto,
  AddCommentDto,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  STATUS_LABELS,
  STATUS_COLORS,
} from '../../../../models/student-idea.model';

@Component({
  selector: 'app-etudiant-dashboard-page',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './etudiant-dashboard-page.html',
  styleUrl: './etudiant-dashboard-page.css',
})
export class EtudiantDashboardPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly ideaService = inject(StudentIdeaService);
  private readonly commentService = inject(CommentService);
  private readonly voteService = inject(VoteService);
  private readonly toastr = inject(ToastrService);

  readonly ideas = signal<FindOneIdeaDto[]>([]);
  readonly loading = signal(false);
  readonly activeCommentIdeaId = signal<number | null>(null);
  readonly votingId = signal<number | null>(null);
  readonly filterStatus = signal<'TOUS' | 'ENCOURS' | 'ACCEPTE' | 'REJETE'>('TOUS');
  readonly hasIdeasWithMissingIds = computed(() =>
    this.ideas().some((idea) => idea.id == null)
  );

  readonly statusOptions: Array<'TOUS' | 'ENCOURS' | 'ACCEPTE' | 'REJETE'> = [
    'TOUS',
    'ENCOURS',
    'ACCEPTE',
    'REJETE',
  ];

  readonly categoryLabels = CATEGORY_LABELS;
  readonly categoryColors = CATEGORY_COLORS;
  readonly statusLabels = STATUS_LABELS;
  readonly statusColors = STATUS_COLORS;

  // Statistiques
  readonly totalIdeas = computed(() => this.ideas().length);
  readonly acceptedIdeas = computed(() => 
    this.ideas().filter(idea => idea.status === 'ACCEPTE').length
  );
  readonly pendingIdeas = computed(() => 
    this.ideas().filter(idea => idea.status === 'ENCOURS').length
  );
  readonly totalVotes = computed(() => 
    this.ideas().reduce((sum, idea) => sum + idea.voteCount, 0)
  );
  readonly totalComments = computed(() => 
    this.ideas().reduce((sum, idea) => sum + (idea.comments?.length ?? 0), 0)
  );
  readonly topIdea = computed(() => {
    const sorted = [...this.ideas()].sort((a, b) => b.voteCount - a.voteCount);
    return sorted[0] ?? null;
  });

  readonly filteredIdeas = computed(() => {
    const status = this.filterStatus();
    if (status === 'TOUS') return this.ideas();
    return this.ideas().filter(idea => idea.status === status);
  });

  readonly commentForm = this.fb.nonNullable.group({
    content: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
  });

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
          this.ideas.set(data);
        },
        error: (err) => {
          const message = err.error?.message ?? 'Erreur lors du chargement des idées';
          this.toastr.error(message, 'Erreur');
        },
      });
  }

  toggleComments(ideaId: number | undefined): void {
    if (!ideaId) {
      this.toastr.warning('Impossible d\'afficher les commentaires', 'Attention');
      return;
    }
    const next = this.activeCommentIdeaId() === ideaId ? null : ideaId;
    this.activeCommentIdeaId.set(next);
    if (next === null) {
      this.commentForm.reset();
    }
  }

  toggleVote(ideaId: number | undefined): void {
    if (!ideaId) {
      this.toastr.warning('Impossible de voter sur cette idée', 'Attention');
      return;
    }

    this.votingId.set(ideaId);
    this.voteService
      .toggle({ ideaId })
      .pipe(finalize(() => this.votingId.set(null)))
      .subscribe({
        next: () => {
          this.loadIdeas();
          this.toastr.success('Vote mis à jour', 'Succès');
        },
        error: (err) => {
          const message = err.error?.message ?? 'Erreur lors du vote';
          this.toastr.error(message, 'Erreur');
        },
      });
  }

  cancelCommenting(): void {
    this.activeCommentIdeaId.set(null);
    this.commentForm.reset();
  }

  submitComment(ideaId: number | undefined): void {
    if (!ideaId) {
      this.toastr.warning('Impossible de commenter cette idée', 'Attention');
      return;
    }

    if (this.commentForm.invalid) {
      this.commentForm.markAllAsTouched();
      return;
    }

    const dto: AddCommentDto = {
      content: this.commentForm.getRawValue().content,
      ideaId,
    };

    this.commentService.add(dto).subscribe({
      next: () => {
        this.toastr.success('Commentaire ajouté', 'Succès');
        this.commentForm.reset();
        this.loadIdeas();
      },
      error: (err) => {
        const message = err.error?.message ?? 'Erreur lors de l\'ajout du commentaire';
        this.toastr.error(message, 'Erreur');
      },
    });
  }

  getStatusBadgeClass(status: string): string {
    return `status-badge ${this.statusColors[status as keyof typeof this.statusColors] || 'bg-gray-100'}`;
  }

  getCategoryBadgeClass(category: string): string {
    return `category-badge ${this.categoryColors[category as keyof typeof this.categoryColors] || 'bg-gray-100'}`;
  }
}
