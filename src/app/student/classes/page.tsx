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
  Search,
  Filter,
  Eye,
  Star,
  Users,
  Bookmark
} from 'lucide-react';

interface ClassInfo {
  id: string;
  class_code: string;
  class_name: string;
  professor: string;
  professor_email: string;
  room: string;
  schedule: string;
  credits: number;
  description: string;
  attendance_rate: number;
  total_sessions: number;
  attended_sessions: number;
  last_attended?: string;
  is_favorite: boolean;
}

interface ClassStats {
  totalClasses: number;
  averageAttendance: number;
  favoriteClasses: number;
  upcomingClasses: number;
}

function StudentClassesContent() {
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [stats, setStats] = useState<ClassStats>({
    totalClasses: 0,
    averageAttendance: 0,
    favoriteClasses: 0,
    upcomingClasses: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string>('name');
  const [filterBy, setFilterBy] = useState<string>('all');
  const { user, signOut } = useAuth();
  const router = useRouter();

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

  const handleDeleteAvatar = async () => {
    if (!user) return;
    
    try {
      // Remove avatar from storage if it exists
      if (userProfile?.avatar_url) {
        const fileName = userProfile.avatar_url.split('/').pop();
        if (fileName) {
          const { error: deleteError } = await supabase.storage
            .from('avatars')
            .remove([`avatars/${fileName}`]);
          
          if (deleteError) {
            console.warn('Error deleting avatar from storage:', deleteError);
          }
        }
      }
      
      // Update user profile to remove avatar_url
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: null } as any)
        .eq('id', user.id);
      
      if (updateError) throw updateError;
      
      setUserProfile((prev: any) => ({ ...prev, avatar_url: null }));
    } catch (error) {
      console.error('Error deleting avatar:', error);
      throw error;
    }
  };

  const toggleFavorite = (classId: string) => {
    setClasses(prev => prev.map(cls => 
      cls.id === classId 
        ? { ...cls, is_favorite: !cls.is_favorite }
        : cls
    ));
  };

  useEffect(() => {
    fetchUserProfile();
    
    // Mock class data
    const mockClasses: ClassInfo[] = [
      {
        id: '1',
        class_code: 'CSC-475',
        class_name: 'Seminar in Computer Science',
        professor: 'Dr. Sarah Johnson',
        professor_email: 'sarah.johnson@furman.edu',
        room: 'Room 101',
        schedule: 'Mon, Wed, Fri 10:00 AM - 10:50 AM',
        credits: 3,
        description: 'Advanced topics in computer science with focus on research methodologies and current trends.',
        attendance_rate: 95,
        total_sessions: 20,
        attended_sessions: 19,
        last_attended: '2024-01-15',
        is_favorite: true
      },
      {
        id: '2',
        class_code: 'CSC-301',
        class_name: 'Data Structures',
        professor: 'Dr. Michael Chen',
        professor_email: 'michael.chen@furman.edu',
        room: 'Room 205',
        schedule: 'Mon, Wed, Fri 2:00 PM - 2:50 PM',
        credits: 4,
        description: 'Fundamental data structures and algorithms with practical implementations.',
        attendance_rate: 88,
        total_sessions: 20,
        attended_sessions: 17,
        last_attended: '2024-01-15',
        is_favorite: false
      },
      {
        id: '3',
        class_code: 'MAT-201',
        class_name: 'Calculus II',
        professor: 'Dr. Emily Davis',
        professor_email: 'emily.davis@furman.edu',
        room: 'Room 301',
        schedule: 'Mon, Wed, Fri 4:00 PM - 4:50 PM',
        credits: 4,
        description: 'Continuation of Calculus I with integration techniques and applications.',
        attendance_rate: 75,
        total_sessions: 20,
        attended_sessions: 15,
        last_attended: '2024-01-15',
        is_favorite: false
      },
      {
        id: '4',
        class_code: 'PHY-101',
        class_name: 'Physics I',
        professor: 'Dr. Robert Wilson',
        professor_email: 'robert.wilson@furman.edu',
        room: 'Room 401',
        schedule: 'Tue, Thu 11:00 AM - 12:15 PM',
        credits: 4,
        description: 'Mechanics, thermodynamics, and wave motion with laboratory component.',
        attendance_rate: 92,
        total_sessions: 16,
        attended_sessions: 15,
        last_attended: '2024-01-14',
        is_favorite: true
      },
      {
        id: '5',
        class_code: 'ENG-201',
        class_name: 'Technical Writing',
        professor: 'Dr. Lisa Anderson',
        professor_email: 'lisa.anderson@furman.edu',
        room: 'Room 102',
        schedule: 'Tue, Thu 1:00 PM - 2:15 PM',
        credits: 3,
        description: 'Professional writing skills for technical and scientific communication.',
        attendance_rate: 100,
        total_sessions: 16,
        attended_sessions: 16,
        last_attended: '2024-01-14',
        is_favorite: true
      }
    ];

    setClasses(mockClasses);
    
    // Calculate stats
    const totalClasses = mockClasses.length;
    const averageAttendance = Math.round(
      mockClasses.reduce((sum, cls) => sum + cls.attendance_rate, 0) / totalClasses
    );
    const favoriteClasses = mockClasses.filter(cls => cls.is_favorite).length;
    const upcomingClasses = 3; // Mock upcoming classes today
    
    setStats({
      totalClasses,
      averageAttendance,
      favoriteClasses,
      upcomingClasses
    });
    
    setIsLoading(false);
  }, [user]);

  const getAttendanceColor = (rate: number) => {
    if (rate >= 90) return 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900';
    if (rate >= 75) return 'text-amber-600 bg-amber-100 dark:bg-amber-900';
    return 'text-red-600 bg-red-100 dark:bg-red-900';
  };

  const filteredClasses = classes.filter(cls => {
    const matchesSearch = cls.class_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cls.class_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cls.professor.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterBy === 'favorites') return matchesSearch && cls.is_favorite;
    if (filterBy === 'high-attendance') return matchesSearch && cls.attendance_rate >= 90;
    if (filterBy === 'low-attendance') return matchesSearch && cls.attendance_rate < 75;
    
    return matchesSearch;
  });

  const sortedClasses = [...filteredClasses].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.class_name.localeCompare(b.class_name);
      case 'code':
        return a.class_code.localeCompare(b.class_code);
      case 'attendance':
        return b.attendance_rate - a.attendance_rate;
      case 'professor':
        return a.professor.localeCompare(b.professor);
      default:
        return 0;
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-200 dark:border-emerald-800 border-t-emerald-600 dark:border-t-emerald-400 mx-auto mb-4"></div>
          <p className="text-slate-700 dark:text-slate-300 font-medium">Loading classes...</p>
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
                <Button variant="ghost" size="sm" className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900 hover:bg-emerald-100 dark:hover:bg-emerald-800">
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
            My Classes
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400">
            Manage and track your enrolled classes
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
                  {stats.totalClasses}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Enrolled this semester
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center ml-4">
                <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-200 h-32">
            <div className="flex items-center justify-between h-full">
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">
                  Avg Attendance
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                  {stats.averageAttendance}%
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Across all classes
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900 rounded-xl flex items-center justify-center ml-4">
                <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-200 h-32">
            <div className="flex items-center justify-between h-full">
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">
                  Favorites
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                  {stats.favoriteClasses}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Starred classes
                </p>
              </div>
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900 rounded-xl flex items-center justify-center ml-4">
                <Star className="w-6 h-6 text-amber-600 dark:text-amber-400" />
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
                  {stats.upcomingClasses}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Classes today
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center ml-4">
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

            {/* Filter */}
            <div className="lg:w-48">
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="all">All Classes</option>
                <option value="favorites">Favorites Only</option>
                <option value="high-attendance">High Attendance (90%+)</option>
                <option value="low-attendance">Low Attendance (&lt;75%)</option>
              </select>
            </div>

            {/* Sort */}
            <div className="lg:w-48">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="name">Sort by Name</option>
                <option value="code">Sort by Code</option>
                <option value="attendance">Sort by Attendance</option>
                <option value="professor">Sort by Professor</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Classes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedClasses.map((classInfo) => (
            <Card key={classInfo.id} className="p-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {classInfo.class_code}
                    </h3>
                    <button
                      onClick={() => toggleFavorite(classInfo.id)}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                    >
                      <Star 
                        className={`w-4 h-4 ${
                          classInfo.is_favorite 
                            ? 'text-amber-500 fill-amber-500' 
                            : 'text-slate-400 hover:text-amber-500'
                        }`} 
                      />
                    </button>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    {classInfo.class_name}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                    {classInfo.description}
                  </p>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                  <User className="w-4 h-4 mr-2" />
                  <span>{classInfo.professor}</span>
                </div>
                <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>{classInfo.room}</span>
                </div>
                <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                  <Clock className="w-4 h-4 mr-2" />
                  <span>{classInfo.schedule}</span>
                </div>
                <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                  <BookOpen className="w-4 h-4 mr-2" />
                  <span>{classInfo.credits} credits</span>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Attendance
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getAttendanceColor(classInfo.attendance_rate)}`}>
                    {classInfo.attendance_rate}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      classInfo.attendance_rate >= 90 ? 'bg-emerald-500' :
                      classInfo.attendance_rate >= 75 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${classInfo.attendance_rate}%` }}
                  ></div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {classInfo.attended_sessions} of {classInfo.total_sessions} sessions
                </p>
              </div>

              <div className="flex space-x-2">
                <Button 
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white"
                  size="sm"
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  Scan QR
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-slate-300 dark:border-slate-600"
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {sortedClasses.length === 0 && (
          <Card className="p-12 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <div className="text-center">
              <BookOpen className="w-16 h-16 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                No classes found
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Try adjusting your search or filter criteria
              </p>
            </div>
          </Card>
        )}
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

export default function StudentClasses() {
  return (
    <ProtectedRoute requiredRole="student">
      <StudentClassesContent />
    </ProtectedRoute>
  );
}
