import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs/operators';
import { StudentIdeaService } from '../../../../services/student-idea.service';
import { CommentService } from '../../../../services/comment.service';
import { VoteService } from '../../../../services/vote.service';
import { AuthService } from '../../../../services/auth.service';
import {
  FindOneIdeaDto,
  AddCommentDto,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  STATUS_LABELS,
  STATUS_COLORS,
} from '../../../../models/student-idea.model';

type IdeaWithRuntimeId = FindOneIdeaDto & { runtimeId: number };

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faGraduationCap,
  faBriefcase,
  faTools,
  faEllipsisH,
  faClock,
  faCheckCircle,
  faTimesCircle,
  faComment,
  faChevronDown,
  faChevronUp,
  faSearch,
  faEye
} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-etudiant-my-ideas-page',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, FontAwesomeModule],
  templateUrl: './etudiant-my-ideas-page.html',
  styleUrl: './etudiant-my-ideas-page.css',
})
export class EtudiantMyIdeasPage implements OnInit {
  // Icons
  faGraduationCap = faGraduationCap;
  faBriefcase = faBriefcase;
  faTools = faTools;
  faEllipsisH = faEllipsisH;
  faClock = faClock;
  faCheckCircle = faCheckCircle;
  faTimesCircle = faTimesCircle;
  faComment = faComment;
  faChevronDown = faChevronDown;
  faChevronUp = faChevronUp;
  faSearch = faSearch;
  faEye = faEye;
  private readonly fb = inject(FormBuilder);
  private readonly ideaService = inject(StudentIdeaService);
  private readonly commentService = inject(CommentService);
  private readonly voteService = inject(VoteService);
  private readonly authService = inject(AuthService);
  private readonly toastr = inject(ToastrService);

  readonly ideas = signal<IdeaWithRuntimeId[]>([]);
  readonly loading = signal(false);
  readonly searchTerm = signal('');
  readonly activeCommentIdeaId = signal<number | null>(null);
  readonly votingId = signal<number | null>(null);
  readonly totalIdeas = computed(() => this.ideas().length);
  readonly acceptedIdeas = computed(
    () => this.ideas().filter((idea) => idea.status === 'ACCEPTE').length,
  );
  readonly pendingIdeas = computed(
    () => this.ideas().filter((idea) => idea.status === 'ENCOURS').length,
  );
  readonly totalComments = computed(() =>
    this.ideas().reduce((sum, idea) => sum + idea.comments.length, 0),
  );

  readonly filteredIdeas = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.ideas();
    return this.ideas().filter(
      (idea) =>
        idea.title.toLowerCase().includes(term) || idea.description.toLowerCase().includes(term),
    );
  });

  readonly categoryLabels = CATEGORY_LABELS;
  readonly categoryColors = CATEGORY_COLORS;
  readonly statusLabels = STATUS_LABELS;
  readonly statusColors = STATUS_COLORS;

  readonly commentForm = this.fb.nonNullable.group({
    content: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
  });

  ngOnInit(): void {
    this.loadIdeas();
  }

  private loadIdeas(): void {
    this.loading.set(true);
    this.ideaService
      .findMine()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => {
          const ideasWithIds = data.map((idea, index) => ({
            ...idea,
            runtimeId: index + 1,
          }));
          this.ideas.set(ideasWithIds);
          this.activeCommentIdeaId.set(null);
        },
        error: (err) => {
          const message = err.error?.message ?? 'Erreur lors du chargement de vos idées';
          this.toastr.error(message, 'Erreur');
        },
      });
  }

  toggleComments(runtimeId: number): void {
    const nextId = this.activeCommentIdeaId() === runtimeId ? null : runtimeId;
    this.activeCommentIdeaId.set(nextId);
    if (nextId !== null) {
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
        const studentName =
          this.authService.user()?.name ?? this.authService.user()?.email ?? 'Moi';

        this.ideas.update((ideas) =>
          ideas.map((idea) => {
            if (idea.id === ideaId) {
              return {
                ...idea,
                comments: [
                  ...(idea.comments || []),
                  {
                    id: Date.now(),
                    content: dto.content,
                    createdAt: new Date().toISOString(),
                    studentName: studentName,
                  },
                ],
              };
            }
            return idea;
          }),
        );

        this.toastr.success('Commentaire ajouté', 'Succès');
        this.commentForm.reset();
      },
      error: (err) => {
        const message = err.error?.message ?? "Erreur lors de l'ajout du commentaire";
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

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm.set(target.value);
  }

  getCategoryIcon(category: string): any {
    switch (category) {
      case 'ACADEMIQUE': return this.faGraduationCap;
      case 'SERVICES': return this.faBriefcase;
      case 'INSTALLATIONS': return this.faTools;
      default: return this.faEllipsisH;
    }
  }

  getStatusIcon(status: string): any {
    switch (status) {
      case 'ENCOURS': return this.faClock;
      case 'ACCEPTE': return this.faCheckCircle;
      case 'REJETE': return this.faTimesCircle;
      default: return this.faClock;
    }
  }

  trackByIdea(index: number, idea: IdeaWithRuntimeId): number {
    return idea.runtimeId;
  }
}
