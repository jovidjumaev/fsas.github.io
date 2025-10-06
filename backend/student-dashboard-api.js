const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Get dashboard data for a specific student
router.get('/api/students/:studentId/dashboard', async (req, res) => {
  try {
    const { studentId } = req.params;
    console.log('🔍 Dashboard API: Getting dashboard data for student:', studentId);

    // Get student data with user info in one query (like the students API)
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select(`
        student_id,
        enrollment_year,
        major,
        graduation_year,
        created_at,
        users!inner(
          first_name,
          last_name,
          email,
          created_at
        )
      `)
      .eq('user_id', studentId)
      .single();

    console.log('🔍 Dashboard API: Student data:', studentData);
    console.log('🔍 Dashboard API: Student error:', studentError);

    if (studentError) {
      console.error('❌ Error fetching student data:', studentError);
      return res.status(500).json({ error: 'Failed to fetch student data' });
    }

    // Get today's classes
    const today = new Date().toISOString().split('T')[0];
    const { data: todayClasses, error: classesError } = await supabase
      .from('class_sessions')
      .select(`
        id,
        session_number,
        date,
        start_time,
        end_time,
        room_location,
        status,
        class_instances!inner(
          classes!inner(
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
      `)
      .eq('date', today)
      .in('class_instances.classes.professors.user_id', [studentId]) // This should be enrollments, not professors
      .order('start_time');

    // Fix the query - get classes where student is enrolled
    const { data: enrollments, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('class_instance_id')
      .eq('student_id', studentId);

    if (enrollmentError) {
      console.error('❌ Error fetching enrollments:', enrollmentError);
      return res.status(500).json({ error: 'Failed to fetch enrollments' });
    }

    const classInstanceIds = enrollments.map(e => e.class_instance_id);

    const { data: todayClassesCorrected, error: classesErrorCorrected } = await supabase
      .from('class_sessions')
      .select(`
        id,
        session_number,
        date,
        start_time,
        end_time,
        room_location,
        status,
        class_instances!inner(
          classes!inner(
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
      `)
      .eq('date', today)
      .in('class_instance_id', classInstanceIds)
      .order('start_time');

    // Get attendance stats
    const { data: attendanceRecords, error: attendanceError } = await supabase
      .from('attendance_records')
      .select(`
        status,
        class_sessions!inner(
          class_instance_id,
          date
        )
      `)
      .eq('student_id', studentId);

    if (attendanceError) {
      console.error('❌ Error fetching attendance records:', attendanceError);
      return res.status(500).json({ error: 'Failed to fetch attendance records' });
    }

    // Calculate stats
    const totalClasses = attendanceRecords.length;
    const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
    const lateCount = attendanceRecords.filter(r => r.status === 'late').length;
    const excusedCount = attendanceRecords.filter(r => r.status === 'excused').length;
    const attendedCount = presentCount + lateCount + excusedCount;
    const overallAttendance = totalClasses > 0 ? Math.round((attendedCount / totalClasses) * 100) : 0;

    // Transform today's classes
    const transformedTodayClasses = (todayClassesCorrected || []).map(session => {
      const classData = session.class_instances.classes;
      const professor = classData.professors.users;
      
      // Format time
      const startTime = formatTime(session.start_time);
      const endTime = formatTime(session.end_time);
      const timeString = `${startTime} - ${endTime}`;

      // Determine status
      let status = 'upcoming';
      const now = new Date();
      const sessionStart = new Date(`${session.date}T${session.start_time}`);
      const sessionEnd = new Date(`${session.date}T${session.end_time}`);
      
      if (now >= sessionStart && now <= sessionEnd) {
        status = 'ongoing';
      } else if (now > sessionEnd) {
        status = 'completed';
      }

      return {
        id: session.id,
        class_code: classData.code,
        class_name: classData.name,
        time: timeString,
        room: session.room_location || 'TBD',
        professor: `${professor.first_name} ${professor.last_name}`,
        status
      };
    });

    const response = {
      success: true,
      studentData: studentData ? {
        student_id: studentData.student_id,
        student_number: studentData.student_id, // Use student_id as student_number
        enrollment_year: studentData.enrollment_year,
        major: studentData.major,
        graduation_year: studentData.graduation_year,
        first_name: studentData.users.first_name,
        last_name: studentData.users.last_name,
        email: studentData.users.email,
        phone: null, // Phone field doesn't exist in database
        is_active: true,
        account_created: studentData.users.created_at
      } : null,
      todayClasses: transformedTodayClasses,
      stats: {
        overallAttendance,
        totalClasses,
        classesToday: transformedTodayClasses.length,
        attendanceStreak: 0 // TODO: Calculate actual streak
      }
    };

    console.log('🔍 Dashboard API: Response:', response);
    res.json(response);
  } catch (error) {
    console.error('❌ Dashboard API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to format time
function formatTime(timeString) {
  const [hourString, minuteString] = timeString.split(':');
  const hour = parseInt(hourString, 10);
  const minute = parseInt(minuteString, 10);
  
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  
  return `${hour12}:${minute.toString().padStart(2, '0')} ${period}`;
}

module.exports = router;
