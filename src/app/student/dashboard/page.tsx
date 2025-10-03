'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useAuth } from '@/lib/auth-context';
import ProtectedRoute from '@/components/protected-route';

interface StudentData {
  student_id: string;
  student_number: string;
  enrollment_year: number;
  major: string;
  graduation_year: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  is_active: boolean;
  account_created: string;
}

interface Enrollment {
  enrollment_id: string;
  class_code: string;
  class_name: string;
  room_location: string;
  schedule_info: string;
  academic_period: string;
  year: number;
  semester: string;
  professor_name: string;
  enrollment_status: string;
}

function StudentDashboardContent() {
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  useEffect(() => {
    // TODO: Replace with actual Supabase calls
    // For now, using mock data
    const mockStudentData: StudentData = {
      student_id: '123e4567-e89b-12d3-a456-426614174000',
      student_number: 'S2024001',
      enrollment_year: 2024,
      major: 'Computer Science',
      graduation_year: 2028,
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@furman.edu',
      phone: '+1-555-0123',
      is_active: true,
      account_created: '2024-01-15T10:30:00Z'
    };

    const mockEnrollments: Enrollment[] = [
      {
        enrollment_id: '1',
        class_code: 'CSC-475',
        class_name: 'Seminar in Computer Science',
        room_location: 'Room 101',
        schedule_info: 'MWF 10:00-10:50',
        academic_period: 'Fall 2024',
        year: 2024,
        semester: 'Fall',
        professor_name: 'Dr. Sarah Johnson',
        enrollment_status: 'enrolled'
      },
      {
        enrollment_id: '2',
        class_code: 'CSC-301',
        class_name: 'Data Structures and Algorithms',
        room_location: 'Room 205',
        schedule_info: 'MWF 14:00-14:50',
        academic_period: 'Fall 2024',
        year: 2024,
        semester: 'Fall',
        professor_name: 'Dr. Sarah Johnson',
        enrollment_status: 'enrolled'
      }
    ];

    setTimeout(() => {
      setStudentData(mockStudentData);
      setEnrollments(mockEnrollments);
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
                <span className="ml-2 text-sm text-gray-500">Student Portal</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {studentData?.first_name} {studentData?.last_name}
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
        {/* Student Info Card */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Student Information</h2>
            <Button variant="outline" size="sm">
              Edit Profile
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Student Number</label>
              <p className="text-lg font-semibold text-gray-900">{studentData?.student_number}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Major</label>
              <p className="text-lg font-semibold text-gray-900">{studentData?.major}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Graduation Year</label>
              <p className="text-lg font-semibold text-gray-900">{studentData?.graduation_year}</p>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 text-center hover:shadow-lg transition-shadow cursor-pointer">
            <div className="mx-auto h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Scan QR Code</h3>
            <p className="text-gray-600 mb-4">Mark attendance for current session</p>
            <Button className="w-full bg-blue-600 hover:bg-blue-700">
              Open Scanner
            </Button>
          </Card>

          <Card className="p-6 text-center hover:shadow-lg transition-shadow cursor-pointer">
            <div className="mx-auto h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Attendance History</h3>
            <p className="text-gray-600 mb-4">View your attendance records</p>
            <Button variant="outline" className="w-full">
              View History
            </Button>
          </Card>

          <Card className="p-6 text-center hover:shadow-lg transition-shadow cursor-pointer">
            <div className="mx-auto h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Class Schedule</h3>
            <p className="text-gray-600 mb-4">View upcoming sessions</p>
            <Button variant="outline" className="w-full">
              View Schedule
            </Button>
          </Card>
        </div>

        {/* Enrolled Classes */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">My Classes</h2>
            <span className="text-sm text-gray-500">{enrollments.length} classes enrolled</span>
          </div>
          
          {enrollments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No classes enrolled yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {enrollments.map((enrollment) => (
                <div key={enrollment.enrollment_id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {enrollment.class_code}: {enrollment.class_name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {enrollment.schedule_info} • {enrollment.room_location}
                      </p>
                      <p className="text-sm text-gray-500">
                        Professor: {enrollment.professor_name}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {enrollment.enrollment_status}
                      </span>
                      <p className="text-sm text-gray-500 mt-1">
                        {enrollment.academic_period}
                      </p>
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

export default function StudentDashboard() {
  return (
    <ProtectedRoute requiredRole="student">
      <StudentDashboardContent />
    </ProtectedRoute>
  );
}
