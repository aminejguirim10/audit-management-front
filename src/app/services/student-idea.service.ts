import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '../config/api.config';
import { ApiResponse } from '../models/api-response.model';
import {
  Idea,
  AddIdeaDto,
  FindOneIdeaDto,
  IdeaStatusUpdateDto,
} from '../models/student-idea.model';

@Injectable({ providedIn: 'root' })
export class StudentIdeaService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_BASE_URL}/ideas`;

  // Récupérer toutes les idées
  findAll(): Observable<FindOneIdeaDto[]> {
    return this.http.get<FindOneIdeaDto[]>(this.url);
  }

  // Récupérer mes idées (étudiant connecté)
  findMine(): Observable<FindOneIdeaDto[]> {
    return this.http.get<FindOneIdeaDto[]>(`${this.url}/mine`);
  }

  // Récupérer une idée par ID
  findById(id: number): Observable<FindOneIdeaDto> {
    return this.http.get<FindOneIdeaDto>(`${this.url}/${id}`);
  }

  // Ajouter une nouvelle idée
  add(dto: AddIdeaDto): Observable<void> {
    return this.http.post<ApiResponse<object>>(`${this.url}`, dto).pipe(
      map(() => undefined)
    );
  }

  // Mettre à jour le statut d'une idée (AUDITEUR uniquement)
  updateStatus(dto: IdeaStatusUpdateDto): Observable<void> {
    return this.http.put<ApiResponse<void>>(`${this.url}/status`, dto).pipe(
      map(() => undefined)
    );
  }
}
