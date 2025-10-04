'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import ProtectedRoute from '@/components/protected-route';
import { 
  Calendar, Clock, Users, QrCode, Play, Pause, Square, 
  MoreHorizontal, Filter, Search, Download, Eye, 
  CheckCircle, XCircle, AlertCircle, Plus, BarChart3,
  MapPin, BookOpen, TrendingUp, Activity, ChevronDown, X,
  Home, GraduationCap, LogOut, Moon, Sun, ChevronRight
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import ProfessorHeader from '@/components/professor/professor-header';
import ProfileEditModal from '@/components/profile/profile-edit-modal';
import PasswordChangeModal from '@/components/profile/password-change-modal';
import { supabase } from '@/lib/supabase';

interface SessionData {
  id: string;
  class_id: string;
  class_code: string;
  class_name: string;
  date: string;
  start_time: string;
  end_time: string;
  room_location: string;
  is_active: boolean;
  qr_code_expires_at?: string;
  attendance_count: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  total_enrolled: number;
  attendance_rate: number;
  created_at: string;
  notes?: string;
}

interface ClassOption {
  id: string;
  code: string;
  name: string;
}

function SessionsPageContent() {
  const { user, signOut } = useAuth();
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<SessionData[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'upcoming'>('all');
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [activeSessions, setActiveSessions] = useState<SessionData[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);

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
    fetchSessions();
    fetchClasses();
    fetchUserProfile();
  }, [user]);

  useEffect(() => {
    filterSessions();
  }, [sessions, searchQuery, selectedClass, statusFilter, dateRange]);

  useEffect(() => {
    // Update active sessions every 30 seconds
    const interval = setInterval(() => {
      updateActiveSessions();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

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
      
      // Update the users table with only existing columns
      const { error: usersError } = await supabase
        .from('users' as any)
        .update(usersTableData)
        .eq('id', user.id);
      
      if (usersError) {
        console.error('Error updating users table:', usersError);
        throw new Error(`Failed to save profile: ${usersError.message}`);
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

  const handleAvatarDelete = async () => {
    if (!user) {
      console.error('No user found for avatar deletion');
      throw new Error('User not authenticated');
    }
    
    try {
      console.log('Starting avatar deletion for user:', user.id);
      
      // Get current avatar URL to extract file path
      const currentAvatarUrl = userProfile?.avatar_url;
      if (!currentAvatarUrl) {
        throw new Error('No avatar to delete');
      }
      
      // Extract file path from URL
      const urlParts = currentAvatarUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `avatars/${fileName}`;
      
      console.log('Deleting file from path:', filePath);
      
      // Delete file from Supabase Storage
      const { error: deleteError } = await supabase.storage
        .from('avatars')
        .remove([filePath]);
      
      if (deleteError) {
        console.error('Storage deletion error:', deleteError);
        throw new Error(`Failed to delete file: ${deleteError.message}`);
      }
      
      console.log('File deleted successfully from storage');
      
      // Update user profile to remove avatar URL
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

  const handleSignOut = async () => {
    await signOut();
  };

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockSessions: SessionData[] = [
        {
          id: '1',
          class_id: '1',
          class_code: 'CSC-475',
          class_name: 'Seminar in Computer Science',
          date: new Date().toISOString().split('T')[0],
          start_time: '10:00',
          end_time: '10:50',
          room_location: 'Room 101',
          is_active: true,
          qr_code_expires_at: new Date(Date.now() + 1800000).toISOString(), // 30 minutes
          attendance_count: 16,
          present_count: 14,
          absent_count: 2,
          late_count: 2,
          total_enrolled: 18,
          attendance_rate: 89,
          created_at: new Date().toISOString(),
          notes: 'Midterm exam review session'
        },
        {
          id: '2',
          class_id: '2',
          class_code: 'CSC-301',
          class_name: 'Data Structures and Algorithms',
          date: new Date().toISOString().split('T')[0],
          start_time: '14:00',
          end_time: '14:50',
          room_location: 'Room 205',
          is_active: false,
          attendance_count: 26,
          present_count: 25,
          absent_count: 2,
          late_count: 1,
          total_enrolled: 28,
          attendance_rate: 93,
          created_at: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: '3',
          class_id: '1',
          class_code: 'CSC-475',
          class_name: 'Seminar in Computer Science',
          date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
          start_time: '10:00',
          end_time: '10:50',
          room_location: 'Room 101',
          is_active: false,
          attendance_count: 17,
          present_count: 16,
          absent_count: 1,
          late_count: 1,
          total_enrolled: 18,
          attendance_rate: 94,
          created_at: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: '4',
          class_id: '3',
          class_code: 'CSC-150',
          class_name: 'Introduction to Programming',
          date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          start_time: '09:00',
          end_time: '10:15',
          room_location: 'Room 110',
          is_active: false,
          attendance_count: 0,
          present_count: 0,
          absent_count: 0,
          late_count: 0,
          total_enrolled: 32,
          attendance_rate: 0,
          created_at: new Date().toISOString()
        }
      ];
      
      setSessions(mockSessions);
      setActiveSessions(mockSessions.filter(s => s.is_active));
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      // TODO: Replace with actual API call
      const mockClasses: ClassOption[] = [
        { id: '1', code: 'CSC-475', name: 'Seminar in Computer Science' },
        { id: '2', code: 'CSC-301', name: 'Data Structures and Algorithms' },
        { id: '3', code: 'CSC-150', name: 'Introduction to Programming' }
      ];
      setClasses(mockClasses);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const updateActiveSessions = () => {
    // In a real app, this would fetch fresh data from the server
    setActiveSessions(sessions.filter(s => s.is_active));
  };

  const filterSessions = () => {
    let filtered = [...sessions];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(session =>
        session.class_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.class_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.room_location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Class filter
    if (selectedClass !== 'all') {
      filtered = filtered.filter(session => session.class_id === selectedClass);
    }

    // Status filter
    if (statusFilter !== 'all') {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      
      filtered = filtered.filter(session => {
        switch (statusFilter) {
          case 'active':
            return session.is_active;
          case 'completed':
            return !session.is_active && session.attendance_count > 0;
          case 'upcoming':
            return session.date > today || (session.date === today && !session.is_active && session.attendance_count === 0);
          default:
            return true;
        }
      });
    }

    // Date range filter
    if (dateRange !== 'all') {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      
      filtered = filtered.filter(session => {
        const sessionDate = new Date(session.date);
        switch (dateRange) {
          case 'today':
            return session.date === today;
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return sessionDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return sessionDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    // Sort by date and time (newest first)
    filtered.sort((a, b) => {
      const aDateTime = new Date(`${a.date}T${a.start_time}`);
      const bDateTime = new Date(`${b.date}T${b.start_time}`);
      return bDateTime.getTime() - aDateTime.getTime();
    });

    setFilteredSessions(filtered);
  };

  const handleStartSession = async (sessionId: string) => {
    try {
      // TODO: Implement actual session start
      console.log('Starting session:', sessionId);
      // Update local state optimistically
      setSessions(prev => prev.map(s => 
        s.id === sessionId ? { ...s, is_active: true } : s
      ));
    } catch (error) {
      console.error('Error starting session:', error);
    }
  };

  const handleStopSession = async (sessionId: string) => {
    try {
      // TODO: Implement actual session stop
      console.log('Stopping session:', sessionId);
      setSessions(prev => prev.map(s => 
        s.id === sessionId ? { ...s, is_active: false } : s
      ));
    } catch (error) {
      console.error('Error stopping session:', error);
    }
  };

  const getSessionStatus = (session: SessionData) => {
    if (session.is_active) {
      return { text: 'Active', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' };
    }
    if (session.attendance_count > 0) {
      return { text: 'Completed', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400' };
    }
    const sessionDate = new Date(`${session.date}T${session.start_time}`);
    const now = new Date();
    if (sessionDate > now) {
      return { text: 'Upcoming', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' };
    }
    return { text: 'Scheduled', color: 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400' };
  };

  const getAttendanceRateColor = (rate: number) => {
    if (rate >= 85) return 'text-emerald-600 dark:text-emerald-400';
    if (rate >= 70) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <ProfessorHeader
        currentPage="sessions"
        userProfile={userProfile}
        onSignOut={handleSignOut}
        onEditProfile={() => setShowProfileEdit(true)}
        onChangePassword={() => setShowPasswordChange(true)}
        onUploadAvatar={handleAvatarUpload}
        onDeleteAvatar={handleAvatarDelete}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
                Class Sessions 📊
              </h1>
              <p className="text-xl text-slate-600 dark:text-slate-400">
                Manage attendance sessions and monitor real-time participation
              </p>
            </div>
            <div className="hidden lg:flex items-center space-x-4">
              <Link href="/professor/sessions/new">
                <Button className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
                  <Plus className="w-5 h-5 mr-2" />
                  New Session
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Active Sessions Alert */}
        {activeSessions.length > 0 && (
          <Card className="mb-8 bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-slate-800/60 dark:to-slate-700/60 border-emerald-200 dark:border-slate-600">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-4 h-4 bg-emerald-500 dark:bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-500/30 dark:shadow-emerald-400/30"></div>
                  <div>
                    <h3 className="text-xl font-bold text-emerald-900 dark:text-white">
                      {activeSessions.length} Active Session{activeSessions.length > 1 ? 's' : ''}
                    </h3>
                    <p className="text-sm text-emerald-700 dark:text-slate-300">
                      Students can scan QR codes to mark attendance
                    </p>
                  </div>
                </div>
                <div className="flex space-x-3">
                  {activeSessions.map((session) => (
                    <Link key={session.id} href={`/professor/sessions/active/${session.id}`}>
                      <Button className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-4 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
                        <Activity className="w-4 h-4 mr-2" />
                        View {session.class_code}
                      </Button>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Search and Filters */}
        <Card className="p-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2 relative">
              <Search className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
              <Input
                placeholder="Search sessions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600"
              />
            </div>

            {/* Class Filter */}
            <div className="relative">
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="appearance-none w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Classes</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.code}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3 top-3 text-slate-400 pointer-events-none" />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="appearance-none w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="upcoming">Upcoming</option>
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3 top-3 text-slate-400 pointer-events-none" />
            </div>

            {/* Date Range Filter */}
            <div className="relative">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                className="appearance-none w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3 top-3 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Active Filters */}
          {(searchQuery || selectedClass !== 'all' || statusFilter !== 'all' || dateRange !== 'all') && (
            <div className="flex items-center space-x-2 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <span className="text-sm text-slate-500 dark:text-slate-400">Active filters:</span>
              {searchQuery && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                  Search: {searchQuery}
                  <button onClick={() => setSearchQuery('')} className="ml-1 hover:text-blue-600">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedClass !== 'all' && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                  Class: {classes.find(c => c.id === selectedClass)?.code}
                  <button onClick={() => setSelectedClass('all')} className="ml-1 hover:text-emerald-600">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {statusFilter !== 'all' && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                  Status: {statusFilter}
                  <button onClick={() => setStatusFilter('all')} className="ml-1 hover:text-purple-600">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {dateRange !== 'all' && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                  Date: {dateRange}
                  <button onClick={() => setDateRange('all')} className="ml-1 hover:text-amber-600">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </Card>

        {/* Sessions List */}
        {filteredSessions.length === 0 ? (
          <Card className="p-16 text-center bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              {sessions.length === 0 ? 'No Sessions Yet' : 'No Sessions Found'}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto">
              {sessions.length === 0 
                ? 'Create your first session to start taking attendance and tracking student participation.'
                : 'Try adjusting your search or filter criteria to find the sessions you\'re looking for.'
              }
            </p>
            {sessions.length === 0 && (
              <Link href="/professor/sessions/new">
                <Button className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
                  <Plus className="w-5 h-5 mr-2" />
                  Create Your First Session
                </Button>
              </Link>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredSessions.map((session) => {
              const status = getSessionStatus(session);
              return (
                <Card
                  key={session.id}
                  className={`group bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-xl hover:scale-[1.02] transition-all duration-200 ${
                    session.is_active ? 'ring-2 ring-emerald-500/20 shadow-emerald-500/10' : ''
                  }`}
                >
                  {/* Status Indicator */}
                  <div className={`h-1 bg-gradient-to-r ${
                    session.is_active 
                      ? 'from-emerald-500 to-emerald-600' 
                      : status.text === 'Completed'
                      ? 'from-indigo-500 to-indigo-600'
                      : status.text === 'Upcoming'
                      ? 'from-amber-500 to-amber-600'
                      : 'from-slate-400 to-slate-500'
                  } rounded-t-xl`}></div>

                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 bg-gradient-to-br ${
                          session.is_active 
                            ? 'from-emerald-500 to-emerald-600' 
                            : status.text === 'Completed'
                            ? 'from-indigo-500 to-indigo-600'
                            : status.text === 'Upcoming'
                            ? 'from-amber-500 to-amber-600'
                            : 'from-slate-400 to-slate-500'
                        } rounded-2xl flex items-center justify-center shadow-lg`}>
                          {session.is_active ? (
                            <Activity className="w-6 h-6 text-white animate-pulse" />
                          ) : status.text === 'Completed' ? (
                            <CheckCircle className="w-6 h-6 text-white" />
                          ) : status.text === 'Upcoming' ? (
                            <Clock className="w-6 h-6 text-white" />
                          ) : (
                            <Calendar className="w-6 h-6 text-white" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                            {session.class_code}
                          </h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${status.color}`}>
                              {session.is_active && <div className="w-2 h-2 bg-current rounded-full mr-1 animate-pulse inline-block"></div>}
                              {status.text}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Class Name */}
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
                        {session.class_name}
                      </h4>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                        <Calendar className="w-4 h-4 mr-2" />
                        {new Date(session.date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                        <Clock className="w-4 h-4 mr-2" />
                        {session.start_time} - {session.end_time}
                      </div>
                      <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                        <MapPin className="w-4 h-4 mr-2" />
                        {session.room_location}
                      </div>
                      <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                        <Users className="w-4 h-4 mr-2" />
                        {session.attendance_count}/{session.total_enrolled}
                      </div>
                    </div>

                    {/* Notes */}
                    {session.notes && (
                      <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-700 rounded-xl">
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          <strong>Notes:</strong> {session.notes}
                        </p>
                      </div>
                    )}

                    {/* Attendance Stats */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Attendance Rate
                        </span>
                        <span className={`text-lg font-bold ${getAttendanceRateColor(session.attendance_rate)}`}>
                          {session.attendance_rate}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-3 rounded-full transition-all duration-500 ${
                            session.attendance_rate >= 85
                              ? 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                              : session.attendance_rate >= 70
                              ? 'bg-gradient-to-r from-amber-500 to-amber-600'
                              : session.attendance_rate >= 50
                              ? 'bg-gradient-to-r from-orange-500 to-orange-600'
                              : 'bg-gradient-to-r from-red-500 to-red-600'
                          }`}
                          style={{ width: `${session.attendance_rate}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                          {session.present_count}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                          Present
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                          {session.late_count}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                          Late
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                          {session.absent_count}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                          Absent
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-3 gap-2">
                      {session.is_active ? (
                        <>
                          <Link href={`/professor/sessions/active/${session.id}`}>
                            <Button className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-md hover:shadow-lg transition-all">
                              <Eye className="w-4 h-4 mr-1" />
                              View Live
                            </Button>
                          </Link>
                          <Button
                            onClick={() => handleStopSession(session.id)}
                            className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-md hover:shadow-lg transition-all"
                          >
                            <Square className="w-4 h-4 mr-1" />
                            Stop
                          </Button>
                          <Button variant="outline" className="w-full hover:bg-slate-50 dark:hover:bg-slate-700">
                            <Download className="w-4 h-4 mr-1" />
                            Export
                          </Button>
                        </>
                      ) : (
                        <>
                          {session.attendance_count === 0 && new Date(`${session.date}T${session.start_time}`) <= new Date() && (
                            <Button
                              onClick={() => handleStartSession(session.id)}
                              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-md hover:shadow-lg transition-all"
                            >
                              <Play className="w-4 h-4 mr-1" />
                              Start
                            </Button>
                          )}
                          <Link href={`/professor/sessions/${session.id}`}>
                            <Button variant="outline" className="w-full hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-700 transition-all">
                              <Eye className="w-4 h-4 mr-1" />
                              Details
                            </Button>
                          </Link>
                          {session.attendance_count > 0 && (
                            <Button variant="outline" className="w-full hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-300 dark:hover:border-purple-700 transition-all">
                              <Download className="w-4 h-4 mr-1" />
                              Export
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
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

export default function SessionsPage() {
  return (
    <ProtectedRoute requiredRole="professor">
      <SessionsPageContent />
    </ProtectedRoute>
  );
}
