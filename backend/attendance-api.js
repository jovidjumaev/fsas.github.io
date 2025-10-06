const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const QRCodeGenerator = require('./qr-code-generator.js');
require('dotenv').config({ path: '.env.local' });

const router = express.Router();

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// =====================================================
// QR CODE SCANNING AND ATTENDANCE RECORDING
// =====================================================

/**
 * Process QR code scan and record attendance
 * POST /api/attendance/scan
 */
router.post('/api/attendance/scan', async (req, res) => {
  try {
    const { qrData, studentId } = req.body;
    
    console.log('📱 Processing QR code scan for student:', studentId);
    
    if (!qrData || !studentId) {
      return res.status(400).json({
        success: false,
        error: 'QR data and student ID are required'
      });
    }
    
    // Parse QR code data
    let parsedQRData;
    try {
      parsedQRData = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid QR code format'
      });
    }
    
    // Validate QR code
    const validation = QRCodeGenerator.validateQR(parsedQRData);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: validation.error || 'Invalid QR code'
      });
    }
    
    const sessionId = validation.sessionId;
    
    // Check if session exists and is active
    const { data: session, error: sessionError } = await supabase
      .from('class_sessions')
      .select(`
        *,
        class_instances!inner(
          id,
          professor_id,
          courses(code, name),
          academic_periods(name)
        )
      `)
      .eq('id', sessionId)
      .eq('status', 'active')
      .single();
    
    if (sessionError || !session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found or not active'
      });
    }
    
    // First, get the student's user_id from the student_id
    const { data: studentRecord, error: studentError } = await supabase
      .from('students')
      .select('user_id')
      .eq('student_id', studentId)
      .single();
    
    if (studentError || !studentRecord) {
      return res.status(404).json({
        success: false,
        error: 'Student record not found'
      });
    }
    
    // Check if student is enrolled in this class using user_id
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('*')
      .eq('student_id', studentRecord.user_id)
      .eq('class_instance_id', session.class_instance_id)
      .single();
    
    if (enrollmentError || !enrollment) {
      return res.status(403).json({
        success: false,
        error: 'You are not enrolled in this class'
      });
    }
    
    // Check if student has already scanned for this session
    const { data: existingAttendance, error: attendanceError } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('session_id', sessionId)
      .eq('student_id', studentRecord.user_id)
      .single();
    
    if (existingAttendance) {
      return res.status(409).json({
        success: false,
        error: 'You have already marked attendance for this session',
        attendance: {
          id: existingAttendance.id,
          scanned_at: existingAttendance.scanned_at,
          status: existingAttendance.status
        }
      });
    }
    
    // Determine if student is late (more than 5 minutes after class start time)
    // Note: This is based on the scheduled class start time, NOT when the professor started the session
    const sessionStartTime = new Date(`${session.date}T${session.start_time}`);
    const currentTime = new Date();
    const minutesLate = Math.floor((currentTime - sessionStartTime) / (1000 * 60));
    const isLate = minutesLate > 5;
    
    // Record attendance
    const { data: attendanceRecord, error: recordError } = await supabase
      .from('attendance_records')
      .insert({
        session_id: sessionId,
        student_id: studentRecord.user_id,
        scanned_at: currentTime.toISOString(),
        status: isLate ? 'late' : 'present',
        minutes_late: isLate ? minutesLate : 0,
        device_fingerprint: req.headers['user-agent'] || 'unknown',
        ip_address: req.ip || req.connection.remoteAddress
      })
      .select()
      .single();
    
    if (recordError) {
      console.error('❌ Error recording attendance:', recordError);
      return res.status(500).json({
        success: false,
        error: 'Failed to record attendance'
      });
    }
    
    // Update session attendance count
    await supabase
      .from('class_sessions')
      .update({
        attendance_count: session.attendance_count + 1
      })
      .eq('id', sessionId);
    
    console.log('✅ Attendance recorded successfully:', {
      studentId,
      sessionId,
      status: attendanceRecord.status,
      scanned_at: attendanceRecord.scanned_at
    });
    
    // Emit real-time update to professor
    if (global.io) {
      const professorId = session.class_instances.professor_id;
      
      // Get current attendance count for this session
      const { data: attendanceRecords } = await supabase
        .from('attendance_records')
        .select('status')
        .eq('session_id', sessionId);
      
      const attendedCount = attendanceRecords ? 
        attendanceRecords.filter(a => ['present', 'late', 'excused'].includes(a.status)).length : 0;
      const totalStudents = attendanceRecords ? attendanceRecords.length : 0;
      const attendanceRate = totalStudents > 0 ? Math.round((attendedCount / totalStudents) * 100) : 0;
      
      // Broadcast to session room
      global.io.to(`session-${sessionId}`).emit('attendance_update', {
        sessionId,
        studentId,
        status: attendanceRecord.status,
        scanned_at: attendanceRecord.scanned_at,
        attendanceCount: attendedCount,
        totalStudents,
        attendanceRate
      });
      
      // Broadcast to professor dashboard
      global.io.to(`professor-${professorId}`).emit('dashboard-attendance-update', {
        sessionId,
        attendanceCount: attendedCount,
        totalStudents,
        attendanceRate,
        timestamp: new Date().toISOString()
      });
      
      console.log('📡 Real-time attendance update emitted to session room and professor dashboard');
    }
    
    res.json({
      success: true,
      message: `Attendance marked successfully! ${isLate ? `You are marked as late (${minutesLate} minutes after class start).` : 'You are present.'}`,
      attendance: {
        id: attendanceRecord.id,
        scanned_at: attendanceRecord.scanned_at,
        status: attendanceRecord.status,
        minutes_late: minutesLate,
        session: {
          id: session.id,
          class_code: session.class_instances.courses.code,
          class_name: session.class_instances.courses.name,
          date: session.date,
          start_time: session.start_time
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Error processing QR scan:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Get attendance records for a student
 * GET /api/attendance/student/:studentId
 */
router.get('/api/attendance/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { sessionId, limit = 50 } = req.query;
    
    let query = supabase
      .from('attendance_records')
      .select(`
        *,
        class_sessions!inner(
          id,
          date,
          start_time,
          end_time,
          room_location,
          class_instances!inner(
            courses(code, name),
            academic_periods(name)
          )
        )
      `)
      .eq('student_id', studentId)
      .order('timestamp', { ascending: false })
      .limit(parseInt(limit));
    
    if (sessionId) {
      query = query.eq('session_id', sessionId);
    }
    
    const { data: attendanceRecords, error } = await query;
    
    if (error) {
      console.error('❌ Error fetching attendance records:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch attendance records'
      });
    }
    
    res.json({
      success: true,
      attendance: attendanceRecords
    });
    
  } catch (error) {
    console.error('❌ Error fetching student attendance:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Get attendance statistics for a student
 * GET /api/attendance/student/:studentId/stats
 */
router.get('/api/attendance/student/:studentId/stats', async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Get all attendance records for the student
    const { data: attendanceRecords, error } = await supabase
      .from('attendance_records')
      .select(`
        *,
        class_sessions!inner(
          class_instance_id,
          class_instances!inner(
            courses(code, name)
          )
        )
      `)
      .eq('student_id', studentId);
    
    if (error) {
      console.error('❌ Error fetching attendance stats:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch attendance statistics'
      });
    }
    
    // Calculate statistics
    const totalSessions = attendanceRecords.length;
    const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
    const lateCount = attendanceRecords.filter(r => r.status === 'late').length;
    const absentCount = totalSessions - presentCount - lateCount;
    const attendanceRate = totalSessions > 0 ? (presentCount + lateCount) / totalSessions * 100 : 0;
    
    // Group by class
    const classStats = {};
    attendanceRecords.forEach(record => {
      const classCode = record.class_sessions.class_instances.courses.code;
      if (!classStats[classCode]) {
        classStats[classCode] = {
          class_code: classCode,
          class_name: record.class_sessions.class_instances.courses.name,
          total_sessions: 0,
          present_count: 0,
          late_count: 0,
          absent_count: 0
        };
      }
      
      classStats[classCode].total_sessions++;
      if (record.status === 'present') classStats[classCode].present_count++;
      else if (record.status === 'late') classStats[classCode].late_count++;
      else classStats[classCode].absent_count++;
    });
    
    res.json({
      success: true,
      stats: {
        total_sessions: totalSessions,
        present_count: presentCount,
        late_count: lateCount,
        absent_count: absentCount,
        attendance_rate: Math.round(attendanceRate * 100) / 100,
        class_breakdown: Object.values(classStats)
      }
    });
    
  } catch (error) {
    console.error('❌ Error calculating attendance stats:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;
