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
