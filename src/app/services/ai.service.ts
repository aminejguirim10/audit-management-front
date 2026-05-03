import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AiCorrectiveAction {
  title: string;
  description: string;
  temps_estime: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface AiResponse {
  totalQuestions: number;
  generatedAt: string;
  actions: AiCorrectiveAction[];
}

@Injectable({ providedIn: 'root' })
export class AiService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.aiAssistantApiUrl}/chat`;

  analyzeFailedQuestions(failedQuestions: string[]): Observable<AiResponse> {
    return this.http.post<AiResponse>(this.url, { failedQuestions });
  }
}
