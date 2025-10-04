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
  BookOpen,
  BarChart3,
  Home,
  Moon,
  Sun,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  Eye
} from 'lucide-react';

interface ScheduleEvent {
  id: string;
  class_code: string;
  class_name: string;
  professor: string;
  room: string;
  start_time: string;
  end_time: string;
  day: string;
  type: 'class' | 'exam' | 'assignment' | 'break';
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  attendance_required: boolean;
  notes?: string;
}

interface WeeklyStats {
  totalClasses: number;
  completedClasses: number;
  upcomingClasses: number;
  attendanceRate: number;
}

function StudentScheduleContent() {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats>({
    totalClasses: 0,
    completedClasses: 0,
    upcomingClasses: 0,
    attendanceRate: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
  const [selectedDay, setSelectedDay] = useState<string>('');
  const { user, signOut } = useAuth();
  const router = useRouter();

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const timeSlots = [
    '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', 
    '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM'
  ];

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
    if (!user) return;
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}.${fileExt}`;
      const filePath = `avatars/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl } as any)
        .eq('id', user.id);
      
      if (updateError) throw updateError;
      
      setUserProfile((prev: any) => ({ ...prev, avatar_url: publicUrl }));
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchUserProfile();
    
    // Mock schedule data
    const mockEvents: ScheduleEvent[] = [
      {
        id: '1',
        class_code: 'CSC-475',
        class_name: 'Seminar in Computer Science',
        professor: 'Dr. Sarah Johnson',
        room: 'Room 101',
        start_time: '10:00',
        end_time: '10:50',
        day: 'Monday',
        type: 'class',
        status: 'upcoming',
        attendance_required: true
      },
      {
        id: '2',
        class_code: 'CSC-475',
        class_name: 'Seminar in Computer Science',
        professor: 'Dr. Sarah Johnson',
        room: 'Room 101',
        start_time: '10:00',
        end_time: '10:50',
        day: 'Wednesday',
        type: 'class',
        status: 'upcoming',
        attendance_required: true
      },
      {
        id: '3',
        class_code: 'CSC-475',
        class_name: 'Seminar in Computer Science',
        professor: 'Dr. Sarah Johnson',
        room: 'Room 101',
        start_time: '10:00',
        end_time: '10:50',
        day: 'Friday',
        type: 'class',
        status: 'upcoming',
        attendance_required: true
      },
      {
        id: '4',
        class_code: 'CSC-301',
        class_name: 'Data Structures',
        professor: 'Dr. Michael Chen',
        room: 'Room 205',
        start_time: '14:00',
        end_time: '14:50',
        day: 'Monday',
        type: 'class',
        status: 'upcoming',
        attendance_required: true
      },
      {
        id: '5',
        class_code: 'CSC-301',
        class_name: 'Data Structures',
        professor: 'Dr. Michael Chen',
        room: 'Room 205',
        start_time: '14:00',
        end_time: '14:50',
        day: 'Wednesday',
        type: 'class',
        status: 'upcoming',
        attendance_required: true
      },
      {
        id: '6',
        class_code: 'CSC-301',
        class_name: 'Data Structures',
        professor: 'Dr. Michael Chen',
        room: 'Room 205',
        start_time: '14:00',
        end_time: '14:50',
        day: 'Friday',
        type: 'class',
        status: 'upcoming',
        attendance_required: true
      },
      {
        id: '7',
        class_code: 'MAT-201',
        class_name: 'Calculus II',
        professor: 'Dr. Emily Davis',
        room: 'Room 301',
        start_time: '16:00',
        end_time: '16:50',
        day: 'Monday',
        type: 'class',
        status: 'upcoming',
        attendance_required: true
      },
      {
        id: '8',
        class_code: 'MAT-201',
        class_name: 'Calculus II',
        professor: 'Dr. Emily Davis',
        room: 'Room 301',
        start_time: '16:00',
        end_time: '16:50',
        day: 'Wednesday',
        type: 'class',
        status: 'upcoming',
        attendance_required: true
      },
      {
        id: '9',
        class_code: 'MAT-201',
        class_name: 'Calculus II',
        professor: 'Dr. Emily Davis',
        room: 'Room 301',
        start_time: '16:00',
        end_time: '16:50',
        day: 'Friday',
        type: 'class',
        status: 'upcoming',
        attendance_required: true
      },
      {
        id: '10',
        class_code: 'PHY-101',
        class_name: 'Physics I',
        professor: 'Dr. Robert Wilson',
        room: 'Room 401',
        start_time: '11:00',
        end_time: '12:15',
        day: 'Tuesday',
        type: 'class',
        status: 'upcoming',
        attendance_required: true
      },
      {
        id: '11',
        class_code: 'PHY-101',
        class_name: 'Physics I',
        professor: 'Dr. Robert Wilson',
        room: 'Room 401',
        start_time: '11:00',
        end_time: '12:15',
        day: 'Thursday',
        type: 'class',
        status: 'upcoming',
        attendance_required: true
      },
      {
        id: '12',
        class_code: 'ENG-201',
        class_name: 'Technical Writing',
        professor: 'Dr. Lisa Anderson',
        room: 'Room 102',
        start_time: '13:00',
        end_time: '14:15',
        day: 'Tuesday',
        type: 'class',
        status: 'upcoming',
        attendance_required: true
      },
      {
        id: '13',
        class_code: 'ENG-201',
        class_name: 'Technical Writing',
        professor: 'Dr. Lisa Anderson',
        room: 'Room 102',
        start_time: '13:00',
        end_time: '14:15',
        day: 'Thursday',
        type: 'class',
        status: 'upcoming',
        attendance_required: true
      }
    ];

    setEvents(mockEvents);
    
    // Calculate weekly stats
    const totalClasses = mockEvents.length;
    const completedClasses = mockEvents.filter(e => e.status === 'completed').length;
    const upcomingClasses = mockEvents.filter(e => e.status === 'upcoming').length;
    const attendanceRate = 88; // Mock attendance rate
    
    setWeeklyStats({
      totalClasses,
      completedClasses,
      upcomingClasses,
      attendanceRate
    });
    
    setIsLoading(false);
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
      case 'ongoing':
        return 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30';
      case 'completed':
        return 'text-slate-600 bg-slate-100 dark:bg-slate-900/30';
      case 'cancelled':
        return 'text-red-600 bg-red-100 dark:bg-red-900/30';
      default:
        return 'text-slate-600 bg-slate-100 dark:bg-slate-900/30';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'class':
        return 'bg-emerald-500';
      case 'exam':
        return 'bg-red-500';
      case 'assignment':
        return 'bg-amber-500';
      case 'break':
        return 'bg-slate-500';
      default:
        return 'bg-slate-500';
    }
  };

  const getEventsForDay = (day: string) => {
    return events.filter(event => event.day === day).sort((a, b) => 
      a.start_time.localeCompare(b.start_time)
    );
  };

  const getEventsForTimeSlot = (day: string, timeSlot: string) => {
    const time = timeSlot.replace(' AM', '').replace(' PM', '');
    const hour = parseInt(time.split(':')[0]);
    const isPM = timeSlot.includes('PM') && hour !== 12;
    const adjustedHour = isPM ? hour + 12 : hour;
    
    return events.filter(event => {
      if (event.day !== day) return false;
      const startHour = parseInt(event.start_time.split(':')[0]);
      return startHour === adjustedHour;
    });
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentDate(newDate);
  };

  const getWeekDates = () => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Monday start
    startOfWeek.setDate(diff);
    
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      return date;
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-200 dark:border-emerald-800 border-t-emerald-600 dark:border-t-emerald-400 mx-auto mb-4"></div>
          <p className="text-slate-700 dark:text-slate-300 font-medium">Loading schedule...</p>
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
                <Button variant="ghost" size="sm" className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30">
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule
                </Button>
              </Link>
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-4">
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
            Class Schedule
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400">
            View your weekly class schedule and upcoming events
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-200 h-32">
            <div className="flex items-center justify-between h-full">
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">
                  Total Classes
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                  {weeklyStats.totalClasses}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  This week
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center ml-4">
                <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-200 h-32">
            <div className="flex items-center justify-between h-full">
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">
                  Upcoming
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                  {weeklyStats.upcomingClasses}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Classes remaining
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center ml-4">
                <Clock className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-200 h-32">
            <div className="flex items-center justify-between h-full">
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">
                  Completed
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                  {weeklyStats.completedClasses}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Classes finished
                </p>
              </div>
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center ml-4">
                <CheckCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-200 h-32">
            <div className="flex items-center justify-between h-full">
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">
                  Attendance
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                  {weeklyStats.attendanceRate}%
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  This week
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center ml-4">
                <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </Card>
        </div>

        {/* Schedule Controls */}
        <Card className="p-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 mb-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <div className="flex space-x-2">
                <Button
                  onClick={() => navigateWeek('prev')}
                  variant="outline"
                  size="sm"
                  className="border-slate-300 dark:border-slate-600"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => setCurrentDate(new Date())}
                  variant="outline"
                  size="sm"
                  className="border-slate-300 dark:border-slate-600"
                >
                  Today
                </Button>
                <Button
                  onClick={() => navigateWeek('next')}
                  variant="outline"
                  size="sm"
                  className="border-slate-300 dark:border-slate-600"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex space-x-2">
                <Button
                  onClick={() => setViewMode('week')}
                  variant={viewMode === 'week' ? 'default' : 'outline'}
                  size="sm"
                  className={viewMode === 'week' ? 'bg-emerald-600 hover:bg-emerald-700' : 'border-slate-300 dark:border-slate-600'}
                >
                  Week
                </Button>
                <Button
                  onClick={() => setViewMode('day')}
                  variant={viewMode === 'day' ? 'default' : 'outline'}
                  size="sm"
                  className={viewMode === 'day' ? 'bg-emerald-600 hover:bg-emerald-700' : 'border-slate-300 dark:border-slate-600'}
                >
                  Day
                </Button>
              </div>
              <Button variant="outline" className="border-slate-300 dark:border-slate-600">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </Card>

        {/* Schedule Grid */}
        <Card className="p-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          {viewMode === 'week' ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-3 px-2 font-semibold text-slate-900 dark:text-white w-24">Time</th>
                    {days.map(day => (
                      <th key={day} className="text-center py-3 px-2 font-semibold text-slate-900 dark:text-white min-w-32">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map(timeSlot => (
                    <tr key={timeSlot} className="border-b border-slate-100 dark:border-slate-700">
                      <td className="py-3 px-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                        {timeSlot}
                      </td>
                      {days.map(day => {
                        const dayEvents = getEventsForTimeSlot(day, timeSlot);
                        return (
                          <td key={day} className="py-3 px-2 text-center">
                            {dayEvents.map(event => (
                              <div
                                key={event.id}
                                className={`p-2 rounded-lg text-xs font-semibold text-white mb-1 ${getTypeColor(event.type)}`}
                              >
                                <div className="truncate">{event.class_code}</div>
                                <div className="truncate">{event.room}</div>
                              </div>
                            ))}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="space-y-4">
              {days.map(day => {
                const dayEvents = getEventsForDay(day);
                if (dayEvents.length === 0) return null;
                
                return (
                  <div key={day} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{day}</h3>
                    <div className="space-y-3">
                      {dayEvents.map(event => (
                        <div
                          key={event.id}
                          className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-lg"
                        >
                          <div className="flex items-center space-x-4">
                            <div className={`w-3 h-3 rounded-full ${getTypeColor(event.type)}`}></div>
                            <div>
                              <h4 className="font-semibold text-slate-900 dark:text-white">
                                {event.class_code} - {event.class_name}
                              </h4>
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                {event.professor} • {event.room}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-slate-900 dark:text-white">
                              {event.start_time} - {event.end_time}
                            </p>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(event.status)}`}>
                              {event.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
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

export default function StudentSchedule() {
  return (
    <ProtectedRoute requiredRole="student">
      <StudentScheduleContent />
    </ProtectedRoute>
  );
}
