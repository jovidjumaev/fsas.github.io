'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
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
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }

        if (session?.user) {
          // Get user profile
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            console.error('Profile error:', profileError);
          }

          setState({
            user: profile || {
              id: session.user.id,
              student_id: session.user.email?.split('@')[0] || '',
              first_name: session.user.user_metadata?.first_name || '',
              last_name: session.user.user_metadata?.last_name || '',
              email: session.user.email || '',
              role: 'student',
              created_at: session.user.created_at
            },
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
        } else {
          setState(prev => ({
            ...prev,
            isLoading: false
          }));
        }
      } catch (error) {
        console.error('Auth error:', error);
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: {
            code: 'AUTH_ERROR',
            message: 'Failed to initialize authentication',
            timestamp: new Date().toISOString()
          }
        }));
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          // Get user profile
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          setState({
            user: profile || {
              id: session.user.id,
              student_id: session.user.email?.split('@')[0] || '',
              first_name: session.user.user_metadata?.first_name || '',
              last_name: session.user.user_metadata?.last_name || '',
              email: session.user.email || '',
              role: 'student',
              created_at: session.user.created_at
            },
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
        } else if (event === 'SIGNED_OUT') {
          setState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }
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
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
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
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      });

      if (error) {
        throw error;
      }

      // Create user profile
      if (data.user) {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: data.user.id,
            student_id: userData.student_id || email.split('@')[0],
            first_name: userData.first_name || '',
            last_name: userData.last_name || '',
            email: email,
            role: userData.role || 'student'
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
        }
      }
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
