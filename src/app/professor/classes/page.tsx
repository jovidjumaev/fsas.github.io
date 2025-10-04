'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import ProtectedRoute from '@/components/protected-route';
import { 
  BookOpen, Users, Calendar, Plus, Search, Filter, 
  MoreHorizontal, Edit, Trash2, QrCode, BarChart3,
  Clock, MapPin, GraduationCap, TrendingUp, AlertCircle,
  ChevronDown, X, Settings, Star, Award, Target, Activity,
  Home, Menu, Moon, Sun, Sparkles, Zap, Shield, Eye,
  Play, Pause, ChevronRight, LogOut
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import ProfessorHeader from '@/components/professor/professor-header';
import ProfileEditModal from '@/components/profile/profile-edit-modal';
import PasswordChangeModal from '@/components/profile/password-change-modal';
import { supabase } from '@/lib/supabase';

interface ClassData {
  id: string;
  code: string;
  name: string;
  description?: string;
  room_location: string;
  schedule_info: string;
  max_students: number;
  enrolled_students: number;
  credits: number;
  academic_period: string;
  year: number;
  semester: string;
  department_name: string;
  is_active: boolean;
  created_at: string;
  next_session?: {
    date: string;
    start_time: string;
  };
  attendance_rate?: number;
  total_sessions?: number;
  active_sessions?: number;
  performance_grade?: 'excellent' | 'good' | 'average' | 'needs_attention';
}

interface AvailableCourse {
  id: string;
  code: string;
  name: string;
  description: string;
  credits: number;
  department_name: string;
}

interface CreateClassForm {
  selected_course_id: string;
  room_location: string;
  schedule_info: string;
  max_students: number;
  // Schedule details
  days: string[];
  start_time: string;
  end_time: string;
  // Additional options
  custom_schedule: string;
}

function ClassesPageContent() {
  const { user, signOut } = useAuth();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [availableCourses, setAvailableCourses] = useState<AvailableCourse[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<ClassData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'code' | 'enrollment' | 'attendance' | 'created'>('name');
  const [filterBy, setFilterBy] = useState<'all' | 'active' | 'inactive' | 'high_performance' | 'needs_attention'>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);

  const [createForm, setCreateForm] = useState<CreateClassForm>({
    selected_course_id: '',
    room_location: '',
    schedule_info: '',
    max_students: 30,
    days: [],
    start_time: '',
    end_time: '',
    custom_schedule: ''
  });

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
    fetchClasses();
    fetchAvailableCourses();
    fetchUserProfile();
  }, [user]);

  useEffect(() => {
    filterAndSortClasses();
  }, [classes, searchQuery, sortBy, filterBy]);

  const fetchClasses = async () => {
    setIsLoading(true);
    try {
      if (!user?.id) return;
      
      const response = await fetch(`http://localhost:3001/api/professors/${user.id}/classes`);
      if (!response.ok) {
        throw new Error('Failed to fetch classes');
      }
      
      const data = await response.json();
      setClasses(data.classes || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
      // Fallback to empty array if API fails
      setClasses([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableCourses = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/courses');
      if (!response.ok) {
        throw new Error('Failed to fetch available courses');
      }
      
      const data = await response.json();
      setAvailableCourses(data.courses || []);
    } catch (error) {
      console.error('Error fetching available courses:', error);
      setAvailableCourses([]);
    }
  };

  const filterAndSortClasses = () => {
    let filtered = [...classes];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(cls =>
        cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cls.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cls.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (filterBy !== 'all') {
      filtered = filtered.filter(cls => {
        switch (filterBy) {
          case 'active':
            return cls.is_active;
          case 'inactive':
            return !cls.is_active;
          case 'high_performance':
            return (cls.attendance_rate || 0) >= 85;
          case 'needs_attention':
            return (cls.attendance_rate || 0) < 75;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'code':
          return a.code.localeCompare(b.code);
        case 'enrollment':
          return b.enrolled_students - a.enrolled_students;
        case 'attendance':
          return (b.attendance_rate || 0) - (a.attendance_rate || 0);
        case 'created':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });

    setFilteredClasses(filtered);
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!user?.id) return;
      
      // Generate schedule info from days and times
      let scheduleInfo = createForm.custom_schedule;
      if (!scheduleInfo && createForm.days.length > 0 && createForm.start_time && createForm.end_time) {
        const dayAbbrevs = createForm.days.map(day => {
          switch(day) {
            case 'Monday': return 'M';
            case 'Tuesday': return 'T';
            case 'Wednesday': return 'W';
            case 'Thursday': return 'Th';
            case 'Friday': return 'F';
            case 'Saturday': return 'S';
            case 'Sunday': return 'Su';
            default: return day.substring(0, 2);
          }
        });
        scheduleInfo = `${dayAbbrevs.join('')} ${createForm.start_time}-${createForm.end_time}`;
      }
      
      const classData = {
        course_id: createForm.selected_course_id,
        professor_id: user.id,
        room_location: createForm.room_location,
        schedule_info: scheduleInfo,
        max_students: createForm.max_students
      };
      
      const response = await fetch('http://localhost:3001/api/classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(classData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create class');
      }
      
      setCreateForm({
        selected_course_id: '',
        room_location: '',
        schedule_info: '',
        max_students: 30,
        days: [],
        start_time: '',
        end_time: '',
        custom_schedule: ''
      });
      setShowCreateForm(false);
      await fetchClasses();
    } catch (error) {
      console.error('Error creating class:', error);
    }
  };

  const getPerformanceColor = (grade?: string) => {
    switch (grade) {
      case 'excellent':
        return 'from-emerald-500 to-green-600';
      case 'good':
        return 'from-blue-500 to-indigo-600';
      case 'average':
        return 'from-amber-500 to-orange-600';
      case 'needs_attention':
        return 'from-red-500 to-pink-600';
      default:
        return 'from-gray-500 to-slate-600';
    }
  };

  const getPerformanceIcon = (grade?: string) => {
    switch (grade) {
      case 'excellent':
        return <Star className="w-5 h-5 text-white" />;
      case 'good':
        return <Award className="w-5 h-5 text-white" />;
      case 'average':
        return <Target className="w-5 h-5 text-white" />;
      case 'needs_attention':
        return <AlertCircle className="w-5 h-5 text-white" />;
      default:
        return <BookOpen className="w-5 h-5 text-white" />;
    }
  };

  const getAttendanceColor = (rate?: number) => {
    if (!rate) return 'text-gray-500 dark:text-gray-400';
    if (rate >= 90) return 'text-emerald-600 dark:text-emerald-400';
    if (rate >= 80) return 'text-blue-600 dark:text-blue-400';
    if (rate >= 70) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

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
        currentPage="classes"
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
                My Classes 📚
              </h1>
              <p className="text-xl text-slate-600 dark:text-slate-400">
                Manage your courses and track student progress
              </p>
            </div>
            <div className="hidden lg:flex items-center space-x-4">
              <Button
                onClick={() => setShowCreateForm(true)}
                className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Plus className="w-5 h-5 mr-2" />
                New Class
              </Button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="p-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
              <Input
                placeholder="Search classes by name, code, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600"
              />
            </div>

            {/* Filters */}
            <div className="flex space-x-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="appearance-none bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="name">Sort by Name</option>
                <option value="code">Sort by Code</option>
                <option value="enrollment">Sort by Enrollment</option>
                <option value="attendance">Sort by Attendance</option>
                <option value="created">Sort by Created</option>
              </select>

              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value as any)}
                className="appearance-none bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Classes</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
                <option value="high_performance">High Performance</option>
                <option value="needs_attention">Needs Attention</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Classes Grid */}
        {filteredClasses.length === 0 ? (
          <Card className="p-16 text-center bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              {classes.length === 0 ? 'No Classes Yet' : 'No Classes Found'}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto">
              {classes.length === 0 
                ? 'Create your first class to start managing courses and tracking attendance. Get started by clicking the button below!'
                : 'Try adjusting your search or filter criteria to find the classes you\'re looking for.'
              }
            </p>
            {classes.length === 0 && (
              <Button
                onClick={() => setShowCreateForm(true)}
                className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Your First Class
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredClasses.map((classData) => (
              <Card
                key={classData.id}
                className="group bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-xl hover:scale-[1.02] transition-all duration-200"
              >
                {/* Performance Indicator */}
                <div className={`h-1 bg-gradient-to-r ${getPerformanceColor(classData.performance_grade)} rounded-t-xl`}></div>
                
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 bg-gradient-to-br ${getPerformanceColor(classData.performance_grade)} rounded-2xl flex items-center justify-center shadow-lg`}>
                        {getPerformanceIcon(classData.performance_grade)}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                          {classData.code}
                        </h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            classData.is_active
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-400'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-400'
                          }`}>
                            {classData.is_active ? 'Active' : 'Inactive'}
                          </span>
                          {classData.active_sessions && classData.active_sessions > 0 && (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-400 animate-pulse">
                              Live Session
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Class Name & Description */}
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
                      {classData.name}
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                      {classData.description}
                    </p>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                      <Clock className="w-4 h-4 mr-2" />
                      {classData.schedule_info}
                    </div>
                    <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                      <MapPin className="w-4 h-4 mr-2" />
                      {classData.room_location}
                    </div>
                    <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                      <Users className="w-4 h-4 mr-2" />
                      {classData.enrolled_students}/{classData.max_students} Students
                    </div>
                    <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                      <GraduationCap className="w-4 h-4 mr-2" />
                      {classData.credits} Credits
                    </div>
                  </div>

                  {/* Attendance Visualization */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Attendance Rate
                      </span>
                      <span className={`text-lg font-bold ${getAttendanceColor(classData.attendance_rate)}`}>
                        {classData.attendance_rate || 0}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-3 rounded-full transition-all duration-500 ${
                          (classData.attendance_rate || 0) >= 90
                            ? 'bg-gradient-to-r from-emerald-500 to-green-500'
                            : (classData.attendance_rate || 0) >= 80
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                            : (classData.attendance_rate || 0) >= 70
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                            : 'bg-gradient-to-r from-red-500 to-pink-500'
                        }`}
                        style={{ width: `${classData.attendance_rate || 0}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {classData.total_sessions || 0}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        Sessions
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {classData.active_sessions || 0}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        Active
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {Math.round((classData.enrolled_students / classData.max_students) * 100)}%
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        Capacity
                      </p>
                    </div>
                  </div>

                  {/* Next Session Alert */}
                  {classData.next_session && (
                    <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-xl border border-blue-200 dark:border-blue-700">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                            Next Session Today
                          </p>
                          <p className="text-xs text-blue-600 dark:text-blue-400">
                            {classData.next_session.start_time} • {classData.room_location}
                          </p>
                        </div>
                        <Link href={`/professor/sessions/new?classId=${classData.id}`}>
                          <Button size="sm" className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-md hover:shadow-lg transition-all">
                            <Play className="w-3 h-3 mr-1" />
                            Start
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="grid grid-cols-3 gap-2">
                    <Link href={`/professor/classes/${classData.id}`}>
                      <Button variant="outline" size="sm" className="w-full hover:bg-blue-50 dark:hover:bg-blue-900 hover:border-blue-300 dark:hover:border-blue-700 transition-all">
                        <Settings className="w-4 h-4 mr-1" />
                        Manage
                      </Button>
                    </Link>
                    <Link href={`/professor/sessions?classId=${classData.id}`}>
                      <Button variant="outline" size="sm" className="w-full hover:bg-emerald-50 dark:hover:bg-emerald-900 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all">
                        <Calendar className="w-4 h-4 mr-1" />
                        Sessions
                      </Button>
                    </Link>
                    <Link href={`/professor/analytics?classId=${classData.id}`}>
                      <Button variant="outline" size="sm" className="w-full hover:bg-purple-50 dark:hover:bg-purple-900 hover:border-purple-300 dark:hover:border-purple-700 transition-all">
                        <BarChart3 className="w-4 h-4 mr-1" />
                        Analytics
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Create Class Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl flex items-center justify-center shadow-lg">
                    <Plus className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                      Create New Class
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Set up a new course for this semester
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreateForm(false)}
                  className="hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <form onSubmit={handleCreateClass} className="space-y-6">
                {/* Course Selection */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Select Course *
                  </label>
                  <select
                    value={createForm.selected_course_id}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, selected_course_id: e.target.value }))}
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white"
                    required
                  >
                    <option value="">Choose a course...</option>
                    {availableCourses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.code} - {course.name} ({course.credits} credits)
                      </option>
                    ))}
                  </select>
                  {createForm.selected_course_id && (
                    <div className="mt-2 p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
                      {(() => {
                        const selectedCourse = availableCourses.find(c => c.id === createForm.selected_course_id);
                        return selectedCourse ? (
                          <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">
                              {selectedCourse.code} - {selectedCourse.name}
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                              {selectedCourse.description}
                            </p>
                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                              {selectedCourse.credits} credits • {selectedCourse.department_name}
                            </p>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  )}
                </div>

                {/* Room and Max Students */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Room Location *
                    </label>
                    <Input
                      placeholder="e.g., Room 101, Building A-205"
                      value={createForm.room_location}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, room_location: e.target.value }))}
                      className="bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Max Students *
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      value={createForm.max_students}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, max_students: parseInt(e.target.value) || 30 }))}
                      className="bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600"
                      required
                    />
                  </div>
                </div>

                {/* Schedule Configuration */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
                    Schedule Configuration *
                  </label>
                  
                  {/* Days Selection */}
                  <div className="mb-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Select Days:</p>
                    <div className="flex flex-wrap gap-2">
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            setCreateForm(prev => ({
                              ...prev,
                              days: prev.days.includes(day)
                                ? prev.days.filter(d => d !== day)
                                : [...prev.days, day]
                            }));
                          }}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                            createForm.days.includes(day)
                              ? 'bg-emerald-600 text-white shadow-md'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                          }`}
                        >
                          {day.substring(0, 3)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Time Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                        Start Time
                      </label>
                      <Input
                        type="time"
                        value={createForm.start_time}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, start_time: e.target.value }))}
                        className="bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                        End Time
                      </label>
                      <Input
                        type="time"
                        value={createForm.end_time}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, end_time: e.target.value }))}
                        className="bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600"
                      />
                    </div>
                  </div>

                  {/* Custom Schedule Override */}
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                      Custom Schedule (Optional)
                    </label>
                    <Input
                      placeholder="e.g., MWF 10:00-10:50, TTh 14:00-15:15"
                      value={createForm.custom_schedule}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, custom_schedule: e.target.value }))}
                      className="bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Leave empty to auto-generate from days and times above
                    </p>
                  </div>

                  {/* Schedule Preview */}
                  {(createForm.days.length > 0 && createForm.start_time && createForm.end_time) || createForm.custom_schedule ? (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900 rounded-lg border border-blue-200 dark:border-blue-700">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                        Schedule Preview:
                      </p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        {createForm.custom_schedule || 
                         (createForm.days.length > 0 && createForm.start_time && createForm.end_time ? 
                          `${createForm.days.map(day => {
                            switch(day) {
                              case 'Monday': return 'M';
                              case 'Tuesday': return 'T';
                              case 'Wednesday': return 'W';
                              case 'Thursday': return 'Th';
                              case 'Friday': return 'F';
                              case 'Saturday': return 'S';
                              case 'Sunday': return 'Su';
                              default: return day.substring(0, 2);
                            }
                          }).join('')} ${createForm.start_time}-${createForm.end_time}` : 
                          'No schedule configured')}
                      </p>
                    </div>
                  ) : null}
                </div>

                <div className="flex space-x-4 pt-6 border-t border-slate-200 dark:border-slate-700">
                  <Button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Create Class
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-300 dark:border-slate-600"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}

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

export default function ClassesPage() {
  return (
    <ProtectedRoute requiredRole="professor">
      <ClassesPageContent />
    </ProtectedRoute>
  );
}