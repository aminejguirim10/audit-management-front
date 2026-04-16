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
  id: number | null;
  name: string | null;
  email: string;
  role: UserRole;
  phoneNumber: string | null;
  profilePhotoUrl: string | null;
}

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  phoneNumber: string | null;
  profilePhotoUrl: string | null;
  role: UserRole;
  departement: string | null;
}

export interface UpdateUserProfileRequest {
  name?: string;
  phoneNumber?: string;
  profilePhotoUrl?: string;
}
