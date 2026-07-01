// src/features/auth/services/AuthService.ts

import { LoginCredentials, User, AuthSession, AuthError } from '../types';
import { userService } from '@shared/authorization/services/UserService';
import { eventBus } from '@infra/events';
import { showToast } from '@shared/ui/ToastContainer';

const SESSION_KEY = 'ics_auth_session';
const REMEMBER_KEY = 'ics_remember_me';

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

  // ═══════════════════════════════════════
  // 🔐 Login
  // ═══════════════════════════════════════
async login(credentials: LoginCredentials): Promise<User> {
  await new Promise(resolve => setTimeout(resolve, 800));

  // 🔍 Debug: ببینیم دقیقاً چی داریم
  const allUsers = userService.getAll();
  console.log('🔍 All users in system:', allUsers.map(u => ({
    username: u.username,
    email: u.email,
    status: u.status,
    role: u.role
  })));
  console.log('🔍 Trying to login with:', credentials.username);

  // جستجوی کاربر
  const user = userService.getByUsername(credentials.username);

  if (!user) {
    // 🔍 سعی کنیم fuzzy match کنیم
    const allUsernames = allUsers.map(u => u.username);
    console.error('❌ User not found! Available usernames:', allUsernames);
    throw this.createError('INVALID_CREDENTIALS', `Invalid username or password...}`);
  }

  console.log('✅ User found:', user.fullName, user.status);

  if (user.status !== 'active') {
    throw this.createError('ACCOUNT_DISABLED', `Account is ${user.status}`);
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

  // ═══════════════════════════════════════
  // 🚪 Logout
  // ═══════════════════════════════════════

  async logout(): Promise<void> {
    if (this.session) {
      eventBus.publish({
        type: 'auth.logout' as any,
        payload: { userId: this.session.user.id, username: this.session.user.username },
        timestamp: new Date(),
        eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        source: 'auth',
      });
    }

    this.session = null;
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(REMEMBER_KEY);

    showToast('info', 'Logged Out', 'You have been logged out successfully');
  }

  // ═══════════════════════════════════════
  // 🔄 Password Reset
  // ══════════════════════════════════════

  async requestPasswordReset(email: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 800));

    const user = userService.getByEmail(email);
    
    // همیشه success برمی‌گردونیم (security best practice)
    if (user) {
      const resetToken = this.generateToken();
      // در production، این token در دیتابیس ذخیره و email ارسال میشه
      console.log(`Password reset token for ${email}: ${resetToken}`);
      
      eventBus.publish({
        type: 'auth.password_reset_requested' as any,
        payload: { userId: user.id, email },
        timestamp: new Date(),
        eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        source: 'auth',
      });

      showToast('success', 'Reset Email Sent', 'Check your email for reset instructions');
    } else {
      showToast('info', 'Email Sent', 'If an account exists with this email, you will receive reset instructions');
    }
  }

  async confirmPasswordReset(token: string, newPassword: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 800));

    // در production، token validation انجام میشه
    if (!newPassword || newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    showToast('success', 'Password Reset', 'Your password has been reset successfully');
  }

  // ═══════════════════════════════════════
  // 📊 Session Management
  // ═══════════════════════════════════════

  getSession(): AuthSession | null {
    return this.session;
  }

  getUser(): User | null {
    return this.session?.user || null;
  }

  isAuthenticated(): boolean {
    if (!this.session) return false;
    
    // Check expiration
    if (new Date() > this.session.expiresAt) {
      this.logout();
      return false;
    }
    
    return true;
  }

  subscribe(listener: (session: AuthSession | null) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

private notifyListeners(): void {
  this.listeners.forEach(listener => listener(this.session));
}

  private loadSession(): void {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.session = {
          ...parsed,
          expiresAt: new Date(parsed.expiresAt),
          createdAt: new Date(parsed.createdAt),
        };
      }
    } catch (error) {
      console.error('[AuthService] Failed to load session:', error);
    }
  }

  private saveSession(rememberMe: boolean): void {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(this.session));
      if (rememberMe) {
        localStorage.setItem(REMEMBER_KEY, 'true');
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }
    } catch (error) {
      console.error('[AuthService] Failed to save session:', error);
    }
  }

  private generateToken(): string {
    return `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private createError(code: AuthError, message: string): Error {
    const error = new Error(message);
    error.name = code;
    return error;
  }
}

export const authService = AuthService.getInstance();