import { supabase } from './supabase';

export interface AttendanceRecord {
  id: string;
  class_code: string;
  class_name: string;
  professor: string;
  room: string;
  date: string;
  time: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  scanned_at?: string;
  minutes_late?: number;
}

export interface AttendanceStats {
  totalClasses: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  attendanceRate: number;
}

export class StudentAttendanceService {
  /**
   * Get all attendance records for a student
   */
  static async getStudentAttendanceRecords(userId: string): Promise<AttendanceRecord[]> {
    try {
      console.log('🔍 StudentAttendanceService: Getting attendance records for user:', userId);
      
      // Get all attendance records for this student with class and session details
      const { data: attendanceRecords, error } = await supabase
        .from('attendance_records')
        .select(`
          id,
          status,
          scanned_at,
          minutes_late,
          class_sessions!inner(
            id,
            session_number,
            date,
            start_time,
            end_time,
            room_location,
            class_instances!inner(
              id,
              classes!inner(
                id,
                code,
                name,
                professors!inner(
                  users!inner(
                    first_name,
                    last_name
                  )
                )
              )
            )
          )
        `)
        .eq('student_id', userId)
        .order('class_sessions.date', { ascending: false });

      if (error) {
        console.error('❌ Error fetching attendance records:', error);
        throw new Error('Failed to fetch attendance records');
      }

      console.log('🔍 StudentAttendanceService: Raw attendance records:', attendanceRecords);

      // Transform the data to match the expected interface
      const transformedRecords: AttendanceRecord[] = attendanceRecords.map(record => {
        const session = record.class_sessions;
        const classInstance = session.class_instances;
        const classData = classInstance.classes;
        const professor = classData.professors.users;

        // Format time
        const startTime = this.formatTime(session.start_time);
        const endTime = this.formatTime(session.end_time);
        const timeString = `${startTime} - ${endTime}`;

        return {
          id: record.id,
          class_code: classData.code,
          class_name: classData.name,
          professor: `${professor.first_name} ${professor.last_name}`,
          room: session.room_location || 'TBD',
          date: session.date,
          time: timeString,
          status: record.status as 'present' | 'absent' | 'late' | 'excused',
          scanned_at: record.scanned_at,
          minutes_late: record.minutes_late
        };
      });

      console.log('🔍 StudentAttendanceService: Transformed records:', transformedRecords);
      return transformedRecords;
    } catch (error) {
      console.error('Error fetching student attendance records:', error);
      throw error;
    }
  }

  /**
   * Get attendance statistics for a student
   */
  static async getStudentAttendanceStats(userId: string): Promise<AttendanceStats> {
    try {
      const records = await this.getStudentAttendanceRecords(userId);
      
      const totalClasses = records.length;
      const present = records.filter(r => r.status === 'present').length;
      const absent = records.filter(r => r.status === 'absent').length;
      const late = records.filter(r => r.status === 'late').length;
      const excused = records.filter(r => r.status === 'excused').length;
      
      // Calculate attendance rate (present + late + excused count as attended)
      const attended = present + late + excused;
      const attendanceRate = totalClasses > 0 ? Math.round((attended / totalClasses) * 100) : 0;

      return {
        totalClasses,
        present,
        absent,
        late,
        excused,
        attendanceRate
      };
    } catch (error) {
      console.error('Error fetching student attendance stats:', error);
      throw error;
    }
  }

  /**
   * Format time from 24-hour to 12-hour format
   */
  private static formatTime(timeString: string): string {
    const [hourString, minuteString] = timeString.split(':');
    const hour = parseInt(hourString, 10);
    const minute = parseInt(minuteString, 10);
    
    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    
    return `${hour12}:${minute.toString().padStart(2, '0')} ${period}`;
  }
}
