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
    origin: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.API_PORT || 3001;

// Initialize Supabase client
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
      color: { dark: '#000000', light: '#FFFFFF' },
      width: 256
    });

    const expiresAt = new Date(timestamp + (this.QR_EXPIRY_SECONDS * 1000));

    return {
      qr_code: qrCodeImage,
      expires_at: expiresAt.toISOString(),
      session_id: sessionId,
      qr_data: qrData
    };
  }

  static validateQR(qrData) {
    try {
      const now = Date.now();
      const qrAge = now - qrData.timestamp;
      const maxAge = this.QR_EXPIRY_SECONDS * 1000;

      if (qrAge > maxAge) {
        return { isValid: false, error: 'QR code has expired' };
      }

      const data = `${qrData.sessionId}-${qrData.timestamp}-${qrData.nonce}`;
      const expectedSignature = crypto
        .createHmac('sha256', this.QR_SECRET)
        .update(data)
        .digest('hex');

      if (expectedSignature !== qrData.signature) {
        return { isValid: false, error: 'Invalid QR code signature' };
      }

      return { isValid: true };
    } catch (error) {
      return { isValid: false, error: 'Invalid QR code format' };
    }
  }
}

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
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
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

// ==============================================
// API ROUTES
// ==============================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    features: ['qr-generation', 'attendance-tracking', 'real-time-updates']
  });
});

// Get all classes (courses)
app.get('/api/classes', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: data || [],
      count: data?.length || 0
    });
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch classes'
    });
  }
});

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
      data: data || [],
      count: data?.length || 0
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sessions'
    });
  }
});

// Generate QR code for a session
app.get('/api/sessions/:sessionId/qr', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Generate secure QR code
    const qrResult = await QRCodeGenerator.generateSecureQR(sessionId);
    
    // Update session with new QR secret
    const { error } = await supabase
      .from('sessions')
      .update({
        qr_secret: qrResult.qr_data.nonce,
        qr_expires_at: qrResult.expires_at
      })
      .eq('id', sessionId);

    if (error) throw error;

    res.json({
      success: true,
      data: {
        qr_code: qrResult.qr_code,
        expires_at: qrResult.expires_at,
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

// Scan QR code and mark attendance
app.post('/api/sessions/:sessionId/scan', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { qrData, studentId, deviceFingerprint } = req.body;

    // Validate QR code
    const validation = QRCodeGenerator.validateQR(qrData);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: validation.error
      });
    }

    // Check if session exists and is active
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('is_active', true)
      .single();

    if (sessionError || !session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found or inactive'
      });
    }

    // Check if student already attended
    const { data: existingAttendance } = await supabase
      .from('attendance')
      .select('id')
      .eq('session_id', sessionId)
      .eq('student_id', studentId)
      .single();

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        error: 'Attendance already marked for this session'
      });
    }

    // Create attendance record
    const { data: attendance, error: attendanceError } = await supabase
      .from('attendance')
      .insert({
        session_id: sessionId,
        student_id: studentId,
        scanned_at: new Date().toISOString(),
        status: 'present',
        device_fingerprint: deviceFingerprint,
        ip_address: req.ip || '127.0.0.1'
      })
      .select()
      .single();

    if (attendanceError) throw attendanceError;

    // Record QR usage
    await supabase
      .from('qr_usage')
      .insert({
        session_id: sessionId,
        qr_secret: qrData.nonce,
        used_by: studentId,
        used_at: new Date().toISOString(),
        device_fingerprint: deviceFingerprint
      });

    // Emit real-time update
    io.to(`session-${sessionId}`).emit('attendance-update', attendance);

    res.json({
      success: true,
      data: attendance,
      message: 'Attendance marked successfully'
    });
  } catch (error) {
    console.error('Error scanning QR code:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process attendance'
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
        users:student_id (
          first_name,
          last_name,
          student_id
        )
      `)
      .eq('session_id', sessionId)
      .order('scanned_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: data || [],
      count: data?.length || 0
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch attendance'
    });
  }
});

// Create a new session
app.post('/api/classes/:classId/sessions', async (req, res) => {
  try {
    const { classId } = req.params;
    const { date, start_time, end_time } = req.body;

    // Generate QR secret
    const qrSecret = crypto.randomBytes(32).toString('hex');
    const qrExpiresAt = new Date(Date.now() + 30 * 1000); // 30 seconds

    const { data: session, error } = await supabase
      .from('sessions')
      .insert({
        class_id: classId,
        date,
        start_time,
        end_time,
        qr_secret: qrSecret,
        qr_expires_at: qrExpiresAt.toISOString(),
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: session,
      message: 'Session created successfully'
    });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create session'
    });
  }
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
  console.log(`🚀 Enhanced FSAS Backend Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔗 Supabase connected: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Yes' : 'No'}`);
});

module.exports = app;
