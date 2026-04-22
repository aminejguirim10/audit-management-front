import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '../config/api.config';
import { ApiResponse } from '../models/api-response.model';
import { Audit } from '../models/audit.model';

@Injectable({ providedIn: 'root' })
export class AuditService {
  private http = inject(HttpClient);
  private url = `${API_BASE_URL}/audits`;

  findAll(): Observable<Audit[]> {
    return this.http.get<any>(this.url).pipe(
      map(res => {
        // Handle both cases: wrapped in ApiResponse { data: [...] } or direct array [...]
        if (res && res.data && Array.isArray(res.data)) {
          return res.data;
        }
        return Array.isArray(res) ? res : [];
      })
    );
  }

  findById(id: number): Observable<Audit> {
    return this.http.get<any>(`${this.url}/${id}`).pipe(
      map(res => {
        if (res && res.data) {
          return res.data;
        }
        return res;
      })
    );
  }
}