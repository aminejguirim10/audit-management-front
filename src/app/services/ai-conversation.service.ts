import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '../config/api.config';
import { ApiResponse } from '../models/api-response.model';
import {
  AiConversationDetails,
  AiConversationSummary,
  PersistAiConversationTurnRequest,
} from '../models/ai-conversation.model';

@Injectable({ providedIn: 'root' })
export class AiConversationService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_BASE_URL}/ai-conversations`;

  listMine(): Observable<AiConversationSummary[]> {
    return this.http
      .get<ApiResponse<AiConversationSummary[]>>(`${this.url}/me`)
      .pipe(map((response) => response.data ?? []));
  }

  createMine(title?: string): Observable<AiConversationSummary> {
    const normalizedTitle = title?.trim() ?? '';
    const safeTitle = normalizedTitle ? normalizedTitle.slice(0, 180) : null;
    const payload = { title: safeTitle };

    return this.http.post<ApiResponse<AiConversationSummary>>(`${this.url}/me`, payload).pipe(
      map((response) => {
        if (!response.data) {
          throw new Error('Reponse invalide du serveur lors de la creation de conversation IA');
        }
        return response.data;
      }),
    );
  }

  updateMineTitle(conversationId: number, title: string): Observable<AiConversationSummary> {
    const normalizedTitle = title.trim().replace(/\s+/g, ' ');
    const safeTitle = normalizedTitle.slice(0, 180);

    return this.http
      .put<ApiResponse<AiConversationSummary>>(`${this.url}/me/${conversationId}`, {
        title: safeTitle,
      })
      .pipe(
        map((response) => {
          if (!response.data) {
            throw new Error(
              'Reponse invalide du serveur lors de la mise a jour de conversation IA',
            );
          }
          return response.data;
        }),
      );
  }

  deleteMine(conversationId: number): Observable<void> {
    return this.http
      .delete<ApiResponse<null>>(`${this.url}/me/${conversationId}`)
      .pipe(map(() => undefined));
  }

  getMineById(conversationId: number): Observable<AiConversationDetails> {
    return this.http
      .get<ApiResponse<AiConversationDetails>>(`${this.url}/me/${conversationId}`)
      .pipe(
        map((response) => {
          if (!response.data) {
            throw new Error('Conversation IA introuvable ou inaccessible');
          }
          return response.data;
        }),
      );
  }

  saveTurn(
    conversationId: number,
    payload: PersistAiConversationTurnRequest,
  ): Observable<AiConversationSummary> {
    return this.http
      .post<ApiResponse<AiConversationSummary>>(`${this.url}/me/${conversationId}/turns`, payload)
      .pipe(
        map((response) => {
          if (!response.data) {
            throw new Error('Reponse invalide du serveur lors de lenregistrement du tour IA');
          }
          return response.data;
        }),
      );
  }
}
