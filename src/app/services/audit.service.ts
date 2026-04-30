import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { API_BASE_URL } from '../config/api.config';
import { ApiResponse, ErrorResponse } from '../models/api-response.model';
import { AuditSummary, AddAuditDto, AuditDetails, UpdateAuditDto } from '../models/audit.model';
import { UserService, FindOneUserDto } from './user.service';

@Injectable({ providedIn: 'root' })
export class AuditService {
  private readonly http = inject(HttpClient);
  private readonly userService = inject(UserService);
  private readonly url = `${API_BASE_URL}/audits`;

  findAll(): Observable<AuditSummary[]> {
    return this.http.get<AuditSummary[]>(this.url);
  }

  add(dto: AddAuditDto): Observable<void> {
    return this.http.post<ApiResponse<object>>(this.url, dto).pipe(
      map(() => undefined),
      catchError(error => this.handleError(error))
    );
  }

  findAllAudites(): Observable<FindOneUserDto[]> {
    return this.userService.findAllAudites();
  }

  findById(id: number): Observable<AuditDetails> {
    return this.http.get<ApiResponse<AuditDetails>>(`${this.url}/${id}`).pipe(
      map(res => res.data ?? {} as AuditDetails),
      catchError(error => {
        let errorMessage = 'Impossible de charger les détails de l\'audit';

        if (error.status === 403) {
          errorMessage = 'Accès refusé - Vous n\'êtes pas autorisé à voir cet audit';
        } else if (error.status === 404) {
          errorMessage = 'Audit non trouvé';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }

        return throwError(() => ({
          error: { message: errorMessage },
          status: error.status
        }));
      })
    );
  }

  update(dto: UpdateAuditDto): Observable<void> {
    return this.http.put<ApiResponse<string>>(this.url, dto).pipe(
      map(() => undefined),
      catchError(error => this.handleError(error, 'Erreur lors de la modification de l\'audit'))
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<ApiResponse<string>>(`${this.url}/${id}`).pipe(
      map(() => undefined),
      catchError(error => this.handleError(error, 'Erreur lors de la suppression de l\'audit'))
    );
  }

  private handleError(error: HttpErrorResponse, defaultMessage: string = 'Erreur lors de la création de l\'audit'): Observable<never> {
    let errorMessage = defaultMessage;

    console.error('Error details:', error);

    // Essayer de récupérer le message du corps d'erreur
    if (error.error) {
      // Si error.error est un objet avec un message
      if (typeof error.error === 'object') {
        const errorResponse: ErrorResponse = error.error;
        if (errorResponse.message) {
          errorMessage = errorResponse.message;
        } else if (errorResponse.error) {
          errorMessage = errorResponse.error;
        } else if (errorResponse.detail) {
          errorMessage = errorResponse.detail;
        }
      }
      // Si error.error est une chaîne de caractères
      else if (typeof error.error === 'string') {
        errorMessage = error.error;
      }
    }

    // Fallback sur le message d'erreur HTTP
    if (errorMessage === 'Erreur lors de la création de l\'audit' && error.message) {
      errorMessage = error.message;
    }

    // Fallback sur le statut HTTP
    if (errorMessage === 'Erreur lors de la création de l\'audit') {
      const statusMessages: Record<number, string> = {
        400: 'Requête invalide',
        403: 'Accès refusé - Vérifiez vos permissions',
        404: 'Ressource non trouvée',
        500: 'Erreur serveur',
      };
      errorMessage = statusMessages[error.status] || errorMessage;
    }

    return throwError(() => ({
      error: {
        message: errorMessage,
      },
      status: error.status,
    }));
  }
}
