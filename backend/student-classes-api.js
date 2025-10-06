const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

// Create Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Get classes for a specific student
 * GET /api/students/:studentId/classes
 */
router.get('/api/students/:studentId/classes', async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Get student's enrollments with class details
    const { data: enrollments, error: enrollmentError } = await supabase
      .from('enrollments')
      .select(`
        *,
        classes!inner(
          code,
          name,
          description,
          credits,
          room_location,
          schedule_info,
          max_students
        ),
        academic_periods!inner(
          name,
          year,
          semester
        ),
        professors!inner(
          users!inner(
            first_name,
            last_name,
            email
          )
        )
      `)
      .eq('student_id', studentId)
      .eq('status', 'active');
    
    if (enrollmentError) {
      console.error('❌ Error fetching student classes:', enrollmentError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch student classes'
      });
    }
    
    // Get attendance statistics for each class
    const classesWithStats = await Promise.all(
      enrollments.map(async (enrollment) => {
        const classData = enrollment.classes;
        
        // Get class instance details separately
        const { data: classInstance, error: classInstanceError } = await supabase
          .from('class_instances')
          .select('room_location, schedule_info, max_students, current_enrollment, days_of_week, start_time, end_time')
          .eq('id', enrollment.class_instance_id)
          .single();
        
        // Get schedule information from class_sessions if available
        const { data: sessions, error: sessionsError } = await supabase
          .from('class_sessions')
          .select('start_time, end_time, room_location')
          .eq('class_instance_id', enrollment.class_instance_id)
          .limit(1);
        
        // Get attendance records for this student in this class
        const { data: attendanceRecords, error: attendanceError } = await supabase
          .from('attendance_records')
          .select(`
            status,
            class_sessions!inner(
              class_instance_id
            )
          `)
          .eq('student_id', studentId)
          .eq('class_sessions.class_instance_id', enrollment.class_instance_id);
        
        let attendanceRate = 0;
        let attendedSessions = 0;
        let totalSessionsWithAttendance = 0;
        
        // Get all completed sessions where professor took attendance
        const { data: completedSessions, error: completedSessionsError } = await supabase
          .from('class_sessions')
          .select('id, status, attendance_count')
          .eq('class_instance_id', enrollment.class_instance_id)
          .eq('status', 'completed')
          .gt('attendance_count', 0);
        
        if (!completedSessionsError && completedSessions) {
          // Count sessions where professor took attendance
          totalSessionsWithAttendance = completedSessions.length;
          // Count sessions where student was present, late, or excused
          attendedSessions = attendanceRecords ? attendanceRecords.filter(record => 
            record.status === 'present' || record.status === 'late' || record.status === 'excused'
          ).length : 0;
          // Calculate attendance rate based on sessions where professor took attendance
          attendanceRate = totalSessionsWithAttendance > 0 ? Math.round((attendedSessions / totalSessionsWithAttendance) * 100) : 0;
        }
        
        // Get total sessions for this class instance (for display purposes)
        const { data: totalSessionsData, error: totalSessionsError } = await supabase
          .from('class_sessions')
          .select('id')
          .eq('class_instance_id', enrollment.class_instance_id);
        
        const actualTotalSessions = totalSessionsData?.length || 0;
        
        // Use class instance data if available, otherwise fall back to class data
        let roomLocation = 'TBD';
        if (classInstance?.room_location) {
          roomLocation = classInstance.room_location;
        } else if (sessions && sessions.length > 0 && sessions[0].room_location) {
          roomLocation = sessions[0].room_location;
        } else if (classData.room_location) {
          roomLocation = classData.room_location;
        }
        
                let scheduleInfo = `${enrollment.academic_periods.semester} ${enrollment.academic_periods.year}`;
                if (classInstance?.schedule_info) {
                  scheduleInfo = classInstance.schedule_info;
                } else if (classInstance?.days_of_week && classInstance?.start_time && classInstance?.end_time) {
                  // Build schedule from days_of_week, start_time, end_time
                  const days = Array.isArray(classInstance.days_of_week) ? classInstance.days_of_week.join('') : classInstance.days_of_week;
                  scheduleInfo = `${days} ${classInstance.start_time}-${classInstance.end_time}`;
                } else if (sessions && sessions.length > 0 && sessions[0].start_time && sessions[0].end_time) {
                  // Convert 24-hour to 12-hour format for consistency
                  const startTime = sessions[0].start_time;
                  const endTime = sessions[0].end_time;
                  const startHour = parseInt(startTime.split(':')[0]);
                  const startMin = startTime.split(':')[1];
                  const endHour = parseInt(endTime.split(':')[0]);
                  const endMin = endTime.split(':')[1];
                  
                  const startPeriod = startHour >= 12 ? 'PM' : 'AM';
                  const endPeriod = endHour >= 12 ? 'PM' : 'AM';
                  const startHour12 = startHour > 12 ? startHour - 12 : startHour === 0 ? 12 : startHour;
                  const endHour12 = endHour > 12 ? endHour - 12 : endHour === 0 ? 12 : endHour;
                  
                  scheduleInfo = `Mon/Wed ${startHour12}:${startMin} ${startPeriod} - ${endHour12}:${endMin} ${endPeriod}`;
                } else if (classData.schedule_info) {
                  scheduleInfo = classData.schedule_info;
                }
        
        const maxStudents = classInstance?.max_students || classData.max_students;
        const currentEnrollment = classInstance?.current_enrollment || 0;
        
        return {
          id: enrollment.class_instance_id,
          class_id: enrollment.class_id, // Add class_id for detailed view
          class_code: classData.code,
          class_name: classData.name,
          description: classData.description,
          credits: classData.credits,
          professor: `${enrollment.professors.users.first_name} ${enrollment.professors.users.last_name}`,
          professor_email: enrollment.professors.users.email,
          room: roomLocation,
          schedule: scheduleInfo,
          academic_period: enrollment.academic_periods.name,
          enrollment_date: enrollment.enrollment_date,
          attendance_rate: attendanceRate,
          total_sessions: totalSessionsWithAttendance,
          attended_sessions: attendedSessions,
          max_students: maxStudents,
          current_enrollment: currentEnrollment
        };
      })
    );
    
    res.json({
      success: true,
      classes: classesWithStats,
      count: classesWithStats.length
    });
    
  } catch (error) {
    console.error('❌ Error in /api/students/:studentId/classes:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Get class statistics for a student
 * GET /api/students/:studentId/classes/stats
 */
router.get('/api/students/:studentId/classes/stats', async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Get basic enrollment count
    const { data: enrollments, error: enrollmentError } = await supabase
      .from('enrollments')
      .select(`
        *,
        class_instances!inner(
          id,
          is_active
        )
      `)
      .eq('student_id', studentId)
      .eq('status', 'active')
      .eq('class_instances.is_active', true);
    
    if (enrollmentError) {
      console.error('❌ Error fetching enrollment stats:', enrollmentError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch enrollment statistics'
      });
    }
    
    const totalClasses = enrollments.length;
    
    // Calculate average attendance across all classes
    let totalAttendanceRate = 0;
    let classesWithAttendance = 0;
    
    for (const enrollment of enrollments) {
      const { data: attendanceRecords } = await supabase
        .from('attendance_records')
        .select(`
          status,
          class_sessions!inner(
            class_instance_id
          )
        `)
        .eq('student_id', studentId)
        .eq('class_sessions.class_instance_id', enrollment.class_instances.id);
      
      if (attendanceRecords && attendanceRecords.length > 0) {
        const attendedSessions = attendanceRecords.filter(record => 
          record.status === 'present' || record.status === 'late'
        ).length;
        const attendanceRate = Math.round((attendedSessions / attendanceRecords.length) * 100);
        totalAttendanceRate += attendanceRate;
        classesWithAttendance++;
      }
    }
    
    const averageAttendance = classesWithAttendance > 0 
      ? Math.round(totalAttendanceRate / classesWithAttendance) 
      : 0;
    
    // Get today's classes (simplified - just count active enrollments)
    const upcomingClasses = totalClasses; // For now, just show total active classes
    
    res.json({
      success: true,
      stats: {
        totalClasses,
        averageAttendance,
        favoriteClasses: 0, // Not implemented
        upcomingClasses
      }
    });
    
  } catch (error) {
    console.error('❌ Error in /api/students/:studentId/classes/stats:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;
