'use client';

import * as React from 'react';

interface AttendanceAnalyticsProps {
  courseId: string;
}

export function AttendanceAnalytics({ courseId }: AttendanceAnalyticsProps) {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Attendance Analytics</h2>
      <p className="text-gray-600">Course ID: {courseId}</p>
      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <p className="text-blue-800">Analytics data will be displayed here once the database is set up.</p>
      </div>
    </div>
  );
}