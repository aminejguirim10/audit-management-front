import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '../config/api.config';
import { ApiResponse } from '../models/api-response.model';
import { AuditCorrectiveActionsCard } from '../models/corrective-action.model';

@Injectable({ providedIn: 'root' })
export class CorrectiveActionService {
  private http = inject(HttpClient);
  private url = `${API_BASE_URL}/corrective-actions`;

  findCurrentAuditeAudits(): Observable<AuditCorrectiveActionsCard[]> {
    return this.http
      .get<ApiResponse<AuditCorrectiveActionsCard[]>>(`${this.url}/audite/me`)
      .pipe(map((response) => response.data ?? []));
  }

  addCorrectiveAction(auditId: number, dto: { title: string; description: string; priority: string; tempsEstime: string }): Observable<void> {
    return this.http.post<ApiResponse<void>>(`${this.url}/audits/${auditId}`, dto).pipe(
      map(() => undefined)
    );
  }
}
