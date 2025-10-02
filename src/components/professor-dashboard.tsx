'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { CourseList } from '@/components/course-list';
import { SessionManager } from '@/components/session-manager';
import { AttendanceAnalytics } from '@/components/attendance-analytics';
import { Course, ClassSession, AttendanceRecord } from '@/types';

export function ProfessorDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'courses' | 'sessions' | 'analytics'>('courses');
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchCourses();
    }
  }, [user?.id]);

  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/courses');
      const data = await response.json();
      
      if (data.success) {
        setCourses(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch courses');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSessions = async (courseId: string) => {
    try {
      const response = await fetch(`/api/sessions/${courseId}`);
      const data = await response.json();
      
      if (data.success) {
        setSessions(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch sessions');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCourseSelect = (course: Course) => {
    setSelectedCourse(course);
    fetchSessions(course.id);
    setActiveTab('sessions');
  };

  const handleCreateCourse = async (courseData: any) => {
    try {
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(courseData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setCourses(prev => [data.data, ...prev]);
      } else {
        throw new Error(data.error || 'Failed to create course');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreateSession = async (sessionData: any) => {
    if (!selectedCourse) return;
    
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...sessionData,
          course_id: selectedCourse.id
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSessions(prev => [data.data.session, ...prev]);
      } else {
        throw new Error(data.error || 'Failed to create session');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">FSAS Dashboard</h1>
              <p className="text-sm text-gray-600">
                Welcome back, {user?.first_name} {user?.last_name}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {user?.role === 'professor' ? 'Professor' : 'Student'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'courses', name: 'My Courses', count: courses.length },
              { id: 'sessions', name: 'Sessions', count: sessions.length },
              { id: 'analytics', name: 'Analytics', count: null }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
                {tab.count !== null && (
                  <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => setError(null)}
                    className="bg-red-50 px-2 py-1.5 rounded-md text-sm font-medium text-red-800 hover:bg-red-100"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'courses' && (
            <CourseList
              courses={courses}
              onCourseSelect={handleCourseSelect}
              onCreateCourse={handleCreateCourse}
              selectedCourse={selectedCourse}
            />
          )}

          {activeTab === 'sessions' && selectedCourse && (
            <SessionManager
              course={selectedCourse}
              sessions={sessions}
              onCreateSession={handleCreateSession}
            />
          )}

          {activeTab === 'analytics' && selectedCourse && (
            <AttendanceAnalytics courseId={selectedCourse.id} />
          )}

          {activeTab === 'sessions' && !selectedCourse && (
            <Card className="p-8 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Course Selected
              </h3>
              <p className="text-gray-600 mb-4">
                Please select a course from the Courses tab to manage sessions.
              </p>
              <Button
                onClick={() => setActiveTab('courses')}
                variant="primary"
              >
                Go to Courses
              </Button>
            </Card>
          )}

          {activeTab === 'analytics' && !selectedCourse && (
            <Card className="p-8 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Course Selected
              </h3>
              <p className="text-gray-600 mb-4">
                Please select a course from the Courses tab to view analytics.
              </p>
              <Button
                onClick={() => setActiveTab('courses')}
                variant="primary"
              >
                Go to Courses
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
