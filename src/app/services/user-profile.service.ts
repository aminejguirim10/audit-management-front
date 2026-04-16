import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '../config/api.config';
import { ApiResponse } from '../models/api-response.model';
import { UpdateUserProfileRequest, UserProfile } from '../models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class UserProfileService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = API_BASE_URL;

  getMyProfile(): Observable<UserProfile> {
    return this.http
      .get<ApiResponse<UserProfile>>(`${this.apiUrl}/utilisateurs/me`)
      .pipe(map((response) => this.requireData(response, 'Impossible de charger le profil.')));
  }

  updateMyProfile(payload: UpdateUserProfileRequest): Observable<UserProfile> {
    return this.http
      .put<ApiResponse<UserProfile>>(`${this.apiUrl}/utilisateurs/me`, payload)
      .pipe(
        map((response) => this.requireData(response, 'Impossible de mettre a jour le profil.')),
      );
  }

  private requireData(response: ApiResponse<UserProfile>, fallbackMessage: string): UserProfile {
    if (!response.data) {
      throw new Error(response.message || fallbackMessage);
    }

    return response.data;
  }
}
