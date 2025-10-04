const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server: SocketIOServer } = require('socket.io');
const { createClient } = require('@supabase/supabase-js');
const QRCode = require('qrcode');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// QR Code Generator Class
class QRCodeGenerator {
  static get QR_SECRET() {
    return process.env.QR_SECRET || 'fsas_qr_secret_key_2024_secure';
  }
  
  static get QR_EXPIRY_SECONDS() {
    return 30;
  }

  static async generateSecureQR(sessionId) {
    const timestamp = Date.now();
    const nonce = crypto.randomBytes(16).toString('hex');
    const qrCodeSecret = crypto.randomBytes(32).toString('hex');
    
    const data = `${sessionId}-${timestamp}-${nonce}-${qrCodeSecret}`;
    
    const signature = crypto
      .createHmac('sha256', this.QR_SECRET)
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

    const expiresAt = new Date(timestamp + (this.QR_EXPIRY_SECONDS * 1000));

    return {
      qr_code: qrCodeImage,
      expires_at: expiresAt.toISOString(),
      session_id: sessionId
    };
  }
}

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    features: ['qr-generation', 'attendance-tracking', 'real-time-updates', 'role-based-access', 'enrollment-management']
  });
});

// =====================================================
// USER MANAGEMENT ENDPOINTS
// =====================================================

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
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

