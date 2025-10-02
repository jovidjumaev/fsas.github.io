import * as express from 'express';
import * as cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { DatabaseService } from '../src/lib/supabase';
import { QRCodeGenerator } from '../src/lib/qr-generator';
import { generateDeviceFingerprint, hashDeviceFingerprint } from '../src/lib/device-fingerprint';
import { validateQRMiddleware } from '../src/lib/qr-generator';
import { ApiResponse, QRCodeData, AttendanceRecord, ClassSession } from '../src/types';

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.API_PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-session', (sessionId: string) => {
    socket.join(`session-${sessionId}`);
    console.log(`Client ${socket.id} joined session ${sessionId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Authentication middleware
const authenticateUser = async (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    // In a real implementation, you would verify the JWT token here
    // For now, we'll assume the token is valid and extract user info
    req.user = { id: 'user-id', role: 'student' }; // Placeholder
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

// Courses endpoints
app.get('/api/courses', authenticateUser, async (req, res) => {
  try {
    const courses = await DatabaseService.getCourses(req.user.id);
    const response: ApiResponse = {
      success: true,
      data: courses
    };
    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch courses'
    });
  }
});

app.post('/api/courses', authenticateUser, async (req, res) => {
  try {
    const course = await DatabaseService.createCourse({
      ...req.body,
      professor_id: req.user.id
    });
    const response: ApiResponse = {
      success: true,
      data: course
    };
    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create course'
    });
  }
});

// Sessions endpoints
app.get('/api/sessions/:courseId', authenticateUser, async (req, res) => {
  try {
    const sessions = await DatabaseService.getSessions(req.params.courseId);
    const response: ApiResponse = {
      success: true,
      data: sessions
    };
    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sessions'
    });
  }
});

app.post('/api/sessions', authenticateUser, async (req, res) => {
  try {
    const { course_id, session_date, start_time, end_time } = req.body;
    
    // Generate QR code
    const qrResponse = await QRCodeGenerator.generateSecureQR(course_id);
    
    const session = await DatabaseService.createSession({
      course_id,
      session_date,
      start_time,
      end_time,
      qr_code_secret: qrResponse.session_id, // In real implementation, use actual secret
      qr_code_expires_at: qrResponse.expires_at
    });

    const response: ApiResponse = {
      success: true,
      data: { session, qr_code: qrResponse }
    };
    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create session'
    });
  }
});

// QR Code endpoints
app.get('/api/sessions/:sessionId/qr', authenticateUser, async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    const qrResponse = await QRCodeGenerator.generateSecureQR(sessionId);
    
    const response: ApiResponse = {
      success: true,
      data: qrResponse
    };
    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate QR code'
    });
  }
});

// QR Code refresh endpoint
app.post('/api/sessions/:sessionId/qr/refresh', authenticateUser, async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    const qrResponse = await QRCodeGenerator.refreshQR(sessionId);
    
    // Emit to all clients in the session
    io.to(`session-${sessionId}`).emit('qr-refresh', qrResponse);
    
    const response: ApiResponse = {
      success: true,
      data: qrResponse
    };
    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to refresh QR code'
    });
  }
});

// QR Code scanning endpoint
app.post('/api/sessions/:sessionId/scan', authenticateUser, async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    const { qr_data, location } = req.body;
    const studentId = req.user.id;

    // Validate QR code
    const validation = validateQRMiddleware(qr_data);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: validation.error
      });
    }

    // Check if student already scanned
    const existingAttendance = await DatabaseService.checkExistingAttendance(sessionId, studentId);
    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        error: 'You have already marked attendance for this session'
      });
    }

    // Generate device fingerprint
    const deviceFingerprint = generateDeviceFingerprint();
    const fingerprintHash = hashDeviceFingerprint(deviceFingerprint);

    // Determine attendance status based on time
    const now = new Date();
    const session = await DatabaseService.getActiveSession(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found or not active'
      });
    }

    const sessionStart = new Date(`${session.session_date}T${session.start_time}`);
    const isLate = now > new Date(sessionStart.getTime() + 15 * 60 * 1000); // 15 minutes late

    // Record attendance
    const attendance = await DatabaseService.recordAttendance({
      session_id: sessionId,
      student_id: studentId,
      scanned_at: now.toISOString(),
      status: isLate ? 'late' : 'present',
      device_fingerprint: fingerprintHash,
      ip_address: req.ip || 'unknown'
    });

    // Track QR usage
    await DatabaseService.trackQRUsage({
      session_id: sessionId,
      qr_code_secret: validation.data!.signature,
      used_by: studentId,
      used_at: now.toISOString(),
      device_fingerprint: fingerprintHash
    });

    // Emit real-time update
    io.to(`session-${sessionId}`).emit('attendance-update', attendance);

    const response: ApiResponse = {
      success: true,
      data: attendance,
      message: `Attendance marked as ${isLate ? 'late' : 'present'}`
    };
    res.json(response);
  } catch (error) {
    console.error('Scan error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process QR scan'
    });
  }
});

// Attendance records endpoint
app.get('/api/sessions/:sessionId/attendance', authenticateUser, async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    const records = await DatabaseService.getAttendanceRecords(sessionId);
    
    const response: ApiResponse = {
      success: true,
      data: records
    };
    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch attendance records'
    });
  }
});

// Analytics endpoint
app.get('/api/analytics/:courseId', authenticateUser, async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const { start_date, end_date } = req.query;
    
    const analytics = await DatabaseService.getAttendanceAnalytics(
      courseId,
      start_date as string,
      end_date as string
    );
    
    const response: ApiResponse = {
      success: true,
      data: analytics
    };
    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics'
    });
  }
});

// Export endpoint
app.get('/api/sessions/:sessionId/export', authenticateUser, async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    const format = req.query.format || 'csv';
    
    const records = await DatabaseService.getAttendanceRecords(sessionId);
    
    if (format === 'csv') {
      const csv = convertToCSV(records);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="attendance-${sessionId}.csv"`);
      res.send(csv);
    } else {
      const response: ApiResponse = {
        success: true,
        data: records
      };
      res.json(response);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to export data'
    });
  }
});

// Helper function to convert data to CSV
function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
  ].join('\n');
  
  return csvContent;
}

// Error handling middleware
app.use((error: any, req: any, res: any, next: any) => {
  console.error('Error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 FSAS Backend Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});

export default app;
