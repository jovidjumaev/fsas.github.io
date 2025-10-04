'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import ProtectedRoute from '@/components/protected-route';
import { NotificationPanel } from '@/components/notifications/notification-panel';
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

interface CreateClassForm {
  code: string;
  name: string;
  description: string;
  room_location: string;
  schedule_info: string;
  max_students: number;
  credits: number;
}

function ClassesPageContent() {
  const { user, signOut } = useAuth();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<ClassData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'code' | 'enrollment' | 'attendance' | 'created'>('name');
  const [filterBy, setFilterBy] = useState<'all' | 'active' | 'inactive' | 'high_performance' | 'needs_attention'>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [createForm, setCreateForm] = useState<CreateClassForm>({
    code: '',
    name: '',
    description: '',
    room_location: '',
    schedule_info: '',
    max_students: 30,
    credits: 3
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
  }, [user]);

  useEffect(() => {
    filterAndSortClasses();
  }, [classes, searchQuery, sortBy, filterBy]);

  const fetchClasses = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockClasses: ClassData[] = [
        {
          id: '1',
          code: 'CSC-475',
          name: 'Seminar in Computer Science',
          description: 'Advanced topics in computer science research and development with focus on emerging technologies',
          room_location: 'Room 101',
          schedule_info: 'MWF 10:00-10:50',
          max_students: 25,
          enrolled_students: 18,
          credits: 3,
          academic_period: 'Fall 2024',
          year: 2024,
          semester: 'Fall',
          department_name: 'Computer Science',
          is_active: true,
          created_at: '2024-08-15T00:00:00Z',
          attendance_rate: 89.5,
          total_sessions: 24,
          active_sessions: 1,
          performance_grade: 'excellent',
          next_session: {
            date: new Date().toISOString().split('T')[0],
            start_time: '10:00'
          }
        },
        {
          id: '2',
          code: 'CSC-301',
          name: 'Data Structures and Algorithms',
          description: 'Comprehensive study of fundamental data structures and algorithmic problem-solving techniques',
          room_location: 'Room 205',
          schedule_info: 'MWF 14:00-14:50',
          max_students: 30,
          enrolled_students: 28,
          credits: 4,
          academic_period: 'Fall 2024',
          year: 2024,
          semester: 'Fall',
          department_name: 'Computer Science',
          is_active: true,
          created_at: '2024-08-15T00:00:00Z',
          attendance_rate: 94.2,
          total_sessions: 24,
          active_sessions: 0,
          performance_grade: 'excellent'
        },
        {
          id: '3',
          code: 'CSC-150',
          name: 'Introduction to Programming',
          description: 'Basic programming concepts, problem-solving techniques, and computational thinking',
          room_location: 'Room 110',
          schedule_info: 'TTh 09:00-10:15',
          max_students: 35,
          enrolled_students: 32,
          credits: 3,
          academic_period: 'Fall 2024',
          year: 2024,
          semester: 'Fall',
          department_name: 'Computer Science',
          is_active: true,
          created_at: '2024-08-15T00:00:00Z',
          attendance_rate: 76.8,
          total_sessions: 16,
          active_sessions: 0,
          performance_grade: 'needs_attention'
        },
        {
          id: '4',
          code: 'CSC-200',
          name: 'Computer Systems Architecture',
          description: 'Computer architecture, systems programming, and low-level computing concepts',
          room_location: 'Room 120',
          schedule_info: 'TTh 14:00-15:15',
          max_students: 25,
          enrolled_students: 22,
          credits: 4,
          academic_period: 'Fall 2024',
          year: 2024,
          semester: 'Fall',
          department_name: 'Computer Science',
          is_active: false,
          created_at: '2024-08-15T00:00:00Z',
          attendance_rate: 88.3,
          total_sessions: 16,
          active_sessions: 0,
          performance_grade: 'good'
        }
      ];
      
      setClasses(mockClasses);
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setIsLoading(false);
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
      console.log('Creating class:', createForm);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setCreateForm({
        code: '',
        name: '',
        description: '',
        room_location: '',
        schedule_info: '',
        max_students: 30,
        credits: 3
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
                <Button variant="ghost" size="sm" className="hover:bg-slate-100 dark:hover:bg-slate-700">
                  <Home className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <Link href="/professor/classes">
                <Button variant="ghost" size="sm" className="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900 hover:bg-blue-100 dark:hover:bg-blue-800">
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

              {/* User */}
              <div className="flex items-center space-x-3">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    Prof. {(user as any)?.first_name || 'Professor'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-32">
                    {user?.email}
                  </p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <LogOut className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Course Code *
                    </label>
                    <Input
                      placeholder="e.g., CSC-475"
                      value={createForm.code}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, code: e.target.value }))}
                      className="bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Credits
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max="6"
                      value={createForm.credits}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, credits: parseInt(e.target.value) || 3 }))}
                      className="bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Course Name *
                  </label>
                  <Input
                    placeholder="e.g., Seminar in Computer Science"
                    value={createForm.name}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Description
                  </label>
                  <textarea
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white transition-all"
                    rows={3}
                    placeholder="Brief description of the course content and objectives..."
                    value={createForm.description}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Room Location
                    </label>
                    <Input
                      placeholder="e.g., Room 101"
                      value={createForm.room_location}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, room_location: e.target.value }))}
                      className="bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Max Students
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      value={createForm.max_students}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, max_students: parseInt(e.target.value) || 30 }))}
                      className="bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Schedule Information
                  </label>
                  <Input
                    placeholder="e.g., MWF 10:00-10:50"
                    value={createForm.schedule_info}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, schedule_info: e.target.value }))}
                    className="bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600"
                  />
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