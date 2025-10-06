// =====================================================
// OPTIMIZED CLASS MANAGEMENT API ENDPOINTS
// =====================================================
// This file contains API endpoints optimized for the new database schema

const express = require('express');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const router = express.Router();

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// =====================================================
// COURSE MANAGEMENT ENDPOINTS
// =====================================================

// Get all courses (master catalog)
router.get('/api/courses', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('is_active', true)
      .order('code');
    
    if (error) throw error;
    
    res.json({
      success: true,
      data,
      count: data.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create a new course
router.post('/api/courses', async (req, res) => {
  try {
    const { code, name, description, credits, department_id } = req.body;
    
    const { data, error } = await supabase
      .from('courses')
      .insert({
        code,
        name,
        description,
        credits: credits || 3,
        department_id
      })
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({
      success: true,
      course: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =====================================================
// CLASS INSTANCE MANAGEMENT ENDPOINTS
// =====================================================

// Get class instances for a professor
router.get('/api/professors/:professorId/class-instances', async (req, res) => {
  try {
    const { professorId } = req.params;
    const { period_id } = req.query;
    
    let query = supabase
      .from('class_instances')
      .select(`
        *,
        courses(code, name, description, credits),
        academic_periods(name, year, semester),
        departments(name, code)
      `)
      .eq('professor_id', professorId)
      .eq('is_active', true);
    
    if (period_id) {
      query = query.eq('academic_period_id', period_id);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Get enrollment counts
    const classInstancesWithEnrollments = await Promise.all(
      data.map(async (instance) => {
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('id')
          .eq('class_instance_id', instance.id)
          .eq('status', 'active');
        
        return {
          ...instance,
          current_enrollment: enrollments.length,
          capacity_percentage: instance.max_students > 0 
            ? Math.round((enrollments.length / instance.max_students) * 100) 
            : 0
        };
      })
    );
    
    res.json({
      success: true,
      data: classInstancesWithEnrollments,
      count: classInstancesWithEnrollments.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create a new class instance
router.post('/api/class-instances', async (req, res) => {
  try {
    const { 
      course_id, 
      professor_id, 
      academic_period_id, 
      room_location, 
      schedule_info, 
      max_students 
    } = req.body;
    
    const { data, error } = await supabase
      .from('class_instances')
      .insert({
        course_id,
        professor_id,
        academic_period_id,
        room_location,
        schedule_info,
        max_students: max_students || 30,
        is_published: true
      })
      .select(`
        *,
        courses(code, name, description, credits),
        academic_periods(name, year, semester)
      `)
      .single();
    
    if (error) throw error;
    
    res.json({
      success: true,
      class_instance: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get specific class instance details
router.get('/api/class-instances/:instanceId', async (req, res) => {
  try {
    const { instanceId } = req.params;
    
    const { data, error } = await supabase
      .from('class_instances')
      .select(`
        *,
        courses(code, name, description, credits),
        academic_periods(name, year, semester),
        departments(name, code)
      `)
      .eq('id', instanceId)
      .single();
    
    if (error) throw error;
    
    // Get enrollment details
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select(`
        *,
        students!inner(
          student_id,
          users!inner(first_name, last_name, email)
        )
      `)
      .eq('class_instance_id', instanceId)
      .eq('status', 'active');
    
    res.json({
      success: true,
      class_instance: {
        ...data,
        enrollments: enrollments || []
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =====================================================
// SESSION MANAGEMENT ENDPOINTS
// =====================================================

// Get sessions for a class instance
router.get('/api/class-instances/:instanceId/sessions', async (req, res) => {
  try {
    const { instanceId } = req.params;
    
    // Get sessions
    const { data: sessions, error } = await supabase
      .from('class_sessions')
      .select('*')
      .eq('class_instance_id', instanceId)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });
    
    if (error) throw error;
    
    // Get enrolled students count for this class
    const { data: enrollments, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('id')
      .eq('class_instance_id', instanceId)
      .eq('status', 'active');
    
    if (enrollmentError) {
      console.error('Error fetching enrollments:', enrollmentError);
    }
    
    const totalEnrolled = enrollments?.length || 0;
    
    // Calculate attendance counts for each session
    const sessionsWithAttendance = await Promise.all(
      sessions.map(async (session) => {
        // Get attendance records for this session
        const { data: attendanceRecords, error: attendanceError } = await supabase
          .from('attendance_records')
          .select('status')
          .eq('session_id', session.id);
        
        if (attendanceError) {
          console.error('Error fetching attendance records for session', session.id, attendanceError);
        }
        
        // Count attended students (present + late + excused)
        const attendedCount = attendanceRecords ? 
          attendanceRecords.filter(a => ['present', 'late', 'excused'].includes(a.status)).length : 0;
        
        return {
          ...session,
          attendance_count: attendedCount,
          total_enrolled: totalEnrolled
        };
      })
    );
    
    res.json({
      success: true,
      data: sessionsWithAttendance,
      count: sessionsWithAttendance.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create a new session
router.post('/api/class-instances/:instanceId/sessions', async (req, res) => {
  try {
    const { instanceId } = req.params;
    const { date, start_time, end_time, room_location, notes } = req.body;
    
    // Get next session number
    const { data: lastSession } = await supabase
      .from('class_sessions')
      .select('session_number')
      .eq('class_instance_id', instanceId)
      .order('session_number', { ascending: false })
      .limit(1)
      .single();
    
    const nextSessionNumber = (lastSession?.session_number || 0) + 1;
    
    const { data, error } = await supabase
      .from('class_sessions')
      .insert({
        class_instance_id: instanceId,
        session_number: nextSessionNumber,
        date,
        start_time,
        end_time,
        room_location,
        notes,
        status: 'scheduled'
      })
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({
      success: true,
      session: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Generate QR code for session
router.get('/api/sessions/:sessionId/qr', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Verify session exists
    const { data: session, error: sessionError } = await supabase
      .from('class_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
    
    if (sessionError || !session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }
    
    // Generate QR code (using your existing QRCodeGenerator)
    const QRCode = require('qrcode');
    const crypto = require('crypto');
    
    const timestamp = Date.now();
    const nonce = crypto.randomBytes(16).toString('hex');
    const qrCodeSecret = crypto.randomBytes(32).toString('hex');
    
    const data = `${sessionId}-${timestamp}-${nonce}-${qrCodeSecret}`;
    const signature = crypto
      .createHmac('sha256', process.env.QR_SECRET || 'fsas_qr_secret_key_2024_secure')
      .update(data)
      .digest('hex');

    const qrData = {
      sessionId,
      timestamp,
      nonce,
      signature
    };

    const qrCodeImage = await QRCode.toDataURL(JSON.stringify(qrData), {
      errorCorrectionLevel: 'M',
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 256
    });

    const expiresAt = new Date(timestamp + (30 * 1000)); // 30 seconds

    // Update session with QR data
    await supabase
      .from('class_sessions')
      .update({
        qr_secret: qrCodeSecret,
        qr_expires_at: expiresAt.toISOString(),
        is_active: true,
        status: 'active'
      })
      .eq('id', sessionId);
    
    res.json({
      success: true,
      data: {
        qr_code: qrCodeImage,
        expires_at: expiresAt.toISOString(),
        session_id: sessionId
      }
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate QR code'
    });
  }
});

// =====================================================
// ATTENDANCE MANAGEMENT ENDPOINTS
// =====================================================

// Get attendance for a session
router.get('/api/sessions/:sessionId/attendance', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const { data, error } = await supabase
      .from('attendance_records')
      .select(`
        *,
        students!inner(
          student_id,
          users!inner(first_name, last_name, email)
        )
      `)
      .eq('session_id', sessionId)
      .order('scanned_at', { ascending: false });
    
    if (error) throw error;
    
    res.json({
      success: true,
      data,
      count: data.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Record attendance
router.post('/api/sessions/:sessionId/attendance', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { student_id, device_fingerprint, ip_address, qr_secret_used } = req.body;
    
    // Verify session is active
    const { data: session, error: sessionError } = await supabase
      .from('class_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('is_active', true)
      .single();
    
    if (sessionError || !session) {
      return res.status(400).json({
        success: false,
        error: 'Session is not active or not found'
      });
    }
    
    // Calculate status and minutes late based on class start time
    // Note: This is based on the scheduled class start time, NOT when the professor started the session
    const sessionStart = new Date(`${session.date}T${session.start_time}`);
    const now = new Date();
    const minutesLate = Math.max(0, Math.floor((now - sessionStart) / (1000 * 60)));
    
    let status = 'present';
    if (minutesLate > 5) {
      status = 'late';
    }
    
    const { data, error } = await supabase
      .from('attendance_records')
      .insert({
        session_id: sessionId,
        student_id,
        status: status,
        minutes_late: minutesLate,
        device_fingerprint,
        ip_address,
        qr_secret_used
      })
      .select(`
        *,
        students!inner(
          student_id,
          users!inner(first_name, last_name, email)
        )
      `)
      .single();
    
    if (error) throw error;
    
    res.json({
      success: true,
      attendance_record: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =====================================================
// ENROLLMENT MANAGEMENT ENDPOINTS
// =====================================================

// Enroll students in a class instance
router.post('/api/class-instances/:instanceId/enroll', async (req, res) => {
  try {
    const { instanceId } = req.params;
    const { student_ids, enrolled_by } = req.body;
    
    if (!Array.isArray(student_ids) || student_ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Student IDs array is required'
      });
    }
    
    // Check if class instance exists and has capacity
    const { data: classInstance, error: classError } = await supabase
      .from('class_instances')
      .select('max_students, current_enrollment')
      .eq('id', instanceId)
      .single();
    
    if (classError || !classInstance) {
      return res.status(404).json({
        success: false,
        error: 'Class instance not found'
      });
    }
    
    if (classInstance.current_enrollment + student_ids.length > classInstance.max_students) {
      return res.status(400).json({
        success: false,
        error: 'Not enough capacity for all students'
      });
    }
    
    // Create enrollment records
    const enrollmentData = student_ids.map(student_id => ({
      student_id,
      class_instance_id: instanceId,
      enrolled_by,
      status: 'active'
    }));
    
    const { data, error } = await supabase
      .from('enrollments')
      .insert(enrollmentData)
      .select(`
        *,
        students!inner(
          student_id,
          users!inner(first_name, last_name, email)
        )
      `);
    
    if (error) throw error;
    
    res.json({
      success: true,
      enrollments: data,
      count: data.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Unenroll student from class instance
router.post('/api/class-instances/:instanceId/unenroll', async (req, res) => {
  try {
    const { instanceId } = req.params;
    const { student_id } = req.body;
    
    const { data, error } = await supabase
      .from('enrollments')
      .update({ status: 'dropped' })
      .eq('class_instance_id', instanceId)
      .eq('student_id', student_id)
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({
      success: true,
      enrollment: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =====================================================
// ANALYTICS AND REPORTING ENDPOINTS
// =====================================================

// Get attendance summary for a class instance
router.get('/api/class-instances/:instanceId/attendance-summary', async (req, res) => {
  try {
    const { instanceId } = req.params;
    
    // Get attendance summary from materialized view
    const { data, error } = await supabase
      .from('attendance_summary')
      .select('*')
      .eq('class_instance_id', instanceId)
      .single();
    
    if (error) throw error;
    
    res.json({
      success: true,
      summary: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get student attendance history
router.get('/api/students/:studentId/attendance-history', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { class_instance_id, period_id } = req.query;
    
    let query = supabase
      .from('attendance_records')
      .select(`
        *,
        class_sessions!inner(
          session_number,
          date,
          start_time,
          end_time,
          class_instances!inner(
            courses(code, name),
            academic_periods(name, year, semester)
          )
        )
      `)
      .eq('student_id', studentId);
    
    if (class_instance_id) {
      query = query.eq('class_sessions.class_instance_id', class_instance_id);
    }
    
    if (period_id) {
      query = query.eq('class_sessions.class_instances.academic_period_id', period_id);
    }
    
    const { data, error } = await query.order('class_sessions.date', { ascending: false });
    
    if (error) throw error;
    
    res.json({
      success: true,
      data,
      count: data.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =====================================================
// UTILITY ENDPOINTS
// =====================================================

// Refresh materialized view
router.post('/api/refresh-attendance-summary', async (req, res) => {
  try {
    const { data, error } = await supabase
      .rpc('refresh_attendance_summary');
    
    if (error) throw error;
    
    res.json({
      success: true,
      message: 'Attendance summary refreshed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
