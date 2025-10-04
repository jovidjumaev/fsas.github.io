'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import ProtectedRoute from '@/components/protected-route';
import { NotificationPanel } from '@/components/notifications/notification-panel';
import ProfileDropdown from '@/components/profile/profile-dropdown';
import ProfileEditModal from '@/components/profile/profile-edit-modal';
import PasswordChangeModal from '@/components/profile/password-change-modal';
import { supabase } from '@/lib/supabase';
import { 
  GraduationCap,
  QrCode, 
  Calendar,
  TrendingUp,
  Clock,
  MapPin,
  User,
  Bell,
  Settings,
  LogOut,
  BookOpen,
  BarChart3,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  Moon,
  Sun,
  Home,
  Menu,
  X,
  ChevronDown,
  Edit,
  Lock,
  HelpCircle,
  Shield,
  ChevronLeft
} from 'lucide-react';

interface StudentData {
  student_id: string;
  student_number: string;
  enrollment_year: number;
  major: string;
  graduation_year: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  is_active: boolean;
  account_created: string;
}

interface ClassSession {
  id: string;
  class_code: string;
  class_name: string;
  time: string;
  room: string;
  professor: string;
  status: 'upcoming' | 'ongoing' | 'completed';
}

interface AttendanceRecord {
  date: string;
  status: 'present' | 'absent' | 'late';
  class_name: string;
}

