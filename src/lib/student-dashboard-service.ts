import { supabase } from './supabase';

export interface StudentData {
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

export interface ClassSession {
  id: string;
  class_code: string;
  class_name: string;
  time: string;
  room: string;
  professor: string;
  status: 'upcoming' | 'ongoing' | 'completed';
}

export interface AttendanceRecord {
  date: string;
  status: 'present' | 'absent' | 'late';
  class_name: string;
}

export interface AttendanceStats {
  overallAttendance: number;
  totalClasses: number;
  classesToday: number;
  attendanceStreak: number;
}

export class StudentDashboardService {
  static async getStudentData(userId: string): Promise<StudentData | null> {
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          student_id,
          student_number,
          enrollment_year,
          major,
          graduation_year,
          users!inner(
            first_name,
            last_name,
            email,
            phone,
            is_active,
            created_at
          )
        `)
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching student data:', error);
        return null;
      }

      return {
        student_id: data.student_id,
        student_number: data.student_number,
        enrollment_year: data.enrollment_year,
        major: data.major,
        graduation_year: data.graduation_year,
        first_name: data.users.first_name,
        last_name: data.users.last_name,
        email: data.users.email,
        phone: data.users.phone || '',
        is_active: data.users.is_active,
        account_created: data.users.created_at
      };
    } catch (error) {
      console.error('Error in getStudentData:', error);
      return null;
    }
  }

  static async getTodayClasses(userId: string): Promise<ClassSession[]> {
    try {
      console.log('🔍 getTodayClasses: Starting for user:', userId);
      
      // Get today's date and day of week
      const today = new Date();
      const todayString = today.toISOString().split('T')[0]; // YYYY-MM-DD
      const dayOfWeek = today.getDay(); // 0=Sunday, 1=Monday, 2=Tuesday, etc.
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const todayName = dayNames[dayOfWeek];
      
      console.log('🔍 getTodayClasses: Today is', todayName, todayString);

      // Get the student's enrolled classes
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/students/${userId}/classes`);
      const classesData = await response.json();
      
      if (!classesData.success) {
        console.error('Failed to fetch student classes for today classes');
        return [];
      }

      console.log('🔍 getTodayClasses: Got classes data:', classesData);

      // Filter classes that actually meet today
      const todayClasses: ClassSession[] = [];
      
      for (const cls of classesData.classes) {
        const schedule = cls.schedule || '';
        console.log('🔍 Checking class', cls.class_code, 'with schedule:', schedule);
        
        // Check if this class meets today based on schedule
        let meetsToday = false;
        
        if (schedule.includes('Mon/Wed') && (todayName === 'Monday' || todayName === 'Wednesday')) {
          meetsToday = true;
        } else if (schedule.includes('TTh') && (todayName === 'Tuesday' || todayName === 'Thursday')) {
          meetsToday = true;
        } else if (schedule.includes('Mon') && todayName === 'Monday') {
          meetsToday = true;
        } else if (schedule.includes('Tue') && todayName === 'Tuesday') {
          meetsToday = true;
        } else if (schedule.includes('Wed') && todayName === 'Wednesday') {
          meetsToday = true;
        } else if (schedule.includes('Thu') && todayName === 'Thursday') {
          meetsToday = true;
        } else if (schedule.includes('Fri') && todayName === 'Friday') {
          meetsToday = true;
        }
        
        if (meetsToday) {
          console.log('✅ Class', cls.class_code, 'meets today!');
          todayClasses.push({
            id: cls.class_id || cls.id,
            class_code: cls.class_code,
            class_name: cls.class_name,
            time: cls.schedule || 'TBD',
            room: cls.room || 'TBD',
            professor: cls.professor || 'TBD',
            status: 'upcoming' as const
          });
        } else {
          console.log('❌ Class', cls.class_code, 'does not meet today');
        }
      }

      console.log('🔍 getTodayClasses: Found', todayClasses.length, 'classes for today:', todayClasses);
      return todayClasses;
    } catch (error) {
      console.error('Error in getTodayClasses:', error);
      return [];
    }
  }

  static async getRecentAttendance(userId: string, limit: number = 6): Promise<AttendanceRecord[]> {
    try {
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance_records')
        .select(`
          date,
          status,
          class_sessions!inner(class_name)
        `)
        .eq('student_id', userId)
        .order('date', { ascending: false })
        .limit(limit);

      if (attendanceError) {
        console.error('Error fetching attendance:', attendanceError);
        return [];
      }

      return attendanceData.map(record => ({
        date: record.date,
        status: record.status as 'present' | 'absent' | 'late',
        class_name: record.class_sessions.class_name
      }));
    } catch (error) {
      console.error('Error in getRecentAttendance:', error);
      return [];
    }
  }

  static async getAttendanceStats(userId: string): Promise<AttendanceStats> {
    try {
      // Get today's classes count
      const todayClasses = await this.getTodayClasses(userId);
      
      // Get overall stats from database function
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_student_attendance_stats', { student_id_param: userId });

      if (statsError) {
        console.error('Error fetching stats:', statsError);
        return {
          overallAttendance: 0,
          totalClasses: 0,
          classesToday: todayClasses.length,
          attendanceStreak: 0
        };
      }

      const stats = statsData[0] || {};
      
      return {
        overallAttendance: Math.round(stats.overall_attendance || 0),
        totalClasses: stats.total_classes || 0,
        classesToday: todayClasses.length,
        attendanceStreak: stats.attendance_streak || 0
      };
    } catch (error) {
      console.error('Error in getAttendanceStats:', error);
      return {
        overallAttendance: 0,
        totalClasses: 0,
        classesToday: 0,
        attendanceStreak: 0
      };
    }
  }

  static async getAllDashboardData(userId: string) {
    try {
      console.log('🔍 getAllDashboardData: Starting for user:', userId);
      
      // Use the working student classes API to get real data
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/students/${userId}/classes`);
      const classesData = await response.json();
      
      if (!classesData.success) {
        throw new Error('Failed to fetch student classes');
      }

      console.log('🔍 getAllDashboardData: Got classes data:', classesData);

      // Get student data from the classes response
      const studentData = await this.getStudentData(userId);
      
      // Calculate real stats from classes data
      const totalClasses = classesData.classes.length;
      const totalSessions = classesData.classes.reduce((sum: number, cls: any) => sum + cls.total_sessions, 0);
      const attendedSessions = classesData.classes.reduce((sum: number, cls: any) => sum + cls.attended_sessions, 0);
      const overallAttendance = totalSessions > 0 ? Math.round((attendedSessions / totalSessions) * 100) : 0;

      // Get today's classes with real data
      const todayClasses = await this.getTodayClasses(userId);

      const stats: AttendanceStats = {
        overallAttendance,
        totalClasses,
        classesToday: todayClasses.length,
        attendanceStreak: 0 // TODO: Calculate actual streak
      };

      console.log('🔍 getAllDashboardData: Returning real data with stats:', stats);
      return {
        studentData,
        todayClasses,
        recentAttendance: [], // TODO: Get recent attendance
        stats
      };
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  }

  // Helper function to format time
  private static formatTime(timeString: string): string {
    const [hourString, minuteString] = timeString.split(':');
    const hour = parseInt(hourString, 10);
    const minute = parseInt(minuteString, 10);
    
    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    
    return `${hour12}:${minute.toString().padStart(2, '0')} ${period}`;
  }
}
