import { useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { StudentAttendanceService, AttendanceRecord, AttendanceStats } from '@/lib/student-attendance-service';

interface UseStudentAttendanceReturn {
  attendanceRecords: AttendanceRecord[];
  stats: AttendanceStats;
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

export function useStudentAttendance(user: User | null): UseStudentAttendanceReturn {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats>({
    totalClasses: 0,
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    attendanceRate: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      setError('User not authenticated.');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔍 useStudentAttendance: Fetching attendance data for user:', user.id);
      
      const [records, attendanceStats] = await Promise.all([
        StudentAttendanceService.getStudentAttendanceRecords(user.id),
        StudentAttendanceService.getStudentAttendanceStats(user.id)
      ]);
      
      setAttendanceRecords(records);
      setStats(attendanceStats);
      
      console.log('🔍 useStudentAttendance: Data fetched successfully:', { records: records.length, stats: attendanceStats });
    } catch (err) {
      console.error('Failed to fetch student attendance:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setAttendanceRecords([]);
      setStats({
        totalClasses: 0,
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
        attendanceRate: 0
      });
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const refreshData = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    attendanceRecords,
    stats,
    isLoading,
    error,
    refreshData
  };
}
