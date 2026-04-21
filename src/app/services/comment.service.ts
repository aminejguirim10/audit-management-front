import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '../config/api.config';
import { ApiResponse } from '../models/api-response.model';
import { AddCommentDto, CommentSummary } from '../models/student-idea.model';

@Injectable({ providedIn: 'root' })
export class CommentService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_BASE_URL}/comments`;

  // Ajouter un commentaire
  add(dto: AddCommentDto): Observable<void> {
    return this.http.post<ApiResponse<object>>(this.url, dto).pipe(
      map(() => undefined)
    );
  }

  // Récupérer les commentaires d'une idée
  getByIdea(ideaId: number): Observable<CommentSummary[]> {
    return this.http.get<ApiResponse<CommentSummary[]>>(
      `${this.url}/ideas/${ideaId}`
    ).pipe(
      map(res => res.data ?? [])
    );
  }

  // Supprimer un commentaire
  delete(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.url}/${id}`).pipe(
      map(() => undefined)
    );
  }
}
