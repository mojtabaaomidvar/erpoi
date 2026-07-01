// src/features/auth/hooks/useAuth.ts

import { useState, useEffect, useCallback } from 'react';
import { authService } from '../services/AuthService';
import { LoginCredentials, User } from '../types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(() => {
    // ✅ مقدار اولیه رو مستقیم از authService بگیر
    const session = authService.getSession();
    return session?.user || null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ useEffect باید همیشه اجرا بشه، نه شرطی
  useEffect(() => {
    const unsubscribe = authService.subscribe((session) => {
      setUser(session?.user || null);
    });
    
    // Cleanup
    return () => {
      unsubscribe();
    };
  }, []); // ✅ dependency array خالی

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const user = await authService.login(credentials);
      setUser(user);
      return user;
    } catch (err: any) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await authService.requestPasswordReset(email);
    } catch (err: any) {
      setError(err.message || 'Password reset failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const confirmPasswordReset = useCallback(async (token: string, newPassword: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await authService.confirmPasswordReset(token, newPassword);
    } catch (err: any) {
      setError(err.message || 'Password reset failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    user,
    isLoading,
    error,
    login,
    logout,
    requestPasswordReset,
    confirmPasswordReset,
    isAuthenticated: !!user,
  };
}