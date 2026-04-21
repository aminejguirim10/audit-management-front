import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '../config/api.config';
import { ApiResponse } from '../models/api-response.model';
import { AddVoteDto } from '../models/student-idea.model';

@Injectable({ providedIn: 'root' })
export class VoteService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_BASE_URL}/votes`;

  // Toggle vote (ajouter ou retirer un vote)
  toggle(dto: AddVoteDto): Observable<void> {
    return this.http.post<ApiResponse<void>>(`${this.url}/toggle`, dto).pipe(
      map(() => undefined)
    );
  }
}