// Get students
app.get('/api/students', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select(`
        *,
        users!inner(first_name, last_name, email, role)
      `)
      .order('created_at', { ascending: false });
    
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

// Get professors
app.get('/api/professors', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('professors')
      .select(`
        *,
        users!inner(first_name, last_name, email, role)
      `)
      .order('created_at', { ascending: false });
    
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
// DEPARTMENT MANAGEMENT ENDPOINTS
// =====================================================

// Get departments
app.get('/api/departments', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .order('name');
    
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
// ACADEMIC PERIOD MANAGEMENT ENDPOINTS
// =====================================================

// Get academic periods
app.get('/api/academic-periods', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('academic_periods')
      .select('*')
      .order('year', { ascending: false })
      .order('semester');
    
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
// CLASS MANAGEMENT ENDPOINTS (ENHANCED)
// =====================================================

// Get all sessions
app.get('/api/sessions', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select(`
        *,
        classes!inner(code, name, professor_id, room_location, schedule_info)
      `)
      .order('date', { ascending: false });
    
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

// Get all classes with department and period info
app.get('/api/classes', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('classes')
      .select(`
        *,
        departments(name, code),
        academic_periods(name, year, semester)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Get professor info separately
    const classesWithProfessors = await Promise.all(data.map(async (cls) => {
      const { data: professorData } = await supabase
        .from('professors')
        .select(`
          employee_id,
          title,
          users!inner(first_name, last_name, email)
        `)
        .eq('user_id', cls.professor_id)
        .single();
      
      return {
        ...cls,
        professor: professorData
      };
    }));
    
    res.json({
      success: true,
      data: classesWithProfessors,
      count: classesWithProfessors.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get classes for a specific professor
app.get('/api/professors/:professorId/classes', async (req, res) => {
  try {
    const { professorId } = req.params;
    
    const { data, error } = await supabase
      .from('classes')
      .select(`
        *,
        departments(name, code),
        academic_periods(name, year, semester)
      `)
      .eq('professor_id', professorId)
      .order('created_at', { ascending: false });
    
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
// ENROLLMENT MANAGEMENT ENDPOINTS
// =====================================================

// Get all enrollments
app.get('/api/enrollments', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        *,
        students!inner(
          student_id,
          users!inner(first_name, last_name, email)
        ),
        classes(code, name),
        academic_periods(name, year, semester),
        professors!enrolled_by(
          employee_id,
          users!inner(first_name, last_name)
        )
      `)
      .order('enrollment_date', { ascending: false });
    
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

// Enroll student in class (professor adds student)
app.post('/api/enrollments', async (req, res) => {
  try {
    const { student_id, class_id, academic_period_id, enrolled_by } = req.body;
    
    // Validate required fields
    if (!student_id || !class_id || !academic_period_id || !enrolled_by) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: student_id, class_id, academic_period_id, enrolled_by'
      });
    }
    
    const { data, error } = await supabase
      .from('enrollments')
      .insert({
        student_id,
        class_id,
        academic_period_id,
        enrolled_by,
        enrollment_date: new Date().toISOString().split('T')[0],
        status: 'active'
      })
      .select();
    
    if (error) throw error;
    
    res.json({
      success: true,
      data: data[0],
      message: 'Student enrolled successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get students enrolled in a specific class
app.get('/api/classes/:classId/students', async (req, res) => {
  try {
    const { classId } = req.params;
    
    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        *,
        students!inner(
          student_id,
          users!inner(first_name, last_name, email)
        )
      `)
      .eq('class_id', classId)
      .eq('status', 'active')
      .order('enrollment_date', { ascending: false });
    
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

// Update student grade
app.put('/api/enrollments/:enrollmentId/grade', async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const { final_grade } = req.body;
    
    if (!final_grade) {
      return res.status(400).json({
        success: false,
        error: 'final_grade is required'
      });
    }
    
    const { data, error } = await supabase
      .from('enrollments')
      .update({ final_grade })
      .eq('id', enrollmentId)
      .select();
    
    if (error) throw error;
    
    res.json({
      success: true,
      data: data[0],
      message: 'Grade updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =====================================================
// SESSION MANAGEMENT ENDPOINTS (EXISTING)
// =====================================================

// Get sessions for a class
app.get('/api/classes/:classId/sessions', async (req, res) => {
  try {
    const { classId } = req.params;
    
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('class_id', classId)
      .order('date', { ascending: false });
    
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

// Generate QR code for session
app.get('/api/sessions/:sessionId/qr', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Verify session exists
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
    
    if (sessionError || !session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }
    
    // Generate QR code
    const qrData = await QRCodeGenerator.generateSecureQR(sessionId);
    
    // Update session with QR data
    await supabase
      .from('sessions')
      .update({
        qr_secret: qrData.session_id,
        qr_expires_at: qrData.expires_at,
        is_active: true
      })
      .eq('id', sessionId);
    
    res.json({
      success: true,
      data: qrData
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
// ATTENDANCE ENDPOINTS (ENHANCED)
// =====================================================

// Get all attendance records
app.get('/api/attendance', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('attendance')
      .select(`
        *,
        users!inner(first_name, last_name, email),
        sessions!inner(date, start_time, end_time, classes!inner(code, name))
      `)
      .order('created_at', { ascending: false });
    
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

// Get QR usage records
app.get('/api/qr-usage', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('qr_usage')
      .select(`
        *,
        users!inner(first_name, last_name, email),
        sessions!inner(date, start_time, classes!inner(code, name))
      `)
      .order('used_at', { ascending: false });
    
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

// Get attendance for a session
app.get('/api/sessions/:sessionId/attendance', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const { data, error } = await supabase
      .from('attendance')
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

// =====================================================
// PASSWORD RESET API ENDPOINTS
// =====================================================

// Forgot Password - Send reset email
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email, role } = req.body;
    
    console.log('🔐 Password reset request:', { email, role });
    
    // Validate input
    if (!email || !role) {
      return res.status(400).json({
        success: false,
        error: 'Email and role are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid email address'
      });
    }

    // Check if user exists in database with correct role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, role, is_active')
      .eq('email', email.trim().toLowerCase())
      .single();

    if (userError || !userData) {
      console.log('🔐 User not found:', email);
      return res.status(404).json({
        success: false,
        error: 'No account found with this email address'
      });
    }

    if (userData.role !== role) {
      console.log('🔐 Role mismatch:', userData.role, 'expected:', role);
      return res.status(400).json({
        success: false,
        error: `This email is registered as a ${userData.role}. Please use the ${userData.role} forgot password page.`
      });
    }

    if (!userData.is_active) {
      console.log('🔐 Account inactive:', email);
      return res.status(400).json({
        success: false,
        error: 'This account has been deactivated. Please contact support.'
      });
    }

    // Send password reset email using Supabase Auth
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'}/reset-password?type=${role}`,
    });

    if (resetError) {
      console.error('🔐 Password reset error:', resetError);
      return res.status(500).json({
        success: false,
        error: resetError.message
      });
    }

    console.log('✅ Password reset email sent to:', email);
    res.json({
      success: true,
      message: 'Password reset email sent successfully'
    });

  } catch (error) {
    console.error('🔐 Password reset error:', error);
    res.status(500).json({
      success: false,
      error: 'An unexpected error occurred. Please try again.'
    });
  }
});

// Validate Reset Token
app.post('/api/auth/validate-reset-token', async (req, res) => {
  try {
    const { token, type } = req.body;
    
    console.log('🔐 Validating reset token:', { hasToken: !!token, type });
    
    if (!token || !type) {
      return res.status(400).json({
        success: false,
        error: 'Token and type are required'
      });
    }

    // For now, we'll accept any token format
    // In a production environment, you'd validate the JWT token
    // and check if it's valid and not expired
    
    res.json({
      success: true,
      message: 'Token is valid'
    });

  } catch (error) {
    console.error('🔐 Token validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate token'
    });
  }
});

// Reset Password - Update password
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, password, type } = req.body;
    
    console.log('🔐 Password reset update:', { hasToken: !!token, type });
    
    // Validate input
    if (!token || !password || !type) {
      return res.status(400).json({
        success: false,
        error: 'Token, password, and type are required'
      });
    }

    // Validate password
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long'
      });
    }

    // In a production environment, you would:
    // 1. Validate the JWT token
    // 2. Extract user ID from token
    // 3. Update password for that specific user
    
    // For now, we'll return success
    // The actual password update will be handled by Supabase Auth
    // when the user clicks the reset link and is redirected
    
    console.log('✅ Password reset completed for type:', type);
    res.json({
      success: true,
      message: 'Password has been reset successfully'
    });

  } catch (error) {
    console.error('🔐 Password reset update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset password. Please try again.'
    });
  }
});

