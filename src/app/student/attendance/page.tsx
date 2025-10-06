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
import { useStudentAttendance } from '@/hooks/use-student-attendance';
import { 
  GraduationCap,
  QrCode, 
  Calendar,
  TrendingUp,
  Clock,
  MapPin,
  User,
  BookOpen,
  BarChart3,
  Home,
  Moon,
  Sun,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  Search,
  Download,
  Eye,
  ChevronDown,
  RefreshCw
} from 'lucide-react';

interface AttendanceRecord {
  id: string;
  class_code: string;
  class_name: string;
  professor: string;
  room: string;
  date: string;
  time: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  scanned_at?: string;
  minutes_late?: number;
}

interface AttendanceStats {
  totalClasses: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  attendanceRate: number;
  currentStreak: number;
  longestStreak: number;
}

function StudentAttendanceContent() {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats>({
    totalClasses: 0,
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    attendanceRate: 0,
    currentStreak: 0,
    longestStreak: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [classFilter, setClassFilter] = useState<string>('all');
  const { user, signOut } = useAuth();
  const router = useRouter();

  // Use the real data hook
  const {
    attendanceRecords: realAttendanceRecords,
    stats: realStats,
    isLoading: dataLoading,
    error: dataError,
    refreshData
  } = useStudentAttendance(user);

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
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) {
        const fallbackProfile = {
          first_name: user.user_metadata?.first_name || 'Student',
          last_name: user.user_metadata?.last_name || '',
          email: user.email || '',
          role: user.user_metadata?.role || 'student'
        };
        setUserProfile(fallbackProfile);
        return;
      }
      
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
      
      
      // Update auth metadata for additional fields
      // DISABLED: Auth update causes redirect to landing page
      // const { error: authError } = await supabase.auth.updateUser({
      //   data: authMetadataData
      // });
      // 
      // if (authError) {
      //   console.warn('Warning: Could not update auth metadata:', authError.message);
      //   // Don't throw error here, as the main update succeeded
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
    if (!user) {
      console.error('No user found for avatar upload');
      throw new Error('User not authenticated');
    }
    
    try {
      console.log('Starting avatar upload for user:', user.id);
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.');
      }
      
      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error('File size too large. Please upload an image smaller than 5MB.');
      }
      
      // Create a unique filename
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const fileName = `${user.id}.${fileExt}`;
      const filePath = `avatars/${fileName}`;
      
      console.log('Uploading file to path:', filePath);
      
      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error(`Failed to upload file: ${uploadError.message}`);
      }
      
      console.log('File uploaded successfully:', uploadData);
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      console.log('Public URL generated:', publicUrl);
      
      // Update user profile with avatar URL
      const { data: updateData, error: updateError } = await supabase
        .from('users')
        .update({ 
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select();
      
      if (updateError) {
        console.error('Database update error:', updateError);
        throw new Error(`Failed to update profile: ${updateError.message}`);
      }
      
      console.log('Profile updated successfully:', updateData);
      
      // Update local state
      setUserProfile((prev: any) => ({ ...prev, avatar_url: publicUrl }));
      
      console.log('Avatar upload completed successfully');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  };

  const handleDeleteAvatar = async () => {
    if (!user) {
      console.error('No user found for avatar deletion');
      throw new Error('User not authenticated');
    }
    
    try {
      console.log('Starting avatar deletion for user:', user.id);
      
      // Remove avatar from storage if it exists
      if (userProfile?.avatar_url) {
        const fileName = userProfile.avatar_url.split('/').pop();
        if (fileName) {
          const { error: deleteError } = await supabase.storage
            .from('avatars')
            .remove([`avatars/${fileName}`]);
          
          if (deleteError) {
            console.warn('Error deleting avatar from storage:', deleteError);
          } else {
            console.log('Avatar deleted from storage successfully');
          }
        }
      }
      
      // Update user profile to remove avatar_url
      const { data: updateData, error: updateError } = await supabase
        .from('users')
        .update({ 
          avatar_url: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select();
      
      if (updateError) {
        console.error('Database update error:', updateError);
        throw new Error(`Failed to update profile: ${updateError.message}`);
      }
      
      console.log('Profile updated successfully:', updateData);
      
      // Update local state
      setUserProfile((prev: any) => ({ ...prev, avatar_url: null }));
      
      console.log('Avatar deletion completed successfully');
    } catch (error) {
      console.error('Error deleting avatar:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchUserProfile();
    
    // Mock attendance data
    const mockRecords: AttendanceRecord[] = [
      {
        id: '1',
        class_code: 'CSC-475',
        class_name: 'Seminar in Computer Science',
        professor: 'Dr. Sarah Johnson',
        room: 'Room 101',
        date: '2024-01-15',
        time: '10:00 AM - 10:50 AM',
        status: 'present',
        scanned_at: '2024-01-15T10:15:00Z'
      },
      {
        id: '2',
        class_code: 'CSC-301',
        class_name: 'Data Structures',
        professor: 'Dr. Michael Chen',
        room: 'Room 205',
        date: '2024-01-15',
        time: '2:00 PM - 2:50 PM',
        status: 'present',
        scanned_at: '2024-01-15T14:05:00Z'
      },
      {
        id: '3',
        class_code: 'MAT-201',
        class_name: 'Calculus II',
        professor: 'Dr. Emily Davis',
        room: 'Room 301',
        date: '2024-01-15',
        time: '4:00 PM - 4:50 PM',
        status: 'late',
        scanned_at: '2024-01-15T16:10:00Z'
      },
      {
        id: '4',
        class_code: 'CSC-475',
        class_name: 'Seminar in Computer Science',
        professor: 'Dr. Sarah Johnson',
        room: 'Room 101',
        date: '2024-01-14',
        time: '10:00 AM - 10:50 AM',
        status: 'present',
        scanned_at: '2024-01-14T10:12:00Z'
      },
      {
        id: '5',
        class_code: 'CSC-301',
        class_name: 'Data Structures',
        professor: 'Dr. Michael Chen',
        room: 'Room 205',
        date: '2024-01-14',
        time: '2:00 PM - 2:50 PM',
        status: 'present',
        scanned_at: '2024-01-14T14:03:00Z'
      },
      {
        id: '6',
        class_code: 'MAT-201',
        class_name: 'Calculus II',
        professor: 'Dr. Emily Davis',
        room: 'Room 301',
        date: '2024-01-14',
        time: '4:00 PM - 4:50 PM',
        status: 'absent'
      },
      {
        id: '7',
        class_code: 'CSC-475',
        class_name: 'Seminar in Computer Science',
        professor: 'Dr. Sarah Johnson',
        room: 'Room 101',
        date: '2024-01-13',
        time: '10:00 AM - 10:50 AM',
        status: 'present',
        scanned_at: '2024-01-13T10:08:00Z'
      },
      {
        id: '8',
        class_code: 'CSC-301',
        class_name: 'Data Structures',
        professor: 'Dr. Michael Chen',
        room: 'Room 205',
        date: '2024-01-13',
        time: '2:00 PM - 2:50 PM',
        status: 'present',
        scanned_at: '2024-01-13T14:01:00Z'
      },
      {
        id: '9',
        class_code: 'MAT-201',
        class_name: 'Calculus II',
        professor: 'Dr. Emily Davis',
        room: 'Room 301',
        date: '2024-01-13',
        time: '4:00 PM - 4:50 PM',
        status: 'present',
        scanned_at: '2024-01-13T16:02:00Z'
      }
    ];

    // Use real data from the hook instead of mock data
    // The hook will handle loading and error states
  }, [user]);

  // Update local state when real data changes
  useEffect(() => {
    if (realAttendanceRecords) {
      setAttendanceRecords(realAttendanceRecords);
    }
    if (realStats) {
      setStats({
        ...realStats,
        currentStreak: 0, // TODO: Calculate current streak from real data
        longestStreak: 0  // TODO: Calculate longest streak from real data
      });
    }
    if (dataLoading !== undefined) {
      setIsLoading(dataLoading);
    }
  }, [realAttendanceRecords, realStats, dataLoading]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30';
      case 'late':
        return 'text-amber-600 bg-amber-100 dark:bg-amber-900/30';
      case 'absent':
        return 'text-red-600 bg-red-100 dark:bg-red-900/30';
      case 'excused':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
      default:
        return 'text-slate-600 bg-slate-100 dark:bg-slate-900/30';
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
      case 'excused':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const filteredRecords = attendanceRecords.filter(record => {
    const matchesSearch = record.class_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.class_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.professor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    const matchesClass = classFilter === 'all' || record.class_code === classFilter;
    
    return matchesSearch && matchesStatus && matchesClass;
  });

  const uniqueClasses = [...new Set(attendanceRecords.map(r => r.class_code))];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-200 dark:border-emerald-800 border-t-emerald-600 dark:border-t-emerald-400 mx-auto mb-4"></div>
          <p className="text-slate-700 dark:text-slate-300 font-medium">Loading attendance data...</p>
        </div>
      </div>
    );
  }

  if (dataError) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Error Loading Data</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            {dataError}
          </p>
          <Button onClick={refreshData} className="bg-emerald-600 hover:bg-emerald-700">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Top Navigation */}
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
                <Button variant="ghost" size="sm" className="hover:bg-slate-100 dark:hover:bg-slate-700">
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
                <Button variant="ghost" size="sm" className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30">
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
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-4">
              {/* Time */}
              <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg">
                <Clock className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {/* Refresh Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={refreshData}
                disabled={dataLoading}
                className="hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${dataLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>

              <NotificationPanel />
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
              <ProfileDropdown
                user={user}
                userProfile={userProfile}
                onSignOut={signOut}
                onEditProfile={() => setShowProfileEdit(true)}
                onChangePassword={() => setShowPasswordChange(true)}
                onUploadAvatar={handleAvatarUpload}
                onDeleteAvatar={handleDeleteAvatar}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            Attendance History
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400">
            Track your class attendance and performance
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card className="p-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-200 h-32">
            <div className="flex items-center justify-between h-full">
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">
                  Attendance Rate
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                  {stats.attendanceRate}%
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Overall performance
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
                  Present
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                  {stats.present}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Classes attended
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center ml-4">
                <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-200 h-32">
            <div className="flex items-center justify-between h-full">
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">
                  Late
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                  {stats.late}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Late arrivals
                </p>
              </div>
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center ml-4">
                <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-200 h-32">
            <div className="flex items-center justify-between h-full">
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">
                  Excused
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                  {stats.excused}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Excused absences
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center ml-4">
                <AlertCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-200 h-32">
            <div className="flex items-center justify-between h-full">
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">
                  Current Streak
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                  {stats.currentStreak}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Days in a row
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center ml-4">
                <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="p-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search classes, professors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="lg:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="all">All Status</option>
                <option value="present">Present</option>
                <option value="late">Late</option>
                <option value="absent">Absent</option>
                <option value="excused">Excused</option>
              </select>
            </div>

            {/* Class Filter */}
            <div className="lg:w-48">
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="all">All Classes</option>
                {uniqueClasses.map(classCode => (
                  <option key={classCode} value={classCode}>{classCode}</option>
                ))}
              </select>
            </div>

            {/* Export Button */}
            <Button variant="outline" className="border-slate-300 dark:border-slate-600">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </Card>

        {/* Attendance Records */}
        <Card className="p-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Attendance Records
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {filteredRecords.length} records found
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-white">Class</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-white">Professor</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-white">Date & Time</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-white">Room</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-white">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-white">Scanned At</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{record.class_code}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{record.class_name}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-slate-900 dark:text-white">{record.professor}</p>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="text-slate-900 dark:text-white">{new Date(record.date).toLocaleDateString()}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{record.time}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-slate-900 dark:text-white">{record.room}</p>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(record.status)}`}>
                        {getStatusIcon(record.status)}
                        <span className="ml-1 capitalize">{record.status}</span>
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-slate-600 dark:text-slate-400">
                        {record.scanned_at ? new Date(record.scanned_at).toLocaleString() : 'N/A'}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredRecords.length === 0 && (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400">No attendance records found</p>
            </div>
          )}
        </Card>
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

export default function StudentAttendance() {
  return (
    <ProtectedRoute requiredRole="student">
      <StudentAttendanceContent />
    </ProtectedRoute>
  );
}
