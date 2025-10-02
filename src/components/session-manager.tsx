'use client';

import { useState } from 'react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ClassSession, CreateSessionForm } from '@/types';
import { Plus, Play, Pause, Users, Clock, QrCode } from 'lucide-react';
import { format } from 'date-fns';

interface SessionManagerProps {
  course: any; // Course type
  sessions: ClassSession[];
  onCreateSession: (sessionData: CreateSessionForm) => void;
}

export function SessionManager({ course, sessions, onCreateSession }: SessionManagerProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<CreateSessionForm>({
    course_id: course.id,
    session_date: format(new Date(), 'yyyy-MM-dd'),
    start_time: '09:00',
    end_time: '10:30'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSession, setActiveSession] = useState<ClassSession | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onCreateSession(formData);
      setFormData({
        course_id: course.id,
        session_date: format(new Date(), 'yyyy-MM-dd'),
        start_time: '09:00',
        end_time: '10:30'
      });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating session:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const startSession = async (session: ClassSession) => {
    try {
      // In a real implementation, this would start the session and generate QR code
      setActiveSession(session);
    } catch (error) {
      console.error('Error starting session:', error);
    }
  };

  const stopSession = async (session: ClassSession) => {
    try {
      // In a real implementation, this would stop the session
      setActiveSession(null);
    } catch (error) {
      console.error('Error stopping session:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {course.course_code} - Sessions
          </h2>
          <p className="text-gray-600">{course.course_name}</p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          variant="primary"
          className="flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Session</span>
        </Button>
      </div>

      {/* Create Session Form */}
      {showCreateForm && (
        <Card className="p-6">
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Create New Session</h3>
          </CardHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="session_date" className="block text-sm font-medium text-gray-700">
                  Session Date
                </label>
                <Input
                  id="session_date"
                  type="date"
                  value={formData.session_date}
                  onChange={(value) => handleInputChange('session_date', value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="start_time" className="block text-sm font-medium text-gray-700">
                  Start Time
                </label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(value) => handleInputChange('start_time', value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="end_time" className="block text-sm font-medium text-gray-700">
                  End Time
                </label>
                <Input
                  id="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={(value) => handleInputChange('end_time', value)}
                  required
                />
              </div>
            </div>

            <CardFooter className="px-0 pt-4">
              <div className="flex space-x-3">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create Session'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardFooter>
          </form>
        </Card>
      )}

      {/* Active Session */}
      {activeSession && (
        <Card className="p-6 border-green-200 bg-green-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-green-900">
                  Active Session
                </h3>
                <p className="text-green-700">
                  {format(new Date(activeSession.session_date), 'EEEE, MMMM d, yyyy')} • 
                  {activeSession.start_time} - {activeSession.end_time}
                </p>
              </div>
              <Button
                onClick={() => stopSession(activeSession)}
                variant="destructive"
                className="flex items-center space-x-2"
              >
                <Pause className="w-4 h-4" />
                <span>Stop Session</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-white p-4 rounded-lg border">
              <div className="text-center">
                <QrCode className="w-32 h-32 mx-auto mb-4 text-gray-400" />
                <p className="text-sm text-gray-600 mb-2">
                  QR Code is being displayed to students
                </p>
                <p className="text-xs text-gray-500">
                  Students can scan this code to mark attendance
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sessions List */}
      {sessions.length === 0 ? (
        <Card className="p-8 text-center">
          <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Sessions Yet
          </h3>
          <p className="text-gray-600 mb-4">
            Create your first session to start taking attendance.
          </p>
          <Button
            onClick={() => setShowCreateForm(true)}
            variant="primary"
          >
            Create Session
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Session History</h3>
          <div className="grid grid-cols-1 gap-4">
            {sessions.map((session) => (
              <Card
                key={session.id}
                className={`${
                  activeSession?.id === session.id
                    ? 'border-green-200 bg-green-50'
                    : 'hover:border-gray-300'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">
                            {format(new Date(session.session_date), 'EEEE, MMMM d, yyyy')}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {session.start_time} - {session.end_time}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            session.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {session.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {session.is_active ? (
                        <Button
                          onClick={() => stopSession(session)}
                          variant="destructive"
                          size="sm"
                          className="flex items-center space-x-1"
                        >
                          <Pause className="w-4 h-4" />
                          <span>Stop</span>
                        </Button>
                      ) : (
                        <Button
                          onClick={() => startSession(session)}
                          variant="primary"
                          size="sm"
                          className="flex items-center space-x-1"
                        >
                          <Play className="w-4 h-4" />
                          <span>Start</span>
                        </Button>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center space-x-1"
                      >
                        <Users className="w-4 h-4" />
                        <span>View Attendance</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
