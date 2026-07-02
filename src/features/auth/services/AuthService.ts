// src/features/auth/services/AuthService.ts

import type { AuthSession, LoginCredentials, User } from '../types';
import { userService } from '@shared/authorization/services/UserService';
import { eventBus } from '@infra/events';
import { showToast } from '@shared/ui/ToastContainer';

const SESSION_KEY = 'ics_auth_session';

class AuthService {
  private static instance: AuthService;
  private session: AuthSession | null = null;
  
  // 🔧 FIX: استفاده از Array به جای Set
  private listeners: Array<(session: AuthSession | null) => void> = [];

  private constructor() {
    // 🔧 FIX: حذف loadSession - هر بار باید لاگین کنه
    // this.loadSession();
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // 🔧 FIX: استفاده از push و filter برای Array
  subscribe(listener: (session: AuthSession | null) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.session));
  }

  getSession(): AuthSession | null {
    return this.session;
  }

  private saveSession(rememberMe: boolean) {
    if (rememberMe && this.session) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(this.session));
    }
  }

  private generateToken(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  async login(credentials: LoginCredentials): Promise<User> {
    await new Promise(resolve => setTimeout(resolve, 800));

    const user = userService.getByUsername(credentials.username.trim());

    if (!user) {
      throw this.createError('INVALID_CREDENTIALS', 'Invalid username or password');
    }

    if (user.status !== 'active') {
      throw this.createError('ACCOUNT_DISABLED', 'Account is disabled');
    }

    if (!credentials.password || credentials.password.length < 1) {
      throw this.createError('INVALID_CREDENTIALS', 'Password is required');
    }

    const session: AuthSession = {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        department: user.department,
      },
      token: this.generateToken(),
      refreshToken: this.generateToken(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      createdAt: new Date(),
    };

    this.session = session;
    this.saveSession(credentials.rememberMe || false);
    this.notifyListeners();

    eventBus.publish({
      type: 'auth.login' as any,
      payload: { userId: user.id, username: user.username },
      timestamp: new Date(),
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source: 'auth',
    });

    showToast('success', 'Login Successful', `Welcome back, ${user.fullName}!`);

    return session.user;
  }

  async logout(): Promise<void> {
    this.session = null;
    localStorage.removeItem(SESSION_KEY);
    this.notifyListeners();

    eventBus.publish({
      type: 'auth.logout' as any,
      payload: {},
      timestamp: new Date(),
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source: 'auth',
    });

    showToast('success', 'Logout Successful', 'You have been logged out');
  }

  private createError(code: string, message: string): Error {
    const error = new Error(message);
    error.name = code;
    return error;
  }

  async requestPasswordReset(email: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
    showToast('info', 'Password Reset', 'If this email exists, you will receive a reset link');
  }

  async confirmPasswordReset(token: string, newPassword: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
    showToast('success', 'Password Reset', 'Your password has been reset successfully');
  }
}

export const authService = AuthService.getInstance();