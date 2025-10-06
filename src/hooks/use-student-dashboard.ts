import { useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { StudentDashboardService, StudentData, ClassSession, AttendanceRecord, AttendanceStats } from '@/lib/student-dashboard-service';

interface UseStudentDashboardReturn {
  // Data
  studentData: StudentData | null;
  todayClasses: ClassSession[];
  stats: AttendanceStats;
  userProfile: any;
  
  // Loading states
  isLoading: boolean;
  statsLoading: boolean;
  
  // Actions
  refreshData: () => Promise<void>;
  setUserProfile: (profile: any) => void;
}

export function useStudentDashboard(user: User | null): UseStudentDashboardReturn {
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [todayClasses, setTodayClasses] = useState<ClassSession[]>([]);
  const [stats, setStats] = useState<AttendanceStats>({
    overallAttendance: 0,
    totalClasses: 0,
    classesToday: 0,
    attendanceStreak: 0
  });
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    console.log('🔍 useStudentDashboard: fetchData called, user:', user);
    
    if (!user) {
      console.log('🔍 useStudentDashboard: No user, setting loading to false');
      setIsLoading(false);
      setStatsLoading(false);
      return;
    }

    try {
      console.log('🔍 useStudentDashboard: Starting to fetch dashboard data for user:', user.id);
      setIsLoading(true);
      setStatsLoading(true);

      const dashboardData = await StudentDashboardService.getAllDashboardData(user.id);
      console.log('🔍 useStudentDashboard: Got dashboard data:', dashboardData);

      // Set student data with fallback
      if (dashboardData.studentData) {
        setStudentData(dashboardData.studentData);
      } else {
        // Fallback to user metadata
        const fallbackData: StudentData = {
          student_id: user.id,
          student_number: user.user_metadata?.student_number || 'N/A',
          enrollment_year: 2024,
          major: user.user_metadata?.major || 'Computer Science',
          graduation_year: 2028,
          first_name: user.user_metadata?.first_name || 'Student',
          last_name: user.user_metadata?.last_name || 'User',
          email: user.email || '',
          phone: user.user_metadata?.phone || '',
          is_active: true,
          account_created: user.created_at || new Date().toISOString()
        };
        setStudentData(fallbackData);
      }

      setTodayClasses(dashboardData.todayClasses);
      setStats(dashboardData.stats);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set empty data on error
      setTodayClasses([]);
      setStats({
        overallAttendance: 0,
        totalClasses: 0,
        classesToday: 0,
        attendanceStreak: 0
      });
    } finally {
      setIsLoading(false);
      setStatsLoading(false);
    }
  }, [user]);

  const refreshData = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    studentData,
    todayClasses,
    stats,
    userProfile,
    isLoading,
    statsLoading,
    refreshData,
    setUserProfile
  };
}
