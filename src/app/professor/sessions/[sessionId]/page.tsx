'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import ProtectedRoute from '@/components/protected-route';
import { 
  Calendar, Clock, Users, QrCode, Play, Pause, Square, 
  ArrowLeft, Download, Eye, CheckCircle, XCircle, AlertCircle,
  MapPin, BookOpen, Activity, BarChart3, FileText, Timer
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import ProfessorHeader from '@/components/professor/professor-header';

interface SessionData {
  id: string;
  class_instance_id: string;
  session_number: number;
  date: string;
  start_time: string;
  end_time: string;
  room_location: string;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  is_active: boolean;
  qr_secret?: string;
  qr_expires_at?: string;
  attendance_count: number;
  total_enrolled: number;
  notes?: string;
  created_at: string;
  class_instances: {
    id: string;
    room_location: string;
    courses: {
      code: string;
      name: string;
    };
    academic_periods: {
      name: string;
    };
  };
}

interface AttendanceRecord {
  id: string;
  student_id: string;
  session_id: string;
  status: 'present' | 'late' | 'absent';
  timestamp: string;
  students: {
    user_id: string;
    student_id: string;
    users: {
      first_name: string;
      last_name: string;
      email: string;
    };
  };
}

function SessionDetailsContent() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  
  const [session, setSession] = useState<SessionData | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Fetch session details
  const fetchSessionDetails = useCallback(async () => {
    if (!user || !sessionId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/sessions/${sessionId}`);
      if (!response.ok) throw new Error('Failed to fetch session details');
      
      const data = await response.json();
      setSession(data.session);
    } catch (error) {
      console.error('Error fetching session details:', error);
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  }, [user, sessionId]);

  // Fetch attendance records
  const fetchAttendance = useCallback(async () => {
    if (!sessionId) return;
    
    try {
      const response = await fetch(`/api/sessions/${sessionId}/attendance`);
      if (!response.ok) throw new Error('Failed to fetch attendance');
      
      const data = await response.json();
      setAttendance(data.data || []);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      setAttendance([]);
    }
  }, [sessionId]);

  // Session management functions
  const activateSession = useCallback(async (notes?: string) => {
    if (!session) return;
    
    setIsActionLoading(true);
    try {
      const response = await fetch(`/api/sessions/${session.id}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      
      if (!response.ok) throw new Error('Failed to activate session');
      
      await fetchSessionDetails();
      await fetchAttendance();
    } catch (error) {
      console.error('Error activating session:', error);
      alert('Failed to activate session. Please try again.');
    } finally {
      setIsActionLoading(false);
    }
  }, [session, fetchSessionDetails, fetchAttendance]);

  const completeSession = useCallback(async () => {
    if (!session) return;
    
    setIsActionLoading(true);
    try {
      const response = await fetch(`/api/sessions/${session.id}/complete`, {
        method: 'POST',
      });
      
      if (!response.ok) throw new Error('Failed to complete session');
      
      await fetchSessionDetails();
      await fetchAttendance();
    } catch (error) {
      console.error('Error completing session:', error);
      alert('Failed to complete session. Please try again.');
    } finally {
      setIsActionLoading(false);
    }
  }, [session, fetchSessionDetails, fetchAttendance]);

  const cancelSession = useCallback(async (notes?: string) => {
    if (!session) return;
    
    setIsActionLoading(true);
    try {
      const response = await fetch(`/api/sessions/${session.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      
      if (!response.ok) throw new Error('Failed to cancel session');
      
      await fetchSessionDetails();
    } catch (error) {
      console.error('Error cancelling session:', error);
      alert('Failed to cancel session. Please try again.');
    } finally {
      setIsActionLoading(false);
    }
  }, [session, fetchSessionDetails]);

  // Load data on mount
  useEffect(() => {
    fetchSessionDetails();
    fetchAttendance();
  }, [fetchSessionDetails, fetchAttendance]);

  // Get session status info
  const getSessionStatus = useCallback((session: SessionData) => {
    switch (session.status) {
      case 'active':
        return { 
          text: 'Active', 
          color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
          icon: Activity
        };
      case 'completed':
        return { 
          text: 'Completed', 
          color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
          icon: CheckCircle
        };
      case 'scheduled':
        return { 
          text: 'Scheduled', 
          color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
          icon: Clock
        };
      case 'cancelled':
        return { 
          text: 'Cancelled', 
          color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
          icon: XCircle
        };
      default:
        return { 
          text: 'Unknown', 
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
          icon: AlertCircle
        };
    }
  }, []);

  // Calculate attendance statistics
  const attendanceStats = {
    present: attendance.filter(a => a.status === 'present').length,
    late: attendance.filter(a => a.status === 'late').length,
    absent: session ? session.total_enrolled - attendance.length : 0,
    total: session ? session.total_enrolled : 0
  };

  const attendanceRate = attendanceStats.total > 0 ? (attendanceStats.present / attendanceStats.total) * 100 : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <ProfessorHeader 
          currentPage="sessions"
          userProfile={null}
          onSignOut={() => {}}
          onEditProfile={() => {}}
          onChangePassword={() => {}}
          onUploadAvatar={async () => {}}
          onDeleteAvatar={async () => {}}
        />
        <main className="max-w-4xl mx-auto px-6 py-8">
          <Card className="p-12 text-center bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Session Not Found
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              The session you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Button onClick={() => router.push('/professor/sessions')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sessions
            </Button>
          </Card>
        </main>
      </div>
    );
  }

  const status = getSessionStatus(session);
  const StatusIcon = status.icon;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <ProfessorHeader 
        currentPage="sessions"
        userProfile={null}
        onSignOut={() => {}}
        onEditProfile={() => {}}
        onChangePassword={() => {}}
        onUploadAvatar={async () => {}}
        onDeleteAvatar={async () => {}}
      />

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => router.push('/professor/sessions')}
            className="hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Sessions
          </Button>
        </div>

        {/* Session Header */}
        <Card className="p-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-16 h-16 bg-gradient-to-br ${
                session.status === 'active' 
                  ? 'from-emerald-500 to-emerald-600' 
                  : session.status === 'completed'
                  ? 'from-indigo-500 to-indigo-600'
                  : session.status === 'scheduled'
                  ? 'from-amber-500 to-amber-600'
                  : 'from-slate-400 to-slate-500'
              } rounded-2xl flex items-center justify-center shadow-lg`}>
                <StatusIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                  {session.class_instances.courses.code} - Session {session.session_number}
                </h1>
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
                    {session.status === 'active' && <div className="w-2 h-2 bg-current rounded-full mr-2 animate-pulse inline-block"></div>}
                    {status.text}
                  </span>
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {new Date(session.date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              {session.status === 'active' ? (
                <>
                  <Button
                    onClick={completeSession}
                    disabled={isActionLoading}
                    className="bg-red-500 hover:bg-red-600 text-white"
                  >
                    <Square className="w-4 h-4 mr-2" />
                    Stop Session
                  </Button>
                  <Button
                    onClick={() => router.push(`/professor/sessions/active/${session.id}`)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Live
                  </Button>
                </>
              ) : session.status === 'scheduled' ? (
                <Button
                  onClick={() => activateSession()}
                  disabled={isActionLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Session
                </Button>
              ) : null}
              
              <Button 
                variant="outline" 
                className="hover:bg-slate-100 dark:hover:bg-slate-700"
                onClick={() => {
                  if (attendance.length === 0) {
                    alert('No attendance data to export');
                    return;
                  }
                  
                  // Export to CSV
                  const headers = ['Student Name', 'Student ID', 'Email', 'Status', 'Scanned At'];
                  const csvContent = [
                    headers.join(','),
                    ...attendance.map(record => [
                      `"${record.students.users.first_name} ${record.students.users.last_name}"`,
                      `"${record.students.student_id}"`,
                      `"${record.students.users.email}"`,
                      `"${record.status}"`,
                      `"${new Date(record.scanned_at).toLocaleString()}"`
                    ].join(','))
                  ].join('\n');
                  
                  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                  const link = document.createElement('a');
                  const url = URL.createObjectURL(blob);
                  link.setAttribute('href', url);
                  link.setAttribute('download', `attendance_${session?.class_instances.courses.code}_${new Date().toISOString().split('T')[0]}.csv`);
                  link.style.visibility = 'hidden';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Session Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Course Details */}
            <Card className="p-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center">
                <BookOpen className="w-5 h-5 mr-2" />
                Course Information
              </h2>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Course</span>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">
                    {session.class_instances.courses.code} - {session.class_instances.courses.name}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Time</span>
                    <p className="text-slate-900 dark:text-white">
                      {session.start_time} - {session.end_time}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Room</span>
                    <p className="text-slate-900 dark:text-white">{session.room_location}</p>
                  </div>
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Academic Period</span>
                  <p className="text-slate-900 dark:text-white">{session.class_instances.academic_periods.name}</p>
                </div>
              </div>
            </Card>

            {/* Attendance Records */}
            <Card className="p-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Attendance Records
              </h2>
              
              {attendance.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-500 dark:text-slate-400">
                    {session.status === 'active' ? 'No attendance recorded yet' : 'No attendance records'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {attendance.map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${
                          record.status === 'present' ? 'bg-emerald-500' : 
                          record.status === 'late' ? 'bg-amber-500' : 'bg-red-500'
                        }`}></div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {record.students.users.first_name} {record.students.users.last_name}
                          </p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {record.students.users.email}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          record.status === 'present' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' :
                          record.status === 'late' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' :
                          'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {record.status}
                        </span>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {new Date(record.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Statistics Sidebar */}
          <div className="space-y-6">
            {/* Attendance Stats */}
            <Card className="p-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Attendance Statistics
              </h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Overall Rate</span>
                    <span className="text-lg font-bold text-slate-900 dark:text-white">
                      {attendanceRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                    <div
                      className="h-3 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-500"
                      style={{ width: `${attendanceRate}%` }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {attendanceStats.present}
                    </p>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300">Present</p>
                  </div>
                  <div className="text-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                      {attendanceStats.late}
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-300">Late</p>
                  </div>
                  <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {attendanceStats.absent}
                    </p>
                    <p className="text-xs text-red-700 dark:text-red-300">Absent</p>
                  </div>
                  <div className="text-center p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                    <p className="text-2xl font-bold text-slate-600 dark:text-slate-400">
                      {attendanceStats.total}
                    </p>
                    <p className="text-xs text-slate-700 dark:text-slate-300">Total</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Session Notes */}
            {session.notes && (
              <Card className="p-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Session Notes
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  {session.notes}
                </p>
              </Card>
            )}

            {/* Session Timer (if active) */}
            {session.status === 'active' && session.qr_expires_at && (
              <Card className="p-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center">
                  <Timer className="w-5 h-5 mr-2" />
                  Session Timer
                </h3>
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    Active
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Session will auto-complete in 1 hour
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function SessionDetailsPage() {
  return (
    <ProtectedRoute requiredRole="professor">
      <SessionDetailsContent />
    </ProtectedRoute>
  );
}
