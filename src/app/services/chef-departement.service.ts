import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '../config/api.config';
import { ApiResponse } from '../models/api-response.model';
import { Chef } from '../models/chef.model';

@Injectable({ providedIn: 'root' })
export class ChefDepartementService {
  private http = inject(HttpClient);
  private url = `${API_BASE_URL}/utilisateurs`;


  findAll(): Observable<Chef[]> {
    return this.http.get<ApiResponse<Chef[]>>(`${this.url}?role=AUDITE`).pipe(
      map(res => res.data ?? [])
    );
  }
  
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  create(chefData: Partial<Chef>): Observable<Chef> {
  return this.http.post<ApiResponse<Chef>>(`${API_BASE_URL}/auth/register`, {
    name: chefData.name,
    email: chefData.email,
    phoneNumber: chefData.phoneNumber,
    department: chefData.departement,
    role: 'AUDITE',
    password: 'Enicar2024!'
  }).pipe(
    map(res => res.data as Chef)
  );
}
}