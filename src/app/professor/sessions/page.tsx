'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import io from 'socket.io-client';
import { useAuth } from '@/lib/auth-context';
import ProtectedRoute from '@/components/protected-route';
import { 
  Calendar, Clock, Users, QrCode, Play, Pause, Square, 
  MoreHorizontal, Filter, Search, Download, Eye, 
  CheckCircle, XCircle, AlertCircle, Plus, BarChart3,
  MapPin, BookOpen, TrendingUp, Activity, ChevronDown, X,
  Clock as Today, CalendarDays, History, Zap
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

interface ClassOption {
  id: string;
  courses: {
    code: string;
    name: string;
  };
}

type TabType = 'today' | 'active' | 'upcoming' | 'completed' | 'all';

function SessionsPageContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('today');
  const [searchTerm, setSearchTerm] = useState('');
  const socketRef = useRef<any>(null);

  // Fetch sessions from API
  const fetchSessions = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/professors/${user.id}/sessions`);
      if (!response.ok) throw new Error('Failed to fetch sessions');
      
      const data = await response.json();
      setSessions(data.sessions || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Fetch classes for filter
  const fetchClasses = useCallback(async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/professors/${user.id}/class-instances`);
      if (!response.ok) throw new Error('Failed to fetch classes');
      
      const data = await response.json();
      setClasses(data.class_instances || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
      setClasses([]);
    }
  }, [user]);

  // Session management functions
  const activateSession = useCallback(async (sessionId: string, notes?: string) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      
      if (!response.ok) throw new Error('Failed to activate session');
      await fetchSessions();
    } catch (error) {
      console.error('Error activating session:', error);
      alert('Failed to activate session. Please try again.');
    }
  }, [fetchSessions]);

  const completeSession = useCallback(async (sessionId: string) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/complete`, { method: 'POST' });
      if (!response.ok) throw new Error('Failed to complete session');
      await fetchSessions();
      
      // Automatically switch to completed tab to show the completed session
      setActiveTab('completed');
      console.log('✅ Session completed, switched to completed tab');
    } catch (error) {
      console.error('Error completing session:', error);
      alert('Failed to complete session. Please try again.');
    }
  }, [fetchSessions]);

  // Load data on mount
  useEffect(() => {
    fetchSessions();
    fetchClasses();
  }, [fetchSessions, fetchClasses]);

  // Handle URL parameters for tab switching
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['today', 'active', 'upcoming', 'completed', 'all'].includes(tabParam)) {
      setActiveTab(tabParam as TabType);
      console.log('🔄 Switched to tab from URL:', tabParam);
    }
  }, [searchParams]);

  // Refresh data when page becomes visible (user navigates back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🔄 Page became visible, refreshing sessions data');
        fetchSessions();
      }
    };

    const handleFocus = () => {
      console.log('🔄 Window focused, refreshing sessions data');
      fetchSessions();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchSessions]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!user) return;

    // Connect to WebSocket
    socketRef.current = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001');
    
    socketRef.current.on('connect', () => {
      console.log('🔌 Connected to WebSocket for sessions updates');
    });

    // Listen for session status updates
    socketRef.current.on('session_status_update', (data: { sessionId: string; status: string }) => {
      console.log('📡 Received session status update:', data);
      
      // Update the specific session in the state
      setSessions(prevSessions => 
        prevSessions.map(session => 
          session.id === data.sessionId 
            ? { ...session, status: data.status as any, is_active: data.status === 'active' }
            : session
        )
      );

      // If session was completed and we're on active tab, switch to completed
      if (data.status === 'completed' && activeTab === 'active') {
        setActiveTab('completed');
        console.log('🔄 Session completed, switched to completed tab');
      }
    });

    // Listen for session activation updates
    socketRef.current.on('session_activated', (data: { sessionId: string }) => {
      console.log('📡 Session activated:', data.sessionId);
      fetchSessions(); // Refresh all sessions data
    });

    // Listen for session completion updates
    socketRef.current.on('session_completed', (data: { sessionId: string }) => {
      console.log('📡 Session completed:', data.sessionId);
      fetchSessions(); // Refresh all sessions data
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        console.log('🔌 Disconnected from WebSocket');
      }
    };
  }, [user, fetchSessions, activeTab]);

  // Memoized filtered sessions by tab
  const filteredSessions = useMemo(() => {
    let filtered = [...sessions];

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(session =>
        session.class_instances.courses.code.toLowerCase().includes(searchLower) ||
        session.class_instances.courses.name.toLowerCase().includes(searchLower) ||
        session.room_location.toLowerCase().includes(searchLower)
      );
    }

    // Apply tab filter
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    switch (activeTab) {
      case 'today':
        filtered = filtered.filter(session => session.date === today);
        break;
      case 'active':
        filtered = filtered.filter(session => session.status === 'active');
        break;
      case 'upcoming':
        filtered = filtered.filter(session => 
          session.status === 'scheduled' && (session.date > today || session.date === today)
        );
        break;
      case 'completed':
        filtered = filtered.filter(session => session.status === 'completed');
        break;
      case 'all':
        // No additional filtering
        break;
    }

    // Sort by date and time
    return filtered.sort((a, b) => {
      const aDateTime = new Date(`${a.date}T${a.start_time}`);
      const bDateTime = new Date(`${b.date}T${b.start_time}`);
      return aDateTime.getTime() - bDateTime.getTime();
    });
  }, [sessions, activeTab, searchTerm]);

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

  // Tab configuration
  const tabs = [
    { id: 'today' as TabType, label: 'Today', icon: Today, count: sessions.filter(s => s.date === new Date().toISOString().split('T')[0]).length },
    { id: 'active' as TabType, label: 'Active', icon: Activity, count: sessions.filter(s => s.status === 'active').length },
    { id: 'upcoming' as TabType, label: 'Upcoming', icon: CalendarDays, count: sessions.filter(s => s.date > new Date().toISOString().split('T')[0] || (s.date === new Date().toISOString().split('T')[0] && s.status === 'scheduled')).length },
    { id: 'completed' as TabType, label: 'Completed', icon: History, count: sessions.filter(s => s.status === 'completed').length },
    { id: 'all' as TabType, label: 'All Sessions', icon: BarChart3, count: sessions.length }
  ];

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
        userProfile={null}
        onSignOut={() => {}}
        onEditProfile={() => {}}
        onChangePassword={() => {}}
        onUploadAvatar={async () => {}}
        onDeleteAvatar={async () => {}}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
                Class Sessions
              </h1>
              <p className="text-xl text-slate-600 dark:text-slate-400">
                Manage your attendance sessions
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                onClick={() => fetchSessions()}
                variant="outline" 
                className="hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <Zap className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Active Sessions Alert */}
        {sessions.filter(s => s.status === 'active').length > 0 && (
          <Card className="mb-6 bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-slate-800/60 dark:to-slate-700/60 border-emerald-200 dark:border-slate-600">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                  <div>
                    <h3 className="font-semibold text-emerald-900 dark:text-white">
                      {sessions.filter(s => s.status === 'active').length} Active Session{sessions.filter(s => s.status === 'active').length > 1 ? 's' : ''}
                    </h3>
                    <p className="text-sm text-emerald-700 dark:text-slate-300">
                      Students can scan QR codes to mark attendance
                    </p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => setActiveTab('active')}
                >
                  View Active
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Search Bar */}
        <Card className="p-4 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 mb-6">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
            <Input
              placeholder="Search sessions by course code, name, or room..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600"
            />
          </div>
        </Card>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-md transition-all ${
                    activeTab === tab.id
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{tab.label}</span>
                  {tab.count > 0 && (
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      activeTab === tab.id
                        ? 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300'
                        : 'bg-slate-300 dark:bg-slate-600 text-slate-600 dark:text-slate-400'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sessions List */}
        {filteredSessions.length === 0 ? (
          <Card className="p-12 text-center bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              {sessions.length === 0 ? 'No Sessions Yet' : 'No Sessions Found'}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
              {sessions.length === 0 
                ? 'Create your first class to start generating session templates.'
                : 'Try adjusting your search or selecting a different tab.'
              }
            </p>
            {sessions.length === 0 && (
              <Link href="/professor/classes">
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Class
                </Button>
              </Link>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSessions.map((session) => {
              const status = getSessionStatus(session);
              const StatusIcon = status.icon;
              const isToday = session.date === new Date().toISOString().split('T')[0];
              const canStart = session.status === 'scheduled';
              
              return (
                <Card
                  key={session.id}
                  className={`group bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-200 ${
                    session.status === 'active' ? 'ring-2 ring-emerald-500/20 shadow-emerald-500/10' : ''
                  }`}
                >
                  {/* Status Indicator */}
                  <div className={`h-1 bg-gradient-to-r ${
                    session.status === 'active' 
                      ? 'from-emerald-500 to-emerald-600' 
                      : session.status === 'completed'
                      ? 'from-indigo-500 to-indigo-600'
                      : session.status === 'scheduled'
                      ? 'from-amber-500 to-amber-600'
                      : 'from-slate-400 to-slate-500'
                  } rounded-t-xl`}></div>

                  <div className="p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 bg-gradient-to-br ${
                          session.status === 'active' 
                            ? 'from-emerald-500 to-emerald-600' 
                            : session.status === 'completed'
                            ? 'from-indigo-500 to-indigo-600'
                            : session.status === 'scheduled'
                            ? 'from-amber-500 to-amber-600'
                            : 'from-slate-400 to-slate-500'
                        } rounded-xl flex items-center justify-center shadow-sm`}>
                          <StatusIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                            {session.class_instances.courses.code}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                            {session.status === 'active' && <div className="w-1.5 h-1.5 bg-current rounded-full mr-1 animate-pulse inline-block"></div>}
                            {status.text}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Course Name */}
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">
                      {session.class_instances.courses.name}
                    </p>

                    {/* Session Details */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                        <Calendar className="w-4 h-4 mr-2" />
                        {new Date(session.date).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
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
                        {session.attendance_count}/{session.total_enrolled} students
                      </div>
                    </div>

                    {/* Attendance Progress */}
                    {session.total_enrolled > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-slate-500 dark:text-slate-400">Attendance</span>
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                            {Math.round((session.attendance_count / session.total_enrolled) * 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-500"
                            style={{ width: `${(session.attendance_count / session.total_enrolled) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      {session.status === 'active' ? (
                        <>
                          <Link href={`/professor/sessions/active/${session.id}`} className="flex-1">
                            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm">
                              <Eye className="w-4 h-4 mr-1" />
                              View Live
                            </Button>
                          </Link>
                          <Button
                            onClick={() => completeSession(session.id)}
                            className="bg-red-500 hover:bg-red-600 text-white text-sm px-3"
                          >
                            <Square className="w-4 h-4" />
                          </Button>
                        </>
                      ) : canStart ? (
                        <Button
                          onClick={() => activateSession(session.id)}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-sm"
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Start Session
                        </Button>
                      ) : (
                        <Link href={`/professor/sessions/${session.id}`} className="flex-1">
                          <Button variant="outline" className="w-full text-sm">
                            <Eye className="w-4 h-4 mr-1" />
                            View Details
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>
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