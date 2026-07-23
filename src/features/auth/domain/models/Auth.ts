//src/features/auth/domain/models/Auth.ts

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
  department?: string;
  customPermissions: string[];
  basePermissions: string[];
}

export interface AuthSession {
  user: AuthUser;
  token: string;
  refreshToken: string;
  expiresAt: Date;
  createdAt: Date;
}
