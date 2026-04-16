import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '../config/api.config';
import { ApiResponse } from '../models/api-response.model';
import { MessageResponse, SendMessageRequest } from '../models/message.model';

@Injectable({ providedIn: 'root' })
export class MessageService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_BASE_URL}/messages`;
  private readonly defaultMessageLimit = 200;

  getMessagesByAudit(auditId: number): Observable<MessageResponse[]> {
    return this.http
      .get<
        ApiResponse<MessageResponse[]>
      >(`${this.url}/audits/${auditId}?limit=${this.defaultMessageLimit}`)
      .pipe(map((response) => (response.data ?? []).map((item) => this.normalizeMessage(item))));
  }

  sendMessage(auditId: number, payload: SendMessageRequest): Observable<MessageResponse> {
    return this.http
      .post<ApiResponse<MessageResponse>>(`${this.url}/audits/${auditId}`, payload)
      .pipe(
        map((response) => {
          if (!response.data) {
            throw new Error('Reponse invalide du serveur lors de lenvoi du message');
          }
          return this.normalizeMessage(response.data);
        }),
      );
  }

  private normalizeMessage(message: MessageResponse): MessageResponse {
    return {
      ...message,
      content: message.content == null ? '' : String(message.content),
    };
  }
}
