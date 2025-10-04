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
        time: '4:00 PM - 4:50 PM',
        room: 'Room 301',
        professor: 'Dr. Emily Davis',
        status: 'upcoming'
      }
    ];

    const mockRecentAttendance: AttendanceRecord[] = [
      { date: '2024-01-15', status: 'present', class_name: 'CSC-475' },
      { date: '2024-01-15', status: 'present', class_name: 'CSC-301' },
      { date: '2024-01-15', status: 'late', class_name: 'MAT-201' },
      { date: '2024-01-14', status: 'present', class_name: 'CSC-475' },
      { date: '2024-01-14', status: 'present', class_name: 'CSC-301' },
      { date: '2024-01-14', status: 'absent', class_name: 'MAT-201' }
    ];

    setStudentData(mockStudentData);
    setTodayClasses(mockTodayClasses);
    setRecentAttendance(mockRecentAttendance);
    setIsLoading(false);
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'text-green-600 bg-green-100 dark:bg-green-900/30';
      case 'late':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
      case 'absent':
        return 'text-red-600 bg-red-100 dark:bg-red-900/30';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="w-4 h-4" />;
      case 'late':
        return <Clock className="w-4 h-4" />;
      case 'absent':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-200 dark:border-emerald-800 border-t-emerald-600 dark:border-t-emerald-400 mx-auto mb-4"></div>
          <p className="text-slate-700 dark:text-slate-300 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Top Navigation - Clean & Minimal */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/student/dashboard" className="flex items-center space-x-3 group">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 dark:text-white">FSAS</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">Student Portal</p>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="hidden lg:flex items-center space-x-1">
              <Link href="/student/dashboard">
                <Button variant="ghost" size="sm" className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30">
                  <Home className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <Link href="/student/scan">
                <Button variant="ghost" size="sm" className="hover:bg-slate-100 dark:hover:bg-slate-700">
                  <QrCode className="w-4 h-4 mr-2" />
                  Scan QR
                </Button>
              </Link>
              <Link href="/student/attendance">
                <Button variant="ghost" size="sm" className="hover:bg-slate-100 dark:hover:bg-slate-700">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Attendance
                </Button>
              </Link>
              <Link href="/student/classes">
                <Button variant="ghost" size="sm" className="hover:bg-slate-100 dark:hover:bg-slate-700">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Classes
                </Button>
              </Link>
              <Link href="/student/schedule">
                <Button variant="ghost" size="sm" className="hover:bg-slate-100 dark:hover:bg-slate-700">
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule
                </Button>
              </Link>
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <NotificationPanel />

              {/* Theme Toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                {isDarkMode ? (
                  <Sun className="w-5 h-5 text-amber-500" />
                ) : (
                  <Moon className="w-5 h-5 text-slate-600" />
                )}
              </button>

              {/* Profile Dropdown */}
              <ProfileDropdown
                user={user}
                userProfile={userProfile}
                onSignOut={signOut}
                onEditProfile={() => setShowProfileEdit(true)}
                onChangePassword={() => setShowPasswordChange(true)}
                onUploadAvatar={handleAvatarUpload}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            Welcome back, {userProfile ? `${userProfile.first_name} ${userProfile.last_name}` : 'Student'}! 👋
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric',
              year: 'numeric'
            })}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-200 h-32">
            <div className="flex items-center justify-between h-full">
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">
                  Overall Attendance
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                  {stats.overallAttendance}%
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  This semester
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center ml-4">
                <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-200 h-32">
            <div className="flex items-center justify-between h-full">
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">
                  Total Classes
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                  {stats.totalClasses}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Enrolled this semester
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center ml-4">
                <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-200 h-32">
            <div className="flex items-center justify-between h-full">
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">
                  Classes Today
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                  {stats.classesToday}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Scheduled sessions
                </p>
              </div>
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center ml-4">
                <Calendar className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-200 h-32">
            <div className="flex items-center justify-between h-full">
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">
                  Attendance Streak
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                  {stats.attendanceStreak}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Days in a row
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center ml-4">
                <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Today's Classes */}
          <div className="lg:col-span-2">
            <Card className="p-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Today's Classes</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {todayClasses.length} classes scheduled for today
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {todayClasses.map((classData) => (
                  <div
                    key={classData.id}
                    className="p-4 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 hover:shadow-lg transition-all duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                            {classData.class_code}
                          </h3>
                          <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold rounded-full">
                            {classData.status}
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                          {classData.class_name}
                        </h4>
                        <div className="flex items-center space-x-4 text-xs text-slate-600 dark:text-slate-400">
                          <span className="flex items-center font-medium">
                            <Clock className="w-3 h-3 mr-1" />
                            {classData.time}
                          </span>
                          <span className="flex items-center font-medium">
                            <MapPin className="w-3 h-3 mr-1" />
                            {classData.room}
                          </span>
                          <span className="flex items-center font-medium">
                            <User className="w-3 h-3 mr-1" />
                            {classData.professor}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <Button className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200">
                          <QrCode className="w-4 h-4 mr-1" />
                          Scan
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Recent Attendance */}
          <div className="space-y-6">
            <Card className="p-5 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <BarChart3 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Attendance</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Last 6 sessions</p>
                </div>
              </div>

              <div className="space-y-3">
                {recentAttendance.slice(0, 6).map((record, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${getStatusColor(record.status)}`}>
                        {getStatusIcon(record.status)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {record.class_name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {new Date(record.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(record.status)}`}>
                      {record.status}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="p-5 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Button className="w-full justify-start bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-lg shadow-lg">
                  <QrCode className="w-4 h-4 mr-3" />
                  Scan QR Code
                </Button>
                <Button variant="outline" className="w-full justify-start hover:bg-blue-50 dark:hover:bg-blue-900/20 border-slate-300 dark:border-slate-600 rounded-lg">
                  <BarChart3 className="w-4 h-4 mr-3" />
                  View Attendance
                </Button>
                <Button variant="outline" className="w-full justify-start hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-lg">
                  <Calendar className="w-4 h-4 mr-3" />
                  View Schedule
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* Profile Edit Modal */}
      <ProfileEditModal
        isOpen={showProfileEdit}
        onClose={() => setShowProfileEdit(false)}
        user={user}
        userProfile={userProfile}
        onSave={handleProfileSave}
      />

      {/* Password Change Modal */}
      <PasswordChangeModal
        isOpen={showPasswordChange}
        onClose={() => setShowPasswordChange(false)}
        onChangePassword={handlePasswordChange}
      />
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
