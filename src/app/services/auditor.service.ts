import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '../config/api.config';
import { ApiResponse } from '../models/api-response.model';
import { Auditor } from '../models/auditor.model';

@Injectable({ providedIn: 'root' })
export class AuditorService {
  private http = inject(HttpClient);
  private url = `${API_BASE_URL}/utilisateurs`;

  findAll(): Observable<Auditor[]> {
    return this.http.get<ApiResponse<Auditor[]>>(`${this.url}?role=AUDITEUR`).pipe(
      map(res => res.data ?? [])
    );
  }
  
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  create(auditorData: Partial<Auditor>): Observable<Auditor> {
    return this.http.post<ApiResponse<Auditor>>(`${API_BASE_URL}/auth/register`, {
      name: auditorData.name,
      email: auditorData.email,
      phoneNumber: auditorData.phoneNumber,
      department: auditorData.departement,
      role: 'AUDITEUR',
      password: 'Enicar2024'
    }).pipe(
      map(res => res.data as Auditor)
    );
  }
}