function StudentDashboardContent() {
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [todayClasses, setTodayClasses] = useState<ClassSession[]>([]);
  const [recentAttendance, setRecentAttendance] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const { user, signOut } = useAuth();
  const router = useRouter();

  // Overall stats
  const [stats, setStats] = useState({
    overallAttendance: 85,
    totalClasses: 6,
    classesToday: 3,
    attendanceStreak: 12
  });

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

  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      console.log('🔍 Fetching user profile for user ID:', user.id);
      console.log('🔍 User metadata:', user.user_metadata);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching user profile:', error);
        console.log('🔍 Falling back to user metadata');
        
        // Create a basic profile from user metadata
        const fallbackProfile = {
          first_name: user.user_metadata?.first_name || 'Student',
          last_name: user.user_metadata?.last_name || '',
          email: user.email || '',
          role: user.user_metadata?.role || 'student'
        };
        
        console.log('🔍 Using fallback profile:', fallbackProfile);
        setUserProfile(fallbackProfile);
        return;
      }
      
      console.log('✅ User profile fetched:', data);
      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

      const handleProfileSave = async (profileData: any) => {
    if (!user) return;
    
    try {
      console.log('Attempting to save profile data:', profileData);
      console.log('User ID:', user.id);
      
      // Separate data for users table (only basic fields that exist)
      const usersTableData = {
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        updated_at: new Date().toISOString()
      };
      
      // Additional data for auth metadata (fields not in users table)
      const authMetadataData = {
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        phone: profileData.phone,
        office_location: profileData.office_location,
        title: profileData.title
      };
      
      // Update the users table with only existing columns
      const { error: usersError } = await supabase
        .from('users')
        .update(usersTableData)
        .eq('id', user.id);
      
      if (usersError) {
        console.error('Error updating users table:', usersError);
        throw new Error(`Failed to save profile: ${usersError.message}`);
      }
      
      console.log('Profile updated successfully in users table');
      
      // Update auth metadata for additional fields
      const { error: authError } = await supabase.auth.updateUser({
        data: authMetadataData
      });
      
      if (authError) {
        console.warn('Warning: Could not update auth metadata:', authError.message);
        // Don't throw error here, as the main update succeeded
      }
      
      // Update local state
      setUserProfile((prev: any) => ({ ...prev, ...profileData }));
    } catch (error) {
      console.error('Error saving profile:', error);
      throw error;
    }
  };

  const handlePasswordChange = async (currentPassword: string, newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!user) return;
    
    try {
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}.${fileExt}`;
      const filePath = `avatars/${fileName}`;
      
      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      // Update user profile with avatar URL
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl } as any)
        .eq('id', user.id);
      
      if (updateError) throw updateError;
      
      // Update local state
      setUserProfile((prev: any) => ({ ...prev, avatar_url: publicUrl }));
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  };

  useEffect(() => {
    // Fetch user profile
    fetchUserProfile();
    
    // TODO: Replace with actual Supabase calls
    const mockStudentData: StudentData = {
      student_id: user?.id || '123e4567-e89b-12d3-a456-426614174000',
      student_number: '5002378',
      enrollment_year: 2024,
      major: 'Computer Science',
      graduation_year: 2028,
      first_name: user?.user_metadata?.first_name || 'Student',
      last_name: user?.user_metadata?.last_name || 'User',
      email: user?.email || 'student@furman.edu',
      phone: '+1-555-0123',
      is_active: true,
      account_created: '2024-01-15T10:30:00Z'
    };

    const mockTodayClasses: ClassSession[] = [
      {
        id: '1',
        class_code: 'CSC-475',
        class_name: 'Seminar in Computer Science',
        time: '10:00 AM - 10:50 AM',
        room: 'Room 101',
        professor: 'Dr. Sarah Johnson',
        status: 'upcoming'
      },
      {
        id: '2',
        class_code: 'CSC-301',
        class_name: 'Data Structures',
        time: '2:00 PM - 2:50 PM',
        room: 'Room 205',
        professor: 'Dr. Michael Chen',
        status: 'upcoming'
      },
      {
        id: '3',
        class_code: 'MAT-201',
        class_name: 'Calculus II',
        time: '3:30 PM - 4:20 PM',
        room: 'Room 310',
        professor: 'Dr. Emily Davis',
        status: 'upcoming'
      }
    ];

    const mockRecentAttendance: AttendanceRecord[] = [
      { date: 'Today', status: 'present', class_name: 'CSC-475' },
      { date: 'Yesterday', status: 'present', class_name: 'CSC-301' },
      { date: 'Yesterday', status: 'late', class_name: 'MAT-201' },
      { date: '2 days ago', status: 'present', class_name: 'CSC-475' },
      { date: '2 days ago', status: 'absent', class_name: 'PHY-101' }
    ];

    setTimeout(() => {
      setStudentData(mockStudentData);
      setTodayClasses(mockTodayClasses);
      setRecentAttendance(mockRecentAttendance);
      setIsLoading(false);
    }, 800);
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'absent': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'late': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return <CheckCircle className="w-4 h-4" />;
      case 'absent': return <XCircle className="w-4 h-4" />;
      case 'late': return <AlertCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-200 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-700 dark:text-gray-300 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const isExpanded = !sidebarCollapsed || sidebarHovered;

  return (
    <div className="min-h-screen bg-slate-200 dark:bg-gray-900 transition-colors duration-300">
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 bg-white dark:bg-gray-800 shadow-xl transform transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 ${
          isExpanded ? 'w-64' : 'w-20'
        }`}
        onMouseEnter={() => sidebarCollapsed && setSidebarHovered(true)}
        onMouseLeave={() => setSidebarHovered(false)}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className={`p-6 border-b border-gray-200 dark:border-gray-700 flex items-center ${isExpanded ? 'justify-between' : 'justify-center'}`}>
            <Link href="/" className={`flex items-center ${isExpanded ? 'space-x-3' : 'justify-center'}`}>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              {isExpanded && (
                <div className="overflow-hidden">
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white whitespace-nowrap">FSAS</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">Student Portal</p>
                </div>
              )}
            </Link>
            {isExpanded && (
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden lg:block p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChevronLeft className={`w-5 h-5 text-gray-500 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} />
              </button>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <button className={`w-full flex items-center ${isExpanded ? 'space-x-3' : 'justify-center'} px-4 py-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl font-medium transition-all group relative`}>
              <Home className="w-5 h-5 flex-shrink-0" />
              {isExpanded && <span className="whitespace-nowrap">Dashboard</span>}
              {!isExpanded && !sidebarHovered && (
                <span className="absolute left-full ml-6 px-2 py-1 bg-gray-900 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  Dashboard
                </span>
              )}
            </button>
            
            <button className={`w-full flex items-center ${isExpanded ? 'space-x-3' : 'justify-center'} px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all group relative`}>
              <QrCode className="w-5 h-5 flex-shrink-0" />
              {isExpanded && <span className="whitespace-nowrap">Scan QR Code</span>}
              {!isExpanded && !sidebarHovered && (
                <span className="absolute left-full ml-6 px-2 py-1 bg-gray-900 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  Scan QR Code
                </span>
              )}
            </button>
            
            <button className={`w-full flex items-center ${isExpanded ? 'space-x-3' : 'justify-center'} px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all group relative`}>
              <BarChart3 className="w-5 h-5 flex-shrink-0" />
              {isExpanded && <span className="whitespace-nowrap">Attendance History</span>}
              {!isExpanded && !sidebarHovered && (
                <span className="absolute left-full ml-6 px-2 py-1 bg-gray-900 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  Attendance History
                </span>
              )}
            </button>
            
            <button className={`w-full flex items-center ${isExpanded ? 'space-x-3' : 'justify-center'} px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all group relative`}>
              <BookOpen className="w-5 h-5 flex-shrink-0" />
              {isExpanded && <span className="whitespace-nowrap">My Classes</span>}
              {!isExpanded && !sidebarHovered && (
                <span className="absolute left-full ml-6 px-2 py-1 bg-gray-900 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  My Classes
                </span>
              )}
            </button>
            
            <button className={`w-full flex items-center ${isExpanded ? 'space-x-3' : 'justify-center'} px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all group relative`}>
              <Calendar className="w-5 h-5 flex-shrink-0" />
              {isExpanded && <span className="whitespace-nowrap">Schedule</span>}
              {!isExpanded && !sidebarHovered && (
                <span className="absolute left-full ml-6 px-2 py-1 bg-gray-900 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  Schedule
                </span>
              )}
            </button>
          </nav>

        </div>
      </aside>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${isExpanded ? 'lg:pl-64' : 'lg:pl-20'}`}>
        {/* Top Header */}
        <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Welcome back, {studentData?.first_name}! 👋
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button 
                  onClick={toggleDarkMode}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  {isDarkMode ? (
                    <Sun className="w-5 h-5 text-yellow-500" />
                  ) : (
                    <Moon className="w-5 h-5 text-gray-700" />
                  )}
                </button>
                
                {/* Notification Panel */}
                <NotificationPanel />
                
                {/* Profile Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center space-x-3 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{studentData?.first_name} {studentData?.last_name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{studentData?.student_number}</p>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {profileDropdownOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setProfileDropdownOpen(false)}
                      ></div>
                      <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                        {/* User Info Header */}
                        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{studentData?.first_name} {studentData?.last_name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{studentData?.email}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">ID: {studentData?.student_number}</p>
                        </div>

                        {/* Menu Items */}
                        <div className="py-2">
                          <button className="w-full flex items-center space-x-3 px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                            <User className="w-4 h-4" />
                            <span className="text-sm">View Profile</span>
                          </button>
                          <button className="w-full flex items-center space-x-3 px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                            <Edit className="w-4 h-4" />
                            <span className="text-sm">Edit Profile</span>
                          </button>
                          <button className="w-full flex items-center space-x-3 px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                            <Lock className="w-4 h-4" />
                            <span className="text-sm">Change Password</span>
                          </button>
                        </div>

                        <div className="border-t border-gray-200 dark:border-gray-700 py-2">
                          <button className="w-full flex items-center space-x-3 px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                            <Settings className="w-4 h-4" />
                            <span className="text-sm">Settings</span>
                          </button>
                          <button className="w-full flex items-center space-x-3 px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                            <Shield className="w-4 h-4" />
                            <span className="text-sm">Privacy & Security</span>
                          </button>
                        </div>

                        <div className="border-t border-gray-200 dark:border-gray-700 py-2">
                          <button className="w-full flex items-center space-x-3 px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                            <HelpCircle className="w-4 h-4" />
                            <span className="text-sm">Help & Support</span>
                          </button>
                        </div>

                        <div className="border-t border-gray-200 dark:border-gray-700 py-2">
                          <button 
                            onClick={handleSignOut}
                            className="w-full flex items-center space-x-3 px-4 py-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            <span className="text-sm font-medium">Sign Out</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Overall Attendance */}
            <Card className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-blue-100 text-sm font-medium mb-1">Overall Attendance</p>
                  <h3 className="text-3xl font-bold">{stats.overallAttendance}%</h3>
                </div>
                <div className="p-3 bg-white/20 rounded-xl">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <div className="flex-1 bg-white/20 rounded-full h-2">
                  <div 
                    className="bg-white rounded-full h-2 transition-all duration-500" 
                    style={{ width: `${stats.overallAttendance}%` }}
                  ></div>
                </div>
                <span className="text-blue-100">+5%</span>
              </div>
            </Card>

            {/* Total Classes */}
            <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Total Classes</p>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalClasses}</h3>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                  <BookOpen className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Enrolled this semester</p>
            </Card>

            {/* Classes Today */}
            <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Classes Today</p>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{stats.classesToday}</h3>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                  <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">On your schedule</p>
            </Card>

            {/* Attendance Streak */}
            <Card className="p-6 bg-gradient-to-br from-orange-500 to-red-500 text-white border-0 shadow-xl">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-orange-100 text-sm font-medium mb-1">Attendance Streak</p>
                  <h3 className="text-3xl font-bold">{stats.attendanceStreak}</h3>
                </div>
                <div className="p-3 bg-white/20 rounded-xl">
                  <CheckCircle className="w-6 h-6" />
                </div>
              </div>
              <p className="text-sm text-orange-100">🔥 Days in a row</p>
            </Card>
          </div>

          {/* Today's Schedule & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Today's Schedule */}
            <Card className="lg:col-span-2 p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                  Today's Schedule
                </h3>
                <Link href="/student/schedule">
                  <Button variant="ghost" size="sm" className="text-blue-600 dark:text-blue-400">
                    View All <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
              
              <div className="space-y-4">
                {todayClasses.map((session) => (
                  <div 
                    key={session.id} 
                    className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-md transition-shadow bg-gray-50 dark:bg-gray-900/50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-full">
                            {session.class_code}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{session.status}</span>
                        </div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{session.class_name}</h4>
                        <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                          <p className="flex items-center">
                            <Clock className="w-4 h-4 mr-2" />
                            {session.time}
                          </p>
                          <p className="flex items-center">
                            <MapPin className="w-4 h-4 mr-2" />
                            {session.room}
                          </p>
                          <p className="flex items-center">
                            <User className="w-4 h-4 mr-2" />
                            {session.professor}
                          </p>
                        </div>
                      </div>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                        <QrCode className="w-4 h-4 mr-2" />
                        Mark Attendance
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Quick Actions */}
            <div className="space-y-4">
              <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow cursor-pointer group">
                <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl mb-4 group-hover:scale-105 transition-transform">
                  <QrCode className="w-8 h-8 text-white mx-auto" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-center mb-2">Scan QR Code</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">Mark your attendance</p>
                <Button className="w-full bg-blue-600 hover:bg-blue-700">Open Scanner</Button>
              </Card>

              <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow cursor-pointer group">
                <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-xl mb-4 group-hover:scale-105 transition-transform">
                  <BarChart3 className="w-8 h-8 text-white mx-auto" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-center mb-2">View Reports</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">Detailed analytics</p>
                <Button variant="outline" className="w-full border-gray-300 dark:border-gray-600">View History</Button>
              </Card>
            </div>
          </div>

          {/* Recent Attendance */}
          <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
                Recent Attendance
              </h3>
              <Link href="/student/attendance">
                <Button variant="ghost" size="sm" className="text-blue-600 dark:text-blue-400">
                  View All <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
            
            <div className="space-y-3">
              {recentAttendance.map((record, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-lg ${getStatusColor(record.status)}`}>
                      {getStatusIcon(record.status)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{record.class_name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{record.date}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(record.status)}`}>
                    {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
}

export default function StudentDashboard() {
  return (
    <ProtectedRoute requiredRole="student">
      <StudentDashboardContent />
    </ProtectedRoute>
  );
}
