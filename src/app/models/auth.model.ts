export type UserRole = 'ADMIN' | 'AUDITEUR' | 'AUDITE' | 'ETUDIANT';

export interface AuthenticationRequest {
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AuthenticationResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  email: string;
  role: UserRole;
}

export interface AuthUser {
  email: string;
  role: UserRole;
}