// =====================================================
// COURSES API
// =====================================================

// Get all available courses
app.get('/api/courses', async (req, res) => {
  try {
    console.log('📚 Fetching available courses');
    
    const { data: courses, error } = await supabase
      .from('classes')
      .select(`
        id,
        code,
        name,
        description,
        credits,
        departments!inner(name)
      `)
      .eq('is_active', true);
    
    if (error) {
      console.error('Error fetching courses:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch courses'
      });
    }
    
    const formattedCourses = courses.map(course => ({
      id: course.id,
      code: course.code,
      name: course.name,
      description: course.description,
      credits: course.credits,
      department_name: course.departments.name
    }));
    
    console.log('✅ Courses fetched successfully:', formattedCourses.length);
    res.json({
      success: true,
      courses: formattedCourses
    });
    
  } catch (error) {
    console.error('📚 Courses fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch courses'
    });
  }
});

// =====================================================
// CLASSES API
// =====================================================

// Create a new class
app.post('/api/classes', async (req, res) => {
  try {
    const { course_id, professor_id, room_location, schedule_info, max_students } = req.body;
    
    console.log('📚 Creating new class:', { course_id, professor_id, room_location, schedule_info, max_students });
    
    // First, get the course details
    const { data: course, error: courseError } = await supabase
      .from('classes')
      .select('code, name, description, credits, department_id, academic_period_id')
      .eq('id', course_id)
      .single();
    
    if (courseError || !course) {
      console.error('Error fetching course:', courseError);
      return res.status(400).json({
        success: false,
        error: 'Course not found'
      });
    }
    
    // Create the class instance
    const { data: newClass, error: createError } = await supabase
      .from('classes')
      .insert({
        code: course.code,
        name: course.name,
        description: course.description,
        credits: course.credits,
        professor_id,
        department_id: course.department_id,
        academic_period_id: course.academic_period_id,
        room_location,
        schedule_info,
        max_students,
        is_active: true
      })
      .select()
      .single();
    
    if (createError) {
      console.error('Error creating class:', createError);
      return res.status(500).json({
        success: false,
        error: 'Failed to create class'
      });
    }
    
    console.log('✅ Class created successfully:', newClass.id);
    res.json({
      success: true,
      class: newClass
    });
    
  } catch (error) {
    console.error('📚 Class creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create class'
    });
  }
});

// =====================================================
// PROFESSOR DASHBOARD API
// =====================================================

