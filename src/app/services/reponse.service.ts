import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { API_BASE_URL } from '../config/api.config';
import { ApiResponse, ErrorResponse } from '../models/api-response.model';
import { AddReponseDto, UpdateReponseDto } from '../models/reponse.model';

@Injectable({ providedIn: 'root' })
export class ReponseService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_BASE_URL}/reponses`;

  add(dto: AddReponseDto): Observable<void> {
    return this.http.post<ApiResponse<string>>(this.url, dto).pipe(
      map(() => undefined),
      catchError((error) => this.handleError(error, "Erreur lors de l'enregistrement de la reponse")),
    );
  }

  update(dto: UpdateReponseDto): Observable<void> {
    return this.http.put<ApiResponse<string>>(this.url, dto).pipe(
      map(() => undefined),
      catchError((error) => this.handleError(error, 'Erreur lors de la mise a jour de la reponse')),
    );
  }

  private handleError(error: HttpErrorResponse, defaultMessage: string): Observable<never> {
    let errorMessage = defaultMessage;

    if (error.error) {
      if (typeof error.error === 'object') {
        const errorResponse: ErrorResponse = error.error;
        errorMessage =
          errorResponse.message ??
          errorResponse.error ??
          errorResponse.detail ??
          defaultMessage;
      } else if (typeof error.error === 'string') {
        errorMessage = error.error;
      }
    }

    return throwError(() => ({
      error: {
        message: errorMessage,
      },
      status: error.status,
    }));
  }
}
