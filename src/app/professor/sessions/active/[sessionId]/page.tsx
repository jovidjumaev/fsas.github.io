'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import ProtectedRoute from '@/components/protected-route';
import { 
  QrCode, Users, Clock, Square, Pause, Play, 
  Maximize2, Minimize2, Volume2, VolumeX, RefreshCw,
  CheckCircle, XCircle, AlertCircle, Eye, EyeOff,
  Calendar, MapPin, BarChart3, Download, Settings,
  ArrowLeft, Activity, Timer
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface ActiveSessionData {
  id: string;
  class_id: string;
  class_code: string;
  class_name: string;
  date: string;
  start_time: string;
  end_time: string;
  room_location: string;
  is_active: boolean;
  qr_code: string;
  qr_code_expires_at: string;
  refresh_interval: number; // seconds
  attendance_count: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  total_enrolled: number;
  created_at: string;
  notes?: string;
}

interface AttendanceRecord {
  id: string;
  student_id: string;
  student_name: string;
  student_photo?: string;
  status: 'present' | 'late' | 'absent';
  scanned_at: string;
  device_info?: string;
}

function ActiveSessionContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const sessionId = params.sessionId as string;
  
  const [session, setSession] = useState<ActiveSessionData | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showStudentList, setShowStudentList] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [qrRefreshCountdown, setQrRefreshCountdown] = useState(30);
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const qrRefreshInterval = useRef<NodeJS.Timeout | null>(null);
  const countdownInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (sessionId) {
      fetchSessionData();
      startRealTimeUpdates();
    }

    return () => {
      stopRealTimeUpdates();
    };
  }, [sessionId]);

  useEffect(() => {
    if (session?.is_active) {
      startQRRefreshTimer();
      startSessionTimer();
    } else {
      stopQRRefreshTimer();
      stopSessionTimer();
    }

    return () => {
      stopQRRefreshTimer();
      stopSessionTimer();
    };
  }, [session?.is_active]);

  const fetchSessionData = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockSession: ActiveSessionData = {
        id: sessionId,
        class_id: '1',
        class_code: 'CSC-475',
        class_name: 'Seminar in Computer Science',
        date: new Date().toISOString().split('T')[0],
        start_time: '10:00',
        end_time: '10:50',
        room_location: 'Room 101',
        is_active: true,
        qr_code: `https://fsas.app/scan/${sessionId}?t=${Date.now()}`,
        qr_code_expires_at: new Date(Date.now() + 30000).toISOString(),
        refresh_interval: 30,
        attendance_count: 12,
        present_count: 10,
        absent_count: 6,
        late_count: 2,
        total_enrolled: 18,
        created_at: new Date().toISOString(),
        notes: 'Midterm exam review session'
      };

      const mockAttendance: AttendanceRecord[] = [
        {
          id: '1',
          student_id: '1',
          student_name: 'John Doe',
          status: 'present',
          scanned_at: new Date(Date.now() - 300000).toISOString()
        },
        {
          id: '2',
          student_id: '2',
          student_name: 'Jane Smith',
          status: 'late',
          scanned_at: new Date(Date.now() - 180000).toISOString()
        },
        {
          id: '3',
          student_id: '3',
          student_name: 'Mike Johnson',
          status: 'present',
          scanned_at: new Date(Date.now() - 120000).toISOString()
        }
      ];

      setSession(mockSession);
      setAttendanceRecords(mockAttendance);
      
      // Calculate time remaining
      const endTime = new Date(`${mockSession.date}T${mockSession.end_time}`);
      const now = new Date();
      const remaining = Math.max(0, Math.floor((endTime.getTime() - now.getTime()) / 1000));
      setTimeRemaining(remaining);
      
    } catch (error) {
      console.error('Error fetching session data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startRealTimeUpdates = () => {
    // TODO: Implement WebSocket connection for real-time updates
    const interval = setInterval(() => {
      // Simulate new attendance records
      if (Math.random() < 0.1) { // 10% chance every 5 seconds
        addNewAttendanceRecord();
      }
    }, 5000);

    return () => clearInterval(interval);
  };

  const stopRealTimeUpdates = () => {
    // TODO: Close WebSocket connection
  };

  const addNewAttendanceRecord = () => {
    const names = ['Alex Wilson', 'Sarah Davis', 'Tom Brown', 'Lisa Garcia', 'David Miller'];
    const statuses: ('present' | 'late')[] = ['present', 'late'];
    
    const newRecord: AttendanceRecord = {
      id: Date.now().toString(),
      student_id: Date.now().toString(),
      student_name: names[Math.floor(Math.random() * names.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      scanned_at: new Date().toISOString()
    };

    setAttendanceRecords(prev => [newRecord, ...prev]);
    setSession(prev => prev ? {
      ...prev,
      attendance_count: prev.attendance_count + 1,
      present_count: newRecord.status === 'present' ? prev.present_count + 1 : prev.present_count,
      late_count: newRecord.status === 'late' ? prev.late_count + 1 : prev.late_count
    } : null);

    setLastScanTime(new Date());

    // Play sound notification
    if (soundEnabled && audioRef.current) {
      audioRef.current.play().catch(console.error);
    }
  };

  const startQRRefreshTimer = () => {
    if (qrRefreshInterval.current) return;
    
    qrRefreshInterval.current = setInterval(() => {
      refreshQRCode();
    }, 30000); // Refresh every 30 seconds

    // Countdown timer
    setQrRefreshCountdown(30);
    countdownInterval.current = setInterval(() => {
      setQrRefreshCountdown(prev => {
        if (prev <= 1) {
          return 30; // Reset countdown
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopQRRefreshTimer = () => {
    if (qrRefreshInterval.current) {
      clearInterval(qrRefreshInterval.current);
      qrRefreshInterval.current = null;
    }
    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
      countdownInterval.current = null;
    }
  };

  const startSessionTimer = () => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  };

  const stopSessionTimer = () => {
    // Timer will stop automatically when timeRemaining reaches 0
  };

  const refreshQRCode = () => {
    if (!session) return;
    
    const newQRCode = `https://fsas.app/scan/${sessionId}?t=${Date.now()}`;
    setSession(prev => prev ? {
      ...prev,
      qr_code: newQRCode,
      qr_code_expires_at: new Date(Date.now() + 30000).toISOString()
    } : null);
  };

  const handleStopSession = async () => {
    try {
      // TODO: Implement actual session stop
      console.log('Stopping session:', sessionId);
      setSession(prev => prev ? { ...prev, is_active: false } : null);
      router.push('/professor/sessions');
    } catch (error) {
      console.error('Error stopping session:', error);
    }
  };

  const handlePauseSession = async () => {
    try {
      // TODO: Implement session pause
      console.log('Pausing session:', sessionId);
      setSession(prev => prev ? { ...prev, is_active: false } : null);
    } catch (error) {
      console.error('Error pausing session:', error);
    }
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getAttendanceRate = () => {
    if (!session || session.total_enrolled === 0) return 0;
    return Math.round((session.attendance_count / session.total_enrolled) * 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Session Not Found</h2>
          <p className="text-gray-600 mb-4">The requested session could not be found.</p>
          <Link href="/professor/sessions">
            <Button>Back to Sessions</Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex flex-col items-center justify-center z-50">
        {/* Fullscreen Header */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-white">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold">{session.class_code}</h1>
            <span className="text-lg opacity-75">{session.class_name}</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm opacity-75">Session ends in</p>
              <p className="text-xl font-bold">{formatTime(timeRemaining)}</p>
            </div>
            <Button
              onClick={toggleFullscreen}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10"
            >
              <Minimize2 className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Fullscreen QR Code */}
        <div className="text-center text-white">
          <div className="w-96 h-96 bg-white rounded-2xl p-8 mb-8 shadow-2xl">
            <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
              <QrCode className="w-64 h-64 text-gray-400" />
            </div>
          </div>
          
          <h2 className="text-3xl font-bold mb-2">{session.class_code}</h2>
          <p className="text-xl mb-4">{session.class_name}</p>
          <p className="text-lg mb-2">
            {new Date(session.date).toLocaleDateString()} • {session.start_time} - {session.end_time}
          </p>
          <p className="text-lg mb-8">{session.room_location}</p>
          
          <div className="flex items-center justify-center space-x-8 text-lg">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-400 rounded-full mr-2 animate-pulse"></div>
              <span>Active</span>
            </div>
            <div>
              <span className="font-bold text-2xl">{session.attendance_count}</span>
              <span className="opacity-75">/{session.total_enrolled} Students Scanned</span>
            </div>
            <div>
              <span>Refreshes in: </span>
              <span className="font-bold">{qrRefreshCountdown}s</span>
            </div>
          </div>
        </div>

        {/* Fullscreen Footer */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
          <div className="flex items-center space-x-6">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-green-400" />
              <span>{session.present_count} Present</span>
            </div>
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-yellow-400" />
              <span>{session.late_count} Late</span>
            </div>
            <div className="flex items-center">
              <XCircle className="w-5 h-5 mr-2 text-red-400" />
              <span>{session.absent_count} Absent</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              onClick={handlePauseSession}
              variant="ghost"
              className="text-white hover:bg-white/10"
            >
              <Pause className="w-5 h-5 mr-2" />
              Pause
            </Button>
            <Button
              onClick={handleStopSession}
              variant="ghost"
              className="text-white hover:bg-red-500/20"
            >
              <Square className="w-5 h-5 mr-2" />
              Stop Session
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Audio element for scan notifications */}
      <audio ref={audioRef} preload="auto">
        <source src="/sounds/scan-beep.mp3" type="audio/mpeg" />
      </audio>

      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/professor/sessions">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Sessions
                </Button>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    {session.class_code} - Active Session
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {session.class_name}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-gray-400">Session ends in</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatTime(timeRemaining)}
                </p>
              </div>
              <Button
                onClick={handleStopSession}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Square className="w-4 h-4 mr-2" />
                Stop Session
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* QR Code Section */}
          <div className="lg:col-span-2">
            <Card className="p-8 text-center">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Attendance QR Code
                  </h2>
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      variant="ghost"
                      size="sm"
                    >
                      {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </Button>
                    <Button
                      onClick={refreshQRCode}
                      variant="ghost"
                      size="sm"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={toggleFullscreen}
                      variant="ghost"
                      size="sm"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {/* QR Code Display */}
                <div className="w-80 h-80 bg-white dark:bg-gray-800 rounded-2xl p-8 mx-auto mb-6 shadow-lg border">
                  <div className="w-full h-full bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <QrCode className="w-48 h-48 text-gray-400" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {session.attendance_count}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Students Scanned</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {getAttendanceRate()}%
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Attendance Rate</p>
                  </div>
                </div>

                <div className="flex items-center justify-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center">
                    <Timer className="w-4 h-4 mr-1" />
                    Refreshes in {qrRefreshCountdown}s
                  </div>
                  <span>•</span>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {new Date(session.date).toLocaleDateString()}
                  </div>
                  <span>•</span>
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {session.room_location}
                  </div>
                </div>
              </div>

              {/* Session Info */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mr-1" />
                    <span className="font-bold text-green-600 dark:text-green-400">
                      {session.present_count}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Present</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-1" />
                    <span className="font-bold text-yellow-600 dark:text-yellow-400">
                      {session.late_count}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Late</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-1" />
                    <span className="font-bold text-red-600 dark:text-red-400">
                      {session.absent_count}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Absent</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Live Attendance Panel */}
          <div>
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Live Attendance
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Real-time student check-ins
                  </p>
                </div>
                <Button
                  onClick={() => setShowStudentList(!showStudentList)}
                  variant="ghost"
                  size="sm"
                >
                  {showStudentList ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>

              {lastScanTime && (
                <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    <Activity className="w-4 h-4 inline mr-1" />
                    Last scan: {lastScanTime.toLocaleTimeString()}
                  </p>
                </div>
              )}

              {showStudentList && (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {attendanceRecords.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        No students have scanned yet
                      </p>
                    </div>
                  ) : (
                    attendanceRecords.map((record) => (
                      <div
                        key={record.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                              {record.student_name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white text-sm">
                              {record.student_name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(record.scanned_at).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          record.status === 'present'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : record.status === 'late'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {record.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Analytics
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ActiveSessionPage() {
  return (
    <ProtectedRoute requiredRole="professor">
      <ActiveSessionContent />
    </ProtectedRoute>
  );
}
