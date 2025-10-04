'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import ProtectedRoute from '@/components/protected-route';
import { NotificationPanel } from '@/components/notifications/notification-panel';
import { 
  BookOpen, Users, Calendar, QrCode, TrendingUp, Activity,
  Clock, Bell, Settings, LogOut, Plus, BarChart3, Zap,
  CheckCircle, XCircle, AlertCircle, ChevronRight, Sparkles,
  Moon, Sun, Menu, Home, GraduationCap, Shield, Edit,
  MapPin, Timer, Target, Award, Star, Flame, ChevronDown,
  Play, Pause, Eye, MoreHorizontal, Filter, Search
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import ProfileDropdown from '@/components/profile/profile-dropdown';
import ProfileEditModal from '@/components/profile/profile-edit-modal';
import PasswordChangeModal from '@/components/profile/password-change-modal';
import { supabase } from '@/lib/supabase';

interface ProfessorStats {
  totalClasses: number;
  totalStudents: number;
  activeSessions: number;
  todaySessions: number;
  averageAttendance: number;
  attendanceStreak: number;
  thisWeekSessions: number;
  topPerformingClass: string;
}

interface ClassData {
  id: string;
  code: string;
  name: string;
  room_location: string;
  schedule_info: string;
  enrolled_students: number;
  max_students: number;
  attendance_rate: number;
  next_session?: {
    date: string;
    start_time: string;
    end_time: string;
  };
  status: 'active' | 'upcoming' | 'completed';
  isToday?: boolean;
}

interface RecentSession {
  id: string;
  class_code: string;
  class_name: string;
  date: string;
  start_time: string;
  end_time: string;
  present_count: number;
  absent_count: number;
  late_count: number;
  total_students: number;
  attendance_rate: number;
  status: 'completed' | 'active' | 'upcoming';
}

function ProfessorDashboardContent() {
  const { user, signOut } = useAuth();
  const [stats, setStats] = useState<ProfessorStats>({
    totalClasses: 0,
    totalStudents: 0,
    activeSessions: 0,
    todaySessions: 0,
    averageAttendance: 0,
    attendanceStreak: 0,
    thisWeekSessions: 0,
    topPerformingClass: ''
  });
  const [myClasses, setMyClasses] = useState<ClassData[]>([]);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [todayClasses, setTodayClasses] = useState<ClassData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

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

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      console.log('🔍 Fetching user profile for user ID:', user.id);
      console.log('🔍 User metadata:', user.user_metadata);
      
      const { data, error } = await supabase
        .from('users' as any)
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching user profile:', error);
        console.log('🔍 Falling back to user metadata');
        
        // Create a basic profile from user metadata
        const fallbackProfile = {
          first_name: user.user_metadata?.first_name || 'User',
          last_name: user.user_metadata?.last_name || '',
          email: user.email || '',
          role: user.user_metadata?.role || 'professor',
          phone: user.user_metadata?.phone || '',
          office_location: user.user_metadata?.office_location || '',
          title: user.user_metadata?.title || ''
        };
        
        console.log('🔍 Using fallback profile:', fallbackProfile);
        setUserProfile(fallbackProfile);
        return;
      }
      
      // Combine database data with auth metadata for complete profile
      const completeProfile = {
        ...(data as any || {}),
        phone: user.user_metadata?.phone || '',
        office_location: user.user_metadata?.office_location || '',
        title: user.user_metadata?.title || ''
      };
      
      console.log('✅ User profile fetched:', completeProfile);
      setUserProfile(completeProfile);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const handleProfileSave = async (profileData: any) => {
    if (!user) return;
    
    try {
      console.log('Attempting to save profile data:', profileData);
      console.log('User ID:', user.id);
      
      // Check if names changed and handle name change tracking
      const namesChanged = profileData.first_name !== userProfile?.first_name || profileData.last_name !== userProfile?.last_name;
      
      if (namesChanged) {
        console.log('Names changed, checking name change limits...');
        
        // Import and use the name change service
        const { NameChangeService } = await import('@/lib/name-change-service');
        
        // Check if user can change their name
        const nameChangeInfo = await NameChangeService.getNameChangeInfo(user.id);
        
        if (!nameChangeInfo.canChange) {
          throw new Error('Name change limit reached for this month. Please try again next month.');
        }
        
        // Record the name change
        const nameChangeResult = await NameChangeService.changeName(
          user.id,
          userProfile?.first_name || '',
          userProfile?.last_name || '',
          profileData.first_name,
          profileData.last_name,
          profileData.nameChangeReason || 'Name change via profile edit'
        );
        
        if (!nameChangeResult.success) {
          throw new Error(nameChangeResult.message);
        }
        
        console.log('Name change recorded successfully:', nameChangeResult);
      }
      
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
        .from('users' as any)
        .update(usersTableData)
        .eq('id', user.id);
      
      if (usersError) {
        console.error('Error updating users table:', usersError);
        throw new Error(`Failed to save profile: ${usersError.message}`);
      }
      
      
      // Update auth metadata for additional fields (only if names changed)
      // DISABLED: Auth update causes redirect to landing page
      // if (namesChanged) {
      //   const { error: authError } = await supabase.auth.updateUser({
      //     data: authMetadataData
      //   });
      //   
      //   if (authError) {
      //     console.warn('Warning: Could not update auth metadata:', authError.message);
      //     // Don't throw error here, as the main update succeeded
      //   }
      // }
      
      // Update local state
      setUserProfile((prev: any) => ({ ...prev, ...profileData }));
    } catch (error) {
      console.error('Error saving profile:', error);
      throw error;
    }
  };

  const handlePasswordChange = async (currentPassword: string, newPassword: string) => {
    try {
      if (!user) {
        throw new Error('User not found');
      }

      // Get user profile information for validation
      const { data: profileData } = await supabase
        .from('users')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single();

      const { data: professorData } = await supabase
        .from('professors')
        .select('employee_id')
        .eq('user_id', user.id)
        .single();

      // Import and use the password change service
      const { PasswordChangeService } = await import('@/lib/password-change-service');
      
      const result = await PasswordChangeService.changePassword(
        user.id,
        user.email || '',
        currentPassword,
        newPassword,
        {
          firstName: profileData?.first_name || user.user_metadata?.first_name,
          lastName: profileData?.last_name || user.user_metadata?.last_name,
          employeeId: professorData?.employee_id
        }
      );

      if (!result.success) {
        throw new Error(result.error || 'Password change failed');
      }
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

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Fetch user profile
      await fetchUserProfile();
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockStats: ProfessorStats = {
        totalClasses: 5,
        totalStudents: 125,
        activeSessions: 2,
        todaySessions: 3,
        averageAttendance: 87.5,
        attendanceStreak: 8,
        thisWeekSessions: 12,
        topPerformingClass: 'CSC-301'
    };

    const mockClasses: ClassData[] = [
      {
          id: '1',
        code: 'CSC-475',
        name: 'Seminar in Computer Science',
        room_location: 'Room 101',
        schedule_info: 'MWF 10:00-10:50',
          enrolled_students: 18,
        max_students: 25,
          attendance_rate: 89.5,
          status: 'upcoming',
          isToday: true,
          next_session: {
            date: new Date().toISOString().split('T')[0],
            start_time: '10:00',
            end_time: '10:50'
          }
        },
        {
          id: '2',
        code: 'CSC-301',
        name: 'Data Structures and Algorithms',
        room_location: 'Room 205',
        schedule_info: 'MWF 14:00-14:50',
          enrolled_students: 28,
        max_students: 30,
          attendance_rate: 92.8,
          status: 'active',
          isToday: true,
          next_session: {
            date: new Date().toISOString().split('T')[0],
            start_time: '14:00',
            end_time: '14:50'
          }
        },
        {
          id: '3',
          code: 'CSC-150',
          name: 'Introduction to Programming',
          room_location: 'Room 110',
          schedule_info: 'TTh 09:00-10:15',
          enrolled_students: 32,
          max_students: 35,
          attendance_rate: 78.2,
          status: 'upcoming',
          isToday: true
        }
      ];

      const mockRecentSessions: RecentSession[] = [
        {
          id: '1',
          class_code: 'CSC-475',
          class_name: 'Seminar in Computer Science',
          date: new Date().toISOString().split('T')[0],
          start_time: '10:00',
          end_time: '10:50',
        present_count: 16,
          absent_count: 1,
          late_count: 1,
          total_students: 18,
          attendance_rate: 94.4,
          status: 'completed'
        },
        {
          id: '2',
          class_code: 'CSC-301',
          class_name: 'Data Structures',
          date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
          start_time: '14:00',
          end_time: '14:50',
          present_count: 26,
          absent_count: 1,
        late_count: 1,
          total_students: 28,
          attendance_rate: 96.4,
          status: 'completed'
        }
      ];
      
      setStats(mockStats);
      setMyClasses(mockClasses);
      setRecentSessions(mockRecentSessions);
      setTodayClasses(mockClasses.filter(c => c.isToday));
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-500 text-white';
      case 'upcoming':
        return 'bg-blue-500 text-white';
      case 'completed':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getAttendanceColor = (rate: number) => {
    if (rate >= 90) return 'text-emerald-600';
    if (rate >= 80) return 'text-blue-600';
    if (rate >= 70) return 'text-amber-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner />
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
            <Link href="/professor/dashboard" className="flex items-center space-x-3 group">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 dark:text-white">FSAS</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">Professor Portal</p>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="hidden lg:flex items-center space-x-1">
              <Link href="/professor/dashboard">
                <Button variant="ghost" size="sm" className="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900 hover:bg-blue-100 dark:hover:bg-blue-800">
                  <Home className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <Link href="/professor/classes">
                <Button variant="ghost" size="sm" className="hover:bg-slate-100 dark:hover:bg-slate-700">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Classes
                </Button>
              </Link>
              <Link href="/professor/sessions">
                <Button variant="ghost" size="sm" className="hover:bg-slate-100 dark:hover:bg-slate-700">
                  <QrCode className="w-4 h-4 mr-2" />
                  Sessions
                </Button>
              </Link>
              <Link href="/professor/students">
                <Button variant="ghost" size="sm" className="hover:bg-slate-100 dark:hover:bg-slate-700">
                  <Users className="w-4 h-4 mr-2" />
                  Students
                </Button>
              </Link>
              <Link href="/professor/analytics">
                <Button variant="ghost" size="sm" className="hover:bg-slate-100 dark:hover:bg-slate-700">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Analytics
                </Button>
              </Link>
            </nav>

            {/* Right Actions */}
            <div className="flex items-center space-x-3">
              {/* Time */}
              <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg">
                <Clock className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

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
                onSignOut={handleSignOut}
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
        {/* Welcome Section - Clean & Focused */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
                Good {currentTime.getHours() < 12 ? 'Morning' : currentTime.getHours() < 17 ? 'Afternoon' : 'Evening'}{userProfile?.first_name ? `, ${userProfile.first_name}` : ''}! 👋
              </h1>
              <p className="text-xl text-slate-600 dark:text-slate-400">
                {currentTime.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
            </div>
            <div className="hidden lg:flex items-center space-x-4">
              <Link href="/professor/sessions/new">
                <Button className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
                  <QrCode className="w-5 h-5 mr-2" />
                  Start Session
                </Button>
              </Link>
              <Link href="/professor/classes">
                <Button variant="outline" className="border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 px-6 py-3 rounded-xl">
                  <Plus className="w-5 h-5 mr-2" />
                  New Class
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Key Metrics - Standardized Heights & Better Spacing */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Total Classes */}
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
                  Active this semester
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center ml-4">
                <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </Card>

          {/* Total Students */}
          <Card className="p-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-200 h-32">
            <div className="flex items-center justify-between h-full">
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">
                  Total Students
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                  {stats.totalStudents}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Across all classes
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900 rounded-xl flex items-center justify-center ml-4">
                <Users className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </Card>

          {/* Active Sessions */}
          <Card className="p-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-200 h-32">
            <div className="flex items-center justify-between h-full">
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">
                  Active Now
                </p>
                <div className="flex items-center space-x-2 mb-1">
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">
                    {stats.activeSessions}
                  </p>
                  {stats.activeSessions > 0 && (
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  )}
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Sessions running
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center ml-4">
                <Activity className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </Card>

          {/* Average Attendance */}
          <Card className="p-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-200 h-32">
            <div className="flex items-center justify-between h-full">
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">
                  Avg Attendance
                </p>
                <div className="flex items-end space-x-2 mb-1">
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">
                    {stats.averageAttendance}%
                  </p>
                  <div className="flex items-center text-emerald-600 dark:text-emerald-400">
                    <TrendingUp className="w-3 h-3" />
                    <span className="text-xs font-semibold ml-1">+2.3%</span>
                  </div>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Last 30 days
                </p>
              </div>
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900 rounded-xl flex items-center justify-center ml-4">
                <Target className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content Grid - Improved Layout & Alignment */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Today's Classes - PRIMARY CONTENT */}
          <div className="lg:col-span-2">
            <Card className="p-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Today's Classes</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {todayClasses.length} classes scheduled for {currentTime.toLocaleDateString('en-US', { weekday: 'long' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-sm font-semibold rounded-full">
                    {currentTime.toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                </div>
              </div>

              {todayClasses.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <Calendar className="w-10 h-10 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                    No classes today
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 mb-6">
                    Enjoy your day off! 🌟
                  </p>
                  <Link href="/professor/classes">
                    <Button variant="outline" className="border-slate-300 dark:border-slate-600">
                      <Plus className="w-4 h-4 mr-2" />
                      Create New Class
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {todayClasses.map((classData) => (
                    <div
                      key={classData.id}
                      className={`p-5 rounded-xl border-2 transition-all duration-200 hover:shadow-lg ${
                        classData.status === 'active' 
                          ? 'bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900 dark:to-emerald-800 border-emerald-200 dark:border-emerald-700' 
                          : classData.status === 'upcoming'
                          ? 'bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 border-blue-200 dark:border-blue-700'
                          : 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1">
                          <div className={`w-3 h-3 rounded-full ${
                            classData.status === 'active' ? 'bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50' :
                            classData.status === 'upcoming' ? 'bg-blue-500 shadow-lg shadow-blue-500/50' : 'bg-slate-400'
                          }`}></div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                {classData.code}
                              </h3>
                              <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                                classData.status === 'active' 
                                  ? 'bg-emerald-500 text-white' 
                                  : classData.status === 'upcoming'
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-slate-500 text-white'
                              }`}>
                                {classData.status}
                              </span>
                            </div>
                            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                              {classData.name}
                            </h4>
                            <div className="flex items-center space-x-4 text-xs text-slate-600 dark:text-slate-400">
                              <span className="flex items-center font-medium">
                                <Clock className="w-3 h-3 mr-1" />
                                {classData.schedule_info}
                              </span>
                              <span className="flex items-center font-medium">
                                <MapPin className="w-3 h-3 mr-1" />
                                {classData.room_location}
                              </span>
                              <span className="flex items-center font-medium">
                                <Users className="w-3 h-3 mr-1" />
                                {classData.enrolled_students}/{classData.max_students}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4 ml-4">
                          <div className="text-right">
                            <p className={`text-2xl font-bold ${getAttendanceColor(classData.attendance_rate)}`}>
                              {classData.attendance_rate}%
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Attendance</p>
                          </div>
                          {classData.status === 'upcoming' && (
                            <Link href={`/professor/sessions/new?classId=${classData.id}`}>
                              <Button className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200">
                                <Play className="w-4 h-4 mr-1" />
                                Start
                              </Button>
                            </Link>
                          )}
                          {classData.status === 'active' && (
                            <Link href={`/professor/sessions/active/${classData.id}`}>
                              <Button className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200">
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Right Sidebar - Improved Layout & Spacing */}
          <div className="space-y-6">
            {/* Performance Metrics */}
            <Card className="p-5 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Award className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Performance</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">This week</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900 dark:to-emerald-800 rounded-xl border border-emerald-200 dark:border-emerald-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center">
                        <Flame className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                        Attendance Streak
                      </span>
                    </div>
                    <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                      {stats.attendanceStreak}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">days</p>
                </div>

                <div className="p-3 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-xl border border-blue-200 dark:border-blue-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center">
                        <Calendar className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                        Sessions This Week
                      </span>
                    </div>
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {stats.thisWeekSessions}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900 dark:to-amber-800 rounded-xl border border-amber-200 dark:border-amber-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-amber-500 rounded-lg flex items-center justify-center">
                        <Star className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                        Top Performing
                      </span>
                    </div>
                    <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                      {stats.topPerformingClass}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Recent Activity */}
            <Card className="p-5 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-slate-500 to-slate-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Activity className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Activity</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Latest sessions</p>
                  </div>
                </div>
                <Link href="/professor/sessions">
                  <Button variant="ghost" size="sm" className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900">
                    View All
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>

              <div className="space-y-3">
                {recentSessions.slice(0, 3).map((session) => (
                  <div
                    key={session.id}
                    className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors border border-slate-200 dark:border-slate-600"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                        {session.class_code}
                      </h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        session.attendance_rate >= 90
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-400'
                          : session.attendance_rate >= 80
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-400'
                      }`}>
                        {session.attendance_rate}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">
                        {new Date(session.date).toLocaleDateString()}
                      </span>
                      <div className="flex items-center space-x-3">
                        <span className="flex items-center text-emerald-600 dark:text-emerald-400">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {session.present_count}
                        </span>
                        <span className="flex items-center text-amber-600 dark:text-amber-400">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          {session.late_count}
                        </span>
                        <span className="flex items-center text-red-500">
                          <XCircle className="w-3 h-3 mr-1" />
                          {session.absent_count}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="p-5 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link href="/professor/sessions/new">
                  <Button className="w-full justify-start bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-lg shadow-lg">
                    <QrCode className="w-4 h-4 mr-3" />
                    Generate QR Code
                  </Button>
                </Link>
                <Link href="/professor/classes">
                  <Button variant="outline" className="w-full justify-start hover:bg-blue-50 dark:hover:bg-blue-900 border-slate-300 dark:border-slate-600 rounded-lg">
                    <Plus className="w-4 h-4 mr-3" />
                    Create New Class
                  </Button>
                </Link>
                <Link href="/professor/analytics">
                  <Button variant="outline" className="w-full justify-start hover:bg-purple-50 dark:hover:bg-purple-900 border-slate-300 dark:border-slate-600 rounded-lg">
                    <BarChart3 className="w-4 h-4 mr-3" />
                    View Analytics
                  </Button>
                </Link>
                <Link href="/professor/students">
                  <Button variant="outline" className="w-full justify-start hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-lg">
                    <Users className="w-4 h-4 mr-3" />
                    Manage Students
                  </Button>
                </Link>
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

export default function ProfessorDashboard() {
  return (
    <ProtectedRoute requiredRole="professor">
      <ProfessorDashboardContent />
    </ProtectedRoute>
  );
}