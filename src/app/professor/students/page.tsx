'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import ProtectedRoute from '@/components/protected-route';
import { 
  Users, Search, Filter, Plus, Download, Upload, 
  MoreHorizontal, Edit, Trash2, UserCheck, UserX,
  Mail, Phone, GraduationCap, Calendar, BookOpen,
  ChevronDown, X, Eye, UserPlus, FileText, AlertCircle,
  Home, QrCode, BarChart3, LogOut, Moon, Sun, Clock
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import ProfessorHeader from '@/components/professor/professor-header';
import ProfileEditModal from '@/components/profile/profile-edit-modal';
import PasswordChangeModal from '@/components/profile/password-change-modal';
import { supabase } from '@/lib/supabase';

interface StudentData {
  id: string;
  student_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  enrollment_year: number;
  major: string;
  graduation_year: number;
  is_active: boolean;
  enrolled_classes: EnrolledClass[];
  total_classes: number;
  average_attendance: number;
  created_at: string;
}

interface EnrolledClass {
  id: string;
  class_id: string;
  class_code: string;
  class_name: string;
  enrollment_date: string;
  status: 'active' | 'dropped' | 'completed';
  attendance_rate: number;
  sessions_attended: number;
  total_sessions: number;
}

interface ClassOption {
  id: string;
  code: string;
  name: string;
  enrolled_count: number;
  max_students: number;
}

function StudentsPageContent() {
  const { user, signOut } = useAuth();
  const [students, setStudents] = useState<StudentData[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentData[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'student_id' | 'attendance' | 'classes'>('name');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [showBulkEnrollModal, setShowBulkEnrollModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);
  const [enrollmentClass, setEnrollmentClass] = useState<string>('');
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
    fetchStudents();
    fetchClasses();
    fetchUserProfile();
  }, [user]);

  useEffect(() => {
    filterAndSortStudents();
  }, [students, searchQuery, selectedClass, statusFilter, sortBy]);

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

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockStudents: StudentData[] = [
        {
          id: '1',
          student_id: '2024001',
          first_name: 'John',
          last_name: 'Doe',
          email: 'john.doe@furman.edu',
          phone: '+1-555-0123',
          enrollment_year: 2024,
          major: 'Computer Science',
          graduation_year: 2028,
          is_active: true,
          total_classes: 2,
          average_attendance: 92,
          created_at: '2024-08-15T00:00:00Z',
          enrolled_classes: [
            {
              id: '1',
              class_id: '1',
              class_code: 'CSC-475',
              class_name: 'Seminar in Computer Science',
              enrollment_date: '2024-08-15',
              status: 'active',
              attendance_rate: 95,
              sessions_attended: 19,
              total_sessions: 20
            },
            {
              id: '2',
              class_id: '2',
              class_code: 'CSC-301',
              class_name: 'Data Structures',
              enrollment_date: '2024-08-15',
              status: 'active',
              attendance_rate: 88,
              sessions_attended: 15,
              total_sessions: 17
            }
          ]
        },
        {
          id: '2',
          student_id: '2024002',
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'jane.smith@furman.edu',
          enrollment_year: 2023,
          major: 'Computer Science',
          graduation_year: 2027,
          is_active: true,
          total_classes: 1,
          average_attendance: 78,
          created_at: '2024-08-15T00:00:00Z',
          enrolled_classes: [
            {
              id: '3',
              class_id: '1',
              class_code: 'CSC-475',
              class_name: 'Seminar in Computer Science',
              enrollment_date: '2024-08-15',
              status: 'active',
              attendance_rate: 78,
              sessions_attended: 14,
              total_sessions: 18
            }
          ]
        },
        {
          id: '3',
          student_id: '2023045',
          first_name: 'Mike',
          last_name: 'Johnson',
          email: 'mike.johnson@furman.edu',
          enrollment_year: 2023,
          major: 'Mathematics',
          graduation_year: 2027,
          is_active: false,
          total_classes: 1,
          average_attendance: 65,
          created_at: '2024-08-15T00:00:00Z',
          enrolled_classes: [
            {
              id: '4',
              class_id: '2',
              class_code: 'CSC-301',
              class_name: 'Data Structures',
              enrollment_date: '2024-08-15',
              status: 'dropped',
              attendance_rate: 65,
              sessions_attended: 8,
              total_sessions: 12
            }
          ]
        }
      ];
      
      setStudents(mockStudents);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      // TODO: Replace with actual API call
      const mockClasses: ClassOption[] = [
        { id: '1', code: 'CSC-475', name: 'Seminar in Computer Science', enrolled_count: 18, max_students: 25 },
        { id: '2', code: 'CSC-301', name: 'Data Structures', enrolled_count: 28, max_students: 30 },
        { id: '3', code: 'CSC-150', name: 'Intro to Programming', enrolled_count: 32, max_students: 35 }
      ];
      setClasses(mockClasses);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const filterAndSortStudents = () => {
    let filtered = [...students];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(student =>
        student.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.student_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.major.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply class filter
    if (selectedClass !== 'all') {
      filtered = filtered.filter(student =>
        student.enrolled_classes.some(cls => cls.class_id === selectedClass && cls.status === 'active')
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(student => 
        statusFilter === 'active' ? student.is_active : !student.is_active
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
        case 'student_id':
          return a.student_id.localeCompare(b.student_id);
        case 'attendance':
          return b.average_attendance - a.average_attendance;
        case 'classes':
          return b.total_classes - a.total_classes;
        default:
          return 0;
      }
    });

    setFilteredStudents(filtered);
  };

  const handleSelectStudent = (studentId: string) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(s => s.id));
    }
  };

  const handleEnrollStudent = async (studentId: string, classId: string) => {
    try {
      // TODO: Implement actual enrollment
      console.log('Enrolling student:', studentId, 'in class:', classId);
      
      // Update local state optimistically
      setStudents(prev => prev.map(student => {
        if (student.id === studentId) {
          const selectedClassData = classes.find(c => c.id === classId);
          if (selectedClassData) {
            return {
              ...student,
              enrolled_classes: [...student.enrolled_classes, {
                id: Date.now().toString(),
                class_id: classId,
                class_code: selectedClassData.code,
                class_name: selectedClassData.name,
                enrollment_date: new Date().toISOString().split('T')[0],
                status: 'active' as const,
                attendance_rate: 0,
                sessions_attended: 0,
                total_sessions: 0
              }],
              total_classes: student.total_classes + 1
            };
          }
        }
        return student;
      }));
      
      setShowEnrollModal(false);
      setSelectedStudent(null);
      setEnrollmentClass('');
    } catch (error) {
      console.error('Error enrolling student:', error);
    }
  };

  const handleRemoveStudent = async (studentId: string, classId: string) => {
    try {
      // TODO: Implement actual removal
      console.log('Removing student:', studentId, 'from class:', classId);
      
      // Update local state optimistically
      setStudents(prev => prev.map(student => {
        if (student.id === studentId) {
          return {
            ...student,
            enrolled_classes: student.enrolled_classes.filter(cls => cls.class_id !== classId),
            total_classes: Math.max(0, student.total_classes - 1)
          };
        }
        return student;
      }));
    } catch (error) {
      console.error('Error removing student:', error);
    }
  };

  const getAttendanceColor = (rate: number) => {
    if (rate >= 85) return 'text-emerald-600 dark:text-emerald-400';
    if (rate >= 70) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getAttendanceBadge = (rate: number) => {
    if (rate >= 85) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
    if (rate >= 70) return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
    return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
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
        currentPage="students"
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
                Student Management 👥
              </h1>
              <p className="text-xl text-slate-600 dark:text-slate-400">
                Manage student enrollments and track academic progress
              </p>
            </div>
            <div className="hidden lg:flex items-center space-x-4">
              <Button
                onClick={() => setShowBulkEnrollModal(true)}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Upload className="w-5 h-5 mr-2" />
                Bulk Enroll
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-slate-800/60 dark:to-slate-700/60 border-blue-200 dark:border-slate-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-slate-300 mb-1">
                  Total Students
                </p>
                <p className="text-3xl font-bold text-blue-900 dark:text-white">
                  {students.length}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-500 dark:text-blue-400" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-slate-800/60 dark:to-slate-700/60 border-emerald-200 dark:border-slate-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-600 dark:text-slate-300 mb-1">
                  Active Students
                </p>
                <p className="text-3xl font-bold text-emerald-900 dark:text-white">
                  {students.filter(s => s.is_active).length}
                </p>
              </div>
              <UserCheck className="w-8 h-8 text-emerald-500 dark:text-emerald-400" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-slate-800/60 dark:to-slate-700/60 border-amber-200 dark:border-slate-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-600 dark:text-slate-300 mb-1">
                  Avg Attendance
                </p>
                <p className="text-3xl font-bold text-amber-900 dark:text-white">
                  {Math.round(students.reduce((sum, s) => sum + s.average_attendance, 0) / students.length || 0)}%
                </p>
              </div>
              <Calendar className="w-8 h-8 text-amber-500 dark:text-amber-400" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-slate-800/60 dark:to-slate-700/60 border-indigo-200 dark:border-slate-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-indigo-600 dark:text-slate-300 mb-1">
                  Total Enrollments
                </p>
                <p className="text-3xl font-bold text-indigo-900 dark:text-white">
                  {students.reduce((sum, s) => sum + s.total_classes, 0)}
                </p>
              </div>
              <BookOpen className="w-8 h-8 text-indigo-500 dark:text-indigo-400" />
            </div>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="p-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="lg:col-span-2 relative">
              <Search className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
              <Input
                placeholder="Search students by name, ID, email, or major..."
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
                    {cls.code} ({cls.enrolled_count}/{cls.max_students})
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
                <option value="inactive">Inactive</option>
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3 top-3 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Sort */}
          <div className="mt-4 flex items-center space-x-4">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Sort by:</span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="appearance-none bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="name">Name</option>
                <option value="student_id">Student ID</option>
                <option value="attendance">Attendance</option>
                <option value="classes">Number of Classes</option>
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3 top-3 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedStudents.length > 0 && (
            <div className="mt-4 flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  {selectedStudents.length} student{selectedStudents.length > 1 ? 's' : ''} selected
                </span>
                <Button
                  onClick={() => setSelectedStudents([])}
                  variant="ghost"
                  size="sm"
                  className="text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                >
                  Clear Selection
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                <Button size="sm" variant="outline" className="hover:bg-slate-50 dark:hover:bg-slate-700">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Button size="sm" variant="outline" className="hover:bg-slate-50 dark:hover:bg-slate-700">
                  <Mail className="w-4 h-4 mr-2" />
                  Send Email
                </Button>
                <Button size="sm" className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Bulk Enroll
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Students Table */}
        <Card className="overflow-hidden bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-700">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Academic Info
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Enrolled Classes
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Attendance
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => handleSelectStudent(student.id)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mr-4">
                          <span className="text-sm font-bold text-white">
                            {student.first_name[0]}{student.last_name[0]}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-900 dark:text-white">
                            {student.first_name} {student.last_name}
                          </div>
                          <div className="text-sm text-slate-500 dark:text-slate-400">
                            ID: {student.student_id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-900 dark:text-white">
                        <div className="flex items-center mb-1">
                          <Mail className="w-4 h-4 mr-2 text-slate-400" />
                          {student.email}
                        </div>
                        {student.phone && (
                          <div className="flex items-center">
                            <Phone className="w-4 h-4 mr-2 text-slate-400" />
                            {student.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-900 dark:text-white">
                        <div className="flex items-center mb-1">
                          <GraduationCap className="w-4 h-4 mr-2 text-slate-400" />
                          {student.major}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Class of {student.graduation_year}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <span className="font-medium text-slate-900 dark:text-white">
                          {student.total_classes} classes
                        </span>
                        <div className="mt-1 space-y-1">
                          {student.enrolled_classes.slice(0, 2).map((cls) => (
                            <div key={cls.id} className="flex items-center justify-between">
                              <span className="text-xs text-slate-600 dark:text-slate-400">
                                {cls.class_code}
                              </span>
                              <span className={`text-xs px-1.5 py-0.5 rounded ${
                                cls.status === 'active'
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                  : cls.status === 'dropped'
                                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                  : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                              }`}>
                                {cls.status}
                              </span>
                            </div>
                          ))}
                          {student.enrolled_classes.length > 2 && (
                            <div className="text-xs text-slate-400">
                              +{student.enrolled_classes.length - 2} more
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className={`text-lg font-bold ${getAttendanceColor(student.average_attendance)}`}>
                          {student.average_attendance}%
                        </span>
                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAttendanceBadge(student.average_attendance)}`}>
                          {student.average_attendance >= 85 ? 'Excellent' : student.average_attendance >= 70 ? 'Good' : 'Needs Attention'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        student.is_active
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {student.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedStudent(student);
                            setShowEnrollModal(true);
                          }}
                          className="hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-700"
                        >
                          <UserPlus className="w-4 h-4 mr-1" />
                          Enroll
                        </Button>
                        <Button size="sm" variant="ghost" className="hover:bg-slate-100 dark:hover:bg-slate-700">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="hover:bg-slate-100 dark:hover:bg-slate-700">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredStudents.length === 0 && (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Users className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                No Students Found
              </h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Try adjusting your search or filter criteria to find the students you're looking for.
              </p>
            </div>
          )}
        </Card>
      </main>

      {/* Enroll Student Modal */}
      {showEnrollModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl flex items-center justify-center shadow-lg">
                    <UserPlus className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                      Enroll Student
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Add student to a new class
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowEnrollModal(false);
                    setSelectedStudent(null);
                    setEnrollmentClass('');
                  }}
                  className="hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-700 rounded-xl">
                <p className="font-medium text-slate-900 dark:text-white">
                  {selectedStudent.first_name} {selectedStudent.last_name}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  ID: {selectedStudent.student_id}
                </p>
              </div>

              <div className="mb-8">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Select Class
                </label>
                <select
                  value={enrollmentClass}
                  onChange={(e) => setEnrollmentClass(e.target.value)}
                  className="w-full appearance-none bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a class...</option>
                  {classes
                    .filter(cls => !selectedStudent.enrolled_classes.some(enrolled => enrolled.class_id === cls.id && enrolled.status === 'active'))
                    .map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.code} - {cls.name} ({cls.enrolled_count}/{cls.max_students})
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex space-x-4">
                <Button
                  onClick={() => handleEnrollStudent(selectedStudent.id, enrollmentClass)}
                  disabled={!enrollmentClass}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Enroll Student
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEnrollModal(false);
                    setSelectedStudent(null);
                    setEnrollmentClass('');
                  }}
                  className="hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-300 dark:border-slate-600"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Bulk Enroll Modal */}
      {showBulkEnrollModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg">
                    <Upload className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                      Bulk Enroll Students
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Upload CSV file to enroll multiple students
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBulkEnrollModal(false)}
                  className="hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-6">
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 text-center">
                  <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                    Upload CSV File
                  </h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                    Upload a CSV file with student IDs and class codes to enroll multiple students at once.
                  </p>
                  <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File
                  </Button>
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-6">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 mr-3" />
                    <div>
                      <h5 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                        CSV Format Requirements
                      </h5>
                      <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                        Your CSV should have columns: student_id, class_code
                      </p>
                      <Button variant="ghost" size="sm" className="text-amber-600 dark:text-amber-400 mt-2 p-0 hover:bg-amber-100 dark:hover:bg-amber-900/30">
                        <FileText className="w-4 h-4 mr-1" />
                        Download Template
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-6 border-t border-slate-200 dark:border-slate-700">
                  <Button
                    variant="outline"
                    onClick={() => setShowBulkEnrollModal(false)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-300 dark:border-slate-600"
                  >
                    Cancel
                  </Button>
                  <Button className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
                    Process Enrollments
                  </Button>
                </div>
              </div>
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

export default function StudentsPage() {
  return (
    <ProtectedRoute requiredRole="professor">
      <StudentsPageContent />
    </ProtectedRoute>
  );
}
