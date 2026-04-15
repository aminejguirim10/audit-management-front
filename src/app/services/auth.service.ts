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
        return '/admin/tableau-de-bord';
      case 'AUDITEUR':
        return '/auditeur/tableau-de-bord';
      case 'AUDITE':
        return '/audite/tableau-de-bord';
      case 'ETUDIANT':
        return '/etudiant/soumettre-idee';
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
    console.log('Decoded JWT payload:', payload);
    
    if (!payload || !payload.sub) {
      console.warn('JWT payload is missing or missing "sub"', payload);
      return null;
    }

    // Try to extract role
    let rawRole = payload.role;
    if (!rawRole && payload.roles && Array.isArray(payload.roles) && payload.roles.length > 0) {
        rawRole = payload.roles[0];
    } else if (!rawRole && payload.authorities && Array.isArray(payload.authorities) && payload.authorities.length > 0) {
        // Some Spring Boot configurations use 'authorities' array of strings or objects
        const firstAuth = payload.authorities[0];
        rawRole = typeof firstAuth === 'string' ? firstAuth : (firstAuth as any).authority;
    }
    
    if (!rawRole) {
        console.warn('Could not extract role from JWT payload', payload);
        return null; // Let the app fallback to whatever if no role found, but here we enforce it
    }

    let parsedRole = String(rawRole).toUpperCase();
    if (parsedRole.startsWith('ROLE_')) {
        parsedRole = parsedRole.substring(5);
    }

    if (!this.isValidRole(parsedRole)) {
        console.warn('Extracted role is not valid', parsedRole);
        return null;
    }

    return {
      email: payload.sub,
      role: parsedRole,
    };
  }

  private isValidRole(role: string): role is UserRole {
    return this.validRoles.has(role as UserRole);
  }

  private decodeJwtPayload(token: string): any {
    try {
      const tokenPart = token.split('.')[1];
      if (!tokenPart) {
        return null;
      }

      const normalized = tokenPart.replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
      const jsonPayload = atob(padded);
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('Error decoding JWT token', e);
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
