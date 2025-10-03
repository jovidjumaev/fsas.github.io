'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth-context';
import { BookOpen, Mail, Lock, ArrowRight, AlertCircle, Zap, Moon, Sun } from 'lucide-react';

export default function ProfessorLogin() {
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
    setIsLoading(true);
    setError('');

    try {
      console.log('👨‍🏫 Professor login attempt:', { email, password: '***' });
      console.log('AuthContext available:', !!signIn);
      
      // Validate input
      if (!email || !password) {
        setError('Please fill in all fields');
        return;
      }
      
      const result = await signIn(email, password, 'professor');
      
      console.log('SignIn result:', result);
      
      if (result.success) {
        console.log('✅ Professor login successful, redirecting to dashboard');
        router.push('/professor/dashboard');
      } else {
        console.error('❌ Professor login failed:', result.error);
        if (result.error?.includes('Please sign in as a')) {
          setError('This account is not registered as a professor. Please use the student login page.');
        } else {
          setError(result.error || 'Login failed. Please check your credentials.');
        }
      }
    } catch (err) {
      console.error('❌ Professor login error:', err);
      setError('Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-200 via-gray-200 to-slate-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden transition-colors duration-300">
      {/* Background Animations */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(to right, rgb(6 182 212 / 0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgb(6 182 212 / 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }}></div>
      </div>

      {/* Floating Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 right-10 w-72 h-72 bg-cyan-500/8 rounded-full blur-3xl animate-float-orb-slow"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-blue-500/8 rounded-full blur-3xl animate-float-orb-slow" style={{ animationDelay: '5s' }}></div>
      </div>

      {/* Header */}
      <header className="border-b border-gray-200/80 dark:border-gray-700/80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl fixed top-0 left-0 right-0 z-50 shadow-sm dark:shadow-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-3 group cursor-pointer">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl blur-md opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <div className="relative w-10 h-10 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Zap className="w-5 h-5 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent group-hover:from-cyan-700 group-hover:to-blue-700 transition-all">
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
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-2xl shadow-xl mb-6 relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <BookOpen className="w-10 h-10 text-white relative z-10" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-2">
              Professor Portal
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Sign in to manage classes and track attendance
            </p>
          </div>

          {/* Login Form Card */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-3xl opacity-0 group-hover:opacity-20 blur-xl transition-all duration-500"></div>
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
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={setEmail}
                      className="pl-10 h-12 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-cyan-500 dark:text-white"
                      placeholder="professor@furman.edu"
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
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={setPassword}
                      className="pl-10 h-12 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-cyan-500 dark:text-white"
                      placeholder="Enter your password"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end">
                  <Link href="/professor/forgot-password" className="text-sm font-medium text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors">
                    Forgot password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold rounded-xl shadow-lg shadow-cyan-600/30 hover:shadow-xl hover:shadow-cyan-600/50 transition-all duration-300 flex items-center justify-center space-x-2"
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
                    <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-medium">New professor?</span>
                  </div>
                </div>

                <div className="mt-6">
                  <Link href="/professor/register">
                    <Button variant="outline" className="w-full h-12 border-2 border-gray-200 dark:border-gray-700 hover:border-cyan-300 dark:hover:border-cyan-600 rounded-xl font-semibold transition-all dark:text-white dark:hover:bg-gray-700">
                      Create Professor Account
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </div>

          {/* Back to Home */}
          <div className="text-center">
            <Link href="/" className="inline-flex items-center space-x-2 text-sm font-medium text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors">
              <ArrowRight className="w-4 h-4 rotate-180" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes float-orb-slow {
          0%, 100% {
            transform: translate(0, 0);
            opacity: 0.08;
          }
          50% {
            transform: translate(20px, -20px);
            opacity: 0.12;
          }
        }
        
        .animate-float-orb-slow {
          animation: float-orb-slow 20s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
