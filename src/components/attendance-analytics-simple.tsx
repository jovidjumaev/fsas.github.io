'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { TrendingUp, Users, Calendar, Download, Clock } from 'lucide-react';

interface AttendanceAnalyticsProps {
  courseId: string;
}

interface AnalyticsData {
  total_sessions: number;
  total_students: number;
  attendance_rate: number;
  average_late_rate: number;
  attendance_trend: Array<{
    date: string;
    attendance_rate: number;
    present_count: number;
    late_count: number;
    absent_count: number;
  }>;
  student_performance: Array<{
    student_id: string;
    student_name: string;
    attendance_rate: number;
    total_present: number;
    total_late: number;
    total_absent: number;
    last_attended: string;
  }>;
}

export function AttendanceAnalytics({ courseId }: AttendanceAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'semester'>('month');

  useEffect(() => {
    fetchAnalytics();
  }, [courseId, timeRange]);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Mock data for now
      const mockData: AnalyticsData = {
        total_sessions: 15,
        total_students: 25,
        attendance_rate: 87.5,
        average_late_rate: 12.3,
        attendance_trend: [
          { date: '2024-09-15', attendance_rate: 85, present_count: 20, late_count: 3, absent_count: 2 },
          { date: '2024-09-16', attendance_rate: 90, present_count: 22, late_count: 1, absent_count: 2 },
          { date: '2024-09-17', attendance_rate: 88, present_count: 21, late_count: 2, absent_count: 2 },
          { date: '2024-09-18', attendance_rate: 92, present_count: 23, late_count: 1, absent_count: 1 },
          { date: '2024-09-19', attendance_rate: 85, present_count: 20, late_count: 3, absent_count: 2 },
        ],
        student_performance: [
          { student_id: 'STU001', student_name: 'John Doe', attendance_rate: 95, total_present: 14, total_late: 1, total_absent: 0, last_attended: '2024-09-19' },
          { student_id: 'STU002', student_name: 'Jane Smith', attendance_rate: 87, total_present: 13, total_late: 2, total_absent: 0, last_attended: '2024-09-19' },
          { student_id: 'STU003', student_name: 'Bob Johnson', attendance_rate: 80, total_present: 12, total_late: 2, total_absent: 1, last_attended: '2024-09-18' },
        ]
      };
      
      setAnalytics(mockData);
    } catch (err) {
      setError('Failed to fetch analytics data');
      console.error('Analytics fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const exportData = () => {
    if (!analytics) return;
    
    const csvContent = [
      ['Date', 'Attendance Rate', 'Present', 'Late', 'Absent'],
      ...analytics.attendance_trend.map(day => [
        day.date,
        `${day.attendance_rate}%`,
        day.present_count.toString(),
        day.late_count.toString(),
        day.absent_count.toString()
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-analytics-${courseId}-${timeRange}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={fetchAnalytics} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Attendance Analytics</h2>
          <p className="text-gray-600">Course ID: {courseId}</p>
        </div>
        <div className="flex gap-2">
          <select
            value={timeRange}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTimeRange(e.target.value as 'week' | 'month' | 'semester')}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="semester">This Semester</option>
          </select>
          <Button onClick={exportData} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.total_sessions}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.total_students}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.attendance_rate}%</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Late Rate</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.average_late_rate}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Attendance Trend Table */}
      <Card className="p-6">
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Attendance Trend</h3>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Present</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Late</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Absent</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analytics.attendance_trend.map((day, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{day.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{day.attendance_rate}%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">{day.present_count}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">{day.late_count}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">{day.absent_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Student Performance */}
      <Card className="p-6">
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Student Performance</h3>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Present</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Late</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Absent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Attended</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analytics.student_performance.map((student, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.student_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.attendance_rate}%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">{student.total_present}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">{student.total_late}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">{student.total_absent}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.last_attended}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
