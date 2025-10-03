'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, supabaseAdmin } from './supabase';
import { 
  parseSupabaseError, 
  logDetailedError, 
  testDatabaseConnection,
  retryOperation,
  validateRequiredFields,
  formatErrorForUser
} from './error-handler';

interface AuthContextType {
  user: User | null;
  userRole: 'student' | 'professor' | null;
  loading: boolean;
  signIn: (email: string, password: string, role: 'student' | 'professor') => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, role: 'student' | 'professor', additionalData: any) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string, role: 'student' | 'professor') => Promise<{ success: boolean; error?: string }>;
  updatePassword: (token: string, password: string, type: 'student' | 'professor') => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<'student' | 'professor' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔐 AuthContext: Initializing...');
    console.log('🔐 AuthContext: Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('🔐 AuthContext: Supabase Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('🔐 AuthContext: Getting initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ AuthContext: Session error:', error);
        } else {
          console.log('🔐 AuthContext: Session result:', { 
            hasSession: !!session, 
            hasUser: !!session?.user,
            userId: session?.user?.id 
          });
        }
        
        if (session?.user) {
          console.log('🔐 AuthContext: User found, fetching role...');
          setUser(session.user);
          await fetchUserRole(session.user.id);
        } else {
          console.log('🔐 AuthContext: No user in session');
        }
      } catch (error) {
        console.error('❌ AuthContext: Initial session error:', error);
      } finally {
        console.log('🔐 AuthContext: Setting loading to false');
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    console.log('🔐 AuthContext: Setting up auth state listener...');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 AuthContext: Auth state changed:', { event, hasSession: !!session, hasUser: !!session?.user });
        
        if (session?.user) {
          setUser(session.user);
          await fetchUserRole(session.user.id);
        } else {
          setUser(null);
          setUserRole(null);
        }
        setLoading(false);
      }
    );

    return () => {
      console.log('🔐 AuthContext: Cleaning up auth listener');
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      // First, get the user's role from the users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (userError) {
        console.error('Error fetching user role:', userError);
        setUserRole(null);
        return;
      }

      if (userData?.role) {
        setUserRole(userData.role as 'student' | 'professor');
        return;
      }

      // Fallback: Check if user exists in students or professors tables
      const { data: studentData } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (studentData) {
        setUserRole('student');
        return;
      }

      const { data: professorData } = await supabase
        .from('professors')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (professorData) {
        setUserRole('professor');
        return;
      }

      // If neither, set role to null
      setUserRole(null);
    } catch (error) {
      console.error('Error fetching user role:', error);
      setUserRole(null);
    }
  };

  const signIn = async (email: string, password: string, role: 'student' | 'professor') => {
    try {
      console.log('🔐 AuthContext: ===== SIGN-IN PROCESS STARTED =====');
      console.log('🔐 AuthContext: Input parameters:', { 
        email, 
        role, 
        passwordLength: password?.length || 0,
        passwordProvided: !!password
      });
      console.log('🔐 AuthContext: Environment check:', {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseKeyExists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        supabaseKeyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0
      });
      console.log('🔐 AuthContext: Current state:', { 
        user: !!user, 
        userRole,
        loading
      });
      
      // Validate input
      if (!email || !password) {
        console.error('❌ AuthContext: VALIDATION FAILED - Missing credentials');
        console.error('❌ AuthContext: Email provided:', !!email);
        console.error('❌ AuthContext: Password provided:', !!password);
        return { success: false, error: 'Please provide both email and password' };
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        console.error('❌ AuthContext: VALIDATION FAILED - Invalid email format');
        return { success: false, error: 'Please enter a valid email address' };
      }

      // Validate password length
      if (password.length < 6) {
        console.error('❌ AuthContext: VALIDATION FAILED - Password too short');
        return { success: false, error: 'Password must be at least 6 characters long' };
      }
      
      console.log('🔐 AuthContext: Input validation passed');
      console.log('🔐 AuthContext: Attempting Supabase authentication...');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      console.log('🔐 AuthContext: ===== SUPABASE AUTH RESPONSE =====');
      console.log('🔐 AuthContext: Response data:', {
        hasData: !!data,
        hasUser: !!data?.user,
        hasSession: !!data?.session,
        userId: data?.user?.id,
        userEmail: data?.user?.email,
        userEmailConfirmed: data?.user?.email_confirmed_at ? 'YES' : 'NO',
        userCreatedAt: data?.user?.created_at,
        userLastSignIn: data?.user?.last_sign_in_at
      });
      console.log('🔐 AuthContext: Response error:', {
        hasError: !!error,
        errorMessage: error?.message,
        errorStatus: error?.status,
        errorStatusText: error?.statusText,
        errorCode: error?.code,
        errorDetails: error?.details,
        errorHint: error?.hint
      });

      if (error) {
        logDetailedError('Sign-In Authentication', error, {
          email,
          role,
          timestamp: new Date().toISOString()
        });
        
        const parsedError = parseSupabaseError(error, 'sign-in');
        return { 
          success: false, 
          error: formatErrorForUser(parsedError)
        };
      }

      if (data.user) {
        console.log('✅ AuthContext: ===== AUTHENTICATION SUCCESSFUL =====');
        console.log('✅ AuthContext: User authenticated successfully');
        console.log('🔐 AuthContext: User details:', {
          id: data.user.id,
          email: data.user.email,
          emailConfirmed: data.user.email_confirmed_at ? 'YES' : 'NO',
          emailConfirmedAt: data.user.email_confirmed_at,
          createdAt: data.user.created_at,
          lastSignInAt: data.user.last_sign_in_at,
          appMetadata: data.user.app_metadata,
          userMetadata: data.user.user_metadata
        });
        
        // Check the user's role directly from the database
        console.log('🔍 AuthContext: ===== CHECKING USER PROFILE =====');
        console.log('🔍 AuthContext: Querying users table for role...');
        
        const { data: userProfile, error: userError } = await supabase
          .from('users')
          .select('role, first_name, last_name, is_active, created_at')
          .eq('id', data.user.id)
          .single();

        console.log('🔍 AuthContext: User profile query result:', { 
          hasProfile: !!userProfile,
          profile: userProfile,
          hasError: !!userError,
          error: userError ? {
            message: userError.message,
            code: userError.code,
            details: userError.details,
            hint: userError.hint
          } : null
        });

        if (userError) {
          logDetailedError('User Profile Query', userError, {
            userId: data.user.id,
            email: data.user.email,
            role
          });
          
          await supabase.auth.signOut();
          const parsedError = parseSupabaseError(userError, 'user profile retrieval');
          return { 
            success: false, 
            error: `${formatErrorForUser(parsedError)}\n\n💡 Try signing out completely and signing in again. If this persists, contact support.`
          };
        }

        if (!userProfile) {
          console.error('❌ AuthContext: User profile not found in database');
          logDetailedError('Missing User Profile', { message: 'Profile not found' }, {
            userId: data.user.id,
            email: data.user.email
          });
          
          await supabase.auth.signOut();
          return { 
            success: false, 
            error: 'Your account exists but your profile is incomplete.\n\n💡 Please contact support to complete your account setup, or try registering again with a different email.' 
          };
        }

        console.log('✅ AuthContext: User profile found:', userProfile);

        // Check if user is active
        if (userProfile.is_active === false) {
          console.error('❌ AuthContext: ===== USER ACCOUNT INACTIVE =====');
          console.log('🔐 AuthContext: Signing out inactive user...');
          await supabase.auth.signOut();
          return { 
            success: false, 
            error: 'Your account has been deactivated. Please contact support.' 
          };
        }

        // Verify the user has the correct role
        console.log('🔍 AuthContext: ===== ROLE VERIFICATION =====');
        console.log('🔍 AuthContext: Role check:', {
          expectedRole: role,
          actualRole: userProfile.role,
          rolesMatch: userProfile.role === role,
          userName: `${userProfile.first_name} ${userProfile.last_name}`
        });

        if (userProfile.role !== role) {
          console.error('❌ AuthContext: ===== ROLE MISMATCH =====');
          console.error('❌ AuthContext: User has wrong role');
          console.log('🔐 AuthContext: Signing out user due to role mismatch...');
          await supabase.auth.signOut();
          return { 
            success: false, 
            error: `This account is registered as a ${userProfile.role}. Please use the ${userProfile.role} login page instead.` 
          };
        }

        console.log('✅ AuthContext: ===== ROLE VERIFICATION PASSED =====');
        console.log('✅ AuthContext: Role verified successfully');
        console.log('✅ AuthContext: Welcome', `${userProfile.first_name} ${userProfile.last_name} (${role})`);
        
        // Set user and role state
        console.log('🔐 AuthContext: ===== UPDATING STATE =====');
        setUser(data.user);
        setUserRole(role);
        
        console.log('🔐 AuthContext: State updated successfully:', { 
          user: !!data.user, 
          userRole: role,
          userId: data.user.id,
          userEmail: data.user.email
        });
        
        console.log('🎉 AuthContext: ===== SIGN-IN COMPLETED SUCCESSFULLY =====');
        return { success: true };
      }

      console.error('❌ AuthContext: ===== NO USER RETURNED =====');
      console.error('❌ AuthContext: Authentication succeeded but no user object returned');
      return { success: false, error: 'Sign in failed - no user data returned' };
    } catch (error) {
      console.error('❌ AuthContext: ===== UNEXPECTED ERROR =====');
      console.error('❌ AuthContext: Error type:', typeof error);
      console.error('❌ AuthContext: Error message:', error.message);
      console.error('❌ AuthContext: Error stack:', error.stack);
      console.error('❌ AuthContext: Full error object:', JSON.stringify(error, null, 2));
      return { success: false, error: `An unexpected error occurred: ${error.message}` };
    }
  };

  const signUp = async (email: string, password: string, role: 'student' | 'professor', additionalData: any) => {
    try {
      console.log('🚀 AuthContext: Starting signUp process');
      console.log('📧 Email:', email);
      console.log('👤 Role:', role);
      console.log('📝 Additional Data:', {
        firstName: additionalData.firstName,
        lastName: additionalData.lastName,
        ...(role === 'student' ? { studentNumber: additionalData.studentNumber } : { employeeId: additionalData.employeeId })
      });
      
      // Validate required fields
      const requiredFields = ['firstName', 'lastName'];
      if (role === 'student') {
        requiredFields.push('studentNumber');
      } else {
        requiredFields.push('employeeId');
      }
      
      const validation = validateRequiredFields(additionalData, requiredFields);
      if (!validation.valid) {
        console.error('❌ Required fields validation failed:', validation.missingFields);
        return {
          success: false,
          error: validation.message || 'Please fill in all required fields'
        };
      }

      // Validate student ID format (exactly 7 digits)
      if (role === 'student') {
        const studentNumberRegex = /^\d{7}$/;
        if (!studentNumberRegex.test(additionalData.studentNumber?.trim() || '')) {
          console.error('❌ Invalid student ID format:', additionalData.studentNumber);
          return {
            success: false,
            error: 'Student ID must be exactly 7 digits.\n\n💡 Example: 5002378\n\nPlease enter your official university student ID number.'
          };
        }
        console.log('✅ Student ID format validated:', additionalData.studentNumber);
      }

      // Validate employee ID format (for professors - at least 3 characters)
      if (role === 'professor') {
        if (!additionalData.employeeId || additionalData.employeeId.trim().length < 3) {
          console.error('❌ Invalid employee ID format:', additionalData.employeeId);
          return {
            success: false,
            error: 'Employee ID must be at least 3 characters long.\n\n💡 Example: EMP12345\n\nPlease enter your official employee ID.'
          };
        }
        console.log('✅ Employee ID format validated:', additionalData.employeeId);
      }
      
      // Test database connection first
      console.log('🔍 Testing database connection...');
      const dbTest = await testDatabaseConnection(supabase);
      if (dbTest) {
        console.error('❌ Database connection test failed');
        return {
          success: false,
          error: formatErrorForUser(dbTest)
        };
      }
      console.log('✅ Database connection successful');
      
      // Validate password strength
      console.log('🔐 Validating password strength...');
      const { validatePassword } = await import('./password-validator');
      const passwordValidation = validatePassword(password);
      
      if (!passwordValidation.isValid) {
        console.error('❌ Password validation failed:', passwordValidation.errors);
        return { 
          success: false, 
          error: passwordValidation.errors[0] || 'Password does not meet security requirements' 
        };
      }
      
      if (!passwordValidation.strength.isValid) {
        console.error('❌ Password strength insufficient');
        return { 
          success: false, 
          error: 'Password is not strong enough. Please create a more secure password.' 
        };
      }
      
      console.log('✅ Password validation passed');
      
      // Check if user already exists before creating account
      console.log('🔍 Checking for duplicate email...');
      const { data: finalCheckUsers } = await supabaseAdmin.auth.admin.listUsers();
      const duplicateUser = finalCheckUsers?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
      
      if (duplicateUser) {
        console.error('❌ Email already exists! Found duplicate:', duplicateUser.id);
        
        // Check if they have a profile to give better guidance (use admin to bypass RLS)
        const { data: existingProfile } = await supabaseAdmin
          .from('users')
          .select('role, first_name, last_name')
          .eq('id', duplicateUser.id)
          .single();
        
        console.log('📋 Profile check:', existingProfile ? `Found ${existingProfile.role}` : 'No profile');
        
        if (existingProfile) {
          return {
            success: false,
            error: `This email is already registered as a ${existingProfile.role}.\n\n💡 Please sign in instead:\n   • Go to /${existingProfile.role}/login\n   • Use your email and password\n   • Or click "Forgot Password" if needed`
          };
        } else {
          return {
            success: false,
            error: 'This email is already in use but the account is incomplete.\n\n💡 Please contact support or try using a different email address.'
          };
        }
      }
      
      console.log('✅ Email is available, proceeding with registration...');
      
      // First, create the auth user with metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: additionalData.firstName,
            last_name: additionalData.lastName,
            role: role
          }
        }
      });

      console.log('AuthContext: Supabase auth response', { authData, authError });

      if (authError) {
        logDetailedError('Supabase Auth SignUp', authError, {
          email,
          role
        });
        
        // Handle specific error cases
        if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
          return { 
            success: false, 
            error: `This email is already registered.\n\n💡 Please sign in instead at /${role}/login` 
          };
        }
        
        const parsedError = parseSupabaseError(authError, 'account creation');
        return { success: false, error: formatErrorForUser(parsedError) };
      }

      if (!authData.user) {
        console.error('AuthContext: No user created');
        return { 
          success: false, 
          error: 'Account creation failed. No user data returned.\n\n💡 Please try again or contact support if this persists.' 
        };
      }

      // Wait for the trigger to create the user profile, then verify it exists
      console.log('AuthContext: Waiting for user profile creation...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check if user profile was created by trigger
      const { data: userProfile, error: userProfileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (userProfileError || !userProfile) {
        console.log('AuthContext: User profile not created by trigger, creating manually...');
        
        // Create user profile manually using admin client to bypass RLS
        const { error: userError } = await supabaseAdmin
          .from('users')
          .insert({
            id: authData.user.id,
            email: authData.user.email,
            first_name: additionalData.firstName,
            last_name: additionalData.lastName,
            role: role
          });

        if (userError) {
          logDetailedError('Create User Profile', userError, {
            userId: authData.user.id,
            email: authData.user.email,
            role,
            firstName: additionalData.firstName,
            lastName: additionalData.lastName
          });
          
          const parsedError = parseSupabaseError(userError, 'user profile creation');
          return { 
            success: false, 
            error: formatErrorForUser(parsedError)
          };
        }
      }

      // Create role-specific profile using admin client to bypass RLS
      if (role === 'student') {
        let studentId = additionalData.studentNumber || `STU${Date.now()}`;
        let attempts = 0;
        let studentError = null;
        
        // Try to create student profile, generate new ID if there's a conflict
        do {
          const { error } = await supabaseAdmin
            .from('students')
            .insert({
              user_id: authData.user.id,
              student_id: studentId,
              enrollment_year: new Date().getFullYear(),
              major: additionalData.major || null
            });
          
          studentError = error;
          attempts++;
          
          // If there's a duplicate key error, generate a new student ID
          if (studentError && studentError.code === '23505' && attempts < 3) {
            studentId = `STU${Date.now()}${Math.random().toString(36).substr(2, 4)}`;
            console.log(`Retrying with new student ID: ${studentId}`);
          }
        } while (studentError && studentError.code === '23505' && attempts < 3);

        if (studentError) {
          logDetailedError('Create Student Profile', studentError, {
            userId: authData.user.id,
            studentId,
            attempts,
            enrollmentYear: new Date().getFullYear(),
            major: additionalData.major
          });
          
          const parsedError = parseSupabaseError(studentError, 'student profile creation');
          return { 
            success: false, 
            error: formatErrorForUser(parsedError)
          };
        }
      } else if (role === 'professor') {
        const { error: professorError } = await supabaseAdmin
          .from('professors')
          .insert({
            user_id: authData.user.id,
            employee_id: additionalData.employeeId || `EMP${Date.now()}`,
            title: additionalData.title || null,
            office_location: additionalData.officeLocation || null,
            phone: additionalData.phone || null
          });

        if (professorError) {
          logDetailedError('Create Professor Profile', professorError, {
            userId: authData.user.id,
            employeeId: additionalData.employeeId,
            title: additionalData.title,
            officeLocation: additionalData.officeLocation
          });
          
          const parsedError = parseSupabaseError(professorError, 'professor profile creation');
          return { 
            success: false, 
            error: formatErrorForUser(parsedError)
          };
        }
      }

      // Confirm the user's email automatically
      console.log('AuthContext: Confirming user email...');
      const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(authData.user.id, {
        email_confirm: true
      });
      
      if (confirmError) {
        console.error('AuthContext: Could not confirm email automatically:', confirmError.message);
        console.error('AuthContext: Confirm error details:', confirmError);
        // Don't fail registration if email confirmation fails, but warn the user
        console.warn('AuthContext: Registration successful but email confirmation failed. User will need to confirm email manually.');
      } else {
        console.log('AuthContext: Email confirmed successfully');
      }

      setUser(authData.user);
      setUserRole(role);
      return { success: true };
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserRole(null);
  };

  const resetPassword = async (email: string, role: 'student' | 'professor') => {
    try {
      console.log('🔐 AuthContext: ===== PASSWORD RESET REQUEST =====');
      console.log('🔐 AuthContext: Email:', email, 'Role:', role);
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return { success: false, error: 'Please enter a valid email address' };
      }

      // Check if user exists in the database with the correct role
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('id, email, role, is_active')
        .eq('email', email.trim().toLowerCase())
        .single();

      if (userError || !userData) {
        console.log('🔐 AuthContext: User not found in database');
        return { success: false, error: 'No account found with this email address' };
      }

      if (userData.role !== role) {
        console.log('🔐 AuthContext: Role mismatch');
        return { 
          success: false, 
          error: `This email is registered as a ${userData.role}. Please use the ${userData.role} forgot password page.` 
        };
      }

      if (!userData.is_active) {
        console.log('🔐 AuthContext: Account inactive');
        return { success: false, error: 'This account has been deactivated. Please contact support.' };
      }

      // Send password reset email using Supabase Auth
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password?type=${role}`,
      });

      if (error) {
        console.error('🔐 AuthContext: Password reset error:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ AuthContext: Password reset email sent successfully');
      return { success: true };
    } catch (error) {
      console.error('🔐 AuthContext: Password reset error:', error);
      return { success: false, error: 'An unexpected error occurred. Please try again.' };
    }
  };

  const updatePassword = async (token: string, password: string, type: 'student' | 'professor') => {
    try {
      console.log('🔐 AuthContext: ===== UPDATE PASSWORD =====');
      console.log('🔐 AuthContext: Token exists:', !!token, 'Type:', type);
      
      // Validate password
      if (password.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters long' };
      }

      // Use Supabase Auth to update password
      const { data, error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        console.error('🔐 AuthContext: Password update error:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ AuthContext: Password updated successfully');
      return { success: true };
    } catch (error) {
      console.error('🔐 AuthContext: Password update error:', error);
      return { success: false, error: 'An unexpected error occurred. Please try again.' };
    }
  };

  const value = {
    user,
    userRole,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
