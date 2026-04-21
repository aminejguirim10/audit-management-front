import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '../config/api.config';
import { ApiResponse } from '../models/api-response.model';

export interface FindOneUserDto {
  id: number;
  name: string;
  email: string;
  phoneNumber: string;
  profilePhotoUrl: string;
  role: string;
  departement: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_BASE_URL}/utilisateurs`;

  findAllAudites(): Observable<FindOneUserDto[]> {
    return this.http.get<ApiResponse<FindOneUserDto[]>>(`${this.url}?role=AUDITE`).pipe(
      map(res => res.data ?? [])
    );
  }

  findByRole(role: string): Observable<FindOneUserDto[]> {
    return this.http.get<ApiResponse<FindOneUserDto[]>>(`${this.url}?role=${role}`).pipe(
      map(res => res.data ?? [])
    );
  }

  findAll(): Observable<FindOneUserDto[]> {
    return this.http.get<ApiResponse<FindOneUserDto[]>>(this.url).pipe(
      map(res => res.data ?? [])
    );
  }

  findById(id: number): Observable<FindOneUserDto> {
    return this.http.get<ApiResponse<FindOneUserDto>>(`${this.url}/${id}`).pipe(
      map(res => res.data!)
    );
  }
}
