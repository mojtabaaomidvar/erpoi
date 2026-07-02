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
    console.log('[AuthService] 🔧 Constructor called');
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

  private notifyListeners() {
    console.log('[AuthService] 🔔 Notifying listeners, session:', this.session?.user?.username);
    this.listeners.forEach(listener => listener(this.session));
  }

  getSession(): AuthSession | null {
    return this.session;
  }

  private saveSession() {
    console.log('[AuthService] 💾 saveSession called, session:', this.session?.user?.username);
    if (this.session) {
      try {
        const json = JSON.stringify(this.session);
        localStorage.setItem(SESSION_KEY, json);
        console.log('[AuthService] ✅ Session saved to localStorage');
        console.log('[AuthService] 📦 Saved data:', JSON.parse(json));
      } catch (error) {
        console.error('[AuthService] ❌ Failed to save session:', error);
      }
    } else {
      console.warn('[AuthService] ⚠️ Session is null, not saving');
    }
  }

  private loadSession() {
    console.log('[AuthService] 📂 loadSession called');
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      console.log('[AuthService] 📦 Stored data:', stored);
      
      if (stored) {
        const session = JSON.parse(stored);
        console.log('[AuthService] 📦 Parsed session:', session);
        
        if (session.expiresAt && new Date(session.expiresAt) > new Date()) {
          this.session = session;
          this.notifyListeners();
          console.log('[AuthService] ✅ Session loaded from localStorage');
          console.log('[AuthService] 👤 User:', session.user?.username, 'Role:', session.user?.role);
        } else {
          console.log('[AuthService] ⚠️ Session expired, clearing...');
          localStorage.removeItem(SESSION_KEY);
        }
      } else {
        console.log('[AuthService] ℹ️ No session in localStorage');
      }
    } catch (error) {
      console.error('[AuthService] ❌ Failed to load session:', error);
    }
  }

  private generateToken(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  async login(credentials: LoginCredentials): Promise<User> {
    console.log('[AuthService] 🔐 Login attempt:', credentials.username);
    await new Promise(resolve => setTimeout(resolve, 800));

    const user = await userService.getUserByUsername(credentials.username.trim());
    console.log('[AuthService] 👤 User found:', user?.username, 'Role:', user?.role);

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

    console.log('[AuthService] 📝 Session created:', session.user.username, session.user.role);

    this.session = session;
    console.log('[AuthService] ✅ this.session set');
    
    this.saveSession();
    console.log('[AuthService] ✅ saveSession called');
    
    this.notifyListeners();
    console.log('[AuthService] ✅ notifyListeners called');

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