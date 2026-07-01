// src/features/auth/hooks/useRequireAuth.ts

import { useEffect } from 'react';
import { useAuth } from './useAuth';

export function useRequireAuth(redirectTo = '/login') {
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      // در production از router استفاده میشه
      window.location.href = redirectTo;
    }
  }, [isAuthenticated, redirectTo]);

  return { user, isAuthenticated };
}