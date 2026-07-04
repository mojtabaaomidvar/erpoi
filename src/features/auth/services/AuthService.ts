// src/features/auth/services/AuthService.ts

import type { AuthSession, LoginCredentials, User } from '../types';
import { userService } from '@shared/authorization/services/UserService';
import { eventBus } from '@infra/events';
import { showToast } from '@shared/ui/ToastContainer';

const SESSION_KEY = 'ics_auth_session';

class AuthService {
  private static instance: AuthService;
  private session: AuthSession | null = null;
  private listeners: Array<(session: AuthSession | null) => void> = [];

  private constructor() {
    this.loadSession();
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  subscribe(listener: (session: AuthSession | null) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public notifyListeners() {
    this.listeners.forEach(listener => listener(this.session));
  }

  getSession(): AuthSession | null {
    return this.session;
  }

  private saveSession() {
    if (this.session) {
      try {
        const json = JSON.stringify(this.session);
        localStorage.setItem(SESSION_KEY, json);
      } catch (error) {
        console.error('[AuthService] Failed to save session:', error);
      }
    }
  }

  private loadSession() {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        const session = JSON.parse(stored);
        if (session.expiresAt && new Date(session.expiresAt) > new Date()) {
          this.session = session;
          this.notifyListeners();
        } else {
          localStorage.removeItem(SESSION_KEY);
        }
      }
    } catch (error) {
      console.error('[AuthService] Failed to load session:', error);
    }
  }

  private generateToken(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  updateCurrentUser(updatedUser: User) {
    if (this.session && this.session.user.id === updatedUser.id) {
      console.log('[AuthService] 🔄 Updating current user in session:', updatedUser.username);
      
      this.session = {
        ...this.session,
        user: {
          ...this.session.user,
          ...updatedUser,
        },
      };
      
      this.saveSession();
      this.notifyListeners();
      
      console.log('[AuthService] ✅ Session updated successfully');
    }
  }
  
  async login(credentials: LoginCredentials): Promise<User> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // 🔧 FIX: خواندن مستقیم از localStorage برای اطمینان از به‌روز بودن
    const usersJson = localStorage.getItem('ics_db_users');
    if (!usersJson) {
      throw this.createError('INVALID_CREDENTIALS', 'No users in database');
    }
    
    const users = JSON.parse(usersJson);
    const dbUser = users.find((u: any) => u.username === credentials.username.trim());
    
    if (!dbUser) {
      throw this.createError('INVALID_CREDENTIALS', 'Invalid username or password');
    }

    if (dbUser.status !== 'active') {
      throw this.createError('ACCOUNT_DISABLED', 'Account is disabled');
    }

    if (!credentials.password || credentials.password.length < 1) {
      throw this.createError('INVALID_CREDENTIALS', 'Password is required');
    }

    // 🔧 NOTE: در این نسخه، password چک نمی‌شود (mock database)
    
    const session: AuthSession = {
      user: {
        id: dbUser.id,
        username: dbUser.username,
        email: dbUser.email,
        fullName: dbUser.fullName,
        role: dbUser.role,
        department: dbUser.department,
        customPermissions: dbUser.customPermissions || [],
      },
      token: this.generateToken(),
      refreshToken: this.generateToken(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      createdAt: new Date(),
    };

    this.session = session;
    this.saveSession();
    this.notifyListeners();

    eventBus.publish({
      type: 'auth.login' as any,
      payload: { userId: dbUser.id, username: dbUser.username },
      timestamp: new Date(),
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source: 'auth',
    });

    showToast('success', 'Login Successful', `Welcome back, ${dbUser.fullName}!`);
    console.log('[AuthService] 🔐 User logged in:', session.user);

    return session.user;
  }

  async logout(): Promise<void> {
    console.log('[AuthService] 🚪 Logout called');
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

  async requestPasswordReset(_email: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
    showToast('info', 'Password Reset', 'If this email exists, you will receive a reset link');
  }

  async confirmPasswordReset(_token: string, _newPassword: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
    showToast('success', 'Password Reset', 'Your password has been reset successfully');
  }
}

export const authService = AuthService.getInstance();