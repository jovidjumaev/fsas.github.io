'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, AppState } from '@/types';

interface AuthContextType extends AppState {
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, userData: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null
  });

  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => {
      setState(prev => ({
        ...prev,
        isLoading: false
      }));
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock successful login
      const mockUser: User = {
        id: 'mock-user-id',
        student_id: email.split('@')[0],
        first_name: 'John',
        last_name: 'Doe',
        email: email,
        role: email.includes('prof') ? 'professor' : 'student',
        created_at: new Date().toISOString()
      };

      setState({
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: {
          code: 'SIGN_IN_ERROR',
          message: error.message || 'Failed to sign in',
          timestamp: new Date().toISOString()
        }
      }));
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      });
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: {
          code: 'SIGN_OUT_ERROR',
          message: error.message || 'Failed to sign out',
          timestamp: new Date().toISOString()
        }
      }));
      throw error;
    }
  };

  const signUp = async (email: string, password: string, userData: any) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock successful signup
      const mockUser: User = {
        id: 'mock-user-id',
        student_id: userData.student_id || email.split('@')[0],
        first_name: userData.first_name || 'John',
        last_name: userData.last_name || 'Doe',
        email: email,
        role: userData.role || 'student',
        created_at: new Date().toISOString()
      };

      setState({
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: {
          code: 'SIGN_UP_ERROR',
          message: error.message || 'Failed to sign up',
          timestamp: new Date().toISOString()
        }
      }));
      throw error;
    }
  };

  const value: AuthContextType = {
    ...state,
    signIn,
    signOut,
    signUp
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
