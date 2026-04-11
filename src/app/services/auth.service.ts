import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/api-response.model';
import { API_BASE_URL } from '../config/api.config';
import {
  AuthenticationRequest,
  AuthenticationResponse,
  AuthUser,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  UserRole,
} from '../models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = API_BASE_URL;
  private readonly accessTokenStorageKey = 'audit_access_token';
  private readonly refreshTokenStorageKey = 'audit_refresh_token';
  private readonly validRoles: ReadonlySet<UserRole> = new Set([
    'ADMIN',
    'AUDITEUR',
    'AUDITE',
    'ETUDIANT',
  ]);

  private readonly userSignal = signal<AuthUser | null>(this.readUserFromAccessToken());

  readonly user = computed(() => this.userSignal());

  login(payload: AuthenticationRequest): Observable<ApiResponse<AuthenticationResponse>> {
    return this.http
      .post<ApiResponse<AuthenticationResponse>>(`${this.apiUrl}/auth/login`, payload)
      .pipe(tap((response) => this.persistSession(response)));
  }

  forgotPassword(payload: ForgotPasswordRequest): Observable<ApiResponse<object>> {
    return this.http.post<ApiResponse<object>>(`${this.apiUrl}/auth/forgot-password`, payload);
  }

  resetPassword(payload: ResetPasswordRequest): Observable<ApiResponse<object>> {
    return this.http.post<ApiResponse<object>>(`${this.apiUrl}/auth/reset-password`, payload);
  }

  logout(): void {
    localStorage.removeItem(this.accessTokenStorageKey);
    localStorage.removeItem(this.refreshTokenStorageKey);
    this.userSignal.set(null);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.accessTokenStorageKey);
  }

  getCurrentUserRole(): UserRole | null {
    return this.userSignal()?.role ?? null;
  }

  hasRole(role: UserRole): boolean {
    return this.getCurrentUserRole() === role;
  }

  hasAnyRole(roles: readonly UserRole[]): boolean {
    const currentRole = this.getCurrentUserRole();
    return currentRole !== null && roles.includes(currentRole);
  }

  getDefaultRouteForCurrentRole(): string | null {
    const currentRole = this.getCurrentUserRole();

    switch (currentRole) {
      case 'ADMIN':
        return '/dashboard/admin';
      case 'AUDITEUR':
        return '/dashboard/auditeur';
      case 'AUDITE':
        return '/dashboard/audite';
      case 'ETUDIANT':
        return '/dashboard/etudiant';
      default:
        return null;
    }
  }

  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    if (!token) {
      return false;
    }

    const expiration = this.getTokenExpiration(token);
    if (expiration === null) {
      return false;
    }

    const userFromToken = this.readUserFromAccessToken();
    if (!userFromToken) {
      return false;
    }

    this.userSignal.set(userFromToken);

    return Date.now() < expiration;
  }

  private persistSession(response: ApiResponse<AuthenticationResponse>): void {
    if (!response.data) {
      return;
    }

    localStorage.setItem(this.accessTokenStorageKey, response.data.access_token);
    localStorage.setItem(this.refreshTokenStorageKey, response.data.refresh_token);

    this.userSignal.set(this.readUserFromAccessToken());
  }

  private readUserFromAccessToken(): AuthUser | null {
    const token = this.getAccessToken();
    if (!token) {
      return null;
    }

    const payload = this.decodeJwtPayload(token);
    if (!payload) {
      return null;
    }

    if (!payload.sub || !payload.role || !this.isValidRole(payload.role)) {
      return null;
    }

    return {
      email: payload.sub,
      role: payload.role,
    };
  }

  private isValidRole(role: string): role is UserRole {
    return this.validRoles.has(role as UserRole);
  }

  private decodeJwtPayload(token: string): { exp?: number; sub?: string; role?: string } | null {
    try {
      const tokenPart = token.split('.')[1];
      if (!tokenPart) {
        return null;
      }

      const normalized = tokenPart.replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
      const jsonPayload = atob(padded);
      return JSON.parse(jsonPayload) as { exp?: number; sub?: string; role?: string };
    } catch {
      return null;
    }
  }

  private getTokenExpiration(token: string): number | null {
    const payload = this.decodeJwtPayload(token);
    if (!payload?.exp) {
      return null;
    }

    return payload.exp * 1000;
  }
}
