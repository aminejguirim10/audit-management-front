import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '../config/api.config';
import { ApiResponse } from '../models/api-response.model';
import { TypeAudit, AddTypeAuditDto, UpdateTypeAuditDto } from '../models/type-audit.model';

@Injectable({ providedIn: 'root' })
export class TypeAuditService {
  private http = inject(HttpClient);
  private url = `${API_BASE_URL}/types-audits`;

  // LISTE
  findAll(): Observable<TypeAudit[]> {
    return this.http.get<ApiResponse<TypeAudit[]>>(this.url).pipe(
      map(res => res.data ?? [])
    );
  }

  // CRÉATION
  add(dto: AddTypeAuditDto): Observable<TypeAudit> {
    return this.http.post<ApiResponse<TypeAudit>>(this.url, dto).pipe(
      map(res => res.data!)
    );
  }

  // MISE À JOUR
  update(id: number, dto: UpdateTypeAuditDto): Observable<TypeAudit> {
    return this.http.put<ApiResponse<TypeAudit>>(`${this.url}/${id}`, dto).pipe(
      map(res => res.data!)
    );
  }

  // SUPPRESSION
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