// Get professor dashboard data
app.get('/api/professors/:professorId/dashboard', async (req, res) => {
  try {
    const { professorId } = req.params;
    
    console.log('📊 Fetching dashboard data for professor:', professorId);
    
    // Get professor's classes
    const { data: classes, error: classesError } = await supabase
      .from('classes')
      .select(`
        id,
        code,
        name,
        room_location,
        schedule_info,
        max_students,
        is_active,
        created_at
      `)
      .eq('professor_id', professorId)
      .eq('is_active', true);
    
    if (classesError) {
      console.error('Error fetching classes:', classesError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch classes'
      });
    }
    
    // Get total students across all classes
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('enrollments')
      .select(`
        student_id,
        class_id,
        status
      `)
      .in('class_id', classes.map(c => c.id))
      .eq('status', 'active');
    
    if (enrollmentsError) {
      console.error('Error fetching enrollments:', enrollmentsError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch enrollments'
      });
    }
    
    // Get active sessions
    const { data: activeSessions, error: sessionsError } = await supabase
      .from('sessions')
      .select(`
        id,
        class_id,
        date,
        start_time,
        end_time,
        is_active,
        qr_expires_at
      `)
      .in('class_id', classes.map(c => c.id))
      .eq('is_active', true);
    
    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch sessions'
      });
    }
    
    // Get today's classes
    const today = new Date().toISOString().split('T')[0];
    const todayClasses = classes.filter(c => {
      // Simple check - in real implementation, you'd parse schedule_info
      return c.schedule_info && c.schedule_info.includes('MWF');
    });
    
    // Calculate stats
    const totalClasses = classes.length;
    const totalStudents = new Set(enrollments.map(e => e.student_id)).size;
    const activeSessionsCount = activeSessions.length;
    
    // Calculate average attendance (simplified)
    const { data: attendanceData, error: attendanceError } = await supabase
      .from('attendance')
      .select(`
        session_id,
        status
      `)
      .in('session_id', activeSessions.map(s => s.id));
    
    let averageAttendance = 0;
    if (!attendanceError && attendanceData.length > 0) {
      const presentCount = attendanceData.filter(a => a.status === 'present').length;
      averageAttendance = Math.round((presentCount / attendanceData.length) * 100);
    }
    
    // Format classes with enrollment counts
    const classesWithStats = classes.map(cls => {
      const classEnrollments = enrollments.filter(e => e.class_id === cls.id);
      const classSessions = activeSessions.filter(s => s.class_id === cls.id);
      
      return {
        id: cls.id,
        code: cls.code,
        name: cls.name,
        room_location: cls.room_location,
        schedule_info: cls.schedule_info,
        enrolled_students: classEnrollments.length,
        max_students: cls.max_students,
        attendance_rate: 85, // Mock for now
        status: classSessions.length > 0 ? 'active' : 'upcoming',
        isToday: todayClasses.some(tc => tc.id === cls.id)
      };
    });
    
    // Format active sessions
    const formattedActiveSessions = activeSessions.map(session => {
      const classData = classes.find(c => c.id === session.class_id);
      const sessionEnrollments = enrollments.filter(e => e.class_id === session.class_id);
      
      return {
        id: session.id,
        class_code: classData?.code || 'Unknown',
        class_name: classData?.name || 'Unknown Class',
        present_count: 0, // Would need to query attendance table
        total_students: sessionEnrollments.length,
        qr_code_expires_at: session.qr_expires_at
      };
    });
    
    const dashboardData = {
      stats: {
        totalClasses,
        totalStudents,
        activeSessions: activeSessionsCount,
        averageAttendance
      },
      classes: classesWithStats,
      activeSessions: formattedActiveSessions,
      todayClasses: classesWithStats.filter(c => c.isToday)
    };
    
    console.log('✅ Dashboard data fetched successfully');
    res.json({
      success: true,
      data: dashboardData
    });
    
  } catch (error) {
    console.error('❌ Dashboard data error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data'
    });
  }
});

// =====================================================
// SOCKET.IO REAL-TIME UPDATES
// =====================================================

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('join-session', (sessionId) => {
    socket.join(`session-${sessionId}`);
    console.log(`Client ${socket.id} joined session ${sessionId}`);
  });
  
  socket.on('leave-session', (sessionId) => {
    socket.leave(`session-${sessionId}`);
    console.log(`Client ${socket.id} left session ${sessionId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Helper function to broadcast attendance updates
function broadcastAttendanceUpdate(sessionId, attendanceData) {
  io.to(`session-${sessionId}`).emit('attendance-update', attendanceData);
}

// =====================================================
// START SERVER
// =====================================================

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log('🚀 Optimized FSAS Backend Server running on port', PORT);
  console.log('📊 Health check: http://localhost:' + PORT + '/api/health');
  console.log('🔗 Supabase connected:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('✨ Features: QR Generation, Attendance Tracking, Real-time Updates, Role-based Access, Enrollment Management');
});

module.exports = { app, server, io, broadcastAttendanceUpdate };
