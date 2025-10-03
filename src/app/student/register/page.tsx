'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth-context';
import { GraduationCap, Mail, Lock, User, Hash, BookOpen, ArrowRight, AlertCircle, Zap, Moon, Sun, Eye, EyeOff } from 'lucide-react';
import { PasswordInputWithStrength } from '@/components/ui/password-strength-indicator';
import { ErrorDisplay } from '@/components/ui/error-display';

export default function StudentRegisterPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    studentNumber: '',
    major: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const router = useRouter();
  const { user, userRole, loading, signUp } = useAuth();

  // Dark mode setup
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

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && user && userRole) {
      if (userRole === 'student') {
        router.push('/student/dashboard');
      } else if (userRole === 'professor') {
        router.push('/professor/dashboard');
      }
    }
  }, [user, userRole, loading, router]);

  const handleInputChange = (field: string) => (value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Validate required fields
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.studentNumber) {
        setError('Please fill in all required fields');
        return;
      }

      // Validate student number format (exactly 7 digits)
      const studentNumberRegex = /^\d{7}$/;
      if (!studentNumberRegex.test(formData.studentNumber.trim())) {
        setError('Student ID must be exactly 7 digits.\n\n💡 Example: 5002378\n\nPlease enter your official university student ID number.');
        return;
      }

      // Validate passwords match
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      console.log('🎓 Student registration attempt:', { 
        email: formData.email, 
        studentNumber: formData.studentNumber 
      });

      const result = await signUp(
        formData.email,
        formData.password,
        'student',
        {
          firstName: formData.firstName,
          lastName: formData.lastName,
          studentNumber: formData.studentNumber,
          major: formData.major || 'Computer Science'
        }
      );

      if (result.success) {
        console.log('✅ Student registration successful');
        router.push('/student/dashboard');
      } else {
        console.error('❌ Student registration failed:', result.error);
        setError(result.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('❌ Student registration error:', err);
      setError('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-200 via-gray-200 to-slate-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-700 dark:text-gray-300 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-200 via-gray-200 to-slate-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden transition-colors duration-300">
      {/* Background Animations */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(to right, rgb(59 130 246 / 0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgb(59 130 246 / 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }}></div>
      </div>

      {/* Floating Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/8 rounded-full blur-3xl animate-float-orb-slow"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-500/8 rounded-full blur-3xl animate-float-orb-slow" style={{ animationDelay: '5s' }}></div>
      </div>

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
              Create Student Account
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Join the FSAS platform and start tracking attendance
            </p>
          </div>

          {/* Registration Form Card */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-3xl opacity-0 group-hover:opacity-20 blur-xl transition-all duration-500"></div>
            <Card className="relative bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-3xl p-8 shadow-xl">
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <>
                    <ErrorDisplay
                      error={error}
                      title="Registration Failed"
                      onRetry={() => setError('')}
                      showDetails={true}
                    />
                    {error.includes('already registered') && (
                      <div className="flex items-center justify-center">
                        <Link 
                          href="/student/login"
                          className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-lg"
                        >
                          <span>Go to Sign In Page</span>
                          <ArrowRight className="w-5 h-5" />
                        </Link>
                      </div>
                    )}
                  </>
                )}

                {/* Personal Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      First Name *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                      </div>
                      <Input
                        id="firstName"
                        type="text"
                        required
                        value={formData.firstName}
                        onChange={handleInputChange('firstName')}
                        className="pl-10 h-12 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:text-white"
                        placeholder="John"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Last Name *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                      </div>
                      <Input
                        id="lastName"
                        type="text"
                        required
                        value={formData.lastName}
                        onChange={handleInputChange('lastName')}
                        className="pl-10 h-12 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:text-white"
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Email Address *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    </div>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange('email')}
                      className="pl-10 h-12 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:text-white"
                      placeholder="student@furman.edu"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="studentNumber" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Student ID Number * <span className="text-xs text-gray-500 dark:text-gray-400">(7 digits)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Hash className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    </div>
                    <Input
                      id="studentNumber"
                      type="text"
                      required
                      value={formData.studentNumber}
                      onChange={handleInputChange('studentNumber')}
                      className="pl-10 h-12 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:text-white"
                      placeholder="5002378"
                      maxLength={7}
                      pattern="\d{7}"
                      title="Student ID must be exactly 7 digits"
                    />
                  </div>
                  {formData.studentNumber && formData.studentNumber.length > 0 && (
                    <p className={`mt-2 text-sm flex items-center ${
                      /^\d{7}$/.test(formData.studentNumber) 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-orange-600 dark:text-orange-400'
                    }`}>
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {/^\d{7}$/.test(formData.studentNumber)
                        ? '✓ Valid student ID format'
                        : `${formData.studentNumber.length}/7 digits - Must be exactly 7 digits`
                      }
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="major" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Major (Optional)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <BookOpen className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    </div>
                    <Input
                      id="major"
                      type="text"
                      value={formData.major}
                      onChange={handleInputChange('major')}
                      className="pl-10 h-12 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:text-white"
                      placeholder="Computer Science"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Password *
                  </label>
                  <PasswordInputWithStrength
                    value={formData.password}
                    onChange={handleInputChange('password')}
                    onValidationChange={setIsPasswordValid}
                    placeholder="Create a strong password"
                    id="password"
                    name="password"
                    autoComplete="new-password"
                    required
                    showRequirements={true}
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type="password"
                      required
                      value={formData.confirmPassword}
                      onChange={handleInputChange('confirmPassword')}
                      className="h-12 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:text-white"
                      placeholder="Confirm your password"
                    />
                  </div>
                  {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      Passwords do not match
                    </p>
                  )}
                  {formData.confirmPassword && formData.password === formData.confirmPassword && (
                    <p className="mt-2 text-sm text-green-600 dark:text-green-400 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      Passwords match
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || !isPasswordValid}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/50 transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span>Creating Account...</span>
                  ) : (
                    <>
                      <span>Create Account</span>
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
                    <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-medium">Already have an account?</span>
                  </div>
                </div>

                <div className="mt-6">
                  <Link href="/student/login">
                    <Button variant="outline" className="w-full h-12 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 rounded-xl font-semibold transition-all dark:text-white dark:hover:bg-gray-700">
                      Sign In as Student
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
