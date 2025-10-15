/**
 * React hook for authentication state
 */

import { useState, useEffect } from 'react';
import { authManager, type AuthState, type User } from '@/lib/auth';

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>(authManager.getState());

  useEffect(() => {
    const unsubscribe = authManager.subscribe(setAuthState);
    return unsubscribe;
  }, []);

  return {
    ...authState,
    login: authManager.login.bind(authManager),
    googleLogin: authManager.googleLogin.bind(authManager),
    logout: authManager.logout.bind(authManager),
    hasRole: authManager.hasRole.bind(authManager),
    hasAnyRole: authManager.hasAnyRole.bind(authManager),
  };
}

export type { User, AuthState };
