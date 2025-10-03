'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useAuth } from '@/lib/auth-context';
import ProtectedRoute from '@/components/protected-route';

interface ProfessorData {
  professor_id: string;
  employee_id: string;
  title: string;
  department_name: string;
  department_code: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  is_active: boolean;
  hire_date: string;
}

interface ClassData {
  class_id: string;
  code: string;
  name: string;
  room_location: string;
  schedule_info: string;
  max_students: number;
  enrolled_students: number;
  active_enrollments: number;
  academic_period: string;
  year: number;
  semester: string;
  is_active: boolean;
}

interface SessionData {
  session_id: string;
  class_id: string;
  session_date: string;
  start_time: string;
  end_time: string;
  room_location: string;
  attendance_count: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  class_code: string;
  class_name: string;
}

function ProfessorDashboardContent() {
  const [professorData, setProfessorData] = useState<ProfessorData | null>(null);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [recentSessions, setRecentSessions] = useState<SessionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  useEffect(() => {
    // TODO: Replace with actual Supabase calls
    // For now, using mock data
    const mockProfessorData: ProfessorData = {
      professor_id: '123e4567-e89b-12d3-a456-426614174000',
      employee_id: 'EMP-001',
      title: 'Associate Professor',
      department_name: 'Computer Science',
      department_code: 'CS',
      first_name: 'Sarah',
      last_name: 'Johnson',
      email: 'sarah.johnson@furman.edu',
      phone: '+1-555-0124',
      is_active: true,
      hire_date: '2020-08-15'
    };

    const mockClasses: ClassData[] = [
      {
        class_id: '1',
        code: 'CSC-475',
        name: 'Seminar in Computer Science',
        room_location: 'Room 101',
        schedule_info: 'MWF 10:00-10:50',
        max_students: 25,
        enrolled_students: 18,
        active_enrollments: 18,
        academic_period: 'Fall 2024',
        year: 2024,
        semester: 'Fall',
        is_active: true
      },
      {
        class_id: '2',
        code: 'CSC-301',
        name: 'Data Structures and Algorithms',
        room_location: 'Room 205',
        schedule_info: 'MWF 14:00-14:50',
        max_students: 30,
        enrolled_students: 28,
        active_enrollments: 28,
        academic_period: 'Fall 2024',
        year: 2024,
        semester: 'Fall',
        is_active: true
      }
    ];

    const mockSessions: SessionData[] = [
      {
        session_id: '1',
        class_id: '1',
        session_date: '2024-10-03',
        start_time: '10:00:00',
        end_time: '10:50:00',
        room_location: 'Room 101',
        attendance_count: 18,
        present_count: 16,
        absent_count: 2,
        late_count: 0,
        class_code: 'CSC-475',
        class_name: 'Seminar in Computer Science'
      },
      {
        session_id: '2',
        class_id: '2',
        session_date: '2024-10-03',
        start_time: '14:00:00',
        end_time: '14:50:00',
        room_location: 'Room 205',
        attendance_count: 28,
        present_count: 25,
        absent_count: 2,
        late_count: 1,
        class_code: 'CSC-301',
        class_name: 'Data Structures and Algorithms'
      }
    ];

    setTimeout(() => {
      setProfessorData(mockProfessorData);
      setClasses(mockClasses);
      setRecentSessions(mockSessions);
      setIsLoading(false);
    }, 1000);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900">FSAS</h1>
                <span className="ml-2 text-sm text-gray-500">Professor Portal</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {professorData?.first_name} {professorData?.last_name}
              </span>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Professor Info Card */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Professor Information</h2>
            <Button variant="outline" size="sm">
              Edit Profile
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Employee ID</label>
              <p className="text-lg font-semibold text-gray-900">{professorData?.employee_id}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Title</label>
              <p className="text-lg font-semibold text-gray-900">{professorData?.title}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Department</label>
              <p className="text-lg font-semibold text-gray-900">{professorData?.department_name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Hire Date</label>
              <p className="text-lg font-semibold text-gray-900">
                {professorData?.hire_date ? new Date(professorData.hire_date).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 text-center hover:shadow-lg transition-shadow cursor-pointer">
            <div className="mx-auto h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Generate QR Code</h3>
            <p className="text-gray-600 mb-4">Create QR code for current session</p>
            <Button className="w-full bg-green-600 hover:bg-green-700">
              Generate QR
            </Button>
          </Card>

          <Card className="p-6 text-center hover:shadow-lg transition-shadow cursor-pointer">
            <div className="mx-auto h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Manage Classes</h3>
            <p className="text-gray-600 mb-4">Add or edit your classes</p>
            <Button variant="outline" className="w-full">
              Manage Classes
            </Button>
          </Card>

          <Card className="p-6 text-center hover:shadow-lg transition-shadow cursor-pointer">
            <div className="mx-auto h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">View Analytics</h3>
            <p className="text-gray-600 mb-4">Attendance reports and insights</p>
            <Button variant="outline" className="w-full">
              View Analytics
            </Button>
          </Card>

          <Card className="p-6 text-center hover:shadow-lg transition-shadow cursor-pointer">
            <div className="mx-auto h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Manage Students</h3>
            <p className="text-gray-600 mb-4">Enroll students in classes</p>
            <Button variant="outline" className="w-full">
              Manage Students
            </Button>
          </Card>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Classes</p>
                <p className="text-2xl font-semibold text-gray-900">{classes.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Students</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {classes.reduce((sum, cls) => sum + cls.enrolled_students, 0)}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Recent Sessions</p>
                <p className="text-2xl font-semibold text-gray-900">{recentSessions.length}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* My Classes */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">My Classes</h2>
            <Button className="bg-green-600 hover:bg-green-700">
              Add New Class
            </Button>
          </div>
          
          {classes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No classes found.</p>
              <Button className="mt-4 bg-green-600 hover:bg-green-700">
                Create Your First Class
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {classes.map((classData) => (
                <div key={classData.class_id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {classData.code}: {classData.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {classData.schedule_info} • {classData.room_location}
                      </p>
                      <p className="text-sm text-gray-500">
                        {classData.academic_period}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-gray-900">{classData.enrolled_students}</p>
                          <p className="text-xs text-gray-500">Enrolled</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-gray-900">{classData.max_students}</p>
                          <p className="text-xs text-gray-500">Max</p>
                        </div>
                        <div className="flex flex-col space-y-2">
                          <Button size="sm" variant="outline">
                            View Details
                          </Button>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700">
                            Generate QR
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent Sessions */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Recent Sessions</h2>
            <Button variant="outline">
              View All Sessions
            </Button>
          </div>
          
          {recentSessions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No recent sessions found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentSessions.map((session) => (
                <div key={session.session_id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {session.class_code}: {session.class_name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {new Date(session.session_date).toLocaleDateString()} • 
                        {session.start_time} - {session.end_time} • 
                        {session.room_location}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <p className="text-lg font-bold text-green-600">{session.present_count}</p>
                          <p className="text-xs text-gray-500">Present</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-red-600">{session.absent_count}</p>
                          <p className="text-xs text-gray-500">Absent</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-yellow-600">{session.late_count}</p>
                          <p className="text-xs text-gray-500">Late</p>
                        </div>
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}

export default function ProfessorDashboard() {
  return (
    <ProtectedRoute requiredRole="professor">
      <ProfessorDashboardContent />
    </ProtectedRoute>
  );
}
