const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server: SocketIOServer } = require('socket.io');

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

  socket.on('join-session', (sessionId) => {
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

// Mock authentication middleware
const authenticateUser = (req, res, next) => {
  // For testing, we'll just set a mock user
  req.user = { id: 'test-user-id', role: 'student' };
  next();
};

// Mock courses endpoint
app.get('/api/courses', authenticateUser, (req, res) => {
  const mockCourses = [
    {
      id: 'course-1',
      course_code: 'CSC-475',
      course_name: 'Seminar in Computer Science',
      professor_id: req.user.id,
      semester: 'Fall',
      year: 2024,
      created_at: new Date().toISOString()
    }
  ];
  
  res.json({
    success: true,
    data: mockCourses
  });
});

// Mock sessions endpoint
app.get('/api/sessions/:courseId', authenticateUser, (req, res) => {
  const mockSessions = [
    {
      id: 'session-1',
      course_id: req.params.courseId,
      session_date: '2024-09-22',
      start_time: '09:00',
      end_time: '10:30',
      qr_code_secret: 'mock-secret',
      qr_code_expires_at: new Date(Date.now() + 30000).toISOString(),
      is_active: true,
      created_at: new Date().toISOString()
    }
  ];
  
  res.json({
    success: true,
    data: mockSessions
  });
});

// Mock QR code endpoint
app.get('/api/sessions/:sessionId/qr', authenticateUser, (req, res) => {
  const mockQR = {
    qr_code: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    expires_at: new Date(Date.now() + 30000).toISOString(),
    session_id: req.params.sessionId
  };
  
  res.json({
    success: true,
    data: mockQR
  });
});

// Mock scan endpoint
app.post('/api/sessions/:sessionId/scan', authenticateUser, (req, res) => {
  const mockAttendance = {
    id: 'attendance-1',
    session_id: req.params.sessionId,
    student_id: req.user.id,
    scanned_at: new Date().toISOString(),
    status: 'present',
    device_fingerprint: 'mock-fingerprint',
    ip_address: req.ip || '127.0.0.1',
    created_at: new Date().toISOString()
  };
  
  // Emit real-time update
  io.to(`session-${req.params.sessionId}`).emit('attendance-update', mockAttendance);
  
  res.json({
    success: true,
    data: mockAttendance,
    message: 'Attendance marked as present'
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
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

module.exports = app;
