//src/features/auth/application/services/AuthApplicationService.ts

import { eventBus } from "@infra/events";
import { showToast } from "@shared/ui/ToastContainer";
import { getBasePermissions } from "@shared/authorization/config/RoleBasePermissions";
import type {
  LoginCredentials,
  AuthSession,
  AuthUser,
} from "../../domain/models/Auth";
import type { IAuthRepository } from "../../domain/repositories/IAuthRepository";

const SESSION_KEY = "ics_auth_session";

export class AuthApplicationService {
  private session: AuthSession | null = null;
  private listeners: Array<(session: AuthSession | null) => void> = [];

  constructor(private authRepository: IAuthRepository) {
    this.loadSession();
  }

  subscribe(listener: (session: AuthSession | null) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public notifyListeners() {
    this.listeners.forEach((listener) => listener(this.session));
  }

  getSession(): AuthSession | null {
    return this.session;
  }

  private saveSession() {
    if (this.session) {
      try {
        localStorage.setItem(SESSION_KEY, JSON.stringify(this.session));
      } catch (error) {
        console.error(
          "[AuthApplicationService] Failed to save session:",
          error,
        );
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
      console.error("[AuthApplicationService] Failed to load session:", error);
    }
  }

  private generateToken(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  async login(credentials: LoginCredentials): Promise<AuthUser> {
    // شبیه‌سازی تاخیر شبکه (اختیاری، برای UX)
    await new Promise((resolve) => setTimeout(resolve, 800));

    const dbUser = await this.authRepository.authenticate(credentials);

    const session: AuthSession = {
      user: {
        ...dbUser,
        basePermissions: getBasePermissions(dbUser.role),
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
      type: "auth.login" as any,
      payload: { userId: dbUser.id, username: dbUser.username },
      timestamp: new Date(),
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source: "auth",
    });

    showToast(
      "success",
      "Login Successful",
      `Welcome back, ${dbUser.fullName}!`,
    );
    return session.user;
  }

  async logout(): Promise<void> {
    await this.authRepository.signOut();

    this.session = null;
    localStorage.removeItem(SESSION_KEY);
    this.notifyListeners();

    eventBus.publish({
      type: "auth.logout" as any,
      payload: {},
      timestamp: new Date(),
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source: "auth",
    });

    showToast("success", "Logout Successful", "You have been logged out");
  }

  updateCurrentUser(updatedUser: Partial<AuthUser>) {
    if (this.session && this.session.user.id === updatedUser.id) {
      this.session = {
        ...this.session,
        user: {
          ...this.session.user,
          ...updatedUser,
        },
      };
      this.saveSession();
      this.notifyListeners();
    }
  }

  async requestPasswordReset(_email: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    showToast(
      "info",
      "Password Reset",
      "If this email exists, you will receive a reset link",
    );
  }

  async confirmPasswordReset(
    _token: string,
    _newPassword: string,
  ): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    showToast(
      "success",
      "Password Reset",
      "Your password has been reset successfully",
    );
  }
}
