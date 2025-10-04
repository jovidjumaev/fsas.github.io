'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth-context';
import { GraduationCap, Mail, Lock, ArrowRight, AlertCircle, Zap, Moon, Sun } from 'lucide-react';

export default function StudentLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const router = useRouter();
  const { signIn } = useAuth();

  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(savedMode);
    if (savedMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('darkMode', String(newMode));
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🎓 Student Login: ===== FORM SUBMISSION STARTED =====');
    console.log('🎓 Student Login: Form data:', { 
      email, 
      passwordLength: password?.length || 0,
      passwordProvided: !!password,
      isLoading,
      hasError: !!error
    });
    
    setIsLoading(true);
    setError('');

    try {
      console.log('🎓 Student Login: Starting login process...');
      console.log('🎓 Student Login: AuthContext available:', !!signIn);
      console.log('🎓 Student Login: Router available:', !!router);
      
      // Validate input
      if (!email || !password) {
        console.error('🎓 Student Login: VALIDATION FAILED - Missing fields');
        console.error('🎓 Student Login: Email provided:', !!email);
        console.error('🎓 Student Login: Password provided:', !!password);
        setError('Please fill in all fields');
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        console.error('🎓 Student Login: VALIDATION FAILED - Invalid email format');
        setError('Please enter a valid email address');
        return;
      }

      // Validate password length
      if (password.length < 6) {
        console.error('🎓 Student Login: VALIDATION FAILED - Password too short');
        setError('Password must be at least 6 characters long');
        return;
      }
      
      console.log('🎓 Student Login: Input validation passed');
      console.log('🎓 Student Login: Calling signIn function...');
      
      const result = await signIn(email, password, 'student');
      
      console.log('🎓 Student Login: ===== SIGN-IN RESULT =====');
      console.log('🎓 Student Login: Result object:', result);
      console.log('🎓 Student Login: Success:', result.success);
      console.log('🎓 Student Login: Error:', result.error);
      
      if (result.success) {
        console.log('✅ Student Login: SUCCESS - Redirecting to dashboard');
        console.log('🎓 Student Login: Router push to /student/dashboard');
        router.push('/student/dashboard');
      } else {
        console.error('❌ Student Login: FAILED - Processing error');
        console.error('❌ Student Login: Error message:', result.error);
        
        let errorMessage = result.error || 'Login failed. Please check your credentials.';
        
        // Handle specific error cases
        if (result.error?.includes('Please sign in as a')) {
          errorMessage = 'This account is not registered as a student. Please use the professor login page.';
          console.error('🎓 Student Login: SPECIFIC ERROR - Role mismatch');
        } else if (result.error?.includes('Invalid email or password')) {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.';
          console.error('🎓 Student Login: SPECIFIC ERROR - Invalid credentials');
        } else if (result.error?.includes('Email not confirmed')) {
          errorMessage = 'Please check your email and click the confirmation link before signing in.';
          console.error('🎓 Student Login: SPECIFIC ERROR - Email not confirmed');
        } else if (result.error?.includes('User profile not found')) {
          errorMessage = 'Account setup incomplete. Please contact support or try registering again.';
          console.error('🎓 Student Login: SPECIFIC ERROR - Profile not found');
        } else if (result.error?.includes('Database error')) {
          errorMessage = 'System error. Please try again or contact support.';
          console.error('🎓 Student Login: SPECIFIC ERROR - Database error');
        } else {
          console.error('🎓 Student Login: GENERIC ERROR - Using provided message');
        }
        
        setError(errorMessage);
      }
    } catch (err) {
      console.error('❌ Student Login: ===== UNEXPECTED ERROR =====');
      console.error('❌ Student Login: Error type:', typeof err);
      console.error('❌ Student Login: Error message:', err.message);
      console.error('❌ Student Login: Error stack:', err.stack);
      console.error('❌ Student Login: Full error:', JSON.stringify(err, null, 2));
      setError('An unexpected error occurred. Please try again.');
    } finally {
      console.log('🎓 Student Login: ===== FORM SUBMISSION COMPLETED =====');
      console.log('🎓 Student Login: Setting loading to false');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">

      {/* Header */}
      <header className="border-b border-gray-200/80 dark:border-gray-700/80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl fixed top-0 left-0 right-0 z-50 shadow-sm dark:shadow-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-3 group cursor-pointer">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl blur-md opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <div className="relative w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Zap className="w-5 h-5 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent group-hover:from-blue-700 group-hover:to-cyan-700 transition-all">
                  FSAS
                </h1>
                <p className="text-xs text-gray-600 dark:text-gray-400">Furman Smart Attendance System</p>
              </div>
            </Link>
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-gray-700" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-screen pt-16 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 relative z-10">
          {/* Page Header */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl shadow-xl mb-6 relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <GraduationCap className="w-10 h-10 text-white relative z-10" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-2">
              Student Portal
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Sign in to access your classes and attendance
            </p>
          </div>

          {/* Login Form Card */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-3xl opacity-0 group-hover:opacity-20 blur-xl transition-all duration-500"></div>
            <Card className="relative bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-3xl p-8 shadow-xl">
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    </div>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:text-white"
                      placeholder="student@furman.edu"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    </div>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 h-12 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:text-white"
                      placeholder="Enter your password"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end">
                  <Link href="/student/forgot-password" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                    Forgot password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/50 transition-all duration-300 flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <span>Signing in...</span>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-medium">New student?</span>
                  </div>
                </div>

                <div className="mt-6">
                  <Link href="/student/register">
                    <Button variant="outline" className="w-full h-12 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 rounded-xl font-semibold transition-all dark:text-white dark:hover:bg-gray-700">
                      Create Student Account
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </div>

          {/* Back to Home */}
          <div className="text-center">
            <Link href="/" className="inline-flex items-center space-x-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
              <ArrowRight className="w-4 h-4 rotate-180" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}
