'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/providers';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { QRCodeScanner } from '@/components/qr-code-scanner';
import { AttendanceHistory } from '@/components/attendance-history';
import { Course, ClassSession, AttendanceRecord } from '@/types';

export function StudentScanner() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'scan' | 'history'>('scan');
  const [courses, setCourses] = useState<Course[]>([]);
  const [currentSession, setCurrentSession] = useState<ClassSession | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    fetchStudentCourses();
  }, []);

  const fetchStudentCourses = async () => {
    try {
      setIsLoading(true);
      // In a real implementation, this would fetch courses the student is enrolled in
      // For now, we'll show a placeholder
      setCourses([]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQRScan = async (qrData: string) => {
    try {
      setIsScanning(true);
      setError(null);

      const qrCodeData = JSON.parse(qrData);
      
      // Validate QR code
      const response = await fetch(`/api/sessions/${qrCodeData.sessionId}/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` // In real app, get from auth context
        },
        body: JSON.stringify({
          qr_data: qrCodeData,
          location: await getCurrentLocation()
        })
      });

      const data = await response.json();

      if (data.success) {
        setScanResult(`Attendance marked as ${data.data.status}!`);
        // Refresh attendance history
        fetchAttendanceHistory();
      } else {
        throw new Error(data.error || 'Failed to process QR code');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsScanning(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        });
      });

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp
      };
    } catch (error) {
      console.warn('Could not get location:', error);
      return null;
    }
  };

  const fetchAttendanceHistory = async () => {
    try {
      // In a real implementation, this would fetch the student's attendance history
      setAttendanceHistory([]);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading scanner..." />
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
              <h1 className="text-2xl font-bold text-gray-900">FSAS Scanner</h1>
              <p className="text-sm text-gray-600">
                Welcome, {user?.first_name} {user?.last_name}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Student ID: {user?.student_id}
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
              { id: 'scan', name: 'Scan QR Code' },
              { id: 'history', name: 'Attendance History' }
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

        {/* Success Message */}
        {scanResult && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Success!</h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>{scanResult}</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => setScanResult(null)}
                    className="bg-green-50 px-2 py-1.5 rounded-md text-sm font-medium text-green-800 hover:bg-green-100"
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
          {activeTab === 'scan' && (
            <div className="max-w-2xl mx-auto">
              <Card className="p-6">
                <CardHeader>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Scan QR Code
                  </h2>
                  <p className="text-sm text-gray-600">
                    Point your camera at the QR code displayed in class to mark your attendance.
                  </p>
                </CardHeader>
                <CardContent>
                  <QRCodeScanner
                    onScan={handleQRScan}
                    isScanning={isScanning}
                    disabled={isScanning}
                  />
                </CardContent>
              </Card>

              {/* Instructions */}
              <Card className="mt-6 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  How to Use
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                        1
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-gray-700">
                        Make sure you're in the classroom and location services are enabled.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                        2
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-gray-700">
                        Point your camera at the QR code displayed by your professor.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                        3
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-gray-700">
                        Wait for confirmation that your attendance has been recorded.
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'history' && (
            <AttendanceHistory
              attendanceHistory={attendanceHistory}
              isLoading={isLoading}
            />
          )}
        </div>
      </div>
    </div>
  );
}
