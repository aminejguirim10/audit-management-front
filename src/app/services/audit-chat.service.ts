import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '../config/api.config';
import { ApiResponse } from '../models/api-response.model';
import { ChatAuditSummary } from '../models/audit-chat.model';

@Injectable({ providedIn: 'root' })
export class AuditChatService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_BASE_URL}/audits`;

  findMyChatAudits(): Observable<ChatAuditSummary[]> {
    return this.http
      .get<ApiResponse<ChatAuditSummary[]>>(`${this.url}/me/chat`)
      .pipe(map((response) => response.data ?? []));
  }

  findMyChatAuditById(auditId: number): Observable<ChatAuditSummary | null> {
    return this.http
      .get<ApiResponse<ChatAuditSummary>>(`${this.url}/me/chat/${auditId}`)
      .pipe(map((response) => response.data ?? null));
  }
}
