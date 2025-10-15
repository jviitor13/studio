/**
 * Authentication utilities for Google OAuth
 */

import { apiClient } from './api';

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'manager' | 'mechanic' | 'driver';
  profile_picture?: string;
  is_verified: boolean;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

class AuthManager {
  private listeners: ((state: AuthState) => void)[] = [];
  private state: AuthState = {
    user: null,
    isAuthenticated: false,
    isLoading: true,
  };

  constructor() {
    this.initializeAuth();
  }

  private async initializeAuth() {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      
      if (token) {
        apiClient.setToken(token);
        const response = await apiClient.getCurrentUser();
        
        if (response.data) {
          this.setState({
            user: response.data,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          this.logout();
        }
      } else {
        this.setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      this.setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  }

  private setState(newState: Partial<AuthState>) {
    this.state = { ...this.state, ...newState };
    this.listeners.forEach(listener => listener(this.state));
  }

  subscribe(listener: (state: AuthState) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  getState() {
    return this.state;
  }

  async googleLogin(googleToken: string, userData: any) {
    try {
      this.setState({ isLoading: true });
      
      const response = await apiClient.googleAuth(googleToken, userData);
      
      if (response.data) {
        apiClient.setToken(response.data.token);
        this.setState({
          user: response.data.user,
          isAuthenticated: true,
          isLoading: false,
        });
        return { success: true, user: response.data.user };
      } else {
        this.setState({ isLoading: false });
        return { success: false, error: response.error };
      }
    } catch (error) {
      this.setState({ isLoading: false });
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro de autenticação' 
      };
    }
  }

  async login(email: string, password: string) {
    try {
      this.setState({ isLoading: true });
      
      const response = await apiClient.login(email, password);
      
      if (response.data) {
        apiClient.setToken(response.data.token);
        this.setState({
          user: response.data.user,
          isAuthenticated: true,
          isLoading: false,
        });
        return { success: true, user: response.data.user };
      } else {
        this.setState({ isLoading: false });
        return { success: false, error: response.error };
      }
    } catch (error) {
      this.setState({ isLoading: false });
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro de autenticação' 
      };
    }
  }

  async logout() {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      apiClient.clearToken();
      this.setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  }

  hasRole(role: string) {
    return this.state.user?.role === role;
  }

  hasAnyRole(roles: string[]) {
    return this.state.user ? roles.includes(this.state.user.role) : false;
  }
}

export const authManager = new AuthManager();
export default authManager;
