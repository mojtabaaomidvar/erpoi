// src/features/auth/types.ts

export interface LoginCredentials {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
  department?: string;
  avatar?: string;
}

export interface AuthSession {
  user: User;
  token: string;
  refreshToken: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export type AuthError = 
  | 'INVALID_CREDENTIALS'
  | 'ACCOUNT_DISABLED'
  | 'ACCOUNT_LOCKED'
  | 'SESSION_EXPIRED'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';