'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import ProtectedRoute from '@/components/protected-route';
import { NotificationPanel } from '@/components/notifications/notification-panel';
import { 
  BarChart3, TrendingUp, TrendingDown, Users, Calendar,
  Download, Filter, RefreshCw, Eye, AlertTriangle,
  CheckCircle, XCircle, Clock, BookOpen, Target,
  ChevronDown, ArrowUp, ArrowDown, Minus,
  Home, QrCode, GraduationCap, LogOut, Moon, Sun
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface AnalyticsData {
  overview: {
    totalSessions: number;
    totalStudents: number;
    averageAttendance: number;
    attendanceTrend: number; // percentage change
    topPerformingClass: string;
    lowestPerformingClass: string;
  };
  classPerformance: ClassPerformance[];
  attendanceTrends: AttendanceTrend[];
  studentDistribution: StudentDistribution[];
  timeBasedAnalysis: TimeAnalysis;
  alerts: Alert[];
}

interface ClassPerformance {
  id: string;
  code: string;
  name: string;
  totalSessions: number;
  averageAttendance: number;
  totalStudents: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
}

interface AttendanceTrend {
  date: string;
  overall: number;
  classes: { [classCode: string]: number };
}

interface StudentDistribution {
  range: string;
  count: number;
  percentage: number;
  color: string;
}

interface TimeAnalysis {
  byDayOfWeek: { day: string; attendance: number }[];
  byTimeOfDay: { time: string; attendance: number }[];
  peakAttendanceDay: string;
  lowestAttendanceDay: string;
}

interface Alert {
  id: string;
  type: 'warning' | 'critical' | 'info';
  title: string;
  description: string;
  classCode?: string;
  studentCount?: number;
  action?: string;
}

function AnalyticsPageContent() {
  const { user, signOut } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'week' | 'month' | 'semester'>('month');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

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
    fetchAnalytics();
  }, [user, selectedTimeRange, selectedClass]);

  const handleSignOut = async () => {
    await signOut();
  };

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockAnalytics: AnalyticsData = {
        overview: {
          totalSessions: 48,
          totalStudents: 125,
          averageAttendance: 85.4,
          attendanceTrend: 2.3,
          topPerformingClass: 'CSC-301',
          lowestPerformingClass: 'CSC-150'
        },
        classPerformance: [
          {
            id: '1',
            code: 'CSC-475',
            name: 'Seminar in Computer Science',
            totalSessions: 24,
            averageAttendance: 89.2,
            totalStudents: 18,
            presentCount: 432,
            lateCount: 28,
            absentCount: 56,
            trend: 'up',
            trendValue: 3.2
          },
          {
            id: '2',
            code: 'CSC-301',
            name: 'Data Structures',
            totalSessions: 24,
            averageAttendance: 92.1,
            totalStudents: 28,
            presentCount: 672,
            lateCount: 35,
            absentCount: 21,
            trend: 'up',
            trendValue: 1.8
          },
          {
            id: '3',
            code: 'CSC-150',
            name: 'Intro to Programming',
            totalSessions: 16,
            averageAttendance: 76.5,
            totalStudents: 32,
            presentCount: 512,
            lateCount: 84,
            absentCount: 128,
            trend: 'down',
            trendValue: -2.1
          }
        ],
        attendanceTrends: [
          { date: '2024-09-01', overall: 82.1, classes: { 'CSC-475': 85, 'CSC-301': 90, 'CSC-150': 71 } },
          { date: '2024-09-08', overall: 84.3, classes: { 'CSC-475': 87, 'CSC-301': 92, 'CSC-150': 74 } },
          { date: '2024-09-15', overall: 86.7, classes: { 'CSC-475': 89, 'CSC-301': 94, 'CSC-150': 77 } },
          { date: '2024-09-22', overall: 85.2, classes: { 'CSC-475': 88, 'CSC-301': 91, 'CSC-150': 76 } },
          { date: '2024-09-29', overall: 87.1, classes: { 'CSC-475': 91, 'CSC-301': 93, 'CSC-150': 78 } }
        ],
        studentDistribution: [
          { range: '90-100%', count: 45, percentage: 36, color: 'bg-green-500' },
          { range: '80-89%', count: 38, percentage: 30.4, color: 'bg-blue-500' },
          { range: '70-79%', count: 28, percentage: 22.4, color: 'bg-yellow-500' },
          { range: '60-69%', count: 10, percentage: 8, color: 'bg-orange-500' },
          { range: 'Below 60%', count: 4, percentage: 3.2, color: 'bg-red-500' }
        ],
        timeBasedAnalysis: {
          byDayOfWeek: [
            { day: 'Monday', attendance: 88.2 },
            { day: 'Tuesday', attendance: 85.7 },
            { day: 'Wednesday', attendance: 89.1 },
            { day: 'Thursday', attendance: 83.4 },
            { day: 'Friday', attendance: 79.8 }
          ],
          byTimeOfDay: [
            { time: '8:00 AM', attendance: 82.1 },
            { time: '10:00 AM', attendance: 89.3 },
            { time: '12:00 PM', attendance: 85.7 },
            { time: '2:00 PM', attendance: 87.2 },
            { time: '4:00 PM', attendance: 78.9 }
          ],
          peakAttendanceDay: 'Wednesday',
          lowestAttendanceDay: 'Friday'
        },
        alerts: [
          {
            id: '1',
            type: 'warning',
            title: 'Declining Attendance in CSC-150',
            description: 'Attendance has dropped by 5.2% over the last 2 weeks',
            classCode: 'CSC-150',
            studentCount: 8,
            action: 'Review class engagement'
          },
          {
            id: '2',
            type: 'critical',
            title: 'Students at Risk',
            description: '4 students have attendance below 60%',
            studentCount: 4,
            action: 'Contact students'
          },
          {
            id: '3',
            type: 'info',
            title: 'Peak Performance',
            description: 'CSC-301 achieved 94% attendance this week',
            classCode: 'CSC-301'
          }
        ]
      };
      
      setAnalytics(mockAnalytics);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <ArrowUp className="w-4 h-4 text-green-600" />;
      case 'down':
        return <ArrowDown className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return 'text-emerald-600 dark:text-emerald-400';
      case 'down':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-slate-600 dark:text-slate-400';
    }
  };

  const getAlertIcon = (type: 'warning' | 'critical' | 'info') => {
    switch (type) {
      case 'critical':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      default:
        return <CheckCircle className="w-5 h-5 text-blue-600" />;
    }
  };

  const getAlertColor = (type: 'warning' | 'critical' | 'info') => {
    switch (type) {
      case 'critical':
        return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700';
      case 'warning':
        return 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-700';
      default:
        return 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <Card className="p-8 text-center bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">Failed to load analytics data.</p>
          <Button onClick={() => window.location.reload()} className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white">
            Try Again
          </Button>
        </Card>
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
                <Button variant="ghost" size="sm" className="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30">
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
                Analytics Dashboard 📊
              </h1>
              <p className="text-xl text-slate-600 dark:text-slate-400">
                Comprehensive insights into attendance patterns and student performance
              </p>
            </div>

            {/* Filters and Actions */}
            <div className="hidden lg:flex items-center space-x-4">
              <div className="relative">
                <select
                  value={selectedTimeRange}
                  onChange={(e) => setSelectedTimeRange(e.target.value as any)}
                  className="appearance-none bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="week">Last Week</option>
                  <option value="month">Last Month</option>
                  <option value="semester">This Semester</option>
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-3 text-slate-400 pointer-events-none" />
              </div>

              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                disabled={refreshing}
                className="hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-300 dark:border-slate-600"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>

              <Button variant="outline" size="sm" className="hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-300 dark:border-slate-600">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-slate-800/60 dark:to-slate-700/60 border-blue-200 dark:border-slate-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-slate-300 mb-1">
                  Total Sessions
                </p>
                <p className="text-3xl font-bold text-blue-900 dark:text-white">
                  {analytics.overview.totalSessions}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500 dark:text-blue-400" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-slate-800/60 dark:to-slate-700/60 border-emerald-200 dark:border-slate-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-600 dark:text-slate-300 mb-1">
                  Total Students
                </p>
                <p className="text-3xl font-bold text-emerald-900 dark:text-white">
                  {analytics.overview.totalStudents}
                </p>
              </div>
              <Users className="w-8 h-8 text-emerald-500 dark:text-emerald-400" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-slate-800/60 dark:to-slate-700/60 border-amber-200 dark:border-slate-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-600 dark:text-slate-300 mb-1">
                  Avg Attendance
                </p>
                <div className="flex items-center">
                  <p className="text-3xl font-bold text-amber-900 dark:text-white">
                    {analytics.overview.averageAttendance}%
                  </p>
                  <div className="ml-2 flex items-center">
                    <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-sm text-emerald-600 dark:text-emerald-400 ml-1">
                      +{analytics.overview.attendanceTrend}%
                    </span>
                  </div>
                </div>
              </div>
              <Target className="w-8 h-8 text-amber-500 dark:text-amber-400" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-slate-800/60 dark:to-slate-700/60 border-indigo-200 dark:border-slate-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-indigo-600 dark:text-slate-300 mb-1">
                  Top Performing
                </p>
                <p className="text-lg font-bold text-indigo-900 dark:text-white">
                  {analytics.overview.topPerformingClass}
                </p>
                <p className="text-xs text-indigo-600 dark:text-slate-400">
                  Best attendance rate
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-indigo-500 dark:text-indigo-400" />
            </div>
          </Card>
        </div>

        {/* Alerts */}
        {analytics.alerts.length > 0 && (
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
              Alerts & Insights
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {analytics.alerts.map((alert) => (
                <Card key={alert.id} className={`p-6 border-l-4 ${getAlertColor(alert.type)} bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700`}>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-4">
                      {getAlertIcon(alert.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                        {alert.title}
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                        {alert.description}
                      </p>
                      {alert.action && (
                        <Button size="sm" variant="outline" className="text-xs hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-300 dark:border-slate-600">
                          {alert.action}
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Class Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card className="p-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                Class Performance
              </h3>
              <Button variant="ghost" size="sm" className="hover:bg-slate-100 dark:hover:bg-slate-700">
                <Eye className="w-4 h-4 mr-2" />
                View All
              </Button>
            </div>

            <div className="space-y-6">
              {analytics.classPerformance.map((cls) => (
                <div key={cls.id} className="p-6 bg-slate-50 dark:bg-slate-700 rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-slate-900 dark:text-white">
                        {cls.code}
                      </h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {cls.name}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`text-2xl font-bold ${
                        cls.averageAttendance >= 85 
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : cls.averageAttendance >= 70
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {cls.averageAttendance}%
                      </span>
                      <div className={`flex items-center ${getTrendColor(cls.trend)}`}>
                        {getTrendIcon(cls.trend)}
                        <span className="text-sm ml-1">
                          {Math.abs(cls.trendValue)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Students</p>
                      <p className="text-xl font-bold text-slate-900 dark:text-white">
                        {cls.totalStudents}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-emerald-600 dark:text-emerald-400">Present</p>
                      <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                        {cls.presentCount}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-amber-600 dark:text-amber-400">Late</p>
                      <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
                        {cls.lateCount}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-red-600 dark:text-red-400">Absent</p>
                      <p className="text-xl font-bold text-red-600 dark:text-red-400">
                        {cls.absentCount}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Student Distribution */}
          <Card className="p-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
              Student Attendance Distribution
            </h3>

            <div className="space-y-4">
              {analytics.studentDistribution.map((dist, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded ${dist.color}`}></div>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      {dist.range}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {dist.count} students
                    </span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {dist.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Visual Bar Chart */}
            <div className="mt-6 space-y-3">
              {analytics.studentDistribution.map((dist, index) => (
                <div key={index} className="flex items-center">
                  <div className="w-20 text-xs text-slate-600 dark:text-slate-400">
                    {dist.range}
                  </div>
                  <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-3 ml-3">
                    <div
                      className={`h-3 rounded-full ${dist.color}`}
                      style={{ width: `${dist.percentage}%` }}
                    ></div>
                  </div>
                  <div className="w-12 text-xs text-right text-slate-600 dark:text-slate-400 ml-2">
                    {dist.percentage}%
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Time-based Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* By Day of Week */}
          <Card className="p-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
              Attendance by Day of Week
            </h3>
            
            <div className="space-y-4">
              {analytics.timeBasedAnalysis.byDayOfWeek.map((day, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-900 dark:text-white w-20">
                    {day.day}
                  </span>
                  <div className="flex-1 mx-4">
                    <div className="bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full ${
                          day.attendance >= 85
                            ? 'bg-emerald-500'
                            : day.attendance >= 70
                            ? 'bg-amber-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${day.attendance}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white w-12 text-right">
                    {day.attendance}%
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <div className="flex items-center justify-between text-sm">
                <div>
                  <span className="text-blue-600 dark:text-blue-400 font-medium">Peak Day:</span>
                  <span className="ml-2 text-blue-900 dark:text-blue-100">
                    {analytics.timeBasedAnalysis.peakAttendanceDay}
                  </span>
                </div>
                <div>
                  <span className="text-blue-600 dark:text-blue-400 font-medium">Lowest Day:</span>
                  <span className="ml-2 text-blue-900 dark:text-blue-100">
                    {analytics.timeBasedAnalysis.lowestAttendanceDay}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* By Time of Day */}
          <Card className="p-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
              Attendance by Time of Day
            </h3>
            
            <div className="space-y-4">
              {analytics.timeBasedAnalysis.byTimeOfDay.map((time, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-900 dark:text-white w-20">
                    {time.time}
                  </span>
                  <div className="flex-1 mx-4">
                    <div className="bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full ${
                          time.attendance >= 85
                            ? 'bg-emerald-500'
                            : time.attendance >= 70
                            ? 'bg-amber-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${time.attendance}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white w-12 text-right">
                    {time.attendance}%
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
              <h4 className="text-sm font-medium text-emerald-800 dark:text-emerald-200 mb-2">
                Key Insights
              </h4>
              <ul className="text-sm text-emerald-700 dark:text-emerald-300 space-y-1">
                <li>• Morning classes (10 AM) show highest attendance</li>
                <li>• Late afternoon sessions have lower participation</li>
                <li>• Consider scheduling important content earlier</li>
              </ul>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <ProtectedRoute requiredRole="professor">
      <AnalyticsPageContent />
    </ProtectedRoute>
  );
}
